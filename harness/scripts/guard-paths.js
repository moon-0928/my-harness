// PreToolUse hook: 하네스 에이전트가 자기 편집 폴더 밖에 쓰거나, 허용되지 않은 명령을 실행하면 막는다.
// stdin으로 hook 입력(JSON)을 받는다. 막을 때는 exit 2 + stderr 메시지.
// agent_type이 없는 호출(메인 세션)이나 하네스 밖 에이전트는 통과시킨다.
const fs = require('fs');
const path = require('path');

const POLICY = {
  researcher: { write: /^runs\/[^/]+\/s1\// },
  planner: { write: /^runs\/[^/]+\/s2\// },
  designer: { write: /^runs\/[^/]+\/design\// },
  // judge는 Figma 덤프 파일만 쓸 수 있다 (heredoc 명령 길이 한도 때문에 --dump로 넘긴다)
  judge: { write: /^runs\/[^/]+\/checks\/dump-[a-z0-9-]+\.json$/, command: /^node\s+harness\/scripts\/check-[a-z0-9-]+\.js(\s|$)/ },
};
const WRITE_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
const SHELL_TOOLS = ['Bash', 'PowerShell'];

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const agent = input.agent_type;
const policy = POLICY[agent];
if (!policy) process.exit(0);

const tool = input.tool_name;
const ti = input.tool_input || {};

function deny(msg) {
  process.stderr.write(`[guard] ${agent}: ${msg}\n`);
  process.exit(2);
}

if (WRITE_TOOLS.includes(tool)) {
  const fp = ti.file_path || ti.notebook_path;
  if (!fp) deny('파일 경로 없음');
  // 기준은 프로젝트 루트다. 에이전트의 cwd가 바뀌어도 상대 경로가 어긋나지 않게 한다.
  // 상대 경로(file_path)는 hook 입력의 cwd가 아니라 프로젝트 루트 기준으로 해석한다.
  const cwd = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const rel = path.relative(cwd, path.resolve(cwd, fp)).split(path.sep).join('/');
  if (!policy.write || rel.startsWith('..') || !policy.write.test(rel)) deny(`편집 폴더 밖 쓰기 차단: ${rel}`);
  process.exit(0);
}

if (SHELL_TOOLS.includes(tool)) {
  if (!policy.command) deny(`${tool} 사용 불가`);
  const cmd = String(ti.command || '').replace(/\r\n/g, '\n').trim();
  const lines = cmd.split('\n');
  const first = lines[0];
  if (!policy.command.test(first)) deny(`허용되지 않은 명령: ${first}`);
  // 첫 줄 끝의 heredoc(<<'EOF')만 허용하고, 명령 연결·리다이렉트·치환은 막는다.
  const head = first.replace(/<<-?\s*'?EOF'?\s*$/, '');
  if (/[;&|<>`$]/.test(head)) deny('명령 연결·리다이렉트·치환 금지');
  if (head !== first) {
    const body = lines.slice(1, -1);
    if (lines.length < 2 || lines[lines.length - 1].trim() !== 'EOF' || body.some((l) => l.trim() === 'EOF')) deny('heredoc 형식 오류');
  } else if (lines.length > 1) {
    deny('여러 줄 명령 금지');
  }
  process.exit(0);
}

process.exit(0);
