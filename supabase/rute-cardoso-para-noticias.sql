-- Rute Cardoso é notícia, não biografia (Leo, 2026-10-24): passa para Notícias Olha que Duas.
-- O endereço antigo /exclusivo/curtas-biografias/rute-cardoso redireciona 301 (middleware).
UPDATE vinagre_posts SET
  program_id = (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-rute-cardoso-capa.jpg?v=3',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-rute-cardoso-og.jpg?v=3'
WHERE slug = 'rute-cardoso';
