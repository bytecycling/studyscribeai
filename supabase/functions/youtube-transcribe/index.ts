import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ApiResponse =
  | {
      success: true;
      transcript: string;
      summary: string;
      videoId: string;
      title: string | null;
    }
  | { success: false; error: string };

function jsonOk(body: ApiResponse) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtubeUrl } = await req.json();
    console.log("youtube-transcribe: input", { youtubeUrl });

    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      return jsonOk({ success: false, error: "YouTube URL is required" });
    }

    const normalizedUrl = normalizeUrl(youtubeUrl);
    const videoId = extractVideoId(normalizedUrl);

    if (!videoId) {
      return jsonOk({ success: false, error: "Invalid YouTube URL" });
    }

    console.log("youtube-transcribe: fetching transcript", { videoId });
    const { transcript, title } = await getYouTubeTranscript(videoId);

    console.log("youtube-transcribe: summarizing", { videoId, transcriptLength: transcript.length });
    const summary = await summarizeWithLovableAI(transcript);

    return jsonOk({
      success: true,
      transcript,
      summary,
      videoId,
      title,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("youtube-transcribe: unhandled error", { message, error });
    // Always return 200 so supabase.functions.invoke doesn't throw a non-2xx error.
    return jsonOk({ success: false, error: message });
  }
});

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function extractVideoId(url: string): string | null {
  // Supports:
  // - https://www.youtube.com/watch?v=ID
  // - https://youtu.be/ID
  // - https://www.youtube.com/embed/ID
  // - https://www.youtube.com/shorts/ID
  // - https://www.youtube.com/live/ID
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

  // As a fallback, try parsing v= from query string
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
    throw new Error(
      response.status === 429
        ? "Transcript service rate-limited. Please try again in a minute."
        : "Failed to get transcript. The video may not have captions available."
    );
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

