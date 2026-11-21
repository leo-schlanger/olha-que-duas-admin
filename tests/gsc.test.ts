import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import handler, { GSC_SCOPE, TOKEN_URL, periodDates, readServiceAccount, requireAdmin, signAssertion } from '../api/gsc.ts';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

test('service account is read from the JSON or from the two variables, with escaped newlines', () => {
  const escaped = pem.replace(/\n/g, '\\n');
  const fromJson = readServiceAccount({ GSC_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'a@b.iam', private_key: escaped }) });
  assert.equal(fromJson?.privateKey, pem);
  const fromPair = readServiceAccount({ GSC_CLIENT_EMAIL: 'a@b.iam', GSC_PRIVATE_KEY: `"${escaped}"` });
  assert.equal(fromPair?.privateKey, pem);
  assert.equal(readServiceAccount({}), null);
  assert.equal(readServiceAccount({ GSC_SERVICE_ACCOUNT_JSON: '{not json' }), null);
});

test('the JWT assertion is RS256 and verifies with the public key', async () => {
  const jwt = await signAssertion({ clientEmail: 'svc@proj.iam.gserviceaccount.com', privateKey: pem }, 1_000_000);
  const [h, c, s] = jwt.split('.');
  const header = JSON.parse(Buffer.from(h, 'base64url').toString());
  const claims = JSON.parse(Buffer.from(c, 'base64url').toString());
  assert.deepEqual(header, { alg: 'RS256', typ: 'JWT' });
  assert.deepEqual(claims, { iss: 'svc@proj.iam.gserviceaccount.com', scope: GSC_SCOPE, aud: TOKEN_URL, iat: 1_000_000, exp: 1_003_600 });
  const ok = verify('RSA-SHA256', Buffer.from(`${h}.${c}`), createPublicKey(privateKey), Buffer.from(s, 'base64url'));
  assert.equal(ok, true);
});

function fakeFetch(userOk: boolean, isAdmin: unknown): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith('/auth/v1/user')) return new Response('{}', { status: userOk ? 200 : 401 });
    if (url.endsWith('/rest/v1/rpc/is_admin')) return new Response(JSON.stringify(isAdmin), { status: 200 });
    throw new Error(`unexpected ${url}`);
  }) as typeof fetch;
}

test('only an admin session passes; everything else fails closed', async () => {
  const env = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' };
  const req = (auth?: string) => new Request('https://admin/api/gsc', { headers: auth ? { Authorization: auth } : {} });
  assert.equal((await requireAdmin(req(), env, fakeFetch(true, true)))?.status, 401);
  assert.equal((await requireAdmin(req('Bearer t'), {}, fakeFetch(true, true)))?.status, 500);
  assert.equal((await requireAdmin(req('Bearer t'), env, fakeFetch(false, true)))?.status, 401);
  for (const notAdmin of [false, null, 'true', 1]) {
    assert.equal((await requireAdmin(req('Bearer t'), env, fakeFetch(true, notAdmin)))?.status, 403);
  }
  assert.equal(await requireAdmin(req('Bearer t'), env, fakeFetch(true, true)), null);
});

test('without credentials the endpoint answers "not connected" only after the admin check', async () => {
  const saved = { ...process.env };
  const realFetch = globalThis.fetch;
  try {
    process.env.VITE_SUPABASE_URL = 'https://x.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon';
    delete process.env.GSC_SERVICE_ACCOUNT_JSON;
    delete process.env.GSC_CLIENT_EMAIL;
    delete process.env.GSC_PRIVATE_KEY;
    delete process.env.GSC_SITE_URL;
    globalThis.fetch = fakeFetch(true, true);
    const anon = await handler(new Request('https://admin/api/gsc'));
    assert.equal(anon.status, 401);
    const res = await handler(new Request('https://admin/api/gsc', { headers: { Authorization: 'Bearer t' } }));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'private, no-store');
    const body = await res.json();
    assert.equal(body.configured, false);
  } finally {
    globalThis.fetch = realFetch;
    process.env = saved;
  }
});

test('periods have the asked length, skip the last 3 days and do not overlap', () => {
  const now = Date.UTC(2026, 10, 21, 12);
  for (const days of [7, 28, 90]) {
    const d = periodDates(days, now);
    assert.equal(d.endDate, '2026-11-18');
    const len = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000 + 1;
    assert.equal(len(d.startDate, d.endDate), days);
    assert.equal(len(d.prevStartDate, d.prevEndDate), days);
    assert.equal(len(d.prevEndDate, d.startDate), 2); // consecutive days
  }
});
