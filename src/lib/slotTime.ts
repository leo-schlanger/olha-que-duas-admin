// Horários dos blocos da Programação Diária.
//
// O site, a app e o SQL da audiência leem o formato "07h", "10h30" ou
// "07h-10h" (h minúsculo). Qualquer outra escrita ("7:00", "07H - 10H") fazia
// o bloco aparecer à meia-noite ou sumir da audiência por programa.

const PART_RE = /^(\d{1,2})\s*(?:[hH:.]\s*(\d{2})?)?$/;

function normalizePart(part: string): { text: string; minutes: number } | null {
  const match = part.trim().match(PART_RE);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = match[2] ? Number(match[2]) : 0;
  if (hours > 24 || mins > 59 || (hours === 24 && mins > 0)) return null;
  const h = hours === 24 ? 0 : hours;
  return {
    text: `${String(h).padStart(2, '0')}h${mins ? String(mins).padStart(2, '0') : ''}`,
    minutes: hours * 60 + mins,
  };
}

export interface NormalizedSlotTime {
  /** Texto a gravar: "07h", "10h30" ou "07h-10h". */
  value: string;
  startMinutes: number;
  /** Fim em minutos (00h no fim = 1440), ou null sem fim. */
  endMinutes: number | null;
}

export function normalizeSlotTime(input: string): NormalizedSlotTime | null {
  const parts = input.split('-');
  if (parts.length > 2) return null;

  const start = normalizePart(parts[0]);
  if (!start || start.minutes >= 24 * 60) return null;
  if (parts.length === 1) {
    return { value: start.text, startMinutes: start.minutes, endMinutes: null };
  }

  const end = normalizePart(parts[1]);
  if (!end) return null;
  const endMinutes = end.minutes === 0 ? 24 * 60 : end.minutes;
  if (endMinutes <= start.minutes) return null;
  return { value: `${start.text}-${end.text}`, startMinutes: start.minutes, endMinutes };
}

/** "07H - 12H" → { start: 420, end: 720 } ("00H" no fim = 1440). */
export function parsePeriodRange(range: string): { start: number; end: number } | null {
  const match = range.match(/^\s*(\d{1,2})\s*H\s*-\s*(\d{1,2})\s*H\s*$/i);
  if (!match) return null;
  const end = Number(match[2]) * 60;
  return { start: Number(match[1]) * 60, end: end === 0 ? 24 * 60 : end };
}

/** Mensagem de erro para o formulário, ou null se o horário é válido para o período. */
export function validateSlotTime(input: string, periodRange: string, periodLabel: string): string | null {
  const slot = normalizeSlotTime(input);
  if (!slot) return 'Horário inválido. Usa por exemplo 07h, 10h30 ou 07h-10h.';

  const range = parsePeriodRange(periodRange);
  if (range && (slot.startMinutes < range.start || slot.startMinutes >= range.end)) {
    return `O início tem de estar dentro do período ${periodLabel} (${periodRange}).`;
  }
  return null;
}
