import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Só leitura, só os endpoints usados pelo painel. A chave do AzuraCast tem
// permissões de administração, por isso nada de PUT/POST nem /api/admin.
const ALLOWED_PARAMS = new Set(["start", "end", "unique"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  try {
    const AZURACAST_URL = Deno.env.get("AZURACAST_URL");
    const AZURACAST_API_KEY = Deno.env.get("AZURACAST_API_KEY");
    const AZURACAST_STATION_ID = Deno.env.get("AZURACAST_STATION_ID") || "1";

    if (!AZURACAST_URL || !AZURACAST_API_KEY) {
      throw new Error("AZURACAST_URL or AZURACAST_API_KEY not configured");
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    const endpointMap: Record<string, string> = {
      nowplaying: `/api/nowplaying/${AZURACAST_STATION_ID}`,
      history: `/api/station/${AZURACAST_STATION_ID}/history`,
      listeners: `/api/station/${AZURACAST_STATION_ID}/listeners`,
      "reports/best-worst": `/api/station/${AZURACAST_STATION_ID}/reports/overview/best-and-worst`,
    };

    if (!endpoint || !endpointMap[endpoint]) {
      return json({ error: `Invalid endpoint. Allowed: ${Object.keys(endpointMap).join(", ")}` }, 400);
    }

    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (ALLOWED_PARAMS.has(key)) queryParams.set(key, value);
    });

    const queryString = queryParams.toString();
    const azuracastUrl = `${AZURACAST_URL}${endpointMap[endpoint]}${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(azuracastUrl, {
      headers: {
        "Accept": "application/json",
        "X-API-Key": AZURACAST_API_KEY,
      },
    });

    if (!response.ok) {
      console.error("AzuraCast API error:", response.status, await response.text());
      throw new Error(`AzuraCast API error: ${response.status}`);
    }

    return json(await response.json(), 200);
  } catch (error) {
    console.error("Error:", error);
    return json({ error: (error as Error).message || "Internal server error" }, 500);
  }
});
