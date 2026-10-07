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
