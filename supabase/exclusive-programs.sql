-- ============================================================
-- Exclusivo Olha que Duas — vários programas, o mesmo esqueleto
-- A tabela das postagens continua a chamar-se vinagre_posts.
-- Cada linha passa a pertencer a um programa.
-- Correr isto ANTES de publicar as Curtas Biografias.
-- As postagens antigas ficam no programa do Eduardo Vinagre.
-- ============================================================

CREATE TABLE IF NOT EXISTS exclusive_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  author VARCHAR(120) NOT NULL,
  tagline VARCHAR(240) NOT NULL DEFAULT '',
  description VARCHAR(400) NOT NULL DEFAULT '',
  portrait_url TEXT NOT NULL DEFAULT '',
  portrait_focus VARCHAR(40) NOT NULL DEFAULT 'center',
  cover_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_exclusive_program_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exclusive_programs_updated_at ON exclusive_programs;
CREATE TRIGGER trg_exclusive_programs_updated_at
  BEFORE UPDATE ON exclusive_programs
  FOR EACH ROW EXECUTE FUNCTION set_exclusive_program_updated_at();

ALTER TABLE exclusive_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published exclusive programs" ON exclusive_programs;
CREATE POLICY "Public read published exclusive programs" ON exclusive_programs
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admin read exclusive programs" ON exclusive_programs;
CREATE POLICY "Admin read exclusive programs" ON exclusive_programs
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin write exclusive programs" ON exclusive_programs;
CREATE POLICY "Admin write exclusive programs" ON exclusive_programs
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON exclusive_programs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON exclusive_programs TO authenticated;
GRANT ALL ON exclusive_programs TO service_role;

INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  '7c2a9e14-5b60-4f83-9d21-6a0e8c4b17d3',
  'olha-que-duas-e-eu',
  'Olha que Duas e Eu',
  'Eduardo Vinagre',
  'O que ele ouve, vê e escreve para o Olha que Duas',
  'A coluna exclusiva de Eduardo Vinagre. Notícias, bastidores e o que não sai no resto da imprensa.',
  'https://www.olhaqueduas.com/exclusivo/eduardo-vinagre.jpg',
  'center 64%',
  '',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  portrait_url = EXCLUDED.portrait_url,
  portrait_focus = EXCLUDED.portrait_focus,
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published;

ALTER TABLE vinagre_posts
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES exclusive_programs(id) ON DELETE RESTRICT;

UPDATE vinagre_posts
SET program_id = '7c2a9e14-5b60-4f83-9d21-6a0e8c4b17d3'
WHERE program_id IS NULL;

ALTER TABLE vinagre_posts
  ALTER COLUMN program_id SET DEFAULT '7c2a9e14-5b60-4f83-9d21-6a0e8c4b17d3';

ALTER TABLE vinagre_posts
  ALTER COLUMN program_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vinagre_posts_program_published
  ON vinagre_posts (program_id, is_published, published_at DESC);
