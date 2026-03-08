# Olha que Duas - Admin

Painel administrativo para gerenciar eventos e programação semanal do podcast.

## Setup

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env` com as credenciais do Supabase:
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

3. Execute o SQL em `supabase-schema.sql` no Supabase para criar as tabelas

4. Crie o bucket `event-icons` no Supabase Storage (público para leitura)

5. Inicie o servidor de desenvolvimento:
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
