const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('index.html','utf8');
assert.ok(html.includes('team-focus.js?v=4'), 'index.html must load the new team-focus.js version so iPhone Safari does not keep the old non-clickable code');
console.log('team focus cache bust test passed');
