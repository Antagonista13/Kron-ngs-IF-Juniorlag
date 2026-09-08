const fs=require('fs');
const source=fs.readFileSync('player-public-profile-v2.js','utf8');
if(!/\.player-public-profile-role\{[^}]*font-size:14px/.test(source)) throw new Error('Expected compact 14px captain badge text');
if(!/\.player-public-profile-role\{[^}]*padding:7px 14px/.test(source)) throw new Error('Expected compact captain badge padding');
console.log('captain badge size ok');
