-- Autor da peça quando não é o do programa (2026-10-24).
-- O Eduardo Vinagre continua a assinar as peças que escreveu, agora em Notícias Olha que Duas.
-- Vazio = o autor do programa.
ALTER TABLE vinagre_posts ADD COLUMN IF NOT EXISTS author VARCHAR(120) NOT NULL DEFAULT '';
NOTIFY pgrst, 'reload schema';

UPDATE vinagre_posts SET author = 'Eduardo Vinagre'
WHERE slug IN (
  'abel-dias-o-ze-nunca-bateu-na-betty',
  'ronaldo-nao-voltara-a-ser-cr7',
  'biografia-diogo-jota-livro-oficial-liverpool',
  'cristina-ferreira-joao-monteiro-realizam-sonho-fabio-marques-np4game',
  'susana-da-silva-tribunal-antonio-pedro-cerdeira-romance-comandante-melides',
  'papa-leao-xiv-nodulo-pulmao-vai-ser-operado',
  'pedro-mourinho-fora-do-now',
  'david-antunes-morte-netinho',
  'fernanda-serrano-desmente-novo-amor',
  'passado-secreto-luis-maia-50-anos',
  'o-adeus-de-joaquim-letria-aos-82-anos',
  'filha-de-sandra-felgueiras-orgulho-na-mae',
  'guilherme-castelo-branco-tem-razao-sentenca-janeiro-2027',
  'ana-gomes-picarota-vida-secreta-sic-bruxelas-pico'
);
