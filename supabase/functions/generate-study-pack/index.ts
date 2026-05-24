import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_INITIAL_ATTEMPTS = 2;
const MAX_CONTINUATIONS = 4;

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

/**
 * Convert any stray mhchem/LaTeX chemistry wrappers into plain text,
 * so the markdown renderer never shows a raw "\ce{...}".
 */
function sanitizeChemistry(s: string): string {
  if (!s) return s;
  let out = s;

  // Extract content inside \ce{...} or \pu{...} (handles nested braces shallowly).
  const unwrap = (cmd: string) => {
    const re = new RegExp(`\\\\${cmd}\\s*\\{`, "g");
    let result = "";
    let i = 0;
    while (i < out.length) {
      re.lastIndex = i;
      const m = re.exec(out);
      if (!m) { result += out.slice(i); break; }
      result += out.slice(i, m.index);
      let depth = 1;
      let j = m.index + m[0].length;
      while (j < out.length && depth > 0) {
        const ch = out[j];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        if (depth > 0) result += ch;
        j++;
      }
      i = j;
    }
    out = result;
  };
  unwrap("ce");
  unwrap("pu");

  // Remove stray mhchem require directives
  out = out.replace(/\\require\{mhchem\}/g, "");

  return out;
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
    console.error("generate-study-pack: AI gateway error", {
      status: statusCode,
      body: errorText,
    });

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
    console.log(`generate-study-pack: ${action} - ${status}${details ? `: ${details}` : ""}`);
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
    const { text, title, sourceType } = await req.json();

    // Input validation
    if (!text || typeof text !== "string") {
      logActivity("validation_error", "error", "Missing text in request body");
      return new Response(JSON.stringify({ error: "Missing 'text' in request body", activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate text length (max 100KB)
    const MAX_TEXT_LENGTH = 100000;
    if (text.length > MAX_TEXT_LENGTH) {
      logActivity("validation_error", "error", `Text too long: ${text.length} chars`);
      return new Response(JSON.stringify({ error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`, activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate title length (max 500 chars)
    const validTitle = title && typeof title === "string" ? title.substring(0, 500) : "Untitled";

    logActivity("request_received", "info", `title=${validTitle}, sourceType=${sourceType || "unknown"}, textLength=${text.length}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      logActivity("config_error", "error", "LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI is not configured on the backend", activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isWebsite = String(sourceType || "").toLowerCase() === "website";

    const cornellSpec = `You are an expert academic note-maker creating CORNELL-STYLE study notes optimized for active recall, long-term retention, and fast exam revision.

##############################################
# MANDATORY OUTPUT STRUCTURE
##############################################

Your output is ONE markdown document with EXACTLY THREE sections, in this order, using these exact H2 headers:

## 📝 Main Notes
## ❓ Cue Questions
## 🧠 Summary

After the Summary section, end with the literal line on its own:
END_OF_NOTES

The three sections MUST COMPLEMENT each other — never repeat the same sentences across sections.

##############################################
# SECTION 1 — ## 📝 Main Notes
##############################################
Goal: professionally organized study material (not transcript, not generic summary).

Rules:
- Detect the major topics in the source and create H3 (###) headings per topic; H4 (####) for sub-topics when useful.
- Convert dense prose into short bullets with **bold key terms** (2–4 bolds per bullet group, max).
- Preserve: definitions, formulas, key terminology, examples, cause/effect, evidence, steps, timelines, statistics.
- Remove filler, repetition, conversational asides, ads, navigation text.
- For videos/podcasts: maintain chronological flow; group bullets by topic shift.
- For papers/essays: preserve argument flow (claim → evidence → counter → conclusion).
- For tutorials: preserve numbered procedural steps and dependencies.
- Use a markdown table for comparisons or definitions when it improves clarity.
- Use > blockquotes sparingly for crucial insights: \`> 💡 **Insight**: …\`
- Concise > exhaustive. Aim 400–900 words for short sources, 900–1600 for long.

##############################################
# SECTION 2 — ## ❓ Cue Questions
##############################################
Goal: active-recall prompts that TEST the Main Notes — DO NOT repeat them.

Rules:
- Produce 8–14 numbered questions.
- Mix difficulty: recall, conceptual ("why/how"), application, analysis, comparison, common-mistake.
- Each question must map to material in Main Notes but be phrased as a prompt, not a statement.
- Adapt question style to the content domain (math/science/history/literature/business/programming/general).
- Keep each question one line, no answers in this section.

##############################################
# SECTION 3 — ## 🧠 Summary
##############################################
Goal: the "if I only read this later, I still get it" big-picture compression.

Rules:
- 4–7 short bullets OR 1 tight paragraph (≤120 words).
- Capture: core concept, why it matters, key relationships, final takeaway.
- No new facts that aren't supported by the source.
- Simple language; minimize jargon (unless a defined key term).

##############################################
# STYLING & FORMATTING RULES
##############################################
- **Bold** the most important terms (sparingly — these render as accent color).
- Emojis allowed only in section headers and the occasional blockquote.
- Use --- horizontal rules between the three major sections.
- Markdown tables for structured comparisons.
- Math: inline \`$E = mc^2$\`, block \`$$F = ma$$\`. Use double backslashes for LaTeX commands: \\\\frac{a}{b}, \\\\sqrt{x}, \\\\sum, \\\\int.
- Chemistry equations: write them as PLAIN TEXT (e.g. "2 H2 + O2 → 2 H2O", "NaCl(aq)"). DO NOT use \\\\ce{...}, \\\\pu{...}, or the mhchem package — write subscripts/superscripts inline with normal characters and arrows (→, ⇌, +).
- NEVER output raw LaTeX wrappers the renderer can't display (no \\\\begin{align}, no \\\\ce, no \\\\pu, no \\\\require).
- Source-faithful: use ONLY facts present in the source. If something isn't there, omit it.
- No "Next Steps", no "Learning Objectives", no meta-commentary about the notes.

##############################################
# STUDY MATERIALS (returned via tool call alongside notes)
##############################################
- highlights: 8–12 critical quotes/concepts (short)
- flashcards: 12–20 Q&A pairs (answers concise, 1–3 sentences)
- quiz: 10–14 multiple-choice questions, 4 options each, exactly one correct

##############################################
# CRITICAL
##############################################
- DO NOT STOP EARLY. Generate all three sections fully.
- MUST end with: END_OF_NOTES`;

    const websiteSpec = `You are creating CONCISE Cornell study notes from a single website. Same three-section structure as the full Cornell spec.

OUTPUT (one markdown doc):

## 📝 Main Notes
- H3 per topic, bulleted key points with **bold terms**, brief examples from the page.
- ~300–700 words; cut filler, ads, navigation.

---

## ❓ Cue Questions
- 6–10 numbered active-recall questions covering the Main Notes.

---

## 🧠 Summary
- 3–6 bullets OR a tight ≤80-word paragraph.

END_OF_NOTES

RULES:
- Source-faithful only. No hallucination.
- Chemistry as plain text ("H2SO4", "2 H2 + O2 → 2 H2O"). NEVER use \\\\ce{} or \\\\pu{}.
- Math: \`$inline$\` and \`$$block$$\`; LaTeX commands with double backslashes.
- highlights 6–10, flashcards 8–14, quiz 6–10.
- MUST end with END_OF_NOTES.`;

    const systemPrompt = isWebsite ? websiteSpec : cornellSpec;

    let initialPack: any | null = null;

    // 1) Initial attempt(s) to get full pack
    for (let attempt = 1; attempt <= MAX_INITIAL_ATTEMPTS; attempt++) {
      logActivity("initial_generation_attempt", "info", `attempt ${attempt}/${MAX_INITIAL_ATTEMPTS}`);

      const body: Record<string, unknown> = {
        model: "google/gemini-2.5-flash",
        max_tokens: 16000,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${title ? `Title: ${title}\n` : ""}Create comprehensive, helpful study materials for this content:\n\n${text}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "build_study_pack",
              description: "Return complete structured study materials. Notes MUST end with END_OF_NOTES.",
              parameters: {
                type: "object",
                properties: {
                  suggestedTitle: {
                    type: "string",
                    description: "A clear, descriptive title for these notes (5-10 words max). Should describe the main topic, not generic like 'YouTube Video' or 'PDF Document'.",
                  },
                  notes: {
                    type: "string",
                    description: "Complete markdown notes. MUST end with END_OF_NOTES on its own line.",
                  },
                  highlights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        why: { type: "string" },
                      },
                      required: ["text"],
                      additionalProperties: false,
                    },
                  },
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                      additionalProperties: false,
                    },
                  },
                  quiz: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 4,
                          maxItems: 4,
                        },
                        correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                      },
                      required: ["question", "options", "correctIndex"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestedTitle", "notes", "highlights", "flashcards", "quiz"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_study_pack" } },
      };

      const json = await callGateway({ apiKey: LOVABLE_API_KEY, body });
      if (json?.__httpError) {
        logActivity("gateway_error", "error", json.message);
        return new Response(JSON.stringify({ error: json.message, activityLog }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      const argsStr = toolCall?.function?.arguments;

      if (!argsStr || typeof argsStr !== "string") {
        logActivity("invalid_response", "error", "Invalid tool response structure");
        continue;
      }

      try {
        initialPack = JSON.parse(argsStr);
      } catch (e) {
        logActivity("parse_error", "error", "Failed to parse tool arguments");
        initialPack = null;
        continue;
      }

      if (typeof initialPack?.notes === "string" && endsWithEndMarker(initialPack.notes)) {
        initialPack.notes = stripTrailingEndMarker(initialPack.notes);
        logActivity("initial_generation_complete", "success", `Notes length: ${initialPack.notes.length}`);
        break;
      }

      logActivity("initial_generation_incomplete", "info", `Notes length: ${initialPack?.notes?.length}, missing END_OF_NOTES`);
    }

    if (!initialPack || typeof initialPack.notes !== "string") {
      logActivity("generation_failed", "error", "Failed to generate notes after all attempts");
      return new Response(JSON.stringify({ error: "Failed to generate notes", activityLog }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) If notes are still cut off, keep continuing server-side until END_OF_NOTES
    let fullNotes = initialPack.notes;
    if (!endsWithEndMarker(fullNotes)) {
      logActivity("starting_continuations", "info", `Current length: ${fullNotes.length}`);

      for (let c = 1; c <= MAX_CONTINUATIONS; c++) {
        logActivity("continuation_attempt", "info", `continuation ${c}/${MAX_CONTINUATIONS}`);

        const tail = fullNotes.slice(-1800);

        const contSystem = `You are continuing a partially generated set of study notes.

CRITICAL:
- Continue EXACTLY where the notes left off.
- DO NOT repeat earlier content.
- Ensure all remaining important information from the source is covered.
- The continued output MUST END WITH the literal line: END_OF_NOTES`;

        const contBody: Record<string, unknown> = {
          model: "google/gemini-2.5-flash",
          max_tokens: 16000,
          messages: [
            { role: "system", content: contSystem },
            {
              role: "user",
              content:
                `${title ? `Title: ${title}\n\n` : ""}` +
                `SOURCE CONTENT (for coverage):\n${text}\n\n` +
                `NOTES SO FAR (tail):\n${tail}\n\n` +
                `Continue the notes from exactly where it stops. Return ONLY the continuation text.`,
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
          logActivity("continuation_gateway_error", "error", contJson.message);
          return new Response(JSON.stringify({ error: contJson.message, activityLog }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const contToolCall = contJson?.choices?.[0]?.message?.tool_calls?.[0];
        const contArgsStr = contToolCall?.function?.arguments;
        if (!contArgsStr || typeof contArgsStr !== "string") {
          logActivity("continuation_invalid_response", "error", "Invalid continuation tool response");
          continue;
        }

        let contParsed: any;
        try {
          contParsed = JSON.parse(contArgsStr);
        } catch (e) {
          logActivity("continuation_parse_error", "error", "Failed to parse continuation tool args");
          continue;
        }

        const continuationText = contParsed?.continuation;
        if (typeof continuationText !== "string" || !continuationText.trim()) {
          logActivity("continuation_empty", "info", "Empty continuation received");
          continue;
        }

        // Append with a newline boundary
        fullNotes = `${fullNotes.trim()}\n\n${continuationText.trim()}`;
        logActivity("continuation_appended", "success", `New length: ${fullNotes.length}`);

        if (endsWithEndMarker(fullNotes)) {
          fullNotes = stripTrailingEndMarker(fullNotes);
          logActivity("continuation_complete", "success", "END_OF_NOTES marker found");
          break;
        }
      }
    }

    // Strip any stray mhchem/LaTeX wrappers the renderer can't handle
    fullNotes = sanitizeChemistry(fullNotes);

    // Check final completion status: all three Cornell sections present
    const lower = fullNotes.toLowerCase();
    const isComplete =
      endsWithEndMarker(`${fullNotes}\nEND_OF_NOTES`) ||
      (lower.includes("## 📝 main notes") &&
        lower.includes("## ❓ cue questions") &&
        lower.includes("## 🧠 summary"));

    if (!isComplete) {
      logActivity("generation_incomplete", "error", `Failed to reach END_OF_NOTES after ${MAX_CONTINUATIONS} continuations`);
      return new Response(
        JSON.stringify({
          error: "Generation was cut off. Please try again (the backend will continue until completion).",
          activityLog,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logActivity("generation_success", "success", `Final notes length: ${fullNotes.length}`);


    // Use AI-generated title if available, otherwise fall back to provided title
    const finalTitle = initialPack.suggestedTitle || validTitle;

    return new Response(
      JSON.stringify({
        notes: fullNotes,
        suggestedTitle: finalTitle,
        highlights: initialPack.highlights,
        flashcards: initialPack.flashcards,
        quiz: initialPack.quiz,
        isComplete: true,
        activityLog,
      }),
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
