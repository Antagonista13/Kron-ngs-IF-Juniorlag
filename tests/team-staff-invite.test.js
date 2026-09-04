const assert=require('assert');
const staff=require('../team-staff.js');
assert.deepStrictEqual(staff.buildStaffInviteRequest({name:' Test Testsson ',email:' TEST@example.com '}),{fullName:'Test Testsson',email:'test@example.com',expectedRole:'coach'});
assert.strictEqual(staff.canOfferStaffInvite({email:'test@example.com'},[]),true);
assert.strictEqual(staff.canOfferStaffInvite({email:''},[]),false);
assert.strictEqual(staff.canOfferStaffInvite({email:'test@example.com'},[{email:'TEST@example.com'}]),false);
console.log('team staff invite tests passed');
