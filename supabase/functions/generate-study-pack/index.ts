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
    console.log("generate-study-pack: received request", { title, textLength: text?.length });
    
    if (!text || typeof text !== "string") {
      console.error("generate-study-pack: missing text in request body");
      return new Response(
        JSON.stringify({ error: "Missing 'text' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("generate-study-pack: LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI is not configured on the backend" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert academic study coach. Create COMPLETE, COMPREHENSIVE study materials.

CRITICAL: You MUST generate the FULL content. Never cut off, truncate, or abbreviate. Include ALL sections from start to finish.

FORMAT THE NOTES EXACTLY LIKE THIS:

# [Topic Title]

## Brief Overview

[2-3 sentences explaining the content source and what it covers. This MUST be included.]

## Key Points

- **Point 1**: [detailed explanation]
- **Point 2**: [detailed explanation]
- **Point 3**: [detailed explanation]
- **Point 4**: [detailed explanation]
- **Point 5**: [detailed explanation]

---

## [Section 1 Title] [Emoji]

[Opening paragraph with **bold key terms** and clear explanations]

> [Important definition or quote in blockquote]

[Additional detailed content paragraphs]

---

## [Section 2 Title] [Emoji]

[Continue with detailed content for each section]

---

## Summary

[Final summary paragraph tying everything together]

FORMATTING RULES:
- Use --- horizontal rules between major sections
- Leave blank lines before and after headers
- Use proper markdown lists with - prefix (NOT bullet character)
- Use tables with borders for comparisons
- **Bold** key terms in list items
- Use emojis in section headers
- > blockquotes for definitions only
- Each list item on its own line with - prefix

MATH/SCIENCE FORMULA RULES:
- Use LaTeX notation for ALL formulas and chemical equations
- CRITICAL: Use DOUBLE BACKSLASHES for all LaTeX commands in JSON
- Inline math: $E = mc^2$ or $\\\\alpha + \\\\beta$
- Block math on own line: $$F = ma$$
- Chemistry arrows: $\\\\rightarrow$, $\\\\leftarrow$, $\\\\rightleftharpoons$
- Chemical formulas: $H_2O$, $CO_2$, $CH_3COOH$
- Fractions: $\\\\frac{a}{b}$, Square roots: $\\\\sqrt{x}$
- Greek letters: $\\\\alpha$, $\\\\beta$, $\\\\gamma$, $\\\\theta$, $\\\\pi$

DIAGRAM RULES (MERMAID) - FOLLOW EXACTLY:
- Only include diagrams when they genuinely help explain concepts
- Use SIMPLE text labels - NO special characters, NO LaTeX, NO parentheses
- Keep node text SHORT (1-4 words max)
- Use letters/numbers for node IDs (A, B, C or node1, node2)

VALID MERMAID EXAMPLE:
\`\`\`mermaid
graph TD
    A[Reactants] --> B[Reaction]
    B --> C[Products]
    B --> D[Energy Released]
\`\`\`

INVALID (DO NOT DO):
- Node labels with $formula$ or chemical equations
- Labels with parentheses like (H2O)
- Special characters in labels
- Very long text in nodes

CONTENT REQUIREMENTS:
- COMPLETE the entire document - never stop mid-section
- highlights: 8-15 critical points with explanations
- flashcards: 15-20 Q&A pairs covering all concepts  
- quiz: 10-15 challenging multiple choice questions with 4 options each
- Academic rigor with clear, accessible language`;

    const body: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${title ? `Title: ${title}\n` : ""}Create comprehensive study materials for this content:\n\n${text}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "build_study_pack",
            description: "Return complete structured study materials. MUST include full notes from introduction through summary - never truncate.",
            parameters: {
              type: "object",
              properties: {
                notes: { type: "string", description: "Complete markdown notes with all sections from Brief Overview through Summary. Never truncate." },
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
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                      correctIndex: { type: "integer", minimum: 0, maximum: 3 }
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

    console.log("generate-study-pack: calling AI gateway");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const statusCode = resp.status;
      const errorText = await resp.text();
      console.error("generate-study-pack: AI gateway error", { status: statusCode, body: errorText });
      
      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await resp.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    
    if (!argsStr || typeof argsStr !== "string") {
      console.error("generate-study-pack: invalid AI response structure", { json });
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(argsStr);
    } catch (e) {
      console.error("generate-study-pack: failed to parse tool call arguments", { argsStr, error: e });
      return new Response(
        JSON.stringify({ error: "Failed to parse AI output" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("generate-study-pack: success", { 
      notesLength: parsed.notes?.length,
      highlightsCount: parsed.highlights?.length,
      flashcardsCount: parsed.flashcards?.length,
      quizCount: parsed.quiz?.length
    });

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
    console.error("generate-study-pack: unhandled error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});