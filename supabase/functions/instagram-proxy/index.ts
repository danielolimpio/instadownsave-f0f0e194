const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') ?? '';

function getSafeFilename(filename: string | undefined, contentType: string, url: string) {
  const type = contentType.toLowerCase();
  const extFromType = type.includes('video/') ? 'mp4'
    : type.includes('png') ? 'png'
    : type.includes('webp') ? 'webp'
    : type.includes('gif') ? 'gif'
    : type.includes('jpeg') || type.includes('jpg') ? 'jpg'
    : undefined;

  const extFromUrl = url.match(/\.([a-z0-9]{2,5})(?:$|\?)/i)?.[1]?.toLowerCase();
  const finalExt = extFromType ?? extFromUrl ?? 'bin';
  const baseName = (filename || `instagram_download_${Date.now()}`)
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_');

  return `${baseName}.${finalExt}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, filename } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying media URL:', url.substring(0, 100) + '...');

    const parsedUrl = new URL(url);
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'https://www.instagram.com/',
      'Origin': 'https://www.instagram.com',
    };

    if (parsedUrl.hostname.includes('rapidapi.com')) {
      if (!RAPIDAPI_KEY) {
        return new Response(
          JSON.stringify({ success: false, error: 'Serviço de download não configurado.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      headers['X-RapidAPI-Key'] = RAPIDAPI_KEY;
      headers['X-RapidAPI-Host'] = parsedUrl.hostname;
    }

    const response = await fetch(url, {
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error('Upstream fetch failed:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `Falha ao baixar mídia (status ${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.arrayBuffer();

    const safeName = getSafeFilename(filename, contentType, response.url || url);

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': body.byteLength.toString(),
        'X-Original-Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro ao baixar' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
