-- Notícias Olha que Duas: Francisco Monteiro (Zaza) desiste do Big Brother All Stars (TVI), Especial de 12/11.
-- Texto da Alexandra Serra, revisto (rascunho fora do git), publicado a 2026-11-13.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'francisco-monteiro-desiste-big-brother-all-stars',
  'Francisco Monteiro desiste do Big Brother All Stars: «Não consigo mais»',
  'O vencedor do Big Brother 2023 abandonou o reality show da TVI no Especial de quinta-feira, 12 de novembro. No confessionário, disse a Maria Botelho Moniz que estava exausto e que não conseguia dormir. Na casa, Sónia Jesus culpou Catarina Miranda pela saída.',
  $fm$<p>A noite desta quinta-feira, 12 de novembro, ficará marcada como uma das mais dramáticas e intensas desta edição do Big Brother All Stars. Francisco Monteiro, carinhosamente tratado pelo público como «Zaza» e apontado como um dos grandes favoritos à vitória final, não resistiu à pressão e desistiu oficialmente do reality show da TVI. O vencedor do Big Brother 2023 abandonou a casa durante a emissão especial conduzida por Maria Botelho Moniz, deixando para trás o dinheiro acumulado, anunciando a decisão no confessionário e recusando-se a regressar à sala para a comunicar aos restantes moradores.</p>
<p>O desfecho já se adivinhava ao longo dos últimos dias, depois de o concorrente ter confidenciado a colegas como Sandrina Pratas e Renata Reis: «Estoirei psicologicamente.» Na própria manhã de quinta-feira, durante uma dinâmica tensa, Francisco perdeu a paciência e levantou-se de forma exaltada na direção do seu eterno rival, Miguel Vicente, obrigando à intervenção imediata na casa. Pouco antes de a decisão final ser anunciada, o próprio direto já tinha sido palco de um verdadeiro pandemónio, com Catarina Miranda a abandonar a sala em lágrimas aos gritos de «Querem-lhe dar o prémio, deem-lhe o prémio» e «Estou farta disto».</p>
<h2>No confessionário: «Não consigo mais»</h2>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-francisco-monteiro-desiste-big-brother-all-stars-1.jpg" alt="Francisco Monteiro em lágrimas no confessionário do Big Brother All Stars"></p>
<p><em>Francisco Monteiro no confessionário, durante o Especial do Big Brother All Stars de 12 de novembro. Imagem: TVI</em></p>
<p>Sentado no confessionário e visivelmente destroçado, Francisco Monteiro abriu o coração a Maria Botelho Moniz e admitiu ter chegado ao seu limite absoluto. Entre lágrimas, o comentador e ex-concorrente confessou que aguentou mais do que deveria e que se sentia completamente deslocado e sufocado dentro do jogo, temendo deixar de ser a pessoa que era quando entrou. Zaza revelou ainda que, pela primeira vez na vida, estava a recorrer a comprimidos para conseguir dormir e que, mesmo assim, não conseguia dormir. Dias antes, na terça-feira, já tinha contado aos colegas que, mesmo com dois comprimidos, só adormecera por volta das seis da manhã. A juntar ao desgaste mental provocado pelos conflitos constantes, pesaram também as saudades profundas da vida cá fora e, em especial, da namorada, Andrea Pestana. Antes de cruzar a porta de saída, deixou um sentido pedido de desculpas a todos os que votaram nele e o foram mantendo na casa semana após semana.</p>
<p>O momento foi de tal forma comovente que a própria Maria Botelho Moniz não conseguiu conter a emoção. Com a voz embargada, a apresentadora despediu-se do concorrente garantindo que sempre quis fazer um All Stars e que este nunca se faria sem a presença de Francisco Monteiro, consagrando-o como «para sempre, um dos melhores», mas sublinhando que a saúde dele está acima de tudo.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-francisco-monteiro-desiste-big-brother-all-stars-4.jpg" alt="Maria Botelho Moniz no estúdio do Big Brother"></p>
<p><em>Maria Botelho Moniz, apresentadora do Big Brother All Stars. Imagem: TVI</em></p>
<h2>Sónia acusa Catarina Miranda</h2>
<p>Se no confessionário reinou a tristeza, na sala instalou-se o caos puro assim que os concorrentes souberam que Francisco já não se encontrava na casa. Sónia Jesus, com quem o colega tinha discutido na madrugada anterior, como lembrou Maria Botelho Moniz em direto, entrou em choque, abandonou a sala aos gritos e apontou o dedo sem filtros a Catarina Miranda, acusando-a de ser a grande responsável por levar Zaza à exaustão com provocações sobre a sua relação amorosa desde a primeira semana. A concorrente de Almeirim sacudiu de imediato a água do capote, garantiu não sentir qualquer culpa e virou a artilharia pesada contra Miguel Vicente, acusando o algarvio de, nessa mesma manhã, ter oferecido «porrada» a Francisco.</p>
<h2>As reações cá fora</h2>
<p>Cá fora, a onda de choque e solidariedade não tardou a inundar as redes sociais. Bruno Savate saiu em defesa do amigo, garantindo que Francisco foi a «verdadeira alma deste programa» e que a vitória era moralmente sua. Também as comentadoras Inês Simões e Alexandra Ferreira deixaram mensagens públicas de apoio, elogiando a pureza e a entrega do nortenho e criticando a falta de empatia de quem julga a dor alheia através do ecrã.</p>
<p>Segundo o comunicado divulgado pela equipa de Francisco Monteiro, que agradeceu a onda de carinho, embora não leve o troféu na mão, Zaza leva a possibilidade de recuperar a sua paz e abraçar os seus. Agora, todas as atenções viram-se para a manhã desta sexta-feira na TVI, onde, segundo anunciou a estação, Francisco Monteiro marcará presença no programa «Dois às 10», à conversa com Cristina Ferreira, para a primeira grande entrevista após o abandono que abalou o Big Brother All Stars.</p>$fm$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-francisco-monteiro-desiste-big-brother-all-stars-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-francisco-monteiro-desiste-big-brother-all-stars-og.jpg',
  true,
  '2026-11-13 05:15:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Francisco Monteiro (Zaza) desiste do Big Brother All Stars',
  'Francisco Monteiro desistiu do Big Brother All Stars no Especial de quinta-feira, 12 de novembro: o que disse no confessionário e como reagiu a casa.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;
