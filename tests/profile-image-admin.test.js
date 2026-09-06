const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const avatar=require('../profile-avatar.js');
const source=fs.readFileSync('profile-avatar.js','utf8');

test('profile image object path is target scoped and versioned when replacing an image',()=>{
 assert.equal(avatar.buildProfileImageObjectPath('profile','abc'),'profiles/abc/avatar.jpg');
 assert.equal(avatar.buildProfileImageObjectPath('staff',42),'staff/42/avatar.jpg');
 assert.equal(avatar.buildProfileImageObjectPath('player','p1'),'players/p1/avatar.jpg');
 assert.equal(avatar.buildProfileImageObjectPath('player','p1',1725632100123),'players/p1/avatar-1725632100123.jpg');
});

test('saving a replacement image uses a fresh object path and cleans up the previous object',()=>{
 assert.match(source,/buildProfileImageObjectPath\(targetType,targetId,Date\.now\(\)\)/);
 assert.match(source,/storage\.from\('profile-images'\)\.upload\(uploadPath,blob/);
 assert.match(source,/assignProfileImage\(targetType,targetId,uploadPath\)/);
 assert.match(source,/current&&current!==uploadPath/);
});

test('admin image picker is mobile friendly and has square crop controls',()=>{
 assert.match(source,/accept=['\"]image\/\*['\"]/);
 assert.match(source,/type=['\"]range['\"]/);
 assert.match(source,/canvas/);
 assert.match(source,/admin_assign_profile_image/);
 assert.match(source,/admin_assign_staff_image/);
 assert.match(source,/admin_assign_player_image/);
});
