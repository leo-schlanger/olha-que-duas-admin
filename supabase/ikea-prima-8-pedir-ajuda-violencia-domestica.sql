-- Notícias Olha que Duas: linha de apoio ao cliente da IKEA (opção 8) como canal seguro contra a violência doméstica.
-- Texto da Alexandra Serra (WhatsApp, 2026-11-24), sem adaptação (só aspas «»); contactos conferidos na IKEA e na CIG a 2026-11-24.
-- Agendada: 25/11/2026 08:00 Lisboa (= UTC em novembro), Dia Internacional para a Eliminação da Violência contra as Mulheres.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'ikea-prima-8-pedir-ajuda-violencia-domestica',
  '«Prima 8 para pedir ajuda»: Como o apoio ao cliente da IKEA em Portugal se tornou um canal seguro contra a violência doméstica',
  'Quem liga para o apoio ao cliente da IKEA Portugal e prime a opção 8 é encaminhado para os serviços especializados da CIG; a chamada fica registada apenas como contacto comercial.',
  $ikea$<p>A iniciativa «Recomeços», desenvolvida pela IKEA Portugal em parceria com a Comissão para a Cidadania e a Igualdade de Género (CIG), transformou a linha telefónica de apoio ao cliente da marca numa ferramenta discreta e segura de combate à violência doméstica. O projeto partiu de uma realidade preocupante: muitas vítimas evitam contactar as linhas oficiais de apoio por receio de que o agressor verifique o histórico de chamadas do telemóvel. Ao integrar uma opção dedicada no atendimento da empresa — acessível através do número 21 989 99 45 e selecionando a opção 8 —, a chamada fica registada apenas como um contacto comercial para a IKEA, sendo o pedido reencaminhado de forma confidencial e direta para os serviços especializados da CIG.</p>
<h2>Quase 1.600 pedidos encaminhados desde o lançamento</h2>
<p>Desde a criação desta funcionalidade, integrada no Pacto Contra a Violência, a procura tem crescido de forma expressiva. Depois de ter registado mais de 400 chamadas de potenciais casos ao longo de 2024, o número de contactos duplicou em 2025, ultrapassando o milhar de pedidos de ajuda reencaminhados até novembro desse ano e somando quase 1.600 encaminhamentos desde o lançamento da medida.</p>
<h2>Casa e emprego para quem sai das casas de abrigo</h2>
<p>Sob o mote «A igualdade começa em casa», a estratégia da IKEA Portugal vai além do encaminhamento telefónico e foca-se na autonomização a longo prazo de quem sai de casas de abrigo. Através de um fundo de autonomização criado em parceria com a CIG, a marca atribui apoio financeiro em cartões presente para que as vítimas possam mobilar e decorar as suas novas habitações permanentes. Paralelamente, a empresa criou uma «via verde» de recrutamento, garantindo acesso direto a entrevistas de emprego nas suas lojas, escritórios e centros de apoio ao cliente para promover a independência financeira das vítimas.</p>
<h2>Onde pedir ajuda</h2>
<p>Para quem precise de apoio, o encaminhamento confidencial através da IKEA está disponível pelo número 21 989 99 45 (opção 8). Em alternativa, é possível contactar diretamente o Serviço de Informação a Vítimas de Violência Doméstica da CIG através do número gratuito 800 202 148, por SMS para o 3060, ou ligar para o 112 em caso de emergência.</p>$ikea$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ikea-prima-8-pedir-ajuda-violencia-domestica-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ikea-prima-8-pedir-ajuda-violencia-domestica-og.jpg',
  true,
  '2026-11-25 08:00:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'IKEA: prima 8 para pedir ajuda contra violência doméstica',
  'Ligue 21 989 99 45 e prima 8: o apoio ao cliente da IKEA encaminha vítimas de violência doméstica para a CIG, de forma confidencial. Veja outros contactos.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;
