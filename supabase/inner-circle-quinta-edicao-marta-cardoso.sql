-- Notícias Olha que Duas, 3 nov 2026.
-- Corpo = texto colado pelo Leo, pela ordem dele. Secções (h2) e créditos das três fotos.
-- Sem factos, bios, datas ou cidades acrescentados. Aspas do original passam a «».
-- Reaplicar não mexe em published_at (fica a da primeira publicação).
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'inner-circle-quinta-edicao-marta-cardoso',
  'Inês Simões e Cátia Serrano anunciam 5.ª edição do «Inner Circle» com Marta Cardoso como convidada especial',
  'Sob o lema «Os melhores negócios acontecem à mesa», o exclusivo encontro de networking feminino regressa para mais uma edição dedicada a criar ligações e oportunidades de negócio.',
  $ic$<p>Sob o lema «Os melhores negócios acontecem à mesa», o exclusivo encontro de networking feminino regressa para mais uma edição dedicada a criar ligações e oportunidades de negócio.</p>
<p>O projeto Inner Circle, organizado por Inês Simões e Cátia Serrano, acaba de anunciar a abertura de inscrições para a sua 5.ª edição. Desta vez, o evento de networking feminino conta com uma presença muito aguardada: a apresentadora da TVI Marta Cardoso será a convidada especial do encontro.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-inner-circle-ines.jpg" alt="Inês Simões">
<p><em>Inês Simões. Fotografia: Infocul.</em></p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-inner-circle-catia.jpg" alt="Cátia Serrano">
<p><em>Cátia Serrano. Fotografia: Revista Business Portugal.</em></p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-inner-circle-marta.jpg" alt="Marta Cardoso">
<p><em>Marta Cardoso. Fotografia: TVI.</em></p>
<h2>Nas redes das organizadoras</h2>
<p>A novidade foi avançada através das redes sociais das organizadoras, onde o conceito do projeto volta a ser destacado pela sua exclusividade e foco no empreendedorismo: «Lugares limitados. Uma mesa. Mulheres que fazem acontecer».</p>
<h2>O impacto das edições anteriores</h2>
<p>Com a premissa de que «os melhores negócios acontecem à mesa», Cátia Serrano e Inês Simões sublinham o impacto que o formato tem tido junto das participantes: «As edições anteriores mostraram-nos que, quando reunimos as mulheres certas à mesma mesa, surgem ligações, ideias e oportunidades que vão muito além de um almoço».</p>
<h2>Inscrições</h2>
<p>As vagas para fazer parte desta 5.ª edição do Inner Circle são limitadas e as inscrições já se encontram abertas, sendo feitas diretamente através de mensagem privada nas redes sociais das organizadoras.</p>$ic$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-inner-circle-quinta-edicao-marta-cardoso-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-inner-circle-quinta-edicao-marta-cardoso-og.jpg',
  true,
  now(),
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  '5.ª edição do Inner Circle com Marta Cardoso',
  'Sob o lema «Os melhores negócios acontecem à mesa», o Inner Circle regressa com Marta Cardoso. Inscrições por mensagem privada.'
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
