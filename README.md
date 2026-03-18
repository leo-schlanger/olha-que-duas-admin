# Olha que Duas - Admin

Painel administrativo para gerenciar eventos, programação semanal e newsletters do podcast.

## Setup

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env` com as credenciais:
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

Variáveis necessárias:
- `VITE_SUPABASE_URL` - URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `VITE_ADMIN_PASSWORD` - Senha de acesso ao painel
- `VITE_IMGBB_API_KEY` - Chave da API ImgBB (obter em https://api.imgbb.com/)

3. Execute o SQL em `supabase-schema.sql` no Supabase para criar as tabelas

4. Crie o bucket `event-icons` no Supabase Storage (público para leitura)

5. Deploy das edge functions:
```bash
npx supabase functions deploy brevo-send --project-ref YOUR_PROJECT_REF
npx supabase functions deploy brevo-subscribers --project-ref YOUR_PROJECT_REF
npx supabase functions deploy brevo-campaigns --project-ref YOUR_PROJECT_REF
```

6. Configure as secrets do Brevo no Supabase:
```bash
npx supabase secrets set BREVO_API_KEY=your-brevo-api-key --project-ref YOUR_PROJECT_REF
npx supabase secrets set BREVO_LIST_ID=your-list-id --project-ref YOUR_PROJECT_REF
npx supabase secrets set BREVO_SENDER_EMAIL=newsletter@olhaqueduas.com --project-ref YOUR_PROJECT_REF
npx supabase secrets set BREVO_SENDER_NAME="Olha que Duas" --project-ref YOUR_PROJECT_REF
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
- **Editor Rich Text** - Formatação completa com TipTap:
  - Negrito, itálico, sublinhado, riscado
  - Títulos (H1, H2) e parágrafos
  - Listas com pontos e numeradas
  - Alinhamento de texto (esquerda, centro, direita)
  - Links
  - Desfazer/refazer
- **Upload de imagens** - Via ImgBB (gratuito, sem limite de tempo)
- **Galeria de imagens** - Reutilização de imagens já carregadas (localStorage)
- **Preview em tempo real** - Visualização desktop e mobile
- **Integração Brevo** - Envio de campanhas e emails de teste
- **Histórico de campanhas** - Estatísticas de abertura, cliques, etc.
- **Lista de subscritores** - Visualização dos subscritores ativos

## Tecnologias

- React + TypeScript + Vite
- TailwindCSS
- Supabase (Database, Edge Functions, Storage)
- TipTap (Editor Rich Text)
- Brevo (Email Marketing)
- ImgBB (Hosting de Imagens)
