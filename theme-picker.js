document.addEventListener('DOMContentLoaded',()=>{
  const names={amoled:'AMOLED Black',midnight:'Midnight',slate:'Slate',forest:'Forest',ocean:'Ocean',ember:'Ember',graphite:'Graphite'};
  const desc={amoled:'Pure black, lowest glow',midnight:'Deep neutral violet',slate:'Cool professional',forest:'Muted green',ocean:'Muted blue',ember:'Warm restrained',graphite:'Minimal monochrome'};
  const swatches={amoled:'linear-gradient(135deg,#000,#202226)',midnight:'linear-gradient(135deg,#080a10,#252a35)',slate:'linear-gradient(135deg,#0c0f13,#2a3139)',forest:'linear-gradient(135deg,#080d0b,#25332c)',ocean:'linear-gradient(135deg,#070c10,#25323a)',ember:'linear-gradient(135deg,#0d0907,#342921)',graphite:'linear-gradient(135deg,#090a0c,#2b2e33)'};
  const settings=document.getElementById('themeInput');
  if(settings)settings.innerHTML=Object.entries(names).map(([v,t])=>`<option value="${v}">${t}</option>`).join('');

  const trigger=document.getElementById('proThemeMenuBtn');
  const pop=document.getElementById('proThemePopover');
  const grid=pop?.querySelector('.proThemeGrid');
  const current=document.getElementById('proThemeCurrent');
  if(grid)grid.innerHTML=Object.keys(names).map(k=>`<button type="button" data-advance-theme="${k}"><i class="proSwatch" style="background:${swatches[k]}"></i><span>${names[k]}<small>${desc[k]}</small></span></button>`).join('');

  const style=document.createElement('style');style.textContent=`.proSettingsThemes{margin:12px 0}.proSettingsThemes>span{display:block;margin-bottom:8px}.proSettingsThemeGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.proSettingsThemeCard{display:flex;gap:9px;align-items:center;text-align:left;border:1px solid var(--bd);background:var(--panel2);color:var(--txt);border-radius:12px;padding:9px;cursor:pointer}.proSettingsThemeCard.active,.proThemeGrid button.active{outline:1px solid var(--accent);border-color:var(--accent)}.proSettingsThemeCard i{width:34px;height:34px;border-radius:10px;flex:0 0 34px;border:1px solid var(--bd)}.proSettingsThemeCard b,.proSettingsThemeCard small{display:block}.proSettingsThemeCard small{color:var(--mut);margin-top:2px}@media(max-width:560px){.proSettingsThemeGrid{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  const modal=document.querySelector('#settingsModal .modalCard');let gallery=document.getElementById('advanceSettingsThemes');
  if(modal&&!gallery){const themeLabel=settings?.closest('label');if(themeLabel)themeLabel.style.display='none';gallery=document.createElement('div');gallery.id='advanceSettingsThemes';gallery.className='proSettingsThemes';gallery.innerHTML=`<span class="muted tiny">Appearance</span><div class="proSettingsThemeGrid">${Object.keys(names).map(k=>`<button type="button" class="proSettingsThemeCard" data-advance-settings-theme="${k}"><i style="background:${swatches[k]}"></i><span><b>${names[k]}</b><small>${desc[k]}</small></span></button>`).join('')}</div>`;const saveRow=document.getElementById('saveSettingsBtn')?.parentElement;modal.insertBefore(gallery,saveRow||null)}

  function selected(){return (typeof state!=='undefined'&&state&&state.theme)||document.body.dataset.theme||'midnight'}
  function apply(t){if(typeof state==='undefined'||!state)return;state.theme=t;if(settings)settings.value=t;if(typeof save==='function')save();sync()}
  function sync(){const t=selected();document.body.dataset.theme=t;if(current)current.textContent=names[t]||t;if(settings)settings.value=t;document.querySelectorAll('[data-advance-theme]').forEach(b=>b.classList.toggle('active',b.dataset.advanceTheme===t));document.querySelectorAll('[data-advance-settings-theme]').forEach(b=>b.classList.toggle('active',b.dataset.advanceSettingsTheme===t))}

  trigger?.addEventListener('click',e=>{e.stopPropagation();pop?.classList.toggle('show');sync()});
  grid?.addEventListener('click',e=>{const b=e.target.closest('[data-advance-theme]');if(!b)return;apply(b.dataset.advanceTheme);pop?.classList.remove('show')});
  gallery?.addEventListener('click',e=>{const b=e.target.closest('[data-advance-settings-theme]');if(!b)return;apply(b.dataset.advanceSettingsTheme)});
  document.addEventListener('click',e=>{if(pop?.classList.contains('show')&&!pop.contains(e.target)&&e.target!==trigger)pop.classList.remove('show')});
  document.getElementById('settingsBtn')?.addEventListener('click',()=>setTimeout(sync,0));
  document.getElementById('saveSettingsBtn')?.addEventListener('click',()=>setTimeout(sync,0));
  sync();
});