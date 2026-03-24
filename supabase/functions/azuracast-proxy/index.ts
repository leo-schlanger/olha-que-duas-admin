import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const AZURACAST_URL = Deno.env.get("AZURACAST_URL");
    const AZURACAST_API_KEY = Deno.env.get("AZURACAST_API_KEY");
    const AZURACAST_STATION_ID = Deno.env.get("AZURACAST_STATION_ID") || "1";

    if (!AZURACAST_URL || !AZURACAST_API_KEY) {
      throw new Error("AZURACAST_URL or AZURACAST_API_KEY not configured");
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint) {
      throw new Error("Missing endpoint parameter");
    }

    // Map endpoints to AzuraCast API paths
    const endpointMap: Record<string, string> = {
      nowplaying: `/api/nowplaying/${AZURACAST_STATION_ID}`,
      history: `/api/station/${AZURACAST_STATION_ID}/history`,
      listeners: `/api/station/${AZURACAST_STATION_ID}/listeners`,
      stats: `/api/admin/server/stats`,
    };

    if (!endpointMap[endpoint]) {
      throw new Error(`Invalid endpoint: ${endpoint}. Allowed: ${Object.keys(endpointMap).join(", ")}`);
    }

    // Build query string from remaining parameters
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key !== "endpoint") {
        queryParams.set(key, value);
      }
    });

    const queryString = queryParams.toString();
    const azuracastUrl = `${AZURACAST_URL}${endpointMap[endpoint]}${queryString ? `?${queryString}` : ""}`;

    console.log(`Fetching: ${azuracastUrl}`);

    const response = await fetch(azuracastUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-API-Key": AZURACAST_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AzuraCast API error:", errorText);
      throw new Error(`AzuraCast API error: ${response.status}`);
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
