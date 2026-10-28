-- Notícias Olha que Duas: a guerra das audiências SIC, TVI e RTP1 (27/10/2026 e semana anterior).
-- Texto da Alexandra Serra, revisto; agendada para 2026-10-29 18:00 em Lisboa (WET = UTC).
-- Dia 27/10: Quinto Canal e TV Independente Blogue; semana: Meios & Publicidade (Havas Media Network);
-- minutos mais vistos: Zapping (CAEM/GfK provisório). Gráficos nossos no bucket media-library.
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url, is_published, published_at,
  program_id, author, seo_title, seo_description
)
VALUES (
  'guerra-audiencias-sic-tvi-rtp1-outubro-2026',
  'Uma décima separa SIC e TVI: a guerra das audiências está ao rubro e a RTP1 não larga o terceiro lugar',
  'Uma décima. Foi tudo o que separou a SIC da TVI na terça-feira, 27 de outubro: 14,0% de share contra 13,9%, com a RTP1 nos 11,4%. Na semana anterior, a SIC também ganhou, com 13,5%, mas a TVI está à distância de duas décimas. O que está a puxar cada canal, das novelas da SIC ao «Big Brother: All Stars» e ao «O Preço Certo».',
  $au$<p><strong>Uma décima.</strong> Foi essa a distância entre a SIC e a TVI na terça-feira, 27 de outubro. O canal de Paço de Arcos fechou o dia com 14,0% de share, a estação de Queluz de Baixo ficou nos 13,9% e a RTP1 terminou em terceiro, com 11,4%. A RTP2 ficou nos 0,7%. Os valores são de share, com o visionamento em direto e o diferido do próprio dia (Live+VOSDAL).</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-guerra-audiencias-sic-tvi-rtp1-outubro-2026-grafico-1-share-dia.jpg" alt="Gráfico do share de terça-feira, 27 de outubro: SIC 14,0%, TVI 13,9%, RTP1 11,4%, RTP2 0,7%"></p>
<p><em>Share de terça-feira, 27 de outubro (Live+VOSDAL). Gráfico: Olha que Duas, com dados publicados pelo Quinto Canal e pelo TV Independente.</em></p>
<h2>A semana também foi da SIC, mas por pouco</h2>
<p>O retrato da semana anterior confirma o equilíbrio. A SIC manteve a liderança com 13,5% de share, a TVI ficou nos 13,3%, menos uma décima do que na semana antes, e a RTP1 subiu uma décima, para 10,8%, sendo o único canal de sinal aberto a crescer. O cabo, somado, chegou aos 40,7%. E os portugueses continuam a ver muita televisão: o consumo médio diário estabilizou nas cinco horas e 13 minutos.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-guerra-audiencias-sic-tvi-rtp1-outubro-2026-grafico-2-share-semana.jpg" alt="Gráfico do share semanal: SIC 13,5%, TVI 13,3%, RTP1 10,8%, cabo 40,7%"></p>
<p><em>Share semanal dos canais generalistas. Gráfico: Olha que Duas, com dados da Havas Media Network publicados pelo Meios &amp; Publicidade.</em></p>
<h2>O que puxa cada canal</h2>
<p><strong>SIC.</strong> A ficção continua a ser a arma do canal. «Destino Maior», a novela da SP Televisão que se estreou a 14 de setembro, entrou no top 5 dos programas mais vistos da semana com uma edição especial. No mesmo top estão o «Jornal da Noite» e «Isto É Gozar com Quem Trabalha».</p>
<p><strong>TVI.</strong> A aposta está no «Big Brother: All Stars». Na terça-feira, o especial da noite teve o minuto mais visto do canal, às 22h36, com 7,6 de rating e 21,7% de share. Na semana, «The Brain» foi o programa da TVI mais bem colocado, em terceiro lugar.</p>
<p><strong>RTP1.</strong> O trunfo chama-se «O Preço Certo». O programa de Fernando Mendes foi o mais visto da semana e, na terça-feira, teve o minuto mais visto do dia em todos os canais: 10,7 de rating e 23,1% de share, às 19h56.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/noticias-guerra-audiencias-sic-tvi-rtp1-outubro-2026-grafico-3-minutos.jpg" alt="Gráfico dos minutos mais vistos de 27 de outubro: «O Preço Certo» 23,1%, «Jornal da Noite» 21,7%, «Big Brother: All Stars – Especial» 21,7%, «Ouro Azul» 2,5%"></p>
<p><em>Os minutos mais vistos de terça-feira, 27 de outubro (dados provisórios CAEM/GfK, com VOSDAL). Gráfico: Olha que Duas, com dados publicados pela Zapping.</em></p>
<h2>Quem ganha outubro?</h2>
<p>Com uma décima de diferença num só dia e duas décimas na média da semana, a disputa pelo mês está em aberto até ao fim. A SIC parte na frente, a TVI está colada e a RTP1 continua a subir de forma discreta, apoiada no fim de tarde. O Olha que Duas vai acompanhar os números até ao fecho do mês.</p>$au$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-guerra-audiencias-sic-tvi-rtp1-outubro-2026-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-guerra-audiencias-sic-tvi-rtp1-outubro-2026-og.jpg',
  true,
  '2026-10-29 18:00:00+00',
  (SELECT id FROM exclusive_programs WHERE slug = 'noticias-olha-que-duas'),
  'Alexandra Serra',
  'Audiências: SIC vence a TVI por uma décima a 27 de outubro',
  'Na terça-feira, 27 de outubro, a SIC teve 14,0% de share, a TVI 13,9% e a RTP1 11,4%. Os números da semana e os programas que puxam cada canal.'
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
