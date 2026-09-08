(function(root){
  let activeTeamView='players';

  function hideTeamOverviewCards(doc){
    const d=doc||root.document;
    if(!d)return;
    const focus=d.getElementById('teamWeeklyFocus')||d.getElementById('teamFocusCard');
    const posts=d.getElementById('teamPostsFeed');
    if(focus)focus.hidden=true;
    if(posts)posts.hidden=true;
  }

  function ensureTeamPageStyles(doc){
    const d=doc||root.document;
    if(!d||d.getElementById('teamPageTabsStyles'))return;
    const style=d.createElement('style');
    style.id='teamPageTabsStyles';
    style.textContent=`
      #teamPage #teamInformationSlot{margin:0 0 14px}
      #teamPage #teamInformationSlot .team-posts-list{margin:0}
      #teamPage #teamInformationSlot .team-post{margin:0}
      #teamPage #teamMemberTabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0 18px}
      #teamPage #teamMemberTabs button{min-height:50px;border:1px solid #d9d9d9;border-radius:14px;background:#fff;color:#111;font-size:15px;font-weight:850;cursor:pointer}
      #teamPage #teamMemberTabs button[aria-selected="true"]{background:#111;color:#fff;border-color:#111}
      #teamPage #playerRosterSection,#teamPage #teamStaffSection{margin-top:0}
      #teamPage #playerRosterSection .player-roster-heading,#teamPage #teamStaffSection .team-staff-heading{margin-top:0}
      @media(max-width:420px){#teamPage #teamMemberTabs{gap:7px;margin:12px 0 15px}#teamPage #teamMemberTabs button{min-height:46px;font-size:14px}}
    `;
    d.head.appendChild(style);
  }

  function ensureTeamStructure(doc){
    const d=doc||root.document;
    const page=d&&d.getElementById('teamPage');
    if(!page)return null;
    let information=d.getElementById('teamInformationSlot');
    if(!information){information=d.createElement('div');information.id='teamInformationSlot';}
    let memberTabs=d.getElementById('teamMemberTabs');
    if(!memberTabs){
      memberTabs=d.createElement('div');
      memberTabs.id='teamMemberTabs';
      memberTabs.setAttribute('role','tablist');
      memberTabs.setAttribute('aria-label','Visa spelare eller ledarstab');
      memberTabs.innerHTML='<button type="button" data-team-view="players">Spelare</button><button type="button" data-team-view="staff">Ledarstab</button>';
      memberTabs.querySelectorAll('[data-team-view]').forEach(button=>button.addEventListener('click',()=>showTeamView(button.dataset.teamView,d)));
    }
    const heading=page.querySelector('.page-heading');
    if(information.parentElement!==page){if(heading)heading.insertAdjacentElement('afterend',information);else page.prepend(information);}
    if(memberTabs.parentElement!==page)page.insertBefore(memberTabs,information.nextSibling);
    if(information.nextSibling!==memberTabs)page.insertBefore(information,memberTabs);
    return {page,information,memberTabs};
  }

  function moveTeamInformation(doc){
    const d=doc||root.document;
    const structure=ensureTeamStructure(d);
    if(!structure)return;
    const posts=d.getElementById('teamPostsList');
    if(posts&&posts.parentElement!==structure.information)structure.information.appendChild(posts);
  }

  function showTeamView(kind,doc){
    const d=doc||root.document;
    activeTeamView=kind==='staff'?'staff':'players';
    const players=d&&d.getElementById('playerRosterSection');
    const staff=d&&d.getElementById('teamStaffSection');
    if(players)players.hidden=activeTeamView!=='players';
    if(staff)staff.hidden=activeTeamView!=='staff';
    d&&d.querySelectorAll('#teamMemberTabs [data-team-view]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.teamView===activeTeamView)));
  }

  function organizeTeamPage(doc){
    const d=doc||root.document;
    if(!d)return;
    hideTeamOverviewCards(d);
    ensureTeamPageStyles(d);
    moveTeamInformation(d);
    showTeamView(activeTeamView,d);
  }

  function setupTeamPageContent(doc){
    const d=doc||root.document;
    if(!d)return;
    organizeTeamPage(d);
    root.addEventListener?.('kronang:team-page-opened',()=>organizeTeamPage(d));
    const page=d.getElementById('teamPage');
    if(page&&root.MutationObserver){
      let scheduled=false;
      new root.MutationObserver(()=>{
        if(scheduled)return;
        scheduled=true;
        setTimeout(()=>{scheduled=false;organizeTeamPage(d);},0);
      }).observe(page,{childList:true,subtree:true});
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={hideTeamOverviewCards,showTeamView};
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>setupTeamPageContent(root.document));else setupTeamPageContent(root.document);}
})(typeof window!=='undefined'?window:globalThis);
