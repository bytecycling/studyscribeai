import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, conversationHistory, noteId } = await req.json();
    
    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'question' in request body" }),
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

    // Get auth token from request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user's notes
    let query = supabaseClient
      .from("notes")
      .select("title, content, highlights, flashcards, quiz, source_type");

    if (noteId) {
      // If noteId is provided, only fetch that specific note
      query = query.eq("id", noteId).limit(1);
    } else {
      // Otherwise fetch user's recent notes
      query = query.order("created_at", { ascending: false }).limit(10);
    }

    const { data: notes, error: notesError } = await query;

    if (notesError) {
      console.error("Error fetching notes:", notesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch your notes" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notes || notes.length === 0) {
      const msg = noteId 
        ? "This note was not found or you don't have access to it."
        : "You don't have any study notes yet. Please generate some notes first before asking questions!";
      return new Response(
        JSON.stringify({ answer: msg }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from notes
    const notesContext = notes.map((note, i) => 
      `Note ${i + 1} (${note.source_type}): ${note.title}\n${note.content || ""}\n${
        note.highlights ? `Highlights: ${JSON.stringify(note.highlights)}\n` : ""
      }`
    ).join("\n\n");

    const systemPrompt = `You are a helpful study assistant AI. Your primary purpose is to help students understand their study materials better.

CONTEXT: The student has the following study notes:
${noteId ? 'Study Note:' : "User's Study Notes:"}
${notesContext}

GUIDELINES:
1. Prioritize information from the study notes when answering questions
2. You can use your general knowledge to explain concepts further, provide examples, break down complex topics step-by-step
3. If asked to "explain further" or "explain more", provide additional context, examples, and detailed explanations beyond what's in the notes
4. For step-by-step requests, break down concepts into clear, numbered steps
5. Be conversational, encouraging, and helpful
6. If a question is completely unrelated to the study material, gently guide the conversation back to the learning content

MATH/SCIENCE FORMULA FORMATTING (CRITICAL):
- Use LaTeX notation for ALL mathematical formulas, equations, and symbols
- Inline math: wrap in single dollar signs like $E = mc^2$ or $\\alpha + \\beta$
- Block/display math: wrap in double dollar signs like $$F = ma$$
- Use proper LaTeX for:
  * Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\pi$, $\\theta$
  * Fractions: $\\frac{a}{b}$
  * Square roots: $\\sqrt{x}$
  * Exponents/subscripts: $x^2$, $x_i$
  * Integrals: $\\int_0^\\infty f(x) dx$
  * Derivatives: $\\frac{d}{dx}$, $\\frac{\\partial f}{\\partial x}$
  * Sums: $\\sum_{i=1}^{n}$
  * Vectors: $\\vec{v}$
  * Chemical formulas: $H_2O$, $CO_2$

DIAGRAM FORMATTING (MERMAID):
- When explaining processes, workflows, hierarchies, or relationships, use Mermaid diagrams
- Wrap diagrams in triple backticks with "mermaid" language identifier:
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
\`\`\`
- Use appropriate diagram types: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, pie, mindmap
- Include diagrams for: biology processes, chemistry reactions, physics concepts, algorithms, data structures, historical timelines`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: question }
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
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
    const answer = json?.choices?.[0]?.message?.content;
    
    if (!answer) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
