-- Vídeo da peça (2026-10-30), para os reels das Lendas de Portugal.
-- Só acrescenta colunas; as peças que existem ficam com vídeo vazio.
-- video_url: MP4 H.264 com faststart no media-library (o projeto aceita até 50 MB por ficheiro).
-- video_poster_url: primeiro frame/cartaz no formato do vídeo (9:16); vazio = cover_url.
-- video_duration_seconds: duração, para o VideoObject do JSON-LD.
-- O site mostra o vídeo no lugar da capa; a capa 16:10 continua nos cartões e no og.
ALTER TABLE vinagre_posts ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '';
ALTER TABLE vinagre_posts ADD COLUMN IF NOT EXISTS video_poster_url TEXT NOT NULL DEFAULT '';
ALTER TABLE vinagre_posts ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER
  CHECK (video_duration_seconds IS NULL OR video_duration_seconds > 0);
NOTIFY pgrst, 'reload schema';
