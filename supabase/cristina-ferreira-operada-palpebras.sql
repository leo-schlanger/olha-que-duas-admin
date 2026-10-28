-- Notícias Olha que Duas: Cristina Ferreira anuncia no «Dois às 10» uma blefaroplastia (2026-10-28).
-- Texto da Alexandra Serra, revisto. Fontes: TVI, Nova Gente, Flash!, Caras (28/10/2026);
-- citação de África: publicação no Instagram de julho de 2026 (Selfie/IOL, 25/07/2026).
-- Fotos do corpo no bucket media-library (noticias-cristina-ferreira-operada-palpebras-*.jpg); a 2 e a 3 numa montagem.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'cristina-ferreira-operada-palpebras',
  'Cristina Ferreira obrigada a ir ao bloco operatório! O drama escondido no rosto da apresentadora e a «bomba» prometida para 2027',
  'Cristina Ferreira revelou no «Dois às 10» que vai fazer uma blefaroplastia com a médica Luísa Magalhães Ramos, para corrigir o excesso de pele nas pálpebras que, segundo contou, já lhe estorva a visão. Em paralelo, prepara um regresso a África para o início de 2027.',
  $cf$<p><strong>A diretora de Entretenimento e Ficção da TVI revelou, em direto no «Dois às 10», que se vai submeter a uma blefaroplastia.</strong> A intervenção, que ficará a cargo da médica Luísa Magalhães Ramos, visa corrigir o excesso de pele nas pálpebras que, segundo contou a apresentadora, já lhe estorva a visão. Em paralelo, a estrela da estação de Queluz de Baixo prepara um regresso ao continente africano para o arranque do próximo ano.</p>
<p>Cristina Ferreira prepara-se para fazer a primeira intervenção cirúrgica estética da sua vida. A revelação foi feita na manhã desta quarta-feira, 28 de outubro, durante a emissão do matutino «Dois às 10». A apresentadora explicou aos espetadores que se vai submeter a uma blefaroplastia, uma cirurgia destinada a remover o excesso de pele na zona das pálpebras, e garantiu que a decisão não é só estética.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-cristina-ferreira-operada-palpebras-palpebra.jpg" alt="Pálpebra superior com excesso de pele, fechada, com a indicação «superior»"></p>
<p><em>A blefaroplastia retira o excesso de pele da pálpebra superior. Imagem ilustrativa.</em></p>
<p>Aos 49 anos, a comunicadora contou em direto que a pele «já fica em cima das pestanas» e que, por vezes, lhe estorva a visão. Se o problema passa despercebido a quem a vê todos os dias no ecrã, há uma explicação: «A minha maquilhagem é que disfarça muito o excesso de pele», confessou a parceira televisiva de Cláudio Ramos. Cristina Ferreira revelou ainda que se trata de uma herança de família: a mãe tem exatamente a mesma condição, porque as duas partilham o mesmo tipo de pele.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-cristina-ferreira-operada-palpebras-selfie.jpg" alt="Cristina Ferreira numa selfie sem maquilhagem"></p>
<p><em>Cristina Ferreira sem maquilhagem. Fotografia: Instagram de Cristina Ferreira</em></p>
<h2>A mesma cirurgiã de Cláudio Ramos</h2>
<p>A operação será conduzida pela especialista em cirurgia plástica, reconstrutiva e estética Luísa Magalhães Ramos, responsável pelas Clínicas LMR. A médica, que esteve presente no estúdio durante o anúncio, é já um nome de confiança nos corredores da TVI: foi a mesma cirurgiã que operou as pálpebras de Cláudio Ramos.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-cristina-ferreira-operada-palpebras-medica-e-clinica.jpg" alt="Luísa Magalhães Ramos no bloco operatório e a receção das Clínicas LMR"></p>
<p><em>Luísa Magalhães Ramos no bloco operatório e a receção das Clínicas LMR. Imagem: Clínicas LMR</em></p>
<h2>O regresso a África no arranque de 2027</h2>
<p>Se os próximos meses serão marcados pela recuperação desta intervenção, o arranque de 2027 já tem um grande projeto delineado. Através das redes sociais, Cristina Ferreira partilhou com os seguidores o entusiasmo pela preparação da sua próxima grande aventura internacional.</p>
<blockquote><p>«África é dos meus continentes favoritos. Já estou a planear o próximo destino para o início do próximo ano. Alguém adivinha?»</p></blockquote>
<p>O desafio foi lançado pela apresentadora numa publicação no Instagram, em julho. Embora o país ainda não tenha sido desvendado, a novidade prevista para o início do ano promete marcar o regresso da diretora da TVI a um continente pelo qual tem uma paixão assumida.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-cristina-ferreira-operada-palpebras-trench-bege.jpg" alt="Cristina Ferreira de gabardina bege"></p>
<p><em>Cristina Ferreira.</em></p>$cf$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-cristina-ferreira-operada-palpebras-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-cristina-ferreira-operada-palpebras-og.jpg',
  true,
  '2026-10-28 17:20:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Cristina Ferreira vai ser operada às pálpebras aos 49 anos',
  'Cristina Ferreira anunciou no «Dois às 10» que vai fazer uma blefaroplastia: a pele já lhe estorva a visão. E promete uma viagem a África em 2027.'
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
