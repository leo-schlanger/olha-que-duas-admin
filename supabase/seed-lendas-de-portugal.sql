-- Lendas de Portugal (2026-10-30): quatro lendas do Norte em reels animados 9:16
-- (~2 min), contadas pela Alexandra, com a réplica da Marluce. Uma peça por lenda:
-- o reel (vinagre_posts.video_url) e o texto.
-- Correr depois de exclusive-programs.sql e de vinagre-posts-video.sql.
-- Imagens do designer (arte/site/capa-programa-3x4.jpg, retrato.jpg) já no media-library (30/10).
--
-- O programa entra ativo (is_published=true), mas o site só lista um programa com
-- pelo menos 1 peça publicada e com a hora já passada (regra automática de 30/10:
-- lista, abas, página e sitemap). Sem peças, a página do programa dá 404/noindex.
-- O ON CONFLICT não mexe em is_published (não reativa um programa que se tenha tirado).
-- Peças: lendas-portugal-1-bruxas-tras-os-montes.sql … lendas-portugal-4-almas-penadas.sql.
-- Textos (autor, frase, descrição): redator, supabase/rascunhos/lendas-portugal.md, 30/10.

INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  '36fc7e0c-174d-4821-b2fd-5d7a79eba4f5',
  'lendas-de-portugal',
  'Lendas de Portugal',
  'Alexandra Serra',
  'Lendas do folclore português, contadas à lareira',
  'Bruxas, lobisomens e almas penadas: lendas do folclore português contadas à lareira por Alexandra Serra. Na rádio, de 31/10 a 2/11.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-retrato-lendas-de-portugal.jpg',
  'center',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-lendas-de-portugal.jpg',
  6,
  true
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
