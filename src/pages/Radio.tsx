import { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Users,
  Music,
  Globe,
  RefreshCw,
  Radio as RadioIcon,
  Mic,
  History,
  SkipForward,
  Signal,
  Clock,
  Download,
  FileText,
  Activity,
  CalendarDays,
  CalendarRange,
  Calendar,
  Timer,
  TrendingUp,
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useRadio } from '../hooks/useRadio';
import { useRadioStats, type RadioPeriodStats } from '../hooks/useRadioStats';
import { cn } from '../lib/utils';
import { generateRadioCSV, generateRadioPDF } from '../lib/reportGenerator';
import type { SongHistory, ListenersByCountry, NowPlayingInfo } from '../types/radio';

const CHART_COLORS = {
  vermelho: '#C4302B',
  vermelhoSoft: '#e06560',
  amarelo: '#D4A843',
};

const BAR_COLORS = ['#C4302B', '#D4A843', '#6366f1', '#22c55e', '#f59e0b'];

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
  Unknown: 'Desconhecido',
};

function StatCard({
  title,
  value,
  icon: Icon,
  format = 'number',
  variant = 'default',
}: {
  title: string;
  value: number | string;
  icon: typeof Users;
  format?: 'number' | 'text';
  variant?: 'default' | 'live' | 'offline';
}) {
  const bgColors = {
    default: 'bg-vermelho/10',
    live: 'bg-green-100',
    offline: 'bg-gray-100',
  };

  const iconColors = {
    default: 'text-vermelho',
    live: 'text-green-600',
    offline: 'text-gray-500',
  };

  const formatValue = (val: number | string) => {
    if (format === 'text') return val;
    if (typeof val === 'number') return val.toLocaleString('pt-PT');
    return val;
  };

  return (
    <Card className="bg-cream border-beige-medium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold text-charcoal mt-1">{formatValue(value)}</p>
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColors[variant])}>
            <Icon className={cn('w-5 h-5', iconColors[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NowPlayingCard({
  song,
  elapsed,
  duration,
  isLive,
  streamerName,
  art,
}: {
  song: { title: string; artist: string; album: string; art: string } | null;
  elapsed: number;
  duration: number;
  isLive: boolean;
  streamerName: string;
  art: string | null;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const artUrl = song?.art || art || '/placeholder-album.png';

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Music className="w-4 h-4 text-vermelho" />
          Tocando Agora
          {isLive && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              <Mic className="w-3 h-3" />
              AO VIVO
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-beige-medium flex-shrink-0">
            <img
              src={artUrl}
              alt={song?.title || 'Album art'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            {isLive ? (
              <>
                <p className="font-semibold text-charcoal truncate">Transmissão Ao Vivo</p>
                <p className="text-sm text-muted-foreground truncate">{streamerName || 'DJ Ao Vivo'}</p>
              </>
            ) : song ? (
              <>
                <p className="font-semibold text-charcoal truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                {song.album && (
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{song.album}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">A carregar...</p>
            )}

            {!isLive && duration > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-beige-medium rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-vermelho to-vermelho-soft rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{formatTime(elapsed)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ListenerSnapshot {
  time: string;
  listeners: number;
}

function ListenersHistoryChart({ snapshots }: { snapshots: ListenerSnapshot[] }) {
  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Activity className="w-4 h-4 text-vermelho" />
          Ouvintes em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        {snapshots.length < 2 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">A recolher dados...</p>
            <p className="text-xs text-muted-foreground mt-1">O gráfico aparece após alguns minutos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={snapshots} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.vermelho} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.vermelho} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#999' }}
                tickLine={false}
                axisLine={{ stroke: '#e5ddd0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#999' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2d2d2d',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#ccc' }}
                formatter={(value) => [`${value} ouvintes`, 'Ouvintes']}
              />
              <Area
                type="monotone"
                dataKey="listeners"
                stroke={CHART_COLORS.vermelho}
                strokeWidth={2}
                fill="url(#colorListeners)"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.vermelho }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ListenersByCountryCard({ data }: { data: ListenersByCountry[] }) {
  const chartData = data.slice(0, 5).map((item) => ({
    country: countryNames[item.country] || item.country,
    count: item.count,
  }));

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Globe className="w-4 h-4 text-vermelho" />
          Ouvintes por País
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sem dados de localização disponíveis
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="country"
                tick={{ fontSize: 11, fill: '#555' }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2d2d2d',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} ouvintes`, 'Total']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function SongHistoryCard({ history }: { history: SongHistory[] }) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <History className="w-4 h-4 text-vermelho" />
          Histórico de Músicas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sem histórico disponível
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {history.slice(0, 10).map((item) => (
              <div
                key={item.sh_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-beige-light transition-colors"
              >
                <div className="w-10 h-10 rounded overflow-hidden bg-beige-medium flex-shrink-0">
                  <img
                    src={item.song.art}
                    alt={item.song.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{item.song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.song.artist}</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                  {formatTime(item.played_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NextSongCard({ nextSong }: { nextSong: NowPlayingInfo | null }) {
  if (!nextSong) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <SkipForward className="w-4 h-4 text-vermelho" />
            Próxima Música
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Informação não disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <SkipForward className="w-4 h-4 text-vermelho" />
          Próxima Música
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded overflow-hidden bg-beige-medium flex-shrink-0">
            <img
              src={nextSong.song.art}
              alt={nextSong.song.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-charcoal truncate">{nextSong.song.title}</p>
            <p className="text-sm text-muted-foreground truncate">{nextSong.song.artist}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              {Math.floor(nextSong.duration / 60)}:{(nextSong.duration % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StreamInfoCard({
  stationUrl,
  bitrate,
  format,
  totalConnections,
}: {
  stationUrl: string | null;
  bitrate: number | null;
  format: string | null;
  totalConnections: number;
}) {
  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <Signal className="w-4 h-4 text-vermelho" />
          Informações do Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Conexões</span>
          <span className="font-medium text-charcoal">{totalConnections}</span>
        </div>
        {bitrate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Bitrate</span>
            <span className="font-medium text-charcoal">{bitrate} kbps</span>
          </div>
        )}
        {format && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Formato</span>
            <span className="font-medium text-charcoal uppercase">{format}</span>
          </div>
        )}
        {stationUrl && (
          <div className="pt-2 border-t border-beige-medium">
            <p className="text-xs text-muted-foreground mb-1">URL do Stream</p>
            <code className="text-xs bg-beige-light px-2 py-1 rounded block truncate">
              {stationUrl}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatListeningTime(seconds: number): string {
  if (seconds === 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function PeriodStatsCards({ today, week, month }: { today: RadioPeriodStats; week: RadioPeriodStats; month: RadioPeriodStats }) {
  const periods = [
    { label: 'Hoje', icon: CalendarDays, stats: today, color: 'border-amber-300 bg-amber-50' },
    { label: 'Semana', icon: CalendarRange, stats: week, color: 'border-orange-300 bg-orange-50' },
    { label: 'Mês', icon: Calendar, stats: month, color: 'border-indigo-300 bg-indigo-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {periods.map(({ label, icon: Icon, stats, color }) => (
        <Card key={label} className={`border-2 ${color}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
              <Icon className="w-4 h-4 text-vermelho" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.snapshotCount === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Sem dados ainda
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> Média Ouvintes
                    </p>
                    <p className="text-xl font-bold text-charcoal">{stats.avgListeners}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Pico
                    </p>
                    <p className="text-xl font-bold text-charcoal">{stats.maxListeners}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Headphones className="w-3 h-3" /> Únicos
                    </p>
                    <p className="text-xl font-bold text-charcoal">{stats.totalUnique}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Tempo Médio
                    </p>
                    <p className="text-xl font-bold text-charcoal">{formatListeningTime(stats.avgListeningTime)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-right">{stats.snapshotCount} amostras</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListenersTrendChart({ data }: { data: Array<{ time: string; listeners: number }> }) {
  if (data.length < 2) {
    return (
      <Card className="bg-cream border-beige-medium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
            <TrendingUp className="w-4 h-4 text-vermelho" />
            Tendência de Ouvintes (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Dados insuficientes — o gráfico aparece após acumular mais amostras
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cream border-beige-medium">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-charcoal">
          <TrendingUp className="w-4 h-4 text-vermelho" />
          Tendência de Ouvintes (7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.vermelho} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.vermelho} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: '#999' }}
              tickLine={false}
              axisLine={{ stroke: '#e5ddd0' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2d2d2d',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#ccc' }}
              formatter={(value) => [`${value} ouvintes`, 'Média']}
            />
            <Area
              type="monotone"
              dataKey="listeners"
              stroke={CHART_COLORS.vermelho}
              strokeWidth={2}
              fill="url(#colorTrend)"
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS.vermelho }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function Radio() {
  const { nowPlaying, history, listenersByCountry, loading, error, refresh } = useRadio();
  const { stats: radioStats, loading: statsLoading } = useRadioStats();

  // Track listener snapshots for the real-time chart
  const [listenerSnapshots, setListenerSnapshots] = useState<ListenerSnapshot[]>([]);
  const prevListenersRef = useRef<number | null>(null);

  const isOnline = nowPlaying?.is_online ?? false;
  const currentListeners = nowPlaying?.listeners?.current ?? 0;
  const uniqueListeners = nowPlaying?.listeners?.unique ?? 0;
  const totalListeners = nowPlaying?.listeners?.total ?? 0;
  const isLive = nowPlaying?.live?.is_live ?? false;

  const currentSong = nowPlaying?.now_playing?.song ?? null;
  const elapsed = nowPlaying?.now_playing?.elapsed ?? 0;
  const duration = nowPlaying?.now_playing?.duration ?? 0;

  // Stream info
  const stationUrl = nowPlaying?.station?.listen_url ?? null;
  const mount = nowPlaying?.station?.mounts?.[0];
  const bitrate = mount?.bitrate ?? null;
  const format = mount?.format ?? null;

  // Record listener snapshots on each poll
  useEffect(() => {
    if (nowPlaying && currentListeners !== prevListenersRef.current) {
      prevListenersRef.current = currentListeners;
      const now = new Date();
      const time = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      setListenerSnapshots((prev) => {
        const updated = [...prev, { time, listeners: currentListeners }];
        // Keep last 60 snapshots (30 min at 30s intervals)
        return updated.slice(-60);
      });
    }
  }, [nowPlaying, currentListeners]);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-charcoal">Rádio</h2>
          <p className="text-sm text-muted-foreground">
            Métricas e estatísticas da rádio em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
              isOnline
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-gray-50 border border-gray-200 text-gray-500'
            )}
          >
            <span
              className={cn('w-2 h-2 rounded-full', isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400')}
            />
            {isOnline ? 'Rádio Online' : 'Rádio Offline'}
          </div>

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-beige-medium"
                disabled={loading || !nowPlaying}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => generateRadioPDF({ nowPlaying, history, listenersByCountry })}
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => generateRadioCSV({ nowPlaying, history, listenersByCountry })}
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
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Loading State */}
      {loading && !nowPlaying ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Ouvintes Agora"
              value={currentListeners}
              icon={Headphones}
            />
            <StatCard
              title="Ouvintes Únicos"
              value={uniqueListeners}
              icon={Users}
            />
            <StatCard
              title="Status"
              value={isLive ? 'Ao Vivo' : isOnline ? 'AutoDJ' : 'Offline'}
              icon={isLive ? Mic : RadioIcon}
              format="text"
              variant={isLive ? 'live' : isOnline ? 'default' : 'offline'}
            />
            <StatCard
              title="Estação"
              value={nowPlaying?.station?.name ?? 'A carregar...'}
              icon={RadioIcon}
              format="text"
            />
          </div>

          {/* Now Playing + Next Song */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <NowPlayingCard
              song={currentSong}
              elapsed={elapsed}
              duration={duration}
              isLive={isLive}
              streamerName={nowPlaying?.live?.streamer_name ?? ''}
              art={nowPlaying?.live?.art ?? null}
            />
            <NextSongCard nextSong={nowPlaying?.playing_next ?? null} />
            <ListenersByCountryCard data={listenersByCountry} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ListenersHistoryChart snapshots={listenerSnapshots} />
            </div>
            <StreamInfoCard
              stationUrl={stationUrl}
              bitrate={bitrate}
              format={format}
              totalConnections={totalListeners}
            />
          </div>

          {/* Historical Stats */}
          {!statsLoading && (
            <>
              <PeriodStatsCards
                today={radioStats.today}
                week={radioStats.week}
                month={radioStats.month}
              />

              <ListenersTrendChart data={radioStats.history} />
            </>
          )}

          {/* Song History */}
          <SongHistoryCard history={history} />
        </>
      )}
    </div>
  );
}
