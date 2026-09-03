const fs = require('fs');
const assert = require('assert');
const css = fs.readFileSync('team-posts.css', 'utf8');
assert.ok(css.includes('.team-weekly-focus'));
assert.ok(css.includes('background:linear-gradient'));
assert.ok(css.includes('color:#fff'));
console.log('team focus style tests passed');
