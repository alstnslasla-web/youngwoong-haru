/* Bump VERSION on every shell deployment. Dynamic JSON is deliberately never cached. */
'use strict';
const VERSION='v2.1.0';
const SCOPE=new URL(self.registration.scope).pathname;
const PREFIX='youngwoong-everyday-'+encodeURIComponent(SCOPE)+'-';
const SHELL=PREFIX+VERSION, MEDIA=PREFIX+'media';
const FILES=['./','./index.html','./app.css','./app.js','./data.js','./wellness.js','./wellness-data.js','./companion.js','./health.js','./updates.js','./voice.js','./voice-reference.wav','./voice-day.wav','./voice-evening.wav','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
const URLS=FILES.map(p=>new URL(p,self.registration.scope).href), SHELL_URLS=new Set(URLS);
const IMAGE_HOSTS=new Set(['i.ytimg.com','www.mulgogimusic.com','mulgogimusic.com']);
let mediaQueue=Promise.resolve();
async function ready(){try{const cache=await caches.open(SHELL);return (await Promise.all(URLS.map(u=>cache.match(u)))).every(Boolean);}catch{return false;}}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 try{const cache=await caches.open(SHELL);await cache.addAll(URLS.map(u=>new Request(u,{cache:'reload',credentials:'same-origin'})));if(!await ready())throw Error('Incomplete offline shell');}
 catch(error){await caches.delete(SHELL);throw error;}
 // No unconditional skipWaiting: the page waits for its safe point.
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='CHECK_OFFLINE')event.waitUntil((async()=>{const complete=await ready();event.source?.postMessage({type:'OFFLINE_STATUS',ready:complete,version:VERSION});})());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 if(!await ready())throw Error('Offline shell missing');
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==SHELL&&key!==MEDIA)await caches.delete(key);
 await self.clients.claim();
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of clients)if(client.url.startsWith(self.registration.scope))client.postMessage({type:'OFFLINE_STATUS',ready:true,version:VERSION});
})()));
function queueMedia(fn){const job=mediaQueue.then(fn);mediaQueue=job.catch(()=>{});return job;}
async function trim(cache){const keys=await cache.keys();for(let i=0;i<keys.length-60;i++)await cache.delete(keys[i]);}
async function image(request){
 const cache=await caches.open(MEDIA), hit=await cache.match(request);
 if(hit){await queueMedia(async()=>{await cache.delete(request);await cache.put(request,hit.clone());await trim(cache);}).catch(()=>{});return hit;}
 const response=await fetch(request);
 if((response.ok||response.type==='opaque')&&(!response.url||(()=>{try{const u=new URL(response.url);return u.protocol==='https:'&&IMAGE_HOSTS.has(u.hostname)&&!u.port;}catch{return false;}})())){
  await queueMedia(async()=>{await cache.put(request,response.clone());await trim(cache);}).catch(()=>{});
 }
 return response;
}
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;const u=new URL(request.url);
 if(u.origin===self.location.origin){
  // All JSON (media, schedules, future feeds) bypasses the worker and its caches.
  if(/\.json$/i.test(u.pathname))return;
  let key=u.href;
  if(request.mode==='navigate'&&(u.pathname===SCOPE||u.pathname===SCOPE+'index.html'))key=new URL('./index.html',self.registration.scope).href;
  if(!SHELL_URLS.has(key))return;
  event.respondWith((async()=>{
   const cache=await caches.open(SHELL), hit=await cache.match(key);
   // Never silently mix a newly deployed file with an old cached shell.
   return hit||new Response('Offline preparation incomplete. Reopen online to update.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  })());return;
 }
 if(request.destination==='image'&&u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&IMAGE_HOSTS.has(u.hostname))event.respondWith(image(request));
});
