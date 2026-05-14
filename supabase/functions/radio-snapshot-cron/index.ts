import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Try to fetch detailed listeners for avg listening time
    let avgListeningTime: number | null = null;
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
        const listeners = await listenersRes.json();
        if (Array.isArray(listeners) && listeners.length > 0) {
          const totalTime = listeners.reduce(
            (sum: number, l: { connected_time?: number }) =>
              sum + (l.connected_time || 0),
            0
          );
          avgListeningTime = Math.round(totalTime / listeners.length);
        }
      }
    } catch (e) {
      console.warn("Could not fetch listeners for avg time:", e);
      // avgListeningTime stays null — not polluting with 0
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

    // Insert snapshot
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
      throw new Error(`Supabase insert error: ${insertErr.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        listeners_current: nowPlaying.listeners?.current ?? 0,
        avg_listening_time: avgListeningTime,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Snapshot cron error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
