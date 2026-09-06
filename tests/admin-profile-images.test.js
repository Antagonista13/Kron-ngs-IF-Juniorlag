const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('admin-profile-images.js','utf8');

test('admin profile image section manages every app account through the shared picker',()=>{
 assert.match(source,/admin_list_users/);
 assert.match(source,/openAdminProfileImagePicker/);
 assert.match(source,/targetType:'profile'/);
 assert.match(source,/avatar_url/);
 assert.match(source,/PROFILBILDER/);
});

test('profile image rows are deduplicated and sorted alphabetically by name',()=>{
 assert.match(source,/new Map\(/);
 assert.match(source,/localeCompare\([^)]*'sv'/);
});

test('admin compact user assets are cache-busted after behavior changes',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(source,/admin-compact-users\.css\?v=2/);
 assert.match(source,/admin-compact-users\.js\?v=3/);
 assert.match(html,/admin-profile-images\.js\?v=3/);
 assert.match(html,/leader-tools-profile\.css\?v=7/);
});
