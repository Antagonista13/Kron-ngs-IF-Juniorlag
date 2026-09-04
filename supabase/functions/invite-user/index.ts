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
  if (!supabaseUrl || !anonKey) return json({ error: 'Server configuration missing' }, 500);

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

  let body: { email?: string; fullName?: string; expectedRole?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.fullName || '').trim();
  const expectedRole = String(body.expectedRole || '').trim();
  const allowedExpectedRoles = ['', 'player', 'parent', 'coach'];
  if (!/^\S+@\S+\.\S+$/.test(email) || !fullName || !allowedExpectedRoles.includes(expectedRole)) {
    return json({ error: 'Invalid invitation data' }, 400);
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!serviceRoleKey) return json({ error: 'Server configuration missing' }, 500);
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: existingInvites, error: existingInviteError } = await serviceClient
    .from('user_invitations')
    .select('id,email,status')
    .ilike('email', email)
    .in('status', ['pending', 'accepted'])
    .limit(1);
  if (existingInviteError) return json({ error: 'Could not verify invitation status' }, 500);
  if (existingInvites && existingInvites.length) return json({ error: 'Already invited or registered' }, 409);

  const { data: usersPage, error: listUsersError } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listUsersError) return json({ error: 'Could not verify user status' }, 500);
  const alreadyRegistered = (usersPage.users || []).some((user) => String(user.email || '').trim().toLowerCase() === email);
  if (alreadyRegistered) return json({ error: 'Already invited or registered' }, 409);

  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName }
  });
  if (inviteError) return json({ error: 'Invitation could not be sent' }, 400);

  const { error: metadataError } = await serviceClient.from('user_invitations').insert({
    email,
    display_name: fullName,
    expected_role: expectedRole || null,
    status: 'pending',
    invited_by: caller.id,
    updated_at: new Date().toISOString()
  });
  if (metadataError) return json({ error: 'Invitation sent but metadata could not be saved' }, 500);

  return json({ ok: true });
});
