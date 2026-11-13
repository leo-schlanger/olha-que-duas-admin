-- Lendas de Portugal, lenda 5: Templários e sexta-feira 13: o Templo que mudou de nome
-- Peça = short 9:16 (~2 min) no lugar da capa + texto. Correr depois de
-- vinagre-posts-video.sql e seed-lendas-de-portugal.sql.
-- Texto: redator, supabase/rascunhos/lendas-portugal.md (peça 5), 07/11. O marcador
-- <!-- VIDEO --> do rascunho saiu: o site mostra o vídeo acima do texto (video_url).
-- author vazio, como nas lendas 1-4 (o rascunho diz Alexandra Serra em todas).
--
-- O ON CONFLICT não mexe em is_published, published_at nem video_url: voltar a correr
-- isto não esconde, não republica e não apaga o vídeo.
-- Imagens do kit dos reels (Desktop/video/projetos/lendas-portugal-2026/arte/site/, 07/11),
-- no media-library desde 13/11: exclusivo-lenda-templarios-sexta-feira-13-capa.jpg (1600x1000),
-- -og.jpg (1200x630) e -poster.jpg (720x1280, miniatura antes do iframe do YouTube).

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'lenda-templarios-sexta-feira-13',
  'Templários e sexta-feira 13: o Templo que mudou de nome',
  'Na sexta-feira, 13 de outubro de 1307, a França prendeu os Templários. Em Portugal, D. Dinis guardou-lhes os bens e, em 1319, nasceu a Ordem de Cristo.',
  $lenda5$<p>Na noite de 12 para 13 de outubro de 1307, uma sexta-feira, abriu-se a mesma carta em toda a França. Tinha chegado semanas antes, fechada, com ordem para só ser aberta nessa noite.</p>
<h2>A carta que se abriu numa sexta-feira 13</h2>
<p>A ordem vinha do rei Filipe IV e era uma só: prender todos os Templários. Os cavaleiros da Ordem do Templo, monges e soldados ao mesmo tempo, acordaram com os homens do rei à porta. Em quase dois séculos, a Ordem tinha juntado castelos, terras e riqueza em meia Europa, e nessa madrugada começou a cair.</p>
<p>Foram interrogados debaixo de tortura, e muitos confessaram.</p>
<h2>A fogueira de Jacques de Molay</h2>
<p>Em 1314, em Paris, o grão-mestre Jacques de Molay subiu à fogueira. Conta-se que, entre as chamas, chamou o rei e o papa ao tribunal de Deus antes de passar um ano.</p>
<p>O papa Clemente V morreu cerca de um mês depois. O rei Filipe IV morreu em novembro desse mesmo ano.</p>
<p>Há quem diga que foi aí que nasceu o azar da sexta-feira 13. Mas em Portugal a história foi outra.</p>
<h2>Tomar, a casa dos Templários</h2>
<p>Foi D. Afonso Henriques quem lhes concedeu estas terras. Em Tomar, os Templários começaram a erguer o castelo em 1160, no alto do monte sobre o rio Nabão. Lá dentro fica a charola, a igreja octogonal dos cavaleiros, que ainda hoje se visita no Convento de Cristo. Era ali a sede da Ordem em Portugal.</p>
<h2>D. Dinis esperou</h2>
<p>Os bens do Templo deviam passar para outra ordem, a do Hospital. D. Dinis não os entregou. Esperou.</p>
<p>Em 1319, o papa João XXII aprovou a Ordem de Cristo, que herdou os castelos, as terras e os bens do Templo em Portugal. Herdou também uma cruz vermelha, parecida com a dos Templários.</p>
<p>A sede da nova ordem começou em Castro Marim, no Algarve, e passou para Tomar em 1357. Na prática, o Templo só mudou de nome.</p>
<h2>A cruz nas velas das caravelas</h2>
<p>Em 1420, o Infante D. Henrique passou a governar a Ordem de Cristo. Um século depois das prisões em França, a cruz da Ordem ia pintada nas velas das caravelas.</p>
<h2>A Sexta 13 de Montalegre</h2>
<p>No Barroso, a data ganhou outra fama. Em Montalegre, a sexta-feira 13 é dia de festa desde 2002. Começa às 13h13 e o ponto alto é a queimada, a bebida de aguardente que esconjura os males, ligada ao padre António Fontes, o padre-bruxo da primeira lenda.</p>
<p>Por isso, se numa sexta-feira 13 lhe chegar uma carta fechada, abra-a de dia.</p>
<p><em><strong>Marluce:</strong> «Quer dizer que o azar ficou todo lá na França? Gostei de Portugal. Cavaleiro encrencado, aqui, muda de nome… e ainda ganha caravela.»</em></p>
<p>Na rádio Olha que Duas, sexta-feira, 13 de novembro, às 9h13, 13h13, 16h13, 21h13 e 23h13.</p>
<p><strong>De onde vem esta lenda.</strong> As prisões de 13 de outubro de 1307, a carta fechada e a maldição de Jacques de Molay vêm do <em>Observador</em>; as datas da fogueira e das mortes do papa e do rei, da Wikipédia. Tomar, a charola e a Ordem de Cristo em 1319 estão na página dos Templários da Câmara Municipal de Tomar, e a sede em Castro Marim, na Wikipédia, «Ordem de Cristo». A Sexta 13 de Montalegre vem de reportagens do <em>24noticias</em> e da RFM.</p>$lenda5$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-templarios-sexta-feira-13-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-templarios-sexta-feira-13-og.jpg',
  '',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-templarios-sexta-feira-13-poster.jpg',
  NULL,
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'lendas-de-portugal'),
  '',
  'Os Templários e a sexta-feira 13: a lenda e Tomar',
  'A 13 de outubro de 1307, uma sexta-feira, a França prendeu os Templários. Em Portugal, o Templo passou a Ordem de Cristo e a cruz foi nas caravelas.'
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
    WHERE slug = 'lenda-templarios-sexta-feira-13'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%')
  ) THEN
    RAISE EXCEPTION 'lenda-templarios-sexta-feira-13: há campos PENDENTE ou falta o programa; nada foi gravado';
  END IF;
END
$guard$;

COMMIT;

-- PUBLICADA a 13/11/2026 (Leo autorizou): video_url = https://www.youtube.com/shorts/oGQlOZf1v4Q,
-- duração 111 s (yt-dlp 111; ffprobe de entregas/.../lenda-5-templarios.mp4 = 111,21 s).
-- UPDATE vinagre_posts SET
--   video_url = 'https://www.youtube.com/shorts/oGQlOZf1v4Q',
--   video_duration_seconds = 111,
--   is_published = true,
--   published_at = now() - interval '1 minute'
-- WHERE slug = 'lenda-templarios-sexta-feira-13';
