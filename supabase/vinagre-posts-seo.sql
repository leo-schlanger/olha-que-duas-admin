-- Título e descrição para o Google (2026-10-24).
-- O título da peça pode ser longo (é o H1); no Google só cabem ~60 caracteres
-- e na descrição ~155. Vazio = o site usa o título e o resumo.
ALTER TABLE vinagre_posts ADD COLUMN IF NOT EXISTS seo_title VARCHAR(70) NOT NULL DEFAULT '';
ALTER TABLE vinagre_posts ADD COLUMN IF NOT EXISTS seo_description VARCHAR(170) NOT NULL DEFAULT '';
NOTIFY pgrst, 'reload schema';
