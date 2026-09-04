const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const staff=require('../team-staff.js');
const source=fs.readFileSync('team-staff.js','utf8');

test('staff editor request preserves free presentation role and description',()=>{
 const request=staff.buildStaffSaveRequest({id:'12',name:'Lisa',role:'Kioskansvarig',description:'Samordnar kiosken',phone:'070 1',email:'lisa@example.se',avatarUrl:'',sortOrder:'40'});
 assert.deepEqual(request,{p_id:12,p_display_name:'Lisa',p_staff_role:'Kioskansvarig',p_description:'Samordnar kiosken',p_phone:'070 1',p_email:'lisa@example.se',p_avatar_url:'',p_sort_order:40});
});

test('new staff receives a distinct order after the current last person',()=>{
 assert.equal(staff.nextStaffSortOrder([]),10);
 assert.equal(staff.nextStaffSortOrder([{sortOrder:10},{sortOrder:40},{sortOrder:20}]),50);
});

test('admin staff ui has explicit edit add remove and reorder actions',()=>{
 assert.match(source,/REDIGERA STAB/);
 assert.match(source,/LÄGG TILL PERSON/);
 assert.match(source,/admin_remove_team_staff/);
 assert.match(source,/admin_reorder_team_staff/);
 assert.match(source,/confirm\(/);
});

test('staff invite supports choosing coach or parent access',()=>{
 assert.equal(staff.normalizeStaffInviteRole('coach'),'coach');
 assert.equal(staff.normalizeStaffInviteRole('parent'),'parent');
 assert.equal(staff.normalizeStaffInviteRole('admin'),'coach');
 assert.deepEqual(staff.buildStaffInviteRequest({name:' Test Testsson ',email:' TEST@example.com '},'parent'),{fullName:'Test Testsson',email:'test@example.com',expectedRole:'parent'});
 assert.deepEqual(staff.buildStaffInviteRequest({name:' Test Testsson ',email:' TEST@example.com '},'coach'),{fullName:'Test Testsson',email:'test@example.com',expectedRole:'coach'});
 assert.match(source,/Behörighet/);
 assert.match(source,/<option value="coach">Ledare<\/option>/);
 assert.match(source,/<option value="parent">Förälder<\/option>/);
});

test('invite is only offered for a new email address',()=>{
 assert.equal(staff.canOfferStaffInvite({email:'test@example.com'},[]),true);
 assert.equal(staff.canOfferStaffInvite({email:''},[]),false);
 assert.equal(staff.canOfferStaffInvite({email:'test@example.com'},[{email:'TEST@example.com'}]),false);
 assert.match(source,/Bjud in till appen/);
 assert.match(source,/functions\.invoke\('invite-user'/);
});
