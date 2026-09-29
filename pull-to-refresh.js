(function(){
const THRESHOLD=72,MAX_PULL=110;
let startY=0,pull=0,tracking=false,refreshing=false;
const indicator=document.createElement('div');
indicator.className='pull-refresh-indicator';
indicator.setAttribute('aria-live','polite');
indicator.innerHTML='<span class="pull-refresh-icon">↓</span><span class="pull-refresh-text">Dra för att uppdatera</span>';
document.body.prepend(indicator);
const text=indicator.querySelector('.pull-refresh-text');
function reset(){pull=0;tracking=false;indicator.classList.remove('visible','ready');indicator.style.transform='translateY(-100%)';text.textContent='Dra för att uppdatera';}
function refreshCurrentView(){
 window.dispatchEvent(new CustomEvent('kronang:pull-refresh'));
 if(typeof window.loadNextActivityHome==='function')window.loadNextActivityHome();
 if(typeof window.loadLatestNews==='function')window.loadLatestNews();
 const active=document.querySelector('.page.active');
 if(active&&active.id==='calendarPage'&&typeof window.testSportAdminCalendar==='function')window.testSportAdminCalendar();
}
document.addEventListener('touchstart',e=>{if(refreshing||window.scrollY>0||e.touches.length!==1)return;startY=e.touches[0].clientY;tracking=true;},{passive:true});
document.addEventListener('touchmove',e=>{if(!tracking)return;const dy=e.touches[0].clientY-startY;if(dy<=0){reset();return;}pull=Math.min(MAX_PULL,dy*.55);indicator.classList.add('visible');indicator.style.transform='translateY('+(pull-52)+'px)';const ready=pull>=THRESHOLD;indicator.classList.toggle('ready',ready);text.textContent=ready?'Släpp för att uppdatera':'Dra för att uppdatera';},{passive:true});
document.addEventListener('touchend',async()=>{if(!tracking)return;const shouldRefresh=pull>=THRESHOLD;tracking=false;if(!shouldRefresh){reset();return;}refreshing=true;indicator.classList.add('refreshing');text.textContent='Uppdaterar…';indicator.style.transform='translateY(12px)';try{refreshCurrentView();await new Promise(r=>setTimeout(r,650));}finally{refreshing=false;indicator.classList.remove('refreshing');reset();}});
window.KronangPullToRefresh={refresh:refreshCurrentView};
})();
