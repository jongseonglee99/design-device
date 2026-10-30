#!/usr/bin/env node
// approvals — 사람 승인이 필요한 항목의 창구.
//
// 왜 분리했나: W35~W40 에서 승인 요청 7건이 6주간 미응답이었다. 직접 원인은
// 요청이 9,800자짜리 라운드 문서 §8 안에 묻혀 있었고, 답하려면 그 문서를 읽고
// 산문으로 회신해야 했다는 것이다. 창구가 없으면 적체는 의지 문제가 아니라 구조 문제다.
//
// 사용:
//   node scripts/approvals.mjs                      열린 항목만
//   node scripts/approvals.mjs --all                전부 (해소분 포함)
//   node scripts/approvals.mjs <id>                 1건 상세
//   node scripts/approvals.mjs <id> --yes "근거"    승인
//   node scripts/approvals.mjs <id> --no "근거"     거절
//   node scripts/approvals.mjs <id> --pick B "근거" 선택지 중 택일
//   node scripts/approvals.mjs --add "제목" --round 2026-W41
//   node scripts/approvals.mjs --json
//
// 종료 코드: 0 = 열린 항목 없음, 1 = 열린 항목 있음, 2 = 사용법 오류

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const FILE = join(ROOT, 'harness', 'approvals.json');
if (!existsSync(FILE)) { console.error('harness/approvals.json 이 없다'); process.exit(2); }

const db = JSON.parse(readFileSync(FILE, 'utf8'));
const save = () => writeFileSync(FILE, JSON.stringify(db, null, 2) + '\n');
const today = () => new Date().toISOString().slice(0, 10);

const argv = process.argv.slice(2);
const flag = (n) => argv.indexOf(n);
const has = (n) => flag(n) >= 0;
const val = (n) => (flag(n) >= 0 ? argv[flag(n) + 1] : undefined);

// ─── 주차 거리 계산: 적체의 '나이'를 보여주는 것이 이 도구의 핵심이다 ───
function weeksSince(roundId) {
  const m = /^(\d{4})-W(\d{2})$/.exec(roundId || '');
  if (!m) return null;
  const [, y, w] = m;
  // ISO 주차의 목요일을 기준으로 역산
  const jan4 = new Date(Date.UTC(+y, 0, 4));
  const dow = (jan4.getUTCDay() + 6) % 7;
  const monday = new Date(jan4.getTime() - dow * 864e5 + (+w - 1) * 7 * 864e5);
  return Math.max(0, Math.floor((Date.now() - monday.getTime()) / (7 * 864e5)));
}

// ─── 추가 ───
if (has('--add')) {
  const title = val('--add');
  if (!title) { console.error('--add "제목" 이 필요하다'); process.exit(2); }
  const id = Math.max(0, ...db.items.map((i) => i.id)) + 1;
  db.items.push({ id, title, raised: val('--round') || today(), status: 'open',
                  options: val('--options') ? val('--options').split('|') : undefined });
  save();
  console.log(`상신 #${id} — ${title}`);
  process.exit(0);
}

// ─── 결정 기록 ───
const idArg = argv.find((a) => /^\d+$/.test(a));
if (idArg && (has('--yes') || has('--no') || has('--pick'))) {
  const item = db.items.find((i) => i.id === +idArg);
  if (!item) { console.error(`#${idArg} 가 없다`); process.exit(2); }
  const decision = has('--pick') ? `선택: ${val('--pick')}` : has('--yes') ? '승인' : '거절';
  const why = val(has('--pick') ? '--pick' : has('--yes') ? '--yes' : '--no');
  // --pick 은 값 다음이 근거다
  const rationale = has('--pick') ? argv[flag('--pick') + 2] : why;
  item.status = has('--no') ? 'rejected' : 'resolved';
  item.decision = decision;
  item.rationale = rationale || '(근거 미기재)';
  item.resolvedAt = today();
  save();
  console.log(`#${item.id} ${decision} — ${item.title}`);
  if (!rationale) console.log('  근거를 적지 않았다. 나중에 왜 그렇게 정했는지 알 수 없게 된다.');
  process.exit(0);
}

// ─── 상세 ───
if (idArg) {
  const item = db.items.find((i) => i.id === +idArg);
  if (!item) { console.error(`#${idArg} 가 없다`); process.exit(2); }
  const age = weeksSince(item.raised);
  console.log(`\n#${item.id}  ${item.title}`);
  console.log(`상신 ${item.raised}${age != null ? ` (${age}주 전)` : ''} · 상태 ${item.status}`);
  if (item.options) { console.log('\n선택지'); item.options.forEach((o, i) => console.log(`  ${'ABCDEF'[i]}. ${o}`)); }
  if (item.decision) console.log(`\n결정 (${item.resolvedAt}): ${item.decision}`);
  if (item.rationale) console.log(`근거: ${item.rationale}`);
  if (item.residual) console.log(`\n남은 선택 사항: ${item.residual}`);
  console.log('');
  process.exit(0);
}

// ─── 목록 ───
const open = db.items.filter((i) => i.status === 'open');
const rest = db.items.filter((i) => i.status !== 'open');

if (has('--json')) {
  console.log(JSON.stringify({ open: open.length, items: has('--all') ? db.items : open }, null, 2));
  process.exit(open.length ? 1 : 0);
}

const STATE = { open: '대기', resolved: '해소', rejected: '거절', moot: '무의미' };

if (open.length) {
  console.log(`\n사람이 답해야 하는 것 — ${open.length}건\n`);
  for (const i of open) {
    const age = weeksSince(i.raised);
    const warn = age >= 3 ? `  ← ${age}주 미응답` : '';
    console.log(`  #${i.id}  ${i.title}`);
    console.log(`      상신 ${i.raised}${warn}`);
    if (i.options) i.options.forEach((o, n) => console.log(`        ${'ABCDEF'[n]}. ${o}`));
  }
  console.log(`\n답하기:  node scripts/approvals.mjs <번호> --yes "근거"`);
  console.log(`         node scripts/approvals.mjs <번호> --pick A "근거"\n`);
} else {
  console.log('\n사람이 답해야 하는 것: 없음\n');
}

if (has('--all') && rest.length) {
  console.log(`해소된 것 — ${rest.length}건\n`);
  for (const i of rest) {
    console.log(`  #${i.id}  [${STATE[i.status] || i.status}] ${i.title}`);
    if (i.decision) console.log(`      → ${i.decision}  (${i.resolvedAt})`);
  }
  console.log('');
}

process.exitCode = open.length ? 1 : 0;   // exit() 는 파이프 출력을 64KB 에서 자른다 (2026-10-30)
