-- Lendas de Portugal, lenda 3: Santa Compaña: a procissão das almas que anuncia a morte
-- Peça = reel 9:16 (~2 min) no lugar da capa + texto. Correr depois de
-- vinagre-posts-video.sql e seed-lendas-de-portugal.sql.
-- Texto: redator, supabase/rascunhos/lendas-portugal.md (peça 3), 30/10. O marcador
-- <!-- VIDEO --> do rascunho saiu: o site mostra o vídeo acima do texto (video_url).
--
-- ENTRA COMO RASCUNHO (is_published=false). Não publicar sem o Leo dizer que o
-- vídeo foi aprovado pelo qa. O ON CONFLICT não mexe em is_published nem em
-- published_at: voltar a correr isto não esconde nem republica a peça.
--
-- Antes de publicar, no media-library (nomes fixos, já usados abaixo):
--   exclusivo-lenda-santa-companha.mp4         reel aprovado (Desktop/video/entregas/olha-que-duas/lendas-portugal/),
--                                versão web 720x1280 H.264 CRF ~26 +faststart, < 50 MB (limite do projeto)
--   exclusivo-lenda-santa-companha-poster.jpg  720x1280, 1.º plano com o título da lenda
--   exclusivo-lenda-santa-companha-capa.jpg    1600x1000 e exclusivo-lenda-santa-companha-og.jpg 1200x630 (designer, arte/site/)
-- e video_duration_seconds = duração do MP4 (ffprobe). O UPDATE de publicar exige-a.

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'lenda-santa-companha',
  'Santa Compaña: a procissão das almas que anuncia a morte',
  'Cheiro a cera num caminho escuro, sem igreja por perto. É a Santa Compaña, a procissão das almas que sai à meia-noite na Galiza e no Norte de Portugal.',
  $lenda3$<p>Se um dia, num caminho escuro, sentir cheiro a cera derretida e não houver igreja por perto, não olhe para trás.</p>
<h2>A procissão das almas</h2>
<p>Na Galiza, do lado de lá do rio Minho, chamam-lhe Santa Compaña. Cá no Norte, há quem lhe chame Santa Companha. É a procissão das almas.</p>
<p>Sai à meia-noite e anda pelos caminhos da aldeia: vultos de capuz branco, cada um com a sua vela acesa, a arrastar os pés na terra.</p>
<p>À frente vai um vivo. É um vizinho, que leva a cruz e, por vezes, um caldeirinho de água benta. De manhã não se lembra de nada.</p>
<h2>A cruz que passa de mão</h2>
<p>Diz-se que a procissão vem anunciar uma morte e que passa à porta de quem vai partir.</p>
<p>O vivo da frente só se liberta de uma maneira: encontrar alguém no caminho e entregar-lhe a cruz. Quem a recebe fica com o lugar dele.</p>
<p>Por isso, se a encontrar, não pegue em nada. Faça um círculo no chão e fique lá dentro. Melhor ainda: deite-se de barriga para baixo e espere que passe.</p>
<h2>As alminhas de Mondim da Beira</h2>
<p>Mais a sul, em Mondim da Beira, José Leite de Vasconcelos registou que, na noite dos Fiéis Defuntos, se viu uma procissão de luzes no caminho. Eram as alminhas.</p>
<p>E agora, que cheiro é este? Alguém acendeu uma vela aí em casa?</p>
<p><em><strong>Marluce:</strong> «Fui eu, tá? Vela de baunilha. Alma penada não usa baunilha… eu acho.»</em></p>
<p><strong>De onde vem esta lenda.</strong> A Santa Compaña é uma lenda do noroeste da Península Ibérica, da Galiza às Astúrias e ao Norte de Portugal. Os capuzes brancos, as velas, o vivo com a cruz e o caldeirinho, o cheiro a cera e o círculo no chão estão na entrada «Santa Compaña» da Wikipedia em inglês; o anúncio de morte, no guia Viaje Caminho de Santiago. A procissão de luzes de Mondim da Beira vem de Ernesto Veiga de Oliveira, <em>Festividades cíclicas em Portugal</em>, que cita Leite de Vasconcelos.</p>$lenda3$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-santa-companha-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-santa-companha-og.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-santa-companha.mp4',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-santa-companha-poster.jpg',
  NULL,
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'lendas-de-portugal'),
  '',
  'Santa Compaña: a lenda da procissão das almas',
  'Vultos de capuz branco com velas, um vivo à frente com a cruz: a Santa Compaña da Galiza e do Norte de Portugal, e como se escapa dela.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  video_url = EXCLUDED.video_url,
  video_poster_url = EXCLUDED.video_poster_url,
  video_duration_seconds = EXCLUDED.video_duration_seconds,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM vinagre_posts
    WHERE slug = 'lenda-santa-companha'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%')
  ) THEN
    RAISE EXCEPTION 'lenda-santa-companha: há campos PENDENTE ou falta o programa; nada foi gravado';
  END IF;
END
$guard$;

COMMIT;

-- Publicar (SÓ depois de o Leo dizer que o vídeo foi aprovado pelo qa).
-- Hora já passada: a leitura filtra published_at <= now(). Sem duração, não publica.
-- UPDATE vinagre_posts SET is_published = true, published_at = now() - interval '1 minute'
--   WHERE slug = 'lenda-santa-companha' AND video_url <> '' AND video_duration_seconds IS NOT NULL;
