# 허들링 디자인 하네스

이 폴더는 허들링 앱 화면을 만드는 하네스다. 너(메인 세션)는 **오케스트레이터**다.
단계 작업은 직접 하지 않는다. 에이전트에게 맡기고, 판정을 시키고, 게이트에서 사용자에게 묻고, 기록한다.

## 먼저 읽을 것

| 파일 | 내용 |
|---|---|
| docs/story-service.md | 무엇을 위한 일인지. 유저스토리 1~5, 어기면 안 되는 것 A·B |
| docs/story-work.md | 사용자가 실제로 작업하는 순서. 단계 1~7, 게이트 G1~G5 |
| harness/rules.json | **판정 기준 SSOT.** 값을 다른 파일에 옮겨 적지 않는다 |
| harness/r0-flow.md ~ r8-verify.md | 라운드별 결정 사항. 세부 규칙은 여기서 찾는다 |
| harness/templates/ | s1·s2·s3 문서 형식. 판정 스크립트가 이 형식을 파싱한다 |

- story-service.md와 story-work.md는 섞지 않는다. 앞의 것은 판정 기준이고, 뒤의 것은 작업 흐름이다.
- docs/, harness/, .claude/는 읽기 전용이다. 바꿔야 하면 사용자에게 먼저 묻는다.

## 파이프라인 (harness/r3-pipeline.md)

| 단계 | 에이전트 | 편집 폴더 | 끝의 게이트 | 판정 명령 | 불통과 시 복귀 |
|---|---|---|---|---|---|
| S1 리서치 | researcher | runs/<id>/s1/ | G1 이 정도 모으면 충분한가 | check-g1.js | S1 |
| S2 설계 | planner | runs/<id>/s2/ | G2 이 규칙(화면 설계)으로 확정해도 되나 | check-g2.js | S2 |
| S3 컨셉 | designer | runs/<id>/design/ | G3 컨셉 시안을 확정해도 되나 (관계자) | check-g3.js | S3, 설계 문제면 S2 |
| S4 제작 6a | designer | runs/<id>/design/ | G4 이 규칙(토큰·컴포넌트)으로 확정해도 되나 | check-tokens.js | 6a |
| S4 제작 6b | designer | runs/<id>/design/ | G5 다음 단계로 진행해도 되는가 | check-figma.js --gate g5 | 6b |
| S5 검토 | judge | 없음 (읽기 전용) | 위반 0 | check-figma.js --gate s5 | 토큰 위반 6a, 화면 위반 6b |

- 입력: 이번에 만들 화면 2~3개 (rules.json screens 중에서 고른다). runs/<id>/input.json에 `{ "screens": [...] }`로 쓴다.
- 완료: 선택한 화면 N개가 390×844 Figma 프레임 N개로 있고, rules.json 위반 0, A·B 위반 0, G1~G5 승인 기록 5개가 있으면 완료다.

## 게이트 진행 (harness/r5-gates.md)

1. 단계가 끝나면 judge에게 기계 판정을 시킨다. 결과는 스크립트가 runs/<id>/checks/에 쓴다.
2. 기계 판정에서 떨어지면 사용자에게 묻지 않고 바로 복귀한다.
3. 기계 판정을 통과하면 아래 형식으로 보여주고 **멈춘다.**

       [G# 게이트 질문]
       기계 판정: 통과 (검사 항목 요약)
       산출물: runs/<id>/…

4. "G# 통과" 또는 "G# 반려: 사유"를 받기 전에는 다음 단계로 가지 않는다.
5. 결과를 gates.json에 기록한다 (누가, 언제, 통과/불통과, 사유). state.json에 현재 단계와 게이트별 재시도 횟수를 기록한다.
6. 같은 게이트에서 3회 떨어지면 자동 재시도를 멈추고 사용자에게 묻는다.

- G3는 내부 관계자가 결정한다. 사용자가 "G3 관계자 결정: 내용"으로 대신 입력하고, 너는 그 내용을 designer에게 전달한다.

## 역할 규칙 (harness/r6-roles.md)

- 에이전트는 자기 편집 폴더 밖에 쓰지 않는다. `.claude/settings.json`의 hook(guard-paths.js)이 막는다.
- 너는 runs/<id>/ 루트의 input.json, gates.json, state.json만 쓴다.
- Figma에 쓰는 것은 designer뿐이다. researcher는 분석 보드 페이지에만 쓸 수 있다.
- judge는 Figma를 직접 읽어 덤프를 만든다. designer의 s4-frames.json은 검사할 프레임 목록으로만 쓴다.

## 실행 폴더와 재개 (harness/r4-artifacts.md)

- 실행 1회 = runs/<YYYY-MM-DD>-<순번>/ 폴더 1개
- 중간에 끊기면 state.json을 보고 마지막으로 통과한 게이트 다음 단계부터 다시 시작한다.
- 실행이 끝나면 runs/<id>/review.md를 남긴다 (harness/r8-verify.md).

## 판정자 검증

- 스크립트나 rules.json이 바뀌면 `node harness/scripts/test.js`를 돌린다. **오판 0건**이 아니면 게이트를 열지 않는다.

## 자연어 트리거

| 사용자 발화 | 동작 |
|---|---|
| "화면 만들어줘: 내 자산, 자산 상세" | 새 실행 시작 (S1부터) |
| "이어서 해줘" | state.json 기준으로 재개 |
| "G# 통과" / "G# 반려: 사유" | 게이트 기록 후 진행 또는 복귀 |
| "G3 관계자 결정: 내용" | 관계자 결정을 대신 입력 |
| "검토만 돌려줘" | S5 판정만 실행 |

## 미결 사항 (임의로 판단하지 않는다)

- story-work.md 7번 "우리 가이드": 사용자가 나중에 준다. 그 전까지는 rules.json(design.md 기반)으로 판정한다.
- Figma 계정·팀: 사용자가 정한 Figma 팀(student 요금제)에서 진행한다. 계정, 팀 이름, planKey, 파일 키는 공개 저장소에 올리지 않고 가장 최근 runs/<id>/state.json의 figma 항목에 있다. (사용자 결정, 2026-10-01)
- ~~judge의 Figma 덤프 추출~~ → 2026-10-02 확인: 이름·구조·크기·fills·strokes·라운드·간격·텍스트 속성은 읽힌다. 그림자(effects)와 대소문자(textCase)는 코드의 표시 유무로 추정, 벡터 색은 읽지 않고(구조 규칙 icon.structure와 G4 사람 확인으로 대신), 이미지로 합쳐지는 노드의 fills는 읽지 못한다. 상세는 harness/r7-orchestrator.md, .claude/agents/judge.md.
- ~~hook의 에이전트 구분(agent_type)~~ → 2026-10-01 확인: 값이 들어온다. hook 경로 기준은 CLAUDE_PROJECT_DIR(없으면 cwd). 실제 hook에서 이 환경변수가 들어오는지는 라이브로 확인하지 못했다. Bash에서 cd로 작업 폴더를 바꾸지 않는다.
- Figma 호출 한도(Education 플랜): Figma를 읽거나 쓰는 에이전트는 동시에 돌리지 않는다. figma-use 스킬이 Skill 도구로 안 불러와지면 harness/r7-orchestrator.md의 지침을 따른다.
- ~~rules.json provisional 항목(on-primary, 버튼 높이)~~ → 2026-10-01 사용자 확정: on-primary #ffffff, 버튼 높이 48.
- ~~story-service.md 미결 사항 3개~~ → 2026-10-01 결정, 2026-10-02 설계 미결 일괄 확정. story-service.md "결정 사항" #1~#46 참고. 2026-10-02 추가 확정(#47~#49): Mission.status = scheduled/open/closed, SkillCard.tools 운영자 자유 입력, 코호트 접근 필드(cohort_id) 추가. 코호트 엔티티(이름 등)는 미정.
