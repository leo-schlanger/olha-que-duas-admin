-- Notícias Olha que Duas: depressão Bruna a caminho do continente (2026-11-06).
-- Texto da Alexandra Serra, na ordem em que o enviou; título dela em caixa normal.
-- Confirmado a 06/11: Bruna é o 2.º nome da lista 2026-27 do grupo sudoeste e o IPMA
-- prevê chuva no continente a partir de domingo, 8 de novembro.
-- Quatro fotografias ilustrativas do Wikimedia Commons (não são da Bruna), com crédito:
-- 1: Nazaré, 21/12/2025, Alexkom000, CC BY 4.0 (também a capa).
-- 2: Lisboa, inundações de 13/10/2014, Paulete Matos/Esquerda.Net, CC BY-SA 2.0, recortada.
-- 3: Amor (Leiria), tempestade Kristin, 28/01/2026, Charles0304, CC0.
-- 4: Farol de Felgueiras (Porto), 01/11/2010, Ralf Junghanns, CC BY-SA 3.0.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'tempestade-bruna-portugal',
  'Alerta máximo: tempestade Bruna ruma a Portugal e vai virar o país do avesso este fim de semana',
  'O cenário de tranquilidade que tem marcado o início de novembro em Portugal continental está prestes a terminar: o IPMA prevê a chegada iminente da depressão Bruna, com uma mudança drástica no estado do tempo a partir deste fim de semana.',
  $bru$<p>O cenário de tranquilidade e os dias predominantemente ensolarados que têm marcado o início de novembro em Portugal continental estão prestes a terminar. O Instituto Português do Mar e da Atmosfera (IPMA) prevê a chegada iminente da depressão Bruna, um sistema depressionário de forte atividade atlântica que trará uma mudança drástica no estado do tempo a partir deste fim de semana, com impactos que se deverão prolongar ao longo dos próximos dias.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-tempestade-bruna-portugal-nazare.jpg" alt="Ondas enormes a rebentar na Nazaré, com o vento a levantar a espuma"></p>
<p><em>Imagem ilustrativa: Nazaré, dezembro de 2025. <a href="https://commons.wikimedia.org/wiki/File:2025-12-21_Waves_in_Nazar%C3%A9_in_December_1.jpg">Alexkom000</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</em></p>
<p>Depois de fustigar as regiões insulares, a tempestade ruma ao território do continente, antevendo-se um episódio significativo de aguaceiros persistentes, fortes rajadas de vento e agitação marítima severa. A alteração meteorológica começará a fazer-se sentir de forma mais expressiva a partir de domingo, dia 8 de novembro, trazendo consigo precipitação abundante cujos acumulados poderão ser muito expressivos, aumentando o risco de inundações urbanas e cheias rápidas em zonas vulneráveis.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-tempestade-bruna-portugal-inundacao-lisboa.jpg" alt="Praça de Lisboa inundada, com árvores e candeeiros dentro de água e uma pessoa a atravessar a pé"></p>
<p><em>Imagem ilustrativa: Lisboa, outubro de 2014. <a href="https://commons.wikimedia.org/wiki/File:Inunda%C3%A7%C3%B5es_em_Lisboa_(Esquerda.Net_15343746668).jpg">Paulete Matos/Esquerda.Net</a>, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>, recortada.</em></p>
<p>Em simultâneo, o vento soprará com grande intensidade, afetando sobretudo as regiões do litoral norte e centro, bem como as zonas montanhosas, onde são esperadas rajadas fortes que poderão provocar a queda de ramos ou árvores e condicionar a circulação rodoviária. No mar, a agitação marítima será outro dos grandes motivos de preocupação, com a ondulação na costa ocidental a subir consideravelmente e a atingir alturas impressionantes no início da semana, o que representa riscos acrescidos para a navegação, atividades piscatórias e zonas portuárias.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-tempestade-bruna-portugal-estragos-leiria.jpg" alt="Rua com uma cobertura metálica arrancada pelo vento e destroços junto a um muro"></p>
<p><em>Imagem ilustrativa: Amor, Leiria, janeiro de 2026. <a href="https://commons.wikimedia.org/wiki/File:Debri_from_Amor,_Leiria.jpg">Charles0304</a>, <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>.</em></p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-tempestade-bruna-portugal-farol-felgueiras.jpg" alt="Onda a galgar o paredão do farol de Felgueiras, na foz do Douro"></p>
<p><em>Imagem ilustrativa: farol de Felgueiras, Porto, novembro de 2010. <a href="https://commons.wikimedia.org/wiki/File:Felgueiras_Lighthouse_Storm.jpg">Ralf Junghanns</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.</em></p>
<p>As autoridades e os serviços de proteção civil recomendam o acompanhamento regular das previsões meteorológicas e dos avisos oficiais que venham a ser emitidos pelo IPMA, apelando a que a população adote medidas preventivas para minimizar os riscos associados a este episódio de instabilidade atlântica.</p>$bru$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-tempestade-bruna-portugal-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-tempestade-bruna-portugal-og.jpg',
  true,
  '2026-11-06 16:50:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Tempestade Bruna: alerta para chuva, vento e mar agitado',
  'O IPMA prevê a chegada da depressão Bruna ao continente a partir de domingo, 8 de novembro, com chuva abundante, rajadas fortes e mar agitado.'
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
