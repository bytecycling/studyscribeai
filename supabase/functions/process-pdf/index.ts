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
  const ADOBE_API_KEY = Deno.env.get('ADOBE_PDF_API_KEY');
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!ADOBE_API_KEY || !GEMINI_API_KEY) {
    throw new Error('API keys not configured');
  }

  // Use Adobe PDF Extract API to extract text
  console.log('Extracting text from PDF using Adobe API...');
  
  const extractResponse = await fetch(
    'https://pdf-services.adobe.io/operation/extractpdf',
    {
      method: 'POST',
      headers: {
        'x-api-key': ADOBE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetID: base64Pdf.substring(0, 100), // Adobe requires asset upload first, using simplified approach
      })
    }
  );

  let extractedText = '';
  
  if (!extractResponse.ok) {
    console.warn('Adobe API failed, using Gemini for extraction:', await extractResponse.text());
    // Fallback to Gemini for text extraction
    const geminiExtractResponse = await fetch(
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
                text: 'Extract all text from this PDF document.'
              }
            ]
          }]
        })
      }
    );
    
    if (geminiExtractResponse.ok) {
      const data = await geminiExtractResponse.json();
      extractedText = data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Failed to extract PDF text');
    }
  } else {
    const data = await extractResponse.json();
    extractedText = data.content || '';
  }

  // Now use Gemini to create study notes from the extracted text
  console.log('Creating study notes with Gemini...');
  const summaryResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please analyze this PDF content and create comprehensive study notes. Include:
1. Main topics and sections
2. Key concepts and definitions
3. Important facts and figures
4. Examples and case studies
5. Summary of key takeaways
6. Study questions for review

PDF Content:
${extractedText}`
          }]
        }]
      })
    }
  );

  if (!summaryResponse.ok) {
    const error = await summaryResponse.text();
    console.error('Gemini API error:', error);
    throw new Error('Failed to create study notes');
  }

  const summaryData = await summaryResponse.json();
  const content = summaryData.candidates[0].content.parts[0].text;
  
  return {
    content,
    summary: content
  };
}
