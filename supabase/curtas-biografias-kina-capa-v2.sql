-- Kina: capa e OG com a foto real (designer, 20/11/2026). Nomes novos (-v2): o Storage/CDN guarda a antiga em cache.
UPDATE vinagre_posts SET cover_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-kina-a-mulher-que-se-fez-sozinha-capa-v2.jpg', og_image_url = 'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-kina-a-mulher-que-se-fez-sozinha-og-v2.jpg', updated_at = now()
WHERE slug = 'kina-a-mulher-que-se-fez-sozinha';
