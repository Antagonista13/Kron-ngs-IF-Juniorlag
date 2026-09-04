const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '202609040010_admin_access_saved_at.sql');

test('admin access saves persist their timestamp', () => {
  assert.ok(fs.existsSync(sqlPath), 'migration for access save timestamps must exist');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /add column if not exists access_updated_at timestamptz/i);
  assert.match(sql, /access_updated_at timestamptz/i);
  assert.match(sql, /p\.access_updated_at/i);
  assert.match(sql, /admin_update_user_access[\s\S]*access_updated_at\s*=\s*now\(\)/i);
  assert.match(sql, /admin_approve_user[\s\S]*access_updated_at\s*=\s*now\(\)/i);
});
