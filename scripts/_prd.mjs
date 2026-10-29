// 화면 문서가 **어느 PRD 버전 위에서** 쓰였는가 — 승인 `#34 C` (2026-10-12).
//
// 왜: control_tower 의 PRD 가 v1 → v2 로 **대체**됐을 때(D-47) 우리 화면 문서·아트보드가
// 통째로 무효가 됐는데 아무것도 알려주지 않았다. 이틀 뒤 우연히 발견했다
// (관측 `2026-10-11--pilot-target-pivot.md`). 화면 문서는 이미 `상위 문서` 칸에
// `docs/PRD.md v2.0` 처럼 버전을 적고 있었다 — **적어 놓고 아무도 대조하지 않았다.**
//
// `validate-screen`(대상 레포 AC 에서 돈다)과 `collect-feedback`(장치 레포에서 돈다)이
// 같은 판정을 써야 하므로 여기 한 곳에 둔다. CLI 가 아니다 — import 해도 아무 일도 하지 않는다.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

/** `.git` 이 있는 가장 가까운 조상. 없으면 null. */
export function repoRootOf(p) {
  for (let d = resolve(p); ; d = dirname(d)) {
    if (existsSync(join(d, '.git'))) return d;
    if (dirname(d) === d) return null;
  }
}

/** 대상 레포 PRD 의 현재 버전. 머리 20줄의 `버전 v2.0` · `version: 2.1` 형태만 읽는다. */
export function prdVersion(root) {
  if (!root) return null;
  for (const rel of ['docs/PRD.md', 'PRD.md']) {
    const f = join(root, rel);
    if (!existsSync(f)) continue;
    const head = readFileSync(f, 'utf8').split('\n').slice(0, 20).join('\n');
    const m = head.match(/(?:버전|version)\**\s*[:：]?\s*v?(\d+(?:\.\d+)+)/i);
    return m ? { file: rel, version: m[1] } : null;
  }
  return null;
}

/** 화면 문서 머리 표 `상위 문서` 칸의 PRD 버전. `docs/PRD.md` v2.0 · PRD v2 등. */
export function screenPrdVersion(text) {
  const row = text.match(/\|\s*\*\*상위 문서\*\*\s*\|([^\n]*)\|/);
  if (!row) return null;
  const m = row[1].match(/PRD(?:\.md)?`?\s*v(\d+(?:\.\d+)*)/i);
  return m ? m[1] : null;
}

/**
 * 판정. **주 버전이 다르면 낡음(차단)**, 부 버전만 다르면 확인 요구(경고).
 * v1 → v2 는 「대체」였고 화면 전부가 죽었다. v2.0 → v2.1 은 보통 화면을 죽이지 않는다 —
 * 둘을 같은 급으로 막으면 PRD 오타 수정마다 빌드가 서고, 그러면 이 검사가 꺼진다.
 */
export function comparePrd(screenV, prdV) {
  if (!prdV) return { level: 'none' };
  if (!screenV) return { level: 'warn', msg: `\`상위 문서\` 에 PRD 버전이 없다 — 대상 PRD 는 v${prdV}. 「docs/PRD.md v${prdV}」 처럼 적어야 PRD 가 바뀔 때 이 문서가 낡았다고 알려줄 수 있다` };
  if (screenV === prdV) return { level: 'ok' };
  const major = (v) => v.split('.')[0];
  if (major(screenV) !== major(prdV))
    return { level: 'error', msg: `**낡음** — 이 문서는 PRD v${screenV} 위에서 쓰였고 지금 PRD 는 v${prdV} 다. 주 버전이 바뀌면 화면 자체가 사라졌을 수 있다(control_tower v1→v2 에서 화면 전부가 무효가 됐다). 다시 검토하고 \`상위 문서\` 의 버전을 올린다` };
  return { level: 'warn', msg: `PRD 가 v${screenV} → v${prdV} 로 바뀌었다 — 이 화면에 닿는 변경이 있는지 보고 \`상위 문서\` 의 버전을 올린다` };
}
