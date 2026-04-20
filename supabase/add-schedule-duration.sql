-- Adicionar campos de duração e dia inteiro à tabela schedule
ALTER TABLE schedule ADD COLUMN end_time TIME DEFAULT NULL;
ALTER TABLE schedule ADD COLUMN is_all_day BOOLEAN DEFAULT false;
