#!/usr/bin/env node
// sync-kit — design-kit 을 소비 레포로 이식하고 출처를 각인한다.
//
// 이식은 '한 번 복사하고 잊는 것'이 아니라 재현 가능한 연산이어야 한다.
// 버전 각인이 없으면 사본이 언제 것인지 알 수 없고, 정본이 바뀌어도 조용히 갈라진다.
//
// 이식 대상은 **키트뿐**이다 — 검사기와 판정 근거 문서.
// UI_GUIDE.md 와 tokens.css 는 제품 고유 자산이라 빌드 중 정당하게 진화하므로
// 여기서 건드리지 않는다. 덮어쓰면 '조용한 덮어쓰기 금지' 원칙을 깬다.
//
// 사용:
//   node scripts/sync-kit.mjs <대상 레포 경로>            이식 + 각인
//   node scripts/sync-kit.mjs <대상 레포 경로> --check     드리프트만 보고 (쓰지 않음)
// 종료 코드: 0 = 최신, 1 = 드리프트 있음, 2 = 사용법 오류

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';

const KIT = [
  'scripts/slop-scan.mjs',
  'scripts/contrast-check.mjs',
  'system/anti-patterns.md',
  'system/invariants.md',
  'system/decision-logic.md',
  'system/taxonomy.md',
  'system/rubrics/critic-axes.md',
];
// signals/ 는 전량 이식한다 — 승격된 신호는 전 제품 공통 지식이다.
const SIGNAL_DIR = 'signals';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const target = args.find((a) => !a.startsWith('--'));
if (!target) {
  console.error('사용법: node scripts/sync-kit.mjs <대상 레포 경로> [--check]');
  process.exit(2);
}
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DEST = resolve(target);
if (!existsSync(DEST)) { console.error(`대상 없음: ${DEST}`); process.exit(2); }

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12);
const git = (...a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim(); }
                        catch { return null; } };

// signals/ 열거
const { readdirSync } = await import('node:fs');
const signals = existsSync(join(ROOT, SIGNAL_DIR))
  ? readdirSync(join(ROOT, SIGNAL_DIR)).filter((f) => f.endsWith('.md')).map((f) => `${SIGNAL_DIR}/${f}`)
  : [];
const files = [...KIT, ...signals].filter((f) => existsSync(join(ROOT, f)));

const commit = git('rev-parse', '--short', 'HEAD');
const commitDate = git('log', '-1', '--format=%cI');
const dirty = git('status', '--porcelain') ? true : false;

const manifestPath = join(DEST, 'design-kit', 'VERSION.json');
const prev = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;

const drift = [];
for (const f of files) {
  const srcHash = sha(join(ROOT, f));
  const dstPath = join(DEST, 'design-kit', f);
  const dstHash = existsSync(dstPath) ? sha(dstPath) : null;
  if (dstHash !== srcHash) drift.push({ file: f, from: dstHash ?? '(없음)', to: srcHash });
}
// 사본에만 있고 정본에 없는 파일 (정본에서 삭제된 것)
const stale = prev ? Object.keys(prev.files || {}).filter((f) => !files.includes(f)) : [];

if (checkOnly) {
  console.log(`[sync-kit] 정본 ${commit}${dirty ? ' (커밋 안 된 변경 있음)' : ''} → ${DEST}`);
  console.log(`  사본 기준: ${prev ? `${prev.commit} · ${prev.syncedFrom}` : '(각인 없음 — 언제 것인지 알 수 없다)'}`);
  if (!drift.length && !stale.length) { console.log('\n최신 — 갱신할 것 없음.'); process.exit(0); }
  console.log(`\n드리프트 ${drift.length + stale.length}건:`);
  drift.forEach((d) => console.log(`  ~ ${d.file}`));
  stale.forEach((f) => console.log(`  - ${f}  (정본에서 삭제됨)`));
  console.log(`\n갱신: node scripts/sync-kit.mjs ${target}`);
  process.exit(1);
}

if (dirty) console.warn('[sync-kit] 경고: design 레포에 커밋 안 된 변경이 있다. 각인이 정확하지 않을 수 있다.');

for (const f of files) {
  const dst = join(DEST, 'design-kit', f);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(join(ROOT, f), dst);
}
const manifest = {
  syncedFrom: 'github.com/jongseonglee99/design',
  commit, commitDate, dirty,
  note: '이 디렉토리는 사본이다. 정본은 design 레포이며 직접 수정하지 마라. 갱신은 sync-kit 으로 한다.',
  files: Object.fromEntries(files.map((f) => [f, sha(join(ROOT, f))])),
};
mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`[sync-kit] ${files.length}개 파일 이식 → ${DEST}/design-kit`);
console.log(`  정본 ${commit} (${commitDate})`);
if (drift.length) drift.forEach((d) => console.log(`  ~ ${d.file}`));
else console.log('  변경 없음 (각인만 갱신)');
if (stale.length) console.log(`  정본에서 삭제된 파일 ${stale.length}개는 수동 정리 필요: ${stale.join(', ')}`);
