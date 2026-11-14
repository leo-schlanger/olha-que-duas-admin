-- Curtas Biografias: Frida Kahlo e a porta da Casa Azul (só texto).
-- Texto: redator, Desktop/video/projetos/bio-frida-kahlo/producao/peca-site.md (14/11/2026),
-- factos com 2 fontes em producao/factos-verificados.md. Copiado sem alterações.
-- Decisão do Leo (14/11): o vídeo da biografia NÃO vai para o site; sem video_url nem poster.
-- author vazio, como nas outras Curtas Biografias (o site mostra o autor do programa).
--
-- Capa e og: scripts/capas/pecas/frida-kahlo.json, a partir de capa-fonte-frida-kahlo.jpg
-- (Guillermo Kahlo, 16/10/1932, domínio público, Commons «File:Frida Kahlo, by Guillermo
-- Kahlo.jpg»; fundo alargado aos lados para caber em 16:10 com a cabeça inteira).
-- Nenhum quadro da Frida (direitos até 2054).
--
-- O ON CONFLICT não mexe em is_published nem published_at: voltar a correr isto não esconde
-- nem republica. A descrição do programa muda em curtas-biografias-descricao.sql.

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'frida-kahlo',
  'Frida Kahlo e a porta da Casa Azul que ficou fechada meio século',
  'Pintou-se deitada, com um espelho no dossel da cama. Depois da morte dela, uma porta da Casa Azul esperou quase cinquenta anos para abrir.',
  $frida$<p>Quando Frida Kahlo morreu, em julho de 1954, parte da Casa Azul ficou fechada à chave. Pouco antes de morrer, em 1957, Diego Rivera pediu à amiga Dolores Olmedo que não abrisse durante quinze anos a casa de banho do quarto dele. Ela foi mais longe: enquanto viveu, manteve trancadas também a casa de banho de Frida, baús e roupeiros. Só em 2004 se abriu tudo.</p>
<h2>Coyoacán, 1907 (ou 1910)</h2>
<p>Frida nasceu a 6 de julho de 1907, em Coyoacán, na casa dos pais que hoje é a Casa Azul. Mais tarde passou a dizer que tinha nascido em 1910, o ano em que começou a Revolução Mexicana. Queria ser filha dela.</p>
<p>Aos seis anos, a poliomielite deixou-lhe a perna direita mais fina e mais curta. Na escola chamavam-lhe «Frida pata de palo». Em 1922 entrou na Escola Nacional Preparatória: numa geração de dois mil alunos, havia 35 raparigas. Frida queria ser médica.</p>
<h2>O autocarro e o elétrico</h2>
<p>A 17 de setembro de 1925, aos 18 anos, voltava para casa de autocarro quando um elétrico embateu contra ele. Um corrimão de metal atravessou-lhe a anca. A coluna partiu em três sítios. Passou meses deitada, presa a um colete de gesso, e ao longo da vida foi operada muitas vezes.</p>
<h2>Um espelho no dossel</h2>
<p>Sem poder sair da cama, pediu ao pai a caixa de tintas. A mãe mandou fazer um cavalete para pintar deitada e pôr um espelho no dossel da cama. O modelo que Frida tinha à frente era ela própria. Assim começaram os autorretratos.</p>
<h2>Diego Rivera</h2>
<p>Em 1928 foi mostrar os quadros a Diego Rivera, muralista já famoso e mais de vinte anos mais velho, para saber se valia a pena continuar. Ele incentivou-a. Casaram a 21 de agosto de 1929.</p>
<p>Diego teve muitas relações fora do casamento. A que mais a magoou foi com Cristina, a irmã mais nova de Frida. Divorciaram-se em 1939 e voltaram a casar em dezembro de 1940, em São Francisco.</p>
<h2>«Pintei a minha própria realidade»</h2>
<p>André Breton chamou-lhe surrealista. Em 1939, o Estado francês comprou-lhe um autorretrato, <em>O Marco</em>, para o Louvre; hoje está no Centre Pompidou. Frida recusou sempre o rótulo. À revista <em>Time</em>, em 1953, explicou: «Achavam que eu era surrealista, mas não era. Nunca pintei sonhos. Pintei a minha própria realidade.»</p>
<h2>Abril de 1953</h2>
<p>No México, só teve uma exposição individual em vida, em abril de 1953, na galeria de Lola Álvarez Bravo. Chegou de ambulância, contra o conselho dos médicos, e recebeu os convidados deitada na sua cama de dossel, levada para a sala. Em agosto, por causa da gangrena, amputaram-lhe a perna direita abaixo do joelho. Nesse ano escreveu no diário: «Pés, para que os quero, se tenho asas para voar?»</p>
<p>Morreu na Casa Azul a 13 de julho de 1954, aos 47 anos. No fim do diário deixou uma despedida: «Espero alegre a saída, e espero não voltar jamais.»</p>
<h2>A porta</h2>
<p>Dolores Olmedo morreu em 2002. Dois anos depois, a equipa do museu abriu as casas de banho, os roupeiros e as gavetas. Encontrou mais de 22 mil documentos, vestidos tradicionais mexicanos, coletes de gesso pintados à mão e a perna ortopédica com uma bota de couro vermelho, bordada, desenhada por ela.</p>
<p>Em novembro de 2025, <em>O Sonho (A Cama)</em>, um quadro de 1940 em que Frida se pintou a dormir, foi vendido em Nova Iorque por 54,7 milhões de dólares, o preço mais alto alguma vez pago em leilão por uma obra de uma mulher.</p>
<p><strong>De onde vem esta história.</strong> A biografia oficial e o guia da Casa Azul do Museo Frida Kahlo; a Wikipédia e a Biography.com; a revista <em>Time</em> de 27 de abril de 1953; o Victoria and Albert Museum e o jornal <em>Excélsior</em>, sobre a casa de banho fechada; o Centre Pompidou, sobre <em>O Marco</em>; a NPR e a Artnet, sobre o leilão de 2025.</p>$frida$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-frida-kahlo-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-frida-kahlo-og.jpg',
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'curtas-biografias'),
  '',
  'Frida Kahlo: a vida e a porta fechada da Casa Azul',
  'Frida Kahlo nasceu e morreu na Casa Azul. Um acidente aos 18 anos, Diego Rivera e a porta que só se abriu em 2004, com a perna da bota vermelha.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

COMMIT;

-- PUBLICAR (corrido a 14/11/2026, com a ordem do Leo para publicar só o texto):
-- UPDATE vinagre_posts SET
--   is_published = true,
--   published_at = now() - interval '1 minute'
-- WHERE slug = 'frida-kahlo';
