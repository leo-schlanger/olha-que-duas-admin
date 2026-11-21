// Pure helpers for per-piece analytics (Umami + Search Console).
// No imports and no import.meta: tests run them with `node --test`.

/** Pieces that lived at /exclusivo/<slug> before programs existed (copy of the site's middleware). */
export const LEGACY_NEWS_SLUGS = new Set([
  'abel-dias-o-ze-nunca-bateu-na-betty',
  'ronaldo-nao-voltara-a-ser-cr7',
  'biografia-diogo-jota-livro-oficial-liverpool',
  'cristina-ferreira-joao-monteiro-realizam-sonho-fabio-marques-np4game',
  'susana-da-silva-tribunal-antonio-pedro-cerdeira-romance-comandante-melides',
  'papa-leao-xiv-nodulo-pulmao-vai-ser-operado',
  'pedro-mourinho-fora-do-now',
  'david-antunes-morte-netinho',
]);

const NEWS_PROGRAM = 'noticias-olha-que-duas';
const OLD_NEWS_PROGRAM = 'olha-que-duas-e-eu';

export interface PiecePath {
  slug: string;
  /** Program slug as written in the address (after the site's redirects). */
  programSlug: string;
}

/**
 * Maps any address of a piece to its slug. Mirrors the site's legacyRedirect:
 * /exclusivo/<prog>/<slug> → /programas/<prog>/<slug> (301 since 20/11/2026),
 * /exclusivo/<slug> (8 old news), olha-que-duas-e-eu → Notícias.
 * Accepts full URLs (Search Console) and Umami paths.
 */
export function piecePathOf(raw: string): PiecePath | null {
  let path = raw.trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return null;
    }
  }
  path = path.split(/[?#]/)[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep as is
  }
  path = path.toLowerCase().replace(/\/+$/, '');
  if (/\.[a-z0-9]+$/.test(path)) return null; // covers and other files
  const segs = path.split('/').filter(Boolean);
  if (segs[0] !== 'exclusivo' && segs[0] !== 'programas') return null;
  const rest = segs.slice(1);
  if (rest.length === 2) {
    const programSlug = rest[0] === OLD_NEWS_PROGRAM ? NEWS_PROGRAM : rest[0];
    return { slug: rest[1], programSlug };
  }
  if (rest.length === 1 && segs[0] === 'exclusivo' && LEGACY_NEWS_SLUGS.has(rest[0])) {
    return { slug: rest[0], programSlug: NEWS_PROGRAM };
  }
  return null;
}

export interface PathRow {
  name: string;
  pageviews: number;
  visitors: number;
}

export interface PostRef {
  slug: string;
  title: string;
  program_id: string;
}

export interface ProgramRef {
  id: string;
  slug: string;
  title: string;
}

export interface PieceStat {
  slug: string;
  title: string;
  /** False when the slug no longer exists in the database (deleted or renamed). */
  found: boolean;
  programSlug: string;
  programTitle: string;
  pageviews: number;
  /** Sum over the piece's addresses: a person who opened both counts twice (rare). */
  visitors: number;
  paths: string[];
}

export function prettySlug(slug: string): string {
  const text = slug.replace(/-+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Normalizes Umami `metrics/expanded` rows ({name, pageviews, visitors, …}). */
export function toPathRows(payload: unknown): PathRow[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const name = String(r.name ?? r.x ?? '');
      if (!name) return null;
      return { name, pageviews: num(r.pageviews), visitors: num(r.visitors), visits: num(r.visits) };
    })
    .filter((r): r is PathRow & { visits: number } => r !== null);
}

/** Joins every address of the same piece and names it from the database. Sorted by reads. */
export function mergePieces(rows: PathRow[], posts: PostRef[], programs: ProgramRef[]): PieceStat[] {
  const postBySlug = new Map(posts.map((p) => [p.slug.toLowerCase(), p]));
  const programById = new Map(programs.map((p) => [p.id, p]));
  const programBySlug = new Map(programs.map((p) => [p.slug.toLowerCase(), p]));
  const pieces = new Map<string, PieceStat>();

  for (const row of rows) {
    const ref = piecePathOf(row.name);
    if (!ref) continue;
    let piece = pieces.get(ref.slug);
    if (!piece) {
      const post = postBySlug.get(ref.slug);
      // Program from the database when the piece exists (paths may carry old program slugs).
      const program = (post && programById.get(post.program_id)) || programBySlug.get(ref.programSlug);
      piece = {
        slug: ref.slug,
        title: post?.title || prettySlug(ref.slug),
        found: Boolean(post),
        programSlug: program?.slug ?? ref.programSlug,
        programTitle: program?.title ?? prettySlug(ref.programSlug),
        pageviews: 0,
        visitors: 0,
        paths: [],
      };
      pieces.set(ref.slug, piece);
    }
    piece.pageviews += row.pageviews;
    piece.visitors += row.visitors;
    if (!piece.paths.includes(row.name)) piece.paths.push(row.name);
  }

  return [...pieces.values()].sort((a, b) => b.pageviews - a.pageviews || a.title.localeCompare(b.title, 'pt'));
}

export interface ProgramStat {
  programSlug: string;
  programTitle: string;
  pageviews: number;
  pieces: number;
}

export function groupByProgram(pieces: PieceStat[]): ProgramStat[] {
  const map = new Map<string, ProgramStat>();
  for (const p of pieces) {
    const cur = map.get(p.programSlug) ?? {
      programSlug: p.programSlug,
      programTitle: p.programTitle,
      pageviews: 0,
      pieces: 0,
    };
    cur.pageviews += p.pageviews;
    cur.pieces += 1;
    map.set(p.programSlug, cur);
  }
  return [...map.values()].sort((a, b) => b.pageviews - a.pageviews);
}

/** % change; null when there is nothing to compare with (new piece / no data). */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatChange(current: number, previous: number): string {
  const change = percentChange(current, previous);
  if (change === null) return current > 0 ? 'novo' : '—';
  const rounded = Math.round(change);
  if (rounded === 0) return 'igual';
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

// ---------- Origins ----------

export type SourceGroup = 'Google' | 'Instagram' | 'Facebook' | 'WhatsApp' | 'Direto' | 'Outros';

export const SOURCE_ORDER: SourceGroup[] = ['Google', 'Instagram', 'Facebook', 'WhatsApp', 'Direto', 'Outros'];

/** Groups a referrer domain in plain words. */
export function sourceGroup(referrer: string): SourceGroup {
  const host = referrer.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  if (!host || host === '(direct)' || host === 'direct') return 'Direto';
  if (/(^|\.)google\.[a-z.]+$/.test(host) || host.includes('googlequicksearchbox') || host === 'com.google.android.gm') {
    return 'Google';
  }
  if (host.includes('instagram')) return 'Instagram';
  if (/(^|\.)facebook\.com$/.test(host) || /(^|\.)fb\.(com|me)$/.test(host) || host.includes('com.facebook')) {
    return 'Facebook';
  }
  if (host.includes('whatsapp') || host === 'wa.me') return 'WhatsApp';
  return 'Outros';
}

export interface MetricRow {
  name: string;
  visits: number;
}

/** Normalizes Umami `metrics/expanded` rows into {name, visits}. */
export function toVisitRows(payload: unknown): MetricRow[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      return { name: String(r.name ?? r.x ?? ''), visits: num(r.visits ?? r.y) };
    })
    .filter((r): r is MetricRow => r !== null && r.name !== '');
}

export interface SourceStat {
  group: SourceGroup;
  visits: number;
  share: number;
  /** Domains folded into the group (for the tooltip / "Outros"). */
  hosts: string[];
}

/**
 * Visits by origin. Referrers carry every site that sent people; the direct
 * visits come from Umami's `channel` metric (the referrer list leaves them out).
 */
export function groupSources(referrers: MetricRow[], channels: MetricRow[]): SourceStat[] {
  const totals = new Map<SourceGroup, { visits: number; hosts: string[] }>();
  const add = (group: SourceGroup, visits: number, host?: string) => {
    const cur = totals.get(group) ?? { visits: 0, hosts: [] };
    cur.visits += visits;
    if (host && !cur.hosts.includes(host)) cur.hosts.push(host);
    totals.set(group, cur);
  };
  for (const r of referrers) {
    const g = sourceGroup(r.name);
    if (g === 'Direto') continue; // counted from channels below
    add(g, r.visits, r.name);
  }
  const direct = channels.find((c) => c.name === 'direct');
  if (direct) add('Direto', direct.visits);

  const sum = [...totals.values()].reduce((s, v) => s + v.visits, 0);
  return SOURCE_ORDER.filter((g) => (totals.get(g)?.visits ?? 0) > 0).map((g) => {
    const t = totals.get(g)!;
    return { group: g, visits: t.visits, share: sum > 0 ? (t.visits / sum) * 100 : 0, hosts: t.hosts };
  });
}

/** Adds several origin lists (one per address of the same piece). */
export function sumRows(lists: MetricRow[][]): MetricRow[] {
  const map = new Map<string, number>();
  for (const list of lists) for (const r of list) map.set(r.name, (map.get(r.name) ?? 0) + r.visits);
  return [...map.entries()].map(([name, visits]) => ({ name, visits }));
}

// ---------- Weeks ----------

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

export interface WeekWindow {
  startAt: number;
  endAt: number;
}

/** N rolling 7-day windows ending at `now`, oldest first (equal length, so they compare fairly). */
export function rollingWeeks(now: number, count: number): WeekWindow[] {
  const weeks: WeekWindow[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    weeks.push({ startAt: now - (i + 1) * WEEK_MS, endAt: now - i * WEEK_MS });
  }
  return weeks;
}

export function weekLabel(w: WeekWindow, timeZone = 'Europe/Lisbon'): string {
  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', timeZone });
  // endAt is exclusive: the last day shown is the day before (or today for the current window).
  return `${fmt(w.startAt)}–${fmt(w.endAt - 1)}`;
}

// ---------- Search Console ----------

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPieceStat {
  slug: string;
  clicks: number;
  impressions: number;
  /** clicks / impressions (recomputed, never averaged). */
  ctr: number;
  /** Impression-weighted average position. */
  position: number;
  pages: string[];
}

/** Joins Search Console page rows of the same piece (old and new addresses). */
export function mergeGscPages(rows: GscRow[]): GscPieceStat[] {
  const map = new Map<string, { clicks: number; impressions: number; posWeight: number; pages: string[] }>();
  for (const row of rows) {
    const ref = piecePathOf(row.keys[0] ?? '');
    if (!ref) continue;
    const cur = map.get(ref.slug) ?? { clicks: 0, impressions: 0, posWeight: 0, pages: [] };
    cur.clicks += row.clicks;
    cur.impressions += row.impressions;
    cur.posWeight += row.position * row.impressions;
    cur.pages.push(row.keys[0]);
    map.set(ref.slug, cur);
  }
  return [...map.entries()]
    .map(([slug, v]) => ({
      slug,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
      position: v.impressions > 0 ? v.posWeight / v.impressions : 0,
      pages: v.pages,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

/** Top searches per piece, from rows with dimensions [page, query]. */
export function queriesByPiece(rows: GscRow[], limit = 5): Map<string, GscRow[]> {
  const bySlug = new Map<string, Map<string, GscRow>>();
  for (const row of rows) {
    const ref = piecePathOf(row.keys[0] ?? '');
    const query = row.keys[1];
    if (!ref || !query) continue;
    const queries = bySlug.get(ref.slug) ?? new Map<string, GscRow>();
    const cur = queries.get(query);
    if (cur) {
      const impressions = cur.impressions + row.impressions;
      cur.position = impressions > 0 ? (cur.position * cur.impressions + row.position * row.impressions) / impressions : 0;
      cur.clicks += row.clicks;
      cur.impressions = impressions;
      cur.ctr = impressions > 0 ? cur.clicks / impressions : 0;
    } else {
      queries.set(query, { ...row, keys: [query] });
    }
    bySlug.set(ref.slug, queries);
  }
  const out = new Map<string, GscRow[]>();
  for (const [slug, queries] of bySlug) {
    out.set(
      slug,
      [...queries.values()].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, limit),
    );
  }
  return out;
}
