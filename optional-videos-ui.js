(()=>{
  const MAP=window.OPTIONAL_VIDEO_MAP||{};
  const POLICY='Optional reinforcement only — skipping videos never affects lesson mastery, practice, Gates, progression, or course completion.';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function lessonId(row){
    const direct=row.querySelector('[data-lesson]');
    if(direct?.dataset?.lesson)return direct.dataset.lesson;
    const unit=row.querySelector('[data-unit]');
    if(unit){
      const b=row.querySelector('b');
      const m=(b?.textContent||'').match(/[—-]\s*([A-Za-z]+(?:-[A-Za-z]+)?\d+(?:-L\d+)?)/);
      if(m)return m[1];
    }
    return null;
  }
  function isRecommended(row){
    return (row.querySelector('.courseVideoStatus')?.textContent||'').includes('Recommended visual');
  }
  function decorate(row){
    if(row.querySelector(':scope .optionalVideoBox'))return;
    if(!isRecommended(row))return;
    const id=lessonId(row),videos=id&&MAP[id];
    if(!videos?.length)return;
    const host=row.querySelector('.grow')||row;
    const box=document.createElement('div');
    box.className='optionalVideoBox';
    const links=videos.map((v,i)=>`<a class="optionalVideoLink" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">🎥 ${videos.length>1?`Optional video ${i+1}`:'Optional video'}: ${esc(v.title)}</a><span class="optionalVideoMeta">${esc(v.provider||'')} ${v.scope?`• ${esc(v.scope)}`:''}</span>`).join('');
    box.innerHTML=`<div class="optionalVideoHead"><b>Optional visual help</b><span>Skip freely</span></div><div class="optionalVideoLinks">${links}</div><div class="optionalVideoPolicy">${POLICY}</div>`;
    host.appendChild(box);
  }
  function apply(){document.querySelectorAll('.lessonRow,#schedule .item').forEach(decorate);}
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
  const obs=new MutationObserver(schedule);
  const start=()=>{apply();obs.observe(document.body,{subtree:true,childList:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
