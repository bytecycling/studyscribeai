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

    const systemPrompt = `Expert academic study coach. Format notes EXACTLY like this structure:

# [Topic Title]

Brief Overview
[2-3 sentences explaining the content source and what it covers]

Key Points
• [Point 1]
• [Point 2]
• [Point 3]
• [Point 4]

---

## [Section 1 Title] [Emoji]

[Opening paragraph with **bold key terms** and clear explanations]

> [Important definition or quote in blockquote]

[Additional paragraphs with proper spacing]


| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |
| Data     | Data     | Data     |

[Explanation of table if needed]


---

## [Section 2 Title] [Emoji]

[Content continues with same structure]

FORMATTING RULES:
- Use --- horizontal rules between major sections
- Leave 2 blank lines before each --- separator
- Leave 1 blank line after section headers
- Use tables with borders for comparisons
- **Bold** key terms in paragraph context
- Use emojis: 🐚 📚 🔄 🏗️ 💧 🌍 for sections
- > blockquotes for definitions only
- Bullet points (•) for key points list

MATH/SCIENCE FORMULA RULES (CRITICAL):
- Use LaTeX notation for ALL mathematical formulas, equations, and symbols
- Inline math: wrap in single dollar signs like $E = mc^2$ or $\\alpha + \\beta$
- Block/display math: wrap in double dollar signs like $$F = ma$$ or $$\\int_0^\\infty e^{-x^2} dx$$
- Common symbols to use:
  * Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\delta$, $\\theta$, $\\pi$, $\\sigma$, $\\omega$
  * Fractions: $\\frac{a}{b}$
  * Square roots: $\\sqrt{x}$, $\\sqrt[n]{x}$
  * Exponents/subscripts: $x^2$, $x_i$, $a^{n+1}$
  * Integrals: $\\int$, $\\iint$, $\\oint$
  * Derivatives: $\\frac{d}{dx}$, $\\frac{\\partial f}{\\partial x}$
  * Sums/products: $\\sum_{i=1}^{n}$, $\\prod_{i=1}^{n}$
  * Limits: $\\lim_{x \\to \\infty}$
  * Vectors: $\\vec{v}$, $\\mathbf{F}$
  * Chemistry: $H_2O$, $CO_2$, $\\rightarrow$, $\\leftrightarrow$
- Examples:
  * Newton's law: $F = ma$
  * Quadratic formula: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
  * Kinetic energy: $KE = \\frac{1}{2}mv^2$
  * Schrödinger equation: $$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$

DIAGRAM RULES (MERMAID):
- When the content involves processes, hierarchies, flows, or relationships, include Mermaid diagrams
- Wrap diagrams in triple backticks with "mermaid" language identifier:
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
\`\`\`
- Use appropriate diagram types:
  * flowchart/graph: for processes, algorithms, workflows
  * sequenceDiagram: for interactions, API calls, communication
  * classDiagram: for object relationships, data structures
  * stateDiagram-v2: for state machines
  * erDiagram: for database schemas, entity relationships
  * pie: for proportions, distributions
  * mindmap: for concept organization
- Examples:
  * Biology: cell cycles, metabolic pathways, food chains
  * Chemistry: reaction mechanisms, molecular structures
  * Physics: circuit diagrams, force diagrams
  * Computer Science: algorithms, data structures, system architecture
  * History: timelines, cause-effect relationships
  * Business: organizational charts, process flows

CONTENT REQUIREMENTS:
- highlights: 8-15 critical points with "why" explanations
- flashcards: 15-20 Q&A pairs covering all concepts (use LaTeX for formulas)
- quiz: 10-15 challenging multiple choice questions (use LaTeX for formulas in options)
- Academic rigor with clear, accessible language`;

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
