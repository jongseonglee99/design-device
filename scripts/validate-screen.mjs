#!/usr/bin/env node
// validate-screen — 화면 상세 문서가 PRD §4-1 필수 필드를 지켰는지 검사한다.
//
// `docs/PRD.md` §4-1 이 요구하는 것:
//   목적 / 진입 경로 / 모드 / 상태 5종(빈·로딩·오류·부분·정상)
//   위계 순서 / 조작 목록 / 금지 / device_version
//   + `상위 문서` 의 PRD 버전이 대상 PRD 의 지금 버전과 같은가 (승인 `#34 C`, `_prd.mjs`)
//
// 왜 기계가 보나 — 이 문서의 구속력은 **빌드 step 의 AC** 에서 나온다(`D-4`).
// AC 에 걸려면 사람이 읽지 않고도 통과·실패가 갈려야 한다.
//
// ★ 설계 원칙 — **「해당 없음」은 통과이고, 공란은 실패다.**
// 상태 다섯 칸을 "채워져 있는가"로만 보면, 로딩을 금지한 화면이 스피너를 발명하게 된다
// (컨트롤타워 S2 가 그렇다 — PRD N8 이 캐시 1.5초를 요구해 스피너가 **금지**다).
// 그래서 `해당 없음 — <이유>` 를 1급 답으로 받고, **이유 없는 해당 없음을 막는다.**
// 빈 칸과 "없어야 한다"는 다른 사실이고, 그 차이를 적게 만드는 것이 이 검사의 전부다.
//
// 사용: node scripts/validate-screen.mjs <파일|디렉토리> [--json]
// 종료 코드: 0 = 통과, 1 = 위반, 2 = 사용법 오류

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRootOf, prdVersion, screenPrdVersion, comparePrd } from './_prd.mjs';

// 장치 레포 자신의 PRD 는 **장치의** PRD 다 — 여기 있는 초안을 그것과 대조하면 전부 오탐이다.
const DEVICE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MODES = ['tool', 'consumer', 'marketing', 'graphic'];
// 상태 다섯 종. 라벨은 PRD §4-1 그대로다 — 제품이 어휘를 바꾸면 매핑을 적게 한다.
const STATES = [
  ['빈', /\*\*빈\*\*|빈\s*상태/],
  ['로딩', /\*\*로딩\*\*|로딩\s*상태/],
  ['오류', /\*\*오류\*\*|오류\s*상태/],
  ['부분', /\*\*부분\*\*|부분\s*(실패|상태)/],
  ['정상', /\*\*정상\*\*|정상\s*상태/],
];
// 「해당 없음」 표기 — 이유가 붙어야 답이다.
const NA = /해당\s*없음/;
const NA_WITH_REASON = /해당\s*없음\s*[—\-–:]\s*\S/;

const SECTIONS = [
  ['목적', /^##\s*\d*\.?\s*목적/m],
  ['진입 경로', /^##\s*\d*\.?\s*진입\s*경로/m],
  ['상태', /^##\s*\d*\.?\s*상태/m],
  ['위계 순서', /^##\s*\d*\.?\s*위계\s*순서/m],
  ['조작', /^##\s*\d*\.?\s*조작/m],
  ['금지', /^##\s*\d*\.?\s*금지/m],
];

// 템플릿을 그대로 낸 것을 잡는다. 표 행이 전부 `| | |` 면 필드가 있는 게 아니다.
// 단 **머리행은 비어 있어도 된다** — `| | |` 뒤에 `|---|` 가 오는 2열 무제목 표가 그렇다.
const EMPTY_ROW = /^\s*\|(\s*\|)+\s*$/;
const SEP_ROW = /^\s*\|(\s*:?-+:?\s*\|)+\s*$/;
const emptyBodyRows = (text) => {
  const L = text.split('\n');
  return L.filter((l, i) => EMPTY_ROW.test(l) && !SEP_ROW.test(L[i + 1] || ''));
};

// 템플릿 자리값. 이것이 남아 있으면 문서가 아니라 틀이다.
const PLACEHOLDER = [['id', /\|\s*\*\*id\*\*\s*\|\s*`?S00`?\s*\|/],
                     ['device_version', /\|\s*\*\*device_version\*\*\s*\|\s*`?0\.0\.0`?\s*\|/]];

const HEAD = [
  ['id', /\|\s*\*\*id\*\*\s*\|\s*`?(S\d{2,})`?\s*\|/],
  ['device_version', /\|\s*\*\*device_version\*\*\s*\|\s*`?(\d+\.\d+\.\d+)`?\s*\|/],
];

function sectionBody(text, startRe) {
  const m = startRe.exec(text);
  if (!m) return null;
  const from = m.index + m[0].length;
  const next = /^##\s/m.exec(text.slice(from));
  return text.slice(from, next ? from + next.index : undefined);
}

function check(file) {
  const t = readFileSync(file, 'utf8');
  const errs = [], warns = [];

  // ── 머리말 ───────────────────────────────────────────────────────────────
  for (const [name, re] of HEAD)
    if (!re.test(t)) errs.push(`머리말에 \`${name}\` 이 없거나 형식이 다르다`);

  const modeLine = /\|\s*\*\*모드\*\*\s*\|([^|]*)\|/.exec(t);
  if (!modeLine) errs.push('머리말에 `모드` 가 없다');
  else {
    const found = MODES.filter((m) => new RegExp('`' + m + '`').test(modeLine[1]));
    if (!found.length) errs.push(`모드가 ${MODES.join('/')} 중 하나로 명시되지 않았다`);
    // 템플릿은 네 개를 나열한다 — 그것을 그대로 낸 것은 모드를 고르지 않은 것이다.
    else if (found.length > 1) errs.push(`모드가 ${found.length}개 적혀 있다 — 산출물 단위로 **하나만** 고른다`);
  }

  // ── 절 존재 ──────────────────────────────────────────────────────────────
  for (const [name, re] of SECTIONS)
    if (!re.test(t)) errs.push(`\`${name}\` 절이 없다`);

  // ── 상태 다섯 종 ─────────────────────────────────────────────────────────
  const stateBody = sectionBody(t, SECTIONS[2][1]);
  if (stateBody) {
    for (const [name, re] of STATES) {
      const row = stateBody.split('\n').find((l) => re.test(l) && l.includes('|'));
      if (!row) { errs.push(`상태 \`${name}\` 행이 없다`); continue; }
      const cells = row.split('|').slice(2).map((c) => c.trim()).filter(Boolean);
      if (!cells.length) { errs.push(`상태 \`${name}\` 행이 비어 있다`); continue; }
      const joined = cells.join(' ');
      // 「해당 없음」은 답이다 — 단 이유가 있어야 한다.
      if (NA.test(joined) && !NA_WITH_REASON.test(joined))
        errs.push(`상태 \`${name}\` 이 「해당 없음」인데 **이유가 없다**. ` +
                  '빈 칸과 "없어야 한다"는 다른 사실이다 — `해당 없음 — <이유>` 로 적는다');
    }
  }

  // ── 위계 채널 예산 — 0 이거나 3 이상 (decision-logic §3) ─────────────────
  const hierBody = sectionBody(t, SECTIONS[3][1]);
  if (hierBody) {
    if (!/^\s*1\./m.test(hierBody))
      errs.push('`위계 순서` 에 번호 매긴 읽기 순서가 없다 — 없으면 빌드 세션이 매번 다시 정한다');
    const budget = /채널\s*예산/.test(hierBody);
    if (!budget) warns.push('`위계 채널 예산` 표가 없다 (`system/decision-logic.md` §3)');
    else {
      // `| 채널명 | **n** | ... |` 형태에서 단계 수를 읽는다.
      for (const line of hierBody.split('\n')) {
        const m = /^\s*\|\s*([^|]+?)\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|/.exec(line);
        if (!m) continue;
        const n = +m[2];
        if (n === 1 || n === 2)
          errs.push(`채널 \`${m[1]}\` 이 ${n}단계다 — §3 금지 구간이다. ` +
                    '켜 놓고 위계를 만들지 않은 상태이고 그것이 AI 기본값 룩이다. 0 으로 죽이거나 3 이상으로 올린다');
      }
    }
  }

  // ── 조작 — 되돌릴 수 없으면 확인을 요구한다 ──────────────────────────────
  const opBody = sectionBody(t, SECTIONS[4][1]);
  const purposeBody = sectionBody(t, SECTIONS[0][1]) || '';

  // `first_action:` — 1인칭 시뮬레이션 (관측 #511).
  // 기계가 "시각적 1순위인가"는 판정할 수 없다. 판정할 수 있는 것은 **조작 표에 있는가**다 —
  // 선언한 첫 조작이 조작 목록에 없으면 화면이 그 일을 지원하지 않는 것이다.
  // `\s*` 를 쓰면 줄바꿈을 먹고 **다음 줄**을 값으로 읽는다 — 빈 선언이 통과한다.
  // 조작 **이름 열만** 뽑는다. 아래 두 검사가 함께 쓴다.
  const opNames = opBody ? opBody.split('\n')
    .filter((l) => l.startsWith('|') && !SEP_ROW.test(l) && !EMPTY_ROW.test(l))
    .map((l) => (l.split('|')[1] || '').trim())
    .filter((n) => n && !/^조작$/.test(n))
    .join(' · ') : '';

  const fa = /first_action[ \t]*:[ \t]*([^\n]+)/.exec(purposeBody);
  if (!fa || !fa[1].trim()) {
    errs.push('`목적` 에 `first_action:` 선언이 없다 (관측 `#511` — 가장 먼저 누르는 것)');
  } else if (opNames) {
    const decl = fa[1].trim().replace(/[`*]/g, '');
    // ★ **조작 이름 열**과 비교한다. 초판은 표 전체(`opBody`)를 봤고,
    // 거기에는 머리행 `조작 | 결과 | 되돌리기 | 확인 요구` 가 들어 있다 —
    // 선언에 「확인」·「결과」 같은 흔한 말이 있으면 **머리글에 걸려 통과**했다.
    const toks = decl.split(/[\s,·()[\]「」]+/).filter((w) => w.length >= 2);
    // ★ 한국어 조사·어미를 흡수한다. 「검색창에」·「입력한다」는 표의 「검색 입력」과
    // 글자가 달라 초판이 **오탐으로 실패**시켰다 (실측 2026-10-12, S05).
    // 어간 2글자를 접두사로 비교한다 — 동일 표기를 요구하면 한국어에서 매번 걸린다.
    const stem = (w) => w.slice(0, 2);
    const hit = toks.some((w) => opNames.includes(w) || opNames.includes(stem(w)));
    if (!hit) errs.push(`선언한 \`first_action: ${decl}\` 이 조작 표에 없다 — ` +
                        '사용자가 가장 먼저 하려는 일을 화면이 지원하지 않는다');
  }

  if (opNames) {
    // 대칭 쌍 (관측 #511 ㉡) — 추가가 있으면 제거가 있어야 한다.
    // `opNames` 는 위에서 계산했다 — 두 벌이면 한쪽이 먼저 틀린다.
    if (/추가|생성|등록|\badd\b|\bcreate\b/i.test(opNames) &&
        !/제거|삭제|해제|취소|빼|\bremove\b|\bdelete\b/i.test(opNames))
      errs.push('조작에 `추가`/`생성` 은 있고 `제거`/`삭제`/`해제` 가 없다 — ' +
                '대칭 쌍이 빠졌다 (관측 `#511`: "추가만 하는 게 아니고 빼기도 있어야지")');
  }
  if (opBody) {
    for (const line of opBody.split('\n')) {
      if (!line.startsWith('|') || EMPTY_ROW.test(line)) continue;
      const c = line.split('|').map((x) => x.trim());
      if (c.length < 6) continue;
      const [, op, , undo, confirm] = c;
      if (/되돌리기|^-+$/.test(undo) || !op) continue;   // 머리행·구분행
      const irreversible = /불가|없다|없음/.test(undo) && !NA.test(undo);
      const asksConfirm = /필요|요구|있음|예/.test(confirm);
      if (irreversible && !asksConfirm)
        errs.push(`조작 \`${op}\` 은 되돌릴 수 없는데 확인을 요구하지 않는다`);
    }
  }

  // ── 템플릿 그대로 낸 것 ──────────────────────────────────────────────────
  for (const [name, re] of PLACEHOLDER)
    if (re.test(t)) errs.push(`\`${name}\` 이 템플릿 자리값 그대로다`);

  const empties = emptyBodyRows(t).length;
  if (empties >= 3)
    errs.push(`빈 표 행이 ${empties}개다 — 템플릿을 채우지 않았다`);
  else if (empties) warns.push(`빈 표 행 ${empties}개`);

  // ── 근거 (승인 #20 C) ────────────────────────────────────────────────────
  if (!/^##\s*\d*\.?\s*근거/m.test(t))
    warns.push('`근거` 절이 없다 (승인 `#20 C` — 규칙을 적용하면 원관측 번호를 함께 적는다)');

  // ── PRD 버전 (승인 #34 C) — 주 버전이 다르면 낡음 ────────────────────────
  const root = repoRootOf(dirname(file));
  if (root && root !== DEVICE_ROOT) {
    const prd = prdVersion(root);
    const v = comparePrd(screenPrdVersion(t), prd?.version);
    if (v.level === 'error') errs.push(v.msg);
    else if (v.level === 'warn') warns.push(v.msg);
  }

  return { file: basename(file), errs, warns };
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const target = args.find((a) => !a.startsWith('--'));
if (!target) { console.error('사용법: node scripts/validate-screen.mjs <파일|디렉토리> [--json]'); process.exit(2); }
const root = resolve(target);
if (!existsSync(root)) { console.error(`경로 없음: ${root}`); process.exit(2); }

const files = statSync(root).isDirectory()
  ? readdirSync(root).filter((f) => f.endsWith('.md')).map((f) => join(root, f))
  : [root];
if (!files.length) { console.error(`화면 문서가 없다: ${root}`); process.exit(2); }
const results = files.map(check);

if (asJson) { console.log(JSON.stringify(results, null, 2)); }
else {
  for (const r of results) {
    const mark = r.errs.length ? '❌' : r.warns.length ? '⚠️ ' : '✅';
    console.log(`${mark} ${r.file}`);
    r.errs.forEach((e) => console.log(`     ❌ ${e}`));
    r.warns.forEach((w) => console.log(`     ⚠️  ${w}`));
  }
  const bad = results.filter((r) => r.errs.length).length;
  console.log(`\n${results.length}건 검사 · 위반 ${bad}건`);
}
process.exitCode = results.some((r) => r.errs.length) ? 1 : 0;   // exit() 는 파이프 출력을 64KB 에서 자른다 (2026-10-30)
