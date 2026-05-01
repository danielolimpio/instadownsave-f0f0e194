// Instagram Downloader - Embed-only strategy (zero external APIs)
// Uses Instagram's public /embed/ endpoint + GraphQL fallback (no auth needed)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type MediaType = 'video' | 'image';
type ResourceType = 'p' | 'reel' | 'tv' | 'stories';

interface MediaItem {
  url: string;
  type: MediaType;
  thumbnail?: string;
  filename: string;
}

interface InstagramTarget {
  canonicalUrl: string;
  shortcode: string;
  resourceType: ResourceType;
  storyOwner?: string;
}

interface InstagramMediaResult {
  shortcode: string;
  resourceType: ResourceType;
  type: MediaType | 'carousel';
  items: MediaItem[];
  thumbnail?: string;
  username?: string;
  caption?: string;
}

// Mobile user-agent works better with embed endpoint
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"');
}

function sanitizeMediaUrl(value: unknown): string | undefined {
  const raw = sanitizeText(value);
  if (!raw) return undefined;
  const cleaned = decodeHtmlEntities(raw);
  return /^https?:\/\//i.test(cleaned) ? cleaned : undefined;
}

function buildFilename(type: MediaType, shortcode: string, index: number, url: string): string {
  const imageExt = url.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1]?.toLowerCase() ?? 'jpg';
  const normalized = imageExt === 'jpeg' ? 'jpg' : imageExt;
  const ext = type === 'video' ? 'mp4' : normalized;
  return `instagram_${type}_${shortcode}_${index + 1}.${ext}`;
}

function extractInstagramTarget(rawUrl: string): InstagramTarget | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.endsWith('instagram.com')) return null;

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (!segments.length) return null;
    const root = segments[0].toLowerCase();

    if ((root === 'reel' || root === 'reels') && segments[1]) {
      return { canonicalUrl: `https://www.instagram.com/reel/${segments[1]}/`, shortcode: segments[1], resourceType: 'reel' };
    }
    if (root === 'p' && segments[1]) {
      return { canonicalUrl: `https://www.instagram.com/p/${segments[1]}/`, shortcode: segments[1], resourceType: 'p' };
    }
    if (root === 'tv' && segments[1]) {
      return { canonicalUrl: `https://www.instagram.com/tv/${segments[1]}/`, shortcode: segments[1], resourceType: 'tv' };
    }
    if (root === 'stories' && segments[1] && segments[2]) {
      return {
        canonicalUrl: `https://www.instagram.com/stories/${segments[1]}/${segments[2]}/`,
        shortcode: segments[2],
        resourceType: 'stories',
        storyOwner: segments[1],
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// STRATEGY 1: Instagram embed page (public, no auth)
// URL: https://www.instagram.com/p/{shortcode}/embed/captioned/
// Returns HTML containing video_url / display_url in JSON blob
// ============================================================
async function fetchViaEmbed(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  if (target.resourceType === 'stories') return null; // stories require login

  const paths = target.resourceType === 'reel'
    ? [`reel/${target.shortcode}`, `p/${target.shortcode}`]
    : target.resourceType === 'tv'
    ? [`tv/${target.shortcode}`, `p/${target.shortcode}`]
    : [`p/${target.shortcode}`];

  for (const path of paths) {
    const embedUrl = `https://www.instagram.com/${path}/embed/captioned/`;
    try {
      const res = await fetchWithTimeout(embedUrl, {
        headers: {
          'User-Agent': MOBILE_UA,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!res.ok) {
        console.log(`[embed] ${path} -> HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const result = parseEmbedHtml(html, target);
      if (result) {
        console.log(`[embed] success for ${path}: ${result.items.length} item(s)`);
        return result;
      }
      console.log(`[embed] ${path} -> no media parsed`);
    } catch (err) {
      console.log(`[embed] ${path} -> error`, err);
    }
  }
  return null;
}

function parseEmbedHtml(html: string, target: InstagramTarget): InstagramMediaResult | null {
  const items: MediaItem[] = [];
  const seen = new Set<string>();

  // Try to find embedded JSON in window.__additionalDataLoaded or similar
  const jsonMatches = [
    ...html.matchAll(/"video_url":"([^"]+)"/g),
    ...html.matchAll(/"video_versions":\s*\[\s*{[^}]*"url":"([^"]+)"/g),
  ];
  const imageMatches = [
    ...html.matchAll(/"display_url":"([^"]+)"/g),
    ...html.matchAll(/"image_versions2":\s*{\s*"candidates":\s*\[\s*{[^}]*"url":"([^"]+)"/g),
  ];

  // Parse <img class="EmbeddedMediaImage"> as fallback
  const imgTagMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i)
    ?? html.match(/<img[^>]+class="[^"]*EmbeddedMedia[^"]*"[^>]+src="([^"]+)"/i);

  // Parse <video src="...">
  const videoTagMatches = [...html.matchAll(/<video[^>]+src="([^"]+)"/gi)];

  // Username/caption
  const username = sanitizeText(html.match(/"username":"([^"]+)"/)?.[1])
    ?? sanitizeText(html.match(/UsernameText[^>]*>([^<]+)</)?.[1]);

  const caption = sanitizeText(html.match(/"caption":"([^"]+)"/)?.[1]);

  // Collect videos first
  for (const m of jsonMatches) {
    const url = sanitizeMediaUrl(m[1]);
    if (url && !seen.has(url)) {
      seen.add(url);
      items.push({
        url,
        type: 'video',
        filename: buildFilename('video', target.shortcode, items.length, url),
      });
    }
  }
  for (const m of videoTagMatches) {
    const url = sanitizeMediaUrl(m[1]);
    if (url && !seen.has(url)) {
      seen.add(url);
      items.push({
        url,
        type: 'video',
        filename: buildFilename('video', target.shortcode, items.length, url),
      });
    }
  }

  // Collect images (only if no video found, OR for carousels)
  if (items.length === 0) {
    for (const m of imageMatches) {
      const url = sanitizeMediaUrl(m[1]);
      if (url && !seen.has(url)) {
        seen.add(url);
        items.push({
          url,
          type: 'image',
          thumbnail: url,
          filename: buildFilename('image', target.shortcode, items.length, url),
        });
      }
    }

    if (items.length === 0 && imgTagMatch) {
      const url = sanitizeMediaUrl(imgTagMatch[1]);
      if (url) {
        items.push({
          url,
          type: 'image',
          thumbnail: url,
          filename: buildFilename('image', target.shortcode, 0, url),
        });
      }
    }
  }

  if (!items.length) return null;

  // Set thumbnail for videos
  const firstImage = imageMatches[0]?.[1] ? sanitizeMediaUrl(imageMatches[0][1]) : undefined;
  for (const item of items) {
    if (item.type === 'video' && !item.thumbnail) {
      item.thumbnail = firstImage;
    }
  }

  return {
    shortcode: target.shortcode,
    resourceType: target.resourceType,
    type: items.length > 1 ? 'carousel' : items[0].type,
    items,
    thumbnail: firstImage ?? items[0].thumbnail,
    username,
    caption,
  };
}

// ============================================================
// STRATEGY 2: Public GraphQL endpoint (no auth, fallback)
// Some posts (carousels, certain reels) work better here
// ============================================================
async function fetchViaGraphQL(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  if (target.resourceType === 'stories') return null;

  const url = `https://www.instagram.com/api/v1/media/shortcode/${target.shortcode}/`;
  // Note: this often requires X-IG-App-ID; we try the web profile endpoint instead.

  // Use the documented "?__a=1&__d=dis" trick (works intermittently on /p/{code}/)
  const tryUrl = `https://www.instagram.com/p/${target.shortcode}/?__a=1&__d=dis`;
  try {
    const res = await fetchWithTimeout(tryUrl, {
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept': 'application/json,text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!res.ok) {
      console.log(`[graphql] HTTP ${res.status}`);
      return null;
    }

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return null; }

    const media = data?.items?.[0] ?? data?.graphql?.shortcode_media;
    if (!media) return null;

    return parseGraphQLMedia(media, target);
  } catch (err) {
    console.log('[graphql] error', err);
    return null;
  }
}

function parseGraphQLMedia(media: any, target: InstagramTarget): InstagramMediaResult | null {
  const items: MediaItem[] = [];
  const seen = new Set<string>();

  const append = (node: any) => {
    const videoUrl = sanitizeMediaUrl(node?.video_versions?.[0]?.url ?? node?.video_url);
    const imageUrl = sanitizeMediaUrl(
      node?.image_versions2?.candidates?.[0]?.url ?? node?.display_url ?? node?.thumbnail_src,
    );
    if (videoUrl && !seen.has(videoUrl)) {
      seen.add(videoUrl);
      items.push({
        url: videoUrl,
        type: 'video',
        thumbnail: imageUrl,
        filename: buildFilename('video', target.shortcode, items.length, videoUrl),
      });
    } else if (imageUrl && !seen.has(imageUrl)) {
      seen.add(imageUrl);
      items.push({
        url: imageUrl,
        type: 'image',
        thumbnail: imageUrl,
        filename: buildFilename('image', target.shortcode, items.length, imageUrl),
      });
    }
  };

  const carousel = media?.carousel_media ?? media?.edge_sidecar_to_children?.edges;
  if (Array.isArray(carousel)) {
    for (const child of carousel) {
      append(child?.node ?? child);
    }
  } else {
    append(media);
  }

  if (!items.length) return null;

  return {
    shortcode: target.shortcode,
    resourceType: target.resourceType,
    type: items.length > 1 ? 'carousel' : items[0].type,
    items,
    thumbnail: items[0].thumbnail,
    username: sanitizeText(media?.user?.username ?? media?.owner?.username),
    caption: sanitizeText(media?.caption?.text ?? media?.edge_media_to_caption?.edges?.[0]?.node?.text),
  };
}

// ============================================================
// Main handler
// ============================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = sanitizeText(body?.url);

    if (!rawUrl) {
      return jsonResponse({ success: false, error: 'URL é obrigatória.' }, 400);
    }

    const target = extractInstagramTarget(rawUrl);
    if (!target) {
      return jsonResponse({ success: false, error: 'Link do Instagram inválido.' }, 400);
    }

    if (target.resourceType === 'stories') {
      return jsonResponse({
        success: false,
        error: 'Stories exigem login no Instagram e não são suportados neste método gratuito.',
      }, 400);
    }

    console.log(`[start] ${target.resourceType}/${target.shortcode}`);

    // Try embed first (best for public posts/reels)
    let result = await fetchViaEmbed(target);

    // Fallback to GraphQL if embed didn't return media
    if (!result) {
      console.log('[fallback] trying graphql endpoint');
      result = await fetchViaGraphQL(target);
    }

    if (!result || !result.items.length) {
      return jsonResponse({
        success: false,
        error: 'Não foi possível extrair a mídia. O post pode ser privado, ter sido removido, ou estar temporariamente indisponível.',
      }, 404);
    }

    console.log(`[done] returning ${result.items.length} item(s)`);
    return jsonResponse({ success: true, ...result });
  } catch (err) {
    console.error('[fatal]', err);
    return jsonResponse({
      success: false,
      error: err instanceof Error ? err.message : 'Erro inesperado ao processar o link.',
    }, 500);
  }
});
