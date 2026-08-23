(()=>{
  const TIMER_KEY='daMentorPro.timer.v1';
  const DUR={focus:25*60,short:5*60,long:15*60};
  const THEME_NAMES={midnight:'Midnight',slate:'Slate',forest:'Forest'};
  const THEMES=['midnight','slate','forest'];
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  function freshTimer(){return {mode:'focus',remaining:DUR.focus,running:false,endAt:0,focusLog:{}}}
  function loadTimer(){try{return Object.assign(freshTimer(),JSON.parse(localStorage.getItem(TIMER_KEY)||'{}'))}catch(e){return freshTimer()}}
  let T=loadTimer();
  const saveTimer=()=>localStorage.setItem(TIMER_KEY,JSON.stringify(T));
  const clock=document.getElementById('proTimerClock');
  const start=document.getElementById('proTimerStart');
  const reset=document.getElementById('proTimerReset');
  const today=document.getElementById('proFocusToday');
  const hint=document.getElementById('proTimerHint');
  const modeBtns=[...document.querySelectorAll('[data-pro-timer-mode]')];
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  function effectiveRemaining(){return T.running?Math.max(0,Math.ceil((T.endAt-Date.now())/1000)):Math.max(0,T.remaining)}
  function renderTimer(){
    if(!clock)return;
    const rem=effectiveRemaining();
    clock.textContent=fmt(rem);
    start.textContent=T.running?'PAUSE':'START';
    modeBtns.forEach(b=>b.classList.toggle('active',b.dataset.proTimerMode===T.mode));
    const mins=Math.round((T.focusLog[todayKey()]||0)*10)/10;
    today.textContent=`${mins}m focus today`;
    hint.textContent=T.mode==='focus'?'Focus sessions count only when the timer reaches 00:00.':'Breaks do not add to study time.';
  }
  function complete(){
    T.running=false;
    if(T.mode==='focus') T.focusLog[todayKey()]=(T.focusLog[todayKey()]||0)+D.focus/60;
    T.remaining=DUR[T.mode]; T.endAt=0; saveTimer(); renderTimer();
    if(navigator.vibrate) navigator.vibrate([140,80,140]);
    document.title='Timer complete • DA Mentor Pro'; setTimeout(()=>document.title='DA Mentor Pro — Course 2',2500);
  }
  function tick(){if(T.running&&effectiveRemaining()<=0)complete();else renderTimer()}
  modeBtns.forEach(b=>b.addEventListener('click',()=>{T.mode=b.dataset.proTimerMode;T.running=false;T.endAt=0;T.remaining=DUR[T.mode];saveTimer();renderTimer()}));
  start?.addEventListener('click',()=>{
    if(T.running){T.remaining=effectiveRemaining();T.running=false;T.endAt=0;}
    else {if(T.remaining<=0)T.remaining=DUR[T.mode];T.running=true;T.endAt=Date.now()+T.remaining*1000;}
    saveTimer();renderTimer();
  });
  reset?.addEventListener('click',()=>{T.running=false;T.endAt=0;T.remaining=DUR[T.mode];saveTimer();renderTimer()});
  setInterval(tick,500); renderTimer();

  const themeBtn=document.getElementById('themeCycleBtn');
  function themeLabel(){const current=(typeof state!=='undefined'&&state.theme)||document.body.dataset.theme||'midnight';if(themeBtn)themeBtn.textContent=`Theme: ${THEME_NAMES[current]||current}`}
  themeBtn?.addEventListener('click',()=>{
    const current=(typeof state!=='undefined'&&state.theme)||document.body.dataset.theme||'midnight';
    const next=THEMES[(THEMES.indexOf(current)+1)%THEMES.length];
    if(typeof state!=='undefined'){state.theme=next;if(typeof save==='function')save();}else document.body.dataset.theme=next;
    themeLabel();
  });
  document.getElementById('saveSettingsBtn')?.addEventListener('click',()=>setTimeout(themeLabel,0));
  themeLabel();
})();
