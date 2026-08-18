import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ENDPOINTS = new Set(["stats", "pageviews", "metrics"]);
const SHARE_TOKEN_TTL_MS = 50 * 60 * 1000;

type ShareSession = {
  websiteId: string;
  token: string;
  expiresAt: number;
};

const sessionCache = new Map<string, ShareSession>();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cloudApiBase(region: string) {
  return `https://cloud.umami.is/analytics/${region}/api`;
}

async function getShareSession(shareId: string, region: string): Promise<ShareSession> {
  const cacheKey = `${region}:${shareId}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const response = await fetch(`${cloudApiBase(region)}/share/${shareId}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; OlhaQueDuasAdmin/1.0)",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("Umami share lookup failed:", response.status, text);
    throw new Error(`Umami share error: ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.websiteId || !payload?.token) {
    throw new Error("Umami share response missing websiteId/token");
  }

  const session = {
    websiteId: String(payload.websiteId),
    token: String(payload.token),
    expiresAt: Date.now() + SHARE_TOKEN_TTL_MS,
  };
  sessionCache.set(cacheKey, session);
  return session;
}

async function fetchShareEndpoint(
  session: ShareSession,
  region: string,
  endpoint: string,
  params: URLSearchParams,
) {
  const umamiUrl = `${cloudApiBase(region)}/websites/${session.websiteId}/${endpoint}?${params.toString()}`;
  return fetch(umamiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; OlhaQueDuasAdmin/1.0)",
      "x-umami-share-token": session.token,
      "x-umami-share-context": "1",
    },
  });
}

async function fetchOfficialApi(
  endpoint: string,
  params: URLSearchParams,
  apiKey: string,
  websiteId: string,
) {
  const umamiUrl = `https://api.umami.is/v1/websites/${websiteId}/${endpoint}?${params.toString()}`;
  return fetch(umamiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-umami-api-key": apiKey,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
      return json({ error: "Invalid endpoint" }, 400);
    }

    const shareId = url.searchParams.get("shareId") || Deno.env.get("UMAMI_SHARE_ID") || "";
    const region = (url.searchParams.get("region") || Deno.env.get("UMAMI_REGION") || "eu").toLowerCase();
    const apiKey = Deno.env.get("UMAMI_API_KEY") || "";
    const websiteId = Deno.env.get("UMAMI_WEBSITE_ID") || "";

    const umamiParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (["endpoint", "shareId", "region"].includes(key)) return;
      if (key === "type" && value === "url") {
        umamiParams.set(key, "path");
        return;
      }
      umamiParams.set(key, value);
    });

    let response: Response | null = null;

    if (shareId) {
      let session = await getShareSession(shareId, region);
      response = await fetchShareEndpoint(session, region, endpoint, umamiParams);
      if (response.status === 401) {
        sessionCache.delete(`${region}:${shareId}`);
        session = await getShareSession(shareId, region);
        response = await fetchShareEndpoint(session, region, endpoint, umamiParams);
      }
    } else if (apiKey && websiteId) {
      response = await fetchOfficialApi(endpoint, umamiParams, apiKey, websiteId);
    } else {
      throw new Error("UMAMI_SHARE_ID or UMAMI_API_KEY/UMAMI_WEBSITE_ID not configured");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Umami API error:", response.status, errorText);
      throw new Error(`Umami API error: ${response.status}`);
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return json({ error: message }, 500);
  }
});
