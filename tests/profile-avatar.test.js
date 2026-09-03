const assert = require('assert');
const { buildProfileAvatarModel } = require('../profile-avatar.js');
assert.deepStrictEqual(buildProfileAvatarModel({full_name:'Testspelare', avatar_url:'https://example.se/me.jpg'}), {name:'Testspelare', avatarUrl:'https://example.se/me.jpg'});
assert.deepStrictEqual(buildProfileAvatarModel({full_name:'Testspelare'}), {name:'Testspelare', avatarUrl:''});
console.log('profile avatar tests passed');
