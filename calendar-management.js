function stableExternalEventKey(activity){
  const uid=String(activity&&activity.uid||'').trim();
  if(uid)return'uid:'+uid;
  const source=[activity&&activity.startRaw,activity&&activity.endRaw,activity&&activity.summary,activity&&activity.location].map(v=>String(v||'').trim().toLowerCase()).join('|');
  let hash=2166136261;
  for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return'fp:'+(hash>>>0).toString(16).padStart(8,'0');
}
function filterHiddenActivities(activities,hiddenKeys){
  const hidden=hiddenKeys instanceof Set?hiddenKeys:new Set(hiddenKeys||[]);
  return(activities||[]).filter(activity=>!hidden.has(activity.externalKey||stableExternalEventKey(activity)));
}
async function getCalendarProfile(){
  if(!window.kronangSupabase)return null;
  const{data:s}=await window.kronangSupabase.auth.getSession();
  const user=s&&s.session&&s.session.user;
  if(!user)return null;
  const{data}=await window.kronangSupabase.from('profiles').select('id,role,status,is_active,team').eq('id',user.id).maybeSingle();
  return data||null;
}
function canHideCalendarForProfile(profile){return Boolean(profile&&['admin','coach'].includes(profile.role)&&(profile.status==='active'||profile.is_active===true));}
function canRestoreCalendarForProfile(profile){return Boolean(profile&&profile.role==='admin'&&(profile.status==='active'||profile.is_active===true));}
async function loadHiddenCalendarKeys(){
  if(!window.kronangSupabase)return new Set();
  const profile=await getCalendarProfile();
  if(!profile||!profile.team)return new Set();
  const{data,error}=await window.kronangSupabase.from('calendar_hidden_events').select('external_event_key').eq('team',profile.team);
  if(error){console.error('Kunde inte läsa dolda kalenderaktiviteter:',error);return new Set();}
  return new Set((data||[]).map(row=>row.external_event_key));
}
async function hideCalendarActivity(activity){
  if(!window.kronangSupabase)return false;
  const profile=await getCalendarProfile();
  if(!canHideCalendarForProfile(profile))return false;
  const payload={p_external_event_key:activity.externalKey||stableExternalEventKey(activity),p_title:activity.summary||'',p_start_at:activity.date?activity.date.toISOString():null,p_end_at:activity.endDate?activity.endDate.toISOString():null};
  const{error}=await window.kronangSupabase.rpc('hide_calendar_event',payload);
  if(error){console.error('Kunde inte dölja aktivitet:',error);return false;}
  return true;
}
async function listHiddenCalendarActivities(){
  if(!window.kronangSupabase)return[];
  const profile=await getCalendarProfile();
  if(!canRestoreCalendarForProfile(profile))return[];
  const{data,error}=await window.kronangSupabase.rpc('list_hidden_calendar_events');
  if(error){console.error('Kunde inte läsa dolda aktiviteter:',error);return[];}
  return data||[];
}
async function restoreCalendarActivity(id){
  if(!window.kronangSupabase)return false;
  const profile=await getCalendarProfile();
  if(!canRestoreCalendarForProfile(profile))return false;
  const{error}=await window.kronangSupabase.rpc('restore_calendar_event',{p_hidden_event_id:id});
  if(error){console.error('Kunde inte återställa aktivitet:',error);return false;}
  return true;
}
const api={stableExternalEventKey,filterHiddenActivities,loadHiddenCalendarKeys,hideCalendarActivity,listHiddenCalendarActivities,restoreCalendarActivity,canHideCalendarForProfile,canRestoreCalendarForProfile};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined')window.KronangCalendarManagement=api;
