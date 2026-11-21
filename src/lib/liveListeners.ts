// Live listener counts without bots (Rádio tab). Same bot rule as the SQL
// classify_listener_source (supabase/analytics-v2-sources.sql).

const BOT_UA = /(bot|crawler|spider|heritrix|curl\/|wget|python-requests|uptime)/i;

export interface LiveListener {
  ip: string;
  user_agent: string;
  device?: { is_bot?: boolean } | null;
}

export interface LiveCounts {
  total: number;
  unique: number;
  current: number;
}

export function isBotListener(l: LiveListener): boolean {
  return Boolean(l.device?.is_bot) || BOT_UA.test(l.user_agent ?? '');
}

/**
 * AzuraCast's live counts minus the bots. With the detailed list, bot IPs that
 * also have a human connection are not subtracted from unique/current; without
 * it, the bot count of the last snapshot (radio_human_snapshots) is used.
 */
export function humanLiveCounts(
  counts: LiveCounts,
  list: LiveListener[] | null,
  fallbackBots: number | null = null,
): LiveCounts & { bots: number } {
  const clamp = (n: number) => Math.max(0, n);
  if (list) {
    const bots = list.filter(isBotListener);
    const humanIps = new Set(list.filter((l) => !isBotListener(l)).map((l) => l.ip));
    const botOnlyIps = new Set(bots.map((l) => l.ip).filter((ip) => !humanIps.has(ip))).size;
    return {
      total: clamp(counts.total - bots.length),
      unique: clamp(counts.unique - botOnlyIps),
      current: clamp(counts.current - botOnlyIps),
      bots: bots.length,
    };
  }
  const b = fallbackBots ?? 0;
  return { total: clamp(counts.total - b), unique: clamp(counts.unique - b), current: clamp(counts.current - b), bots: b };
}

/** Umami /stats body with the fields the cards need (a `{}` is not data). */
export function isUmamiStats(body: unknown): boolean {
  return Boolean(body) && typeof body === 'object' && !Array.isArray(body) && 'pageviews' in (body as object) && 'visitors' in (body as object);
}
