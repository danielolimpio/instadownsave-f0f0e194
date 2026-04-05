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

  // Carousel
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
      type: 'image',
      filename: `instagram_image_${media.id || Date.now()}.jpg`,
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
      type: 'image',
      filename: `instagram_image_${item.pk || Date.now()}.jpg`,
    });
  }

  return items;
}

// Try to parse response regardless of content-type
async function parseJsonResponse(response: Response): Promise<any | null> {
  try {
    const text = await response.text();
    if (!text || text.length < 2) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Extract media from any GraphQL response structure
function extractFromAnyGraphQL(data: any): MediaItem[] {
  if (!data?.data) return [];
  
  // Try all known response paths
  const media = data.data.xdt_shortcode_media 
    || data.data.shortcode_media;
  
  if (media) return extractFromGraphQLMedia(media);

  // xdt_api__v1__media__shortcode__web_info structure
  const webInfo = data.data.xdt_api__v1__media__shortcode__web_info;
  if (webInfo?.items?.length) {
    return extractFromApiMedia(webInfo.items[0]);
  }

  return [];
}

// Strategy 1: Minimal GraphQL POST (proven working, doc_id 8845758582119845)
async function fetchViaGraphQLMinimal(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 1: Minimal GraphQL POST...');

  const body = `variables=${encodeURIComponent(JSON.stringify({ shortcode }))}&doc_id=8845758582119845`;

  try {
    const response = await fetch('https://www.instagram.com/graphql/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      body,
    });

    console.log('Minimal GraphQL status:', response.status);
    if (!response.ok) return [];

    const data = await parseJsonResponse(response);
    if (!data) return [];
    
    const items = extractFromAnyGraphQL(data);
    if (items.length) console.log('✓ Minimal GraphQL success');
    return items;
  } catch (e) {
    console.log('Minimal GraphQL error:', e);
  }
  return [];
}

// Strategy 2: GraphQL with doc_id for reels (25981206651899035)  
async function fetchViaGraphQLReels(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 2: Reels GraphQL (doc_id 25981206651899035)...');

  const body = `variables=${encodeURIComponent(JSON.stringify({ shortcode }))}&doc_id=25981206651899035`;

  try {
    const response = await fetch('https://www.instagram.com/graphql/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      body,
    });

    console.log('Reels GraphQL status:', response.status);
    if (!response.ok) return [];

    const data = await parseJsonResponse(response);
    if (!data) return [];

    const items = extractFromAnyGraphQL(data);
    if (items.length) console.log('✓ Reels GraphQL success');
    return items;
  } catch (e) {
    console.log('Reels GraphQL error:', e);
  }
  return [];
}

// Strategy 3: /api/graphql endpoint with GET params (doc_id 10015901848480474)
async function fetchViaApiGraphQL(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 3: API GraphQL (doc_id 10015901848480474)...');

  const graphqlUrl = new URL('https://www.instagram.com/api/graphql');
  graphqlUrl.searchParams.set('variables', JSON.stringify({ shortcode }));
  graphqlUrl.searchParams.set('doc_id', '10015901848480474');
  graphqlUrl.searchParams.set('lsd', 'AVqbxe3J_YA');

  try {
    const response = await fetch(graphqlUrl.toString(), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-FB-LSD': 'AVqbxe3J_YA',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'Sec-Fetch-Site': 'same-origin',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
      },
    });

    console.log('API GraphQL status:', response.status);
    if (!response.ok) return [];

    const data = await parseJsonResponse(response);
    if (!data) return [];

    const items = extractFromAnyGraphQL(data);
    if (items.length) console.log('✓ API GraphQL success');
    return items;
  } catch (e) {
    console.log('API GraphQL error:', e);
  }
  return [];
}

// Strategy 4: GraphQL with full headers and doc_id 24368985919464652
async function fetchViaGraphQLFull(shortcode: string): Promise<MediaItem[]> {
  console.log('Strategy 4: Full GraphQL (doc_id 24368985919464652)...');

  const body = new URLSearchParams({
    variables: JSON.stringify({ shortcode }),
    doc_id: '24368985919464652',
  });

  try {
    const response = await fetch('https://www.instagram.com/graphql/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
      },
      body: body.toString(),
    });

    console.log('Full GraphQL status:', response.status);
    if (!response.ok) return [];

    const data = await parseJsonResponse(response);
    if (!data) return [];

    const items = extractFromAnyGraphQL(data);
    if (items.length) console.log('✓ Full GraphQL success');
    else console.log('Full GraphQL no media. Keys:', JSON.stringify(Object.keys(data?.data || {})));
    return items;
  } catch (e) {
    console.log('Full GraphQL error:', e);
  }
  return [];
}

// Strategy 5: Embed page scraping
async function fetchViaEmbed(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 5: Embed page...');
  
  const paths = resourceType === 'reel'
    ? [`reel/${shortcode}`, `p/${shortcode}`]
    : [`p/${shortcode}`];

  for (const path of paths) {
    try {
      const response = await fetch(`https://www.instagram.com/${path}/embed/captioned/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      
      if (!response.ok) continue;
      const html = await response.text();

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

      const ogVideoMatch = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i);
      if (ogVideoMatch) {
        console.log('✓ Found og:video in embed');
        return [{
          url: ogVideoMatch[1].replace(/&amp;/g, '&'),
          type: 'video',
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      const displayUrlMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (displayUrlMatch) {
        console.log('✓ Found display_url in embed');
        return [{
          url: displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'),
          type: 'image',
          filename: `instagram_image_${shortcode}.jpg`,
        }];
      }

      const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
      if (ogImageMatch) {
        console.log('✓ Found og:image in embed');
        return [{
          url: ogImageMatch[1].replace(/&amp;/g, '&'),
          type: 'image',
          filename: `instagram_image_${shortcode}.jpg`,
        }];
      }

      const imgSrcMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
      if (imgSrcMatch) {
        console.log('✓ Found EmbeddedMediaImage');
        return [{
          url: imgSrcMatch[1].replace(/&amp;/g, '&'),
          type: 'image',
          filename: `instagram_image_${shortcode}.jpg`,
        }];
      }
    } catch (e) {
      console.log('Embed error:', e);
    }
  }
  return [];
}

// Strategy 6: Direct HTML page scraping
async function fetchViaHtmlScrape(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 6: HTML scrape...');
  
  const path = resourceType === 'reel' ? `reel/${shortcode}` : `p/${shortcode}`;
  
  try {
    const response = await fetch(`https://www.instagram.com/${path}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
      },
      redirect: 'follow',
    });

    if (!response.ok) return [];
    const html = await response.text();

    // _sharedData
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});\s*<\/script>/s);
    if (sharedDataMatch) {
      try {
        const data = JSON.parse(sharedDataMatch[1]);
        const media = data?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
        if (media) {
          console.log('✓ Found _sharedData');
          return extractFromGraphQLMedia(media);
        }
      } catch (_e) { /* ignore */ }
    }

    // __additionalDataLoaded
    const additionalMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s);
    if (additionalMatch) {
      try {
        const data = JSON.parse(additionalMatch[1]);
        const media = data?.graphql?.shortcode_media || data?.items?.[0];
        if (media) {
          console.log('✓ Found __additionalDataLoaded');
          if (data?.items?.[0]) return extractFromApiMedia(media);
          return extractFromGraphQLMedia(media);
        }
      } catch (_e) { /* ignore */ }
    }

    // video_url in scripts
    const videoMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (videoMatch) {
      console.log('✓ Found video_url in HTML');
      return [{
        url: videoMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // og:video
    const ogVideo = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i);
    if (ogVideo) {
      console.log('✓ Found og:video in HTML');
      return [{
        url: ogVideo[1].replace(/&amp;/g, '&'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // og:image as last resort
    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    if (ogImage) {
      console.log('✓ Found og:image in HTML');
      return [{
        url: ogImage[1].replace(/&amp;/g, '&'),
        type: 'image',
        filename: `instagram_image_${shortcode}.jpg`,
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
        JSON.stringify({ success: false, error: 'URL do Instagram inválida. Verifique o link e tente novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resourceType = detectResourceType(url);
    console.log('Shortcode:', shortcode, '| Type:', resourceType);

    let items: MediaItem[] = [];

    // Try all strategies in order
    items = await fetchViaGraphQLMinimal(shortcode);

    if (!items.length) items = await fetchViaGraphQLReels(shortcode);
    if (!items.length) items = await fetchViaApiGraphQL(shortcode);
    if (!items.length) items = await fetchViaGraphQLFull(shortcode);
    if (!items.length) items = await fetchViaEmbed(shortcode, resourceType);
    if (!items.length) items = await fetchViaHtmlScrape(shortcode, resourceType);

    // Filter valid URLs
    items = items.filter(i => i.url && i.url.startsWith('http'));

    if (!items.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível extrair a mídia deste link. O conteúdo pode ser privado, restrito por idade, ou temporariamente indisponível. Tente novamente em alguns minutos.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✓ Found ${items.length} item(s):`, items.map(i => i.type));

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
