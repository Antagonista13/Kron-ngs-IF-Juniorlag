const assert=require('assert');
const fs=require('fs');
const roster=require('../player-roster.js');

const player=roster.normalizePlayer({id:'23',full_name:'Emil Bergqvist',shirt_number:23,position:'Målvakt',team_role:'captain',profile_id:'profile-23'});
assert.strictEqual(player.position,'Målvakt');
assert.strictEqual(player.teamRole,'captain');
assert.strictEqual(roster.formatTeamRole('captain'),'KAPTEN');
assert.strictEqual(roster.formatTeamRole('vice_captain'),'VICEKAPTEN');
assert.strictEqual(roster.formatTeamRole(''),'');
assert.strictEqual(roster.getPlayerCardDestination('player',player),'public');
assert.strictEqual(roster.getPlayerCardDestination('parent',player),'public');
assert.strictEqual(roster.getPlayerCardDestination('coach',player),'public');
assert.strictEqual(roster.getPlayerCardDestination('admin',player),'public');
assert.strictEqual(roster.formatPlayerDisplayName('Abdulazzim Hakmi','Sim'),'Abdulazzim "Sim" Hakmi');

const source=fs.readFileSync(require.resolve('../player-roster.js'),'utf8');
const css=fs.readFileSync(require.resolve('../player-roster.css'),'utf8');
const enhanced=fs.readFileSync(require.resolve('../player-public-profile-v2.js'),'utf8');
const teamController=fs.readFileSync(require.resolve('../team-page-content.js'),'utf8');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
assert.match(source,/makeRosterSelect\('Position','position'/);
assert.match(source,/makeRosterSelect\('Lagroll','team_role'/);
assert.match(source,/position,team_role/);
assert.match(source,/player-public-profile/);
assert.match(source,/if\(role\)\{const badge=/, 'role badge must only be created when a role exists');
assert.match(css,/\.player-public-profile\{[^}]*position:fixed[^}]*inset:0/, 'opened player card must cover the mobile viewport');
assert.match(css,/\.player-public-profile-avatar\{[^}]*width:min\(78vw,360px\)[^}]*height:min\(78vw,360px\)/, 'fullscreen player portrait must be substantially larger');
assert.match(css,/z-index:1000/, 'fullscreen player card must sit above app navigation');

assert.match(enhanced,/select\('full_name,nickname,shirt_number,position,team_role,public_about_me'\)/, 'enhanced public profile must fetch nickname');
assert.match(enhanced,/root\.KronangPlayerNameFormatter\(data\.full_name,data\.nickname\)/, 'enhanced profile must keep the full name and insert nickname instead of replacing the name');
assert.doesNotMatch(enhanced,/signature\.textContent=data\.nickname\|\|data\.full_name/, 'nickname must never replace the full player name');
assert.match(enhanced,/quoted\.test\(full\)/, 'enhanced name formatter must detect an already quoted nickname');
assert.match(enhanced,/profile\.querySelector\('\.player-public-profile-about'\)/, 'enhancement must reuse the existing about card instead of appending duplicates');
assert.match(teamController,/player-public-profile-v2\.js\?v=6/, 'team page must load the fixed profile enhancer with a fresh cache version');
assert.match(html,/team-page-content\.js\?v=7/, 'page must load the fixed team controller');

console.log('player public profile tests passed');
