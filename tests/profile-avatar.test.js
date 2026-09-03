const assert = require('assert');
const { buildProfileAvatarModel, profileFallbackIcon } = require('../profile-avatar.js');
assert.deepStrictEqual(buildProfileAvatarModel({full_name:'Testspelare', avatar_url:'https://example.se/me.jpg'}), {name:'Testspelare', avatarUrl:'https://example.se/me.jpg'});
assert.deepStrictEqual(buildProfileAvatarModel({full_name:'Testspelare'}), {name:'Testspelare', avatarUrl:''});
const fallback = profileFallbackIcon();
assert.ok(fallback.includes('fill="none"'), 'profile fallback svg must not fill black shapes');
assert.ok(fallback.includes('stroke="currentColor"'), 'profile fallback svg should inherit the white avatar color');
assert.ok(fallback.includes('stroke-width="1.55"'), 'profile fallback svg should match the home line icon weight');
console.log('profile avatar tests passed');
