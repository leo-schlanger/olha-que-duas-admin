-- =============================================================
-- Autenticação do painel com Supabase Auth
--
-- Antes: a password estava no JavaScript do painel (VITE_ADMIN_PASSWORD)
-- e as tabelas/buckets aceitavam escrita anónima com a chave pública.
-- Agora: só utilizadores autenticados que constem de admin_users escrevem
-- conteúdo e leem dados de ouvintes. O site e a app continuam a ler o que
-- é público.
--
-- Complementos fora do SQL (Management API / Dashboard):
--   * Auth > desativar registos públicos (disable_signup = true)
--   * Criar o utilizador admin e inserir o email em admin_users
-- =============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sem políticas: só service_role / funções SECURITY DEFINER acedem.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', '') = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated, service_role;

-- -------------------------------------------------------------
-- events / schedule / daily_schedule: leitura pública, escrita admin
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all on events" ON events;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
DROP POLICY IF EXISTS "Allow public read access on events" ON events;
DROP POLICY IF EXISTS "Public read events" ON events;
DROP POLICY IF EXISTS "Admin write events" ON events;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Admin write events" ON events
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Allow all on schedule" ON schedule;
DROP POLICY IF EXISTS "Allow all operations on schedule" ON schedule;
DROP POLICY IF EXISTS "Allow public read access on schedule" ON schedule;
DROP POLICY IF EXISTS "Public read schedule" ON schedule;
DROP POLICY IF EXISTS "Admin write schedule" ON schedule;
CREATE POLICY "Public read schedule" ON schedule FOR SELECT USING (true);
CREATE POLICY "Admin write schedule" ON schedule
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Allow all ops" ON daily_schedule;
DROP POLICY IF EXISTS "Allow all operations on daily_schedule" ON daily_schedule;
DROP POLICY IF EXISTS "Allow public read" ON daily_schedule;
DROP POLICY IF EXISTS "Allow public read on daily_schedule" ON daily_schedule;
DROP POLICY IF EXISTS "Public read daily_schedule" ON daily_schedule;
DROP POLICY IF EXISTS "Admin write daily_schedule" ON daily_schedule;
CREATE POLICY "Public read daily_schedule" ON daily_schedule FOR SELECT USING (true);
CREATE POLICY "Admin write daily_schedule" ON daily_schedule
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- -------------------------------------------------------------
-- stories / story_episodes: público só vê publicado; admin gere tudo
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "TEMP anon write stories" ON stories;
DROP POLICY IF EXISTS "TEMP anon write episodes" ON story_episodes;
DROP POLICY IF EXISTS "Authenticated read all stories" ON stories;
DROP POLICY IF EXISTS "Authenticated write stories" ON stories;
DROP POLICY IF EXISTS "Authenticated read all episodes" ON story_episodes;
DROP POLICY IF EXISTS "Authenticated write episodes" ON story_episodes;
DROP POLICY IF EXISTS "Admin read all stories" ON stories;
DROP POLICY IF EXISTS "Admin write stories" ON stories;
DROP POLICY IF EXISTS "Admin read all episodes" ON story_episodes;
DROP POLICY IF EXISTS "Admin write episodes" ON story_episodes;

CREATE POLICY "Admin read all stories" ON stories
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin write stories" ON stories
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin read all episodes" ON story_episodes
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin write episodes" ON story_episodes
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- -------------------------------------------------------------
-- Storage: buckets públicos para leitura, escrita só admin
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;
DROP POLICY IF EXISTS "Schedule icons public upload" ON storage.objects;
DROP POLICY IF EXISTS "Schedule icons public update" ON storage.objects;
DROP POLICY IF EXISTS "Schedule icons public delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin insert panel buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin update panel buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete panel buckets" ON storage.objects;

CREATE POLICY "Admin insert panel buckets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('event-icons', 'schedule-icons', 'media-library') AND public.is_admin());
CREATE POLICY "Admin update panel buckets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('event-icons', 'schedule-icons', 'media-library') AND public.is_admin())
  WITH CHECK (bucket_id IN ('event-icons', 'schedule-icons', 'media-library') AND public.is_admin());
CREATE POLICY "Admin delete panel buckets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('event-icons', 'schedule-icons', 'media-library') AND public.is_admin());
