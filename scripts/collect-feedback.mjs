#!/usr/bin/env node
// collect-feedback — 소비 레포에서 design 레포로 돌아오는 **역방향 경로**.
//
// 왜 필요한가: 빌드가 진행되면 소비 레포가 디자인의 오류·모순·회귀를 먼저 발견한다.
// 그런데 그것이 design 레포로 돌아올 길이 없었고, 그래서 같은 사고가 두 번 났다
// (control_tower D-20: 폰트 var() 참조가 재이식으로 두 번 지워짐).
// 소비 레포는 성실히 기록했는데 내가 읽을 방법이 없었던 것이다.
//
// 이 스크립트는 소비 레포에서 **디자인과 관련된 신호 3종**을 긁어온다:
//   ① DECISIONS.md 의 **새 결정 전부** — 디자인 어휘가 있는 것은 ★ (승인 `#34 B`, 2026-10-12)
//      초판은 디자인 어휘가 있는 결정만 보여 줬다. control_tower 의 제품 전환(D-47 「프로덕트 관제」 →
//      「나의 운영체제」)은 **제품 어휘**로 쓰여서 걸러졌고, 그 결정이 우리 화면 전부를 죽였다.
//      디자인에 가장 큰 영향을 주는 결정은 디자인 사건이 아닌 형태로 온다 — 어휘로 거르면
//      가장 중요한 것만 정확히 빠진다. 단어를 늘리는 것(#34 A)은 같은 실패의 반복이라 고르지 않았다.
//      비용은 첫 회수 한 번의 긴 목록이다 — 그 뒤로는 `--ack` 원장 덕에 새 결정만 뜬다.
//   ② UI_GUIDE.md·토큰 파일을 건드린 커밋 중 design 세션이 만들지 않은 것
//   ③ design-kit 사본과 정본의 드리프트
//      + **장치 레포에 남은 사본** — 대상 레포에 인계된 UI_GUIDE·토큰·화면 문서가 `products/` 에도
//        있으면 보고한다 (승인 `#35 C`). 정본이 대상 레포면 사본은 드리프트원이다 — 모션 「3밴드 vs 죽임」,
//        색 「무채색 vs 토스형」으로 두 번 갈렸고 아무도 세지 않았다
//   ⑤ **낡은 화면 문서** — `상위 문서` 의 PRD 버전 ≠ 대상 PRD 의 지금 버전 (승인 `#34 C`, `_prd.mjs`)
//   ④ **층 B 판정** — `docs/design-ledger.md` 의 C-2 시안 선택 (승인 `#45 A`, 2026-10-12)
//      대상 레포 세션은 장치 레포에 쓰지 못한다(규약 R-3: 쓰기는 cwd). 그래서 판정은
//      대상 레포의 원장에 쌓이고, 여기서 회수해 `system/taste-layer-b.md` 로 옮긴다.
//      **「왜」가 빈 항목은 회수하지 않는다** — 이유 없는 선택은 우연과 구별되지 않는다.
//      **위임(「너의 제안대로」)·장치 판단도 넣지 않는다**(⊘, 2026-10-13) — 취향 원장에 장치 자신의 판단이 섞인다.
//
// 사용: node scripts/collect-feedback.mjs <소비 레포 경로> [--json]
// 종료 코드: 0 = 새 항목 없음, 1 = 확인할 항목 있음, 2 = 사용법 오류

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, basename, dirname } from 'node:path';
import { readdirSync } from 'node:fs';
import { prdVersion, screenPrdVersion, comparePrd } from './_prd.mjs';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const target = args.find((a) => !a.startsWith('--'));
if (!target) { console.error('사용법: node scripts/collect-feedback.mjs <소비 레포 경로> [--json]'); process.exit(2); }
const REPO = resolve(target);
if (!existsSync(REPO)) { console.error(`경로 없음: ${REPO}`); process.exit(2); }
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
// 제품 디렉토리 이름: 레포 폴더명을 그대로 쓰면 control_tower / control-tower 로 갈린다.
// 하이픈으로 정규화하고, 이미 있는 디렉토리가 있으면 그쪽을 쓴다.
const slug = basename(REPO).replace(/_/g, '-').toLowerCase();
const name = existsSync(join(ROOT, 'products', slug)) ? slug
           : existsSync(join(ROOT, 'products', basename(REPO))) ? basename(REPO)
           : slug;

const git = (...a) => { try { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim(); }
                        catch { return ''; } };

// 대상 레포가 선언한 경로 — `design.config.json` 의 `paths`. 없으면 옛 기본값.
// 2026-10-12: control_tower 의 토큰 정본이 `apps/desktop/.../tokens.css` 로 옮겨 갔는데(D-58)
// 지켜보는 목록은 사라질 `src/app/globals.css` 였다. 설정에 이미 적혀 있었다.
let conf = {};
try { conf = JSON.parse(readFileSync(join(REPO, 'design.config.json'), 'utf8')); } catch { /* 옵트인 전 레포 */ }
const P = conf.paths ?? {};
const GUIDE = P.guide ?? 'docs/UI_GUIDE.md';
const SCREENS = P.screens ?? 'docs/screens';

// 처리 완료 원장 — 이미 확인한 항목을 다시 올리지 않는다
const ledgerPath = join(ROOT, 'products', name, 'feedback-ledger.json');
const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : { seenDecisions: [], seenCommits: [] };
ledger.seenPicks ??= [];
ledger.seenFields ??= [];

// ─── ① DECISIONS.md 의 새 결정 — 전부. 디자인 어휘가 있는 것만 ★ ───
const DESIGN_RE = /(디자인|design|UI_GUIDE|토큰|token|globals\.css|design-kit|와이어프레임|색|타이포|그림자|폰트|접근성|대비)/i;
const decisions = [];
const decPath = join(REPO, 'docs', 'DECISIONS.md');
if (existsSync(decPath)) {
  const txt = readFileSync(decPath, 'utf8');
  for (const m of txt.matchAll(/^###\s*(D[O]?-\d+)\.?\s*([^\n]*)\n([\s\S]*?)(?=\n###\s|\n##\s|$)/gm)) {
    const [, id, title, body] = m;
    if (ledger.seenDecisions.includes(id)) continue;
    decisions.push({ id, title: title.trim(), design: DESIGN_RE.test(title + body),
      excerpt: body.trim().split('\n').slice(0, 3).join(' ').slice(0, 220) });
  }
}

// ─── ② 디자인 자산을 건드린 남의 커밋 ───
const WATCHED = [...new Set([GUIDE, P.tokens, SCREENS, 'src/app/globals.css', 'design-kit'].filter(Boolean))];
const commits = [];
for (const f of WATCHED) {
  const log = git('log', '--format=%h\t%an\t%s', '--', f);
  if (!log) continue;
  for (const line of log.split('\n').filter(Boolean)) {
    const [sha, author, subject] = line.split('\t');
    // design 세션이 만든 커밋은 제목으로 식별한다 (design: / fix(design):)
    if (/^(design:|fix\(design\):)/.test(subject)) continue;
    if (ledger.seenCommits.includes(sha)) continue;
    if (commits.some((c) => c.sha === sha)) continue;
    commits.push({ sha, author, subject, file: f });
  }
}

// ─── ③ 키트 드리프트 ───
let drift = null;
try {
  execFileSync('node', [join(ROOT, 'scripts', 'sync-kit.mjs'), REPO, '--check'], { encoding: 'utf8' });
  drift = { clean: true };
} catch (e) { drift = { clean: false, detail: (e.stdout || '').trim().split('\n').slice(-6).join('\n') }; }

// ─── ③b 장치 레포에 남은 사본 (승인 #35 C) ───
// `products/<이름>*/` 아래에서 대상 레포에 **같은 이름으로 인계된** 파일을 찾는다.
const copies = [];
const prodDirs = existsSync(join(ROOT, 'products'))
  ? readdirSync(join(ROOT, 'products')).filter((d) => d === name || d.startsWith(name + '-')).map((d) => join(ROOT, 'products', d))
  : [];
const targetScreens = existsSync(join(REPO, SCREENS)) ? new Set(readdirSync(join(REPO, SCREENS))) : new Set();
for (const d of prodDirs) {
  const rel = (p) => p.replace(ROOT + '/', '');
  if (existsSync(join(d, 'UI_GUIDE.md')) && existsSync(join(REPO, GUIDE))) copies.push({ ours: rel(join(d, 'UI_GUIDE.md')), canon: GUIDE });
  if (P.tokens && existsSync(join(REPO, P.tokens)))
    for (const t of ['tokens.css', 'prototypes/tokens.css']) if (existsSync(join(d, t))) copies.push({ ours: rel(join(d, t)), canon: P.tokens });
  if (existsSync(join(d, 'screens')))
    for (const n of readdirSync(join(d, 'screens'))) if (targetScreens.has(n)) copies.push({ ours: rel(join(d, 'screens', n)), canon: `${SCREENS}/${n}` });
}

// ─── ⑤ 낡은 화면 문서 (승인 #34 C) ───
const stale = [];
const prd = prdVersion(REPO);
for (const n of targetScreens) {
  if (!n.endsWith('.md')) continue;
  const v = comparePrd(screenPrdVersion(readFileSync(join(REPO, SCREENS, n), 'utf8')), prd?.version);
  if (v.level === 'error' || v.level === 'warn') stale.push({ file: `${SCREENS}/${n}`, level: v.level, msg: v.msg });
}

// ─── ④ 층 B 판정 — docs/design-ledger.md ───
// 항목 형식은 `templates/DESIGN-LEDGER.template.md` — `## P-…` 머리 + 2열 표.
// 「시각 체계」 는 2026-10-12 추가 — 구조 셋을 비교하던 C-2 에서 사용자가 셋 다 거부했다
// (*"투박하고 뭘 먼저 봐야 할지 모르겠다. 색이 조금, 토스 같은 느낌"*). 셋이 공유하던
// **고정 변수(시각 체계)가 틀려 있었다.** 그 축을 먼저 정하는 라운드가 생겼다 (steps/C-wireframe.md 「C-2 전」).
// 「개념」 은 승인 `#48 B` (2026-10-12) — consumer·marketing·graphic 은 개념 라운드가 먼저다
// 「합성」 은 승인 `#49 A` (2026-10-13) — 고른 안에 다른 안의 장점을 합치는 2라운드
const STRUCT_AXES = ['개념', '합성', '시각 체계', '골격', '정보 구조', '밀도 체계'];
const picks = [];
const fields = [];
const pickPath = join(REPO, 'docs', 'design-ledger.md');
if (existsSync(pickPath)) {
  const text = readFileSync(pickPath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const blk of text.split(/^## /m).slice(1)) {
    const id = blk.split('\n')[0].trim();
    if (!/^P-\d{4}-\d{2}-\d{2}-/.test(id) || /YYYY/.test(id)) continue;   // 틀의 예시는 건너뛴다
    if (ledger.seenPicks.includes(id)) continue;
    const row = {};
    for (const m of blk.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*$/gm)) {
      if (/^-+$/.test(m[1]) || !m[1].trim()) continue;
      // 「시안 A (가 · `01-ask.html`)」 처럼 칸 이름에 설명을 붙여도 「시안 A」 다 (Seemilar 실측)
      const k = m[1].trim().replace(/^(시안\s*[A-Z])\b.*$/, (_, a) => a.replace(/\s+/, ' '));
      row[k] = m[2].trim();
    }
    // ★ ⑦ **실사용 지적** — 구현된 화면을 쓰다가 사용자가 한 말 (2026-10-30 — control_tower F-1~F-4).
    // 시안 판정이 아니라서 「시안·선택이 없다」 로 ✗ 처리되고 있었는데, **가장 값진 종류**다: 사용자 말이 그대로 있고
    // 세션이 「규칙으로」 · 「장치에(안티패턴 후보)」 까지 적어 두었다. 층 B 가 아니라 따로 모은다 → `products/field-findings.md`
    if (/실사용/.test(id) || (row['사용자 말'] && !row['선택'])) {
      // 위임은 실사용 지적이 아니다 (2026-W44 — *"홈 큰 시계는 너의 추천대로 갈게"* 가 ⑦ 로 들어왔다). 보았다고만 적는다
      const delegatedField = /(제안|추천)\s*(으로|대로)|알아서|맡길|맡긴|맡겨|(너|네)가\s*골라/.test(row['사용자 말'] ?? '');
      if (!ledger.seenFields.includes(id)) {
        if (delegatedField) ledger.seenFields.push(id); else fields.push({ id, row });
      }
      continue;
    }
    // 타당성 요건 (system/taste-layer-b.md) — 어긴 것을 **적어서** 보고한다. 조용히 버리지 않는다.
    const problems = [];
    // ★ 칸에 **축 이름이 정확히 하나** 들어 있으면 그 축이다 (2026-10-12 수정 — 실측).
    // 첫 실데이터 두 건이 둘 다 ✗ 로 버려졌다: 모델이 칸에 설명을 덧붙였다
    // (「정보 구조 — 「무엇의 모양인가」」 · 「(없음 — …) **시각 체계** 시안이다」).
    // 판정은 멀쩡했고 요건 ①이 묻는 것(축이 하나인가)도 지켰다. 완전 일치를 요구한 것은
    // 형식을 사실로 착각한 것이다. 둘 이상이거나 없으면 그대로 무효다.
    // ★ 「라운드」 칸도 축으로 읽는다 (2026-10-13) — #49 이후 control_tower 세션은 「구조 축」 대신
    // 「라운드 | ① 생성 / ② 합성 / ③ 정제」를 썼다. 틀(templates/DESIGN-LEDGER)이 라운드를 따라가지 못한 것이다.
    // 생성 라운드는 개념이 다른 셋이므로 「개념」, 정제는 축 하나를 확정하는 판정이므로 「정제」로 둔다.
    const roundCell = row['라운드'] ?? '';
    const axisCell = row['구조 축'] ?? (/생성/.test(roundCell) ? '개념' : /합성/.test(roundCell) ? '합성' : /정제/.test(roundCell) ? '정제' : '');
    // 괄호 안은 설명이다 — 「시각 체계 (3라운드 정제 — B 구조 고정)」 는 시각 체계 하나다 (Seemilar 실측, 2026-10-30)
    const named = [...STRUCT_AXES, '정제'].filter((a) => axisCell.replace(/\([^)]*\)/g, '').includes(a));
    // ★ #49 이후 축 문제는 **보류(△)지 무효가 아니다** (2026-10-13) — 생성·합성 라운드의 판정은 측정이 아니라 방향 데이터다.
    // 실측: control_tower S07 「펼친 묶음 + 찾기 칸 더하기」(합성 판정, 「왜」 있음)가 세션이 지은 축 이름 때문에 ✗ 로 버려지고 있었다.
    if (named.length === 1) row['구조 축'] = named[0];
    else problems.push(`① 구조 축이 「${axisCell || '없음'}」 — 개념·합성·시각 체계·골격·정보 구조·밀도 체계 중 **하나만** 있어야 한다${named.length > 1 ? ` (${named.join('·')} 이 함께 있다)` : ''}`);
    // ② 시안이 **하나도** 없으면 무효. 정제 「확정」은 시안 하나에 대한 판정이라 셋을 요구하지 않는다
    // (control_tower 정제 판정 3건이 「시안 셋이 없다」로 버려지고 있었다 — 2026-10-13)
    const variants = Object.keys(row).filter((k) => /^시안( [A-Z])?$/.test(k) && row[k] && !/^해당 없음/.test(row[k]));
    // ★ 시안 칸이 없어도 **제시 순서·선택이 무엇을 골랐는지 말하면** 보류(△)다 (2026-10-30 — Seemilar 실측).
    // 세션들이 「시안 A/B/C」 칸 대신 「제시 순서 | A · B · C (`00-index.html`)」 + 「선택 | A (`S04-a.html`)」 로 적었고,
    // 사용자 말이 따옴표로 길게 붙은 판정 20여 건이 「시안이 없다」 로 **전부 버려지고 있었다.** 가장 값진 데이터가 형식 때문에 빠졌다.
    const shownOpts = (row['제시 순서'] ?? '').replace(/\([^)]*\)|`[^`]*`/g, '').split(/[·,/]/).map((x) => x.trim()).filter(Boolean);
    if (!variants.length && (shownOpts.length > 1 || /\.html|^[A-Z0-9]\b/.test(row['선택'] ?? ''))) problems.push('②′ 시안 설명 칸이 없다 — 제시 순서·선택으로만 안다 (보류)');
    else if (!variants.length) problems.push('② 시안이 적혀 있지 않다');
    // 「왜」 칸이 차 있어도 **스스로 이유가 없다고 적은** 것은 없는 것이다 — 인용 밖에서만 본다(사용자 말 「이유가 전혀 없음」 은 이유다) (Seemilar 「(이유 메모 없음)」 · dogu 「이유를 따로 말하지 않았다」 — 2026-10-30)
    if (!row['왜'] || /^\*?\*?한 줄/.test(row['왜']) || /이유[^.。]{0,8}(없음|말하지 않았다)/.test(row['왜'].replace(/["“][^"”]*["”]/g, ''))) problems.push('③ 「왜」가 없다 — **회수하지 않는다**');
    if (!/^(tool|consumer|marketing|graphic)$/.test(row['모드'] ?? '')) problems.push('④ 모드가 명시되지 않았다');
    if ((variants.length > 1 || shownOpts.length > 1) && (!row['제시 순서'] || /^A\s*·\s*B\s*·\s*C$/.test(row['제시 순서']))) problems.push('⑤ 제시 순서를 섞지 않았다(또는 안 적었다) — 위치 효과를 통제하지 못한다');
    const invalid = problems.some((p) => /^(②|③)(?!′)/.test(p));   // ②③ 은 무효(시안·「왜」 없음), ①④⑤ 는 보류
    // ★ ⑥ 「왜」가 **사용자의 말**인가 (2026-10-13 — 세 레포 원장 실측).
    // dogu 는 「왜」에 *"3개 다 너의 제안으로 갈게"* 를 적고 이유 자리를 장치의 추천 근거로 채웠다(3건).
    // 토큰 결정 2건은 「왜」 전체가 장치의 판단이었고, control_tower S07-3 은 「(말하지 않음 — 추천 이유: …)」.
    // 셋 다 「왜가 있다」로 통과했다 — 그대로 회수하면 **사용자 취향 원장에 장치 자신의 판단이 섞인다.**
    // 위임은 무효(✗)가 아니라 ⊘ 다: 고쳐서 다시 올라올 것이 없으므로 seen 으로 기록하고 층 B 에는 넣지 않는다.
    // 판정자 칸이 정본이고, 없을 때만 문구로 추정한다. 사용자 말은 따옴표로 인용한다는 규약(steps/C-wireframe.md)을 쓴다.
    const why = row['왜'] ?? '';
    const quoted = /["“”]/.test(why) || /P-\d{4}-\d{2}-\d{2}-[\w-]+/.test(why);   // 다른 항목의 말을 가리키면 인용으로 친다
    const DELEGATE = /(제안|추천)\s*(으로|대로)|알아서|맡길|맡긴|맡겨|(너|네)가\s*골라/;
    let delegated = '';
    if (/위임/.test(row['판정자'] ?? '')) delegated = '판정자: 위임';
    // 확신·선택 칸이 위임을 말하는 경우 (Seemilar 「위임(사용자 판정 아님 …)」 · 「**Claude 가 고름**」, control_tower 「세션 추천」)
    else if (/시안\s*판정\s*아님/.test(row['확신'] ?? '')) delegated = '시안 판정이 아니라 사용자 지시 — 층 B 에 넣지 않는다';
    else if (/위임|세션\s*추천/.test(row['확신'] ?? '') || /Claude\s*가\s*고름|세션\s*추천/.test(row['선택'] ?? '')) delegated = '확신·선택 칸: 위임 · 세션 추천';
    else if (/장치/.test(row['판정자'] ?? '')) delegated = '판정자: 장치 — 사용자에게 묻지 않은 결정';
    else if (why && DELEGATE.test(why)) delegated = `위임 문구 — 「${why.match(DELEGATE)[0]}」`;
    else if (why && !invalid && !quoted) delegated = '「왜」에 사용자 말(따옴표 인용)이 없다 — 적힌 이유는 장치의 것이다';
    picks.push({ id, row, problems, invalid: invalid && !delegated, delegated });
  }
}

const report = { repo: name, decisions, commits, drift, copies, stale, prd, picks, fields };
const pending = decisions.length + commits.length + picks.length + fields.length + copies.length + stale.length;
// 파이프에서 64KB 를 넘으면 `process.exit` 가 출력을 자른다(gate 에서 겪은 것 — 2026-10-30 회수 JSON 이 잘렸다). 다 쓴 뒤에 끝낸다.
if (asJson) { process.stdout.write(JSON.stringify(report, null, 2) + '\n', () => process.exit(pending ? 1 : 0)); }
else {

console.log(`[collect-feedback] ${name}`);
if (decisions.length) {
  const star = decisions.filter((d) => d.design);
  console.log(`\n── 새 결정 ${decisions.length}건 (★ 디자인 어휘 ${star.length}건) — 제목은 전부 읽는다 ──`);
  console.log('   디자인 단어가 없어도 화면을 죽이는 결정이 있다 (D-47 제품 전환이 그랬다)');
  for (const d of decisions) console.log(d.design ? `  ★ ${d.id}  ${d.title}\n       ${d.excerpt}` : `    ${d.id}  ${d.title}`);
}
if (stale.length) {
  console.log(`\n── 화면 문서와 PRD 버전 (${prd?.file} v${prd?.version}) ──`);
  for (const x of stale) console.log(`  ${x.level === 'error' ? '❌' : '⚠️ '} ${x.file}\n     ${x.msg}`);
}
if (copies.length) {
  console.log(`\n── 장치 레포에 남은 사본 ${copies.length}건 — 정본은 대상 레포다 (#35 C) ──`);
  for (const c of copies) console.log(`  ${c.ours}   ← 정본 ${c.canon}`);
  console.log('  인계가 끝난 사본은 지운다. 남겨 두면 갈라지고, 낡은 쪽이 다음 조언의 근거가 된다.');
}
if (commits.length) {
  console.log(`\n── 디자인 자산을 건드린 소비 레포 커밋 ${commits.length}건 ──`);
  for (const c of commits) console.log(`  ${c.sha}  ${c.subject}\n     └ ${c.file} · ${c.author}`);
  console.log('\n  이 변경들은 정본에 반영할지 판단해야 한다. 다음 이식 때 조용히 지워진다.');
}
if (!drift.clean) { console.log('\n── 키트 드리프트 ──'); console.log(drift.detail.replace(/^/gm, '  ')); }
if (picks.length) {
  console.log(`\n── 층 B 판정 ${picks.length}건 (docs/design-ledger.md) ──`);
  for (const pk of picks) {
    const r = pk.row;
    console.log(`  ${pk.delegated ? '⊘' : pk.invalid ? '✗' : (pk.problems.length ? '△' : '✓')} ${pk.id}  ${r['화면'] ?? ''} · ${r['구조 축'] ?? '?'} · 선택 ${r['선택'] ?? '?'} (${r['확신'] ?? '?'})`);
    if (r['왜']) console.log(`     왜: ${r['왜']}`);
    if (pk.delegated) { console.log(`     ⑥ ${pk.delegated}`); continue; }
    for (const p of pk.problems) console.log(`     ${p}`);
  }
  console.log('  ✓ 회수 · △ 보류(회수하되 표시) · ✗ 무효(고치면 다시 올라온다) · ⊘ 위임·장치 판단(층 B 에 넣지 않는다)');
}
if (fields.length) {
  console.log(`\n── ★ 실사용 지적 ${fields.length}건 — 구현된 화면을 쓰다가 한 말 (안티패턴·톤 카드 후보) ──`);
  for (const { id, row: r } of fields) {
    console.log(`  ★ ${id}\n     화면: ${r['화면'] ?? '?'}`);
    if (r['사용자 말']) console.log(`     말: ${r['사용자 말'].slice(0, 400)}`);
    if (r['장치에']) console.log(`     장치에: ${r['장치에']}`);
  }
}
if (!pending && drift.clean) console.log('\n새 항목 없음.');
else console.log(`\n확인 후 원장에 기록: node scripts/collect-feedback.mjs ${target} --ack`);

if (args.includes('--ack')) {
  ledger.seenDecisions.push(...decisions.map((d) => d.id));
  ledger.seenCommits.push(...commits.map((c) => c.sha));

  // ④ 유효한 판정만 층 B 원장에 덧붙인다. 무효(①②③)는 **seen 으로도 기록하지 않는다** —
  // 대상 레포에서 「왜」를 채우면 다음 회수에서 다시 올라와야 한다.
  const keep = picks.filter((pk) => !pk.invalid && !pk.delegated);
  // ⊘ 는 고쳐서 다시 올라올 것이 없다 — 보았다고만 적는다
  ledger.seenPicks.push(...picks.filter((pk) => pk.delegated).map((pk) => pk.id));
  if (keep.length) {
    const lb = join(ROOT, 'system', 'taste-layer-b.md');
    let body = readFileSync(lb, 'utf8').replace(/\n_아직 없다\._[^\n]*\n/, '\n');
    for (const pk of keep) {
      const r = pk.row;
      body += `\n### ${pk.id} · ${name}\n\n`
        + `| 화면 | 모드 | 구조 축 | 선택 | 확신 | 제시 순서 |\n|---|---|---|---|---|---|\n`
        + `| ${r['화면'] ?? ''} | ${r['모드'] ?? ''} | ${r['구조 축'] ?? ''} | **${(r['선택'] ?? '').replace(/\*\*/g, '')}** | ${r['확신'] ?? ''} | ${r['제시 순서'] ?? ''} |\n\n`
        + (r['시안'] ? `- 시안 — ${r['시안']}\n\n` : `- A — ${r['시안 A'] ?? ''}\n- B — ${r['시안 B'] ?? ''}\n- C — ${r['시안 C'] ?? ''}\n\n`)
        + `> **왜** — ${r['왜'] ?? ''}\n`
        + (pk.problems.length ? `>\n> 보류: ${pk.problems.join(' / ')}\n` : '');
    }
    writeFileSync(lb, body.replace(/\n{3,}/g, '\n\n'));
    ledger.seenPicks.push(...keep.map((pk) => pk.id));
    console.log(`층 B 원장에 ${keep.length}건: system/taste-layer-b.md`);
  }
  if (fields.length) {
    const ff = join(ROOT, 'products', 'field-findings.md');
    let body = existsSync(ff) ? readFileSync(ff, 'utf8')
      : '# 실사용 지적 — 구현된 화면을 쓰다가 사용자가 한 말\n\n'
        + '> `collect-feedback.mjs` ⑦ 이 소비 레포 `docs/design-ledger.md` 에서 모은다. **후보 저장소**다 —\n'
        + '> `system/anti-patterns.md` · `system/tone-card.md` 로 올리려면 승인(`approvals.mjs`)을 거친다.\n'
        + '> 두 레포 이상 · 두 번 이상 나온 지적이 먼저다.\n';
    for (const { id, row: r } of fields) {
      body += `\n## ${id} · ${name}\n\n- 화면 — ${r['화면'] ?? ''}\n`
        + (r['종류'] ? `- 종류 — ${r['종류']}\n` : '')
        + `\n> **사용자 말** — ${r['사용자 말'] ?? ''}\n\n`
        + (r['앞선 같은 지적'] ? `- 앞선 같은 지적 — ${r['앞선 같은 지적']}\n` : '')
        + (r['규칙으로'] ? `- 규칙으로(세션 정리) — ${r['규칙으로']}\n` : '')
        + (r['장치에'] ? `- 장치에(세션 제안) — ${r['장치에']}\n` : '');
    }
    writeFileSync(ff, body);
    ledger.seenFields.push(...fields.map((f) => f.id));
    console.log(`실사용 지적 ${fields.length}건: products/field-findings.md`);
  }
  mkdirSync(dirname(ledgerPath), { recursive: true });
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
  console.log(`원장 갱신: ${ledgerPath.replace(ROOT + '/', '')}`);
}
process.exitCode = pending ? 1 : 0;   // exit() 는 파이프 출력을 64KB 에서 자른다 (2026-10-30)
}
