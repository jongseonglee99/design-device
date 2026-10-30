#!/usr/bin/env node
// design-review — 산출물을 **다른 모델**로 교차 채점한다.
//
// 왜 다른 모델인가: 플랫폼 귀속 편향은 같은 모델로 검출되지 않는다.
// 자기가 만든 기본값을 기본값으로 볼 수 없다. `generic` 축이 이 스크립트의 존재 이유다.
// (system/rubrics/critic-axes.md — "이 축은 반드시 다른 모델이 채점한다")
//
// 기존 레포 scripts/cross_review.py 의 구조를 계승한다:
//   · 결정론적 mock — 키 없이도 파이프라인 검증
//   · graceful skip — 키 없고 mock 도 아니면 exit 0
//   · **리뷰어는 산출물을 수정하지 않는다. 리포트만 남긴다**
//   · --snapshot-tag 로 주차별 history 누적
//
// 사용:
//   node scripts/design-review.mjs <경로> --mode <모드> [--mock|--via openai|--via codex]
//                                  [--out <파일>] [--snapshot-tag <태그>]
// 종료 코드: 0 = 통과 또는 skip, 1 = blocking, 2 = 사용법 오류

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname, extname, basename, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const AXES = ['generic', 'craft', 'currency', 'fit'];
const MODES = ['tool', 'consumer', 'marketing', 'graphic'];
const MAX_CHARS = 60_000;

// .env 로드 (의존성 없는 KEY=VALUE 파서). 셸 환경변수가 우선.
for (const f of [join(ROOT, '.env')]) {
  if (!existsSync(f)) continue;
  for (const raw of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [k, ...rest] = line.split('=');
    const key = k.trim();
    if (key && !(key in process.env)) process.env[key] = rest.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const useMock = args.includes('--mock');
const via = flag('--via') || 'openai';
const mode = flag('--mode');
const snapshotTag = flag('--snapshot-tag');
const outPath = flag('--out');
const target = args.find((a) => !a.startsWith('--') && a !== mode && a !== via && a !== snapshotTag && a !== outPath);

if (!target || !mode) {
  console.error('사용법: node scripts/design-review.mjs <경로> --mode tool|consumer|marketing|graphic [--mock|--via openai|--via codex]');
  process.exit(2);
}
if (!MODES.includes(mode)) { console.error(`알 수 없는 모드: ${mode}`); process.exit(2); }
const root = resolve(target);
if (!existsSync(root)) { console.error(`경로 없음: ${root}`); process.exit(2); }

// ─── 기계 측정을 먼저 붙인다 — 리뷰어가 눈대중으로 세지 않게 ───
function run(script, extra = []) {
  try { return JSON.parse(execFileSync('node', [join(ROOT, 'scripts', script), root, ...extra, '--json'],
    { encoding: 'utf8', maxBuffer: 8 << 20 })); }
  catch (e) { try { return JSON.parse(e.stdout || '{}'); } catch { return { error: String(e.message).slice(0, 200) }; } }
}
const slop = run('slop-scan.mjs', ['--mode', mode, '--budget']);
const tokensFile = statSync(root).isDirectory()
  ? ['tokens.css', 'globals.css'].map((f) => join(root, f)).find(existsSync)
  : root;
const contrast = tokensFile ? (() => {
  try { return JSON.parse(execFileSync('node', [join(ROOT, 'scripts', 'contrast-check.mjs'), tokensFile, '--json'],
    { encoding: 'utf8', maxBuffer: 8 << 20 })); }
  catch (e) { try { return JSON.parse(e.stdout || '{}'); } catch { return null; } }
})() : null;

// ─── 산출물 본문 ───
const files = statSync(root).isDirectory()
  ? readdirSync(root).filter((f) => ['.html', '.css'].includes(extname(f))).sort().map((f) => join(root, f))
  : [root];
let body = '';
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  body += `\n\n===== ${basename(f)} =====\n${t}`;
  if (body.length > MAX_CHARS) { body = body.slice(0, MAX_CHARS) + '\n…(이하 생략)'; break; }
}

const antiPatterns = existsSync(join(ROOT, 'system/anti-patterns.md'))
  ? readFileSync(join(ROOT, 'system/anti-patterns.md'), 'utf8')
      .split('## 모드별 가중치')[1]?.split('---')[0]?.slice(0, 4000) ?? '' : '';

const SYSTEM = `당신은 한국 1인 개발자의 디자인 산출물을 검수하는 **외부 검수자**입니다.
검수 대상은 Claude(Anthropic)가 만든 것이고, 당신은 다른 모델입니다.
그래서 당신에게 요구되는 것이 하나 있습니다 — **Claude 자신은 볼 수 없는 것을 보는 것.**

네 축으로 0.0~1.0 채점하고 한 줄 코멘트를 답니다. 소수점 2자리.

- generic  : 이 산출물이 "AI가 만든 것"으로 읽히는가. **가장 중요합니다.**
             모드는 무엇이 허용되는지를 바꾸지만, 그것이 기본값의 복제인지는 바꾸지 않습니다.
             토큰 이름만 바꾼 같은 결정, 임의 hex로 쓴 같은 색을 찾으세요.
             핵심 질문: **이 디자인을 다른 제품에 그대로 붙여도 어색하지 않은가?**
             그렇다면 정체성이 없다는 뜻이고 낮은 점수입니다.
             낮은 점수의 전형: "흠잡을 데 없는데 어디서 본 것 같다".
- craft    : 접근성과 위계. 대비, 빈 상태·로딩·에러 설계, 반응형이 재배치인가 축소인가,
             한글 조판(word-break: keep-all + overflow-wrap 짝, 자간이 크기의 함수인가).
- currency : 최신성. 단, 상한이 낮습니다. generic 이 낮으면 currency 점수는 무의미합니다
             — 최신 트렌드의 균질한 복제일 뿐입니다.
- fit      : 선언된 모드(${mode})의 자세에 맞는가.
             흔한 오판: marketing 의 낮은 정보 밀도, consumer 의 큰 여백은 감점 사유가 아닙니다.

**당신은 산출물을 수정하지 않습니다. 리포트만 남깁니다.**
사소한 스타일만으로 차단하지 마세요.

JSON 한 객체로만 응답. 마크다운·코드펜스 금지.`;

const USER = `## 선언된 모드
${mode}

## 안티패턴 모드별 가중치 (❌ 차단 · ⚠️ 감점 · · 정보 · — 비활성)
${antiPatterns}

## 기계 측정 — 이미 센 것이니 다시 세지 마세요
### 위계 채널 예산
${JSON.stringify(slop?.budget ?? {}, null, 2)}
### 검출된 항목
${JSON.stringify((slop?.findings ?? []).map((f) => ({ code: f.code, severity: f.severity, msg: f.msg ?? f.label })), null, 2)}
### 토큰 대비
${JSON.stringify(contrast?.findings ?? [], null, 2)}

## 산출물
${body}

## 응답 스키마
{"scores":{"generic":0.0,"craft":0.0,"currency":0.0,"fit":0.0},
 "comments":[{"axis":"generic","issue":"한 줄","suggestion":"한 줄"}],
 "verdict":"approve|needs_changes|blocking"}`;

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['scores', 'comments', 'verdict'],
  properties: {
    scores: { type: 'object', additionalProperties: false, required: AXES,
      properties: Object.fromEntries(AXES.map((a) => [a, { type: 'number' }])) },
    comments: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['axis', 'issue', 'suggestion'],
      properties: { axis: { type: 'string' }, issue: { type: 'string' }, suggestion: { type: 'string' } } } },
    verdict: { type: 'string', enum: ['approve', 'needs_changes', 'blocking'] },
  },
};

function mockScore(text) {
  // 결정론적 — 같은 입력이면 같은 점수. CI 검증용.
  const d = createHash('sha256').update(text).digest();
  const scores = Object.fromEntries(AXES.map((a, i) => [a, +(0.6 + (d[i] % 41) / 100).toFixed(2)]));
  const low = AXES.reduce((m, a) => (scores[a] < scores[m] ? a : m), AXES[0]);
  return { scores, comments: [{ axis: low, issue: '[mock] 결정론적 더미 — 실제 검수가 아닙니다.',
    suggestion: '[mock] OPENAI_API_KEY 또는 codex CLI 로 본 검수를 돌리세요.' }],
    verdict: scores[low] < 0.6 ? 'needs_changes' : 'approve' };
}

async function callOpenAI(key) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5',
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }],
      response_format: { type: 'json_schema', json_schema: { name: 'design_review', strict: true, schema: SCHEMA } } }),
  });
  if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return JSON.parse((await r.json()).choices[0].message.content);
}

function callCodex() {
  const out = execFileSync('codex', ['exec'], { input: `${SYSTEM}\n\n${USER}`, encoding: 'utf8',
    timeout: 240_000, maxBuffer: 16 << 20 });
  const fence = out.split('```json')[1]?.split('```')[0];
  const raw = fence ?? out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
  return JSON.parse(raw);
}

let report, reviewer;
try {
  if (useMock) { report = mockScore(USER); reviewer = 'mock/deterministic'; }
  else if (via === 'codex') {
    try { execFileSync('which', ['codex'], { stdio: 'ignore' }); }
    catch { console.error('[design-review] codex CLI 미설치 — graceful skip.'); process.exit(0); }
    report = callCodex(); reviewer = 'codex';
  } else {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.error('[design-review] OPENAI_API_KEY 미설정 — graceful skip.');
      console.error('  .env 에 OPENAI_API_KEY 를 넣거나, --via codex 또는 --mock 을 쓰세요.');
      process.exit(0);
    }
    report = await callOpenAI(key); reviewer = `openai/${process.env.OPENAI_MODEL || 'gpt-5'}`;
  }
} catch (e) { console.error(`[design-review] 호출 실패: ${e.message}`); process.exit(0); }

for (const a of AXES) report.scores[a] = Math.max(0, Math.min(1, Number(report.scores?.[a] ?? 0)));
// 판정은 우리 루브릭이 한다 — 모델의 verdict 는 참고값이다
const blocked = report.scores.generic < 0.6 || report.scores.craft < 0.6;
const verdict = blocked ? 'blocking' : report.scores.fit < 0.6 ? 'needs_changes' : 'approve';
const final = { version: '1', target: root, mode, reviewer, verdict,
  modelVerdict: report.verdict, scores: report.scores, comments: report.comments ?? [] };

// ★ 기본 저장 위치 — **장치 레포 안에서 돌 때만** `reviews/`, 다른 레포에서는 그 레포의 `.design-device/reviews/`
// (2026-10-12 섀도 런: 대상 레포에서 돌렸더니 결과가 **플러그인 설치 폴더** `reviews/` 에 써졌다 — 업데이트하면 사라지고
// 규약 R-3(쓰기는 cwd)에도 어긋난다)
const inDevice = !relative(ROOT, process.cwd()).startsWith('..') && existsSync(join(ROOT, '.git'));
const base = inDevice ? join(ROOT, 'reviews') : join(process.cwd(), '.design-device', 'reviews');
const dest = outPath ?? (snapshotTag
  ? join(base, 'snapshots', snapshotTag, `${basename(root)}.json`)
  : join(base, `${basename(root)}.json`));
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify(final, null, 2) + '\n');

console.log(`[design-review] ${reviewer} · 모드 ${mode}`);
for (const a of AXES) console.log(`  ${a.padEnd(9)} ${final.scores[a].toFixed(2)}`);
console.log(`\n  판정: ${verdict}${blocked ? '  ← generic 또는 craft 가 0.6 미만' : ''}`);
for (const c of final.comments) console.log(`  [${c.axis}] ${c.issue}\n     → ${c.suggestion}`);
console.log(`\n  저장: ${dest.replace(ROOT + '/', '')}`);
console.log('  리뷰어는 산출물을 수정하지 않는다. 수정은 사람이 판단한다.');
process.exitCode = verdict === 'blocking' ? 1 : 0;   // exit() 는 파이프 출력을 64KB 에서 자른다 (2026-10-30)
