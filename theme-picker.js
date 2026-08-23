(()=>{
  const picker=document.getElementById('proThemeSelect');
  const settingsTheme=document.getElementById('themeInput');
  if(!picker)return;
  const sync=()=>{const current=(typeof state!=='undefined'&&state.theme)||document.body.dataset.theme||'midnight';picker.value=current;if(settingsTheme)settingsTheme.value=current;};
  picker.addEventListener('change',()=>{
    if(typeof state==='undefined')return;
    state.theme=picker.value;
    if(settingsTheme)settingsTheme.value=state.theme;
    if(typeof save==='function')save();
    sync();
  });
  document.getElementById('settingsBtn')?.addEventListener('click',()=>setTimeout(sync,0));
  document.getElementById('saveSettingsBtn')?.addEventListener('click',()=>setTimeout(sync,0));
  sync();
})();
