-- Match the current editor while preserving already-saved legacy values.
alter table public.players drop constraint if exists players_position_check;
alter table public.players add constraint players_position_check check (
 position is null or position in (
  'Målvakt','Försvarare','Innerback','Ytterback','Mittfältare',
  'Innermittfält','Yttermittfält','Anfallare','Yttermittfältare'
 )
);
