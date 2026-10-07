-- PostgREST enables safeupdate: configuration update must have an explicit predicate.
create or replace function public.configure_push_keys(public_key text,private_key text,contact text) returns void language plpgsql security definer set search_path=public,vault as $$
declare secret_id uuid;
begin
 if public_key !~ '^[A-Za-z0-9_-]{87}$' or private_key !~ '^[A-Za-z0-9_-]{43}$' or (length(contact)>200 or contact !~ '^(mailto:[^[:space:]]+@[^[:space:]]+|https://antagonista13\.github\.io/Kron-ngs-IF-Juniorlag/)$') then raise invalid_parameter_value;end if;
 select id into secret_id from vault.secrets where name='kif_push_vapid_private';
 if secret_id is null then perform vault.create_secret(private_key,'kif_push_vapid_private');else perform vault.update_secret(secret_id,private_key);end if;
 update push_config c set public_key=configure_push_keys.public_key,contact=configure_push_keys.contact where c.singleton=true;
end $$;
