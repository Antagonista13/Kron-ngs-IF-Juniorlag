const assert = require('assert');
const admin = require('../admin-account-linking.js');

assert.strictEqual(admin.accountLinkLabel('player'), 'Koppla kontot till');
assert.strictEqual(admin.accountLinkHelp('player'), 'Välj personen i spelartruppen som detta konto tillhör.');
const players = [{ id:'1', full_name:'Emil Bergqvist' },{ id:'2', full_name:'Emil Andersson' },{ id:'3', full_name:'Anna Bergqvist' }];
assert.strictEqual(admin.suggestPlayerForAccount('Emil Bergqvist', players), '1');
assert.strictEqual(admin.suggestPlayerForAccount('emil bergqvist', players), '1');
assert.strictEqual(admin.suggestPlayerForAccount('Emil', players), '');
assert.strictEqual(admin.suggestPlayerForAccount('', players), '');
console.log('admin account linking UX tests passed');
