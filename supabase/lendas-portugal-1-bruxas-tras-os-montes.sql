-- Lendas de Portugal, lenda 1: Bruxas de Trás-os-Montes: o azeite, a água e o mau-olhado
-- Peça = reel 9:16 (~2 min) no lugar da capa + texto. Correr depois de
-- vinagre-posts-video.sql e seed-lendas-de-portugal.sql.
-- Texto: redator, supabase/rascunhos/lendas-portugal.md (peça 1), 30/10. O marcador
-- <!-- VIDEO --> do rascunho saiu: o site mostra o vídeo acima do texto (video_url).
--
-- ENTRA COMO RASCUNHO (is_published=false, sem vídeo). Não publicar sem o Leo dizer
-- que o vídeo foi aprovado pelo qa. O vídeo vai para o YouTube (carregado pelo Leo):
-- o URL entra no UPDATE de publicar, no fim. O ON CONFLICT não mexe em is_published,
-- published_at nem video_url: voltar a correr isto não esconde, não republica e não apaga o vídeo.
-- Imagens do designer já no media-library (30/10): exclusivo-lenda-bruxas-tras-os-montes-capa.jpg (1600x1000),
-- -og.jpg (1200x630) e -poster.jpg (720x1280, miniatura antes do iframe do YouTube).

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'lenda-bruxas-tras-os-montes',
  'Bruxas de Trás-os-Montes: o azeite, a água e o mau-olhado',
  'Em Trás-os-Montes, «ir à bruxa» nunca foi motivo para benzer. Três pingos de azeite num prato de água dizem se alguém lhe pôs o olho em cima.',
  $lenda1$<p>Em Trás-os-Montes, quando alguém diz «vou à bruxa», ninguém se benze. Vai-se à bruxa como quem vai à farmácia.</p>
<h2>A mulher que benze</h2>
<p>Lá em cima, a bruxa é muitas vezes a mulher que benze. Conhece as ervas, sabe as rezas de cor e trata aquilo que o médico não vê: o quebranto e o mau-olhado.</p>
<p>Os sinais são conhecidos de qualquer avó. Bocejos sem fim, sono a meio do dia, falta de apetite e uma moleza no corpo que não passa. Quando aparecem juntos, já ninguém duvida.</p>
<h2>Três pingos de azeite</h2>
<p>A benzedeira pega num prato branco com água, molha o dedo no azeite e deixa cair três pingos. Depois espera.</p>
<p>Se os pingos ficam inteiros, está tudo bem. Se o azeite se desfaz e se espalha pela água, alguém lhe pôs o olho em cima.</p>
<p>Nesse caso, reza-se e faz-se a cruz por cima da pessoa. Repete-se durante três dias seguidos, até o azeite ficar quieto no prato.</p>
<h2>O padre-bruxo de Vilar de Perdizes</h2>
<p>No Barroso, em Vilar de Perdizes, concelho de Montalegre, o padre António Lourenço Fontes passou a vida a recolher estas rezas e estas ervas. Juntou na aldeia curandeiros, ervanários e videntes num Congresso de Medicina Popular que ficou famoso no país inteiro. Chamaram-lhe o padre-bruxo, e ele nunca se queixou da alcunha.</p>
<p>Agora pense bem. Nos últimos dias, alguém olhou para si com muita vontade?</p>
<p><em><strong>Marluce:</strong> «Olharam, sim. E eu deixei. Tem olhado que é elogio, viu?»</em></p>
<p><strong>De onde vem esta lenda.</strong> A benzedeira chamada «bruxa» e a recolha de ervas e orações do Padre Fontes estão descritas na revista <em>Numen</em> (Universidade Federal de Juiz de Fora, 2025). O Congresso de Medicina Popular e a alcunha de padre-bruxo vêm de reportagens do <em>Correio da Manhã</em> e do <em>Diário de Notícias</em>. A prova do azeite na água aparece em muitas recolhas de benzedura portuguesas e brasileiras, sem uma aldeia certa.</p>$lenda1$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-bruxas-tras-os-montes-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-bruxas-tras-os-montes-og.jpg',
  '',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-bruxas-tras-os-montes-poster.jpg',
  NULL,
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'lendas-de-portugal'),
  '',
  'Bruxas de Trás-os-Montes: a lenda do mau-olhado',
  'Três pingos de azeite num prato de água: assim a bruxa transmontana via o mau-olhado. A lenda e o padre-bruxo de Vilar de Perdizes.'
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
    WHERE slug = 'lenda-bruxas-tras-os-montes'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%')
  ) THEN
    RAISE EXCEPTION 'lenda-bruxas-tras-os-montes: há campos PENDENTE ou falta o programa; nada foi gravado';
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
-- WHERE slug = 'lenda-bruxas-tras-os-montes';
