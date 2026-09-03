const fs = require('fs');
const assert = require('assert');
const css = fs.readFileSync('home-player-header.css', 'utf8');
assert.ok(css.includes('overflow-x:hidden') || css.includes('overflow-x:clip'));
assert.ok(css.includes('@media(max-width:560px)'));
assert.ok(css.includes('.home-dashboard::before'));
assert.ok(css.includes('inset-inline'));
console.log('home mobile layout tests passed');
