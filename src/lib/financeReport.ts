// Relatório mensal por email: conteúdo (assunto, HTML, texto) + o Excel.
// Também é empacotado para a edge function finance-monthly-report
// (npm run build:report), por isso não usa nada do browser.
import {
  computeDistribution,
  computeSummary,
  formatDate,
  formatEUR,
  isOverdue,
  periodLabel,
  periodRange,
  shiftPeriod,
  type FinanceData,
  type Period,
} from './finance';

export { buildFinanceWorkbook, reportFileName } from './financeExcel';
export { shiftPeriod } from './finance';
export type { FinanceData, Period } from './finance';

/** O PostgREST devolve NUMERIC como texto; normaliza para número. */
export function normalizeFinanceData(raw: Record<string, unknown[]> & { reservePercent?: unknown }): FinanceData {
  const num = <T>(rows: unknown[] | undefined, keys: string[]) =>
    (rows ?? []).map((r) => {
      const copy = { ...(r as Record<string, unknown>) };
      for (const k of keys) copy[k] = Number(copy[k]);
      return copy as T;
    });
  return {
    transactions: num(raw.transactions, ['amount']),
    categories: num(raw.categories, []),
    clients: num(raw.clients, []),
    recurrences: num(raw.recurrences, ['amount', 'generated_count']),
    members: num(raw.members, ['share_percent']),
    payouts: num(raw.payouts, ['amount']),
    reservePercent: Number(raw.reservePercent ?? 0),
  };
}

/** Mês anterior ao de `today` ("YYYY-MM-DD"). */
export const previousMonth = (today: string): Period => shiftPeriod({ type: 'month', value: today.slice(0, 7) }, -1);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function buildReportEmail(data: FinanceData, period: Period, panelUrl = 'https://admin.olhaqueduas.com') {
  const label = cap(periodLabel(period));
  const { from, to } = periodRange(period);
  const s = computeSummary(data.transactions, data.categories, data.clients, period);
  const d = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const overdue = data.transactions.filter((t) => t.kind === 'income' && isOverdue(t));

  const subject = `Olha que Duas — Relatório financeiro de ${label}`;

  const kpi = (name: string, value: number, color = '#3f3a33', strong = false) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #e3dacd;color:#3f3a33">${name}</td>` +
    `<td style="padding:8px 12px;border-bottom:1px solid #e3dacd;text-align:right;color:${color};${strong ? 'font-weight:700;font-size:16px' : ''}">${formatEUR(value)}</td></tr>`;

  const members = d.shares
    .map(
      (m) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #e3dacd">${esc(m.member.name)}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right">${String(m.member.share_percent).replace(".", ",")}%</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right;font-weight:600">${formatEUR(m.due)}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right;color:${m.balance > 0 ? '#b91c1c' : '#15803d'}">${formatEUR(m.balance)}</td></tr>`
    )
    .join('');

  const overdueHtml = overdue.length
    ? `<p style="margin:16px 0 4px;color:#b91c1c;font-weight:700">⚠ Pagamentos de clientes em atraso</p><ul style="margin:0;padding-left:18px;color:#3f3a33">` +
      overdue.map((t) => `<li>${esc(t.description)} — ${formatEUR(t.amount)} (previsto ${formatDate(t.tx_date)})</li>`).join('') +
      '</ul>'
    : '';

  const th = 'padding:8px 12px;background:#c0392b;color:#fff;text-align:left;font-weight:600';
  const html = `<!doctype html><html><body style="margin:0;background:#f8f4ee;font-family:Calibri,Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ee;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e3dacd">
<tr><td style="background:#c0392b;padding:18px 24px;color:#fff;font-size:20px;font-weight:700">Olha que Duas — Relatório financeiro</td></tr>
<tr><td style="background:#962d22;padding:6px 24px;color:#fff;font-size:13px">${label} · ${formatDate(from)} a ${formatDate(to)}</td></tr>
<tr><td style="padding:20px 24px">
<p style="margin:0 0 12px;color:#3f3a33">Olá! Segue o resumo financeiro de <strong>${label}</strong>. O relatório completo (Excel) vai em anexo.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3dacd;border-collapse:collapse;font-size:14px">
${kpi('Entrou', s.income, '#15803d')}
${kpi('Saiu', s.expense, '#b91c1c')}
${kpi(s.result >= 0 ? 'Sobrou' : 'Faltou', s.result, s.result >= 0 ? '#15803d' : '#b91c1c', true)}
${data.reservePercent ? kpi(`Guardado para impostos/caixa (${data.reservePercent}%)`, d.reserve) : ''}
${kpi('Para dividir pela equipa', d.distributable, '#3f3a33', true)}
</table>
${d.shares.length ? `<p style="margin:20px 0 6px;color:#c0392b;font-weight:700;text-transform:uppercase;font-size:13px">Quanto cabe a cada um</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3dacd;border-collapse:collapse;font-size:14px">
<tr><th style="${th}">Membro</th><th style="${th};text-align:right">Parte</th><th style="${th};text-align:right">Cabe-lhe</th><th style="${th};text-align:right">Falta pagar</th></tr>
${members}</table>` : ''}
${s.pendingIncome || s.pendingExpense ? `<p style="margin:16px 0 0;color:#7a7268;font-size:13px">Ainda por receber neste período: ${formatEUR(s.pendingIncome)} · por pagar: ${formatEUR(s.pendingExpense)}.</p>` : ''}
${overdueHtml}
<p style="margin:24px 0 0"><a href="${panelUrl}" style="background:#c0392b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Abrir o painel de Finanças</a></p>
</td></tr>
<tr><td style="padding:12px 24px;border-top:1px solid #e3dacd;color:#7a7268;font-size:12px">Enviado automaticamente no dia 1 de cada mês pelo painel admin da Olha que Duas. Só contam os movimentos marcados como pagos.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Olha que Duas — Relatório financeiro de ${label} (${formatDate(from)} a ${formatDate(to)})`,
    '',
    `Entrou: ${formatEUR(s.income)}`,
    `Saiu: ${formatEUR(s.expense)}`,
    `${s.result >= 0 ? 'Sobrou' : 'Faltou'}: ${formatEUR(s.result)}`,
    ...(data.reservePercent ? [`Guardado (${data.reservePercent}%): ${formatEUR(d.reserve)}`] : []),
    `Para dividir pela equipa: ${formatEUR(d.distributable)}`,
    '',
    ...d.shares.map((m) => `- ${m.member.name} (${String(m.member.share_percent).replace(".", ",")}%): ${formatEUR(m.due)} — falta pagar ${formatEUR(m.balance)}`),
    ...(overdue.length ? ['', 'Em atraso:', ...overdue.map((t) => `- ${t.description}: ${formatEUR(t.amount)} (${formatDate(t.tx_date)})`)] : []),
    '',
    `Relatório completo em anexo. Painel: ${panelUrl}`,
  ].join('\n');

  return { subject, html, text };
}
