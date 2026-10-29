# 검증 기록

검사일: 2026-10-23

## 자동 단위 검사

- PASS: KST 날짜 변환
- PASS: 윤년 유효성
- PASS: 달을 넘기는 날짜 계산
- PASS: 가사 수동 줄 분리
- PASS: LRC 시간순 정렬
- PASS: LRC 여러 시간표시
- PASS: LRC offset
- PASS: 날짜 배열 입력 거절
- PASS: 잘못된 시간 입력 거절
- PASS: 중복 일정 ID 거절
- PASS: javascript URL 제거
- PASS: 종일 종료일 배타적 처리
- PASS: 한글 ICS 왕복
- PASS: ICS UTF8 줄 접기
- PASS: 시간 일정 UTC 내보내기
- PASS: 밤을 넘기는 일정 보존
- PASS: 반복 일정 제외 개수
- PASS: 미지원 시간대 제외
- PASS: 잘못된 백업 버전 거절
- PASS: 일정 JSON 읽기
- PASS: 반복 예외 제외

합계: 21/21 통과.

## 브라우저 상호작용 확인

- 390px iframe 모바일 뷰포트의 실제 HTML/CSS 렌더링과 큰 버튼/하단 메뉴 확인.
- 글자 3단계 중 가장 큰 크기에서도 문서 가로 넘침 없음 확인.
- 퀴즈 정답 선택 후 정답·공식 출처·복습 버튼 표시 확인.
- 사진 짝맞추기: 카드 뒤집기, 3초 힌트, 정확한 한 쌍 완성 및 횟수 증가 확인.
- 노래 제목 검색으로 온기 1건 표시, 즐겨찾기 저장 상태 확인.
- 직접 작성한 테스트 문장 2줄 저장, 큰 글씨 표시, 다음 줄 이동 확인. 실제 노래 가사는 테스트에 사용하지 않음.
- 개인 일정 제목·19:00 시간 입력 후 달력 표시 확인.
- 테스트 저장 어댑터로 화면을 다시 열었을 때 찜한 노래 1곡 복원 확인. 실제 기기 localStorage의 장기 보존을 보증하는 테스트는 아님.
- 응원 놀이 진입 후 0→1번 증가 확인.
- 최종 검증 중 기록된 JavaScript 런타임 오류 없음.

## 코드 리뷰 후 보완

- 마이크 권한 대기 중 중복 클릭, 화면 닫기, 백그라운드 전환에 대한 요청 무효화·스트림 정리.
- 종료된 녹음 콜백이 새 창을 건드리지 않도록 세대 토큰과 로컬 recorder 참조 사용.
- 일정 주소 변경·연결 해제·백업 복원 중 오래된 요청의 결과 반영 방지.
- 날짜 타입 검사, 다중일 시간 일정 종료 보존, RECURRENCE-ID 제외.
- 자동 줄 넘김과 영상 동기화 모드의 상태 초기화.
- 앱 전용 Service Worker 캐시 정리, 일정 파일 캐시 제외.

## 검증하지 않은 외부 환경

- Android/iOS 실제 홈 화면 설치와 Service Worker의 실기기 오프라인 동작.
- 공개 호스팅 서버의 HTTPS·CORS 및 주기 갱신 성공 여부. 현재 공개 배포 주소 없음.
- 실제 사용자 마이크·음성 엔진과 YouTube 임베드의 소리·속도·반복 재생. 권한 요청이나 사용자 녹음은 테스트하지 않음.
- 영상 제한 시 공식 YouTube 링크로 이동하는 대체 경로 제공.

앱 본체와 단일 HTML에는 테스트 저장 어댑터·테스트 일기·테스트 일정이 포함되지 않습니다.


## 2026-10-23 v2.0.1 최종 통합
- 사용자 요청으로 음성팩·TTS·화면 읽기 UI 및 WAV 캐시 제외.
- 이전 v2: 실제 공개 브라우저 진단 19/19, 실제 캐시로 네트워크 실패 대체 테스트 5개 성공. 실제 휴대폰 비행기 모드 테스트와는 다름.
- 걷기 1천·3천·5천·1만 목표와 수동 누적 입력, 산책·스트레칭 기록 확인. 타이머 회귀 20개, 동행 모듈 모의 22개, 이전 핵심 21개 검사 통과.
- GitHub 자동 갱신 코드 14개 fixture/호환성 검사 통과. 실제 GitHub Actions 첫 실행 성공, 공식 RSS와 갤러리 모두 확인. 31개 영상 메타데이터와 추가 이미지 URL 22개, 개인정보 없음.
- 실제 기기의 설치/TTS/마이크/비행기 모드 재생은 검증하지 않았으며 음성 기능은 이번 버전에서 제외.


## v2.1.0 사전 생성 음성 검사 (배포 전 기록)

- 최종 준비 음성 엔진 모의 검사 26/26: 공개 텍스트·참조·모델·경로·크기·MIME·캐시·전체 조각 사전 확인. GitHub/Netlify 프록시의 text/plain JSON을 허용하고 HTML은 거절.
- 실제 무료 CPU 작업 #2 성공, state=partial: 187조각 중14개 생성. 시작28.2초, 낮 인사 합성·변환41.39초, PCM16/모노24kHz/7.6초. 전체 작업19분23초. 생성 문구의 청취 평가는 미실시.
- 실제14개 MP3: 최종 엔진 파서와 Chromium OfflineAudioContext 디코딩 모두 통과. 모노24kHz·길이·비무음 검사. SHA와 결과는 tmp/voice-native-format-check.json.
- 실제 Native Audio로 공개 홈 안내 재생 후0.689초 지점에서 정지 확인.
- 새 엔진 인스턴스에서 음성 네트워크 요청을 막아도 IndexedDB 저장본이 끝까지 재생. 추가 요청0. 물리적 비행기 모드 검사가 아니라 브라우저 네트워크 실패 검사.
- 임시 upstream bridge를 쓴 배포 전 검사이며 최종 Netlify 프록시 검증과 구분. 숨김 시 실제 재생·준비 취소도 관찰.
- playbackRate가 src 설정 때 기본값으로 돌아가는 문제를 고쳐 defaultPlaybackRate도0.9로 설정. 실제0.9배 확인: 음성13.52초를15.045초에 재생.
- 준비된 조각이 일부뿐인 건강 전체 안내는 파일 일부를 재생하지 않고 준비 중 안내를 표시. 음성 객체0, MP3 다운로드0.
- 정규화된 실제 데이터31개 영상·34개 사진 카드의 공개 낭독 문구가 catalog와 모두 일치.
- 다른 탭 controller 변경, 숨김→표시, 모달 닫기, 입력창 blur, 첫 설치의 안전한 재시작 모의 검사5/5.
- 최신 모바일 iframe: 24/27px에서 문서 폭375/스크롤 폭375. 최대 글씨 건강 모달338/338, 실제 :modal=true, 초점 modal-close. 실제 휴대폰 검사는 아님.
- 배포 allowlist22파일, 서비스워커18 URL 모두 파일 존재 확인. 개인 기록·모델·실행 환경·테스트 브리지는 배포하지 않음.
- 장시간 이어 만들기: 별도66개 격리 검사, runner self-test67개. 최대7200초/135분 job, main 최신 체크아웃, main 작업 직렬화, 검증 결과 재사용, 새 결과 없이 미완료이면 실패.

공개 배포 후 실제 버전·프록시·서비스워커·인사·안내 재생 결과는 별도 후속 기록이 필요합니다.


## v2.1.0 공개 배포 후 실제 검사

2026-10-23 21:06 KST 같은 주소에 배포. GitHub runtime commit ae85f10. ZIP 2,795,748바이트/22파일, 휴대폰 안내 ZIP 2파일. 안내 문구는 배포 후 별도로 갱신.

- 실제 앱 HeroApp.version=2.1.0, 서비스워커 v2.1.0. 기본 캐시18개 모두 HTTP200. 미디어 캐시의 status0은 cross-origin opaque 응답으로 정상 200 여부를 읽을 수 없으므로 같은 판정에 넣지 않음.
- 실제 voice-index.json 프록시 HTTP200/text/plain, 현재24조각/10완료항목. 세 인사 WAV HTTP200/audio/x-wav. 중간 테스트용 upstream bridge 없이 검사.
- 공개 Netlify 경로의24개 MP3 전체: 현재 manifest 검증, 파일 크기, strict MPEG 파서, Native OfflineAudioContext, 모노24kHz/길이/비무음 검사 통과. 실제 오디오 SHA256 기록.
- 실제 앱의 밤 인사 끝까지 재생:6.466458초, 속도0.9. 동일 배포 엔진의 명시적 QA 버튼으로 아침4.554333초/낮7.6초도 native ended 확인. 아침·낮 QA 버튼은 임시 테스트용이며 실제 UI는 현재 시간대 인사 버튼.
- 실제 노래 메뉴 공개 안내: 같은 출처 MP3 HTTP200,10.96초 음성을0.9배로 끝까지 재생.
- 건강 전체 안내9조각 모두 다운로드 완료한 뒤 첫 native playing 이벤트 발생. 모달 내부 정지 버튼으로0.189209초 지점 정지, ended=false/paused=true/error없음.
- 미완성인 음성 설정 안내는 준비 중 메시지로 종료하고 추가 Audio 객체를 만들지 않음. 기본/기기 목소리로 대체하지 않음.
- final defaultPlaybackRate0.9 수정 후26/26 모의 회귀 검사 재통과. 소스 변경 없이 검사.
- 열려 있던 두 앱 탭 모두 새 음성 UI 확인. 새 코드의 모든 다중탭 안전 전환 조합을 실제 재배포로 시험한 것은 아님.
- 임시 검사 버튼·Audio 로거·validator hook은 페이지 재탐색으로 제거. 실제 앱 화면 증거는 tmp/youngwoong-v2-1-live-proof.png.

전체187조각 생성은 아직 진행 중. 청취·전사·유사도·권리 허가·실제 휴대폰 설치/비행기 모드 검사는 완료했다고 주장하지 않음.


## 2026-10-29 은자님용 인사 추가 · 배포 전 검사

- 기존187조각·167항목 전수 검사 완료 후, 새 인사와 개인정보 안내를 반영한 현재169항목·189고유 조각의 정확한 입력 문구/분할/해시/완료 상태 일치 확인.
- 이전 안내 호환용2개를 포함한191 MP3 전부 실제 배포 프록시에서HTTP200/동일 출처/선언 크기/엄격한MPEG/브라우저 네이티브 모노24kHz 디코딩/길이 오차0.2초 이내/비무음 검사를 통과.191개 로컬 파일의 오디오SHA-256도 실제 응답과 일치.
- 수정한 음성 엔진26/26 모의 검사, 인사 버튼 연결7/7 정적 검사, 네 파일 구문 검사 통과.
- 390×844 iframe에서 최대 글자 설정의 문서375/375px, 대화창338/338px 가로 넘침 없음. native :modal=true 및 닫기 버튼 포커스 확인. 실제 휴대폰 검사는 아님.
- 이전 기본 호칭 어머님만 은자님으로 바꾸며 다른 사용자 지정 호칭은 유지. 세 모의 사례에서 메모/날짜별 기록 불변 확인.
- 자동 전사 small: 아침은 문장부호 제외 요청 문구와 일치. 밤은 일부 어미가 다르게 인식되어 medium 재대조 중. 이전 샘플에는 첫머리 추가 발화가 전사됨. ASR 성공 상태는 사람 청취·발음/음색의 완전성 증명이 아님.
- 원래 합성 참조 파일/모델/189조각 생성 계보는 변경하지 않음. 새 기본 인사 재생은 별도MP3이며 기존 샘플/저녁WAV는 새 앱 배포 묶음에서 제외.
- 개인 기록의 임의 합성·외부 전송·기본 기기 음성 대체·자동 재생은 추가하지 않음.


### 최종 인사 파일 선정과 검증 범위

- 현재 계획169항목·189고유 조각의 exact-text/분할/완료 상태를 실제 배포 인덱스와 대조해 일치 확인. 호환용3개를 포함한192 MP3는 앞선191개 전수 검사와 새 밤 파일1개 네이티브 검사로 검증.
- 마지막 음성 엔진 변경 후27/27 브라우저 격리 모의 검사를 통과. 배포 ZIP22개 파일은 소스와SHA-256 전부 일치.
- 아침 자동 전사(small/medium): 좋은 아침이야 은자야. 문장부호 제외 요청 문구와 일치.
- 초기 밤 파일은 두 모델에서 이름 끝 야가 누락되어 사용하지 않음. 이름 뒤 쉼을 넣어 재생성한 최종 밤 파일은 이름 끝까지 전사됨. 최종 medium 전사: 은자야. 잘 자. 좋은 꿈 꾸. 오늘 하루도 고생했어.
- 최종 밤 문구의 꿈 꿔/꿈 꾸 자동 전사 차이가 남아 있어 모든 음절의 정확한 실제 발음 검증 완료로 주장하지 않음. 사람의 청취·음색 유사도·성우 동일성·이용 허가 확인도 별개. 원하지 않은 앞말은 최종 두 인사 전사에 나타나지 않았지만 ASR만으로 절대 부재를 증명하지 않음.
- 최종 아침MP3 SHA-256: 67dd44a89d9b307d7f92e506cc7a70a1239b737d0b5910f12131cd8d5dc3f439 (19,245바이트).
- 최종 밤MP3 SHA-256: 54a76159b5c8d3feef43cba75221ebcebb889768cc2b45cbbdba560a99654499 (39,789바이트, native decode4.88초).
- 합성1번 배치의9분 설치 시간초과 뒤 다음 배치가 실제 새 파일을 생성함. ASR4번 첫 시도는10분 준비 대기 제한으로 종료, 파일 완성 후2번째 시도가 전사 보고서를 생성함. 실패 상태를 생성·청취 성공으로 취급하지 않음.


## v2.1.2 은자님 전용 화면과 호칭 우선 재생 (2026-10-29)

- 화면/설정/백업 복원의 표시 이름은 은자님으로 고정. 개인 기록 저장 키와 스키마는 유지. 공식 자료 파일(data.js, wellness-data.js, wellness.js)은 v2.1.1과 바이트 동일. 건강 본문과 주의사항은 보존하며 호칭/제목만 변경.
- 아침은 '은자야. 좋은 아침이야.', 밤은 기존의 '은자야. 잘 자. 좋은 꿈 꿔. 오늘 하루도 고생했어.'. 낮과 공개 안내는 별도 호칭 MP3를 먼저 재생.
- 본문 전체와 호칭의 다운로드/형식 검증이 끝나기 전에는 아무 소리도 시작하지 않음. 초과 길이/누락/손상/중단/오프라인 실패 시 부분 재생이나 기기 음성 대체 없음.
- 음성 브라우저 모의 검사 27/27, 업데이트 모의 검사 20/20, 런타임 7개 JS 구문 검사 통과. 모의 검사는 실제 음성 청취가 아님.
- 390×844 iframe, 최대 글자 크기의 문서 폭 375/375px와 설정 창 338/338px 확인. 설정 폼의 intrinsic-grid 넘침을 수정. 실제 native modal 및 닫기 버튼 포커스, 이름 readOnly 확인. 실제 휴대폰 검사는 아님.
- v2.1.2는 보이는 온라인 화면에서 60초 간격 SW 확인. 숨김/오프라인/stop 시 타이머 정리. 입력/contenteditable/열린 modal/음성 준비·재생 중 재로딩 보류. 첫 설치는 재로딩하지 않으며 갱신은 안전한 시점에 한 번만 적용. 미디어 확인의 15분 제한은 별도 유지.
- 최초 v2.1.1 전환은 구버전의 playback-unaware guard를 따르므로 홈 인사 중단 가능성이 남음. 신규 보호는 v2.1.2 로드 후 유효.
- 최종 카탈로그 169개 + 낮 인사 1개 = 170항목, 고유 조각 188개, 저장 MP3 202개(과거 문구용 14개 포함). 2026-10-29T03:26:53.230Z에 exact text/chunk/provenance/complete 일치 확인.
- 파일 기술 증거는 이전 192개 + 최초 신규 6개 + 첫 설정 안내 1개 + 최종 짧은 안내 3개를 합친 202개. 동시 202파일 전체 재검사나 청취 승인이 아님. 마지막 로컬 202개 SHA-256은 각 기술 증거와 일치. 참조 AI 샘플 해시 불변.
- 최초 생성: https://github.com/alstnslasla-web/youngwoong-haru/actions/runs/40805179605
- 설정 보충: https://github.com/alstnslasla-web/youngwoong-haru/actions/runs/40809043526
- 완결 문장 재생성: https://github.com/alstnslasla-web/youngwoong-haru/actions/runs/40811206924
- 첫 medium ASR: https://github.com/alstnslasla-web/youngwoong-haru/actions/runs/40810001019. 공통 호칭/아침은 정규화 일치, 밤은 첫 은자야 확인 및 꿔/꾸 차이. 긴 문장의 잘린 조각에서 추가 문장/호칭 오류가 전사되어 해당 세 안내를 짧은 완결 문장으로 교체. 기준 샘플은 재생 파일로 사용하지 않음.
- 최종 배포 ZIP 2,445,226bytes / 23개 런타임 파일 / SW 필수 19개. 각 ZIP 항목은 로컬 소스와 SHA-256 일치. 모델/환경/참조 샘플/저장 프롬프트/개인 기록/검사 프로브 제외.
- 설치 ZIP은 3,098bytes, 안내 HTML(2,652bytes)과 텍스트 두 개이며 APK/오프라인 설치 프로그램이 아님.
- 실제 청취·음색 유사도·실존 인물 이용 허가·실물 Galaxy·비행기 모드·제어된 다중 탭 갱신은 확인한 것으로 주장하지 않음.

### 최종 완결 문장 전사 결과

- https://github.com/alstnslasla-web/youngwoong-haru/actions/runs/40811999518, 2026-10-29T03:30:08.904Z, 전체 파일/time-zero/no prompt/no trimming, 무료 CPU medium.
- 공통 호칭과 아침은 정규화 일치. 아침/밤/공통 호칭 모두 은자야로 시작. 최종 설정 안내도 정규화 일치.
- 밤 꿔/꾸, 동행 도우미/도움이, 음성 안내의 임영웅/임명 및 외부/웹 등 전사 차이는 남음. 따라서 모든 낱말의 정확한 발음·청취 품질이 검증되었다고 주장하지 않음.
- 짧은 완결 문장 교체 후 이전 조각 끝의 '응원합니다'/'다 정해져 있습니다' 추가 구절은 이번 전사에 나타나지 않음. 이것만으로 완벽한 무첨가를 보장하지 않음.
- 전사 대상의 오디오 SHA-256은 기술 검사 대상 파일과 일치. 공개 인사 파일은 생성 참고용 샘플과 별개이며 참조 샘플 자체는 재생·런타임 배포하지 않음.


## v2.1.2 production acceptance (2026-10-29)

- Published on the unchanged Netlify URL at 12:37 KST; app source commit `1ff5303`. No paid upgrade or extra login.
- 14 source-upload files match GitHub. All 21 served runtime endpoints returned HTTP 200. 20 are byte-identical; HTML differs only by the verified non-executable Netlify hosting comment. `_headers` and `_redirects` are deployment configuration, not public-file checks.
- Actual app reports version 2.1.2; service worker activated with no waiting/installing worker. The 19-resource v2.1.2 shell cache has all HTTP 200 responses; the old v2.1.1 shell cache is gone. Reopening the already-open old app initiated the first transition.
- Actual personal records in all 10 protected fields remain unchanged. The settings field displays 은자님 and is read-only. This is not a real custom-name migration or real backup-restore test.
- Native browser playback: new morning 1.60 s and unchanged night 4.88 s each used one file, without a duplicated prefix. Day used prefix 1.52 s then body 7.60 s. All three selected sequences ended without audio errors at current/default rate 0.9. The first morning attempt was interrupted; the foreground retry completed.
- Native settings guide fetched the manifest, complete guide and prefix before first sound. It played the prefix then the exact final guide-4 audio, and both files ended. Blob SHA identities match the audited files. This is selected native playback, not listening to all 202 files.
- Explicit stop, modal close and route navigation stopped an unfinished body. Native hidden-stop observation: true. The initial immediate read after switching tabs preceded the queued stop event; the final event record supersedes it.
- Foreground service-worker update calls were observed; a real approximately 60-second gap was observed: false. Mock results remain 27/27 voice and 20/20 updates. Safe deferral with a future waiting worker and controlled multi-tab/physical-phone acceptance were not tested here.
- Final selected whole-file medium ASR run 40811999518 succeeded. Prefix and morning are normalized-exact; all selected greeting openings contain 은자야. Remaining night/guide transcription differences and lack of human listening/likeness/rights verification remain documented. ASR is no longer pending.
- Final local launcher is 2,652 bytes and two-file installation ZIP is 3,098 bytes. The deployment ZIP is 2,445,226 bytes, 23 files; no synthesis reference/model/prompt/private records/QA probes are deployed.
- Evidence: eunja-v212-production-acceptance-20261029.json, eunja-v212-final-native-playback-20261029.json, eunja-v212-native-public-guide-20261029.json, eunja-v212-production-cache-20261029.json, eunja-v212-record-preservation-20261029.json. These are local QA reports, not private-data uploads.
