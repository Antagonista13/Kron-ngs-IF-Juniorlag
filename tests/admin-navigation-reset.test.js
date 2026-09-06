const test=require('node:test');
const assert=require('node:assert/strict');
const { resetAdminPageState }=require('../navigation-scroll.js');

test('leaving Administration collapses expanded user editors before returning to Profile',()=>{
  const card={classList:{add(name){this.last=name;}},_summary:{hidden:true},_editor:{hidden:false},querySelector(selector){if(selector==='.admin-user-summary')return this._summary;if(selector==='.admin-user-editor')return this._editor;return null;}};
  const doc={querySelectorAll(selector){return selector==='#adminUsers .admin-user-card[data-user-id]'?[card]:[];}};
  assert.equal(resetAdminPageState(doc),true);
  assert.equal(card._summary.hidden,false);
  assert.equal(card._editor.hidden,true);
  assert.equal(card.classList.last,'admin-user-compact');
});

test('admin reset is harmless when no editable users are rendered',()=>{
  const doc={querySelectorAll(){return[];}};
  assert.equal(resetAdminPageState(doc),false);
});
