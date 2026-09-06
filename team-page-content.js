(function(root){
  function hideTeamOverviewCards(doc){
    const d=doc||root.document;
    if(!d)return;
    const focus=d.getElementById('teamFocusCard');
    const posts=d.getElementById('teamPostsFeed');
    if(focus)focus.hidden=true;
    if(posts)posts.hidden=true;
  }
  function setupTeamPageContent(doc){
    const d=doc||root.document;
    if(!d)return;
    hideTeamOverviewCards(d);
    root.addEventListener?.('kronang:team-page-opened',()=>hideTeamOverviewCards(d));
    const page=d.getElementById('teamPage');
    if(page&&root.MutationObserver){
      new root.MutationObserver(()=>hideTeamOverviewCards(d)).observe(page,{childList:true,subtree:false});
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={hideTeamOverviewCards};
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>setupTeamPageContent(root.document));else setupTeamPageContent(root.document);}
})(typeof window!=='undefined'?window:globalThis);
