import { useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { formatDate, periodLabel, type Period } from '../../lib/finance';
import type { FinanceApi } from '../../hooks/useFinance';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Relatório mensal por email: ligar/desligar, destinatários e envio manual. */
export function ReportCard({ api, period }: { api: FinanceApi; period: Period }) {
  const { report, data } = api;
  const memberEmails = data.members.filter((m) => m.is_active && m.email).map((m) => m.email as string);
  const [recipients, setRecipients] = useState(report.recipients.join(', '));
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const parsed = recipients.split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
  const invalid = parsed.filter((e) => !EMAIL_RE.test(e));
  const changed = parsed.join(',') !== report.recipients.join(',');
  const effective = parsed.length ? parsed : memberEmails;

  const send = async () => {
    if (period.type !== 'month') return;
    const label = periodLabel(period);
    if (!window.confirm(`Enviar agora o relatório de ${label} para:\n\n${effective.join('\n')}\n\nO envio automático deste mês fica marcado como feito.`)) return;
    setSending(true);
    setMessage(null);
    const to = await api.sendReportNow(period.value);
    setSending(false);
    if (to) setMessage(`Relatório de ${label} enviado para ${to}.`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-vermelho" /> Relatório mensal por email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Switch
            id="report-enabled"
            checked={report.enabled}
            onCheckedChange={(v) => api.saveReportSettings(v, report.recipients)}
          />
          <label htmlFor="report-enabled" className="text-sm text-charcoal">
            Enviar automaticamente no dia 1 de cada mês o relatório do mês anterior (Excel em anexo e resumo no
            email), a partir de <strong>financeiro@olhaqueduas.com</strong>.
          </label>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="report-to" className="text-sm font-medium text-charcoal">Destinatários</label>
          <div className="flex gap-2">
            <Input
              id="report-to"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder={memberEmails.join(', ') || 'emails separados por vírgula'}
            />
            <Button
              variant="outline"
              disabled={!changed || invalid.length > 0}
              onClick={() => api.saveReportSettings(report.enabled, parsed)}
            >
              Guardar
            </Button>
          </div>
          <p className={`text-xs ${invalid.length ? 'text-red-600' : 'text-muted-foreground'}`}>
            {invalid.length
              ? `Email inválido: ${invalid.join(', ')}`
              : parsed.length
                ? `${parsed.length} destinatário(s).`
                : `Vazio = membros da equipa (${memberEmails.length ? memberEmails.join(', ') : 'sem emails registados'}).`}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-beige-medium">
          <p className="text-xs text-muted-foreground">
            {report.lastPeriod
              ? `Último envio: ${periodLabel({ type: 'month', value: report.lastPeriod })}${report.lastSentAt ? ` (em ${formatDate(report.lastSentAt.slice(0, 10))})` : ''}.`
              : 'Ainda não foi enviado nenhum relatório.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={send}
            disabled={sending || period.type !== 'month' || effective.length === 0}
            title={period.type !== 'month' ? 'Escolha um mês no topo da página' : undefined}
          >
            {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Enviar agora ({period.type === 'month' ? periodLabel(period) : 'escolha um mês'})
          </Button>
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}
      </CardContent>
    </Card>
  );
}
