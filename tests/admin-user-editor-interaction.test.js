const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');

test('admin users have a separate editor outside the dynamically reorganized card list',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const js=fs.readFileSync('admin-page.js','utf8');
  assert.match(html,/id="adminUserEditDialog"/);
  assert.match(html,/id="adminUserEditRole"/);
  assert.match(html,/id="adminUserEditTitle"/);
  assert.match(html,/id="adminUserEditDescription"/);
  assert.match(js,/data-action="open-editor"/);
  assert.match(js,/adminUserEditDialog/);
});
