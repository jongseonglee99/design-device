# A24 (Ravi Klaassens) — Awwwards

## L0 메타
- kind: rendered
- 출처: awwwards.com (rendered) · 원본: https://a24.raviklaassens.com/ · 수상 페이지: https://www.awwwards.com/sites/a24
- 크레딧: Ravi Klaassens (개인) · 쿨다운: 2026-10-02 이후 같은 제작자 site 관측 없음
- 수상: Site of the Day (2026-10-26) · SOTD 7.65/10 — Design 7.65 · **Usability 7.31** · Creativity 8.01 · Content 7.95 (Usability 최저)
- 캡처일: 2026-10-30 · 라운드: 2026-W44
- 카테고리: **비상업 팬 프로젝트** — A24 필모그래피 재구성(수상 설명 "experimental, non-commercial") · 영화 카탈로그
- 플랫폼: web-responsive — Webflow 디자인 변수 체계(`--_headings---…` · `<deleted|variable-…>` 잔재)를 Astro 로 내보냄 + Lenis 19 · Barba 24
- 시장·언어권: 미국 브랜드(A24) 소재 · 영어(`lang="en"`) · 제작자 국적 사이트 내 표기 없음 — 한국어 조판 해당 없음
- 측정 방법: `fetch-site.mjs` — HTML **59,352 B** + 외부 CSS 1개 + 인라인 1(**168,020 B**) — 수집 누락 없음.
  `slop-scan --mode marketing --budget` → 보조 집계(Webflow 변수 정의를 직접 해석) → WCAG 상대휘도 직접 계산.
  **3D 디스크 경험은 CSS 3D 변환 0건 · HTML canvas 0 → [추론] JS 런타임 생성, 미측정.**
  렌더 미측정 — 아래 픽셀 크기는 CSS 공식에서 계산한 값이다

## L1 기하 ★
- [측정] **유동 스케일링 공식** — `--size-font = clamp(992px, 100dvw, 3840px) / (1920/16)` → `body{font-size}`.
  대역마다 이상 폭·하한·상한이 바뀐다: ≤991px(이상 991 · 768~991) · ≤767px(767 · 480~767) · ≤479px(479 · 320~479). 모든 치수가 `em` → 레이아웃 전체가 대역 안에서 뷰포트에 비례한다
- [측정] 초광폭 상한 — `(min-width:992px) and (min-aspect-ratio:11/5)` 에서 컨테이너 = `min(100dvw, 100dvh*16/9)`. 21:9 이상이면 폭을 높이의 16:9 로 묶는다
- [측정] **세로 여백은 높이의 함수** — `--_layout---space--` xs 2.667vh · s 5.333 · regular 9.778 · m 21.333 · l 28.444 · xl 35.556 · xxl 49.778vh.
  비율 2.0 · 1.83 · 2.18 · 1.33 · 1.25 · 1.40 — 하단은 2배 점프, 상단은 1.25~1.4 곡선.
  **가로 치수·타입은 폭에, 세로 리듬은 높이에** — 두 축이 다른 변수다
- [측정] 그리드: `minmax(0,1fr)` 계열 10 + 맨 `1fr` 계열 9 (G4 ⚠️ 8건)
- [측정] 반경: 50% 5(디스크·원) · .25em · .5rem · .75em — 작고, em 이라 글자 크기에 비례
- [측정] 페이지 패딩 1.25em / 1.5em / 2em (대역별)

## L2 타이포 ★
- [측정] **3패밀리 역할 분리, 토큰 이름이 곧 역할** — heading = PP Eiko(세리프 디스플레이) · paragraph = PP Neue Montreal(그로테스크) · eyebrow = PP Museum
- [측정] 헤딩 램프(em → 기준 16 대응 px): xs 1.75(28) · s 2.5(40) · m 3.5(56) · l 6(96) · xl 8(128) · xxl 10(160).
  비율 1.43 · 1.40 · 1.71 · 1.33 · 1.25. 문단: s .875 · regular 1 · m 1.125 · l 1.5. eyebrow .625 / .875 uppercase
- [측정] **굵기 역전** — 헤딩 400(normal) < 문단 500(medium). 위계는 크기 + 패밀리(세리프 vs 그로테스크)가 만들고, 굵기는 오히려 본문이 무겁다
- [측정] **트래킹은 역할의 함수, 역할 안에서는 상수** — 헤딩 28~160px 전부 −.04em · 문단 −.025em · eyebrow +.2em. 리딩: 헤딩 1~1.2em · 문단 1.3~1.4em
- [측정→추론] 공식으로 계산한 본문(1em) 크기: 1920 폭 16px · 1440 12px · 1280 **10.7px** · 992 **8.3px** · 991 16px(대역 재시작) · 768 12.4px · 375 12.5px.
  eyebrow(.625em)는 1280 폭에서 6.7px. **px 공식이라 브라우저 기본 글꼴 크기 설정을 무시**하고, 대역 안에서는 줌을 올려도 CSS 뷰포트가 같이 줄어 글자가 같은 물리 크기에 머문다 [추론 — 렌더 미측정]
- [측정] T7: 10ch · 30ch · 35ch · 40ch · 80ch
- 한글: 해당 없음

## L3 색
- [측정] 스와치 4: black · `#f2f2f2`(white) · `#d6d3d1`(grey — 색상각 24°, 채도 .06 웜 스톤) · **brand `#891a20`**(색상각 357°, 채도 .68, 명도 .32 — 짙은 적갈).
  테마 2: 라이트(배경 #f2f2f2 / 글자 검정) · 다크(배경 검정 / 글자 #d6d3d1)
- [측정] 대비: 검정 on #f2f2f2 18.76:1 · #d6d3d1 on 검정 14.10:1 · 검정 on #d6d3d1 14.10:1 · brand on #f2f2f2 8.40:1 ·
  **brand on 검정 2.23:1** — 다크 테마의 nav 로고도 brand 토큰이다(로고는 1.4.3 면제지만 비텍스트 3:1 미달)
- [측정] brand 의 사용처는 **2자리뿐** — `--_theme---navigation--nav-logo` · `cursor-select-bg`(라이트 테마 텍스트 선택). 색은 정보도 위계도 나르지 않고 서명만 한다
- [측정] Webflow 프리셋(`#3898ec` 등)·삭제 변수 잔재가 slop-scan 색 36종 · C7 38종을 부풀렸다. 사람 판별: 실사용은 위 4 스와치 + 포스터 이미지
- [측정] 다크 전략은 **재설계** — 다크 글자를 흰이 아니라 웜 스톤 #d6d3d1 로 낮췄다(라이트 18.76:1 → 다크 14.10:1). 단순 반전 아님

## L5 모션
- [측정] 듀레이션 .1~1.8s 19종 — .3s(17) 최다 · .35s(7) · .2s / .15s(6)
- [측정] 커브 8종: `(.509,.188,.041,.989)` 7 · **`(.625,.05,0,1)` 5 — Spyker(The Brink Agency) 관측과 동일 곡선** · `(.77,0,.18,1)` 2 · `(.32,.72,0,1)` 2 ·
  오버슈트 `(.34,2.27,.64,1)` 1 · `(.65,0,0,1)` · `(.59,1,.88,1.01)`
- [측정] **필름 영사기 흉내 루프** — grain .6s · btn-film-jitter .4s · btn-film-wiggle .45s · nav-plate-jitter .55s · nav-text-jitter .45s, 전부 `step-end infinite`.
  주제(영화)를 모션 문법(게이트 흔들림)으로 옮겼다. scroll-next-hint 1.8s 부드러운 루프
- [측정] M5: `transition:all` 4 · height 1 · width 2
- [측정] reduced-motion: 전역 `*{transition-duration:.01ms!important; animation-duration:.01ms!important; animation-iteration-count:1!important; scroll-behavior:auto!important}`
  + 프리로더 JS 가 `matchMedia("(prefers-reduced-motion: reduce)")` 면 건너뜀 + 부품 3. **1회 반복 + .01ms = 최종 상태로 착지**
- 3D 디스크 회전 · Lenis 스크롤 미측정

## L6 구조·IA (registry `takes_for_mode.marketing` — marketing 모드에서만 유효)
- [측정] h1 "Discover the A24 library of Films" · h2 영화 제목 12개(2026 → 2015 역순) · 내비 Films / Television / Index
- [측정] 영화마다 감독 · 연도 · 출연 · **평론 인용 2개 + 별점**(예: "The Playlist — Something Far More Haunting · 5")
- [측정] 사운드 기본 꺼짐 + "TAP FOR SOUND" — 소리 자동 재생 없음
- [측정] `:focus-visible` 27 · `:hover` 36 · `.sr-only` · `(hover:hover) and (pointer:fine)` 7
- 정렬 축: 연도 역순 단일 축

## L7 톤·이미지
- [측정] 가시 텍스트 3,879자 — 카피가 거의 전부 **데이터**(제목 · 감독 · 출연 · 평론 인용). 제작자 문장은 거의 없다
- [측정] 이미지: 디스크 아트워크 webp 12(CDN) — 포스터를 원형 디스크로 재가공. 브랜드는 서체(PP Eiko 세리프)와 짙은 적갈 서명에 실려 있다

## L8 판정
- **신선함**: (L1) **가로=폭, 세로=높이** — 타입·가로 치수는 뷰포트 폭에, 섹션 사이 세로 여백은 뷰포트 높이(vh)에 각각 묶는 이원 스케일.
  (L2) 헤딩이 본문보다 가볍다(400 < 500) — 크기·세리프가 위계를 충분히 나르므로 굵기를 빼냈다
- **포화**: (L5) `(.625,.05,0,1)` 곡선(Spyker 와 공유) · `step-end` 그레인(Unbelievably Crap 과 공유) · Webflow 유동 스케일 변수 체계 [추론: 리소스 라이브러리 계열].
  이번 라운드 awwwards 4건 중 3건이 공유 부품을 갖는다
- **이식 최소단위**: **세로 리듬 토큰은 vh 로, 가로·타입 토큰은 폭 기준으로 분리한다.** 더 작게는 「크기·패밀리 대비가 충분하면 헤딩 굵기를 본문보다 낮춘다」
- **트레이드오프 쌍**
  - 얻은 것: 1920 디자인 프레임의 비례가 대역 안 모든 폭에서 보존되고(브레이크포인트 3개로 4대역), 세로 여백이 화면 높이에 맞춰 한 화면 단위 구성이 유지된다.
    토큰 이름이 역할이라(heading-m · paragraph-s) 교체점이 명확하다
  - 포기한 것: **사용자 글꼴 크기 설정과 대역 내 줌.** px 공식이라 기본 글꼴 설정이 무시되고, 하한이 컨테이너(992px)에만 있고 글자에는 없어
    992~1280 폭 노트북에서 본문 8.3~10.7px [추론]. The Watch(2026-08-18) 관측의 「clamp 로 하한」 조건을 형식상 충족하면서 실질은 실패하는 사례 —
    **하한은 컨테이너가 아니라 결과 글자 크기에 걸려야 한다**

## L9 적용 가능 모드
- `tool`: 부분 적용 — 역할 기반 토큰 이름, 다크 글자 낮추기(재설계). 유동 px 스케일은 **불가**(불변항 Ⅰ-1 · 밀도 화면에서 8px 본문)
- `consumer`: 부분 적용 — vh 세로 리듬은 한 화면 한 결정 구성에 가능. 유동 px 스케일 불가
- `marketing`: 적용 — 이원 스케일(단 글자 하한을 rem 으로 따로 클램프할 때만), 굵기 역전, step-end 필름 지터(포화 주의)
- `graphic`: 적용 — 세리프 디스플레이 −.04em 상수 · eyebrow +.2em · 굵기 역전 조판
