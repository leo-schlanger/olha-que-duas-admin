-- Pimenta na Língua: quem paga a conta? Liliana Aguiar, Zulmira Garrido e Pedro Capitão (2026-11-06).
-- Crónica de opinião da Alexandra Serra, parágrafos na ordem em que os enviou; só revisão PT-PT
-- (aspas «», reticências …, «check-mate» → «xeque-mate»).
-- A abertura dela («O programa onde a língua não tem espinhas… e a carteira muito menos!») vai no excerpt,
-- que o site mostra logo por baixo do título.
-- Sem fotos no corpo: não há fotos livres da Liliana Aguiar nem da Zulmira Garrido (Leo, 06/11/2026).
-- Capa e og pelo gerador (scripts/capas/pecas/quem-paga-a-conta-liliana-aguiar.json), painel tipográfico.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'quem-paga-a-conta-liliana-aguiar',
  'Querido, tu pagas ou eu finjo que esqueço a mala?',
  'O programa onde a língua não tem espinhas… e a carteira muito menos!',
  $pim$<p>Alerta vermelho nos ecrãs e nas redes sociais: a civilização ocidental está prestes a ruir porque há homens a ousar… dividir a conta do jantar!</p>
<p>Sim, senhoras e senhores. A fada iluminada do Dubai, Liliana Aguiar, veio descobrir a pólvora e declarar o óbvio para quem viveu num conto de fadas medieval: o homem é que tem de pagar tudo! Trabalhe a mulher ou não, produza milhões ou venda rifas, o macho alfa tem de assumir a nobre missão de «provedor universal», enquanto a companheira se limita a pousar a carteira de luxo na mesa e a olhar para a fatura com o mesmo interesse com que olha para um meteoro. Partilhar a despesa? Uma heresia! Uma afronta à dignidade feminina! Pagar o próprio bife? Coisa de pobres de espírito!</p>
<p>Claro que o painel do Passadeira Vermelha quase engoliu os microfones com tanta modernidade de bolso. Mas quem decidiu dar o verdadeiro xeque-mate foi a Zulmira Garrido. Com a sabedoria de quem passou 33 anos ao lado de Jesualdo Ferreira, Zulmira lembrou que, vejam bem, nos primórdios da relação até ganhava mais do que ele e fazia questão de pagar as suas coisas! Que escândalo, Zulmira! Como ousas destruir o sagrado direito de viver à custa alheia com o suor da testa de outro? Onde é que já se viu uma mulher independente a querer pagar o próprio café? Que falta de visão patriarcal!</p>
<p>Enquanto isso, no V+ Fama, Pedro Capitão lá perdeu a paciência e mandou a farpa clássica: a sugestão de que a nossa Liliana calçasse as sandálias e deixasse de apanhar tanto sol no Dubai, porque estas teorias já cheiram a mofo e a Idade Média.</p>
<p>Portanto, já sabem, queridos ouvintes: se vão jantar fora, certifiquem-se de que o vosso par tem a carteira grossa e a culpa bem vincada. Afinal de contas, o amor verdadeiro mede-se em quem paga a conta das tostas mistas ao fim do mês. No Pimenta na Língua, nós adoramos um bom romance… desde que venha com recibo verde e pago pelo senhor doutor!</p>$pim$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-quem-paga-a-conta-liliana-aguiar-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-quem-paga-a-conta-liliana-aguiar-og.jpg',
  true,
  '2026-11-06 16:50:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'pimenta-na-lingua'),
  'Alexandra Serra',
  'Liliana Aguiar e a conta: o homem tem de pagar tudo?',
  'Liliana Aguiar diz que o homem tem de pagar tudo. Zulmira Garrido lembra os anos com Jesualdo Ferreira e Pedro Capitão manda a farpa no V+ Fama.'
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
