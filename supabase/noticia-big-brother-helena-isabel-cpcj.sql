-- Notícias Olha que Duas: Helena Isabel invoca a CPCJ contra Ana Sousa no Especial do Big Brother All Stars (29/10).
-- Texto da Alexandra Serra (WhatsApp, 2026-10-30), revisto e publicado no mesmo dia.
-- «Segundo a Hiper FM…» tem uma só fonte: cortar se a produção ou a TVI disserem outra coisa.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'noticia-big-brother-helena-isabel-cpcj',
  'Helena Isabel invoca a CPCJ contra Ana Sousa no Big Brother All Stars',
  'No Especial de quinta-feira, Helena Isabel Patrício respondeu a Ana Sousa com uma referência à CPCJ e ao filho da colega. Ana saiu em lágrimas para o confessionário e a casa uniu-se contra a frase.',
  $bb$<p><strong>O Especial do Big Brother All Stars, na quinta-feira, 29 de outubro, ficou marcado por uma frase que ultrapassou os limites do jogo.</strong> Em pleno direto, conduzido por Maria Botelho Moniz, Helena Isabel Patrício respondeu a Ana Sousa com uma referência à Comissão de Proteção de Crianças e Jovens (CPCJ), a propósito do filho da colega.</p>
<h2>Da lavandaria ao direto</h2>
<p>O conflito entre as duas concorrentes já vinha de trás. Começou na lavandaria, numa troca de gritos em que Helena Isabel respondeu à rival com provocações sobre o filho.</p>
<p>No Especial, depois de mais uma discussão acesa, Helena atirou: <em>«Vais gritar com o teu filho quando tu quiseres.»</em> Ana garantiu que não o fazia: <em>«Não vou gritar, eu não grito com ele.»</em> A resposta veio sem hesitar: <strong><em>«Não sei, a CPCJ é que vai ver.»</em></strong></p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-noticia-big-brother-helena-isabel-cpcj-confronto.jpg" alt="Helena Isabel Patrício e Ana Sousa no Big Brother All Stars"></p>
<p><em>Helena Isabel e Ana Sousa no Big Brother All Stars. Imagem: TVI</em></p>
<h2>Ana Sousa em lágrimas no confessionário</h2>
<p>A frase caiu como uma bomba. Ana Sousa desfez-se em lágrimas, em pânico, e foi levada por Francisco Monteiro até ao confessionário. Miguel Vicente e Francisco levantaram-se dos sofás em protesto, e Maria Botelho Moniz pediu «calma nas palavras».</p>
<p>Helena Isabel não recuou: <em>«É a minha opinião. Se a Ana não está bem, é um problema dela.»</em></p>
<h2>A casa unida contra a frase</h2>
<p>As críticas chegaram de todos os lados. Francisco Monteiro descreveu-a como <em>«completamente descontrolada»</em>. Joana Albuquerque acusou-a de usar os gritos como desculpa para <em>«as coisas horríveis»</em> que diz a Ana. Jéssica Maria pediu à produção que deixasse de <em>«proteger a Helena»</em>, e Carlos Sousa resumiu: <em>«Há palavras que não se usam, há palavras que se podiam evitar.»</em></p>
<p>Coube a Maria Botelho Moniz tranquilizar Ana. A apresentadora lembrou que todos, incluindo os mais próximos de Helena, condenaram o comentário e sublinharam que Ana é uma excelente mãe: <em>«É um comentário infeliz, sim, é um comentário que tem peso, sim. Tente não levar isto a fundo aí dentro. É um disparate e é só isso.»</em></p>
<p>Segundo a Hiper FM, Helena Isabel recebeu um aviso do Big Brother, mas não foi sancionada.</p>
<h2>Onde acaba o jogo?</h2>
<p>Num reality show, as palavras pesam e as estratégias valem muito. Mas trazer a proteção de uma criança para uma discussão, e usar o nome de uma entidade tão séria como a CPCJ para atingir uma adversária, deixa uma pergunta no ar: onde termina o entretenimento e começa a falta de empatia?</p>$bb$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-noticia-big-brother-helena-isabel-cpcj-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-noticia-big-brother-helena-isabel-cpcj-og.jpg',
  true,
  '2026-10-30 14:10:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Helena Isabel invoca a CPCJ contra Ana Sousa no BB All Stars',
  'No Especial do Big Brother All Stars, Helena Isabel disse a Ana Sousa que «a CPCJ é que vai ver». Ana saiu em lágrimas e a casa condenou a frase.'
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
