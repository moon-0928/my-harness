# R4 — 산출물

## 실행 폴더 (실행 1회 = 폴더 1개)

에이전트별 편집 폴더(R6)에 맞춰 하위 폴더로 나눈다.

```
runs/<YYYY-MM-DD>-<순번>/
├─ input.json              # 오케스트레이터: 고른 화면 2~3개
├─ gates.json              # 오케스트레이터: G1~G5 승인 기록 (누가, 언제, 통과/불통과, 사유)
├─ state.json              # 오케스트레이터: 현재 단계, 게이트별 재시도 횟수
├─ s1/
│  └─ s1-references.md     # researcher: 레퍼런스 목록 + 반영 포인트
├─ s2/
│  └─ s2-screen-spec.md    # planner: 화면 설계 문서
├─ design/
│  ├─ s3-concept.md        # designer: 키스크린 목록 + 컨셉 확정 기록
│  ├─ s4-tokens.json       # designer: 디자인 토큰
│  └─ s4-frames.json       # designer: Figma 프레임 목록 (file key, node id, 크기)
└─ checks/
   └─ s5-report.json       # 판정 스크립트: 게이트별 판정 결과, S5 위반 리포트
```

- s1-references.md와 s2-screen-spec.md는 harness/templates/의 형식을 따른다. (판정 스크립트가 파싱한다)

## 규칙 SSOT

- harness/rules.json 하나만 SSOT다.
- 판정자와 에이전트는 판정할 때 이 파일만 본다.
- design.md와 story-service.md A·B에서 뽑아 셀 수 있는 형태로 바꾼 것이다.
- 원문이 바뀌면 rules.json을 다시 만들고, 사용자 승인을 받는다.

## 재개

- state.json을 보고, 마지막으로 통과한 게이트 다음 단계부터 다시 시작한다.
- 이미 통과한 게이트는 다시 묻지 않는다.

## Figma

> 2026-10-01 확정 (사용자 결정): Starter 요금제는 파일당 페이지가 3개로 제한되어, 페이지를 늘리지 않고 Section으로 실행을 나눈다.

- 프로젝트 전체에 Figma 파일 1개를 쓴다 (fileKey와 계정은 가장 최근 runs/<id>/state.json의 figma 항목. 공개 저장소에는 올리지 않는다).
- 페이지는 3개로 고정한다: "S3 키스크린", "S4 토큰·컴포넌트"(공용), "S4 화면". 새 페이지를 만들지 않는다.
- 실행 1회마다 "S3 키스크린"과 "S4 화면" 페이지에 Section 1개씩을 만든다 (이름: <YYYY-MM-DD>-<순번>). 기존 노드의 오른쪽 빈자리에 두어 겹치지 않게 한다.
- Section 채우기는 UI 배경(#ffffff, #f3f3f3, #f0f0f0)과 겹치지 않는 색으로 해서 화면 프레임 경계가 잘 보이게 한다. 기본 #d6dde6 (사용자 결정, 2026-10-01). Section은 판정 대상이 아니다.
- 판정 프레임 외에 상태를 보여주는 참고 프레임을 같은 Section에 둘 수 있다. 이름은 "<화면> / <상태>"로 하고 s4-frames.json에 판정 대상과 구분해 적는다. 참고 프레임은 기계 판정을 받지 않고 G3·G5에서 사람이 스크린샷으로 확인한다.
- 토큰과 컴포넌트는 공용 페이지에 모은다. 실행 중 바꾸면 이전 실행 화면에도 반영되므로 바꾼 내용을 s4-components.md에 기록한다.
- 판정은 s3-concept.md·s4-frames.json에 적힌 프레임만 읽는다. 같은 페이지의 다른 실행 프레임은 판정 대상이 아니다.
- 2026-09-29-01 실행은 이 규칙 전에 만들어져 Section 없이 페이지 최상위에 있다.
