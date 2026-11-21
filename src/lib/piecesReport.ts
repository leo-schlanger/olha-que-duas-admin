// Pieces report (PDF via print + Excel) built from the same data shown in the Analytics tab.
import type { Workbook } from 'exceljs';
import type { PiecesData, WeekStat } from '../hooks/usePiecesAnalytics';
import { countLabel, formatChange, weekLabel } from './pecasAnalytics';

export interface PiecesReportInput {
  periodLabel: string;
  data: PiecesData;
  weeks: WeekStat[];
}

const SOURCE_LABEL: Record<string, string> = {
  Google: 'Google (pesquisa)',
  Instagram: 'Instagram',
  Facebook: 'Facebook',
  WhatsApp: 'WhatsApp',
  Direto: 'Direto (link escrito, guardado ou partilhado)',
  Outros: 'Outros sites',
};

const n = (v: number) => Math.round(v).toLocaleString('pt-PT');

function esc(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function stamp(): string {
  return new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon', dateStyle: 'short', timeStyle: 'short' });
}

export function generatePiecesPDF({ periodLabel, data, weeks }: PiecesReportInput): void {
  const rows = (cells: string[][]) => cells.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  const html = `<!DOCTYPE html>
<html lang="pt-PT"><head><meta charset="UTF-8"><title>Leituras das peças – Olha que Duas</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #333; }
  h1 { color: #b4292b; border-bottom: 2px solid #b4292b; padding-bottom: 8px; }
  h2 { color: #555; margin-top: 28px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
  th, td { padding: 7px 8px; text-align: left; border-bottom: 1px solid #ddd; vertical-align: top; }
  th { background: #f5f5f5; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .meta { color: #666; font-size: 13px; }
  @media print { body { padding: 12px; } }
</style></head><body>
<h1>Leituras das peças</h1>
<p class="meta">Período: ${esc(periodLabel)} · Gerado em ${stamp()} · Fonte: Umami</p>
<p>${countLabel(data.totalReads, 'leitura', 'leituras')} de peças (${formatChange(data.totalReads, data.prevTotalReads)} face ao período anterior).</p>
<h2>Peças mais lidas</h2>
<table><thead><tr><th>#</th><th>Peça</th><th>Programa</th><th class="num">Leituras</th><th class="num">Pessoas</th><th class="num">Variação</th></tr></thead>
<tbody>${data.pieces.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.title)}</td><td>${esc(p.programTitle)}</td><td class="num">${n(p.pageviews)}</td><td class="num">${n(p.visitors)}</td><td class="num">${formatChange(p.pageviews, p.prevPageviews)}</td></tr>`).join('')}</tbody></table>
<h2>Leituras por programa</h2>
<table><thead><tr><th>Programa</th><th class="num">Peças</th><th class="num">Leituras</th><th class="num">Variação</th></tr></thead>
<tbody>${data.programs.map((p) => `<tr><td>${esc(p.programTitle)}</td><td class="num">${p.pieces}</td><td class="num">${n(p.pageviews)}</td><td class="num">${formatChange(p.pageviews, p.prevPageviews)}</td></tr>`).join('')}</tbody></table>
<h2>De onde vêm as visitas (site inteiro)</h2>
<table><thead><tr><th>Origem</th><th class="num">Visitas</th><th class="num">%</th></tr></thead>
<tbody>${rows(data.sources.map((s) => [esc(SOURCE_LABEL[s.group] ?? s.group), n(s.visits), `${s.share}%`]))}</tbody></table>
<h2>Semana a semana (7 dias seguidos)</h2>
<table><thead><tr><th>Semana</th><th class="num">Leituras</th><th>Peça mais lida</th></tr></thead>
<tbody>${rows(weeks.map((w) => [weekLabel(w), n(w.pageviews), esc(w.top?.title ?? '—')]))}</tbody></table>
<p class="meta">Leituras = vezes que a peça foi aberta. Pessoas = leitores diferentes. Quem abre um link do WhatsApp aparece quase sempre em «Direto».</p>
</body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export async function generatePiecesExcel({ periodLabel, data, weeks }: PiecesReportInput): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'Olha que Duas – Admin';

  const sheet = (name: string, header: string[], body: (string | number)[][], widths: number[]) => {
    const ws = wb.addWorksheet(name);
    ws.addRow([`Período: ${periodLabel}`]);
    ws.addRow([]);
    const h = ws.addRow(header);
    h.font = { bold: true };
    body.forEach((r) => ws.addRow(r));
    widths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
  };

  sheet(
    'Peças',
    ['#', 'Peça', 'Programa', 'Leituras', 'Pessoas', 'Leituras no período anterior', 'Variação'],
    data.pieces.map((p, i) => [i + 1, p.title, p.programTitle, p.pageviews, p.visitors, p.prevPageviews, formatChange(p.pageviews, p.prevPageviews)]),
    [5, 60, 28, 10, 10, 14, 10],
  );
  sheet(
    'Programas',
    ['Programa', 'Peças', 'Leituras', 'Leituras no período anterior', 'Variação'],
    data.programs.map((p) => [p.programTitle, p.pieces, p.pageviews, p.prevPageviews, formatChange(p.pageviews, p.prevPageviews)]),
    [32, 8, 10, 14, 10],
  );
  sheet(
    'Origem',
    ['Origem', 'Visitas', '%'],
    data.sources.map((s) => [SOURCE_LABEL[s.group] ?? s.group, s.visits, s.share]),
    [44, 10, 8],
  );
  sheet(
    'Semanas',
    ['Semana', 'Leituras', 'Peça mais lida'],
    weeks.map((w) => [weekLabel(w), w.pageviews, w.top?.title ?? '']),
    [16, 10, 60],
  );

  const buffer = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Olha que Duas - Leituras das peças ${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
