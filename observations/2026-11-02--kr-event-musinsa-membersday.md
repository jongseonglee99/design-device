# 무신사 「무신사 멤버스데이」(2026-11) — kr-event-pages · 화면 렌더 미측정

## L0 메타
- kind: rendered
- 출처: kr-event-pages (rendered) · 원본: https://www.musinsa.com/campaign/membersday_2611
- 고른 경로: 무신사 추천 홈(1회 요청)에 걸린 `campaign/**` 링크 3개(`membersday_2611` · `fashionweek_2611` · `2611_01_brandweek`) 중 기간이 가장 짧은 것
- 제작 주체: 무신사 — 캠페인 CMS `cpcmsType: "CPCMS_V2"` · Next.js 라우트 `/campaign/[campaignId]/[seq]` · 자산 경로 `static.msscdn.net/static/nextcampaign` [측정]
- **출처 독립성 주의**: 같은 라운드의 29CM 관측과 같은 그룹이다 [배경지식 — 이번 수집에서 확인하지 않음]. 생산 라인은 다르다(29CM = Framer 템플릿 / 무신사 = 자체 CMS)
- 캡처일: 2026-11-02 · 라운드: 2026-W45 (로컬)
- 카테고리: 패션 커머스 월간 정기 세일 캠페인 · 기간 `startAt 2026-11-01T00:00:00+09:00` ~ `endAt 2026-11-04T00:00:00+09:00` · `status ACTIVE` [측정]
- 플랫폼: web-responsive(PC 판 수집 — `isPc: true`) · 시장·언어권: 한국(한국어) · `metaLocale ko-KR`
- 측정 방법: `fetch-site.mjs` — HTML 23KB · CSS 9파일 151KB. **본문 모듈은 클라이언트가 CDN 에서 받아 그린다**
  (`enableCdnFetchModules: true` · `moduleSingleFetch {eagerCount: 5, useSkeleton: true}`) → 정적 HTML 의 화면 글자는 4줄 28자.
  **정적 수집 불가 — 렌더 미측정.** 측정한 것은 SSR 이 실은 `__NEXT_DATA__`(9.6KB) — 캠페인 메타 · 탭 · 기능 플래그, 즉 **화면이 아니라 시간 상태의 데이터 모델**이다
- `slop-scan --mode marketing --kind event --budget` → exit 1 (❌ 2: M3 · M4 / ⚠️ 11) — 둘 다 앱 공통 CSS 에서 나왔다(L5)
- verified: true — 배포된 실제 설정값. 단 화면에 그 값이 어떻게 그려지는지는 미측정

## L2 타이포
- 렌더 미측정. 앱 공통 CSS 서체는 Pretendard [측정 — fetch-site] · 이 페이지의 실제 글자 크기·줄바꿈은 모듈이 그려지기 전이라 측정할 수 없다

## L3 색
- 화면 색은 **미측정**(렌더 전)
- [측정 — 설정값] 예고 라벨 `signatureSaleLabel {title: "특가예정", color: "FE4900", textColor: "fff"}` → 흰 글자 on 주황(색상각 17° · 채도 1.0 · 명도 .50) **3.41:1** — 검정이었다면 6.17:1.
  라벨이 작은 글자면 본문 기준(4.5:1) 미달 [계산 — 라벨 글자 크기는 미측정]

## L5 모션 ★ (registry takes)
- [측정] 첫 화면 키 비주얼이 **영상**: `kvList[0].kvType "STREAMING"` · HLS(`.m3u8`) 1500×1800 + 포스터 이미지. 자동재생·반복·멈춤 버튼 여부는 **렌더 미측정**
- [측정] 앱 공통 CSS: `prefers-reduced-motion` 0 · Tailwind `motion-reduce:` 변형 0
- [측정] **slop-scan M4 ❌ 의 대상은 Tailwind `.animate-pulse`** (`@keyframes pulse{50%{opacity:.5}}` · `2s … infinite`) — 이 앱은 `useSkeleton: true` 로 모듈 로딩 중 스켈레톤을 쓴다.
  `anti-patterns.md` M4 는 「로딩 스피너·스켈레톤은 면제」 인데, 검출기의 면제 정규식(`spin|loader|loading|skeleton|shimmer|progress|busy|pending`)에 **`pulse` 가 없다** →
  스켈레톤 관용 클래스를 「멈출 수 없는 장식」 으로 셌을 가능성이 높다 [측정 — 정규식 확인 / 실제 사용처는 렌더 미측정이라 추론]
- `data-motion` 어휘로: KV 영상 = r3 후보(계속 재생이면) — 멈춤 수단 유무 미측정

## L6 구조·IA ★ (registry takes) — 설정값으로 본 시간 상태
- [측정] 캠페인 = **탭 3개** × 앵커. 탭마다 각자 `startAt`/`endAt` 을 갖는다 — **시간이 페이지가 아니라 탭 단위**다
  - 세일(앵커 13): 아우터 특가 · 상품 쿠폰 · 상품 랭킹 · 스페셜 발매 · 혜택 모아보기 · 브랜드위크 · **72시간 특가** · 장바구니 쿠폰 · 뷰티 쿠폰 · 무배당발 · 유즈드 · 폴로 랄프 로렌 · 브랜드 랭킹
  - 이벤트(앵커 11): 제휴 이벤트 · 적립금 · 삼성카드 · 쿠폰 · 이달의 쿠폰 · 아우터 랭킹 · **오늘의 미션** · **무퀴즈** · 등급 쿠폰 · 체험단 · 오프라인
  - 무신사 삼성카드: `type "EXTERNAL_LINK"` — 탭이 다른 페이지로 나간다
- [측정] 종료 뒤 갈 곳 칸 `afterRedirectUrl: ""` — **종료 상태 = 리다이렉트로 설계하는 칸**이 CMS 에 있다(이번엔 비어 있다)
- [측정] 같은 앱에 실린 **대형 시즌 세일(무진장) 설정** — 지금 페이지가 아니라 생산 체계에 대한 증거:
  - `eventDate {teasingStart: 2026-06-12T19:00, campaignStart: 2026-06-14T19:00, campaignFirstDayEnd: 2026-06-25T00:00, campaignFinish: 2026-06-25T00:00}` — 여름 값이 남아 있다
  - 겨울판 ID `tst_mujinjangwinter2026_teasing` · `_outer` · `_kicks` · `_top` · `_bottom` · `_beauty` · `_acc` · … 가 `noIndexCampaignIds` 에 **미리** 등록 → **예고(티징)가 별도 캠페인 페이지**이고 검색 비노출로 준비된다
  - `mujinjangMainEntryTimeRanges`: 23:55–00:05 · 11:55–12:05 · 13:55–14:05 · 15:55–16:05 · 17:55–18:05 · 19:55–20:05 → 진입 화면 `seq 4` —
    **정각 전후 10분 창마다 진입 화면을 바꾼다**(날짜 축 위에 **하루 중 시각** 축이 하나 더 있다). 화면 내용은 미측정
  - 남은 시간 표시를 **캠페인 밖**으로 내보내는 스위치 4개: `feature.home.saleTimerBanner` · `mujinjang.searchbarTimerBanner` · `mujinjang.recentlyViewedTimerBanner` · `mujinjang.likeTimerBanner`
    (홈 · 검색창 · 최근 본 상품 · 좋아요 목록 — 지금은 전부 `false`) · 그리고 `enableTitleTimerPeriod: true`
- **시간 상태 표(여섯 단계) 대조** — 설정이 말하는 것 [측정 — 설정값 · 화면 미측정]

  | 단계 | 무신사 CMS |
  |---|---|
  | 예고 | `teasingStart` + 별도 `_teasing` 캠페인 ID + 「특가예정」 라벨 |
  | 진행 | `campaignStart` + 탭마다 `startAt` |
  | 마감 임박 | **이름 붙은 단계 없음** — 대신 타이머 배너 4곳 + 정각 진입 창 + 「72시간 특가」 |
  | 마감 | `campaignFirstDayEnd` (첫날 끝) · `campaignFinish` — **두 단계로 끊는다** |
  | 발표 | 해당 없음(세일) — 이벤트 탭의 무퀴즈·미션 결과는 미측정 |
  | 종료 | `afterRedirectUrl` — 종료 화면을 남기는 게 아니라 **보내는** 칸 |

## L7 톤·이미지
- 렌더 미측정. [측정] 공유 문구 `ogDescription 「매월 1~3일은 무신사 멤버스데이」` — 반복 일정 자체를 카피로 쓴다 · KV 는 영상

## L8 판정
- **신선함**: (L6) 시간 상태가 **페이지 상태가 아니라 데이터 모델**이다 — 탭마다 시작·끝, 예고는 별도 ID, 종료는 리다이렉트 칸, 남은 시간은 캠페인 밖 4곳의 배너.
  그리고 날짜 축 위에 「하루 중 정각 창」 이라는 **두 번째 시간 축**이 있다
- **포화**: 세일 탭 앵커 13개의 혜택 모음형 긴 페이지 — 국내 커머스 시즌 세일 기본형 [추론 — 렌더 미측정]
- **이식 최소단위**: 「시간 상태는 페이지가 아니라 부분(탭·모듈)마다 시작·끝을 갖게 하고, 종료 뒤 갈 곳을 칸으로 둔다」
- **트레이드오프 쌍**
  - 얻은 것: 한 URL 안에서 모듈이 각자 열리고 닫혀 매달 같은 틀(멤버스데이)을 재사용한다 · 예고 페이지를 별도 ID 로 미리 만들어 검색 비노출로 준비한다 · 남은 시간을 사용자가 있는 곳(검색창·좋아요)에 건다
  - 포기한 것: **정적 HTML 에 화면이 없다** — 첫 화면이 스켈레톤 → CDN 모듈 순으로 늦게 그려지고 우리 수집기는 아무것도 보지 못한다.
    그리고 예고와 본 행사의 URL 이 달라, 예고 때 공유된 링크가 본 행사로 이어지는지는 리다이렉트 설정에 달린다 [추론]

## L9 적용 가능 모드
- `tool` — **적용**. 모듈 단위 `startAt`/`endAt` + 종료 후 이동 칸 — 운영 화면의 기간 한정 공지·배너에 그대로 간다
- `consumer` — **적용**. 남은 시간을 행사 페이지 밖(검색창·관심 목록)에 거는 방식
- `marketing` — **적용**. 예고를 별도 페이지로 두고 정각 창마다 진입 화면을 바꾸는 시각 축
- `graphic` — **제외**. 데이터 모델 관측이라 포스터·인쇄물에 해당하는 결정이 없다
