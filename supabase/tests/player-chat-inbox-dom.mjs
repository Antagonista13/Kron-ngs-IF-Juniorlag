import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {JSDOM}=await import(process.env.JSDOM_MODULE||'jsdom');
async function app(role='player'){
 const dom=new JSDOM(readFileSync('index.html','utf8'),{runScripts:'outside-only',url:'https://example.org/Kron-ngs-IF-Juniorlag/'}),w=dom.window;
 let profile={id:'profile-1',full_name:'Testspelare',role,is_active:true},count=2,opened;
 w.kronangSupabase={auth:{getUser:async()=>({data:{user:profile?{id:profile.id}:null}})},from(){const q={select(){return q;},eq(){return q;},maybeSingle:async()=>({data:profile})};return q;}};
 w.KronangPlayerChatData={ownPlayerId:async()=> 'player-1',getUnreadCount:async id=>{assert.equal(id,'player-1');return count;},getUnreadSummary:async()=>({total:count,players:count?[{playerId:'player-1',name:'Testspelare',count}]:[]})};
 w.KronangPlayerChat={open:args=>{opened=args;}};
 w.eval(readFileSync('role-permissions.js','utf8'));w.eval(readFileSync('player-chat-inbox.js','utf8'));
 await w.KronangPlayerChatInbox.refresh();
 return{w,dom,setCount:n=>count=n,logout:()=>profile=null,getOpened:()=>opened};
}
test('player Home opens own conversation directly and unread badge disappears after reading',async()=>{
 const f=await app();try{const d=f.w.document,card=d.getElementById('homePlayerChatCard');
 assert.equal(card.hidden,false);assert.match(card.textContent,/2 olästa meddelanden/);
 const badge=d.querySelector('[data-player-chat-nav] [data-message-chat-badge]');assert.equal(badge.textContent,'2');assert.equal(badge.hidden,false);
 assert.equal(d.querySelector('[data-page="teamPage"] [data-team-chat-badge]')?.hidden??true,true);
 card.click();assert.deepEqual(JSON.parse(JSON.stringify(f.getOpened())),{playerId:'player-1',playerName:'Testspelare'});assert.equal(d.getElementById('playerChatInboxOverlay'),null);
 f.setCount(0);f.w.dispatchEvent(new f.w.CustomEvent('kronang:player-chat-read'));await new Promise(r=>setTimeout(r,0));assert.equal(card.hidden,true);assert.equal(badge.hidden,true);
 f.setCount(1);await f.w.KronangPlayerChatInbox.refresh();assert.match(card.textContent,/1 oläst meddelande/);
 f.logout();f.w.document.dispatchEvent(new f.w.CustomEvent('kronang:auth-signed-out'));assert.equal(card.hidden,true);assert.equal(badge.hidden,true);
 }finally{f.dom.window.close();}
});
test('leader retains player inbox on Home and shared Messages badge',async()=>{
 const f=await app('coach');try{const d=f.w.document;assert.match(d.getElementById('homePlayerChatCard').textContent,/spelare har skrivit/);assert.equal(d.querySelector('[data-message-chat-badge]').textContent,'2');d.getElementById('homePlayerChatCard').click();await new Promise(r=>setTimeout(r,0));assert.ok(d.getElementById('playerChatInboxOverlay'));assert.equal(d.querySelector('[data-player-chat-nav-badge]')?.hidden??true,true);}finally{f.dom.window.close();}
});
