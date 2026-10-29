#!/usr/bin/env node
// fetch-site — 관측 대상 1건을 수집하고 측정한다.
//
// 1라운드에서 손으로 돌린 curl→CSS 수집→측정 경로를 스크립트로 고정한 것이다.
// **무엇을 볼지 고르는 것은 이 스크립트가 하지 않는다** — 소스별 목록 구조가 제각각이라
// 파서를 붙이면 곧 깨진다. 목록 판독은 에이전트가 하고, 이 스크립트는 URL 하나를 받아
// 기계적으로 수집·측정만 한다.
//
// 사용:
//   node scripts/fetch-site.mjs <url> [--out <dir>] [--json]
// 종료 코드: 0 = 성공, 1 = 수집 실패(네트워크·차단), 2 = 사용법 오류

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36';
const TIMEOUT = 25_000;
const MAX_CSS = 10;

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const outIdx = args.indexOf('--out');
const url = args.find((a) => !a.startsWith('--') && /^https?:\/\//.test(a));
if (!url) { console.error('사용법: node scripts/fetch-site.mjs <url> [--out <dir>] [--json]'); process.exit(2); }
const slug = new URL(url).hostname.replace(/^www\./, '').replace(/\./g, '-');
const outDir = resolve(outIdx >= 0 ? args[outIdx + 1] : `.scan/${slug}`);

async function get(u, asText = true) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko,en' }, signal: ctl.signal, redirect: 'follow' });
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, status: r.status, body: asText ? await r.text() : null };
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
  finally { clearTimeout(timer); }
}

const page = await get(url);
if (!page.ok) {
  console.error(`[fetch-site] 수집 실패: ${url} — ${page.status ?? page.error}`);
  console.error('  차단(403)이면 브라우저 수집이 필요하다. registry 에 auth/kind 를 기록할 것.');
  process.exit(1);
}
const html = page.body;
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'page.html'), html);

// 인라인 <style> + 외부 stylesheet
let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
const origin = new URL(url).origin;
const links = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/gi)].map((m) => m[1]).slice(0, MAX_CSS);
const fetched = [];
for (const href of links) {
  const abs = href.startsWith('//') ? `https:${href}` : href.startsWith('http') ? href : new URL(href, origin).href;
  const r = await get(abs);
  if (r.ok) { css += '\n' + r.body; fetched.push({ href: abs, bytes: r.body.length }); }
}
writeFileSync(join(outDir, 'collected.css'), css);

// ─── 측정 — slop-scan 이 안 보는 '관계'를 뽑는다 ───
const all = (re, pick = 1) => [...css.matchAll(re)].map((m) => m[pick].trim());
const tally = (arr) => Object.entries(arr.reduce((a, v) => ((a[v] = (a[v] || 0) + 1), a), {}))
  .sort((a, b) => b[1] - a[1]);

const sizesPx = all(/font-size:\s*([\d.]+)px/gi).map(Number);
const uniqSizes = [...new Set(sizesPx)].sort((a, b) => a - b);
const ratios = uniqSizes.slice(1).map((v, i) => +(v / uniqSizes[i]).toFixed(3));
const spacing = [...new Set(all(/(?:padding|margin|gap):\s*([\d.]+)px/gi).map(Number))].sort((a, b) => a - b);

const measure = {
  url, slug, fetchedAt: null,       // 시각은 호출자가 찍는다 (결정론 유지)
  cssBytes: css.length, cssFiles: fetched.length,
  typeRamp: { sizes: uniqSizes, ratios,
    note: ratios.length ? (Math.max(...ratios) - Math.min(...ratios) > 0.12 ? '비등비 — 구간마다 비율이 다르다' : '등비에 가깝다') : null },
  lineHeight: tally(all(/line-height:\s*([\d.]+(?:px|em|rem)?)/gi)).slice(0, 8),
  letterSpacing: tally(all(/letter-spacing:\s*(-?[\d.]+(?:px|em))/gi)).slice(0, 10),
  spacingScale: spacing.slice(0, 16),
  radii: tally(all(/border-radius:\s*([^;}\n]+)/gi)).slice(0, 10),
  shadows: { unique: new Set(all(/box-shadow:\s*([^;}\n]+)/gi)).size,
    tinted: /box-shadow[^;}\n]*rgba\(\s*(?!0\s*,\s*0\s*,\s*0)\d+/i.test(css),
    samples: [...new Set(all(/box-shadow:\s*([^;}\n]+)/gi))].slice(0, 3) },
  motion: { durations: [...new Set(all(/([\d.]+m?s)\b/gi))].slice(0, 14),
    easings: tally(all(/(cubic-bezier\([^)]*\))/gi)).slice(0, 5) },
  fonts: tally(all(/font-family:\s*([^;}\n]+)/gi).map((f) => f.split(',')[0].replace(/['"]/g, ''))).slice(0, 6),
  hangul: { wordBreak: [...new Set(all(/word-break:\s*([a-z-]+)/gi))],
    overflowWrap: [...new Set(all(/overflow-wrap:\s*([a-z-]+)/gi))],
    keepAll: /word-break:\s*keep-all/i.test(css) },
  colors: tally(all(/(#[0-9a-f]{6})\b/gi).map((c) => c.toLowerCase())).slice(0, 12),
};
writeFileSync(join(outDir, 'measure.json'), JSON.stringify(measure, null, 2) + '\n');

if (asJson) { console.log(JSON.stringify(measure, null, 2)); process.exit(0); }

const fmt = (rows) => rows.map(([v, n]) => `${v}(${n})`).join(' ');
console.log(`[fetch-site] ${url}`);
console.log(`  CSS ${measure.cssFiles}개 파일 · ${(css.length / 1024).toFixed(0)}KB → ${outDir}`);
console.log(`\n  타입 램프  ${uniqSizes.join(' · ')}`);
if (ratios.length) console.log(`  램프 비율  ${ratios.join(' ')}   → ${measure.typeRamp.note}`);
console.log(`  행간       ${fmt(measure.lineHeight)}`);
console.log(`  자간       ${fmt(measure.letterSpacing) || '(없음 — 상수이거나 미지정)'}`);
console.log(`  여백       ${measure.spacingScale.join(' · ')}`);
console.log(`  라운드     ${fmt(measure.radii)}`);
console.log(`  그림자     고유 ${measure.shadows.unique}종 · ${measure.shadows.tinted ? '색조 있음' : '검정 알파'}`);
console.log(`  모션       듀레이션 ${measure.motion.durations.length}종 · 커브 ${measure.motion.easings.length}종`);
console.log(`  서체       ${fmt(measure.fonts)}`);
console.log(`  한글       keep-all ${measure.hangul.keepAll ? '✓' : '✗'} · word-break ${measure.hangul.wordBreak.join('/') || '—'} · overflow-wrap ${measure.hangul.overflowWrap.join('/') || '—'}`);
console.log(`\n  다음: node scripts/slop-scan.mjs ${outDir} --mode <모드> --budget`);
