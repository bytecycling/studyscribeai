import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SSRF Protection: Check if URL is safe to fetch
function isUrlSafe(urlString: string): { safe: boolean; reason?: string } {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }

  const hostname = url.hostname.toLowerCase();

  // Only allow HTTP/HTTPS protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { safe: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
  }

  // Block localhost and loopback addresses
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
    return { safe: false, reason: 'Cannot access localhost addresses' };
  }

  // Block cloud metadata endpoints
  const blockedHostnames = [
    'metadata.google.internal',
    'metadata',
    'instance-data',
  ];
  if (blockedHostnames.includes(hostname)) {
    return { safe: false, reason: 'Cannot access metadata endpoints' };
  }

  // Check for private IP ranges
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipRegex);
  if (ipMatch) {
    const [, a, b, c, d] = ipMatch.map(Number);

    // Validate IP range (0-255)
    if (a > 255 || b > 255 || c > 255 || d > 255) {
      return { safe: false, reason: 'Invalid IP address' };
    }

    // Block private/special ranges
    if (
      a === 0 || // 0.0.0.0/8 - Current network
      a === 10 || // 10.0.0.0/8 - Private
      a === 127 || // 127.0.0.0/8 - Loopback
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 - Private
      (a === 192 && b === 168) || // 192.168.0.0/16 - Private
      (a === 169 && b === 254) || // 169.254.0.0/16 - Link-local (AWS metadata!)
      a === 224 || // 224.0.0.0/4 - Multicast
      a >= 240 // 240.0.0.0/4 - Reserved
    ) {
      return { safe: false, reason: 'Cannot access private or reserved IP addresses' };
    }
  }

  return { safe: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping website:', url, 'for user:', user.id);

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF Protection
    const urlSafetyCheck = isUrlSafe(url);
    if (!urlSafetyCheck.safe) {
      return new Response(
        JSON.stringify({ error: urlSafetyCheck.reason }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the website content with timeout
    console.log('Fetching website content...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StudyScribe/1.0; +https://studyscribe.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch website: ${response.status} ${response.statusText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract text content from HTML
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : validUrl.hostname;

    // Limit content size (keep it intentionally smaller to avoid overlong / cut-off notes)
    if (cleanText.length > 20000) {
      cleanText = cleanText.substring(0, 20000) + '...';
    }

    if (cleanText.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Could not extract sufficient content from this website. It may require authentication or be JavaScript-heavy.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully extracted ${cleanText.length} characters from website`);

    return new Response(
      JSON.stringify({
        success: true,
        content: cleanText,
        title: title,
        url: url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scraping website:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to scrape website' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
