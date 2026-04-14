import { useState } from 'react';
import {
  BarChart3,
  Users,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Clock,
  FileText,
  Download,
  Laptop,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useAnalytics, type MetricData } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';
import { generateAnalyticsCSV, generateAnalyticsPDF } from '../lib/reportGenerator';

type TimeRange = '24h' | '7d' | '30d' | '90d';

const timeRangeLabels: Record<TimeRange, string> = {
  '24h': 'Últimas 24h',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
};

const countryNames: Record<string, string> = {
  PT: 'Portugal',
  BR: 'Brasil',
  US: 'Estados Unidos',
  ES: 'Espanha',
  FR: 'França',
  GB: 'Reino Unido',
  DE: 'Alemanha',
  IT: 'Itália',
  NL: 'Países Baixos',
  BE: 'Bélgica',
  CH: 'Suíça',
  AO: 'Angola',
  MZ: 'Moçambique',
  CV: 'Cabo Verde',
};

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  laptop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

const CHART_COLORS = {
  vermelho: '#C4302B',
  vermelhoSoft: '#e06560',
  amarelo: '#D4A843',
  amareloSoft: '#e0c070',
};

const PIE_COLORS = ['#C4302B', '#D4A843', '#6366f1', '#22c55e', '#f59e0b', '#8b5cf6'];

function StatCard({
  title,
  value,
  prevValue,
  icon: Icon,
  format = 'number',
}: {
  title: string;
  value: number;
  prevValue: number;
  icon: typeof Eye;
  format?: 'number' | 'time' | 'percent';
}) {
  const change = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (val: number) => {
    if (format === 'time') {
      const minutes = Math.floor(val / 60);
      const seconds = val % 60;
      return `${minutes}m ${seconds}s`;
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString('pt-PT');
  };

  return (
    <Card className="bg-cream border-beige-medium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold text-charcoal mt-1">{formatValue(value)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-vermelho/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-vermelho" />
          </div>
        </div>
        {prevValue > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBar({ label, value, maxValue }: { label: string; value: number; maxValue: number }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-charcoal font-medium truncate max-w-[200px]">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value.toLocaleString('pt-PT')}</span>
      </div>
      <div className="h-2 bg-beige-medium rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-vermelho to-vermelho-soft rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricsList({
  title,
  icon: Icon,
  data,
  formatLabel,
}: {
  title: string;
  icon: typeof Globe;
  data: MetricData[];
  formatLabel?: (item: MetricData) => string;
}) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.y)) : 0;

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Icon className="w-4 h-4 text-vermelho" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sem dados disponíveis
          </p>
        ) : (
          data.map((item, index) => (
            <MetricBar
              key={index}
              label={formatLabel ? formatLabel(item) : item.x}
              value={item.y}
              maxValue={maxValue}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-charcoal text-white text-xs px-3 py-2 rounded-lg shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.dataKey === 'views' ? CHART_COLORS.vermelho : CHART_COLORS.amarelo }}
          />
          {entry.dataKey === 'views' ? 'Visualizações' : 'Sessões'}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function PageviewsChart({
  pageviews,
  sessions,
  timeRange,
}: {
  pageviews: Array<{ x: string; y: number }>;
  sessions: Array<{ x: string; y: number }>;
  timeRange: TimeRange;
}) {
  const chartData = pageviews.map((pv, i) => {
    const date = new Date(pv.x);
    const formatDate = () => {
      if (timeRange === '24h') {
        return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
    };
    return {
      date: formatDate(),
      views: pv.y,
      sessions: sessions[i]?.y ?? 0,
    };
  });

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <BarChart3 className="w-4 h-4 text-vermelho" />
            Visualizações e Sessões
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-vermelho" />
              Visualizações
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-amarelo" />
              Sessões
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem dados disponíveis
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.vermelho} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.vermelho} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.amarelo} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.amarelo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#999' }}
                tickLine={false}
                axisLine={{ stroke: '#e5ddd0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#999' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke={CHART_COLORS.vermelho}
                strokeWidth={2}
                fill="url(#colorViews)"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.vermelho }}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke={CHART_COLORS.amarelo}
                strokeWidth={2}
                fill="url(#colorSessions)"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.amarelo }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function DevicesCard({ data }: { data: MetricData[] }) {
  const total = data.reduce((sum, d) => sum + d.y, 0);

  const pieData = data.map((d) => ({
    name: d.x.charAt(0).toUpperCase() + d.x.slice(1),
    value: d.y,
    percentage: total > 0 ? ((d.y / total) * 100).toFixed(1) : '0',
  }));

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Monitor className="w-4 h-4 text-vermelho" />
          Dispositivos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sem dados disponíveis
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {data.map((device, index) => {
                const Icon = deviceIcons[device.x.toLowerCase()] || Monitor;
                const percentage = total > 0 ? ((device.y / total) * 100).toFixed(1) : '0';

                return (
                  <div key={device.x} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-charcoal capitalize flex-1">{device.x}</span>
                    <span className="text-sm font-semibold text-charcoal tabular-nums">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const { data, loading, error, refresh } = useAnalytics(timeRange);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-charcoal">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Métricas e estatísticas do site olhaqueduas.com
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-cream border border-beige-medium rounded-lg p-1">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  timeRange === range
                    ? 'bg-vermelho text-white'
                    : 'text-muted-foreground hover:text-charcoal'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-beige-medium"
                disabled={loading || !data.stats}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => generateAnalyticsPDF({
                  ...data,
                  timeRange: timeRangeLabels[timeRange],
                })}
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => generateAnalyticsCSV({
                  ...data,
                  timeRange: timeRangeLabels[timeRange],
                })}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="border-beige-medium"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !data.stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
          {/* Stats Grid */}
          {data.stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Visualizações"
                value={data.stats.pageviews.value}
                prevValue={data.stats.pageviews.prev}
                icon={Eye}
              />
              <StatCard
                title="Visitantes"
                value={data.stats.visitors.value}
                prevValue={data.stats.visitors.prev}
                icon={Users}
              />
              <StatCard
                title="Sessões"
                value={data.stats.visits.value}
                prevValue={data.stats.visits.prev}
                icon={BarChart3}
              />
              <StatCard
                title="Tempo Médio"
                value={Math.round(data.stats.totalTime.value / Math.max(data.stats.visits.value, 1))}
                prevValue={Math.round(data.stats.totalTime.prev / Math.max(data.stats.visits.prev, 1))}
                icon={Clock}
                format="time"
              />
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PageviewsChart
                pageviews={data.pageviews}
                sessions={data.sessions}
                timeRange={timeRange}
              />
            </div>
            <DevicesCard data={data.devices} />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricsList
              title="Páginas Mais Visitadas"
              icon={Eye}
              data={data.pages}
              formatLabel={(item) => {
                const path = item.x || '/';
                if (path === '/') return 'Página Inicial';
                return path.length > 30 ? path.substring(0, 30) + '...' : path;
              }}
            />
            <MetricsList
              title="Países"
              icon={Globe}
              data={data.countries}
              formatLabel={(item) => countryNames[item.x] || item.x}
            />
            <MetricsList
              title="Referências"
              icon={ExternalLink}
              data={data.referrers}
              formatLabel={(item) => {
                if (!item.x || item.x === '(direct)') return 'Acesso Direto';
                try {
                  const url = new URL(item.x.startsWith('http') ? item.x : `https://${item.x}`);
                  return url.hostname.replace('www.', '');
                } catch {
                  return item.x;
                }
              }}
            />
          </div>

          {/* Browser & OS Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricsList
              title="Navegadores"
              icon={Monitor}
              data={data.browsers}
            />
            <MetricsList
              title="Sistemas Operacionais"
              icon={Laptop}
              data={data.os}
            />
          </div>
        </>
      )}
    </div>
  );
}
