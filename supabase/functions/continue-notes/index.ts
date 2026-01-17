import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CONTINUATIONS = 5;

interface ActivityLogEntry {
  timestamp: string;
  action: string;
  status: "success" | "error" | "info";
  details?: string;
}

function endsWithEndMarker(notes: string): boolean {
  return /\bEND_OF_NOTES\s*$/.test((notes || "").trim());
}

function stripTrailingEndMarker(notes: string): string {
  return (notes || "")
    .replace(/\n?END_OF_NOTES\s*$/m, "")
    .trim();
}

async function callGateway({
  apiKey,
  body,
}: {
  apiKey: string;
  body: Record<string, unknown>;
}): Promise<any> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const statusCode = resp.status;
    const errorText = await resp.text();
    console.error("continue-notes: AI gateway error", { status: statusCode, body: errorText });

    if (statusCode === 429) {
      return { __httpError: 429, message: "Rate limits exceeded, please try again later." };
    }
    if (statusCode === 402) {
      return { __httpError: 402, message: "AI credits required. Please add funds to your workspace." };
    }
    return { __httpError: 500, message: "AI generation failed" };
  }

  return await resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const activityLog: ActivityLogEntry[] = [];
  const logActivity = (action: string, status: "success" | "error" | "info", details?: string) => {
    activityLog.push({
      timestamp: new Date().toISOString(),
      action,
      status,
      details,
    });
    console.log(`continue-notes: ${action} - ${status}${details ? `: ${details}` : ""}`);
  };

  try {
    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      logActivity("auth_error", "error", "No authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required", activityLog }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logActivity("auth_error", "error", "Invalid authentication");
      return new Response(
        JSON.stringify({ error: "Invalid authentication", activityLog }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logActivity("auth_success", "info", `user=${user.id}`);

    const { currentNotes, rawText, title } = await req.json();

    // Input validation
    if (!currentNotes || typeof currentNotes !== "string") {
      logActivity("validation_error", "error", "Missing currentNotes");
      return new Response(JSON.stringify({ error: "Missing 'currentNotes' in request body", activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rawText || typeof rawText !== "string") {
      logActivity("validation_error", "error", "Missing rawText");
      return new Response(JSON.stringify({ error: "Missing 'rawText' in request body", activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input lengths
    const MAX_NOTES_LENGTH = 200000;
    const MAX_RAW_TEXT_LENGTH = 100000;
    const MAX_TITLE_LENGTH = 500;

    if (currentNotes.length > MAX_NOTES_LENGTH) {
      logActivity("validation_error", "error", `currentNotes too long: ${currentNotes.length}`);
      return new Response(JSON.stringify({ error: `Notes too long. Maximum ${MAX_NOTES_LENGTH} characters allowed.`, activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rawText.length > MAX_RAW_TEXT_LENGTH) {
      logActivity("validation_error", "error", `rawText too long: ${rawText.length}`);
      return new Response(JSON.stringify({ error: `Source text too long. Maximum ${MAX_RAW_TEXT_LENGTH} characters allowed.`, activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validTitle = title && typeof title === "string" ? title.substring(0, MAX_TITLE_LENGTH) : "";
    logActivity("request_received", "info", `title=${validTitle}, currentNotesLength=${currentNotes.length}, rawTextLength=${rawText.length}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      logActivity("config_error", "error", "LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI is not configured on the backend", activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If already complete, just return
    if (endsWithEndMarker(currentNotes)) {
      logActivity("already_complete", "success", "Notes already have END_OF_NOTES marker");
      return new Response(
        JSON.stringify({ notes: stripTrailingEndMarker(currentNotes), isComplete: true, activityLog }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let fullNotes = currentNotes;

    for (let c = 1; c <= MAX_CONTINUATIONS; c++) {
      logActivity("continuation_attempt", "info", `continuation ${c}/${MAX_CONTINUATIONS}`);

      const tail = fullNotes.slice(-2000);

      const contSystem = `You are continuing a partially generated set of study notes.

CRITICAL INSTRUCTIONS:
- Continue EXACTLY where the notes left off. Do NOT repeat any content.
- Cover ALL remaining important information from the source that hasn't been covered yet.
- Use the same formatting style (markdown, emojis, bold terms, etc.).
- The continued output MUST END WITH the literal line: END_OF_NOTES

FORMATTING TO MATCH:
- Use --- horizontal rules between major sections
- Use emojis in section headers (📚, 🎯, ⚠️, 📝, 🎓, etc.)
- **Bold** all key terms
- Use > blockquotes for important insights
- For math: inline $formula$ or block $$formula$$`;

      const contBody: Record<string, unknown> = {
        model: "google/gemini-2.5-flash",
        max_tokens: 16000,
        messages: [
          { role: "system", content: contSystem },
          {
            role: "user",
            content:
              `${title ? `Title: ${title}\n\n` : ""}` +
              `SOURCE CONTENT (for coverage - make sure to cover all remaining topics):\n${rawText}\n\n` +
              `NOTES SO FAR (tail - continue from here):\n${tail}\n\n` +
              `Continue the notes from exactly where it stops. Cover any remaining topics from the source. Return ONLY the continuation text, ending with END_OF_NOTES.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "continue_notes",
              description: "Return only the continuation of the notes. MUST end with END_OF_NOTES.",
              parameters: {
                type: "object",
                properties: {
                  continuation: {
                    type: "string",
                    description: "Continuation text only (no repetition). MUST end with END_OF_NOTES.",
                  },
                },
                required: ["continuation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "continue_notes" } },
      };

      const contJson = await callGateway({ apiKey: LOVABLE_API_KEY, body: contBody });
      if (contJson?.__httpError) {
        logActivity("gateway_error", "error", contJson.message);
        return new Response(JSON.stringify({ error: contJson.message, activityLog }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const contToolCall = contJson?.choices?.[0]?.message?.tool_calls?.[0];
      const contArgsStr = contToolCall?.function?.arguments;
      if (!contArgsStr || typeof contArgsStr !== "string") {
        logActivity("invalid_response", "error", "Invalid continuation tool response");
        continue;
      }

      let contParsed: any;
      try {
        contParsed = JSON.parse(contArgsStr);
      } catch (e) {
        logActivity("parse_error", "error", "Failed to parse continuation tool args");
        continue;
      }

      const continuationText = contParsed?.continuation;
      if (typeof continuationText !== "string" || !continuationText.trim()) {
        logActivity("empty_continuation", "info", "Empty continuation received");
        continue;
      }

      fullNotes = `${fullNotes.trim()}\n\n${continuationText.trim()}`;
      logActivity("continuation_appended", "success", `New length: ${fullNotes.length}`);

      if (endsWithEndMarker(fullNotes)) {
        fullNotes = stripTrailingEndMarker(fullNotes);
        logActivity("continuation_complete", "success", "END_OF_NOTES marker found");
        return new Response(
          JSON.stringify({ notes: fullNotes, isComplete: true, activityLog }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Return partial but mark as incomplete
    logActivity("max_continuations_reached", "info", `Still incomplete after ${MAX_CONTINUATIONS} continuations`);
    return new Response(
      JSON.stringify({ notes: fullNotes, isComplete: false, activityLog }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    logActivity("unhandled_error", "error", e instanceof Error ? e.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", activityLog }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
