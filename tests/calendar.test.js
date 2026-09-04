const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stableExternalEventKey,filterHiddenActivities}=require('../calendar-management.js');

test('uses SportAdmin UID as stable external key when available',()=>{
 assert.equal(stableExternalEventKey({uid:'sportadmin-123',startRaw:'20260905T110000',summary:'Träning'}),'uid:sportadmin-123');
});

test('falls back to deterministic fingerprint without UID',()=>{
 const a=stableExternalEventKey({startRaw:'20260905T110000',endRaw:'20260905T123000',summary:'Träning',location:'Kronäng Arena'});
 const b=stableExternalEventKey({startRaw:'20260905T110000',endRaw:'20260905T123000',summary:'Träning',location:'Kronäng Arena'});
 assert.equal(a,b);
 assert.match(a,/^fp:/);
});

test('hidden external keys are removed before rendering',()=>{
 const activities=[{externalKey:'uid:a'},{externalKey:'uid:b'}];
 assert.deepEqual(filterHiddenActivities(activities,new Set(['uid:a'])),[{externalKey:'uid:b'}]);
});

test('calendar management never writes to the external calendar source',()=>{
 const js=fs.readFileSync('calendar-management.js','utf8').toLowerCase();
 assert.doesNotMatch(js,/sportadmin.*(delete|update|post|put|patch)/);
 assert.match(js,/hide_calendar_event/);
 assert.match(js,/restore_calendar_event/);
});

test('calendar migration grants hide to leaders and restore/list only to admin',()=>{
 const sql=fs.readFileSync('supabase/migrations/202609040018_calendar_hidden_events.sql','utf8').toLowerCase();
 assert.match(sql,/calendar_hidden_events/);
 assert.match(sql,/hide_calendar_event/);
 assert.match(sql,/restore_calendar_event/);
 assert.match(sql,/list_hidden_calendar_events/);
 assert.match(sql,/role in \('admin','coach'\)/);
 assert.match(sql,/role = 'admin'/);
 assert.doesNotMatch(sql,/sportadmin/);
});
