 
(function (root) {
'use strict';

 
const T = x => !(x == null || x === false || x === 0 || x === '' || (Array.isArray(x) && !x.length) || (typeof x === 'object' && !Array.isArray(x) && !Object.keys(x).length));
const get = (G, k, d) => (G[k] === undefined || G[k] === null) ? d : G[k];
const isRect = s => s.length === 4 && s.every(v => typeof v === 'number');
const f1 = x => (Math.round(x * 10 + (x >= 0 ? 1e-9 : -1e-9)) / 10).toFixed(1);   
const pyRound1 = x => Number(pyFixed(x, 1)), pyRound2 = x => Number(pyFixed(x, 2));   
function pyRoundInt(x) { const f = Math.floor(x), d = x - f; return d > 0.5 ? f + 1 : d < 0.5 ? f : (f % 2 === 0 ? f : f + 1); }   
const pyList = a => '[' + a.map(s => `'${s}'`).join(', ') + ']';
const storeys = G => Object.keys(G.S).map(Number).sort((a, b) => a - b);
const roomsOf = (G, st) => G.S[String(st)] || [];
const hyp = Math.hypot;
 
function twoProd(a, b) { const p = a * b, S = 134217729, ah = a * S - (a * S - a), al = a - ah, bh = b * S - (b * S - b), bl = b - bh; return [p, ((ah * bh - p) + ah * bl + al * bh) + al * bl]; }
function twoSum(a, b) { const s = a + b, bb = s - a; return [s, (a - (s - bb)) + (b - bb)]; }
function pyHypot(x, y) {
  x = Math.abs(x); y = Math.abs(y); if (x === 0) return y; if (y === 0) return x; if (!isFinite(x) || !isFinite(y)) return Infinity;
  const [px, ex] = twoProd(x, x), [py_, ey] = twoProd(y, y), [s, es] = twoSum(px, py_), lo = es + ex + ey, [hi, lo2] = twoSum(s, lo);
  let r = Math.sqrt(hi); const [rr, er] = twoProd(r, r); r += ((hi - rr) - er + lo2) / (2 * r); return r;
}
const minOf = (a, f) => { let m = Infinity; for (const x of a) { const v = f(x); if (v < m) m = v; } return m; }, maxOf = (a, f) => { let m = -Infinity; for (const x of a) { const v = f(x); if (v > m) m = v; } return m; };

 
const LINE = { lobby: 'P', pcor: 'P', ccor: 'P', pcore: 'P', proom: 'P', croom: 'P', exitpas: null,
  scor: 'S', score: 'S', sroom: 'S', hall: 'S', dock: 'S', bay: 'S', entry: 'S', plant: 'X', shaft: 'X', spare: null };
const CIRC = new Set(['lobby', 'pcor', 'ccor', 'pcore', 'scor', 'score', 'exitpas']);
const HALL_OK = /\bups\b|battery|electrical|switchgear|\bmv\b|transformer room|suppression|cylinder|clean agent|heat[- ]recovery/;
const PROOM_OK = /\bwcs?\b|washroom|toilet|shower|\bcot\b|first aid/;
function kind(x, st) {
  const i = x.id, g = x.g, n = x.n.toLowerCase();
  if (g === 'hall') return 'hall';
  if (i.startsWith('lob')) return 'lobby';
  if (i === 'cor') return 'pcor';
  if (i === 'ccor') return 'ccor';
  if (['dcor', 'scor', 'xcor', 'ecor', 'link'].includes(i)) return 'scor';
  if (i === 'pas' || i === 'rst' || i.startsWith('pas')) return 'exitpas';
  if (['psh', 'sh1', 'sh2', 'ris3'].includes(i) || n.includes('shaft')) return 'shaft';
  if (x.core || x.stair) return g === 'circ' ? 'pcore' : 'score';
  if (i === 'ves') return 'entry';
  if (i === 'dock' || i === 'lv') return 'dock';
  if (g === 'load') return i !== 'aisle' ? 'bay' : 'shaft';
  if (g === 'plant') return 'plant';
  if (g === 'spare') return 'spare';
  if (g === 'pub' || g === 'grow') return 'proom';    
  if (g === 'clin') return 'croom';
  return 'sroom';
}

 
const ROUTE_W = 1.1, GRID = 0.25;
function inShape(sh, x, y) {
  if (isRect(sh)) return sh[0] < x && x < sh[1] && sh[2] < y && y < sh[3];
  let c = false; const n = sh.length;
  for (let i = 0; i < n; i++) { const [x1, y1] = sh[i], [x2, y2] = sh[(i + 1) % n]; if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) c = !c; }
  return c;
}
function outsidePoint(G, st, u, v, o, d = 0.3) {
  const pts = o === 'v' ? [[u + d, v], [u - d, v]] : [[u, v + d], [u, v - d]];
  for (const p of pts) if (!roomsOf(G, st).some(x => x.r.some(r => r[0] < p[0] && p[0] < r[1] && r[2] < p[1] && p[1] < r[3]))) return p;
  return pts[0];
}
function dcGround(G, p) {
  if (get(G, 'WALK', []).some(w => inShape(w, p[0], p[1]))) return false;
  return get(G, 'DCSPACE', []).some(s => inShape(s, p[0], p[1]));
}
function truckRoutes(G) {
  const TR = get(G, 'TRUCK_ROUTES', null);
  if (TR !== null) return Object.assign({}, TR);
  const o = {}; for (const k of ['DRIVE', 'APRON', 'AISLE', 'COURT', 'YARD_AISLE']) if (T(get(G, k, null))) o[k] = G[k];
  return o;
}
function shapesTruck(G) {
  const S = (get(G, 'DCSPACE', []) || []).slice();
  S.push(...Object.values(truckRoutes(G)), ...(get(G, 'PLANT_YARDS', []) || []), ...(get(G, 'TRUCK_GROUND', []) || []));
  for (const x of roomsOf(G, 1)) if (x.g === 'load') S.push(...x.r);
  return S;
}
function segD(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = L === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return hyp(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
 
function edt(free, nu, nv) {
  const INF = 1e20, g = new Float64Array(nu * nv), out = new Float64Array(nu * nv);
  const f = new Float64Array(Math.max(nu, nv)), d = new Float64Array(Math.max(nu, nv)), vv = new Int32Array(Math.max(nu, nv)), z = new Float64Array(Math.max(nu, nv) + 1);
  function pass(n) {
    let k = 0; vv[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s;
      while (true) { const p = vv[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k] && k > 0) k--; else break; }
      if (s <= z[k]) { vv[0] = q; z[0] = -INF; z[1] = INF; k = 0; continue; }
      k++; vv[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = vv[k]; d[q] = (q - p) * (q - p) + f[p]; }
  }
  for (let j = 0; j < nv; j++) { for (let i = 0; i < nu; i++) f[i] = free[i * nv + j] ? INF : 0; pass(nu); for (let i = 0; i < nu; i++) g[i * nv + j] = d[i]; }
  for (let i = 0; i < nu; i++) { for (let j = 0; j < nv; j++) f[j] = g[i * nv + j]; pass(nv); for (let j = 0; j < nv; j++) out[i * nv + j] = free[i * nv + j] ? Math.sqrt(d[j]) : 0; }
  return out;
}
const GRIDCACHE = new Map();
function grid(G, st, avoidTruck, extraBlock) {
  const key = JSON.stringify([st, avoidTruck, extraBlock, G.LOTPOLY, roomsOf(G, st).map(x => x.r), avoidTruck ? shapesTruck(G) : null, get(G, 'WALK', null)]);
  if (GRIDCACHE.has(key)) return GRIDCACHE.get(key);
  const lot = G.LOTPOLY, us = lot.map(p => p[0]), vs = lot.map(p => p[1]);
  const u0 = Math.min(...us) - 2.0, v0 = Math.min(...vs) - 2.0;
  const nu = Math.trunc((Math.max(...us) + 2.0 - u0) / GRID) + 1, nv = Math.trunc((Math.max(...vs) + 2.0 - v0) / GRID) + 1;
  const cu = i => u0 + (i + 0.5) * GRID, cv = j => v0 + (j + 0.5) * GRID;
  const N = nu * nv;
  function mask(sh) {
    const m = new Uint8Array(N);
    if (isRect(sh)) { for (let i = 0; i < nu; i++) { const U = cu(i); if (!(U > sh[0] && U < sh[1])) continue; for (let j = 0; j < nv; j++) { const V = cv(j); if (V > sh[2] && V < sh[3]) m[i * nv + j] = 1; } } return m; }
    const n = sh.length;
    for (let e = 0; e < n; e++) {
      const [x1, y1] = sh[e], [x2, y2] = sh[(e + 1) % n]; if (y1 === y2) continue;
      for (let j = 0; j < nv; j++) { const V = cv(j); if ((y1 > V) === (y2 > V)) continue; const X = (x2 - x1) * (V - y1) / (y2 - y1) + x1; for (let i = 0; i < nu; i++) if (cu(i) < X) m[i * nv + j] ^= 1; }
    }
    return m;
  }
  const free = mask(lot);
  for (const x of roomsOf(G, st)) for (const r of x.r) { const m = mask(r); for (let k = 0; k < N; k++) if (m[k]) free[k] = 0; }
  if (avoidTruck) {
    const tg = new Uint8Array(N);
    for (const sh of shapesTruck(G)) { const m = mask(sh); for (let k = 0; k < N; k++) if (m[k]) tg[k] = 1; }
    for (const w of (get(G, 'WALK', []) || [])) { const m = mask(w); for (let k = 0; k < N; k++) if (m[k]) tg[k] = 0; }
    for (let k = 0; k < N; k++) if (tg[k]) free[k] = 0;
  }
  for (const sh of extraBlock) { const m = mask(sh); for (let k = 0; k < N; k++) if (m[k]) free[k] = 0; }
  const D = edt(free, nu, nv), clear = new Float64Array(N); for (let k = 0; k < N; k++) clear[k] = D[k] * GRID;
  const out = { u0, v0, nu, nv, free, clear, cu, cv };
  GRIDCACHE.set(key, out); return out;
}
function dcRoute(G, st, u, v, o, opt) {
  opt = opt || {}; const avoidTruck = opt.avoid_truck !== false, extraBlock = opt.extra_block || [], start = opt.start || null;
  const edges = get(G, 'STREET_EDGES', null);
  if (avoidTruck && !shapesTruck(G).length) return [true, 'no truck ground on the lot'];
  if (!T(edges)) return [false, 'STREET_EDGES not declared: the route to a street or lane cannot be judged'];
  const p = start || outsidePoint(G, st, u, v, o);
  const dmin = Math.min(...edges.map(([a, b]) => segD(p, a, b)));
  if (dmin <= 1.0) return [true, `discharges at the street or lane (${f1(dmin)} m)`];
  const g = grid(G, st, avoidTruck, extraBlock), { nu, nv, free, clear, u0, v0, cu, cv } = g;
  const half = ROUTE_W / 2 - GRID / 2, ok = new Uint8Array(nu * nv);
  for (let k = 0; k < nu * nv; k++) ok[k] = free[k] && clear[k] >= half ? 1 : 0;
  const i0 = Math.trunc((p[0] - u0) / GRID), j0 = Math.trunc((p[1] - v0) / GRID), R = Math.trunc(1.2 / GRID) + 1, starts = [];
  for (let i = Math.max(0, i0 - R); i < Math.min(nu, i0 + R + 1); i++)
    for (let j = Math.max(0, j0 - R); j < Math.min(nv, j0 + R + 1); j++)
      if (ok[i * nv + j] && (cu(i) - p[0]) ** 2 + (cv(j) - p[1]) ** 2 <= 1.44) starts.push(i * nv + j);
  if (!starts.length) return [false, `no clear ground ≥ ${ROUTE_W.toFixed(1)} m outside the door (truck ground, building or lot line)`];
  const tgt = new Uint8Array(nu * nv);
  for (const [a, b] of edges) {
    const lu = Math.min(a[0], b[0]) - 2, hu = Math.max(a[0], b[0]) + 2, lv = Math.min(a[1], b[1]) - 2, hv = Math.max(a[1], b[1]) + 2;
    for (let i = 0; i < nu; i++) { const U = cu(i); if (U < lu || U > hu) continue; for (let j = 0; j < nv; j++) { const V = cv(j); if (V < lv || V > hv) continue; if (segD([U, V], a, b) <= 1.0 + ROUTE_W / 2) tgt[i * nv + j] = 1; } }
  }
  const seen = new Uint8Array(nu * nv), q = starts.slice(); for (const s of starts) seen[s] = 1;
  for (let h = 0; h < q.length; h++) {
    const k = q[h]; if (tgt[k]) return [true, avoidTruck ? `clear route ≥ ${ROUTE_W.toFixed(1)} m to a street or lane, off truck ground` : 'clear route to a street or lane'];
    const i = Math.floor(k / nv), j = k % nv;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj; if (a < 0 || a >= nu || b < 0 || b >= nv) continue; const n = a * nv + b;
      if (ok[n] && !seen[n]) { seen[n] = 1; q.push(n); }
    }
  }
  return [false, avoidTruck ? `no route ≥ ${ROUTE_W.toFixed(1)} m to a street or lane that stays off truck ground (drive, court, apron, bays, plant yard) except on a fenced walkway` : 'no route to a street or lane'];
}

 
function reach(G, opt) {
  const SERVES = !!(opt && opt.serves);
  const nodes = new Map(), K = new Map(), key = (st, i) => st + '|' + i;
  for (const st of storeys(G)) for (const x of roomsOf(G, st)) { const k = key(st, x.id); nodes.set(k, { st, id: x.id, x }); K.set(k, kind(x, st)); }
  const adj = new Map(), ext = new Map(), A = k => { if (!adj.has(k)) adj.set(k, new Set()); return adj.get(k); }, E = k => { if (!ext.has(k)) ext.set(k, new Set()); return ext.get(k); };
  for (const d of G.D) {
    const st = d[0], a = d[1], b = d[2];
    if (b === 'OUT' || b === 'YARD' || b === 'IN') { E(key(st, a)).add(b); continue; }    
    if (nodes.has(key(st, a)) && nodes.has(key(st, b))) { A(key(st, a)).add(key(st, b)); A(key(st, b)).add(key(st, a)); }
  }
  for (const [k, nd] of nodes) if (['pcore', 'score'].includes(K.get(k)) && nodes.has(key(nd.st + 1, nd.id))) { A(k).add(key(nd.st + 1, nd.id)); A(key(nd.st + 1, nd.id)).add(k); }
  const adjOf = k => adj.get(k) || new Set(), extOf = k => ext.get(k) || new Set();
  const out = [], node = k => [nodes.get(k).st, nodes.get(k).id];
  function touch(a, b) {
    for (const r of a.r) for (const q of b.r) {
      const ou = Math.min(r[1], q[1]) - Math.max(r[0], q[0]), ov = Math.min(r[3], q[3]) - Math.max(r[2], q[2]);
      if ((Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(q[1] - r[0]) < 1e-6) && ov > 0.5) return true;
      if ((Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(q[3] - r[2]) < 1e-6) && ou > 0.5) return true;
    }
    return false;
  }
  function baychain(n) {
    const seen = new Set([n]), q = [n];
    while (q.length) {
      const c = q.pop();
      for (const m of nodes.keys()) {
        if (nodes.get(m).st !== nodes.get(c).st || seen.has(m) || !touch(nodes.get(c).x, nodes.get(m).x)) continue;
        if (K.get(m) === 'dock') return true;
        if (K.get(m) === 'bay') { seen.add(m); q.push(m); }
      }
    }
    return false;
  }
  const line = new Map();
  for (const n of nodes.keys()) {
    let l = LINE[K.get(n)];
    if (l === null || l === undefined) { l = '?'; for (const m of adjOf(n)) { const lm = LINE[K.get(m)]; if (lm && 'PS'.includes(lm)) { l = lm; break; } } }
    line.set(n, l);
  }
  const E6 = 1e-6;
  function onwall(x, u, v, o, side) {
    for (const r of x.r) {
      if (o === 'v' && r[2] - E6 <= v && v <= r[3] + E6 && ((side >= 0 && Math.abs(r[1] - u) < E6) || (side <= 0 && Math.abs(r[0] - u) < E6))) return Math.abs(r[1] - u) < E6 ? 1 : -1;
      if (o === 'h' && r[0] - E6 <= u && u <= r[1] + E6 && ((side >= 0 && Math.abs(r[3] - v) < E6) || (side <= 0 && Math.abs(r[2] - v) < E6))) return Math.abs(r[3] - v) < E6 ? 1 : -1;
    }
    return 0;
  }
  for (const d of G.D) {
    const [st, a, b, u, v, o] = d, ka = key(st, a);
    if (!nodes.has(ka)) { out.push(['R0', [st, a], 'door names a missing room']); continue; }
    const sa = onwall(nodes.get(ka).x, u, v, o, 0);
    if (!sa) { out.push(['R0', [st, a], `door to ${b} at (${u}, ${v}) is not on its wall`]); continue; }
    if (b === 'OUT' || b === 'YARD') {
      const same = [...nodes.values()].filter(n => n.st === st);
      if (same.some(n => n.id !== a && n.x.g !== 'load' && onwall(n.x, u, v, o, -sa) === -sa)) out.push(['R0', [st, a], `exterior door at (${u}, ${v}) opens into another room`]);
      if (line.get(ka) === 'P' && same.some(n => n.x.g === 'load' && onwall(n.x, u, v, o, -sa) === -sa)) out.push(['R2', [st, a], `public exit at (${u}, ${v}) opens into a loading bay or truck aisle (secure line)`]);
      if (line.get(ka) === 'P') {
        if (dcGround(G, outsidePoint(G, st, u, v, o))) out.push(['R2', [st, a], `public exit at (${u}, ${v}) discharges into data-centre ground (drive, court or plant yard) with no walkway`]);
        else { const [ok, why] = dcRoute(G, st, u, v, o); if (!ok) out.push(['R2', [st, a], `public exit at (${u}, ${v}): ${why}`]); }
      }
    } else if (nodes.has(key(st, b)) && onwall(nodes.get(key(st, b)).x, u, v, o, -sa) !== -sa) out.push(['R0', [st, a], `door to ${b} at (${u}, ${v}) is not on a shared wall`]);
    if (b !== 'OUT' && b !== 'YARD' && nodes.has(key(st, b))) {
      const hw = (d.length > 6 ? d[6] : 0.9) / 2, ends = o === 'v' ? [[u, v - hw], [u, v + hw]] : [[u - hw, v], [u + hw, v]];
      if (!ends.every(([eu, ev]) => onwall(nodes.get(ka).x, eu, ev, o, sa) === sa && onwall(nodes.get(key(st, b)).x, eu, ev, o, -sa) === -sa))
        out.push(['R0', [st, a], `door to ${b} at (${u}, ${v}) runs past the shared wall`]);
    }
  }
  for (const n of nodes.keys()) { if (K.get(n) === 'shaft' || K.get(n) === 'bay') continue; if (!adjOf(n).size && !extOf(n).size) out.push(['R1', node(n), 'no door']); }
  const lt = (n, m) => { const A1 = nodes.get(n), B1 = nodes.get(m); return A1.st !== B1.st ? A1.st < B1.st : A1.id < B1.id; };
  for (const n of nodes.keys()) for (const m of adjOf(n)) { const s = new Set([line.get(n), line.get(m)]); if (s.size === 2 && s.has('P') && s.has('S') && lt(n, m)) out.push(['R2', node(n), `door to ${nodes.get(m).id} crosses the secure line`]); }
  function reachFrom(starts, L) {
    const seen = new Set(starts), q = starts.slice();
    for (let h = 0; h < q.length; h++) {
      const n = q[h];
      for (const m of adjOf(n)) {
        if (seen.has(m) || line.get(m) !== L) continue;
        if (nodes.get(m).x.stair && nodes.get(m).st !== nodes.get(n).st) continue;
        if (['pcore', 'score'].includes(K.get(m)) && nodes.get(m).x.stair) continue;
        seen.add(m); q.push(m);
      }
    }
    return seen;
  }
  const lob = [...nodes.keys()].filter(n => K.get(n) === 'lobby' && extOf(n).has('OUT'));
  const ent = [...nodes.keys()].filter(n => K.get(n) === 'entry' && extOf(n).size);
  if (!lob.length) out.push(['R6', null, 'no lobby with a street door']);
  if (!ent.length) out.push(['R4', null, 'no data-centre staff entrance with an outside door']);
  const P = reachFrom(lob, 'P'), S_ = reachFrom(ent, 'S');
  for (const n of nodes.keys()) {
    const k = K.get(n), x = nodes.get(n).x;
    if (k === 'shaft' || k === 'plant' || (['pcore', 'score'].includes(k) && x.stair) || k === 'exitpas') continue;
    if (line.get(n) === 'P' && !P.has(n) && !x.staffOnly) out.push(['R3', node(n), 'not reached step-free from the lobby street door']);    
    if (line.get(n) === 'S' && !S_.has(n) && k !== 'bay') out.push(['R4', node(n), 'not reached step-free from the staff entrance']);
  }
  const ids = s => pyList([...s].map(m => nodes.get(m).id).sort());
  const nm = m => nodes.get(m).x.n.toLowerCase(), offcirc = m => [...adjOf(m)].some(z => CIRC.has(K.get(z)));
  for (const n of nodes.keys()) {
    const k = K.get(n), x = nodes.get(n).x, Aa = adjOf(n);
    if (CIRC.has(k) || ['shaft', 'hall', 'entry', 'dock'].includes(k)) continue;
    if (x.staffOnly) continue;    
    if (k === 'plant') { if (!(extOf(n).size || [...Aa].some(m => ['pcor', 'ccor', 'lobby'].includes(K.get(m))))) out.push(['R5', node(n), 'plant room not off the exterior or the public corridor']); continue; }
    if (k === 'bay') {
      if ([...Aa].some(m => CIRC.has(K.get(m))) || baychain(n)) continue;
      const bw = Math.min(...x.r.map(r => Math.min(r[1] - r[0], r[3] - r[2])));
      if (G.D.some(d => d[0] === nodes.get(n).st && d[1] === x.id && d[2] === 'OUT' && (d.length > 6 ? d[6] : 0.9) >= bw - 0.01)) continue;
      out.push(['R5', node(n), `reached only through ${ids(Aa)}`]); continue;
    }
    const nmn = x.n.toLowerCase();
    if (SERVES && Aa.size === 1 && k === 'proom') {
      const p0 = [...Aa][0];
      if (K.get(p0) === 'proom' && offcirc(p0) && ((nmn.includes('stor') && !nmn.includes('staff')) || (nmn.includes('staff') && /\bwcs?\b|washroom|toilet/.test(nmn)))) continue;
      if (nmn.includes('growing house') && nm(p0).includes('headhouse') && offcirc(p0)) continue;
    }
    if (k === 'proom') {
      if ([...Aa].some(m => ['pcor', 'ccor', 'lobby'].includes(K.get(m)))) continue;
      const par = [...Aa].filter(m => K.get(m) === 'proom' && /refuge|shelter/.test(nm(m)) && [...adjOf(m)].some(z => ['pcor', 'ccor', 'lobby'].includes(K.get(z))));
      if (par.length && PROOM_OK.test(nmn)) continue;
      out.push(['R5', node(n), `(15a: public rooms open off the public corridor or lobby; only WCs, showers, cot storage and first aid may open off the refuge or shelter they serve) reached only through ${ids(Aa)}`]); continue;
    }
    if (k === 'croom') {
      if ([...Aa].some(m => K.get(m) === 'ccor')) continue;
      if (nmn.includes('waiting') && [...Aa].some(m => ['pcor', 'lobby'].includes(K.get(m)))) continue;
      out.push(['R5', node(n), `(15a: clinic rooms open off the clinic corridor) reached only through ${ids(Aa)}`]); continue;
    }
    if (k === 'sroom') {
      if ([...Aa].some(m => K.get(m) === 'scor')) continue;
      if (HALL_OK.test(nmn) && [...Aa].some(m => K.get(m) === 'hall')) continue;
      if (nmn.includes('shipping') && [...Aa].some(m => K.get(m) === 'dock' || (K.get(m) === 'score' && !nodes.get(m).x.stair))) continue;
      out.push(['R5', node(n), `(15a: secure rooms open off the secure corridor; off the hall only rooms serving it alone, shipping off E2 or the dock) reached only through ${ids(Aa)}`]); continue;
    }
    if (k === 'spare') {
      if ([...Aa].some(m => ['pcor', 'ccor', 'scor'].includes(K.get(m)))) continue;
      out.push(['R5', node(n), `(15a: unassigned floor opens off one corridor, never through another room) reached only through ${ids(Aa)}`]); continue;
    }
    if ([...Aa].some(m => CIRC.has(K.get(m)))) continue;
    out.push(['R5', node(n), `reached only through ${ids(Aa)}`]);
  }
  for (const l of lob) if (![...adjOf(l)].some(m => K.get(m) === 'pcor')) out.push(['R6', node(l), 'lobby does not touch the public corridor']);
  for (const [use, spec] of Object.entries(get(G, 'CAPS', {}))) {
    const a = capArea(G, use), cap = spec[1];
    if (a > cap + 1e-6) out.push(['R8', null, `${use} ${f1(a)} m2 over the ${cap} m2 cap per establishment`]);
  }
  const Kout = {}; for (const [k, v] of K) Kout[k] = v;
  return { out, K: Kout };
}
const rArea = r => (r[1] - r[0]) * (r[3] - r[2]);
function cappedArea(G, groups) { let s = 0; for (const st of storeys(G)) for (const x of roomsOf(G, st)) if (groups.includes(x.g)) for (const r of x.r) s += rArea(r); return s; }
function capArea(G, use, detail) {
  const C = G.CAPS[use], groups = C[0], spec = C.length > 2 ? C[2] : {};
  const area = (gs, idset) => { let s = 0; for (const st of storeys(G)) for (const x of roomsOf(G, st)) if (gs.includes(x.g) || idset.has(x.id)) for (const r of x.r) s += rArea(r); return s; };
  const own = area(groups, new Set(spec.own || []));
  const shared = new Set(spec.shared || []); let sh = 0; for (const st of storeys(G)) for (const x of roomsOf(G, st)) if (shared.has(x.id)) for (const r of x.r) sh += rArea(r);
  let oth = 0; for (const [g, i] of (spec.others || [])) oth += area(g, new Set(i));
  const tot = own + (own + oth > 0 ? sh * own / (own + oth) : 0.0);
  return detail ? [tot, own, sh, oth] : tot;
}

 
function portal(G) {
  const P = get(G, 'PORTAL', null), H = get(G, 'EXIT_HW', null);
  if (!T(P) || !T(H)) return ['fail', 'no portal or exit-hardware door declared', false];
  const eq5 = (a, b) => a.slice(0, 5).every((v, i) => v === b[i]);
  const door = G.D.find(d => eq5(d, H[0][0]));
  if (!door) return ['fail', 'the exit-hardware door is not drawn', false];
  if (eq5(door, P)) return ['fail', 'the exit-hardware door is the portal itself', false];
  const same = new Set([door[1], door[2]]).size === new Set([P[1], P[2]]).size && [door[1], door[2]].every(z => z === P[1] || z === P[2]) && [P[1], P[2]].every(z => z === door[1] || z === door[2]);
  const gap = hyp(door[3] - P[3], door[4] - P[4]), w = door.length > 6 ? door[6] : 0.9;
  const probs = (same ? [] : ['joins other rooms than the portal']).concat(gap <= 3.0 + 1e-6 ? [] : [`${f1(gap)} m from the portal (> 3.0)`]).concat(w >= 0.9 - 1e-6 ? [] : [`${w.toFixed(2)} m wide (< 0.9)`]);
  const txt = `exit door beside the portal (${P[1]}–${P[2]}), ${f1(w)} m wide, ${f1(gap)} m from it [script]; hardware: ${H[0][1]}: check in design` + (probs.length ? `; FAILS: ${probs.join('; ')}` : '');
  return [probs.length ? 'fail' : 'tight', txt, !probs.length];
}

 
const YW = 1.1, YTIGHT = 0.5;
function insideP(p, P) { let c = false; const n = P.length; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i - 1 + n) % n]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function edgeD(p, P) { let m = Infinity; for (let i = 0; i < P.length; i++) m = Math.min(m, segD(p, P[(i - 1 + P.length) % P.length], P[i])); return m; }
function rectD(p, r) { const dx = Math.max(r[0] - p[0], 0, p[0] - r[1]), dy = Math.max(r[2] - p[1], 0, p[1] - r[3]); return hyp(dx, dy); }
function gseg(g) { return g.length > 3 && g[3] === 'v' ? [[g[0], g[1]], [g[0], g[2]]] : [[g[0], g[2]], [g[1], g[2]]]; }
function within(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; return t >= -1e-6 && t <= 1 + 1e-6; }
function yards(G) {
  const Y = get(G, 'PLANT_YARDS', null);
  if (Y === null) throw new Error('PLANT_YARDS not declared (project decision, 10 Nov: the plant yard is an explicit field per fit)');
  return Y.map(P => isRect(P) ? [[P[0], P[2]], [P[1], P[2]], [P[1], P[3]], [P[0], P[3]]] : P.slice());
}
function yardgate(G) {
  const out = { gates: [], doors: [], vgates: [] }, Ys = yards(G);
  for (const P of Ys) { const o = judge(G, P); for (const k of Object.keys(out)) out[k].push(...(o[k] || [])); }
  for (const g of get(G, 'GATES', [])) {
    const [a, b] = gseg(g);
    if (!Ys.some(P => Math.max(edgeD(a, P), edgeD(b, P)) < 0.05)) out.gates.push({ gate: g, width: pyRound2(hyp(a[0] - b[0], a[1] - b[1])), on_fence: false, in_walkway: null, status: 'fail' });
  }
  resolve(G, out); return out;
}
function judge(G, P) {
  const out = { gates: [], doors: [] };
  const gates = get(G, 'GATES', []).filter(g => Math.max(edgeD(gseg(g)[0], P), edgeD(gseg(g)[1], P)) < 0.05);
  for (const g of gates) {
    const [a, b] = gseg(g), w = hyp(a[0] - b[0], a[1] - b[1]);
    const on = Math.max(edgeD(a, P), edgeD(b, P), edgeD([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], P)) < 0.05;
    const pts = []; for (let i = 0; i <= 10; i++) pts.push([a[0] + (b[0] - a[0]) * i / 10, a[1] + (b[1] - a[1]) * i / 10]);
    const trucks = (get(G, 'WALK', []) || []).slice(); for (const k of ['DRIVE', 'APRON', 'AISLE']) if (T(get(G, k, null))) trucks.push(G[k]);
    const walk = pts.some(q => trucks.some(r => rectD(q, r) < -1e-9 || (r[0] < q[0] && q[0] < r[1] && r[2] < q[1] && q[1] < r[3])));
    let st = (w < YW - 1e-6 || !on || walk) ? 'fail' : (w < YW + YTIGHT - 1e-6 ? 'tight' : 'pass'), why = null;
    if (st !== 'fail') {
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], vert = g.length > 3 && g[3] === 'v';
      const cand = vert ? [[mid[0] + 0.6, mid[1]], [mid[0] - 0.6, mid[1]]] : [[mid[0], mid[1] + 0.6], [mid[0], mid[1] - 0.6]];
      const Yall = yards(G), outp = cand.filter(q => !Yall.some(Q => insideP(q, Q)));
      if (!outp.length) { st = 'fail'; why = 'gate does not open out of the yards'; }
      else {
        const [ok, w2] = dcRoute(G, 1, mid[0], mid[1], vert ? 'v' : 'h', { avoid_truck: false, extra_block: Yall, start: outp[0] });
        if (!ok) { st = 'fail'; why = 'gate does not lead to a street or lane: ' + w2; }
      }
    }
    out.gates.push(Object.assign({ gate: g, width: pyRound2(w), on_fence: on, in_walkway: walk, status: st }, why ? { why } : {}));
  }
  out.vgates = [];
  const vg = get(G, 'VGATES', []), fence = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[(i - 1 + P.length) % P.length], b = P[i], n = Math.max(1, Math.trunc(hyp(a[0] - b[0], a[1] - b[1]) / 0.1));
    for (let j = 0; j < n; j++) fence.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
  }
  const TR = truckRoutes(G), ENT = get(G, 'TRUCK_ENTRIES', {}), VIA = get(G, 'TRUCK_VIA', {}), ALONG = new Set(get(G, 'TRUCK_ALONG', []));
  for (const [k, r] of Object.entries(TR)) {
    const RP = isRect(r) ? [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]] : r.slice();
    const touch = fence.filter(q => insideP(q, RP) || edgeD(q, RP) <= 0.05);
    if (!touch.length) continue;
    const inner = fence.filter(q => insideP(q, RP) && edgeD(q, RP) > 0.05);
    const ent = [];
    for (const [a, b] of (ENT[k] || [])) for (let j = 0; j <= 50; j++) { const q = [a[0] + (b[0] - a[0]) * j / 50, a[1] + (b[1] - a[1]) * j / 50]; if (edgeD(q, P) < 0.1) ent.push(q); }
    const Lt = pyRound1(0.1 * touch.length);
    if (ALONG.has(k) || k in VIA) {
      if (inner.length) out.vgates.push({ route: k, crossing_points: inner.length, uncovered_m: null, status: 'fail', why: `declared ${ALONG.has(k) ? 'along the fence' : 'reached via ' + String(VIA[k])} but crosses the yard fence` });
      else out.vgates.push({ route: k, crossing_points: 0, uncovered_m: 0.0, status: 'pass', why: ALONG.has(k) ? 'runs along the fence, no entry (declared)' : `reached via ${VIA[k]} (declared)` });
      continue;
    }
    const cr = inner.concat(ent);
    if (!cr.length) { out.vgates.push({ route: k, crossing_points: 0, uncovered_m: Lt, status: 'fail', why: `meets the plant-yard fence over ${Lt} m and nothing is declared (TRUCK_ENTRIES with VGATES, TRUCK_VIA or TRUCK_ALONG)` }); continue; }
    const unc = cr.filter(q => !vg.some(([a, b]) => segD(q, a, b) < 0.06)), L = unc.length ? 0.1 * unc.length : 0.0;
    const st = !unc.length ? 'pass' : (L <= 0.5 + 1e-6 ? 'tight' : 'fail');
    out.vgates.push({ route: k, crossing_points: cr.length, uncovered_m: pyRound2(L), status: st, why: !unc.length ? 'vehicle gate spans the crossing' : `${pyRound1(L)} m of the crossing without a vehicle gate` });
  }
  const S1 = roomsOf(G, 1), K = {}, grp = {}; for (const x of S1) { K[x.id] = kind(x, 1); grp[x.id] = x.g; }
  const plant = G.PLANT.map(x => x.r), bld = []; for (const x of S1) bld.push(...x.r);
  function free(p, half, near, s) {
    if (!insideP(p, P)) return false;
    if (plant.some(r => rectD(p, r) < half)) return false;
    const atDoor = s != null && hyp(p[0] - s[0], p[1] - s[1]) < 1.0;
    if (!atDoor && bld.some(r => rectD(p, r) < half)) return false;
    if (bld.some(r => rectD(p, r) < 0.05)) return false;
    if (edgeD(p, P) < half && !near(p)) return false;
    return true;
  }
  const g0 = 0.25;
  for (const d of G.D) {
    if (d[0] !== 1 || !['OUT', 'YARD'].some(z => z === d[1] || z === d[2])) continue;
    const room = (d[2] === 'OUT' || d[2] === 'YARD') ? d[1] : d[2];
    const side = [];
    for (const sg of [1, -1]) {
      for (let i = 0; i < 15; i++) {
        const dist = 0.6 + 0.1 * i, q = d[5] === 'v' ? [d[3] + sg * dist, d[4]] : [d[3], d[4] + sg * dist];
        if (insideP(q, P)) { side.push(q); break; }
        if (S1.some(x => x.g !== 'load' && x.r.some(r => r[0] < q[0] && q[0] < r[1] && r[2] < q[1] && q[1] < r[3]))) break;
        if ((get(G, 'WALK', []) || []).some(w => w[0] < q[0] && q[0] < w[1] && w[2] < q[1] && q[1] < w[3])) break;
      }
      if (side.length) break;
    }
    if (!side.length) continue;
    const k = K[room], gname = grp[room];
    const pub = ['pub', 'grow', 'clin', 'circ'].includes(gname) || ['lobby', 'pcor', 'ccor', 'proom', 'croom'].includes(k);
    const rec = { door: [room, d[3], d[4]], kind: k === undefined ? null : k, group: gname === undefined ? null : gname };
    if (pub) { Object.assign(rec, { status: 'fail', why: 'public or clinic door into the plant yard (rule 6)' }); out.doors.push(rec); continue; }
    const s = side[0];
    if (S1.some(x => x.g === 'load' && x.r.some(r => rectD(s, r) < 0.3))) { Object.assign(rec, { status: 'pending', loading: true, d }); out.doors.push(rec); continue; }
    if (!gates.length) { Object.assign(rec, { status: 'fail', why: 'no gate to the street drawn (Q24)' }); out.doors.push(rec); continue; }
    const gs = gates.map(gseg);
    const near = p => hyp(p[0] - s[0], p[1] - s[1]) < 1.0 || gs.some(([a, b]) => segD(p, a, b) < 1.0);
    function route(width) {
      const half = width / 2, st0 = [pyRoundInt(s[0] / g0), pyRoundInt(s[1] / g0)], K0 = c => c[0] + ',' + c[1];
      const D = new Map([[K0(st0), 0.0]]), heap = [[0.0, st0[0], st0[1]]];
      const push = e => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (cmp(heap[i], heap[p]) < 0) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; } else break; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && cmp(heap[l], heap[m]) < 0) m = l; if (r < heap.length && cmp(heap[r], heap[m]) < 0) m = r; if (m === i) break; [heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } } return top; };
      function cmp(x, y) { return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; }
      while (heap.length) {
        const [dd, ci, cj] = pop(); if (dd > D.get(ci + ',' + cj)) continue;
        const p = [ci * g0, cj * g0];
        if (gs.some(([a, b]) => segD(p, a, b) <= 0.3 && within(p, a, b))) return dd;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const ni = ci + dx, nj = cj + dy, pn = [ni * g0, nj * g0], step = g0 * hyp(dx, dy), kk = ni + ',' + nj;
          if (free(pn, half, near, s) && dd + step < (D.has(kk) ? D.get(kk) : 1e9)) { D.set(kk, dd + step); push([dd + step, ni, nj]); }
        }
      }
      return null;
    }
    const L = route(YW);
    if (L === null) Object.assign(rec, { status: 'fail', why: `no ${YW} m clear route to a gate` });
    else {
      const L2 = route(YW + YTIGHT);
      Object.assign(rec, { status: L2 !== null ? 'pass' : 'tight', length: pyRound1(L), length_1_6: L2 === null ? null : pyRound1(L2), why: L2 !== null ? 'route ≥ 1.6 m' : `route only ${YW}–${pyRound1(YW + YTIGHT)} m wide somewhere` });
    }
    out.doors.push(rec);
  }
  return out;
}
function resolve(G, out) {
  const S1 = roomsOf(G, 1), K = {}; for (const x of S1) K[x.id] = kind(x, 1);
  const yardSt = new Map(); for (const r of out.doors) if (!r.loading) yardSt.set(r.door[1] + ',' + r.door[2], r.status);
  const loadids = new Set(S1.filter(x => x.g === 'load').map(x => x.id));
  const portalOk = T(get(G, 'PORTAL', null)) ? portal(G)[2] : false;
  const barred = new Set(S1.filter(x => ['pub', 'grow', 'clin', 'circ'].includes(x.g) || (K[x.id] === 'entry' && !portalOk) || x.n.toLowerCase().includes('lift') || /^e\d+$/.test(x.id)).map(x => x.id));
  const ldoors = new Set(out.doors.filter(r => r.loading).map(r => r.d[3] + ',' + r.d[4]));
  const isOut = e => ['OUT', 'YARD'].some(z => z === e[1] || z === e[2]);
  function exitsOf(rid, accept) {
    const res = [];
    for (const e of G.D) {
      if (e[0] !== 1 || !(e[1] === rid || e[2] === rid) || !isOut(e) || ldoors.has(e[3] + ',' + e[4])) continue;
      res.push([e, accept.includes(yardSt.has(e[3] + ',' + e[4]) ? yardSt.get(e[3] + ',' + e[4]) : 'pass')]);
    }
    return res;
  }
  for (const r of out.doors) {
    if (!r.loading) continue;
    const d = r.d; delete r.d; const room = r.door[0];
    const others = G.D.filter(e => e[0] === 1 && (e[1] === room || e[2] === room) && e !== d && !isOut(e) && !(loadids.has(e[1]) || loadids.has(e[2])));
    const own = exitsOf(room, ['pass', 'tight']).filter(([, ok]) => ok).map(([e]) => e);
    let found = null, prev = new Map(), acc = null;
    for (const a of [['pass'], ['pass', 'tight']]) {
      acc = a; const seen = new Set([room]), q = [room]; prev = new Map(); found = null;
      const ownOk = exitsOf(room, a).filter(([, ok]) => ok).map(([e]) => e);
      if (ownOk.length) found = [room, ownOk[0]];
      while (q.length && !found) {
        const c = q.shift();
        for (const e of G.D) {
          if (e[0] !== 1 || !(e[1] === c || e[2] === c)) continue;
          const n = e[1] === c ? e[2] : e[1];
          if (n === 'OUT' || n === 'YARD' || loadids.has(n) || seen.has(n) || barred.has(n)) continue;
          if (c === room && !others.includes(e)) continue;
          seen.add(n); prev.set(n, c); q.push(n);
          const ok = exitsOf(n, a).filter(([, g]) => g).map(([x]) => x);
          if (ok.length) { found = [n, ok[0]]; break; }
        }
      }
      if (found) break;
    }
    if (!others.length && !own.length) Object.assign(r, { status: 'fail', why: 'door onto a loading space; its room has no other door clear of the bay (project decision, 10 Nov condition)' });
    else if (!found) Object.assign(r, { status: 'fail', why: 'door onto a loading space; no route from its room to another exit that avoids the bay, public rooms, lifts and an unverified security vestibule (project decision, 10 Nov conditions)' });
    else {
      const path = [found[0]]; while (prev.has(path[0])) path.unshift(prev.get(path[0]));
      if (path[0] !== room) path.unshift(room);
      Object.assign(r, { status: acc.length === 1 ? 'pass' : 'tight', why: `loading door (${room} exits via ${path.join(' → ')} → door at (${found[1][3].toFixed(1)}, ${found[1][4].toFixed(1)}))`, exit_via: path });
    }
  }
  return out;
}

 
const STEP = 0.05, T_FIRE = 0.30, T_PART = 0.10;
function lineOf(x, st) { const k = kind(x, st); if (x.core || x.stair || ['pcore', 'score', 'shaft', 'exitpas'].includes(k)) return 'F'; return LINE[k] === undefined ? null : LINE[k]; }
 
const uniqRaw = a => { const s = [...a].sort((p, q) => p - q); return s.filter((v, i) => i === 0 || v - s[i - 1] > 1e-9); };
const uniq = a => { const s = [...a].map(v => Math.round(v * 1e9) / 1e9).sort((p, q) => p - q); return s.filter((v, i) => i === 0 || v - s[i - 1] > 1e-9); };
const inRects = (rs, p) => rs.some(r => r[0] <= p[0] && p[0] <= r[1] && r[2] <= p[1] && p[1] <= r[3]);
 
function boundary(rs) {
  const xs = uniq(rs.flatMap(r => [r[0], r[1]])), ys = uniq(rs.flatMap(r => [r[2], r[3]]));
  const inC = (i, j) => i >= 0 && j >= 0 && i < xs.length - 1 && j < ys.length - 1 && inRects(rs, [(xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2]);
  const E = [];
  for (let i = 0; i < xs.length; i++) for (let j = 0; j < ys.length - 1; j++) { const L = inC(i - 1, j), R = inC(i, j); if (L !== R) E.push({ o: 'v', c: xs[i], a: ys[j], b: ys[j + 1], ins: R ? 1 : -1 }); }
  for (let j = 0; j < ys.length; j++) for (let i = 0; i < xs.length - 1; i++) { const B = inC(i, j - 1), A = inC(i, j); if (A !== B) E.push({ o: 'h', c: ys[j], a: xs[i], b: xs[i + 1], ins: A ? 1 : -1 }); }
  E.sort((p, q) => (p.o < q.o ? -1 : p.o > q.o ? 1 : 0) || p.c - q.c || p.ins - q.ins || p.a - q.a);
  const M = [];
  for (const e of E) { const l = M[M.length - 1]; if (l && l.o === e.o && Math.abs(l.c - e.c) < 1e-9 && l.ins === e.ins && Math.abs(l.b - e.a) < 1e-9) l.b = e.b; else M.push(Object.assign({}, e)); }
  return M;
}
 
function nearPart(e, q) {
  const d = e.o === 'v' ? Math.max(q[0] - e.c, 0, e.c - q[1]) : Math.max(q[2] - e.c, 0, e.c - q[3]);
  if (d > 0.01 + 1e-12) return null;
  const ext = Math.sqrt(Math.max(0, 0.01 * 0.01 - d * d)), lo = (e.o === 'v' ? q[2] : q[0]) - ext, hi = (e.o === 'v' ? q[3] : q[1]) + ext;
  const a = Math.max(e.a, lo), b = Math.min(e.b, hi); return b > a + 1e-12 ? [a, b] : null;
}
const rectDist = (r, q) => hyp(Math.max(q[0] - r[1], 0, r[0] - q[1]), Math.max(q[2] - r[3], 0, r[2] - q[3]));
function clearGeom(x, rooms, st) {
  const rs = x.r, lx = lineOf(x, st), E = boundary(rs);
  const part = E.map(() => []), open = E.map(() => []);
  for (const y of rooms) {
    if (y === x || y.id === x.id) continue;
    const ly = lineOf(y, st), touching = y.r.some(q => rs.some(r => rectDist(r, q) <= 0.01));
    if (x.g === 'load' && y.g === 'load') { if (touching) E.forEach((e, i) => y.r.forEach(q => { const p = nearPart(e, q); if (p) open[i].push(p); })); continue; }
    if (lx === 'F' || ly === 'F') continue;
    if (['P', 'S'].includes(lx) && ['P', 'S'].includes(ly) && lx !== ly) continue;
    if (!touching) continue;
    E.forEach((e, i) => y.r.forEach(q => { const p = nearPart(e, q); if (p) part[i].push(p); }));
  }
  const inAny = (iv, t) => iv.some(([a, b]) => t >= a - 1e-12 && t <= b + 1e-12);
   
  const pieces = [];
  E.forEach((e, i) => {
    const cuts = uniq([e.a, e.b, ...part[i].flat(), ...open[i].flat()].filter(t => t >= e.a - 1e-12 && t <= e.b + 1e-12));
    for (let k = 0; k < cuts.length - 1; k++) { const m = (cuts[k] + cuts[k + 1]) / 2; pieces.push({ e, a: cuts[k], b: cuts[k + 1], t: inAny(open[i], m) ? 'open' : inAny(part[i], m) ? 'part' : 'fire' }); }
  });
  const hasPart = pieces.some(p => p.t === 'part'), hasOpen = pieces.some(p => p.t === 'open');
   
  const joins = { fire: [], part: [] }, endKey = (p, end) => { const t = end ? p.b : p.a; return p.e.o === 'v' ? [p.e.c, t] : [t, p.e.c]; };
  for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) {
    const p = pieces[i], q = pieces[j]; if (p.t !== q.t || p.t === 'open' || p.e.o === q.e.o) continue;
    for (const ep of [0, 1]) for (const eq of [0, 1]) { const A1 = endKey(p, ep), B1 = endKey(q, eq); if (Math.abs(A1[0] - B1[0]) < 1e-9 && Math.abs(A1[1] - B1[1]) < 1e-9) joins[p.t].push(A1); }
  }
   
  const strip = (p, d) => p.e.o === 'v' ? [p.e.c - d, p.e.c + d, p.a, p.b] : [p.a, p.b, p.e.c - d, p.e.c + d];
  const fireR = pieces.filter(p => p.t === 'fire').map(p => strip(p, T_FIRE / 2)).concat(joins.fire.map(([u, v]) => [u - T_FIRE / 2, u + T_FIRE / 2, v - T_FIRE / 2, v + T_FIRE / 2]));
  const partR = hasOpen ? pieces.filter(p => p.t === 'part').map(p => strip(p, T_PART / 2)).concat(joins.part.map(([u, v]) => [u - T_PART / 2, u + T_PART / 2, v - T_PART / 2, v + T_PART / 2])) : [];
  const open_ = r => r[0] < 0 ? 0 : 0;   
  void open_; void hasPart;
  const eroded = p => {  
    const h = T_PART / 2, sq = [p[0] - h, p[0] + h, p[1] - h, p[1] + h];
    const xs = uniq([sq[0], sq[1], ...rs.flatMap(r => [r[0], r[1]]).filter(v => v > sq[0] && v < sq[1])]), ys = uniq([sq[2], sq[3], ...rs.flatMap(r => [r[2], r[3]]).filter(v => v > sq[2] && v < sq[3])]);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) if (!inRects(rs, [(xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2])) return false;
    return true;
  };
  const strictIn = (R, p) => R.some(r => r[0] < p[0] && p[0] < r[1] && r[2] < p[1] && p[1] < r[3]);
  const member = p => {
    if (!inRects(rs, p)) return false;
    if (hasOpen) { if (strictIn(partR, p)) return false; }
    else if (!eroded(p)) return false;
    return !strictIn(fireR, p);
  };
   
  const bx = new Set(), by = new Set();
  for (const r of rs) for (const d of [0, T_PART / 2, -T_PART / 2]) { bx.add(r[0] + d); bx.add(r[1] + d); by.add(r[2] + d); by.add(r[3] + d); }
  for (const r of fireR.concat(partR)) { bx.add(r[0]); bx.add(r[1]); by.add(r[2]); by.add(r[3]); }
  const X = uniqRaw(bx), Y = uniqRaw(by), cellsIn = [];
  let aI = 0;    
  const I = v => Math.round(v * 1e4);
  for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Y.length - 1; j++) { const p = [(X[i] + X[i + 1]) / 2, (Y[j] + Y[j + 1]) / 2]; if (member(p)) { aI += (I(X[i + 1]) - I(X[i])) * (I(Y[j + 1]) - I(Y[j])); cellsIn.push([X[i], X[i + 1], Y[j], Y[j + 1]]); } }
  let area = aI / 1e8;
   
  if (cellsIn.length) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const c of cellsIn) { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[1]); y0 = Math.min(y0, c[2]); y1 = Math.max(y1, c[3]); }
    if ((I(x1) - I(x0)) * (I(y1) - I(y0)) === aI) area = (x1 - x0) * (y1 - y0);
  }
   
  const inside = p => { const e = 1e-9; return [[e, 0], [-e, 0], [0, e], [0, -e]].every(([a, b]) => inRects(cellsIn, [p[0] + a, p[1] + b])); };
  const cs = new Set();
  if (cellsIn.length) {
    const u0 = minOf(cellsIn, c => c[0]), u1 = maxOf(cellsIn, c => c[1]), v0 = minOf(cellsIn, c => c[2]), v1 = maxOf(cellsIn, c => c[3]);
    for (let a = Math.trunc(u0 / STEP) - 1; a < Math.trunc(u1 / STEP) + 2; a++) for (let b = Math.trunc(v0 / STEP) - 1; b < Math.trunc(v1 / STEP) + 2; b++)
      if (inside([(a + 0.5) * STEP, (b + 0.5) * STEP])) cs.add(a + ',' + b);
  }
  const bb = cellsIn.length ? [minOf(cellsIn, c => c[0]), minOf(cellsIn, c => c[2]), maxOf(cellsIn, c => c[1]), maxOf(cellsIn, c => c[3])] : [0, 0, 0, 0];
  return { area, cells: cs, rects: cellsIn, bounds: bb };
}
function localWidth(cells) {
  const C = cells, H = new Map(), V = new Map(), has = (a, b) => C.has(a + ',' + b);
  for (const c of C) { if (H.has(c)) continue; const [a, b] = c.split(',').map(Number); let a0 = a; while (has(a0 - 1, b)) a0--; let a1 = a0; while (has(a1 + 1, b)) a1++; for (let k = a0; k <= a1; k++) H.set(k + ',' + b, (a1 - a0 + 1) * STEP); }
  for (const c of C) { if (V.has(c)) continue; const [a, b] = c.split(',').map(Number); let b0 = b; while (has(a, b0 - 1)) b0--; let b1 = b0; while (has(a, b1 + 1)) b1++; for (let k = b0; k <= b1; k++) V.set(a + ',' + k, (b1 - b0 + 1) * STEP); }
  const out = new Map(); for (const c of C) out.set(c, Math.min(H.get(c), V.get(c))); return out;
}
function maxSquare(cells) {
  if (!cells.size) return 0.0;
  const P = [...cells].map(c => c.split(',').map(Number)), a0 = minOf(P, p => p[0]), a1 = maxOf(P, p => p[0]), b0 = minOf(P, p => p[1]), b1 = maxOf(P, p => p[1]);
  const dp = new Map(); let best = 0;
  for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) if (cells.has(a + ',' + b)) { const v = 1 + Math.min(dp.get((a - 1) + ',' + b) || 0, dp.get(a + ',' + (b - 1)) || 0, dp.get((a - 1) + ',' + (b - 1)) || 0); dp.set(a + ',' + b, v); if (v > best) best = v; }
  return best * STEP;
}
 
function clearSize(x, rooms, st) {
  const g = clearGeom(x, rooms, st), big = x.r.reduce((m, r) => rArea(r) > rArea(m) ? r : m, x.r[0]);
  let bb = [0, 0, 0, 0];
  if (g.rects.length) { const I = g.rects.map(c => [Math.max(c[0], big[0]), Math.min(c[1], big[1]), Math.max(c[2], big[2]), Math.min(c[3], big[3])]).filter(c => c[1] > c[0] && c[3] > c[2]); if (I.length) bb = [minOf(I, c => c[0]), minOf(I, c => c[2]), maxOf(I, c => c[1]), maxOf(I, c => c[3])]; }
  const [bigW, bigL] = [bb[2] - bb[0], bb[3] - bb[1]].sort((p, q) => p - q);
  return { A: g.area, w: pyRound2(maxSquare(g.cells)), bigW, bigL, cells: g.cells };
}

 

 
function pyFixed(x, d) {
   
  const e = Math.abs(x).toFixed(Math.min(100, d + 30)), dot = e.indexOf('.'), tail = e.slice(dot + 1 + d);
  if (/^50*$/.test(tail)) {
    const keep = e.slice(0, dot + 1 + d).replace(/\.$/, ''), last = Number(keep.slice(-1));
    const down = (last % 2 === 0) ? keep : null;
    if (down !== null) return (x < 0 && Number(down) !== 0 ? '-' : '') + down;
  }
  return x.toFixed(d);
}
const comma = s => { const neg = s.startsWith('-'), t = neg ? s.slice(1) : s, [i, f] = t.split('.'); return (neg ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f !== undefined ? '.' + f : ''); };
const n0 = x => comma(pyFixed(x, 0)), n1 = x => comma(pyFixed(x, 1)), f2 = x => pyFixed(x, 2), f0 = x => pyFixed(x, 0);
const pyF = v => Number.isInteger(v) ? v.toFixed(1) : String(v);   

 
const GEN = [[300, 'KD300', null], [1000, 'KD1000', [8.43, 2.62]], [2000, 'KD2000', [13.5, 3.5]]];
const TANK300 = [[1855, [4.100, 1.350], 'ADV-10068 sheet 1, 490 gal'], [3634, [5.116, 1.350], 'sheet 1, 960 gal'], [7305, [6.985, 1.900], 'sheet 3, 1,930 gal']];
const TX = [[150, [1.829, 1.346]], [225, [1.930, 1.448]], [300, [1.930, 1.499]], [500, [1.930, 1.651]], [750, [1.930, 1.702]],
  [1000, [1.930, 1.727]], [1500, [2.362, 1.905]], [2000, [2.667, 2.007]], [2500, [2.667, 2.616]]];
const L_PER_KWH = 0.264, DC_HOURS = 12, HUB_HOURS = 72;
const KD300_LH = [[0.25, 27.3], [0.50, 50.7], [0.75, 67.6], [1.00, 83.7]];
function curve(c, f) { f = Math.max(0.25, Math.min(1.0, f)); for (let i = 0; i < c.length - 1; i++) { const [a, la] = c[i], [b, lb] = c[i + 1]; if (f <= b + 1e-9) return la + (lb - la) * (f - a) / (b - a); } return c[c.length - 1][1]; }
const kd300lh = f => curve(KD300_LH, f);
function hubTank(hubKw) { const f = hubKw == null ? 1.0 : hubKw / 300.0, need = kd300lh(f) * HUB_HOURS, t = TANK300.find(t => t[0] >= need) || null; return { need_l: need, tank_l: t ? t[0] : null, footprint: t ? t[1] : null }; }
function gens(Q, hubKw, size) {
  const load = Q * 1000 + (hubKw || 0); let kw, model, fp, duty;
  for ([kw, model, fp] of GEN) { duty = Math.max(1, Math.ceil(load / kw - 1e-9)); if ((size == null && duty <= 3) || kw === size || kw === GEN[GEN.length - 1][0]) break; }
  let tank = Q * 1000 * DC_HOURS * L_PER_KWH / duty, note = '';
  if (kw === 300) tank = kd300lh(load / duty / kw) * DC_HOURS;
  if (fp == null) { const t = TANK300.find(t => t[0] >= tank) || null; fp = t ? t[1] : null; note = t ? t[2] : 'no standard tank holds it ?'; }
  return { kw, model, duty, n: duty + 1, tank_l: tank, footprint: fp, tank_note: note, load_kw: load };
}
 
let PADRULE = '11d';    
const BCH_PAD_11C = [[2.21, 2.21], 'BC Hydro ES54 Table 1, "750 ≤ PMT ≤ 1500 kVA"'];
const BCH_PAD = { 500: [[1.68, 1.58], 'BC Hydro ES54 F3-04.01'], 1500: [[2.20, 2.20], 'BC Hydro ES54 F3-05.01'] };    
function transformers(Q, hubKw, city = 'v') {
  const kva = Q * 1000 + (hubKw || 0); let size, fp, duty;
  if (kva <= 2500) { [size, fp] = TX.find(t => t[0] >= kva); duty = 1; } else { [size, fp] = TX[TX.length - 1]; duty = Math.ceil(kva / 2500 - 1e-9); }
  let src = 'Eaton CA08104001E, cabinet + 4 in (our reading)';
  if (city === 'v' && size <= 1500) [fp, src] = PADRULE === '11c' ? BCH_PAD_11C : size <= 500 ? BCH_PAD[500] : BCH_PAD[1500];
  return { kva: size, duty, n: duty + 1, pad: fp, pad_src: src, load_kva: kva };
}
function switchMargin(g, t) { return [g.duty * g.kw - g.load_kw, (t.duty === 1 ? t.kva : t.duty * 2500) - t.load_kva]; }
const HUBSETS = [[80, 'KD80', [[0.25, 7.3], [0.50, 15.1], [0.75, 22.1], [1.00, 28.0]], [2.27, 1.149], 'G5-641'],
  [100, 'KD100', [[0.25, 9.5], [0.50, 18.7], [0.75, 26.7], [1.00, 32.9]], [2.27, 1.149], 'G5-642'], [300, 'KD300', KD300_LH, null, 'g5650']];
function hubSet(hubKw) {
  const h = HUBSETS.find(([kw]) => hubKw <= kw + 1e-9);
  if (!h) return { model: '?', kw: null, need_l: null, footprint: null, src: 'load over 300 kW ?' };
  const [kw, model, c, fp0, src] = h, need = curve(c, hubKw / kw) * HUB_HOURS; let fp = fp0, tank = null;
  if (fp == null) { const t = TANK300.find(t => t[0] >= need) || null; fp = t ? t[1] : null; tank = t ? t[0] : null; }
  return { model, kw, load: hubKw / kw, need_l: need, tank_l: tank, footprint: fp, src, enclosure: ENCLOSURE[model] || null };
}
 
const ENCLOSURE = { KD80: [[3.200, 1.168], 'G12-625'], KD100: [[3.200, 1.168], 'G12-625'] };
const CAB_KW = { 10: 186.6, 15: 124.4 }, CAB_L = 0.6, CAB_W = 0.75, CAB_FRONT = 0.914, CAB_WALL = 0.025, DOOR_END = 1.1;
const battCabinets = (mw, minutes = 15) => Math.max(1, Math.ceil(mw * 1000 / CAB_KW[minutes] - 1e-9));
function battRoom(n, L, W) {
  [L, W] = [Math.max(L, W), Math.min(L, W)];
  const d1 = CAB_WALL + CAB_W + CAB_FRONT, d2 = 2 * (CAB_WALL + CAB_W) + CAB_FRONT, l1 = n * CAB_L + DOOR_END, l2 = Math.ceil(n / 2) * CAB_L + DOOR_END;
  if (L >= l1 - 1e-6 && W >= d1 - 1e-6) return [true, 1, l1, d1, 0.0];
  if (L >= l2 - 1e-6 && W >= d2 - 1e-6) return [true, 2, l2, d2, 0.0];
  return [false, 2, l2, d2, Math.max(L < l2 ? (l2 - L) / l2 : 0, W < d2 ? (d2 - W) / d2 : 0)];
}

 
const HL_TYPES = [[/stair|lift|shaft/, 'excluded (stairs, lifts, shafts)', 0, 0, 0, null], [/exit passage|corridor/, 'corridor', 4.4, 0, 0, null],
  [/lobby/, 'lobby', 9.0, 1, 0, null], [/refuge|shelter|rest area|day room/, 'refuge: fire station sleeping quarters', 2.5, 2.5, 500, 'people'],
  [/\bwcs?\b|washroom|shower|toilet/, 'washroom', 6.8, 1, 0, null], [/exam|consult|procedure|first aid|treatment/, 'healthcare exam/treatment', 15.1, 10, 90, 20],
  [/nurse/, "healthcare nurses' station", 12.6, 2.5, 45, 20], [/recovery/, 'healthcare recovery room', 13.5, 10, 180, 20],
  [/patient/, 'healthcare patient room', 7.3, 10, 90, 20], [/kitchen|food/, 'food preparation', 11.7, 10, 0, null], [/laundry/, 'laundry', 5.7, 20, 0, null],
  [/office/, 'office', 8.0, 7.5, 0, null], [/lounge|waiting/, 'lounge', 6.3, 1, 0, null], [/storage|cot|medication|clean supply|soiled|housekeeping|janitor/, 'storage', 5.5, 1, 0, null]];
const HL_OTHER = ['other (lounge values)', 6.3, 1, 0, null];
function hubLoad(G, people) {
  let li = 0, rc = 0, sw = 0, used = false; const other = new Set();
  for (const st of storeys(G)) for (const x of roomsOf(G, st)) {
    if (!['pub', 'grow', 'clin', 'circ'].includes(x.g)) continue;
    if (x.g === 'circ' && x.n.toLowerCase().includes('secure')) continue;
    const A = x.r.reduce((s, r) => s + rArea(r), 0), l = x.n.toLowerCase(), t = HL_TYPES.find(t => t[0].test(l)), [lab, a, b, s, occ] = t ? t.slice(1) : HL_OTHER;
    li += A * a; rc += A * b;
    if (s && occ === 'people' && !used) { sw += people * s; used = true; } else if (s && typeof occ === 'number') sw += A / occ * s;
    if (lab.startsWith('other')) other.add(x.n.split(' (')[0]);
  }
  return { kw: (li + rc + sw) / 1000, light: li / 1000, plug: rc / 1000, swh: sw / 1000, other: [...other].sort() };
}

 
const RULES = [
  [/loading space/, 3.4, null, 'Class B 3.4 m (Parking By-law 5.5.1.2)', 'loading space'], [/exit passage|exit steps/, 1.1, null, 'VBBL 3.3.1.9 / 3.4.3.2 1.1 m', 'exit passage|exit steps'],
  [/mechanical|panel|shaft|riser/, 1.0, null, 'access; our judgment ?', 'mechanical|panel|shaft|riser'], [/truck aisle|drive/, 6.1, null, '6.1 m aisle (5.4.1)', 'truck aisle|drive'],
  [/corridor/, 1.8, null, 'spec Part 3: 2.0 public/secure, 1.8 clinic; code 1.1', 'corridor'], [/stair/, 2.4, null, 'two 1.1 m flights side by side ~2.4 m; our arithmetic ?', 'stair'],
  [/dock|lobby/, 2.4, null, 'two people passing with a trolley; our judgment ?', 'dock|lobby'], [/freight lift|lift e2/, 2.4, null, 'spec car 2.5 x 3.4 is the car, shaft drawn 2.4+ (drawing choice ?)', 'freight lift|lift e2'],
  [/lift/, 2.0, null, 'accessible car ~1.7 + shaft; our judgment ?', 'lift'],
  [/universal wc|universal washroom|clinic universal/, 1.7, 5.3, 'project decision: 1,700 mm circle clear of the WC and its 900 mm transfer space (VBBL 3.8.3.13): 1.7 x 3.2 at least, our arithmetic', 'universal wc|universal washroom|clinic universal'],
  [/shower/, 1.5, 2.7, 'VBBL 3.8.3.17 1.5 x 0.9 + 0.9 clear', 'shower'], [/\bwcs?\b|washroom|toilet/, 1.5, null, 'single WC 1.5; our judgment ?', '\\bwcs?\\b|washroom|toilet'],
  [/procedure/, 3.0, 15.5, 'project decision, 8 Nov: 3.0 m (step 6); AHS 15.5 m2', 'procedure'], [/exam|consult/, 3.0, 12.0, 'project decision, 8 Nov: 3.0 m (step 6); AHS 12.0 m2', 'exam|consult'],
  [/medication/, 1.5, 10.0, 'audit 1.5 m ?; AHS 10.0 m2', 'medication'], [/clean supply/, 1.5, 11.0, 'audit 1.5 m ?; AHS 11.0 m2', 'clean supply'],
  [/soiled/, 1.5, 13.5, 'audit 1.5 m ?; AHS 13.5 m2', 'soiled'], [/housekeeping/, 1.5, 7.0, 'audit 1.5 m ?; AHS 7.0 m2', 'housekeeping'],
  [/shipping|receiving/, 2.4, null, 'trolley + aisle; our judgment ?', 'shipping|receiving'], [/cylinder/, 1.5, null, 'cylinders + access; our judgment ?', 'cylinder'],
  [/first aid/, 2.7, 9.3, 'project decision, 8 Nov: 2.7 m (step 6); WorkSafeBC 9.3 m2', 'first aid'], [/data hall/, 6.0, null, 'two rack rows + aisles 6.0 m; our arithmetic ?', 'data hall'],
  [/ups|battery|switchgear|electrical|\bmv\b/, 3.0, null, 'project decision, 8 Nov: 3.0 m (CEC 2-308 second-hand ?)', 'ups|battery|switchgear|electrical|\\bmv\\b'],
  [/meet-me|noc|office|lounge|break|staff room/, 2.4, null, 'project decision, 8 Nov: 2.4 m (step 6)', 'meet-me|noc|office|lounge|break|staff room'],
  [/medication|clean|soiled|housekeeping|janitor|storage|cot|garbage|valve/, 1.5, null, 'project decision, 8 Nov: 1.5 m (step 6)', 'medication|clean|soiled|housekeeping|janitor|storage|cot|garbage|valve'],
  [/vestibule|portal|guard/, 1.8, null, '1.8 m portal (GCPSG-015)', 'vestibule|portal|guard'],
  [/shelter/, 4.0, 56.0, 'project decision, 8 Nov: 4.0 m; room minimums rule: shelter 16 guests x 3.5 m2 = 56 m2 (fix batch 10 Nov, finding 8)', 'shelter'],
  [/refuge|shelter|waiting|rest area/, 4.0, null, 'project decision, 8 Nov: 4.0 m refuge and shelter (waiting: our judgment ?)', 'refuge|shelter|waiting|rest area'],
  [/mechanical|panel|shaft|riser/, 1.0, null, 'access; our judgment ?', 'mechanical|panel|shaft|riser']];
const HARD = { 'loading space': [true, null], 'exit passage|exit steps': [true, null], 'truck aisle|drive': [true, null],
  'universal wc|universal washroom|clinic universal': [true, true], 'shower': [true, true], 'procedure': [false, true], 'exam|consult': [false, true],
  'medication': [false, true], 'clean supply': [false, true], 'soiled': [false, true], 'housekeeping': [false, true], 'first aid': [false, true],
  'ups|battery|switchgear|electrical|\\bmv\\b': [true, null], 'vestibule|portal|guard': [true, null], 'shelter': [false, true] };
const CORRIDOR_CODE = 1.1;
function hard(n) { const l = n.toLowerCase(); for (const R of RULES) if (R[0].test(l)) { const h = HARD[R[4]] || [false, false]; return [!!h[0], !!h[1]]; } return [false, false]; }
function rule(n) { const l = n.toLowerCase(); for (const R of RULES) if (R[0].test(l)) return [R[1], R[2], R[3]]; return null; }
 
const AUDIT_CACHE = new WeakMap();
function auditGeom(S, name = '', fold = '') {
  const c = AUDIT_CACHE.get(S), k = name + '|' + fold; if (c && c.has(k)) return c.get(k);
  const out = auditGeom0(S, name, fold); if (c) c.set(k, out); else AUDIT_CACHE.set(S, new Map([[k, out]])); return out;
}
function auditGeom0(S, name = '', fold = '') {
  const rows = [];
  for (const st of Object.keys(S).map(Number).sort((a, b) => a - b)) {
    const rooms = S[String(st)];
    for (const x of rooms) {
      const rs = x.r, A0 = rs.reduce((s, r) => s + rArea(r), 0);
      const big = rs.reduce((m, r) => rArea(r) > rArea(m) ? r : m, rs[0]), L = Math.max(big[1] - big[0], big[3] - big[2]), shb = Math.min(big[1] - big[0], big[3] - big[2]);
      const c = clearSize(x, rooms, st), A = c.A, w = c.w, LW = localWidth(c.cells), bigW = c.bigW, bigL = c.bigL;
      const nl = x.n.toLowerCase(), ru = !(['spare', 'sup'].includes(x.g) && nl.includes('refuge')) ? rule(x.n) : null, issue = [], kind = [];
      let basis;
      if (ru) {
        let [mw, ma, b] = ru; basis = b;
        if (mw === 3.4 && fold.startsWith('e')) { mw = 3.3; basis = 'Edmonton Zoning Bylaw Table 7.2: 9.0 x 3.3 m'; }
        const [hw, ha] = hard(x.n);
        if (w + 1e-6 < mw) { issue.push(`clear width ${f2(w)} < ${pyF(mw)}`); kind.push(hw ? 'hard' : 'judged'); }
        if (/corridor/.test(nl) && w + 1e-6 < CORRIDOR_CODE) { issue.push(`clear width ${f2(w)} < ${pyF(CORRIDOR_CODE)} (code)`); kind.push('hard'); }
        if (ma && A + 1e-6 < ma) { issue.push(`area ${pyFixed(A, 1)} < ${pyF(ma)}`); kind.push(ha ? 'hard' : 'judged'); }
        if (/universal wc|clinic universal/.test(nl) && !(bigW >= 1.7 - 1e-6 && bigL >= 3.2 - 1e-6)) { issue.push(`${f2(bigW)} x ${f2(bigL)}: needs 1.7 x 3.2 (1.7 m circle beside a 1.6 x 1.5 m WC + 0.9 m transfer zone, our arithmetic ?)`); kind.push('hard'); }
      } else basis = 'no rule';
      const ispub = nl.includes('refuge') && !nl.includes('staff') && x.g === 'pub';
      let thin = 0; if (ispub) for (const v of LW.values()) if (v < 2.4 - 1e-6) thin += STEP * STEP;
      const cnt = A - thin, note = ispub && thin > 0.05 ? `${pyFixed(thin, 1)} m2 under 2.4 m wide, not counted (counts ${pyFixed(cnt, 1)})` : '';
      if (L / Math.max(shb, 0.01) > 6 && rs.length === 1 && !/corridor|passage|stair|aisle|drive|shaft|riser|lift/.test(nl)) { issue.push(`very long and thin (${pyFixed(L, 1)} x ${pyFixed(shb, 1)})`); kind.push('judged'); }
      rows.push({ st, id: x.id, n: x.n, A: pyRound1(A), A_centre: pyRound1(A0), Acount: pyRound1(cnt), w: pyRound2(w), L: pyRound2(L), Lc: pyRound2(bigL), issue, kind, basis, note, clear: true });    
    }
  }
  const pubref = rows.filter(r => r.n.toLowerCase().includes('refuge') && !r.n.toLowerCase().includes('staff') && !r.n.toLowerCase().startsWith('unassigned'));
  if (pubref.length) {
    const mr = pubref.reduce((m, r) => r.Acount > m.Acount ? r : m, pubref[0]), small = name.startsWith('1330') || name === 'small';
    if (mr.Acount + 1e-6 < 175 && !(small && pubref.reduce((s, r) => s + r.Acount, 0) >= 175)) { mr.issue.push(`refuge main room counts ${pyF(mr.Acount)} m2 < 175 (project decision, 8 Nov)`); mr.kind.push('hard'); }
  }
  return rows;
}

 
const TIGHT = 'tight: check in design (project decision, 9 Nov: within 0.5 m or 5 % of the limit)';
 
function st_(ok, margin, rel, limit) {
  const tol = rel && limit ? 0.05 * limit : 0.5;
  if (!ok && (typeof BD !== 'undefined' && BD.hub && BD.hub.RULES && BD.hub.RULES.belowMinFails === true)) return 'fail';    
  if (!ok) { if (-tol - 1e-9 <= margin && margin <= 1e-9) return { st: 'tight', over: -margin, unit: rel ? '' : ' m' }; return 'fail'; }
  return margin < tol - 1e-9 ? 'tight' : 'pass';
}
const S_ = s => typeof s === 'object' ? s.st : s;
function t_(s, txt) { if (typeof s === 'object' && s.over != null) return txt + ` — tight: over by ${f2(s.over)}${s.unit}, fix in design (project decision, 10 Nov: within 0.5 m or 5 % past the limit; never compliant)`; return txt + (S_(s) === 'tight' ? ' — ' + TIGHT : ''); }
const rArea2 = x => x.r.reduce((s, r) => s + rArea(r), 0);
 
function measureSizing(G, cfg) {
  let hall = 0; for (const st of storeys(G)) for (const x of roomsOf(G, st)) if (x.g === 'hall') hall += rArea2(x);
  const MW = hall / 740, Q = MW * 1.55, m = { hall, MW, Q };    
  const rr = auditGeom({ 1: roomsOf(G, 1) }).filter(r => (cfg.refuge_ids || []).includes(r.id));
  m.ref_counted = rr.reduce((s, r) => s + r.Acount, 0); m.ref_main = rr.length ? Math.max(...rr.map(r => r.Acount)) : 0.0;
  m.people = Math.trunc(Math.floor(m.ref_counted / 3.5));
  m.hub = hubLoad(G, m.people);
  const g = gens(Q, 0.0), t = transformers(Q, m.hub.kw, cfg.city === 'edm' ? 'e' : 'v');
  Object.assign(m, { sz_gen: g, sz_tx: t, ngen: g.n, genkw: g.kw, ntx: t.n, tank: g.tank_l });
  if (cfg.sizing_fallback_kw) { const d = gens(Q, 0.0, cfg.sizing_fallback_kw); m.ngen = d.n; m.genkw = d.kw; m.tank = d.tank_l; }
  m.hub_tank = hubTank(m.hub.kw); m.hub_set = hubSet(m.hub.kw); m.sz_margin = switchMargin(g, t);
  return m;
}
function hubgen(G) {
  const p = (G.PLANT || []).filter(x => x.id.startsWith('h'));
  if (p.length) return [p[0].n, Array.isArray(p[0].r[0]) ? p[0].r[0] : p[0].r, 'grade'];
  const hg = get(G, 'HUBGEN', null); return hg ? [hg[1], hg[0], 'room'] : [null, null, null];
}
function sizingRow(G, cfg, m) {
  const g = m.sz_gen, t = m.sz_tx, dg = (G.PLANT || []).filter(p => p.n.includes('enerator') && !p.id.startsWith('h'));
  let ng = dg.length; const kws = [], kvas = [], add = (a, v) => { if (!a.includes(v)) a.push(v); };
  for (const p of dg) { const k = /([\d,]+) kW/.exec(p.n); add(kws, k ? parseInt(k[1].replace(/,/g, ''), 10) : 1000); }
  if (!ng) for (const st of storeys(G)) for (const x of roomsOf(G, st)) if (x.n.toLowerCase().startsWith('generator room')) {
    let k = /(\d+) sets/.exec(x.n); ng += k ? parseInt(k[1], 10) : 0; k = /([\d,]+) kW/.exec(x.n); add(kws, k ? parseInt(k[1].replace(/,/g, ''), 10) : 1000);
  }
  const tp = (G.PLANT || []).filter(p => p.id.startsWith('t')), nt = tp.length;
  for (const p of tp) { const k = /([\d,]+) kVA/.exec(p.n); add(kvas, k ? parseInt(k[1].replace(/,/g, ''), 10) : 2500); }
  const dkw = kws.length === 1 ? kws[0] : null, dkva = kvas.length === 1 ? kvas[0] : null;
  const fp = g.footprint ? `${f2(g.footprint[0])} × ${f2(g.footprint[1])} m` : '?', hb = m.hub, [gm, tm] = m.sz_margin;
  let txt = `data centre ${n1(m.MW)} MW × 1.55 = ${n1(m.Q)} MW on its own sets: generators ${g.duty} + 1 spare × ${comma(String(g.kw))} kW `
    + `(${g.model}, ${fp}${g.tank_note ? ', ' + g.tank_note : ''}; 12 h fuel ${n0(g.tank_l)} L a duty set); transformers carry the data centre and the hub `
    + `${n0(hb.kw)} kW (normal power, our reading): ${t.duty} + 1 × ${comma(String(t.kva))} kVA (pad ${f2(t.pad[0])} × ${f2(t.pad[1])} m, ${t.pad_src}). `
    + `Drawn: ${ng} × ${dkw ? comma(String(dkw)) : '?'} kW sets, ${nt} × ${dkva ? comma(String(dkva)) : '?'} kVA pads. Rule: smallest set size with at most 3 duty sets `
    + `(our reading), N+1; Rehlko KD230–300 ADV-10068 and g5650 fuel curve, KD1000, KD2000 (fuel 0.264 L/kWh, register fuel_on_site; maker claims). `    
    + `Headroom before a step up: generators ${n0(gm)} kW, transformers ${n0(tm)} kVA. Plant sized on yearly PUE; a later design stage adds margin`;    
  const near = gm < 100 || tm < 100, sameG = ng === g.n && dkw === g.kw, sameT = nt === t.n && dkva === t.kva, fb = cfg.sizing_fallback;
  if (!sameG && fb) txt += ' — ' + fb + ' (next size up: project decision, 11 Nov)'; else if (!(sameG && sameT)) txt += ' — differs from the drawing: board fix pending';
  if (near) txt += ' — within 0.1 MW of a sizing switch point (fans and space heat ? could step it up): ' + TIGHT.replace('project decision, 9 Nov', 'D1, project decision, 11 Nov');
  const st = (!sameG && fb) || !(sameG && sameT) ? 'flag' : (near ? 'tight' : 'pass');
  return [st, 'Plant sized to load', 'project decision, 11 Nov (sizing to load); eh/sizing.py', txt];
}
function hubsetRow(G, cfg, m) {
  const hs = m.hub_set, [nm, r, where] = hubgen(G), src = 'project decision, 11 Nov (own set); eh/sizing.hub_set';
  let fp = hs.footprint ? `${f2(hs.footprint[0])} × ${f2(hs.footprint[1])} m` : '?';
  if (hs.enclosure) { const e_ = hs.enclosure; fp = `in its enclosure ${f2(e_[0][0])} × ${f2(e_[0][1])} m outdoors (${e_[1]}, KD80/100/130 4.5 L); open set ${fp} indoors (G5-641/642)`; }
  let txt = `hub load ${n0(m.hub.kw)} kW (NECB 2020 build-up; fans and space heat ?) → ${hs.model} (${hs.kw} kW standby, ${f0(hs.load * 100)} % load; `
    + `Rehlko ${hs.src}, maker claim): 72 h at that load on its curve ${n0(hs.need_l)} L in a sub-base tank`
    + (hs.tank_l ? ` (${n0(hs.tank_l)} L, ADV-10068)` : ' (tank sizes not published ?: drawn under the enclosure)') + `, set ${fp}. `;
  if (!nm) return ['fail', 'Hub generator (72 h)', src, txt + 'Not drawn.'];
  const ok = nm.includes(hs.model);
  txt += `Drawn: ${nm} (${where === 'grade' ? 'at grade; clearances with the other sets (Generator tanks row)' : 'in its own 2 h room'}, ${f2(r[1] - r[0])} × ${f2(r[3] - r[2])} m)`;
  if (!ok) return ['fail', 'Hub generator (72 h)', src, txt + ' — model differs from the rule'];
  if (where === 'grade' && hs.enclosure) {    
    const L_ = Math.max(r[1] - r[0], r[3] - r[2]), W_ = Math.min(r[1] - r[0], r[3] - r[2]), [eL, eW] = hs.enclosure[0];
    if (L_ < eL - 0.05 || W_ < eW - 0.05) return ['fail', 'Hub generator (72 h)', src, txt + ` — drawn smaller than its enclosure (${f2(eL)} × ${f2(eW)} m)`];
  }
  if (where === 'room') {
    const rm = []; for (const st of storeys(G)) for (const x of roomsOf(G, st)) for (const q of x.r) if (q[0] <= r[0] + 1e-6 && q[1] >= r[1] - 1e-6 && q[2] <= r[2] + 1e-6 && q[3] >= r[3] - 1e-6) rm.push(q);
    if (!rm.length) return ['fail', 'Hub generator (72 h)', src, txt + ' — not inside a drawn room'];
    const q = rm[0], side = (r[1] - r[0]) < (r[3] - r[2]) ? Math.min(r[0] - q[0], q[1] - r[1]) : Math.min(r[2] - q[2], q[3] - r[3]);
    const s = st_(side >= 1.0 - 1e-6, side - 1.0);
    return [S_(s), 'Hub generator (72 h)', src, t_(s, txt + `; ${n1(side)} m to the side walls (≥ 1.0, our reading)`)];
  }
  return ['pass', 'Hub generator (72 h)', src, txt];
}
function batteryRow(G, cfg, m) {
  const rows = auditGeom(G.S, cfg.small_lot ? 'small' : '', cfg.city === 'edm' ? 'e' : 'v');
  const br = rows.filter(r => r.n.toLowerCase().startsWith('battery room') && !r.n.toLowerCase().includes('hvac'));
  const n15 = battCabinets(m.MW, 15), n10 = battCabinets(m.MW, 10);
  const src = 'project decision, 11 Nov (10–15 min, FM 5-32 3.5.2.1); tool/engine.js R.equip.cabKW, tool/dcrooms.js; Vertiv EnergyCore Li5 31.1 kWh (maker claim)';
  if (!br.length) return ['fail', 'Battery cabinets (UPS 10–15 min)', src, `${n15} cabinets for 15 min: no battery room drawn`];
  const r = br.reduce((a, b) => b.A > a.A ? b : a, br[0]), rL = r.Lc != null ? r.Lc : r.L, [fits, rws, l, d, sh] = battRoom(n15, rL, r.w);    
  const txt = `data centre ${n1(m.MW)} MW: ${n15} cabinets for 15 min (${n10} for 10 min; 124.4 / 186.6 kW a cabinet, our arithmetic); `
    + `${rws === 1 ? 'one row' : 'two rows facing one 0.914 m aisle (our reading)'} needs ${pyFixed(l, 1)} × ${f2(d)} m clear; `
    + `${r.n.split(',')[0]} (storey ${r.st}) is ${pyFixed(rL, 1)} × ${f2(r.w)} m clear`;
  if (fits) return ['pass', 'Battery cabinets (UPS 10–15 min)', src, txt];
  const s = st_(false, -sh, true, 1.0);
  return [S_(s), 'Battery cabinets (UPS 10–15 min)', src, txt + ` — short by ${f0(sh * 100)} %`];
}
function widthRow(G, cfg) {
  const rows = auditGeom(G.S, cfg.small_lot ? 'small' : '', cfg.city === 'edm' ? 'e' : 'v'), bad = rows.filter(r => r.issue.length);
  const minw = r => { const ru = rule(r.n); return ru ? ru[0] : null; };
  const near = rows.filter(r => !r.issue.length && minw(r) && r.w < 1.05 * minw(r) - 1e-9);
  const src0 = 'project decision, 8 Nov minimum widths (mostly step 6, drawing choice); eh/audit_rooms.py';
  if (!bad.length && near.length) return ['tight', 'Room widths and shapes', src0, `all ${rows.length} rooms meet their minimum clear width; ${near.length} sit within 5 % of it (` + [...new Set(near.map(r => r.n.split(' (')[0].replace(/[0-9 ]+$/, '')))].sort().join(', ') + ') — ' + TIGHT];
  if (!bad.length) return ['pass', 'Room widths and shapes', src0, `all ${rows.length} rooms meet their minimum clear width; universal WCs hold the 1.7 m circle beside the WC transfer zone (our arithmetic ?)`];
  function issSt(r, iss, k) {
    if (k === 'judged') return 'judged';
    const ru = rule(r.n);
    if (iss.startsWith('clear width') && iss.includes('(code)')) return S_(st_(false, r.w - CORRIDOR_CODE, true, CORRIDOR_CODE));
    if (iss.startsWith('clear width') && ru) return S_(st_(false, r.w - ru[0], true, ru[0]));
    if (iss.startsWith('area') && ru && ru[1]) return S_(st_(false, r.A - ru[1], true, ru[1]));
    if (iss.startsWith('refuge main room counts')) return S_(st_(false, r.Acount - 175, true, 175));
    if (iss.includes('needs 1.7 x 3.2')) { const [W_, L_] = iss.split(':')[0].split(' x ').map(Number); return S_(st_(false, -Math.max((1.7 - W_) / 1.7, (3.2 - L_) / 3.2, 0.0), true, 1.0)); }
    return 'fail';
  }
  const roomSt = r => { const o = r.issue.map((i, k) => issSt(r, i, (r.kind || [])[k] || 'hard')); return o.includes('fail') ? 'fail' : (o.includes('tight') ? 'tight' : 'judged'); };
  const sts = bad.map(roomSt), stw = sts.includes('fail') ? 'fail' : 'tight';
  const nm = r => (Object.keys(G.S).length > 1 ? `st${r.st} ` : '') + r.n.split(' (')[0].split(',')[0];
  const ls = (r, want) => r.issue.filter((i, k) => ((r.kind || [])[k] === 'judged') === (want === 'judged')).map(i => i.split(':')[0]).join(', ');
  const fl = bad.filter((r, i) => sts[i] === 'fail'), tl = bad.filter((r, i) => sts[i] === 'tight'), jl = bad.filter(r => (r.kind || []).includes('judged'));
  const txt = 'clear sizes inside the walls (project decision, 11 Nov); only sourced minimums (steps 1-4) fail, steps 5-6 read tight, judged (project decision, 11 Nov). '
    + `${fl.length} more than 5 % under a sourced minimum (fail): ` + (fl.map(r => `${nm(r)} (${ls(r, 'hard')})`).join('; ') || 'none')
    + ` · ${tl.length} 5 % or less under a sourced minimum (tight: check in design, D1): ` + (tl.map(nm).join(', ') || 'none')
    + ` · ${jl.length} under a judged minimum (tight, judged): ` + (jl.map(nm).join(', ') || 'none') + ` · ${rows.length} rooms checked`;
  return [stw, 'Room widths and shapes', 'project decision, 8 Nov minimum widths; eh/audit_rooms.py', txt];
}

 

 
const ptInPoly = (p, P) => insideP(p, P);
function segSegD(a, b, c, d) {
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(segD(a, c, d), segD(b, c, d), segD(c, a, b), segD(d, a, b));
}
const rectPoly = r => [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]];
 
const gPP = (p, a) => Math.sqrt((p[0] - a[0]) * (p[0] - a[0]) + (p[1] - a[1]) * (p[1] - a[1]));
function gPS(p, A, B) {
  if (A[0] === B[0] && A[1] === B[1]) return gPP(p, A);
  const len2 = (B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]), r = ((p[0] - A[0]) * (B[0] - A[0]) + (p[1] - A[1]) * (B[1] - A[1])) / len2;
  if (r <= 0.0) return gPP(p, A); if (r >= 1.0) return gPP(p, B);
  const s = ((A[1] - p[1]) * (B[0] - A[0]) - (A[0] - p[0]) * (B[1] - A[1])) / len2; return Math.abs(s) * Math.sqrt(len2);
}
function gSS(A, B, C, D) {
  if (A[0] === B[0] && A[1] === B[1]) return gPS(A, C, D);
  if (C[0] === D[0] && C[1] === D[1]) return gPS(D, A, B);
  let no = false;
  if (Math.max(A[0], B[0]) < Math.min(C[0], D[0]) || Math.min(A[0], B[0]) > Math.max(C[0], D[0]) || Math.max(A[1], B[1]) < Math.min(C[1], D[1]) || Math.min(A[1], B[1]) > Math.max(C[1], D[1])) no = true;
  else { const den = (B[0] - A[0]) * (D[1] - C[1]) - (B[1] - A[1]) * (D[0] - C[0]); if (den === 0) no = true; else { const rn = (A[1] - C[1]) * (D[0] - C[0]) - (A[0] - C[0]) * (D[1] - C[1]), sn = (A[1] - C[1]) * (B[0] - A[0]) - (A[0] - C[0]) * (B[1] - A[1]), s = sn / den, r = rn / den; if (r < 0 || r > 1 || s < 0 || s > 1) no = true; } }
  return no ? Math.min(gPS(A, C, D), gPS(B, C, D), gPS(C, A, B), gPS(D, A, B)) : 0.0;
}
const gBox = r => [[r[1], r[2]], [r[1], r[3]], [r[0], r[3]], [r[0], r[2]]];    
const gRing = P => P.map((p, i) => [p, P[(i + 1) % P.length]]);
function gPolyD(A, B) { if (A.some(p => insideP(p, B)) || B.some(p => insideP(p, A))) return 0; let m = Infinity; for (const [a, b] of gRing(A)) for (const [c, d] of gRing(B)) m = Math.min(m, gSS(a, b, c, d)); return m; }
function gPolySegs(A, segs) { let m = Infinity; for (const [c, d] of segs) { if (insideP(c, A) || insideP(d, A)) return 0; for (const [a, b] of gRing(A)) m = Math.min(m, gSS(a, b, c, d)); } return m; }
const polyOf = s => isRect(s) ? rectPoly(s) : s.map(p => [p[0], p[1]]);
const edgesOf = P => P.map((p, i) => [p, P[(i + 1) % P.length]]);
 
function polyD(A, B) {
  if (A.some(p => ptInPoly(p, B)) || B.some(p => ptInPoly(p, A))) return 0;
  let m = Infinity; for (const [a, b] of edgesOf(A)) for (const [c, d] of edgesOf(B)) m = Math.min(m, segSegD(a, b, c, d));
  return m;
}
function polySegsD(A, segs) {
  let m = Infinity; for (const [c, d] of segs) { if (ptInPoly(c, A) || ptInPoly(d, A)) return 0; for (const [a, b] of edgesOf(A)) m = Math.min(m, segSegD(a, b, c, d)); }
  return m;
}
 
function segMinus(a, b, cuts) {
  let iv = [[0, 1]];
  for (const C of cuts) {
    let t0 = 0, t1 = 1; const n = C.length; let inside = true;
    for (let i = 0; i < n && inside; i++) {    
      const p = C[i], q = C[(i + 1) % n], cx = C.reduce((s, z) => s + z[0], 0) / n, cy = C.reduce((s, z) => s + z[1], 0) / n;
      let nx = q[1] - p[1], ny = -(q[0] - p[0]); if ((cx - p[0]) * nx + (cy - p[1]) * ny > 0) { nx = -nx; ny = -ny; }    
      const num = (a[0] - p[0]) * nx + (a[1] - p[1]) * ny, den = (b[0] - a[0]) * nx + (b[1] - a[1]) * ny;
      if (Math.abs(den) < 1e-15) { if (num > 0) inside = false; continue; }
      const t = -num / den; if (den < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
      if (t0 > t1) inside = false;
    }
    if (!inside || t1 - t0 < 1e-12) continue;
    iv = iv.flatMap(([s, e]) => (t1 <= s || t0 >= e) ? [[s, e]] : [[s, Math.max(s, t0)], [Math.min(e, t1), e]].filter(([x, y]) => y - x > 1e-12));
  }
  return iv.map(([s, e]) => [[a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s], [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]]);
}
 
function flatBuf(a, b, d) { const L = hyp(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L * d, ny = (b[0] - a[0]) / L * d; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; }
 
function clipArea(P, bx) {
  let poly = P.slice();
  const edges = [[p => p[0] >= bx[0], (p, q) => { const t = (bx[0] - p[0]) / (q[0] - p[0]); return [bx[0], p[1] + t * (q[1] - p[1])]; }],
    [p => p[0] <= bx[1], (p, q) => { const t = (bx[1] - p[0]) / (q[0] - p[0]); return [bx[1], p[1] + t * (q[1] - p[1])]; }],
    [p => p[1] >= bx[2], (p, q) => { const t = (bx[2] - p[1]) / (q[1] - p[1]); return [p[0] + t * (q[0] - p[0]), bx[2]]; }],
    [p => p[1] <= bx[3], (p, q) => { const t = (bx[3] - p[1]) / (q[1] - p[1]); return [p[0] + t * (q[0] - p[0]), bx[3]]; }]];
  for (const [inside, cut] of edges) {
    const out = []; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; if (inside(p)) { out.push(p); if (!inside(q)) out.push(cut(p, q)); } else if (inside(q)) out.push(cut(p, q)); }
    poly = out; if (!poly.length) return 0;
  }
  let s = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; s += p[0] * q[1] - q[0] * p[1]; } return Math.abs(s) / 2;
}
 
function rectUnionArea(rs, bx) {
  const C = rs.map(r => [Math.max(r[0], bx[0]), Math.min(r[1], bx[1]), Math.max(r[2], bx[2]), Math.min(r[3], bx[3])]).filter(r => r[1] > r[0] && r[3] > r[2]);
  if (!C.length) return 0;
  const xs = uniqRaw(C.flatMap(r => [r[0], r[1]])), ys = uniqRaw(C.flatMap(r => [r[2], r[3]])); let a = 0;
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) { const p = [(xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2]; if (C.some(r => r[0] <= p[0] && p[0] <= r[1] && r[2] <= p[1] && p[1] <= r[3])) a += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]); }
  return a;
}
 
function boundaryNear(rs, near, dist) {
  const out = [];
  for (const e of boundary(rs)) {
    const iv = [];
    for (const q of near) {
      const dd = e.o === 'v' ? Math.max(q[0] - e.c, 0, e.c - q[1]) : Math.max(q[2] - e.c, 0, e.c - q[3]);
      if (dd > dist + 1e-12) continue;
      const ext = Math.sqrt(Math.max(0, dist * dist - dd * dd)), lo = (e.o === 'v' ? q[2] : q[0]) - ext, hi = (e.o === 'v' ? q[3] : q[1]) + ext;
      const a = Math.max(e.a, lo), b = Math.min(e.b, hi); if (b > a + 1e-12) iv.push([a, b]);
    }
    iv.sort((p, q) => p[0] - q[0]); const M = [];
    for (const v of iv) { const l = M[M.length - 1]; if (l && v[0] <= l[1] + 1e-12) l[1] = Math.max(l[1], v[1]); else M.push(v.slice()); }
    for (const [a, b] of M) out.push(e.o === 'v' ? [[e.c, a], [e.c, b]] : [[a, e.c], [b, e.c]]);
  }
  return out;
}
 
function chains(pieces) {
  const key = p => `${Math.round(p[0] * 1e6)},${Math.round(p[1] * 1e6)}`, used = new Array(pieces.length).fill(false), out = [];
  const deg = new Map(); for (const [a, b] of pieces) for (const p of [a, b]) deg.set(key(p), (deg.get(key(p)) || 0) + 1);
  const grow = (ch, atEnd) => { for (;;) { const end = atEnd ? ch[ch.length - 1] : ch[0]; if (deg.get(key(end)) !== 2) return; let found = false;
    for (let j = 0; j < pieces.length; j++) if (!used[j]) { const [a, b] = pieces[j]; const nxt = key(a) === key(end) ? b : key(b) === key(end) ? a : null;
      if (nxt) { used[j] = true; if (atEnd) ch.push(nxt); else ch.unshift(nxt); found = true; break; } }
    if (!found) return; } };
  for (let i = 0; i < pieces.length; i++) { if (used[i]) continue; used[i] = true; const ch = [pieces[i][0], pieces[i][1]]; grow(ch, true); grow(ch, false); out.push(ch); }
  return out;
}
const chainLen = ch => ch.slice(1).reduce((s, p, i) => s + hyp(p[0] - ch[i][0], p[1] - ch[i][1]), 0);

 
const DG0 = 0.05;
function inload(rooms, u, v, o) {
  const pts = o === 'v' ? [[u + 0.3, v], [u - 0.3, v]] : [[u, v + 0.3], [u, v - 0.3]];
  return rooms.some(x => x.g === 'load' && x.r.some(r => pts.some(p => r[0] < p[0] && p[0] < r[1] && r[2] < p[1] && p[1] < r[3])));
}
function pubOk(G, st, d, k) { if (dcGround(G, outsidePoint(G, st, d[3], d[4], d[5]))) return false; if (k === 'scor') return true; return dcRoute(G, st, d[3], d[4], d[5])[0]; }
function exitIdent(G, rooms, K, st, other, d, k, strict) {
  const r2k = v => pyRound2(v);
  if (other === 'OUT' || other === 'YARD') {
    if (inload(rooms, d[3], d[4], d[5])) return new Set();
    if ((k === 'pcor' || k === 'ccor' || strict) && !pubOk(G, st, d, k)) return new Set();
    return new Set([`OUT|${st}|${r2k(d[3])}|${r2k(d[4])}`]);
  }
  if (!(other in K)) return new Set();
  const x = rooms.find(y => y.id === other);
  if ((K[other] === 'pcore' || K[other] === 'score') && x.stair) return new Set([`stair|${other}`]);
  if (K[other] === 'lobby' && k !== 'pcor') return new Set();
  if (K[other] !== 'exitpas' && K[other] !== 'lobby') return new Set();
  const seen = new Set([other]), todo = [other], outs = new Set();
  while (todo.length) {
    const c = todo.pop();
    for (const e of G.D) {
      if (e[0] !== st || !(c === e[1] || c === e[2])) continue;
      const o2 = e[1] === c ? e[2] : e[1];
      if (o2 === 'OUT' || o2 === 'YARD') { if (!inload(rooms, e[3], e[4], e[5]) && !((k === 'pcor' || k === 'ccor' || strict) && !pubOk(G, st, e, k))) outs.add(`OUT|${st}|${r2k(e[3])}|${r2k(e[4])}`); }
      else if (o2 in K && !seen.has(o2) && (K[o2] === 'exitpas' || K[o2] === 'lobby') && (K[o2] === K[other] || K[other] === 'lobby')) { seen.add(o2); todo.push(o2); }
    }
  }
  return outs;
}
const ck = (a, b) => a + ',' + b, cxy = s => s.split(',').map(Number);
function cline(r) {
  const a0 = pyRoundInt(r[0] / DG0), a1 = pyRoundInt(r[1] / DG0), b0 = pyRoundInt(r[2] / DG0), b1 = pyRoundInt(r[3] / DG0);
  const am = Math.floor((a0 + a1 - 1) / 2), bm = Math.floor((b0 + b1 - 1) / 2), w = r[1] - r[0], h = r[3] - r[2], out = new PySet();
  if (w >= h / 1.5) { const c = new PySet(); for (let a = a0; a < a1; a++) c.add(a, bm); out.merge(c); }
  if (h >= w / 1.5) { const c = new PySet(); for (let b = b0; b < b1; b++) c.add(am, b); out.merge(c); }
  return out.order();
}
function lpath(p, q) {
  const out = new Set(); let [a, b] = p;
  let step = q[0] >= a ? 1 : -1; while (a !== q[0]) { out.add(ck(a, b)); a += step; }
  step = q[1] >= b ? 1 : -1; while (b !== q[1]) { out.add(ck(a, b)); b += step; }
  out.add(ck(q[0], q[1])); return out;
}
 
function centreline(rs) {
  const CL = rs.map(r => [r, cline(r)]), cells = new Set(); for (const [, c] of CL) for (const z of c) cells.add(z);
  for (let i = 0; i < CL.length; i++) for (let j = i + 1; j < CL.length; j++) {
    const [r, ci] = CL[i], [q, cj] = CL[j], ou = Math.min(r[1], q[1]) - Math.max(r[0], q[0]), ov = Math.min(r[3], q[3]) - Math.max(r[2], q[2]);
    let m;
    if ((Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(q[1] - r[0]) < 1e-6) && ov > 0.3) { const ue = Math.abs(r[1] - q[0]) < 1e-6 ? r[1] : r[0]; m = [ue, (Math.max(r[2], q[2]) + Math.min(r[3], q[3])) / 2]; }
    else if ((Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(q[3] - r[2]) < 1e-6) && ou > 0.3) { const ve = Math.abs(r[3] - q[2]) < 1e-6 ? r[3] : r[2]; m = [(Math.max(r[0], q[0]) + Math.min(r[1], q[1])) / 2, ve]; }
    else continue;
    for (const [rr, cc] of [[r, ci], [q, cj]]) {
      const ma = Math.min(Math.max(Math.floor(m[0] / DG0), pyRoundInt(rr[0] / DG0)), pyRoundInt(rr[1] / DG0) - 1);
      const mb = Math.min(Math.max(Math.floor(m[1] / DG0), pyRoundInt(rr[2] / DG0)), pyRoundInt(rr[3] / DG0) - 1);
      const tgt = pyMin(setOrder(cc), c => { const [x, y] = cxy(c); return Math.abs(x - ma) + Math.abs(y - mb); });
      for (const z of lpath([ma, mb], cxy(tgt))) cells.add(z);
    }
  }
  return [cells, CL];
}
const pyMin = (arr, f) => { let best = null, bv = Infinity, n = 0; for (const x of arr) { const v = f(x); if (v < bv) { bv = v; best = x; n = 1; } else if (v === bv) n++; } if (n > 1) TIES.push(bv); return best; };
const pyMax = (arr, f) => { let best = null, bv = -Infinity; for (const x of arr) { const v = f(x); if (v > bv) { bv = v; best = x; } } return best; };
function project(CL, u, v) {
  let best = null;
  for (const [r, cc] of CL) {
    if (!(r[0] - 1e-6 <= u && u <= r[1] + 1e-6 && r[2] - 1e-6 <= v && v <= r[3] + 1e-6) || !cc.length) continue;
    const dist = c => { const [x, y] = cxy(c); return pyHypot((x + 0.5) * DG0 - u, (y + 0.5) * DG0 - v); };
    const c = pyMin(setOrder(cc), dist), dd = dist(c);
    if (best === null || dd < best[0]) best = [dd, c];
  }
  return best ? best[1] : null;
}
function dijkstraCells(cells, src) {
  const D = new Map(); for (const q of src) D.set(q, 0.0);
  const heap = src.map(q => [0.0, q]); heap.sort((a, b) => a[0] - b[0]);
   
  const H = []; const push = e => { H.push(e); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[i][0] < H[p][0]) { [H[i], H[p]] = [H[p], H[i]]; i = p; } else break; } };
  const pop = () => { const t = H[0], l = H.pop(); if (H.length) { H[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === i) break; [H[i], H[m]] = [H[m], H[i]]; i = m; } } return t; };
  for (const e of heap) push(e);
  while (H.length) {
    const [dd, c] = pop(); if (dd > D.get(c)) continue; const [x, y] = cxy(c);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = ck(x + dx, y + dy); if (cells.has(n) && dd + DG0 < (D.has(n) ? D.get(n) : 1e9)) { D.set(n, dd + DG0); push([dd + DG0, n]); } }
  }
  return D;
}
function corridors(G, opt) {
  const strict = !!(opt && opt.strict), out = [];
  for (const st of Object.keys(G.S).map(Number)) {    
    const rooms = roomsOf(G, st), K = {}; for (const x of rooms) K[x.id] = kind(x, st);
    const groups = new Map();
    for (const x of rooms) if (['pcor', 'ccor', 'scor'].includes(K[x.id])) { if (!groups.has(K[x.id])) groups.set(K[x.id], []); groups.get(K[x.id]).push(x); }
    for (const [k, xs] of groups) {
      const xid = xs.map(y => y.id).join('+'), xr = xs.flatMap(y => y.r), ids = new Set(xs.map(y => y.id));
      const [cells, CL] = centreline(xr), ex = new Map(), idn = new Map();
      for (const d of G.D) {
        if (d[0] !== st || !(ids.has(d[1]) || ids.has(d[2])) || (ids.has(d[1]) && ids.has(d[2]))) continue;
        const other = ids.has(d[1]) ? d[2] : d[1], ident = exitIdent(G, rooms, K, st, other, d, k, strict);
        if (!ident.size) continue;
        const c0 = project(CL, d[3], d[4]); if (c0 === null) continue;
        const kk = `${other}|${pyRound2(d[3])}|${pyRound2(d[4])}`; ex.set(kk, [c0]); idn.set(kk, ident);
      }
      const dmap = new Map(); for (const [kk, c] of ex) dmap.set(kk, dijkstraCells(cells, c));
      const names = [...dmap.keys()], two = new Set();
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        const a = dmap.get(names[i]), b = dmap.get(names[j]);
        if ([...idn.get(names[i])].some(z => idn.get(names[j]).has(z))) continue;
        const reach_ = ex.get(names[j]).filter(q => a.has(q)).map(q => a.get(q)); if (!reach_.length) continue;
        const L = Math.min(...reach_); for (const c of cells) if (a.has(c) && b.has(c) && a.get(c) + b.get(c) <= L + 1e-6) two.add(c);
      }
      let worst;
      if (two.size) {
        for (const kk of names) if ([...dmap.get(kk).keys()].some(c => two.has(c))) for (const c of ex.get(kk)) two.add(c);
        const rest = new Set([...cells].filter(c => !two.has(c))), seen = new Set();
        for (const c0 of [...rest]) {
          if (seen.has(c0)) continue; const comp = new Set([c0]), q = [c0]; seen.add(c0);
          while (q.length) { const [x, y] = cxy(q.pop()); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = ck(x + dx, y + dy); if (rest.has(n) && !seen.has(n)) { seen.add(n); comp.add(n); q.push(n); } } }
          const touch = [...comp].filter(c => { const [x, y] = cxy(c); return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => two.has(ck(x + dx, y + dy))); });
          let groupsN = 0; const left = new Set(touch);
          while (left.size) { groupsN++; const f = left.values().next().value; left.delete(f); const s2 = [f]; while (s2.length) { const [x, y] = cxy(s2.pop()); for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) { const n = ck(x + dx, y + dy); if (left.has(n)) { left.delete(n); s2.push(n); } } } }
          if (groupsN >= 2) for (const c of comp) two.add(c);
        }
        const dt = dijkstraCells(cells, [...two]);
        for (const c of cells) if (!dt.has(c)) { let m = Infinity; for (const kk of names) if (dmap.get(kk).has(c)) m = Math.min(m, dmap.get(kk).get(c)); dt.set(c, m); }
        worst = dt.size ? Math.max(...dt.values()) : 0.0;
      } else if (names.length) worst = Math.max(...dmap.get(names[0]).values());
      else worst = Infinity;
      out.push([st, xid, k, names.length, worst < Infinity ? pyRound2(worst + (names.length ? DG0 / 2 : 0)) : Infinity, [...new Set(names.map(n => n.split('|')[0]))].sort()]);
    }
  }
  return out;
}

 
const dseg = d => { const w = (d.length > 6 ? d[6] : 0.9) / 2; return d[5] === 'v' ? [[d[3], d[4] - w], [d[3], d[4] + w]] : [[d[3] - w, d[4]], [d[3] + w, d[4]]]; };
const pts21 = s => { const o = []; for (let t = 0; t <= 20; t++) o.push([s[0][0] + (s[1][0] - s[0][0]) * t / 20, s[0][1] + (s[1][1] - s[0][1]) * t / 20]); return o; };
function segDist21(a, b) { let m = Infinity; for (const p of pts21(a)) for (const q of pts21(b)) m = Math.min(m, hyp(p[0] - q[0], p[1] - q[1])); return m; }
function egress2(G) {
  const out = [];
  for (const st of storeys(G)) for (const x of roomsOf(G, st)) {
    const K = {}; for (const y of roomsOf(G, st)) K[y.id] = kind(y, st);
    const n = x.n.toLowerCase();
    if (x.g !== 'pub' || !(n.includes('refuge') || n.includes('shelter')) || n.includes('staff') || n.includes('storage')) continue;
    const A = x.r.reduce((s, r) => s + rArea(r), 0), load = Math.floor(A / 0.75);
    const u0 = Math.min(...x.r.map(r => r[0])), u1 = Math.max(...x.r.map(r => r[1])), v0 = Math.min(...x.r.map(r => r[2])), v1 = Math.max(...x.r.map(r => r[3])), diag = hyp(u1 - u0, v1 - v0);
    const other = d => d[1] === x.id ? d[2] : d[1];
    const doors = G.D.filter(d => d[0] === st && (d[1] === x.id || d[2] === x.id) && (['OUT', 'YARD'].includes(other(d)) || ['lobby', 'pcor', 'ccor', 'exitpas'].includes(K[other(d)])));
    let best = 0.0; for (let i = 0; i < doors.length; i++) for (let j = i + 1; j < doors.length; j++) best = Math.max(best, segDist21(dseg(doors[i]), dseg(doors[j])));
    const need = A > 45 + 1e-9, ok = !need || (doors.length >= 2 && best >= diag / 3 - 1e-6);
    const row = [x.id, pyRound1(A), need && load <= 60 ? pyRound1(A / 0.75) : load, doors.length, pyRound1(best), pyRound1(diag / 3), ok ? 'ok' : 'FAIL']; row.f2 = need && load <= 60; out.push(row);
  }
  return out;
}
const LIM3 = { 'F-2': 200, 'A': 200, 'D': 300 };
function egress3(G) {
  const out = [];
  for (const st of Object.keys(G.S).map(Number)) {
    const rooms = roomsOf(G, st), K = {}; for (const y of rooms) K[y.id] = kind(y, st);
    const units = [];
    for (const x of rooms) { const n = x.n.toLowerCase(); if (x.g === 'hall') units.push(['F-2', x.n, new Set([x.id]), x.r]); else if (x.g === 'pub' && (n.includes('refuge') || n.includes('shelter')) && !n.includes('staff') && !n.includes('storage')) units.push(['A', x.n, new Set([x.id]), x.r]); }
    const cl = rooms.filter(x => x.g === 'clin' || x.id === 'ccor');
    if (cl.length) units.push(['D', 'Clinic suite', new Set(cl.map(x => x.id)), cl.flatMap(x => x.r)]);
    for (const [grp, name, ids, rs] of units) {
      const A = rs.reduce((s, r) => s + rArea(r), 0), okK = ['lobby', 'pcor', 'ccor', 'scor', 'exitpas', 'pcore', 'score'];
      const oth = d => ids.has(d[1]) ? d[2] : d[1];
      let doors = G.D.filter(d => d[0] === st && (ids.has(d[1]) !== ids.has(d[2])) && (['OUT', 'YARD'].includes(oth(d)) || okK.includes(K[oth(d)])));
      if (grp === 'D') doors = doors.filter(d => K[oth(d)] !== 'ccor');
      const u0 = Math.min(...rs.map(r => r[0])), u1 = Math.max(...rs.map(r => r[1])), v0 = Math.min(...rs.map(r => r[2])), v1 = Math.max(...rs.map(r => r[3])), diag = hyp(u1 - u0, v1 - v0);
      let best = 0.0; for (let i = 0; i < doors.length; i++) for (let j = i + 1; j < doors.length; j++) best = Math.max(best, segDist21(dseg(doors[i]), dseg(doors[j])));
      let far = 0.0;
      for (const r of rs) for (let i = 0; i < Math.trunc((r[1] - r[0]) / 0.5) + 1; i++) for (let j = 0; j < Math.trunc((r[3] - r[2]) / 0.5) + 1; j++) {
        const p = [Math.min(r[0] + i * 0.5, r[1]), Math.min(r[2] + j * 0.5, r[3])];
        far = Math.max(far, doors.length ? Math.min(...doors.map(d => hyp(p[0] - d[3], p[1] - d[4]))) : 1e9);
      }
      const need = A > LIM3[grp] || far > 25, ok = !need || (doors.length >= 2 && best >= diag / 3 - 1e-6);
      out.push({ st, grp, name, A: pyRound1(A), lim: LIM3[grp], need, n: doors.length, apart: pyRound1(best), third: pyRound1(diag / 3), far: pyRound1(far), ok, doors: doors.map(d => [d[1], d[2], d[3], d[4]]) });
    }
  }
  return out;
}

 
function walkload(G) {
  const S1 = roomsOf(G, 1), K = {}; for (const x of S1) K[x.id] = kind(x, 1);
  const ra = x => x.r.reduce((s, r) => s + rArea(r), 0);
  const hub = Math.ceil(S1.filter(x => x.g === 'pub' && (x.n.toLowerCase().includes('refuge') || x.n.toLowerCase().includes('shelter')) && !x.n.toLowerCase().includes('storage')).reduce((s, x) => s + ra(x), 0) / 0.75);
  const clin1 = Math.ceil(S1.filter(x => x.g === 'clin').reduce((s, x) => s + ra(x), 0) / 9.3), clin2 = Math.ceil(roomsOf(G, 2).filter(x => x.g === 'clin').reduce((s, x) => s + ra(x), 0) / 9.3);
  const pub = ['pub', 'grow', 'circ'], byId = id => S1.find(x => x.id === id);
  const hubExits = G.D.filter(d => d[0] === 1 && ['OUT', 'YARD'].includes(d[2]) && byId(d[1]) && pub.includes(byId(d[1]).g) && !byId(d[1]).core);
  const W = (get(G, 'WALK', []) || []).slice(), touch = (a, b) => a[0] <= b[1] + 1e-6 && b[0] <= a[1] + 1e-6 && a[2] <= b[3] + 1e-6 && b[2] <= a[3] + 1e-6;
  let groups = [];
  for (const w of W) { const g = groups.filter(x => x.some(y => touch(w, y))); const nw = [w].concat(...g); groups = groups.filter(x => !g.includes(x)).concat([nw]); }
  const per = new Map();
  for (const w of W) {
    const on = G.D.filter(d => d[0] === 1 && ['OUT', 'YARD'].includes(d[2]) && inShape(w, ...outsidePoint(G, 1, d[3], d[4], d[5])));
    let share = 0.0; const full = new Map(), names = [];
    for (const d of on) {
      const x = byId(d[1]); let s, f, cat;
      if (x.core && x.stair && x.g === 'sup') { const loads = storeys(G).filter(st => st >= 2).map(st => Math.ceil(roomsOf(G, st).filter(y => ['sup', 'hall', 'spare'].includes(y.g) && !y.core).reduce((a, y) => a + ra(y), 0) / 46.0)); f = loads.length ? Math.max(...loads) : 0; s = f / 2; cat = 'dc'; }
      else if (x.core && x.g === 'circ' && clin2) { s = clin2 / 2; f = clin2; cat = 'clin2'; }
      else if (x.g === 'clin' || (K[d[1]] === 'exitpas' && clin1 && G.D.some(e => e[0] === 1 && (e[1] === d[1] || e[2] === d[1]) && K[e[2] === d[1] ? e[1] : e[2]] === 'ccor'))) { s = clin1 / 2; f = clin1; cat = 'clin1'; }
      else if (pub.includes(x.g)) { s = hub / Math.max(hubExits.length, 1); f = hub; cat = 'hub'; }
      else { s = 0; f = 0; cat = 'none'; }
      share += s; full.set(cat, f); names.push(d[1]);
    }
    per.set(w, [share, full, names]);
  }
  const out = [];
  for (const grp of groups) {
    const share = grp.reduce((a, w) => a + per.get(w)[0], 0), full = new Map(), names = [];
    for (const w of grp) { for (const [k, v] of per.get(w)[1]) full.set(k, v); names.push(...per.get(w)[2]); }
    const fl = [...full.values()].reduce((a, b) => a + b, 0), width = Math.min(...grp.map(w => Math.min(w[1] - w[0], w[3] - w[2])));
    const need = Math.max(1.1, share * 0.0061), needf = Math.max(1.1, fl * 0.0061);
    out.push([grp.map(w => w.map(v => pyRound2(v))), names, pyRoundInt(share), fl, pyRound2(width), pyRound2(need), pyRound2(needf), width + 1e-6 >= need ? 'ok' : 'FAIL']);
  }
  return [out, hub, hubExits.length];
}

 
const HUBPLANT = new Set(['pmec', 'mec']);
const side2h = x => (['pub', 'grow', 'circ'].includes(x.g) || HUBPLANT.has(x.id)) ? 'hub' : x.g === 'clin' ? null : ['sup', 'hall', 'load', 'plant'].includes(x.g) ? 'dc' : null;
function sep2hWalls(G, cfg) {
  const out = new Map();
  for (const st of Object.keys(G.S).map(Number)) {
    const rooms = roomsOf(G, st), H_ = rooms.filter(x => side2h(x) === 'hub').flatMap(x => x.r), D_ = rooms.filter(x => side2h(x) === 'dc').flatMap(x => x.r);
    if (!H_.length || !D_.length) continue;
    const w = chains(boundaryNear(H_, D_, 0.02));
    const L = w.map(chainLen).filter(l => l > 0.05).reduce((a, b) => a + b, 0);
    if (L < 0.3) continue;
    const marks = ((cfg.two_hour || {})[String(st)] || (cfg.two_hour || {})[st] || []);
    let U = 0;
    for (const ch of w) {    
      const segs = [];
      for (let i = 0; i < ch.length - 1; i++) {
        const a = ch[i], b = ch[i + 1], o = Math.abs(a[0] - b[0]) < 1e-9 ? 'v' : 'h';
        const e = o === 'v' ? { o, c: a[0], a: Math.min(a[1], b[1]), b: Math.max(a[1], b[1]) } : { o, c: a[1], a: Math.min(a[0], b[0]), b: Math.max(a[0], b[0]) };
        const cut = [];
        for (const q of marks) { const dd = o === 'v' ? Math.max(q[0] - e.c, 0, e.c - q[1]) : Math.max(q[2] - e.c, 0, e.c - q[3]); if (dd > 0.2) continue; const ext = Math.sqrt(0.04 - dd * dd); cut.push([(o === 'v' ? q[2] : q[0]) - ext, (o === 'v' ? q[3] : q[1]) + ext]); }
        cut.sort((p, q) => p[0] - q[0]); let cur = e.a;
        for (const [lo, hi] of cut) { if (lo > cur) segs.push(o === 'v' ? [[e.c, cur], [e.c, Math.min(lo, e.b)]] : [[cur, e.c], [Math.min(lo, e.b), e.c]]); cur = Math.max(cur, hi); if (cur >= e.b) break; }
        if (cur < e.b) segs.push(o === 'v' ? [[e.c, cur], [e.c, e.b]] : [[cur, e.c], [e.b, e.c]]);
      }
      U += chains(segs.filter(([a, b]) => hyp(a[0] - b[0], a[1] - b[1]) > 1e-9)).map(chainLen).filter(l => l > 0.3).reduce((a, b) => a + b, 0);
    }
    out.set(st, [L, U]);
  }
  return out;
}
function sep2hText(G, cfg) {
  const W = sep2hWalls(G, cfg);
  if (!W.size) return ['pass', 'no storey where hub rooms meet data-centre rooms [script]'];
  const bad = [...W.values()].some(([, u]) => u > 0.3);
  const t = [...W.entries()].sort((a, b) => a[0] - b[0]).map(([st, [L, u]]) => `storey ${st}: 2 h walls between the hub and the data-centre rooms, cores, bays and plant beside it, ${pyFixed(L, 1)} m` + (u > 0.3 ? `, ${pyFixed(u, 1)} m NOT marked` : ', all dashed')).join('; ');
  return [bad ? 'fail' : 'pass', t + ' [script, eh/sep2h.py]'];
}
 
const TIES = [];
const M64 = (1n << 64n) - 1n, XP1 = 11400714785074694791n, XP2 = 14029467366897019727n, XP5 = 2870177450012600261n;
function pyHashInt(n) { const h = BigInt(n === -1 ? -2 : n); return h & M64; }
function pyHashTuple2(a, b) {
  let acc = XP5;
  for (const v of [a, b]) { const lane = pyHashInt(v); acc = (acc + lane * XP2) & M64; acc = ((acc << 31n) | (acc >> 33n)) & M64; acc = (acc * XP1) & M64; }
  acc = (acc + (2n ^ (XP5 ^ 3527539n))) & M64;
  if (acc === M64) return 1546275796n;
  return acc;
}
class PySet {
  constructor() { this.mask = 7; this.table = new Array(8).fill(null); this.fill = 0; this.used = 0; }
  static key(a, b) { return a + ',' + b; }
  insertClean(table, mask, e) {
    let perturb = e.h, i = Number(e.h & BigInt(mask));
    for (;;) {
      if (table[i] === null) { table[i] = e; return; }
      if (i + 9 <= mask) for (let j = 0; j < 9; j++) { i++; if (table[i] === null) { table[i] = e; return; } }
      perturb >>= 5n; i = Number((BigInt(i) * 5n + 1n + perturb) & BigInt(mask));
    }
  }
  resize(minused) {
    let n = 8; while (n <= minused) n <<= 1;
    const old = this.table, nt = new Array(n).fill(null), nm = n - 1;
    for (const e of old) if (e !== null) this.insertClean(nt, nm, e);
    this.table = nt; this.mask = nm; this.fill = this.used;
  }
  addEntry(e) {
    let perturb = e.h, i = Number(e.h & BigInt(this.mask));
    for (;;) {
      let probes = (i + 9 <= this.mask) ? 9 : 0, idx = i;
      do {
        const t = this.table[idx];
        if (t === null) { this.table[idx] = e; this.fill++; this.used++; if (this.fill * 5 < this.mask * 3) return; this.resize(this.used > 50000 ? this.used * 2 : this.used * 4); return; }
        if (t.h === e.h && t.k === e.k) return;
        idx++;
      } while (probes-- > 0);
      perturb >>= 5n; i = Number((BigInt(i) * 5n + 1n + perturb) & BigInt(this.mask));
    }
  }
  add(a, b) { this.addEntry({ k: PySet.key(a, b), h: pyHashTuple2(a, b) }); return this; }
  merge(o) {    
    if (o === this || o.used === 0) return this;
    if ((this.fill + o.used) * 5 >= this.mask * 3) this.resize((this.used + o.used) * 2);
    if (this.fill === 0 && this.mask === o.mask && o.fill === o.used) { this.table = o.table.slice(); this.fill = o.fill; this.used = o.used; return this; }
    if (this.fill === 0) { this.fill = o.used; this.used = o.used; for (const e of o.table) if (e !== null) this.insertClean(this.table, this.mask, e); return this; }
    for (const e of o.table) if (e !== null) this.addEntry(e);
    return this;
  }
  order() { return this.table.filter(e => e !== null).map(e => e.k); }
}
const setOrder = arr => arr;

 
const pyNum = v => typeof v === 'number' ? (Number.isInteger(v) ? v.toFixed(1) : (v === Infinity ? 'inf' : v === -Infinity ? '-inf' : String(v))) : String(v);
const pyTuple = a => '(' + a.map(v => typeof v === 'string' ? `'${v}'` : Array.isArray(v) ? pyTuple(v) : pyNum(v)).join(', ') + (a.length === 1 ? ',' : '') + ')';
const n1i = x => x === Infinity ? 'inf' : n1(x);

 
function truckRoutesAll(G) {    
  const TR = get(G, 'TRUCK_ROUTES', null), d = TR !== null ? Object.assign({}, TR) : {};
  for (const k of ['DRIVE', 'APRON', 'AISLE', 'COURT', 'YARD_AISLE']) if (G[k] !== undefined && G[k] !== null && !(k in d)) d[k] = G[k];
  return d;
}
const prect = x => Array.isArray(x.r[0]) ? x.r[0] : x.r;
function padAnalyse(G) {
  const PL = G.PLANT || [], pads = PL.filter(x => x.id.startsWith('t'));
  if (!pads.length) return null;
  const S1 = roomsOf(G, 1), bldR = S1.filter(x => !x.id.startsWith('alc')).flatMap(x => x.r), alc = S1.filter(x => x.id.startsWith('alc'));
  const gens_ = PL.filter(x => x.id.startsWith('g')).map(prect);
  const chl = PL.filter(x => x.id.startsWith('c')).map(prect).concat((get(G, 'CHILL', []) || []).filter(r => rectUnionArea(bldR, r) < 0.5));
  const vg = get(G, 'VGATES', []) || [], gatePolys = vg.map(([a, b]) => flatBuf(a, b, 0.08));
  const fl = (get(G, 'PLANT_YARDS', []) || []).map(polyOf).concat((get(G, 'WALK', []) || []).map(polyOf));
  const strip = get(G, 'STRIP', null); if (strip !== null) fl.push(polyOf(strip));
  const fenceSegs = []; for (const P of fl) for (const [a, b] of edgesOf(P)) fenceSegs.push(...(gatePolys.length ? segMinus(a, b, gatePolys) : [[a, b]]));
  const lot = G.LOTPOLY.map(p => [p[0], p[1]]), se = get(G, 'STREET_EDGES', []) || [], streetPolys = se.map(([a, b]) => flatBuf(a, b, 0.3));
  const lotSegs = []; for (const [a, b] of edgesOf(lot)) lotSegs.push(...(streetPolys.length ? segMinus(a, b, streetPolys) : [[a, b]]));
  const TR = Object.entries(truckRoutesAll(G)).map(([k, v]) => [k, polyOf(v)]);
  const lineBufs = fenceSegs.concat(lotSegs).map(([a, b]) => { const L = hyp(b[0] - a[0], b[1] - a[1]) || 1, ex = 0.02 / L, a2 = [a[0] - (b[0] - a[0]) * ex, a[1] - (b[1] - a[1]) * ex], b2 = [b[0] + (b[0] - a[0]) * ex, b[1] + (b[1] - a[1]) * ex]; return flatBuf(a2, b2, 0.02); });
  const out = [], P = pads.map(x => [x.id, prect(x)]);
  for (const [pid, r] of P) {
    const others = P.filter(([i]) => i !== pid).map(([, q]) => q), pb = gBox(r), bd = q => gPolyD(pb, gBox(q));
    const inalc = alc.some(a => { const q = a.r[0]; return q[0] - 0.05 <= r[0] && r[1] <= q[1] + 0.05 && q[2] - 0.05 <= r[2] && r[3] <= q[3] + 0.05; });
    const d = { id: pid };
    d.bld = bldR.length ? Math.min(...bldR.map(bd)) : 0;
    d.gen = gens_.length ? Math.min(...gens_.map(bd)) : 99;
    d.chl = chl.length ? Math.min(...chl.map(bd)) : 99;
    d.fence = fenceSegs.length ? gPolySegs(pb, fenceSegs) : 99;
    d.pad = others.length ? Math.min(...others.map(bd)) : 99;
    const rectObs = bldR.concat(gens_, chl, others);
    const [u0, u1, v0, v1] = r;
    const frontBox = (k, t) => ({ S: [u0, u1, v0 - t, v0], N: [u0, u1, v1, v1 + t], W: [u0 - t, u0, v0, v1], E: [u1, u1 + t, v0, v1] })[k];
    const blocked = bx => { if (bx[1] - bx[0] <= 0 || bx[3] - bx[2] <= 0) return 0; let a = rectUnionArea(rectObs, bx); for (const L of lineBufs) { a += clipArea(L, bx); if (a >= 0.01) break; } return a; };
    d.depth = {}; for (const k of ['S', 'N', 'W', 'E']) { let got = 0.0; for (let x = 40; x >= 0; x--) { const t = x / 10; if (blocked(frontBox(k, t)) < 0.01) { got = t; break; } } d.depth[k] = got; }
    d.alcove = inalc;
    d.metal3 = [['generator sets', d.gen], ['chillers', d.chl], ['fence or gate', d.fence]].filter(([, v]) => v < 3.0).map(([n]) => n);
    d.bld3 = d.bld < 3.0 && !inalc;
    d.truck = TR.filter(([, t]) => gPolyD(pb, t) < 3.0).map(([k]) => k).sort();
    d.street = streetPolys.length > 0 && Math.min(...streetPolys.map(s => gPolyD(pb, s))) < 3.0;
    out.push(d);
  }
  return out;
}
function bondRow(G, city) {
  const A = padAnalyse(G);
  if (!A) return ['pass', 'Pad bonding and bollards', 'BC Hydro ES54 F0-02.02, .03', 'no transformer pads on this lot'];
  const src = 'BC Hydro ES54 F0-02.02 (Mechanical Protection), F0-02.03 (Grounding), Sep 2022' + (city === 'V' ? '' : '; EPCOR rule not read ?, BC Hydro read as the analogue (our reading)');
  const metal = [...new Set(A.flatMap(d => d.metal3))].sort(), bld = A.some(d => d.bld3), truck = [...new Set(A.flatMap(d => d.truck))].sort(), street = A.some(d => d.street);
  const parts = [];
  if (metal.length) parts.push('bond to the transformer ground: ' + metal.join(', ') + ' within 3 m (fence material ?)');
  if (bld) parts.push(`pad ${pyFixed(Math.min(...A.map(d => d.bld)), 1)} m from the building: if its walls are conductive or carry metal, ES54 F3-07 and a stamped grounding report (wall material ?)`);
  if (truck.length || street) parts.push('bollards (ES54 U2-02): within 3 m of ' + truck.map(t => t.toLowerCase().replace(/_/g, ' ')).concat(street ? ['a street or lane'] : []).join(', ') + '; roadway concrete barriers to be considered for trucks (F0-02.02)');
  if (!parts.length) return ['pass', 'Pad bonding and bollards', src, 'no metal, building or truck route within 3 m of the pads'];
  return ['tight', 'Pad bonding and bollards', src, 'check in design: ' + parts.join('; ')];
}

 
const GEN_H = 3.5, CH_H = 2.90, WALL_Z = 1.5, ROOF_Z = 0.3, NEED_I = { gen: 3.0, bay: 7.6, chill: 7.6, art: 7.6 }, GEN_TIGHT = 10.0;
const zsOf = G => { const z = [get(G, 'SLAB', 0.0)]; for (const h of G.H) z.push(z[z.length - 1] + h); return z; };
const isGenRoom = x => x.id === 'gen' || x.n.toLowerCase().startsWith('generator');
function intakeSources(G, cfg) {
  const zs = zsOf(G), src = [];
  for (const p of (G.PLANT || [])) { const r = prect(p); if (p.n.includes('enerator')) src.push(['gen', ['box', r], 0.0, GEN_H]); if (p.n.includes('hiller')) src.push(['chill', ['box', r], 0.0, CH_H]); }
  for (const st of Object.keys(G.S).map(Number)) for (const x of roomsOf(G, st)) {
    const n = x.n.toLowerCase();
    if (isGenRoom(x)) for (const r of x.r) src.push(['gen', ['box', r], zs[st - 1], zs[st - 1] + GEN_H]);
    if (x.g === 'load' && ['bay', 'loading space', 'apron', 'truck court'].some(k => n.includes(k)) && !n.includes('lobby')) for (const r of x.r) src.push(['bay', ['box', r], 0.0, 0.0]);
  }
  for (const poly of (get(G, 'TRUCK_GROUND', []) || [])) src.push(['bay', ['poly', poly], 0.0, 0.0]);
  const units = cfg.chill_units;
  if (T(units)) for (const [r, s, b] of units) src.push(['chill', ['box', r], b, b + CH_H]);
  else { const seen = []; for (const r of (cfg.chill_rects || []).concat(get(G, 'CHILL', []) || [])) { if (seen.some(q => r.every((a, i) => Math.abs(a - q[i]) < 0.01))) continue; seen.push(r); const b = cfg.chill_base !== undefined && cfg.chill_base !== null ? cfg.chill_base : zs[cfg.chill_storey !== undefined && cfg.chill_storey !== null ? cfg.chill_storey : 1]; src.push(['chill', ['box', r], b, b + CH_H]); } }
  for (const [a, b] of (get(G, 'ARTERIAL_EDGES', []) || [])) src.push(['art', ['line', [a, b]], 0.0, 0.0]);
  return src;
}
function hdist(p, g) {    
  if (g[0] === 'line') return gPS(p, g[1][0], g[1][1]);
  const P = g[0] === 'box' ? gBox(g[1]) : g[1].map(q => [q[0], q[1]]);
  if (insideP(p, P)) return 0; let m = Infinity; for (const [a, b] of gRing(P)) m = Math.min(m, gPS(p, a, b)); return m;
}
function intakeZones(G) {
  const Z = [['hub', x => x.g === 'pub' || x.g === 'grow'], ['clinic', x => x.g === 'clin'], ['data centre', x => ['hall', 'sup'].includes(x.g) && !isGenRoom(x)]];
  return Z.map(([k, f]) => [k, Object.keys(G.S).map(Number).flatMap(st => roomsOf(G, st).filter(f).map(x => [st, x]))]);
}
function intakeCandidates(G, rooms) {
  const zs = zsOf(G), out = [];
  for (const st of [...new Set(rooms.map(([s]) => s))].sort((a, b) => a - b)) {
    const allR = roomsOf(G, st).flatMap(x => x.r), ZR = rooms.filter(([s]) => s === st).flatMap(([, x]) => x.r);
     
    const BA = boundary(allR), pieces = [];
    for (const e of boundary(ZR)) for (const f of BA) {
      if (f.o !== e.o || Math.abs(f.c - e.c) > 1e-9 || f.ins !== e.ins) continue;
      const a = Math.max(e.a, f.a), b = Math.min(e.b, f.b); if (!(b > a + 1e-9)) continue;
       
      const cuts = uniqRaw(allR.concat(ZR).flatMap(r => [[r[0], r[2]], [r[0], r[3]], [r[1], r[2]], [r[1], r[3]]])
        .filter(q => e.o === 'v' ? Math.abs(q[0] - e.c) < 1e-9 && q[1] > a + 1e-9 && q[1] < b - 1e-9 : Math.abs(q[1] - e.c) < 1e-9 && q[0] > a + 1e-9 && q[0] < b - 1e-9)
        .map(q => e.o === 'v' ? q[1] : q[0]));
      const ts = [a].concat(cuts, [b]);
      for (let k = 0; k < ts.length - 1; k++) pieces.push(e.o === 'v' ? [[e.c, ts[k]], [e.c, ts[k + 1]]] : [[ts[k], e.c], [ts[k + 1], e.c]]);
    }
     
    for (const ch of pieces) {
      const L = chainLen(ch); if (L < 0.5) continue; const n = Math.max(1, Math.trunc(L / 0.5));
      for (let i = 0; i <= n; i++) { let t = L * i / n, k = 0; while (k < ch.length - 2 && t > hyp(ch[k + 1][0] - ch[k][0], ch[k + 1][1] - ch[k][1])) { t -= hyp(ch[k + 1][0] - ch[k][0], ch[k + 1][1] - ch[k][1]); k++; }
        const sl = hyp(ch[k + 1][0] - ch[k][0], ch[k + 1][1] - ch[k][1]) || 1, f = Math.min(1, t / sl); out.push([[ch[k][0] + (ch[k + 1][0] - ch[k][0]) * f, ch[k][1] + (ch[k + 1][1] - ch[k][1]) * f], zs[st - 1] + WALL_Z, st, 'wall']); }
    }
    const above = G.S[String(st + 1)] ? roomsOf(G, st + 1).flatMap(x => x.r) : null;
    for (const [s, x] of rooms) {
      if (s !== st) continue; const top = zs[st - 1] + (x.h !== undefined ? x.h : G.H[st - 1]) + ROOF_Z;
      for (const r of x.r) for (let u = r[0] + 0.5; u < r[1]; u += 1.0) for (let v = r[2] + 0.5; v < r[3]; v += 1.0)
        if (above === null || !(above.some(q => q[0] < u && u < q[1] && q[2] < v && v < q[3]) || (above.some(q => q[0] <= u && u <= q[1] && q[2] <= v && v <= q[3]) && interiorOfUnion(above, [u, v])))) out.push([[u, v], top, st, 'roof']);
    }
  }
  return out;
}
const interiorOfUnion = (R, p) => [[1e-9, 0], [-1e-9, 0], [0, 1e-9], [0, -1e-9]].every(([a, b]) => R.some(q => q[0] <= p[0] + a && p[0] + a <= q[1] && q[2] <= p[1] + b && p[1] + b <= q[3]));
function intakeCheck(G, cfg) {
  const src = intakeSources(G, cfg), res = new Map();
  for (const [zn, rooms] of intakeZones(G)) {
    if (!rooms.length) continue; let best = null;
    for (const [p, z, st, kd] of intakeCandidates(G, rooms)) {
      const d = {}; for (const k of Object.keys(NEED_I)) { let m = 99.0; for (const [kk, g, z0, z1] of src) if (kk === k) { const dh = hdist(p, g), dz = (z0 <= z && z <= z1) ? 0.0 : Math.min(Math.abs(z - z0), Math.abs(z - z1)); m = Math.min(m, pyHypot(dh, dz)); } d[k] = m; }
      const m = Math.min(...Object.keys(NEED_I).map(k => d[k] - NEED_I[k])), key2 = [m >= 0.5 ? 1 : 0, Math.min(d.gen, GEN_TIGHT + 0.5), m];
      const gt = (a, b) => a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];
      if (best === null || gt(key2, best[0])) best = [key2, p, z, st, kd, d, m];
    }
    if (best === null) continue;
    const [, p, z, st, kd, d, m] = best, lim = pyMin(Object.keys(NEED_I), k => d[k] - NEED_I[k]);
    res.set(zn, { p, z, st, kind: kd, d, margin: m, limit: lim });
  }
  return res;
}
function intakeRow(G, cfg, C = 'VBBL') {
  const R = intakeCheck(G, cfg);
  if (!R.size) return ['?', 'Outdoor air intakes', `${C} Table 6.3.2.9`, 'no zone found'];
  let worst = 'pass'; const parts = [], order = { pass: 0, tight: 1, fail: 2 }, lab = { gen: 'generator', bay: 'bays', chill: 'chillers', art: 'arterial' };
  for (const [zn, r] of R) {
    let s = st_(r.margin >= 0, r.margin), note = '';
    if (S_(s) === 'pass' && r.d.gen < GEN_TIGHT) { s = 'tight'; note = ' (3–10 m from a generator: tight, check in design; ASHRAE 62.1, our reading)'; }
    if (typeof s === 'object' && s.over != null) note += ` (over by ${f2(s.over)} m, fix in design)`;
    const where = `storey ${r.st} ${r.kind === 'roof' ? 'roof' : 'wall'}`;
    let dd = Object.keys(NEED_I).filter(k => r.d[k] < 50).map(k => `${lab[k]} ${pyFixed(r.d[k], 1)}`).join(', '); dd = dd ? dd + ' m' : 'every source more than 50 m away';
    parts.push(`${zn}: best point ${where} (${dd})${S_(s) !== 'pass' ? ': ' + S_(s) : ''}${note}`);
    if (order[S_(s)] > order[worst]) worst = S_(s);
  }
  const txt = 'one intake per zone, placed by the script at the best point on its walls (1.5 m up) or roof (0.3 m up); best spot found; actual HVAC layout may differ: '
    + parts.join(' · ') + '. Needs: generator exhaust ≥ 3.0 m (vent for combustion products; 3–10 m tight, ASHRAE 62.1, our reading), '
    + 'bays and arterial roads ≥ 7.6 m, chiller discharge ≥ 7.6 m; 3-D distance (our reading); generator exhaust 3.5 m up (?). '
    + 'Garbage, kitchen and sanitary vents not drawn [script]';
  return [worst, 'Outdoor air intakes', `BCBC 2018 Table 6.3.2.9 (${C} to confirm); project decision, 11 Nov; eh/intakes.py`, txt];
}

 
function fuelFill(G) {
  const Gs = (G.PLANT || []).filter(x => x.n.includes('enerator'));
  if (!Gs.length) return null;
  const FF = get(G, 'FUEL_FILL', null);
  if (!T(FF)) return ['?', `${Gs.length} yard generator(s); fuel fill point not drawn`];
  const yds = yards(G), TR = truckRoutes(G), ENT = new Set(Object.keys(get(G, 'TRUCK_ENTRIES', {}))), VIA = new Set(Object.keys(get(G, 'TRUCK_VIA', {})));
  const stand = Object.values(TR).map(polyOf).concat((get(G, 'FUEL_STAND', []) || []).map(polyOf)), dIn = (p, P) => insideP(p, P) ? 0.0 : edgeD(p, P);
  const out = [];
  for (const q of FF) {
    const p = [q[0], q[1]], far = Math.max(...Gs.map(x => rectD(p, prect(x)))), pp = pyTuple(p);
    const on = yds.filter(P => edgeD(p, P) <= 0.3);
    if (on.length) {
      const gap = stand.length ? Math.min(...stand.map(S => insideP(p, S) ? 0.0 : edgeD(p, S))) : null;
      const g = gap !== null ? `${pyFixed(gap, 1)} m from truck ground` : 'no truck ground declared next to it';
      out.push([gap !== null ? 'tight' : '?', `fill box ${pp} on the yard fence: truck stays outside, ${g} (hose reach ?), fill pipe ≤ ${pyFixed(far, 1)} m to the farthest generator (limit ?)`]);
    } else if (yds.some(P => insideP(p, P))) {
      const ok = Object.keys(TR).filter(k => (ENT.has(k) || VIA.has(k)) && dIn(p, polyOf(TR[k])) <= 1.0);
      out.push(ok.length ? ['pass', `fill ${pp} inside the yard on the ${ok[0]} route, which enters through a drawn vehicle gate`] : ['fail', `fill ${pp} inside the yard: a fuel truck must enter and no declared gated route reaches it`]);
    } else {
      const gap = stand.length ? Math.min(...stand.map(S => insideP(p, S) ? 0.0 : edgeD(p, S))) : null;
      out.push(gap !== null && gap <= 1.0 ? ['tight', `remote fill box ${pp} outside the yard beside truck ground (${pyFixed(gap, 1)} m), fill pipe ≤ ${pyFixed(far, 1)} m to the farthest generator (limit ?)`] : ['fail', `fill ${pp} is not on a plant-yard fence, not inside a yard and not beside truck ground`]);
    }
  }
  let st = out.some(([s]) => s === 'fail') ? 'fail' : out.some(([s]) => s === '?') ? '?' : out.some(([s]) => s === 'tight') ? 'tight' : 'pass';
  let txt = out.map(([, t]) => t).join('; ');
  if (T(get(G, 'FUEL_ASSUMED', null)) && st !== 'fail') { st = '?'; txt = txt + ' — ? ' + G.FUEL_ASSUMED; }
  return [st, txt];
}

 
const CTOL = 0.5;
const crd = (a, b) => hyp(Math.max(a[0] - b[1], b[0] - a[1], 0), Math.max(a[2] - b[3], b[2] - a[3], 0));
const cov = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
const cr = x => Array.isArray(x.r) && Array.isArray(x.r[0]) ? x.r : [x.r];
const cst = (ok, margin) => st_(ok, margin);
function cPads(G, m, cfg) {
  const A = padAnalyse(G); if (!A) return null;
  const alc = roomsOf(G, 1).filter(x => x.id.startsWith('alc'));
  const alcD = d => { const q = prect((G.PLANT || []).find(x => x.id === d.id)); for (const a_ of alc) { const r = a_.r[0]; if (r[0] - 1e-6 <= q[0] && q[1] <= r[1] + 1e-6 && r[2] - 1e-6 <= q[2] && q[3] <= r[3] + 1e-6) return Math.min(q[0] - r[0], r[1] - q[1], q[2] - r[2]); } return null; };
  const parts = [], margins = [];
  for (const d of A) {
    let b = d.alcove ? alcD(d) : null; b = b === null ? d.bld : b;
    const cand = [['building', b], ['generator set', d.gen], ['chiller', d.chl], ['fence', d.fence]], s_ = Math.min(...cand.map(c => c[1])), what = pyMin(cand, c => c[1])[0];
    const fr = Math.max(...Object.values(d.depth));
    margins.push(s_ - 1.0, d.pad < 50 ? d.pad - 1.0 : 9, fr - 3.0);
    parts.push(`${d.id}: ${n1(s_)} m to the nearest structure (${what}; ≥ 1.0)` + (d.pad < 50 ? `, ${n1(d.pad)} m to the next pad (≥ 1.0)` : '') + `, best front clear ${n1(fr)} m (≥ 3.0)`);
  }
  const mg = Math.min(...margins);
  return [cst(mg >= -1e-6, mg), `${A.length} pads: ` + parts.join('; ') + ' (ES54 F0-02.01-.02; structures = buildings, generator sets, chillers at grade, yard fences: our reading; front = the best side, not drawn) [script]'];
}
function cStoreys(G) {
  const sts = storeys(G);
  if (sts.length === 1) return ['pass', 'one storey: everything at grade'];
  const lifts = {}; for (const st of sts) lifts[st] = roomsOf(G, st).filter(x => x.n.toLowerCase().includes('lift'));
  const dc = sts.filter(st => roomsOf(G, st).some(x => ['hall', 'sup'].includes(x.g))), pub = sts.filter(st => roomsOf(G, st).some(x => ['pub', 'grow', 'clin'].includes(x.g)));
  const miss = dc.filter(st => !lifts[st].some(x => x.n.toLowerCase().includes('freight') || x.id === 'e2')).map(st => `storey ${st} data centre`)
    .concat(pub.filter(st => st > 1 && !lifts[st].some(x => ['circ', 'pub', 'grow', 'clin'].includes(x.g) && x.id !== 'e2')).map(st => `storey ${st} public`));
  return [miss.length ? 'fail' : 'pass', miss.length ? 'lift missing: ' + miss.join(', ') : `freight lift on storeys ${dc.join(', ')}; public lift on ${pub.filter(s => s > 1).join(', ') || 'no upper public storey'} (VBBL 3.8.2.3)`];
}
const ENTRY_IDS = ['s1', 's2', 's3', 's4', 'e2', 'ves', 'lv', 'dock', 'b1', 'b2', 'b3', 'b4', 'scor', 'link', 'sh1', 'sh2', 'psh', 'ris3'];
function cAtGrade(G, m, cfg) {
  let bad = roomsOf(G, 1).filter(x => x.g === 'hall' || (x.g === 'sup' && !(x.stair || x.core || ENTRY_IDS.includes(x.id) || x.id.startsWith('pas') || x.n.toLowerCase().includes('lift') || x.n.toLowerCase().includes('vestibule') || x.n.toLowerCase().includes('stair')))).map(x => x.id);
  if (cfg.no_clinic_at_grade) bad = bad.concat(roomsOf(G, 1).filter(x => x.g === 'clin').map(x => x.id));
  return [bad.length ? 'fail' : 'pass', bad.length ? 'at grade: ' + bad.join(', ') : 'storey 1 holds only data-centre stairs, lifts, vestibules, the dock and bays' + (cfg.no_clinic_at_grade ? ' and no clinic room' : '')];
}
function cSeparations(G, m, cfg, typed) {
  const sts = storeys(G), over = [];
  for (const st of sts.slice(0, -1)) {
    const hub = roomsOf(G, st).filter(x => ['pub', 'grow', 'circ'].includes(x.g) && !x.core).flatMap(x => x.r), dc = roomsOf(G, st + 1).filter(x => ['hall', 'sup', 'plant', 'load'].includes(x.g) && !x.core).flatMap(x => x.r);
    let a = 0; for (const h of hub) for (const d of dc) a += cov(h, d);
    if (a > 0.5) over.push([st + 1, a]);
  }
  if (sts.length === 1) return ['pass', 'one storey: hub and data centre side by side; 2 h wall between them (drawing claim)'];
  if (over.length && typed.includes('no data-centre room over the hub')) return ['fail', 'data-centre rooms over the hub: ' + over.map(([s, a]) => `${n1(a)} m² on storey ${s}`).join(', ') + ', but the row says none'];
  return ['pass', over.length ? 'data-centre rooms over the hub: ' + over.map(([s, a]) => `${n1(a)} m² on storey ${s}`).join(', ') + ' → 2 h floor there (VBBL Table 3.1.3.1; the drawn floor is a drawing claim)' : 'no data-centre room over the hub'];
}
const WET = /\bwcs?\b|washroom|toilet|shower|pool|\bspa\b|spa hall|steam|sauna|change room|universal change|dressing|greenhouse|growing|rest area|janitor|mop|kitchen|laundry|hot tub|whirlpool/;
function cOffHall(G) {
  const hall = []; for (const st of Object.keys(G.S).map(Number)) for (const x of roomsOf(G, st)) if (x.g === 'hall') for (const r of x.r) hall.push([st, r]);
  const eq = (G.PLANT || []).flatMap(p => cr(p).map(r => [p.id, r])).concat((get(G, 'CHILL', []) || []).map(c => ['chiller', c]), (get(G, 'GENS', []) || []).map(g => ['generator', g]));
  const hit = [...new Set(eq.filter(([, r]) => hall.some(([, h]) => cov(r, h) > 0.01)).map(([i]) => i))].sort();
  const wet = new Set(); for (const st of Object.keys(G.S).map(Number)) for (const x of roomsOf(G, st)) if (x.g !== 'hall' && WET.test(x.n.toLowerCase())) for (const r of x.r) for (const [hs, h] of hall) if (st > hs && cov(r, h) > 0.01) wet.add(`${x.n} (storey ${st})`);
  const bad = hit.concat([...wet].sort());
  return [bad.length ? 'fail' : 'pass', bad.length ? 'over or under the hall in plan: ' + bad.join(', ') : `no generator, tank, pad or chiller over or under the hall, and no wet room (WCs, showers, pools, greenhouse ...) over it, in plan (${eq.length} plant items checked; FM 5-32 2.2.1.6)`];
}
const covered = x => { const n = x.n.toLowerCase(); return !(x.open || ['aisle', 'apron', 'court'].includes(x.id) || /truck aisle|\baisle\b|apron|truck court|open/.test(n)); };
function cGens(G) {
  const Gs = (G.PLANT || []).filter(p => p.n.includes('enerator') || p.id.startsWith('g')); if (!Gs.length) return null;
  const bld = roomsOf(G, 1).filter(covered).flatMap(x => (x.n.includes('enerator') && x.g === 'plant') ? [] : x.r);
  const yard = Gs.filter(p => !bld.some(r => cov(cr(p)[0], r) > 0.01)); if (!yard.length) return null;
  const gaps = []; for (let i = 0; i < yard.length; i++) for (let j = i + 1; j < yard.length; j++) gaps.push(crd(cr(yard[i])[0], cr(yard[j])[0]));
  const tob = bld.length ? Math.min(...yard.map(p => Math.min(...bld.map(r => crd(cr(p)[0], r))))) : 99;
  const lot = G.LOTPOLY, tolot = q => { const pts = [[q[0], q[2]], [q[1], q[2]], [q[1], q[3]], [q[0], q[3]]]; let m = Infinity; for (const p of pts) for (let i = 0; i < lot.length; i++) m = Math.min(m, segD(p, lot[(i - 1 + lot.length) % lot.length], lot[i])); return m; };
  const tol = Math.min(...yard.map(p => tolot(cr(p)[0]))), g = gaps.length ? Math.min(...gaps) : 99;
  const stt = cst(g >= 2.0 - 1e-6 && tob >= 1.5 - 1e-6 && tol >= 3.0 - 1e-6, Math.min(g - 2.0, tob - 1.5, tol - 3.0));
  return [stt, `${yard.length} sets: ${gaps.length ? n1(g) : 'one set'} m apart (≥ 2.0, CSA C282 6.5.1.1); tanks ${n1(tob)} m to the building (≥ 1.5) and ${n1(tol)} m to lot lines (≥ 3.0, CSA B139 Table 2, 2,500–50,000 L)`];
}
const roomTop = (G, st, x) => get(G, 'SLAB', 0.0) + G.H.slice(0, st - 1).reduce((a, b) => a + b, 0) + (x.h !== undefined ? x.h : G.H[st - 1]);
function cChillers(G, m, cfg) {
  const grade = (G.PLANT || []).filter(p => p.n.includes('hiller')).map(p => cr(p)[0]);
  let roof = [];
  if (T(cfg.chill_units)) roof = cfg.chill_units.map(([r, s_, z_]) => [r, s_, z_]);
  else for (const r of (cfg.chill_rects || []).concat(get(G, 'CHILL', []) || [])) if (!roof.some(q => r.every((a, i) => Math.abs(a - q[0][i]) < 0.01))) roof.push([r, cfg.chill_storey === undefined ? null : cfg.chill_storey, cfg.chill_base === undefined ? null : cfg.chill_base]);
  if (!grade.length && !roof.length) return null;
  const margins = [], notes = [], alongU = r => (r[1] - r[0]) >= (r[3] - r[2]);
  const sideEnd = (r, q) => {
    const ou = Math.min(r[1], q[1]) - Math.max(r[0], q[0]), ovv = Math.min(r[3], q[3]) - Math.max(r[2], q[2]);
    if (ou > 0 && ovv > 0) return [0.0, 1.5, 'unit on an obstacle'];
    if (alongU(r)) { if (ou > 0) return [crd(r, q), 1.5, 'side']; if (ovv > 0) return [crd(r, q), 2.1, 'end']; }
    else { if (ovv > 0) return [crd(r, q), 1.5, 'side']; if (ou > 0) return [crd(r, q), 2.1, 'end']; }
    return null;
  };
  const faces = r => { const n = 5, us = [], vs = []; for (let i = 0; i < n; i++) { us.push(r[0] + (r[1] - r[0]) * (i + 0.5) / n); vs.push(r[2] + (r[3] - r[2]) * (i + 0.5) / n); }
    const [su, sv] = !alongU(r) ? [1.5, 2.1] : [2.1, 1.5];
    return [[vs.map(v => [r[0], v]), [-1, 0], su], [vs.map(v => [r[1], v]), [1, 0], su], [us.map(u => [u, r[2]]), [0, -1], sv], [us.map(u => [u, r[3]]), [0, 1], sv]]; };
  const depthIn = (p, d, inside, cap = 6.0) => { let t = 0.0; while (t < cap) { const q = [p[0] + d[0] * (t + 0.01), p[1] + d[1] * (t + 0.01)]; if (!inside(q)) return pyRound2(t + 0.005); t += 0.01; } return cap; };
  const lot = G.LOTPOLY;
  grade.forEach((r, i) => {
    const obs = roomsOf(G, 1).flatMap(x => x.r).concat((G.PLANT || []).map(p => cr(p)[0]).filter(q => !(q[0] === r[0] && q[1] === r[1] && q[2] === r[2] && q[3] === r[3])));
    for (const q of obs) { const s = sideEnd(r, q); if (s) { margins.push(s[0] - s[1]); if (s[0] - s[1] < 0.5) notes.push(`chiller ${i + 1} ${s[2]} ${n1(s[0])} m (≥ ${pyNum(s[1])})`); } }
    let yds = []; try { const c = [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]; yds = yards(G).filter(P => insideP(c, P)); } catch (e) {   }
    const insideAll = q => inShape(lot, q[0], q[1]) && yds.every(P => insideP(q, P));
    for (const [pts, d, req] of faces(r)) { const free = Math.min(...pts.map(p => depthIn(p, d, insideAll))); margins.push(free - req); if (free - req < 0.5) notes.push(`chiller ${i + 1} zone to the ${yds.length ? 'yard fence or lot line' : 'lot line'} ${n1(free)} m (≥ ${pyNum(req)})`); }
  });
  roof.forEach(([r, cs, zb], i) => {
    let high, level = [];
    if (zb !== null && zb !== undefined) high = Object.keys(G.S).map(Number).flatMap(st => roomsOf(G, st).filter(x => roomTop(G, st, x) > zb + 0.05).flatMap(x => x.r));
    else high = Object.keys(G.S).map(Number).filter(st => cs !== null && cs !== undefined && st > cs).flatMap(st => roomsOf(G, st).flatMap(x => x.r));
    level = Object.keys(G.S).map(Number).flatMap(st => roomsOf(G, st).filter(x => (zb !== null && zb !== undefined && Math.abs(roomTop(G, st, x) - zb) <= 0.05) || ((zb === null || zb === undefined) && st === cs)).flatMap(x => x.r));
    for (const q of high) { const s = sideEnd(r, q); if (s) { margins.push(s[0] - s[1]); if (s[0] - s[1] < 0.5) notes.push(`roof chiller ${i + 1} ${s[2]} ${n1(s[0])} m to a wall above the roof (≥ ${pyNum(s[1])})`); } }
    if (level.length) {
      const onroof = q => level.some(a => a[0] <= q[0] && q[0] <= a[1] && a[2] <= q[1] && q[1] <= a[3]);
      const ends = faces(r).filter(([, , req]) => req === 2.1), best = Math.max(...ends.map(([pts, d]) => Math.min(...pts.map(p => depthIn(p, d, onroof)))));
      margins.push(best - 2.1); if (best - 2.1 < 0.5) notes.push(`roof chiller ${i + 1}: the better end zone has ${n1(best)} m of roof at its level (≥ 2.1)`);
    }
  });
  const units = grade.map(u => [u, 'g']).concat(roof.map(([u]) => [u, 'r']));
  for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) {
    const [a, ka] = units[i], [b, kb] = units[j]; if (ka !== kb) continue;
    const ou = Math.min(a[1], b[1]) - Math.max(a[0], b[0]), ovv = Math.min(a[3], b[3]) - Math.max(a[2], b[2]); if (!(ou > 0 || ovv > 0)) continue;
    const side = alongU(a) ? ou > 0 : ovv > 0, need = side ? 3.0 : 4.2, gap = crd(a, b);
    margins.push(gap - need); if (gap - need < 0.5) notes.push(`units ${n1(gap)} m apart ${side ? 'side to side' : 'end to end'} (≥ ${pyNum(need)})`);
  }
  const mg = margins.length ? Number(pyFixed(Math.min(...margins), 3)) + 0.0 : 99, st = mg >= -1e-9 ? cst(true, mg) : 'tight';    
  let txt = `${units.length} chillers: clear zones 1.5 m sides, 2.1 m ends free of walls, plant and fences; units 3.0 m side to side, 4.2 m end to end (Vertiv SL-70790 4.2.4, maker claim; spacing our reading); least margin ${n1(mg)} m`;
  if (notes.length) txt += ' — ' + [...new Set(notes)].sort().join('; ');
  return [st, txt];
}
const cHubCap = (G, m) => ['n/a', `data centre ${n1(m.dc)} m²: the 2,325 m² hub cap was dropped (project decision Nov 2026); loading spaces follow the plan's own floor (project decision)`];
function cPublicExits(G) { const r2 = reach(G).out.filter(o => o[0] === 'R2'); return [r2.length ? 'fail' : 'pass', r2.length ? r2.map(o => `${pyTuple(o[1])} ${o[2]}`).join('; ') : 'T-reach R2: no public or clinic exit into data-centre ground, bays, drives or plant yards except onto a walkway (eh/reach.py)']; }
function cLoading(G, m) {
  const bays = Object.keys(G.S).map(Number).flatMap(st => roomsOf(G, st).filter(x => x.g === 'load' && (/^b\d+$/.test(x.id) || x.n.toLowerCase().includes('loading'))));
  const dims = bays.flatMap(x => x.r.slice(0, 1).map(r => [r[1] - r[0], r[3] - r[2]].sort((a, b) => a - b)));
  if (m.nb === null || m.nb === undefined) return ['?', `${bays.length} bays drawn; number needed not set`];
  return [bays.length >= m.nb ? 'pass' : 'fail', `${bays.length} bays drawn ≥ ${m.nb} needed; sizes ${dims.map(([a, b]) => `${pyFixed(a, 1)} × ${pyFixed(b, 1)}`).join(', ')} m (size against the by-law: by hand)`];
}
const CLAIMS = { 'Loading count and size': cLoading, 'Transformer pads': cPads, 'Every storey reached': cStoreys, 'At grade: data centre only as entrances': cAtGrade,
  'At grade: no data storage, no health care office': cAtGrade, 'Fire separations': cSeparations, '2 h floor over the hub': cSeparations,
  'Nothing wet over the hall': cOffHall, 'Generator tanks': cGens, 'Chiller clear zones': cChillers, 'Plant off the hall': cOffHall, 'Plant off the public edge and off the hall': cOffHall,
  'Data-centre size: hub cap': cHubCap, 'Public exits beside the plant yard, not through it': cPublicExits, 'Public exits beside the drive, not on it': cPublicExits,
  'Clinic exit beside the plant yard, not through it': cPublicExits, "Public corridor's second exit": cPublicExits, 'P2 and the exit passage on Pender St': cPublicExits };
const CORD = ['pass', 'tight', 'flag', 'flag-red', '?', 'approval', 'fail'];
const worse = (a, b) => CORD.indexOf(a) >= CORD.indexOf(b) ? a : b;
function claimApply(G, m, cfg, row) {
  const [st, name, clause, text] = row, f = CLAIMS[name];
  if (!f) return [row, null];
  let r;
  try { r = f === cSeparations ? f(G, m, cfg, text) : f(G, m, cfg); }
  catch (ex) { return [['?', name, clause + ' · checked by script', text + ` [script failed: ${ex.message}]`], [name, st, '?', String(ex.message)]]; }
  if (r === null) return [row, null];
  const sScr = S_(r[0]); let t2 = r[1];
  const s2 = (st === '?' || st === 'approval') ? (sScr === 'fail' ? 'fail' : st) : worse(st, sScr);
  if (s2 === 'fail' && st !== 'fail') t2 = 'SCRIPT FAILS: ' + t2;
  return [[s2, name, clause + ' · checked by script', text + ` [script: ${t2}]`], s2 !== st ? [name, st, s2, t2] : null];
}
 
const finalizeRows = rows => rows.map(c => (c[0] === 'pass' && (c[3].includes('0 margin') || c[3].includes('no margin')) && !c[3].includes(TIGHT)) ? ['tight', c[1], c[2], c[3] + ' — ' + TIGHT] : c);

 
function zoneExits(G, st, ids) {
  const rooms = new Map(roomsOf(G, st).map(x => [x.id, x])), K = {}; for (const [i, x] of rooms) K[i] = kind(x, st);
  const P = new Set(['lobby', 'pcor', 'ccor', 'pcore', 'proom', 'croom']), seen = new Set(ids.filter(i => rooms.has(i))), todo = [...seen], ex = new Map();
  while (todo.length) {
    const c = todo.pop();
    for (const d of G.D) {
      if (d[0] !== st || !(c === d[1] || c === d[2])) continue;
      const o = d[2] === c ? d[1] : (d[1] === c ? d[2] : d[1]);
      const oo = d[1] === c ? d[2] : d[1];
      if (oo === 'OUT' || oo === 'YARD') {
        if (inload(roomsOf(G, st), d[3], d[4], d[5])) continue;
        if (oo === 'OUT' && P.has(K[c])) { if (dcGround(G, outsidePoint(G, st, d[3], d[4], d[5])) || !dcRoute(G, st, d[3], d[4], d[5])[0]) continue; }
        ex.set(`door ${pyNum(pyRound2(d[3]))}, ${pyNum(pyRound2(d[4]))}`, 1); continue;
      }
      void o;
      const x = rooms.get(oo); if (!x) continue;
      if (x.stair) { ex.set(`stair ${oo}`, 1); continue; }
      if (x.core || x.g === 'load') continue;
      if (!seen.has(oo)) { seen.add(oo); todo.push(oo); }
    }
  }
  return [ex.size, [...ex.keys()].sort()];
}
function egressRow(G, cfg) {
  const rows = egress2(G), bad = rows.filter(r => r[r.length - 1] !== 'ok'), big = rows.filter(r => r[2] > 60);
  const txt = big.map(r => `${r[0]} ${r.f2 ? pyNum(r[2]) : r[2]} people, ${r[3]} doors ${pyNum(r[4])} ≥ ${pyNum(r[5])} m`).join(' · '), C = cfg.code || 'VBBL';
  const s = st_(!bad.length, big.length ? Math.min(...big.map(r => r[4] - r[5])) : 99);
   
  const nm = (cfg.refuge_ids || []).length ? 'Refuge and shelter egress doors' : 'Egress doors, rooms over 60 people';
  return [S_(s), nm, `${C} Table 3.1.17.1 (0.75 m² a person), 3.3.1.5.(2); project decision, 9 Nov`, t_(s, txt + " (doors ≥ ⅓ of the room's diagonal apart)")];
}
function areaRow(G, cfg, rowsIn) {    
  const rows = rowsIn || egress3(G), need = rows.filter(r => r.need), near = rows.filter(r => !r.need && r.A > 0.95 * r.lim && !(r.n >= 2 && r.apart >= r.third));
  const lab = { 'F-2': 'data hall', 'A': 'refuge', 'D': 'clinic suite' };
  const txt = need.map(r => `${lab[r.grp]} ${n0(r.A)} m² > ${r.lim}: ${r.n} doors ${n1(r.apart)} ≥ ${n1(r.third)} m`).join(' · ') || 'no room or suite over the table';
  const C = cfg.code || 'VBBL', ed = C === 'VBBL' ? '' : "; NBC 2020 Table 3.3.1.5.-B (the project’s copy) gives the same limits; NBC 2023 (AE) not read ?";
  const sts = need.map(r => r.n < 2 ? st_(false, r.lim - r.A, true, r.lim) : st_(r.apart >= r.third - 1e-9, r.apart - r.third)).concat(near.map(() => 'tight'));
  const s = sts.find(x => S_(x) === 'fail') || sts.find(x => typeof x === 'object' && x.over != null) || (sts.some(x => S_(x) === 'tight') ? 'tight' : 'pass');
  return [S_(s), 'Egress doorways by room area', `${C === 'VBBL' ? 'VBBL' : 'NBC 2020'} 3.3.1.5.(1)(d), Table 3.3.1.5.-B (sprinklered: A 200, D 300, F-2 200 m²); project decision, 9 Nov${ed}`, t_(s, txt + ' (data hall F-2, refuge A, clinic suite D: our reading; unassigned floor not checked)')];
}
function walkRow(G, cfg) {
  const [rows, hub, n] = walkload(G), bad = rows.filter(r => r[r.length - 1] !== 'ok');
  const txt = rows.map(r => `${r[1].join('+')}: ${r[2]} people (full load ${r[3]}) → ${f2(r[5])} m needed, ${f2(r[4])} m drawn`).join(' · '), C = cfg.code || 'VBBL';
  const s = st_(!bad.length, rows.length ? Math.min(...rows.map(r => r[4] - r[5])) : 99);
  return [S_(s), 'Walkways carry their load', `${C} 3.4.3.2.(1)(a); project decision, 9 Nov`, t_(s, txt + `. Load per exit: the storey's public load (${hub}) split over its ${n} exits, each at least half where there are two (3.4.3.2.(7)); data-centre storeys at 46 m² a person (storage, fallback for designed staff, our reading)`)];
}
function reachRow(G) {
  let out; try { out = reach(G).out; } catch (ex) { return ['?', 'T-reach (doors, lines, through-rooms, lobby)', 'spec rule 15d; eh/reach.py', `not run (${ex.message}) [script]`]; }
  out = out.filter(o => o[0] !== 'R8');
  if (!out.length) return ['pass', 'T-reach (doors, lines, through-rooms, lobby)', 'spec rule 15d; eh/reach.py', 'R0–R7 pass: doors on shared walls, public and secure lines never share a door, step-free reach, through-rooms as rule 15a, lobby [script]'];
  return ['fail', 'T-reach (doors, lines, through-rooms, lobby)', 'spec rule 15d; eh/reach.py', out.slice(0, 8).map(o => `${o[0]} ${o[1] ? o[1][1] : ''} (storey ${o[1] ? o[1][0] : '-'}): ${o[2]}`).join('; ') + (out.length > 8 ? ` (+${out.length - 8} more)` : '') + ' [script]'];
}
 
function commonChecks(G, cfg, m) {
  const C = cfg.code || 'VBBL';
  const ex = m.exits.map(([z, d, need, half, pc]) => `${z} ${n1(d)} ≥ ${n1(need)} m` + (pc ? ' (public corridor: ≤ 9 m needed)' : '')).join(' · ');
  const exok = m.exits.every(([, d, need]) => d >= need - 1e-9);
  const dis = m.discharges.map(([a, b, d, need]) => `${a}–${b} ${n1(d)} ≥ ${n1(need)} m`).join(' · '), disok = m.discharges.every(([, , d, need]) => d >= need - 1e-9);
  const tr = m.travel.map(([z, d, k]) => d !== Infinity && d !== null && d !== 'inf' ? `${z} ${n1(d)}` : `${z}: ${k}`).join(' · '), trok = m.travel.every(([, d]) => typeof d === 'number' && d <= 45);
  const exm = m.exits.length ? Math.min(...m.exits.map(([, d, need]) => d - need)) : 99, dism = m.discharges.length ? Math.min(...m.discharges.map(([, , d, need]) => d - need)) : 99;
  const trm = 45 - (m.travel.length ? Math.max(...m.travel.map(([, d]) => typeof d === 'number' ? d : Infinity)) : 0);
  const sEx = st_(exok, exm), sDis = st_(disok, dism), sTr = st_(trok, trm);
  const ze = m.zone_exits || [], mr = m.ref_main || 0.0, small = !!cfg.small_lot;
  const sRef = st_(m.people >= 50 && (mr >= 175 || small), (small ? (m.ref_counted !== undefined ? m.ref_counted : m.ref) : mr) - 175, true, 175);
  let rows = [
    [sEx, 'Exits apart', `${C} 3.4.2.3.(1), (3)`, t_(sEx, `${ex}. Rule: with a public corridor min(½ diagonal, 9 m), otherwise max(½ diagonal, 9 m); door to door stands in for the smoke path (our arithmetic)`)],
    [sDis, 'Exterior stair discharges apart', `${C} 3.4.2.3.(4)`, t_(sDis, `${dis}. 9 m, or 6 m sprinklered with both within 15 m of a street; measured door edge to door edge (project decision, 9 Nov)`)],
    [sTr, 'Travel along the path', `${C} 3.4.2.5.(1)`, t_(sTr, `${tr} m ≤ 45 m (0.25 m grid, through 0.9 m doors)`)],
    reachRow(G),
    [!ze.length ? '?' : ze.every(([, n]) => n >= 2) ? 'pass' : 'fail', 'Two exits from every zone', `${C} 3.4.2.1; spec rule 6; eh/tfboard.zone_exits`, ze.map(([z, n]) => `${z} ${n}`).join(' · ') + ' exits reached (distinct exterior doors, yard doors and exit stairs; loading doors and public doors with no clear route to a street not counted) [script]'],
    [sRef, 'Refuge minimum', 'spec Part 1 (refuge main room); project decision, 8 Nov: 50 people at 3.5 m²', `${n0(m.ref_counted)} m² clear, counted → ${m.people} people ≥ 50; largest refuge room ${n0(mr)} m² clear ` + (small ? '(small lot: refuge and shelter count together)' : '≥ 175') + ' (clear = inside the walls: 0.15 m off fire and exterior walls, 0.05 m off partitions, project decision, 11 Nov)'],
    ['pass', 'Loading count and size', cfg.city === 'van' ? 'Parking By-law 5.1.5, 5.2.3, 5.2.5, 5.2.9, 5.5.1.2' : 'Zoning Bylaw 20001 s. 5.80 Table 7.2', `${m.nb} needed; drawn count from the plan (eh/claims.loading; see Loading)`],
    m.genkw === 300 ? ['?', 'Generator test noise', cfg.city === 'van' ? 'By-law 6555 s. 4.1(c)' : 'Bylaw 14600 s. 21', `${m.ngen} small sets (300 kW): no sourced noise figure: check in design (project decision, 11 Nov)`]
      : cfg.city === 'van' ? ['flag', 'Generator test noise', 'By-law 6555 s. 4.1(c)', `one set ${n1(m.gen1)} ≤ 80 dBA at 6.1 m; ${m.ngen} together ${n1(m.genall)}: test one at a time (maker claim, our arithmetic)`]
      : ['?', 'Generator test noise', 'Bylaw 14600 s. 21', `one set ${n1(m.gen1)} dBA at 6.1 m (maker claim); limit 85 dBA at a non-residential lot line: distance to the lines not modelled`],
    intakeRow(G, cfg, C), sizingRow(G, cfg, m), hubsetRow(G, cfg, m), batteryRow(G, cfg, m), bondRow(G, cfg.city === 'edm' ? 'E' : 'V'),
    ['?', 'Hall heat used by the hub', 'DECISIONS 11 Nov (every typology board, provisional)', "share of the hall's heat the hub uses: ? (the hub's heat demand is not sourced: space heat is ? in the NECB 2020 build-up): provisional"],
    ['?', 'Seismic importance', `${C} Table 4.1.2.1; 4.1.8.1 (IE)`, 'High: the refuge is a building likely to be used as a post-disaster shelter (Table 4.1.2.1), IE 1.3; '
      + 'the whole structure unless the parts are separated by a seismic joint (our reading; no mixed-use rule read). Clinic: primary care, '
      + 'not an emergency treatment facility (our reading, project decision, 11 Nov): if the clinic is meant to treat injuries after an earthquake, it is '
      + 'post-disaster (IE 1.5). Data centre as a communications facility (post-disaster) ?'],
    ['?', 'Hub emergency power', 'project decision, 11 Nov; spec 1c; NECB 2020 Tables 4.2.1.6, A-8.4.3.2(2); Rehlko G5-641, G5-642, g5650; CSA C282 (2 h minimum, life safety; not read, secondary source)',
      `the hub runs 72 h on its own set (${m.hub_set.model}, row 'Hub generator (72 h)'), the data centre 12 h on its own sets; hub load ${n0(m.hub.kw)} kW `
      + '(lighting, receptacles, hot water; NECB 2020); fans and space heat ? (check in design)' + (m.hub.other.length ? `; rooms read with lounge values: ${m.hub.other.join(', ')}` : '')],
  ];
  if (cfg.city === 'edm') rows.unshift(['flag', 'Indicative', 'project decision, 11 Nov', 'indicative: tool rectangle, placeholder cooling']);
  if (!m.discharges.length) rows = rows.filter(r => r[1] !== 'Exterior stair discharges apart');
  try {
    const de = corridors(G), ok = de.every(r => r[4] <= 6.0);
    let sDe = st_(ok, 6.0 - (de.length ? Math.max(...de.map(r => r[4])) : 0));
    const txt = de.map(r => `storey ${r[0]} ${r[2].replace('pcor', 'public').replace('ccor', 'clinic').replace('scor', 'secure')} ${n1i(r[4])} m`).join(' · ');
    rows.splice(3, 0, widthRow(G, cfg)); rows.splice(4, 0, egressRow(G, cfg)); rows.splice(5, 0, areaRow(G, cfg));
    if (T(get(G, 'WALK', null))) rows.splice(6, 0, walkRow(G, cfg));
    const ds = corridors(G, { strict: true });
    const q24 = de.map((r, i) => [r, ds[i]]).filter(([r, s]) => s[4] > 6.0 && r[4] <= 6.0);
    let note = '', Y = null, ygErr = null; try { Y = yards(G); } catch (e) { ygErr = e.message; }
    const yg = T(Y) ? yardgate(G) : null, GN = get(G, 'GATE_NOTES', {}) || {}, gnote = g => GN[pyTuple(g)] !== undefined ? GN[pyTuple(g)] : GN['(' + g.join(', ') + ')'];
    if (q24.length && yg !== null && T(get(G, 'GATES', null))) {
      const bad = yg.doors.filter(d => d.status === 'fail').concat(yg.gates.filter(g => g.status === 'fail'), (yg.vgates || []).filter(v => v.status === 'fail'));
      const tg = yg.gates.filter(g => g.status === 'tight').concat(yg.doors.filter(d => d.status === 'tight'));
      note = ' · secure exits into the plant yard counted: the yard gate to an open public thoroughfare (street or lane; project decision, 10 Nov) is drawn and opens from inside without a key (project decision, 9 Nov, Q24; our reading)' + Object.values(GN).map(v => '; gate ' + String(v)).join('') + '; '
        + `clear routes ≥ 1.1 m from ${yg.doors.length} yard doors to the gate (eh/yardgate.py v3), gate ${yg.gates.map(g => n1(g.width)).join('/')} m wide`
        + ((yg.vgates || []).length ? `; truck route crosses the yard fence at a drawn vehicle gate (${yg.vgates.map(v => v.route.toLowerCase()).join(', ')})` : '');
      if (bad.length) { sDe = 'fail'; note += ' · FAILS: ' + bad.map(b => (b.door ? pyTuple(b.door) : pyTuple(b.gate)) + ' ' + (b.why !== undefined ? b.why : 'gate')).join('; '); }
      else if (tg.length && S_(sDe) === 'pass') sDe = 'tight';
    } else if (q24.length) {
      sDe = 'fail';
      note = ' · ' + q24.map(([r, s]) => `storey ${r[0]} secure ${n1i(s[4])} m: the exit into the plant yard needs a drawn gate to the street that opens from inside without a key (project decision, 9 Nov, Q24)`).join(' · ');
    }
    if (ygErr) rows.splice(3, 0, ['?', 'Plant-yard doors and gates', 'spec rule 6; Q24 (project decision, 9 Nov); eh/yardgate.py v6', ygErr]);
    else if (yg === null) rows.splice(3, 0, ['pass', 'Plant-yard doors and gates', 'spec rule 6; Q24 (project decision, 9 Nov); eh/yardgate.py v6', 'no plant yard on this fit (PLANT_YARDS empty) [script]']);
    else {
      const all = yg.doors.map(d => ['door ' + String(d.door[0]), d]).concat(yg.gates.map(g => ['gate ' + pyTuple(g.gate) + (gnote(g.gate) !== undefined ? ' ' + gnote(g.gate) : ''), g]), (yg.vgates || []).map(v => ['truck route ' + v.route, v]));
      const sty = all.some(([, x]) => x.status === 'fail') ? 'fail' : all.some(([, x]) => x.status === 'tight') ? 'tight' : 'pass';
      const tx = all.length ? `${Y.length} plant yard(s), ${yg.gates.length} gate(s) to a street or lane drawn, ${yg.doors.length} door(s) into the yard: ` + all.map(([k, x]) => `${k} ${x.status}` + (x.why && x.status !== 'pass' ? ` (${x.why})` : '')).join('; ') + ' [script]' : `${Y.length} plant yard(s); no door opens into it and no gate is drawn [script]`;
      rows.splice(3, 0, [sty, 'Plant-yard doors and gates', 'spec rule 6; Q24 (project decision, 9 Nov); eh/yardgate.py v6', tx]);
    }
    const ff = fuelFill(G);
    if (ff) rows.splice(4, 0, [ff[0], 'Fuel fill (generators)', 'project decision, 10 Nov; eh/fuelfill.py; hose and pipe limits not sourced', ff[1] + ' [script]']);
    rows.splice(3, 0, [S_(sDe), 'Dead-end corridors', `${C} 3.3.1.9.(5); project decision, 8 Nov (strict)`, t_((!note || S_(sDe) !== 'tight') ? sDe : 'tight', `${txt} ≤ 6 m, along the corridor centreline from the last point with two ways to separate exits (project decision, 8 Nov; eh/deadend.py, our arithmetic)` + note)]);
  } catch (ex_) { rows.splice(3, 0, ['?', 'Dead-end corridors', `${C} 3.3.1.9.(5)`, `not measured (${ex_.message})`]); }
  return rows.map(r => [S_(r[0])].concat(r.slice(1)));
}

const api = { kind, LINE, CIRC, reach, setPadRule: r => { PADRULE = r; },
  gens, transformers, switchMargin, kd300lh, hubTank, hubSet, battCabinets, battRoom, hubLoad, RULES, HARD, hard, rule, auditGeom,
  st_, t_, measureSizing, sizingRow, hubsetRow, batteryRow, widthRow, pyFixed,
  corridors, egress2, egress3, walkload, sep2hWalls, sep2hText, padAnalyse, bondRow, intakeCheck, intakeRow, fuelFill, claimApply, CLAIMS, finalizeRows,
  zoneExits, egressRow, areaRow, walkRow, reachRow, commonChecks, TIES, capArea, cappedArea, dcRoute, dcGround, outsidePoint, shapesTruck, portal, yards, yardgate,
  clearGeom, clearSize, localWidth, maxSquare, version: 'EH-FREEZE-2026-11-11d port (every shared board check)' };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.hubchecks = api; }
})(typeof window !== 'undefined' ? window : null);
 
(function () { const P = {};
 
P['A5'] = (function (module) {
 
(function (root) {
'use strict';
function a5DeadEndRow(G, cfg, hc) {
  const C = (cfg && cfg.code) || ((cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025');
  const de = hc.corridors(G), ds = hc.corridors(G, { strict: true });
  const nm = k => ({ pcor: 'public', ccor: 'clinic', scor: 'secure' })[k] || k;
  const f = x => (x === Infinity || x === 'inf') ? 'no exit (∞)' : x.toFixed(1) + ' m';
  const over = de.filter(r => !(r[4] <= 6.0 + 1e-9));
  const q24 = de.filter((r, i) => r[4] <= 6.0 + 1e-9 && ds[i] && ds[i][4] > 6.0 + 1e-9);
  const status = over.length ? 'fail' : q24.length ? 'tight' : 'pass';
  const txt = de.map(r => `storey ${r[0]} ${nm(r[2])} ${f(r[4])}`).join(' · ') + ' ≤ 6 m, along the corridor centreline from the last point with two ways to separate exits'
    + (q24.length ? `; ${q24.map(r => `storey ${r[0]} ${nm(r[2])}`).join(', ')}: within 6 m only by counting the plant-yard door, whose gate opens from inside without a key (project decision, 9 Nov, Q24; our reading)` : '');
  return { id: 'A5', title: 'Dead-end corridors', status, text: txt + ' [script]', src: `${C} 3.3.1.9.(5); project decision, 8 Nov (strict)` };
}
const api = { a5DeadEndRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchA5 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['A6'] = (function (module) {
 
(function (root) {
'use strict';
function a6ZoneExitsRow(G, cfg, hc, zones) {
  const C = (cfg && cfg.code) || ((cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025');
  const Z = (zones || (cfg && cfg.zones) || []).map(z => Array.isArray(z) ? { name: z[0], st: z[1], ids: z[2] } : z);
  if (!Z.length) return { id: 'A6', title: 'Two exits from every zone', status: '?', text: 'no zones given', src: `${C} 3.4.2.1` };
  const res = Z.map(z => { const ids = z.ids || (z.id ? [z.id] : []); const [n, ex] = hc.zoneExits(G, z.st, ids); return [z.name, n, ex]; });
  const ok = res.every(r => r[1] >= 2);
  return { id: 'A6', title: 'Two exits from every zone', status: ok ? 'pass' : 'fail',
    text: res.map(r => `${r[0]} ${r[1]}`).join(' · ') + ' exits reached (distinct exterior doors, yard doors and exit stairs; loading doors and public doors with no clear route to a street not counted) [script]',
    src: `${C} 3.4.2.1; spec rule 6; eh/tfboard.zone_exits` };
}
const api = { a6ZoneExitsRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchA6 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['A11'] = (function (module) {
 
(function (root) {
'use strict';
const IND = new Set(['hall', 'sup', 'plant', 'load']);
const RX_IND = /\b(plant|generator|transformer|switchgear)/i, RX_F3 = /(fish hall|headhouse|production house)/i, RX_GROW = /(greenhouse|growing house|biome|aquaponic)/i;
const RX_RES = /\b(sleep|sleeping|bed|beds|dorm|dormitory|overnight)\b/i, RX_CARE = /\bcare\b/i;
const RX_SVC = /(storage|\bstore\b|garbage|recycl|janitor|mechanical|electrical|riser|closet|valve|boiler|meter\b)/i, RX_FREIGHT = /(freight|goods)/i;
const isStair = x => !!x.stair && x.n.toLowerCase().startsWith('stair');
function a11Check(G, hc) {
  const S = G.S, D = G.D, out = [], sts = Object.keys(S);
  const room = (st, id) => (S[st] || []).find(x => x.id === id), other = (d, id) => d[1] === id ? d[2] : d[1];
  const onStorey = (s, id) => (S[s] || []).some(x => x.id === id);
  for (const st of sts) for (const L of S[st]) {
    if (hc.kind(L, +st) !== 'lobby') continue;
    const ds = D.filter(d => String(d[0]) === st && (d[1] === L.id || d[2] === L.id));
    const outs = ds.filter(d => other(d, L.id) === 'OUT');
    const nb = ds.filter(d => other(d, L.id) !== 'OUT').map(d => [d, room(st, other(d, L.id))]).filter(([, y]) => y);
    const direct = y => D.some(e => String(e[0]) === st && (e[1] === y.id || e[2] === y.id) && (other(e, y.id) === 'OUT' || (room(st, other(e, y.id)) && hc.kind(room(st, other(e, y.id)), +st) === 'exitpas')));
    const ups = nb.filter(([, y]) => y.stair && isStair(y) && !direct(y) && sts.some(s => s !== st && onStorey(s, y.id)));
    if (!ups.length) continue;
    const fails = [], notes = [];
    for (const [, y] of nb) {
      if (y.stair) continue;
      if (y.core && !y.stair) { if (RX_FREIGHT.test(y.n)) fails.push(`(e)(iv) ${y.id} (${y.n.slice(0, 40)}) is not a passenger lift`); continue; }
      if (IND.has(y.g) || RX_IND.test(y.n)) fails.push(`(c) ${y.id} (${y.n.slice(0, 40)}): industrial (F-2)`);
      else if (RX_F3.test(y.n) || (RX_GROW.test(y.n) && y.staffOnly)) fails.push(`(c) ${y.id} (${y.n.slice(0, 40)}): industrial (F-3, staff-only growing room)`);
      if (RX_RES.test(y.n)) fails.push(`(c) ${y.id} (${y.n.slice(0, 40)}): residential (sleeping)`);
      if (RX_CARE.test(y.n)) fails.push(`(c) ${y.id} (${y.n.slice(0, 40)}): care`);
      if (RX_SVC.test(y.n)) fails.push(`(e)(i) ${y.id} (${y.n.slice(0, 40)}): service or storage room`);
    }
    const hgt = +st > 1 ? (G.H || []).slice(0, +st - 1).reduce((a, b) => a + b, 0) : 0;
    (hgt > 4.5 ? fails : notes).push(`(a) lobby floor ${hgt.toFixed(1)} m above the storey-1 floor (limit 4.5 m)`);
    for (const [d, y] of ups) {
      if (outs.length) { const dist = Math.min(...outs.map(o => Math.hypot(d[3] - o[3], d[4] - o[4]))); (dist > 15 ? fails : notes).push(`(b) ${y.id}: ${dist.toFixed(1)} m from its door to the lobby's outside door (straight; limit 15 m)`); }
      else fails.push(`(b) ${y.id}: the lobby has no outside door`);
    }
    const served = new Set(); ups.forEach(([, y]) => sts.forEach(s => { if (s !== st && onStorey(s, y.id)) served.add(s); }));
    [...served].sort().forEach(s => { const n = ups.filter(([, y]) => onStorey(s, y.id)).length; if (n > 1) fails.push(`(2) storey ${s}: ${n} exits through this lobby (one at most)`); });
    out.push({ storey: +st, lobby: L.id, exits: ups.map(([, y]) => y.id), fails, notes });
  }
  return out;
}
function a11LobbyExitRow(G, cfg, hc) {
  const C = (cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025', R = a11Check(G, hc);
  const status = R.some(r => r.fails.length) ? 'fail' : 'pass';
  const text = R.length ? R.map(r => `${r.exits.join(', ')} through ${r.lobby}: ` + (r.fails.length ? r.fails.join('; ') : 'meets (a), (b), (c), (e)(i), (e)(iv)') + '; (d), (f) not drawn (?)').join('; ')
    : 'no exit from a storey other than storey 1 runs through a lobby (storey-1 rooms reaching the street through a lobby are not a 3.4.4.2 case, project decision, 16 Nov 14:06)';
  return { id: 'A11', title: 'Exits through a lobby', status, text: text + ' [script]', src: `${C} 3.4.4.2.(1), (2)(a)-(f), read 16 Nov` };
}
const api = { a11LobbyExitRow, a11Check };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchA11 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['C6'] = (function (module) {
 
(function (root) {
'use strict';
const isWc = n => /\bwcs?\b|washroom|toilet|universal/i.test(n);
const wcCount = n => { const m = n.match(/\((\d+)\)|(\d+)\s*wcs?\b/i); return m ? +(m[1] || m[2]) : 1; };
function c6Row(est, city) {
  const lim = city === 'edm' ? 10 : 25, C = city === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025';
  const parts = [], bad = [];
  for (const e of est) {
    if (e.wcs !== 1) { parts.push(`${e.name}: ${e.wcs} WCs (not a single-WC case)`); continue; }
    const ok = e.load <= lim; if (!ok) bad.push(e.name);
    parts.push(`${e.name}: load ${e.load}, one WC for both sexes allowed to ${lim}: ${ok ? 'pass' : 'needs water closets for each sex (Table 3.7.2.2.-A/-B)'}`);
  }
  return { id: 'C6', title: 'One water closet for both sexes', status: !est.length ? 'n/a' : bad.length ? 'fail' : 'pass', text: parts.join('; '), src: `${C} 3.7.2.2.(2), read 16 Nov` };
}
function c6Establishments(G, cfg, opt = {}) {
  const rooms = Object.values(G.S).flat().filter(x => x.g === 'clin');
  if (!rooms.length) return [];
  const area = r => r.r.reduce((a, q) => a + (q[1] - q[0]) * (q[3] - q[2]), 0);
  const wcs = rooms.filter(x => isWc(x.n)).reduce((a, x) => a + wcCount(x.n), 0);
  const load = opt.clinicLoad != null ? opt.clinicLoad : Math.ceil(rooms.filter(x => !isWc(x.n) && !/corridor/i.test(x.n)).reduce((a, x) => a + area(x), 0) / 9.3);
  return [{ name: 'clinic', load, wcs }];
}
const api = { c6Row, c6Establishments };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC6 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['VG'] = (function (module) {
 
(function (root) {
'use strict';
function vgNeed(load, partial) { return load <= 200 ? 0 : 1 + (partial ? Math.ceil((load - 200) / 100) : Math.floor((load - 200) / 100)); }
function vgRow(G, cfg, opt = {}) {
  const src = 'VBBL 2025 3.7.2.9, read 16 Nov (checks/sources/SOURCES_vbbl_confirm_2026-11-16.md)';
  if ((cfg && cfg.city) !== 'van') return { id: 'VG', title: 'Gender-neutral washrooms (Vancouver)', status: 'n/a', text: 'Edmonton: NBC 2023 (AE) has no such article', src };
  const load = opt.load != null ? opt.load : (G.m && G.m.load_hub);
  if (load == null) return { id: 'VG', title: 'Gender-neutral washrooms (Vancouver)', status: '?', text: 'public occupant load not available', src };
  const need = vgNeed(load, !!opt.partial);
  const rooms = Object.values(G.S).flat().filter(x => x.genderNeutral === true || /gender[- ]neutral|all[- ]gender/i.test(x.n) || /universal (wc|washroom)/i.test(x.n));
  const wc = x => x.wc != null ? x.wc : (x.n.match(/\((\d+)\)/) ? +x.n.match(/\((\d+)\)/)[1] : 1);
  const drawn = rooms.reduce((s, x) => s + wc(x), 0), byName = rooms.filter(x => x.genderNeutral !== true).length;
  const acc = rooms.some(x => /universal/i.test(x.n) || x.accessible);
  const status = need === 0 ? 'pass' : (drawn >= need && acc ? 'pass' : 'fail');
  const text = need === 0 ? `public load ${load} ≤ 200: not required`
    : `public load ${load} > 200 → ${need} water closet(s) (1 accessible + 1 per further 100, ${opt.partial ? 'part increments counted' : 'whole increments, our reading'}); drawn ${drawn} (${rooms.map(x => x.n).join(', ') || 'none'}${byName ? `; ${byName} read by name` : ''}); the universal washroom counts as the accessible WC (our reading); stall, sink-zone, lighting and sign details: check in design`;
  return { id: 'VG', title: 'Gender-neutral washrooms (Vancouver)', status, text, src };
}
const api = { vgRow, vgNeed };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchVG = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['C5'] = (function (module) {
 
(function (root) {
'use strict';
const RATES = [
 [/refuge|rest area|warming shelter|day room|event hall/i, 0.75], [/dining/i, 1.20],
 [/class room|classroom|club|meeting|community room|community program|program room|multipurpose|drop-in|activity room/i, 1.85], [/lounge|break|staff room/i, 1.85],
 [/greenhouse|growing house|biome|glasshouse|production|propagation/i, 2.8], [/fitness|gym(?! storage)/i, 4.60], [/kitchen/i, 9.30],
 [/fish hall|headhouse|potting/i, 4.60], [/laundry/i, 4.60], [/first aid/i, 10.0], [/office|desk|cash|reception/i, 9.30],
 [/stor|cooler|supply|locker|detergent|custodial|janitor|holding|waste|chlorine|acid/i, 46.0]];
const CIRC = /corridor|spa deck|exit passage|exit steps|^stair|lift e\d|freight lift|^lift|shaft|riser|truck aisle|covered truck/i;
const DC = /^dc |\bdc\)|ups room|battery|mv switchgear|meet-me|sprinkler valve|security control|noc\b|data hall|^data-centre|shipping|storage and staging|garbage and recycling|loading|dock|fire suppression|janitor.*\(dc\)|transformer alcove|heat-recovery|^vestibule|secure/i;
const WCNAME = /\bwcs?\b|washroom|toilet/i, BATHER = /change room|changing places|universal dressing|pool hall|spa hall|therapy hall|sauna|steam|plunge|rest area \(wet\)|spa rest|spa deck|pre-swim|learner pool/i;
const CLIN = /clinic|exam room|procedure|consult|medication|clean supply|soiled|housekeeping|counselling|case-worker|interview|services|staff office 2|staff lounge$/i;
const STAFFWC = /dc staff wc|staff wc|staff shower|staff universal change/i, UNASSIGNED = /^unassigned/i, DCG = new Set(['sup', 'hall', 'load']);
const rate = n => { for (const [rx, r] of RATES) if (rx.test(n)) return r; return null; };
const area = x => x.r.reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]), 0);
 
const WHIRL = /spa|whirl|hot pool|hot tub/i;
function hallBathers(x, city) {
  const A = +x.waterM2 || 0, D = Math.min(+x.deepM2 || 0, A), whirl = x.whirlpool != null ? !!x.whirlpool : WHIRL.test((x.id || '') + ' ' + (x.n || ''));
  if (whirl) return A / 1.0;        
  return city === 'edm' ? A / 1.5 : D / 2.5 + (A - D) / 0.93;
}
function resolve(x) {
  const n = x.n, f = { byname: [] };
  f.dc = x.dataCentre != null ? !!x.dataCentre : (x.g != null ? DCG.has(x.g) : DC.test(n)); if (x.dataCentre == null && x.g == null && f.dc) f.byname.push('data centre');
  f.unassigned = (x.g != null ? x.g === 'spare' : UNASSIGNED.test(n)) || (x.g != null && UNASSIGNED.test(n));
  if (x.bathers != null) f.bather = !!x.bathers; else { f.bather = BATHER.test(n); if (f.bather) f.byname.push('bathers'); }
  if (x.staffOnly != null) f.staff = !!x.staffOnly; else { f.staff = STAFFWC.test(n) && !/visitor|public/i.test(n); if (f.staff) f.byname.push('staff WC'); }
  f.ppSet = 'perPersonM2' in x; f.pp = f.ppSet && x.perPersonM2 ? +x.perPersonM2 : null; f.grp = x.loadGroup || null;
  return f;
}
function c5Loads(G, opt = {}) {
  const rooms = []; for (const st of Object.keys(G.S)) for (const x of G.S[st]) if (x.g !== 'plant' || /mechanical/i.test(x.n)) rooms.push(Object.assign({ st: +st, a: area(x) }, x));
  const R = rooms.filter(r => r.a && !CIRC.test(r.n) && (opt.storey == null || r.st === opt.storey)); R.forEach(r => { r._f = resolve(r); });
  const BYN = {}; const by = (r, k) => { (BYN[k] = BYN[k] || new Set()).add(r.n); }; R.forEach(r => r._f.byname.forEach(k => by(r, k)));
  const cs = {}; for (const r of R) { if (WCNAME.test(r.n) || r._f.dc || r._f.unassigned) continue; const k = CLIN.test(r.n) && !/^(refuge|warming|day shelter|rest area)/i.test(r.n) ? 'c' : 'p'; cs[r.st] = cs[r.st] || { c: 0, p: 0 }; cs[r.st][k] += r.a; }
  const isClin = r => { if (/^(refuge|warming|day shelter|rest area|unassigned)/i.test(r.n)) return false; if (CLIN.test(r.n)) return true; if (/women|\bmen\b|visitor|non-bather|public|greenhouse|aquaponics/i.test(r.n)) return false; const s = cs[r.st] || { c: 0, p: 0 }; return s.c > s.p; };
  let pubL = 0, pubA = 0, clinA = 0, fL = 0, fA = 0, bathRaw = 0; const norate = [], city = opt.city || G.city || null;
  for (const r of R) { const n = r.n, f = r._f;
    if (f.bather && r.waterM2 != null) { bathRaw += hallBathers(r, city); continue; }
    if (f.bather && /pool hall|spa hall|therapy hall|learner pool/i.test(n)) by(r, 'bather room without waterM2');
    if (WCNAME.test(n) || f.dc || f.unassigned || f.bather) continue;
    if (opt.bathers && /fitness|gym/i.test(n)) continue;
    if (f.ppSet) { if (!f.pp) continue; if (f.grp === 'F') { fL += r.a / f.pp; fA += r.a; continue; } if (f.grp === 'D') { clinA += r.a; continue; } pubL += r.a / f.pp; pubA += r.a; continue; }
    if (/lobby|^entry/i.test(n)) continue;
    if (/mechanical|plant|generator|manifold|shower/i.test(n) || r.g === 'plant') { by(r, 'no load (plant, mechanical, shower)'); continue; }
    if (isClin(r)) { clinA += r.a; by(r, 'clinic'); continue; }
    const rt = rate(n); if (rt) { pubL += r.a / rt; pubA += r.a; by(r, 'load rate'); } else norate.push(n); }
  const bathers = Math.floor(bathRaw + 1e-6);
  return { public: Math.max(0, Math.ceil(pubL - 1e-9)) + bathers, bathers, bathCity: bathRaw ? city : null, clinic: Math.max(0, Math.ceil(clinA / 9.3 - 1e-9)), publicArea: Math.round(pubA), clinicArea: Math.round(clinA), groupF: Math.ceil(fL), byName: Object.fromEntries(Object.entries(BYN).map(([k, v]) => [k, v.size])), noRate: [...new Set(norate)], _R: R, _isClin: isClin };
}
function c5LoadRow(G, cfg, opt) {
  const L = c5Loads(G, Object.assign({ city: cfg && cfg.city }, opt || {})), C = (cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025', nb = Object.values(L.byName).reduce((a, b) => a + b, 0);
  return { id: 'C5', title: 'Occupant loads', status: nb > 0 ? 'flag' : 'pass', text: `public ${L.public} (${L.publicArea} m²${L.bathers ? ` + ${L.bathers} bathers from the water area` : ''}), clinic ${L.clinic} (${L.clinicArea} m² / 9.3)` + (nb ? `; read by name, no field: ${Object.entries(L.byName).map(([k, v]) => k + ' ' + v).join(', ')}` : '; every room read by its fields') + ` · rates: 1.85 program rooms (posted sign), 0.75 event hall and refuge, none on lobbies and entries`, src: `${C} Table 3.1.17.1; project decision, 16 Nov 07:06, 08:58; hub spec Part 1a (clinic / 9.3)`, loads: L };
}
 
function fullLoadG(G, city) {
  if (!G || !G.S) return { G, full: null };
  const full = c5Loads(G, { storey: 1, city: city || G.city }).public, S1 = G.S[1] || G.S['1'] || [];
  const refA = S1.filter(x => x.g === 'pub' && /refuge|shelter/i.test(x.n) && !/storage/i.test(x.n)).reduce((t, x) => t + area(x), 0), extra = full * 0.75 - refA - 1e-4;
  if (extra <= 1e-6) return { G, full };
  const side = Math.sqrt(extra);
  return { G: Object.assign({}, G, { S: Object.assign({}, G.S, { 1: S1.concat([{ id: '_c5load', n: 'refuge load equivalent (C5 full count; no doors)', g: 'pub', r: [[-1e4, -1e4 + side, -1e4, -1e4 + side]] }]) }) }), full };
}
const api = { c5Loads, c5LoadRow, fullLoadG, rate, RATES, hallBathers };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC5 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['E1'] = (function (module) {
 
(function (root) {
'use strict';
const r1 = x => (Math.round(x * 10) / 10).toFixed(1);
function e1PadsRow(G, cfg, hc, opt = {}) {
  const belowMinFails = opt.belowMinFails !== false, edm = (cfg && cfg.city) === 'edm';
  const A = hc.padAnalyse(G);
  const src = 'BC Hydro ES54 F0-02.01-.02 (Sep 2022)' + (edm ? '; EPCOR rule not read ?, BC Hydro read as the analogue (our reading)' : '');
  if (!A || !A.length) return { id: 'E1', title: 'Transformer pads', status: 'n/a', text: 'no transformer pads on this lot', src };
  const alc = ((G.S && (G.S['1'] || G.S[1])) || []).filter(x => x.id.startsWith('alc'));
  const prect = id => { const p = (G.PLANT || []).find(x => x.id === id); let q = p.r; return Array.isArray(q[0]) ? q[0] : q; };
  const S1 = ((G.S && (G.S['1'] || G.S[1])) || []);
   
  const openSide = r => { const sides = { u0: q => Math.abs(q[1] - r[0]) < 1e-6 && q[3] > r[2] + 1e-6 && q[2] < r[3] - 1e-6, u1: q => Math.abs(q[0] - r[1]) < 1e-6 && q[3] > r[2] + 1e-6 && q[2] < r[3] - 1e-6,
      v0: q => Math.abs(q[3] - r[2]) < 1e-6 && q[1] > r[0] + 1e-6 && q[0] < r[1] - 1e-6, v1: q => Math.abs(q[2] - r[3]) < 1e-6 && q[1] > r[0] + 1e-6 && q[0] < r[1] - 1e-6 };
    const free = Object.keys(sides).filter(k => !S1.some(x => !x.id.startsWith('alc') && x.r.some(q => sides[k](q))));
     
    const mu = (r[0] + r[1]) / 2, mv = (r[2] + r[3]) / 2, probe = { u0: [r[0] - 1.5, mv], u1: [r[1] + 1.5, mv], v0: [mu, r[2] - 1.5], v1: [mu, r[3] + 1.5] };
    const clear = free.filter(k => !S1.some(x => x.r.some(q => q[0] <= probe[k][0] && probe[k][0] <= q[1] && q[2] <= probe[k][1] && probe[k][1] <= q[3])));
    return clear.length === 1 ? clear[0] : (clear.includes('v1') ? 'v1' : clear[0] || free[0] || 'v1'); };
  const alcD = id => { const q = prect(id); for (const a of alc) { const r = a.r[0]; if (r[0] - 1e-6 <= q[0] && q[1] <= r[1] + 1e-6 && r[2] - 1e-6 <= q[2] && q[3] <= r[3] + 1e-6) {
      const d = { u0: q[0] - r[0], u1: r[1] - q[1], v0: q[2] - r[2], v1: r[3] - q[3] }; delete d[openSide(r)]; return Math.min(...Object.values(d)); } } return null; };
  const parts = [], margins = [];
  for (const d of A) {
    let b = d.alcove ? alcD(d.id) : null; if (b === null) b = d.bld;
    const cand = [['building', b], ['generator set', d.gen], ['chiller', d.chl], ['fence', d.fence]].sort((x, y) => x[1] - y[1]);
    const s = cand[0][1], fr = Math.max(...Object.values(d.depth));
    margins.push(s - 1.0, d.pad < 50 ? d.pad - 1.0 : 9, fr - 3.0);
    parts.push(`${d.id}: ${r1(s)} m to the nearest structure (${cand[0][0]}; ≥ 1.0)` + (d.pad < 50 ? `, ${r1(d.pad)} m to the next pad (≥ 1.0)` : '') + `, best front clear ${r1(fr)} m (≥ 3.0)`);
  }
  const mg = Math.min(...margins);
  let st = mg < -1e-6 ? (belowMinFails ? 'fail' : (mg >= -0.5 ? 'tight' : 'fail')) : (mg < 0.5 - 1e-9 ? 'tight' : 'pass');
  if (edm && st !== 'fail') st = '?';
  return { id: 'E1', title: 'Transformer pads', status: st, text: `${A.length} pads: ${parts.join('; ')} (structures = buildings, generator sets, chillers at grade, yard fences: our reading; front = the best side, not drawn) [script]`, src };
}
const api = { e1PadsRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchE1 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['E2'] = (function (module) {
 
(function (root) {
'use strict';
const NEW = { garb: 4.5, drive: 1.5 }, BASE = { gen: 3.0, bay: 7.6, chill: 7.6, art: 7.6 };
const LAB = { gen: 'generator', bay: 'bays', chill: 'chillers', art: 'arterial', garb: 'garbage', drive: 'drive or street' };
function segD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function rectD(p, r) { const dx = Math.max(r[0] - p[0], 0, p[0] - r[1]), dy = Math.max(r[2] - p[1], 0, p[1] - r[3]); return Math.hypot(dx, dy); }
function polyD(p, P) { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (((yi > p[1]) !== (yj > p[1])) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) inside = !inside; } if (inside) return 0; let m = Infinity; for (let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, segD(p, P[j], P[i])); return m; }
function zsOf(G) { const z = [G.SLAB != null ? G.SLAB : 0]; (G.H || []).forEach(h => z.push(z[z.length - 1] + h)); return z; }    
function newSources(G) {
  const S = G.S || {}, D = G.D || [], src = [], zs = zsOf(G);
  for (const st of Object.keys(S)) for (const x of S[st]) {
    const n = x.n.toLowerCase();
    if (/garbage|recycl|dumpster/.test(n) && D.some(d => String(d[0]) === String(st) && (d[1] === x.id || d[2] === x.id) && (d[1] === 'OUT' || d[2] === 'OUT')))
      x.r.forEach(r => src.push(['garb', ['rect', r], zs[+st - 1], zs[+st - 1] + 2.0]));    
    if (String(st) === '1' && /\baisle\b|driveway|parking/.test(n)) x.r.forEach(r => src.push(['drive', ['rect', r], 0, 0]));
  }
  (G.DUMPSTERS || []).forEach(r => src.push(['garb', Array.isArray(r[0]) ? ['poly', r] : ['rect', r], 0, 2.0]));
  (G.STREET_EDGES || []).forEach(([a, b]) => src.push(['drive', ['line', [a, b]], 0, 0]));
  (G.YARD_DRIVES || []).forEach(r => src.push(['drive', ['rect', r], 0, 0]));
  return src;
}
function hd(p, g) { return g[0] === 'rect' ? rectD(p, g[1]) : g[0] === 'line' ? segD(p, g[1][0], g[1][1]) : polyD(p, g[1]); }
function e2IntakeRow(G, cfg, hc) {
  const C = (cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025';
  const R = hc.intakeCheck(G, cfg || {}); const ns = newSources(G);
  if (!R.size) return { id: 'E2', title: 'Outdoor air intakes', status: '?', text: 'no zone found', src: `${C} Table 6.3.2.9` };
  const rank = { pass: 0, tight: 1, fail: 2 }; let worst = 'pass'; const parts = [], needs = [];
  for (const [zn, r] of R) {
    const d = Object.assign({}, r.d);
    for (const k of Object.keys(NEW)) { let m = 99; for (const [kk, g, z0, z1] of ns) if (kk === k) { const dz = (z0 <= r.z && r.z <= z1) ? 0 : Math.min(Math.abs(r.z - z0), Math.abs(r.z - z1)); m = Math.min(m, Math.hypot(hd(r.p, g), dz)); } d[k] = m; }
    const need = Object.assign({}, BASE, NEW), keys = Object.keys(need);
    const marg = Math.min(...keys.map(k => d[k] - need[k])), lim = keys.reduce((a, k) => (d[k] - need[k] < d[a] - need[a] ? k : a), keys[0]);
    let s = marg < -1e-9 ? 'fail' : marg < 0.5 - 1e-9 ? 'tight' : 'pass', note = '';
    if (s === 'pass' && d.gen < 10.0) { s = 'tight'; note = ' (3–10 m from a generator: tight, check in design; DECISIONS 11 Nov)'; }
    if (s === 'fail') needs.push(`${zn}: ${LAB[lim]} ${d[lim].toFixed(1)} m < ${need[lim]}`);
    if (rank[s] > rank[worst]) worst = s;
    const dd = keys.filter(k => d[k] < 50).map(k => `${LAB[k]} ${d[k].toFixed(1)}`).join(', ');
    parts.push(`${zn}: best point storey ${r.st} ${r.kind} (${dd ? dd + ' m' : 'every source more than 50 m away'}) ${s}${note}`);
  }
  return { id: 'E2', title: 'Outdoor air intakes', status: worst,
    text: 'one intake per zone at the best point on its walls (1.5 m up) or roof (0.3 m up); actual HVAC layout may differ: ' + parts.join('; ') + (needs.length ? ' · Needs: ' + needs.join('; ') : '') + ' [script]',
    src: `${C} 6.3.2.9.(2), Table 6.3.2.9 (generator 3.0, bays 7.6, chillers 7.6, arterial 7.6, garbage 4.5, drive or street 1.5); project decision, 16 Nov 20:32` };
}
const api = { e2IntakeRow, newSources };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchE2 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['E3'] = (function (module) {
 
(function (root) {
'use strict';
const LIM = 3.0, TOL = 0.5, EPS = 1e-9;
const f1 = x => x.toFixed(1), f0 = x => x.toFixed(0), fd = d => d < LIM + TOL ? d.toFixed(2) : f1(d);    
const SRC = 'NBC(AE) 2023 / VBBL 2025 Table 6.3.2.9 (vent for combustion products 3.0 m), applied to the openings of the greenhouse, biome and heated edge: our reading; project decision, 16 Nov 20:32 (: hard, no D1 below)';
const TIGHT = ' — tight: check in design (project decision, 9 Nov: within 0.5 m or 5 % of the limit)';
const rectD = (a, b) => Math.hypot(Math.max(0, b[0] - a[1], a[0] - b[1]), Math.max(0, b[2] - a[3], a[2] - b[3]));
const area = r => (r[1] - r[0]) * (r[3] - r[2]);
const gens = G => (G.PLANT || []).filter(p => /^[gh]/.test(p.id));    
const st = d => d < LIM - EPS ? 'fail' : d < LIM + TOL - EPS ? 'tight' : 'pass';
function nearest(G, rects) { let m = Infinity; for (const g of gens(G)) for (const r of rects) m = Math.min(m, rectD(g.r, r)); return m; }

function genClearRows(G) {
  const out = [];
  if (!gens(G).length) return out;
  const tgt = [];
  for (const k of Object.keys(G.S)) for (const x of G.S[k]) if (/growing house|biome/.test(x.n.toLowerCase())) tgt.push(...x.r);
  if (tgt.length) {
    const d = nearest(G, tgt), s = st(d);
    out.push({ id: 'E3-gh', title: 'Generators off the greenhouse', status: s, src: SRC, figure: d,
      text: `nearest generator ${fd(d)} m from the growing house or biome ≥ 3.0 (hard; below 3.0 fails)` + (s === 'tight' ? TIGHT : '') + ' [script]' });
  }
  if (G.EDGE) {
    const d = nearest(G, [G.EDGE]), s = st(d);
    out.push({ id: 'E3-edge', title: 'Heated public edge on the street, off the plant', status: s, src: SRC, figure: d,
      text: `${f0(area(G.EDGE))} m² edge; nearest generator ${fd(d)} m ≥ 3.0 (hard; below 3.0 fails)` + (s === 'tight' ? TIGHT : '') + ' [script]' });
  }
  return out;
}

const api = { genClearRows, SRC, LIM };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchE3 = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['B4'] = (function (module) {
 
(function (root) {
'use strict';
const TOL = 0.5, EPS = 1e-9;
const f1 = x => (Math.round(x * 10) / 10).toFixed(1), f0 = x => String(Math.round(x));
const RANK = ['pass', 'tight', '?', 'fail'];
const worse = (a, b) => RANK.indexOf(a) > RANK.indexOf(b) ? a : b;
 
const st = (ok, margin) => !ok ? 'fail' : (margin < TOL - EPS ? 'tight' : 'pass');
const TIGHT = ' — tight: check in design (project decision, 9 Nov: within 0.5 m or 5 % of the limit)';
const rooms = (G, s) => G.S[String(s)] || [];
const storeys = G => Object.keys(G.S).map(Number).sort((a, b) => a - b);
function ptRect(p, r) { const dx = Math.max(r[0] - p[0], 0, p[0] - r[1]), dy = Math.max(r[2] - p[1], 0, p[1] - r[3]); return Math.hypot(dx, dy); }
function ptSeg(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy;
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2)) : 0;
  return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy);
}
function ptPoly(p, P) { let m = Infinity; for (let i = 0; i < P.length - 1; i++) m = Math.min(m, ptSeg(p, P[i], P[i + 1])); return m; }
const overlap = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
 
function onWall(G, p) {
  const R = rooms(G, 1).flatMap(x => x.r);
  const inside = R.some(r => r[0] + 0.05 < p[0] && p[0] < r[1] - 0.05 && r[2] + 0.05 < p[1] && p[1] < r[3] - 0.05);
  if (inside) return false;
  return R.some(r => ptRect(p, r) < 0.05);
}
 
function blocked(G, p, q) {
  const R = rooms(G, 1).flatMap(x => x.r), L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(2, Math.ceil(L / 0.1));
  for (let i = 1; i < n; i++) { const t = i / n, x = p[0] + t * (q[0] - p[0]), y = p[1] + t * (q[1] - p[1]);
    if (R.some(r => r[0] + 0.05 < x && x < r[1] - 0.05 && r[2] + 0.05 < y && y < r[3] - 0.05)) return true; }
  return false;
}
function nearestOnPoly(p, P) {
  let best = null, bd = Infinity;
  for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy;
    const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2)) : 0, q = [a[0] + t * vx, a[1] + t * vy], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < bd) { bd = d; best = q; } }
  return best;
}

const SRC = {
  AE: 'NBC 2023 (AE) 3.2.5.4-3.2.5.6, 3.2.5.15 (read 16 Nov, main pass 9: SOURCES_nbcae_pass9); Edmonton Fire Rescue Services Fire Access Plan (Dec 2021) adds no dimensions (SOURCES_edm_fire_access_2026-11-16); hydrants: City of Edmonton open data (EPCOR), 16 Nov 2026',
  VBBL: 'VBBL 2025 3.2.5.4-3.2.5.6, 3.2.5.15 (read 16 Nov by the hub: SOURCES_vbbl_confirm_2026-11-16, 3.2.5 section)'
};

function fireAccessRow(G, opts) {
  opts = opts || {};
  const city = opts.city || (G._cfg && G._cfg.city) || 'van';
  const code = opts.code || (city === 'edm' ? 'AE' : 'VBBL');
  const title = 'Fire department access, FDC', src = SRC[code];
  const S1 = rooms(G, 1);
  if (code === 'AE') {    
     
    const area = Math.max(...storeys(G).map(k => rooms(G, k).reduce((s, x) => s + x.r.reduce((a, r) => a + (r[1] - r[0]) * (r[3] - r[2]), 0), 0)));
    if (storeys(G).length <= 3 && area <= 600) return { id: 'B4', title, status: 'pass', src, text: `${storeys(G).length} storeys, ${f0(area)} m² building area: no access route required (3.2.5.4) [script]` };
  }
  const d = (G.D || []).find(x => x[0] === 1 && (x[1] === 'OUT' || x[2] === 'OUT') && [x[1], x[2]].some(i => String(i).startsWith('lob')));
  if (!d) return { id: 'B4', title, status: '?', src, text: 'no lobby street door found: principal entrance not identified [script]' };
  const e = [d[3], d[4]], parts = []; let s = 'pass', fdcSearch = null;
  const dr = G.DRIVE || null;
  const ddr = dr ? ptRect(e, dr) : null;
  const edges = G.STREET_EDGES || [];
  const dst = edges.length ? Math.min(...edges.map(P => ptPoly(e, P))) : null;
  const viaDrive = ddr !== null && ddr >= 3.0 - EPS && ddr <= 15.0 + EPS;
  const along = code === 'VBBL' ? ' along the path of travel (taken straight: nothing drawn between the door and the route; our reading)' : '';
  const cl = code === 'VBBL' ? '3.2.5.5.(1)(a)' : '3.2.5.5.(1)';
  if (viaDrive) parts.push(`principal entrance (lobby street door) ${f1(ddr)} m from the drawn drive${along} (3-15 m, ${cl})`);
  else if (dst !== null && G.ROADWAY_OFF) {
    const [off, how] = G.ROADWAY_OFF, tot = dst + off, s_ = st(tot >= 3.0 - EPS && tot <= 15.0 + EPS, 15.0 - tot); s = worse(s, s_);
    parts.push(`principal entrance ${f1(dst)} m from the street lot line + ${f1(off)} m to the roadway edge (${how}) = ${f1(tot)} m${along} (3-15 m, ${cl})`);
  } else if (dst !== null && dst <= 15.0) {
    s = worse(s, dst >= 3.0 - EPS ? 'tight' : '?');
    parts.push(`principal entrance ${f1(dst)} m from the street lot line; the roadway lies beyond it by the boulevard (width not read ?): 3-15 m (${cl}) holds if the boulevard is under ${f1(15.0 - dst)} m`);
  } else {
    s = 'fail'; parts.push(`principal entrance ${f1(Math.min(...[ddr, dst].filter(x => x !== null)))} m from the nearest access route (> 15 m, ${cl})`);
  }
   
  let fdc = null;
  for (const sg of [1, -1]) { const q = d[5] === 'v' ? [d[3], d[4] + sg * 4.0] : [d[3] + sg * 4.0, d[4]]; if (onWall(G, q)) { fdc = q; break; } }
  if (!fdc) { s = worse(s, '?'); parts.push('FDC: no spot on the entrance wall 4 m from the door ?'); }
  else {
    const de = Math.hypot(fdc[0] - e[0], fdc[1] - e[1]);
    if (code === 'AE') parts.push(`FDC drawn on the entrance wall ${f1(de)} m from the entrance (3-15 m, 3.2.5.15; position a drawing choice)`);
    else {
      const sF = st(de <= 5.0 + EPS, 5.0 - de); s = worse(s, sF);
      let vis = '?';
      if (edges.length) { const P = edges.reduce((b, P) => ptPoly(fdc, P) < ptPoly(fdc, b) ? P : b), q = nearestOnPoly(fdc, P); vis = blocked(G, fdc, q) ? 'fail' : 'pass'; }
      s = worse(s, vis);
      parts.push(`FDC drawn on the entrance wall ${f1(de)} m from the principal entrance (≤ 5 m, 3.2.5.15; position a drawing choice); `
        + (vis === 'pass' ? 'visible from the street (nothing built between it and the street line)' : vis === 'fail' ? 'NOT visible from the street (a room stands between it and the street line)' : 'visibility from the street not checked ?')
        + '; 1 m clear access around it: drawing note');
      parts.push("firefighters' path from the curb to the entrance ≥ 1.2 m wide (3.2.5.6.(3)): the walk is not drawn ?");
    }
  }
  if (dr) {
    const w = Math.min(dr[1] - dr[0], dr[3] - dr[2]), L = Math.max(dr[1] - dr[0], dr[3] - dr[2]);
    const over = storeys(G).filter(k => k > 1).some(k => rooms(G, k).some(x => x.r.some(r => overlap(r, dr) > 0.05))) || (G.COVERED || []).some(c => overlap(c, dr) > 0.05);
    const head = over ? G.H[0] : null, sw = st(w >= 6.0 - EPS, w - 6.0);
    if (viaDrive) { s = worse(s, sw); parts.push(`drive ${f1(w)} m clear (≥ 6 m, 3.2.5.6)`); }
    else { s = worse(s, sw === 'fail' ? 'fail' : 'pass'); parts.push(`drive ${f1(w)} m clear (≥ 6 m, 3.2.5.6; not the entrance's access route, so a margin under 0.5 m does not read tight: 16l)`); }
    if (head === null) parts.push('nothing built over it (≥ 5 m overhead)');
    else { s = worse(s, head >= 5.0 ? 'pass' : 'fail'); parts.push(`built over in part: ${f1(head)} m headroom (≥ 5 m)`); }
    parts.push(`${f0(L)} m long from the street` + (L > 90 ? ' (dead end over 90 m: turnaround needed)' : ' (no turnaround needed under 90 m)') + '; 12 m centre-line radius where it turns: not checked ?');
    if (city === 'edm' && L > 120) { s = 'fail'; parts.push('over 120 m: a second access is needed (EFRS Fire Access Plan, a City plan-review rule; our reading)'); }
  }
  if (code === 'AE') {
     
    const HY = (G.HYDRANTS || []).filter(h => !h[4] || h[4] === 'FAC');
    if (!HY.length && G.HYDRANTS) { s = 'fail'; parts.push('NO HYDRANT within 300 m of the lot in the City data (3.2.5.15 asks one within 45 m of the FDC; no FDC spot can reach one): needs on-site hydrant or private main (NFC(AE) 5.6.3.5)'); }
    else if (!HY.length) { parts.push('hydrant within 45 m of the FDC and the pumper position: ? (no hydrant data; status not changed, as the hand row)'); }
    else if (!fdc) { s = worse(s, '?'); parts.push('hydrant distance: ? (no FDC spot)'); }
    else {
       
      const lot = G.LOTPOLY ? G.LOTPOLY.concat([G.LOTPOLY[0]]) : null;
      const byRoute = h => { const p = [h[0], h[1]], ds = edges.length ? Math.min(...edges.map(P => ptPoly(p, P))) : Infinity;
        if (dr && ptRect(p, dr) <= 10.0) return true;
        return ds <= 40.0 && (!lot || ds <= ptPoly(p, lot) + 0.5); };
      const BY = HY.filter(byRoute);
      const evalAt = p => { const cand = BY.map(h => ({ h, d: Math.hypot(h[0] - p[0], h[1] - p[1]) })).sort((a, b) => a.d - b.d);
        const near = HY.map(h => ({ h, d: Math.hypot(h[0] - p[0], h[1] - p[1]) })).sort((a, b) => a.d - b.d)[0];
        const clearOne = cand.find(c => c.d <= 45.0 + EPS && !blocked(G, p, [c.h[0], c.h[1]]));
        const use = clearOne || cand[0] || near, d = use.d, clear = !!clearOne;
        const status = !cand.length || d > 45.0 + EPS ? 'fail' : !clear ? '?' : st(true, 45.0 - d);
        return { p, use, near, d, clear, by: cand.length > 0, status }; };
      const say = (r, lab) => (r.by ? `${lab}: nearest hydrant by an access route ${r.use.h[2]}, ${f1(r.d)} m (${r.use.h[3]})` : `${lab}: NO HYDRANT BY AN ACCESS ROUTE (nearest ${r.near.h[2]} at ${f1(r.near.d)} m)`)
        + (r.by && r.near.h[2] !== r.use.h[2] ? `, nearest of all ${r.near.h[2]} at ${f1(r.near.d)} m` : '') + (r.by && !r.clear && r.d <= 45 ? ', straight line crosses the building (hose path not traced ?)' : '');
      const hand = evalAt(fdc);
       
      const R1 = rooms(G, 1).flatMap(x => x.r), inRoom = (u, v) => R1.some(r => r[0] + 0.02 < u && u < r[1] - 0.02 && r[2] + 0.02 < v && v < r[3] - 0.02);
      const doorV = d[5] === 'v', line = doorV ? d[3] : d[4], cands = [];
      for (const r of R1) for (const [vert, c, lo, hi, nu, nv] of [[true, r[0], r[2], r[3], -1, 0], [true, r[1], r[2], r[3], 1, 0], [false, r[2], r[0], r[1], 0, -1], [false, r[3], r[0], r[1], 0, 1]]) {
        const onLine = vert === doorV && Math.abs(c - line) < 0.05, adj = vert !== doorV && (Math.abs(lo - line) < 0.05 || Math.abs(hi - line) < 0.05);
        if (!onLine && !adj) continue;
        for (let t = lo; t <= hi + 1e-9; t += 0.25) { const p = vert ? [c, t] : [t, c], de = Math.hypot(p[0] - e[0], p[1] - e[1]);
          if (de < 3.0 - EPS || de > 15.0 + EPS || inRoom(p[0] + nu * 0.3, p[1] + nv * 0.3)) continue;
          cands.push({ p, face: onLine ? 'entrance face' : 'face at its corner', de }); } }
      const RK = { pass: 0, tight: 1, '?': 2, fail: 3 };
      let best = null;
      for (const c of cands) { const r = evalAt(c.p); r.face = c.face; r.de = c.de;
        if (!best || RK[r.status] < RK[best.status] || (RK[r.status] === RK[best.status] && r.d < best.d)) best = r; }
      const pick = best && RK[best.status] < RK[hand.status] ? best : hand;
      s = worse(s, pick.status);
      parts.push(say(hand, `hand FDC spot (4.0 m along the entrance wall)`) + (hand.status !== 'pass' ? ` → ${hand.status}` : ''));
      if (best && pick === best) parts.push(say(best, `searched FDC spot (${best.face}, ${f1(best.de)} m from the principal entrance at (${f1(best.p[0])}, ${f1(best.p[1])}))`) + ` → ${best.status}`);
      else parts.push(`searched FDC spots (${cands.length} on the entrance face and the faces at its corners, 3-15 m from the entrance): none better than the hand spot`);
      parts.push('(≤ 45 m unobstructed, 3.2.5.15; pumper beside the hydrant, 3.2.5.5.(2)(a); path pumper to FDC ≤ 45 m, 3.2.5.5.(2)(c))'
        + (pick.status === 'fail' ? ': needs on-site hydrant or private main (NFC(AE) 5.6.3.5)' : ''));
      parts.push('EPCOR spacing class: flow ' + (pick.use.h[3] || '?') + ' (≤ 150 m spacing where the required fire flow is ≤ 100 L/s, else ≤ 90 m: EPCOR Vol. 4 1.7.1)');
      fdcSearch = { hand: { status: hand.status, d: hand.d }, searched: best ? { status: best.status, d: best.d, p: best.p, face: best.face } : null, n: cands.length };
    }
  }
  const sx = s === 'tight' ? TIGHT : '';
  return { id: 'B4', title, status: s, src, text: parts.join('; ') + sx + ' [script]', fdcSearch };
}

const api = { fireAccessRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchB4 = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['G1'] = (function (module) {
 
(function (root) {
'use strict';
const area = r => (r[1] - r[0]) * (r[3] - r[2]);
 
function edgeSplit(A, B) {
  const segs = [];
  for (const r of A) { segs.push(['h', r[2], r[0], r[1], -1], ['h', r[3], r[0], r[1], +1], ['v', r[0], r[2], r[3], -1], ['v', r[1], r[2], r[3], +1]); }
  const sub = (iv, a, b) => iv.flatMap(([x, y]) => (b <= x || a >= y) ? [[x, y]] : [[x, Math.min(a, y)], [Math.max(b, x), y]].filter(([p, q]) => q - p > 1e-6));
  const touch = (o, c, side, Rs) => Rs.filter(q => o === 'h' ? (side < 0 ? Math.abs(q[3] - c) < 0.011 : Math.abs(q[2] - c) < 0.011) : (side < 0 ? Math.abs(q[1] - c) < 0.011 : Math.abs(q[0] - c) < 0.011)).map(q => o === 'h' ? [q[0], q[1]] : [q[2], q[3]]);
  let tB = 0, free = 0;
  for (const [o, c, a, b, side] of segs) {
    let iv = [[a, b]];
    for (const [p, q] of touch(o, c, side, A)) iv = sub(iv, p, q);           
    let rest = iv; for (const [p, q] of touch(o, c, side, B)) rest = sub(rest, p, q);
    const L = iv.reduce((s, [x, y]) => s + y - x, 0), Lf = rest.reduce((s, [x, y]) => s + y - x, 0);
    tB += L - Lf; free += Lf;
  }
  return [tB, free];
}
function capGross(G, hc, use, opt = {}) {
  const T_EXT = opt.extWall != null ? opt.extWall : 0.40, T_SEP = 0.20, st = '1';
  const C = G.CAPS[use], groups = C[0], spec = C[2] || {}, R = (G.S[st] || []).filter(x => !(opt.drop || []).includes(x.id));
  const ownIds = new Set(R.filter(x => groups.includes(x.g) || (spec.own || []).includes(x.id)).map(x => x.id)), shIds = new Set(spec.shared || []);
  const othIds = new Set((spec.others || []).flatMap(([g, i]) => R.filter(x => g.includes(x.g) || i.includes(x.id)).map(x => x.id)));
  const rs = ids => R.filter(x => ids.has(x.id)).flatMap(x => x.r);
  const own = rs(ownIds), sh = rs(shIds), oth = rs(othIds), rest = R.filter(x => !ownIds.has(x.id) && !shIds.has(x.id)).flatMap(x => x.r);
  const aOwn = own.reduce((s, r) => s + area(r), 0), aSh = sh.reduce((s, r) => s + area(r), 0), aOth = oth.reduce((s, r) => s + area(r), 0);
  const frac = aOth ? aOwn / (aOwn + aOth) : 1;
  const net = aOwn + aSh * frac;
  const [pOwn, eOwn] = edgeSplit(own, rest.concat(sh)), [pSh, eSh] = sh.length ? edgeSplit(sh, rest.concat(own)) : [0, 0];
   
  const ownShared = sh.length ? edgeSplit(own, sh)[0] : 0, shOwn = sh.length ? edgeSplit(sh, own)[0] : 0;
  const allow = eOwn * T_EXT + (pOwn - ownShared) * T_SEP / 2 + frac * (eSh * T_EXT + (pSh - shOwn) * T_SEP / 2);
  return { net, gross: net + allow, allow };
}
function g1CapRow(G, cfg, hc, opt = {}) {
  const src = 'Zoning Bylaw 20001 s. 2.120 3.12.1, 3.3.1; Floor Area s. 4.1.66, 8.20 (gross); DECISIONS 14 Nov 09:22, 10:23, 10:51; 15 Nov 11:40';
  if (!G.CAPS || !Object.keys(G.CAPS).length) return { id: 'G1', title: 'Edmonton establishment caps', status: 'pass', text: 'no per-establishment cap on this lot (AED: s. 3.25) or no capped establishment', src };
  const parts = []; let worst = 'pass';
  for (const use of Object.keys(G.CAPS)) {
    const cap = G.CAPS[use][1], order = (opt.order && opt.order[use]) || [];
    let drop = [], g = capGross(G, hc, use, opt);
    const g0 = g;
    while (g.gross > cap + 1e-9 && drop.length < order.length) { drop = order.slice(0, drop.length + 1); g = capGross(G, hc, use, Object.assign({}, opt, { drop })); }
    const name = use.split(' (')[0];
    let s = g.gross <= cap + 1e-9 ? 'pass' : 'flag';
    if (s === 'flag') worst = 'flag';
    parts.push(`${name}: ${g0.net.toFixed(0)} m² net, ${g0.gross.toFixed(0)} m² gross` + (drop.length ? `; dropped ${drop.join(', ')} (capDrop) → ${g.gross.toFixed(0)} m² gross` : '') + ` against ${cap} m²: ` + (s === 'pass' ? 'within the cap' : (order.length ? 'still over after the capDrop ladder' : 'over, and no capDrop rooms listed') + ': set in the rezoning'));
  }
  return { id: 'G1', title: 'Edmonton establishment caps', status: worst, text: parts.join('; ') + ` (walls not drawn: exterior ${(opt.extWall != null ? opt.extWall : 0.40).toFixed(2)} m, separations 0.20 m, assumed ?) [script]`, src };
}
const api = { g1CapRow, capGross };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchG1 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['A10'] = (function (module) {
 
(function (root) {
'use strict';
function inPoly(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (((yi > p[1]) !== (yj > p[1])) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function segD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function inLot(p, P, tol) { if (inPoly(p, P)) return true; let m = Infinity; for (let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, segD(p, P[j], P[i])); return m <= tol; }
function a10RecessRow(G, cfg, hc, opt = {}) {
  const LD = opt.landing || 1.1, OUTD = 0.9, st = '1', rooms = G.S[st] || [], byId = Object.fromEntries(rooms.map(x => [x.id, x]));
  const lot = G.LOTPOLY, src = 'project decision, 16 Nov 08:58 (ruling B), 11:19 (stair shift); VBBL 2025 / NBC 2023 (AE) 3.4.6.3.(2)(c), 3.4.6.4';
  if (!lot) return { id: 'A10', title: 'Exit doors inside the lot, on a landing', status: '?', text: 'lot outline not in the plan', src };
  const isStair = x => !!x.stair && x.n.toLowerCase().startsWith('stair'), isPas = x => hc.kind(x, 1) === 'exitpas';
  const fails = [], ok = [];
  for (const d of (G.D || []).filter(d => String(d[0]) === st && (d[1] === 'OUT' || d[2] === 'OUT'))) {
    const id = d[1] === 'OUT' ? d[2] : d[1], x = byId[id]; if (!x || !(isStair(x) || isPas(x))) continue;
    const [u, v, o] = [d[3], d[4], d[5]], inside = p => x.r.some(r => r[0] - 1e-6 <= p[0] && p[0] <= r[1] + 1e-6 && r[2] - 1e-6 <= p[1] && p[1] <= r[3] + 1e-6);
    const cand = o === 'h' ? [[u, v + OUTD], [u, v - OUTD]] : [[u + OUTD, v], [u - OUTD, v]];
    const probe = o === 'h' ? [[u, v + 0.05], [u, v - 0.05]] : [[u + 0.05, v], [u - 0.05, v]];
    const outP = inside(probe[0]) ? cand[1] : cand[0];
    const inL = inLot(outP, lot, 0.05);
    let land = true, landTxt = '';
    if (isStair(x) && x.r.length === 1) { const r = x.r[0], alongU = (r[1] - r[0]) >= (r[3] - r[2]), a0 = alongU ? r[0] : r[2], a1 = alongU ? r[1] : r[3];
      const doorAlong = (o === 'h') === alongU, c = doorAlong ? (alongU ? u : v) : null, h = (d[6] || G.DOOR_W || 0.9) / 2;
      if (doorAlong) { land = (c - h >= a0 - 1e-6 && c + h <= a0 + LD + 1e-6) || (c - h >= a1 - LD - 1e-6 && c + h <= a1 + 1e-6); landTxt = land ? 'on its end landing' : `on the flight (end landings ${LD} m)`; }
      else { const wall = alongU ? u : v; land = Math.min(Math.abs(wall - a0), Math.abs(wall - a1)) < 1e-6; landTxt = land ? 'in the end wall (landing behind it)' : 'not on an end'; } }
    const label = `${id} door (${u}, ${v})`;
    if (!inL) fails.push(`${label}: outside landing (0.9 m out) past the lot line`);
    if (!land) fails.push(`${label}: ${landTxt}`);
    if (inL && land) ok.push(`${label}${landTxt ? ' ' + landTxt : ''}`);
  }
  if (!fails.length && !ok.length) return { id: 'A10', title: 'Exit doors inside the lot, on a landing', status: 'n/a', text: 'no storey-1 exit-stair or exit-passage door to the outside', src };
  return { id: 'A10', title: 'Exit doors inside the lot, on a landing', status: fails.length ? 'fail' : 'pass',
    text: (fails.length ? 'FAILS: ' + fails.join('; ') + ' · ' : '') + `${ok.length} door(s) with the 0.9 m outside landing inside the lot` + (ok.length ? ': ' + ok.join('; ') : '') + ' [script]', src };
}
const api = { a10RecessRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchA10 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['C10'] = (function (module) {
 
(function (root) {
'use strict';
const RX_EX = /\bexam/i, RX_TR = /treatment|procedure/i, RX_WAIT = /waiting|reception/i;
function c10ClinicRow(G, cfg, hc) {
  const src = 'NBC 2023 (AE) 3.8.5.2, 3.8.5.3, read 16 Nov';
  if ((cfg && cfg.city) !== 'edm') return { id: 'C10', title: 'Physician clinic (AE 3.8.5)', status: 'n/a', text: 'Vancouver: VBBL has no 3.8.5 of this content', src };
  const sts = Object.keys(G.S), D = G.D || [], DW = G.DOOR_W || 0.9, w = d => d[6] || DW;
  let st = sts.find(s => G.S[s].some(x => x.g === 'clin')); if (!st) return { id: 'C10', title: 'Physician clinic (AE 3.8.5)', status: 'n/a', text: 'no clinic', src };
  const rooms = G.S[st], clin = rooms.filter(x => x.g === 'clin'), byId = Object.fromEntries(rooms.map(x => [x.id, x]));
  const doorsOf = id => D.filter(d => String(d[0]) === st && (d[1] === id || d[2] === id));
  const roomDoorW = id => Math.max(0, ...doorsOf(id).map(w));
  const clearW = x => { const c = hc.clearSize(x, rooms, +st); return c.w; };
   
  const wait = clin.find(x => RX_WAIT.test(x.n)); let path = null;
  if (wait) { const prev = new Map([[wait.id, null]]), q = [wait.id];
    while (q.length && !path) { const c = q.shift();
      for (const d of doorsOf(c)) { const o = d[1] === c ? d[2] : d[1];
        if (o === 'OUT') { path = [d]; let k = c; while (prev.get(k)) { path.unshift(prev.get(k)[1]); k = prev.get(k)[0]; } break; }
        const y = byId[o]; if (!y || prev.has(o) || y.stair || y.core || y.g === 'load') continue; prev.set(o, [c, d]); q.push(o); } } }
  const fails = [], parts = [];
  if (path) { const narrow = path.filter(d => w(d) < 0.915 - 1e-9); parts.push(`path doors ${path.length - narrow.length} of ${path.length} ≥ 915 mm`); if (narrow.length) fails.push(`path doors ${narrow.map(d => `${d[1]}–${d[2]} ${w(d).toFixed(2)} m`).join(', ')} under 915 mm (3.8.5.2.(1))`); }
  else parts.push('path to the street not found (?)');
  if (wait) { const cw = clearW(wait); parts.push(`waiting area clear width ${cw.toFixed(2)} m (≥ 1.7 turning circle)`); if (cw < 1.7 - 1e-9) fails.push('waiting area under a 1.7 m turning circle (3.8.5.2.(3))'); }
  for (const [lab, rx, cl] of [['exam', RX_EX, '3.8.5.3.(1)'], ['treatment', RX_TR, '3.8.5.3.(2)']]) {
    const R = clin.filter(x => rx.test(x.n) && !(lab === 'exam' && RX_TR.test(x.n))); if (!R.length) continue;
    const need = Math.ceil(R.length / 5), ok = R.filter(x => roomDoorW(x.id) >= 0.915 - 1e-9 && clearW(x) >= 1.7 - 1e-9).length;
    parts.push(`${lab} rooms ${ok} of ${R.length} accessible (need ${need})`); if (ok < need) fails.push(`${lab} rooms: ${ok} accessible, ${need} needed (${cl}: 915 mm door and 1.7 m turning space)`);
  }
  parts.push('power door operators and assistive listening: not drawn (?)');
  return { id: 'C10', title: 'Physician clinic (AE 3.8.5)', status: fails.length ? 'fail' : 'pass', text: parts.join('; ') + (fails.length ? ' · FAILS: ' + fails.join('; ') : '') + ' [script]', src };
}
const api = { c10ClinicRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC10 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['E6'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'BC Guidelines for Pool Design 2025 s. 9.2, 9.9 (); delivery door off the street faces (DECISIONS 11 Nov); size: project chat pass 8 item 6, definition typ_heat_cascade (16q: below the minimum fails)';
const area = x => x.r.reduce((a, r) => a + (r[1] - r[0]) * (r[3] - r[2]), 0);
const RANK = ['pass', 'tight', '?', 'fail'], worse = (a, b) => RANK.indexOf(a) > RANK.indexOf(b) ? a : b;
 
function deliveryDoors(G, ids) {
  const R = (G.S['1'] || []).flatMap(x => x.r), inside = (u, v) => R.some(r => r[0] + 0.02 < u && u < r[1] - 0.02 && r[2] + 0.02 < v && v < r[3] - 0.02);
  const lanes = JSON.stringify(G.LANE_EDGES || []), segs = [];
  const court = G.CHEM_COURT ? (Array.isArray(G.CHEM_COURT[0]) ? G.CHEM_COURT : [G.CHEM_COURT]) : [];
  for (const P of (G.STREET_EDGES || []).filter(P => !lanes.includes(JSON.stringify(P)))) for (let i = 0; i < P.length - 1; i++) segs.push([P[i], P[i + 1]]);
  const near = (u, v) => segs.some(([a, b]) => { const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, t = L2 ? Math.max(0, Math.min(1, ((u - a[0]) * vx + (v - a[1]) * vy) / L2)) : 0; return Math.hypot(u - a[0] - t * vx, v - a[1] - t * vy) < 0.06; });
  const lot = Array.isArray(G.LOTPOLY) && G.LOTPOLY.length > 2 ? (Array.isArray(G.LOTPOLY[0]) ? G.LOTPOLY : G.LOTPOLY.reduce((a, v, i) => (i % 2 ? a[a.length - 1].push(v) : a.push([v]), a), [])) : null;
  const inLot = (x, y) => { let c = false; for (let i = 0, j = lot.length - 1; i < lot.length; j = i++) { const [xi, yi] = lot[i], [xj, yj] = lot[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const out = [];
  for (const d of (G.D || [])) { if (d[0] !== 1) continue; const id = d[1] === 'OUT' ? d[2] : d[2] === 'OUT' ? d[1] : null; if (!id || !ids.has(id)) continue;
    const dirs = d[5] === 'h' ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
    const dir = dirs.find(([du, dv]) => !inside(d[3] + du * 0.3, d[4] + dv * 0.3)) || dirs[0];
    let hit = null;
    const pu = d[3] + dir[0] * 0.3, pv = d[4] + dir[1] * 0.3;
     
    const gu = d[3] + dir[0] * 0.95, gv = d[4] + dir[1] * 0.95, ground = lot ? inLot(gu, gv) : null;
    if (court.some(c => c[0] - 0.01 <= pu && pu <= c[1] + 0.01 && c[2] - 0.01 <= pv && pv <= c[3] + 0.01)) { out.push({ door: d, room: id, street: null, court: true, ground }); continue; }
    for (let k = 3; k <= 1200; k++) { const u = d[3] + dir[0] * k * 0.1, v = d[4] + dir[1] * k * 0.1; if (inside(u, v)) break; if (near(u, v)) { hit = k * 0.1; break; } }
    out.push({ door: d, room: id, street: hit, ground }); }
  return out;
}
function chemStoreRow(G, opts) {
  opts = opts || {};
  const city = opts.city || (G._cfg && G._cfg.city);
  const D = opts.def || { hypo: { minM2: 8.0, minM2SpaOnly: 6.0 }, acid: { minM2: 8.0, minM2SpaOnly: 6.0 } };
  const S1 = G.S['1'] || [];
  const h = S1.filter(x => /hypochlorite/.test(x.n.toLowerCase())), a = S1.filter(x => /^acid store/.test(x.n.toLowerCase()));
  if (!h.length && !a.length) return null;
  const hid = new Set(h.map(x => x.id)), aid = new Set(a.map(x => x.id));
  const door = (G.D || []).some(d => d[0] === 1 && ((hid.has(d[1]) && aid.has(d[2])) || (hid.has(d[2]) && aid.has(d[1]))));
  const pool = S1.some(x => /pool hall/.test(x.n.toLowerCase()));
  let s = (h.length && a.length && !door) ? 'pass' : 'fail';
  const Ah = h.reduce((t, x) => t + area(x), 0), Aa = a.reduce((t, x) => t + area(x), 0);
  const size = (A, d) => { const m = pool ? d.minM2 : (d.minM2SpaOnly != null ? d.minM2SpaOnly : d.minM2);
    return [A < m - 1e-9 ? 'fail' : A < m * 1.05 - 1e-9 ? 'tight' : 'pass', m]; };
  const [sh, mh] = size(Ah, D.hypo), [sa, ma] = size(Aa, D.acid);
  if (h.length) s = worse(s, sh); if (a.length) s = worse(s, sa);
  const dd = deliveryDoors(G, new Set([...hid, ...aid])), onSt = dd.filter(x => x.street !== null);
  s = worse(s, onSt.length ? 'fail' : dd.length ? 'pass' : '?');
   
  const noGround = dd.filter(x => x.ground === false), unk = dd.filter(x => x.ground === null);
  const gStatus = !dd.length ? '?' : noGround.length ? 'fail' : unk.length ? '?' : 'pass';
  s = worse(s, gStatus);
  const dtxt = onSt.length ? `; DELIVERY DOOR ON A STREET FACE (${onSt.map(x => x.room + ' door, ' + x.street.toFixed(1) + ' m from the street line').join('; ')}; DECISIONS 11 Nov)`
    : dd.length ? `; delivery door${dd.length > 1 ? 's' : ''} off the street faces${dd.some(x => x.court) ? ' (into the screened service court)' : ''} (DECISIONS 11 Nov)` : '; no store door straight outside: delivery route not drawn ?';
  const text = `hypochlorite store ${Ah.toFixed(1)} m² (minimum ${mh.toFixed(1)}: ${sh}) and acid store ${Aa.toFixed(1)} m² (minimum ${ma.toFixed(1)}: ${sa}), separate rooms`
    + (!door ? ', a wall between them, no door between' : ', A DOOR BETWEEN THEM')
    + (!h.length ? '; NO HYPOCHLORITE STORE' : '') + (!a.length ? '; NO ACID STORE' : '')
    + '; tanks bunded to 110 % of the largest, separate fill points, injection before the acid injection point, ventilated to outside: not drawn, check in design; store size '
    + (!pool ? 'about 6 m² for the spa alone (one circulation system; project decision, 16 Nov 09:51,  item 5)' : '8-10 m²: project chat arithmetic on sourced inputs (pass 8 item 6; daily bathers assumed 400-800)')
    + dtxt
    + (noGround.length ? `; DELIVERY DOOR ONTO NO GROUND: ${noGround.map(x => x.room).join(', ')} ${noGround.length > 1 ? 'open' : 'opens'} within 0.9 m of the lot line (a neighbour's lot, lane or street), no 0.9 m of ground inside the lot (17aa)` : dd.length && !unk.length ? '; delivery door onto 0.9 m or more of ground inside the lot' : dd.length ? '; ground outside the delivery door not tested (no lot outline) ?' : '')
    + (s === 'tight' ? '; within 5 % above the minimum — tight: check in design' : '')
    + '; quantities under the Fire Code dangerous-goods limits per fire compartment (Table 3.2.7.1 Column C, BC FC 2018 read): hypochlorite 12.5 % Class 8 PG III ≤ 2,000 L, acid (HCl assumed, Class 8 PG II) ≤ 1,000 L: tank sizes not drawn, check in design (project decision, 17 Nov 16:22)'
    + (city === 'edm' ? '; NBC(AE) 7.2.3.45 covers gas chlorine only (liquid hypochlorite here); a 1 h store wall is a drawing choice, not a code row (project decision, 17 Nov 16:22); 7.2.3.39.(2): storage not near heating equipment, no direct access to public areas' : '') + ' [script]';
  return { id: 'E6', title: 'Hypochlorite and acid stored apart (wall), 110 % bunding', status: s, text, src: SRC, groundStatus: gStatus };
}
const api = { chemStoreRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchE6 = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['F6'] = (function (module) {
 
(function (root) {
'use strict';
const E = 0.005;
function HC(o) { if (o && o.hubchecks) return o.hubchecks; if (root && root.BD && root.BD.hubchecks) return root.BD.hubchecks; throw new Error('F6: hubchecks (clearGeom) not available: pass opts.hubchecks (BD.hubchecks)'); }
const f2 = x => (Math.round(x * 100 + 1e-9) / 100).toFixed(2);
const room = (S1, id) => S1.find(x => x.id === id);
function gaps(hc, S1, hid, t) {
  const b = hc.clearGeom(room(S1, hid), S1, 1).bounds;   
  return { W: t[0] - b[0], E: b[2] - t[1], S: t[2] - b[1], N: b[3] - t[3], b };
}
 
function poolDeck(plan, city, hc) {
  const S1 = plan.S['1'], T = plan.POOL_TANK, g = gaps(hc, S1, 'pool', T);
  const longU = (T[1] - T[0]) >= (T[3] - T[2]);
  const ends = longU ? [g.W, g.E] : [g.S, g.N], sides = longU ? [g.S, g.N] : [g.W, g.E];
  const L = Math.max(T[1] - T[0], T[3] - T[2]), least = Math.min(...ends, ...sides), edm = city === 'edm';
  const bench = L >= 24.0 && (Math.min(...ends) < 2.0 - E || Math.min(...sides) < 1.5 - E);
  let st;
  if (edm) st = least < 1.8 - E ? 'fail' : (bench ? 'tight' : 'pass');
  else st = least < 1.2 - E ? 'fail' : ((least < 1.8 - E || bench) ? 'tight' : 'pass');
  const fig = edm ? '1.8 m' : '1.8 m tool extension, 1.2 m BC minimum';
  let text = L >= 24.0
    ? `ends ${f2(Math.min(...ends))} / ${f2(Math.max(...ends))} m, sides ${f2(Math.min(...sides))} / ${f2(Math.max(...sides))} m, measured to the clear face of the hall (wall convention, DECISIONS 11 Nov) from the 25 m tank; least ${f2(least)} m against the code figure ${fig}`
    : `learner pool; least deck ${f2(least)} m to the clear face against the code figure ${fig}`;
  if (bench && st !== 'fail') text += '. Tight: benchmark (Swim England, 4 lanes: ends 2.0 m, sides 1.5 m, as given by project decision), not a code figure';
  text += '; the clear 1.2 m round obstructions is checked in the lifeguard chair and bench rows';
  return { id: 'F6-pool-deck', title: 'Pool deck: 1.8 m round (NBC(AE) 7.2.3.15); Swim England ends 2.0 m, sides 1.5 m as benchmark', status: st, least, text,
    src: (edm ? 'NBC(AE) 7.2.3.15.(1)(a): deck not less than 1.8 m wide round the entire pool (Edmonton; law)' : "NBC(AE) 7.2.3.15.(1)(a) 1.8 m, the tool's extension to Vancouver (not VBBL); BC Guidelines for Pool Design 2025 s. 3.2 minimum 1.2 m") + '; Swim England design guidance, 25 m x 4 lanes (project decision, 16 Nov 07:06, as given; benchmark)' };
}
 
const isWhirl = hid => /spa|whirl|hot/i.test(hid);
function bathDecks(plan, hc, city) {
  const S1 = plan.S['1'], out = []; let st = 'pass', least = 9; const W = (a, b) => (['pass', 'tight', 'fail'].indexOf(a) >= ['pass', 'tight', 'fail'].indexOf(b) ? a : b);
  for (const [hid, t] of Object.entries(plan.TANKS)) {
    const g = gaps(hc, S1, hid, t), keys = ['W', 'E', 'S', 'N'], m = Math.min(g.W, g.E, g.S, g.N); least = Math.min(least, m);
    if (isWhirl(hid)) {
      const ent = keys.reduce((a, k) => g[k] > g[a] ? k : a, 'W'), others = keys.filter(k => k !== ent).map(k => g[k]);
      const ok = g[ent] >= 1.8 - E && Math.min(...others) >= 1.2 - E; st = W(st, ok ? 'pass' : 'fail');
      out.push(`${hid} (whirlpool): entry side ${ent} ${f2(g[ent])} m (needs 1.8), others ${keys.filter(k => k !== ent).map(k => k + ' ' + f2(g[k])).join(', ')} m (need 1.2)`);
    } else {
      const s1 = m >= 1.8 - E ? 'pass' : (city === 'van' && m >= 1.2 - E ? 'tight' : 'fail'); st = W(st, s1);
      out.push(`${hid} (pool): least deck ${f2(m)} m (${f2(g.W)} W, ${f2(g.E)} E, ${f2(g.S)} S, ${f2(g.N)} N; needs 1.8${city === 'van' ? ', 1.2 m BC minimum' : ''})`);
    }
  }
  return { id: 'F6-bath-deck', title: 'Bath decks: whirlpool 1.8 m at the entry, 1.2 m elsewhere; other pools 1.8 m all round', status: st, least,
    text: out.join('; ') + '. Walls: exterior 0.30 m, partitions 0.10 m (clear face). The whole widest side stands in for the main entrance point (reading 1); Edmonton also runs the local entry-area reading (F6-whirlpool-deck)',
    src: 'Whirlpool: NBC(AE) 7.2.6.2.(7)-(8) entry 1.8 m with BC Guidelines for Pool Design 2025 s. 3.2 sides 1.2 m, both cities (project decision, 17 Nov 15:02,  item 4); other pools: NBC(AE) 7.2.3.15.(1)(a) 1.8 m (project decision, 17 Nov 12:20), Vancouver floor 1.2 m (BC Guidelines s. 3.2)' };
}
 
function attendant(plan) {
  const S1 = plan.S['1'], a = S1.find(x => x.windows);
  if (!a) return { id: 'F6-attendant', title: 'Attendant position with a window onto both halls', status: '?', text: 'no attendant position drawn: the engine has no attendant room yet (definition item, project decision, 16 Nov 09:18); reads ? until it does, not counted as a pass (17ai)', src: 'project decision, 16 Nov 09:18' };
  const msg = []; let good = true;
  for (const hid of a.windows) {
    const h = room(S1, hid); let L = 0;
    for (const r1 of a.r) for (const r2 of h.r) {
      if (Math.abs(r1[1] - r2[0]) < 1e-6 || Math.abs(r2[1] - r1[0]) < 1e-6) L += Math.max(0, Math.min(r1[3], r2[3]) - Math.max(r1[2], r2[2]));
      if (Math.abs(r1[3] - r2[2]) < 1e-6 || Math.abs(r2[3] - r1[2]) < 1e-6) L += Math.max(0, Math.min(r1[1], r2[1]) - Math.max(r1[0], r2[0]));
    }
    msg.push(`${hid} wall ${(Math.round(L * 10) / 10).toFixed(1)} m`); good = good && L >= 1.0 - 1e-9;
  }
  return { id: 'F6-attendant', title: 'Attendant position with a window onto both halls', status: good ? 'pass' : 'fail', text: `shared wall with each hall: ${msg.join(', ')}; sightline to every part of both pools is not simulated`, src: 'project decision, 16 Nov 09:18; BC Guidelines 2025 s. 3.2' };
}
 
function entryArea(plan, hid, t, hc, sq = 1.8, TP = 0.10) {
  const S1 = plan.S['1'], x = room(S1, hid), b = hc.clearGeom(x, S1, 1).bounds, byId = {}; S1.forEach(y => { byId[y.id] = y; });
  const sides = [['N', 'h', t[3], b[3], [t[0], t[1]]], ['S', 'h', t[2], b[1], [t[0], t[1]]], ['E', 'v', t[1], b[2], [t[2], t[3]]], ['W', 'v', t[0], b[0], [t[2], t[3]]]];
  let best = null;
  for (const [side, ori, edge, face, span] of sides) {
    const gap = Math.abs(face - edge);
    for (const d of plan.D) {
      if (d[0] !== 1 || !(d[1] === hid || d[2] === hid) || d[5] !== ori) continue;
      const o = d[1] === hid ? d[2] : d[1]; if (o === 'OUT' || !byId[o]) continue;
      const wallC = ori === 'h' ? d[4] : d[3], c = ori === 'h' ? d[3] : d[4], w = d.length > 6 ? d[6] : 0.9;
      if (Math.abs(wallC - face) > 0.25) continue;
      if (!(span[0] <= c - sq / 2 + 1e-6 && c + sq / 2 <= span[1] + 1e-6)) continue;
      const rm = byId[o], deckRoom = rm.wet && /deck/i.test(rm.n), nb = sq - gap - TP;
      const covers = rm.r.some(r => ori === 'h' ? (r[0] <= c - sq / 2 + 1e-6 && c + sq / 2 <= r[1] + 1e-6 && r[2] <= wallC && wallC <= r[3]) : (r[2] <= c - sq / 2 + 1e-6 && c + sq / 2 <= r[3] + 1e-6 && r[0] <= wallC && wallC <= r[1]));
      const ok = w >= sq - 1e-6 && (nb <= 1e-6 || (deckRoom && covers)), cand = { ok, side, o, c, w, gap, nb, short: Math.max(0, sq - w) };
      if (!best || (cand.ok && !best.ok) || (cand.ok === best.ok && cand.short < best.short)) best = cand;
    }
  }
  return best;
}
function whirlpoolDecks(plan, hc) {
  const S1 = plan.S['1'], o1 = [], o2 = []; let ok1 = true, ok2 = true;
  for (const [hid, t] of Object.entries(plan.TANKS).filter(([h]) => isWhirl(h))) {
    const g = gaps(hc, S1, hid, t), keys = ['W', 'E', 'S', 'N'], ent = keys.reduce((a, k) => g[k] > g[a] ? k : a, 'W'), others = keys.filter(k => k !== ent).map(k => g[k]);
    const good = g[ent] >= 1.8 - E && Math.min(...others) >= 0.9 - E; ok1 = ok1 && good;
    o1.push(`${hid}: widest side ${ent} ${f2(g[ent])} m, others ${keys.filter(k => k !== ent).map(k => k + ' ' + f2(g[k])).join(', ')} m` + (good ? '' : ` (short ${f2(Math.max(0, 1.8 - g[ent]))} m)`));
    const best = entryArea(plan, hid, t, hc), minAll = Math.min(g.W, g.E, g.S, g.N), o = !!(best && best.ok) && minAll >= 0.9 - E; ok2 = ok2 && o;
    o2.push(`${hid}: ` + (best ? (best.ok ? `steps on the ${best.side} edge at ${f2(best.c)}, door to ${best.o} ${(Math.round(best.w * 10) / 10).toFixed(1)} m wide: 1.8 x 1.8 m clear = ${f2(best.gap)} m deck + 0.10 m partition + ${f2(Math.max(0, best.nb))} m of ${best.o}` : `best entry ${best.side} edge, door to ${best.o} ${(Math.round(best.w * 10) / 10).toFixed(1)} m wide against 1.8 m`) : 'no door from a deck room opens onto a tank edge') + `; other sides least ${f2(minAll)} m (0.9 m needed)`);
  }
  return { id: 'F6-whirlpool-deck', title: 'Whirlpool decks: 1.8 m at the main entry point, 0.9 m elsewhere (NBC(AE) 7.2.6.2.(7)-(8))', status: ok2 ? 'pass' : 'fail', reading1: ok1 ? 'pass' : 'fail',
    text: 'Reading 2 (local clear area at the entry steps, this row): ' + o2.join('; ') + '. Reading 1 (whole widest side 1.8 m): ' + (ok1 ? 'pass' : 'fail') + ' (' + o1.join('; ') + '). Exception (9) does not apply (over 6 m2 with a dimension over 2.5 m). Whirlpools only: the therapy pool is a pool (project decision, 17 Nov 12:20)',
    src: 'NBC 2023 Alberta Edition 7.2.6.2.(7), (8), (9); the spa hot pool is a whirlpool, the therapy pool is not (project decision, 17 Nov 12:20)' };
}
 
const STD = { pool_hall: { l: 25, w: 8.5 }, pool: { l: 25, w: 8.5 }, learner: { l: 13, w: 7 }, spa_hall: { l: 8, w: 5, whirl: true }, spa: { l: 8, w: 5, whirl: true }, therapy_hall: { l: 6, w: 4 }, thp: { l: 6, w: 4 } };
function tankOf(hid, def) {
  const r = def && (def.rooms || []).find(x => x.id === hid), learner = def && def.learner && hid === 'learner' ? def.learner : null, t = (r && r.tank) || (learner && learner.tank);
  const whirl = r && r.whirlpool != null ? !!r.whirlpool : /spa|whirl|hot/i.test(hid + ' ' + ((r && r.name) || ''));
  if (t && t.l && t.w) return { l: Math.max(t.l, t.w), w: Math.min(t.l, t.w), whirl };
  const s = STD[hid]; return s ? { l: s.l, w: s.w, whirl: s.whirl != null ? s.whirl : whirl } : null;
}
function clearDecks(plan, opt) {
  const hc = HC(opt), city = opt.city, def = opt.def || null, S1 = plan.S['1'] || plan.S[1] || [], out = [];
  const halls = S1.filter(x => x.waterM2 != null || STD[x.id] || (def && (def.rooms || []).some(r => r.id === x.id && r.waterM2 != null)));
  let worst = 'pass', least = 99; const rank = ['pass', 'tight', 'fail'], W = (a, b) => rank.indexOf(a) >= rank.indexOf(b) ? a : b;
  for (const h of halls) {
    const t = tankOf(h.id, def); if (!t) { out.push(`${h.id}: no tank size in the definition (?)`); worst = W(worst, 'tight'); continue; }
    const b = hc.clearGeom(h, S1, 1).bounds, cw = b[2] - b[0], cl = b[3] - b[1], lo = Math.max(cw, cl), sh = Math.min(cw, cl);
    let st, need;
    if (t.whirl) { const a = lo >= t.l + 3.0 - E && sh >= t.w + 2.4 - E, c = lo >= t.l + 2.4 - E && sh >= t.w + 3.0 - E; st = a || c ? 'pass' : 'fail';
      need = `${f2(t.l + 3.0)} x ${f2(t.w + 2.4)} (entry at a short end) or ${f2(t.l + 2.4)} x ${f2(t.w + 3.0)} (entry on a long side)`; least = Math.min(least, Math.min(sh - t.w, lo - t.l) / 2); }
    else { const full = lo >= t.l + 3.6 - E && sh >= t.w + 3.6 - E, bc = lo >= t.l + 2.4 - E && sh >= t.w + 2.4 - E; st = full ? 'pass' : (city === 'van' && bc ? 'tight' : 'fail');
      need = `${f2(t.l + 3.6)} x ${f2(t.w + 3.6)}${city === 'van' ? ` (1.2 m BC floor ${f2(t.l + 2.4)} x ${f2(t.w + 2.4)})` : ''}`; least = Math.min(least, Math.min(sh - t.w, lo - t.l) / 2); }
    worst = W(worst, st); out.push(`${h.id}: clear ${f2(lo)} x ${f2(sh)} m for a ${t.l} x ${t.w} m ${t.whirl ? 'whirlpool' : 'pool'}, needs ${need}: ${st}`);
  }
  return { status: halls.length ? worst : '?', text: (out.join('; ') || 'no pool hall drawn') + '. Tank position inside the hall: design development (main 17ai)', least };
}
function rows(plan, opt) {
  opt = opt || {}; const city = opt.city, typ = opt.typology || (plan.TANKS || /warm_bath/.test(plan.typology || '') ? 'WB' : 'CP');
  const c = clearDecks(plan, opt);
  if (typ === 'CP') return [{ id: 'F6-pool-deck', title: 'Pool deck: hall clear size holds the tank and a 1.8 m deck round (NBC(AE) 7.2.3.15)', status: c.status, least: c.least, text: c.text,
    src: (city === 'edm' ? 'NBC(AE) 7.2.3.15.(1)(a) (Edmonton, law)' : "NBC(AE) 7.2.3.15.(1)(a) 1.8 m, the tool's extension to Vancouver; BC Guidelines for Pool Design 2025 s. 3.2 minimum 1.2 m (tight band)") + '; clear-size reading (main 17ai)' }];
  return [{ id: 'F6-bath-deck', title: 'Bath decks: hall clear sizes hold each tank with its decks (whirlpool 1.8 m entry / 1.2 m; other pools 1.8 m round)', status: c.status, least: c.least, text: c.text,
    src: 'NBC(AE) 7.2.6.2.(7)-(8) and 7.2.3.15.(1)(a); BC Guidelines 2025 s. 3.2; project decision, 17 Nov 12:17-15:02 (17q, 17v); clear-size reading (main 17ai)' }, attendant(plan)];
}
const toHubRow = r => [r.status, r.title, r.src, r.text];
const api = { rows, clearDecks, tankOf, poolDeck, bathDecks, attendant, whirlpoolDecks, entryArea, toHubRow, version: 'F6 patch 17ai' };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.f6 = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['P1'] = (function (module) {
 
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else (root.BD = root.BD || {}).P1 = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function sharedWall(A, B) {
    let t = 0; const ov = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
    for (const a of A.r || []) for (const b of B.r || []) {
      if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(a[0] - b[1]) < 1e-6) t += ov(a[2], a[3], b[2], b[3]);
      if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(a[2] - b[3]) < 1e-6) t += ov(a[0], a[1], b[0], b[1]);
    }
    return t;
  }
  function rows(plan, opt) {
    const S1 = (plan.S && (plan.S['1'] || plan.S[1])) || [], D = (plan.D || []).filter(d => d[0] === 1);
    const by = {}; S1.forEach(x => by[x.id] = x);
    const nb = id => D.filter(d => d[1] === id || d[2] === id).map(d => d[1] === id ? d[2] : d[1]);
    const nm = id => ((by[id] && by[id].n) || '').toLowerCase();
    const isHall = id => /^(pool|thp|spa|pool_hall|spa_hall|therapy_hall|learner)$/.test(id) || (by[id] && by[id].waterM2 != null) || /^(pool|therapy|spa)\b/.test(nm(id)) && /hall|deck/.test(nm(id));    
    const isChem = x => /^(chlorine|hypochlorite|acid|chem_store|cl2)$/.test(x.prog || x.id) && !/^program_room/.test(x.id);    
    const isEncl = id => isHall(id) || /change room|universal dressing/.test(nm(id));
    const out = [], plants = S1.filter(x => /^(pool_plant|bath_plant|spa_plant|pplant)$/.test(x.prog || x.id));        
    plants.forEach(p => {
      const a = nb(p.id), outside = a.includes('OUT');
      const direct = a.some(isEncl);
      const viaOne = a.some(x => x !== 'OUT' && by[x] && /store|passage/.test(nm(x)) && nb(x).some(isEncl));
      const viaCor = a.includes('cor');
      const reach = direct || viaOne;
      const status = !outside ? 'fail' : reach ? 'pass' : (viaCor && opt.city === 'van' ? 'tight' : viaCor ? 'tight' : 'fail');
      out.push({ id: 'P1.plant', title: 'Pool plant room: reached from the pool enclosure and an outside door', status,
        src: 'NBC(AE) 7.2.3.38.(1), (2) (Edmonton, law; our reading of "reasonably accessible"). Vancouver: tool extension, not VBBL or BC Pool Regulation (BC Guidelines for Pool Design not re-read)',
        text: `plant ${p.id}: outside door ${outside ? 'yes' : 'NO'}; locked door from the pool enclosure ${direct ? 'direct' : viaOne ? 'through one deck store' : 'none' + (viaCor ? ' (corridor only: tight)' : '')}; floor fall 1:50-1:25 to drains and servicing space: check in design` });
    });
    S1.filter(isChem).forEach(c => {
      const bad = nb(c.id).filter(x => x !== 'OUT' && (isHall(x) || (by[x] && /^(pub|grow)$/.test(by[x].g))));
      const hot = S1.filter(x => x !== c && /heat pump|boiler|heat.?recovery|electrical|switchgear|chiller/.test((x.n || '').toLowerCase()) && sharedWall(c, x) > 1e-6);
      const status = bad.length ? 'fail' : hot.length ? 'tight' : 'pass';
      out.push({ id: 'P1.chem', title: 'Chemical store: no door to a public room, not beside heating equipment', status, src: 'NBC(AE) 7.2.3.39.(1), (2) (Edmonton, law; no distance in the code; our reading: no shared wall). Vancouver: tool extension, not VBBL or BC Pool Regulation',
        text: `${c.id}: doors to ${nb(c.id).join(', ') || 'none'}${bad.length ? ': public or hall door (fail)' : ''}; shares a wall with heating equipment: ${hot.length ? hot.map(x => x.id).join(', ') + ' (tight)' : 'none'}` });
    });
    return out;
  }
  return { rows, toHubRow: r => [r.status, r.title, r.src, r.text], version: 'P1 patch 18p' };
});

return module.exports; })({ exports: {} });
 
P['C3'] = (function (module) {
 
(function (root) {
'use strict';
function c3Rooms(G, cfg, hc, opt = {}) {
  const belowMinFails = opt.belowMinFails !== false;
  const rows = hc.auditGeom(G.S, (cfg && cfg.small_lot) ? 'small' : '', (cfg && cfg.city) === 'edm' ? 'e' : 'v');
  return rows.map(r => {
    let s = 'pass'; const why = [];
    r.issue.forEach((iss, i) => {
      const k = r.kind[i];
      if (k === 'judged') { if (s === 'pass') s = 'tight'; why.push(iss + ' (judged)'); return; }
      const m = iss.match(/([\d.]+) < ([\d.]+)/), got = m ? +m[1] : null, need = m ? +m[2] : null;
      const under = (got !== null && need) ? (need - got) / need : 1;
      const st = belowMinFails ? 'fail' : (under > 0.05 + 1e-9 ? 'fail' : 'tight');
      if (st === 'fail' || s === 'pass') s = st; why.push(iss + ' (sourced)');
    });
    if (!r.issue.length) { const ru = hc.rule ? hc.rule(r.n) : null; if (ru && ru[0] && r.w < 1.05 * ru[0] - 1e-9) { s = 'tight'; why.push(`clear width ${r.w} within 5 % of ${ru[0]}`); } }
    return { st: r.st, id: r.id, n: r.n, w: r.w, A: r.A, status: s, why: why.join('; '), basis: r.basis };
  });
}
function c3ClearSizesRow(G, cfg, hc, opt) {
  const R = c3Rooms(G, cfg, hc, opt), rank = { pass: 0, tight: 1, fail: 2 };
  const worst = R.reduce((a, r) => rank[r.status] > rank[a] ? r.status : a, 'pass');
  const fails = R.filter(r => r.status === 'fail'), tights = R.filter(r => r.status === 'tight');
  const txt = 'clear sizes inside the walls (project decision, 11 Nov): '
    + (fails.length ? `${fails.length} under a sourced minimum (fail): ${fails.map(r => `${r.n} (${r.why})`).join('; ')} · ` : '')
    + (tights.length ? `${tights.length} tight: ${tights.map(r => `${r.n} (${r.why})`).join('; ')}` : (fails.length ? '' : `all ${R.length} rooms meet their minimums`));
  return { id: 'C3', title: 'Room widths and shapes', status: worst, text: txt, src: 'project decision, 11 Nov (clear sizes); eh/audit_rooms.py RULES / HARD; DECISIONS 16 Nov (below a sourced minimum fails)', rooms: R };
}
const api = { c3ClearSizesRow, c3Rooms };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC3 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['A4'] = (function (module) {
 
(function (root) {
'use strict';
function a4WalkRow(G, cfg, hc, opt = {}) {
  const C = (cfg && cfg.code) || ((cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025');
  const W = G.WALK;
  if (!W || !W.length) return { id: 'A4', title: 'Walkways carry their load', status: 'n/a', text: 'no walkway drawn (WALK empty)', src: `${C} 3.4.3.2.(1)(a)` };
   
  let G2 = G, full = null;
  if (opt.fullLoad !== false) { const C5 = (typeof require === 'function') ? P['C5'] : root.BD.patchC5; const f = C5.fullLoadG(G); G2 = f.G; full = f.full; }
  const res = hc.walkload(G2); const groups = res[0], load = res[1], nex = res[2];
  const hard = opt.hard === true;
  let worst = 'pass'; const parts = [];
  const rank = { pass: 0, tight: 1, fail: 2 };
  for (const g of groups) {
    const names = g[1], share = g[2], full = g[3], width = g[4], need = g[5];
    const d = width - need, pct = need > 0 ? d / need : 0;
    let s;
    if (d >= 0) s = (d < 0.5 - 1e-9 || pct < 0.05 - 1e-9) ? 'tight' : 'pass';
    else s = hard ? 'fail' : ((-d <= 0.5 + 1e-9 && -pct <= 0.05 + 1e-9) ? 'tight' : 'fail');    
    if (rank[s] > rank[worst]) worst = s;
    parts.push(`${names.join(' + ')}: ${share} people (full load ${full}) → ${need.toFixed(2)} m needed, ${width.toFixed(2)} m drawn`);
  }
  return { id: 'A4', title: 'Walkways carry their load', status: worst,
    text: parts.join('; ') + `. Load per exit: the storey's public load (${load}${full != null ? ', the full count: every room at its code rate, project decision, 16 Nov 22:00' : ''}) split over its ${nex} exits, each at least half where there are two (3.4.3.2.(7)); data-centre storeys at 46 m² a person (storage, fallback for designed staff, our reading)`,
    src: `${C} 3.4.3.2.(1)(a), (7); project decision, 9 Nov` };
}
const api = { a4WalkRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchA4 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['D3'] = (function (module) {
 
(function (root) {
'use strict';
const RX_IN = /\bdock\b|shipping|receiving|loading vestibule|lift lobby/i, IN_IDS = new Set(['dock', 'ship', 'lv']);
function d3BayDoorsRow(G, cfg, opt = {}) {
  const S1 = (G.S['1'] || G.S[1] || []), D = (G.D || []).filter(d => String(d[0]) === '1');
  const bays = S1.filter(x => x.g === 'load' && /^b\d+$/.test(x.id));
  if (!bays.length) return { id: 'D3', title: 'Bay doors', status: 'n/a', text: 'no loading bay drawn', src: 'project decision, 12 Nov; 16 Nov 14:16' };
  const R = x => x.r[0], shares = (a, b) => { const p = R(a), q = R(b); const vx = Math.min(p[1], q[1]) - Math.max(p[0], q[0]), vy = Math.min(p[3], q[3]) - Math.max(p[2], q[2]);
    return (Math.abs(vx) < 1e-6 && vy > 1.0) || (Math.abs(vy) < 1e-6 && vx > 1.0); };
  const runs = [], seen = new Set();
  for (const b of bays) { if (seen.has(b.id)) continue; const run = [b]; seen.add(b.id);
    for (let i = 0; i < run.length; i++) for (const o of bays) if (!seen.has(o.id) && shares(run[i], o)) { run.push(o); seen.add(o.id); }
    runs.push(run); }
  const byId = Object.fromEntries(S1.map(x => [x.id, x])), dw = d => d[6] || G.DOOR_W || 0.9;
  const parts = []; let worst = 'pass'; const rank = { pass: 0, tight: 1, fail: 2 };
  for (const run of runs) {
    const ids = new Set(run.map(b => b.id));
    const inner = D.filter(d => (ids.has(d[1]) || ids.has(d[2]))).map(d => [d, ids.has(d[1]) ? d[2] : d[1]]).filter(([, o]) => o !== 'OUT' && byId[o] && (IN_IDS.has(o) || RX_IN.test(byId[o].n)));
    let s;
    if (!inner.length) { s = 'fail'; parts.push(`run ${[...ids].join('-')}: no inside door to the dock or shipping room`); }
    else { const w = Math.max(...inner.map(([d]) => dw(d))); s = w < 2.4 - 1e-9 ? 'fail' : w < 2.6 - 1e-9 ? 'tight' : 'pass';
      parts.push(`run ${[...ids].join('-')}: inside door to ${inner[0][1]}, ${w.toFixed(1)} m (≥ 2.4)` + (inner.length > 1 ? ` (${inner.length} inside doors)` : '')); }
    if (rank[s] > rank[worst]) worst = s;
  }
  return { id: 'D3', title: 'Bay doors', status: worst, text: parts.join('; ') + '; overhead doors: drawn as each bay\'s open end (not judged) [script]', src: 'project decision, 12 Nov; 16 Nov 14:16 (one inside door per run); 2.4 m: our reading (no source)' };
}
const api = { d3BayDoorsRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchD3 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['F2'] = (function (module) {
 
(function (root) {
'use strict';
const STEP = 0.1, EPS = 1e-6;
const SRC = 'spec E13 (face nearest south, never north of a hall storey); project decision, 16 Nov ( item 1)';
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const same = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
 
function segHitsRect(px, py, vx, vy, r) {
  let t0 = 0, t1 = 1;
  for (const [p, v, lo, hi] of [[px, vx, r[0], r[1]], [py, vy, r[2], r[3]]]) {
    if (Math.abs(v) < 1e-12) { if (p < lo - EPS || p > hi + EPS) return false; continue; }
    let a = (lo - p) / v, b = (hi - p) / v; if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1 + 1e-12) return false;
  }
  return true;
}
function sunPos(lat, dec, hr) {
  const la = rad(lat), de = rad(dec), H = rad(15 * (hr - 12));
  const sa = Math.sin(la) * Math.sin(de) + Math.cos(la) * Math.cos(de) * Math.cos(H), al = Math.asin(sa);
  const ca = (Math.sin(de) - sa * Math.sin(la)) / (Math.cos(al) * Math.cos(la)), az = deg(Math.acos(Math.max(-1, Math.min(1, ca))));
  return [hr <= 12 ? az : 360 - az, deg(al)];
}
const CASES = [['21 Dec noon', -23.44, 12], ['21 Dec 10:00', -23.44, 10], ['21 Dec 14:00', -23.44, 14], ['21 Mar noon', 0.0, 12], ['21 Jun noon', 23.44, 12]];

function oneRoomSun(G, opts) {
  opts = opts || {};
  const city = opts.city || (G._cfg && G._cfg.city), north0 = opts.north != null ? opts.north : (G._cfg && G._cfg.north != null ? G._cfg.north : (G.NORTH != null ? G.NORTH : null)), north = north0 || 0, mirror = !!(opts.mirror != null ? opts.mirror : (G._cfg && G._cfg.mirror) || G.MIRROR);
  const lat = opts.lat != null ? opts.lat : (city === 'edm' ? 53.55 : 49.28);
  const sts = Object.keys(G.S).map(Number).sort((a, b) => a - b);
  let gst = null, gx = null;
   
  const isGH = x => (x.g === 'grow' && /growing house/.test(x.n.toLowerCase())) || (/^greenhouse(_c\d+)?$/.test(x.id || '') && !/wc|headhouse/i.test(x.n));
  if (opts._room) { gst = opts._room[0]; gx = opts._room[1]; }
  else for (const s of sts) { for (const x of G.S[String(s)]) if (isGH(x)) { gst = s; gx = x; break; } if (gx) break; }
  if (!gx) return null;
  if (north0 == null) { const A = gx.r.reduce((a, r) => a + (r[1] - r[0]) * (r[3] - r[2]), 0);
    return { id: 'F2', title: 'Greenhouse sun (open sky to the south)', status: '?', text: `growing house ${A.toFixed(0)} m² on storey ${gst}: the plan carries no north (no _cfg.north, opts.north or G.NORTH), so the sun can't be placed; not checked [script]`, src: SRC, figure: null }; }
   
  const BLOCK = /^(greenhouse|headhouse|fish_hall|biome|production|greenhouse_fish|headhouse_growth|headhouse_floor|biome_growth)$/;
  const blockRoom = x => x.g === 'grow' || BLOCK.test(String(x.id || '').replace(/_c\d+$/, '')) || (x.prog && BLOCK.test(x.prog));
  const H = G.H, sumH = k => H.slice(0, k).reduce((a, b) => a + b, 0), z0 = sumH(gst - 1), OPEN = G.OPEN_RECTS || [];
  const tops = [];
  for (const s of sts) { const top = sumH(s); if (top <= z0 + 0.01) continue;
    for (const x of G.S[String(s)]) { if (x === gx || (s === gst && blockRoom(x)) || x.open) continue;
      for (const r of x.r) { if (OPEN.some(q => same(r, q))) continue; tops.push([r, top - z0]); } } }
   
  const pts = [];
  for (const r of gx.r) for (let u = r[0] + STEP / 2; u < r[1]; u += STEP) for (let v = r[2] + STEP / 2; v < r[3]; v += STEP) pts.push([u, v]);
  const garea = gx.r.reduce((a, r) => a + (r[1] - r[0]) * (r[3] - r[2]), 0);
  const res = CASES.map(([k, dec, hr]) => {
    const [az, alt] = sunPos(lat, dec, hr), a = rad(north + (mirror ? -az : az)), du = Math.sin(a), dv = Math.cos(a);    
    let n = 0;
    for (const [pu, pv] of pts) if (tops.some(([b, dh]) => { const L = dh / Math.tan(rad(alt)); return segHitsRect(pu, pv, du * L, dv * L, b); })) n++;
    return [k, alt, pts.length ? n / pts.length : 0];
  });
  const worst = Math.max(...res.map(r => r[2]));
  const status = worst < 0.05 ? 'pass' : worst < 0.5 ? 'flag' : 'fail';
  const sunDir = ((north + 180) % 360);
  const text = `growing house ${garea.toFixed(0)} m² on storey ${gst} (floor ${z0.toFixed(1)} m up); by the drawn north arrow (${north}° clockwise from up${mirror ? ', frame mirrored' : ''}) the sun at noon `
    + `stands ${sunDir.toFixed(0)}° clockwise from up on the plan; share in shadow: ` + res.map(([k, alt, f]) => `${k} (sun ${alt.toFixed(0)}° high) ${(100 * f).toFixed(0)} %`).join('; ')
    + ` (latitude ${lat.toFixed(1)}° N; room tops from the storey heights; our arithmetic, not a sun study) [script]`;
  return { id: 'F2', title: 'Greenhouse sun (open sky to the south)', status, text, src: SRC, figure: worst, shares: res.map(r => r[2]) };
}
 
const ROOMS = /^(biome|production|biome_growth)$/;
function greenhouseSunRow(G, opts) {
  opts = opts || {};
  const sts = Object.keys(G.S || {}).map(Number).sort((a, b) => a - b), rows = [];
  const first = oneRoomSun(G, opts); if (first) rows.push(['greenhouse', first]);
  for (const s of sts) for (const x of G.S[String(s)]) {
    const id = String(x.id || '').replace(/_c\d+$/, '');
    if (!(ROOMS.test(id) || (x.prog && ROOMS.test(x.prog)) || (x.g === 'grow' && /biome|production house|glasshouse/i.test(x.n || '')))) continue;
    if (/mech/i.test(id + ' ' + (x.n || ''))) continue;
    const r = oneRoomSun(G, Object.assign({}, opts, { _room: [s, x] })); if (r) rows.push([(x.n || id).split(' (')[0], r]); }
  if (!rows.length) return null;
  if (rows.length === 1) return rows[0][1];
  const RANK = ['pass', 'flag', '?', 'fail'], worst = rows.reduce((a, b) => RANK.indexOf(b[1].status) > RANK.indexOf(a[1].status) ? b : a);
  return { id: 'F2', title: 'Sun on the growing rooms (open sky to the south)', status: worst[1].status, figure: Math.max(...rows.map(r => r[1].figure || 0)),
    shares: rows[0][1].shares, rooms: rows.map(([n, r]) => ({ room: n, status: r.status, figure: r.figure })),
    text: rows.map(([n, r]) => `${n}: ${r.status}, ${r.text.replace(/^growing house /, '')}`).join(' || '), src: SRC };
}
const api = { greenhouseSunRow, oneRoomSun, sunPos, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchF2 = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['COV-edge'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'definition typ_heat_cascade edge (minW 1.8, neverDrops) and edge_manifold (5.0 m²; E17); spec E3; ASHRAE ch. 52 Table 3 stand-ins (project decision, 9 Nov)';
const KWH = { van: 36, edm: 596 };
const RANK = ['pass', 'tight', '?', 'fail'], worse = (a, b) => RANK.indexOf(a) > RANK.indexOf(b) ? a : b;
function heatedEdgeRow(G, opts) {
  opts = opts || {};
  const city = opts.city || (G._cfg && G._cfg.city) || 'van', E = G.EDGE;
  const title = 'Heated public edge (stage 4) and edge manifold';
  if (!E) return { id: 'COV-edge', title, status: 'fail', src: SRC, text: 'no heated edge drawn (the definition never drops it) [script]' };
  const w = E[1] - E[0], h = E[3] - E[2], depth = Math.min(w, h), len = Math.max(w, h), A = w * h, alongU = w >= h;
  const parts = []; let s = 'pass';
  if (depth < 1.8 - 1e-9) { s = 'fail'; parts.push(`edge ${depth.toFixed(2)} m deep, under 1.8 m`); } else parts.push(`edge ${A.toFixed(0)} m², ${depth.toFixed(1)} m deep × ${len.toFixed(1)} m`);
   
  const S1 = (G.S['1'] || []).flatMap(x => x.r), segs = [];
  for (const P of (G.STREET_EDGES || [])) for (let i = 0; i < P.length - 1; i++) segs.push([P[i], P[i + 1]]);
  let best = null;
  for (const [a, b] of segs) {
    const dx = b[0] - a[0], dy = b[1] - a[1], ang = Math.abs(Math.atan2(alongU ? dy : dx, alongU ? dx : dy)) * 180 / Math.PI;
    if (Math.min(ang, 180 - ang) > 5) continue;
    const lo = alongU ? Math.max(E[0], Math.min(a[0], b[0])) : Math.max(E[2], Math.min(a[1], b[1]));
    const hi = alongU ? Math.min(E[1], Math.max(a[0], b[0])) : Math.min(E[3], Math.max(a[1], b[1]));
    if (hi - lo < 1.0) continue;
    const mid = (lo + hi) / 2, t = alongU ? (mid - a[0]) / (dx || 1) : (mid - a[1]) / (dy || 1), line = alongU ? a[1] + t * dy : a[0] + t * dx;
    const gap = alongU ? (line < E[2] ? [lo, hi, line, E[2]] : [lo, hi, E[3], line]) : (line < E[0] ? [line, E[0], lo, hi] : [E[1], line, lo, hi]);
    const d = alongU ? (line < E[2] ? E[2] - line : line - E[3]) : (line < E[0] ? E[0] - line : line - E[1]);
    const blocked = S1.some(r => Math.min(r[1], gap[1]) - Math.max(r[0], gap[0]) > 0.05 && Math.min(r[3], gap[3]) - Math.max(r[2], gap[2]) > 0.05);
    if (!blocked && (best === null || d < best)) best = d;
  }
  if (best === null) { s = worse(s, 'fail'); parts.push('not along a street lot line (no parallel street line with an open gap)'); }
  else parts.push(`along the street, ${Math.max(0, best).toFixed(1)} m from the street lot line with nothing built between`);
  const names = Object.keys(G.S).flatMap(k => G.S[k]).map(x => x.n.toLowerCase());
  if (names.some(n => /edge manifold/.test(n))) parts.push('edge manifold room drawn');
  else if (names.some(n => /pool and spa plant|spa plant|pool plant/.test(n))) parts.push('edge manifold folded into the pool / spa plant (as the hand boards: "edge manifold off the pool plant", spec rule 15 table)');
  else { s = worse(s, 'fail'); parts.push('NO EDGE MANIFOLD and no pool / spa plant to hold it (5.0 m², E17)'); }
  const mwh = A * KWH[city] / 1000;
  parts.push(`heat about ${mwh.toFixed(0)} MWh/yr (${KWH[city]} kWh/m²·yr, ${city === 'edm' ? 'Minneapolis' : 'Seattle'} stand-in), added to the programs' heat; generators: see "Heated public edge on the street, off the plant" (E3)`);
  return { id: 'COV-edge', title, status: s, src: SRC, text: parts.join('; ') + ' [script]', figure: mwh, area: A };
}
const api = { heatedEdgeRow, SRC, KWH };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchCOVedge = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['COV-cventry'] = (function (module) {
 
(function (root) {
'use strict';
const SRC_E = 'definition typ_conservatory entry (minM2 20.0, minW 2.4; drawing choice as the hub lobby, spec 15c); project decision, 16 Nov 07:06 (no load of its own)';
const SRC_W = 'NBC(AE) 2023 / VBBL 2025 Table 3.7.2.2.-A, 3.7.2.2.(1), 3.8.3.13; designed load 2.8 m² (3.1.17.1.(1)(c), project decision, 14 Nov); class rooms 1.85 (project decision, 16 Nov 08:58); eh/oversize.py wcA';
const area = x => x.r.reduce((a, r) => a + (r[1] - r[0]) * (r[3] - r[2]), 0);
const width = x => Math.max(...x.r.map(r => Math.min(r[1] - r[0], r[3] - r[2])));
function wcA(n) {    
  const rows = [[25, 1, 1], [50, 1, 2], [75, 2, 3], [100, 2, 4], [125, 3, 5], [150, 3, 6], [175, 4, 7], [200, 4, 8], [250, 5, 9], [300, 5, 10], [350, 6, 11], [400, 6, 12]];
  for (const [top, m, f] of rows) if (n <= top) return [m, f];
  return [7 + Math.ceil((n - 400) / 200), 13 + Math.ceil((n - 400) / 100)];
}
function wcKind(n) { const l = n.toLowerCase(); if (/universal (wc|washroom)/.test(l)) return 'univ'; if (l.includes('women')) return 'w'; if (/\bmen\b/.test(l)) return 'm'; return 'u'; }
function wcCount(n) { const l = n.toLowerCase(); let m = l.match(/\((\d+)(?: \+ urinal)?\)/); if (m) return Number(m[1]) + (l.includes('urinal') ? 1 : 0);
  m = l.match(/(\d+) rooms/); if (m) return Number(m[1]); m = l.match(/(\d+) wcs?\b/); if (m) return Number(m[1]); return 1; }
function conservatoryEntryRows(G) {
  const all = Object.keys(G.S).flatMap(k => G.S[k].map(x => Object.assign({ st: Number(k) }, x)));
  if (!all.some(x => /biome/.test(x.n.toLowerCase()))) return [];
  const rows = [];
   
  const e = all.find(x => /entry and reception|^entry\b/.test(x.n.toLowerCase()));
  if (!e) rows.push({ id: 'COV-cventry-entry', title: 'Conservatory entry and reception', status: 'fail', src: SRC_E, text: 'no entry room drawn [script]' });
  else {
    const A = area(e), w = width(e), out = (G.D || []).some(d => d[0] === e.st && ((d[1] === e.id && d[2] === 'OUT') || (d[2] === e.id && d[1] === 'OUT')));
    const s = (A < 20.0 - 1e-9 || w < 2.4 - 1e-9 || !out) ? 'fail' : 'pass';
    rows.push({ id: 'COV-cventry-entry', title: 'Conservatory entry and reception', status: s, src: SRC_E,
      text: `entry ${A.toFixed(1)} m² (≥ 20.0) and ${w.toFixed(1)} m wide (≥ 2.4); ${out ? 'its door opens straight outside' : 'NO DOOR STRAIGHT OUTSIDE'}; no occupant load of its own (its people are counted in the rooms they go to); not read for oversize (lobbies are not, as the hub's rule) [script]` });
  }
   
  let L = 0; const parts = [];
  for (const x of all) { const n = x.n.toLowerCase(), A = area(x);
    if (/biome|propagation/.test(n)) { const p = Math.floor(A / 2.8); L += p; parts.push(`${x.n.split(/[(:]/)[0].trim().toLowerCase()} ${A.toFixed(0)} ÷ 2.8 = ${p}`); }
    else if (/class room|classroom|teaching lab/.test(n)) { const p = Math.floor(A / 1.85); L += p; parts.push(`${x.n.split(/[(:]/)[0].trim().toLowerCase()} ${A.toFixed(0)} ÷ 1.85 = ${p}`); } }
  const [M, F] = L > 0 ? wcA(Math.ceil(L / 2)) : [0, 0];
  const wcs = all.filter(x => /\bwcs?\b|washroom|toilet/i.test(x.n) && !/staff|dc /i.test(x.n));
  let dW = 0, dM = 0, dU = 0; const univ = [];
  for (const x of wcs) { const k = wcKind(x.n); if (k === 'w') dW += wcCount(x.n); else if (k === 'm') dM += wcCount(x.n); else if (k === 'univ') { dU += 1; univ.push(x); } else dU += wcCount(x.n); }
  const short = Math.max(0, Math.max(0, F - dW) + Math.max(0, M - dM) - dU);
  const badU = univ.filter(x => area(x) < 5.4 - 1e-9 || width(x) < 1.7 - 1e-9);
  const s = (short || badU.length || !univ.length) ? 'fail' : 'pass';
  rows.push({ id: 'COV-cventry-wc', title: 'Visitor washrooms (count)', status: s, src: SRC_W,
    text: `public load ${parts.join(' + ')} → ${L}; split equally: ${Math.ceil(L / 2)} a sex → ${M} M + ${F} F (Table 3.7.2.2.-A); drawn ${dW} F + ${dM} M + ${dU} either (universal or unisex)`
      + (short ? `; ${short} WC SHORT` : '; enough')
      + (!univ.length ? '; NO UNIVERSAL WASHROOM' : badU.length ? `; universal washroom under 5.4 m² or 1.7 m (3.8.3.13): ${badU.map(x => area(x).toFixed(1) + ' m²').join(', ')}` : '; universal washroom ≥ 5.4 m², ≥ 1.7 m (3.8.3.13)') + ' [script]' });
  return rows;
}
const api = { conservatoryEntryRows, wcA, SRC_E, SRC_W };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchCOVcventry = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['SPA-hottub'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'B.C. Reg. 296/2010 (Pool Regulation, consolidated to 10 Nov 2026) s. 10(2)(b), s. 16; typ_heat_cascade spa 36-40 °C; project decision, 16 Nov 20:32 ()';
function spaHotTubRow(G, opts) {
  const city = (opts && opts.city) || (G._cfg && G._cfg.city);
  if (city !== 'van') return null;
  const spa = Object.keys(G.S).flatMap(k => G.S[k]).find(x => /spa hall|hot pool/.test(x.n.toLowerCase()));
  if (!spa) return null;
  return { id: 'SPA-hottub', title: 'Spa hot pool: a hot tub under the BC Pool Regulation', status: 'flag', src: SRC,
    text: 'the spa runs at 36-40 °C; above 37 °C its hot pool is a hot tub (s. 10(2)(b)): water ≤ 40 °C, a clock and safety instructions in view of the users (s. 16); the main pool stays ≤ 37 °C. Row text only (project decision, 16 Nov) [script]' };
}
const api = { spaHotTubRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchSpaHotTub = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['C4'] = (function (module) {
 
(function (root) {
'use strict';
const C5 = (typeof require === 'function') ? P['C5'] : root.BD.patchC5;
const WC_A = 2.8, BASIN_A = 1.1, STALL_X = 1.7, UNIV_A = 5.4, UNISEX_A = 3.9, OVER = 1.5, DC_CORE = 122.0, DC_BUDGET = 0.5;
const WCNAME = /\bwcs?\b|washroom|toilet/i, DC_EQUIP = /ups room|battery|mv switchgear|transformer alcove|generator room/i, DC_OWN = /loading space|data hall|heat-recovery/i;
const GROWS = /grown|grows|spare floor|spare-floor|lobby|^entry|data hall|refuge|rest area \(16|day shelter rest area|warming shelter rest area|multipurpose|pantry|drop-in|community room|program room|propagation|display biome|deck grown|deck strip|gym dry change/i;
const HUB = [[/refuge main room|refuge with|refuge and warming/i, 175], [/warming shelter rest area|day shelter rest area/i, 56], [/first aid/i, 9.3], [/^staff office( \(shared\))?$/i, 8],
 [/universal shower/i, 2.7], [/procedure/i, 15.5], [/exam room/i, 12], [/consult/i, 12], [/medication/i, 10], [/clean supply/i, 11], [/soiled/i, 13.5], [/^housekeeping/i, 7],
 [/heat-recovery room/i, 30], [/loading space/i, 'load']];
function kind(n) { const l = n.toLowerCase(); if (/universal (wc|washroom)|clinic universal/.test(l)) return 'univ'; if (l.includes('women')) return 'w'; if (/\bmen\b/.test(l)) return 'm'; return 'u'; }
 
function countOf(x) { return x.fx && x.fx.wc != null ? (+x.fx.wc || 0) + (+x.fx.urinal || 0) : count(x.n); }
function count(n) { const l = n.toLowerCase(); let m = /\((\d+)(?: \+ urinal)?\)/.exec(l); if (m) return +m[1] + (l.includes('urinal') ? 1 : 0); m = /(\d+) rooms/.exec(l); if (m) return +m[1]; m = /(\d+) wcs?\b/.exec(l); if (m) return +m[1]; return 1; }
function wcA(n) { const T = [[25, 1, 1], [50, 1, 2], [75, 2, 3], [100, 2, 4], [125, 3, 5], [150, 3, 6], [175, 4, 7], [200, 4, 8], [250, 5, 9], [300, 5, 10], [350, 6, 11], [400, 6, 12]];
  for (const [t, m, f] of T) if (n <= t) return [m, f]; return [7 + Math.ceil((n - 400) / 200), 13 + Math.ceil((n - 400) / 100)]; }
const wcB = n => n <= 25 ? 1 : n <= 50 ? 2 : 3 + Math.ceil((n - 50) / 50);
const fixA = n => n ? n * WC_A + Math.ceil(n / 2) * BASIN_A + (n > 2 ? STALL_X : 0) : 0;
const r2 = x => Math.round(x * 100) / 100, r1 = x => Math.round(x * 10) / 10;
 
const ROOMFILES = { SL: 'rooms_shelter.json', FH: 'rooms_food_hub.json', CP: 'rooms_pool.json', WB: 'rooms_warm_bath.json', HC: 'rooms_heat_cascade.json', AQ: 'rooms_aquaponics.json', CV: 'rooms_conservatory.json' };
function roomList(cfg) {
  if (cfg.roomList) return cfg.roomList;
  const f = cfg.typology && ROOMFILES[cfg.typology]; if (!f || typeof require !== 'function') return null;
  try { return JSON.parse(require('fs').readFileSync(require('path').join(__dirname, f), 'utf8')); } catch (e) { return null; }
}
function c4Check(G, cfg = {}) {
  const city = cfg.city || 'van', TL = roomList(cfg), L = C5.c5Loads(G, {}), R = L._R, isClin = L._isClin, pubL = L.public, clinL = L.clinic, pubA = L.publicArea, clinA = L.clinicArea;
  const wash = [], lines = []; let fail = false, back = 0;
  const W = R.filter(r => WCNAME.test(r.n) && !r._f.staff && !r._f.bather && !r._f.dc);
  for (const [g, rs] of [['public', W.filter(r => !isClin(r))], ['clinic', W.filter(r => isClin(r))]]) {
    if (!rs.length) continue;
    const Ld = g === 'public' ? pubL : clinL, n = Math.ceil(Ld / 2); let M, F;
    if (g === 'public') [M, F] = Ld > 0 ? wcA(n) : [0, 0]; else M = F = Ld > 0 ? wcB(n) : 0;
    const aS = g === 'public' ? pubA : clinA, by = { w: [], m: [], u: [], univ: [] }; rs.forEach(r => by[kind(r.n)].push(r));
    const sum = (a, f) => a.reduce((s, r) => s + f(r), 0), dW = sum(by.w, r => countOf(r)), dM = sum(by.m, r => countOf(r)), dU = sum(by.u, r => countOf(r)) + by.univ.length;
    let need = M + F, rule = '';
    if (Ld <= 25) { need = 1; rule = 'load ≤ 25: one WC (3.7.2.2.(2))'; } else if (Ld <= 60 && aS <= 200) { need = 2; rule = 'load ≤ 60 and ≤ 200 m²: two unisex rooms, one universal (3.7.2.2.(15))'; }
    const short = need < M + F ? Math.max(0, need - (dW + dM + dU)) : Math.max(0, Math.max(0, F - dW) + Math.max(0, M - dM) - dU);
    const req = [], A = a => sum(a, r => r.a);
    if (need < M + F) { req.push(['universal', by.univ.length || 1, UNIV_A * Math.max(1, by.univ.length), A(by.univ)]); const o = by.w.concat(by.m, by.u);
      req.push(['unisex / gendered', sum(o, r => countOf(r)), Math.max(0, need - Math.max(1, by.univ.length)) * UNISEX_A, A(o)]); }
    else { const cW = Math.min(F, dW), cM = Math.min(M, dM), rest = (F - cW) + (M - cM), nU = sum(by.u, r => countOf(r));
      if (by.w.length) req.push(['women', dW, fixA(cW), A(by.w)]); if (by.m.length) req.push(['men', dM, fixA(cM), A(by.m)]);
      if (by.u.length) req.push(['unisex', nU, Math.min(nU, rest) * UNISEX_A, A(by.u)]); req.push(['universal', by.univ.length, UNIV_A * Math.max(1, by.univ.length), A(by.univ)]); }
    for (let [lab, dN, rA, dA] of req) { const beyond = !!(dA && !rA && dN); if (beyond) rA = UNISEX_A * dN;
      const ratio = rA ? dA / rA : null, over = !!(ratio && r2(ratio) > OVER), b = over ? Math.max(0, dA - rA) : 0;
      wash.push({ group: g, part: lab + (beyond ? ' (beyond the count)' : ''), drawn: r1(dA), req: r1(rA), ratio: ratio ? r2(ratio) : null, over, back: r1(b) }); back += b; }
    wash.push({ group: g, part: 'count', load: Ld, need: rule ? need : [M, F], drawn: [dW, dM, dU], short, rule }); if (short) fail = true; }
  const agg = {}, hallA = R.filter(r => r._f.dc && /data hall/i.test(r.n) || r.g === 'hall').reduce((s, r) => s + r.a, 0);
  for (const r of R) { const n = r.n, f = r._f;
    if (WCNAME.test(n) && !f.staff && !f.dc) continue; if (f.unassigned) continue;
    const hall = r.g != null ? r.g === 'hall' : /data hall/i.test(n), bay = r.g != null ? r.g === 'load' : /loading space/i.test(n);
    if (f.dc && !(hall || bay || DC_OWN.test(n))) {
      const k = DC_EQUIP.test(n) ? 'equip:' + n : 'dcbudget', a = agg[k] = agg[k] || { names: [], drawn: 0, ref: k === 'dcbudget' && hallA ? r1(DC_CORE + DC_BUDGET * hallA) : null, grows: false, budget: k === 'dcbudget' };
      a.names.push(n); a.drawn += r.a; continue; }
    let key = null, ref = null, tg = false;
    if (TL) for (const e of TL.rooms) if (new RegExp(e.match, 'i').test(n)) { key = TL.code + ':' + e.id; ref = (e.refByCity && e.refByCity[city] != null) ? e.refByCity[city] : e.ref; tg = !!e.grows; break; }        
    if (key === null) { key = 'none:' + n; for (const [rx, v] of HUB) if (rx.test(n)) { key = 'hub:' + n; ref = v === 'load' ? (city === 'van' ? 34.7 : 29.7) : v; break; } }
    const a = agg[key] = agg[key] || { names: [], drawn: 0, ref, grows: false, budget: false }; a.names.push(n); a.drawn += r.a; a.grows = a.grows || tg || GROWS.test(n); }
  for (const a of Object.values(agg)) { const ratio = a.ref ? a.drawn / a.ref : null, over = !!(ratio && r2(ratio) > (a.budget ? 1.0 : OVER) && !a.grows), b = over ? a.drawn - a.ref : 0;
    lines.push({ room: a.budget ? `Data-centre support rooms, one budget (${a.names.length} rooms)` : [...new Set(a.names)].join(' + '), n: a.names.length, drawn: r1(a.drawn), ref: a.ref, ratio: ratio ? r2(ratio) : null, over, back: r1(b), budget: a.budget }); back += b; }
  return { wash, lines, fail, back: r1(back), loads: L };
}
function c4Row(G, cfg) {
  const o = c4Check(G, cfg || {}), C = (cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025';
  const ov = o.lines.filter(l => l.over).concat(o.wash.filter(w => w.over).map(w => ({ room: `${w.group} washrooms, ${w.part}`, drawn: w.drawn, ref: w.req, ratio: w.ratio })));
  const cnt = o.wash.filter(w => w.part === 'count').map(w => `${w.group} load ${w.load} → ` + (Array.isArray(w.need) ? `${w.need[0]} M + ${w.need[1]} F` : `${w.need} WC (unisex)`) + `; drawn ${w.drawn[0]} F + ${w.drawn[1]} M + ${w.drawn[2]} either` + (w.short ? `: SHORT ${w.short}` : ''));
  const status = o.fail ? 'fail' : o.back > 0 ? 'flag' : 'pass';
  return { id: 'C4', title: 'Room sizes against need (oversize)', status, src: `${C} Tables 3.1.17.1, 3.7.2.2.-A/-B, 3.7.2.2.(2), (15); hub spec Part 1; project decision, 14 Nov, 15 Nov 19:57 and 20:24 (data-centre budget 122 m² + 50 % of the hall)`,
    text: cnt.join(' · ') + `. Over 1.5 × need or reference (data-centre support budget: over 122 m² + 50 % of the hall): ${ov.length} item(s)` + (ov.length ? ': ' + ov.map(x => `${x.room} ${x.drawn} / ${x.ref} m² (${x.ratio} ×)`).join('; ') : '') + `; floor back to program ${Math.round(o.back)} m²`, check: o };
}
const api = { countOf, c4Check, c4Row, wcA, wcB, fixA, roomList, ROOMFILES };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC4 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['C4C5'] = (function (module) {
 
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else (root.BD = root.BD || {}).C4C5 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const E = 1e-6, SH = 1.2, WCA = 1.5, ALLOW = 10;
  const TA = [[25, 1, 1], [50, 1, 2], [75, 2, 3], [100, 2, 4], [125, 3, 5], [150, 3, 6], [175, 4, 7], [200, 4, 8], [250, 5, 9], [300, 5, 10], [350, 6, 11], [400, 6, 12]];
  const wcA = n => { for (const r of TA) if (n <= r[0]) return [r[1], r[2]]; return [7 + Math.ceil((n - 400) / 200), 13 + Math.ceil((n - 400) / 100)]; };
  const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
  const area = x => (x.r || []).reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]), 0);
   
   
  function bathersRaw(opt) {
    const A = opt.waterM2 || 0, D = opt.deepM2 || 0, W = Math.min(opt.whirlM2 || 0, A), R = A - W;
    return W / 1.0 + (opt.city === 'edm' ? R / 1.5 : D / 2.5 + Math.max(0, R - D) / 0.93);
  }
  function bathers(opt) { return Math.floor(bathersRaw(opt) + E); }
  function load(opt) {
     
    const b = bathers(opt), g = opt.gymUsers != null ? opt.gymUsers : (opt.gymM2 ? Math.floor(opt.gymM2 / 4.6 + E) : 0);
    return { bathers: b, gym: g, nSex: Math.ceil((b + g) / 2) };
  }
  function count(room, what) {
    if (room.fx && room.fx[what] != null) return room.fx[what];
    const k = new RegExp('(\\d+) ' + (what === 'wc' ? 'WC' : 'shower')).exec(room.n || ''); return k ? +k[1] : 0;
  }
  function rooms(plan) {
    const S1 = (plan.S && (plan.S['1'] || plan.S[1])) || [];
     
    const find = (k, re) => S1.filter(x => (re && re.test(x.prog || x.id)) || (!/^program_room/.test(x.id || '') && (x.n || '').toLowerCase().indexOf(k) >= 0));
    return { S1, women: find('change room, women', /^change_w$/), men: find('change room, men', /^change_m$/), plant: find('pool plant', /^(pool_plant|bath_plant|spa_plant|pplant)$/),
      has: k => S1.some(x => (x.n || '').toLowerCase().indexOf(k) >= 0) };
  }
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  function rows(plan, opt) {
    const edm = opt.city === 'edm', L = load(opt), R = rooms(plan), out = [];
    const [M, F] = wcA(L.nSex);
    const sh = edm ? Math.max(3, Math.ceil(L.bathers / 50 - E)) : 2 + Math.max(0, Math.ceil((L.nSex - 100) / 50 - E));
    const rate = edm ? 0.5 : 0.32;
    const dM = sum(R.men, r => count(r, 'wc')), dF = sum(R.women, r => count(r, 'wc'));
    const sM = sum(R.men, r => count(r, 'shower')), sF = sum(R.women, r => count(r, 'shower'));
    
    const wcOk = dM >= M && dF >= F;
    out.push({ id: 'C4.wc', title: 'Washrooms, bathers', status: wcOk ? 'pass' : 'fail',
      src: (edm ? 'NBC(AE)' : 'VBBL') + ' Table 3.7.2.2.-A on the bathing load + gym users; NBC(AE) 7.2.4.8',
      text: `bathing load ${L.bathers} (${edm ? 'NBC(AE) 7.2.4.1: 1 per 1.5 m², whirlpools 1.0 m²' : 'BC Guidelines 8.7: D ÷ 2.5 + S ÷ 0.93'}) + ${L.gym} gym users → ${L.nSex} a sex → ${M} M + ${F} F; drawn ${dM} M, ${dF} F`,
      detail: { bathers: L.bathers, nSex: L.nSex, M, F, dM, dF } });
    
    
    
    if (opt.fullLoad != null) {
      const nF = Math.ceil(opt.fullLoad / 2), [MF, FF] = wcA(nF), S1w = R.S1;
      const cnt = x => { const m = /\((\d+)/.exec(x.n) || /(\d+) WC/i.exec(x.n); return (m ? +m[1] : 1) + (/urinal/i.test(x.n) ? 1 : 0); };
      const wcs = S1w.filter(x => /\bwcs?\b|washroom/i.test(x.n) && !/staff|universal/i.test(x.n) || /change room, (women|men)/i.test(x.n));
      const fW = wcs.filter(x => /women/i.test(x.n)).reduce((a, x) => a + cnt(x), 0), fM = wcs.filter(x => /\bmen\b/i.test(x.n)).reduce((a, x) => a + cnt(x), 0);
      const uni = S1w.filter(x => /universal (wc|washroom)/i.test(x.n)).length, short = Math.max(0, FF - fW) + Math.max(0, MF - fM) - uni;
      out.push({ id: 'C4.wcfull', title: 'Washrooms at the full occupant load', status: short > 0 ? 'fail' : 'pass', detail: { full: opt.fullLoad, nSex: nF, M: MF, F: FF, drawnM: fM, drawnF: fW, universal: uni },
        src: 'project decision, 16 Nov 22:00 (one load); ' + (edm ? 'NBC(AE)' : 'VBBL') + ' Table 3.7.2.2.-A; NBC(AE) 7.2.4.8, 7.2.4.10',
        text: `full load ${opt.fullLoad} → ${nF} a sex → ${MF} M + ${FF} F; drawn ${fM} M + ${fW} F (change rooms + non-bather WCs) + ${uni} universal${short > 0 ? ': SHORT ' + short : ''}` });
    }
    
    const dS = Math.min(sM, sF);
    out.push({ id: 'C4.showers', title: 'Showers', status: dS >= sh ? 'pass' : 'fail',
      src: 'NBC(AE) 7.2.4.7.(2): 1 per 50 bathers, ≥ 3 a room; BC Guidelines 5.1: 2 heads per first 100 users a sex + 1 per 50',
      text: `${sh} needed a change room; drawn ${dS} (least of the two rooms; the universal shower is extra)`, detail: { need: sh, drawn: dS } });
    
    const need = rate * L.nSex;
    const per = (rs, wc) => { const a = sum(rs, area), net = a - sum(rs, r => count(r, 'shower')) * SH - sum(rs, r => count(r, 'wc')) * WCA;
      const comp = need + sh * SH + wc * WCA + ALLOW; return { a, net, comp }; };
    const w = per(R.women, F), m = per(R.men, M);
    const dressFail = w.net < need - E || m.net < need - E;
    const compTight = w.a < w.comp - E || m.a < m.comp - E;
    const sd = dressFail ? 'fail' : (compTight ? 'tight' : 'pass');
    out.push({ id: 'C5.dress', title: 'Change rooms: dressing area and composition', status: sd,
      src: edm ? 'NBC(AE) 7.2.4.3.(1): 0.5 m² a bather a sex, exclusive of washroom and shower areas (sourced); composition: spec Part 1, our arithmetic'
               : 'BC Guidelines 0.32 m² a person (as given); composition: spec Part 1, our arithmetic',
      text: `dressing area (room less showers ${SH} and WCs ${WCA} m² each) women ${f1(w.net)} ${w.net >= need - E ? '≥' : '< (short)'} ${f1(need)}, men ${f1(m.net)} ${m.net >= need - E ? '≥' : '< (short)'} ${f1(need)} (${rate} × ${L.nSex}); whole room against dressing + showers + WCs + ${ALLOW} m² allowance ?: women ${f1(w.a)} vs ${f1(w.comp)}, men ${f1(m.a)} vs ${f1(m.comp)}`,
      detail: { need, womenNet: w.net, menNet: m.net, womenArea: w.a, menArea: m.a, womenComp: w.comp, menComp: m.comp } });
    
    const ap = sum(R.plant, area), np = opt.waterM2 / 3;
    out.push({ id: 'C5.plant', title: 'Pool plant third of the water area', status: ap >= np - E ? 'pass' : 'tight',
      src: 'Eastglen p. 23 (a precedent, not a code figure); NBC(AE) 7.2.3.38 is the plant room row (spec 16t)',
      text: `plant ${f1(ap)} ${ap >= np - E ? '≥' : '< (below the precedent)'} ${f1(np)} m²`, detail: { plant: ap, need: np } });
    
    const un = R.has('universal dressing') && R.has('universal washroom');
    out.push({ id: 'C4.univ', title: 'Universal dressing and shower room; universal washroom', status: un ? 'pass' : 'fail',
      src: 'NBC 3.8.2.8.(1), (13); 3.8.3.13, 3.8.3.17', text: 'one universal dressing and shower room with a door to the deck; one universal washroom at the non-bather WCs' });
    return out;
  }
  const toHubRow = r => [r.status, r.title, r.src, r.text];
  return { rows, load, bathers, bathersRaw, wcA, toHubRow, version: 'C4C5 patch 18m' };
});

return module.exports; })({ exports: {} });
 
P['PG'] = (function (module) {
 
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else (root.BD = root.BD || {}).PG = f(); })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const E = 1e-6;
  const area = x => (x.r || []).reduce((s, q) => s + (q[1] - q[0]) * (q[3] - q[2]), 0);
  function sharedWall(A, B) {
    let t = 0; const ov = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
    for (const a of A.r || []) for (const b of B.r || []) {
      if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(a[0] - b[1]) < 1e-6) t += ov(a[2], a[3], b[2], b[3]);
      if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(a[2] - b[3]) < 1e-6) t += ov(a[0], a[1], b[0], b[1]);
    }
    return t;
  }
  const nm = x => ((x && x.n) || '').toLowerCase();
  const isPoolHall = x => !!x && (x.waterM2 != null || /^(pool_hall|spa_hall|therapy_hall|learner|pool|spa|thp)$/.test(x.id) || /^(pool|spa|therapy|learner) (hall|pool)/.test(nm(x)));
  const isChange = x => !!x && (/^(change_(w|m|u)|universal_change)$/.test(x.id) || /^change room|^universal (dressing|change)/.test(nm(x)));
  const isChem = x => !!x && (/^(chlorine|acid|hypochlorite)$/.test(x.id) || /hypochlorite store|acid store|chlorine room/.test(nm(x)));
  const isHeat = x => !!x && (/^(prog_mech|programs_mech|hrr|boiler|pmec|gen\d*)$/.test(x.id) || /programs mechanical|heat-recovery|heat recovery|boiler|heat pump|water heater|generator/.test(nm(x)));
  const isNonBather = x => !!x && (/^(wc_lobby|lobby_wc|greenhouse_wc)$/.test(x.id) || /non-bather/.test(nm(x)));
  const fx = (x, k) => (x && x.fx && x.fx[k] != null) ? +x.fx[k] : null;
  function rows(plan, opt) {
    opt = opt || {}; const city = opt.city === 'edm' ? 'edm' : 'van', C = city === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025';
    const S = plan.S || {}, S1 = S['1'] || S[1] || [], D = (plan.D || []).filter(d => d[0] === 1), by = {}; S1.forEach(x => by[x.id] = x);
    const halls = Object.keys(S).flatMap(k => (S[k] || []).filter(isPoolHall).map(x => Object.assign({ st: +k }, x)));
    if (!halls.length) return [];
    const nb = id => D.filter(d => d[1] === id || d[2] === id).map(d => d[1] === id ? d[2] : d[1]);
    const out = [];
     
    { const chem = S1.filter(isChem), heat = S1.filter(isHeat), hits = [];
      chem.forEach(c => heat.forEach(h => { const w = sharedWall(c, h); if (w > 0.05) hits.push(`${c.id} shares ${w.toFixed(1)} m with ${h.id}`); }));
      out.push({ id: 'PG-chem-heat', title: 'Chemical stores not beside heating equipment', status: !chem.length ? '?' : hits.length ? 'fail' : 'pass',
        text: !chem.length ? 'no chemical store drawn' : hits.length ? hits.join('; ') : `${chem.map(c => c.id).join(', ')}: no shared wall with ${heat.length ? heat.map(h => h.id).join(', ') : 'any heating room'}`,
        src: 'NBC(AE) 7.2.3.39.(2) (Edmonton, law); Vancouver: tool extension. Heating rooms read by id / name (programs mechanical, heat recovery, boiler, heat pump, generator); the pool plant is not counted (the acid store may open off it)' }); }
     
    { const ch = Object.keys(S).flatMap(k => (S[k] || []).filter(isChange).map(x => Object.assign({ st: +k }, x))), bad = [];
      ch.forEach(c => { const h = halls.filter(x => x.st === c.st && (c.st !== 1 || nb(c.id).includes(x.id))); if (!h.length) bad.push(`${c.id} (storey ${c.st}) has no door onto a pool hall on its storey`); });
      out.push({ id: 'PG-deck-level', title: 'Dressing rooms open straight onto the deck, same level', status: !ch.length ? '?' : bad.length ? 'fail' : 'pass',
        text: !ch.length ? 'no change room drawn' : bad.length ? bad.join('; ') : `${ch.map(c => c.id).join(', ')}: door onto the hall on the same storey (floor levels not modelled: same storey read as no step) (likely)`,
        src: 'NBC(AE) 7.2.4.3.(2)-(3); BC Guidelines 2025 5.1; spec rule 5 (bather path)' }); }
     
    { const rr = S1.filter(x => (fx(x, 'wc') || 0) + (fx(x, 'urinal') || 0) > 0), t = [], st = [];
      rr.forEach(x => { const n = (fx(x, 'wc') || 0) + (fx(x, 'urinal') || 0), need = Math.ceil(n / 2 - E), lav = fx(x, 'lav'); t.push(`${x.id} ${n} fixtures → ${need} lavatories, ${lav == null ? 'none written' : lav + ' written'}`); st.push(lav == null ? '?' : lav >= need ? 'pass' : 'fail'); });
      out.push({ id: 'PG-lav', title: 'Lavatories with the WCs', status: !rr.length ? '?' : st.includes('fail') ? 'fail' : st.includes('?') ? '?' : 'pass',
        text: rr.length ? t.join('; ') : 'no room carries fixture counts (fx)', src: `${C} 3.7.2.3.(1); NBC(AE) 7.2.4.8; counts as data (fx.lav), written by the fixtures draft` }); }
     
    { const nbr = S1.filter(isNonBather), bad = [];
      nbr.forEach(x => { if (x.wet) bad.push(`${x.id} is marked wet`); const o = nb(x.id).filter(id => by[id] && (isPoolHall(by[id]) || isChange(by[id]))); if (o.length) bad.push(`${x.id} opens into ${o.join(', ')}`); if (!nb(x.id).some(id => by[id] && (by[id].g === 'circ' || /lobby|corridor/.test(nm(by[id]))))) bad.push(`${x.id} has no door to the lobby or a corridor`); });
      out.push({ id: 'PG-nonbather-wc', title: 'Non-bather washrooms outside the wet areas', status: !nbr.length ? 'fail' : bad.length ? 'fail' : 'pass',
        text: !nbr.length ? 'no non-bather washroom drawn' : bad.length ? bad.join('; ') : `${nbr.map(x => x.id).join(', ')}: dry, off the lobby or corridor, no door into the enclosure`,
        src: 'NBC(AE) 7.2.4.10 (Edmonton); Vancouver: BC Guidelines 5.2 sends fixtures to the building code (our extension of the location rule)' }); }
     
    { const ch = S1.filter(x => /^change_(w|m)$/.test(x.id) || /change room, (women|men)/.test(nm(x))), uni = S1.some(x => /^(change_u|universal_change)$/.test(x.id) || /^universal (dressing|change)/.test(nm(x)));
      let status, text;
      if (city === 'edm') { const any = uni || ch.some(x => (fx(x, 'showerBF') || 0) > 0); status = any ? 'pass' : 'fail'; text = any ? (uni ? 'universal dressing and shower room drawn (one accessible shower in the building)' : 'accessible shower in a change room') : 'no accessible shower'; }
      else { const miss = ch.filter(x => !((fx(x, 'showerBF') || 0) > 0)); status = !ch.length ? '?' : miss.length ? (miss.some(x => fx(x, 'showerBF') === 0) ? 'fail' : '?') : 'pass';
        text = !ch.length ? 'no change rooms drawn' : miss.length ? `${miss.map(x => x.id).join(', ')}: accessible shower not written (fx.showerBF)` : `each change room carries an accessible shower (${ch.map(x => x.id).join(', ')})`; }
      out.push({ id: 'PG-shower-bf', title: 'Accessible shower', status, text, src: city === 'edm' ? 'NBC(AE) 3.8.2.8.(12)' : 'VBBL 2025 3.8.2.8.(12) (one in each group of showers; checks/VBBL_vs_AE_pool_2026-11-17.md) [TODO: VBBL page]' }); }
     
    { const L = opt.load, has = S1.some(x => x.id === 'changing_places' || /changing places|change space/.test(nm(x)) || (fx(x, 'changeSpace') || 0) > 0);
      out.push({ id: 'PG-change-space', title: 'Accessible change space (assembly load over 500)', status: L == null ? '?' : L <= 500 ? 'n/a' : has ? 'pass' : 'fail',
        text: L == null ? 'full occupant load not given' : L <= 500 ? `load ${L} ≤ 500: not required${has ? ' (one drawn anyway)' : ''}` : has ? `load ${L} > 500: change space drawn` : `load ${L} > 500: no universal washroom with an accessible change space`,
        src: `${C} 3.8.2.8.(15); load from C5's full count` }); }
     
    { const ns = opt.nSex, rate = city === 'edm' ? 0.5 : 0.32, ch = S1.filter(x => /^change_(w|m)$/.test(x.id)), t = [], st = [];
      ch.forEach(x => { const wc = fx(x, 'wc'), sh = fx(x, 'shower'); if (wc == null || sh == null || ns == null) { t.push(`${x.id}: counts or load missing`); st.push('?'); return; }
        const need = rate * ns + sh * 1.2 + wc * 1.5 + 10 + (wc > 2 ? 1.1 : 0), a = area(x); t.push(`${x.id} ${a.toFixed(1)} m² vs ${need.toFixed(1)} (incl. ${wc > 2 ? '1.1 m² accessible-stall allowance' : 'no allowance, 2 WCs or fewer'})`); st.push(a >= need - E ? 'pass' : 'tight'); });
      out.push({ id: 'PG-stall', title: 'Accessible stall room in change rooms with more than 2 WCs', status: !ch.length ? '?' : st.includes('tight') ? 'tight' : st.includes('?') ? '?' : 'pass', text: t.join('; ') || 'no change rooms',
        src: `${C} 3.8.2.8.(2), (5), (7); 3.8.3.12 (1.5 x 1.5 m stall); allowance 1.1 m² over a standard 1.4 x 0.8 m stall is our arithmetic; can only read tight (judged)` }); }
     
    { const gal = S1.find(x => x.id === 'viewing_gallery' || x.id === 'gal' || /viewing gallery/.test(nm(x))), seats = opt.gallerySeats;
      const need = seats == null || seats < 2 ? 0 : seats <= 99 ? 2 : seats <= 499 ? 3 + Math.ceil((seats - 100 + 1) / 70 - E) : null, have = gal ? fx(gal, 'wheelchair') : null;
      out.push({ id: 'PG-gallery-wheelchair', title: 'Wheelchair spaces in fixed gallery seating', status: !gal ? 'n/a' : seats == null ? '?' : need === 0 ? 'pass' : have == null ? '?' : have >= need ? 'pass' : 'fail',
        text: !gal ? 'no viewing gallery drawn' : seats == null ? 'gallery drawn; fixed seats not given (loose seats need no spaces)' : need === 0 ? `${seats} fixed seats: none needed` : `${seats} fixed seats → ${need} wheelchair spaces; ${have == null ? 'none written (fx.wheelchair)' : have + ' written'}`,
        src: `${C} 3.8.2.3.(3), Table 3.8.2.3; 3.8.3.22` }); }
     
    if (city === 'van') out.push({ id: 'PG-pool-lift', title: 'Pool lift: 1.2 m clear deck round it, mobility-aid storage near the deck entry', status: opt.poolLift ? '?' : 'flag',
      text: opt.poolLift ? 'lift drawn: clearance not yet measured' : 'no pool lift position in the plan or definition: check in design (BC Guidelines 2025 3.9)', src: 'BC Guidelines for Pool Design 2025 s. 3.9 (guideline)' });
    return out;
  }
  const toHubRow = r => [r.status, r.title, r.src, r.text];
  return { rows, toHubRow, version: 'PG 17x' };
});

return module.exports; })({ exports: {} });
 
P['F7'] = (function (module) {
 
(function (root) {
'use strict';
const E = 0.005, f2 = x => (Math.round(x * 100 + 1e-9) / 100).toFixed(2);
function HC(o) { if (o && o.hubchecks) return o.hubchecks; if (root && root.BD && root.BD.hubchecks) return root.BD.hubchecks; throw new Error('F7: hubchecks (clearGeom) not available: pass opts.hubchecks (BD.hubchecks)'); }
const area = x => (x.r || []).reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]), 0);
function overlap(a0, a1, b0, b1) { return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); }
 
function shared(A, B) {
  let s = 0;
  for (const a of A.r) for (const b of B.r) {
    if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(a[0] - b[1]) < 1e-6) s += overlap(a[2], a[3], b[2], b[3]);
    if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(a[2] - b[3]) < 1e-6) s += overlap(a[0], a[1], b[0], b[1]);
  }
  return s;
}
function bbox(x) { const r = x.r; return [Math.min(...r.map(q => q[0])), Math.max(...r.map(q => q[1])), Math.min(...r.map(q => q[2])), Math.max(...r.map(q => q[3]))]; }
function gap(b, t) { const du = Math.max(t[0] - b[1], b[0] - t[1], 0), dv = Math.max(t[2] - b[3], b[2] - t[3], 0); return Math.max(du, dv); }
function viewing(plan, opt) {
  const S1 = plan.S['1'], by = id => S1.find(x => x.id === id), T = plan.POOL_TANK, hall = by('pool'), gal = by('gal'), lob = by('lob');
  const D = (plan.D || []).filter(d => d[0] === 1), has = (a, b) => D.some(d => (d[1] === a && d[2] === b) || (d[1] === b && d[2] === a));
  if (gal) {
    const GA = area(gal), wall = shared(gal, hall), dist = gap(bbox(gal), T), seats = Math.floor(GA / 0.75 + 1e-9), door = has('gal', 'pool');
    const ok = wall >= 3.0 - E && dist >= 1.2 - E && !gal.wet && !door;
    return { id: 'F7-view', title: 'Viewing gallery', status: ok ? 'pass' : 'fail', seats, detail: { GA, wall, dist, seats },
      src: 'BC Guidelines for Pool Design 2025 s. 3.8 (seating at least 1.2 m from the pool edge); NBC non-fixed seating 0.75 m² a seat; Sport England DGN 2013 (trust 70)',
      text: `gallery ${f2(GA)} m² (target 25-40 m²${GA < 25 || GA > 40 ? ': outside, a note' : ''}), about ${seats} seats (floor(${f2(GA)}/0.75)), glass wall ${f2(wall)} m (need 3.0), nearest seat ${f2(dist)} m from the pool edge (need 1.2), ${gal.wet ? 'WET' : 'dry'}, ${door ? 'a door joins gallery and pool (fail)' : 'no door to the pool'}` };
  }
  if (opt.viewFromLobby && lob) {
    const wall = shared(lob, hall), dist = gap(bbox(lob), T), b = bbox(lob), depth = Math.min(b[1] - b[0], b[3] - b[2]);
    const exits = D.filter(d => (d[1] === 'lob' || d[2] === 'lob') && (d[1] === 'OUT' || d[2] === 'OUT')).map(d => d[6] || 0.9);
    const narrow = exits.length ? Math.min(...exits) : 0.9, seats = Math.floor(4.0 / 0.5 + 1e-9), clearW = depth - 0.9;
    const desk = by('desk'), left = area(lob) + (desk ? area(desk) : 0) - 4.0 * 0.9;
    const ok = wall >= 3.0 - E && dist >= 1.2 - E && clearW >= 2.4 - E && clearW >= narrow - E && left >= 39.0 - E && !has('lob', 'pool');
    return { id: 'F7-view', title: 'Viewing from the lobby (glazed wall)', status: ok ? 'pass' : 'fail', seats, detail: { wall, dist, clearW, narrow, left, seats },
      src: 'BC Guidelines 2025 s. 3.8; Sport England DGN 2013; our arithmetic (bench row 4.0 x 0.9 m, 0.5 m a seat)',
      text: `lobby glass wall ${f2(wall)} m (need 3.0), distance ${f2(dist)} m (need 1.2), ${seats} bench seats, clear width past the seats ${f2(clearW)} m (need 2.4 and the narrowest exit door ${f2(narrow)} m), lobby and desk left after the seats ${f2(left)} m² (need 39.0)` };
  }
  return { id: 'F7-view', title: 'Viewing', status: 'fail', seats: 0, src: 'BC Guidelines 2025 s. 3.8', text: opt.galNote || 'no viewing gallery and no glazed lobby wall' };
}
function chairs(plan, hc) {
  const S1 = plan.S['1'], T = plan.POOL_TANK, b = hc.clearGeom(S1.find(x => x.id === 'pool'), S1, 1).bounds;
  const gW = T[0] - b[0], gE = b[2] - T[1], gS = T[2] - b[1], gN = b[3] - T[3], longU = (T[1] - T[0]) >= (T[3] - T[2]);
  const water = (T[1] - T[0]) * (T[3] - T[2]), L = Math.max(T[1] - T[0], T[3] - T[2]);
  const sides = longU ? { S: gS, N: gN } : { W: gW, E: gE }, k = Object.keys(sides), wide = sides[k[0]] >= sides[k[1]] ? k[0] : k[1], other = wide === k[0] ? k[1] : k[0];
  const out = {};
  if (water > 186 + 1e-9) {
    const c = sides[wide] - 0.46;
    out.chair = { id: 'F7-chairs', title: 'Elevated lifeguard chairs', status: c >= 1.2 - E ? 'pass' : 'fail', detail: { water, deck: sides[wide], clear: c },
      src: 'BC Guidelines 2025 s. 3.2 (1.2 m clear); chair threshold water over 186 m² from a US municipal code (ecode360, trust 40), not a BC or Alberta rule',
      text: `water ${f2(water)} m² (over 186): two chairs 0.46 x 1.07 m at 25 % and 75 % of the length on the ${wide} side; clear past each chair ${f2(c)} m (deck ${f2(sides[wide])} - 0.46); the 1.07 m is drawn along the wall (our choice)` };
  } else out.chair = { id: 'F7-chairs', title: 'Elevated lifeguard chairs', status: 'pass', detail: { water },
    src: 'BC Guidelines 2025 s. 3.2', text: `water ${f2(water)} m² (186 or less): no elevated chair required by that code; guards' deck position not drawn` };
  const len = Math.min(12.0, L - 4.0), cl = sides[other] - 0.45;
  out.bench = { id: 'F7-bench', title: 'Deck benches', status: cl >= 1.195 - 1e-9 ? 'pass' : 'fail', detail: { len, clear: cl, deck: sides[other] },
    src: 'project decision, 16 Nov 10:27 (bench 0.9 m deep in plan, 0.5 m a seat); BC Guidelines 2025 s. 3.2',
    text: `bench ${f2(len)} m x 0.45 on the ${other} side; clear to the pool edge ${f2(cl)} m (deck ${f2(sides[other])} - 0.45; need 1.195)` };
  return out;
}
 
function load(opt, seats) {
  const L = opt.load || {};
   
  if (opt.fullLoad != null) return { id: 'F7-load', title: 'Public load (full count)', status: 'pass', detail: { base: opt.fullLoad, seats, total: opt.fullLoad },
    src: 'project decision, 16 Nov 22:00; hub cross-review; VBBL/NBC Table 3.1.17.1', text: `one full-count load ${opt.fullLoad} (bathers + every other room at its code rate, gallery seats at 0.75 inside it), rounded up once` };
  const base = (L.bathers || 0) + (L.gym || 0) + (L.staff || 0);
  return { id: 'F7-load', title: 'Public load includes gallery seats', status: 'pass', detail: { base, seats, total: base + seats },
    src: 'hub cross-review 16 Nov (gallery seats added to the occupant load); NBC/VBBL 3.1.17.1 non-fixed seating 0.75 m² a person',
    text: `public load ${base} (bathers ${L.bathers || 0} + gym ${L.gym || 0} + staff ${L.staff || 0}) + ${seats} gallery seats = ${base + seats}; the seats are not bathers, so the change-room fixtures stay on bathers and gym (C4C5); spectators' WCs are the non-bather WCs (our reading)` };
}
function rows(plan, opt) {
  opt = opt || {}; const hc = HC(opt), v = viewing(plan, opt), c = chairs(plan, hc), r = [v, c.chair, c.bench];
  if (opt.load || opt.fullLoad != null) r.push(load(opt, v.seats || 0));
  return r;
}
const api = { rows, viewing, chairs, load, shared, toHubRow: r => [r.status, r.title, r.src, r.text], version: 'F7 patch 17 Nov' };
if (typeof module === 'object' && module.exports) module.exports = api; else (root.BD = root.BD || {}).F7 = api;
})(typeof self !== 'undefined' ? self : this);

return module.exports; })({ exports: {} });
 
P['P2'] = (function (module) {
 
(function (root) {
'use strict';
const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
function row(o) {
  const floor = o.mwFloor != null ? o.mwFloor : 0.3, W = o.buildW, D = o.buildD, wide = Math.max(W, D), narrow = Math.min(W, D);
  if (o.pool25Fits) return { id: 'P2', title: 'Learner pool fallback', status: 'n/a', text: 'the 25 m pool fits: no fallback', src: 'spec rule 15 step 8', detail: {} };
  const bathers = o.city === 'edm' ? Math.floor(91 / 1.5 + 1e-9) : Math.floor(91 / 0.93 + 1e-9);
  const fits = narrow >= 15.6 - 1e-9 && wide >= 16.6 - 1e-9;
  const mwOk = o.mwLeft == null || o.mwLeft >= floor - 1e-9;
  const status = fits && mwOk ? 'pass' : 'fail';
  const why = !fits ? `buildable ${f1(W)} x ${f1(D)} m: the learner hall needs 15.6 m (hall 10.6 + corridor 2.0 + stair 3.0) on the short side` : !mwOk ? `data centre left ${o.mwLeft} MW, under the ${floor} MW floor: doesn't fit` : `learner pool 13 x 7 m = 91 m² water, hall 16.6 x 10.6 m = 176 m², "smaller program"; ${bathers} bathers`;
  return { id: 'P2', title: 'Learner pool fallback (ladder step 8)', status, text: why, detail: { bathers, narrow, mwOk },
    src: 'community_pool.md rule 15 (project decision, 9 Nov); mwFloor 0.3 (typ_community_pool_CODE_2026-11-15.json); Sport England DGN pp. 44-45 (benchmark); project decision, 13 Nov: step not built in the engine' };
}
const api = { row, toHubRow: r => [r.status, r.title, r.src, r.text], version: 'P2 patch 17 Nov' };
if (typeof module === 'object' && module.exports) module.exports = api; else (root.BD = root.BD || {}).P2 = api;
})(typeof self !== 'undefined' ? self : this);

return module.exports; })({ exports: {} });
 
P['P3'] = (function (module) {
 
(function (root) {
'use strict';
const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
const PKG = { min: 31.5, minNoLaundry: 19.3, max: 85, laundryMin: 12.2 }, SALT = { min: 14, max: 40 }, LOUNGE = { min: 15, max: 139 };
function fill(o) {
  const g = o.ground || 0, u = o.upper || 0, rows = []; let left = g + u, lg = g;
  const total = g + u;
  if (total >= PKG.minNoLaundry) {
    const laundry = lg >= PKG.laundryMin && total >= PKG.min, a = Math.min(PKG.max, left);
    rows.push({ id: 'P3.pkg', title: 'Treatment package (rooms, linen, laundry)', status: laundry ? 'pass' : 'tight', detail: { area: a, laundry },
      src: ' 15 Nov l, m (project decision, 15 Nov 18:25); SOURCES_spa_rooms_2026-11-15.md (trade and maker sources, trust 30-50); laundry wet, ground only, never under the hall (rule 8)',
      text: `package ${f1(a)} m² (minimum ${laundry ? PKG.min : PKG.minNoLaundry}, maximum ${PKG.max}); ${laundry ? 'laundry drawn at grade' : 'laundry skipped: the only spare floor is under the hall or too small (flagged)'}` });
    left -= a; lg = Math.max(0, lg - a);
  } else rows.push({ id: 'P3.pkg', title: 'Treatment package', status: 'flag', detail: { area: 0 }, src: 'spec P3', text: `spare floor ${f1(total)} m² is under the package minimum ${PKG.minNoLaundry} m²: package not drawn` });
  if (left >= SALT.min) { const a = Math.min(SALT.max, left); rows.push({ id: 'P3.salt', title: 'Salt room (wellness)', status: 'pass', detail: { area: a }, src: 'typ_warm_bath.json spareFill 2', text: `salt room ${f1(a)} m² (14-40)` }); left -= a; }
  if (left >= LOUNGE.min) { const a = Math.min(LOUNGE.max, left); rows.push({ id: 'P3.lounge', title: 'Dry rest lounge', status: 'pass', detail: { area: a }, src: 'typ_warm_bath.json spareFill 3', text: `rest lounge ${f1(a)} m² (15-139); also the treatment waiting area` }); left -= a; }
  rows.push({ id: 'P3.rest', title: 'Spare floor left', status: left > 0.5 ? 'flag' : 'pass', detail: { left }, src: 'spec P3', text: `${f1(left)} m² left unassigned` });
  return rows;
}
const api = { fill, toHubRow: r => [r.status, r.title, r.src, r.text], version: 'P3 patch 17 Nov' };
if (typeof module === 'object' && module.exports) module.exports = api; else (root.BD = root.BD || {}).P3 = api;
})(typeof self !== 'undefined' ? self : this);

return module.exports; })({ exports: {} });
 
P['P4'] = (function (module) {
 
(function (root) {
'use strict';
const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
const area = x => (x.r || []).reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]), 0);
const isGym = x => /fitness|gym/i.test(x.n || '') && !/stair|corridor/i.test(x.n || '');
function capRow(plan, o) {
  const cap = o.cap || 500, S = plan.S || {}; let pool = 0, gym = 0;
   
  for (const k of Object.keys(S)) for (const x of S[k]) {
    if (isGym(x) || x.g === 'gym') gym += area(x); else if (['pub', 'plant', 'circ'].includes(x.g)) pool += area(x);
  }
  if (o.city !== 'edm') return { id: 'P4.cap', title: 'Edmonton cap', status: 'n/a', text: 'Vancouver: no area cap on the pool', src: 'Bylaw 20001 s. 3.12.1 (Edmonton only)', detail: {} };
  return { id: 'P4.cap', title: 'Over the BE cap (pool establishment)', status: pool > cap ? 'flag' : 'pass', detail: { pool, gym, cap },
    src: 'Zoning Bylaw 20001 s. 3.12.1 (500 m² Community Service in BE), s. 3.18 variance; project decision, 9 Nov Q11: flag, not fail; gym separate and uncapped (project decision, 14 Nov, already the board rule, Q9)',
    text: `pool establishment ${f1(pool)} m² against ${cap}${pool > cap ? ': needs a s. 3.18 variance or the rezoning flag' : ''}; gym ${f1(gym)} m² (separate establishment, uncapped, not counted); room areas by group pub + plant + circ, without wall thickness (the board gross adds the walls, grossarea.py)` };
}
function bathSupport(plan, o) {
  const S1 = (plan.S && (plan.S['1'] || plan.S[1])) || [], D = (plan.D || []).filter(d => d[0] === 1), out = [];
  const nb = id => D.filter(d => d[1] === id || d[2] === id).map(d => d[1] === id ? d[2] : d[1]);
  const fa = S1.find(x => /first aid/i.test(x.n || ''));
  if (fa) { const n = nb(fa.id), ok = n.some(i => ['thp', 'spa', 'sdeck'].includes(i)); out.push({ id: 'P4.firstaid', title: 'First aid: door to the deck', status: ok ? 'pass' : 'tight', src: 'drawing item (no code figure; our reading)', text: `first aid ${fa.id}: doors to ${n.join(', ') || 'none'}` }); }
  const att = S1.find(x => (x.windows || []).length);
  out.push({ id: 'P4.attendant', title: 'Attendant position: window to each pool hall', status: att && ['thp', 'spa'].every(h => att.windows.includes(h)) ? 'pass' : 'tight', src: 'drawing item; F6 attendant row', text: att ? `attendant ${att.id} windows to ${att.windows.join(', ')}` : 'no attendant room with windows' });
  const pp = S1.find(x => /pool plant|plant \(/i.test(x.n || '') && x.id === 'pplant'), ok = pp && nb('pplant').some(i => i !== 'OUT');
  out.push({ id: 'P4.plantdoor', title: 'Plant: inside door from the pool enclosure', status: ok ? 'pass' : 'fail', src: 'NBC(AE) 7.2.3.38.(1) via P1 (our reading)', text: pp ? `pplant doors: ${nb('pplant').join(', ')}` : 'no plant room' });
  return out;
}
const api = { capRow, bathSupport, toHubRow: r => [r.status, r.title, r.src, r.text], version: 'P4 patch 17 Nov' };
if (typeof module === 'object' && module.exports) module.exports = api; else (root.BD = root.BD || {}).P4 = api;
})(typeof self !== 'undefined' ? self : this);

return module.exports; })({ exports: {} });
 
P['CHEM-ACCESS'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'NBC(AE) 2023 7.2.3.39.(2) (paraphrase); Vancouver: BC Pool Guidelines s. 9 (not yet checked)';
const CHEM_ID = /^(hypochlorite|hypochlorite_store|chlorine|acid|acid_store|chem_store)$/, isChemRoom = x => !!x && (CHEM_ID.test(String(x.id || '').replace(/_c\d+$/, '')) || CHEM_ID.test(String(x.prog || '')));    
const isPublic = x => x && (['pcor', 'lobby'].includes(x.kind) || x.id === 'cor' || x.id === 'lob' || /public corridor|lobby/i.test(x.n || '') || ((x.g === 'pub' || x.g === 'grow') && !/plant|mech/i.test(x.n || '')));
function chemAccessRow(G, opts) {
  opts = opts || {}; const city = opts.city || (G._cfg && G._cfg.city) || (G.sel && G.sel.city) || G.city;
  const S1 = G.S['1'] || G.S[1] || [], byId = Object.fromEntries(S1.map(x => [x.id, x])), stores = S1.filter(x => isChemRoom(x)).map(x => x.id);
  if (!stores.length) return null; const st = new Set(stores);
  const hits = (G.D || []).filter(d => d[0] === 1 && ((st.has(d[1]) && isPublic(byId[d[2]])) || (st.has(d[2]) && isPublic(byId[d[1]]))))
    .map(d => st.has(d[1]) ? `${d[1]} → ${d[2]}` : `${d[2]} → ${d[1]}`);
  const status = !hits.length ? 'pass' : city === 'edm' ? 'fail' : 'flag';
  return { id: 'CHEM-ACCESS', title: 'Chemical stores: no direct access to public areas', status, src: SRC,
    text: (hits.length ? `STORE DOOR INTO A PUBLIC AREA: ${hits.join(', ')}${city === 'edm' ? '' : ' (the Alberta clause; reported only in Vancouver)'}` : `${stores.join(', ')}: no door into a public room, corridor or lobby`) + ' [script]' };
}
const api = { chemAccessRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchCHEMACCESS = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['SVC-EXIT'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'NBC(AE) 2023 / VBBL 2025 3.4.4.4.(7)-(9) (paraphrase)';
const SVC = /stor(e|age)\b|\bwcs?\b|washroom|toilet|laundry|janitor|custodial|mechanical|electrical|\bups\b|battery|garbage|switchgear|valve room/i;
function isExit(x) { return x && (x.kind === 'exitpas' || ((x.core || x.kind === 'pcore' || x.kind === 'score') && (x.stair || /^stair|exit stair/i.test(x.n || '')))); }
function isSvc(x) { return x && !isExit(x) && (x.g === 'plant' || x.kind === 'sroom' || SVC.test(x.n || '')); }
function svcExitRow(G) {
  const byId = st => Object.fromEntries((G.S[String(st)] || []).map(x => [x.id, x])), hits = [];
  for (const d of (G.D || [])) { const R = byId(d[0]), a = R[d[1]], b = R[d[2]]; if (!a || !b) continue;
    if ((isExit(a) && isSvc(b)) || (isExit(b) && isSvc(a))) { const [e, s] = isExit(a) ? [a, b] : [b, a]; hits.push(`${s.id} (${(s.n || '').split(' (')[0]}) opens into ${e.id} (storey ${d[0]})`); } }
  return { id: 'SVC-EXIT', title: 'No service room, store or washroom opens into an exit', status: hits.length ? 'fail' : 'pass',
    text: (hits.length ? `SERVICE ROOM OPENING INTO AN EXIT: ${hits.join('; ')}` : 'no service room, store or washroom opens directly into an exit stair or exit passage') + ' [script]', src: SRC };
}
const api = { svcExitRow, isExit, isSvc, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchSVCEXIT = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['WET-DC'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'FM 5-32 2.2.1.6; spec rule 8 (project decision, 9 Nov); definitions noWetOver / notAboveOrBelow';
const WET = /pool|spa\b|spa hall|steam|sauna|plunge|shower|change room|\bwcs?\b|washroom|toilet|greenhouse|fish hall|biome|production|propagation|potting|laundry|kitchen|hot pool|whirlpool/i;
const POOLSPA = /pool hall|spa hall|steam|sauna|plunge|hot pool/i;
const isDC = x => !x.core && (['hall', 'sup', 'load'].includes(x.g) || ['hall', 'score', 'scor', 'sroom', 'bay', 'dock'].includes(x.kind) || x.block === 'data centre');
const ov = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
function wetDcRow(G, opts) {
  opts = opts || {}; const defWet = new Set(((opts.def && opts.def.rooms) || []).filter(r => r.wet).map(r => r.id));
  const isWet = x => !isDC(x) && (x.wet === true || defWet.has(String(x.id || '').replace(/_c\d+$/, '')) || WET.test(x.n || ''));
  const sts = Object.keys(G.S || {}).map(Number).sort((a, b) => a - b), over = [], under = [];
  const area = (x, y) => x.r.reduce((m, r) => m + y.r.reduce((n, q) => n + ov(r, q), 0), 0);
  for (const s of sts) for (const x of G.S[String(s)]) {
    if (!isWet(x)) continue;
    for (const y of (G.S[String(s - 1)] || [])) if (isDC(y)) { const a = area(x, y); if (a > 0.05) over.push(`${x.id} (storey ${s}) over ${y.id} ${(y.n || '').split(' (')[0]} (${a.toFixed(1)} m²)`); }
    if (POOLSPA.test(x.n || '')) for (const y of (G.S[String(s + 1)] || [])) if (isDC(y)) { const a = area(x, y); if (a > 0.05) under.push(`${x.id} (storey ${s}) under ${y.id} (${a.toFixed(1)} m²)`); } }
  const bad = over.concat(under);
  return { id: 'WET-DC', title: 'No wet room over the data centre; pool and spa never under it', status: bad.length ? 'fail' : 'pass',
    text: (bad.length ? `WET ROOM AND DATA CENTRE STACKED: ${bad.join('; ')}` : 'no wet room over a data-centre room, no pool or spa room under one') + ' [script]', src: SRC };
}
const api = { wetDcRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchWETDC = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['FTF'] = (function (module) {
 
(function (root) {
'use strict';
const MIN = { 'I-3': { ground: 6.0, upper: 4.0, src: 'I-3 3.1.2.9' }, 'I-2': { ground: 6.1, upper: 4.0, src: 'I-2 3.1.2.4 (sub-area A only)', subA: true },
  'I-1C': { ground: 6.1, second: 5.35, upper: null, src: 'I-1C 3.1.2.3 (March 2023: first floor 6.1 m, second floor 5.35 m; zones.json; 18f item 2)' },
  'I-2B': { ground: 6.1, upper: 4.0, src: 'I-2 3.2.2.9 (sub-area B; zones.json)' } };    
function ftfRow(G, opts) {
  opts = opts || {}; const zone = opts.zone || (G.far && G.far.zone) || G.zone, m = MIN[zone === 'I-2' && opts.subB ? 'I-2B' : zone]; if (!m || !Array.isArray(G.H) || !G.H.length) return null;
  const subA = opts.subA != null ? opts.subA : (G.sel && G.sel.subA != null ? G.sel.subA : null);
  if (m.subA && subA === false) return null;
  const bad = [];
  if (G.H[0] + 1e-6 < m.ground) bad.push(`storey 1 ${G.H[0]} m < ${m.ground}`);
  if (m.upper != null) G.H.slice(1).forEach((h, i) => { if (h + 1e-6 < m.upper) bad.push(`storey ${i + 2} ${h} m < ${m.upper}`); });
  if (m.second != null && G.H.length > 1 && G.H[1] + 1e-6 < m.second) bad.push(`storey 2 ${G.H[1]} m < ${m.second}`);
  const unk = m.subA && subA == null && bad.length;
  return { id: 'FTF', title: 'Floor-to-floor heights (zone minimum)', status: unk ? '?' : bad.length ? 'fail' : 'pass', hard: true,
    text: (unk ? `${zone} sub-area A not mapped; there the minimum is ${m.ground} m ground / ${m.upper} m upper (${m.src}) and this plan has ${bad.join('; ')}: not tested` : bad.length ? `FLOOR-TO-FLOOR UNDER THE ZONE MINIMUM (${zone}): ${bad.join('; ')}` : `storey heights ${G.H.join(' / ')} m meet ${zone}'s ${m.ground} m ground${m.upper != null ? ` and ${m.upper} m upper` : ''} minimum`) + ' [script]', src: `Vancouver Z&D ${m.src}` };
}
const api = { ftfRow, MIN };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchFTF = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['CHEM-DC'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'NBC(AE) 7.2.3.39.(2); FM 5-32; project decision, 17 Nov 15:02 ( item 1)';
const CHEM_ID = /^(hypochlorite|hypochlorite_store|chlorine|acid|acid_store|chem_store)$/, isChemRoom = x => !!x && (CHEM_ID.test(String(x.id || '').replace(/_c\d+$/, '')) || CHEM_ID.test(String(x.prog || '')));    
const isDC = x => ['hall', 'sup', 'load'].includes(x.g) || ['hall', 'score', 'scor', 'sroom', 'bay', 'dock'].includes(x.kind) || x.block === 'data centre';
const ov = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
function chemDcRow(G) {
  const sts = Object.keys(G.S || {}).map(Number).sort((a, b) => a - b), hits = [], stores = [];
  for (const s of sts) for (const x of G.S[String(s)]) {
    if (!isChemRoom(x)) continue; stores.push(x.id);
    for (const t of [s - 1, s + 1]) for (const y of (G.S[String(t)] || [])) {
      if (!isDC(y) || y.core) continue;
      const a = x.r.reduce((m, r) => m + y.r.reduce((n, q) => n + ov(r, q), 0), 0);
      if (a > 0.05) hits.push(`${x.id} (storey ${s}) ${t > s ? 'under' : 'over'} ${y.id} ${(y.n || '').split(' (')[0]} (${a.toFixed(1)} m²)`); } }
  if (!stores.length) return null;
  const status = hits.length ? 'fail' : 'pass';
  const text = hits.length ? `CHEMICAL STORE UNDER OR OVER DATA-CENTRE ROOMS: ${hits.join('; ')}` : `${stores.join(', ')}: no data-centre room above or below`;
  return { id: 'CHEM-DC', title: 'Chemical stores never under or over data-centre rooms', status, text: text + ' [script]', src: SRC };
}
const api = { chemDcRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchCHEMDC = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['USE-PATH'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'checks/sources/USE_TABLE_2026-11-17.md (Van I-2 Mar 2025, I-3 Jun 2026, I-1C Mar 2023; Edmonton Bylaw 20001 BE); project decision, 17 Nov 16:54-16:55 (never hard)';
 
const RANK = { O: 0, C: 1, V: 1, R: 2, '?': 3 }, WORD = { O: 'permitted', C: 'conditional (City approval)', V: 'conditional (City approval)', R: 'needs a rezoning', '?': 'not read' };
 
const PROG = [
  ['data centre', x => x.block === 'data centre' || x.g === 'hall'],
  ['pool', x => /^pool_hall$/.test(x._id)],
  ['spa', x => /^(spa_hall|therapy_hall|steam|sauna)$/.test(x._id)],
  ['gym', x => /^gym$/.test(x._id)],
  ['urban farm', x => /^(greenhouse|headhouse|greenhouse_fish|headhouse_growth)$/.test(x._id)],
  ['fish hall', x => /^fish_hall$/.test(x._id)],
  ['display biome', x => /^(biome|biome_growth)$/.test(x._id)],
  ['propagation', x => /^(production|propagation|potting)$/.test(x._id)],
  ['class rooms', x => /^class_room/.test(x._id)],
  ['teaching kitchen', x => /^kitchen$/.test(x._id)],
  ['dining', x => /^dining$/.test(x._id)],
  ['day shelter', x => /^(rest_area|services_reception|case_worker_office|counselling|shel)$/.test(x._id)],
  ['clinic', x => x.g === 'clin' || /^(exam|procedure|clinic)/.test(x._id)],
  ['refuge', x => /^(refuge|ref)$/.test(x._id)],
  ['community program rooms', x => /^program_room/.test(x._id)]
];
 
const T = {
  van: {
    'I-2': { 'data centre': ['C', 'I-2 2.1, 2.2.7 (Bulk Data Storage; not at the ground floor except entrances)'], pool: ['C', 'I-2 2.1, 2.2.1 (Community Centre or Neighbourhood House / Public Authority Use; our reading)'],
      spa: ['R', 'I-2 2.1: Beauty and Wellness Centre not listed; defined, so not under the 2.2.12 catch-all'], gym: ['C', 'I-2 2.1 (as part of the Community Centre; Fitness Centre not listed: R if read so) (likely)'],
      'urban farm': ['C', 'I-2 2.1, 2.2.1 (Urban Farm - Class B)'], 'fish hall': ['R', 'I-2 2.2.12 catch-all, but conditional uses keep no live animals (2.2.1(b)): text amendment'],
      'display biome': ['R', 'I-2 2.1: Zoo or Botanical Garden not listed'], propagation: ['R', 'with the biome; or C as Urban Farm - Class B if accepted (a guess)'],
      'class rooms': ['C', 'accessory to a conditional use (I-2 2.1); School - Arts or Self-Improvement not listed'], 'teaching kitchen': ['O', 'I-2 2.1, 2.2.2 (Catering Establishment)'],
      dining: ['C', 'I-2 2.1 (Restaurant - Class 1; 300 m², 3.1.1.1(b)(iv))'], 'day shelter': ['C', 'I-2 2.1 (Social Service Centre)'], clinic: ['C', 'I-2 2.1 (Health Care Office)'],
      refuge: ['C', 'I-2 2.1 (Public Authority Use / Social Service Centre)'], 'community program rooms': ['C', 'I-2 2.1 (Community Centre or Neighbourhood House)'] },
    'I-3': { 'data centre': ['C', 'I-3 2.1, 2.2.11 (Bulk Data Storage, sub-area A only; not at the ground floor except entrances)'], pool: ['C', 'I-3 2.1, 2.2.1 (Community Centre or Neighbourhood House / Public Authority Use; our reading)'],
      spa: ['C', 'I-3 2.1, 2.2.12 (Beauty and Wellness Centre, limited to hydrotherapy and thermal therapy)'], gym: ['C', 'I-3 2.1 (Fitness Centre)'], 'urban farm': ['C', 'I-3 2.1 (Urban Farm - Class B)'],
      'fish hall': ['R', 'I-3 2.2.15 catch-all, but conditional uses keep no live animals (2.2.1(c)): text amendment'], 'display biome': ['R', 'I-3 2.1: Zoo or Botanical Garden not listed'],
      propagation: ['R', 'with the biome; or C as Urban Farm - Class B if accepted (a guess)'], 'class rooms': ['C', 'I-3 2.1 (School - Arts or Self-Improvement)'], 'teaching kitchen': ['C', 'I-3 2.1 (Catering Establishment)'],
      dining: ['C', 'I-3 2.1, 2.2.10 (Restaurant - Class 1, 300 m²)'], 'day shelter': ['C', 'I-3 2.1 (Social Service Centre)'], clinic: ['C', 'I-3 2.1, 2.2.6 (Health Care Office, sub-area A; not at the ground floor except entrances)'],
      refuge: ['C', 'I-3 2.1 (Public Authority Use / Social Service Centre)'], 'community program rooms': ['C', 'I-3 2.1 (Community Centre or Neighbourhood House; Hall)'] },
    'I-1C': { 'data centre': ['C', 'I-1C 2.1, 2.2.1'], pool: ['C', 'I-1C 2.1 (Public Authority Use; Community Centre not listed)'], spa: ['C', 'I-1C 2.1 (Beauty and Wellness Centre)'], gym: ['C', 'I-1C 2.1 (Fitness Centre)'],
      'urban farm': ['C', 'I-1C 2.1'], 'fish hall': ['R', 'I-1C 2.2.12 catch-all; live animals barred as I-2 (likely)'], 'display biome': ['R', 'I-1C 2.1: not listed'], propagation: ['R', '(a guess)'],
      'class rooms': ['C', 'I-1C 2.1'], 'teaching kitchen': ['O', 'I-1C 2.1, 2.2.2'], dining: ['C', 'I-1C 2.1 (150 m², 3.1.1.1(d)(iii))'], 'day shelter': ['C', 'I-1C 2.1'], clinic: ['C', 'I-1C 2.1'],
      refuge: ['C', 'I-1C 2.1'], 'community program rooms': ['C', 'I-1C 2.1 (Public Authority Use; Community Centre not listed)'] }
  },
  edm: {
    BE: { 'data centre': ['R', 'BE 2: Major Industrial not listed (Minor Industrial 2.3 only); edm_dc_major'], pool: ['O', 'BE 2.19 (Community Service; 500 m² per establishment, 3.12.1: variance 3.18 or rezoning past it)'],
      spa: ['O', 'BE 2.10 / 2.9 (Indoor Sales and Service / Health Service; 500 m², 3.7.1 / 3.3.1)'], gym: ['O', 'BE 2.13 (Minor Indoor Entertainment; no cap)'], 'urban farm': ['O', 'BE 2.25, 3.16.1'],
      'fish hall': ['O', 'BE 2.25 (Urban Agriculture: aquaponic systems)'], 'display biome': ['O', 'BE 2.12 (Major Indoor Entertainment; 500 m², 3.3.1)'], propagation: ['O', 'BE 2.25'],
      'class rooms': ['O', 'accessory (likely)'], 'teaching kitchen': ['O', 'BE 2.7, 3.6.1 (Custom Manufacturing)'], dining: ['O', 'BE 2.8 (Food and Drink Service; 500 m², 3.3.1)'],
      'day shelter': ['O', 'BE 2.19 (Community Service: a day shelter, not a Year-Round or Seasonal Shelter (s. 8.20: accommodations), so the 500 m² cap of 3.12.1 applies and 3.12.2 does not)'], clinic: ['O', 'BE 2.9 (Health Service; 500 m²)'], refuge: ['O', 'BE 2.21 / 2.19'],
      'community program rooms': ['O', 'BE 2.19 (Community Service; 500 m²)'] },
    IH: { 'data centre': ['O', 'IH 2.1 (Major Industrial)'] }, EETC: { 'data centre': ['O', 'EETC 2.1, 4.1-4.2 (Major Industrial)'] }
  }
};
function usePathRow(G, opts) {
  opts = opts || {}; const city = opts.city || (G._cfg && G._cfg.city) || G.city, zone = opts.zone || (G.far && G.far.zone) || G.zone;
  const rooms = Object.values(G.S || {}).flat().map(x => Object.assign({}, x, { _id: String((x.prog || x.id || '')).replace(/_c\d+$/, '') }));
  const found = PROG.filter(([, t]) => rooms.some(t)).map(([n]) => n); if (!found.length) return null;
  const Z = (T[city] || {})[zone];
  const paths = found.map(p => { const e = Z && Z[p]; return { program: p, path: e ? e[0] : '?', clause: e ? e[1] : (Z ? 'program not in the use table for ' + zone : 'zone ' + (zone || '(none)') + ' not in the use table (not yet checked)') }; });
  const worst = paths.reduce((a, b) => RANK[b.path] > RANK[a] ? b.path : a, 'O');
  const status = worst === 'O' ? 'pass' : worst === '?' ? '?' : 'flag';
  return { id: 'USE-PATH', title: 'Approval path per program (never a fail)', status, hard: false, worst, paths, src: SRC,
    label: WORD[worst], labels: paths.map(p => ({ program: p.program, label: WORD[p.path], clause: p.clause })),
    text: `${city === 'van' ? 'Vancouver' : 'Edmonton'} ${zone || '?'}: ${WORD[worst]}. ` + paths.map(p => `${p.program}: ${WORD[p.path]} (${p.clause})`).join('; ') + '. The plan is drawn either way [table]' };
}
const api = { usePathRow, T, PROG, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchUSEPATH = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['ZYARD-RES'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'Vancouver I-2 3.1.2.3 (paraphrase); Edmonton Bylaw 20001 BE Table 4.1, IM / IH setbacks (as tool/site.js); project decision, 17 Nov ( item 4)';
const RANK = ['n/a', 'pass', '?', 'fail'], worse = (a, b) => RANK.indexOf(b) > RANK.indexOf(a) ? b : a;
function dPtSeg(p, a, b) { const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2)) : 0; return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy); }
function dPtRect(p, r) { return Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3])); }
function dSegRect(a, b, r) { const cs = [[r[0], r[2]], [r[0], r[3]], [r[1], r[2]], [r[1], r[3]]];
  let d = Math.min(...cs.map(c => dPtSeg(c, a, b)), dPtRect(a, r), dPtRect(b, r));
  for (let k = 1; k < 20; k++) { const t = k / 20; d = Math.min(d, dPtRect([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], r)); }
  return d; }
function resYardRow(G, opts) {
  opts = opts || {}; const city = opts.city || (G._cfg && G._cfg.city) || G.city, zone = opts.zone || (G.far && G.far.zone) || G.zone, subB = !!opts.subB;
  const E = (G.EDGES || []).filter(e => e && e.a && e.b && /lot|residential/i.test(e.abuts || '') && !/street|lane|alley/i.test(e.abuts || ''));
  const R = Object.values(G.S || {}).flat().flatMap(x => x.r || []); if (!R.length || !E.length) return null;
  const lines = []; let status = 'n/a';
  for (const e of E) { const drawn = Math.min(...R.map(r => dSegRect(e.a, e.b, r))), ab = e.abuts || ''; let need = null, st = 'n/a', why = '';
    if (city === 'van' && zone === 'I-2' && !subB && e.kind !== 'front' && e.kind !== 'rear') {
      if (/\bRM\b/.test(ab)) { need = 1.5; why = 'beside an RM site'; } else if (/\b(R1|RT|RA)\b|residential/i.test(ab)) { need = 0.9; why = 'beside an R1 / RT / RA site (no lane assumed)'; }
      if (need != null) st = drawn + 0.005 >= need ? 'pass' : 'fail';
      else { st = drawn + 0.005 >= 1.5 ? 'pass' : '?'; why = drawn + 0.005 >= 1.5 ? '1.5 m or more drawn: meets either neighbour case' : "neighbour's zone not read (Vancouver sites carry 'lot' only)"; need = 1.5; }
    } else if (city === 'edm' && /residential|non-industrial/i.test(ab)) { need = +e.d || 0; why = ab; st = drawn + 0.005 >= need ? 'pass' : 'fail'; }
    else if (city === 'edm' && /nothing found|\(\?\)/.test(ab)) { need = +e.d || 0; why = ab; st = drawn + 0.005 >= need ? 'pass' : '?'; }
    if (st === 'n/a') continue; status = worse(status, st);
    lines.push(`${e.kind} line ${why}: ${drawn.toFixed(2)} m drawn against ${need.toFixed(1)} m (${st})`); }
  if (!lines.length) return null;
  return { id: 'ZYARD-RES', title: 'Yards beside residential lots', status, hard: true, src: SRC, text: lines.join('; ') + ' [script]' };
}
const api = { resYardRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchZYARDRES = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['EXTWALL'] = (function (module) {
 
(function (root) {
'use strict';
const SRC = 'definition onExteriorWall / notStreetFace (E12; NBC(AE) 7.2.3.38 for the pool plant; drawing choices for mechanical rooms)';
function extWallRow(G, opts) {
  const def = opts && opts.def, cons = ((def && def.constraints) || []).filter(c => c.type === 'onExteriorWall' && c.room); if (!cons.length) return null;
  const S1 = G.S['1'] || G.S[1] || [], R = S1.flatMap(x => x.r.map(r => [x, r]));
  const inside = (u, v, self) => R.some(([x, r]) => x !== self && r[0] - 0.001 < u && u < r[1] + 0.001 && r[2] - 0.001 < v && v < r[3] + 0.001);
  const insideAny = (u, v) => R.some(([, r]) => r[0] + 0.02 < u && u < r[1] - 0.02 && r[2] + 0.02 < v && v < r[3] - 0.02);
  const streets = (G.STREET_EDGES || (G.EDGES || []).filter(e => e.abuts === 'street').map(e => [e.a, e.b]));
  const segs = []; for (const P of streets) for (let i = 0; i < P.length - 1; i++) segs.push([P[i], P[i + 1]]);
  const nearSt = (u, v) => segs.some(([a, b]) => { const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy, t = L2 ? Math.max(0, Math.min(1, ((u - a[0]) * vx + (v - a[1]) * vy) / L2)) : 0; return Math.hypot(u - a[0] - t * vx, v - a[1] - t * vy) < 0.06; });
  const onStreet = (u, v, du, dv) => { for (let k = 3; k <= 1200; k++) { const p = u + du * k * 0.1, q = v + dv * k * 0.1; if (insideAny(p, q)) return false; if (nearSt(p, q)) return true; } return false; };
  const rows = [];
  for (const c of cons) { const x = S1.find(y => String(y.id).replace(/_c\d+$/, '') === c.room); if (!x) continue;
    let ext = 0, extOff = 0;
    for (const r of x.r) for (const [side, du, dv] of [['a0', -1, 0], ['a1', 1, 0], ['b0', 0, -1], ['b1', 0, 1]]) {
      const along = side[0] === 'a' ? [r[2], r[3]] : [r[0], r[1]];
      for (let t = along[0] + 0.05; t < along[1]; t += 0.1) {
        const u = side === 'a0' ? r[0] : side === 'a1' ? r[1] : t, v = side === 'b0' ? r[2] : side === 'b1' ? r[3] : t;
        if (inside(u + du * 0.05, v + dv * 0.05, x) || x.r.some(q => q !== r && q[0] - 0.001 < u + du * 0.05 && u + du * 0.05 < q[1] + 0.001 && q[2] - 0.001 < v + dv * 0.05 && v + dv * 0.05 < q[3] + 0.001)) continue;
        ext += 0.1; if (!c.notStreetFace || !segs.length || !onStreet(u, v, du, dv)) extOff += 0.1; } }
    const need = c.notStreetFace ? extOff : ext, st = need + 1e-6 >= 0.9 ? 'pass' : 'fail';
    rows.push([x.id, st, `${x.id}: ${ext.toFixed(1)} m of exterior wall${c.notStreetFace ? `, ${extOff.toFixed(1)} m of it off the street faces${segs.length ? '' : ' (no street lines in the plan: not tested ?)'}` : ''}`]); }
  if (!rows.length) return null;
  const bad = rows.filter(r => r[1] === 'fail');
  return { id: 'EXTWALL', title: 'Rooms on an exterior wall (and off the street faces) as the definition says', status: bad.length ? 'fail' : 'pass',
    text: (bad.length ? 'NOT ON AN EXTERIOR WALL AS REQUIRED: ' : '') + rows.map(r => r[2]).join('; ') + ' [script]', src: SRC };
}
const api = { extWallRow, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchEXTWALL = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['COV-hub'] = (function (module) {
 
(function (root) {
'use strict';
const ar = r => (r[1] - r[0]) * (r[3] - r[2]), EPS = 1e-6, f1 = x => (Math.round(x * 10) / 10).toFixed(1);
function segD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function rectSegD(r, a, b) {  
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([r[0] + (r[1] - r[0]) * t, r[2]], [r[0] + (r[1] - r[0]) * t, r[3]], [r[0], r[2] + (r[3] - r[2]) * t], [r[1], r[2] + (r[3] - r[2]) * t]); }
  let d = Math.min(...pts.map(p => segD(p, a, b))); for (const p of [a, b]) if (p[0] > r[0] && p[0] < r[1] && p[1] > r[2] && p[1] < r[3]) d = 0; return d; }
const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.05;
function neighbourLines(G) { const P = G.LOTPOLY || [], E = G.STREET_EDGES || [], out = [];
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (near(a, b)) continue;
    if (!E.some(e => (segD(a, e[0], e[1]) < 0.05 && segD(b, e[0], e[1]) < 0.05))) out.push([a, b]); } return out; }
function shared(r, q) {  
  if (Math.abs(r[1] - q[0]) < 0.02 || Math.abs(q[1] - r[0]) < 0.02) return Math.max(0, Math.min(r[3], q[3]) - Math.max(r[2], q[2]));
  if (Math.abs(r[3] - q[2]) < 0.02 || Math.abs(q[3] - r[2]) < 0.02) return Math.max(0, Math.min(r[1], q[1]) - Math.max(r[0], q[0])); return 0; }
const ovA = (r, q) => Math.max(0, Math.min(r[1], q[1]) - Math.max(r[0], q[0])) * Math.max(0, Math.min(r[3], q[3]) - Math.max(r[2], q[2]));
function occOf(x) { if (x.occ) return x.occ; if (x.g === 'clin') return 'D'; if (x.g === 'pub' || x.g === 'grow' || x.g === 'gym') return 'A-2';    
  if (['hall', 'sup', 'load', 'plant', 'spare'].includes(x.g)) return 'F-2'; return null; }
 
const PAIR = { 'A-2|D': 1, 'A-2|F-2': 2, 'D|F-2': 0 };
const pairH = (a, b) => { if (!a || !b || a === b) return 0; const k = [a, b].sort().join('|'); return PAIR[k] != null ? PAIR[k] : null; };
const isLift = x => x.lift || (/\blift\b|elevator/i.test(x.n || '') && !x.stair && !/lobby|landing|dock|vestibule/i.test(x.n || ''));    
const isShaft = x => /shaft|riser/i.test(x.n || '') && !isLift(x);
const isRefuse = x => /garbage|refuse|recycl|waste/i.test(x.n || '') && !/water/i.test(x.n || '');
const glazed = x => !!x.sky || (/greenhouse|glasshouse|\bbiome\b|conservatory|propagation house/i.test(x.n || '') && !/mech|headhouse|\bwc\b|desk|lobby|store|plant/i.test(x.n || ''));
const isExit = x => x.stair || x.kind === 'exitpas' || /^pas\d*$/.test(x.id || '') || /exit passage/i.test(x.n || '');
const isExpl = x => /\bmv\b|medium.voltage|transformer|battery|ups\b|heat.recovery|heat pump|chiller room|refrigerat/i.test((x.id || '') + ' ' + (x.n || '')) && !/alcove|pad|open to the street/i.test(x.n || '');
const sepH = (x, other) => [].concat(x.sep || []).filter(s => !s.suite || s.suite === (other.suite || 'program')).reduce((m, s) => Math.max(m, s.h || 0), 0);

function sepRow(G, opts) {
  const need = [], st = Object.keys(G.S || {}).sort((a, b) => a - b), floorH = (opts && opts.floorH) || 2;
  for (const k of st) { const R = G.S[k] || [];
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], b = R[j]; let len = 0; for (const r of a.r) for (const q of b.r) len += shared(r, q); if (len < 0.3) continue;
      const why = []; let h = 0; const oa = occOf(a), ob = occOf(b), ph = pairH(oa, ob);
      if (ph) { h = Math.max(h, ph); why.push(`${oa} / ${ob} (3.1.3.1)`); }
      const sa = a.suite, sb = b.suite; if (sa && sb && sa !== sb && [sa, sb].includes('dc')) { h = Math.max(h, 2); why.push(`suites ${sa} / ${sb} (3.3.1.1; program-dc only,  item 1)`); }
      for (const [x, y] of [[a, b], [b, a]]) { if (isLift(x) || isShaft(x)) { h = Math.max(h, floorH); why.push(`${isLift(x) ? 'hoistway' : 'shaft'} ${x.id} (${isLift(x) ? '3.5.3.1' : '3.6.3.1'}: the floor's rating)`); }
        if (isRefuse(x)) { h = Math.max(h, 1); why.push(`refuse room ${x.id} (3.6.2.5)`); } }
      if (!h) continue; const have = Math.max(sepH(a, b), sepH(b, a));
      need.push({ st: +k, a: a.id, b: b.id, len, h, have, why: [...new Set(why)].join('; ') }); } }
   
  for (let s = 0; s + 1 < st.length; s++) { const lo = G.S[st[s]] || [], hi = G.S[st[s + 1]] || [];
    for (const a of lo) for (const b of hi) { const oa = occOf(a), ob = occOf(b), ph = pairH(oa, ob); if (!ph) continue; let A = 0; for (const r of a.r) for (const q of b.r) A += ovA(r, q); if (A < 1) continue;
      need.push({ st: +st[s], a: a.id, b: b.id + ' (above)', len: A, h: ph, have: 0, why: `${oa} under ${ob} (3.1.3.1, the floor)`, floor: true }); } }
   
  const cov = [].concat(G.COVERED || (opts && opts.truckCovered && G.COURT ? [G.COURT] : []));
  if (cov.length) for (const x of (G.S[1] || [])) for (const c of cov) { let len = 0; for (const r of x.r) len += shared(r, c); if (len >= 0.3) need.push({ st: 1, a: x.id, b: 'covered truck court', len, h: null, have: 0, why: 'covered receiving passageway separated from the building (3.2.3.18; rating per the article (not yet checked))' }); }
  const open = need.filter(n => !(n.have >= (n.h || 99)));
  const title = 'Separations the plan needs (occupancies, suites, shafts, hoistways, refuse, covered receiving)';
  if (!need.length) return { id: 'COV-sep', title, status: 'pass', text: 'no wall or floor between different occupancies, suites, shafts or refuse rooms [script]', src: SRC.sep, need };
  const byH = {}; open.forEach(n => { const k = n.h == null ? '?' : n.h + ' h'; byH[k] = (byH[k] || 0) + 1; });
  return { id: 'COV-sep', title, status: open.length ? '?' : 'pass', src: SRC.sep, need,
    text: `${need.length} wall(s) or floor(s) need a rated separation; ${open.length} not rated in the plan (${Object.entries(byH).map(([k, v]) => v + ' × ' + k).join(', ')}): ` + open.slice(0, 8).map(n => `storey ${n.st} ${n.a} / ${n.b}: ${n.why}`).join('; ') + (open.length > 8 ? `; and ${open.length - 8} more` : '') + ' [script; ratings are not drawn: listed for design]' }; }

function ld12Row(G) {
  const L = neighbourLines(G), title = 'Walls within 1.2 m of a neighbour lot line: no doors, no glazed rooms (3.2.3.5)';
  if (!G.LOTPOLY) return { id: 'COV-ld12', title, status: '?', text: 'no lot outline [script]', src: SRC.ld12 };
  const bad = [], walls = [];
  for (const k of Object.keys(G.S || {})) for (const x of G.S[k]) for (const r of x.r) for (const l of L) { const d = rectSegD(r, l[0], l[1]); if (d >= 1.2 - EPS) continue;
    walls.push({ st: +k, id: x.id, d }); if (glazed(x)) bad.push(`${String(x.n).split(' (')[0]} (storey ${k}) glazed, ${f1(d)} m from the line`); }
  const rooms = {}; for (const k of Object.keys(G.S || {})) for (const x of G.S[k]) rooms[k + ':' + x.id] = x;
  for (const d of (G.D || [])) { if (!(d[1] === 'OUT' || d[2] === 'OUT')) continue; const id = d[1] === 'OUT' ? d[2] : d[1], x = rooms[d[0] + ':' + id], p = [d[3], d[4]];
     
    const nn = d[5] === 'v' ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]], inR = q => x && x.r.some(r => q[0] > r[0] + EPS && q[0] < r[1] - EPS && q[1] > r[2] + EPS && q[1] < r[3] - EPS);
    const dir = nn.find(v => !inR([p[0] + v[0] * 0.3, p[1] + v[1] * 0.3])) || nn[0];
    for (const l of L) { const dd = segD(p, l[0], l[1]); if (dd >= 1.2 - EPS) continue; const st = Math.max(0.05, Math.min(dd, 0.5));
      if (dd < 0.05 || segD([p[0] + dir[0] * st, p[1] + dir[1] * st], l[0], l[1]) <= dd - 0.7 * st) bad.push(`door ${id} (storey ${d[0]}) ${f1(dd)} m from the line`); } }
  const ws = [...new Set(walls.map(w => w.st + ':' + w.id))];
  if (!walls.length) return { id: 'COV-ld12', title, status: 'pass', text: `no wall within 1.2 m of a neighbour lot line (${L.length} neighbour line(s)) [script]`, src: SRC.ld12 };
  return { id: 'COV-ld12', title, status: bad.length ? 'fail' : 'pass', src: SRC.ld12,
    text: (bad.length ? 'unprotected openings within 1.2 m: ' + bad.slice(0, 8).join('; ') + (bad.length > 8 ? `; and ${bad.length - 8} more` : '') + '. ' : '') + `${ws.length} room wall(s) within 1.2 m of a neighbour line: no unprotected openings allowed there and the wall is rated as an exposing face (3.2.3.5, 3.2.3.7; rating not drawn). Windows are not modelled [script]` }; }

function roofRow(G, opts) {
  const st = Object.keys(G.S || {}).map(Number).sort((a, b) => a - b), top = st[st.length - 1], roofPlant = (opts && opts.roofPlant) || [], title = 'Roof access (3.2.5.3 over 3 storeys; 3.6.4.7 roof plant)';
  const need = st.length > 3 || roofPlant.length > 0; if (!need) return { id: 'COV-roof', title, status: 'pass', text: `${st.length} storeys, no roof plant passed in: no roof access required [script]`, src: SRC.roof };
  const stairTop = (G.S[top] || []).some(x => x.stair);
   
  const status = stairTop ? 'pass' : st.length > 3 ? 'fail' : '?';
  return { id: 'COV-roof', title, status, src: SRC.roof,
    text: `${st.length} storeys${roofPlant.length ? `, ${roofPlant.length} plant item(s) on a roof` : ''}: ${stairTop ? 'a stair reaches the top storey (storey ' + top + '); roof hatch or stair head from it assumed' : 'no stair reaches the top storey (storey ' + top + ')' + (st.length > 3 ? ': no roof access' : ': roof plant needs access per CSA B149.1 4.1.4.5-6 (fixed ladder or stair; not drawn, clauses not read ?)')}${roofPlant.length && st.length <= 3 ? '; plant on a lower roof is reached from the storey beside it (not checked ?)' : ''} [script]` }; }

function highRow(G, opts) {
  const H = G.H || {}, st = Object.keys(G.S || {}).map(Number).sort((a, b) => a - b), title = 'High building trigger (3.2.6.1)';
  const hOf = s => (typeof H === 'object' && !Array.isArray(H) ? H[s] : Array.isArray(H) ? H[s - 1] : null);
  let z = 0; for (const s of st.slice(0, -1)) { const h = hOf(s); if (h == null) return { id: 'COV-high', title, status: '?', text: 'storey heights not in the plan [script]', src: SRC.high }; z += +h; }
  if (z > 36 + EPS) return { id: 'COV-high', title, status: 'fail', text: `top storey floor ${f1(z)} m above grade (over 36 m): Subsection 3.2.6 applies (smoke control, firefighter lift, central alarm); not designed here [script]`, src: SRC.high };
  if (z > 18 + EPS) { const load = opts && opts.loadAbove, w = opts && opts.exitStairW; const ratio = load && w ? load / (1.8 * w) : null;
    return { id: 'COV-high', title, status: ratio == null ? '?' : ratio > 300 ? 'fail' : 'pass', src: SRC.high, text: `top storey floor ${f1(z)} m above grade (over 18 m): 3.2.6 applies if the load above any storey over the first ÷ (1.8 × exit stair width) exceeds 300${ratio == null ? ' (load or stair width not passed: ?)' : ': ' + Math.round(ratio)}  [script]` }; }
  return { id: 'COV-high', title, status: 'pass', text: `top storey floor ${f1(z)} m above grade (18 m or less): 3.2.6 does not apply [script]`, src: SRC.high }; }

function genRow(G) {
  const gens = (G.PLANT || []).filter(i => /gen(erator)?\b|genset|\bKD\d/i.test((i.id || '') + ' ' + (i.n || ''))), title = 'Generators at grade: 1.2 m from lot lines, 3 m from doors in the building (3.6.1.5)';
  if (!gens.length) return { id: 'COV-gen', title, status: 'pass', text: 'no generator at grade [script]', src: SRC.gen };
  const P = G.LOTPOLY || [], out = []; let s = 'pass';
  for (const g of gens) { let dl = Infinity; for (let i = 0; i < P.length; i++) dl = Math.min(dl, rectSegD(g.r, P[i], P[(i + 1) % P.length]));
    let dd = Infinity; for (const d of (G.D || [])) if (d[1] === 'OUT' || d[2] === 'OUT') { const r = g.r, p = [d[3], d[4]]; dd = Math.min(dd, Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3]))); }
    const bl = dl < 1.2 - EPS, bd = dd < 3.0 - EPS; if (bl || bd) s = 'fail'; else if (dl < 1.7 || dd < 3.5) s = s === 'fail' ? s : 'tight';
    out.push(`${g.n || g.id}: ${isFinite(dl) ? f1(dl) : '?'} m to a lot line (1.2), ${isFinite(dd) ? f1(dd) : '-'} m to a door (3.0)${bl || bd ? ' FAIL' : ''}`); }
  return { id: 'COV-gen', title, status: s, text: out.join('; ') + ' [script; a generator set read as a fuel-fired appliance (our reading, (likely)); openings other than doors are not modelled]', src: SRC.gen }; }

function explRow(G) {
  const st = Object.keys(G.S || {}).map(Number).sort((a, b) => a - b), bad = [], title = 'Explosion-risk service rooms not under a required exit (3.6.2.2)'; let n = 0;
  for (let i = 0; i + 1 < st.length; i++) { const lo = (G.S[st[i]] || []).filter(isExpl), hi = (G.S[st[i + 1]] || []).filter(isExit); n += lo.length;
    for (const a of lo) for (const b of hi) { let A = 0; for (const r of a.r) for (const q of b.r) A += ovA(r, q); if (A > 0.5) bad.push(`${String(a.n).split(' (')[0]} (storey ${st[i]}) under ${String(b.n).split(' (')[0]} (${f1(A)} m²)`); } }
  return { id: 'COV-expl', title, status: bad.length ? 'fail' : 'pass', src: SRC.expl, text: bad.length ? bad.join('; ') + ' [script]' : `${n} MV, battery, UPS or heat-pump room(s) checked: none under a stair or exit passage on the storey above [script; which equipment counts is our reading of the article's examples]` }; }

function liftRow(G) {
  const st = Object.keys(G.S || {}), title = 'Stretcher lift (3.5.4.1); machine room (3.5.3.3)';
  const lifts = {}; for (const k of st) for (const x of G.S[k]) if (isLift(x)) (lifts[x.id] = lifts[x.id] || []).push({ st: +k, r: x.r[0] });
  const ids = Object.keys(lifts); if (!ids.length) return { id: 'COV-lift', title, status: 'pass', text: 'no lifts: 3.5.4 does not apply [script]', src: SRC.lift };
  const ok = id => { const r = lifts[id][0].r, a = r[1] - r[0] - 0.3, b = r[3] - r[2] - 0.3; return Math.max(a, b) >= 2.31 - EPS && Math.min(a, b) >= 1.2 - EPS; };
  const served = [...new Set(ids.flatMap(id => lifts[id].map(l => l.st)))], bad = served.filter(s => !ids.some(id => ok(id) && lifts[id].some(l => l.st === s)));
  return { id: 'COV-lift', title, status: bad.length ? 'fail' : 'pass', src: SRC.lift,
    text: `${ids.length} lift(s): ${ids.map(id => `${id} ${(lifts[id][0].r[1] - lifts[id][0].r[0]).toFixed(1)} × ${(lifts[id][0].r[3] - lifts[id][0].r[2]).toFixed(1)} m${ok(id) ? '' : ' (too small for a stretcher car)'}`).join(', ')}; ${bad.length ? 'storey(s) ' + bad.join(', ') + ' have no stretcher lift' : 'every storey served has a stretcher-size shaft'} (shaft clear ≥ 2.31 × 1.2 m: stretcher + 0.3 m, car not drawn, drawing assumption); machine-room-less lifts assumed: no machine room to separate (3.5.3.3) [script]` }; }

const SRC = {
  sep: 'NBC 2023 (AE) 3.1.2.1.(2), 3.1.3.1 and Table 3.1.3.1 (A-2/D 1 h, 2 h under note 4; A-2/F-2 2 h; D/F-2 none, note 8), 3.2.3.18, 3.5.3.1, 3.6.2.5, 3.6.3.1, read 17 Nov (COVERAGE_3.1, 3.2, 3.5, 3.6); suites ; VBBL [TODO: VBBL page]',
  ld12: 'NBC 2023 (AE) 3.2.3.5, 3.2.3.7 (COVERAGE_3.2 gap 3); VBBL (not yet checked)', roof: 'NBC 2023 (AE) 3.2.5.3, 3.6.4.7 (COVERAGE_3.2 gap 5, 3.6 gap 3)',
  high: 'NBC 2023 (AE) 3.2.6.1.(1)(a) (COVERAGE_3.2 gap 6)', gen: 'NBC 2023 (AE) 3.6.1.5 (COVERAGE_3.6 gap 1; our reading that a generator set is an appliance)',
  expl: 'NBC 2023 (AE) 3.6.2.2 (COVERAGE_3.6 gap 2)', lift: 'NBC 2023 (AE) 3.5.4.1.(1), 3.5.3.3 (COVERAGE_3.5 gaps 2-3); car size: drawing assumption' };
function covHubRows(G, cfg, opts) { opts = opts || {}; return [sepRow(G, opts), ld12Row(G), roofRow(G, opts), highRow(G, opts), genRow(G), explRow(G), liftRow(G)]; }
const api = { covHubRows, sepRow, ld12Row, roofRow, highRow, genRow, explRow, liftRow, occOf, neighbourLines, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchCOVhub = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['PLANT-door'] = (function (module) {
 
(function (root) {
'use strict';
const OUT = 0.9, EPS = 1e-6;
const SRC = 'project decision, 17 Nov 17:30 ( item 2): every plant room has an exterior door to ground of 0.9 m or more inside the lot; 0.9 m as exit-recess and EXIT-yard (project decision, 17k, 17o)';
function inPoly(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
const inR = (p, r) => p[0] > r[0] + EPS && p[0] < r[1] - EPS && p[1] > r[2] + EPS && p[1] < r[3] - EPS;
const isChem = x => /chlor|hypochlorite|acid|chemical/i.test((x.id || '') + ' ' + (x.n || ''));
const isOpen = x => /alcove|open to the street|pad\b|enclosure open|greenhouse|growing house|glasshouse|biome|propagation/i.test(x.n || '');    
const isPlantRoom = x => !isChem(x) && !isOpen(x) && (x.g === 'plant' || /\bmv\b|medium.voltage|switchgear|chiller room|pump room/i.test(x.n || ''));
function plantDoorRow(G) {
  const title = 'Plant rooms at grade: an exterior door onto ground inside the lot';
  const R1 = (G.S && G.S[1]) || [], rooms = R1.filter(isPlantRoom);
  if (!rooms.length) return { id: 'PLANT-door', title, status: 'pass', text: 'no plant room at grade [script]', src: SRC, rooms: [] };
  const P = G.LOTPOLY || null, blk = R1.flatMap(x => x.r).concat((G.PLANT || []).map(i => i.r).filter(Boolean)), out = []; let bad = 0;
  for (const x of rooms) {
    const doors = (G.D || []).filter(d => d[0] === 1 && ((d[1] === x.id && d[2] === 'OUT') || (d[2] === x.id && d[1] === 'OUT')));
    let ok = false, why = doors.length ? '' : 'no exterior door';
    for (const d of doors) { const c = [d[3], d[4]], nn = d[5] === 'v' ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
      const dir = nn.find(v => !x.r.some(r => inR([c[0] + v[0] * 0.3, c[1] + v[1] * 0.3], r))) || nn[0], land = [c[0] + dir[0] * OUT, c[1] + dir[1] * OUT];
      const inside = P ? inPoly(land, P) : null, free = !blk.some(r => inR(land, r));
      if (inside !== false && free) { ok = true; break; } why = inside === false ? 'its exterior door opens onto the lot line (landing outside the lot)' : 'its exterior door opens onto a room or plant (no open ground)'; }
    if (!ok) bad++; out.push(`${String(x.n || x.id).split(' (')[0]}: ${ok ? 'exterior door to open ground' : why}`); }
  return { id: 'PLANT-door', title, status: bad ? 'fail' : (G.LOTPOLY ? 'pass' : '?'), src: SRC, rooms: out,
    text: out.join('; ') + (G.LOTPOLY ? '' : ' (no lot outline: landing inside the lot not checked ?)') + ' [script]' }; }
const api = { plantDoorRow, isPlantRoom, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchPLANTdoor = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['EXIT-yard'] = (function (module) {
 
(function (root) {
'use strict';
const YARD = 0.9, EPS = 1e-6, f2 = x => (Math.round(x * 100) / 100).toFixed(2);
const SRC = 'project decision, 17 Nov 12:07 ( item 3): a door to a neighbour lot line needs 0.9 m of yard to count as an exit, and its leaf may not swing past the line; 0.9 m as exit-recess (, project decision)';
function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.05;
function inRects(p, R) { return R.some(r => p[0] > r[0] + EPS && p[0] < r[1] - EPS && p[1] > r[2] + EPS && p[1] < r[3] - EPS); }
 
function neighbourLines(G) { const P = G.LOTPOLY || [], E = G.STREET_EDGES || [], out = [];
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (near(a, b)) continue;
    const isStreet = E.some(e => (near(a, e[0]) && near(b, e[1])) || (near(a, e[1]) && near(b, e[0])) || (segDist(a, e[0], e[1]) < 0.05 && segDist(b, e[0], e[1]) < 0.05));
    if (!isStreet) out.push([a, b]); }
  return out; }
function exitYardRow(G) {
  const title = 'Exterior doors on a neighbour lot line: 0.9 m yard, leaf inside the lot';
  if (!G || !Array.isArray(G.LOTPOLY) || G.LOTPOLY.length < 3) return { id: 'EXIT-yard', title, status: '?', src: SRC, text: 'no lot outline in the plan: not checked [script]', doors: [] };
  const lines = neighbourLines(G), rooms = {}, doors = [];
  Object.keys(G.S || {}).forEach(k => (G.S[k] || []).forEach(x => { rooms[k + ':' + x.id] = x; }));
  for (const d of (G.D || [])) {
    if (!(d[1] === 'OUT' || d[2] === 'OUT')) continue;
    const id = d[1] === 'OUT' ? d[2] : d[1], x = rooms[d[0] + ':' + id]; if (!x) continue;
    const c = [d[3], d[4]], w = d[6] || G.DOOR_W || 0.9, leaf = w > 1.2 ? w / 2 : w;
    const n = d[5] === 'v' ? [[c[0] - 0.3, c[1]], [c[0] + 0.3, c[1]]] : [[c[0], c[1] - 0.3], [c[0], c[1] + 0.3]], o = n.find(p => !inRects(p, x.r)) || n[0];    
    const dir = [o[0] - c[0], o[1] - c[1]].map(v => v / 0.3);
    let best = null; for (const L of lines) { const dd = segDist(c, L[0], L[1]); const st = Math.max(0.05, Math.min(dd, 0.5)), ahead = dd < 0.05 || segDist([c[0] + dir[0] * st, c[1] + dir[1] * st], L[0], L[1]) <= dd - 0.7 * st;     if (ahead && (!best || dd < best.dd)) best = { dd }; }
    if (!best || best.dd >= YARD - EPS) continue;
    doors.push({ st: +d[0], room: id, name: x.n, yard: best.dd, leaf, status: best.dd < leaf - EPS ? 'fail' : 'tight' }); }
  if (!doors.length) return { id: 'EXIT-yard', title, status: 'pass', src: SRC, text: `no exterior door within 0.9 m of a neighbour lot line (${lines.length} neighbour line${lines.length === 1 ? '' : 's'} checked) [script]`, doors };
  const s = doors.some(x => x.status === 'fail') ? 'fail' : 'tight';
  const text = doors.map(x => `${String(x.name || x.room).split(' (')[0]} (storey ${x.st}): ${f2(x.yard)} m to the neighbour lot line, under 0.9 m: not an exit${x.status === 'fail' ? `; the ${f2(x.leaf)} m leaf swings past the line` : ' (the leaf stays inside the lot)'}`).join('; ');
  return { id: 'EXIT-yard', title, status: s, src: SRC, text: text + ' [script; doors taken to swing out, our reading]', doors }; }
const api = { exitYardRow, neighbourLines, YARD, SRC };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchEXITyard = api; }
})(typeof window !== 'undefined' ? window : null);

return module.exports; })({ exports: {} });
 
P['A12'] = (function (module) {
 
(function (root) {
'use strict';
function a12PassageRow(G, cfg, hc, opt = {}) {
  const C = (cfg && cfg.city) === 'edm' ? 'NBC 2023 (AE)' : 'VBBL 2025', src = `${C} 3.4.3.2.(1)(a), Table 3.4.3.2.-A, 3.4.4.1; DECISIONS 13 Nov (exit widths hard)`;
  const out = [], rank = { pass: 0, tight: 1, flag: 2, fail: 3 }; let worst = 'pass';
  let walk = []; try { const C5 = (typeof require === 'function') ? P['C5'] : root.BD.patchC5; const G2 = opt.fullLoad === false ? G : C5.fullLoadG(G).G;    
    walk = (G.WALK && G.WALK.length) ? hc.walkload(G2)[0] : []; } catch (e) { walk = []; }
  for (const st of Object.keys(G.S)) {
    const rooms = G.S[st];
    for (const x of rooms) {
      if (hc.kind(x, +st) !== 'exitpas') continue;
      const c = hc.clearSize(x, rooms, +st), LW = hc.localWidth(c.cells), w = LW.size ? Math.min(...LW.values()) : c.w;    
      const doorsIn = (G.D || []).filter(d => String(d[0]) === st && (d[1] === x.id || d[2] === x.id) && d[1] !== 'OUT' && d[2] !== 'OUT');
      const dmax = Math.max(0, ...doorsIn.map(d => d[6] || G.DOOR_W || 0.9));
      const wg = walk.find(g => g[1].includes(x.id)), people = wg ? wg[2] : 0;
      const need = Math.max(1.1, people * 0.0061);    
      const d = w - need; let s = d < -1e-9 ? 'fail' : (d < 0.5 - 1e-9 || d / need < 0.05) ? 'tight' : 'pass';
      if (s !== 'fail' && w < dmax - 1e-9) s = 'flag';    
      if (rank[s] > rank[worst]) worst = s;
      const nb = (G.D || []).filter(d => String(d[0]) === st && (d[1] === x.id || d[2] === x.id)).map(d => rooms.find(y => y.id === (d[1] === x.id ? d[2] : d[1]))).filter(Boolean);
      const rated2h = nb.some(y => ['pub', 'clin'].includes(y.g)) && nb.some(y => ['hall', 'sup', 'load'].includes(y.g) || y.stair && /data/i.test(y.n));    
      out.push(`storey ${st} ${x.id}: ${w.toFixed(2)} m clear (narrowest) against ${need.toFixed(2)} m (${people ? people + ' people × 6.1 mm, ' : ''}floor 1.1 m; widest door into it ${dmax.toFixed(1)} m${w < dmax - 1e-9 ? ': wider than the passage, flagged (our reading)' : ''}) ${s}; rating needed ${rated2h ? '2 h (on the hub / data-centre separation)' : '45 min'}`);
    }
  }
  if (!out.length) return { id: 'A12', title: 'Exit passages', status: 'n/a', text: 'no exit passage', src };
  return { id: 'A12', title: 'Exit passages', status: worst, text: out.join('; ') + ' [script]', src };
}
const api = { a12PassageRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchA12 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['B2'] = (function (module) {
 
(function (root) {
'use strict';
function sharedLen(A, B) { let L = 0;
  for (const a of A) for (const b of B) {
    if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(b[1] - a[0]) < 1e-6) L += Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
    if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(b[3] - a[2]) < 1e-6) L += Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])); }
  return L; }
function b2HallRow(G, cfg) {
  const src = 'project decision spec (secure line); VBBL 2025 / NBC 2023 (AE) Table 3.1.3.1; our reading that security governs';
  const bad = [];
  for (const st of Object.keys(G.S)) { const R = G.S[st], halls = R.filter(x => x.g === 'hall');
    const pubs = R.filter(x => ['pub', 'clin', 'circ'].includes(x.g) && !x.core && !x.stair && !/^pas/.test(x.id) && !/exit passage/i.test(x.n));
    for (const h of halls) for (const p of pubs) { const L = sharedLen(h.r, p.r); if (L > 0.3) bad.push(`storey ${st}: ${h.id} shares ${L.toFixed(1)} m of wall with ${p.id} (${p.n.slice(0, 40)})`); } }
  return { id: 'B2', title: 'Data hall not beside public rooms', status: bad.length ? 'fail' : 'pass', text: (bad.length ? bad.join('; ') : 'no data hall shares more than 0.3 m of wall with a public room') + ' [script]', src };
}
const api = { b2HallRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchB2 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['C7'] = (function (module) {
 
(function (root) {
'use strict';
const RX_U = /universal (wc|washroom)|clinic universal/i, RX_S = /universal shower/i, RX_WC = /\bwcs?\b|washroom|toilet/i;
function c7UniversalRow(G, cfg, hc) {
  const src = 'VBBL 2025 / NBC 2023 (AE) 3.8.3.13, 3.8.3.17, 3.8.3.6.(2), 3.8.2.8.(1) (read in both, 16 Nov); DECISIONS 15 Nov 18:40, 18:55';
  const parts = [], fails = []; let tight = false;
  for (const st of Object.keys(G.S)) { const R = G.S[st];
    for (const x of R) { const isU = RX_U.test(x.n), isS = RX_S.test(x.n); if (!isU && !isS) continue;
      const c = hc.clearSize(x, R, +st), A = c.A, w = Math.min(c.bigW || c.w, c.w), [mw, ma] = isU ? [1.7, 5.4] : [1.5, 2.7];
      const doors = (G.D || []).filter(d => String(d[0]) === st && (d[1] === x.id || d[2] === x.id)), dw = Math.max(0, ...doors.map(d => d[6] || G.DOOR_W || 0.9));
      const p = `${x.id} ${w.toFixed(2)} m / ${A.toFixed(1)} m² clear (≥ ${mw} / ${ma}), door ${dw.toFixed(2)} m (≥ 0.85)`; parts.push(p);
      if (w < mw - 1e-6 || A < ma - 1e-6 || dw < 0.85 - 1e-6) fails.push(p); else if (w < mw * 1.05 || A < ma * 1.05) tight = true; }
    for (const g of ['pub', 'clin']) { const wcs = R.filter(x => x.g === g && RX_WC.test(x.n) && !/staff/i.test(x.n)); if (!wcs.length) continue;
      if (!wcs.some(x => RX_U.test(x.n))) fails.push(`storey ${st} ${g === 'pub' ? 'hub' : 'clinic'} washrooms without a universal washroom (3.8.2.8.(1))`); } }
  if (!parts.length && !fails.length) return { id: 'C7', title: 'Universal rooms', status: 'n/a', text: 'no universal room and no public washroom', src };
  return { id: 'C7', title: 'Universal rooms', status: fails.length ? 'fail' : tight ? 'tight' : 'pass', text: parts.join('; ') + (fails.length ? ' · FAILS: ' + fails.join('; ') : '') + ' [script]', src };
}
const api = { c7UniversalRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC7 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['C8'] = (function (module) {
 
(function (root) {
'use strict';
const CIRC = new Set(['lobby', 'pcor', 'ccor', 'scor', 'pcore', 'score', 'exitpas', 'bay', 'dock', 'entry', 'shaft', 'plant', 'hall']);
function c8TwoDoorRow(G, cfg, hc) {
  const src = 'project decision, 15 Nov 20:54, 22:26;  item 4 (two_door field); T-reach R2 (public and secure never share a door)';
  const ok = [], flags = [], fails = [];
  for (const st of Object.keys(G.S)) { const R = G.S[st], byId = Object.fromEntries(R.map(x => [x.id, x]));
    for (const x of R) { const k = hc.kind(x, +st); if (CIRC.has(k)) continue;
      const others = [...new Set((G.D || []).filter(d => String(d[0]) === st && (d[1] === x.id || d[2] === x.id)).map(d => d[1] === x.id ? d[2] : d[1]).filter(o => o !== 'OUT' && o !== 'YARD' && byId[o]))];
      if (others.length < 2) continue;
      const lines = new Set(others.map(o => hc.LINE[hc.kind(byId[o], +st)]).filter(Boolean));
      const lab = `${x.id} (${x.n.slice(0, 40)}) doors to ${others.join(', ')}`;
      if (lines.has('P') && lines.has('S')) fails.push(lab + ': joins the public and secure lines');
      else if (x.two_door) ok.push(lab + ' (two_door)');
        } }
  if (!ok.length && !flags.length && !fails.length) return { id: 'C8', title: 'Two-door rooms', status: 'n/a', text: 'no room with doors to two other rooms', src };
  return { id: 'C8', title: 'Two-door rooms', status: fails.length ? 'fail' : flags.length ? 'flag' : 'pass', text: [ok.length ? 'set by the builder: ' + ok.join('; ') : '', flags.length ? 'unmarked: ' + flags.join('; ') : '', fails.length ? 'FAILS: ' + fails.join('; ') : ''].filter(Boolean).join(' · ') + ' [script]', src };
}
const api = { c8TwoDoorRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC8 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['C9'] = (function (module) {
 
(function (root) {
'use strict';
const RX = /unassigned|leftover|no use yet/i, DC = new Set(['hall', 'sup', 'plant', 'load']), HUB = new Set(['pub', 'clin', 'circ']);
function sharedLen(A, B) { let L = 0; for (const a of A) for (const b of B) {
  if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(b[1] - a[0]) < 1e-6) L += Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
  if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(b[3] - a[2]) < 1e-6) L += Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])); } return L; }
function c9LeftoverRow(G, cfg, hc) {
  const src = 'project decision, 15 Nov 20:52 (data-centre storage), 22:01 (footprint rule); eh/dcstore.py (MINW 2.4 m); our reading at grade';
  const left = [], parts = [];
  for (const st of Object.keys(G.S)) { const R = G.S[st], byId = Object.fromEntries(R.map(x => [x.id, x]));
    for (const x of R) { if (!(x.g === 'spare' || RX.test(x.n.split('(')[0]) || (RX.test(x.n) && !(hc && ['pcor', 'ccor', 'scor', 'lobby', 'exitpas'].includes(hc.kind(x, +st)))))) continue;
      const nb = [...new Set((G.D || []).filter(d => String(d[0]) === st && (d[1] === x.id || d[2] === x.id)).map(d => d[1] === x.id ? d[2] : d[1]).filter(o => byId[o]))].map(o => byId[o]);
      const cand = nb.length ? nb : R.filter(y => y !== x).map(y => [y, sharedLen(x.r, y.r)]).filter(([, L]) => L > 0.3).sort((a, b) => b[1] - a[1]).map(([y]) => y);
      const w = hc ? hc.clearSize(x, R, +st).w : Math.min(...x.r.map(r => Math.min(r[1] - r[0], r[3] - r[2])));
      const dc = cand.some(y => DC.has(y.g) || y.core && !HUB.has(y.g)), hub = cand.some(y => HUB.has(y.g) && !y.core);
      let name;
      if (w < 2.4 - 1e-6 && cand.length) name = `joins ${cand[0].id} (${w.toFixed(2)} m wide < 2.4)`;
      else if (+st >= 2 && dc && !hub) name = 'Data-centre storage (in the data-centre area), group sup';
      else if (dc && hub) { name = 'stays spare: touches both the hub and the data centre (flag)'; left.push(x.id); }
      else if (hub) name = 'Hub storage';
      else if (dc) name = 'Data-centre storage';
      else { name = 'no neighbour found (?)'; left.push(x.id); }
      parts.push(`storey ${st} ${x.id} (${x.n.slice(0, 40)}): ${name}`); } }
  if (!parts.length) return { id: 'C9', title: 'Leftover floor', status: 'pass', text: 'no leftover floor', src };
  return { id: 'C9', title: 'Leftover floor', status: 'flag', text: parts.join('; ') + ' · leftover floor still on the plan: the engine should apply these names [script]', src, left };
}
const api = { c9LeftoverRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchC9 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['D1'] = (function (module) {
 
(function (root) {
'use strict';
function d1BaysRow(G, cfg, opt = {}) {
  const edm = (cfg && cfg.city) === 'edm', W = edm ? 3.3 : 3.4, L = edm ? 9.0 : 10.2, CL = 1.3;
  const src = edm ? 'Zoning Bylaw 20001 s. 5.80 (9.0 × 3.3 m); side clearance 1.3 m: the Vancouver figure as a stand-in' : 'Parking By-law 5.5.1.2, 5.4.1; Design Supplement Feb 2024 Fig. 5;  item 1 (1.3 m side clearance, two bays may share)';
  const S1 = G.S['1'] || G.S[1] || [], bays = S1.filter(x => x.g === 'load' && /^b\d+$/.test(x.id));
  if (!bays.length) return { id: 'D1', title: 'Loading bays: size and side clearance', status: 'n/a', text: 'no loading bay drawn', src };
  const R = x => x.r[0], long = r => (r[1] - r[0]) >= (r[3] - r[2]) ? 'u' : 'v';
  const blocks = S1.filter(x => !(x.g === 'load' && /^b\d+$/.test(x.id)) && !/aisle|apron|court|drive/i.test(x.n)).flatMap(x => x.r).concat((G.PLANT || []).map(p => Array.isArray(p.r[0]) ? p.r[0] : p.r));
  const free = (s) => !bays.some(b => { const q = R(b); return q[0] < s[1] - 1e-6 && s[0] < q[1] - 1e-6 && q[2] < s[3] - 1e-6 && s[2] < q[3] - 1e-6; }) && !blocks.some(q => q[0] < s[1] - 1e-6 && s[0] < q[1] - 1e-6 && q[2] < s[3] - 1e-6 && s[2] < q[3] - 1e-6);
  const parts = [], fails = []; let tight = false;
  const strips = new Map();    
  for (const b of bays) {
    const r = R(b), w = Math.min(r[1] - r[0], r[3] - r[2]), l = Math.max(r[1] - r[0], r[3] - r[2]);
    if (w < W - 1e-6 || l < L - 1e-6) fails.push(`${b.id} ${w.toFixed(2)} × ${l.toFixed(2)} m under ${W} × ${L}`); else if (l < L + 0.5 - 1e-9 && w < W + 0.5 - 1e-9) tight = true;
    const sides = long(r) === 'u' ? [[r[0], r[1], r[2] - CL, r[2]], [r[0], r[1], r[3], r[3] + CL]] : [[r[0] - CL, r[0], r[2], r[3]], [r[1], r[1] + CL, r[2], r[3]]];
    const ok = sides.filter(free);
    if (!ok.length) fails.push(`${b.id}: no ${CL} m clear strip on either long side`);
    else { const k = ok.map(s => s.map(v => v.toFixed(2)).join(',')); k.forEach(kk => { if (!strips.has(kk)) strips.set(kk, []); strips.get(kk).push(b.id); }); }
    parts.push(`${b.id} ${w.toFixed(1)} × ${l.toFixed(1)} m${ok.length ? `, ${CL} m strip on ${ok.length} side(s)` : ', no side strip'}`);
  }
  for (const [k, ids] of strips) if (ids.length > 2) fails.push(`strip ${k} shared by ${ids.length} bays (two at most)`);
  const status = fails.length ? 'fail' : tight ? 'tight' : 'pass';
  return { id: 'D1', title: 'Loading bays: size and side clearance', status, text: parts.join('; ') + (fails.length ? ' · FAILS: ' + fails.join('; ') : '') + ' [script]', src };
}
const api = { d1BaysRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchD1 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['D2'] = (function (module) {
 
(function (root) {
'use strict';
function inPoly(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (((yi > p[1]) !== (yj > p[1])) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function segD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function inLot(p, P) { if (!P) return true; if (inPoly(p, P)) return true; let m = Infinity; for (let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, segD(p, P[j], P[i])); return m <= 0.05; }
const rr = p => Array.isArray(p.r[0]) ? p.r[0] : p.r;
function backin(G) {
  const S1 = G.S['1'] || G.S[1] || [], lot = G.LOTPOLY;
  const solid = S1.filter(x => x.g !== 'load').flatMap(x => x.r).concat((G.PLANT || []).map(rr));
  const inSolid = q => solid.some(r => r[0] < q[0] && q[0] < r[1] && r[2] < q[1] && q[1] < r[3]);
  const out = [];
  for (const x of S1) {
    if (x.g !== 'load' || !x.n.toLowerCase().startsWith('loading space')) continue;
    const r = x.r.reduce((m, q) => (q[1] - q[0]) * (q[3] - q[2]) > (m[1] - m[0]) * (m[3] - m[2]) ? q : m, x.r[0]), lu = (r[1] - r[0]) >= (r[3] - r[2]);
    let best = null;
    for (const [e, sg] of (lu ? [[r[0], -1], [r[1], 1]] : [[r[2], -1], [r[3], 1]])) {
      const pts = lu ? [[e, r[2] + 0.2], [e, (r[2] + r[3]) / 2], [e, r[3] - 0.2]] : [[r[0] + 0.2, e], [(r[0] + r[1]) / 2, e], [r[1] - 0.2, e]];
      const ds = pts.map(([u, v]) => { let d = 0; while (d < 40) { const q = lu ? [u + sg * (d + 0.1), v] : [u, v + sg * (d + 0.1)]; if (!inLot(q, lot) || inSolid(q)) break; d += 0.1; } return d; });
      const dd = Math.min(...ds), [u0, v0] = pts[1], q = lu ? [u0 + sg * (dd + 0.2), v0] : [u0, v0 + sg * (dd + 0.2)];
      const lane = !inLot(q, lot) && (G.STREET_EDGES || []).some(([a, b]) => segD(q, a, b) < 0.6);
      if (!best || dd > best.d) best = { id: x.id, d: Math.round(dd * 10) / 10, lane };
    }
    out.push(best);
  }
  return out;
}
function d2TruckRow(G, cfg) {
  const src = 'Vancouver Parking By-law 5.4.1 (6.1 m aisle); Design Supplement Feb 2024 Fig. 5 (columns 3.3 m, reverse ≤ 10 m); DECISIONS 16 Nov 09:20; Edmonton: the Vancouver figures as stand-ins';
  const B = backin(G); if (!B.length) return { id: 'D2', title: 'Truck rows', status: 'n/a', text: 'no loading space drawn', src };
  const rank = { pass: 0, tight: 1, '?': 2, fail: 3 }; let worst = 'pass'; const up = s => { if (rank[s] > rank[worst]) worst = s; };
  const parts = [];
  for (const b of B) {
    let s = b.d < 6.1 - 1e-9 ? (b.lane ? '?' : 'fail') : b.d < 6.6 - 1e-9 ? 'tight' : 'pass'; up(s);
    parts.push(`${b.id} ${b.d.toFixed(1)} m${b.lane ? ' on site, then the street or lane (width not read ?)' : ''}` + (b.lane ? `; reverse ${b.d.toFixed(1)} m (≤ 10)` : ''));
    if (b.lane && b.d > 10 + 1e-9) { up('fail'); parts.push(`${b.id} reverse over 10 m`); }
  }
  const aisle = ['AISLE', 'COURT', 'APRON', 'DRIVE', 'YARD_AISLE'].map(k => G[k]).filter(Boolean).flatMap(v => Array.isArray(v[0]) ? v : [v]).filter(v => v.length === 4 && v.every(n => typeof n === 'number'));
  const cols = (G.OPEN_BELOW && G.OPEN_BELOW.columns) || [];
  if (!cols.length && G.OPEN_BELOW && G.OPEN_BELOW.auto) parts.push('columns placed automatically on the open ground\'s edges (a drawing placeholder, eh/trucks.auto_columns): setback from the aisle not judged (?)');
  if (cols.length && aisle.length) {
    const dmin = Math.min(...cols.map(([u, v]) => Math.min(...aisle.map(r => Math.hypot(Math.max(r[0] - u, 0, u - r[1]), Math.max(r[2] - v, 0, v - r[3]))))));
    const s = dmin < 3.3 - 1e-9 ? 'fail' : dmin < 3.8 - 1e-9 ? 'tight' : 'pass'; up(s);
    parts.push(`nearest column ${dmin.toFixed(1)} m from the truck aisle (≥ 3.3)`);
  } else if (cols.length) parts.push('columns drawn, truck aisle not declared: column setback not measured (?)');
  parts.push('reverse along an on-site court and SU-9 turning: not measured (?)');
  return { id: 'D2', title: 'Truck rows', status: worst, text: parts.join('; ') + ' [script]', src };
}
const api = { d2TruckRow, backin };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchD2 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['D4'] = (function (module) {
 
(function (root) {
'use strict';
function d4YardGateRow(G, cfg, hc) {
  const src = 'spec rule 6; Q24 (project decision, 9 Nov); eh/yardgate.py v7;  item 2 (vehicle gate ≥ 6.1 m, our reading)';
  let Y = null; try { Y = hc.yards(G); } catch (e) { return { id: 'D4', title: 'Plant-yard doors and gates', status: '?', text: e.message, src }; }
  if (!Y || !Y.length) return { id: 'D4', title: 'Plant-yard doors and gates', status: 'pass', text: 'no plant yard on this fit (PLANT_YARDS empty) [script]', src };
  const yg = hc.yardgate(G), rank = { pass: 0, tight: 1, fail: 2 }; let worst = 'pass'; const up = s => { if (rank[s] > rank[worst]) worst = s; };
  const all = yg.doors.map(d => ['door ' + d.door[0], d]).concat(yg.gates.map(g => ['gate (' + g.gate.join(', ') + ')', g]), (yg.vgates || []).map(v => ['truck route ' + v.route, v]));
  all.forEach(([, x]) => up(x.status));
  const parts = all.map(([k, x]) => `${k} ${x.status}` + (x.why && x.status !== 'pass' ? ` (${x.why})` : ''));
   
  const segs = (G.VGATES || []).map(([a, b]) => ({ a, b, w: Math.hypot(b[0] - a[0], b[1] - a[1]) })), grp = [];
  for (const s of segs) { const sd = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
    const g = grp.find(G2 => G2.some(t => [s.a, s.b].some(p => sd(p, t.a, t.b) < 0.6) || [t.a, t.b].some(p => sd(p, s.a, s.b) < 0.6))); if (g) g.push(s); else grp.push([s]); }
  for (const g of grp) { const w = Math.max(...g.map(s => s.w)) + g.filter(s => s !== g.reduce((m, t) => t.w > m.w ? t : m, g[0])).reduce((x, s) => x + (s.w > 1 ? s.w : 0), 0);     const s = w < 6.1 - 1e-6 ? 'fail' : w < 6.6 - 1e-9 ? 'tight' : 'pass'; up(s); parts.push(`vehicle gate ${w.toFixed(1)} m (≥ 6.1) ${s}`); }
  return { id: 'D4', title: 'Plant-yard doors and gates', status: worst, text: `${Y.length} plant yard(s), ${yg.gates.length} gate(s), ${yg.doors.length} door(s) into the yard: ` + parts.join('; ') + ' [script]', src };
}
const api = { d4YardGateRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchD4 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['D5'] = (function (module) {
 
(function (root) {
'use strict';
const isR = t => t.length === 4 && t.every(v => typeof v === 'number');
function inPoly(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (((yi > p[1]) !== (yj > p[1])) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
const inShape = (p, t) => isR(t) ? (t[0] <= p[0] && p[0] <= t[1] && t[2] <= p[1] && p[1] <= t[3]) : inPoly(p, t);
const inR = (p, r) => r[0] <= p[0] && p[0] <= r[1] && r[2] <= p[1] && p[1] <= r[3];
function truckShapes(G) { const t = ['DRIVE', 'APRON', 'AISLE', 'COURT', 'YARD_AISLE'].map(k => G[k]).filter(Boolean); return t.concat(Object.values(G.TRUCK_ROUTES || {}).filter(Boolean)); }
function overhang(G) {
  const S = G.S, sts = Object.keys(S).map(Number), s1 = S['1'] || [], line = s1.flatMap(x => x.r).concat(G.COVERED || []);
  (G.ALCOVES || []).forEach(([st, rid, [u, v], [nu, nv]]) => line.push(Math.abs(u - nu) < 1e-6 ? [u - 0.75, u + 0.75, Math.min(v, nv), Math.max(v, nv)] : [Math.min(u, nu), Math.max(u, nu), v - 0.75, v + 0.75]));
  const up = sts.filter(s => s > 1).flatMap(s => S[s].flatMap(x => x.r)); if (!up.length) return { area: 0, over: 0 };
  const trk = truckShapes(G), g = 0.05;
  const u0 = Math.min(...up.map(r => r[0])), u1 = Math.max(...up.map(r => r[1])), v0 = Math.min(...up.map(r => r[2])), v1 = Math.max(...up.map(r => r[3]));
  const nu = Math.ceil((u1 - u0) / g), nv = Math.ceil((v1 - v0) / g), bad = new Uint8Array(nu * nv), tk = new Uint8Array(nu * nv);
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const p = [u0 + (i + 0.5) * g, v0 + (j + 0.5) * g];
    if (!up.some(r => inR(p, r))) continue; const t = trk.some(s => inShape(p, s)); if (!line.some(r => inR(p, r)) || t) { bad[i * nv + j] = 1; tk[i * nv + j] = t ? 1 : 0; } }
   
  const K = 3, er = new Uint8Array(nu * nv);    
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { let ok = bad[i * nv + j]; for (let a = -K; ok && a <= K; a++) for (let b = -K; ok && b <= K; b++) { const x = i + a, y = j + b; if (x < 0 || y < 0 || x >= nu || y >= nv || !bad[x * nv + y]) ok = 0; } er[i * nv + j] = ok; }
  let area = 0, over = 0;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { if (!bad[i * nv + j]) continue; let k = 0; for (let a = -K; !k && a <= K; a++) for (let b = -K; !k && b <= K; b++) { const x = i + a, y = j + b; if (x >= 0 && y >= 0 && x < nu && y < nv && er[x * nv + y]) k = 1; } if (k) { area += g * g; if (tk[i * nv + j]) over += g * g; } }
  return { area, over };
}
function d5TruckGroundRow(G, cfg) {
  const src = 'project decision, 12 Nov (EH-FREEZE-2026-11-11e, building line, nothing over truck ground); project decision, 10 Nov (trucks and generator yards); eh/rules11e.py';
  const rank = { pass: 0, flag: 1, fail: 2 }; let worst = 'pass'; const up = s => { if (rank[s] > rank[worst]) worst = s; }, parts = [];
  const o = overhang(G);
  if (o.area >= 0.5) { up('fail'); parts.push(`${o.area.toFixed(0)} m² of upper floor beyond the storey-1 line or over truck ground${o.over >= 0.5 ? ` (${o.over.toFixed(0)} m² over truck ground)` : ''}`); }
  else parts.push('upper floors within the storey-1 line, none over truck ground (slivers under 0.3 m: tolerance)');
  const gens = (G.PLANT || []).filter(p => p.id[0] === 'g' || /enerator/.test(p.n)).map(p => Array.isArray(p.r[0]) ? p.r[0] : p.r);
  const yards = (G.PLANT_YARDS || []).filter(y => gens.some(r => inShape([(r[0] + r[1]) / 2, (r[2] + r[3]) / 2], y)));
  const routes = ['DRIVE', 'APRON', 'AISLE', 'COURT'].map(k => [k, G[k]]).filter(([, v]) => v).concat(Object.entries(G.TRUCK_ROUTES || {}));
  const hits = [];
  for (const y of yards) for (const [k, t] of routes) { const R = isR(t) ? t : null; if (!R) continue;
    let n = 0; for (let u = R[0] + 0.25; u < R[1]; u += 0.5) for (let v = R[2] + 0.25; v < R[3]; v += 0.5) if (inShape([u, v], y)) n++;
    if (n * 0.25 > 1.0) hits.push(k); }
  if (hits.length) { up('fail'); parts.push(`truck route ${[...new Set(hits)].join(', ')} runs into a generator yard`); }
  else if (G.YARD_AISLE && (G.VGATES || []).length) parts.push('trucks enter the generator yard only on the declared yard aisle through a vehicle gate');
  else parts.push(yards.length ? 'no truck route into a generator yard' : 'no generator yard');
  const S1 = G.S['1'] || [], D = (G.D || []).filter(d => String(d[0]) === '1');
  const loads = S1.filter(x => x.g === 'load' || /\bdock\b/i.test(x.n)).flatMap(x => x.r);
  for (const st of Object.keys(G.S)) for (const x of G.S[st]) { if (!/garbage|recycl/i.test(x.n)) continue;
    const outs = (G.D || []).filter(d => String(d[0]) === st && (d[1] === x.id || d[2] === x.id) && (d[1] === 'OUT' || d[2] === 'OUT'));
    if (!outs.length) { if (st !== '1' || !D.some(d => (d[1] === x.id || d[2] === x.id) && S1.some(y => y.id === (d[1] === x.id ? d[2] : d[1]) && (y.g === 'load' || /\bdock\b/i.test(y.n))))) { up('flag'); parts.push(`${x.id} on storey ${st} has no outside door${st !== '1' ? ' (bins ride the freight lift to the dock)' : ''}: flag (our reading)`); } continue; }
    for (const d of outs) { const p = [d[3], d[4]];
      if ((G.WALK || []).some(w => Math.abs(p[0] - Math.max(w[0], Math.min(p[0], w[1]))) + Math.abs(p[1] - Math.max(w[2], Math.min(p[1], w[3]))) < 0.6)) { up('fail'); parts.push(`${x.id} door opens onto a public walkway`); continue; }
      const dist = loads.length ? Math.min(...loads.map(r => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3])))) : Infinity;
      if (dist > 15) { up('flag'); parts.push(`${x.id} door ${isFinite(dist) ? dist.toFixed(1) + ' m' : 'far'} from any loading room (> 15 m, our reading)`); } else parts.push(`${x.id} door ${dist.toFixed(1)} m from the loading area`); } }
  return { id: 'D5', title: 'Truck ground: overhang, generator yards, garbage', status: worst, text: parts.join('; ') + ' [script]', src };
}
const api = { d5TruckGroundRow, overhang };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchD5 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['D6'] = (function (module) {
 
(function (root) {
'use strict';
const WB20 = 23.0;
function segD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function d6DriveRow(G, cfg, opt = {}) {
  const src = 'City of Edmonton Access Management Guidelines COE-IM-GUIDE-0023 v03 (21 Dec 2023) 5.3.8 Table 5.6, 5.5 Table 5.10, 5.6 (guideline; read by cascade 16 Nov)';
  if ((cfg && cfg.city) !== 'edm') return { id: 'D6', title: 'Truck drives (Edmonton access guideline)', status: 'n/a', text: 'Vancouver', src };
  const SE = G.STREET_EDGES || [], one = G.ONE_WAY_DRIVES || [];
  const drives = (G.YARD_DRIVES || []).concat(G.DRIVE ? [G.DRIVE] : [], G.APRON ? [G.APRON] : []);    
  if (!drives.length) return { id: 'D6', title: 'Truck drives (Edmonton access guideline)', status: 'n/a', text: 'no truck drive drawn', src };
  const parts = [], rank = { pass: 0, '?': 1, flag: 2 }; let worst = 'pass';
  const up = s => { if (rank[s] > rank[worst]) worst = s; };
   
  const corners = [];
  for (let i = 0; i < SE.length; i++) for (let j = i + 1; j < SE.length; j++) for (const p of [SE[i][0], SE[i][1]]) for (const q of [SE[j][0], SE[j][1]]) {
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5) continue;
    const a = [SE[i][1][0] - SE[i][0][0], SE[i][1][1] - SE[i][0][1]], b = [SE[j][1][0] - SE[j][0][0], SE[j][1][1] - SE[j][0][1]];
    const cos = Math.abs(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b) || 1); if (cos < 0.5) corners.push({ p, i, j });
  }
   
  const len = e => Math.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]), touch = (e, f) => [e[0], e[1]].some(p => [f[0], f[1]].some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5));
  SE.forEach((c, k) => { if (len(c) >= 15) return; const nb = SE.map((e, i) => i).filter(i => i !== k && touch(SE[i], c) && len(SE[i]) >= 15);
    for (let x = 0; x < nb.length; x++) for (let y = x + 1; y < nb.length; y++) { const a = SE[nb[x]], b = SE[nb[y]], u = [a[1][0] - a[0][0], a[1][1] - a[0][1]], v = [b[1][0] - b[0][0], b[1][1] - b[0][1]];
      if (Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v)) < 0.5) corners.push({ p: [(c[0][0] + c[1][0]) / 2, (c[0][1] + c[1][1]) / 2], i: nb[x], j: nb[y] }); } });
  for (const r of drives) {
    const sides = [[[r[0], r[2]], [r[1], r[2]]], [[r[0], r[3]], [r[1], r[3]]], [[r[0], r[2]], [r[0], r[3]]], [[r[1], r[2]], [r[1], r[3]]]];
    const onStreet = sides.map(([a, b]) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const k = SE.findIndex(([p, q]) => segD(m, p, q) < 0.6); return { a, b, m, k, w: Math.hypot(b[0] - a[0], b[1] - a[1]) }; }).filter(s => s.k >= 0);
    if (!onStreet.length) { parts.push(`drive (${r.join(', ')}): doesn't meet a drawn street edge (?)`); up('?'); continue; }
    const mouth = onStreet[0], isOne = one.some(o => o.every((v, i) => Math.abs(v - r[i]) < 0.01));
    const need = isOne ? 5.0 : 11.5, okW = mouth.w >= need - 1e-9;
    parts.push(`drive mouth ${mouth.w.toFixed(1)} m at the property line (${isOne ? 'one-way 5.0 m' : 'two-way large trucks 11.5-13.5 m'}): ${okW ? 'meets' : 'under: widen the mouth or show a swept path (guideline, 5.5)'}`);
    if (!okW) up('flag');
    const cs = corners.filter(c => c.i === mouth.k || c.j === mouth.k);
    if (cs.length) for (const c of cs) {
      const cross = c.i === mouth.k ? c.j : c.i, name = (opt.edgeNames || {})[cross], cls = name ? (opt.roadClass || {})[name] : undefined;
      const d = Math.hypot(mouth.m[0] - c.p[0], mouth.m[1] - c.p[1]);
      const lim = cls === 'Arterial' ? 40 : cls === 'Collector' ? 30 : cls === 'Local' ? 20 : null;
      if (lim === null) { parts.push(`${d.toFixed(1)} m from the corner with ${name || 'the crossing street'} (road class not known: limit 40, 30 or 20 m) ?`); up('?'); }
      else { parts.push(`${d.toFixed(1)} m from the corner with ${name} (${cls}: ≥ ${lim} m) ${d >= lim ? 'meets' : 'under (guideline, Table 5.6)'}`); if (d < lim) up('flag'); }
    } else { parts.push('not a corner mouth: distance to the nearest intersection off the lot not measured (?)'); up('?'); }
     
    const vg = (G.VGATES || []).filter(([p, q]) => [p, q].every(pt => pt[0] >= r[0] - 0.2 && pt[0] <= r[1] + 0.2 && pt[1] >= r[2] - 0.2 && pt[1] <= r[3] + 0.2));
    for (const [p, q] of vg) { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = segD(m, SE[mouth.k][0], SE[mouth.k][1]);
      parts.push(`vehicle gate ${d.toFixed(1)} m from the street edge (one WB-20 truck, about ${WB20} m, queues on site: our figure) ${d >= WB20 ? 'meets' : 'under (guideline, 5.6)'}`); if (d < WB20) up('flag'); }
  }
  return { id: 'D6', title: 'Truck drives (Edmonton access guideline)', status: worst, text: parts.join('; ') + ' [script]', src };
}
const api = { d6DriveRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchD6 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['D7'] = (function (module) {
 
(function (root) {
'use strict';
function d7FuelFillRow(G, cfg, hc) {
  const src = 'project decision, 10 Nov; eh/fuelfill.py; hose and pipe limits not sourced (NFC (AE), CSA C282 7.3 not read)';
  const gens = (G.PLANT || []).some(p => p.id[0] === 'g' || /enerator/.test(p.n)) || Object.values(G.S).flat().some(x => x.id === 'gen' || /^generator/i.test(x.n));
  if (!gens) return { id: 'D7', title: 'Fuel fill (generators)', status: 'n/a', text: 'no generator', src };
  const ff = hc.fuelFill(G);
  if (!ff) return { id: 'D7', title: 'Fuel fill (generators)', status: '?', text: 'fuel filling not drawn', src };
  let [st, txt] = ff;
  if (/inside the yard/.test(txt) && !/route|aisle|gate/i.test(txt)) { st = 'fail'; txt += ' · the truck would enter the generator yard with no declared route (D5 rule 2)'; }
  return { id: 'D7', title: 'Fuel fill (generators)', status: st, text: txt + ' [script]', src };
}
const api = { d7FuelFillRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchD7 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['E4'] = (function (module) {
 
(function (root) {
'use strict';
function e4HubSetRow(G, cfg, hc, m) {
  const M = m || G.m, r = hc.hubsetRow(G, cfg, M), hs = M && M.hub_set;
  let st = r[0], text = r[3];
  if (hs && hs.load > 0.9 + 1e-9 && st === 'pass') { st = 'tight'; text += ` · tight: ${Math.round(hs.load * 100)} % of the set's standby rating (over 90 %, our reading: no headroom for fans and space heat)`; }
  return { id: 'E4', title: r[1], status: st, text, src: r[2] + '; 90 % headroom: our reading (ENGINE_SPEC_E4)' };
}
const api = { e4HubSetRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchE4 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['E8'] = (function (module) {
 
(function (root) {
'use strict';
const AFC = { L: 12.141, W: 2.362, H: 2.896, lp1: 83.0 };
function chillerLw() { const a = AFC.L / 2 + 1, b = AFC.W / 2 + 1, c = AFC.H + 1, S = 4 * (a * b + b * c + c * a); return [AFC.lp1 + 10 * Math.log10(S), S]; }
function segRectD(r, a, b) {   const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.1)); let m = Infinity;
  for (let i = 0; i <= n; i++) { const p = [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]; m = Math.min(m, Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3]))); } return m; }
function e8ChillerNoiseRow(G, cfg, opt = {}) {
  const van = (cfg && cfg.city) === 'van', src = (van ? 'By-law 6555 s. 2.3(b)' : 'Bylaw 14600 ss. 19-22') + '; Vertiv SL-71060 (FIZ135, maker claim); project decision, 13 Nov (flag)';
  const rr = p => Array.isArray(p.r[0]) ? p.r[0] : p.r;
  const units = (G.PLANT || []).filter(p => p.id.startsWith('c')).map(p => ['c' + p.id.slice(1), rr(p)]).concat((G.CHILL || []).map((r, i) => [`c${i + 1}`, r]));
  if (!units.length) return { id: 'E8', title: 'Chiller noise', status: 'pass', text: 'no chillers drawn', src };
  const [Lw, S] = chillerLw(), P = G.LOTPOLY, SE = G.STREET_EDGES || [], lim = van ? 65 : 60;
  const ring = P.map((p, i) => [p, P[(i + 1) % P.length]]);
  const near = (e, f) => [e[0], e[1]].every(p => { const dx = f[1][0] - f[0][0], dy = f[1][1] - f[0][1], L = dx * dx + dy * dy; let t = L ? ((p[0] - f[0][0]) * dx + (p[1] - f[0][1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - f[0][0] - t * dx, p[1] - f[0][1] - t * dy) < 0.3; });
  const other = ring.filter(e => !SE.some(f => near(e, f)));
  const lev = segs => { const out = units.map(([i, r]) => { const d = Math.max(1, Math.min(...segs.map(([a, b]) => segRectD(r, a, b)))); return [i, d, Lw - 10 * Math.log10(2 * Math.PI * d * d)]; });
    return [out, 10 * Math.log10(out.reduce((s, [, , x]) => s + Math.pow(10, x / 10), 0))]; };
  const parts = [], over = [];
  for (const [nm, segs] of [['street line', SE], ['side and rear lines', other]]) { if (!segs.length) continue; const [l, tot] = lev(segs); over.push(tot - lim);
    parts.push(`${nm} (night ≤ ${lim}, ${van ? 'activity or intermediate receiver' : 'non-residential'}): ` + l.map(([i, d, x]) => `${i} ${d.toFixed(1)} m → ${x.toFixed(1)}`).join(', ') + `; all ${l.length} together ${tot.toFixed(1)} dBA`); }
  if (van) parts.push('quiet-zone receivers (55 dBA night) not checked: neighbouring zones ?');
  else if (opt.resZone) { const [dres, zn] = opt.resZone, tot = 10 * Math.log10(units.length * Math.pow(10, (Lw - 10 * Math.log10(2 * Math.PI * Math.max(dres, 1) ** 2)) / 10)); over.push(tot - 50); parts.push(`nearest residential zone ${zn} ${dres.toFixed(0)} m from the lot: all together at most ${tot.toFixed(1)} dBA (night ≤ 50)`); }
  else parts.push('nearest residential zone: ?');
  const X = over.length ? Math.max(...over) : -99;
  const head = X > 0 ? `Night noise: ${X.toFixed(0)} dB over the night limit at the nearest lot line (all chillers at full speed, no screening; our conversion from the maker's 1 m figure). Needs a noise design. ` : 'Night noise under the night limit at every lot line on paper (all chillers at full speed, no screening). ';
  return { id: 'E8', title: 'Chiller noise', status: X > 0 ? 'flag' : 'pass', text: head + parts.join('; ') + ` (ISO 3744 box, S = ${S.toFixed(1)} m², Lw = ${Lw.toFixed(1)} dB(A)) [script]`, src };
}
const api = { e8ChillerNoiseRow, chillerLw };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchE8 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['F4'] = (function (module) {
 
(function (root) {
'use strict';
const isLift = x => x.core && !x.stair && (/lift|elevator/i.test(x.n) || x.lift);
const near = (a, b) => a.length === b.length && a.every((r, i) => r.every((v, j) => Math.abs(v - b[i][j]) <= 0.1 + 1e-6));
function f4LiftRow(G, cfg) {
  const src = 'project decision, 16 Nov 08:58 (lift stacks; hall area excludes cores; option A); Code 16e item 7';
  const S = G.S, sts = Object.keys(S).map(Number).sort((a, b) => a - b), fails = [], parts = [], flags = [];
  const lifts = new Map(); for (const st of sts) for (const x of S[st].filter(isLift)) { const k = x.id.replace(/\d+$/, m => m); if (!lifts.has(x.id)) lifts.set(x.id, []); lifts.get(x.id).push([st, x.r]); }
  for (const [id, L] of lifts) { const base = L[0][1], moved = L.filter(([, r]) => !near(r, base)).map(([s]) => s), gaps = [];
    for (let s = L[0][0]; s <= L[L.length - 1][0]; s++) if (!L.some(([q]) => q === s)) gaps.push(s);
    if (moved.length || gaps.length) fails.push(`${id}${moved.length ? ' moves on storey ' + moved.join(', ') : ''}${gaps.length ? ' missing on storey ' + gaps.join(', ') : ''}`);
    else parts.push(`${id} storeys ${L.map(([s]) => s).join(', ')}, same footprint`); }
  for (const st of sts) { const halls = S[st].filter(x => x.g === 'hall'), cores = S[st].filter(x => x.core || x.stair || /shaft/i.test(x.n));
    for (const h of halls) for (const c of cores) for (const a of h.r) for (const b of c.r) { const ov = Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2])); if (ov > 0.05) fails.push(`storey ${st}: ${c.id} inside the hall area (${ov.toFixed(1)} m²)`); } }
  const s1 = S['1'] || S[1] || [], D1 = (G.D || []).filter(d => String(d[0]) === '1'), e2 = s1.find(x => x.id === 'e2' && isLift(x));
  if (e2) { const lob = id => { const y = s1.find(q => q.id === id); return y && (/\bdock\b|lift lobby/i.test(y.n) || ['dock', 'lv'].includes(id)); };
    const other = D1.filter(d => d[1] === 'e2' || d[2] === 'e2').map(d => d[1] === 'e2' ? d[2] : d[1]).filter(o => !lob(o));
    if (other.length) flags.push(`E2 also opens onto ${other.join(', ')} at grade (the engine's option A: the dock lobby only)`); else parts.push('E2 opens onto the dock lobby only');
    const ves = s1.find(x => x.id === 'ves');
    if (ves && !D1.some(d => (d[1] === 'ves' || d[2] === 'ves') && lob(d[1] === 'ves' ? d[2] : d[1]))) fails.push('staff entrance (ves) has no door to the dock lobby'); }
  return { id: 'F4', title: 'Lift shafts stack; hall excludes cores; lift route', status: fails.length ? 'fail' : flags.length ? 'flag' : 'pass', text: parts.join('; ') + (fails.length ? ' · FAILS: ' + fails.join('; ') : '') + (flags.length ? ' · flags: ' + flags.join('; ') : '') + ' [script]', src };
}
const api = { f4LiftRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchF4 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['F5'] = (function (module) {
 
(function (root) {
'use strict';
function lineD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / L; }
function f5StepBackRow(G, cfg, opt = {}) {
  const src = 'Vancouver I-3 District Schedule (June 2026) 3.1.2.3, 3.1.2.5, 3.1.2.15; checks/sources/van_I-3_district_schedule_2026-06.pdf';
  const zone = opt.zone || (cfg && cfg.zone) || '';
  if (!/I-3/.test(zone)) return { id: 'F5', title: 'I-3 step-backs above 18.3 m', status: 'n/a', text: `zone ${zone || 'not I-3'}: no I-3 step-back`, src };
  const P = G.LOTPOLY, fronts = (G.STREET_EDGES || []).map(([a, b]) => [a, b]); if (!P) return { id: 'F5', title: 'I-3 step-backs above 18.3 m', status: '?', text: 'lot outline not in the plan', src };
  const edges = P.map((p, i) => [p, P[(i + 1) % P.length]]);
  const ang = (e, f) => { const u = [e[1][0] - e[0][0], e[1][1] - e[0][1]], v = [f[1][0] - f[0][0], f[1][1] - f[0][1]]; return Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v) || 1); };
  const isFront = e => fronts.some(f => lineD(e[0], f[0], f[1]) < 0.5 && lineD(e[1], f[0], f[1]) < 0.5);
  const sides = edges.filter(e => !isFront(e) && fronts.every(f => ang(e, f) < 0.7071));
  const base = (G.m && G.m.height && G.m.height[3] != null) ? G.m.height[3] : (G.SLAB || 0);
  const zs = [G.SLAB || 0]; (G.H || []).forEach(h => zs.push(zs[zs.length - 1] + h));
  const parts = [], fails = [], flags = [];
  Object.keys(G.S).map(Number).forEach(st => { const top = zs[st] - base; if (top <= 18.3 + 1e-9) return;
    const fr = top > 30.5 ? 6.1 : 3.7, sd = top > 30.5 ? 12.2 : 10.7;
    for (const x of G.S[st]) for (const r of x.r) { const pts = [[r[0], r[2]], [r[0], r[3]], [r[1], r[2]], [r[1], r[3]]];
      const dF = Math.min(...fronts.flatMap(f => pts.map(p => lineD(p, f[0], f[1])))), dS = sides.length ? Math.min(...sides.flatMap(e => pts.map(p => lineD(p, e[0], e[1])))) : Infinity;
      const bad = dF < fr - 0.3 || dS < sd - 0.3;
      if (bad) ((x.core || x.stair) ? flags : fails).push(`storey ${st} (top ${top.toFixed(1)} m) ${x.id}: ${dF.toFixed(1)} m from the front (≥ ${fr}), ${isFinite(dS) ? dS.toFixed(1) : '-'} m from a side line (≥ ${sd})`); } });
  const hmax = Math.max(...Object.keys(G.S).map(Number).map(s => zs[s] - base));
  parts.push(`highest storey top ${hmax.toFixed(1)} m above the base surface`);
  const status = fails.length ? 'fail' : flags.length ? 'flag' : 'pass';
  return { id: 'F5', title: 'I-3 step-backs above 18.3 m', status, text: parts.join('; ') + (hmax <= 18.3 ? ': nothing above 18.3 m' : '') + (fails.length ? ' · FAILS: ' + fails.slice(0, 6).join('; ') : '') + (flags.length ? ' · cores in the step-back (height exclusions not read): ' + flags.slice(0, 4).join('; ') : '') + ' [script]', src };
}
const api = { f5StepBackRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchF5 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['H1'] = (function (module) {
 
(function (root) {
'use strict';
function norm(r) { return Array.isArray(r) ? { status: r[0], title: r[1], src: r[2], text: r[3] } : r; }
function h1Audit(rows) {
  const contra = [], typed = [];
  for (const r0 of rows) { const r = norm(r0), t = String(r.text || '');
     
    if (['pass', 'tight'].includes(r.status) && !(r.status === 'tight' && /chiller/i.test(r.title))) {
      const re = /(\d+(?:\.\d+)?) m (?:to|from|between|clear|apart|wide)[^;()]{0,60}\((?:[^()]*?; )?≥ (\d+(?:\.\d+)?)\)/g; let m;
      while ((m = re.exec(t))) { if (+m[1] < +m[2] - 1e-9) { contra.push(`${r.title}: ${m[0].slice(0, 80)} but status ${r.status}`); break; } } }
    if (['pass', 'tight', 'fail'].includes(r.status) && !/\[script/.test(t) && /by hand|drawing claim|typed/i.test(t + ' ' + (r.src || ''))) typed.push(r.title); }
  return { id: 'H1', title: 'Rows read the drawn geometry', status: contra.length || typed.length ? 'flag' : 'pass',
    text: (contra.length ? `${contra.length} row(s) whose own measurement is under its limit while the status is not fail: ${contra.join('; ')}` : 'no row contradicts its own measurement') + (typed.length ? ` · ${typed.length} status-deciding row(s) typed or by hand: ${typed.join(', ')}` : ''),
    src: 'hub handoff item 5; project decision, 16 Nov 07:06 ("oversize reads fields not names"), 17:43; DECISIONS 16 Nov (below a sourced minimum fails)', contradictions: contra, typed };
}
 
function boardRows(html) { const out = [], re = /<tr><td[^>]*>([^<]*)<\/td><td[^>]*><div[^>]*>([\s\S]*?)<\/div><div[^>]*>([\s\S]*?)<\/div><\/td><\/tr>/g; let m;
  const un = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
  while ((m = re.exec(html))) out.push({ status: m[1].trim(), title: un(m[2]), text: un(m[3]) }); return out; }
const api = { h1Audit, boardRows };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchH1 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['H2'] = (function (module) {
 
(function (root) {
'use strict';
const RX = /shaft|riser/i, area = r => (r[1] - r[0]) * (r[3] - r[2]);
const ov = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));
function h2ShaftRow(G, cfg) {
  const src = 'hub handoff item 6 (shafts stack, same footprint ± 0.1 m)';
  const S = G.S, sts = Object.keys(S).map(Number).sort((a, b) => a - b), top = sts[sts.length - 1];
  const sh = []; for (const st of sts) for (const x of S[st]) if (RX.test(x.n) && !/lift|elevator/i.test(x.n)) sh.push({ st, id: x.id, r: x.r[0], n: x.n });
  if (!sh.length) return { id: 'H2', title: 'Shafts stack', status: 'n/a', text: 'no shaft or riser', src };
  const chains = [], used = new Set();
  for (const s of sh) { if (used.has(s)) continue; const ch = [s]; used.add(s); let cur = s;
    for (;;) { const nx = sh.find(t => !used.has(t) && t.st === cur.st + 1 && ov(t.r, cur.r) >= 0.9 * Math.min(area(t.r), area(cur.r))); if (!nx) break; ch.push(nx); used.add(nx); cur = nx; }
    chains.push(ch); }
  const fails = [], flags = [], parts = [];
  for (const ch of chains) { const a = ch[0], z = ch[ch.length - 1], lab = ch.map(c => c.id).filter((v, i, A) => A.indexOf(v) === i).join('/');
    const moved = ch.slice(1).filter((c, i) => c.r.some((v, j) => Math.abs(v - ch[i].r[j]) > 0.1 + 1e-6)); if (moved.length) fails.push(`${lab} moves on storey ${moved.map(c => c.st).join(', ')}`);
    if (a.st > 1) flags.push(`${lab} starts on storey ${a.st}`);
    if (z.st < top) { const above = (S[z.st + 1] || []).filter(y => y.r.some(q => ov(q, z.r) > 0.05) && !RX.test(y.n)); const occ = above.filter(y => y.g !== 'plant' && !/roof/i.test(y.n));
      if (occ.length) flags.push(`${lab} ends on storey ${z.st} under ${occ.map(y => y.id).join(', ')}`); }
    parts.push(`${lab} storeys ${ch.map(c => c.st).join('-')}`); }
  return { id: 'H2', title: 'Shafts stack', status: fails.length ? 'fail' : flags.length ? 'flag' : 'pass', text: parts.join('; ') + (fails.length ? ' · FAILS: ' + fails.join('; ') : '') + (flags.length ? ' · flags: ' + flags.join('; ') : '') + ' [script]', src };
}
const api = { h2ShaftRow };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.patchH2 = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['fixtures'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutFixtures = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
   
  function getC45() { try { return (typeof require === 'function') ? require('../../C4C5/C4C5.js') : GL.BD && GL.BD.C4C5; } catch (e) { return GL.BD && GL.BD.C4C5; } }
  const GL = typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : {});
  const NB = ['wc_lobby', 'lobby_wc'];
  function fixtureCounts(L, S, def, ctx) {
    const st1 = L && L.rooms && L.rooms[1], C = getC45(); if (!st1 || !def || !C) return L;
    const city = (S && S.city) === 'edm' ? 'edm' : 'van', halls = (def.rooms || []).filter(r => r.waterM2 != null && st1.some(x => x.id === r.id));
    if (!halls.length) return L;
    const A = halls.reduce((s, r) => s + r.waterM2, 0), D = halls.reduce((s, r) => s + (r.deepM2 || 0), 0), isW = r => r.whirlpool != null ? !!r.whirlpool : /spa|whirl|hot pool|hot tub/i.test(r.id + ' ' + (r.name || '')), W = halls.filter(isW).reduce((s, r) => s + r.waterM2, 0);        
    const gymA = Object.keys(L.rooms).reduce((s, k) => s + L.rooms[k].filter(x => x.id === 'gym').reduce((t, x) => t + x.r.reduce((u, q) => u + ctx.ra(q), 0), 0), 0);
    const ld = C.load({ city, waterM2: A, deepM2: D, whirlM2: W, gymM2: gymA }), [M, F] = C.wcA(ld.nSex);
    const sh = city === 'edm' ? Math.max(3, Math.ceil(ld.bathers / 50 - 1e-9)) : 2 + Math.max(0, Math.ceil((ld.nSex - 100) / 50 - 1e-9));
    const put = (r, wc, shower) => { r.fx = Object.assign(r.fx || {}, { wc, shower, lav: Math.ceil(wc / 2), showerBF: 1 }); };    
    const w = st1.find(x => x.id === 'change_w'), m = st1.find(x => x.id === 'change_m'), nb = st1.find(x => NB.includes(x.id)); let n = [];
    if (w) { put(w, F, sh); n.push(`${w.id} ${F} WC, ${sh} showers`); } if (m) { put(m, M, sh); n.push(`${m.id} ${M} WC, ${sh} showers`); }
    if (nb) { nb.fx = Object.assign(nb.fx || {}, { wc: 3, unisex: 2, universal: 1, lav: 3 });     n.push(`${nb.id} 3 WC (two unisex, one universal)`); }
    if (L.flags && n.length) L.flags.push(`Layout draft fixtures: fixture counts written as fields at the bather load ${ld.bathers} + ${ld.gym} gym users (${ld.nSex} a sex): ${n.join('; ')}.`);
    return L;
  }
  const hooks = { programRooms: fixtureCounts };
  const lots = {
    'V339_warm_bath': 'change_w 2 WC 2 showers, change_m 1 WC 2 showers, lobby_wc 3 WC (fx fields); no room changes',
    'E06B_warm_bath': 'change_w 1 WC 3 showers, change_m 1 WC 3 showers, lobby_wc 3 WC; no room changes',
    'P339_community_pool': 'change_w 4 WC 2 showers, change_m 2 WC 2 showers, wc_lobby 3 WC; C4.wc and C4.showers read pass',
    'P4103_community_pool': 'change_w 4 WC 3 showers, change_m 2 WC 3 showers, wc_lobby 3 WC; gym users counted from the drawn gym 187 m2'
  };
  return { hooks, lots, fixtureCounts };
});

return module.exports; })({ exports: {} });
 
P['CPprog'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutCPprog = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 0.005;
  function trimUniversal(L, S, def, ctx) {
    const st1 = L && L.rooms && L.rooms[1]; if (!st1 || !def || def.id !== 'community_pool') return L;
    const room = st1.find(r => r.id === 'change_u'); if (!room || !room.r || room.r.length !== 1) return L;
    const dr = def && (def.rooms || []).find(r => r.id === 'change_u');
    const minW = (dr && dr.minW) || 2.4;
    const [a0, a1, b0, b1] = room.r[0], da = a1 - a0, db = b1 - b0;
    const alongA = da < db;                       
    const w = alongA ? da : db; if (w - minW <= EPS) return L;
    const cut = w - minW;
    
    const mk = (t) => alongA ? [t === 0 ? a0 : a1 - cut, t === 0 ? a0 + cut : a1, b0, b1] : [a0, a1, t === 0 ? b0 : b1 - cut, t === 0 ? b0 + cut : b1];
    const touches = (x, y) => { const o = (u0, u1, v0, v1) => Math.min(u1, v1) - Math.max(u0, v0); return o(x[0], x[1], y[0], y[1]) > -EPS && o(x[2], x[3], y[2], y[3]) > -EPS && (o(x[0], x[1], y[0], y[1]) > EPS || o(x[2], x[3], y[2], y[3]) > EPS); };
    const sliver = [mk(0), mk(1)];
    const score = (s) => { let sc = 0; for (const r of st1) { if (r === room) continue; for (const q of r.r) if (touches(s, q)) { if (r.g === 'spare') sc += 10; if (r.id === 'change_m' || r.id === 'change_w') sc -= 1; } } return sc; };
    const pick = score(sliver[1]) > score(sliver[0]) ? 1 : 0;
    const gone = sliver[pick], kept = alongA ? [pick === 0 ? a0 + cut : a0, pick === 0 ? a1 : a1 - cut, b0, b1] : [a0, a1, pick === 0 ? b0 + cut : b0, pick === 0 ? b1 : b1 - cut];
    const before = ctx.ra(room.r[0]); room.r = [kept];
    const nb = st1.find(r => r.g === 'spare' && r.r.some(q => touches(gone, q)));
    if (nb) nb.r.push(gone); else st1.push(ctx.room(1, 'usp_cu', 'Unassigned (trimmed from the universal room)', 'spare', 'spare', [gone], {}));
    if (L.flags) L.flags.push(`Layout draft CPprog: universal dressing room trimmed to its minimum width ${minW} m (${ctx.r2(before)} to ${ctx.r2(ctx.ra(kept))} m²,  17z, project decision, 07:42); the ${ctx.r2(ctx.ra(gone))} m² sliver stays spare floor.`);
    return L;
  }
   
  const SPAREISH = x => /^(program_room|multipurpose|fsp|ssp|usp|sspare|aspare|esp|spare)/.test(x.id) || /^(unassigned|program room|multipurpose)/i.test(x.n || '');
  function gymAtGrade(L, S, def, ctx) {
    const R = (def && def.rooms) || [], G = R.find(r => r.id === 'gym'); if (!G || !L || !L.rooms || !L.rooms[1]) return L;
    if (Object.keys(L.rooms).some(k => L.rooms[k].some(x => x.id === 'gym'))) return L;
    const GS = R.find(r => r.id === 'gym_storage'), cv = v => (v && typeof v === 'object') ? (v.van || v.edm || 0) : (+v || 0);
    const gA = cv(G.minM2 != null ? G.minM2 : G.m2), gW = G.minW || 0, sA = GS ? cv(GS.minM2 != null ? GS.minM2 : GS.m2) : 0, st1 = L.rooms[1];
    const cand = st1.filter(x => SPAREISH(x) && x.r.length === 1).map(x => { const q = x.r[0], w = Math.min(q[1] - q[0], q[3] - q[2]); return { x, q, w, a: ctx.ra(q) }; })
      .filter(o => o.w >= gW - EPS && o.a >= gA - EPS).sort((p, q) => q.a - p.a);
    if (!cand.length) { const big = st1.filter(SPAREISH).map(x => ({ x, a: x.r.reduce((s, q) => s + ctx.ra(q), 0) })).sort((p, q) => q.a - p.a)[0];
      if (L.flags) L.flags.push(`Layout draft CPprog: gym waits for stacking (option 1): no storey-1 spare-fill piece holds ${gA} m² at ${gW} m wide${big ? ` (largest ${big.x.id}, ${ctx.r2(big.a)} m²)` : ''} (project decision, 17 Nov 17:53).`); return L; }
    const { x, q } = cand[0], alongU = (q[1] - q[0]) >= (q[3] - q[2]), short = alongU ? q[3] - q[2] : q[1] - q[0], long = alongU ? q[1] - q[0] : q[3] - q[2];
    const sL = GS && (long * short - sA) >= gA - EPS ? ctx.r2(sA / short) : 0;
    const gymR = alongU ? [q[0], ctx.r2(q[1] - sL), q[2], q[3]] : [q[0], q[1], q[2], ctx.r2(q[3] - sL)], stoR = sL ? (alongU ? [ctx.r2(q[1] - sL), q[1], q[2], q[3]] : [q[0], q[1], ctx.r2(q[3] - sL), q[3]]) : null;
    const i = st1.indexOf(x);
    const gym = ctx.room(1, 'gym', G.name || 'Fitness floor (gym)', 'gym', 'proom', [gymR], { block: 'gym' });
    st1.splice(i, 1, gym); if (stoR) st1.splice(i + 1, 0, ctx.room(1, 'gym_storage', (GS && GS.name) || 'Gym storage', 'gym', 'proom', [stoR], { block: 'gym' }));
    if (L.flags) L.flags.push(`Layout draft CPprog: gym placed at grade in ${x.id} (${ctx.r2(ctx.ra(q))} m²): gym ${ctx.r2(ctx.ra(gymR))} m²${stoR ? `, storage ${ctx.r2(ctx.ra(stoR))} m²` : ', no room for its storage'} (project decision, 17 Nov 17:53,  item 2).`);
    return L;
  }
  const hooks = { programRooms: trimUniversal, fill: gymAtGrade };
   
  const lots = {
    'P339_community_pool': 'change_u to 19.4 m2; no gym upstairs (17z); gym at grade only if a storey-1 spare-fill piece holds 186 m2 at 6.0 m wide, else flagged "gym waits for stacking (option 1)" [Likely flagged: stacked lot]',
    'P4103_community_pool': 'change_u to 19.4 m2; gym at grade in the largest storey-1 program-room / unassigned piece that holds it (the at-grade gym drawn before 17z sat at grade), else flagged',
    'P10003_community_pool': 'change_u to 19.4 m2; gym at grade where a piece holds it, else flagged'
  };
  return { hooks, lots, trimUniversal, gymAtGrade };
});

return module.exports; })({ exports: {} });
 
P['WBprog'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutWBprog = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 0.005;
  function trimUniversal(L, S, def, ctx) {
    const st1 = L && L.rooms && L.rooms[1]; if (!st1 || !def || def.id !== 'warm_bath') return L;
    const room = st1.find(r => r.id === 'change_u'); if (!room || !room.r || room.r.length !== 1) return L;
    const dr = def && (def.rooms || []).find(r => r.id === 'change_u');
    const minW = (dr && dr.minW) || 2.4;
    const [a0, a1, b0, b1] = room.r[0], da = a1 - a0, db = b1 - b0;
    const alongA = da < db;                       
    const w = alongA ? da : db; if (w - minW <= EPS) return L;
    const cut = w - minW;
    
    const mk = (t) => alongA ? [t === 0 ? a0 : a1 - cut, t === 0 ? a0 + cut : a1, b0, b1] : [a0, a1, t === 0 ? b0 : b1 - cut, t === 0 ? b0 + cut : b1];
    const touches = (x, y) => { const o = (u0, u1, v0, v1) => Math.min(u1, v1) - Math.max(u0, v0); return o(x[0], x[1], y[0], y[1]) > -EPS && o(x[2], x[3], y[2], y[3]) > -EPS && (o(x[0], x[1], y[0], y[1]) > EPS || o(x[2], x[3], y[2], y[3]) > EPS); };
    const sliver = [mk(0), mk(1)];
    const score = (s) => { let sc = 0; for (const r of st1) { if (r === room) continue; for (const q of r.r) if (touches(s, q)) { if (r.g === 'spare') sc += 10; if (r.id === 'change_m' || r.id === 'change_w') sc -= 1; } } return sc; };
    const pick = score(sliver[1]) > score(sliver[0]) ? 1 : 0;
    const gone = sliver[pick], kept = alongA ? [pick === 0 ? a0 + cut : a0, pick === 0 ? a1 : a1 - cut, b0, b1] : [a0, a1, pick === 0 ? b0 + cut : b0, pick === 0 ? b1 : b1 - cut];
    const before = ctx.ra(room.r[0]); room.r = [kept];
    const nb = st1.find(r => r.g === 'spare' && r.r.some(q => touches(gone, q)));
    if (nb) nb.r.push(gone); else st1.push(ctx.room(1, 'usp_cu', 'Unassigned (trimmed from the universal room)', 'spare', 'spare', [gone], {}));
    if (L.flags) L.flags.push(`Layout draft WBprog: universal dressing room trimmed to its minimum width ${minW} m (${ctx.r2(before)} to ${ctx.r2(ctx.ra(kept))} m²,  17z, project decision, 07:42); the ${ctx.r2(ctx.ra(gone))} m² sliver stays spare floor.`);
    return L;
  }

  const hooks = { programRooms: trimUniversal };
   
  const lots = {
    'E06B_warm_bath': 'change_u to 19.4 m2 (2.4 x strip); MW unchanged; therapy/steam/plunge/rest restore waits for the site model (not in this draft)',
    'V339_warm_bath': 'change_u to 2.4 x strip; MW unchanged; rooms-to-definition sizes wait for the site model. Fixture counts now in layout/fixtures; B4 entrance now hub layout/fire-entrance'
  };
  return { hooks, lots, trimUniversal };
});

return module.exports; })({ exports: {} });
 
P['aq-programRooms'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutAqProgramRooms = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 0.01, FLOOR = 3.7, FH_MINW = 4.9, FH_MIN_A = 37;
  const ra = r => (r[1] - r[0]) * (r[3] - r[2]);
  const ov = (x0, x1, y0, y1) => Math.min(x1, y1) - Math.max(x0, y0);
  const overlapA = (p, q) => Math.max(0, ov(p[0], p[1], q[0], q[1])) * Math.max(0, ov(p[2], p[3], q[2], q[3]));
  const wall = (p, q) => { const oa = ov(p[0], p[1], q[0], q[1]), ob = ov(p[2], p[3], q[2], q[3]); return Math.abs(oa) < EPS && ob > 0 ? ob : Math.abs(ob) < EPS && oa > 0 ? oa : 0; };
  function ratio(A, def) { const gh = (def.rooms || []).find(r => r.id === 'greenhouse') || {}, pt = gh.perTonne || [23, 111];
    const lean = A / pt[0], com = A / pt[1];
    return { com, lean, status: com + 1e-9 >= FLOOR ? 'pass' : lean + 1e-9 >= FLOOR ? 'tight' : "doesn't fit here", pt }; }
  function aqRooms(L, S, def, ctx) {
    if (!def || def.id !== 'aquaponics' || !L || !L.rooms || !L.rooms[1]) return L;
    const st1 = L.rooms[1], gh = st1.find(x => x.id === 'greenhouse'); if (!gh) return L;
    const flags = L.flags || (L.flags = []), r2 = (ctx && ctx.r2) || (x => Math.round(x * 100) / 100);
    const up = Object.keys(L.rooms).filter(s => +s > 1).flatMap(s => L.rooms[s].flatMap(x => x.r));
    const sky = x => x.r.every(r => !up.some(q => overlapA(r, q) > 0.05));
    const A0 = gh.r.reduce((s, q) => s + ra(q), 0);
     
    const taken = []; let more = true;
    while (more) { more = false;
      for (const x of st1.slice()) { if (!/^class_room_floor/.test(x.prog || x.id) || !sky(x)) continue;
        if (x.r.reduce((s, p) => s + gh.r.reduce((t, q) => t + wall(p, q), 0), 0) + 1e-9 < 1.0) continue;
        gh.r.push(...x.r); st1.splice(st1.indexOf(x), 1); taken.push(`${x.id} ${r2(x.r.reduce((s, q) => s + ra(q), 0))} m²`); more = true; } }
     
    const fh = st1.find(x => x.id === 'fish_hall');
    if (fh && fh.r.length === 1) { const f = fh.r[0];
      for (const g of gh.r) { let sh = null;
        if (Math.abs(g[0] - f[0]) < EPS && Math.abs(g[1] - f[1]) < EPS && (Math.abs(g[3] - f[2]) < EPS || Math.abs(g[2] - f[3]) < EPS)) sh = 'b';
        else if (Math.abs(g[2] - f[2]) < EPS && Math.abs(g[3] - f[3]) < EPS && (Math.abs(g[1] - f[0]) < EPS || Math.abs(g[0] - f[1]) < EPS)) sh = 'a';
        if (!sh) continue;
        const depth = sh === 'b' ? f[1] - f[0] : f[3] - f[2], w0 = sh === 'b' ? f[3] - f[2] : f[1] - f[0];
        const tot = gh.r.reduce((s, q) => s + ra(q), 0) + ra(f), need = Math.max(FH_MIN_A, tot * 28 / 139), w = Math.max(FH_MINW, need / depth);
        if (w < w0 - 0.005) { const cut = w0 - w, before = [r2(ra(f)), r2(gh.r.reduce((s, q) => s + ra(q), 0))];
          const lowSide = sh === 'b' ? Math.abs(g[3] - f[2]) < EPS : Math.abs(g[1] - f[0]) < EPS;    
          if (sh === 'b') { if (lowSide) { g[3] = +(g[3] + cut).toFixed(4); f[2] = g[3]; } else { g[2] = +(g[2] - cut).toFixed(4); f[3] = g[2]; } }
          else { if (lowSide) { g[1] = +(g[1] + cut).toFixed(4); f[0] = g[1]; } else { g[0] = +(g[0] - cut).toFixed(4); f[1] = g[0]; } }
          flags.push(`Layout draft aq-programRooms: fish hall to the 4.9 m minimum width (project decision, 17 Nov 08:15): ${r2(w0)} → ${r2(w)} m wide, ${before[0]} → ${r2(ra(f))} m² (max of 37 m² and 111 : 28); greenhouse ${before[1]} → ${r2(gh.r.reduce((s, q) => s + ra(q), 0))} m²`); }
        else if (need / depth > w0 + 0.005) flags.push(`Layout draft aq-programRooms: fish hall ${r2(ra(f))} m² is under the commercial 111 : 28 share (${r2(need)} m² of ${r2(tot)}); not grown at the greenhouse's cost (flag)`);
        break; } }
    const A1 = gh.r.reduce((s, q) => s + ra(q), 0);
    if (taken.length) flags.push(`Layout draft aq-programRooms: sky ground beside the greenhouse taken from class rooms (${taken.join(', ')}): greenhouse ${r2(A0)} → ${r2(A1)} m² (typ_aquaponics spareFill order 1; the greenhouse needs sky)`);
     
    const q = ratio(A1, def);
    flags.push(`Aquaponics ratio (AQ7, project decision, 14 Nov 09:22; layout draft aq-programRooms): greenhouse ${r2(A1)} m² gives ${q.com.toFixed(2)} t/yr fish at the commercial ratio (${q.pt[1]} m²/t) and ${q.lean.toFixed(2)} t/yr at the lean ratio (${q.pt[0]} m²/t) against the ${FLOOR} t/yr floor: ${q.status}${q.status === 'tight' ? ' (lean ratio only)' : ''}`);
    L.aqRatio = { greenhouse: r2(A1), commercial: +q.com.toFixed(2), lean: +q.lean.toFixed(2), status: q.status };
    return L;
  }
   
  function noCorridorDoor(L, ctx) {
    const r2 = (ctx && ctx.r2) || (x => Math.round(x * 100) / 100), out = [];
    const wallLen = (p, q) => { const oa = Math.min(p[1], q[1]) - Math.max(p[0], q[0]), ob = Math.min(p[3], q[3]) - Math.max(p[2], q[2]);
      return (Math.abs(oa) < EPS && ob > 0) ? ob : (Math.abs(ob) < EPS && oa > 0) ? oa : 0; };
    const shared = (x, y) => x.r.reduce((s, p) => s + y.r.reduce((t, q) => t + wallLen(p, q), 0), 0);
    const isCirc = y => ['pcor', 'ccor', 'lobby', 'exitpas'].includes(y.kind) || y.id === 'cor';
    for (const st of Object.keys(L.rooms || {})) { const R = L.rooms[st];
      for (const x of R) { if (x.kind !== 'proom' || x.core) continue;
        if (R.some(y => y !== x && isCirc(y) && shared(x, y) >= 0.9 - 1e-9)) continue;
        const via = R.filter(y => y !== x && y.kind === 'proom' && !/\bwcs?\b|washroom|toilet|store|storage|plant|mechanical/i.test(y.n || '') && shared(x, y) >= 0.9 - 1e-9 && R.some(z => isCirc(z) && shared(y, z) >= 0.9 - 1e-9))
          .sort((a, b) => shared(x, b) - shared(x, a))[0];
        out.push(`${x.id} (storey ${st}): no wall on a corridor, lobby or exit passage, so no corridor door; ${via ? 'entered through ' + via.id + ' (' + r2(shared(x, via)) + ' m shared wall; same suite, 3.3.1.5)' : 'no neighbour with a corridor wall: needs a corridor'}`); } }
    return out; }
  function aqDoors(L, S, def, ctx) {
    if (!def || def.id !== 'aquaponics' || !L || !L.rooms) return L;
    const nd = noCorridorDoor(L, ctx);
    if (nd.length) (L.flags || (L.flags = [])).push(`Layout draft aq-programRooms: ${nd.length} program room${nd.length > 1 ? 's' : ''} without a corridor door (17v): ${nd.join('; ')}`);
    L.noCorridorDoor = nd; return L; }
  const hooks = { programRooms: aqRooms, fill: aqDoors };
  const lots = {
    'V339_aquaponics': 'run_site.js 703fe9f (patchHard on): fish hall 42.0 → 37.0 m² (5.6 → 4.93 m wide, the 37 m² minimum governs), greenhouse 123.1 → 128.1 m²; nothing else moves; MW 2.71 unchanged; every patch and stair row status unchanged; ratio flag 128.1 m², 1.15 / 5.57 t/yr: tight (lean ratio only)',
    'E4103_aquaponics': 'no room change: the fish hall 42.0 m² is under its 111 : 28 share (68.4 m²), flagged, not grown at the greenhouse cost; ratio flag 297.8 m², 2.68 / 12.95 t/yr: tight; growth beside the hall waits for the site model',
    'V8980_aquaponics': 'export error (no plan): nothing'
  };
  return { hooks, lots, aqRooms, ratio, noCorridorDoor };
});

return module.exports; })({ exports: {} });
 
P['cv-programRooms'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutCvProgramRooms = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 0.005;
  const ra = r => (r[1] - r[0]) * (r[3] - r[2]);
  const ov = (u0, u1, v0, v1) => Math.min(u1, v1) - Math.max(u0, v0);
  const touches = (x, y) => { const oa = ov(x[0], x[1], y[0], y[1]), ob = ov(x[2], x[3], y[2], y[3]); return oa > -EPS && ob > -EPS && (oa > EPS || ob > EPS); };
  function biomeMech(L, S, def, ctx) {
    if (!def || def.id !== 'conservatory' || !L || !L.rooms || !L.rooms[1]) return L;
    const st1 = L.rooms[1], room = st1.find(x => x.id === 'biome_mech'); if (!room) return L;
    const dr = (def.rooms || []).find(x => x.id === 'biome_mech') || {}, target = dr.m2 || dr.minM2 || 30, minW = dr.minW || 3.0;
    const r2 = (ctx && ctx.r2) || (x => Math.round(x * 100) / 100), flags = L.flags || (L.flags = []);
    const was = { g: room.g, kind: room.kind }, A0 = room.r.reduce((s, q) => s + ra(q), 0);
    room.g = 'plant'; room.kind = 'plant';
    let sizeTxt = `kept at ${r2(A0)} m²`;
    if (room.r.length === 1 && A0 - target > EPS) {
      const [a0, a1, b0, b1] = room.r[0], da = a1 - a0, db = b1 - b0, longA = da >= db, depth = longA ? db : da;
      const len = target / depth, cut = (longA ? da : db) - len;
      if (depth + EPS >= minW && cut > EPS) {
        const ends = [0, 1].map(t => longA ? [t === 0 ? a0 : a1 - cut, t === 0 ? a0 + cut : a1, b0, b1] : [a0, a1, t === 0 ? b0 : b1 - cut, t === 0 ? b0 + cut : b1]);
        const edge = t => longA ? [t === 0 ? a0 : a1, t === 0 ? a0 : a1, b0, b1] : [a0, a1, t === 0 ? b0 : b1, t === 0 ? b0 : b1];    
        const inner = [0, 1].map(t => st1.some(x => x !== room && x.r.some(q => { const e = edge(t); return ov(e[0], e[1], q[0], q[1]) > -EPS && ov(e[2], e[3], q[2], q[3]) > -EPS && (ov(e[0], e[1], q[0], q[1]) > EPS || ov(e[2], e[3], q[2], q[3]) > EPS); })));
        const pick = inner[0] && !inner[1] ? 0 : inner[1] && !inner[0] ? 1 : -1;
        if (pick >= 0) {
          const gone = ends[pick].map(v => +v.toFixed(4)), kept = (longA ? [pick === 0 ? a0 + cut : a0, pick === 0 ? a1 : a1 - cut, b0, b1] : [a0, a1, pick === 0 ? b0 + cut : b0, pick === 0 ? b1 : b1 - cut]).map(v => +v.toFixed(4));
          room.r = [kept];
          const nb = st1.find(x => x.g === 'spare' && x.r.some(q => touches(gone, q)));
          if (nb) nb.r.push(gone);
          else st1.push(ctx && ctx.room ? ctx.room(1, 'usp_bm', 'Unassigned (trimmed from biome mechanical)', 'spare', 'spare', [gone], { block: room.block }) : { st: 1, id: 'usp_bm', n: 'Unassigned (trimmed from biome mechanical)', g: 'spare', kind: 'spare', r: [gone], block: room.block });
          sizeTxt = `${r2(A0)} → ${r2(ra(kept))} m² at its minimum (depth ${r2(depth)} m kept, the outside-wall end kept; the ${r2(ra(gone))} m² sliver is spare floor)`;
        } else sizeTxt = `kept at ${r2(A0)} m² (both ends touch rooms: no end to shorten)`;
      }
    }
    flags.push(`Layout draft cv-programRooms: biome mechanical drawn as plant (was ${was.g} / ${was.kind}), ${sizeTxt} (typ_conservatory biome_mech, project decision, 15 Nov 22:10)`);
    return L;
  }
  const hooks = { programRooms: biomeMech };
  const lots = {
    'E4103_conservatory': 'biome_mech pub/proom → plant/plant, 32.5 → 30.0 m² (5.0 m depth, 6.5 → 6.0 m, the end at the building edge kept), 2.5 m² spare usp_bm; MW unchanged; public net about −32.5 m²',
    'V339_conservatory': 'export error (no plan; 31.8 m needed across, 30.56 m there): nothing',
    'V8980_conservatory': 'export error (no plan): nothing'
  };
  return { hooks, lots, biomeMech };
});

return module.exports; })({ exports: {} });
 
P['fh-programRooms'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutFhProgramRooms = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 0.02;
  const ra = r => (r[1] - r[0]) * (r[3] - r[2]);
  const ovA = (p, q) => Math.max(0, Math.min(p[1], q[1]) - Math.max(p[0], q[0])) * Math.max(0, Math.min(p[3], q[3]) - Math.max(p[2], q[2]));
  const ceil = (x, s) => Math.ceil(x / s - 1e-9) * s;
  function programRooms(L, S, def, ctx) {
    if (!def || !Array.isArray(def.rooms) || !L || !L.rooms || !L.rooms[1]) return L;
    const sky = new Set((def.constraints || []).filter(c => c.type === 'nothingAbove').map(c => c.room));
    if (!sky.size) return L;
     
    const minOf = dd => { const m = dd && (Array.isArray(dd.minM2) ? dd.minM2[0] : dd.minM2); return Number.isFinite(+m) && +m > 0 ? +m : null; };
    const R1 = L.rooms[1], D = id => def.rooms.find(r => r.id === id), r2 = (ctx && ctx.r2) || (x => Math.round(x * 100) / 100), fl = L.flags || (L.flags = []);
    const up = Object.keys(L.rooms).filter(s => +s > 1).flatMap(s => (L.rooms[s] || []).flatMap(x => x.r));
    const isSky = x => x.r.every(r => !up.some(q => ovA(r, q) > 0.05));
    for (const id of sky) {
      const x = R1.find(y => y.id === id), d = D(id), dMin = minOf(d); if (!x || dMin == null || x.r.length !== 1) continue;
      const A = ra(x.r[0]); if (A + 0.1 >= dMin) continue;    
      const nm = String(x.n || id).split(' (')[0];
       
      let best = null;
      for (const ax of [0, 2]) { const cx = ax === 0 ? 2 : 0, r = x.r[0];
        const same = R1.filter(y => y.r.length === 1 && Math.abs(y.r[0][cx] - r[cx]) < EPS && Math.abs(y.r[0][cx + 1] - r[cx + 1]) < EPS);
        const chain = [x]; let grew = true;
        while (grew) { grew = false; const lo = Math.min(...chain.map(y => y.r[0][ax])), hi = Math.max(...chain.map(y => y.r[0][ax + 1]));
          for (const y of same) if (!chain.includes(y) && (Math.abs(y.r[0][ax + 1] - lo) < EPS || Math.abs(y.r[0][ax] - hi) < EPS)) { chain.push(y); grew = true; } }
        if (chain.length > 1 && (!best || chain.length > best.chain.length)) best = { ax, cx, chain }; }
      if (!best) { fl.push(`Layout draft fh-programRooms: ${nm} ${r2(A)} m² is under its ${dMin} m² minimum and sits in no band of rooms to re-split (?) [fh-programRooms:wing-needs-depth]`); continue; }
      const { ax, cx, chain } = best; chain.sort((p, q) => p.r[0][ax] - q.r[0][ax]);
      const depth = x.r[0][cx + 1] - x.r[0][cx], need = ceil((dMin - A) / depth, 0.01), i0 = chain.indexOf(x);
      const len = chain.map(y => y.r[0][ax + 1] - y.r[0][ax]);
      const LB = ctx && ctx.RULES && ctx.RULES.lobby, isLob = y => y.kind === 'lobby' || y.id === 'lob';
      const avail = chain.map((y, i) => { if (y === x) return 0; const dy = D(y.id); let keep;
        if (minOf(dy) != null) keep = Math.max(minOf(dy) / depth, +dy.minW || 0);
        else if (isLob(y) && LB && LB.m2 && Array.isArray(LB.ws)) keep = Math.max(LB.m2 / depth, Math.min(...LB.ws));    
        else return 0;
        return Math.max(0, Math.floor((len[i] - keep) * 100 - 1e-6) / 100); });
       
      const order = chain.map((y, i) => i).filter(i => i !== i0).sort((p, q) => (isLob(chain[p]) - isLob(chain[q])) || Math.abs(p - i0) - Math.abs(q - i0) || p - q);
      let left = need; const give = chain.map(() => 0);
      for (const i of order) { if (left <= 1e-9) break; const g = Math.min(avail[i], left); give[i] = r2(g); left = r2(left - g); }
      if (left > 1e-9) { fl.push(`Layout draft fh-programRooms: ${nm} ${r2(A)} m² is under its ${dMin} m² minimum; the band beside it can give ${r2((need - left) * depth)} of ${r2(need * depth)} m² without taking a room under its own minimum. The wing needs ${r2(left)} m more depth, which moves the upper storeys and the hall (Code's family, not a hook): left as drawn (?) [fh-programRooms:wing-needs-depth]`); continue; }
      const save = chain.map(y => y.r[0].slice()), nl = len.map((l, i) => i === i0 ? l + need : l - give[i]);
      let p = chain[0].r[0][ax]; chain.forEach((y, i) => { y.r[0][ax] = r2(p); p += nl[i]; y.r[0][ax + 1] = r2(p); });
      chain[chain.length - 1].r[0][ax + 1] = save[chain.length - 1][ax + 1];    
      const broken = chain.some(y => !y.r[0].every(Number.isFinite) || y.r[0][ax + 1] - y.r[0][ax] < 0.5);    
      if (broken) { chain.forEach((y, i) => { y.r[0] = save[i]; }); fl.push(`Layout draft fh-programRooms: ${nm}: the re-split would empty or break a room in its band: left as drawn (?) [fh-programRooms:bad-geometry]`); continue; }
      const lost = [...sky].map(s => R1.find(y => y.id === s)).filter(y => y && !isSky(y));
      if (lost.length) { chain.forEach((y, i) => { y.r[0] = save[i]; }); fl.push(`Layout draft fh-programRooms: re-splitting the band would put ${lost.map(y => y.n || y.id).join(', ')} under an upper storey: left as drawn (?) [fh-programRooms:sky-lost]`); continue; }
      const moved = chain.map((y, i) => give[i] > 0 ? `${String(y.n || y.id).split(' (')[0]} ${r2(len[i] * depth)} → ${r2(ra(y.r[0]))} m²` : null).filter(Boolean);
      fl.push(`Layout draft fh-programRooms: ${nm} ${r2(A)} → ${r2(ra(x.r[0]))} m² (minimum ${dMin}; definition, nothing above); the band's walls moved, outline unchanged: ${moved.join('; ')} [fh-programRooms:re-split]`);
    }
    return L; }
  return { hooks: { programRooms }, lots: {
    V339_food_hub: '531b3d0: greenhouse 147.6 m² (12.5 × 11.81) under 153: re-split takes about 0.43 m from the kitchen side (kitchen 115.0 above its 111.6 minimum, then dining); MW unchanged',
    E4103_food_hub: 'no change (greenhouse 232 m², over its minimum)' } };
});

return module.exports; })({ exports: {} });
 
P['chem-place'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutChemPlace = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 1e-6, MIN_D = 1.5, MIN_WALL = 1.0;
  const r2 = x => Math.round(x * 100) / 100, ra = r => (r[1] - r[0]) * (r[3] - r[2]), area = x => x.r.reduce((a, r) => a + ra(r), 0);
  const CHEM_ID = /^(hypochlorite|hypochlorite_store|chlorine|acid|acid_store)$/, CHEM_N = /hypochlorite|chlorine room|acid store|chemical store/i;
  const isChem = x => !!x && (CHEM_ID.test(String(x.id || '').replace(/_c\d+$/, '')) || CHEM_ID.test(String(x.prog || '')));    
  const isDC = x => x.block === 'data centre' || x.g === 'hall';
  const ov = (p, q) => Math.max(0, Math.min(p[1], q[1]) - Math.max(p[0], q[0])) * Math.max(0, Math.min(p[3], q[3]) - Math.max(p[2], q[2]));
  const WATER = /pool_hall|spa_hall|therapy|hot pool|tank|pool \+ deck|plunge/i;
  const notDonor = x => isChem(x) || x.big || x.big2 || x.core || x.stair || x.lift || x.corridor || ['pcor', 'scor', 'lobby', 'exitpas', 'pcore', 'score', 'bay', 'dock', 'entry', 'hall'].includes(x.kind) || isDC(x) || WATER.test(String(x.id || '') + ' ' + (x.n || ''));
   
  function wall(p, q) {
    if (Math.abs(p[1] - q[0]) < EPS || Math.abs(p[0] - q[1]) < EPS) { const f = Math.max(p[2], q[2]), t = Math.min(p[3], q[3]); if (t - f > EPS) return { side: Math.abs(p[1] - q[0]) < EPS ? 'a1' : 'a0', f, t, len: t - f }; }
    if (Math.abs(p[3] - q[2]) < EPS || Math.abs(p[2] - q[3]) < EPS) { const f = Math.max(p[0], q[0]), t = Math.min(p[1], q[1]); if (t - f > EPS) return { side: Math.abs(p[3] - q[2]) < EPS ? 'b1' : 'b0', f, t, len: t - f }; }
    return null; }
  function bestWall(A, B) { let best = null; A.r.forEach((p, k) => B.r.forEach(q => { const w = wall(p, q); if (w && (!best || w.len > best.len)) best = Object.assign(w, { k }); })); return best; }
  function sub(rs, c) { const out = []; for (const r of rs) { if (ov(r, c) < EPS) { out.push(r); continue; }
    const [a0, a1, b0, b1] = r; if (c[0] > a0 + EPS) out.push([a0, c[0], b0, b1]); if (c[1] < a1 - EPS) out.push([c[1], a1, b0, b1]);
    const x0 = Math.max(a0, c[0]), x1 = Math.min(a1, c[1]); if (c[2] > b0 + EPS) out.push([x0, x1, b0, c[2]]); if (c[3] < b1 - EPS) out.push([x0, x1, c[3], b1]); }
    return out.filter(r => ra(r) > 0.01).map(r => r.map(r2)); }
   
  function strip(p, w, need) {
    const across = (w.side === 'a0' || w.side === 'a1') ? p[1] - p[0] : p[3] - p[2];
    let len = w.len, d = need / len; if (d < MIN_D) { d = MIN_D; len = need / d; }
    if (len > w.len + EPS || d > across - MIN_D + EPS) return null;
    d = r2(d); len = r2(len); const f = w.f, t = r2(w.f + len);
    if (w.side === 'a0') return [p[0], r2(p[0] + d), f, t]; if (w.side === 'a1') return [r2(p[1] - d), p[1], f, t];
    if (w.side === 'b0') return [f, t, p[2], r2(p[2] + d)]; return [f, t, r2(p[3] - d), p[3]]; }
  function defMin(def, id) { const rs = (def && (def.rooms || def.program)) || []; const x = Array.isArray(rs) ? rs.find(r => r && r.id === id) : null; return x && x.minM2 ? +x.minM2 : null; }
  function chemPlace(L, S, def) {
    const R = L.rooms || {}, R1 = R[1] || []; L.flags = L.flags || []; L.chemPlace = [];
    const dcFoot = Object.keys(R).filter(s => +s !== 1).flatMap(s => (R[s] || []).filter(isDC).flatMap(x => x.r));
    const under = rs => rs.reduce((a, r) => a + dcFoot.reduce((b, q) => b + ov(r, q), 0), 0);
    const stores = Object.keys(R).flatMap(s => (R[s] || []).filter(isChem).map(x => [+s, x])).filter(([s, x]) => s !== 1 || under(x.r) > 0.01);
    if (!stores.length) return L;
    const plant = R1.find(x => x.g === 'plant' && !isChem(x) && /(pool|bath|spa)[ _]plant|^pool_plant$|^bath_plant$/i.test(String(x.id) + ' ' + (x.n || '')))
      || R1.find(x => x.g === 'plant' && !isChem(x) && !/mech/i.test(String(x.id) + ' ' + (x.n || '')));
    const nm = x => (x.n || x.id).split(' (')[0];
    const fail = (x, why) => { L.chemPlace.push({ store: x.id, to: null, why }); L.flags.push(`Layout draft chem-place (17y 1b): chemical store: no storey-1 floor clear of data-centre rooms beside the plant room (${nm(x)}: ${why}) (flag)`); };
    if (!plant) { stores.forEach(([, x]) => fail(x, 'no plant room on storey 1')); return L; }
    const tier = y => y.kind === 'spare' ? 0 : (y.g !== 'pub' && y.g !== 'grow' && !y.wet) ? 1 : y.wet ? 3 : 2;
    const donors = () => R1.filter(y => y !== plant && !notDonor(y) && under(y.r) < 0.01).map(y => ({ y, w: bestWall(y, plant) })).filter(o => o.w && o.w.len >= MIN_WALL)
      .sort((a, b) => (tier(a.y) - tier(b.y)) || (b.w.len - a.w.len));
    const needs = stores.map(([, x]) => r2(Math.min(area(x), defMin(def, x.id) || Infinity)));
     
    const place = (group, ds) => { const total = group.reduce((a, [i]) => a + needs[i], 0);
      for (const { y, w } of ds) { const c = strip(y.r[w.k], w, total); if (!c) continue;
        const before = area(y), alongA = w.side === 'b0' || w.side === 'b1'; y.r = sub(y.r, c);
        let pos = alongA ? c[0] : c[2]; const span = alongA ? c[1] - c[0] : c[3] - c[2];
        group.forEach(([i, st, x], j) => { const l = j === group.length - 1 ? (alongA ? c[1] : c[3]) - pos : r2(span * needs[i] / total);
          const piece = alongA ? [r2(pos), r2(pos + l), c[2], c[3]] : [c[0], c[1], r2(pos), r2(pos + l)]; pos = r2(pos + l);
          const old = x.r.slice(); x.r = [piece];
          if (st !== 1) { R[st] = R[st].filter(z => z !== x); R1.push(x); x.st = 1; }
          const back = st === 1 && old.some(p => plant.r.some(q => wall(p, q)));
          if (back) plant.r = plant.r.concat(old); else if (st === 1) R1.push({ st: 1, id: x.id + '_vacated', n: 'Spare floor (vacated by ' + nm(x) + ')', g: 'spare', kind: 'spare', r: old, block: x.block });
          L.chemPlace.push({ store: x.id, to: y.id, from: st, need: needs[i], donorLost: r2(before - area(y)), vacatedTo: back ? plant.id : 'spare' });
          L.flags.push(`Layout draft chem-place (17y 1b): ${nm(x)} moved off the data-centre footprint to ${needs[i].toFixed(1)} m² of storey-1 floor beside ${nm(plant)}, cut from ${nm(y)} (${before.toFixed(1)} → ${area(y).toFixed(1)} m² for ${group.length > 1 ? 'the ' + group.length + ' stores' : 'it'}: program area change, BOARD_PENDING); the floor it left (${old.reduce((a, r) => a + ra(r), 0).toFixed(1)} m²) goes to ${back ? nm(plant) : 'spare floor'}`); });
        return true; }
      return false; };
    const all = stores.map(([st, x], i) => [i, st, x]);
    if (!place(all, donors())) for (const g of all) if (!place([g], donors())) { const ds = donors(); fail(g[2], ds.length ? 'no room beside it deep enough for the store and a 1.5 m remainder' : 'no storey-1 room clear of data-centre rooms shares a 1.0 m wall with ' + nm(plant)); }
    return L;
  }
  const hooks = { programRooms: chemPlace };
  const lots = {
    'V339_heat_cascade': 'flag "no storey-1 floor clear of data-centre rooms beside the plant room" for both stores: the rooms clear of the data centre are the spa wing, and the nearest (men\'s change room) meets the pool plant at a corner only; CHEM-DC stays fail. [Likely: the 17 Nov export is the old definition]',
    'V1515_heat_cascade': 'as V339: flag for both stores; CHEM-DC stays fail',
    'V339_warm_bath': 'flag for both stores: the rest area and spa hall are 1.7 m from the bath plant, no shared wall; CHEM-DC stays fail',
    'P339_community_pool': 'flag: every storey-1 room is under the data centre; CHEM-DC stays fail',
    'every other plan': 'no change (no store under or over a data-centre room)'
  };
  return { hooks, lots, chemPlace, isChem, strip, sub };
});

return module.exports; })({ exports: {} });
 
P['grow-group'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutGrowGroup = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const GROW = {
    heat_cascade: ['greenhouse', 'headhouse'],
    aquaponics: ['greenhouse', 'fish_hall', 'headhouse', 'greenhouse_fish', 'headhouse_growth', 'headhouse_floor'],
    conservatory: ['biome', 'production', 'biome_growth'],
    food_hub: ['greenhouse', 'headhouse']
  };
  const base = id => String(id || '').replace(/_c\d+$/, '');
  function relabel(L, S, def, ctx) {
    const set = def && GROW[def.id]; if (!set || !L || !L.rooms) return L;
    const moved = [];
    for (const st of Object.keys(L.rooms)) for (const x of L.rooms[st]) {
      if (x.g !== 'pub' && !(x.g === 'plant' && /^greenhouse$/.test(base(x.id)))) continue;    
      if (set.includes(base(x.id)) || (x.prog && set.includes(x.prog))) { const was = x.g; x.g = 'grow'; moved.push(`${x.id} ${was} ${ctx && ctx.r2 ? ctx.r2(x.r.reduce((s, q) => s + (q[1] - q[0]) * (q[3] - q[2]), 0)) : ''} m²`); }
    }
    if (moved.length && L.flags) L.flags.push(`Layout draft grow-group: ${moved.length} room${moved.length > 1 ? 's' : ''} relabelled to grow, nothing moved (${moved.join(', ')};  item 3)`);
    return L;
  }
  const hooks = { programRooms: relabel, fill: relabel };
  const lots = {
    'E11814_heat_cascade': 'greenhouse 153.2 m² plant → grow, headhouse 20.0 m² pub → grow (the 17 Nov export draws the greenhouse, as g plant); no geometry or MW change',
    'V339_heat_cascade': 'nothing (no greenhouse or headhouse drawn at step 5)',
    'V1515_heat_cascade': 'nothing today (no greenhouse drawn)',
    'E4103_aquaponics': 'greenhouse, fish hall, headhouse and their spare-fill pieces pub → grow; no geometry or MW change',
    'V339_aquaponics': 'greenhouse 125.3, fish hall 41.4, headhouse 18.2 m² pub → grow (node run on site_V339, 17 Nov); no geometry or MW change; every row status unchanged',
    'E4103_conservatory': 'display biome and production house pub → grow; no geometry or MW change',
    'E4103_food_hub': 'greenhouse 219.8, headhouse 17.0 m² pub → grow',
    'V339_food_hub': 'greenhouse and headhouse pub → grow (node run on site_V339); no geometry or MW change',
    'V8980_food_hub': 'export error (no plan): nothing'
  };
  return { hooks, lots, relabel, GROW };
});

return module.exports; })({ exports: {} });
 
P['hc-programRooms'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutHcProgramRooms = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const ra = r => (r[1] - r[0]) * (r[3] - r[2]);
  const overlapA = (p, q) => Math.max(0, Math.min(p[1], q[1]) - Math.max(p[0], q[0])) * Math.max(0, Math.min(p[3], q[3]) - Math.max(p[2], q[2]));
  function hcCheck(L, S, def, ctx) {
    if (!def || def.id !== 'heat_cascade' || !L || !L.rooms) return L;
    const r2 = (ctx && ctx.r2) || (x => Math.round(x * 100) / 100), flags = L.flags || (L.flags = []);
    const gd = (def.rooms || []).find(r => r.id === 'greenhouse') || {}, minW = gd.minW || 7.5, minA = Array.isArray(gd.minM2) ? gd.minM2[0] : (gd.minM2 || 153);
    const sts = Object.keys(L.rooms).map(Number).sort((a, b) => a - b);
    const above = st => sts.filter(s => s > st).flatMap(s => L.rooms[s].flatMap(x => x.r));
    const sky = (st, x) => x.r.every(r => !above(st).some(q => overlapA(r, q) > 0.05));
    const A = x => x.r.reduce((s, q) => s + ra(q), 0), w = x => Math.max(...x.r.map(q => Math.min(q[1] - q[0], q[3] - q[2])));
    let gh = null, ghSt = 0; for (const s of sts) { const x = L.rooms[s].find(y => y.id === 'greenhouse'); if (x) { gh = x; ghSt = s; break; } }
    let txt, st;
    if (gh) { const miss = [];
      if (A(gh) + 0.05 < minA) miss.push(`area ${r2(A(gh))} < ${minA} m²`); if (w(gh) + 0.005 < minW) miss.push(`width ${r2(w(gh))} < ${minW} m`); if (!sky(ghSt, gh)) miss.push('rooms above it');
      st = miss.length ? 'fail' : 'pass';
      txt = `growing house drawn on storey ${ghSt}: ${r2(A(gh))} m², ${r2(w(gh))} m wide, ${sky(ghSt, gh) ? 'nothing above' : 'ROOMS ABOVE'}${miss.length ? ' — ' + miss.join('; ') : ''}; generator clearance is E3's row, sun is F2's`; }
    else {
      const cand = sts.flatMap(s => L.rooms[s].filter(x => x.g === 'spare' && sky(s, x)).map(x => ({ s, x, a: A(x), w: w(x), core: s === 1 || L.rooms[s].some(y => y.kind === 'pcore') })));
      cand.sort((p, q) => (q.core - p.core) || (q.a - p.a)); const c = cand[0];
      st = 'dropped';
      txt = `no growing house drawn (ladder ${L.ladder && L.ladder.step != null ? 'step ' + L.ladder.step : 'step ?'})` + (c
        ? `; best sky floor: storey ${c.s} ${c.x.id} ${r2(c.a)} m², ${r2(c.w)} m wide — misses: ${[c.a + 0.05 < minA ? `area < ${minA} m²` : '', c.w + 0.005 < minW ? `width < ${minW} m` : '', c.core ? '' : `no public stair or lift on storey ${c.s}`].filter(Boolean).join('; ') || 'nothing (a family change could place it here)'}`
        : '; no spare floor with nothing above it') + '; placing it needs the ladder (family), not a hook';
    }
    flags.push(`Layout draft hc-programRooms (flag only): ${txt} (typ_heat_cascade greenhouse minW ${minW} m, ${minA} m²)`);
    L.hcGreenhouse = { status: st, text: txt };
    return L;
  }
  const hooks = { fill: hcCheck };    
  const lots = {
    'E11814_heat_cascade': 'flag only: growing house drawn on storey 1, 153.2 m², 7.8 m wide, nothing above: pass; no room changed',
    'V339_heat_cascade': 'flag only: no growing house (ladder step 5); no spare floor with nothing above it; no room changed, MW 3.38 unchanged, every row status unchanged',
    'V1515_heat_cascade': 'flag only: no growing house; no spare floor with nothing above it (the export plan); no room changed'
  };
  return { hooks, lots, hcCheck };
});

return module.exports; })({ exports: {} });
 
P['fill-hub'] = (function (module) {
 
(function (root) {
'use strict';
const COT = 11, EPS = 1e-6, ar = r => (r[1] - r[0]) * (r[3] - r[2]);
function touch(h, c) { if (Math.abs(h[0] - c[1]) < EPS || Math.abs(h[1] - c[0]) < EPS) { const lo = Math.max(h[2], c[2]), hi = Math.min(h[3], c[3]); if (hi - lo > 1) return { ax: 'b', lo, hi }; }
  if (Math.abs(h[2] - c[3]) < EPS || Math.abs(h[3] - c[2]) < EPS) { const lo = Math.max(h[0], c[0]), hi = Math.min(h[1], c[1]); if (hi - lo > 1) return { ax: 'a', lo, hi }; } return null; }
const shares = (A, B) => A.r.some(h => B.r.some(q => { const t = touch(h, q); return t && t.hi - t.lo >= 1.0; }));
function fill(L, S, def, ctx) {
  if (!L || !L.rooms || !L.rooms[1] || (S && (S.typDef || S.wingTyp || S.hubTyp))) return L;    
  clinicWaiting(L, ctx);
  const R1 = L.rooms[1], fl = L.flags || (L.flags = []), by = id => R1.find(x => x.id === id), cor = by('cor'), cot = by('cot');
  if (!cor || !cot || cot.r.length !== 1 || ar(cot.r[0]) <= 1.5 * COT) return L;
  const h = cot.r[0], e = cor.r.map(c => touch(h, c)).find(Boolean); if (!e) { fl.push(`Layout draft fill-hub: cot store ${Math.round(ar(h))} m² has no corridor wall: left as drawn (?)`); return L; }
  const ax = e.ax, depth = ax === 'b' ? h[1] - h[0] : h[3] - h[2], kl = COT / depth, lo = ax === 'b' ? h[2] : h[0];
  const keep = ax === 'b' ? [h[0], h[1], lo, lo + kl] : [lo, lo + kl, h[2], h[3]], rest = ax === 'b' ? [h[0], h[1], lo + kl, h[3]] : [lo + kl, h[1], h[2], h[3]];
  cot.r = [keep.map(ctx.r2)];
  const van = S.city === 'van', hubGross = () => ctx.sum(R1.filter(x => x.block === 'hub' && x.kind === 'proom' && /^(ref|shel)/.test(x.id)).map(x => ctx.sum(x.r.map(ar))));
  const overCap = !van && hubGross() + ar(rest) > 500 + EPS;    
  const r2 = by('ref2'), piece = { r: [rest.map(ctx.r2)] };
  let what;
  if (r2 && shares(r2, piece)) { r2.r.push(rest.map(ctx.r2)); what = `joined to ${r2.n.split(' (')[0]}`; }
  else { let k = 0; const ids = new Set(Object.values(L.rooms).flat().map(x => x.id)); do { k++; } while (ids.has('refg' + k));
    R1.push(ctx.room(1, 'refg' + k, 'Refuge, grown into the cot store', 'pub', 'proom', [rest.map(ctx.r2)], { block: 'hub', closed: true, perPersonM2: 0.75, suite: 'program' }));
    what = 'a refuge room off the corridor'; }
  if (overCap) what += '; over the 500 m² cap: needs approval (needs a rezoning; Zoning Bylaw 20001 3.12.1; approval path, project decision, 17ac) [fill-hub:over-cap]';  fl.push(`Layout draft fill-hub: cot and supply storage ${Math.round(ar(h))} → ${COT} m²; ${Math.round(ar(rest))} m² → ${what} (refuge grows first, spec Part 1; project decision, 17f)`);
  return L; }

 
const W1 = 5.6, WN = 5.1, EXAM = 12, EW = 3.0, ED = EXAM / EW, KEEPW = 2.4, MAXEX = 13, CMIN = 16;
 
const TRAVEL_GUARD = 40;
function farTravel(R, rr) { const ex = R.filter(x => x.stair || x.kind === 'exitpas' || /^pas\d*$/.test(x.id)); if (!ex.length) return 0;
  const corners = [[rr[0], rr[2]], [rr[0], rr[3]], [rr[1], rr[2]], [rr[1], rr[3]]];
  const d = (p, q) => Math.max(q[0] - p[0], 0, p[0] - q[1]) + Math.max(q[2] - p[1], 0, p[1] - q[3]);
  return Math.max(...corners.map(p => Math.min(...ex.flatMap(x => x.r.map(q => d(p, q)))))); }
function wNeed(n) { return n > 0 ? W1 + WN * (n - 1) : 0; }
function clinicWaiting(L, ctx) {
  const fl = L.flags || (L.flags = []);
  for (const st of Object.keys(L.rooms)) { const R = L.rooms[st], ccor = R.find(x => x.id === 'ccor'), wait = R.find(x => x.g === 'clin' && /clinic waiting/i.test(x.n));
    if (!ccor || !wait) continue;
    const all = Object.values(L.rooms).flat(), nExam = all.filter(x => x.g === 'clin' && /^exam room/i.test(x.n)).length, nProc = all.filter(x => x.g === 'clin' && /^procedure/i.test(x.n)).length;
    const aW = ctx.sum(wait.r.map(ar)); let n = nExam + nProc, add = 0; const free0 = aW - wNeed(n);
    if (free0 <= Math.max(EXAM, 0.5 * wNeed(n)) + EPS) continue;    
    while (nExam + add < MAXEX && aW - wNeed(n + add + 1) - EXAM * (add + 1) >= -EPS) add++;
     
    const ids = new Set(all.map(x => x.id)); let made = 0, k = nExam, skipped = 0;
    for (const h of wait.r.slice()) for (const c of ccor.r) { const e = touch(h, c); if (!e || made >= add) continue;
      const side = Math.abs(h[0] - c[1]) < EPS ? 'a0' : Math.abs(h[1] - c[0]) < EPS ? 'a1' : Math.abs(h[2] - c[3]) < EPS ? 'b0' : 'b1';
      const depth = (side === 'a0' || side === 'a1') ? h[1] - h[0] : h[3] - h[2]; if (depth < ED - EPS) continue;
      const dd = depth < ED + KEEPW ? depth : ED;    
      let s = e.hi - EW;
      while (made < add && s >= e.lo + KEEPW - EPS && ctx.sum(wait.r.map(ar)) - EW * dd >= wNeed(n + made + 1) - EPS) {    
        const rr = (side === 'a0' ? [h[0], h[0] + dd, s, s + EW] : side === 'a1' ? [h[1] - dd, h[1], s, s + EW] : side === 'b0' ? [s, s + EW, h[2], h[2] + dd] : [s, s + EW, h[3] - dd, h[3]]).map(ctx.r2);
        if (farTravel(R, rr) > TRAVEL_GUARD) { skipped++; s -= EW; continue; }    
        wait.r = ctx.subAll(wait.r, [rr]); do { k++; } while (ids.has('ex' + k)); ids.add('ex' + k);
        R.push(ctx.room(+st, 'ex' + k, `Exam room ${k}`, 'clin', 'croom', [rr], { block: wait.block, closed: true, suite: 'program', prog: 'exam' })); made++; s -= EW; } }
    const left = ctx.sum(wait.r.map(ar)) - wNeed(n + made);
    fl.push(`Layout draft fill-hub (project decision, 17x): clinic waiting ${Math.round(aW)} → ${Math.round(ctx.sum(wait.r.map(ar)))} m² (need ${wNeed(n + made).toFixed(1)} m² for ${n + made} exam and procedure rooms: VA Primary Care criteria, 5.6 + 5.1 m² a room); ${made} exam room(s) added (to ${nExam + made} of ${MAXEX})` +
      (made < add ? `; ${add - made} more would fit by area but not on the clinic-corridor wall${skipped ? ` within ${TRAVEL_GUARD} m of an exit (travel guard; ${skipped} place(s) skipped) [fill-hub:travel-guard]` : ''} (?)` : '') + (left >= CMIN ? `; ${Math.round(left)} m² still over the need stays in the waiting room (community rooms there need their own corridor wall, not cut here) (?)` : '')); }
  return L; }
const api = { hooks: { fill }, lots: {
  V339_emergency_hub: 'no change (cot 11 m²)',
  P10003_emergency_hub: 'queue 17:12: cot 168 → 11 m²; refuge room 157 m² off the corridor; MW 1.73 unchanged; C4 flag → fail (WC count behind the higher load: washrooms-vg runs after the fill, 17f order; card row)',
  V1360_emergency_hub: 'no change expected (cot 4 m², no clinic) From 07d0c17 (face rule, project decision option A): doesn\'t fit, narrow lot, front row 0.10 m short (13.66 vs 13.56 m; named reason, 17ai item 3, corrected 18a); default and draft both no plan.',
  L22860743_emergency_hub: 'queue 17:12 (ba20cd8, full halls): 6 exam rooms of 16.2 m² (to 11 of 13), waiting 174 → 77 m²; MW 4.435 unchanged; no rows changed',
  L22861245_emergency_hub: 'queue 17:12 (ba20cd8, full halls): 6 exam rooms of 16.2 m² (to 11 of 13), waiting 175 → 78 m²; MW 4.443 unchanged; no rows changed', L23063395_emergency_hub: 'queue 17:12 (ba20cd8, full halls): 6 exam rooms of 16.2 m² (to 11 of 13), waiting 175 → 78 m²; MW 2.223 unchanged; no rows changed' }, clinicWaiting, wNeed };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.layoutFillHub = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['fill-shelter'] = (function (module) {
 
(function (root) {
'use strict';
const REST = 60, DMIN = 16, DMAX = 48, DW = 4.0, LOCK = 8, EPS = 1e-6;
const NAME = k => `Drop-in and activity room ${k} (program room, posted occupant load)`;
const ar = r => (r[1] - r[0]) * (r[3] - r[2]);
function touch(h, c) {    
  if (Math.abs(h[0] - c[1]) < EPS || Math.abs(h[1] - c[0]) < EPS) { const lo = Math.max(h[2], c[2]), hi = Math.min(h[3], c[3]); if (hi - lo > 1) return { ax: 'b', lo, hi }; }
  if (Math.abs(h[2] - c[3]) < EPS || Math.abs(h[3] - c[2]) < EPS) { const lo = Math.max(h[0], c[0]), hi = Math.min(h[1], c[1]); if (hi - lo > 1) return { ax: 'a', lo, hi }; }
  return null; }
function cutsAlong(h, ax, total) {    
  const depth = ax === 'b' ? h[1] - h[0] : h[3] - h[2], len = ax === 'b' ? h[3] - h[2] : h[1] - h[0];
  let n = Math.max(1, Math.ceil(ar(h) / DMAX)); while (n > 1 && (len / n < DW - EPS || ar(h) / n < DMIN - EPS)) n--;
  const step = len / n, out = [];
  for (let i = 0; i < n; i++) { const a = (ax === 'b' ? h[2] : h[0]) + i * step, b = i === n - 1 ? (ax === 'b' ? h[3] : h[1]) : a + step;
    out.push(ax === 'b' ? [h[0], h[1], a, b] : [a, b, h[2], h[3]]); }
  return out; }
function fill(L, S, def, ctx) {
  if (!L || !L.rooms || !L.rooms[1] || !(S && S.hubTyp && S.hubTyp.id === 'shelter_laundry')) return L;
  const R1 = L.rooms[1], fl = L.flags || (L.flags = []), by = id => R1.find(x => x.id === id), cor = by('cor'), lob = by('lob');
  if (!cor) { fl.push('Layout draft fill-shelter: no public corridor at grade; nothing changed'); return L; }
  const ids = new Set(Object.values(L.rooms).flat().map(x => x.id)); let k = 0;
  const add = (rr, from) => { do { k++; } while (ids.has('dropin' + k)); ids.add('dropin' + k);
    R1.push(ctx.room(1, 'dropin' + k, NAME(k), 'pub', 'proom', [rr.map(ctx.r2)], { block: from.block || 'hub', closed: true, prog: 'drop_in_room', perPersonM2: 1.85, sign: true, fill: true })); return 'dropin' + k; };
  const made = [], notes = [];
   
  const ref = by('ref');
  if (ref && ref.r.length > 1 && ref.r.reduce((t, q) => t + ar(q), 0) > REST + DMIN) notes.push(`rest area ${Math.round(ref.r.reduce((t, q) => t + ar(q), 0))} m² is drawn in ${ref.r.length} pieces (grown round the rooms), so it is not cut to ${REST} m²: drop-in rooms need their own corridor wall [fill-shelter:rest-area-irregular] (?)`);
  if (ref && ref.r.length === 1 && ar(ref.r[0]) > REST + DMIN) { const h = ref.r[0], e = touch(h, cor.r[0]) || cor.r.map(c => touch(h, c)).find(Boolean);
    if (e) { const ax = e.ax, lo = ax === 'b' ? h[2] : h[0], hi = ax === 'b' ? h[3] : h[1], depth = ax === 'b' ? h[1] - h[0] : h[3] - h[2], keepL = REST / depth;
      const lobHi = lob && lob.r.some(q => ax === 'b' ? Math.abs(q[2] - hi) < EPS : Math.abs(q[0] - hi) < EPS);    
      const keep = lobHi ? (ax === 'b' ? [h[0], h[1], hi - keepL, hi] : [hi - keepL, hi, h[2], h[3]]) : (ax === 'b' ? [h[0], h[1], lo, lo + keepL] : [lo, lo + keepL, h[2], h[3]]);
      const rest = lobHi ? (ax === 'b' ? [h[0], h[1], lo, hi - keepL] : [lo, hi - keepL, h[2], h[3]]) : (ax === 'b' ? [h[0], h[1], lo + keepL, hi] : [lo + keepL, hi, h[2], h[3]]);
      ref.r = [keep.map(ctx.r2)]; const cs = cutsAlong(rest, ax); cs.forEach(p => made.push(add(p, ref))); notes.push(`rest area ${Math.round(ar(h))} → ${REST} m²`);
      if (cs.some(p => ar(p) > DMAX + 0.05)) notes.push(`drop-in rooms ${cs.map(p => Math.round(ar(p))).join(', ')} m²: over the ${DMAX} m² repeat size, because ${cs.length + 1} rooms would be under ${DW} m wide on the ${Math.round((ax === 'b' ? rest[3] - rest[2] : rest[1] - rest[0]) * 10) / 10} m corridor wall [fill-shelter:over-repeat-size] (?)`); }
    else notes.push('rest area not on the corridor: left as drawn'); }
   
  const r2 = by('ref2');
  if (r2) { const a2 = ctx.sum(r2.r.map(ar)); Object.assign(r2, { n: `Drop-in and activity room (program room, posted occupant load; one room: no corridor reaches its back floor)`, prog: 'drop_in_room', perPersonM2: 1.85, sign: true, keepName: true });
    notes.push(`grown rest area ${Math.round(a2)} m² kept as one drop-in and activity room (its doors as drawn; over the 48 m² repeat size: rooms need a corridor through it, Code / programRooms) (?)`); }
   
  const cot = by('cot');
  if (cot && cot.r.length === 1 && ar(cot.r[0]) > 1.5 * LOCK) { const h = cot.r[0], e = cor.r.map(c => touch(h, c)).find(Boolean);
    if (e) { const ax = e.ax, depth = ax === 'b' ? h[1] - h[0] : h[3] - h[2], kl = LOCK / depth, lo = ax === 'b' ? h[2] : h[0];
      cot.r = [(ax === 'b' ? [h[0], h[1], lo, lo + kl] : [lo, lo + kl, h[2], h[3]]).map(ctx.r2)];
      const rest = ax === 'b' ? [h[0], h[1], lo + kl, h[3]] : [lo + kl, h[1], h[2], h[3]]; if (ar(rest) >= DMIN) cutsAlong(rest, ax).forEach(p => made.push(add(p, cot))); else cot.r = [h.map(ctx.r2)];
      notes.push(`lockers ${Math.round(ar(h))} → ${LOCK} m²`); } }
   
  const drops = R1.filter(x => x.prog === 'drop_in_room'); drops.forEach(x => { x.suite = 'program'; delete x.sep; });
  if (S.city === 'edm' && drops.length) notes.push('Edmonton: drop-in rooms are the shelter\'s program floor; if the shelter is over the 500 m² cap (G1), it needs approval (needs a rezoning; Zoning Bylaw 20001 3.12.1; approval path, project decision, 17ac) [fill-shelter:over-cap]');
   
  for (const st of Object.keys(L.rooms).filter(s => +s > 1)) { const sp = L.rooms[st].filter(x => x.kind === 'spare'); const a = ctx.sum(sp.map(x => ctx.sum(x.r.map(ar))));
    if (a > 1) notes.push(`storey ${st}: ${Math.round(a)} m² of spare floor with no public stair or lift to it (the clinic step dropped them): left for Code (services rooms need a public core) (?)`); }
  fl.push(`Layout draft fill-shelter (project decision, 17e): ${made.length} drop-in and activity room(s) at grade (1.85 m² a person, posted sign); ${notes.join('; ') || 'nothing else'}`);
  return L; }
const api = { hooks: { fill }, lots: {
  V339_shelter_laundry: 'queue 16:34 (full halls, patchHard on): rest area 184 → 60 m²; 3 drop-in rooms of 41.4 m²; the grown room relabelled drop-in; MW 3.248 unchanged; no rows changed. (HALLS=1 gave 2 × 61 m², flagged over-repeat-size: a different plan.)',
  V1360_shelter_laundry: '5f1424d, patchHard ON, HALLS=1: no room moves; the rest area (179 m²) is drawn in 12 pieces grown round the rooms, flagged rest-area-irregular; storey 2 spare (109 m²) flagged; MW 0.40 From 07d0c17 (face rule, project decision option A): doesn\'t fit, narrow lot, front row 0.10 m short (13.66 vs 13.56 m; named reason, 17ai item 3, corrected 18a); default and draft both no plan.',
  E4103_shelter_laundry: '5f1424d, patchHard ON, HALLS=1: rest area 228 → 60 m²; lockers 166 → 8 m²; 8 drop-in rooms of 39.5-42 m²; no new hard rows; MW 2.73' } };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.layoutFillShelter = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['chem-door'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutChemDoor = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EPS = 1e-6;
  const CHEM_ID = /^(hypochlorite|hypochlorite_store|chlorine|acid|acid_store)$/, CHEM_N = /hypochlorite|chlorine room|acid store|chemical store/i;
  const isChem = x => !!x && (CHEM_ID.test(String(x.id || '').replace(/_c\d+$/, '')) || CHEM_ID.test(String(x.prog || '')));    
  const isPublic = x => !!x && (['pcor', 'lobby'].includes(x.kind) || x.id === 'cor' || x.id === 'lob' || /public corridor|lobby/i.test(x.n || '') || ((x.g === 'pub' || x.g === 'grow') && !/plant|mech/i.test(x.n || '')));
  const isPlant = x => !!x && x.g === 'plant' && !isChem(x);
  const isSvcCor = x => !!x && (x.kind === 'scor' || /service corridor/i.test(x.n || '')) && !isPublic(x);
   
  function shared(A, B) { let best = null;
    for (const r of A.r) for (const q of B.r) {
      if (Math.abs(r[1] - q[0]) < EPS || Math.abs(r[0] - q[1]) < EPS) { const at = Math.abs(r[1] - q[0]) < EPS ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'v', at, f, t, len: t - f }; }
      if (Math.abs(r[3] - q[2]) < EPS || Math.abs(r[2] - q[3]) < EPS) { const at = Math.abs(r[3] - q[2]) < EPS ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'h', at, f, t, len: t - f }; } }
    return best; }
  const mid = s => s.o === 'v' ? [s.at, (s.f + s.t) / 2] : [(s.f + s.t) / 2, s.at];
  function viaOf(def, id) { const c = ((def && def.constraints) || []).find(c => c.type === 'accessOnlyVia' && c.room === id); return c ? (c.via || []).map(v => v === 'public_corridor' ? 'cor' : v) : null; }
   
  function predicted(x, R1, def, dW) { const by = id => R1.find(y => y.id === id), ok = y => { const s = y && shared(x, y); return s && s.len >= dW + 0.1 ? y : null; };
    if (x.withOf) return [by(x.withOf)].filter(Boolean);
    const via = viaOf(def, x.id); if (via) return via.filter(v => v !== 'exterior').map(v => ok(by(v))).filter(Boolean);
    const first = (x.wet || x.g === 'plant') ? ['cor', 'xcor', 'lob'] : ['lob', 'cor', 'xcor']; for (const id of first) { const y = ok(by(id)); if (y) return [y]; } return []; }
  function chemDoor(L, S, def, ctx) {
    const R1 = (L.rooms || {})[1] || [], dW = (ctx && ctx.RULES && ctx.RULES.door && ctx.RULES.door.w) || 0.9;
    L.flags = L.flags || []; L.chemDoor = [];
    for (const x of R1.filter(isChem)) {
      const pred = predicted(x, R1, def, dW), pub = pred.filter(isPublic), via = viaOf(def, x.id);
      const noDoor = !pred.length && !(via && via.includes('exterior')) && !(x.g === 'plant' && x.r.some(r => r[2] < EPS || r[0] < EPS));
      if (!pub.length && !noDoor) continue;
      const r0 = x.r[0], from = pub.length ? mid(shared(x, pub[0])) : [(r0[0] + r0[1]) / 2, (r0[2] + r0[3]) / 2], cands = [];
      for (const y of R1) { if (y === x || !(isPlant(y) || isSvcCor(y))) continue; const s = shared(x, y); if (!s || s.len < dW + 0.1) continue;
        const m = mid(s); cands.push({ y, d: Math.hypot(m[0] - from[0], m[1] - from[1]), plant: isPlant(y) }); }
      cands.sort((a, b) => (a.d - b.d) || (b.plant - a.plant));
      const name = (x.n || x.id).split(' (')[0];
      if (cands.length) { const y = cands[0].y; x.withOf = y.id;
        L.chemDoor.push({ store: x.id, from: pub.map(p => p.id), to: y.id });
        L.flags.push(`Layout draft chem-door (17y 1a): ${name} door ${pub.length ? 're-hung from ' + pub.map(p => (p.n || p.id).split(' (')[0]).join(', ') : '(none drawn: no corridor or lobby wall, e.g. after chem-place)'} to ${(y.n || y.id).split(' (')[0]} (a chemical store opens only onto a plant room, a service corridor or outside)`); }
      else { L.chemDoor.push({ store: x.id, from: pub.map(p => p.id), to: null });
        L.flags.push(`Layout draft chem-door (17y 1a): chemical store: no non-public wall for its door (${name}: no plant room or service corridor beside it with a ${(dW + 0.1).toFixed(1)} m wall; an exterior door is drawn only from the definition's accessOnlyVia 'exterior') (flag)`); }
    }
    return L;
  }
  const hooks = { fill: chemDoor };
  const lots = {
    'E11814_heat_cascade': 'hypochlorite store and acid store: corridor doors re-hung into the pool plant (1.70 m walls). The reloaded definition gives the hypochlorite store no accessOnlyVia, so finish() would now draw it a corridor door too (the 17 Nov export, old definition, had exterior only). CHEM-ACCESS fail → pass',
    'E06B_warm_bath': 'chlorine room: corridor door re-hung into the bath plant (its exterior door goes too, see the side effect); acid store: corridor door re-hung into the bath plant (1.50 m wall); CHEM-ACCESS fail → pass; E6 delivery-door clause: the chlorine room has no door to OUT any more, so E6 reads its delivery door as "?" ("delivery route not drawn"), the plant room\'s outside door being the route (E6 hard: "?" is not a fail) (likely)',
    'P4103_community_pool': 'chlorine room: corridor door re-hung into the pool plant (1.70 m wall; its exterior door goes too); acid store unchanged (definition: via pool plant); CHEM-ACCESS fail → pass; E6 delivery-door clause: the chlorine room loses its door to OUT, so E6 reads "?" for it (the old door\'s 0.9 m ground test, which failed on this lot, no longer applies to the store) (likely)',
    'P10003_community_pool': 'chlorine room: flag "no non-public wall for its door" (neighbours: public corridor, acid store, exit passage; it keeps its corridor and exterior doors until the engine line); acid unchanged; CHEM-ACCESS stays fail',
    'every other plan': 'no change (V339 / V1515 heat cascade stores already open only onto the pool plant or outside)'
  };
  return { hooks, lots, chemDoor, predicted, isChem, isPublic, shared };
});

return module.exports; })({ exports: {} });
 
P['plant-deck'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD['layoutPlant-deck'] = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const MIN = 1.0, MAXGAP = 3.0, EPS = 1e-6;    
  const isPlant = x => /^(pool_plant|bath_plant|spa_plant)$/.test(x.id) || (x.g === 'plant' && /pool plant|bath plant|^spa .*plant/i.test(x.n || ''));
  const isHall = x => x.waterM2 != null || /^(pool_hall|spa_hall|therapy_hall|learner)$/.test(x.id);
  const wall = (A, B) => { let t = 0; const ov = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
    for (const a of A.r) for (const b of B.r) { if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(a[0] - b[1]) < 1e-6) t += ov(a[2], a[3], b[2], b[3]); if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(a[2] - b[3]) < 1e-6) t += ov(a[0], a[1], b[0], b[1]); } return t; };
  const hit = (q, r) => Math.min(q[1], r[1]) - Math.max(q[0], r[0]) > 1e-6 && Math.min(q[3], r[3]) - Math.max(q[2], r[2]) > 1e-6;
  function strip(a, b) {
    const out = [], ovV = [Math.max(a[2], b[2]), Math.min(a[3], b[3])], ovU = [Math.max(a[0], b[0]), Math.min(a[1], b[1])];
    if (ovV[1] - ovV[0] >= MIN - EPS) { if (b[1] <= a[0] + EPS) out.push(Object.assign([b[1], a[0], ovV[0], ovV[1]], { ax: 'v' })); if (a[1] <= b[0] + EPS) out.push(Object.assign([a[1], b[0], ovV[0], ovV[1]], { ax: 'v' })); }
    if (ovU[1] - ovU[0] >= MIN - EPS) { if (b[3] <= a[2] + EPS) out.push(Object.assign([ovU[0], ovU[1], b[3], a[2]], { ax: 'u' })); if (a[3] <= b[2] + EPS) out.push(Object.assign([ovU[0], ovU[1], a[3], b[2]], { ax: 'u' })); }
    return out.filter(s => s[1] - s[0] > EPS && s[3] - s[2] > EPS);
  }
  function depthOf(s) { return s.ax === 'v' ? s[1] - s[0] : s[3] - s[2];
  }
  function corridorEnd(L, S, ctx) {
    const st1 = L && L.rooms && L.rooms[1]; if (!st1) return L;
    const r2 = ctx && ctx.r2 ? ctx.r2 : (x => Math.round(x * 100) / 100), ra = q => (q[1] - q[0]) * (q[3] - q[2]), H = st1.filter(isHall);
    if (!H.length) return L;
    for (const p of st1.filter(isPlant)) {
      if (H.some(h => wall(p, h) >= MIN - EPS)) continue;
      let done = false, why = 'plant-deck:not-alongside', between = [];
      for (const h of H) { for (const a of p.r) for (const b of h.r) for (let s of strip(a, b)) {
        const blk = st1.filter(x => x !== p && x !== h && x.r.some(q => hit(q, s)));
        if (blk.length) {
          const alongV = s.ax === 'v', lo = alongV ? s[2] : s[0], hi = alongV ? s[3] : s[1];
          const cuts = blk.flatMap(x => x.r.filter(q => hit(q, s)).map(q => alongV ? [q[2], q[3]] : [q[0], q[1]])).sort((x, y) => x[0] - y[0]);
          let best = null, cur = lo; for (const [c0, c1] of cuts.concat([[hi, hi]])) { if (c0 - cur >= MIN - EPS && (!best || c0 - cur > best[1] - best[0])) best = [cur, Math.min(c0, hi)]; cur = Math.max(cur, c1); }
          if (!best) { why = 'plant-deck:rooms-between'; between = between.concat(blk.map(x => x.id)); continue; }
          s = Object.assign(alongV ? [s[0], s[1], best[0], best[1]] : [best[0], best[1], s[2], s[3]], { ax: s.ax });
        }
        if (depthOf(s) > MAXGAP + EPS) { if (why !== 'plant-deck:rooms-between') why = 'plant-deck:gap-too-wide'; continue; }
        if (done) continue;
        p.r.push([s[0], s[1], s[2], s[3]].map(r2)); done = true;
        if (L.flags) L.flags.push(`Layout draft plant-deck: ${p.id} had no wall with ${h.id}; the empty ${r2(s[1] - s[0])} x ${r2(s[3] - s[2])} m strip between them (${r2(ra(s))} m²) joins ${p.id}, so its locked door from the enclosure can be drawn (NBC(AE) 7.2.3.38.(1)).`);
      } if (done) break; }
      if (!done && L.flags) L.flags.push(`Layout draft plant-deck: ${p.id} shares no wall with ${H.map(h => h.id).join(' / ')}: no locked door from the enclosure (${why}${between.length ? ': ' + [...new Set(between)].join(', ') : ''}).`);
    }
    return L;
  }
  const hooks = { corridorEnd };
  const lots = {
    'V339_warm_bath': 'the empty 0.8 m strip between spa_hall and bath_plant joins the plant (about 7 m²); they share a wall; with bath_plant in the halls\' accessOnlyVia (WB definition 18 Nov) finish() draws the locked door; MW unchanged',
    'P339_community_pool': 'unchanged (pool_plant shares 9.1 m with pool_hall; door already drawn)',
    'P4103_community_pool': 'flagged plant-deck:rooms-between (lob, desk): the family puts the plant behind the lobby; engine family fix needed (Code)',
    'P10003_community_pool': 'flagged plant-deck:rooms-between (xcor): the cross corridor runs between hall and plant; engine family fix needed (Code)',
    'E06B_warm_bath': 'flagged plant-deck:rooms-between (lob)'
  };
  return { hooks, lots, corridorEnd };
});

return module.exports; })({ exports: {} });
 
P['change-deck'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD['layoutChange-deck'] = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const MIN = 1.0, MAXGAP = 3.0, EPS = 1e-6;    
  const isChange = x => /^(change_(w|m|u)|universal_change)$/.test(x.id) || /^change room|^universal (dressing|change)/i.test(x.n || '');
  const wall = (A, B) => { let t = 0; const ov = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
    for (const a of A.r) for (const b of B.r) { if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(a[0] - b[1]) < 1e-6) t += ov(a[2], a[3], b[2], b[3]); if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(a[2] - b[3]) < 1e-6) t += ov(a[0], a[1], b[0], b[1]); } return t; };
  const hit = (q, r) => Math.min(q[1], r[1]) - Math.max(q[0], r[0]) > 1e-6 && Math.min(q[3], r[3]) - Math.max(q[2], r[2]) > 1e-6;
  function hallsFor(c, st1, def) {
    const halls = st1.filter(x => x.waterM2 != null || /^(pool_hall|spa_hall|therapy_hall|learner)$/.test(x.id));
    const via = ((def && def.constraints) || []).filter(k => k.type === 'accessOnlyVia' && Array.isArray(k.via) && k.via.includes(c.id)).map(k => k.room);
    return via.length ? halls.filter(h => via.includes(h.id)) : halls;
  }
   
  function strip(a, b) {
    const out = [], ovV = [Math.max(a[2], b[2]), Math.min(a[3], b[3])], ovU = [Math.max(a[0], b[0]), Math.min(a[1], b[1])];
    if (ovV[1] - ovV[0] >= MIN - EPS) { if (b[1] <= a[0] + EPS) out.push(Object.assign([b[1], a[0], ovV[0], ovV[1]], { ax: 'v' })); if (a[1] <= b[0] + EPS) out.push(Object.assign([a[1], b[0], ovV[0], ovV[1]], { ax: 'v' })); }
    if (ovU[1] - ovU[0] >= MIN - EPS) { if (b[3] <= a[2] + EPS) out.push(Object.assign([ovU[0], ovU[1], b[3], a[2]], { ax: 'u' })); if (a[3] <= b[2] + EPS) out.push(Object.assign([ovU[0], ovU[1], a[3], b[2]], { ax: 'u' })); }
    return out.filter(s => s[1] - s[0] > EPS && s[3] - s[2] > EPS);
  }
  function depthOf(s) { return s.ax === 'v' ? s[1] - s[0] : s[3] - s[2];
  }
  function corridorEnd(L, S, ctx) {
    const st1 = L && L.rooms && L.rooms[1]; if (!st1) return L;
    const def = (S && (S.typDef || S.wingTyp)) || null, r2 = ctx && ctx.r2 ? ctx.r2 : (x => Math.round(x * 100) / 100), ra = q => (q[1] - q[0]) * (q[3] - q[2]);
    for (const c of st1.filter(isChange)) {
      const H = hallsFor(c, st1, def); if (!H.length) { if (L.flags) L.flags.push(`Layout draft change-deck: ${c.id} has no pool hall to serve (change-deck:no-hall).`); continue; }
      if (H.some(h => wall(c, h) >= MIN - EPS)) continue;
      let done = false, why = 'change-deck:not-alongside', between = [];
      for (const h of H) { for (const a of c.r) for (const b of h.r) for (let s of strip(a, b)) {
        const blk = st1.filter(x => x !== c && x !== h && x.r.some(q => hit(q, s)));
        if (blk.length) {    
          const alongV = s.ax === 'v';    
          const lo = alongV ? s[2] : s[0], hi = alongV ? s[3] : s[1], cuts = blk.flatMap(x => x.r.filter(q => hit(q, s)).map(q => alongV ? [q[2], q[3]] : [q[0], q[1]])).sort((p, q) => p[0] - q[0]);
          let best = null, cur = lo; for (const [c0, c1] of cuts.concat([[hi, hi]])) { if (c0 - cur >= MIN - EPS && (!best || c0 - cur > best[1] - best[0])) best = [cur, Math.min(c0, hi)]; cur = Math.max(cur, c1); }
          if (!best) { why = 'change-deck:rooms-between'; between = between.concat(blk.map(x => x.id)); continue; }
          s = alongV ? [s[0], s[1], best[0], best[1]] : [best[0], best[1], s[2], s[3]];
        }
        if (depthOf(s) > MAXGAP + EPS) { if (why !== 'change-deck:rooms-between') why = 'change-deck:gap-too-wide'; continue; }
        if (done) continue;
        c.r.push([s[0], s[1], s[2], s[3]].map(r2)); done = true;
        if (L.flags) L.flags.push(`Layout draft change-deck: ${c.id} had no wall with ${h.id}; the empty ${r2(s[1] - s[0])} x ${r2(s[3] - s[2])} m strip between them (${r2(ra(s))} m²) joins ${c.id}, so its deck door can be drawn (NBC(AE) 7.2.4.3.(2), 7.2.4.7.(5)).`);
      } if (done) break; }
      if (!done && L.flags) L.flags.push(`Layout draft change-deck: ${c.id} shares no wall with ${H.map(h => h.id).join(' / ')} and cannot reach it: not fixed (${why}${between.length ? ': ' + [...new Set(between)].join(', ') : ''}).`);
    }
    return L;
  }
  const hooks = { corridorEnd };
  const lots = {
    'E06B_warm_bath': 'change_w and change_m each take the empty strip between them and the spa hall (3.0 m deep; about 7.5 and 4.5 m²) and touch the hall; change_u (south of the hall) flagged change-deck:not-alongside; MW unchanged',
    'V339_warm_bath': 'unchanged (change rooms already on the decks)',
    'P339_community_pool': 'unchanged', 'P4103_community_pool': 'unchanged', 'P10003_community_pool': 'unchanged'
  };
  return { hooks, lots, corridorEnd, strip };
});

return module.exports; })({ exports: {} });
 
P['CEND'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD.layoutCEND = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LIMIT = 6.0, HALF = 0.45, EPS = 1e-6;
  const suiteOf = r => r.suite || (r.block === 'data centre' ? 'dc' : 'program');
  const isCor = r => r && r.g === 'circ' && (r.kind === 'pcor' || r.kind === 'scor');
  const isExitOther = (o, by) => o === 'OUT' || o === 'YARD' || (by[o] && (by[o].kind === 'lobby' || by[o].kind === 'exitpas' || (by[o].stair && (by[o].kind === 'pcore' || by[o].kind === 'score'))));
  function analyse(L, ctx) {
    const st1 = L && L.rooms && L.rooms[1], D = (L && (L.Dbig || L.D)) || [], out = [];
    if (!st1) return out;
    const by = {}; st1.forEach(r => by[r.id] = r);
    for (const c of st1) {
      if (c.kind !== 'pcor' || c.g !== 'circ' || c.r.length !== 1) continue;
      const [a0, a1, b0, b1] = c.r[0], alongV = (b1 - b0) >= (a1 - a0), lo = alongV ? b0 : a0, hi = alongV ? b1 : a1;
      const doors = D.filter(d => d[0] === 1 && (d[1] === c.id || d[2] === c.id)), pos = d => alongV ? d[4] : d[3];
      const exits = doors.filter(d => isExitOther(d[1] === c.id ? d[2] : d[1], by)).map(pos).sort((x, y) => x - y);
      const seen = new Set([c.id]), todo = [c.id], suites = new Set();
      while (todo.length) { const id = todo.pop(); for (const d of D) { if (d[0] !== 1 || (d[1] !== id && d[2] !== id)) continue; const oid = d[1] === id ? d[2] : d[1], r = by[oid]; if (!r) continue;
        if (isCor(r)) { if (!seen.has(oid)) { seen.add(oid); todo.push(oid); } } else if (r.kind !== 'lobby' && r.kind !== 'exitpas') suites.add(suiteOf(r)); } }
      const o = { id: c.id, len: hi - lo, exits: exits.length, dead: null, stub: null, suites: [...suites].sort(), multi: suites.size > 1 };
      if (!exits.length) { o.dead = Infinity; o.reason = 'no exit'; }
      else if (exits.length === 1) { o.dead = Math.max(exits[0] - lo, hi - exits[0]); o.reason = 'single exit'; }
      else { const low = exits[0] - lo, high = hi - exits[exits.length - 1]; o.dead = Math.max(low, high); o.stub = low >= high ? { side: 'lo', from: exits[0] } : { side: 'hi', from: exits[exits.length - 1] }; }
      o.dead = o.dead === Infinity ? Infinity : Math.round(o.dead * 100) / 100;
      if (o.multi && o.dead > LIMIT - HALF + EPS) {
        o.over = true;
        if (o.stub) {
          const cutAt = o.stub.side === 'lo' ? o.stub.from - (LIMIT - HALF) : o.stub.from + (LIMIT - HALF);
          o.need = doors.filter(d => { const p = pos(d), other = d[1] === c.id ? d[2] : d[1]; return !isExitOther(other, by) && (o.stub.side === 'lo' ? p < cutAt - EPS : p > cutAt + EPS); }).map(d => (d[1] === c.id ? d[2] : d[1]));
          o.cutAt = cutAt; o.alongV = alongV; o.rect = c.r[0];
          if (o.need.length) o.reason = 'stub rooms need corridor doors';
        }
      }
      out.push(o);
    }
    return out;
  }

   
  const PAS = 1.2, YARD = 0.9;
  function suiteEgressShort(L, S, ctx) {
    const out = {}, rows = [].concat((L && L.rows) || [], (ctx && ctx.rows) || []);
    rows.forEach(r => {    
      if (!r || !/^SUITE-egress/.test(String(r.id || ''))) return;
      if (!/^fail/i.test(String(r.status || ''))) return;
      const t = String(r.text || '') + ' ' + String(r.title || '');
      const st = r.storey != null ? +r.storey : (r.st != null ? +r.st : (/storey\s*(\d+)/i.exec(t) || [])[1]);
      if (st != null && +st !== 1) return;                                    
      const suite = r.suite || (/suite\s*'?([a-z]+)/i.exec(t) || [])[1] || (/-(program|dc|community)\b/.exec(String(r.id)) || [])[1] || 'program';
      const n = typeof r.doorways === 'number' ? r.doorways : +((/(\d+)\s*(?:egress\s*)?doorway/i.exec(t) || [])[1] || 1);
      if (n < 2) out[suite] = n;
    });
    const se = S && S.suiteEgress; if (se) Object.keys(se).forEach(k => { if (se[k] < 2) out[k] = se[k]; });
    return out;
  }
  function segD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)); }
  function suiteEgress(L, S, ctx) {
    const short = suiteEgressShort(L, S, ctx), st1 = L && L.rooms && L.rooms[1]; if (!st1 || !Object.keys(short).length) return L;
    const D = L.Dbig || L.D || [], by = {}; st1.forEach(r => by[r.id] = r);
    const inside = (p) => st1.some(r => r.r.some(q => p[0] > q[0] - EPS && p[0] < q[1] + EPS && p[1] > q[2] - EPS && p[1] < q[3] + EPS));
    for (const suite of Object.keys(short)) {
      const cors = st1.filter(c => c.kind === 'pcor' && c.g === 'circ' && c.r.length === 1 && D.some(d => d[0] === 1 && (d[1] === c.id || d[2] === c.id) && by[d[1] === c.id ? d[2] : d[1]] && suiteOf(by[d[1] === c.id ? d[2] : d[1]]) === suite));
      let done = false, why = 'no corridor of the suite ends on the outside wall';
      for (const c of cors) {
        const [a0, a1, b0, b1] = c.r[0], alongV = (b1 - b0) >= (a1 - a0);
        const ends = alongV ? [['lo', [(a0 + a1) / 2, b0 - 0.3]], ['hi', [(a0 + a1) / 2, b1 + 0.3]]] : [['lo', [a0 - 0.3, (b0 + b1) / 2]], ['hi', [a1 + 0.3, (b0 + b1) / 2]]];
        for (const [side, probe] of ends) {
          if (inside(probe)) continue;                                    
          const endAt = side === 'lo' ? (alongV ? b0 : a0) : (alongV ? b1 : a1);
          if (D.some(d => d[0] === 1 && ((d[1] === c.id && d[2] === 'OUT') || (d[2] === c.id && d[1] === 'OUT')) && Math.abs((alongV ? d[4] : d[3]) - endAt) < 0.5)) { why = `the outside door at the ${side} end of ${c.id} is already there and did not count (ground beyond is not a valid exit, e.g. data-centre ground)`; continue; }
          const edges = (S && S.edges) || []; if (!edges.length || typeof L.toUV !== 'function') { why = 'no lot edges or frame in the hook'; continue; }
          const q = L.toUV(probe[0], probe[1]), p = Array.isArray(q) ? q : [q.u, q.v];
          let best = null; for (const e of edges) { const d = segD(p, e.a, e.b) + 0.3; if (!best || d < best.d) best = { d, e }; }
          if (!best || best.d < YARD - EPS) { why = `corridor end ${c.id} is ${best ? ctx.r2(best.d) : '?'} m from the lot line (yard under ${YARD} m)`; continue; }
          const cut = side === 'lo' ? (alongV ? [a0, a1, b0, b0 + PAS] : [a0, a0 + PAS, b0, b1]) : (alongV ? [a0, a1, b1 - PAS, b1] : [a1 - PAS, a1, b0, b1]);
          c.r = [side === 'lo' ? (alongV ? [a0, a1, b0 + PAS, b1] : [a0 + PAS, a1, b0, b1]) : (alongV ? [a0, a1, b0, b1 - PAS] : [a0, a1 - PAS, b0, b1])].map(x => x.map(ctx.r2));
          st1.push(Object.assign({ st: 1, id: 'pasCEND_' + c.id, n: 'Exit passage (suite egress)', g: 'circ', kind: 'exitpas', r: [cut.map(ctx.r2)], block: c.block }, c.suite ? { suite: c.suite } : {}));
          L.flags && L.flags.push(`Layout draft CEND: suite ${suite} has ${short[suite]} egress doorway(s) (SUITE-egress, 3.3.1.5); exit passage drawn at the ${side} end of ${c.id} (last ${PAS} m of the corridor, ${ctx.r2(best.d)} m to the ${best.e.abuts || 'lot'} line).`);
          done = true; break;
        }
        if (done) break;
      }
      if (!done) L.flags && L.flags.push(`Layout draft CEND: suite egress: no second doorway (suite ${suite}, ${short[suite]} doorway(s), SUITE-egress / 3.3.1.5). Named reason: ${why}.`);
    }
    return L;
  }
  function corridorEnd(L, S, ctx) {
    suiteEgress(L, S, ctx);
    const res = analyse(L, ctx), st1 = L.rooms[1];
    for (const o of res) {
      if (!o.over) continue;
      const txt = o.dead === Infinity ? 'no exit' : `${o.dead} m`;
      if (o.stub && !o.need.length) {    
        const c = st1.find(r => r.id === o.id), [a0, a1, b0, b1] = c.r[0];
        const strip = o.alongV ? (o.stub.side === 'lo' ? [a0, a1, b0, o.cutAt] : [a0, a1, o.cutAt, b1]) : (o.stub.side === 'lo' ? [a0, o.cutAt, b0, b1] : [o.cutAt, a1, b0, b1]);
        c.r = [o.alongV ? (o.stub.side === 'lo' ? [a0, a1, o.cutAt, b1] : [a0, a1, b0, o.cutAt]) : (o.stub.side === 'lo' ? [o.cutAt, a1, b0, b1] : [a0, o.cutAt, b0, b1])].map(q => q.map(ctx.r2));
        const sh = (q, r) => { const ov = (x0, x1, y0, y1) => Math.min(x1, y1) - Math.max(x0, y0); let w = 0; if (Math.abs(q[1] - r[0]) < EPS || Math.abs(q[0] - r[1]) < EPS) w += Math.max(0, ov(q[2], q[3], r[2], r[3])); if (Math.abs(q[3] - r[2]) < EPS || Math.abs(q[2] - r[3]) < EPS) w += Math.max(0, ov(q[0], q[1], r[0], r[1])); return w; };
        let best = null; for (const r of st1) { if (r === c || r.kind === 'pcor' || r.kind === 'scor') continue; const w = r.r.reduce((s, q) => s + sh(strip, q), 0); if (w > 0 && (!best || w > best.w)) best = { r, w }; }
        if (best) { best.r.r.push(strip.map(ctx.r2)); L.flags.push(`Layout draft CEND: multi-suite public corridor ${o.id} (suites ${o.suites.join(', ')}) dead end ${txt} cut back to ${LIMIT - HALF} m past its last exit (A5, 3.3.1.9.(5)); the cut-off ${ctx.r2(ctx.ra(strip))} m² joins ${best.r.n}.`); }
        else { c.r = [[a0, a1, b0, b1]]; L.flags.push(`Layout draft CEND: public corridor ${o.id} dead end ${txt}; no room beside the stub to take the cut-off strip: not cut (named reason: no neighbour).`); }
      } else L.flags.push(`Layout draft CEND: public corridor ${o.id} dead end ${txt} (limit ${LIMIT} m, A5): not cut back. Named reason: ${o.reason}${o.need && o.need.length ? ' (' + [...new Set(o.need)].join(', ') + ')' : ''}.`);
    }
    return L;
  }
  const hooks = { corridorEnd };
   
  const lots = {
    'P4103_community_pool': 'stub dead end 10.83 m, every room on the corridor is program (suite program only): single-suite, A5 limit does not apply; no flag, plan unchanged',
    'E06B_warm_bath': 'dead end 8.22 m, program rooms only: single-suite; no flag, plan unchanged',
    'E11814_heat_cascade': 'dead end 11.93 m, program rooms only (greenhouse, headhouse and pool rooms are all program): single-suite; no flag, plan unchanged',
    'P10003_community_pool': 'single-suite corridor (no dead-end limit). If the 3.3.1.5 row reports the program suite with one egress doorway (xcor OUT doors on DC ground do not count): cor ends on xcor and both xcor ends already carry outside doors that did not count, so flagged "suite egress: no second doorway" (named reason: that outside door is already there and did not count); plan unchanged',
    'P339_community_pool': 'no change'
  };
  return { hooks, lots, analyse, corridorEnd, suiteEgress };
});

return module.exports; })({ exports: {} });
 
P['door-relocate'] = (function (module) {
 
(function (root) {
'use strict';
const YARD = 0.9, WALK = 0.9, G = 0.25, EPS = 1e-6;
const SIDES = ['a0', 'a1', 'b0', 'b1'];
function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function inPolyF(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
 
function edgeOf(r, s) { return s === 'a0' ? { p: [r[0], r[2]], q: [r[0], r[3]], n: [-1, 0], len: r[3] - r[2] } : s === 'a1' ? { p: [r[1], r[2]], q: [r[1], r[3]], n: [1, 0], len: r[3] - r[2] }
  : s === 'b0' ? { p: [r[0], r[2]], q: [r[1], r[2]], n: [0, -1], len: r[1] - r[0] } : { p: [r[0], r[3]], q: [r[1], r[3]], n: [0, 1], len: r[1] - r[0] }; }
 
function exterior(R1, x, r, s) { const e = edgeOf(r, s), alongA = s[0] === 'b';
  return !R1.some(y => y.r.some(q => { if (y === x && q === r) return false;
    const touch = s === 'a0' ? Math.abs(q[1] - r[0]) < 0.02 : s === 'a1' ? Math.abs(q[0] - r[1]) < 0.02 : s === 'b0' ? Math.abs(q[3] - r[2]) < 0.02 : Math.abs(q[2] - r[3]) < 0.02;
    if (!touch) return false; const ov = alongA ? Math.min(q[1], r[1]) - Math.max(q[0], r[0]) : Math.min(q[3], r[3]) - Math.max(q[2], r[2]); return ov > 0.5; })); }
function make(L, S, ctx) {
  const T = (a, b) => { const u = L.toUV(a, b); return Array.isArray(u) ? u : [u.u, u.v]; }, ring = S.ring, R1 = L.rooms[1];
  const pub = (S.edges || []).filter(e => e.abuts === 'street' || e.abuts === 'alley'), nb = (S.edges || []).filter(e => !(e.abuts === 'street' || e.abuts === 'alley'));
  const inLot = p => (ctx && ctx.inPoly ? ctx.inPoly(p, ring) : inPolyF(p, ring));
  const blkL = R1.flatMap(x => x.r).concat(((L.plant && L.plant.items) || []).filter(i => !i.roof && !i.up && !i.pseudo && i.r).map(i => i.r));
  const blk = blkL.map(r => { const a = T(r[0], r[2]), c = T(r[1], r[3]); return [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])]; });
   
  function yardOf(e) { let d = 3; for (const f of [0.25, 0.5, 0.75]) { const m = [e.p[0] + (e.q[0] - e.p[0]) * f, e.p[1] + (e.q[1] - e.p[1]) * f];
      for (let s = 0.05; s <= 3 + EPS; s += 0.05) { const u = T(m[0] + e.n[0] * s, m[1] + e.n[1] * s); if (!inLot(u) || blk.some(r => u[0] > r[0] + EPS && u[0] < r[1] - EPS && u[1] > r[2] + EPS && u[1] < r[3] - EPS)) { d = Math.min(d, s - 0.05); break; } } }
    return d; }
   
  function facesPublic(e, y) { const m = [(e.p[0] + e.q[0]) / 2, (e.p[1] + e.q[1]) / 2], u = T(m[0] + e.n[0] * (y + 0.05), m[1] + e.n[1] * (y + 0.05));
    return pub.some(l => segDist(u, l.a, l.b) < 0.3); }
   
  let grid = null;
  function walk(p0) { if (!pub.length) return false;
    if (!grid) { const us = ring.map(p => p[0]), vs = ring.map(p => p[1]), u0 = Math.min(...us) - 1, v0 = Math.min(...vs) - 1, nu = Math.ceil((Math.max(...us) + 1 - u0) / G), nv = Math.ceil((Math.max(...vs) + 1 - v0) / G);
      if (nu * nv > 2e6) return null;
      const free = new Uint8Array(nu * nv); for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u = u0 + (i + 0.5) * G, v = v0 + (j + 0.5) * G;
        free[i * nv + j] = inPolyF([u, v], ring) && !blk.some(r => u > r[0] && u < r[1] && v > r[2] && v < r[3]) ? 1 : 0; }
      const H = Math.ceil(WALK / 2 / G) - 1, I = new Int32Array((nu + 1) * (nv + 1)), N = nv + 1;
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) I[(i + 1) * N + j + 1] = (free[i * nv + j] ? 0 : 1) + I[i * N + j + 1] + I[(i + 1) * N + j] - I[i * N + j];
      const ok = (i, j) => i >= H && j >= H && i < nu - H && j < nv - H && I[(i + H + 1) * N + j + H + 1] - I[(i - H) * N + j + H + 1] - I[(i + H + 1) * N + j - H] + I[(i - H) * N + j - H] === 0;
      grid = { u0, v0, nu, nv, ok }; }
    const { u0, v0, nu, nv, ok } = grid, i0 = Math.floor((p0[0] - u0) / G), j0 = Math.floor((p0[1] - v0) / G); if (i0 < 0 || j0 < 0 || i0 >= nu || j0 >= nv || !ok(i0, j0)) return false;
    const seen = new Uint8Array(nu * nv), q = [i0 * nv + j0]; seen[q[0]] = 1;
    while (q.length) { const k = q.pop(), i = Math.floor(k / nv), j = k % nv, u = u0 + (i + 0.5) * G, v = v0 + (j + 0.5) * G;
      if (pub.some(l => segDist([u, v], l.a, l.b) < 1.0)) return true;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i2 = i + a, j2 = j + b; if (i2 < 0 || j2 < 0 || i2 >= nu || j2 >= nv) continue; const k2 = i2 * nv + j2; if (!seen[k2] && ok(i2, j2)) { seen[k2] = 1; q.push(k2); } } }
    return false; }
  return { yardOf, facesPublic, walk, T, nb, pub };
}
function corridorEnd(L, S, ctx) {
  if (!L || !L.rooms || !L.rooms[1] || typeof L.toUV !== 'function' || !S || !Array.isArray(S.ring)) return L;
  const R1 = L.rooms[1], fl = L.flags || (L.flags = []), r2 = (ctx && ctx.r2) || (x => Math.round(x * 100) / 100), M = make(L, S, ctx), dW = (ctx && ctx.RULES && ctx.RULES.door && ctx.RULES.door.w) || 0.9;
  if (!M.nb.length) return L; let n = 0;
  for (const x of R1) {
    if (x.kind === 'bay' || x.g === 'hall' && !x.r.length) continue;
    x.r.forEach((r, k) => SIDES.forEach(s => {
      const e = edgeOf(r, s); if (e.len < dW + 0.1 || !exterior(R1, x, r, s)) return;
      const y = M.yardOf(e); if (y >= YARD - EPS || M.facesPublic(e, y)) return;    
       
      const m0 = [(e.p[0] + e.q[0]) / 2, (e.p[1] + e.q[1]) / 2]; let best = null, noRoute = false;
      x.r.forEach((r2_, k2) => SIDES.forEach(s2 => { if (k2 === k && s2 === s) return; const e2 = edgeOf(r2_, s2); if (e2.len < dW + 0.1 || !exterior(R1, x, r2_, s2)) return;
        const y2 = M.yardOf(e2); if (y2 < YARD - EPS && !M.facesPublic(e2, y2)) return;
        const L2 = Math.hypot(e2.q[0] - e2.p[0], e2.q[1] - e2.p[1]), tt = Math.max(0, Math.min(1, ((m0[0] - e2.p[0]) * (e2.q[0] - e2.p[0]) + (m0[1] - e2.p[1]) * (e2.q[1] - e2.p[1])) / (L2 * L2 || 1)));
        const half = (dW / 2 + 0.05) / L2, t = Math.max(half, Math.min(1 - half, tt)), dp = [e2.p[0] + (e2.q[0] - e2.p[0]) * t, e2.p[1] + (e2.q[1] - e2.p[1]) * t];
        const w = M.walk(M.T(dp[0] + e2.n[0] * 0.6, dp[1] + e2.n[1] * 0.6)); if (w === false) { noRoute = true; return; }
        const d = Math.hypot(dp[0] - m0[0], dp[1] - m0[1]); if (!best || d < best.d) best = { d, side: s2, k: k2, t: Math.round(t * 100) / 100, y: y2 }; }));
      const key = s + '/' + k, nm = String(x.n || x.id).split(' (')[0], why = `${nm}: its ${s} wall is ${r2(Math.max(0, y))} m from a neighbour lot line (under 0.9 m: no exterior door there, project decision, 12:17)`;
      x.extOverride = x.extOverride || {};
      if (best) { x.extOverride[key] = { side: best.side, t: best.t, k: best.k, flag: `Layout draft door-relocate: ${why}; any exterior door on it moves to the ${best.side} wall${best.k ? ' (part ' + (best.k + 1) + ')' : ''}, ${r2(best.d)} m along, with ${best.y >= 3 ? '3+' : r2(best.y)} m of yard and a 0.9 m walk to the street or lane [door-relocate:moved].` }; n++; return; }
       
      const exitRoom = x.stair || x.core || /core|^pas|exitpas|cor$/.test((x.kind || '') + ' ' + x.id) || /^(cor|xcor|ccor|scor|pcor|pas\d*|s\d|p\d)$/.test(x.id);
      const chem = /chlor|acid|chemical|plant|mech|pmec/i.test(x.id + ' ' + nm) || x.g === 'plant';
      const shares = z => z.r.some(q => x.r.some(p => (Math.abs(p[1] - q[0]) < 0.02 || Math.abs(p[0] - q[1]) < 0.02) && Math.min(p[3], q[3]) - Math.max(p[2], q[2]) > dW + 0.1 || (Math.abs(p[3] - q[2]) < 0.02 || Math.abs(p[2] - q[3]) < 0.02) && Math.min(p[1], q[1]) - Math.max(p[0], q[0]) > dW + 0.1));
      const isCor = z => /cor/.test(z.id) && !/core/.test(z.kind || '') || /corridor/i.test(z.n || '');
      const clash = z => { const a = /chlor/i.test(x.id + ' ' + nm), b = /acid/i.test(x.id + ' ' + nm), t = z.id + ' ' + (z.n || ''); return a && /acid/i.test(t) || b && /chlor/i.test(t); };    
      const via = exitRoom ? null : chem ? (R1.find(z => z !== x && z.g === 'plant' && !clash(z) && shares(z)) || R1.find(z => z !== x && (z.id === 'scor' || z.kind === 'scor') && shares(z)))
        : R1.find(z => z !== x && isCor(z) && shares(z));
      if (via) { x.extOverride[key] = { via: via.id, flag: `Layout draft door-relocate: ${why}; no wall with a 0.9 m yard${noRoute ? ' and a walk to the street' : ''}: its door opens onto ${String(via.n || via.id).split(' (')[0]} instead${chem ? ' (deliveries pass through it to that room\'s own outside door)' : ''} [door-relocate:to-corridor].` }; n++; return; }
      x.extOverride[key] = { flag: `Layout draft door-relocate: ${why}; door on no-yard line, no wall to move to${exitRoom ? ' (an exit: not sent through another room)' : chem ? ' (a chemical or plant room: no plant room or service corridor beside it)' : ''}${noRoute ? ' (a wall faces a yard, but no 0.9 m walk reaches a street or lane)' : ''}; the door stays where finish() draws it, flagged (EXIT-yard still lists it) [${noRoute ? 'door-relocate:no-route' : 'door-relocate:no-wall'}].` }; n++; })); }
  if (n) fl.push(`Layout draft door-relocate: ${n} exterior wall${n === 1 ? '' : 's'} on storey 1 face a neighbour lot line with under 0.9 m of yard; an exterior door drawn on one is moved, sent to a corridor or left out, with its own flag (room.extOverride).`);
  return L; }
const api = { hooks: { corridorEnd }, edgeOf, exterior, YARD,
  lots: {    
    E06B_warm_bath: 'expected: bath plant door → its a0 wall (yard, walk to the street); chlorine → through the bath plant; corridor end door stays, flagged no-wall',
    E11814_heat_cascade: 'expected: pool plant → a0 wall; chlorine → through the pool plant; corridor end and stair S1 doors stay, flagged no-wall',
    P4103_community_pool: 'expected: pool plant → a1 wall; chlorine → through the pool plant; corridor end and stair S1 stay, flagged no-wall',
    L22860743_emergency_hub: 'expected: corridor-end door → the corridor\'s other end (b0); stair S1 → its a1 wall; stair P2 stays, flagged no-wall',
    L22861245_emergency_hub: 'expected: corridor-end door → b0; stair S1 → a0; stair P2 stays, flagged no-wall',
    V1515_heat_cascade: 'expected: acid store → its a1 wall (part 3); chlorine → through the pool plant (never through the acid store)',
    _others: 'every other lot: no door moves (overrides may be written on walls with no door; they are inert)' } };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.BD = root.BD || {}, root.BD.layoutDrafts = root.BD.layoutDrafts || {}, root.BD.layoutDrafts['door-relocate'] = api);
})(typeof window !== 'undefined' ? window : this);

return module.exports; })({ exports: {} });
 
P['exit-recess'] = (function (module) {
 
(function (root) {
'use strict';
const DEPTH = 0.9, EPS = 1e-6;
const ar = r => (r[1] - r[0]) * (r[3] - r[2]);
const ov = (a, b) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 0.01 && Math.min(a[3], b[3]) - Math.max(a[2], b[2]) > 0.01;
 
const EDGES = r => [{ side: 'a0', out: [r[0] - DEPTH, (r[2] + r[3]) / 2], mv: [DEPTH, 0] }, { side: 'a1', out: [r[1] + DEPTH, (r[2] + r[3]) / 2], mv: [-DEPTH, 0] },
  { side: 'b0', out: [(r[0] + r[1]) / 2, r[2] - DEPTH], mv: [0, DEPTH] }, { side: 'b1', out: [(r[0] + r[1]) / 2, r[3] + DEPTH], mv: [0, -DEPTH] }];
function exterior(L, r, side) {    
  const probe = side === 'a0' ? [r[0] - 0.05, r[0] - 0.01, r[2] + 0.1, r[3] - 0.1] : side === 'a1' ? [r[1] + 0.01, r[1] + 0.05, r[2] + 0.1, r[3] - 0.1] : side === 'b0' ? [r[0] + 0.1, r[1] - 0.1, r[2] - 0.05, r[2] - 0.01] : [r[0] + 0.1, r[1] - 0.1, r[3] + 0.01, r[3] + 0.05];
  return !(L.rooms[1] || []).some(x => x.r.some(q => ov(q, probe))); }
function corridorEnd(L, S, ctx) {
  if (!L || !L.rooms || !L.rooms[1] || typeof L.toUV !== 'function' || !S || !Array.isArray(S.ring)) return L;
  const fl = L.flags || (L.flags = []), outside = p => !ctx.inPoly(L.toUV(p[0], p[1]), S.ring), done = [];
  const van = !S.city || S.city === 'van';    
  const edm = nm => `Layout draft exit-recess: ${String(nm).split(' (')[0]}: door landing crosses the lot line; not recessed (ruling B, VBBL 1.8.2.5, is Vancouver only; ${S.city || '?'} is not covered) (?) [exit-recess:not-covered]`;
  const segD = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const towardStreet = p => { const u = L.toUV(p[0], p[1]), E = S.edges || []; if (!E.length) return true; let best = null; for (const ed of E) { const d = segD(u, ed.a, ed.b); if (!best || d < best.d) best = { d, ed }; } return best.ed.abuts === 'street' || best.ed.abuts === 'alley'; };    
   
  const sW = (ctx.RULES && ctx.RULES.street && ctx.RULES.street.w) || 1.8, dW = (ctx.RULES && ctx.RULES.door && ctx.RULES.door.w) || 0.9;
  const DOOR_T = { lob: 0.5, ref: 0.5, shel: 0.5, cor: 0.5, ves: 0.5 };    
  const STREETDOOR = x => x.kind === 'lobby' || ['ref', 'shel', 'cor', 'ves'].includes(x.id) || (x.kind === 'entry');
  for (const x of L.rooms[1].slice()) {
    if (!STREETDOOR(x) && !x.sky) continue; const r = x.r[0]; if (!r) continue;
     
    const tq = DOOR_T[x.id] != null ? DOOR_T[x.id] : 0.5, at = e => { const along = e.side === 'a0' || e.side === 'a1', lo = along ? r[2] : r[0], hi = along ? r[3] : r[1], c = lo + (hi - lo) * tq;
      return along ? [e.side === 'a0' ? r[0] - DEPTH : r[1] + DEPTH, c] : [c, e.side === 'b0' ? r[2] - DEPTH : r[3] + DEPTH]; };
    const e = EDGES(r).find(e => exterior(L, r, e.side) && outside(at(e)) && towardStreet(at(e))); if (!e) continue;
    if (!van) { fl.push(edm(x.n || x.id)); continue; }    
    if (x.sky) { fl.push(`Layout draft exit-recess: ${x.n.split(' (')[0]}: street doors (finish() draws two on its street wall) swing past the lot line; a sky room isn't re-cut here (Code: a recess field in ext()) (?)`); continue; }
    const W = ((x.kind === 'lobby' || x.id === 'ref' || x.id === 'shel' || x.id === 'cor') ? sW : dW) + 0.6, along = e.side === 'a0' || e.side === 'a1';
    const lo = along ? r[2] : r[0], hi = along ? r[3] : r[1], m = Math.min(hi - W / 2, Math.max(lo + W / 2, lo + (hi - lo) * tq)), b0 = m - W / 2, b1 = m + W / 2, depth = along ? r[1] - r[0] : r[3] - r[2];
    if (hi - lo < W + EPS || depth < DEPTH + 1.0) { fl.push(`Layout draft exit-recess: ${x.n.split(' (')[0]} street door not recessed: its wall is ${(hi - lo).toFixed(1)} m (door + 0.6 m needs ${W.toFixed(1)}) or the room ${depth.toFixed(1)} m deep (?)`); continue; }
    let back, rest;
    if (e.side === 'a0') { back = [r[0] + DEPTH, r[1], b0, b1]; rest = [[r[0], r[1], r[2], b0], [r[0], r[1], b1, r[3]]]; }
    else if (e.side === 'a1') { back = [r[0], r[1] - DEPTH, b0, b1]; rest = [[r[0], r[1], r[2], b0], [r[0], r[1], b1, r[3]]]; }
    else if (e.side === 'b0') { back = [b0, b1, r[2] + DEPTH, r[3]]; rest = [[r[0], b0, r[2], r[3]], [b1, r[1], r[2], r[3]]]; }
    else { back = [b0, b1, r[2], r[3] - DEPTH]; rest = [[r[0], b0, r[2], r[3]], [b1, r[1], r[2], r[3]]]; }
    x.r = [back.map(ctx.r2)].concat(rest.filter(q => (q[1] - q[0]) > 0.05 && (q[3] - q[2]) > 0.05).map(q => q.map(ctx.r2)), x.r.slice(1));
    done.push(`${x.n.split(' (')[0]} street door in a ${W.toFixed(1)} × 0.9 m alcove (−${(W * DEPTH).toFixed(1)} m²)`); }
  for (const x of L.rooms[1].slice()) {
    const isStair = !!x.stair && (x.kind === 'pcore' || x.kind === 'score'), isPas = x.kind === 'exitpas';
    if (!isStair && !isPas) continue;
    const r = x.r[0]; if (!r) continue;
    const e = EDGES(r).find(e => exterior(L, r, e.side) && outside(e.out)); if (!e) continue;
    if (!van) { fl.push(edm(x.n || x.id)); continue; }
    if (isPas) {
      const len = (e.side === 'a0' || e.side === 'a1') ? r[1] - r[0] : r[3] - r[2]; if (len < DEPTH + 1.1) { fl.push(`Layout draft exit-recess: ${x.n} too short to recess (${len.toFixed(1)} m) (?)`); continue; }
      x.r[0] = (e.side === 'a0' ? [r[0] + DEPTH, r[1], r[2], r[3]] : e.side === 'a1' ? [r[0], r[1] - DEPTH, r[2], r[3]] : e.side === 'b0' ? [r[0], r[1], r[2] + DEPTH, r[3]] : [r[0], r[1], r[2], r[3] - DEPTH]).map(ctx.r2);
      done.push(`${x.n.split(' (')[0]} end recessed 0.9 m`); continue; }
     
    const [du, dv] = e.mv, moved = q => [q[0] + du, q[1] + du, q[2] + dv, q[3] + dv].map(ctx.r2), strip = e.side === 'a0' ? [r[0], r[0] + DEPTH, r[2], r[3]] : e.side === 'a1' ? [r[1] - DEPTH, r[1], r[2], r[3]] : e.side === 'b0' ? [r[0], r[1], r[2], r[2] + DEPTH] : [r[0], r[1], r[3] - DEPTH, r[3]];
    const sts = Object.keys(L.rooms).filter(st => L.rooms[st].some(y => y.id === x.id));
    const hits = sts.flatMap(st => L.rooms[st].filter(y => y.id !== x.id && y.r.some(q => L.rooms[st].find(z => z.id === x.id).r.some(sr => ov(moved(sr), q)))).map(y => ({ st, y })));
    const hard = y => y.g === 'hall' || y.kind === 'bay', fixedSize = y => y.lift || y.stair || y.core || /core|shaft/.test(y.kind || '') || /\blift\b|shaft|stair|elevator/i.test(y.n || '');    
    if (hits.some(h => hard(h.y) || fixedSize(h.y))) { const hh = hits.filter(h => hard(h.y) || fixedSize(h.y)); fl.push(`Layout draft exit-recess: ${x.n.split(' (')[0]} not moved: the 0.9 m shift would cut ${[...new Set(hh.map(h => h.y.n.split(' (')[0]))].join(', ')} (${hh.some(h => hard(h.y)) ? 'data-centre floor; needs the size loop / replant' : 'a lift, shaft or stair keeps its size'}) [exit-recess:stair-blocked] (?)`); continue; }
    for (const st of sts) { const R = L.rooms[st], s = R.find(y => y.id === x.id); s.r = s.r.map(moved);
      for (const y of R) if (y !== s) { const cut = s.r.filter(q => y.r.some(p => ov(p, q))); if (cut.length) y.r = ctx.subAll(y.r, cut); }
      for (const y of R) if (y !== s && y.r.some(q => ov(q, strip))) y.r = ctx.subAll(y.r, [strip]); }
    done.push(`${x.n.split(' (')[0]} moved 0.9 m inward on storeys ${sts.join(', ')}${hits.length ? ' (cut: ' + [...new Set(hits.map(h => h.y.n.split(' (')[0]))].join(', ') + ')' : ''}`); }
  if (done.length) fl.push(`Layout draft exit-recess (ruling B, VBBL 1.8.2.5): ${done.join('; ')}`);
  return L; }
const api = { hooks: { corridorEnd }, lots: {
  E06B_warm_bath: 'Edmonton: no room moves (18 Nov 06:02 queue run recessed the DC vestibule 37.7 → 36.4 m²; fixed: ruling B is Vancouver only); crossing landings flagged [exit-recess:not-covered]', E4103_food_hub: 'Edmonton: no moves; flags only', P4103_community_pool: 'Edmonton: no moves; flags only',
  V339_emergency_hub: '17k (project decision, 11:18, every street door): the shared lobby and refuge street doors (front yard under 0.9 m) each in a 2.4 × 0.9 m alcove: refuge 184 → about 182 m² (over 175), lobby 45 → about 43 m²; S1, S2 unchanged (their landings are inside the lot); MW unchanged',
  V339_shelter_laundry: 'as V339 hub (the same plan relabelled): rest area and lobby street doors in alcoves', V339_food_hub: 'queue run 16:26 (full halls): no change (the lobby door is already 0.9 m inside). HALLS=1 run: lobby alcove. Either is right for its plan; the wing\'s sky rooms (greenhouse, kitchen) are not cut: their street doors are flagged for Code (ext() puts them on the rectangle at a0, two per room)',
  P339_community_pool: 'expected no change (17k addendum: pool reports its street doors 9-14 m behind the 0.6 m-yard line, so each door is already over 0.9 m inside)', V339_warm_bath: 'expected no change (as the pool). Queue run 16:26 recessed the lobby on a side-lot-line wall: fixed (street edges only)',
  L22861245_emergency_hub: 'expected (1539 Vernon Dr, I-2 zero yards): street / lane exit passage ends recessed 0.9 m, stairs moved 0.9 m where no hall or bay is cut (else flagged); A10 pass (no site fixture yet)',
  L22860743_emergency_hub: 'as L22861245', L23063395_emergency_hub: 'as L22861245',
  V1360_emergency_hub: '5f1424d, patchHard ON, HALLS=1: lobby, DC vestibule and the three exit passages recessed (pas, pas1 street, pas2 lane); stair S2 not moved (would cut lift E2 and the hall: stair-blocked); the corridor door wall too short (flag); no new hard rows; MW 0.40 From 07d0c17 (face rule, project decision option A): doesn\'t fit, narrow lot, front row 0.10 m short (13.66 vs 13.56 m; named reason, 17ai item 3, corrected 18a); default and draft both no plan.', V1360_shelter_laundry: 'as V1360 hub From 07d0c17 (face rule, project decision option A): doesn\'t fit, narrow lot, front row 0.10 m short (13.66 vs 13.56 m; named reason, 17ai item 3, corrected 18a); default and draft both no plan.' } };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.layoutExitRecess = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
 
P['fire-entrance'] = (function (module) {
 
(function (root) {
'use strict';
const LIMIT = 15.0, MARGIN = 0.3, WARN = 12.0;
function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
function ptRect(p, r) { return Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3])); }
const ov = (a, b) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 0.01 && Math.min(a[3], b[3]) - Math.max(a[2], b[2]) > 0.01;
function offOf(S, ctx) { const c = ctx && ctx.roadwayOff, o = (S && S.roadwayOff != null) ? S.roadwayOff : typeof c === 'function' ? c(S) : (c != null ? c : null);    
  if (o == null) return null; const v = Array.isArray(o) ? +o[0] : typeof o === 'object' ? +o.m : +o; return isFinite(v) ? v : null; }
 
function routeDist(p, S, off) {
  const dr = S.sideDrive && S.sideDrive.r, ddr = dr ? ptRect(p, dr) : null;
  if (ddr != null && ddr >= 3.0 - 1e-9 && ddr <= LIMIT + 1e-9) return { d: ddr, via: 'drive' };
  const E = (S.edges || []).filter(e => e.abuts === 'street'); if (!E.length) return null;
  let best = null; for (const e of E) { const d = segDist(p, e.a, e.b); if (!best || d < best.line) best = { line: d, e }; }
  return { d: best.line + (off || 0), line: best.line, e: best.e, via: 'street' }; }
function corridorEnd(L, S, ctx) {
  if (!L || !L.rooms || !L.rooms[1] || typeof L.toUV !== 'function' || !S || !Array.isArray(S.ring)) return L;
  const R1 = L.rooms[1], lob = R1.find(x => x.id === 'lob') || R1.find(x => x.kind === 'lobby'); if (!lob || !lob.r || !lob.r.length) return L;
  const fl = L.flags || (L.flags = []), r2 = ctx && ctx.r2 || (x => Math.round(x * 100) / 100), T = (a, b) => L.toUV(a, b);
  const q = lob.r[0], door = T(q[0], (q[2] + q[3]) / 2), off = offOf(S, ctx), rd = routeDist(door, S, off);
  if (rd && rd.via === 'street' && rd.d < 3.0 - 1e-9) {    
    fl.push(`Layout draft fire-entrance: principal entrance ${r2(rd.line)} m from the street lot line${off == null ? ' (roadway offset unknown)' : ' + ' + r2(off) + ' m to the roadway = ' + r2(rd.d) + ' m'}; B4 needs 3-15 m (3.2.5.5)${off == null ? ': passes only if the roadway is at least ' + r2(3 - rd.line) + ' m beyond the lot line' : ''}; not moved [fire-entrance:under-3m].`); return L; }
  if (!rd || rd.via === 'drive' || rd.d <= LIMIT + 1e-9) {
    if (rd && rd.via === 'street' && off == null && rd.line > WARN) fl.push(`Layout draft fire-entrance: principal entrance ${r2(rd.line)} m from the street lot line; roadway offset unknown, so B4's 15 m (3.2.5.5) passes only if the roadway is within ${r2(LIMIT - rd.line)} m of the lot line [fire-entrance:offset-unknown].`);
    return L; }
  const need = r2(rd.d - LIMIT + MARGIN), strip = [q[0] - need, q[0], q[2], q[3]];
   
  const corners = [[strip[0], strip[2]], [strip[0], strip[3]], [strip[1], strip[2]], [strip[1], strip[3]]].map(c => T(c[0], c[1]));
  const inLot = corners.every(c => (ctx && ctx.inPoly ? ctx.inPoly(c, S.ring) : true));
  const yardHit = (S.edges || []).filter(e => (e.d || 0) > 0).find(e => corners.some(c => segDist(c, e.a, e.b) < (e.d || 0) - 0.01));
  const uvR = r => { const a = T(r[0], r[2]), c = T(r[1], r[3]); return [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])]; };
  const blockers = R1.filter(y => y !== lob && y.r.some(p => ov(p, strip))).map(y => y.n.split(' (')[0])
    .concat(((L.plant && L.plant.items) || []).filter(i => !i.roof && !i.up && i.r && ov(i.r, strip)).map(i => i.n || i.id))
    .concat(L.truck && L.truck.court && ov(L.truck.court, strip) ? ['truck court'] : [])
    .concat(S.sideDrive && S.sideDrive.r && ov(uvR(strip), S.sideDrive.r) ? ['side drive'] : []);
  const head = `Layout draft fire-entrance: principal entrance ${r2(rd.d)} m from the access route (${r2(rd.line)} m to the street lot line + ${off == null ? '0 (roadway offset unknown, lower bound)' : r2(off)} m to the roadway; B4 limit ${LIMIT} m, 3.2.5.5)`;
  if (!inLot || yardHit) { fl.push(`${head}; a ${need} m lobby bump would enter ${yardHit ? 'the required ' + (yardHit.kind || '') + ' yard (' + r2(yardHit.d) + ' m)' : 'ground outside the lot'}: not moved [fire-entrance:no-front-yard].`); return L; }
  if (blockers.length) { fl.push(`${head}; a ${need} m lobby bump would hit ${[...new Set(blockers)].join(', ')}: not moved [fire-entrance:blocked].`); return L; }
  const after = routeDist(T(strip[0], (q[2] + q[3]) / 2), S, off);
  if (!after || after.d > LIMIT + 1e-9) { fl.push(`${head}; moving the lobby wall ${need} m out leaves ${after ? r2(after.d) : '?'} m (the wall does not face the nearest street): not moved [fire-entrance:not-enough].`); return L; }
  lob.r[0] = [r2(strip[0]), q[1], q[2], q[3]];
  fl.push(`${head}; lobby street wall moved out ${need} m (one-storey bump, ${r2(need * (q[3] - q[2]))} m² of lobby added): entrance now ${r2(after.d)} m [fire-entrance:moved].`);
  return L; }
const api = { hooks: { corridorEnd }, routeDist, offOf, LIMIT, MARGIN,
  lots: {    
    V1515_heat_cascade: 'expected: not moved; flagged fire-entrance:under-3m unless S.roadwayOff ≥ 2.72 m (door 0.28 m from the street lot line on the 17 Nov export)',
    V339_warm_bath: 'expected: no change on the kept plan (door 14.21 m from the line): moves only if S.roadwayOff > 0.79 m',
    _others: 'every other lot unchanged; flag offset-unknown where the door is 12-15 m from the line and no offset is known' } };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else (root.BD = root.BD || {}, root.BD.layoutDrafts = root.BD.layoutDrafts || {}, root.BD.layoutDrafts['fire-entrance'] = api);
})(typeof window !== 'undefined' ? window : this);

return module.exports; })({ exports: {} });
 
P['chem-heat'] = (function (module) {
 
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else { root.BD = root.BD || {}; root.BD['layoutChem-heat'] = factory(); } })(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const isChem = x => /^(chlorine|acid|hypochlorite)$/.test(x.id) || /hypochlorite store|acid store|chlorine room/i.test(x.n || '');
  const isHeat = x => /^(prog_mech|programs_mech|hrr|boiler|pmec|gen\d*)$/.test(x.id) || /programs mechanical|heat-recovery|heat recovery|boiler|heat pump|water heater|generator/i.test(x.n || '');
  const wallR = (a, b) => { const ov = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); let t = 0;
    if (Math.abs(a[1] - b[0]) < 1e-6 || Math.abs(a[0] - b[1]) < 1e-6) t += ov(a[2], a[3], b[2], b[3]); if (Math.abs(a[3] - b[2]) < 1e-6 || Math.abs(a[2] - b[3]) < 1e-6) t += ov(a[0], a[1], b[0], b[1]); return t; };
  const wallRoomR = (q, B) => B.r.reduce((s, b) => s + wallR(q, b), 0);
  function corridorEnd(L, S, ctx) {
    const st1 = L && L.rooms && L.rooms[1]; if (!st1) return L;
    const def = (S && (S.typDef || S.wingTyp)) || null, ra = q => (q[1] - q[0]) * (q[3] - q[2]), r2 = ctx && ctx.r2 ? ctx.r2 : (x => Math.round(x * 100) / 100);
    const minOf = c => { const d = ((def && def.rooms) || []).find(r => r.id === c.id); const v = d ? (d.minM2 != null ? d.minM2 : d.m2) : null; return typeof v === 'object' && v ? (v.van || v.edm || 0) : (+v || 0); };
    for (const c of st1.filter(isChem)) {
      const heat = st1.filter(isHeat), touch = c.r.filter(q => heat.some(h => wallRoomR(q, h) > 0.05));
      if (!touch.length) continue;
      const keep = c.r.filter(q => !touch.includes(q)), keepA = keep.reduce((s, q) => s + ra(q), 0), mn = minOf(c);
      const hn = heat.filter(h => touch.some(q => wallRoomR(q, h) > 0.05)).map(h => h.id).join(', ');
      if (!keep.length || keepA < mn - 1e-6) { if (L.flags) L.flags.push(`Layout draft chem-heat: ${c.id} shares a wall with ${hn}; the touching part is all it can spare below its ${mn} m² minimum: not moved (chem-heat:at-minimum).`); continue; }
      c.r = keep; const moved = [];
      for (const q of touch) {
        let best = null; for (const r of st1) { if (r === c || isChem(r) || isHeat(r) || r.g === 'circ') continue; const w = wallRoomR(q, r); if (w > 0.05 && (!best || w > best.w)) best = { r, w }; }
        if (best) { best.r.r.push(q.map(r2)); moved.push(`${r2(ra(q))} m² to ${best.r.id}`); }
        else { st1.push(ctx && ctx.room ? ctx.room(1, 'usp_' + c.id, 'Unassigned (from the chemical store, off the heating room)', 'spare', 'spare', [q.map(r2)], {}) : { st: 1, id: 'usp_' + c.id, n: 'Unassigned (from the chemical store, off the heating room)', g: 'spare', kind: 'spare', r: [q.map(r2)] }); moved.push(`${r2(ra(q))} m² unassigned (chem-heat:no-neighbour)`); }
      }
      if (L.flags) L.flags.push(`Layout draft chem-heat: ${c.id} shared a wall with ${hn} (NBC(AE) 7.2.3.39.(2)); it gives up ${moved.join(', ')} and keeps ${r2(keepA)} m² (minimum ${mn}).`);
    }
    return L;
  }
  const hooks = { corridorEnd };
  const lots = {
    'V339_warm_bath': 'acid gives up its middle piece (about 112 m², touching prog_mech over 1.1 m) to bath_plant; keeps about 40 m² (> 8); no other room moves; MW unchanged',
    'E06B_warm_bath': 'unchanged', 'P339_community_pool': 'unchanged', 'P4103_community_pool': 'unchanged', 'P10003_community_pool': 'unchanged'
  };
  return { hooks, lots, corridorEnd };
});

return module.exports; })({ exports: {} });
 
P['washrooms-vg'] = (function (module) {
 
(function (root) {
'use strict';
const GN_A = 3.2, GN_B = 1.8, KEEP = 2.4, EPS = 1e-6;
const HOSTMIN = { ref: 175, ref2: 0 };    
const NOHOST = /\bwcs?\b|washroom|toilet|shower|first aid|office|storage|stor\b|laundry|locker|kitchen|janitor|greenhouse|growing house|headhouse|fish hall|biome|production|propagation|potting|mechanical|dining|\bpool\b|\bspa\b|sauna|steam|plunge|change room|universal change/i;    
function wcOf(x) { return x.fx && x.fx.wc != null ? (+x.fx.wc || 0) + (+x.fx.urinal || 0) : wcCount(x.n); }    
function wcCount(n) { const l = n.toLowerCase(); let m = /\((\d+)(?: \+ urinal)?\)/.exec(l); if (m) return +m[1] + (l.includes('urinal') ? 1 : 0); return 1; }
function isBather(x) { return /^change_/.test(String(x.id || '')) || x.id === 'spa_showers' || !!(x.fx && x.fx.bather); }    
function drawnWCs(R1) {    
  let F = 0, M = 0, U = 0, GN = 0;
  for (const st of Object.keys(R1)) for (const x of R1[st]) { if (x.g !== 'pub' || isBather(x)) continue;    
    const hasFx = x.fx && x.fx.wc != null; if (hasFx ? !(+x.fx.wc > 0) : !/\bwcs?\b|washroom|toilet/i.test(x.n)) continue;    
    if (/staff|dc |clinic/i.test(x.n)) continue;
    const l = x.n.toLowerCase();
    if (x.genderNeutral || /gender-neutral|all-gender/.test(l)) { const n = hasFx ? wcOf(x) : (x.wc || 1); GN += n; U += n; }
    else if (/universal (wc|washroom)/.test(l)) { const n = hasFx ? wcOf(x) : 1; GN += n; U += n; }
    else if (l.includes('women')) F += wcOf(x); else if (/\bmen\b/.test(l)) M += wcOf(x); else U += wcOf(x); }
   
  GN = 0; for (const st of Object.keys(R1)) for (const x of R1[st]) if (x.genderNeutral === true || /gender[- ]neutral|all[- ]gender/i.test(x.n) || /universal (wc|washroom)/i.test(x.n))
    GN += x.wc != null ? +x.wc : (/\((\d+)\)/.test(x.n) ? +/\((\d+)\)/.exec(x.n)[1] : 1);
  return { F, M, U, GN }; }
function vgNeed(load) { return load <= 200 ? 0 : 1 + Math.floor((load - 200) / 100); }
 
function edges(h, c) { const out = [];
  const ov = (a, b, x, y) => [Math.max(a, x), Math.min(b, y)];
  if (Math.abs(h[0] - c[1]) < EPS) { const [f, t] = ov(h[2], h[3], c[2], c[3]); if (t - f > EPS) out.push({ side: 'a0', f, t }); }
  if (Math.abs(h[1] - c[0]) < EPS) { const [f, t] = ov(h[2], h[3], c[2], c[3]); if (t - f > EPS) out.push({ side: 'a1', f, t }); }
  if (Math.abs(h[2] - c[3]) < EPS) { const [f, t] = ov(h[0], h[1], c[0], c[1]); if (t - f > EPS) out.push({ side: 'b0', f, t }); }
  if (Math.abs(h[3] - c[2]) < EPS) { const [f, t] = ov(h[0], h[1], c[0], c[1]); if (t - f > EPS) out.push({ side: 'b1', f, t }); }
  return out; }
function cutRect(h, e, s) {    
  if (e.side === 'a0') return [h[0], h[0] + GN_A, s, s + GN_B]; if (e.side === 'a1') return [h[1] - GN_A, h[1], s, s + GN_B];
  if (e.side === 'b0') return [s, s + GN_B, h[2], h[2] + GN_A]; return [s, s + GN_B, h[3] - GN_A, h[3]]; }
function washrooms(L, S, load, ctx) {
  if (!L || !L.rooms || !L.rooms[1]) return L;
  const T = (S && (S.typDef || S.wingTyp || S.hubTyp)) || null, tid = T ? T.id : 'emergency_hub';
  if (!['emergency_hub', 'shelter_laundry', 'food_hub', 'aquaponics', 'heat_cascade', 'conservatory'].includes(tid)) return L;    
  const flags = L.flags || (L.flags = []);
  if (!load || load.public == null) { flags.push('Layout draft washrooms-vg: no C5 load (patch C5 not merged): washrooms left as drawn'); return L; }
  const van = S.city === 'van', P = load.public, d = drawnWCs(L.rooms);
  const [nM, nF] = P > 0 ? ctx.wcA(Math.ceil(P / 2)) : [0, 0];
  let wcShort = Math.max(0, Math.max(0, nF - d.F) + Math.max(0, nM - d.M) - d.U);
  if (P <= 25) wcShort = Math.max(0, 1 - (d.F + d.M + d.U));
  const gnShort = van ? Math.max(0, vgNeed(P) - d.GN) : 0, want = Math.max(wcShort, gnShort);
  if (!want) { flags.push(`Layout draft washrooms-vg: C5 load ${P}: Table 3.7.2.2.-A ${nM} M + ${nF} F against ${d.M} M + ${d.F} F + ${d.U} other${van ? `; VBBL 3.7.2.9 ${vgNeed(P)} accessible gender-neutral against ${d.GN}` : ''}: met, nothing added [washrooms-vg:met]`); return L; }
  const R1 = L.rooms[1], cor = R1.find(x => x.id === 'cor') || R1.find(x => x.kind === 'pcor');     if (!cor) { flags.push(`Layout draft washrooms-vg: ${want} more WC room(s) needed (load ${P}) and no public corridor at grade to put them on (?)`); return L; }
  const hosts = R1.filter(x => x.g === 'pub' && x.kind === 'proom' && !NOHOST.test(x.n) && !x.genderNeutral)
    .map(x => ({ x, len: Math.max(0, ...x.r.flatMap(h => cor.r.flatMap(c => edges(h, c).map(e => e.t - e.f)))) })).filter(o => o.len >= GN_B + KEEP - EPS).sort((a, b) => b.len - a.len);
  let made = 0, k = 0; const ids = new Set(Object.values(L.rooms).flat().map(x => x.id));
  for (const { x } of hosts) { if (made >= want) break;
    const area = () => ctx.sum(x.r.map(ctx.ra)), min = HOSTMIN[x.id] != null ? HOSTMIN[x.id] : (/rest area/i.test(x.n) ? 56 : 0);
    for (const h of x.r.slice()) for (const c of cor.r) for (const e of edges(h, c)) {
      const depth = (e.side === 'a0' || e.side === 'a1') ? h[1] - h[0] : h[3] - h[2]; if (depth < GN_A + 1.0) continue;    
      let s = e.t - GN_B;    
      while (made < want && s >= e.f + KEEP - EPS && area() - GN_A * GN_B >= min - EPS) {
        const rr = cutRect(h, e, s).map(ctx.r2); x.r = ctx.subAll(x.r, [rr]);
        do { k++; } while (ids.has('gn' + k)); ids.add('gn' + k);
        R1.push(ctx.room(1, 'gn' + k, `Gender-neutral washroom ${k} (accessible WC)`, 'pub', 'proom', [rr], { block: x.block, closed: true, wet: true, genderNeutral: true, fx: { wc: 1 }, wc: 1, accessible: true }));
        made++; s -= GN_B; }
    } }
  flags.push(`Layout draft washrooms-vg (C5 load ${P}${van ? `; VBBL 3.7.2.9: ${vgNeed(P)} accessible gender-neutral WC(s)` : ''}; Table 3.7.2.2.-A ${nM} M + ${nF} F): ${made} gender-neutral washroom(s) added off the public corridor` + (made < want ? `; ${want - made} more needed and no room left on the corridor without cutting a room below its minimum (?)` : ''));
  return L; }
const api = { hooks: { washrooms }, lots: {
  V339_emergency_hub: 'as V339 shelter (the same plan before the relabel)',
  V339_shelter_laundry: 'ea50239, node, patchHard off: load 852 (C5) → VG needs 7, Table A short 10; 4 gender-neutral washrooms added (1 cut from the rest area / refuge main room, which stays over 175 m²; 3 from the corridor wall of the third room); 6 flagged as not placeable; VG row still fail (5 of 7). Fill first (fill-shelter / fill-hub) lowers the load',
  V339_food_hub: 'ea50239 node (tool/data definitions, as the engine reads them): load 115 → Table A 2 M + 3 F against 2 F + 1 M + 1 universal: short 1: 1 gender-neutral washroom added off the corridor; VG under 200; MW 3.23 unchanged',
  V1360_emergency_hub: 'expected: load about 241, 3 M + 5 F met, VG 1 met by the universal WC: no change (no site fixture yet) From 07d0c17 (face rule, project decision option A): doesn\'t fit, narrow lot, front row 0.10 m short (13.66 vs 13.56 m; named reason, 17ai item 3, corrected 18a); default and draft both no plan.',
  L22860743_emergency_hub: '531b3d0 queue run 08:42: 4 added (clinic universal WC not counted) and VG ended 6 of 4; fixed 18 Nov 10:00: GN counted as the VG row counts it (clinic universal WC included), so 3 added: VG 5 of 5',
  L22861245_emergency_hub: 'as L22860743', L23063395_emergency_hub: 'as L22860743',
  P10003_emergency_hub: 'expected: Edmonton, no VG; Table A met at about 393: no change (no site fixture yet)',
  V339_aquaponics: 'ea50239 node: load 324 → VG 2, Table A 4 M + 7 F short 8: 8 gender-neutral washrooms added off the public corridor (3 hosts cut); VG pass; MW 2.71 unchanged',
  E4103_aquaponics: 'expected: Edmonton, no VG; Table A as C4 reads it (not short in the 17 Nov export): no change',
  E11814_heat_cascade: 'expected: Edmonton; dry-side Table A short 1 in the 17 Nov export: 1 room added if a host has a corridor wall',
  V339_heat_cascade: 'expected: load 65 (C5), under 200: no VG; Table A met: no change', V1515_heat_cascade: 'expected: load 103, no VG; Table A met: no change',
  E4103_conservatory: 'expected: Edmonton; Table A met: no change' }, drawnWCs, vgNeed, isBather };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.layoutWashroomsVG = api; }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));

return module.exports; })({ exports: {} });
if (typeof module !== 'undefined' && module.exports) module.exports.patches = P;
if (typeof window !== 'undefined' && window.BD && window.BD.hubchecks) window.BD.hubchecks.patches = P;
})();
 
