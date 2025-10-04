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
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      throw new Error('Audio file is required');
    }

    console.log('Processing audio file:', audioFile.name, audioFile.type, 'Size:', audioFile.size);

    // Check file size (max 20MB to avoid memory issues)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (audioFile.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 20MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to base64 in chunks to avoid memory issues
    const arrayBuffer = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 1024 * 1024; // 1MB chunks
    let base64Audio = '';
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      base64Audio += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    console.log('File converted to base64, size:', base64Audio.length);

    // Transcribe and summarize with Gemini
    const result = await processAudioWithGemini(base64Audio, audioFile.type);

    return new Response(
      JSON.stringify(result),
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

async function processAudioWithGemini(base64Audio: string, mimeType: string) {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Use Gemini's multimodal capabilities to process audio
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio
              }
            },
            {
              text: `Please transcribe this audio/video file and create comprehensive study notes. Include:
1. Full transcription
2. Main topics and key concepts
3. Important points and definitions
4. Examples mentioned
5. Summary of key takeaways`
            }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error('Failed to process audio');
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  
  return {
    transcript: content,
    summary: content
  };
}
