 
(function () {
'use strict';
const BD = window.BD, C = BD.f1cards, K = C.K, esc = C.esc, n0 = C.n0, T = 'architecture', R = 300;
const CLS = { p: ['Public programs', '#5B7FA8'], s: ['Shops and restaurants', '#CC746C'], o: ['Offices', '#9A8DB0'], i: ['Industrial', '#8C9096'], h: ['Homes', '#E3D3B0'],
  c: ['Commercial, not split (City assessment)', '#C9B79C'], n: ['New building permitted since 2022', '#FFFFFF'], u: ['Use not published', '#EFEFEF'] };
const ORDER = ['p', 's', 'o', 'i', 'h', 'c', 'n', 'u'];
const JS = {}; const getJ = async u => JS[u] || (JS[u] = BD.getJSON(u));
const proj = (city, lon, lat) => { const m = BD.S.meta[city], k = Math.cos(m.lat0 * Math.PI / 180) * 111320; return [(lon - m.lon0) * k, (lat - m.lat0) * 110540]; };
const bbox = r => { let a = 1e12, b = 1e12, c = -1e12, d = -1e12; for (let i = 0; i < r.length; i += 2) { a = Math.min(a, r[i]); c = Math.max(c, r[i]); b = Math.min(b, r[i + 1]); d = Math.max(d, r[i + 1]); } return [a, b, c, d]; };
function ptSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy; let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function ptRing(px, py, r) { let b = 1e12; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) b = Math.min(b, ptSeg(px, py, r[j], r[j + 1], r[i], r[i + 1])); return b; }
const centre = x => (BD.eng && BD.eng.siteFacts ? BD.eng.siteFacts().c : null) || (x.sel.ring ? BD.centroid(x.sel.ring) : null);
const CACHE = {};
 
async function around(x) {
  const c = centre(x); if (!c) return null; const key = x.city + ':' + x.sel.id + ':' + Math.round(c[0]) + ',' + Math.round(c[1]); if (CACHE[key]) return CACHE[key];
  let A = null, O = null, PR = null; try { A = await getJ(`data/around_${x.city}.json`); } catch (e) {} try { O = await getJ(`data/osm_places_${x.city}.json`); } catch (e) {} try { PR = await getJ(`public_rooms_${x.city}.json`); } catch (e) {}
  const near = (px, py, d) => Math.hypot(px - c[0], py - c[1]) <= d, tiles = Object.keys(BD.S.tiles).filter(k => k.startsWith(x.city + ':')).map(k => BD.S.tiles[k]);
   
  const B = []; const seen = new Set();
  for (const t of tiles) for (const q of t.bld || []) { if (q.f === 3) continue; const bb = bbox(q.r), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2; if (!near(cx, cy, R)) continue;
    const k = Math.round(cx) + ',' + Math.round(cy) + ',' + q.r.length; if (seen.has(k)) continue; seen.add(k); B.push({ r: q.r, bb, cx, cy, n: { p: 0, s: 0, o: 0, i: 0, h: 0 }, names: [], room: null, prm: 0, cls: null, ac: null }); }
  const own = x.sel.ring ? x.sel.ring : null;
  const find = (px, py) => { let best = null, bd = 15; for (const b of B) { if (px < b.bb[0] - 15 || px > b.bb[2] + 15 || py < b.bb[1] - 15 || py > b.bb[3] + 15) continue;
      if (BD.pip(px, py, b.r)) return b; const d = ptRing(px, py, b.r); if (d < bd) { bd = d; best = b; } } return best; };
  let nLic = 0, nOsm = 0, nPrm = 0;
  if (A) { const L = A.lic; for (let i = 0; i < L.length; i += 3) { if (!near(L[i], L[i + 1], R + 20)) continue; const b = find(L[i], L[i + 1]); if (b) { b.n[L[i + 2]]++; nLic++; } }
    const P = A.prm; for (let i = 0; i < P.length; i += 2) { if (!near(P[i], P[i + 1], R + 20)) continue; const b = find(P[i], P[i + 1]); if (b) { b.prm++; nPrm++; } } }
  if (O) for (const q of O.pts) { if (!near(q[0], q[1], R + 20)) continue; const b = find(q[0], q[1]); if (!b) continue; b.n[q[2]]++; nOsm++; if (q[3]) b.names.push({ t: q[3], c: q[2], src: 'osm' }); }
  if (PR) for (const [k, L] of [['library', PR.lib || []], [x.city === 'edm' ? 'recreation centre' : 'community centre', PR.cc || []], ['community league hall', PR.hall || []]]) for (const q of L) {
    if (q[2] == null || q[3] == null) continue; const p = proj(x.city, q[3], q[2]); if (!near(p[0], p[1], R + 20)) continue; const b = find(p[0], p[1]); if (b) { b.room = k; b.names.unshift({ t: q[0], c: 'p', src: 'city' }); } }
   
  if (x.city === 'edm') for (const t of tiles) for (const p of t.pts || []) { if (!near(p.x, p.y, R + 20)) continue; const a = (t.A || {})[p.id]; if (!a || !Array.isArray(a[9])) continue; const b = find(p.x, p.y); if (!b) continue;
    const cl = a[9]; b.ac = cl.some(v => /Residential/.test(v)) && !cl.includes('Commercial') ? 'h' : cl.includes('Commercial') ? (cl.some(v => /Residential/.test(v)) ? 'h' : 'c') : b.ac; }
  for (const b of B) { const tot = ORDER.slice(0, 5).reduce((t, k) => t + b.n[k], 0);
    if (b.room) b.cls = 'p'; else if (tot) { let best = null; for (const k of ['p', 's', 'o', 'i', 'h']) if (best == null || b.n[k] > b.n[best]) best = k; b.cls = best; }
    else if (b.ac) b.cls = b.ac; else if (b.prm) b.cls = 'n'; else b.cls = 'u'; }
   
  const vac = [];
  if (x.city === 'van') for (const t of tiles) for (const p of t.par || []) { const a = (t.A || {})[p.id]; if (!a || a[7] !== 0 || !p.bb) continue; const cx = (p.bb[0] + p.bb[2]) / 2, cy = (p.bb[1] + p.bb[3]) / 2;
      if (!near(cx, cy, R) || (own && BD.pip(cx, cy, own))) continue; if (B.some(b => BD.pip(b.cx, b.cy, p.r))) continue;
      let prm = false; if (A) for (let i = 0; i < A.prm.length; i += 2) if (BD.pip(A.prm[i], A.prm[i + 1], p.r)) { prm = true; break; } vac.push({ r: p.r, cx, cy, prm }); }
  else for (const t of tiles) for (const p of t.pts || []) { const a = (t.A || {})[p.id]; if (!a || a[5] != null || !near(p.x, p.y, R)) continue; if (B.some(b => ptRing(p.x, p.y, b.r) < 15 || BD.pip(p.x, p.y, b.r))) continue;
      let prm = false; if (A) for (let i = 0; i < A.prm.length; i += 2) if (Math.hypot(A.prm[i] - p.x, A.prm[i + 1] - p.y) < 20) { prm = true; break; } vac.push({ x: p.x, y: p.y, prm }); }
  const count = {}; for (const k of ORDER) count[k] = B.filter(b => b.cls === k).length;
  const out = { c, B, vac, count, nLic, nOsm, nPrm, src: A && A.src, osm: O ? { date: (O.date || '').slice(0, 10), lic: O.licence, att: O.attribution } : null, programs: B.filter(b => b.cls === 'p' && b.names.length) };
  CACHE[key] = out; return out;
}
BD.around = around;
 
C.add(T, 'What’s around the lot', { async build(x) {
  const a = await around(x); if (!a) return { draw: '<p class="f1v-empty">No lot loaded.</p>' };
  const W = 640, H = 640, c = a.c, bb = [c[0] - R - 20, c[1] - R - 20, c[0] + R + 20, c[1] + R + 20], f = C.frame(bb, W, H, 0);
  const pathOf = r => { let d = ''; for (let i = 0; i < r.length; i += 2) { const [px, py] = f.P(r[i], r[i + 1]); d += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1); } return d + 'Z'; };
  let bl = ''; a.B.forEach((b, i) => { const [fill] = [CLS[b.cls][1]]; bl += `<path data-abid="${i}" d="${pathOf(b.r)}" fill="${fill}" stroke="${b.cls === 'n' ? K.ink : '#fff'}" stroke-width="${b.cls === 'n' ? 0.8 : 0.5}"${b.cls === 'n' ? ' stroke-dasharray="3 2"' : ''}><title>${esc(CLS[b.cls][0] + (b.names[0] ? ' · ' + b.names[0].t : ''))}</title></path>`; });
  let vl = ''; for (const v of a.vac) { if (v.r) vl += `<path d="${pathOf(v.r)}" fill="#fff" stroke="${K.mute}" stroke-width="0.7" stroke-dasharray="${v.prm ? '3 2' : '1 2'}"><title>${v.prm ? 'Vacant lot, new building permitted since 2022' : 'Vacant lot'}</title></path>`;
    else { const [px, py] = f.P(v.x, v.y); vl += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#fff" stroke="${K.mute}" stroke-width="0.8"><title>${v.prm ? 'Vacant, new building permitted since 2022' : 'Vacant'}</title></circle>`; } }
  const [lx, ly] = f.P(c[0], c[1]), lot = x.sel.ring ? `<path d="${pathOf(x.sel.ring)}" fill="${K.dcSup}" fill-opacity="0.55" stroke="${K.ink}" stroke-width="1.8"/>` : `<circle cx="${lx}" cy="${ly}" r="6" fill="${K.dcSup}" stroke="${K.ink}" stroke-width="1.6"/>`;
  const [rx] = f.P(c[0] + R, c[1]), ring = `<circle cx="${lx}" cy="${ly}" r="${(rx - lx).toFixed(1)}" fill="none" stroke="${K.ink2}" stroke-width="0.8" stroke-dasharray="4 4"/>`;
   
  const lab = [], at = [];
  for (const b of a.B.filter(b => b.names.length).sort((u, v) => (u.cls === 'p' ? 0 : 1) - (v.cls === 'p' ? 0 : 1))) {
    if (lab.length >= 14 || (b.cls !== 'p' && lab.filter(l => !l.p).length >= 8)) continue; const [px, py] = f.P(b.cx, b.cy); if (at.some(q => Math.hypot(q[0] - px, q[1] - py) < 34)) continue; at.push([px, py]);
    lab.push({ p: b.cls === 'p', s: `<text x="${(px + 6).toFixed(1)}" y="${(py + 3).toFixed(1)}" font-size="10.5" fill="${K.ink}" stroke="#fff" stroke-width="2.5" paint-order="stroke">${esc(b.names[0].t.slice(0, 34))}</text>` }); }
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-map data-map-city="${x.city}" data-map-bb="${bb.join(',')}" data-map-frame="${W},${H},0" data-map-max="6" data-map-detail="labels" data-map-label-z="1.5" role="img" aria-label="Buildings within 300 m of ${esc(x.addr)}, coloured by main use">
    <rect width="${W}" height="${H}" fill="${K.ground}"/>${C.context(x, f.P, f.I, [0, 0, W, H], { skip: x.sel.id })}${vl}${bl}${ring}${lot}${lab.map(l => l.s).join('')}
    <g data-map-static><text x="${W - 8}" y="${H - 8}" font-size="10" fill="${K.mute}" text-anchor="end">Places © OpenStreetMap contributors</text></g>
    <g data-map-static data-map-hide-zoomed>${C.scaleBar(18, H - 34, 100, f.s, '100 m')}</g></svg>`;
  const key = `<div class="f1c-key">${ORDER.filter(k => a.count[k]).map(k => `<span><i style="background:${CLS[k][1]};border:1px solid ${k === 'n' ? K.ink : '#ccc'}"></i>${esc(CLS[k][0])} (${a.count[k]})</span>`).join('')}${a.vac.length ? `<span><i style="background:#fff;border:1px dashed ${K.mute}"></i>vacant (${a.vac.length})</span>` : ''}</div>`;
   
  const li = ORDER.filter(k => a.count[k] && k !== 'u').map(k => { const bs = a.B.map((b, i) => [b, i]).filter(([b]) => b.cls === k);
    return `<h4>${esc(CLS[k][0])} (${bs.length})</h4><ul>${bs.slice(0, 40).map(([b, i]) => `<li><button type="button" data-abid-go="${i}">${esc(b.names[0] ? b.names[0].t : (k === 'h' ? 'Homes' : CLS[k][0]))}${b.room ? ' · ' + esc(b.room) : ''}</button></li>`).join('')}${bs.length > 40 ? `<li class="f1c-note">and ${bs.length - 40} more</li>` : ''}</ul>`; }).join('');
  const draw = `<div class="f1c-res-find"><figure>${svg}${key}</figure><div class="f1c-res-list f1c-around-list">${li}</div></div>`;
  const vanL = 'City of Vancouver Open Data: Business licences (2026, status Issued, licences with an address; home-based licences carry none) and Issued building permits (new buildings since 1 Jan 2022, laneway houses left out), downloaded 13 Nov 2026; Open Government Licence – Vancouver.';
  const edmL = 'City of Edmonton Open Data: Business Licences (qhi4-bdpu, Commercial licences) and General Building Permits (24uj-dj8v, new buildings since 1 Jan 2022, backyard houses, temporary structures and hoarding left out), downloaded 13 Nov 2026; Open Government Licence – City of Edmonton. Property assessment classes: Property Information and Assessment (dkk9-cj3x, q7d6-ambg).';
  const tot = a.B.length, known = tot - a.count.u;
  return { draw, lead: `Every building within 300 m of the lot by its main use, from business licences, OpenStreetMap places and the City’s lists of public rooms${x.city === 'edm' ? ' and property assessment classes' : ''}. Where nothing open gives a use, the building says “use not published”.`,
    hero: [{ v: n0(tot), l: 'buildings within 300 m' }, { v: n0(a.count.h), l: 'homes' }, { v: n0(a.count.p), l: 'with public programs' }, { v: n0(a.count.u), l: 'use not published' }],
    rows: ORDER.filter(k => a.count[k]).map(k => [CLS[k][0], `${n0(a.count[k])} building${a.count[k] === 1 ? '' : 's'}`]).concat([['Vacant lots', `${n0(a.vac.length)}${a.vac.some(v => v.prm) ? `, ${a.vac.filter(v => v.prm).length} with a new building permitted since 2022` : ''}`],
      ['Read from', `${n0(a.nLic)} licences, ${n0(a.nOsm)} OpenStreetMap places, ${n0(a.nPrm)} permits; ${n0(known)} of ${n0(tot)} buildings have a use`]]),
    more: [['How a building gets its use', `<p>Each licence, place or public room belongs to the building it falls in, else the nearest building within 15 m. The building’s main use is its most common class; a library, ${x.city === 'edm' ? 'recreation centre, community league hall' : 'community centre'} makes it public programs. Where several businesses share one building, its use is our reading of their licences.${x.city === 'edm' ? ' With no licence or place, the City’s assessment class decides: residential classes as homes, “Commercial” as commercial, not split.' : ''} Licence names are never shown (many are individual landlords). A permit shows that a new building was approved, not that work has started.</p>`]],
    src: [x.city === 'van' ? vanL : edmL, `Places: OpenStreetMap (${a.osm ? a.osm.date : '?'}), Open Database License (ODbL) 1.0, © OpenStreetMap contributors; kept in its own file.`, `Public rooms: the City’s ${x.city === 'van' ? 'libraries and community centres (register vanLibraries, vanCC)' : 'Public Libraries, Recreation Facilities and Community League Halls'}.`, `Buildings: the tool’s building outlines (${x.city === 'van' ? 'City of Vancouver footprints 2009 and LiDAR 2022' : 'City of Edmonton rooflines and 3D buildings'}). Classes, distances and counts: our arithmetic.`],
    missing: a.count.u ? [`${n0(a.count.u)} buildings with no open source for their use (use not published)`] : [] }; } });
 
document.addEventListener('click', e => { const g = e.target.closest && e.target.closest('[data-abid-go]'); if (!g) return; const id = g.getAttribute('data-abid-go'), root = g.closest('.f1c-res-find'); if (!root) return;
  root.querySelectorAll('[data-abid].f1c-on').forEach(p => { p.classList.remove('f1c-on'); p.removeAttribute('stroke-width'); p.setAttribute('stroke', '#fff'); });
  const p = root.querySelector(`[data-abid="${id}"]`); if (p) { p.classList.add('f1c-on'); p.setAttribute('stroke', '#CC746C'); p.setAttribute('stroke-width', '2.4'); } });
})();
