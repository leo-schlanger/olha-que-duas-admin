-- Mente Aberta, Ep. 3: Procrastinar não é preguiça.
-- Correr depois de seed-mente-aberta.sql e vinagre-posts-video.sql.
-- Texto: redator, supabase/rascunhos/mente-aberta-ep03.md (2026-11-09).
-- Capa e og: scripts/capas/pecas/procrastinar-nao-e-preguica.json (retrato da Marluce),
-- no media-library desde 2026-11-09.
--
-- AGENDADA: sai a 10/11/2026 às 11:00 de Lisboa (UTC nesta data), à hora do episódio na rádio.
-- A leitura do site filtra published_at <= now(): até lá a peça não aparece.
-- author '' = o autor do programa (Marluce Revorêdo), como nos Eps. 1 e 2.
-- Sem vídeo/áudio (video_url, video_poster_url, video_duration_seconds vazios). O ON CONFLICT
-- não mexe nos campos de vídeo: um vídeo posto depois no painel não se perde ao repetir isto.

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url, video_duration_seconds,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'procrastinar-nao-e-preguica',
  'Procrastinar não é preguiça',
  'Adiar o que importa não é preguiça. É autossabotagem, um problema que pode ser resolvido. Marluce Revorêdo deixa dicas para ganhar clareza e motivação no dia a dia.',
  $menteaberta3$<p>Hoje vamos falar de procrastinação, que é a ação de atrasar alguma coisa: uma tarefa, um compromisso, uma atividade. É adiar o trabalho, ou qualquer outra coisa que precisa de ser feita, e deixar que atividades muito menos importantes nos vão distraindo. Uma série de televisão, as redes sociais, um programa de rádio, qualquer coisa serve.</p>
<p>Não digo que estas coisas não sejam importantes ou que não sejam boas. O que acontece é que deixamos para trás aquilo que realmente nos conduz a um futuro e nos pode trazer recompensas mais à frente: um trabalho feito a horas, uma roupa que tem de ser lavada ou passada. São várias as atividades que às vezes deixamos de fazer por outras que, comparadas com estas, não têm grande importância.</p>
<h2>A tentação do imediato</h2>
<p>Mesmo sabendo que precisa de fazer alguma coisa, e que por isso não a deve adiar, é mais tentador fazer outra agora e experimentar a gratificação imediata do que trabalhar com foco numa meta ou num prazo mais longo. Parte da solução é trazer gratificação imediata para os projetos de longo prazo.</p>
<h2>Uma força dentro de nós</h2>
<p>Procrastinação não é o mesmo que preguiça. Dependendo da pessoa, são citadas diversas razões para procrastinar: preguiça, falta de controlo, medo de falhar, maus hábitos, querer ser perfeito, a sensação de que o trabalho não é urgente, a negatividade em relação a si mesmo, e várias outras.</p>
<p>Quase todas estas razões derivam de um bloqueio central: existe algo dentro de nós que nos leva a agir de uma forma que parece pouco inteligente e que nos prejudica a vida. É uma força interior a que, genericamente, chamamos autossabotagem.</p>
<p>Há coisas que podemos fazer para melhorar a nossa vida, a maioria delas bem simples, e que muitas vezes adiamos indefinidamente: alimentar-nos melhor, dormir melhor, praticar meia hora de exercício por dia, beber água de vez em quando em vez de refrigerante. É muito estranha a nossa forma de agir quando sabemos, racionalmente, o que é melhor.</p>
<p>Isso não é preguiça. É um problema que pode ser resolvido.</p>
<h2>Perceber a importância dá motivação</h2>
<p>O problema da autossabotagem passa também por encontrar motivação para realizar o que é importante. Quando percebemos a importância do que precisamos de fazer, essa importância dá-nos muito mais motivação. A luta contra a procrastinação requer uma ligação clara e mais consciente entre o nosso trabalho e as metas que queremos alcançar.</p>
<h2>Dicas para o dia a dia</h2>
<p>Para melhorar isto, deixo algumas dicas de gestão da nossa mente e das nossas emoções no dia a dia.</p>
<ul>
<li><strong>Compreenda o que gera a procrastinação</strong> no seu trabalho. É o primeiro passo.</li>
<li><strong>Crie um ambiente de trabalho</strong> agradável e organizado.</li>
<li><strong>Preze a clareza</strong> da comunicação.</li>
<li><strong>Distribua as responsabilidades</strong> de forma adequada.</li>
<li><strong>Divida as tarefas grandes</strong> em tarefas menores e proponha métodos e prazos reais.</li>
<li><strong>Faça uma lista de tarefas.</strong> Não saber exatamente o que tem de fazer e quais são as suas prioridades do momento pode levar à procrastinação. Com uma lista, ganha um bom roteiro e uma boa saída para evitar que tudo fique para depois. Nesse sentido, é possível enumerar, à semana e ao dia, o que é realmente urgente e necessário fazer.</li>
</ul>
<h2>A clareza traz motivação</h2>
<p>Procrastinar tem muitos sinónimos: adiar, protelar, tardar, atrasar, demorar, espaçar, prolongar, delongar, e por aí adiante.</p>
<p>Dedique-se, com o tempo, a criar clareza, tanto para si como para a sua equipa, na sua casa ou com a sua família. Ao compreender claramente a importância de cada tarefa, sentirá uma motivação cada vez maior para realizar o seu trabalho diário ou os seus afazeres.</p>
<p><em>Marluce Revorêdo é terapeuta de desenvolvimento pessoal e hipnose clínica. Para quem quer cuidar de si por dentro, acompanha presencialmente e online em <a href="https://motivar.pt">motivar.pt</a>. Ouça o Mente Aberta na rádio Olha que Duas, todas as terças-feiras, às 11h e às 17h.</em></p>$menteaberta3$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-procrastinar-nao-e-preguica-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-procrastinar-nao-e-preguica-og.jpg',
  '',
  '',
  NULL,
  true,
  '2026-11-10 11:00:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'mente-aberta'),
  '',
  'Procrastinação não é preguiça: dicas para deixar de adiar',
  'Marluce Revorêdo, terapeuta de hipnose clínica, explica porque procrastinar não é preguiça e deixa dicas para ganhar clareza e motivação no dia a dia.'
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
    WHERE slug = 'procrastinar-nao-e-preguica'
      AND (program_id IS NULL
        OR concat_ws(' ', title, excerpt, content, seo_title, seo_description) LIKE '%PENDENTE%'
        OR concat_ws(' ', title, excerpt, content) LIKE '%CORTÁVEL%')
  ) THEN
    RAISE EXCEPTION 'procrastinar-nao-e-preguica: há campos PENDENTE/CORTÁVEL ou falta o programa; nada foi gravado';
  END IF;
END
$guard$;

COMMIT;
