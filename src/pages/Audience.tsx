import { useState } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Activity,
  Globe,
  Radio,
  BarChart3,
  Calendar,
  Download,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
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
import { useRetentionStats, type CohortRow, type HeatmapCell, type ProgramPerformance } from '../hooks/useRetentionStats';
import { getCountryName } from '../lib/countries';
import { cn } from '../lib/utils';

const CHART_COLORS = {
  vermelho: '#C4302B',
  vermelhoSoft: '#e06560',
  amarelo: '#D4A843',
  amareloSoft: '#e0c070',
  green: '#22c55e',
  greenSoft: '#86efac',
  indigo: '#6366f1',
  indigoSoft: '#a5b4fc',
};

type PeriodRange = 7 | 14 | 30 | 90;

const periodLabels: Record<PeriodRange, string> = {
  7: '7 dias',
  14: '14 dias',
  30: '30 dias',
  90: '90 dias',
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// --- Components ---

function OverviewCard({
  title,
  value,
  icon: Icon,
  trend,
  format = 'number',
}: {
  title: string;
  value: number;
  icon: typeof Users;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'percent' | 'time' | 'ratio';
}) {
  const formatValue = (val: number) => {
    if (format === 'percent') return `${(val * 100).toFixed(1)}%`;
    if (format === 'ratio') return val.toFixed(3);
    if (format === 'time') {
      if (val === 0) return '0s';
      const hours = Math.floor(val / 3600);
      const minutes = Math.floor((val % 3600) / 60);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    return val.toLocaleString('pt-PT');
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className="bg-cream border-beige-medium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className={cn('text-3xl font-bold mt-1', trend ? trendColors[trend] : 'text-charcoal')}>
              {formatValue(value)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-vermelho/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-vermelho" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DauMauChart({ data }: { data: Array<{ day: string; dau: number; mau: number; ratio: number }> }) {
  if (data.length < 2) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <Activity className="w-4 h-4 text-vermelho" />
            DAU / MAU (Stickiness)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Dados insuficientes — o gráfico aparece após acumular dados de ouvintes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Activity className="w-4 h-4 text-vermelho" />
          DAU / MAU (Stickiness)
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            Ratio ideal: &gt; 0.20
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.vermelho} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.vermelho} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e5ddd0' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d2d2d', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              labelStyle={{ color: '#ccc' }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === 'ratio') return [`${(v * 100).toFixed(1)}%`, 'DAU/MAU'];
                if (name === 'dau') return [v, 'DAU'];
                return [v, 'MAU'];
              }}
            />
            <Area type="monotone" dataKey="ratio" stroke={CHART_COLORS.vermelho} strokeWidth={2} fill="url(#colorRatio)" dot={false} activeDot={{ r: 4, fill: CHART_COLORS.vermelho }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function NewVsReturningChart({ data }: { data: Array<{ day: string; new_listeners: number; returning_listeners: number }> }) {
  if (data.length < 2) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <Users className="w-4 h-4 text-vermelho" />
            Novos vs Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Dados insuficientes — aguarde acumular sessões de ouvintes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Users className="w-4 h-4 text-vermelho" />
          Novos vs Recorrentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#e5ddd0' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d2d2d', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              labelStyle={{ color: '#ccc' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="new_listeners" name="Novos" fill={CHART_COLORS.green} radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="returning_listeners" name="Recorrentes" fill={CHART_COLORS.indigo} radius={[2, 2, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CohortTable({ data }: { data: CohortRow[] }) {
  if (data.length === 0) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <Calendar className="w-4 h-4 text-vermelho" />
            Retenção por Cohort (Semanal)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Dados insuficientes — necessários pelo menos 2 semanas de dados
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build cohort matrix
  const cohorts = [...new Set(data.map((d) => d.cohort_week))];
  const maxWeek = Math.max(...data.map((d) => d.week_number));

  const getCell = (cohort: string, week: number) => {
    return data.find((d) => d.cohort_week === cohort && d.week_number === week);
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 0.8) return 'bg-green-600 text-white';
    if (rate >= 0.6) return 'bg-green-500 text-white';
    if (rate >= 0.4) return 'bg-green-400 text-white';
    if (rate >= 0.2) return 'bg-green-300 text-charcoal';
    if (rate > 0) return 'bg-green-200 text-charcoal';
    return 'bg-gray-100 text-gray-400';
  };

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Calendar className="w-4 h-4 text-vermelho" />
          Retenção por Cohort (Semanal)
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            % de ouvintes que retornam em cada semana
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Cohort</th>
                <th className="text-center py-2 px-1 text-muted-foreground font-medium text-xs">Tamanho</th>
                {Array.from({ length: maxWeek + 1 }, (_, i) => (
                  <th key={i} className="text-center py-2 px-1 text-muted-foreground font-medium text-xs">
                    S{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => {
                const sizeCell = getCell(cohort, 0);
                return (
                  <tr key={cohort}>
                    <td className="py-1.5 px-2 text-charcoal font-medium text-xs whitespace-nowrap">{cohort}</td>
                    <td className="py-1.5 px-1 text-center text-xs text-muted-foreground">
                      {sizeCell?.cohort_size || '-'}
                    </td>
                    {Array.from({ length: maxWeek + 1 }, (_, weekNum) => {
                      const cell = getCell(cohort, weekNum);
                      if (!cell) return <td key={weekNum} className="py-1.5 px-1" />;

                      return (
                        <td key={weekNum} className="py-1.5 px-1">
                          <div
                            className={cn(
                              'text-center text-xs font-medium py-1 px-1 rounded',
                              getRetentionColor(cell.retention_rate)
                            )}
                            title={`${cell.retained} de ${cell.cohort_size} ouvintes`}
                          >
                            {(cell.retention_rate * 100).toFixed(0)}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapChart({ data }: { data: HeatmapCell[] }) {
  if (data.length === 0) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <Clock className="w-4 h-4 text-vermelho" />
            Padrão de Audiência (Heatmap)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Dados insuficientes — o heatmap aparece após acumular snapshots
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxListeners = Math.max(...data.map((d) => d.avg_listeners), 1);

  const getHeatColor = (value: number) => {
    const intensity = value / maxListeners;
    if (intensity >= 0.8) return 'bg-red-600 text-white';
    if (intensity >= 0.6) return 'bg-red-400 text-white';
    if (intensity >= 0.4) return 'bg-orange-400 text-white';
    if (intensity >= 0.2) return 'bg-yellow-300 text-charcoal';
    if (intensity > 0) return 'bg-yellow-100 text-charcoal';
    return 'bg-gray-50 text-gray-300';
  };

  const getCellValue = (dow: number, hour: number) => {
    const cell = data.find((d) => d.day_of_week === dow && d.hour_of_day === hour);
    return cell?.avg_listeners || 0;
  };

  // Only show even hours to fit
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Clock className="w-4 h-4 text-vermelho" />
          Padrão de Audiência (Heatmap)
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            Média de ouvintes por dia/hora
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-1 px-1 text-xs text-muted-foreground w-10" />
                {hours.map((h) => (
                  <th key={h} className="text-center py-1 px-0.5 text-[10px] text-muted-foreground">
                    {h.toString().padStart(2, '0')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }, (_, dow) => (
                <tr key={dow}>
                  <td className="py-0.5 px-1 text-xs font-medium text-charcoal">{DAY_NAMES[dow]}</td>
                  {hours.map((hour) => {
                    const val = getCellValue(dow, hour);
                    return (
                      <td key={hour} className="py-0.5 px-0.5">
                        <div
                          className={cn(
                            'w-full h-6 rounded-sm flex items-center justify-center text-[9px] font-medium',
                            getHeatColor(val)
                          )}
                          title={`${DAY_NAMES[dow]} ${hour}h: ${val} ouvintes`}
                        >
                          {val > 0 ? val : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[10px] text-muted-foreground mr-1">Menos</span>
            <div className="w-4 h-3 rounded-sm bg-gray-50" />
            <div className="w-4 h-3 rounded-sm bg-yellow-100" />
            <div className="w-4 h-3 rounded-sm bg-yellow-300" />
            <div className="w-4 h-3 rounded-sm bg-orange-400" />
            <div className="w-4 h-3 rounded-sm bg-red-400" />
            <div className="w-4 h-3 rounded-sm bg-red-600" />
            <span className="text-[10px] text-muted-foreground ml-1">Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CountriesDetailedCard({ data }: { data: Array<{ country: string; unique_listeners: number; total_sessions: number; avg_duration_seconds: number }> }) {
  if (data.length === 0) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <Globe className="w-4 h-4 text-vermelho" />
            Audiência por País (Detalhado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados de localização</p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const maxListeners = Math.max(...data.map((d) => d.unique_listeners));

  const BAR_COLORS_LIST = ['#C4302B', '#D4A843', '#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Globe className="w-4 h-4 text-vermelho" />
          Audiência por País (Detalhado)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.slice(0, 15).map((item, i) => (
            <div key={item.country} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-charcoal">{getCountryName(item.country)}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.unique_listeners} únicos</span>
                  <span>{item.total_sessions} sessões</span>
                  <span>{formatDuration(item.avg_duration_seconds)}</span>
                </div>
              </div>
              <div className="h-2 bg-beige-medium rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.unique_listeners / maxListeners) * 100}%`,
                    backgroundColor: BAR_COLORS_LIST[i % BAR_COLORS_LIST.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramPerformanceCard({ data }: { data: ProgramPerformance[] }) {
  if (data.length === 0) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <Radio className="w-4 h-4 text-vermelho" />
            Audiência por Programa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Dados insuficientes — cruzando grelha com snapshots
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 12).map((p) => ({
    name: p.slot_name.length > 18 ? p.slot_name.substring(0, 18) + '...' : p.slot_name,
    avg: p.avg_listeners,
    peak: p.peak_listeners,
    time: p.slot_time,
  }));

  const BAR_COLORS_LIST = ['#C4302B', '#D4A843', '#6366f1', '#22c55e', '#f59e0b', '#8b5cf6'];

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Radio className="w-4 h-4 text-vermelho" />
          Audiência por Programa
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            Média e pico de ouvintes por slot
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: '#555' }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d2d2d', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              formatter={(value, name) => [
                `${value} ouvintes`,
                name === 'avg' ? 'Média' : 'Pico',
              ]}
            />
            <Bar dataKey="avg" name="Média" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={BAR_COLORS_LIST[index % BAR_COLORS_LIST.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function generateAudienceCSV(data: ReturnType<typeof useRetentionStats>['data']) {
  const lines: string[] = [];

  // Overview
  if (data.overview) {
    lines.push('=== RESUMO GERAL ===');
    lines.push(`Ouvintes Únicos Total,${data.overview.total_unique_listeners}`);
    lines.push(`Ouvintes Hoje,${data.overview.listeners_today}`);
    lines.push(`Ouvintes Semana,${data.overview.listeners_this_week}`);
    lines.push(`Ouvintes Mês,${data.overview.listeners_this_month}`);
    lines.push(`DAU/MAU,${data.overview.dau_mau_ratio}`);
    lines.push(`Churn 30d,${(data.overview.churn_rate_30d * 100).toFixed(1)}%`);
    lines.push('');
  }

  // New vs Returning
  if (data.newVsReturning.length > 0) {
    lines.push('=== NOVOS vs RECORRENTES ===');
    lines.push('Data,Novos,Recorrentes,Total');
    data.newVsReturning.forEach((r) => {
      lines.push(`${r.day},${r.new_listeners},${r.returning_listeners},${r.total_listeners}`);
    });
    lines.push('');
  }

  // Countries
  if (data.countriesDetailed.length > 0) {
    lines.push('=== AUDIÊNCIA POR PAÍS ===');
    lines.push('País,Ouvintes Únicos,Total Sessões,Duração Média (s)');
    data.countriesDetailed.forEach((c) => {
      lines.push(`${getCountryName(c.country)},${c.unique_listeners},${c.total_sessions},${c.avg_duration_seconds}`);
    });
    lines.push('');
  }

  // Programs
  if (data.programPerformance.length > 0) {
    lines.push('=== AUDIÊNCIA POR PROGRAMA ===');
    lines.push('Programa,Horário,Período,Média Ouvintes,Pico Ouvintes');
    data.programPerformance.forEach((p) => {
      lines.push(`${p.slot_name},${p.slot_time},${p.period_label},${p.avg_listeners},${p.peak_listeners}`);
    });
  }

  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audiencia-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function generateAudiencePDF(data: ReturnType<typeof useRetentionStats>['data']) {
  const html = `
    <!DOCTYPE html>
    <html><head>
    <meta charset="utf-8">
    <title>Relatório de Audiência - Olha que Duas</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #333; max-width: 900px; margin: 0 auto; }
      h1 { color: #C4302B; border-bottom: 2px solid #D4A843; padding-bottom: 10px; }
      h2 { color: #C4302B; margin-top: 30px; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
      .stat-card { background: #f9f6f0; border: 1px solid #e5ddd0; border-radius: 8px; padding: 15px; text-align: center; }
      .stat-card .value { font-size: 24px; font-weight: bold; color: #333; }
      .stat-card .label { font-size: 12px; color: #666; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
      th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5ddd0; }
      th { background: #f9f6f0; font-weight: 600; color: #555; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5ddd0; padding-top: 15px; }
    </style>
    </head><body>
    <h1>Relatório de Audiência</h1>
    <p style="color: #666;">Gerado em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</p>

    ${data.overview ? `
    <div class="stats-grid">
      <div class="stat-card"><div class="value">${data.overview.total_unique_listeners}</div><div class="label">Ouvintes Únicos</div></div>
      <div class="stat-card"><div class="value">${data.overview.listeners_this_month}</div><div class="label">Ouvintes (Mês)</div></div>
      <div class="stat-card"><div class="value">${(data.overview.dau_mau_ratio * 100).toFixed(1)}%</div><div class="label">DAU/MAU</div></div>
      <div class="stat-card"><div class="value">${(data.overview.churn_rate_30d * 100).toFixed(1)}%</div><div class="label">Churn 30d</div></div>
    </div>
    ` : ''}

    ${data.countriesDetailed.length > 0 ? `
    <h2>Audiência por País</h2>
    <table>
      <tr><th>País</th><th>Ouvintes Únicos</th><th>Sessões</th><th>Duração Média</th></tr>
      ${data.countriesDetailed.slice(0, 15).map((c) => {
        const dur = c.avg_duration_seconds;
        const durStr = dur > 3600 ? `${Math.floor(dur / 3600)}h ${Math.floor((dur % 3600) / 60)}m` : `${Math.floor(dur / 60)}m`;
        return `<tr><td>${getCountryName(c.country)}</td><td>${c.unique_listeners}</td><td>${c.total_sessions}</td><td>${durStr}</td></tr>`;
      }).join('')}
    </table>
    ` : ''}

    ${data.programPerformance.length > 0 ? `
    <h2>Audiência por Programa</h2>
    <table>
      <tr><th>Programa</th><th>Horário</th><th>Período</th><th>Média</th><th>Pico</th></tr>
      ${data.programPerformance.map((p) => `<tr><td>${p.slot_name}</td><td>${p.slot_time}</td><td>${p.period_label}</td><td>${p.avg_listeners}</td><td>${p.peak_listeners}</td></tr>`).join('')}
    </table>
    ` : ''}

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

// --- Main Page ---

export function Audience() {
  const [period, setPeriod] = useState<PeriodRange>(30);
  const { data, loading, error, refresh } = useRetentionStats(period);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-charcoal">Audiência</h2>
          <p className="text-sm text-muted-foreground">
            Retenção, comportamento e métricas detalhadas de ouvintes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-cream border border-beige-medium rounded-lg p-1">
            {(Object.keys(periodLabels) as unknown as PeriodRange[]).map((p) => {
              const numP = Number(p) as PeriodRange;
              return (
                <button
                  key={numP}
                  onClick={() => setPeriod(numP)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                    period === numP
                      ? 'bg-vermelho text-white'
                      : 'text-muted-foreground hover:text-charcoal'
                  )}
                >
                  {periodLabels[numP]}
                </button>
              );
            })}
          </div>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-beige-medium" disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => generateAudiencePDF(data)}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => generateAudienceCSV(data)}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="border-beige-medium">
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Loading */}
      {loading && !data.overview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
          {/* Overview Stats */}
          {data.overview && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <OverviewCard
                title="Ouvintes Únicos"
                value={data.overview.total_unique_listeners}
                icon={Users}
              />
              <OverviewCard
                title="Hoje"
                value={data.overview.listeners_today}
                icon={Activity}
              />
              <OverviewCard
                title="Novos Hoje"
                value={data.overview.new_today}
                icon={UserPlus}
                trend="up"
              />
              <OverviewCard
                title="Recorrentes Hoje"
                value={data.overview.returning_today}
                icon={UserCheck}
                trend="up"
              />
              <OverviewCard
                title="DAU/MAU"
                value={data.overview.dau_mau_ratio}
                icon={TrendingUp}
                format="ratio"
                trend={data.overview.dau_mau_ratio >= 0.2 ? 'up' : data.overview.dau_mau_ratio > 0 ? 'neutral' : 'down'}
              />
              <OverviewCard
                title="Churn 30d"
                value={data.overview.churn_rate_30d}
                icon={TrendingDown}
                format="percent"
                trend={data.overview.churn_rate_30d <= 0.3 ? 'up' : 'down'}
              />
            </div>
          )}

          {/* Secondary Stats */}
          {data.overview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <OverviewCard
                title="Ouvintes (Semana)"
                value={data.overview.listeners_this_week}
                icon={BarChart3}
              />
              <OverviewCard
                title="Sessões por Ouvinte"
                value={data.overview.avg_sessions_per_listener}
                icon={Activity}
                format="ratio"
              />
              <OverviewCard
                title="Duração Média"
                value={data.overview.avg_session_duration_seconds}
                icon={Clock}
                format="time"
              />
            </div>
          )}

          {/* Heatmap */}
          <HeatmapChart data={data.heatmap} />

          {/* DAU/MAU + New vs Returning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DauMauChart data={data.dauMau} />
            <NewVsReturningChart data={data.newVsReturning} />
          </div>

          {/* Cohort Retention Table */}
          <CohortTable data={data.cohort} />

          {/* Countries + Programs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CountriesDetailedCard data={data.countriesDetailed} />
            <ProgramPerformanceCard data={data.programPerformance} />
          </div>
        </>
      )}
    </div>
  );
}
