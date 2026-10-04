// G4 이 규칙(토큰·컴포넌트)으로 확정해도 되나 — runs/<id>/design/s4-tokens.json 판정
// 사용법: node harness/scripts/check-tokens.js <runDir> [--no-write]
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const args = L.parseArgs(process.argv.slice(2));
const runDir = args._[0];
const rules = L.loadRules();
const v = [];

const norm = (c) => String(c).toLowerCase().replace(/\s+/g, '');
const allowedColors = rules.colors.allowed.map(norm);

const file = path.join(runDir, 'design', 's4-tokens.json');
if (!fs.existsSync(file)) {
  v.push({ rule: 'g4.file', detail: 'design/s4-tokens.json 없음' });
} else {
  const t = L.readJson(file);
  for (const [name, val] of Object.entries(t.color || {})) {
    if (!allowedColors.includes(norm(val))) v.push({ rule: 'color', token: `color.${name}`, detail: `허용되지 않은 색: ${val}` });
  }
  for (const [name, val] of Object.entries(t.radius || {})) {
    if (!rules.radius.allowed.includes(val)) v.push({ rule: 'radius', token: `radius.${name}`, detail: `허용되지 않은 라운드: ${val}` });
  }
  for (const [name, val] of Object.entries(t.spacing || {})) {
    if (!rules.spacing.allowed.includes(val)) v.push({ rule: 'spacing', token: `spacing.${name}`, detail: `허용되지 않은 간격: ${val}` });
  }
  const ty = rules.typography;
  for (const [name, s] of Object.entries(t.typography || {})) {
    const id = `typography.${name}`;
    if (!String(s.family || '').startsWith(ty.familyPrefix)) v.push({ rule: 'type.family', token: id, detail: `폰트: ${s.family}` });
    if (!ty.sizes.includes(s.size)) v.push({ rule: 'type.size', token: id, detail: `크기: ${s.size}` });
    if (!ty.weights.includes(s.weight)) v.push({ rule: 'type.weight', token: id, detail: `굵기: ${s.weight}` });
    if (!ty.lineHeights.some((lh) => Math.abs(lh - s.lineHeight) < 0.005)) v.push({ rule: 'type.lineHeight', token: id, detail: `행간: ${s.lineHeight}` });
    if ((s.letterSpacing || 0) !== ty.letterSpacing) v.push({ rule: 'type.letterSpacing', token: id, detail: `자간: ${s.letterSpacing}` });
    if (ty.textCaseForbidden.includes(s.textCase)) v.push({ rule: 'type.textCase', token: id, detail: `대소문자: ${s.textCase}` });
  }
  for (const name of Object.keys(t.shadow || {})) {
    if (!rules.shadow.exceptions.includes(name)) v.push({ rule: 'shadow', token: `shadow.${name}`, detail: '그림자 토큰은 예외 목록에 있는 것만 허용' });
  }
}

L.finish(args, runDir, 'g4', v);
