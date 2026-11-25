 
(function(root){
'use strict';
 
const T = x => (typeof BD !== 'undefined' && BD.hub && BD.hub.RULES && BD.hub.RULES.belowMinFails === true) ? x : Math.max(0, x - 0.5);    
const NOISE_EDM = { gen: [78.0, 85.0], hub: [70.0, 85.0] };
const noiseMin = (kind, city) => (city === 'e' || city === 'edm') && NOISE_EDM[kind] ? 7.0 * Math.pow(10, (NOISE_EDM[kind][0] - NOISE_EDM[kind][1]) / 20) : 0;
const STEP = 0.25, SERVICE = 0.457, CH = [12.14, 2.36], E = 1e-9;
const CH_SIDE = () => T(1.5), CH_END = () => T(2.1);    
const NAME = { gen: 'generator', pad: 'transformer pad', hub: 'hub set', chill: 'chiller' };
const GAP0 = { 'gen|gen': 2.0, 'gen|hub': 2.0, 'gen|pad': 2.0, 'gen|chill': 2.0, 'hub|gen': 2.0, 'hub|pad': 3.0, 'hub|chill': 2.5,
  'pad|gen': 2.0, 'pad|hub': 3.0, 'pad|pad': 1.0, 'pad|chill': 1.0, 'chill|gen': 2.0, 'chill|hub': 2.5, 'chill|pad': 1.0, 'chill|chill': 0.0 };
const GAPk = k => T(GAP0[k]);    
const rnd = v => Math.round(v * 1000) / 1000;
const R_ = (u0, v0, L, W) => [rnd(u0), rnd(u0 + L), rnd(v0), rnd(v0 + W)];
 
const ov = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2])) > 1e-6;
const boxDist = (a, b) => { const dx = Math.max(0, b[0] - a[1], a[0] - b[1]), dy = Math.max(0, b[2] - a[3], a[2] - b[3]); return Math.hypot(dx, dy); };
const ptBox = (p, a) => { const dx = Math.max(0, a[0] - p[0], p[0] - a[1]), dy = Math.max(0, a[2] - p[1], p[1] - a[3]); return Math.hypot(dx, dy); };
const ptSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
 
function segHitsBox(a, b, r, open) { const e = open ? 1e-9 : -1e-9; let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
  const P = [-dx, dx, -dy, dy], Q = [a[0] - (r[0] + e), (r[1] - e) - a[0], a[1] - (r[2] + e), (r[3] - e) - a[1]];
  for (let i = 0; i < 4; i++) { if (Math.abs(P[i]) < 1e-15) { if (Q[i] < 0) return false; } else { const t = Q[i] / P[i]; if (P[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } }
  return open ? t1 - t0 > 1e-9 : true; }
const segBox = (a, b, r) => segHitsBox(a, b, r, false) ? 0 : Math.min(ptBox(a, r), ptBox(b, r), ptSeg([r[0], r[2]], a, b), ptSeg([r[1], r[2]], a, b), ptSeg([r[1], r[3]], a, b), ptSeg([r[0], r[3]], a, b));
 
function inPolyOn(p, P) { for (let i = 0; i < P.length; i++) if (ptSeg(p, P[i], P[(i + 1) % P.length]) < 1e-9) return true;
  let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
 
const boxIn = (r, P) => [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]].every(q => inPolyOn(q, P)) && !P.some((a, i) => segHitsBox(a, P[(i + 1) % P.length], r, true));
const zoneOf = r => { const ce = CH_END(), cs = CH_SIDE(); return (r[1] - r[0] >= r[3] - r[2]) ? [r[0] - ce, r[1] + ce, r[2] - cs, r[3] + cs] : [r[0] - cs, r[1] + cs, r[2] - ce, r[3] + ce]; };
const fronts = (r, d = T(3.0)) => { const lv = [[r[0], r[1], r[2] - d, r[2]], [r[0], r[1], r[3], r[3] + d]], lu = [[r[0] - d, r[0], r[2], r[3]], [r[1], r[1] + d, r[2], r[3]]]; return r[1] - r[0] >= r[3] - r[2] ? lv.concat(lu) : lu.concat(lv); };
const alongU = r => (r[1] - r[0]) >= (r[3] - r[2]);
function sideOk(a, b) { const ou = Math.min(a[1], b[1]) - Math.max(a[0], b[0]), ov2 = Math.min(a[3], b[3]) - Math.max(a[2], b[2]);
  if (!(ou > 0 || ov2 > 0)) return true; const side = alongU(a) === alongU(b) && (alongU(a) ? ou > 0 : ov2 > 0);
  const d = Math.max(b[0] - a[1], a[0] - b[1], b[2] - a[3], a[2] - b[3]); return d >= T(side ? 3.0 : 4.2) - 1e-9; }
function place(yard, lot, building, need, opt) {
  opt = opt || {}; const fill = opt.fill || [], step = opt.step || STEP, fixed = opt.fixed || [], keep = opt.keep || [], city = opt.city || null;
  const isRect = y => y.length === 4 && typeof y[0] === 'number';
  const isPt = q => Array.isArray(q) && q.length === 2 && typeof q[0] === 'number';
  const ys = isRect(yard) ? [yard] : (isPt(yard[0]) ? [yard] : yard);   
  const Y = ys.map(y => isRect(y) ? [[y[0], y[2]], [y[1], y[2]], [y[1], y[3]], [y[0], y[3]]] : y);
  const inY = r => Y.some(P => boxIn(r, P));
  const fenD = r => Math.min(...Y.map(P => Math.min(...P.map((a, i) => segBox(a, P[(i + 1) % P.length], r)))));
  const lotD = r => Math.min(...lot.map((a, i) => segBox(a, lot[(i + 1) % lot.length], r)));
  const bld = building.concat(keep), dBld = r => building.length ? Math.min(...building.map(b => boxDist(r, b))) : 99;    
  let U0 = 1e9, V0 = 1e9, U1 = -1e9, V1 = -1e9; Y.forEach(P => P.forEach(q => { U0 = Math.min(U0, q[0]); U1 = Math.max(U1, q[0]); V0 = Math.min(V0, q[1]); V1 = Math.max(V1, q[1]); }));
  const items = [];
  const frontOk = (f, extra, skip) => { if (!inY(f) || bld.some(b => ov(f, b))) return false; if (extra && ov(f, extra)) return false; return !items.some(it => it !== skip && ov(f, it.r)); };
  const frontLeft = (pad, extra) => fronts(pad.r).some(f => frontOk(f, extra, pad));
  function free(kind, r, kept, also) {
    if (!inY(r)) return null;
    if (fill.some(p => ptBox(p, r) < T(1.0) - E)) return null;
    if (keep.some(k => ov(r, k))) return null;    
    if (opt.okBox && !opt.okBox(r)) return null;    
    if ((kind === 'gen' || kind === 'hub') && (dBld(r) < T(1.5) - E || lotD(r) < T(3.0) - E)) return null;
    if ((kind === 'gen' || kind === 'hub') && fenD(r) < T(SERVICE) - E) return null;
    if (noiseMin(kind, city) && lotD(r) < noiseMin(kind, city) - E) return null;    
    if (kind === 'pad' && (dBld(r) < T(1.0) - E || fenD(r) < T(1.0) - E)) return null;
    for (const it of items) {
      let gap = GAPk(kind + '|' + it.kind); if (kept && ((kind === 'pad' && it.kind === 'gen') || (kind === 'gen' && it.kind === 'pad'))) gap = T(1.0);
      if (boxDist(r, it.r) < gap - E) return null;
      if (kind === 'chill' && it.kind === 'chill' && !sideOk(r, it.r)) return null;
      if (it.kind === 'chill' && ov(r, it.zone)) return null;
      if (it.kind === 'pad' && !frontLeft(it, r)) return null; }
    if (kind === 'chill') { const z = zoneOf(r); if (!inY(z) || bld.some(b => ov(z, b))) return null;
      for (const it of items) if (ov(z, it.r) || (it.kind === 'chill' && ov(z, it.zone)) || (it.kind === 'pad' && !frontLeft(it, r))) return null;
      return { r, zone: z }; }
    if (kind === 'pad') { for (const f of fronts(r)) { if (!inY(f) || bld.some(b => ov(f, b))) continue; if (items.some(it => ov(f, it.r))) continue; if ((also || []).some(q => ov(f, q))) continue; return { r, front: f }; } return null; }
    return { r }; }
  function scan(kind, dims) { const [L, W] = dims; let u = U0;
    while (u <= U1 + E) { let v = V0; while (v <= V1 + E) { for (const [a, b] of [[L, W], [W, L]]) { const p = free(kind, R_(u, v, a, b)); if (p && (!opt.wayOk || opt.wayOk(items.concat([{ kind, r: p.r }])))) return p; }     v = rnd(v + step); } u = rnd(u + step); }
    return null; }
  for (const f of fixed) { const p = free(f.kind, f.r.slice(), true, fixed.filter(q => q !== f).map(q => q.r)); if (!p) return { items, why: `kept ${NAME[f.kind]} at ${f.r.map(c => c.toFixed(2)).join(', ')} no longer fits` }; p.kind = f.kind; items.push(p); }
  const seq = { gen: Array.from({ length: need.gen[0] }, (_, i) => ['gen', i, need.gen[1]]), pad: Array.from({ length: need.pad[0] }, (_, i) => ['pad', i, need.pad[1]]),
    hub: need.hub ? [['hub', 0, need.hub]] : [], chill: Array.from({ length: need.chill }, (_, i) => ['chill', i, CH]) };
  const order = (opt.order || ['gen', 'pad', 'hub', 'chill']).flatMap(k => seq[k]);
  const tot = { gen: need.gen[0], pad: need.pad[0], hub: 1, chill: need.chill };
  for (const [kind, i, dims] of order) { const p = scan(kind, dims);
    if (!p) { const nf = fixed.filter(f => f.kind === kind).length; return { items, why: `${NAME[kind]} ${i + 1 + nf} of ${tot[kind] + nf}` }; }
    p.kind = kind; items.push(p); }
  return { items, why: null }; }
const api = { place, CH, SERVICE, T, noiseMin };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.plantfit = api; }
})(typeof window !== 'undefined' ? window : null);
