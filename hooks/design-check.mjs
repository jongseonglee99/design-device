#!/usr/bin/env node
// design-check — PostToolUse hook. 편집된 파일 1개를 검출한다.
//
// 경계는 PRD §6 이 정했다:
//   contrast-check  모드 불필요(대비는 장르와 무관) → 토큰 파일이면 항상 돈다
//   slop-scan       모드 필수 → 확실히 풀릴 때만. 애매하면 조용히 건너뛴다 (D-6)
//
// 기본은 비차단 경고. ❌(slop-scan exit 1)만 막는다 (D-5).
// 근거: 방해가 크면 사용자가 hook 을 끈다. 끄면 장치가 사라진다.
// 한 번의 오작동이 장치 전체를 날리므로, 틀린 모드로 차단하는 것이
// 검사를 안 하는 것보다 나쁘다.
//
// ★ **옵트인이 먼저다 (D-18, 2026-10-11).** `design.config.json` 이 없는 레포에서는
// **아무것도 하지 않는다** — 차단도, 경고도, 파일 쓰기도 없다.
// 초판은 contrast-check 를 무조건 돌려서, 장치를 쓴 적 없는 레포가
// `--muted: #9ca3af` (tailwind gray-400, 흰 배경 2.54:1) 하나로 **편집마다 차단**됐다.
// 그 레포에는 정당화를 적을 `UI_GUIDE.md` 도 없다. 고칠 길 없는 차단은 차단이 아니라 고장이다.
// 그리고 `.design-device/skipped.jsonl` 을 **남의 레포에** 만들어 `git status` 를 더럽혔다.
//
// 설정이 0개라는 약속은 깨지지 않는다 — `/design` A 단계가 모드를 정할 때
// 이 파일을 쓰므로, **장치를 쓰면 옵트인이 저절로 된다.** 쓰지 않은 레포만 조용하다.

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, extname, relative, isAbsolute, resolve } from 'node:path';
import { dataDir, ledgerFile, canon } from './_ledger.mjs';

const ROOT = process.env.CLAUDE_PLUGIN_ROOT ?? join(dirname(new URL(import.meta.url).pathname), '..');
const ok = (msg) => { if (msg) process.stdout.write(msg + '\n'); process.exit(0); };

// ─── 입력 ───
let input = '';
try { input = readFileSync(0, 'utf8'); } catch { ok(); }
let ev; try { ev = JSON.parse(input); } catch { ok(); }

const cwd = ev.cwd || process.cwd();
let file = ev.tool_input?.file_path || ev.tool_input?.filePath;
if (!file) ok();
if (!isAbsolute(file)) file = join(cwd, file);
if (!existsSync(file)) ok();

// 이 레포 자신의 편집에는 걸지 않는다 — 장치가 자기 자신을 검사하면 소음만 늘고,
// system/·observations/ 는 산출물이 아니라 규칙과 증거다.
if (file.startsWith(ROOT)) ok();

const ext = extname(file);
const rel = relative(cwd, file);
const CODE = new Set(['.css', '.scss', '.ts', '.tsx', '.js', '.jsx', '.html']);
if (!CODE.has(ext)) ok();

const run = (script, args) => {
  try {
    const out = execFileSync('node', [join(ROOT, 'scripts', script), ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000,
    });
    return { code: 0, out };
  } catch (e) {
    if (e.code === 'ENOENT' || e.signal) return null;      // 스크립트 없음·타임아웃 → 침묵
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') };
  }
};

// ─── 0. 옵트인 확인 — 이 레포가 장치를 쓰겠다고 선언했는가 ───
// 선언의 형태는 `design.config.json` 의 **존재**다. 파일 하나가 경계 전부다.
function findConfig() {
  for (let d = dirname(file); d.startsWith(cwd) || d === cwd; d = dirname(d)) {
    const cfg = join(d, 'design.config.json');
    if (existsSync(cfg)) {
      try { return { dir: d, conf: JSON.parse(readFileSync(cfg, 'utf8')) }; }
      catch { return { dir: d, conf: {} }; }   // 깨진 설정은 '선언은 했다'로 본다
    }
    if (d === cwd) break;
  }
  return null;
}
const found = findConfig();
if (!found) process.exit(0);                   // 옵트인 없음 → 완전 침묵
if (found.conf.hook === false) process.exit(0);  // 옵트인했지만 hook 만 끈 경우

// ─── 0b. 편집을 원장에 적는다 — Stop hook 이 읽는다 ───
// **검사보다 먼저** 적는다. 아래에서 검사가 죽어도 Stop 은 이 파일이 손댄 것을
// 알아야 한다 — 원장에 없는 편집은 "검사할 것이 없다"와 구별되지 않는다.
// 옵트인 확인 뒤인 것이 중요하다: 선언하지 않은 레포에는 원장도 남지 않는다 (`D-18`).
// 그리고 원장은 **레포 밖**에 쓴다 — 초판이 `.design-device/` 를 남의 레포에 만들어
// `git status` 를 더럽힌 그 실수를 영수증 빈도로 반복하지 않는다.
const ledger = ledgerFile(ev);
if (ledger) {
  try {
    mkdirSync(dataDir(), { recursive: true });
    // `agent` — 서브에이전트(생성자)의 편집인지. Stop 이 「아직 쓰는 중인 초안」을 가려낸다 (0.4.5)
    appendFileSync(ledger, JSON.stringify({ at: new Date().toISOString(), path: canon(file), agent: ev.agent_id || undefined }) + '\n');
  } catch { /* 원장을 못 쓴 것은 Stop 이 보고할 일이지 편집을 막을 일이 아니다 */ }
}

const notes = [];
let blocked = false;

// ─── 1. contrast-check — 토큰 파일이면 항상 ───
// 대비는 장르와 무관하므로 모드를 묻지 않는다.
//
// 그리고 여기서는 ❌ 를 **차단한다.** D-5 는 "❌ 차단 등급만 차단" 이고
// 대비 위반은 불변항 Ⅰ-1 위반이다. D-6 이 비차단을 요구한 이유는
// "틀린 모드로 차단하는 것이 검사를 안 하는 것보다 나쁘다" 였는데,
// 이 검사는 모드를 쓰지 않으므로 그 위험이 존재하지 않는다.
const TOKEN_FILE = /(globals|tokens|theme|variables|colors?)\.(css|scss|ts|tsx|js)$/i;
// 레포가 `paths.tokens` 로 선언한 파일도 토큰이다 — 이름이 관례를 벗어나도(`palette.css` 등)
// 선언이 이름 추측보다 우선한다 (2026-10-12: hook 이 `paths` 를 읽지 않던 알려진 빚).
const declaredToken = found.conf.paths?.tokens && resolve(found.dir, found.conf.paths.tokens) === resolve(file);
if (TOKEN_FILE.test(file) || declaredToken) {
  const r = run('contrast-check.mjs', [file]);
  if (r && r.code === 1) { blocked = true; notes.push(`❌ 대비 위반 (불변항 Ⅰ-1) — ${rel}\n${r.out.trim()}`); }
}

// ─── 2. 모드 해석 — 찾아 둔 설정 하나만 본다 ───
// 경로가 어느 override 와도 안 맞으면 모드는 '미해결'이다.
function resolveMode({ dir, conf }) {
  for (const [glob, mode] of Object.entries(conf.overrides ?? {})) {
    // 최소 글롭: ** → 임의 경로, * → 구분자 제외
    const re = new RegExp('^' + glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$');
    if (re.test(relative(dir, file))) return mode;
  }
  return conf.mode ?? null;
}
const mode = resolveMode(found);
const MODES = new Set(['tool', 'consumer', 'marketing', 'graphic']);

// ─── 3. slop-scan — 모드가 확실할 때만 ───
if (MODES.has(mode)) {
  const r = run('slop-scan.mjs', [file, '--mode', mode]);
  if (r && r.code === 1) { blocked = true; notes.push(`❌ 차단 등급 — ${rel} (모드 ${mode})\n${r.out.trim()}`); }
  else if (r && r.out.includes('⚠️')) notes.push(`⚠️ 정당화 요구 — ${rel} (모드 ${mode})\n${r.out.trim()}`);
} else {
  // 조용히 건너뛴다. 단 침묵하지는 않는다 — 원장에 남겨 /design-review 가 센다.
  try {
    mkdirSync(join(cwd, '.design-device'), { recursive: true });
    appendFileSync(join(cwd, '.design-device', 'skipped.jsonl'),
      JSON.stringify({ at: new Date().toISOString(), file: rel, reason: 'mode-unresolved' }) + '\n');
  } catch { /* 원장 실패가 편집을 막지 않는다 */ }
}

// ─── 출력 ───
if (!notes.length) process.exit(0);
const body = notes.join('\n\n');
if (blocked) {
  process.stderr.write(`[design-device] ${body}\n\n` +
    (MODES.has(mode)
      ? `모드 ${mode} 기준 차단 등급이다. 의도한 것이면 design.config.json 의 모드를 확인하거나 `
      : `대비는 모드와 무관한 불변항이다. `) +
    `UI_GUIDE.md 에 정당화 근거를 남긴다.\n`);
  process.exit(2);
}
process.stdout.write(`[design-device] ${body}\n`);
process.exit(0);
