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

function extractMediaFromHtml(html: string, originalUrl: string): MediaItem[] {
  const items: MediaItem[] = [];

  // Try extracting from shared data JSON
  const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/s);
  if (sharedDataMatch) {
    try {
      const sharedData = JSON.parse(sharedDataMatch[1]);
      const postPage = sharedData?.entry_data?.PostPage;
      if (postPage && postPage[0]) {
        const media = postPage[0]?.graphql?.shortcode_media;
        if (media) {
          return extractFromGraphQL(media);
        }
      }
    } catch (_e) {
      console.log('Could not parse _sharedData');
    }
  }

  // Try extracting from additional data JSON  
  const additionalDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*({.+?})\s*\)\s*;/s);
  if (additionalDataMatch) {
    try {
      const data = JSON.parse(additionalDataMatch[1]);
      const media = data?.graphql?.shortcode_media || data?.items?.[0];
      if (media) {
        return extractFromGraphQL(media);
      }
    } catch (_e) {
      console.log('Could not parse __additionalDataLoaded');
    }
  }

  // Try require("relay-runtime") pattern
  const relayMatch = html.match(/"xdt_api__v1__media__shortcode__web_info".*?"shortcode_media"\s*:\s*({.+?})\s*}\s*}\s*}/s);
  if (relayMatch) {
    try {
      const media = JSON.parse(relayMatch[1]);
      return extractFromGraphQL(media);
    } catch (_e) {
      console.log('Could not parse relay data');
    }
  }

  // Fallback: extract og:video and og:image meta tags
  const ogVideoMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) 
    || html.match(/<meta\s+content="([^"]+)"\s+property="og:video"/i);
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);

  if (ogVideoMatch) {
    items.push({
      url: ogVideoMatch[1].replace(/&amp;/g, '&'),
      type: 'video',
      thumbnail: ogImageMatch ? ogImageMatch[1].replace(/&amp;/g, '&') : undefined,
      filename: `instagram_video_${Date.now()}.mp4`,
    });
  } else if (ogImageMatch) {
    items.push({
      url: ogImageMatch[1].replace(/&amp;/g, '&'),
      type: 'image',
      filename: `instagram_image_${Date.now()}.jpg`,
    });
  }

  // Try to find video URLs in the HTML directly
  if (items.length === 0) {
    const videoUrls = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g);
    if (videoUrls) {
      const uniqueUrls = [...new Set(videoUrls)];
      for (const vUrl of uniqueUrls.slice(0, 1)) {
        items.push({
          url: vUrl.replace(/\\u0026/g, '&').replace(/&amp;/g, '&'),
          type: 'video',
          filename: `instagram_video_${Date.now()}.mp4`,
        });
      }
    }
  }

  return items;
}

function extractFromGraphQL(media: any): MediaItem[] {
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

async function fetchInstagramPage(url: string): Promise<string> {
  // Clean URL
  let cleanUrl = url.split('?')[0];
  if (!cleanUrl.endsWith('/')) cleanUrl += '/';

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'no-cache',
  };

  // Try the embed endpoint first (more reliable for public posts)
  const embedUrl = cleanUrl.replace(/\/$/, '') + '/embed/';
  console.log('Fetching embed URL:', embedUrl);

  let response = await fetch(embedUrl, { headers, redirect: 'follow' });
  let html = await response.text();

  // Check if we got useful content
  if (html.includes('og:video') || html.includes('video_url') || html.includes('display_url') || html.includes('.mp4')) {
    console.log('Got media from embed page');
    return html;
  }

  // Try the direct page
  console.log('Fetching direct URL:', cleanUrl);
  response = await fetch(cleanUrl, { headers, redirect: 'follow' });
  html = await response.text();

  return html;
}

// Alternative: use Instagram's GraphQL API for public posts
async function fetchViaGraphQL(shortcode: string): Promise<MediaItem[]> {
  const variables = JSON.stringify({
    shortcode,
    child_comment_count: 0,
    fetch_comment_count: 0,
    parent_comment_count: 0,
    has_threaded_comments: false,
  });

  const url = `https://www.instagram.com/graphql/query/?query_hash=b3055c01b4b222b8a47dc12b090e4e64&variables=${encodeURIComponent(variables)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'X-Requested-With': 'XMLHttpRequest',
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
  return [];
}

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
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
    let items: MediaItem[] = [];

    // Strategy 1: Try GraphQL API
    if (shortcode) {
      console.log('Trying GraphQL with shortcode:', shortcode);
      items = await fetchViaGraphQL(shortcode);
    }

    // Strategy 2: Scrape the page
    if (items.length === 0) {
      console.log('Trying HTML scraping...');
      const html = await fetchInstagramPage(url);
      items = extractMediaFromHtml(html, url);
    }

    // Strategy 3: Try Instagram's oEmbed (gives thumbnail only, but works)
    if (items.length === 0) {
      console.log('Trying oEmbed fallback...');
      const oembedUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
      items.push({
        url: oembedUrl,
        type: 'image',
        filename: `instagram_image_${shortcode || Date.now()}.jpg`,
      });
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível extrair a mídia. O post pode ser privado ou o formato não é suportado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${items.length} media item(s)`);

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
