import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    if (!REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set");
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    const body = await req.json();

    if (!body.imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required field: imageUrl is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Removing background from image:", body.imageUrl);

    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: body.imageUrl,
        },
      }
    );

    console.log("Background removal response:", output);

    // Get the URL from the output
    let outputUrl: string;
    if (typeof output === "object" && output !== null && "url" in output) {
      outputUrl = (output as any).url();
    } else if (typeof output === "string") {
      outputUrl = output;
    } else {
      outputUrl = String(output);
    }

    return new Response(JSON.stringify({ output: outputUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in remove-background function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
