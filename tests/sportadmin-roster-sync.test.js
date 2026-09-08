const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
const migration=read('supabase/migrations/202609081500_sportadmin_roster_sync.sql');
const fn=read('supabase/functions/sportadmin-roster-sync/index.ts');
const ui=read('sportadmin-sync-admin.js');
if(!/sportadmin_player_candidates/i.test(migration)) throw new Error('candidate table missing');
if(!/status[^\n]*(pending|approved|dismissed)/i.test(migration)) throw new Error('candidate statuses missing');
if(!/approve_sportadmin_player_candidate/i.test(migration)) throw new Error('admin approval RPC missing');
if(!/dismiss_sportadmin_player_candidate/i.test(migration)) throw new Error('admin dismiss RPC missing');
if(!/cron\.schedule|pg_cron/i.test(migration)) throw new Error('daily schedule missing');
if(!/260563/.test(fn)) throw new Error('P2011 SportAdmin roster source missing');
if(!/players/i.test(fn)||!/full_name/i.test(fn)) throw new Error('existing player comparison missing');
if(/birth|birthday|phone|email|guardian|parent/i.test(fn)) throw new Error('SportAdmin sync must not import personal details beyond name');
if(!/pending/i.test(fn)) throw new Error('new SportAdmin players must remain pending');
if(!/SPORTADMIN/i.test(ui)||!/GODKÄNN/i.test(ui)||!/AVVISA/i.test(ui)) throw new Error('admin review UI missing');
if(!/sportadmin-roster-sync/.test(ui)) throw new Error('manual sync action missing');
console.log('sportadmin roster sync contract ok');
