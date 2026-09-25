import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

  let body: { playerId?: string; email?: string; fullName?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const playerId = String(body.playerId || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.fullName || '').trim();
  if (!playerId || !/^\S+@\S+\.\S+$/.test(email) || !fullName) return json({ error: 'Invalid invitation data' }, 400);

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: player, error: playerError } = await serviceClient
    .from('players')
    .select('id,full_name,profile_id,is_active')
    .eq('id', playerId)
    .maybeSingle();
  if (playerError || !player || player.is_active !== true) return json({ error: 'Player not found' }, 404);
  if (player.profile_id) return json({ error: 'Player already has an account' }, 409);

  const { data: contact, error: contactError } = await serviceClient
    .from('player_contact_preferences')
    .select('mobile_phone')
    .eq('player_id', playerId)
    .maybeSingle();
  if (contactError) return json({ error: 'Could not read player contact' }, 500);
  const phone = String(contact?.mobile_phone || '').trim();
  if (!phone) return json({ error: 'Player has no mobile number' }, 400);

  const { data: usersPage, error: listUsersError } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listUsersError) return json({ error: 'Could not verify user status' }, 500);
  const alreadyRegistered = (usersPage.users || []).some((user) => String(user.email || '').trim().toLowerCase() === email);
  if (alreadyRegistered) return json({ error: 'Already invited or registered' }, 409);

  const { data: existingInvites, error: existingInviteError } = await serviceClient
    .from('user_invitations')
    .select('id,email,status')
    .ilike('email', email)
    .in('status', ['pending', 'accepted']);
  if (existingInviteError) return json({ error: 'Could not verify invitation status' }, 500);

  const staleAcceptedIds = (existingInvites || [])
    .filter((invite) => invite.status === 'accepted')
    .map((invite) => invite.id);
  if (staleAcceptedIds.length) {
    const { error: cleanupError } = await serviceClient
      .from('user_invitations')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .in('id', staleAcceptedIds)
      .eq('status', 'accepted');
    if (cleanupError) return json({ error: 'Could not retire stale invitation' }, 500);
  }

  const stillPending = (existingInvites || []).some((invite) => invite.status === 'pending');
  if (stillPending) return json({ error: 'Already invited or registered' }, 409);

  const { data: invitation, error: metadataError } = await serviceClient.from('user_invitations').insert({
    email,
    display_name: fullName || player.full_name,
    expected_role: 'player',
    status: 'pending',
    invited_by: caller.id,
    updated_at: new Date().toISOString()
  }).select('id').single();
  if (metadataError || !invitation) return json({ error: 'Invitation could not be prepared' }, 500);

  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { full_name: fullName || player.full_name } }
  });
  const inviteUrl = String(linkData?.properties?.action_link || '').trim();
  if (linkError || !inviteUrl) {
    await serviceClient.from('user_invitations').delete().eq('id', invitation.id).eq('status', 'pending');
    return json({ error: 'Invitation link could not be created' }, 400);
  }

  return json({ ok: true, phone, inviteUrl, playerName: player.full_name });
});
