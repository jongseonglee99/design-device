#!/usr/bin/env node
// measure-render — **렌더된 화면**을 잰다. 소스 텍스트가 아니다.
//
// ★ 이 파일이 존재하는 이유는 실측된 구멍이다 (`ARCHITECTURE.md` 결함 ⑦).
// 우리 모든 검사는 소스를 읽는다. `contrast-check` 는 토큰 파일의 `--var: #hex` 만 본다.
// 그래서 **어느 값이 어느 값과 같이 나타나는가**를 모른다 —
// 그 정보는 소스에 없고 렌더에만 있다.
//
//   .card       { background: var(--paper-2) }   /* 카드가 배경을 바꿨다 */
//   .card .meta { color: var(--muted) }          /* 글자색은 상속 그대로 */
//
//   토큰 4개 각각:  전부 합격
//   합성된 실제 쌍: #9aa3ab on #f8fafa → 2.44:1  ❌      ← 재현 확인 2026-10-11
//
// 같은 뿌리의 결함 ⑨(라이트·다크 교차 테마 쌍 오보고)도 여기서 해소된다 —
// 테마를 **에뮬레이션해서 각각 재면** 어느 쌍이 실재하는지 묻지 않아도 된다.
//
// ─── 재는 것 셋 (승인 `#39 C`) ───────────────────────────────────────────────
//   ㉠ 합성 대비 쌍   보이는 모든 텍스트의 색 대 **알파 합성된 실제 배경** (라이트·다크 둘 다)
//   ㉡ 상태 대비      인터랙티브 요소를 **직접 눌러서** hover·focus-visible 상태의 대비
//   ㉢ 좁은 폭 넘침   320 · 414px 에서 가로 스크롤과 넘치는 요소
//   ㉣ 비텍스트 대비   체크박스·라디오·스위치의 테두리/바탕 · 아이콘만 있는 버튼의 아이콘 — 3:1
//   ㉤ 배치 무결성     **가려진 글자 · 잘린 글자 · 서로 겹친 글자** — 기본이다 (2026-10-12 사용자:
//                    "글씨 위치 깨짐, 도형 어긋남 등 6개 시안 곳곳에서 기본이 지켜지지 않았다. 앞으론 절대 안 된다")
//   --shots <폴더>    폭마다 스크린숏을 남긴다 — 기계가 못 보는 어긋남은 **눈으로** 본다(D 단계가 열게 한다)
//                    (2026-10-12 — 불변항 Ⅰ-1 이 이미 「비텍스트 UI 요소 3:1」 을 요구하는데 재지 않았다)
// `axe`·키보드·포커스트랩은 넣지 않았다 — 우리 축이 아니고, 게이트를 한 번에 늘리면
// 오탐 위험이 범위보다 빨리 자란다.
//
// ─── playwright 를 찾는 순서 — 이 순서가 설계의 핵심이다 ─────────────────────
// ★ **실측 (2026-10-11): 소비 레포에 playwright 가 깔려 있어도 우리가 못 본다.**
// node 는 cwd 가 아니라 **스크립트 위치**로 모듈을 해석한다. 우리 스크립트는
// `${CLAUDE_PLUGIN_ROOT}/scripts/` 에 있으므로 `import('playwright')` 는
// 대상 레포의 `node_modules` 를 보지 않는다 → `ERR_MODULE_NOT_FOUND`.
//
//   ① 대상 레포에서 명시 해석  createRequire(<대상>/package.json).resolve()
//      → 대상이 **고정한 버전**을 쓰므로 버전 충돌이 없다
//   ② 우리 optionalDependencies
//   ③ 없으면 **「미측정」이라고 말하고 통과**한다 (exit 0)
//
// ③ 이 D-18 의 교훈이다 — 아무도 만족시킬 수 없는 요구는 차단이 아니라 고장이다.
// 단 침묵하지는 않는다: 통과가 「다 괜찮다」로 읽히면 안 된다.
// `DESIGN_REQUIRE_BROWSER=1` 이면 브라우저 없음 자체를 실패로 만든다 (CI 용).
//
// 사용:
//   node scripts/measure-render.mjs <파일|디렉토리> [--target <레포>] [--json]
//   node scripts/measure-render.mjs prototypes --widths 320,414
// 종료코드: 0 = 통과 또는 미측정 · 1 = 실제 위반 · 2 = 사용법

import { createRequire } from 'node:module';
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve, relative, extname, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

// ─── 인자 ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const asJson = argv.includes('--json');
const shotsDir = flag('--shots') ? resolve(flag('--shots')) : null;
if (shotsDir) { const { mkdirSync } = await import('node:fs'); mkdirSync(shotsDir, { recursive: true }); }
const target = resolve(flag('--target', process.cwd()));
// ★ **측정 폭은 제품이 정한다** (2026-10-12 수정 — 실측 오탐 2건).
// 고정값 320·414 는 모바일 웹의 가정이다. control_tower 맥 앱은 창 최소 폭이 **420px**
// (`BrowserWindow({ minWidth: 420 })`) 라 320·414 넘침은 **존재할 수 없는 화면**이었고,
// 정작 실제 최소 폭 420 에서의 넘침(문서 427px)은 고정값으로는 잡히지 않았다.
// 순서: ① `--widths` ② `design.config.json` 의 `widths` ③ Electron `minWidth` 감지 ④ 320·414
function resolveWidths() {
  if (flag('--widths')) return { list: String(flag('--widths')).split(',').map(Number).filter(Boolean), from: '--widths' };
  try {
    const conf = JSON.parse(readFileSync(join(target, 'design.config.json'), 'utf8'));
    if (Array.isArray(conf.widths) && conf.widths.length) return { list: conf.widths.map(Number).filter(Boolean), from: 'design.config.json' };
  } catch { /* 설정 없음 */ }
  const roots = [target];
  for (const d of ['apps', 'packages']) {
    try { for (const n of readdirSync(join(target, d))) roots.push(join(target, d, n)); } catch { /* 없음 */ }
  }
  const mins = [];
  for (const r of roots) {
    let pkg;
    try { pkg = JSON.parse(readFileSync(join(r, 'package.json'), 'utf8')); } catch { continue; }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (!deps.electron) continue;
    const walk = (dir, depth) => {
      if (depth > 4) return;
      let names; try { names = readdirSync(dir); } catch { return; }
      for (const n of names) {
        if (n === 'node_modules' || n.startsWith('.')) continue;
        const f = join(dir, n);
        let st; try { st = statSync(f); } catch { continue; }
        if (st.isDirectory()) walk(f, depth + 1);
        else if (/\.(m?[jt]s)$/.test(n)) {
          const m = readFileSync(f, 'utf8').match(/minWidth\s*:\s*(\d+)/);
          if (m) mins.push({ w: +m[1], at: relative(target, f) });
        }
      }
    };
    walk(join(r, 'src', 'main'), 0);
    walk(join(r, 'electron'), 0);
  }
  if (mins.length) {
    const m = mins.sort((a, b) => a.w - b.w)[0];
    return { list: [m.w, 1280], from: `Electron minWidth (${m.at})` };
  }
  return { list: [320, 414], from: '기본값(모바일 웹 가정)' };
}
const widthsInfo = resolveWidths();
const widths = widthsInfo.list;
const consumed = new Set([flag('--target'), flag('--widths'), flag('--url'),
  flag('--routes'), flag('--inject')].filter(Boolean));
// ★ `--url` — **떠 있는 주소를 잰다** (2026-10-12 추가).
// 빌드 산출물을 `file://` 로 열면 절대 경로 asset(`/assets/…`)이 전부 실패해
// **빈 화면이 나오고, 그것을 「통과」로 보고했다**(실측). SPA·Electron 렌더러는
// 떠 있는 서버로만 제대로 뜬다. `design.config.json` 의 `paths.render` 가 이 값이다.
// `--routes` 로 한 주소 안의 여러 화면을 잴 수 있다 (SPA 라우팅).
const urlArg = flag('--url');
// ★ `--inject <file.js>` — **상태를 주입해서 잰다** (2026-10-12 추가).
// 화면 문서는 상태 5종을 요구하는데(`validate-screen`), 실제 앱을 그냥 띄우면
// **한 상태만** 잴 수 있다. 실측: control_tower 맥 앱을 HTTP 로 띄우니
// Electron 브리지(`window.ct`)가 없어 **「실패」 상태**가 렌더됐다 — 그것도 사실이지만
// 「정상」·「빈」·「부분」을 재지 않고 통과를 보고하면 5종 요구가 말뿐이 된다.
//
// 기전은 장치가, **자극은 제품이** 갖는다 — `products/<제품>/render-states/*.js`.
// 그 파일들은 「각 상태가 무엇인가」를 코드로 적은 것이므로 **설계 산출물**이다.
const injectArg = flag('--inject');
const routes = flag('--routes') ? String(flag('--routes')).split(',').map((r) => r.trim()) : [''];
const pathArg = argv.find((a) => !a.startsWith('--') && !consumed.has(a)
  && a !== urlArg && a !== flag('--routes') && a !== injectArg);

if (!pathArg && !urlArg) {
  console.error('사용법: node scripts/measure-render.mjs <파일|디렉토리> [--target <레포>] [--widths 320,414] [--json]');
  console.error('        node scripts/measure-render.mjs --url http://localhost:4173 [--routes /,/todos] [--target <레포>]');
  process.exit(2);
}
const root = pathArg ? resolve(pathArg) : null;
if (root && !existsSync(root)) { console.error(`경로 없음: ${root}`); process.exit(2); }

let injectSrc = null;
let injectName = null;
if (injectArg) {
  const ip = resolve(injectArg);
  if (!existsSync(ip)) { console.error(`주입 파일 없음: ${ip}`); process.exit(2); }
  injectSrc = readFileSync(ip, 'utf8');
  injectName = relative(process.cwd(), ip) || ip;
}

// ─── playwright 찾기 ────────────────────────────────────────────────────────
async function findChromium() {
  // ① 대상 레포. `playwright` 가 먼저다 — `playwright-core` 는 브라우저를 들고 오지 않는다.
  for (const pkg of ['playwright', 'playwright-core']) {
    try {
      const req = createRequire(join(target, 'package.json'));
      const resolved = req.resolve(pkg);
      const m = await import(pathToFileURL(resolved).href);
      // CJS 라 named export 가 `.default` 에 들어온다 (실측).
      const { chromium } = m.default ?? m;
      if (chromium?.launch) {
        // ★ node 는 상위 폴더와 전역 폴더까지 거슬러 올라간다 — 대상 **안**에서 나온 것이 아니면
        // 「대상이 고정한 버전」이 아니다. 영수증이 거짓을 적지 않게 나온 자리를 말한다.
        // (2026-W43 실측: 클라우드 컨테이너의 `/opt/node-tools` 가 ① 을 조용히 만족시켜
        // `playwright @ tests` 로 적혔다 — 그 폴더에는 playwright 가 없다.)
        const inside = !relative(target, resolved).startsWith('..');
        const root = resolved.replace(new RegExp(`([\\\\/]node_modules[\\\\/]${pkg})[\\\\/].*$`), '$1');
        return { chromium, from: inside ? `${pkg} @ ${relative(process.cwd(), target) || '.'}` : `${pkg} @ ${root} (대상 밖)` };
      }
    } catch { /* 다음 후보 */ }
  }
  // ② 장치 전용 런타임 — `~/.design-device/runtime` (scripts/setup-render.mjs 가 깐다).
  // ★ 2026-10-12 섀도 런 실측: 설치본에는 node_modules 가 없어 ③ 은 한 번도 성공하지 못했고,
  // playwright 없는 레포에서는 렌더가 언제나 미측정이었다. 레포 밖 한 자리에 한 번 깔면 어디서든 잰다.
  try {
    const rt = process.env.DESIGN_DEVICE_RUNTIME || join(homedir(), '.design-device', 'runtime');
    const req = createRequire(join(rt, 'package.json'));
    const m = await import(pathToFileURL(req.resolve('playwright')).href);
    const { chromium } = m.default ?? m;
    if (chromium?.launch) return { chromium, from: 'playwright @ ~/.design-device/runtime' };
  } catch { /* 아직 안 깔았다 */ }
  // ③ 우리 쪽 (optionalDependencies — 개발 레포에서만 있다)
  try {
    const m = await import('playwright');
    const { chromium } = m.default ?? m;
    if (chromium?.launch) return { chromium, from: 'playwright @ 장치' };
  } catch { /* 없다 */ }
  return null;
}

// ─── 대상 파일 ──────────────────────────────────────────────────────────────
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const full = join(dir, name);
    let s; try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) yield* walk(full);
    else if (extname(name) === '.html' && name !== 'review.html') yield full;
  }
}
// 대상은 **파일 또는 주소**다. 주소 모드에서는 `--routes` 가 화면 목록이 된다.
const targetsList = urlArg
  ? routes.map((r) => ({ url: new URL(r || '/', urlArg).href, rel: `${urlArg.replace(/\/$/, '')}${r || '/'}` }))
  : (statSync(root).isDirectory() ? [...walk(root)] : [root])
      .map((f) => ({ url: pathToFileURL(f).href, rel: relative(process.cwd(), f) || f }));
if (!targetsList.length) {
  console.error(urlArg ? `주소가 없다` : `.html 파일이 없다: ${root}`);
  process.exit(2);
}

// ─── 페이지 안에서 도는 감사 — 자기완결이어야 한다 ──────────────────────────
// 문자열로 넘기지 않고 함수로 넘긴다. 바깐 스코프를 쓰면 조용히 undefined 가 된다.
const AUDIT = () => {
  const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
  const ratio = (a, b) => {
    const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return (hi + 0.05) / (lo + 0.05);
  };
  const parse = (s) => {
    const m = String(s).match(/-?[\d.]+/g);
    if (!m) return null;
    return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]];
  };
  // 알파 합성 — 위에서 아래로 쌓인 반투명을 실제 색으로 만든다.
  // 이것이 없으면 rgba(0,0,0,.04) 카드 위의 텍스트를 흰 배경으로 잘못 잰다.
  const over = (fg, bg) => {
    const a = fg[3];
    return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a))).concat(1);
  };
  // ★ **그라디언트 바탕을 읽는다** (2026-10-12 수정 — 실측 오탐).
  // control_tower S3 의 「비해당」 상자는 **밝은 빗금**(`repeating-linear-gradient`)을 자기 바탕으로
  // 깔고 반전 카드(#101418) 안에 있었다. `backgroundColor` 만 보면 빗금을 투명으로 읽고
  // 그 뒤의 검은 카드와 비교해 **1.93:1** 을 냈다 — 실제는 8:1 이다.
  // 그라디언트를 만나면 그 **색 정지점마다** 바탕 후보를 만들고 **가장 나쁜 쌍**을 잰다.
  // 이미지(`url()`)는 색을 알 수 없으므로 **null = 이 요소는 미측정**이다. 추측하지 않는다.
  const stopsOf = (cs) => {
    const bi = cs.backgroundImage;
    if (!bi || bi === 'none') return [];
    if (/url\(/.test(bi)) return null;
    return (bi.match(/rgba?\([^)]*\)/g) || []).map(parse).filter(Boolean);
  };
  const effectiveBgs = (el) => {
    const stack = [];
    let floor = null;          // 그라디언트를 만나면 그 정지점들이 바닥이 된다
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const stops = stopsOf(cs);
      if (stops === null) return null;
      const c = parse(cs.backgroundColor);
      if (stops.length) {
        // 그라디언트는 backgroundColor 위에 그려진다 — 정지점이 불투명하면 거기서 멈춘다
        const under = (c && c[3] > 0) ? c : null;
        floor = stops.map((st) => (st[3] >= 1 || !under ? st : over(st, under)));
        if (stops.every((st) => st[3] >= 1) || (under && under[3] >= 1)) break;
        floor = null;          // 반투명 그라디언트 위에 바탕이 없으면 아래로 계속 내려간다
      }
      if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; }
    }
    const base = parse(getComputedStyle(document.documentElement).backgroundColor);
    const bottoms = floor || [(base && base[3] >= 1) ? base : [255, 255, 255, 1]];
    return bottoms.map((b) => {
      let out = b[3] >= 1 ? b : over(b, [255, 255, 255, 1]);
      for (let i = stack.length - 1; i >= 0; i--) out = over(stack[i], out);
      return out;
    });
  };
  const name = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22);
    return `${el.tagName.toLowerCase()}${id}${cls}${txt ? ` "${txt}"` : ''}`;
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  // 자기 자신이 직접 가진 텍스트가 있는 요소만 — 부모를 세면 같은 글자를 여러 번 센다.
  const hasOwnText = (el) => [...el.childNodes]
    .some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);

  const need = (cs) => {
    const px = parseFloat(cs.fontSize);
    const w = parseInt(cs.fontWeight, 10) || 400;
    // WCAG AA — 24px 이상 보통, 18.66px 이상 굵게 는 대형(3:1)
    return (px >= 24 || (px >= 18.66 && w >= 700)) ? 3 : 4.5;
  };

  // 구분 기호만 있는 글자(`·` `|` `/` `—`)는 **장식**이다 — WCAG 1.4.3 도 장식은 뺀다.
  // 실측: 메타 줄의 `span.sep "·"` 가 1.73:1 로 걸렸다. 의도적으로 흐린 구분점이고
  // 정보를 싣지 않는다. 글자가 하나라도 섞이면(예: `· 2일 지남`) 그대로 잰다.
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
  const DECOR = /^[\s·•∙|/\\\-–—]+$/;

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || !hasOwnText(el)) continue;
    if (DECOR.test(ownText(el))) continue;
    const cs = getComputedStyle(el);
    const fg0 = parse(cs.color);
    if (!fg0) continue;
    const bgs = effectiveBgs(el);
    if (!bgs) continue;        // 이미지 바탕 — 색을 모른다
    let bg = bgs[0], fg = fg0[3] < 1 ? over(fg0, bg) : fg0, r = ratio(fg, bg);
    for (const b of bgs.slice(1)) {          // 가장 나쁜 정지점
      const f = fg0[3] < 1 ? over(fg0, b) : fg0;
      const rr = ratio(f, b);
      if (rr < r) { bg = b; fg = f; r = rr; }
    }
    // 도형 기호 한 글자(◆▲●■★)는 글이 아니라 **그래픽**이다 — WCAG 1.4.11 비텍스트 3:1.
    // 실측: 토스형 시안의 늦음 ◆ (원색 #f04452, 3.71:1)를 4.5 로 걸었다. 그 시안은
    // 글자에는 #d22030(5.26:1)을 쓰고 원색을 도형에만 남겼다 — 바로 이 구분을 지킨 것이다.
    const GLYPH = /^\s*[\u25A0-\u25FF\u2605\u2606\u2B1F-\u2B2F]\s*$/;
    const n = GLYPH.test(ownText(el)) ? 3 : need(cs);
    if (r < n) {
      out.push({
        kind: 'contrast', at: name(el),
        ratio: +r.toFixed(2), need: n,
        fg: `rgb(${fg.slice(0, 3).join(',')})`, bg: `rgb(${bg.slice(0, 3).join(',')})`,
        size: cs.fontSize, weight: cs.fontWeight,
      });
    }
  }
  return out;
};

// ─── 비텍스트 대비 — 글자가 아닌 UI 요소 3:1 (WCAG 1.4.11 · 불변항 Ⅰ-1) ─────────
// ★ 신설 사유 (2026-10-12 실측): control_tower 검수에서 빈 체크 원 테두리가 **1.46:1** 이었다
// (교체 전에도 1.8:1). 게이트는 통과를 냈고, 그 세션이 **손으로 계산해서** 찾았다.
// 불변항 Ⅰ-1 은 「비텍스트 UI 요소(보더·아이콘·포커스링·상태 표시) 3:1」 을 이미 적고 있었다 —
// **승인된 규칙에 검출기가 없던 것**이다 (D-23 과 같은 빚).
//
// 범위를 일부러 좁혔다 — 오탐이 범위보다 빨리 자라지 않게.
//   ① 체크·라디오·스위치 (`appearance:none` 으로 직접 그린 것만 — 네이티브는 브라우저가 그린다)
//      식별 단서 = 테두리 또는 자기 바탕. **둘 중 나은 쪽**이 주변 바탕과 3:1 이면 통과
//   ② 글자 없이 아이콘(svg)만 있는 버튼·링크 — 아이콘의 stroke/fill 대 바탕
// 텍스트 입력칸은 넣지 않았다 — 채움형 입력칸(토스형 `#f2f4f6` on 흰색)은 라벨·위치로
// 식별되고, 1.4.11 도 그 경우 경계를 요구하지 않는다. 넣으면 사용자가 고른 체계가 매번 걸린다.
const NONTEXT_AUDIT = () => {
  const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
  const ratio = (a, b) => {
    const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return (hi + 0.05) / (lo + 0.05);
  };
  const parse = (s) => { const m = String(s).match(/^rgba?\(([^)]*)\)/); if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; };
  const over = (f, b) => [0, 1, 2].map((i) => Math.round(f[i] * f[3] + b[i] * (1 - f[3]))).concat(1);
  // 요소 **뒤의** 바탕 — 자기 자신은 빼고 부모부터 쌓는다. 그라디언트·이미지면 null(미측정).
  const behind = (el) => {
    const st = [];
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { st.push(c); if (c[3] >= 1) break; }
    }
    const base = parse(getComputedStyle(document.documentElement).backgroundColor);
    let o = (base && base[3] >= 1) ? base : [255, 255, 255, 1];
    for (let i = st.length - 1; i >= 0; i--) o = over(st[i], o);
    return o;
  };
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  // 묶음 키는 **모양**(태그·클래스·상태·색)이다 — 행마다 다른 aria-label 을 넣으면
  // 같은 체크 원 하나가 행 수만큼 줄이 된다 (실측: 아트보드 10장에서 176줄). 이름은 예시로만 붙인다.
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '';
    return `${el.tagName.toLowerCase()}${cls}${el.tagName === 'INPUT' && el.type ? `[${el.type}]` : ''}`;
  };
  const groups = new Map();
  const add = (o) => {
    const k = `${o.what}|${o.at}|${o.ratio}|${o.fg}|${o.bg}`;
    const g = groups.get(k);
    if (g) g.count++; else groups.set(k, { ...o, count: 1 });
  };
  const rgb = (c) => `rgb(${c.slice(0, 3).join(',')})`;

  // ① 체크·라디오·스위치
  const checks = document.querySelectorAll('input[type=checkbox], input[type=radio], [role=checkbox], [role=radio], [role=switch]');
  for (const el of checks) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    if (el.tagName === 'INPUT' && cs.appearance !== 'none' && cs.webkitAppearance !== 'none') continue;
    const bg = behind(el);
    if (!bg) continue;
    const cands = [];
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const bc = parse(cs.borderTopColor);
    if (bw >= 1 && cs.borderTopStyle !== 'none' && bc && bc[3] > 0) cands.push({ c: over(bc, bg), via: '테두리' });
    const own = parse(cs.backgroundColor);
    if (own && own[3] > 0) cands.push({ c: over(own, bg), via: '바탕' });
    if (!cands.length) continue;               // 그릴 단서가 없다 — 다른 방식(::before 등). 추측하지 않는다
    const best = cands.map((x) => ({ ...x, r: ratio(x.c, bg) })).sort((a, b) => b.r - a.r)[0];
    const state = el.checked || el.getAttribute('aria-checked') === 'true' ? '켜짐' : '꺼짐';
    if (best.r < 3) add({ kind: 'nontext', what: `${state} 상태 ${best.via}`, at: label(el), example: (el.getAttribute('aria-label') || el.closest('label, li, tr, [role=row]')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24), ratio: +best.r.toFixed(2), need: 3, fg: rgb(best.c), bg: rgb(bg) });
  }

  // ② 아이콘만 있는 버튼·링크
  for (const el of document.querySelectorAll('button, a[href], [role=button]')) {
    if (!vis(el)) continue;
    if ((el.textContent || '').trim()) continue;   // 글자가 있으면 글자가 식별 단서다
    const svg = el.querySelector('svg');
    if (!svg || !vis(svg)) continue;
    const shape = svg.querySelector('path, circle, rect, line, polyline, polygon') || svg;
    const scs = getComputedStyle(shape);
    const paint = [scs.stroke, scs.fill].map(parse).find((c) => c && c[3] > 0);
    if (!paint) continue;
    const ecs = getComputedStyle(el);
    let bg = behind(el);
    if (!bg) continue;
    const own = parse(ecs.backgroundColor);
    if (own && own[3] > 0) bg = over(own, bg);
    if (ecs.backgroundImage && ecs.backgroundImage !== 'none') continue;
    const fg = over(paint, bg);
    const r = ratio(fg, bg);
    if (r < 3) add({ kind: 'nontext', what: '아이콘', at: label(el), example: (el.getAttribute('aria-label') || el.title || '').slice(0, 24), ratio: +r.toFixed(2), need: 3, fg: rgb(fg), bg: rgb(bg) });
  }
  return [...groups.values()];
};

// ─── 배치 무결성 — 글자가 보이는가 (가려짐 · 잘림 · 겹침) ─────────────────────
// ★ 신설 사유 (2026-10-12 30days 섀도 런): 시안 6개 전부가 대비·넘침 게이트를 통과하거나 대비만 걸렸는데
// 사용자는 첫눈에 **글씨 위치 깨짐**을 봤다 — 「Store Manager」 가 아래 카드에 깔려 잘렸고,
// 게이지의 「63%」 가 호·라벨과 겹쳤다. 대비는 「보이면 읽히는가」 를 묻고, 이것은 **「보이는가」** 를 묻는다.
//   ① 가려짐 — 글자 줄 상자의 점 다섯에서 `elementsFromPoint` 의 맨 위가 그 글자(또는 그 조상·자손)가 아니다
//   ② 잘림   — 글자 줄 상자가 `overflow: hidden/clip` 조상 밖으로 나간다. **의도된 말줄임**
//              (`text-overflow: ellipsis` · `-webkit-line-clamp`)은 뺀다
//   ③ 겹침   — 서로 다른 두 글자 요소의 줄 상자가 작은 쪽 넓이의 25% 넘게 겹친다
// 도형끼리의 어긋남(호의 끝 · 아이콘 중심)은 기계가 일반적으로 판정할 수 없다 → `--shots` 로 **눈이 본다.**
const LAYOUT_AUDIT = () => {
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '';
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20);
    return `${el.tagName.toLowerCase()}${cls}${t ? ` "${t}"` : ''}`;
  };
  // 글자 줄 상자 — 요소 상자가 아니라 **글자가 실제로 그려진 자리**다(Range rects)
  const lineRects = (el) => {
    const out = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      // 줄 높이 10px 미만은 **읽는 글자가 아니라 묘사**다 — 축소한 서류 미리보기·썸네일 (dogu 섀도 런 오탐)
      for (const r of rg.getClientRects()) if (r.width > 2 && r.height >= 10) out.push(r);   // 10px 글자 + 보통 행간 = 약 12px — 읽는 글자는 남는다
    }
    return out;
  };
  const related = (a, b) => a === b || a.contains(b) || b.contains(a);
  // 고정·붙박이(fixed/sticky) 층은 **일부러** 내용 위에 뜬다 — 그 밑을 지나가는 글자는 가려진 게 아니다
  // (첫 판 오탐: 화면 아래 고정 버튼 띠가 스크롤 중인 지표 카드를 「가렸다」고 셌다)
  const floating = (e) => { for (let n = e; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const clips = (cs) => /(hidden|clip)/.test(cs.overflowX + cs.overflowY);
  const texts = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el) || el.closest('[data-rank-ignore]')) continue;
    if (el.getBoundingClientRect().height < 10) continue;   // 상자 자체가 10px 미만 — 썸네일 속 도장 같은 묘사다
    const raw = lineRects(el);
    // **보이는 줄만** — 자기나 조상이 자르는 상자(줄 수 제한 · 말줄임 · 고정 높이) 밖의 줄은 화면에 없다.
    // 그 줄을 「가려졌다」·「겹쳤다」 고 세지 않는다 (첫 판 오탐: 3줄로 접은 소견의 숨은 넷째 줄이 「전문 읽기」 에 「가려졌다」)
    let rs = raw;
    // 스크롤 상자(auto/scroll)도 **보이는 범위를 자른다** — 스크롤해 밀려난 줄은 지금 화면에 없다
    // (dogu 섀도 런 오탐: 자체 스크롤 패널 아래로 밀려난 상세 항목을 그 밑의 결정 버튼 띠가 「가렸다」고 셌다)
    const viewClips = (cs) => cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      if (!viewClips(getComputedStyle(a))) continue;
      const b = a.getBoundingClientRect();
      // 걸친 줄은 **보이는 부분만 남긴다** — 말줄임(…)으로 잘린 파일 이름의 숨은 꼬리가 옆 버튼과 「겹쳤다」고 세지 않게
      rs = rs.filter((r) => r.bottom > b.top + 1 && r.top < b.bottom - 1 && r.right > b.left + 1 && r.left < b.right - 1)
        .map((r) => { const l = Math.max(r.left, b.left), t = Math.max(r.top, b.top), rr = Math.min(r.right, b.right), bb = Math.min(r.bottom, b.bottom);
          return { left: l, top: t, right: rr, bottom: bb, width: rr - l, height: bb - t }; });
    }
    if (raw.length) texts.push({ el, rs, raw, float: floating(el) });
  }
  const out = [];
  const vw = innerWidth, vh = innerHeight;
  for (const { el, rs, raw } of texts) {
    // ① 가려짐 — 화면 안의 줄만
    for (const r of rs) {
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + r.height / 2], [r.right - 2, r.top + r.height / 2],
        [r.left + r.width / 2, r.top + 2], [r.left + r.width / 2, r.bottom - 2]];
      let covered = 0, by = null;
      for (const [x, y] of pts) {
        if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
        const top = document.elementsFromPoint(x, y).find((e) => getComputedStyle(e).pointerEvents !== 'none' || true);
        if (top && !related(top, el) && !el.contains(top) && !floating(top)) {
          // 맨 위 요소가 투명하고 글자도 없으면(빈 래퍼) 가린 것이 아니다
          const cs = getComputedStyle(top);
          const paints = (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor))
            || (cs.backgroundImage && cs.backgroundImage !== 'none') || /^(IMG|SVG|CANVAS|VIDEO)$/i.test(top.tagName)
            || (top.textContent || '').trim();
          if (paints) { covered++; by = top; }
        }
      }
      if (covered >= 2) { out.push({ kind: 'layout', what: '가려진 글자', at: label(el), by: label(by) }); break; }
    }
    // ② 잘림
    const cs = getComputedStyle(el);
    const intended = cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none');
    if (!intended) {
      // ★ 축마다 따로 본다 — `overflow-x: hidden; overflow-y: auto` 는 **세로로 스크롤되는 상자**다
      // (첫 판 오탐: 가짜 폰 테두리 안의 스크롤 영역 아래 글자를 전부 「잘렸다」고 셌다). 스크롤 축은 자르지 않는다.
      let cutX = false, cutY = false, by = null;
      // 자기 자신부터 본다 — 고정 폭 상자가 **자기 글자**를 자르는 경우가 가장 흔하다(대조군에서 놓쳤다)
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a);
        if (acs.webkitLineClamp && acs.webkitLineClamp !== 'none') break;
        const ar = a.getBoundingClientRect();
        const hx = /(hidden|clip)/.test(acs.overflowX), hy = /(hidden|clip)/.test(acs.overflowY);
        const sx = /(auto|scroll)/.test(acs.overflowX), sy = /(auto|scroll)/.test(acs.overflowY);
        // 흐르는 띠(마키·로고 티커) — **움직이는** 띠만 일부러 자른다 (seemilar 섀도 런 오탐)
        // ★ 2026-W43 교정: 초판은 「내용이 상자 폭의 1.8배」 **하나로** 판정했고, 그 지표는 방향이 거꾸로다 —
        // 잘림은 심해질수록 비율이 커지므로 **심한 잘림일수록 면제된다.** 양성 대조군 `.narrow` 가
        // 1.811 로 턱걸이해 검출되지 않았다(2026-10-19 실측 · 15px system-ui · 90px 상자).
        // 폭은 띠의 성질이 아니다. 띠를 띠로 만드는 것은 **애니메이션**이므로 그것을 함께 요구한다.
        // ★ 움직임은 **측정 전에 지워진다** — 안정화 때문에 `animation:none!important` 를 주입하므로
        // 재는 시점의 계산된 스타일로는 띠와 고정 폭 상자를 구별할 수 없다. 끄기 전에 찍은 표시를 읽는다.
        const moving = (n) => n.hasAttribute('data-dd-moving')
          || (getComputedStyle(n).animationName || 'none') !== 'none';
        // 띠의 트랙은 한 겹 아래일 수도 있다 — 표시가 찍힌 **자손이 있으면** 띠로 본다
        const ticker = a.scrollWidth > a.clientWidth * 1.8
          && (moving(a) || !!a.querySelector('[data-dd-moving]') || [...a.children].some((c) => moving(c)));
        if (!cutX && hx && !ticker && raw.some((r) => r.right > ar.right + 1 || r.left < ar.left - 1)) { cutX = true; by = a; }
        if (!cutY && hy && raw.some((r) => r.bottom > ar.bottom + 1 || r.top < ar.top - 1)) { cutY = true; by = a; }
        if ((sx || hx) && (sy || hy)) break;   // 두 축이 다 정해진 상자에서 멈춘다 — 그 바깥은 이 상자가 책임진다
      }
      if (cutX || cutY) out.push({ kind: 'layout', what: '잘린 글자', at: label(el), by: label(by) });
    }
  }
  // ③ 겹침 — 서로 다른 글자 요소끼리
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const A = texts[i], B = texts[j];
      if (related(A.el, B.el) || A.float !== B.float) continue;   // 떠 있는 층과 그 밑을 지나가는 글자는 겹친 게 아니다
      let hit = false;
      for (const a of A.rs) { for (const b of B.rs) {
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 0 && h > 0 && w * h > 0.25 * Math.min(a.width * a.height, b.width * b.height)) { hit = true; break; }
      } if (hit) break; }
      if (hit) out.push({ kind: 'layout', what: '겹친 글자', at: label(A.el), by: label(B.el) });
    }
  }
  const seen = new Set();
  return out.filter((o) => { const k = o.what + o.at + o.by; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 30);
};

// ─── 상태 대비 — hover·focus-visible 을 직접 눌러서 잰다 ────────────────────
const STATE_AUDIT = () => {
  const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * srgb(r / 255) + 0.7152 * srgb(g / 255) + 0.0722 * srgb(b / 255);
  const ratio = (a, b) => {
    const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return (hi + 0.05) / (lo + 0.05);
  };
  const parse = (s) => { const m = String(s).match(/-?[\d.]+/g); return m ? [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]] : null; };
  const over = (f, b) => [0, 1, 2].map((i) => Math.round(f[i] * f[3] + b[i] * (1 - f[3]))).concat(1);
  // 그라디언트 바탕 — AUDIT 와 같은 규칙. 정지점 중 **가장 어두운/밝은 쪽**이 아니라
  // 글자와 가장 나쁜 쌍을 고르기 위해 후보를 전부 돌려준다. 이미지 바탕이면 null.
  const bgsOf = (el) => {
    const st = [];
    let floor = null;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        if (/url\(/.test(bi)) return null;
        const stops = (bi.match(/rgba?\([^)]*\)/g) || []).map(parse).filter(Boolean);
        if (stops.length && stops.every((x) => x[3] >= 1)) { floor = stops; break; }
      }
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { st.push(c); if (c[3] >= 1) break; }
    }
    return (floor || [[255, 255, 255, 1]]).map((b) => {
      let o = b;
      for (let i = st.length - 1; i >= 0; i--) o = over(st[i], o);
      return o;
    });
  };
  const el = window.__designTargetEl;
  // ★ **글자를 그리지 않는 요소의 `color` 는 의미가 없다** (2026-10-12 수정).
  // 실측 오탐: `input.checkInv` (체크박스)가 hover/focus 에서 **1.14:1** 로 걸렸다.
  // 그 요소는 `appearance: none` + `background`·`border` 로 그려지고 체크 표시는
  // `:checked::after { content: "✓" }` 가 그린다 — **비체크 상태에는 글자가 하나도 없다.**
  // 상속된 `color`(반전 카드의 흰색)를 흰 배경과 비교한 숫자였고, 화면에 그 쌍은 존재하지 않는다.
  const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
  const tag = el.tagName.toLowerCase();
  const NO_TEXT_INPUT = /^(checkbox|radio|range|color|file|hidden|image)$/i;
  const isTextField = (tag === 'input' && !NO_TEXT_INPUT.test(el.type || 'text') && (el.value || el.placeholder))
    || (tag === 'textarea' && (el.value || el.placeholder))
    || tag === 'select';
  if (!hasOwnText && !isTextField) return null;

  const cs = getComputedStyle(el);
  const fg0 = parse(cs.color); if (!fg0) return null;
  const bgs = bgsOf(el);
  if (!bgs) return null;
  let bg = bgs[0], fg = fg0[3] < 1 ? over(fg0, bg) : fg0;
  for (const b of bgs.slice(1)) {
    const f = fg0[3] < 1 ? over(fg0, b) : fg0;
    if (ratio(f, b) < ratio(fg, bg)) { bg = b; fg = f; }
  }
  const px = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight, 10) || 400;
  return {
    ratio: +ratio(fg, bg).toFixed(2),
    need: (px >= 24 || (px >= 18.66 && w >= 700)) ? 3 : 4.5,
    fg: `rgb(${fg.slice(0, 3).join(',')})`, bg: `rgb(${bg.slice(0, 3).join(',')})`,
  };
};

// ─── IA6 읽기 진입점 — 화면 문서가 1순위라고 한 것이 실제로 가장 무거운가 ──────
// (2026-10-12 신설 — IA6 는 2026-W34 에 승인됐는데 **검출기가 없었다**. D-23 과 같은 빚이다.)
// 실측: control_tower S3 시안 셋을 사용자가 보고 *"뭘 먼저 봐야 할지 모르겠다"* 고 했다.
// 화면 문서 §4 는 1순위를 적어 두었지만, 렌더에서는 페이지 제목(22px/700)이 표 숫자(15px/700)보다
// 무거웠고 나머지는 전부 같은 무게였다. **문서가 말한 위계와 렌더된 위계를 대조한 적이 없었다.**
//
// 「무엇이 중요한가」는 기계가 모른다 — **화면 문서가 안다.** 그래서 아트보드가
// 위계 1순위 요소에 `data-rank="1"` 을 단다(steps/C-wireframe.md C-1). 기계는 그것이
// ① 첫 화면 안에 있고 ② 그 밖의 어떤 글자보다 뚜렷하게(1.2배) 무거운지만 잰다.
// 무게 = 글자 크기 × (굵기/400). 표면·색은 넣지 않았다 — 근거 없는 가중치를 지어내지 않는다.
// 표시가 없으면 **미측정**이라 말한다. 기계 상한은 ⚠️ 다 (#38 D — 휴리스틱).
const RANK_AUDIT = () => {
  const rank = document.querySelector('[data-rank="1"]');
  if (!rank) return { status: 'unmarked' };
  const vh = window.innerHeight;
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && r.top < vh && r.bottom > 0;
  };
  const own = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
  const weight = (el) => {
    const cs = getComputedStyle(el);
    return parseFloat(cs.fontSize) * ((parseInt(cs.fontWeight, 10) || 400) / 400);
  };
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '';
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18);
    return `${el.tagName.toLowerCase()}${cls}${t ? ` "${t}"` : ''}`;
  };
  const rr = rank.getBoundingClientRect();
  if (rr.top >= vh) return { status: 'below-fold', at: label(rank), top: Math.round(rr.top), vh };
  let rankW = 0;
  for (const el of [rank, ...rank.querySelectorAll('*')]) if (own(el) && vis(el)) rankW = Math.max(rankW, weight(el));
  let top = null;
  for (const el of document.querySelectorAll('body *')) {
    if (rank.contains(el) || el.closest('[data-rank-ignore]') || !own(el) || !vis(el)) continue;
    const w = weight(el);
    if (!top || w > top.w) top = { w, el };
  }
  // ★ 1순위가 **글자가 아닌 요소**면(찾기 입력칸·아이콘) 글자 무게로 잴 수 없다 (2026-10-12 실측 오탐).
  // control_tower 「기록」 의 1순위는 찾기 입력칸이다 — 플레이스홀더는 텍스트 노드가 아니라 무게 0 이 되고
  // ⚠️ 0배 가 나왔다. 디자인 결함이 아니라 자의 한계다. **첫 화면 안에 있는지만 확인하고 미측정이라 말한다.**
  if (rankW === 0) return { status: 'non-text', at: label(rank) };
  if (!top) return { status: 'ok', rankW };
  const ratio = rankW / top.w;
  return ratio >= 1.2
    ? { status: 'ok', rankW: +rankW.toFixed(1), ratio: +ratio.toFixed(2) }
    : { status: 'flat', at: label(rank), rankW: +rankW.toFixed(1), rival: label(top.el), rivalW: +top.w.toFixed(1), ratio: +ratio.toFixed(2) };
};

// ★ **무엇을 쟀는지 센다** (2026-10-12 추가 — 실측된 오통과 때문이다).
// `measure-render` 가 Electron 빌드 산출물(`out/renderer/index.html`)을 `file://` 로 열고
// **「통과」를 출력했다.** 열어 보니 총요소 1개 · 텍스트요소 0개 · 본문 0자였다 —
// 절대 경로 asset(`/assets/…`)이 `file://` 에서 전부 실패해 React 가 뜨지도 않았다.
//
// **잴 것이 없었던 것과 위반이 없는 것은 다른 사실이다.** 둘을 같은 말로 보고하면
// 이 게이트는 "한 번도 발화하지 않는 검사"가 되고, 그건 결함 없는 코드베이스와 구별되지 않는다.

// 애니메이션을 **끄기 전에** 움직이는 것에 표시를 남긴다 — 끈 뒤에는 흐르는 띠와
// 글자를 자르는 고정 폭 상자가 기계에게 똑같이 보인다 (2026-W43 실측 · `LAYOUT_AUDIT` 의 `moving`).
const MARK_MOTION = `(() => { let n = 0;
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if ((s.animationName || 'none') !== 'none') { el.setAttribute('data-dd-moving', ''); n++; }
  }
  return n; })()`;

const COUNT_AUDIT = () => {
  const all = [...document.querySelectorAll('body *')];
  const withText = all.filter((el) => [...el.childNodes]
    .some((n) => n.nodeType === 3 && n.textContent.trim().length > 0));
  return {
    elements: all.length,
    textElements: withText.length,
    bodyChars: (document.body.innerText || '').trim().length,
  };
};

const OVERFLOW_AUDIT = () => {
  const de = document.documentElement;
  const scrolls = de.scrollWidth > de.clientWidth + 1;
  const bad = [];
  if (scrolls) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.right > de.clientWidth + 1 || r.left < -1) {
        const cls = typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\s+/)[0] : '';
        bad.push(`${el.tagName.toLowerCase()}${cls} (right ${Math.round(r.right)}px)`);
      }
    }
  }
  return { scrolls, docWidth: de.scrollWidth, viewport: de.clientWidth, elements: [...new Set(bad)].slice(0, 6) };
};

const writeOut = (str) => new Promise((r) => process.stdout.write(str + '\n', r));

// ─── 실행 ───────────────────────────────────────────────────────────────────
const found = await findChromium();
if (!found) {
  const required = process.env.DESIGN_REQUIRE_BROWSER === '1';
  const msg = `[measure-render] **미측정** — playwright 를 찾지 못했다.\n`
    + `  찾은 순서: ① ${relative(process.cwd(), target) || '.'}/node_modules  ② ~/.design-device/runtime  ③ 장치의 optionalDependencies\n`
    + `  ${targetsList.length}개 대상의 렌더 대비·상태·넘침을 **재지 않았다.**\n`
    + `  통과가 아니라 미측정이다 — 보고할 때 그렇게 말할 것.\n`
    + `  깔려면 (한 기계에 한 번, **대상 레포에는 깔지 않는다**):\n`
    + `      node ${join(import.meta.dirname ?? '.', 'setup-render.mjs')}`;
  if (asJson) console.log(JSON.stringify({ measured: false, reason: 'no-playwright', files: targetsList.length, widths: widthsInfo }, null, 2));
  else console.error(msg);
  process.exit(required ? 1 : 0);
}

const { chromium } = found;
const browser = await chromium.launch({ headless: true });
const results = [];
const empties = [];      // 렌더가 비어 있던 (파일, 테마)
let measuredCount = 0;   // 실제로 잰 텍스트 요소 수
const ranks = [];        // IA6 — 파일마다 한 줄
const shots = [];        // --shots 로 남긴 스크린숏

try {
  for (const { url, rel } of targetsList) {

    // ㉠ 합성 대비 — 라이트·다크 각각. 테마를 에뮬레이션하므로 교차 테마 쌍이 생기지 않는다.
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      // 콘솔·네트워크 실패를 모은다 — 빈 렌더의 **원인**을 말해 주지 않으면
      // 사용자가 "왜 안 쟀는지" 알 수 없고, 그러면 미측정 보고가 소음이 된다.
      const pageErrors = [];
      page.on('console', (e) => { if (e.type() === 'error') pageErrors.push(e.text().slice(0, 120)); });
      page.on('pageerror', (e) => pageErrors.push(`pageerror: ${String(e).slice(0, 120)}`));
      page.on('requestfailed', (r) => pageErrors.push(`요청 실패: ${r.url().split('/').pop()}`));
      // 주입은 **페이지 스크립트보다 먼저** 돌아야 한다 — 앱이 브리지를 읽는 시점이 더 이르다.
      if (injectSrc) await page.addInitScript({ content: injectSrc });
      await page.goto(url, { waitUntil: 'load' });
      // SPA 는 load 직후 비어 있다. 짧게 기다린 뒤 센다.
      await page.waitForTimeout(600);
      await page.evaluate(MARK_MOTION);
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });

      const c = await page.evaluate(COUNT_AUDIT);
      measuredCount += c.textElements;
      if (c.textElements === 0) {
        empties.push({ file: rel, scheme, ...c, errors: [...new Set(pageErrors)].slice(0, 5) });
        await ctx.close();
        continue;   // 잴 것이 없으면 아래 검사를 돌리는 의미가 없다
      }

      for (const f of await page.evaluate(AUDIT)) results.push({ ...f, file: rel, scheme });
      for (const f of await page.evaluate(NONTEXT_AUDIT)) results.push({ ...f, file: rel, scheme });
      if (scheme === 'light') for (const f of await page.evaluate(LAYOUT_AUDIT)) results.push({ ...f, file: rel, scheme, width: 1280 });
      if (scheme === 'light') ranks.push({ file: rel, ...(await page.evaluate(RANK_AUDIT)) });

      // ㉡ 상태 대비 — 인터랙티브 요소를 직접 누른다.
      const handles = await page.$$('a, button, [role="button"], summary, input, select, textarea, [tabindex]');
      for (const h of handles.slice(0, 40)) {           // 상한 — 큰 페이지에서 시간이 폭발한다
        try {
          if (!(await h.isVisible())) continue;
          await h.evaluate((el) => { window.__designTargetEl = el; });
          const base = await h.evaluate(() => null);    // 핸들 유효성 확인
          void base;
          for (const state of ['hover', 'focus']) {
            if (state === 'hover') {
              await h.hover({ timeout: 800, force: true });
            } else {
              // ★ 마우스를 먼저 치운다. 안 치우면 hover 가 **그대로 걸려 있어서**
              // focus 측정이 hover 값을 다시 보고한다 (실측: 같은 2.56:1 이 두 줄).
              // 두 상태는 서로 다른 사실이므로 섞이면 둘 다 거짓이 된다.
              await page.mouse.move(0, 0);
              await h.evaluate((el) => el.focus?.());
            }
            const r = await page.evaluate(STATE_AUDIT);
            if (state === 'focus') await h.evaluate((el) => el.blur?.());
            if (r && r.ratio < r.need) {
              results.push({
                kind: 'state', file: rel, scheme, state,
                at: await h.evaluate((el) => {
                  const cls = typeof el.className === 'string' && el.className.trim()
                    ? '.' + el.className.trim().split(/\s+/)[0] : '';
                  const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20);
                  return `${el.tagName.toLowerCase()}${cls}${t ? ` "${t}"` : ''}`;
                }),
                ...r,
              });
            }
          }
        } catch { /* 누를 수 없는 요소는 넘긴다 */ }
      }
      await ctx.close();
    }

    // ㉢ 좁은 폭 넘침
    for (const width of widths) {
      const ctx = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await ctx.newPage();
      if (injectSrc) await page.addInitScript({ content: injectSrc });
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const o = await page.evaluate(OVERFLOW_AUDIT);
      if (o.scrolls) results.push({ kind: 'overflow', file: rel, width, ...o });
      await page.evaluate(MARK_MOTION);
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      for (const f of await page.evaluate(LAYOUT_AUDIT)) results.push({ ...f, file: rel, scheme: 'light', width });
      if (shotsDir) {
        // 이름은 **파일 이름**에서 — 상대 경로(`../../x.html`)를 쓰면 `._..` 로 시작하는 **숨김 파일**이 된다(섀도 런 실측)
        const nm = `${(urlArg ? rel.replace(/^https?:\/\/[^/]+/, '') || 'root' : rel.split(/[\\/]/).pop()).replace(/[^\w가-힣.-]+/g, '_').replace(/^[._]+/, '').slice(-80) || 'page'}@${width}.png`;
        await page.screenshot({ path: join(shotsDir, nm), fullPage: true });
        shots.push(join(shotsDir, nm));
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

// ─── 보고 ───────────────────────────────────────────────────────────────────
// ★ **테마에 반응하지 않는 페이지는 한 번만 보고한다** (2026-10-12 수정).
// 라이트·다크에서 **값까지 똑같이** 걸리면 그 페이지는 색 스킴에 반응하지 않는 것이고,
// 두 줄로 보고하는 것은 소음이다 — 실측: control_tower 맥 앱은 UI_GUIDE §4 가
// 「다크 모드 v1 비범위」로 정했으므로 단일 테마가 **맞는 구현**인데 검출이 2배로 나왔다.
// 값이 다르면 테마마다 다른 사실이므로 접지 않는다.
const uniq = [];
const seen = new Map();
for (const r of results) {
  // 테마를 뺀 키로 먼저 묶는다 — 같은 고장이 두 테마에서 같은 숫자면 한 건이다.
  const base = `${r.kind}|${r.file}|${r.state ?? ''}|${r.what ?? ''}|${r.width ?? ''}|${r.at ?? ''}|${r.ratio ?? ''}|${r.fg ?? ''}|${r.bg ?? ''}`;
  const prev = seen.get(base);
  // 같은 테마 안의 같은 줄은 **반복 요소**(표의 행마다 같은 체크 원)다 — 테마 무반응이 아니다
  if (prev && prev.scheme === r.scheme) { prev.count = (prev.count ?? 1) + (r.count ?? 1); continue; }
  if (prev) { prev.scheme = '단일(테마 무반응)'; continue; }
  const copy = { ...r };
  seen.set(base, copy);
  uniq.push(copy);
}

// ★ 하나도 재지 못했으면 **통과가 아니라 미측정**이다.
const nothingMeasured = measuredCount === 0;

if (asJson) {
  // ★ `console.log` 뒤 바로 `process.exit` 하면 **파이프 출력이 잘린다** (2026-10-12 실측 —
  // control_tower 아트보드 10장의 JSON 이 중간에서 끊겨 파싱이 실패했다). 다 쓴 뒤에 끝낸다.
  await writeOut(JSON.stringify({
    measured: !nothingMeasured,
    reason: nothingMeasured ? 'empty-render' : undefined,
    via: found.from, files: targetsList.length, inject: injectName,
    textElementsMeasured: measuredCount,
    widths: widthsInfo, ranks, shots,
    empties, findings: uniq,
  }, null, 2));
  process.exit(uniq.length ? 1 : (nothingMeasured && process.env.DESIGN_REQUIRE_BROWSER === '1' ? 1 : 0));
}

console.log(`[measure-render] ${targetsList.length}개 대상 · 렌더 측정 (${found.from})`);
console.log(`  테마 light·dark · 폭 ${widths.join('·')}px (${widthsInfo.from})${injectName ? ` · 주입 ${injectName}` : ''}`);
if (nothingMeasured) {
  console.error(`\n[measure-render] **미측정** — 렌더에 잴 것이 없었다. 통과가 아니다.`);
  for (const e of empties.slice(0, 4)) {
    console.error(`  ${e.file} (${e.scheme}) — 요소 ${e.elements}개 · 텍스트 ${e.textElements}개 · 본문 ${e.bodyChars}자`);
    for (const m of e.errors) console.error(`      ${m}`);
  }
  console.error(`\n  흔한 원인 — **빌드 산출물을 \`file://\` 로 열었다.** 절대 경로 asset(\`/assets/…\`)이`);
  console.error(`  file 스킴에서 실패해 스크립트·스타일이 뜨지 않는다. 떠 있는 서버를 가리킨다:`);
  console.error(`      npx vite preview   또는   python3 -m http.server -d <빌드폴더>`);
  console.error(`  그리고 **보고에 「렌더는 재지 않았다」를 적는다** — 통과라고 쓰지 않는다.`);
  process.exit(process.env.DESIGN_REQUIRE_BROWSER === '1' ? 1 : 0);
}
if (empties.length) {
  console.log(`\n⚠️  일부가 비어 있었다 — ${empties.length}개 (파일, 테마) 조합. 그 조합은 재지 않았다:`);
  for (const e of empties.slice(0, 4)) console.log(`     ${e.file} (${e.scheme})`);
}
// IA6 는 ⚠️ — exit 에 넣지 않는다 (기계 상한, #38 D). 대신 **미측정도 말한다.**
for (const k of ranks) {
  if (k.status === 'flat') {
    console.log(`\n⚠️  [IA6 진입점] 1순위가 가장 무겁지 않다 — ${k.ratio}배 (필요 1.2배)`);
    console.log(`     ${k.file} — 1순위 ${k.at} 무게 ${k.rankW} · 더 무거운/같은 것 ${k.rival} 무게 ${k.rivalW}`);
    console.log('     → 화면 문서 §4 의 1순위가 렌더에서 이기지 못한다. 크기·굵기·표면으로 진입점을 세운다');
  } else if (k.status === 'below-fold') {
    console.log(`\n⚠️  [IA6 진입점] 1순위가 첫 화면 밖이다 — top ${k.top}px / 뷰포트 ${k.vh}px`);
    console.log(`     ${k.file} — ${k.at}`);
  } else if (k.status === 'non-text') {
    console.log(`\n·  [IA6 진입점] 미측정 — 1순위 ${k.at} 가 글자가 아닌 요소라 글자 무게로 잴 수 없다 (첫 화면 안에는 있다)`);
  } else if (k.status === 'unmarked') {
    console.log(`\n·  [IA6 진입점] 미측정 — ${k.file} 에 data-rank="1" 이 없다 (화면 문서 §4 의 1순위에 단다)`);
  }
}
if (shots.length) {
  console.log(`\n📷 스크린숏 ${shots.length}장 — ${shotsDir}`);
  console.log('   **Read 로 한 장씩 연다.** 기계가 못 보는 것(도형 어긋남 · 아이콘 중심 · 이미지가 얼굴을 가림)은 눈이 본다');
}
if (!uniq.length) {
  console.log(`\n통과 — 렌더된 화면에서 위반 없음 (텍스트 요소 ${measuredCount}개 측정).`);
  process.exit(0);
}
for (const r of uniq) {
  if (r.kind === 'contrast') {
    console.log(`\n❌ [렌더 대비] ${r.ratio}:1 (필요 ${r.need}:1)  ${r.scheme}`);
    console.log(`     ${r.file} — ${r.at}`);
    console.log(`     ${r.fg} on ${r.bg}  ·  ${r.size} / ${r.weight}`);
    console.log('     → 토큰 각각은 합격일 수 있다. 이 **쌍**이 미달이다');
  } else if (r.kind === 'layout') {
    console.log(`\n❌ [배치] ${r.what}  ${r.width ?? ''}px`);
    console.log(`     ${r.file} — ${r.at}`);
    console.log(`     ← ${r.by}`);
    console.log('     → 기본이다. 글자는 가려지거나 잘리거나 겹치면 안 된다');
  } else if (r.kind === 'nontext') {
    console.log(`\n❌ [비텍스트 대비] ${r.what} ${r.ratio}:1 (필요 3:1)  ${r.scheme}${r.count > 1 ? `  · 같은 요소 ${r.count}개` : ''}`);
    console.log(`     ${r.file} — ${r.at}${r.example ? ` (예: "${r.example}")` : ''}`);
    console.log(`     ${r.fg} on ${r.bg}`);
    console.log('     → 글자가 아니어도 이 테두리·아이콘이 「여기 누를 것이 있다」 의 유일한 단서다 (WCAG 1.4.11)');
  } else if (r.kind === 'state') {
    console.log(`\n❌ [상태 대비] ${r.state} ${r.ratio}:1 (필요 ${r.need}:1)  ${r.scheme}`);
    console.log(`     ${r.file} — ${r.at}`);
    console.log(`     ${r.fg} on ${r.bg}`);
  } else {
    console.log(`\n❌ [넘침] ${r.width}px 에서 가로 스크롤 — 문서 ${r.docWidth}px / 뷰포트 ${r.viewport}px`);
    console.log(`     ${r.file}`);
    if (r.elements.length) console.log(`     ${r.elements.join(' · ')}`);
  }
}
console.log(`\n총 ${uniq.length}건. 불변항 Ⅰ-1 · 안티패턴 G3·IA5.`);
process.exit(1);
