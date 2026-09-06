const assert = require('assert');
const fs = require('fs');
const css = fs.readFileSync('team-posts.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.ok(css.includes('.team-editor-focus-open'), 'open team editors should use a dedicated focus-mode class');
assert.ok(css.includes('position:fixed'), 'focused editor should be fixed above the app');
assert.ok(css.includes('inset:0'), 'focused editor should cover the viewport');
assert.ok(css.includes('overflow-y:auto'), 'focused editor must scroll independently on mobile');
assert.ok(css.includes('z-index:2000'), 'focused editor should sit above bottom navigation');
assert.ok(css.includes('body:has(.team-editor-focus-open) .bottom-nav{display:none}'), 'bottom navigation should be hidden while editing');
assert.ok(css.includes('body:has(.team-editor-focus-open){overflow:hidden}'), 'background app should not scroll while editor is open');
assert.ok(index.includes('team-posts.css?v=12'), 'team editor focus mode should bust the stylesheet cache');
console.log('team editor focus mode tests passed');
