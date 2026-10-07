import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
// @deno-types="npm:@types/web-push@3.6.4"
import webpush from 'npm:web-push@3.6.7';
import './push-policy.js';
const policy=(globalThis as any).KifPushPolicy;
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const cors={'Access-Control-Allow-Origin':'https://antagonista13.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
function reply(status:number,body:object){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});}
async function rpc(name:string,args:object={}){const {data,error}=await db.rpc(name,args);if(error){const failure=new Error('Push database request failed');(failure as any).code=error.code;throw failure;}return data;}
async function deliver(data:any,cfg:any){
 if(!policy.validEndpoint(data.endpoint))return {outcome:'failed',status:null};
 const request=webpush.generateRequestDetails({endpoint:data.endpoint,keys:{p256dh:data.p256dh,auth:data.auth}},JSON.stringify(policy.payload(data)),{vapidDetails:{subject:cfg.contact,publicKey:cfg.public_key,privateKey:cfg.private_key},TTL:3600,contentEncoding:'aes128gcm'});
 try{const response=await fetch(request.endpoint,{method:'POST',headers:request.headers,body:new Uint8Array(request.body).buffer,redirect:'error',signal:AbortSignal.timeout(10000)});await response.body?.cancel();return {outcome:policy.outcome(response.status),status:response.status};}catch{return {outcome:'retry',status:null};}
}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
 let stage='config';try{
 const cfg=await rpc('get_push_worker_config');
 const bearer=req.headers.get('Authorization')||'';
 if(new URL(req.url).pathname.endsWith('/test')){
  if(!bearer.startsWith('Bearer '))return reply(401,{error:'Unauthorized'});
  const {data:{user},error}=await db.auth.getUser(bearer.slice(7));if(error||!user)return reply(401,{error:'Unauthorized'});
  if(Number(req.headers.get('Content-Length')||0)>4096)return reply(413,{error:'Request too large'});
  const body=await req.json();if(typeof body.subscription_id!=='string'||!(/^[0-9a-f-]{36}$/i.test(body.subscription_id)))return reply(400,{error:'Invalid subscription'});
  const data=await rpc('get_push_test_subscription',{owner_id:user.id,subscription_id:body.subscription_id});if(!data)return reply(403,{error:'Notiser är inte aktiverade för ditt konto eller denna enhet.'});
  const result=await deliver(data,cfg);
  return result.outcome==='sent'?reply(200,{sent:true}):reply(502,{error:'Testnotisen kunde inte skickas.'});
 }
 if(!policy.authorizeWorker(bearer,cfg.worker_token))return reply(401,{error:'Unauthorized'});
 const command=await req.json().catch(()=>({}));
 if(command.action==='initialize'){
  if(cfg.public_key)return reply(409,{error:'Push keys already configured'});
  stage='initialize-keygen';const keys=webpush.generateVAPIDKeys();stage='initialize-storage';
  await rpc('configure_push_keys',{public_key:keys.publicKey,private_key:keys.privateKey,contact:'https://antagonista13.github.io/Kron-ngs-IF-Juniorlag/'});
  return reply(200,{configured:true});
 }
 if(!cfg.public_key||!cfg.private_key)return reply(503,{error:'Push configuration missing'});
 const jobs=await rpc('claim_push_jobs',{batch_size:20});let processed=0;
 // 10 jobs at once, each network request bounded to ten seconds; a bounded 20-job batch fits within the two-minute lease.
 for(let start=0;start<jobs.length;start+=10)await Promise.all(jobs.slice(start,start+10).map(async(job:any)=>{
  let result={outcome:'skipped',status:null as number|null};
  try{const data=await rpc('get_push_delivery',{job_id:job.id,token:job.lease_token});if(data)result=await deliver(data,cfg);}catch{result={outcome:'retry',status:null};}
  try{await rpc('finish_push_job',{job_id:job.id,token:job.lease_token,outcome:result.outcome,http_status:result.status});processed++;}catch{/* Expired leases are retried by the next scheduled run. */}
 }));
 return reply(200,{processed});
 }catch(error){console.error('KIF push failure',JSON.stringify({stage,code:(error as any)?.code||'runtime',type:(error as any)?.name||'Error'}));return reply(500,{error:'Push request failed'});}
});
