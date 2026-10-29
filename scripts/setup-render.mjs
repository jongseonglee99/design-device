#!/usr/bin/env node
// setup-render — 렌더 측정용 브라우저 드라이버를 **장치 전용 자리**에 한 번 깐다.
//
// ★ 왜 (2026-10-12 섀도 런 실측): `measure-render` 는 playwright 를 ① 대상 레포 ② 장치의
// optionalDependencies 에서 찾았다. 그런데 **플러그인 설치본에는 node_modules 가 없다**
// (깃허브에서 받은 사본이고 npm install 을 돌리지 않는다) — ② 는 설치본에서 한 번도 성공한 적이 없다.
// 그래서 playwright 가 없는 레포(30days)에서는 렌더가 **언제나 미측정**이었고, 그 세션은
// 대상 레포 안(`.design-device/pw`)에 playwright 를 깔려고 시도했다 — 남의 레포를 더럽히는 길이다.
//
// 브라우저 바이너리는 이미 **기계 전역**(`~/Library/Caches/ms-playwright`)에 있다. 없는 것은
// 드라이버 패키지뿐이다. 그것을 레포 밖 `~/.design-device/runtime` 에 둔다 — 원장·영수증과 같은 집이다(D-18).
//
// 사용: node <장치>/scripts/setup-render.mjs [--version 1.63.0]
// 한 기계에 한 번. 네트워크가 필요하다. 대상 레포에는 아무것도 쓰지 않는다.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

export const RUNTIME = process.env.DESIGN_DEVICE_RUNTIME || join(homedir(), '.design-device', 'runtime');
const argv = process.argv.slice(2);
const vi = argv.indexOf('--version');
const version = vi >= 0 ? argv[vi + 1] : '1.63.0';

mkdirSync(RUNTIME, { recursive: true });
const pkg = join(RUNTIME, 'package.json');
if (!existsSync(pkg)) writeFileSync(pkg, JSON.stringify({ name: 'design-device-runtime', private: true }, null, 2) + '\n');

console.log(`[setup-render] ${RUNTIME} 에 playwright@${version} 을 깐다 (대상 레포에는 쓰지 않는다)`);
const i = spawnSync('npm', ['install', '--no-audit', '--no-fund', `playwright@${version}`], { cwd: RUNTIME, stdio: 'inherit' });
if (i.status !== 0) { console.error('[setup-render] npm install 실패 — 네트워크·권한을 확인한다'); process.exit(1); }
// 브라우저는 기계 전역 캐시를 쓴다. 이미 있으면 내려받지 않는다.
const b = spawnSync('npx', ['playwright', 'install', 'chromium'], { cwd: RUNTIME, stdio: 'inherit' });
if (b.status !== 0) { console.error('[setup-render] 브라우저 설치 실패'); process.exit(1); }
console.log('[setup-render] 완료 — 이제 어느 레포에서든 measure-render 가 이 드라이버를 쓴다');
