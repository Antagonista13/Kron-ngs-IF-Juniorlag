alter table public.team_posts
add column if not exists is_pinned boolean not null default false;
