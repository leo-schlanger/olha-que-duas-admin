import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BrevoContact {
  email: string;
  id: number;
  emailBlacklisted: boolean;
  smsBlacklisted: boolean;
  createdAt: string;
  modifiedAt: string;
  attributes: {
    NOME?: string;
  };
}

interface BrevoListResponse {
  contacts: BrevoContact[];
  count: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const BREVO_LIST_ID = Deno.env.get("BREVO_LIST_ID") || "2";

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") || "50";
    const offset = url.searchParams.get("offset") || "0";

    // Get contacts from Brevo list
    const response = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}/contacts?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "api-key": BREVO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch contacts");
    }

    const data: BrevoListResponse = await response.json();

    // Transform to simpler format
    const subscribers = data.contacts.map((contact) => ({
      id: contact.id,
      email: contact.email,
      nome: contact.attributes?.NOME || "",
      createdAt: contact.createdAt,
      isActive: !contact.emailBlacklisted,
    }));

    return new Response(
      JSON.stringify({
        subscribers,
        total: data.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
