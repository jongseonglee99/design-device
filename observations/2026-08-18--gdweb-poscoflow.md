# 포스코플로우 — GDWEB

## L0 메타
- 출처: gdweb.co.kr (rendered) · 원본: https://www.poscoflow.com
- kind: rendered
- 수상: GDWEB Selection (2026-08-12, str_no=27404) · 캡처일: 2026-08-18 · 라운드: 2026-W34
- 카테고리: 물류 대기업 코퍼릿 · 플랫폼: web-responsive · 시장: 한국(한국어)
- 측정 방법: HTML(98KB) + 외부 CSS 3개(1.16MB) 정적 파싱

## L1 기하
- 반경 48종 / 그림자 18종 — 대기업 코퍼릿 규모에서 예상되는 분화

## L2 타이포
- **Pretendard**(52회) 본문 + **Bai Jamjuree**(37회) 영문·수치용 → **한·영 서체 분리 재확인**
- `word-break: keep-all` 사용
- letter-spacing 3종 / line-height 10종 — masstige보다 성기지만 상수는 아님

## L3 색
- 81종

## L5 모션
- 듀레이션 13종

## L8 판정
- **신선함**: 없음. 관습적 코퍼릿 구성
- **포화**: 없음
- **이식 최소단위**: 한·영 서체 분리(`Pretendard` + 라틴 전용 서체)와 `keep-all` —
  masstige와 **독립적으로 동일한 해법**에 도달했다
- **트레이드오프 쌍**
  - 얻은 것: 숫자·영문 라벨이 별도 서체를 쓰면 물류 데이터의 가독성과 정렬이 좋아진다
  - 포기한 것: 서체 2종 로딩 비용, 한·영 혼용 문장에서 베이스라인·크기 정합을 별도로 맞춰야 함

## L9 적용 가능 모드
`tool` · `consumer` · `marketing` · `graphic` 전부 (한국어 산출물)

## 부가 — S2 재확인
`backdrop-filter: blur` 7건. GDWEB(한국)에서도 확인 → S2 정밀화 근거가 3개 소스로 늘었다.
