const test=require('node:test');const assert=require('node:assert/strict');
const {
  hasUnreadDevelopmentNotifications,
  notificationMatchesEntity,
  groupUnreadByPlayer,
  unreadLabelForEvent,
  unreadNotificationForEntity,
  homeGoalProposalAlertModel
}=require('../development-notifications.js');

test('red dot derives only from unread items',()=>{
  assert.equal(hasUnreadDevelopmentNotifications([{id:'1',read_at:null}]),true);
  assert.equal(hasUnreadDevelopmentNotifications([{id:'1',read_at:'2026-09-04T12:00:00Z'}]),false);
});

test('notification matches its related development entity',()=>{
  assert.equal(notificationMatchesEntity({entity_type:'development_entry',entity_id:'e1'},'development_entry','e1'),true);
  assert.equal(notificationMatchesEntity({entity_type:'goal_proposal',entity_id:'g1'},'development_entry','g1'),false);
});

test('leader unread events are grouped by roster player',()=>{
  const grouped=groupUnreadByPlayer([
    {id:'n1',player_id:'p1',read_at:null},
    {id:'n2',player_id:'p1',read_at:null},
    {id:'n3',player_id:'p2',read_at:null},
    {id:'n4',player_id:'p2',read_at:'2026-09-04T12:00:00Z'}
  ]);
  assert.equal(grouped.get('p1').length,2);
  assert.equal(grouped.get('p2').length,1);
});

test('unread labels identify which side created the new information',()=>{
  assert.equal(unreadLabelForEvent('development_follow_up'),'NYTT FRÅN TRÄNAREN');
  assert.equal(unreadLabelForEvent('goal_proposal'),'NYTT FRÅN TRÄNAREN');
  assert.equal(unreadLabelForEvent('player_goal_changed'),'NYTT FRÅN SPELAREN');
  assert.equal(unreadLabelForEvent('player_focus_changed'),'NYTT FRÅN SPELAREN');
});

test('exact entity lookup returns only its own unread notification',()=>{
  const rows=[
    {id:'a',entity_type:'development_entry',entity_id:'e1',read_at:null},
    {id:'b',entity_type:'development_entry',entity_id:'e2',read_at:null}
  ];
  assert.equal(unreadNotificationForEntity(rows,'development_entry','e2').id,'b');
  assert.equal(unreadNotificationForEntity(rows,'development_entry','missing'),null);
});

test('home alert points players to an unread goal proposal',()=>{
  const model=homeGoalProposalAlertModel([
    {id:'n1',event_type:'development_follow_up',entity_type:'development_entry',entity_id:'e1',read_at:null},
    {id:'n2',event_type:'goal_proposal',entity_type:'goal_proposal',entity_id:'g1',read_at:null}
  ]);
  assert.equal(model.visible,true);
  assert.equal(model.text,'Du har ett nytt målförslag att svara på');
  assert.equal(model.entityId,'g1');
});
