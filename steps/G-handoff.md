<!-- /design-device:design 의 단계 파일. 커맨드 본문만 하네스가 펼친다 — 이 파일은 펼쳐지지 않는다.
     그래서 장치 경로는 `<장치>` 로 적는다. 커맨드 본문이 알려 준 절대 경로로 바꿔 쓴다. -->

# G. 빌드 하네스로 인계

디자인은 여기서 끝나고 빌드 하네스가 받는다.

1. **토큰을 스택 형식으로 내보낸다** (승인 `#42 B`) — A 단계가 적어 둔 `stack` 을 쓴다

   ```bash
   # 웹 계열 — 정본이 이미 그 형식이다. :root 블록을 통째로 교체한다
   node <장치>/scripts/emit-tokens.mjs prototypes/tokens.css --stack web

   # RN — theme.ts 를 생성한다
   node <장치>/scripts/emit-tokens.mjs prototypes/tokens.css \
     --stack rn --out src/shared/constants/theme.ts
   node <장치>/scripts/gate.mjs contrast-check src/shared/constants/theme.ts
   ```

   **정본은 `tokens.css` 의 `:root` 하나다.** `theme.ts` 는 생성물이고 머리말에 그렇게 적힌다 —
   거기서 고치면 다음 생성에서 지워지고, 그 사이에 정본과 갈린다(`D-1`).
   생성물도 **반드시 검사한다** — 변환이 대비를 바꾸지 않는다는 보장이 없다.

   그 밖의 스택(`flutter`·`swiftui` 등)은 생성기가 **거절한다.** 토큰을 손으로 옮기고
   그 사실을 `design.config.json` 과 화면 문서에 적는다 — 추측으로 형식을 만들지 않는다.
2. `UI_GUIDE.md` → 대상 레포 `docs/UI_GUIDE.md`
3. **화면 상세 문서 → 대상 레포 `docs/screens/S*.md`**
4. 각 step의 "읽어야 할 파일"에 위 셋의 경로를 넣는다. **그 step 이 건드리는 화면의
   문서를 넣는다** — 전체를 넣으면 읽히지 않는다
5. step의 Acceptance Criteria에 검출 커맨드를 추가한다:
   ```bash
   node <장치경로>/scripts/slop-scan.mjs src --mode <모드>
   node <장치경로>/scripts/contrast-check.mjs src/app/globals.css
   node <장치경로>/scripts/validate-screen.mjs docs/screens/
   node <장치경로>/scripts/measure-render.mjs <렌더 대상> --target .
   ```
   빌드 세션이 디자인 제약을 어기면 AC에서 걸린다

   > ⚠ **`<장치경로>` 는 펼쳐진 절대 경로를 적는다.** AC 는 **빌드 세션의 셸**이 돌리고
   > 그 셸에 `CLAUDE_PLUGIN_ROOT` 는 **없다**(실측 — `ARCHITECTURE.md` §2).
   > 마크다운 본문의 `${CLAUDE_PLUGIN_ROOT}` 는 하네스가 펼쳐 주지만,
   > **그 글자를 파일에 써 넣으면 펼쳐지지 않는다.**
   >
   > 대신 적히는 것은 **기계별 절대 경로**다. 커밋된 AC 는 다른 기계·CI 에서 깨진다.
   > 지금은 사용자 1인·기기 1대라 성립하고, 소비 레포가 늘면 해결이 필요하다
   > (`docs/DECISIONS.md` 미결 「AC 의 장치 경로」).

6. **인계가 끝나면 장치 레포의 사본을 지운다** (승인 `#35 C`) — 2·3번으로 옮긴 것과 토큰의 정본은
   이제 **대상 레포**다. 장치 레포가 쓰는 곳이 대상 레포가 아니라 `products/` 였다면 그 원본을 지우고,
   `products/<제품>/README.md` 에 「정본은 대상 레포 · 마지막 사본은 커밋 `<sha>`」 만 남긴다.
   **남겨 두면 갈라진다** — control_tower 에서 모션(「3밴드」 vs 「죽임」)·색(「무채색」 vs 「토스형」)이
   두 번 갈렸고, 낡은 쪽이 다음 조언의 근거가 될 뻔했다. `collect-feedback` 이 남은 사본을 보고한다

> **3번이 D-4 가 존재하는 이유다.** 아트보드(HTML)를 읽기 목록에 넣으면 모델이
> 마크업 노이즈를 읽고 *"이 화면의 오류 상태는 무엇인가"* 를 뽑아내기 어렵다.
> 마크다운 화면 문서가 그 자리에 간다. **구속력은 문서가 아니라 배선에서 나온다.**

---
