-- Notícias Olha que Duas: 5.ª edição do Inner Circle, 3 nov 2026.
-- Texto a partir do material colado pelo Leo. Factos de contexto conferidos:
-- SELFIE, 3 jul 2025 (anúncio; a 1.ª ainda ia ser no Porto, 16 mulheres, por convite — isso NÃO é a 5.ª);
-- Instagram @inesimoesoficial, 19 set 2025 (a 1.ª realizou-se no Porto) e 26 set 2026 (edição na Comporta);
-- Cátia Serrano, CEO da Equação Motor: Revista Business Portugal, 11 dez 2025;
-- Marta Cardoso não tem redes sociais (esclareceu em antena na TVI).
-- Fotos: Inês (Infocul), Cátia (Revista Business Portugal), Marta e capa (TVI). Sem data, cidade nem preço da 5.ª.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'inner-circle-quinta-edicao-marta-cardoso',
  'Inês Simões e Cátia Serrano anunciam a 5.ª edição do Inner Circle com Marta Cardoso',
  'Inês Simões e Cátia Serrano anunciam a 5.ª edição do Inner Circle, com a apresentadora da TVI Marta Cardoso como convidada especial. As inscrições estão abertas e os lugares são limitados.',
  $ic$<p><strong>Inês Simões e Cátia Serrano anunciaram a 5.ª edição do Inner Circle, com a apresentadora da TVI Marta Cardoso como convidada especial.</strong> O lema é «Os melhores negócios acontecem à mesa». As inscrições estão abertas e os lugares são limitados.</p>
<p>O anúncio saiu nas redes sociais das organizadoras. As duas descrevem o Inner Circle como um encontro exclusivo de networking feminino. «Lugares limitados. Uma mesa. Mulheres que fazem acontecer», disseram.</p>
<h2>Quem organiza</h2>
<p>Inês Simões é fundadora da agência Latitude Portátil e comentadora de realities da TVI, nos programas «Big Brother» e «Secret Story». No Instagram está em @inesimoesoficial.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-inner-circle-ines.jpg" alt="Inês Simões, fundadora da agência Latitude Portátil">
<p><em>Inês Simões. Fotografia: Infocul.</em></p>
<p>Cátia Serrano é empresária e CEO da Equação Motor, no Porto, empresa do ramo automóvel. A Revista Business Portugal apresentou-a nesse cargo a 11 de dezembro de 2025.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-inner-circle-catia.jpg" alt="Cátia Serrano, CEO da Equação Motor">
<p><em>Cátia Serrano. Fotografia: Revista Business Portugal.</em></p>
<h2>A primeira edição foi no Porto</h2>
<p>O Inner Circle nasceu em 2025. Inês Simões e Cátia Serrano são as mentoras. A 3 de julho de 2025, a SELFIE noticiou o anúncio: um clube íntimo e exclusivo, que reuniria apenas 16 mulheres, por convite. A primeira edição estava marcada para o Porto.</p>
<p>A 19 de setembro de 2025, Inês Simões publicou no Instagram que essa edição se tinha realizado no Porto. A 26 de setembro de 2026, Inês Simões publicou outra edição, na Comporta, e adiantou que a próxima estava para breve.</p>
<p>«As edições anteriores mostraram-nos que, quando reunimos as mulheres certas à mesma mesa, surgem ligações, ideias e oportunidades que vão muito além de um almoço», disseram as organizadoras.</p>
<h2>Marta Cardoso, a convidada</h2>
<p>A convidada especial é Marta Cardoso, apresentadora dos Extras dos realities na TVI. Não tem redes sociais: a própria já o esclareceu em antena.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-inner-circle-marta.jpg" alt="Marta Cardoso, apresentadora da TVI">
<p><em>Marta Cardoso. Fotografia: TVI.</em></p>
<h2>Como se inscrever</h2>
<p>A inscrição faz-se por mensagem privada nas redes sociais das organizadoras. Os lugares são limitados.</p>$ic$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-inner-circle-quinta-edicao-marta-cardoso-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-inner-circle-quinta-edicao-marta-cardoso-og.jpg',
  true,
  now(),
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Marta Cardoso na 5.ª edição do Inner Circle',
  'Marta Cardoso é a convidada da 5.ª edição do Inner Circle, anunciada por Inês Simões e Cátia Serrano. Inscrição por mensagem privada. Lugares limitados.'
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
