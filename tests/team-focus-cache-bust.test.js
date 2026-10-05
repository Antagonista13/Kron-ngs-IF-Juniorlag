const fs=require('node:fs');
const assertAssetVersion=require('./helpers/asset-version.cjs');
assertAssetVersion(fs.readFileSync('index.html','utf8'),'team-focus.js',5);
