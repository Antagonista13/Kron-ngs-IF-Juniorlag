import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM,VirtualConsole} from 'jsdom';

function loginUi(signInWithPassword) {
 const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',error=>errors.push(error));
 const dom=new JSDOM('<html><head></head><body></body></html>',{url:'https://example.test/',runScripts:'outside-only',virtualConsole});
 const w=dom.window, timers=[];
 w.setTimeout=(fn,ms)=>{const timer={fn,ms};timers.push(timer);return timer;};
 w.clearTimeout=timer=>{timer.cleared=true;};
 let authListener, loginHandler, calls=0;
 const add=w.EventTarget.prototype.addEventListener;
 w.EventTarget.prototype.addEventListener=function(type,fn,...rest){if(this.id==='loginButton'&&type==='click')loginHandler=fn;return add.call(this,type,fn,...rest);};
 w.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),signInWithPassword:args=>{calls++;return signInWithPassword(args);},onAuthStateChange:fn=>{authListener=fn;}}})};
 vm.runInContext(fs.readFileSync('auth.js','utf8'),dom.getInternalVMContext());
 const d=w.document, button=d.getElementById('loginButton');
 d.getElementById('loginEmail').value='admin@example.test';
 d.getElementById('loginPassword').value='test-only';
 return {dom,w,d,button,timers,authListener,errors,get calls(){return calls;},async login(){await tick();d.getElementById('loginPassword').value='test-only';return loginHandler();}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('unexpected sign-in rejection leaves a usable recovery action',async()=>{
 const ui=loginUi(async()=>{throw new Error('Connection closed');});
 try {await ui.login();assert.equal(ui.button.disabled,false);assert.equal(ui.button.textContent,'LADDA OM OCH FÖRSÖK IGEN');assert.match(ui.d.getElementById('loginMessage').textContent,/kunde inte slutföras/);} finally {ui.dom.window.close();}
});

test('a stalled sign-in exits LOGGAR IN and offers a page reload',async()=>{
 const ui=loginUi(()=>new Promise(()=>{}));
 try {
  const pending=ui.login();await tick();
  assert.equal(ui.button.textContent,'LOGGAR IN...');
  const deadline=ui.timers.find(t=>t.ms===15000);
  assert.ok(deadline,'sign-in must have a finite deadline');
  deadline.fn();await tick();
  assert.equal(ui.button.disabled,false);
  assert.equal(ui.button.textContent,'LADDA OM OCH FÖRSÖK IGEN');
  assert.match(ui.d.getElementById('loginMessage').textContent,/tog för lång tid/);
  assert.equal(ui.d.getElementById('authModeToggle').disabled,true);
  assert.equal(ui.d.getElementById('forgotPasswordButton').disabled,true);
 } finally {ui.dom.window.close();}
});

test('successful sign-in hides the form and cancels the deadline',async()=>{
 const ui=loginUi(async()=>({error:null}));
 try {const pending=ui.login();await pending;assert.equal(ui.d.getElementById('loginScreen').style.display,'none');assert.ok(ui.timers.find(t=>t.ms===15000)?.cleared);} finally {ui.dom.window.close();}
});

test('late valid session opens the app after the deadline',async()=>{
 let resolve;
 const ui=loginUi(()=>new Promise(r=>{resolve=r;}));
 try {
  const pending=ui.login();await tick();
  ui.timers.find(t=>t.ms===15000).fn();await pending;
  ui.authListener('SIGNED_IN',{user:{id:'admin'}});
  resolve({error:null});await tick();
  assert.equal(ui.d.getElementById('loginScreen').style.display,'none');
  assert.equal(ui.d.body.classList.contains('login-locked'),false);
  assert.equal(ui.d.getElementById('forgotPasswordButton').disabled,false);
 } finally {ui.dom.window.close();}
});

test('invalid credentials permit another attempt with a correct error',async()=>{
 const ui=loginUi(async()=>({error:{code:'invalid_credentials'}}));
 try {await ui.login();assert.equal(ui.button.disabled,false);assert.equal(ui.button.textContent,'LOGGA IN');assert.equal(ui.d.getElementById('loginMessage').textContent,'Fel e-post eller lösenord.');assert.equal(ui.d.getElementById('loginPassword').value,'');} finally {ui.dom.window.close();}
});

test('service failures are not labelled as an incorrect password',async()=>{
 const ui=loginUi(async()=>({error:{code:'unexpected_failure'}}));
 try {await ui.login();assert.equal(ui.button.disabled,false);assert.match(ui.d.getElementById('loginMessage').textContent,/Kunde inte logga in/);} finally {ui.dom.window.close();}
});

test('recovery action requests a reload without issuing a second sign-in',async()=>{
 const ui=loginUi(()=>new Promise(()=>{}));
 try {
  const pending=ui.login();await tick();ui.timers.find(t=>t.ms===15000).fn();await pending;
  ui.button.click();await tick();
  assert.equal(ui.calls,1);
  // JSDOM reports attempted navigation instead of actually replacing the test page.
  assert.ok(ui.errors.some(error=>/navigation/.test(error.message)));
 } finally {ui.dom.window.close();}
});

test('auth event success stays open when the sign-in promise stalls',async()=>{
 const ui=loginUi(()=>new Promise(()=>{}));
 try {
  const pending=ui.login();await tick();ui.authListener('SIGNED_IN',{user:{id:'admin'}});
  ui.timers.find(t=>t.ms===15000).fn();await pending;
  assert.equal(ui.d.getElementById('loginScreen').style.display,'none');
  assert.equal(ui.d.getElementById('loginMessage').textContent,'');
 } finally {ui.dom.window.close();}
});
