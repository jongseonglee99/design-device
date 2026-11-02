#!/usr/bin/env node
// remote-snapshot — 이 맥에서 작업하지 않는 대상 레포의 원격 기본 브랜치에서 `docs` · `design.config.json` 만 꺼내 둔다.
//
// 왜: 대상 레포 세션은 장치 레포에 쓰지 못한다(판정은 그 레포 `docs/design-ledger.md` 에 쌓인다). 다른 맥에서 작업하는 레포는
// 이 맥에 작업 트리가 없거나(livewith) 있어도 손대면 안 된다(dogu — 다른 환경에서 push). 그래서 원격만 읽는다.
// 목록: harness/remote-repos.json · 결과: ~/.design-device/snapshots/<name>/ (collect-feedback · pending 이 읽는다)
//
// 사용: node scripts/remote-snapshot.mjs [--json]
// 종료 코드: 0 = 전부 갱신 · 1 = 하나 이상 실패(나머지는 갱신됨)
import { readFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOME = homedir();
const DD = process.env.DESIGN_DEVICE_HOME ?? join(HOME, '.design-device');
const tilde = (p) => p.replace(/^~(?=\/|$)/, HOME);
const run = (args, opt = {}) => spawnSync('git', args, { encoding: opt.enc ?? 'utf8', maxBuffer: 1 << 28, ...opt });

export function remoteRepos() {
  const conf = JSON.parse(readFileSync(process.env.REMOTE_REPOS_FILE ?? join(ROOT, 'harness', 'remote-repos.json'), 'utf8'));
  return conf.repos.map((r) => {
    const git = r.clone ? tilde(r.clone) : join(DD, 'mirrors', `${r.name}.git`);
    return { ...r, git, ref: r.ref ?? 'HEAD', snap: join(DD, 'snapshots', r.name) };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = [];
  for (const r of remoteRepos()) {
    const res = { name: r.name, snap: r.snap, ok: false, note: '' };
    if (!r.clone && !existsSync(r.git)) {
      mkdirSync(dirname(r.git), { recursive: true });
      const c = run(['clone', '-q', '--mirror', '--filter=blob:none', r.url, r.git]);
      if (c.status !== 0) { res.note = `미러 만들기 실패 — ${c.stderr.trim().split('\n').pop()}`; out.push(res); continue; }
    }
    const f = run(['-C', r.git, 'fetch', '-q', ...(r.clone ? [] : ['--prune'])]);
    if (f.status !== 0) res.note = `fetch 실패 — 지난 내용으로 꺼낸다 (${f.stderr.trim().split('\n').pop()})`;
    // git archive 는 없는 경로가 하나라도 있으면 전체가 실패한다 — 있는 것만 넘긴다
    const have = run(['-C', r.git, 'ls-tree', '--name-only', r.ref]).stdout.split('\n');
    const paths = ['docs', 'design.config.json'].filter((p) => have.includes(p));
    rmSync(r.snap, { recursive: true, force: true }); mkdirSync(r.snap, { recursive: true });
    if (paths.length) {
      const a = run(['-C', r.git, 'archive', r.ref, ...paths], { enc: 'buffer' });
      const t = spawnSync('tar', ['-x', '-C', r.snap], { input: a.stdout });
      if (a.status !== 0 || t.status !== 0) { res.note = `꺼내기 실패 — ${String(a.stderr).trim()}`; out.push(res); continue; }
    }
    res.ok = true;
    res.head = run(['-C', r.git, 'log', '-1', '--format=%h %cs', r.ref]).stdout.trim();
    res.ledger = existsSync(join(r.snap, 'docs', 'design-ledger.md'));
    res.config = existsSync(join(r.snap, 'design.config.json'));
    out.push(res);
  }
  if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  else for (const r of out) console.log(`${r.ok ? '✅' : '❌'} ${r.name}  ${r.head ?? ''}  ${r.ok ? `판정 원장 ${r.ledger ? '있음' : '없음'} · 장치 설정 ${r.config ? '있음' : '없음'}` : ''}${r.note ? `  — ${r.note}` : ''}\n   → ${r.snap}`);
  process.exitCode = out.every((r) => r.ok) ? 0 : 1;
}
