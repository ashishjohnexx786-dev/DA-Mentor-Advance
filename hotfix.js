// DA Mentor Advance v2.0 — repair-flow + compatibility layer.
// The legacy Course 2 storage key is intentionally retained so existing local progress is not reset.
const _renderBase = render;
render = function(){
  _renderBase();
  const p=phaseObj(state.currentPhase)||COURSE2[0], l=currentLesson(p), art=p.artifacts;
  if(state.lesson[l.id]==='Developing'){
    document.querySelector('#nextAction').innerHTML=`<b>What do I do now?</b><br>${l.id} is <b>Developing</b>. Re-open the matching review in ${art.review}, record the weakness in Error & Repair Center, complete targeted repair, then use a fresh retest before marking Mastered.`;
  }
  document.querySelectorAll('[data-lesson]').forEach(sel=>{
    const id=sel.dataset.lesson;
    if(state.lesson[id]==='Developing'){
      const note=sel.closest('.lessonRow')?.querySelector('.muted.tiny');
      if(note) note.textContent=`Book ${art.lesson} → Practice ${art.practice} → Review ${art.review} → targeted repair → fresh retest`;
    }
  });
};
render();

(()=>{
  const dateKey=()=>new Date().toISOString().slice(0,10);
  const download=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
  const backupBtn=document.getElementById('backupBtn');
  if(backupBtn) backupBtn.onclick=()=>download(`DA_Mentor_Advance_Backup_${dateKey()}.json`,JSON.stringify(state,null,2),'application/json');

  setTimeout(()=>{
    const old=document.getElementById('proCsvBtn');
    if(!old)return;
    const csv=old.cloneNode(true);old.replaceWith(csv);
    csv.textContent='📤 CSV';
    const q=x=>`"${String(x??'').replace(/"/g,'""')}"`;
    csv.addEventListener('click',()=>{
      const rows=[['Type','Phase','Item','Status','Date','Detail']];
      COURSE2.forEach(p=>{
        p.lessons.forEach(l=>rows.push(['Lesson',p.id,l.id,state.lesson[l.id]||'Not Started','','']));
        rows.push(['Mini-Lab',p.id,p.artifacts.lab,state.phase[p.id]?.lab?'Passed':'Open','','']);
        rows.push(['Gate',p.id,p.artifacts.gate,state.phase[p.id]?.gate?'Passed':'Open','','']);
      });
      (state.studyTools?.focusLog||[]).forEach(x=>rows.push(['Focus',x.phase||'', '',`${x.minutes||0} min`,x.date||'','']));
      (state.studyTools?.tasks||[]).forEach(t=>rows.push(['Task',state.currentPhase||'',t.text,t.done?'Done':'Open','','']));
      (state.evidence||[]).forEach(e=>rows.push(['Evidence','',e.skill||'',`Strength ${e.strength||1}`,e.date||'',e.action||'']));
      download(`DA_Mentor_Advance_Progress_${dateKey()}.csv`,rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');
    });
  },0);
})();