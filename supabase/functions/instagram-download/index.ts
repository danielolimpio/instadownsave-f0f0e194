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

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://www.instagram.com/',
  'Origin': 'https://www.instagram.com',
  'X-IG-App-ID': '1217981644879628',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function sanitizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sanitizeMediaUrl(value: unknown): string | undefined {
  const raw = sanitizeText(value);
  if (!raw) return undefined;

  const cleaned = raw
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');

  return /^https?:\/\//i.test(cleaned) ? cleaned : undefined;
}

function buildFilename(type: MediaType, shortcode: string, index: number, url: string): string {
  const imageExtension = url.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1]?.toLowerCase() ?? 'jpg';
  const normalizedImageExtension = imageExtension === 'jpeg' ? 'jpg' : imageExtension;
  const extension = type === 'video' ? 'mp4' : normalizedImageExtension;
  return `instagram_${type}_${shortcode}_${index + 1}.${extension}`;
}

function looksLikeMediaUrl(url?: string): boolean {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (/instagram\.com\/(?:p|reel|reels|tv|stories)\//i.test(url)) return false;

  return (
    /scontent|cdninstagram|fbcdn/i.test(url) ||
    /\.(mp4|m4v|mov|jpe?g|png|webp)(?:$|\?)/i.test(url)
  );
}

function inferMediaType(url?: string, hints: unknown[] = []): MediaType | null {
  const normalizedUrl = url?.toLowerCase() ?? '';

  for (const hint of hints) {
    if (hint === true || hint === 2) return 'video';
    if (typeof hint === 'string') {
      const normalizedHint = hint.toLowerCase();
      if (normalizedHint.includes('video')) return 'video';
      if (normalizedHint.includes('image') || normalizedHint.includes('photo')) return 'image';
      if (normalizedHint.includes('mp4')) return 'video';
      if (normalizedHint.includes('jpg') || normalizedHint.includes('jpeg') || normalizedHint.includes('png') || normalizedHint.includes('webp')) return 'image';
    }
  }

  if (/\.(mp4|m4v|mov)(?:$|\?)/i.test(normalizedUrl)) return 'video';
  if (/\.(jpe?g|png|webp)(?:$|\?)/i.test(normalizedUrl)) return 'image';
  if (/\/o1\/v\/|\/v\/t\d+\/|\/t\d+\.2886-16\//i.test(normalizedUrl)) return 'video';
  if (/\/e\d+\//i.test(normalizedUrl)) return 'image';

  return null;
}

function inferTypeFromTarget(target: InstagramTarget): MediaType | null {
  if (target.resourceType === 'reel' || target.resourceType === 'tv') {
    return 'video';
  }

  return null;
}

function pushMediaItem(
  items: MediaItem[],
  seen: Set<string>,
  input: {
    url?: string;
    type?: MediaType | null;
    thumbnail?: string;
    shortcode: string;
  },
) {
  if (!input.url || !looksLikeMediaUrl(input.url) || !input.type || seen.has(input.url)) {
    return;
  }

  const thumbnail = sanitizeMediaUrl(input.thumbnail);
  const index = items.length;

  items.push({
    url: input.url,
    type: input.type,
    thumbnail,
    filename: buildFilename(input.type, input.shortcode, index, input.url),
  });

  seen.add(input.url);
}

function normalizeResult(result: Omit<InstagramMediaResult, 'type'>): InstagramMediaResult | null {
  if (!result.items.length) return null;

  return {
    ...result,
    type: result.items.length > 1 ? 'carousel' : result.items[0].type,
    thumbnail: result.thumbnail ?? result.items[0].thumbnail,
  };
}

function extractInstagramTarget(rawUrl: string): InstagramTarget | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();

    if (!hostname.endsWith('instagram.com')) {
      return null;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (!segments.length) return null;

    const root = segments[0].toLowerCase();

    if ((root === 'reel' || root === 'reels') && segments[1]) {
      return {
        canonicalUrl: `https://www.instagram.com/reel/${segments[1]}/`,
        shortcode: segments[1],
        resourceType: 'reel',
      };
    }

    if (root === 'p' && segments[1]) {
      return {
        canonicalUrl: `https://www.instagram.com/p/${segments[1]}/`,
        shortcode: segments[1],
        resourceType: 'p',
      };
    }

    if (root === 'tv' && segments[1]) {
      return {
        canonicalUrl: `https://www.instagram.com/tv/${segments[1]}/`,
        shortcode: segments[1],
        resourceType: 'tv',
      };
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

function getCandidatePaths(target: InstagramTarget): string[] {
  if (target.resourceType === 'stories' && target.storyOwner) {
    return [`stories/${target.storyOwner}/${target.shortcode}`];
  }

  if (target.resourceType === 'reel') {
    return [`reel/${target.shortcode}`, `p/${target.shortcode}`];
  }

  if (target.resourceType === 'tv') {
    return [`tv/${target.shortcode}`, `p/${target.shortcode}`];
  }

  return [`p/${target.shortcode}`];
}

function extractCaption(media: any): string | undefined {
  return sanitizeText(
    media?.edge_media_to_caption?.edges?.[0]?.node?.text ?? media?.caption?.text ?? media?.caption,
  );
}

function extractUsername(media: any): string | undefined {
  return sanitizeText(media?.owner?.username ?? media?.user?.username ?? media?.username);
}

function extractFromGraphQlMedia(media: any, shortcode: string, resourceType: ResourceType): InstagramMediaResult | null {
  if (!media || typeof media !== 'object') return null;

  const items: MediaItem[] = [];
  const seen = new Set<string>();

  const appendNode = (node: any) => {
    const videoUrl = sanitizeMediaUrl(node?.video_url);
    const imageUrl = sanitizeMediaUrl(node?.display_url ?? node?.thumbnail_src);

    if (videoUrl) {
      pushMediaItem(items, seen, {
        url: videoUrl,
        type: 'video',
        thumbnail: imageUrl,
        shortcode,
      });
      return;
    }

    if (imageUrl) {
      pushMediaItem(items, seen, {
        url: imageUrl,
        type: 'image',
        thumbnail: imageUrl,
        shortcode,
      });
    }
  };

  if (Array.isArray(media?.edge_sidecar_to_children?.edges)) {
    for (const edge of media.edge_sidecar_to_children.edges) {
      appendNode(edge?.node);
    }
  } else {
    appendNode(media);
  }

  return normalizeResult({
    shortcode,
    resourceType,
    items,
    thumbnail: sanitizeMediaUrl(media?.display_url ?? media?.thumbnail_src),
    username: extractUsername(media),
    caption: extractCaption(media),
  });
}

function extractFromApiItem(item: any, shortcode: string, resourceType: ResourceType): InstagramMediaResult | null {
  if (!item || typeof item !== 'object') return null;

  const items: MediaItem[] = [];
  const seen = new Set<string>();

  const appendApiNode = (node: any) => {
    const videoUrl = sanitizeMediaUrl(node?.video_versions?.[0]?.url ?? node?.video_url);
    const imageUrl = sanitizeMediaUrl(node?.image_versions2?.candidates?.[0]?.url ?? node?.display_url);

    if (videoUrl) {
      pushMediaItem(items, seen, {
        url: videoUrl,
        type: 'video',
        thumbnail: imageUrl,
        shortcode,
      });
      return;
    }

    if (imageUrl) {
      pushMediaItem(items, seen, {
        url: imageUrl,
        type: 'image',
        thumbnail: imageUrl,
        shortcode,
      });
    }
  };

  if (Array.isArray(item?.carousel_media)) {
    for (const child of item.carousel_media) {
      appendApiNode(child);
    }
  } else {
    appendApiNode(item);
  }

  return normalizeResult({
    shortcode,
    resourceType,
    items,
    thumbnail: sanitizeMediaUrl(item?.image_versions2?.candidates?.[0]?.url),
    username: extractUsername(item),
    caption: extractCaption(item),
  });
}

function deepExtractMedia(obj: any, shortcode: string, resourceType: ResourceType, visited = new WeakSet<object>()): InstagramMediaResult | null {
  if (!obj || typeof obj !== 'object') return null;
  if (visited.has(obj)) return null;
  visited.add(obj);

  const graphQlMedia = obj?.graphql?.shortcode_media ?? obj?.shortcode_media ?? obj?.xdt_shortcode_media;
  if (graphQlMedia) {
    const graphQlResult = extractFromGraphQlMedia(graphQlMedia, shortcode, resourceType);
    if (graphQlResult) return graphQlResult;
  }

  const apiItem = obj?.xdt_api__v1__media__shortcode__web_info?.items?.[0] ?? obj?.items?.[0];
  if (apiItem) {
    const apiResult = extractFromApiItem(apiItem, shortcode, resourceType);
    if (apiResult) return apiResult;
  }

  if (Array.isArray(obj)) {
    for (const entry of obj) {
      const nested = deepExtractMedia(entry, shortcode, resourceType, visited);
      if (nested) return nested;
    }
    return null;
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const nested = deepExtractMedia(value, shortcode, resourceType, visited);
      if (nested) return nested;
    }
  }

  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractFromRapidApiPayload(payload: any, target: InstagramTarget): InstagramMediaResult | null {
  if (!payload || typeof payload !== 'object') return null;

  const items: MediaItem[] = [];
  const seen = new Set<string>();
  const targetTypeHint = inferTypeFromTarget(target);

  const username = sanitizeText(
    payload?.username ?? payload?.user?.username ?? payload?.owner?.username,
  );
  const caption = sanitizeText(
    payload?.caption ?? payload?.title ?? payload?.description ?? payload?.data?.caption,
  );

  const pushRapidApiCandidate = (
    candidate: unknown,
    meta?: {
      typeHints?: unknown[];
      thumbnail?: unknown;
    },
  ) => {
    if (Array.isArray(candidate)) {
      for (const entry of candidate) {
        pushRapidApiCandidate(entry, meta);
      }
      return;
    }

    const mediaUrl = sanitizeMediaUrl(candidate);
    if (!mediaUrl) return;

    const mediaType = inferMediaType(mediaUrl, [
      ...(meta?.typeHints ?? []),
      targetTypeHint,
    ]) ?? targetTypeHint;

    pushMediaItem(items, seen, {
      url: mediaUrl,
      type: mediaType,
      thumbnail: sanitizeMediaUrl(meta?.thumbnail),
      shortcode: target.shortcode,
    });
  };

  const scanNode = (node: any) => {
    if (!node || typeof node !== 'object') return;

    const typeHints = [
      node?.type,
      node?.media_type,
      node?.mime_type,
      node?.is_video,
      node?.isVideo,
      node?.kind,
    ];

    const thumbnail = node?.thumb ?? node?.thumbnail ?? node?.thumbnail_url ?? node?.display_url ?? node?.image_url;

    pushRapidApiCandidate(node?.video_url, { typeHints: ['video', ...typeHints], thumbnail });
    pushRapidApiCandidate(node?.videoUrl, { typeHints: ['video', ...typeHints], thumbnail });
    pushRapidApiCandidate(node?.media, { typeHints, thumbnail });
    pushRapidApiCandidate(node?.download_url, { typeHints, thumbnail });
    pushRapidApiCandidate(node?.downloadUrl, { typeHints, thumbnail });
    pushRapidApiCandidate(node?.url, { typeHints, thumbnail });
    pushRapidApiCandidate(node?.image_url, { typeHints: ['image', ...typeHints], thumbnail });
    pushRapidApiCandidate(node?.imageUrl, { typeHints: ['image', ...typeHints], thumbnail });
    pushRapidApiCandidate(node?.display_url, { typeHints: ['image', ...typeHints], thumbnail });
    pushRapidApiCandidate(node?.src, { typeHints, thumbnail });
  };

  if (Array.isArray(payload?.data)) {
    for (const entry of payload.data) {
      scanNode(entry);
    }
  }

  if (Array.isArray(payload?.media)) {
    for (const entry of payload.media) {
      scanNode(entry);
    }
  }

  if (Array.isArray(payload?.url)) {
    for (const entry of payload.url) {
      pushRapidApiCandidate(entry, { typeHints: [targetTypeHint] });
    }
  }

  const stack: any[] = [payload];
  const visited = new WeakSet<object>();

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const entry of current) stack.push(entry);
      continue;
    }

    scanNode(current);

    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }

  return normalizeResult({
    shortcode: target.shortcode,
    resourceType: target.resourceType,
    items,
    username,
    caption,
    thumbnail: items[0]?.thumbnail,
  });
}

// PRIMARY: Reels Downloader - Insta Downloader (POST method, more reliable for Reels)
async function fetchViaRapidApiV2(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY');
  const apiHostV2 = 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com';

  if (!apiKey) {
    console.log('RapidAPI V2: API key not configured, skipping');
    return null;
  }

  try {
    console.log('Strategy 1A: RapidAPI V2 (Reels Downloader)');

    const encodedUrl = encodeURIComponent(target.canonicalUrl);
    const response = await fetchWithTimeout(
      `https://${apiHostV2}/unified/url?url=${encodedUrl}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHostV2,
        },
      },
      25000,
    );

    console.log('RapidAPI V2 status:', response.status);

    if (!response.ok) {
      const body = await response.text();
      console.log('RapidAPI V2 error body:', body.slice(0, 500));
      return null;
    }

    const payload = await response.json();
    console.log('RapidAPI V2 payload keys:', Object.keys(payload));
    console.log('RapidAPI V2 payload preview:', JSON.stringify(payload).slice(0, 800));

    const result = extractFromRapidApiPayload(payload, target);

    if (result) {
      console.log('RapidAPI V2 success:', result.items.map((item) => `${item.type}:${item.url.slice(0, 90)}`));
    } else {
      console.log('RapidAPI V2 returned no parsable media');
    }

    return result;
  } catch (error) {
    console.log('RapidAPI V2 error:', String(error));
    return null;
  }
}

// BACKUP: Original RapidAPI (GET /scraper method)
async function fetchViaRapidApi(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY');
  const apiHost = Deno.env.get('RAPIDAPI_HOST');

  if (!apiKey || !apiHost) {
    console.log('RapidAPI V1: credentials not configured, skipping');
    return null;
  }

  try {
    console.log('Strategy 1B: RapidAPI V1 (backup)');

    const rapidApiUrl = `https://${apiHost}/scraper?url=${encodeURIComponent(target.canonicalUrl)}`;

    const response = await fetchWithTimeout(
      rapidApiUrl,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
        },
      },
      20000,
    );

    console.log('RapidAPI V1 status:', response.status);

    if (!response.ok) {
      const body = await response.text();
      console.log('RapidAPI V1 error body:', body.slice(0, 500));
      return null;
    }

    const payload = await response.json();
    console.log('RapidAPI V1 payload keys:', Object.keys(payload));
    
    const result = extractFromRapidApiPayload(payload, target);

    if (result) {
      console.log('RapidAPI V1 success:', result.items.map((item) => `${item.type}:${item.url.slice(0, 90)}`));
    } else {
      console.log('RapidAPI V1 returned no parsable media');
    }

    return result;
  } catch (error) {
    console.log('RapidAPI V1 error:', String(error));
    return null;
  }
}

async function fetchViaGraphQL(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  if (target.resourceType === 'stories') return null;
  
  console.log('Strategy 2: GraphQL');

  const queryHash = '9f8827793ef34641b2fb195d4d41151c';
  const variables = JSON.stringify({ shortcode: target.shortcode });
  
  try {
    const response = await fetchWithTimeout(
      `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`,
      {
        method: 'GET',
        headers: {
          ...BROWSER_HEADERS,
          'Accept': '*/*',
          'X-Requested-With': 'XMLHttpRequest',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
      },
    );

    console.log('GraphQL status:', response.status);
    if (!response.ok) return null;

    const payload = await response.json().catch(() => null);
    if (!payload) return null;

    const result = deepExtractMedia(payload, target.shortcode, target.resourceType);
    if (result) {
      console.log('GraphQL success:', result.items.map(i => `${i.type}:${i.url.slice(0, 90)}`));
    }
    return result;
  } catch (error) {
    console.log('GraphQL error:', String(error));
    return null;
  }
}

async function fetchViaPublicJson(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  console.log('Strategy 2.5: public JSON');

  for (const path of getCandidatePaths(target)) {
    try {
      const response = await fetchWithTimeout(
        `https://www.instagram.com/${path}/?__a=1&__d=dis`,
        {
          method: 'GET',
          headers: {
            ...BROWSER_HEADERS,
            'Accept': 'application/json,text/plain,*/*',
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
      );

      console.log(`Public JSON status (${path}):`, response.status);
      if (!response.ok) continue;

      const payload = await response.json().catch(() => null);
      const result = payload ? deepExtractMedia(payload, target.shortcode, target.resourceType) : null;
      if (result) return result;
    } catch (error) {
      console.log(`Public JSON error (${path}):`, error);
    }
  }

  return null;
}

async function fetchViaEmbed(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  console.log('Strategy 3: embed');

  for (const path of getCandidatePaths(target)) {
    try {
      const response = await fetchWithTimeout(
        `https://www.instagram.com/${path}/embed/captioned/`,
        {
          method: 'GET',
          headers: {
            ...BROWSER_HEADERS,
            'Accept': 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
        },
      );

      console.log(`Embed status (${path}):`, response.status);
      if (!response.ok) continue;

      const html = await response.text();
      console.log(`Embed HTML length (${path}):`, html.length);

      // Try to find embedded JSON data first
      const embedJsonMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]*,\s*({.+?})\s*\)/s);
      if (embedJsonMatch?.[1]) {
        try {
          const payload = JSON.parse(embedJsonMatch[1]);
          const result = deepExtractMedia(payload, target.shortcode, target.resourceType);
          if (result) return result;
        } catch {}
      }

      // Try gql_data in embed
      const gqlMatch = html.match(/"gql_data"\s*:\s*({.+?})\s*,\s*"[a-z]/s);
      if (gqlMatch?.[1]) {
        try {
          const payload = JSON.parse(gqlMatch[1]);
          const result = deepExtractMedia(payload, target.shortcode, target.resourceType);
          if (result) return result;
        } catch {}
      }

      const videoUrl = sanitizeMediaUrl(html.match(/"video_url"\s*:\s*"([^"]+)"/)?.[1]);
      const displayUrl = sanitizeMediaUrl(html.match(/"display_url"\s*:\s*"([^"]+)"/)?.[1]);
      const username = sanitizeText(html.match(/"owner_username"\s*:\s*"([^"]+)"/)?.[1]);

      console.log(`Embed extract (${path}): video=${!!videoUrl}, image=${!!displayUrl}`);

      const items: MediaItem[] = [];
      const seen = new Set<string>();

      if (videoUrl) {
        pushMediaItem(items, seen, {
          url: videoUrl,
          type: 'video',
          thumbnail: displayUrl,
          shortcode: target.shortcode,
        });
      }

      if (!items.length && displayUrl) {
        pushMediaItem(items, seen, {
          url: displayUrl,
          type: 'image',
          thumbnail: displayUrl,
          shortcode: target.shortcode,
        });
      }

      const result = normalizeResult({
        shortcode: target.shortcode,
        resourceType: target.resourceType,
        items,
        username,
        caption: undefined,
        thumbnail: displayUrl,
      });

      if (result) return result;
    } catch (error) {
      console.log(`Embed error (${path}):`, error);
    }
  }

  return null;
}

// Convert Instagram shortcode to numeric media ID
function shortcodeToMediaId(shortcode: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = BigInt(0);
  for (const char of shortcode) {
    id = id * BigInt(64) + BigInt(alphabet.indexOf(char));
  }
  return id.toString();
}

async function fetchViaInternalApi(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  if (target.resourceType === 'stories') return null;
  
  console.log('Strategy 3.5: Internal API v1');
  
  try {
    const mediaId = shortcodeToMediaId(target.shortcode);
    console.log('Media ID:', mediaId);
    
    const response = await fetchWithTimeout(
      `https://i.instagram.com/api/v1/media/${mediaId}/info/`,
      {
        method: 'GET',
        headers: {
          ...BROWSER_HEADERS,
          'User-Agent': 'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)',
        },
      },
    );

    console.log('Internal API status:', response.status);

    if (!response.ok) {
      const body = await response.text();
      console.log('Internal API error:', body.slice(0, 300));
      return null;
    }

    const payload = await response.json();
    console.log('Internal API keys:', Object.keys(payload));
    
    const result = extractFromApiItem(payload?.items?.[0], target.shortcode, target.resourceType);
    if (result) {
      console.log('Internal API success:', result.items.map(i => `${i.type}:${i.url.slice(0, 90)}`));
      return result;
    }
    
    // Try deep extract as fallback
    const deepResult = deepExtractMedia(payload, target.shortcode, target.resourceType);
    if (deepResult) return deepResult;
    
    return null;
  } catch (error) {
    console.log('Internal API error:', String(error));
    return null;
  }
}

async function fetchViaHtml(target: InstagramTarget): Promise<InstagramMediaResult | null> {
  console.log('Strategy 4: HTML');

  for (const path of getCandidatePaths(target)) {
    try {
      const response = await fetchWithTimeout(
        `https://www.instagram.com/${path}/`,
        {
          method: 'GET',
          headers: {
            ...BROWSER_HEADERS,
            'Accept': 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
        },
      );

      console.log(`HTML status (${path}):`, response.status);
      if (!response.ok) continue;

      const html = await response.text();

      const structuredMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s)
        ?? html.match(/window\._sharedData\s*=\s*({.+?});\s*<\/script>/s);

      if (structuredMatch?.[1]) {
        const payload = JSON.parse(structuredMatch[1]);
        const result = deepExtractMedia(payload, target.shortcode, target.resourceType);
        if (result) return result;
      }

      const videoUrl = sanitizeMediaUrl(
        html.match(/<meta[^>]+property="og:video(?::url)?"[^>]+content="([^"]+)"/i)?.[1]
          ?? html.match(/"video_url"\s*:\s*"([^"]+)"/)?.[1],
      );
      const imageUrl = sanitizeMediaUrl(
        html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1]
          ?? html.match(/"display_url"\s*:\s*"([^"]+)"/)?.[1],
      );

      const items: MediaItem[] = [];
      const seen = new Set<string>();

      if (videoUrl) {
        pushMediaItem(items, seen, {
          url: videoUrl,
          type: 'video',
          thumbnail: imageUrl,
          shortcode: target.shortcode,
        });
      }

      if (!items.length && imageUrl) {
        pushMediaItem(items, seen, {
          url: imageUrl,
          type: 'image',
          thumbnail: imageUrl,
          shortcode: target.shortcode,
        });
      }

      const result = normalizeResult({
        shortcode: target.shortcode,
        resourceType: target.resourceType,
        items,
        username: sanitizeText(html.match(/"owner_username"\s*:\s*"([^"]+)"/)?.[1]),
        caption: undefined,
        thumbnail: imageUrl,
      });

      if (result) return result;
    } catch (error) {
      console.log(`HTML error (${path}):`, error);
    }
  }

  return null;
}

async function getInstagramMedia(rawUrl: string): Promise<InstagramMediaResult | null> {
  const target = extractInstagramTarget(rawUrl);
  if (!target) return null;

  console.log('Processing Instagram URL:', target.canonicalUrl);
  console.log('Shortcode:', target.shortcode, '| Type:', target.resourceType);

  return (
    await fetchViaRapidApiV2(target)
    ?? await fetchViaRapidApi(target)
    ?? await fetchViaGraphQL(target)
    ?? await fetchViaInternalApi(target)
    ?? await fetchViaPublicJson(target)
    ?? await fetchViaEmbed(target)
    ?? await fetchViaHtml(target)
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const url = sanitizeText(body?.url);

    if (!url) {
      return jsonResponse({ success: false, error: 'URL é obrigatória.' }, 400);
    }

    const result = await getInstagramMedia(url);

    if (!result) {
      return jsonResponse(
        {
          success: false,
          error: 'Não foi possível extrair a mídia. O conteúdo pode ser privado, restrito ou temporariamente indisponível.',
        },
        404,
      );
    }

    console.log('Extraction success:', result.items.map((item) => `${item.type}:${item.url.slice(0, 90)}`));

    return jsonResponse({
      success: true,
      shortcode: result.shortcode,
      resourceType: result.resourceType,
      type: result.type,
      thumbnail: result.thumbnail,
      username: result.username,
      caption: result.caption,
      count: result.items.length,
      items: result.items,
    });
  } catch (error) {
    console.error('Fatal error:', error);
    return jsonResponse({ success: false, error: 'Erro interno ao processar o link.' }, 500);
  }
});
