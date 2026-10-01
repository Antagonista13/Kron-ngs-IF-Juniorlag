alter table public.players
  drop constraint if exists players_position_check;

alter table public.players
  add constraint players_position_check
  check (
    position is null
    or position = any (
      array[
        'Målvakt'::text,
        'Försvarare'::text,
        'Innerback'::text,
        'Ytterback'::text,
        'Mittfältare'::text,
        'Innermittfält'::text,
        'Yttermittfält'::text,
        'Anfallare'::text
      ]
    )
  );
