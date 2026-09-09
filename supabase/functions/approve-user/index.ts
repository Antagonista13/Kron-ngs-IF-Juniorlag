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

  let body: { profileId?: string; role?: string; playerId?: string | null; displayTitle?: string | null };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const profileId = String(body.profileId || '').trim();
  const role = String(body.role || '').trim();
  const playerId = body.playerId ? String(body.playerId) : null;
  const displayTitle = body.displayTitle == null ? null : String(body.displayTitle);
  if (!profileId || !['player', 'parent', 'coach'].includes(role)) return json({ error: 'Invalid approval data' }, 400);

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: target, error: targetError } = await serviceClient.auth.admin.getUserById(profileId);
  const email = String(target?.user?.email || '').trim().toLowerCase();
  if (targetError || !email) return json({ error: 'Applicant email could not be found' }, 400);

  const { error: approveError } = await userClient.rpc('admin_approve_user', {
    p_profile_id: profileId,
    p_role: role,
    p_player_id: playerId,
    p_display_title: displayTitle
  });
  if (approveError) return json({ error: 'User could not be approved' }, 400);

  const redirectTo = Deno.env.get('APP_URL') || 'https://antagonista13.github.io/Kron-ngs-IF-Juniorlag/';
  const mailClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error: emailError } = await mailClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo }
  });

  return json({ ok: true, emailSent: !emailError, emailError: emailError ? 'Approval email could not be sent' : null });
});
