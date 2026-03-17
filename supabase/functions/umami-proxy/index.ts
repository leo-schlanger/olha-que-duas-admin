import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UMAMI_API_URL = "https://api.umami.is/v1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const UMAMI_API_KEY = Deno.env.get("UMAMI_API_KEY");
    const UMAMI_WEBSITE_ID = Deno.env.get("UMAMI_WEBSITE_ID");

    if (!UMAMI_API_KEY || !UMAMI_WEBSITE_ID) {
      throw new Error("UMAMI_API_KEY or UMAMI_WEBSITE_ID not configured");
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint) {
      throw new Error("Missing endpoint parameter");
    }

    // Build the Umami API URL
    // Allowed endpoints: stats, pageviews, metrics
    const allowedEndpoints = ["stats", "pageviews", "metrics"];
    if (!allowedEndpoints.includes(endpoint)) {
      throw new Error("Invalid endpoint");
    }

    // Forward query parameters (except endpoint)
    const umamiParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key !== "endpoint") {
        umamiParams.set(key, value);
      }
    });

    const umamiUrl = `${UMAMI_API_URL}/websites/${UMAMI_WEBSITE_ID}/${endpoint}?${umamiParams.toString()}`;

    const response = await fetch(umamiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-umami-api-key": UMAMI_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Umami API error:", errorText);
      throw new Error(`Umami API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
