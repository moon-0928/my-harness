# R0 — 준비물 확인

## 컨텍스트 문서

| 문서 | 역할 | 비고 |
|---|---|---|
| docs/prd.md | 서비스 맥락 원본 | 읽기 전용 |
| docs/story-service.md | 판정 기준: 유저스토리, 어기면 안 되는 것 A·B | story-work.md와 섞지 않음 |
| docs/story-work.md | 작업 흐름: 단계 1~7, 게이트 G1~G5 | story-service.md와 섞지 않음 |
| docs/design.md | 비주얼 판정 기준 (임시) | 7번 가이드를 받으면 병합 |

## 도구

| 도구 | 쓰는 단계 |
|---|---|
| uibowl (MCP) | 1 레퍼런스 수집 |
| Figma (MCP) | 2 분석, 4 키스크린, 6a 토큰·컴포넌트, 6b 화면 디자인 |

## 판정 기준 우선순위 (design.md 내부 충돌 시)

1. Do's and Don'ts가 가장 우선한다.
2. 본문 컴포넌트 정의가 그다음이다.
3. `ex-*` 예시(Examples illustrative)는 판정 대상에서 뺀다.
4. 그림자 예외는 segmented-control 활성 pill의 soft shadow 1개만 허용한다.

## 임시값 (사용자 확정 필요)

| 항목 | 임시값 | 근거 |
|---|---|---|
| story-work.md 7번 "우리 가이드" | design.md | 가이드를 받기 전까지 임시로 사용 |
| colors.on-primary | #ffffff | design.md에 hex 값이 없음 |
| 버튼 고정 높이 | 48px | 44px 최소 터치 영역보다 커야 함 (design.md 114행) |

## 레퍼런스 수집 범위

경쟁사 앱 이름은 정하지 않고, 아래 화면 유형으로 uibowl을 검색한다.
- 학습자료 목록
- 카드 라이브러리
- 제출 폼
- 검수/승인 목록
- 마켓 상품 상세
