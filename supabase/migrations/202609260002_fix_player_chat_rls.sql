-- Fix player-chat RLS participant lookup.
-- Direct joins in chat policies were themselves filtered by profiles/players RLS,
-- so valid same-team leaders could not create the first conversation.

create or replace function public.can_access_player_chat(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.players pl
    join public.profiles player_profile on player_profile.id = pl.profile_id
    join public.profiles me on me.id = auth.uid()
    where pl.id = p_player_id
      and pl.is_active is true
      and player_profile.is_active is true
      and me.is_active is true
      and (
        (me.role = 'player' and pl.profile_id = me.id)
        or (me.role in ('admin','coach') and me.team = player_profile.team)
      )
  );
$$;

revoke all on function public.can_access_player_chat(uuid) from public;
revoke all on function public.can_access_player_chat(uuid) from anon;
grant execute on function public.can_access_player_chat(uuid) to authenticated;

drop policy if exists "chat participants read conversations" on public.player_chat_conversations;
create policy "chat participants read conversations" on public.player_chat_conversations for select to authenticated
using (public.can_access_player_chat(player_id));

drop policy if exists "chat participants create conversation" on public.player_chat_conversations;
create policy "chat participants create conversation" on public.player_chat_conversations for insert to authenticated
with check (public.can_access_player_chat(player_id));

drop policy if exists "chat participants read messages" on public.player_chat_messages;
create policy "chat participants read messages" on public.player_chat_messages for select to authenticated
using (exists (select 1 from public.player_chat_conversations c where c.id=player_chat_messages.conversation_id and public.can_access_player_chat(c.player_id)));

drop policy if exists "chat participants send messages" on public.player_chat_messages;
create policy "chat participants send messages" on public.player_chat_messages for insert to authenticated
with check (sender_profile_id=auth.uid() and exists (select 1 from public.player_chat_conversations c where c.id=player_chat_messages.conversation_id and public.can_access_player_chat(c.player_id)));

drop policy if exists "chat users read own read receipts" on public.player_chat_reads;
create policy "chat users read own read receipts" on public.player_chat_reads for select to authenticated
using (reader_profile_id=auth.uid() and exists (select 1 from public.player_chat_messages m join public.player_chat_conversations c on c.id=m.conversation_id where m.id=player_chat_reads.message_id and public.can_access_player_chat(c.player_id)));

drop policy if exists "chat users mark own reads" on public.player_chat_reads;
create policy "chat users mark own reads" on public.player_chat_reads for insert to authenticated
with check (reader_profile_id=auth.uid() and exists (select 1 from public.player_chat_messages m join public.player_chat_conversations c on c.id=m.conversation_id where m.id=player_chat_reads.message_id and m.sender_profile_id<>auth.uid() and public.can_access_player_chat(c.player_id)));
