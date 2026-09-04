const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const sqlPath = 'supabase/migrations/202609040011_player_development_workflow.sql';
const bidirectionalPath = 'supabase/migrations/202609040012_bidirectional_development_notifications.sql';

test('migration defines development workflow entities and RPCs', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8').toLowerCase();
  for (const token of [
    'create table if not exists public.development_entries',
    'create table if not exists public.development_goal_proposals',
    'create table if not exists public.development_notifications',
    'leader_create_development_entry',
    'leader_propose_development_goal',
    'player_respond_goal_proposal',
    'mark_development_notification_read'
  ]) assert.ok(sql.includes(token), `missing ${token}`);
});

test('workflow rows use roster player ids while accepted goals bridge through profile_id', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8').toLowerCase();
  assert.match(sql, /player_id uuid not null references public\.players\(id\)/);
  assert.match(sql, /profile_id/);
  assert.match(sql, /development_goals/);
  assert.match(sql, /status = 'replaced'/);
});

test('migration constrains visibility and proposal status', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  for (const value of ['player_visible', 'leaders_only', 'pending', 'accepted', 'rejected']) assert.match(sql, new RegExp(value));
});

test('migration contains role-aware RLS and notifications never expose parent development access', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8').toLowerCase();
  assert.match(sql, /enable row level security/);
  assert.match(sql, /is_leader\(\)/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.doesNotMatch(sql, /role\s*=\s*'parent'.*development_entries/s);
});

test('leader entry RPC requires comment and only player-visible entries notify', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8').toLowerCase();
  assert.match(sql, /length\(btrim\(p_comment\)\)/);
  assert.match(sql, /p_visibility = 'player_visible'/);
});

test('2.0 migration notifies active leaders about player-owned development changes', () => {
  const sql = fs.readFileSync(bidirectionalPath, 'utf8').toLowerCase();
  for (const token of ['player_goal_changed', 'player_focus_changed', 'player_self_assessment_changed']) {
    assert.match(sql, new RegExp(token));
  }
  assert.match(sql, /role in \('admin','coach'\)/);
  assert.match(sql, /status = 'active'/);
  assert.match(sql, /players/);
  assert.match(sql, /profile_id/);
  assert.doesNotMatch(sql, /role in \([^)]*'parent'/);
});

test('2.0 notification source identity prevents duplicate unread events', () => {
  const sql = fs.readFileSync(bidirectionalPath, 'utf8').toLowerCase();
  assert.match(sql, /source_key/);
  assert.match(sql, /unique/);
  assert.match(sql, /where read_at is null/);
  assert.match(sql, /recipient_profile_id = auth\.uid\(\)/);
});
