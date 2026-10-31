#!/usr/bin/env node
// gate — 검사를 돌리고 **영수증**을 남긴다.
//
// 이 레포의 규칙 중 하나는 "재지 않은 숫자를 말하지 않는다" 인데,
// 그 규칙에는 지금까지 **뒤에 아무것도 없었다** — 모델은 대비비를 재는 것과
// 같은 비용으로 타이핑할 수 있고, 하류의 누구도 둘을 구분하지 못한다.
//
// 이 래퍼가 그 자리를 닫는다. 검사를 돌리고 한 줄의 JSON 을 남긴다 —
// 어떤 검사를 / 어떤 파일에 / **측정 그 순간의 SHA-256** 과 함께 /
// 종료코드 / 검사가 출력한 숫자 / 언제.
//
// ★ 해시가 핵심이다. 영수증은 파일이 같은 해시일 때만 증거다.
// 파일을 고치면 영수증은 **만료**되고, 그 순간이 바로 기억된 숫자가 거짓이 되는
// 순간이다. 그래서 Stop hook 은 "검사를 돌렸나"가 아니라
// **"지금 이 내용을 재 봤나"** 를 묻는다.
//
// 사용:
//   node scripts/gate.mjs slop-scan prototypes --mode tool
//   node scripts/gate.mjs contrast-check prototypes/tokens.css
//   node scripts/gate.mjs validate-screen docs/screens/
//   node scripts/gate.mjs --check <파일>     살아 있는 영수증이 있나 (없으면 exit 1)
//   node scripts/gate.mjs --list             이 세션의 영수증
//   node scripts/gate.mjs --dir              영수증 디렉터리
//
// 종료코드는 **검사 자신의 것**을 그대로 돌려준다. 래퍼가 판정을 바꾸지 않는다.

import { spawnSync } from 'node:child_process';
import { statSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
// 영수증의 정의는 `hooks/_ledger.mjs` 한 곳에 있다 — 이 파일은 CLI 다.
import { dataDir, hashFile, writeReceipt, readReceipts, liveReceiptsFor } from '../hooks/_ledger.mjs';

// R-1 — 스크립트는 cwd 가 아니라 자기 위치에서 ROOT 를 구한다.
const ROOT = fileURLToPath(new URL('..', import.meta.url));

// 영수증을 남길 수 있는 검사. 손으로 아무 스크립트나 넘기지 못하게 한다 —
// 영수증이 "뭔가 돌았다"의 증거가 되면 영수증 자체가 의미를 잃는다.
const GATES = {
  'slop-scan': 'slop-scan.mjs',
  'contrast-check': 'contrast-check.mjs',
  'validate-screen': 'validate-screen.mjs',
  'measure-render': 'measure-render.mjs',
};

// 플래그가 **값을 받는** 것들. 그 값은 측정 대상이 아니다.
// `--target <레포>` 를 대상으로 오해하면 그 레포 전체를 순회해 영수증에 담는다.
const FLAGS_WITH_VALUE = new Set(['--mode', '--target', '--widths', '--min-samples', '--url', '--routes', '--shots', '--inject']);

const MEASURABLE = new Set(['.html', '.htm', '.css', '.scss', '.ts', '.tsx', '.js', '.jsx', '.md']);

/**
 * 검사가 출력한 숫자. 얕게 긁는 것이 의도다 —
 * 각 검사의 서식을 스키마로 파싱하면 그 스키마가 먼저 썩는다.
 * 목적은 "화면에 무엇이 떠 있었나"를 남겨 나중의 주장과 맞춰 보는 것뿐이다.
 */
function measured(out) {
  const v = [];
  for (const m of out.matchAll(/(\d+(?:\.\d+)?)\s*:\s*1\b/g)) v.push(`${m[1]}:1`);
  for (const m of out.matchAll(/(\d+)\s*(?:건|개|종)\s*(검사|위반|차단|경고|고유값)?/g))
    v.push(`${m[1]}${m[0].includes('건') ? '건' : m[0].includes('개') ? '개' : '종'}${m[2] ? ' ' + m[2] : ''}`);
  for (const m of out.matchAll(/\b(❌|⚠️)\s*([A-Z]\d+)/g)) v.push(`${m[1]}${m[2]}`);
  return [...new Set(v)].slice(0, 24);
}

/** 인자에서 실제로 측정된 파일을 전개한다. 디렉터리를 받으면 안을 펼친다. */
function targetsFrom(args) {
  const out = [];
  // 값을 받는 플래그의 **다음 인자**는 건너뛴다 (실측 전 수정:
  // `--target ../control_tower` 가 대상으로 잡혀 그 레포를 전부 순회했다).
  const skip = new Set();
  args.forEach((a, i) => { if (FLAGS_WITH_VALUE.has(a)) skip.add(i + 1); });
  const walk = (p) => {
    let s; try { s = statSync(p); } catch { return; }
    if (s.isDirectory()) {
      for (const n of readdirSync(p)) {
        if (n.startsWith('.') || n === 'node_modules') continue;
        walk(join(p, n));
      }
    } else if (MEASURABLE.has(extname(p))) out.push(p);
  };
  args.forEach((a, i) => { if (!a.startsWith('-') && !skip.has(i)) walk(a); });
  return [...new Set(out)];
}

// ─── CLI ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (!argv.length) {
  console.error('사용: node scripts/gate.mjs <slop-scan|contrast-check|validate-screen> <인자…>');
  console.error('      node scripts/gate.mjs --check <파일> | --list | --dir');
  process.exit(2);
}

if (argv[0] === '--dir') { console.log(dataDir()); process.exit(0); }

if (argv[0] === '--list') {
  const rs = readReceipts();
  if (!rs.length) { console.log('영수증 0건 — 이 세션에서 측정한 것이 없다.'); process.exit(0); }
  for (const r of rs) {
    const live = (r.targets ?? []).filter((t) => hashFile(t.path) === t.sha256).length;
    console.log(`${r.at}  ${r.gate.padEnd(16)} exit=${r.exit}  대상 ${r.targets.length}건 (살아 있음 ${live})`
      + (r.values?.length ? `  [${r.values.slice(0, 5).join(' ')}]` : ''));
  }
  process.exit(0);
}

if (argv[0] === '--check') {
  const f = argv[1];
  if (!f) { console.error('--check 에는 파일이 필요하다'); process.exit(2); }
  const live = liveReceiptsFor(f);
  if (live.length) {
    console.log(`✅ ${relative(process.cwd(), f) || f} — 살아 있는 영수증 ${live.length}건 `
      + `(${live.map((r) => r.gate).join(', ')})`);
    process.exit(0);
  }
  console.error(`❌ ${relative(process.cwd(), f) || f} — 살아 있는 영수증이 없다.\n`
    + `   재지 않았거나, 재고 나서 고쳤다. 둘 다 "지금 이 내용은 미측정" 이다.`);
  process.exit(1);
}

const name = argv[0];
if (!GATES[name]) {
  console.error(`gate: ${name} 은 영수증을 남기는 검사가 아니다. 가능한 것: ${Object.keys(GATES).join(' · ')}`);
  process.exit(2);
}

const rest = argv.slice(1);
const script = join(ROOT, 'scripts', GATES[name]);
const r = spawnSync('node', [script, ...rest], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const out = (r.stdout || '') + (r.stderr || '');
process.stdout.write(out);

const exit = r.status ?? 1;
const files = targetsFrom(rest);

// ★ `measure-render --url` 은 **떠 있는 화면**을 잰다 — 인자에 파일이 없다 (2026-10-12 실측).
// control_tower 검수에서 영수증에는 상태 주입 파일(`render-states/*.js`)의 해시만 남았고,
// 실제로 렌더된 `*.module.css` 는 영수증에 없었다. 그래서 잰 직후에도 Stop 이 그 CSS 를
// 미측정으로 보고, 반대로 CSS 를 고쳐도 영수증이 만료되지 않는다.
// 렌더 원천을 `design.config.json` 의 `paths.source` 에서 읽고, 없으면 토큰 파일의
// 두 단계 위(`…/renderer/styles/tokens.css` → `…/renderer`)로 **추정한다고 말한다.**
if (name === 'measure-render' && rest.includes('--url')) {
  const ti = rest.indexOf('--target');
  const tdir = ti >= 0 ? rest[ti + 1] : process.cwd();
  let conf = {};
  try { conf = JSON.parse(readFileSync(join(tdir, 'design.config.json'), 'utf8')); } catch { /* 설정 없음 */ }
  const src = conf.paths?.source
    ? { dir: join(tdir, conf.paths.source), from: 'paths.source' }
    : conf.paths?.tokens ? { dir: join(tdir, conf.paths.tokens, '..', '..'), from: 'paths.tokens 두 단계 위 (추정 — paths.source 를 적으면 정확해진다)' } : null;
  if (src) {
    const styles = [];
    const walk = (p) => {
      let st; try { st = statSync(p); } catch { return; }
      if (st.isDirectory()) { for (const n of readdirSync(p)) if (!n.startsWith('.') && n !== 'node_modules') walk(join(p, n)); }
      else if (['.css', '.scss'].includes(extname(p))) styles.push(p);
    };
    walk(src.dir);
    files.push(...styles);
    console.error(`gate: 렌더 원천 스타일 ${styles.length}개를 영수증에 담는다 — ${relative(process.cwd(), src.dir) || '.'} (${src.from})`);
  } else {
    console.error('gate: --url 측정인데 렌더 원천을 모른다 — design.config.json 에 paths.source 를 적으면 스타일 파일이 영수증에 담긴다');
  }
}
// ★ **재지 못한 측정에는 영수증을 쓰지 않는다** (2026-10-12 — 코드 읽기로 발견).
// `measure-render` 는 playwright 가 없거나 렌더가 비면 「미측정」을 말하고 exit 0 으로 통과한다(D-18).
// 그 출력에 영수증을 남기면 **재지 않은 파일이 잰 것으로 기록되고 Stop 이 통과한다** — 이 래퍼가
// 막으려는 바로 그 거짓이다. exit 0 은 「위반 없음」이지 「쟀다」가 아니다.
if ((name === 'measure-render' || name === 'contrast-check') && /\*\*미측정\*\*|"measured":\s*false/.test(out)) {
  console.error(`gate: ${name} 가 재지 못했다(미측정) — 영수증을 남기지 않는다.`);
  process.exit(exit);
}
if (!files.length) {
  // 측정 대상이 0건이면 영수증을 쓰지 않는다. 대상 없는 영수증은
  // 만료되지 않으므로, 한 번 쓰면 그 세션의 Stop 을 영구히 통과시킨다.
  console.error(`gate: ${name} 이 측정한 파일이 0건이라 영수증을 남기지 않았다.`);
  process.exit(exit);
}
// 장치 버전을 함께 적는다 — 해시는 "내용이 그대로인가"만 보증하고
// "어느 버전이 그 숫자를 냈나"는 보증하지 않는다.
let device = null;
try { device = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8')).version; } catch { /* 버전 없이도 영수증은 유효하다 */ }
writeReceipt({ gate: name, args: rest, exit, files, values: measured(out), device });
process.exitCode = exit;   // exit() 는 파이프 출력을 64KB 에서 자른다 (2026-10-30)
