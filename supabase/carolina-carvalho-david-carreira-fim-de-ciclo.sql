-- Notícias Olha que Duas: Carolina Carvalho e David Carreira (2026-11-06).
-- Texto da Alexandra Serra, na ordem em que o enviou; só revisão PT-PT (aspas «», ponto final).
-- A legenda de cada foto é só a identificação e o crédito.
-- 1: retrato da Carolina recortado do cartão que a Alexandra enviou (sem o título nem o círculo).
-- 2: David Carreira no «Júlia», SIC, 2024, Wikimedia Commons, CC BY 3.0.
-- 3: David Carreira nos NRJ Music Awards 2013, Georges Biard, Wikimedia Commons, CC BY-SA 3.0.
-- O Commons não tem fotografias da Carolina Carvalho (atriz).
-- Capa: a Carolina (cartão) ao lado do David (foto 2).
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'carolina-carvalho-david-carreira-fim-de-ciclo',
  'Fim de ciclo? Carolina Carvalho sai de casa, mansão da Aroeira está à venda por 5,5 milhões e David Carreira refugia-se no silêncio',
  'Ao fim de oito anos de relação e com um filho em comum, tudo indica que o romance entre Carolina Carvalho e David Carreira chegou ao fim. A atriz já deixou a moradia familiar na Herdade da Aroeira — agora à venda por um valor milionário — e mudou-se para casa da mãe, enquanto o cantor prefere manter o silêncio sobre a vida privada.',
  $cc$<p>Ao fim de oito anos de relação e com um filho em comum, tudo indica que o romance entre Carolina Carvalho e David Carreira chegou ao fim. A atriz já deixou a moradia familiar na Herdade da Aroeira — agora à venda por um valor milionário — e mudou-se para casa da mãe, enquanto o cantor prefere manter o silêncio sobre a vida privada.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-carolina-carvalho-david-carreira-fim-de-ciclo-carolina.jpg" alt="Carolina Carvalho, de cabelo castanho ondulado, a olhar de frente"></p>
<p><em>Carolina Carvalho.</em></p>
<p>Os rumores que pairavam nas últimas semanas ganharam contornos definitivos nos últimos dias. Carolina Carvalho, de 31 anos, e David Carreira, de 35, estão a fazer vidas separadas. Segundo fontes próximas do casal, a atriz já saiu da casa de sonho onde ambos viviam na Herdade da Aroeira, tendo-se instalado na residência da mãe, numa altura em que a prioridade absoluta de ambos passa pelo bem-estar do filho, o pequeno Lucas, de três anos.</p>
<p>O sinal mais evidente da mudança de planos na vida do casal surgiu no mercado imobiliário: a mansão de luxo para a qual se mudaram no final de 2024, após um longo processo de obras pensado ao detalhe para a família, foi colocada à venda por 5,5 milhões de euros. Apesar de a casa estar no mercado e de a atriz já lá não residir, David Carreira ainda permanece no imóvel, onde se tem mostrado pontualmente através das redes sociais.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-carolina-carvalho-david-carreira-fim-de-ciclo-david-2024.jpg" alt="David Carreira de casaco azul e colar de pérolas, num estúdio de televisão"></p>
<p><em>David Carreira, em 2024. <a href="https://commons.wikimedia.org/wiki/File:David_Carreira_(J%C3%BAlia,_2024).png">SIC</a>, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.</em></p>
<p>O distanciamento tornou-se ainda mais notório no passado fim de semana, quando o ex-casal esteve presente no mesmo evento sem nunca se cruzar ou posar em conjunto.</p>
<p>Questionado pela imprensa sobre a venda da habitação e o fim do namoro, o músico optou por não alimentar o tema, mantendo uma postura reservada: «Gostamos de preservar o que é pessoal. Na nossa vida tudo já é tão público que é importante teres um canto também teu», declarou, recusando confirmar formalmente a rutura. Ainda assim, num detalhe que não passou despercebido aos fãs, o cantor manteve a associação e dedicatória do seu novo álbum, «Para Falar de Amor», com estreia marcada para este mês de novembro, à mãe do seu filho.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-carolina-carvalho-david-carreira-fim-de-ciclo-david-2013.jpg" alt="David Carreira a sorrir, de fato escuro e camisa branca"></p>
<p><em>NRJ Music Awards, 2013. <a href="https://commons.wikimedia.org/wiki/File:David_Carreira_NRJ_2013.jpg">Georges Biard</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.</em></p>$cc$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-carolina-carvalho-david-carreira-fim-de-ciclo-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-carolina-carvalho-david-carreira-fim-de-ciclo-og.jpg',
  true,
  '2026-11-06 16:50:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Carolina Carvalho sai de casa e mansão da Aroeira à venda',
  'Carolina Carvalho deixou a moradia da Herdade da Aroeira, à venda por 5,5 milhões de euros, e David Carreira refugia-se no silêncio sobre a vida privada.'
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
