#!/usr/bin/env node
// slop-scan — AI 기본값 룩 측정 기반 검출.
//
// 기존 레포의 check-antipatterns.mjs(문자열 블록리스트)를 계승하되,
// 토큰 이름 변경·임의 hex로 우회되지 않는 *분포 측정* 검사를 추가한다.
// system/anti-patterns.md 의 "검출 자동화 후보" 7항목이 대상.
//
// 모드를 받는다. 모드 없이 채점하면 marketing/consumer/graphic 산출물이
// tool 기준으로 차단당한다. system/invariants.md Ⅱ 참조.
//
// 사용:
//   node scripts/slop-scan.mjs <경로> --mode tool|consumer|marketing|graphic [--json] [--min-samples N]
// 종료 코드: 0 = 통과, 1 = 차단(❌) 있음, 2 = 사용법 오류

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';

// ─── 모드별 가중치 (system/anti-patterns.md §모드별 가중치와 동기) ──────────
// 'block' = ❌ 차단(exit 1) · 'warn' = ⚠️ 정당화 요구 · 'info' = · 정보만 · null = — 비활성
const MODES = ['tool', 'consumer', 'marketing', 'graphic'];
const WEIGHTS = {
  //        tool      consumer   marketing  graphic
  C1: ['warn',  'warn',  'warn',  'warn'],
  C2: ['block', 'warn',  'warn',  'info'],
  C6: ['block', 'warn',  'warn',  'info'],
  S2: ['block', 'warn',  'warn',  'info'],
  S4: ['block', 'warn',  'warn',  'info'],
  S3: ['info',  'info',  'info',  null],
  S1: ['warn',  'warn',  'info',  null],
  G1: ['warn',  'warn',  'warn',  null],
  M1: ['warn',  'warn',  'warn',  null],
  T1: ['info',  'warn',  'warn',  'block'],
  I6: ['block', 'block', 'block', 'block'],
  I7: ['block', 'warn',  'block', 'info'],
  // A1 — 액센트 전용 토큰을 솔리드 채움에 쓴 것. 접근성 직결이라 전 모드 차단.
  A1: ['block', 'block', 'block', 'block'],

  // ─── 2026-10-11 — 레지스트리에 이미 승인돼 있었는데 검출기가 없던 것들 ───
  C3: ['block', 'block', 'warn',  null],
  C5: ['block', 'warn',  'warn',  'info'],
  T2: ['warn',  'warn',  'warn',  'block'],
  T3: ['warn',  'warn',  'warn',  'block'],
  M2: ['block', 'warn',  'warn',  null],
  M3: ['block', 'block', 'block', null],
  M4: ['block', 'warn',  'info',  null],
  IA3: ['block', 'info', 'warn',  null],
  I4: ['warn',  'warn',  'block', 'warn'],
  I5: ['warn',  'info',  'warn',  null],
  I8: ['block', 'info',  'warn',  'info'],

  // ─── 2026-10-12 신설 (승인 #37 B+) — anti-patterns.md 에 함께 등재했다 ───
  C7: ['block', 'warn',  'warn',  'info'],   // :root 밖 즉흥 hex·font-family
  T7: ['warn',  'warn',  'warn',  'block'],  // 측정폭 45~75ch 이탈
  G4: ['block', 'block', 'warn',  null],     // 이미지 트랙의 1fr
  M5: ['block', 'warn',  'warn',  null],     // transition-all · 레이아웃 속성 애니메이션
  IA7: ['block', 'block', 'warn', null],     // 상호작용 상태 미설계

  // ─── 2026-10-30 신설 (승인 #55 A) ───
  IA9: ['block', 'warn',  'info',  null],    // 메뉴 항목마다 설명문 (대화체 부제)
};

// ─── 기계 상한 (승인 #38 D, 2026-10-12) ────────────────────────────────────
// **규칙의 강도**와 **기계가 그 규칙을 얼마나 확신할 수 있나**는 다른 사실이다.
// 위 표는 규칙의 강도이고(= anti-patterns.md §모드별 가중치), 여기는 확신도 상한이다.
// 기계 증거가 규칙의 의도보다 약한 코드는 아무리 표가 ❌ 라도 이 등급을 넘지 않는다.
//
// 선례가 레지스트리 안에 이미 있었다 — `S2` 에 대해 §읽는 법이 산문으로 적어 둔 것:
// *"기계 검출은 기능/장식을 구분할 수 없으므로 모든 모드에서 ⚠️로만 보고한다."*
// 각주는 읽히지 않고 열은 읽힌다. 그래서 산문 예외를 **구조로 승격**한다.
//
// 각 상한의 근거를 코드에 남긴다 — 근거 없는 상한은 그냥 규칙을 약하게 만든 것이다.
const MACHINE_CAP = {
  S2:  'warn',  // 기능/장식을 구분하지 못한다 (레지스트리 §읽는 법의 원래 예외)
  C5:  'warn',  // 정규식은 "그라디언트에 연한 색이 둘"까지만 안다
  M2:  'warn',  // 같은 클래스의 반복은 세지만 그것이 전 섹션인지는 모른다
  IA3: 'warn',  // 같은 규칙 + 히어로 선택자로 좁혔지만 '정형'의 증거는 아니다
  G4:  'warn',  // 그 트랙에 이미지가 있는지를 정적으로 알 수 없다 (파일 단위 근사)
  T7:  'warn',  // `ch` 단위만 잴 수 있다. px·rem 은 폰트 크기를 알아야 환산된다
  IA7: 'warn',  // 어떤 선택자가 인터랙티브인지는 추정이다 (`:hover` 존재로 근사)
  IA9: 'warn',  // 두 번째 글줄이 설명인지 데이터(마지막 수정 시각 등)인지는 모른다
  C7:  'warn',  // **값과 데이터를 구분하지 못한다** — 색 비교 페이지는 hex 를 비교 대상으로 싣는다
};
const RANK = { block: 3, warn: 2, info: 1 };
/** 표의 등급을 기계 상한으로 누른다. 상한이 없으면 표 그대로다. */
function applyCap(code, sev) {
  const cap = MACHINE_CAP[code];
  if (!sev || !cap) return sev;
  return RANK[sev] > RANK[cap] ? cap : sev;
}


const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.scss', '.html']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.next', '.vite', 'coverage', 'reference']);
// 생성물은 스캔하지 않는다 — **소스를 스캔한다.**
// `review.html` 은 `build-review.mjs` 가 아트보드를 한 파일로 모은 것이고(gitignore 됨),
// 거기서 나오는 검출은 전부 원본의 중복이다. 중복을 고치라고 말할 수는 없다.
const SKIP_FILES = new Set(['review.html']);
// 설명 문서 — `<pre>`·`<code>` 안을 검사에서 뺀다. 아트보드에는 그 태그가 없다.
const DOC_EXT = new Set(['.html']);

/**
 * 면제 선언을 읽는다 — **이유가 있을 때만** (`D-21`).
 *   /* slop-scan: ignore M4 — 상태 신호다. 멈추면 낡음을 표시할 채널이 없다 *\/
 * 이유 없는 `ignore M4` 는 듣지 않는다. 이유 없는 면제는 규칙을 끄는 것이고,
 * 그러면 기준이 레지스트리가 아니라 주석이 된다.
 */
function readIgnores(text) {
  const m2 = new Map();
  // 이유는 줄 끝 · `*/` · `-->` 중 먼저 오는 것까지다.
  // 초판은 문자 클래스에서 `*` 를 빼서 **강조 표시가 있는 이유가 중간에 잘렸다**
  // (실측: "이 문서는 안티패턴을" 에서 끊겼다 — `**인용한다.**` 의 별표 때문).
  const RE = /slop-scan\s*:\s*ignore\s+([A-Z]{1,2}\d+)\s*(?:—|--|-)\s*(\S[^\n]*?)\s*(?:\*\/|-->|$)/gm;
  for (const m of text.matchAll(RE)) m2.set(m[1], m[2].trim());
  return m2;
}

// ─── 리터럴 블록리스트 (기존 레포 목록 계승 — 빠르고 명확한 것만) ───────────
const LITERAL = [
  [/backdrop-filter\s*:\s*[^;]*blur/i, 'S2', '유리모피즘 (backdrop-filter: blur)'],
  [/\bbackdrop-blur\b/i, 'S2', '유리모피즘 (Tailwind backdrop-blur)'],
  [/\bblur-3xl\b/i, 'C2', '장식용 글로우 오브 (blur-3xl)'],
  [/\bgradient-text\b/i, 'C6', '그라디언트 텍스트 유틸리티'],
  [/\bshadow-glow\b/i, 'S4', '네온 글로우 유틸리티'],
  [/box-shadow[^;\n]*\bglow\b/i, 'S4', '네온 글로우 box-shadow'],
  [/Powered by AI/i, 'I6', '"Powered by AI" 배지'],
  [/\b(Magic|Smart|Intelligent)ly?\b(?![-.])/, 'I7', '기능 설명을 회피하는 마케팅 단어'],
  // Tailwind 네임드 색 클래스는 hex가 없어 색상각 측정(C1)을 빠져나간다 — 리터럴로 보강.
  [/\b(bg|text|border|from|to|via|ring|fill|stroke)-(purple|indigo|violet|fuchsia)-\d{2,3}\b/, 'C1',
   'Tailwind 보라·인디고 네임드 클래스'],

  // I4 — 카피 템플릿. 구체 명사가 없고 형용사로 버티는 문형.
  // 한글판을 함께 넣는다. 영문 패턴만 두면 우리 산출물은 전부 빠져나간다.
  [/\b(Build|Ship|Create|Launch)\b[^.<>\n]{0,40}\b(faster|better)\b[^.<>\n]{0,20}\bthan ever\b/i, 'I4',
   '카피 템플릿 "Build X faster than ever"'],
  [/\bEverything you need to\b/i, 'I4', '카피 템플릿 "Everything you need to …"'],
  [/\bThe modern way to\b/i, 'I4', '카피 템플릿 "The modern way to …"'],
  [/(?:가장|더)\s*(?:쉽게|빠르게|똑똑하게)\s*(?:만드는|시작하는)\s*(?:방법|가장)/, 'I4',
   '카피 템플릿 — 형용사로 버티는 한글 문형'],
  // 날조된 지표 (hallmark 게이트 46). 사용자가 준 숫자가 아니면 장식이다.
  [/\b\d+(?:\.\d+)?\s*(?:×|x)\s*(?:faster|more|better)\b/i, 'I4', '출처 없는 배수 주장 "10× faster"'],
  [/\b(?:trusted by|loved by|used by)\s*\d[\d,.]*\s*\+?/i, 'I4', '출처 없는 사용자 수 주장'],
  [/\b99\.9+\s*%\s*(?:uptime|가동)/i, 'I4', '출처 없는 가동률 주장'],

  // I5 — `New ✨` 그라디언트 보더 pill.
  [/(?:New|신규|NEW)\s*(?:[✨🎉🚀⚡]|&#x2728;)/u, 'I5', '`New ✨` 배지'],

  // I8 — 이모지 남용. **헤딩 앞**에 붙은 것만 본다 —
  // 사용자가 고른 아바타·식별자는 해당 없음이라고 레지스트리가 명시했다.
  [/<h[1-6][^>]*>\s*(?:<[^>]+>\s*)?[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u, 'I8',
   '헤딩 앞 이모지'],
  [/^\s*#{1,6}\s+[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}]/u, 'I8',
   '마크다운 헤딩 앞 이모지'],
];

// ─── 수집기 ─────────────────────────────────────────────────────────────────
const HEX = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
const RADIUS_CSS = /border-radius\s*:\s*([^;}\n]+)/gi;
// 숫자뿐 아니라 따옴표 문자열·var() 도 잡는다. 초판은 숫자만 잡아
// borderRadius: "var(--radius)" 를 통째로 놓쳤다.
const RADIUS_RN = /borderRadius\s*:\s*(?:["'`]([^"'`]+)["'`]|([\d.]+))/g;
const RADIUS_TW = /\brounded-(none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\])\b/g;
const SHADOW_CSS = /box-shadow\s*:\s*([^;}\n]+)/gi;
const SHADOW_TW = /\bshadow-(sm|md|lg|xl|2xl|inner|none|\[[^\]]+\])\b/g;
const DURATION = /(?:transition[^;}\n]*?|animation[^;}\n]*?|duration[-:]\s*)(\d+)(ms|s)\b/gi;
const DURATION_TW = /\bduration-(\d+)\b/g;
// 토큰 정의(--m-move: 180ms)는 사용처가 var() 라서 위 정규식에 안 잡힌다.
// 설계 결정은 정의에 있으므로 여기서 따로 센다.
const DURATION_TOKEN = /--[a-z0-9-]*\s*:\s*([\d.]+)(ms|s)\b/gi;
const FONT_CSS = /font-family\s*:\s*([^;}\n]+)/gi;
const FONT_RN = /fontFamily\s*:\s*['"`]([^'"`]+)/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
    const full = join(dir, name);
    let s;
    try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) yield* walk(full);
    else if (SCAN_EXTS.has(extname(name)) && !SKIP_FILES.has(name)) yield full;
  }
}

function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / d + 2) * 60;
  else hue = ((r - g) / d + 4) * 60;
  return { h: hue, s, l };
}

function collect(root) {
  const acc = {
    colors: [], namedColors: [], radii: [], shadows: [], durations: [], fonts: [],
    tokenNames: new Set(), fillUses: [], tokenValues: new Map(),
    literals: [], files: 0,
    // 2026-10-11 추가 — 글로벌 분포로 세는 두 채널(리딩·크기)과,
    // 파일 단위로만 판정 가능한 것들(모션 대응·테마 반전·히어로 정형)의 결과.
    lineHeights: [], fontSizes: [], weights: [], perFile: [], exempt: [],
  };
  // 디렉토리면 순회, 단일 파일이면 그 파일만 — 토큰 정본(globals.css / theme.ts) 직접 검사용
  const targets = statSync(root).isDirectory() ? walk(root) : [root];
  for (const file of targets) {
    let text;
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    acc.files++;
    const rel = statSync(root).isDirectory() ? relative(root, file) : file;

    // ★ `<pre>` · `<code>` 안의 내용은 **표시되는 텍스트이고 실행되지 않는다** (2026-10-11 실측).
    // 이 문서(`harness/decisions-37-42.html`)가 안티패턴을 **인용**했더니
    // `backdrop-blur` 가 S2 로, 예시의 `transition: all 200ms` 가 모션 1단계로 잡혔다.
    // 패턴을 설명하는 문서가 그 패턴을 쓴 것으로 측정되는 것은 틀린 측정이다 —
    // 이스케이프된 텍스트는 스타일이 아니다. 줄 수를 보존해 줄번호는 유지한다.
    // 아래 **모든** 수집기가 이 본문을 쓴다 — 리터럴·색·반경·그림자·듀레이션·폰트·분포.
    // 초판은 리터럴만 바꿨고, 그래서 이 문서가 인용한 DESIGN.md 예시의 hex 10개가
    // 「색상 43종」에 섞이고 예시의 `transition: all 200ms` 가 모션 1단계로 잡혔다.
    // 한 파일에 전처리본이 하나여야 한다 — 두 벌이면 한쪽이 반드시 먼저 틀린다.
    const displayOnly = (t) => t.replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
      (m) => m.replace(/[^\n]/g, ' '));
    const scanText = DOC_EXT.has(extname(file)) ? displayOnly(text) : text;

    // 면제 선언은 **벗기기 전** 본문에서 읽는다 — 주석에 사는 사람의 말이다 (D-20).
    const fileIgnores = readIgnores(text);

    scanText.split(/\r?\n/).forEach((line, i) => {
      for (const [re, code, label] of LITERAL) {
        if (!re.test(line)) continue;
        // ★ 면제는 리터럴 검출에도 적용된다 (2026-10-11 수정).
        // 초판은 `collectPerFile` 안에서만 면제를 봤다 — 즉 검출기 23종 중 10종만
        // 면제가 들었고, `D-21` 이 약속한 기전이 나머지 13종에서는 **없었다.**
        // 문서화된 탈출구가 절반만 작동하는 것은 없는 것보다 나쁘다.
        if (fileIgnores.has(code)) {
          if (!acc.exempt.some((e) => e.code === code && e.at === rel)) {
            acc.exempt.push({ code, at: rel, why: fileIgnores.get(code) });
          }
          continue;
        }
        acc.literals.push({ code, label, at: `${rel}:${i + 1}`, line: line.trim().slice(0, 100) });
      }
    });

    for (const m of scanText.matchAll(HEX)) acc.colors.push(m[0].toLowerCase());
    // 커스텀 프로퍼티로 이름이 붙은 색 = 구조화된 단계. 상한을 적용하지 않는다.
    for (const m of scanText.matchAll(/--[a-z0-9-]+\s*:\s*(#[0-9a-f]{3,6})\b/gi)) acc.namedColors.push(m[1].toLowerCase());
    for (const m of scanText.matchAll(/(--[a-z0-9-]+)\s*:/gi)) acc.tokenNames.add(m[1].toLowerCase());
    // 토큰 값 맵 — var() 간접 참조를 풀기 위해. 코드베이스가 토큰을 쓰면
    // 원문만 봐서는 실제 값을 알 수 없다 (var(--radius) 가 0px 인지 12px 인지).
    for (const m of scanText.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}\n]+)/gi))
      acc.tokenValues.set(m[1].toLowerCase(), m[2].trim());
    // background 계열에 var(--token) 을 쓴 곳 — 채움 사용처
    for (const m of scanText.matchAll(/background(?:-color)?\s*:\s*[^;}\n]*var\((--[a-z0-9-]+)\)/gi))
      acc.fillUses.push({ token: m[1].toLowerCase(), at: `${rel}:${scanText.slice(0, m.index).split('\n').length}` });
    for (const m of scanText.matchAll(RADIUS_CSS)) acc.radii.push(m[1].trim());
    for (const m of scanText.matchAll(RADIUS_RN)) acc.radii.push((m[1] ?? m[2]).trim());
    for (const m of scanText.matchAll(RADIUS_TW)) acc.radii.push(m[1]);
    for (const m of scanText.matchAll(SHADOW_CSS)) acc.shadows.push(m[1].trim().replace(/\s+/g, ' '));
    for (const m of scanText.matchAll(SHADOW_TW)) acc.shadows.push(m[1]);
    // 1ms 이하는 prefers-reduced-motion 에서 모션을 끄는 관용구지 설계 값이 아니다.
    const pushDur = (ms) => { if (Number(ms) > 1) acc.durations.push(String(ms)); };
    for (const m of scanText.matchAll(DURATION)) pushDur(m[2] === 's' ? +m[1] * 1000 : +m[1]);
    for (const m of scanText.matchAll(DURATION_TW)) pushDur(+m[1]);
    for (const m of scanText.matchAll(DURATION_TOKEN)) pushDur(m[2] === 's' ? +m[1] * 1000 : +m[1]);
    for (const m of scanText.matchAll(FONT_CSS)) acc.fonts.push(m[1].split(',')[0].trim().replace(/['"]/g, ''));
    for (const m of scanText.matchAll(FONT_RN)) acc.fonts.push(m[1].split('_')[0]);

    // ─── 리딩·크기 채널 (T2 · T3) ───
    // 단위 없는 line-height 와 px/rem 둘 다 센다. 정규화하지 않는다 —
    // 1.5 와 24px 는 다른 선택이고, 한 파일에 섞여 있으면 그 자체로 2단계다.
    for (const m of scanText.matchAll(/line-height\s*:\s*([\d.]+(?:px|rem|em)?)\b/gi)) acc.lineHeights.push(m[1]);
    for (const m of scanText.matchAll(/lineHeight\s*:\s*([\d.]+)/g)) acc.lineHeights.push(m[1]);
    for (const m of scanText.matchAll(/font-size\s*:\s*([^;}\n]+)/gi)) acc.fontSizes.push(m[1].trim());
    for (const m of scanText.matchAll(/fontSize\s*:\s*([\d.]+)/g)) acc.fontSizes.push(m[1]);
    for (const m of scanText.matchAll(/\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/g)) acc.fontSizes.push(m[1]);
    // 굵기·폭 — `decision-logic.md` §2 가 「서체·무게」 채널을 **서체 패밀리·굵기·폭 변주 수**로
    // 정의한다. 초판 budgetReport 는 패밀리만 세어서, 굵기 3단을 쓴 2패밀리 문서를
    // **평탄(1~2단계)** 으로 판정했다 — 규칙이 아니라 구현이 틀린 경우다 (2026-10-11 실측).
    for (const m of scanText.matchAll(/font-weight\s*:\s*([a-z0-9]+)/gi)) acc.weights.push(m[1].toLowerCase());
    for (const m of scanText.matchAll(/fontWeight\s*:\s*['"`]?([a-z0-9]+)/g)) acc.weights.push(m[1].toLowerCase());
    for (const m of scanText.matchAll(/\bfont-(?:bold|semibold|medium|light|black|extrabold|thin|normal)\b/g)) acc.weights.push(m[0]);
    for (const m of scanText.matchAll(/font-stretch\s*:\s*([a-z0-9%.-]+)/gi)) acc.weights.push('w:' + m[1].toLowerCase());

    collectPerFile(acc, scanText, rel, extname(file), fileIgnores);
  }
  return acc;
}

// ─── 파일 단위 검출 (2026-10-11) ────────────────────────────────────────────
// 왜 파일 단위인가: 「reduced-motion 에 대응했는가」는 **같은 파일 안**에
// 모션과 미디어쿼리가 함께 있는지를 묻는 질문이다. 레포 전체로 합산하면
// 한 파일의 대응이 나머지 전부를 가려 버린다 — 합산이 검사를 무력화하는 경우다.
function collectPerFile(acc, text, rel, ext) {
  // ★ 면제 — **이유가 있을 때만.** 우리 문법 그대로다:
  // `validate-screen` 의 「해당 없음 — <이유>」와 같은 규칙이고,
  // `⚠️ 는 차단이 아니라 정당화 요구` 라는 D-5 의 코드판이다.
  //
  //   /* slop-scan: ignore M4 — 상태 신호다. 멈추면 낡음을 표시할 방법이 없다 */
  //
  // 이유 없는 `ignore M4` 는 **듣지 않는다.** 이유 없는 면제는 규칙을 끄는 것이고,
  // 그러면 레지스트리가 아니라 주석이 기준이 된다.
  const ignored = readIgnores(text);
  const add = (code, msg, detail, note) => {
    if (ignored.has(code)) {
      // 면제도 접는다 — 같은 파일의 같은 코드를 세 줄로 보고하면 목록이 읽히지 않는다.
      if (!acc.exempt.some((e) => e.code === code && e.at === rel)) {
        acc.exempt.push({ code, at: rel, why: ignored.get(code) });
      }
      return;
    }
    acc.perFile.push({ code, msg, detail, note, at: rel });
  };
  const STYLE_EXT = new Set(['.css', '.scss', '.html']);

  // ★ 주석을 **벗긴 본문**으로 검사한다 (2026-10-11 실측).
  // 대조군 파일의 주석이 검출기를 무력화했다 —
  // `/* prefers-reduced-motion 이 없다 */` 라는 설명 한 줄이
  // `prefers-reduced-motion` 문자열 검사를 통과시켜 M3 가 발화하지 않았다.
  // 실제 코드에서도 같다: "TODO: prefers-reduced-motion 추가" 라고 적어 두면
  // **대응이 없는데 게이트를 통과한다.** 하려는 말과 한 일은 다른 사실이다.
  //
  // 반대로 **면제는 주석에서 읽는다** — 위 `ignored` 는 벗기기 전 본문을 본다.
  // 이 비대칭이 의도다: 검사는 코드를 보고, 면제는 사람의 말을 본다.
  const src = text
    .replace(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')   // 표시 텍스트는 스타일이 아니다
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^[ \t]*\/\/.*$/gm, ' ');

  // M3 — reduced-motion 미대응.
  // 스타일이 실제로 들어 있는 파일만 본다. `.tsx` 는 모션이 다른 파일의 CSS 에
  // 있는 경우가 정상이라, 여기서 요구하면 매 컴포넌트가 오경보가 된다.
  if (STYLE_EXT.has(ext)) {
    const hasMotion = /@keyframes\s/i.test(src)
      || /\btransition\s*:\s*(?!none)[^;}\n]*\d/i.test(src)
      || /\banimation\s*:\s*[^;}\n]*\d/i.test(src);
    if (hasMotion && !/prefers-reduced-motion/i.test(src)) {
      add('M3', ' 모션이 있는데 prefers-reduced-motion 대응이 없다',
        undefined, '모드와 무관한 차단이다 (invariants.md Ⅰ). 모션마다 대체 경로를 준다');
    }
  }

  // M4 — 무한 루프 모션.
  for (const m of src.matchAll(/animation[^;}\n]*\binfinite\b[^;}\n]*/gi)) {
    add('M4', '무한 루프 모션', m[0].trim().slice(0, 80),
      '입력 대기 중 인터럽트성 애니메이션은 금지다 (I4 원관측 — "5초 룰")');
  }

  // M2 — 스크롤 리빌 도배. 같은 리빌 클래스가 4회 이상 반복되면 섹션마다 걸린 것으로 본다.
  const reveal = {};
  for (const m of src.matchAll(/\b(?:class|className)\s*=\s*["'`][^"'`]*\b((?:fade|reveal|animate)-[a-z-]+)/gi))
    reveal[m[1]] = (reveal[m[1]] ?? 0) + 1;
  for (const [cls, n] of Object.entries(reveal)) {
    if (n >= 4) add('M2', `리빌 클래스 ${cls} 가 ${n}회 — 섹션마다 fade-up 은 정보 전달이 아니라 지연이다`);
  }

  // C5 — 파스텔 그라디언트 배경. 그라디언트 안에 **연한 유채색이 둘 이상**일 때만.
  //
  // ★ 「유채색」을 HSL 채도가 아니라 **채널 폭**(max−min)으로 판정한다 (2026-10-12 수정).
  // 초판은 `s >= 0.12` 였고, control_tower 의 「비해당」 사선 패턴
  // (`repeating-linear-gradient(45deg, #f4f7f8 …, #eaeff1 …)`)을 파스텔로 걸었다.
  // `#f4f7f8` 은 HSL 채도 **0.22** 지만 채널 폭은 **0.016** — 사실상 회색이다.
  // 그리고 그 패턴은 대상 레포 UI_GUIDE §5 가 **명시한** 것이다(「비해당 — 사선 패턴」).
  //
  // **같은 결함을 C3 에서 이미 고쳤다**(`#eef1f3` 이 채도 0.17 로 읽혔다). 그때 원인을
  // 「HSL 채도는 명도 극단에서 의미가 없다」로 적어 놓고 **C5 에는 적용하지 않았다.**
  // 파스텔은 정의상 명도가 높으므로 C3 처럼 명도 창을 좁힐 수 없다 — 그래서 채널 폭을 쓴다.
  // 파스텔 분홍 `#ffd9e8` 의 채널 폭은 0.15, 위의 회색은 0.016~0.027 이다. 0.06 이 둘을 가른다.
  const chroma = (hex) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (Math.max(...v) - Math.min(...v)) / 255;
  };
  for (const m of src.matchAll(/background(?:-image|-color)?\s*:\s*([^;}\n]*(?:linear|radial|conic)-gradient[^;}\n]*)/gi)) {
    const stops = [...m[1].matchAll(HEX)].map((h) => ({ ...hexToHsl(h[0]), c: chroma(h[0]) }));
    const pastel = stops.filter((c) => c.c >= 0.06 && c.l >= 0.70);
    if (pastel.length >= 2) {
      add('C5', `파스텔 그라디언트 배경 — 연한 유채색 ${pastel.length}단계`, m[1].trim().slice(0, 80));
    }
  }

  // IA3 — 중앙정렬 히어로 정형 (hallmark 게이트 6).
  //
  // ★ 초판은 **파일 안에 두 선언이 있으면** 걸었다. 실측 결과 7건 전부 오탐이었다
  // (2026-10-11): `.shell { min-height: 100vh }` 는 앱 셸 그리드이고
  // `.st-empty { text-align: center }` 는 빈 상태 블록이다 — 둘은 서로 아무 관계가 없고
  // 히어로는 어디에도 없다. **7/7 오탐인 검출기는 내보내지 않는다.**
  //
  // 그래서 셋을 모두 요구한다 — ① **같은 규칙 블록 안**에 ② 전체 높이와 중앙 정렬이
  // 함께 있고 ③ 선택자가 히어로 자리를 가리킨다. 좁혀서 못 잡는 히어로가 생기는 것은
  // 감수한다. 매번 틀리는 검사는 사람이 검사 전체를 무시하게 만든다 (D-6).
  const HERO_SEL = /(^|[\s,.#>])(hero|banner|masthead|jumbotron|cover|splash|intro)\b/i;
  for (const m of src.matchAll(/([^{}@/]+)\{([^{}]*)\}/g)) {
    const [sel, body] = [m[1].trim(), m[2]];
    if (!HERO_SEL.test(sel)) continue;
    if (!/min-height\s*:\s*(100vh|100dvh|100%)/i.test(body)) continue;
    if (!/text-align\s*:\s*center/i.test(body)) continue;
    add('IA3', '히어로가 전체 높이 + 중앙 정렬 — 정형 가능성', sel.slice(0, 60),
      '중앙에 놓는 요소는 둘까지. 아이브로나 CTA 하나는 축에서 뺀다 (hallmark 게이트 6)');
  }

  // ─── 2026-10-12 신설 (승인 #37 B+) ───────────────────────────────────────
  // 선정 기준: ① 기계로 잴 수 있다 ② 규칙이 명확해 오탐이 적다
  // ③ 레지스트리에 코드가 없다. hallmark 58게이트 중 9종이 후보였고 5종을 골랐다.
  // 뺀 넷 — T5(폰트 3종 초과)·T6(이탤릭 헤딩)은 다음으로, I9(가짜 크롬)은 신호가 약하고,
  // IA8(2줄 CTA)은 **정적으로 잴 수 없다**(렌더 전용 → 승인 #39 에 종속).

  // C7 — `:root` 밖의 즉흥 hex·font-family (hallmark 게이트 48).
  // 테마를 정해 놓고 중간에 잊고 직접 값을 쓴 것. 단일 교체점(불변항 III-2)이 깨진다.
  //
  // ★ **`:root` 가 있는 파일만** 본다. 소비 레포는 토큰이 globals.css 한 곳이고
  // 컴포넌트는 다른 파일이므로, 파일 단위로 요구하면 전 컴포넌트가 오탐이 된다.
  // 경쟁자가 같은 검사를 write hook 에 넣었다가 **같은 시간에 되돌린** 이유다.
  if (STYLE_EXT.has(ext) && /:root\b/.test(src)) {
    // `:root` · `[data-theme=…]` 블록의 범위를 중괄호 짝을 세어 구한다
    // (정규식 한 방으로는 `@media { :root { … } }` 중첩을 못 넘는다).
    const spans = [];
    const SEL = /(:root|\[data-theme[^\]]*\])[^{]*\{/g;
    for (let m; (m = SEL.exec(src));) {
      let depth = 1, i = SEL.lastIndex;
      while (i < src.length && depth > 0) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') depth--;
        i++;
      }
      spans.push([m.index, i]);
    }
    const inToken = (i) => spans.some(([a, b]) => i >= a && i < b);
    // ★ **칠하는 선언 안의 값만** 센다 (2026-10-12 좁힘).
    // 초판은 파일의 모든 hex 를 셌고 우리 산출물 12개가 ❌ 로 걸렸다. 열어 보니 섞여 있었다 —
    //   ㉠ 진짜 위반     아트보드의 `color: #fff` (CLAUDE.md 「하지 말 것」 위반)
    //   ㉡ 값이 아니라 **데이터**  `compare.html` 은 원본 브랜드 색을 **비교 대상으로** 싣는다
    //   ㉢ 측정 자극     `taste-probe-*` 는 변형이 목적이다
    //   ㉣ 순수 오탐     `color: inherit` · `font-family: inherit` 은 즉흥이 아니라 리셋이다
    // ㉣를 없애고 ㉡를 줄이기 위해, 칠하는 속성 안에 있는 값만 본다.
    const KEYWORD = /^(inherit|initial|unset|revert|revert-layer|currentcolor|transparent|none|auto)$/i;
    const PAINT = /(color|background(?:-color|-image)?|border(?:-\w+)?-color|border(?:-\w+)?|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|text-decoration-color|caret-color|accent-color)\s*:\s*([^;}\n]+)/gi;
    const stray = [];
    for (const m of src.matchAll(PAINT)) {
      if (inToken(m.index)) continue;
      const val = m[2].trim();
      if (KEYWORD.test(val) || /var\(/.test(val)) continue;
      for (const h of val.matchAll(HEX)) stray.push(h[0].toLowerCase());
    }
    for (const m of src.matchAll(/font-family\s*:\s*([^;}\n]+)/gi)) {
      const val = m[1].trim();
      if (inToken(m.index) || /var\(/.test(val) || KEYWORD.test(val)) continue;
      stray.push(val.slice(0, 30));
    }
    const u = [...new Set(stray)];
    if (u.length) {
      add('C7', `:root 밖에서 값을 직접 썼다 — ${u.length}종`, u.slice(0, 8).join(', '),
        '토큰에 이름을 주고 var() 로 참조한다. 단일 교체점이 깨지면 토큰 파이프라인이 무너진다 (불변항 III-2)');
    }
  }

  // T7 — 측정폭(measure) 45~75ch 이탈 (hallmark 게이트 25).
  // 45ch 아래는 줄이 끊기고 75ch 위는 눈이 줄을 놓친다.
  // `ch` 로 적힌 것만 잴 수 있다 — px·rem 은 폰트 크기를 알아야 환산된다 (기계 상한 warn).
  for (const m of src.matchAll(/max-width\s*:\s*([\d.]+)ch\b/gi)) {
    const ch = Number(m[1]);
    if (ch < 45 || ch > 75) {
      add('T7', `측정폭 ${ch}ch — 권장 45~75ch 밖이다`, m[0],
        ch < 45 ? '너무 좁아 줄이 자주 끊긴다' : '너무 넓어 다음 줄 시작을 놓친다');
    }
  }

  // G4 — 이미지가 있는 그리드의 `1fr` (hallmark 게이트 50).
  // `1fr` 은 `minmax(auto, 1fr)` 이고 `auto` 최소값은 **내용의 고유 폭**이다.
  // 1024px 원본이 들어가면 최소 폭이 1024px 이 되어 폰에서 레이아웃이 뷰포트를 넘긴다.
  // 고치는 법은 트랙당 한 글자 — `1fr` → `minmax(0, 1fr)`.
  if (/<(img|picture)\b/i.test(src) || /background-image\s*:/i.test(src)) {
    for (const m of src.matchAll(/grid-template-(?:columns|rows)\s*:\s*([^;}\n]+)/gi)) {
      if (/\bminmax\s*\(/i.test(m[1])) continue;
      if (!/\b[\d.]*fr\b/.test(m[1])) continue;
      add('G4', 'fr 트랙 + 이미지 — minmax(0, 1fr) 이 아니면 폰에서 넘친다', m[1].trim().slice(0, 60),
        '1fr 은 minmax(auto, 1fr) 이고 auto 최소값은 이미지의 고유 폭이다');
    }
  }

  // M5 — transition-all · 레이아웃 속성 애니메이션 (hallmark 게이트 10 · 14).
  // M1 은 "몇 종인가", M5 는 "**무엇에** 거는가" — 다른 축이다.
  for (const m of src.matchAll(/transition(?:-property)?\s*:\s*([^;}\n]*)/gi)) {
    if (/\ball\b/.test(m[1])) {
      add('M5', 'transition: all — 속성을 지정하지 않았다', m[0].trim().slice(0, 60),
        '무엇이 움직일지 모르는 전이는 의도가 아니다. 속성을 적는다');
    }
  }
  // `transition-all` 은 Tailwind **클래스**다 → 클래스 자리에 있을 때만 센다.
  // 초판은 본문 어디에 있든 셌고, 그래서 이 패턴을 **설명하는 산문**이 걸렸다
  // (실측: `harness/decisions-37-42.html` 의 "(transition-all)는 9종 중…").
  // `pre`·`code` 벗기기로는 안 잡힌다 — 산문은 벗길 수 없다. 문맥을 요구하는 것이 답이다.
  if (/(?:class|className)\s*=\s*["'`][^"'`]*\btransition-all\b/.test(src)
      || /\.transition-all\b/.test(src)
      || /@apply[^;}\n]*\btransition-all\b/.test(src)) {
    add('M5', 'transition-all 유틸리티', undefined, '속성을 지정한 유틸리티로 바꾼다');
  }
  const LAYOUT_PROP = /(?:transition(?:-property)?|animation)\s*:\s*[^;}\n]*\b(width|height|top|left|right|bottom|margin|padding)\b/gi;
  for (const m of src.matchAll(LAYOUT_PROP)) {
    add('M5', `레이아웃 속성 애니메이션 — ${m[1]}`, m[0].trim().slice(0, 60),
      'transform·opacity 로 바꾼다. 레이아웃 속성은 매 프레임 리플로를 일으킨다');
  }

  // IA7 — 상호작용 상태 미설계 (hallmark 게이트 26 · 39).
  // 어떤 선택자가 인터랙티브인지는 추정이므로 `:hover` 의 존재로 근사한다 (기계 상한 warn).
  if (STYLE_EXT.has(ext) && /:hover\b/.test(src)) {
    if (!/:focus(-visible)?\b/.test(src)) {
      add('IA7', ':hover 는 있고 :focus-visible 이 없다', undefined,
        '키보드 사용자에게는 hover 가 존재하지 않는다. 접근성 직결이다');
    }
    // 상태 간 border-width 변화 — 레이아웃이 흔들린다 (게이트 39).
    // ★ **같은 선택자의 기본 ↔ 상태끼리만 비교한다** (2026-10-12 수정 — control_tower 실측 오탐).
    // 초판은 파일 안의 border-width 를 전부 한 집합에 모았다. 체크박스(2px)와 버튼(1px)처럼
    // **서로 다른 요소**의 값이 「상태 간 변화」로 읽혔고, 어느 쪽도 상태에 따라 바뀌지 않았다.
    const widthOf = (body) => {
      const w = body.match(/border(?:-\w+)?-width\s*:\s*([^;}\n]+)|border\s*:\s*([\d.]+px|0\b|none\b)/i);
      return w ? (w[1] ?? w[2]).trim() : null;
    };
    const STATE = /:(?:hover|focus-visible|focus|active)\b/g;
    const baseW = new Map();
    const states = [];
    for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const w = widthOf(m[2]);
      if (!w) continue;
      for (const raw of m[1].split(',')) {
        const sel = raw.trim();
        if (!sel || sel.startsWith('@')) continue;
        const base = sel.replace(STATE, '').trim();
        if (base === sel) baseW.set(sel, w); else states.push({ sel, base, w });
      }
    }
    const shifts = states.filter((x) => baseW.has(x.base) && baseW.get(x.base) !== x.w);
    if (shifts.length) {
      const ex = shifts.slice(0, 2).map((x) => `${x.base} ${baseW.get(x.base)} → ${x.sel} ${x.w}`).join(' · ');
      add('IA7', `상태 간 border-width 가 다르다 — ${ex}`, undefined,
        '상태 변화는 색·outline·box-shadow 로 준다. border-width 는 레이아웃을 밀어낸다');
    }
  }

  // IA9 — 메뉴 항목마다 붙은 설명문 (승인 `#55 A`, 2026-10-30).
  // control_tower 실사용 지적 F-2: 메뉴 아홉에 질문형 부제(「지금 뭐부터」 · 「뭐가 들어왔나」…) —
  // 사용자 *"메뉴명과 메뉴명에 대한 설명이 너무 AI티가 많이 나"*. NN/g 메뉴 지침 7 *"not the place to get cute"*.
  // 잡는 것: 내비게이션 안의 항목(a · button)이 **이름 + 두 번째 글줄**을 갖고, 그런 항목이 셋 이상 · 60% 이상.
  // 숫자·단축키(배지 「3」 · 「⌘K」)는 두 번째 글줄로 치지 않는다 — 정보지 설명이 아니다.
  if (ext === '.html') {
    const NAV_OPEN = /<(nav|aside|ul|div|header)\b([^>]*)>/gi;
    const isNav = (tag, attrs) => tag.toLowerCase() === 'nav' || /role\s*=\s*["']navigation["']/i.test(attrs)
      || /class\s*=\s*["'][^"']*\b(nav|sidebar|side-nav|sidenav|menu|rail|lnb|gnb)\b/i.test(attrs);
    const innerOf = (from, tag) => {           // 같은 이름의 중첩을 세어 닫는 태그를 찾는다
      const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi'); re.lastIndex = from; let depth = 1, m;
      while ((m = re.exec(src))) { depth += m[1] ? -1 : 1; if (!depth) return src.slice(from, m.index); }
      return src.slice(from);
    };
    const seen = new Set();
    for (const m of src.matchAll(NAV_OPEN)) {
      if (!isNav(m[1], m[2])) continue;
      const body = innerOf(m.index + m[0].length, m[1]);
      const items = [...body.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((x) => x[2]
        .replace(/<(svg|style|script)\b[\s\S]*?<\/\1>/gi, ' ')
        .split(/<[^>]+>/).map((t) => t.replace(/&nbsp;|\s+/g, ' ').trim())
        .filter((t) => t && /[A-Za-z가-힣]/.test(t) && !/^[⌘⌥⇧^]?\s*\w?$/.test(t)));
      if (items.length < 3) continue;
      // 숫자가 든 두 번째 글줄은 상태 데이터다(「4장 옮김」 · 「넘침 1곳」 — Seemilar 탭 실측). 설명문이 아니다
      const sub = items.filter((t) => t.length >= 2 && t[1].replace(/\s/g, '').length >= 4 && !/\d/.test(t[1]));
      if (sub.length < 3 || sub.length / items.length < 0.6) continue;
      const ex = sub.slice(0, 2).map((t) => `${t[0]} — ${t[1]}`).join(' · ');
      if (seen.has(ex)) continue; seen.add(ex);
      add('IA9', `메뉴 항목 ${sub.length}/${items.length} 개에 설명문이 붙어 있다`, ex.slice(0, 80),
        '메뉴는 흔한 앱의 이름으로 — 이름이 자명하면 부제가 필요 없다 (톤 카드 9)');
    }
  }

  // C3 — 다크모드 = 반전. 다크 블록의 유채색 채도가 라이트와 같으면
  // 명도만 뒤집고 채도·엘리베이션을 재설계하지 않은 것이다.
  const darkAt = src.search(/(?:prefers-color-scheme\s*:\s*dark|\[data-theme\s*=\s*["']?dark)/i);
  if (STYLE_EXT.has(ext) && darkAt > -1) {
    // ★ 창을 C1 과 같게 맞춘다 (`s > 0.25` · `0.2 < l < 0.8`).
    // 초판은 `s > 0.15 · 0.06 < l < 0.96` 이었고 **음성 대조군을 걸었다**:
    // `#eef1f3`(거의 흰색)이 HSL 에서 채도 **0.17** 로 읽힌다 —
    // 채널 폭 5/255 가 `l=0.94` 에서 17% 로 증폭된다.
    // HSL 채도는 명도 극단에서 의미가 없고, 「액센트 채도」는 중간 명도의 유채색을 뜻한다.
    const chroma = (t) => [...t.matchAll(HEX)].map((h) => hexToHsl(h[0]))
      .filter((c) => c.s > 0.25 && c.l > 0.2 && c.l < 0.8).map((c) => c.s);
    const light = chroma(src.slice(0, darkAt));
    const dark = chroma(src.slice(darkAt));
    const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    // 한쪽이라도 유채색이 없으면 비교 대상이 없다 — 무채색 테마는 C3 의 대상이 아니다.
    if (light.length >= 1 && dark.length >= 1) {
      const d = Math.abs(mean(light) - mean(dark));
      if (d < 0.05) {
        add('C3', `다크모드 액센트 채도가 라이트와 같다 (Δs ${d.toFixed(3)}) — 명도만 반전한 것으로 보인다`,
          `light ${mean(light).toFixed(2)} / dark ${mean(dark).toFixed(2)}`,
          '다크에서는 채도를 낮추고 엘리베이션을 다시 세운다. 같은 값이면 탁해지거나 번진다');
      }
    }
  }
}

// ─── 측정 검사 ──────────────────────────────────────────────────────────────
function analyze(acc, minSamples, mode) {
  const findings = [];
  const uniq = (a) => [...new Set(a)];
  const mi = MODES.indexOf(mode);
  const sev = (code) => applyCap(code, WEIGHTS[code] ? WEIGHTS[code][mi] : 'warn');
  const push = (f) => { const s = sev(f.code); if (s) findings.push({ ...f, severity: s }); };

  // C1 — 액센트 색상각 단일 + 보라·인디고 구간
  const accents = uniq(acc.colors)
    .map((c) => ({ c, ...hexToHsl(c) }))
    .filter((x) => x.s > 0.25 && x.l > 0.2 && x.l < 0.8);
  const hueBuckets = uniq(accents.map((x) => Math.round(x.h / 15) * 15));
  if (accents.length >= 2 && hueBuckets.length <= 1 && hueBuckets[0] >= 235 && hueBuckets[0] <= 280) {
    push({
      code: 'C1',
      msg: `유일한 액센트 색상각이 ${hueBuckets[0]}° (보라·인디고 구간) — "AI = 보라" 기본값 가능성`,
      detail: accents.map((x) => x.c).join(', '),
      note: '외부 근거(회사 CI 등)가 있으면 정당화된다. invariants.md Ⅴ 참조.',
    });
  }

  // S3 — 색조 없는 검정 알파 그림자
  const shadowsAll = acc.shadows.join(' | ');
  if (acc.shadows.length >= minSamples && /rgba\(\s*0\s*,\s*0\s*,\s*0/.test(shadowsAll)
      && !/rgba\(\s*(?!0\s*,\s*0\s*,\s*0)\d/.test(shadowsAll)) {
    push({ code: 'S3', msg: '모든 그림자가 순수 검정 알파 — 컬러 배경 위에서 탁해진다' });
  }

  const checks = [
    ['G1', acc.radii, '반경', '요소 크기와 무관한 균일 라운드 — 템플릿 느낌'],
    ['S1', acc.shadows, '그림자', '엘리베이션 층 위계 없음 (고유 그림자 1종)'],
    ['M1', acc.durations, '모션 듀레이션', '마이크로/전환/진입이 분화되지 않음'],
    ['T1', acc.fonts, '폰트 패밀리', '대비 수단이 크기·굵기뿐'],
  ];
  for (const [code, arr, label, msg] of checks) {
    const u = uniq(arr);
    if (arr.length >= minSamples && u.length <= 1) {
      push({ code, msg: `${label} 고유값 ${u.length}종 / 사용 ${arr.length}회 — ${msg}`, detail: u.join(', ') });
    }
  }

  // A1 — 액센트 전용 토큰이 솔리드 채움에 쓰였는가.
  //   규약: `--foo` 와 `--foo-strong` 이 함께 선언돼 있으면 `--foo` 는 액센트 전용이고
  //   채움은 `--foo-strong` 이 맡는다 (invariants.md Ⅰ-1 의 처리 방식).
  //   가이드 문장만으로는 오남용이 막히지 않는다 — 2026-W34 교차검증 제안.
  const accentOnly = [...acc.tokenNames].filter((n) => acc.tokenNames.has(`${n}-strong`));
  for (const use of acc.fillUses) {
    if (!accentOnly.includes(use.token)) continue;
    push({
      code: 'A1',
      msg: `액센트 전용 토큰 ${use.token} 이 솔리드 채움에 쓰였다`,
      detail: use.at,
      note: `${use.token}-strong 이 선언돼 있다 — 채움에는 그쪽을 쓴다. ` +
            `${use.token} 은 보더·포커스링·아이콘·틴트 배경 전용이다`,
    });
  }

  // ─── T2 · T3 — 리딩과 크기 채널 (2026-10-11) ───
  // T1 이 "서체가 1종"을 잡고, 이 둘이 **그 서체로 위계를 만들었는가**를 잡는다.
  // 셋이 다 걸리면 타이포에 채널이 하나도 없는 것이다.
  {
    const lh = uniq(acc.lineHeights);
    const fs = uniq(acc.fontSizes);
    if (acc.lineHeights.length >= minSamples && lh.length <= 1 && fs.length >= 3) {
      push({
        code: 'T2',
        msg: `리딩 고유값 ${lh.length}종인데 크기는 ${fs.length}단계 — 크기와 무관하게 리딩이 고정됐다`,
        detail: `line-height ${lh.join(', ')}`,
        note: '큰 제목은 좁히고 본문은 넓힌다. 한 값으로는 둘 중 하나가 반드시 틀린다',
      });
    }
    // 크기 단계가 3 이하 = 위계를 크기로 만들지 않은 것.
    // 0단계(크기를 안 씀)는 결정이므로 제외한다 — 채널 예산과 같은 규정이다.
    if (acc.fontSizes.length >= minSamples && fs.length > 0 && fs.length <= 3) {
      push({
        code: 'T3',
        msg: `크기 고유값 ${fs.length}단계 / 사용 ${acc.fontSizes.length}회 — 비율 관계 없는 램프`,
        detail: fs.join(', '),
        note: 'text-sm/base/lg 만 쓰는 상태. 비율(1.2·1.25·1.333 등)을 정하고 그 위에서 고른다',
      });
    }
  }

  // ─── 파일 단위 검출 결과를 합친다 ───
  // **중복을 접는다.** `build-review.mjs` 가 아트보드를 한 파일로 모으므로
  // 같은 키프레임이 5번 잡혔다 — 같은 고장을 5줄로 보고하면 읽히지 않는다.
  const seen = new Set();
  for (const f of acc.perFile) {
    // ★ 키에 **메시지**가 들어간다. 초판은 `code|at|detail` 이었고,
    // 같은 코드의 서로 다른 고장이 둘 다 detail 없이 나오면 하나로 접혔다
    // (실측: IA7 의 ':focus-visible 없음' 과 'border-width 변화' 가 1건으로 합쳐졌다).
    // 접어야 할 것은 **같은 고장의 반복**이고 다른 고장이 아니다.
    const key = `${f.code}|${f.at}|${f.msg}|${f.detail ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    push({ code: f.code, msg: f.msg, at: f.at, detail: f.detail, note: f.note });
  }

  // G2 — 스페이싱 히스토그램 평탄성은 토큰 정의 없이는 오탐이 커서 보류.
  return findings;
}

// ─── 위계 채널 예산 분석 (system/decision-logic.md) ─────────────────────────
// 규칙: 각 채널은 0(의도적으로 죽임) 이거나 3 이상(위계를 만듦)이어야 한다.
// 1~2 = 켜놓고 위계는 안 만든 상태 = AI 기본값 룩의 정체.
// 유채색의 색상각 버킷 수 + 무채색이 있으면 1. 회색 스케일은 색 채널이 아니다.
function hueSteps(colors) {
  const buckets = new Set();
  let hasNeutral = false;
  for (const c of new Set(colors)) {
    const { h, s, l } = hexToHsl(c);
    if (s < 0.15 || l < 0.06 || l > 0.96) { hasNeutral = true; continue; }
    buckets.add(Math.round(h / 20) * 20);
  }
  return buckets.size + (hasNeutral ? 1 : 0);
}

function budgetReport(acc) {
  const uniq = (a) => [...new Set(a)].length;
  // 상한 — 이 이상은 위계 단계가 아니라 통제되지 않은 변이로 본다.
  // (lifeplanet의 색 200종은 배분이 아니라 축적된 혼란이다)
  const ch = [
    // 색 채널은 **유채색의 색상각 다양성**으로 센다. 토큰 개수가 아니다.
    // 회색 30종은 색으로 위계를 만드는 게 아니라 명도로 만드는 것이고, 그건 다른 채널이다.
    // (2026-W34 대조 실험: 브랜드를 무채색화한 변형이 여전히 '색 29단계'로 잡혔다)
    { key: '색',        raw: hueSteps(acc.colors), named: 0, cap: 24 },
    // 「서체·무게」 = 패밀리 + 굵기 + 폭 (decision-logic.md §2 의 정의 그대로).
    { key: '서체·무게',  raw: uniq([...acc.fonts, ...acc.weights]), cap: 8,
      values: [...acc.fonts, ...acc.weights] },
    { key: '반경',      raw: uniq(acc.radii),     cap: 8, values: acc.radii },
    { key: '표면·깊이',  raw: uniq(acc.shadows),   cap: 8, values: acc.shadows },
    { key: '모션',      raw: uniq(acc.durations), cap: 10, values: acc.durations },
  ];
  // 0·none 만 있는 채널은 **의도적으로 죽인 것**이지 평탄한 게 아니다.
  //   --radius: 0px · --sh-*: none · --m-*: 0ms 는 "안 쓴다"는 명시적 선언이다.
  //   초판은 이것을 '1단계 평탄'으로 잡아 매 실행 오경보를 냈고,
  //   그건 린터를 무시하게 만드는 가장 빠른 길이다. (컨트롤타워 저채널 안에서 드러남)
  // 0 과 none, 그리고 1ms·0.01ms — 후자는 prefers-reduced-motion 에서 모션을 끄는
  // 관용구지 실제 모션 값이 아니다. 이것을 단계로 세면 '끈 채널'이 평탄으로 오탐된다.
  const ZERO = /^(0(px|ms|s|rem|em|%)?|none|0?\.?0*1ms)$/i;
  // var(--x) 를 선언값으로 최대 3단계까지 푼다. 순환 참조는 그대로 둔다.
  const resolve = (v, depth = 0) => {
    const s = String(v).trim();
    if (depth > 3) return s;
    const m = s.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)$/i);
    if (!m) return s;
    const next = acc.tokenValues?.get(m[1].toLowerCase());
    return next === undefined ? s : resolve(next, depth + 1);
  };
  const killed = (vals) => vals.length > 0 && vals.every((v) => ZERO.test(resolve(v)));
  // 알약(999·9999·50%·full) + 각짐(0) 은 **의도적 이분 체계**지 평탄이 아니다.
  //   토스가 100px 알약과 작은 라운드를 함께 쓰는 것과 같은 결정이다 (taste-anchor).
  //   두 값이 스펙트럼의 양 끝이면 "켜놓고 안 쓴" 상태와 정반대다.
  const PILL = /^(9{3,}(px)?|50%|full|999px)$/i;
  const binary = (vals) => {
    const r = [...new Set(vals.map((v) => resolve(v)))];
    return r.length === 2 && r.some((v) => PILL.test(v)) && r.some((v) => ZERO.test(v));
  };
  for (const c of ch) {
    const unnamed = Math.max(0, c.raw - (c.named || 0));
    c.n = (c.named || 0) + Math.min(unnamed, c.cap);
    c.capped = unnamed > c.cap;
    c.state = c.raw === 0 ? 'dead'
      : (c.values && killed([...new Set(c.values)])) ? 'dead'
      : (c.values && binary(c.values)) ? 'alive'
      : c.raw <= 2 ? 'flat' : 'alive';
    if (c.state === 'dead' && c.raw > 0) c.explicitKill = true;
  }
  const alive = ch.filter((c) => c.state === 'alive').length;
  const flat = ch.filter((c) => c.state === 'flat').length;

  // 집중도 — 상한 적용 후 상위 2채널이 차지하는 비율
  const total = ch.reduce((s, c) => s + c.n, 0);
  const top2 = ch.map((c) => c.n).sort((a, b) => b - a).slice(0, 2).reduce((s, n) => s + n, 0);
  const share = total ? top2 / total : 0;

  // 신뢰도 — 상한에 걸린 채널이 있으면 원시 카운트가 오염됐다는 뜻
  const cappedCount = ch.filter((c) => c.capped).length;
  const confidence = cappedCount >= 2 ? 'low' : cappedCount === 1 ? 'medium' : 'high';

  let verdict, why;
  if (flat >= 3) {
    verdict = '평탄(flat)';
    why = '켜놓고 위계를 안 만든 채널이 3개 이상 — AI 기본값 룩';
  } else if (alive === 0) {
    verdict = '판정 불가'; why = '측정 표본이 부족하다';
  } else if (alive === 1) {
    verdict = '단일(single)'; why = '한 채널만 사용 — 그 채널이 충분히 강하면 성립';
  } else if (share >= 0.55) {
    verdict = '집중(concentrated)';
    why = `상위 2채널이 ${Math.round(share * 100)}% — 권장 상태`;
  } else {
    verdict = '분산(dispersed)';
    why = `상위 2채널이 ${Math.round(share * 100)}%뿐 — 위계 신호가 상쇄된다`;
  }
  return { channels: ch, alive, flat, share: +share.toFixed(2), confidence, verdict, why };
}

// ─── 실행 ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const wantBudget = args.includes('--budget');
const flagVal = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const minSamples = Number(flagVal('--min-samples') ?? 5);
const mode = flagVal('--mode');
const consumed = new Set([String(minSamples), mode].filter(Boolean));
const target = args.find((a) => !a.startsWith('--') && !consumed.has(a));

if (!target || !mode) {
  console.error('사용법: node scripts/slop-scan.mjs <경로> --mode tool|consumer|marketing|graphic [--json] [--min-samples N]');
  console.error('  모드 없이 채점하면 marketing/consumer/graphic 산출물이 tool 기준으로 차단된다.');
  process.exit(2);
}
if (!MODES.includes(mode)) {
  console.error(`알 수 없는 모드: ${mode} — ${MODES.join(' | ')} 중 하나여야 한다.`);
  process.exit(2);
}
const root = resolve(target);
if (!existsSync(root)) {
  console.error(`경로 없음: ${root}`);
  process.exit(2);
}

const acc = collect(root);
const mi = MODES.indexOf(mode);
const measured = analyze(acc, minSamples, mode);
const literals = acc.literals
  .map((l) => ({ ...l, severity: applyCap(l.code, WEIGHTS[l.code] ? WEIGHTS[l.code][mi] : 'block') }))
  .filter((l) => l.severity);
const all = [...literals, ...measured];

const budget = wantBudget ? budgetReport(acc) : null;

if (asJson) {
  console.log(JSON.stringify({ root, mode, filesScanned: acc.files, findings: all, exempt: acc.exempt, budget }, null, 2));
} else {
  console.log(`[slop-scan] ${acc.files}개 파일 스캔 — ${root}  (모드: ${mode})`);
  console.log(`  색상 ${new Set(acc.colors).size}종 / 반경 ${new Set(acc.radii).size}종 / 그림자 ${new Set(acc.shadows).size}종 / 듀레이션 ${new Set(acc.durations).size}종 / 폰트 ${new Set(acc.fonts).size}종`);
  // 면제는 **보인다.** 조용히 넘어가면 면제가 쌓이는 것을 아무도 세지 않고,
  // 그때 기준은 레지스트리가 아니라 주석이 된다.
  if (acc.exempt.length) {
    console.log(`  면제 ${acc.exempt.length}건 (이유 있음):`);
    for (const e of acc.exempt) console.log(`    ${e.code}  ${e.at} — ${e.why}`);
  }
  if (!all.length) {
    console.log('\n통과 — 검출된 기본값 패턴 없음.');
  } else {
    const order = { block: 0, warn: 1, info: 2 };
    for (const f of all.sort((a, b) => order[a.severity] - order[b.severity])) {
      const mark = f.severity === 'block' ? '❌' : f.severity === 'warn' ? '⚠️ ' : 'ℹ️ ';
      console.log(`\n${mark} [${f.code}] ${f.msg ?? f.label}`);
      // `line` 은 리터럴 검출에만 있다. 측정 검출에는 없으므로 그때
      // 「undefined」가 찍히지 않게 분기한다 (2026-10-11 수정).
      if (f.at) console.log(`     ${f.at}${f.line ? `  ${f.line}` : ''}`);
      if (f.detail) console.log(`     ${f.detail}`);
      if (f.note) console.log(`     → ${f.note}`);
    }
    const blocked = all.filter((f) => f.severity === 'block').length;
    console.log(`\n총 ${all.length}건 (차단 ${blocked}). 상세 기준은 system/anti-patterns.md.`);
    console.log(`가중치는 모드 '${mode}' 기준. 위반은 금지가 아니라 정당화 요구다 — 의도적이면 근거를 산출물에 남길 것.`);
  }
}

if (budget && !asJson) {
  console.log('\n── 위계 채널 예산 (system/decision-logic.md) ──');
  for (const c of budget.channels) {
    const mark = c.state === 'dead' ? (c.explicitKill ? '·  죽임(명시)' : '·  죽임')
      : c.state === 'flat' ? '❌ 평탄' : '✅ 살림';
    const capNote = c.capped ? `  (무명 ${c.raw - (c.named || 0)} → 상한 ${c.cap}로 절단: 통제되지 않은 변이)`
      : (c.named ? `  (이름 붙은 토큰 ${c.named}개)` : '');
    console.log(`  ${mark}  ${c.key.padEnd(9)} ${String(c.n).padStart(3)}단계${capNote}`);
  }
  console.log(`\n  판정: ${budget.verdict} — ${budget.why}`);
  console.log(`  신뢰도: ${budget.confidence}${budget.confidence !== 'high' ? '  ← 상한에 걸린 채널이 있어 배분 판정이 부정확하다. 토큰 정본(:root)에 돌릴 것' : ''}`);
  if (budget.flat > 0) {
    console.log('  → 평탄 채널은 죽이거나(0) 살려라(3+). 중간이 금지다.');
  }
}

process.exitCode = all.some((f) => f.severity === 'block') ? 1 : 0;   // exit() 는 파이프 출력을 64KB 에서 자른다 (2026-10-30)
