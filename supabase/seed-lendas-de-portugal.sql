-- Lendas de Portugal (2026-10-30): quatro lendas do Norte em reels animados 9:16
-- (~2 min), com a voz da Alexandra e a réplica da Marluce. Uma peça por lenda:
-- o reel (vinagre_posts.video_url) e o texto.
-- Correr depois de exclusive-programs.sql e de vinagre-posts-video.sql.
-- Imagens no media-library, do designer
-- (Desktop/video/projetos/lendas-portugal-2026/arte/site/: capa-programa-3x4.jpg, retrato.jpg).
--
-- O programa entra ESCONDIDO (is_published=false). Fica visível no passo
-- «Publicar» de lendas-portugal-1-*.sql, quando a 1.ª peça for publicada.
-- O ON CONFLICT não mexe em is_published: voltar a correr isto não esconde o programa.
-- Peças: lendas-portugal-1-as-bruxas-de-tras-os-montes.sql … lendas-portugal-4-*.sql.

INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  '36fc7e0c-174d-4821-b2fd-5d7a79eba4f5',
  'lendas-de-portugal',
  'Lendas de Portugal',
  'Olha que Duas',
  'Lendas do Norte contadas à luz da vela',
  'Quatro lendas do Norte contadas à luz da vela, em reels animados com as vozes de Alexandra Serra e Marluce Revorêdo. Na rádio de 31/10 a 2/11.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-retrato-lendas-de-portugal.jpg',
  'center',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-lendas-de-portugal.jpg',
  6,
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  portrait_url = EXCLUDED.portrait_url,
  portrait_focus = EXCLUDED.portrait_focus,
  cover_url = EXCLUDED.cover_url,
  sort_order = EXCLUDED.sort_order;
