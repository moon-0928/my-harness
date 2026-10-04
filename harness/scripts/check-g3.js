// G3 컨셉 시안을 확정해도 되나 — 키스크린 프레임 + runs/<id>/design/s3-concept.md 판정
// 사용법: node harness/scripts/check-g3.js <runDir> [--dump figma-dump.json] [--no-write]
//         --dump가 없으면 stdin에서 Figma 덤프를 읽는다.
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const args = L.parseArgs(process.argv.slice(2));
const runDir = args._[0];
const rules = L.loadRules();
const g = rules.gates.g3;
const v = [];

const frames = L.loadDump(args).frames || [];
if (frames.length < g.minFrames || frames.length > g.maxFrames) {
  v.push({ rule: 'g3.frameCount', detail: `키스크린 ${frames.length}개 (허용 ${g.minFrames}~${g.maxFrames})` });
}
for (const f of frames) {
  if (f.width !== rules.frame.width || f.height !== rules.frame.height) {
    v.push({ rule: 'frame.size', frame: f.name, detail: `${f.width}×${f.height} (필수 ${rules.frame.width}×${rules.frame.height})` });
  }
}

const file = path.join(runDir, 'design', 's3-concept.md');
if (!fs.existsSync(file)) {
  v.push({ rule: 'g3.file', detail: 'design/s3-concept.md 없음' });
} else {
  const lines = L.bullets(L.stripComments(L.readText(file)));
  for (const field of g.conceptFields) {
    const line = lines.find((l) => l.startsWith(`${field}:`));
    if (!line || !line.slice(field.length + 1).trim()) v.push({ rule: 'g3.decision', detail: `"${field}:" 항목이 없거나 비어 있음` });
  }
}

L.finish(args, runDir, 'g3', v);
