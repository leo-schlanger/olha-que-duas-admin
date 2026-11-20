-- Programas, fase 4 (20/11/2026): Entrevistas (Trabalhos -> Programas). Aditivo; os álbuns 13 e 14
-- ficam na base, só despublicados (reversão no fim). Fotos ficam no Cloudinary, sem mover ficheiros.
begin;
insert into exclusive_programs (slug, title, author, tagline, description, long_description, portrait_url, portrait_focus, cover_url, sort_order, is_published)
select 'entrevistas', 'Entrevistas', 'Olha que Duas', $t$Conversas longas, em vídeo e na íntegra$t$, $t$Entrevistas da Rádio Olha que Duas em vídeo e na íntegra: Carlos Cruz em conversa com Dylan Pires e a atriz Helena Isabel com Marluce Revorêdo.$t$, $t$Nas Entrevistas, o Olha que Duas senta-se com figuras da televisão e da cultura portuguesas e deixa a conversa correr, sem cortes para caber num minuto. Cada entrevista fica no site em vídeo, com as respostas na íntegra, o texto da conversa e fotografias de arquivo pessoal e da imprensa. Para já há duas: Carlos Cruz, o «Senhor Televisão», em conversa com Dylan Pires, dos anos em Angola ao Zip Zip; e a atriz Helena Isabel, com Marluce Revorêdo, sobre as escolhas da profissão, os trabalhos que recusou e o Algarve da infância. Não há horário na rádio: veja quando quiser.$t$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-entrevistas.jpg', 'center',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-entrevistas.jpg', 5, true
where not exists (select 1 from exclusive_programs where slug = 'entrevistas');
insert into vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, video_url, is_published, published_at, program_id, author, seo_title, seo_description)
select 'carlos-cruz-senhor-televisao', $t$Carlos Cruz, o Senhor Televisão: uma conversa com Dylan Pires$t$, $t$Entrevista de Dylan Pires a Carlos Cruz, produzida pela Rádio Olha que Duas. Dos primeiros anos em Angola ao Zip Zip, da televisão que ajudou a inventar à…$t$, $t$<p>Entrevista de Dylan Pires a Carlos Cruz, produzida pela Rádio Olha que Duas. Dos primeiros anos em Angola ao Zip Zip, da televisão que ajudou a inventar à injustiça que o marcou: as respostas na íntegra, em vídeo. Fotografias de arquivo pessoal e da imprensa.</p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/senhor-televisao-carlos-cruz-20260920/02" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/senhor-televisao-carlos-cruz-20260920/03" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/senhor-televisao-carlos-cruz-20260920/04" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/senhor-televisao-carlos-cruz-20260920/05" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/senhor-televisao-carlos-cruz-20260920/06" alt="" /></p>$t$, 'https://res.cloudinary.com/dfljesvj7/image/upload/w_1600,h_1000,c_fill,g_auto,q_auto,f_auto/olhaqueduas/galeria/senhor-televisao-carlos-cruz-20260920/01', 'https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_auto/olhaqueduas/galeria/senhor-televisao-carlos-cruz-20260920/01', 'https://www.youtube.com/watch?v=l4pnW2DHr-8', true, timestamptz '2026-09-20 19:19:00+00',
  (select id from exclusive_programs where slug = 'entrevistas'), $t$Dylan Pires$t$, $t$Carlos Cruz, o Senhor Televisão: entrevista em vídeo$t$, $t$Entrevista de Dylan Pires a Carlos Cruz, produzida pela Rádio Olha que Duas. Dos primeiros anos em Angola ao Zip Zip, da televisão que ajudou a.$t$
where not exists (select 1 from vinagre_posts where slug = 'carlos-cruz-senhor-televisao');
insert into vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, video_url, is_published, published_at, program_id, author, seo_title, seo_description)
select 'helena-isabel', $t$Helena Isabel: uma conversa sobre escolhas, medos e a idade$t$, $t$Entrevista de Marluce Revorêdo à atriz Helena Isabel, pelo Olha que Duas. A escolha da profissão contra o conselho da mãe, os trabalhos que recusou por…$t$, $t$<p>Entrevista de Marluce Revorêdo à atriz Helena Isabel, pelo Olha que Duas. A escolha da profissão contra o conselho da mãe, os trabalhos que recusou por princípio, os cheiros que a devolvem ao Algarve da infância e a irreverência que guarda para os amigos: as respostas na íntegra, em vídeo. Fotografias de arquivo pessoal e da imprensa.</p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/02" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/03" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/04" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/05" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/06" alt="" /></p>
<p><img src="https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/07" alt="" /></p>$t$, 'https://res.cloudinary.com/dfljesvj7/image/upload/w_1600,h_1000,c_fill,g_auto,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/01', 'https://res.cloudinary.com/dfljesvj7/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_auto/olhaqueduas/galeria/helena-isabel-20260707/01', 'https://www.youtube.com/watch?v=_82YQ4ZzbJQ', true, timestamptz '2026-09-22 10:54:00+00',
  (select id from exclusive_programs where slug = 'entrevistas'), $t$Marluce Revorêdo$t$, $t$Helena Isabel: entrevista em vídeo | Olha que Duas$t$, $t$Entrevista de Marluce Revorêdo à atriz Helena Isabel, pelo Olha que Duas. A escolha da profissão contra o conselho da mãe, os trabalhos que recusou.$t$
where not exists (select 1 from vinagre_posts where slug = 'helena-isabel');
update gallery_albums set is_published = false where id in (13, 14);
-- Grelha: horas iguais às da rádio (skills/oqd/references/radio.md). Golden Time vai até às 21h à sexta.
update daily_schedule set slot_time = '17h-18h25' where id = '67ca1fa9-239c-4137-937e-4bf06ed0943b';
update daily_schedule set slot_time = '19h30-20h' where id = '8c5fac14-6ff8-467c-865c-dd9aab92d355';
commit;

-- down:
-- update gallery_albums set is_published = true where id in (13, 14);
-- delete from vinagre_posts where slug in ('carlos-cruz-senhor-televisao','helena-isabel'); delete from exclusive_programs where slug = 'entrevistas';
-- update daily_schedule set slot_time = '17h-19h' where id = '67ca1fa9-239c-4137-937e-4bf06ed0943b'; update daily_schedule set slot_time = '19h-21h' where id = '8c5fac14-6ff8-467c-865c-dd9aab92d355';
