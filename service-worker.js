const CACHE='da-mentor-advance-unified-2026-09-09-v2';
const ASSETS=[
  './',
  './index.html',
  './unified-style.css',
  './mentor-config.js',
  './unified-app-pack.js',
  './unified-app-gz-loader.js',
  './curriculum.js',
  './manifest.webmanifest',
  './icon.svg'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const x=r.clone();
      caches.open(CACHE).then(c=>c.put('./index.html',x));
      return r;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
    if(r&&r.ok){const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));}
    return r;
  }).catch(()=>caches.match(e.request)));
});
