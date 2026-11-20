-- Programas, fase 3 (20/11/2026): hub com programas só de rádio. Aditivo; reversão no fim.
-- Textos: supabase/rascunhos/programas-radio-descricoes.md (redator; conflitos como ele escreveu).
begin;

insert into exclusive_programs (slug, title, author, tagline, description, long_description, portrait_url, portrait_focus, cover_url, sort_order, is_published, event_id)
select $t$top-10$t$, $t$Top 10 Olha que Duas$t$, $t$Olha que Duas$t$, $t$Dez canções, da décima à primeira, à sexta às 20h$t$, $t$Todas as sextas às 20h, dez canções contadas da 10.ª à 1.ª. Umas semanas são as que estão a subir em Portugal; noutras, os êxitos de um só artista.$t$, $t$O Top 10 é a contagem semanal da Rádio Olha que Duas: dez canções, da 10.ª à 1.ª, em cerca de 40 minutos, todas as sextas-feiras às 20:00. Há dois formatos. Nas semanas normais entram as músicas em subida nas tabelas portuguesas e no Spotify Portugal, sem repetir o episódio anterior. Nas semanas de especial, a lista é dedicada a um só artista, com um motivo de calendário, e ordenada pelos streams de cada canção no Spotify. Já houve especiais de Bryan Adams, U2 e Queen. Cada episódio tem página própria no site, com a lista completa e a data, para rever o que tocou.$t$, $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/1783250048790-chdv2e.png$t$, 'center', $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-top-10.jpg$t$, 8, true, 'd4e5b47a-ae1f-4cc5-a273-af8ebe92b765'
where not exists (select 1 from exclusive_programs where slug = $t$top-10$t$);
insert into exclusive_programs (slug, title, author, tagline, description, long_description, portrait_url, portrait_focus, cover_url, sort_order, is_published, event_id)
select $t$vidioteca-olha-que-duas$t$, $t$Vidioteca Olha que Duas$t$, $t$Olha que Duas$t$, $t$Filmes para ver, recomendados em meio minuto$t$, $t$Recomendações de filmes em menos de meio minuto, aos sábados às 13h e às 17h e aos domingos às 11h e às 17h, na Rádio Olha que Duas.$t$, $t$A Vidioteca é uma pausa curta na emissão para quem está a escolher o que ver no fim de semana: em menos de meio minuto, sugere filmes, com o essencial de cada um para decidir. Há uma peça nova todas as semanas, que passa aos sábados às 13:00 e às 17:00 e aos domingos às 11:00 e às 17:00. Se numa semana não houver peça nova, volta a passar a da semana anterior. É feita para ouvir a qualquer altura e sair com um título na cabeça.$t$, $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/vidioteca.png$t$, 'center', $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-vidioteca-olha-que-duas.jpg$t$, 9, true, '082485ef-c168-44d3-b72f-050c7cffc729'
where not exists (select 1 from exclusive_programs where slug = $t$vidioteca-olha-que-duas$t$);
insert into exclusive_programs (slug, title, author, tagline, description, long_description, portrait_url, portrait_focus, cover_url, sort_order, is_published, event_id)
select $t$cantinho-da-pequenada$t$, $t$Cantinho da Pequenada$t$, $t$Leonor$t$, $t$Música e histórias para os mais pequenos, com a Leonor$t$, $t$De segunda a sábado às 18h30, e ao sábado também às 11h: música para crianças, histórias e curiosidades com a Leonor. Na rádio e na área Kids.$t$, $t$O Cantinho da Pequenada é a parte da Rádio Olha que Duas feita para os mais pequenos, com a Leonor. Só toca música própria para crianças, sem palavrões, e pelo meio há curiosidades e dedicatórias de meninos e meninas. Passa de segunda a sábado, das 18:30 às 19:30, e ao sábado também de manhã, das 11:00 às 13:00, com um momento de histórias às 11:30. Ao domingo não há Cantinho. Em datas especiais, como o Halloween ou o aniversário do Baby Shark, a emissão tem programa próprio. Para jogos, músicas e o resto do mundo dos mais novos, vá à área Kids.$t$, $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/1776166765546-klx0ud.png$t$, 'center', $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-cantinho-da-pequenada.jpg$t$, 10, true, 'a08cdb61-fcea-479e-a6a1-8e0e20ee8bdd'
where not exists (select 1 from exclusive_programs where slug = $t$cantinho-da-pequenada$t$);
update exclusive_programs set tagline = $t$Desenvolvimento pessoal com Marluce Revorêdo$t$, description = $t$Às terças, às 11h e às 17h: Marluce Revorêdo, terapeuta de desenvolvimento pessoal e hipnose clínica, fala de emoções, ansiedade e propósito.$t$, long_description = $t$Mente Aberta é o programa de Marluce Revorêdo, terapeuta de desenvolvimento pessoal e hipnose clínica. Cada episódio pega num tema do dia a dia, como a ansiedade, a procrastinação ou o peso que se carrega sem ser nosso, e explica-o em linguagem simples, com exemplos de situações reais. Passa às terças-feiras, às 11:00 e às 17:00, na Rádio Olha que Duas, com um episódio novo por semana. No site fica cada episódio em texto, para reler com calma. É um espaço de reflexão: não substitui acompanhamento terapêutico nem médico.$t$ where slug = $t$mente-aberta$t$;
update exclusive_programs set tagline = $t$As energias de cada mês, lidas nas cartas$t$, description = $t$A taróloga Teresa tira as cartas do baralho cigano e lê as energias do mês. Na rádio às 10:30, em datas anunciadas a cada mês.$t$, long_description = $t$Céu de Cada Mês é a leitura mensal da taróloga Teresa. Uma vez por mês, ela tira as cartas do baralho cigano e diz que energias marcam o mês, para todos e, em alguns meses, signo a signo. Passa na Rádio Olha que Duas às 10:30, em datas anunciadas a cada mês; em novembro foram segunda 16, quarta 18 e sexta 20. No site fica cada leitura em texto, carta a carta, para voltar a ela durante o mês. É uma leitura de tarot, para inspirar e pensar, não um conselho para decisões de saúde, dinheiro ou lei.$t$ where slug = $t$ceu-de-cada-mes$t$;
update exclusive_programs set tagline = $t$Lendas portuguesas, à sexta às 22h na rádio$t$, description = $t$Lendas e mistérios de Portugal, um episódio por semana: na rádio à sexta às 22h e no site em vídeo. Um programa de Leo Schlanger.$t$, long_description = $t$Lendas de Portugal conta, episódio a episódio, as histórias que o país passou de boca em boca: bruxas, lobisomens, almas penadas, os Templários, D. Sebastião e a manhã de nevoeiro. O programa é da responsabilidade de Leo Schlanger. Na rádio, passa todas as sextas-feiras às 22:00; quando não há episódio novo, repete o da semana anterior. No site ficam os episódios em vídeo, para ver quando quiser.$t$ where slug = $t$lendas-de-portugal$t$;
update exclusive_programs set event_id = '7e0a2799-f6f6-4d7f-8d59-6edbe2dd291b' where slug = 'ceu-de-cada-mes';
-- Lendas: a sexta das 22:00 só começa a 27/11 (hoje à noite não há Lendas). A tabela schedule não tem
-- data de início: o semanal entra INATIVO e a 1.ª emissão vai como data (27/11). Ativar o semanal
-- com supabase/programas-lendas-ativar.sql entre sábado 21/11 e quinta 26/11.
insert into events (id, name, description, icon_url, is_active)
values ('4ed48be7-d5f6-437b-95b4-2d6e75b75315', 'Lendas de Portugal', 'Uma lenda portuguesa por semana. Sextas-feiras às 22h.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/lendas-de-portugal.png', true)
on conflict (id) do nothing;
insert into schedule (event_id, day_of_week, time, end_time, is_active, is_all_day)
select '4ed48be7-d5f6-437b-95b4-2d6e75b75315', 5, time '22:00', time '22:05', false, false
where not exists (select 1 from schedule where event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315' and day_of_week = 5);
insert into schedule_dates (event_id, event_date, time, end_time, is_active, is_all_day)
select '4ed48be7-d5f6-437b-95b4-2d6e75b75315', date '2026-11-27', time '22:00', time '22:05', true, false
where not exists (select 1 from schedule_dates where event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315' and event_date = date '2026-11-27');
update exclusive_programs set event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315' where slug = 'lendas-de-portugal';
update events set description = $t$Dez canções, da 10.ª à 1.ª, todas as sextas às 20h.$t$ where id = 'd4e5b47a-ae1f-4cc5-a273-af8ebe92b765';
update events set name = 'Céu de Cada Mês', description = $t$Leitura mensal das cartas com a taróloga Teresa.$t$ where id = '7e0a2799-f6f6-4d7f-8d59-6edbe2dd291b';
insert into vinagre_posts (slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at, program_id, seo_title, seo_description, author)
select 'top-10-ep11-especial-queen', $t$Top 10, Episódio 11: Especial Queen$t$,
  $t$Freddie Mercury morreu a 24 de novembro de 1991. Passam 35 anos, e o Top 10 dessa semana é todo dos Queen.$t$,
  $t$<p>Freddie Mercury morreu a 24 de novembro de 1991. Passam 35 anos, e o Top 10 dessa semana é todo dos Queen.</p>
<p>A ordem segue os streams de cada faixa no Spotify, segundo o kworb, com dados de 19 de novembro de 2026. Entram só gravações de estúdio da banda: ficaram de fora as versões ao vivo e os remixes.</p>
<p>A lista, da 10.ª à 1.ª:</p>
<ol reversed><li>Radio Ga Ga (The Works, 1984)</li><li>We Are The Champions (News Of The World, 1977)</li><li>Killer Queen (Sheer Heart Attack, 1974)</li><li>Somebody To Love (A Day At The Races, 1976)</li><li>Crazy Little Thing Called Love (The Game, 1979)</li><li>We Will Rock You (News Of The World, 1977)</li><li>Under Pressure, com David Bowie (Hot Space, 1981)</li><li>Another One Bites The Dust (The Game, 1980)</li><li>Don&#x27;t Stop Me Now (Jazz, 1978)</li><li>Bohemian Rhapsody (A Night At The Opera, 1975)</li></ol>
<p>Logo abaixo ficaram I Want To Break Free, Love Of My Life e The Show Must Go On.</p>
<p>O Top 10 passa todas as sextas às 20:00 na Rádio Olha que Duas.</p>$t$, $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-top-10.jpg$t$, $t$https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-top-10.jpg$t$, true, timestamptz '2026-11-27 20:00:00+00',
  (select id from exclusive_programs where slug = 'top-10'),
  $t$Top 10 Ep.11: Especial Queen | Olha que Duas$t$,
  $t$Os 10 temas dos Queen mais ouvidos no Spotify, da 10.ª à 1.ª, no Top 10 da Rádio Olha que Duas, sexta, 27 de novembro, às 20h.$t$,
  'Olha que Duas'
where not exists (select 1 from vinagre_posts where slug = 'top-10-ep11-especial-queen');

commit;

-- down:
-- delete from vinagre_posts where slug = 'top-10-ep11-especial-queen';
-- delete from exclusive_programs where slug in ('top-10','vidioteca-olha-que-duas','cantinho-da-pequenada');
-- update exclusive_programs set event_id = null where slug in ('ceu-de-cada-mes','lendas-de-portugal');
-- delete from schedule_dates where event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315'; delete from schedule where event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315'; delete from events where id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315';
