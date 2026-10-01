// Relatório financeiro mensal por email (Excel em anexo + resumo no corpo).
//
// Chamado:
//   * pelo pg_cron nos dias 1–3 de cada mês (cabeçalho x-cron-secret); envia o
//     mês anterior uma única vez (fin_settings.report_last_period);
//   * pelo painel ("Enviar agora"), por quem tem acesso às finanças (JWT);
//   * em teste ({ test: true, to: [...], period: "YYYY-MM" }): envia só para `to`
//     com "[Teste]" no assunto e não marca o mês como enviado.
// Envio por SMTP (465) com a conta financeiro@olhaqueduas.com.
//
// Segredos: FIN_REPORT_SECRET, FIN_SMTP_USER, FIN_SMTP_PASS
// O report.bundle.js é gerado com `npm run build:report`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";
import { Buffer } from "node:buffer";
import {
  buildFinanceWorkbook,
  buildReportEmail,
  normalizeFinanceData,
  previousMonth,
  reportFileName,
} from "./report.bundle.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const lisbonToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Método não permitido" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const CRON_SECRET = Deno.env.get("FIN_REPORT_SECRET");
  const SMTP_USER = Deno.env.get("FIN_SMTP_USER");
  const SMTP_PASS = Deno.env.get("FIN_SMTP_PASS");
  if (!SMTP_USER || !SMTP_PASS) return json(500, { error: "FIN_SMTP_USER / FIN_SMTP_PASS não configurados" });

  const body = (await req.json().catch(() => ({}))) as {
    period?: string;
    to?: string[];
    test?: boolean;
  };

  // --- Autorização: cron (segredo) ou utilizador com acesso às finanças
  const isCron = !!CRON_SECRET && req.headers.get("x-cron-secret") === CRON_SECRET;
  if (!isCron) {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "Sessão em falta" });
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: ok, error } = await userClient.rpc("is_finance");
    if (error || ok !== true) return json(403, { error: "Sem acesso às finanças" });
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Envio automático = cron sem "test". Testes (test: true) não contam como enviados.
  const automatic = isCron && !body.test;

  // --- Período: o pedido (manual/teste) ou o mês anterior (automático)
  const period = !automatic && body.period && /^\d{4}-\d{2}$/.test(body.period)
    ? { type: "month" as const, value: body.period }
    : previousMonth(lisbonToday());

  const { data: settings, error: settingsError } = await db
    .from("fin_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (settingsError) return json(500, { error: settingsError.message });

  if (automatic) {
    if (!settings.report_enabled) return json(200, { skipped: "envio automático desligado" });
    if (settings.report_last_period === period.value) return json(200, { skipped: `já enviado (${period.value})` });
  }

  // --- Dados
  const tables = ["fin_transactions", "fin_categories", "fin_clients", "fin_recurrences", "fin_members", "fin_payouts"];
  const results = await Promise.all(tables.map((t) => db.from(t).select("*")));
  const failed = results.find((r) => r.error);
  if (failed?.error) return json(500, { error: failed.error.message });
  const [transactions, categories, clients, recurrences, members, payouts] = results.map((r) => r.data ?? []);
  const data = normalizeFinanceData({
    transactions,
    categories,
    clients,
    recurrences,
    members,
    payouts,
    reservePercent: settings.reserve_percent,
  });

  // --- Destinatários: pedido manual > definições > emails dos membros ativos
  const fromSettings: string[] = settings.report_recipients ?? [];
  const fromMembers = data.members.filter((m) => m.is_active && m.email).map((m) => m.email as string);
  const requested = !automatic && Array.isArray(body.to) ? body.to : null;
  const recipients = [...new Set((requested ?? (fromSettings.length ? fromSettings : fromMembers))
    .map((e) => String(e).trim().toLowerCase())
    .filter((e) => EMAIL_RE.test(e)))];
  if (recipients.length === 0) return json(400, { error: "Sem destinatários (defina-os no separador Equipa)" });

  // --- Relatório + envio
  try {
    const xlsx = await buildFinanceWorkbook(data, period);
    const { subject, html, text } = buildReportEmail(data, period);
    const transporter = nodemailer.createTransport({
      host: "mail.olhaqueduas.com",
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    const info = await transporter.sendMail({
      from: `"Olha que Duas — Financeiro" <${SMTP_USER}>`,
      to: recipients,
      subject: body.test ? `[Teste] ${subject}` : subject,
      text,
      html,
      attachments: [{
        filename: reportFileName(period),
        content: Buffer.from(new Uint8Array(xlsx)),
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }],
    });

    if (!body.test) {
      await db.from("fin_settings").update({
        report_last_period: period.value,
        report_last_sent_at: new Date().toISOString(),
      }).eq("id", 1);
    }
    return json(200, { ok: true, period: period.value, recipients, messageId: info.messageId });
  } catch (err) {
    console.error("finance-monthly-report", err);
    return json(502, { error: err instanceof Error ? err.message : "Falha no envio" });
  }
});
