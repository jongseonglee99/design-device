#!/usr/bin/env node
// preflight — 라운드를 시작하기 전에 "지금 여기서 무엇이 도달 가능한가"를 먼저 답한다.
//
// 왜 필요한가: 2026-W35~W40 의 6주 연속 0건은 수집 실패 자체가 아니라
// **수집이 불가능한 환경에서 수집 라운드를 계속 돌린 것**이 원인이었다.
// 라운드 시작 시점에 이 질문을 강제로 묻게 해서 같은 6주가 반복되지 않게 한다.
//
// 사용:
//   node scripts/preflight.mjs            # 주간 소스만
//   node scripts/preflight.mjs --all      # 등록된 전 소스
//   node scripts/preflight.mjs --json     # 라운드 스크립트용
//
// 종료 코드:
//   0 = 주간 소스가 하나 이상 도달 가능 → 수집 라운드 진행
//   3 = 전부 도달 불가            → 수집 라운드 중단, 네트워크 불요 작업으로 전환
//   2 = 사용법/설정 오류

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const all = args.includes('--all');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const TIMEOUT = 20_000;

// ─── registry.yaml 최소 파싱 (의존성 없이 id/url/round/auth 만 꺼낸다) ───
const regPath = join(ROOT, 'sources', 'registry.yaml');
if (!existsSync(regPath)) {
  console.error('sources/registry.yaml 이 없다');
  process.exit(2);
}
const reg = readFileSync(regPath, 'utf8');
const sources = [];
for (const block of reg.split(/\n  - id:\s*/).slice(1)) {
  const id = block.split('\n')[0].trim();
  const field = (k) => (block.match(new RegExp(`^\\s{4}${k}:\\s*(.+)$`, 'm')) || [])[1]?.trim().replace(/\s*#.*$/, '');
  sources.push({ id, url: field('url'), round: field('round'), auth: field('auth') });
}
if (!sources.length) {
  console.error('registry.yaml 에서 소스를 하나도 읽지 못했다 — 파서가 포맷을 못 따라갔을 수 있다');
  process.exit(2);
}

const targets = all ? sources : sources.filter((s) => s.round === 'weekly');

// ─── 프로브 ───
async function probe(s) {
  if (!s.url) return { ...s, state: 'config', detail: 'registry 에 url 없음' };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  const t0 = Date.now();
  try {
    const r = await fetch(s.url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ko,en' },
      signal: ctl.signal,
      redirect: 'follow',
    });
    const ms = Date.now() - t0;
    if (r.ok) return { ...s, state: 'ok', status: r.status, ms };
    // 429 는 차단이 아니라 속도 제한이다. 재시도로 풀린다 — 구분해서 적는다.
    if (r.status === 429) return { ...s, state: 'throttled', status: 429, ms };
    if (r.status === 401 || r.status === 403) return { ...s, state: 'forbidden', status: r.status, ms };
    return { ...s, state: 'http', status: r.status, ms };
  } catch (e) {
    const msg = String(e.message || e);
    // 프록시 계층 차단(클라우드 egress 정책)과 그냥 느린 것을 구분한다
    const blocked = /CONNECT|tunnel|proxy|ENOTFOUND|EAI_AGAIN|certificate|ECONNREFUSED/i.test(msg);
    return { ...s, state: blocked ? 'blocked' : 'timeout', detail: msg.slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

const results = await Promise.all(targets.map(probe));

// 수집 가능 = ok 또는 throttled(재시도로 풀림)
const usable = results.filter((r) => r.state === 'ok' || r.state === 'throttled');
const verdict = usable.length > 0 ? 'collect' : 'offline';

if (asJson) {
  console.log(JSON.stringify({ verdict, usable: usable.map((u) => u.id), results }, null, 2));
  process.exit(verdict === 'collect' ? 0 : 3);
}

const MARK = {
  ok: '  열림',
  throttled: '  지연',
  forbidden: '  거절',
  blocked: '  차단',
  timeout: '  무응답',
  http: '  오류',
  config: '  설정',
};

console.log(`\n도달성 점검 — ${all ? '전 소스' : '주간 소스'} ${results.length}곳\n`);
for (const r of results) {
  const note = r.status ? `HTTP ${r.status}` : r.detail || '';
  const ms = r.ms != null ? `${String(r.ms).padStart(5)}ms` : '       ';
  console.log(`${MARK[r.state] || '  ?   '}  ${r.id.padEnd(20)} ${ms}  ${note}`);
}

console.log('');
if (verdict === 'collect') {
  console.log(`판정: 수집 진행 — ${usable.length}/${results.length} 곳 도달 가능 (${usable.map((u) => u.id).join(', ')})`);
  const throttled = results.filter((r) => r.state === 'throttled');
  if (throttled.length) console.log(`       ${throttled.map((t) => t.id).join(', ')} 는 429 — 잠시 뒤 재시도하면 열린다`);
} else {
  console.log('판정: 수집 불가 — 주간 소스 전부 도달 불가.');
  console.log('      수집 라운드를 돌리지 마라. harness/round-prompt.md §0-B 의 네트워크 불요 작업으로 전환한다.');
  const blocked = results.filter((r) => r.state === 'blocked');
  if (blocked.length === results.length) {
    console.log('      전부 프록시 계층 차단 — 이 환경의 egress 정책 문제다. 다른 곳(로컬)에서 돌리면 열린다.');
  }
}
console.log('');
process.exit(verdict === 'collect' ? 0 : 3);
