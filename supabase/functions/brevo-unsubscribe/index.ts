import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UnsubscribeRequest {
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const { email }: UnsubscribeRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Delete contact from Brevo
    const response = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "api-key": BREVO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      // 404 means contact doesn't exist - that's fine
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ success: true, message: "Contato não encontrado" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete contact");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contato removido com sucesso!" }),
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
