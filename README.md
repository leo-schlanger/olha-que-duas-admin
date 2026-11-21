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
   - `supabase/schedule-dates.sql` - eventos com data (tabela `schedule_dates`, emissoes unicas) e audiencia por programa com essas emissoes
   - `supabase/audiencia-sem-robos.sql` - fotografias de 5 em 5 min sem robos (`radio_human_snapshots`), retencao e resumo (`radio_audience_insights`)
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

### Analytics (Umami + Google Search Console)
- **Resumo em frases** - leituras de peças dos últimos 7 dias vs. os 7 anteriores, peça mais lida, programa mais lido, origem principal
- **Peças mais lidas** - leituras e pessoas por peça, com o título real (`vinagre_posts`) e o programa (`exclusive_programs`), ↑/↓ vs. período anterior; toque na peça → origem dos leitores dessa peça
- **Leituras por programa**, **origem das visitas** (Google, Instagram, Facebook, WhatsApp, Direto, Outros) e **semana a semana** (8 janelas de 7 dias)
- **Pesquisas no Google** (`api/gsc.ts`) - cliques, impressões, CTR, posição média, pesquisas e peças no Google; sem credenciais mostra «Ainda não ligado»
- **Exportação das peças** - PDF e Excel a partir dos mesmos dados do ecrã
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

#### Search Console: variáveis na Vercel (projeto `olha-que-duas-admin`)
- `GSC_SERVICE_ACCOUNT_JSON` = o ficheiro JSON da chave da conta de serviço, inteiro (ou, em alternativa, `GSC_CLIENT_EMAIL` + `GSC_PRIVATE_KEY`)
- `GSC_SITE_URL` = `sc-domain:olhaqueduas.com` (propriedade de domínio) ou `https://www.olhaqueduas.com/` (prefixo de URL), igual ao nome da propriedade no Search Console
- A conta de serviço entra na propriedade como utilizador com acesso restrito; scope `webmasters.readonly`. Depois de pôr as variáveis, publicar de novo (redeploy).
- O endpoint exige sessão de administrador (mesma regra do `_shared/auth.ts`: `auth/v1/user` + `rpc/is_admin`) e lê `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` do ambiente do servidor.

#### Achados (21/11/2026)
- Umami `metrics?type=path` devolve **pessoas** (visitantes) em `y`, não visualizações: para leituras usa-se `metrics/expanded` (pageviews, visitors, visits por linha). O `stats` com filtro `path=` confirma (263 leituras / 243 pessoas na peça do Mourinho, 30 dias).
- Desde 20/11/2026 `/exclusivo/<prog>/<slug>` faz 301 para `/programas/<prog>/<slug>`; há ainda `/exclusivo/<slug>` (8 notícias antigas) e `olha-que-duas-e-eu` → Notícias. `src/lib/pecasAnalytics.ts` (`piecePathOf`) espelha o `legacyRedirect` do site e junta todos os endereços na mesma peça; o programa vem do `program_id` da peça, não do endereço. Lista `LEGACY_NEWS_SLUGS` copiada do `middleware.ts` do site: se mudar lá, mudar cá.
- O Umami não aceita `unit=week` (400): as semanas são 8 pedidos de 7 dias seguidos que acabam agora (comparáveis entre si).
- A lista de referrers não traz as visitas diretas; o «Direto» vem de `type=channel` (`direct`). O WhatsApp quase nunca manda referrer (30 dias sem nenhum host WhatsApp): conta como «Direto».
- «Pessoas» de uma peça = soma das pessoas de cada endereço (quem abriu o antigo e o novo conta 2×; raro). Por programa só se mostram leituras (somáveis).
- `api/umami-proxy.ts` é público (sem sessão): só lê o share token, que já é público. O `api/gsc.ts` não é: exige admin.
- Testes: `npm test` (`node --test`, Node 24 corre .ts direto); `tests/fixtures/umami-paths-30d.json` é uma amostra real de 30 dias.

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
- **Em resumo** - frases simples no topo (ouvintes e horas vs periodo anterior, momento com mais gente, hora e dia mais fortes, programa); mesmas frases no PDF e no Excel
- **Quanto tempo ficam a ouvir** - escutas por duracao (< 5 min, 5-15, 15-60, > 1 h), ouvintes em 2+ dias e que ja tinham ouvido no periodo anterior
- **Audiencia por programa** - grelha diaria, eventos semanais e emissoes com data cruzados com as ligacoes
- **Exportacao** - PDF, Excel (uma folha por bloco) e CSV
- Testes das frases: `node --test tests/audience-insights.test.ts`

#### Achados da audiencia (21/11/2026)
- Desde 01/11/2026 uma ligacao `curl/8.5.0` (IP 46.225.17.x, Nuremberga) esta ligada ao stream 24 h por dia.
  As metricas de ligacoes ja excluiam robos, mas as fotografias de 5 min (`listeners_current` do AzuraCast) contavam-na:
  a media de simultaneos aparecia 1,1 em vez de 0,12, o "tempo com alguem a ouvir" 100 % e o mapa de horas todo preenchido.
  `audiencia-sem-robos.sql` desconta os robos ligados em cada fotografia (hash distinto, folga de 30 s); reconciliacao em prod:
  99,8 % das 17 276 fotografias de 60 dias batem com a contagem de ligacoes nao-robo. Quem e o curl ainda esta por saber.
- O historico de ligacoes comeca a 15/06/2026: a comparacao dos 90 dias fica escondida (`prev_complete = false`).
- As RPCs de audiencia nao correm com `db query --read-only` (EXECUTE so para authenticated/service_role): para conferir
  numeros usa `db query --linked --yes` com SELECT puro, ou o truque `DO ... RAISE EXCEPTION` para testar SQL novo sem gravar.
- Ouvinte = hash IP + user-agent: atualizar a app ou mudar de rede conta como ouvinte novo, por isso "ja tinham ouvido" fica por baixo.

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
