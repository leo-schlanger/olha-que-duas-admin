-- Pimenta na Língua, 15/11/2026. Alexandra Serra.
-- A Team Zaza continua a votar depois da desistência de Francisco Monteiro do Big Brother
-- All Stars (12/11). Texto: supabase/rascunhos/pimenta-zaza.md §4 (fora do git), aprovado
-- pelo Leo a 15/11; factos com fonte no §3. Copiado sem alterações. Sem vídeo: o reel
-- está a ser feito à parte e não entra embebido.
-- Capa e og (v2, 15/11, escolha do Leo «capa com foto»): colagem do designer em
-- rascunhos/team-zaza-nao-gastem-um-tostao/v2/ (capa-com-foto.jpg, og-com-foto.jpg; fonte/
-- tem o HTML e o script). No media-library como exclusivo-<slug>-capa-v2.jpg e -og-v2.jpg
-- (nomes novos: os antigos ficavam em cache no edge). A 1.ª versão, painel tipográfico
-- (painel.html, scripts/capas/pecas/<slug>.json), ficou fora da peça.
-- Corpo: corpo-1.jpg (comentário com nome, foto, hora e gostos tapados) como
-- exclusivo-<slug>-comentario.jpg, depois do parágrafo que o cita. O texto não mudou.
--
-- O ON CONFLICT não mexe em is_published nem published_at: voltar a correr isto não
-- esconde nem republica.

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'team-zaza-nao-gastem-um-tostao',
  'O Zaza pediu «não gastem um tostão». A Team Zaza não ouviu.',
  'O Zaza saiu do Big Brother, mas as fãs não largam o telefone: agora votam para castigar quem, dizem elas, o magoou.',
  $pim$<p>Confesso: fiquei parva. Abri o Instagram e dei com a nova cruzada da Team Zaza. O Francisco Monteiro desistiu do Big Brother All Stars na quinta-feira, 12 de novembro, em lágrimas no confessionário. E as fãs, em vez de desligarem a televisão, mudaram de missão.</p>
<p>Está lá escrito em maiúsculas, com coroa dourada e tudo: «O nosso Zaza saiu, mas a nossa luta não termina aqui!» Logo a seguir: «Quem magoou o nosso Zaza não pode contar com o nosso apoio.» Traduzido para português corrente: o telefone continua na mão, agora para salvar os que estavam do lado dele e para lixar os outros, aqueles de quem ele não gostava. Nos comentários, a própria página já deu a ordem da semana: salvar uma concorrente que, dizem os fãs, sempre esteve do lado dele. O Zaza já está em casa. A guerra dele continua no ar.</p>
<h2>Votos pagos, causas por pagar</h2>
<p>Ainda deixei lá um comentário a falar do Banco Alimentar e dos sem-abrigo. Por amor de Deus, aquilo é um programa de televisão, é um Big Brother! Há quem ande à míngua, a pedinchar isto e aquilo pelo próprio trabalho. E há quem gaste dinheiro a rodos por birras com pessoas que nunca viu na vida.</p>
<p>E não é força de expressão. Em outubro, uma investigação da TV Guia, citada pelo A Televisão, explicou como funcionam as equipas de fãs do Zaza: angariam fundos, compram pacotes de votos e uma delas faz rifas com estadias em hotéis como prémio. Uma das responsáveis falou num «núcleo duro de 40 a 50 pessoas» que confirmaram ter contribuído para os packs. A TVI, imagino, está toda contente. O concorrente favorito saiu, mas os votos das fãs dele continuam a entrar.</p>
<h2>Nem nos comentários há unanimidade</h2>
<p>Valha a verdade, nem todas as fãs alinham. Num dos comentários lê-se: <em>«Isto não é uma team....isto é puro ódio.»</em> Noutro, alguém com mais juízo do que a página: <em>«Eu sou a favor apoiar um concorrente, não cultivar o ódio e desperdiçar o meu dinheirinho com quem não gosto! Nem pensar!»</em> Assino por baixo.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-team-zaza-nao-gastem-um-tostao-comentario.jpg" alt="Captura de um comentário na página de fãs do Zaza: «Era só o que me faltava!! Eu sou a favor apoiar um concorrente, não cultivar o ódio e desperdiçar o meu dinheirinho com quem não gosto! Nem pensar!»"></p>
<p><em>Comentário na página de fãs. Nome, foto, hora e gostos tapados.</em></p>
<h2>O pezinho de meia</h2>
<p>O mais curioso é que o próprio Zaza já tinha pedido que parassem. Em setembro, no fim da segunda gala, com o microfone quase sem som, deixou escapar: «Não gastem um tostão.» E em fevereiro de 2024, quando um grupo de fãs juntou dinheiro para lhe oferecer uma prenda de anos, veio dizer que não sabia de nada, pediu que não gastassem mais dinheiro com ele e garantiu que nem sabe quem gere as páginas que falam dele.</p>
<p>Pois. As fãs ouvem tudo o que ele diz, menos isto. Continuam a fazer pezinhos de meia em nome dele, como se o irmão do namorado da Cristina Ferreira, o «cunhado» mais famoso da TVI, fosse um coitadinho à espera de esmola. Há até quem o proponha preto no branco: <em>«É juntar o dinheiro que se gasta em votações para expulsar outros concorrentes e dar lhe, para ele não voltar ao limiar da pobreza.»</em> Calma. Saiu pelo próprio pé e, na manhã seguinte, já estava no «Dois às 10», com a Cristina Ferreira, a contar a versão dele.</p>
<p>Por isso, digo-o com carinho às fãs da Team Zaza: arranjem outro passatempo. Façam voluntariado, ponham esse dinheiro no Banco Alimentar, vão passear. Votar para vingar um concorrente que já saiu da casa? Isto tornou-se uma loucura. As pessoas estão doidas!</p>$pim$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-team-zaza-nao-gastem-um-tostao-capa-v2.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-team-zaza-nao-gastem-um-tostao-og-v2.jpg',
  false,
  NULL,
  (SELECT id FROM exclusive_programs WHERE slug = 'pimenta-na-lingua'),
  'Alexandra Serra',
  'Team Zaza: fãs de Francisco Monteiro continuam a votar',
  'Francisco Monteiro desistiu do Big Brother All Stars e já tinha pedido «não gastem um tostão». A Team Zaza continua a votar contra quem diz que o magoou.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_url = EXCLUDED.cover_url,
  og_image_url = EXCLUDED.og_image_url,
  program_id = EXCLUDED.program_id,
  author = EXCLUDED.author,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

COMMIT;

-- PUBLICAR (corrido a 15/11/2026, o Leo mandou seguir):
-- UPDATE vinagre_posts SET
--   is_published = true,
--   published_at = now() - interval '1 minute'
-- WHERE slug = 'team-zaza-nao-gastem-um-tostao';
