// Report Generator Utility
// Generates PDF and CSV reports for Analytics and Radio data

import type { AnalyticsStats } from '../hooks/useAnalytics';
import type { RadioNowPlaying, SongHistory, ListenersByCountry } from '../types/radio';

// CSV Generation
export function generateCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// Download helper
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format date for reports
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Analytics Report
export interface AnalyticsReportData {
  stats: AnalyticsStats | null;
  pageviews: Array<{ x: string; y: number }>;
  pages: Array<{ x: string; y: number }>;
  countries: Array<{ x: string; y: number }>;
  browsers: Array<{ x: string; y: number }>;
  devices: Array<{ x: string; y: number }>;
  referrers: Array<{ x: string; y: number }>;
  timeRange: string;
}

export function generateAnalyticsCSV(data: AnalyticsReportData): void {
  const timestamp = new Date().toISOString().split('T')[0];

  // Summary stats
  const summaryData = data.stats ? [
    { metrica: 'Visualizacoes', valor: data.stats.pageviews.value, anterior: data.stats.pageviews.prev },
    { metrica: 'Visitantes', valor: data.stats.visitors.value, anterior: data.stats.visitors.prev },
    { metrica: 'Sessoes', valor: data.stats.visits.value, anterior: data.stats.visits.prev },
    { metrica: 'Taxa de Rejeicao', valor: data.stats.bounces.value, anterior: data.stats.bounces.prev },
    { metrica: 'Tempo Total (s)', valor: data.stats.totalTime.value, anterior: data.stats.totalTime.prev },
  ] : [];

  generateCSV(summaryData, `analytics-resumo-${timestamp}`);

  // Pages
  if (data.pages.length > 0) {
    const pagesData = data.pages.map(p => ({ pagina: p.x, visitas: p.y }));
    generateCSV(pagesData, `analytics-paginas-${timestamp}`);
  }

  // Countries
  if (data.countries.length > 0) {
    const countriesData = data.countries.map(c => ({ pais: c.x, visitas: c.y }));
    generateCSV(countriesData, `analytics-paises-${timestamp}`);
  }

  // Devices
  if (data.devices.length > 0) {
    const devicesData = data.devices.map(d => ({ dispositivo: d.x, visitas: d.y }));
    generateCSV(devicesData, `analytics-dispositivos-${timestamp}`);
  }
}

export function generateAnalyticsPDF(data: AnalyticsReportData): void {
  const timestamp = formatDate(new Date());

  let htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Relatorio Analytics - Olha que Duas</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #b4292b; border-bottom: 2px solid #b4292b; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .date { color: #666; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #b4292b; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .stat-change { font-size: 11px; margin-top: 5px; }
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatorio de Analytics</h1>
    <span class="date">Gerado em: ${timestamp}</span>
  </div>
  <p><strong>Periodo:</strong> ${data.timeRange}</p>
`;

  // Stats cards
  if (data.stats) {
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return 0;
      return ((curr - prev) / prev * 100).toFixed(1);
    };

    htmlContent += `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${data.stats.pageviews.value.toLocaleString('pt-PT')}</div>
      <div class="stat-label">Visualizacoes</div>
      <div class="stat-change ${Number(calcChange(data.stats.pageviews.value, data.stats.pageviews.prev)) >= 0 ? 'positive' : 'negative'}">
        ${calcChange(data.stats.pageviews.value, data.stats.pageviews.prev)}% vs anterior
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.stats.visitors.value.toLocaleString('pt-PT')}</div>
      <div class="stat-label">Visitantes</div>
      <div class="stat-change ${Number(calcChange(data.stats.visitors.value, data.stats.visitors.prev)) >= 0 ? 'positive' : 'negative'}">
        ${calcChange(data.stats.visitors.value, data.stats.visitors.prev)}% vs anterior
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.stats.visits.value.toLocaleString('pt-PT')}</div>
      <div class="stat-label">Sessoes</div>
      <div class="stat-change ${Number(calcChange(data.stats.visits.value, data.stats.visits.prev)) >= 0 ? 'positive' : 'negative'}">
        ${calcChange(data.stats.visits.value, data.stats.visits.prev)}% vs anterior
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${Math.round(data.stats.totalTime.value / Math.max(data.stats.visits.value, 1))}s</div>
      <div class="stat-label">Tempo Medio</div>
    </div>
  </div>
`;
  }

  // Pages table
  if (data.pages.length > 0) {
    htmlContent += `
  <div class="section">
    <h2>Paginas Mais Visitadas</h2>
    <table>
      <thead><tr><th>Pagina</th><th>Visitas</th></tr></thead>
      <tbody>
        ${data.pages.map(p => `<tr><td>${p.x || '/'}</td><td>${p.y}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
`;
  }

  // Countries table
  if (data.countries.length > 0) {
    htmlContent += `
  <div class="section">
    <h2>Paises</h2>
    <table>
      <thead><tr><th>Pais</th><th>Visitas</th></tr></thead>
      <tbody>
        ${data.countries.map(c => `<tr><td>${c.x}</td><td>${c.y}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
`;
  }

  // Devices table
  if (data.devices.length > 0) {
    htmlContent += `
  <div class="section">
    <h2>Dispositivos</h2>
    <table>
      <thead><tr><th>Dispositivo</th><th>Visitas</th></tr></thead>
      <tbody>
        ${data.devices.map(d => `<tr><td>${d.x}</td><td>${d.y}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
`;
  }

  // Referrers table
  if (data.referrers.length > 0) {
    htmlContent += `
  <div class="section">
    <h2>Fontes de Trafego</h2>
    <table>
      <thead><tr><th>Origem</th><th>Visitas</th></tr></thead>
      <tbody>
        ${data.referrers.map(r => `<tr><td>${r.x || 'Acesso Direto'}</td><td>${r.y}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
`;
  }

  htmlContent += `
  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
    Olha que Duas - Relatorio gerado automaticamente
  </footer>
</body>
</html>
`;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// Radio Report
export interface RadioReportData {
  nowPlaying: RadioNowPlaying | null;
  history: SongHistory[];
  listenersByCountry: ListenersByCountry[];
}

export function generateRadioCSV(data: RadioReportData): void {
  const timestamp = new Date().toISOString().split('T')[0];

  // Song history
  if (data.history.length > 0) {
    const historyData = data.history.map(h => ({
      hora: new Date(h.played_at * 1000).toLocaleTimeString('pt-PT'),
      titulo: h.song.title,
      artista: h.song.artist,
      album: h.song.album,
      duracao_segundos: h.duration,
    }));
    generateCSV(historyData, `radio-historico-${timestamp}`);
  }

  // Listeners by country
  if (data.listenersByCountry.length > 0) {
    const countryData = data.listenersByCountry.map(c => ({
      pais: c.country,
      ouvintes: c.count,
    }));
    generateCSV(countryData, `radio-ouvintes-pais-${timestamp}`);
  }
}

export function generateRadioPDF(data: RadioReportData): void {
  const timestamp = formatDate(new Date());
  const isOnline = data.nowPlaying?.is_online ?? false;
  const isLive = data.nowPlaying?.live?.is_live ?? false;
  const currentListeners = data.nowPlaying?.listeners?.current ?? 0;
  const uniqueListeners = data.nowPlaying?.listeners?.unique ?? 0;

  let htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Relatorio Radio - Olha que Duas</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
    h1 { color: #b4292b; border-bottom: 2px solid #b4292b; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .date { color: #666; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #b4292b; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-online { background: #dcfce7; color: #166534; }
    .status-offline { background: #f3f4f6; color: #6b7280; }
    .status-live { background: #fef3c7; color: #92400e; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .now-playing { background: linear-gradient(135deg, #b4292b 0%, #d44547 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .now-playing h3 { margin: 0 0 10px 0; font-size: 14px; opacity: 0.9; }
    .now-playing .song { font-size: 20px; font-weight: bold; }
    .now-playing .artist { font-size: 16px; opacity: 0.9; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatorio da Radio</h1>
    <span class="date">Gerado em: ${timestamp}</span>
  </div>

  <p>
    <strong>Estacao:</strong> ${data.nowPlaying?.station?.name ?? 'Olha que Duas Radio'}
    <span class="status-badge ${isLive ? 'status-live' : isOnline ? 'status-online' : 'status-offline'}">
      ${isLive ? 'AO VIVO' : isOnline ? 'ONLINE' : 'OFFLINE'}
    </span>
  </p>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${currentListeners}</div>
      <div class="stat-label">Ouvintes Agora</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${uniqueListeners}</div>
      <div class="stat-label">Ouvintes Unicos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.nowPlaying?.listeners?.total ?? 0}</div>
      <div class="stat-label">Total de Conexoes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.listenersByCountry.length}</div>
      <div class="stat-label">Paises</div>
    </div>
  </div>
`;

  // Now playing
  if (data.nowPlaying?.now_playing?.song) {
    const song = data.nowPlaying.now_playing.song;
    htmlContent += `
  <div class="now-playing">
    <h3>TOCANDO AGORA</h3>
    <div class="song">${song.title}</div>
    <div class="artist">${song.artist}</div>
  </div>
`;
  }

  // Listeners by country
  if (data.listenersByCountry.length > 0) {
    htmlContent += `
  <div class="section">
    <h2>Ouvintes por Pais</h2>
    <table>
      <thead><tr><th>Pais</th><th>Ouvintes</th></tr></thead>
      <tbody>
        ${data.listenersByCountry.map(c => `<tr><td>${c.country}</td><td>${c.count}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
`;
  }

  // Song history
  if (data.history.length > 0) {
    htmlContent += `
  <div class="section">
    <h2>Historico de Musicas</h2>
    <table>
      <thead><tr><th>Hora</th><th>Titulo</th><th>Artista</th></tr></thead>
      <tbody>
        ${data.history.slice(0, 20).map(h => `
          <tr>
            <td>${new Date(h.played_at * 1000).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${h.song.title}</td>
            <td>${h.song.artist}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
  }

  htmlContent += `
  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
    Olha que Duas Radio - Relatorio gerado automaticamente
  </footer>
</body>
</html>
`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
