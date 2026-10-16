-- Notícias Olha que Duas, pela redação Olha que Duas.
-- Correr depois de exclusive-programs.sql.
-- Episódio 1: o regresso de Herman José na 13.ª temporada do "Cá por Casa" na RTP1.

INSERT INTO exclusive_programs (
  id, slug, title, author, tagline, description,
  portrait_url, portrait_focus, cover_url, sort_order, is_published
)
VALUES (
  '9b4e1a82-6c35-4d91-a2f7-8e5c0b3d1946',
  'noticias-olha-que-duas',
  'Notícias Olha que Duas',
  'Olha que Duas',
  'Cultura, televisão e o melhor de Portugal',
  'As novidades, estreias e destaques da televisão, da cultura e do espetáculo em Portugal, pela redação Olha que Duas.',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-retrato-olha-que-duas.jpg',
  'center',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/programa-capa-noticias-olha-que-duas.jpg',
  4,
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
  'herman-jose-regresso-ca-por-casa-13-temporada-rtp1',
  'Herman José está de volta! A estreia da 13.ª temporada do "Cá por Casa" na RTP1',
  'As noites de quarta-feira voltaram a ter a graça de outros tempos: depois de mais de um ano de espera, Herman José e o seu elenco de luxo regressaram à RTP1 para a 13.ª temporada do "Cá por Casa".',
  $noticias1$<p>As noites de quarta-feira voltaram finalmente a ter a graça de outros tempos! Depois de mais de um ano de espera que deixou muitas saudades no público português, o nosso mestre do humor está de volta onde pertence. No passado dia 14 de Outubro de 2026, o inconfundível Herman José abriu novamente as portas do seu "Cá por Casa" na RTP1 para a estreia da 13.ª temporada, e o momento pede um enorme aplauso e os mais sinceros parabéns por esta longevidade brilhante na televisão nacional.</p>
<h2>Equipa que ganha não se mexe</h2>
<p>Voltar ao ecrã com esta energia, mantendo o formato fresco, mordaz e irresistível às 22h30 de quarta-feira, é a prova viva do talento ímpar de Herman. E porque em equipa que ganha não se mexe, é um verdadeiro privilégio voltar a ver reunido o extraordinário elenco residente — Maria Rueff (com o regresso dos míticos Nelo e Idália!), Manuel Marques, Joana Pais de Brito e Gabriela Barros — que eleva a fasquia dos sketches e da sátira à atualidade a cada emissão.</p>
<h2>Uma estreia memorável no sofá e na RTP Play</h2>
<p>A estreia não podia ter sido mais memorável, juntando no mesmo sofá a apresentação do primeiro romance de ficção de Júlia Pinheiro ("Não Sei Nada Sobre o Amor"), a partilha artística de Lídia Franco e Tiago Torres da Silva, e o talento musical ao vivo de Tiago Nacarato, FF e do projeto Vizinhos. Para quem não conseguiu ver na televisão ou quer simplesmente rever cada gargalhada, esta nova temporada, assim como todo o arquivo das 12 anteriores, já está disponível gratuitamente na RTP Play.</p>
<p>Muitos parabéns ao eterno Herman José e a toda a sua equipa por este regresso em grande e por continuarem a dar tanto à cultura e ao humor em Portugal. Quem mais estava com saudades de passar os serões de quarta-feira "Cá por Casa"?</p>$noticias1$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-ca-por-casa-13-temporada.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-ca-por-casa-13-temporada-og.jpg',
  true,
  '2026-10-16 16:40:00+01',
  '9b4e1a82-6c35-4d91-a2f7-8e5c0b3d1946'
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
