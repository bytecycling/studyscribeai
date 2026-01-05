import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Always return 200 with success/error in body
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return jsonResponse({ success: false, error: 'Audio file is required' });
    }

    console.log('transcribe-audio: Processing file:', audioFile.name, audioFile.type, 'Size:', audioFile.size);

    // Check file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return jsonResponse({ success: false, error: 'File too large. Maximum size is 20MB' });
    }

    // Convert file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64Audio = encodeBase64(bytes);

    console.log('transcribe-audio: File converted to base64, size:', base64Audio.length);

    // Process with Lovable AI
    let result;
    try {
      result = await processAudioWithLovableAI(base64Audio, audioFile.type);
    } catch (aiError: any) {
      console.error('transcribe-audio: AI processing failed', { error: aiError.message });
      return jsonResponse({ success: false, error: aiError.message });
    }

    return jsonResponse({
      success: true,
      transcript: result.transcript,
      summary: result.summary
    });

  } catch (error) {
    console.error('transcribe-audio: Error:', error);
    return jsonResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

function encodeBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

async function processAudioWithLovableAI(base64Audio: string, mimeType: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('AI is not configured on the backend');
  }

  console.log('transcribe-audio: Processing audio with Lovable AI...');

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
        content: [
          {
            type: 'text',
            text: `Please transcribe this audio/video file and create comprehensive study notes. Include:
1. Full transcription
2. Main topics and key concepts
3. Important points and definitions
4. Examples mentioned
5. Summary of key takeaways`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Audio}`
            }
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('transcribe-audio: Lovable AI error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits required. Please add funds to your workspace.');
    }
    throw new Error('Failed to process audio');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  return {
    transcript: content,
    summary: content
  };
}
