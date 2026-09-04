-- Lock Admin-only staff RPCs to signed-in callers.
revoke all on function public.admin_save_team_staff(bigint,text,text,text,text,text,text,integer) from anon;
revoke all on function public.admin_remove_team_staff(bigint) from anon;
revoke all on function public.admin_reorder_team_staff(bigint,integer) from anon;

grant execute on function public.admin_save_team_staff(bigint,text,text,text,text,text,text,integer) to authenticated;
grant execute on function public.admin_remove_team_staff(bigint) to authenticated;
grant execute on function public.admin_reorder_team_staff(bigint,integer) to authenticated;
