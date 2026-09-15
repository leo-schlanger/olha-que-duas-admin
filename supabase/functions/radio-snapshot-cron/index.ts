import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type AzuraListener, isoUtc, lisbonMidnight, toConnectionRows } from "./connections.ts";

// Corre a cada 5 minutos (pg_cron) e faz duas coisas:
//  1. Fotografia de ouvintes simultâneos → radio_listener_snapshots
//  2. Histórico de ligações do AzuraCast (unique=false) → listener_connections
//     O AzuraCast regista TODAS as ligações (incluindo as curtas) e corta cada
//     uma ao intervalo pedido, por isso usamos janelas sobrepostas de 48 h e
//     ignoramos as ligações cortadas no início da janela (já foram vistas).
//
// Backfill: POST {"backfill_from": "2026-04-14", "backfill_to": "2026-09-15"}
// (datas em hora de Lisboa) recolhe o histórico dia a dia sem tirar fotografia.
//
// Autorização:
//  - pg_cron envia a anon key: só faz a recolha normal, e no máximo uma vez a
//    cada 4 minutos (se já houver fotografia recente, não faz nada).
//  - Backfill e execução forçada exigem o header x-cron-secret = CRON_SECRET.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const DAY_SECONDS = 24 * 60 * 60;
const LIVE_WINDOW_SECONDS = 2 * DAY_SECONDS;
const UPSERT_BATCH_SIZE = 500;

interface AzuraNowPlaying {
  is_online?: boolean;
  listeners?: { current?: number; unique?: number; total?: number };
  live?: { is_live?: boolean };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type AccessLevel = "trusted" | "cron" | null;

// Role declarado no JWT. NÃO é verificado aqui: só serve para identificar o
// pg_cron (anon key, que é pública), cujo acesso é inofensivo e limitado.
function jwtRole(req: Request): string | null {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))).role ?? null;
  } catch {
    return null;
  }
}

function accessLevel(req: Request): AccessLevel {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (cronSecret && headerSecret && headerSecret === cronSecret) return "trusted";
  if (jwtRole(req) === "anon") return "cron";
  return null;
}

async function azuraGet(path: string): Promise<unknown> {
  const url = Deno.env.get("AZURACAST_URL");
  const key = Deno.env.get("AZURACAST_API_KEY");
  if (!url || !key) throw new Error("AZURACAST_URL or AZURACAST_API_KEY not configured");

  const res = await fetch(`${url}${path}`, {
    headers: { "Accept": "application/json", "X-API-Key": key },
  });
  if (!res.ok) throw new Error(`AzuraCast ${path.split("?")[0]} error: ${res.status}`);
  return res.json();
}

async function ingestWindow(
  supabase: SupabaseClient,
  stationId: string,
  windowStart: number,
  windowEnd: number,
): Promise<{ fetched: number; upserted: number }> {
  const listeners = await azuraGet(
    `/api/station/${stationId}/listeners?unique=false&start=${isoUtc(windowStart)}&end=${isoUtc(windowEnd)}`,
  );
  if (!Array.isArray(listeners)) {
    throw new Error("AzuraCast listeners history: unexpected response");
  }

  const rows = toConnectionRows(listeners as AzuraListener[], windowStart, windowEnd);
  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("listener_connections")
      .upsert(batch, { onConflict: "listener_hash,connected_on" });
    if (error) throw new Error(`listener_connections upsert error: ${error.message}`);
  }

  return { fetched: listeners.length, upserted: rows.length };
}

async function takeSnapshot(supabase: SupabaseClient, stationId: string) {
  // Evitar duplicados se o cron disparar duas vezes
  const fourMinAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("radio_listener_snapshots")
    .select("id")
    .gte("recorded_at", fourMinAgo)
    .limit(1);
  if (recent && recent.length > 0) return { skipped: true };

  const nowPlaying = await azuraGet(`/api/nowplaying/${stationId}`) as AzuraNowPlaying;

  // Tempo médio de ligação de quem está a ouvir agora (informativo)
  let avgListeningTime: number | null = null;
  try {
    const live = await azuraGet(`/api/station/${stationId}/listeners`);
    if (Array.isArray(live) && live.length > 0) {
      const total = (live as AzuraListener[]).reduce((s, l) => s + (l.connected_time || 0), 0);
      avgListeningTime = Math.round(total / live.length);
    }
  } catch (e) {
    console.warn("Could not fetch live listeners:", e);
  }

  const snapshot = {
    listeners_current: nowPlaying.listeners?.current ?? 0,
    listeners_unique: nowPlaying.listeners?.unique ?? 0,
    listeners_total: nowPlaying.listeners?.total ?? 0,
    avg_listening_time: avgListeningTime,
    is_online: nowPlaying.is_online ?? false,
    is_live: nowPlaying.live?.is_live ?? false,
  };

  const { error } = await supabase.from("radio_listener_snapshots").insert(snapshot);
  if (error) throw new Error(`Supabase snapshot insert error: ${error.message}`);

  return { skipped: false, listeners_current: snapshot.listeners_current };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const access = accessLevel(req);
  if (!access) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stationId = Deno.env.get("AZURACAST_STATION_ID") || "1";
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let body: { backfill_from?: string; backfill_to?: string } = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
    }

    const nowSec = Math.floor(Date.now() / 1000);

    // --- Backfill ---
    if (body.backfill_from) {
      if (access !== "trusted") {
        return json({ error: "Backfill requires x-cron-secret" }, 403);
      }
      const dateRe = /^\d{4}-\d{2}-\d{2}$/;
      const to = body.backfill_to ?? new Date().toISOString().slice(0, 10);
      if (!dateRe.test(body.backfill_from) || !dateRe.test(to)) {
        return json({ error: "backfill_from/backfill_to devem ser YYYY-MM-DD" }, 400);
      }

      const days: Array<{ day: string; fetched: number; upserted: number }> = [];
      let day = body.backfill_from;
      while (day <= to) {
        const dayStart = lisbonMidnight(day);
        if (dayStart >= nowSec) break;
        // Janela = dia anterior + dia: apanha inteiras as ligações que atravessam a meia-noite
        const windowStart = dayStart - DAY_SECONDS;
        const windowEnd = Math.min(dayStart + DAY_SECONDS + 3600, nowSec);
        const result = await ingestWindow(supabase, stationId, windowStart, windowEnd);
        days.push({ day, ...result });

        const next = new Date(`${day}T12:00:00Z`);
        next.setUTCDate(next.getUTCDate() + 1);
        day = next.toISOString().slice(0, 10);
      }

      return json({
        success: true,
        mode: "backfill",
        days: days.length,
        fetched: days.reduce((s, d) => s + d.fetched, 0),
        upserted: days.reduce((s, d) => s + d.upserted, 0),
        detail: days,
      });
    }

    // --- Execução normal (cron) ---
    const snapshot = await takeSnapshot(supabase, stationId);
    if (snapshot.skipped && access !== "trusted") {
      return json({ success: true, mode: "cron", snapshot, connections: null });
    }
    const connections = await ingestWindow(supabase, stationId, nowSec - LIVE_WINDOW_SECONDS, nowSec);

    return json({ success: true, mode: "cron", snapshot, connections });
  } catch (error) {
    console.error("Snapshot cron error:", error);
    return json({ error: (error as Error).message || "Internal server error" }, 500);
  }
});
