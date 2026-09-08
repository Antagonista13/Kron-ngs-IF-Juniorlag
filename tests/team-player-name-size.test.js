const fs=require('fs');
const source=fs.readFileSync('player-public-profile-v2.js','utf8');
const match=source.match(/\.player-public-profile-signature\{[^}]*font-size:(\d+)px/);
if(!match) throw new Error('Could not find team player profile name size');
if(Number(match[1])<41) throw new Error(`Expected larger team player name (>=41px), got ${match[1]}px`);
console.log('team player name size ok');
