#!/usr/bin/env node
// emit-tokens — 토큰 **정본 하나**에서 스택별 출력을 만든다 (승인 `#42 B`).
//
// ★ 정본은 CSS `:root` 다. 다른 형식은 **생성물**이다.
// PRD 가 이미 그렇게 정했다 — *"정본 하나, 프레임워크별 출력은 생성물"*.
// 그래서 이 스크립트는 승인 `#16`(DTCG)·`#14`(oklch)를 건드리지 않는다.
// 정본을 DTCG 로 **올릴 때만** 그 미결이 열린다.
//
// ─── 왜 둘뿐인가 — 레포 11개 전수 조사 (2026-10-12) ─────────────────────────
//   웹   8개  Next/Vite + React + Tailwind · 정본 `globals.css` `:root`
//   앱   1개  Expo RN (`30days/mobile`) · `theme.ts` · CSS 가 **아예 없다**
//   HTML 2~3개 아트보드 그 자체
// **22종이 아니라 2종이다.** `uupm` 이 22스택을 갖고 있지만 우리가 실제로 만나는 모양은 둘이고,
// 2종을 만드는 것은 22종을 추측하는 것과 전혀 다른 일이다.
//
// 그리고 **검사하는 쪽은 이미 둘을 읽는다** — `contrast-check` 가 웹 CSS 와 RN `theme.ts` 를
// 모두 파싱한다(`30days/mobile` 테마에서 실제 위반 3건을 찾았다). 생성 쪽만 웹 전용이었다.
//
// 사용:
//   node scripts/emit-tokens.mjs --detect [--target <레포>]      스택과 토큰 정본 위치만 보고
//   node scripts/emit-tokens.mjs <tokens.css> --stack rn [--out <경로>]
//   node scripts/emit-tokens.mjs <tokens.css> --stack web        그대로 (정본이 이미 그 형식이다)
//   node scripts/emit-tokens.mjs <theme.ts> --from rn [--out prototypes/tokens.css]
//       **반대 방향** — RN 레포는 theme.ts 가 정본이다. 아트보드용 CSS 를 손으로 베끼지 않고 생성한다
//       (2026-10-12 섀도 런: 30days 세션이 theme.ts 를 손으로 옮긴 「거울」을 만들었다 — #35 와 같은 드리프트원)
// 종료코드: 0 = 성공 · 1 = 지원하지 않는 스택(기록만) · 2 = 사용법

import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve, relative, basename } from 'node:path';

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const target = resolve(flag('--target', process.cwd()));

// ─── 스택 감지 ──────────────────────────────────────────────────────────────
// ★ **절대 가정하지 않는다.** 감지되지 않으면 `unknown` 을 돌려준다.
// 하드코딩된 기본값은 모든 추천을 조용히 오라우팅한다 — `D-6`(모드 미해결 시 건너뛴다)과 같은 규칙이다.
export function detectStack(dir) {
  const read = (f) => { try { return readFileSync(join(dir, f), 'utf8'); } catch { return null; } };
  const pkgRaw = read('package.json');
  if (pkgRaw) {
    let dep = {};
    try { const p = JSON.parse(pkgRaw); dep = { ...p.dependencies, ...p.devDependencies }; } catch { /* 깨진 package.json */ }
    const has = (k) => k in dep;
    // 앱이 먼저다 — expo 레포도 react 를 갖고 있으므로 순서가 판정을 정한다.
    if (has('expo') || has('react-native')) return { stack: 'expo-rn', family: 'rn' };
    if (has('next')) return { stack: 'nextjs', family: 'web' };
    if (has('nuxt')) return { stack: 'nuxt', family: 'web' };
    if (has('@angular/core')) return { stack: 'angular', family: 'web' };
    if (has('astro')) return { stack: 'astro', family: 'web' };
    if (has('svelte')) return { stack: 'svelte', family: 'web' };
    if (has('vue')) return { stack: 'vue', family: 'web' };
    if (has('vite') && has('react')) return { stack: 'vite-react', family: 'web' };
    if (has('react')) return { stack: 'react', family: 'web' };
    return { stack: 'node', family: 'unknown' };
  }
  if (read('pubspec.yaml')) return { stack: 'flutter', family: 'unknown' };
  if (read('Package.swift')) return { stack: 'swiftui', family: 'unknown' };
  try { if (readdirSync(dir).some((n) => n.endsWith('.xcodeproj'))) return { stack: 'swiftui', family: 'unknown' }; } catch { /* 읽을 수 없는 디렉터리 */ }
  if (read('composer.json')) return { stack: 'laravel', family: 'web' };
  try { if (readdirSync(dir).some((n) => /\.html?$/i.test(n))) return { stack: 'html', family: 'web' }; } catch { /* 같음 */ }
  return { stack: 'unknown', family: 'unknown' };
}

/** 그 스택의 토큰 정본이 어디 있나 — 실재하는 것만 돌려준다. */
export function findTokenCanon(dir, family) {
  const CAND = family === 'rn'
    ? ['src/shared/constants/theme.ts', 'src/constants/theme.ts', 'src/theme.ts', 'theme.ts']
    : ['src/app/globals.css', 'src/styles/globals.css', 'app/globals.css',
       'src/index.css', 'styles/globals.css', 'globals.css'];
  return CAND.filter((c) => existsSync(join(dir, c)));
}

// ─── CSS :root 파싱 ────────────────────────────────────────────────────────
function parseRoot(css) {
  const tokens = new Map();
  // `:root` 블록만 본다. 중괄호 짝을 세어 `@media { :root { … } }` 중첩을 넘긴다.
  const SEL = /:root[^{]*\{/g;
  for (let m; (m = SEL.exec(css));) {
    let depth = 1, i = SEL.lastIndex;
    const start = i;
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
      i++;
    }
    const body = css.slice(start, i - 1);
    for (const d of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      // 뒤에 선언된 것이 이긴다 — CSS 와 같은 규칙이고, 다크 블록이 라이트를 덮는다.
      tokens.set(d[1].toLowerCase(), d[2].trim());
    }
  }
  return tokens;
}

/** `var(--x)` 를 끝까지 푼다. 순환은 원문으로 둔다. */
function resolveVar(v, tokens, depth = 0) {
  const m = String(v).trim().match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,([^)]*))?\)$/i);
  if (!m || depth > 5) return String(v).trim();
  const next = tokens.get(m[1].toLowerCase());
  if (next === undefined) return (m[2] ?? String(v)).trim();
  return resolveVar(next, tokens, depth + 1);
}

// ─── RN 출력 ────────────────────────────────────────────────────────────────
const camel = (n) => n.replace(/^--/, '').replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const isColor = (v) => /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\()/i.test(v);
const num = (v) => {
  const m = String(v).match(/^(-?[\d.]+)(px|rem|em|ms|s)?$/i);
  if (!m) return null;
  let n = Number(m[1]);
  if (m[2]?.toLowerCase() === 'rem' || m[2]?.toLowerCase() === 'em') n *= 16;  // RN 은 rem 이 없다
  if (m[2]?.toLowerCase() === 's') n *= 1000;
  return n;
};

function emitRN(tokens, srcName, deviceVersion) {
  const groups = { colors: [], spacing: [], fontSize: [], radius: [], motion: [], fonts: [], other: [] };
  const notes = [];
  for (const [name, raw] of tokens) {
    const v = resolveVar(raw, tokens);
    const key = camel(name);
    if (isColor(v)) {
      if (/^oklch\(/i.test(v)) { notes.push(`${name}: oklch() 는 RN 이 못 읽는다 — hex 로 변환이 필요하다`); continue; }
      groups.colors.push([key, `'${v}'`]);
    } else if (/^--font-/.test(name)) {
      // RN 의 fontFamily 는 **스택이 아니라 한 패밀리**다. 첫 패밀리만 쓰고 그 사실을 적는다.
      const first = v.split(',')[0].trim().replace(/['"]/g, '');
      groups.fonts.push([key, `'${first}'`]);
      if (v.includes(',')) notes.push(`${name}: RN 은 폰트 스택을 모른다 — '${first}' 만 남겼다 (폴백은 네이티브 설정)`);
    } else if (/^--(s|space)-/.test(name) && num(v) !== null) {
      groups.spacing.push([key, String(num(v))]);
    } else if (/^--t-/.test(name) && num(v) !== null) {
      groups.fontSize.push([key, String(num(v))]);
    } else if (/^--r(adius)?-/.test(name) && num(v) !== null) {
      groups.radius.push([key, String(num(v))]);
    } else if (/^--(m|motion)-/.test(name) && num(v) !== null) {
      groups.motion.push([key, String(num(v))]);
    } else if (/^--ease/.test(name)) {
      notes.push(`${name}: cubic-bezier 는 RN Animated 의 Easing.bezier(...) 로 옮긴다 — 자동 변환하지 않는다`);
    } else if (num(v) !== null) {
      groups.other.push([key, String(num(v))]);
    } else {
      notes.push(`${name}: ${v} — 자동 변환 대상이 아니다 (사람이 판단)`);
    }
  }

  const block = (label, pairs) => {
    if (!pairs.length) return '';
    const body = pairs.map(([k, v]) => `  ${k}: ${v},`).join('\n');
    return `export const ${label} = {\n${body}\n} as const;\n\n`;
  };

  let out = `// 생성물 — 손으로 고치지 않는다.\n`
    + `// 정본: ${srcName} 의 :root\n`
    + `// 생성: design-device ${deviceVersion ?? '?'} · ${new Date().toISOString().slice(0, 10)}\n`
    + `//       node <장치경로>/scripts/emit-tokens.mjs ${srcName} --stack rn\n`
    + `//\n`
    + `// 고칠 것이 있으면 **정본을 고치고 다시 생성한다.** 여기서 고치면\n`
    + `// 다음 생성에서 지워지고, 그 사이에 정본과 갈린다 (D-1 — 사본이 드리프트를 만든다).\n`
    + `//\n// RN 의 제약으로 그대로 옮기지 못한 것:\n`;
  out += (notes.length ? notes.map((n) => `//   · ${n}`).join('\n') : '//   없음') + '\n\n';
  // ★ 빈 그룹은 `export` 하지 않는다. 그런데 초판은 `theme` 에서 그것을 **그대로 참조**해서
  // 비어 있는 그룹이 하나라도 있으면 **컴파일되지 않는 파일**이 나왔다
  // (실측: `tokens-low.css` 는 반경 토큰 이름이 달라 `radius` 가 0개였다).
  // 생성물이 타입 검사를 통과하지 못하면 그건 생성이 아니라 고장이다.
  const ORDER = [['colors', groups.colors], ['spacing', groups.spacing],
    ['fontSize', groups.fontSize], ['radius', groups.radius], ['motion', groups.motion],
    ['fonts', groups.fonts], ['misc', groups.other]];
  const present = ORDER.filter(([, v]) => v.length);
  for (const [label, pairs] of present) out += block(label, pairs);
  out += `export const theme = { ${present.map(([l]) => l).join(', ')} } as const;\n`;
  return { code: out, notes, counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])) };
}

// ─── CLI ────────────────────────────────────────────────────────────────────
if (argv.includes('--detect')) {
  const d = detectStack(target);
  const canon = findTokenCanon(target, d.family);
  console.log(`[emit-tokens] ${relative(process.cwd(), target) || '.'}`);
  console.log(`  스택      ${d.stack}  (계열 ${d.family})`);
  console.log(`  토큰 정본  ${canon.length ? canon.join(' · ') : '없음 — /design 이 만든다'}`);
  console.log(`  출력 형식  ${d.family === 'rn' ? 'theme.ts (RN 객체)'
    : d.family === 'web' ? 'CSS 커스텀 프로퍼티 (정본이 이미 그 형식)'
    : '**미지원** — 기록만 한다. 토큰을 손으로 옮긴다'}`);
  if (d.family === 'unknown') {
    console.log(`\n  ⚠ 이 스택은 생성 대상이 아니다. 감지된 사실은 design.config.json 에 적고,`);
    console.log(`    추측으로 형식을 만들지 않는다 — 두 번째 사례가 생길 때 측정으로 정한다.`);
  }
  console.log(`\n  design.config.json 에: "stack": "${d.stack}"`);
  process.exit(0);
}

const src = argv.find((a) => !a.startsWith('--') && a !== flag('--stack') && a !== flag('--out') && a !== flag('--target') && a !== flag('--from'));

// ─── 반대 방향: theme.ts → CSS :root (아트보드용 생성물) ───
// `export const <묶음> = { 키: 값, … }` 의 평평한 묶음만 읽는다. 중첩·계산식은 옮기지 않고 **옮기지 못했다고 말한다.**
// 이름: colors 는 `--<키>`(kebab), 나머지는 `--<묶음>-<키>`. 숫자는 RN 의 dp 를 px 로 본다.
if (flag('--from') === 'rn') {
  if (!src || !existsSync(src)) { console.error('사용법: node scripts/emit-tokens.mjs <theme.ts> --from rn [--out <경로>]'); process.exit(2); }
  const ts = readFileSync(src, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const lines = [], skipped = [];
  for (const g of ts.matchAll(/export\s+const\s+(\w+)\s*(?::[^=]+)?=\s*\{([^{}]*)\}/g)) {
    const [, group, body] = g;
    for (const raw of body.split('\n')) {
      const line = raw.replace(/\/\/.*$/, '').trim().replace(/,$/, '');
      if (!line) continue;
      const m = line.match(/^['"]?(\w+)['"]?\s*:\s*(.+?)(?:\s+as\s+const)?$/);
      if (!m) { skipped.push(`${group}: ${line.slice(0, 40)}`); continue; }
      const [, key, v0] = m;
      const name = group === 'colors' ? `--${kebab(key)}` : `--${kebab(group)}-${kebab(key)}`;
      let v = v0.trim();
      if (/^['"].*['"]$/.test(v)) {
        v = v.slice(1, -1);
        if (/^(fontFamily|fonts?)$/i.test(group)) v = `"${v}"`;
      } else if (/^-?\d+(\.\d+)?$/.test(v)) {
        v = /weight/i.test(group) ? v : `${v}px`;
      } else { skipped.push(`${group}.${key} = ${v.slice(0, 30)}`); continue; }
      lines.push(`  ${name}: ${v};`);
    }
  }
  if (!lines.length) { console.error(`[emit-tokens] ${src} 에서 평평한 \`export const X = { … }\` 묶음을 찾지 못했다`); process.exit(2); }
  const rel = relative(process.cwd(), resolve(src)) || src;
  const code = `/* 생성물 — 고치지 않는다. 정본은 ${rel} 다.\n`
    + ` * 다시 만들기: node <장치경로>/scripts/emit-tokens.mjs ${rel} --from rn --out <이 파일>\n`
    + ` * 아트보드 전용 값이 필요하면 **다른 파일**(예: prototypes/board.css)에 둔다 — 여기 덧붙이면 다음 생성에서 지워진다.\n */\n`
    + `:root {\n${lines.join('\n')}\n}\n`;
  const out = flag('--out');
  if (out) { writeFileSync(out, code); console.log(`[emit-tokens] ${out} — theme.ts → CSS 변수 ${lines.length}개`); }
  else process.stdout.write(code);
  if (skipped.length) { console.error('  옮기지 못한 것 (계산식·중첩):'); for (const x of skipped) console.error(`    · ${x}`); }
  process.exit(0);
}
const stackArg = flag('--stack');
if (!src || !stackArg) {
  console.error('사용법: node scripts/emit-tokens.mjs <tokens.css> --stack web|rn [--out <경로>]');
  console.error('        node scripts/emit-tokens.mjs --detect [--target <레포>]');
  process.exit(2);
}
if (!existsSync(src)) { console.error(`파일 없음: ${src}`); process.exit(2); }

const family = ['rn', 'expo-rn'].includes(stackArg) ? 'rn'
  : ['web', 'nextjs', 'nuxt', 'vue', 'svelte', 'astro', 'react', 'vite-react', 'angular', 'laravel', 'html'].includes(stackArg) ? 'web'
  : 'unknown';

if (family === 'unknown') {
  console.error(`[emit-tokens] ${stackArg} 는 **생성 대상이 아니다.**\n`
    + `  지원: web 계열(CSS 커스텀 프로퍼티) · rn(theme.ts)\n`
    + `  레포 11개 전수 조사에서 실제로 만난 모양이 둘이다. 나머지는 추측이 되므로 만들지 않는다.\n`
    + `  토큰을 손으로 옮기고, 그 사실을 design.config.json 과 화면 문서에 적는다.`);
  process.exit(1);
}

const css = readFileSync(src, 'utf8');
const tokens = parseRoot(css);
if (!tokens.size) {
  console.error(`[emit-tokens] ${src} 에 :root 토큰이 없다. 정본 파일을 가리켰는지 확인한다.`);
  process.exit(2);
}

if (family === 'web') {
  console.log(`[emit-tokens] ${basename(src)} — 토큰 ${tokens.size}개`);
  console.log(`  web 계열은 **정본이 이미 그 형식**이다. 생성할 것이 없다.`);
  console.log(`  대상 레포의 globals.css \`:root\` 블록을 이 파일의 \`:root\` 로 교체한다`);
  console.log(`  (불변항 III-2 — 단일 교체점).`);
  process.exit(0);
}

let version = null;
try { version = JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8')).version; } catch { /* 버전 없이도 생성된다 */ }
const { code, notes, counts } = emitRN(tokens, basename(src), version);
const out = flag('--out');
if (out) {
  writeFileSync(out, code);
  console.log(`[emit-tokens] ${out} — 토큰 ${tokens.size}개 → ${JSON.stringify(counts)}`);
  if (notes.length) { console.log('  그대로 옮기지 못한 것:'); for (const n of notes) console.log(`    · ${n}`); }
  console.log(`  검사: node <장치경로>/scripts/contrast-check.mjs ${out}`);
} else {
  process.stdout.write(code);
}
process.exit(0);
