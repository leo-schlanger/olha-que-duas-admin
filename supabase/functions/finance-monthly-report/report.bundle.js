// GERADO por scripts/build-report.mjs a partir de src/lib/financeReport.ts — não editar.
import __ExcelJS from "npm:exceljs@4.4.0";
// src/lib/scheduleDates.ts
function lisbonToday(now = /* @__PURE__ */ new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}
function addDays(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

// src/lib/finance.ts
var eur = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
var formatEUR = (value) => eur.format(value);
function formatDate(date) {
  if (!date) return "\u2014";
  const [y, m, d] = date.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
var round2 = (n) => Math.round(n * 100) / 100;
function periodRange(p) {
  if (p.type === "year") return { from: `${p.value}-01-01`, to: `${p.value}-12-31` };
  const [y, m] = p.value.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${p.value}-01`, to: `${p.value}-${String(last).padStart(2, "0")}` };
}
var MONTHS = [
  "janeiro",
  "fevereiro",
  "mar\xE7o",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro"
];
function periodLabel(p) {
  if (p.type === "year") return `Ano ${p.value}`;
  const [y, m] = p.value.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
function periodMonths(p) {
  if (p.type === "month") return [p.value];
  return Array.from({ length: 12 }, (_, i) => `${p.value}-${String(i + 1).padStart(2, "0")}`);
}
function shiftPeriod(p, delta) {
  if (p.type === "year") return { type: "year", value: String(Number(p.value) + delta) };
  const [y, m] = p.value.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { type: "month", value: d.toISOString().slice(0, 7) };
}
var inPeriod = (date, p) => {
  const { from, to } = periodRange(p);
  return date >= from && date <= to;
};
var isOverdue = (t, today = lisbonToday()) => t.status === "pending" && t.tx_date < today;
function groupByCategory(txs, categories) {
  const map = /* @__PURE__ */ new Map();
  for (const t of txs) map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
  return [...map.entries()].map(([id, total]) => {
    const c = categories.find((x) => x.id === id);
    return { id, name: c?.name ?? "Sem categoria", color: c?.color ?? "#9ca3af", total: round2(total) };
  }).sort((a, b) => b.total - a.total);
}
function computeSummary(txs, categories, clients, period) {
  const inP = txs.filter((t) => inPeriod(t.tx_date, period));
  const paid = inP.filter((t) => t.status === "paid");
  const pending = inP.filter((t) => t.status === "pending");
  const sum = (list) => round2(list.reduce((s, t) => s + t.amount, 0));
  const paidIncome = paid.filter((t) => t.kind === "income");
  const paidExpense = paid.filter((t) => t.kind === "expense");
  const income = sum(paidIncome);
  const expense = sum(paidExpense);
  const clientMap = /* @__PURE__ */ new Map();
  for (const t of paidIncome) clientMap.set(t.client_id, (clientMap.get(t.client_id) ?? 0) + t.amount);
  return {
    income,
    expense,
    result: round2(income - expense),
    pendingIncome: sum(pending.filter((t) => t.kind === "income")),
    pendingExpense: sum(pending.filter((t) => t.kind === "expense")),
    overdueIncome: sum(txs.filter((t) => t.kind === "income" && isOverdue(t))),
    incomeByCategory: groupByCategory(paidIncome, categories),
    expenseByCategory: groupByCategory(paidExpense, categories),
    incomeByClient: [...clientMap.entries()].map(([id, total]) => ({
      id,
      name: clients.find((c) => c.id === id)?.name ?? "Sem cliente",
      total: round2(total)
    })).sort((a, b) => b.total - a.total)
  };
}
var sharesComplete = (totalPercent) => Math.abs(totalPercent - 100) <= 0.1;
function computeDistribution(txs, members, payouts, reservePercent, period) {
  const active = members.filter((m) => m.is_active);
  const totalPercent = round2(active.reduce((s, m) => s + m.share_percent, 0));
  let result = 0;
  let reserve = 0;
  let distributable = 0;
  for (const month of periodMonths(period)) {
    const p = { type: "month", value: month };
    const paid = txs.filter((t) => t.status === "paid" && inPeriod(t.tx_date, p));
    const r = paid.reduce((s, t) => s + (t.kind === "income" ? t.amount : -t.amount), 0);
    result += r;
    if (r > 0) {
      const res = r * reservePercent / 100;
      reserve += res;
      distributable += r - res;
    }
  }
  const periodPayouts = payouts.filter((p) => inPeriod(p.period, period));
  const dues = active.map((m) => round2(distributable * m.share_percent / (sharesComplete(totalPercent) ? totalPercent : 100)));
  if (sharesComplete(totalPercent) && dues.length > 0) {
    const diff = round2(round2(distributable) - dues.reduce((a, d) => a + d, 0));
    dues[dues.length - 1] = round2(dues[dues.length - 1] + diff);
  }
  const shares = active.map((member, i) => {
    const due = dues[i];
    const paid = round2(
      periodPayouts.filter((p) => p.member_id === member.id).reduce((s, p) => s + p.amount, 0)
    );
    return { member, due, paid, balance: round2(due - paid) };
  });
  return {
    result: round2(result),
    reserve: round2(reserve),
    distributable: round2(distributable),
    totalPercent,
    shares
  };
}

// src/lib/financeExcel.ts
var BRAND = "FFC0392B";
var BRAND_DARK = "FF962D22";
var INK = "FF3F3A33";
var MUTED = "FF7A7268";
var ZEBRA = "FFF8F4EE";
var SOFT = "FFF3ECE2";
var LINE = "FFE3DACD";
var GREEN = "FF15803D";
var RED = "FFB91C1C";
var FONT = "Calibri";
var EUR = '#,##0.00 "\u20AC";[Red]-#,##0.00 "\u20AC";0.00 "\u20AC"';
var DATE = "dd/mm/yyyy";
var fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
var thin = { style: "thin", color: { argb: LINE } };
var boxBorder = { top: thin, bottom: thin, left: thin, right: thin };
var xlDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
var colLetter = (n) => {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
function setupSheet(ws, widths, landscape, title) {
  ws.columns = widths.map((width) => ({ width }));
  ws.properties.defaultRowHeight = 18;
  ws.views = [{ showGridLines: false }];
  ws.pageSetup = {
    paperSize: 9,
    // A4
    orientation: landscape ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 }
  };
  ws.headerFooter.oddFooter = `&L&8Olha que Duas \u2014 ${title}&R&8P\xE1gina &P de &N`;
}
function titleBlock(ws, lastCol, title, subtitle) {
  const end = colLetter(lastCol);
  ws.mergeCells(`A1:${end}1`);
  const t = ws.getCell("A1");
  t.value = title;
  t.font = { name: FONT, size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  t.fill = fill(BRAND);
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 32;
  ws.mergeCells(`A2:${end}2`);
  const s = ws.getCell("A2");
  s.value = subtitle;
  s.font = { name: FONT, size: 10, italic: true, color: { argb: "FFFFFFFF" } };
  s.fill = fill(BRAND_DARK);
  s.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(2).height = 20;
  return 4;
}
function sectionTitle(ws, row, lastCol, text, note) {
  const end = colLetter(lastCol);
  ws.mergeCells(`A${row}:${end}${row}`);
  const c = ws.getCell(`A${row}`);
  c.value = text.toUpperCase();
  c.font = { name: FONT, size: 11, bold: true, color: { argb: BRAND } };
  c.border = { bottom: { style: "medium", color: { argb: BRAND } } };
  ws.getRow(row).height = 22;
  if (note) {
    ws.mergeCells(`A${row + 1}:${end}${row + 1}`);
    const n = ws.getCell(`A${row + 1}`);
    n.value = note;
    n.font = { name: FONT, size: 9, italic: true, color: { argb: MUTED } };
    n.alignment = { wrapText: true, vertical: "top" };
    ws.getRow(row + 1).height = 28;
    return row + 2;
  }
  return row + 1;
}
function alignFor(type, wrap = false) {
  if (type === "date") return { horizontal: "center", vertical: "middle" };
  if (type && type !== "text") return { horizontal: "right", vertical: "middle", indent: 1 };
  return { horizontal: "left", vertical: "middle", indent: 1, wrapText: wrap };
}
var cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function styleHeaderCell(c) {
  c.font = { name: FONT, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  c.fill = fill(BRAND);
  c.alignment = { vertical: "middle", wrapText: true };
  c.border = boxBorder;
}
async function buildFinanceWorkbook(data, period) {
  const { default: ExcelJS } = await Promise.resolve({ default: __ExcelJS });
  const wb = new ExcelJS.Workbook();
  wb.creator = "Olha que Duas \u2014 Painel Admin";
  wb.created = /* @__PURE__ */ new Date();
  const label = period.type === "year" ? period.value : cap(periodLabel(period));
  const { from, to } = periodRange(period);
  const today = lisbonToday();
  const clientName = (id) => data.clients.find((c) => c.id === id)?.name ?? "";
  const memberName = (id) => data.members.find((m) => m.id === id)?.name ?? "membro";
  const whatOf = (description, clientId) => {
    const c = clientName(clientId);
    return c && !description.includes(c) ? `${description} \u2014 ${c}` : description;
  };
  const lines = [
    ...data.transactions.filter((t) => t.status === "paid").map((t) => ({
      date: t.tx_date,
      what: whatOf(t.description, t.client_id),
      in: t.kind === "income" ? t.amount : null,
      out: t.kind === "expense" ? t.amount : null
    })),
    ...data.payouts.map((p) => ({
      date: p.paid_at,
      what: `Divis\xE3o pela equipa \u2014 ${memberName(p.member_id)}`,
      in: null,
      out: p.amount
    }))
  ].sort((a, b) => a.date.localeCompare(b.date) || (a.in ? -1 : 1));
  const before = lines.filter((l) => l.date < from);
  const opening = Math.round(before.reduce((s, l) => s + (l.in ?? 0) - (l.out ?? 0), 0) * 100) / 100;
  const rows = lines.filter((l) => l.date >= from && l.date <= to);
  const totalIn = rows.reduce((s, l) => s + (l.in ?? 0), 0);
  const totalOut = rows.reduce((s, l) => s + (l.out ?? 0), 0);
  const ws = wb.addWorksheet("Caixa", { properties: { tabColor: { argb: BRAND } } });
  setupSheet(ws, [13, 46, 15, 15, 15], false, `Livro de caixa \u2014 ${label}`);
  let r = titleBlock(
    ws,
    5,
    `Olha que Duas \u2014 Caixa de ${label}`,
    `${formatDate(from)} a ${formatDate(to)}  \xB7  Gerado em ${formatDate(today)}`
  );
  const big = [
    ["Entrou", totalIn, GREEN],
    ["Saiu", totalOut, RED],
    ["Ficou em caixa", opening + totalIn - totalOut, INK]
  ];
  const labelsRow = ws.getRow(r);
  const valuesRow = ws.getRow(r + 1);
  big.forEach(([name, value, color], i) => {
    const col = i + 3;
    const l = labelsRow.getCell(col);
    l.value = name;
    l.font = { name: FONT, size: 10, bold: true, color: { argb: MUTED } };
    l.alignment = alignFor("eur");
    const v = valuesRow.getCell(col);
    v.value = Math.round(value * 100) / 100;
    v.numFmt = EUR;
    v.font = { name: FONT, size: 14, bold: true, color: { argb: color } };
    v.alignment = alignFor("eur");
    v.fill = fill(SOFT);
    v.border = boxBorder;
  });
  valuesRow.height = 26;
  r += 3;
  const header = r;
  ["Data", "O qu\xEA", "Entrou", "Saiu", "Saldo"].forEach((h, i) => {
    const c = ws.getRow(r).getCell(i + 1);
    c.value = h;
    styleHeaderCell(c);
    c.alignment = { ...alignFor(i === 0 ? "date" : i === 1 ? "text" : "eur") };
  });
  ws.getRow(r).height = 22;
  r += 1;
  const put = (cells, opts = {}) => {
    const row = ws.getRow(r);
    cells.forEach((value, i) => {
      const c = row.getCell(i + 1);
      c.value = value;
      c.border = boxBorder;
      c.alignment = alignFor(i === 0 ? "date" : i === 1 ? "text" : "eur", i === 1);
      c.font = { name: FONT, size: 11, italic: opts.muted, color: { argb: opts.muted ? MUTED : i === 2 ? GREEN : i === 3 ? RED : INK } };
      if (i === 0) c.numFmt = DATE;
      if (i >= 2) c.numFmt = EUR;
      if (opts.zebra) c.fill = fill(ZEBRA);
    });
    row.getCell(5).font = { name: FONT, size: 11, bold: true, color: { argb: INK } };
    row.height = 20;
    return r++;
  };
  let prev = null;
  if (opening !== 0) prev = put([xlDate(from), "Saldo que vinha do per\xEDodo anterior", null, null, opening], { muted: true });
  rows.forEach((l, idx) => {
    const saldo = prev === null ? `N(C${r})-N(D${r})` : `E${prev}+N(C${r})-N(D${r})`;
    prev = put([xlDate(l.date), l.what, l.in, l.out, { formula: saldo }], { zebra: idx % 2 === 1 });
  });
  if (rows.length === 0) {
    ws.mergeCells(`A${r}:E${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = "N\xE3o entrou nem saiu dinheiro neste per\xEDodo.";
    c.font = { name: FONT, size: 11, italic: true, color: { argb: MUTED } };
    r += 1;
  }
  if (rows.length) {
    const first = header + 1;
    const last = r - 1;
    const row = ws.getRow(r);
    row.getCell(2).value = "Total";
    row.getCell(3).value = { formula: `SUM(C${first}:C${last})` };
    row.getCell(4).value = { formula: `SUM(D${first}:D${last})` };
    row.getCell(5).value = { formula: `E${last}` };
    for (let i = 1; i <= 5; i++) {
      const c = row.getCell(i);
      c.font = { name: FONT, size: 11, bold: true, color: { argb: INK } };
      c.fill = fill(SOFT);
      c.border = { top: { style: "medium", color: { argb: INK } }, bottom: thin, left: thin, right: thin };
      c.alignment = alignFor(i <= 2 ? "text" : "eur");
      if (i >= 3) c.numFmt = EUR;
    }
    row.height = 22;
    r += 1;
  }
  ws.views = [{ state: "frozen", ySplit: header, showGridLines: false }];
  r += 1;
  const paidByMember = data.members.map((m) => ({
    name: m.name,
    total: data.payouts.filter((p) => p.member_id === m.id && p.paid_at >= from && p.paid_at <= to).reduce((s, p) => s + p.amount, 0)
  })).filter((x) => x.total > 0);
  if (paidByMember.length) {
    r = sectionTitle(ws, r, 5, "Divis\xE3o pela equipa neste per\xEDodo");
    paidByMember.forEach((x) => {
      const row = ws.getRow(r);
      ws.mergeCells(`A${r}:B${r}`);
      row.getCell(1).value = x.name;
      row.getCell(1).font = { name: FONT, size: 11, color: { argb: INK } };
      row.getCell(1).alignment = alignFor("text");
      row.getCell(4).value = x.total;
      row.getCell(4).numFmt = EUR;
      row.getCell(4).font = { name: FONT, size: 11, color: { argb: INK } };
      row.getCell(4).alignment = alignFor("eur");
      r += 1;
    });
    r += 1;
  }
  const toReceive = data.transactions.filter((t) => t.kind === "income" && t.status === "pending" && t.tx_date <= addDays(today, 31)).sort((a, b) => a.tx_date.localeCompare(b.tx_date));
  if (toReceive.length) {
    r = sectionTitle(ws, r, 5, "Ainda por receber (n\xE3o conta no caixa)");
    toReceive.forEach((t) => {
      const row = ws.getRow(r);
      row.getCell(1).value = xlDate(t.tx_date);
      row.getCell(1).numFmt = DATE;
      row.getCell(1).alignment = alignFor("date");
      row.getCell(2).value = whatOf(t.description, t.client_id) + (isOverdue(t) ? " (em atraso)" : "");
      row.getCell(3).value = t.amount;
      row.getCell(3).numFmt = EUR;
      row.getCell(3).alignment = alignFor("eur");
      for (const i of [1, 2, 3]) {
        row.getCell(i).font = { name: FONT, size: 10, italic: true, color: { argb: isOverdue(t) ? RED : MUTED } };
      }
      r += 1;
    });
  }
  return await wb.xlsx.writeBuffer();
}
var reportFileName = (period) => `Olha que Duas - Relatorio financeiro ${period.value}.xlsx`;

// src/lib/financeReport.ts
function normalizeFinanceData(raw) {
  const num = (rows, keys) => (rows ?? []).map((r) => {
    const copy = { ...r };
    for (const k of keys) copy[k] = Number(copy[k]);
    return copy;
  });
  return {
    transactions: num(raw.transactions, ["amount"]),
    categories: num(raw.categories, []),
    clients: num(raw.clients, []),
    recurrences: num(raw.recurrences, ["amount", "generated_count"]),
    members: num(raw.members, ["share_percent"]),
    payouts: num(raw.payouts, ["amount"]),
    reservePercent: Number(raw.reservePercent ?? 0)
  };
}
var previousMonth = (today) => shiftPeriod({ type: "month", value: today.slice(0, 7) }, -1);
var cap2 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
var esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function buildReportEmail(data, period, panelUrl = "https://admin.olhaqueduas.com") {
  const label = cap2(periodLabel(period));
  const { from, to } = periodRange(period);
  const s = computeSummary(data.transactions, data.categories, data.clients, period);
  const d = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const overdue = data.transactions.filter((t) => t.kind === "income" && isOverdue(t));
  const subject = `Olha que Duas \u2014 Relat\xF3rio financeiro de ${label}`;
  const kpi = (name, value, color = "#3f3a33", strong = false) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e3dacd;color:#3f3a33">${name}</td><td style="padding:8px 12px;border-bottom:1px solid #e3dacd;text-align:right;color:${color};${strong ? "font-weight:700;font-size:16px" : ""}">${formatEUR(value)}</td></tr>`;
  const members = d.shares.map(
    (m) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #e3dacd">${esc(m.member.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right">${String(m.member.share_percent).replace(".", ",")}%</td><td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right;font-weight:600">${formatEUR(m.due)}</td><td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right;color:${m.balance > 0 ? "#b91c1c" : "#15803d"}">${formatEUR(m.balance)}</td></tr>`
  ).join("");
  const overdueHtml = overdue.length ? `<p style="margin:16px 0 4px;color:#b91c1c;font-weight:700">\u26A0 Pagamentos de clientes em atraso</p><ul style="margin:0;padding-left:18px;color:#3f3a33">` + overdue.map((t) => `<li>${esc(t.description)} \u2014 ${formatEUR(t.amount)} (previsto ${formatDate(t.tx_date)})</li>`).join("") + "</ul>" : "";
  const th = "padding:8px 12px;background:#c0392b;color:#fff;text-align:left;font-weight:600";
  const html = `<!doctype html><html><body style="margin:0;background:#f8f4ee;font-family:Calibri,Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ee;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e3dacd">
<tr><td style="background:#c0392b;padding:18px 24px;color:#fff;font-size:20px;font-weight:700">Olha que Duas \u2014 Relat\xF3rio financeiro</td></tr>
<tr><td style="background:#962d22;padding:6px 24px;color:#fff;font-size:13px">${label} \xB7 ${formatDate(from)} a ${formatDate(to)}</td></tr>
<tr><td style="padding:20px 24px">
<p style="margin:0 0 12px;color:#3f3a33">Ol\xE1! Segue o resumo financeiro de <strong>${label}</strong>. O relat\xF3rio completo (Excel) vai em anexo.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3dacd;border-collapse:collapse;font-size:14px">
${kpi("Entrou", s.income, "#15803d")}
${kpi("Saiu", s.expense, "#b91c1c")}
${kpi(s.result >= 0 ? "Sobrou" : "Faltou", s.result, s.result >= 0 ? "#15803d" : "#b91c1c", true)}
${data.reservePercent ? kpi(`Guardado para impostos/caixa (${data.reservePercent}%)`, d.reserve) : ""}
${kpi("Para dividir pela equipa", d.distributable, "#3f3a33", true)}
</table>
${d.shares.length ? `<p style="margin:20px 0 6px;color:#c0392b;font-weight:700;text-transform:uppercase;font-size:13px">Quanto cabe a cada um</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3dacd;border-collapse:collapse;font-size:14px">
<tr><th style="${th}">Membro</th><th style="${th};text-align:right">Parte</th><th style="${th};text-align:right">Cabe-lhe</th><th style="${th};text-align:right">Falta pagar</th></tr>
${members}</table>` : ""}
${s.pendingIncome || s.pendingExpense ? `<p style="margin:16px 0 0;color:#7a7268;font-size:13px">Ainda por receber neste per\xEDodo: ${formatEUR(s.pendingIncome)} \xB7 por pagar: ${formatEUR(s.pendingExpense)}.</p>` : ""}
${overdueHtml}
<p style="margin:24px 0 0"><a href="${panelUrl}" style="background:#c0392b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Abrir o painel de Finan\xE7as</a></p>
</td></tr>
<tr><td style="padding:12px 24px;border-top:1px solid #e3dacd;color:#7a7268;font-size:12px">Enviado automaticamente no dia 1 de cada m\xEAs pelo painel admin da Olha que Duas. S\xF3 contam os movimentos marcados como pagos.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    `Olha que Duas \u2014 Relat\xF3rio financeiro de ${label} (${formatDate(from)} a ${formatDate(to)})`,
    "",
    `Entrou: ${formatEUR(s.income)}`,
    `Saiu: ${formatEUR(s.expense)}`,
    `${s.result >= 0 ? "Sobrou" : "Faltou"}: ${formatEUR(s.result)}`,
    ...data.reservePercent ? [`Guardado (${data.reservePercent}%): ${formatEUR(d.reserve)}`] : [],
    `Para dividir pela equipa: ${formatEUR(d.distributable)}`,
    "",
    ...d.shares.map((m) => `- ${m.member.name} (${String(m.member.share_percent).replace(".", ",")}%): ${formatEUR(m.due)} \u2014 falta pagar ${formatEUR(m.balance)}`),
    ...overdue.length ? ["", "Em atraso:", ...overdue.map((t) => `- ${t.description}: ${formatEUR(t.amount)} (${formatDate(t.tx_date)})`)] : [],
    "",
    `Relat\xF3rio completo em anexo. Painel: ${panelUrl}`
  ].join("\n");
  return { subject, html, text };
}
export {
  buildFinanceWorkbook,
  buildReportEmail,
  normalizeFinanceData,
  previousMonth,
  reportFileName,
  shiftPeriod
};
