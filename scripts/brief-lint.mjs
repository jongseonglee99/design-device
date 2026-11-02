#!/usr/bin/env node
// brief-lint — 결정 브리프에 **장치 안에서만 쓰는 말**이 남았는지 본다 (2026-11-03).
//
// 사용자(W45 결정): *"설명이 이해되지 않아. 설명할 때 '기판'이나 '자극 테마'가 무슨 말인지 하나도 모르겠어.
// AI 티가 나지 않게 나에게 설명할때도 자세히 진행해줘."* · #64·#65 *"질문 자체를 이해하지 못했어"* — 이해하지 못한 채 고른 것은 결정이 아니다.
// 그래서 다짐이 아니라 검사로 막는다. 브리프는 사용자가 읽는 화면이다 — 장치 용어를 쓰려면 그 자리에서 풀어 쓴다.
//
// 사용: node scripts/brief-lint.mjs <브리프.html ...>
//   본다: 화면에 보이는 글자 (script·style·주석·<code>·근거 줄(.evidence) 은 뺀다 — 근거 줄의 파일 이름은 출처 표시다)
// 종료 코드: 0 = 없음 · 1 = 남았다 · 2 = 사용법 오류
import { readFileSync } from 'node:fs';

const TERMS = [
  ['기판', '시연 바탕 · 문항의 바탕 그림'], ['자극', '문항에서 보여 준 화면'], ['자극 테마', '문항 그림 자체의 밝기'],
  ['층 B', '화면 구조 취향 기록'], ['층 A', '세부 취향 기록'], ['verified', '「우리가 직접 확인한」'], ['takes', '「이 소스에서 가져오는 것」'],
  ['승격', '「규칙으로 올린다」'], ['반감기', '「오래되면 약해진다」'], ['감쇠', '「약해진다」'], ['검증 정지', '「소스가 막혀서 못 본 동안은 약해지지 않게」'],
  ['레지스터', '「움직임 단계」'], ['요건 ③', '풀어서'], ['요건 ①', '풀어서'], ['판별불가', '「차이를 모르겠다는 답」'], ['교란', '「두 가지가 함께 바뀌어」'],
  ['골격', '「화면의 뼈대(칸 배치)」'], ['㉤', '풀어서'], ['flip', '「좌우를 바꿔 다시 물음」'], ['force', '「밝기를 고정」'], ['MULTIVAR', '풀어서'],
  ['probe-lint', '「문항 검사」'], ['measure-render', '「렌더 측정(실제 화면을 띄워 재는 검사)」'], ['slop-scan', '「코드 검사」'], ['slop', '풀어서'],
  ['IA6', '「먼저 볼 것이 가장 무거운가」'], ['D-23', '풀어서'], ['D-21', '풀어서'], ['#50', '풀어서'], ['tone-card', '「톤 카드(취향 메모)」'],
  ['dead', '풀어서'], ['orphan', '「고아(효력 없는) 면제」'], ['kind', '「유형」'], ['mode', '「모드」'], ['r0', '「멈춤」'], ['r1', '「차분」'], ['r2', '「표현」'], ['r3', '「연출」'],
];

const files = process.argv.slice(2);
if (!files.length) { console.error('사용: node scripts/brief-lint.mjs <브리프.html ...>'); process.exit(2); }
let total = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<code\b[\s\S]*?<\/code>/gi, ' ')
    .replace(/<p class="evidence"[\s\S]*?<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  // 스크립트가 화면에 쓰는 문장도 사용자가 읽는다 — 문자열 리터럴 속 한글 문장을 함께 본다
  const scriptText = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n')
    .match(/(['"`])(?:(?!\1)[^\\\n]|\\.)*[가-힣](?:(?!\1)[^\\\n]|\\.)*\1/g)?.join(' ') ?? '';
  const hay = `${visible} ${scriptText}`;
  const hits = [];
  for (const [t, plain] of TERMS) {
    const re = /^[A-Za-z0-9#-]+$/.test(t) ? new RegExp(`(?<![A-Za-z0-9-])${t.replace(/[#-]/g, '\\$&')}(?![A-Za-z0-9-])`, 'g') : new RegExp(t, 'g');
    const n = (hay.match(re) ?? []).length;
    if (n) { const i = hay.search(re); hits.push({ t, n, plain, ctx: hay.slice(Math.max(0, i - 30), i + t.length + 30).trim() }); }
  }
  total += hits.length;
  console.log(`[brief-lint] ${f} — 장치 용어 ${hits.length}종`);
  for (const h of hits) console.log(`  「${h.t}」 ×${h.n} → ${h.plain}   …${h.ctx}…`);
}
if (total) console.log('\n사용자가 읽는 화면이다. 위 말은 빼거나 그 자리에서 풀어 쓴다 — 「무엇이 · 왜 · 고르면 무엇이 달라지나」 를 일상어로.');
process.exitCode = total ? 1 : 0;
