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
 const sql=fs.readFileSync('supabase/migrations/202609040019_calendar_hidden_events.sql','utf8').toLowerCase();
 assert.match(sql,/calendar_hidden_events/);
 assert.match(sql,/hide_calendar_event/);
 assert.match(sql,/restore_calendar_event/);
 assert.match(sql,/list_hidden_calendar_events/);
 assert.match(sql,/role in \('admin','coach'\)/);
 assert.match(sql,/role = 'admin'/);
 assert.match(sql,/calendar_hidden_events_hidden_by_idx/);
 assert.doesNotMatch(sql,/sportadmin/);
});

test('calendar runtime shows leader hide and admin restore controls',()=>{
 const runtime=fs.readFileSync('calendar-runtime.js','utf8');
 assert.match(runtime,/DÖLJ AKTIVITET/);
 assert.match(runtime,/VISA DOLDA AKTIVITETER/);
 assert.match(runtime,/ÅTERSTÄLL/);
 assert.match(runtime,/filterHiddenActivities/);
 assert.match(runtime,/loadNextActivityHome/);
});

test('calendar 2.0 assets load exactly once around the legacy calendar script',()=>{
 const html=fs.readFileSync('index.html','utf8');
 for(const asset of ['calendar-management.js?v=1','calendar-runtime.js?v=1','calendar-management.css?v=1']) assert.equal(html.split(asset).length-1,1);
 assert.ok(html.indexOf('calendar-management.js?v=1')<html.indexOf('script.js?v=9'));
 assert.ok(html.indexOf('script.js?v=9')<html.indexOf('calendar-runtime.js?v=1'));
});
