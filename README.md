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
- `VITE_IMGBB_API_KEY` - Chave da API ImgBB (obter em https://api.imgbb.com/)

3. Execute o SQL em `supabase-schema.sql` no Supabase para criar as tabelas

4. Crie o bucket `event-icons` no Supabase Storage (publico para leitura)

5. Autenticacao e analytics da radio (executar por esta ordem):
   - `supabase/admin-auth.sql` - tabela `admin_users`, funcao `is_admin()` e RLS (escrita so para admins)
   - `supabase/analytics-v2.sql` - tabela `listener_connections` e RPCs da aba Audiencia
   - `supabase/analytics-v2-sources.sql` - app identificada pelo user-agent `OlhaQueDuas/…`, divisao telemovel/computador,
     detalhe por aplicacao e saude da recolha (aplicar ANTES do deploy do `radio-snapshot-cron`)
   - Em Auth, desative os registos publicos (`disable_signup`), crie o utilizador admin e insira o email:
     ```sql
     INSERT INTO admin_users (email) VALUES ('admin@exemplo.com');
     ```

6. Deploy das edge functions (as funcoes do painel validam a sessao de admin no codigo):
```bash
npx supabase functions deploy brevo-send --no-verify-jwt
npx supabase functions deploy brevo-subscribers --no-verify-jwt
npx supabase functions deploy brevo-campaigns --no-verify-jwt
npx supabase functions deploy brevo-lists --no-verify-jwt
npx supabase functions deploy brevo-move-subscriber --no-verify-jwt
npx supabase functions deploy brevo-unsubscribe --no-verify-jwt
npx supabase functions deploy brevo-subscribe
npx supabase functions deploy umami-proxy
npx supabase functions deploy azuracast-proxy --no-verify-jwt
npx supabase functions deploy radio-snapshot-cron --no-verify-jwt
```

7. Configure as secrets no Supabase:

**Brevo (Newsletter):**
```bash
npx supabase secrets set BREVO_API_KEY=your-brevo-api-key
npx supabase secrets set BREVO_LIST_ID=your-list-id
npx supabase secrets set BREVO_SENDER_EMAIL=newsletter@olhaqueduas.com
npx supabase secrets set BREVO_SENDER_NAME="Olha que Duas"
```

**Umami (Analytics):**
A aba Analytics usa a Share URL pública do Umami (`VITE_UMAMI_SHARE_URL`).
O browser nunca chama `cloud.umami.is` diretamente (ad blockers bloqueiam);
os pedidos passam por `/api/umami-proxy` no Vercel. Opcional, para o proxy Supabase:
```bash
npx supabase secrets set UMAMI_SHARE_ID=your-share-id
npx supabase secrets set UMAMI_REGION=eu
```

**AzuraCast (Radio):**
```bash
npx supabase secrets set AZURACAST_URL=https://radio.olhaqueduas.com
npx supabase secrets set AZURACAST_API_KEY=your-azuracast-api-key
npx supabase secrets set AZURACAST_STATION_ID=1
npx supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
```

O `radio-snapshot-cron` corre a cada 5 min via pg_cron (`supabase/create-snapshot-cron.sql`).
Para recolher o historico de ligacoes do AzuraCast (guarda cerca de 60 dias):
```bash
curl -X POST "$SUPABASE_URL/functions/v1/radio-snapshot-cron" \
  -H "x-cron-secret: $CRON_SECRET" -H "Content-Type: application/json" \
  -d '{"backfill_from": "2026-07-01", "backfill_to": "2026-09-15"}'
```

Testes da logica de recolha: `npx deno test supabase/functions/radio-snapshot-cron/connections.test.ts`

8. Inicie o servidor de desenvolvimento:
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
- **Ouvintes agora** - Atuais, unicos, total de conexoes
- **Musicas** - Mais tocadas e impacto de cada musica nos ouvintes
- **Tocando agora** - Musica atual com artwork e barra de progresso
- **Proxima musica** - Preview da proxima faixa
- **Ouvintes por pais** - Distribuicao geografica
- **Historico de musicas** - Ultimas 10 faixas tocadas
- **Informacoes do stream** - Bitrate, formato, URL
- **Exportacao de relatorios** - PDF e CSV
- **Polling automatico** - Atualizacao a cada 30 segundos

### Audiencia
Fonte: historico de ligacoes do AzuraCast (todas as ligacoes, incluindo as curtas) e fotografias de
ouvintes simultaneos a cada 5 minutos. Tudo em hora de Lisboa.
- **Ouvintes** - IP + aplicacao com pelo menos 1 minuto no periodo
- **Horas ouvidas, sessao tipica, media e pico de simultaneos** - com comparacao ao periodo anterior
- **Origem** - App Android, browser, myTuner, iOS, outras apps (pelo user-agent)
- **Mapa de horas, paises e ouvintes mais fieis** (IP mascarado; IPs apagados apos 90 dias)
- **Audiencia por programa** - grelha diaria e eventos semanais cruzados com as ligacoes
- **Exportacao** - PDF e CSV

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
