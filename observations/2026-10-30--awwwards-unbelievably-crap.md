# Unbelievably Crap (Liubomyr Ulytskyi) — Awwwards

## L0 메타
- kind: rendered
- 출처: awwwards.com (rendered) · 원본: https://www.unbelievablycrap.com/ · 수상 페이지: https://www.awwwards.com/sites/unbelievably-crap
- 크레딧: Liubomyr Ulytskyi (개인 · 사이트 내 표기 Lviv, Ukraine / GMT+3) · 쿨다운: 2026-10-02 이후 같은 제작자 site 관측 없음
- 수상: Site of the Day (2026-10-29) · SOTD 7.44/10 — Design 7.66 · **Usability 6.89** · Creativity 7.84 · Content 7.45 (Usability 최저 · 이번 라운드 awwwards 4건 중 최저값)
- 캡처일: 2026-10-30 · 라운드: 2026-W44
- 카테고리: 개인 포트폴리오(디지털 디자이너) · 실험작
- 플랫폼: web-responsive **— 단 데스크톱 우선을 명시** ("the crap experience is best viewed with a desktop sorry, not sorry").
  정적 HTML + GSAP 3.12.5 + Barba 2.10.3 + three.js · canvas 7
- 시장·언어권: 우크라이나 제작 · 영어(`lang="en"`) 글로벌 — 한국어 조판 해당 없음
- 측정 방법: `fetch-site.mjs` — HTML **75,123 B** + 외부 CSS **23개 중 10개**(**100,004 B**, 상한 `MAX_CSS=10` —
  `mobile.css`·`gate.css`·`transition.css`·`err.css` 등 13개 미수집) 정적 파싱 → `slop-scan --mode marketing --budget`
  → 보조 집계(주석 · `:root` · keyframes) → WCAG 상대휘도 직접 계산.
  **WebGL 캔버스 7개 — 그 안의 색·모션 미측정.** 렌더(computed style) 미측정
- 특기: 수집된 CSS 99,701자 중 **68,226자(68%)가 주석**(202개). Figma 노드 번호와 결정 이유가 코드에 적혀 있다 — 아래 인용은 전부 그 주석에서 [측정]

## L1 기하
- [측정] **Figma 1920×1080 프레임 좌표를 그대로 쓴다** — 주석 *"FROM FIGMA, AT FIGMA'S NUMBERS. The frame is 1920x1080 with a 10px inset and a 283px left rail"*. 10px 인셋 · 283px 레일 · `left:200 w:91` 텍스트 컬럼
- [측정] 위치를 높이 비율로 — *"Figma puts these at y=355 of 1080 — a proportion of the height rather than a distance from anything, so it is written as one."*
- [측정] 여백: 2 · 4 · 6 · 8 · 10 · 13 · 16 · 22 · 32 · 58 · 60 · 64 — 소단위(2~10)와 대단위(58~64) 2군, 중간(16~32)이 희소
- [측정] 라운드: `var(--card-r,0)` 1건 = **값 0** → 반경 채널을 죽였다.
  (slop-scan `--budget` 은 이 선언을 「반경 1단계 평탄」으로 셌다 — 값이 0 인 선언은 0단계다. 측정기 한계)
- [측정] 브레이크포인트(수집분): `max-width:720px`(HUD 14→11px · 좌표 표시 숨김) · `max-width:860px`(푸터 제목 128px → 12vw · 보조 요소 4종 `display:none`).
  주석 *"Below the site's own breakpoint the band keeps its shape and everything else stacks, which is a different drawing rather than a shrunk one."*
  → **재배치 + 요소 탈락** (G3 의 반대). `mobile.css` 미수집이라 전체 행동은 미측정

## L2 타이포 ★
- [측정] 패밀리: PP Supply Sans + PP Supply Mono (같은 슈퍼패밀리의 산세리프·모노) · 굵기 400 + 200(Ultralight 선언)
- [측정] **크기가 2군이고 중간이 비었다** — 크롬 10px(`--ui-10`, 15회) · 11px · 14px(`--ui-14`·HUD) ↔ 디스플레이 `clamp(2.75rem,6.7vw,8rem)`(44~128px) · 64px(슬래시) · 128px(푸터, 860px 이하 `12vw`).
  14 → 44 점프 **3.14배**, 10 → 128 = 12.8배. 본문 단계가 없다
- [측정] **트래킹 상수 −0.04em** — 10px(−0.4px, 15회)부터 128px(주석 *"-5.12px at the design's 128px size"*)까지 같다. 64px 슬래시만 −0.06em. uppercase 23회
- [측정] **리딩 0.5 를 의도적으로 쓴다** — *"line-height 0.5 is load-bearing — at 1 each block grows ~40px taller and the 64px gap between blocks collapses to ~13px, which is what made them read as crowded."*
  리딩을 글줄 간격이 아니라 **블록 사이 여백을 지키는 수단**으로 쓴다. 디스플레이도 0.5 (그라디언트 채움 박스를 글리프보다 짧게 만들기 위해 — 서체 hhea 990/−210 에서 0.35em 패딩을 역산)
- [측정] 디스플레이 클램프 하한은 `rem`(2.75rem) — 사용자 글꼴 크기 반영. 단 860px 이하 푸터 `12vw` 는 하한이 없다
- [측정] 시계 숫자 tabular figures — *"or the line shuffles sideways every time a 1 becomes a 2"*
- 한글: 해당 없음

## L3 색
- [측정] 토큰: `--c-ink #393939` · `--ui-red #e8271c` · 순 `#ff0000` · 회색 5단(#c8c8c8 · #c3c3c3 · #afafaf · #6e6e6e · #636363) + 흰/검정
- [측정] 대비비
  - 잉크 #393939 on 흰 11.55:1 · `--ui-dim`(잉크 50%) on 흰 **2.75:1**
  - 바(`--ui-bar` #393939) 위 버튼 #c8c8c8 6.90:1 → hover·현재 흰 11.55:1
  - `--ui-red` #e8271c(색상각 3°, 채도 0.82) on 흰 4.43:1(본문 4.5 근소 미달) · 흰 글자 on #e8271c 4.43:1 (복사 완료 상태 칩)
  - 순 #ff0000(색상각 0°, 채도 1.0 — 채도 최상단) on 검정 **5.25:1** (푸터 밴드 10px caps — 통과) · on 흰 4.00:1 · on #393939 2.89:1
  - 구분자 `//` = #c8c8c8 × opacity .5 on #393939 2.92:1 (장식 기호) · 힌트 #9a9a9a on 검정 7.46:1
- [측정] **알파로 위계를 만드는 것을 명시적으로 거부했다**
  - *"One colour for the whole story… a dimmed line read as a rendering fault rather than as emphasis, and mixed brightness down a column is the first thing the eye picks up."*
  - *"It was opacity .6 — … a dimmed link reads as disabled rather than as pointed at."* → 링크 hover 는 흐림이 아니라 **흰색 + 글자 재해독(scramble)**
- [측정] **토큰을 관계로 만든다** — *"#c8c8c8 at 50%, which is also --ui-grey — so it is the token, halved, rather than a fourth grey."* 새 값 대신 기존 토큰 × 계수
- [측정] 빨강의 역할: 커서를 따라가는 사각형(*"the only element here that moves"*) · 푸터 전면 multiply 블렌드 · 복사 완료 상태. 장식 + 상태 2역할
- WebGL 캔버스 7개(구체·휠·터널·X-ray) 내부 색 **미측정** — Awwwards 표기 팔레트 #FF0000/#FFFFFF
- 다크모드: 없음. 블록 01 「검정 방」 ↔ 블록 02 「흰 방」 — **장면 단위 명도 반전** (*"the panel belongs to the black room, and none of it is legible over white"*)

## L5 모션
- [측정] 듀레이션: 50 · 120 · 140 · 180(4) · 240 · 280 · 300ms · 420 · 520 · 600 · 850ms(grain) · 1600ms · 18s(마퀴) —
  마이크로(50~300) · 전환(420~600) · 텍스처(850) · 주변(18s) 밴드가 갈린다
- [측정] **커브가 용도별로 갈린다** — 진입 `cubic-bezier(.22,.61,.36,1)`(이미지 프리뷰: blur 16px + saturate 1.4 + scale 1.08 → 0) · 마퀴 linear(18) ·
  **필름 그레인 `steps(1,end)`** — *"Stepped, not eased — the texture must JUMP between positions. A smooth interpolation would slide the noise across the screen, which reads as a moving pattern rather than as grain resampling."*
- [측정] hover 에 transition 이 없다 — *"the scramble IS the motion"*
- [측정] **리빌 정책을 블록마다 다르게 판정했다** — 주석 쌍: *"it arrives, it is not already there — The brief's one hard requirement"* ↔
  *"it does not arrive, it is simply there … at thirty labels that reads as a wait however short it is"* → 30개 라벨 리빌을 **지연으로 보고 제거**. M2 와 같은 논리를 제작자가 자체 적용
- [측정] `prefers-reduced-motion` 6건 — 방식이 둘: 루프는 `animation:none`(grain · HUD tick · 지도 hatch), 진입은 `animation-duration:1ms`
  (**최종 상태로 착지**시킨다 — 요소가 opacity 0 에 갇히지 않는다)
- [측정] 무한 루프: grain .85s steps · hud-hatch · ftr-run 18s (M4 ℹ️ marketing)
- WebGL · GSAP · Barba 전환 모션 **미측정**

## L6 구조·IA (registry `takes_for_mode.marketing` — marketing 모드에서만 유효)
- [측정] 장면 구조: 블록 01 검정 방(HUD 계기판·지도·시계) → 블록 02 흰 방(2열 텍스트·로고) → 텍스트 스크롤 스트립 → 붉은 푸터 화면. 페이지: wheel(작업) · sphere(about) · tunnel(gallery) · 에러 — Barba 전환
- [측정] h1 0 · h2 1("find your way out of here") — 문서 구조 위계가 거의 없다
- [측정] `:focus-visible` **0** · `:hover` 5 → IA7 ⚠️. 키보드 경로 미설계
- [측정] 모바일: 문구로 데스크톱 권장 + `gate.css`(미수집) — 모바일 경험의 **설계 포기를 명시**

## L7 톤·이미지
- [측정] 가시 텍스트 9,720자 — 이번 4건 중 최다. 보이스: 누아르 탐정 서사("CASE FILE: THE MAN BEHIND THE IMAGE", "Attention is not given. It is taken.") + 글자 오염 효과("0looking", "ob9vious")
- [측정] HUD 라벨: "i am watching you" · "get out" · "do not enjoy" — 반(反)마케팅 어조. I4 템플릿 없음
- [측정] img 13 · 3D 모델 JS(head · skull · skeleton) · 구체 위 사진 카드 65장(주석) — 사진과 3D 가 주 운반체

## L8 판정
- **신선함**: (L3·L5) **결정 근거가 코드 주석으로 산출물에 남아 있다** — CSS 의 68%. 알파 흐림 거부 · 0.5 리딩 · steps 그레인 · 리빌 제거 모두 「왜」가 적혀 있다.
  우리 불변항 Ⅰ-3(근거를 산출물에 남긴다)의 외부 실례
- **포화**: (L5·L7) 필름 그레인 오버레이의 `steps()`/`step-end` 무한 루프 — A24 관측에도 같은 구조(`grain .6s step-end infinite`). 독립 2건.
  HUD·계기판 크롬은 [추론] 실험 포트폴리오 장르에서 흔하다
- **이식 최소단위**: **위계를 알파로 만들지 않는다 — 강조는 색을 바꾸고(흰·빨강), 약화는 크기·위치로.**
  새 회색이 필요하면 기존 토큰 × 계수로 표기한다(*"the token, halved"*)
- **트레이드오프 쌍**
  - 얻은 것: 한 열 안에서 밝기가 섞이지 않아 「렌더링 결함처럼 보이는 흐림」이 없다. 상태 신호(hover=흰 · 현재=흰 · 완료=빨강)가 비활성(흐림)과 혼동되지 않는다. 토큰 수가 늘지 않는다
  - 포기한 것: **크기 중간대와 키보드·모바일 사용자.** 10~14px 크롬과 44~128px 디스플레이 사이에 본문 단계가 없어 9,720자 서사가 크롬 크기 계열로 읽힌다.
    `:focus-visible` 0건, 모바일은 "sorry, not sorry". Awwwards Usability 6.89 가 이번 4건 최저

## L9 적용 가능 모드
- `tool`: 부분 적용 — 「알파 흐림으로 위계 만들지 않기 · 토큰 × 계수 표기 · 리빌 30개는 지연」 결정만. 크기 2군 · focus 부재 · 데스크톱 전용은 불가 (IA7 · G3)
- `consumer`: 부분 적용 — 장면 단위 명도 반전, 진입 reduced-motion 을 1ms 착지로. 데스크톱 전용은 consumer 플랫폼 관습과 충돌
- `marketing`: 적용 — 반마케팅 보이스, 장면 전환 구조, steps 그레인(단 포화 후보)
- `graphic`: 적용 — 0.5 리딩을 블록 간격 수단으로, 상수 −0.04em caps 조판, 순빨강 multiply 전면
