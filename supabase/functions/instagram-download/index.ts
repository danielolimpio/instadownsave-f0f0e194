const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MediaItem {
  url: string;
  type: 'video' | 'image';
  thumbnail?: string;
  filename: string;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv|stories\/[^/]+)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function detectResourceType(url: string): string {
  if (/\/reel\//i.test(url) || /\/reels\//i.test(url)) return 'reel';
  if (/\/tv\//i.test(url)) return 'tv';
  if (/\/stories\//i.test(url)) return 'stories';
  return 'p';
}

function extractFromGraphQLMedia(media: any): MediaItem[] {
  const items: MediaItem[] = [];

  if (media.edge_sidecar_to_children?.edges) {
    for (const edge of media.edge_sidecar_to_children.edges) {
      const node = edge.node;
      if (node.is_video && node.video_url) {
        items.push({ url: node.video_url, type: 'video', thumbnail: node.display_url, filename: `instagram_video_${node.id || Date.now()}.mp4` });
      } else {
        items.push({ url: node.display_url, type: 'image', filename: `instagram_image_${node.id || Date.now()}.jpg` });
      }
    }
    return items;
  }

  if (media.is_video && media.video_url) {
    items.push({ url: media.video_url, type: 'video', thumbnail: media.display_url || media.thumbnail_src, filename: `instagram_video_${media.id || Date.now()}.mp4` });
  } else if (media.display_url) {
    items.push({ url: media.display_url, type: media.is_video ? 'video' : 'image', filename: media.is_video ? `instagram_video_${media.id || Date.now()}.mp4` : `instagram_image_${media.id || Date.now()}.jpg` });
  }
  return items;
}

function extractFromApiMedia(item: any): MediaItem[] {
  const items: MediaItem[] = [];

  if (item.carousel_media) {
    for (const cm of item.carousel_media) {
      if (cm.video_versions?.length) {
        items.push({ url: cm.video_versions[0].url, type: 'video', thumbnail: cm.image_versions2?.candidates?.[0]?.url, filename: `instagram_video_${cm.pk || Date.now()}.mp4` });
      } else if (cm.image_versions2?.candidates?.length) {
        items.push({ url: cm.image_versions2.candidates[0].url, type: 'image', filename: `instagram_image_${cm.pk || Date.now()}.jpg` });
      }
    }
    return items;
  }

  if (item.video_versions?.length) {
    items.push({ url: item.video_versions[0].url, type: 'video', thumbnail: item.image_versions2?.candidates?.[0]?.url, filename: `instagram_video_${item.pk || Date.now()}.mp4` });
    return items;
  }

  if (item.image_versions2?.candidates?.length) {
    items.push({ url: item.image_versions2.candidates[0].url, type: item.media_type === 2 ? 'video' : 'image', filename: item.media_type === 2 ? `instagram_video_${item.pk || Date.now()}.mp4` : `instagram_image_${item.pk || Date.now()}.jpg` });
  }
  return items;
}

// Deep search for media in any nested structure
function deepExtractMedia(obj: any, shortcode: string): MediaItem[] {
  if (!obj || typeof obj !== 'object') return [];
  if (obj.video_url) return [{ url: obj.video_url, type: 'video', thumbnail: obj.display_url, filename: `instagram_video_${shortcode}.mp4` }];
  if (obj.video_versions?.length) return [{ url: obj.video_versions[0].url, type: 'video', thumbnail: obj.image_versions2?.candidates?.[0]?.url, filename: `instagram_video_${shortcode}.mp4` }];
  if (obj.shortcode_media) return extractFromGraphQLMedia(obj.shortcode_media);
  if (obj.xdt_shortcode_media) return extractFromGraphQLMedia(obj.xdt_shortcode_media);
  
  // xdt_api__v1__media__shortcode__web_info.items
  const webInfo = obj.xdt_api__v1__media__shortcode__web_info;
  if (webInfo?.items?.length) return extractFromApiMedia(webInfo.items[0]);
  
  if (obj.items?.length && (obj.items[0]?.video_versions || obj.items[0]?.image_versions2)) return extractFromApiMedia(obj.items[0]);

  if (obj.data) {
    const result = deepExtractMedia(obj.data, shortcode);
    if (result.length) return result;
  }

  for (const key of Object.keys(obj)) {
    if (key.startsWith('xdt_') && typeof obj[key] === 'object') {
      const result = deepExtractMedia(obj[key], shortcode);
      if (result.length) return result;
    }
  }
  return [];
}

// Get a valid session (CSRF token + cookies) from Instagram
async function getInstagramSession(): Promise<{ csrfToken: string; cookies: string } | null> {
  try {
    const response = await fetch('https://www.instagram.com/web/__mid/', {
      headers: {
        'User-Agent': randomUA(),
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
    });

    const setCookies = response.headers.getSetCookie?.() || [];
    let csrfToken = '';
    const cookieParts: string[] = [];

    for (const cookie of setCookies) {
      const nameValue = cookie.split(';')[0];
      cookieParts.push(nameValue);
      if (nameValue.startsWith('csrftoken=')) {
        csrfToken = nameValue.split('=')[1];
      }
    }

    // Also try getting CSRF from page
    if (!csrfToken) {
      const pageResponse = await fetch('https://www.instagram.com/', {
        headers: { 'User-Agent': randomUA(), 'Accept': 'text/html' },
      });
      const pageSetCookies = pageResponse.headers.getSetCookie?.() || [];
      for (const cookie of pageSetCookies) {
        const nameValue = cookie.split(';')[0];
        cookieParts.push(nameValue);
        if (nameValue.startsWith('csrftoken=')) {
          csrfToken = nameValue.split('=')[1];
        }
      }
      // Try from HTML
      if (!csrfToken) {
        const html = await pageResponse.text();
        const csrfMatch = html.match(/"csrf_token"\s*:\s*"([^"]+)"/);
        if (csrfMatch) csrfToken = csrfMatch[1];
      }
    }

    if (!csrfToken) {
      csrfToken = 'missing';
    }

    console.log('Session obtained, CSRF:', csrfToken.substring(0, 10) + '..., cookies:', cookieParts.length);
    return { csrfToken, cookies: cookieParts.join('; ') };
  } catch (e) {
    console.log('Session error:', e);
    return null;
  }
}

// Strategy 1: GraphQL with session (like the article describes)
async function fetchViaGraphQLWithSession(shortcode: string, session: { csrfToken: string; cookies: string } | null): Promise<MediaItem[]> {
  console.log('Strategy 1: GraphQL with session...');

  const docIds = ['24368985919464652', '8845758582119845', '25981206651899035'];
  const ua = randomUA();

  for (const docId of docIds) {
    try {
      const body = `variables=${encodeURIComponent(JSON.stringify({ shortcode }))}&doc_id=${docId}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': ua,
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.instagram.com',
        'Referer': `https://www.instagram.com/`,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      };

      if (session) {
        headers['X-CSRFToken'] = session.csrfToken;
        headers['Cookie'] = session.cookies;
      }

      const response = await fetch('https://www.instagram.com/graphql/query', {
        method: 'POST',
        headers,
        body,
      });

      console.log(`GraphQL ${docId} status:`, response.status);
      if (!response.ok) continue;

      const text = await response.text();
      if (!text || text.length < 10) continue;

      // Handle multi-line JSON responses
      const lines = text.split('\n').filter(l => l.trim().startsWith('{'));
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const items = deepExtractMedia(data, shortcode);
          if (items.length) {
            console.log(`✓ GraphQL ${docId} success:`, items.map(i => i.type));
            return items;
          }
          // Log structure if no items found
          if (data?.data) {
            const keys = Object.keys(data.data);
            console.log(`GraphQL ${docId} data keys:`, keys);
            for (const k of keys) {
              if (data.data[k] && typeof data.data[k] === 'object') {
                console.log(`  ${k}:`, Object.keys(data.data[k]).slice(0, 5));
              } else {
                console.log(`  ${k}:`, data.data[k]);
              }
            }
          }
        } catch { /* skip */ }
      }
    } catch (e) {
      console.log(`GraphQL ${docId} error:`, e);
    }
  }
  return [];
}

// Strategy 2: /api/graphql with session (different endpoint, doc_id for web_info)
async function fetchViaApiGraphQLWithSession(shortcode: string, session: { csrfToken: string; cookies: string } | null): Promise<MediaItem[]> {
  console.log('Strategy 2: /api/graphql with session...');

  // doc_id that returns xdt_api__v1__media__shortcode__web_info with video_versions
  const docIds = ['10015901848480474', '9496293753735676'];
  const ua = randomUA();

  for (const docId of docIds) {
    try {
      const variables = JSON.stringify({
        shortcode,
        fetch_tagged_user_count: null,
        hoisted_comment_id: null,
        hoisted_reply_id: null,
      });

      const body = `variables=${encodeURIComponent(variables)}&doc_id=${docId}&lsd=AVqbxe3J_YA`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': ua,
        'X-FB-LSD': 'AVqbxe3J_YA',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      };

      if (session) {
        headers['X-CSRFToken'] = session.csrfToken;
        headers['Cookie'] = session.cookies;
      }

      const response = await fetch('https://www.instagram.com/api/graphql', {
        method: 'POST',
        headers,
        body,
      });

      console.log(`/api/graphql ${docId} status:`, response.status);
      if (!response.ok) continue;

      const text = await response.text();
      console.log(`/api/graphql ${docId} length:`, text.length);

      const lines = text.split('\n').filter(l => l.trim().startsWith('{'));
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const items = deepExtractMedia(data, shortcode);
          if (items.length) {
            console.log(`✓ /api/graphql ${docId} success:`, items.map(i => i.type));
            return items;
          }
          if (data?.data) {
            console.log(`/api/graphql ${docId} data keys:`, Object.keys(data.data));
          }
        } catch { /* skip */ }
      }
    } catch (e) {
      console.log(`/api/graphql error:`, e);
    }
  }
  return [];
}

// Strategy 3: ?__a=1&__d=dis public API
async function fetchViaPublicApi(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 3: Public API (?__a=1&__d=dis)...');

  const paths = resourceType === 'reel'
    ? [`reel/${shortcode}`, `p/${shortcode}`]
    : [`p/${shortcode}`];

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/?__a=1&__d=dis`, {
        headers: {
          'User-Agent': randomUA(),
          'Accept': '*/*',
          'X-IG-App-ID': '936619743392459',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
        },
        redirect: 'follow',
      });

      console.log(`Public API (${path}) status:`, response.status);
      if (!response.ok) continue;

      const data = await response.json().catch(() => null);
      if (!data) continue;

      const items = deepExtractMedia(data, shortcode);
      if (items.length) {
        console.log('✓ Public API success');
        return items;
      }

      if (data.graphql?.shortcode_media) return extractFromGraphQLMedia(data.graphql.shortcode_media);
      if (data.items?.length) return extractFromApiMedia(data.items[0]);
    } catch (e) {
      console.log('Public API error:', e);
    }
  }
  return [];
}

// Strategy 4: Embed page scraping
async function fetchViaEmbed(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 4: Embed page...');

  const paths = resourceType === 'reel'
    ? [`reel/${shortcode}`, `p/${shortcode}`]
    : [`p/${shortcode}`];

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/embed/captioned/`, {
        headers: {
          'User-Agent': randomUA(),
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (!response.ok) continue;
      const html = await response.text();

      // Try to find video_url in embedded JSON data
      const videoUrlMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
      if (videoUrlMatch) {
        const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        console.log('✓ Found video_url in embed');
        const thumbMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
        const thumbnail = thumbMatch ? thumbMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/') : undefined;
        return [{ url: videoUrl, type: 'video', thumbnail, filename: `instagram_video_${shortcode}.mp4` }];
      }

      // Try additionalDataLoaded
      const embedDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)/s);
      if (embedDataMatch) {
        try {
          const items = deepExtractMedia(JSON.parse(embedDataMatch[1]), shortcode);
          if (items.length) { console.log('✓ Embed additionalData'); return items; }
        } catch { /* */ }
      }

      // og:video
      const ogVideo = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:video"/i);
      if (ogVideo) {
        console.log('✓ og:video in embed');
        return [{ url: ogVideo[1].replace(/&amp;/g, '&'), type: 'video', filename: `instagram_video_${shortcode}.mp4` }];
      }

      // display_url - check type based on resource
      const displayUrl = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (displayUrl) {
        const url = displayUrl[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        const isVideo = resourceType === 'reel' || resourceType === 'tv';
        console.log('✓ display_url in embed, isVideo:', isVideo);
        return [{ url, type: isVideo ? 'video' : 'image', filename: isVideo ? `instagram_video_${shortcode}.mp4` : `instagram_image_${shortcode}.jpg` }];
      }

      // og:image
      const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
      if (ogImage) {
        const isVideo = resourceType === 'reel' || resourceType === 'tv';
        console.log('✓ og:image in embed, marking as:', isVideo ? 'video' : 'image');
        return [{ url: ogImage[1].replace(/&amp;/g, '&'), type: isVideo ? 'video' : 'image', filename: isVideo ? `instagram_video_${shortcode}.mp4` : `instagram_image_${shortcode}.jpg` }];
      }
    } catch (e) {
      console.log('Embed error:', e);
    }
  }
  return [];
}

// Strategy 5: Direct HTML page + script parsing
async function fetchViaHtmlScrape(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 5: HTML scrape...');

  const path = resourceType === 'reel' ? `reel/${shortcode}` : resourceType === 'tv' ? `tv/${shortcode}` : `p/${shortcode}`;

  try {
    const response = await fetch(`https://www.instagram.com/${path}/`, {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
      },
      redirect: 'follow',
    });

    if (!response.ok) return [];
    const html = await response.text();

    // video_url anywhere
    const videoMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (videoMatch) {
      console.log('✓ video_url in HTML');
      return [{ url: videoMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'), type: 'video', filename: `instagram_video_${shortcode}.mp4` }];
    }

    // _sharedData
    const sharedData = html.match(/window\._sharedData\s*=\s*({.+?});\s*<\/script>/s);
    if (sharedData) {
      try {
        const items = deepExtractMedia(JSON.parse(sharedData[1]), shortcode);
        if (items.length) { console.log('✓ _sharedData'); return items; }
      } catch { /* */ }
    }

    // __additionalDataLoaded
    const additional = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s);
    if (additional) {
      try {
        const items = deepExtractMedia(JSON.parse(additional[1]), shortcode);
        if (items.length) { console.log('✓ __additionalDataLoaded'); return items; }
      } catch { /* */ }
    }

    // JSON in script tags
    const scriptMatches = html.matchAll(/<script[^>]*type="application\/json"[^>]*>([^<]+)<\/script>/gi);
    for (const m of scriptMatches) {
      try {
        const items = deepExtractMedia(JSON.parse(m[1]), shortcode);
        if (items.length) { console.log('✓ script tag data'); return items; }
      } catch { /* */ }
    }

    // Check og:type
    const ogType = html.match(/<meta[^>]+property="og:type"[^>]+content="([^"]+)"/i);
    const isVideoByType = ogType && ogType[1].includes('video');
    const isVideoByUrl = resourceType === 'reel' || resourceType === 'tv';

    // og:video
    const ogVideo = html.match(/<meta[^>]+property="og:video(?::url)?"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:video"/i);
    if (ogVideo) {
      console.log('✓ og:video in HTML');
      return [{ url: ogVideo[1].replace(/&amp;/g, '&'), type: 'video', filename: `instagram_video_${shortcode}.mp4` }];
    }

    // og:image with type detection
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (ogImage) {
      const isVideo = isVideoByType || isVideoByUrl;
      console.log('✓ og:image in HTML, type:', isVideo ? 'video' : 'image', `(og:type=${ogType?.[1]}, urlType=${resourceType})`);
      return [{
        url: ogImage[1].replace(/&amp;/g, '&'),
        type: isVideo ? 'video' : 'image',
        thumbnail: isVideo ? ogImage[1].replace(/&amp;/g, '&') : undefined,
        filename: isVideo ? `instagram_video_${shortcode}.mp4` : `instagram_image_${shortcode}.jpg`,
      }];
    }
  } catch (e) {
    console.log('HTML scrape error:', e);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== Processing URL:', url);

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL do Instagram inválida.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resourceType = detectResourceType(url);
    console.log('Shortcode:', shortcode, '| Type:', resourceType);

    // Get session with CSRF token first
    const session = await getInstagramSession();

    let items: MediaItem[] = [];

    // Try strategies in order
    items = await fetchViaGraphQLWithSession(shortcode, session);
    if (!items.length) items = await fetchViaApiGraphQLWithSession(shortcode, session);
    if (!items.length) items = await fetchViaPublicApi(shortcode, resourceType);
    if (!items.length) items = await fetchViaEmbed(shortcode, resourceType);
    if (!items.length) items = await fetchViaHtmlScrape(shortcode, resourceType);

    items = items.filter(i => i.url && i.url.startsWith('http'));

    if (!items.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível extrair a mídia. O conteúdo pode ser privado ou restrito.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If URL indicates video but we only got thumbnail, mark it appropriately
    if ((resourceType === 'reel' || resourceType === 'tv') && items.every(i => i.type === 'image')) {
      console.log('⚠ URL is reel/tv but only images found - marking as video thumbnails');
      items = items.map(i => ({
        ...i,
        type: 'video' as const,
        thumbnail: i.url,
        filename: i.filename.replace(/\.jpg$/, '.mp4').replace('instagram_image_', 'instagram_video_'),
      }));
    }

    console.log(`✓ Found ${items.length} item(s):`, items.map(i => `${i.type}:${i.url.substring(0, 60)}`));

    return new Response(
      JSON.stringify({ success: true, items, type: items.length > 1 ? 'carousel' : items[0].type, count: items.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno ao processar o link.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
