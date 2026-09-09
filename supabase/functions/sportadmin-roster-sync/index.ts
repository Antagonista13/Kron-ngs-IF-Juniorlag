import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCES=[
  {label:'P2011',url:'https://www.kronangsif.se/grupp/?ID=260563'},
  {label:'P2009-2010',url:'https://www.kronangsif.se/grupp/?ID=224799'}
];
const SOURCE="sportadmin_junior";

type TriggeredBy='scheduled'|'admin';

function decodeEntities(value:string){return value.replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');}
function normalizeName(value:string){return value.normalize('NFKC').replace(/[“”]/g,'"').replace(/\s+/g,' ').trim().replace(/\s+"[^"]+"\s+/g,' ').toLocaleLowerCase('sv-SE');}
function cleanCandidateName(value:string){return decodeEntities(value).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().replace(/\s+\d{1,2}\s*år.*$/i,'').trim();}
function extractPlayerNames(html:string){
  const rosterStart=html.search(/<b>Spelare<\/b>/i);
  const rosterEnd=rosterStart<0?-1:html.slice(rosterStart+1).search(/<b>Ledare<\/b>/i);
  if(rosterStart>=0){
    const section=html.slice(rosterStart,rosterEnd>=0?rosterStart+1+rosterEnd:undefined);
    const names:string[]=[];
    for(const match of section.matchAll(/<div[^>]*class=['"]?userRow['"]?[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi)){
      const value=cleanCandidateName(match[1]);
      if(value&&value.length<=90&&value.split(' ').length>=2) names.push(value);
    }
    if(names.length) return [...new Map(names.map(name=>[normalizeName(name),name])).values()];
  }
  const cleaned=decodeEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d)>/gi,'\n')
    .replace(/<[^>]+>/g,' ');
  const lines=cleaned.split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const start=lines.findIndex(x=>/^spelare$/i.test(x));
  const end=start<0?-1:lines.findIndex((x,i)=>i>start&&/^ledare$/i.test(x));
  if(start<0) throw new Error('SportAdmin player section was not found');
  const body=lines.slice(start+1,end>start?end:undefined);
  const ignore=/^(ålder|beskrivning|mobil|moderklubb|smeknamn|truppen|bild|spelare)$/i;
  const names:string[]=[];
  for(const raw of body){
    const value=cleanCandidateName(raw);
    if(!value||ignore.test(value)||/^\d{1,2}\s*år$/i.test(value)) continue;
    if(value.length>90||value.split(' ').length<2) continue;
    if(!/^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž'’ -]+$/.test(value)) continue;
    names.push(value);
  }
  return [...new Map(names.map(name=>[normalizeName(name),name])).values()];
}

async function authorization(req:Request):Promise<{authorized:boolean;triggeredBy:TriggeredBy|null}>{
  const configuredSyncKey=Deno.env.get('SPORTADMIN_SYNC_KEY')||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  const suppliedSyncKey=req.headers.get('x-kronang-sync-key')||'';
  if(configuredSyncKey&&suppliedSyncKey&&suppliedSyncKey===configuredSyncKey)return{authorized:true,triggeredBy:'scheduled'};
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!token)return{authorized:false,triggeredBy:null};
  const authClient=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!);
  const {data:userData,error:userError}=await authClient.auth.getUser(token);
  if(userError||!userData.user)return{authorized:false,triggeredBy:null};
  const {data:profile}=await authClient.from('profiles').select('role,is_active').eq('id',userData.user.id).maybeSingle();
  return profile&&profile.role==='admin'&&profile.is_active===true?{authorized:true,triggeredBy:'admin'}:{authorized:false,triggeredBy:null};
}

Deno.serve(async req=>{
  if(req.method!=='POST') return new Response('Method not allowed',{status:405});
  const auth=await authorization(req);
  if(!auth.authorized||!auth.triggeredBy) return new Response('Unauthorized',{status:401});
  const triggeredBy=auth.triggeredBy;
  const startedAt=new Date().toISOString();
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try{
    const combined=new Map<string,{full_name:string,source_url:string}>();
    const sourceResults=[];
    for(const source of SOURCES){
      const response=await fetch(source.url,{headers:{'User-Agent':'KronangJuniorRosterSync/1.0'}});
      if(!response.ok) throw new Error(`${source.label}: SportAdmin returned ${response.status}`);
      const sourceNames=extractPlayerNames(await response.text());
      if(!sourceNames.length) throw new Error(`${source.label}: no player names found`);
      sourceResults.push({label:source.label,found:sourceNames.length});
      for(const full_name of sourceNames){
        const key=normalizeName(full_name);
        if(!combined.has(key)) combined.set(key,{full_name,source_url:source.url});
      }
    }
    const {data:players,error:playerError}=await client.from('players').select('id,full_name');
    if(playerError) throw playerError;
    const existing=new Map((players||[]).map((row:any)=>[normalizeName(row.full_name),row.id]));
    const now=new Date().toISOString();
    let imported=0;
    for(const [normalized_name,item] of combined){
      if(existing.has(normalized_name)) continue;
      const {data:created,error:createError}=await client.from('players').insert({full_name:item.full_name,is_active:true}).select('id').single();
      if(createError) throw createError;
      const playerId=created.id;
      existing.set(normalized_name,playerId);
      const {data:current,error:findError}=await client.from('sportadmin_player_candidates').select('id').eq('source',SOURCE).eq('normalized_name',normalized_name).maybeSingle();
      if(findError) throw findError;
      if(current){
        const {error}=await client.from('sportadmin_player_candidates').update({full_name:item.full_name,last_seen_at:now,source_url:item.source_url,status:'approved',created_player_id:playerId,reviewed_at:null,reviewed_by:null}).eq('id',current.id);
        if(error) throw error;
      }else{
        const {error}=await client.from('sportadmin_player_candidates').insert({full_name:item.full_name,normalized_name,source:SOURCE,source_url:item.source_url,status:'approved',first_seen_at:now,last_seen_at:now,created_player_id:playerId});
        if(error) throw error;
      }
      imported++;
    }
    const finishedAt=new Date().toISOString();
    const {error:runError}=await client.from('sportadmin_sync_runs').insert({started_at:startedAt,finished_at:finishedAt,status:'success',found:combined.size,imported,source:SOURCE,error_message:null,triggered_by:triggeredBy});
    if(runError) throw runError;
    return Response.json({ok:true,source:SOURCE,found:combined.size,imported,sources:sourceResults});
  }catch(error){
    console.error(error);
    const message=error instanceof Error?error.message:'Sync failed';
    try{
      await client.from('sportadmin_sync_runs').insert({started_at:startedAt,finished_at:new Date().toISOString(),status:'failure',found:0,imported:0,source:SOURCE,error_message:message,triggered_by:triggeredBy});
    }catch(recordError){console.error('Could not record failed sync run',recordError);}
    return Response.json({ok:false,message},{status:500});
  }
});

export { extractPlayerNames, normalizeName };
