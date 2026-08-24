(()=>{
  const RECOMMENDED=new Set(["AX5","AX6","AX7","AX8","AX9","PBM-A4","PBM-A5","PBM-A6","PBM-A7","PBM-A8","PBM-A10","DAX5","DAX11","DAX12","DAX13","DAX14","DAX15","CLD3","CLD4","CLD5","CLD6","CLD7","CLD9","PL1","PL2","PL3","PL4","PL5","PL6","PL7","PL8"]);
  const status=id=>RECOMMENDED.has(id)?"☑ Recommended visual":"☐ Not required";
  function applyData(){if(typeof COURSE2!=="undefined")COURSE2.forEach(p=>p.lessons.forEach(l=>l.videoStatus=status(l.id)));}
  function decorate(){
    const p=typeof phaseObj==="function"?phaseObj(state.currentPhase):null;if(!p)return;
    document.querySelectorAll("#lessonList .lessonRow").forEach((row,i)=>{
      row.querySelector(".courseVideoStatus")?.remove();const l=p.lessons[i];if(!l)return;
      const el=document.createElement("div");el.className="muted tiny courseVideoStatus";el.textContent=`Video: ${l.videoStatus||status(l.id)}`;
      row.querySelector(".grow")?.appendChild(el);
    });
  }
  function loadOptionalVideos(){
    if(!document.querySelector('link[data-optional-videos]')){const l=document.createElement('link');l.rel='stylesheet';l.href='./optional-videos.css';l.dataset.optionalVideos='1';document.head.appendChild(l);}
    if(window.OPTIONAL_VIDEO_MAP){if(!document.querySelector('script[data-optional-video-ui]')){const u=document.createElement('script');u.src='./optional-videos-ui.js';u.dataset.optionalVideoUi='1';document.body.appendChild(u);}return;}
    if(!document.querySelector('script[data-optional-video-map]')){const m=document.createElement('script');m.src='./optional-videos.js';m.dataset.optionalVideoMap='1';m.onload=()=>{if(!document.querySelector('script[data-optional-video-ui]')){const u=document.createElement('script');u.src='./optional-videos-ui.js';u.dataset.optionalVideoUi='1';document.body.appendChild(u);}};document.body.appendChild(m);}
  }
  function install(){
    applyData();const style=document.createElement("style");style.textContent=".courseVideoStatus{margin-top:4px;font-weight:650}";document.head.appendChild(style);
    if(typeof render==="function"){const base=render;render=function(){base();decorate()};render();}
    const b=document.getElementById("backupBtn");if(b)b.onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`DA_Mentor_Advance_Backup_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
    const reset=document.getElementById("resetBtn");if(reset)reset.onclick=()=>{if(confirm("Reset all DA Mentor Advance progress on this device?")){state=fresh();save();document.getElementById("settingsModal")?.classList.remove("show")}};
    loadOptionalVideos();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
})();
