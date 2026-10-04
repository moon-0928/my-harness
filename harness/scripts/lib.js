// 판정 스크립트 공용 함수. 규칙 값은 여기 두지 않고 harness/rules.json에서만 읽는다.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function readText(p) {
  return fs.readFileSync(p, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
}

function readJson(p) {
  return JSON.parse(readText(p));
}

function loadRules() {
  return readJson(path.join(ROOT, 'harness', 'rules.json'));
}

// "<runDir> --gate g5 --dump file --no-write" 형태를 { _: [runDir], gate, dump, 'no-write' }로 바꾼다.
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith('--')) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[s.slice(2)] = next;
        i++;
      } else {
        args[s.slice(2)] = true;
      }
    } else {
      args._.push(s);
    }
  }
  return args;
}

function stripComments(md) {
  return md.replace(/<!--[\s\S]*?-->/g, '');
}

// "## 화면: <이름>" 단위로 자른다.
function splitScreens(md) {
  const re = /^## 화면:\s*(.+?)\s*$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(md))) marks.push({ screen: m[1], start: m.index, bodyStart: re.lastIndex });
  return marks.map((s, i) => ({
    screen: s.screen,
    body: md.slice(s.bodyStart, i + 1 < marks.length ? marks[i + 1].start : md.length),
  }));
}

// "### <이름>" 단위로 자른다.
function splitSubsections(body) {
  const re = /^###\s+(.+?)\s*$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(body))) marks.push({ name: m[1], start: m.index, bodyStart: re.lastIndex });
  const out = {};
  marks.forEach((s, i) => {
    out[s.name] = body.slice(s.bodyStart, i + 1 < marks.length ? marks[i + 1].start : body.length);
  });
  return out;
}

// 텍스트 안의 첫 번째 마크다운 표를 { header, rows }로 읽는다.
function parseTable(text) {
  let header = null;
  const rows = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('|')) {
      if (header) break;
      continue;
    }
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, '|'));
    if (!header) {
      header = cells;
      continue;
    }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    rows.push(cells);
  }
  return { header: header || [], rows };
}

function bullets(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, '').trim());
}

// "button-*" 같은 패턴과 레이어 이름을 비교한다.
function matchName(pattern, name) {
  if (!pattern.includes('*')) return pattern === name;
  const re = new RegExp('^' + pattern.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
  return re.test(name);
}

function loadInput(runDir, rules, v) {
  const p = path.join(runDir, 'input.json');
  if (!fs.existsSync(p)) {
    v.push({ rule: 'input.missing', detail: 'input.json 없음' });
    return [];
  }
  const screens = readJson(p).screens || [];
  const lim = rules.gates.input;
  if (screens.length < lim.minScreens || screens.length > lim.maxScreens) {
    v.push({ rule: 'input.count', detail: `화면 수 ${screens.length} (허용 ${lim.minScreens}~${lim.maxScreens})` });
  }
  for (const s of screens) {
    if (!rules.screens.includes(s)) v.push({ rule: 'input.unknownScreen', screen: s, detail: 'PRD 16절 핵심 화면이 아님' });
  }
  return screens;
}

// --dump 파일이 있으면 그 파일을, 없으면 stdin을 Figma 덤프로 읽는다.
function loadDump(args) {
  const raw = args.dump ? readText(args.dump) : fs.readFileSync(0, 'utf8');
  return JSON.parse(raw);
}

// 결과를 stdout에 출력하고, --no-write가 없으면 <runDir>/checks/<gate>.json에 저장한다.
function finish(args, runDir, gate, violations, extra = {}) {
  const result = { gate, pass: violations.length === 0, violationCount: violations.length, violations, ...extra };
  if (!args['no-write'] && runDir) {
    const dir = path.join(runDir, 'checks');
    fs.mkdirSync(dir, { recursive: true });
    const name = gate === 's5' ? 's5-report' : gate;
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({ ...result, checkedAt: new Date().toISOString() }, null, 2));
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
}

module.exports = {
  ROOT, readText, readJson, loadRules, parseArgs, stripComments, splitScreens,
  splitSubsections, parseTable, bullets, matchName, loadInput, loadDump, finish,
};
