import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, title } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'text' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI is not configured on the backend" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Expert academic study coach. Generate comprehensive, professionally formatted study materials.

NOTES FORMAT (STRICT):
# Main Title (H1 - topic name)

## 📚 First Section Name
(empty line)
Section content with **bold key terms** and *italic emphasis*.


(another empty line before next section)

## 🎯 Second Section Name
(empty line)
Section content...


FORMATTING RULES:
- Use ## with relevant emojis for sections (📚 Overview, 🎯 Key Concepts, 💡 Important, 📊 Analysis, 🔬 Details, ✨ Summary)
- Use ### for subsections
- TWO blank lines between sections
- ONE blank line after section headers
- Include tables for comparisons/lists (markdown syntax)
- **bold** for key terms, *italic* for emphasis
- > blockquotes for definitions
- Academic language, proper terminology

CONTENT:
- highlights: 8-15 key points with significance
- flashcards: 12-20 Q&A pairs for active recall
- quiz: 8-12 challenging multiple-choice questions

Ensure accuracy and academic rigor.`;

    const body: Record<string, unknown> = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${title ? `Title: ${title}\n` : ""}Source material:\n\n${text}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "build_study_pack",
            description: "Return full structured study materials for the given content.",
            parameters: {
              type: "object",
              properties: {
                notes: { type: "string", description: "Markdown notes summarizing and explaining the content" },
                highlights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      why: { type: "string" }
                    },
                    required: ["text"],
                    additionalProperties: false
                  }
                },
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      answer: { type: "string" }
                    },
                    required: ["question", "answer"],
                    additionalProperties: false
                  }
                },
                quiz: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 2 },
                      correctIndex: { type: "integer", minimum: 0 }
                    },
                    required: ["question", "options", "correctIndex"],
                    additionalProperties: false
                  }
                }
              },
              required: ["notes", "highlights", "flashcards", "quiz"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "build_study_pack" } },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await resp.json();
    // OpenAI-compatible response shape
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr || typeof argsStr !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(argsStr);
    } catch (e) {
      console.error("Failed to parse tool call arguments:", argsStr);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI output" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        notes: parsed.notes,
        highlights: parsed.highlights,
        flashcards: parsed.flashcards,
        quiz: parsed.quiz,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-study-pack error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
