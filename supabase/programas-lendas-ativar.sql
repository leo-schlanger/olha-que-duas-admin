-- Lendas de Portugal: ativa a sexta 22:00 semanal (Leo, 20/11: começa já hoje, sexta 20/11 às 22h)
-- e tira a data avulsa de 27/11, que passava a duplicar. Um DELETE de 1 linha, pelo par (evento, data).
begin;
update schedule set is_active = true where event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315' and day_of_week = 5;
delete from schedule_dates where event_id = '4ed48be7-d5f6-437b-95b4-2d6e75b75315' and event_date = date '2026-11-27';
commit;
