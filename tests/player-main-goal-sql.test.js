const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const sqlPath = 'supabase/migrations/202609070001_player_owned_main_goal_approval.sql';

function sql() {
  return fs.readFileSync(sqlPath, 'utf8').toLowerCase();
}

test('main goal migration defines explicit draft, pending review and approved states', () => {
  const text = sql();
  for (const token of ['draft', 'pending_review', 'approved']) {
    assert.match(text, new RegExp(token));
  }
});

test('player owns save and submit RPCs while leader owns review RPC', () => {
  const text = sql();
  for (const token of [
    'save_my_main_goal_draft',
    'submit_my_main_goal_for_review',
    'leader_review_player_main_goal'
  ]) assert.match(text, new RegExp(token));
  assert.match(text, /auth\.uid\(\)/);
  assert.match(text, /is_leader\(\)/);
});

test('approved replacement retains previous goal instead of deleting it', () => {
  const text = sql();
  assert.match(text, /status\s*=\s*'replaced'/);
  assert.doesNotMatch(text, /delete\s+from\s+public\.development_goals/);
});

test('leader review can approve or return with coach comment', () => {
  const text = sql();
  assert.match(text, /approved/);
  assert.match(text, /returned/);
  assert.match(text, /coach_comment/);
});
