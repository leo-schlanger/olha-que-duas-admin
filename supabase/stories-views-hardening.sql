-- =============================================================
-- Contador de leituras das histórias: só conta episódios públicos
--
-- increment_episode_views é SECURITY DEFINER e chamada pelo site com a
-- anon key. Sem search_path fixo e sem filtro, contava leituras de
-- rascunhos e episódios agendados (e de histórias não publicadas).
-- =============================================================
CREATE OR REPLACE FUNCTION increment_episode_views(episode_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_story UUID;
BEGIN
  UPDATE story_episodes e
  SET views = e.views + 1
  FROM stories s
  WHERE e.id = episode_uuid
    AND s.id = e.story_id
    AND e.is_published AND (e.published_at IS NULL OR e.published_at <= NOW())
    AND s.is_published AND (s.published_at IS NULL OR s.published_at <= NOW())
  RETURNING e.story_id INTO target_story;

  IF target_story IS NOT NULL THEN
    UPDATE stories SET total_views = total_views + 1 WHERE id = target_story;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION increment_episode_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_episode_views(UUID) TO anon, authenticated, service_role;
