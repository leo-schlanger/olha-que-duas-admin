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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") || "50";
    const offset = url.searchParams.get("offset") || "0";
    const listId = url.searchParams.get("listId");

    let apiUrl: string;

    if (listId) {
      // Fetch contacts from a specific list
      apiUrl = `https://api.brevo.com/v3/contacts/lists/${listId}/contacts?limit=${limit}&offset=${offset}`;
    } else {
      // Fetch ALL contacts in the account (across all lists)
      apiUrl = `https://api.brevo.com/v3/contacts?limit=${limit}&offset=${offset}`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "api-key": BREVO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch contacts");
    }

    const data = await response.json();

    const contacts: BrevoContact[] = data.contacts || [];

    const subscribers = contacts.map((contact) => ({
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
