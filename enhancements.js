(()=>{
  const THEMES=['midnight','slate','forest'];
  const THEME_NAMES={midnight:'Midnight',slate:'Slate',forest:'Forest'};
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const fmtM=m=>{m=Math.round(+m||0);return m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m}m`};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const st=()=>{
    if(!state.studyTools) state.studyTools={focusMin:25,shortMin:5,longMin:15,alarm:'on',dailyTarget:3,backupEvery:7,focusLog:[],streak:{lastDate:'',count:0},lastBackup:'',tasks:[],notes:{}};
    const d={focusMin:25,shortMin:5,longMin:15,alarm:'on',dailyTarget:3,backupEvery:7,focusLog:[],streak:{lastDate:'',count:0},lastBackup:'',tasks:[],notes:{}};
    Object.keys(d).forEach(k=>{if(state.studyTools[k]===undefined)state.studyTools[k]=d[k]});
    return state.studyTools;
  };
  let tools=st();

  try{
    const old=JSON.parse(localStorage.getItem('daMentorPro.timer.v1')||'null');
    if(old && !tools.timerMigrated){
      Object.entries(old.focusLog||{}).forEach(([date,min])=>{if(+min>0) tools.focusLog.push({date,minutes:+min,phase:state.currentPhase||'C2-00'})});
      tools.timerMigrated=true;
      localStorage.removeItem('daMentorPro.timer.v1');
      localStorage.setItem(KEY,JSON.stringify(state));
    }
  }catch(e){}

  function minsOn(date){return tools.focusLog.filter(x=>x.date===date).reduce((a,x)=>a+(+x.minutes||0),0)}
  function minsRange(days){let n=0;for(let i=0;i<days;i++){const d=new Date();d.setDate(d.getDate()-i);n+=minsOn(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)}return n}
  function monthMins(){const m=todayKey().slice(0,7);return tools.focusLog.filter(x=>String(x.date||'').startsWith(m)).reduce((a,x)=>a+(+x.minutes||0),0)}
  function updateStreak(){
    const t=todayKey(); if(tools.streak.lastDate===t)return;
    const y=new Date();y.setDate(y.getDate()-1);const yk=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
    tools.streak.count=tools.streak.lastDate===yk?(tools.streak.count||0)+1:1;tools.streak.lastDate=t;
  }
  function persist(){localStorage.setItem(KEY,JSON.stringify(state))}

  const themeBtn=document.getElementById('themeCycleBtn');
  function themeLabel(){const current=state.theme||document.body.dataset.theme||'midnight';if(themeBtn)themeBtn.textContent=`Theme: ${THEME_NAMES[current]||current}`}
  themeBtn?.addEventListener('click',()=>{const current=state.theme||'midnight';state.theme=THEMES[(THEMES.indexOf(current)+1)%THEMES.length];save();themeLabel()});
  document.getElementById('saveSettingsBtn')?.addEventListener('click',()=>setTimeout(themeLabel,0));
  themeLabel();

  let deferredPrompt=null;
  const actions=document.querySelector('.top .actions');
  let install=document.getElementById('proInstallBtn');
  if(actions&&!install){install=document.createElement('button');install.className='btn primary';install.id='proInstallBtn';install.textContent='Install app';install.hidden=true;actions.insertBefore(install,actions.firstChild)}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(install)install.hidden=false});
  install?.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(e){}deferredPrompt=null;install.hidden=true});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;if(install)install.hidden=true});

  let reportsBtn=document.getElementById('proReportsBtn');
  if(actions&&!reportsBtn){reportsBtn=document.createElement('button');reportsBtn.className='btn';reportsBtn.id='proReportsBtn';reportsBtn.textContent='Reports';actions.insertBefore(reportsBtn,document.getElementById('backupBtn'))}
  const reportModal=document.createElement('div');reportModal.className='modal';reportModal.id='proReportsModal';reportModal.innerHTML=`<div class="card modalCard"><div class="row space"><h2>Focus reports</h2><button class="btn" id="closeProReports">×</button></div><div class="reportGrid"><div class="stat"><b id="proRToday">0m</b><span>Today</span></div><div class="stat"><b id="proRWeek">0m</b><span>Last 7 days</span></div><div class="stat"><b id="proRMonth">0m</b><span>This month</span></div><div class="stat"><b id="proRStreak">0 🔥</b><span>Study streak</span></div></div><h3>Last 7 days</h3><div id="proDailyBars"></div><h3>Focus by phase</h3><div id="proPhaseBars"></div></div>`;document.body.appendChild(reportModal);
  function renderReports(){
    document.getElementById('proRToday').textContent=fmtM(minsOn(todayKey()));document.getElementById('proRWeek').textContent=fmtM(minsRange(7));document.getElementById('proRMonth').textContent=fmtM(monthMins());document.getElementById('proRStreak').textContent=`${tools.streak.count||0} 🔥`;
    const days=[];let mx=1;for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,v=minsOn(k);mx=Math.max(mx,v);days.push({label:d.toLocaleDateString(undefined,{weekday:'short'}),v})}
    document.getElementById('proDailyBars').innerHTML=days.map(x=>`<div class="reportBar"><span>${x.label}</span><i><b style="width:${Math.round(x.v/mx*100)}%"></b></i><em>${fmtM(x.v)}</em></div>`).join('');
    const totals={};tools.focusLog.forEach(x=>totals[x.phase]=(totals[x.phase]||0)+(+x.minutes||0));const pmx=Math.max(1,...Object.values(totals));
    document.getElementById('proPhaseBars').innerHTML=COURSE2.map(p=>`<div class="reportBar"><span>${p.id}</span><i><b style="width:${Math.round((totals[p.id]||0)/pmx*100)}%"></b></i><em>${fmtM(totals[p.id]||0)}</em></div>`).join('');
  }
  reportsBtn?.addEventListener('click',()=>{renderReports();reportModal.classList.add('show')});document.getElementById('closeProReports').onclick=()=>reportModal.classList.remove('show');

  const clock=document.getElementById('proTimerClock'),start=document.getElementById('proTimerStart'),reset=document.getElementById('proTimerReset'),today=document.getElementById('proFocusToday'),hint=document.getElementById('proTimerHint'),modeBtns=[...document.querySelectorAll('[data-pro-timer-mode]')];
  let timer={mode:'focus',remaining:Math.max(1,+tools.focusMin||25)*60,running:false,endAt:0};
  const duration=mode=>(mode==='focus'?Math.max(10,+tools.focusMin||25):mode==='short'?Math.max(1,+tools.shortMin||5):Math.max(5,+tools.longMin||15))*60;
  const fmtClock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  const rem=()=>timer.running?Math.max(0,Math.ceil((timer.endAt-Date.now())/1000)):Math.max(0,timer.remaining);
  function beep(){if(tools.alarm!=='on')return;try{const A=window.AudioContext||window.webkitAudioContext,ctx=new A(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=780;g.gain.value=.06;o.start();setTimeout(()=>{o.stop();ctx.close()},450)}catch(e){}if(navigator.vibrate)navigator.vibrate([140,80,140])}
  function renderTimer(){if(!clock)return;clock.textContent=fmtClock(rem());start.textContent=timer.running?'PAUSE':'START';modeBtns.forEach(b=>b.classList.toggle('active',b.dataset.proTimerMode===timer.mode));today.textContent=`${fmtM(minsOn(todayKey()))} focus today`;hint.textContent=timer.mode==='focus'?`Target ${tools.dailyTarget}h • ${tools.streak.count||0} day streak 🔥`:'Breaks do not add to study time.';renderFocusTarget();renderBackupInfo()}
  function completeTimer(){timer.running=false;if(timer.mode==='focus'){tools.focusLog.push({date:todayKey(),minutes:+tools.focusMin||25,phase:state.currentPhase||'C2-00'});updateStreak();persist()}timer.remaining=duration(timer.mode);timer.endAt=0;beep();renderTimer()}
  function tick(){if(timer.running&&rem()<=0)completeTimer();else renderTimer()}
  modeBtns.forEach(b=>b.addEventListener('click',()=>{timer.mode=b.dataset.proTimerMode;timer.running=false;timer.endAt=0;timer.remaining=duration(timer.mode);renderTimer()}));
  start?.addEventListener('click',()=>{if(timer.running){timer.remaining=rem();timer.running=false;timer.endAt=0}else{if(timer.remaining<=0)timer.remaining=duration(timer.mode);timer.running=true;timer.endAt=Date.now()+timer.remaining*1000}renderTimer()});
  reset?.addEventListener('click',()=>{timer.running=false;timer.endAt=0;timer.remaining=duration(timer.mode);renderTimer()});setInterval(tick,500);

  const timerCard=document.querySelector('.focusTimerCard');const targetCard=document.createElement('section');targetCard.className='card';targetCard.innerHTML=`<div class="row space"><h2>Focus target</h2><span class="pill" id="proTargetText"></span></div><div class="progress"><i id="proTargetBar"></i></div><div class="muted tiny" id="proTargetSummary" style="margin-top:7px"></div>`;timerCard?.insertAdjacentElement('afterend',targetCard);
  function renderFocusTarget(){const m=minsOn(todayKey()),target=(+tools.dailyTarget||3)*60,pc=Math.min(100,Math.round(m/target*100));const t=document.getElementById('proTargetText');if(t)t.textContent=`${fmtM(m)} / ${tools.dailyTarget}h`;const b=document.getElementById('proTargetBar');if(b)b.style.width=pc+'%';const s=document.getElementById('proTargetSummary');if(s)s.textContent=`${pc}% of today's target. Mastery still matters more than timer time.`}

  const main=document.querySelector('main');const errorCard=document.getElementById('errors')?.closest('.card');
  const planCard=document.createElement('section');planCard.className='card';planCard.innerHTML=`<div class="row space"><div><div class="kick">Today's plan</div><h2>Mentor tasks</h2></div><button class="btn" id="proRebuildTasks">Rebuild tasks</button></div><div id="proTasks"></div><details><summary>Add optional task</summary><div class="row" style="margin-top:9px"><input id="proTaskText" placeholder="Extra task" style="flex:1"><input id="proTaskPom" type="number" min="1" max="20" value="1" style="width:76px"><button class="btn primary" id="proAddTask">+ Add</button></div></details><div class="row" style="margin-top:8px"><button class="btn" id="proStuck">I'm stuck</button></div>`;
  const notesCard=document.createElement('section');notesCard.className='card';notesCard.innerHTML=`<div class="row space"><div><div class="kick">Daily notes</div><h2>Leave tomorrow a useful note</h2></div><span class="muted tiny" id="proNoteSaved"></span></div><textarea id="proDailyNotes" placeholder="What I learned, what confused me, what I verified, what I will do first tomorrow..."></textarea>`;
  if(main&&errorCard){main.insertBefore(planCard,errorCard);main.insertBefore(notesCard,errorCard)}
  function renderTasks(){const box=document.getElementById('proTasks');if(!box)return;box.innerHTML=tools.tasks.length?tools.tasks.map(t=>`<div class="item ${t.done?'done':''}"><input type="checkbox" data-protask="${t.id}" ${t.done?'checked':''}><div class="grow">${esc(t.text)}<div class="muted tiny">est. ${t.pom||1} Pomodoro${(+t.pom||1)>1?'s':''}${t.auto?' • mentor':''}</div></div><button class="btn" data-prodel="${t.id}">×</button></div>`).join(''):`<p class="muted tiny">Tap Rebuild tasks and Mentor Pro will turn your current next action into today's plan.</p>`;document.querySelectorAll('[data-protask]').forEach(e=>e.onchange=()=>{const t=tools.tasks.find(x=>String(x.id)===String(e.dataset.protask));if(t)t.done=e.checked;persist();renderTasks()});document.querySelectorAll('[data-prodel]').forEach(b=>b.onclick=()=>{tools.tasks=tools.tasks.filter(x=>String(x.id)!==String(b.dataset.prodel));persist();renderTasks()})}
  function rebuildTasks(){const next=(document.getElementById('nextAction')?.innerText||'Continue the current lesson and matching practice').replace(/^What do I do now?\s*/i,'').trim();const base=Date.now();tools.tasks=tools.tasks.filter(t=>!t.auto);tools.tasks.push({id:base,text:next,done:false,pom:3,auto:true},{id:base+1,text:'No-tutorial recall: explain the concept and one validation check aloud',done:false,pom:1,auto:true});persist();renderTasks()}
  document.getElementById('proRebuildTasks')?.addEventListener('click',rebuildTasks);document.getElementById('proAddTask')?.addEventListener('click',()=>{const v=document.getElementById('proTaskText').value.trim();if(!v)return;tools.tasks.push({id:Date.now(),text:v,pom:+document.getElementById('proTaskPom').value||1,done:false,auto:false});document.getElementById('proTaskText').value='';persist();renderTasks()});document.getElementById('proStuck')?.addEventListener('click',()=>{const ph=typeof phaseObj==='function'?phaseObj(state.currentPhase):null,lesson=ph&&typeof currentLesson==='function'?currentLesson(ph):null,status=lesson?state.lesson[lesson.id]:'';let msg='Use the current next action and reduce it to one small step.';if(lesson){if(status==='Not Started')msg=`Start smaller: study only ${lesson.id}, then explain its core idea in 3 bullets before practice.`;else if(status==='Learning')msg=`Close the lesson for 2 minutes and recall ${lesson.id} from memory. Re-open only the exact part you could not explain, then attempt practice.`;else if(status==='Practice Attempted')msg=`Open the matching review for ${lesson.id}, identify the exact mismatch, and record that weakness in Error & Repair Center instead of copying the answer.`;else if(status==='Developing')msg=`Stay in repair mode for ${lesson.id}: re-study only the weak concept, complete a fresh targeted task, then retest before marking Mastered.`;}const box=document.getElementById('nextAction');if(box)box.innerHTML=`<b>Stuck help${lesson?' — '+lesson.id:''}</b><br>${msg}`;box?.scrollIntoView({behavior:'smooth',block:'center'});if(status==='Developing')setTimeout(()=>document.getElementById('errors')?.scrollIntoView({behavior:'smooth',block:'center'}),900)});
  const notes=document.getElementById('proDailyNotes');if(notes){notes.value=tools.notes[todayKey()]||'';let noteTimer;notes.addEventListener('input',()=>{clearTimeout(noteTimer);noteTimer=setTimeout(()=>{tools.notes[todayKey()]=notes.value;persist();const el=document.getElementById('proNoteSaved');if(el){el.textContent='Saved';setTimeout(()=>el.textContent='',1200)}},350)})}

  const modal=document.querySelector('#settingsModal .modalCard');const saveBtn=document.getElementById('saveSettingsBtn');
  const extra=document.createElement('div');extra.className='studySettings';extra.innerHTML=`<h3>Study tools</h3><div class="settingsGrid"><label>Daily focus target<input id="proDailyTarget" type="number" min="1" max="12" value="${tools.dailyTarget}"> hours</label><label>Focus minutes<input id="proFocusMin" type="number" min="10" max="90" value="${tools.focusMin}"></label><label>Short break<input id="proShortMin" type="number" min="1" max="30" value="${tools.shortMin}"></label><label>Long break<input id="proLongMin" type="number" min="5" max="60" value="${tools.longMin}"></label><label>Backup reminder<input id="proBackupEvery" type="number" min="1" max="30" value="${tools.backupEvery}"> days</label><label>Timer alarm<select id="proAlarm"><option value="on">On</option><option value="off">Off</option></select></label></div><div class="muted tiny" id="proBackupInfo"></div>`;
  modal?.insertBefore(extra,saveBtn?.parentElement||null);document.getElementById('proAlarm').value=tools.alarm;
  document.getElementById('settingsBtn')?.addEventListener('click',()=>{document.getElementById('proDailyTarget').value=tools.dailyTarget;document.getElementById('proFocusMin').value=tools.focusMin;document.getElementById('proShortMin').value=tools.shortMin;document.getElementById('proLongMin').value=tools.longMin;document.getElementById('proBackupEvery').value=tools.backupEvery;document.getElementById('proAlarm').value=tools.alarm;renderBackupInfo()});
  saveBtn?.addEventListener('click',()=>{tools.dailyTarget=Math.max(1,+document.getElementById('proDailyTarget').value||3);tools.focusMin=Math.max(10,+document.getElementById('proFocusMin').value||25);tools.shortMin=Math.max(1,+document.getElementById('proShortMin').value||5);tools.longMin=Math.max(5,+document.getElementById('proLongMin').value||15);tools.backupEvery=Math.max(1,+document.getElementById('proBackupEvery').value||7);tools.alarm=document.getElementById('proAlarm').value;timer.running=false;timer.endAt=0;timer.remaining=duration(timer.mode);persist();renderTimer()});
  function renderBackupInfo(){const el=document.getElementById('proBackupInfo');if(!el)return;if(!tools.lastBackup){el.textContent='No Mentor Pro backup exported yet.';return}const a=new Date(tools.lastBackup+'T00:00:00'),b=new Date(todayKey()+'T00:00:00'),days=Math.max(0,Math.floor((b-a)/86400000));el.textContent=days>=tools.backupEvery?`Backup due — last backup ${days} day(s) ago.`:`Last backup: ${tools.lastBackup}.`}

  const backupBtn=document.getElementById('backupBtn'),oldBackup=backupBtn?.onclick;if(backupBtn&&oldBackup){backupBtn.onclick=()=>{tools.lastBackup=todayKey();persist();oldBackup();renderBackupInfo()}}

  let csvBtn=document.getElementById('proCsvBtn');if(actions&&!csvBtn){csvBtn=document.createElement('button');csvBtn.className='btn';csvBtn.id='proCsvBtn';csvBtn.textContent='Export CSV';actions.insertBefore(csvBtn,document.getElementById('settingsBtn'))}
  function csvQuote(x){return `"${String(x??'').replace(/"/g,'""')}"`}
  csvBtn?.addEventListener('click',()=>{const rows=[['Type','Phase','Item','Status','Date','Minutes']];COURSE2.forEach(p=>p.lessons.forEach(l=>rows.push(['Lesson',p.id,l.id,state.lesson[l.id],'',''])));tools.focusLog.forEach(x=>rows.push(['Focus',x.phase,'','',''+x.date,x.minutes]));tools.tasks.forEach(t=>rows.push(['Task',state.currentPhase,t.text,t.done?'Done':'Open','','']));const text=rows.map(r=>r.map(csvQuote).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download=`DA_Mentor_Pro_${todayKey()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)});

  const restoreInput=document.getElementById('restoreFile'),oldRestore=restoreInput?.onchange;if(restoreInput&&oldRestore){restoreInput.onchange=async e=>{await oldRestore(e);tools=st();timer.running=false;timer.endAt=0;timer.remaining=duration(timer.mode);if(notes)notes.value=tools.notes[todayKey()]||'';renderTasks();renderTimer();renderBackupInfo()}}
  const resetBtn=document.getElementById('resetBtn'),oldReset=resetBtn?.onclick;if(resetBtn&&oldReset){resetBtn.onclick=()=>{oldReset();tools=st();timer.running=false;timer.endAt=0;timer.remaining=duration(timer.mode);renderTasks();renderTimer();renderBackupInfo()}}
  const footer=document.querySelector('footer');if(footer)footer.textContent='DA Mentor Pro v1.2 • advanced timer + reports + daily plan/notes + visible themes • offline-first local progress • integrated backup/restore';

  renderTasks();renderTimer();renderBackupInfo();
})();