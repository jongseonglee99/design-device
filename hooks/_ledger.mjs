// 원장과 영수증이 어디 사는가 — hook 둘과 scripts/gate.mjs 가 같은 답을 써야 한다.
//
// 세 번째 파일인 이유: `design-check.mjs` 는 최상위에서 바로 일을 하므로
// Stop hook 이 그것을 import 하면 "경로가 어디냐"를 묻는 것만으로
// PostToolUse 한 바퀴가 부수효과로 돈다.
//
// ★ 위치 규칙 — **대상 레포 안에 쓰지 않는다** (`D-18`).
// 초판 `.design-device/skipped.jsonl` 은 남의 레포에 디렉터리를 만들어
// `git status` 를 더럽혔다. 영수증은 그보다 훨씬 자주 쓰이므로 같은 실수를
// 반복하면 더 빠르게 끈다. 그래서 기본은 **레포 밖**이다.
//
// ★ 키 규칙 — **레포별 + 세션별**. 둘 중 하나라도 빠지면 다른 레포·다른 세션의
// 편집으로 차단된다. `ux-ui-agent-skills` 가 2026-10-08 에 실측한 고장이고
// (`/tmp/mcptest` 세션이 `/tmp/blind-plugin` 의 파일 10개로 차단됐다),
// 자기가 하지 않은 일로 차단당하는 것이 hook 을 끄는 가장 빠른 길이다.

import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, appendFileSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, dirname } from 'node:path';
import { homedir } from 'node:os';

/**
 * 영수증·원장 디렉터리. 레포 밖이 기본이다.
 *
 * ★ **쓰는 쪽과 읽는 쪽이 같은 답을 내는 값만 쓴다** (2026-10-12 실측 고장).
 * 초판은 `CLAUDE_PLUGIN_DATA` 를 먼저 봤다. 그 변수는 **hook 프로세스에만** 있고
 * 모델의 Bash 셸에는 없다 — 그래서 `gate.mjs`(셸)는 `~/.design-device/receipts` 에
 * 영수증을 쓰고, Stop(hook)은 `~/.claude/plugins/data/…/receipts` 에서 찾았다.
 * control_tower 첫 실가동에서 **`--check` 는 「있다」, Stop 은 「없다」**를 냈다.
 * 세션 식별자(아래 `sessionId`)에서 이미 한 번 겪은 고장과 같은 종류다 —
 * **환경변수는 프로세스마다 다르다.** 키에 넣을 수 있는 것은 두 쪽에 다 있는 값뿐이다.
 * `DESIGN_DEVICE_DATA` 는 사람이 둘 다에 거는 값이라 남긴다(테스트도 이것을 쓴다).
 */
export function dataDir() {
  if (process.env.DESIGN_DEVICE_DATA) return process.env.DESIGN_DEVICE_DATA;
  return join(homedir(), '.design-device', 'receipts');
}

/**
 * 경로의 정본 — **심링크를 푼 절대 경로**. 셸의 `process.cwd()` 는 이미 풀린 값을
 * 주고(macOS `/var` → `/private/var`) hook 의 `payload.cwd` 는 받은 그대로라,
 * 같은 폴더가 두 해시가 된다(테스트를 쓰다 실측). 키와 비교에 쓰는 경로는 전부 이것을 거친다.
 */
export function canon(p) {
  const abs = resolve(p);
  try { return realpathSync(abs); } catch { return abs; }
}

/**
 * 대상 레포. hook 은 stdin 의 cwd 를, 손으로 돌릴 때는 process.cwd() 를 쓴다.
 * ★ 그리고 **레포 뿌리로 올린다** — 같은 고장의 두 번째 경로다. 셸이
 * `cd apps/desktop` 한 뒤 `gate.mjs` 를 돌리면 cwd 가 하위 폴더라 레포 해시가
 * 달라지고, 영수증이 Stop 이 보지 않는 파일에 쌓인다. `.git`(폴더든 worktree 의
 * 파일이든)이 있는 가장 가까운 조상이 뿌리다. 없으면 cwd 그대로다.
 */
export function projectDir(payload = {}) {
  const start = canon(payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  for (let d = start; ; d = dirname(d)) {
    if (existsSync(join(d, '.git'))) return d;
    if (dirname(d) === d) return start;
  }
}

/** 레포 경로의 짧은 해시 — 파일명에 절대 경로를 박지 않기 위해서다. */
export function projectTag(payload = {}) {
  return createHash('sha256').update(projectDir(payload)).digest('hex').slice(0, 10);
}

/**
 * 세션 식별자. **실측 주의 (2026-10-11)** — 이 빌드의 환경변수는
 * `CLAUDE_CODE_SESSION_ID` 다. `CLAUDE_SESSION_ID` 는 **없다**
 * (`env | grep CLAUDE` 로 확인). 틀린 이름만 읽으면 조용히 빈 문자열이 되고,
 * 그 결과는 "원장 없음 → 아무것도 묻지 않음" 이라 **고장과 정상이 구별되지 않는다.**
 * 그래서 stdin 의 `session_id` 를 먼저 보고, 두 이름을 모두 읽는다.
 */
export function sessionId(payload = {}) {
  const v = payload.session_id
    || process.env.CLAUDE_CODE_SESSION_ID
    || process.env.CLAUDE_SESSION_ID
    || '';
  return String(v).replace(/[^\w-]/g, '');
}

/**
 * 이 레포 · 이 세션의 편집 원장. 세션을 모르면 **null** 이다.
 * 공용 이름으로 떨어뜨리면 그게 바로 남의 세션을 차단하는 경로다 —
 * 세션이 없으면 원장도 없고, Stop 은 아무것도 묻지 않는다.
 */
export function ledgerFile(payload = {}) {
  const s = sessionId(payload);
  if (!s) return null;
  return join(dataDir(), `edited-${projectTag(payload)}-${s}.jsonl`);
}

/**
 * 영수증 파일. **레포별이고 세션별이 아니다** — 의도된 비대칭이다.
 *
 * 원장은 "**이** 세션이 무엇을 고쳤나" 이므로 세션별이어야 한다.
 * 영수증은 "이 **내용**을 재 봤나" 이고, 그것을 보증하는 것은 세션이 아니라
 * **내용 해시**다. 세션을 키에 넣으면 고장 하나가 생긴다 —
 * 래퍼는 셸에서 돌아 환경변수를 읽고, Stop 은 stdin 의 `session_id` 를 읽는다.
 * 두 값이 어긋나면 **영수증을 남겼는데도 Stop 이 영구히 막는다.**
 * 실측으로 어긋났다(2026-10-11): 셸에는 `CLAUDE_SESSION_ID` 가 없다.
 *
 * 세션을 넘긴 오래된 측정은 해시로 걸러지지 않으므로, 대신 영수증마다
 * 장치 버전을 적는다 — 어느 버전이 그 숫자를 냈는지는 남는다.
 */
export function receiptFile(payload = {}) {
  return join(dataDir(), `receipt-${projectTag(payload)}.jsonl`);
}

/** `p` 가 이 레포 안인가. Stop 은 레포 밖 파일을 절대 호명하지 않는다. */
export function insideProject(p, payload = {}) {
  const rel = relative(projectDir(payload), canon(p));
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/**
 * 측정 시점의 내용 해시. 영수증이 증거인 기간을 정하는 값이다.
 *
 * `readFileSync` 는 **위에서 import 한다.** 초판은 함수 안에서 `require` 를 썼고
 * ESM 에는 `require` 가 없다 — `catch` 가 `ReferenceError` 를 먹어서 모든 해시가
 * `null` 이 되고, 그러면 영수증에 대상이 0건으로 남아 **영구히 만료되지 않는
 * 영수증**이 된다. `ux-ui-agent-skills` 의 hook 주석이 같은 고장을 기록해 뒀다:
 * *"한 번도 발화하지 않는 hook 은 결함이 없는 코드베이스와 구별되지 않는다."*
 */
export function hashFile(p) {
  try {
    return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16);
  } catch { return null; }
}

// ─── 영수증 — 읽기·쓰기·생존 판정 ──────────────────────────────────────────
// ★ 왜 여기 있나: `scripts/gate.mjs` 는 **CLI** 다. 최상위에 argv 처리가 있어서
// 거기서 `liveReceiptsFor` 를 import 하면 **사용법 안내가 출력되고 exit 2** 가 된다.
// 실측(2026-10-11): Stop hook 이 그걸 import 했더니 편집이 0건인 세션에서도
// `exit=2` 로 턴이 막혔다 — 즉 **모든 턴이 사용법 메시지로 차단**됐다.
// 영수증의 정의는 한 곳에만 있어야 하고, 그 한 곳은 CLI 가 아니다.

/** 영수증 한 줄. `files` 를 적게 적으면 측정보다 오래 사는 영수증이 된다 — 이 기전이 막으려는 단 하나의 고장이다. */
export function writeReceipt({ gate, args = [], exit, files = [], values = [], device }, payload = {}) {
  const targets = files.map((f) => ({ path: canon(f), sha256: hashFile(f) })).filter((t) => t.sha256);
  const line = JSON.stringify({ at: new Date().toISOString(), gate, args, exit, targets, values, device });
  try {
    mkdirSync(dataDir(), { recursive: true });
    appendFileSync(receiptFile(payload), line + '\n');
    return true;
  } catch (e) {
    console.error(`영수증을 쓰지 못했다 (${e.message}) — 이 검사는 기록되지 않은 것으로 다룬다.`);
    return false;
  }
}

export function readReceipts(payload = {}) {
  const f = receiptFile(payload);
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

/** 영수증은 파일이 **측정 당시와 같은 해시**일 때만 살아 있다. */
export function liveReceiptsFor(file, payload = {}) {
  const now = hashFile(file);
  if (!now) return [];
  const abs = canon(file);
  return readReceipts(payload).filter((r) =>
    (r.targets ?? []).some((t) => t.path === abs && t.sha256 === now));
}
