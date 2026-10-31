# NN/g 글(articles) — 2026-W44 검증 소스 수집 · 10-01 이후 새 글 6건

## L0 메타
- 출처: Nielsen Norman Group 글 — https://www.nngroup.com/articles/ (색인) · https://www.nngroup.com/feed/rss/ (게시 피드)
- **소스 차이 — 등록 소스와 같은 것이 아니다.** `sources/registry.yaml` 의 `nngroup` 은 **YouTube 채널**(@NNgroup, 구술 자막)이다.
  이번 표본은 **nngroup.com 의 글**이다. 글에는 NN/g 자체 연구의 방법·표본·수치가 적혀 있어(예: 설문 521명) 구술 자막보다 근거 층이 두껍다.
  그래도 우리가 그 측정을 재현하지 않았으므로 verified 가 될 수 없다. registry 에는 글 소스 항목이 없다 — **고치지 않았다**(이 라운드의 범위 밖).
- 수집일 2026-10-30 · 라운드 2026-W44 · 자동 라운드(사람 없음)
- kind: **spoken** (글 전용 스키마가 없어 구술 스키마를 쓴다 — 판단 진술이 주이고 측정은 NN/g 의 것이다)
- verified: **false**
- 표본: **6건** · 게시일 **2026-10-02 ~ 2026-10-23**. RSS 피드와 색인에서 10-01 이후 게시 글 **8건**을 확인했고(영상 `/videos/` 3건은 글이 아니라 뺐다),
  그중 **용어집 2건을 뺐다**(정의 모음 — 판단·트레이드오프가 없다). 남은 6건은 공백 축 우선(AI 인터페이스 · G7 사용성 검증)으로 전부 채택했다.
  10-30(금) 게시분은 수집 시각(08:08 UTC) 기준 피드에 없다 — NN/g 글은 금 17:00 UTC 에 올라온다(피드의 `pubDate` 패턴, **[추론]**).
- 방법: ① WebFetch 로 `/articles/` 색인 열람 → ② 요약 결과가 **1건(`big-ball-of-mud-ai`)을 빠뜨린 것**을 RSS 피드(curl 직접 수집)로 발견·보완
  ③ 글 원문 HTML 을 curl 로 직접 받아(전부 HTTP 200) 텍스트로 바꿔 **전문 통독** ④ **게시일은 각 페이지 JSON-LD `datePublished` 로 확인**
  ⑤ 아래 따옴표 인용 **46문장 전수를 원문 텍스트에 문자열 일치로 대조 — 46/46 일치**(공백만 정규화. 2문장은 원문이 곧은 따옴표 `'`)
- 표기: **[측정]** = 원문에서 직접 확인한 진술·수치(NN/g 가 잰 것을 우리가 재현했다는 뜻이 아니다) · **[추론]** = 우리 규칙과의 대응·적용 판단
- 직전 NN/g 접촉(`2026-10-30--field-findings-cross-check.md` §3 — *Menu-Design Checklist* · *Category Names Suck* · *Toggle-Switch Guidelines*)과 **겹치는 글 없음**

---

## 1. [측정] 표본 — 글 목록

| # | 제목 | 게시일 (JSON-LD) | 저자 | 근거 종류 (글에 적힌 대로) | 공백 축 |
|---|---|---|---|---|---|
| A | *AI in UX: Work Is Faster, But Practitioners Have Mixed Feelings* — https://www.nngroup.com/articles/ai-in-ux-survey-26/ | 2026-10-23 | Maria Rosala · Rachel Banawa | 설문 2026-08-24~09-11 · 편의 표본 · 응답 2,814 → 정제 **521**(디자이너 246 · 연구자 145 · PM 21 · 기타 109) · Stata 기술·추론 통계 · 코멘트 226건 코딩 · 감정 분석은 두 모델(Claude Opus 5.5 · ChatGPT-6 Astra) + 연구자 무작위 50건 점검 + 불일치 전수 검토 | AI · G7 |
| B | *Synthetic Users vs. Human Respondents: Same Conclusion, Less Variation* — https://www.nngroup.com/articles/synthetic-users-vs-human-respondents/ | 2026-10-16 | Rachel Banawa | 비교 — 합성 응답자 **120**(Synthetic Users 플랫폼, 2026-02) vs 기존 인간 설문 **604** · 개방형 1문항 · 키워드 코딩 · 유의성 검정 | G7 · AI |
| C | *The New Siri's Biggest Strength Is Not Intelligence* — https://www.nngroup.com/articles/ai-assistant-context/ | 2026-10-09 | Caleb Sponheim | 저자 1인 실사용 탐색 — 구 Siri · Siri AI · ChatGPT Plus 에 같은 과업. *"Most requests ran once or twice."* · 글 스스로 *"a hands-on exploration, not a controlled comparison of their contributions"* | AI 인터페이스 |
| D | *Context Libraries: How AI Power Users Manage Context Engineering* — https://www.nngroup.com/articles/context-libraries/ | 2026-10-09 | Tanner Kohler | Claude 일상 사용 전문가 관찰 연구 — **표본 수가 글에 없다** | AI 도구 · 장치 자신 |
| E | *The New Big Ball of Mud: Why Agentic AI Systems Turn Fragile* — https://www.nngroup.com/articles/big-ball-of-mud-ai/ | 2026-10-02 (수정 10-12) | Tanner Kohler | 「a recent study of these users」 — 표본 수 없음. 저자·대상이 D 와 같아 **같은 연구로 보인다 [추론] → D·E 는 1건으로 센다** | 장치 자신 |
| F | *Empathy Mapping: The First Step in Design Thinking* — https://www.nngroup.com/articles/empathy-mapping/ | 2026-10-02 (수정 10-06) | Rachel Krause · Sarah Gibbons | 방법론 해설 — 연구 데이터 없음. **개정판**: 색인에 같은 URL 이 *Oct 2, 2026* 과 *Jan 14, 2018* 두 날짜로 나온다 | G7 |

뺀 것 — *UX Disciplines: Glossary* (10-23, Raluca Budiu) · *UX Maps: Glossary* (10-16, Hayat Sheikh · Huei-Hsin Wang). 정의 모음이라 분해할 주장이 없다.
(메모: 앞의 용어집이 **AX(agent experience)** 를 독립 분야로 정의했다 — 「AI 에이전트가 사람 대신 조작할 수 있게 설계하는 일」. 지금 우리 축에는 없다.)

**[측정] 공백 축 결과** — G5 워크툴 직접 0건 · G4 데이터시각화 0건 · 메뉴/IA 0건. G7 2건(A·B) · AI 인터페이스 3건(A·C·D). **이번 달 NN/g 글은 AI 쪽으로 쏠려 있다.**
워크툴 근거는 D·E 에서 간접으로만 나온다(AI 작업 도구를 쓰는 사람에 대한 연구).

---

## 2. 분해 — 주장별

### W44-N1 · 합성 응답은 결론은 맞히고 꼬리를 잃는다 (모드 붕괴) — 글 B
- **[측정] 주장** — 합성 120명과 인간 604명이 같은 결론(「UX」 가 지배적 명칭)에 닿았다. UX 용어 사용 합성 84% vs 인간 약 70%(유의). 인간은 50개 넘는 라벨, 합성은 12개 안팎.
  희귀·전문 용어는 합성 쪽에 **0건**. 하위 집단 안에서도 같다 — PM 의 UX 용어 사용 합성 93% vs 인간 44%.
- 원문 — *"Both datasets led to the same overall conclusion, but the synthetic responses varied much less than the human ones."* ·
  *"Our synthetic respondents collapsed onto a dozen labels; the humans spread across more than 50."* ·
  *"In synthetic-users research, mode collapse refers to synthetic data that reproduces the most common data point but drops the long tail of less-common responses in the target human population."* ·
  *"Mode collapse operated within each role as well as across the whole sample."*
- 글이 스스로 밝힌 한계 — 플랫폼이 질문을 바꿔 말했다: *"researchers have limited control over how questions are presented and the presentation may be a confounding variable in the study."*
- 모드: 전 모드 (평가 방법에 대한 주장)
- **관계 [추론]**
  - **지지** — `CLAUDE.md` 2순위의 균질화 명제(관측 `#853` · `#956` 「통계적으로 가장 그럴듯한 것」). 그동안 진술이었는데 같은 채널에서 처음으로 **수가 붙었다**(50+ → 12).
  - **★ 충돌 가능 — `design-review.mjs` 의 전제.** 그 스크립트는 *"플랫폼 귀속 편향은 같은 모델로 검출되지 않는다"* 며 **다른 모델**로 채점한다.
    그런데 모드 붕괴가 생성 모델 일반의 성질이라면 다른 모델도 같은 최빈값으로 모인다. 레포 안에 이미 그 모양의 사례가 하나 있다 —
    첫 섀도 런에서 codex 4축은 장치 쪽을 높게 매겼다(generic .74 · craft .72 · currency .61 · fit .82 vs .64 · .55 · .46 · .78, `evals/RESULTS.md`).
    사람은 블라인드로 대조를 골랐고, 장치 쪽을 *"일반적인 앱, 절대 실패는 안 하는 앱의 형태"* 로 읽었다(`system/tone-card.md` 3). **최빈값을 뽑은 쪽에 모델 채점자가 손을 들었다.**
    RESULTS 는 이미 「독립 판정이 아니다」(우리 측정을 입력에 붙인다)로 적었다 — 이 글은 **입력을 떼도 남을 수 있는 두 번째 기전**을 준다. 표본 1건이다.

### W44-N2 · 다양성을 시켜도 대표성은 생기지 않는다 — 글 B
- **[측정] 주장** — 모드 붕괴를 막으려 다양한 답을 요구해도, 그 다양성이 실제 사람 분포를 따른다는 보장이 없다. 인간 데이터 없이는 확인할 수 없다.
- 원문 — *"However, simply producing more variety does not mean that the variety is representative."*
- 모드: 전 모드
- **관계 [추론] — ★ 충돌 가능.** `#48 B` 개념 라운드(「제품 본질을 **서로 다르게** 읽는 셋」)와 `#49` 생성 라운드는 생성자에게 다양성을 시킨다.
  이 글대로면 그 셋은 **다양하지만 이 사용자의 취향 분포를 대표하지는 않을 수 있다.** 우리 쪽 보정 장치는 사람 판정(층 B)뿐이다.
  그래서 층 B 회수가 끊긴 기간(10-13 ~ 10-30 회수 0회, 직전 관측 §1)의 생성 다양성은 **검증되지 않은 다양성**이었다.
  반대 증거도 적는다 — 재대결 3(편집자 모델)은 블라인드 3전 3승이었다. 레포당 1회라 위 우려를 지우지는 못한다.

### W44-N3 · 합성은 출발점이고, 꼬리가 중요하면 사람이 필요하다 — 글 B
- 원문 — *"Treat synthetic findings as a starting point rather than as evidence of what users think, say, or do."* · *"when the tail of responses matters, you need human participants."*
- 모드: 전 모드
- **관계 [추론] — 지지.** 톤 카드 머리말(근거 = 블라인드 판정 + 실사용 판정) · 층 B 「「왜」가 빈 판정은 회수하지 않는다」 · 회수 ⑥ ⊘(위임·장치 판단 배제, 0.4.3).
  **한 사람의 취향은 정의상 분포의 꼬리다** — 이 레포가 사람 판정을 정본으로 두는 이유를 외부 측정이 받친다.

### W44-N4 · AI 는 사용자와 맞닿는 일과 디자인 검토에 가장 덜 쓰였다 — 글 A
- **[측정] 주장** — 사용 빈도가 중간값 아래인 과업은 셋뿐: 디자인 편집·검토 · 사용자 테스트 · 인터뷰. 인터뷰에 AI 를 쓴 적 없음 61%, 사용자 테스트 51%. 시간 절감도 이 과업들에서 가장 작았다.
- 원문 — *"The exceptions, where AI was rarely used, were editing or reviewing designs, testing with users, and interviewing users."* ·
  *"critique depends on a solid understanding of human goals and context, which is hard to convey to an AI system fully and reliably."*
- 근거 종류: 자기보고 설문(빈도·시간 절감 자기평가). **결과물 품질을 잰 것이 아니다.** 뒤 문장(크리틱 설명)은 저자 해석이다.
- 모드: 전 모드
- **관계 [추론] — 긴장.** `system/rubrics/critic-axes.md` 의 4축 크리틱은 모델이 돈다. 글은 크리틱이 사람의 목표·맥락 이해에 달려 있고 그것을 AI 에 온전히 전하기 어렵다고 한다.
  우리 구조(톤 카드로 맥락을 전하고 사람 블라인드 판정을 정본으로)는 이 진술과 맞는다. 다만 **「4축 통과」 를 품질의 증거로 쓰는 문장이 레포 어디에 있다면 그 문장이 틀릴 수 있다.**

### W44-N5 · 부정 응답의 1위 이유는 출력 불신과 검증 부담 — 글 A
- **[측정] 주장** — 도입 장벽 1·2위: 출력 품질 54% · 데이터 보안 50%. 장벽 없음 9%. 부정 코멘트 155건 중 149건을 이유 12종으로 코딩, 1위가 출력 불신과 그 검증 부담.
- 원문 — *"the most common reason was unreliable AI output and the resulting burden of checking and fixing it."*
- 응답자 인용(**각 1명 — 일화**) — *"AI feedback is long, takes time to read and no instructions, MD file, have ever completely stopped the agent from making wrong assumptions."* ·
  *"the quality of generating designs from AI is very poor / immature."*
- 모드: 전 모드
- **관계 [추론] — 지지.** `D-19`(구속력은 `Stop` hook 에 산다) · 10-11 생태계 대조 「별은 구속력을 세지 않는다 — 10만★ 셋은 전부 모델이 읽는 마크다운」.
  근거의 무게는 설문 수치(54%) 쪽이다. 「MD 파일로는 못 막는다」 는 한 응답자의 말이라 **같은 무게로 쓰지 않는다.**
- 덧붙임 [측정] — 글 A 의 감정 분석 방법(**두 모델에 같은 규칙 + 사람이 표본 50건과 불일치 전부를 본다**)은 `design-review.mjs` + 사람 판정과 같은 모양이다. 모델 판정을 사람이 점검하는 곳이 **불일치**라는 점이 다르다(N1 의 일치율 후보, §4).

### W44-N6 · 생산성의 단위는 과업이 아니라 시스템이다 — 글 A
- **주장** — 응답자들은 AI 가 모든 과업을 빠르게 했다고 답했지만, 아낀 시간은 더 많은 산출 요구나 남의 AI 산출 뒷정리로 흡수됐다. (**결론부 — 저자 해석**, 설문 수치 + 코멘트 코딩 위에 선다)
- 원문 — *"Our findings suggest the right unit of analysis should be the system — the total time and effort, across everyone involved, needed to ship work of acceptable quality."* ·
  *"A task made faster for one person can create work for another."* · *"a prototype generated in minutes that costs a designer days to make usable is a net loss"*
- 모드: 전 모드 (작업 방식)
- **관계 [추론] — 지지.** `signals/local-vs-global-optimization.md` 명제의 AI 작업 판본이다. 단 NN/g 는 그 신호에서 이미 1채널로 세어져 있다(`#745` · `#784`) → **채널 수 불변(4)**.
  톤 카드 7 「기본은 절대」 와도 맞는다 — 6전 6패 기간에 시안 6개가 전부 기본이 깨졌다(`evals/RESULTS.md`). 몇 분에 만든 시안이 사람의 판정 시간을 먹으면 순손실이다.

### W44-N7 · AI 출력은 초안이다 — 아낀 시간을 작업에 되돌린 사람만 나아졌다 — 글 A
- 원문 — *"And they can treat AI output as a draft rather than finished work: someone still has to check it, and time saved doesn’t have to become more output."* ·
  *"The respondents whose work got better, not just faster, were the ones who put that time back into the work"*
- 근거 종류: 코멘트 코딩(긍정 코멘트 중 속도 언급 61건, 그중 26건은 부정도 함께) 위의 저자 처방
- 모드: 전 모드
- **관계 [추론] — 지지.** `#50 A` 「장치는 편집자」(생성 = 초안, 장치 = 기본을 고치는 편집) · `#49` 「생성은 자유롭게, 검증은 엄격하게」. 이 글에 반대 방향 데이터는 없다.

### W44-N8 · 「못 찾았다」 는 「없다」 로 들린다 — 찾은 범위를 말한다 — 글 C
- **[측정] 주장** — Siri AI 가 Signal 메시지(기본 접근 불가)를 못 찾고 「찾을 수 없다」 고 답했다. 저자는 어느 출처를 뒤졌는지 밝히고 빈 곳을 설명하라고 처방한다.
- 원문 — *"Without that, “I couldn’t find it” sounds like “it doesn’t exist.”"* · *"An agentic experience must show the user which sources were searched and explain relevant gaps."*
- 근거 종류: 저자 1인 탐색, 요청 1~2회 — 사례 수준
- 모드: tool · consumer (검색·AI 보조가 있는 화면)
- **관계 [추론] — 공백. 우리 규칙에 없다.** 화면 틀의 상태 5종과 `IA4` 는 빈 상태를 **설계했는가**만 묻는다. **「없음」 과 「범위 밖이라 못 봄」 을 구분하라**는 요구가 없다.
  해당하는 화면 — Seemilar 의 AI 보조 기능 · control_tower S07 의 찾기 칸(층 B 합성 판정). 기계 환원 후보 → §4-1.

### W44-N9 · 비싼 오조작 앞에서는 확인하고, 갈래가 다른 모호함은 먼저 묻는다 — 글 C
- 원문 — *"A confirmation is valuable even when the assistant usually gets the request right, especially when the cost of performing the wrong action (i.e., sending a message to the wrong person) is high."* ·
  *"When alternatives lead to different actions, the agent should ask before acting"*
- 모드: tool · consumer
- **관계 [추론]**
  - **지지** — `validate-screen.mjs` 「되돌릴 수 없는 조작의 확인 요구」 · 실사용 지적 F-1 규칙 ③(어디로 갔는지 + 되돌리기를 같은 자리에서).
  - **약한 긴장** — 톤 카드 10 *"'자동'은 디폴트인거고 … 나중에 사람이 컨트롤하면 되는거잖아"* 는 묻지 말고 기본값으로 가라는 쪽이다.
    갈림은 글의 조건에 있다 — **결과를 되돌릴 수 있으면 기본값, 다른 행동으로 갈리고 비싸면 묻는다.** 조건이 달라서 충돌이 아닐 수 있다.

### W44-N10 · 한 단계에서 확인한 것이 최종 행동까지 살아남아야 한다 — 글 C
- **[측정] 주장** — 출발지를 확인 대화로 맞췄는데 지도 앱은 현재 위치에서 길을 열었다. 확인 대화도 성공, 앱 실행도 성공, **과업은 실패**.
- 원문 — *"A detail confirmed in one step of the interaction must survive into the resulting action."* · *"When designing multistep agent workflows, evaluate the whole task, including what appears in the destination app."*
- 모드: tool · consumer
- **관계 [추론] — 지지 + 외부 사례.** `signals/local-vs-global-optimization.md` 머리말: *"전이 관찰(`/design` E-2)이 실제로 이 종류의 실패를 잡는지. 지금은 처방만 있고 검출 사례가 0건이다."*
  이 글은 그 실패 종류(부분은 전부 성공, 합치면 실패)의 **외부 관찰 1건**이다. **우리 장치의 검출 사례는 여전히 0건이다.**

### W44-N11 · 절제된 표현이 기대를 맞춘다 — 단 그것도 시험할 가설이다 — 글 C
- **[측정] 주장** — Siri AI 의 화면은 성기고 답은 짧고 기능적이었다. 저자는 이것을 강점으로 읽는다 — 풍부한 성격은 실제보다 많은 이해를 암시한다.
  진행 라벨(「웹 검색 중」)이 요청과 왜 관련되는지 설명이 없으면 신뢰 대신 의심을 낳는다.
- 원문 — *"A richer personality could suggest more understanding than the assistant can reliably deliver."* ·
  *"designers should test what users infer from its presentation, rather than assume that a quieter identity alone will keep expectations realistic."* ·
  *"A progress label shows activity, but transparency is not explainability."*
- 모드: tool · consumer
- **관계 [추론]** — **지지**: 톤 카드 9(AI티 나는 줄글 · 메뉴 부제) · 10 · `IA9`(메뉴 항목마다 설명문). **단서**: 글 스스로 절제를 처방이 아니라 **시험할 가설**로 둔다.
  진행 라벨 문구에 대한 기준은 우리 규칙에 **없다** — 새 항목 후보(Seemilar AI 보조의 진행 표시).

### W44-N12 · 한 번 쓴 컨텍스트가 몇 달 쓰이며 낡고, 정기 루틴은 신뢰를 잃는다 — 글 D
- 원문 — *"A context file was often written once but used for months, and much of what participants had written no longer matched how they worked."* ·
  *"others kept running scheduled routines they had gradually stopped trusting, or that depended on brittle connections to external sources that kept failing."*
- 근거 종류: 관찰 연구, 표본 수 미기재
- 모드: 해당 없음 — **장치 자신**(메타)
- **관계 [추론] — 거울.** 우리 주간 라운드: W41 HTTP 403 · W42·W43 `fetch failed` · W44 사용량 한도로 실행 실패, 로컬 라운드 0회(직전 관측 §4).
  글의 실패 모양(외부 연결이 계속 끊기는 정기 루틴)과 같다. 반감기·자동 강등(`CLAUDE.md` 「주간 스캔은 diff」)은 같은 처방이다.

### W44-N13 · 다른 프로젝트용 시각 지침이 엉뚱한 앱에 번졌다 — 범위는 지역으로 — 글 D
- 원문 — *"Another was surprised that the visual-design guidelines he’d provided for his podcast work somehow got applied to a book-tracking app he was building."* · *"rather than making everything global."*
- 모드: 해당 없음 — 장치 자신
- **관계 [추론]**
  - **지지** — `D-18`(설정 없는 레포에서 hook 침묵) · SKILL §0 「기존 체계가 이긴다」 · 「모드는 산출물 단위」.
  - **★ 충돌 가능 — 톤 카드의 범위.** 플러그인은 `scope: user` 로 모든 레포에 상주하고, 톤 카드는 레포·모드 구분 없이 생성자에게 간다.
    그런데 카드 6 「작업 도구는 가볍게」 는 tool 문장이다. 카드에는 모드 표시가 없다(`system/tone-card.md` 1~10 실측).
    → consumer·marketing·graphic 생성에 tool 문장이 섞일 수 있다. 글이 보고한 실패(팟캐스트 지침 → 독서 앱)와 같은 모양이다.

### W44-N14 · 상주 맥락은 짧게, 전역과 지역을 한 파일에 섞지 않는다 — 글 D · E
- 원문 — (D) *"most participants kept files under a few hundred lines. Anything much longer probably contains material that doesn’t need to load every time Claude references the file."* ·
  *"Giving the AI access to tangential context does not necessarily improve its performance"* ·
  (E) *"When one markdown file contains both global and local context, the lines have blurred, making it difficult to parse which parts of the system play which roles."* ·
  *"This context type affects everything the system does, so it should be short enough to review in one sitting."*
- 모드: 해당 없음 — 장치 자신
- **관계**
  - **지지 [추론]** — 0.2.4 지도 분리(36KB → 7.7KB) · `tests/` §14 「지도가 12KB 를 넘으면 실패」 · `#32 A` 상주 토큰 상한 500 · `D-16`.
  - **★ 충돌 — 우리가 틀렸을 수 있는 지점.** **[측정]** 이 레포 `CLAUDE.md` 는 **500줄 · 52,438바이트**이고, 그중 「현재 상태」 절이 **331줄 · 40,987바이트(78%)** 다.
    **[추론]** 그 절은 날짜 붙은 진행 기록(지역·이력 맥락)이고, 같은 파일에 규약(전역 맥락)이 있다 — 글 E 가 말하는 「경계가 흐려진 파일」 이다.
    상주 상한(`#32` · `D-16`)은 **플러그인의 상주 비용**만 잰다. 이 레포에서 매 세션 실리는 `CLAUDE.md` 는 그 측정 밖에 있다.

### W44-N15 · 사람은 에이전트가 고친 맥락을 거의 검토하지 않는다 · AI 에게 근거 정리는 맡겨도 근거 생성은 맡기지 않는다 — 글 D · F
- 원문 — (D) *"they rarely checked what Claude had changed."* ·
  (F) *"asking AI to organize evidence you already have is very different from asking it to generate evidence you don’t have."* ·
  *"If you are mapping before research, label the map as a set of hypotheses and plan the study that will test them."*
- 근거 종류: D 관찰 연구 / F 방법론 해설(데이터 없음)
- 모드: 전 모드 (근거 관리)
- **관계 [추론] — 지지.** 0.4.3 회수 ⑥ ⊘ — 장치 자신의 판단이 「왜」 로 취향 원장에 들어갈 뻔했다(dogu 3건 · 토큰 2건 · control_tower S07-3). 글 F 의 구분(정리 vs 생성)이 그 규칙의 이유다.
  관측 파일의 [측정]/[추론] 분리와 「가설로 표시하라」 도 같은 처방이다.

### W44-N16 · 짓기가 공짜가 되자 과잉 구축 — 「끝난 상태」 가 없을 때 진흙공이 된다 — 글 E
- **주장** — 시간·돈·전문성의 부족이 사라지자 우선순위를 강제하는 것이 없어졌고, 참여자들은 시스템을 조금씩 덧붙여 키웠다.
  덧붙임 자체가 문제가 아니라 **잠깐이라도 끝난 상태가 없다**는 것이 문제다.
- 원문 — *"Because AI makes it so easy for you to build something, people actually start overbuilding because it feels productive."* (참여자 인용) ·
  *"Their creations had no “finished” state, even temporarily — and that is when their systems started turning into a big ball of mud."* ·
  *"you're constantly trying to refine the system, and you're not actually going out and using the system."* (참여자가 전한 Claude 의 말) ·
  *"The goal was never to avoid reconstruction — it's to stay in a position to direct it."*
- 근거 종류: 관찰 연구 + 참여자 인용(일화). 표본 수 미기재
- 모드: 해당 없음 — 장치 자신
- **관계 [추론] — ★ 경고. 우리가 틀렸을 수 있는 지점.** **[측정]** 장치 버전 0.2.0(10-12) → 0.4.6(10-30) — 19일에 **릴리스 18회**(`.claude-plugin/plugin.json` git 기록) · 검출기 13 → 29종(`CLAUDE.md` 현재 상태).
  글의 진단 기준(「잠깐이라도 끝난 상태가 있는가」)에 대응하는 것은 우리 쪽에서 `evals/RESULTS.md` 다.
  반대 증거도 있다 — 6전 6패 → 3승은 **쓰고 나서 고친** 결과다(사용 → 수정 순서). 어느 쪽인지는 사람이 판정한다.

### W44-N17 · 구체적인 인용이 일반적인 인용보다 쓸모 있다 · 날짜와 버전을 단다 — 글 F
- 원문 — *"Specific quotes are more useful than generic ones."* · *"Date the map, version it, and put a review on the calendar for the next time the team plans research."*
- 모드: 전 모드 (근거 기록)
- **관계 [추론] — 지지.** 톤 카드 「문장은 가능한 한 사용자의 말 그대로」 · 관측 파일 날짜·출처 필수(`taxonomy.md` 절대 규칙 2) · 신호의 「다음 재확인」 칸.

---

## 3. 관계 요약

| 관계 | 주장 |
|---|---|
| **지지** | N1(2순위 균질화 — 첫 측정) · N3 · N5(`D-19`) · N6(국소≠전역) · N7(`#50` 편집자) · N9(확인 요구 · F-1) · N10(신호 사례) · N11(톤 카드 9·10 · `IA9`) · N13(`D-18`) · N14(지도 분리) · N15(회수 ⊘) · N17 |
| **충돌 가능 — 우리가 틀렸을 수 있다** | N1 `design-review.mjs` 「다른 모델이면 균질성을 잡는다」 · N2 「서로 다르게」 시킨 다양성 ≠ 취향 대표성 · N4 모델 4축 크리틱의 지위 · N13 톤 카드에 모드가 없다 · **N14 이 레포 `CLAUDE.md` 78% 가 진행 기록** · N16 과잉 구축 |
| **공백 — 우리 규칙에 없다** | N8 빈 상태의 「없음 vs 범위 밖」 · N11 진행 라벨 문구 · (용어집) AX |
| 약한 긴장 | N9 묻기 vs 톤 카드 10 「자동은 기본값」 — 조건이 달라 충돌이 아닐 수 있다 |

---

## 4. 기계로 환원 가능한 것 — 검출기 후보 (만들지 않았다)

1. **N8 → `validate-screen` 빈 상태 칸** — 화면 문서에 검색·AI 조회 조작이 있으면 「빈 상태」 칸이 **찾은 범위**(어디를 뒤졌는지)를 적었는가. 문서 수준 문자열 검사라 정적 환원 가능.
2. **N1·N5 → 교차 채점과 사람 판정의 일치율** — `evals/RESULTS.md` 에 `design-review` 판정과 블라인드 사람 판정의 일치·불일치를 열로 센다. 지금 1건, 불일치.
   글 A 처럼 **불일치를 사람이 본다**는 규칙의 측정기가 된다.
3. **N14 → 상주 맥락 크기** — 이 레포 `CLAUDE.md` 의 바이트·줄 상한과 날짜 붙은 줄의 비율. `tests/` §14 가 지도에 하는 것과 같은 모양.
4. **N13 → 톤 카드 항목의 모드 표시** — 카드 항목마다 적용 모드가 있는가(없으면 ⚠️). 생성자에게 넘길 때 모드로 거른다.
5. **N2 — 반(反)검출기 주의** — 시안 셋의 구조 지문 거리(`#40 C`)로 다양성은 셀 수 있다. 하지만 글의 요점이 「다양성 ≠ 대표성」 이므로 **다양성 수치를 품질 근거로 쓰지 않는다.**
6. 환원 불가로 표시 — N10(다단계 흐름의 확인값 보존 — 정적으로는 안 보이고 흐름을 돌려야 한다) · N16(과잉 구축 — 수는 셀 수 있어도 판정은 사람).

---

## 5. 승격 지위

- 이 관측의 주장은 **어느 것도 단독으로 승격되지 않는다.** 글 소스도 구술처럼 `verified: false` 이고, `promotion.spoken_track` 은
  **서로 다른 채널 3출처 + 기계 환원 가능**을 요구한다. 이번 6건은 전부 **NN/g 한 채널**이다.
- **채널 판정 [추론, 사람 확인 대기]** — NN/g 글과 NN/g YouTube 는 같은 기관이므로 `require_different_channel` 에서 **같은 채널로 센다.**
  글 D·E 는 같은 저자·같은 연구로 보여 **1건**으로 센다.
- 기존 신호에 대한 영향 — `local-vs-global-optimization`: NN/g 가 이미 1채널로 들어가 있어 **채널 수 불변(4)**. N10 은 「검출 사례 0건」 옆에 외부 사례를 하나 놓을 뿐이고, 장치의 검출 사례가 아니다.
- 2순위 균질화 명제(`#853`): 같은 채널 안에서 진술 → 측정으로 근거가 두꺼워졌다. 채널 수는 늘지 않았다.
- 승격 재료로 가장 가까운 것: **N8(빈 상태의 범위 표시)** — 기계 환원 가능(§4-1). 다른 채널 2곳이 더 필요하다.

---

## 6. 한계 · 실패

- **[측정] 목록 요약이 글을 빠뜨렸다** — WebFetch 의 `/articles/` 요약은 10-02 글 `big-ball-of-mud-ai` 를 목록에 넣지 않았다(요약 모델을 거친다). RSS 피드를 직접 받아 찾았다.
  목록 열람을 요약 모델에만 맡기면 누락이 생긴다.
- 10-30(금) 게시분은 수집 시각 기준 아직 없다 — 다음 라운드가 확인한다.
- 공백 축 G4·G5·메뉴/IA 를 직접 다룬 글은 0건이다. 이번 표본은 AI 쪽으로 쏠려 있다.
- 글 D·E 는 표본 수가 없고, 글 C 는 저자 1인·요청 1~2회다. 글 A 는 편의 표본 자기보고다. **수치는 NN/g 의 것이고 우리가 재현하지 않았다.**
- 인용 확인은 원문 HTML → 텍스트 변환본에 대한 문자열 일치다(공백만 정규화). 그림 속 문구와 대화형 대시보드는 읽지 않았다.
- 실패한 요청 없음 — 색인 · 피드 · 원문 8쪽(채택 6 + 용어집 2) 전부 HTTP 200.
