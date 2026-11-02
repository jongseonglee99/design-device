# 서울디자인페스티벌 (seoul.designfestival.co.kr) — GDWEB

## L0 메타
- kind: rendered
- 출처: gdweb.co.kr (rendered) · 원본: https://seoul.designfestival.co.kr/
- 식별자: gdweb `str_no=28076` · 선정증서번호 `202610300004` · 수상명 WINNER PRIZE · gdweb 등록일 2026-10-30
- gdweb 태그: 타겟층 대학생·기업 · 표현방법 모션그래픽·그래픽디자인 · 디자인 컨셉 강렬한·모던한
- 크레딧(제작사): **미확인** — gdweb 「제작사」 칸 「미등록」, 사이트 HTML 에도 제작 표기 없음 [측정]. 그래서 쿨다운 대조가 불가능하다.
  기술 스택(WordPress GeneratePress 자식 테마)이 이번 주 다른 3건(CRA · 그누보드 · Next.js)과 다르다 [측정] — 같은 제작사가 아니라는 증거는 아니다 [추론]
- 캡처일: 2026-11-02 · 라운드: 2026-W45 (로컬)
- 카테고리: 행사(디자인 박람회) — 참가 신청 · 티켓 · 프로그램 · 참가 브랜드 아카이브. 유형 `event` (`system/kinds.md`)
- 행사 시점: 첫 화면 문구 「26.11.26(목) - 26.11.29(일) COEX Hall A」 — **캡처 24일 전, 참가 신청 단계** [측정]
- 플랫폼: web-responsive · **시장·언어권: 한국(한국어 기본 + 영어 전환)** · `<html lang="ko-KR">` · 전환은 `html[data-sdf-lang]` + `localStorage`(인라인 스크립트) [측정]
- 측정 방법: `fetch-site.mjs` 정적 파싱 + 손 수집. **`fetch-site` 가 외부 CSS 7개를 놓쳤다** — 이 사이트는 `<link rel='stylesheet' id='…' href='…'>` 처럼
  **작은따옴표 속성**이다(W44 의 Cafe24 `optimizer.php` 와 다른 원인). 7개를 1회씩 받았다: 자식 테마 `style.css` 161,033B · `font.css` 1,646B ·
  GeneratePress `main.min.css` 19,512B · GenerateBlocks 230B · Gravity Forms 3개(88,910B · 40,330B · 0B). 인라인 `<style>` 5개(14,557B)는 fetch-site 가 받았다
- CMS: **WordPress** — GeneratePress 3.6.1 + 자식 테마 `generatepress_child` · Gravity Forms 3.2.0 · FacetWP · Rank Math [측정].
  사이트의 결정은 **자식 테마 `style.css`·`font.css`·인라인 스타일**로 판정하고, 부모 테마·플러그인 파일은 따로 셌다
- 렌더 미측정 · verified: true — 실제 배포 사이트

## L1 기하
- **루트 `html { font-size: 20px }` 고정 px** [측정 — 미디어쿼리 안에서도 바뀌지 않는다]. rem 이 전부 20px 기준이다(2.4rem = 48px)
- **왼쪽 고정 세로 레일이 헤더 겸 내비** [측정]: `.sdf-header { position: fixed; width: var(--sdf-rail) }` · `--sdf-rail: clamp(12.5rem, calc(8vw + 150px), 16.5rem)`(250~330px) ·
  레일 안 간격 단위 `--sdf-header-unit: calc(var(--sdf-rail) / 11.9)` — 레일 폭의 함수
- **컨테이너 쿼리 단위 글자** [측정]: `clamp(0.85rem, 2.27cqi - 2.2px, 1.2rem)` · `clamp(1rem, 2.65cqi - 1px, 1.4rem)` — 글자 크기를 화면이 아니라 **담는 상자의 폭**에 묶고 rem 바닥·천장을 둔다.
  예외 `.sdf-home-event-title { font-size: 4.5cqw }`(≤1024px) — 바닥 없음
- **`min(rem, vw)` 7규칙의 교차점이 전부 393px** [산술 — 루트 20px]: `min(1.6rem, 8.142vw)` → 32px = 8.142vw 인 폭 393.0px. `min(1.2rem, 6.107vw)` · `min(0.9rem, 4.58vw)` · `min(1.8rem, 9.16vw)` · 행간 `min(1.5568rem, 7.922vw)` 도 393.0px.
  → 393px 폭에서 rem 값, 그보다 좁으면 vw 비례로 줄어든다(360px 에서 내비 글자 32 → 29.3px) — **393px 아트보드 기준 비례 축소**. 전부 `@media (max-width:1024px)` 안 — 열린 메뉴 5규칙 + 통계 숫자 · 연혁 연도 2규칙

## L2 타이포 ★
- **서체: body 한 줄 스택 `"neue-haas-grotesk-display", "Pretendard", sans-serif`** — 라틴 우선, 한글은 유니코드 폴백 [측정]. CSS 변수 분리 없음
- **굵기 컷을 문자 체계별로 어긋나게 매핑한다** ★ [측정 — `font.css` `@font-face`]
  - 라틴: CSS 500 / 700 / 900 ← Typekit n5 / n6 / n7 · 한글: CSS 500 / 700 / 900 ← Pretendard Medium / ExtraBold / Black
  - 주석 원문: "English uses one Adobe cut lighter than the requested CSS weight." · "Korean pairs with the English cuts: 500 Medium, 700 ExtraBold, 900 Black."
  - 같은 CSS 굵기에서 라틴은 한 단 가볍게, 한글은(700 에서) 한 단 무겁게 받는다. [추론] 같은 굵기 숫자에서 한글 획이 라틴보다 가벼워 보이는 것을 컷으로 맞춘다
  - `font-display` 도 갈린다: 라틴 `optional` · 한글 `swap` [측정] — 라틴 서체는 늦으면 포기하고(Pretendard 의 라틴 글리프로 남는다 [추론]), 한글은 늦어도 바꿔 끼운다
  - 굵기 분포: 700(91) · 900(54) · 500(10) · 800(4) · 400(1) — 제목·라벨 대부분이 700~900
- **한글 자간 0 — 큰 제목 포함** ★ [측정]: 자식 테마·인라인 스타일·부모 테마·HTML 통틀어 `letter-spacing` 선언이 **1개**(`.sdf-nav-link { letter-spacing: 0 }`)뿐이다.
  그리고 큰 한글 제목이 실제로 있다 — 첫 화면 타일 `h2.sdf-home-tile-title` 「디자인 브랜드 참가 신청」 「영 디자이너 참가 신청」 = 2.4rem = **48px · 굵기 900 · 행간 1.2**,
  `h1.sdf-home-event-title` 「서울디자인페스티벌」 = 2.2rem = **44px · 700** [측정 — 마크업 클래스 + CSS 값]
- **줄바꿈** [측정]: `* { word-break: keep-all }`(전체 선택자) + `overflow-wrap: anywhere` **19개 규칙**(카드 이름 · 프로그램 제목·본문 · 포럼 상세 · 본문 영역 `.sdf-page-content`).
  `.sdf-participation-intro` 는 **같은 규칙 안에 `keep-all` + `anywhere` 짝**. `break-all` 0 · `break-word` 0
- 행간 비율 지배 [측정]: 1.2(30) · 1(24) · 1.5(22) · 1.6(20) · 1.4(13) · 1.3(13) — 제목 1~1.2, 본문 1.5~1.6
- **두 언어를 같은 마크업에 쌍으로** [측정]: `<span class="sdf-ko" lang="ko">디자인 브랜드 참가 신청</span><span class="sdf-en" lang="en">…</span>` 쌍이 17개씩,
  규칙 하나 `html:not([data-sdf-lang=en]) .sdf-en, html[data-sdf-lang=en] .sdf-ko { display: none !important }` 로 숨긴다. 각 span 에 `lang` 이 붙어 있다
- **신호 `hangul-typesetting` 대조**
  - 항목 1: **재관측 — `overflow-wrap: anywhere` 를 쓴 첫 현장 사례.** W44 는 「현장 5곳 중 `anywhere` 0곳, 전부 `break-word`」였다. 단 짝은 전역이 아니라 컴포넌트별(19규칙)이고 전역은 `keep-all` 만이다
  - 항목 2: **재관측** — 라틴 Neue Haas Grotesk Display + 한글 Pretendard, 스택 순서로 분리. 굵기 컷 매핑까지 문자 체계별로 갈랐다
  - 항목 3 자간: **반례 — 큰 한글 제목(44~48px, 700~900)에서 자간 0.** W44 웨스틴(펜타브리드)이 「한글 대형 제목 0개」라 **시험하지 못한** 「크기가 커질수록 더 음수」 조건을 시험한 반례다. 다른 제작사(미확인이지만 스택이 다르다)·다른 CMS
  - 항목 3 행간: **재관측** — 비율, 큰 글자 1~1.2 / 본문 1.5~1.6

## L3 색
- **토큰 7색 + 흑백** [측정 — `:root`]: 초록 `#00e43d` · 노랑 `#ffd200` · 시안 `#00c3ff` · 분홍 `#ff4eff` · 빨강 `#ff5b58` · 파랑 `#2d45fc` · 회색 바탕 `#ededed`
- 관계 [측정 — WCAG 상대휘도]
  - **검정 글자 on 액센트**: 시안 10.25:1 · 초록 12.16:1 · 노랑 14.47:1 · 분홍 7.79:1 · 빨강 6.89:1 · **파랑 3.37:1**
  - **흰 글자 on 액센트**: 파랑 6.23:1 · 나머지 1.45~3.05:1
- **액센트는 변수 하나, 섹션 클래스가 바꾼다** ★ [측정]: `.sdf-accent-yellow` … `.sdf-accent-white` 7종이 `--sdf-accent` 만 바꾸고, 버튼·라벨·레일 바탕·호버 규칙 20개 이상이 그 변수를 읽는다 — 단일 교체점
- **첫 화면 레일은 색을 돈다**: `.home .sdf-header { animation: sdf-home-header-colors 14s ease-in-out infinite }` — 시안 → 초록 → 노랑 → 분홍을 3.5초씩.
  **검정 글자 대비 7.79:1 이상인 넷만 돈다** — 빨강(6.89)·파랑(3.37)은 순환에서 빠진다 [측정]. [추론] 검정 글자가 얹히는 바탕이라 대비가 높은 넷을 골랐다
- 흰 글자 on 액센트 호버 3규칙(`.sdf-card-link:hover { background: var(--sdf-accent); color: var(--sdf-white) }` 등) — 섹션 액센트가 노랑·초록·시안이면 1.45~2.05:1 [추론 — 어느 섹션이 어느 액센트인지는 정적 미측정]
- 회색(흰 바탕 가정): `#929292` 3.11:1 — 0.9rem = 18px 소속·부제(본문 기준 미달) · `#8c8c89` 3.37:1 · `#9a9a9a` 2.81:1 — 갤러리 점·화살표(비텍스트 3:1 미달)
- 색 고유값: 전체 146종(slop-scan) 중 자식 테마+인라인만 67종 — 나머지는 Gravity Forms·부모 테마 프리셋

## L5 모션 (참고 — takes 밖)
- 자식 테마에 `prefers-reduced-motion` 7블록, 마지막에 `*, *::before, *::after { transition: none !important; animation: none !important }` 전역 [측정]
- slop-scan 전체 폴더 `--mode marketing`: ❌3 (전부 **M3 — 부모 테마 `main.min.css`·Gravity Forms 2파일**) · 사이트 결정만(자식 테마+HTML): **❌0 · ⚠️ 17** — M4s 1(레일 색 순환, 화면 안 멈춤 수단 없음) · T8 4값/7규칙 · G4 6 · M5 3 · C5 1 · C7 2. `--kind event` 도 같은 결과.
  C5(파스텔 그라디언트)는 WordPress 코어 프리셋 클래스 `.has-hazy-dawn-gradient-background` 이고, 색 목록의 `#00d084`·`#0693e3`·`#4721fb`·`#ab1dfe` 도 같은 프리셋이다 → 사이트 결정 아님 [측정]

## L6 구조·IA ★
- **레이아웃: 왼쪽 고정 세로 레일(헤더=내비) + 오른쪽 콘텐츠** [측정 — CSS]
- 내비 1단 「SDF · Exhibit · Visit · News · BDF」 — `<button aria-expanded aria-controls>` 펼침 버튼. 2단 15개(Overview · Archive · Brand List · … · Ticket · Travel & Stay · Notice · Download · Press) 전부 영문 [측정].
  **언어를 KO 로 둬도 내비 라벨은 영어 한 벌뿐**이다 — 내비에는 `sdf-ko` 쌍이 없다 [측정]
- 첫 화면 타일: **영문 눈썹 라벨 + 한글 제목** — 「Participation / 디자인 브랜드 참가 신청」 · 「Participation / 영 디자이너 참가 신청」 · 「Exhibitors / 2025 참가 브랜드」 · 「Overview / 서울디자인페스티벌 소개」 [측정]
  - **시간 상태**: 행사 24일 전 — 첫 두 타일이 「참가 신청」, 셋째가 **지난해(2025) 참가 브랜드**. 올해 목록이 비어 있는 단계에서 작년 아카이브를 보여 준다 [측정 — 타일 순서. 의도는 추론]
- 언어 토글: KO/EN `aria-pressed` 버튼, `.sdf-language button[aria-pressed=true] { display: none }` — **지금 언어가 아니라 바꿀 언어만** 보인다 [측정]
- 접근성 표지 [측정]: 건너뛰기 「컨텐츠로 건너뛰기」 1 · `aria-label` 26 — 「주 메뉴 / Main navigation」 「이전 배너 / Previous banner」처럼 **두 언어를 한 문자열에** ·
  `<img>` 15 중 alt 값 5 / 빈 값 10 · 캐러셀 「1 / 3」 + 이전·다음 버튼 · h1 1 · h2 9 · h3 0(첫 화면 캐러셀 3장이 같은 제목을 h1 + h2 ×2 로 반복)

## L7 톤·이미지
- 카피 밀도: 타일 하나 = 영문 1~2단어 + 한글 명사구 1개. 첫 화면에 문장이 없다 [측정]
- 이미지 15 · 영상 3 · SVG 4. 브랜드는 **6원색 액센트 + 굵기 900 + 검정**에 실려 있다 [추론]

## L8 판정
- **신선함**: (L2) 굵기 컷을 문자 체계별로 어긋나게 매핑하고 그 이유를 `font.css` 주석에 적었다. (L3) 액센트 변수 하나 + 섹션 클래스 7종, 그리고 첫 화면 순환에는 **검정 글자 대비가 높은 4색만** 넣었다.
  (L2) 신호 항목 1 의 `anywhere` 짝이 처음으로 현장에서 나왔다
- **포화**: 영문 내비 + 한글 본문(W44 「제목은 라틴, 한글은 본문 크기」 4/5 와 같은 계열 — 단 여기는 제목이 한글이라 절반만 같다) · 원색 팔레트 + 굵은 그로테스크(디자인 행사 정형)
- **이식 최소단위**
  - 「`--accent` 하나를 섹션 클래스로 바꾸고, 그 위 글자색은 대비가 높은 쪽으로 고정한다 — 색을 순환시킨다면 고정 글자색과의 대비가 기준을 넘는 색만 돌린다」
  - 「한·영 같은 CSS 굵기를 서로 다른 컷에 매핑해 광학 굵기를 맞춘다(`@font-face` 의 `font-weight` 재매핑)」
  - 「두 언어를 같은 마크업에 `lang` 쌍으로 두고 규칙 하나로 숨긴다」
- **트레이드오프 쌍**
  - 얻은 것: 액센트 7색을 써도 규칙은 변수 하나만 읽는다 — 색을 더해도 버튼·라벨 규칙을 건드리지 않는다. 언어 쌍 마크업 → 새로고침 없이 즉시 전환되고 두 언어가 모두 문서에 있다.
    한글 자간 0 → 자간 토큰 0개, 굵기 900 에서도 서체 기본 간격을 믿는다
  - 포기한 것: 두 언어를 늘 함께 내려받는다(문서 무게) [추론]. `aria-label` 은 두 언어를 한꺼번에 읽힌다. 내비는 한국어 판에서도 영어 — **불변항 Ⅰ-2(한국어 우선)와 긴장**.
    루트 20px 고정 → 브라우저 기본 글자 크기 설정이 rem 에 전달되지 않는다(페이지 확대는 된다) [추론 — 확대 렌더 미측정]. 흰 글자 호버는 밝은 액센트 위에서 2:1 아래.
    393px 보다 좁은 폰에서 열린 메뉴 · 통계 숫자 · 연혁 연도 글자가 비례로 줄어든다(T8 ⚠️ — 교차점이 393px 라 360~390px 폰 대부분이 해당)

## L9 적용 가능 모드
- `tool` — **부분 적용**. 액센트 변수 하나 + 섹션(작업 공간·프로젝트) 클래스, 언어 쌍 마크업, 순환 색을 고정 글자색 대비로 거르는 규칙. 원색 순환 모션·굵기 900 일색은 **제외**
- `consumer` — **부분 적용**. 굵기 컷 매핑 · `keep-all` + `anywhere` 짝은 그대로 간다. 세로 레일 헤더는 모바일 앱 관습과 다르다
- `marketing` — **적용**. 원 맥락(유형 `event`) — 신청 단계에서 지난해 아카이브를 보여 주는 시간 상태 결정 포함
- `graphic` — **적용**. 원색 위 검정 글자 대비 규칙, 굵기 컷 매핑. 큰 한글 자간 0 은 신호의 `graphic` 범위 축소(포스터 제목 자간 0, 2026-10-11)와 같은 방향
