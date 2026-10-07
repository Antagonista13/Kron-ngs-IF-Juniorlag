import {createRequire} from 'node:module';import {createECDH,randomBytes} from 'node:crypto';import {test} from 'node:test';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),runtimeRequire=process.env.PUSH_RUNTIME?createRequire(process.env.PUSH_RUNTIME+'/package.json'):require;
const webpush=runtimeRequire('web-push'),ece=runtimeRequire('http_ece'),policy=require('../functions/kif-push/push-policy.js');
test('real Web Push encryption round-trips only generic content',()=>{
 const client=createECDH('prime256v1');client.generateKeys();const auth=randomBytes(16),keys=webpush.generateVAPIDKeys();
 const payload=policy.payload({id:'fixture',kind:'message',source_id:'11111111-1111-4111-8111-111111111111',unread_count:2,body:'Private chat content'});
 const request=webpush.generateRequestDetails({endpoint:'https://web.push.apple.com/encryption-fixture',keys:{p256dh:client.getPublicKey().toString('base64url'),auth:auth.toString('base64url')}},JSON.stringify(payload),{vapidDetails:{subject:'https://antagonista13.github.io/Kron-ngs-IF-Juniorlag/',publicKey:keys.publicKey,privateKey:keys.privateKey},contentEncoding:'aes128gcm',TTL:3600});
 assert.equal(request.method,'POST');assert.equal(request.headers['Content-Encoding'],'aes128gcm');assert.equal(request.body.includes(Buffer.from('Private chat content')),false);
 const decoded=JSON.parse(ece.decrypt(request.body,{version:'aes128gcm',privateKey:client,authSecret:auth}).toString());assert.deepEqual(decoded,payload);assert.equal(decoded.title,'Nytt meddelande i KIF');
});
