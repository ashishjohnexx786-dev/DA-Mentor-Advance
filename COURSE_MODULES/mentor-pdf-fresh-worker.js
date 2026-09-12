const PDF_RELEASE='20260912-r6';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin || !url.pathname.toLowerCase().endsWith('.pdf')) return;
  if(url.searchParams.get('mentor_pdf_v')!==PDF_RELEASE){
    url.searchParams.set('mentor_pdf_v',PDF_RELEASE);
    event.respondWith(Response.redirect(url.href,302));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}));
});
