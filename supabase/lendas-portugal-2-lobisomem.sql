-- Lendas de Portugal, lenda 2: O lobisomem português e o fado de correr sete adros
-- Peça = reel 9:16 (~2 min) no lugar da capa + texto. Correr depois de
-- vinagre-posts-video.sql e seed-lendas-de-portugal.sql.
-- Texto: redator, supabase/rascunhos/lendas-portugal.md (peça 2), 30/10. O marcador
-- <!-- VIDEO --> do rascunho saiu: o site mostra o vídeo acima do texto (video_url).
--
-- ENTRA COMO RASCUNHO (is_published=false, sem vídeo). Não publicar sem o Leo dizer
-- que o vídeo foi aprovado pelo qa. O vídeo vai para o YouTube (carregado pelo Leo):
-- o URL entra no UPDATE de publicar, no fim. O ON CONFLICT não mexe em is_published,
-- published_at nem video_url: voltar a correr isto não esconde, não republica e não apaga o vídeo.
-- Imagens do designer já no media-library (30/10): exclusivo-lenda-lobisomem-capa.jpg (1600x1000),
-- -og.jpg (1200x630) e -poster.jpg (720x1280, miniatura antes do iframe do YouTube).

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'lenda-lobisomem',
  'O lobisomem português e o fado de correr sete adros',
  'O sétimo filho rapaz nasce marcado e, aos treze anos, sai de casa à meia-noite para correr o fado. A lenda do lobisomem nas aldeias portuguesas.',
  $lenda2$<p>Há homens que não escolhem o que são à noite. Quem escolhe é o fado.</p>
<h2>O sétimo filho</h2>
<p>Contava-se assim nas aldeias. O sétimo filho rapaz, numa casa sem raparigas, nasce marcado. Noutras terras, é o rapaz que vem depois de sete irmãs. Em qualquer dos casos, o fado chega aos treze anos.</p>
<p>À meia-noite, ele sai de casa sem dizer nada a ninguém. Vai até uma encruzilhada e despe-se ali, no meio do caminho. Procura o sítio onde um bicho se espojou e espoja-se também.</p>
<p>Levanta-se feito esse bicho. Nem sempre é lobo: às vezes é cão, às vezes burro, às vezes cabra.</p>
<h2>Correr o fado</h2>
<p>E corre. Sete adros, sete encruzilhadas, sete lugares da freguesia, até de madrugada. É a isto que o povo chama correr o fado, e por isso lhe dão o nome de corredor.</p>
<p>As avós apagavam a luz cedo, porque se dizia que ele só entra em casa onde há luz acesa.</p>
<h2>Como se quebra o fado</h2>
<p>Há cura, e é pequena. Um golpe ligeiro, uma gota de sangue: faz-se sangrar o corredor e o fado quebra-se.</p>
<p>Mas tenha cuidado. Esse sangue não lhe pode tocar na pele. Diz-se que pega.</p>
<p><em><strong>Marluce:</strong> «Sete filhos homens, gente? O lobisomem é o de menos. Coitada é da mãe!»</em></p>
<p><strong>De onde vem esta lenda.</strong> A encruzilhada à meia-noite e o espojar-se onde um animal se espojou estão nos <em>Opúsculos</em> de Alexandre Herculano. «Correr o fado» e o lobisomem que nem sempre é lobo vêm de <em>O Maravilhoso Popular</em> (2000), de Alexandre Parafita, e o sangue do «corredor» da <em>Revista Lusitana</em> de José Leite de Vasconcelos. O sétimo filho, os treze anos, os sete adros e a luz acesa foram recolhidos por Leite de Vasconcelos (<em>Contos Populares e Lendas</em>) e por J. C. Duarte Moura (<em>Histórias e Superstições na Beira Baixa</em>, 2008).</p>$lenda2$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-lobisomem-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-lobisomem-og.jpg',
  '',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-lobisomem-poster.jpg',
  NULL,
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'lendas-de-portugal'),
  '',
  'O lobisomem português: a lenda do corredor',
  'O sétimo filho rapaz, a encruzilhada à meia-noite e os sete adros até de madrugada: como as aldeias portuguesas contavam o lobisomem.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  video_poster_url = EXCLUDED.video_poster_url,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM vinagre_posts
    WHERE slug = 'lenda-lobisomem'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%')
  ) THEN
    RAISE EXCEPTION 'lenda-lobisomem: há campos PENDENTE ou falta o programa; nada foi gravado';
  END IF;
END
$guard$;

COMMIT;

-- Publicar (SÓ depois de o Leo dizer que o vídeo foi aprovado pelo qa).
-- Trocar <URL> pelo endereço do YouTube (youtube.com/shorts/ID, watch?v=ID ou youtu.be/ID).
-- Hora já passada: a leitura filtra published_at <= now(). A duração é opcional
-- (segundos; melhora o VideoObject): tirar o comentário se a souber.
-- UPDATE vinagre_posts SET
--   video_url = '<URL>',
--   -- video_duration_seconds = 118,
--   is_published = true,
--   published_at = now() - interval '1 minute'
-- WHERE slug = 'lenda-lobisomem';
