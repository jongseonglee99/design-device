# Forge Automotive (12 Studio) — Awwwards

## L0 메타
- kind: rendered
- 출처: awwwards.com (rendered) · 원본: https://forgeautomotive.co.uk/ · 수상 페이지: https://www.awwwards.com/sites/forge-automotive
- 크레딧: 12 Studio (PRO) · Joe Ben Taylor · Adam Roberts · 쿨다운: 2026-10-05 이후 같은 제작사 site 관측 없음
- 수상: Site of the Day (2026-10-25) + Developer Award · SOTD 7.24/10 — Design 7.16 · **Usability 7.09** · Creativity 7.47 · Content 7.50 (Usability 최저)
- **선정 사유 — 창 밖 보충**: 10-31 이후 유효 SOTD 가 1건뿐이라 W44 창 직전 미관측 SOTD 를 채웠다(`2026-11-02--awwwards-brandon-yasin.md` L0 참조)
- 수상 설명(원문): "A performance atelier creating bespoke vehicles through bodywork, interiors, wheels, lighting, exhaust and PPF"
- **장르 겹침 주의**: W44 Spyker 에 이어 자동차 브랜드 2건째(+ 이번 ESR = 자동차 관련 3건). [추론] 이 소스의 최근 수상 장르 편향 — 같은 장르 안의 반복을 독립 수렴으로 세면 안 된다
- 캡처일: 2026-11-02 · 라운드: 2026-W45 (로컬)
- 카테고리: 고급차 커스텀 빌드 아틀리에(+ 재고 차량) · 플랫폼: web-responsive — Next.js + styled-components + Sanity · View Transitions API(37규칙) · Lenis 참조 3
- 시장·언어권: 영국(`lang="en-GB"` · `.co.uk`) — 한국어 조판 해당 없음
- 측정 방법: `fetch-site.mjs` — HTML 310,234 B(인라인 styled-components 92,433 B 포함) + 외부 CSS 3개(93,613 B) 정적 파싱 → `slop-scan --mode marketing --budget` → 보조 집계(`:root` 토큰 · 미디어 쿼리별 규칙 · `aria-label` 과 보이는 글자 대조) → WCAG 상대휘도 직접 계산(`color-mix` 알파는 배경 합성 후).
  **렌더 미측정 · JS 모션 미측정 · WebGL(404 배기가스) 미측정** · 홈 1페이지만

## L1 기하
- [측정] **루트 3단** — `html{font-size:62.5%}` → ≥1600px 68.75% → ≥1920px 75% (10 → 11 → 12px). 퍼센트라 사용자 글자 크기 설정이 반영되고, 큰 모니터에서는 **계단으로** 키운다(vw 0)
- [측정] 간격 토큰 11단: `--gap-xxs` .2 · xs .4 · s .8 · sm 1.6 · m 2.4 · l 3.2 · xl 4 · xxl 6.4 · huge 8 · uber 9.6 · massive 12.8rem (2 → 128px). 비율 2 · 2 · 2 · 1.5 · 1.33 · 1.25 · 1.6 · 1.25 · 1.2 · 1.33 — **작은 쪽은 배수, 큰 쪽은 곡선**. 섹션 간격 토큰은 별도(`--space-s/m/l/xl` 4.8 · 6 · 10 · 12rem)
- [측정] 열 폭이 뷰포트 함수 — `--gap-col: calc(8.333vw + 1.6rem)` (12분의 1 폭 + 고정분)
- [측정] 반경 토큰 5종(.3 · .6 · 1.2 · 1.8rem · 999rem)을 정의했지만 **실사용은 `.3125em` · 1px · 0** — 반경 채널 사실상 죽임(정의만 있고 안 쓰는 토큰)
- [측정] 브레이크포인트 8단(320 · 420 · 700 · 1024 · 1200 · 1400 · 1600 · 1920) + `(min-height:800px)` · `(any-pointer:coarse)` → 모바일에서 sticky · `(hover:hover) and (pointer:fine)` 16 · `(hover:none)` · **`(scripting: enabled)`** — JS 가 켜졌을 때만 등장 연출용으로 요소를 숨긴다(JS 없으면 내용이 그대로 보인다)

## L2 타이포 ★
- [측정] **2패밀리 역할 분리** — 디스플레이 `editorial`(세리프, 폴백 Georgia) · 본문·라벨 Geist Sans. `--font-mono`·`--font-script` 토큰은 정의만
- [측정] **무게가 크기에 반비례한다** — 디스플레이 세리프 **200**(36~140px) · 세리프 소제목 300(20·24px) · 본문 Geist 300(16·18px) · 라벨 Geist **600**(9~10px). 가장 큰 글자가 가장 가볍고, 가장 작은 글자가 가장 무겁다
- [측정] 램프(10px 루트): 라벨 9 · 10 / 본문 16 · 18 / 디스플레이 20 · 24 · 36 · 58 · 64 · 72 · 80 · 96 · 140px + 히어로 h1 `clamp(7.2rem, 10dvh, 9.6rem)` — **히어로 글자가 화면 높이(dvh)의 함수**이고 rem 바닥·천장이 있다(T8 통과)
- [측정] **트래킹은 px 상수 3종** — 디스플레이 −0.2rem(−2px) · 본문 −0.05rem · 라벨 +0.3rem(+3px). [계산] em 으로는 디스플레이 58px −.034em → 96px −.021em → 140px −.014em — **클수록 덜 좁다**(크기 비례 음수의 반대 방향) · 라벨 9px +.33em(극단적으로 넓다)
- [측정] 리딩: 디스플레이 1.2 · 1.1 · 본문 1.4 · **라벨 2.0** — 9px 라벨에 리딩 2
- [측정] `text-transform: capitalize` 52 — 디스플레이 전부를 CSS 로 Title Case. `uppercase` 24(라벨). `text-wrap: balance` 40 · `font-synthesis: none`
- [측정] [계산] 라벨 9px(<1600) · 9.9(1600) · 10.8px(1920) — 퍼센트 루트라 확대·설정에는 반응하지만 기본 상태가 작다
- 한글: 해당 없음

## L3 색
- [측정] 브랜드 토큰 5 — 근흑 2단(무채, 명도 .05 · .09) · **딥 마룬**(색상각 357°, 채도 .91, 명도 .13) · **골드**(37°, 채도 .46, 명도 .58) · **웜 오프화이트**(48°, 채도 .16, 명도 .94). 피드백 토큰 3(positive · negative · warning) — 이 페이지 폼 0, 사용 미확인
- [측정] 대비비
  - 오프화이트 on 근흑 17.31:1 · on 마룬 **14.98** · 골드 on 근흑 8.00 · 골드 on 마룬 6.92
  - 위계는 **`color-mix(in srgb, 오프화이트 N%, transparent)` 알파 사다리** — 80% 11.10 · 60% 6.54 · **55%(라벨) 5.67** · 40%(CTA 호버 테두리, 비텍스트) 3.50 · 10%(선). 텍스트 단계는 전부 4.5:1 이상
- [측정] **마룬이 「어두운 바탕의 한 종류」로 쓰인다** — 명도 .13 으로 근흑과 거의 같은 높이에 있어 오프화이트 글자가 14.98:1 을 유지한다. 채도로 장면을 바꾸고 명도로는 바꾸지 않는다
- [측정] 프리셋 오염 거의 없음 — slop-scan 색 13종 · C7 7종(폰트 이름 포함) — 이번 4건 중 최소
- 다크 전용(라이트 테마 없음)

## L4 표면·깊이
- [측정] 그림자 0 · 반경 사실상 0 — 표면 채널 0단계(slop-scan 「죽임」). 깊이는 사진(img 61 · picture 22)과 마스크(`mask-image` 좌우 30% 페이드 — 로고 띠)
- [측정] `backdrop-filter: blur(4px)` — ≥1024px 의 CTA 버튼 하나. S2 기능/장식 판별 미측정

## L5 모션 ★
- [측정] 커브 토큰 5 — `--easing-bezzy (.8,0,0,1)` · `bezzy2 (.43,.195,.02,1)` · `bezzy3 (.5,0,0,1)` · 페이지 진입 `(.2,.7,.2,1)` · 다음 빌드 `(.7,.05,.13,1)` + `ease-in-out`. 시간 토큰 3단 `--time-s/m/l` .15 · .3 · .6s + 페이지 박자 `--page-beat-dur` 1.2s — **`(hover:none)`(터치 기기)에서는 .6s 로 절반**. 입력 장치가 전환 길이를 정한다
- [측정] **글자 단위 스태거** — CTA 「Start Your Project」 를 글자 18개 `<span>` 으로 쪼개 지연 0.02s 계단(0 → 0.48s, 25단)으로 굴린다(호버 시 `translateY(4em)`). 같은 버튼이 `letter-spacing` 을 전이한다(레이아웃 속성 — M5 검출기는 `letter-spacing` 을 세지 않는다)
- [측정] **View Transitions API** 로 페이지 전환(`::view-transition-old/new(page)`, 전환 종류 `next-build` — dim · rise)
- [측정] **움직임 줄이기 10규칙(CSS) + 인라인 4** — ① CTA 그라디언트 테두리 `animation:none` ② 스케일 리빌 `scale:1; transition:none` ③ **부드러운 스크롤 래퍼 해제**(`html,body{height:auto;overflow:auto}`) ④ **페이지 전환을 공간 이동(rise·dim) → 투명도(fade-out/fade-in)로 교체**.
  `system/kinds.md` 모션 관계 *「움직임 줄이기에서는 공간 이동을 투명도로 바꾸고 같은 정보가 남는다」* 와 같은 처리다(외부 확인 1)
- [측정] 무한 루프 2 — CTA 테두리 그라디언트 회전 4.5s · 로고 띠 20s. **둘 다 CSS 기본값이 `--play-state: paused`** 이고 `running` 으로 바꾸는 CSS 규칙은 0 → [추론] JS 가 조건(뷰포트 진입 등)에서 켠다.
  slop-scan **M4s ⚠️ 는 이 기본 정지를 읽지 못한 결과**다(`var(--play-state)` 의 기본값을 보지 않는다). 화면 안 멈춤 버튼은 없다 — 미측정 부분은 「JS 가 언제 켜는가」
- [측정] `:focus-visible` 10(CTA 1px 점선 등) vs `:hover` 40 · `(hover:hover) and (pointer:fine)` 16 — 호버 효과를 정밀 포인터에만

## L6 구조·IA (registry `takes_for_mode.marketing` — marketing 모드에서만 유효)
- [측정] 순서: h2 "We don’t modify vehicles We build them for you" → **h1** "For Those Who Refuse Ordinary" → 접근 3단계(01/03 Identity · Insight · Cohesion) → 서비스 6(Bodystyling · Interior · Wheels · Lighting · Exhaust · Protection) → Previous Builds → Available Stock → Refuse Ordinary. h2 가 h1 보다 먼저 온다
- [측정] 「n / 03」 번호 + 단계마다 같은 CTA — 접근 3단계가 IA2 3열 카드가 아니라 **순차 서사**(카드 높이·무게 동일 여부는 렌더 미측정)
- [측정] **`aria-label` 이 보이는 글자와 다르다 11건** — 「Start Your Project」 버튼 5개가 `aria-label="Go to Contact"`, 6개가 `"Contact Us"`. 글자를 span 18개로 쪼갠 탓에 접근 이름을 따로 붙였지만 **보이는 글자가 이름에 들어 있지 않다** (WCAG 2.5.3 Label in Name). `.sr-only` 문장 + `aria-hidden` 23 은 있다
- [측정] Skip to content 링크 1 · 404 에 WebGL 배기가스(수상 요소 표기) — 오류 상태를 브랜드 장면으로 설계

## L7 톤·이미지
- [측정] 가시 텍스트 3,429자 · img 61 · picture 22 · svg 6 · video 0 — 사진 주도
- [측정] 보이스: 부정 → 긍정 대구("We don’t modify vehicles / We build them for you") + 형용사 슬로건("Refuse Ordinary" 3회). I4 미발화. 서비스 6개는 구체 명사
- 브랜드: 가는 세리프(200) + 마룬/골드 + 사진. **서체 무게**에 가장 많이 실려 있다

## L8 판정
- **신선함**: (L5) **움직임 줄이기 = 같은 전환의 다른 버전** — 페이지 전환을 끄지 않고 rise/dim 을 fade 로 바꾼다. 부드러운 스크롤 래퍼까지 해제한다.
  (L5) 계속 움직이는 장식 2개의 **기본값이 정지**(`--play-state: paused`)이고 켜는 쪽이 조건부다. (L1) `(scripting: enabled)` 로 JS 없는 방문자에게 내용을 숨기지 않는다
- **포화**: (L2) 큰 글자를 가장 가볍게(200) — W44 A24 · 이번 Brandon Yasin 에 이어 독립 제작자 3곳. (L6) `aria-label` 로 보이는 글자 덮어쓰기 — 같은 라운드 ESR(NIGHTJAR) 12건.
  (L5) 글자 단위 스태거 CTA — [추론] 수상작 관습
- **이식 최소단위**: **움직임 줄이기 블록에서 애니메이션을 지우지 말고 같은 이름의 「투명도판」으로 바꾼다** (`next-build-rise` → `next-build-fade-in`).
  그리고 무한 루프는 `animation-play-state: var(--play-state)` 에 **기본값 `paused`** 로 쓰고, 켤 조건을 따로 둔다
- **트레이드오프 쌍**
  - 얻은 것: 움직임 줄이기 사용자도 같은 정보(페이지가 바뀌었다)를 받는다. 루트를 퍼센트 계단으로 키워 사용자 설정과 큰 모니터를 둘 다 지킨다. 무게 반비례(200 디스플레이 ↔ 600 라벨)로 **크기 차이가 커도 시각적 무게가 고르게** 분포한다 — 140px 세리프가 화면을 누르지 않는다.
    알파 사다리의 텍스트 단계가 전부 4.5:1 이상이다(55% = 5.67) — W44 Spyker 의 50% 실패를 다크 바탕 + 55% 로 피했다
  - 포기한 것: **작은 라벨의 판독성** — 9px · 600 · 대문자 · +.33em 은 읽는 글자가 아니라 무늬에 가깝다(대비는 5.67:1 로 통과).
    **접근 이름**(11개 CTA 가 보이는 글자와 다른 이름). 그리고 디스플레이 트래킹이 px 상수라 140px 에서는 거의 0(−.014em) — 큰 세리프의 자간 보정이 크기에 따라 사라진다

## L9 적용 가능 모드
- `tool`: **적용** — 움직임 줄이기에서 공간 전환 → 투명도 전환 교체, 무한 루프 기본 정지, 퍼센트 루트 계단, `(scripting: enabled)` 게이트. 9px 라벨은 불가
- `consumer`: 부분 적용 — 페이지 전환 View Transitions + 줄이기판, 알파 사다리는 다크 바탕 55% 이상만. 가는 200 디스플레이는 consumer 「큰 타이포」와 맞지만 한글 본문 무게로는 불가
- `marketing`: 적용 — 무게 반비례 위계, 히어로 글자 `clamp(rem, dvh, rem)`(화면 높이 함수), 마룬을 어두운 바탕의 한 종류로. **글자를 쪼갠 CTA 는 `aria-label` 에 보이는 글자를 그대로**
- `graphic`: 부분 적용 — 200 세리프 디스플레이 + 600 대문자 라벨의 무게 반비례 조판, 근흑·마룬·골드·오프화이트 4색 관계(마룬과 근흑의 명도 동급)
