-- Céu de Cada Mês, com a taróloga Teresa (Exclusivo, 16/11/2026).
-- Rubrica mensal da rádio (evento «Céu de cada mês», emissões em schedule_dates; ver
-- ceu-novembro-2026.sql) passada a texto: quatro leituras do baralho cigano.
-- Textos: supabase/rascunhos/ceu-de-cada-mes/textos.md (redator; corpo markdown → HTML,
-- sem outras alterações). Abril: tirada a frase «Amanhã trazemos então as previsões para o
-- signo de Caranguejo, Leão e Virgem.» (a 2.ª parte não existe). Maio/Balança como está.
-- Imagens do designer no media-library: capa 3:4 e retrato (portrait_focus center) do
-- programa; capa e og por episódio (scripts/capas/pecas/ceu-de-cada-mes-2026-MM.json).
-- published_at às 10:30 de Lisboa (AT TIME ZONE trata da hora de verão).
-- Ordem na lista: 7.º (exclusive-programs-order.sql). Idempotente (ON CONFLICT).
-- Correr depois de exclusive-programs.sql. Não mexe em events/schedule.

BEGIN;
INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  'c3e5d1a8-7b2f-4e69-9a04-5f8d2b6c1e37',
  'ceu-de-cada-mes',
  'Céu de Cada Mês',
  'Teresa',
  'As energias de cada mês, lidas nas cartas',
  'Às 10:30, na rádio, a taróloga Teresa tira as cartas do baralho cigano e lê as energias do mês, para todos nós e, em alguns meses, signo a signo.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-retrato-ceu-de-cada-mes.png',
  'center',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-ceu-de-cada-mes.jpg',
  7,
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
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'ceu-de-cada-mes-2026-04',
  'Céu de Cada Mês, Abril de 2026 (1.ª parte)',
  'A Libertação é a carta que rege abril para todos. Nesta primeira parte, a Teresa lê as cartas de Carneiro, Touro e Gémeos: a Torre, a Chave e os Lírios.',
  $ceu202604$<h2>A energia de abril: a Libertação</h2>
<p>Antes de iniciarmos com os três primeiros signos do zodíaco, irei deixar também a energia geral do mês de abril para todos nós. Para qualquer que seja o signo, será a energia que irá reger o mês de abril. E a carta que está com a energia para este mês é a carta da Libertação.</p>
<p>E o que é que esta carta nos pede? Pede-nos isso mesmo, que consigamos nos libertar de amarras que temos tido até o momento. É chegada a altura de deixar para trás o que não nos pertence, o que já não é nosso, e seguirmos o nosso caminho. É uma altura também, o mês de abril, que a primavera já se está aqui a afirmar, já existe aqui a necessidade de termos atenção ao caminho que estamos a trilhar.</p>
<p>Há sol, há luz e é isso que o Universo nos pede, que prossigamos nesse caminho de luz para conseguirmos alcançar o tão esperado sucesso, que é o que todos queremos.</p>
<h2>Carneiro: a Torre</h2>
<p>O mês de abril para Carneiro traz-nos então a carta da Torre. A carta da Torre, o que é que nos ajuda a compreender aqui para os carneiros? Tem que ter atenção. Pede aqui um bocadinho de se resguardarem, de se fecharem com eles próprios, porque está na altura, e juntamente com a carta da Libertação, de serem tomadas decisões que poderão ser a base para o futuro.</p>
<p>Há necessidade de se fecharem em si próprios, compreenderem o que já não querem levar, o que não querem manter de pé e deixarem então que caia o que é para ficar, para conseguirem estar seguros neles próprios e se manterem fortes para o que virá a seguir.</p>
<h2>Touro: a Chave</h2>
<p>A seguir, temos o signo de Touro, e o signo de Touro no mês de abril será regido pela carta da Chave. E a Chave traz aqui a Touro mudanças, no sentido de que está na altura de se colher, está na altura de recuperar aqui algumas situações que se julgavam fechadas.</p>
<p>É um mês em que o virar da chave vai trazer aqui alternativas que não se estavam a ver até o momento, ideias novas que podem surgir para negócios, para avançar projetos. Até mesmo algo que até agora o taurino não tinha pensado pode começar a vislumbrar o sucesso de uma outra forma, e é isso mesmo que pede: a coragem de virar a chave.</p>
<p>Como alerta para este mês, esta carta para os taurinos traz a necessidade também de terem atenção a quem entra no mundo deles. A chave aqui também pode significar que é a altura de fechar a porta para determinadas pessoas ou situações que já não me fazem crescer, não me agregam nada e só me estão a atrapalhar.</p>
<h2>Gémeos: os Lírios</h2>
<p>Gémeos, Gémeos traz com ele a energia da carta dos Lírios. E o que os Lírios trarão no mês de abril aos geminianos? Tranquilidade, paz nas escolhas. O geminiano vai estar seguro das decisões que está a tomar, vai estar contente com o caminho que está a levar e há aqui uma certa tranquilidade que até pode assustá-los.</p>
<p>É um signo de muito movimento, é um signo que também tem alguma inconsistência: hoje quer uma coisa, amanhã poderá não querer. E este mês vai sentir que está parado demais para ele, ele próprio, nos pensamentos.</p>
<p>E esse pode ser um ponto contra Gémeos, porque Gémeos é um signo que precisa de andamento e que está habituado a ter esse aflorar de todas as emoções. E ao sentir-se muito parado, pode-se sentir frustrado.</p>
<p>Um beijinho e até amanhã.</p>
<p><em>Esta é a primeira parte da leitura de abril de 2026, com Carneiro, Touro e Gémeos. A Teresa é taróloga e lê o baralho cigano no Céu de Cada Mês, às 10:30, na rádio Olha que Duas.</em></p>$ceu202604$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-04-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-04-og.jpg',
  true,
  TIMESTAMP '2026-04-01 10:30' AT TIME ZONE 'Europe/Lisbon',
  (SELECT id FROM exclusive_programs WHERE slug = 'ceu-de-cada-mes'),
  'Teresa',
  'Tarot de abril de 2026: Carneiro, Touro e Gémeos (1.ª parte)',
  'Primeira parte da leitura de abril de 2026 da taróloga Teresa: a Libertação para todos e as cartas de Carneiro, Touro e Gémeos no baralho cigano.'
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

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'ceu-de-cada-mes-2026-05',
  'Céu de Cada Mês, Maio de 2026',
  'O Despertar é a carta de maio para todos. A Teresa lê depois a carta de cada um dos 12 signos, de Carneiro a Peixes, e o que cada uma pede ao longo do mês.',
  $ceu202605$<h2>A energia de maio: o Despertar</h2>
<p>Olá, sou a Teresa, bem-vindos ao mês de maio. E começamos então com a carta regente que traz a energia para todos os signos. Este mês fomos agraciados com a carta do Despertar.</p>
<p>Faz todo o sentido, sendo que no mês de abril vínhamos com a carta da Libertação. Acabamos por ter que concluir, à força ou não, alguns dos nossos ciclos, e agora estamos num processo de despertar, de ver o que deixamos para trás, de ver também o que temos à nossa frente e vermos a melhor forma de conseguirmos construir o futuro que tanto queríamos, mas que estávamos presos a energias que já não eram as nossas.</p>
<p>Este despertar, o que é que às vezes nos pode trazer? Aqui há algumas indecisões, algum impasse, porque ainda estamos num processo de aprendizagem da nova estrutura que queremos criar. Então o que é que o Universo nos pede? Despertar sim, com consciência, com o coração também, mas não perder o foco no que queremos para mais à frente, sem nunca perdermos a nossa energia.</p>
<h2>Carneiro: as Flores</h2>
<p>O que é que este mês trará essencialmente a Carneiro? Carneiro saiu-lhe a carta das Flores, o que é uma carta bastante auspiciosa, pois traz surpresas, traz alegrias, transmite também encontros de pessoas que poderão ocorrer como numa casualidade, mas que serão pessoas que trarão aqui alegria, movimento, alegria e surpresa à vida do Carneiro.</p>
<p>O Carneiro terá também aqui a possibilidade, durante este mês, de fazer escolhas através destas mesmas surpresas que vão surgindo na sua vida. Terá que optar o que é que deseja fazer, que caminho quer tomar. Tem aqui uma carta que lhe dá a possibilidade de viver a vida de forma leve, com alegrias, e até mudar um pouco o que achava que já estaria certo na sua vida.</p>
<p>Como aspeto menos positivo para o mês de maio, o que é que esta carta pode trazer a Carneiro? Um bocadinho de inconsistência, porque vai andar tão absorvido entre saídas ou entre surpresas, novos conhecimentos, que poderá descurar um pouco a vida que já tem estruturada. Será que uma hipótese de se manter o equilíbrio será a grande escolha para Carneiro?</p>
<h2>Touro: o Cão</h2>
<p>Seguimos então com o signo de Touro. E Touro tem a carta para o mês de maio do Cão. A carta do Cão é um amigo fiel, é alguém que se junta aqui na caminhada de Touro durante o mês de maio, que lhe vai trazer aqui a possibilidade de Touro descansar um pouco no ombro do seu amigo. Sinto que Touro terá um mês tranquilo, mas vai-lhe fazer bem saber que tem alguém ao seu lado caso necessite de um apoio extra.</p>
<p>Como carta menos positiva, poderá surgir aqui também um amigo que roube demasiado tempo a Touro, ou seja, que exija de Touro mais presença do que é habitual. E Touro poderá sentir-se desgastado, no sentido de não querer falhar a essa amizade, mas também estar-se a sentir sobrecarregado com a energia que lhe está a ser retirada.</p>
<h2>Gémeos: o Jardim</h2>
<p>Por fim, teremos então o signo de Gémeos. Gémeos tem a carta regente o Jardim. E o que é que esta carta transmite para Gémeos? É um mês que é muito propício a viagens, a encontros, a saídas, reuniões com amigos, e que terá aqui a hipótese de refazerem boas recordações. É uma carta que transmite, acima de tudo, para o signo de Gémeos a forma de viver sem grande expectativa: ir viver o momento, criar memórias, sem levar as coisas pré-definidas neste período da sua vida.</p>
<p>Como um aspeto negativo, poderá ocorrer aqui a fuga de Gémeos para viver um mês sem grandes responsabilidades, quase como se fosse uma criança a viver no parque, no jardim, e não tivesse preocupações. Aqui cabe ao signo de Gémeos, que já é um signo que muitas vezes fica ali a lutar entre os caminhos a escolher, ou entre a forma séria e a forma mais divertida de se comportar… Cabe aqui ao signo de Gémeos este mês fazer uma escolha, e tudo com peso, conta e medida, para que estas saídas se tornem benéficas a nível do futuro.</p>
<h2>Caranguejo: a Estrela</h2>
<p>Caranguejo este mês tem a carta da Estrela. É uma carta que, para o signo de Caranguejo, pede-lhe aqui essencialmente que se oiça a si próprio. Caranguejo é um signo de água, que é muito emotivo e por vezes deixa-se perder nas emoções dos outros. E o que a espiritualidade quer para este mês é que Caranguejo se oiça a ele próprio, oiça a sua estrela interior e faça com que ela saia e brilhe para o mundo. Só assim ele conseguirá alcançar o que tanto almeja sempre, que é o bem-estar de toda a gente que está à sua volta.</p>
<p>Como o aspeto que poderá não ser tão positivo? É Caranguejo, por vezes, perder-se no mundo das estrelas: fica a sonhar, fica a ver com o que quer e não coloca em prática. Portanto, este mês a espiritualidade e o que os astros pedem a Caranguejo é o equilíbrio também: ouvir-se a si próprio e realizá-lo, não deixar tudo no mundo dos sonhos.</p>
<h2>Leão: o Coração</h2>
<p>Seguimos então com o signo de Leão, e Leão tem a carta regente o Coração. E o que é que o Coração vai pedir este mês a Leão? Que oiça, que oiça ao seu coração, que entregue amor em tudo o que faça, que entregue carinho aos outros, que entregue carinho e amor a si próprio também. É um mês que estará aqui muito virado também para relacionamentos.</p>
<p>Se existe alguma decisão a ser tomada, é escutar o coração e fazê-la com grande amor, porque será uma decisão para a vida. Se for algo que seja, que tenha que ser retirado no coração, também ter a noção de que não ficará de coração vazio, que o próprio Universo irá propor que esse coração seja novamente repleto de amor.</p>
<h2>Virgem: a Foice</h2>
<p>Por fim, temos o signo de Virgem. E Virgem, no mês de maio, temos a suportá-lo a carta da Foice. A carta da Foice pede aqui a Virgem que tome certas atitudes de uma vez por todas, que deixe de andar a aparar a erva, por assim dizer, e a corte pela raiz, para não voltar a crescer. É um mês em que a Virgem terá que fazer, então, cortes significativos na sua vida, na sua maneira de estar, na sua maneira de pensar, mas que esses cortes também lhe vão trazer uma colheita mais à frente.</p>
<p>É Virgem, e Virgem é um signo muito prático, é um signo que antes de tomar uma decisão pensa em todas as consequências que terá. Mas chegou o momento de cortar, já está pensado, e Virgem tem a certeza de que irá conseguir de alguma forma alcançar o que tinha idealizado. E por vezes necessitamos de um corte para depois, sim, deixar crescer o que nos interessa e o que é bonito deixar florir.</p>
<h2>Balança</h2>
<p>Neste mês de maio, a carta de Balança pede aqui a astúcia e forma prática na resolução de alguns problemas que já se estão a arrastar na vida de Balança.</p>
<p>Balança é um signo que muitas vezes duvida das próprias decisões, precisa sempre de alguém ali a dar-lhe suporte. E este mês a Balança será o suporte de Balança: não deverá contar com ninguém, deverá tomar as decisões por si só, com uma forma prática, astuta, de uma forma de imperador, sem se importar também com o que é que vai afetar os outros. É um momento de Balança, de decidir por si e para si.</p>
<h2>Escorpião: as Flores</h2>
<p>Escorpião. Escorpião tem a carta das Flores. É uma carta que traz aqui surpresas, alegrias inesperadas para Escorpião. Escorpião é um signo de água, de águas profundas, que muitas vezes vive escondido no seu mundo. E esta carta, o que pede a Escorpião no mês de maio é que saia, sobressaia, faça-se ver, mostre o seu lado mais alegre, o seu lado mais brilhante.</p>
<p>Escorpião é um signo que tende muito a isolar-se e a ser a ele por ele próprio, como se não pudesse contar com ninguém, e este mês vai ver que não. Que se ele se abrir e se mostrar ao mundo, a sua luz vai captar os outros e virão a ter com ele para proporcionar uma caminhada mais alegre.</p>
<h2>Sagitário: a Criança</h2>
<p>Por fim, o signo de Sagitário. Sagitário, este mês de maio, temos a carta regente, a carta da Criança. E o que é que esta carta pede aqui ao signo de Sagitário? Que viva com a inocência de uma criança, mas também com a audácia de aprender todos os dias um pouco mais, não se resignar ao que já sabe, ao que já faz e ao que já tem. A criança pede esse impulso de «estou sempre pronto para mais, quero mais e preciso de mais».</p>
<p>Como aspeto negativo, esta carta pode trazer no mês de maio ao signo de Sagitário a tendência a birras, a fazer-se de vítima, a precisar que os outros lhe deem colo, quase como se fosse uma criança que necessitasse ainda que toda a gente cuidasse dele. Quando, na verdade, Sagitário é um signo muito forte, que não precisa de ser cuidado; precisa, sim, de se deixar levar e fazer deste caminho uma aprendizagem benéfica.</p>
<h2>Capricórnio: o Chicote</h2>
<p>Capricórnio. No mês de maio, o Capricórnio está regido pela carta do Chicote. E esta carta, o que é que pede aqui ao signo de Capricórnio? Pede-lhe teimosia, persistência, ânimo e vigor no seu dia a dia, na realização do seu trabalho, das suas decisões. É um mês que terá que ser forte, terá que lutar. Nem sempre se sentirá agraciado pela sorte, por assim dizer, e a carta do Chicote remete a isso mesmo, a ter que ter uma luta constante.</p>
<p>Mas é um mês que, se Capricórnio mantiver no seu olhar essa meta, ele irá conseguir. Capricórnio é um signo muito prático e muito direcionado para os seus objetivos, e a carta do Chicote vai proporcionar isso mesmo.</p>
<p>Como o aspeto menos positivo para Capricórnio no mês de maio, é por vezes Capricórnio ficar preso a teimosias quando já não deveria estar a lutar por algo, e continua a insistir, o que poderá tornar-se até uma autopenalização. É lutar, mas saber quando também devemos largar este chicote.</p>
<h2>Aquário: a Carta</h2>
<p>Seguimos então com o signo de Aquário. E no signo de Aquário a carta que saiu foi a carta da Carta: a informação, a notícia. Vejo que no mês de maio o Aquário irá conseguir validar algumas situações que não tinha certezas. As informações começam a chegar até si de uma forma muito prática, quase sem Aquário procurar, como se o Universo lhe tivesse a entregar a correspondência que ele tanto esperava.</p>
<p>Como aspeto negativo, é um mês em que Aquário tem uma tendência para se fechar e para não dar notícias ao mundo à sua volta. Aquário vai estar muito centrada em si, na descoberta de certas situações que o levam a ter que se adaptar e formar novo caminho, e isso pode fechá-lo ao mundo à sua volta, que nem sempre compreende esta versão do signo de Aquário.</p>
<h2>Peixes: a Serpente</h2>
<p>Terminamos então com o signo de Peixes. E a carta que está a reger o mês de maio, este signo, é a carta da Serpente. E esta carta, o que é que pede a Peixes? Pede-lhe que muda a pele. Está na altura de ter um novo começo, uma nova vida, uma nova estrutura, novidades. Pede-lhe que se deixe de velhos hábitos que já não o levam a lado nenhum e que tire a roupa que já não lhe serve. É chegado o momento de uma renovação, de uma cura, por assim dizer, para este signo.</p>
<p>Como aspeto negativo, é uma carta que por vezes tem tendência a magoar os outros em sua própria defesa. E o alerta que dão ao signo de Peixes é: não é necessário magoarmos os outros para nos defendermos a nós próprios, temos que nos fazer validar sem atacar.</p>
<p>E foram as previsões para o mês de maio, sendo que inicialmente já foi abordado a energia do mês: é o Despertar, que eu aconselho a que oiçam também, para fazer a junção com o signo individualmente.</p>
<p><em>A Teresa é taróloga e lê o baralho cigano no Céu de Cada Mês, às 10:30, na rádio Olha que Duas.</em></p>$ceu202605$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-05-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-05-og.jpg',
  true,
  TIMESTAMP '2026-05-01 10:30' AT TIME ZONE 'Europe/Lisbon',
  (SELECT id FROM exclusive_programs WHERE slug = 'ceu-de-cada-mes'),
  'Teresa',
  'Tarot de maio de 2026: o Despertar e as cartas dos 12 signos',
  'A taróloga Teresa lê no baralho cigano a energia de maio de 2026, o Despertar, e a carta de cada signo, de Carneiro a Peixes, com o lado bom e o alerta.'
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

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'ceu-de-cada-mes-2026-10',
  'Céu de Cada Mês, Outubro de 2026',
  'A Lua e o Cavaleiro guardam outubro. A Teresa lê as duas cartas, que falam de verdades escondidas e de romance e pedem andamento.',
  $ceu202610$<p>Olá, o meu nome é Teresa, sou taróloga e trago-vos mais uma vez as energias que vão reger. Desta vez, as energias que estão presentes no nosso mês de outubro. Relembro também que são energias gerais. Se alguém tiver interesse em consultas particulares, deixo também o meu contacto telefónico. Será então 966 201 853.</p>
<h2>A carta da Lua</h2>
<p>Avançamos então aqui com a energia para este mês. O mês de outubro, estamos aqui guardados pela carta da Lua e do Cavaleiro. A carta da Lua traz-nos então aqui duas situações. Traz-nos muitas verdades que virão ao de cima: coisas que estão ocultas, escondidas, têm tendência a mostrar-se mais visíveis durante este mês de outubro. E traz-nos também um clima propício a romances, a sentir-nos enamorados, seja pelo outro, seja por nós próprios.</p>
<h2>A carta do Cavaleiro</h2>
<p>A carta da Lua este mês está acompanhada pela carta do Cavaleiro, que é a carta número 1, ou seja, pede-nos andamento, pede-nos que nos coloquemos no caminho que queremos direcionar.</p>
<p>Fazendo então a conjugação das duas, temos aqui a hipótese de: se eu for atrás da minha verdade, ela será então revelada; se eu for atrás de um amor, ele também surgirá no meu caminho. São duas cartas muito boas, que nos permitem, além de sonhar, realizar e concretizar também.</p>
<p>Espero que todos tenham um excelente outubro, e qualquer questão já sabem como podem contactar.</p>
<p><em>A Teresa é taróloga e lê o baralho cigano no Céu de Cada Mês, às 10:30, na rádio Olha que Duas.</em></p>$ceu202610$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-10-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-10-og.jpg',
  true,
  TIMESTAMP '2026-10-05 10:30' AT TIME ZONE 'Europe/Lisbon',
  (SELECT id FROM exclusive_programs WHERE slug = 'ceu-de-cada-mes'),
  'Teresa',
  'Tarot de outubro de 2026: a carta da Lua e a do Cavaleiro',
  'A taróloga Teresa lê no baralho cigano as energias de outubro de 2026 para todos: a Lua, que fala de verdades e romance, e o Cavaleiro, que pede andamento.'
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

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'ceu-de-cada-mes-2026-11',
  'Céu de Cada Mês, Novembro de 2026',
  'Para a segunda metade de novembro, a Teresa tira a Torre e a Chave: a coragem de deixar cair o que já não tem sustento e de abrir e fechar portas.',
  $ceu202611$<p>Olá, o meu nome é Teresa, sou taróloga e hoje vou trazer as energias que vão abranger aqui a segunda metade do mês de novembro. Relembro que são energias globais para todos nós. E caso alguém pretenda alguma consulta mais específica sobre a própria energia, ou sobre outros temas que sejam preocupação do momento, deixo também o meu contacto. Será então 966 201 853. Poderá ser através do WhatsApp ou através de mensagem normal.</p>
<h2>A carta da Torre</h2>
<p>As energias para a segunda metade do mês de novembro: temos então a carta da Torre juntamente com a carta da Chave. E o que é que esta Torre nos vem aqui pedir? Vem-nos pedir que tenhamos a coragem de deixar cair o que neste momento já não tem sustento.</p>
<p>A carta da Torre é uma carta que nos lembra que nem sempre temos que estar fixos, nem sempre temos que segurar tudo em nós próprios, e assim mesmo é deixar cair o que já não nos fortalece, lembrando sempre que a nossa base, a nossa estrutura, é firme.</p>
<p>A carta da Torre traz-nos também muito uma energia de proteção: o estarmos guardados numa torre, o estarmos protegidos. E poderá-nos querer dizer que este mês é tempo de fazermos essa nossa autoproteção, sempre que acharmos necessário escondermo-nos na nossa própria torre, não deixar que sejam energias externas a tirar-nos a nossa paz.</p>
<h2>A carta da Chave</h2>
<p>A carta da Chave, por contrapartida, traz-nos aqui soluções a chegar. Essas soluções muitas vezes estão dependentes da quebra ou da queda de algo que já não tem qualquer razão de ser.</p>
<h2>O que pedem os últimos 15 dias</h2>
<p>Concluindo, o que é que o mês de novembro agora nos pede nestes últimos 15 dias? Coragem de abrir e fechar portas e deixar cair aquilo que não nos interessa. Não vale a pena termos a chave da nossa torre se depois também deixamos qualquer energia ou qualquer pessoa entrar.</p>
<p>É um momento de recolhimento, de reflexão, para nos prepararmos então para o último mês do ano, o mês de dezembro, mas já com uma consciência, quase como se estivéssemos já a fazer a nossa lista do que queremos e não queremos levar para 2027.</p>
<p>É uma carta também, a Torre juntamente com a Chave, que nos fala aqui da nossa força. A nossa força de conseguirmos decidir as decisões que temos que tomar. Nem tudo depende dos outros, quer seja o não tomarmos certas decisões, quer seja o estado em que a nossa vida se encontra. Depende de nós e de nossas escolhas.</p>
<p>Um resto de bom novembro para todos.</p>
<p><em>A Teresa é taróloga e lê o baralho cigano no Céu de Cada Mês, às 10:30, na rádio Olha que Duas.</em></p>$ceu202611$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-11-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ceu-de-cada-mes-2026-11-og.jpg',
  true,
  TIMESTAMP '2026-11-16 10:30' AT TIME ZONE 'Europe/Lisbon',
  (SELECT id FROM exclusive_programs WHERE slug = 'ceu-de-cada-mes'),
  'Teresa',
  'Tarot de novembro de 2026: a carta da Torre e a da Chave',
  'A taróloga Teresa lê no baralho cigano a segunda metade de novembro de 2026: a Torre, que pede para deixar cair o que já não serve, e a Chave.'
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

COMMIT;
