import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_INITIAL_ATTEMPTS = 2;
const MAX_CONTINUATIONS = 4;

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

  try {
    const { text, title } = await req.json();
    console.log("generate-study-pack: received request", {
      title,
      textLength: text?.length,
    });

    if (!text || typeof text !== "string") {
      console.error("generate-study-pack: missing text in request body");
      return new Response(JSON.stringify({ error: "Missing 'text' in request body" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("generate-study-pack: LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI is not configured on the backend" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert academic tutor creating COMPREHENSIVE, ACTIONABLE study materials.

##############################################
# ABSOLUTE CRITICAL REQUIREMENT - READ THIS #
##############################################

YOU MUST GENERATE THE COMPLETE NOTES FROM START TO FINISH.
DO NOT STOP EARLY. DO NOT TRUNCATE. DO NOT CUT OFF.
THE NOTES MUST END WITH THE LITERAL TEXT: END_OF_NOTES

If you stop before END_OF_NOTES, the student will fail their exam.
This is NON-NEGOTIABLE.

##############################################

COVERAGE REQUIREMENT:
- You MUST cover ALL important information from the provided source content.
- Do NOT summarize into vague bullet points; teach the material with explanations and examples.
- If the source is long, include more sections (do not omit topics).

FORMAT STRUCTURE (COMPLETE ALL SECTIONS):

# [Clear, Descriptive Title]

## 📋 Overview
[2-3 sentences: What is this topic? Why does it matter? What will you learn?]

## 🎯 Learning Objectives
After studying these notes, you should be able to:
- [Specific, measurable objective 1]
- [Specific, measurable objective 2]
- [Specific, measurable objective 3]

---

## 📚 [First Major Topic]

### What You Need to Know
[Clear explanation with **bold key terms**. Explain concepts as if teaching to someone who has never seen this before.]

### Key Concepts
- **Term 1**: Definition and why it matters
- **Term 2**: Definition and practical application
- **Term 3**: Definition with example

### Examples & Applications
[Concrete examples that illustrate the concepts. Use real-world scenarios.]

> 💡 **Key Insight**: [Important takeaway or common misconception to avoid]

---

## 📚 [Second Major Topic]

[Continue with same structure for each major section - COVER ALL TOPICS FROM THE SOURCE]

---

## 🔗 Connections & Relationships
[How do these concepts relate to each other? What's the bigger picture?]

## ⚠️ Common Mistakes to Avoid
1. [Mistake 1 and how to avoid it]
2. [Mistake 2 and how to avoid it]
3. [Mistake 3 and how to avoid it]

## 📝 Summary
[Comprehensive summary tying everything together.]

## 🎓 Next Steps
[What should the student do next to master this material?]

END_OF_NOTES

FORMATTING RULES:
- Use --- horizontal rules between major sections
- Use emojis in section headers for visual navigation
- **Bold** all key terms and definitions
- Use > blockquotes for important insights and tips
- Use proper markdown lists with - prefix

MATH/SCIENCE FORMULAS (when applicable):
- Inline math: $E = mc^2$ or $\\alpha + \\beta$
- Block math on own line: $$F = ma$$

STUDY MATERIALS:
- highlights: 10-15 key points
- flashcards: 15-25 Q&A pairs
- quiz: 12-18 multiple choice questions with 4 options each

REMEMBER: END WITH: END_OF_NOTES`;

    let initialPack: any | null = null;

    // 1) Initial attempt(s) to get full pack
    for (let attempt = 1; attempt <= MAX_INITIAL_ATTEMPTS; attempt++) {
      console.log(`generate-study-pack: initial attempt ${attempt}/${MAX_INITIAL_ATTEMPTS}`);

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
                required: ["notes", "highlights", "flashcards", "quiz"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_study_pack" } },
      };

      const json = await callGateway({ apiKey: LOVABLE_API_KEY, body });
      if (json?.__httpError) {
        return new Response(JSON.stringify({ error: json.message }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      const argsStr = toolCall?.function?.arguments;

      if (!argsStr || typeof argsStr !== "string") {
        console.error("generate-study-pack: invalid tool response structure", { json });
        continue;
      }

      try {
        initialPack = JSON.parse(argsStr);
      } catch (e) {
        console.error("generate-study-pack: failed to parse tool args", e);
        initialPack = null;
        continue;
      }

      if (typeof initialPack?.notes === "string" && endsWithEndMarker(initialPack.notes)) {
        initialPack.notes = stripTrailingEndMarker(initialPack.notes);
        break;
      }

      console.warn("generate-study-pack: initial notes incomplete", {
        notesLength: initialPack?.notes?.length,
        lastChars: typeof initialPack?.notes === "string" ? initialPack.notes.slice(-120) : null,
      });
    }

    if (!initialPack || typeof initialPack.notes !== "string") {
      return new Response(JSON.stringify({ error: "Failed to generate notes" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) If notes are still cut off, keep continuing server-side until END_OF_NOTES
    let fullNotes = initialPack.notes;
    if (!endsWithEndMarker(fullNotes)) {
      console.log("generate-study-pack: continuing cut-off notes server-side", {
        currentLength: fullNotes.length,
      });

      for (let c = 1; c <= MAX_CONTINUATIONS; c++) {
        console.log(`generate-study-pack: continuation ${c}/${MAX_CONTINUATIONS}`);

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
          return new Response(JSON.stringify({ error: contJson.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const contToolCall = contJson?.choices?.[0]?.message?.tool_calls?.[0];
        const contArgsStr = contToolCall?.function?.arguments;
        if (!contArgsStr || typeof contArgsStr !== "string") {
          console.error("generate-study-pack: invalid continuation tool response", { contJson });
          continue;
        }

        let contParsed: any;
        try {
          contParsed = JSON.parse(contArgsStr);
        } catch (e) {
          console.error("generate-study-pack: failed to parse continuation tool args", e);
          continue;
        }

        const continuationText = contParsed?.continuation;
        if (typeof continuationText !== "string" || !continuationText.trim()) {
          console.warn("generate-study-pack: empty continuation");
          continue;
        }

        // Append with a newline boundary
        fullNotes = `${fullNotes.trim()}\n\n${continuationText.trim()}`;

        if (endsWithEndMarker(fullNotes)) {
          fullNotes = stripTrailingEndMarker(fullNotes);
          break;
        }
      }
    }

    if (!endsWithEndMarker(`${fullNotes}\nEND_OF_NOTES`)) {
      // If we still didn't finish, fail loudly rather than saving cut-off notes.
      console.error("generate-study-pack: failed to reach END_OF_NOTES after continuations", {
        notesLength: fullNotes.length,
      });
      return new Response(
        JSON.stringify({
          error:
            "Generation was cut off. Please try again (the backend will continue until completion).",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("generate-study-pack: success", {
      notesLength: fullNotes.length,
      highlightsCount: initialPack.highlights?.length,
      flashcardsCount: initialPack.flashcards?.length,
      quizCount: initialPack.quiz?.length,
    });

    return new Response(
      JSON.stringify({
        notes: fullNotes,
        highlights: initialPack.highlights,
        flashcards: initialPack.flashcards,
        quiz: initialPack.quiz,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-study-pack: unhandled error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
