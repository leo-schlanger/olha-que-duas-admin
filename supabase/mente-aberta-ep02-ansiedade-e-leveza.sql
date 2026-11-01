-- Mente Aberta, Ep. 2: Leveza é saber o que é seu para carregar (ansiedade e leveza).
-- Correr depois de seed-mente-aberta.sql e vinagre-posts-video.sql.
-- Texto: redator, supabase/rascunhos/mente-aberta-ep02.md (2026-11-01), tema aprovado pelo Leo.
-- Capa e og: scripts/capas/pecas/ansiedade-e-leveza.json (retrato da Marluce, como no Ep. 1),
-- no media-library desde 2026-11-01.
--
-- AGENDADA: sai a 3/11/2026 às 11:00 de Lisboa (UTC nesta data), à hora do episódio na rádio.
-- A leitura do site filtra published_at <= now(): até lá a peça não aparece.
-- author '' = o autor do programa (Marluce Revorêdo), como no Ep. 1.
-- Sem vídeo/áudio (video_url, video_poster_url, video_duration_seconds vazios). O ON CONFLICT
-- não mexe nos campos de vídeo: um vídeo posto depois no painel não se perde ao repetir isto.

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'ansiedade-e-leveza',
  'Leveza é saber o que é seu para carregar',
  'A ansiedade não é uma fraqueza, é um alarme que já não desliga. Marluce Revorêdo deixa quatro ideias e um exercício de respiração para viver com mais leveza.',
  $menteaberta2$<p>Hoje quero falar de uma coisa que anda muito presente na vida de todos nós: a ansiedade. E de como podemos viver com um pouco mais de leveza, mesmo quando o dia não ajuda.</p>
<h2>Ainda não aconteceu nada</h2>
<p>Começo com uma cena, e acho que muitos vão reconhecer-se nela. Acorda de manhã e, antes mesmo de pôr o pé no chão, a cabeça já começou a trabalhar. São as contas para pagar, o trabalho que ficou por fazer, os filhos, aquela conversa que ficou mal resolvida ontem.</p>
<p>O coração acelera, o peito aperta. E repare: ainda não aconteceu nada. O dia ainda nem começou e o cansaço já chegou.</p>
<p>Isto tem nome, e é bom dizê-lo. É a ansiedade. É a nossa cabeça a viver no amanhã, enquanto o corpo está aqui, hoje, nesta cama, neste carro, nesta cozinha. Será que vale a pena viver o amanhã inteiro antes de ele chegar?</p>
<h2>Aguentar não é viver</h2>
<p>No meu trabalho, com o desenvolvimento pessoal e a hipnose clínica, vejo isto muitas vezes. Pessoas boas, inteligentes, capazes, que carregam um peso enorme por dentro, enquanto por fora parece estar tudo bem. Porque aprendemos a ser fortes, a aguentar, a não incomodar ninguém. Só que aguentar não é o mesmo que viver.</p>
<p>E quero deixar uma coisa bem clara: a ansiedade não é uma fraqueza. É como um alarme, é o nosso corpo a tentar proteger-nos. O problema é quando esse alarme toca o dia inteiro, por tudo e por nada, e já não o conseguimos desligar.</p>
<p>Para ter sucesso na vida, além da inteligência intelectual, precisamos também de inteligência emocional. E a inteligência emocional começa aqui: aprender a cuidar do que sentimos, em vez de fugir disso.</p>
<h2>Quatro ideias para levar para o seu dia</h2>
<ul>
<li><strong>Dar nome ao que sente.</strong> Quando aquele aperto aparecer, pare um instante e diga a si mesmo: «Estou ansiosa», «estou com medo», «estou cansado». Parece pouco, mas não é. O que tem nome, conseguimos olhar de frente. O que não tem nome fica ali, escondido, a crescer no escuro.</li>
<li><strong>Separar o que é seu do que não é.</strong> Faça esta pergunta: isto está nas minhas mãos, hoje? Se está, ótimo: escolha um passo pequeno e dê esse passo. Se não está, não adianta carregá-lo agora, só vai pesar à toa. Gastamos tanta energia a sofrer por coisas que ainda não aconteceram e que muitas vezes nem vão acontecer.</li>
<li><strong>Voltar ao corpo.</strong> Corpo, mente e emoções andam juntos, não os conseguimos separar. Quando a cabeça dispara, o corpo pode ser a sua âncora. Sinta os pés no chão. Solte os ombros, que nem damos conta de que estão lá em cima, perto das orelhas. Beba um copo de água devagar, dê uma volta ao quarteirão. São coisas pequenas, mas são elas que o trazem de volta ao aqui e agora.</li>
<li><strong>Tirar peso.</strong> Talvez a mais difícil. Nem tudo é para hoje, nem tudo é consigo, e nem toda a gente precisa da sua resposta no mesmo minuto. Às vezes, leveza é simplesmente dizer: «Hoje faço isto, e o resto espera.» E é também dizer não, sem culpa, porque dizer não a uma coisa é, muitas vezes, dizer sim a si.</li>
</ul>
<h2>Um minuto para respirar</h2>
<p>Proponho-lhe uma coisa, aqui mesmo, neste momento. Se estiver a conduzir, não feche os olhos: respire apenas, com a atenção na estrada. Se estiver em casa ou no trabalho, pode fechar os olhos, se quiser.</p>
<p>Inspire pelo nariz, devagar, a contar até quatro. Expire pela boca, ainda mais devagar, a contar até seis. Depois, mais uma vez, com calma: quatro a entrar, seis a sair.</p>
<p>Quando soltamos o ar mais devagar do que o puxamos, o corpo vai percebendo que pode desacelerar.</p>
<p>E agora, com essa calma, pergunte a si mesmo: de que é que eu preciso agora, de verdade? Não do que os outros precisam, não do que devia fazer, mas daquilo de que precisa. Escute a resposta. Costuma ser mais simples do que imaginamos: um descanso, um abraço, um copo de água, um não.</p>
<h2>Pedir ajuda é coragem</h2>
<p>Se a ansiedade estiver tão forte que não o deixa dormir, trabalhar ou estar com quem ama, não fique sozinho com ela. Procure ajuda, fale com o seu médico ou com um profissional de saúde. Pedir ajuda não é fraqueza, é coragem.</p>
<h2>Uma pérola para levar consigo</h2>
<p>No último episódio, perguntei se valia a pena carregar tanta mágoa. Hoje deixo-lhe uma pérola para levar consigo.</p>
<blockquote><p>Leveza não é não ter peso nenhum. Leveza é saber o que é seu para carregar, e ter a coragem de deixar o resto no chão.</p></blockquote>
<p>Cuide bem de si, e até à próxima terça.</p>
<p><em>Marluce Revorêdo é terapeuta de desenvolvimento pessoal e hipnose clínica. Para quem quer cuidar de si por dentro, acompanha presencialmente e online em <a href="https://motivar.pt">motivar.pt</a>. Ouça o Mente Aberta na rádio Olha que Duas, todas as terças-feiras, às 11h e às 17h.</em></p>$menteaberta2$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ansiedade-e-leveza-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-ansiedade-e-leveza-og.jpg',
  '',
  '',
  NULL,
  true,
  '2026-11-03 11:00:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'mente-aberta'),
  '',
  'Ansiedade: quatro ideias para viver com mais leveza',
  'Marluce Revorêdo, terapeuta de hipnose clínica, explica a ansiedade e deixa quatro ideias e um exercício de respiração para viver o dia com mais leveza.'
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

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM vinagre_posts
    WHERE slug = 'ansiedade-e-leveza'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%'
        OR concat_ws(' ', title, excerpt, content) LIKE '%CORTÁVEL%')
  ) THEN
    RAISE EXCEPTION 'ansiedade-e-leveza: há campos PENDENTE/CORTÁVEL ou falta o programa; nada foi gravado';
  END IF;
END
$guard$;

COMMIT;
