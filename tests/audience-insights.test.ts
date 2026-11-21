// node --test tests/  (Node >= 22.18 strips the TS types)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareText,
  hoursText,
  lisbonMoment,
  retentionReading,
  roundedShares,
  strongestSlots,
  summarySentences,
  topProgram,
  peopleAvg,
  type InsightsExtra,
  type InsightsOverview,
} from '../src/components/audience/insights.ts';

const BAD = /undefined|NaN|null|\[object|Infinity/;

// Real values from production, 7 days to 21/11/2026 (after removing the bot).
const ov7: InsightsOverview = {
  listeners: 12,
  listening_hours: 19.41,
  median_session_minutes: 24.4,
  peak_concurrent: 2,
  peak_at: '2026-11-20T18:40:04.77817+00:00',
  avg_concurrent: 0.12,
  prev_listeners: 14,
  prev_listening_hours: 16.55,
};
const ins7: InsightsExtra = {
  sessions_under_5: 6,
  sessions_5_15: 1,
  sessions_15_60: 5,
  sessions_over_60: 7,
  returning_listeners: 2,
  multi_day_listeners: 2,
  peak_snapshots: 2,
  history_start: '2026-06-15T04:22:10+00:00',
  prev_complete: true,
};

test('real 7-day summary reads correctly', () => {
  const s = summarySentences(7, ov7, ins7, [{ day_of_week: 1, hour_of_day: 19, avg_listeners: 1.08 }], []);
  assert.equal(s[0], 'Nos últimos 7 dias, a rádio teve 12 ouvintes, menos 2 do que nos 7 dias anteriores (14; −14%).');
  assert.equal(s[1], 'Ao todo, ouviram 19 h 25 min, mais 2 h 52 min do que nos 7 dias anteriores (16 h 33 min; +17%).');
  assert.equal(
    s[2],
    'O momento com mais gente a ouvir ao mesmo tempo foi sexta-feira, 20/11, às 18:40, com 2 pessoas (chegou a esse número em 2 momentos diferentes; este é o mais recente).',
  );
  assert.equal(s[3], 'A hora com mais gente costuma ser à segunda-feira, das 19:00 às 20:00, e o dia da semana mais forte é a segunda-feira.');
});

test('Lisbon time follows summer time', () => {
  assert.match(lisbonMoment('2026-07-10T17:45:00Z'), /às 18:45$/); // WEST, UTC+1
  assert.match(lisbonMoment('2026-11-10T17:45:00Z'), /às 17:45$/); // WET, UTC+0
  assert.match(lisbonMoment('2026-03-29T00:30:00Z'), /às 00:30$/); // before the switch
  assert.match(lisbonMoment('2026-03-29T01:30:00Z'), /às 02:30$/); // after the switch
  assert.match(lisbonMoment('2026-11-15T00:10:00Z'), /^domingo, 15\/11, às 00:10$/);
});

test('hoursText', () => {
  assert.equal(hoursText(0), '0 min');
  assert.equal(hoursText(0.5), '30 min');
  assert.equal(hoursText(1), '1 h');
  assert.equal(hoursText(19.41), '19 h 25 min');
  assert.equal(hoursText(1234.5), '1234 h 30 min'.replace('1234', (1234).toLocaleString('pt-PT')));
});

test('compareText: every combination of current/previous/period is clean', () => {
  for (const days of [1, 7, 30, 90]) {
    for (const cur of [0, 1, 2, 14]) {
      for (const prev of [0, 1, 2, 14]) {
        const t = compareText(cur, prev, days, true)!;
        assert.ok(t && !BAD.test(t), `${days}/${cur}/${prev}: ${t}`);
        if (cur === prev) assert.match(t, /^igual/);
        else if (prev === 0) assert.match(t, /^contra 0 /);
        else assert.match(t, cur > prev ? /^mais \d+ .*\+\d+%\)$/ : /^menos \d+ .*−\d+%\)$/);
        assert.match(t, days === 1 ? /ontem à mesma hora/ : new RegExp(`${days} dias anteriores`));
      }
    }
    assert.equal(compareText(5, 3, days, false), null);
  }
});

test('summary family: no broken text, singular/plural right, comparison hidden when history is incomplete', () => {
  const peaks: Array<[number | null, string | null]> = [[null, null], [0, null], [1, '2026-08-01T20:00:00Z'], [3, '2026-11-20T18:40:00Z']];
  for (const days of [1, 7, 30, 90]) {
    for (const listeners of [0, 1, 2, 12]) {
      for (const prevComplete of [true, false]) {
        for (const [peak, peakAt] of peaks) {
          for (const ties of [1, 3]) {
            const o = { ...ov7, listeners, peak_concurrent: peak, peak_at: peakAt };
            const x = { ...ins7, prev_complete: prevComplete, peak_snapshots: ties };
            const s = summarySentences(days, o, x, [], []);
            const all = s.join(' ');
            assert.ok(!BAD.test(all), all);
            assert.ok(s.length >= 1);
            if (listeners === 0) {
              assert.equal(s.length, 1);
              assert.match(s[0], /ninguém ouviu/);
              continue;
            }
            assert.match(s[0], listeners === 1 ? / 1 ouvinte[,.]/ : new RegExp(` ${listeners} ouvintes[,.]`));
            assert.equal(/anteriores|ontem/.test(s[0]), prevComplete);
            assert.equal(/histórico de ligações só começa a 15\/06\/2026/.test(all), !prevComplete);
            assert.equal(/momento com mais gente/.test(all), (peak ?? 0) > 0);
            if ((peak ?? 0) > 0) assert.equal(/em 3 momentos diferentes/.test(all), ties === 3);
            if (peak === 1) assert.match(all, /com 1 pessoa\b/);
          }
        }
      }
    }
  }
});

test('strongestSlots: empty, ties and weekday average', () => {
  assert.equal(strongestSlots([]), null);
  assert.equal(strongestSlots([{ day_of_week: 2, hour_of_day: 3, avg_listeners: 0 }]), null);
  // Tie on the hour: Monday wins over Sunday (week starts on Monday).
  const r = strongestSlots([
    { day_of_week: 0, hour_of_day: 20, avg_listeners: 1 },
    { day_of_week: 1, hour_of_day: 19, avg_listeners: 1 },
    { day_of_week: 5, hour_of_day: 10, avg_listeners: 0.5 },
    { day_of_week: 5, hour_of_day: 11, avg_listeners: 0.6 },
  ])!;
  assert.equal(r.hourDay, 1);
  assert.equal(r.hour, 19);
  assert.equal(r.day, 5); // 1.1 total beats 1.0
  // Weekend articles
  const s = summarySentences(7, ov7, ins7, [{ day_of_week: 6, hour_of_day: 23, avg_listeners: 2 }], []);
  assert.ok(s.some((t) => t.includes('ao sábado, das 23:00 às 00:00') && t.includes('é o sábado.')));
});

test('retentionReading sums and plurals', () => {
  const r = retentionReading(7, ov7, ins7);
  assert.equal(r.total, 19);
  assert.deepEqual(r.buckets.map((b) => b.count), [6, 1, 5, 7]);
  assert.equal(r.sentences[0], 'Metade das escutas de pelo menos 1 minuto dura mais de 24 min.');
  assert.equal(r.sentences[1], '7 escutas passaram de 1 hora e 6 duraram menos de 5 minutos (em 19 escutas).');
  assert.equal(r.sentences[2], '2 de 12 ouvintes ouviram em 2 ou mais dias diferentes.');
  assert.equal(r.sentences[3], '2 de 12 ouvintes já tinham ouvido nos 7 dias anteriores.');
  const one = retentionReading(1, { ...ov7, listeners: 1 }, { ...ins7, sessions_under_5: 0, sessions_5_15: 0, sessions_15_60: 0, sessions_over_60: 1, returning_listeners: 1 });
  assert.equal(one.sentences[1], '1 escuta passou de 1 hora (em 1 escuta).');
  assert.ok(!one.sentences.some((t) => t.includes('dias diferentes')));
  assert.equal(one.sentences[2], '1 de 1 ouvinte já tinha ouvido ontem à mesma hora.');
  assert.deepEqual(retentionReading(7, ov7, null).sentences, []);
  assert.ok(!retentionReading(90, ov7, { ...ins7, prev_complete: false }).sentences.some((t) => t.includes('já tinha')));
});

test('topProgram ignores programs without listeners', () => {
  const base = { kind: 'grelha', schedule_label: 'Todos os dias 10h-12h', occurrences: 7 };
  assert.equal(topProgram([]), null);
  assert.equal(topProgram([{ ...base, program: 'A', avg_listeners: 0.02, listeners: 0 }]), null);
  assert.equal(
    topProgram([
      { ...base, program: 'A', avg_listeners: 0.2, listeners: 3 },
      { ...base, program: 'B', avg_listeners: 0.9, listeners: 2 },
      { ...base, program: 'C', avg_listeners: null, listeners: 0 },
    ])!.program,
    'B',
  );
});

test('roundedShares always adds up to 100', () => {
  assert.deepEqual(roundedShares([0, 0, 0]), [0, 0, 0]);
  assert.deepEqual(roundedShares([6, 1, 5, 7]), [32, 5, 26, 37]);
  // every split of up to 12 sessions over 4 buckets
  for (let a = 0; a <= 12; a++) for (let b = 0; a + b <= 12; b++) for (let c = 0; a + b + c <= 12; c++) {
    const d = 12 - a - b - c;
    const r = roundedShares([a, b, c, d]);
    assert.equal(r.reduce((s, v) => s + v, 0), 100, `${a},${b},${c},${d}`);
    [a, b, c, d].forEach((n, i) => assert.ok(Math.abs(r[i] - (n / 12) * 100) < 1, `${a},${b},${c},${d}`));
  }
});

test('program sentence: average leader and widest reach', () => {
  assert.equal(peopleAvg(1.01), '1 pessoa');
  assert.equal(peopleAvg(0.94), '0,9 pessoas');
  assert.equal(peopleAvg(0.02), 'menos de 0,1 pessoas');
  assert.equal(peopleAvg(2), '2 pessoas');
  const progs = [
    { program: 'Top 10', kind: 'evento', schedule_label: 'Sex 20:00-20:30', occurrences: 1, avg_listeners: 1.01, listeners: 1 },
    { program: 'Cantinho', kind: 'evento', schedule_label: 'Seg, Ter 18:30-19:30', occurrences: 5, avg_listeners: 0.94, listeners: 5 },
  ];
  const s = summarySentences(7, ov7, ins7, [], progs).find((t) => t.startsWith('O programa'))!;
  assert.equal(
    s,
    'O programa com mais gente a ouvir, em média, foi «Top 10» (Sex 20:00-20:30): 1 pessoa durante a emissão; o que chegou a mais pessoas diferentes foi «Cantinho» (5 ouvintes).',
  );
  const only = summarySentences(7, ov7, ins7, [], [progs[1]]).find((t) => t.startsWith('O programa'))!;
  assert.ok(!only.includes('diferentes'));
});

test('without the extras (RPC failed) there is no comparison and no history note', () => {
  for (const days of [1, 7, 30, 90]) {
    const s = summarySentences(days, ov7, null, [], []);
    const all = s.join(' ');
    assert.ok(!/anteriores|ontem|histórico/.test(all), all);
    assert.ok(!BAD.test(all), all);
    assert.match(s[0], /12 ouvintes\.$/);
  }
});

test('retention family: every split of sessions and returning listeners reads cleanly', () => {
  for (const days of [1, 7, 30, 90]) {
    for (const listeners of [1, 2, 12]) {
      for (const under5 of [0, 1, 6]) {
        for (const over60 of [0, 1, 7]) {
          for (const mid of [0, 1]) {
            for (const returning of [0, 1, 2]) {
              if (returning > listeners) continue;
              const x = { ...ins7, sessions_under_5: under5, sessions_over_60: over60, sessions_5_15: mid, sessions_15_60: 0, returning_listeners: returning };
              const r = retentionReading(days, { ...ov7, listeners }, x);
              const all = r.sentences.join(' ');
              assert.ok(!BAD.test(all), all);
              assert.ok(!/\b0 (escuta|de|duraram)/.test(all), all);
              assert.equal(r.total, under5 + over60 + mid);
              if (r.total > 0) {
                assert.equal(/de 1 hora/.test(all), over60 > 0);
                assert.equal(/menos de 5 minutos/.test(all), under5 > 0);
              }
              if (returning === 0) assert.match(all, listeners === 1 ? /Este ouvinte não tinha/ : /Nenhum destes ouvintes tinha/);
            }
          }
        }
      }
    }
  }
});

// --- qa 21/11 (round 2) ---
import { pctChange, kpiRows, widestPrograms } from '../src/components/audience/insights.ts';

test('one % for sentence and cards, on unrounded values, every period', () => {
  // qa case: "Hoje" hours 0.38 vs 0.52 → sentence said −26 % (minutes), card −27 %
  const pairs: Array<[number, number]> = [[0.38, 0.52], [19.41, 16.55], [80.07, 114.8], [12, 14], [0.01, 0.02], [3.333, 1.111]];
  for (const days of [1, 7, 30, 90]) {
    for (const [cur, prev] of pairs) {
      const o = { ...ov7, listeners: 5, prev_listeners: 5, listening_hours: cur, prev_listening_hours: prev };
      const s = summarySentences(days, o, ins7, [], []).find((t) => t.startsWith('Ao todo'))!;
      const p = pctChange(cur, prev)!;
      const m = s.match(/([+−])(\d+)%\)/);
      if (Math.round(cur * 60) === Math.round(prev * 60)) continue;
      assert.ok(m, s);
      assert.equal(Number(m![2]), Math.abs(p), s);
      assert.equal(m![1] === '+', p > 0, s);
    }
  }
  assert.equal(pctChange(0.38, 0.52), -27);
  assert.equal(pctChange(5, 0), null);
  assert.equal(pctChange(0, 0), null);
});

test('kpiRows: no previous-period values when the history is incomplete', () => {
  const o = { ...ov7, sessions: 19, prev_sessions: 17, prev_avg_concurrent: 0.11, pct_time_with_listeners: 0.12, avg_session_minutes: 60.9 };
  const full = kpiRows(o, true);
  assert.ok(full.some((r) => r.previous != null));
  const none = kpiRows(o, false);
  assert.ok(none.length === full.length);
  assert.ok(none.every((r) => r.previous == null), JSON.stringify(none));
});

test('widestPrograms names every tie, once per name', () => {
  const b = { kind: 'evento', schedule_label: 'x', occurrences: 1, avg_listeners: 0.1 };
  const w = widestPrograms([
    { ...b, program: 'A', listeners: 5 },
    { ...b, program: 'B', listeners: 5 },
    { ...b, program: 'B', listeners: 5 },
    { ...b, program: 'C', listeners: 2 },
  ]);
  assert.deepEqual(w.names, ['A', 'B']);
  assert.equal(w.listeners, 5);
  const top = { ...b, program: 'T', avg_listeners: 1, listeners: 1 };
  const s = summarySentences(7, ov7, ins7, [], [top, { ...b, program: 'A', listeners: 5 }, { ...b, program: 'B', listeners: 5 }])
    .find((t) => t.startsWith('O programa'))!;
  assert.match(s, /os que chegaram a mais pessoas diferentes foram «A» e «B» \(5 ouvintes cada\)\.$/);
  const many = summarySentences(7, ov7, ins7, [], [top, ...['A', 'B', 'C', 'D', 'E'].map((p) => ({ ...b, program: p, listeners: 5 }))])
    .find((t) => t.startsWith('O programa'))!;
  assert.match(many, /«A», «B», «C» e mais 2 programas \(5 ouvintes cada\)/);
});
