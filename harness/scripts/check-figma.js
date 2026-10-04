// G5 다음 단계로 진행해도 되는가 / S5 최종 검토 — Figma 화면 프레임 판정
// 사용법: node harness/scripts/check-figma.js <runDir> --gate g5|s5 [--dump figma-dump.json] [--no-write]
//         --dump가 없으면 stdin에서 Figma 덤프를 읽는다. 덤프 형식은 .claude/agents/judge.md 참조.
const L = require('./lib');

const args = L.parseArgs(process.argv.slice(2));
const runDir = args._[0];
const gate = args.gate === 's5' ? 's5' : 'g5';
const rules = L.loadRules();
const v = [];

const norm = (c) => String(c).toLowerCase().replace(/\s+/g, '');
const allowedColors = rules.colors.allowed.map(norm);
const accent = norm(rules.colors.accent.hex);
const content = rules.colors.contentLayer;
const A = rules.mustNot.A_defaultPrivate;
const B = rules.mustNot.B_noSaleBeforeReview;
const ty = rules.typography;
const kids = (n) => n.children || [];

function walk(node, fn, ancestors = []) {
  fn(node, ancestors);
  for (const c of kids(node)) walk(c, fn, [...ancestors, node]);
}
function find(node, pred) {
  const out = [];
  walk(node, (n) => { if (pred(n)) out.push(n); });
  return out;
}
function textOf(node) {
  if (node.type === 'TEXT') return node.characters;
  const t = find(node, (n) => n.type === 'TEXT')[0];
  return t ? t.characters : undefined;
}
const solidPaints = (n) => [...(n.fills || []), ...(n.strokes || [])].filter((p) => p.type === 'SOLID' && p.visible !== false);

function checkFrame(frame) {
  const where = (n) => ({ frame: frame.name, node: n.name });
  if (frame.width !== rules.frame.width || frame.height !== rules.frame.height) {
    v.push({ rule: 'frame.size', frame: frame.name, detail: `${frame.width}×${frame.height} (필수 ${rules.frame.width}×${rules.frame.height})` });
  }
  for (const side of ['paddingLeft', 'paddingRight']) {
    if (frame[side] !== undefined && frame[side] !== rules.frame.sidePadding) {
      v.push({ rule: 'frame.sidePadding', frame: frame.name, detail: `${side} ${frame[side]} (필수 ${rules.frame.sidePadding})` });
    }
  }

  let accentCount = 0;
  walk(frame, (n, anc) => {
    const inContent = [n, ...anc].some((x) => x.name && x.name.startsWith(content.prefix));

    // content/ 레이어: 색 검사는 빼되, UI chrome을 숨기지 못하게 한다
    if (n.name && n.name.startsWith(content.prefix)) {
      const hasImage = (n.fills || []).some((p) => p.type === 'IMAGE');
      const hasVector = find(n, (x) => x.type === 'VECTOR' || x.type === 'BOOLEAN_OPERATION').length > 0;
      if (!hasImage && !hasVector) v.push({ rule: 'content', ...where(n), detail: 'IMAGE 채우기·VECTOR·BOOLEAN_OPERATION이 없음' });
      const sub = find(n, (x) => x !== n);
      if (sub.some((x) => content.forbiddenInSubtree.nodeTypes.includes(x.type))) v.push({ rule: 'content', ...where(n), detail: '하위에 TEXT 노드 있음' });
      const bad = sub.filter((x) => content.forbiddenInSubtree.layerNames.some((p) => L.matchName(p, x.name || '')));
      if (bad.length) v.push({ rule: 'content', ...where(n), detail: `하위에 UI 약속 레이어 있음: ${bad.map((b) => b.name).join(', ')}` });
    }

    // 색
    for (const p of [...(n.fills || []), ...(n.strokes || [])]) {
      if (p.visible === false) continue;
      if (rules.colors.forbiddenPaints.includes(p.type)) v.push({ rule: 'gradient', ...where(n), detail: p.type });
    }
    if (!inContent) {
      for (const p of solidPaints(n)) {
        if (!allowedColors.includes(norm(p.color))) v.push({ rule: 'color', ...where(n), detail: `허용되지 않은 색: ${p.color}` });
      }
      const usesAccent = solidPaints(n).some((p) => norm(p.color) === accent);
      if (usesAccent) {
        accentCount++;
        const onForbidden = rules.colors.accent.forbiddenOnLayers.some((p) => L.matchName(p, n.name || ''))
          || (n.type === 'TEXT' && anc.some((a) => rules.colors.accent.forbiddenOnLayers.some((p) => L.matchName(p, a.name || ''))));
        if (onForbidden) v.push({ rule: 'accent.onButton', ...where(n), detail: 'accent를 버튼에 사용' });
      }
    }

    // 그림자
    for (const e of n.effects || []) {
      if (e.visible === false) continue;
      if ((e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') && !rules.shadow.exceptions.includes(n.name)) {
        v.push({ rule: 'shadow', ...where(n), detail: e.type });
      }
    }

    // 라운드
    if (typeof n.cornerRadius === 'number' && n.cornerRadius > 0) {
      const sq = rules.radius.iconSquircle;
      if (n.name === sq.layer) {
        if (Math.abs(n.cornerRadius - n.width * sq.ratio) > sq.tolerancePx) v.push({ rule: 'radius.squircle', ...where(n), detail: `${n.cornerRadius} (필수 ${n.width * sq.ratio})` });
      } else {
        const pill = rules.radius.pillWhenAtLeastHalfShortSide && n.width && n.height && n.cornerRadius >= Math.min(n.width, n.height) / 2;
        if (!pill && !rules.radius.allowed.includes(n.cornerRadius)) v.push({ rule: 'radius', ...where(n), detail: `허용되지 않은 라운드: ${n.cornerRadius}` });
      }
    }

    // 간격 (오토 레이아웃 값)
    for (const k of ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) {
      if (n === frame && (k === 'paddingLeft' || k === 'paddingRight')) continue;
      if (n[k] !== undefined && !rules.spacing.allowed.includes(n[k])) v.push({ rule: 'spacing', ...where(n), detail: `${k} ${n[k]}` });
    }

    // 타이포그래피
    if (n.type === 'TEXT') {
      if (!String(n.fontFamily || '').startsWith(ty.familyPrefix)) v.push({ rule: 'type.family', ...where(n), detail: n.fontFamily });
      if (!ty.sizes.includes(n.fontSize)) v.push({ rule: 'type.size', ...where(n), detail: n.fontSize });
      if (!ty.weights.includes(n.fontWeight)) v.push({ rule: 'type.weight', ...where(n), detail: n.fontWeight });
      if (n.lineHeight !== undefined) {
        // 객체형: PERCENT는 %값, 그 밖(PIXELS·단위 없음)은 px값
        const lh = typeof n.lineHeight !== 'object' ? n.lineHeight
          : n.lineHeight.unit === 'PERCENT' ? n.lineHeight.value / 100 : n.lineHeight.value / n.fontSize;
        if (!ty.lineHeights.some((x) => Math.abs(x - lh) < 0.01)) v.push({ rule: 'type.lineHeight', ...where(n), detail: lh.toFixed(2) });
      }
      const ls = typeof n.letterSpacing === 'object' ? n.letterSpacing.value : n.letterSpacing || 0;
      if (ls !== ty.letterSpacing) v.push({ rule: 'type.letterSpacing', ...where(n), detail: ls });
      if (ty.textCaseForbidden.includes(n.textCase)) v.push({ rule: 'type.textCase', ...where(n), detail: n.textCase });
    }

    // 아이콘: content/ 밖의 벡터는 icon-* 레이어(공용 아이콘 컴포넌트) 안에만. 색은 읽을 수 없어 G4에서 사람이 확인한다
    if (!inContent && rules.icon.appliesTo.includes(n.type)
      && ![n, ...anc].some((x) => (x.name || '').startsWith(rules.icon.layerPrefix))) {
      v.push({ rule: 'icon.structure', ...where(n), detail: `${n.type}가 ${rules.icon.layerPrefix}* 레이어 밖에 있음` });
    }

    // 입력창: 비활성 상태 테두리 없음 (focusRing은 컴포넌트 variant 정의용, 화면에는 rest 상태만)
    if (n.name === rules.input.layer && (n.strokes || []).some((p) => p.visible !== false) && (n.strokeWeight || 0) > rules.input.restStrokeWidth) {
      v.push({ rule: 'input.stroke', ...where(n), detail: `테두리 ${n.strokeWeight}` });
    }

    // 버튼 높이
    if (n.name && n.name.startsWith(rules.button.layerPrefix) && n.height !== undefined && n.height !== rules.button.height) {
      v.push({ rule: 'button.height', ...where(n), detail: `${n.height} (필수 ${rules.button.height})` });
    }
  });

  if (accentCount > rules.colors.accent.maxPerScreen) {
    v.push({ rule: 'accent.max', frame: frame.name, detail: `accent ${accentCount}개 > ${rules.colors.accent.maxPerScreen}` });
  }

  // ★A 공개 범위 기본값 = 비공개 (레이어가 없어도 위반)
  if (A.screens.includes(frame.screen)) {
    const sel = find(frame, (n) => n.name === A.requiredLayer);
    if (!sel.length) v.push({ rule: 'mustNot.A', frame: frame.name, detail: `${A.requiredLayer} 레이어 없음` });
    for (const s of sel) {
      const val = find(s, (n) => n.name === A.valueLayer)[0];
      const text = val && textOf(val);
      if (text !== A.requiredValue) v.push({ rule: 'mustNot.A', ...where(s), detail: `기본값 "${text === undefined ? '(없음)' : text}" (필수: ${A.requiredValue})` });
    }
  }

  // ★B 검수 전 판매 노출 금지 (컨테이너·검수 상태가 없어도 위반)
  if (B.screens.includes(frame.screen)) {
    const boxes = find(frame, (n) => B.container.includes(n.name));
    if (!boxes.length) v.push({ rule: 'mustNot.B', frame: frame.name, detail: `${B.container.join('/')} 없음` });
    for (const box of boxes) {
      // 검수 상태는 판매 신청 자산에만 보인다(2026-10-01 결정). 상태가 없으면 승인 전으로 보고, 판매 노출이 있으면 위반
      const status = find(box, (n) => n.name === B.requiredLayer)[0];
      const sale = find(box, (n) => B.saleLayers.includes(n.name));
      if (!status) {
        if (sale.length) v.push({ rule: 'mustNot.B', ...where(box), detail: `${B.requiredLayer} 없이 ${sale.map((s) => s.name).join(', ')} 노출` });
        continue;
      }
      const text = textOf(status);
      if (text !== B.approvedText && sale.length) {
        v.push({ rule: 'mustNot.B', ...where(box), detail: `검수 상태 "${text}"인데 ${sale.map((s) => s.name).join(', ')} 노출` });
      }
    }
  }
}

const screens = L.loadInput(runDir, rules, v);
const frames = L.loadDump(args).frames || [];
if (frames.length !== screens.length) v.push({ rule: 'frame.count', detail: `프레임 ${frames.length}개 ≠ 입력 화면 ${screens.length}개` });
for (const s of screens) if (!frames.some((f) => f.screen === s)) v.push({ rule: 'frame.missingScreen', screen: s, detail: '해당 화면 프레임 없음' });
for (const f of frames) checkFrame(f);

const contentLayers = frames.map((f) => ({ frame: f.name, layers: find(f, (n) => n.name && n.name.startsWith(content.prefix)).map((n) => n.name) }));
L.finish(args, runDir, gate, v, { contentLayers });
