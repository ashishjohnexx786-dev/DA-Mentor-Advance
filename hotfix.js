// DA Mentor Advance v2.1 — stability, repair-flow and explicit Course 2 completion.
// The legacy Course 2 storage key is intentionally retained so existing local progress is not reset.

const c2CoreLessons=p=>p.id==='C2-09'?p.lessons.filter(l=>l.id.startsWith('CAP')):p.lessons;
const c2CoreDone=p=>c2CoreLessons(p).filter(l=>state.lesson[l.id]==='Mastered').length;
const c2PhaseCoreComplete=p=>c2CoreDone(p)===c2CoreLessons(p).length;
const c2DateKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

// Phase 10 contains a separate PL-300 overlay. PL items must not block core Course 2 completion.
passedPhases=function(){return COURSE2.filter(p=>state.phase[p.id].gate&&c2PhaseCoreComplete(p)).length};
renderMap=function(){
  document.querySelector('#phaseMap').innerHTML=COURSE2.map(p=>{
    const core=c2CoreLessons(p),done=c2CoreDone(p),pass=state.phase[p.id].gate&&done===core.length;
    if(p.id==='C2-09'){
      const pl=p.lessons.filter(l=>l.id.startsWith('PL')),plDone=pl.filter(l=>state.lesson[l.id]==='Mastered').length;
      return `<div class="mapRow"><div class="grow"><b>${p.id}</b> ${p.name}<div class="progress"><i style="width:${pct(done,core.length)}%"></i></div><div class="muted tiny">Core ${done}/${core.length} • PL-300 ${plDone}/${pl.length} optional</div></div><span class="pill ${pass?'ok':''}">${pass?'PASS':pct(done,core.length)+'%'}</span></div>`;
    }
    return `<div class="mapRow"><div class="grow"><b>${p.id}</b> ${p.name}<div class="progress"><i style="width:${pct(done,core.length)}%"></i></div><div class="muted tiny">${done}/${core.length} mastered</div></div><span class="pill ${pass?'ok':''}">${pass?'PASS':pct(done,core.length)+'%'}</span></div>`;
  }).join('');
};

const _renderBase=render;
render=function(){
  _renderBase();
  const p=phaseObj(state.currentPhase)||COURSE2[0],l=currentLesson(p),art=p.artifacts;

  if(state.lesson[l.id]==='Developing'){
    document.querySelector('#nextAction').innerHTML=`<b>What do I do now?</b><br>${l.id} is <b>Developing</b>. Re-open the matching review in ${art.review}, record the weakness in Error & Repair Center, complete targeted repair, then use a fresh retest before marking Mastered.`;
  }
  document.querySelectorAll('[data-lesson]').forEach(sel=>{
    const id=sel.dataset.lesson;
    if(state.lesson[id]==='Developing'){
      const note=sel.closest('.lessonRow')?.querySelector('.muted.tiny');
      if(note)note.textContent=`Book ${art.lesson} → Practice ${art.practice} → Review ${art.review} → targeted repair → fresh retest`;
    }
  });

  if(p.id!=='C2-09')return;

  const cap=p.lessons.filter(x=>x.id.startsWith('CAP'));
  const pl=p.lessons.filter(x=>x.id.startsWith('PL'));
  const capDone=cap.filter(x=>state.lesson[x.id]==='Mastered').length;
  const plDone=pl.filter(x=>state.lesson[x.id]==='Mastered').length;
  const coreReady=capDone===cap.length;
  const lab=!!state.phase[p.id].lab,gate=!!state.phase[p.id].gate;
  const previousPhasesPassed=COURSE2.slice(0,9).every(x=>state.phase[x.id].gate&&c2PhaseCoreComplete(x));
  const courseReady=coreMastered()===CORE_TOTAL&&previousPhasesPassed&&gate;

  if(state.courseCompletedAt&&!courseReady){state.courseCompletedAt='';localStorage.setItem(KEY,JSON.stringify(state))}

  document.querySelector('#heroLine').textContent=`${p.id} • ${p.name} • Core ${capDone}/${cap.length} • PL-300 ${plDone}/${pl.length} optional`;
  document.querySelector('#phaseBar').style.width=pct(capDone,cap.length)+'%';
  document.querySelector('#phaseCount').textContent=`${passedPhases()}/10`;

  const list=document.querySelector('#lessonList');
  if(list)list.insertAdjacentHTML('afterbegin','<div class="call" style="margin-bottom:10px"><b>Course-completion rule:</b> CAP1–CAP14 are core. PL1–PL8 are the optional PL-300 certification overlay and do not block Course 2 completion.</div>');

  const capNext=cap.find(x=>state.lesson[x.id]!=='Mastered');
  const next=document.querySelector('#nextAction');
  if(state.courseCompletedAt){
    document.querySelector('#greeting').textContent=(state.name?state.name+', ':'')+'Course 2 is complete. ✅';
    next.innerHTML='<b>Course 2 complete.</b><br>Your 114 core lessons and Final Course 2 Gate are complete. PL-300 remains optional. Course 3 unlock is separate and still requires the C2-113 readiness floors.';
  }else if(capNext){
    next.innerHTML=`<b>What do I do now?</b><br>Continue core capstone work: ${capNext.id} — ${capNext.title}. PL-300 items are optional and will not block Course 2 completion.`;
  }else if(!lab){
    next.innerHTML=`<b>What do I do now?</b><br>All 14 core capstone items are Mastered. Complete the Capstone Mini-Lab (${art.lab}).`;
  }else if(!gate){
    next.innerHTML=`<b>What do I do now?</b><br>Capstone Mini-Lab passed. Take the Final Course 2 Gate (${art.gate}) independently.`;
  }else if(!previousPhasesPassed){
    next.innerHTML='<b>Final Gate recorded.</b><br>One or more earlier phase Gates are still incomplete. Use the Full Phase Map, pass those required Gates, then return here to mark Course 2 complete.';
  }else{
    next.innerHTML='<b>Ready to finish Course 2.</b><br>Your 114 core lessons and all required phase Gates are complete. Use the green <b>Complete Course 2</b> button below.';
  }

  const open=document.querySelector('#openLessonBtn');
  if(open)open.textContent=capNext?`Current core: ${capNext.id}`:'Core capstone complete';
  if(!capNext){document.querySelector('#markLearningBtn').disabled=true;document.querySelector('#markAttemptBtn').disabled=true}

  const gateState=document.querySelector('#gateState');
  gateState.textContent=state.courseCompletedAt?'COURSE COMPLETE':gate?'FINAL GATE PASSED':coreReady?'READY':'LOCKED';
  gateState.className='pill '+((state.courseCompletedAt||gate)?'ok':'');

  const box=document.querySelector('#assessmentBox');
  box.innerHTML=`<div class="gateBox ${state.courseCompletedAt?'pass':''}">
    <div class="call" style="margin-bottom:10px"><b>Course 2 core finish line:</b> 114 core lessons + required Mini-Labs/Gates. PL-300 is tracked separately.</div>
    <label class="item ${coreReady?'':'locked'}"><input id="labCheck" type="checkbox" ${lab?'checked':''} ${coreReady?'':'disabled'}><span><b>Capstone Mini-Lab:</b> ${art.lab}<br><span class="muted tiny">Unlocks after CAP1–CAP14 are Mastered.</span></span></label>
    <label class="item ${(coreReady&&lab)?'':'locked'}"><input id="gateCheck" type="checkbox" ${gate?'checked':''} ${(coreReady&&lab)?'':'disabled'}><span><b>Final Course 2 Gate:</b> ${art.gate}<br><span class="muted tiny">Independent attempt. PL-300 completion is not required.</span></span></label>
    <button class="btn primary" id="completeCourseBtn" ${courseReady?'':'disabled'}>${state.courseCompletedAt?'Course 2 complete ✓':'Complete Course 2'}</button>
    <div class="muted tiny" style="margin-top:8px">${courseReady?'All core completion requirements are satisfied.':!previousPhasesPassed?'Earlier phase Gates are still required before Course 2 can be marked complete.':'Finish the remaining core requirements above.'}</div>
  </div>`;

  document.querySelector('#labCheck')?.addEventListener('change',e=>{state.phase[p.id].lab=e.target.checked;if(!e.target.checked){state.phase[p.id].gate=false;state.courseCompletedAt=''}save()});
  document.querySelector('#gateCheck')?.addEventListener('change',e=>{state.phase[p.id].gate=e.target.checked;if(!e.target.checked)state.courseCompletedAt='';save()});
  document.querySelector('#completeCourseBtn')?.addEventListener('click',()=>{if(!courseReady)return;state.courseCompletedAt=state.courseCompletedAt||c2DateKey();save();scrollTo({top:0,behavior:'smooth'})});
};
render();

(()=>{
  const download=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
  const backupBtn=document.getElementById('backupBtn');
  if(backupBtn)backupBtn.onclick=()=>{if(state.studyTools){state.studyTools.lastBackup=c2DateKey();localStorage.setItem(KEY,JSON.stringify(state))}download(`DA_Mentor_Advance_Backup_${c2DateKey()}.json`,JSON.stringify(state,null,2),'application/json')};
  const reset=document.getElementById('resetBtn');
  if(reset)reset.onclick=()=>{if(confirm('Reset all DA Mentor Advance progress on this device?')){state=fresh();save();document.getElementById('settingsModal')?.classList.remove('show')}};

  const cleanBranding=root=>{
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      const old=node.nodeValue,next=old.replace(/DA Mentor Pro/g,'DA Mentor Advance').replace(/Mentor Pro/g,'Mentor Advance');
      if(next!==old)node.nodeValue=next;
    }
  };

  setTimeout(()=>{
    const old=document.getElementById('proCsvBtn');
    if(old){
      const csv=old.cloneNode(true);old.replaceWith(csv);csv.textContent='📤 Export';
      const q=x=>`"${String(x??'').replace(/"/g,'""')}"`;
      csv.addEventListener('click',()=>{
        const rows=[['Type','Phase','Item','Status','Date','Detail']];
        COURSE2.forEach(p=>{
          p.lessons.forEach(l=>rows.push(['Lesson',p.id,l.id,state.lesson[l.id]||'Not Started','','']));
          rows.push(['Mini-Lab',p.id,p.artifacts.lab,state.phase[p.id]?.lab?'Passed':'Open','','']);
          rows.push(['Gate',p.id,p.artifacts.gate,state.phase[p.id]?.gate?'Passed':'Open','','']);
        });
        (state.studyTools?.focusLog||[]).forEach(x=>rows.push(['Focus',x.phase||'','',`${x.minutes||0} min`,x.date||'','']));
        (state.studyTools?.tasks||[]).forEach(t=>rows.push(['Task',state.currentPhase||'',t.text,t.done?'Done':'Open','','']));
        (state.evidence||[]).forEach(e=>rows.push(['Evidence','',e.skill||'',`Strength ${e.strength||1}`,e.date||'',e.action||'']));
        if(state.courseCompletedAt)rows.push(['Course','','Course 2','Complete',state.courseCompletedAt,'114 core lessons + required Gates']);
        download(`DA_Mentor_Advance_Progress_${c2DateKey()}.csv`,rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');
      });
    }

    const stuck=document.getElementById('proStuck');
    if(stuck&&!document.getElementById('proFinishToday')){
      const finish=document.createElement('button');finish.className='btn';finish.id='proFinishToday';finish.textContent='End study session';stuck.insertAdjacentElement('afterend',finish);
      finish.onclick=()=>{const today=c2DateKey(),mins=(state.studyTools?.focusLog||[]).filter(x=>x.date===today).reduce((n,x)=>n+(+x.minutes||0),0),box=document.getElementById('nextAction');if(box){box.innerHTML=`<b>Close today:</b><br>Mark only work you genuinely completed, write a short Daily Note, leave tomorrow’s first task visible, and record any unresolved weakness in Error & Repair Center.${mins?` You logged ${mins} focus minute(s) today.`:''}`;box.scrollIntoView({behavior:'smooth',block:'center'})}};
    }

    // Safe compatibility cleanup: only mutate text when it actually contains old branding.
    ['proTasks','proBackupInfo'].forEach(id=>{
      const root=document.getElementById(id);if(!root)return;cleanBranding(root);
      new MutationObserver(()=>cleanBranding(root)).observe(root,{childList:true,subtree:true,characterData:true});
    });
  },0);
})();