# R7 — 오케스트레이터

## 파일 위치

| 파일 | 역할 |
|---|---|
| CLAUDE.md (프로젝트 루트) | 오케스트레이터(메인 세션) 지침. 약 100줄 이내 |
| .claude/agents/researcher.md | S1 에이전트 |
| .claude/agents/planner.md | S2 에이전트 |
| .claude/agents/designer.md | S3·S4 에이전트 |
| .claude/agents/judge.md | 판정 에이전트 (읽기 전용) |

- CLAUDE.md는 세부 내용을 harness/*.md 링크로 참조한다.
- rules.json의 값은 CLAUDE.md나 에이전트 파일에 옮겨 적지 않는다. (SSOT 유지)

## 오케스트레이터가 하는 일

1. 단계를 에이전트에게 맡긴다.
2. judge에게 기계 판정을 시킨다.
3. 게이트에서 사용자에게 묻는다.
4. gates.json, state.json, input.json을 기록한다.

- 레퍼런스 수집, 설계 문서, Figma 작업은 직접 하지 않는다.

## 게이트 표시 형식

```
[G2 이 규칙(화면 설계)으로 확정해도 되나?]
기계 판정: 통과 (필수 섹션 5/5, 없는 필드 0, ★A 명시 ✓)
산출물: runs/2026-09-29-01/s2/s2-screen-spec.md
```

- "G# 통과" 또는 "G# 반려: 사유"를 받기 전에는 다음 단계로 가지 않는다.

## 규칙 강제

- 편집 폴더 규칙은 에이전트 파일의 tools 목록과 지침으로 지킨다.
- 추가로 .claude/settings.json의 PreToolUse hook(harness/scripts/guard-paths.js)이 폴더 밖 쓰기와 허용되지 않은 명령을 막는다. (2026-09-29 점수 개선 작업에서 앞당겨 추가)
- hook은 입력의 agent_type으로 에이전트를 구분한다. 이 값이 없으면 통과시킨다(fail-open). 실제로 값이 들어오는지 드라이런 1차에서 확인한다. → 2026-10-01 확인: 값이 들어온다 (judge·researcher 쓰기 차단 사례로 확인).
- hook은 경로를 `CLAUDE_PROJECT_DIR`(없으면 입력의 cwd) 기준으로 판단한다 (2026-10-01 수정). 오케스트레이터는 Bash에서 `cd`로 작업 폴더를 바꾸지 않는다. 폴더가 바뀐 채 에이전트를 띄우면 정상 쓰기가 막힐 수 있다. (환경변수가 실제 hook에서 들어오는지는 라이브로 확인하지 못했다.)

## Figma 호출 규칙 (2026-10-02, 실행 중 얻은 규칙)

- Figma MCP 호출 한도(Education 플랜)에 걸린다. judge나 designer를 여러 개 동시에 돌리지 않는다. Figma를 읽거나 쓰는 에이전트는 한 번에 하나씩 순서대로 돌린다. 설계 문서만 고치는 planner나 로컬 스크립트만 쓰는 판정(G1·G2·G4)은 동시에 돌려도 된다.
- 에이전트에게는 Figma 호출을 병렬로 보내지 말라고 지시에 적는다. 한도에 걸리면 같은 호출을 다시 하고, 계속 실패하면 일부만 읽은 덤프로 판정하지 말고 중단해 보고한다.
- 페이지나 Section 전체를 get_metadata 하지 않는다 (출력이 매우 크다). 필요한 노드 id만 읽는다.
- 새 icon-*·content/ 프레임은 자동 레이아웃(가운데 정렬·패딩 0·고정 크기)으로 만든다. 수동 배치 프레임은 get_metadata가 자식을 숨겨 content·icon.structure 판정이 틀린다.
- 판정자는 읽은 노드 이름만 덤프에 넣는다. 추정한 이름을 넣지 않는다.

## figma-use 스킬

- designer·researcher가 Skill 도구로 `figma-use`를 불러오지 못할 수 있다 (Unknown skill). 이때 오케스트레이터가 Figma MCP 리소스 `skill://figma/figma-use/SKILL.md`를 읽고, 핵심 규칙(return으로 노드 id 반환, 색 0~1, 폰트 먼저 로드, appendChild 후 HUG/FILL, 페이지 전환 호출당 1회, 에러 시 safeToRetryWithoutCanvasRead)을 지시문에 붙여 넘긴다. use_figma 호출의 skillNames에는 `resource:figma-use`를 넣는다.
