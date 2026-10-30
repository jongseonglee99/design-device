#!/usr/bin/env node
// design-stop — **측정하지 않은 디자인 편집으로 턴을 끝내지 않는다.**
//
// ★ 이 hook 이 존재하는 이유는 이번 세션에 실측된 결함이다 (`DECISIONS.md` D-5 정정):
// `PostToolUse` 는 **편집 뒤에** 돈다. `exit 2` 는 쓰기를 막지 못한다 —
// 파일은 이미 디스크에 있고, stderr 가 모델에게 blocking error 로 되먹여질 뿐이다.
// 그래서 「차단」이라고 불러 온 것은 실제로는 **사후 통보**였다.
//
// `Stop` 은 다르다. 모델이 **턴을 끝내는 것**을 막는다. 쓰기를 되돌릴 수는 없지만
// *재지 않고 끝내는 것*은 막을 수 있고, 애초에 원했던 구속력은 그쪽이다.
//
// 묻는 것은 "검사를 돌렸나"가 아니라 **"지금 이 내용을 재 봤나"** 다.
// 영수증은 측정 시점의 해시를 들고 있으므로, 재고 나서 고친 파일은 미측정이다
// (`scripts/gate.mjs`).
//
// ─── 네 가지 의도된 완화 — 하나라도 빠지면 사용자가 이 hook 을 끈다 ───
//  ① `stop_hook_active` 를 가장 먼저 본다. Stop hook 때문에 이미 계속 도는 중이면
//     또 막는 것은 끝나지 않는다.
//  ② **옵트인이 먼저다** (`D-18`). `design.config.json` 이 없는 레포에서는
//     아무것도 묻지 않는다. 장치를 쓴 적 없는 레포가 자기 `tokens.css` 때문에
//     턴을 못 끝내는 것은 차단이 아니라 고장이다.
//  ③ 묻는 대상은 **디자인 표면 파일**뿐이다 — 토큰 파일과 `.html/.css/.scss`.
//     편집한 `.ts` 전부에 영수증을 요구하면 실제 앱 레포에서 수십 건이 뜨고,
//     만족시킬 수 없는 요구는 차단이 아니다.
//  ④ 원장이 없거나 세션을 모르면 조용하다. 공용 원장으로 떨어뜨려
//     **남의 레포 편집으로 차단**하는 것이 가장 빠르게 끄는 길이다 (`_ledger.mjs`).
//  ⑤ **생성자가 아직 쓰는 초안은 묻지 않는다** (0.4.5). 생성자 서브에이전트의 편집도 같은 세션
//     원장에 적히므로, 백그라운드 생성 중에 편집자가 턴을 끝내면 반쯤 쓴 파일에 영수증을 요구했다.
//     편집자가 재면 생성자가 다시 고치고, 또 막혔다 — control_tower 10-30 에 같은 파일로 네 번.
//     「생성은 자유롭게, 검증은 엄격하게」(#49) 와 반대다. 마지막 편집이 서브에이전트(`agent_id`)이고
//     서브에이전트·워크플로가 아직 돌고 있으면(`background_tasks`) 미룬다 — 끝난 뒤의 Stop 이 한 번 묻는다.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ledgerFile, insideProject, projectDir, liveReceiptsFor, readReceipts } from './_ledger.mjs';

let payload = {};
try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { payload = {}; }

// ① Stop 때문에 이미 계속 도는 중 → 통과. 아니면 영원히 끝나지 않는다.
if (payload.stop_hook_active) process.exit(0);

// ④ 원장이 없으면 이 세션에 기록된 편집이 없다.
const ledger = ledgerFile(payload);
if (!ledger || !existsSync(ledger)) process.exit(0);

const cwd = projectDir(payload);

const lastEdit = new Map();   // 파일 → 마지막 편집 줄 (누가 썼나)
for (const l of readFileSync(ledger, 'utf8').split('\n').filter(Boolean)) {
  try { const e = JSON.parse(l); if (e.path) lastEdit.set(e.path, e); } catch { /* 깨진 줄 */ }
}
const edited = [...lastEdit.keys()].filter((p) => insideProject(p, payload) && existsSync(p));

// ⑤ 아직 도는 생성자. 이 값이 없는 Claude Code 에서는 알 수 없으므로 미루지 않는다(예전 동작).
const generating = (payload.background_tasks ?? [])
  .some((t) => /subagent|workflow/i.test(t.type ?? '') && !/complet|fail|kill|stop|done/i.test(t.status ?? ''));
const drafting = (p) => generating && Boolean(lastEdit.get(p)?.agent);

if (!edited.length) process.exit(0);

// ② 옵트인 — `design-check.mjs` 와 **같은 탐색**을 쓴다.
// 경계 정의가 두 벌이 되면 한쪽이 반드시 먼저 틀린다.
function findConfig(file) {
  for (let d = dirname(file); d.startsWith(cwd) || d === cwd; d = dirname(d)) {
    const cfg = join(d, 'design.config.json');
    if (existsSync(cfg)) {
      try { return { ...JSON.parse(readFileSync(cfg, 'utf8')), __dir: d }; } catch { return { __dir: d }; }
    }
    if (d === cwd) break;
  }
  return null;
}

const TOKEN_FILE = /(globals|tokens|theme|variables|colors?)\.(css|scss|ts|tsx|js)$/i;
const DEFAULT_EXT = ['.html', '.htm', '.css', '.scss'];

// ③ 디자인 표면만. 레포가 넓히고 싶으면 `receipts.ext` 로 넓힌다.
const needsReceipt = [];
const deferred = [];
const modeOf = new Map();     // 파일 → 그 레포 설정의 모드 (안내 명령에 넣는다)
for (const p of edited) {
  const conf = findConfig(p);
  if (!conf) continue;                                   // 옵트인 안 한 경로
  if (conf.hook === false) continue;                     // hook 전체를 끈 경우
  if (conf.receipts === false) continue;                 // 영수증만 끈 경우
  const exts = Array.isArray(conf.receipts?.ext) ? conf.receipts.ext : DEFAULT_EXT;
  const declaredToken = conf.paths?.tokens && resolve(conf.__dir, conf.paths.tokens) === p;   // 선언이 이름 추측보다 우선
  if (!exts.includes(extname(p)) && !TOKEN_FILE.test(p) && !declaredToken) continue;
  if (liveReceiptsFor(p, payload).length > 0) continue;
  if (drafting(p)) { deferred.push(p); continue; }
  needsReceipt.push(p);
  modeOf.set(p, conf.mode);
}

if (!needsReceipt.length) process.exit(0);

// ★ **왜 없는지를 파일마다 말한다** (2026-10-12 — control_tower 에서 두 번 「훅이 틀렸다」고 의심받았다).
// 두 번째는 훅이 맞았다: 08:52 에 잰 뒤 PR 여섯 개·브랜치 전환을 거치며 내용이 바뀌었다.
// 「없다」만 말하면 모델은 「방금 쟀는데」 하고 훅을 의심한다. 「재고 나서 바뀌었다(마지막 측정 시각)」와
// 「한 번도 안 쟀다」는 다른 사실이고, 앞의 것은 **브랜치 전환·머지·리베이스도 내용을 바꾼다**는 뜻이다.
const receipts = readReceipts(payload);
const why = (p) => {
  const last = receipts.filter((r) => (r.targets ?? []).some((t) => t.path === p)).pop();
  if (!last) return '이 세션에서 한 번도 재지 않았다';
  const hhmm = new Date(last.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `재고 나서 내용이 바뀌었다 — 마지막 측정 ${hhmm} (${last.gate}). 편집·브랜치 전환·머지·리베이스 모두 해당`;
};
const shown = needsReceipt.slice(0, 12);
const list = shown.map((p) => `  ${relative(cwd, p) || p}\n      ↳ ${why(p)}`).join('\n')
  + (needsReceipt.length > shown.length ? `\n  … 그리고 ${needsReceipt.length - shown.length}건 더` : '');

// ★ **그대로 붙여 돌릴 수 있는 명령을 준다** (0.4.5). 예전 안내는 `<장치경로>` 자리표시였다 —
// hook 메시지는 하네스가 펼치지 않으므로 모델이 경로를 찾아 헤매거나 `CLAUDE_PLUGIN_DATA=…` 를 손으로 붙였다.
// 이 파일의 위치가 곧 장치 경로다. 폴더마다 한 줄 — gate 는 폴더를 받으면 안의 파일 전부에 영수증을 남긴다.
const GATE = join(fileURLToPath(new URL('..', import.meta.url)), 'scripts', 'gate.mjs');
const q = (x) => (/[\s'"$`]/.test(x) ? `'${x.replace(/'/g, `'\\''`)}'` : x);
const cmds = [];
const byDir = new Map();
for (const p of needsReceipt) {
  if (TOKEN_FILE.test(p)) { cmds.push(`node ${q(GATE)} contrast-check ${q(relative(cwd, p) || p)}`); continue; }
  const d = relative(cwd, dirname(p)) || '.';
  byDir.set(d, modeOf.get(p) ?? byDir.get(d));
}
for (const [d, m] of byDir) cmds.push(`node ${q(GATE)} slop-scan ${q(d)} --mode ${m ?? '<tool|consumer|marketing|graphic>'}`);
const later = deferred.length ? `\n(생성자가 아직 쓰는 초안 ${deferred.length}건은 생성이 끝난 뒤에 묻는다.)\n` : '';

process.stderr.write(
  `[design-device] 디자인 표면 ${needsReceipt.length}건을 편집했고 **살아 있는 영수증이 없다**:\n${list}\n${later}\n`
  + `이 명령을 그대로 돌리면 영수증이 남는다 (cwd: 레포 루트):\n`
  + cmds.map((c) => `  ${c}`).join('\n') + '\n'
  + `  (렌더까지 잴 때: node ${q(GATE)} measure-render <파일>)\n\n`
  + `영수증은 파일이 바뀌면 만료된다 — 재고 나서 고쳤다면 다시 재야 한다.\n`
  + `이 요구를 끄려면 design.config.json 에 "receipts": false 를 적는다.\n`,
);
process.exit(2);
