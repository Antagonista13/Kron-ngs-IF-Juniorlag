const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const focus = require('../player-focus-edit.js');

test('player can build an update request for an active focus', () => {
  assert.equal(typeof focus.buildFocusUpdateRequest, 'function');
  assert.deepEqual(
    focus.buildFocusUpdateRequest('focus-1', ' technique ', ' bättre första touch ', ' möt bollen '),
    {
      p_focus_id: 'focus-1',
      p_development_area: 'technique',
      p_focus_text: 'bättre första touch',
      p_attention_text: 'möt bollen'
    }
  );
});

test('active focus UI offers edit action and uses protected update RPC', () => {
  const js = fs.readFileSync('player-focus-edit.js', 'utf8');
  const loader = fs.readFileSync('role-permissions.js', 'utf8');
  assert.match(js, /ÄNDRA FOKUS/);
  assert.match(js, /update_my_active_development_focus/);
  assert.match(js, /renderEditFocusForm/);
  assert.match(loader, /player-focus-edit\.js\?v=1/);
});

test('migration only updates the signed-in players active focus', () => {
  const sql = fs.readFileSync('supabase/migrations/202609090030_update_my_active_focus.sql', 'utf8');
  assert.match(sql, /create or replace function public\.update_my_active_development_focus/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /player_id\s*=\s*v_user_id/i);
  assert.match(sql, /lifecycle_status\s*=\s*'active'/i);
  assert.match(sql, /grant execute[\s\S]*to authenticated/i);
});
