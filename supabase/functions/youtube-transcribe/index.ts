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

    // Get transcript using YouTube API or third-party service
    // For now, we'll simulate getting a transcript
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
  const TRANSCRIPTION_API_KEY = Deno.env.get('YOUTUBE_TRANSCRIPTION_API_KEY');
  
  if (!TRANSCRIPTION_API_KEY) {
    throw new Error('YOUTUBE_TRANSCRIPTION_API_KEY not configured');
  }

  console.log('Fetching transcript for video:', videoId);
  
  // Use AssemblyAI to transcribe YouTube video
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Submit transcription job
  const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': TRANSCRIPTION_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: youtubeUrl,
    }),
  });

  if (!submitResponse.ok) {
    const errText = await submitResponse.text();
    console.error('AssemblyAI submit error:', errText);
    const message = errText.includes('Authentication error')
      ? 'AssemblyAI authentication failed. Please update YOUTUBE_TRANSCRIPTION_API_KEY.'
      : 'Failed to submit transcription job';
    throw new Error(message);
  }

  const { id: transcriptId } = await submitResponse.json();
  console.log('Transcription job submitted:', transcriptId);

  // Poll for completion
  let transcript = '';
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'authorization': TRANSCRIPTION_API_KEY,
      },
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to check transcription status');
    }

    const result = await statusResponse.json();
    
    if (result.status === 'completed') {
      transcript = result.text;
      break;
    } else if (result.status === 'error') {
      throw new Error(`Transcription failed: ${result.error}`);
    }
    
    attempts++;
    console.log(`Transcription status: ${result.status} (attempt ${attempts}/${maxAttempts})`);
  }

  if (!transcript) {
    throw new Error('Transcription timed out');
  }

  return transcript;
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
