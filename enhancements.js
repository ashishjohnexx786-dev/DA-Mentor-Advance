(()=>{
  const TIMER_KEY='daMentorPro.timer.v1';
  const DUR={focus:25*60,short:5*60,long:15*60};
  const THEME_NAMES={midnight:'Midnight',slate:'Slate',forest:'Forest'};
  const THEMES=['midnight','slate','forest'];
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fmtM=m=>{m=Math.round(+m||0);return m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m}m`};
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
    today.textContent=`${fmtM(T.focusLog[todayKey()]||0)} focus today`;
    hint.textContent=T.mode==='focus'?'Focus sessions count only when the timer reaches 00:00.':'Breaks do not add to study time.';
  }
  function complete(){
    T.running=false;
    if(T.mode==='focus') T.focusLog[todayKey()]=(T.focusLog[todayKey()]||0)+DUR.focus/60;
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

  // Visible theme cycling.
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

  // Install button: same convenience Mentor OS already had.
  const actions=document.querySelector('.top .actions');
  let deferredInstall=null;
  let installBtn=document.getElementById('proInstallBtn');
  if(actions&&!installBtn){installBtn=document.createElement('button');installBtn.id='proInstallBtn';installBtn.className='btn primary';installBtn.textContent='Install app';installBtn.hidden=true;actions.insertBefore(installBtn,actions.firstChild)}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(installBtn)installBtn.hidden=false});
  installBtn?.addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();try{await deferredInstall.userChoice}catch(e){}deferredInstall=null;installBtn.hidden=true});
  window.addEventListener('appinstalled',()=>{deferredInstall=null;if(installBtn)installBtn.hidden=true});

  // Reports modal using completed focus-session history.
  let reportsBtn=document.getElementById('proReportsBtn');
  if(actions&&!reportsBtn){reportsBtn=document.createElement('button');reportsBtn.id='proReportsBtn';reportsBtn.className='btn';reportsBtn.textContent='Reports';const backup=document.getElementById('backupBtn');actions.insertBefore(reportsBtn,backup||null)}
  let reportsModal=document.getElementById('proReportsModal');
  if(!reportsModal){
    reportsModal=document.createElement('div');reportsModal.className='modal';reportsModal.id='proReportsModal';reportsModal.innerHTML=`<div class="card modalCard"><div class="row space"><h2>Focus reports</h2><button class="btn" id="closeProReports">×</button></div><div class="proReportGrid"><div class="stat"><b id="proRToday">0m</b><span>Today</span></div><div class="stat"><b id="proRWeek">0m</b><span>Last 7 days</span></div><div class="stat"><b id="proRMonth">0m</b><span>Last 30 days</span></div><div class="stat"><b id="proRStreak">0 🔥</b><span>Study streak</span></div></div><h3>Last 7 days</h3><div id="proDailyBars"></div><p class="muted tiny">Only completed focus sessions are counted. Breaks are excluded.</p></div>`;
    document.body.appendChild(reportsModal);
  }
  function rangeMinutes(days){let sum=0;for(let i=0;i<days;i++){const d=new Date();d.setDate(d.getDate()-i);sum+=+T.focusLog[dateKey(d)]||0}return sum}
  function streak(){let d=new Date(),count=0;if(!(+T.focusLog[dateKey(d)]>0))d.setDate(d.getDate()-1);while(+T.focusLog[dateKey(d)]>0){count++;d.setDate(d.getDate()-1)}return count}
  function renderReports(){
    const rt=document.getElementById('proRToday'),rw=document.getElementById('proRWeek'),rm=document.getElementById('proRMonth'),rs=document.getElementById('proRStreak');
    if(rt)rt.textContent=fmtM(T.focusLog[todayKey()]||0);if(rw)rw.textContent=fmtM(rangeMinutes(7));if(rm)rm.textContent=fmtM(rangeMinutes(30));if(rs)rs.textContent=`${streak()} 🔥`;
    const days=[];let max=1;for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const v=+T.focusLog[dateKey(d)]||0;max=Math.max(max,v);days.push({label:d.toLocaleDateString(undefined,{weekday:'short'}),v})}
    const box=document.getElementById('proDailyBars');if(box)box.innerHTML=days.map(x=>`<div class="proBarRow"><span class="muted tiny">${x.label}</span><div class="proBar"><i style="width:${Math.round(x.v/max*100)}%"></i></div><span class="muted tiny">${fmtM(x.v)}</span></div>`).join('');
  }
  reportsBtn?.addEventListener('click',()=>{renderReports();reportsModal.classList.add('show')});
  document.getElementById('closeProReports')?.addEventListener('click',()=>reportsModal.classList.remove('show'));

  // Daily notes: state.notes already existed in Mentor Pro, but had no interface.
  const main=document.querySelector('main');
  let noteCard=document.getElementById('proDailyNotesCard');
  if(main&&!noteCard){
    noteCard=document.createElement('section');noteCard.className='card';noteCard.id='proDailyNotesCard';
    noteCard.innerHTML=`<div class="row space"><div><div class="kick">Daily notes</div><h2>Leave tomorrow a useful clue</h2></div><span class="muted tiny" id="proNoteSaved"></span></div><p class="muted tiny">Write what you learned, what confused you, what you verified, and what you should do first next time.</p><textarea id="proDailyNotes" placeholder="Today's notes..."></textarea>`;
    main.appendChild(noteCard);
  }
  const notes=document.getElementById('proDailyNotes');
  const noteSaved=document.getElementById('proNoteSaved');
  if(notes&&typeof state!=='undefined')notes.value=(state.notes&&state.notes[todayKey()])||'';
  notes?.addEventListener('input',()=>{
    if(typeof state==='undefined')return;if(!state.notes)state.notes={};state.notes[todayKey()]=notes.value;localStorage.setItem(KEY,JSON.stringify(state));
    if(noteSaved){noteSaved.textContent='Saved';clearTimeout(notes._saveTimer);notes._saveTimer=setTimeout(()=>noteSaved.textContent='',1200)}
  });

  // Quick "I'm stuck" coaching, without giving Gate answers.
  const attemptBtn=document.getElementById('markAttemptBtn');
  let stuckBtn=document.getElementById('proStuckBtn');
  if(attemptBtn?.parentElement&&!stuckBtn){stuckBtn=document.createElement('button');stuckBtn.className='btn';stuckBtn.id='proStuckBtn';stuckBtn.textContent="I'm stuck";attemptBtn.parentElement.appendChild(stuckBtn)}
  stuckBtn?.addEventListener('click',()=>{
    if(typeof phaseObj!=='function'||typeof currentLesson!=='function'||typeof state==='undefined')return;
    const ph=phaseObj(state.currentPhase),lesson=currentLesson(ph),st=state.lesson[lesson.id];
    let msg='';
    if(st==='Not Started')msg=`Start smaller: study only ${lesson.id}, then explain its core idea in 3 bullets before practice.`;
    else if(st==='Learning')msg=`Close the lesson for 2 minutes and recall ${lesson.id} from memory. Re-open only the exact part you could not explain, then attempt practice.`;
    else if(st==='Practice Attempted')msg=`Use the matching review now. Record the exact mismatch in Error & Repair Center; do not simply copy the answer.`;
    else if(st==='Developing')msg=`Stay in repair mode. Re-study the exact weak concept, complete a fresh targeted task, then retest before marking Mastered.`;
    else msg='Use “What do I do now?” for the next unlocked action. Do not open protected retests unless remediation routes you there.';
    const box=document.getElementById('nextAction');if(box)box.innerHTML=`<b>Stuck help — ${lesson.id}</b><br>${msg}`;box?.scrollIntoView({behavior:'smooth',block:'center'});
  });

  // Full backup/restore now includes timer/focus history as well as Course 2 state.
  const backupBtn=document.getElementById('backupBtn');
  if(backupBtn)backupBtn.onclick=()=>{
    const pkg={product:'DA Mentor Pro',version:'1.2',exportedAt:new Date().toISOString(),state,timer:T};
    const blob=new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'}),a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=`DA_Mentor_Pro_Backup_${todayKey()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  };
  const restoreFile=document.getElementById('restoreFile');
  if(restoreFile)restoreFile.onchange=async e=>{try{
    const obj=JSON.parse(await e.target.files[0].text());const restored=obj.state||obj.data||obj;
    state=Object.assign(fresh(),restored);if(obj.timer){T=Object.assign(freshTimer(),obj.timer);saveTimer()}save();renderTimer();if(notes)notes.value=(state.notes&&state.notes[todayKey()])||'';alert('Backup restored.');
  }catch(err){alert('That backup file could not be read.')}};
  const resetBtn=document.getElementById('resetBtn');
  if(resetBtn)resetBtn.onclick=()=>{if(confirm('Reset all Mentor Pro progress, notes and focus history on this device?')){state=fresh();T=freshTimer();saveTimer();save();if(notes)notes.value='';document.getElementById('settingsModal')?.classList.remove('show')}};

  const footer=document.querySelector('footer');if(footer)footer.textContent='DA Mentor Pro v1.2 • timer + reports + notes + install • visible themes • offline-first • full backup/restore';
})();
