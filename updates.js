/* Official metadata synchronization and safe PWA updates. No background polling. */
(() => {
'use strict';
const CHANNEL='UC3WZlO2Zl8NE1yIUgtwUtQw', LIMIT=1500000, INTERVAL=15*60*1000, STALE=14*86400000;
const PHOTO_HOSTS=new Set(['mulgogimusic.com','www.mulgogimusic.com']);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=(x,max=240)=>typeof x==='string'?x.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,max):'';
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function date(x,required=false){
 if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(x)||!Number.isFinite(Date.parse(x))||Date.parse(x)>Date.now()+86400000){if(required)throw Error('확인 날짜가 올바르지 않아요.');return '';}
 const day=x.slice(0,10);if(new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day){if(required)throw Error('확인 날짜가 올바르지 않아요.');return '';}
 return x;
}
function url(raw,kind='source'){
 if(typeof raw!=='string'||raw.length>2048||/[\u0000-\u0020\\]/.test(raw))return '';
 try{
  const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return '';
  const h=u.hostname.toLowerCase();
  const photo=PHOTO_HOSTS.has(h);
  const youtube=['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(h);
  const cafe=['cafe.daum.net','m.cafe.daum.net'].includes(h)&&/^\/hero0616(?:\/|$)/.test(u.pathname);
  if(kind==='photo'?!photo:!(photo||youtube||cafe))return '';
  u.hash='';return u.href.replace(/'/g,'%27').replace(/"/g,'%22').replace(/</g,'%3C').replace(/>/g,'%3E');
 }catch{return '';}
}
function normalize(raw){
 if(typeof raw==='string'){if(new TextEncoder().encode(raw).length>LIMIT)throw Error('자료가 너무 커요.');raw=JSON.parse(raw);}
 if(!object(raw)||raw.version!==1||!Array.isArray(raw.videos)||!Array.isArray(raw.photos)||raw.videos.length>100||raw.photos.length>60)throw Error('사진·영상 자료 형식이 올바르지 않아요.');
 // The byte bound also protects backup imports. Only the whitelist below is retained.
 if(new TextEncoder().encode(JSON.stringify(raw)).length>LIMIT)throw Error('자료가 너무 커요.');
 const result={version:1,updatedAt:date(raw.updatedAt,true),checkedAt:date(raw.checkedAt,true),sourceName:text(raw.sourceName)||'공식 자료',videos:[],photos:[],checks:[]};
 const vids=new Set(), photos=new Set();
 for(const v of raw.videos){
  if(!object(v)||v.official!==true||v.channelId!==CHANNEL||!/^[-_A-Za-z0-9]{11}$/.test(v.videoId||'')||vids.has(v.videoId))throw Error('공식 영상 식별 정보를 확인하지 못했어요.');
  vids.add(v.videoId);
  const id=v.videoId, canonical='https://www.youtube.com/watch?v='+id;
  const sourceInput=v.sourceURL??v.sourceUrl??v.source??v.url;
  let source=canonical;
  if(sourceInput){source=url(sourceInput);if(!source)throw Error('영상 출처 주소가 올바르지 않아요.');const u=new URL(source);const linked=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname==='/watch'?u.searchParams.get('v'):/^\/(?:shorts|embed)\/([-_A-Za-z0-9]{11})$/.exec(u.pathname)?.[1];if(!linked||linked!==id||!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname))throw Error('영상 출처가 일치하지 않아요.');}
  const title=text(v.title)||text(v.name)||'공식 영상';
  result.videos.push({videoId:id,title,name:text(v.name)||title,channelName:text(v.channelName,80)||'임영웅',channelId:CHANNEL,official:true,publishDate:date(v.publishDate),publishDateKST:date(v.publishDateKST),durationSeconds:Number.isFinite(v.durationSeconds)?Math.max(0,Math.min(86400,Math.floor(v.durationSeconds))):0,thumbnailUrl:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg',url:canonical,sourceURL:canonical,category:['live','shorts','mv'].includes(v.category)?v.category:'video',mood:text(v.mood,40)||'편안한'});
 }
 for(const p of raw.photos){
  if(!object(p)||!/^[-_A-Za-z0-9]{1,80}$/.test(p.id||'')||photos.has(p.id))throw Error('사진 식별 정보가 올바르지 않아요.');
  const src=url(p.src??p.url,'photo'), source=url(p.sourceURL??p.sourceUrl??p.source??p.src??p.url,'photo');
  if(!src||!source)throw Error('공식 사이트 사진만 사용할 수 있어요.');
  photos.add(p.id);result.photos.push({id:p.id,title:text(p.title)||'공식 사진',src,source,sourceURL:source,credit:text(p.credit,120)||'물고기뮤직 공식 자료',kind:p.kind==='album'?'album':'photo'});
 }
 if(raw.checks!==undefined&&!Array.isArray(raw.checks))throw Error('확인 기록 형식이 올바르지 않아요.');
 if((raw.checks||[]).length>100)throw Error('확인 기록이 너무 많아요.');
 for(const c of raw.checks||[]){if(!object(c))throw Error('확인 기록이 올바르지 않아요.');const link=url(c.url);if(!link)throw Error('공식 확인 기록 주소가 올바르지 않아요.');result.checks.push({label:text(c.label),url:link,status:text(c.status,60),date:date(c.date)});}
 if(new TextEncoder().encode(JSON.stringify(result)).length>LIMIT)throw Error('저장 자료가 너무 커요.');
 return result;
}
window.createHeroUpdates=function(api){
 let initialized=false, stopped=false, running=null, controller=null, reg=null, waiting=null, intended=false, reloaded=false, reloadPending=false, offlineReady=false, offlineError='', lastAuto=0, lastSWCheck=0, modalOpen=false;
 const listeners=[], swWorkers=new WeakSet();
 const D=()=>api.getData();
 const baseSongs=[...(D().songs||[])], basePhotos=[...(D().photos||[])];
 const embeddedDate=date(D().checkedAt);
 let lastGood=null;
 const hadController=!!navigator.serviceWorker?.controller;
 const hosted=/^https?:$/.test(location.protocol)&&!window.HERO_SINGLE_FILE;
 const state=()=>api.getState();
 const save=()=>{try{return api.save();}catch{return false;}};
 const notify=s=>api.toast?.(s);
 const on=(target,type,fn,opts)=>{target?.addEventListener(type,fn,opts);listeners.push(()=>target?.removeEventListener(type,fn,opts));};
 function status(){const s=state().mediaStatus;return object(s)?s:{status:typeof s==='string'?text(s,240):'idle'};}
 function setStatus(patch){state().mediaStatus={...status(),...patch};save();paint();}
 function merge(feed){
  const songs=new Map(baseSongs.map(x=>[x.videoId,{...x}]));
  for(const x of feed?.videos||[])songs.set(x.videoId,{...songs.get(x.videoId),...x});
  const photos=new Map(basePhotos.map(x=>[x.id,{...x}]));
  for(const x of feed?.photos||[]){const original=photos.get(x.id);photos.set(x.id,original?{...original,...x,src:original.src}:x);}
  D().songs=[...songs.values()];D().photos=[...photos.values()];
 }
 function readCache(){
  try{if(state().mediaCache){lastGood=normalize(state().mediaCache);state().mediaCache=lastGood;merge(lastGood);return true;}}
  catch{state().mediaCache=null;setStatus({status:'error',error:'백업 또는 저장 자료가 올바르지 않아 기본 자료를 사용해요.'});}
  merge(lastGood);return false;
 }
 function when(s){if(!s)return '아직 없음';const ms=Date.parse(s);if(!Number.isFinite(ms))return '확인할 수 없음';return new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',...(s.length>10?{timeStyle:'short'}:{}),timeZone:'Asia/Seoul'}).format(new Date(ms));}
 function statusHTML(){
  const s=status(), checked=lastGood?.checkedAt||embeddedDate, stale=!checked||Date.now()-Date.parse(checked)>STALE;
  const mode=navigator.onLine===false?'현재 오프라인이에요. 저장한 자료를 보여드려요.':s.status==='loading'?'앱 자료를 동기화하고 있어요.':s.status==='error'?'최근 앱 동기화에 실패했어요. 마지막 정상 자료를 유지해요.':s.status==='local'?'파일로 연 앱은 자동 동기화하지 않아요.':'연결할 때 같은 사이트의 공개 자료를 확인해요.';
  const ready=window.HERO_SINGLE_FILE?'한 파일 버전은 서비스워커를 사용하지 않아요.':offlineReady?'기본 사진·게임·건강 안내·AI 인사의 오프라인 준비가 끝났어요.':offlineError||'오프라인 준비를 아직 확인하지 못했어요. 온라인에서 준비를 기다려 주세요.';
  return `<section class="notice section" aria-live="polite"><h3>사진·영상 자동확인 자료</h3><p>${escape(mode)}</p><p>수집 확인일: ${escape(when(checked))}<br>앱 동기화 시각: ${escape(when(s.syncedAt))}<br>최근 접속 시도: ${escape(when(s.attemptedAt))}</p>${s.status==='error'?`<p>실패: ${escape(text(s.error,240))}</p>`:''}${stale?'<p class="warm">공식 수집 확인일이 14일 넘게 지났어요. 오래된 자료일 수 있어요.</p>':''}<p>${escape(ready)}</p>${waiting?'<p>새 앱 버전이 준비됐어요. 작성 중인 내용을 저장하고 창을 닫으면 안전할 때 적용돼요.</p><button type="button" class="btn" data-hero-update="apply">새 버전 적용 안내</button>':''}<p class="small muted">영상·음악 재생은 인터넷이 필요해요. 새 사진은 이 기기에서 열어본 것만 오프라인에 남을 수 있어요. 저장 공간 정리 시 오프라인 자료가 지워질 수 있어요.</p></section>`;
 }
 function contents(){
  const checks=lastGood?.checks||[];
  return `${statusHTML()}<div class="row"><button type="button" class="btn primary" data-hero-update="refresh">지금 자료 동기화</button></div><p class="small muted section">앱은 공식 사이트를 직접 수집하지 않고 이 앱 사이트의 검증된 공개 자료만 가져와요. GitHub의 매일 자동 작업이 공개 사진·영상 출처를 확인해요. 실행 지연·서비스 한도·출처 접속 오류로 갱신이 늦어질 수 있어요. 공식 일정·회원 전용 공지는 자동 수집하지 않아요. 앱 접속 시각은 공식 수집 확인일이 아니에요. 숨은 백그라운드 조회나 알림은 하지 않아요.</p>${lastGood?`<p>자료 제공: ${escape(lastGood.sourceName)}<br>자료 수정일: ${escape(when(lastGood.updatedAt))}</p>`:''}${checks.length?`<ul>${checks.map(c=>`<li><a href="${escape(c.url)}" target="_blank" rel="noopener noreferrer">${escape(c.label)}</a> · ${escape(c.status)} · ${escape(when(c.date))}</li>`).join('')}</ul>`:''}<div class="row section"><a class="btn external" href="https://www.mulgogimusic.com/" target="_blank" rel="noopener noreferrer">공식 사진 더 보기</a><a class="btn external" href="https://www.youtube.com/channel/${CHANNEL}" target="_blank" rel="noopener noreferrer">공식 영상 더 보기</a></div>`;
 }
 function paint(){
  if(stopped)return;
  const box=document.getElementById('hero-updates-content');
  // Do not replace the focused action button or touch another modal.
  if(box&&!box.contains(document.activeElement))box.innerHTML=contents();
  api.refreshView?.();
 }
 function open(){api.modal('사진·영상 자동확인 자료',`<div id="hero-updates-content">${contents()}</div>`);modalOpen=true;}
 async function readResponse(response){
  if(!response.ok)throw Error('사이트에서 자료를 받지 못했어요.');
  const length=Number(response.headers.get('content-length'));if(length>LIMIT)throw Error('자료가 너무 커요.');
  if(!response.body?.getReader){const body=await response.text();if(new TextEncoder().encode(body).length>LIMIT)throw Error('자료가 너무 커요.');return body;}
  const reader=response.body.getReader(), chunks=[];let size=0;
  try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>LIMIT){await reader.cancel();throw Error('자료가 너무 커요.');}chunks.push(item.value);}}finally{reader.releaseLock();}
  const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}return new TextDecoder().decode(all);
 }
 async function refresh(silent=false){
  if(stopped)return false;if(running)return running;
  if(!hosted){setStatus({status:'local'});if(!silent)notify('한 파일·로컬 버전은 자동 자료 연결을 하지 않아요.');return false;}
  lastAuto=Date.now();const started=new Date().toISOString();
  setStatus({status:'loading',attemptedAt:started,error:''});
  controller=new AbortController();const timer=setTimeout(()=>controller?.abort(),15000);
  running=(async()=>{
   try{
    const feedURL=new URL('./media.json',new URL('.',location.href));
    if(feedURL.origin!==location.origin)throw Error('같은 사이트 자료만 사용할 수 있어요.');
    const response=await fetch(feedURL.href,{cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
    const next=normalize(await readResponse(response));if(stopped)return false;
    if(lastGood&&Date.parse(next.checkedAt)<Date.parse(lastGood.checkedAt))throw Error('서버 확인일이 이전 자료보다 오래되어 기존 자료를 유지해요.');
    lastGood=next;state().mediaCache=next;merge(next);
    setStatus({status:'ok',syncedAt:new Date().toISOString(),error:''});
    if(!silent)notify('공개 자료를 동기화했어요. 공식 수집 확인일은 별도로 표시해요.');return true;
   }catch(e){if(!stopped){setStatus({status:'error',error:e?.name==='AbortError'?'15초 안에 응답이 없어 마지막 자료를 유지해요.':text(e?.message,240)||'연결에 실패했어요.'});if(!silent)notify('동기화하지 못했어요. 마지막 정상 자료를 그대로 보여드려요.');}return false;
   }finally{clearTimeout(timer);controller=null;running=null;}
  })();return running;
 }
 function safe(){const a=document.activeElement;return document.visibilityState!=='hidden'&&!document.querySelector('dialog[open],#modal[open]')&&!(a&&(a.matches?.('input,textarea,select')||a.isContentEditable||a.closest?.('[contenteditable]:not([contenteditable="false"])')));}
 function tryApply(){if(stopped||!safe())return false;if(reloadPending&&!reloaded){reloaded=true;location.reload();return true;}if(!waiting)return false;intended=true;waiting.postMessage({type:'SKIP_WAITING'});return true;}
 function seeWaiting(){if(reg?.waiting){waiting=reg.waiting;paint();tryApply();}}
 function inspectWorker(worker){if(!worker||swWorkers.has(worker))return;swWorkers.add(worker);on(worker,'statechange',()=>{if(worker.state==='installed')seeWaiting();if(worker.state==='redundant'&&!offlineReady){offlineError='오프라인 자료 준비에 실패했어요. 다시 온라인으로 열어 주세요.';paint();}});}
 function checkReady(){reg?.active?.postMessage({type:'CHECK_OFFLINE'});}
 async function setupSW(){
  if(!hosted||!('serviceWorker' in navigator))return;
  on(navigator.serviceWorker,'controllerchange',()=>{checkReady();if(hadController&&!reloaded){reloadPending=true;tryApply();}});
  on(navigator.serviceWorker,'message',e=>{if(e.data?.type==='OFFLINE_STATUS'&&e.source===reg?.active){offlineReady=e.data.ready===true;offlineError=offlineReady?'':'오프라인 준비가 끝나지 않았어요. 온라인에서 다시 열어 주세요.';paint();}});
  try{
   reg=await navigator.serviceWorker.register(new URL('./sw.js',location.href).href,{updateViaCache:'none'});if(stopped)return;
   on(reg,'updatefound',()=>inspectWorker(reg.installing));inspectWorker(reg.installing);seeWaiting();
   navigator.serviceWorker.ready.then(ready=>{if(stopped||ready.scope!==reg.scope)return;checkReady();});checkReady();
   lastSWCheck=Date.now();reg.update().catch(()=>{});
  }catch{offlineError='이 브라우저에서 오프라인 준비를 완료하지 못했어요.';paint();}
 }
 function wake(){
  if(stopped||document.visibilityState==='hidden')return;
  seeWaiting();tryApply();checkReady();
  if(navigator.onLine!==false&&Date.now()-lastAuto>=INTERVAL)refresh(true);
  if(reg&&navigator.onLine!==false&&Date.now()-lastSWCheck>=INTERVAL){lastSWCheck=Date.now();reg.update().catch(()=>{});}
 }
 function init(){
  if(initialized)return;initialized=true;readCache();
  on(window,'online',wake);on(window,'offline',paint);on(document,'visibilitychange',wake);
  on(document,'close',()=>{modalOpen=false;setTimeout(()=>{if(!stopped)tryApply();},0);},true);
  on(document,'focusout',()=>setTimeout(()=>{if(!stopped)tryApply();},0));
  on(document,'click',e=>{
   const button=e.target.closest?.('[data-hero-update]');if(!button)return;
   if(button.dataset.heroUpdate==='refresh')refresh(false).finally(()=>{const box=document.getElementById('hero-updates-content');if(box)box.innerHTML=contents();});
   else if(button.dataset.heroUpdate==='apply'){if(!tryApply())notify('작성 중인 내용을 먼저 저장하고 열린 창을 닫아 주세요. 안전할 때 새 버전이 적용돼요.');}
  });
  setupSW();refresh(true);
 }
 function stop(){stopped=true;controller?.abort();for(const off of listeners)off();listeners.length=0;}
 return {init,open,refresh,normalize,statusHTML,stop};
};
})();
