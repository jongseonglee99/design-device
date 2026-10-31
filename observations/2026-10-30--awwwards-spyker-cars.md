# Spyker Cars (The Brink Agency) — Awwwards

## L0 메타
- kind: rendered
- 출처: awwwards.com (rendered) · 원본: https://www.spykercars.com · 수상 페이지: https://www.awwwards.com/sites/spyker-cars
- 크레딧: The Brink Agency (사이트 HTML 에도 "The Brink" 4회 표기) · 쿨다운: 2026-10-02 이후 같은 제작사 site 관측 없음
- 수상: Site of the Day (2026-10-30) · SOTD 7.31/10 — 하위 점수 Design 7.28 · **Usability 7.09** · Creativity 7.50 · Content 7.72 (Usability 가 넷 중 최저)
- 캡처일: 2026-10-30 · 라운드: 2026-W44
- 카테고리: 자동차 브랜드 + 이커머스(Boutique 섹션, € 가격) · 플랫폼: web-responsive (Next.js App Router + Tailwind v4 + GSAP + Lenis)
- 시장·언어권: 네덜란드 브랜드(HTML 주소 표기 Lijnden, NL) · 글로벌 영어(`lang="en"`) · 통화 € — 한국어 조판 해당 없음
- 측정 방법: `fetch-site.mjs` — HTML **480,547 B** + 외부 CSS 10개 **190,884 B** (링크 11개 중 상한 `MAX_CSS=10` 으로 1개 미수집) 정적 파싱
  → `slop-scan --mode marketing --budget` → 보조 정규식 집계(Tailwind 클래스 토큰 빈도 · `:root` · `data-slot`)
  → 대비비는 WCAG 상대휘도로 직접 계산(알파는 배경에 합성한 뒤).
  **렌더(computed style) 미측정 · JS(GSAP·Lenis) 모션 미측정 · 홈 1페이지만** — 수상 설명의 「C8 하루 소유 체험」 경로는 미수집(홈 CSS 에 `data-c8-chapter=afternoon` 셀렉터만 존재)
- 모드 판정: `marketing` (slop-scan 실행 모드)

## L1 기하
- [측정] 베이스 유닛 4px (`--spacing:.25rem`). HTML 클래스 빈도 — gap-2(8px) 24 · px-4(16) 11 · gap-6(24) 7 · gap-10(40) 6 · pb-8(32) 4 · lg:gap-16(64) 2 · `mb-[80px]` · `pt-[80px]` · `md:pt-[120px]`
- [측정] 여백 점프 8 → 16 → 24 → 40 → 64 → 80 → 120 = 비율 2.0 · 1.5 · 1.67 · 1.6 · 1.25 · 1.5. 배수 계단이 아니라 1.25~2.0 곡선
- [측정] **라운드 — 2px 고정 + 완전 원 2단계.** `rounded-[2px]` 19 · `rounded-full` 4 · `rounded-none` 1.
  shadcn 기본 `--radius:.625rem`(10px)은 `:root` 에 정의돼 있지만 HTML 에서 `rounded-md/lg/xl` 사용 **0회** — 라이브러리 기본 반경을 2px 로 덮었다. 요소 크기의 함수는 아니다
- [측정] 그리드: `repeat(12,minmax(0,1fr))` 3 · `subgrid` 1 · 비대칭 분할 `437fr 783fr` ↔ `783fr 437fr` (비 1.79) 좌우 교대
- [측정] **브레이크포인트가 폭만이 아니다** — `(min-width:64rem) and (orientation:landscape)` 6 · `(max-height:52rem) and (min-width:64rem)` 3 · `(hover:hover)` 5 · `(forced-colors:active)` 3.
  높이 832px 이하 노트북을 별도 처리한다. 행동: 폭 5단계(40/48/64/80/86rem) 재배치 + 높이·방향 조건

## L2 타이포 ★
- [측정] **3패밀리 역할 분리** (클래스 동반 빈도로 판별)
  - `futura-pt-condensed` 27회 — **27회 전부 uppercase.** 라벨 14px + `tracking-[0.84px]`(+0.06em) / 디스플레이 56px + `tracking-[2.24px]`(+0.04em) + `leading-[0.85]`
  - `swiss721`(그로테스크) 28회 — 읽기용. 14px/lh 1.6/−0.14px · 20px/lh 1.4/−0.2px · 38px/lh 1.1/−0.38px
  - `PT Serif` 1회 — 15px uppercase +2px. 의식(儀式)용 단일 액센트 [추론: 모토 "Nulla Tenaci Invia Est Via" 자리]
- [측정] 램프(임의값 클래스): 10 · 12 · 14 · 15 · 20 · 32 · 34 · 36 · 38 · 40 · 56 · 120px + `clamp(2.75rem,10vw,7.5rem)`(44~120px).
  본문 14 → 최대 디스플레이 120 = **8.6배**. 20→32 점프 1.6배, 56→120 점프 2.14배 — 불규칙 램프
- [측정] **트래킹은 크기가 아니라 대소문자·패밀리의 함수다.** 그로테스크는 14/20/38px 모두 −0.01em(px 값이 크기에 비례),
  condensed caps 는 +0.04~+0.06em. **리딩은 크기의 함수** — 14px 1.6 → 20px 1.4 → 38px 1.1 → 56px 0.85
- [측정] 디스플레이 클램프의 하한이 `rem`(2.75rem) → 사용자 글꼴 크기 설정을 따른다.
  `observations/2026-08-18--awwwards-the-watch.md` L9 의 「clamp + rem 하한」 조건을 충족하는 사례
- [측정] T7: `max-width:12ch` · `42ch` — 둘 다 45ch 아래 [추론: 디스플레이 헤드라인 줄바꿈 제어용]
- 한글: 해당 없음 (keep-all 없음, 영어 단일)

## L3 색
- [측정] 실사용 = **무채색 2극 + 알파 사다리.** 클래스 빈도 — text-black 24 · text-white 21 · **text-black/50 17** · bg-white 16 · bg-black 6 ·
  bg-black/10·/20·/30·/40 · text-white/50·/70·/80. Awwwards 표기 팔레트도 #000/#FFF 2색
- [측정] 대비비 (알파는 배경 합성 후)
  - 검정 on 흰 21:1 · `#101010` on 흰 19.03:1 · `#101010`/80% on 흰 10.37:1
  - **text-black/50 on 흰 3.95:1** — 본문 4.5:1 미달, 대형 3:1 통과. 17회 사용
  - text-white/50 on 검정 **5.32:1** · /70 9.90:1 · /80 13.08:1 — 같은 50% 알파가 다크 면에서는 통과한다
    (상대휘도 곡선의 비대칭 — 검정 위 흰 알파가 흰 위 검정 알파보다 대비가 높다)
  - `#a7a9ac`(색상각 216°, 채도 0.03 — 사실상 무채) on 흰 2.36:1 · 테두리 `#b2b2b2` on 흰 2.12:1 (비텍스트 3:1 미달)
- [측정] 유일한 채색 `#f24822` — 색상각 11°, HSL 채도 0.89(채도 최상단), 주황빨강. `.animated-grid__col` 배경에 **opacity .22 로만** 쓴다.
  흰 위 합성 1.33:1 / 검정 위 1.23:1 → 텍스트가 아니라 결(texture). 정보를 나르지 않는다
- [측정] **프레임워크 프리셋 오염** — `:root` 에 shadcn 토큰 전 세트(`--card`·`--popover`·`--sidebar-*`·`--chart-1~5`, oklch) + Tailwind 팔레트(red/cyan/blue/gray/neutral).
  사람 판별: 화면에 나오는 색은 검정·흰·그 알파 + `#f24822` 결뿐이다. slop-scan 색 16종·C7 23종은 프리셋을 포함한 수치라 실사용과 다르다
- 다크모드: `prefers-color-scheme:dark` 1회(프리셋) — 사이트 자체 다크 전략 없음. 대신 섹션 단위 **명도 반전**(bg-black 섹션 ↔ bg-white 섹션)

## L4 표면·깊이
- [측정] 그림자 고유 9종(slop-scan) 대부분 Tailwind ring/shadow 프리셋. 사이트 레벨은 `rgba(0,0,0,.35)` · `.3` · `.2` 오버레이
  → 깊이는 그림자가 아니라 **사진·영상 위 검정 알파 오버레이**로 만든다 [추론: video 5 · img 35]
- [측정] `backdrop-filter` 13회 (S2 ⚠️) — 기능/장식 판별은 렌더 없이 불가, 미측정

## L5 모션
- [측정] CSS 듀레이션 실사용: 150 · 200 · 300(13) · 400 · 500(6)ms + 1s · 2s · shimmer 1.6s.
  (`16s`·`2.7s` 는 지도 URL·제원 텍스트 노이즈, `9999s`·`0s`·`1ms` 는 Tailwind 리셋 — 제외)
- [측정] 커브: Tailwind 기본 `(.4,0,.2,1)` 계열 4종 + **사용자 정의 `cubic-bezier(.625,.05,0,1)`** 1 — 폼 밑줄(`.underline-field`) 400ms.
  **같은 곡선이 A24(Ravi Klaassens) 관측에 5회** — 서로 다른 제작자
- [측정] 트랜지션 대상: opacity 15 · opacity+visibility 8 · transform 7 · colors 4 · **all 3** (M5 ⚠️) · width·height 각 1 (M5 ⚠️)
- [측정] 무한 루프: shimmer 1.6s(로딩 스켈레톤) · animate-spin 4
- [측정] `prefers-reduced-motion` 3 — Tailwind `motion-reduce:*` + 사이트 자체 2건(밑줄 전이 끔 · 카운트다운 리빌을 **즉시 보이는 상태로**).
  GSAP 14 · Lenis 21 참조 → 스크롤 모션의 주역은 JS. JS 측 reduced-motion 대응 **미측정**

## L6 구조·IA (registry `takes_for_mode.marketing` — marketing 모드에서만 유효)
- [측정] h2 순서: Pure Passion → Nulla Tenaci Invia Est Via → The Spyker heritage → Spyker Boutique → Partnerships & News → Register for Exclusive Updates.
  **제품 → 모토 → 역사 → 상점 → 소식 → 등록.** IA1 고정 시퀀스(Hero→Logos→Features→Testimonials→Pricing→CTA)와 다르고 3열 피처 카드가 없다
- [측정] 상점이 브랜드 서사 **중간(4번째)**에 박혀 있다 — 이커머스를 별도 사이트로 떼지 않았다
- [측정] Skip to main content 링크 · `:focus-visible` 44 (IA7 미발화)

## L7 톤·이미지
- [측정] 가시 텍스트 4,706자. 보이스는 엔지니어링 명사 중심 — "Iso-grid began as an aerospace solution: interlocking triangles…",
  "4.0-litre twin-turbo V8 — 800 HP, 1,000 Nm". I4 카피 템플릿 없음
- [측정] img 35 · video 5 · svg 21 — 사진·영상 주도. 브랜드는 **서체(condensed caps)와 사진**에 실려 있고 색에는 없다

## L8 판정
- **신선함**: (L1·L3) 컴포넌트 라이브러리(shadcn v4 — `data-slot="button"` 5회 + `:root` 토큰 세트)를 깔고도 라이브러리 룩이 보이지 않는다.
  반경 10px → 2px, 색 → 흑백 알파, 서체 → 3패밀리로 **세 채널을 덮어써서** 기본값을 지웠다
- **포화**: (L5) 동일 곡선 `cubic-bezier(.625,.05,0,1)` 가 독립 제작자 2곳(이 관측 + A24)에서 반복 —
  [추론] 리소스 라이브러리 기본 곡선의 확산. 수상작 모션 균질화 후보 → `anti-patterns.md` M 계열 후보 (1라운드 2건, 미검증)
- **이식 최소단위**: **라이브러리 위에서 반경·색·서체 3채널만 토큰으로 덮어쓴다** — 구조(포커스·`forced-colors`·상태)는 라이브러리에 맡기고
  룩을 결정하는 채널만 교체. 더 작게는: condensed uppercase 를 라벨과 디스플레이 **양쪽에** 써서 크기만 다른 같은 목소리로 묶는다
- **트레이드오프 쌍**
  - 얻은 것: 컴포넌트 접근성(포커스 44 · `forced-colors` · skip link)을 직접 만들지 않고 얻었다.
    색 채널을 흑백으로 죽여 사진·영상이 유일한 색원이 된다 — 제품(차)이 색을 독점한다
  - 포기한 것: **보조 텍스트 대비** — 위계를 알파로만 만든 결과 흰 바탕 50% 검정이 3.95:1 로 본문 기준 미달(17회).
    흑백 2극 체계에서 중간 회색을 알파로 만들면 흰 바탕 쪽에서 먼저 무너진다.
    그리고 프리셋 토큰이 `:root` 에 남아 단일 교체점이 오염됐다(C7 23종 — 쓰지 않는 값이 정본 자리에 있다)

## L9 적용 가능 모드
- `tool`: **부분 적용** — 「라이브러리 + 반경·색·서체 토큰 덮어쓰기」 결정은 이식 가능(불변항 Ⅲ-1 재검토 근거). 흑백 알파 사다리는 50% 단계가 대비 미달이라 그대로는 불가
- `consumer`: 부분 적용 — 섹션 단위 명도 반전 · 사진 주도는 가능. 2px 반경은 토스 기준점(카드 6~10px · 알약)과 충돌 → 채택하지 않음
- `marketing`: 적용 — 3패밀리 역할 분리, 상점을 서사 중간에 두는 L6 순서, rem 하한 클램프 디스플레이
- `graphic`: 부분 적용 — condensed caps 의 크기 무관 양(+) 트래킹 · 0.85 리딩 디스플레이 조판만
