import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Scraping website:', url);

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      throw new Error('Invalid URL provided');
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StudyScribe/1.0; +https://studyscribe.ai)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract text content from HTML
    // Remove script and style tags
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')  // Remove HTML tags
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : validUrl.hostname;

    // Limit content size
    if (cleanText.length > 50000) {
      cleanText = cleanText.substring(0, 50000) + '...';
    }

    if (cleanText.length < 100) {
      throw new Error('Could not extract sufficient content from this website. It may require authentication or be JavaScript-heavy.');
    }

    console.log(`Successfully extracted ${cleanText.length} characters from website`);

    return new Response(
      JSON.stringify({
        success: true,
        content: cleanText,
        title: title,
        url: url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error scraping website:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to scrape website',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
