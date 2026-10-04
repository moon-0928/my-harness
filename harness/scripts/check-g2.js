// G2 이 규칙(화면 설계)으로 확정해도 되나 — runs/<id>/s2/s2-screen-spec.md 판정
// 사용법: node harness/scripts/check-g2.js <runDir> [--no-write]
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const args = L.parseArgs(process.argv.slice(2));
const runDir = args._[0];
const rules = L.loadRules();
const g = rules.gates.g2;
const dm = rules.dataModel;
const A = rules.mustNot.A_defaultPrivate;
const B = rules.mustNot.B_noSaleBeforeReview;
const v = [];

// "Asset.review_status: pending" 또는 "Asset.title"을 검사한다.
function checkRef(screen, section, text) {
  const m = text.match(/^([A-Za-z]+)\.([a-z_]+)(?:\s*:\s*(.+))?$/);
  if (!m) {
    v.push({ rule: 'g2.refFormat', screen, section, detail: `"객체.필드" 형식이 아님: ${text}` });
    return;
  }
  const [, obj, field, value] = m;
  const key = `${obj}.${field}`;
  if (dm.excludedMVP.includes(obj) || (value && dm.excludedMVP.includes(`${key}=${value.trim()}`))) {
    v.push({ rule: 'g2.excludedMVP', screen, section, detail: `MVP 제외 항목: ${text}` });
    return;
  }
  if (!dm[obj] || !dm[obj].includes(field)) {
    v.push({ rule: 'g2.unknownField', screen, section, detail: `PRD 8절에 없음: ${key}` });
    return;
  }
  const allowed = dm.enumsMVP[key];
  if (value && allowed && !allowed.includes(value.trim())) {
    v.push({ rule: 'g2.enum', screen, section, detail: `${key} 허용값 아님: ${value.trim()}` });
  }
}

const screens = L.loadInput(runDir, rules, v);
const file = path.join(runDir, 's2', 's2-screen-spec.md');

if (!fs.existsSync(file)) {
  v.push({ rule: 'g2.file', detail: 's2/s2-screen-spec.md 없음' });
} else {
  const sections = L.splitScreens(L.stripComments(L.readText(file)));
  for (const screen of screens) {
    const sec = sections.find((s) => s.screen === screen);
    if (!sec) {
      v.push({ rule: 'g2.missingScreen', screen, detail: '"## 화면:" 섹션 없음' });
      continue;
    }
    const subs = L.splitSubsections(sec.body);
    const missing = g.sections.filter((n) => !(n in subs));
    if (missing.length) v.push({ rule: 'g2.missingSection', screen, detail: `섹션 없음: ${missing.join(', ')}` });

    if ('목적' in subs && !subs['목적'].trim()) v.push({ rule: 'g2.emptyPurpose', screen, detail: '목적이 비어 있음' });

    if ('유저스토리' in subs) {
      const ids = L.bullets(subs['유저스토리']).map((b) => (b.match(/^#(\d+)/) || [])[1]).filter(Boolean).map(Number);
      if (!ids.length) v.push({ rule: 'g2.story', screen, detail: '유저스토리 번호 없음' });
      for (const id of ids) if (!g.storyIds.includes(id)) v.push({ rule: 'g2.story', screen, detail: `없는 유저스토리 번호: #${id}` });
    }

    let rows = [];
    if ('컴포넌트' in subs) {
      const t = L.parseTable(subs['컴포넌트']);
      if (JSON.stringify(t.header) !== JSON.stringify(g.componentColumns)) {
        v.push({ rule: 'g2.format', screen, detail: `컴포넌트 표 열이 템플릿과 다름: ${t.header.join(' | ')}` });
      } else {
        rows = t.rows;
      }
    }

    if ('상태' in subs) for (const b of L.bullets(subs['상태'])) checkRef(screen, '상태', b);
    if ('데이터 필드' in subs) for (const b of L.bullets(subs['데이터 필드'])) checkRef(screen, '데이터 필드', b);

    // ★A: 공개 범위 기본값 = 비공개
    if (A.screens.includes(screen)) {
      const row = rows.find((r) => r[0] === A.requiredLayer);
      if (!row) v.push({ rule: 'mustNot.A', screen, detail: `${A.requiredLayer} 행 없음` });
      else if (row[2] !== A.requiredValue) v.push({ rule: 'mustNot.A', screen, detail: `공개 범위 기본값이 "${row[2]}" (필수: ${A.requiredValue})` });
    }
    // ★B: 검수 상태 표시가 있어야 판매 노출을 판정할 수 있다
    if (B.screens.includes(screen) && !rows.some((r) => r[0] === B.requiredLayer)) {
      v.push({ rule: 'mustNot.B', screen, detail: `${B.requiredLayer} 행 없음` });
    }
  }
}

L.finish(args, runDir, 'g2', v);
