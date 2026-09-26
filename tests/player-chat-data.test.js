const test=require('node:test');const assert=require('node:assert/strict');const P=require('../role-permissions.js');
test('player chat role gates allow player own chat and leaders',()=>{assert.equal(P.canUseOwnPlayerChat('player'),true);assert.equal(P.canUseOwnPlayerChat('admin'),false);assert.equal(P.canUsePlayerChatAsLeader('admin'),true);assert.equal(P.canUsePlayerChatAsLeader('coach'),true);});
test('player chat role gates deny parent pending and unknown',()=>{for(const r of ['parent','pending','wat']){assert.equal(P.canUseOwnPlayerChat(r),false);assert.equal(P.canUsePlayerChatAsLeader(r),false);}});
\nconst test=require('node:test');const assert=require('node:assert/strict');const D=require('../player-chat-data.js');
test('chat trims valid text',()=>assert.deepEqual(D.validateMessage('  Bra jobbat!  '),{ok:true,body:'Bra jobbat!'}));
test('chat rejects empty text',()=>assert.equal(D.validateMessage('   ').ok,false));
test('chat rejects messages over 2000 chars',()=>assert.equal(D.validateMessage('x'.repeat(2001)).ok,false));
