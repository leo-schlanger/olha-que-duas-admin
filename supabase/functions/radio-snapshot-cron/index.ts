import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AzuraListener {
  ip?: string;
  user_agent?: string;
  hash?: string;
  connected_on?: number;
  connected_until?: number;
  connected_time?: number;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  device?: {
    client?: string;
    is_browser?: boolean;
    is_mobile?: boolean;
    is_bot?: boolean;
  };
}

function getDeviceType(listener: AzuraListener): string {
  if (listener.device?.is_mobile) return "mobile";
  if (listener.device?.is_browser) return "desktop";
  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const AZURACAST_URL = Deno.env.get("AZURACAST_URL");
    const AZURACAST_API_KEY = Deno.env.get("AZURACAST_API_KEY");
    const AZURACAST_STATION_ID = Deno.env.get("AZURACAST_STATION_ID") || "1";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!AZURACAST_URL || !AZURACAST_API_KEY) {
      throw new Error("AZURACAST_URL or AZURACAST_API_KEY not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch now playing data
    const nowPlayingRes = await fetch(
      `${AZURACAST_URL}/api/nowplaying/${AZURACAST_STATION_ID}`,
      {
        headers: {
          "Accept": "application/json",
          "X-API-Key": AZURACAST_API_KEY,
        },
      }
    );

    if (!nowPlayingRes.ok) {
      throw new Error(`AzuraCast nowplaying error: ${nowPlayingRes.status}`);
    }

    const nowPlaying = await nowPlayingRes.json();

    // Fetch detailed listeners for individual tracking + avg listening time
    let avgListeningTime: number | null = null;
    let listeners: AzuraListener[] = [];

    try {
      const listenersRes = await fetch(
        `${AZURACAST_URL}/api/station/${AZURACAST_STATION_ID}/listeners`,
        {
          headers: {
            "Accept": "application/json",
            "X-API-Key": AZURACAST_API_KEY,
          },
        }
      );

      if (listenersRes.ok) {
        listeners = await listenersRes.json();
        if (Array.isArray(listeners) && listeners.length > 0) {
          const totalTime = listeners.reduce(
            (sum: number, l: AzuraListener) =>
              sum + (l.connected_time || 0),
            0
          );
          avgListeningTime = Math.round(totalTime / listeners.length);
        }
      }
    } catch (e) {
      console.warn("Could not fetch listeners for avg time:", e);
    }

    // Deduplicate: check if a snapshot was recorded in the last 4 minutes
    const fourMinAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("radio_listener_snapshots")
      .select("id")
      .gte("recorded_at", fourMinAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return new Response(
        JSON.stringify({ message: "Snapshot already exists within last 4 minutes, skipping" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert aggregate snapshot
    const { error: insertErr } = await supabase
      .from("radio_listener_snapshots")
      .insert({
        listeners_current: nowPlaying.listeners?.current ?? 0,
        listeners_unique: nowPlaying.listeners?.unique ?? 0,
        listeners_total: nowPlaying.listeners?.total ?? 0,
        avg_listening_time: avgListeningTime,
        is_online: nowPlaying.is_online ?? false,
        is_live: nowPlaying.live?.is_live ?? false,
      });

    if (insertErr) {
      throw new Error(`Supabase snapshot insert error: ${insertErr.message}`);
    }

    // Track individual listener sessions (for retention/cohort analysis)
    let sessionsInserted = 0;
    if (Array.isArray(listeners) && listeners.length > 0) {
      // Get known listener hashes to determine first session
      const hashes = listeners
        .map((l) => l.hash)
        .filter((h): h is string => !!h);

      let knownHashes = new Set<string>();
      if (hashes.length > 0) {
        const { data: existing } = await supabase
          .from("listener_sessions")
          .select("listener_hash")
          .in("listener_hash", hashes);

        if (existing) {
          knownHashes = new Set(existing.map((e) => e.listener_hash));
        }
      }

      // Build session records
      const sessions = listeners
        .filter((l) => l.hash)
        .map((l) => ({
          listener_hash: l.hash!,
          ip_address: l.ip || null,
          user_agent: l.user_agent || null,
          country: l.location?.country || null,
          city: l.location?.city || null,
          device_type: getDeviceType(l),
          connected_at: l.connected_on
            ? new Date(l.connected_on * 1000).toISOString()
            : new Date().toISOString(),
          connected_seconds: l.connected_time || 0,
          is_first_session: !knownHashes.has(l.hash!),
        }));

      if (sessions.length > 0) {
        // Deduplicate: avoid inserting same listener_hash + connected_at combo
        // We insert in batches of 50 to stay within limits
        const BATCH_SIZE = 50;
        for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
          const batch = sessions.slice(i, i + BATCH_SIZE);
          const { error: sessErr } = await supabase
            .from("listener_sessions")
            .upsert(batch, {
              onConflict: "listener_hash,connected_at",
              ignoreDuplicates: true,
            });

          if (sessErr) {
            // Fallback: try simple insert ignoring conflicts
            const { error: fallbackErr } = await supabase
              .from("listener_sessions")
              .insert(batch);

            if (fallbackErr) {
              console.warn(`Session insert batch error: ${fallbackErr.message}`);
            } else {
              sessionsInserted += batch.length;
            }
          } else {
            sessionsInserted += batch.length;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        listeners_current: nowPlaying.listeners?.current ?? 0,
        avg_listening_time: avgListeningTime,
        sessions_tracked: sessionsInserted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Snapshot cron error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
