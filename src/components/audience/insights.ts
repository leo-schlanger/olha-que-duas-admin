// Plain-language readings of the radio audience (pure functions, tested in tests/).
// All times are shown in Lisbon time.

export interface InsightsOverview {
  listeners: number;
  listening_hours: number;
  median_session_minutes: number | null;
  peak_concurrent: number | null;
  peak_at: string | null;
  avg_concurrent: number | null;
  prev_listeners: number;
  prev_listening_hours: number;
}

export interface InsightsExtra {
  sessions_under_5: number;
  sessions_5_15: number;
  sessions_15_60: number;
  sessions_over_60: number;
  returning_listeners: number;
  multi_day_listeners: number;
  peak_snapshots: number;
  history_start: string | null;
  prev_complete: boolean;
}

export interface InsightsHeatCell {
  day_of_week: number;
  hour_of_day: number;
  avg_listeners: number;
}

export interface InsightsProgram {
  program: string;
  kind: string;
  schedule_label: string;
  occurrences: number;
  avg_listeners: number | null;
  listeners: number;
}

export const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** "o sábado" / "a sexta-feira". */
export const weekdayWithArticle = (dow: number) => `${dow === 0 || dow === 6 ? 'o' : 'a'} ${WEEKDAYS[dow]}`;

/** "ao sábado" / "à sexta-feira". */
export const onWeekday = (dow: number) => `${dow === 0 || dow === 6 ? 'ao' : 'à'} ${WEEKDAYS[dow]}`;

/** "15/06/2026" in Lisbon time. */
export const lisbonDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-PT', { timeZone: 'Europe/Lisbon', day: '2-digit', month: '2-digit', year: 'numeric' });

const nf = (value: number, digits = 0) =>
  value.toLocaleString('pt-PT', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const countWord = (n: number, singular: string, pluralForm: string) =>
  `${nf(n)} ${n === 1 ? singular : pluralForm}`;

/** "Nos últimos 7 dias" / "Hoje". */
export function periodPhrase(days: number): string {
  return days <= 1 ? 'Hoje' : `Nos últimos ${days} dias`;
}

/** What the previous period is called in a sentence. */
export function previousPhrase(days: number): string {
  return days <= 1 ? 'ontem à mesma hora' : `nos ${days} dias anteriores`;
}

/** Hours as "19 h 25 min" / "45 min". */
export function hoursText(hours: number): string {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${nf(h)} h` : `${nf(h)} h ${m} min`;
}

/** "sexta-feira, 20/11, às 18:40" in Lisbon time. */
export function lisbonMoment(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Europe/Lisbon',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('weekday')}, ${get('day')}/${get('month')}, às ${get('hour')}:${get('minute')}`;
}

/**
 * Comparison with the previous period, absolute first (bases are small).
 * Returns null when the previous period has no complete history.
 */
export function compareText(
  current: number,
  previous: number,
  days: number,
  prevComplete: boolean,
  format: (n: number) => string = (n) => nf(n),
): string | null {
  if (!prevComplete) return null;
  const prevLabel = previousPhrase(days);
  if (current === previous) return days <= 1 ? 'igual a ontem à mesma hora' : `igual aos ${days} dias anteriores`;
  if (previous === 0) return `contra ${format(0)} ${prevLabel}`;
  const diff = current - previous;
  const pct = Math.round((Math.abs(diff) / previous) * 100);
  const word = diff > 0 ? 'mais' : 'menos';
  return `${word} ${format(Math.abs(diff))} do que ${prevLabel} (${format(previous)}; ${diff > 0 ? '+' : '−'}${pct}%)`;
}

/** Strongest hour and weekday from the heatmap (average simultaneous listeners). */
export function strongestSlots(cells: InsightsHeatCell[]) {
  const withListeners = cells.filter((c) => c.avg_listeners > 0);
  if (withListeners.length === 0) return null;
  const best = withListeners.reduce((a, b) =>
    b.avg_listeners > a.avg_listeners ||
    (b.avg_listeners === a.avg_listeners && (b.day_of_week + 6) % 7 < (a.day_of_week + 6) % 7)
      ? b
      : a,
  );
  // Weekday average over the 24 hours (missing hours count as 0).
  const byDay = new Map<number, number>();
  for (const c of cells) byDay.set(c.day_of_week, (byDay.get(c.day_of_week) ?? 0) + c.avg_listeners);
  let bestDay = -1;
  let bestDayAvg = -1;
  for (const dow of [1, 2, 3, 4, 5, 6, 0]) {
    const avg = (byDay.get(dow) ?? 0) / 24;
    if (avg > bestDayAvg) {
      bestDay = dow;
      bestDayAvg = avg;
    }
  }
  return {
    hour: best.hour_of_day,
    hourDay: best.day_of_week,
    hourAvg: best.avg_listeners,
    day: bestDay,
    dayAvg: bestDayAvg,
  };
}

export interface RetentionReading {
  total: number;
  buckets: { label: string; count: number }[];
  sentences: string[];
}

export function retentionReading(days: number, o: InsightsOverview, x: InsightsExtra | null): RetentionReading {
  const buckets = x
    ? [
        { label: 'Menos de 5 min', count: x.sessions_under_5 },
        { label: '5 a 15 min', count: x.sessions_5_15 },
        { label: '15 min a 1 hora', count: x.sessions_15_60 },
        { label: 'Mais de 1 hora', count: x.sessions_over_60 },
      ]
    : [];
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const sentences: string[] = [];
  if (o.median_session_minutes != null && total > 0) {
    sentences.push(
      `Metade das escutas de pelo menos 1 minuto dura mais de ${hoursText(o.median_session_minutes / 60)}.`,
    );
  }
  if (x && total > 0) {
    const parts: string[] = [];
    if (x.sessions_over_60 > 0) parts.push(`${countWord(x.sessions_over_60, 'escuta passou', 'escutas passaram')} de 1 hora`);
    if (x.sessions_under_5 > 0) {
      parts.push(
        parts.length > 0
          ? `${nf(x.sessions_under_5)} ${x.sessions_under_5 === 1 ? 'durou' : 'duraram'} menos de 5 minutos`
          : `${countWord(x.sessions_under_5, 'escuta durou', 'escutas duraram')} menos de 5 minutos`,
      );
    }
    if (parts.length > 0) sentences.push(`${parts.join(' e ')} (em ${countWord(total, 'escuta', 'escutas')}).`);
  }
  if (x && o.listeners > 0) {
    if (days > 1) {
      sentences.push(
        `${nf(x.multi_day_listeners)} de ${countWord(o.listeners, 'ouvinte', 'ouvintes')} ${x.multi_day_listeners === 1 ? 'ouviu' : 'ouviram'} em 2 ou mais dias diferentes.`,
      );
    }
    if (x.prev_complete) {
      sentences.push(
        x.returning_listeners === 0
          ? `${o.listeners === 1 ? 'Este ouvinte não tinha' : 'Nenhum destes ouvintes tinha'} ouvido ${previousPhrase(days)}.`
          : `${nf(x.returning_listeners)} de ${countWord(o.listeners, 'ouvinte', 'ouvintes')} ${x.returning_listeners === 1 ? 'já tinha' : 'já tinham'} ouvido ${previousPhrase(days)}.`,
      );
    }
  }
  return { total, buckets, sentences };
}

/** Programs with someone listening, best average first; null if none. */
export function topProgram(programs: InsightsProgram[]): InsightsProgram | null {
  const ranked = programs
    .filter((p) => p.avg_listeners != null && p.avg_listeners > 0 && p.listeners > 0)
    .sort((a, b) => (b.avg_listeners ?? 0) - (a.avg_listeners ?? 0));
  return ranked[0] ?? null;
}

/** Program reaching the most distinct listeners (ties: better average). */
export function widestProgram(programs: InsightsProgram[]): InsightsProgram | null {
  const ranked = programs
    .filter((p) => p.listeners > 0)
    .sort((a, b) => b.listeners - a.listeners || (b.avg_listeners ?? 0) - (a.avg_listeners ?? 0));
  return ranked[0] ?? null;
}

/** Average people as words: "1 pessoa", "0,9 pessoas", "menos de 0,1 pessoas". */
export function peopleAvg(avg: number): string {
  const v = Math.round(avg * 10) / 10;
  if (v === 0) return 'menos de 0,1 pessoas';
  if (v === 1) return '1 pessoa';
  return `${nf(v, Number.isInteger(v) ? 0 : 1)} pessoas`;
}

/** Summary paragraph shown on top of the page and in the exports. */
export function summarySentences(
  days: number,
  o: InsightsOverview,
  x: InsightsExtra | null,
  heat: InsightsHeatCell[],
  programs: InsightsProgram[],
): string[] {
  const out: string[] = [];
  const when = periodPhrase(days);
  // Without the extras we cannot tell if the previous period is complete: no comparison.
  const prevComplete = x?.prev_complete ?? false;

  if (o.listeners === 0) {
    out.push(`${when}, ainda ninguém ouviu a rádio durante pelo menos 1 minuto.`);
    return out;
  }

  const cmpListeners = compareText(o.listeners, o.prev_listeners, days, prevComplete);
  out.push(
    `${when}, a rádio teve ${countWord(o.listeners, 'ouvinte', 'ouvintes')}${cmpListeners ? `, ${cmpListeners}` : ''}.`,
  );

  const cmpHours = compareText(
    Math.round(o.listening_hours * 60),
    Math.round(o.prev_listening_hours * 60),
    days,
    prevComplete,
    (min) => hoursText(min / 60),
  );
  out.push(`Ao todo, ouviram ${hoursText(o.listening_hours)}${cmpHours ? `, ${cmpHours}` : ''}.`);

  if (o.peak_concurrent != null && o.peak_concurrent > 0 && o.peak_at) {
    const ties = x?.peak_snapshots ?? 1;
    out.push(
      `O momento com mais gente a ouvir ao mesmo tempo foi ${lisbonMoment(o.peak_at)}, com ${countWord(o.peak_concurrent, 'pessoa', 'pessoas')}` +
        (ties > 1 ? ` (chegou a esse número em ${nf(ties)} momentos diferentes; este é o mais recente).` : '.'),
    );
  }

  const slots = strongestSlots(heat);
  if (slots && days > 1) {
    out.push(
      `A hora com mais gente costuma ser ${onWeekday(slots.hourDay)}, das ${String(slots.hour).padStart(2, '0')}:00 às ${String((slots.hour + 1) % 24).padStart(2, '0')}:00` +
        (days >= 7 ? `, e o dia da semana mais forte é ${weekdayWithArticle(slots.day)}.` : '.'),
    );
  }

  const top = topProgram(programs);
  if (top) {
    let text = `O programa com mais gente a ouvir, em média, foi «${top.program}» (${top.schedule_label}): ${peopleAvg(top.avg_listeners ?? 0)} durante a emissão`;
    const widest = widestProgram(programs);
    if (widest && widest !== top && widest.listeners > top.listeners) {
      text += `; o que chegou a mais pessoas diferentes foi «${widest.program}» (${countWord(widest.listeners, 'ouvinte', 'ouvintes')})`;
    }
    out.push(`${text}.`);
  }

  if (x && !prevComplete) {
    out.push(
      `Não há comparação com o período anterior: o histórico de ligações só começa a ${x?.history_start ? lisbonDate(x.history_start) : '—'}.`,
    );
  }
  return out;
}

/** Whole percentages that always add up to 100 (largest remainder). */
export function roundedShares(counts: number[]): number[] {
  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((s, v) => s + v, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    out[i] += 1;
    left -= 1;
  }
  return out;
}
