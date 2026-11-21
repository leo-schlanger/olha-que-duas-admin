// Google Search Console (Search Analytics) for the admin. Admin session required.
// Self-contained (no local imports) so the edge bundle and `node --test` load it the same way.

export const config = { runtime: 'edge' };

type Env = Record<string, string | undefined>;

// ---------- Google service-account OAuth (JWT bearer grant), Web Crypto only ----------

export interface ServiceAccount {
  clientEmail: string;
  privateKey: string;
}

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Reads the account from GSC_SERVICE_ACCOUNT_JSON or GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY. */
export function readServiceAccount(env: Env): ServiceAccount | null {
  const raw = env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return { clientEmail: parsed.client_email, privateKey: fixNewlines(parsed.private_key) };
      }
    } catch {
      return null;
    }
  }
  const clientEmail = env.GSC_CLIENT_EMAIL?.trim();
  const privateKey = env.GSC_PRIVATE_KEY?.trim();
  if (clientEmail && privateKey) return { clientEmail, privateKey: fixNewlines(privateKey) };
  return null;
}

// Keys pasted into env panels often arrive with literal "\n" and surrounding quotes.
function fixNewlines(key: string): string {
  return key.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
}

function base64url(bytes: Uint8Array | string): string {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  let bin = '';
  for (const b of data) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [A-Z ]+-----/, '')
    .replace(/-----END [A-Z ]+-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** Signed RS256 assertion for the token endpoint. */
export async function signAssertion(account: ServiceAccount, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: account.clientEmail,
    scope: GSC_SCOPE,
    aud: TOKEN_URL,
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(account.privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64url(new Uint8Array(signature))}`;
}

let cached: { token: string; expiresAt: number; email: string } | null = null;

export async function getAccessToken(account: ServiceAccount): Promise<string> {
  if (cached && cached.email === account.clientEmail && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }
  const assertion = await signAssertion(account);
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google recusou a chave (${payload.error_description || payload.error || response.status})`);
  }
  cached = {
    token: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    email: account.clientEmail,
  };
  return payload.access_token;
}

// ---------- Endpoint ----------

const env: Env = typeof process !== 'undefined' ? process.env : {};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });
}

/** Same rule as supabase/functions/_shared/auth.ts: valid session AND is_admin(). Fails closed. */
export async function requireAdmin(req: Request, e: Env = env, f: typeof fetch = fetch): Promise<Response | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Sessão em falta' }, 401);

  const url = e.SUPABASE_URL || e.VITE_SUPABASE_URL;
  const anon = e.SUPABASE_ANON_KEY || e.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return json({ error: 'Servidor sem configuração do Supabase' }, 500);

  const headers = { apikey: anon, Authorization: `Bearer ${token}` };
  const user = await f(`${url}/auth/v1/user`, { headers });
  if (!user.ok) return json({ error: 'Sessão inválida ou expirada' }, 401);

  const admin = await f(`${url}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const isAdmin = admin.ok ? await admin.json().catch(() => false) : false;
  if (isAdmin !== true) return json({ error: 'Sem permissão' }, 403);
  return null;
}

function isoDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

const DAY = 24 * 60 * 60 * 1000;
// Search Console data lags ~2–3 days; stop before the incomplete days.
const LAG_DAYS = 3;

export function periodDates(days: number, now = Date.now()) {
  const end = now - LAG_DAYS * DAY;
  const start = end - (days - 1) * DAY;
  const prevEnd = start - DAY;
  const prevStart = prevEnd - (days - 1) * DAY;
  return {
    startDate: isoDay(start),
    endDate: isoDay(end),
    prevStartDate: isoDay(prevStart),
    prevEndDate: isoDay(prevEnd),
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const denied = await requireAdmin(req);
  if (denied) return denied;

  const account = readServiceAccount(env);
  const siteUrl = env.GSC_SITE_URL?.trim();
  if (!account || !siteUrl) {
    return json({
      configured: false,
      missing: [!account && 'GSC_SERVICE_ACCOUNT_JSON', !siteUrl && 'GSC_SITE_URL'].filter(Boolean),
    });
  }

  const daysParam = Number(new URL(req.url).searchParams.get('days'));
  const days = [7, 28, 90].includes(daysParam) ? daysParam : 28;
  const dates = periodDates(days);

  try {
    const token = await getAccessToken(account);
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const query = async (body: Record<string, unknown>) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { rows?: unknown[]; error?: { message?: string } };
      if (!response.ok) {
        const status = response.status;
        const reason = status === 403
          ? 'A conta de serviço ainda não foi adicionada à propriedade no Search Console'
          : payload.error?.message || `Erro ${status}`;
        throw Object.assign(new Error(reason), { status });
      }
      return payload.rows ?? [];
    };
    const cur = { startDate: dates.startDate, endDate: dates.endDate };
    const prev = { startDate: dates.prevStartDate, endDate: dates.prevEndDate };

    const [totals, prevTotals, queries, pages, pageQueries] = await Promise.all([
      query({ ...cur }),
      query({ ...prev }),
      query({ ...cur, dimensions: ['query'], rowLimit: 25 }),
      query({ ...cur, dimensions: ['page'], rowLimit: 500 }),
      query({ ...cur, dimensions: ['page', 'query'], rowLimit: 2000 }),
    ]);

    return json({
      configured: true,
      siteUrl,
      days,
      ...dates,
      totals: totals[0] ?? null,
      prevTotals: prevTotals[0] ?? null,
      queries,
      pages,
      pageQueries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao ler o Search Console';
    return json({ configured: true, error: message }, 502);
  }
}
