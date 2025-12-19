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
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping website:', url);

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the website content directly
    console.log('Fetching website content...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StudyScribe/1.0; +https://studyscribe.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch website: ${response.status} ${response.statusText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract images from HTML
    const images: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null && images.length < 10) {
      let imgSrc = match[1];
      
      // Skip data URIs, tiny images, and icons
      if (imgSrc.startsWith('data:')) continue;
      if (imgSrc.includes('icon') || imgSrc.includes('logo') || imgSrc.includes('avatar')) continue;
      if (imgSrc.includes('1x1') || imgSrc.includes('pixel')) continue;
      
      // Convert relative URLs to absolute
      if (imgSrc.startsWith('//')) {
        imgSrc = 'https:' + imgSrc;
      } else if (imgSrc.startsWith('/')) {
        imgSrc = `${validUrl.protocol}//${validUrl.host}${imgSrc}`;
      } else if (!imgSrc.startsWith('http')) {
        imgSrc = `${validUrl.protocol}//${validUrl.host}/${imgSrc}`;
      }
      
      // Only include common image formats
      if (imgSrc.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || imgSrc.includes('image')) {
        images.push(imgSrc);
      }
    }

    // Also try to extract Open Graph images
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      let ogImage = ogImageMatch[1];
      if (!ogImage.startsWith('http')) {
        ogImage = `${validUrl.protocol}//${validUrl.host}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
      }
      if (!images.includes(ogImage)) {
        images.unshift(ogImage); // Add OG image at the beginning
      }
    }

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

    // Limit content size
    if (cleanText.length > 50000) {
      cleanText = cleanText.substring(0, 50000) + '...';
    }

    if (cleanText.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Could not extract sufficient content from this website. It may require authentication or be JavaScript-heavy.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully extracted ${cleanText.length} characters and ${images.length} images from website`);

    return new Response(
      JSON.stringify({
        success: true,
        content: cleanText,
        title: title,
        url: url,
        images: images.slice(0, 5), // Return up to 5 images
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scraping website:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to scrape website' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});