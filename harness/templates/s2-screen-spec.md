# S2 화면 설계 — <run-id>

<!--
형식 규칙 (G2 판정 스크립트가 이 형식을 파싱한다)
- 화면마다 "## 화면: <PRD 16절 화면 이름>" 섹션 1개
- 섹션마다 "###" 하위 섹션 5개: 목적, 유저스토리, 컴포넌트, 상태, 데이터 필드
G2 통과 조건
- 하위 섹션 5개가 모두 있음
- 유저스토리 번호는 #1~#5 (docs/story-service.md)
- 상태·데이터 필드는 harness/rules.json dataModel에 있는 값만 ("객체.필드" 형식)
- excludedMVP 항목 사용 0
- ★A 대상 화면: 컴포넌트 표에 "visibility-select | … | 비공개" 행
- ★B 대상 화면: 컴포넌트 표에 review-status 행
-->

## 화면: <PRD 16절 화면 이름>

### 목적

### 유저스토리
- #3

### 컴포넌트
| 레이어 이름 | 역할 | 기본값 |
|---|---|---|
| visibility-select | 공개 범위 선택 | 비공개 |

### 상태
- Asset.review_status: pending

### 데이터 필드
- Asset.title
