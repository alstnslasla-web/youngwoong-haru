/* 영웅이랑 매일: optional local-only wellness companion. No sensor access.
 * Load before app.js. createHeroWellness(api) exposes open/openWalk/openStretch/normalize.
 * HERO_WELLNESS_VIDEOS: [{title, channel, url, videoId?, duration?, note?}].
 * Videos must be researched official-source entries; this module does not certify them.
 */
(() => {
'use strict';
const CHECKS = [['water','물 한 모금','내 몸에 맞게 마셨어요'],['meal','식사 챙기기','편안하게 식사했어요'],['rest','잠깐 쉬기','몸과 마음을 쉬었어요'],['family','가족 안부','전화나 메시지로 안부를 나눴어요'],['stretch','3분 스트레칭','앉은 동작을 해 보고 직접 표시했어요']];
const GOALS = [1000,3000,5000,10000];
const MAX_MS = 366 * 86400000;
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const number = (x, fallback, min, max) => typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(min, Math.floor(x))) : fallback;
const validDay = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x+'T12:00:00Z')) && new Date(x+'T12:00:00Z').toISOString().slice(0,10) === x;
const localToday = () => { const p = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); return ['year','month','day'].map(k=>p.find(v=>v.type===k).value).join('-'); };
function normalize(raw) {
  const r = object(raw) ? raw : {}, now = Date.now();
  const result = {v:1,goal:number(r.goal,5000,100,30000),days:{},walk:{status:'idle',date:'',elapsedMs:0,startedAt:null}};
  if (object(r.days)) for (const k of Object.keys(r.days).filter(validDay).sort().slice(-3660)) {
    const d = r.days[k]; if (!object(d)) continue;
    const c = object(d.checks) ? d.checks : {};
    result.days[k] = {steps:number(d.steps,null,0,200000),source:'manual',goal:number(d.goal,result.goal,100,30000),walkMs:number(d.walkMs,0,0,MAX_MS),checks:{}};
    for (const [key] of CHECKS) result.days[k].checks[key] = c[key] === true;
  }
  const w = object(r.walk) ? r.walk : {};
  if (['running','paused','finished'].includes(w.status) && validDay(w.date)) {
    const start = number(w.startedAt,null,0,now);
    result.walk = {status:w.status,date:w.date,elapsedMs:number(w.elapsedMs,0,0,MAX_MS),startedAt:null};
    if (w.status === 'running') {
      // A malformed or future clock stamp never silently starts a new timer.
      if (typeof w.startedAt !== 'number' || !Number.isFinite(w.startedAt) || w.startedAt <= 0 || w.startedAt > now) result.walk.status = 'paused';
      else result.walk.startedAt = start;
    }
  }
  return result;
}
function installStyle() {
  if (document.getElementById('hw-style')) return;
  const s = document.createElement('style'); s.id = 'hw-style';
  s.textContent = `.hw-root{display:grid;gap:20px;overflow-wrap:anywhere}.hw-root p,.hw-root li{font-size:.95rem}.hw-root h3{font-size:1.12rem}.hw-root .btn{font-size:.95rem;min-height:58px}.hw-root .hw-small{font-size:.83rem;color:var(--muted,#526977)}.hw-root .hw-card{border:1px solid var(--line,#dbe3e6);border-radius:22px;background:var(--paper,#fffefa);padding:22px;display:grid;gap:15px}.hw-root .hw-hero{background:var(--sky,#e6f3fa);border-radius:24px;padding:24px;display:grid;gap:14px}.hw-root .hw-hero h3{font-size:1.45rem;line-height:1.4}.hw-root .hw-kicker{color:var(--blue-dark,#075581);font-weight:700}.hw-root .hw-safe{border-left:5px solid #bd7d30;border-radius:0 15px 15px 0;background:#fff4df;color:#65471d;padding:17px}.hw-root .hw-safe p{font-size:.88rem}.hw-root .hw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hw-root .hw-grid .btn{width:100%;white-space:normal}.hw-root .hw-nav{display:flex;gap:10px;flex-wrap:wrap}.hw-root .hw-nav .btn{flex:1}.hw-root .hw-number{font-size:2rem;font-weight:800;color:var(--blue-dark,#075581);line-height:1.25;font-variant-numeric:tabular-nums}.hw-root .hw-number small{font-size:1rem;font-weight:700}.hw-root .hw-bar{height:22px;border-radius:20px;background:#c9dce8;overflow:hidden}.hw-root .hw-bar span{display:block;height:100%;background:var(--blue,#146da4);border-radius:20px}.hw-root .hw-goals{display:flex;gap:9px;flex-wrap:wrap}.hw-root .hw-goals button{flex:1;min-width:90px}.hw-root [aria-pressed=true]{border:3px solid var(--blue,#146da4);background:var(--sky,#e6f3fa);color:var(--blue-dark,#075581)}.hw-root form{display:grid;gap:12px}.hw-root label{font-size:.95rem}.hw-root input{width:100%;font-size:1.12rem;min-height:58px}.hw-root .hw-check{display:flex;text-align:left;align-items:center;justify-content:flex-start;gap:14px;padding:17px}.hw-root .hw-check b{display:block}.hw-root .hw-check small{display:block;font-size:.8rem;font-weight:400;margin-top:3px}.hw-root .hw-check-symbol{width:34px;height:34px;flex-shrink:0;border:2px solid currentColor;border-radius:50%;display:grid;place-items:center;font-size:.8rem}.hw-root .hw-history{list-style:none;padding:0;margin:0;display:grid;gap:12px}.hw-root .hw-history li{border-bottom:1px solid var(--line,#dbe3e6);padding:0 0 12px;display:grid;gap:7px}.hw-root .hw-history-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.hw-root .hw-history .hw-bar{height:9px}.hw-root .hw-clock{text-align:center;font-size:2.7rem;font-weight:800;font-variant-numeric:tabular-nums;color:var(--blue-dark,#075581)}.hw-root .hw-steps{padding-left:1.5em;margin:0;display:grid;gap:18px}.hw-root .hw-steps p{margin-top:5px}.hw-root .hw-congrats{background:#e9f1e6;color:#294b30;padding:20px;border-radius:18px}.hw-root .hw-video{display:grid;gap:12px;padding-top:16px;border-top:1px solid var(--line,#dbe3e6)}.hw-root iframe{display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:16px;background:#162e41}.hw-root .hw-empty{padding:20px;background:var(--bg,#f6f5f0);border-radius:16px}.hw-root .hw-status{font-weight:700;color:var(--blue-dark,#075581)}.hw-root .hw-form-note{font-size:.85rem;color:var(--muted,#526977)}@media(max-width:480px){.hw-root .hw-card,.hw-root .hw-hero{padding:18px}.hw-root .hw-grid{grid-template-columns:1fr}.hw-root .hw-nav .btn{flex-basis:100%}.hw-root .hw-clock{font-size:2.3rem}.hw-root .hw-number{font-size:1.8rem}}`;
  document.head.appendChild(s);
}
window.createHeroWellness = function createHeroWellness(api) {
  installStyle();
  const esc = api.esc || (s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  const today = () => { const d = typeof api.today === 'function' ? api.today() : localToday(); return validDay(d) ? d : localToday(); };
  const addDays = (d,n) => typeof api.addDays === 'function' ? api.addDays(d,n) : new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  const fmt = n => Number(n).toLocaleString('ko-KR');
  const say = s => api.toast(s);
  let view = '', timer = null, screenDay = '', currentRoot = null;
  let routine = {status:'idle',elapsedMs:0,startedAt:null};
  let owner = 'hw-'+Math.random().toString(36).slice(2);
  let videoIndex = null, refreshing = false;
  function state() { const s = api.getState(); s.wellness = normalize(s.wellness); return s.wellness; }
  function day(s,d=today()) { if (!s.days[d]) s.days[d] = {steps:null,source:'manual',goal:s.goal,walkMs:0,checks:{water:false,meal:false,rest:false,family:false,stretch:false}}; return s.days[d]; }
  function commit() { return api.save() !== false; }
  function elapsed(w) { return Math.min(MAX_MS,w.elapsedMs + (w.status==='running' && w.startedAt ? Math.max(0,Date.now()-w.startedAt) : 0)); }
  function clock(ms) { const n = Math.floor(ms/1000), h = Math.floor(n/3600), m = Math.floor(n%3600/60), sec = n%60; return (h ? h+':' : '')+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'); }
  function button(action,label,cls='soft',extra='') { return `<button type="button" class="btn ${cls}" data-wellness="${esc(action)}" ${extra}>${esc(label)}</button>`; }
  function safety() { return `<aside class="hw-safe"><p><strong>조작은 꼭 멈춰서 해 주세요.</strong><br>걷는 동안 화면을 보지 마세요. 통증이나 어지럼이 생기면 바로 중단하고, 균형이 불안하면 앉으세요. 증상이 계속되면 의료진에게 상담하세요.</p></aside>`; }
  function intro() { return `<p class="hw-small">임영웅을 좋아하는 마음으로 내 하루를 챙기는 팬 공간이에요. 가수의 실제 동행이나 실시간 응답이 아닙니다.</p>`; }
  function nav() { return `<nav class="hw-nav" aria-label="하루 함께 메뉴">${button('home','하루 함께')}${button('walk','걸음과 산책')}${button('stretch','의자 스트레칭')}</nav>`; }
  function progress(s,d) { const steps=d.steps??0, percent=Math.min(100,Math.floor(steps/s.goal*100)); return `<div class="hw-number">${d.steps===null?'아직 기록 전':fmt(steps)+' <small>보</small>'}</div><p>오늘 목표 ${fmt(s.goal)}보 · ${percent}%</p><div class="hw-bar" role="progressbar" aria-label="직접 입력한 오늘 걸음수 목표 진행" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>${d.steps!==null && steps>=s.goal?`<div class="hw-congrats"><strong>오늘의 작은 약속을 지켰어요.<br>내 몸을 아껴 준 나에게 박수!</strong><p class="hw-small">앱이 직접 만든 응원 문구이며 임영웅의 발언이 아닙니다. 목표를 채웠어도 더 걷지 않아도 괜찮아요.</p></div>`:`<p class="hw-small">${d.steps===null?'아래에서 오늘 누적 걸음수를 직접 적어 주세요.':fmt(Math.max(0,s.goal-steps))+'보 남았어요. 몸이 편한 만큼만 해도 좋아요.'}</p>`}`; }
  function homeHTML(s) { const d=day(s); return `${intro()}<section class="hw-hero"><p class="hw-kicker">영웅을 좋아하는 마음, 나를 아끼는 하루</p><h3>오늘도 천천히<br>내 몸과 함께해요</h3><p>5,000보도, 선택 목표 1만보도 내 몸에 맞게 낮춰도 좋아요. 낮춘 목표를 채워도 성공이에요. 쉬는 날도 소중해요.</p>${button('walk','영웅을 좋아하는 마음으로 함께 걷기','primary')}<p class="hw-small">팬 활동 이름이며 실제 동행은 아니에요. 현재 내 목표는 ${fmt(s.goal)}보예요.</p>${button('stretch','앉아서 편안하게 스트레칭')}</section><section class="hw-card"><h3>오늘의 걸음 기록</h3>${progress(s,d)}<p class="hw-small">수동 입력 기록입니다. 삼성 헬스·Health Connect에서 걸음수를 읽거나 자동 측정하지 않습니다.</p>${button('walk','걸음수 직접 적기')}</section><section class="hw-card"><h3>하루를 함께 챙겨요</h3><p>해낸 것은 직접 눌러 표시해요. 다시 누르면 취소돼요. 스트레칭은 선택이며 타이머만 끝나서는 완료 표시되지 않아요.</p><div class="hw-grid">${CHECKS.map(([key,label,desc])=>`<button type="button" class="btn hw-check" data-wellness="check" data-day="${today()}" data-key="${key}" aria-pressed="${!!d.checks[key]}"><span class="hw-check-symbol" aria-hidden="true">${d.checks[key]?'완료':''}</span><span><b>${esc(label)}</b><small>${esc(d.checks[key]?desc:'아직 표시하지 않았어요')}</small></span></button>`).join('')}</div><p class="hw-small">물은 정해진 양을 억지로 마시지 않아도 돼요. 심장·신장 질환 등으로 수분 제한을 안내받았다면 의사의 지시가 우선입니다. 식사와 활동도 개인별 의료진 지시를 따라 주세요.</p></section>${safety()}`; }
  function historyHTML(s) { const now=today(); return `<section class="hw-card"><h3>최근 7일 기록</h3><p class="hw-small">걸음수는 직접 입력한 누적값, 시간은 마친 산책 타이머 기록이에요. 기록이 없으면 0보로 간주하지 않아요.</p><ul class="hw-history">${Array.from({length:7},(_,i)=>addDays(now,-i)).map(date=>{const d=s.days[date],steps=d?.steps,goal=d?.goal??s.goal,pct=Math.min(100,Math.floor((steps??0)/goal*100)); return `<li><div class="hw-history-top"><b>${esc(date.slice(5).replace('-','월 '))}일${date===now?' · 오늘':''}</b><span>${steps==null?'기록 없음':fmt(steps)+'보 · 직접 입력'}</span></div><div class="hw-bar" aria-hidden="true"><span style="width:${pct}%"></span></div><p class="hw-small">${steps==null?'걸음 목표 미확인':'목표 '+fmt(goal)+'보 · '+(steps>=goal?'달성':'진행 중')}${d?.walkMs?' · 마친 타이머 '+clock(d.walkMs):''}</p><p class="hw-small">스트레칭 ${d?.checks?.stretch?'완료 · 직접 표시':'완료 표시 없음'}</p></li>`;}).join('')}</ul></section>`; }
  function walkHTML(s) { const d=day(s),w=s.walk, active=['running','paused'].includes(w.status); return `${nav()}${safety()}<section class="hw-hero"><p class="hw-kicker">임영웅과 5,000보 걷기</p>${intro()}<h3>내 걸음, 내 속도로</h3>${progress(s,d)}</section><section class="hw-card"><h3>오늘 누적 걸음수 직접 입력</h3><div class="hw-safe"><p><strong>이 HTML 앱은 자동 만보계가 아니에요.</strong><br>삼성 헬스·Health Connect 걸음수를 직접 읽지 못합니다. 삼성 헬스 등에서 오늘 숫자를 확인한 뒤 직접 입력해 주세요.</p></div><form data-wellness="steps" data-day="${today()}"><label for="hw-steps-input">오늘 누적 걸음수 (보)<input id="hw-steps-input" name="steps" type="number" inputmode="numeric" min="0" max="200000" step="1" required value="${d.steps??''}" placeholder="예: 2500" aria-describedby="hw-steps-note"></label><p id="hw-steps-note" class="hw-form-note">저장하면 오늘 값을 새 숫자로 덮어씁니다. 이전 숫자에 더하지 않아요. 잘못 적었다면 올바른 누적값으로 다시 저장하세요.</p><button class="btn primary" type="submit" data-wellness="steps-submit">오늘 누적 걸음수 저장</button></form></section><section class="hw-card"><h3>나에게 편한 하루 목표</h3><p>기본 목표는 5,000보예요. 1만보는 선택 사항이며 권장량이나 의무가 아니에요. 몸 상태에 따라 목표를 낮춰도 성공이고, 쉬어도 괜찮아요.</p><div class="hw-goals">${GOALS.map(n=>button('goal',n===10000?'1만보 (선택)':fmt(n)+'보','',`data-value="${n}" aria-pressed="${s.goal===n}"`)).join('')}</div><form data-wellness="goal-custom"><label for="hw-goal-input">직접 설정 (100~30,000보)<input id="hw-goal-input" name="goal" type="number" inputmode="numeric" min="100" max="30000" step="1" required value="${s.goal}"></label><button class="btn soft" type="submit" data-wellness="goal-submit">내 목표 저장</button></form><p class="hw-small">목표 변경은 오늘과 앞으로의 기록에 적용돼요. 과거 기록의 목표는 그대로예요.</p></section><section class="hw-card"><h3>산책 시간만 재기</h3><p class="hw-small">걸음수로 환산하지 않습니다. 화면을 닫아도 경과 시간을 계산하지만 실제 운동 여부는 확인하지 않습니다.</p><p class="hw-status" id="hw-walk-status" data-status="${w.status}">${{idle:'시작 전',running:'시간을 재고 있어요',paused:'잠깐 쉬는 중',finished:'산책 타이머를 마쳤어요'}[w.status]}</p><div id="hw-walk-clock" class="hw-clock" role="timer" aria-label="산책 경과 시간" aria-live="off">${clock(elapsed(w))}</div><div class="hw-grid">${w.status==='running'?button('pause','잠깐 쉬기','primary'):w.status==='paused'?button('resume','계속','primary'):button('start',w.status==='finished'?'새 산책 시작':'시작','primary')}${active?button('finish','마치기'):''}</div>${active?`<p class="hw-small">${esc(w.date)} 시작한 타이머예요. 마치면 시작한 날짜에 시간을 남겨요. 자정이 지나도 오늘 걸음수에는 영향을 주지 않아요.</p>`:''}<p class="hw-small">닫기는 일시정지가 아니에요. 쉴 때는 ‘잠깐 쉬기’, 끝났을 때는 ‘마치기’를 눌러 주세요. 휴대폰 시각이 바뀌면 기록이 부정확할 수 있어요.</p></section>${historyHTML(s)}`; }
  function safeVideo(raw) {
    if (!object(raw) || typeof raw.title!=='string') return null;
    let id = typeof raw.videoId==='string' && /^[a-zA-Z0-9_-]{11}$/.test(raw.videoId) ? raw.videoId : '';
    let url = '';
    if (typeof raw.url==='string') try {
      const u = new URL(raw.url); if (u.protocol==='https:' && !u.username && !u.password) {
        url=u.href;
        const host=u.hostname.toLowerCase(); let candidate='';
        if (host==='youtu.be') candidate=u.pathname.split('/')[1];
        if (['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)) candidate=u.searchParams.get('v') || (/^\/(embed|shorts)\//.test(u.pathname)?u.pathname.split('/')[2]:'');
        if (!id && /^[a-zA-Z0-9_-]{11}$/.test(candidate||'')) id=candidate;
      }
    } catch {}
    if (!url && id) url='https://www.youtube.com/watch?v='+id;
    if (!url) return null;
    return {title:raw.title.slice(0,200),channel:typeof raw.channel==='string'?raw.channel.slice(0,120):'공식 출처',duration:typeof raw.duration==='string'?raw.duration.slice(0,40):'',note:typeof raw.note==='string'?raw.note.slice(0,600):'',id,url};
  }
  function videos() { const raw=window.HERO_WELLNESS_VIDEOS; const list=Array.isArray(raw)?raw:(object(raw)&&Array.isArray(raw.videos)?raw.videos:[]); return list.slice(0,30).map(safeVideo).filter(Boolean); }
  function videosHTML() { const list=videos(); return `<section class="hw-card"><h3>공식 출처의 무료 스트레칭 영상</h3><p>외부 건강 영상이며 임영웅 출연 영상이 아닙니다. 내 몸에 무리한 동작은 따라 하지 않아도 돼요.</p><p class="hw-small">영상은 자동 재생하지 않아요. 외부 영상을 열거나 불러오면 인터넷 연결과 데이터 사용이 필요하고 해당 서비스의 개인정보 정책이 적용돼요.</p>${list.length?list.map((v,i)=>`<article class="hw-video"><h3>${esc(v.title)}</h3><p class="hw-small">${esc(v.channel)}${v.duration?' · '+esc(v.duration):''}</p>${v.note?`<p class="hw-small">${esc(v.note)}</p>`:''}<div class="hw-grid">${v.id?button('video','여기에 영상 불러오기','soft',`data-index="${i}"`):''}<a class="btn external" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">공식 영상 새 창에서 보기</a></div>${videoIndex===i&&v.id?`<iframe title="${esc(v.title)} · 자동 재생 꺼짐" src="https://www.youtube-nocookie.com/embed/${esc(v.id)}?autoplay=0&playsinline=1&rel=0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><p class="hw-small">재생 버튼을 직접 눌러 시작하세요.</p>`:''}</article>`).join(''):`<p class="hw-empty">확인된 공식 영상 목록을 아직 준비하지 못했어요. 위의 앉아서 하는 3분 안내는 영상 없이도 볼 수 있어요.</p>`}</section>`; }
  function routineText(ms) { if (ms>=180000) return ['3분 안내를 마쳤어요','오늘은 여기까지 해도 좋아요. 편안하게 쉬세요.']; if(ms>=120000) return ['3단계 · 어깨 힘 빼기','어깨를 편안하게 내리고 숨을 천천히 쉬어요. 억지로 돌리거나 목을 꺾지 않아요.']; if(ms>=60000) return ['2단계 · 발목 살짝 움직이기','앉은 채 한쪽씩 발끝을 조금 들었다 내려요. 발이 편한 범위에서만 움직여요.']; return ['1단계 · 손 부드럽게 펴기','손에 힘을 빼고 손가락을 천천히 폈다가 편안히 모아요. 세게 쥐거나 당기지 않아요.']; }
  function stretchHTML(s) { const d=day(s), ms=Math.min(180000,elapsed(routine)),text=routineText(ms); return `${nav()}${safety()}<section class="hw-hero"><p class="hw-kicker">쉬어 가는 영웅 팬의 오후</p><h3>의자에서 편안하게 3분</h3><p>선택 활동이에요. 오늘 몸이 불편하면 건너뛰어도 괜찮아요. 치료나 개인별 운동 처방이 아닙니다.</p>${intro()}</section><section class="hw-card"><h3>시작하기 전에</h3><p>바퀴 없는 튼튼한 의자를 벽 가까이 두고 편안히 앉아요. 발은 바닥에 두고, 몸이 불안하면 등받이에 기대세요. 바퀴 의자나 미끄러운 바닥은 피하세요.</p><p>통증 없이 가능한 작은 범위만 움직여요. 최근 수술·부상이나 질환으로 운동 제한이 있다면 의료진에게 먼저 확인하세요.</p><ol class="hw-steps"><li><strong>1분: 손 부드럽게 펴기</strong><p>손가락을 천천히 폈다가 힘을 풀어요. 손목을 세게 꺾지 않아요.</p></li><li><strong>1분: 발목 살짝 움직이기</strong><p>앉은 채 한쪽씩 발끝을 조금 들었다 내려요. 일어서지 않아도 돼요.</p></li><li><strong>1분: 어깨 힘 빼기</strong><p>어깨를 편안하게 내리고 천천히 숨을 쉬어요. 크게 돌리지 않아도 돼요.</p></li></ol></section><section class="hw-card"><h3>선택: 3분 안내 타이머</h3><p class="hw-small">움직임을 측정하지 않는 시간 안내예요. 이 안내를 닫거나 다른 앱으로 가거나 화면이 꺼지면 잠시 멈춰요. 돌아오면 ‘계속’을 눌러 주세요. 시간을 채우려고 무리할 필요는 없어요.</p><div id="hw-routine-clock" class="hw-clock" role="timer" aria-label="3분 루틴 남은 시간" aria-live="off">${clock(180000-ms)}</div><div id="hw-routine-text" aria-live="polite" aria-atomic="true"><strong>${esc(text[0])}</strong><p>${esc(text[1])}</p></div><div class="hw-grid">${routine.status==='running'?button('routine-pause','잠깐 쉬기','primary'):button('routine-start',routine.status==='paused'?'계속':ms>=180000?'다시 3분 시작':'3분 시작','primary')}${routine.status!=='idle'?button('routine-stop','안내 마치기'):''}</div><p class="hw-small">타이머 종료는 운동 완료를 뜻하지 않아요. 몸이 편한 만큼 해 본 뒤 아래에서 직접 표시해 주세요.</p>${button('check',d.checks.stretch?'오늘 스트레칭 완료 표시 취소':'오늘 스트레칭 완료 표시','soft',`data-key="stretch" data-day="${today()}" aria-pressed="${!!d.checks.stretch}"`)}<p class="hw-small">${d.checks.stretch?'오늘 완료로 기록했어요.':'아직 완료 표시하지 않았어요.'} 날짜별 표시는 걸음과 산책의 최근 7일 기록에서도 볼 수 있어요. 앱을 새로 열면 3분 안내 타이머는 초기화되지만 저장한 완료 표시는 남아요.</p></section>${videosHTML()}`; }
  function stopTicker() { if(timer!==null) clearInterval(timer); timer=null; }
  function pauseRoutine() { if(routine.status==='running'){routine.elapsedMs=Math.min(180000,elapsed(routine));routine.startedAt=null;routine.status=routine.elapsedMs>=180000?'finished':'paused';} }
  function render(next,focusKey,focusExtra) {
    const keepRoutine = next==='stretch' && view==='stretch';
    if(!keepRoutine) pauseRoutine();
    // In-place rendering must not pause the routine through modal cleanup.
    stopTicker(); view=next; screenDay=today(); const s=state();
    refreshing=keepRoutine;
    try { api.modal(next==='walk'?'걸음과 산책':next==='stretch'?'편안한 의자 스트레칭':'영웅이랑 하루 함께',`<div class="hw-root" data-hw-owner="${owner}">${next==='walk'?walkHTML(s):next==='stretch'?stretchHTML(s):homeHTML(s)}</div>`); } finally { refreshing=false; }
    currentRoot=document.querySelector('[data-hw-owner="'+owner+'"]');
    api.setCleanup(()=>{stopTicker();if(!refreshing)pauseRoutine();currentRoot=null;});
    timer=setInterval(tick,1000);
    if(focusKey && currentRoot) {
      const nodes=[...currentRoot.querySelectorAll('[data-wellness]')];
      const found=nodes.find(el=>el.dataset.wellness===focusKey && (!focusExtra || el.dataset.key===focusExtra || el.dataset.value===focusExtra));
      if(found && found.tagName==='BUTTON') found.focus();
    }
  }
  function tick() {
    if(!currentRoot?.isConnected){stopTicker();pauseRoutine();return;}
    if(screenDay!==today()) { render(view); say('날짜가 바뀌어 오늘 기록으로 바꿨어요.'); return; }
    if(view==='walk') {const w=state().walk, el=currentRoot.querySelector('#hw-walk-clock'), statusEl=currentRoot.querySelector('#hw-walk-status');if(statusEl && statusEl.dataset.status!==w.status){render('walk');say('휴대폰 시각을 확인해 주세요. 타이머를 잠깐 멈췄어요.');return;}if(el) el.textContent=clock(elapsed(w));}
    if(view==='stretch') {
      const ms=Math.min(180000,elapsed(routine)); const clockEl=currentRoot.querySelector('#hw-routine-clock'); if(clockEl) clockEl.textContent=clock(180000-ms);
      const text=routineText(ms), el=currentRoot.querySelector('#hw-routine-text');
      if(el && el.dataset.phase!==text[0]){el.dataset.phase=text[0];el.innerHTML='<strong>'+esc(text[0])+'</strong><p>'+esc(text[1])+'</p>';}
      if(routine.status==='running' && ms>=180000){routine={status:'finished',elapsedMs:180000,startedAt:null};render('stretch','routine-start');say('3분 안내를 마쳤어요. 해 보셨다면 오늘 완료를 직접 표시해 주세요.');}
    }
  }
  function setGoal(value) {const s=state();s.goal=value;day(s).goal=value;const saved=commit();render('walk','goal',String(value));if(saved)say('오늘 목표를 '+fmt(value)+'보로 바꿨어요.');}
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('button[data-wellness]'):null;
    if(!target || target.disabled || target.closest('[data-hw-owner]')?.getAttribute('data-hw-owner')!==owner)return;
    const action=target.dataset.wellness;
    if(action==='home'){render('home');return;}if(action==='walk'){render('walk');return;}if(action==='stretch'){videoIndex=null;render('stretch');return;}
    const s=state(),w=s.walk;
    if(action==='check') { const key=target.dataset.key;if(!CHECKS.some(c=>c[0]===key))return;if(target.dataset.day!==today()){render(view);say('날짜가 바뀌었어요. 오늘 완료 여부를 다시 표시해 주세요.');return;}const d=day(s);d.checks[key]=!d.checks[key];const checked=d.checks[key],saved=commit();render(view,'check',key);if(saved)say(checked?'오늘 해낸 일로 표시했어요.':'표시를 취소했어요.');return; }
    if(action==='goal'){const n=Number(target.dataset.value);if(GOALS.includes(n))setGoal(n);return;}
    if(['start','pause','resume','finish'].includes(action)) {
      if(action==='start' && ['idle','finished'].includes(w.status))s.walk={status:'running',date:today(),elapsedMs:0,startedAt:Date.now()};
      else if(action==='pause' && w.status==='running'){w.elapsedMs=elapsed(w);w.startedAt=null;w.status='paused';}
      else if(action==='resume' && w.status==='paused'){w.startedAt=Date.now();w.status='running';}
      else if(action==='finish' && ['running','paused'].includes(w.status)){w.elapsedMs=elapsed(w);w.startedAt=null;w.status='finished';day(s,w.date).walkMs=Math.min(MAX_MS,day(s,w.date).walkMs+w.elapsedMs);}
      else return;
      const saved=commit(); render('walk',action==='pause'?'resume':action==='finish'?'start':'pause');
      if(saved)say(action==='finish'?'산책 시간만 저장했어요. 걸음수는 직접 적어 주세요.':action==='pause'?'산책 타이머를 잠깐 멈췄어요.': '시간을 재기 시작했어요. 걷는 동안 화면을 보지 마세요.');return;
    }
    if(action==='routine-start'){if(elapsed(routine)>=180000)routine={status:'idle',elapsedMs:0,startedAt:null};if(routine.status!=='running'){routine.status='running';routine.startedAt=Date.now();}render('stretch','routine-pause');return;}
    if(action==='routine-pause'){pauseRoutine();render('stretch','routine-start');return;}
    if(action==='routine-stop'){routine={status:'idle',elapsedMs:0,startedAt:null};render('stretch','routine-start');say('안내를 마쳤어요. 몸이 편한 만큼만 해도 좋아요.');return;}
    if(action==='video'){const i=Number(target.dataset.index);if(Number.isInteger(i)&&videos()[i]?.id){pauseRoutine();videoIndex=i;render('stretch');const frame=currentRoot?.querySelector('iframe');frame?.scrollIntoView({block:'nearest'});}return;}
  });
  document.addEventListener('visibilitychange',()=>{
    if(!currentRoot?.isConnected)return;
    if(document.hidden){pauseRoutine();stopTicker();return;}
    if(screenDay!==today() || view==='stretch'){render(view);return;}
    // Preserve unsaved manual input when returning from Samsung Health or another app.
    tick();
    if(timer===null && currentRoot?.isConnected)timer=setInterval(tick,1000);
  });
  document.addEventListener('submit',event=>{
    const form=event.target;if(!(form instanceof HTMLFormElement) || form.closest('[data-hw-owner]')?.getAttribute('data-hw-owner')!==owner)return;
    event.preventDefault();const action=form.dataset.wellness;if(!['steps','goal-custom'].includes(action))return;
    const input=form.elements.namedItem(action==='steps'?'steps':'goal'),text=input.value.trim();
    if(!/^\d+$/.test(text)){say('숫자를 정수로 적어 주세요.');input.focus();return;}
    const n=Number(text);
    if(action==='goal-custom'){if(n<100||n>30000){say('목표는 100보부터 30,000보까지 적어 주세요.');input.focus();return;}setGoal(n);return;}
    if(form.dataset.day!==today()){render('walk');say('날짜가 바뀌었어요. 오늘 누적 걸음수를 다시 적어 주세요.');return;}
    if(!Number.isSafeInteger(n)||n<0||n>200000){say('걸음수는 0보부터 200,000보까지 적어 주세요.');input.focus();return;}
    const s=state(),d=day(s);d.steps=n;d.source='manual';d.goal=s.goal;const saved=commit();render('walk');if(saved)say('오늘 누적 '+fmt(n)+'보로 덮어써 저장했어요.');
  });
  return {open:()=>{videoIndex=null;render('home');},openWalk:()=>render('walk'),openStretch:()=>{videoIndex=null;render('stretch');},normalize};
};
})();
