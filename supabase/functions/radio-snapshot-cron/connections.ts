// Lógica pura da recolha de ligações (testada em connections.test.ts).

export interface AzuraListener {
  ip?: string;
  user_agent?: string;
  hash?: string;
  mount_name?: string;
  connected_on?: number;
  connected_until?: number;
  connected_time?: number;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  device?: {
    client?: string;
    is_browser?: boolean;
    is_mobile?: boolean;
    is_bot?: boolean;
  };
}

export interface ConnectionRow {
  listener_hash: string;
  connected_on: string;
  connected_until: string;
  connected_seconds: number;
  ip_address: string | null;
  user_agent: string | null;
  client: string | null;
  is_mobile: boolean | null;
  is_bot: boolean;
  country: string | null;
  city: string | null;
  mount: string | null;
}

// O AzuraCast respeita o offset do ISO 8601, por isso enviamos sempre UTC.
export function isoUtc(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

// Início do dia (00:00 Europe/Lisbon) de uma data YYYY-MM-DD, em epoch seconds.
export function lisbonMidnight(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d) / 1000;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMidnight * 1000));
  const lisbonHourAtUtcMidnight = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  // Lisboa está em UTC+0 ou UTC+1: à meia-noite UTC são 00h ou 01h em Lisboa.
  return utcMidnight - lisbonHourAtUtcMidnight * 3600;
}

export function toConnectionRows(
  listeners: AzuraListener[],
  windowStart: number,
  windowEnd: number,
): ConnectionRow[] {
  const rows = new Map<string, ConnectionRow>();

  for (const l of listeners) {
    if (!l.hash || !l.connected_on) continue;
    // Cortada ao início da janela: começou antes e já foi registada antes.
    if (l.connected_on <= windowStart) continue;

    const on = l.connected_on;
    const until = Math.max(on, Math.min(l.connected_until || windowEnd, windowEnd));
    const key = `${l.hash}|${on}`;
    const row: ConnectionRow = {
      listener_hash: l.hash,
      connected_on: isoUtc(on),
      connected_until: isoUtc(until),
      connected_seconds: until - on,
      ip_address: l.ip || null,
      user_agent: l.user_agent || null,
      client: l.device?.client || null,
      is_mobile: l.device?.is_mobile ?? null,
      is_bot: l.device?.is_bot ?? false,
      country: l.location?.country || null,
      city: l.location?.city || null,
      mount: l.mount_name || null,
    };

    const existing = rows.get(key);
    if (!existing || existing.connected_seconds < row.connected_seconds) rows.set(key, row);
  }

  return [...rows.values()];
}

export interface ClippedConnection {
  listener_hash: string;
  connected_until: number;
}

// Ligações que começaram antes da janela e continuam ativas no fim dela
// (ouvintes com mais de 48 h seguidas). O AzuraCast devolve-as com o início
// cortado, por isso não dá para as gravar pela chave hash+início: servem só
// para prolongar a ligação que já está na base de dados.
export function clippedActiveConnections(
  listeners: AzuraListener[],
  windowStart: number,
  windowEnd: number,
  activeSlackSeconds = 600,
): ClippedConnection[] {
  const byHash = new Map<string, number>();

  for (const l of listeners) {
    if (!l.hash || !l.connected_on || l.connected_on > windowStart) continue;
    const until = Math.min(l.connected_until || windowEnd, windowEnd);
    if (until < windowEnd - activeSlackSeconds) continue;
    byHash.set(l.hash, Math.max(byHash.get(l.hash) ?? 0, until));
  }

  return [...byHash].map(([listener_hash, connected_until]) => ({ listener_hash, connected_until }));
}
