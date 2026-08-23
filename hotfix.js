// DA Mentor Pro v1.0.1 — repair-flow correction.
// A Developing lesson remains review-accessible and routes to targeted repair.
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
