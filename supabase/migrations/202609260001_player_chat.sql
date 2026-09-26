-- Player chat v1. Current Supabase guidance: explicit grants + RLS for Data API tables.
-- One durable conversation per player; access always follows current active profile/team state.

create table public.player_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (player_id)
);

create table public.player_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.player_chat_conversations(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  client_key text not null check (char_length(btrim(client_key)) between 8 and 120),
  created_at timestamptz not null default now(),
  unique (sender_profile_id, client_key)
);

create table public.player_chat_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.player_chat_messages(id) on delete cascade,
  reader_profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (message_id, reader_profile_id)
);

create index player_chat_messages_conversation_created_idx
  on public.player_chat_messages(conversation_id, created_at, id);
create index player_chat_reads_reader_idx
  on public.player_chat_reads(reader_profile_id, message_id);

alter table public.player_chat_conversations enable row level security;
alter table public.player_chat_messages enable row level security;
alter table public.player_chat_reads enable row level security;

revoke all on table public.player_chat_conversations from anon;
revoke all on table public.player_chat_messages from anon;
revoke all on table public.player_chat_reads from anon;
revoke all on table public.player_chat_conversations from authenticated;
revoke all on table public.player_chat_messages from authenticated;
revoke all on table public.player_chat_reads from authenticated;
grant select, insert on public.player_chat_conversations to authenticated;
grant select, insert on public.player_chat_messages to authenticated;
grant select, insert on public.player_chat_reads to authenticated;

-- A participant is either the active linked player or an active leader in the same team.
create policy "chat participants read conversations"
on public.player_chat_conversations for select to authenticated
using (
  exists (
    select 1
    from public.players pl
    join public.profiles player_profile on player_profile.id = pl.profile_id
    where pl.id = player_chat_conversations.player_id
      and pl.is_active is true
      and player_profile.is_active is true
      and (
        (
          public.current_profile_active()
          and public.current_profile_role() = 'player'
          and pl.profile_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles leader_profile
          where leader_profile.id = auth.uid()
            and leader_profile.is_active is true
            and leader_profile.role in ('admin','coach')
            and leader_profile.team = player_profile.team
        )
      )
  )
);

create policy "chat participants create conversation"
on public.player_chat_conversations for insert to authenticated
with check (
  exists (
    select 1
    from public.players pl
    join public.profiles player_profile on player_profile.id = pl.profile_id
    where pl.id = player_chat_conversations.player_id
      and pl.is_active is true
      and player_profile.is_active is true
      and (
        (
          public.current_profile_active()
          and public.current_profile_role() = 'player'
          and pl.profile_id = auth.uid()
        )
        or exists (
          select 1 from public.profiles leader_profile
          where leader_profile.id = auth.uid()
            and leader_profile.is_active is true
            and leader_profile.role in ('admin','coach')
            and leader_profile.team = player_profile.team
        )
      )
  )
);

create policy "chat participants read messages"
on public.player_chat_messages for select to authenticated
using (
  exists (
    select 1
    from public.player_chat_conversations c
    join public.players pl on pl.id = c.player_id
    join public.profiles player_profile on player_profile.id = pl.profile_id
    where c.id = player_chat_messages.conversation_id
      and pl.is_active is true
      and player_profile.is_active is true
      and (
        (public.current_profile_active() and public.current_profile_role() = 'player' and pl.profile_id = auth.uid())
        or exists (
          select 1 from public.profiles leader_profile
          where leader_profile.id = auth.uid()
            and leader_profile.is_active is true
            and leader_profile.role in ('admin','coach')
            and leader_profile.team = player_profile.team
        )
      )
  )
);

create policy "chat participants send messages"
on public.player_chat_messages for insert to authenticated
with check (
  sender_profile_id = auth.uid()
  and exists (
    select 1
    from public.player_chat_conversations c
    join public.players pl on pl.id = c.player_id
    join public.profiles player_profile on player_profile.id = pl.profile_id
    where c.id = player_chat_messages.conversation_id
      and pl.is_active is true
      and player_profile.is_active is true
      and (
        (public.current_profile_active() and public.current_profile_role() = 'player' and pl.profile_id = auth.uid())
        or exists (
          select 1 from public.profiles leader_profile
          where leader_profile.id = auth.uid()
            and leader_profile.is_active is true
            and leader_profile.role in ('admin','coach')
            and leader_profile.team = player_profile.team
        )
      )
  )
);

create policy "chat users read own read receipts"
on public.player_chat_reads for select to authenticated
using (
  reader_profile_id = auth.uid()
  and exists (
    select 1
    from public.player_chat_messages m
    join public.player_chat_conversations c on c.id = m.conversation_id
    join public.players pl on pl.id = c.player_id
    join public.profiles player_profile on player_profile.id = pl.profile_id
    where m.id = player_chat_reads.message_id
      and pl.is_active is true
      and player_profile.is_active is true
      and (
        (public.current_profile_active() and public.current_profile_role() = 'player' and pl.profile_id = auth.uid())
        or exists (
          select 1 from public.profiles leader_profile
          where leader_profile.id = auth.uid()
            and leader_profile.is_active is true
            and leader_profile.role in ('admin','coach')
            and leader_profile.team = player_profile.team
        )
      )
  )
);

create policy "chat users mark own reads"
on public.player_chat_reads for insert to authenticated
with check (
  reader_profile_id = auth.uid()
  and exists (
    select 1
    from public.player_chat_messages m
    join public.player_chat_conversations c on c.id = m.conversation_id
    join public.players pl on pl.id = c.player_id
    join public.profiles player_profile on player_profile.id = pl.profile_id
    where m.id = player_chat_reads.message_id
      and m.sender_profile_id <> auth.uid()
      and pl.is_active is true
      and player_profile.is_active is true
      and (
        (public.current_profile_active() and public.current_profile_role() = 'player' and pl.profile_id = auth.uid())
        or exists (
          select 1 from public.profiles leader_profile
          where leader_profile.id = auth.uid()
            and leader_profile.is_active is true
            and leader_profile.role in ('admin','coach')
            and leader_profile.team = player_profile.team
        )
      )
  )
);
