function normalizePlayer(row){
  const item=row||{};
  return {
    id:item.id||'',
    name:(item.full_name||'').trim(),
    mobile:(item.mobile_phone||'').trim(),
    birthDate:item.birth_date||'',
    shirtNumber:item.shirt_number===null||item.shirt_number===undefined||item.shirt_number===''?'':Number(item.shirt_number),
    isActive:item.is_active!==false,
    profileId:item.profile_id||null
  };
}

function validatePlayerInput(input){
  const item=input||{};
  const name=(item.name||item.full_name||'').trim();
  const mobile=(item.mobile||item.mobile_phone||'').trim();
  const birthDate=item.birthDate||item.birth_date||'';
  const raw=item.shirtNumber!==undefined?item.shirtNumber:item.shirt_number;
  const errors=[];
  let shirtNumber='';
  if(!name)errors.push('Namn måste anges.');
  if(raw!==''&&raw!==null&&raw!==undefined){
    shirtNumber=Number(raw);
    if(!Number.isInteger(shirtNumber)||shirtNumber<1||shirtNumber>99)errors.push('Tröjnummer måste vara 1–99.');
  }
  if(birthDate&&!/^\d{4}-\d{2}-\d{2}$/.test(birthDate))errors.push('Födelsedatum är ogiltigt.');
  return {ok:errors.length===0,errors,value:{full_name:name,mobile_phone:mobile||null,birth_date:birthDate||null,shirt_number:shirtNumber===''?null:shirtNumber}};
}

function formatSwedishBirthDate(isoDate){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(isoDate||''))return '';
  const parts=isoDate.split('-').map(Number);
  const months=['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
  if(parts[1]<1||parts[1]>12)return '';
  return parts[2]+' '+months[parts[1]-1]+' '+parts[0];
}

function canManageRoster(role){return role==='coach'||role==='admin';}

if(typeof module!=='undefined'&&module.exports)module.exports={normalizePlayer,validatePlayerInput,formatSwedishBirthDate,canManageRoster};
