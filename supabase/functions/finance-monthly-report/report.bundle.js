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
var EUR_SIGNED = '+#,##0.00 "\u20AC";[Red]-#,##0.00 "\u20AC";"\u2014"';
var PCT = "0.00%;[Red]-0.00%;0.00%";
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
  const { from, to } = periodRange(period);
  const today = lisbonToday();
  const subtitle = `${label} (${formatDate(from)} a ${formatDate(to)})  \xB7  Gerado em ${formatDate(today)}`;
  const catName = (id) => data.categories.find((c) => c.id === id)?.name ?? "";
  const clientName = (id) => data.clients.find((c) => c.id === id)?.name ?? "";
  const whatOf = (description, clientId) => {
    const c = clientName(clientId);
    return c && !description.includes(c) ? `${description} \u2014 ${c}` : description;
  };
  const summary = computeSummary(data.transactions, data.categories, data.clients, period);
  const dist = computeDistribution(data.transactions, data.members, data.payouts, data.reservePercent, period);
  const paidInPeriod = data.transactions.filter((t) => t.status === "paid" && inPeriod(t.tx_date, period)).sort((a, b) => a.tx_date.localeCompare(b.tx_date) || (a.kind === "income" ? -1 : 1));
  const ws = wb.addWorksheet("Resumo", { properties: { tabColor: { argb: BRAND } } });
  setupSheet(ws, [40, 18, 18, 18, 30], false, `Relat\xF3rio financeiro \u2014 ${label}`);
  let r = titleBlock(ws, 5, "Olha que Duas \u2014 Relat\xF3rio Financeiro", subtitle);
  const line = (text, opts = {}) => {
    ws.mergeCells(`A${r}:E${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text;
    c.font = { name: FONT, size: opts.size ?? 11, bold: opts.bold, color: { argb: opts.color ?? INK } };
    c.alignment = { wrapText: true, vertical: "middle", indent: 1 };
    if (opts.bg) c.fill = fill(opts.bg);
    ws.getRow(r).height = opts.height ?? 22;
    r += 1;
  };
  const overdueAll = data.transactions.filter((t) => t.kind === "income" && isOverdue(t));
  const overdueSum = overdueAll.reduce((a, t) => a + t.amount, 0);
  r = sectionTitle(ws, r, 5, "Em poucas palavras");
  line(
    `Em ${period.type === "month" ? periodLabel(period).replace(" ", " de ") : `${period.value}`} entraram ${eurText(summary.income)} e sa\xEDram ${eurText(summary.expense)}. ` + (summary.result >= 0 ? `Sobraram ${eurText(summary.result)}.` : `Faltaram ${eurText(-summary.result)} (preju\xEDzo).`),
    { size: 12, bold: true, bg: SOFT, height: 28 }
  );
  line(
    dist.distributable > 0 && dist.shares.length ? `Para dividir pela equipa: ${eurText(dist.distributable)}.` : "Neste per\xEDodo n\xE3o h\xE1 nada para dividir pela equipa.",
    { size: 12, bg: SOFT, height: 26 }
  );
  line(
    overdueAll.length ? `Aten\xE7\xE3o: ${overdueAll.length} pagamento(s) de clientes em atraso, no total de ${eurText(overdueSum)}.` : "Nenhum pagamento de cliente em atraso.",
    { size: 12, bg: SOFT, color: overdueAll.length ? RED : INK, height: 26 }
  );
  r += 1;
  r = sectionTitle(
    ws,
    r,
    5,
    "A conta do per\xEDodo, passo a passo",
    "S\xF3 entra na conta o que j\xE1 foi pago ou recebido. O que ainda est\xE1 previsto aparece mais abaixo."
  );
  const step = (name, value, note, opts = {}) => {
    const row = ws.getRow(r);
    row.getCell(1).value = name;
    row.getCell(2).value = value;
    ws.mergeCells(`C${r}:E${r}`);
    row.getCell(3).value = note;
    for (let i = 1; i <= 5; i++) {
      const c = row.getCell(i);
      c.border = boxBorder;
      if (opts.strong) c.fill = fill(SOFT);
    }
    row.getCell(1).font = { name: FONT, size: 11, bold: opts.strong, color: { argb: INK } };
    row.getCell(1).alignment = alignFor("text");
    row.getCell(2).font = { name: FONT, size: opts.strong ? 12 : 11, bold: opts.strong, color: { argb: opts.color ?? INK } };
    row.getCell(2).numFmt = EUR;
    row.getCell(2).alignment = alignFor("eur");
    row.getCell(3).font = { name: FONT, size: 9, color: { argb: MUTED } };
    row.getCell(3).alignment = alignFor("text", true);
    row.height = 22;
    return r++;
  };
  const rIn = step("Entrou", summary.income, "Tudo o que foi recebido (ver folha Extrato).", { color: GREEN });
  const rOut = step("\u2212  Saiu", summary.expense, "Tudo o que foi pago (ver folha Extrato).", { color: RED });
  step(summary.result >= 0 ? "=  Sobrou" : "=  Faltou", { formula: `B${rIn}-B${rOut}` }, "Entrou menos saiu.", {
    strong: true,
    color: summary.result >= 0 ? GREEN : RED
  });
  if (data.reservePercent > 0) {
    step(`\u2212  Guardado para impostos (${data.reservePercent}%)`, dist.reserve, "Fica na conta antes de dividir.");
  }
  const rDiv = step(
    "=  Para dividir pela equipa",
    dist.distributable,
    period.type === "year" ? "Soma da divis\xE3o de cada m\xEAs; os meses com preju\xEDzo n\xE3o descontam os outros." : summary.result > 0 ? "Este valor \xE9 dividido pelas partes de cada membro." : "M\xEAs com preju\xEDzo: n\xE3o h\xE1 divis\xE3o.",
    { strong: true }
  );
  r += 1;
  const n = dist.shares.length;
  const complete = sharesComplete(dist.totalPercent);
  const allEqual = n > 0 && dist.shares.every((x) => x.member.share_percent === dist.shares[0].member.share_percent);
  r = sectionTitle(
    ws,
    r,
    5,
    "Quanto cabe a cada um",
    allEqual && n > 1 ? `Partes iguais: ${eurText(dist.distributable)} \xF7 ${n} pessoas = ${eurText(dist.distributable / n)} cada` + (dist.shares.some((x) => x.due !== dist.shares[0].due) ? ". Como a divis\xE3o n\xE3o d\xE1 certa ao c\xEAntimo, o \xFAltimo fica com o c\xEAntimo de diferen\xE7a para o total bater certo." : ".") : 'Cada um recebe a sua parte do valor para dividir. "Falta pagar" \xE9 o que ainda n\xE3o foi transferido.'
  );
  const tableStart = r;
  r = table(ws, r, [
    { header: "Membro", width: 0, value: (x) => x.member.name },
    // Parte normalizada: 3 × 33,33% aparece como 33,33% e o total dá 100%.
    {
      header: "Parte",
      width: 0,
      type: "pct",
      total: true,
      value: (x) => complete ? x.member.share_percent / dist.totalPercent : x.member.share_percent / 100
    },
    { header: "Cabe-lhe", width: 0, type: "eur", total: true, value: (x) => x.due },
    { header: "J\xE1 recebeu", width: 0, type: "eur", total: true, value: (x) => x.paid },
    {
      header: "Falta pagar",
      width: 0,
      type: "eur",
      total: true,
      value: (x) => x.balance,
      color: (x) => x.balance > 0 ? RED : GREEN
    }
  ], dist.shares, { emptyText: "Sem membros registados no separador Equipa." });
  if (n > 0) {
    ws.getCell(`C${tableStart + n + 1}`).note = `Deve ser igual a "Para dividir" (c\xE9lula B${rDiv}).`;
  }
  const horizon = addDays(today, 30);
  const upcoming = data.transactions.filter((t) => t.status === "pending" && t.tx_date <= horizon).map((t) => ({ date: t.tx_date, what: whatOf(t.description, t.client_id), amount: t.amount, kind: t.kind, late: isOverdue(t) }));
  for (const rc of data.recurrences.filter((x) => x.is_active)) {
    for (let i = rc.generated_count; i < rc.generated_count + 60; i++) {
      const d = occurrenceDate(rc.start_date, rc.frequency, i);
      if (d > horizon || rc.end_date && d > rc.end_date) break;
      upcoming.push({ date: d, what: whatOf(rc.description, rc.client_id), amount: rc.amount, kind: rc.kind, late: false });
    }
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  r = sectionTitle(
    ws,
    r,
    5,
    `O que vem a seguir (at\xE9 ${formatDate(horizon)})`,
    "Ainda n\xE3o entra na conta acima. Quando acontecer, confirma-se no painel e passa para o Extrato."
  );
  r = table(ws, r, [
    { header: "O qu\xEA", width: 0, value: (x) => x.what },
    { header: "Data", width: 0, type: "date", value: (x) => xlDate(x.date) },
    { header: "Vai entrar", width: 0, type: "eur", total: true, value: (x) => x.kind === "income" ? x.amount : null, color: () => GREEN },
    { header: "Vai sair", width: 0, type: "eur", total: true, value: (x) => x.kind === "expense" ? x.amount : null, color: () => RED },
    { header: "Situa\xE7\xE3o", width: 0, value: (x) => x.late ? "Em atraso" : "Previsto", color: (x) => x.late ? RED : MUTED }
  ], upcoming, { emptyText: "Nada previsto para os pr\xF3ximos 30 dias." });
  const activeRec = data.recurrences.filter((x) => x.is_active);
  r = sectionTitle(ws, r, 5, "Acordos e custos fixos em vigor");
  r = table(ws, r, [
    { header: "O qu\xEA", width: 0, value: (x) => whatOf(x.description, x.client_id) },
    { header: "Valor", width: 0, type: "eur", value: (x) => x.amount, color: (x) => x.kind === "income" ? GREEN : RED },
    { header: "Entra / sai", width: 0, value: (x) => x.kind === "income" ? "Entra" : "Sai", color: (x) => x.kind === "income" ? GREEN : RED },
    { header: "Pr\xF3xima", width: 0, type: "date", value: (x) => xlDate(nextDue(x, data.transactions)) },
    { header: "Quando", width: 0, value: (x) => cap(repeatLabel(x.frequency, x.start_date)) }
  ], activeRec, { emptyText: "Sem acordos nem custos fixos." });
  line("Valores em euros. Comprovativos e faturas est\xE3o no painel admin (Finan\xE7as), em cada movimento.", { size: 9, color: MUTED, height: 18 });
  {
    const s = wb.addWorksheet("Extrato", { properties: { tabColor: { argb: GREEN } } });
    const cols = [
      { header: "Data", width: 12, type: "date", value: (t) => xlDate(t.tx_date) },
      { header: "O qu\xEA", width: 38, value: (t) => whatOf(t.description, t.client_id) },
      { header: "Entrou", width: 14, type: "eur", total: true, value: (t) => t.kind === "income" ? t.amount : null, color: () => GREEN },
      { header: "Saiu", width: 14, type: "eur", total: true, value: (t) => t.kind === "expense" ? t.amount : null, color: () => RED },
      { header: "Saldo do m\xEAs", width: 14, type: "eur", value: () => null },
      { header: "Categoria", width: 24, value: (t) => catName(t.category_id) },
      { header: "Como", width: 13, value: (t) => t.method ?? "" },
      { header: "Fatura / recibo", width: 16, value: (t) => t.invoice_ref ?? "" }
    ];
    setupSheet(s, cols.map((c) => c.width), true, `Extrato \u2014 ${label}`);
    let row = titleBlock(
      s,
      cols.length,
      `Extrato \u2014 ${label}`,
      `${subtitle}  \xB7  S\xF3 o que j\xE1 foi pago ou recebido. "Saldo do m\xEAs" soma linha a linha, como no banco.`
    );
    const header = row;
    row = table(s, row, cols, paidInPeriod, { totalLabel: "Total do per\xEDodo", emptyText: "Nada pago nem recebido neste per\xEDodo." });
    if (paidInPeriod.length) {
      const first = header + 1;
      const last = header + paidInPeriod.length;
      for (let i = first; i <= last; i++) {
        const c = s.getCell(`E${i}`);
        c.value = { formula: i === first ? `N(C${i})-N(D${i})` : `E${i - 1}+N(C${i})-N(D${i})` };
        c.font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
      }
      const total = s.getCell(`E${last + 1}`);
      total.value = { formula: `E${last}` };
      total.numFmt = EUR;
      total.font = { name: FONT, size: 11, bold: true, color: { argb: summary.result >= 0 ? GREEN : RED } };
    }
    s.views = [{ state: "frozen", ySplit: header, showGridLines: false }];
  }
  {
    const s = wb.addWorksheet("Por receber e pagar", { properties: { tabColor: { argb: "FFD97706" } } });
    const pending = data.transactions.filter((t) => t.status === "pending").sort((a, b) => a.tx_date.localeCompare(b.tx_date));
    const daysLate = (t) => Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${t.tx_date}T00:00:00Z`)) / 864e5));
    const cols = [
      { header: "Data", width: 12, type: "date", value: (t) => xlDate(t.tx_date) },
      { header: "O qu\xEA", width: 40, value: (t) => whatOf(t.description, t.client_id) },
      { header: "A receber", width: 14, type: "eur", total: true, value: (t) => t.kind === "income" ? t.amount : null, color: () => GREEN },
      { header: "A pagar", width: 14, type: "eur", total: true, value: (t) => t.kind === "expense" ? t.amount : null, color: () => RED },
      { header: "Situa\xE7\xE3o", width: 14, value: statusLabel, color: statusColor },
      { header: "Dias em atraso", width: 14, type: "int", value: (t) => isOverdue(t) ? daysLate(t) : null }
    ];
    setupSheet(s, cols.map((c) => c.width), true, "Por receber e pagar");
    const row = titleBlock(
      s,
      cols.length,
      "Por receber e pagar",
      `Situa\xE7\xE3o em ${formatDate(today)}: tudo o que ainda n\xE3o foi pago ou recebido, de qualquer m\xEAs.`
    );
    table(s, row, cols, pending, { totalLabel: "Total", emptyText: "Nada pendente. Tudo em dia." });
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
