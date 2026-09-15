import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email?: unknown;
  nome?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function badRequest(error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as SubscribeRequest | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const nome = typeof body?.nome === "string" ? body.nome.trim().slice(0, 100) : "";

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return badRequest("Email inválido");
    }

    // Endpoint público (site): a lista é sempre a da newsletter, nunca a
    // enviada pelo cliente, para ninguém inscrever emails noutras listas.
    const targetListId = parseInt(BREVO_LIST_ID);

    // Add contact to Brevo
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: {
          NOME: nome,
        },
        listIds: [targetListId],
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Contact already exists is not an error for subscription
      if (errorData.code === "duplicate_parameter") {
        return new Response(
          JSON.stringify({ success: true, message: "Já estás inscrito!" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(errorData.message || "Failed to add contact");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Inscrição realizada com sucesso!" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Não foi possível concluir a inscrição. Tenta mais tarde." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
