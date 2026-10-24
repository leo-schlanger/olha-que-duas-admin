-- Marisa Cruz é notícia, como a Rute Cardoso (Leo, 2026-10-24): passa para Notícias Olha que Duas,
-- assinada pela Alexandra Serra, ainda agendada para 2026-10-25 09:00 (Lisboa, já em +00).
UPDATE vinagre_posts SET
  program_id = (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  author = 'Alexandra Serra',
  cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marisa-cruz-capa.jpg?v=2',
  og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marisa-cruz-og.jpg?v=2'
WHERE slug = 'marisa-cruz';
