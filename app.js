const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="daMentorPro.v1";
const CORE_TOTAL=114;
const PROMO=["Technical independence","Business reasoning","Validation / reconciliation","Stakeholder discovery","Executive communication","Ownership / prioritization","Documentation / handoff","Warehouse / cloud collaboration","Review / mentoring"];
const DE={sql:3,python:3,modeling:3,warehousing:3,quality:3,analysis:3,cloud:2,ownership:2};
const DE_LABELS={sql:"Advanced SQL",python:"Python automation",modeling:"Data modeling",warehousing:"Warehousing",quality:"Data quality",analysis:"Independent analysis",cloud:"Cloud / Fabric",ownership:"Professional ownership"};

function fresh(){
  const lesson={}; COURSE2.forEach(p=>p.lessons.forEach(l=>lesson[l.id]="Not Started"));
  const phase={}; COURSE2.forEach(p=>phase[p.id]={lab:false,gate:false});
  return {v:1,name:"",startDate:"",theme:"midnight",lesson,phase,currentPhase:"C2-00",errors:[],evidence:[],promo:Object.fromEntries(PROMO.map(x=>[x,0])),
    pl:{prepare:0,model:0,visualize:0,manage:0,official:false},de:Object.fromEntries(Object.keys(DE).map(k=>[k,0])),notes:{}};
}
let state=load();
function load(){try{return Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){return fresh()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function phaseObj(id){return COURSE2.find(p=>p.id===id)}
function mastered(p){return p.lessons.filter(l=>state.lesson[l.id]==="Mastered").length}
function coreMastered(){return COURSE2.slice(0,9).reduce((n,p)=>n+mastered(p),0)+COURSE2[9].lessons.filter(l=>l.id.startsWith("CAP")&&state.lesson[l.id]==="Mastered").length}
function passedPhases(){return COURSE2.filter(p=>state.phase[p.id].gate && mastered(p)===p.lessons.length).length}
function currentLesson(p){return p.lessons.find(l=>state.lesson[l.id]!=="Mastered")||p.lessons[p.lessons.length-1]}
function pct(n,d){return d?Math.round(n/d*100):0}
function statusClass(s){return s==="Mastered"?"status-mastered":s==="Practice Attempted"?"status-attempted":s==="Learning"?"status-learning":""}

function render(){
 document.body.dataset.theme=state.theme||"midnight";
 const p=phaseObj(state.currentPhase)||COURSE2[0], m=mastered(p), l=currentLesson(p), art=p.artifacts;
 $("#greeting").textContent=(state.name?state.name+", ":"")+"your next action is ready.";
 $("#heroLine").textContent=`${p.id} • ${p.name} • ${m}/${p.lessons.length} lessons mastered`;
 const cm=coreMastered(); $("#progressPct").textContent=pct(cm,CORE_TOTAL)+"%"; $("#masteredCount").textContent=`${cm}/${CORE_TOTAL}`;
 $("#phaseCount").textContent=`${passedPhases()}/10`; $("#courseBar").style.width=pct(cm,CORE_TOTAL)+"%";
 $("#phaseTitle").textContent=`${p.id} — ${p.name}`; $("#phaseHours").textContent=`${p.hours[0]}–${p.hours[1]} focused h`; $("#phaseBar").style.width=pct(m,p.lessons.length)+"%";
 const st=state.lesson[l.id];
 let instruction=st==="Not Started"||st==="Learning"
  ?`Study ${l.id}: ${l.title}. Open ${art.lesson}. After studying, complete the matching practice in ${art.practice}.`
  :st==="Practice Attempted"
  ?`You attempted ${l.id}. Now open the matching review in ${art.review}, check your reasoning, then mark Mastered only if you can reproduce it independently.`
  :`Phase lessons are mastered. Complete the Mini-Lab (${art.lab}) and then Gate A (${art.gate}) independently.`;
 $("#nextAction").innerHTML=`<b>What do I do now?</b><br>${instruction}`;
 $("#openLessonBtn").textContent=`Current: ${l.id}`;
 $("#markLearningBtn").disabled=st==="Mastered"; $("#markAttemptBtn").disabled=st==="Mastered";
 $("#phaseSelect").innerHTML=COURSE2.map(x=>`<option value="${x.id}" ${x.id===p.id?"selected":""}>${x.id} — ${x.name}</option>`).join("");
 $("#lessonList").innerHTML=p.lessons.map(x=>{
   const s=state.lesson[x.id], reviewUnlocked=s==="Practice Attempted"||s==="Mastered";
   return `<div class="lessonRow"><div class="grow"><b>${x.id}</b> — ${x.title}<div class="muted tiny">Book ${art.lesson} → Practice ${art.practice} → Review ${reviewUnlocked?art.review:"🔒 after attempt"}</div></div>
   <select data-lesson="${x.id}" class="${statusClass(s)}"><option>Not Started</option><option>Learning</option><option>Practice Attempted</option><option>Developing</option><option>Mastered</option></select></div>`;
 }).join("");
 $$('[data-lesson]').forEach(sel=>{sel.value=state.lesson[sel.dataset.lesson]; sel.onchange=e=>{state.lesson[sel.dataset.lesson]=e.target.value;save()}});
 const all=m===p.lessons.length, lab=state.phase[p.id].lab, gate=state.phase[p.id].gate;
 $("#gateState").textContent=gate?"PASSED":all?"READY":"LOCKED"; $("#gateState").className="pill "+(gate?"ok":"");
 $("#assessmentBox").innerHTML=`<div class="gateBox ${gate?"pass":""}">
   <label class="item ${all?"":"locked"}"><input id="labCheck" type="checkbox" ${lab?"checked":""} ${all?"":"disabled"}><span><b>Mini-Lab:</b> ${art.lab}<br><span class="muted tiny">Unlocks after all phase lessons are Mastered.</span></span></label>
   <label class="item ${(all&&lab)?"":"locked"}"><input id="gateCheck" type="checkbox" ${gate?"checked":""} ${(all&&lab)?"":"disabled"}><span><b>Gate A:</b> ${art.gate}<br><span class="muted tiny">Independent first attempt. No AI solving or review copying.</span></span></label>
   <button class="btn primary" id="advanceBtn" ${(gate&&all)?"":"disabled"}>Complete phase & move to next →</button></div>`;
 $("#labCheck")?.addEventListener("change",e=>{state.phase[p.id].lab=e.target.checked;if(!e.target.checked)state.phase[p.id].gate=false;save()});
 $("#gateCheck")?.addEventListener("change",e=>{state.phase[p.id].gate=e.target.checked;save()});
 $("#advanceBtn")?.addEventListener("click",()=>advance(p));
 renderErrors(); renderEvidence(); renderPromo(); renderPL(); renderDE(); renderMap();
}

function advance(p){const i=COURSE2.findIndex(x=>x.id===p.id); if(i<COURSE2.length-1){state.currentPhase=COURSE2[i+1].id;save();scrollTo({top:0,behavior:"smooth"})}}
function renderErrors(){
 $("#errors").innerHTML=state.errors.length?state.errors.map((e,i)=>`<div class="errorRow"><div class="grow"><b>${e.skill}</b><div class="muted tiny">${e.issue}</div><div class="tiny">Repair: ${e.repair||"Targeted repair → fresh retest"}</div></div><button class="btn" data-fix="${i}">${e.done?"Reopen":"Mastered"}</button><button class="btn danger" data-delerr="${i}">×</button></div>`).join(""):`<p class="muted tiny">No recorded weaknesses yet. Add one when a review or Gate exposes a recurring error.</p>`;
 $$('[data-fix]').forEach(b=>b.onclick=()=>{state.errors[+b.dataset.fix].done=!state.errors[+b.dataset.fix].done;save()});
 $$('[data-delerr]').forEach(b=>b.onclick=()=>{state.errors.splice(+b.dataset.delerr,1);save()});
}
function renderEvidence(){
 $("#evidenceList").innerHTML=state.evidence.length?state.evidence.slice().reverse().map((e,ri)=>{let i=state.evidence.length-1-ri;return `<div class="evidenceRow"><div class="grow"><b>${e.skill}</b><div class="muted tiny">${e.action}</div><span class="pill">Strength ${e.strength}/4</span></div><button class="btn danger" data-delev="${i}">×</button></div>`}).join(""):`<p class="muted tiny">No evidence saved yet.</p>`;
 $$('[data-delev]').forEach(b=>b.onclick=()=>{state.evidence.splice(+b.dataset.delev,1);save()});
}
function renderPromo(){
 let sum=0; $("#promoList").innerHTML=PROMO.map(k=>{let v=+state.promo[k]||0;sum+=v;return `<div class="promoRow"><span class="tiny">${k}</span><input data-promo="${k}" type="number" min="0" max="4" value="${v}"></div>`}).join("");
 $$('[data-promo]').forEach(i=>i.onchange=e=>{state.promo[e.target.dataset.promo]=Math.max(0,Math.min(4,+e.target.value||0));save()});
 let avg=sum/PROMO.length, s=avg>=3?"SENIOR/BI READY":avg>=2?"APPROACHING":"BUILDING"; $("#promoState").textContent=s; $("#promoState").className="pill "+(avg>=3?"ok":"");
}
function renderPL(){
 $$('[data-pl]').forEach(i=>{i.value=state.pl[i.dataset.pl]||0;i.onchange=e=>{state.pl[e.target.dataset.pl]=Math.max(0,Math.min(100,+e.target.value||0));save()}});
 $("#officialPractice").checked=!!state.pl.official; $("#officialPractice").onchange=e=>{state.pl.official=e.target.checked;save()};
 let arr=["prepare","model","visualize","manage"].map(k=>+state.pl[k]||0), avg=arr.reduce((a,b)=>a+b,0)/4, ready=avg>=80&&Math.min(...arr)>=70&&state.pl.official;
 $("#plState").textContent=ready?"READY":"NOT READY"; $("#plState").className="pill "+(ready?"ok":"");
}
function renderDE(){
 $("#deChecks").innerHTML=Object.keys(DE).map(k=>`<div class="promoRow"><span class="tiny">${DE_LABELS[k]} <span class="muted">(need ${DE[k]})</span></span><input data-de="${k}" type="number" min="0" max="4" value="${state.de[k]||0}"></div>`).join("");
 $$('[data-de]').forEach(i=>i.onchange=e=>{state.de[e.target.dataset.de]=Math.max(0,Math.min(4,+e.target.value||0));save()});
 const finalGate=!!state.phase["C2-09"].gate, dePass=Object.keys(DE).every(k=>(+state.de[k]||0)>=DE[k]), unlocked=finalGate&&dePass;
 $("#deStatus").textContent=unlocked?"UNLOCKED":"LOCKED"; $("#c3Pill").textContent=unlocked?"UNLOCKED":"LOCKED"; $("#c3Pill").className="pill "+(unlocked?"ok":"danger");
 $("#deMessage").innerHTML=unlocked?"C2-113 readiness floors + Final Gate are satisfied. Course 3 may begin.":`Still locked. ${!finalGate?"Final Course 2 Gate is not passed. ":""}${!dePass?"One or more C2-113 readiness floors are below requirement.":""}`;
}
function renderMap(){
 $("#phaseMap").innerHTML=COURSE2.map(p=>{const m=mastered(p), pass=state.phase[p.id].gate&&m===p.lessons.length;return `<div class="mapRow"><div class="grow"><b>${p.id}</b> ${p.name}<div class="progress"><i style="width:${pct(m,p.lessons.length)}%"></i></div><div class="muted tiny">${m}/${p.lessons.length} mastered</div></div><span class="pill ${pass?"ok":""}">${pass?"PASS":pct(m,p.lessons.length)+"%"}</span></div>`}).join("");
}
$("#phaseSelect").onchange=e=>{state.currentPhase=e.target.value;save()};
$("#whatNowBtn").onclick=()=>{$("#nextAction").scrollIntoView({behavior:"smooth",block:"center"})};
$("#markLearningBtn").onclick=()=>{const p=phaseObj(state.currentPhase),l=currentLesson(p);if(state.lesson[l.id]!=="Mastered")state.lesson[l.id]="Learning";save()};
$("#markAttemptBtn").onclick=()=>{const p=phaseObj(state.currentPhase),l=currentLesson(p);if(state.lesson[l.id]!=="Mastered")state.lesson[l.id]="Practice Attempted";save()};
$("#openLessonBtn").onclick=()=>{$("#lessonList").scrollIntoView({behavior:"smooth"})};
$("#addErrorBtn").onclick=()=>{const skill=prompt("Skill / lesson ID (example ASQL4):");if(!skill)return;const issue=prompt("What went wrong?")||"Needs repair";state.errors.push({skill,issue,repair:"Targeted repair → fresh retest",done:false});save()};
$("#addEvidenceBtn").onclick=()=>{const skill=$("#evSkill").value.trim(),action=$("#evAction").value.trim();if(!skill||!action)return alert("Add a skill and sanitized evidence.");state.evidence.push({skill,action,strength:+$("#evStrength").value,date:new Date().toISOString().slice(0,10)});$("#evSkill").value="";$("#evAction").value="";save()};
$("#backupBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`DA_Mentor_Pro_Backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)};
$("#restoreBtn").onclick=()=>$("#restoreFile").click();
$("#restoreFile").onchange=async e=>{try{const obj=JSON.parse(await e.target.files[0].text());state=Object.assign(fresh(),obj);save();alert("Backup restored.")}catch(err){alert("That backup file could not be read.")}};
$("#settingsBtn").onclick=()=>{$("#nameInput").value=state.name||"";$("#startDateInput").value=state.startDate||"";$("#themeInput").value=state.theme||"midnight";$("#settingsModal").classList.add("show")};
$$('[data-close]').forEach(b=>b.onclick=()=>$("#"+b.dataset.close).classList.remove("show"));
$("#saveSettingsBtn").onclick=()=>{state.name=$("#nameInput").value.trim();state.startDate=$("#startDateInput").value;state.theme=$("#themeInput").value;$("#settingsModal").classList.remove("show");save()};
$("#resetBtn").onclick=()=>{if(confirm("Reset all Mentor Pro progress on this device?")){state=fresh();save();$("#settingsModal").classList.remove("show")}};
if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
render();
