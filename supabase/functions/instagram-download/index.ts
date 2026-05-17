// Instagram Downloader - RapidAPI cascade strategy
// Uses 2 RapidAPI providers in cascade for high availability.
// Public IG endpoints block datacenter IPs, so we MUST go through residential providers.

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

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') ?? '';
const isValidHost = (h: string) => h.includes('.') && h.includes('rapidapi');
const ENV_HOST_1 = Deno.env.get('RAPIDAPI_HOST') ?? '';
const ENV_HOST_2 = Deno.env.get('RAPIDAPI_HOST_V2') ?? '';
const ENV_HOST_3 = Deno.env.get('RAPIDAPI_HOST_V3') ?? '';
const ENV_HOST_4 = Deno.env.get('RAPIDAPI_HOST_V4') ?? '';
const ENV_HOST_5 = Deno.env.get('RAPIDAPI_HOST_V5') ?? '';

const DEFAULTS = [
  'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
  'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com',
  'instagram-downloader38.p.rapidapi.com',
  'instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com',
  'instagram-post-reels-stories-downloader-api.p.rapidapi.com',
];

// Build host list: prefer env-provided hosts first (if valid), then defaults,
// always deduped. Never drop a default just because an env host overlaps.
const _seen = new Set<string>();
const ALL_HOSTS: string[] = [];
for (const h of [ENV_HOST_1, ENV_HOST_2, ENV_HOST_3, ENV_HOST_4, ENV_HOST_5, ...DEFAULTS]) {
  if (!h || !isValidHost(h) || _seen.has(h)) continue;
  _seen.add(h);
  ALL_HOSTS.push(h);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function sanitizeMediaUrl(value: unknown): string | undefined {
  const raw = sanitizeText(value);
  if (!raw) return undefined;
  return /^https?:\/\//i.test(raw) ? raw : undefined;
}

function inferMediaType(rawUrl: string, fallback?: MediaType): MediaType | null {
  const cleanUrl = rawUrl.toLowerCase();
  if (/\.(mp4|m4v|mov|webm)(?:$|\?)/i.test(cleanUrl)) return 'video';
  if (/\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)(?:$|\?)/i.test(cleanUrl)) return 'image';
  return fallback ?? null;
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
      return { canonicalUrl: `https://www.instagram.com/stories/${segments[1]}/${segments[2]}/`, shortcode: segments[2], resourceType: 'stories' };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// Generic RapidAPI request helper
// ============================================================
async function callRapidApi(host: string, path: string, params: Record<string, string>): Promise<any | null> {
  if (!RAPIDAPI_KEY || !host) return null;
  const url = new URL(`https://${host}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetchWithTimeout(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': host,
        'Accept': 'application/json',
      },
    });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const text = await res.text();
      console.log(`[rapidapi:${host}] ${path} -> HTTP ${res.status} body=${text.slice(0,200)}`);
      return null;
    }

    if (contentType.startsWith('video/') || contentType.startsWith('image/') || contentType.includes('octet-stream')) {
      console.log(`[rapidapi:${host}] ${path} -> 200 media content-type=${contentType} finalUrl=${res.url}`);
      return {
        result: [{
          url: res.url,
          type: contentType.startsWith('video/') ? 'video' : 'image',
        }],
      };
    }

    const text = await res.text();
    console.log(`[rapidapi:${host}] ${path} -> 200 body=${text.slice(0,400)}`);
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { return null; }
    // Some providers return HTTP 200 with an error field — treat as failure
    if (parsed && typeof parsed === 'object' && typeof parsed.error === 'string' && !parsed.media && !parsed.items) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.log(`[rapidapi:${host}] ${path} -> error`, err);
    return null;
  }
}

// ============================================================
// Universal parser - tries every common shape returned by IG-downloader RapidAPIs
// ============================================================
function parseRapidApiResponse(data: any, target: InstagramTarget): InstagramMediaResult | null {
  if (!data || typeof data !== 'object') return null;

  const items: MediaItem[] = [];
  const seen = new Set<string>();
  let username: string | undefined;
  let caption: string | undefined;
  let topThumb: string | undefined;

  const pushItem = (rawUrl: unknown, type: MediaType, thumb?: unknown) => {
    const url = sanitizeMediaUrl(rawUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    const thumbnail = sanitizeMediaUrl(thumb);
    items.push({
      url,
      type,
      thumbnail: thumbnail ?? (type === 'image' ? url : undefined),
      filename: buildFilename(type, target.shortcode, items.length, url),
    });
  };

  const handleCollection = (value: unknown) => {
    if (!Array.isArray(value) || value.length === 0) return false;
    for (const child of value) {
      handleNode(child?.node ?? child);
    }
    return items.length > 0;
  };

  const handleNode = (node: any) => {
    if (!node || typeof node !== 'object') return;

    // Common video URL fields
    const videoCandidates = [
      node.video_url,
      node.videoUrl,
      node.video,
      node.url_video,
      typeof node.media === 'string' && inferMediaType(node.media) === 'video' ? node.media : undefined,
      node.download_url,
      node.downloadUrl,
      node.src,
      node.video_versions?.[0]?.url,
      node.videoVersions?.[0]?.url,
      node.video_dash_manifest && node.playable_url,
      node.playable_url,
      node.playable_url_quality_hd,
    ];

    // Common image URL fields
    const imageCandidates = [
      node.display_url,
      node.displayUrl,
      node.image_url,
      node.imageUrl,
      typeof node.media === 'string' && inferMediaType(node.media) === 'image' ? node.media : undefined,
      node.thumbnail,
      node.thumbnail_url,
      node.thumbnail_src,
      node.image_versions2?.candidates?.[0]?.url,
      node.imageVersions2?.candidates?.[0]?.url,
      node.image,
    ];

    const thumb = imageCandidates.find((v) => sanitizeMediaUrl(v));
    if (!topThumb) topThumb = sanitizeMediaUrl(thumb);

    const videoUrl = videoCandidates.find((v) => sanitizeMediaUrl(v));

    // Determine if this node is a video
    const isVideo = !!videoUrl
      || node.is_video === true
      || node.media_type === 2
      || node.mediaType === 2
      || node.type === 'video'
      || node.type === 'GraphVideo';

    // Direct shape: { type: "image"|"video", url, thumbnail } (used by /convert)
    const directUrl = sanitizeMediaUrl(node.url ?? node.link ?? node.href ?? node.download_url ?? node.downloadUrl ?? node.media);
    const normalizedType = typeof node.type === 'string' ? node.type.toLowerCase() : '';
    const directType: MediaType | null = directUrl
      ? normalizedType === 'video' || normalizedType === 'mp4' || /\.(mp4|m4v|mov)(?:$|\?)/i.test(directUrl) || node.is_video === true || node.media_type === 2
        ? 'video'
        : normalizedType === 'image' || normalizedType === 'photo' || /\.(jpe?g|png|webp)(?:$|\?)/i.test(directUrl)
          ? 'image'
          : inferMediaType(directUrl)
      : null;

    if (directUrl && directType && !videoUrl) {
      pushItem(directUrl, directType, node.thumbnail ?? thumb);
      return;
    }

    // Shape: { Type: "Image"|"Video", media: "url", thumbnail } (used by /index on videos-stories host)
    const mediaStr = sanitizeMediaUrl(node.media);
    const capType = typeof node.Type === 'string' ? node.Type.toLowerCase() : '';
    if (mediaStr && (capType === 'image' || capType === 'video')) {
      pushItem(mediaStr, capType === 'video' ? 'video' : 'image', node.thumbnail ?? thumb);
      return;
    }

    if (isVideo && videoUrl) {
      pushItem(videoUrl, 'video', thumb);
    } else if (thumb) {
      pushItem(thumb, 'image');
    }
  };

  // Username & caption (try many shapes)
  username = sanitizeText(
    data.username
    ?? data.user?.username
    ?? data.owner?.username
    ?? data.author?.username
    ?? data.data?.user?.username
    ?? data.data?.owner?.username,
  );
  caption = sanitizeText(
    data.caption
    ?? data.title
    ?? data.description
    ?? data.caption?.text
    ?? data.edge_media_to_caption?.edges?.[0]?.node?.text
    ?? data.data?.caption
    ?? data.data?.title,
  );

  // Carousel candidates
  const carouselCandidates = [
    Array.isArray(data) ? data : null,
    data.carousel_media,
    data.carouselMedia,
    data.children,
    data.items,
    data.medias,
    data.media,
    data.result,
    data.results,
    data.data,
    data.edge_sidecar_to_children?.edges,
    data.data?.carousel_media,
    data.data?.children,
    data.data?.items,
    data.data?.medias,
    data.data?.media,
    data.data?.result,
    data.data?.results,
  ];

  let processed = false;
  for (const c of carouselCandidates) {
    if (handleCollection(c)) {
      processed = true;
      break;
    }
  }

  // Single media fallback
  if (!processed) {
    handleNode(data);
    handleNode(data.data);
    handleNode(data.result);
    handleNode(data.media);
    handleNode(data.graphql?.shortcode_media);
  }

  if (!items.length) return null;

  if (target.resourceType === 'reel' && !items.some((item) => item.type === 'video')) {
    return null;
  }

  // Backfill thumbnails for videos
  for (const item of items) {
    if (item.type === 'video' && !item.thumbnail) {
      item.thumbnail = topThumb;
    }
  }

  return {
    shortcode: target.shortcode,
    resourceType: target.resourceType,
    type: items.length > 1 ? 'carousel' : items[0].type,
    items,
    thumbnail: topThumb ?? items[0].thumbnail,
    username,
    caption,
  };
}

// ============================================================
// Provider 1: RAPIDAPI_HOST (primary)
// Tries the most common path conventions used by IG-downloader APIs.
// ============================================================
function buildAttempts(target: InstagramTarget): Array<{ path: string; params: Record<string, string> }> {
  const url = target.canonicalUrl;
  const sc = target.shortcode;
  return [
    // instagram-downloader-download-instagram-stories-videos4 (Glavier) — confirmed
    { path: '/convert', params: { url } },
    { path: '/index', params: { url } },
    // instagram-downloader-scraper-reels-igtv-posts-stories (ntkz)
    { path: '/api/v1/post', params: { url, link: url } },
    { path: '/api/v1/post_info', params: { url, code_or_id_or_url: sc } },
    { path: '/v1/post_info', params: { url, code_or_id_or_url: sc } },
    // instagram-scraper-api2 (varying)
    { path: '/v1/post_info', params: { code_or_id_or_url: sc } },
    { path: '/v1/info', params: { url } },
    // instagram-looter2
    { path: '/post', params: { link: url, url, shortcode: sc } },
    { path: '/post-dl', params: { url, link: url } },
    // instagram-bulk-profile-scrapper
    { path: '/clients/api/ig/media_by_url', params: { url } },
    // generic
    { path: '/', params: { url } },
    { path: '/get-info', params: { url } },
    { path: '/get_info', params: { url } },
    { path: '/instagram', params: { url } },
    { path: '/media', params: { url, shortcode: sc } },
    { path: `/post/${sc}`, params: {} },
    { path: '/info', params: { url } },
    { path: '/data', params: { url } },
    { path: '/download', params: { url } },
    { path: '/dl', params: { url } },
    { path: '/scrape', params: { url } },
  ];
}

async function fetchViaRapidApiHost(host: string, label: string, target: InstagramTarget): Promise<InstagramMediaResult | null> {
  if (!host) return null;
  for (const a of buildAttempts(target)) {
    const data = await callRapidApi(host, a.path, a.params);
    if (!data) continue;
    const result = parseRapidApiResponse(data, target);
    if (result) {
      console.log(`[${label}] success via ${a.path}: ${result.items.length} item(s)`);
      return result;
    }
  }
  return null;
}

async function fetchViaRapidApiPrimary(target: InstagramTarget) {
  return fetchViaRapidApiHost(RAPIDAPI_HOST, 'primary', target);
}

async function fetchViaRapidApiSecondary(target: InstagramTarget) {
  return fetchViaRapidApiHost(RAPIDAPI_HOST_V2, 'secondary', target);
}
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

    if (!RAPIDAPI_KEY || ALL_HOSTS.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Serviço não configurado. Entre em contato com o suporte.',
      }, 500);
    }

    const target = extractInstagramTarget(rawUrl);
    if (!target) {
      return jsonResponse({ success: false, error: 'Link do Instagram inválido.' }, 400);
    }

    if (target.resourceType === 'stories') {
      return jsonResponse({
        success: false,
        error: 'Stories ainda não são suportados. Use o link de um post (P), reel ou IGTV.',
      }, 400);
    }

    console.log(`[start] ${target.resourceType}/${target.shortcode} hosts=${ALL_HOSTS.length}`);

    let result: InstagramMediaResult | null = null;
    for (let i = 0; i < ALL_HOSTS.length; i++) {
      const label = i === 0 ? 'primary' : `fallback-${i}`;
      if (i > 0) console.log(`[fallback] trying host #${i + 1}: ${ALL_HOSTS[i]}`);
      result = await fetchViaRapidApiHost(ALL_HOSTS[i], label, target);
      if (result) break;
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
