(()=>{
const MAP=window.V2_SOURCE_MAP||{};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function addReleaseCard(){const modal=document.querySelector('#settingsModal .card,#settingsModal .modalCard');if(!modal||modal.querySelector('.v2ReleaseCard'))return;const d=document.createElement('div');d.className='v2ReleaseCard';d.innerHTML='<b>2026 v2.0 teaching control</b><span class="v2Tag">Lesson book = authority</span><span class="v2Tag">Visuals = support</span><span class="v2Tag">Attempt before review</span><span class="v2Tag">Fresh retest after repair</span><div>AMOLED Black is forced to true black in this release. Your existing progress/backup data model is preserved.</div>';const row=modal.querySelector('.row:last-child');modal.insertBefore(d,row||null)}
function lessonIdFor(row,i){
 if(row.dataset?.lessonId)return row.dataset.lessonId;
 const direct=row.querySelector('[data-lesson]')?.dataset?.lesson;
 if(direct&&MAP[direct])return direct;
 const text=(row.textContent||'');let m=text.match(/\b(C3-\d{2}-L\d{2}|[A-Z]{2,5}\d{1,2})\b/);if(m&&MAP[m[1]])return m[1];
 if(window.BRIDGE_CURRICULUM&&typeof phaseObj==='function'){const p=phaseObj();const id=p?.id+'-L'+String(i+1).padStart(2,'0');if(MAP[id])return id}
 return null;
}
function decorate(){const list=document.querySelectorAll('#lessonList .lessonRow,#lessonList .lesson,#schedule .item');list.forEach((row,i)=>{if(row.querySelector(':scope .v2SourceLine'))return;const id=lessonIdFor(row,i);const v=id&&MAP[id];if(!v)return;const host=row.querySelector('.grow')||row.querySelector('span')||row;const line=document.createElement('div');line.className='v2SourceLine';const kind=(v.kind||'').includes('VIDEO')?'Visual support':'Official reference';line.innerHTML=`<a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${kind}: ${esc(v.title)}</a>${v.scope?` <span class="v2SourceStatus">• ${esc(v.scope)}</span>`:''}`;host.appendChild(line)})}
function syncTheme(){try{const t=(typeof D!=='undefined'&&D?.theme)||(typeof state!=='undefined'&&state?.theme)||(typeof s!=='undefined'&&s?.theme)||document.body.dataset.theme;if(t)document.body.dataset.theme=t}catch{}}
function run(){addReleaseCard();syncTheme();decorate()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();new MutationObserver(run).observe(document.body,{childList:true,subtree:true})},{once:true});else{run();new MutationObserver(run).observe(document.body,{childList:true,subtree:true})}
})();
