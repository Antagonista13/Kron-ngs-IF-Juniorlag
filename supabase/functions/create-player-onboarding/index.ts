import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function base64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const caller = userData.user;
  if (userError || !caller) return json({ error: 'Unauthorized' }, 401);

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role,is_active')
    .eq('id', caller.id)
    .maybeSingle();
  if (profileError || !profile || profile.role !== 'admin' || profile.is_active !== true) {
    return json({ error: 'Forbidden' }, 403);
  }

  let body: { playerId?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const playerId = String(body.playerId || '').trim();
  if (!playerId) return json({ ok: false, code: 'INVALID_PLAYER', error: 'Välj en spelare.' });

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: player, error: playerError } = await serviceClient
    .from('players')
    .select('id,full_name,profile_id,is_active')
    .eq('id', playerId)
    .maybeSingle();
  if (playerError || !player || player.is_active !== true) {
    return json({ ok: false, code: 'PLAYER_NOT_FOUND', error: 'Spelaren finns inte i den aktiva truppen.' });
  }
  if (player.profile_id) {
    return json({ ok: false, code: 'PLAYER_ALREADY_LINKED', error: 'Spelaren har redan ett anslutet konto.' });
  }

  const { data: contact, error: contactError } = await serviceClient
    .from('player_contact_preferences')
    .select('mobile_phone')
    .eq('player_id', playerId)
    .maybeSingle();
  if (contactError) return json({ error: 'Could not read player contact' }, 500);
  const phone = String(contact?.mobile_phone || '').trim();
  if (!phone) {
    return json({ ok: false, code: 'MISSING_PHONE', error: 'Spelaren saknar registrerat mobilnummer.' });
  }

  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = base64Url(tokenBytes);
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { error: revokeError } = await serviceClient
    .from('player_onboarding_tokens')
    .update({ revoked_at: now.toISOString() })
    .eq('player_id', playerId)
    .is('consumed_at', null)
    .is('revoked_at', null);
  if (revokeError) return json({ error: 'Could not revoke earlier invitations' }, 500);

  const { error: insertError } = await serviceClient.from('player_onboarding_tokens').insert({
    player_id: playerId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: caller.id
  });
  if (insertError) return json({ error: 'Could not create invitation' }, 500);

  const appUrl = Deno.env.get('APP_URL') || 'https://antagonista13.github.io/Kron-ngs-IF-Juniorlag/';
  const inviteUrl = new URL(appUrl);
  inviteUrl.searchParams.set('onboard', token);

  return json({ ok: true, phone, inviteUrl: inviteUrl.toString(), playerName: player.full_name, expiresAt });
});
