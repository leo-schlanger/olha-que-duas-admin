// Datas dos eventos com data (tabela schedule_dates), sempre em hora de Lisboa.

/** Data de hoje em Lisboa, "YYYY-MM-DD". */
export function lisbonToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Soma dias a "YYYY-MM-DD" (sem depender do fuso do computador). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

/** Dia da semana (0 = domingo) de "YYYY-MM-DD". */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Próxima data (hoje incluído) que calha no dia da semana pedido. */
export function nextDateForWeekday(weekday: number, today: string = lisbonToday()): string {
  const diff = (weekday - weekdayOf(today) + 7) % 7;
  return addDays(today, diff);
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "YYYY-MM-DD" → "ter, 15/09/2026". */
export function formatEventDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${WEEKDAYS[weekdayOf(date)]}, ${d}/${m}/${y}`;
}

export const isValidIsoDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && addDays(date, 0) === date;
