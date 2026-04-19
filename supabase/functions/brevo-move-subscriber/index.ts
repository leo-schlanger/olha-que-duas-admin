import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MoveRequest {
  emails: string[];
  fromListId: number;
  toListId: number;
}

interface AddToListRequest {
  emails: string[];
  listId: number;
}

interface RemoveFromListRequest {
  emails: string[];
  listId: number;
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

    const brevoHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    };

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "move";

    const body = await req.json();

    if (action === "add-to-list") {
      // Add contacts to a specific list
      const { emails, listId }: AddToListRequest = body;

      if (!emails?.length || !listId) {
        return new Response(
          JSON.stringify({ error: "emails e listId são obrigatórios" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const response = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`,
        {
          method: "POST",
          headers: brevoHeaders,
          body: JSON.stringify({ emails }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add contacts to list");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `${emails.length} subscritor(es) adicionado(s) ao grupo`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "remove-from-list") {
      // Remove contacts from a specific list (doesn't delete the contact)
      const { emails, listId }: RemoveFromListRequest = body;

      if (!emails?.length || !listId) {
        return new Response(
          JSON.stringify({ error: "emails e listId são obrigatórios" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const response = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`,
        {
          method: "POST",
          headers: brevoHeaders,
          body: JSON.stringify({ emails }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to remove contacts from list"
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `${emails.length} subscritor(es) removido(s) do grupo`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default: move (add to target + remove from source)
    const { emails, fromListId, toListId }: MoveRequest = body;

    if (!emails?.length || !fromListId || !toListId) {
      return new Response(
        JSON.stringify({
          error: "emails, fromListId e toListId são obrigatórios",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add to target list
    const addResponse = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${toListId}/contacts/add`,
      {
        method: "POST",
        headers: brevoHeaders,
        body: JSON.stringify({ emails }),
      }
    );

    if (!addResponse.ok) {
      const errorData = await addResponse.json();
      throw new Error(
        errorData.message || "Failed to add contacts to target list"
      );
    }

    // Remove from source list
    const removeResponse = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${fromListId}/contacts/remove`,
      {
        method: "POST",
        headers: brevoHeaders,
        body: JSON.stringify({ emails }),
      }
    );

    if (!removeResponse.ok) {
      const errorData = await removeResponse.json();
      throw new Error(
        errorData.message || "Failed to remove contacts from source list"
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${emails.length} subscritor(es) movido(s) com sucesso`,
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
