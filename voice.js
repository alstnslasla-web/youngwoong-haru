/* Public pre-generated AI narration. No synthesis, text upload, or device voice. */
(() => {
'use strict';
const NOTICE='제공된 AI 샘플을 바탕으로 만든 합성 음성입니다. 실제 임영웅의 녹음·발언·의료 추천이 아닙니다.';
const REF_TEXT='은자야. 좋은 아침이야.';
const PREFIX={src:'./voice-eunja-prefix.mp3',text:'은자야.'};
const DAY_TEXT='AI로 만든 팬 인사예요. 반가워요. 좋아하는 노래 한 곡 들으며 잠깐 쉬어 가세요. 오늘도 편안한 하루 보내세요.';
const EVENING_TEXT='은자야. 잘 자. 좋은 꿈 꿔. 오늘 하루도 고생했어.';
const PACKS={morning:{src:'./voice-morning.mp3',text:REF_TEXT},day:{src:'./voice-day.wav',text:DAY_TEXT},evening:{src:'./voice-night.mp3',text:EVENING_TEXT},night:{src:'./voice-night.mp3',text:EVENING_TEXT}};
const MODEL='Qwen/Qwen3-TTS-12Hz-0.6B-Base', REFERENCE='39eb74c151d439ea2f41ad53a7e11560cfe407793d8323be3a2e30d5193d5cb5', COMMIT='022e286b98fbec7e1e916cb940cdf532cd9f488e';
const VERSION='public-cpu-v1:'+MODEL+':'+REFERENCE;
const WAV_BYTES=6*1024*1024;
const MAX_BYTES=2*1024*1024, INDEX_BYTES=1024*1024, CACHE_BYTES=30*1024*1024, MAX_CHUNKS=12, TIMEOUT=20000, CATALOG_TTL=15*60*1000;
const UNREADY='이 안내의 음성은 아직 준비 중이에요. 화면 글을 확인하거나 준비된 인사를 이용해 주세요.';
const SETTINGS_TEXT="은자님 전용 AI 안내예요. 제공된 AI 샘플로 만든 합성 음성이며 실제 임영웅의 녹음·발언·의료 추천이 아니에요. 개인 기록은 읽거나 외부로 보내지 않아요. 준비된 호칭과 공개 안내만 재생해요. 인터넷에서 처음 내려받고, 저장된 음성만 오프라인으로 들어요.";
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cutText(text){
 let points=Array.from(text), partial=points.length>3000;points=points.slice(0,3000);const chunks=[];
 while(points.length&&chunks.length<MAX_CHUNKS){let end=Math.min(160,points.length);if(end<points.length){let boundary=0;for(let i=0;i<end;i++)if(/[.!?。！？\s]/u.test(points[i]))boundary=i+1;if(boundary>=40)end=boundary;}const part=points.splice(0,end).join('').trim();if(part)chunks.push(part);}
 return {chunks,partial:partial||points.length>0};
}
async function sha(text){const value=await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(value)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function safeURL(src){const u=new URL(src,document.baseURI);if(u.protocol!=='https:'||u.origin!==location.origin||u.username||u.password||u.search||u.hash)throw new Error(UNREADY);return u.href;}
/* Real MPEG-2 Layer III frames, 24 kHz mono, not HTML or an ID3-only payload. */
async function mp3(blob){
 if(!(blob instanceof Blob)||blob.size<24||blob.size>MAX_BYTES)throw new Error(UNREADY);
 const b=new Uint8Array(await blob.arrayBuffer());let pos=0,frames=0;
 if(b[0]===73&&b[1]===68&&b[2]===51){if(b.length<10||b[3]<2||b[3]>4||[b[6],b[7],b[8],b[9]].some(x=>x>127))throw new Error(UNREADY);pos=10+((b[6]<<21)|(b[7]<<14)|(b[8]<<7)|b[9])+((b[3]===4&&(b[5]&16))?10:0);}
 while(pos<b.length){
  if(b.length-pos===128&&b[pos]===84&&b[pos+1]===65&&b[pos+2]===71)break;
  if(pos+4>b.length||b[pos]!==255||(b[pos+1]&254)!==242||(b[pos+2]&12)!==4||(b[pos+3]>>6)!==3)throw new Error(UNREADY);
  const rate=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0][b[pos+2]>>4];if(!rate)throw new Error(UNREADY);
  const size=Math.floor(72000*rate/24000)+((b[pos+2]>>1)&1);if(size<4||pos+size>b.length)throw new Error(UNREADY);pos+=size;frames++;
 }
 if(!frames)throw new Error(UNREADY);return blob;
}
/* Fixed day asset: bounded RIFF PCM16, 24 kHz mono. Never pass unvalidated remote WAV to Audio. */
async function wav(blob){
 if(!(blob instanceof Blob)||blob.size<44||blob.size>WAV_BYTES)throw new Error(UNREADY);
 const b=new Uint8Array(await blob.arrayBuffer()),v=new DataView(b.buffer);const tag=i=>String.fromCharCode(...b.subarray(i,i+4));
 if(tag(0)!=='RIFF'||tag(8)!=='WAVE'||v.getUint32(4,true)!==b.length-8)throw new Error(UNREADY);
 let pos=12,format=false,data=false;
 while(pos<b.length){if(pos+8>b.length)throw new Error(UNREADY);const name=tag(pos),size=v.getUint32(pos+4,true),start=pos+8,end=start+size;if(end>b.length)throw new Error(UNREADY);
  if(name==='fmt '){if(format||size<16||v.getUint16(start,true)!==1||v.getUint16(start+2,true)!==1||v.getUint32(start+4,true)!==24000||v.getUint32(start+8,true)!==48000||v.getUint16(start+12,true)!==2||v.getUint16(start+14,true)!==16)throw new Error(UNREADY);format=true;}
  if(name==='data'){if(data||!size||size%2)throw new Error(UNREADY);data=true;}
  pos=end+(size%2);if(pos>b.length)throw new Error(UNREADY);
 }
 if(!format||!data)throw new Error(UNREADY);return blob;
}
async function validateIndex(value){
 if(!value||value.version!==1||value.hashAlgorithm!=='SHA-256'||value.model!==MODEL||value.vendorCommit!==COMMIT||value.referenceSha256!==REFERENCE||!value.clips||typeof value.clips!=='object'||Array.isArray(value.clips)||!Array.isArray(value.entries)||value.entries.length>1500)throw new Error(UNREADY);
 const rows=Object.entries(value.clips);if(rows.length>1500)throw new Error(UNREADY);const clips=new Map();
 for(const [hash,c] of rows){
  if(!/^[a-f0-9]{64}$/.test(hash)||!c||typeof c.text!=='string'||!c.text||Array.from(c.text).length>160||c.text.trim()!==c.text||await sha(c.text)!==hash||c.src!=='./voice-clips/'+hash+'.mp3'||!Number.isInteger(c.bytes)||c.bytes<24||c.bytes>MAX_BYTES||!Number.isFinite(c.durationSeconds)||c.durationSeconds<=0||c.durationSeconds>180||c.codec!=='mp3'||c.sampleRate!==24000||c.channels!==1)throw new Error(UNREADY);
  clips.set(hash,{text:c.text,src:safeURL(c.src),bytes:c.bytes});
 }
 // Entries are descriptive, not a trust bypass. Every exact requested chunk is checked.
 for(const e of value.entries){if(!e||typeof e.id!=='string'||!e.id||e.id.length>200||typeof e.text!=='string'||e.text.length>30000||!Array.isArray(e.chunks)||e.chunks.length>MAX_CHUNKS||e.chunks.some(c=>typeof c!=='string'||c.length>320)||typeof e.partial!=='boolean'||typeof e.complete!=='boolean')throw new Error(UNREADY);}
 return clips;
}
window.createHeroVoice=function createHeroVoice(api={}){
 const toast=message=>{try{api.toast?.(message);}catch{}};
 let serial=0,controller=null,audio=null,finishPlay=null,objectURL=null,ready=null,retry=null,busy=false,lastRequest=0,catalog=null,catalogAt=0;
 let state={phase:'idle',message:'버튼을 누르면 미리 준비된 공개 AI 안내를 들어요. 첫 다운로드는 인터넷, 오프라인은 저장된 음성만 이용해요.'};const listeners=new Set();let dbPromise=null;
 function status(phase,message){state={phase,message};for(const fn of listeners){try{fn({...state});}catch{}}}
 function alive(id){return id===serial&&!controller?.signal.aborted;}
 function abortError(){const e=new Error('읽기를 멈췄어요.');e.name='AbortError';return e;}
 function assert(id){if(!alive(id))throw abortError();}
 function audioCleanup(){if(audio){audio.onended=null;audio.onerror=null;audio.onplaying=null;try{audio.pause();audio.removeAttribute('src');audio.load();}catch{}audio=null;}if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}}
 function stop(){serial++;controller?.abort();controller=null;const done=finishPlay;finishPlay=null;audioCleanup();ready=null;retry=null;busy=false;done?.(false);status('idle','읽기를 멈췄어요. 다시 듣기는 버튼을 눌러 주세요.');}
 function deadline(promise,ms=1500){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('저장소 응답 지연')),ms);Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v);},e=>{clearTimeout(timer);reject(e);});});}
 async function database(){if(dbPromise)return dbPromise;dbPromise=deadline(new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('저장소 없음'));return;}const req=window.indexedDB.open('hero-public-ai-voice-v1',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('clips'))req.result.createObjectStore('clips',{keyPath:'key'});};req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('저장소 잠김'));req.onsuccess=()=>resolve(req.result);})).catch(()=>null);return dbPromise;}
 async function cacheKey(text){return sha(VERSION+'\n'+text);}
 async function cacheGet(text){try{const db=await database();if(!db)return null;const key=await cacheKey(text);const entry=await deadline(new Promise((resolve,reject)=>{const req=db.transaction('clips','readonly').objectStore('clips').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}));if(entry?.text!==text||entry?.version!==VERSION||entry?.size!==entry?.blob?.size)return null;await mp3(entry.blob);try{db.transaction('clips','readwrite').objectStore('clips').put({...entry,used:Date.now()});}catch{}return entry.blob;}catch{return null;}}
 async function cachePut(text,blob){try{const db=await database();if(!db)return;const key=await cacheKey(text);await deadline(new Promise((resolve,reject)=>{const tx=db.transaction('clips','readwrite'),store=tx.objectStore('clips');store.put({key,text,version:VERSION,blob,size:blob.size,used:Date.now()});const req=store.getAll();req.onsuccess=()=>{const rows=req.result.sort((a,b)=>b.used-a.used);let bytes=0;rows.forEach((row,i)=>{bytes+=row.size||row.blob?.size||0;if(i>=50||bytes>CACHE_BYTES)store.delete(row.key);});};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));}catch{/* Storage denial/full must not prevent playback. */}}
 async function bounded(url,limit,id,type){
  assert(id);const outer=controller.signal,local=new AbortController();let reader=null,timer;
  const cancel=()=>local.abort();outer.addEventListener('abort',cancel,{once:true});
  const work=(async()=>{const response=await fetch(safeURL(url),{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:local.signal});assert(id);
   if(!response.ok||(response.url&&response.url!==safeURL(url)))throw new Error(UNREADY);
   const length=response.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>limit))throw new Error(UNREADY);
   const mime=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(type==='index'&&mime&&!['application/json','text/plain'].includes(mime))throw new Error(UNREADY);if(type==='audio'&&mime&&!['audio/mpeg','audio/mp3','application/octet-stream'].includes(mime))throw new Error(UNREADY);if(type==='wav'&&mime&&!['audio/wav','audio/wave','audio/x-wav','application/octet-stream'].includes(mime))throw new Error(UNREADY);
   if(!response.body?.getReader)throw new Error(UNREADY);reader=response.body.getReader();const chunks=[];let size=0;
   while(true){assert(id);if(local.signal.aborted)throw abortError();const part=await reader.read();assert(id);if(part.done)break;size+=part.value.byteLength;if(size>limit)throw new Error(UNREADY);chunks.push(part.value);}
   if(!size)throw new Error(UNREADY);return new Blob(chunks,{type:type==='audio'?'audio/mpeg':type==='wav'?'audio/wav':'application/json'});
  })();
  let abortListener;const cancelled=new Promise((resolve,reject)=>{abortListener=()=>reject(abortError());local.signal.addEventListener('abort',abortListener,{once:true});timer=setTimeout(()=>local.abort(),TIMEOUT);});
  try{return await Promise.race([work,cancelled]);}catch(error){assert(id);throw new Error(UNREADY);}finally{clearTimeout(timer);outer.removeEventListener('abort',cancel);local.signal.removeEventListener('abort',abortListener);local.abort();try{reader?.cancel()?.catch?.(()=>{});}catch{}}
 }
 async function getCatalog(id){
  if(catalog&&Date.now()-catalogAt<CATALOG_TTL)return catalog;
  try{if(navigator.onLine===false)throw new Error(UNREADY);const blob=await bounded('./voice-index.json',INDEX_BYTES,id,'index');const text=new TextDecoder('utf-8',{fatal:true}).decode(await blob.arrayBuffer());const validated=await validateIndex(JSON.parse(text));assert(id);catalog=validated;catalogAt=Date.now();return catalog;}catch(error){assert(id);if(catalog)return catalog;throw new Error(UNREADY);}
 }
 async function preflight(chunks,id){
  const result=[];let index=null;
  for(const text of chunks){assert(id);const blob=await cacheGet(text);assert(id);result.push({text,blob});}
  if(result.some(r=>!r.blob)){index=await getCatalog(id);assert(id);for(const row of result){if(row.blob)continue;const clip=index.get(await sha(row.text));assert(id);if(!clip||clip.text!==row.text||navigator.onLine===false)throw new Error(UNREADY);row.clip=clip;}}
  return result;
 }
 async function prefixBlob(id){const blob=await bounded(PREFIX.src,MAX_BYTES,id,'audio');assert(id);await mp3(blob);assert(id);return blob;}
 function play(source,id,session){assert(id);return new Promise(resolve=>{
  let completed=false,started=false,watchdog=null;const a=new Audio();audio=a;a.preload='auto';a.defaultPlaybackRate=.9;a.playbackRate=.9;a.preservesPitch=true;
  if(source instanceof Blob){objectURL=URL.createObjectURL(source);a.src=objectURL;}else a.src=safeURL(source);
  function done(ok){if(completed)return;completed=true;clearTimeout(watchdog);if(finishPlay===done)finishPlay=null;if(audio===a)audioCleanup();ready=null;resolve(ok);}
  finishPlay=done;a.onended=()=>done(started&&alive(id));a.onerror=()=>{if(alive(id))status('error','음성 파일을 재생하지 못했어요. 파일이 없거나 연결이 끊겼을 수 있어요.');done(false);};a.onplaying=()=>{if(!alive(id)){done(false);return;}started=true;session.started=true;clearTimeout(watchdog);status('playing','미리 준비된 공개 AI 안내를 읽고 있어요.');};
  function begin(){if(!alive(id)){done(false);return;}ready=null;status('loading','음성을 준비하고 있어요.');watchdog=setTimeout(()=>{if(alive(id))status('error','음성 파일을 불러오지 못했어요. 연결을 확인해 주세요.');done(false);},30000);Promise.resolve().then(()=>{assert(id);return a.play();}).catch(error=>{clearTimeout(watchdog);if(!alive(id)){done(false);return;}if(error?.name==='NotAllowedError'){ready=begin;status('ready','음성이 준비됐어요. 재생 버튼을 눌러 주세요.');}else{status('error','음성을 재생하지 못했어요. 다시 눌러 주세요.');done(false);}});}
  // Capture activation at the explicit start, before asynchronous downloads consume it.
  if(session.started||(session.clicked&&navigator.userActivation?.isActive===true))begin();else{ready=begin;status('ready','음성이 준비됐어요. 재생 버튼을 눌러 주세요.');}
 });}
 async function speak(input,opts={}){
  const text=typeof input==='string'?input.trim():'';if(!text){toast('읽을 공개 안내가 없어요.');return false;}
  const pack=Object.values(PACKS).find(entry=>entry.text===text);
  if(opts.public!==true&&!pack){toast('개인 기록은 보내거나 읽지 않아요.');return false;}
  if(document.hidden)return false;
  if(busy&&Date.now()-lastRequest<650){toast('음성 안내를 준비 중이에요. 멈춘 뒤 다시 눌러 주세요.');return false;}
  const session={clicked:navigator.userActivation?.isActive===true,started:false};
  stop();const id=serial;controller=new AbortController();busy=true;lastRequest=Date.now();let partial=false,wasPlayed=false;
  try{
   if(pack){status('loading','준비된 AI 인사를 불러오고 있어요.');
    if(pack===PACKS.day){const prefix=await prefixBlob(id);const day=await bounded(pack.src,WAV_BYTES,id,'wav');assert(id);await wav(day);assert(id);wasPlayed=await play(prefix,id,session);assert(id);if(!wasPlayed)throw new Error('준비된 호칭을 재생하지 못했어요.');wasPlayed=await play(day,id,session);}
    else {const greeting=await bounded(pack.src,MAX_BYTES,id,'audio');assert(id);await mp3(greeting);assert(id);wasPlayed=await play(greeting,id,session);}
    assert(id);if(!wasPlayed)throw new Error('준비된 인사 파일을 재생하지 못했어요. 다른 문구로 대신 재생하지 않았어요.');}
   else {const parts=cutText(text);partial=parts.partial;if(partial||!parts.chunks.length)throw new Error(UNREADY);
    status('loading','이 안내의 모든 음성이 준비됐는지 확인하고 있어요.');const rows=await preflight(parts.chunks,id);assert(id);
    // Download ALL clips too, so a failed transfer cannot start half a safety guide.
    for(let i=0;i<rows.length;i++){assert(id);const row=rows[i];if(!row.blob){status('loading','공개 안내 다운로드 '+(i+1)+' / '+rows.length);row.blob=await bounded(row.clip.src,MAX_BYTES,id,'audio');assert(id);if(row.blob.size!==row.clip.bytes)throw new Error(UNREADY);await mp3(row.blob);assert(id);await cachePut(row.text,row.blob);assert(id);}}
    const prefix=await prefixBlob(id);assert(id);
    if(partial)toast('긴 안내라 앞부분만 읽는 부분 안내예요. 전체 내용은 화면에서 확인해 주세요.');
    wasPlayed=await play(prefix,id,session);assert(id);if(!wasPlayed)throw new Error('준비된 호칭을 재생하지 못했어요.');
    for(let i=0;i<rows.length;i++){assert(id);wasPlayed=await play(rows[i].blob,id,session);assert(id);if(!wasPlayed)throw new Error('이 안내를 재생하지 못했어요. 다시 눌러 주세요.');}
   }
   status('done',partial?'부분 안내를 마쳤어요. 전체 내용은 화면에서 확인해 주세요.':'준비된 AI 안내를 다 읽었어요.');return wasPlayed;
  }catch(error){if(id!==serial)return false;const message=error?.name==='AbortError'?'음성 준비가 중단됐어요. 다시 눌러 주세요.':(error?.message||UNREADY);retry={text,public:opts.public===true||!!pack};status('error',message);toast(message);return false;}finally{if(id===serial){busy=false;controller=null;status(state.phase,state.message);}}
 }
 function greet(period){const pack=PACKS[period];if(!pack){toast('이 시간대에 준비된 인사가 없어요.');return Promise.resolve(false);}return speak(pack.text,{public:true});}
 function statusHTML(){return '<div class="hv-status" data-hv-phase="'+escapeHTML(state.phase)+'"><p aria-live="polite">'+escapeHTML(state.message)+'</p>'+(busy?'<button type="button" class="btn slim" data-action="voice-stop">말 멈추기</button>':'')+(ready?'<button type="button" class="btn primary" data-hv-action="play">준비된 음성 재생</button>':'')+(retry?'<button type="button" class="btn" data-hv-action="retry">같은 안내 다시 시도</button>':'')+'</div>';}
 function open(){stop();api.modal?.('AI 음성 안내와 연결 상태','<section class="hv-settings"><p class="notice">'+NOTICE+'</p><p>은자님 전용으로 미리 준비한 고정 호칭 “은자야”와 공개 안내만 재생해요. 개인 기록이나 다른 이름, 새 문장을 보내거나 즉석에서 합성하지 않아요. 이 기기의 기본 음성이나 브라우저 음성으로 바꾸지 않아요.</p><p>첫 다운로드에는 인터넷이 필요해요. 이 기기에 저장 성공한 음성만 오프라인에서 다시 들을 수 있어요. 저장소를 지우면 다운로드한 음성도 사라질 수 있어요.</p><p>앱의 인사와 안내 음성은 고정 호칭 “은자야”로 시작해요. 아침·밤 인사는 호칭이 이미 들어 있어 한 번만 재생해요. 낮 인사와 공개 안내는 호칭 파일과 본문을 모두 준비한 뒤 함께 들어요. 실제 가수와의 대화가 아니며 의료 추천도 아니에요.</p><div data-voice-status role="status">'+statusHTML()+'</div></section>',{publicNarration:()=>SETTINGS_TEXT});}
 document.addEventListener('click',event=>{const el=event.target?.closest?.('[data-hv-action]');if(!el)return;const action=el.dataset.hvAction;if(action==='play')ready?.();else if(action==='retry'&&retry){const next=retry;speak(next.text,{public:next.public});}});
 document.addEventListener('close',event=>{if(event.target?.tagName==='DIALOG')stop();},true);document.addEventListener('cancel',event=>{if(event.target?.tagName==='DIALOG')stop();},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);window.addEventListener('hashchange',stop);window.addEventListener('popstate',stop);
 if(!document.getElementById('hero-ai-voice-css')){const style=document.createElement('style');style.id='hero-ai-voice-css';style.textContent='.hv-status{padding:8px 0}.hv-status .btn{margin:8px 8px 0 0}.hv-settings>p{margin:16px 0}';document.head.appendChild(style);}
 return {speak,stop,greet,open,isBusy:()=>busy||!!audio||!!ready,read:text=>speak(text,{public:true}),statusHTML,onStatus(fn){if(typeof fn!=='function')return ()=>{};listeners.add(fn);try{fn({...state});}catch{}return ()=>listeners.delete(fn);}};
};
})();
