update public.sportadmin_player_candidates
set source='sportadmin_junior'
where source='sportadmin_p2011';

alter table public.sportadmin_player_candidates
  alter column source set default 'sportadmin_junior';
