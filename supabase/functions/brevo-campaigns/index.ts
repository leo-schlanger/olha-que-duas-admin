import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CampaignStatistics {
  globalStats: {
    uniqueClicks: number;
    clickers: number;
    complaints: number;
    delivered: number;
    sent: number;
    softBounces: number;
    hardBounces: number;
    uniqueViews: number;
    trackableViews: number;
    unsubscriptions: number;
    viewed: number;
  };
}

interface BrevoCampaign {
  id: number;
  name: string;
  subject: string;
  status: string;
  scheduledAt?: string;
  createdAt: string;
  modifiedAt: string;
  sentDate?: string;
  statistics?: CampaignStatistics;
  recipients: {
    lists: number[];
  };
}

interface BrevoResponse {
  campaigns: BrevoCampaign[];
  count: number;
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

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status") || "sent"; // sent, draft, queued, etc.

    // Fetch campaigns from Brevo
    const response = await fetch(
      `https://api.brevo.com/v3/emailCampaigns?type=classic&status=${status}&limit=${limit}&offset=${offset}&sort=desc&statistics=globalStats`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "api-key": BREVO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch campaigns");
    }

    const data: BrevoResponse = await response.json();

    // Transform to our format (handle empty campaigns array)
    const campaigns = (data.campaigns || []).map((campaign) => {
      const stats = campaign.statistics?.globalStats;
      const openRate = stats && stats.sent > 0
        ? Math.round((stats.uniqueViews / stats.sent) * 100)
        : 0;
      const clickRate = stats && stats.sent > 0
        ? Math.round((stats.uniqueClicks / stats.sent) * 100)
        : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        sentDate: campaign.sentDate || campaign.scheduledAt || campaign.createdAt,
        createdAt: campaign.createdAt,
        stats: stats ? {
          sent: stats.sent,
          delivered: stats.delivered,
          opened: stats.uniqueViews,
          clicked: stats.uniqueClicks,
          bounced: stats.hardBounces + stats.softBounces,
          unsubscribed: stats.unsubscriptions,
          openRate,
          clickRate,
        } : null,
      };
    });

    return new Response(
      JSON.stringify({
        campaigns,
        total: data.count || 0,
        limit,
        offset,
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
