const assert=require('assert');
const fs=require('fs');
const roster=require('../player-roster.js');
assert.strictEqual(roster.getRosterAvatarPlaceholder('Emil Bergqvist'),'BILD KOMMER');
assert.strictEqual(roster.getRosterAvatarPlaceholder(''),'BILD KOMMER');
const js=fs.readFileSync('player-roster.js','utf8');
assert.ok(js.includes("avatar.classList.add('is-placeholder')"),'missing roster images should receive placeholder styling');
assert.ok(js.includes("placeholder.textContent=getRosterAvatarPlaceholder(p.name)"),'missing roster images should render Bild kommer text');
console.log('profile image coming placeholder tests passed');
