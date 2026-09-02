create table if not exists public.development_focus_coach_feedback (
  id uuid primary key default gen_random_uuid(),
  focus_id uuid not null references public.development_focuses(id) on delete cascade,
  coach_id uuid not null references public.profiles(id),
  comment text not null check (char_length(btrim(comment)) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.development_focus_coach_feedback enable row level security;

create policy "Player can read feedback on own focus"
on public.development_focus_coach_feedback
for select to authenticated
using (
  exists (
    select 1 from public.development_focuses f
    where f.id = development_focus_coach_feedback.focus_id
      and f.player_id = auth.uid()
  )
);

create policy "Coach can read team focus feedback"
on public.development_focus_coach_feedback
for select to authenticated
using (
  public.is_coach()
  and exists (
    select 1
    from public.development_focuses f
    join public.profiles player_profile on player_profile.id = f.player_id
    join public.profiles coach_profile on coach_profile.id = auth.uid()
    where f.id = development_focus_coach_feedback.focus_id
      and coach_profile.team = player_profile.team
  )
);

create or replace function public.add_coach_focus_comment(p_focus_id uuid, p_comment text)
returns public.development_focus_coach_feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment text := btrim(p_comment);
  v_row public.development_focus_coach_feedback;
begin
  if auth.uid() is null or not public.is_coach() then
    raise exception 'Endast tränare kan lämna återkoppling.';
  end if;
  if v_comment is null or char_length(v_comment) < 1 or char_length(v_comment) > 2000 then
    raise exception 'Kommentaren måste vara mellan 1 och 2000 tecken.';
  end if;
  if not exists (
    select 1
    from public.development_focuses f
    join public.profiles player_profile on player_profile.id = f.player_id
    join public.profiles coach_profile on coach_profile.id = auth.uid()
    where f.id = p_focus_id
      and f.lifecycle_status = 'active'
      and coach_profile.team = player_profile.team
  ) then
    raise exception 'Aktivt fokus kunde inte hittas.';
  end if;
  insert into public.development_focus_coach_feedback(focus_id, coach_id, comment)
  values (p_focus_id, auth.uid(), v_comment)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.set_coach_focus_follow_up_status(p_focus_id uuid, p_follow_up_status text)
returns public.development_focuses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.development_focuses;
begin
  if auth.uid() is null or not public.is_coach() then
    raise exception 'Endast tränare kan ändra uppföljningsstatus.';
  end if;
  if p_follow_up_status not in ('following_up', 'follow_up_complete') then
    raise exception 'Ogiltig uppföljningsstatus.';
  end if;
  update public.development_focuses f
  set follow_up_status = p_follow_up_status, updated_at = now()
  where f.id = p_focus_id
    and f.lifecycle_status = 'active'
    and exists (
      select 1
      from public.profiles player_profile
      join public.profiles coach_profile on coach_profile.id = auth.uid()
      where player_profile.id = f.player_id
        and coach_profile.team = player_profile.team
    )
  returning * into v_row;
  if v_row.id is null then
    raise exception 'Aktivt fokus kunde inte hittas.';
  end if;
  return v_row;
end;
$$;

revoke execute on function public.add_coach_focus_comment(uuid, text) from public;
grant execute on function public.add_coach_focus_comment(uuid, text) to authenticated;
revoke execute on function public.set_coach_focus_follow_up_status(uuid, text) from public;
grant execute on function public.set_coach_focus_follow_up_status(uuid, text) to authenticated;
