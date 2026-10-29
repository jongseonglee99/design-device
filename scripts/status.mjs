#!/usr/bin/env node
// status — "자리를 비웠다 돌아왔다. 지금 무슨 상태인가"에 한 화면으로 답한다.
//
// 왜 필요한가: 2026-08-19 ~ 2026-10-03 사이 라운드가 6번 돌았고 전부 0건이었다.
// 각 라운드는 성실히 기록했지만 그 사실을 알려면 9,800자짜리 문서 6개를 읽어야 했다.
// 하네스가 '성공'을 보고하면서 아무것도 생산하지 않는 상태가 6주간 보이지 않았다.
//
// 사용: node scripts/status.mjs [--json]

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const asJson = process.argv.includes('--json');
const r = (...p) => join(ROOT, ...p);
const ls = (d) => (existsSync(r(d)) ? readdirSync(r(d)) : []);
const daysSince = (t) => Math.floor((Date.now() - t) / 864e5);

const out = {};

// ─── 라운드: 최근 것들이 실제로 무언가를 생산했는가 ───
const rounds = ls('harness/rounds').filter((f) => f.endsWith('.md')).sort();
const roundInfo = rounds.slice(-8).map((f) => {
  const txt = readFileSync(r('harness/rounds', f), 'utf8');
  const m = /관측\s*(\d+)\s*건/.exec(txt);
  const obs = m ? +m[1] : null;
  return { id: f.replace('.md', ''), obs, mtime: statSync(r('harness/rounds', f)).mtimeMs };
});
const recent = roundInfo.slice(-6);
const barren = recent.filter((x) => x.obs === 0).length;
out.rounds = { total: rounds.length, recent: roundInfo, barrenStreak: barren };

// ─── 관측·신호 ───
const obsFiles = ls('observations').filter((f) => f.endsWith('.md'));
const newestObs = obsFiles.length
  ? Math.max(...obsFiles.map((f) => statSync(r('observations', f)).mtimeMs))
  : null;
const sigFiles = ls('signals').filter((f) => f.endsWith('.md'));
out.assets = {
  observations: obsFiles.length,
  observationAgeDays: newestObs ? daysSince(newestObs) : null,
  signals: sigFiles.map((f) => f.replace('.md', '')),
};

// ─── 승인 적체 ───
let approvals = { open: 0, oldestWeeks: null };
if (existsSync(r('harness/approvals.json'))) {
  const db = JSON.parse(readFileSync(r('harness/approvals.json'), 'utf8'));
  const open = db.items.filter((i) => i.status === 'open');
  approvals = { open: open.length, items: open.map((i) => ({ id: i.id, title: i.title, raised: i.raised })) };
}
out.approvals = approvals;

// ─── 소스 도달성 (캐시된 마지막 preflight 가 없으면 '미확인') ───
out.sources = existsSync(r('.preflight.json'))
  ? JSON.parse(readFileSync(r('.preflight.json'), 'utf8'))
  : null;

// ─── 제품: 미확인 피드백 ───
const products = ls('products').filter((d) => {
  try { return statSync(r('products', d)).isDirectory(); } catch { return false; }
});
out.products = products.map((p) => {
  const lp = r('products', p, 'feedback-ledger.json');
  const guide = r('products', p, 'UI_GUIDE.md');
  return {
    name: p,
    hasGuide: existsSync(guide),
    guideAgeDays: existsSync(guide) ? daysSince(statSync(guide).mtimeMs) : null,
    ledger: existsSync(lp) ? JSON.parse(readFileSync(lp, 'utf8')) : null,
  };
});

// ─── git ───
const git = (...a) => { try { return execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' }).trim(); } catch { return ''; } };
out.git = {
  lastCommit: git('log', '-1', '--format=%h %cs %s'),
  dirty: git('status', '--porcelain').split('\n').filter(Boolean).length,
  behind: +(git('rev-list', '--count', 'HEAD..origin/main') || 0),
};

if (asJson) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

// ─────────────── 사람이 읽는 출력 ───────────────
const W = 64;
const rule = (c = '─') => console.log(c.repeat(W));
const head = (t) => { console.log(''); console.log(t); rule(); };

console.log('');
console.log('  디자인 비서 — 현황');
rule('═');

// 1. 가장 먼저: 이 시스템이 지금 작동하고 있는가
head('하네스');
if (!recent.length) {
  console.log('  라운드 기록 없음');
} else {
  const last = recent[recent.length - 1];
  console.log(`  최근 라운드   ${last.id}   관측 ${last.obs ?? '?'}건`);
  const spark = recent.map((x) => (x.obs ? String(Math.min(9, x.obs)) : '·')).join(' ');
  console.log(`  최근 ${recent.length}회     ${spark}   (· = 0건)`);
  if (barren >= 2) {
    console.log('');
    console.log(`  ※ ${barren}회 연속 0건이다. 라운드는 '성공'을 보고하지만 아무것도 생산하지 않는다.`);
    console.log(`     node scripts/preflight.mjs 로 소스 도달성부터 확인한다.`);
  }
}

// 2. 사람이 막고 있는 것
head('사람이 답해야 하는 것');
if (!approvals.open) {
  console.log('  없음');
} else {
  for (const i of approvals.items) console.log(`  #${i.id}  ${i.title}   (${i.raised})`);
  console.log(`\n  node scripts/approvals.mjs 로 답한다`);
}

// 3. 자산이 늙고 있는가
head('자산');
const ageNote = out.assets.observationAgeDays == null ? '' :
  out.assets.observationAgeDays > 56 ? `  ← ${out.assets.observationAgeDays}일. 반감기(8주)를 넘겼다`
  : out.assets.observationAgeDays > 28 ? `  ← ${out.assets.observationAgeDays}일`
  : '';
console.log(`  관측        ${out.assets.observations}건${ageNote}`);
console.log(`  신호        ${out.assets.signals.length}건  ${out.assets.signals.join(', ') || '—'}`);

// 4. 제품
head('제품');
if (!out.products.length) console.log('  없음');
for (const p of out.products) {
  const g = p.hasGuide ? `UI_GUIDE ${p.guideAgeDays}일 전` : 'UI_GUIDE 없음';
  console.log(`  ${p.name.padEnd(18)} ${g}`);
}
if (out.products.some((p) => p.hasGuide)) {
  console.log(`\n  빌드 쪽 변경 회수:  node scripts/collect-feedback.mjs <소비 레포 경로>`);
}

// 5. 저장소
head('저장소');
console.log(`  마지막 커밋  ${out.git.lastCommit}`);
if (out.git.behind) console.log(`  원격보다 ${out.git.behind}개 뒤  → git pull`);
if (out.git.dirty) console.log(`  미커밋 ${out.git.dirty}개`);

console.log('');
rule('═');
console.log('');
