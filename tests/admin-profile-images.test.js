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
