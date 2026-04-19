import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers: number;
  totalBlacklisted: number;
  createdAt: string;
  dynamicList: boolean;
}

interface CreateListRequest {
  name: string;
  folderId?: number;
}

interface UpdateListRequest {
  id: number;
  name: string;
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

    // GET - List all groups with real contact counts
    if (req.method === "GET") {
      const response = await fetch(
        "https://api.brevo.com/v3/contacts/lists?limit=50&offset=0",
        {
          method: "GET",
          headers: brevoHeaders,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch lists");
      }

      const data = await response.json();
      const lists: BrevoList[] = data.lists || [];

      // Fetch real contact count for each list (totalSubscribers from lists API can be stale)
      const groups = await Promise.all(
        lists.map(async (list) => {
          let realCount = list.totalSubscribers;
          try {
            const countResponse = await fetch(
              `https://api.brevo.com/v3/contacts/lists/${list.id}/contacts?limit=1&offset=0`,
              { method: "GET", headers: brevoHeaders }
            );
            if (countResponse.ok) {
              const countData = await countResponse.json();
              realCount = countData.count ?? list.totalSubscribers;
            }
          } catch {
            // Fall back to the cached count
          }

          return {
            id: list.id,
            name: list.name,
            totalSubscribers: realCount,
            totalBlacklisted: list.totalBlacklisted,
            createdAt: list.createdAt,
          };
        })
      );

      return new Response(
        JSON.stringify({ groups, total: data.count || groups.length }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST - Create a new group
    if (req.method === "POST") {
      const { name, folderId }: CreateListRequest = await req.json();

      if (!name) {
        return new Response(
          JSON.stringify({ error: "Nome do grupo é obrigatório" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const body: Record<string, unknown> = { name };
      if (folderId) {
        body.folderId = folderId;
      } else {
        body.folderId = 1;
      }

      const response = await fetch("https://api.brevo.com/v3/contacts/lists", {
        method: "POST",
        headers: brevoHeaders,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create list");
      }

      const resData = await response.json();

      return new Response(
        JSON.stringify({
          success: true,
          id: resData.id,
          message: `Grupo "${name}" criado com sucesso!`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // PUT - Update/rename a group
    if (req.method === "PUT") {
      const { id, name }: UpdateListRequest = await req.json();

      if (!id || !name) {
        return new Response(
          JSON.stringify({ error: "ID e nome são obrigatórios" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const response = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${id}`,
        {
          method: "PUT",
          headers: brevoHeaders,
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update list");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Grupo renomeado para "${name}"`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // DELETE - Delete a group
    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(
          JSON.stringify({ error: "ID do grupo é obrigatório" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const response = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${id}`,
        {
          method: "DELETE",
          headers: brevoHeaders,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete list");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Grupo removido com sucesso!",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
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
