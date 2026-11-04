-- Notícias Olha que Duas: José Mourinho e a filha Matilde (2026-11-04).
-- Texto da Alexandra Serra, com ortografia («» e «fraqueza, e o seu maior orgulho, é»)
-- e uma frase factual: Matilde faz 30 anos nesta quarta-feira.
-- A citação usada é a da Alexandra e de SELFIE, Notícias ao Minuto, Flash! e ON FM
-- («Sempre a minha menina»). Outros meios escreveram «Para sempre a minha menina pequena».
-- Foto enviada pela Alexandra (Downloads/foto.jpg), sem o texto que vinha queimado no cartão.
-- Crédito: Instagram de José Mourinho. Não há segunda fotografia de origem.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'mourinho-sempre-a-minha-menina',
  'José Mourinho, nos 30 anos da filha: «Sempre a minha menina»',
  'José Mourinho dedicou à filha Matilde as palavras «Sempre a minha menina», num retrato em que os dois surgem sorridentes e abraçados.',
  $mm$<p>Habituado a mostrar uma postura implacável e focada nos relvados de futebol, José Mourinho provou, mais uma vez, que a sua maior fraqueza, e o seu maior orgulho, é a família. O treinador português protagonizou um momento de grande cumplicidade ao lado da filha, Matilde Mourinho, deixando transparecer uma faceta bem mais emotiva e protetora.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-mourinho-sempre-a-minha-menina-par.jpg" alt="José Mourinho abraçado à filha Matilde, os dois a sorrir"></p>
<p><em>José Mourinho e a filha Matilde. Fotografia: Instagram de José Mourinho</em></p>
<p>Num registo fotográfico onde pai e filha surgem sorridentes e abraçados, José Mourinho não escondeu o seu lado mais ternurento ao dedicar-lhe algumas palavras cheias de afeto: «Sempre a minha menina».</p>
<p>A publicação é desta quarta-feira, 4 de novembro, dia em que Matilde faz 30 anos.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-mourinho-sempre-a-minha-menina-detalhe.jpg" alt="Matilde Mourinho a sorrir, com o braço do pai sobre o ombro"></p>
<p><em>Matilde Mourinho, no mesmo retrato. Fotografia: Instagram de José Mourinho</em></p>
<p>A declaração simples, mas carregada de sentimento, mostra que, independentemente da passagem do tempo e dos caminhos profissionais de ambos, para o técnico português, Matilde continuará a ser sempre a sua «pequena». A partilha rapidamente conquistou a simpatia dos fãs e seguidores nas redes sociais, que elogiaram a forte ligação e o carinho evidente entre pai e filha.</p>$mm$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-mourinho-sempre-a-minha-menina-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-mourinho-sempre-a-minha-menina-og.jpg',
  true,
  '2026-11-04 20:25:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Mourinho nos 30 anos da filha: «a minha menina»',
  'José Mourinho dedicou à filha Matilde, que faz 30 anos, as palavras «Sempre a minha menina», num retrato dos dois abraçados.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;
