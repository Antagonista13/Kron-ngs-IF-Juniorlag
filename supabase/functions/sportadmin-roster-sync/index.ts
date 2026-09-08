import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCES=[
  {label:'P2011',url:'https://www.kronangsif.se/grupp/?ID=260563'},
  {label:'P2009-2010',url:'https://www.kronangsif.se/grupp/?ID=224796'}
];
const SOURCE="sportadmin_junior";
const SYNC_KEY="sb_publishable_LueK_yc8XAevJC9zMMVktg_hRc1Zdac";

function decodeEntities(value:string){return value.replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');}
function normalizeName(value:string){return value.normalize('NFKC').replace(/[“”]/g,'"').replace(/\s+/g,' ').trim().replace(/\s+"[^"]+"\s+/g,' ').toLocaleLowerCase('sv-SE');}
function extractPlayerNames(html:string){
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
    let value=raw.replace(/\s+\d{1,2}\s*år.*$/i,'').trim();
    if(!value||ignore.test(value)||/^\d{1,2}\s*år$/i.test(value)) continue;
    if(value.length>90||value.split(' ').length<2) continue;
    if(!/^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž'’ -]+$/.test(value)) continue;
    names.push(value);
  }
  return [...new Map(names.map(name=>[normalizeName(name),name])).values()];
}
async function authorized(req:Request){
  if(req.headers.get('x-kronang-sync-key')===SYNC_KEY)return true;
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!token)return false;
  const authClient=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!);
  const {data:userData,error:userError}=await authClient.auth.getUser(token);
  if(userError||!userData.user)return false;
  const {data:profile}=await authClient.from('profiles').select('role,is_active').eq('id',userData.user.id).maybeSingle();
  return !!(profile&&profile.role==='admin'&&profile.is_active!==false);
}

Deno.serve(async req=>{
  if(req.method!=='POST') return new Response('Method not allowed',{status:405});
  if(!(await authorized(req))) return new Response('Unauthorized',{status:401});
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
    const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:players,error:playerError}=await client.from('players').select('full_name');
    if(playerError) throw playerError;
    const existing=new Set((players||[]).map((row:any)=>normalizeName(row.full_name)));
    const now=new Date().toISOString();
    let pending=0;
    for(const [normalized_name,item] of combined){
      if(existing.has(normalized_name)) continue;
      const {data:current,error:findError}=await client.from('sportadmin_player_candidates').select('id,status').eq('source',SOURCE).eq('normalized_name',normalized_name).maybeSingle();
      if(findError) throw findError;
      if(current){
        const {error}=await client.from('sportadmin_player_candidates').update({last_seen_at:now,source_url:item.source_url}).eq('id',current.id);
        if(error) throw error;
        if(current.status==='pending') pending++;
      }else{
        const {error}=await client.from('sportadmin_player_candidates').insert({full_name:item.full_name,normalized_name,source:SOURCE,source_url:item.source_url,status:'pending',first_seen_at:now,last_seen_at:now});
        if(error) throw error;
        pending++;
      }
    }
    return Response.json({ok:true,source:SOURCE,found:combined.size,pending,sources:sourceResults});
  }catch(error){
    console.error(error);
    return Response.json({ok:false,message:error instanceof Error?error.message:'Sync failed'},{status:500});
  }
});

export { extractPlayerNames, normalizeName };
