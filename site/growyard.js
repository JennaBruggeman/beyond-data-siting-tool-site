 
(function (root) {
'use strict';
const CAP = 2325.0, HPM = 630.0, STEP = 0.05, KINDS = ['gen', 'pad', 'hub', 'chill'];
const HX = () => (root && root.BD && root.BD.hubchecks) || (typeof require !== 'undefined' ? require('./hubchecks.js') : null);
const PF = () => (root && root.BD && root.BD.plantfit) || (typeof require !== 'undefined' ? require('./plantfit.js') : null);
const TRc = () => (root && root.BD && root.BD.treach) || (typeof require !== 'undefined' ? require('./treach.js') : null);
 
const DEAD = 6.0, D1_LEN = 0.5;
function deadWorst(G) { const T = TRc(); if (!T || !T.deadEnds) return [0, null, null]; const de = T.deadEnds({ S: G.S, D: G.D, city: G.CITY }).filter(x => x.deadEnd_m != null);
  if (!de.length) return [0, null, null]; const r = de.reduce((a, x) => x.deadEnd_m > a.deadEnd_m ? x : a); const k = r.kind || r.corridorKind || '';
  return [r.deadEnd_m, r.storey, ({ pcor: 'public', ccor: 'clinic', scor: 'secure' })[k] || k]; }
const ra = r => (r[1] - r[0]) * (r[3] - r[2]), sum = a => a.reduce((s, x) => s + x, 0);
const pyRound = (x, n) => { const f = Math.pow(10, n); return Math.round(x * f) / f; };
 
const PERMS = (function perm(a) { if (a.length <= 1) return [a.slice()]; const out = []; a.forEach((x, i) => perm(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => out.push([x].concat(p)))); return out; })(KINDS);
 
 
 
function doorSeg0(u, v, o, w) { const h = (w || 0.9) / 2; return o === 'v' ? [[u, v - h], [u, v + h]] : [[u - h, v], [u + h, v]]; }
function segDistG(s1, s2) { const pd = (p, s) => { const [a, b] = s, dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; let t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), [p, q] = s1, [r, s] = s2;
  if (cr(p, q, r) * cr(p, q, s) < 0 && cr(r, s, p) * cr(r, s, q) < 0) return 0;
  return Math.min(pd(p, s2), pd(q, s2), pd(r, s1), pd(s, s1)); }
const doorSegG = d => doorSeg0(d[3], d[4], d[5], d.length > 6 && d[6] ? d[6] : 0.9);
function dcExitsApart(G, zones) { const bad = [], grp = new Map(); for (const st of Object.keys(G.S)) for (const x of G.S[st]) grp.set(st + '|' + x.id, x.g);
  for (const z of zones || []) { if (!z.exits || !z.ids || !z.ids.length) continue; const st = String(z.st);
    if (!z.ids.every(i => ['sup', 'hall', 'load', 'spare'].includes(grp.get(st + '|' + i)))) continue;
    const dd = []; for (const e of z.exits.slice(0, 2)) { const d = G.D.find(d => String(d[0]) === st && ((d[1] === e[0] && d[2] === e[1]) || (d[1] === e[1] && d[2] === e[0]))); if (!d) { dd.length = 0; break; } dd.push(doorSegG(d)); }    
    if (dd.length < 2) continue;
    const pts = []; (G.S[st] || []).filter(x => z.ids.includes(x.id)).forEach(x => x.r.forEach(r => { for (const u of [r[0], r[1]]) for (const v of [r[2], r[3]]) pts.push([u, v]); }));
    if (pts.length < 2) continue; let mx = 0; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) mx = Math.max(mx, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
    const half = mx / 2, need = z.public_corridor ? Math.min(half, 9.0) : Math.max(half, 9.0), apart = segDistG(dd[0], dd[1]);
    if (apart < need - D1_LEN - 1e-9) bad.push([z.name, pyRound(apart, 1), pyRound(need, 1)]); }
  return bad; }
 
const CAB = { kw15: 124.4, L: 0.6, W: 0.75, FRONT: 0.914, WALL: 0.025, DOOR_END: 1.1 }, RSTEP = 0.05, T_FIRE = 0.30, T_PART = 0.10;
function battRoom(n, L, W) { [L, W] = [Math.max(L, W), Math.min(L, W)]; const d1 = CAB.WALL + CAB.W + CAB.FRONT, d2 = 2 * (CAB.WALL + CAB.W) + CAB.FRONT, l1 = n * CAB.L + CAB.DOOR_END, l2 = Math.ceil(n / 2) * CAB.L + CAB.DOOR_END;
  if (L >= l1 - 1e-6 && W >= d1 - 1e-6) return [true, 1, l1, d1, 0]; if (L >= l2 - 1e-6 && W >= d2 - 1e-6) return [true, 2, l2, d2, 0];
  return [false, 2, l2, d2, Math.max(L < l2 ? (l2 - L) / l2 : 0, W < d2 ? (d2 - W) / d2 : 0)]; }
function lineOf(x, st) { const H = HX(); const k = H.kind(x, st); if (x.core || x.stair || ['pcore', 'score', 'shaft', 'exitpas'].includes(k)) return 'F'; return H.LINE[k] === undefined ? null : H.LINE[k]; }
function clearOf(x, rooms, st) {    
  const key = (a, b) => a + ',' + b, P = new Set(), cellsOf = rs => { const s = new Set(); for (const r of rs) for (let a = Math.round(r[0] / RSTEP); a < Math.round(r[1] / RSTEP); a++) for (let b = Math.round(r[2] / RSTEP); b < Math.round(r[3] / RSTEP); b++) s.add(key(a, b)); return s; };
  cellsOf(x.r).forEach(k => P.add(k)); const lx = lineOf(x, st), part = [];
  for (const y of rooms) { if (y === x || y.id === x.id) continue; const ly = lineOf(y, st); if ('F' === lx || 'F' === ly) continue; if (['P', 'S'].includes(lx) && ['P', 'S'].includes(ly) && lx !== ly) continue; part.push(cellsOf(y.r)); }
   
  const fire = []; for (const k of P) { const [a, b] = k.split(',').map(Number);
    for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = key(a + da, b + db); if (P.has(nk)) continue; if (part.some(s => s.has(nk))) continue;
      const u = da === 1 ? (a + 1) * RSTEP : a * RSTEP, v = db === 1 ? (b + 1) * RSTEP : b * RSTEP;
      fire.push(da ? [u, u, b * RSTEP, (b + 1) * RSTEP] : [a * RSTEP, (a + 1) * RSTEP, v, v]); } }
  const C = []; for (const k of P) { const [a, b] = k.split(',').map(Number), cu = (a + 0.5) * RSTEP, cv = (b + 0.5) * RSTEP;
    let inner = true; for (let i = -1; i <= 1 && inner; i++) for (let j = -1; j <= 1; j++) if ((i || j) && !P.has(key(a + i, b + j))) { inner = false; break; }    
    if (!inner) continue; let near = false; for (const e of fire) { const dx = Math.max(0, e[0] - cu, cu - e[1]), dy = Math.max(0, e[2] - cv, cv - e[3]); if (Math.max(dx, dy) <= T_FIRE / 2 + 1e-9) { near = true; break; } }
    if (!near) C.push([a, b]); }
  return C; }
function maxSquareCells(C) { if (!C.length) return 0; const S = new Set(C.map(c => c[0] + ',' + c[1])), dp = new Map(); let best = 0; const a0 = Math.min(...C.map(c => c[0])), a1 = Math.max(...C.map(c => c[0])), b0 = Math.min(...C.map(c => c[1])), b1 = Math.max(...C.map(c => c[1]));
  for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) if (S.has(a + ',' + b)) { const v = 1 + Math.min(dp.get((a - 1) + ',' + b) || 0, dp.get(a + ',' + (b - 1)) || 0, dp.get((a - 1) + ',' + (b - 1)) || 0); dp.set(a + ',' + b, v); if (v > best) best = v; }
  return best * RSTEP; }
function batteryShort(G, MW) { const br = []; for (const st of Object.keys(G.S)) for (const x of G.S[st]) { const nl = x.n.toLowerCase(); if (!nl.startsWith('battery room') || nl.includes('hvac')) continue;
    const C = clearOf(x, G.S[st], st), big = x.r.slice().sort((p, q) => ra(q) - ra(p))[0]; const ib = C.filter(c => (c[0] + 0.5) * RSTEP > big[0] && (c[0] + 0.5) * RSTEP < big[1] && (c[1] + 0.5) * RSTEP > big[2] && (c[1] + 0.5) * RSTEP < big[3]),
      Lc = ib.length ? Math.max((Math.max(...ib.map(c => c[0])) + 1 - Math.min(...ib.map(c => c[0]))) * RSTEP, (Math.max(...ib.map(c => c[1])) + 1 - Math.min(...ib.map(c => c[1]))) * RSTEP) : 0;    
    br.push({ A: pyRound(C.length * RSTEP * RSTEP, 1), w: pyRound(maxSquareCells(C), 2), L: pyRound(Lc, 2) }); }
  if (!br.length) return null; const n = Math.max(1, Math.ceil(MW * 1000 / CAB.kw15 - 1e-9)), r = br.reduce((p, q) => q.A > p.A ? q : p), [fits, , l, d, sh] = battRoom(n, r.L, r.w);
  if (fits || sh <= 0.05 + 1e-9) return null; return [n, pyRound(l, 2), pyRound(d, 2), pyRound(r.L, 2), pyRound(r.w, 2), pyRound(sh, 3)]; }
function lerp(a, b, d) { if (typeof a === 'number') return Math.round((a + d * (b - a)) * 1e4) / 1e4; if (Array.isArray(a)) return a.map((x, i) => lerp(x, b[i], d)); if (a && typeof a === 'object') { const o = {}; for (const k of Object.keys(a)) o[k] = lerp(a[k], b[k], d); return o; } return a; }
function geomAtRaw(F, d) { const G = lerp(F.base, F.g1, d); G.S = Object.fromEntries(Object.entries(G.S).map(([k, v]) => [+k, v])); return G; }
const hallArea = G => sum(Object.values(G.S).flat().filter(x => x.g === 'hall').map(x => sum(x.r.map(ra))));
const dcArea = G => sum(Object.entries(G.S).flatMap(([st, xs]) => xs.filter(x => x.g === 'hall' || x.g === 'sup' || (x.g === 'spare' && +st > 1))).map(x => sum(x.r.map(ra))));
function exits(G, zones) {
  return zones.map(([name, st, ids, [e1, e2]]) => {
    const door = (a, b) => { const d = G.D.find(d => d[0] === st && ((d[1] === a && d[2] === b) || (d[1] === b && d[2] === a))); return [d[3], d[4]]; };
    const pts = []; G.S[st].filter(x => ids.includes(x.id)).forEach(x => x.r.forEach(r => { for (const u of [r[0], r[1]]) for (const v of [r[2], r[3]]) pts.push([u, v]); }));
    let mx = 0; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) mx = Math.max(mx, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
    const p = door(...e1), q = door(...e2), dd = Math.hypot(p[0] - q[0], p[1] - q[1]), need = Math.max(mx / 2, 9.0);
     
    return { zone: name, apart: pyRound(dd, 2), need: pyRound(need, 2), ok: dd >= need - 0.5 - 1e-9, tight: Math.abs(dd - need) < 0.5 - 1e-9 }; });
}
const kindOf = p => p.id.startsWith('h') ? 'hub' : /enerator/.test(p.n) ? 'gen' : ({ t: 'pad', c: 'chill' })[p.id[0]] || null;
function drawn(G) {
  const dg = G.PLANT.filter(p => /enerator/.test(p.n) && !p.id.startsWith('h')), kw = new Set(dg.map(p => { const m = /([\d,]+) kW/.exec(p.n); return m ? +m[1].replace(/,/g, '') : 1000; }));
  const tp = G.PLANT.filter(p => p.id.startsWith('t')), kva = new Set(tp.map(p => { const m = /([\d,]+) kVA/.exec(p.n); return m ? +m[1].replace(/,/g, '') : 2500; }));
  const nc = G.PLANT.filter(p => p.id.startsWith('c')).length + (G.CHILL || []).length;
  return [dg.length, kw.size === 1 ? [...kw][0] : null, tp.length, kva.size === 1 ? [...kva][0] : null, nc];
}
 
function bld(G) { return Object.values(G.S).flat().flatMap(x => x.r); }
function land(G) {
  const rs = (G.YARD_WALK || []).map(r => r.slice()), s1 = G.S[1].flatMap(x => x.r);
  const inside = q => s1.some(r => Math.min(q[1], r[1]) - Math.max(q[0], r[0]) > 0.01 && Math.min(q[3], r[3]) - Math.max(q[2], r[2]) > 0.01);
  for (const d of G.D) { if (d[0] !== 1 || (d[1] !== 'OUT' && d[2] !== 'OUT')) continue; const [u, v, o] = [d[3], d[4], d[5]];
    const c = o === 'v' ? [[u, u + 1.2, v - 0.6, v + 0.6], [u - 1.2, u, v - 0.6, v + 0.6]] : [[u - 0.6, u + 0.6, v, v + 1.2], [u - 0.6, u + 0.6, v - 1.2, v]]; c.forEach(q => { if (!inside(q)) rs.push(q); }); }
  return rs;
}
const asPlant = (items, gkw) => { const pre = { gen: 'g', pad: 't', hub: 'h', chill: 'c' }, nm = { gen: `Generator, ${(gkw || 1000).toLocaleString('en-US')} kW`, pad: 'Transformer pad', hub: 'Hub generator', chill: 'Chiller (at grade)' }, cnt = {};
  return items.slice().sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind)).map(it => { cnt[it.kind] = (cnt[it.kind] || 0) + 1; return { id: pre[it.kind] + cnt[it.kind], n: nm[it.kind], r: it.r }; }); };
const pyNum = x => Number.isInteger(x) ? x.toFixed(1) : String(x);
function routeWhy(G, plantList, cache) {
  if (!(G.PLANT_YARDS || []).length) return null;
  const k = JSON.stringify(plantList.map(p => p.r.map(v => pyRound(v, 3))).sort());
  if (cache.has(k)) return cache.get(k);
  const old = G.PLANT; G.PLANT = plantList; let yg; try { yg = HX().yardgate(G); } finally { G.PLANT = old; }
  let why = null;
  for (const [key, lab] of [['doors', 'door'], ['gates', 'gate']]) { for (const x of yg[key]) if (x.status === 'fail') { const id = x.door ? `('${x.door[0]}', ${pyNum(x.door[1])}, ${pyNum(x.door[2])})` : JSON.stringify(x.gate); why = `yard route from ${lab} ${id}: ${x.why || 'fail'}`; break; } if (why) break; }
  cache.set(k, why); return why;
}
function plant(G, F, MW, hkw, ctx) {
  const H = HX(), P = PF(), Q = MW * 1.55, g = H.gens(Q, 0), t = H.transformers(Q, hkw, F.CITY || 'v'), hs = H.hubSet(hkw);
  const enc = hs.enclosure ? hs.enclosure[0] : hs.footprint, nchill = Math.ceil(Q / 1.489 - 1e-9) + 1;
  const need = { gen: [g.n, g.footprint], pad: [t.n, t.pad], hub: enc ? enc.slice() : null, chill: nchill }, B = bld(G), L = land(G), city = F.CITY || 'v', fill = G.FUEL_FILL || [];
  const base = { gen: g, tx: t, hub: hs, nchill, Q };
  const dg = drawn(G), same = { gen: dg[1] === g.kw, pad: dg[3] === t.kva, chill: true, hub: true };
  const fixed = G.PLANT.filter(p => kindOf(p) && same[kindOf(p)]).map(p => ({ kind: kindOf(p), r: p.r.slice() }));
  const have = Object.fromEntries(KINDS.map(k => [k, fixed.filter(f => f.kind === k).length])), want = { gen: g.n, pad: t.n, hub: need.hub ? 1 : 0, chill: nchill };
  const key = `${MW.toFixed(4)}`;
  if (KINDS.every(k => have[k] <= want[k]) && fixed.length && !ctx.keptFail.has(key)) {
    const need2 = { gen: [want.gen - have.gen, need.gen[1]], pad: [want.pad - have.pad, need.pad[1]], hub: have.hub === 0 ? need.hub : null, chill: want.chill - have.chill };
    for (const perm of PERMS) { const r = P.place(G.PLANT_YARDS, G.LOTPOLY, B, need2, { fill, order: perm, fixed, keep: L, city });
      if (r.why == null && routeWhy(G, asPlant(r.items, g.kw), ctx.rw) == null) return Object.assign({ ok: true, order: perm, items: r.items, kept: fixed.length }, base); }
    ctx.keptFail.add(key);
  }
  for (const kd of KINDS) {    
    const one = { gen: [0, need.gen[1]], pad: [0, need.pad[1]], hub: null, chill: 0 };
    if (kd === 'gen' || kd === 'pad') { if (need[kd][0] === 0) continue; one[kd] = [1, need[kd][1]]; } else if (kd === 'hub') { if (!need.hub) continue; one.hub = need.hub; } else { if (!need.chill) continue; one.chill = 1; }
    const r = P.place(G.PLANT_YARDS, G.LOTPOLY, B, one, { fill, keep: L, city });
    if (r.why) { const n = kd === 'gen' || kd === 'pad' ? need[kd][0] : kd === 'chill' ? need.chill : 1; return Object.assign({ ok: false, why: r.why.split(' of ')[0] + ` of ${n}` }, base); } }
  let first;
  for (const perm of PERMS) { const r = P.place(G.PLANT_YARDS, G.LOTPOLY, B, need, { fill, order: perm, keep: L, city }); let why = r.why;
    if (why == null) { const rw = routeWhy(G, asPlant(r.items, g.kw), ctx.rw); if (rw) why = rw; }
    if (first === undefined) first = why;
    if (why == null) return Object.assign({ ok: true, order: perm, items: r.items }, base); }
  return Object.assign({ ok: false, why: first }, base);
}
 
function travel(G, st) {
  const g = 0.25, rooms = G.S[st], cells = new Map(), K = (a, b) => a + ',' + b, idx = new Map(rooms.map((x, i) => [x.id, i])), DW = G.DOOR_W || 0.9;
  rooms.forEach((rm, i) => rm.r.forEach(r => { for (let a = Math.round(r[0] / g); a < Math.round(r[1] / g); a++) for (let b = Math.round(r[2] / g); b < Math.round(r[3] / g); b++) cells.set(K(a, b), i); }));
  const cross = new Map(), sources = [];
  const link = (c1, c2, a, b) => { const k1 = K(...c1), k2 = K(...c2); if (!cells.has(k1) && !cells.has(k2)) return;
    for (const [c, o] of [[k1, k2], [k2, k1]]) { if (!cells.has(c)) continue; const rc = cells.get(c), other = cells.has(o) ? cells.get(o) : null, tgt = other != null ? rooms[other] : null;
      if ((b === 'OUT' && rooms[rc].id === a) || (other == null && b === 'OUT') || (tgt && (tgt.stair || String(tgt.id).startsWith('pas')) && rooms[rc].id !== tgt.id)) { if ((rooms[rc].id === a || rooms[rc].id === b) && !rooms[rc].stair && !String(rooms[rc].id).startsWith('pas')) sources.push(c); }
      if (other != null && new Set([rooms[rc].id, rooms[other].id]).size === 2 && [a, b].includes(rooms[rc].id) && [a, b].includes(rooms[other].id)) { if (!cross.has(c)) cross.set(c, []); cross.get(c).push(o); } } };
  for (const dd of G.D) { const [s, a, b, u, v, o] = dd; if (s !== st) continue; const half = (dd.length > 6 && typeof dd[6] === 'number' ? dd[6] : DW) / 2;
    if (o === 'v') { const ia = Math.round(u / g); for (let k = Math.floor((v - half) / g); k < Math.ceil((v + half) / g); k++) link([ia - 1, k], [ia, k], a, b); }
    else { const ib = Math.round(v / g); for (let k = Math.floor((u - half) / g); k < Math.ceil((u + half) / g); k++) link([k, ib - 1], [k, ib], a, b); } }
  const dist = new Map(); const pq = []; const push = (d, c) => { pq.push([d, c]); let i = pq.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (pq[p][0] <= pq[i][0]) break; [pq[p], pq[i]] = [pq[i], pq[p]]; i = p; } };
  const pop = () => { const top = pq[0], last = pq.pop(); if (pq.length) { pq[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < pq.length && pq[l][0] < pq[m][0]) m = l; if (r < pq.length && pq[r][0] < pq[m][0]) m = r; if (m === i) break; [pq[m], pq[i]] = [pq[i], pq[m]]; i = m; } } return top; };
  sources.forEach(c => { dist.set(c, 0); push(0, c); });
  const nb8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  while (pq.length) { const [d, c] = pop(); if (d > (dist.has(c) ? dist.get(c) : 1e9)) continue; const ri = cells.get(c); if (rooms[ri].stair || rooms[ri].core) continue;
    const [ca, cb] = c.split(',').map(Number);
    for (const [dx, dy, w] of nb8) { const n = K(ca + dx, cb + dy); if (cells.get(n) !== ri) continue; if (dx && dy && (cells.get(K(ca + dx, cb)) !== ri || cells.get(K(ca, cb + dy)) !== ri)) continue;
      const nd = d + w * g; if (nd < (dist.has(n) ? dist.get(n) : 1e9)) { dist.set(n, nd); push(nd, n); } }
    for (const n of (cross.get(c) || [])) { const rn = rooms[cells.get(n)]; if (rn.stair || rn.core) continue; const nd = d + g; if (nd < (dist.has(n) ? dist.get(n) : 1e9)) { dist.set(n, nd); push(nd, n); } } }
  const out = {};
  for (const [c, ri] of cells) { const rm = rooms[ri]; if (rm.core || rm.g === 'load') continue; const dd = dist.get(c), k = rm.id;
    if (dd === undefined) { if (!(k in out)) out[k] = null; continue; } if (out[k] == null || dd > out[k]) out[k] = dd; }
  return out;
}
const isShaft = x => ['psh', 'sh1', 'sh2', 'ris3'].includes(x.id) || /shaft/.test(x.n.toLowerCase());
 
function clipRect(P, r) { let out = P.slice();
  const E = [[p => p[0] >= r[0], (a, b) => [r[0], a[1] + (b[1] - a[1]) * (r[0] - a[0]) / (b[0] - a[0])]], [p => p[0] <= r[1], (a, b) => [r[1], a[1] + (b[1] - a[1]) * (r[1] - a[0]) / (b[0] - a[0])]],
    [p => p[1] >= r[2], (a, b) => [a[0] + (b[0] - a[0]) * (r[2] - a[1]) / (b[1] - a[1]), r[2]]], [p => p[1] <= r[3], (a, b) => [a[0] + (b[0] - a[0]) * (r[3] - a[1]) / (b[1] - a[1]), r[3]]]];
  for (const [inn, cut] of E) { const src = out; out = []; for (let i = 0; i < src.length; i++) { const a = src[i], b = src[(i + 1) % src.length]; if (inn(b)) { if (!inn(a)) out.push(cut(a, b)); out.push(b); } else if (inn(a)) out.push(cut(a, b)); } if (!out.length) break; }
  return out; }
const polyA = P => Math.abs(P.reduce((t, p, i) => t + p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1], 0)) / 2;
function run(F, opt) {
  opt = opt || {}; const H = HX(), ctx = { rw: new Map(), keptFail: new Set() }, hpm = opt.hpm || HPM;
  const geomAt = (F_, d) => { const G = geomAtRaw(F_, d); if (opt.clip) { G.LOTPOLY = opt.clip; G.PLANT_YARDS = G.PLANT_YARDS.map(Y => Y.length === 4 && typeof Y[0] === 'number' ? clipRect(opt.clip, Y) : Y).filter(P => P.length >= 3 && polyA(P) > 1); } return G; };
  const G0 = geomAt(F, 0), baseDead = deadWorst(geomAtRaw(F, 0)), baseEx = new Set(dcExitsApart(geomAtRaw(F, 0), F.BZONES).map(b => b[0])), G1 = geomAt(F, 1), baseHall = hallArea(G0), baseDC = dcArea(G0), dc1 = dcArea(G1) - baseDC, h1 = hallArea(G1) - baseHall;
  const dCap = Math.floor((CAP - baseDC) / dc1 * 100) / 100, dLine = Math.min(dCap, F.DMAX), dFor = a => Math.max(0, a / h1);
  const byLine = dLine < dCap - 1e-9 || dcArea(geomAt(F, dLine)) < CAP - 1.0, limit = F.LIMIT || 'building line', dTop = dLine;
  const capMW = hallArea(geomAt(F, dTop)) / hpm, hkw = F.hub_kw, steps = [];
  for (let k = 0; ; k++) {
    const MW = k === 0 ? capMW : pyRound(capMW, 2) - STEP * k;
    if (MW < Math.max(baseHall / hpm, F.MW_FLOOR || 0) - 1e-9) break;
    const d = k === 0 ? dTop : dFor(MW * hpm - baseHall), Gd = geomAt(F, d), ex = exits(Gd, F.ZONES);
    const Q = MW * 1.55, g = H.gens(Q, 0), t = H.transformers(Q, hkw, F.CITY || 'v'), nc = Math.ceil(Q / 1.489 - 1e-9) + 1, dr = drawn(Gd);
    const same = JSON.stringify(dr) === JSON.stringify([g.n, g.kw, t.n, t.kva, nc]);
    let pl;
    if (d < 1e-6) pl = { ok: true, hand: true, gen: g, tx: t, nchill: nc };
    else if (same || (Gd.CHILL || []).length) {
      let why = same ? null : `the rule asks for ${g.n} x ${g.kw} kW, ${t.n} x ${t.kva} kVA, ${nc} chillers; drawn ${dr[0]} x ${dr[1]} kW, ${dr[2]} x ${dr[3]} kVA, ${dr[4]} chillers (roof chillers: not re-packed)`;
      if (why == null) { const fx = Gd.PLANT.filter(p => kindOf(p)).map(p => ({ kind: kindOf(p), r: p.r.slice() })); const r = PF().place(Gd.PLANT_YARDS, Gd.LOTPOLY, bld(Gd), { gen: [0, [1, 1]], pad: [0, [1, 1]], hub: null, chill: 0 }, { fill: Gd.FUEL_FILL || [], fixed: fx, keep: land(Gd), city: F.CITY || 'v' }); why = r.why || routeWhy(Gd, Gd.PLANT, ctx.rw); }
      if (why == null) pl = { ok: true, hand: true, gen: g, tx: t, nchill: nc };
      else if ((Gd.CHILL || []).length) pl = { ok: false, why, gen: g, tx: t, nchill: nc };
      else pl = plant(Gd, F, MW, hkw, ctx);
    } else pl = plant(Gd, F, MW, hkw, ctx);
    const st = { MW: pyRound(MW, 3), d: pyRound(d, 3), hall: pyRound(hallArea(Gd), 1), dc: pyRound(dcArea(Gd), 1), exits: ex,
      plant: pl.ok ? (pl.hand ? 'as drawn' : 'fits') : (/rule asks|kept|yard route/.test(pl.why) ? pl.why : `${pl.why} does not fit`), sets: `${pl.gen.n} x ${pl.gen.kw} kW`, pads: `${pl.tx.n} x ${pl.tx.kva} kVA`, chillers: pl.nchill };
    if (pl.ok && ex.every(e => e.ok)) {
      let worst = [0, '-']; for (const s of Object.keys(Gd.S).map(Number)) { const TR = travel(Gd, s), sh = new Set(Gd.S[s].filter(isShaft).map(x => x.id)); for (const [kx, vx] of Object.entries(TR)) { if (vx == null || sh.has(kx)) continue; if (vx > worst[0]) worst = [vx, kx]; } }
      const rx = Object.values(Gd.S).flat().find(x => x.id === worst[1]); st.travel = [pyRound(worst[0], 1), worst[1], rx ? rx.n.split(' (')[0].split(',')[0] : worst[1]];    
      if (worst[0] > 45 + 1e-9) { pl = Object.assign({}, pl, { ok: false }); st.plant += `; travel ${worst[0].toFixed(1)} m from ${worst[1]} > 45 m`; }
    }
    if (pl.ok && ex.every(e => e.ok) && d > 1e-6) {    
      const dw = deadWorst(Gd); st.dead = [pyRound(dw[0], 2), dw[1], dw[2]];
      if (dw[0] > DEAD + D1_LEN + 1e-9 && dw[0] > baseDead[0] + 1e-6) { pl = Object.assign({}, pl, { ok: false }); st.plant += `; dead-end corridor ${dw[0].toFixed(1)} m (storey ${dw[1]} ${dw[2]}) > ${(DEAD + D1_LEN).toFixed(1)} m`; } }
    if (pl.ok && ex.every(e => e.ok) && d > 1e-6 && F.BZONES) {    
      const bx = dcExitsApart(Gd, F.BZONES).filter(b => !baseEx.has(b[0]));
      if (bx.length) { pl = Object.assign({}, pl, { ok: false }); st.plant += '; ' + bx.map(b => `${b[0]} exits ${b[1]} m apart, ${b[2]} m needed (D1 0.5 m)`).join('; '); }
      const bs = batteryShort(Gd, MW); if (bs) { pl = Object.assign({}, pl, { ok: false }); st.battery = bs; st.plant += `; battery room ${bs[3].toFixed(1)} × ${bs[4].toFixed(2)} m clear, ${bs[0]} cabinets need ${bs[1].toFixed(1)} × ${bs[2].toFixed(2)} m`; } }
    st._pl = pl; steps.push(st); if (opt.log) opt.log(st);
    if (pl.ok && ex.every(e => e.ok)) break;
  }
  const last = steps[steps.length - 1], ok = last && ['fits', 'as drawn'].includes(last.plant) && last.exits.every(e => e.ok);
  if (!ok && F.MW_FLOOR) { const s0 = steps[0];
    return { MW: pyRound(baseHall / hpm, 3), d: 0, dc: pyRound(baseDC, 1), hall: pyRound(baseHall, 1), steps, plant: null, G: G0,
      stop: { rule: 'plant yard', text: s0 ? `not grown: plant yard (no size from ${s0.MW.toFixed(2)} down to ${F.MW_FLOOR.toFixed(2)} MW fits; at ${s0.MW.toFixed(2)} MW: ${s0.plant}); the board as drawn stands (project decision, 12 Nov)` : 'not grown' } }; }
  if (!ok) return { fail: 'no size passes down to the fit as drawn', steps };
  let stop;
  if (steps.length === 1 && byLine) stop = { rule: limit, text: `stopped by the ${limit}; data centre ${last.dc.toLocaleString('en-CA')} m², ${Math.round(CAP - last.dc)} m² under the cap` };
  else if (steps.length === 1) stop = { rule: 'floor cap', text: `held at the 2,325 m² floor cap (data centre ${last.dc} m²): exits and plant pass at the cap` };
  else { const s0 = steps[0], whyc = s0.exits.filter(e => !e.ok).map(e => `${e.zone} exits ${e.apart} m apart, ${e.need} m needed`).concat(['fits', 'as drawn'].includes(s0.plant) ? [] : [`plant: ${s0.plant}`]).join('; ');
    let rule = s0.exits.some(e => !e.ok) ? 'exit spacing' : 'plant yard'; if (rule === 'plant yard' && /roof chillers/.test(s0.plant)) rule = 'drawn plant (roof chillers)';
     
    const up = steps[steps.length - 2]; if (up && /travel/.test(up.plant) && !/does not fit/.test(up.plant) && up.travel) rule = `travel ≤ 45 m (${up.travel[2] || up.travel[1]})`;
    if (up && !/does not fit/.test(up.plant) && !up.exits.some(e => !e.ok)) {    
      if (/battery room /.test(up.plant)) rule = `battery room (${up.plant.split('battery room ')[1]}, one step up)`;
      else if (/ exits /.test(up.plant) && /needed \(D1/.test(up.plant)) rule = `exits apart (${up.plant.split('; ').find(p => /needed \(D1/.test(p))}, one step up)`; }
    if (up && /dead-end corridor/.test(up.plant) && !/does not fit/.test(up.plant) && up.dead) rule = `dead-end corridor ≤ 6 m (storey ${up.dead[1]} ${up.dead[2]}, ${up.dead[0].toFixed(1)} m one step up; VBBL 3.3.1.9.(5), D1 to 6.5 m)`;    
    stop = { rule, text: `stopped at ${last.MW.toFixed(2)} MW by ${rule.startsWith('travel') ? '' : 'the '}${rule}, stepping back 0.05 MW at a time (${byLine ? `at the ${limit}` : 'at the cap'}, ${s0.MW.toFixed(2)} MW: ${whyc})` }; }
  const Gd = geomAt(F, last.d), pl = last._pl;
  return { MW: last.MW, d: last.d, dc: last.dc, hall: last.hall, steps, stop, G: Gd, plant: pl.hand ? null : pl, order: pl.order || null };
}
const api = { run, geomAt: geomAtRaw, hallArea, dcArea, exits, drawn, travel, CAP, HPM };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.growyard = api; }
})(typeof window !== 'undefined' ? window : null);
