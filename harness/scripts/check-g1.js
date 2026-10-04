// G1 이 정도 모으면 충분한가 — runs/<id>/s1/s1-references.md 판정
// 사용법: node harness/scripts/check-g1.js <runDir> [--no-write]
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const args = L.parseArgs(process.argv.slice(2));
const runDir = args._[0];
const rules = L.loadRules();
const g = rules.gates.g1;
const v = [];

const screens = L.loadInput(runDir, rules, v);
const file = path.join(runDir, 's1', 's1-references.md');

if (!fs.existsSync(file)) {
  v.push({ rule: 'g1.file', detail: 's1/s1-references.md 없음' });
} else {
  const sections = L.splitScreens(L.stripComments(L.readText(file)));
  for (const screen of screens) {
    const sec = sections.find((s) => s.screen === screen);
    if (!sec) {
      v.push({ rule: 'g1.missingScreen', screen, detail: '"## 화면:" 섹션 없음' });
      continue;
    }
    const table = L.parseTable(sec.body);
    if (JSON.stringify(table.header) !== JSON.stringify(g.columns)) {
      v.push({ rule: 'g1.format', screen, detail: `표 열이 템플릿과 다름: ${table.header.join(' | ')}` });
      continue;
    }
    const rows = table.rows.filter((r) => r.slice(1).some((c) => c));
    if (rows.length < g.minRefsPerScreen) {
      v.push({ rule: 'g1.minRefs', screen, detail: `레퍼런스 ${rows.length}개 < ${g.minRefsPerScreen}` });
    }
    const apps = new Set(rows.map((r) => r[1]).filter(Boolean));
    if (apps.size < g.minDistinctApps) {
      v.push({ rule: 'g1.minApps', screen, detail: `서로 다른 앱 ${apps.size}개 < ${g.minDistinctApps}` });
    }
    for (const r of rows) {
      if (!r[3] || !r[3].includes(g.urlMustContain)) v.push({ rule: 'g1.url', screen, row: r[0], detail: `URL에 ${g.urlMustContain} 없음` });
      if (!r[4]) v.push({ rule: 'g1.point', screen, row: r[0], detail: '반영 포인트 비어 있음' });
    }
  }
}

L.finish(args, runDir, 'g1', v);
