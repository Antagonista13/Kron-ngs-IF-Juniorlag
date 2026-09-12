-- SMS-first player onboarding tokens. Plaintext tokens are never stored.
create table if not exists public.player_onboarding_tokens (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint player_onboarding_tokens_expiry_check check (expires_at > created_at)
);

create index if not exists player_onboarding_tokens_player_idx
  on public.player_onboarding_tokens(player_id, created_at desc);

create index if not exists player_onboarding_tokens_created_by_idx
  on public.player_onboarding_tokens(created_by);

create index if not exists player_onboarding_tokens_expiry_idx
  on public.player_onboarding_tokens(expires_at)
  where consumed_at is null and revoked_at is null;

alter table public.player_onboarding_tokens enable row level security;

-- Edge Functions use the service role. Browsers must never read or write token rows directly.
revoke all on public.player_onboarding_tokens from anon;
revoke all on public.player_onboarding_tokens from authenticated;
