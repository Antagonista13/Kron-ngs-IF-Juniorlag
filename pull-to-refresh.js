(function(){
const THRESHOLD=72,MAX_PULL=110;
let startY=0,pull=0,tracking=false,refreshing=false;
const indicator=document.createElement('div');
indicator.className='pull-refresh-indicator';
indicator.setAttribute('role','status');
indicator.setAttribute('aria-label','Uppdaterar');
indicator.innerHTML='<span class="pull-refresh-spinner" aria-hidden="true"></span>';
document.body.prepend(indicator);
function reset(){pull=0;tracking=false;indicator.classList.remove('visible','ready','refreshing');indicator.style.transform='translate(-50%,-100%)';}
function refreshCurrentView(){
 window.dispatchEvent(new CustomEvent('kronang:pull-refresh'));
 if(typeof window.loadNextActivityHome==='function')window.loadNextActivityHome();
 if(typeof window.loadLatestNews==='function')window.loadLatestNews();
 const active=document.querySelector('.page.active');
 if(active&&active.id==='calendarPage'&&typeof window.testSportAdminCalendar==='function')window.testSportAdminCalendar();
}
document.addEventListener('touchstart',e=>{if(refreshing||window.scrollY>0||e.touches.length!==1)return;startY=e.touches[0].clientY;tracking=true;},{passive:true});
document.addEventListener('touchmove',e=>{if(!tracking)return;const dy=e.touches[0].clientY-startY;if(dy<=0){reset();return;}pull=Math.min(MAX_PULL,dy*.55);indicator.classList.add('visible');indicator.style.transform='translate(-50%,'+(pull-52)+'px)';indicator.classList.toggle('ready',pull>=THRESHOLD);},{passive:true});
document.addEventListener('touchend',async()=>{if(!tracking)return;const shouldRefresh=pull>=THRESHOLD;tracking=false;if(!shouldRefresh){reset();return;}refreshing=true;indicator.classList.add('refreshing','visible');indicator.style.transform='translate(-50%,12px)';try{refreshCurrentView();await new Promise(r=>setTimeout(r,650));}finally{refreshing=false;reset();}});
window.KronangPullToRefresh={refresh:refreshCurrentView};
})();
