import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      throw new Error('YouTube URL is required');
    }

    // Extract video ID from URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Using Supadata API for transcript
    console.log('Using Supadata API for transcript');
    const transcript = await getYouTubeTranscript(videoId);
    
    // Summarize with Gemini
    const summary = await summarizeWithGemini(transcript);

    return new Response(
      JSON.stringify({ 
        transcript, 
        summary,
        videoId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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

async function getYouTubeTranscript(videoId: string): Promise<string> {
  const SUPADATA_API_KEY = Deno.env.get('SUPADATA_API_KEY');
  
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }

  console.log('Fetching transcript for video:', videoId);
  
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Use Supadata API to get transcript
  const response = await fetch('https://api.supadata.ai/v1/transcript', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPADATA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: youtubeUrl,
      text: true, // Get plain text instead of timestamped chunks
      mode: 'auto' // Auto-select best transcription method
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Supadata API error:', errText);
    throw new Error('Failed to get transcript from Supadata API');
  }

  const result = await response.json();
  
  // Check if we got immediate results or a job_id for async processing
  if (result.content) {
    console.log('Got immediate transcript');
    return result.content;
  } else if (result.job_id) {
    // For async processing (large files), we need to poll
    throw new Error('Video requires async processing. Please try a shorter video.');
  } else {
    throw new Error('No transcript content returned');
  }
}

async function summarizeWithGemini(text: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please create comprehensive study notes from the following transcript. Include:
1. Main topics and key concepts
2. Important points and definitions
3. Examples and applications
4. Summary of key takeaways

Transcript:
${text}`
          }]
        }]
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate summary');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
