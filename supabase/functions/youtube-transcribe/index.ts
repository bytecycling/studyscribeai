import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Always return 200 with success/error in body
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Authentication required" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ success: false, error: "Invalid authentication" }, 401);
    }

    const { youtubeUrl } = await req.json();
    console.log("youtube-transcribe: input", { userId: user.id });

    // Input validation
    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      return jsonResponse({ success: false, error: "YouTube URL is required" });
    }

    // Validate URL length (max 2000 chars - reasonable URL limit)
    if (youtubeUrl.length > 2000) {
      return jsonResponse({ success: false, error: "URL too long" });
    }

    const trimmedUrl = youtubeUrl.trim();
    
    // Validate protocol
    const normalizedUrl = normalizeUrl(trimmedUrl);
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      return jsonResponse({ success: false, error: "URL must use HTTP or HTTPS protocol" });
    }

    // Validate it's actually a YouTube URL
    if (!normalizedUrl.match(/youtube\.com|youtu\.be/i)) {
      return jsonResponse({ success: false, error: "Invalid YouTube URL" });
    }

    const videoId = extractVideoId(normalizedUrl);

    if (!videoId) {
      return jsonResponse({ success: false, error: "Invalid YouTube URL" });
    }

    console.log("youtube-transcribe: fetching transcript", { videoId });
    
    let transcript: string;
    let title: string | null;
    
    try {
      const result = await getYouTubeTranscript(videoId);
      transcript = result.transcript;
      title = result.title;
    } catch (transcriptError: any) {
      console.error("youtube-transcribe: transcript fetch failed", { error: transcriptError.message });
      return jsonResponse({ success: false, error: transcriptError.message });
    }

    console.log("youtube-transcribe: summarizing", { videoId, transcriptLength: transcript.length });
    
    let summary: string;
    try {
      summary = await summarizeWithLovableAI(transcript);
    } catch (aiError: any) {
      console.error("youtube-transcribe: AI summarization failed", { error: aiError.message });
      return jsonResponse({ success: false, error: aiError.message });
    }

    return jsonResponse({
      success: true,
      transcript,
      summary,
      videoId,
      title,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("youtube-transcribe: unhandled error", { message, error });
    return jsonResponse({ success: false, error: message });
  }
});

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return v;
  } catch {
    // ignore
  }

  return null;
}

async function getYouTubeTranscript(
  videoId: string
): Promise<{ transcript: string; title: string | null }> {
  const apiKey = Deno.env.get("SUPADATA_API_KEY") || Deno.env.get("YOUTUBE_TRANSCRIPTION_API_KEY");

  if (!apiKey) {
    throw new Error("YouTube transcription is not configured on the backend.");
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoint = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(youtubeUrl)}&text=true`;

  console.log("youtube-transcribe: calling supadata API");
  
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("youtube-transcribe: supadata non-2xx", {
      status: response.status,
      body: errText,
    });
    
    if (response.status === 429) {
      throw new Error("Transcript service rate-limited. Please try again in a minute.");
    }
    
    throw new Error("Failed to get transcript. The video may not have captions available.");
  }

  const result = await response.json();

  if (result.content) {
    const title = result.metadata?.title || result.title || null;
    return {
      transcript: result.content,
      title,
    };
  }

  if (result.job_id) {
    throw new Error("This video requires async processing. Please try a shorter video.");
  }

  throw new Error("No transcript content returned. The video may not have captions.");
}

async function summarizeWithLovableAI(text: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!apiKey) {
    throw new Error("AI is not configured on the backend.");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: `Please create comprehensive study notes from the following transcript. Include:\n1. Main topics and key concepts\n2. Important points and definitions\n3. Examples and applications\n4. Summary of key takeaways\n\nTranscript:\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("youtube-transcribe: lovable ai non-2xx", { status: response.status, body });

    if (response.status === 429) {
      throw new Error("Rate limits exceeded, please try again later.");
    }

    if (response.status === 402) {
      throw new Error("AI credits required. Please add funds to your workspace.");
    }

    throw new Error("Failed to generate summary");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
