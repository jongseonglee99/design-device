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

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, relative, resolve } from 'node:path';
import { ledgerFile, insideProject, projectDir, liveReceiptsFor, readReceipts } from './_ledger.mjs';

let payload = {};
try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { payload = {}; }

// ① Stop 때문에 이미 계속 도는 중 → 통과. 아니면 영원히 끝나지 않는다.
if (payload.stop_hook_active) process.exit(0);

// ④ 원장이 없으면 이 세션에 기록된 편집이 없다.
const ledger = ledgerFile(payload);
if (!ledger || !existsSync(ledger)) process.exit(0);

const cwd = projectDir(payload);

const edited = [...new Set(
  readFileSync(ledger, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l).path; } catch { return null; } })
    .filter(Boolean)
    .filter((p) => insideProject(p, payload) && existsSync(p)))];

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
for (const p of edited) {
  const conf = findConfig(p);
  if (!conf) continue;                                   // 옵트인 안 한 경로
  if (conf.hook === false) continue;                     // hook 전체를 끈 경우
  if (conf.receipts === false) continue;                 // 영수증만 끈 경우
  const exts = Array.isArray(conf.receipts?.ext) ? conf.receipts.ext : DEFAULT_EXT;
  const declaredToken = conf.paths?.tokens && resolve(conf.__dir, conf.paths.tokens) === p;   // 선언이 이름 추측보다 우선
  if (!exts.includes(extname(p)) && !TOKEN_FILE.test(p) && !declaredToken) continue;
  if (liveReceiptsFor(p, payload).length === 0) needsReceipt.push(p);
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

process.stderr.write(
  `[design-device] 디자인 표면 ${needsReceipt.length}건을 편집했고 **살아 있는 영수증이 없다**:\n${list}\n\n`
  + `영수증을 남기는 래퍼로 돌린다 — 무엇을 쟀는지 기록된다:\n`
  + `  node <장치경로>/scripts/gate.mjs contrast-check <토큰파일>\n`
  + `  node <장치경로>/scripts/gate.mjs slop-scan <경로> --mode <모드>\n`
  + `  node <장치경로>/scripts/gate.mjs --check <파일>\n\n`
  + `영수증은 파일이 바뀌면 만료된다 — 재고 나서 고쳤다면 다시 재야 한다.\n`
  + `이 요구를 끄려면 design.config.json 에 "receipts": false 를 적는다.\n`,
);
process.exit(2);
