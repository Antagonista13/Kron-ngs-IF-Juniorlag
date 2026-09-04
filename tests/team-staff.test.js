const assert = require('assert');
const { buildTeamStaffMember } = require('../team-staff.js');

const coach = buildTeamStaffMember({id:'staff-1', display_name:'Anna', staff_role:'Huvudtränare', description:'Ansvarar för träning och match.', phone:'0701234567', email:'anna@example.se', avatar_url:'https://example.se/a.jpg', sort_order:2});
assert.strictEqual(coach.id, 'staff-1');
assert.strictEqual(coach.name, 'Anna');
assert.strictEqual(coach.role, 'Huvudtränare');
assert.strictEqual(coach.description, 'Ansvarar för träning och match.');
assert.strictEqual(coach.sortOrder, 2);
assert.strictEqual(coach.phoneHref, 'tel:0701234567');
assert.strictEqual(coach.emailHref, 'mailto:anna@example.se');

const noAccount = buildTeamStaffMember({id:'staff-2', display_name:'Bo', staff_role:'Kioskansvarig', description:'Samordnar kiosken.', profile_id:null});
assert.strictEqual(noAccount.name, 'Bo');
assert.strictEqual(noAccount.role, 'Kioskansvarig');
assert.strictEqual(noAccount.description, 'Samordnar kiosken.');
assert.strictEqual(noAccount.phoneHref, '');
assert.strictEqual(noAccount.emailHref, '');
console.log('team staff tests passed');
