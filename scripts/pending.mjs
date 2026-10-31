#!/usr/bin/env node
// pending — **사용자가 미루고 있는 것**을 모은다 (승인 `#53 A`, 2026-10-31).
//
// 사용자: *"내가 해야하는 일 중에 미루고 있거나 진행하지 않고 있는게 있으면 지속적으로 푸쉬해줘.
// 아무리 못해도 1주에 최소 2~3개의 제품의 디자인 및 여러 부분들을 보완하고 있으니 그 내용을 함께 참고해서"*.
// 장치는 사람의 판정으로 자란다(관측 `#knowledge-chain-audit`: 판정 5건이 모델 추출 1,033항보다 레포를 많이 바꿨다).
// 그런데 판정 거리는 네 군데에 흩어져 있었고 아무도 세지 않았다 — 승인 대기 · 취향 측정기 · 대상 레포 시안 판정 · 이번 주 작업.
//
// 사용: node scripts/pending.mjs [--json] [--summary]
//   --summary  알림용 한 줄
// 대상 레포는 읽기만 한다. dogu 는 원격 스냅숏(DOGU_SNAPSHOT 또는 ~/.design-device/snapshots/dogu_worktool)을 본다.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJ = process.env.DESIGN_PROJECTS ?? join(homedir(), 'Documents', 'projects');
const SNAP = process.env.DOGU_SNAPSHOT ?? join(homedir(), '.design-device', 'snapshots', 'dogu_worktool');
const REPOS = [
  { name: 'control_tower', dir: join(PROJ, 'control_tower'), ledger: join(PROJ, 'control_tower', 'docs', 'design-ledger.md'), rev: '--all' },
  { name: 'Seemilar_worktool', dir: join(PROJ, 'Seemilar_worktool'), ledger: join(PROJ, 'Seemilar_worktool', 'docs', 'design-ledger.md'), rev: '--all' },
  { name: 'dogu_worktool', dir: join(PROJ, 'dogu_worktool'), ledger: join(SNAP, 'docs', 'design-ledger.md'), rev: 'origin/main' },
];
const args = process.argv.slice(2);
const now = Date.now();
const days = (iso) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 864e5));
const git = (dir, a) => { const r = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : ''; };

// ① 승인 대기
const approvals = (() => {
  try {
    const db = JSON.parse(readFileSync(join(ROOT, 'harness', 'approvals.json'), 'utf8'));
    return db.items.filter((i) => i.status === 'open').map((i) => ({ id: i.id, title: i.title, raised: i.raised }));
  } catch { return []; }
})();

// ② 취향 측정기 — 측정기 N 이 있는데 판정 관측(`*--taste-probe-rN*.md`)이 없으면 미판정
const probes = (() => {
  const ex = join(ROOT, 'products', 'experiments');
  if (!existsSync(ex)) return [];
  const obs = readdirSync(join(ROOT, 'observations'));
  return readdirSync(ex).map((f) => f.match(/^taste-probe(?:-(\d+))?\.html$/)).filter(Boolean)
    .map((m) => ({ n: Number(m[1] ?? 1), file: `products/experiments/${m[0]}` }))
    .filter((p) => !obs.some((o) => new RegExp(`taste-probe-r${p.n}(?!\\d)`).test(o)))
    .map((p) => {
      const first = git(ROOT, ['log', '--diff-filter=A', '--format=%aI', '--', p.file]).split('\n').pop();
      const html = readFileSync(join(ROOT, p.file), 'utf8');
      const items = (html.match(/data-q(?:id)?=["'][^"']+["']/g) ?? []).length;
      return { ...p, since: first || null, items };
    });
})();

// ③ 대상 레포 시안 판정 대기 — 머리에 「판정 대기」 가 있고, 그 항목이나 뒤의 「사용자 판정 (날짜) — …코드…」 절이 답하지 않은 것
function ledgerPending(path) {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const answered = [...text.matchAll(/^#{2,4} .*사용자 판정 \(\d{4}-\d{2}-\d{2}\)(.*)$/gm)].map((m) => m[1]);
  const out = [];
  for (const blk of text.split(/^## /m).slice(1)) {
    const head = blk.split('\n')[0];
    const id = head.match(/^P-(\d{4}-\d{2}-\d{2})-([A-Za-z0-9]+)/);
    if (!id || !/판정 대기/.test(head)) continue;
    if (/사용자 판정 \(\d{4}-\d{2}-\d{2}\)|^\|\s*사용자 말\s*\|\s*["“]/m.test(blk)) continue;
    if (answered.some((a) => new RegExp(`\\b${id[2]}\\b`).test(a))) continue;
    const screen = (blk.match(/^\|\s*화면\s*\|\s*([^|]+)\|/m)?.[1] ?? '').replace(/`[^`]*`|\*\*/g, '').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
    out.push({ id: head.split(/\s+\(/)[0].trim(), date: id[1], code: id[2], screen: screen.slice(0, 60) });
  }
  return out;
}

// ④ 이번 주 작업 — 디자인 표면을 건드린 커밋 (7일)
const DESIGN_PATHS = ['prototypes', 'docs/screens', 'docs/design', 'docs/design-ledger.md', 'docs/UI_GUIDE.md', 'design', 'design-export', 'design-handoff', 'reference/design-system', 'design.config.json',
  ':(glob)**/*.css', ':(glob)**/*.scss'];   // 구현된 화면의 스타일도 디자인 작업이다 (dogu 는 src/**/*.css 로만 일한다 — 0건으로 보이던 것)
function weekWork(r) {
  if (!existsSync(join(r.dir, '.git'))) return null;
  const log = git(r.dir, ['log', r.rev, '--since=7.days', '--format=%ad\t%s', '--date=short', '--', ...DESIGN_PATHS]);
  const lines = log ? [...new Set(log.split('\n'))] : [];
  return { commits: lines.length, recent: lines.slice(0, 4).map((l) => { const [d, s] = l.split('\t'); return { date: d, subject: s.slice(0, 70) }; }) };
}

const repos = REPOS.map((r) => ({ name: r.name, waiting: ledgerPending(r.ledger), week: weekWork(r) }));
const report = { at: new Date().toISOString(), approvals, probes, repos };

if (args.includes('--json')) { process.stdout.write(JSON.stringify(report, null, 2) + '\n'); process.exitCode = 0; }
else if (args.includes('--summary')) {
  const waitN = repos.reduce((a, r) => a + (r.waiting?.length ?? 0), 0);
  const parts = [];
  if (waitN) parts.push(`시안 판정 ${waitN}건`);
  if (probes.length) parts.push(`취향 측정 ${probes.map((p) => `${p.n}회차`).join('·')} 미판정`);
  if (approvals.length) parts.push(`승인 ${approvals.length}건`);
  console.log(parts.length ? `밀린 것 — ${parts.join(' · ')}` : '밀린 것 없음');
} else {
  console.log(`밀린 것 — ${new Date().toLocaleDateString('ko-KR')}\n`);
  console.log(`■ 승인 대기 ${approvals.length}건`);
  for (const a of approvals) console.log(`  #${a.id} (${a.raised}) ${a.title.slice(0, 80)}`);
  console.log(`\n■ 취향 측정기 미판정 ${probes.length}개`);
  for (const p of probes) console.log(`  ${p.n}회차 — ${p.file}${p.since ? ` · ${days(p.since)}일째` : ''}`);
  console.log('\n■ 시안 판정 대기 (대상 레포 원장)');
  for (const r of repos) {
    if (r.waiting === null) { console.log(`  ${r.name} — 원장을 읽지 못했다`); continue; }
    if (!r.waiting.length) { console.log(`  ${r.name} — 없음`); continue; }
    const oldest = r.waiting.reduce((a, b) => (a.date < b.date ? a : b));
    console.log(`  ${r.name} — ${r.waiting.length}건 · 가장 오래된 ${oldest.code} (${oldest.date}, ${days(oldest.date)}일)`);
    for (const w of r.waiting) console.log(`    ${w.id}  ${w.screen}`);
  }
  console.log('\n■ 이번 주 디자인 작업 (7일, 디자인 파일을 건드린 커밋)');
  for (const r of repos) {
    if (!r.week) { console.log(`  ${r.name} — 레포 없음`); continue; }
    console.log(`  ${r.name} — ${r.week.commits}건${r.week.recent.length ? ` · 최근: ${r.week.recent.map((c) => c.subject).join(' / ').slice(0, 140)}` : ''}`);
  }
}
