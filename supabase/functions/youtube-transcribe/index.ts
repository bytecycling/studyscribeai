import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { youtubeUrl } = await req.json();
    console.log('Processing YouTube URL:', youtubeUrl);

    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ error: 'YouTube URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get transcript using Supadata API
    console.log('Fetching transcript for video:', videoId);
    const { transcript, title } = await getYouTubeTranscript(videoId);
    
    // Summarize with Lovable AI
    const summary = await summarizeWithLovableAI(transcript);

    return new Response(
      JSON.stringify({ 
        transcript, 
        summary,
        videoId,
        title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function getYouTubeTranscript(videoId: string): Promise<{ transcript: string; title: string | null }> {
  const SUPADATA_API_KEY = Deno.env.get('SUPADATA_API_KEY');
  
  if (!SUPADATA_API_KEY) {
    throw new Error('YouTube transcription is not configured. Please add SUPADATA_API_KEY.');
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const endpoint = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(youtubeUrl)}&text=true`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'x-api-key': SUPADATA_API_KEY,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Supadata API error:', errText);
    throw new Error('Failed to get transcript. The video may not have captions available.');
  }

  const result = await response.json();
  
  if (result.content) {
    console.log('Got transcript successfully');
    const title = result.metadata?.title || result.title || null;
    return { 
      transcript: result.content,
      title
    };
  } else if (result.job_id) {
    throw new Error('Video requires async processing. Please try a shorter video.');
  } else {
    throw new Error('No transcript content returned. The video may not have captions.');
  }
}

async function summarizeWithLovableAI(text: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('AI is not configured on the backend');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: `Please create comprehensive study notes from the following transcript. Include:
1. Main topics and key concepts
2. Important points and definitions
3. Examples and applications
4. Summary of key takeaways

Transcript:
${text}`
      }]
    })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits required. Please add funds to your workspace.');
    }
    const error = await response.text();
    console.error('Lovable AI error:', error);
    throw new Error('Failed to generate summary');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
