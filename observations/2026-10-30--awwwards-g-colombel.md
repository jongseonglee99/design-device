# G. Colombel — Portfolio 2026 (Guillaume Colombel) — Awwwards

## L0 메타
- kind: rendered
- 출처: awwwards.com (rendered) · 원본: https://guillaumecolombel.fr/ · 수상 페이지: https://www.awwwards.com/sites/g-colombel-portfolio-2026
- 크레딧: Guillaume Colombel (프리랜스 인터랙티브 개발자, Paris — 사이트·수상 설명 표기) · 쿨다운: 2026-10-02 이후 같은 제작자 site 관측 없음
- 수상: Site of the Day (2026-10-28) · SOTD 7.50/10 — Design 7.56 · **Usability 7.27** · Creativity 7.81 · Content 7.35 (Usability 최저)
- **출처 독립성 주의** [측정]: 사이트 본문에 "Awwwards Jury since 2019" · "16x Awwwards, Site of the Day" — 제작자가 이 소스의 심사위원이다
- 캡처일: 2026-10-30 · 라운드: 2026-W44
- 카테고리: 개인 포트폴리오(크리에이티브 개발자) · 플랫폼: web-responsive — Nuxt(+Vite) · three.js · canvas 1(WebGL 「stele」)
- 시장·언어권: 프랑스 제작 · 영어(`lang="en"`) — 한국어 조판 해당 없음
- 측정 방법: `fetch-site.mjs` — HTML **40,131 B**, CSS 는 전부 인라인 `<style>` 9개(**23,384 B**) · 외부 CSS 0 → **수집 누락 없음**.
  `slop-scan --mode marketing --budget` → 보조 집계(셀렉터별 font-size · 알파 hex · 미디어 쿼리) → WCAG 상대휘도 직접 계산.
  **헤드라인·작업물 이미지는 WebGL 캔버스 안** — DOM 텍스트는 1,017자뿐. 캔버스 부분의 L3·L5 미측정 · 렌더 미측정

## L1 기하
- [측정] 반경: `50%` 1종(점·원) — 사각형 모서리는 전부 0 → 반경 채널 사실상 죽임.
  (slop-scan 「반경 1단계 평탄」은 원형 점을 단계로 센 것 — 측정기 한계)
- [측정] 여백: 4 · 5 · 6 · 8 · 10 · 13 · 14 · 18 · 22 · 24 · 28 · 38 — 엄격한 베이스 유닛 없음(5 · 13 · 22 홀수 혼재)
- [측정] **브레이크포인트가 종횡비의 함수다** — `(max-aspect-ratio:4/5)` 4 · `(max-aspect-ratio:249/500)` 2 · `(max-width:768px)` 8 · `(pointer:coarse)` 2 · `(hover:hover)` 10
- [측정] HTML 오버레이 좌표를 vh 로 고정 — `#stele-loading{height:74.9vh; left:calc(50% + 34.6vh); top:8.08vh}`.
  **가로 위치를 높이 단위로** 적었다 → [추론] 높이에 맞춰 크기가 정해지는 3D 오브젝트와 DOM 을 정렬하기 위해
- [측정] 측정폭 `max-width:30ch` · `34ch` (T7 ⚠️) — 바이오 문단

## L2 타이포
- [측정] **단일 패밀리** Neue Montreal 22회 (T1 ⚠️ marketing) · 굵기 400 / 500 / 600 각 4회
- [측정] DOM 램프는 **전부 작다**: 10px · 11(.6875rem) · 12(.75rem) · 13(.8125rem) · 14(.875rem) · 17(1.0625rem) · 20(1.25rem) · 24px(1.5rem).
  비율 1.10 · 1.09 · 1.08 · 1.08 · 1.21 · 1.18 · 1.20 — 소형 구간을 1.1 안팎 간격으로 촘촘히 나눴다. 디스플레이는 WebGL 로 옮겨 DOM 최대 24px
- [측정] 유일한 대형 DOM 텍스트는 WebGL 불가 환경의 404 폴백 `34vw` (`#lost.no-gl .code{opacity:1}`)
- [측정] 크기 단위 rem 22회 vs px 2회 — 사용자 글꼴 크기 설정 반영
- [측정] **트래킹은 작을수록·대문자일수록 넓다** — 17px 본문 +.005em · 12px 목록 +.02em · 10px 라벨 +.06em · 11px uppercase 소제목 +.12em.
  리딩 1.5(본문) · 1~1.2(UI)
- 한글: 해당 없음

## L3 색
- [측정] 토큰 `--black:#050404`(색상각 0°, 채도 0.11 — 미세 웜) · `--ivory:#f0ebe2`.
  실사용 전경은 `#f4f2ee`(색상각 40°, 채도 0.21 — 웜 아이보리) **한 색의 알파 사다리 10단**: .95 · .92 · .90 · .86 · .70 · .62 · .60 · .55 · .42 · .35 (+ 배경 .22 · .35)
- [측정] 사다리 대비 (on #050404): 1.0 18.31:1 · .92 15.39 · .86 13.43 · .70 8.92 · .62 7.10 · .55 5.71 · **.42 3.68** · **.35 2.85**.
  .42 단계 = 수상 목록 소제목(11px uppercase) — 본문 4.5:1 미달
- [측정] 액센트 2: `#ffe8cd`(색상각 32°, 채도 1.0, 명도 .90) 17.24:1 — nav hover · `#ffdab0`(색상각 32°, 명도 .85) 15.51:1 — 바이오 링크.
  **같은 색상각 32° 의 명도 2단**이고 아이보리(40°)와 색상거리 8°뿐 — 액센트가 「다른 색」이 아니라 「더 따뜻한 같은 색」이다
- [측정] Awwwards 표기 팔레트 `#A74024`(색상각 13°, 채도 .65, 테라코타) — CSS 에 없음 → [추론] WebGL 내부. on #050404 3.32:1
- [측정] slop-scan 「색 2단계 평탄」 판정은 hex 고유값만 센 결과다 — 실제 위계는 알파 10단에 있다. **측정기가 알파 사다리를 세지 못한다**
- 다크 전용(라이트 테마 없음)

## L4 표면·깊이
- [측정] 그림자 0 · 사각 반경 0 — 표면 채널 0단계. 깊이는 WebGL 3D 가 전담한다

## L5 모션 ★
- [측정] 고유 듀레이션 22종(.06~1.2s). 상위: .25s(26) · .28s(26) · .5s(14) · .24s(10) · .4s(10) · .2s(8) · .46s(8).
  (`fetch-site` 출력의 「14종」은 출력 상한 14 에 걸린 값이다)
- [측정] **커브가 방향별로 갈린다** — 퇴장 `cubic-bezier(.55,0,.75,.2)`(ease-in, 26) · 진입 `cubic-bezier(.22,1,.36,1)`(ease-out quint, 24) ·
  hover 오버슈트 `cubic-bezier(.3,2.2,.45,1)`(제어점 y=2.2 — 큰 튕김, 8: nav 단어 지터) · 선 그리기 `(.65,0,.35,1)` in-out · 404 노트 `(.215,.61,.355,1)`
- [측정] 예: 'visit' 링크 hover — 화살표 out .32s ease-in → in .45s ease-out(지연 .2s) · 밑줄 .8s in-out. 화살표 4상(leave · erase · draw · undraw) keyframes
- [측정] **reduced-motion 14건** — 전역 `*{animation:none!important;transition:none!important}` + 부품별 13(지터 transform 제거 · 화살표 enter `display:none`). 이번 4건 중 최다
- [측정] 입력 장치 조건 — hover 효과는 `(hover:hover)` 안에서만(10) · `(pointer:coarse)` 2 · **`:focus-visible` 76 vs `:hover` 86** — hover 규칙마다 focus 짝을 붙였다
- WebGL(stele) 모션 미측정

## L6 구조·IA (registry `takes_for_mode.marketing` — marketing 모드에서만 유효)
- [측정] 단일 화면 + 패널: 프로젝트 목록 12개(01~12, 텍스트만 — DOM img 0) · About 패널 · 프로젝트 시트 · 이전/다음 · 404. h1 1(이름+직함)
- [추론] DOM 이 아니라 3D 장면이 주 내비게이션
- [측정] 사운드 토글 존재 — reduced-motion 시 스피커 애니메이션 정지
- [측정] WebGL 불가 폴백(`.no-gl`) 존재 — 실패 상태 설계 1건

## L7 톤·이미지
- [측정] 가시 DOM 텍스트 1,017자 — 이번 4건 중 최소. 카피는 이력·수상 나열(16x SOTD · 11x FWA …) — 권위 목록이 곧 카피다
- [추론] 작업물 이미지는 전부 WebGL 텍스처 (DOM img 0)
- 브랜드: 3D + 모션 + 웜 아이보리. 서체에는 없다 (단일 Neue Montreal)

## L8 판정
- **신선함**: (L3) **한 색 × 알파 10단**으로 전경 위계 전부를 만든다 — 색 채널을 「색 수」가 아니라 「불투명도 단계」로 살렸다.
  (L5) 진입/퇴장 커브를 방향으로 분리하고 hover 1개마다 `:focus-visible` 1개를 짝지었다
- **포화**: (L1·L7) 「WebGL 장면 + 작은 그로테스크 UI 오버레이 + 웜 아이보리 on 웜 블랙」은 [추론] 크리에이티브 개발자 포트폴리오 장르의 기본형.
  제작자가 Awwwards 심사위원이라는 점까지 포함해 **소스 편향 신호** — 이 장르의 반복 수상은 소스 성격일 수 있다
- **이식 최소단위**: **퇴장은 ease-in, 진입은 ease-out, 같은 요소의 out → in 사이에 지연 .2s.**
  그리고 hover 규칙을 쓸 때 같은 블록에 `:focus-visible` 을 함께 쓰고 `(hover:hover)` 로 감싼다
- **트레이드오프 쌍**
  - 얻은 것: 토큰 2개(검정·아이보리)로 10단 위계 — 단일 교체점이 극단적으로 작다. 색상각 32~40° 안에 전부 있어 액센트가 튀지 않는다.
    모션의 방향(들어옴/나감)이 커브만으로 읽힌다
  - 포기한 것: **알파 하단의 대비**(.42 → 3.68:1, .35 → 2.85:1 — 11px 대문자 소제목이 본문 기준 미달)와 **DOM 타이포 위계**
    (최대 24px · 단일 패밀리 — WebGL 이 실패하면 위계가 사라지고 폴백은 404 한 장뿐). 알파 겹침은 배경이 WebGL 일 때 대비를 예측할 수 없다(렌더 미측정)

## L9 적용 가능 모드
- `tool`: 적용 — 진입 ease-out / 퇴장 ease-in 분리, hover 마다 focus-visible 짝, `(hover:hover)` 게이트. **알파 사다리는 .55 이상 단계만**(5.71:1 이상) — 하단 2단은 불가
- `consumer`: 부분 적용 — 같은 색상각 안의 명도로 액센트 만들기. 다크 전용 · DOM 24px 상한은 consumer 「큰 타이포」와 충돌
- `marketing`: 적용 — 오버슈트 hover `(.3,2.2,.45,1)` 는 marketing 에서만
- `graphic`: 부분 적용 — 웜 블랙(채도 .11) / 웜 아이보리 2색 체계만. 모션 · hover 무관
