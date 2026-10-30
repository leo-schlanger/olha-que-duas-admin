-- Lendas de Portugal, lenda 4: Almas penadas e avantesmas: a mesa posta para os mortos
-- Peça = reel 9:16 (~2 min) no lugar da capa + texto. Correr depois de
-- vinagre-posts-video.sql e seed-lendas-de-portugal.sql.
-- Texto: redator, supabase/rascunhos/lendas-portugal.md (peça 4), 30/10. O marcador
-- <!-- VIDEO --> do rascunho saiu: o site mostra o vídeo acima do texto (video_url).
--
-- ENTRA COMO RASCUNHO (is_published=false, sem vídeo). Não publicar sem o Leo dizer
-- que o vídeo foi aprovado pelo qa. O vídeo vai para o YouTube (carregado pelo Leo):
-- o URL entra no UPDATE de publicar, no fim. O ON CONFLICT não mexe em is_published,
-- published_at nem video_url: voltar a correr isto não esconde, não republica e não apaga o vídeo.
-- Imagens do designer já no media-library (30/10): exclusivo-lenda-almas-penadas-capa.jpg (1600x1000),
-- -og.jpg (1200x630) e -poster.jpg (720x1280, miniatura antes do iframe do YouTube).

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'lenda-almas-penadas',
  'Almas penadas e avantesmas: a mesa posta para os mortos',
  'Em Barqueiros, à meia-noite, punha-se a mesa com castanhas para os mortos da família. As almas penadas, as alminhas e o Dia dos Fiéis Defuntos.',
  $lenda4$<p>Em Barqueiros, ao pé de Mesão Frio, punha-se a mesa à meia-noite, com castanhas. E não era para os vivos.</p>
<h2>A mesa dos mortos</h2>
<p>Era para os mortos da família, na noite entre o Dia de Todos-os-Santos e o Dia dos Fiéis Defuntos. De manhã, ninguém tocava naquelas castanhas. Diziam que estavam babadas dos mortos.</p>
<p>Primeiro vem o 1 de novembro, Todos-os-Santos. A seguir, a 2, os Fiéis Defuntos. Em muitas terras acreditava-se que, nesses dias, os mortos andam pelo mundo.</p>
<p>São as almas penadas, as que ainda não encontraram descanso. Quando aparecem, o povo chama-lhes avantesmas.</p>
<h2>As alminhas dos caminhos</h2>
<p>Pelos caminhos do Norte há pequenos nichos de pedra nas bermas e nas encruzilhadas. São as alminhas: almas pintadas entre as chamas, de mãos postas, a pedir uma reza.</p>
<p>Quem passa deixa uma flor, uma moeda, um padre-nosso. Os antigos diziam que eram uma barreira, porque alma com reza não precisa de vir bater à porta.</p>
<h2>Os santórios debaixo da almofada</h2>
<p>Em Lamego, os santórios, bolos compridos de massa de bolo podre que se faziam pelos Fiéis, iam para debaixo da almofada das crianças. Era para os mortos não lhes comerem as orelhas.</p>
<p>Por isso, se numa noite destas ouvir bater à porta à meia-noite, espere pela manhã. Os vivos batem de dia.</p>
<p><em><strong>Marluce:</strong> «Mesa posta à meia-noite pra quem já morreu? Aqui em casa, castanha na mesa não amanhece. Nem com alma penada, nem sem.»</em></p>
<p><strong>De onde vem esta lenda.</strong> A mesa com castanhas de Barqueiros, as castanhas «babadas dos mortos» e os santórios de Lamego e Mondim da Beira estão em Ernesto Veiga de Oliveira, «Manjares cerimoniais de Todos os Santos e Fiéis Defuntos», em <em>Festividades cíclicas em Portugal</em> (Etnográfica Press). As alminhas como barreira às almas penadas vêm de um estudo da Faculdade de Letras da Universidade do Porto, e «avantesma», aparição de uma pessoa morta, do Dicionário Priberam.</p>$lenda4$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-almas-penadas-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-almas-penadas-og.jpg',
  '',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-almas-penadas-poster.jpg',
  NULL,
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'lendas-de-portugal'),
  '',
  'Almas penadas e avantesmas: lendas dos Fiéis Defuntos',
  'Castanhas para os mortos em Barqueiros, alminhas nas encruzilhadas, santórios em Lamego: as almas penadas no folclore português.'
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
    WHERE slug = 'lenda-almas-penadas'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%')
  ) THEN
    RAISE EXCEPTION 'lenda-almas-penadas: há campos PENDENTE ou falta o programa; nada foi gravado';
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
-- WHERE slug = 'lenda-almas-penadas';
