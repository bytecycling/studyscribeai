import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RETRIES = 2;

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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("generate-study-pack: LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI is not configured on the backend" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert academic tutor creating COMPREHENSIVE, ACTIONABLE study materials.

CRITICAL RULES:
1. COMPLETE ALL CONTENT - Never truncate, cut off, or abbreviate. Write EVERYTHING.
2. END WITH: END_OF_NOTES on its own line
3. Make notes GENUINELY HELPFUL - not just summaries, but teaching materials

FORMAT STRUCTURE:

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

[Continue with same structure for each major section]

---

## 🔗 Connections & Relationships
[How do these concepts relate to each other? What's the bigger picture?]

## ⚠️ Common Mistakes to Avoid
1. [Mistake 1 and how to avoid it]
2. [Mistake 2 and how to avoid it]
3. [Mistake 3 and how to avoid it]

## 📝 Summary
[Comprehensive summary tying everything together. What are the key takeaways?]

## 🎓 Next Steps
[What should the student do next to master this material?]

END_OF_NOTES

FORMATTING RULES:
- Use --- horizontal rules between major sections
- Use emojis in section headers for visual navigation
- **Bold** all key terms and definitions
- Use > blockquotes for important insights and tips
- Use proper markdown lists with - prefix
- Use tables for comparisons when helpful
- Leave blank lines before and after headers

MATH/SCIENCE FORMULAS (when applicable):
- Inline math: $E = mc^2$ or $\\alpha + \\beta$
- Block math on own line: $$F = ma$$
- Chemistry arrows: $\\rightarrow$, $\\leftarrow$, $\\rightleftharpoons$
- Chemical formulas: $H_2O$, $CO_2$, $CH_3COOH$
- Fractions: $\\frac{a}{b}$, Square roots: $\\sqrt{x}$
- Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\theta$, $\\pi$

MERMAID DIAGRAMS (only when helpful):
- Keep labels SHORT (1-4 words)
- Use simple text only - NO special characters, NO LaTeX
- Use letter IDs (A, B, C)

VALID example:
\`\`\`mermaid
graph TD
    A[Input] --> B[Process]
    B --> C[Output]
\`\`\`

STUDY MATERIALS REQUIREMENTS:
- highlights: 10-15 key points with explanations of WHY they matter
- flashcards: 15-25 Q&A pairs testing understanding (not just recall)
- quiz: 12-18 challenging multiple choice questions with 4 options each

QUALITY STANDARDS:
- Write as if you're the best tutor explaining to a student
- Include practical examples and applications
- Anticipate and address common confusion points
- Make the content engaging and memorable`;

    let result = null;
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;
      console.log(`generate-study-pack: attempt ${attempts}/${MAX_RETRIES}`);

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
              description:
                "Return complete structured study materials. Notes MUST include all sections and end with END_OF_NOTES.",
              parameters: {
                type: "object",
                properties: {
                  notes: {
                    type: "string",
                    description:
                      "Complete markdown notes from Overview through Summary. MUST end with END_OF_NOTES on its own line.",
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
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (statusCode === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits required. Please add funds to your workspace." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: "AI generation failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const json = await resp.json();
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      const argsStr = toolCall?.function?.arguments;
      
      if (!argsStr || typeof argsStr !== "string") {
        console.error("generate-study-pack: invalid AI response structure", { json });
        continue; // Retry
      }

      let parsed;
      try {
        parsed = JSON.parse(argsStr);
      } catch (e) {
        console.error("generate-study-pack: failed to parse tool call arguments", { argsStr, error: e });
        continue; // Retry
      }

      // Check if notes are complete (ends with END_OF_NOTES)
      const notesComplete = parsed.notes?.includes("END_OF_NOTES");
      
      if (notesComplete) {
        // Remove the END_OF_NOTES marker from final output
        parsed.notes = parsed.notes.replace(/\n?END_OF_NOTES\n?/g, '').trim();
        result = parsed;
        break;
      } else {
        console.warn("generate-study-pack: notes incomplete, retrying...", { 
          notesLength: parsed.notes?.length,
          lastChars: parsed.notes?.slice(-100)
        });
        // Store partial result in case all retries fail
        result = parsed;
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Failed to generate complete notes after multiple attempts" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("generate-study-pack: success", { 
      notesLength: result.notes?.length,
      highlightsCount: result.highlights?.length,
      flashcardsCount: result.flashcards?.length,
      quizCount: result.quiz?.length
    });

    return new Response(
      JSON.stringify({
        notes: result.notes,
        highlights: result.highlights,
        flashcards: result.flashcards,
        quiz: result.quiz,
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
