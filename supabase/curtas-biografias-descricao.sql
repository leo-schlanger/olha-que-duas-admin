-- Curtas Biografias: a descrição deixa de limitar o programa a Portugal (Leo, 14/11/2026,
-- com a biografia da Frida Kahlo). Antes: «Curtas biografias de figuras públicas de Portugal,
-- por Alexandra Serra.» O seed-curtas-biografias.sql tem já o texto novo.
UPDATE exclusive_programs
SET description = 'Curtas biografias de figuras marcantes, por Alexandra Serra.'
WHERE slug = 'curtas-biografias';
