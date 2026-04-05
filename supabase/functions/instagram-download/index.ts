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

type InstagramResource = 'p' | 'reel' | 'tv';

interface AccessCheckResult {
  blocked: boolean;
  reason?: string;
}

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function detectContentType(url: string): 'video' | 'image' {
  if (/\/reel\//i.test(url) || /\/reels\//i.test(url) || /\/tv\//i.test(url)) {
    return 'video';
  }
  return 'image';
}

function detectResourceType(url: string): InstagramResource {
  if (/\/reel\//i.test(url) || /\/reels\//i.test(url)) {
    return 'reel';
  }

  if (/\/tv\//i.test(url)) {
    return 'tv';
  }

  return 'p';
}

function buildInstagramPaths(shortcode: string, resourceType: InstagramResource): string[] {
  const preferred = resourceType === 'tv'
    ? [`tv/${shortcode}`, `reel/${shortcode}`, `p/${shortcode}`]
    : resourceType === 'reel'
      ? [`reel/${shortcode}`, `p/${shortcode}`, `tv/${shortcode}`]
      : [`p/${shortcode}`, `reel/${shortcode}`, `tv/${shortcode}`];

  return preferred;
}

async function checkInstagramAccess(shortcode: string, resourceType: InstagramResource): Promise<AccessCheckResult> {
  const url = `https://www.instagram.com/${resourceType}/${shortcode}/`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const html = await response.text();

    const hasRestrictedAge = /"restricted_age"\s*:\s*(?!false|null|0)\d+/.test(html);
    const unavailable = /This content is no longer available/i.test(html);

    if (hasRestrictedAge || unavailable) {
      return {
        blocked: true,
        reason: resourceType === 'reel' || resourceType === 'tv'
          ? 'Este conteúdo de vídeo está bloqueado pelo Instagram para visitantes sem sessão autenticada. Teste com outro Reel público.'
          : 'Este conteúdo não está acessível publicamente no Instagram no momento.',
      };
    }
  } catch (error) {
    console.log('Access check failed:', error);
  }

  return { blocked: false };
}

function extractFromGraphQLMedia(media: any): MediaItem[] {
  const items: MediaItem[] = [];

  // Carousel / sidecar
  if (media.edge_sidecar_to_children?.edges) {
    for (const edge of media.edge_sidecar_to_children.edges) {
      const node = edge.node;
      if (node.is_video || node.video_url) {
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
  } else if (media.is_video || media.video_url) {
    items.push({
      url: media.video_url,
      type: 'video',
      thumbnail: media.display_url || media.thumbnail_src,
      filename: `instagram_video_${media.id || Date.now()}.mp4`,
    });
  } else {
    items.push({
      url: media.display_url || media.thumbnail_src,
      type: 'image',
      filename: `instagram_image_${media.id || Date.now()}.jpg`,
    });
  }

  return items;
}

// Primary Strategy: GraphQL POST with doc_id (proven working method)
async function fetchViaGraphQLPost(shortcode: string, resourceType: InstagramResource): Promise<MediaItem[]> {
  console.log('Strategy: GraphQL POST with doc_id...');

  const body = new URLSearchParams({
    av: '0',
    __d: 'www',
    __user: '0',
    __a: '1',
    __req: 'b',
    __hs: '20183.HYP:instagram_web_pkg.2.1...0',
    dpr: '3',
    __ccg: 'GOOD',
    __rev: '1021613311',
    __s: 'hm5eih:ztapmw:x0losd',
    __hsi: '7489787314313612244',
    __dyn: '7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJw5ux609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swtUd8-U2zxe2GewGw9a361qw8Xxm16wa-0oa2-azo7u3C2u2J0bS1LwTwKG1pg2fwxyo6O1FwlA3a3zhA6bwIxe6V8aUuwm8jwhU3cyVrDyo',
    __csr: '',
    __comet_req: '7',
    lsd: 'AVrqPT0gJDo',
    jazoest: '2946',
    __spin_r: '1021613311',
    __spin_b: 'trunk',
    __spin_t: String(Math.floor(Date.now() / 1000)),
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'PolarisPostActionLoadPostQueryQuery',
    variables: JSON.stringify({
      shortcode: shortcode,
      fetch_tagged_user_count: null,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
    }),
    server_timestamps: 'true',
    doc_id: '8845758582119845',
  });

  try {
    const response = await fetch('https://www.instagram.com/graphql/query', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-FB-Friendly-Name': 'PolarisPostActionLoadPostQueryQuery',
        'X-CSRFToken': 'RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52',
        'X-IG-App-ID': '1217981644879628',
        'X-FB-LSD': 'AVrqPT0gJDo',
        'X-ASBD-ID': '359341',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Referer': `https://www.instagram.com/${resourceType}/${shortcode}/`,
      },
      body: body.toString(),
    });

    console.log('GraphQL POST status:', response.status);

    if (!response.ok) {
      console.log('GraphQL POST failed:', response.status);
      return [];
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      console.log('GraphQL POST returned non-JSON');
      return [];
    }

    const data = await response.json();
    const media = data?.data?.xdt_shortcode_media;
    if (media) {
      console.log('✓ Found xdt_shortcode_media, is_video:', media.is_video);
      return extractFromGraphQLMedia(media);
    }

    // Try alternative path
    const media2 = data?.data?.shortcode_media;
    if (media2) {
      console.log('✓ Found shortcode_media');
      return extractFromGraphQLMedia(media2);
    }

    console.log('GraphQL POST: no media in response. Keys:', Object.keys(data?.data || {}));
  } catch (e) {
    console.log('GraphQL POST error:', e);
  }
  return [];
}

// Fallback: Embed page scraping
async function fetchViaEmbed(shortcode: string, resourceType: InstagramResource): Promise<MediaItem[]> {
  console.log('Strategy: Embed page...');
  const paths = buildInstagramPaths(shortcode, resourceType);

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/embed/captioned/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      const html = await response.text();

      const videoUrlMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
      if (videoUrlMatch) {
        const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
        console.log('✓ Found video_url in embed via', path);
        return [{
          url: videoUrl,
          type: 'video',
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      const ogVideoMatch = html.match(/<meta\s+(?:property="og:video"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:video")/i);
      if (ogVideoMatch) {
        console.log('✓ Found og:video in embed via', path);
        return [{
          url: (ogVideoMatch[1] || ogVideoMatch[2]).replace(/&amp;/g, '&'),
          type: 'video',
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      const ogImageMatch = html.match(/<meta\s+(?:property="og:image"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:image")/i);
      if (ogImageMatch) {
        console.log('✓ Found og:image in embed via', path);
        const imgUrl = (ogImageMatch[1] || ogImageMatch[2]).replace(/&amp;/g, '&');
        return [{
          url: imgUrl,
          type: 'image',
          filename: `instagram_image_${shortcode}.jpg`,
        }];
      }
    } catch (e) {
      console.log('Embed error for path', path, e);
    }
  }

  return [];
}

// Fallback: Direct page scraping
async function fetchViaDirectPage(shortcode: string, resourceType: InstagramResource): Promise<MediaItem[]> {
  console.log('Strategy: Direct page...');
  const paths = buildInstagramPaths(shortcode, resourceType);

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
        },
        redirect: 'follow',
      });
      const html = await response.text();

      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/s);
      if (sharedDataMatch) {
        try {
          const data = JSON.parse(sharedDataMatch[1]);
          const media = data?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
          if (media) return extractFromGraphQLMedia(media);
        } catch (_e) { /* ignore */ }
      }

      const additionalDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s);
      if (additionalDataMatch) {
        try {
          const data = JSON.parse(additionalDataMatch[1]);
          const media = data?.graphql?.shortcode_media || data?.items?.[0];
          if (media) return extractFromGraphQLMedia(media);
        } catch (_e) { /* ignore */ }
      }

      const videoUrlMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
      if (videoUrlMatch) {
        console.log('✓ Found video_url in direct page via', path);
        return [{
          url: videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'),
          type: 'video',
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      const ogVideoMatch = html.match(/<meta\s+(?:property="og:video"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:video")/i);
      if (ogVideoMatch) {
        console.log('✓ Found og:video in direct page via', path);
        return [{
          url: (ogVideoMatch[1] || ogVideoMatch[2]).replace(/&amp;/g, '&'),
          type: 'video',
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      const ogImageMatch = html.match(/<meta\s+(?:property="og:image"\s+content="([^"]+)"|content="([^"]+)"\s+property="og:image")/i);
      if (ogImageMatch) {
        console.log('✓ Found og:image in direct page via', path);
        return [{
          url: (ogImageMatch[1] || ogImageMatch[2]).replace(/&amp;/g, '&'),
          type: 'image',
          filename: `instagram_image_${shortcode}.jpg`,
        }];
      }
    } catch (e) {
      console.log('Direct page error for path', path, e);
    }
  }

  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing URL:', url);

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL do Instagram inválida.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expectedType = detectContentType(url);
    const resourceType = detectResourceType(url);
    console.log('Shortcode:', shortcode, '| Expected:', expectedType, '| Resource:', resourceType);

    const accessCheck = await checkInstagramAccess(shortcode, resourceType);
    if (accessCheck.blocked) {
      return new Response(
        JSON.stringify({ success: false, error: accessCheck.reason }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let items: MediaItem[] = [];

    // Strategy 1: GraphQL POST (most reliable)
    items = await fetchViaGraphQLPost(shortcode, resourceType);

    // Strategy 2: Embed page
    if (items.length === 0) {
      items = await fetchViaEmbed(shortcode, resourceType);
    }

    // Strategy 3: Direct page
    if (items.length === 0) {
      items = await fetchViaDirectPage(shortcode, resourceType);
    }

    // If we expected video but only got images, flag it
    if (items.length > 0 && expectedType === 'video' && !items.some(i => i.type === 'video')) {
      console.log('⚠ Expected video but only got image thumbnails');
    }

    if (items.length === 0) {
      const extractionError = expectedType === 'video'
        ? 'Este Reel/IGTV/Story não expõe um arquivo de vídeo público direto no Instagram neste momento.'
        : 'Não foi possível extrair a mídia; o Instagram não expôs um arquivo público direto para este link.';

      return new Response(
        JSON.stringify({ success: false, error: extractionError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${items.length} item(s):`, items.map(i => `${i.type}`));

    return new Response(
      JSON.stringify({ success: true, items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro ao processar o link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
