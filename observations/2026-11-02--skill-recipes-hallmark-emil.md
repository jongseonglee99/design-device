# hallmark v2 · emilkowalski/skills — 생성·검증 **구조**가 우리와 독립 수렴했다

## L0 메타
- 출처: `skill-recipes` / **Nutlope/hallmark** (`README.md` 8,742 B · Together AI) · **emilkowalski/skills** (`README.md` 4,846 B · Vercel·Linear 출신)
- 캡처일: 2026-11-02 (라운드 2026-W45 · 클라우드)
- 플랫폼: 웹 (문서). hallmark 는 Claude Code · Codex · Cursor · OpenCode 용 스킬, emil 은 `skills.sh` 배포
- 시장: 서구권. 둘 다 영어권 개발자 대상
- kind: **system** · verified: **false**
- 수집 방법: `raw.githubusercontent.com` 직접 fetch. `hallmark/main/SKILL.md` 는 **404**(경로가 `skills/hallmark/` 아래로 옮겼다 — README 링크로 확인).
  GitHub API 403(레포 범위 밖)이라 커밋 날짜 대조 불가 → **버전 델타를 날짜로 말할 수 없다.** 말할 수 있는 것은
  2026-10-31 우리 조사 당시 기록("주제 → 매크로 구조 표 · scroll-choreography")과 **현재 README 가 다르다**는 것뿐이다(v2)
- 레지스트리 정책: `takes: [L5, L7, L8]` · `drops: [L3]`
- **제작사 독립**: Leonxlnx · Nutlope(Together AI) · emilkowalski — 셋이 서로 다르다 (`single_source_exception` 계수용)

---

## L1 여백·리듬
미측정 — 이 두 레포에서 가져온 것은 **층위가 다르다**(아래 L6·L8). 값이 아니라 **절차**다.

## L2 타이포
**미측정.** hallmark 의 50 테마가 각각 서체를 들고 있지만 테마는 **재료**로 배포되고(L6 참조)
우리가 받는 것은 테마 안의 값이 아니라 「재료로만 배포한다」는 구조다.
emil 쪽에는 타이포 측정이 없다 — 모션·인터랙션 전문 소스다.

## L4 깊이
`drops` 대상은 아니지만 **측정값이 없다.** 단 emil 의 한 줄만 관계로 적는다 —
*"solid border 대신 semi-transparent shadow"*(agent 가 흔히 틀리는 것으로 꼽는다).
값이 아니라 **선택의 방향**이고, taste-skill 앱 화면 23장은 **반대 방향**이다 → 그쪽 관측 §충돌 ②

## L5 모션
값은 미측정. 구조만 — 하한(`find-animation-opportunities`)과 상한(`remove-animations`)이 **별개 도구**다(L6 참조).

## L3 색
**미측정.** `drops: [L3]`. hallmark 가 50 테마(재료)를 배포하고 emil 이 라이브러리를 고르지만, 둘 다 색 값은 그들의 취향이다.

## L6 구조 — **절차의 구조** [측정: 문서 본문 인용]

### hallmark v2 — 게이트가 **3단**이다
> *"The gates come in tiers. The **Floor** never ships (contrast, focus, reduced motion, invented facts, a broken phone layout).
> **Reflex** gates are the defaults a model falls into; a build with a reason **may overrule one on the record**.
> **Finish** checks are craft detail that never blocks a ship."*

### hallmark v2 — 생성과 크리틱이 분리되고 **크리틱이 마지막 말을 한다**
> *"Hallmark holds a hard floor and then gets out of the way."*
> *"The hero is built alone, rendered and reviewed cold before the rest of the page exists."*
> *"`sloplint.mjs --render` checks the page at eight widths, then a subagent reviews it with fresh eyes."*
> *"A fresh-context reviewer gets the last word."*

테마는 **재료이고 계획이 아니다**: *"A theme is a material, not a plan: it never says what a page contains or in what order,
so two prompts in one theme make two different pages."* 50개 각각 **8KB 이하 한 파일**이고 빌드는 **정확히 하나만 읽는다**.
「custom」 이라고 말하면 테마를 전부 버리고 **바닥과 게이트만** 남긴다.

### emilkowalski — 하한과 상한이 **별개 도구**다
- `find-animation-opportunities` — *"Search your UI for places that would genuinely benefit from motion, **while also telling you what not to animate**"*
- `remove-animations` — *"remove the animations your app doesn't need: motion on keyboard shortcuts, fade-ins on every section, delay on every tooltip in a group"*
- `break-ui` — *"Try to break the UI you built with **worst-case data**: long names, unusual emails, one-letter names, huge counts, empty lists, long labels"*
- `prototype` — *"Build **multiple different versions** of a UI piece you describe and go through them using a switcher"*
- `mobile-native` — 끈적이는 hover · tap highlight · **100vh 버그** · 페이지를 확대하는 입력칸 · 느린 탭 · 세이프에어리어

## L7 톤
hallmark 가 이름으로 거는 tell: 모든 제목 위의 eyebrow · 자간 넓은 대문자 라벨 · **헤드라인 안의 색칠된 한 단어** ·
빈 프레임만 있는 페이지 또는 **사진밖에 없는 페이지** · 화면을 놓치는 히어로 · **모든 페이지 끝의 이메일 구독** ·
아무것도 보내지 않으면서 고맙다고 말하는 폼. 사진은 **공개 라이선스 755장**을 주제별로 골라 페이지에 **출처를 적는다**.

## L8 판단
- **신선함**: 낮다 — 그래서 값지다. 이 관측의 값은 새로움이 아니라 **수렴**이다. 아래 트레이드오프 참조
- **포화**: eyebrow · 대문자 트래킹 라벨 · 헤드라인 한 단어 색칠 · 페이지 끝 이메일 구독 — 전부 우리 `I4`(카피 템플릿)·`T2` 와 겹치는 영역인데
  **헤드라인 안의 한 단어만 색칠**은 우리 코드에 없다(정적으로 셀 수 있다 — 제목 안의 자손 span 에만 색). 포화 후보
- **이식 최소단위**: 없다 — 이식할 값이 없다. 이식 대상이 **절차**이고 우리는 이미 갖고 있다
- **트레이드오프 쌍**
  1. **바닥 + 비켜서기 (hallmark)** — 얻은 것: 생성이 규칙에 눌리지 않는다. 포기한 것: 바닥 위의 모든 것에 **기계적 보장이 없다**(그래서 fresh-context 리뷰어가 마지막 말을 한다).
     ← **우리 `#49 A`(생성은 자유롭게, 검증은 엄격하게) + `#50 A`(장치는 편집자)와 같은 거래다.** 우리는 블라인드 **6전 6패 뒤에** 이 구조에 왔다
  2. **테마 50개를 재료로만 배포 (hallmark)** — 얻은 것: 한 테마에서 두 프롬프트가 두 페이지를 만든다. 포기한 것: 결과의 예측 가능성.
     ← 우리 `templates/GENERATE.prompt.md` + 톤 카드와 같은 거래다(장치 규칙을 생성자 지시문에 넣지 않는 것을 `npm test` 가 고정한다)
  3. **하한과 상한을 별개 도구로 (emil)** — 얻은 것: 「움직임이 없어서 목업으로 읽히는 것」과 「움직임 과잉」을 각각 다룰 수 있다.
     포기한 것: 단일 판정. ← 우리 `#50` 이 거절한 것은 **개수 검출기**였고, emil 은 하한을 **검출기가 아니라 탐색 도구**로 둔다. 우리 빈자리가 어디인지 가리킨다
  4. **최악 데이터로 깨뜨려 보기 (emil `break-ui`)** — 얻은 것: 긴 이름·한 글자·거대한 수·빈 목록에서의 붕괴를 출하 전에 본다.
     포기한 것: 추가 공정. ← **우리에게 이 축이 없다**. 화면 상태 5종은 *상태*이고 이것은 *내용 스트레스*다

## L9 적용 모드
절차는 **전 모드**(tool · consumer · marketing · graphic)에 걸린다 — 생성·검증 분리와 3단 게이트는 장르 함수가 아니다.
hallmark 의 포화 목록(eyebrow · 끝의 이메일 구독)은 **marketing**·**landing** 유형에 한정된다.

---

## 우리 규칙과 충돌하는 지점 (라운드 보고 1순위)

### ① 충돌이 아니라 **독립 확인** — 그래서 먼저 적는다
우리 3단 판정(**❌ 차단** / **⚠️ 정당화 요구** / **`·` 참고**)과 **이유 있는 면제만 듣는다**(`D-21`,
`/* slop-scan: ignore M4 — <이유> */` · 매 실행 목록 출력)는 hallmark 의 **Floor / Reflex(*"may overrule one on the record"*) / Finish** 와
구조가 같다. 우리 Floor(불변항 Ⅰ-1 대비 · `M3` 움직임 줄이기 · `IA7` 상호작용 상태 · ㉤ 배치 무결성)와
hallmark Floor(contrast · focus · reduced motion · invented facts · broken phone layout)도 거의 같은 집합이다.
**다른 생산자가 다른 경로로 같은 구조에 왔다** = `#49`·`#50`·`D-21` 이 우연이 아니라는 증거다.

### ② `break-ui` — 우리에게 **없는 축**이고 기계 환원이 쉽다
`validate-screen` 은 상태 5종을 요구하고 ㉤ 는 겹침·잘림을 재지만, **재는 대상은 시안이 마침 담고 있는 내용**이다.
최악 내용(긴 한글 이름 · 한 글자 · 1,234,567 · 빈 목록 · 긴 라벨)을 **만들어 넣는 것**이 없다.
우리 실측이 이미 이 구멍을 보여 줬다 — 2026-10-31 dogu 헤드라인이 **단어 중간에서 끊겼다**(390·1280 둘 다).
한글은 여기서 라틴보다 취약하다(`keep-all` · 긴 복합명사). → 상신

### ③ 「헤드라인 안의 한 단어만 색칠」 포화 후보
우리 `C4`(색이 정보를 안 나름) ⚠️ 의 특수형인데 검출 코드가 없다. hallmark 가 이름으로 거는 tell 이다. → 상신 후보로만 적는다

## 승격 지위
hallmark · emil · taste-skill 은 **제작사가 서로 다른 3항목**이므로 `single_source_exception`
(`min_entries_within_source: 3` · `require_different_producer: true`)의 **개수 요건은 충족**한다.
막히는 것은 `require_verified_source` 다 — `skill-recipes` 에 `verified` 선언이 없다. → 상신(규칙 질문)
