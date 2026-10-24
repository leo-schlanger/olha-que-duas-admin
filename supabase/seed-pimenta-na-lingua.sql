-- Pimenta na Língua, com Alexandra Serra.
-- Correr depois de exclusive-programs.sql e depois de a capa estar no site
-- (olha-que-duas/public/exclusivo/pimenta-na-lingua*.jpg).
-- Episódio 1: as vítimas de violência doméstica e a licença parental.

INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  '3f9d2c71-8a4e-4b06-b5d8-9e1c7a2f6043',
  'pimenta-na-lingua',
  'Pimenta na Língua',
  'Alexandra Serra',
  'Um programa picante e revelador',
  'A crónica de opinião de Alexandra Serra. Sem papas na língua sobre o que se passa em Portugal.',
  'https://www.olhaqueduas.com/exclusivo/alexandra-serra.jpg',
  'center',
  'https://www.olhaqueduas.com/exclusivo/pimenta-na-lingua.jpg',
  3,
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
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at, program_id
)
VALUES (
  'violencia-domestica-licenca-parental',
  'Quando o Estado empurra as vítimas para o abismo',
  'As vítimas de violência doméstica vão ser obrigadas a sair de casa para terem licença parental paga a 100%. Uma dupla punição inaceitável.',
  $pimenta1$<p>A notícia não podia ser mais revoltante nem demonstrar melhor a desconexão total entre gabinetes estatais e a crueldade do mundo real. De acordo com os relatos, as vítimas de violência doméstica vão ser obrigadas a sair de casa se quiserem obter licença parental paga a 100%. Lê-se bem? Obrigadas a sair de casa. Numa lógica kafkiana que parece saída de uma anedota de mau gosto, exige-se justamente à pessoa mais vulnerável — aquela que temeu pela vida entre quatro paredes, que carrega o trauma físico e psicológico, que tem um recém-nascido ou um filho menor a cargo — que dê o passo mais perigoso de todos: abandonar o seu domicílio, cumprir trâmites kafkianos e expor-se, apenas para conseguir um direito básico de subsistência.</p>
<h2>Quem inventou esta regra?</h2>
<p>Quem inventou esta regra alguma vez pisou o terreno? Sabe o que é o terror de um agressor à solta? Para esta gente de colarinho branco, a protecção social parece ser um favor condicionado a burocracias frias, como se a segurança de uma mãe e de uma criança fosse um mero papel a carimbar numa secretária.</p>
<h2>O silêncio das associações</h2>
<p>E onde andam, perguntamos nós, as grandes associações de apoio às vítimas? Aquelas que enchem telejornais e recebem subsídios chorudos em nome da causa? O silêncio destas estruturas perante um disparate legislativo desta dimensão é ensurdecedor, cúmplice e cobarde. Na hora de assinar comunicados solenes e aparecer nas fotografias institucionais, estão sempre na primeira fila. Mas quando é preciso rasgar as vestes no terreno, arregaçar as mangas e travar esta violência institucional contra quem já foi martirizado em casa... onde estão? Na realidade do dia a dia, em campo, o apoio real brilha pela ausência, transformando-se numa rede de papel que se desmancha ao primeiro sopro da burocracia do Estado.</p>
<h2>Até quando?</h2>
<p>Se o Estado cria leis que penalizam a vítima por ser vítima, e se quem devia defendê-la prefere o silêncio confortável dos gabinetes, então estamos entregues à bichana. Proteger na teoria e abandonar na prática é a face mais cínica de um país que continua a falhar redondamente a quem mais precisa. Até quando?</p>$pimenta1$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-violencia-domestica-licenca-parental-capa.jpg?v=2',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-violencia-domestica-licenca-parental-og.jpg?v=2',
  true,
  now(),
  '3f9d2c71-8a4e-4b06-b5d8-9e1c7a2f6043'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  program_id = EXCLUDED.program_id;
