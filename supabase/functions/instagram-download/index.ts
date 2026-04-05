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
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
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
        items.push({
          url: node.video_url,
          type: 'video',
          thumbnail: node.display_url,
          filename: `instagram_video_${node.id || Date.now()}.mp4`,
        });
      } else {
        items.push({
          url: node.display_url,
          type: 'image',
          filename: `instagram_image_${node.id || Date.now()}.jpg`,
        });
      }
    }
    return items;
  }

  if (media.is_video && media.video_url) {
    items.push({
      url: media.video_url,
      type: 'video',
      thumbnail: media.display_url || media.thumbnail_src,
      filename: `instagram_video_${media.id || Date.now()}.mp4`,
    });
  } else if (media.display_url) {
    items.push({
      url: media.display_url,
      type: media.is_video ? 'video' : 'image',
      filename: media.is_video
        ? `instagram_video_${media.id || Date.now()}.mp4`
        : `instagram_image_${media.id || Date.now()}.jpg`,
    });
  }

  return items;
}

function extractFromApiMedia(item: any): MediaItem[] {
  const items: MediaItem[] = [];

  if (item.carousel_media) {
    for (const cm of item.carousel_media) {
      if (cm.video_versions?.length) {
        items.push({
          url: cm.video_versions[0].url,
          type: 'video',
          thumbnail: cm.image_versions2?.candidates?.[0]?.url,
          filename: `instagram_video_${cm.pk || Date.now()}.mp4`,
        });
      } else if (cm.image_versions2?.candidates?.length) {
        items.push({
          url: cm.image_versions2.candidates[0].url,
          type: 'image',
          filename: `instagram_image_${cm.pk || Date.now()}.jpg`,
        });
      }
    }
    return items;
  }

  if (item.video_versions?.length) {
    items.push({
      url: item.video_versions[0].url,
      type: 'video',
      thumbnail: item.image_versions2?.candidates?.[0]?.url,
      filename: `instagram_video_${item.pk || Date.now()}.mp4`,
    });
    return items;
  }

  if (item.image_versions2?.candidates?.length) {
    items.push({
      url: item.image_versions2.candidates[0].url,
      type: item.media_type === 2 ? 'video' : 'image',
      filename: item.media_type === 2
        ? `instagram_video_${item.pk || Date.now()}.mp4`
        : `instagram_image_${item.pk || Date.now()}.jpg`,
    });
  }

  return items;
}

async function parseJsonResponse(response: Response): Promise<any | null> {
  try {
    const text = await response.text();
    if (!text || text.length < 2) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Deep search for media in any nested structure
function deepExtractMedia(obj: any, shortcode: string, resourceType: string): MediaItem[] {
  if (!obj || typeof obj !== 'object') return [];

  // Check for video_url at current level
  if (obj.video_url) {
    return [{
      url: obj.video_url,
      type: 'video',
      thumbnail: obj.display_url || obj.thumbnail_src,
      filename: `instagram_video_${shortcode}.mp4`,
    }];
  }

  // Check for video_versions at current level
  if (obj.video_versions?.length) {
    return [{
      url: obj.video_versions[0].url,
      type: 'video',
      thumbnail: obj.image_versions2?.candidates?.[0]?.url,
      filename: `instagram_video_${shortcode}.mp4`,
    }];
  }

  // Check for known media containers
  if (obj.shortcode_media) return extractFromGraphQLMedia(obj.shortcode_media);
  if (obj.xdt_shortcode_media) return extractFromGraphQLMedia(obj.xdt_shortcode_media);
  if (obj.items?.length) return extractFromApiMedia(obj.items[0]);

  // Recurse into data property
  if (obj.data) {
    const result = deepExtractMedia(obj.data, shortcode, resourceType);
    if (result.length) return result;
  }

  // Recurse into xdt_api paths
  for (const key of Object.keys(obj)) {
    if (key.startsWith('xdt_') && typeof obj[key] === 'object') {
      const result = deepExtractMedia(obj[key], shortcode, resourceType);
      if (result.length) return result;
    }
  }

  return [];
}

// Strategy 1: ?__a=1&__d=dis endpoint (widely used by download tools)
async function fetchViaPublicApi(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 1: Public API (?__a=1&__d=dis)...');

  const paths = resourceType === 'reel'
    ? [`reel/${shortcode}`, `p/${shortcode}`]
    : resourceType === 'tv'
      ? [`tv/${shortcode}`, `p/${shortcode}`]
      : [`p/${shortcode}`];

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/?__a=1&__d=dis`, {
        headers: {
          'User-Agent': randomUA(),
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.instagram.com/',
          'X-IG-App-ID': '936619743392459',
          'X-Requested-With': 'XMLHttpRequest',
        },
        redirect: 'follow',
      });

      console.log(`Public API (${path}) status:`, response.status);
      if (!response.ok) continue;

      const data = await parseJsonResponse(response);
      if (!data) continue;

      console.log('Public API response keys:', JSON.stringify(Object.keys(data)).substring(0, 200));

      // Try standard paths
      if (data.graphql?.shortcode_media) {
        console.log('✓ Found graphql.shortcode_media');
        return extractFromGraphQLMedia(data.graphql.shortcode_media);
      }

      if (data.items?.length) {
        console.log('✓ Found items array');
        return extractFromApiMedia(data.items[0]);
      }

      // Deep search
      const items = deepExtractMedia(data, shortcode, resourceType);
      if (items.length) {
        console.log('✓ Found via deep search');
        return items;
      }
    } catch (e) {
      console.log('Public API error:', e);
    }
  }
  return [];
}

// Strategy 2: GraphQL POST with multiple doc_ids
async function fetchViaGraphQL(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 2: GraphQL POST...');

  const docIds = [
    '8845758582119845',
    '25981206651899035',
    '10015901848480474',
    '24368985919464652',
    '9496293753735676',
    '7153639831340752',
  ];

  for (const docId of docIds) {
    try {
      const body = new URLSearchParams({
        variables: JSON.stringify({ shortcode }),
        doc_id: docId,
      });

      const response = await fetch('https://www.instagram.com/graphql/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': randomUA(),
          'X-IG-App-ID': '936619743392459',
          'X-FB-LSD': 'AVqbxe3J_YA',
          'X-ASBD-ID': '129477',
          'Origin': 'https://www.instagram.com',
          'Referer': 'https://www.instagram.com/',
        },
        body: body.toString(),
      });

      console.log(`GraphQL doc_id ${docId} status:`, response.status);
      if (!response.ok) continue;

      const data = await parseJsonResponse(response);
      if (!data) continue;

      // Log response structure for debugging
      const dataKeys = data?.data ? Object.keys(data.data) : [];
      console.log(`GraphQL ${docId} data keys:`, JSON.stringify(dataKeys).substring(0, 200));

      // Try deep extraction
      const items = deepExtractMedia(data, shortcode, 'p');
      if (items.length) {
        console.log(`✓ GraphQL doc_id ${docId} success:`, items.map(i => i.type));
        return items;
      }

      // If data.data exists but no media found, log more detail
      if (data?.data) {
        for (const key of dataKeys) {
          const val = data.data[key];
          if (val && typeof val === 'object') {
            console.log(`  ${key} sub-keys:`, JSON.stringify(Object.keys(val)).substring(0, 300));
          }
        }
      }
    } catch (e) {
      console.log(`GraphQL ${docId} error:`, e);
    }
  }
  return [];
}

// Strategy 3: /api/graphql endpoint with POST body
async function fetchViaApiGraphQL(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 3: /api/graphql POST...');

  const docIds = ['10015901848480474', '8845758582119845'];

  for (const docId of docIds) {
    try {
      const body = `variables=${encodeURIComponent(JSON.stringify({ shortcode, fetch_tagged_user_count: null, hoisted_comment_id: null, hoisted_reply_id: null }))}&doc_id=${docId}&lsd=AVqbxe3J_YA`;

      const response = await fetch('https://www.instagram.com/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': randomUA(),
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'X-FB-LSD': 'AVqbxe3J_YA',
          'X-IG-App-ID': '936619743392459',
          'X-ASBD-ID': '129477',
          'X-CSRFToken': 'missing',
          'Sec-Fetch-Site': 'same-origin',
          'Origin': 'https://www.instagram.com',
          'Referer': 'https://www.instagram.com/',
        },
        body,
      });

      console.log(`/api/graphql ${docId} status:`, response.status);
      if (!response.ok) continue;

      const text = await response.text();
      console.log(`/api/graphql ${docId} response length:`, text.length, 'preview:', text.substring(0, 300));

      // Instagram sometimes returns multiple JSON objects separated by newlines
      const lines = text.split('\n').filter(l => l.trim().startsWith('{'));
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const items = deepExtractMedia(data, shortcode, 'p');
          if (items.length) {
            console.log(`✓ /api/graphql ${docId} success`);
            return items;
          }
        } catch { /* skip invalid json lines */ }
      }
    } catch (e) {
      console.log(`/api/graphql error:`, e);
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

      // Check for video_url in any script/JSON
      const videoUrlMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
      if (videoUrlMatch) {
        const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        console.log('✓ Found video_url in embed');
        const thumbMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
        const thumbnail = thumbMatch ? thumbMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/') : undefined;
        return [{
          url: videoUrl,
          type: 'video',
          thumbnail,
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      // Check for video in embed data
      const embedDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)/s);
      if (embedDataMatch) {
        try {
          const embedData = JSON.parse(embedDataMatch[1]);
          const items = deepExtractMedia(embedData, shortcode, resourceType);
          if (items.length) {
            console.log('✓ Found media in embed additionalData');
            return items;
          }
        } catch { /* ignore */ }
      }

      // og:video
      const ogVideoMatch = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:video"/i);
      if (ogVideoMatch) {
        console.log('✓ Found og:video in embed');
        return [{
          url: ogVideoMatch[1].replace(/&amp;/g, '&'),
          type: 'video',
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      // For reels/tv, check if og:type indicates video
      const ogType = html.match(/<meta[^>]+property="og:type"[^>]+content="([^"]+)"/i);
      const isVideoType = ogType && ogType[1].includes('video');

      // display_url (but respect og:type)
      const displayUrlMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (displayUrlMatch) {
        const displayUrl = displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        console.log('✓ Found display_url in embed, isVideoType:', isVideoType);
        return [{
          url: displayUrl,
          type: (isVideoType || resourceType === 'reel' || resourceType === 'tv') ? 'video' : 'image',
          filename: (isVideoType || resourceType === 'reel' || resourceType === 'tv')
            ? `instagram_video_${shortcode}.mp4`
            : `instagram_image_${shortcode}.jpg`,
        }];
      }

      // og:image as last resort
      const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
      if (ogImageMatch) {
        console.log('✓ Found og:image in embed, isVideoType:', isVideoType, 'resourceType:', resourceType);
        // If we know it's a reel/tv, still return as video thumbnail (user gets the thumbnail but type is correct)
        return [{
          url: ogImageMatch[1].replace(/&amp;/g, '&'),
          type: (isVideoType || resourceType === 'reel' || resourceType === 'tv') ? 'video' : 'image',
          filename: (isVideoType || resourceType === 'reel' || resourceType === 'tv')
            ? `instagram_video_${shortcode}.mp4`
            : `instagram_image_${shortcode}.jpg`,
        }];
      }
    } catch (e) {
      console.log('Embed error:', e);
    }
  }
  return [];
}

// Strategy 5: Direct HTML page scraping with enhanced parsing
async function fetchViaHtmlScrape(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 5: HTML scrape...');

  const path = resourceType === 'reel' ? `reel/${shortcode}` : resourceType === 'tv' ? `tv/${shortcode}` : `p/${shortcode}`;

  try {
    const response = await fetch(`https://www.instagram.com/${path}/`, {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!response.ok) return [];
    const html = await response.text();

    // Try to find video_url anywhere in the HTML
    const videoMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (videoMatch) {
      console.log('✓ Found video_url in HTML');
      return [{
        url: videoMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // _sharedData
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});\s*<\/script>/s);
    if (sharedDataMatch) {
      try {
        const data = JSON.parse(sharedDataMatch[1]);
        const items = deepExtractMedia(data, shortcode, resourceType);
        if (items.length) {
          console.log('✓ Found media in _sharedData');
          return items;
        }
      } catch { /* ignore */ }
    }

    // __additionalDataLoaded
    const additionalMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s);
    if (additionalMatch) {
      try {
        const data = JSON.parse(additionalMatch[1]);
        const items = deepExtractMedia(data, shortcode, resourceType);
        if (items.length) {
          console.log('✓ Found media in __additionalDataLoaded');
          return items;
        }
      } catch { /* ignore */ }
    }

    // Look for JSON data in script tags
    const scriptMatches = html.matchAll(/<script[^>]*type="application\/json"[^>]*>([^<]+)<\/script>/gi);
    for (const m of scriptMatches) {
      try {
        const data = JSON.parse(m[1]);
        const items = deepExtractMedia(data, shortcode, resourceType);
        if (items.length) {
          console.log('✓ Found media in script tag');
          return items;
        }
      } catch { /* skip */ }
    }

    // Check og:type to determine if this is a video
    const ogType = html.match(/<meta[^>]+property="og:type"[^>]+content="([^"]+)"/i);
    const isVideoByOgType = ogType && ogType[1].includes('video');
    const isVideoByUrl = resourceType === 'reel' || resourceType === 'tv';

    // og:video
    const ogVideo = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:video"/i);
    if (ogVideo) {
      console.log('✓ Found og:video in HTML');
      return [{
        url: ogVideo[1].replace(/&amp;/g, '&'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // og:image - use resource type info to set correct type
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (ogImage) {
      const isVideo = isVideoByOgType || isVideoByUrl;
      console.log('✓ Found og:image in HTML. og:type video:', isVideoByOgType, 'URL type video:', isVideoByUrl);
      return [{
        url: ogImage[1].replace(/&amp;/g, '&'),
        type: isVideo ? 'video' : 'image',
        thumbnail: isVideo ? ogImage[1].replace(/&amp;/g, '&') : undefined,
        filename: isVideo
          ? `instagram_video_${shortcode}.mp4`
          : `instagram_image_${shortcode}.jpg`,
      }];
    }
  } catch (e) {
    console.log('HTML scrape error:', e);
  }
  return [];
}

// Strategy 6: Instagram oembed API (gets thumbnail + metadata)
async function fetchViaOembed(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 6: oEmbed API...');

  const permalink = resourceType === 'reel'
    ? `https://www.instagram.com/reel/${shortcode}/`
    : `https://www.instagram.com/p/${shortcode}/`;

  try {
    const response = await fetch(
      `https://api.instagram.com/oembed/?url=${encodeURIComponent(permalink)}&omitscript=true`,
      {
        headers: {
          'User-Agent': randomUA(),
          'Accept': 'application/json',
        },
      }
    );

    console.log('oEmbed status:', response.status);
    if (!response.ok) return [];

    const data = await parseJsonResponse(response);
    if (!data) return [];

    console.log('oEmbed data:', JSON.stringify({ type: data.type, title: data.title?.substring(0, 50), hasThumb: !!data.thumbnail_url }));

    if (data.thumbnail_url) {
      const isVideo = data.type === 'video' || resourceType === 'reel' || resourceType === 'tv';
      return [{
        url: data.thumbnail_url,
        type: isVideo ? 'video' : 'image',
        thumbnail: data.thumbnail_url,
        filename: isVideo
          ? `instagram_video_${shortcode}.mp4`
          : `instagram_image_${shortcode}.jpg`,
      }];
    }
  } catch (e) {
    console.log('oEmbed error:', e);
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
        JSON.stringify({ success: false, error: 'URL do Instagram inválida. Verifique o link e tente novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resourceType = detectResourceType(url);
    console.log('Shortcode:', shortcode, '| Type:', resourceType);

    let items: MediaItem[] = [];

    // Strategy 1: Public API (?__a=1&__d=dis) - most widely used
    items = await fetchViaPublicApi(shortcode, resourceType);

    // Strategy 2: GraphQL POST with multiple doc_ids
    if (!items.length) items = await fetchViaGraphQL(shortcode);

    // Strategy 3: /api/graphql POST
    if (!items.length) items = await fetchViaApiGraphQL(shortcode);

    // Strategy 4: Embed page scraping
    if (!items.length) items = await fetchViaEmbed(shortcode, resourceType);

    // Strategy 5: Direct HTML scraping
    if (!items.length) items = await fetchViaHtmlScrape(shortcode, resourceType);

    // Strategy 6: oEmbed API
    if (!items.length) items = await fetchViaOembed(shortcode, resourceType);

    // Filter valid URLs
    items = items.filter(i => i.url && i.url.startsWith('http'));

    if (!items.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível extrair a mídia deste link. O conteúdo pode ser privado, restrito por idade, ou temporariamente indisponível.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✓ Found ${items.length} item(s):`, items.map(i => `${i.type}:${i.url.substring(0, 80)}`));

    return new Response(
      JSON.stringify({
        success: true,
        items,
        type: items.length > 1 ? 'carousel' : items[0].type,
        count: items.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno ao processar o link. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
