const fs=require('fs');
const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
if(!/leader-tools-profile\.js\?v=6/.test(html)){
  throw new Error('index.html must load leader-tools-profile.js?v=6 so Safari receives the roster-button implementation');
}
console.log('leader tools cache version test passed');
