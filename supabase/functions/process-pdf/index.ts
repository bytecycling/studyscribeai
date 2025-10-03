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
    const pdfFile = formData.get('file') as File;
    
    if (!pdfFile) {
      throw new Error('PDF file is required');
    }

    console.log('Processing PDF file:', pdfFile.name);

    // Convert PDF to base64 for Gemini API
    const arrayBuffer = await pdfFile.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Process with Gemini
    const result = await processPdfWithGemini(base64Pdf);

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

async function processPdfWithGemini(base64Pdf: string) {
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
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64Pdf
              }
            },
            {
              text: `Please analyze this PDF document and create comprehensive study notes. Include:
1. Main topics and sections
2. Key concepts and definitions
3. Important facts and figures
4. Examples and case studies
5. Summary of key takeaways
6. Study questions for review`
            }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error('Failed to process PDF');
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  
  return {
    content,
    summary: content
  };
}
