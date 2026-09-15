import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Garante que o pedido vem de um administrador do painel com sessão
// Supabase Auth válida. Devolve uma Response de erro, ou null se autorizado.
export async function requireAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const deny = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return deny(401, "Sessão em falta");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return deny(500, "SUPABASE_URL or SUPABASE_ANON_KEY not configured");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return deny(401, "Sessão inválida ou expirada");

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || isAdmin !== true) return deny(403, "Sem permissão");

  return null;
}
