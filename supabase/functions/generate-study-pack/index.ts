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

    const systemPrompt = `You are an expert academic study coach. Generate comprehensive, academically rigorous study materials with professional formatting.

NOTES FORMATTING REQUIREMENTS:
- Start with a clear # Title (H1) using the main topic
- Use ## for major sections with relevant emojis (📚 Overview, 🎯 Key Concepts, 💡 Important Points, 📊 Analysis, 🔬 Details, ✨ Summary, etc.)
- Use ### for subsections
- Use proper academic language and citations where appropriate
- Include tables using markdown syntax when comparing data, listing features, or organizing structured information
- Use **bold** for key terms on first mention
- Use *italic* for emphasis and technical terms
- Use > blockquotes for important definitions or quotes
- CRITICAL: Add TWO blank lines between paragraphs and sections for better readability
- Add code blocks with \`\`\` for technical content when relevant
- Structure content with clear hierarchy: Title → Sections → Subsections → Paragraphs → Lists

CONTENT QUALITY:
- Make content academically rigorous with proper terminology
- Provide context and explanations, not just facts
- Include examples and real-world applications
- Use professional, scholarly tone
- Ensure logical flow between sections

- highlights: 8-15 key academic points users should remember. Include brief explanations of significance.
- flashcards: 12-20 high-quality Q&A pairs optimized for active recall. Use academic terminology.
- quiz: 8-12 multiple-choice questions covering core concepts and applications. Include challenging options.

Ensure factual accuracy and academic integrity. Create materials suitable for serious study.`;

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
