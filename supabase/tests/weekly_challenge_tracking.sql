-- Run as the database owner. Every fixture and mark is rolled back.
begin;
do $$
declare
  player_uuid uuid; other_player uuid; coach_uuid uuid; parent_uuid uuid; team_name text;
  current_challenge uuid := gen_random_uuid(); old_challenge uuid := gen_random_uuid(); other_challenge uuid := gen_random_uuid();
  affected integer; visible integer;
begin
  select id,team into player_uuid,team_name from public.profiles where is_active and role='player' order by id limit 1;
  select id into other_player from public.profiles where is_active and role='player' and team=team_name and id<>player_uuid order by id limit 1;
  select id into coach_uuid from public.profiles where is_active and role in ('coach','admin') and team=team_name order by id limit 1;
  select id into parent_uuid from public.profiles where is_active and role='parent' order by id limit 1;
  if player_uuid is null or other_player is null or coach_uuid is null or parent_uuid is null then raise exception 'Test requires two players, a same-team leader and a parent';end if;
  insert into public.team_challenges(id,team,title,instruction,active,created_by,created_at) values
    (current_challenge,team_name,'RLS test','Temporary fixture',true,coach_uuid,now()),
    (old_challenge,team_name,'Expired test','Temporary fixture',true,coach_uuid,now()-interval '8 days'),
    (other_challenge,'__kif_other_team_test__','Other team test','Temporary fixture',true,coach_uuid,now());
  insert into public.challenge_completions(challenge_id,player_id) values(current_challenge,other_player),(other_challenge,other_player);

  perform set_config('request.jwt.claim.sub',player_uuid::text,true);
  execute 'set local role authenticated';
  insert into public.challenge_completions(challenge_id,player_id) values(current_challenge,player_uuid);
  select count(*) into visible from public.challenge_completions where challenge_id=current_challenge;
  if visible<>1 then raise exception 'Player can see another player mark';end if;
  delete from public.challenge_completions where challenge_id=current_challenge and player_id=player_uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Own undo failed';end if;
  begin
    insert into public.challenge_completions(challenge_id,player_id) values(old_challenge,player_uuid);
    raise exception 'Expired challenge incorrectly allowed';
  exception when insufficient_privilege then null;end;
  begin
    insert into public.challenge_completions(challenge_id,player_id) values(other_challenge,player_uuid);
    raise exception 'Other team challenge incorrectly allowed';
  exception when insufficient_privilege then null;end;
  begin
    insert into public.challenge_completions(challenge_id,player_id) values(current_challenge,other_player);
    raise exception 'Spoofed player incorrectly allowed';
  exception when insufficient_privilege then null;end;
  perform set_config('request.jwt.claim.sub',coach_uuid::text,true);
  select count(*) into visible from public.challenge_completions where challenge_id=current_challenge;
  if visible<>1 then raise exception 'Leader cannot see same-team statistics';end if;
  select count(*) into visible from public.challenge_completions where challenge_id=other_challenge;
  if visible<>0 then raise exception 'Leader can see another team statistics';end if;
  delete from public.challenge_completions where challenge_id=current_challenge;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'Leader can change player marks';end if;
  perform set_config('request.jwt.claim.sub',parent_uuid::text,true);
  select count(*) into visible from public.challenge_completions where challenge_id=current_challenge;
  if visible<>0 then raise exception 'Parent can see player statistics';end if;
  execute 'reset role';
end $$;
rollback;
