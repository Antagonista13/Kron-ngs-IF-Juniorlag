import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const {PGlite}=await import('@electric-sql/pglite');
const db=new PGlite();
try{
 await db.exec(`create table public.players(id int primary key,position text,
 constraint players_position_check check(position is null or position in ('Målvakt','Försvarare','Ytterback','Mittfältare','Yttermittfältare','Anfallare')));
 insert into public.players values(1,'Yttermittfältare'),(2,null);`);
 const migration=readdirSync('supabase/migrations').find(p=>p.endsWith('_align_player_position_constraint.sql'));
 if(migration)await db.exec(readFileSync('supabase/migrations/'+migration,'utf8'));
 for(const position of ['Målvakt','Försvarare','Innerback','Ytterback','Mittfältare','Innermittfält','Yttermittfält','Anfallare',null]){
  await db.query('update public.players set position=$1 where id=2',[position]);
  assert.equal((await db.query('select position from public.players where id=2')).rows[0].position,position);
 }
 assert.equal((await db.query('select position from public.players where id=1')).rows[0].position,'Yttermittfältare','Existing legacy values must not be rewritten');
 await assert.rejects(db.query('update public.players set position=$1 where id=2',['Invalid position']),e=>e.code==='23514');
 console.log('All current positions save; legacy rows preserved; unknown positions rejected.');
}catch(error){console.error(error.message,error.code);process.exitCode=1;}finally{await db.close();}
