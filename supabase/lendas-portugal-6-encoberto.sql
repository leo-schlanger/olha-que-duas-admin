-- Lendas de Portugal, ep. 6: O Encoberto (D. Sebastião). PRONTO, NÃO CORRIDO.
-- Esperar pelo qa do vídeo. Antes de correr: trocar COLAR_URL_YOUTUBE pelo URL do short
-- e confirmar as imagens (capa 1600x1000, og 1200x630, poster 720x1280) no media-library.
-- Texto: supabase/rascunhos/lendas-portugal-ep6.md (redator, 20/11). Autor: Leo Schlanger.
-- Correr: npx supabase db query --linked --yes -f supabase/lendas-portugal-6-encoberto.sql
BEGIN;
INSERT INTO vinagre_posts (
  slug, title, excerpt, content, cover_url, og_image_url,
  video_url, video_poster_url,
  is_published, published_at, program_id, author, seo_title, seo_description
)
VALUES (
  'lendas-de-portugal` (não muda)',
  $t$Lendas de Portugal (não muda)$t$,
  $t$A 4 de agosto de 1578, D. Sebastião foi visto pela última vez em Alcácer-Quibir. Portugal ficou à espera de que voltasse numa manhã de nevoeiro.$t$,
  $lenda6$<p>Antes da Restauração, houve um rei no nevoeiro. Perdeu-se numa batalha em Marrocos, e Portugal passou séculos à espera dele.</p>
<h2>D. Sebastião, o Desejado</h2>
<p>Chamaram-lhe o Desejado. D. Sebastião nasceu a 20 de janeiro de 1554, dezoito dias depois da morte do pai, o príncipe D. João Manuel. Em 1557, com três anos, já era rei.</p>
<h2>Alcácer-Quibir, 4 de agosto de 1578</h2>
<p>Aos 24 anos, levou um exército para Marrocos. A 4 de agosto de 1578, em Alcácer-Quibir, o exército português desfez-se. Em Marrocos, esta é conhecida como a batalha dos Três Reis.</p>
<p>O rei foi visto pela última vez a entrar a cavalo nas linhas inimigas.</p>
<h2>O corpo nos Jerónimos</h2>
<p>Fidalgos portugueses que tinham ficado cativos reconheceram um corpo como sendo o do rei. Esse corpo foi entregue em Ceuta, segundo uma ata de 1578, e em 1582 foi levado para o Mosteiro dos Jerónimos. Mas nunca ninguém provou que era ele.</p>
<p>O historiador Carlos d'Abreu e o investigador espanhol Emílio Rivas Calvo propuseram abrir o túmulo e fazer testes de ADN, para acabar de vez com o mito.</p>
<h2>Um rei espanhol</h2>
<p>D. Sebastião não deixou filhos. Reinou o cardeal D. Henrique e, em 1580, a coroa passou para Filipe II de Espanha, que em Portugal foi Filipe I.</p>
<h2>O sebastianismo e os falsos reis</h2>
<p>Mas o povo não aceitou. Dizia-se que o rei estava vivo. Escondido. À espera. A esta crença chamou-se sebastianismo.</p>
<p>Começaram então a aparecer reis. Mateus Álvares, um açoriano a quem chamavam o Ermitão, vivia numa gruta a sul da Ericeira e jurava ser D. Sebastião. Foi esquartejado e enforcado a 13 de junho de 1585. Dez anos depois, foi a vez de Gabriel de Espinosa, um pasteleiro de Madrigal, enforcado a 1 de agosto de 1595.</p>
<h2>A Ilha Encoberta e o cavalo branco</h2>
<p>Conta-se que o rei espera numa ilha escondida, a Ilha Encoberta, que há quem ligue à Antília, uma das ilhas míticas que os marinheiros diziam ter avistado. E que há de voltar numa manhã de nevoeiro. Nos contos dos Açores, aparece montado num cavalo branco.</p>
<h2>1 de dezembro de 1640: a Restauração</h2>
<p>Sessenta anos depois de 1580, a 1 de dezembro de 1640, Portugal voltou a ter um rei português, D. João IV. Mas houve quem continuasse à espera do outro.</p>
<p>A crença adaptou-se à causa do novo rei. A Inquisição tentou censurá-la e o Marquês de Pombal perseguiu-a, mas voltou a crescer com as invasões francesas.</p>
<h2>Fernando Pessoa e o nevoeiro</h2>
<p>Em 1934, Fernando Pessoa fechou «O Encoberto», na <em>Mensagem</em>, com um poema chamado «Nevoeiro». É dele o verso «Ó Portugal, hoje és nevoeiro…».</p>
<p>Se ele voltasse, numa manhã de nevoeiro, quem o reconheceria?</p>
<p>Na rádio Olha que Duas, todas as sextas às 22h.</p>
<p><strong>De onde vem esta lenda.</strong> O nascimento, o reinado e a batalha de Alcácer-Quibir vêm da Wikipédia, «Sebastião de Portugal», e o nome que a batalha tem em Marrocos, do Camões, I.P. O rei visto pela última vez a entrar nas linhas inimigas está na Wikipédia em inglês, «Sebastian, King of Portugal». O corpo entregue em Ceuta, a trasladação para os Jerónimos e a proposta de abrir o túmulo vêm da RTP Notícias. O sebastianismo e a manhã de nevoeiro estão na RTP Ensina, e a Ilha Encoberta, o cavalo branco dos Açores e a crença depois de 1640 na Wikipédia, «Sebastianismo». Mateus Álvares vem do ncultura.pt e Gabriel de Espinosa do Executed Today e da Wikipédia em inglês, «Sebastianism». O verso é de Fernando Pessoa, <em>Mensagem</em> (1934). As imagens do vídeo estão em domínio público: o retrato de D. Sebastião por Cristóvão de Morais (c. 1571–74, Museu Nacional de Arte Antiga), a gravura de António José Quinto (1806, Biblioteca Nacional de Portugal), o mapa dos reinos de Fez e Marrocos de Jodocus Hondius (1606, Bibliothèque nationale de France), a litografia da morte de D. Sebastião em Alcácer-Quibir de Josep Serra i Porsón (c. 1875), o retrato de Filipe II de Espanha por Sofonisba Anguissola (Museo del Prado), a <em>Aclamação de D. João IV</em> de José Veloso Salgado (1908) e o cavaleiro de <em>The Horse in Motion</em>, de Eadweard Muybridge (1878, Library of Congress). O nevoeiro, a praia, a rua, os cartazes, a ilha e a folha de Pessoa são ilustrações geradas por inteligência artificial.</p>$lenda6$,
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-encoberto-d-sebastiao-capa.jpg',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-encoberto-d-sebastiao-og.jpg',
  'COLAR_URL_YOUTUBE',
  'https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/media-library/exclusivo-lenda-encoberto-d-sebastiao-poster.jpg',
  true, now(),
  (SELECT id FROM exclusive_programs WHERE slug = 'lendas-de-portugal'),
  'Leo Schlanger',
  $t$D. Sebastião, o Encoberto: a lenda do nevoeiro$t$,
  $t$D. Sebastião perdeu-se em Alcácer-Quibir em 1578 e o povo acreditou que voltaria: o sebastianismo, os falsos reis, a Ilha Encoberta e a Restauração.$t$
)
ON CONFLICT (slug) DO NOTHING;
COMMIT;
