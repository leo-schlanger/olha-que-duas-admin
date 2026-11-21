import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  Clock,
  Activity,
  Globe,
  Radio,
  RefreshCw,
  Download,
  FileText,
  Headphones,
  TrendingUp,
  Timer,
  Smartphone,
  UserCheck,
  Info,
  AlertTriangle,
  MonitorSmartphone,
  ListTree,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  useAudienceStats,
  type AudienceData,
  type AudienceSeriesPoint,
  type AudienceBySource,
  type AudienceByDevice,
  type AudienceByClient,
  type CollectionHealth,
  type ListenerDevice,
  type AudienceByCountry,
  type HeatmapCell,
  type ProgramPerformance,
  type TopListener,
  type ListenerSource,
} from '../hooks/useAudienceStats';
import { getCountryName } from '../lib/countries';
import { cn } from '../lib/utils';
import { SummaryCard } from '../components/audience/SummaryCard';
import { RetentionCard } from '../components/audience/RetentionCard';
import { useAudienceInsights } from '../components/audience/useAudienceInsights';
import {
  retentionReading,
  strongestSlots,
  summarySentences,
  onWeekday,
  pctChange,
  kpiRows,
  type RetentionReading,
} from '../components/audience/insights';

const CHART_COLORS = {
  vermelho: '#C4302B',
  amarelo: '#D4A843',
};

type PeriodRange = 1 | 7 | 30 | 90;

const periodLabels: Record<PeriodRange, string> = {
  1: 'Hoje',
  7: '7 dias',
  30: '30 dias',
  90: '90 dias',
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const SOURCE_LABELS: Record<ListenerSource, string> = {
  app_android: 'App Olha Que Duas · Android',
  app_ios: 'App Olha Que Duas · iPhone',
  browser: 'Browser (site e diretórios web)',
  mytuner: 'myTuner',
  ios: 'iPhone/iPad (Safari e outras apps)',
  outras_apps: 'Outras apps e players',
  bot: 'Bots',
};

const SOURCE_COLORS: Record<ListenerSource, string> = {
  app_android: '#C4302B',
  app_ios: '#8B1E1A',
  browser: '#D4A843',
  mytuner: '#6366f1',
  ios: '#22c55e',
  outras_apps: '#94a3b8',
  bot: '#cbd5e1',
};

const DEVICE_LABELS: Record<ListenerDevice, string> = {
  telemovel: 'Telemóvel / tablet',
  computador: 'Computador',
  outro: 'Outros (colunas, TV, players)',
};

const DEVICE_COLORS: Record<ListenerDevice, string> = {
  telemovel: '#C4302B',
  computador: '#D4A843',
  outro: '#94a3b8',
};

// Uma execução do cron a cada 5 min: sem fotografia há 20 min = recolha parada
const STALE_COLLECTION_MINUTES = 20;

// --- Formatação ---

const nf = (value: number, digits = 0) =>
  value.toLocaleString('pt-PT', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const plural = (n: number, singular: string, pluralForm: string) => `${nf(n)} ${n === 1 ? singular : pluralForm}`;

function formatMinutes(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  return `${nf(minutes, minutes < 10 ? 1 : 0)} min`;
}

function formatPercent(ratio: number | null, digits = 0): string {
  if (ratio == null) return '—';
  return `${nf(ratio * 100, digits)}%`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Lisbon',
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}

// --- Componentes ---

function Delta({
  current,
  previous,
  periodLabel,
  prevComplete = true,
}: {
  current: number;
  previous: number | null;
  periodLabel: string;
  prevComplete?: boolean;
}) {
  if (!prevComplete || previous == null || (current === 0 && previous === 0)) return null;
  const label = periodLabel === 'Hoje' ? 'vs ontem' : 'vs período anterior';

  if (previous === 0) {
    return <p className="text-xs text-green-600 mt-1">sem dados antes · {label}</p>;
  }

  // Same rounding as the summary sentences (pctChange on unrounded values)
  const change = pctChange(current, previous) ?? 0;
  const up = change >= 0;
  return (
    <p className={cn('text-xs mt-1', up ? 'text-green-600' : 'text-red-500')}>
      {up ? '▲' : '▼'} {Math.abs(change)}% {label}
    </p>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  hint,
  children,
}: {
  title: string;
  value: string;
  icon: typeof Users;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="bg-cream border-beige-medium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground font-medium" title={hint}>{title}</p>
            <p className="text-3xl font-bold text-charcoal mt-1 tabular-nums">{value}</p>
            {children}
          </div>
          <div className="w-10 h-10 rounded-xl bg-vermelho/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-vermelho" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Failed block: says so (never "empty"); 401/expired session gets its own text.
function BlockError({ message }: { message: string }) {
  const expired = /jwt|token|401|PGRST30|permission denied/i.test(message);
  return (
    <div className="text-sm text-destructive text-center py-8 px-2">
      <p>
        {expired
          ? 'Sem acesso a estes números: a sessão pode ter expirado. Sai do painel e volta a entrar.'
          : 'Não foi possível carregar este bloco. Carrega em «Atualizar»; se continuar, avisa o Leo.'}
      </p>
      <p className="text-xs opacity-75 mt-1 break-words">Detalhe técnico: {message}</p>
    </div>
  );
}

function BlockEmpty({ error, message }: { error?: string; message: string }) {
  return error ? <BlockError message={error} /> : <EmptyState message={message} />;
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground text-center py-8">{message}</p>;
}

function SectionCard({
  title,
  icon: Icon,
  aside,
  children,
}: {
  title: string;
  icon: typeof Users;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold text-charcoal">
          <Icon className="w-4 h-4 text-vermelho" />
          {title}
          {aside && <span className="ml-auto text-xs text-muted-foreground font-normal">{aside}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SeriesChart({ data, hourly, error }: { data: AudienceSeriesPoint[]; hourly: boolean; error?: string }) {
  const hasData = !error && data.some((p) => p.listeners > 0 || p.listening_hours > 0);

  return (
    <SectionCard
      title={hourly ? 'Ouvintes e horas ouvidas por hora' : 'Ouvintes e horas ouvidas por dia'}
      icon={TrendingUp}
      aside="Hora de Lisboa"
    >
      {!hasData ? (
        <BlockEmpty error={error} message="Sem ouvintes neste período" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
            <XAxis dataKey="bucket_label" tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e5ddd0' }} interval="preserveStartEnd" />
            <YAxis yAxisId="listeners" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis yAxisId="hours" orientation="right" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d2d2d', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              labelStyle={{ color: '#ccc' }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === 'Horas ouvidas') return [`${nf(v, 1)} h`, name];
                return [nf(v), name];
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar yAxisId="listeners" dataKey="listeners" name="Ouvintes" fill={CHART_COLORS.vermelho} radius={[3, 3, 0, 0]} />
            <Line yAxisId="hours" dataKey="listening_hours" name="Horas ouvidas" stroke={CHART_COLORS.amarelo} strokeWidth={2} dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

function SourcesCard({ data, error }: { data: AudienceBySource[]; error?: string }) {
  return (
    <SectionCard title="De onde ouvem" icon={Smartphone} aside="por horas ouvidas">
      {error || data.length === 0 ? (
        <BlockEmpty error={error} message="Sem ligações neste período" />
      ) : (
        <div className="space-y-4">
          {data.map((row) => (
            <div key={row.source} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="font-medium text-charcoal">{SOURCE_LABELS[row.source] ?? row.source}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {plural(row.listeners, 'ouvinte', 'ouvintes')} · {nf(row.listening_hours, 1)} h · {formatPercent(row.hours_share)}
                </span>
              </div>
              <div className="h-2 bg-beige-medium rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(row.hours_share * 100, row.hours_share > 0 ? 1 : 0)}%`, backgroundColor: SOURCE_COLORS[row.source] ?? '#94a3b8' }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {plural(row.sessions, 'sessão', 'sessões')}
                {row.avg_session_minutes != null && <> · sessão média {formatMinutes(row.avg_session_minutes)}</>}
                {row.short_connections > 0 && <> · {plural(row.short_connections, 'ligação', 'ligações')} com menos de 1 min</>}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function HeatmapChart({ data, error }: { data: HeatmapCell[]; error?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bestHour = strongestSlots(data)?.hour ?? null;

  // On narrow screens the table scrolls: open it around the strongest hour, not at 00h.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || bestHour == null || el.scrollWidth <= el.clientWidth) return;
    const cell = el.querySelector<HTMLElement>(`[data-hour="${bestHour}"]`);
    if (cell) el.scrollLeft = Math.max(0, cell.offsetLeft - el.clientWidth / 2 + cell.offsetWidth / 2);
  }, [bestHour, data]);

  if (error || data.length === 0) {
    return (
      <SectionCard title="Quando ouvem" icon={Clock}>
        <BlockEmpty error={error} message="Sem fotografias de ouvintes neste período" />
      </SectionCard>
    );
  }

  const maxListeners = Math.max(...data.map((d) => d.avg_listeners), 0.01);
  const cells = new Map(data.map((d) => [`${d.day_of_week}-${d.hour_of_day}`, d.avg_listeners]));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getHeatColor = (value: number) => {
    const intensity = value / maxListeners;
    if (value <= 0) return 'bg-gray-50 text-gray-300';
    if (intensity >= 0.8) return 'bg-red-600 text-white';
    if (intensity >= 0.6) return 'bg-red-400 text-white';
    if (intensity >= 0.4) return 'bg-orange-400 text-white';
    if (intensity >= 0.2) return 'bg-yellow-300 text-charcoal';
    return 'bg-yellow-100 text-charcoal';
  };

  const best = strongestSlots(data);

  return (
    <SectionCard title="Quando ouvem" icon={Clock} aside="Hora de Lisboa">
      <p className="text-xs text-muted-foreground mb-3">
        Cada quadrado mostra quantas pessoas estavam a ouvir ao mesmo tempo, em média, naquele dia da semana e hora.
        Quanto mais escuro, mais gente.
        {best && (
          <>
            {' '}A hora mais forte é <strong className="text-charcoal">{onWeekday(best.hourDay)}, às {String(best.hour).padStart(2, '0')}h</strong>.
          </>
        )}
      </p>
      <div ref={scrollRef} className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-cream text-left py-1 px-1 text-xs text-muted-foreground w-10" />
              {hours.map((h) => (
                <th key={h} data-hour={h} className="text-center py-1 px-0.5 text-[10px] text-muted-foreground">
                  {h.toString().padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
              <tr key={dow}>
                <td className="sticky left-0 z-10 bg-cream py-0.5 px-1 text-xs font-medium text-charcoal">{DAY_NAMES[dow]}</td>
                {hours.map((hour) => {
                  const val = cells.get(`${dow}-${hour}`) ?? 0;
                  return (
                    <td key={hour} className="py-0.5 px-0.5">
                      <div
                        className={cn('w-full h-6 rounded-sm flex items-center justify-center text-[9px] font-medium', getHeatColor(val))}
                        title={`${DAY_NAMES[dow]} ${hour}h: ${nf(val, 2)} pessoas a ouvir em média`}
                      >
                        {val >= 0.05 ? nf(val, 1) : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function ProgramsCard({ data, error }: { data: ProgramPerformance[]; error?: string }) {
  return (
    <SectionCard title="Audiência por programa" icon={Radio} aside="Grelha atual cruzada com as ligações">
      {error || data.length === 0 ? (
        <BlockEmpty error={error} message="Sem blocos na grelha para este período" />
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            «Média» = quantas pessoas estavam a ouvir, em média, durante o programa; conta também ligações de segundos que
            as fotografias de 5 em 5 minutos não apanham, por isso pode ficar um pouco acima do «Máximo». Com tão poucos
            ouvintes, uma pessoa a mais muda a ordem. Programas que se sobrepõem (um evento dentro de um bloco) contam as
            mesmas horas.
          </p>
          {/* Phone: one line per program instead of a table that scrolls sideways */}
          <ul className="sm:hidden divide-y divide-beige-medium/60">
            {data.map((p) => (
              <li key={`m-${p.kind}-${p.program}-${p.schedule_label}`} className="py-2.5 min-w-0">
                <p className="text-sm font-medium text-charcoal break-words">
                  {p.program}
                  {p.kind === 'evento' && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-vermelho bg-vermelho/10 px-1.5 py-0.5 rounded">evento</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  {p.schedule_label} · {plural(p.occurrences, 'emissão', 'emissões')}
                </p>
                <p className="text-xs text-charcoal tabular-nums mt-0.5">
                  Média {p.avg_listeners == null ? '—' : nf(p.avg_listeners, 1)} · Máximo {nf(p.peak_listeners)} ·{' '}
                  {plural(p.listeners, 'ouvinte', 'ouvintes')} · {nf(p.hours_per_occurrence, 2)} h/emissão
                </p>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-beige-medium">
                <th className="text-left py-2 pr-2 font-medium">Programa</th>
                <th className="text-left py-2 px-2 font-medium">Horário</th>
                <th className="text-right py-2 px-2 font-medium" title="Pessoas a ouvir em média durante o programa">Média</th>
                <th className="text-right py-2 px-2 font-medium" title="Máximo de pessoas a ouvir ao mesmo tempo">Máximo</th>
                <th className="text-right py-2 px-2 font-medium" title="Ouvintes distintos com pelo menos 1 minuto">Ouvintes</th>
                <th className="text-right py-2 pl-2 font-medium" title="Horas ouvidas por emissão">Horas/emissão</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={`${p.kind}-${p.program}-${p.schedule_label}`} className="border-b border-beige-medium/50 last:border-0">
                  <td className="py-2 pr-2">
                    <span className="font-medium text-charcoal">{p.program}</span>
                    {p.kind === 'evento' && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-vermelho bg-vermelho/10 px-1.5 py-0.5 rounded">evento</span>
                    )}
                    <span className="block text-[11px] text-muted-foreground">{plural(p.occurrences, 'emissão', 'emissões')}</span>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">{p.schedule_label}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{p.avg_listeners == null ? '—' : nf(p.avg_listeners, 1)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{nf(p.peak_listeners)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{nf(p.listeners)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{nf(p.hours_per_occurrence, 2)} h</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function CountriesCard({ data, error }: { data: AudienceByCountry[]; error?: string }) {
  const max = Math.max(...data.map((d) => d.listeners), 1);
  return (
    <SectionCard title="Países" icon={Globe}>
      {error || data.length === 0 ? (
        <BlockEmpty error={error} message="Sem dados de localização" />
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.map((item) => (
            <div key={item.country} className="space-y-1">
              <div className="flex items-center justify-between text-sm gap-3">
                <span className="font-medium text-charcoal">{getCountryName(item.country)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {plural(item.listeners, 'ouvinte', 'ouvintes')} · {nf(item.listening_hours, 1)} h
                </span>
              </div>
              <div className="h-2 bg-beige-medium rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-vermelho" style={{ width: `${(item.listeners / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function TopListenersCard({ data, error }: { data: TopListener[]; error?: string }) {
  return (
    <SectionCard title="Ouvintes mais fiéis" icon={UserCheck} aside="IP mascarado · quem gera as horas ouvidas">
      {error || data.length === 0 ? (
        <BlockEmpty error={error} message="Sem ouvintes neste período" />
      ) : (
        <>
        <ul className="sm:hidden divide-y divide-beige-medium/60">
          {data.map((l, i) => (
            <li key={`m-${l.listener_hash}`} className="py-2.5 min-w-0">
              <p className="text-sm text-charcoal">
                <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                {SOURCE_LABELS[l.source] ?? l.source}
              </p>
              <p className="text-xs text-muted-foreground break-words">
                <code>{l.ip_masked ?? 'anonimizado'}</code>
                {(l.city || l.country) && <> · {[l.city, l.country].filter(Boolean).join(', ')}</>}
              </p>
              <p className="text-xs text-charcoal tabular-nums mt-0.5">
                {nf(l.listening_hours, 1)} h ({formatPercent(l.hours_share)}) · {plural(l.active_days, 'dia', 'dias')} · última vez {formatDateTime(l.last_seen)}
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-beige-medium">
                <th className="text-left py-2 pr-2 font-medium">#</th>
                <th className="text-left py-2 px-2 font-medium">Origem</th>
                <th className="text-left py-2 px-2 font-medium">Rede / local</th>
                <th className="text-right py-2 px-2 font-medium">Horas</th>
                <th className="text-right py-2 px-2 font-medium">% horas</th>
                <th className="text-right py-2 px-2 font-medium">Dias</th>
                <th className="text-right py-2 pl-2 font-medium">Última vez</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l, i) => (
                <tr key={l.listener_hash} className="border-b border-beige-medium/50 last:border-0">
                  <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-2 text-charcoal">{SOURCE_LABELS[l.source] ?? l.source}</td>
                  <td className="py-2 px-2 text-muted-foreground">
                    <code className="text-xs">{l.ip_masked ?? 'anonimizado'}</code>
                    {(l.city || l.country) && <span className="ml-2 text-xs">{[l.city, l.country].filter(Boolean).join(', ')}</span>}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{nf(l.listening_hours, 1)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatPercent(l.hours_share)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{nf(l.active_days)}</td>
                  <td className="py-2 pl-2 text-right text-muted-foreground whitespace-nowrap">{formatDateTime(l.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </SectionCard>
  );
}

function minutesAgo(iso: string | null): number | null {
  return iso ? (Date.now() - new Date(iso).getTime()) / 60000 : null;
}

function CollectionHealthBanner({ health }: { health: CollectionHealth | null }) {
  if (!health) return null;
  const snapshotAge = minutesAgo(health.last_snapshot_at);

  if (snapshotAge == null || snapshotAge > STALE_COLLECTION_MINUTES) {
    return (
      <div className="flex items-start gap-2 bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          <strong>A recolha de audiência parou.</strong> Última fotografia: {formatDateTime(health.last_snapshot_at)}.
          O AzuraCast só guarda cerca de 60 dias de histórico: é preciso repor o cron radio-snapshot-cron
          e fazer backfill do período em falta.
        </p>
      </div>
    );
  }

  if (health.failed_runs_24h > 0) {
    const failingNow =
      !health.last_connections_ok_at || new Date(health.last_connections_ok_at) < new Date(health.last_snapshot_at!);
    return (
      <div className="flex items-start gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-3 rounded-lg text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          {failingNow ? <strong>O histórico de ligações não está a ser recolhido. </strong> : null}
          A recolha do histórico falhou {plural(health.failed_runs_24h, 'vez', 'vezes')} nas últimas 24 h
          {health.last_connections_ok_at ? ` (último sucesso: ${formatDateTime(health.last_connections_ok_at)})` : ''}.
          As falhas curtas recuperam sozinhas na execução seguinte.
        </p>
      </div>
    );
  }

  return null;
}

function DevicesCard({ data, error }: { data: AudienceByDevice[]; error?: string }) {
  return (
    <SectionCard title="Telemóvel ou computador" icon={MonitorSmartphone} aside="por horas ouvidas">
      {error || data.length === 0 ? (
        <BlockEmpty error={error} message="Sem ligações neste período" />
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.device} className="space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="font-medium text-charcoal">{DEVICE_LABELS[row.device] ?? row.device}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {plural(row.listeners, 'ouvinte', 'ouvintes')} · {nf(row.listening_hours, 1)} h · {formatPercent(row.hours_share)}
                </span>
              </div>
              <div className="h-2 bg-beige-medium rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(row.hours_share * 100, row.hours_share > 0 ? 1 : 0)}%`, backgroundColor: DEVICE_COLORS[row.device] ?? '#94a3b8' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function ClientsCard({ data, error }: { data: AudienceByClient[]; error?: string }) {
  return (
    <SectionCard title="Detalhe por aplicação" icon={ListTree} aside="user-agent enviado ao stream · confirma a origem">
      {error || data.length === 0 ? (
        <BlockEmpty error={error} message="Sem ligações neste período" />
      ) : (
        <>
        <ul className="sm:hidden divide-y divide-beige-medium/60">
          {data.map((c) => (
            <li key={`m-${c.user_agent}`} className="py-2.5 min-w-0">
              <code className="text-xs break-all text-charcoal">{c.user_agent}</code>
              <p className="text-xs text-muted-foreground">
                {SOURCE_LABELS[c.source] ?? c.source} · {DEVICE_LABELS[c.device] ?? c.device}
              </p>
              <p className="text-xs text-charcoal tabular-nums mt-0.5">
                {plural(c.listeners, 'ouvinte', 'ouvintes')} · {plural(c.sessions, 'sessão', 'sessões')} · {nf(c.short_connections)} com menos de 1 min · {nf(c.listening_hours, 1)} h
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-beige-medium">
                <th className="text-left py-2 pr-2 font-medium">Aplicação (user-agent)</th>
                <th className="text-left py-2 px-2 font-medium">Origem</th>
                <th className="text-left py-2 px-2 font-medium">Dispositivo</th>
                <th className="text-right py-2 px-2 font-medium">Ouvintes</th>
                <th className="text-right py-2 px-2 font-medium">Sessões</th>
                <th className="text-right py-2 px-2 font-medium" title="Ligações com menos de 1 minuto">&lt; 1 min</th>
                <th className="text-right py-2 pl-2 font-medium">Horas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.user_agent} className="border-b border-beige-medium/50 last:border-0">
                  <td className="py-2 pr-2 max-w-[280px]">
                    <code className="text-xs break-all">{c.user_agent}</code>
                  </td>
                  <td className="py-2 px-2 text-charcoal whitespace-nowrap">{SOURCE_LABELS[c.source] ?? c.source}</td>
                  <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">{DEVICE_LABELS[c.device] ?? c.device}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{nf(c.listeners)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{nf(c.sessions)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{nf(c.short_connections)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{nf(c.listening_hours, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </SectionCard>
  );
}

// Plain-language error with the technical detail kept small for the Leo.
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const expired = /jwt|token|401|PGRST30|permission denied/i.test(message);
  const offline = /failed to fetch|network/i.test(message);
  const text = expired
    ? 'A sessão expirou. Sai do painel e volta a entrar para ver os números.'
    : offline
      ? 'Sem ligação à internet ou ao servidor. Confirma a rede e carrega em «Tentar de novo».'
      : 'Não foi possível carregar alguns números da audiência. Carrega em «Tentar de novo»; se continuar, avisa o Leo.';
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{text}</p>
        <p className="text-xs opacity-75 break-words mt-0.5">Detalhe técnico: {message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="border-destructive/40 text-destructive">
        Tentar de novo
      </Button>
    </div>
  );
}

function MethodologyNote({ data }: { data: AudienceData }) {
  const o = data.overview;
  return (
    <Card className="bg-beige-light border-beige-medium">
      <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="flex items-center gap-1.5 font-semibold text-charcoal">
          <Info className="w-3.5 h-3.5" /> Como estes números são calculados
        </p>
        <p>
          <strong>Ouvintes, sessões e horas</strong> vêm do histórico do AzuraCast, que regista todas as ligações ao stream.
          Um ouvinte é uma combinação de IP e aplicação com pelo menos 1 minuto no período; ligações mais curtas
          {o ? ` (${nf(o.short_connections)} neste período)` : ''} não contam como ouvintes.
          A mesma pessoa pode contar mais do que uma vez se mudar de rede (por exemplo, dados móveis) ou se
          ouvir em duas aplicações (por exemplo, a app e o myTuner).
        </p>
        <p>
          <strong>Origem</strong> vem do user-agent de cada ligação. A app Olha Que Duas identifica-se como
          «OlhaQueDuas/versão» desde a v2.3.0; as versões anteriores no Android aparecem como «okhttp» e no iPhone
          não se distinguem do Safari. O site e os diretórios web de rádios aparecem juntos como browser.
        </p>
        <p>
          <strong>Pessoas a ouvir ao mesmo tempo</strong> (média, máximo, mapa de horas) vêm de fotografias a cada 5 minutos
          {o?.snapshot_coverage != null ? ` — ${formatPercent(o.snapshot_coverage)} das fotografias esperadas foram recolhidas` : ''},
          sem robôs: desde 21/11/2026 desconta-se cada ligação automática (por exemplo, um servidor que fica ligado
          ao stream 24 horas por dia). Todas as horas estão em hora de Lisboa.
        </p>
      </CardContent>
    </Card>
  );
}

// --- Exportação ---

function csvField(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function generateAudienceCSV(data: AudienceData, periodLabel: string, summary: string[], prevComplete: boolean) {
  const lines: string[] = [];
  const row = (...cols: Array<string | number | null | undefined>) => lines.push(cols.map(csvField).join(','));
  const o = data.overview;

  row('Relatório de audiência', periodLabel);
  summary.forEach((t) => row(t));
  if (o) {
    row('Período', formatDateTime(o.period_start), formatDateTime(o.period_end));
    lines.push('');
    row('=== RESUMO ===');
    // Same rows as the Excel; previous period only when its history is complete
    row('Indicador', 'Este período', ...(prevComplete ? ['Período anterior'] : []));
    kpiRows(o, prevComplete).forEach((k) => row(k.label, k.current, ...(prevComplete ? [k.previous] : [])));
    row('Máximo ao mesmo tempo, em', formatDateTime(o.peak_at));
    row('Escuta média (min)', o.avg_session_minutes);
    row('% das horas dos 3 maiores ouvintes', o.top3_share);
    row('Ligações com menos de 1 min', o.short_connections);
    lines.push('');
  }

  row('=== POR DIA/HORA ===');
  row('Período', 'Ouvintes', 'Sessões', 'Horas ouvidas', 'Média simultâneos', 'Pico simultâneos');
  data.series.forEach((p) => row(p.bucket_label, p.listeners, p.sessions, p.listening_hours, p.avg_concurrent, p.peak_concurrent));
  lines.push('');

  row('=== ORIGEM ===');
  row('Origem', 'Ouvintes', 'Sessões', 'Ligações < 1 min', 'Horas ouvidas', 'Sessão média (min)', '% horas');
  data.bySource.forEach((s) => row(SOURCE_LABELS[s.source] ?? s.source, s.listeners, s.sessions, s.short_connections, s.listening_hours, s.avg_session_minutes, s.hours_share));
  lines.push('');

  row('=== DISPOSITIVO ===');
  row('Dispositivo', 'Ouvintes', 'Sessões', 'Horas ouvidas', '% horas');
  data.byDevice.forEach((d) => row(DEVICE_LABELS[d.device] ?? d.device, d.listeners, d.sessions, d.listening_hours, d.hours_share));
  lines.push('');

  row('=== APLICAÇÕES (USER-AGENT) ===');
  row('User-agent', 'Origem', 'Dispositivo', 'Ouvintes', 'Sessões', 'Ligações < 1 min', 'Horas ouvidas');
  data.byClient.forEach((c) => row(c.user_agent, SOURCE_LABELS[c.source] ?? c.source, DEVICE_LABELS[c.device] ?? c.device, c.listeners, c.sessions, c.short_connections, c.listening_hours));
  lines.push('');

  row('=== PROGRAMAS ===');
  row('Programa', 'Tipo', 'Horário', 'Emissões', 'Média ouvintes', 'Pico', 'Ouvintes distintos', 'Horas ouvidas', 'Horas por emissão');
  data.programs.forEach((p) => row(p.program, p.kind, p.schedule_label, p.occurrences, p.avg_listeners, p.peak_listeners, p.listeners, p.listening_hours, p.hours_per_occurrence));
  lines.push('');

  row('=== PAÍSES ===');
  row('País', 'Ouvintes', 'Horas ouvidas');
  data.byCountry.forEach((c) => row(getCountryName(c.country), c.listeners, c.listening_hours));

  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audiencia-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function generateAudiencePDF(data: AudienceData, periodLabel: string, summary: string[], retention: RetentionReading) {
  const o = data.overview;
  const html = `
    <!DOCTYPE html>
    <html><head>
    <meta charset="utf-8">
    <title>Relatório de Audiência - Olha que Duas</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #333; max-width: 900px; margin: 0 auto; }
      h1 { color: #C4302B; border-bottom: 2px solid #D4A843; padding-bottom: 10px; }
      h2 { color: #C4302B; margin-top: 30px; }
      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
      .stat-card { background: #f9f6f0; border: 1px solid #e5ddd0; border-radius: 8px; padding: 15px; text-align: center; }
      .stat-card .value { font-size: 24px; font-weight: bold; color: #333; }
      .stat-card .label { font-size: 12px; color: #666; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
      th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5ddd0; }
      th { background: #f9f6f0; font-weight: 600; color: #555; }
      .note { font-size: 11px; color: #777; margin-top: 30px; }
      .summary { background: #f9f6f0; border-left: 4px solid #C4302B; padding: 12px 18px 12px 36px; margin: 20px 0; }
      .summary li { margin: 4px 0; line-height: 1.45; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5ddd0; padding-top: 15px; }
    </style>
    </head><body>
    <h1>Relatório de Audiência — ${escapeHtml(periodLabel)}</h1>
    <p style="color: #666;">${o ? `${formatDateTime(o.period_start)} a ${formatDateTime(o.period_end)} · ` : ''}gerado em ${new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}</p>

    ${summary.length > 0 ? `<ul class="summary">${summary.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}

    ${o ? `
    <div class="stats-grid">
      <div class="stat-card"><div class="value">${nf(o.listeners)}</div><div class="label">Ouvintes (≥ 1 min)</div></div>
      <div class="stat-card"><div class="value">${nf(o.listening_hours, 1)} h</div><div class="label">Horas ouvidas</div></div>
      <div class="stat-card"><div class="value">${o.avg_concurrent == null ? '—' : nf(o.avg_concurrent, 2)}</div><div class="label">Média de pessoas a ouvir ao mesmo tempo</div></div>
      <div class="stat-card"><div class="value">${o.peak_concurrent ?? '—'}</div><div class="label">Máximo ao mesmo tempo</div></div>
      <div class="stat-card"><div class="value">${formatMinutes(o.median_session_minutes)}</div><div class="label">Escuta típica (mediana)</div></div>
      <div class="stat-card"><div class="value">${formatPercent(o.top3_share)}</div><div class="label">Horas dos 3 maiores ouvintes</div></div>
    </div>
    ` : ''}

    ${retention.total > 0 ? `
    <h2>Quanto tempo ficam a ouvir</h2>
    <table>
      <tr><th>Duração da escuta</th><th>Escutas</th></tr>
      ${retention.buckets.map((b) => `<tr><td>${escapeHtml(b.label)}</td><td>${nf(b.count)}</td></tr>`).join('')}
      <tr><th>Total</th><th>${nf(retention.total)}</th></tr>
    </table>
    ${retention.sentences.map((t) => `<p>${escapeHtml(t)}</p>`).join('')}
    ` : ''}

    ${data.bySource.length > 0 ? `
    <h2>De onde ouvem</h2>
    <table>
      <tr><th>Origem</th><th>Ouvintes</th><th>Sessões</th><th>Horas</th><th>% horas</th></tr>
      ${data.bySource.map((s) => `<tr><td>${escapeHtml(SOURCE_LABELS[s.source] ?? s.source)}</td><td>${nf(s.listeners)}</td><td>${nf(s.sessions)}</td><td>${nf(s.listening_hours, 1)}</td><td>${formatPercent(s.hours_share)}</td></tr>`).join('')}
    </table>
    ` : ''}

    ${data.byDevice.length > 0 ? `
    <h2>Telemóvel ou computador</h2>
    <table>
      <tr><th>Dispositivo</th><th>Ouvintes</th><th>Sessões</th><th>Horas</th><th>% horas</th></tr>
      ${data.byDevice.map((d) => `<tr><td>${escapeHtml(DEVICE_LABELS[d.device] ?? d.device)}</td><td>${nf(d.listeners)}</td><td>${nf(d.sessions)}</td><td>${nf(d.listening_hours, 1)}</td><td>${formatPercent(d.hours_share)}</td></tr>`).join('')}
    </table>
    ` : ''}

    ${data.programs.length > 0 ? `
    <h2>Audiência por programa</h2>
    <table>
      <tr><th>Programa</th><th>Horário</th><th>Emissões</th><th>Média</th><th>Máximo</th><th>Ouvintes</th><th>Horas/emissão</th></tr>
      ${data.programs.map((p) => `<tr><td>${escapeHtml(p.program)}</td><td>${escapeHtml(p.schedule_label)}</td><td>${nf(p.occurrences)}</td><td>${p.avg_listeners == null ? '—' : nf(p.avg_listeners, 1)}</td><td>${nf(p.peak_listeners)}</td><td>${nf(p.listeners)}</td><td>${nf(p.hours_per_occurrence, 2)}</td></tr>`).join('')}
    </table>
    ` : ''}

    ${data.byCountry.length > 0 ? `
    <h2>Países</h2>
    <table>
      <tr><th>País</th><th>Ouvintes</th><th>Horas</th></tr>
      ${data.byCountry.map((c) => `<tr><td>${escapeHtml(getCountryName(c.country))}</td><td>${nf(c.listeners)}</td><td>${nf(c.listening_hours, 1)}</td></tr>`).join('')}
    </table>
    ` : ''}

    <p class="note">Ouvinte = IP + aplicação com pelo menos 1 minuto. Ligações, sessões e horas: histórico completo do AzuraCast. Pessoas ao mesmo tempo: fotografias a cada 5 minutos, sem robôs. Hora de Lisboa.</p>
    <div class="footer">Olha que Duas • Relatório de Audiência • ${new Date().getFullYear()}</div>
    </body></html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

// --- Página ---

export function Audience() {
  const [period, setPeriod] = useState<PeriodRange>(30);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error, errors, refresh } = useAudienceStats(period);
  const { insights, insightsLoading, insightsError } = useAudienceInsights(period, refreshKey);
  const o = data.overview;
  const periodLabel = periodLabels[period];
  const ready = !loading && !insightsLoading;
  // Fail closed: without the extras we do not know if the previous period is complete
  const prevComplete = insights?.prev_complete ?? false;

  const summary = useMemo(
    () => (ready && o ? summarySentences(period, o, insights, data.heatmap, data.programs) : []),
    [ready, o, period, insights, data.heatmap, data.programs],
  );
  const retention = useMemo(
    () => (o ? retentionReading(period, o, insights) : { total: 0, buckets: [], sentences: [] }),
    [o, period, insights],
  );

  const reload = () => {
    refresh();
    setRefreshKey((n) => n + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-charcoal">Audiência</h2>
          <p className="text-sm text-muted-foreground">
            Quem ouve a rádio, durante quanto tempo e por onde
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-cream border border-beige-medium rounded-lg p-1">
            {([1, 7, 30, 90] as PeriodRange[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  period === p ? 'bg-vermelho text-white' : 'text-muted-foreground hover:text-charcoal'
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-beige-medium" disabled={!ready || !o}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => generateAudiencePDF(data, periodLabel, summary, retention)}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  import('../components/audience/audienceExcel').then(({ downloadAudienceExcel }) =>
                    downloadAudienceExcel({
                      data,
                      periodLabel,
                      summary,
                      retention,
                      prevComplete,
                      sourceLabel: (x) => SOURCE_LABELS[x as ListenerSource] ?? x,
                      deviceLabel: (x) => DEVICE_LABELS[x as ListenerDevice] ?? x,
                      countryLabel: getCountryName,
                    }),
                  )
                }
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateAudienceCSV(data, periodLabel, summary, prevComplete)}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={reload} disabled={loading} className="border-beige-medium">
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <CollectionHealthBanner health={data.health} />

      {loading && !o ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-cream border-beige-medium animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 bg-beige-medium rounded w-24 mb-3" />
                <div className="h-8 bg-beige-medium rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {!o && !error && <EmptyState message="Ainda não há números de audiência para mostrar." />}
          {!o && errors.overview && <BlockError message={errors.overview} />}

          <SummaryCard sentences={summary} />

          {o && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard title="Ouvintes" value={nf(o.listeners)} icon={Users} hint="IP + aplicação com pelo menos 1 minuto no período">
                <Delta current={o.listeners} previous={o.prev_listeners} periodLabel={periodLabel} prevComplete={prevComplete} />
              </KpiCard>
              <KpiCard title="Horas ouvidas" value={`${nf(o.listening_hours, 1)} h`} icon={Headphones}>
                <Delta current={o.listening_hours} previous={o.prev_listening_hours} periodLabel={periodLabel} prevComplete={prevComplete} />
              </KpiCard>
              <KpiCard
                title="Pessoas a ouvir ao mesmo tempo (média)"
                value={o.avg_concurrent == null ? '—' : nf(o.avg_concurrent, 2)}
                icon={Activity}
                hint="Quantas pessoas estão a ouvir, em média, num momento qualquer (sem robôs)"
              >
                {o.avg_concurrent != null && (
                  <Delta current={o.avg_concurrent} previous={o.prev_avg_concurrent} periodLabel={periodLabel} prevComplete={prevComplete} />
                )}
              </KpiCard>
              <KpiCard title="Máximo ao mesmo tempo" value={o.peak_concurrent == null ? '—' : nf(o.peak_concurrent)} icon={TrendingUp}>
                {o.peak_at && o.peak_concurrent != null && o.peak_concurrent > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(o.peak_at)}</p>
                )}
              </KpiCard>
              <KpiCard
                title="Escuta típica (mediana)"
                value={formatMinutes(o.median_session_minutes)}
                icon={Timer}
                hint="Metade das escutas de pelo menos 1 minuto dura mais do que isto"
              >
                {o.avg_session_minutes != null && (
                  <p className="text-xs text-muted-foreground mt-1">média {formatMinutes(o.avg_session_minutes)} · {plural(o.sessions, 'escuta', 'escutas')}</p>
                )}
              </KpiCard>
              <KpiCard
                title="Tempo com alguém a ouvir"
                value={formatPercent(o.pct_time_with_listeners)}
                icon={Clock}
                hint="Percentagem das fotografias de 5 em 5 minutos com pelo menos 1 ouvinte"
              >
                {o.top3_share != null && (
                  <p className="text-xs text-muted-foreground mt-1">3 maiores ouvintes = {formatPercent(o.top3_share)} das horas</p>
                )}
              </KpiCard>
            </div>
          )}

          <SeriesChart data={data.series} hourly={period === 1} error={errors.series} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SourcesCard data={data.bySource} error={errors.bySource} />
            <div className="space-y-4">
              <DevicesCard data={data.byDevice} error={errors.byDevice} />
              <CountriesCard data={data.byCountry} error={errors.byCountry} />
            </div>
          </div>

          <HeatmapChart data={data.heatmap} error={errors.heatmap} />

          <RetentionCard
            reading={retention}
            failed={(!insightsLoading && !insights && !!o) || !!errors.overview}
            detail={errors.overview ?? insightsError}
          />

          <ProgramsCard data={data.programs} error={errors.programs} />

          <TopListenersCard data={data.topListeners} error={errors.topListeners} />

          <ClientsCard data={data.byClient} error={errors.byClient} />

          <MethodologyNote data={data} />
        </>
      )}
    </div>
  );
}
