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
    items.push({ url: item.image_versions2.candidates[0].url, type: item.media_type === 2 ? 'video' : 'image', filename: `instagram_image_${item.pk || Date.now()}.jpg` });
  }
  return items;
}

function deepExtractMedia(obj: any, shortcode: string): MediaItem[] {
  if (!obj || typeof obj !== 'object') return [];
  if (obj.video_url) return [{ url: obj.video_url, type: 'video', thumbnail: obj.display_url, filename: `instagram_video_${shortcode}.mp4` }];
  if (obj.video_versions?.length) return [{ url: obj.video_versions[0].url, type: 'video', thumbnail: obj.image_versions2?.candidates?.[0]?.url, filename: `instagram_video_${shortcode}.mp4` }];
  if (obj.shortcode_media) return extractFromGraphQLMedia(obj.shortcode_media);
  if (obj.xdt_shortcode_media) return extractFromGraphQLMedia(obj.xdt_shortcode_media);
  const webInfo = obj.xdt_api__v1__media__shortcode__web_info;
  if (webInfo?.items?.length) return extractFromApiMedia(webInfo.items[0]);
  if (obj.items?.length && (obj.items[0]?.video_versions || obj.items[0]?.image_versions2)) return extractFromApiMedia(obj.items[0]);
  if (obj.data) { const r = deepExtractMedia(obj.data, shortcode); if (r.length) return r; }
  for (const key of Object.keys(obj)) {
    if (key.startsWith('xdt_') && typeof obj[key] === 'object') {
      const r = deepExtractMedia(obj[key], shortcode); if (r.length) return r;
    }
  }
  return [];
}

// Build the full request body mimicking a real browser (reelflow approach)
function buildGraphQLBody(shortcode: string): string {
  const params: Record<string, string> = {
    av: '0',
    __d: 'www',
    __user: '0',
    __a: '1',
    __req: '3',
    __hs: '19624.HYP:instagram_web_pkg.2.1..0.0',
    dpr: '3',
    __ccg: 'UNKNOWN',
    __rev: '1008824440',
    __s: 'xf44ne:zhh75g:xr51e7',
    __hsi: '7282217488877343271',
    __dyn: '7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78b87C0yE5ufz81s8hwGwQwoEcE7O2l0Fwqo31w9a9x-0z8-U2zxe2GewGwso88cobEaU2eUlwhEe87q7-0iK2S3qazo7u1xwIw8O321LwTwKG1pg661pwr86C1mwraCg',
    __csr: 'gZ3yFmJkillQvV6ybimnG8AmhqujGbLADgjyEOWz49z9XDlAXBJpC7Wy-vQTSvUGWGh5u8KibG44dBiigrgjDxGjU0150Q0848azk48N09C02IR0go4SaR70r8owyg9pU0V23hwiA0LQczA48S0f-x-27o05NG0fkw',
    __comet_req: '7',
    lsd: 'AVqbxe3J_YA',
    jazoest: '2957',
    __spin_r: '1008824440',
    __spin_b: 'trunk',
    __spin_t: '1695523385',
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'PolarisPostActionLoadPostQueryQuery',
    variables: JSON.stringify({
      shortcode,
      fetch_comment_count: 'null',
      fetch_related_profile_media_count: 'null',
      parent_comment_count: 'null',
      child_comment_count: 'null',
      fetch_like_count: 'null',
      fetch_tagged_user_count: 'null',
      fetch_preview_comment_count: 'null',
      has_threaded_comments: 'false',
      hoisted_comment_id: 'null',
      hoisted_reply_id: 'null',
    }),
    server_timestamps: 'true',
    doc_id: '10015901848480474',
  };

  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// Strategy 1: Full GraphQL query mimicking real browser (reelflow method)
async function fetchViaFullGraphQL(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 1: Full GraphQL (reelflow method)...');

  const body = buildGraphQLBody(shortcode);

  const headers: Record<string, string> = {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-FB-Friendly-Name': 'PolarisPostActionLoadPostQueryQuery',
    'X-CSRFToken': 'RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52',
    'X-IG-App-ID': '1217981644879628',
    'X-FB-LSD': 'AVqbxe3J_YA',
    'X-ASBD-ID': '129477',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
  };

  try {
    const response = await fetch('https://www.instagram.com/api/graphql', {
      method: 'POST',
      headers,
      body,
    });

    console.log('Full GraphQL status:', response.status);
    if (!response.ok) return [];

    const text = await response.text();
    console.log('Full GraphQL response length:', text.length);

    // Parse potentially multi-line JSON
    const lines = text.split('\n').filter(l => l.trim().startsWith('{'));
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const items = deepExtractMedia(data, shortcode);
        if (items.length) {
          console.log('✓ Full GraphQL success:', items.map(i => i.type));
          return items;
        }
        if (data?.data) {
          const keys = Object.keys(data.data);
          console.log('Full GraphQL data keys:', keys);
          for (const k of keys) {
            const v = data.data[k];
            if (v === null) console.log(`  ${k}: null`);
            else if (typeof v === 'object') console.log(`  ${k} keys:`, Object.keys(v).slice(0, 10));
          }
        }
      } catch { /* skip */ }
    }
  } catch (e) {
    console.log('Full GraphQL error:', e);
  }
  return [];
}

// Strategy 2: Alternative doc_ids with the same full body
async function fetchViaAlternativeDocIds(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 2: Alternative doc_ids...');

  const docIds = ['8845758582119845', '24368985919464652', '25981206651899035', '9496293753735676', '7153639831340752'];

  for (const docId of docIds) {
    try {
      const body = `variables=${encodeURIComponent(JSON.stringify({ shortcode }))}&doc_id=${docId}`;

      const response = await fetch('https://www.instagram.com/graphql/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
          'X-IG-App-ID': '1217981644879628',
          'X-FB-LSD': 'AVqbxe3J_YA',
          'X-CSRFToken': 'RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52',
          'Origin': 'https://www.instagram.com',
          'Referer': 'https://www.instagram.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        body,
      });

      console.log(`Alt doc_id ${docId} status:`, response.status);
      if (!response.ok) continue;

      const text = await response.text();
      const lines = text.split('\n').filter(l => l.trim().startsWith('{'));
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const items = deepExtractMedia(data, shortcode);
          if (items.length) {
            console.log(`✓ Alt doc_id ${docId} success`);
            return items;
          }
        } catch { /* skip */ }
      }
    } catch (e) {
      console.log(`Alt doc_id ${docId} error:`, e);
    }
  }
  return [];
}

// Strategy 3: ?__a=1&__d=dis
async function fetchViaPublicApi(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 3: Public API...');

  const paths = resourceType === 'reel' ? [`reel/${shortcode}`, `p/${shortcode}`] : [`p/${shortcode}`];

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/?__a=1&__d=dis`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
          'Accept': '*/*',
          'X-IG-App-ID': '1217981644879628',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
        },
      });

      console.log(`Public API (${path}) status:`, response.status);
      if (!response.ok) continue;

      const data = await response.json().catch(() => null);
      if (!data) continue;

      const items = deepExtractMedia(data, shortcode);
      if (items.length) { console.log('✓ Public API success'); return items; }
      if (data.graphql?.shortcode_media) return extractFromGraphQLMedia(data.graphql.shortcode_media);
      if (data.items?.length) return extractFromApiMedia(data.items[0]);
    } catch (e) {
      console.log('Public API error:', e);
    }
  }
  return [];
}

// Strategy 4: Embed page
async function fetchViaEmbed(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 4: Embed page...');

  const paths = resourceType === 'reel' ? [`reel/${shortcode}`, `p/${shortcode}`] : [`p/${shortcode}`];

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/embed/captioned/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
      if (!response.ok) continue;
      const html = await response.text();

      // video_url in JSON
      const videoMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
      if (videoMatch) {
        const videoUrl = videoMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        console.log('✓ video_url in embed');
        const thumbMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
        return [{ url: videoUrl, type: 'video', thumbnail: thumbMatch ? thumbMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/') : undefined, filename: `instagram_video_${shortcode}.mp4` }];
      }

      // og:video
      const ogVideo = html.match(/<meta[^>]+property="og:video(?::url)?"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:video"/i);
      if (ogVideo) {
        console.log('✓ og:video in embed');
        return [{ url: ogVideo[1].replace(/&amp;/g, '&'), type: 'video', filename: `instagram_video_${shortcode}.mp4` }];
      }

      // display_url
      const displayUrl = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (displayUrl) {
        const url = displayUrl[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        const isVideo = resourceType === 'reel' || resourceType === 'tv';
        return [{ url, type: isVideo ? 'video' : 'image', filename: isVideo ? `instagram_video_${shortcode}.mp4` : `instagram_image_${shortcode}.jpg` }];
      }

      // og:image
      const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
      if (ogImage) {
        const isVideo = resourceType === 'reel' || resourceType === 'tv';
        return [{ url: ogImage[1].replace(/&amp;/g, '&'), type: isVideo ? 'video' : 'image', filename: isVideo ? `instagram_video_${shortcode}.mp4` : `instagram_image_${shortcode}.jpg` }];
      }
    } catch (e) {
      console.log('Embed error:', e);
    }
  }
  return [];
}

// Strategy 5: HTML page scrape
async function fetchViaHtml(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 5: HTML scrape...');

  const path = resourceType === 'reel' ? `reel/${shortcode}` : resourceType === 'tv' ? `tv/${shortcode}` : `p/${shortcode}`;

  try {
    const response = await fetch(`https://www.instagram.com/${path}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
      },
      redirect: 'follow',
    });

    if (!response.ok) return [];
    const html = await response.text();

    // video_url
    const videoMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (videoMatch) {
      console.log('✓ video_url in HTML');
      return [{ url: videoMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'), type: 'video', filename: `instagram_video_${shortcode}.mp4` }];
    }

    // _sharedData / __additionalDataLoaded
    for (const pattern of [
      /window\._sharedData\s*=\s*({.+?});\s*<\/script>/s,
      /window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s,
    ]) {
      const match = html.match(pattern);
      if (match) {
        try {
          const items = deepExtractMedia(JSON.parse(match[1]), shortcode);
          if (items.length) return items;
        } catch { /* */ }
      }
    }

    // Script tags
    const scriptMatches = html.matchAll(/<script[^>]*type="application\/json"[^>]*>([^<]+)<\/script>/gi);
    for (const m of scriptMatches) {
      try {
        const items = deepExtractMedia(JSON.parse(m[1]), shortcode);
        if (items.length) return items;
      } catch { /* */ }
    }

    // og:video
    const ogVideo = html.match(/<meta[^>]+property="og:video(?::url)?"[^>]+content="([^"]+)"/i);
    if (ogVideo) {
      console.log('✓ og:video in HTML');
      return [{ url: ogVideo[1].replace(/&amp;/g, '&'), type: 'video', filename: `instagram_video_${shortcode}.mp4` }];
    }

    // og:image with type detection
    const ogType = html.match(/<meta[^>]+property="og:type"[^>]+content="([^"]+)"/i);
    const isVideoByType = ogType && ogType[1].includes('video');
    const isVideoByUrl = resourceType === 'reel' || resourceType === 'tv';

    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    if (ogImage) {
      const isVideo = isVideoByType || isVideoByUrl;
      console.log('✓ og:image in HTML, video:', isVideo, `(og:type=${ogType?.[1]})`);
      return [{
        url: ogImage[1].replace(/&amp;/g, '&'),
        type: isVideo ? 'video' : 'image',
        thumbnail: isVideo ? ogImage[1].replace(/&amp;/g, '&') : undefined,
        filename: isVideo ? `instagram_video_${shortcode}.mp4` : `instagram_image_${shortcode}.jpg`,
      }];
    }
  } catch (e) {
    console.log('HTML error:', e);
  }
  return [];
}

// Strategy 0: RapidAPI Instagram Downloader
async function fetchViaRapidAPI(instagramUrl: string): Promise<MediaItem[]> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY');
  const apiHost = Deno.env.get('RAPIDAPI_HOST');
  
  if (!apiKey || !apiHost) {
    console.log('RapidAPI: keys not configured, skipping');
    return [];
  }

  console.log('Strategy 0: RapidAPI...');

  try {
    const encodedUrl = encodeURIComponent(instagramUrl);
    const response = await fetch(`https://${apiHost}/media?url=${encodedUrl}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
    });

    console.log('RapidAPI status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('RapidAPI error body:', text.substring(0, 500));
      return [];
    }

    const data = await response.json();
    console.log('RapidAPI response keys:', Object.keys(data));

    const items: MediaItem[] = [];

    // Handle different response formats from various RapidAPI Instagram APIs
    if (data.media && Array.isArray(data.media)) {
      for (const m of data.media) {
        if (m.type === 'video' || m.video_url) {
          items.push({ url: m.video_url || m.url, type: 'video', thumbnail: m.thumbnail || m.image_url, filename: `instagram_video_${Date.now()}_${items.length}.mp4` });
        } else {
          items.push({ url: m.image_url || m.url, type: 'image', filename: `instagram_image_${Date.now()}_${items.length}.jpg` });
        }
      }
    } else if (data.result && Array.isArray(data.result)) {
      for (const r of data.result) {
        const isVideo = r.type === 'video' || r.url?.includes('.mp4');
        items.push({ url: r.url || r.download_url, type: isVideo ? 'video' : 'image', thumbnail: r.thumbnail, filename: isVideo ? `instagram_video_${Date.now()}_${items.length}.mp4` : `instagram_image_${Date.now()}_${items.length}.jpg` });
      }
    } else if (data.video_url || data.image_url) {
      if (data.video_url) {
        items.push({ url: data.video_url, type: 'video', thumbnail: data.thumbnail_url || data.image_url, filename: `instagram_video_${Date.now()}.mp4` });
      } else {
        items.push({ url: data.image_url, type: 'image', filename: `instagram_image_${Date.now()}.jpg` });
      }
    } else if (data.url) {
      const isVideo = data.type === 'video' || data.is_video || data.url?.includes('.mp4');
      items.push({ url: data.url, type: isVideo ? 'video' : 'image', filename: isVideo ? `instagram_video_${Date.now()}.mp4` : `instagram_image_${Date.now()}.jpg` });
    } else if (data.download_url) {
      const isVideo = data.type === 'video' || data.download_url?.includes('.mp4');
      items.push({ url: data.download_url, type: isVideo ? 'video' : 'image', filename: isVideo ? `instagram_video_${Date.now()}.mp4` : `instagram_image_${Date.now()}.jpg` });
    }

    if (items.length) {
      console.log('✓ RapidAPI success:', items.map(i => `${i.type}:${i.url.substring(0, 80)}`));
    } else {
      console.log('RapidAPI: could not parse response, full data:', JSON.stringify(data).substring(0, 1000));
    }

    return items;
  } catch (e) {
    console.log('RapidAPI error:', e);
    return [];
  }
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

    let items: MediaItem[] = [];

    // Try RapidAPI first (most reliable)
    items = await fetchViaRapidAPI(url);
    
    // Fallback to scraping strategies
    if (!items.length) items = await fetchViaFullGraphQL(shortcode);
    if (!items.length) items = await fetchViaAlternativeDocIds(shortcode);
    if (!items.length) items = await fetchViaPublicApi(shortcode, resourceType);
    if (!items.length) items = await fetchViaEmbed(shortcode, resourceType);
    if (!items.length) items = await fetchViaHtml(shortcode, resourceType);

    items = items.filter(i => i.url && i.url.startsWith('http'));

    if (!items.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível extrair a mídia. O conteúdo pode ser privado ou restrito.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✓ Found ${items.length} item(s):`, items.map(i => `${i.type}:${i.url.substring(0, 80)}`));

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
