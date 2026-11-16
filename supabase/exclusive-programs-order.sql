-- Ordem dos programas no Exclusivo (2026-10-24, pedido do Leo):
-- Notícias Olha que Duas à frente, Olha que Duas e Eu (Eduardo Vinagre) no fim.
-- 2026-11-16: Lendas de Portugal (6, desde 30/10) e Céu de Cada Mês (7) depois dos existentes.
UPDATE exclusive_programs SET sort_order = CASE slug
  WHEN 'noticias-olha-que-duas' THEN 1
  WHEN 'curtas-biografias' THEN 2
  WHEN 'pimenta-na-lingua' THEN 3
  WHEN 'mente-aberta' THEN 4
  WHEN 'olha-que-duas-e-eu' THEN 5
  WHEN 'lendas-de-portugal' THEN 6
  WHEN 'ceu-de-cada-mes' THEN 7
  ELSE sort_order END;
