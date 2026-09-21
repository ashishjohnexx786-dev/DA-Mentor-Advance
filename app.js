(()=>{
'use strict';
const DATA=window.DE_MENTOR_DATA;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='seniorBIMentor2026.fullshell.v1';
const VERSION=8;
const LESSONS=DATA.stages.flatMap(s=>s.lessons.map(l=>({...l,stageId:s.id,stageName:s.name})));
const FORMAL_LESSONS=LESSONS.filter(l=>l.formal!==false);
const LESSON_BY=Object.fromEntries(LESSONS.map(l=>[l.id,l]));
const STAGE_BY=Object.fromEntries(DATA.stages.map(s=>[s.id,s]));
const GATE_BY=Object.fromEntries(DATA.gates.map(g=>[g.id,g]));
const GATE_END=Object.fromEntries(DATA.gates.map(g=>[g.endStage,g]));
const THEMES=['midnight','amoled','light','ocean','forest','ember','graphite'];
let deferredInstall=null, sessionInterval=null, currentJobId=null, activeLessonId=null;

function nowISO(){return new Date().toISOString()}
function todayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDaysISO(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return todayKey(d)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pct(n,d){return d?Math.round(n/d*100):0}
function fmtM(m){m=Math.round(+m||0);return m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m}m`}
function uid(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}
function download(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},600)}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function toCSV(headers,rows){return [headers,...rows].map(r=>r.map(csvCell).join(',')).join('\n')}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._to);t._to=setTimeout(()=>t.classList.remove('show'),2300)}
function openModal(id){$('#'+id).classList.add('show')}
function closeModal(id){$('#'+id).classList.remove('show')}
function stageIndex(id){return DATA.stages.findIndex(s=>s.id===id)}
function lessonIndex(id){return LESSONS.findIndex(l=>l.id===id)}
function gateIndex(id){return DATA.gates.findIndex(g=>g.id===id)}
function stageForLesson(id){return STAGE_BY[LESSON_BY[id]?.stageId]}

function freshLesson(){return {started:false,guidedDone:false,attemptSaved:false,reviewViewed:false,retestPassed:false,explained:false,mastered:false,skipped:false,skipReason:'',startedAt:null,attemptAt:null,reviewAt:null,retestAt:null,masteredAt:null,confidence:0}}
function fresh(){
  const lesson={};LESSONS.forEach(l=>lesson[l.id]=freshLesson());
  const gates={};DATA.gates.forEach(g=>gates[g.id]={status:'Locked',attempts:[],assignedVariant:'A',reviewViewedByVariant:{},reviewAtByVariant:{},repairEvidenceByVariant:{},repairEvidenceAtByVariant:{},changedMicroProofByVariant:{},changedMicroProofAtByVariant:{}});
  return {app:'Senior BI Mentor — Course 2A 2026',version:VERSION,name:'',theme:'amoled',beginnerMode:true,setupSeen:false,currentLessonId:LESSONS[0].id,lesson,gates,errors:[],revisions:[],evidence:[],applications:[],notes:{},studyLog:[],streak:{lastDate:'',count:0},studySettings:{dailyTarget:6},studySession:{running:false,startedAt:null,lessonId:null,stageId:null}};
}
function hydrate(raw){
  const f=fresh(),s=raw&&typeof raw==='object'?raw:{};
  const out={...f,...s};out.version=VERSION;
  out.lesson={};LESSONS.forEach(l=>out.lesson[l.id]={...freshLesson(),...((s.lesson||{})[l.id]||{})});
  out.gates={};DATA.gates.forEach(g=>{const old=((s.gates||{})[g.id]||{}),hadAssigned=Object.prototype.hasOwnProperty.call(old,'assignedVariant');out.gates[g.id]={status:'Locked',attempts:[],assignedVariant:'A',reviewViewedByVariant:{},reviewAtByVariant:{},repairEvidenceByVariant:{},repairEvidenceAtByVariant:{},changedMicroProofByVariant:{},changedMicroProofAtByVariant:{},...old};['reviewViewedByVariant','reviewAtByVariant','repairEvidenceByVariant','repairEvidenceAtByVariant','changedMicroProofByVariant','changedMicroProofAtByVariant'].forEach(k=>{if(!out.gates[g.id][k]||typeof out.gates[g.id][k]!=='object')out.gates[g.id][k]={}});if(!['A','B','C'].includes(out.gates[g.id].assignedVariant))out.gates[g.id].assignedVariant='A';if(!hadAssigned&&out.gates[g.id].attempts.length){const v=out.gates[g.id].attempts.at(-1)?.variant;if(['A','B','C'].includes(v))out.gates[g.id].assignedVariant=v}});
  const g7=out.gates.G07;if(g7){const validPass=(g7.attempts||[]).some(a=>a.result==='Pass'&&a.passMode==='DEMONSTRATED_EVIDENCE_REVIEW'&&a.reviewerConfirmed===true&&Array.isArray(a.demonstrated)&&a.demonstrated.length===8&&a.demonstrated.every(Boolean)&&!a.critical);if(g7.status==='Pass'&&!validPass){g7.legacyPassNeedsRevalidation=true;g7.status='Remediation';const v=(g7.attempts||[]).at(-1)?.variant;if(['A','B','C'].includes(v))g7.assignedVariant=v;}}
  ['errors','revisions','evidence','applications'].forEach(k=>out[k]=Array.isArray(s[k])?s[k]:[]);
  const legacyFocus=Array.isArray(s.focusLog)?s.focusLog:[];
  out.studyLog=Array.isArray(s.studyLog)?s.studyLog:legacyFocus.map(x=>({...x,mode:'study',source:'legacy-focus'}));
  out.notes=s.notes&&typeof s.notes==='object'?s.notes:{};
  out.streak={...f.streak,...(s.streak||{})};
  out.studySettings={...f.studySettings,...(s.studySettings||{}),dailyTarget:+(s.studySettings?.dailyTarget??s.timerSettings?.dailyTarget??f.studySettings.dailyTarget)};
  out.studySession={...f.studySession,...(s.studySession||{})};
  delete out.focusLog;delete out.timerSettings;delete out.timer;
  if(!LESSON_BY[out.currentLessonId])out.currentLessonId=LESSONS[0].id;
  if(!THEMES.includes(out.theme))out.theme='midnight';
  return out;
}
function load(){try{return hydrate(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return fresh()}}
let state=load();
function persist(){localStorage.setItem(KEY,JSON.stringify(state))}
function save(render=true){persist();if(render)renderAll()}
function ls(id){return state.lesson[id]||(state.lesson[id]=freshLesson())}

function lessonStatus(id){const s=ls(id);if(s.mastered)return 'Mastered';if(s.skipped)return 'Skipped for now';if(s.retestPassed)return 'Fresh retry passed';if(s.reviewViewed)return 'Review opened';if(s.attemptSaved)return 'Attempt saved';if(s.guidedDone)return 'Guided follow done';if(s.started)return 'Learning';return 'Not Started'}
function statusClass(st){if(st==='Mastered')return 'status-master';if(st==='Skipped for now')return 'status-skip';if(st==='Fresh retry passed')return 'status-retest';if(st==='Review opened')return 'status-review';if(st==='Attempt saved')return 'status-attempt';if(st==='Learning'||st==='Guided follow done')return 'status-learning';return 'status-not'}
function lessonStepCount(id){const s=ls(id);return [s.started,s.guidedDone,s.attemptSaved,s.reviewViewed,s.retestPassed,s.explained,s.mastered].filter(Boolean).length}
function masteredCount(){return FORMAL_LESSONS.filter(l=>ls(l.id).mastered).length}
function stageMasteredCount(stage){return stage.lessons.filter(l=>ls(l.id).mastered).length}
function gatePassed(g){return state.gates[g.id]?.status==='Pass'}
function gateReady(g){
  const end=Number(g.endStage);
  const lessonsReady=LESSONS.filter(l=>Number(l.stageId)<=end).every(l=>ls(l.id).mastered);
  const prevReady=DATA.gates.filter(x=>Number(x.endStage)<end).every(gatePassed);
  return lessonsReady&&prevReady;
}
function stageCleared(stage){const lessons=stage.lessons.every(l=>ls(l.id).mastered);const g=GATE_END[stage.id];return lessons&&(!g||gatePassed(g))}
function stagesCleared(){return DATA.stages.filter(stageCleared).length}
function gatesPassed(){return DATA.gates.filter(gatePassed).length}
function progressionStage(){return DATA.stages.find(s=>!stageCleared(s))||DATA.stages.at(-1)}
function nextLessonInStage(stage){return stage.lessons.find(l=>!ls(l.id).mastered&&!ls(l.id).skipped)||stage.lessons.find(l=>!ls(l.id).mastered)||null}
function dueRevisions(){const t=todayKey();return state.revisions.filter(r=>!r.done&&r.due<=t).sort((a,b)=>a.due.localeCompare(b.due))}
function unresolvedErrors(){return state.errors.filter(e=>!e.resolvedAt)}
function criticalErrors(){return unresolvedErrors().filter(e=>e.severity==='critical')}

function recommendedAction(){
  const crit=criticalErrors()[0];
  if(crit)return {kind:'repair',lessonId:crit.lessonId,title:'Repair this critical weakness first',detail:crit.issue,cta:'Start repair'};
  const due=dueRevisions()[0];
  if(due)return {kind:'revision',lessonId:due.lessonId,revisionId:due.id,title:`Revision due: ${due.type}`,detail:`${due.lessonId} — ${LESSON_BY[due.lessonId]?.title||''}`,cta:'Do revision'};
  for(const stage of DATA.stages){
    if(stageCleared(stage))continue;
    const l=nextLessonInStage(stage);
    if(l){const s=ls(l.id);let title,detail,cta,step;
      if(!s.started){title=`Start ${l.id}`;detail=l.title;cta='Open lesson';step='learn'}
      else if(!s.guidedDone){title='Follow the guided example';detail=`${l.id} — ${l.title}`;cta='Continue lesson';step='guided'}
      else if(!s.attemptSaved){title='Now do it alone';detail=`Save a genuine attempt for ${l.id} before seeing the review.`;cta='Open independent step';step='attempt'}
      else if(!s.reviewViewed){title='Your review is unlocked';detail=`Compare your attempt with Stage ${stage.id} Review Pack.`;cta='Open review';step='review'}
      else if(!s.retestPassed){title='Do a fresh retry';detail='Close the answer and solve a small fresh variation without copying.';cta='Fresh retry';step='retest'}
      else if(!s.explained){title='Explain it aloud';detail=l.english;cta='Explain';step='explain'}
      else {title='Ready for mastery';detail=`You have attempted, checked, retried and explained ${l.id}.`;cta='Mark Mastered';step='master'}
      return {kind:'lesson',lessonId:l.id,title,detail,cta,step};
    }
    const g=GATE_END[stage.id];
    if(g&&!gatePassed(g))return {kind:'gate',gateId:g.id,title:`${g.Gate} is ready`,detail:g['Must prove'],cta:'Take Gate'};
  }
  return {kind:'complete',title:'Course learning path is complete',detail:'Keep the application loop active and use real interview feedback for targeted revision.',cta:'Open Jobs'};
}
function currentLesson(){return LESSON_BY[state.currentLessonId]||LESSONS[0]}
function displayLesson(){return LESSON_BY[activeLessonId]||currentLesson()}
function isOutOfOrder(id){const rec=recommendedAction();return rec.lessonId&&rec.lessonId!==id&&!ls(id).mastered}

function scheduleRevisions(id){
  const specs=[['D+1',1],['D+4',4],['D+10',10],['D+30',30]];
  for(const [type,days] of specs){if(!state.revisions.some(r=>r.lessonId===id&&r.type===type))state.revisions.push({id:uid('rev'),lessonId:id,type,due:addDaysISO(days),done:false,doneAt:null})}
}
function scheduleSkipRepair(id){if(!state.revisions.some(r=>r.lessonId===id&&r.type==='Skip repair'&&!r.done))state.revisions.push({id:uid('rev'),lessonId:id,type:'Skip repair',due:addDaysISO(1),done:false,doneAt:null})}
function updateStreak(){const t=todayKey();if(state.streak.lastDate===t)return;const y=new Date();y.setDate(y.getDate()-1);const yk=todayKey(y);state.streak.count=state.streak.lastDate===yk?state.streak.count+1:1;state.streak.lastDate=t}

function setView(name){$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===name));window.scrollTo({top:0,behavior:'smooth'});if(name==='map')renderMap();if(name==='repair')renderRepair();if(name==='evidence')renderEvidence();if(name==='jobs')renderJobs();if(name==='reports')renderReports();if(name==='learn')renderLesson()}
function openLesson(id,setCurrent=false){if(!LESSON_BY[id])return;activeLessonId=id;if(setCurrent){state.currentLessonId=id;save(false)}renderLesson();setView('learn')}

function renderAll(){document.body.dataset.theme=state.theme;renderHome();if($('#view-learn').classList.contains('active'))renderLesson();if($('#view-map').classList.contains('active'))renderMap();if($('#view-repair').classList.contains('active'))renderRepair();if($('#view-evidence').classList.contains('active'))renderEvidence();if($('#view-jobs').classList.contains('active'))renderJobs();if($('#view-reports').classList.contains('active'))renderReports();renderStudySession()}
function renderHome(){
  const m=masteredCount(),sc=stagesCleared(),gp=gatesPassed(),p=progressionStage(),cur=currentLesson();
  $('#greeting').textContent=(state.name?`${state.name}, `:'')+'you only need to do the next small step.';
  const unitWord=p.id==='18'?'project phases':'lessons';
  $('#heroSub').textContent=`Stage ${p.id} • ${p.name} • ${stageMasteredCount(p)}/${p.lessons.length} ${unitWord} mastered`;
  $('#coursePct').textContent=pct(m,DATA.lessonCount)+'%';$('#lessonStat').textContent=`${m}/${DATA.lessonCount}`;$('#stageStat').textContent=`${sc}/${DATA.stageCount}`;$('#gateStat').textContent=`${gp}/${DATA.gates.length}`;$('#courseBar').style.width=pct(m,DATA.lessonCount)+'%';
  const a=recommendedAction();$('#nextPill').textContent=a.kind==='repair'?'Repair first':a.kind==='revision'?'Revision due':a.kind==='gate'?'Gate':a.kind==='complete'?'Launch':'Current path';$('#nextPill').className='pill '+(a.kind==='repair'?'danger':a.kind==='revision'||a.kind==='gate'?'warn':a.kind==='complete'?'ok':'');
  $('#nextInstruction').innerHTML=`<b>${esc(a.title)}</b><div class="tiny muted">${esc(a.detail)}</div>`;
  $('#nextActions').innerHTML=`<button class="btn primary" id="nextCTA">${esc(a.cta)}</button>${a.lessonId?'<button class="btn ghost" id="nextRescue">I’m stuck</button>':''}`;
  $('#nextCTA').onclick=()=>performRecommended(a);$('#nextRescue')?.addEventListener('click',()=>openRescue(a.lessonId));
  $('#homeLessonTitle').textContent=`${cur.id} — ${cur.title}`;$('#homeLessonSteps').innerHTML=lessonStepHTML(cur.id);
  renderTodayPlan();renderNote();
}
function performRecommended(a){if(a.kind==='lesson'){state.currentLessonId=a.lessonId;save(false);openLesson(a.lessonId);if(a.step==='review')openReview(a.lessonId)}else if(a.kind==='revision'){state.currentLessonId=a.lessonId;save(false);openLesson(a.lessonId)}else if(a.kind==='repair'){state.currentLessonId=a.lessonId;ls(a.lessonId).skipped=false;save(false);openLesson(a.lessonId)}else if(a.kind==='gate')openGate(a.gateId);else if(a.kind==='complete')setView('jobs')}
function renderTodayPlan(){
  const a=recommendedAction(),p=progressionStage(),items=[];
  items.push({icon:'1',title:a.title,sub:a.detail,action:'main'});
  const dues=dueRevisions().filter(r=>r.id!==a.revisionId).slice(0,2);dues.forEach(r=>items.push({icon:'↻',title:`${r.type} — ${r.lessonId}`,sub:LESSON_BY[r.lessonId]?.title||'',rev:r.id,lesson:r.lessonId}));
  if(Number(p.id)>=3)items.push({icon:'🎯',title:'10–20 min interview micro-drill',sub:'Use one SQL/Python/architecture question from skills you already studied.',view:'learn'});
  items.push({icon:'🗣',title:'5–10 min technical English',sub:`Explain ${currentLesson().id} in your own simple words.`});
  if(Number(p.id)<8)items.push({icon:'⌨',title:'15 min typing (optional once stable)',sub:'Accuracy first; practice the symbols you use in current lessons.'});
  if(Number(p.id)>=17)items.push({icon:'🚀',title:'Job-launch block',sub:'Use the application tracker; quality and eligibility before volume.',view:'jobs'});
  $('#todayPlan').innerHTML=items.slice(0,6).map((x,i)=>`<div class="planItem"><div class="planIcon">${esc(x.icon)}</div><div class="grow"><div class="rowTitle">${esc(x.title)}</div><div class="rowSub">${esc(x.sub)}</div></div>${x.rev?`<button class="btn ghost" data-rev-open="${x.rev}">Open</button>`:x.view?`<button class="btn ghost" data-plan-view="${x.view}">Open</button>`:''}</div>`).join('');
  $$('[data-rev-open]').forEach(b=>b.onclick=()=>{const r=state.revisions.find(x=>x.id===b.dataset.revOpen);if(r)openLesson(r.lessonId,true)});$$('[data-plan-view]').forEach(b=>b.onclick=()=>setView(b.dataset.planView));
}
function lessonStepHTML(id){const s=ls(id);const steps=[['Learn',s.started],['Follow',s.guidedDone],['Attempt',s.attemptSaved],['Review',s.reviewViewed],['Retry',s.retestPassed],['Explain',s.explained],['Master',s.mastered]];return `<div class="lessonProgress">${steps.map(([n,d])=>`<span class="stepDot ${d?'done':''}">${d?'✓':'○'} ${n}</span>`).join('')}</div>`}
function renderNote(){const t=todayKey();$('#dailyNote').value=state.notes[t]||'';$('#noteSaved').textContent=state.notes[t]?'saved':''}

function renderLesson(forceId){
  if(forceId&&LESSON_BY[forceId])activeLessonId=forceId;
  const l=displayLesson(),s=ls(l.id),stage=STAGE_BY[l.stageId],idx=lessonIndex(l.id),status=lessonStatus(l.id),steps=lessonStepCount(l.id);
  $('#lessonHeading').textContent=`${l.id} — ${l.title}`;$('#lessonMeta').textContent=`Stage ${stage.id}: ${stage.name} • ${l.type} • ${l.load} • ~${l.minH}–${l.maxH} focused h • ${l.device||'PC for hands-on; phone OK for reading'}`;
  $('#orderWarning').hidden=!isOutOfOrder(l.id);if(!$('#orderWarning').hidden)$('#orderWarning').innerHTML='<b>Browse-ahead mode:</b> You can study this lesson, but your recommended path still returns to earlier unfinished work. Nothing is fake-completed.';
  $('#lessonProgress').innerHTML=lessonStepHTML(l.id);
  $('#whyText').textContent=state.beginnerMode?`This lesson is one small piece of Stage ${stage.id}. Stage goal: ${stage.purpose} You do not need to understand the whole stage before starting this lesson.`:stage.purpose;
  const bookPointer=l.formal===false&&l.bookFocus?` Book focus: ${l.bookFocus}.`:'';
  const hasVisual=!!l.visualSourceUrl;
  const startInstruction=l.formal===false?'Open the Project Build Book first.':stage.mainClass?'You may use the stage Main Class for a paid-course-style theory block; the assigned lesson visual is the fast jump-back.':hasVisual?'Watch the assigned visual/segment first, then open the Teaching Book.':'Open the Teaching Book first.';
  $('#learnText').textContent=`${startInstruction}${bookPointer} ${l.studyAction||'Read -> follow guided -> do alone.'} Long 1–2 hour classes are allowed when coherent. No handwritten notes are required: the Teaching Book is your ready-made notes. Pause to type/run, then close videos/answers before the independent task.`;
  $('#learnerPackBtn').textContent=l.formal===false?(l.bookPage?`📘 Project Book • p.${l.bookPage}`:'📘 Project Build Book'):'📘 Teaching Book';
  $('#proofText').textContent=l.proof||'Complete the fresh independent task with the review closed.';$('#englishText').textContent=l.english||`Explain ${l.title} in simple English.`;
  $('#sourceName').textContent=l.visualSourceName||stage.source?.name||l.sourceName||'Course-built teaching';
  $('#sourceSegment').textContent=l.visualSegment?`Assigned segment: ${l.visualSegment}`:'';
  $('#sourceRule').textContent=l.visualUseRule||stage.source?.useRule||'';
  $('#sourceStatus').textContent=l.visualKind?`${l.visualKind.replaceAll('_',' ')} • ${l.visualStatus||''}`:'';
  const main=$('#mainClassBtn');if(stage.mainClass?.url){main.href=stage.mainClass.url;main.title=stage.mainClass.rule||'';main.classList.remove('hidden');main.textContent='🎬 Open main class'}else{main.removeAttribute('href');main.removeAttribute('title');main.classList.add('hidden')}
  const src=$('#sourceBtn');if(l.visualSourceUrl){src.href=l.visualSourceUrl;src.classList.remove('hidden');src.textContent=l.visualKind==='OFFICIAL_VIDEO_COURSE'?'🎓 Open video course':l.visualKind==='OFFICIAL_GUIDED'?'🧭 Open official guided source':l.visualKind==='LONG_CLASS'?'🎬 Open long-form class':'🎥 Watch assigned visual'}else{src.removeAttribute('href');src.classList.add('hidden')}
  const mod=$('#moduleBtn');mod.removeAttribute('href');mod.classList.add('hidden');mod.setAttribute('aria-hidden','true')
  const sup=$('#supplementBtn');if(l.supplementUrl){sup.href=l.supplementUrl;sup.textContent=l.supplementLabel||'🧰 Employer translation lab';sup.title=l.supplementNote||'';sup.classList.remove('hidden')}else{sup.removeAttribute('href');sup.removeAttribute('title');sup.classList.add('hidden')}
  $('#learnerPackBtn').onclick=()=>openPack(stage,'learner');
  $('#guidedDoneBtn').textContent=s.guidedDone?'✓ Guided example followed':'I followed the guided example';
  $('#saveAttemptBtn').textContent=s.attemptSaved?'✓ Genuine attempt saved':'Save genuine attempt';
  $('#reviewBtn').textContent=!s.attemptSaved?'🔒 Review locked':s.reviewViewed?'✓ Review opened':(l.formal===false?'Open Rubric / Review':l.reviewMode==='selfcheck'?'Re-open Expected Check':'Open Review / Repair');
  $('#retestBtn').textContent=s.retestPassed?'✓ Fresh retry passed':'Fresh retry passed';
  $('#explainBtn').textContent=s.explained?'✓ Explained aloud':'I explained it aloud';
  $('#masterBtn').textContent=s.mastered?'✓ Mastered':'Mark Mastered';
  $('#skipBtn').textContent=s.skipped?'Skipped — study again':'Skip for now';
  $('#setCurrentBtn').textContent=state.currentLessonId===l.id?'✓ This is my current lesson':'Set as my current lesson';
  $('#lessonStatusBig').textContent=status;$('#lessonStatusBig').className='statusBig '+statusClass(status);$('#lessonBar').style.width=Math.round(steps/7*100)+'%';$('#lessonStatusHelp').textContent=statusHelp(status);
  $('#prevLessonBtn').hidden=idx<=0;$('#nextLessonBtn').hidden=idx>=LESSONS.length-1;$('#prevLessonBtn').onclick=()=>{if(idx>0)openLesson(LESSONS[idx-1].id)};$('#nextLessonBtn').onclick=()=>{if(idx<LESSONS.length-1)openLesson(LESSONS[idx+1].id)};
  renderRevisionPreview(l.id);
}
function statusHelp(st){return {'Not Started':'Open the Teaching Book and start only this lesson.','Learning':'Learn the concept, then follow the guided example.','Guided follow done':'Now close guidance and attempt the independent task.','Attempt saved':'Good. The Review Pack is unlocked because a real attempt exists.','Review opened':'Close the review and solve a fresh variation.','Fresh retry passed':'Explain it aloud; then mastery can be recorded.','Skipped for now':'You may continue, but Mentor will bring this back. A skipped lesson cannot count as mastery.','Mastered':'Independent attempt + review + fresh retry + explanation are recorded.'}[st]||''}
function renderRevisionPreview(id){const rs=state.revisions.filter(r=>r.lessonId===id);$('#revisionPreview').innerHTML=rs.length?rs.map(r=>`<div class="revisionRow"><div class="grow"><b>${esc(r.type)}</b><div class="rowSub">${r.done?'Done '+esc(r.doneAt?.slice(0,10)||''):('Due '+esc(r.due))}</div></div><span class="pill ${r.done?'ok':r.due<=todayKey()?'warn':''}">${r.done?'DONE':r.due<=todayKey()?'DUE':'UPCOMING'}</span></div>`).join(''):'<p class="muted tiny">Revision dates appear automatically after mastery.</p>'}
function openPack(stage,type){const l=displayLesson();let path=type==='learner'?(l.learnerPack||stage.learnerPack):(l.reviewPack||stage.reviewPack);if(type==='review'&&!ls(l.id).attemptSaved){toast('Save a genuine attempt first. Review stays locked.');return}const page=type==='learner'?l.bookPage:l.reviewPage;if(page&&!String(path).includes('#page='))path=`${path}#page=${page}`;window.open(path,'_blank','noopener')}
function openReview(id){const l=LESSON_BY[id];if(!l)return;const s=ls(id);if(!s.attemptSaved){toast('Review is locked until a genuine attempt is saved.');return}s.reviewViewed=true;s.reviewAt=nowISO();state.currentLessonId=id;save();window.open(l.reviewPack||STAGE_BY[l.stageId].reviewPack,'_blank','noopener')}

function renderMap(){
  const q=($('#lessonSearch').value||'').trim().toLowerCase();
  $('#stageMap').innerHTML=DATA.stages.map(stage=>{
    const matches=stage.lessons.filter(l=>!q||`${l.id} ${l.title} ${stage.name}`.toLowerCase().includes(q));if(q&&!matches.length)return '';
    const m=stageMasteredCount(stage),g=GATE_END[stage.id],open=q||stage.id===progressionStage().id,unitLabel=stage.id==='18'?'project phases':'lessons';
    return `<section class="card stageCard ${open?'open':''}" data-stage-card="${stage.id}"><div class="stageTop" data-stage-toggle="${stage.id}"><div class="stageNum">${stage.id}</div><div><h2>${esc(stage.name)}</h2><div class="rowSub">${esc(stage.purpose)}</div><div class="stageMeta"><span class="pill">${stage.lessons.length} ${unitLabel}</span><span class="pill">${stage.minH}–${stage.maxH}h</span>${g?`<span class="pill ${gatePassed(g)?'ok':gateReady(g)?'warn':''}">${esc(g.Gate)}</span>`:''}</div></div><div class="stageProgressMini"><b>${m}/${stage.lessons.length}</b><div class="progress"><i style="width:${pct(m,stage.lessons.length)}%"></i></div></div></div><div class="stageBody"><div class="call info"><b>Exit proof:</b> ${esc(stage.exitEvidence)}</div>${matches.map(l=>{const st=lessonStatus(l.id);return `<div class="stageLessonRow"><div class="grow"><span class="lessonId">${l.id}</span> <b>${esc(l.title)}</b><div class="rowSub">${esc(st)} • ${esc(l.type)}</div></div><button class="btn ghost" data-open-lesson="${l.id}">Open</button></div>`}).join('')}${g?`<div class="gateBanner call ${gatePassed(g)?'ok':gateReady(g)?'warn':'info'}"><b>${esc(g.Gate)}</b><br>${esc(g['Must prove'])}<div class="actionRow" style="margin-top:8px"><button class="btn ${gateReady(g)&&!gatePassed(g)?'primary':'ghost'}" data-open-gate="${g.id}" ${gateReady(g)||gatePassed(g)?'':'disabled'}>${gatePassed(g)?'View Gate result':gateReady(g)?'Take protected Gate':'Gate locked'}</button></div></div>`:''}</div></section>`
  }).join('');
  $$('[data-stage-toggle]').forEach(x=>x.onclick=()=>x.closest('.stageCard').classList.toggle('open'));$$('[data-open-lesson]').forEach(b=>b.onclick=e=>{e.stopPropagation();openLesson(b.dataset.openLesson)});$$('[data-open-gate]').forEach(b=>b.onclick=()=>openGate(b.dataset.openGate));
}

function renderRepair(){
  const errs=unresolvedErrors();$('#repairList').innerHTML=errs.length?errs.map(e=>`<div class="repairRow"><div class="planIcon">${e.severity==='critical'?'!':'🧩'}</div><div class="grow"><b>${esc(e.lessonId||'General')} — ${esc(e.issue)}</b><div class="rowSub">${e.severity==='critical'?'Critical: repair before normal progression.':'Targeted repair only; do not restart the stage.'}</div></div>${e.lessonId?`<button class="btn" data-repair-start="${e.id}">Repair</button>`:''}<button class="btn ghost" data-repair-resolve="${e.id}">Resolve</button></div>`).join(''):'<div class="call ok">No unresolved weaknesses. New mistakes will appear here instead of being hidden.</div>';
  $$('[data-repair-start]').forEach(b=>b.onclick=()=>{const e=state.errors.find(x=>x.id===b.dataset.repairStart);if(e?.lessonId){ls(e.lessonId).skipped=false;state.currentLessonId=e.lessonId;save(false);openLesson(e.lessonId)}});$$('[data-repair-resolve]').forEach(b=>b.onclick=()=>{const e=state.errors.find(x=>x.id===b.dataset.repairResolve);if(e){e.resolvedAt=nowISO();save()}});
  const rs=state.revisions.filter(r=>!r.done).sort((a,b)=>a.due.localeCompare(b.due));$('#revisionList').innerHTML=rs.length?rs.slice(0,30).map(r=>`<div class="revisionRow"><div class="grow"><b>${esc(r.type)} — ${esc(r.lessonId)}</b><div class="rowSub">${esc(LESSON_BY[r.lessonId]?.title||'')} • due ${esc(r.due)}</div></div><span class="pill ${r.due<=todayKey()?'warn':''}">${r.due<=todayKey()?'DUE':'UPCOMING'}</span><button class="btn ghost" data-rev-lesson="${r.lessonId}">Open</button><button class="btn" data-rev-done="${r.id}">Done</button></div>`).join(''):'<p class="muted">No revision items yet.</p>';
  $$('[data-rev-lesson]').forEach(b=>b.onclick=()=>openLesson(b.dataset.revLesson,true));$$('[data-rev-done]').forEach(b=>b.onclick=()=>{const r=state.revisions.find(x=>x.id===b.dataset.revDone);if(r){r.done=true;r.doneAt=nowISO();save()}})
}
function openRescue(lessonId=state.currentLessonId){const l=LESSON_BY[lessonId]||currentLesson();state._rescueLessonId=l.id;$('#rescueTitle').textContent=`${l.id} — ${l.title}`;$('#rescueIssue').value='';$('#rescueSteps').innerHTML=[['1','Read only the current lesson section in the Teaching Book / Project Build Book. Do not open five new resources.'],['2','Follow the guided example exactly once and check the expected result.'],['3','Change one small value/column/parameter yourself. If it fails, save the exact error or wrong output.'],['4','If still blocked, save the weakness below. Mentor schedules a targeted repair instead of making you restart the stage.']].map(([n,t])=>`<div class="rescueStep"><span>${n}</span><div>${esc(t)}</div></div>`).join('');openModal('rescueModal')}
function saveWeakness(lessonId,issue,severity='normal'){if(!issue.trim()){toast('Write what went wrong first.');return}state.errors.push({id:uid('err'),lessonId,issue:issue.trim(),severity,createdAt:nowISO(),resolvedAt:null});scheduleSkipRepair(lessonId);save();toast('Weakness saved. Mentor will bring it back.')}

function renderEvidence(){const es=[...state.evidence].reverse();$('#evidenceList').innerHTML=es.length?es.map(e=>`<div class="evidenceRow"><div class="planIcon">${e.strength}</div><div class="grow"><b>${esc(e.skill)}</b><div class="rowSub">${esc(e.type)} • strength ${e.strength}/4 • ${esc(e.createdAt.slice(0,10))}</div><div class="tiny" style="margin-top:5px">${esc(e.action)}</div></div><button class="btn ghost" data-ev-del="${e.id}">Delete</button></div>`).join(''):'<p class="muted">No evidence saved yet. Strong labs/projects can be added without storing secrets.</p>';$$('[data-ev-del]').forEach(b=>b.onclick=()=>{state.evidence=state.evidence.filter(e=>e.id!==b.dataset.evDel);save()})}

function renderJobs(){
  const apps=[...state.applications].sort((a,b)=>(b.date||'').localeCompare(a.date||''));const applied=apps.filter(a=>a.status!=='Saved').length,screens=apps.filter(a=>['Recruiter screen','Assessment','Technical interview','Final interview','Offer'].includes(a.status)).length,offers=apps.filter(a=>a.status==='Offer').length,high=apps.filter(a=>a.fit==='High'&&a.status!=='Saved').length;
  $('#jobStats').innerHTML=[['Applied',applied],['High-fit',high],['Screens+',screens],['Offers',offers]].map(([l,v])=>`<div class="jobMini"><b>${v}</b><span>${l}</span></div>`).join('');
  $('#applicationList').innerHTML=apps.length?apps.map(a=>`<div class="jobRow"><div class="grow"><b>${esc(a.company)} — ${esc(a.role)}</b><div class="rowSub">${esc(a.date||'')} • ${esc(a.fit)} fit • ${esc(a.status)} • ${esc(a.source||'')}</div>${a.degree?`<div class="tiny muted" style="margin-top:4px">Eligibility: ${esc(a.degree)}</div>`:''}${a.notes?`<div class="tiny" style="margin-top:4px">${esc(a.notes)}</div>`:''}</div><button class="btn ghost" data-job-edit="${a.id}">Edit</button><button class="btn ghost" data-job-del="${a.id}">Delete</button></div>`).join(''):'<p class="muted">No jobs saved yet. You may market-watch before Stage 17; full launch becomes recommended later.</p>';
  $$('[data-job-edit]').forEach(b=>b.onclick=()=>openApplication(b.dataset.jobEdit));$$('[data-job-del]').forEach(b=>b.onclick=()=>{state.applications=state.applications.filter(a=>a.id!==b.dataset.jobDel);save()});
  const diag=diagnoseFunnel();$('#funnelTitle').textContent=diag.title;$('#funnelAdvice').textContent=diag.advice;
}
function diagnoseFunnel(){const a=state.applications.filter(x=>x.status!=='Saved'),high=a.filter(x=>x.fit==='High'),screens=a.filter(x=>['Recruiter screen','Assessment','Technical interview','Final interview','Offer'].includes(x.status)),assess=a.filter(x=>['Assessment','Technical interview','Final interview','Offer'].includes(x.status)),tech=a.filter(x=>['Technical interview','Final interview','Offer'].includes(x.status)),finals=a.filter(x=>['Final interview','Offer'].includes(x.status)),offers=a.filter(x=>x.status==='Offer');if(high.length>=10&&screens.length===0)return {title:'Likely resume / targeting bottleneck',advice:'Audit eligibility wording, resume positioning, project links and application sources. Test a revised batch instead of starting another full course.'};if(screens.length>=3&&assess.length===0)return {title:'Likely assessment bottleneck',advice:'Repair timed SQL/Python/coding with fresh unseen sets. Keep applications running at a manageable level.'};if(tech.length>=3&&finals.length===0)return {title:'Likely technical-interview bottleneck',advice:'Mock the exact failed round: DE concepts, troubleshooting, project defense and architecture explanations.'};if(finals.length>=2&&offers.length===0)return {title:'Final-round pattern',advice:'Review communication, fit, location, compensation and feedback. Do a full-round retrospective.'};return {title:'No strong pattern yet',advice:'Keep collecting targeted application evidence. Do not draw career conclusions from a tiny sample.'}}
function openApplication(id=null){currentJobId=id;const a=id?state.applications.find(x=>x.id===id):null;$('#jobCompany').value=a?.company||'';$('#jobRole').value=a?.role||'';$('#jobSource').value=a?.source||'';$('#jobDate').value=a?.date||todayKey();$('#jobFit').value=a?.fit||'High';$('#jobStatus').value=a?.status||'Saved';$('#jobMode').value=a?.mode||'';$('#jobFollow').value=a?.follow||'';$('#jobDegree').value=a?.degree||'';$('#jobNotes').value=a?.notes||'';openModal('applicationModal')}

function renderReports(){
  const t=todayKey(),weekKeys=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);weekKeys.push(todayKey(d))}
  const minsBy=Object.fromEntries(weekKeys.map(k=>[k,state.studyLog.filter(x=>x.date===k).reduce((a,b)=>a+(+b.minutes||0),0)]));
  const today=minsBy[t]||0,week=Object.values(minsBy).reduce((a,b)=>a+b,0),totalMins=state.studyLog.reduce((a,b)=>a+(+b.minutes||0),0);
  const formalMastered=FORMAL_LESSONS.filter(l=>ls(l.id).mastered).length;
  const projectLessons=LESSONS.filter(l=>l.formal===false),projectMastered=projectLessons.filter(l=>ls(l.id).mastered).length,gp=gatesPassed();
  const evidenceN=state.evidence.length,phaseCleared=DATA.stages.filter(stageCleared).length;$('#rToday').textContent=evidenceN;$('#rWeek').textContent=formalMastered;$('#rStreak').textContent=phaseCleared;$('#rDue').textContent=dueRevisions().length;
  $('#rTotalStudy').textContent=evidenceN;$('#rFormalProof').textContent=`${formalMastered}/${FORMAL_LESSONS.length}`;$('#rProjectProof').textContent=`${phaseCleared}/${DATA.stages.length}`;$('#rGateProof').textContent=`${gp}/${DATA.gates.length}`;
  const complete=formalMastered===FORMAL_LESSONS.length&&gp===DATA.gates.length;
  $('#trainingProofText').textContent=complete?`Senior / BI course proof complete in Mentor: ${formalMastered}/${FORMAL_LESSONS.length} lessons mastered, ${phaseCleared}/${DATA.stages.length} phases cleared, ${gp}/${DATA.gates.length} protected Gates passed and ${evidenceN} evidence items saved. Keep the real runnable artifacts for interviews.`:`Your proof so far: ${formalMastered}/${FORMAL_LESSONS.length} lessons mastered, ${phaseCleared}/${DATA.stages.length} phases cleared, ${gp}/${DATA.gates.length} Gates and ${evidenceN} saved evidence items. The goal is independent capability, not a paid-course receipt.`;
  $('#studyBars').innerHTML=DATA.stages.map(s=>{const m=stageMasteredCount(s);return `<div class="barRow"><span>${s.id}</span><div class="barTrack"><i style="width:${pct(m,s.lessons.length)}%"></i></div><em>${m}/${s.lessons.length}</em></div>`}).join('');
  $('#stageBars').innerHTML=DATA.stages.map(s=>{const m=stageMasteredCount(s);return `<div class="barRow"><span>Stage ${s.id}</span><div class="barTrack"><i style="width:${pct(m,s.lessons.length)}%"></i></div><em>${m}/${s.lessons.length}</em></div>`}).join('')
}

function gateVariantState(gid){const gs=state.gates[gid];if(!gs.assignedVariant)gs.assignedVariant='A';return gs.assignedVariant}
function gateAttemptForVariant(gid,variant){const a=state.gates[gid]?.attempts||[];return [...a].reverse().find(x=>x.variant===variant)||null}
function nextGateVariant(v){return v==='A'?'B':v==='B'?'C':null}
function openGate(id){
  const g=GATE_BY[id];if(!g)return;const gs=state.gates[id],variant=gateVariantState(id),attempt=gateAttemptForVariant(id,variant),passed=gatePassed(g),ready=gateReady(g);
  const reviewViewed=!!gs.reviewViewedByVariant?.[variant],repairEvidence=(gs.repairEvidenceByVariant?.[variant]||'').trim(),changedProof=(gs.changedMicroProofByVariant?.[variant]||'').trim();
  $('#gateTitle').textContent=`${g.Gate} • Gate ${variant}`;
  $('#gateRule').innerHTML=`<b>Must prove:</b> ${esc(g['Must prove'])}<br><b>Pass standard:</b> ${esc(g['Pass standard'])}<br><b>Critical fail:</b> ${esc(g['Critical fail'])}<br><b>Retest rule:</b> Gate B/C stays sealed until the prior failed attempt is saved, its protected Review is opened, targeted repair evidence is recorded, a changed micro-proof is recorded, and the next full Gate is explicitly assigned.`;
  const demonstratedMode=g.passMode==='DEMONSTRATED_EVIDENCE_REVIEW';
  $('#gateScores').innerHTML=demonstratedMode?g.dimensions.map((d,i)=>`<label class="check"><input type="checkbox" data-gate-demonstrated="${i}"> K${i+1} — Reviewer confirms this competency is technically demonstrated with inspectable evidence: ${esc(d)}</label>`).join(''):g.dimensions.map((d,i)=>`<label>K${i+1} — ${esc(d)} (0–4)<input type="number" min="0" max="4" step="1" value="0" data-gate-score="${i}"></label>`).join('');
  $('#gateReviewerConfirmWrap').classList.toggle('hidden',!demonstratedMode);$('#gateReviewerConfirmed').checked=false;
  $('#gateCritical').checked=false;$('#gateNote').value='';
  const pack=$('#gatePackageBtn'),brief=$('#gateBriefBtn'),review=$('#gateReviewBtn'),assign=$('#assignNextGateBtn'),repairBlock=$('#gateRepairBlock');
  pack.removeAttribute('href');pack.classList.add('hidden');pack.setAttribute('aria-hidden','true');
  brief.href=g['gate'+variant];brief.textContent=`Open Gate ${variant} brief`;
  review.href=g['review'+variant];review.textContent=`Open Review ${variant}`;review.classList.remove('disabled');review.classList.toggle('hidden',!attempt);
  review.onclick=e=>{if(!attempt){e.preventDefault();toast(`Save Gate ${variant} attempt first. Review stays locked.`);return}gs.reviewViewedByVariant[variant]=true;gs.reviewAtByVariant[variant]=nowISO();persist();setTimeout(()=>{if(document.querySelector('#gateModal.show'))openGate(id)},120)};
  const repairEligible=!passed&&gs.status==='Remediation'&&!!attempt&&reviewViewed;
  repairBlock.classList.toggle('hidden',!repairEligible);
  $('#gateRepairEvidence').value=repairEvidence;$('#gateChangedProof').value=changedProof;
  $('#gateRepairStatus').textContent=repairEvidence&&changedProof?'Repair + changed micro-proof recorded. Fresh full reassessment may now be explicitly assigned if genuinely required.':reviewViewed?'Record both targeted repair evidence and a changed micro-proof before Gate B/C can be assigned.':'Open the protected Review after the saved attempt first.';
  const next=nextGateVariant(variant),canAssign=!passed&&gs.status==='Remediation'&&!!attempt&&reviewViewed&&!!repairEvidence&&!!changedProof&&!!next;
  assign.classList.toggle('hidden',!canAssign);assign.textContent=next?`Assign fresh Gate ${next} after recorded repair`:'No further full Gate variant';
  assign.onclick=()=>{if(!canAssign)return;if(!confirm(`Assign sealed Gate ${next} as a fresh full reassessment? The prior attempt, Review, targeted repair evidence and changed micro-proof will remain in append-only history.`))return;gs.assignedVariant=next;gs.status='Assigned';save();closeModal('gateModal');toast(`Gate ${next} assigned. Review/answers stay closed during the attempt.`)};
  if(passed)$('#gateResult').textContent=`PASSED on Gate ${attempt?.variant||variant}. ${gs.attempts.length} attempt(s) remain in append-only history.`;
  else if(!ready)$('#gateResult').textContent='Gate is locked because prerequisite units or an earlier Gate are incomplete.';
  else if(gs.status==='Remediation'&&attempt&&!reviewViewed)$('#gateResult').textContent=`Gate ${variant} needs targeted repair. Review ${variant} is now unlocked because the attempt is saved. Open it before recording repair evidence.`;
  else if(gs.status==='Remediation'&&attempt&&reviewViewed&&(!repairEvidence||!changedProof))$('#gateResult').textContent=`Gate ${variant} needs targeted repair. Record the exact repair and a changed micro-proof with Review closed. Gate ${next||'B/C'} remains sealed.`;
  else if(gs.status==='Remediation'&&attempt)$('#gateResult').textContent=`Repair evidence and changed micro-proof are recorded. Explicitly assign ${next?`Gate ${next}`:'no further Gate'} only if a fresh full reassessment is genuinely required.`;
  else $('#gateResult').textContent=`Gate ${variant} is ready. Keep reviews, solution material and AI solving closed during the independent attempt.`;
  $('#saveGateBtn').classList.toggle('hidden',!ready||passed||(gs.status==='Remediation'&&!!attempt));state._gateId=id;openModal('gateModal')
}
function saveGateRepair(){
  const g=GATE_BY[state._gateId];if(!g)return;const gs=state.gates[g.id],variant=gateVariantState(g.id),attempt=gateAttemptForVariant(g.id,variant);
  if(!attempt){toast('Save the Gate attempt before repair.');return}
  if(!gs.reviewViewedByVariant?.[variant]){toast(`Open protected Review ${variant} after the saved attempt first.`);return}
  const repair=$('#gateRepairEvidence').value.trim(),proof=$('#gateChangedProof').value.trim();
  if(repair.length<12||proof.length<12){toast('Record meaningful repair evidence and a changed micro-proof before assignment.');return}
  gs.repairEvidenceByVariant[variant]=repair;gs.repairEvidenceAtByVariant[variant]=nowISO();gs.changedMicroProofByVariant[variant]=proof;gs.changedMicroProofAtByVariant[variant]=nowISO();persist();openGate(g.id);toast('Repair evidence + changed micro-proof saved.')
}
function saveGate(){
  const g=GATE_BY[state._gateId];if(!g)return;const gs=state.gates[g.id],variant=gateVariantState(g.id);if(gateAttemptForVariant(g.id,variant)){toast(`Gate ${variant} already has a saved attempt. Review/repair it before any explicitly assigned full retest.`);return}
  const demonstratedMode=g.passMode==='DEMONSTRATED_EVIDENCE_REVIEW';const levels=demonstratedMode?[]:$$('[data-gate-score]').map(i=>Math.max(0,Math.min(4,+i.value||0)));const demonstrated=demonstratedMode?$$('[data-gate-demonstrated]').map(i=>i.checked):[];const reviewerConfirmed=demonstratedMode?$('#gateReviewerConfirmed').checked:false;const critical=$('#gateCritical').checked;const competencyPass=demonstratedMode?(demonstrated.length===g.dimensions.length&&demonstrated.every(Boolean)&&reviewerConfirmed):levels.every(x=>x>=3);const pass=!critical&&competencyPass;
  const attempt={id:uid('gate'),date:nowISO(),variant,passMode:demonstratedMode?'DEMONSTRATED_EVIDENCE_REVIEW':'LEVEL_3_OR_4',levels,scores:[...levels],demonstrated,reviewerConfirmed,critical,note:$('#gateNote').value.trim(),result:pass?'Pass':'Remediation'};
  gs.attempts.push(attempt);gs.status=pass?'Pass':'Remediation';
  if(!pass)state.errors.push({id:uid('err'),lessonId:null,issue:`${g.Gate} Gate ${variant} needs targeted repair. Review only after this saved attempt; Gate B/C stays sealed until explicit full-reassessment assignment.`,severity:critical?'critical':'normal',createdAt:nowISO(),resolvedAt:null,gateId:g.id,gateVariant:variant});
  save();closeModal('gateModal');toast(pass?`${g.Gate} PASSED`:(demonstratedMode?`Gate ${variant} saved: evidence/reviewer confirmation or repair still required`:`Gate ${variant} saved: targeted remediation required`))
}

function studyMinutesToday(){return state.studyLog.filter(x=>x.date===todayKey()).reduce((a,b)=>a+(+b.minutes||0),0)}
function sessionElapsedSec(){if(!state.studySession.running||!state.studySession.startedAt)return 0;return Math.max(0,Math.floor((Date.now()-new Date(state.studySession.startedAt).getTime())/1000))}
function fmtClock(sec){sec=Math.max(0,Math.floor(+sec||0));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function renderStudySession(){const a=$('#studyToday'),b=$('#studyClock'),c=$('#studyStartEnd'),d=$('#studyCancel');if(!a||!b||!c||!d)return;const active=!!state.studySession.running;a.textContent='Timer removed';b.textContent='';c.hidden=true;d.hidden=true}
function startEndStudy(){
  if(!state.studySession.running){
    const l=currentLesson();state.studySession={running:true,startedAt:nowISO(),lessonId:l?.id||state.currentLessonId,stageId:l?.stageId||LESSON_BY[state.currentLessonId]?.stageId||null};persist();ensureSessionInterval();renderStudySession();toast('Study session started. End it yourself when you finish.');return;
  }
  const endedAt=nowISO(),startedAt=state.studySession.startedAt,durationSec=Math.max(0,Math.floor((new Date(endedAt)-new Date(startedAt))/1000));
  const lId=state.studySession.lessonId||state.currentLessonId,stageId=state.studySession.stageId||LESSON_BY[lId]?.stageId||null;
  if(durationSec>0)state.studyLog.push({id:uid('study'),date:todayKey(new Date(startedAt)),minutes:durationSec/60,durationSec,mode:'study',lessonId:lId,stageId,startedAt,endedAt,at:endedAt});
  state.studySession={running:false,startedAt:null,lessonId:null,stageId:null};if(durationSec>0)updateStreak();persist();renderAll();toast(durationSec>0?`Study session saved: ${fmtM(durationSec/60)}.`:'Session ended.');
}
function cancelStudy(){if(!state.studySession.running)return;if(!confirm('Cancel this active study session? It will not be added to Reports.'))return;state.studySession={running:false,startedAt:null,lessonId:null,stageId:null};persist();renderStudySession();toast('Study session cancelled.')}
function ensureSessionInterval(){clearInterval(sessionInterval);sessionInterval=setInterval(()=>{if(state.studySession.running)renderStudySession()},1000)}

function exportBackup(){download(`Senior_BI_Mentor_Backup_${todayKey()}.json`,JSON.stringify(state,null,2),'application/json')}
function exportLessons(){const rows=LESSONS.map(l=>[l.id,l.stageId,l.title,lessonStatus(l.id),ls(l.id).attemptAt||'',ls(l.id).masteredAt||'',ls(l.id).skipped?'Yes':'No']);download('Senior_BI_Mentor_Lessons.csv',toCSV(['Lesson ID','Stage','Title','Status','Attempt saved','Mastered','Skipped'],rows),'text/csv')}
function exportStudy(){download('Senior_BI_Mentor_Study_Sessions.csv',toCSV(['Date','Minutes','Seconds','Stage','Lesson','Started','Ended'],state.studyLog.map(x=>[x.date,x.minutes,x.durationSec??'',x.stageId,x.lessonId,x.startedAt??'',x.endedAt??x.at??''])),'text/csv')}
function exportTrainingProof(){const totalMins=state.studyLog.reduce((a,b)=>a+(+b.minutes||0),0),projectLessons=LESSONS.filter(l=>l.formal===false);const rows=[['Total focused study minutes',Math.round(totalMins)],['Formal lessons mastered',FORMAL_LESSONS.filter(l=>ls(l.id).mastered).length],['Formal lessons total',FORMAL_LESSONS.length],['Project phases mastered',projectLessons.filter(l=>ls(l.id).mastered).length],['Project phases total',projectLessons.length],['Protected Gates passed',gatesPassed()],['Protected Gates total',DATA.gates.length],['Evidence items saved',state.evidence.length],['Generated',nowISO()]];download('Senior_BI_Mentor_Training_Proof.csv',toCSV(['Metric','Value'],rows),'text/csv')}
function exportEvidence(){download('Senior_BI_Mentor_Evidence.csv',toCSV(['Date','Skill','Type','Strength','Action / validation'],state.evidence.map(x=>[x.createdAt?.slice(0,10),x.skill,x.type,x.strength,x.action])),'text/csv')}
function exportJobs(){download('Senior_BI_Mentor_Applications.csv',toCSV(['Date','Company','Role','Source','Fit','Status','Mode','Degree wording','Follow-up','Notes'],state.applications.map(x=>[x.date,x.company,x.role,x.source,x.fit,x.status,x.mode,x.degree,x.follow,x.notes])),'text/csv')}

function setupRow(label,stateName,detail,fix=''){
  const cls=stateName==='good'?'ok':stateName==='warn'?'warn':'bad';
  const word=stateName==='good'?'GOOD':stateName==='warn'?'LIMITED':'FIX';
  return `<div class="setupRow ${cls}"><div class="setupDot"></div><div class="grow"><b>${esc(label)}</b><div class="rowSub">${esc(detail)}</div>${fix?`<div class="tiny setupFix">What to do: ${esc(fix)}</div>`:''}</div><span class="pill ${cls==='ok'?'ok':cls==='warn'?'warn':'danger'}">${word}</span></div>`;
}
async function runSetupChecks(){
  const box=$('#setupResults');box.innerHTML='<p class="muted">Checking this device…</p>';
  const rows=[];
  // Local progress storage
  try{const k='__deMentorTest';localStorage.setItem(k,'1');localStorage.removeItem(k);rows.push(setupRow('Progress saving','good','This browser can save Mentor progress on this device.'))}catch(e){rows.push(setupRow('Progress saving','bad','This browser blocked local progress storage.','Allow site storage/cookies for this Mentor or use another browser.'))}
  // Materials
  try{const res=await fetch(DATA.stages[0].learnerPack,{cache:'no-store'});rows.push(res.ok?setupRow('Canonical Stage 00 book','good','The current canonical Teaching Book opens from this Mentor package.'):setupRow('Canonical Stage 00 book','bad',`The first book returned ${res.status}.`,'Use the complete Mentor package/hosted site; do not move index.html away from the materials folder.'))}catch(e){rows.push(setupRow('Canonical Stage 00 book',location.protocol==='file:'?'warn':'bad',location.protocol==='file:'?'You opened Mentor directly as a file, so the browser may block automatic file checks. The book button can still be tried manually.':'Mentor could not fetch the first Learner Pack.','If hosted, refresh once. If local, keep the materials folder beside index.html.'))}
  // PWA/offline environment
  const secure=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
  if(secure&&'serviceWorker' in navigator)rows.push(setupRow('Offline/PWA support','good','This browser/origin supports the Mentor service worker.'));
  else if(location.protocol==='file:')rows.push(setupRow('Offline/PWA support','warn','Direct file mode works for basic study, but Install/offline caching needs the hosted HTTPS version.','Use the GitHub Pages/HTTPS version when you want app-style install and offline caching.'));
  else rows.push(setupRow('Offline/PWA support','warn','This browser/origin cannot provide full PWA offline behavior.','Use a modern browser on the HTTPS version of Mentor.'));
  // Manual study-session tracking
  rows.push(setupRow('Timer policy','good','No built-in study timer is shown in this Mentor. Progress is based on mastery, Gates and evidence.'));
  // Screen
  const w=Math.round(window.innerWidth||0);rows.push(w>=320?setupRow('Screen size','good',`Mentor sees a ${w}px-wide screen and will use the mobile layout when needed.`):setupRow('Screen size','warn',`Very narrow screen detected (${w}px).`,'Rotate the phone or use normal browser zoom.'));
  // Online status
  rows.push(navigator.onLine!==false?setupRow('Connection now','good','You are online now. Bundled course PDFs are local to the Mentor package.'):setupRow('Connection now','warn','You appear offline. Local bundled PDFs can still work; external videos/resources need internet.'));
  box.innerHTML=rows.join('');
}
function openSetup(){openModal('setupModal');runSetupChecks()}
function finishSetup(){state.setupSeen=true;persist();closeModal('setupModal');openLesson(state.currentLessonId);toast('Ready. Mentor will tell you the next small step.')}

function bind(){
  $$('.tab').forEach(t=>t.onclick=()=>setView(t.dataset.view));$('#doNowBtn').onclick=()=>performRecommended(recommendedAction());$('#openCurrentBtn').onclick=()=>openLesson(state.currentLessonId);$('#rebuildPlanBtn').onclick=()=>renderTodayPlan();
  $('#setupCheckBtn').onclick=openSetup;$('#runSetupCheckBtn').onclick=runSetupChecks;$('#setupOpenStage0Btn').onclick=()=>openPack(DATA.stages[0],'learner');$('#setupDoneBtn').onclick=finishSetup;
  $('#dailyNote').addEventListener('input',e=>{state.notes[todayKey()]=e.target.value;persist();$('#noteSaved').textContent='saved'});
  $('#stuckBtn').onclick=()=>openRescue();$('#lessonStuckBtn').onclick=()=>openRescue(displayLesson().id);
  $('#guidedDoneBtn').onclick=()=>{const s=ls(displayLesson().id);if(!s.started){toast('Start the lesson first.');return}s.guidedDone=true;s.skipped=false;save()};
  $('#saveAttemptBtn').onclick=()=>{const s=ls(displayLesson().id);if(!s.guidedDone){toast('Follow the guided example first.');return}s.attemptSaved=true;s.attemptAt=nowISO();s.skipped=false;save();toast('Attempt saved. Review is now unlocked.')};
  $('#reviewBtn').onclick=()=>openReview(displayLesson().id);$('#retestBtn').onclick=()=>{const s=ls(displayLesson().id);if(!s.reviewViewed){toast('Open review only after your attempt, then close it before retry.');return}s.retestPassed=true;s.retestAt=nowISO();save()};
  $('#explainBtn').onclick=()=>{const s=ls(displayLesson().id);if(!s.attemptSaved){toast('Save an attempt first.');return}s.explained=true;save()};
  $('#masterBtn').onclick=()=>{const l=displayLesson(),s=ls(l.id);if(!(s.retestPassed&&s.explained)){toast('Fresh retry + explanation are required before mastery.');return}s.mastered=true;s.masteredAt=nowISO();s.skipped=false;s.confidence=Math.max(3,s.confidence||0);scheduleRevisions(l.id);updateStreak();const next=LESSONS[lessonIndex(l.id)+1];if(state.currentLessonId===l.id&&next){state.currentLessonId=next.id;activeLessonId=next.id}save();toast(`${l.id} mastered. Revision dates were scheduled.`)};
  $('#skipBtn').onclick=()=>{const l=displayLesson(),s=ls(l.id);if(s.mastered)return;if(s.skipped){s.skipped=false;save();toast('Skip removed. Lesson is active again.');return}const reason=prompt('Why are you skipping for now? A short reason helps Mentor bring it back correctly.','Too difficult right now');if(reason===null)return;s.skipped=true;s.skipReason=reason;s.started=s.started||false;scheduleSkipRepair(l.id);const next=LESSONS.slice(lessonIndex(l.id)+1).find(x=>x.stageId===l.stageId&&!ls(x.id).mastered&&!ls(x.id).skipped)||LESSONS[lessonIndex(l.id)+1];if(state.currentLessonId===l.id&&next){state.currentLessonId=next.id;activeLessonId=next.id}save();toast('Skipped for now — not counted as complete.')};
  $('#setCurrentBtn').onclick=()=>{state.currentLessonId=displayLesson().id;activeLessonId=state.currentLessonId;ls(state.currentLessonId).skipped=false;save();toast('Current lesson updated.')};
  $('#learnerPackBtn').addEventListener('click',()=>{const s=ls(displayLesson().id);if(!s.started){s.started=true;s.startedAt=nowISO();s.skipped=false;save(false)}openPack(stageForLesson(displayLesson().id),'learner');renderAll()});
  $('#sourceBtn').addEventListener('click',()=>{const s=ls(displayLesson().id);if(!s.started){s.started=true;s.startedAt=nowISO();s.skipped=false;save()}});
  $('#mainClassBtn').addEventListener('click',()=>{const s=ls(displayLesson().id);if(!s.started){s.started=true;s.startedAt=nowISO();s.skipped=false;save()}});
  $('#moduleBtn').addEventListener('click',()=>{const s=ls(displayLesson().id);if(!s.started){s.started=true;s.startedAt=nowISO();s.skipped=false;save()}});
  $('#supplementBtn').addEventListener('click',()=>{const s=ls(displayLesson().id);if(!s.started){s.started=true;s.startedAt=nowISO();s.skipped=false;save()}});
  $('#lessonSearch').addEventListener('input',renderMap);
  $('#addWeaknessBtn').onclick=()=>{fillWeakLessonSelect();openModal('weaknessModal')};$('#saveWeaknessBtn').onclick=()=>{saveWeakness($('#weakLesson').value,$('#weakIssue').value,$('#weakSeverity').value);$('#weakIssue').value='';closeModal('weaknessModal')};
  $('#saveRescueBtn').onclick=()=>{const id=state._rescueLessonId||state.currentLessonId;saveWeakness(id,$('#rescueIssue').value||'Still blocked after Rescue Mode steps.','normal');closeModal('rescueModal')};$('#copyHelpPromptBtn').onclick=copyHelpPrompt;
  $('#addEvidenceBtn').onclick=()=>openModal('evidenceModal');$('#saveEvidenceBtn').onclick=()=>{const skill=$('#evSkill').value.trim(),action=$('#evAction').value.trim();if(!skill||!action){toast('Add the skill and what you did/verified.');return}state.evidence.push({id:uid('ev'),skill,action,type:$('#evType').value,strength:+$('#evStrength').value,createdAt:nowISO()});$('#evSkill').value='';$('#evAction').value='';save();closeModal('evidenceModal')};
  $('#addApplicationBtn').onclick=()=>openApplication();$('#saveApplicationBtn').onclick=saveApplication;
  $('#settingsBtn').onclick=openSettings;$('#saveSettingsBtn').onclick=saveSettings;$('#resetBtn').onclick=resetAll;
  $$('.closeModal').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')}));
  if($('#studyStartEnd'))$('#studyStartEnd').onclick=startEndStudy;if($('#studyCancel'))$('#studyCancel').onclick=cancelStudy;
  $('#exportJsonBtn').onclick=exportBackup;$('#exportLessonsBtn').onclick=exportLessons;if($('#exportStudyBtn'))$('#exportStudyBtn').onclick=exportStudy;$('#exportTrainingProofBtn').onclick=exportTrainingProof;$('#exportEvidenceBtn').onclick=exportEvidence;$('#exportJobsBtn').onclick=exportJobs;$('#restoreBtn').onclick=()=>$('#restoreFile').click();$('#restoreFile').onchange=restoreBackup;
  $('#saveGateBtn').onclick=saveGate;$('#saveGateRepairBtn').onclick=saveGateRepair;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('#installBtn').hidden=true};
  document.addEventListener('visibilitychange',()=>{});
}
function fillWeakLessonSelect(){const cur=state.currentLessonId;$('#weakLesson').innerHTML=LESSONS.map(l=>`<option value="${l.id}" ${l.id===cur?'selected':''}>${l.id} — ${esc(l.title)}</option>`).join('')}
function copyHelpPrompt(){const id=state._rescueLessonId||state.currentLessonId,l=LESSON_BY[id],issue=$('#rescueIssue').value.trim()||'[describe exactly what confused me]';const text=`I am a complete beginner learning ${id}: ${l.title}. I tried the guided step, but I am stuck here: ${issue}. Please explain only the next small step in very simple language. Give one tiny example, then ask me to try. Do NOT give the full solution to my independent task unless I explicitly ask after attempting it.`;navigator.clipboard?.writeText(text).then(()=>toast('Safe help prompt copied.')).catch(()=>prompt('Copy this help prompt:',text))}
function saveApplication(){const obj={id:currentJobId||uid('job'),company:$('#jobCompany').value.trim(),role:$('#jobRole').value.trim(),source:$('#jobSource').value.trim(),date:$('#jobDate').value||todayKey(),fit:$('#jobFit').value,status:$('#jobStatus').value,mode:$('#jobMode').value.trim(),follow:$('#jobFollow').value,degree:$('#jobDegree').value.trim(),notes:$('#jobNotes').value.trim(),updatedAt:nowISO()};if(!obj.company||!obj.role){toast('Company and role are required.');return}const i=state.applications.findIndex(x=>x.id===obj.id);if(i>=0)state.applications[i]={...state.applications[i],...obj};else state.applications.push(obj);currentJobId=null;save();closeModal('applicationModal')}
function openSettings(){$('#nameInput').value=state.name||'';$('#themeInput').value=state.theme;$('#beginnerModeInput').checked=!!state.beginnerMode;$('#dailyTarget').value=state.studySettings.dailyTarget;openModal('settingsModal')}
function saveSettings(){state.name=$('#nameInput').value.trim();state.theme=$('#themeInput').value;state.beginnerMode=$('#beginnerModeInput').checked;state.studySettings.dailyTarget=Math.max(.5,+$('#dailyTarget').value||3);save();closeModal('settingsModal')}
function resetAll(){if(!confirm('Reset ALL Mentor progress, notes, evidence, study-session history and applications on this device? Export a backup first if needed.'))return;localStorage.removeItem(KEY);state=fresh();save();closeModal('settingsModal')}
function restoreBackup(e){const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const raw=JSON.parse(reader.result);state=hydrate(raw);save();toast('Backup restored.')}catch(err){alert('Could not restore this JSON backup.')}};reader.readAsText(f);e.target.value=''}

function init(){activeLessonId=state.currentLessonId;bind();const s=ls(state.currentLessonId);if(!s.started&&state.currentLessonId===LESSONS[0].id){}renderAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});if(!state.setupSeen)setTimeout(openSetup,250)}
window.DE_MENTOR_TEST_API={DATA,LESSONS,FORMAL_LESSONS,STAGE_BY,GATE_BY,fresh,hydrate,lessonStatus,lessonStepCount,masteredCount,stageMasteredCount,gatePassed,gateReady,stageCleared,stagesCleared,gatesPassed,progressionStage,nextLessonInStage,dueRevisions,recommendedAction,scheduleRevisions,scheduleSkipRepair,currentLesson,displayLesson,getActiveLessonId:()=>activeLessonId,setActiveLessonId:(id)=>{if(LESSON_BY[id])activeLessonId=id},getState:()=>state,setState:(x)=>{state=hydrate(x);activeLessonId=state.currentLessonId}};
if(typeof document!=='undefined')init();
})();
