const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const avatar=require('../profile-avatar.js');
const source=fs.readFileSync('profile-avatar.js','utf8');

test('profile image object path is stable and target scoped',()=>{
 assert.equal(avatar.buildProfileImageObjectPath('profile','abc','photo.JPG'),'profiles/abc/avatar.jpg');
 assert.equal(avatar.buildProfileImageObjectPath('staff',42,'portrait.png'),'staff/42/avatar.png');
});

test('admin image picker is mobile friendly and has square crop controls',()=>{
 assert.match(source,/accept=['"]image\/\*['"]/);
 assert.match(source,/type=['"]range['"]/);
 assert.match(source,/canvas/);
 assert.match(source,/admin_assign_profile_image/);
 assert.match(source,/admin_assign_staff_image/);
});
