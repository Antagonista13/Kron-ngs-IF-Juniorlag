const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const archive = require('../player-roster-archive.js');

const migrationPath = 'supabase/migrations/202609240001_admin_remove_player.sql';

test('admin player removal clearly preserves SportAdmin', () => {
  assert.match(archive.PLAYER_ARCHIVE_CONFIRM_TEXT, /SportAdmin påverkas inte/);
  assert.match(archive.PLAYER_ARCHIVE_CONFIRM_TEXT, /historik sparas/);
  assert.equal(archive.canArchivePlayer('admin', true), true);
  assert.equal(archive.canArchivePlayer('coach', true), false);
});

test('admin player removal archives roster and disables linked app access', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();
  assert.match(sql, /update public\.players[\s\S]*is_active = false/);
  assert.match(sql, /update public\.profiles[\s\S]*is_active = false/);
  assert.match(sql, /v_profile_id/);
});

test('admin player removal prevents immediate SportAdmin reactivation and restricts RPC', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();
  assert.match(sql, /sportadmin_player_presence/);
  assert.match(sql, /'kept'/);
  assert.match(sql, /auth\.uid\(\) is null/);
  assert.match(sql, /revoke all on function public\.admin_archive_player\(uuid\) from public, anon/);
  assert.match(sql, /grant execute on function public\.admin_archive_player\(uuid\) to authenticated/);
});
