create table public.development_subgoals (
  id uuid primary key default gen_random_uuid(),

  goal_id uuid not null
    references public.development_goals(id),

  text text not null
    check (
      char_length(btrim(text)) between 1 and 300
    ),

  sort_order integer not null default 0
    check (
      sort_order >= 0
    ),

  status text not null default 'active'
    check (
      status in ('active', 'completed', 'archived')
    ),

  created_at timestamptz not null default now(),

  completed_at timestamptz,

  archived_at timestamptz,

  check (
    (
      status = 'active'
      and completed_at is null
      and archived_at is null
    )
    or
    (
      status = 'completed'
      and completed_at is not null
      and archived_at is null
    )
    or
    (
      status = 'archived'
      and archived_at is not null
    )
  )
);

create index development_subgoals_goal_id_idx
on public.development_subgoals (goal_id);

alter table public.development_subgoals
enable row level security;
