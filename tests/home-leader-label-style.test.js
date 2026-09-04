const fs = require('fs');
const assert = require('assert');

const css = fs.readFileSync('home-player-header.css', 'utf8');
const roleStyle = css.match(/\.home-player-role-label\{([^}]*)\}/);
assert.ok(roleStyle, 'leader role label style should exist');
assert.ok(roleStyle[1].includes('overflow:visible'), 'leader role label must not be clipped by the circular portrait');
assert.ok(roleStyle[1].includes('background:'), 'leader role label should have a gold brush/ribbon background for contrast');
assert.ok(roleStyle[1].includes('z-index:'), 'leader role label should render above the portrait');
assert.ok(css.includes('.home-player-avatar.has-role-label{overflow:visible}'), 'leader portrait should allow the role label to extend outside the circle');
assert.ok(css.includes('.home-player-avatar.has-role-label img{border-radius:50%}'), 'portrait image should remain circular when overflow is opened');
console.log('home leader label style tests passed');
