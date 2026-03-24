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
  mobile: Smartphone,
  tablet: Tablet,
};

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

function PageviewsChart({ data }: { data: Array<{ x: string; y: number }> }) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.y)) : 0;

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <BarChart3 className="w-4 h-4 text-vermelho" />
          Visualizações por Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem dados disponíveis
          </p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {data.map((item, index) => {
              const height = maxValue > 0 ? (item.y / maxValue) * 100 : 0;
              const date = new Date(item.x);
              const day = date.getDate();

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-full max-w-8 bg-gradient-to-t from-vermelho to-vermelho-soft rounded-t transition-all duration-300 group-hover:from-amarelo group-hover:to-amarelo-soft cursor-pointer"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {item.y} views
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DevicesCard({ data }: { data: MetricData[] }) {
  const total = data.reduce((sum, d) => sum + d.y, 0);

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
          <div className="flex justify-around">
            {data.map((device) => {
              const Icon = deviceIcons[device.x.toLowerCase()] || Monitor;
              const percentage = total > 0 ? ((device.y / total) * 100).toFixed(1) : '0';

              return (
                <div key={device.x} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-vermelho/10 flex items-center justify-center mb-2">
                    <Icon className="w-6 h-6 text-vermelho" />
                  </div>
                  <p className="text-lg font-bold text-charcoal">{percentage}%</p>
                  <p className="text-xs text-muted-foreground capitalize">{device.x}</p>
                </div>
              );
            })}
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
              <PageviewsChart data={data.pageviews} />
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
