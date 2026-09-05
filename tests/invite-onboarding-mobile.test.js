const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');

test('invitation links force first-time password creation',()=>{
 const auth=fs.readFileSync('auth.js','utf8');
 assert.match(auth,/type=invite|type%3Dinvite|inviteCallback/i);
 assert.match(auth,/mode===?['"]invite['"]/i);
 assert.match(auth,/VÄLJ LÖSENORD|SPARA LÖSENORD/i);
 assert.match(auth,/updateUser\(\{password:/);
});

test('admin profile image list excludes pending or inactive accounts',()=>{
 const source=fs.readFileSync('admin-profile-images.js','utf8');
 assert.match(source,/is_active\s*!==\s*false/);
 assert.match(source,/role\s*!==\s*['"]pending['"]/);
});

test('admin form controls stay at iOS-safe 16px on mobile and page cannot overflow',()=>{
 const css=fs.readFileSync('admin-page.css','utf8');
 assert.match(css,/@media\(max-width:520px\)[\s\S]*\.admin-user-card select[\s\S]*font-size:\s*16px/i);
 assert.match(css,/@media\(max-width:520px\)[\s\S]*\.admin-invite-card input[\s\S]*font-size:\s*16px/i);
 assert.match(css,/@media\(max-width:520px\)[\s\S]*max-width:\s*100%/i);
});

test('invite/admin cache versions are bumped',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/auth\.js\?v=7/);
 assert.match(html,/admin-profile-images\.js\?v=2/);
 assert.match(html,/admin-page\.css\?v=6/);
});
