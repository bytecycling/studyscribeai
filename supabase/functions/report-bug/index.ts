import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BugReportRequest {
  noteId?: string;
  noteTitle?: string;
  issueType: string;
  description: string;
  userEmail?: string;
  browserInfo: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BugReportRequest = await req.json();
    
    // Validate input
    if (!body.description || body.description.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Description is required" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (body.description.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Description is too long (max 5000 characters)" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Bug report received:", {
      issueType: body.issueType,
      noteId: body.noteId,
      timestamp: body.timestamp,
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
          🐛 Bug Report - StudyScribe
        </h1>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h2 style="margin: 0 0 10px 0; color: #333;">Issue Type</h2>
          <p style="margin: 0; font-size: 16px; color: #7c3aed; font-weight: bold;">${body.issueType}</p>
        </div>
        
        ${body.noteId ? `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h2 style="margin: 0 0 10px 0; color: #333;">Note Details</h2>
          <p style="margin: 0;"><strong>Title:</strong> ${body.noteTitle || "N/A"}</p>
          <p style="margin: 5px 0 0 0;"><strong>ID:</strong> ${body.noteId}</p>
        </div>
        ` : ""}
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h2 style="margin: 0 0 10px 0; color: #333;">Description</h2>
          <p style="margin: 0; white-space: pre-wrap;">${body.description}</p>
        </div>
        
        ${body.userEmail ? `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h2 style="margin: 0 0 10px 0; color: #333;">Reporter Email</h2>
          <p style="margin: 0;">${body.userEmail}</p>
        </div>
        ` : ""}
        
        <div style="background: #fce4ec; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h2 style="margin: 0 0 10px 0; color: #333;">Technical Info</h2>
          <p style="margin: 0; font-size: 12px; color: #666;">${body.browserInfo}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;"><strong>Reported at:</strong> ${body.timestamp}</p>
        </div>
      </div>
    `;

    // Send email using Resend REST API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "StudyScribe Bug Reports <onboarding@resend.dev>",
        to: ["stu29.qymsun.jb@fairview.edu.my"],
        subject: `🐛 Bug Report: ${body.issueType} - ${body.noteTitle || "General"}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    const emailResponse = await res.json();
    console.log("Bug report email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in report-bug function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send bug report" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
