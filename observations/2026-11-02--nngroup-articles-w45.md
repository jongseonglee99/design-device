# NN/g 글(articles) — 2026-W45 검증 소스 수집 · 10-24 이후 새 글 2건

## L0 메타
- 출처: Nielsen Norman Group 글 — https://www.nngroup.com/articles/ (색인) · https://www.nngroup.com/feed/rss/ (게시 피드)
- **소스 차이 — 등록 소스와 같은 것이 아니다** (W44 와 같다). `sources/registry.yaml` 의 `nngroup` 은 **YouTube 채널**(@NNgroup, 구술 자막)이고,
  이번 표본은 **nngroup.com 의 글**이다. registry 에 글 소스 항목이 없다 — **고치지 않았다**(이 라운드의 범위 밖).
- 수집일 2026-11-02 (수집 시각 02:22 UTC, 월) · 라운드 2026-W45 · 로컬 자동 라운드(사람 없음)
- kind: **spoken** (글 전용 스키마가 없어 구술 스키마를 쓴다 — 이번 두 글은 측정이 아니라 판단·정의 진술이다)
- verified: **false**
- 표본: **2건** · 게시일 **2026-10-30** 두 건 다. 기준은 「게시일 2026-10-24 이후 글 전부」.
  RSS 피드(20항목)와 색인에서 10-24 이후 항목 **3건**을 확인했고, 그중 **영상 1건을 뺐다**(아래 §1). 용어집은 이번 기간에 없다. 남은 2건을 전부 채택했다.
  W44 가 *「10-30(금) 게시분은 다음 라운드가 확인한다」* 로 넘긴 것이 이 2건이다. 10-31 ~ 11-02 게시분은 없다 —
  **[측정]** 피드의 글 17항목이 **전부 금요일 17:00:00 UTC** 이고(나머지 3항목은 컨퍼런스 공지), 다음 게시는 11-06(금)으로 보인다 **[추론]**.
- 방법: ① RSS 피드와 `/articles/` 색인(1·2쪽)을 **curl 로 직접** 받아 날짜 붙은 항목을 기계로 뽑았다(W44 처럼 요약 모델을 거치지 않았다)
  ② 두 목록을 대조 — 글 2건은 양쪽에 다 있고, 영상 1건은 색인에만 있다. **빠진 글 없음**
  ③ 글 원문 HTML 을 curl 로 받아(전부 HTTP 200) 텍스트로 바꿔 **전문 통독** ④ **게시일은 각 페이지 JSON-LD `datePublished` 로 확인**
  ⑤ 아래 따옴표 인용 **전수를 원문 텍스트에 문자열 일치로 대조**(공백만 정규화) — 결과는 §6
- 표기: **[측정]** = 원문 또는 이 레포에서 직접 확인한 것(NN/g 의 주장을 우리가 재현했다는 뜻이 아니다) · **[추론]** = 우리 규칙과의 대응·적용 판단
- 직전 NN/g 접촉 두 건과의 겹침 — `2026-10-30--field-findings-cross-check.md` §3(*Menu-Design Checklist* · *Category Names Suck* · *Toggle-Switch Guidelines*): **겹치는 글 없음**, 주제는 간접으로 둘이 닿는다(§3-4).
  `2026-10-30--nngroup-articles-w44.md`: 글 겹침 없음. **저자가 겹친다** — 글 A 는 W44 D·E 의 저자(Tanner Kohler), 글 B 는 W44 용어집 *UX Disciplines: Glossary* 의 저자(Raluca Budiu)다.

---

## 1. [측정] 표본 — 글 목록

| # | 제목 | 게시일 (JSON-LD) | 저자 | 근거 종류 (글에 적힌 대로) | 공백 축 |
|---|---|---|---|---|---|
| A | *The Role of UX in Agentic Software Factories* — https://www.nngroup.com/articles/ux-agentic-software-factories/ | 2026-10-30 (`dateModified` 10-29 — 예약 게시로 보인다) | Tanner Kohler | **공개 문서 분석** — Anthropic(2026-08) · Google(2026-05) · OpenAI(2025-11)의 AI 네이티브 SDLC 문서, 그중 Anthropic 플레이북을 단계별로 해부 + 가상 시나리오 1개 + 처방 6개. **사용자 데이터·표본 없음** | G7 · AI(작업 공정) · 장치 자신 · 메뉴/IA(간접) |
| B | *Experience Design: Dropping the “User” from “User Experience”* — https://www.nngroup.com/articles/ux-vs-experience-design/ | 2026-10-30 (수정 10-30) | Raluca Budiu | **입장 글** — 분야 이름(경험 디자인)과 범위 제안 + 가상 사례 1개(에이전트 항공권 예약 → 사람 로그인 실패). **데이터 없음** | AI 인터페이스(사람↔에이전트 인계) · G7(방법) |

뺀 것 — *Tabs Used Right* (영상, 2026-10-26, Evan Sunwall, https://www.nngroup.com/videos/tabs-used-right/). 이유 둘:
① 글이 아니라 **YouTube 임베드**(`7ntSojFW5Jg`)이고 페이지에 자막·전문이 없다 — 통독과 인용 대조를 할 수 없다
② 영상은 registry 의 `nngroup` YouTube 채널(구술 트랙)이 받는 경로가 따로 있다. 이 영상이 붙은 관련 글 *Tabs, Used Right* 는 JSON-LD 게시 **2024-08-02** · 수정 **2026-09-02** 라 표본 기간 밖이다.
(메모: 탭 = 내비게이션 탭 vs 페이지 안 탭 — **메뉴/IA 축 재료**다. 구술 트랙 라운드의 후보로 남긴다.)

**[측정] 공백 축 결과** — G4 데이터시각화 0건 · G5 워크툴·대시보드 직접 0건(A 는 소프트웨어 생산 공정이지 워크툴 화면이 아니다) ·
메뉴/IA 간접 1건(A 의 「사람 검토로 올릴 조건」 과 가상 실패의 「라벨」) · AI 인터페이스 1건(B) · **G7 2건(A·B)**.
W44 에 이어 **이번 주도 AI 쪽으로 쏠려 있다** — 그리고 두 글 다 **데이터가 없다**(W44 글 A 는 설문 521명이었다). 근거 층이 W44 보다 얇다.

---

## 2. 분해 — 주장별

### W45-N1 · UX 맥락은 필요하지만 충분하지 않다 — UX 를 「맥락」 으로 줄인 생산 공정 — 글 A
- **[측정] 주장** — Anthropic 플레이북에서 UX 는 단계도 승인 관문도 갖지 않는다. UX 지식을 맥락·스킬로 성문화하면 AI 가 사용자 중심 제품을 만든다고 가정한다.
  글은 UX 의 역할을 셋(무엇을 지을지 정하고 팀의 판단을 키운다 · 지은 것을 평가한다 · 생성 과정에 맥락을 준다)으로 놓고, 플레이북은 셋째만 준다고 한다.
- 원문 — *"UX does not own a stage or approval gate in Anthropic’s playbook."* ·
  *"It assumes that UX knowledge, codified as context and skills, will help the AI create high-quality, user-centric products."* ·
  *"Anthropic’s Playbook provides a mechanism for the 3rd role only, but it does not adequately account for the first two."* ·
  *"Context can encode only what we already know."*
- 근거 종류: 공개 문서에 대한 저자 해석. **플레이북 원문은 우리가 읽지 않았다** — 플레이북 묘사는 NN/g 의 것이다.
- 모드: 전 모드 (작업 공정에 대한 주장)
- **관계 [추론] — ★ 충돌. 우리 장치가 정확히 이 모양이다.**
  - **[측정]** `CLAUDE.md` — 「생성된 `UI_GUIDE.md`·화면 상세 문서·토큰 정본 경로를 각 step의 "읽어야 할 파일"에 넣고, 검증 커맨드를 step의 Acceptance Criteria에 추가한다. … 이 배선이 장치의 구속력 전부다.」(강조 표시는 뺐다)
    `steps/G-handoff.md` 4·5번이 그 배선이다. 글이 해부한 플레이북(마크다운 산출물 사슬 + 관문)과 구조가 같다.
  - 장치가 맡은 것은 글의 **셋째 역할(맥락)** 과 **둘째 역할(평가)의 기계 부분**(대비·배치·상태 문서·렌더)이다.
    첫째 역할(무엇을 지을지 — PRD)은 **설계상 사용자 몫**이다(`CLAUDE.md` 머리말 「PRD·ARCHITECTURE·ADR은 사용자가 직접 설계」 · `docs/PRD.md` §7 「대상 레포의 PRD 를 고치지 않는다」). 그 부분은 경계 선언이라 충돌이 아니다.
  - **충돌하는 곳은 둘째 역할의 사람 부분이다.** **[측정]** `steps/` · `commands/` · `skills/` · `templates/` · `system/tone-card*.md` · `system/invariants.md` · `docs/PRD.md` 에서
    「사용성 · usability · 사용자 테스트 · 리서치 · 최종 사용자 · you are not the user」 를 찾으면 **0건**이다(Grep). 장치 안의 사람 평가는 전부 **판정자 1인**(사용자 본인)의 시안 판정(층 B)과 실사용 지적이다.
  - 덧붙임 — 글은 *"all the cards are in the product owner’s hands"* 를 우려한다(아래 원문). 이 레포의 파이프라인에서는 제품 소유자 · 디자인 판정자 · 승인자가 **한 사람**이다. 우려가 극단까지 간 형태다. 1인 작업이라 선택의 문제는 아니지만, 그만큼 N2 의 맹점이 걸러질 자리가 없다.
    원문 — *"But if AI-coding agents dissolve many technical constraints and UX is reduced to context in Markdown files, then all the cards are in the product owner’s hands, and the approval gate is guarded primarily by business needs."*

### W45-N2 · 테스트하지 않은 목업은 UI 작업이다 — 팀이 만든 산출물이 품질 기준이면 맹점이 그대로 통과한다 — 글 A
- **[측정] 주장** — 플레이북의 Test 단계는 AI 가 새 화면 스크린숏을 제품 소유자의 목업과 비교한다. 빌드가 목업과 같은지는 보장하지만 사용성·접근성은 보장하지 않는다.
  초기 사양·목업이 다음 단계의 정본이 되면, 검토해야 하는 줄 몰랐던 문제를 AI 가 통과시킨다.
- 원문 — *"AI-generated mockups that haven’t been tested are mainly UI work: honing the visuals, interface, and aesthetics."* ·
  *"This is not the same thing as UX: meeting the customer's exact needs in a simple and elegant way."* ·
  *"This comparison is important for ensuring the build matches the team’s vision of the interface, but it does not guarantee good usability or accessibility."* ·
  *"which is why we’ve long said: “you are not the user.”"* ·
  *"Yet in the playbook, the AI’s standard for quality is the artifacts that the team and AI created themselves without research, so any blind spot introduced early passes right through the Test stage, unchallenged."* ·
  *"If early specs and mockups become sources of truth in subsequent stages, then you risk the AI waving through unnoticed design problems it didn’t know you wanted to oversee."* ·
  *"It seems to rely on the AI to anticipate what real humans will struggle with. UX context might help with that, but this is a hypothesis yet to be tested."*
- 모드: 전 모드
- **관계 [추론] — ★ 충돌.**
  1. `CLAUDE.md` 1순위 「`UI_GUIDE.md`와 실제 와이어프레임을 빌드 시작 전에 전부 확정한다」 — 이 글의 구분으로는 **우리가 빌드 전에 확정하는 것은 UI 다.**
     확정의 근거는 기계 게이트(기본) + 판정자의 시안 선택이고, 화면을 쓸 사람에게 시험한 단계는 없다(N1 의 Grep 0건).
  2. `steps/G-handoff.md` 3·5번 — 화면 문서가 대상 레포의 정본이 되고, 빌드 AC 는 **그 정본과 기계 규칙에 대한 적합성**을 잰다. 글의 마지막에서 두 번째 원문이 말하는 그 구조다.
     우리 쪽 대응은 셋 있다 — PRD 목적 2(빌드 중 변형 측정) · E-2 전이 관찰(검출 사례 0건, `signals/local-vs-global-optimization.md` 머리말) · 실사용 지적 경로(`products/field-findings.md`).
     실사용 지적은 **사용자 본인이 구현된 화면을 쓰다가 한 말**이다(직전 대조 §1). 판정자가 곧 쓰는 사람인 제품(control_tower)에서만 사용자 근거가 된다.
  3. 같은 이유로 `evals/` 의 블라인드 3전 3승은 **판정자 선호의 측정**이지 사용성 측정이 아니다. D 단계 「기본 점검」(스크린숏을 찍어 직접 본다)도 목업 대 화면 비교에 가깝다 — 배치가 깨졌는지는 보지만 쓰는 사람이 막히는지는 보지 않는다.
  - **충돌을 약하게 하는 조건** — 판정자 = 최종 사용자인 도구에서는 *"you are not the user"* 가 덜 맞는다. Seemilar · dogu 의 최종 사용자가 판정자와 같은지는 **이 관측이 확인하지 않았다.**

### W45-N3 · 기술 지표는 사용성 지표가 아니다 — 사용자 신호를 감시 루프에 넣는다 — 글 A
- **[측정] 주장** — 가상 시나리오: 새 기능의 채택이 낮고 금방 버려지는데 자동 감시는 정상이다(코드가 잘 돈다). 원인은 라벨과 사용자 혼란이었다. 처방은 과업 포기 · 전환 하락 · 문의 급증 같은 사용자 신호를 서버 오류와 같은 급으로 감시하는 것이다.
- 원문 — *"But technical metrics, such as system crashes or security weaknesses, are not the same thing as usability metrics."* ·
  *"The true source of the problem turns out to be poor labeling and user confusion."* ·
  *"A drop in user success should get the same automated response as a spike in server errors."*
- 근거 종류: 가상 시나리오 — 사례가 아니다
- 모드: tool · consumer (출시 후 쓰이는 제품)
- **관계 [추론]**
  - **공백** — 역방향 경로(`collect-feedback.mjs`)가 모으는 것은 대상 레포의 결정 · 디자인 원장(판정자의 말) · PRD 버전 · 남은 사본 · 실사용 지적이다(`CLAUDE.md` 현재 상태 기록 기준). **최종 사용자의 행동 신호는 없다.** 장치 범위에 넣을지부터 미결이다 — 운영 지표는 대상 레포의 것이다.
  - **약한 지지** — 가상 실패가 **라벨**에 있다. `invariants.md` Ⅰ-2 「라벨은 정확해야 한다」 · 톤 카드 9 메뉴 줄 · `IA9` 와 같은 쪽이다. 라벨 실패는 기술 감시에 보이지 않는다는 점이 우리 쪽 근거에 없던 각도다.

### W45-N4 · 사람 검토로 올릴 조건을 맥락에 적는다 — 내비·정보 구조 변경, 관습에서 벗어난 흐름 — 글 A
- 원문 — *"Your UX context should specify when a human with UX design or research expertise must review the mockup or run a quick usability test with a few users."* ·
  *"For example, changes to navigation or information architecture, or flows that depart from established conventions."*
- 모드: tool · consumer
- **관계 [추론]**
  - **지지(부분)** — 톤 카드 9 메뉴 줄 *"메뉴명과 메뉴명에 대한 설명이 너무 AI티"* · 「흔한 앱의 이름으로 짓고」 와 직전 대조 주제 B(NN/g 메뉴 지침 7)가 **관습** 쪽이다.
    그리고 **[측정]** 우리 `docs/PRD.md` §1 의 실측 증거가 바로 이 종류다 — 「PRD 의 "탭 5개"가 실제로는 한 페이지 + 점프 내비 6절 — 합의가 빌드와 접촉해 바뀌었고 기록되지 않았다」. 글이 사람 검토로 올리라는 변경이 우리 파일럿에서 기록 없이 일어났다.
  - **공백** — 우리 구속력(Stop hook · 빌드 AC)은 **기계 영수증**만 요구한다. **[측정]** `steps/` · `commands/` 에서 「내비 · 탐색 구조 · 정보 구조」 를 찾으면 `steps/C-wireframe.md` 의 시안 단계 축(정보 구조 축)만 나온다. **빌드 중 내비·정보 구조가 바뀌면 사람에게 올리는 조건은 없다.**
    PRD 목적 2(빌드 중 변형을 측정·되먹임)와 원장 「변형」 이 가장 가까운 자리다 — 기록은 하지만 판정을 요구하지는 않는다.

### W45-N5 · 루프가 멈추지 않으면 선의의 증분 변경이 경험을 침식한다 — 글 A
- 원문 — *"If the loop never stops, it risks allowing agents to slowly erode the experience through many well-intentioned incremental changes."*
- 근거 종류: 결론부 저자 판단
- 모드: 전 모드
- **관계 [추론]**
  - **지지** — `signals/local-vs-global-optimization.md` 의 `#784`(*「단계적으로 최적화해서 시작보다 나쁘게 만들 수 있다」*)와 같은 명제다. 같은 NN/g 채널이라 **채널 수 불변(4)**.
  - **거울(장치 자신)** — **[측정]** `.claude-plugin/plugin.json` 을 건드린 커밋이 10-12 이후 **20회**, 현재 `0.4.8`(git log). W44-N16 이 「과잉 구축」 을 경고한 지 사흘 뒤
    W45 클라우드 라운드가 회귀를 실측했다 — 「0.4.8 이 면제 8건을 조용히 무효화했다」(`M4` 를 `M4`/`M4s` 로 쪼개며 이유 있는 면제가 고아가 됐다, `CLAUDE.md` 현재 상태 W45 항목).
    **선의의 증분 변경이 이미 맞던 것을 깬** 레포 안 사례다. 대상이 제품 경험이 아니라 장치 규칙이라는 점이 다르다.

### W45-N6 · UX 맥락의 주인이 되고, 연구 통찰과 디자인 시스템을 기계가 읽게 한다 — 글 A
- 원문 — *"Agents that can't easily find your research insights or design components will carve their own path instead."* ·
  *"The best way to claim this ownership is to take a first pass at drafting your organization’s UX skills and attaching your name to them, even if you know they’re not perfect."*
- 모드: 전 모드
- **관계 [추론]**
  - **지지** — 이 장치의 존재 이유와 같은 진술이다. `docs/PRD.md` §1 「각 build step 이 그 자리에서 화면을 발명하고, 옆 step 이 무엇을 발명했는지 모른다」 = *"carve their own path"*.
    플러그인 상주 · `skills/design-device/SKILL.md`(설명 없이도 뜬다) · `#41 A`(루트 `DESIGN.md` 머리말을 토큰 정본으로 읽는다) · 정본 하나에서 생성하는 토큰(`D-27`)이 「기계가 읽는 디자인 시스템」 쪽이다.
  - **빈자리** — 글은 **연구 통찰**도 기계가 읽게 하라고 한다. 우리가 기계 판독으로 만든 것은 디자인 시스템과 **판정자의 취향**(톤 카드 · 층 B)이고, 최종 사용자 연구는 없다. N1 과 같은 빈자리다.

### W45-N7 · 사용자가 사람만이 아니다 — 에이전트가 사람 대신 쓰는 시스템 (경험 디자인 · AX) — 글 B
- **[측정] 주장** — 분야의 대상이 사람이 직접 쓰는 제품에서, 사람을 대신해 행동하는 에이전트가 쓰는 시스템까지 넓어졌다. 사람에게 좋은 경험과 에이전트에게 좋은 것은 다르다. 그래도 성공 기준은 사람의 목표 달성이다.
- 원문 — *"Our field is no longer only about people directly using digital products. It also includes agents that act on their behalf."* ·
  *"AI agents may have access to representations that humans don’t (e.g., code, structured data, APIs), while humans may take advantage of visual hierarchy, spatial organization, and other perceptual cues."* ·
  *"Designing for agents is not the same as optimizing blindly for agent success; the goals, interests, and welfare of the humans behind them still hold priority."*
- 모드: 해당 없음 — 모드 체계 바깥
- **관계 [추론] — 공백.** 모드 4종(`invariants.md` Ⅱ)과 유형 5종(`system/kinds.md` — app-screen · dashboard · event · landing · diegetic)이 **전부 사람이 보는 화면**을 전제한다.
  `IA6`(시각적 무게로 만든 진입점) · `IA9`(메뉴 문구) · 대비는 원문 둘째 문장의 **사람의 지각 단서** 쪽 규칙이다. 에이전트가 읽는 표면(구조화 데이터 · API)에는 뜻이 없다.
  W44 용어집 메모(AX)와 **같은 저자**의 두 번째 글이라 독립 출처가 아니다. 대상 레포 셋에 에이전트가 쓰는 표면이 있는지는 이 관측이 확인하지 않았다.

### W45-N8 · 문제는 인계에 산다 — 사람과 에이전트를 따로 보면 안 보인다 — 글 B
- **[측정] 주장** — 가상 사례: 에이전트가 항공편을 추천하고 사용자가 받아들였는데, 에이전트용 인앱 브라우저에서 비밀번호 관리자가 없어 사람이 로그인하지 못했다. 에이전트도 정상, 로그인 요청도 정당 — 과업이 사람에게 넘어가는 순간 깨졌다.
- 원문 — *"A product can work well when humans or agents use it but can be flawed when both act on it."* ·
  *"The problem itself could never have been spotted by studying the agent or the human alone; it only becomes visible when we study the human-agent system as a whole."* ·
  *"Once tasks in a journey pass back and forth between humans and AI, some of the experience problems will live in the handoffs rather than in the interaction alone."*
- 근거 종류: 가상 사례 1개
- 모드: tool · consumer
- **관계 [추론]**
  - **지지** — `signals/local-vs-global-optimization.md` 명제(*「부분이 전부 잘 만들어졌는데 합치면 무너지는 종류의 실패」*) · W44-N10(Siri — 확인 대화 성공 · 앱 실행 성공 · 과업 실패). 같은 NN/g 채널 → **채널 수 불변**. 신호 머리말의 「검출 사례 0건」 도 그대로다.
  - **공백** — E-2 전이 관찰의 질문 1~4(신호 파일 §실행 · §적용 범위)는 **화면과 화면 사이**를 본다. **사람↔에이전트 인계**(권한 · 진행 연속성 · 복구)는 질문에 없다.

### W45-N9 · 에이전트는 언제 묻지 않고 행동하고, 언제 제어를 돌려주는가 — 열린 연구 질문 — 글 B
- 원문 — *"When should an agent act without asking the human? When should it ask the human for clarification?"* ·
  *"When should control return to the person? How should someone inspect or reverse an action taken by an agent?"* ·
  *"Because many of these questions depend heavily on people’s needs, goals, and contexts, qualitative research will remain as important as ever."*
- 모드: tool · consumer (AI 보조가 있는 화면)
- **관계 [추론]**
  - **지지(모양)** — 톤 카드 10 이 이 질문들에 대한 **이 사용자의 답**이다 — *"'자동'은 디폴트인거고 … 나중에 사람이 컨트롤하면 되는거잖아"* · 「직접 고치는 영역이 화면의 주인공」.
    글은 같은 질문을 **사람의 필요·맥락에 달린 연구 질문**으로 둔다. 톤 카드 머리말이 스스로를 「규칙이 아니라 방향」 으로 둔 것과 맞는다.
  - **단서** — W44-N13(톤 카드 항목에 모드·범위 표시가 없다)과 겹친다. 한 사람의 답이 모든 레포의 생성자에게 간다. W44-N9(비싼 오조작은 묻는다 vs 자동은 기본값)와 같은 축이다.
  - 직전 대조 주제 A(「손이 메인」 — CHI 2024 DirectGPT 수치)와 이어지지만, 이 글은 **답을 주지 않는다** — 근거를 더하지 않는다.

### W45-N10 · AI 기반 평가는 검증이 필요하고, 비결정적 시스템은 반복 실행으로 본다 — 글 B
- 원문 — *"Some of these methods augment traditional methods, but they all still require rigorous validation."* ·
  *"repeated runs for systems, analysis of digital system’s variability, inspection of log traces"*
- 모드: 전 모드 (평가 방법)
- **관계 [추론]**
  - **지지** — `tests/` 의 양성·음성 대조군(검출기를 검증한다) · W44-N1·N4(교차 채점 `design-review.mjs` 의 지위 — 검증 사례 1건, 사람 판정과 불일치).
  - **충돌 가능(약)** — **[측정]** `CLAUDE.md` 재대결 3 항목이 스스로 「한계: 레포당 1회」 라 적었다. 생성자가 비결정적이면 3전 3승은 레포마다 **한 번의 추첨**이다.
    글이 말하는 방법(반복 실행 · 변동 분석)을 우리 eval 은 아직 하지 않았다. 새 충돌이 아니라 **이미 적힌 한계의 외부 근거**다.

---

## 3. 관계 — 충돌 / 지지 / 공백

### 3-1. 충돌 — 우리가 틀렸을 수 있다 (먼저 적는다)

| 주장 | 우리 쪽 | 무엇이 부딪히나 |
|---|---|---|
| **N1** UX 를 맥락으로 줄인 공정은 셋째 역할만 한다 | `CLAUDE.md` 「이 배선이 장치의 구속력 전부다」 · `steps/G-handoff.md` 4·5 | 장치의 구속력 = 맥락 + 기계 AC. 사람 평가는 판정자 1인뿐 — 사용성·리서치 문자열 **0건** |
| **N2** 테스트하지 않은 목업은 UI 다 · 팀 산출물이 정본이면 맹점 통과 | 1순위 「빌드 전에 전부 확정」 · G-handoff 3 · `evals/` 3승 · D 「기본 점검」 | 우리가 확정하는 것은 UI 이고, 3승은 판정자 선호의 측정이다. 판정자 = 쓰는 사람인 제품에서만 약해진다 |
| **N10** 비결정적 시스템은 반복 실행으로 | 「한계: 레포당 1회」 | 이미 적힌 한계 — 외부 근거만 더해졌다 (약) |

### 3-2. 지지

| 주장 | 우리 규칙 |
|---|---|
| N4 내비·정보 구조 변경 · 관습 이탈은 사람 검토 | 톤 카드 9 메뉴 줄 · `IA9` · 직전 대조 주제 B · `docs/PRD.md` §1 실측(탭 5개 → 한 페이지 + 점프 내비, 기록 없음) — **부분** |
| N5 끝없는 루프의 증분 침식 | `signals/local-vs-global-optimization.md` `#784` (채널 수 불변) · 거울: 0.4.8 면제 8건 회귀 |
| N6 맥락의 주인 · 기계가 읽는 디자인 시스템 | `docs/PRD.md` §1 · 플러그인 상주 · SKILL · `#41 A` · `D-27` |
| N8 인계에서 깨진다 | 국소 ≠ 전역 신호 명제 · W44-N10 (채널 수 불변 · 검출 사례 0건 그대로) |
| N9 묻기·제어 반환은 맥락에 달린 질문 | 톤 카드 10 (이 사용자의 답) · 톤 카드 머리말 「방향」 |
| N10 AI 평가는 검증이 필요 | `tests/` 대조군 · W44-N1·N4 |
| N3 실패가 라벨에 있다 (약) | `invariants.md` Ⅰ-2 · 톤 카드 9 · `IA9` |

`#49`(생성은 자유롭게, 검증은 엄격하게) · `#50`(장치는 편집자)과의 관계 — 두 글 어디에도 **생성 단계에 규칙을 넣지 말라/넣으라**는 진술은 없다. 다만 글 A 의 세 역할 틀로 보면
`#50` 의 「장치는 편집자」 는 **셋째 역할(맥락)과 둘째 역할의 기계 부분**을 맡겠다는 선언이고, N1·N2 의 빈자리(사람이 하는 평가)는 `#50` 이 정한 범위 **밖**에 남는다 [추론].
(근거 확인: `#49`·`#50` 은 `docs/DECISIONS.md` 에 없다 — 승인 원장 `harness/approvals.json` 의 결정·근거 문단을 읽었다.)

톤 카드 9 의 **정보량**(「한 번에 다 주지 않는다」)과 `IA6`(읽기 진입점)에 직접 대응하는 진술은 두 글에 **없다**. `IA6` 는 N7 에서 「사람의 지각 단서」 쪽 규칙으로만 언급된다.

### 3-3. 공백 — 우리 규칙에 없다

| 주장 | 비어 있는 것 |
|---|---|
| N3 | 최종 사용자의 행동 신호(과업 포기 · 전환 · 문의) — 역방향 경로는 판정자의 말만 모은다 |
| N4 | 빌드 중 내비·정보 구조가 바뀌면 사람 판정으로 올리는 조건 |
| N6 | 기계가 읽는 **연구 통찰** (우리 것은 디자인 시스템 + 판정자 취향) |
| N7 | 에이전트가 쓰는 표면 — 모드 4종 · 유형 5종 밖 (W44 용어집 AX 에 이어 두 번째, 같은 저자) |
| N8 | 사람↔에이전트 인계 — E-2 전이 관찰은 화면↔화면만 본다 |

### 3-4. 직전 대조(`2026-10-30--field-findings-cross-check.md`)와의 겹침

- 글 겹침 **0건**.
- 주제 B(메뉴·문구의 AI 말투) ↔ N4 의 「관습에서 벗어난 흐름 · 내비 변경은 사람 검토」 — **간접**. 메뉴 문구 자체를 다루지는 않는다.
- 주제 A(AI 는 보조, 손이 메인) ↔ N9 의 「언제 제어가 사람에게 돌아오는가」 — **질문만 같다.** 근거를 더하지 않는다.

---

## 4. 기계로 환원 가능한 것 — 검출기 후보 (만들지 않았다)

1. **N2 → 화면 문서 「검증 근거」 칸** — 화면 틀에 「쓰는 사람에게 시험했는가 — 했음(언제·몇 명) / 해당 없음(이유)」 칸. `validate-screen` 의 「이유 없는 공란은 실패」 와 같은 모양이라 정적 환원 가능. 시험을 강제하지 않고 **안 했다는 사실을 보이게** 한다.
2. **N4 → 원장 「변형」 의 내비·IA 표지** — 빌드 중 변형 사유가 내비·탭·메뉴·정보 구조에 닿으면 ⚠️ 「사람 판정 필요」. 단 `#34` 의 교훈 — **어휘 필터는 놓친다**(제품 전환은 제품 어휘로 쓰였다). 어휘보다 화면 문서 §구조 표의 차이로 재는 쪽이 낫다.
3. **N10 → `evals/RESULTS.md` 의 반복 수 열** — 같은 브리프·같은 조건의 런 수 n. n=1 인 판정에 「1회 추첨」 표지.
4. 환원 불가로 표시 — N3(운영 지표는 대상 레포의 것 · 장치 밖) · N7(에이전트 표면이 아직 없다) · N8(인계는 흐름을 돌려야 보인다).

---

## 5. 승격 지위

- 이 관측의 주장은 **어느 것도 단독으로 승격되지 않는다.** 글 소스도 구술처럼 `verified: false` 이고, `promotion.spoken_track` 은 **서로 다른 채널 3출처 + 기계 환원 가능**을 요구한다. 이번 2건은 전부 **NN/g 한 채널**이다.
- **채널 판정 [추론, 사람 확인 대기]** — W44 와 같이 NN/g 글과 NN/g YouTube 는 같은 채널로 센다. 글 A 의 저자는 W44 D·E, 글 B 의 저자는 W44 용어집과 같다 — 저자 수준에서도 독립이 아니다.
- 기존 신호에 대한 영향 — `local-vs-global-optimization`: N5·N8 은 같은 NN/g 채널이라 **채널 수 불변(4)**. 「검출 사례 0건」 은 그대로다(N8 은 가상 사례, N5 의 면제 회귀는 장치 규칙의 사례라 그 신호의 E-2 검출이 아니다).
- 승격 재료로 가장 가까운 것: **N4(내비·IA 변경 → 사람 검토)** — 레포 안 실측 1건(PRD §1) + 기계 환원 가능(§4-2). 다른 채널 2곳이 더 필요하다.
- **N1·N2 는 승격 재료가 아니라 범위 질문이다** — 「장치가 최종 사용자 검증을 맡는가, 맡지 않는다고 적는가」. 어느 쪽이든 사람이 정한다 [추론].

---

## 6. 한계 · 실패

- **근거 층이 얇다** — 글 A 는 공개 문서 분석 + 가상 시나리오, 글 B 는 입장 글 + 가상 사례다. 둘 다 사용자 데이터가 없다. 처방은 NN/g 의 판단이고 우리가 재현할 종류가 아니다.
- **1차 출처를 읽지 않았다** — 글 A 가 해부한 Anthropic(2026-08) · Google(2026-05) · OpenAI(2025-11) 문서는 받지 않았다. 플레이북의 단계 표는 NN/g 의 요약이다.
- **이해 상충은 양쪽에 있다** — 글 A 는 AI 연구소의 이해 상충을 짚는다: *"It’s also important to recognize the conflict of interest: AI labs want companies to make this shift because it drives greater use of their products."*
  **[측정]** 같은 글 본문 중간에 자기 강좌 광고 1개(*Writing Specs for AI-Built Products*)와 끝에 강좌 목록 3개가 있다. 글 B 도 본문 광고 1개(*Designing AI Experiences*) + 목록 3개다.
  그리고 이 장치는 Claude 위에서 돈다. 이 관측을 쓴 것도 Claude 다 — 글 A 의 비판 대상과 같은 회사의 모델이 그 비판을 분해했다.
- **[측정] 인용 대조** — 위 `*"…"*` 인용 중 **NN/g 원문 35개 단위 전수를 원문 텍스트에 문자열 일치로 대조 — 35/35 일치**(공백만 정규화).
  35개 중 30개는 온전한 문장(그중 4개는 두 문장)이고 5개는 문장 조각이다 — 조각 3개(*all the cards…* · *you are not the user* · *carve their own path*)는 같은 글의 긴 인용을 관계 줄에서 다시 쓴 것이다.
  2개는 원문이 곧은 따옴표 `'` 다(*customer's* · *can't*). 나머지 아포스트로피는 원문대로 굽은 따옴표 `’`.
  레포 인용 — 톤 카드 9·10 의 `*"…"*` 2개와 「」 로 적은 신호 파일 · PRD · `CLAUDE.md` 문장은 해당 파일에서 문자열을 확인했다(PRD · `CLAUDE.md` 는 굵게 표시만 뺐다).
- 인용 확인은 원문 HTML → 텍스트 변환본에 대한 문자열 일치다. 그림 속 문구(글 A 의 SDLC 6단계 그림)는 읽지 않았다.
- 대상 레포 셋의 최종 사용자가 판정자와 같은지(N2 조건) · 에이전트 표면이 있는지(N7)는 **확인하지 않았다** — 다른 레포 접근은 이 라운드의 범위 밖이다.
- 실패한 요청 없음 — 피드 · 색인 2쪽 · 글 2 · 영상 1 · 관련 글 1, 7요청 전부 HTTP 200.
