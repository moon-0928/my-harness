// 판정 스크립트 자체 검증. 오판 0건이어야 한다.
// 사용법: node harness/scripts/test.js
// - fixtures/<이름>/expect.json: { script, args, pass, rules }  rules = 나와야 하는 위반 규칙 집합(정확히 일치)
// - guard-cases.json: guard-paths.js 허용/차단 케이스
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const FIX = path.join(ROOT, 'harness', 'tests', 'fixtures');
const results = [];

for (const name of fs.readdirSync(FIX).sort()) {
  const dir = path.join(FIX, name);
  const expPath = path.join(dir, 'expect.json');
  if (!fs.existsSync(expPath)) continue;
  const exp = JSON.parse(fs.readFileSync(expPath, 'utf8'));
  const argv = [path.join(__dirname, exp.script), dir, ...(exp.args || []).map((a) => a.replace('{dir}', dir)), '--no-write'];
  const r = spawnSync(process.execPath, argv, { encoding: 'utf8' });
  let out;
  try {
    out = JSON.parse(r.stdout);
  } catch {
    results.push({ name, ok: false, why: `출력 파싱 실패: ${r.stderr.trim()}` });
    continue;
  }
  const got = [...new Set(out.violations.map((x) => x.rule))].sort();
  const want = [...new Set(exp.rules || [])].sort();
  const ok = out.pass === exp.pass && JSON.stringify(got) === JSON.stringify(want);
  results.push({ name, ok, why: ok ? '' : `기대 pass=${exp.pass} [${want}] / 실제 pass=${out.pass} [${got}]` });
}

const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'harness', 'tests', 'guard-cases.json'), 'utf8'));
for (const c of cases) {
  const input = {
    agent_type: c.agent,
    tool_name: c.tool,
    cwd: c.cwd ? path.join(ROOT, c.cwd) : ROOT,
    tool_input: c.file ? { file_path: path.join(ROOT, c.file) } : { command: c.command },
  };
  const r = spawnSync(process.execPath, [path.join(__dirname, 'guard-paths.js')], { input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
  const got = r.status === 2 ? 'deny' : 'allow';
  results.push({ name: `guard: ${c.name}`, ok: got === c.expect, why: got === c.expect ? '' : `기대 ${c.expect} / 실제 ${got} ${r.stderr.trim()}` });
}

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.why ? '  — ' + r.why : ''}`);
const bad = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} 통과, 오판 ${bad}건`);
process.exit(bad ? 1 : 0);
