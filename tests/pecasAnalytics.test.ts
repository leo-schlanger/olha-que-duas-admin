import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LEGACY_NEWS_SLUGS,
  groupByProgram,
  groupSources,
  mergeGscPages,
  mergePieces,
  piecePathOf,
  queriesByPiece,
  rollingWeeks,
  sourceGroup,
  toPathRows,
  WEEK_MS,
  type PostRef,
  type ProgramRef,
} from '../src/lib/pecasAnalytics.ts';

const fixture = toPathRows(JSON.parse(readFileSync(new URL('./fixtures/umami-paths-30d.json', import.meta.url), 'utf8')));

const programs: ProgramRef[] = [
  { id: 'p-news', slug: 'noticias-olha-que-duas', title: 'Notícias Olha que Duas' },
  { id: 'p-bio', slug: 'curtas-biografias', title: 'Curtas Biografias' },
];
const posts: PostRef[] = [
  { slug: 'pedro-mourinho-fora-do-now', title: 'Pedro Mourinho fora do NOW', program_id: 'p-news' },
  { slug: 'kina-a-mulher-que-se-fez-sozinha', title: 'Kina', program_id: 'p-bio' },
];

test('every address form of a piece maps to the same slug', () => {
  const slug = 'pedro-mourinho-fora-do-now';
  const forms = [
    `/exclusivo/noticias-olha-que-duas/${slug}`,
    `/programas/noticias-olha-que-duas/${slug}`,
    `/exclusivo/olha-que-duas-e-eu/${slug}`,
    `/programas/olha-que-duas-e-eu/${slug}`,
    `/exclusivo/${slug}`,
  ];
  // Family: each form × case × trailing slash × full URL × query/hash.
  for (const form of forms) {
    for (const variant of [form, form.toUpperCase(), `${form}/`, `${form}//`]) {
      for (const wrap of [
        (p: string) => p,
        (p: string) => `https://www.olhaqueduas.com${p}`,
        (p: string) => `https://olhaqueduas.com${p}?utm_source=ig`,
        (p: string) => `${p}#topo`,
      ]) {
        const ref = piecePathOf(wrap(variant));
        assert.ok(ref, wrap(variant));
        assert.equal(ref.slug, slug, wrap(variant));
        assert.equal(ref.programSlug, 'noticias-olha-que-duas', wrap(variant));
      }
    }
  }
});

test('every legacy single-segment slug maps to Notícias; other single segments are not pieces', () => {
  for (const slug of LEGACY_NEWS_SLUGS) {
    assert.deepEqual(piecePathOf(`/exclusivo/${slug}`), { slug, programSlug: 'noticias-olha-que-duas' });
    assert.equal(piecePathOf(`/programas/${slug}`), null);
  }
  for (const p of ['/', '/#inicio', '/exclusivo', '/programas', '/exclusivo/mente-aberta', '/programas/mente-aberta',
    '/exclusivo/rss', '/noticias', '/galeria/x/y', '/exclusivo/abel-dias-betty-og.jpg', '/programas/a/b/c', '']) {
    assert.equal(piecePathOf(p), null, p);
  }
});

test('merged reads equal the sum of every piece address in the real 30-day sample', () => {
  const pieces = mergePieces(fixture, posts, programs);
  const rawPieceRows = fixture.filter((r) => piecePathOf(r.name));
  const rawSum = rawPieceRows.reduce((s, r) => s + r.pageviews, 0);
  assert.equal(pieces.reduce((s, p) => s + p.pageviews, 0), rawSum);
  assert.equal(new Set(pieces.map((p) => p.slug)).size, pieces.length);

  // Mourinho lives at 3 addresses in the sample (old, new and the old program slug).
  const mourinho = pieces.find((p) => p.slug === 'pedro-mourinho-fora-do-now')!;
  const expected = fixture
    .filter((r) => r.name.toLowerCase().endsWith('/pedro-mourinho-fora-do-now'))
    .reduce((s, r) => s + r.pageviews, 0);
  assert.equal(mourinho.pageviews, expected);
  assert.ok(mourinho.paths.length >= 2);
  assert.equal(mourinho.title, 'Pedro Mourinho fora do NOW');
  assert.equal(mourinho.programTitle, 'Notícias Olha que Duas');
  assert.equal(pieces[0].slug, mourinho.slug);

  // Each piece address in the sample lands in exactly one piece.
  for (const row of rawPieceRows) {
    assert.equal(pieces.filter((p) => p.paths.includes(row.name)).length, 1, row.name);
  }

  const byProgram = groupByProgram(pieces);
  assert.equal(byProgram.reduce((s, p) => s + p.pageviews, 0), rawSum);
});

test('program comes from the database row, not from the address', () => {
  const rows = [{ name: '/exclusivo/olha-que-duas-e-eu/kina-a-mulher-que-se-fez-sozinha', pageviews: 3, visitors: 2 }];
  const [piece] = mergePieces(rows, posts, programs);
  assert.equal(piece.programTitle, 'Curtas Biografias');
  assert.equal(piece.found, true);
  const [unknown] = mergePieces([{ name: '/programas/curtas-biografias/peca-apagada', pageviews: 1, visitors: 1 }], posts, programs);
  assert.equal(unknown.found, false);
  assert.equal(unknown.title, 'Peca apagada');
});

test('origins group in plain words and add up to the total', () => {
  const cases: Record<string, string> = {
    'google.com': 'Google',
    'google.pt': 'Google',
    'com.google.android.googlequicksearchbox': 'Google',
    'l.instagram.com': 'Instagram',
    'instagram.com': 'Instagram',
    'facebook.com': 'Facebook',
    'lm.facebook.com': 'Facebook',
    'm.facebook.com': 'Facebook',
    'l.facebook.com': 'Facebook',
    'wa.me': 'WhatsApp',
    'web.whatsapp.com': 'WhatsApp',
    'bing.com': 'Outros',
    'notgoogle.com': 'Outros',
    '': 'Direto',
  };
  for (const [host, group] of Object.entries(cases)) assert.equal(sourceGroup(host), group, host);

  const referrers = Object.keys(cases).filter(Boolean).map((name, i) => ({ name, visits: i + 1 }));
  const channels = [{ name: 'direct', visits: 50 }, { name: 'organicSearch', visits: 999 }];
  const groups = groupSources(referrers, channels);
  const total = referrers.reduce((s, r) => s + r.visits, 0) + 50;
  assert.equal(groups.reduce((s, g) => s + g.visits, 0), total);
  assert.equal(Math.round(groups.reduce((s, g) => s + g.share, 0)), 100);
  assert.equal(groups.find((g) => g.group === 'Direto')?.visits, 50);
});

test('rolling weeks are contiguous, equal and end now', () => {
  const now = Date.UTC(2026, 10, 21, 15);
  const weeks = rollingWeeks(now, 8);
  assert.equal(weeks.length, 8);
  assert.equal(weeks[7].endAt, now);
  for (let i = 0; i < weeks.length; i += 1) {
    assert.equal(weeks[i].endAt - weeks[i].startAt, WEEK_MS);
    if (i > 0) assert.equal(weeks[i].startAt, weeks[i - 1].endAt);
  }
});

test('Search Console rows of the same piece merge with recomputed CTR and weighted position', () => {
  const rows = [
    { keys: ['https://www.olhaqueduas.com/exclusivo/noticias-olha-que-duas/pedro-mourinho-fora-do-now'], clicks: 10, impressions: 100, ctr: 0.1, position: 4 },
    { keys: ['https://www.olhaqueduas.com/programas/noticias-olha-que-duas/pedro-mourinho-fora-do-now'], clicks: 2, impressions: 300, ctr: 0.0067, position: 8 },
    { keys: ['https://www.olhaqueduas.com/'], clicks: 50, impressions: 500, ctr: 0.1, position: 2 },
  ];
  const [piece, ...rest] = mergeGscPages(rows);
  assert.equal(rest.length, 0);
  assert.equal(piece.clicks, 12);
  assert.equal(piece.impressions, 400);
  assert.equal(piece.ctr, 12 / 400);
  assert.equal(piece.position, (4 * 100 + 8 * 300) / 400);

  const q = queriesByPiece([
    { keys: [rows[0].keys[0], 'mourinho now'], clicks: 5, impressions: 50, ctr: 0.1, position: 3 },
    { keys: [rows[1].keys[0], 'mourinho now'], clicks: 1, impressions: 150, ctr: 0.0067, position: 7 },
    { keys: [rows[1].keys[0], 'pedro mourinho'], clicks: 0, impressions: 20, ctr: 0, position: 9 },
  ]).get('pedro-mourinho-fora-do-now')!;
  assert.equal(q[0].keys[0], 'mourinho now');
  assert.equal(q[0].clicks, 6);
  assert.equal(q[0].impressions, 200);
  assert.equal(q[0].ctr, 6 / 200);
  assert.equal(q[0].position, (3 * 50 + 7 * 150) / 200);
});

// ---------- qa 21/11 (r1): família de correções ----------
import {
  countLabel,
  createRequestGate,
  roundShares,
  summaryLines,
} from '../src/lib/pecasAnalytics.ts';

// Real 90-day rows (prod, 21/11/2026) with a ",www.olhaqueduas.com" tail and truncated slugs.
const junk = [
  [60, 51, '/exclusivo/olha-que-duas-e-eu/passado-secreto-luis-maia-50-anos'],
  [49, 42, '/exclusivo/olha-que-duas-e-eu/fernanda-serrano-desmente-novo-amor'],
  [23, 18, '/exclusivo/olha-que-duas-e-eu/filha-de-sandra-felgueiras-orgulho-na-mae'],
  [5, 5, '/exclusivo/olha-que-duas-e-eu/fernanda-serrano-desmente-novo-a'],
  [5, 5, '/exclusivo/olha-que-duas-e-eu/filha-d'],
  [4, 4, '/exclusivo/noticias-olha-que-duas/filha-de-sandra-felgueiras-orgulho-na-mae'],
  [3, 3, '/EXCLUSIVO/OLHA-QUE-DUAS-E-EU/PASSADO-SECRETO-LUIS-MAIA-50-ANOS,WWW.OLHAQUEDUAS.COM'],
  [3, 3, '/exclusivo/olha-que-duas-e-eu/filha-de-sandra-felgueiras-orgulho-na-mae,www.olhaqueduas.com'],
  [2, 2, '/exclusivo/noticias-olha-que-duas/fernanda-serrano-desmente-novo-amor'],
  [2, 2, '/exclusivo/noticias-olha-que-duas/fernanda-serrano-desmente-novo-a'],
  [2, 2, '/exclusivo/noticias-olha-que-duas/passado-secreto-luis-maia-50-anos'],
  [1, 1, '/programas/noticias-olha-que-duas/passado-secreto-luis-maia-50-anos'],
].map(([pageviews, visitors, name]) => ({ name: name as string, pageviews: pageviews as number, visitors: visitors as number }));
const junkPosts: PostRef[] = [
  { slug: 'passado-secreto-luis-maia-50-anos', title: 'Luís Maia', program_id: 'p-news' },
  { slug: 'fernanda-serrano-desmente-novo-amor', title: 'Fernanda Serrano', program_id: 'p-news' },
  { slug: 'filha-de-sandra-felgueiras-orgulho-na-mae', title: 'Sandra Felgueiras', program_id: 'p-news' },
  { slug: 'filme-do-ano', title: 'Filme', program_id: 'p-news' },
];

test('addresses with a ",host" tail still count for the piece', () => {
  for (const tail of [',www.olhaqueduas.com', ',WWW.OLHAQUEDUAS.COM', ',olhaqueduas.com', ',x']) {
    assert.equal(piecePathOf(`/exclusivo/olha-que-duas-e-eu/passado-secreto-luis-maia-50-anos${tail}`)?.slug, 'passado-secreto-luis-maia-50-anos', tail);
    assert.equal(piecePathOf(`/programas/noticias-olha-que-duas/passado-secreto-luis-maia-50-anos/${tail}`)?.slug, 'passado-secreto-luis-maia-50-anos', tail);
  }
});

test('every real junk row lands in one known piece and no reads are lost', () => {
  const pieces = mergePieces(junk, junkPosts, programs);
  assert.deepEqual(pieces.map((p) => [p.slug, p.pageviews]), [
    ['passado-secreto-luis-maia-50-anos', 66],
    ['fernanda-serrano-desmente-novo-amor', 58],
    ['filha-de-sandra-felgueiras-orgulho-na-mae', 35],
  ]);
  assert.ok(pieces.every((p) => p.found));
  assert.equal(pieces.reduce((s, p) => s + p.pageviews, 0), junk.reduce((s, r) => s + r.pageviews, 0));
});

test('a truncated slug only joins when exactly one piece starts with it', () => {
  // "fil" matches two posts (filha-…, filme-…): stays apart, never guessed.
  const [amb] = mergePieces([{ name: '/programas/x/fil', pageviews: 1, visitors: 1 }], junkPosts, programs);
  assert.equal(amb.found, false);
  assert.equal(amb.slug, 'fil');
  // Every prefix of every post slug: joins iff the prefix is unique among posts.
  for (const post of junkPosts) {
    for (let k = 1; k <= post.slug.length; k += 1) {
      const prefix = post.slug.slice(0, k);
      const owners = junkPosts.filter((p) => p.slug.startsWith(prefix));
      const [piece] = mergePieces([{ name: `/exclusivo/olha-que-duas-e-eu/${prefix}`, pageviews: 1, visitors: 1 }], junkPosts, programs);
      const expected = owners.length === 1 ? owners[0].slug : prefix;
      assert.equal(piece.slug, expected, prefix);
    }
  }
  // Search Console uses the same rule.
  const gsc = mergeGscPages([
    { keys: ['https://www.olhaqueduas.com/exclusivo/olha-que-duas-e-eu/filha-d'], clicks: 1, impressions: 10, ctr: 0.1, position: 5 },
    { keys: ['https://www.olhaqueduas.com/programas/noticias-olha-que-duas/filha-de-sandra-felgueiras-orgulho-na-mae'], clicks: 2, impressions: 10, ctr: 0.2, position: 3 },
  ], junkPosts.map((p) => p.slug));
  assert.equal(gsc.length, 1);
  assert.equal(gsc[0].clicks, 3);
});

function lcg(seed: number) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

test('shares always add up to exactly 100 (largest remainder), each within 1 of the exact value', () => {
  const rnd = lcg(7);
  for (let i = 0; i < 2000; i += 1) {
    const n = 1 + Math.floor(rnd() * 6);
    const values = Array.from({ length: n }, () => Math.floor(rnd() * (rnd() < 0.3 ? 5 : 500)));
    const total = values.reduce((a, b) => a + b, 0);
    const shares = roundShares(values);
    if (total === 0) {
      assert.ok(shares.every((s) => s === 0));
      continue;
    }
    assert.equal(shares.reduce((a, b) => a + b, 0), 100, JSON.stringify(values));
    values.forEach((v, j) => assert.ok(Math.abs(shares[j] - (v / total) * 100) < 1, JSON.stringify(values)));
  }
  // The qa case: 143/2/21/131 (sum 297) used to print 48+1+7+44 = 100? and 99/101 elsewhere.
  const rnd2 = lcg(11);
  for (let i = 0; i < 500; i += 1) {
    const refs = ['google.com', 'l.instagram.com', 'facebook.com', 'wa.me', 'bing.com'].map((name) => ({ name, visits: Math.floor(rnd2() * 300) }));
    const groups = groupSources(refs, [{ name: 'direct', visits: Math.floor(rnd2() * 300) }]);
    if (groups.length) assert.equal(groups.reduce((s, g) => s + g.share, 0), 100);
  }
});

test('Google means search: Gmail and other Google apps go to Outros', () => {
  for (const host of ['com.google.android.gm', 'mail.google.com', 'docs.google.com', 'news.google.com', 'translate.google.com', 'com.google.android.apps.magazines', 'googleads.g.doubleclick.net']) {
    assert.equal(sourceGroup(host), 'Outros', host);
  }
  for (const host of ['google.com', 'www.google.pt', 'google.com.br', 'com.google.android.googlequicksearchbox']) {
    assert.equal(sourceGroup(host), 'Google', host);
  }
});

test('counts agree in number', () => {
  const words: Array<[string, string]> = [['leitura', 'leituras'], ['pessoa', 'pessoas'], ['clique', 'cliques'], ['vez', 'vezes'], ['visita', 'visitas'], ['peça', 'peças']];
  for (const [one, many] of words) {
    assert.equal(countLabel(1, one, many), `1 ${one}`);
    for (const v of [0, 2, 5, 1000, 2.4]) assert.equal(countLabel(v, one, many), `${Math.round(v).toLocaleString('pt-PT')} ${many}`);
  }
  assert.equal(countLabel(0.6, 'leitura', 'leituras'), '1 leitura');
});

test('summary speaks only of the chosen period', () => {
  const top = { slug: 's', title: 'Peça das 24 h', found: true, programSlug: 'p', programTitle: 'Notícias', pageviews: 1, visitors: 1, paths: [] };
  const lines = summaryLines({
    timeRange: '24h',
    totalReads: 1,
    prevTotalReads: 4,
    top,
    topProgram: { programSlug: 'p', programTitle: 'Notícias', pageviews: 1, pieces: 1 },
    mainSource: { group: 'Google', visits: 1, share: 100, hosts: [] },
  });
  const text = lines.join(' ');
  assert.match(text, /últimas 24 horas/i);
  assert.match(text, /1 leitura de peças/);
  assert.match(text, /«Peça das 24 h» \(1 leitura\)/);
  assert.match(text, /-75%/);
  assert.doesNotMatch(text, /7 dias/);
  for (const range of ['24h', '7d', '30d', '90d'] as const) {
    const t = summaryLines({ timeRange: range, totalReads: 10, prevTotalReads: 0, top: null, topProgram: null, mainSource: null }).join(' ');
    assert.doesNotMatch(t, /leituras de peças, .*que nos/); // nothing to compare → plain words
    assert.match(t, /10 leituras/);
  }
});

test('request gate: only the newest request may write', () => {
  const gate = createRequestGate();
  const a = gate.next();
  const b = gate.next();
  assert.equal(gate.isCurrent(a), false);
  assert.equal(gate.isCurrent(b), true);
  gate.next();
  assert.equal(gate.isCurrent(b), false);
});
