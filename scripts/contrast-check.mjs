#!/usr/bin/env node
// contrast-check — 토큰 레벨 WCAG 대비 검사.
//
// axe-core/Lighthouse는 실행 중인 페이지가 필요하고 React Native를 못 본다.
// 이 검사기는 **토큰 정의만 정적으로 읽어** 대비 위반 쌍을 뽑으므로
// 브라우저 없이 웹(globals.css :root)과 RN(theme.ts) 을 모두 커버한다.
//
// 불변항 Ⅰ-1 강제용: 본문 4.5:1 / 대형 3:1.
//
// 사용:
//   node scripts/contrast-check.mjs <파일|디렉토리> [--json] [--large]
// 종료 코드: 0 = 통과, 1 = 위반, 2 = 사용법 오류

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve, relative } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.next', 'coverage']);
const EXTS = new Set(['.css', '.scss', '.ts', '.tsx', '.js', '.jsx']);

// 이름 기반 역할 분류 — 토큰 이름이 역할을 말한다는 관례에 기댄다.
const BG_RE = /(^|[-_])(bg|background|surface|panel|canvas|paper|card|sheet|base|ground|overlay|raised|fill|shell)([-_]|$)/i;
const FG_RE = /(^|[-_])(text|ink|fg|foreground|content|label|t1|t2|t3|muted|meta)([-_]|$)/i;
const BRAND_RE = /(^|[-_])(primary|accent|brand|ci|cta|link|danger|success|warning|info|error)([-_]|$)/i;
// 솔리드 채움 후보에서 제외 — 틴트·보더·링은 텍스트를 얹는 면이 아니다.
const NOT_FILL_RE = /(^|[-_])(tint|soft|subtle|light|dim|bg|background|border|line|stroke|divider|rule|ring|focus|outline|shadow|hover|track)([-_]|$)/i;

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function parseColor(v) {
  v = v.trim();
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (m) return [+m[1], +m[2], +m[3]];
  return null;
}

function luminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map((c) => srgb(c / 255));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function ratio(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
    const full = join(dir, name);
    let s; try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) yield* walk(full);
    else if (EXTS.has(extname(name))) yield full;
  }
}

// CSS 커스텀 프로퍼티 + JS/TS 객체 리터럴에서 색 토큰 수집
function collectTokens(file) {
  const text = readFileSync(file, 'utf8');
  const out = [];
  // --name: value;
  for (const m of text.matchAll(/--([a-z0-9-]+)\s*:\s*([^;{}\n]+)/gi)) {
    const rgb = parseColor(m[2]);
    if (rgb) out.push({ name: m[1], value: m[2].trim(), rgb });
  }
  // name: '#hex'  /  name: "#hex"   (theme.ts / RN)
  for (const m of text.matchAll(/([A-Za-z][A-Za-z0-9_]*)\s*:\s*['"`](#[0-9a-fA-F]{3,8}|rgba?\([^'"`)]*\))['"`]/g)) {
    const rgb = parseColor(m[2]);
    if (rgb) out.push({ name: m[1], value: m[2], rgb });
  }
  return out;
}

/**
 * ★ camelCase 를 kebab 으로 정규화한 뒤 역할을 본다 (2026-10-12 수정).
 *
 * 위 세 정규식은 역할어가 `-`·`_`·문자열 경계로 끊길 것을 요구한다.
 * 그런데 **RN 테마는 camelCase 다** — 이 파일 머리말이 "RN theme.ts 를 읽는다"고
 * 적어 놓았는데, `textMuted` 는 `text` 뒤가 `M` 이라 경계에 걸리지 않아 **전경으로 분류되지 않았다.**
 *
 * 실측(2026-10-12): `30days/mobile/.../theme.ts` 에서 전경 토큰이 **1개**로 잡혔다 —
 * `text` 만 걸리고 `textMuted` 가 빠졌다. 전경이 적게 잡히면 전경×배경 쌍이
 * 그만큼 안 만들어지고, **검사는 통과를 출력한다.** 통과가 "덜 쟀다"의 다른 이름이 된다.
 *
 * `ink1`(우리 생성기의 출력)도 같은 이유로 빠졌다.
 * 정규식을 넷 고치는 대신 **이름을 한 번 정규화**한다 — 한 곳이면 어긋나지 않는다.
 */
function kebab(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')   // textMuted → text-Muted
    .replace(/([a-z])(\d)/g, '$1-$2');        // ink1 → ink-1
}

function classify(name) {
  const n = kebab(name);
  const roles = [];
  if (BG_RE.test(n)) roles.push('bg');
  if (FG_RE.test(n)) roles.push('fg');
  if (BRAND_RE.test(n)) roles.push('brand');
  return roles;
}

// 네임스페이스 추론 — 전 토큰을 교차 곱하면 실제로 같이 쓰이지 않는 쌍이 대량 오탐된다.
// (라이트 테마 잉크 × 다크 표면 등)
// 규칙: 첫 세그먼트가 역할어가 아니면 그것이 네임스페이스다. 아니면 global.
//   agent-pill-bg → 'agent'      ink-900-dark → global(ink는 역할어)
//   ci-strong     → global       surface-subtle → global
// 같은 네임스페이스끼리, 또는 global끼리만 짝짓는다.
function namespaceOf(name) {
  const segs = kebab(name).split(/[-_]/);
  if (segs.length < 2) return 'global';
  const head = segs[0];
  if (BG_RE.test(head) || FG_RE.test(head) || BRAND_RE.test(head)) return 'global';
  // 짧은 접두사(n-, c-, ui- 등)는 의미 있는 네임스페이스가 아니라 단순 약어다.
  // 이것을 네임스페이스로 잡으면 --n-bg 와 --ink-1 이 서로 짝지어지지 않아 위반을 놓친다.
  if (head.length <= 2) return 'global';
  return head.toLowerCase();
}

// ─── 실행 ───
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const target = args.find((a) => !a.startsWith('--'));
if (!target) {
  console.error('사용법: node scripts/contrast-check.mjs <파일|디렉토리> [--json]');
  process.exit(2);
}
const root = resolve(target);
if (!existsSync(root)) { console.error(`경로 없음: ${root}`); process.exit(2); }

const files = statSync(root).isDirectory() ? [...walk(root)] : [root];
const tokens = [];
const seen = new Set();
for (const f of files) {
  for (const t of collectTokens(f)) {
    const key = `${t.name}=${t.rgb.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push({ ...t, file: relative(process.cwd(), f), roles: classify(t.name), ns: namespaceOf(t.name) });
  }
}

const bgs = tokens.filter((t) => t.roles.includes('bg'));
const fgs = tokens.filter((t) => t.roles.includes('fg'));
const brands = tokens.filter((t) => t.roles.includes('brand'));
const WHITE = [255, 255, 255], BLACK = [0, 0, 0];

const findings = [];

// 1) 전경 토큰 × 배경 토큰
let skippedCross = 0, skippedSurface = 0;
// 스케일 토큰(ink-100, gray-200 …)의 낮은 단계는 보더·구분선·표면이지 텍스트가 아니다.
// 2:1 미만을 본문 텍스트로 의도하는 디자인 시스템은 없으므로 '표면 쌍'으로 보고 제외한다.
const isScaleStep = (n) => /[-_]\d{2,3}$/.test(n);
for (const fg of fgs) for (const bg of bgs) {
  if (fg.ns !== bg.ns) { skippedCross++; continue; }  // 교차 네임스페이스는 실사용 쌍이 아니다
  const r0 = ratio(fg.rgb, bg.rgb);
  if (r0 < 2 && isScaleStep(fg.name)) { skippedSurface++; continue; }
  const r = r0;
  if (r < 4.5) {
    findings.push({
      kind: 'fg-on-bg', severity: r < 3 ? 'block' : 'warn',
      pair: `${fg.name} on ${bg.name}`, ratio: +r.toFixed(2),
      need: 4.5, note: r >= 3 ? '대형 텍스트(AA-large 3:1)로만 사용 가능' : 'AA-large도 미달',
      values: `${fg.value} / ${bg.value}`,
    });
  }
}

// 2) 브랜드 솔리드 채움 위의 텍스트 (Seemilar --ci 사례)
//    흰/검정 중 '좋은 쪽'만 보면 안 된다 — 브랜드 채움의 기본 의도는 흰 텍스트이고,
//    검정이 통과한다는 사실이 흰 텍스트 실패를 가려준다.
for (const b of brands) {
  if (NOT_FILL_RE.test(b.name)) continue;          // 틴트·보더 등은 채움면이 아니다
  if (/rgba?\([^)]*,\s*0?\.\d+\s*\)/.test(b.value)) continue;  // 알파 있는 값은 채움면으로 보지 않는다
  const rw = ratio(WHITE, b.rgb), rb = ratio(BLACK, b.rgb);
  if (rw < 4.5) {
    const blackOk = rb >= 4.5;
    findings.push({
      kind: 'solid-fill', severity: rw < 3 && !blackOk ? 'block' : 'warn',
      pair: `${b.name} 솔리드 채움 + 흰 텍스트`,
      ratio: +rw.toFixed(2), need: 4.5,
      note: blackOk
        ? `흰 텍스트 본문 불가. 검정 텍스트는 ${rb.toFixed(2)}:1로 통과하나 브랜드 채움에는 부적합한 경우가 많다 → ` +
          '더 진한 강조 변형(예: -strong)을 따로 두고, 이 토큰은 accent·보더·포커스링·틴트 배경에만 쓴다'
        : `흰 ${rw.toFixed(2)}:1 / 검정 ${rb.toFixed(2)}:1 — 어느 쪽도 본문 대비 미달. 명도 재설계 필요`,
      values: b.value,
    });
  }
}

// 3) 브랜드 솔리드 채움 위에 올릴 수 있는 텍스트 색이 하나라도 있는가.
//    초판은 '모든 전경 토큰 × 모든 채움'을 곱해서 실제로 쓰이지 않는 조합을 대량 오탐했다
//    (어두운 잉크를 어두운 채움 위에 올리는 일은 없다).
//    올바른 질문은 "이 채움 위에 본문을 올릴 수 있는가"이고, 답이 '아니오'일 때만 차단이다.
//    의도한 색(흰 텍스트)의 실패는 검사 2가 이미 잡는다.
for (const b of brands) {
  if (NOT_FILL_RE.test(b.name)) continue;
  if (/rgba?\([^)]*,\s*0?\.\d+\s*\)/.test(b.value)) continue;
  const candidates = [
    { name: '흰색', rgb: WHITE }, { name: '검정', rgb: BLACK },
    ...fgs.filter((f) => f.ns === b.ns).map((f) => ({ name: f.name, rgb: f.rgb })),
  ];
  const viable = candidates.filter((c) => ratio(c.rgb, b.rgb) >= 4.5);
  if (!viable.length) {
    const best = candidates.map((c) => ({ n: c.name, r: ratio(c.rgb, b.rgb) }))
      .sort((x, y) => y.r - x.r)[0];
    findings.push({
      kind: 'unusable-fill', severity: 'block',
      pair: `${b.name} 솔리드 채움 — 올릴 수 있는 본문 색이 없음`,
      ratio: +best.r.toFixed(2), need: 4.5,
      note: `최선이 ${best.n} ${best.r.toFixed(2)}:1. 이 채움은 본문을 올릴 수 없다 — 명도를 재설계할 것`,
      values: b.value,
    });
  }
}

findings.sort((a, b) => a.ratio - b.ratio);

if (asJson) {
  console.log(JSON.stringify({ root, tokens: tokens.length, bgs: bgs.length, fgs: fgs.length, brands: brands.length, findings }, null, 2));
} else {
  console.log(`[contrast-check] 색 토큰 ${tokens.length}개 (배경 ${bgs.length} / 전경 ${fgs.length} / 브랜드 ${brands.length}) — ${root}`);
  console.log(`  네임스페이스: ${[...new Set(tokens.map((t) => t.ns))].join(', ')}`);
  console.log(`  제외: 교차 네임스페이스 ${skippedCross}쌍 · 표면으로 판정된 스케일 단계 ${skippedSurface}쌍`);
  if (!tokens.length) console.log('  색 토큰을 찾지 못했다. :root 커스텀 프로퍼티나 theme 객체가 있는 경로를 지정할 것.');
  if (!findings.length) console.log('\n통과 — 대비 위반 없음.');
  else {
    for (const f of findings) {
      console.log(`\n${f.severity === 'block' ? '❌' : '⚠️ '} ${f.pair}  ${f.ratio}:1 (필요 ${f.need}:1)`);
      console.log(`     ${f.values}`);
      console.log(`     → ${f.note}`);
    }
    console.log(`\n총 ${findings.length}건 (차단 ${findings.filter((f) => f.severity === 'block').length}). 불변항 Ⅰ-1.`);
  }
}
process.exit(findings.some((f) => f.severity === 'block') ? 1 : 0);
