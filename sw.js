'use strict';
const CACHE='free-flomo-shell-v4';
const SHELL=new URL('./index.html',self.location).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.add(new Request(SHELL,{cache:'reload'}))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('free-flomo-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.mode!=='navigate')return;
 const base=new URL('./',self.location).pathname;
 if(url.pathname!==base&&url.pathname!==base+'index.html')return;
 event.respondWith(fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put(SHELL,response.clone())}return response}).catch(async()=>{const cached=await caches.match(SHELL);return cached||new Response('请先联网打开一次免费浮墨。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})}));
});
