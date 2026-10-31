# 코리아 나까조 ICEVAN (icevansnow.com) — GDWEB

## L0 메타
- kind: rendered
- 출처: gdweb.co.kr (rendered) · 원본: https://icevansnow.com/
- 식별자: gdweb `str_no=28010` · 선정증서번호 `202610230006` · 수상명 WINNER PRIZE · gdweb 등록일 2026-10-28 · gdweb 표기명 「코리아 나까조」
- gdweb 태그: 타겟층 여성·남성 · 표현방법 사진·영상·제품 · 디자인 컨셉 모던한·깔끔한·신뢰적인
- 크레딧(제작사): **서로커뮤니케이션**
- 캡처일: 2026-10-30 · 라운드: 2026-W44
- 카테고리: B2B 제조사(업소용 제빙기) 제품 브랜드 사이트
- 플랫폼: web-responsive · **시장·언어권: 한국(한국어)**
- ★ **수집된 문서는 영문판이다** [측정] — `<html lang="en">` · 언어 표시 `EN` · 태그 제거 텍스트 한글 19자 / 라틴 4,872자.
  언어 목록은 `<a href="/">KR</a> <a href="/en/">EN</a>` 인데 `/` 요청(헤더 `Accept-Language: ko,en`)이 EN 판을 돌려줬다.
  한국어판은 **수집하지 않았다** — 같은 호스트 반복 요청 금지. 원인(쿠키·지역 판정 등)은 미확인
- 그래서 이 관측의 지위: **CSS 수준(L2 조판 규칙)은 유효**하다 — 스타일시트가 KR/EN 공용이고 `html[lang="en"]` 분기 5규칙만 영문 전용이다 [측정].
  **HTML 수준(L6 라벨·L7 카피)은 영문판 기준**이고 한국어판 라벨·카피는 **미측정**
- 측정 방법: `fetch-site.mjs` 정적 파싱. HTML 41,103B · CSS 5개 파일 193,743B
- **CMS: 그누보드5** [측정 — `g5_` 11회 · `/css/default.css` · `/js/wrest.js` 등 기본 경로] + 자체 `/assets/css/common.css`.
  JS: GSAP 3.12.5 + ScrollTrigger + ScrollToPlugin · Lenis 1.3.4 · Swiper 11
- 렌더 미측정 · verified: true — 실제 배포 사이트

## L1 기하
- **`clamp(최소px, vw, 최대px)` 가 반응형을 맡는다** [측정] — 글자 크기 `clamp` 122회, CSS 전체 `clamp` 456회. `@media` 는 6개뿐
  (769 · 970 · 1024 · 1200 · `hover: hover`). 모바일 전용 CSS 가 따로 있을 가능성 [추론 — 미수집]
- vw 중간값이 **1920 아트보드**다: `clamp(30px,3.13vw,60px)` → 60 / 1920 = 3.125% · `clamp(16px,0.94vw,18px)` → 18 / 1920 = 0.9375% [측정·산술]
  - 삼성·웨스틴과 같은 1920 환산이지만 **양끝에 px 경계**가 있다 — 하한이 있어 작은 화면에서 글자가 사라지지 않는다
- 반경 `20px`(27) · `8px`(21) · `50%`(18) · `16px`(12) · `3px`(10) [측정]

## L2 타이포 ★
- **서체 1종** [측정]: `"Pretendard Variable", Pretendard, -apple-system, …, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic"` (커스텀 CSS) +
  그누보드 기본 `'Malgun Gothic', dotum` 잔여. 라틴 전용 서체 **없음** → 한·영 서체 분리 **비관측**
- **자간이 em 단위에서도 크기에 따라 더 음수로 간다** ★ [측정 — 같은 규칙의 `font-size` 와 짝지은 값]

  | 크기 (clamp 범위) | 자간 | 행간 | 예 |
  |---|---|---|---|
  | 16px (본문) | -.03em | 1.5 | `body` |
  | 16~18px | -.03em | 1.4 | `.technology-info-text strong` |
  | 17~20px | -.035em | 1.55 | `.technology-info-text p` |
  | 18~24px | -.035em | 1.4 | `.news-item strong` |
  | 20~28px | -.04em | 1.4 | `.news-feature-info strong` |
  | 24~32px | -.05em | — | `.all-menu-copy > p` |
  | 30~60px | -.045em | 1.1 | `.technology-visual h3` |
  | 32~64px | -.05em | .9 | `.about-stat strong` |
  | 80~220px | -.075em | .9 | `.around-title` |
  | 140~280px | -.08em | 1 | `.history-digit-number` |

  - 토스형(em 상수)은 px 로만 비례한다. 여기서는 **em 값 자체가 커지는 경향**이다 → px 로는 이중 비례(16px -0.48px → 280px -22.4px)
  - **엄격한 단조는 아니다** — 예외 4건 [측정]: `.icevan-lineup-info h3`(22~32px) -.035em · `.policy-item h2`(28px) -.035em ·
    `.footer-as > a`(30~48px) -.04em · **`.products-bg-title`(21.88vw ≈ 1920px 폭에서 420px) -.02em** — 가장 큰 배경 글자가 가장 덜 조여져 있다.
    자간이 선언된 규칙 17개에서 (크기 상한, em 자간) 스피어만 순위 상관 **ρ = −0.61** [측정 — 직접 계산] — 강한 경향이지만 1:1 함수는 아니다
  - 행간은 비율이고 크기와 함께 **줄어든다**(1.55 → .9)
- **언어별 행간 분기** ★ [측정]: `html[lang="en"] body { line-height:1.3 }` — 기본(한국어) `body` 1.5 대비 영문이 0.2 작다.
  **한글에 행간을 더 준다**는 결정을 `lang` 선택자로 적었다
- 줄바꿈 [측정]
  - 그누보드 `default.css` 의 `p { word-break:break-all }` 와 커스텀 `p { word-break:keep-all }` 가 **둘 다** 있다 →
    `common.css` 가 나중에 링크되어 `keep-all` 이 이긴다 [추론 — 링크 순서 기준, 렌더 미측정]
  - `keep-all` 6곳: `input,a,button,…` · `p` · `.section-title` · `.section-desc` · `.location-guide-item li` · `.policy-content`
  - **`overflow-wrap: break-word` 는 `.policy-content` 1곳뿐** — 짝은 1/6. `anywhere` 0 · `auto-phrase` 0
  - `break-all` 4곳은 그누보드 표(`.tbl_head01 td`)·제품 비교 표 — 표 칸은 일부러 끊는다
- `:lang()` 0 · `font-feature-settings` 0
- **신호 `hangul-typesetting` 대조** (CSS 기준 — KR/EN 공용 스타일시트)
  - 항목 1: **부분** — `keep-all` 6곳 중 짝은 1곳(`break-word`). 그누보드 `p{break-all}` 와 충돌. `anywhere` 0
  - 항목 2: **비관측** — 라틴 전용 서체 없음(Pretendard Variable 단일). 반례는 아니다 — 분리하지 않는 선택
  - 항목 3 자간: **재관측 + 정교화 후보** — 음수이고, px 뿐 아니라 **em 값 자체가 크기와 함께 깊어진다**(ρ = −0.61, 예외 4)
  - 항목 3 행간: **재관측** — 비율, 1.55 → .9 로 감소. **신규: `lang` 으로 한국어 행간을 영문보다 0.2 크게**

## L3 색
- [측정 — WCAG 상대휘도, 바탕 `#ffffff`]
  - 잉크 `#1d1d1d` **16.86:1** · `#444444` 9.74:1 · `#666666` 5.74:1 · `#aaaaaa` 2.32:1
  - **청색 액센트** `#008ef4` 색상각 205° 채도 100% — 흰 글자 대비 **3.40:1**. 호버 배경(`.contact-item:hover`·`.experience-item:hover` 에 `color:#fff`)·
    공정 번호 활성(`.is-active .process-number`)·`.ice-info` → 큰 글자·비텍스트 기준(3:1)만 통과, 본문 기준 미달
  - 남색 `#00125c` 228° **16.92:1** · `#0053cf` 216° 6.69:1
  - `#3a8afd` 215° 3.37:1 — 그누보드 기본 GNB 호버 잔여(`#gnb .gnb_1dli:hover > a`)
  - 면 `#f4f6f9` 216° 채도 29% — 흰색 대비 1.08:1, 배경 선언 26회. **한색 중립 바탕**
- 액센트 색상각 205~228° 한 대역에 몰려 있다 — 「얼음·위생」 제품 개념과 같은 축 [추론]

## L5 모션 (참고 — takes 밖)
- 스크롤 구동은 GSAP ScrollTrigger + Lenis(JS) — **CSS 정적 파싱으로 측정되지 않는다**. CSS 듀레이션 11종
- `prefers-reduced-motion` **0회** → M3 ❌. Lenis 부드러운 스크롤에도 감속 대체 경로가 CSS 에 없다 [측정 — JS 내부 분기는 미검사]

## L6 구조·IA (영문판 기준)
- 메인 섹션 10개 [측정]: visual → intro copy → slider → solution → technology → standard → care → products → about → support → CTA.
  섹션마다 `.section-category`(작은 분류 표지) + `.section-head`(문장형 제목) 2단 머리
- 기술 3 · 기준 3 · 공정 5단계(Site Consultation → Solution Proposal → Manufacturing & QA → Installation & Commissioning → Maintenance & A/S)
  — 「구매 후 관리」를 공정의 마지막 단계로 넣어 B2B 의 장기 관계를 IA 로 보인다
- 퀵 메뉴(`.quick-menu-links`) · 전체 메뉴 · 마지막 CTA `Need the optimal ice solution?`
- 접근성 표지 [측정]: 건너뛰기 링크 있음 · `aria-label` 1 · `<img>` 43 중 값 있는 `alt` 27 · `<video>` 6
- 한국어판 GNB·라벨: **미측정**

## L7 톤·이미지 (영문판 기준)
- 제목이 **완결 문장**이다: *"Beyond ice-making machines, we deliver tailored ice solutions for your business."* — `h2` 12개 중 10개가 문장
- 기능 소제목 `UV Sterilization` · `Self-Cleaning` 은 구체 명사, `Smart Control` · `Smart Operation` 은 형용사 — I7(마케팅 단어로 기능 회피) 후보 [판정 — slop-scan 미검출]
- **숫자를 그래픽으로**: `.history-digit-number` 140~280px · `.about-stat strong` 32~64px — 연혁·실적 숫자가 가장 큰 활자
- 이미지: 제품 사진 + 영상 6

## L8 판정
- **신선함**: 자간을 **em 값 자체가 크기와 함께 커지도록**(예외 4건) 10여 단으로 적었다(L2). 신호 `hangul-typesetting` 의 두 근거(토스 em 상수 · 카카오 px 개별)
  어느 쪽과도 다른 제3형 — 비율 단위를 쓰면서도 크기 비례를 포기하지 않았다. 그리고 `lang` 으로 한국어 행간을 더 준다
- **포화**: 그누보드 + GSAP/Lenis 스크롤 연출 + 1920 기준 `vw` — 한국 에이전시 기업 사이트의 표준 조합.
  문장형 영문 헤드라인 + `Smart …` 기능명
- **이식 최소단위**: 「자간 토큰을 크기 토큰과 1:1 로 묶되, 값은 em 으로 쓰고 큰 단계일수록 더 음수로」 — 예: 본문 -.03em · 소제목 -.04em · 표시 -.05em 이상.
  그리고 「한국어 행간을 `:lang(ko)` 기본으로 라틴보다 크게」
- **트레이드오프 쌍**
  - 얻은 것: 280px 숫자까지 같은 규칙 안에서 조여진다 — 표시 크기에서 한글·숫자가 헐거워지는 문제(신호 항목 3 의 근거)를 em 체계 안에서 해결.
    `clamp` 양끝 px 경계로 작은 화면 하한을 지켰다
  - 포기한 것: 자간 값 10종 — 토큰 없이 셀렉터마다 적었다(`:root` 사용자 정의 속성은 Swiper 2개뿐). 그누보드 기본 CSS 를 지우지 않아
    `p` 에 `break-all`·`keep-all` 이 **함께 선언**되어 결과가 링크 순서에 걸린다. `keep-all` 을 6곳에 걸고 탈출구(`overflow-wrap`)는 1곳만 줬다

## L9 적용 가능 모드
- `tool` — **부분 적용**. 「크기 단계별 em 자간 심화」는 제목 단계가 3단 이상인 작업 도구 화면에 간다. 280px 표시 숫자·스크롤 연출은 제외
- `consumer` — **적용**. 자간·행간 결정과 `lang` 별 행간이 그대로 간다
- `marketing` — **적용**. 원 맥락. 숫자를 그래픽으로 쓰는 결정 포함
- `graphic` — **부분 적용**. 숫자·라틴 표시 활자의 em 자간 심화는 가능. **한글 포스터 제목에는 적용하지 않는다** — 신호의 범위 축소(포스터 제목 자간 0, 2026-10-11)
