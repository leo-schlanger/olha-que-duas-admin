// Audience report in Excel (exceljs loaded only on export). Same data and
// sentences as the page and the PDF.
import type { Workbook, Worksheet } from 'exceljs';
import type { AudienceData } from '../../hooks/useAudienceStats';
import { WEEKDAYS, kpiRows, type RetentionReading } from './insights';

const BRAND = 'FFC0392B';
const SOFT = 'FFF3ECE2';

export interface AudienceExcelInput {
  data: AudienceData;
  periodLabel: string;
  summary: string[];
  retention: RetentionReading;
  prevComplete: boolean;
  sourceLabel: (s: string) => string;
  deviceLabel: (d: string) => string;
  countryLabel: (c: string) => string;
}

function table(ws: Worksheet, header: string[], rows: Array<Array<string | number | null>>, widths: number[]) {
  ws.columns = widths.map((width) => ({ width }));
  const h = ws.addRow(header);
  h.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  h.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
  });
  rows.forEach((r) => ws.addRow(r));
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

const lisbon = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon', dateStyle: 'short', timeStyle: 'short' }) : '';

export async function downloadAudienceExcel(input: AudienceExcelInput) {
  const { data, periodLabel, summary, retention } = input;
  const o = data.overview;
  const { default: ExcelJS } = await import('exceljs');
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'Olha que Duas';

  const res = wb.addWorksheet('Resumo');
  res.columns = [{ width: 44 }, { width: 18 }, { width: 18 }];
  const title = res.addRow([`Audiência da rádio — ${periodLabel}`]);
  title.font = { bold: true, size: 14, color: { argb: BRAND } };
  if (o) res.addRow([`${lisbon(o.period_start)} a ${lisbon(o.period_end)} (hora de Lisboa)`]);
  res.addRow([]);
  summary.forEach((s) => {
    const r = res.addRow([s]);
    res.mergeCells(r.number, 1, r.number, 3);
    r.alignment = { wrapText: true, vertical: 'top' };
    r.height = 32;
  });
  if (o) {
    res.addRow([]);
    const h = res.addRow(['Indicador', 'Este período', ...(input.prevComplete ? ['Período anterior'] : [])]);
    h.font = { bold: true };
    h.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };
    });
    // No previous-period values at all when its history is incomplete (90 days)
    for (const k of kpiRows(o, input.prevComplete)) {
      const r = res.addRow([k.label, k.current, ...(input.prevComplete ? [k.previous] : [])]);
      if (k.label === 'Tempo com alguém a ouvir') r.getCell(2).numFmt = '0%';
    }
  }

  table(
    wb.addWorksheet('Por dia'),
    ['Dia / hora', 'Ouvintes', 'Escutas', 'Horas ouvidas', 'Média ao mesmo tempo', 'Máximo ao mesmo tempo'],
    data.series.map((p) => [p.bucket_label, p.listeners, p.sessions, p.listening_hours, p.avg_concurrent, p.peak_concurrent]),
    [14, 12, 12, 14, 20, 22],
  );

  const cells = new Map(data.heatmap.map((c) => [`${c.day_of_week}-${c.hour_of_day}`, c.avg_listeners]));
  table(
    wb.addWorksheet('Quando ouvem'),
    ['Dia', ...Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`)],
    [1, 2, 3, 4, 5, 6, 0].map((d) => [WEEKDAYS[d], ...Array.from({ length: 24 }, (_, h) => cells.get(`${d}-${h}`) ?? 0)]),
    [14, ...Array(24).fill(6)],
  );

  table(
    wb.addWorksheet('Programas'),
    ['Programa', 'Tipo', 'Horário', 'Emissões', 'Média a ouvir', 'Máximo', 'Ouvintes', 'Horas ouvidas', 'Horas por emissão'],
    data.programs.map((p) => [p.program, p.kind, p.schedule_label, p.occurrences, p.avg_listeners, p.peak_listeners, p.listeners, p.listening_hours, p.hours_per_occurrence]),
    [34, 9, 30, 10, 13, 9, 10, 13, 16],
  );

  const ret = wb.addWorksheet('Tempo de escuta');
  table(ret, ['Duração da escuta', 'Escutas'], retention.buckets.map((b) => [b.label, b.count]), [40, 12]);
  ret.addRow(['Total', retention.total]).font = { bold: true };
  ret.addRow([]);
  retention.sentences.forEach((s) => ret.addRow([s]));

  table(
    wb.addWorksheet('Origem'),
    ['Origem', 'Ouvintes', 'Escutas', 'Ligações < 1 min', 'Horas ouvidas', '% das horas'],
    data.bySource.map((s) => [input.sourceLabel(s.source), s.listeners, s.sessions, s.short_connections, s.listening_hours, s.hours_share]),
    [36, 10, 10, 16, 14, 12],
  );
  table(
    wb.addWorksheet('Dispositivo'),
    ['Dispositivo', 'Ouvintes', 'Escutas', 'Horas ouvidas', '% das horas'],
    data.byDevice.map((d) => [input.deviceLabel(d.device), d.listeners, d.sessions, d.listening_hours, d.hours_share]),
    [32, 10, 10, 14, 12],
  );
  table(
    wb.addWorksheet('Países'),
    ['País', 'Ouvintes', 'Horas ouvidas'],
    data.byCountry.map((c) => [input.countryLabel(c.country), c.listeners, c.listening_hours]),
    [28, 10, 14],
  );
  for (const name of ['Origem', 'Dispositivo']) {
    const ws = wb.getWorksheet(name)!;
    ws.getColumn(ws.columnCount).numFmt = '0%';
  }

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audiencia-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
