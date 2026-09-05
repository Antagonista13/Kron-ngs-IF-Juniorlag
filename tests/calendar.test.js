const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stableExternalEventKey,filterHiddenActivities,filterCurrentOrFutureActivities,escapeCalendarHtml}=require('../calendar-management.js');

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

test('completed activities are removed while ongoing and future activities remain',()=>{
 const now=new Date('2026-09-05T14:00:00+02:00');
 const completed={summary:'Domare',date:new Date('2026-09-05T10:00:00+02:00'),endDate:new Date('2026-09-05T11:00:00+02:00')};
 const ongoing={summary:'Träning',date:new Date('2026-09-05T13:30:00+02:00'),endDate:new Date('2026-09-05T15:00:00+02:00')};
 const future={summary:'Match',date:new Date('2026-09-06T12:00:00+02:00'),endDate:new Date('2026-09-06T14:00:00+02:00')};
 assert.deepEqual(filterCurrentOrFutureActivities([completed,ongoing,future],now),[ongoing,future]);
});

test('activity without end time stops being current at its start time',()=>{
 const now=new Date('2026-09-05T14:00:00+02:00');
 const started={summary:'Domare',date:new Date('2026-09-05T11:00:00+02:00'),endDate:null};
 const future={summary:'Träning',date:new Date('2026-09-05T18:00:00+02:00'),endDate:null};
 assert.deepEqual(filterCurrentOrFutureActivities([started,future],now),[future]);
});

test('escapes external calendar text before html rendering',()=>{
 assert.equal(escapeCalendarHtml('<img src=x onerror=alert(1)> & "x"'),'&lt;img src=x onerror=alert(1)&gt; &amp; &quot;x&quot;');
});

test('calendar management uses server RPCs and never writes to the external calendar source',()=>{
 const js=fs.readFileSync('calendar-management.js','utf8').toLowerCase();
 assert.doesNotMatch(js,/sportadmin.*(delete|update|post|put|patch)/);
 assert.match(js,/list_calendar_hidden_keys/);
 assert.match(js,/hide_calendar_event/);
 assert.match(js,/restore_calendar_event/);
 assert.doesNotMatch(js,/from\('calendar_hidden_events'\)\.select/);
});

test('calendar migration grants hide to leaders, key-read to active roles and full restore/list only to admin',()=>{
 const sql=fs.readFileSync('supabase/migrations/202609040019_calendar_hidden_events.sql','utf8').toLowerCase();
 assert.match(sql,/calendar_hidden_events/);
 assert.match(sql,/list_calendar_hidden_keys/);
 assert.match(sql,/hide_calendar_event/);
 assert.match(sql,/restore_calendar_event/);
 assert.match(sql,/list_hidden_calendar_events/);
 assert.match(sql,/role not in \('admin','coach'\)/);
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
 assert.match(runtime,/filterCurrentOrFutureActivities/);
 assert.match(runtime,/escapeCalendarHtml/);
 assert.match(runtime,/loadNextActivityHome/);
});

test('calendar 2.0 assets load exactly once around the legacy calendar script',()=>{
 const html=fs.readFileSync('index.html','utf8');
 for(const asset of ['calendar-management.js?v=2','calendar-runtime.js?v=3','calendar-management.css?v=1']) assert.equal(html.split(asset).length-1,1);
 assert.ok(html.indexOf('calendar-management.js?v=2')<html.indexOf('script.js?v=9'));
 assert.ok(html.indexOf('script.js?v=9')<html.indexOf('calendar-runtime.js?v=3'));
});
