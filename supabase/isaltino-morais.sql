-- Curtas Biografias: Isaltino Morais, o autarca, a obra e a justiça.
-- Texto da Alexandra Serra, publicado como chegou (18/11/2026). H2 e créditos
-- de foto são do formato. Aspas retas do original passaram a «».
-- Fotos: frame CC BY 3.0 da Agência Lusa (26/01/2023, YouTube) e Taguspark
-- (Fred Mendonça, CC BY-SA 3.0, Commons, dezembro de 2005).
-- O retrato institucional da Câmara (EXIF Copyrighted / CMO) não entra:
-- a etiqueta CC BY no Commons é só a do carregador.
-- Capa e og: scripts/capas/pecas/isaltino-morais.json
-- O ON CONFLICT não mexe em is_published nem published_at.

BEGIN;

INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'isaltino-morais',
  'Isaltino Morais: O Autarca, a Obra e a Justiça',
  'A sua biografia cruza a transformação de um município periférico num motor económico nacional com uma longa história de casos que passam pela Suíça e pela prisão.',
  $bio$<p>Isaltino Afonso Morais é uma das figuras mais complexas e mediáticas da política portuguesa contemporânea. A sua biografia cruza a transformação de um município periférico num motor económico nacional com uma longa história de casos que passam pela Suíça e pela prisão.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-isaltino-morais-retrato.jpg" alt="Isaltino Morais, de óculos e barba branca, diante dos painéis de um programa de habitação em Oeiras"></p>
<p><em>Isaltino Morais em Oeiras, a 26 de janeiro de 2023. Foto: Agência Lusa, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>, a partir de <a href="https://www.youtube.com/watch?v=VMshjtPFauM">«Oeiras defende desafetação de terrenos agrícolas para habitação pública»</a>.</em></p>
<h2>Origens, Juventude e Formação</h2>
<p>Nascido a 29 de dezembro de 1949, no concelho de Mirandela, teve origens humildes que moldaram a sua ética de trabalho e a proximidade com as classes populares. Aos 18 anos, mudou-se para Lisboa, onde trabalhou numa fábrica de sapatos e no Instituto Nacional de Estatística (INE) para se sustentar. Após cumprir o serviço militar em Angola, ingressou na Universidade de Lisboa, licenciando-se em Direito em 1981, num percurso onde se cruzou com figuras centrais da política nacional, como Marcelo Rebelo de Sousa e José Manuel Durão Barroso.</p>
<h2>A Ascensão Política e o «Modelo de Oeiras»</h2>
<p>Filiado no PSD desde 1978, Isaltino Morais conquistou a Câmara Municipal de Oeiras em 1985, iniciando um domínio autárquico que ditaria o futuro do concelho. Nas décadas seguintes, implementou o que ficou conhecido como o «Modelo de Oeiras». Conduziu um processo drástico de erradicação de bairros de barracas e apostou fortemente na captação de empresas. Com a criação de complexos como o Taguspark, a Quinta da Fonte e o Lagoas Park, transformou Oeiras num dos municípios com maior rendimento per capita e maior concentração de quadros superiores de Portugal, cimentando uma profunda lealdade eleitoral.</p>
<p><img src="https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-isaltino-morais-taguspark.jpg" alt="Vista do Taguspark, em Oeiras, com os edifícios do parque tecnológico e o estacionamento"></p>
<p><em>O Taguspark, em Oeiras, em dezembro de 2005. Foto: Fred Mendonça, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>, via <a href="https://commons.wikimedia.org/wiki/File:TagusPark.JPG">Wikimedia Commons</a>.</em></p>
<h2>O Salto Nacional e a Queda Judicial</h2>
<p>O sucesso autárquico levou-o a interromper o mandato em 2002 para assumir o cargo de Ministro das Cidades, Ordenamento do Território e Ambiente no governo de Durão Barroso. A experiência foi efémera: demitiu-se em 2003 após as primeiras notícias sobre contas bancárias não declaradas. Este momento marcou o início de uma longa batalha judicial. Acabou condenado pelos crimes de fraude fiscal qualificada e branqueamento de capitais, cumprindo pena de prisão efetiva no Estabelecimento Prisional da Carregueira entre abril de 2013 e junho de 2014.</p>
<h2>Vida Pessoal e o Impacto do Encarceramento</h2>
<p>A vida privada do autarca foi inevitavelmente arrastada para o escrutínio público durante os seus processos. Casado com Patrícia Camarinho e pai de, pelo menos, dois filhos (um rapaz, Afonso, e uma rapariga), Isaltino descreveu o período na prisão como um momento de reavaliação pessoal. Afirmou que a experiência o aproximou da mulher e sublinhou a dor de receber a visita do filho, na altura com 11 anos, na cadeia. Assumindo-se como um homem crente e positivo, mantém que foi usado como bode expiatório do sistema, mas garante não guardar rancor.</p>
<h2>A Resiliência Eleitoral</h2>
<p>O traço mais singular da sua biografia é a sobrevivência política. Desfiliou-se do PSD em 2005 e provou que o seu capital político independia de partidos. Venceu a Câmara de Oeiras como candidato independente em 2005, 2009, 2017 (uma vitória com maioria absoluta apenas três anos após sair da prisão) e 2021. Para o eleitorado local, o peso da «obra feita» e da gestão autárquica sobrepôs-se repetidamente ao cadastro criminal.</p>
<h2>O Futuro: Novos Desafios e Ambições</h2>
<p>Atualmente, o escrutínio judicial e as polémicas continuam a marcar o seu percurso. A nível familiar e municipal, enfrentou recentemente denúncias da oposição relativas a contratos adjudicados pela Câmara de Oeiras a uma empresa da qual a sua filha é sócia. No plano penal, o autarca tem ainda três julgamentos à vista, enfrentando acusações do Ministério Público (como peculato) por suspeitas de uso indevido de fundos públicos em despesas de representação, almoços e jantares.</p>
<p>Apesar da pressão, Isaltino Morais mantém-se na ofensiva política. Recusando circunscrever-se à esfera local, tem promovido ativamente a ideia de fundar um novo partido de âmbito nacional. O objetivo desta ambição passa por criar uma força de centro, moderada e social-democrata, capaz de forçar compromissos de regime e combater a polarização e os extremismos no atual cenário político português.</p>$bio$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-isaltino-morais-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-isaltino-morais-og.jpg',
  true,
  now() - interval '1 minute',
  (SELECT id FROM exclusive_programs WHERE slug = 'curtas-biografias'),
  'Alexandra Serra',
  'Isaltino Morais: O Autarca, a Obra e a Justiça',
  'A sua biografia cruza a transformação de um município periférico num motor económico nacional com casos que passam pela Suíça e pela prisão.'
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
