# 스튜디오 오케이고 (okgocorp.com) — GDWEB

## L0 메타
- kind: rendered
- 출처: gdweb.co.kr (rendered) · 원본: https://www.okgocorp.com/
- 식별자: gdweb `str_no=28033` · 선정증서번호 `202610270001` · 수상명 WINNER PRIZE · gdweb 등록일 2026-10-27 (W44 가 고르지 않은 항목 — W44 관측의 가장 이른 등록일과 같은 날)
- gdweb 태그: 타겟층 기업 · 디자인 컨셉 신비적인 · 주색상 BLACK
- 크레딧(제작사): **스튜디오 오케이고**(자사 스튜디오 사이트) — 쿨다운 목록과 겹치지 않음
- 캡처일: 2026-11-02 · 라운드: 2026-W45 (로컬)
- 카테고리: 크리에이티브 에이전시 자사 사이트 — 포트폴리오 · 서비스 · 문의 폼
- 플랫폼: web-responsive · **시장·언어권: 한국 회사, 영어 사이트** · `<html lang="en">` — 한국어는 회사 소개 1문단(2줄)뿐 [측정 — 보이는 텍스트 68줄 중 한글 2줄]
- 측정 방법: `fetch-site.mjs` 정적 파싱. HTML 237,418B(Next.js 서버 렌더 + RSC 페이로드) · CSS 2개 38,404B(Tailwind v4.1.13)
- CMS: 없음 — Next.js + Tailwind v4 [측정 — `_next/static` · 라이선스 주석]
- 렌더 미측정 · verified: true — 실제 배포 사이트

## L1 기하
- 이름 있는 2단 고정 스케일 [측정]: `title-1-m` 24 → 40px · `title-2-r` 22 → 36px · `body-1-l` 16 → 22px · `body-2-*` 14 → 18px · `body-3-*` 12 → 16px · `body-4-r` 11 → 14px — 전부 `@media (min-width:768px)` 하나로 갈린다
- 히어로 `clamp(64px, 14vw, 128px)` 1개 — px 바닥 → slop-scan T8 0건
- 반경 거의 없음(0 · .25rem · Tailwind 기본 토큰 2) [측정]

## L2 타이포 ★
- **서체 — 한글 서체가 스택에 없다** [측정]: `#root, body, html { font-family: helvetica-neue-lt-pro, -apple-system, sans-serif }`.
  `@font-face { font-family: Pretendard }` 가 3굵기(400·500·600) 선언돼 있지만 **어느 규칙도 `Pretendard` 를 쓰지 않는다**(CSS·HTML 전수). 한글은 OS 폴백으로 렌더된다 [추론 — macOS Apple SD 산돌고딕 Neo / Windows 맑은 고딕]
- **병기 한글을 크기·행간으로 보정한다** ★ [측정]: 같은 내용의 영·한 두 문단이 나란히 있다
  - 영어 `<p class="whitespace-pre-line body-3-l sm:body-1-l">` · 한국어 `<p class="… ko">`
  - ≥768px: 라틴 `.body-1-l` **22px · 행간 1.1** → `.body-1-l.ko` **19px · 행간 1.3** — 한글을 라틴의 **0.86배**로 줄이고 행간을 0.2 늘린다
  - <768px 에는 보정이 없다 — 둘 다 16px · 1.1
  - 보정 수단이 **클래스(`.ko`)이고 `lang` 속성이 아니다** — 한국어 문단이 문서 언어 `en` 아래에 그대로 있다
- 줄바꿈 [측정]: 원문에 **손으로 넣은 개행** + `whitespace-pre-line` — 「…브랜드의 정체성과 / 경험을 통합적으로 설계하는…」. `keep-all` 0 · `overflow-wrap` 0 · `break-all` 0
- 자간: `letter-spacing` 선언 0(리셋의 `inherit` 2개만) — Tailwind `tracking-*` 도 쓰지 않는다 [측정]
- 굵기: 300 · 400 · 500 — **300(light)이 본문** [측정]
- **신호 `hangul-typesetting` 대조**
  - 항목 1: **해당 없음** — 한글 1문단, `keep-all` 없이 손 개행. 한국어 조판이 대상이 아닌 사이트라 반례로 세지 않는다
  - 항목 2: **관측 안 됨** — 한글 서체 미지정(선언만 있고 사용 없음)
  - 항목 3 자간: **해당 없음** — 한글 본문 1문단, 자간 0. 같은 이유로 반례로 세지 않는다
  - 항목 3 행간: **언어별 행간 분기 재관측** — 한글 1.3 / 라틴 1.1. W44 나까조(라틴 1.3 / 한글 1.5)와 **같은 방향**(한글이 더 넓다)

## L3 색
- **검정 바탕 + 근백색 글자** [측정 — WCAG 상대휘도]: `#000` 위 `#f8f8f8` **19.77:1**. 보조 글자 `#fcfcfc99`(60% 흰) — 검정 위 실효 `#979797` **7.19:1** [산술 — 알파 합성]. 테두리 `#f8f8f84d`(30%)
- 액센트 없음 — 색 채널은 명도(알파) 단계뿐. oklch 11종은 Tailwind 기본 팔레트(빨강 · 초록 · 회색 계열)로 폼 상태 배경 50% 알파에만 보인다 [측정 — 값. 쓰임은 추론]
- 브랜드는 **자동재생 영상과 서체**에 실려 있다 [추론]

## L5 모션 (참고 — takes 밖)
- `prefers-reduced-motion` **0회** → M3 ❌ 2(CSS · HTML) · M4 ❌ 1 — 「SAY - Hi!」 마퀴 `TalkModal_slideText 6s linear infinite`
- `<video>` 10개 전부 `muted loop autoPlay playsInline`, `controls` 0 — **멈출 수단 없는 자동 영상 10개** [측정]. M4 검출기는 CSS 애니메이션만 센다 — 영상 10개는 세지 않았다(기계 미검출)
- slop-scan `--mode marketing`: **❌3 · ⚠️10**(S2 3 · C7 1 · M5 6)

## L6 구조·IA
- 메뉴: 「MENU」 토글 → About Us · Works · Our Brands + SNS 4 [측정]
- 섹션: 히어로 → 소개(영 · 한) → Selected Works → And We Have…(서비스 5: BRAND DEVELOPMENT / INTELLECTUAL PROPERTY / PRODUCT DESIGN / WEB DEVELOPMENT / POP-UP STORE) → SAY HI!(문의 모달) [측정]
- 문의 폼 3필드(「YOUR NAME *」 「HOW CAN WE ASSIST YOU TODAY? *」 「EMAIL *」) + 「SEND」 + 성공 문구 「Your inquiry has been sent successfully!」 — 성공 상태는 있고 오류 문구는 정적 HTML 에 없다 [측정]
- **`user-select: none` 을 `#root, body, html` 에** — 페이지 전체 글자 선택이 막혀 있다. 주소 「3F, 42, Teheran-ro 57-gil, …」 도 복사할 수 없다(메일은 `mailto:` 링크라 누를 수는 있다) [측정]
- 문서 구조: h1 「STUDIO OKGO」 · h2 3 · h3 0 — 전부 영어 · `<img>` 12 중 alt 값 10 · `aria-label` 18 [측정]

## L7 톤·이미지
- 카피: 영어 대문자 라벨 + 짧은 선언 — 「Go Worldwide,」 「Design Powerhouse」 「(We don't bite)」 [측정]
- 포트폴리오 설명은 RSC 페이로드 안에 한국어로 있다(「서울 감성의 한 스쿱, 세계의 맛」 등) — 상세·모달에서만 나오는 것으로 보인다 [추론]
- 이미지: 영상 10 · 이미지 12

## L8 판정
- **신선함**: (L2) 병기 한글만 **크기 0.86배 · 행간 +0.2** 로 따로 맞춘다 — 같은 문장 두 판을 나란히 둘 때 한글이 라틴보다 커 보이는 것을 **크기**로 보정했다 [측정 — 값. 의도는 추론]. 이번 4건 중 문자 체계 보정을 크기로 한 유일한 건이다
- **포화**: 검정 바탕 + 영문 대문자 + 자동재생 영상 그리드 + 「SAY HI」 마퀴 — 크리에이티브 스튜디오 사이트 정형
- **이식 최소단위**: 「영·한 같은 문장을 병기할 때 한글 쪽에 크기 보정 비율과 행간을 따로 준다(여기 0.86 / +0.2) — 단 클래스가 아니라 `:lang(ko)` 에 묶는다」
- **트레이드오프 쌍**
  - 얻은 것: 해외 고객 대상 영어 우선 · 병기 한글 문단의 시각 무게가 영어와 맞는다. 2단 고정 px 스케일 → 관리할 값이 적다
  - 포기한 것: 문서 언어 `en` + 한국어에 `lang` 없음 → 한국어 음성 · 검색 언어 신호가 틀린다 [추론]. 한글 서체 미지정 → OS 마다 다른 한글 [추론].
    손 개행 → 폭이 바뀌어도 같은 곳에서 끊긴다(모바일 16px 에서도). `user-select: none` 전역 → 복사 불가. 자동 영상 10개에 멈춤 없음
  - **반례로 세지 않는다**: 한국어가 대상 언어가 아닌 사이트다. 한국어 조판 신호(`hangul-typesetting`)의 지지·반례 어느 쪽 근거도 아니다 — 불변항 Ⅰ-2 관점의 관측이다

## L9 적용 가능 모드
- `tool` — **부분 적용**. 병기 한글의 크기·행간 보정만 간다. 전역 `user-select: none` 은 작업 도구에서 **금지급 제외**
- `consumer` — **부분 적용**. 같은 보정(다국어 앱의 병기 라벨)
- `marketing` — **적용**. 원 맥락 — 단 한국 시장용으로 쓰면 불변항 Ⅰ-2(한국어 우선)와 충돌하므로 정당화가 필요하다
- `graphic` — **부분 적용**. 영·한 병기 포스터의 크기 보정 비율
