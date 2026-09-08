const fs = require('fs');
const css = fs.readFileSync('player-profile-redesign.css', 'utf8');

if (!/#profilePage #playerProfileHero h2\{[^}]*font-family:system-ui,-apple-system,"Segoe UI",sans-serif/.test(css)) {
  throw new Error('Player profile name should use a strong sans-serif app font');
}
if (!/#profilePage #playerProfileHero h2\{[^}]*font-weight:800/.test(css)) {
  throw new Error('Player profile name should be bold and sporty');
}
if (/Segoe Script|Brush Script MT|cursive/.test(css)) {
  throw new Error('Player profile name must not use script/cursive typography');
}
console.log('player name typography ok');
