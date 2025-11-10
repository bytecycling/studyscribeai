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

    console.log('Processing PDF file:', pdfFile.name, 'Size:', pdfFile.size);

    // Check file size (max 20MB to align with app limits)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (pdfFile.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'PDF too large. Maximum size is 20MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert PDF to base64 safely (avoid call stack overflow)
    const arrayBuffer = await pdfFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64Pdf = encodeBase64(bytes);

    console.log('PDF converted to base64, size:', base64Pdf.length);

    // Process with Adobe and Gemini
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

function encodeBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000; // 32KB chunks to prevent apply/spread overflow
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    // Using apply with small chunks avoids Maximum call stack size exceeded
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  return btoa(binary);
}

async function processPdfWithGemini(base64Pdf: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('AI is not configured on the backend');
  }

  // Use Lovable AI to extract text from PDF
  console.log('Extracting text from PDF using Lovable AI...');
  
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
            text: 'Extract all text content from this PDF document. Preserve structure, headings, and formatting.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/pdf;base64,${base64Pdf}`
            }
          }
        ]
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
    throw new Error('Failed to extract PDF text');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  return {
    content,
    summary: content
  };
}
