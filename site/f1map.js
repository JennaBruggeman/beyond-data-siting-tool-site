 
(function () {
'use strict';
const TAP = 12, CLUSTER = 24, DETAIL_Z = 6, LABEL_Z = 8, NS = 'http://www.w3.org/2000/svg';
const ST = new WeakMap();
const CSS = `.f1m-wrap{position:relative;display:block;max-width:100%}
.f1m-wrap>svg{touch-action:none;cursor:grab;max-width:100%;height:auto}.f1m-wrap>svg.f1m-drag{cursor:grabbing}
.f1m-wrap [data-map-body] path,.f1m-wrap [data-map-body] line,.f1m-wrap [data-map-body] rect{vector-effect:non-scaling-stroke}
.f1m-ctl{position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:4px;z-index:2}
.f1m-ctl button{width:32px;height:32px;border:1px solid #ccc;background:#fff;color:#333;font:16px/1 'IBM Plex Sans',sans-serif;cursor:pointer;padding:0}
.f1m-ctl button:hover{border-color:#888}.f1m-ctl button:focus-visible{outline:2px solid var(--bd-ink);outline-offset:1px}
.f1m-hit{fill:transparent;stroke:none;cursor:pointer}.f1m-cl{cursor:pointer}
.f1m-pop{position:absolute;z-index:3;background:#fff;border:1px solid #ccc;box-shadow:0 2px 8px rgba(0,0,0,.12);padding:6px;max-width:280px;max-height:260px;overflow:auto;font:13px/1.35 'IBM Plex Sans',sans-serif}
.f1m-pop h4{margin:2px 4px 6px;font-weight:500;font-size:13px}.f1m-pop button{display:block;width:100%;text-align:left;border:0;background:none;padding:6px 4px;min-height:24px;cursor:pointer;font:inherit;color:#222}
.f1m-pop button:hover{background:#f3f3f3}.f1m-pop .f1m-zoom{color:#666;border-top:1px solid #eee;margin-top:4px}
@media print{.f1m-ctl,.f1m-pop{display:none}}`;
const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a || {}) e.setAttribute(k, a[k]); return e; };
function css() { if (document.getElementById('f1m-css')) return; const s = document.createElement('style'); s.id = 'f1m-css'; s.textContent = CSS; document.head.appendChild(s); }
function enhance(root) { if (!root || !root.querySelectorAll || typeof document === 'undefined') return; css();
  root.querySelectorAll('svg[data-map]').forEach(svg => { if (!ST.has(svg)) { try { init(svg); } catch (e) { console.warn('f1map', e); } } }); }
const nums = s => (s || '').split(',').map(Number);
function init(svg) {
  const vb = svg.viewBox.baseVal, a = svg.getAttribute('data-map-area'), A = a ? nums(a) : [vb.x, vb.y, vb.width, vb.height];
   
  const cid = 'f1m-clip-' + Math.random().toString(36).slice(2, 8), defs = svg.querySelector('defs') || svg.insertBefore(el('defs'), svg.firstChild);
  defs.appendChild(Object.assign(el('clipPath', { id: cid }), {})).appendChild(el('rect', { x: A[0], y: A[1], width: A[2], height: A[3] }));
  const outer = el('g', { 'clip-path': `url(#${cid})` }), body = el('g', { 'data-map-body': '' });
  [...svg.childNodes].forEach(n => { if (n === defs || (n.nodeType === 1 && n.hasAttribute('data-map-static'))) return; body.appendChild(n); });
  outer.appendChild(body); const firstStatic = svg.querySelector('[data-map-static]'); svg.insertBefore(outer, firstStatic || null);
   
  const bb = nums(svg.getAttribute('data-map-bb')), fr = nums(svg.getAttribute('data-map-frame'));
  let F = null; if (bb.length === 4 && fr.length >= 2) { const [w, h, pad] = [fr[0], fr[1], fr[2] || 0], sx = (w - 2 * pad) / (bb[2] - bb[0]), sy = (h - 2 * pad) / (bb[3] - bb[1]), s = Math.min(sx, sy),
    ox = pad + ((w - 2 * pad) - (bb[2] - bb[0]) * s) / 2, oy = pad + ((h - 2 * pad) - (bb[3] - bb[1]) * s) / 2;
    F = { s, P: (x, y) => [ox + (x - bb[0]) * s, oy + (bb[3] - y) * s], I: (X, Y) => [bb[0] + (X - ox) / s, bb[3] - (Y - oy) / s] }; }
   
  const wrap = document.createElement('div'); wrap.className = 'f1m-wrap'; svg.parentNode.insertBefore(wrap, svg); wrap.appendChild(svg);
  const ctl = document.createElement('div'); ctl.className = 'f1m-ctl';
  ctl.innerHTML = '<button type="button" data-z="in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" data-z="out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" data-z="home" title="Whole map" aria-label="Whole map">⌂</button>';
  wrap.appendChild(ctl);
  const dt = (svg.getAttribute('data-map-detail') || 'lots,labels').split(',');
  const S = { svg, body, wrap, A, F, z: 1, tx: 0, ty: 0, max: +svg.getAttribute('data-map-max') || 24, min: +svg.getAttribute('data-map-min') || 1, city: svg.getAttribute('data-map-city'), markers: [], timer: null, pop: null, dragged: false,
    lots: dt.includes('lots'), labels: dt.includes('labels'), lotZ: +svg.getAttribute('data-map-lot-z') || DETAIL_Z, labelZ: +svg.getAttribute('data-map-label-z') || LABEL_Z };
   
  body.querySelectorAll('[data-fac],[data-mk]').forEach(m => { const c = m.querySelector('circle'); if (!c) return;
    const g = m.getAttribute('data-facg'), n = g ? g.split(':')[1].split(',').length : +(m.getAttribute('data-mk-n') || 1);
    const hit = el('circle', { class: 'f1m-hit', cx: c.getAttribute('cx'), cy: c.getAttribute('cy'), r: 1 }); m.insertBefore(hit, m.firstChild);
    S.markers.push({ el: m, x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), n, hit, t: ((m.querySelector('title') || {}).textContent || '').trim() }); });
  ST.set(svg, S);
  ctl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const c = [A[0] + A[2] / 2, A[1] + A[3] / 2];
    if (b.dataset.z === 'in') zoomAt(S, c[0], c[1], 1.8); else if (b.dataset.z === 'out') zoomAt(S, c[0], c[1], 1 / 1.8); else { S.z = 1; S.tx = 0; S.ty = 0; apply(S); } });
  pointers(S); apply(S);
  streetNames(S);
}
 
async function streetNames(S) { try {
  if (!S.F || S.city !== 'van' || typeof BD === 'undefined' || !BD.f1streets || S.svg.querySelector('.f1st-g') || S.svg.hasAttribute('data-map-no-streets') || S.svg.hasAttribute('data-map-pick')) return;    
  const sel = BD.S && BD.S.sel, id = S.svg.getAttribute('data-map-lot') || (sel && sel.id); if (!id) return;
  await BD.f1streets.load(); if (!S.svg.isConnected || S.svg.querySelector('.f1st-g')) return;
  const r = sel && String(sel.id) === String(id) && sel.ring ? sel.ring : null, R = r ? (Array.isArray(r[0]) ? r : r.reduce((a, v, i) => (i % 2 ? a[a.length - 1].push(v) : a.push([v]), a), [])) : [];
  const vb = S.svg.viewBox.baseVal, u = upp(S), fs = 12 * (isFinite(u) && u > 0 ? u : 1);
  const html = BD.f1streets.svg(id, S.F.P, { W: vb.width, H: vb.height, fs, collFs: fs, lotPts: R.map(q => S.F.P(q[0], q[1])), max: 6, minRun: 0.5 }); if (!html) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = html; S.body.appendChild(g); apply(S);
} catch (e) {} }
const upp = S => { const r = S.svg.getBoundingClientRect(), vb = S.svg.viewBox.baseVal; return r.width > 0 ? vb.width / r.width : 1; };   
function toSvg(S, cx, cy) { const p = S.svg.createSVGPoint(); p.x = cx; p.y = cy; const m = S.svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
function clamp(S) { const [ax, ay, aw, ah] = S.A; S.z = Math.max(S.min || 1, Math.min(S.max, S.z));
  if (S.z < 1) { S.tx = ax + (aw - aw * S.z) / 2 - ax * S.z; S.ty = ay + (ah - ah * S.z) / 2 - ay * S.z; return; }    
  S.tx = Math.min(ax - ax * S.z, Math.max(ax + aw - (ax + aw) * S.z, S.tx)); S.ty = Math.min(ay - ay * S.z, Math.max(ay + ah - (ay + ah) * S.z, S.ty)); }
function zoomAt(S, sx, sy, f) { const z0 = S.z, z1 = Math.max(S.min || 1, Math.min(S.max, z0 * f)); S.tx = sx - (sx - S.tx) * (z1 / z0); S.ty = sy - (sy - S.ty) * (z1 / z0); S.z = z1; apply(S); }
function apply(S) { clamp(S); S.body.setAttribute('transform', `translate(${S.tx.toFixed(2)} ${S.ty.toFixed(2)}) scale(${S.z.toFixed(4)})`);
  const k = 1 / S.z, r0 = TAP * upp(S), r = isFinite(r0) && r0 > 0 ? r0 : 0;    
  for (const m of S.markers) { m.el.setAttribute('transform', `translate(${m.x} ${m.y}) scale(${k}) translate(${-m.x} ${-m.y})`); m.hit.setAttribute('r', r.toFixed(2)); }
  S.svg.querySelectorAll('[data-map-hide-zoomed]').forEach(e => { e.style.display = S.z > 1.02 ? 'none' : ''; });
   
  { const u = upp(S) / S.z; S.body.querySelectorAll('text').forEach(t => { if (t.closest('[data-fac],[data-mk],.f1m-lab')) return; if (t.dataset.fs0 == null) t.dataset.fs0 = parseFloat(getComputedStyle(t).fontSize) || 12;
      const f = Math.max(+t.dataset.fs0, 12 * u); t.style.fontSize = f.toFixed(3) + 'px'; });
     
    const u0 = upp(S); S.svg.querySelectorAll('[data-map-static] text').forEach(t => { const tx = (t.textContent || '').trim(); if (/^(?:[\d.,]+\s*(?:m|km)?|N\s*↑?)$/.test(tx)) return;
      if (t.dataset.fs0 == null) t.dataset.fs0 = parseFloat(getComputedStyle(t).fontSize) || 12; t.style.fontSize = Math.max(+t.dataset.fs0, 12 * u0).toFixed(3) + 'px';
       
      if (t.dataset.x0 == null) t.dataset.x0 = t.getAttribute('x') || ''; if (t.dataset.x0 !== '') t.setAttribute('x', t.dataset.x0);
      try { const vb = S.svg.viewBox.baseVal, bb = t.getBBox(), over = bb.x + bb.width - (vb.x + vb.width - 4 * u0); if (over > 0 && t.dataset.x0 !== '') t.setAttribute('x', (+t.dataset.x0 - over).toFixed(2)); } catch (e) {} }); }
   
  S.svg.querySelectorAll('[data-map-static] text').forEach(t => { const m = /^\s*([\d.,]+)\s*(m|km)\s*$/.exec(t.dataset.m0 || t.textContent); if (!m) return; if (!t.dataset.m0) t.dataset.m0 = t.textContent;
    const v = parseFloat(m[1].replace(/,/g, '')) * (m[2] === 'km' ? 1000 : 1) / S.z, nice = v >= 1000 ? (Math.round(v / 100) / 10) + ' km' : (v >= 100 ? Math.round(v / 10) * 10 : Math.round(v)) + ' m'; t.textContent = nice; });
  closePop(S); clearTimeout(S.timer); S.timer = setTimeout(() => { cluster(S); detail(S); }, 140); }
 
function pointers(S) { const svg = S.svg, P = new Map(); let last = null, dist = null, moved = 0;
  svg.addEventListener('pointerdown', e => { if (e.button > 0) return; P.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; S.dragged = false; last = toSvg(S, e.clientX, e.clientY); dist = null; });
  svg.addEventListener('pointermove', e => { if (!P.has(e.pointerId)) return; const prev = P.get(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]);
    if (P.size === 1) { moved += Math.hypot(e.clientX - prev[0], e.clientY - prev[1]); if (moved < 4) return;
      if (!S.dragged) { S.dragged = true; try { svg.setPointerCapture(e.pointerId); } catch (x) {} svg.classList.add('f1m-drag'); }
      const p = toSvg(S, e.clientX, e.clientY); S.tx += p.x - last.x; S.ty += p.y - last.y; last = p; apply(S); }
    else if (P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = toSvg(S, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      S.dragged = true; if (dist) zoomAt(S, m.x, m.y, d / dist); dist = d; } });
  const up = e => { P.delete(e.pointerId); if (P.size < 2) dist = null; if (!P.size) svg.classList.remove('f1m-drag'); if (P.size === 1) last = toSvg(S, ...[...P.values()][0]); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('click', e => { if (S.dragged) { e.stopPropagation(); e.preventDefault(); S.dragged = false; } }, true);
  svg.addEventListener('wheel', e => { e.preventDefault(); const p = toSvg(S, e.clientX, e.clientY); zoomAt(S, p.x, p.y, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  svg.addEventListener('click', e => { const c = e.target.closest && e.target.closest('.f1m-cl'); if (!c) return; e.stopPropagation(); openPop(S, c, e); });
  if (svg.hasAttribute('data-map-pick')) svg.addEventListener('click', e => { if (e.defaultPrevented || !S.F) return; const p = toSvg(S, e.clientX, e.clientY);
    if (S.z < S.lotZ) { zoomAt(S, p.x, p.y, Math.min(3, S.lotZ / S.z + 0.01)); return; }    
    const [wx, wy] = S.F.I((p.x - S.tx) / S.z, (p.y - S.ty) / S.z), lot = lotAt(S, wx, wy);
    svg.dispatchEvent(new CustomEvent('f1m-lot', { bubbles: true, detail: lot || { none: true } })); });
}
 
function lotAt(S, x, y) { let best = null, ba = Infinity; const tl = S.tl || [], pip = BD.pip, area = BD.area;
  for (const t of tl) for (const p of t.par || []) { const b = p.bb; if (!b || x < b[0] || x > b[2] || y < b[1] || y > b[3] || !pip(x, y, p.r)) continue; const a = area(p.r); if (a < ba) { ba = a; best = { t, p }; } }
  if (!best) return null; const ids = best.p.ids && best.p.ids.length ? best.p.ids : [best.p.id];
  for (const id of ids) { const own = tl.find(t => t.A && t.A[id]) || (BD.S && BD.S.tiles && Object.values(BD.S.tiles).find(t => t.key && t.A && t.A[id] && BD.S.tiles[S.city + ':' + t.key] === t));
    if (own) return { city: S.city, tile: own.key, id: String(id), a: own.A[id], ring: best.p.r }; }
  return { city: S.city, tile: best.t.key, id: String(ids[0]), a: null, ring: best.p.r }; }
 
function zoomTo(svg, bb, fill) { const S = ST.get(svg); if (!S || !S.F) return; const [ax, ay, aw, ah] = S.A, a = S.F.P(bb[0], bb[3]), b = S.F.P(bb[2], bb[1]);
  const w = Math.max(1e-6, b[0] - a[0]), h = Math.max(1e-6, b[1] - a[1]), z = Math.max(1, Math.min(S.max, (fill || 0.35) * Math.min(aw / w, ah / h)));
  S.z = z; S.tx = ax + aw / 2 - z * (a[0] + w / 2); S.ty = ay + ah / 2 - z * (a[1] + h / 2); apply(S); }
function mark(svg, rings) { const S = ST.get(svg); if (!S || !S.F) return; const old = S.body.querySelector('[data-map-sel]'); if (old) old.remove(); if (!rings || !rings.length) return;
  let d = ''; for (const r of rings) { for (let i = 0; i < r.length; i += 2) { const [x, y] = S.F.P(r[i], r[i + 1]); d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2); } d += 'Z'; }
  const g = el('g', { 'data-map-sel': '', 'pointer-events': 'none' }); g.appendChild(el('path', { d, fill: '#3366A3', 'fill-opacity': '0.25', stroke: '#16181B', 'stroke-width': '2' })); S.body.appendChild(g); }
 
function cluster(S) { S.body.querySelectorAll('.f1m-cl').forEach(n => n.remove()); if (S.markers.length < 2) return;
  const u = upp(S), px = m => [(m.x * S.z + S.tx) / u, (m.y * S.z + S.ty) / u], groups = [];
  for (const m of S.markers.slice().sort((a, b) => b.n - a.n)) { const p = px(m); const g = groups.find(g => Math.hypot(g.p[0] - p[0], g.p[1] - p[1]) < CLUSTER);
    if (g) g.ms.push(m); else groups.push({ p, ms: [m] }); }
  for (const g of groups) { const one = g.ms.length === 1; g.ms.forEach(m => { m.el.style.display = one ? '' : 'none'; }); if (one) continue;
    const x = g.ms.reduce((t, m) => t + m.x, 0) / g.ms.length, y = g.ms.reduce((t, m) => t + m.y, 0) / g.ms.length, n = g.ms.reduce((t, m) => t + m.n, 0), k = 1 / S.z, r = TAP * u;
    const c = el('g', { class: 'f1m-cl', transform: `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`, role: 'button', 'aria-label': `${n} here: open the list` });
    const solid = g.ms.some(m => { const q = m.el.querySelector('circle:not(.f1m-hit)'), f = q ? q.getAttribute('fill') || '' : ''; return f && f !== '#fff' && f !== 'none'; });    
    c.appendChild(el('circle', { cx: x, cy: y, r: (r * 0.85).toFixed(2), fill: solid ? '#3366A3' : '#fff', stroke: '#3366A3', 'stroke-width': (1.6 * u).toFixed(2) }));
    const t = el('text', { x, y: y + 4 * u, 'text-anchor': 'middle', 'font-size': (12 * u).toFixed(2), fill: solid ? '#fff' : '#3366A3', 'font-weight': '600' }); t.textContent = String(n); c.appendChild(t);
    c._ms = g.ms; c._xy = [x, y]; S.body.appendChild(c); } }
function closePop(S) { if (S.pop) { S.pop.remove(); S.pop = null; } }
function openPop(S, c, e) { closePop(S); const box = S.wrap.getBoundingClientRect(), pop = document.createElement('div'); pop.className = 'f1m-pop';
  pop.innerHTML = `<h4>${c._ms.reduce((t, m) => t + m.n, 0)} here</h4>` + c._ms.map((m, i) => `<button type="button" data-i="${i}">${(m.t.split(' · ')[0] || 'Item ' + (i + 1)).replace(/[<&]/g, ch => ch === '<' ? '&lt;' : '&amp;')}</button>`).join('') + '<button type="button" class="f1m-zoom" data-zin="1">Zoom in here</button>';
  pop.style.left = Math.min(box.width - 290, Math.max(4, e.clientX - box.left + 8)) + 'px'; pop.style.top = Math.max(4, e.clientY - box.top + 8) + 'px';
  pop.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; ev.stopPropagation(); closePop(S);
    if (b.dataset.zin) { zoomAt(S, c._xy[0] * S.z + S.tx, c._xy[1] * S.z + S.ty, 3); return; }
    const m = c._ms[+b.dataset.i]; if (m) m.el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  S.wrap.appendChild(pop); S.pop = pop; }
 
async function detail(S) { const old = S.body.querySelector('[data-map-detail]'); if (old) old.remove();
  if (!S.F || !S.city || S.z < Math.min(S.lots ? S.lotZ : 1e9, S.labels ? S.labelZ : 1e9) || typeof BD === 'undefined' || !BD.loadTile) return;
  const [ax, ay, aw, ah] = S.A, b0 = [(ax - S.tx) / S.z, (ay - S.ty) / S.z], b1 = [(ax + aw - S.tx) / S.z, (ay + ah - S.ty) / S.z];
  const w0 = S.F.I(b0[0], b1[1]), w1 = S.F.I(b1[0], b0[1]), vb = [w0[0], w0[1], w1[0], w1[1]], tok = S.dtok = (S.dtok || 0) + 1;
  let m = BD.S && BD.S.meta && BD.S.meta[S.city]; if (!m) { try { m = await BD.getJSON(`tiles/${S.city}/meta.json`); } catch (e) { return; } }
  const T = m.T, have = new Set((m.tiles || []).map(t => t[0] + '_' + t[1])), keys = [];
  for (let i = Math.floor(vb[0] / T); i <= Math.floor(vb[2] / T); i++) for (let j = Math.floor(vb[1] / T); j <= Math.floor(vb[3] / T); j++) if (have.has(i + '_' + j)) keys.push(i + '_' + j);
  if (keys.length > 6) return;
  const tiles = S.lots && S.z >= S.lotZ ? (await Promise.all(keys.map(k => BD.loadTile(S.city, k).catch(() => null)))).filter(Boolean) : []; if (tok !== S.dtok) return; S.tl = tiles;
  const hit = q => !(q[2] < vb[0] || q[0] > vb[2] || q[3] < vb[1] || q[1] > vb[3]), P = S.F.P; let d = '';
  for (const t of tiles) for (const p of t.par || []) { if (!p.bb || !hit(p.bb)) continue; const r = p.r; for (let i = 0; i < r.length; i += 2) { const [x, y] = P(r[i], r[i + 1]); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } d += 'Z'; }
  const g = el('g', { 'data-map-detail': '' }); if (d) g.appendChild(el('path', { d, fill: 'none', stroke: '#b9b9b9', 'stroke-width': '0.6' }));
  if (S.labels && S.z >= S.labelZ && BD.streets) { const st = await BD.streets(S.city); if (tok !== S.dtok) return;
    if (st && st.names && st.nameOf) { const u = upp(S) / S.z, seen = new Set(), at = []; let n = 0;    
      st.segs.forEach((sg, si) => { if (n >= 40) return; const nm = st.names[st.nameOf[si]]; if (!nm || seen.has(nm) || sg.length < 6) return;
        const k = 2 + 2 * Math.floor((sg.length - 2) / 4), x = sg[k], y = sg[k + 1]; if (x < vb[0] || x > vb[2] || y < vb[1] || y > vb[3]) return;
        const [X, Y] = P(x, y), [X2, Y2] = P(sg[Math.min(k + 2, sg.length - 2)], sg[Math.min(k + 3, sg.length - 1)]), sp = [(X * S.z + S.tx) / upp(S), (Y * S.z + S.ty) / upp(S)];
        if (at.some(q => Math.hypot(q[0] - sp[0], q[1] - sp[1]) < 70)) return; at.push(sp); let ang = Math.atan2(Y2 - Y, X2 - X) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
        const t = el('text', { x: X, y: Y, 'font-size': (12 * u).toFixed(3), fill: '#555', stroke: '#fff', 'stroke-width': (2.5 * u).toFixed(3), 'paint-order': 'stroke', 'text-anchor': 'middle', transform: `rotate(${ang.toFixed(1)} ${X} ${Y})` });
        t.textContent = nm.toLowerCase().replace(/\b[a-z]/g, ch => ch.toUpperCase()).replace(/(\d)([A-Za-z]+)/g, (s, a, b) => a + b.toLowerCase());     g.appendChild(t); seen.add(nm); n++; }); } }
  const first = S.markers.length ? S.markers[0].el : null; S.body.insertBefore(g, first && first.parentNode === S.body ? first : null); }
 
function zoomBox(svg, b, fill) { const S = ST.get(svg); if (!S) return; const [ax, ay, aw, ah] = S.A, w = Math.max(1e-6, b[2] - b[0]), h = Math.max(1e-6, b[3] - b[1]), z = Math.max(1, Math.min(S.max, (fill || 0.45) * Math.min(aw / w, ah / h)));
  S.z = z; S.tx = ax + aw / 2 - z * (b[0] + w / 2); S.ty = ay + ah / 2 - z * (b[1] + h / 2); apply(S); }
const api = { enhance, zoomTo, zoomBox, mark };
if (typeof window !== 'undefined') { window.BD = window.BD || {}; window.BD.f1map = api; }
})();
