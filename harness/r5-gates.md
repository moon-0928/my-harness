# R5 — 게이트

## 원칙

- 모든 게이트는 "기계 판정 → 사람 승인" 순서로 진행한다.
- 기계 판정을 통과한 것만 사람에게 올라간다.
- 사람 승인 지점은 G1~G5 5곳이다. (story-work.md를 따른다)
- G3는 내부 관계자의 협의 결과를 사용자가 대신 입력한다.
- 판정 기준은 harness/rules.json 하나다.

## 기계 통과 조건

| 게이트 | 검사 파일 | 통과 조건 |
|---|---|---|
| G1 충분한가 | s1-references.md | 화면마다 표의 행 ≥ 5개, "앱" 열의 서로 다른 값 ≥ 3개, 모든 URL에 uibowl.io 포함, 반영 포인트가 비어 있지 않음 |
| G2 설계 확정 | s2-screen-spec.md | 화면마다 ### 섹션 5개(목적, 유저스토리, 컴포넌트, 상태, 데이터 필드)가 있음. 유저스토리 번호 ∈ #1~#5. 상태·데이터 필드는 rules.json dataModel에 있는 값만 쓰고, excludedMVP 사용 0. ★A 대상 화면의 컴포넌트 표에 "visibility-select \| … \| 비공개" 행 있음. ★B 대상 화면의 컴포넌트 표에 review-status 행 있음 |
| G3 컨셉 확정 | s3-concept.md, Figma | 키스크린 프레임 2~3개, 모두 390×844. 결정 항목(누가, 무엇을 확정) 있음 |
| G4 토큰 확정 | s4-tokens.json | 모든 토큰 값이 rules.json 허용값 안에 있음 (위반 0). 사람 확인: icon-* 컴포넌트의 색(judge가 벡터 색을 읽을 수 없음)을 게이트 질문에서 스크린샷으로 보여준다 |
| G5 진행 | s4-frames.json, Figma | 프레임 수 = 입력 화면 수, rules.json 위반 0, ★A·B 위반 0. content/ 밖의 벡터는 icon-* 레이어 안에만 있음. text-input은 rest 상태만(focusRing은 컴포넌트 variant 정의용) |
| S5 최종 | s5-report.json | G5와 같은 검사를 전체 화면에 다시 돌려서 위반 0 |

★ = story-service.md의 "어기면 안 되는 것"을 어기면 걸리는 조건

## 문서 형식

- s1-references.md, s2-screen-spec.md는 harness/templates/의 형식을 따른다. 형식이 다르면 파싱 실패 = 불통과다.

## 판정용 Figma 레이어 이름 약속

대상 화면에 필요한 레이어가 없으면 "검사 대상 없음 = 통과"가 아니라 **위반**이다. 대상 화면은 rules.json mustNot을 따른다.

| 레이어 이름 | 용도 | 위반 조건 |
|---|---|---|
| visibility-select | 공개 범위 선택 (A 대상 화면 필수) | 레이어 없음, 또는 선택된 옵션 텍스트 ≠ "비공개" → A 위반 |
| asset-card, asset-detail | 자산 컨테이너 (B 대상 화면 필수) | 대상 화면에 1개도 없음 → B 위반 |
| review-status | 컨테이너 안의 검수 상태 뱃지 (필수) | 컨테이너 안에 없음 → B 위반 |
| sale-badge, price-cta | 판매 표시, 가격 버튼 | review-status ≠ "승인됨"인 컨테이너 안에 있음 → B 위반 |
| content/… | 스크린샷·아이콘·멤버 산출물 등 콘텐츠 | 색 검사에서 제외. 단, 루트에 IMAGE 채우기·VECTOR·BOOLEAN_OPERATION이 없거나, 하위에 TEXT 노드나 UI 약속 레이어(button-*, badge-*, visibility-select, asset-card, asset-detail, review-status, sale-badge, price-cta)가 있으면 → 위반 (UI chrome을 content/로 숨기는 것 방지) |
| button-primary, button-outline, button-pill-soft | 버튼 (design.md 컴포넌트 이름) | 채우기에 accent(#0066ff) 사용 → 위반 |
| badge-popular | 상업 신호 뱃지 | accent 허용 (화면당 accent ≤ 2개 안에서) |

## 실패 시

- 기계 판정에서 떨어지면 사람에게 올리지 않고, R3의 복귀 지점으로 바로 돌아간다.
- 사람이 불통과를 주면 사유를 gates.json에 남기고 복귀한다.
- 같은 게이트에서 3회 떨어지면 자동 재시도를 멈추고 사용자에게 묻는다.
