#!/usr/bin/env node
// probe-lint — 취향 측정기 문항이 출제 가능한 상태인지 검사한다.
//
// 왜 있나: 1회차에서 15문항 중 3문항을 버렸다(관측 2026-10-09--taste-probe-r1).
// 가장 비싼 결함은 `q05` 였다 — A안의 `mod: 'ch2'` 가 데이터 정의에만 있고
// 렌더 함수에 분기가 없어서, A안이 '강조 없음' 기본 기판으로 그려졌다.
// 즉 "2채널 vs 4채널"이 아니라 "강조 없음 vs 4채널"을 물었다.
//
// **일관성 검정은 이것을 잡지 못한다** — 깨진 문항에도 일관되게 답하기 때문이다.
// 그래서 출제 전에 기계가 본다. 브라우저는 쓰지 않는다(contrast-check 와 같은 방침).
//
// 사용: node scripts/probe-lint.mjs <측정기 html> [--json]
// 종료 코드: 0 = 출제 가능, 1 = 결함, 2 = 사용법 오류

import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const target = args.find((a) => !a.startsWith('--'));
if (!target) { console.error('사용법: node scripts/probe-lint.mjs <측정기 html> [--json]'); process.exit(2); }
const file = resolve(target);
if (!existsSync(file)) { console.error(`경로 없음: ${file}`); process.exit(2); }
const src = readFileSync(file, 'utf8');

const errs = [], warns = [];
const E = (m) => errs.push(m);
const W = (m) => warns.push(m);

// ── 1. 축 정의를 읽는다 ────────────────────────────────────────────────────
// `name:S({...})` 또는 `name:{...}` 블록을 중괄호 균형으로 잘라낸다.
const axBlock = (() => {
  const i = src.search(/const\s+AX\s*=\s*\{/);
  if (i < 0) return null;
  const s = src.indexOf('{', src.indexOf('=', i));
  let d = 0;
  for (let j = s; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}') { d--; if (!d) return src.slice(s + 1, j); }
  }
  return null;
})();
if (!axBlock) { console.error('AX 정의를 찾지 못했다 — 측정기 형식이 바뀌었나'); process.exit(2); }

const axes = {};
{
  // 깊이 0(= AX 의 직속 키)에서만 축을 읽는다.
  // 초판은 전역 정규식을 써서 중첩된 `A:{...}` · `B:{...}` 를 축으로 오인했다.
  let d = 0, i = 0;
  while (i < axBlock.length) {
    const c = axBlock[i];
    if (c === '{') { d++; i++; continue; }
    if (c === '}') { d--; i++; continue; }
    if (d === 0) {
      // 래퍼 헬퍼 이름은 측정기마다 다르다(S/L/A …) — 하드코딩하지 않는다.
      const m = /^([A-Za-z_$][\w$]*)\s*:\s*(?:[A-Za-z_$][\w$]*\(\s*)?\{/.exec(axBlock.slice(i));
      if (m && (i === 0 || /[\s,{]/.test(axBlock[i - 1]))) {
        const k = i + m[0].length - 1;
        let dd = 0;
        for (let j = k; j < axBlock.length; j++) {
          if (axBlock[j] === '{') dd++;
          else if (axBlock[j] === '}') { dd--; if (!dd) { axes[m[1]] = axBlock.slice(k, j + 1); i = j; break; } }
        }
      }
    }
    i++;
  }
}

// ── 2. 렌더 함수에 실제로 존재하는 mod 분기를 모은다 ───────────────────────
// `mod==='xxx'` 형태만 센다. 선언만 있고 분기가 없으면 그 변형은 기본 기판이 된다.
const branches = new Set([...src.matchAll(/mod\s*===\s*'([^']+)'/g)].map((m) => m[1]));

// ── 3. 문항별 검사 ─────────────────────────────────────────────────────────
const field = (blk, k) => {
  const i = blk.search(new RegExp(`\\b${k}\\s*:`));
  if (i < 0) return null;
  const s = blk.indexOf('{', i);
  const q = blk.search(new RegExp(`\\b${k}\\s*:\\s*'`));
  if (q === i && (s < 0 || q < s)) {                 // 문자열 값
    const a = blk.indexOf("'", blk.indexOf(':', i)) + 1;
    return blk.slice(a, blk.indexOf("'", a));
  }
  if (s < 0) return null;
  let d = 0;
  for (let j = s; j < blk.length; j++) {
    if (blk[j] === '{') d++;
    else if (blk[j] === '}') { d--; if (!d) return blk.slice(s, j + 1); }
  }
  return null;
};
const cssKeys = (blk) => blk ? [...blk.matchAll(/'(--[\w-]+)'\s*:/g)].map((m) => m[1]) : [];
const modOf = (blk) => { const m = blk && blk.match(/mod\s*:\s*'([^']+)'/); return m ? m[1] : null; };

const report = [];
for (const [name, blk] of Object.entries(axes)) {
  const A = field(blk, 'A'), B = field(blk, 'B');
  const row = { axis: name, ok: true };
  if (!A || !B) { E(`${name}: A/B 변형이 둘 다 정의되지 않았다`); row.ok = false; report.push(row); continue; }

  const am = modOf(A), bm = modOf(B);
  const ak = cssKeys(field(A, 'css')), bk = cssKeys(field(B, 'css'));

  // (a) 가장 비싼 결함 — 선언된 mod 에 렌더 분기가 없다 (q05 가 정확히 이것)
  for (const [side, mod] of [['A', am], ['B', bm]]) {
    if (mod && !branches.has(mod)) {
      E(`${name}.${side}: mod '${mod}' 에 렌더 분기가 없다 — 이 변형은 기본 기판으로 그려진다. 문항이 죽는다`);
      row.ok = false;
    }
  }
  // (b) 두 변형이 아무것도 다르지 않다
  const sameCss = ak.join() === bk.join() &&
    JSON.stringify(field(A, 'css')) === JSON.stringify(field(B, 'css'));
  if (am === bm && sameCss) { E(`${name}: A 와 B 가 동일하다 — 비교할 것이 없다`); row.ok = false; }

  // (c) 변수가 섞였을 수 있다 — 한 축이 여러 속성으로 표현되는 것은 정당하나 근거가 필요하다.
  //     임계를 2에서 1로 내렸다: 1회차 q01 이 --sh 와 --bd 를 함께 바꿔(정확히 2개)
  //     경고를 피했고, 그 결과 '그림자 선호'로 읽은 것이 실은 '테두리 선호'였다
  //     (2회차 c01 이 테두리를 고정해 다시 물으니 '차이 없음'이 나왔다).
  const Cblk = field(blk, 'C');
  const three = !!Cblk;   // C 변형이 있으면 이미 3수준이다 — 규칙 7 을 지켰다
  const NUM = /^-?[\d.]+(px|rem|em|%|vw|vh|s|ms)?$/;
  const valOf = (b, key) => {
    const c = b && field(b, 'css'); if (!c) return null;
    const m = new RegExp(`'${key.replace(/[-]/g, '\\-')}'\\s*:\\s*'([^']*)'`).exec(c);
    return m ? m[1].trim() : null;
  };
  // 6회차에 4수준 축이 들어왔다 — D 변형의 css 도 변수 집계에 넣는다.
  const Dblk = field(blk, 'D');
  const ck = cssKeys(field(Cblk || '{}', 'css')).concat(cssKeys(field(Dblk || '{}', 'css')));
  // **값이 다른 키**만 센다. 세 수준에서 같은 값으로 고정한 속성은 변수가 아니다 —
  // 4회차 `rhythmM` 이 `--gb:8px` 를 세 수준에 똑같이 두는데 초판은 그것도 변수로 셌다.
  const variants = [A, B, Cblk, Dblk].filter(Boolean);
  const touched = new Set([...ak, ...bk, ...ck].filter((k) => {
    const vals = variants.map((x) => valOf(x, k));
    return new Set(vals).size > 1;
  }));
  if (touched.size > 1) W(`${name}: css 속성 ${touched.size}개가 변형마다 다르다 (${[...touched].join(', ')}) — 한 축인지 확인한다. 아니면 답이 어느 속성 때문인지 알 수 없다`);
  if ((am || bm) && touched.size > 0) W(`${name}: mod 와 css 를 함께 쓴다 — 변수가 섞이기 쉽다`);

  // (e) 연속량을 두 점으로 묻고 있지 않은가.
  //     2회차 m02·m07 이 '문항오류'로 반려됐다 — "1은 너무 작고 2는 너무 크다".
  for (const k of touched) {
    const av = valOf(A, k), bv = valOf(B, k);
    if (!three && av && bv && NUM.test(av) && NUM.test(bv) && av !== bv)
      W(`${name}: '${k}' 가 연속량이다 (${av} ↔ ${bv}) — 두 점만 보여 주면 둘 다 범위 밖일 때 답할 수 없다. 3수준 이상을 권한다`);
  }

  row.mods = [am, bm]; row.css = [...touched];
  report.push(row);
}

// ── 3-4. 자극이 한쪽 테마에서 죽지 않는가 ─────────────────────────────────
// 6회차 준비 중 실측으로 나온 결함이다. `ink` 축(1회차 q03 · 5회차 P03)은
// `--i1/--i2/--i3` 를 **고정 hex** 로 덮었다. 그런데 기판 `.spec` 은
// `--i1:var(--ink-1)` 로 선언돼 있어 그 토큰은 **테마와 함께 뒤집히기로 되어 있는 값**이다.
// 고정 hex 로 덮으면 나머지 기판만 뒤집히고 잉크는 고정된다 →
// dark 테마에서 `--i1 #17191a` 가 카드 바탕 `#1b2026` 위에 얹혀 **1.08:1** 이 됐다.
// 두 변형 모두 보이지 않는 상태로 2회 일관 {sure} 판정을 받았다.
//
// 그래서 묻는다: **이 고정색은 어느 테마의 값인가, 그리고 축이 그 테마를 고정했는가.**
// 테마별 값 중 휘도가 가까운 쪽을 그 색의 소속 테마로 본다.
// `force` 가 없으면 반대 테마에서 자극이 죽고, `force` 가 어긋나면 지금 죽는다.
{
  const styleSrc = (() => {
    const out = [];
    for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) out.push(m[1]);
    return out.join('\n');
  })();
  const blockOf = (sel) => {
    const i = styleSrc.indexOf(sel);
    if (i < 0) return '';
    const s = styleSrc.indexOf('{', i);
    let d = 0;
    for (let j = s; j < styleSrc.length; j++) {
      if (styleSrc[j] === '{') d++;
      else if (styleSrc[j] === '}') { d--; if (!d) return styleSrc.slice(s + 1, j); }
    }
    return '';
  };
  const decls = (blk) => {
    const o = {};
    for (const m of blk.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) o[m[1]] = m[2].trim();
    return o;
  };
  const THEME = { light: decls(blockOf(':root')), dark: decls(blockOf(':root[data-theme="dark"]')) };

  // 기판이 테마 토큰에서 끌어오는 별칭: `--i1:var(--ink-1)`
  const alias = {};
  for (const m of styleSrc.matchAll(/(--[\w-]+)\s*:\s*var\(\s*(--[\w-]+)\s*\)/g)) alias[m[1]] = m[2];

  const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const rgb = (v) => {
    const m = String(v).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const lum = (v) => { const c = rgb(v); if (!c) return null;
    const [R, G, B] = c.map((x) => srgb(x / 255)); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
  const cr = (a, b) => { const la = lum(a), lb = lum(b); if (la === null || lb === null) return null;
    const [hi, lo] = la > lb ? [la, lb] : [lb, la]; return (hi + 0.05) / (lo + 0.05); };

  for (const [name, blk] of Object.entries(axes)) {
    const force = (blk.match(/force\s*:\s*'([^']+)'/) || [])[1] || null;
    for (const side of ['A', 'B', 'C', 'D']) {
      const vb = field(blk, side); if (!vb) continue;
      const cblk = field(vb, 'css'); if (!cblk) continue;
      for (const m of cblk.matchAll(/'(--[\w-]+)'\s*:\s*'(#[0-9a-fA-F]{3,6})'/g)) {
        const [, key, val] = m;
        const tgt = alias[key]; if (!tgt) continue;                 // 테마 토큰에서 오지 않는다 → 상관없음
        const lv = THEME.light[tgt], dv = THEME.dark[tgt];
        if (!lv || !dv || lum(lv) === null || lum(dv) === null) continue;
        // 이 고정색은 어느 테마의 값에 가까운가
        const belongs = Math.abs(lum(val) - lum(lv)) <= Math.abs(lum(val) - lum(dv)) ? 'light' : 'dark';
        const other = belongs === 'light' ? 'dark' : 'light';
        // 반대 테마에서 같은 역할의 배경과 얼마나 붙는가 — 배경 역할 토큰을 기판에서 찾는다
        const bgAlias = Object.entries(alias).find(([, t]) => /overlay|surface|ground|bg/i.test(t));
        const bgTok = bgAlias ? bgAlias[1] : null;
        const bgOther = bgTok ? THEME[other][bgTok] : null;
        const r = bgOther ? cr(val, bgOther) : null;
        const detail = r ? ` — ${other} 테마에서 ${val} 대 ${bgOther} 는 ${r.toFixed(2)}:1 이다` : '';
        if (!force) {
          E(`${name}.${side}: '${key}' 를 고정색 ${val} 로 덮었는데 기판은 '${key}:var(${tgt})' 로 ` +
            `테마에 따라 뒤집히기로 선언돼 있다. 이 색은 ${belongs} 테마의 값이고 축에 force 가 없다 → ` +
            `${other} 테마에서 자극이 죽는다${detail}. force:'${belongs}' 를 붙이거나 변형을 토큰으로 적는다`);
        } else if (force !== belongs) {
          E(`${name}.${side}: '${key}' 고정색 ${val} 는 ${belongs} 테마의 값인데 축은 force:'${force}' 다 ` +
            `— 지금 이 조합에서 자극이 죽는다${detail}`);
        }
      }
    }
  }
}

// ── 3-5. 문서 구조 ─────────────────────────────────────────────────────────
// `</script>` 가 여러 개면 **첫 번째에서 스크립트가 끊긴다.** 끝에 모여 있으면
// 브라우저가 무시해 증상이 없지만, 조각을 붙여 만들 때 바로 이것에 걸린다(4회차 조립).
{
  const closes = [...src.matchAll(/<\/script>/g)].map((m) => m.index);
  if (closes.length > 1) {
    const lastScriptStart = src.lastIndexOf('<script');
    const mid = closes.filter((i) => i > lastScriptStart && i < src.length - 40);
    if (mid.length) E(`\`</script>\` 가 ${closes.length}개이고 일부가 문서 중간에 있다 — 스크립트가 거기서 끊긴다`);
    else W(`\`</script>\` 가 ${closes.length}개다 (끝에 모여 있어 증상은 없지만 정리한다)`);
  }
}

// ── 4. 출제 순서 검사 ──────────────────────────────────────────────────────
const order = [...src.matchAll(/\{\s*id\s*:\s*'([^']+)'\s*,\s*ax\s*:\s*'([^']+)'([^}]*)\}/g)]
  .map((m) => ({ id: m[1], ax: m[2], rest: m[3] }));
if (!order.length) E('ORDER 를 찾지 못했다');
const ids = new Set();
for (const o of order) {
  if (ids.has(o.id)) E(`출제 순서에 id '${o.id}' 가 중복이다`);
  ids.add(o.id);
  if (!axes[o.ax]) E(`'${o.id}' 가 없는 축 '${o.ax}' 를 참조한다`);
  if (/flip\s*:\s*true/.test(o.rest)) {
    const of = o.rest.match(/of\s*:\s*'([^']+)'/);
    const past = /past\s*:\s*true/.test(o.rest);
    if (!of) E(`'${o.id}' 는 flip 인데 of(원 문항)가 없다 — 일관성 검정이 성립하지 않는다`);
    // past:true = **이전 회차** 문항을 뒤집는 것이다. 그 문항은 이 파일에 없고 db 에 있다.
    // 집계기는 축 단위로 전 회차를 묶어 보므로 쌍이 성립한다(retestOf + leftIs 차이).
    // 이 파일만 보는 lint 는 축 일치를 확인할 수 없으므로 형식만 본다.
    else if (past) {
      if (ids.has(of[1])) E(`'${o.id}' 가 past:true 인데 of '${of[1]}' 가 이 회차에도 있다 — 둘 중 하나가 틀렸다`);
    }
    else if (!ids.has(of[1])) E(`'${o.id}' 의 of '${of[1]}' 가 앞에 출제되지 않았다 (이전 회차 문항이면 past:true 를 붙인다)`);
    else if (order.find((x) => x.id === of[1]).ax !== o.ax)
      E(`'${o.id}' 와 원 문항 '${of[1]}' 의 축이 다르다 — 재출제가 아니다`);
  }
}
// 같은 축을 flip 없이 두 번 출제하면 좌우 교환 없는 중복이다.
// 2회차에서 drama 축을 3수준으로 교체하며 m02 를 빼지 않아 m02=m12 가 됐다.
// 해롭지는 않았지만(재확인이 됐다) 의도한 것인지 밝혀야 한다.
{
  const byAx = {};
  for (const o of order) {
    const flip = /flip\s*:\s*true/.test(o.rest);
    if (!flip) (byAx[o.ax] = byAx[o.ax] || []).push(o.id);
  }
  for (const [ax, ids] of Object.entries(byAx))
    if (ids.length > 1) W(`축 '${ax}' 를 flip 없이 ${ids.length}번 출제한다 (${ids.join(', ')}) — 좌우 교환 없는 중복이다. 재확인 의도가 아니면 하나를 뺀다`);
}
const retests = order.filter((o) => /flip\s*:\s*true/.test(o.rest)).length;
// 3수준 축은 가운데가 고정이라 좌우 교환이 성립하지 않는다 — 분모에서 뺀다.
// 그 축의 위치 효과는 **순서를 뒤집어 재출제**하는 것으로 배제한다(4회차 S1~S11).
const flippable = order.filter((o) => !/\bC\s*:/.test(axes[o.ax] || '')).length;
if (!retests && flippable)
  E('2수준 문항이 있는데 일관성 검정이 없다 — 위치 효과와 취향을 구분할 수 없다');
else if (flippable && retests / flippable < 0.15)
  W(`일관성 검정이 ${retests}/${flippable}(2수준 문항 기준) 뿐이다 — 20% 내외를 권한다`);

// 모드 분포 — 모드별 표본이 0 이면 그 모드에 대해 아무것도 말할 수 없다
const modes = {};
for (const o of order) {
  let m = (axes[o.ax] || '').match(/mode\s*:\s*'([^']+)'/);
  if (!m) {
    // 축이 래퍼 헬퍼로 선언되면 mode 가 헬퍼 쪽에 있다 — 그 축이 쓰는 헬퍼를 찾아 본다.
    const w = new RegExp(`\\b${o.ax}\\s*:\\s*([A-Za-z_$][\\w$]*)\\(`).exec(axBlock);
    if (w) {
      const h = new RegExp(`\\b(?:const|let|var)\\s+${w[1]}\\s*=[^;]*?mode\\s*:\\s*'([^']+)'`, 's').exec(src);
      if (h) m = h;
    }
  }
  if (m) modes[m[1]] = (modes[m[1]] || 0) + 1;
}
for (const m of ['tool', 'consumer', 'marketing', 'graphic'])
  if (!modes[m]) W(`모드 '${m}' 문항이 0건 — 이 회차는 그 모드에 대해 아무것도 말하지 않는다`);

// ── 5. 출력 ───────────────────────────────────────────────────────────────
if (asJson) {
  console.log(JSON.stringify({ file: basename(file), axes: report, order: order.length, retests, modes, errs, warns }, null, 2));
} else {
  console.log(`[probe-lint] ${basename(file)} — 축 ${Object.keys(axes).length}개 · 문항 ${order.length}개 · 일관성 검정 ${retests}건`);
  console.log(`  모드 분포: ${['tool','consumer','marketing','graphic'].map((m) => `${m} ${modes[m] || 0}`).join(' · ')}`);
  for (const e of errs) console.log(`  ❌ ${e}`);
  for (const w of warns) console.log(`  ⚠️  ${w}`);
  console.log(errs.length ? `\n출제 불가 — 결함 ${errs.length}건` : `\n출제 가능${warns.length ? ` (경고 ${warns.length}건)` : ''}`);
}
process.exit(errs.length ? 1 : 0);
