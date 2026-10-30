-- Lendas de Portugal, lenda 4: Almas penadas e avantesmas.
-- Peça = reel 9:16 (~2 min) + texto. Correr depois de seed-lendas-de-portugal.sql.
--
-- ENTRA COMO RASCUNHO (is_published=false). Não publicar sem o Leo dizer que o
-- vídeo foi aprovado pelo qa. O ON CONFLICT não mexe em is_published nem em
-- published_at: voltar a correr isto não esconde nem republica a peça.
--
-- Antes de aplicar, trocar os PENDENTE (o bloco termina com uma verificação que
-- aborta tudo se sobrar algum):
--   texto, resumo e descrição: redator, supabase/rascunhos/lendas-portugal.md (lenda 4);
--   vídeo: Desktop/video/entregas/olha-que-duas/lendas-portugal/ (aprovado pelo qa),
--     versão web 720x1280 H.264 CRF ~26 +faststart (< 50 MB, limite do projeto) e
--     poster 720x1280 do 1.º plano com título; video_duration_seconds = ffprobe;
--   capa 1600x1000 e og 1200x630: designer, arte/site/ (lenda-4-almas-penadas).
-- Ficheiros no media-library: exclusivo-almas-penadas-e-avantesmas.mp4, exclusivo-almas-penadas-e-avantesmas-poster.jpg,
--   exclusivo-almas-penadas-e-avantesmas-capa.jpg, exclusivo-almas-penadas-e-avantesmas-og.jpg.

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'almas-penadas-e-avantesmas',
  'Almas penadas e avantesmas',
  'PENDENTE: resumo do redator',
  $lenda4$<p>PENDENTE: texto do redator (supabase/rascunhos/lendas-portugal.md, lenda 4).</p>$lenda4$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-almas-penadas-e-avantesmas-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-almas-penadas-e-avantesmas-og.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-almas-penadas-e-avantesmas.mp4',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-almas-penadas-e-avantesmas-poster.jpg',
  NULL,
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'lendas-de-portugal'),
  '',
  'Almas penadas e avantesmas | Lendas de Portugal',
  'PENDENTE: descrição para o Google, até 155 caracteres'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  video_url = EXCLUDED.video_url,
  video_poster_url = EXCLUDED.video_poster_url,
  video_duration_seconds = EXCLUDED.video_duration_seconds,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM vinagre_posts
    WHERE slug = 'almas-penadas-e-avantesmas'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%')
  ) THEN
    RAISE EXCEPTION 'almas-penadas-e-avantesmas: há campos PENDENTE ou falta o programa; nada foi gravado';
  END IF;
END
$guard$;

COMMIT;

-- Publicar (SÓ depois de o Leo dizer que o vídeo foi aprovado pelo qa).
-- Hora já passada: a leitura filtra published_at <= now().
-- UPDATE vinagre_posts SET is_published = true, published_at = now() - interval '1 minute'
--   WHERE slug = 'almas-penadas-e-avantesmas';
