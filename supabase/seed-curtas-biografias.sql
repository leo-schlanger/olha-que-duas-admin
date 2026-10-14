-- Curtas Biografias, com Alexandra Serra.
-- Correr depois de exclusive-programs.sql e depois do site que filtra por programa.
-- A Marluce é o episódio 1 (17:00). O António Sala é o episódio 2 (18:00)
-- e, como a coluna mostra a peça mais recente em destaque, é ele que abre a página.

INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  'e4b81f06-3a27-4c9d-8e55-1d7a6b0c92f8',
  'curtas-biografias',
  'Curtas Biografias',
  'Alexandra Serra',
  'Histórias rápidas, vidas marcantes',
  'Curtas biografias de figuras públicas de Portugal, por Alexandra Serra.',
  'https://www.olhaqueduas.com/exclusivo/alexandra-serra.jpg',
  'center',
  'https://www.olhaqueduas.com/exclusivo/curtas-biografias.jpg',
  2,
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
  'marluce-revoredo-silva',
  'A reviravolta inacreditável de Marluce Revorêdo Silva: de top model a diretora aos 70 anos',
  'Elegância, resiliência e uma paixão inesgotável pela vida.',
  $marluce$<p>Com uma presença magnética e uma postura que cruza sofisticação com calor humano, Marluce Revorêdo Silva é muito mais do que um nome incontornável da sociedade e da cultura luso-brasileira: é uma força da natureza feita de graça, determinação e lealdade. Natural de Belém do Pará, chegou a Portugal para marcar uma era e, desde cedo, imprimiu o seu carisma inconfundível na história da moda nacional.</p>
<h2>As passarelas e a escola Bazar</h2>
<p>Nas décadas de 70 e 80, tornou-se uma das modelos e manequins de referência absoluta das passarelas portuguesas e internacionais. Musa de criadores de topo como o estilista António Augustus, personificou a alta-costura com um aprumo raro e ajudou a desenhar os contornos do profissionalismo na moda em Portugal. Não se limitou a desfilar o talento alheio; com visão pioneira, fundou a conceituada escola Bazar, onde formou gerações de jovens manequins, transmitindo-lhes não apenas noções de postura e elegância, mas a disciplina, a etiqueta e a autoconfiança indispensáveis para singrar num meio exigente. O legado que deixou no universo da moda permanece como um marco de distinção e bom gosto que ainda hoje inspira quem com ela priva.</p>
<h2>Mãe e amiga</h2>
<p>Contudo, é longe dos holofotes que se revela a sua maior grandeza: a de mãe e amiga inabalável. Mãe devota de três filhos — entre eles Marta Cruz — e avó apaixonada, Marluce sempre colocou a família no centro de tudo, servindo de porto de abrigo seguro mesmo nas horas mais cinzentas. Diante das maiores tempestades públicas e dos períodos de profundo escrutínio, nunca vacilou na sua dignidade nem na defesa dos laços familiares, demonstrando uma nobreza de espírito e uma generosidade que os amigos mais próximos apontam como a sua marca mais genuína. É a companheira de todas as horas, dona de uma gargalhada contagiante e de uma sensibilidade agregadora que transforma qualquer adversidade numa lição de superação e perdão.</p>
<h2>Master Coach, autora e diretora</h2>
<p>Essa sabedoria de vida encontrou um desfecho natural no seu trabalho enquanto Master Coach e autora, vertida em obras inspiradoras como «12 Pérolas para uma Vida Feliz», onde ensina que o bem-estar e a paz interior se constroem com resiliência, afeto e autoconhecimento. Longe de abrandar, Marluce continua hoje plenamente ativa e com o olhar posto no futuro. Como diretora da agência de comunicação Olha que Duas, lidera projetos com dinamismo, visão estratégica e um entusiasmo contagiante, provando que o tempo só apura o talento. Entre a comunicação, o desenvolvimento pessoal e os projetos que abraça a cada dia, Marluce Revorêdo Silva continua a reinventar-se, reafirmando-se como um símbolo vivo de força feminina, generosidade e beleza intemporal.</p>$marluce$,
  'https://www.olhaqueduas.com/exclusivo/marluce-revoredo-silva.jpg',
  'https://www.olhaqueduas.com/exclusivo/marluce-revoredo-silva-og.jpg',
  true,
  '2026-10-14 17:00:00+01',
  'e4b81f06-3a27-4c9d-8e55-1d7a6b0c92f8'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  program_id = EXCLUDED.program_id;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at, program_id
)
VALUES (
  'antonio-sala',
  'António Sala, lenda da rádio e da televisão',
  'Há vozes que fazem parte da mobília afetiva de um país inteiro. Mais de seis décadas nos microfones e nos palcos.',
  $sala$<p>Há vozes que fazem parte da mobília afetiva de um país inteiro. Com mais de seis décadas dedicadas aos microfones e aos palcos, António Sala é o verdadeiro sinónimo da "Rádio dos Afetos" em Portugal.</p>
<p>Nascido a 14 de janeiro de 1949 em Vilar de Andorinho, Vila Nova de Gaia, mudou-se com a família para Lisboa aos dez anos. Foi na capital que começou a cantar em coros de igreja e deu vida aos seus primeiros grupos juvenis, Os Fachos e Os Argonautas. A paixão pela comunicação falou mais alto e, em 1966, com apenas 17 anos, estreou-se nos Emissores Associados de Lisboa onde também foi técnico de som e sonorizador e na Rádio Ribatejo, com o programa Caravana das Cinco, passando ainda pelo programa militar Alerta Está e pelas manhãs da RDP 1.</p>
<h2>A Rádio Renascença</h2>
<p>Mas é em 1979 que a história da rádio portuguesa muda: António Sala ingressa na Rádio Renascença e cria, em dupla com Olga Cardoso, o mítico programa Despertar. O sucesso foi tão avassalador que, em 1983, foi eleito a figura mais popular de Portugal num inquérito do jornal Expresso. Na estação católica, onde brilhou também na condução de entrevistas, chegou a Diretor de Programas em 1992 e a Diretor-Geral do Grupo Renascença entre 2003 e 2007.</p>
<h2>O pequeno ecrã</h2>
<p>Comunicador nato, conquistou o pequeno ecrã logo em 1972 na RTP com Música Maestro e, mais tarde, com Ou Vai ou Taxa. Nos anos 80 e 90, entrou diariamente na casa dos portugueses com programas lendários: fez humor e música em O Foguete ao lado de Carlos Paião e Luís Arriaga e liderou grandes formatos como Palavra Puxa Palavra, Você Decide, o inesquecível concurso 1, 2, 3, Quem é o Quê?, Café Lisboa e Sala de Conversas. Mais recentemente, continuou a acompanhar novas gerações como jurado em A Tua Cara Não Me É Estranha, na TVI, e Estrelas ao Sábado, na RTP1.</p>
<h2>A música</h2>
<p>Paralelamente aos estúdios, viveu sempre apaixonado pela música. Fundou em 1971 o grupo Maranata, pisou o palco em mais de três mil espetáculos e conquistou vários discos de Ouro e Prata. Da sua autoria e voz nasceram clássicos que Portugal inteiro sabe de cor: Zé Brasileiro Português de Braga (em dueto com Alexandra), Uma Canção Amiga (no Festival da Canção de 1984), Fado Safado e o intemporal Parabéns a Você, gravado em 1985 com o seu filho Miguel, além de álbuns marcantes como Recados de Telex, Segredos, Bons Velhos Tempos, Microfone e Voz em homenagem ao amigo Carlos Paião e Lisboa e o Meu Piano.</p>
<h2>Os livros e a vida pública</h2>
<p>E porque comunicar também se faz no papel, assinou vários livros entre o humor, a poesia, o romance e as memórias, destacando-se Palavras Despidas de Música, o romance Império de Brandos Costumes, Histórias para os Avós Contarem aos Netos e Memórias da Vida e da Rádio dos Afectos.</p>
<p>Casado com Elizabeth Sala e pai de Miguel Sala, foi também professor universitário de Comunicação, vice-presidente do Sport Lisboa e Benfica no final dos anos 90 e, após superar um problema oncológico em 2012, tornou-se um exemplo público de resiliência e otimismo. Distinguido como Comendador da Ordem do Mérito em 2010 e Comendador da Ordem do Infante D. Henrique em 2024, António Sala é, indiscutivelmente, uma das páginas mais luminosas da cultura popular portuguesa.</p>$sala$,
  'https://www.olhaqueduas.com/exclusivo/antonio-sala.jpg',
  'https://www.olhaqueduas.com/exclusivo/antonio-sala-og.jpg',
  true,
  '2026-10-14 18:00:00+01',
  'e4b81f06-3a27-4c9d-8e55-1d7a6b0c92f8'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  program_id = EXCLUDED.program_id;
