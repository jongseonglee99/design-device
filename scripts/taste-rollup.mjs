#!/usr/bin/env node
// taste-rollup — 취향 판정을 집계한다. **손으로 세지 않는다.**
//
// 왜 있나: `system/taste-measurements.md` 초판에서 "11건"이라 적고 19개 축을 나열했다.
// 손으로 센 것이 원인이고, 같은 종류의 느슨함을 관측 #1012(허영 지표)가 지목한다.
// 이제 db 사본에서 계산한다.
//
// 판정 사본 받기:
//   ArtifactData action=list collection=judgments out_dir=<dir>  (회차별로)
// 사용:
//   node scripts/taste-rollup.mjs <회차디렉토리...> [--json]
// 종료 코드: 0 = 집계 성공, 2 = 사용법/입력 오류

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
// `--probes <파일>` 의 값은 판정 디렉토리가 아니다 — 분리해서 센다
const probeArgs = new Set();
for (let i = 0; i < args.length - 1; i++) if (args[i] === '--probes') probeArgs.add(args[i + 1]);
const dirs = args.filter((a) => !a.startsWith('--') && !probeArgs.has(a));
if (!dirs.length) {
  console.error('사용법: node scripts/taste-rollup.mjs <판정 디렉토리...> [--probes <측정기.html>]... [--json]');
  process.exit(2);
}

// ── 판정 읽기 ─────────────────────────────────────────────────────────────
const J = [];
for (const d of dirs) {
  let root = resolve(d);
  if (!existsSync(root)) { console.error(`경로 없음: ${root}`); process.exit(2); }
  // out_dir 아래에 judgments/ 가 한 겹 더 있는 형태를 모두 받는다
  const sub = join(root, 'judgments');
  if (existsSync(sub) && statSync(sub).isDirectory()) root = sub;
  const round = basename(resolve(d));
  for (const f of readdirSync(root).filter((x) => x.endsWith('.json'))) {
    const raw = JSON.parse(readFileSync(join(root, f), 'utf8'));
    // 저장 형태가 {id, data:{...}} 이거나 평평한 문서일 수 있다
    const v = raw.data && typeof raw.data === 'object' ? raw.data : raw;
    if (!v || !v.id) continue;
    J.push({ round, ...v });
  }
}
// ── 같은 판정이 여러 스냅샷에 들어 있다 — id 로 묶고 최신만 남긴다 ────────
// db 사본을 회차마다 떠 왔더니 `r3b ⊃ r3` · `r4c ⊃ r4b` 처럼 포함 관계가 생겼고,
// `S9` 한 건이 세 디렉토리에 있어 **판정 수가 부풀고** 이력이 `S9/S9/S9` 로 찍혔다.
// id 는 측정기 전체에서 유일하므로 id 가 정체성이다. 수정분이 있으면 ts 가 큰 쪽이 정본이다.
{
  const byId = new Map();
  for (const j of J) {
    const prev = byId.get(j.id);
    if (!prev || (j.ts || 0) >= (prev.ts || 0)) byId.set(j.id, j);
  }
  const dropped = J.length - byId.size;
  J.length = 0;
  J.push(...byId.values());
  if (dropped) J.dupDropped = dropped;
}
if (!J.length) { console.error('판정이 하나도 없다'); process.exit(2); }

// ── 측정기 정의를 읽어 슬롯 글자를 값으로 해석한다 ─────────────────────────
// db 에는 pick 이 'A'/'B'/'C' 로만 남는다. 3수준 **순서 뒤집기**는 슬롯이 아니라
// **값**을 비교해야 판정된다(4회차 S6: g09 는 C=3색, S6 은 B=2색 — 슬롯만 보면 다르고
// 값으로 보면 선호가 바뀐 것이다). 그래서 측정기 HTML 에서 변형 이름을 읽어 온다.
// 측정기를 안 주면 pickLabel 필드가 있는 판정만 해석된다.
const probeFiles = [...probeArgs];
const SLOT = new Map();   // id -> {A,B,C} 변형 이름
for (const f of probeFiles) {
  if (!existsSync(f)) { console.error(`측정기 없음: ${f}`); process.exit(2); }
  const src = readFileSync(f, 'utf8');
  const cut = (from) => {
    const a = src.indexOf('{', src.indexOf('=', from));
    let d = 0;
    for (let j = a; j < src.length; j++) {
      if (src[j] === '{') d++;
      else if (src[j] === '}') { d--; if (!d) return src.slice(a + 1, j); }
    }
    return '';
  };
  const axBlk = cut(src.search(/const\s+AX\s*=\s*\{/));
  // 깊이 0 에서만 축을 읽는다(probe-lint 와 같은 방식)
  const axes = {};
  { let d = 0, i = 0;
    while (i < axBlk.length) {
      const c = axBlk[i];
      if (c === '{') { d++; i++; continue; }
      if (c === '}') { d--; i++; continue; }
      if (d === 0) {
        const m = /^([A-Za-z_$][\w$]*)\s*:\s*(?:[A-Za-z_$][\w$]*\(\s*)?\{/.exec(axBlk.slice(i));
        if (m && (i === 0 || /[\s,{]/.test(axBlk[i - 1]))) {
          const k = i + m[0].length - 1; let dd = 0;
          for (let j = k; j < axBlk.length; j++) {
            if (axBlk[j] === '{') dd++;
            else if (axBlk[j] === '}') { dd--; if (!dd) { axes[m[1]] = axBlk.slice(k, j + 1); i = j; break; } }
          }
        }
      }
      i++;
    } }
  const nameOf = (blk, slot) => {
    const re = new RegExp(`\\b${slot}\\s*:\\s*\\{[^}]*?\\bn\\s*:\\s*'([^']*)'`, 's');
    const m = re.exec(blk); return m ? m[1] : null;
  };
  for (const m of src.matchAll(/\{\s*id\s*:\s*'([^']+)'\s*,\s*ax\s*:\s*'([^']+)'/g)) {
    const blk = axes[m[2]]; if (!blk) continue;
    // 4수준 축이 6회차에 들어왔다 — 슬롯을 D 까지 읽는다. 없으면 null 로 떨어진다.
    SLOT.set(m[1], { A: nameOf(blk, 'A'), B: nameOf(blk, 'B'),
                     C: nameOf(blk, 'C'), D: nameOf(blk, 'D') });
  }
}
// 판정에 값 이름을 채운다 — pickLabel 이 있으면 그것을, 없으면 측정기에서 해석한다
for (const j of J) {
  if (!j.pickLabel && SLOT.has(j.id)) j.pickLabel = (SLOT.get(j.id) || {})[j.pick] || null;
  if (!j.levels && SLOT.has(j.id)) {
    const v = SLOT.get(j.id);
    j.levels = ['A','B','C','D'].filter((k) => v[k]).map((k) => v[k]).join(' | ');
  }
}

// ── 축 혈통 — 재출제하면 이름이 바뀐다. 같은 축으로 묶는다 ────────────────
// "(범위 이동)" "(순서 뒤집음)" "(밝은 테마)" 같은 꼬리표와 모드 접미사를 떼어 정규화한다.
// 꼬리표는 **괄호 안의 조각 단위**로 뗀다. 초판은 괄호 전체가 한 꼬리표일 때만
// 떼어서 `(tool · 3수준)` 을 못 봤고, 그 결과 같은 축을 둘로 셌다 —
// 여백 배율·리스트 밀도·타이포 스케일·제목·본문 대비 네 쌍이 중복 계수됐다.
const TAG = /^(?:범위\s*이동|범위\s*확대|순서\s*뒤집음|구간\s*좁힘|양수\s*쪽|대비\s*강화|규정\s*시험|중앙|끝값\s*교차|대면적\s*고정|밝은\s*테마.*|어두운\s*테마.*|\d수준|consumer|tool|marketing|graphic)$/;
// 이름만 다르고 같은 것을 묻는 축 — 정규식으로는 묶이지 않는다.
const ALIAS = { '제목·본문 크기 대비': '제목·본문 대비', '타이포 스케일 비율': '타이포 스케일' };
const canon = (axis) => {
  let a = axis.replace(/\s*\(([^)]*)\)/g, (m, inner) => {
    const keep = inner.split(/·|,/).map((x) => x.trim()).filter((x) => x && !TAG.test(x));
    return keep.length ? ` (${keep.join(' · ')})` : '';
  });
  a = a.replace(/\s*·\s*규정\s*시험/g, '').replace(/\s+/g, ' ').trim();
  return ALIAS[a] || a;
};

// ── 축 단위로 묶는다 ──────────────────────────────────────────────────────
// 같은 축을 여러 id 로 물을 수 있다(flip 재출제, 수정 후 새 id, 중복 출제).
// axis 문자열이 축의 정체성이다 — 측정기가 그렇게 기록한다.
const byAxis = new Map();
for (const j of J) {
  const k = `${j.mode}|${canon(j.axis)}`;
  if (!byAxis.has(k)) byAxis.set(k, { mode: j.mode, axis: canon(j.axis), rows: [] });
  byAxis.get(k).rows.push(j);
}

// 요건 3 은 **색·명암·표면 축에만** 적용된다 — 정렬·여백·크기는 테마와 무관하다.
// 초판은 dark 전용 판정 전부를 보류시켜 `graphic 정렬` 을 잘못 막았다.
const THEME_SENSITIVE = /그림자|명암|표면|색|채도|램프|반전/;

// 요건 2(1변수)는 판정 데이터에 없다 — 문항 **정의** 쪽이고 probe-lint 가 본다.
// 그래서 probe-lint 가 찾아낸 다변수 축을 여기에 기록해 join 한다.
// 이 표가 비어 있으면 집계기는 교란된 문항을 '통과' 로 내보낸다(초판이 그랬다).
// `dead` 는 **그 정의·기판으로 받은 판정의 id** 다. `'all'` 은 아직 재측정이 없다는 뜻이다.
// 왜 축 이름만으로 막지 않는가 — 결함을 고치고 다시 물으면 같은 축에 **유효한 판정**이
// 생긴다. 축을 영구히 무효로 두면 그 재측정이 원장에 안 보인다. 5회차 `유채색 면적` 이
// 그 경우다: 기판을 고쳐 `N03`/`xN03` 로 다시 물었고 그 둘은 살아 있는 측정이다.
const MULTIVAR = {
  'tool|그림자 양': { why: '2변수 — `--sh` 와 `--bd` 를 함께 바꿨다 (관측 r2 §③, 철회됨)', dead: 'all' },
  // 4회차-재출제: 그림자 문항 네 건이 모두 '한 요소의 그림자 복잡도' 를 물었다.
  // decision-logic 이 말하는 것은 **채널의 단계 수**이고 둘은 다르다(관측 r4b, 승인 #31 D).
  'consumer|그림자 양': { why: '축 정의 오류 — 복잡도를 물었는데 규정은 단계 수를 말한다 (관측 r4b)', dead: 'all' },
  'graphic|표면 채널': { why: '축 정의 오류 — 0단계 vs 1단계를 물었다. §3 이 금지한 중간 상태다 (관측 r4b, #29 철회)', dead: 'all' },
  // 사용자가 문항 틀 자체를 거부했다 — 선호가 맥락에 의존한다(규칙 11).
  'graphic|명암 반전': { why: '맥락 의존 — 사용자가 "상황에 따라 다른거다" 로 반려 (관측 r4b)', dead: 'all' },
  // 2026-10-11 정정. r4b 는 '밝은 테마에서 14% 혼합이 안 보였다' 로 적었는데 그게 아니다.
  // `.sec.alt` 클래스가 divBg 일 때만 붙어서, accL 이 --secbg 를 세팅해도 읽는 요소가
  // 없었다. 두 변형이 **똑같이 그려졌다** — 1~4회차 여섯 판정 전부가 죽은 문항이다.
  // 2026-W42 실측. 5회차가 표면 축을 0단계 vs 3단계로 다시 정의해 `#29` 의 결함은
  // 닫았는데, **다른 변수 둘이 같이 들어가 있었다.** 헤드리스 렌더로 쟀다 —
  //   ① 측정폭: `.post.surf0{padding:… 22px}` vs `.post.surf3{padding:18px}` +
  //      `.s3b{padding:20px 16px}` → 제목 칼럼이 24px 차이 나 **조판이 달라졌다**
  //      (A 4행 / B 5행). ② `.prule`(악센트 구분선)이 surf0 에만 있었다 — 색 채널 하나.
  // 6회차(G03/G04)가 둘을 맞추고 다시 묻는다. 측정 후 제목 칼럼 198.0 / 198.0 · 행폭 동일.
  'graphic|표면 채널 단계 수': {
    why: '2변수 — 표면 단계와 함께 측정폭(제목 칼럼 24px 차)·구분선이 바뀌었다 (관측 2026-10-12)',
    dead: ['N01', 'xN01'] },
  'marketing|유채색 면적': { why: '죽은 문항 — accSmall/accLarge 가 동일하게 렌더됐다 (.sec.alt 가 divBg 에만 붙었다)',
    dead: ['m03', 'n03', 'm15', 'n15', 'L4', 'F4'] },
};

const R = [];
for (const { mode, axis, rows: allRows } of byAxis.values()) {
  allRows.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  // 죽은 세대(정의 오류·죽은 문항)를 먼저 떼어 낸다. 남은 판정이 없으면 축이 무효이고,
  // 남아 있으면 **그 판정만으로** 평가한다 — 고친 뒤의 재측정이 원장에 보여야 한다.
  const mv = MULTIVAR[`${mode}|${axis}`];
  const isDead = (r) => mv && (mv.dead === 'all' || mv.dead.includes(r.id));
  const deadRows = mv ? allRows.filter(isDead) : [];
  const rows = allRows.filter((r) => !isDead(r));
  if (mv && !rows.length) {
    R.push({ mode, axis, status: '무효', reason: mv.why, ids: deadRows.map((r) => r.id),
      n: deadRows.length, pick: null, consist: null, ties: 0, bads: 0,
      threeLevel: false, themes: [...new Set(deadRows.map((r) => r.forcedTheme || r.theme).filter(Boolean))],
      strengths: deadRows.map((r) => r.strength).filter(Boolean) });
    continue;
  }
  const picks = rows.map((r) => r.pick);
  const real = rows.filter((r) => !['tie', 'bad'].includes(r.pick));
  const flips = rows.filter((r) => r.retestOf);
  // 실효 테마 — 기판이 고정했으면(forcedTheme) 그것이 자극의 테마다.
  // 페이지 테마(theme)는 자극이 아니라 주변 맥락이다(4회차 force:'light' 가 그 구분을 만들었다).
  const themes = [...new Set(rows.map((r) => r.forcedTheme || r.theme).filter(Boolean))];

  // 일관성: flip 재출제가 있고, 그 쌍이 같은 변형을 가리키며, 위치가 서로 달랐는가.
  // pick 은 위치가 아니라 변형 키라서 이 판정이 성립한다.
  let consist = null;
  for (const f of flips) {
    const base = rows.find((r) => r.id === f.retestOf);
    if (!base || ['tie', 'bad'].includes(base.pick) || ['tie', 'bad'].includes(f.pick)) continue;
    const posDiffer = base.leftIs !== f.leftIs;
    consist = (base.pick === f.pick) && posDiffer ? 'pass'
      : (base.pick === f.pick) ? 'same-position' : 'fail';
  }

  // 요건 6 — 일관성 검정 통과가 지각을 보장하지 않는다.
  // 4회차 F1/xF1 이 위치를 건너가 두 번 같은 변형을 골랐는데 「차이를 모르겠다」 였다.
  const strengths = rows.map((r) => r.strength).filter(Boolean);
  const weak = strengths.length && strengths.every((x) => x === 'none' || x === 'weak');
  // 「왜」 칸의 자기 보고도 본다 — 강도 필드를 넣기 전 판정은 그것만이 단서다
  const saidNoDiff = rows.some((r) => /차이.*(모르|못\s*느)|똑같|같게\s*느/.test(r.why || ''));

  const ties = rows.filter((r) => r.pick === 'tie').length;
  const bads = rows.filter((r) => r.pick === 'bad').length;
  // 'threeLevel' 은 **3수준 이상**을 뜻한다 — 6회차의 4수준 축(D 슬롯)도 여기로 들어온다.
  const threeLevel = picks.some((p) => p === 'C' || p === 'D') ||
    rows.some((r) => (r.levels || '').split('|').length >= 3);

  // ── 3수준 축의 요건 1 — 순서 뒤집기가 flip 등가물이다 ────────────────────
  // 3수준은 가운데가 고정이라 좌우 교환이 성립하지 않는다. 그래서 4회차는
  // **순서를 뒤집어** 재출제했고 그것이 위치 효과를 실제로 잡아냈다
  //   g09 (1/2/3) → 3색(끝값) · S6 (3/2/1) → 2색(중간) = 위치 효과였다
  // 초판은 `retestOf` 만 봐서 이 측정을 전부 '미검증' 으로 셌다 — 확정 7축을 포함해서다.
  // 비교는 슬롯 글자가 아니라 **고른 값**으로 한다. 순서가 다르면 글자가 달라진다.
  const numOf = (lbl) => { const m = /-?[\d.]+/.exec(lbl || ''); return m ? parseFloat(m[0]) : null; };
  const valKey = (lbl) => { const n = numOf(lbl); return n === null ? (lbl || '').trim() : n; };
  const posOf = (r) => {                       // 그 판정에서 고른 값이 몇 번째였나
    const lv = (r.levels || '').split('|').map((x) => x.trim());
    const i = lv.findIndex((x) => valKey(x) === valKey(r.pickLabel));
    return i < 0 ? null : (i === 0 || i === lv.length - 1 ? 'edge' : 'mid');
  };
  //
  // ⚠ 이 검정의 한계 — **순서 뒤집기는 끝값 편향만 잡는다.**
  // 가운데는 뒤집어도 가운데다. 그래서 '항상 중간을 고르는' 중앙 편향은
  // 이 방법으로 배제되지 않는다. 끝값 편향(g09 가 마지막 위치의 3색을 고른 것)은 잡는다.
  // 중앙 편향을 배제하려면 수준 수를 4로 올리거나 범위를 옮겨 가운데 값을 바꿔야 한다.
  const setOf = (r) => (r.levels || '').split('|').map((x) => String(valKey(x.trim()))).sort().join(',');
  let orderConsist = null, orderNote = '';
  if (threeLevel) {
    const withLv = real.filter((r) => r.levels && r.pickLabel);
    // ① 같은 값 집합을 다른 순서로 — 이것만이 진짜 순서 뒤집기 쌍이다.
    //    범위가 다른 문항은 '범위 탐색' 이고 일관성 검정이 아니다.
    //    초판은 범위가 다른 것까지 한 비교에 넣어 제목 크기·자간을 잘못 갈랐다.
    const bySet = new Map();
    for (const r of withLv) { const k = setOf(r); if (!bySet.has(k)) bySet.set(k, []); bySet.get(k).push(r); }
    for (const [, g] of bySet) {
      if (g.length < 2) continue;
      if ([...new Set(g.map((r) => r.levels))].length < 2) continue;   // 순서가 같으면 중복 출제다
      const vals = [...new Set(g.map((r) => String(valKey(r.pickLabel))))];
      if (vals.length === 1) {
        orderConsist = 'pass';
        orderNote = `같은 수준을 다른 순서로 물어 같은 값(${g[0].pickLabel}) — ${g.map((r) => r.id).join('/')}`;
      } else {
        orderConsist = 'mismatch';
        const mids = g.filter((r) => posOf(r) === 'mid');
        orderNote = mids.length === 1
          ? `순서를 바꾸니 답이 갈렸다 — 중간값을 고른 것은 ${mids[0].id}(${mids[0].pickLabel}) 하나뿐이다`
          : `순서를 바꾸니 답이 갈렸다 — ${g.map((r) => r.id + ':' + r.pickLabel).join(' · ')}`;
      }
      break;
    }
    // ② 양방향 경계 일치 (관측 r4 「규칙 9 보강」) — 범위가 다르지만 경계를 공유하고
    //    양쪽이 그 경계를 골랐다. 끝값이어도 확정이다: 두 범위의 합집합에서는 내부값이다.
    //      g02 (0/-.03/-.06) → 0 · S5 (0/+.02/+.05) → 0
    //
    //    비교 대상은 **그 값을 제시한 문항만**이다. 후보값이 선택지에 없던 문항은
    //    그 값에 대해 아무것도 말하지 않는다 — 초판은 그것까지 넣어 자간·바깥 여백을
    //    미검증으로 떨어뜨렸다(g15 는 0 을 아예 제시하지 않은 범위였다).
    if (!orderConsist && withLv.length >= 2) {
      const cand = valKey(withLv[withLv.length - 1].pickLabel);     // 최신 판정의 값
      const offered = withLv.filter((r) =>
        (r.levels || '').split('|').some((x) => valKey(x.trim()) === cand));
      const sets = [...new Set(offered.map(setOf))];
      const allPicked = offered.length >= 2 && offered.every((r) => valKey(r.pickLabel) === cand);
      if (allPicked && sets.length >= 2) {
        const all = withLv.flatMap((r) => (r.levels || '').split('|').map((x) => valKey(x.trim())))
                          .filter((x) => typeof x === 'number');
        const interior = typeof cand === 'number' && all.length >= 3 &&
                         cand > Math.min(...all) && cand < Math.max(...all);
        if (interior) {
          orderConsist = 'pass';
          orderNote = `범위 ${sets.length}종이 ${withLv[withLv.length-1].pickLabel} 에서 만났다` +
            ` — 제시될 때마다 선택됐고(${offered.map((r) => r.id).join('/')}) 합집합 안에서 내부값이다`;
        } else if (typeof cand === 'number') {
          orderConsist = 'edge-converge';
          orderNote = `제시될 때마다 선택됐지만(${offered.map((r) => r.id).join('/')})` +
            ` 전 범위의 끝값이다 — 더 바깥을 봐야 한다`;
        }
      }
    }
  }
    if (!consist && orderConsist)
    consist = orderConsist === 'pass' ? 'pass-order'
            : orderConsist === 'edge-converge' ? 'edge-converge' : 'order-mismatch';

  // ── 끝값 판정 — 범위 **합집합** 기준이다 (관측 r4 「규칙 9 보강」) ────────
  // 한쪽 범위에서 끝값이어도, 반대쪽 범위에서 같은 경계를 골랐으면 그 값은
  // 두 범위의 합집합 안에서 내부값이다. 제목 자간이 그 사례다 —
  //   g02 (0/-.03/-.06) → 0 · S5 (0/+.02/+.05) → 0 = 0 확정
  // 초판은 '마지막 판정의 슬롯이 A 또는 C 인가' 만 봐서 이것을 범위보류로 묶었다.
  let edge = false;
  if (threeLevel && real.length) {
    const lvls = real.flatMap((r) => (r.levels || '').split('|').map((x) => valKey(x.trim())))
                     .filter((x) => typeof x === 'number');
    const chosen = valKey(real[real.length - 1].pickLabel);
    if (typeof chosen === 'number' && lvls.length >= 3) {
      edge = !(chosen > Math.min(...lvls) && chosen < Math.max(...lvls));
    } else {
      // 값을 못 읽으면 슬롯으로 떨어진다. 끝 슬롯은 수준 수에 따라 다르다 —
      // 3수준이면 A·C, 4수준이면 A·D 다. 이 판정의 levels 개수로 센다.
      const last = real[real.length - 1];
      const n = (last.levels || '').split('|').filter((x) => x.trim()).length;
      edge = [ 'A', 'ABCD'[(n >= 2 ? n : 3) - 1] ].includes(last.pick);
    }
  }

  // 상태 판정 — 요건 1·3·4 를 기계로 확인할 수 있는 만큼만 본다.
  // 요건 2(1변수)는 문항 정의 쪽이라 probe-lint 가 본다. 요건 5(모드)는 키에 들어 있다.
  // ★ 최근 회차의 재측정이 「동일」·「문항오류」 이면 예전 선호를 재확인하지 못한 것이다 (2026-10-31 — 6회차).
  // 집계는 tie·bad 를 `real` 에서 빼고 예전 판정만으로 「통과」 를 냈다: 중립색 온도(6회차 4문항 중 동일 3)와
  // 유채색 면적(문항오류 + 동일)이 그대로 통과로 남았다. 같은 축의 **가장 최근 회차**가 2/3 이상 동일·반려면 그 판정이 이긴다.
  const lastRound = rows.length ? rows[rows.length - 1].round : null;
  const latest = rows.filter((r) => r.round === lastRound);
  const latestNo = latest.filter((r) => ['tie', 'bad'].includes(r.pick));
  const olderReal = rows.filter((r) => r.round !== lastRound && !['tie', 'bad'].includes(r.pick));
  const retestRejected = olderReal.length && latest.length && latestNo.length / latest.length >= 2 / 3;
  const badWhy = latest.filter((r) => r.pick === 'bad' && r.why).map((r) => `${r.id} "${r.why}"`).join(' · ');

  let status, reason;
  if (retestRejected && latestNo.every((r) => r.pick === 'bad') && latestNo.length === latest.length)
                                  { status = '무효'; reason = `최근 회차(${lastRound}) 재측정에서 문항 반려 — ${badWhy}`; }
  else if (retestRejected)        { status = '판별불가';
                                    reason = `최근 회차(${lastRound}) 재측정 ${latest.length}문항 중 동일·반려 ${latestNo.length} — 예전 선호(${olderReal.map((r) => r.id).join('/')})를 재확인하지 못했다${badWhy ? ` · ${badWhy}` : ''}`; }
  else if (bads && !real.length)      { status = '무효';     reason = '문항 반려'; }
  else if (!real.length)          { status = '판별불가'; reason = '전부 동일/반려'; }
  else if (consist === 'fail')    { status = '무효';     reason = '위치 효과 — 변형이 달라도 같은 위치'; }
  else if (consist === 'same-position') { status = '미검증'; reason = 'flip 쌍의 위치가 같다'; }
  else if (consist === 'order-mismatch') { status = '순서불일치'; reason = orderNote; }
  else if (consist === 'edge-converge')  { status = '범위보류'; reason = orderNote; }
  else if (edge)                  { status = '범위보류'; reason = '3수준 끝값 — 최적이 범위 밖일 수 있다'; }
  else if (!consist)              { status = '미검증';
                                    reason = threeLevel
                                      ? '한 순서로만 물었다 — 순서를 뒤집어 재출제해야 한다'
                                      : 'flip 재출제 없음 — 위치 효과 미배제'; }
  else if (weak || saidNoDiff)    { status = '지각약함'; reason = saidNoDiff
                                      ? '일관되지만 사용자가 "차이를 모르겠다" 고 적었다'
                                      : '지각 강도가 약함/모르겠다'; }
  else if (THEME_SENSITIVE.test(axis) && !themes.length)
                                  { status = '테마불명'; reason = '테마 기록 전에 판정됨 — 색·명암 축은 테마를 알아야 한다'; }
  else if (THEME_SENSITIVE.test(axis) && themes.length === 1)
                                  { status = '테마보류'; reason = `${themes[0]} 에서만 측정`; }
  else                            { status = '통과';
                                    reason = consist === 'pass-order' ? `순서 뒤집기 통과 — ${orderNote}`
                                      : themes.length ? '일관성 통과' : '일관성 통과 (테마 무관 축)'; }

  if (deadRows.length)
    reason += ` · 폐기 ${deadRows.length}건(${deadRows.map((r) => r.id).join('/')}): ${mv.why}`;

  R.push({ mode, axis, status, reason, ids: rows.map((r) => r.id),
    n: rows.length, pick: real.length ? real[real.length - 1].pick : null,
    consist, ties, bads, threeLevel, themes, strengths });
}

// ── 출력 ──────────────────────────────────────────────────────────────────
const ORDER = ['통과', '테마보류', '테마불명', '범위보류', '순서불일치', '지각약함', '미검증', '판별불가', '무효'];
R.sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)
  || a.mode.localeCompare(b.mode) || a.axis.localeCompare(b.axis));

const byStatus = {}, byMode = {};
for (const r of R) {
  byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  byMode[r.mode] = (byMode[r.mode] || 0) + 1;
}

if (asJson) { console.log(JSON.stringify({ judgments: J.length, axes: R.length, byStatus, byMode, axesDetail: R }, null, 2)); }
else {
  console.log(`[taste-rollup] 판정 ${J.length}건 · 축 ${R.length}개`);
  console.log(`  모드: ${Object.entries(byMode).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  console.log(`  상태: ${ORDER.filter((s) => byStatus[s]).map((s) => `${s} ${byStatus[s]}`).join(' · ')}\n`);
  let cur = null;
  for (const r of R) {
    if (r.status !== cur) { cur = r.status; console.log(`── ${cur} (${byStatus[cur]})`); }
    const t = r.themes.length ? ` [${r.themes.join(',')}]` : '';
    const sg = r.strengths && r.strengths.length ? ` {${r.strengths.join(',')}}` : '';
    console.log(`  ${r.mode.padEnd(9)} ${r.axis.padEnd(26)} ${r.ids.join('/')}${t}${sg}  ${r.reason}`);
  }
}
