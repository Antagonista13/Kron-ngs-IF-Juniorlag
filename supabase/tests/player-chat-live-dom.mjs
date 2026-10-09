import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {JSDOM}=await import(process.env.JSDOM_MODULE||'jsdom');
const settle=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));};
function fixture(){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 let rows=[],calls=0,fail=false,readFail=false,hold=null;const timers=new Map(),reads=[];let next=0;
 w.setInterval=fn=>{timers.set(++next,fn);return next;};w.clearInterval=id=>timers.delete(id);
 w.kronangSupabase={auth:{getUser:async()=>({data:{user:{id:'admin'}}})}};
 w.KronangPlayerChatData={listMessages:async()=>{calls++;if(hold)await hold;if(fail)throw new Error('offline');return rows.slice();},markConversationRead:async(id,ids)=>{if(readFail)throw new Error('receipt offline');reads.push(ids);},validateMessage:body=>({ok:true,body}),sendMessage:async()=>{}};
 w.console.error=()=>{};w.eval(readFileSync('player-chat.js','utf8'));
 return{w,timers,reads,add(id){rows.push({id,sender_profile_id:'player',body:'Svar '+id,created_at:new Date().toISOString(),sender:{role:'player'}});},calls:()=>calls,fail:v=>fail=v,readFail:v=>readFail=v,hold:p=>hold=p,async tick(){for(const fn of [...timers.values()])fn();await settle();},close:()=>w.close()};
}
test('open chat refreshes incoming messages and keeps draft without reload',async()=>{
 const f=fixture();try{await f.w.KronangPlayerChat.open({playerId:'p'});f.w.document.querySelector('textarea').value='Mitt utkast';f.add('m1');await f.tick();assert.match(f.w.document.querySelector('.player-chat-list').textContent,/Svar m1/);assert.equal(f.w.document.querySelector('textarea').value,'Mitt utkast');assert.deepEqual(Array.from(f.reads.at(-1)),['m1']);}finally{f.close();}
});
test('background chat neither fetches nor reads, focus catches up',async()=>{
 const f=fixture();try{await f.w.KronangPlayerChat.open({playerId:'p'});const calls=f.calls();Object.defineProperty(f.w.document,'hidden',{configurable:true,value:true});f.add('m1');await f.tick();assert.equal(f.calls(),calls);Object.defineProperty(f.w.document,'hidden',{configurable:true,value:false});f.w.dispatchEvent(new f.w.Event('focus'));await settle();assert.match(f.w.document.querySelector('.player-chat-list').textContent,/Svar m1/);}finally{f.close();}
});
test('close, replace and signout dispose refresh timers and old chat',async()=>{
 const f=fixture();try{await f.w.KronangPlayerChat.open({playerId:'p'});await f.w.KronangPlayerChat.open({playerId:'p2'});assert.equal(f.timers.size,1);f.w.document.querySelector('.player-chat-close').click();assert.equal(f.timers.size,0);await f.w.KronangPlayerChat.open({playerId:'p'});f.w.document.dispatchEvent(new f.w.CustomEvent('kronang:auth-signed-out'));assert.equal(f.w.document.getElementById('playerChatOverlay'),null);assert.equal(f.timers.size,0);}finally{f.close();}
});
test('transient refresh failure retains displayed messages and draft',async()=>{
 const f=fixture();try{f.add('m1');await f.w.KronangPlayerChat.open({playerId:'p'});f.w.document.querySelector('textarea').value='utkast';f.fail(true);await f.tick();assert.match(f.w.document.querySelector('.player-chat-list').textContent,/Svar m1/);assert.equal(f.w.document.querySelector('textarea').value,'utkast');}finally{f.close();}
});
test('in-flight refresh completed after close cannot mark messages read',async()=>{
 const f=fixture();try{await f.w.KronangPlayerChat.open({playerId:'p'});let release;f.hold(new Promise(r=>release=r));f.add('m1');for(const fn of f.timers.values())fn();await settle();const reads=f.reads.length;f.w.document.querySelector('.player-chat-close').click();release();await settle();assert.equal(f.reads.length,reads);}finally{f.close();}
});
test('read reconciliation marks only messages actually displayed',async()=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window;let inserted;
 w.kronangSupabase={auth:{getUser:async()=>({data:{user:{id:'admin'}}})},from(table){const q={select(){return q;},eq(){return q;},in(){return q;},neq(){return q;},insert:async payload=>{inserted=payload;return{};},then(resolve){resolve({data:table==='player_chat_conversations'?[{id:'c',player_id:'p'}]:table==='player_chat_messages'?[{id:'m1',conversation_id:'c'},{id:'m2',conversation_id:'c'}]:[]});}};return q;}};
 try{w.eval(readFileSync('player-chat-data.js','utf8'));await w.KronangPlayerChatData.markConversationRead('p',['m1']);assert.deepEqual(JSON.parse(JSON.stringify(inserted)),[{message_id:'m1',reader_profile_id:'admin'}]);}finally{w.close();}
});

test('receipt failure preserves initial conversation and retries unchanged messages',async()=>{
 const f=fixture();try{f.add('m1');f.readFail(true);await f.w.KronangPlayerChat.open({playerId:'p'});assert.match(f.w.document.querySelector('.player-chat-list').textContent,/Svar m1/);f.readFail(false);await f.tick();assert.deepEqual(Array.from(f.reads.at(-1)),['m1']);}finally{f.close();}
});
test('overlapping receipt batches do not lose the non-duplicate message read',async()=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window;const seen=new Set();let first=true;
 w.kronangSupabase={auth:{getUser:async()=>({data:{user:{id:'admin'}}})},from(table){const q={select(){return q;},eq(){return q;},in(){return q;},neq(){return q;},insert:async payload=>{if(first){first=false;seen.add('m1');return{error:{code:'23505'}};}if(payload.some(x=>seen.has(x.message_id)))return{error:{code:'23505'}};payload.forEach(x=>seen.add(x.message_id));return{};},then(resolve){resolve({data:table==='player_chat_conversations'?[{id:'c',player_id:'p'}]:table==='player_chat_messages'?[{id:'m1',conversation_id:'c'},{id:'m2',conversation_id:'c'}]:[]});}};return q;}};
 try{w.eval(readFileSync('player-chat-data.js','utf8'));await w.KronangPlayerChatData.markConversationRead('p',['m1','m2']);assert.deepEqual([...seen],['m1','m2']);}finally{w.close();}
});
