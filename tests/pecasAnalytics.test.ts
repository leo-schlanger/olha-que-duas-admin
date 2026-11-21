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
