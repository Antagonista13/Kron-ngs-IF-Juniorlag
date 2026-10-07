// Local PostgreSQL/WASM harness. Vault/network/cron are stubs; production integration is separate.
const {PGlite}=await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
import { readFileSync } from 'node:fs';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema vault;create schema extensions;create schema net;create schema cron;
create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds int) returns bigint language sql as $$select 1::bigint$$;
create function cron.schedule(n text,s text,c text) returns bigint language sql as $$select 1::bigint$$;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
create table profiles(id uuid primary key default gen_random_uuid(), role text,team text,is_active boolean,full_name text);
create table players(id uuid primary key default gen_random_uuid(),profile_id uuid references profiles(id),is_active boolean);
create table team_posts(id uuid primary key default gen_random_uuid(),team text,title text,body text,is_pinned boolean,created_by uuid,created_at timestamptz default now(),image_url text);
create table player_chat_conversations(id uuid primary key default gen_random_uuid(),player_id uuid);
create table player_chat_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid,sender_profile_id uuid,body text,client_key text,created_at timestamptz default now());
create table player_chat_reads(id uuid primary key default gen_random_uuid(),message_id uuid,reader_profile_id uuid,read_at timestamptz default now());
create table vault.secrets(id uuid primary key default gen_random_uuid(),name text,secret text);
create view vault.decrypted_secrets as select id,name,secret as decrypted_secret from vault.secrets;
create function vault.create_secret(s text,n text) returns uuid language sql as $$insert into vault.secrets(name,secret) values(n,s) returning id$$;
create function vault.update_secret(i uuid,s text) returns void language sql as $$update vault.secrets set secret=s where id=i$$;
create function extensions.gen_random_bytes(n int) returns bytea language sql as $$select decode(repeat('ab',n),'hex')$$;
create function leader_create_team_post(t text,b text,p boolean,i text) returns team_posts language plpgsql security definer as $$declare r team_posts;begin insert into team_posts(team,title,body,is_pinned,created_by,image_url) select team,t,b,p,id,i from profiles where id=auth.uid() returning * into r;return r;end$$;
insert into profiles(role,team,is_active,full_name) values('player','KIF',true,'Fixture One'),('player','KIF',true,'Fixture Two'),('coach','KIF',true,'Fixture Leader');
insert into players(profile_id,is_active) select id,true from profiles where role='player';`);
await db.exec(readFileSync('supabase/migrations/20261007111219_web_push.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261007114030_push_key_safe_update.sql','utf8'));
try { await db.exec(readFileSync('supabase/tests/web_push.sql','utf8')); } catch(error) { console.error(error.message,error.code,error.where);process.exit(1); }
console.log('PostgreSQL push integration assertions passed (rolled back).');
await db.close();
