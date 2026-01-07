import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CONTINUATIONS = 5;

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

  try {
    const { currentNotes, rawText, title } = await req.json();
    console.log("continue-notes: received request", {
      title,
      currentNotesLength: currentNotes?.length,
      rawTextLength: rawText?.length,
    });

    if (!currentNotes || typeof currentNotes !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'currentNotes' in request body" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rawText || typeof rawText !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'rawText' in request body" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured on the backend" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If already complete, just return
    if (endsWithEndMarker(currentNotes)) {
      console.log("continue-notes: notes already complete");
      return new Response(
        JSON.stringify({ notes: stripTrailingEndMarker(currentNotes), isComplete: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let fullNotes = currentNotes;

    for (let c = 1; c <= MAX_CONTINUATIONS; c++) {
      console.log(`continue-notes: continuation ${c}/${MAX_CONTINUATIONS}`);

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
        return new Response(JSON.stringify({ error: contJson.message }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const contToolCall = contJson?.choices?.[0]?.message?.tool_calls?.[0];
      const contArgsStr = contToolCall?.function?.arguments;
      if (!contArgsStr || typeof contArgsStr !== "string") {
        console.error("continue-notes: invalid continuation tool response", { contJson });
        continue;
      }

      let contParsed: any;
      try {
        contParsed = JSON.parse(contArgsStr);
      } catch (e) {
        console.error("continue-notes: failed to parse continuation tool args", e);
        continue;
      }

      const continuationText = contParsed?.continuation;
      if (typeof continuationText !== "string" || !continuationText.trim()) {
        console.warn("continue-notes: empty continuation");
        continue;
      }

      fullNotes = `${fullNotes.trim()}\n\n${continuationText.trim()}`;

      if (endsWithEndMarker(fullNotes)) {
        fullNotes = stripTrailingEndMarker(fullNotes);
        console.log("continue-notes: completed after continuation", { finalLength: fullNotes.length });
        return new Response(
          JSON.stringify({ notes: fullNotes, isComplete: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Return partial but mark as incomplete
    console.warn("continue-notes: max continuations reached, still incomplete", {
      notesLength: fullNotes.length,
    });
    return new Response(
      JSON.stringify({ notes: fullNotes, isComplete: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("continue-notes: unhandled error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
