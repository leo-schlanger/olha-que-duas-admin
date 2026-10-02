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
function occurrenceDate(start, frequency, n) {
  const [y, m, d] = start.split("-").map(Number);
  let date;
  if (frequency === "weekly") {
    date = new Date(Date.UTC(y, m - 1, d + 7 * n));
  } else {
    const months = frequency === "monthly" ? n : 12 * n;
    const targetMonth = m - 1 + months;
    const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
    date = new Date(Date.UTC(y, targetMonth, Math.min(d, lastDay)));
  }
  return date.toISOString().slice(0, 10);
}
var nextOccurrence = (r) => occurrenceDate(r.start_date, r.frequency, r.generated_count);
function nextDue(r, txs) {
  const pending = txs.filter((t) => t.recurrence_id === r.id && t.status === "pending").map((t) => t.tx_date).sort();
  return pending[0] ?? nextOccurrence(r);
}
var WEEKDAY_PLURAL = [
  "domingos",
  "segundas-feiras",
  "ter\xE7as-feiras",
  "quartas-feiras",
  "quintas-feiras",
  "sextas-feiras",
  "s\xE1bados"
];
var weekdayOfDate = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};
function repeatLabel(frequency, startDate) {
  const [, m, d] = startDate.split("-");
  if (frequency === "weekly") {
    const wd = weekdayOfDate(startDate);
    return `${wd === 0 || wd === 6 ? "todos os" : "todas as"} ${WEEKDAY_PLURAL[wd]}`;
  }
  if (frequency === "monthly") return `todos os meses, ao dia ${Number(d)}`;
  return `todos os anos, a ${d}/${m}`;
}
function monthlyEquivalent(r) {
  if (r.frequency === "weekly") return r.amount * 52 / 12;
  if (r.frequency === "yearly") return r.amount / 12;
  return r.amount;
}
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
var EUR = '#,##0.00 "\u20AC";[Red]-#,##0.00 "\u20AC";"\u2014"';
var EUR_SIGNED = '+#,##0.00 "\u20AC";[Red]-#,##0.00 "\u20AC";"\u2014"';
var PCT = '0.0%;[Red]-0.0%;"\u2014"';
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
var NUMFMT = {
  eur: EUR,
  eurSigned: EUR_SIGNED,
  date: DATE,
  pct: PCT,
  int: "0"
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
var eurText = (n) => formatEUR(n).replace(/\u00a0/g, " ");
function styleHeaderCell(c) {
  c.font = { name: FONT, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  c.fill = fill(BRAND);
  c.alignment = { vertical: "middle", wrapText: true };
  c.border = boxBorder;
}
function table(ws, startRow, columns, rows, opts = {}) {
  const header = ws.getRow(startRow);
  columns.forEach((col, i) => {
    const c = header.getCell(i + 1);
    c.value = col.header;
    styleHeaderCell(c);
    c.alignment = { ...alignFor(col.type), wrapText: true };
  });
  header.height = 22;
  if (rows.length === 0) {
    const r = startRow + 1;
    ws.mergeCells(`A${r}:${colLetter(columns.length)}${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = opts.emptyText ?? "Sem registos neste per\xEDodo.";
    c.font = { name: FONT, size: 10, italic: true, color: { argb: MUTED } };
    c.border = boxBorder;
    return r + 2;
  }
  rows.forEach((row, idx) => {
    const r = ws.getRow(startRow + 1 + idx);
    columns.forEach((col, i) => {
      const c = r.getCell(i + 1);
      c.value = col.value(row);
      c.font = { name: FONT, size: 10, color: { argb: col.color?.(row) ?? INK } };
      c.border = boxBorder;
      c.alignment = alignFor(col.type, true);
      if (idx % 2 === 1) c.fill = fill(ZEBRA);
      const fmt = col.type ? NUMFMT[col.type] : void 0;
      if (fmt) c.numFmt = fmt;
    });
  });
  const first = startRow + 1;
  const last = startRow + rows.length;
  let next = last + 1;
  if (columns.some((c) => c.total)) {
    const tr = ws.getRow(next);
    columns.forEach((col, i) => {
      const c = tr.getCell(i + 1);
      const L = colLetter(i + 1);
      if (i === 0) c.value = opts.totalLabel ?? "Total";
      else if (col.total) c.value = { formula: `SUBTOTAL(9,${L}${first}:${L}${last})` };
      c.alignment = i === 0 ? alignFor("text") : alignFor(col.type);
      c.font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      c.fill = fill(SOFT);
      c.border = { top: { style: "medium", color: { argb: INK } }, bottom: thin, left: thin, right: thin };
      const fmt = col.type ? NUMFMT[col.type] : void 0;
      if (fmt && col.total) c.numFmt = fmt;
    });
    tr.height = 20;
    next += 1;
  }
  if (opts.filter) {
    ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: last, column: columns.length } };
    ws.views = [{ state: "frozen", ySplit: startRow, showGridLines: false }];
  }
  return next + 1;
}
var statusLabel = (t) => t.status === "paid" ? "Pago" : isOverdue(t) ? "Em atraso" : t.tx_date > lisbonToday() ? "Previsto" : "Hoje";
var statusColor = (t) => t.status === "paid" ? GREEN : isOverdue(t) ? RED : void 0;
async function buildFinanceWorkbook(data, period) {
  const { default: ExcelJS } = await Promise.resolve({ default: __ExcelJS });
  const wb = new ExcelJS.Workbook();
  wb.creator = "Olha que Duas \u2014 Painel Admin";
  wb.created = /* @__PURE__ */ new Date();
  const label = cap(periodLabel(period));
  const prev = shiftPeriod(period, -1);
  const prevLabel = cap(periodLabel(prev));
  const { from, to } = periodRange(period);
  const today = lisbonToday();
  const subtitle = `Per\xEDodo: ${label} (${formatDate(from)} a ${formatDate(to)})  \xB7  Gerado em ${formatDate(today)}`;
  const catName = (id) => data.categories.find((c) => c.id === id)?.name ?? "Sem categoria";
  const clientName = (id) => data.clients.find((c) => c.id === id)?.name ?? "";
  const summary = computeSummary(data.transactions, data.categories, data.clients, period);
  const prevSummary = computeSummary(data.transactions, data.categories, data.clients, prev);
  const dist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const prevDist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, prev);
  const inP = data.transactions.filter((t) => inPeriod(t.tx_date, period)).sort((a, b) => a.tx_date.localeCompare(b.tx_date));
  const ws = wb.addWorksheet("Resumo", { properties: { tabColor: { argb: BRAND } } });
  setupSheet(ws, [38, 17, 17, 15, 52], false, `Relat\xF3rio financeiro \u2014 ${label}`);
  let r = titleBlock(ws, 5, "Olha que Duas \u2014 Relat\xF3rio Financeiro", subtitle);
  const overdueAll = data.transactions.filter((t) => t.kind === "income" && isOverdue(t));
  const overdueSum = overdueAll.reduce((a, t) => a + t.amount, 0);
  const sentences = [
    `Em ${periodLabel(period)} entraram ${eurText(summary.income)} e sa\xEDram ${eurText(summary.expense)}. ${summary.result >= 0 ? "Sobraram" : "Faltaram"} ${eurText(Math.abs(summary.result))}.`,
    dist.distributable > 0 && dist.shares.length ? `Para dividir pela equipa: ${eurText(dist.distributable)}` + (data.reservePercent ? ` (depois de guardar ${data.reservePercent}% para impostos/caixa).` : ".") : "Neste per\xEDodo n\xE3o h\xE1 valor para dividir pela equipa.",
    (summary.pendingIncome > 0 ? `Ainda falta receber ${eurText(summary.pendingIncome)} deste per\xEDodo. ` : "") + (overdueAll.length ? `Aten\xE7\xE3o: ${overdueAll.length} pagamento(s) de clientes em atraso (${eurText(overdueSum)}).` : "N\xE3o h\xE1 pagamentos de clientes em atraso.")
  ];
  r = sectionTitle(ws, r, 5, "Em poucas palavras");
  sentences.forEach((text, idx) => {
    ws.mergeCells(`A${r}:E${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text;
    c.font = { name: FONT, size: 12, bold: idx === 0, color: { argb: idx === 2 && overdueAll.length ? RED : INK } };
    c.alignment = { wrapText: true, vertical: "middle", indent: 1 };
    c.fill = fill(SOFT);
    ws.getRow(r).height = 30;
    r += 1;
  });
  r += 1;
  r = sectionTitle(
    ws,
    r,
    5,
    "Os n\xFAmeros",
    'S\xF3 conta o que j\xE1 foi pago ou recebido. "Diferen\xE7a" compara com o per\xEDodo anterior.'
  );
  const kpiHeader = ws.getRow(r);
  ["", label, prevLabel, "Diferen\xE7a", "O que \xE9"].forEach((h, i) => {
    const c = kpiHeader.getCell(i + 1);
    c.value = h;
    styleHeaderCell(c);
    c.alignment = { ...alignFor(i >= 1 && i <= 3 ? "eur" : "text"), wrapText: true };
  });
  kpiHeader.height = 22;
  r += 1;
  const kpis = [
    ["Entrou", summary.income, prevSummary.income, "Dinheiro recebido de clientes e outras fontes."],
    ["Saiu", summary.expense, prevSummary.expense, "Despesas pagas (servidores, ferramentas, etc.)."],
    [summary.result >= 0 ? "Sobrou" : "Faltou", summary.result, prevSummary.result, "Entrou menos saiu.", true],
    ...data.reservePercent ? [[`Guardado (${data.reservePercent}%)`, dist.reserve, prevDist.reserve, "Fica na conta para impostos e imprevistos."]] : [],
    ["Para dividir pela equipa", dist.distributable, prevDist.distributable, "Dividido pelas partes de cada membro (ver abaixo).", true]
  ];
  kpis.forEach(([name, cur, before, explain, strong], idx) => {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = cur;
    row.getCell(3).value = before;
    row.getCell(4).value = { formula: `B${r}-C${r}` };
    row.getCell(5).value = explain;
    for (let i = 1; i <= 5; i++) {
      const c = row.getCell(i);
      c.border = boxBorder;
      c.font = { name: FONT, size: i === 5 ? 9 : 11, bold: !!strong && i <= 2 || i === 1, color: { argb: i === 5 ? MUTED : INK } };
      c.alignment = alignFor(i >= 2 && i <= 4 ? "eur" : "text", i === 5);
      if (idx % 2 === 1) c.fill = fill(ZEBRA);
    }
    row.getCell(2).numFmt = EUR;
    row.getCell(3).numFmt = EUR;
    row.getCell(4).numFmt = EUR_SIGNED;
    if (strong) row.getCell(2).font = { name: FONT, size: 12, bold: true, color: { argb: cur >= 0 ? GREEN : RED } };
    row.height = 24;
    r += 1;
  });
  r += 1;
  r = sectionTitle(ws, r, 5, "O que ainda falta");
  const pendingRows = [
    ["Por receber (deste per\xEDodo)", summary.pendingIncome, "Previsto para este per\xEDodo e ainda n\xE3o recebido."],
    ["Por pagar (deste per\xEDodo)", summary.pendingExpense, "Previsto para este per\xEDodo e ainda n\xE3o pago."],
    ["Em atraso (qualquer data)", summary.overdueIncome, 'Clientes que j\xE1 deviam ter pago. Lista na folha "Por receber e pagar".']
  ];
  pendingRows.forEach(([name, value, explain], idx) => {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = value;
    ws.mergeCells(`C${r}:E${r}`);
    row.getCell(3).value = explain;
    for (const i of [1, 2, 3, 4, 5]) {
      const c = row.getCell(i);
      c.border = boxBorder;
      c.font = { name: FONT, size: i >= 3 ? 9 : 11, color: { argb: i >= 3 ? MUTED : INK } };
      c.alignment = alignFor(i === 2 ? "eur" : "text", i >= 3);
      if (idx % 2 === 1) c.fill = fill(ZEBRA);
    }
    row.getCell(2).numFmt = EUR;
    if (idx === 2 && value > 0) row.getCell(2).font = { name: FONT, size: 11, bold: true, color: { argb: RED } };
    row.height = 24;
    r += 1;
  });
  r += 1;
  r = sectionTitle(
    ws,
    r,
    5,
    "Quanto cabe a cada um",
    '"Falta pagar" \xE9 o que ainda n\xE3o foi transferido a cada membro referente a este per\xEDodo.'
  );
  r = table(ws, r, [
    { header: "Membro", width: 0, value: (x) => x.member.name },
    { header: "Parte", width: 0, type: "pct", value: (x) => x.member.share_percent / 100 },
    { header: "Cabe-lhe", width: 0, type: "eur", total: true, value: (x) => x.due },
    { header: "J\xE1 pago", width: 0, type: "eur", total: true, value: (x) => x.paid },
    {
      header: "Falta pagar",
      width: 0,
      type: "eur",
      total: true,
      value: (x) => x.balance,
      color: (x) => x.balance > 0 ? RED : void 0
    }
  ], dist.shares, { emptyText: "Sem membros registados no separador Equipa." });
  const activeRec = data.recurrences.filter((x) => x.is_active);
  r = sectionTitle(ws, r, 5, "Acordos e custos fixos em curso");
  r = table(ws, r, [
    { header: "O qu\xEA", width: 0, value: (x) => {
      const c = clientName(x.client_id);
      return c && !x.description.includes(c) ? `${x.description} \u2014 ${c}` : x.description;
    } },
    { header: "Tipo", width: 0, value: (x) => x.kind === "income" ? "Entra" : "Sai", color: (x) => x.kind === "income" ? GREEN : RED },
    { header: "Valor", width: 0, type: "eur", value: (x) => x.amount },
    { header: "Pr\xF3xima", width: 0, type: "date", value: (x) => xlDate(nextDue(x, data.transactions)) },
    { header: "Quando", width: 0, value: (x) => cap(repeatLabel(x.frequency, x.start_date)) }
  ], activeRec, { emptyText: "Sem acordos nem custos fixos ativos." });
  const share = (total, part) => total ? part / total : 0;
  r = sectionTitle(ws, r, 5, "De onde veio o dinheiro (por cliente)");
  r = table(ws, r, [
    { header: "Cliente", width: 0, value: (c) => c.name },
    { header: "Valor", width: 0, type: "eur", total: true, value: (c) => c.total },
    { header: "% do total", width: 0, type: "pct", value: (c) => share(summary.income, c.total) }
  ], summary.incomeByClient, { emptyText: "Sem receitas recebidas neste per\xEDodo." });
  r = sectionTitle(ws, r, 5, "Para onde foi o dinheiro (por categoria)");
  r = table(ws, r, [
    { header: "Categoria", width: 0, value: (c) => c.name },
    { header: "Valor", width: 0, type: "eur", total: true, value: (c) => c.total },
    { header: "% do total", width: 0, type: "pct", value: (c) => share(summary.expense, c.total) }
  ], summary.expenseByCategory, { emptyText: "Sem despesas pagas neste per\xEDodo." });
  r = sectionTitle(ws, r, 5, "Como ler este relat\xF3rio");
  const notes = [
    "Valores em euros. Cada movimento conta no per\xEDodo da sua data.",
    'A folha "Movimentos" \xE9 como um extrato: uma linha por movimento, com o que entrou e o que saiu.',
    "Os filtros no cabe\xE7alho das tabelas permitem ver s\xF3 um cliente ou s\xF3 o que est\xE1 por pagar; os totais acompanham.",
    "Comprovativos e faturas est\xE3o no painel admin (Finan\xE7as), em cada movimento."
  ];
  notes.forEach((n) => {
    ws.mergeCells(`A${r}:E${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = `\u2022  ${n}`;
    c.font = { name: FONT, size: 9, color: { argb: MUTED } };
    c.alignment = { wrapText: true, vertical: "top" };
    ws.getRow(r).height = 18;
    r += 1;
  });
  {
    const s = wb.addWorksheet("Movimentos", { properties: { tabColor: { argb: GREEN } } });
    const cols = [
      { header: "Data", width: 12, type: "date", value: (t) => xlDate(t.tx_date) },
      { header: "O qu\xEA", width: 34, value: (t) => t.description },
      { header: "Cliente", width: 22, value: (t) => clientName(t.client_id) },
      { header: "Categoria", width: 22, value: (t) => t.category_id ? catName(t.category_id) : "" },
      {
        header: "Entrou",
        width: 14,
        type: "eur",
        total: true,
        value: (t) => t.kind === "income" ? t.amount : null,
        color: () => GREEN
      },
      {
        header: "Saiu",
        width: 14,
        type: "eur",
        total: true,
        value: (t) => t.kind === "expense" ? t.amount : null,
        color: () => RED
      },
      { header: "Estado", width: 13, value: statusLabel, color: statusColor },
      { header: "Como", width: 14, value: (t) => t.method ?? "" },
      { header: "Fatura / recibo", width: 16, value: (t) => t.invoice_ref ?? "" },
      { header: "Notas", width: 34, value: (t) => t.notes ?? "" }
    ];
    setupSheet(s, cols.map((c) => c.width), true, `Movimentos \u2014 ${label}`);
    let row = titleBlock(
      s,
      cols.length,
      `Movimentos \u2014 ${label}`,
      `${subtitle}  \xB7  Como um extrato: inclui o que j\xE1 foi pago e o que est\xE1 previsto (ver coluna Estado).`
    );
    const firstData = row + 1;
    row = table(s, row, cols, inP, {
      totalLabel: "Total (linhas vis\xEDveis)",
      filter: true,
      emptyText: "Sem movimentos neste per\xEDodo."
    });
    if (inP.length) {
      const lastData = firstData + inP.length - 1;
      const paidOnly = (col) => `SUMIFS(${col}${firstData}:${col}${lastData},G${firstData}:G${lastData},"Pago")`;
      const lines = [
        ["J\xE1 pago \u2014 entrou", paidOnly("E"), GREEN],
        ["J\xE1 pago \u2014 saiu", paidOnly("F"), RED],
        ["J\xE1 pago \u2014 sobrou", `${paidOnly("E")}-${paidOnly("F")}`]
      ];
      for (const [lbl, formula, color] of lines) {
        const rr = s.getRow(row);
        s.mergeCells(`B${row}:D${row}`);
        rr.getCell(2).value = lbl;
        rr.getCell(2).alignment = { horizontal: "right", indent: 1 };
        rr.getCell(2).font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
        rr.getCell(5).value = { formula };
        rr.getCell(5).numFmt = EUR;
        rr.getCell(5).alignment = alignFor("eur");
        rr.getCell(5).font = { name: FONT, size: 11, bold: true, color: { argb: color ?? INK } };
        row += 1;
      }
    }
  }
  {
    const s = wb.addWorksheet("Por receber e pagar", { properties: { tabColor: { argb: "FFD97706" } } });
    const pending = data.transactions.filter((t) => t.status === "pending").sort((a, b) => a.tx_date.localeCompare(b.tx_date));
    const daysLate = (t) => Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${t.tx_date}T00:00:00Z`)) / 864e5));
    const cols = [
      { header: "Data prevista", width: 13, type: "date", value: (t) => xlDate(t.tx_date) },
      {
        header: "Tipo",
        width: 11,
        value: (t) => t.kind === "income" ? "A receber" : "A pagar",
        color: (t) => t.kind === "income" ? GREEN : RED
      },
      { header: "Descri\xE7\xE3o", width: 34, value: (t) => t.description },
      { header: "Cliente", width: 22, value: (t) => clientName(t.client_id) },
      { header: "Estado", width: 12, value: statusLabel, color: statusColor },
      { header: "Dias em atraso", width: 13, type: "int", value: (t) => isOverdue(t) ? daysLate(t) : null },
      { header: "Valor", width: 14, type: "eur", value: (t) => t.amount }
    ];
    setupSheet(s, cols.map((c) => c.width), true, "Por receber e pagar");
    let row = titleBlock(
      s,
      cols.length,
      "Por receber e pagar",
      `Situa\xE7\xE3o em ${formatDate(today)} (todos os previstos ainda n\xE3o pagos, de qualquer per\xEDodo).`
    );
    row = table(s, row, cols, pending, { filter: true, emptyText: "Nada pendente. Tudo em dia." });
    const totalIn = pending.filter((t) => t.kind === "income").reduce((a, t) => a + t.amount, 0);
    const totalOut = pending.filter((t) => t.kind === "expense").reduce((a, t) => a + t.amount, 0);
    for (const [lbl, v, color] of [
      ["Total a receber", totalIn, GREEN],
      ["Total a pagar", totalOut, RED]
    ]) {
      const rr = s.getRow(row);
      rr.getCell(6).value = lbl;
      rr.getCell(6).alignment = { horizontal: "right" };
      rr.getCell(6).font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      rr.getCell(7).value = v;
      rr.getCell(7).numFmt = EUR;
      rr.getCell(7).font = { name: FONT, size: 11, bold: true, color: { argb: color } };
      row += 1;
    }
  }
  {
    const s = wb.addWorksheet("Equipa");
    setupSheet(s, [30, 14, 16, 16, 16, 34], false, `Equipa \u2014 ${label}`);
    let row = titleBlock(s, 6, `Divis\xE3o pela equipa \u2014 ${label}`, subtitle);
    row = sectionTitle(s, row, 6, "Como se chega ao valor");
    const calc = [
      ["Sobrou no per\xEDodo", dist.result, "Entrou \u2212 saiu (s\xF3 o que j\xE1 foi pago)"],
      [`Guardado (${data.reservePercent}%)`, -dist.reserve, "Fica na conta para impostos e imprevistos"],
      ["Para dividir", dist.distributable, "Dividido pelas partes abaixo; m\xEAs com preju\xEDzo n\xE3o gera divis\xE3o"]
    ];
    calc.forEach(([lbl, v, note], idx) => {
      const rr = s.getRow(row);
      rr.getCell(1).value = lbl;
      rr.getCell(2).value = v;
      s.mergeCells(`C${row}:F${row}`);
      rr.getCell(3).value = note;
      for (let i = 1; i <= 6; i++) {
        const c = rr.getCell(i);
        c.border = boxBorder;
        c.font = { name: FONT, size: i >= 3 ? 9 : 11, bold: idx === 2 && i <= 2, color: { argb: i >= 3 ? MUTED : INK } };
        c.alignment = alignFor(i === 2 ? "eur" : "text");
        if (idx === 2) c.fill = fill(SOFT);
      }
      rr.getCell(2).numFmt = EUR;
      rr.height = 22;
      row += 1;
    });
    row += 1;
    row = sectionTitle(s, row, 6, "Quanto cabe a cada um");
    row = table(s, row, [
      { header: "Membro", width: 0, value: (x) => x.member.name },
      { header: "Parte", width: 0, type: "pct", value: (x) => x.member.share_percent / 100 },
      { header: "Cabe-lhe", width: 0, type: "eur", total: true, value: (x) => x.due },
      { header: "J\xE1 pago", width: 0, type: "eur", total: true, value: (x) => x.paid },
      {
        header: "Falta pagar",
        width: 0,
        type: "eur",
        total: true,
        value: (x) => x.balance,
        color: (x) => x.balance > 0 ? RED : void 0
      },
      { header: "Email", width: 0, value: (x) => x.member.email ?? "" }
    ], dist.shares, { emptyText: "Sem membros registados." });
    const payouts = data.payouts.filter((p) => inPeriod(p.period, period)).sort((a, b) => a.paid_at.localeCompare(b.paid_at));
    row = sectionTitle(s, row, 6, "Transfer\xEAncias feitas \xE0 equipa");
    table(s, row, [
      { header: "Membro", width: 0, value: (p) => data.members.find((m) => m.id === p.member_id)?.name ?? "" },
      { header: "Pago em", width: 0, type: "date", value: (p) => xlDate(p.paid_at) },
      { header: "Referente a", width: 0, value: (p) => periodLabel({ type: "month", value: p.period.slice(0, 7) }) },
      { header: "Valor", width: 0, type: "eur", total: true, value: (p) => p.amount },
      { header: "Notas", width: 0, value: (p) => p.notes ?? "" }
    ], payouts, { emptyText: "Ainda n\xE3o foram registados pagamentos \xE0 equipa neste per\xEDodo." });
  }
  {
    const s = wb.addWorksheet("Clientes");
    const cols = [
      { header: "Cliente", width: 26, value: (c) => c.name },
      { header: "NIF", width: 13, value: (c) => c.nif ?? "" },
      { header: "Email", width: 28, value: (c) => c.email ?? "" },
      { header: "Telefone", width: 15, value: (c) => c.phone ?? "" },
      { header: "Ativo", width: 8, value: (c) => c.is_active ? "Sim" : "N\xE3o" },
      {
        header: `Recebido (${label})`,
        width: 25,
        type: "eur",
        total: true,
        value: (c) => summary.incomeByClient.find((x) => x.id === c.id)?.total ?? 0
      },
      {
        header: "Recorrente / m\xEAs",
        width: 17,
        type: "eur",
        total: true,
        value: (c) => Math.round(data.recurrences.filter((rc) => rc.is_active && rc.kind === "income" && rc.client_id === c.id).reduce((a, rc) => a + monthlyEquivalent(rc), 0) * 100) / 100
      },
      { header: "Notas", width: 36, value: (c) => c.notes ?? "" }
    ];
    setupSheet(s, cols.map((c) => c.width), true, "Clientes");
    const row = titleBlock(s, cols.length, "Clientes", subtitle);
    table(s, row, cols, data.clients, { filter: true, emptyText: "Sem clientes registados." });
  }
  {
    const s = wb.addWorksheet("Fixos e acordos");
    const paidOf = (x) => data.transactions.filter((t) => t.recurrence_id === x.id && t.status === "paid").reduce((a, t) => a + t.amount, 0);
    const cols = [
      {
        header: "Tipo",
        width: 9,
        value: (x) => x.kind === "income" ? "Entra" : "Sai",
        color: (x) => x.kind === "income" ? GREEN : RED
      },
      { header: "O qu\xEA", width: 32, value: (x) => x.description },
      { header: "Cliente", width: 20, value: (x) => clientName(x.client_id) },
      { header: "Valor", width: 13, type: "eur", value: (x) => x.amount },
      { header: "Quando", width: 30, value: (x) => cap(repeatLabel(x.frequency, x.start_date)) },
      { header: "Desde", width: 12, type: "date", value: (x) => xlDate(x.start_date) },
      { header: "Pr\xF3xima", width: 12, type: "date", value: (x) => x.is_active ? xlDate(nextDue(x, data.transactions)) : null },
      { header: "\u2248 por m\xEAs", width: 13, type: "eur", value: (x) => Math.round(monthlyEquivalent(x) * 100) / 100 },
      { header: "J\xE1 pago at\xE9 hoje", width: 15, type: "eur", value: (x) => Math.round(paidOf(x) * 100) / 100 },
      { header: "Estado", width: 10, value: (x) => x.is_active ? "Ativo" : "Pausado" }
    ];
    setupSheet(s, cols.map((c) => c.width), true, "Fixos e acordos");
    let row = titleBlock(
      s,
      cols.length,
      "Fixos e acordos (valores que se repetem)",
      '"\u2248 por m\xEAs": semanal \xD7 52 \xF7 12; anual \xF7 12. Cada pagamento aparece como Previsto uma semana antes.'
    );
    row = table(s, row, cols, data.recurrences, { filter: true, emptyText: "Sem fixos nem acordos registados." });
    const active = data.recurrences.filter((x) => x.is_active);
    const mIn = active.filter((x) => x.kind === "income").reduce((a, x) => a + monthlyEquivalent(x), 0);
    const mOut = active.filter((x) => x.kind === "expense").reduce((a, x) => a + monthlyEquivalent(x), 0);
    for (const [lbl, v] of [
      ["Entra por m\xEAs (\u2248)", mIn],
      ["Sai por m\xEAs (\u2248)", -mOut],
      ["Sobra por m\xEAs (\u2248)", mIn - mOut]
    ]) {
      const rr = s.getRow(row);
      s.mergeCells(`E${row}:G${row}`);
      rr.getCell(5).value = lbl;
      rr.getCell(5).alignment = { horizontal: "right", indent: 1 };
      rr.getCell(5).font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      rr.getCell(8).value = Math.round(v * 100) / 100;
      rr.getCell(8).numFmt = EUR_SIGNED;
      rr.getCell(8).alignment = alignFor("eur");
      rr.getCell(8).font = { name: FONT, size: 11, bold: true, color: { argb: v >= 0 ? GREEN : RED } };
      row += 1;
    }
  }
  wb.views = [{ x: 0, y: 0, width: 2e4, height: 12e3, firstSheet: 0, activeTab: 0, visibility: "visible" }];
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
    (m) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #e3dacd">${esc(m.member.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right">${m.member.share_percent}%</td><td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right;font-weight:600">${formatEUR(m.due)}</td><td style="padding:6px 12px;border-bottom:1px solid #e3dacd;text-align:right;color:${m.balance > 0 ? "#b91c1c" : "#15803d"}">${formatEUR(m.balance)}</td></tr>`
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
    ...d.shares.map((m) => `- ${m.member.name} (${m.member.share_percent}%): ${formatEUR(m.due)} \u2014 falta pagar ${formatEUR(m.balance)}`),
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
