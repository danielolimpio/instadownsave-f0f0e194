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

const COMMON_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'no-cache',
};

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

function extractFromGraphQL(media: any): MediaItem[] {
  const items: MediaItem[] = [];

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

// Strategy 1: GraphQL API (no cookie needed)
async function fetchViaGraphQL(shortcode: string): Promise<MediaItem[]> {
  const queryHash = 'b3055c01b4b222b8a47dc12b090e4e64';
  const variables = JSON.stringify({
    shortcode,
    child_comment_count: 0,
    fetch_comment_count: 0,
    parent_comment_count: 0,
    has_threaded_comments: false,
  });

  const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': COMMON_HEADERS['User-Agent'],
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.instagram.com/',
        'X-IG-App-ID': '936619743392459',
      },
    });

    if (!response.ok) {
      console.log('GraphQL query failed:', response.status);
      return [];
    }

    const data = await response.json();
    const media = data?.data?.shortcode_media;
    if (media) {
      return extractFromGraphQL(media);
    }
  } catch (e) {
    console.log('GraphQL error:', e);
  }
  return [];
}

// Strategy 2: Embed page scraping
async function fetchViaEmbed(shortcode: string, originalUrl: string): Promise<MediaItem[]> {
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
  console.log('Fetching embed URL:', embedUrl);

  try {
    const response = await fetch(embedUrl, { headers: COMMON_HEADERS, redirect: 'follow' });
    const html = await response.text();

    // Try to find video_url in embed JSON data
    const videoUrlMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (videoUrlMatch) {
      const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      const thumbnailMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/) 
        || html.match(/"thumbnail_src"\s*:\s*"([^"]+)"/);
      const thumbnail = thumbnailMatch ? thumbnailMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/') : undefined;
      
      return [{
        url: videoUrl,
        type: 'video',
        thumbnail,
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // Try to find video in embed's EmbeddedMediaVideo
    const embedVideoMatch = html.match(/class="EmbeddedMediaVideo"[^>]*>.*?<source\s+src="([^"]+)"/s);
    if (embedVideoMatch) {
      return [{
        url: embedVideoMatch[1].replace(/&amp;/g, '&'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // Try video tag source
    const videoTagMatch = html.match(/<video[^>]*\ssrc="([^"]+)"/i)
      || html.match(/<video[^>]*>.*?<source[^>]*\ssrc="([^"]+)"/is);
    if (videoTagMatch) {
      return [{
        url: videoTagMatch[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // Try any .mp4 URL in the page
    const mp4Matches = html.match(/https?:\/\/[^"'\s\\]+\.mp4[^"'\s\\]*/g);
    if (mp4Matches && mp4Matches.length > 0) {
      const cleanUrl = mp4Matches[0].replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
      return [{
        url: cleanUrl,
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // Try og:video meta tag
    const ogVideoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:video"/i);
    if (ogVideoMatch) {
      const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
        || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
      return [{
        url: ogVideoMatch[1].replace(/&amp;/g, '&'),
        type: 'video',
        thumbnail: ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : undefined,
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // Image fallback from embed
    const displayUrlMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
    if (displayUrlMatch) {
      const imgUrl = displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      return [{
        url: imgUrl,
        type: 'image',
        filename: `instagram_image_${shortcode}.jpg`,
      }];
    }

    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    if (ogImageMatch) {
      return [{
        url: ogImageMatch[1].replace(/&amp;/g, '&'),
        type: 'image',
        filename: `instagram_image_${shortcode}.jpg`,
      }];
    }
  } catch (e) {
    console.log('Embed fetch error:', e);
  }

  return [];
}

// Strategy 3: Direct page scraping with sharedData/additionalData
async function fetchViaDirectPage(shortcode: string): Promise<MediaItem[]> {
  const cleanUrl = `https://www.instagram.com/p/${shortcode}/`;
  console.log('Fetching direct URL:', cleanUrl);

  try {
    const response = await fetch(cleanUrl, { headers: COMMON_HEADERS, redirect: 'follow' });
    const html = await response.text();

    // _sharedData
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/s);
    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1]);
        const media = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
        if (media) return extractFromGraphQL(media);
      } catch (_e) { /* ignore */ }
    }

    // __additionalDataLoaded
    const additionalDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s);
    if (additionalDataMatch) {
      try {
        const data = JSON.parse(additionalDataMatch[1]);
        const media = data?.graphql?.shortcode_media || data?.items?.[0];
        if (media) return extractFromGraphQL(media);
      } catch (_e) { /* ignore */ }
    }

    // Relay runtime data
    const relayMatch = html.match(/"xdt_api__v1__media__shortcode__web_info".*?"shortcode_media"\s*:\s*({.+?})\s*}\s*}\s*}/s);
    if (relayMatch) {
      try {
        const media = JSON.parse(relayMatch[1]);
        return extractFromGraphQL(media);
      } catch (_e) { /* ignore */ }
    }

    // Direct video_url in page source
    const videoUrlMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (videoUrlMatch) {
      const videoUrl = videoUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      return [{
        url: videoUrl,
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // .mp4 URLs
    const mp4Matches = html.match(/https?:\/\/[^"'\s\\]+\.mp4[^"'\s\\]*/g);
    if (mp4Matches && mp4Matches.length > 0) {
      return [{
        url: mp4Matches[0].replace(/\\u0026/g, '&').replace(/&amp;/g, '&'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // og:video
    const ogVideoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:video"/i);
    if (ogVideoMatch) {
      return [{
        url: ogVideoMatch[1].replace(/&amp;/g, '&'),
        type: 'video',
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // og:image fallback
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    if (ogImageMatch) {
      return [{
        url: ogImageMatch[1].replace(/&amp;/g, '&'),
        type: 'image',
        filename: `instagram_image_${shortcode}.jpg`,
      }];
    }
  } catch (e) {
    console.log('Direct page error:', e);
  }

  return [];
}

// Strategy 4: Instagram's web API (?__a=1&__d=dis)
async function fetchViaWebAPI(shortcode: string): Promise<MediaItem[]> {
  const url = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
  console.log('Fetching via web API:', url);

  try {
    const response = await fetch(url, {
      headers: {
        ...COMMON_HEADERS,
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.log('Web API failed:', response.status);
      return [];
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      console.log('Web API returned non-JSON:', contentType);
      return [];
    }

    const data = await response.json();
    const items = data?.items?.[0] || data?.graphql?.shortcode_media;
    if (!items) return [];

    const result: MediaItem[] = [];

    // Carousel
    if (items.carousel_media) {
      for (const cm of items.carousel_media) {
        if (cm.video_versions?.length) {
          result.push({
            url: cm.video_versions[0].url,
            type: 'video',
            thumbnail: cm.image_versions2?.candidates?.[0]?.url,
            filename: `instagram_video_${cm.id || Date.now()}.mp4`,
          });
        } else if (cm.image_versions2?.candidates?.length) {
          result.push({
            url: cm.image_versions2.candidates[0].url,
            type: 'image',
            filename: `instagram_image_${cm.id || Date.now()}.jpg`,
          });
        }
      }
      if (result.length > 0) return result;
    }

    // edge_sidecar_to_children (GraphQL format)
    if (items.edge_sidecar_to_children) {
      return extractFromGraphQL(items);
    }

    // Single video
    if (items.video_versions?.length) {
      return [{
        url: items.video_versions[0].url,
        type: 'video',
        thumbnail: items.image_versions2?.candidates?.[0]?.url,
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // Single video (GraphQL format)
    if (items.video_url) {
      return [{
        url: items.video_url,
        type: 'video',
        thumbnail: items.display_url || items.thumbnail_src,
        filename: `instagram_video_${shortcode}.mp4`,
      }];
    }

    // Single image
    if (items.image_versions2?.candidates?.length) {
      return [{
        url: items.image_versions2.candidates[0].url,
        type: 'image',
        filename: `instagram_image_${shortcode}.jpg`,
      }];
    }

    if (items.display_url) {
      return [{
        url: items.display_url,
        type: 'image',
        filename: `instagram_image_${shortcode}.jpg`,
      }];
    }
  } catch (e) {
    console.log('Web API error:', e);
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

    console.log('Processing Instagram URL:', url);

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL do Instagram inválida. Verifique o link.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expectedType = detectContentType(url);
    console.log('Shortcode:', shortcode, '| Expected type:', expectedType);

    let items: MediaItem[] = [];

    // Strategy 1: GraphQL API
    console.log('Strategy 1: GraphQL API...');
    items = await fetchViaGraphQL(shortcode);
    if (items.length > 0) console.log('✓ GraphQL succeeded');

    // Strategy 2: Web API (?__a=1&__d=dis)
    if (items.length === 0) {
      console.log('Strategy 2: Web API...');
      items = await fetchViaWebAPI(shortcode);
      if (items.length > 0) console.log('✓ Web API succeeded');
    }

    // Strategy 3: Embed page
    if (items.length === 0) {
      console.log('Strategy 3: Embed page...');
      items = await fetchViaEmbed(shortcode, url);
      if (items.length > 0) console.log('✓ Embed succeeded');
    }

    // Strategy 4: Direct page scraping
    if (items.length === 0) {
      console.log('Strategy 4: Direct page...');
      items = await fetchViaDirectPage(shortcode);
      if (items.length > 0) console.log('✓ Direct page succeeded');
    }

    // Validate: if we expected video but only got image, the URL might be a thumbnail
    // In that case, mark it correctly based on URL type for reel/tv
    if (items.length > 0 && expectedType === 'video') {
      const hasVideo = items.some(i => i.type === 'video');
      if (!hasVideo) {
        console.log('⚠ Expected video but got image only - keeping as thumbnail preview');
        // Update items to indicate this is a video thumbnail
        items = items.map(item => ({
          ...item,
          type: 'video' as const,
          thumbnail: item.url,
          filename: item.filename.replace('instagram_image_', 'instagram_video_').replace('.jpg', '.mp4'),
        }));
      }
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível extrair a mídia. O post pode ser privado ou o formato não é suportado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${items.length} media item(s):`, items.map(i => `${i.type}:${i.url.substring(0, 80)}...`));

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
