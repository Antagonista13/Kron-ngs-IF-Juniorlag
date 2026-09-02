const test = require('node:test');
const assert = require('node:assert/strict');
const feedback = require('../coach-focus-feedback.js');

test('builds coach focus comment request with trimmed comment', () => {
  assert.deepEqual(
    feedback.buildCoachFocusCommentRequest('focus-1', '  Bra utveckling i ditt scanningarbete.  '),
    { p_focus_id: 'focus-1', p_comment: 'Bra utveckling i ditt scanningarbete.' }
  );
});

test('builds allowed coach follow-up status requests', () => {
  assert.deepEqual(feedback.buildCoachFocusStatusRequest('focus-1', 'following_up'), { p_focus_id: 'focus-1', p_follow_up_status: 'following_up' });
  assert.deepEqual(feedback.buildCoachFocusStatusRequest('focus-1', 'follow_up_complete'), { p_focus_id: 'focus-1', p_follow_up_status: 'follow_up_complete' });
});

test('retries mounting focus controls until coach context exists', () => {
  assert.equal(typeof feedback.shouldRetryCoachFocusMount, 'function');
  assert.equal(feedback.shouldRetryCoachFocusMount(false, false), true);
  assert.equal(feedback.shouldRetryCoachFocusMount(true, false), false);
  assert.equal(feedback.shouldRetryCoachFocusMount(false, true), false);
});
