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

function shortcodeToMediaId(shortcode: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = BigInt(0);
  for (const char of shortcode) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    id = id * BigInt(64) + BigInt(idx);
  }
  return id.toString();
}

function detectResourceType(url: string): string {
  if (/\/reel\//i.test(url) || /\/reels\//i.test(url)) return 'reel';
  if (/\/tv\//i.test(url)) return 'tv';
  if (/\/stories\//i.test(url)) return 'stories';
  return 'p';
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
          thumbnail: cm.image_versions2.candidates[0].url,
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
      thumbnail: item.image_versions2.candidates[0].url,
      filename: `instagram_image_${item.pk || Date.now()}.jpg`,
    });
    return items;
  }

  return items;
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
      type: 'image',
      filename: `instagram_image_${media.id || Date.now()}.jpg`,
    });
  }

  return items;
}

// Get fresh CSRF token and cookies from Instagram
async function getInstagramSession(): Promise<{ csrfToken: string; cookies: string }> {
  try {
    const response = await fetch('https://www.instagram.com/web/__mid/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
    });
    
    const setCookies = response.headers.get('set-cookie') || '';
    const csrfMatch = setCookies.match(/csrftoken=([^;]+)/);
    const midMatch = setCookies.match(/mid=([^;]+)/);
    
    const csrfToken = csrfMatch?.[1] || 'missing';
    const cookies = [
      csrfMatch ? `csrftoken=${csrfMatch[1]}` : '',
      midMatch ? `mid=${midMatch[1]}` : '',
      'ig_did=00000000-0000-0000-0000-000000000000',
      'ig_nrcb=1',
    ].filter(Boolean).join('; ');
    
    console.log('Session obtained, csrf:', csrfToken.substring(0, 10) + '...');
    return { csrfToken, cookies };
  } catch (e) {
    console.log('Session fetch failed:', e);
    return { csrfToken: 'missing', cookies: '' };
  }
}

// Strategy 1: GraphQL API with doc_id 24368985919464652 (newest, works for reels)
async function fetchViaGraphQLNew(shortcode: string, session: { csrfToken: string; cookies: string }): Promise<MediaItem[]> {
  console.log('Strategy 1: GraphQL API (new doc_id)...');

  const variables = JSON.stringify({ shortcode });
  
  try {
    const graphqlUrl = new URL('https://www.instagram.com/api/graphql');
    
    const body = new URLSearchParams({
      variables,
      doc_id: '24368985919464652',
      lsd: session.csrfToken,
    });

    const response = await fetch(graphqlUrl.toString(), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': session.csrfToken,
        'X-IG-App-ID': '936619743392459',
        'X-FB-LSD': session.csrfToken,
        'X-ASBD-ID': '129477',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'Cookie': session.cookies,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      body: body.toString(),
    });

    console.log('GraphQL new status:', response.status);
    if (!response.ok) return [];

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('json')) {
      const text = await response.text();
      console.log('GraphQL new non-JSON:', text.substring(0, 200));
      return [];
    }

    const data = await response.json();
    const media = data?.data?.xdt_shortcode_media || data?.data?.shortcode_media;
    if (media) {
      console.log('✓ GraphQL new success, is_video:', media.is_video, 'typename:', media.__typename);
      return extractFromGraphQLMedia(media);
    }

    console.log('GraphQL new: no media. Response keys:', JSON.stringify(Object.keys(data?.data || {})).substring(0, 200));
  } catch (e) {
    console.log('GraphQL new error:', e);
  }
  return [];
}

// Strategy 2: GraphQL with older doc_id 8845758582119845
async function fetchViaGraphQLOld(shortcode: string, session: { csrfToken: string; cookies: string }): Promise<MediaItem[]> {
  console.log('Strategy 2: GraphQL (old doc_id)...');

  const body = new URLSearchParams({
    av: '0',
    __d: 'www',
    __user: '0',
    __a: '1',
    __req: 'k',
    __hs: '20244.HYP:instagram_web_pkg.2.1..0.0',
    dpr: '1',
    __ccg: 'EXCELLENT',
    __rev: '1020026498',
    __comet_req: '7',
    lsd: session.csrfToken,
    jazoest: '2946',
    __spin_r: '1020026498',
    __spin_b: 'trunk',
    __spin_t: String(Math.floor(Date.now() / 1000)),
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'PolarisPostActionLoadPostQueryQuery',
    variables: JSON.stringify({
      shortcode,
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-FB-Friendly-Name': 'PolarisPostActionLoadPostQueryQuery',
        'X-CSRFToken': session.csrfToken,
        'X-IG-App-ID': '936619743392459',
        'X-FB-LSD': session.csrfToken,
        'X-ASBD-ID': '129477',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'Cookie': session.cookies,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      body: body.toString(),
    });

    console.log('GraphQL old status:', response.status);
    if (!response.ok) return [];

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('json')) return [];

    const data = await response.json();
    const media = data?.data?.xdt_shortcode_media || data?.data?.shortcode_media;
    if (media) {
      console.log('✓ GraphQL old success, is_video:', media.is_video);
      return extractFromGraphQLMedia(media);
    }
  } catch (e) {
    console.log('GraphQL old error:', e);
  }
  return [];
}

// Strategy 3: Mobile API (i.instagram.com)
async function fetchViaMobileApi(shortcode: string): Promise<MediaItem[]> {
  const mediaId = shortcodeToMediaId(shortcode);
  console.log('Strategy 3: Mobile API, mediaId:', mediaId);

  try {
    const response = await fetch(`https://i.instagram.com/api/v1/media/${mediaId}/info/`, {
      headers: {
        'User-Agent': 'Instagram 317.0.0.34.109 Android (33/13; 420dpi; 1080x2340; samsung; SM-S908B; b0q; qcom; en_US; 562940465)',
        'X-IG-App-ID': '936619743392459',
        'X-IG-WWW-Claim': '0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    console.log('Mobile API status:', response.status);
    if (!response.ok) return [];

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('json')) return [];

    const data = await response.json();
    if (data.items?.length) {
      console.log('✓ Mobile API success');
      return extractFromApiMedia(data.items[0]);
    }
  } catch (e) {
    console.log('Mobile API error:', e);
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      
      if (!response.ok) continue;
      const html = await response.text();

      // Try to extract video_url
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

      // Try og:video
      const ogVideoMatch = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i);
      if (ogVideoMatch) {
        console.log('✓ Found og:video in embed');
        return [{
          url: ogVideoMatch[1].replace(/&amp;/g, '&'),
          type: 'video',
          filename: `instagram_video_${shortcode}.mp4`,
        }];
      }

      // Extract image
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

      // EmbeddedMediaImage class
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

// Strategy 5: HTML page scraping with script tag extraction
async function fetchViaHtmlScrape(shortcode: string, resourceType: string): Promise<MediaItem[]> {
  console.log('Strategy 5: HTML scrape...');
  
  const path = resourceType === 'reel' ? `reel/${shortcode}` : `p/${shortcode}`;
  
  try {
    const response = await fetch(`https://www.instagram.com/${path}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      redirect: 'follow',
    });

    if (!response.ok) return [];
    const html = await response.text();

    // Try _sharedData
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

    // Try __additionalDataLoaded
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

    // video_url in any script tag
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

    // og:image
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

    // Get fresh session tokens
    const session = await getInstagramSession();

    let items: MediaItem[] = [];

    // Strategy 1: New GraphQL API (best for reels)
    items = await fetchViaGraphQLNew(shortcode, session);

    // Strategy 2: Old GraphQL
    if (!items.length) {
      items = await fetchViaGraphQLOld(shortcode, session);
    }

    // Strategy 3: Mobile API
    if (!items.length) {
      items = await fetchViaMobileApi(shortcode);
    }

    // Strategy 4: Embed page
    if (!items.length) {
      items = await fetchViaEmbed(shortcode, resourceType);
    }

    // Strategy 5: HTML scraping
    if (!items.length) {
      items = await fetchViaHtmlScrape(shortcode, resourceType);
    }

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
