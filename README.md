# 디자인 장치 (design-device)

Claude Code 플러그인. 빌드 전에 화면을 정의하고(UI 가이드 · 화면 상세 문서 · HTML 아트보드),
빌드 중에는 편집마다 대비와 AI 기본값 룩을 잰다.

> 이 레포는 **생성물**이다 — 개발 레포에서 `publish-dist` 로 만들어진다. 여기서 직접 고치지 않는다.
> 현재 0.4.5 (원본 `c451832`)

## 필요한 것

- Claude Code (CLI · 데스크톱 앱 Code 탭 · IDE 확장) — 요금제 무관. claude.ai 일반 채팅에서는 돌지 않는다
- `git` · `node` 18 이상

## 설치 (한 번)

```bash
claude plugin marketplace add jongseonglee99/design-device
claude plugin install design-device@design
```

user 범위로 깔려 **모든 레포에서** 뜬다. 설치 뒤 열려 있던 Claude 세션은 다시 연다.

## 쓰기

Claude Code 안에서:

```
/design-device:design 설계 <만들 화면>
/design-device:design 검수 <구현된 화면>
```

`/design` 만 치면 Claude Code 내장 명령이 받는다 — 우리 것이 아니다.

## 업데이트

```bash
claude plugin marketplace update design
claude plugin update design-device@design
```

그 뒤 열려 있던 세션은 종료하고 `claude -c` 로 다시 연다.

## 렌더 측정 (선택)

playwright 가 없는 레포에서는 렌더 검사가 「미측정」으로 넘어간다. 기계마다 한 번:

```bash
node ~/.claude/plugins/cache/design/design-device/<버전>/scripts/setup-render.mjs
```

## 끄기

`design.config.json` 이 없는 레포에서 hook 은 아무것도 하지 않는다 — 장치를 쓴 적 없는 레포는 조용하다.

| 범위 | 방법 |
|---|---|
| hook 만 | `design.config.json` 에 `"hook": false` |
| 이 레포에서 나만 | `claude plugin disable design-device@design --scope local` |
| 전역 | `claude plugin disable design-device@design --scope user` |

## 알아 둘 것

- 취향의 기준(`system/tone-card.md` · `system/taste-anchor.md`)은 **장치 제작자 본인의 측정**이다.
- 판정 기록은 각자의 레포 `docs/design-ledger.md` 에 쌓이고, 제작자에게 자동으로 돌아가지 않는다.
