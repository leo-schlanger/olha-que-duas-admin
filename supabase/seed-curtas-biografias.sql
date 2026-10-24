-- Curtas Biografias, com Alexandra Serra.
-- Correr depois de exclusive-programs.sql e depois do site que filtra por programa.
-- A Marluce é o episódio 1 (16:00). O António Sala é o episódio 2 (16:05)
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
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marluce-revoredo-silva-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marluce-revoredo-silva-og.jpg',
  true,
  '2026-10-14 16:00:00+01',
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
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-antonio-sala-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-antonio-sala-og.jpg',
  true,
  '2026-10-14 16:05:00+01',
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
  'jose-castelo-branco',
  'José Castelo Branco: rei do glamour e da polémica',
  'De Tete à noite lisboeta dos anos 80, do fenómeno dos reality shows ao confronto com a justiça: as metamorfoses da mais polarizadora figura do espetáculo em Portugal.',
  $castelobranco$<p>José Alberto Castelo Branco da Silva Vieira nasceu a 8 de dezembro de 1962 em Tete, Moçambique. Filho de Francisco José e de Inês, cresceu num ambiente ultramarino tradicional e marcadamente católico, desenvolvendo desde muito cedo uma veneração profunda pela figura materna. Com a descolonização e a Revolução de 1974, a família viu-se forçada a regressar a Portugal na condição de retornados, enfrentando a perda abrupta de património e o desafio da reintegração numa Lisboa em plena transformação social.</p>
<h2>A noite lisboeta e Tatiana Romanova</h2>
<p>Foi na noite lisboeta dos anos 1980 que começou a desenhar a sua primeira grande metamorfose. No emblemático clube Frágil, no Bairro Alto, deu vida ao alter ego transformista «Tatiana Romanova», fascinado pelo glamour imperial e pelo requinte cénico. Por essa mesma época viveu o seu primeiro casamento, com Maria Arlene Perna, união da qual nasceu em 1988 o seu único filho, Guilherme Castelo Branco Vieira uma das âncoras mais discretas da sua vida, que mais tarde lhe daria a neta, Constança.</p>
<h2>Alta sociedade e o casamento com Betty Grafstein</h2>
<p>Ao afastar-se dos palcos noturnos, José reinventou-se como negociador de arte e figura da alta sociedade, adotando um discurso aristocrático, maneirismos teatrais e uma estética andrógina em saltos altos que desafiava os códigos tradicionais. Em 1996, o casamento mediático com a joalheira norte-americana Elizabeth Larner, universalmente conhecida como Betty Grafstein, consolidou a sua projeção nas crónicas sociais internacionais, dividindo a vida entre Sintra e Manhattan.</p>
<h2>O fenómeno dos reality shows</h2>
<p>A consagração de massas deu-se nos anos 2000 com o fenómeno dos reality shows da TVI. A vitória estrondosa na «Quinta das Celebridades» em 2004, seguida de participações na «1.ª Companhia» e no «Circo das Celebridades», transformou-o num dos maiores marcos de audiência da história televisiva em Portugal. Durante essa era de ouro mediática, o público acolheu-o como um produtor involuntário de comédia e um «guilty pleasure» nacional, enquanto outros setores o acusavam de oportunismo e decadência, ao mesmo tempo que, deliberadamente ou não, colocava a fluidez de género e a diferença em horário nobre perante uma sociedade ainda conservadora.</p>
<h2>A queda e o confronto com a justiça</h2>
<p>A fronteira entre a persona pública exuberante e a esfera privada acabou, contudo, por ruir de forma irremediável. Em 2024, após décadas de exposição, foi detido na sequência de graves denúncias de violência doméstica física e psicológica apresentadas por Betty Grafstein após um internamento hospitalar, ficando formalmente impedido por via judicial de se aproximar da mulher. O choque judicial transformou o antigo fascínio e a tolerância do público em indignação moral e repúdio generalizado. Entre a desconstrução da personagem, a encenação perpétua e o confronto com a justiça, José Castelo Branco permanece a mais polarizadora e barroca máscara do espetáculo em Portugal.</p>$castelobranco$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-jose-castelo-branco-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-jose-castelo-branco-og.jpg',
  true,
  '2026-10-17 13:35:00+01',
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

-- Episódio: Rute Cardoso, a corrida como refúgio no luto de Diogo Jota (2026-10-24).
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at, program_id
)
VALUES (
  'rute-cardoso',
  '«Espero que estejas orgulhoso de mim»: o refúgio emocionante de Rute Cardoso para sobreviver ao luto de Diogo Jota',
  'Quatro meses depois de perder Diogo Jota, Rute Cardoso calçou as sapatilhas. Da corrida ao boxe, fez do treino o refúgio para cuidar da mente.',
  $rutecardoso$<p>Há dores que parecem parar o relógio, mas há escolhas que nos devolvem o movimento. Quando na madrugada de 3 de julho de 2025 o país acordou em choque com a partida trágica de Diogo Jota e do irmão, André Silva, apenas onze dias depois de um casamento feliz, o mundo de Rute Cardoso desabou. Ficou o silêncio pesado da ausência e a missão gigante de ser o porto seguro de três filhos pequenos: Dinis, Duarte e Mafalda.</p>
<p>Como se reconstrói a mente quando o chão desaparece? Para Rute, a resposta não veio apenas do tempo, mas do movimento.</p>
<h2>Correr para acalmar a alma</h2>
<p>No final de novembro do ano passado, quatro meses após a tragédia, decidiu calçar as sapatilhas de corrida. Já praticava musculação, mas precisava de mais. Precisava, nas suas próprias palavras, de um desafio para «acalmar um bocadinho a cabeça». Sem dar por isso, fez do asfalto, das luvas de boxe e do rigor do treino o seu maior refúgio terapêutico.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/curtas-biografias-rute-cardoso-treino.jpg" alt="Rute Cardoso a empurrar o trenó numa prova de treino híbrido">
<p>No desporto, a dor física tem uma vantagem sobre a dor emocional: tem princípio, meio e fim. Cada quilómetro percorrido passou a ser uma conversa consigo mesma e um ato de resistência pela sua saúde mental. Rodeada por uma equipa de treinadores e amigos que nunca lhe largaram a mão, Rute transformou a vulnerabilidade em força bruta.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/curtas-biografias-rute-cardoso-hyrox.jpg" alt="Rute Cardoso com o treinador diante do tempo final do HYROX de Valência, 1:06:14">
<h2>A vitória silenciosa</h2>
<p>Vimo-la superar-se no exigente desafio do Hybrid Day no Estoril, vimo-la correr pela causa do IPO do Porto e, num dos momentos mais comoventes deste ano, vimo-la cortar a meta da Meia Maratona do Porto. Ao fim de 21 quilómetros, olhou para o céu e deixou a mensagem que nos apertou o coração a todos: «I hope you are proud of me» (Espero que estejas orgulhoso de mim).</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/curtas-biografias-rute-cardoso-ipo-porto.jpg" alt="Rute Cardoso de costas, com o dorsal 20, na corrida pelo IPO do Porto">
<p>Rute Cardoso não corre para fugir à saudade — até porque uma história de amor começada em 2012, nos corredores da escola, é eterna. Ela corre para ter fôlego para a vida. Ao cuidar da mente através do corpo, deu-nos uma das mais bonitas lições de resiliência dos últimos tempos: o luto não se apaga, mas aprende-se a caminhar — e a correr — com ele.</p>$rutecardoso$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-rute-cardoso-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-rute-cardoso-og.jpg',
  true,
  '2026-10-24 08:05:00+01',
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

-- Episódio: Marisa Cruz, a menopausa e o renascimento aos 51 anos (agendado para domingo, 2026-10-25 09:00 Lisboa).
-- A hora de verão acaba nessa madrugada: domingo às 09:00 em Lisboa é +00, não +01.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at, program_id
)
VALUES (
  'marisa-cruz',
  'Marisa Cruz abre o coração sobre a fase mais assustadora da sua vida e o renascimento aos 51 anos: «Assustei-me verdadeiramente com a mulher em que me estava a tornar»',
  'Aos 51 anos, Marisa Cruz fala da menopausa, das feridas da infância e da terapia, e da Risa, a marca que criou para as mulheres nesta fase.',
  $marisacruz$<p>Habituada aos holofotes desde os anos 90 como uma das mulheres mais bonitas e admiradas de Portugal, Marisa Cruz viveu nos últimos anos uma tempestade silenciosa longe das câmaras. Aos 51 anos, a apresentadora e atriz decidiu quebrar o tabu e partilhar os momentos mais duros da sua história recente, marcada pelo embate violento com a perimenopausa e a menopausa, pela cura de feridas profundas do passado e por uma superação que a levou a reinventar-se no mundo dos negócios.</p>
<h2>A tempestade silenciosa</h2>
<p>Tudo começou por volta dos 47 anos, quando os primeiros sinais de alteração hormonal surgiram de forma avassaladora e sem aviso prévio. Sempre conhecida pelo seu otimismo e sorriso fácil, Marisa Cruz viu-se subitamente mergulhada num estado emocional irreconhecível, marcado por insónias severas, suores noturnos, pesadelos constantes e pensamentos sombrios que nunca antes tinha experimentado. A apresentadora confessa que a parte psicológica foi a mais difícil de gerir, chegando a sentir-se à beira de uma depressão e assustada com a falta de controlo sobre as próprias emoções. Qualquer pequeno contratempo transformava-se num problema gigante, gerando uma irritabilidade e uma falta de paciência em casa que a deixavam consumida pela culpa perante os dois filhos, João e Diogo.</p>
<p>Sem encontrar abertura para falar sobre o tema entre mulheres da sua idade e sentindo falta de preparação preventiva por parte da medicina, Marisa acabou por se isolar e fechar em casa durante algum tempo. A par das alterações físicas e da perda de libido, pesava também o rótulo cruel que a sociedade ainda impõe às mulheres que deixam a fase reprodutiva. A apresentadora admite que chegou a questionar o seu papel e a sua identidade enquanto mulher, confrontada com a sensação de vazio e de perda de propósito que tantas vezes acompanha esta transição em silêncio.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/curtas-biografias-marisa-cruz-gala.jpg" alt="Marisa Cruz de vestido preto com folhos brancos, numa noite de gala">
<h2>As cicatrizes antigas</h2>
<p>Este turbilhão obrigou-a também a mergulhar fundo na terapia e a encarar de frente cicatrizes antigas que ainda condicionavam a sua vida adulta. Com uma infância marcada pela instabilidade, pela pobreza extrema e pela ausência de uma estrutura familiar segura — onde a última memória do pai foi uma visita na prisão antes de descobrir a sua morte da forma mais fria e abrupta através do padrasto —, Marisa Cruz percebeu que carregava há décadas um medo inconsciente do abandono. Durante muito tempo, sentiu que precisava de ter alguém ao lado para estar completa e carregou o peso da culpa por não ter sido mãe a tempo inteiro enquanto viajava para trabalhar e garantir o sustento da família.</p>
<p>Foi precisamente no fundo dessa vulnerabilidade que começou a sua verdadeira superação. Recusando-se a aceitar que uma mulher depois dos 50 anos perde a sua validade ou o seu brilho, Marisa Cruz procurou acompanhamento médico especializado, adotou uma nova disciplina física com caminhadas matinais e mudanças na alimentação, e fez um trabalho profundo de amor-próprio. Hoje, garante que aprendeu a estar inteira sozinha, libertou-se da necessidade de agradar aos outros e elevou a fasquia nas suas relações, recusando aceitar menos do que aquilo que entrega.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/curtas-biografias-marisa-cruz-desfile.jpg" alt="Marisa Cruz sentada na primeira fila de um desfile, de óculos escuros">
<h2>A fase da «mulher sábia»</h2>
<p>Mais do que superar a crise pessoal, a apresentadora transformou a sua dor numa missão coletiva. Depois de quatro anos de estudo e investigação, nos quais investiu as suas próprias poupanças e enfrentou o receio de entrar num mercado altamente competitivo, lançou a Risa, uma marca de cuidados de pele e bem-estar íntimo pensada especificamente para mulheres na menopausa. Para Marisa Cruz, esta nova etapa já não é vista como um fim, mas sim como a fase da «mulher sábia» e o momento de maior poder e coragem da sua vida, provando que nunca é tarde para recomeçar, dar voz a quem se sente sozinha e correr atrás dos sonhos que ficaram por cumprir.</p>$marisacruz$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marisa-cruz-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-marisa-cruz-og.jpg',
  true,
  '2026-10-25 09:00:00+00',
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
