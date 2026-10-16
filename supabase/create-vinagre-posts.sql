-- ============================================================
-- Exclusivo Olha que Duas — coluna do Eduardo Vinagre
-- O site lê só o que está publicado e cuja data já chegou.
-- Escrita: administradores (is_admin()).
-- ============================================================

CREATE TABLE IF NOT EXISTS vinagre_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(140) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  excerpt VARCHAR(400) NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  og_image_url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vinagre_posts ADD COLUMN IF NOT EXISTS og_image_url TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_vinagre_posts_published
  ON vinagre_posts (is_published, published_at DESC);

CREATE OR REPLACE FUNCTION set_vinagre_post_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vinagre_posts_updated_at ON vinagre_posts;
CREATE TRIGGER trg_vinagre_posts_updated_at
  BEFORE UPDATE ON vinagre_posts
  FOR EACH ROW EXECUTE FUNCTION set_vinagre_post_updated_at();

ALTER TABLE vinagre_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published vinagre posts" ON vinagre_posts;
CREATE POLICY "Public read published vinagre posts" ON vinagre_posts
  FOR SELECT USING (
    is_published = true
    AND (published_at IS NULL OR published_at <= NOW())
  );

DROP POLICY IF EXISTS "Admin read vinagre posts" ON vinagre_posts;
CREATE POLICY "Admin read vinagre posts" ON vinagre_posts
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin write vinagre posts" ON vinagre_posts;
CREATE POLICY "Admin write vinagre posts" ON vinagre_posts
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON vinagre_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON vinagre_posts TO authenticated;
GRANT ALL ON vinagre_posts TO service_role;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'abel-dias-o-ze-nunca-bateu-na-betty',
  'Abel Dias diz em tribunal que "o Zé nunca bateu na Betty"',
  'Desmentido oficial: "Na casa de Nova Iorque, no aniversário de Betty? Jamais!"',
  $html$<p>Decorreu esta terça-feira, 6 de Outubro, uma nova sessão do julgamento de José Castelo Branco no Tribunal de Cascais. O socialite está acusado de violência doméstica contra a mulher, Betty Grafstein.</p>
<blockquote><p>Desmentido oficial: "Na casa de Nova Iorque, no aniversário de Betty? Jamais!"</p></blockquote>
<p>A frase é de Abel Dias. Pelo que recolhi, em exclusivo, junto do socialite, ele "nunca esteve quinze dias na casa de Nova Iorque em nenhum aniversário da Betty. É totalmente falso. Foi mais uma mentira."</p>
<h2>O que Abel Dias disse à juíza</h2>
<p>Abel Dias é amigo de Betty, colunista social, pai de Miguel Dias e irmão de Fernanda Dias, icónica publisher da revista Caras. No tribunal, contou a sua verdade.</p>
<blockquote><p>"O José era bruto a falar, mas nunca o vi a bater fisicamente."</p></blockquote>
<p>"Assisti várias vezes a episódios de violência verbal. Uma das vezes chamei-o à atenção. Estava a ser demais. A Betty era uma boneca nas mãos dele."</p>
<p>Ainda em depoimento, Abel disse à juíza que o Zé escondia comida.</p>
<blockquote><p>"Tens de fazer dieta, estás gorda. Põe-te direita, pareces corcunda."</p></blockquote>
<p>Castelo Branco assistia por videoconferência e ficou chocado "com estas barbaridades".</p>
<p>Uma amiga de Betty Grafstein deu-me outra leitura do mesmo episódio. A questão da comida e da postura era algo que Betty até agradecia, por causa da fraqueza nos joelhos, e era também conselho dos médicos.</p>
<h2>David Motta muda o discurso</h2>
<p>Depois de almoço, chegou a vez de David Motta, "o amigo que chegou a viver com o casal tanto em Nova Iorque como em Sintra". Foi assim que o Correio da Manhã o apresentou.</p>
<p>No início do processo de violência doméstica, o comentador do programa "Passadeira Vermelha", dirigido por Hugo Mendes na SIC Caras e à noite na SIC, mostrou-se ao lado de Castelo Branco. Promoveu a inocência dele e chegou a fazer vídeos a apregoar isso. Está tudo na internet. É só procurar.</p>
<p>Hoje, a conversa é outra.</p>
<p>O filho de Maria das Dores diz que, até 2019, terá assistido a discussões, abanões e a um soco de mãos fechadas nas costas da mãe de Roger Basile.</p>
<p>Há um pormenor de calendário. No dia 1 de Janeiro de 2017, David viajou de madrugada para Portugal, logo depois da festa de passagem de ano. Confirmei-o nas redes sociais do Conde.</p>
<p>Não esteve, portanto, em Nova Iorque até 2019, nem desde a primavera de 2017. Esteve em Outubro de 2016 e regressou a 1 de Janeiro de 2017, dentro dos noventa dias do limite legal.</p>
<p>Em 2018 viveu com José no palacete de Sintra e esteve na produção da capa da revista de Cristina Ferreira, com entrevista a Castelo Branco. A apresentadora da TVI recorda essa capa. Foi uma das mais vendidas.</p>
<h2>Quem mais falou na sala</h2>
<p>Deborah Barton, a maquilhadora, diz ter visto "uma relação normal, com pequenas discussões". Assistiu também a atos que considera inaceitáveis. Betty, conta, "era uma sombra da mulher" que ela conhecera.</p>
<p>Maria da Luz, a empregada, jurou que comprava doces com o seu próprio dinheiro para dar à Lady.</p>
<p>Falou-se ainda do acidente do dedo, quando Luz ficou sem a falange, numa altura em que mantinha romances. Tórridos e internacionais.</p>
<h2>As contas que ficaram por pagar</h2>
<p>No fim da sessão, uma funcionária do departamento de cobranças da CUF revelou que Betty tem ainda faturas por pagar, no valor de cerca de 52 mil euros.</p>
<p>Roger tem "power of attorney". É uma procuração: o documento que dá a uma pessoa o poder de decidir em nome de outra. Cabe-lhe pagar as contas e cuidar de tudo.</p>
<p>Marcella Fernandes, que já tinha testemunhado, passou o dia inteiro no Tribunal de Cascais. A presença dela não era necessária.</p>
<p>Um ex-funcionário disse-me, a mim, em exclusivo, que Roger pagou a Marcella quando ela chegou a Portugal.</p>$html$,
  'https://www.olhaqueduas.com/exclusivo/abel-dias-betty.jpg',
  'https://www.olhaqueduas.com/exclusivo/abel-dias-betty-og.jpg',
  true,
  '2026-10-06 20:06:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = CASE
    WHEN vinagre_posts.cover_url IN ('', '/exclusivo/abel-dias-betty.jpg')
    THEN EXCLUDED.cover_url
    ELSE vinagre_posts.cover_url
  END,
  og_image_url = CASE
    WHEN vinagre_posts.og_image_url = '' THEN EXCLUDED.og_image_url
    ELSE vinagre_posts.og_image_url
  END;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'ronaldo-nao-voltara-a-ser-cr7',
  'Jorge Jesus: "Ronaldo não voltará a ser CR7, o mentiroso não o voltará a convocar"',
  'Artigo 160.º do Regulamento Disciplinar da FPF expulsa Cristiano da seleção',
  $vinagre2$<p>A carta aberta de Cristiano Ronaldo, caída que nem uma bomba, ao final da tarde desta terça-feira, 6 de Outubro, já está a causar o pânico.</p>
<p>O pior é que, apesar das horas e horas de comentários e especulações nos mais diversos órgãos de comunicação social, há uma lei para cumprir e um treinador que é deus. Neste caso, é Jorge Jesus.</p>
<blockquote><p>"Ronaldo não voltará a ser CR7, o mentiroso não o voltará a convocar."</p></blockquote>
<h2>O silêncio dos convocados</h2>
<p>Vinte e quatro horas depois, o comunicado não tem um único "gosto" nem o apoio público de nenhum dos outros jogadores convocados por Jorge Jesus. O JN escreve que esse silêncio pode ser entendido como falta de apoio, ou simplesmente como um ficar à margem da polémica.</p>
<p>"Recorde-se, por outro lado, que depois da vitória sobre a Dinamarca (2-4), no primeiro jogo após a saída de Cristiano Ronaldo do estágio da equipa em Copenhaga, vários futebolistas destacaram a importância de Jorge Jesus para os bons resultados e as boas exibições de Portugal, que sem CR7 venceu os três jogos disputados no Grupo A4 da Liga das Nações", refere a mesma fonte.</p>
<h2>A pensar na equipa</h2>
<p>Jorge Jesus está só "a pensar na equipa", depois de ler a verdade de Ronaldo. Isto, mesmo depois dos oito pontos do guião que o filho de Dolores lhe entregou, onde foi acusado de faltar duas vezes à palavra dada. A um mês de um novo jogo da equipa das quinas, e após quatro vitórias, o selecionador refere: "que venha a próxima etapa, estamos confiantes".</p>
<p>Não se pode apagar 23 anos da "marca Pelé" de Portugal. Bruno Fernandes e João Cancelo sublinharam o estatuto e a importância do craque: "O Cris é e será o maior ícone da nossa seleção, merece o respeito de todos", "é o nosso capitão, um símbolo da nossa seleção, o melhor jogador que Portugal já teve".</p>
<h2>O futuro do Cris</h2>
<p>Em rigoroso exclusivo, em conversa comigo, ficam as ideias de Jesus para o futuro "do Cris".</p>
<blockquote><p>"Ronaldo nunca terá uma saída ao nível de Deus como Messi teve."</p></blockquote>
<h2>O artigo 160.º</h2>
<p>Agora está tudo nas mãos do Conselho de Disciplina da FPF. São eles que têm de analisar o castigo que aplicarão a Cristiano. No Regulamento Disciplinar da FPF, o artigo 160.º é claro e não deixa margem para dúvidas. Ao abandonar o estágio, ficou automaticamente suspenso, e a pena pode ir até seis meses.</p>
<p>Quando isto sucedeu com Ricardo Carvalho, que também deixou um estágio por sua vontade, a punição foi de um ano.</p>
<p>Mais: quando terminar a suspensão e a multa da FPF, só há uma pessoa que poderá autorizar a volta de CR ao 7. Jorge Jesus. O próprio é claro.</p>
<blockquote><p>"Um treinador jamais voltará a convocar um jogador que lhe chamou mentiroso, duas vezes."</p></blockquote>
<p>Não se augura o regresso de Ronaldo aos jogos de Portugal, a menos que despeçam o treinador. E isso não vai acontecer.</p>
<blockquote><p>"A direção da Federação só manda em mim, no resto mando eu em tudo."</p></blockquote>
<p>"A direção da FPF só tem um poder, que é despedir-me. Em tudo o resto, mando eu." Jorge Jesus espelha a frase usada por Johan Cruyff, treinador do Barcelona, no dia da apresentação oficial de Luís Figo, em 1995, no Barça.</p>
<h2>Nos bastidores</h2>
<p>José Manuel Delgado, antiga glória da Seleção e veterano jornalista de A Bola, autor da biografia de Diogo Jota, disse hoje em direto na BBC Rádio, e também a mim, que "agora é melhor ter calma e acompanhar o processo".</p>
<p>Nos bastidores ouve-se de tudo, e os comentários não param de chegar. De um momento para o outro, CR parece ter perdido o posto de herói nacional. Muito por culpa também do seu "ego inflamado", do "mau ambiente do balneário" e de outras acusações.</p>
<p>Posso também avançar, em primeira mão, que Pedro Proença já está a equacionar a data e a hora da conferência de imprensa em que se explicará aos jornalistas.</p>
<p>Outra garantia da minha fonte fidedigna, e muito próxima de toda esta novela, é que Cristiano Ronaldo terá sido aconselhado e pressionado a reagir, depois de Rui Santos ter dito na CNN que ele só voltaria se despedissem Jesus. Terá sido a Medialivre, dona da CMTV e da NOW, que instigou o seu dono a vir a público acabar com os mexericos. Ronaldo é acionista maioritário do grupo.</p>
<p>Nas pesquisas mais populares do Google figuram agora os nomes de Simão Coutinho e de Tiago Craveiro. Hoje ninguém quer saber de Cristina Ferreira. O comunicado de Ronaldo surge no topo das mais procuradas.</p>
<h2>Simão Coutinho e Tiago Craveiro</h2>
<p>Nas diversas caixas de comentários figura tudo e mais um par de botas. Passo a citar.</p>
<p>"Simão Coutinho e Tiago Craveiro, as duas pessoas próximas de Ronaldo mas alheias à seleção nacional que reuniram com Jesus."</p>
<p>"Um é diretor desportivo do Al Nassr, clube onde joga Cristiano. O outro trabalha como consultor da CR7 SA, empresa que gere os negócios do jogador. Simão Coutinho e Tiago Craveiro foram identificados no comunicado de Ronaldo como testemunhas das conversas que o futebolista teve com Jorge Jesus no estágio da seleção nacional, tendo participado nas reuniões com o treinador", referiu a Tribuna do Expresso.</p>
<p>Aqui surge um rol de opiniões polémicas.</p>
<p>"O problema grave aqui foi não haver ninguém da FPF para ver o que foi ou não acordado naquela reunião, estava JJ desprotegido ao lado de 2 gajos próximos de Ronaldo a fazer pressão e a tentar controlar."</p>
<p>"Ao contrário de outros jogadores que não podem levar a família consigo. O Ronaldo leva o staff para tomarem decisões por si, habituou-se toda a vida a ter a mãe e irmãs a mandarem, agora precisa noutros sectores de ter manas a mandar. O pau mandado é o Ronaldo que se rodeou de dois merdas, e um asno como o Tiago Craveiro que sempre se achou com o rei na barriga nunca teve nada a ver com futebol e é um gajo com sede de poder, além de político. O Ronaldo faz o que lhe mandam, antigamente era a mãe dele a mandar em tudo, agora tem estes comparsas, desde que rompeu a sua relação com o Jorge Mendes, a vida dele passou a estar em declínio em termos futebolísticos e os amigos do staff todos passaram a ter uma vida melhor. Sem esquecer ainda o Ricardo Regufe, um zé ninguém que deu um salto enorme."</p>
<p>"A única coisa da gestão do Ronaldo profissional é o património, onde o Miguel Marques está a fazer um bom trabalho, a gerir a fortuna do Ronaldo. A gestão de carreira e imagem desde que rompeu com o J Mendes, deixou de ser uma gestão profissional, passou a ser por amigos e outros de competência duvidosa, passou a se rodear de gente que concorda cegamente com ele, e foi sempre a descer na sua percepção de imagem. E mesmo a gestão do património já começa a haver demasiados investimentos com retorno de capital muito duvidoso. Duvido muito que os netos do Ronaldo tenham algo para mostrar, já está tudo a ir ao pote."</p>
<p>"Ainda gostava de perceber porque é que numa reunião entre o capitão e o selecionador é preciso haver uma ata assinada com testemunhas. É este o ambiente que se vive lá dentro? Só mostram o circo que está montado e a maneira como aquilo tem sido gerido."</p>
<p>Reforço que estes comentários não são meus. Estão disponíveis para quem quiser ler na Tribuna do Expresso.</p>
<p>Uma coisa é certa. A procissão saiu agora do adro.</p>$vinagre2$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1791397809511.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1791397809511.jpg',
  true,
  '2026-10-07 19:00:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'biografia-diogo-jota-livro-oficial-liverpool',
  'Biografia de Diogo Jota vai ser lançada em Inglaterra: veja em primeira mão a capa do livro oficial do Liverpool',
  'José Manuel Delgado publica a 22 de outubro, em Inglaterra, a biografia de Diogo Jota como livro oficial do Liverpool. O título é Forever in Our Hearts.',
  $vinagre3$<p>José Manuel Delgado, o autor da história da vida de Diogo Jota, revelou-me em detalhe que irão publicar a sua obra, no dia 22 de Outubro, em Inglaterra.</p>
<p>Agora como livro oficial do Liverpool FC, em homenagem ao jogador que amam, 'Forever in Our Hearts' é o título da versão inglesa. "Para sempre nos nossos corações", garantidamente.</p>
<p>Na apresentação, diz-se que foi escrito por um jornalista português premiado e com entrevistas dos ícones do Liverpool FC, como o ex-técnico Jürgen Klopp, o atual capitão Virgil van Dijk e o ex-capitão Jordan Henderson, além de companheiros de equipa portugueses.</p>
<p>Publicada originalmente em Portugal com grande sucesso na primavera, esta edição para o Reino Unido, que conta com o apoio da família, traz também depoimentos exclusivos dos pais e da esposa de Diogo Jota.</p>
<h2>O verão de 2025</h2>
<p>No verão de 2025, Diogo Jota tinha o mundo aos seus pés. Atacante de destaque do Liverpool FC e da Seleção portuguesa, havia acabado de conquistar a Premier League e a Liga das Nações antes de se casar com a sua namorada de infância.</p>
<p>Mas, apenas 11 dias após o casamento com Rute Cardoso, a tragédia aconteceu. Enquanto Diogo e seu irmão, André Silva, viajavam de carro por Espanha para seguirem em ligação de volta ao Reino Unido, o Lamborghini alugado por eles sofreu um aparatoso e trágico acidente.</p>
<p>Os irmãos Silva, filhos orgulhosos de Gondomar, perderam a vida. O que se seguiu foi uma enorme comoção, tanto por parte da família como de todo o mundo do futebol e de toda a população que, ainda hoje, acompanha a resiliência de Rute Cardoso, a companheira e mãe dos filhos de Diogo Jota.</p>
<h2>Uma biografia intimista</h2>
<p>Esta biografia intimista "narra os bastidores da sua carreira e da sua vida, antes de ela ser tragicamente interrompida".</p>
<p>O autor entrevistou familiares, companheiros de equipa e treinadores "para traçar um retrato rico em detalhes de um jogador de futebol brilhante e de um homem muito querido".</p>
<p>A sua viúva relata, com detalhes dolorosos, como enviou ao marido vídeos do casamento na noite do acidente, tendo ficado cada vez mais preocupada à medida que as horas passavam sem resposta.</p>
<p>Companheiros de equipa, incluindo Virgil van Dijk e Jordan Henderson, prestam homenagem a alguém que consideravam um amigo, enquanto treinadores como Jürgen Klopp e Arne Slot também deixam os seus depoimentos.</p>
<p>Esta biografia de grande impacto promete ser uma leitura obrigatória para os adeptos do Liverpool e para toda a comunidade do futebol.</p>
<h2>O autor</h2>
<p>O autor, José Manuel Delgado, nasceu em Lisboa, em 1957. Iniciou-se como futebolista nas camadas jovens do SC Braga e, quando entrou na Faculdade de Direito da Universidade de Lisboa, transferiu-se para os juniores do Sporting (1974/76), encetando depois uma carreira profissional na I Divisão Portuguesa que o levou a representar, entre 1976 e 1989, Montijo, Belenenses, Portimonense, Benfica, Farense e Espinho.</p>
<p>Pelo Benfica, ganhou dois campeonatos e duas taças de Portugal. Representou as seleções nacionais jovens e foi convocado três vezes para a Seleção Nacional.</p>
<p>Em 1989, aos 31 anos, terminou a carreira de futebolista e iniciou a de jornalista. Foi editor na revista Sábado e no jornal A Capital. No Record, foi diretor. Está no diário desportivo A Bola desde 2003, tendo integrado a direção do jornal de 2006 a 2023, tendo agora uma coluna de opinião na versão em papel e no digital.</p>
<p>Recebeu vários prémios de jornalismo, foi membro da Associação Académica da Faculdade de Direito de Lisboa e da comissão executiva do Sindicato dos Jogadores. Foi mandatário para a Juventude, na reeleição do general António Ramalho Eanes, em 1980, participando, em 1986, na campanha presidencial de Francisco Salgado Zenha.</p>
<p>Antes da biografia de Diogo Jota, 'Pulsação' foi o seu segundo livro, depois de 'A Vida aos Pontapés'. É casado, pai da Rita, do Miguel e do Francisco e avô da Upa e do Zico.</p>
$vinagre3$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1791479419119.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1791479419119.jpg',
  true,
  '2026-10-08 18:00:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'cristina-ferreira-joao-monteiro-realizam-sonho-fabio-marques-np4game',
  'Cristina Ferreira e João Monteiro realizam sonho de Fábio Marques, da NP4 Game, e filho Tiago também é presenteado',
  'A estrela da TVI recebeu um novo iPhone bordeaux, a sua cor preferida, numa surpresa preparada em segredo para o CEO da NP4 Game.',
  $vinagre4$<p>A diretora de Ficção e Entretenimento da TVI é uma mulher que sabe reconhecer quem trabalha e lutou para alcançar o sucesso. Ou seja, quem, como ela, fez acontecer e chegou ao topo da montanha.</p>
<p>Tanto assim é que nesta sexta-feira, 9 de Outubro, exatamente um mês depois de ter celebrado o 49.º aniversário, Cristina Ferreira foi presenteada com um novo iPhone decorado com uma capa bordeaux, a sua cor preferida e a marca do romance com João Monteiro, simbolizado por um coração púrpura 💜.</p>
<h2>Dois homens do norte</h2>
<p>O irmão de Francisco Monteiro, atualmente concorrente do Big Brother All Stars, ficou amigo de Fábio Marques, CEO da tecnológica NP4 Game. Dois homens do norte e uma ligação que agora fica eternizada aqui no site Olha que Duas.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-np4-foto1-1791571381754742984.jpg" alt="Fábio Marques, CEO da tecnológica NP4 Game">
<p>Fábio confessou a João que tinha o sonho de ver Cristina Ferreira a promover o seu negócio. E assim foi. Esta manhã, o namorado da apresentadora ligou para o empresário por videochamada e passou o novo telefone a Cristina.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-np4-foto2-1791571381754742984.jpg" alt="Cristina Ferreira e João Monteiro na videochamada com Fábio Marques">
<p>Fábio Marques estava a tomar café com a tia, que também ficou muito feliz por falar com a estrela da TVI, e explicou que os telemóveis estavam todos esgotados. Um verdadeiro sucesso de vendas!</p>
<blockquote><p>"O Fábio merece. Veio do nada e agora já tem 13 lojas. 13, o número da sorte."</p></blockquote>
<p>Foi assim que Cristina o explicou no vídeo. A verdade é que nunca se tinha visto até hoje Cristina e João expostos numa missão, o que demonstra bem o empenho em concretizar o desejo de Fábio, CEO da NP4 Game.</p>
<h2>Uma surpresa preparada em segredo</h2>
<p>Falei com Diogo Soares, diretor de Marketing da empresa, que me explicou que foi uma surpresa preparada em segredo e que Fábio Marques nunca imaginou que Cristina Ferreira também publicasse tudo no Instagram.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-np4-foto3-1791571381754742984.jpg" alt="O novo iPhone bordeaux de Cristina Ferreira, publicado no Instagram">
<p>Para além da anfitriã da Roda da Sorte, que está a ser um verdadeiro êxito nos fins de tarde do canal 4, João Monteiro e Tiago, o filho de Cristina, também foram presenteados com o novo iPhone, acabadinho de chegar, disponível para reservas no site da NP4 e nas lojas, em nova remessa a caminho.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-np4-foto4-1791571381754742984.jpg" alt="O novo iPhone em pré-venda no site da NP4 Game">
<p>Desta vez, a colega de Cláudio Ramos nas manhãs do 'Dois às 10' provou de uma vez por todas que é sensível a histórias de gente lutadora e faz tudo para ajudar. De coração!</p>$vinagre4$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1791571381754742984.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1791571381754742984.jpg',
  true,
  '2026-10-09 19:30:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'susana-da-silva-tribunal-antonio-pedro-cerdeira-romance-comandante-melides',
  'Susana da Silva, em tribunal por violência de António Pedro Cerdeira, assume romance com comandante milionário de Melides',
  'O julgamento no Tribunal de Sintra foi adiado para 30 de outubro. Susana da Silva fala em exclusivo e, segundo fonte da companhia aérea, tem um novo amor.',
  $vinagre5$<p>Foi adiada, para dia 30 deste mês de Outubro, a próxima sessão do julgamento que opõe Susana da Silva ao ex-namorado, acusado de violência doméstica.</p>
<p>Na barra criminal do Tribunal de Sintra, antes das alegações finais e leitura da sentença, que deverá suceder em meados de Novembro, ainda são esperados os depoimentos, em defesa de Susana, do músico Miguel Gameiro e de Rita Guerra, que foi casada com Cerdeira durante cinco meses.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-susana-foto1-1791656899047672848.jpg" alt="Susana da Silva e António Pedro Cerdeira">
<blockquote><p>"Estou cansada, exausta, são muitos anos disto. Relembro que o agressor já foi acusado pelo Ministério Público de violência doméstica agravada, numa pena de três a cinco anos. E os meus pertences continuam na casa dele."</p></blockquote>
<p>Foi o que revelou Susana, em declarações exclusivas. Para a profissional da aviação, "estes monstros merecem ser condenados, merecem cadeia".</p>
<p>"Muitas figuras públicas, que se tornaram amigos de verdade, apoiam-me em silêncio, relatam episódios do Pedro, enfim", denunciou, em conversa comigo.</p>
<h2>Um novo amor de Melides</h2>
<p>Solteira desde 2022, depois de ter literalmente fugido de António Pedro Cerdeira, Susana da Silva terá voltado a encontrar o amor. Um amor que a faz mesmo andar nas nuvens.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-susana-foto3-1791656899047672848.jpg" alt="Susana da Silva, profissional da aviação">
<p>A verdade é que, segundo fonte da companhia aérea onde Susana trabalha, esta não está mais sozinha. Desde há cerca de seis meses, Susana tem sido vista em clima de grande cumplicidade com um comandante milionário da TAP, com quem divide agora o tempo em Melides.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-susana-foto4-1791656899047672848.jpg" alt="Susana da Silva, sorridente, num abraço">
<h2>O que Susana contou em tribunal</h2>
<p>Em tribunal, quando o julgamento começou, em Abril, foi ouvida a versão da suposta vítima: "nos meses seguintes, os episódios tornaram-se mais frequentes e mais agressivos".</p>
<p>Mais: "Tínhamos ido jantar. Levámos para casa o meu melhor amigo e uma amiga dele. Ele teve outro ataque de ciúmes. Deu-me um estalo. Fiquei parva. Vivi um pesadelo com ele. Aguentei sete anos".</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-susana-foto2-1791656899047672848.jpg" alt="António Pedro Cerdeira">
<p>Susana explicou que "Cerdeira ficava mais agressivo quando consumia cocaína e bebia álcool. Nas ressacas, era muito ciumento".</p>
<blockquote><p>"Quando consumia cocaína, bastava um homem olhar para mim. Batia-me de todas as maneiras. Não me batia na cara porque percebia que ficava negra. Levei murros, partiu-me as costelas e partiu-me a cabeça com um banco. Além de ter levado tareia, ouvia insultos como vaca, monte de mer***..."</p></blockquote>$vinagre5$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1791656899047672848.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1791656899047672848.jpg',
  true,
  '2026-10-10 19:30:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'papa-leao-xiv-nodulo-pulmao-vai-ser-operado',
  '"Rezem por mim!" Papa Leão XIV anuncia nódulo no pulmão e vai ser operado',
  'O próprio Papa revelou no Angelus, na Praça de São Pedro, que lhe foi detetado um nódulo no pulmão em fase inicial. A cirurgia está marcada para os próximos dias.',
  $vinagre6$<p>O Papa Leão XIV anunciou este domingo, 11 de Outubro, que vai ser submetido a uma cirurgia, depois de lhe ter sido detetado um nódulo no pulmão "em fase inicial".</p>
<p>O anúncio foi feito pelo próprio Sumo Pontífice durante a oração do Angelus, na Praça de São Pedro, no Vaticano.</p>
<p>Leão XIV, de 71 anos, explicou que os médicos detetaram um nódulo num dos pulmões e que a lesão, ainda numa fase inicial, está "circunscrita".</p>
<blockquote><p>"Recentemente, durante alguns exames médicos, os médicos detetaram um nódulo localizado no meu pulmão. Foi detetado numa fase muito precoce e está bem delimitado."</p></blockquote>
<p>É absolutamente fora do comum ser o próprio Papa a anunciar publicamente um problema de saúde desta gravidade.</p>
<h2>Cirurgia marcada para os próximos dias</h2>
<p>O Papa acrescentou que a operação vai acontecer já nos próximos dias:</p>
<blockquote><p>"Os médicos consideram aconselhável intervir, pelo que, seguindo o seu conselho, decidi submeter-me a uma cirurgia para o remover. A operação já está marcada para os próximos dias."</p></blockquote>
<p>O Vaticano não revelou mais detalhes sobre o estado de saúde de Leão XIV. Citada pela Reuters, a Santa Sé adianta apenas que o período de recuperação deverá durar cerca de uma semana.</p>
<h2>Viagem à América do Sul em risco</h2>
<p>Em risco poderá ficar agora a viagem planeada para 6 a 17 de Novembro ao Uruguai, à Argentina e ao Peru.</p>
<p>Robert Prevost, o primeiro Papa norte-americano, foi eleito em Maio de 2025, sucedendo a Francisco, que morreu aos 88 anos. Sua Santidade tem presença prevista em Fátima, nas cerimónias de 13 de Maio de 2027.</p>
<p>A todos os cristãos, e não só, Leão XIV deixou um pedido de orações: <strong>"Rezem por mim!"</strong></p>$vinagre6$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1791722624245102701.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1791722624245102701.jpg',
  true,
  '2026-10-11 13:45:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'pedro-mourinho-fora-do-now',
  'Pedro Mourinho fora do NOW: "Decidi sair. Não vou..."',
  'O jornalista confirmou o adeus ao canal da Medialivre e revelou que a decisão partiu de forma natural. Dois anos e dois meses depois do arranque do NOW, voltou de férias e não regressou ao ecrã.',
  $vinagre7$<p>Dois anos e dois meses depois do arranque do canal 9, o jornalista voltou de férias e nunca mais regressou ao ecrã.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-mourinho-foto1-1791828952801019418.jpg" alt="Pedro Mourinho no estúdio do NOW">
<p><strong>DESMENTIDO OFICIAL!</strong> A saída de Pedro Mourinho não significa uma "baixa" na Medialivre. Até porque a decisão partiu de forma natural por parte do jornalista, que decidiu, juntamente com a direção liderada por Carlos Rodrigues, não continuar a trabalhar na televisão que tem Cristiano Ronaldo como acionista.</p>
<h2>"Foi uma vontade minha"</h2>
<p>Em declarações exclusivas à minha crónica, aqui no site 'Olha que Duas', o pai de Carolina, filha também de Iva Domingues, confirmou o adeus:</p>
<blockquote><p>"Foi uma vontade minha, sair do NOW, mas está tudo bem e não houve nada de polémicas. Não vou nem posso dizer mais nada, até por uma questão de confidencialidade. Neste momento, já não estou na redação. Estou de férias, a aproveitar a vida e à espera do que vem por aí."</p></blockquote>
<h2>Direção em silêncio, Roque de Pinho desmente conflito</h2>
<p>Falei também com Carlos Rodrigues, diretor editorial da Medialivre, que não quis tecer quaisquer comentários.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-mourinho-foto2-1791828952801019418.jpg" alt="Carlos Rodrigues, diretor editorial da Medialivre (CMTV e NOW)">
<p>Também por telefone, Frederico Roque de Pinho, que reforçou o NOW exatamente quando Pedro estava de férias, desmente qualquer conflito com o "amigo de há mais de 30 anos, desde a SIC". Na passada semana, dia 6, o antigo canal de Carnaxide completou o 34.º aniversário.</p>
<blockquote><p>"Nunca houve nenhum problema entre mim e o Pedro Mourinho, nem pessoal nem profissional. Já trabalhámos também juntos na TVI e foi sempre tudo tranquilo."</p></blockquote>
<p>Quem o diz é Roque de Pinho, que trocou a CNN pelo NOW.</p>
<h2>"A missão do NOW será sempre o jornalismo"</h2>
<p>A 3 de Maio de 2024, no dia da apresentação oficial do canal, que foi para o ar a 17 de Junho, o antigo animador da 'Geração 90' da RFM referiu que "a missão do NOW será sempre o jornalismo":</p>
<blockquote><p>"É provavelmente a chegada aos media mais importante dos últimos anos, mas além da novidade em si, de um novo canal, tem o mais importante leque de protagonistas que alguma vez foi apresentado em conjunto. Poder trabalhar num dia com o António Costa e no dia seguinte com o Pedro Santana Lopes e logo depois com o Rui Rio é mais do que aliciante, e colocará o NOW a um nível de comunicação em que os telespectadores, os políticos, os decisores não vão prescindir do canal e de saber o que ali é dito."</p></blockquote>
<p>O NOW (News Now) é um canal de televisão português por cabo pertencente ao grupo Medialivre, proprietário do Correio da Manhã, Jornal de Negócios, Record, Sábado, TV Guia e Flash!, que "tem registado crescimentos expressivos nas audiências do cabo e liderança em diversos momentos de prime-time face a canais concorrentes".</p>
<h2>Quem é Pedro Mourinho</h2>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-mourinho-foto3-1791828952801019418.jpg" alt="Pedro Mourinho, pivô do NOW até Agosto">
<p>Pedro Mourinho é um reputado jornalista e pivô de televisão português, nascido a 30 de Abril de 1972. É amplamente reconhecido pelo seu longo percurso na cobertura jornalística em Portugal e, mais recentemente, pelo seu trabalho de grande impacto na cobertura da guerra na Ucrânia. Até Agosto, desempenhou as funções de pivô principal no canal NOW.</p>
<p>Começou a sua carreira na rádio, estreando-se na RTP a apresentar o 'Caderno Diário', em 1990. Integrou a equipa da SIC, onde permaneceu durante cerca de 20 anos, tornando-se um dos rostos mais familiares da informação do canal.</p>
<p>Em 2020, mudou-se para a TVI, onde também assumiu cargos de subdireção de informação e foi um dos rostos principais no lançamento da CNN Portugal. Destacou-se internacionalmente pelas suas intensas reportagens no terreno durante o início do conflito ucraniano.</p>
<p>Em Setembro de 2022, transferiu-se para o grupo Cofina (atual Medialivre). Inicialmente ligado à CMTV, tornou-se depois figura central do canal 9. <strong>Agora, aos 54 anos, rumou para outras paragens...</strong></p>$vinagre7$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1791828952801019418.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1791828952801019418.jpg',
  true,
  '2026-10-12 19:15:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'david-antunes-morte-netinho',
  'David Antunes em choque com morte de Netinho: "Descansa em paz, meu querido amigo!"',
  'O cantor brasileiro de "Milla" morreu aos 60 anos, vítima de um linfoma. David Antunes, amigo próximo e parceiro de palco em Portugal, reagiu em exclusivo.',
  $vinagre8$<p>O conhecido e talentoso cantor e músico português David Antunes e o brasileiro Netinho, famoso pelo êxito mundial "Milla", mantinham uma forte ligação profissional e uma amizade muito próxima.</p>
<p>Infelizmente, a relação entre ambos fica agora marcada pela tragédia: o cantor baiano Netinho faleceu hoje, terça-feira, 13 de Outubro, aos 60 anos, vítima de um linfoma não Hodgkin, um tipo de cancro do sistema linfático, contra o qual lutava desde Março do ano passado.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-netinho-foto1-1791915054968111982.jpg" alt="Netinho (1966-2026)">
<h2>Amigos dentro e fora dos palcos</h2>
<p>Netinho viajou várias vezes para Portugal a convite de David. Participou em diversos concertos integrados na digressão de David Antunes &amp; The Midnight Band, animando eventos conceituados como a Feira Nacional de Agricultura, em Santarém, e festas em Alpiarça e Vila Flor.</p>
<p>O malogrado artista brasileiro marcou também presença no conhecido podcast de David Antunes, "Canta-me uma história", onde interpretou alguns dos seus temas icónicos e partilhou momentos descontraídos.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-netinho-foto2-1791915054968111982.jpg" alt="Netinho, convidado especial de David Antunes">
<p>Quando Netinho foi diagnosticado com cancro, David Antunes e a sua banda prestaram públicas e emotivas homenagens ao cantor brasileiro nos palcos portugueses, demonstrando a forte união e amizade que existia entre os dois artistas e as respetivas famílias.</p>
<p>Na hora do adeus, em jeito de homenagem, David Antunes deixou uma mensagem de pesar, revelada em exclusivo:</p>
<blockquote><p>"Descansa em paz, meu querido amigo!"</p></blockquote>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-netinho-foto3-1791915054968111982.jpg" alt="David Antunes e Netinho abraçados em palco">
<h2>A doença</h2>
<p>Segundo a assessoria do cantor, nos últimos meses Netinho enfrentava um linfoma não Hodgkin do tipo B, que evoluiu para um quadro de falência renal e disfunção múltipla de órgãos.</p>
<p>Por desejo do próprio, o velório e a cremação serão realizados de forma reservada, numa cerimónia restrita a familiares e amigos próximos.</p>
<p>O diagnóstico foi anunciado pelo próprio a 22 de Março de 2025, depois de ter sido internado no Hospital Aliança Star, em Salvador, capital da Bahia, com fortes dores nas pernas. Durante o tratamento, falou abertamente sobre a morte e foi sempre mostrando as várias etapas nas redes sociais.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-netinho-foto4-1791915054968111982.jpg" alt="Netinho no hospital, durante o tratamento">
<h2>Quem era Netinho</h2>
<p>O artista ficou conhecido pelas músicas "Beijo na Boca", "Fim de Semana" e o maior dos seus sucessos, "Milla", que se tornou um dos símbolos do axé music.</p>
<p>Netinho nasceu em Santo Antônio de Jesus, no Recôncavo baiano, a 12 de Julho de 1966. Aos 10 anos, mudou-se com a família para Salvador, onde entrou em contacto com a música e começou cedo a carreira.</p>
<p>Aos 14 anos, recebeu da mãe a primeira guitarra e, aos 16, ingressou no curso de Engenharia Civil, na Universidade Católica do Salvador (UCSal). Nessa época, conciliava os estudos com pequenos espetáculos em escolas, até começar a tocar profissionalmente em bares, com um repertório de MPB (Música Popular Brasileira) e bossa nova.</p>
<p>Em 1988, estreou-se como vocalista da Banda Beijo no Carnaval de Salvador e, no mesmo ano, explodiu em todo o Brasil com "Beijo na Boca". Seguiram-se outros êxitos, como "Estrela Primeira", "Barracos" e "A Vida é Festa".</p>
<p>O maior sucesso da sua voz foi "Milla", lançado em 1996, três anos depois de ter iniciado a carreira a solo. O cantor tornou-se um ídolo nacional e ajudou a levar o axé music ao mundo, com atuações em países como Itália e Chile.</p>
<p>Como empresário, abriu um grande estúdio de gravação e mistura no Rio de Janeiro, por onde passaram nomes como Maria Bethânia, Milton Nascimento, Gilberto Gil, Laura Pausini e Lenny Kravitz. Criou também uma editora para lançar novos artistas baianos.</p>
<p>Entre 1997 e 2003, foi casado com a jornalista Mariana Trindade, com quem teve uma filha, Bruna Trindade.</p>
<h2>Polémicas e problemas de saúde</h2>
<p>Em 2010, assumiu publicamente ser bissexual. Dois anos depois, no programa 'Fantástico', da TV Globo, disse preferir não se alongar sobre o assunto:</p>
<blockquote><p>"Eu acho cafona ficar falando sobre isso. Não tem muito sentido."</p></blockquote>
<p>Em 2013, sofreu três acidentes vasculares cerebrais (AVC) que lhe causaram, entre outros problemas, a perda da voz, o principal instrumento do seu trabalho. Por isso, esteve quatro anos sem atuar no Carnaval de Salvador.</p>
<p>Apoiante de Jair Bolsonaro, participou em pelo menos uma manifestação a favor do então Presidente da República, em 2021, posicionamento que lhe valeu críticas.</p>
<p>Nas eleições de 2022, candidatou-se a deputado federal pelo PL, o partido de Bolsonaro, mas obteve apenas 31 mil votos e não foi eleito, ficando como suplente.</p>$vinagre8$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1791915054968111982.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1791915054968111982.jpg',
  true,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at)
VALUES (
  'fernanda-serrano-desmente-novo-amor',
  '"Quais borboletas?" Fernanda Serrano desmente novo amor: "Não tenho! Quando quero..."',
  'A TV Guia garantiu que a atriz de ''Coração de Mãe'' está apaixonada. Antes de partir para uma aventura nos Açores com o filho Santiago, Fernanda Serrano desmentiu tudo em exclusivo.',
  $vinagre9$<p>A revista TV Guia escreveu esta quarta-feira, 14 de Outubro, numa história rapidamente replicada por outros sites, que Fernanda Serrano, de 52 anos, "tem um novo amor e está novamente apaixonada".</p>
<p>A mesma publicação referiu que, três anos após o fim da relação com o personal trainer Ricardo Pereira, "a atriz vive uma nova paixão e está a manter a identidade do companheiro em segredo", tanto que "colegas de elenco referem que se mostra radiante e com 'borboletas na barriga'". De referir que as gravações de 'Coração de Mãe', em exibição na TVI, terminaram há mais de duas semanas.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-serrano-foto1-1792002431589005800.jpg" alt="Fernanda Serrano">
<h2>Do Alentejo aos Açores</h2>
<p>No passado fim-de-semana, a estrela das novelas do canal 4 refugiou-se no Alentejo, em São Teotónio, onde aproveitou para se deliciar com as maravilhas de uma região que tanto lhe diz, uma vez que tem raízes bem fortes em Estremoz.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-serrano-foto2-1792002431589005800.jpg" alt="Fernanda Serrano no Alentejo">
<p>Hoje, dia 14, a filha única de Ercília e Jaime Serrano já está nos Açores, na ilha do Pico, com Santiago, o seu primogénito, a concretizar um sonho desenhado desde Abril: uma expedição, uma aventura conduzida por um guia todo-o-terreno.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-serrano-foto3-1792002431589005800.jpg" alt="Santiago, filho de Fernanda Serrano, a caminho dos Açores">
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-serrano-foto4-1792002431589005800.jpg" alt="O guia todo-o-terreno da expedição no Pico">
<h2>"Quais borboletas?!"</h2>
<p>Antes de se lançar ao desafio, Fernanda Serrano conversou em exclusivo comigo, aqui na minha coluna do 'Olha que Duas', e desmentiu o novo amor. Em primeira mão, respondeu:</p>
<blockquote><p>"Quais borboletas?!! Não tenho! Os meus maiores amores, os de sempre, são os mesmos! Os meus 4 filhos! Estes sim, serão para sempre! Meus!"</p></blockquote>
<p>E deixou a dica:</p>
<blockquote><p>"Vão vendo a minha página (Instagram) e mantenham-se a par das notícias! Só eu as dou, quando e como quero. Obrigada!"</p></blockquote>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-serrano-foto5-1792002431589005800.jpg" alt="Fernanda Serrano na ilha do Pico, nos Açores">
<h2>O adeus à Madalena</h2>
<p>De lágrimas nos olhos, Fernanda confessou que "há despedidas que não são fáceis" e não escondeu a emoção no último dia de gravações, a 30 de Setembro:</p>
<blockquote><p>"Foi dia de dizer adeus à Madalena. E há despedidas que não são fáceis. A Madalena foi muito mais do que uma personagem. Doce, reservada, sonhadora, uma mãe profundamente dedicada, teve de enfrentar um processo de reencontro consigo mesma e perceber que tinha o direito de escolher a sua própria vida."</p></blockquote>
<p>A atriz acrescentou ainda que viveu com a personagem "medos, silêncios, lágrimas, recomeços":</p>
<blockquote><p>"Mas vivi, sobretudo, aquele amor que só uma mãe conhece. E que nos ensina que nunca é tarde para recomeçar (...) Por todos os dias em que entrámos em estúdio e deixámos um bocadinho de nós em cada cena. Uma mãe pode ter medo, pode cansar-se, pode cair… mas quando ama, encontra sempre uma forma de continuar. Obrigada, Madalena. Foi um privilégio ser a tua voz, o teu rosto e o teu coração durante estes meses. Despeço-me de ti… mas algumas histórias não acabam verdadeiramente quando terminam as gravações. Ficam em nós. Para sempre."</p></blockquote>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-serrano-foto6-1792002431589005800.jpg" alt="Fernanda Serrano como Madalena, em 'Coração de Mãe'">
<p>Na novela, que vai para o ar de segunda a sexta-feira, logo depois do especial 'Big Brother All Stars', Fernanda Serrano interpreta Madalena, uma professora casada com a personagem de Marco Delgado, que vai viver um romance proibido com um aluno, o 'Fonzie'.</p>$vinagre9$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-1792002431589005800.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-og-1792002431589005800.jpg',
  true,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published;

-- Luís Maia, 50 anos, 15 de outubro de 2026. Olha que Duas e Eu.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at, program_id
)
VALUES (
  'passado-secreto-luis-maia-50-anos',
  'Exclusivo! O passado secreto de Luís Maia: a morte de Angélico afastou o repórter da enteada',
  'No dia do 50.º aniversário, o "mano" Hernâni Carvalho recorda "o palerma da praxe". Luís Maia foi surpreendido nas manhãs da SIC.',
  $luis50$<p>Luís Maia é uma cara bastante conhecida das reportagens criminais, agora na 'Casa Feliz' da SIC. Em dia de festa, saiba que o repórter fez parte do 'Survivor' da TVI e trabalhou no 'Você na TV!' quando Cristina Ferreira estreou como apresentadora principal.</p>
<p>50 anos depois de 15 de Outubro de 1976, Luís Maia foi hoje surpreendido e homenageado para Portugal ver nas manhãs da SIC.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-estudio-sic.jpg" alt="Luís Maia surpreendido no dia dos 50 anos nas manhãs da SIC">
<p>Com a cumplicidade de Hernâni Carvalho e de Diana Chaves, e até da equipa de produção e realização, pensou que ia ao estúdio entregar umas folhas e eis que foi apanhado. Seguiu-se a mensagem de parabéns da mãe orgulhosa e a entrada enternecedora de Susana, a esposa, e o apagar da vela num bolo de pastéis de nata, o seu docinho preferido. Foi um momento de televisão feliz e inesquecível de um homem, de quem os amigos e colegas só dizem o melhor.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-mae.jpg" alt="A mensagem da mãe de Luís Maia em direto na SIC">
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-surpresa.jpg" alt="Luís Maia abraça Susana diante do bolo de pastéis de nata no estúdio da Casa Feliz">
<h2>O estágio na TVI</h2>
<p>Luís Maia anda nestas lides há muito tempo. Praticamente desde sempre. Em 1999, estagiou na editoria de Sociedade da TVI, onde foi apadrinhado por Paulo Salvador, na altura pré-'Big Brother', quando o Jornal Nacional ainda era o Directo XXI.</p>
<p>Antes de terminar o estágio, Júlio Magalhães já estava em Queluz de Baixo e, após Luís ter partilhado com ele a paixão pelo heavy metal, o ex-jornalista da TVI pediu a Maia que fizesse uma série de cinco reportagens, uma por cada dia do noticiário da hora de almoço.</p>
<h2>Cabelos compridos e heavy metal</h2>
<p>O repórter da 'Análise Criminal' foi um jovem de cabelos compridos, louco por baterias e músico de várias bandas "a rasgar", como por exemplo os Dark Saga. Aliás, foi o desbravar deste mundo, dos engravatados que se transformam em "gandas malucos" de calças rasgadas e cabedal com correntes, que ajudaram o jovem jornalista a iniciar uma carreira de sucesso no jornalismo televisivo.</p>
<p>Aqui no site 'Olha que Duas', nesta data querida, hoje juntamos as vozes para cantar e entoar, com uma salva de palmas, os muitos parabéns a Luís Maia.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-equipa.jpg" alt="Luís Maia com Susana e a equipa da Casa Feliz no estúdio">
<h2>Da Duvídeo ao 'Você na TV!'</h2>
<p>Em reportagem exclusiva, nos bastidores da sua vida, descobrimos ainda que o jornalista trabalhou na RTP, através da produtora Duvídeo, no espaço agora ocupado pelo 'Bom Dia, Portugal'. Em 2000, com Guilherme Simões, agora pivô das noites da SIC Notícias, no 'Hora Viva - Segurança em Directo'.</p>
<p>Em 2004, fez parte da equipa que lançou o êxito 'Você na TV!' e viu o despontar da dupla Cristina Ferreira e Manuel Luís Goucha. Viu a jovem tímida transformar-se na estrela da TVI, ele que também trabalhou com a 'patroa' do canal 4 no 'Programa da Cristina' na SIC.</p>
<p>O percurso de Luís Maia é vasto, diversificado, um currículo de luxo. Também na televisão agora dirigida por Daniel Oliveira, trabalhou na saudosa Comunicasom, de Manolo Bello, na crónica criminal do 'SIC 10 Horas' anfitriado por Fátima Lopes.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-arquivo-sic.jpg" alt="Imagens de arquivo de Luís Maia na SIC">
<h2>O palerma da praxe</h2>
<p>Foi por ali que conheceu e tornou-se no melhor amigo do "mano" Hernâni Carvalho. Na faculdade, no Instituto Superior de Ciências Sociais e Políticas da Universidade de Lisboa (ISCSP), Luís estudava Comunicação Social e o apresentador do 'Linha Aberta' entrou como caloiro em Ciência Política. Anos mais tarde, já em contexto de trabalho, quando Luís perguntou se ele o conhecia, o "justiceiro" da SIC respondeu, à gargalhada:</p>
<blockquote><p>"Ah, tu é que eras o palerma que me queria praxar..."</p></blockquote>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-hernani.jpg" alt="Luís Maia no estúdio enquanto Hernâni Carvalho fala da longa amizade">
<h2>Sempre em direto, no Parque Holanda</h2>
<p>Desde 2011 na SIC, com escritório no Parque Holanda, onde são feitos os programas 'Casa Feliz', 'Júlia', 'Passadeira Vermelha', entre outros da SIC, SIC Caras, Mulher e Radical, mesmo em frente às antigas instalações da estação fundada por Emídio Rangel, Luís Maia percorre também o país a relatar os crimes, a história dos protagonistas, os relatos dos familiares e vizinhos. Sempre em direto do local.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-autopsia.jpg" alt="Luís Maia num estúdio da SIC">
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-casa-feliz.jpg" alt="Luís Maia na cozinha da Casa Feliz">
<h2>'Lux', 'Survivor' e o 11 de Setembro</h2>
<p>Pelo meio, também teve uma perninha no mundo cor de rosa e nos reality shows. Foi parte integrante do 'Lux', o magazine social abrilhantado por Rita Seguro e Diogo Morgado, e trabalhou com Teresa Guilherme no selvagem 'Survivor'. A 11 de Setembro de 2001, estava a viajar do Panamá para Miami, quando tiveram que voltar para trás, após o ataque aos Estados Unidos, a tragédia das Torres Gémeas.</p>
<h2>Susana, a Lia e o dia de Angélico</h2>
<p>Luís Maia não gosta muito de falar da vida pessoal. O importante é o casamento feliz com Susana Maia, maquilhadora profissional. Juntos desde 2011, oficializaram a união a 7 de Junho de 2015. Têm dois filhos: o Afonso, que faz 13 anos em Dezembro, e a Lia, fruto de uma relação anterior de Susana, mas que para Luís é mais que uma enteada.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-familia.jpg" alt="Luís Maia com Susana, Lia e Afonso">
<p>E é aqui que entra Angélico Vieira na vida desta família. Lia tinha três anos, quando Luís Maia ia conhecer a menina. Porém, o momento coincidiu com o brutal acidente que vitimou o eterno D'Zrt. O repórter das manhãs da SIC teve que ir de imediato para o Porto, para acompanhar os últimos dias de Angélico, e só mais tarde viu Lia pela primeira vez:</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-angelico.jpg" alt="Angélico Vieira">
<blockquote><p>"Um amor eterno, uma família de quatro carinhosa e muito cúmplice."</p></blockquote>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-natal.jpg" alt="Luís Maia, Susana, Lia e Afonso no Natal">
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-familia-casa.jpg" alt="Luís Maia em casa com Susana, Lia e Afonso">
<h2>'O Meu Filho Não Dorme' e a festa dos 50</h2>
<p>Agora que já sabe tudo sobre o jornalista e o homem, realizado e feliz aos 50, fique com mais este detalhe: pode comprar e ler o livro de Luís Maia, um testemunho real sobre a privação de sono dos pais, 'O Meu Filho Não Dorme'.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-filhos.jpg" alt="Luís Maia com o filho Afonso ao longo dos anos">
<p>Para além disso, é professor na pós-graduação em Criminologia no ISCSP e dá aulas também na pós-graduação em Enfermagem Forense no Centro de Ensino Superior Politécnico e Universitário (CESPU).</p>
<p>No fim-de-semana, o jornalista vai juntar familiares, colegas e amigos para a festa do meio século. E faz ele muito bem! Razões não lhe faltam para comemorar a vida. Que seja sempre assim!</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-jantar.jpg" alt="Luís Maia num jantar de família">
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-amigos.jpg" alt="Luís Maia com amigos">$luis50$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/vinagre-luis-maia-50-og.jpg',
  true,
  '2026-10-15 21:30:00+01',
  '7c2a9e14-5b60-4f83-9d21-6a0e8c4b17d3'
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
