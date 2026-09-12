import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500);

  let body: { action?: string; token?: string; email?: string; password?: string };
  try { body = await req.json(); } catch { return json({ ok: false, code: 'INVALID_REQUEST', error: 'Ogiltig begäran.' }); }
  const action = String(body.action || 'complete');
  const token = String(body.token || '').trim();
  if (!token) return json({ ok: false, code: 'INVALID_TOKEN', error: 'Inbjudningslänken är ogiltig.' });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const tokenHash = await sha256Hex(token);
  const { data: tokenRow, error: tokenError } = await serviceClient
    .from('player_onboarding_tokens')
    .select('id,player_id,expires_at,consumed_at,revoked_at,created_by')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (tokenError) return json({ error: 'Could not validate invitation' }, 500);
  if (!tokenRow || tokenRow.revoked_at || tokenRow.consumed_at || new Date(tokenRow.expires_at).getTime() <= Date.now()) {
    return json({ ok: false, code: 'TOKEN_UNAVAILABLE', error: 'Inbjudningslänken är ogiltig, använd eller har gått ut.' });
  }

  const { data: player, error: playerError } = await serviceClient
    .from('players')
    .select('id,full_name,profile_id,is_active')
    .eq('id', tokenRow.player_id)
    .maybeSingle();
  if (playerError || !player || player.is_active !== true) {
    return json({ ok: false, code: 'PLAYER_NOT_FOUND', error: 'Spelaren finns inte längre i den aktiva truppen.' });
  }
  if (player.profile_id) {
    return json({ ok: false, code: 'PLAYER_ALREADY_LINKED', error: 'Spelaren har redan ett anslutet konto.' });
  }

  if (action === 'validate') return json({ ok: true, playerName: player.full_name });

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, code: 'INVALID_EMAIL', error: 'Ange en giltig e-postadress.' });
  if (password.length < 6) return json({ ok: false, code: 'WEAK_PASSWORD', error: 'Lösenordet måste vara minst 6 tecken.' });

  const { data: usersPage, error: usersError } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return json({ error: 'Could not verify email' }, 500);
  const emailExists = (usersPage.users || []).some((user) => String(user.email || '').trim().toLowerCase() === email);
  if (emailExists) return json({ ok: false, code: 'EMAIL_EXISTS', error: 'E-postadressen används redan av ett konto.' });

  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await serviceClient
    .from('player_onboarding_tokens')
    .update({ consumed_at: claimedAt })
    .eq('id', tokenRow.id)
    .is('consumed_at', null)
    .is('revoked_at', null)
    .gt('expires_at', claimedAt)
    .select('id')
    .maybeSingle();
  if (claimError) return json({ error: 'Could not claim invitation' }, 500);
  if (!claimed) return json({ ok: false, code: 'TOKEN_UNAVAILABLE', error: 'Inbjudningslänken har redan använts.' });

  const releaseToken = async () => {
    await serviceClient.from('player_onboarding_tokens').update({ consumed_at: null }).eq('id', tokenRow.id).eq('consumed_at', claimedAt);
  };

  const { data: invitation, error: invitationError } = await serviceClient.from('user_invitations').insert({
    email,
    display_name: player.full_name,
    expected_role: 'player',
    team_function: null,
    status: 'pending',
    invited_by: tokenRow.created_by,
    updated_at: new Date().toISOString()
  }).select('id').single();
  if (invitationError || !invitation) {
    await releaseToken();
    return json({ error: 'Could not prepare account invitation' }, 500);
  }

  let createdUserId = '';
  try {
    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: player.full_name }
    });
    if (createError || !created.user) throw createError || new Error('Auth user missing');
    createdUserId = created.user.id;

    const { error: profileUpdateError } = await serviceClient
      .from('profiles')
      .update({ role: 'player', is_active: true, display_title: null })
      .eq('id', createdUserId);
    if (profileUpdateError) throw profileUpdateError;

    const { data: linkedPlayer, error: linkError } = await serviceClient
      .from('players')
      .update({ profile_id: createdUserId, updated_at: new Date().toISOString() })
      .eq('id', player.id)
      .is('profile_id', null)
      .select('id')
      .maybeSingle();
    if (linkError || !linkedPlayer) throw linkError || new Error('Player link failed');

    await serviceClient.from('user_invitations').delete().eq('id', invitation.id);
    return json({ ok: true, email, playerName: player.full_name });
  } catch (error) {
    if (createdUserId) await serviceClient.auth.admin.deleteUser(createdUserId);
    await serviceClient.from('user_invitations').delete().eq('id', invitation.id);
    await releaseToken();
    console.error('Player onboarding failed', error);
    return json({ ok: false, code: 'ONBOARDING_FAILED', error: 'Kontot kunde inte skapas. Försök igen.' }, 500);
  }
});
