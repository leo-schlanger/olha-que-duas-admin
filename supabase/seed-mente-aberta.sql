-- Mente Aberta, com Marluce Revorêdo.
-- Correr depois de exclusive-programs.sql. Imagens no media-library.
-- Episódio 1: o ódio que cresce num tempo em que temos tudo. Também vai para a
-- rádio (Desktop/video/entregas/mente-aberta/mente-aberta-ep01-radio.*).

INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  'eddc0013-2f3c-46e7-966b-8c6c1155d902',
  'mente-aberta',
  'Mente Aberta',
  'Marluce Revorêdo',
  'Reflexões para cuidar de si, por dentro',
  'O espaço de reflexão de Marluce Revorêdo, terapeuta de desenvolvimento pessoal e hipnose clínica. Um olhar sereno sobre o mundo, as pessoas e o que se passa dentro de nós.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-retrato-marluce-revoredo.jpg',
  'center',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-mente-aberta.jpg',
  5,
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
  'temos-tudo-e-o-odio-cresce',
  'Temos tudo e o ódio cresce: será que vale a pena?',
  'No primeiro Mente Aberta, Marluce Revorêdo olha para a violência que tem enchido as notícias no Brasil, em França e em Portugal, e deixa uma pergunta a cada um de nós: vale a pena carregar o ódio?',
  $menteaberta1$<p>Hoje gostaria de falar... Quer dizer, não gostaria de falar, mas vou falar sobre os últimos acontecimentos no mundo e nas pessoas. E é realmente uma pena que tudo isto esteja a acontecer numa época em que temos tudo.</p>
<p>Há 300 anos, nem os reis tinham o que a dita classe pobre tem hoje. Não tinham telemóveis, não tinham água corrente, não tinham gás em casa. Raramente podiam tomar banho, e para falar com alguém só por mensagem: dias e dias a cavalo para a entregar, dias e dias para voltar com a resposta. Hoje falamos de graça com o mundo inteiro.</p>
<h2>O ódio que nos corrói</h2>
<p>E, no entanto, o ódio cresce cada vez mais dentro de nós. Corrói-nos a alma, corrói-nos o coração. Porque simplesmente não damos valor ao que temos nem ao que sentimos. Não nos respeitamos a nós próprios e não respeitamos o outro.</p>
<p>É aí que começam as guerras, a falta de compreensão, o exigir mais do que podemos ter, mais do que aquilo que realmente merecemos. E o ódio instala-se: contra o próximo, contra a família, contra os amigos, contra a nação, contra os países, contra tudo. É uma pena que não se queira endireitar esse lado.</p>
<h2>Mudar não é fácil</h2>
<p>Sei do que falo. Trabalho com desenvolvimento pessoal e hipnose clínica, e já ajudei a transformar muitas vidas, aquelas que queriam ser transformadas. Mas também encontrei muitas pessoas que desistiam à segunda ou à terceira sessão. Porque não é fácil mudar quando o mundo está todo do avesso. Não é fácil procurarmos os nossos sentimentos reais.</p>
<p>Acredito que cada ser humano nasce com amor, com simpatia, com empatia. Há casos raros, de psicopatia ou de doenças que levam as pessoas a odiar e a não sentir o outro. Mas a maior parte de nós nasce com essa capacidade. Depois somos consumidos pelos media, pela educação, pelo ódio, pelos preconceitos, por todas as parvoíces que existem à nossa volta. E muito poucos conseguem sair disso. São os chamados rebanhos. Só que hoje, parece-me, os rebanhos são de ovelhas pretas e raramente sai uma ovelha branca lá do meio.</p>
<h2>Acordar com notícias tristes</h2>
<p>Nestes últimos dias tenho acordado com notícias muito tristes na Europa, no Brasil e em Portugal. De violência, de mortes, de coisas estranhas que acontecem. Estranhas para mim e para quem não vê o mundo dessa forma. Tenho pena que esteja a acontecer tanta coisa esquisita que já não devia acontecer. Já não devia.</p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/mente-aberta-ep01-brasil.jpg" alt="Agente da Polícia Judicial num local de voto em Brasília, na primeira volta das eleições de 2026">
<p><em>Brasil. Polícia Judicial num local de voto em Brasília, na primeira volta das eleições, a 4 de outubro. Entre 16 de agosto e 4 de outubro, as organizações Terra de Direitos e Justiça Global contaram 134 casos de violência política no país, dois deles assassinatos. Foto: Saulo Cruz/Agência Senado, <a href="https://commons.wikimedia.org/wiki/File:Elei%C3%A7%C3%B5es_2026_-_Primeiro_turno_(55569129539).jpg">CC BY-SA 4.0</a>.</em></p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/mente-aberta-ep01-franca.jpg" alt="Bombeiro de Paris junto a um carro em chamas no Boulevard Voltaire, a 17 de outubro de 2026">
<p><em>França. Bombeiro de Paris junto a um carro em chamas no Boulevard Voltaire, a 17 de outubro. Os protestos contra o custo de vida acabaram em confrontos em várias cidades francesas, com mais de 160 detidos. Foto: Jorge Jaramillo, <a href="https://commons.wikimedia.org/wiki/File:Paris_riots,_17_October_2026_-_Firefighter_approaching_a_burning_car_-_JJxFile_0029.jpg">CC BY-SA 4.0</a>.</em></p>
<img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/mente-aberta-ep01-portugal.jpg" alt="Cartaz contra o preço das rendas numa manifestação pela habitação em Lisboa">
<p><em>Portugal. Manifestação Casa para Viver, em Lisboa, em março. A luta pela habitação voltou às ruas em outubro: a 15, uma intervenção da PSP num protesto na Praça D. João I, no Porto, deixou dezenas de feridos, segundo o movimento; a PSP fala num polícia ferido. Foto: Rafael Medeiros/Esquerda.net, <a href="https://commons.wikimedia.org/wiki/File:Manifesta%C3%A7%C3%A3o_Casa_para_Viver,_Lisboa,_Mar.2026_(55160416679).jpg">CC BY-SA 4.0</a>.</em></p>
<h2>Que mundo deixamos?</h2>
<p>Devíamos estar muito mais evoluídos no amor, na cumplicidade, na verdade, no companheirismo de todos. Não só de um casal, de uma família ou de uns vizinhos, mas de todos. Porque temos condições para isso. Infelizmente, o ser humano está a ir por outro caminho, e é triste. Muito triste mesmo. Tenho filhos, tenho netos, e não sei que caminho o mundo vai tomar para eles.</p>
<h2>Olhar para dentro</h2>
<p>Com esta reflexão, gostava que repensassem um pouco. Não no mundo, não nos outros, mas sobretudo em vocês. O que vos magoa? O que vos traumatiza? O que vos faz ter raiva, inveja, mágoa de outras pessoas?</p>
<p>Valerá a pena carregar isso? Valerá a pena gastar esta oportunidade de vida que Deus nos deu a gerar ódio, a deixar de ver e de sentir o que é lindo na vida?</p>
<blockquote><p>Será que vale a pena?</p></blockquote>
<p><em>Marluce Revorêdo é terapeuta de desenvolvimento pessoal e hipnose clínica. Para quem quer cuidar de si por dentro, acompanha presencialmente e online em <a href="https://motivar.pt">motivar.pt</a>. O Mente Aberta chega em breve à rádio Olha que Duas.</em></p>$menteaberta1$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/mente-aberta-ep01-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/mente-aberta-ep01-og.jpg',
  true,
  '2026-10-19 16:00:00+01',
  'eddc0013-2f3c-46e7-966b-8c6c1155d902'
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
