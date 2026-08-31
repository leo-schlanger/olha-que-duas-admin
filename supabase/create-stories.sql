-- ============================================================
-- Histórias em episódios (folhetim)
-- ============================================================
-- Objetivo: publicar ficção seriada no site. O episódio 1 vai
-- para o Facebook, os restantes vivem no site — uma URL por
-- episódio, que é o que multiplica pageviews e captação de email.
--
-- Agendamento sem cron: published_at no futuro = agendado.
-- O site filtra sempre por is_published = true AND published_at <= now().
-- ============================================================

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  tagline VARCHAR(200) DEFAULT '',        -- frase de gancho para o catálogo
  synopsis TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  genre VARCHAR(60) DEFAULT '',           -- 'drama', 'romance', 'misterio'...
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'em_curso'
    CHECK (status IN ('em_curso', 'concluida', 'pausada')),
  planned_episodes INTEGER DEFAULT 0,     -- nº anunciado ao público (0 = não anunciar)
  total_views INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE story_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number > 0),
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL DEFAULT '',       -- HTML produzido pelo TipTap
  excerpt VARCHAR(400) DEFAULT '',        -- usado no OG e no cartão
  cliffhanger VARCHAR(400) DEFAULT '',    -- gancho, entra no post do Facebook
  cover_url TEXT DEFAULT '',
  reading_minutes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,               -- no futuro = agendado
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (story_id, number)
);

CREATE INDEX idx_stories_published ON stories(is_published, published_at DESC);
CREATE INDEX idx_stories_slug ON stories(slug);
CREATE INDEX idx_episodes_story ON story_episodes(story_id, number);
CREATE INDEX idx_episodes_published ON story_episodes(is_published, published_at DESC);

-- ------------------------------------------------------------
-- Mantém updated_at da história fresco quando os episódios mudam
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_story_on_episode_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories SET
    updated_at = NOW()
  WHERE id = COALESCE(NEW.story_id, OLD.story_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_story_on_episode_change
  AFTER INSERT OR DELETE ON story_episodes
  FOR EACH ROW EXECUTE FUNCTION touch_story_on_episode_change();

-- ------------------------------------------------------------
-- Contador de leituras (chamado pelo site, sem expor UPDATE)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_episode_views(episode_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE story_episodes SET views = views + 1 WHERE id = episode_uuid;
  UPDATE stories SET total_views = total_views + 1
    WHERE id = (SELECT story_id FROM story_episodes WHERE id = episode_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_episodes ENABLE ROW LEVEL SECURITY;

-- Leitura pública: apenas o que já está publicado E cuja data já chegou.
-- Garante que episódios agendados não vazam antes da hora, mesmo para
-- quem extraia a anon key do bundle do site.
CREATE POLICY "Public read published stories" ON stories
  FOR SELECT USING (
    is_published = true AND (published_at IS NULL OR published_at <= NOW())
  );

CREATE POLICY "Public read published episodes" ON story_episodes
  FOR SELECT USING (
    is_published = true AND (published_at IS NULL OR published_at <= NOW())
  );

-- Escrita e leitura de rascunhos: apenas sessão autenticada.
CREATE POLICY "Authenticated read all stories" ON stories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write stories" ON stories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read all episodes" ON story_episodes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write episodes" ON story_episodes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ############################################################
-- TRANSIÇÃO — remover assim que o admin usar Supabase Auth
-- ############################################################
-- O admin atual autentica com uma password guardada em
-- VITE_ADMIN_PASSWORD (ou seja, dentro do bundle) e fala com o
-- Supabase pela anon key. Não existe sessão `authenticated`, por
-- isso sem as duas políticas abaixo o painel não consegue criar
-- nem editar histórias.
--
-- Enquanto estiverem ativas, qualquer pessoa com a anon key
-- consegue ler rascunhos e escrever nestas tabelas — as políticas
-- de RLS somam-se, não se sobrepõem. Para fechar:
--   1. Criar utilizador em Supabase > Authentication > Users
--   2. Trocar checkPassword() por supabase.auth.signInWithPassword()
--   3. DROP das duas políticas abaixo
-- ############################################################
CREATE POLICY "TEMP anon write stories" ON stories
  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "TEMP anon write episodes" ON story_episodes
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Storage
-- ------------------------------------------------------------
-- As capas usam o bucket 'media-library' que já existe.
-- Não é preciso criar bucket novo.
