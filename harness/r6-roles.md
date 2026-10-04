# R6 — 역할

## 에이전트와 편집 범위

| 에이전트 | 맡는 단계 | 편집 가능한 폴더 (1개) | 쓰는 도구 |
|---|---|---|---|
| researcher | S1 | runs/<id>/s1/ | uibowl, Figma (분석 보드 페이지만) |
| planner | S2 | runs/<id>/s2/ | 없음 (문서만) |
| designer | S3, S4 | runs/<id>/design/ | Figma |
| judge | 모든 게이트의 기계 판정, S5 | 편집 없음 (읽기 전용) | 판정 스크립트 실행 |
| 오케스트레이터 (메인 세션) | 흐름 관리 | runs/<id>/ 루트 (gates.json, state.json, input.json만) | — |

- 에이전트는 자기 편집 폴더 밖의 파일을 쓰지 않는다. 다른 폴더는 읽기만 한다.
- harness/, docs/는 모든 에이전트에게 읽기 전용이다. rules.json을 바꾸려면 사용자 승인이 필요하다.

## Figma 쓰기 권한

- Figma에 쓸 수 있는 것은 designer뿐이다.
- researcher는 분석 보드 페이지 1곳에만 쓸 수 있다.
- 나머지 에이전트는 Figma를 읽기만 한다.
- 계정과 팀은 2026-10-01에 정해졌다. 상세는 runs/<id>/state.json의 figma 항목 (공개 저장소에는 올리지 않는다).

## 판정자 (읽기 전용)

- judge에게는 Read 권한과 판정 스크립트 실행 권한만 준다. Edit/Write 권한은 주지 않는다.
- judge의 Bash는 `node harness/scripts/check-*.js`만 허용한다. 명령 연결·리다이렉트는 hook(guard-paths.js)이 막는다.
- 판정 스크립트는 harness/scripts/에 Node.js로 둔다.
- 판정 결과는 스크립트가 runs/<id>/checks/에 쓴다.

## 자연어 트리거

| 사용자 발화 | 동작 |
|---|---|
| "화면 만들어줘: 내 자산, 자산 상세" | 새 실행 시작 (S1부터) |
| "이어서 해줘" | state.json을 보고 멈춘 곳부터 재개 |
| "G2 통과" / "G2 반려: 사유" | 게이트 결과를 기록하고 진행 또는 복귀 |
| "G3 관계자 결정: 내용" | 관계자 협의 결과를 대신 입력 |
| "검토만 돌려줘" | S5 판정만 실행 |
