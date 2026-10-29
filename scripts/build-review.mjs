#!/usr/bin/env node
// build-review — prototypes/ 의 아트보드들을 리뷰용 단일 HTML 로 묶는다.
//
// 로컬 prototypes/*.html 이 정본이고 이 산출물은 파생물이다. 둘이 어긋나면 로컬이 맞다.
// 각 아트보드를 srcdoc iframe 으로 넣어 ① 외부 요청 0 (Artifact CSP 충족)
// ② 아트보드 간 CSS 클래스 충돌 없음 ③ 원본과 동일하게 렌더 을 만족시킨다.
//
// 사용: node scripts/build-review.mjs <prototypes 디렉토리> <출력.html> [제목]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const [dirArg, outArg, titleArg] = process.argv.slice(2);
if (!dirArg || !outArg) {
  console.error('사용법: node scripts/build-review.mjs <prototypes 디렉토리> <출력.html> [제목]');
  process.exit(2);
}
const dir = resolve(dirArg);
const title = titleArg || '와이어프레임 리뷰';
const tokens = readFileSync(join(dir, 'tokens.css'), 'utf8');

const files = readdirSync(dir).filter((f) => /^\d.*\.html$/.test(f)).sort();
if (!files.length) { console.error('아트보드 없음'); process.exit(2); }

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const titleOf = (html, f) => (html.match(/<title>([^<]*)<\/title>/)?.[1] || basename(f))
  .replace(/\s*—\s*컨트롤타워\s*\(구조\)\s*$/, '');

const boards = files.map((f) => {
  const raw = readFileSync(join(dir, f), 'utf8');
  // 외부 stylesheet 링크를 인라인으로 치환 — Artifact 는 외부 요청을 차단한다
  const inlined = raw.replace(/<link[^>]*href="tokens\.css"[^>]*>/, `<style>\n${tokens}\n</style>`);
  return { file: f, name: titleOf(raw, f), srcdoc: esc(inlined) };
});

const notes = process.env.REVIEW_NOTES || '';
const out = `<title>${title}</title>
<style>
  /* 래퍼는 조용해야 한다 — 내용물이 무채색 와이어프레임이므로 액자가 튀면 판단을 방해한다.
     중립은 순회색이 아니라 아주 옅은 한색 편향(운영·관제 주제에 맞춘 선택). */
  :root {
    --ground:#f7f8f9; --panel:#ffffff; --ink:#16181c; --muted:#5a6069;
    --line:#e3e6ea; --rule:#c9ced6;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --ground:#0f1113; --panel:#16191d; --ink:#e9ecef; --muted:#9aa2ad;
    --line:#272c33; --rule:#3a414a;
  } }
  :root[data-theme="dark"] {
    --ground:#0f1113; --panel:#16191d; --ink:#e9ecef; --muted:#9aa2ad;
    --line:#272c33; --rule:#3a414a;
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--ground); color:var(--ink);
         font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         font-size:15px; line-height:1.7; letter-spacing:-0.01em;
         word-break:keep-all; overflow-wrap:anywhere;
         font-variant-numeric:tabular-nums; }
  .wrap { max-width:1200px; margin:0 auto; padding:48px 20px 96px; }
  h1 { font-size:26px; line-height:1.3; margin:0 0 8px; letter-spacing:-0.03em; text-wrap:balance; }
  .lede { color:var(--muted); max-width:62ch; margin:0 0 24px; }
  .mono { font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
          font-size:12px; letter-spacing:0; }
  .ask { border:1px solid var(--line); border-radius:10px; background:var(--panel);
         padding:20px 22px; margin:0 0 8px; }
  .ask h2 { font-size:13px; margin:0 0 10px; text-transform:uppercase;
            letter-spacing:0.09em; color:var(--muted); font-weight:600; }
  .ask ol { margin:0; padding-left:20px; }
  .ask li { margin:6px 0; }
  .ask li b { font-weight:600; }
  .caveat { color:var(--muted); font-size:13px; border-left:2px solid var(--rule);
            padding-left:14px; margin:20px 0 0; }
  section { margin-top:52px; }
  .shead { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
  h2.board { font-size:18px; margin:0; letter-spacing:-0.02em; }
  .frame { border:1px solid var(--line); border-radius:10px; overflow:hidden; background:#fff; }
  iframe { display:block; width:100%; height:780px; border:0; }
  @media (max-width:760px) { iframe { height:600px; } .wrap { padding:32px 14px 64px; } }
</style>
<div class="wrap">
  <h1>${title}</h1>
  <p class="lede">구조 단계 와이어프레임입니다. <strong>무채색만</strong> 썼습니다 —
     색·서체·장식 없이 정보구조와 위계, 상태 구분이 읽히는지 먼저 확인하기 위해서입니다.
     색이 붙은 시안은 이 단계를 승인한 뒤에 만듭니다.</p>

  <div class="ask">
    <h2>봐주셨으면 하는 것</h2>
    <ol>
      <li><b>결손 상태 5종이 서로 구별되나요</b> — 없음 · 비해당 · 미설정 · 실패 · 낡음.
          두 번째 보드에 다섯 개가 다 있습니다. 색 없이도 구별돼야 합니다.</li>
      <li><b>홈에서 스크롤 없이 상위 3개가 잡히나요</b> — PRD 의 수용 기준입니다.</li>
      <li><b>배지가 색 없이도 읽히나요</b> — ◆ 차단 · ▲ 주의 · ● 정보.
          도형과 라벨이 색을 대신하고 있는지 봐주세요.</li>
      <li><b>drift 진행률이 거짓말하지 않나요</b> — 시밀러 카드는 분모가 불확실합니다.</li>
      <li><b>스킵된 배포가 누락처럼 보이지 않나요</b> — 네 번째 보드 타임라인입니다.</li>
    </ol>
  </div>
  ${notes}
  <p class="caveat">로컬 <span class="mono">prototypes/*.html</span> 이 정본이고 이 페이지는 파생물입니다.
     둘이 어긋나면 로컬이 맞습니다.</p>

${boards.map((b) => `  <section>
    <div class="shead"><h2 class="board">${b.name}</h2><span class="mono">${b.file}</span></div>
    <div class="frame"><iframe title="${b.name}" srcdoc="${b.srcdoc}"></iframe></div>
  </section>`).join('\n')}
</div>`;

writeFileSync(resolve(outArg), out);
console.log(`[build-review] 아트보드 ${boards.length}장 → ${outArg} (${(out.length / 1024).toFixed(0)}KB)`);
boards.forEach((b) => console.log(`  · ${b.file}  ${b.name}`));
