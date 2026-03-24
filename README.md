# Olha que Duas - Admin

Painel administrativo para gerenciar eventos, programacao semanal, newsletters, analytics e radio do podcast.

## Setup

1. Instale as dependencias:
```bash
npm install
```

2. Configure o arquivo `.env` com as credenciais:
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

Variaveis necessarias:
- `VITE_SUPABASE_URL` - URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anonima do Supabase
- `VITE_ADMIN_PASSWORD` - Senha de acesso ao painel
- `VITE_IMGBB_API_KEY` - Chave da API ImgBB (obter em https://api.imgbb.com/)

3. Execute o SQL em `supabase-schema.sql` no Supabase para criar as tabelas

4. Crie o bucket `event-icons` no Supabase Storage (publico para leitura)

5. Deploy das edge functions:
```bash
npx supabase functions deploy brevo-send
npx supabase functions deploy brevo-subscribers
npx supabase functions deploy brevo-campaigns
npx supabase functions deploy umami-proxy
npx supabase functions deploy azuracast-proxy
```

6. Configure as secrets no Supabase:

**Brevo (Newsletter):**
```bash
npx supabase secrets set BREVO_API_KEY=your-brevo-api-key
npx supabase secrets set BREVO_LIST_ID=your-list-id
npx supabase secrets set BREVO_SENDER_EMAIL=newsletter@olhaqueduas.com
npx supabase secrets set BREVO_SENDER_NAME="Olha que Duas"
```

**Umami (Analytics):**
```bash
npx supabase secrets set UMAMI_API_KEY=your-umami-api-key
npx supabase secrets set UMAMI_WEBSITE_ID=your-website-id
```

**AzuraCast (Radio):**
```bash
npx supabase secrets set AZURACAST_URL=https://radio.olhaqueduas.com
npx supabase secrets set AZURACAST_API_KEY=your-azuracast-api-key
npx supabase secrets set AZURACAST_STATION_ID=1
```

7. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Funcionalidades

### Eventos
- Criar, editar e excluir eventos
- Upload de ícone 128x128 PNG
- Ativar/desativar eventos

### Programação Semanal
- Grade visual por dia da semana
- Adicionar múltiplos horários por dia
- Seleção simples de dia e horário via dropdown
- Remover eventos da programação

### Newsletter
- **Editor de blocos** - Sistema modular com blocos de texto e imagem
- **Editor Rich Text** - Formatacao completa com TipTap:
  - Negrito, italico, sublinhado, riscado
  - Titulos (H1, H2) e paragrafos
  - Listas com pontos e numeradas
  - Alinhamento de texto (esquerda, centro, direita)
  - Links
  - Desfazer/refazer
- **Upload de imagens** - Via ImgBB (gratuito, sem limite de tempo)
- **Galeria de imagens** - Reutilizacao de imagens ja carregadas (localStorage)
- **Preview em tempo real** - Visualizacao desktop e mobile
- **Integracao Brevo** - Envio de campanhas e emails de teste
- **Historico de campanhas** - Estatisticas de abertura, cliques, etc.
- **Lista de subscritores** - Visualizacao dos subscritores ativos

### Analytics (Umami)
- **Metricas do site** - Pageviews, visitantes, sessoes, tempo medio
- **Comparacao temporal** - vs periodo anterior (24h, 7d, 30d, 90d)
- **Metricas por tipo**:
  - Paginas mais visitadas
  - Paises
  - Navegadores
  - Dispositivos (desktop, mobile, tablet)
  - Sistemas operacionais
  - Fontes de trafego (referrers)
- **Grafico de pageviews** - Visualizacao por dia
- **Exportacao de relatorios** - PDF e CSV

### Radio (AzuraCast)
- **Status em tempo real** - Online/Offline, Ao Vivo/AutoDJ
- **Ouvintes** - Atuais, unicos, total de conexoes
- **Tocando agora** - Musica atual com artwork e barra de progresso
- **Proxima musica** - Preview da proxima faixa
- **Ouvintes por pais** - Distribuicao geografica
- **Historico de musicas** - Ultimas 10 faixas tocadas
- **Informacoes do stream** - Bitrate, formato, URL
- **Exportacao de relatorios** - PDF e CSV
- **Polling automatico** - Atualizacao a cada 30 segundos

## Tecnologias

- React + TypeScript + Vite
- TailwindCSS
- Supabase (Database, Edge Functions, Storage)
- TipTap (Editor Rich Text)
- Brevo (Email Marketing)
- ImgBB (Hosting de Imagens)
- Umami Cloud (Analytics)
- AzuraCast (Radio Streaming)

## TODO

- [ ] **Mobile Analytics** - Adicionar tracking Umami ao app React Native/Expo quando for lancado
  - Tracking de telas visitadas
  - Eventos de interacao (play/pause radio, etc.)
  - Integracao com o mesmo Umami Cloud do site
