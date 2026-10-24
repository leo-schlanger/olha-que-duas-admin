-- Capas novas do Exclusivo (2026-10-24): um estilo por programa, logo no canto superior esquerdo.
-- Geradas com scripts/capas/gerar.mjs a partir de scripts/capas/pecas/<slug>.json.
-- So mexe nas imagens; o texto das pecas fica como esta na base.

UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marluce-revoredo-silva-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marluce-revoredo-silva-og.jpg'
WHERE slug = 'marluce-revoredo-silva';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-antonio-sala-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-antonio-sala-og.jpg'
WHERE slug = 'antonio-sala';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-jose-castelo-branco-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-jose-castelo-branco-og.jpg'
WHERE slug = 'jose-castelo-branco';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-rute-cardoso-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-rute-cardoso-og.jpg'
WHERE slug = 'rute-cardoso';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marisa-cruz-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marisa-cruz-og.jpg'
WHERE slug = 'marisa-cruz';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-temos-tudo-e-o-odio-cresce-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-temos-tudo-e-o-odio-cresce-og.jpg'
WHERE slug = 'temos-tudo-e-o-odio-cresce';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-herman-jose-regresso-ca-por-casa-13-temporada-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-herman-jose-regresso-ca-por-casa-13-temporada-og.jpg'
WHERE slug = 'herman-jose-regresso-ca-por-casa-13-temporada-rtp1';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-dulce-pontes-cancela-concerto-escritaria-penafiel-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-dulce-pontes-cancela-concerto-escritaria-penafiel-og.jpg'
WHERE slug = 'dulce-pontes-cancela-concerto-escritaria-penafiel';
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-violencia-domestica-licenca-parental-capa.jpg',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-violencia-domestica-licenca-parental-og.jpg'
WHERE slug = 'violencia-domestica-licenca-parental';

-- Revisao do qa (2026-10-24): Mente Aberta legivel, Pimenta equilibrada; ?v=2 fura a cache do CDN.
UPDATE vinagre_posts SET cover_url = cover_url || '?v=2', og_image_url = og_image_url || '?v=2'
WHERE slug IN ('temos-tudo-e-o-odio-cresce', 'violencia-domestica-licenca-parental') AND cover_url NOT LIKE '%?v=2';
-- Aspas portuguesas na noticia do Herman, como nas outras pecas.
UPDATE vinagre_posts SET title = replace(title, '"Cá por Casa"', '«Cá por Casa»'),
  excerpt = replace(excerpt, '"Cá por Casa"', '«Cá por Casa»'),
  content = replace(content, '"Cá por Casa"', '«Cá por Casa»')
WHERE slug = 'herman-jose-regresso-ca-por-casa-13-temporada-rtp1';
-- Aspas portuguesas no livro da Júlia Pinheiro (notícia do Herman).
UPDATE vinagre_posts SET content = replace(content, '("Não Sei Nada Sobre o Amor")', '(«Não Sei Nada Sobre o Amor»)')
WHERE slug = 'herman-jose-regresso-ca-por-casa-13-temporada-rtp1';
