#!/usr/bin/env node
// validate-observation — 관측 파일이 스키마를 지켰는지 검사한다.
//
// harness/weekly-scan.md §2 의 Acceptance Criteria.
// 추상 서술 금지 원칙을 기계로 강제한다 — 특히 두 가지:
//   ① 값이 아니라 관계로 기록했는가 (L3 에 hex 만 있고 대비·색상각이 없으면 실패)
//   ② 트레이드오프 쌍이 채워졌는가 (없으면 결정이 아니라 취향이므로 승격 불가)
//
// **kind 별로 스키마가 다르다 (승인 #27, 2026-10-09).**
// 초판은 사이트 분해 전용 스키마 하나만 갖고 있어서, 측정 단위가 사이트라는 가정이
// 하드코딩돼 있었다. 그 결과 구술·메타 관측 3건(통독 1,298편 + 핸들 127개 실측 +
// 영어권 9,280편)이 전부 '위반'으로 판정되어 AC 게이트가 자기 자산을 거부했다.
// registry.yaml 은 이미 kind 를 5종으로 선언하고 있었고 검증기만 몰랐다.
//
// 사용: node scripts/validate-observation.mjs <파일|디렉토리> [--json]
// 종료 코드: 0 = 통과, 1 = 위반, 2 = 사용법 오류

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

// ─── kind → 스키마 ─────────────────────────────────────────────────────────
// 사이트 분해(rendered/shot/shipped/system)는 측정 단위가 사이트 1개다.
// 구술(spoken)은 사람의 발언이라 플랫폼·시장·색상 측정이 존재할 수 없고,
// 대신 표본과 방법이 필수다 — 그것이 구술 관측의 재현 가능성 전부이기 때문이다.
// 메타(meta-observation)는 소스 자체에 대한 관측이라 출처가 아니라 목적을 적는다.
const SITE_KINDS = ['rendered', 'shot', 'shipped', 'system'];

const SCHEMAS = {
  site: {
    label: '사이트 분해',
    sections: ['L0', 'L2', 'L3', 'L8', 'L9'],   // L1·L4~L7 은 소스 정책상 생략 가능
    l0: [['출처', /출처/], ['캡처일', /캡처일/], ['플랫폼', /플랫폼/], ['시장', /시장/]],
    deep: true,                                  // L3 관계 검사 · L8 트레이드오프 · L9 모드
  },
  spoken: {
    label: '구술',
    sections: ['L0'],
    l0: [['출처', /출처/], ['수집일', /수집일/], ['표본', /표본/],
         ['방법', /방법/], ['verified', /verified/]],
    deep: false,
    requirePromotionNote: true,  // 구술은 verified 가 될 수 없다 → 지위를 스스로 밝혀야 한다
  },
  meta: {
    label: '메타(소스에 대한 관측)',
    sections: ['L0'],
    l0: [['수집일', /수집일/], ['방법', /방법/], ['verified', /verified/]],
    deep: false,
  },
  // 자체 대조군 판정 (2026-10-09 신설). 사이트도 구술도 메타도 아니다 —
  // 우리가 만든 아트보드 변형을 사용자가 판정한 것이다. 아트보드는 돌아가는 코드이므로
  // verified 가 될 수 있지만, 외부 사이트가 아니라 플랫폼·시장이 존재하지 않는다.
  // 필수항은 '이 판정을 믿을 수 있는가'를 재는 것들이다 —
  // 일관성 검정 없이는 위치 효과와 취향을 구분할 수 없고,
  // 무효 문항을 밝히지 않으면 깨진 문항의 답이 근거로 섞여 들어간다.
  probe: {
    label: '자체 대조군 판정',
    sections: ['L0'],
    l0: [['판정자', /판정자/], ['수집일', /수집일/], ['문항 수', /문항\s*수/],
         ['일관성 검정', /일관성\s*검정/], ['무효 문항', /무효\s*문항/], ['verified', /verified/]],
    deep: false,
  },
};

const L8_FIELDS = [['신선함', /신선함/], ['포화', /포화/], ['이식 최소단위', /이식\s*최소단위/],
                   ['트레이드오프 쌍', /트레이드오프\s*쌍/]];
const MODES = /(tool|consumer|marketing|graphic)/;
// 관계 표현 — 값이 아니라 관계로 적었는지 판정
const RELATION = /(대비|:1\b|색상각|°|거리|비율|배|함수|단계|밴드|램프|채도|명도)/;

// kind 를 읽는다. 명시 선언이 없으면 L0 의 출처 줄에서 추론하고 경고를 남긴다
// (2026-08-18 관측 5건이 `출처: gdweb.co.kr (rendered)` 형식으로 kind 를 괄호에 적었다).
function detectKind(text, l0) {
  const m = text.match(/kind:\s*\**\s*([a-z-]+)/i);
  if (m) {
    const k = m[1].toLowerCase();
    if (k.startsWith('meta')) return { family: 'meta', declared: k, explicit: true };
    if (k === 'spoken') return { family: 'spoken', declared: k, explicit: true };
    if (k === 'probe') return { family: 'probe', declared: k, explicit: true };
    if (SITE_KINDS.includes(k)) return { family: 'site', declared: k, explicit: true };
    return { family: null, declared: k, explicit: true };
  }
  const found = SITE_KINDS.find((k) => new RegExp(`\\(${k}\\)|\\b${k}\\b`).test(l0 || ''));
  if (found) return { family: 'site', declared: found, explicit: false };
  return { family: null, declared: null, explicit: false };
}

function check(file) {
  const t = readFileSync(file, 'utf8');
  const errs = [], warns = [];
  // 헤딩 줄로 잘라서 섹션을 만든다.
  // (초판은 lookahead 에 `\n*$` 를 써서 m 플래그와 만나 매 줄 끝에서 잘렸다)
  const sec = {};
  const lines = t.split(/\r?\n/);
  let cur = null;
  for (const line of lines) {
    const h = line.match(/^#{2,3}\s*(L\d)\b/);
    if (h) { cur = h[1]; sec[cur] = []; continue; }
    if (/^#{1,3}\s/.test(line)) { cur = null; continue; }
    if (cur) sec[cur].push(line);
  }
  for (const k of Object.keys(sec)) sec[k] = sec[k].join('\n');

  const kind = detectKind(t, sec.L0);
  if (!kind.family) {
    errs.push(kind.declared
      ? `kind: ${kind.declared} 는 스키마가 없다 (site:${SITE_KINDS.join('/')} · spoken · meta-observation · probe)`
      : 'kind 선언이 없고 L0 에서도 추론할 수 없다 — registry.yaml 의 kind 5종 중 하나를 적는다');
    return { file: basename(file), kind: kind.declared ?? '?', errs, warns };
  }
  if (!kind.explicit) warns.push(`kind 를 명시하지 않았다 (L0 에서 ${kind.declared} 로 추론) — \`- kind: ${kind.declared}\` 를 적는다`);

  const S = SCHEMAS[kind.family];
  for (const k of S.sections) if (!(k in sec)) errs.push(`${k} 절이 없다 (${S.label} 스키마)`);
  if (sec.L0) for (const [name, re] of S.l0) if (!re.test(sec.L0)) errs.push(`L0 에 ${name} 이 없다 (${S.label} 스키마)`);

  // 구술은 verified 가 될 수 없으므로 자기 지위를 밝혀야 한다 —
  // 밝히지 않으면 단일 출처 구술이 규칙으로 오인될 수 있다.
  if (S.requirePromotionNote && !/승격/.test(t))
    errs.push('구술 관측인데 승격 가능 여부에 대한 언급이 없다 — 지위를 밝히지 않으면 규칙으로 오인된다');

  if (S.deep) {
    // L3 — 값이 아니라 관계로
    if (sec.L3) {
      const hasHex = /#[0-9a-f]{3,6}\b/i.test(sec.L3);
      const hasRel = RELATION.test(sec.L3);
      // '미측정' 을 명시한 경우는 면제한다 — 측정 불가를 정직하게 적은 것은 결함이 아니다
      const excused = /미측정|측정할 수 없|해당 없음/.test(sec.L3);
      if (hasHex && !hasRel && !excused)
        errs.push('L3 에 hex 만 있고 관계(대비비·색상각·채도 위치)가 없다 — 값은 복제를 낳고 관계가 이식을 낳는다');
      if (!hasHex && !hasRel && !/미측정|해당 없음/.test(sec.L3)) warns.push('L3 에 측정값이 거의 없다');
    }
    // L8 — 판정 4항목
    if (sec.L8) {
      for (const [name, re] of L8_FIELDS) if (!re.test(sec.L8)) errs.push(`L8 에 "${name}" 이 없다`);
      const tail = sec.L8.slice(sec.L8.search(/트레이드오프/));
      if (/트레이드오프/.test(sec.L8)) {
        if (!/얻은\s*것/.test(tail)) errs.push('트레이드오프 쌍에 "얻은 것" 이 없다');
        if (!/포기한\s*것/.test(tail)) errs.push('트레이드오프 쌍에 "포기한 것" 이 없다 — 한쪽만 있으면 결정이 아니라 취향이다');
      }
    }
    if (sec.L9 && !MODES.test(sec.L9)) errs.push('L9 에 적용 가능 모드가 명시되지 않았다');
  }

  // 반례는 승격 대상이 아님을 확인 (kind 무관)
  if (/counterexample:\s*true/.test(t) && !/승격.*(제외|않)/.test(t))
    warns.push('반례 관측인데 "승격 제외" 표기가 없다 (sources/counterexamples.md 절차)');
  return { file: basename(file), kind: kind.declared, errs, warns };
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const target = args.find((a) => !a.startsWith('--'));
if (!target) { console.error('사용법: node scripts/validate-observation.mjs <파일|디렉토리> [--json]'); process.exit(2); }
const root = resolve(target);
if (!existsSync(root)) { console.error(`경로 없음: ${root}`); process.exit(2); }

const files = statSync(root).isDirectory()
  ? readdirSync(root).filter((f) => f.endsWith('.md')).map((f) => join(root, f))
  : [root];
const results = files.map(check);

if (asJson) { console.log(JSON.stringify(results, null, 2)); }
else {
  for (const r of results) {
    const mark = r.errs.length ? '❌' : r.warns.length ? '⚠️ ' : '✅';
    console.log(`${mark} ${r.file}  [${r.kind}]`);
    r.errs.forEach((e) => console.log(`     ❌ ${e}`));
    r.warns.forEach((w) => console.log(`     ⚠️  ${w}`));
  }
  const bad = results.filter((r) => r.errs.length).length;
  console.log(`\n${results.length}건 검사 · 위반 ${bad}건`);
}
process.exit(results.some((r) => r.errs.length) ? 1 : 0);
