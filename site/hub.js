 
(function (root) {
'use strict';
const TRm = (typeof module !== 'undefined' && module.exports) ? require('./treach.js') : null;
const TR = () => (root && root.BD && root.BD.treach) || TRm;
 
const HCm = (typeof module !== 'undefined' && module.exports) ? require('./hubchecks.js') : null;
const HC = () => (root && root.BD && root.BD.hubchecks) || HCm;
const r2 = x => Math.round(x * 100) / 100, up1 = x => Math.ceil(x * 10 - 1e-6) / 10, sum = a => a.reduce((s, x) => s + x, 0);
const ra = r => (r[1] - r[0]) * (r[3] - r[2]);

 
const RULES = {
  version: 'Emergency hub layout rules (8 Nov 2026)',
  cor: { w: 2.0, why: 'public and secure corridors 2.0 m (spec 15b, drawing choice; code ≥ 1,100 mm, VBBL 3.3.1.9)' },
  ccor: { w: 2.0, why: 'clinic corridor 2.0 m (spec 15b 1.8–2.0 m, drawing choice; stretcher widths in CSA Z8000, unread ?)' },
  stair: { w: 2.6, l: 6.9, why: 'exit stairs 2.6 × 6.9 m (drawing choice, as the test-fit study’s fits; two 1.1 m flights, VBBL 3.4.3.2)' },
  e1: { w: 2.4, l: 3.0, why: 'public lift E1 shaft 2.4 × 3.0 m (drawing choice; a lift to every storey, VBBL 3.8.2.3)' },
  e2: { w: 2.6, l: 3.6, why: 'freight lift E2 shaft 2.6 × 3.6 m (spec 1b car ≈ 2.5 × 3.4 m, drawing choice; passenger-rated, the staff accessible route)' },
  door: { w: 0.9, why: '0.9 m doors (doorway ≥ 850 mm, VBBL / NBC Table 3.4.3.2.-A); travel measured through 0.9 m doors (spec rule 6)' },
  street: { w: 1.8, why: 'street doors 1.8 m (spec 15c, drawing choice)' },
  lobby: { w: 6.0, m2: 20, ws: [6.0, 5.0, 4.0], why: 'shared lobby ≥ 20 m² (spec 15c, drawing choice), 6.0 m wide on the street, narrowed to 5.0 or 4.0 m on narrow lots (drawing choices; the 1330 Glen Dr hand fit draws 4.4 m)' },
  overflow: { why: 'narrow lots (F2b, 9 Nov 2026): when the hub service row is full, the staff office, first aid and cot storage move into the front row beside the refuge, still off the public corridor (drawing choice, as the 1330 Glen Dr and 8238 Fraser St hand fits)' },
  band: { why: 'bands street → rear (spec rule 1): hub front row (refuge, shelter, lobby on the street) → public corridor → hub service row → data-centre entrance row and loading → covered truck court → plant yard' },
  rowB: { d: 5.0, why: 'beside variant: service rows 5.0 m deep (drawing choice; keeps a 5-exam clinic under 500 m², BE 3.3.1)' },
  rowR: { d: 6.9, why: 'hub service row as deep as a stair (6.9 m, drawing choice) so the clinic stairs and lift sit in it' },
  wcMod: { w: 0.9, why: 'washroom rooms 0.9 m of wall per WC, stalls along the room depth (drawing choice; counts from VBBL Table 3.7.2.2.-A/-B)' },
  smallRoom: { w: 1.6, why: 'small rooms (cot storage, single WC, storage) 1.6 m wide (drawing choice; T-width minimum 1.5 m, spec)' },
  clinicWC: { w: 1.5, why: 'clinic single WC rooms 1.5 m wide: the width-table minimum for a single WC (project decision, 8 Nov); the universal WC keeps its own rule (1,700 mm circle)' },
  dcFront: { d: 3.6, why: 'storey-2 data-centre front row 3.6 m deep, as the freight lift (drawing choice)' },
  ves: { w: 2.6, l: 6.0, why: 'staff vestibule, guard point and portal 2.6 × 6.0 m (portal 1.8 × 1.8 m, arch_acc_gcpsg015RZ; rest drawing choice)' },
  dock: { l: 6.0, why: 'dock and lift lobby 6.0 m deep (drawing choice)' },
  aisle: { w: 6.1, why: '6.1 m truck aisle (Parking By-law 5.4.1; Edmonton not given, Vancouver’s used ?) and a 6.1 m yard aisle behind the building (drawing choice)' },
  hallStoreys: 2,    
  dischargeHard: true,
  stairsHard: true,
  extFace: 0.20,    
  thirdStair: true,
  bathersFlip: false, viaBathers: false,    
  wingRowDeeper: true,    
  redrawAfterHooks: true,    
  hallStair3: true,    
  stackOption1: false,    
  stackOption4: false,    
  slMin: false,    
  boardSource: 'clipped',    
  boardRedraw: false,    
  fillTopUp: false,    
  slotFloor: false,    
  landSupport: false,    
  fillJudged: false,    
  fillVoids: true,    
  clipUpper: true,    
  stackD: false,
  stripDerived: false,
  learnerOnDepth: false,            
  sizeFreeRows: ['Truck reverse at most 10 m (SU-9)'],    
  deadline: null,    
  sizeFree: ['P1', 'E6', 'F6', 'CHEM-DC'],        
  hardMs: 12000,    
  dcPerimeter: true,    
   
  patchesOn: true,
  layoutDrafts: ['fixtures', 'CPprog', 'WBprog', 'aq-programRooms', 'cv-programRooms', 'fh-programRooms', 'chem-place', 'grow-group', 'hc-programRooms', 'fill-hub', 'fill-shelter', 'chem-door', 'plant-deck', 'change-deck', 'CEND', 'door-relocate', 'exit-recess', 'fire-entrance', 'chem-heat', 'washrooms-vg'],    
  patchHard: ['A5', 'A6', 'A11', 'C6', 'E1', 'E2', 'E3', 'B4', 'C10', 'E6', 'F6', 'P1', 'SUITE-egress', 'CHEM-DC'],                    
  deadEndHard: true, zoneExitsHard: true, lobbyExit: true, singleWc: true, genderNeutral: true,
  padsE1: true, intakeTable2026: true, genClearHard: true, fireAccessRow: true, capGross: true, fieldLoads: true,
  plantDoors: true,    
  suiteEgress: true, suiteExits: true, suiteSep: true,    
  exitLanding: true, clinicAE385: true, chemStores: true, poolDecksF6: true, poolPlantP1: true, clearSizesC3: true, walkHard: true, bayDoorWidth: true, greenhouseSun: true, heatedEdge: true, cvEntry: true, spaHotTub: true, oversizeFields: true, poolBathersC4C5: true,    
  belowMinFails: true,        
  flight: { riser: 0.18, tread: 0.28, why: 'flight drawn at 180 mm risers and 280 mm treads (VBBL 3.4.6.8 limits as read for exit stairs: rise at most 180 mm, run at least 280 mm; our reading, the hub cites the clause), two flights a storey side by side; the landings are what the stair\u2019s length leaves at its two ends' },    
  pexit: { w: 1.4, why: 'exit passages 1.4 m on the wall centrelines: 1.1 m clear (VBBL 3.3.1.9) + 0.15 m of 2 h wall a side ( item 1)' },
  vestibule: { on: true, clear: 1.35, hallDoor: 1.5, why: 'project decision, 20 Nov 10:20 (project decision): every stair link to a hall is a vestibule, our design rule; the code requires it on barrier-free paths. Depth = 1,350 mm clear + the width of each leaf swinging in (register vestibule_doors_series: NBC 2020, NBC(AE) 2023, VBBL 2025 Div B 3.8.3.6.(12), conf 90). Exit travel runs hall to vestibule to stair: the 1.5 m hall door swings in (counted), the stair door swings into the stair (not counted): 2.85 m. Replaces the 2.4 m derived figure of 09:16' },
  lowLink: { h: 2.3, why: 'a stair or link that stops at a floor: 2.05 m headroom (NBC 3.4.3.4) and a 0.25 m roof (our reading),  item 7' },
  storeyH: { hall: 6.0, up: 4.0, why: 'hall storey 6.0 m (drawing choice, TIA-942 unread); upper storeys 4.0 m (I-2 3.2.2.9 / I-3 3.1.2.9 minimum); ground 6.1 m I-2 (3.1.2.4), 6.0 m I-3 (3.1.2.9); Edmonton one storey at 6.0 m (no storey minimum in BE, drawing choice)' },
  hallPerMW: { v: 740, why: 'data hall 740 m² a MW for the plans (project decision, register arch_dc_hall: white-space precedents, 620-830); was 630 (spec 1b)' },
  dcSideHub: true,    
  setBackAll: true,    
  setBack: { max: 6, why: 'irregular fronts: the building line steps back at most 6 m from a slanted front line, so the lobby stays on the main street (spec 15c; drawing choice, F2b 9 Nov 2026)' },
  largeW: { w: 60, why: 'beside variant: the building takes at most 60 m of frontage; on wider lots the rest of the land stays open (spec Part 2 large lot; drawing choice, F2b 9 Nov 2026: at 85 m the data-centre travel on 14715 Yellowhead Trail was 46.7 m, over 45 m)' },
  cap: { m2: 2325, dropped: 'project decision (project decision, 23 Nov 2026)', why: 'DROPPED by project decision (project decision, 23 Nov 2026): the 2,325 m² hub cap was a drawing choice (project decision, 8 Nov, at the Vancouver Parking By-law 5.2.5 loading step), not a zoning or approval limit; it is no longer a rule. The number stays only for the one-hall-storey option (CAPM2), which is off by default; loading follows project decision' },
  grid: { g: 0.25, why: 'travel along the path on a 0.25 m grid, 8 directions, through the doors (spec rule 6); ≤ 45 m sprinklered (VBBL 3.4.2.5)' },
  transplant: true,    
  growYard: true,    
  plantUp: true,    
  bigRearLink: true,    
  waySrc: 5.0,    
  planMode: 'zones',    
  compactFill: false,    
  courtWay: false,    
  plantWay: true,    
  sharedPacker: true,    
  turnFront: true, serviceB: true,    
  mwFloor: { mw: 0.3, why: 'MW floor (project decision, 13 Nov 2026, ): a layout under 0.3 MW reads doesn’t fit, the first missed minimum named; the hub’s own small-lot boards (E10004 0.31, V1360 0.41) stay' },
  pu: { vesW: 2.2, pS: 1.45, pw: 1.4, dOff: 3.0, lobbyMin: 2.4, dSv: 2.6, dockMin: 2.4, gapF: 2.4, dead3: 5.0, ch: { l: 12.14, w: 2.36, side: 1.5, end: 2.1, endGap: 4.2, gap: 3.0 },
    why: 'layout (b), small lot (13 Nov 2026, as the 1360 Frances St reference board, EH-FREEZE-2026-11-11j addition): staff vestibule 2.2 m wide (portal 1.8 m, arch_acc_gcpsg015RZ; rest drawing choice); stair S2 exit passage 1.45 m and the other exit passages 1.4 m (1.1 m clear inside 0.15 m walls, VBBL 3.3.1.9; the board 1.4–2.0 m); staff office 3.0 m deep behind the public corridor; lobby at least 2.4 m wide (the room-width table: dock or lobby 2.4 m; the board draws 2.4 m), at least 20 m²; washroom and service strip 2.6 m deep (the universal WC 1.7 × 3.2 m clear and the shower 1.5 × 1.8 m clear fit it), along the rear, then the far side (stopping 2.4 m short of the refuge’s exit passage, so the refuge reaches it at full counted width), then the near side; a run’s remaining under 2.4 m joins its last room; dock at least 2.4 m behind the vestibule where there are no loading spaces; chillers 12.14 × 2.36 m (vertivAFC), side by side 3.0 m apart (as the board), clear zones 1.5 m sides, 2.1 m ends, 4.2 m between ends (Vertiv SL-70790 4.2.4, our reading); all other sizes drawing choices' },
  lineOn: true,    
  narrow: { wMax: 20, dS: 3.0, dO: 3.5, dA: 5.2, pl: 1.5, why: 'narrow lots (F2b, 10 Nov 2026, as the 1330 Glen Dr and 8238 Fraser St hand fits): where the stacked rows do not fit across a lot under 20 m wide, the hub bands run back from the street: refuge and shelter strip | public corridor | 3.0 m service strip, the lobby across the corridor and service strip at the street; overflow rooms in a 3.5 m pocket of the refuge strip on the corridor; the data-centre entrance row and the bays at the rear (with a side drive: a 5.2 m row only as wide as the bays, stair S2 and lift E2 turned across, the dock and vestibule behind them, the plant yard behind the refuge, as the 1330 hand fit; with no drive: across the lot, stair S2 along the exit passage); the hall only over the hub, the rear two storeys with chillers on their roof (all drawing choices); the refuge held at the spec size, the rest of its strip open ground, not built (project decision, 10 Nov)' },
  base: { why: 'base surface: the corner grades joined by triangles; both triangulations computed (fans from neighbouring corners: on a four-corner lot the two diagonals) and the lower surface used under the building (Z&D s. 2 joins the corner grades; project decision, 8 Nov, our reading)' },
};
 
const PRG = {
  refuge: { m2: 175, base: 175, w: 4.0, step: 4, src: 'arch_ahsReceptionCentres, arch_edmExtremeWeather: 50 people × 3.5 m² (project decision, 8 Nov)', rank: 1 },
  shelter: { m2: 56, w: 4.0, step: 4, src: '16 guests × 3.5 m² (project decision, 8 Nov; our extension of the rate)', rank: 2 },
  fa: { m2: 9.3, w: 2.7, step: 3, src: 'WorkSafeBC first aid facilities (guidance); width spec', rank: 1 },
  off: { m2: 8, w: 2.4, step: 6, src: 'drawing choice (target 8 m², arch_sup_eastglenRooms analogy)', rank: 1 },
  uwc: { m2: 5.5, w: 2.0, step: 1, src: 'VBBL 3.8.3.13: 1,700 mm turning circle (2.0 m wide, drawing choice)', rank: 1 },
  sho: { m2: 2.7, w: 1.8, step: 1, src: 'VBBL 3.8.3.17.(1): 1.5 × 1.8 m', rank: 1 },
  cot: { m2: null, w: 1.6, step: 6, src: 'no source: drawing choice', rank: 1 },
  pmec: { m2: null, w: 2.0, step: 6, src: 'no source: drawing choice (filtration plant, emergency panel)', rank: 1 },
  exam: { m2: 12.0, w: 3.0, step: 3, src: 'arch_sup_abGFNARooms (guideline); width spec', rank: 3 },
  proc: { m2: 15.5, w: 3.0, step: 3, src: 'arch_sup_abGFNARooms', rank: 3 },
  cons: { m2: 12.0, w: 3.0, step: 3, src: 'arch_sup_abGFNARooms', rank: 3 },
  med: { m2: 10.0, w: 1.6, step: 3, src: 'arch_sup_abGFNARooms', rank: 3 },
  cln: { m2: 11.0, w: 1.6, step: 3, src: 'arch_sup_abGFNARooms', rank: 3 },
  soil: { m2: 13.5, w: 2.0, step: 3, src: 'arch_sup_abGFNARooms', rank: 3 },
  hk: { m2: 7.0, w: 1.6, step: 3, src: 'arch_sup_abGFNARooms', rank: 3 },
  cstf: { m2: null, w: 2.4, step: 3, src: 'staff lounge 0.5 m² a staff member (arch_sup_abGFNARooms); staff count ?', rank: 3 },
  coff: { m2: null, w: 2.4, step: 6, src: 'drawing choice', rank: 3 },
  cst: { m2: null, w: 1.6, step: 6, src: 'drawing choice', rank: 3 },
  wait: { m2: null, w: 4.0, step: 6, src: 'drawing choice', rank: 3 },
  ups: { w: 3.0, step: 2, src: '⌈MW⌉ + 1 modules (ups_modules, galaxyVX) + 1.0 m working space (CEC 2-308, second-hand ?)' },
  bat: { w: 3.0, step: 2, src: 'battery_cabinets, vertivLi5; 2 h room (nfpa855_2026)' },
  bhv: { w: 3.0, step: 6, src: 'arch_up_fm0528 (insurer); size ?' },
  mv: { w: 3.0, step: 2, src: 'arch_up_fm0523; equipment + working space ?' },
  mmr: { w: 2.4, step: 6, src: 'TIA-942 unread: drawing choice' },
  valv: { w: 1.5, step: 6, src: 'drawing choice' },
  jan: { w: 1.5, step: 6, src: 'drawing choice' },
  garb: { w: 2.4, step: 6, src: 'drawing choice' },
  noc: { w: 2.4, step: 6, src: 'drawing choice (TIA-942 unread)' },
  doff: { m2: 100, min: 20.2, w: 2.4, step: 5, src: 'burlingtonPlans2026 (one filed plan): reference size, not a minimum (hub spec Part 1b, open item 25; project decision, 9 Nov, Q25); smallest on a frozen board 20.2 m² (E15231; project chat 14 Nov, correcting 24)' },
  brk: { m2: 24, min: 22.3, w: 2.4, step: 5, src: 'burlingtonPlans2026: reference size, not a minimum (spec Part 1b, Q25); smallest on a frozen board 22.3 m² (E15231; project chat 14 Nov, correcting 22.5)' },
  dwc: { w: 1.6, step: 1, src: '1 WC per ≤ 25 staff (VBBL 3.7.2.2)' },
  hrr: { m2: 25.0, w: 3.2,     n: 'Heat-recovery room (heat hand-over from the data-centre loop, heat pump; floor drain and containment: check in design)', step: 5, src: 'shared data-centre room for every typology that takes heat (project chat 14 Nov, ); reference size the 339 pool board’s 25.0 m² (judged, not a minimum); wet room: not over the UPS, battery, MV, meet-me, NOC or data rooms; reachable by the freight lift' },
  ship: { m2: 45 + 58.6, min: 38.5 + 48.7, w: 2.4, step: 5, src: 'shipping 45 + storage and staging 40 + 18.6 m² (burlingtonPlans2026): reference sizes, not minimums (spec Part 1b, Q25); smallest on a frozen board: shipping 38.5 m² (V1330, project chat 13 Nov) + storage and staging 48.7 m² (E15231; the two small-lot boards draw less: V1360 28.9, E10004 12.2)' },
};
 
const TA = [[25, 1, 1], [50, 1, 2], [75, 2, 3], [100, 2, 4], [125, 3, 5], [150, 3, 6], [175, 4, 7], [200, 4, 8], [250, 5, 9], [300, 5, 10], [350, 6, 11], [400, 6, 12]];
 
 
 
const WALLX = 0.3;
function progOf(x) { return PRG[x.prog] || PRG[x.id] || PRG[(x.id || '').replace(/\d+$/, '')] || null; }
 
const BAYWALL = 0.15;
 
const WALLD = 0.2, WALLDEF = 0.2;
function clearIt(it) { if (!it || it.fix != null || it.bat) return false; if (it.clr) return true; if (it.walled) return false; const p = PRG[it.p] || PRG[it.id] || PRG[(it.id || '').replace(/\d+$/, '')] || PRG[it.k]; return !!(p && p.step != null && p.step <= 4); }
function fireIt(it) { return !it || !!(it.stair || it.lift || it.core || it.k === 'pcore' || it.k === 'exitpas' || /^(p\d|s\d|e\d|psh|pas\w*)$/.test(it.id || '')); }
function wallsW(items, i) { return clearIt(items[i]) ? r2((fireIt(items[i - 1]) ? 0.15 : 0.05) + (fireIt(items[i + 1]) ? 0.15 : 0.05)) : 0; }
function wallOf(it) { return clearIt(it) ? WALLD : 0; }    
 
const BAYCLR = w => (RULES.bayClear !== false && w >= 3.3 - 1e-6) ? 1.3 : 0;    
function bayFix(i, nb, w) { return r2(w + (i % 2 === 0 ? BAYCLR(w) : 0) + (i === 0 ? BAYWALL : 0) + (i === nb - 1 ? BAYWALL : 0)); }
function bayOff(i, nb, w) { return r2(i * w + Math.ceil(Math.min(i, nb) / 2) * BAYCLR(w) + (i > 0 ? BAYWALL : 0) + (nb > 0 && i >= nb ? BAYWALL : 0)); }    
function bayRun(nb, w) { return nb ? r2(nb * w + Math.ceil(nb / 2) * BAYCLR(w) + 2 * BAYWALL) : 0; }
function sizedW(x, d) { const p = progOf(x), a = p && p.step != null && p.step <= 4 ? WALLX : 0; return Math.max((x.w || 0) + a, x.m2 ? up1(x.m2 / Math.max(0.5, d - a) + a) : 0); }
 
const SVC_CLEAR = 0.457;
function batRoomM2(mw, d) { d = d || PRG.bat.w; const n = Math.max(1, Math.ceil(mw * 1000 / 124.4 - 1e-9)), len = Math.ceil(n / 2) * 0.6 + 1.1 + 0.2; return r2(Math.max(mw * 3.8 + 1.0 * PRG.bat.w, len * d)); }    
 
function hallPM() { const ins = (typeof BD !== 'undefined' && BD.S && BD.S.answers && BD.S.answers.inside) || 'air'; return (ins === 'liquid' || ins === 'immersion') && typeof BD !== 'undefined' && BD.hallDensity ? BD.hallDensity() : RULES.hallPerMW.v; }
function HPM() { return hallPM() / (RULES.hallStoreys > 1 ? RULES.hallStoreys : 1); }    
function HPM1() { return hallPM(); }    
function capTxt() { return RULES.hallStoreys > 1 ? 'Data centre size (two hall storeys)' : 'Data centre size (one hall storey)'; }    
function CAPM2() { return RULES.hallStoreys > 1 ? 1e9 : RULES.cap.m2; }    
function wcA(n) { for (const r of TA) if (n <= r[0]) return [r[1], r[2]]; return [7 + Math.ceil((n - 400) / 200), 13 + Math.ceil((n - 400) / 100)]; }
function wcB(p) { return p <= 25 ? 1 : p <= 50 ? 2 : 3 + Math.ceil((p - 50) / 50); }   
const wcBload = load => wcB(Math.ceil(load / 2));   

 
function inPoly(p, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function dSeg(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }

 
let GPV = null;
function gradePoints(city, id) { if (city !== 'van' || !root || typeof XMLHttpRequest === 'undefined') return null;
  if (GPV === null) { try { const x = new XMLHttpRequest(); x.open('GET', 'data/grade_points_van.json', false); x.send(null); GPV = JSON.parse(x.responseText).lots || {}; } catch (e) { GPV = {}; } }
  return GPV[id] || null; }
 
let LTY = null;
function lotTypeOf(city, id) { if (!root || typeof XMLHttpRequest === 'undefined') return null;
  if (LTY === null) { try { const x = new XMLHttpRequest(); x.open('GET', 'data/lot_types.json', false); x.send(null); LTY = JSON.parse(x.responseText); } catch (e) { LTY = {}; } }
  const r = (LTY[city] || {})[id]; return r ? { type: r[0] || null, corner: !!r[1], lane: !!r[2] } : null; }
 
const TYPD = {};
 
function adaptDef(d) { if (!d || !d.family || d.family.type || d.family.v !== 'bigroom') return d;
  const F = d.family, dc = F.drawingChoices || {}, o = JSON.parse(JSON.stringify(d)), two = F.secondRoom ? [F.secondRoom.id].concat(F.secondRoom.with || []) : [];
  const ests = ((d.caps || {}).edm || {}).establishments || [], estOf = id => (ests.find(e => !e.whenStepAtLeast && (e.rooms || []).includes(id)) || {}).id;
  o.family = { type: 'bigroom', big: F.bigRoom, wetBand: { depth: dc.wetBandDepth || 8.0, rooms: F.wetBand || [] }, lobby: { id: F.lobby || 'lobby', depth: dc.lobbyDepth || 6.0 },
    strip: { minDepth: dc.frontStripDepth || 6.0, rooms: (F.frontStrip || []).concat(two, F.greenhouseBlock || []) },
    behindBig: { chem: (F.behindBigRoom || []).filter(x => x !== 'pool_plant'), chemDepth: dc.chemColumn || 3.0, plant: (F.behindBigRoom || []).includes('pool_plant') ? 'pool_plant' : null },
    behindWet: { rooms: [] }, upper: { rooms: F.upperProgram || [], over: 'wetBand' }, src: F.src, adapted: true, moved: two.concat(F.greenhouseBlock || []) };
  o.rooms = (d.rooms || []).filter(r => r.storey !== 'outdoor' && r.side !== 'dataCentre').map(r => Object.assign({}, r, { m2: r.minAreaByCity || (r.target != null ? r.target : r.minArea), minM2: r.minArea, minW: r.minWidth,
    drawnW: r.drawn ? r.drawn[0] : undefined, drawnL: r.drawn ? r.drawn[1] : undefined, rank: r.dropRank, block: estOf(r.id) || 'pool', storey: r.storey === 'any' ? 'ground' : r.storey }));
  const hs = d.hosts || {}; o.hosts = { van: { use: ((hs.van || {}).allowed || ['a']).filter(h => h === 'a' || h === 'c') }, edm: { use: ((hs.edm || {}).allowed || ['c']).filter(h => h === 'a' || h === 'c') }, never: hs.never || [] };
  let drop = []; o.ladder = ((d.ladder || {}).steps || []).filter(x => !/doesn.t fit|height-capped/i.test(x.v || '')).map(x => ({ k: x.step, t: x.v, drop: x.drops || [], sharedLoading: /shared loading/i.test(x.v || '') || undefined }));
  o.establishments = ests.filter(e => !e.whenStepAtLeast).map(e => ({ id: e.id, name: e.id.replace(/_/g, ' '), rooms: e.rooms || [], rest: !!e.rest, use: { edm: e.use }, cap: { edm: e.cap }, capSrc: e.src }));
  if (o.establishments.length) o.lobbyShared = o.establishments.map(e => e.id);
  o.takesHeat = !!(d.takesHeat && (d.takesHeat.v === true || d.takesHeat === true));
  o.constraints = (d.constraints || []).filter(c => c.type === 'accessOnlyVia' && Array.isArray(c.args)).map(c => ({ type: 'accessOnlyVia', room: c.args[0], via: [].concat(c.args[1]).filter(v => typeof v === 'string').map(v => v === 'OUT' ? 'exterior' : v), src: c.src })).filter(c => c.via.length);
  o.mwFloor = d.mwFloor && d.mwFloor.v != null ? d.mwFloor.v : d.mwFloor; o._adapted = true; return o; }
 
function clearDef(d) { if (!d || !Array.isArray(d.rooms)) return d; d.rooms.forEach(r => {
     
    if (r.perPersonM2 == null && typeof r.src === 'string') { const m = r.src.match(/([\d.]+)\s*m²\s*\/\s*person/); if (m && +m[1] > 0) { r.perPersonM2 = +m[1]; r.perPersonFromSrc = true; } }
     
    if (r.perGuest && r.guests && !r._pg) { const g = +r.guests, mn = +r.perGuest.min || 0, rf = +r.perGuest.ref || 0; r._pg = true;
      if (mn) r.minM2 = Math.max(+r.minM2 || 0, r2(mn * g)); if (rf) { const m = r.m2 != null ? r.m2 : r.target; if (m == null || m < rf * g) r.m2 = r2(rf * g); } } const tk = tankClear(r); if (tk && !r._clr) { r.tankClear = tk; r.minW = Math.max(r.minW || 0, tk.w); r.minL = Math.max(r.minL || 0, tk.l); }    
    if (r.minL != null && !r._clr) { r.minLClear = r.minL; r.minL = r2(r.minL + WALLDEF); }    
    if (r.minW != null && !r._clr) { r.minWClear = r.minW; r.minW = r2(r.minW + WALLDEF); } r._clr = true; }); return d; }
 
function tankClear(r) { const t = r && r.tank; if (!t || !(+t.l > 0) || !(+t.w > 0)) return null; const whirl = /spa|whirl|hot/i.test((r.id || '') + ' ' + (r.name || ''));
  return whirl ? { l: r2(+t.l + 1.8 + 1.2), w: r2(+t.w + 2.4), rule: 'whirlpool: 1.8 m deck at the entry end, 1.2 m elsewhere' } : { l: r2(+t.l + 3.6), w: r2(+t.w + 3.6), rule: 'pool: 1.8 m deck all round' }; }
function typDefOf(id) { if (!id || id === 'emergency_hub' || !root || typeof XMLHttpRequest === 'undefined') return null; if (TYPD[id] !== undefined) return TYPD[id];
  try { const x = new XMLHttpRequest(); x.open('GET', 'data/typ_' + id + '.json', false); x.send(null); TYPD[id] = x.status === 200 ? clearDef(adaptDef(JSON.parse(x.responseText))) : null; } catch (e) { TYPD[id] = null; } return TYPD[id]; }
function siteOf(P) { const s = P.s, M = s.M, F = M.F, L = (X, Y) => F.toL(X, Y).map(r2);
  const ring = []; for (let i = 0; i < M.ring.length; i += 2) ring.push(L(M.ring[i], M.ring[i + 1]));
  if (ring.length > 1 && Math.hypot(ring[0][0] - ring[ring.length - 1][0], ring[0][1] - ring[ring.length - 1][1]) < 0.01) ring.pop();
  const LE = ((root.BD && root.BD.S && root.BD.S.sel) || {}).edges || [];    
  const roadOf = i => { const e = LE.find(x => x.i === i); return e && e.street && e.street.road || null; };
  const edges = (M.edgeYards || []).map(e => ({ kind: e.kind, abuts: e.abuts, d: e.d || 0, a: L(e.ax, e.ay), b: L(e.bx, e.by), road: roadOf(e.i) }));
  const bb = ring2 => { const q = []; for (let i = 0; i < ring2.length; i += 2) q.push(L(ring2[i], ring2[i + 1])); return [Math.min(...q.map(x => x[0])), Math.max(...q.map(x => x[0])), Math.min(...q.map(x => x[1])), Math.max(...q.map(x => x[1]))]; };
  const sel = (root.BD && root.BD.S && root.BD.S.sel) || {}, Z = M.Z || {}, base = Z.base || {}, An = (root.BD.S && root.BD.S.answers) || {};
  const gp = gradePoints(M.city, sel.id); let grade = null;
  if (gp) grade = { corners: (gp.c || []).map(c => L(c[0], c[1]).concat([c[2]])), edges: (gp.e || []).map(e => ({ a: L(e[0], e[1]), b: L(e[2], e[3]), z: e[4] })) };
  return { city: M.city, id: sel.id || null, addr: sel.a ? sel.a[0] : null, zone: String(Z.zone || '').toUpperCase(), dir: s.dir < 0 ? -1 : 1, uf: s.uf, ring, edges,
    sideDrive: M.sideDrive ? { w: M.sideDrive.w, inYard: M.sideDrive.inYard, r: bb(M.sideDrive.ring) } : null, maxDepth: base.yards && base.yards.max || null,
    hLimit: M.H || null, mw: (P.ratio && P.ratio.mwTest) || An.mw || M.mwSized || null, fcl: M.grade && M.grade.fcl ? { v: M.grade.fcl.v, datum: M.grade.fcl.datum, src: M.grade.fcl.src } : null,
    gradeDatum: M.grade ? M.grade.datum : null, grade, roadwayOff: null,    
    lotType: lotTypeOf(M.city, sel.id), frontYard: An.front === 'yard', F, ...((d => isWing(d) ? { typDef: null, hubTyp: null, wingTyp: d } : d && (!d.family || d.family.type !== 'bigroom') ? { typDef: null, hubTyp: d } : { typDef: d })(typDefOf(root.BD && root.BD.arch && root.BD.arch.typology))) };        
}

 
const HARD_STOP = { stop: 'time limit' }, hardCheck = () => { if (RULES.hardDeadline && Date.now() > RULES.hardDeadline) throw HARD_STOP; };
function layout(S0) {
  const S = S0, city = S.city, van = city === 'van', zone = S.zone || '', flags = [], notes = [];
  const I2 = /^I-2/.test(zone), I3 = /^I-3/.test(zone), stackedZone = van && (I2 || I3);
   
  const ring = S.ring, E = S.edges.filter(e => e.d > 0);
  const inYard = (u, v) => inPoly([u, v], ring) && E.every(e => dSeg([u, v], e.a, e.b) >= e.d - 1e-6);    
  const inBld = (u, v) => inPoly([u, v], ring) && S.edges.every(e => dSeg([u, v], e.a, e.b) >= (e.d || 0) + RULES.extFace - 1e-6);    
  const drive = S.sideDrive && S.sideDrive.r, inDrive = (u, v) => drive && u > drive[0] + 1e-6 && u < drive[1] - 1e-6 && v > drive[2] + 1e-6 && v < drive[3] - 1e-6;
   
  const vs = ring.map(p => p[1]), vMid = (Math.min(...vs) + Math.max(...vs)) / 2;
  let sv = -1, driveWhy = 'no lane or side drive: the drive side is taken as the low-v side (drawing choice)';
  if (drive) { sv = (drive[2] + drive[3]) / 2 > vMid ? 1 : -1; driveWhy = `side drive ${S.sideDrive.w} m ${S.sideDrive.inYard > 0.1 ? 'in the side yard' : 'taking frontage'} (site.js); the side is the site model's choice (drawing choice, accepted by project decision, 8 Nov)`; }
   
  const laneR = S.edges.find(e => e.abuts === 'alley' && e.kind === 'rear'), laneS = S.edges.find(e => e.abuts === 'alley' && e.kind !== 'front' && e.kind !== 'rear'),
    stF = S.edges.find(e => e.abuts === 'street' && e.kind === 'flank'), stR = S.edges.find(e => e.abuts === 'street' && e.kind === 'rear');
  const service = drive && !laneR && !laneS && !stF && !stR ? { via: 'drive', label: 'Service: side drive from the front street' } : laneR ? { via: 'lane', label: 'Service from the lane (rear)' } : laneS ? { via: 'lane-side', label: 'Service from the lane (side)' }
    : stF ? { via: 'side-street', label: 'Service from the side street (corner)' } : stR ? { via: 'rear-street', label: 'Service from the rear street (through lot)' } : drive ? { via: 'drive', label: 'Service: side drive from the front street' } : { via: 'none', label: 'Service: no lane, second street or side drive (?)' };
  if (!drive && !RULES.serviceB) { const fl = stF, al = S.edges.find(e => e.abuts === 'alley' && e.kind !== 'front');    
    if (fl) { sv = (fl.a[1] + fl.b[1]) / 2 > vMid ? 1 : -1; driveWhy = 'the side street: service, loading and plant from it (corner variant, spec Part 2)'; }
    else if (al) { sv = (al.a[1] + al.b[1]) / 2 > vMid ? 1 : -1; driveWhy = 'the lane along the side'; } }
  else if (!drive) { const se = service.via === 'lane-side' ? laneS : service.via === 'side-street' ? stF : null;
    if (se) { sv = (se.a[1] + se.b[1]) / 2 > vMid ? 1 : -1; driveWhy = service.via === 'lane-side' ? 'the lane along the side (rule B)' : 'the side street: service, loading and plant from it (corner, spec Part 2; rule B)'; }
    else if (service.via === 'lane') driveWhy = 'the lane at the rear (rule B); the drive side is the low-v side (drawing choice)'; }
  const dir = S.dir, uf = S.uf, uOf = a => uf - dir * a;
   
  const vMin = Math.min(...vs), vMax = Math.max(...vs);
  function span(a) { hardCheck(); const u = uOf(a); let best = null, cur = null;
    for (let v = vMin; v <= vMax + 1e-9; v += 0.05) { const ok = inBld(u, v) && !inDrive(u, v); if (ok) { if (!cur) cur = [v, v]; cur[1] = v; } else if (cur) { if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur; cur = null; } }
    if (cur && (!best || cur[1] - cur[0] > best[1] - best[0])) best = cur; return best; }
  let a0 = 0; { const ref = span(3); for (let a = 0; a < 3; a += 0.05) { const sp = span(a); if (sp && ref && sp[1] - sp[0] >= ref[1] - ref[0] - 0.06) { a0 = r2(a); break; } } }
  const spanOver = (a1, a2) => { let lo = -1e9, hi = 1e9; for (let a = a1; a <= a2 + 1e-9; a += 0.5) { const sp = span(a0 + Math.min(a, a2)); if (!sp) return null; lo = Math.max(lo, sp[0]); hi = Math.min(hi, sp[1]); } return [r2(lo + 0.02), r2(hi - 0.02)]; };
   
  const depthFrom = f => { let am = 0; for (let a = 0; a < 200; a += 0.5) { const sp = span(f + a); if (!sp || sp[1] - sp[0] < 10) break; am = a; } return am; };
  let aMax = depthFrom(a0), setBack = 0;
   
   
  let sbInfo = null; const sbScore = k => { let am = depthFrom(a0 + k); if (S.maxDepth) am = Math.min(am, S.maxDepth); if (am < 15) return null;
    let lo = -1e9, hi = 1e9; for (let a = 0; a <= Math.min(40, am) + 1e-9; a += 0.5) { const sp = span(a0 + k + a); if (!sp) { lo = 1; hi = 0; break; } lo = Math.max(lo, sp[0]); hi = Math.min(hi, sp[1]); }
    return { k, am, score: Math.max(0, hi - lo) * am }; };
  const sbWide = RULES.setBackAll && aMax >= 15 ? (() => { const b0 = sbScore(0); let best = b0; for (let k = 0.5; k <= RULES.setBack.max + 1e-9; k = r2(k + 0.5)) { const t = sbScore(k); if (t && (!best || t.score > best.score + 1)) best = t; } return best && best.k > 0 ? Object.assign(best, { from: b0 }) : null; })() : null;
  if (sbWide) { setBack = sbWide.k; a0 = r2(a0 + sbWide.k); aMax = sbWide.am; sbInfo = { k: sbWide.k, depthLost: r2((sbWide.from ? sbWide.from.am : 0) - sbWide.am), score0: sbWide.from ? Math.round(sbWide.from.score) : null, score: Math.round(sbWide.score) };
    flags.push(`Front step-back: the building line steps back ${sbWide.k} m from the front, where the lot is wider (a slanted front, or a lot that widens behind it) (larger building: ${Math.round(sbWide.score)} against ${sbWide.from ? Math.round(sbWide.from.score) : '?'} m² of width over the first 40 m × depth); the lobby is reached by a walkway from the street (drawing choice; walkway not drawn ?; project decision, 14 Nov 2026)`); }
  else if (aMax < 15) { let best = null;
    for (let k = 0.5; k <= RULES.setBack.max + 1e-9; k = r2(k + 0.5)) { let am = depthFrom(a0 + k); if (S.maxDepth) am = Math.min(am, S.maxDepth); if (am < 15) continue;
      let lo = -1e9, hi = 1e9; for (let a = 0; a <= Math.min(40, am) + 1e-9; a += 0.5) { const sp = span(a0 + k + a); if (!sp) { lo = 1; hi = 0; break; } lo = Math.max(lo, sp[0]); hi = Math.min(hi, sp[1]); }
      const score = Math.max(0, hi - lo) * am; if (!best || score > best.score + 1) best = { k, am, score }; }
    if (best) { setBack = best.k; a0 = r2(a0 + best.k); aMax = best.am;
      flags.push(`Irregular front: the front lot line is slanted, so the building line steps back ${best.k} m from the front to the setback with the largest building; the lobby is reached by a walkway from the street (drawing choice; walkway not drawn ?)`); }
    else flags.push(`Irregular front: the lot is under 10 m wide within ${RULES.setBack.max} m of the front line the site model picked (${(fr0 => fr0 ? Math.round(Math.hypot(fr0.b[0] - fr0.a[0], fr0.b[1] - fr0.a[1])) + ' m long' : '?')(S.edges.find(e => e.abuts === 'street' && e.kind === 'front'))}); a hub laid out from another street line is not built (?)`); }
  const aFull = r2(aMax);    
  if (S.maxDepth) aMax = Math.min(aMax, S.maxDepth);
   
  if (S.frontShift) { a0 = r2(a0 + S.frontShift); aMax = r2(Math.min(aFull - S.frontShift, S.maxDepth || 1e9)); }
  const res = { site: { a0, aMax: r2(aMax), aFull, setBackWide: sbInfo || undefined, frontDeg: (fe => fe ? r2(Math.abs(Math.atan2(fe.b[0] - fe.a[0], Math.abs(fe.b[1] - fe.a[1]) || 1e-9) * 180 / Math.PI)) : undefined)((S.edges || []).filter(e => e.kind === 'front').sort((x, y) => Math.hypot(y.b[0] - y.a[0], y.b[1] - y.a[1]) - Math.hypot(x.b[0] - x.a[0], x.b[1] - x.a[1]))[0]), driveSide: sv > 0 ? 'high v' : 'low v', driveWhy }, flags, notes, service };

   
  const streets = S.edges.filter(e => e.abuts === 'street');
  const LT = S.lotType || null, ltype = LT && LT.type;
  const variant = { main: stackedZone ? 'stacked' : 'beside', sideDrive: !!drive, notBuilt: [], flags: [], lotType: ltype || (LT ? 'not a site (job A1)' : '?') };
  if (streets.some(e => e.kind === 'flank')) { variant.flags.push('corner'); flags.push(`Corner: hub and lobby on the main street; ${service.via === 'side-street' ? 'service, loading and plant from the side street (spec Part 2)' : service.label.toLowerCase().replace(/^service/, 'service, loading and plant') + ' (rule B: a lane first)'}`); }
   
  if (streets.some(e => e.kind === 'rear') || streets.filter(e => e.kind === 'unclear' || e.kind === 'front').length >= 2 && streets.some(e => e.kind === 'unclear')) { variant.flags.push('through'); flags.push(`Through lot: hub on the main street; ${service.via === 'rear-street' ? 'service, loading and plant from the street at the rear (spec Part 2)' : service.label.toLowerCase().replace(/^service/, 'service, loading and plant') + ' (rule B)'}; an exit passage where side yards are 0 m`); }
  if (ltype === 'large') { variant.flags.push('large'); flags.push('Large lot: hub-sized data centre (≤ 2,325 m² of data-centre floor, one hall storey, project decision, 8 Nov); the rest of the land stays open (spec Part 2)'); }
  if (ltype === 'irregular') { variant.flags.push('irregular'); flags.push('Irregular lot (job A1: lot area under 0.75 of its bounding rectangle): the hub is drawn in the widest width the yards allow at each depth'); }
  if (ltype === 'small') variant.flags.push('small');
  if (ltype === 'wide_shallow') { variant.flags.push('wide-shallow'); variant.notBuilt.push('turned'); }
  if (LT && !ltype) flags.push('Job A1 lists this lot as not a site (no street frontage found); the variant is named from the lot’s streets in the tool (?)');
  if (!van) flags.push('Edmonton: every hub needs a rezoning (a data centre is Major Industrial, not in BE; IH does not allow the refuge, shelter or clinic). Shown as if rezoned; the design does not change (project decision, 8 Nov).');
  if (van && !stackedZone) flags.push(`Zone ${zone}: the stacked variant is drawn only for I-2 and I-3; ${zone} drawn as beside (?)`);
   
  const nrm = ROADN;    
  const addrSt = S.addr ? nrm(String(S.addr).replace(/^\s*[\d\-A-Z]*\d[\dA-Z\-]*\s+/, '')) : null, frontE = streets.filter(e => e.kind === 'front' || e.kind === 'unclear').sort((x, y) => Math.abs((x.a[0] + x.b[0]) / 2 - S.uf) - Math.abs((y.a[0] + y.b[0]) / 2 - S.uf))[0];    
  if (!addrSt || !frontE) flags.push('Front line: no address or no street front line in the site model; the front is the site model’s pick (?)');
  else if (!frontE.road) flags.push(`Front line: no street names in the site model${van ? ' (a site model saved before 10 Nov 2026)' : ' (Edmonton’s street file has road classes only)'}; the front is the site model’s pick, not checked against ${S.addr} (?)`);
  else if (nrm(frontE.road) !== addrSt) {
    const onAddr = streets.find(e => e.road && nrm(e.road) === addrSt), why0 = `front line: the site model's front faces ${frontE.road}, not ${addrSt} (the street on the address, project decision, 10 Nov); ${onAddr ? `the line on ${addrSt} is its ${onAddr.kind} line` : `no lot line faces ${addrSt} in the street file`}; not laid out from it`;
    if (!onAddr) flags.push(`Front line: no lot line faces ${addrSt} in the street file; the site model's front (${frontE.road}) stands (corner and lane draft, rule A) (?)`);
    else { res.doesntFit = { limiting: [why0] }; res.variant = variant; flags.push('Doesn’t fit here: ' + why0 + ' (?)'); return res; } }

  const H = RULES.storeyH, ground = van ? (I2 ? 6.1 : 6.0) : H.hall;
   
  const lad = [{ k: 1, t: 'full program (5 exam rooms)', exams: 5, shelter: true, shared: false },
    { k: 2, t: 'no clinic', exams: 0, shelter: true, shared: false }, { k: 3, t: 'shelter merged into the refuge (day)', exams: 0, shelter: false, shared: false },
    { k: 4, t: 'shared loading by approval (Parking By-law 5.1.5)', exams: 0, shelter: false, shared: true }];
   
  if (S.wingTyp && S.wingTyp.ladder) { let mg = {}, dr = []; lad.length = 0; S.wingTyp.ladder.filter(x => x.k && !/doesn.t fit/i.test(x.t || '')).forEach(x => { mg = Object.assign({}, mg, x.merge || {}); dr = dr.concat(x.drop || []); lad.push({ k: x.k, t: x.t, exams: 0, shelter: false, shared: !!x.sharedLoading, merge: mg, drop: dr.slice() }); }); }
   
  if (S.typDef && S.typDef.ladder) { let drop = []; lad.length = 0; S.typDef.ladder.filter(x => x.k && !/doesn.t fit|height-capped/i.test(x.t || '')).forEach(x => { drop = drop.concat(x.drop || []); lad.push({ k: x.k, t: x.t, exams: 0, shelter: false, shared: !!x.sharedLoading || /shared loading/i.test(x.t || '') || lad.some(y => y.shared), greenUp: !!x.greenUp || /greenhouse up|wet-block roof/i.test(x.t || '') || lad.some(y => y.greenUp), drop: drop.slice() }); }); }    
   
  const slRest = (((S.hubTyp && S.hubTyp.ladder) || []).find(x => /rest area (\d+)/.test(x.t || '')) || {}).t, slM2 = slRest ? +/rest area (\d+)/.exec(slRest)[1] : null;
  if (RULES.slMin && S.hubTyp && S.hubTyp.id === 'shelter_laundry' && slM2 && !S.wingTyp && !S.typDef) lad.push({ k: lad.length + 1, t: `shelter + laundry at its minimums (rest area ${slM2} m², definition ladder step 2; no refuge)`, exams: 0, shelter: false, shared: true, slMin: slM2 });
  PRG.refuge.m2 = PRG.refuge.base;
  const ladder = extra => { const why = [];
    for (const st of lad) {
      PRG.refuge.m2 = st.slMin || PRG.refuge.base;
      if (S.minStep && st.k < S.minStep) continue;    
       
      const hostsOf0 = S.typDef && S.typDef.family && S.typDef.family.type === 'bigroom' ? (((S.typDef.hosts || {})[city] || {}).use || ['a']) : null;
      const hostsOf = hostsOf0 && RULES.stackOption4 && !hostsOf0.includes('c') && !((S.typDef.hosts || {}).never || []).includes('c') ? (RULES.stackOption4 === 'only' ? ['c'] : hostsOf0.concat(['c'])) : hostsOf0;        
      const fam = hostsOf ? (C0 => { const arr0 = hostsOf.flatMap(h => h === 'c' ? [['c', bigRoomBeside], ['c (big room along the depth)', bigRoomBesideDeep]] : [[h, bigRoomStacked]]);
        const alt = hasRowAlt(S.typDef), arr = (alt ? arr0.flatMap(([h, fn]) => [[h, fn], [h + ' (rooms entered from a hall in the band beside it)', fn, true]]) : arr0).filter(([h]) => !(S.hostSkip || []).includes(h));        
        if (!arr.length) return { fail: 'every host fails a hard rule at every size tried' };
        const tries = arr.map(([h, fn, ra2]) => { const Cc = Object.assign({}, C0, ra2 ? { rowAlt: true } : {}), r = fn(Cc); if (!r.fail && Cc.mapUV) Object.defineProperty(r, '_C', { value: Cc, enumerable: false, writable: true }); if (!r.fail) r.hostUsed = h; return r; }), okT = tries.filter(t => !t.fail);
         
        if (!okT.length && learnerOf(S.typDef) && !C0.learnerTry && tries.some(t => (RULES.learnerOnDepth ? /width|narrows|across|deep|depth/i : /width|narrows|across/i).test(t.fail || ''))) {     const LD = JSON.parse(JSON.stringify(S.typDef)), LR = learnerOf(S.typDef);
          LD.rooms = LD.rooms.map(r => r.id === S.typDef.family.big ? Object.assign(r, { name: LR.name, minW: LR.w, minL: LR.l, drawnW: LR.w, drawnL: LR.l, m2: r2(LR.w * LR.l) }) : r); delete LD.learner;
          const SL = Object.assign({}, S, { typDef: LD }), lt = arr.map(([h, fn]) => { const Cc = Object.assign({}, C0, { S: SL, learnerTry: true }), r = fn(Cc); if (!r.fail && Cc.mapUV) Object.defineProperty(r, '_C', { value: Cc, enumerable: false, writable: true }); return r; }), okL = lt.filter(t => !t.fail);
          if (okL.length) { const bL = okL.sort((x, y) => y.MW - x.MW)[0]; bL.learner = { why: arr.map(([h], i) => `${h}: ${tries[i].fail}`).join('; ') }; bL.hostTried = arr.map(([h], i) => `${h} (learner pool): ${lt[i].fail ? 'does not fit (' + lt[i].fail + ')' : lt[i].MW.toFixed(2) + ' MW'}`); return bL; }
          const lw = arr.map(([h], i) => `${h}: ${lt[i].fail}`).join('; '); return { fail: (tries.length === 1 ? tries[0].fail : arr.map(([h], i) => `${h}: ${tries[i].fail}`).join('; ')) + `; learner pool (smaller program) also tried: ${lw}` }; }
        if (!okT.length) return tries.length === 1 ? tries[0] : { fail: arr.map(([h], i) => `${h}: ${tries[i].fail}`).join('; '), sun: tries.every(t => t.sun) || undefined }; const best = okT.sort((x, y) => y.MW - x.MW)[0]; best.hostTried = arr.map(([h], i) => `${h}: ${tries[i].fail ? 'does not fit (' + tries[i].fail + ')' : tries[i].MW.toFixed(2) + ' MW'}`); return best; }) : null;
      const tryMW = (mw, across) => { const C0 = Object.assign({ S, st, mw, a0, aMax, spanOver, uOf, sv, van, I2, I3, ground, inYard, inDrive, flags, acrossOnly: !!across, wing: S.wingTyp ? wingOf(S.wingTyp, st, van) : undefined }, extra || {}); let X = (fam || (variant.main === 'stacked' ? stacked : beside))(C0); if (!X.fail && !X._C && C0.mapUV) Object.defineProperty(X, '_C', { value: C0, enumerable: false, writable: true });
        if (X.fail && RULES.plantUp && !fam && !S.wingTyp && !(extra && (extra.turned || extra.maxW))) { const fl = [], U = plantUp(Object.assign({ S, st, mw, a0, aMax, spanOver, uOf, sv, van, I2, I3, ground, inYard, inDrive, flags: fl }, extra || {})); if (!U.fail) { X = U; X.puFlags = fl; } else { X.plantUpWhy = U.fail; LASTPU.push(`step ${st.k}: ${U.fail}`); } } X.mwUsed = mw; return X; };
      const notGrown = S.city === 'edm' && !S.mwExact && !S.mwStart;    
      let mw = S.mwExact || S.mwStart || (notGrown ? (S.mw || 1.8) : r2(RULES.cap.m2 / HPM())), L = tryMW(mw, true); if (notGrown && !L.fail && !L.plantUp) L.notGrown = true;
       
      const SROW = /data-centre support row needs/; let ac = true;
      if (L.fail && SROW.test(L.fail) && !S.mwExact) { const f0 = L.fail; let mOk = null, mBad = mw, Lk = null;
        for (let m = r2(mw - Math.max(0.25, mw * 0.06)), k = 0; m >= RULES.mwFloor.mw - 1e-9 && k < 30; m = r2(m - Math.max(0.25, m * 0.06)), k++) { const L2 = tryMW(m, true); if (!L2.fail) { mOk = m; Lk = L2; break; } if (!SROW.test(L2.fail)) break; mBad = m; }
        if (Lk) { for (let m = r2(mBad - 0.05); m > mOk + 1e-6; m = r2(m - 0.05)) { const L2 = tryMW(m, true); if (!L2.fail) { Lk = L2; mOk = m; break; } }
          Lk.rowStop = { at: Lk.MW, tried: S.mwStart || r2(RULES.cap.m2 / HPM()), why: (f0.match(/data-centre support row needs [\d.]+ m; [\d.]+ m/) || [f0])[0] }; }
         
        const L3 = (fam || RULES.dcSideHub) ? tryMW(mw, false) : null;
        if (L3 && !L3.fail && (!Lk || L3.MW > Lk.MW + 1e-3)) { L = L3; ac = false; } else if (Lk) { L = Lk; mw = mOk; } }
      else if (L.fail && (fam || RULES.dcSideHub)) { const L3 = tryMW(mw, false); if (!L3.fail) { L = L3; ac = false; } }    
      if (L.fail && L.sun && !st.sunDrop && S.typDef && S.typDef.family) { const gb = S.typDef.family.greenhouseBlock || [], gs = (S.typDef.ladder || []).find(x => (x.drop || []).some(id => gb.includes(id)));
        if (gs) lad.splice(lad.indexOf(st) + 1, 0, Object.assign({}, st, { t: `${st.t}; greenhouse dropped (its ladder step ${gs.k}): no place meets its sun rule (E13;  item 4)`, drop: [...new Set((st.drop || []).concat(gs.drop))], greenUp: false, sunDrop: true })); }
      if (L.fail) { why.push(`step ${st.k} (${st.t}): ${L.fail}`); continue; }
       
      const big0 = L.plant && !L.plant.ok ? { MW: L.MW, why: L.plant.why || L.plant.whyAll || 'reason not recorded (?)' } : null;    
      let guard = S.mwExact ? 99 : 0, mFail = null; while (L.plant && !L.plant.ok && guard++ < (RULES.hallStoreys > 1 ? 40 : 16)) {    
        mFail = mw; mw = r2(L.MW - Math.max(0.25, L.MW * 0.06)); if (mw < 0.3) break; const L2 = tryMW(mw, ac); if (L2.fail || L2.MW >= L.MW - 0.01) break; L = L2; }
       
      if (mFail != null && !S.mwExact && L.plant && L.plant.ok) { for (let m = r2(mFail - 0.05), k = 0; m > mw + 1e-6 && k < 40; m = r2(m - 0.05), k++) { const L2 = tryMW(m, ac); if (!L2.fail && L2.plant && L2.plant.ok && L2.MW > L.MW + 1e-3) { L = L2; break; } } }    
      if (L.plant && !L.plant.ok) { why.push(`step ${st.k} (${st.t}): plant does not fit (${L.plant.why})`); continue; }
       
      const TDc = S.typDef || S.wingTyp;    
      if (!L.fail && L.rooms && L.kind === 'stacked' && L.aB != null) Object.keys(L.rooms).filter(k => +k >= 2).forEach(k => L.rooms[k].forEach(x => {    
        if (x.kind === 'spare' && x.r.length && x.r.every(r => r[0] >= L.aB - 0.01) && sum(x.r.map(ra)) >= 5) Object.assign(x, { n: 'Data-centre storage (in the data-centre area)', g: 'sup', kind: 'sroom', block: 'data centre', prog: 'dcstor', dcSide: true }); }));
      if (!L.fail && L.rooms) Object.keys(L.rooms).forEach(k => { L.rooms[k] = L.rooms[k].filter(x => !(x.kind === 'spare' && sum(x.r.map(ra)) < 0.5)); });    
      if (!L.fail && L.rooms) trimRooms(L, TDc || S.hubTyp || null);    
      if (!L.fail && L.rooms) closeSpare(L, TDc || S.hubTyp || null, van, TDc ? TDc.id : S.hubTyp ? S.hubTyp.id : 'emergency_hub');    
      if (TDc && !van && TDc.establishments) { const cc = capCount(L, TDc); if (cc) { L.caps = cc; const over = cc.rows.filter(r => r.over);
        cc.rows.filter(r => r.cap == null && r.gross > 500).forEach(r => L.flags.push(`${r.name}: ${Math.round(r.gross)} m² gross, over 500 m²; the definition reads no Edmonton cap for it, but read as a capped use the 500 m² cap applies (flag only;  item 2)`));
         
        const capIds = (TDc.constraints || []).filter(c => c.type === 'capDrop' && (!c.city || c.city === 'edm')).flatMap(c => c.order || c.dropOrder || c.rooms || []);
        const nextCap = over.length ? capIds.find(id => !(st.drop || []).includes(id) && over.some(r => estOfId(TDc, id) === r.id)) : null;
        if (nextCap) { lad.splice(lad.indexOf(st) + 1, 0, Object.assign({}, st, { t: `${st.t}; ${nextCap.replace(/_/g, ' ')} dropped for the cap (capDrop)`, drop: (st.drop || []).concat([nextCap]) }));
          why.push(`step ${st.k} (${st.t}): over the BE cap (${over.map(r => `${r.name} ${Math.round(r.gross)} / ${r.cap} m² gross`).join('; ')}); ${nextCap.replace(/_/g, ' ')} drops next (capDrop)`); continue; }
        const helps = false;
        if (helps) { why.push(`step ${st.k} (${st.t}): over the BE cap (${over.map(r => `${r.name} ${Math.round(r.gross)} / ${r.cap} m² gross`).join('; ')}); a later step drops its rooms`); continue; } } }
      if (big0 && L.plant && L.plant.ok && L.MW < big0.MW - 1e-3 && L.dcArea < CAPM2() - 0.5) { L.sizeStop = { rule: 'plant yard', at: L.MW, tried: big0.MW, why: big0.why };
        flags.push(`${capTxt()}: the plant yard stops it at ${L.MW.toFixed(2)} MW (at ${big0.MW.toFixed(2)} MW: ${big0.why}; project decision, 12 Nov 2026)`); }
      if (L.lineCut && !L.sizeStop && L.dcArea < CAPM2() - 0.5) { L.sizeStop = { rule: 'building line', at: L.MW, why: `upper storeys stay within the ground-floor building line (the back of the loading bays, ${L.Dline} m from the front); the truck court behind is open to the sky` };
        flags.push(`${capTxt()}: the building line stops it at ${L.MW.toFixed(2)} MW (upper storeys within the storey-1 outline, nothing over truck ground: the hub test fits, 12 Nov 2026)`); }
      if (L.rowStop && !L.sizeStop) { L.sizeStop = { rule: 'support row', at: L.MW, tried: L.rowStop.tried, why: L.rowStop.why };
        flags.push(`${capTxt()}: the data-centre support row stops it at ${L.MW.toFixed(2)} MW (at the cap: ${L.rowStop.why}; a smaller size needs fewer loading bays; project decision, 14 Nov 2026)`); }
      if (notGrown && !S.mwExact && !L.plantUp) L.notGrown = true;
      if (L.notGrown && !flags.some(f => /rule pending \(11g\)/.test(f))) flags.push('Data centre not grown to the floor cap: Edmonton at-grade growth rule pending (11g); sized at the tool’s tested size');
      L.ladder = { step: st.k, what: st.t, limiting: why.slice() }; return { out: L, why };
    }
    return { out: null, why }; };
  let { out, why } = ladder();
   
  if (!out && variant.main === 'stacked') {
    const fr = streets.find(e => e.kind === 'front'), frw = fr ? Math.hypot(fr.b[0] - fr.a[0], fr.b[1] - fr.a[1]) : 0, sp0 = spanOver(0, Math.min(40, aMax));
    if (sp0 && (ltype === 'wide_shallow' || frw > aMax)) { const Wfull = r2(sp0[1] - sp0[0]);
      for (let cut = 8; cut <= Wfull - 20 && !out; cut += 2) { const t = ladder({ maxW: r2(Wfull - cut), Wfull, turned: true }); if (t.out) { out = t.out; out.turnedYard = cut; } }
      if (out) { variant.flags.push('turned'); variant.notBuilt = variant.notBuilt.filter(x => x !== 'turned');
        flags.push(`Turned (spec Part 2): the building takes ${out.W} m of the ${Wfull} m width; the plant stands in a yard about ${out.turnedYard} m wide beside it, the bands still along the street (drawing choice; a screened street-front yard not drawn)`); }
      if (out && out.dcArea < CAPM2() - 0.5 && !out.sizeStop) { out.sizeStop = { rule: 'turned plant yard', at: out.MW, yard: out.turnedYard };
        flags.push(`${capTxt()}: the plant yard beside the building (${out.turnedYard} m wide, the narrowest that holds the plant) sets the building's width, ${out.MW.toFixed(2)} MW (project decision, 12 Nov 2026)`); } }
  }
  if (out && out.puFlags) out.puFlags.forEach(f => flags.push(f));
  if (out && out.rooms && !out.fail) out = runHook('programRooms', out, S, S.typDef || S.wingTyp || null);    
  if (out && !S.typDef && out.rooms && !out.plantUp) out.spareFilled = spareFill(out, 'emergency_hub');
  if (out && out.rooms && !out.fail) out = runHook('fill', out, S, S.typDef || S.wingTyp || null);    
  if (out && out.rooms && !out.fail && (RULES.layoutDrafts || []).length && out.kind === 'bigroom' && out.Dbig && S.typDef && S.typDef.family) out.Dbig = (out.grade ? bigRoomDoorsC : bigRoomDoors)(out, S.typDef.constraints || []);    
  if (out && out.spareFilled && out.spareFilled.length) { if (S.typDef && !van && S.typDef.establishments) { const cc = capCount(out, S.typDef); if (cc) out.caps = cc; }
    flags.push(`Spare floor filled from the typology's list (, project decision, 14 Nov): ${out.spareFilled.map(f => `${f.grow ? f.grow + ' grown' : f.id} ${Math.round(f.m2)} m² (storey ${f.st})`).join('; ')}; the rest stays unassigned`); }
  if (out && S.typDef && S.typDef._adapted && S.typDef.family.moved && S.typDef.family.moved.length) flags.push(`${S.typDef.name}: read from its definition's own shape; ${S.typDef.family.moved.join(', ')} drawn in the strip at grade (the engine's big-room family has one big room; the board's spa band beside the pool and the greenhouse's sunny face are not drawn) (?)`);
  if (out && out.bandNotes) flags.push(...out.bandNotes);
  if (out && S.wingTyp && out.rooms) { const W1 = (out.rooms[1] || []).filter(x => x.wingRoom && x.sky), lob = (out.rooms[1] || []).find(x => x.id === 'lob'), wd = out.dF || out.aC;
    out.wing = { depth: wd, typology: S.wingTyp.id };
    if (S.wingTyp && out.rooms) { const w1 = (out.rooms[1] || []).find(x => x.id === 'wcw'), m1 = (out.rooms[1] || []).find(x => x.id === 'wcm'), wl = wingOf(S.wingTyp, out.ladder ? { drop: [] } : {}, S.city === 'van');
      flags.push(`Washrooms by occupant load ( item 7): ${w1 ? `${w1.n} and ${m1 ? m1.n : 'WC men'} (VBBL Table 3.7.2.2.-A)` : 'none drawn'} beside the universal WC; load counted from ${Object.entries(wl.rate).map(([k, v]) => `${k.replace(/_/g, ' ')} at ${v} m² a person`).join(', ') || 'no room'}${wl.noRate.length ? `; not counted, no m² a person in the definition: ${wl.noRate.map(k => k.replace(/_/g, ' ')).join(', ')} (?)` : ''}`); }
    flags.push(`Wing ( item 6; ): ${S.wingTyp.name} in a one-storey wing ${wd} m deep on the street, open to the sky (${W1.map(x => `${x.n.split(' (')[0].toLowerCase()} ${Math.round(sum(x.r.map(ra)))} m²`).join(', ')}${lob ? ', the shared lobby' : ''}); storeys 2 and 3 stop at the wing line; the wing's depth follows its program (Code's proposed rule, project decision to confirm); no hub set, no clinic`); }
  if (out && out.learner) flags.push(`Smaller program: the learner pool (${learnerOf(S.typDef).name}), because the 25 m pool hall does not fit the width (${out.learner.why}); kept only at 0.3 MW or more ( item 3)`);
   
  if (out && !van && out.rooms && !out.shared && out.grade !== false) { const gr = Math.round(grossOf(out.rooms, () => true)), need = gr < 2500 ? 0 : gr <= 7500 ? 1 : 2, single = Object.keys(out.rooms).length === 1;
    out.grossFloor = gr;
    if (out.nb === 0 && need === 0) flags.push(`Loading: no loading bays (0): gross floor area ${gr} m², under the 2,500 m² threshold (Zoning Bylaw 20001 s. 5.80 Table 7.2; gross to the outside face of the exterior walls, s. 8.20)`);
    else if (need > out.nb) flags.push(`Loading: the plan as drawn is ${gr} m² gross (s. 8.20), which needs ${need} loading space${need > 1 ? 's' : ''} by Table 7.2; ${out.nb} drawn${single ? '' : ' (a storeyed layout: its count is still on drawn areas ?)'} (?)`); }
  else if (out && van && out.nb === 0 && !out.shared && out.rooms) flags.push('Loading: no loading bays drawn (0; Parking By-law 5.2.5 asks for at least one) (?)');
  if (out && out.MW != null && out.MW < RULES.mwFloor.mw - 1e-9) {    
    const miss = out.sizeStop ? (out.sizeStop.why || out.sizeStop.rule) : 'no size stop recorded (?)';
    why = [`the layout gives ${out.MW.toFixed(2)} MW, under the ${RULES.mwFloor.mw} MW floor (project decision, 13 Nov 2026); first missed minimum: ${miss}`]; out = null; res.underFloor = true; }
  if (!out) { res.doesntFit = { limiting: why }; res.variant = variant; flags.push((res.underFloor ? 'Doesn’t fit here: ' : 'Doesn’t fit here (ladder step 7): ') + why.join('; '));
    const front = streets.find(e => e.kind === 'front'), fw = front ? Math.hypot(front.b[0] - front.a[0], front.b[1] - front.a[1]) : null;
    if (fw && fw > aMax) flags.push(`Not built yet: the turned variant (bands along the street, spec Part 2) might fit this wide, shallow lot (frontage ${Math.round(fw)} m, depth ${Math.round(aMax)} m) (?)`);
    return res; }
  if (variant.notBuilt.length) flags.push(`Not built yet: the ${variant.notBuilt.join(', ')} variant (project decision, 8 Nov: not this pass); drawn as ${variant.main}`);
  if (drive && van && I3 && S.sideDrive.inYard > 0.1) flags.push('Side drive in the I-3 side yard: flagged approval (I-3 3.1.2.16: the Director may decrease the side yard for loading access)');
  if (drive && van && I2) flags.push('Side drive in I-2 (0 m side yards): it takes frontage from the hub');
  if (out.caps) { out.caps.rows.filter(r => r.over).forEach(r => flags.push(`Over the BE cap (${Math.round(r.gross)} / ${r.cap} m² gross): set in the rezoning (${r.name} as ${r.use}, Bylaw 20001 3.12.1; gross floor area, s. 8.20; flag, not a fail: project decision, 9 Nov Q11 and 14 Nov)`));
    const TDo = S.typDef || S.wingTyp, oth = TDo && TDo.otherReading && TDo.otherReading.edm; if (oth) { const all = grossOf(out.rooms, x => !(x.block === 'data centre' || x.dcSide || x.kind === 'bay'));
      flags.push(`If read as ${oth.reading}: ${Math.round(all)} / ${oth.cap} m² gross${all > oth.cap ? ' (over)' : ''} (the board's reading stands: ${oth.board};  item 4)`); } }
  if (!van && !S.typDef) { const rs = sum(out.rooms[1].filter(x => x.block === 'hub' && x.kind === 'proom' && /^(ref|shel)/.test(x.id)).map(x => sum(x.r.map(ra))));
    flags.push(`Refuge and day shelter as Community Service (Bylaw 20001 s. 8.10, our reading): ${Math.round(rs)} m² ${rs <= 500 ? '≤' : '>'} 500 m² per establishment (3.12.1)`); }
  Object.assign(res, out, { variant, ground });
  if (res.hookFlags) { if (res.hookFlags.length) (res.flags || (res.flags = [])).push(...res.hookFlags); delete res.hookFlags; }    
  res.toUV = (a, b) => [r2(uf - dir * (a0 + a)), r2(res.bOrigin + sv * b)];
  res.fromUV = (u, v) => [r2((uf - u) / dir - a0), r2((v - res.bOrigin) * sv)];    
  if (res.rooms && !res.fail && (RULES.layoutDrafts || []).length) {    
    let R2 = runHook('corridorEnd', res, S); R2 = runHook('truckCourt', R2, S); R2 = runHook('washrooms', R2, S, hookLoad(R2, S)); if (R2 !== res) Object.assign(res, R2);
    if (RULES.redrawAfterHooks && res.kind === 'bigroom' && res.Dbig && S.typDef && S.typDef.family) res.Dbig = (res.grade ? bigRoomDoorsC : bigRoomDoors)(res, S.typDef.constraints || []); }    
  if (res.rooms && !res.fail) fillVoids(res, S);    
  if (res.rooms && !res.fail) clipUpper(res);    
  finish(res, S);
  if (RULES.fillTopUp && res.rooms && !res.fail) fillVoids(res, S, false, true);    
  if (RULES.compactFill && res.rooms && !res.fail) compactFill(res, S);
  if (res.rooms && !res.fail) wetSideSwap(res, S);        
  if (RULES.hallStair3 && res.rooms && !res.fail) hallStair3(res, S);    
  if (res.rooms && !res.fail) { const g = gridRow(res, S); if (g) { res.grid = g; (res.flags || (res.flags = [])).push(g.text); } envRows(res, S); }    
   
  const C_ = out && out._C;
  if (C_ && res.plant && res.plant.ok && /shared/.test(res.plant.packer || '') && res.D) {
    const s1 = (res.rooms[1] || []).flatMap(x => x.r), inside = q => s1.some(r => Math.min(q[1], r[1]) - Math.max(q[0], r[0]) > 0.01 && Math.min(q[3], r[3]) - Math.max(q[2], r[2]) > 0.01);
    const land = []; res.D.filter(d => d[0] === 1 && (d[1] === 'OUT' || d[2] === 'OUT')).forEach(d => { const u = d[3], v = d[4], o = d[5];
      const cands = o === 'v' ? [[u, u + 1.2, v - 0.6, v + 0.6], [u - 1.2, u, v - 0.6, v + 0.6]] : [[u - 0.6, u + 0.6, v, v + 1.2], [u - 0.6, u + 0.6, v - 1.2, v]]; cands.filter(q => !inside(q)).forEach(q => land.push(q.map(r2))); });
    const P2 = plantLayout(C_, res.W, res.Da, res.MW, res.rooms, land);
    if (P2.ok) res.plant = Object.assign(P2, { landings: land.length });
    else flags.push(`Plant and door landings: with a 1.2 m landing clear outside every exterior door the yard does not hold the plant (${P2.why}); the plant is drawn without them (check in design)`); }
  if (!S.noV2) withV2(res, S);    
   
  if (RULES.thirdStair && res.kind === 'bigroom' && !S.s3 && res.rooms && res.rooms[3] && (res.travel || []).some(t => /storey 2 data centre/.test(t.zone) && t.worst != null && t.worst > 40)) {
    const t0 = res.travel.find(t => /storey 2 data centre/.test(t.zone)).worst, r3 = layout(Object.assign({}, S, { s3: true }));
    if (r3 && r3.rooms && !r3.fail && (r3.rooms[1] || []).some(x => x.id === 's3') && hardFails(r3).length <= hardFails(res).length) { const t1 = ((r3.travel || []).find(t => /storey 2 data centre/.test(t.zone)) || {}).worst;
      (r3.flags || (r3.flags = [])).push(`Third data-centre stair S3 ( item 6): storey-2 data-centre travel ${t0} m without it, ${t1} m with it; S3 runs grade to the top hall storey at the side-wall corner behind the ${'big room'}, discharging outside`); return r3; } }
  return res;
}

 
function pack(items, W, d) {
  const wa = items.map((it, i) => wallsW(items, i)), ws = items.map((it, i) => it.fix != null ? it.fix : Math.max((it.w || 0) + wa[i], it.m2 ? up1(it.m2 / Math.max(0.5, d - (wa[i] ? WALLD : 0)) + wa[i]) : 0));    
  let tot = r2(sum(ws)), judged = [];
  if (tot > W + 1e-6) {
     
    const mn = items.map((it, i) => { const m = it.mMin != null ? it.mMin : (PRG[it.id] && PRG[it.id].min); return it.fix == null && it.m2 && m != null && m < it.m2 ? Math.max((it.w || 0) + wa[i], up1(m / Math.max(0.5, d - (wa[i] ? WALLD : 0)) + wa[i])) : ws[i]; });
    const flex = r2(sum(ws.map((w, i) => w - mn[i]))), over = r2(tot - W);
    if (flex < over - 1e-6) return { fail: r2(sum(mn)) };
    const k = over / flex; ws.forEach((w, i) => { if (mn[i] < w - 1e-9) { ws[i] = Math.max(mn[i], Math.ceil((w - (w - mn[i]) * k) * 10 - 1e-6) / 10); judged.push(i); } });
    for (let g = 0; r2(sum(ws)) > W + 1e-6 && g < 400; g++) { const i = judged.slice().sort((x, y) => (ws[y] - mn[y]) - (ws[x] - mn[x]))[0]; if (i == null || ws[i] - 0.1 < mn[i] - 1e-9) return { fail: r2(sum(mn)) }; ws[i] = r2(ws[i] - 0.1); }
    tot = r2(sum(ws)); }
  const left = r2(W - tot), gi = items.findIndex(it => it.grow); if (gi >= 0) ws[gi] = r2(ws[gi] + left); else if (left > 0.01) ws[ws.length - 1] = r2(ws[ws.length - 1] + left);
  return { ws, judged };
}
function place(items, ws, b0, aA, aB) { let b = b0; return items.map((it, i) => { const r = [r2(aA), r2(aB), r2(b), r2(b + ws[i])]; b = r2(b + ws[i]); return Object.assign({}, it, { rr: r }); }); }

 
 
const LEFTOVER = 0.5;
function room(st, id, n, g, kind, rects, o) { return Object.assign({ st, id, n, g, kind, r: rects.map(r => r.map(r2)) }, o || {}); }

 
 
 
function isWing(d) { return !!(d && ((d.family && d.family.type === 'wing') || ((((d.hosts || {}).van || {}).use || []).includes('a_wing')))); }
function wingOf(def, st, van) { const city = van ? 'van' : 'edm', F = def.family || {}, cv = v => Array.isArray(v) ? v[0] : v && typeof v === 'object' ? v[city] : v;
  const merge = st.merge || {}, drop = new Set((st.drop || []).concat(Object.keys(merge)));
  const R = (def.rooms || []).filter(r => r.storey !== 'outdoor' && r.side !== 'dataCentre' && !drop.has(r.id)), RD = id => R.find(r => r.id === id);
  const area = r => { let a = cv(r.m2) != null ? cv(r.m2) : cv(r.minM2); for (const [f, t] of Object.entries(merge)) if (t === r.id) { const x = (def.rooms || []).find(q => q.id === f); if (x) a = (a || 0) + (cv(x.m2) != null ? cv(x.m2) : cv(x.minM2) || 0); } return a; };
  const na = (def.constraints || []).filter(c => c.type === 'nothingAbove').flatMap(c => c.room ? [c.room] : (c.rooms || []));
  const lobId = (F.wing && F.wing.lobby) || 'lobby';
  const wingIds = ((F.wing && F.wing.rooms) || [...new Set(na.concat(F.sky || []))]).filter(id => RD(id) && id !== lobId && id !== 'lob');
   
  R.filter(r => r.mergeInto && wingIds.includes(r.mergeInto) && !wingIds.includes(r.id)).forEach(r => wingIds.splice(wingIds.indexOf(r.mergeInto) + 1, 0, r.id));
  const behindIds = (F.behindWing || R.map(r => r.id).filter(id => !wingIds.includes(id) && id !== lobId && id !== 'lob' && id !== 'entry')).filter(id => RD(id) && !wingIds.includes(id));
  const item = (r, grow) => ({ id: r.id, n: r.name || r.id.replace(/_/g, ' '), k: 'proom', w: (r.minWClear != null ? r.minWClear : r.minW) || 0, clr: r.minWClear != null, walled: r.minWClear == null, m2: grow ? undefined : area(r), p: r.id, wingRoom: true, grow: !!grow, sky: na.includes(r.id) || (F.sky || []).includes(r.id), minArea: area(r) });
  const front = wingIds.map((id, i) => item(RD(id), i === 0)), firstMin = front.length ? front[0].minArea : 0;
  const bR = behindIds.map(id => RD(id));    
  const behind = bR.map(r => Object.assign(item(r, false), area(r) == null ? { w: Math.max((r.minWClear != null ? r.minWClear : r.minW) || 0, RULES.smallRoom.w), m2: undefined } : {})).concat([{ id: 'wspare', n: 'Unassigned program floor (no use yet)', k: 'spare', w: 0, grow: true }]);
  const minD = Math.max(6.0, ...front.map(x => x.w || 0));
   
  const rate = {}, noRate = []; wingIds.concat(behindIds).forEach(id => { const r = RD(id), v = r.perPersonM2 != null ? cv(r.perPersonM2) : /greenhouse|growing house|biome|glasshouse/i.test(id + ' ' + (r.name || '')) ? 2.8 : null; if (v) rate[id] = v; else if (!/wc|washroom|janitor|stores?|mech/i.test(id)) noRate.push(id); });
  return { front, behind, minD, rate, noRate, firstMin, wingIds, behindIds, merged: Object.keys(merge), name: def.name || def.id }; }
 
function wingWCs(C, F, rI) { const sm = RULES.smallRoom.w, wcm = RULES.wcMod.w;
  const ld = Math.ceil(sum(F.filter(x => C.wing.rate[x.id]).map(x => ra(x.rr) / C.wing.rate[x.id])) + sum(rI.filter(x => C.wing.rate[x.id] && x.m2).map(x => x.m2 / C.wing.rate[x.id])));
  C.wingLoad = ld; if (!(ld > 0)) return rI; rI = rI.filter(x => !/^(visitor_wcs?|wcs?|washrooms?)$/.test(x.id));
  const [nM, nF] = wcA(Math.ceil(ld / 2)), iS = rI.findIndex(x => x.id === 'wspare');
  rI.splice(iS < 0 ? rI.length : iS, 0, { id: 'wcw', n: `WC women (${nF})`, k: 'proom', w: Math.max(sm, r2(nF * wcm)), wc: nF }, { id: 'wcm', n: `WC men (${nM})`, k: 'proom', w: Math.max(sm, r2(nM * wcm)), wc: nM });
  return rI; }
 
function wingFits(C, ws, items, d) { if (!C.wing) return true; const i = items.findIndex(x => x.wingRoom && x.grow); return i < 0 || (ws[i] || 0) * d >= 0.95 * (C.wing.firstMin || 0) - 1e-6; }
function stacked(C) {
  let L = stackedRows(C);
   
  if (L.fail && /storey-2 back row/.test(L.fail) && !C.hubE) { let lastF = null; for (let E = 6; E <= 24; E++) { const C2 = Object.assign({}, C, { hubE: E }), L2 = stackedRows(C2); if (L2.fail) lastF = `${E} m: ${L2.fail}`; if (!L2.fail) { C.mapUV = C2.mapUV; L2.hubE = E; (C.flags || []).push(`Storey 2 side band (15f item 2): the straight back row failed (${L.fail}); the hub floor at grade runs ${E} m deeper before the entrance row, and the storey-2 data-centre rooms stand over it off a secure corridor looping from beside S1 to beside S2 (as the 339 and 8980 hub boards)`); L = L2; break; } } if (L.fail && lastF) L = Object.assign({}, L, { fail: `${L.fail}; storey-2 side band tried 6–24 m (last, ${lastF})` }); }
  if (!L.fail || C.turned || C.wing) return L;    
  const sp = C.spanOver(0, Math.min(40, C.aMax)); if (!sp || r2(sp[1] - sp[0]) >= RULES.narrow.wMax) return L;
  const N = narrowLot(C); return N.fail ? { fail: `${L.fail}; narrow layout: ${N.fail}` } : N;
}
function stackedRows(C) {
  let dR = RULES.rowR.d;    
  const { st, van } = C, cw = RULES.cor.w, SW = RULES.stair.w, SL = RULES.stair.l, wcm = RULES.wcMod.w, sm = RULES.smallRoom.w;
   
  let sp = C.spanOver(0, Math.min(40, C.aMax)); if (!sp) return { fail: 'no buildable width' };
  let W = r2(sp[1] - sp[0]); if (C.maxW) W = Math.min(W, C.maxW);    
  const build = (W, Da) => {
    const R = [], D = [];
     
    const clinicStairs = st.exams > 0;
    const serviceRow = (F, ovf) => { let ref2w = 0, rI, prr, load;
      for (let it = 0; it < 4; it++) {
        const areaRS = sum(F.filter(x => x.k === 'refuge' || x.k === 'shelter').map(x => ra(x.rr))) + ref2w * dR;    
        load = Math.ceil(areaRS / 0.75); const [nM, nF] = wcA(Math.ceil(load / 2));
        rI = (clinicStairs ? [{ id: 'p2', n: 'Stair P2 (clinic)', k: 'pcore', fix: SW, stair: true }, { id: 'e1', n: 'Lift E1 (public, storeys 1–2)', k: 'pcore', fix: RULES.e1.w, lift: true }] : [])
          .concat([{ id: 'wcw', n: `WC women (${nF})`, k: 'proom', w: Math.max(sm, r2(nF * wcm)), wc: nF }, { id: 'wcm', n: `WC men (${nM})`, k: 'proom', w: Math.max(sm, r2(nM * wcm)), wc: nM },
          { id: 'uwc', n: 'Universal WC', k: 'proom', w: PRG.uwc.w }, { id: 'sho', n: 'Universal shower', k: 'proom', w: PRG.sho.w },
          { id: 'fa', n: 'First aid', k: 'proom', w: PRG.fa.w, m2: PRG.fa.m2 }, { id: 'off', n: 'Staff office (shared)', k: 'proom', w: PRG.off.w, m2: PRG.off.m2 },
          { id: 'cot', n: 'Cot and supply storage', k: 'proom', w: sm }, { id: 'pmec', n: 'Programs mechanical, emergency panel', k: 'plant', w: PRG.pmec.w },
          { id: 'ref2', n: 'Refuge, second room (grown into spare floor)', k: 'refuge2', w: C.hubE ? sm : 0, grow: true }])    
          .concat(clinicStairs ? [{ id: 'p1', n: 'Stair P1 (clinic)', k: 'pcore', fix: SW, stair: true }] : []).filter(x => !ovf.includes(x.id));
        if (C.wing) { rI = C.wing.behind.map(x => Object.assign({}, x, C.hubE && x.id === 'wspare' ? { w: sm } : {}));
          rI = wingWCs(C, F, rI); }
        prr = pack(rI, W, dR); if (prr.fail && C.wing && RULES.wingRowDeeper) { for (let d = r2(dR + 0.5); d <= RULES.rowR.d + 8 + 1e-9; d = r2(d + 0.5)) { const p2 = pack(rI, W, d); if (!p2.fail) { prr = p2; dR = d; C.wingRowD = d; break; } } }
        if (prr.fail) return { fail: C.wing ? `the rooms behind the wing need ${prr.fail} m across; ${W} m available` : `hub service row needs ${prr.fail} m across; ${W} m available (washrooms for a load of ${load}, Table 3.7.2.2.-A)`, load };
        if (C.wing) break;
        const gi = rI.findIndex(x => x.id === 'ref2'), g = prr.ws[gi];
        if (g < PRG.refuge.w && !C.hubE) { const ci = rI.findIndex(x => x.id === (ovf.includes('cot') ? 'pmec' : 'cot')); prr.ws[ci] = r2(prr.ws[ci] + g); prr.ws[gi] = 0; if (ref2w === 0) break; ref2w = 0; continue; }
        if (Math.abs(g - ref2w) < 0.05) break; ref2w = g;
      }
      return { rItems: rI, pr: prr }; };
     
    const OVF = C.wing ? [] : ['off', 'fa', 'cot'];
    let F, dF, fItems, rItems, pr, lobW;
    for (let moveN = 0; moveN <= OVF.length; moveN++) {
      const ovf = OVF.slice(0, moveN);
      const ovfItems = ovf.map(id => id === 'off' ? { id: 'off', n: 'Staff office (shared)', k: 'proom', w: PRG.off.w, m2: PRG.off.m2, ovf: true } : id === 'fa' ? { id: 'fa', n: 'First aid', k: 'proom', w: PRG.fa.w, m2: PRG.fa.m2, ovf: true } : { id: 'cot', n: 'Cot and supply storage', k: 'proom', w: sm, ovf: true });
      let pf = null, fNeed = Infinity;    
      for (lobW of RULES.lobby.ws) {
        fItems = [{ id: 'ref', n: st.shelter ? 'Refuge main room' : 'Refuge main room, day shelter merged (ladder step 3)', k: 'refuge', w: 4.0, m2: PRG.refuge.m2, grow: true }]
          .concat(st.shelter ? [{ id: 'shel', n: 'Warming shelter rest area (day)', k: 'shelter', w: 4.0, m2: PRG.shelter.m2 }] : []).concat(ovfItems)
          .concat([{ id: 'lob', n: 'Shared lobby', k: 'lobby', w: lobW, m2: RULES.lobby.m2 }]);
        if (C.wing) fItems = C.wing.front.map(x => Object.assign({}, x)).concat([{ id: 'lob', n: 'Shared lobby', k: 'lobby', w: lobW, m2: RULES.lobby.m2 }]);    
         
        var dUp = null;
        if (C.wing && RULES.stackD) { const isUp = x => x.sky && !/kitchen/i.test(x.id || '');
          const cor = [{ id: 'p1', n: 'Stair P1 (public)', k: 'pcore', fix: SW, stair: true }, { id: 'e1', n: 'Lift E1 (public, storeys 1-2)', k: 'pcore', fix: RULES.e1.w, lift: true }], endS = [{ id: 'p2', n: 'Stair P2 (public)', k: 'pcore', fix: SW, stair: true }];
          const ups = C.wing.front.filter(isUp).map((x, i) => Object.assign({}, x, { grow: i === 0 })), grade = C.wing.front.filter(x => !isUp(x)).map(x => Object.assign({}, x, { grow: false }));
          if (ups.length) { dUp = cor.concat(ups, endS); fItems = cor.concat(grade, [{ id: 'lob', n: 'Shared lobby', k: 'lobby', w: lobW, m2: RULES.lobby.m2 }, { id: 'wfsp', n: 'Unassigned program floor (no use yet; under the roof rooms)', k: 'spare', w: 0, grow: true }], endS); } }
        const minF = C.wing ? C.wing.minD : (PRG.refuge.m2 + (st.shelter ? PRG.shelter.m2 : 0)) / Math.max(1, W - lobW);
        pf = { fail: r2(W + 0.1) };
        for (dF = Math.max(6.0, up1(minF)); dF <= (C.wing ? 40 : 24) + 1e-9; dF = r2(dF + 0.1)) { pf = pack(fItems, W, dF); if (typeof pf.fail === 'number') fNeed = Math.min(fNeed, pf.fail);
          if (!pf.fail && dUp) { const pu = pack(dUp, W, dF); if (pu.fail) { if (typeof pu.fail === 'number') fNeed = Math.min(fNeed, pu.fail); pf = { fail: r2(W + 0.1) }; continue; } if (!wingFits(C, pu.ws, dUp, dF)) { pf = { fail: r2(W + 0.1) }; continue; } C.dUpWs = pu.ws; break; }    
          if (!pf.fail && wingFits(C, pf.ws, fItems, dF)) break; if (!pf.fail) pf = { fail: r2(W + 0.1) }; }
        if (!pf.fail) break;
      }
      if (pf.fail && isFinite(fNeed)) pf.fail = r2(fNeed);
      if (pf.fail) return { fail: C.wing ? `the wing needs ${pf.fail} m across at up to 40 m deep; ${W} m available (${C.wing.front.map(x => x.id.replace(/_/g, ' ')).join(', ')} and the lobby)` : `front row needs ${pf.fail} m across; ${W} m available (refuge ${PRG.refuge.m2} m² + shelter + lobby ≥ ${RULES.lobby.m2} m², spec 1a, 15c)` };
      F = place(fItems, pf.ws, 0, 0, dF);
      const sr = serviceRow(F, ovf); if (sr.fail && moveN < OVF.length) continue; if (sr.fail) return sr; rItems = sr.rItems; pr = sr.pr; break;
    }
    const aC = dF, aR = r2(dF + cw), aB0 = r2(aR + dR), aB = r2(aB0 + (C.hubE || 0));    
    const Rr = place(rItems, pr.ws, 0, aR, aB0).filter(x => x.rr[3] - x.rr[2] > 0.01);
     
    const pub = (x, rect, extra) => R.push(room(1, x.id, x.n, x.k === 'plant' ? 'plant' : x.k === 'lobby' ? 'circ' : x.k === 'pcore' ? 'circ' : 'pub', x.k === 'refuge' || x.k === 'shelter' || x.k === 'refuge2' ? 'proom' : x.k, rect, Object.assign({ block: 'hub' }, extra || {})));
    F.forEach(x => pub(x, [x.rr], { prog: x.wingRoom ? x.id : x.k, sky: x.sky || undefined, wingRoom: x.wingRoom || undefined }));
    R.push(room(1, 'cor', 'Public corridor', 'circ', 'pcor', [[aC, aR, 0, W]], { block: 'hub', corridor: true }));
    Rr.forEach(x => { if (x.lift) { pub(x, [[aR, r2(aR + RULES.e1.l), x.rr[2], x.rr[3]]], { core: true, lift: true }); R.push(room(1, 'psh', 'Programs shaft', 'circ', 'shaft', [[r2(aR + RULES.e1.l), aB0, x.rr[2], x.rr[3]]], { block: 'hub', core: true })); }
      else if (C.wingRowD && C.wingRowD > RULES.rowR.d + 1e-6 && !x.stair && /(^|_)(wc|uwc|wcw|wcm|washroom)|^wc|washroom|WC/i.test((x.id || '') + ' ' + (x.n || ''))) {    
        const a1 = r2(aR + RULES.rowR.d); pub(x, [[x.rr[0], a1, x.rr[2], x.rr[3]]], { prog: x.wingRoom ? x.id : x.k, wingRoom: x.wingRoom || undefined });
        if (aB0 - a1 > 0.05) R.push(room(1, 'wrs_' + x.id, 'Unassigned program floor (the wing row runs deeper here; the washroom keeps its size)', 'spare', 'spare', [[a1, aB0, x.rr[2], x.rr[3]]], { block: 'hub' })); }
      else pub(x, [x.rr], { core: !!x.stair, stair: !!x.stair, prog: x.wingRoom ? x.id : x.k, wingRoom: x.wingRoom || undefined }); });
     
    if (C.hubE) { const g = R.find(x => x.id === 'ref2' || x.id === 'wspare');    
      if (g) { g.r.push([aB0, aB, 0, W]); g.hubBand = true; } else R.push(room(1, 'refx', 'Hub floor before the entrance row (no use yet)', 'pub', 'proom', [[aB0, aB, 0, W]], { block: 'hub' })); }
    const bayL = van ? 10.2 : 9.0, bayW = van ? 3.4 : 3.3;
    const Up = dUp && C.dUpWs ? place(dUp, C.dUpWs, 0, 0, dF) : null;    
    return { R, D, F, Rr, dF, aC, aR, aB, aB0, bayL, bayW, Up };
  };
   
  let B = build(W, 0); if (B.fail) return B;
  const aB = B.aB, cores = 2 * SW * SL + RULES.e2.w * RULES.e2.l;
  const hallNeed = HPM() * C.mw;
  let Da = up1((hallNeed + cores) / W + (C.wing ? B.dF : 0));    
   
  const Dline = r2(aB + B.bayL), minDa0 = r2(aB + RULES.dcFront.d + RULES.cor.w + 6.0), minDa = RULES.lineOn ? Math.min(minDa0, Dline) : minDa0;    
  if (RULES.lineOn && Dline < r2(aB + RULES.dcFront.d + RULES.cor.w + 3.0)) return { fail: `the building line (the back of the loading bays, ${Dline} m) leaves under 3 m for the storey-2 back row` };
   
  let lineCut = RULES.lineOn && Da > Dline + 1e-6; if (RULES.lineOn) Da = Math.min(Math.max(Da, minDa), Dline); else Da = Math.max(Da, minDa0, r2(aB + B.bayL + 0.1));
  if (Da > C.aMax) { lineCut = false; Da = Math.floor(C.aMax * 10) / 10; if (Da < minDa) return { fail: `the lot is ${C.aMax} m deep inside the yards and depth limit; the stacked hub needs ${minDa} m` }; }
   
  sp = C.spanOver(0, Da); if (!sp) return { fail: 'no width over the building depth' };
  if (r2(sp[1] - sp[0]) < W - 1e-6) { W = r2(Math.floor((sp[1] - sp[0]) * 100) / 100); B = build(W, Da); if (B.fail) return B; }    
  const bOrigin = C.sv < 0 ? sp[1] : sp[0];
  C.mapUV = (a, b) => [C.uOf(C.a0 + a), bOrigin + C.sv * b];
  const L = stackedRest(C, B, W, Da, true);
  if (L.fail) return L;
  Object.assign(L, { W, Da, bOrigin, lineCut, Dline });
   
  let guard = 0; while (L.dcArea > CAPM2() + 0.5 && guard++ < 60) { const Da2 = r2(L.Da - 0.5); if (Da2 < minDa) break; const L2 = stackedRest(C, B, W, Da2, true); if (L2.fail) break; Object.assign(L2, { W, Da: Da2, bOrigin }); Object.assign(L, L2); L.capped = true; }
   
  const skip = [];    
  if (L.dcArea > CAPM2() + 0.5) { let W2 = W; const Da0 = L.Da;
    while (L.dcArea > CAPM2() + 0.5 && guard++ < 260) { W2 = r2(W2 - 1); if (W2 < 15) break; const B2 = build(W2, Da0); if (B2.fail) { skip.push([W2, B2.fail]); continue; } const L2 = stackedRest(C, B2, W2, Da0, true); if (L2.fail) { skip.push([W2, L2.fail]); continue; } if (L2.dcArea > CAPM2() + 0.5) skip.length = 0;
      Object.assign(L2, { W: W2, Da: Da0, bOrigin }); Object.assign(L, L2); L.capped = true; L.capW = { from: W, to: W2 }; }
    if (L.dcArea > CAPM2() + 0.5) return { fail: `the data centre stays ${Math.round(L.dcArea)} m² at the smallest depth and width tried, over the hub cap of ${RULES.cap.m2} m² (project decision, 8 Nov)` }; }
   
  if (L.capped && !L.sizeStop) {
    if (skip.length) { const why0 = skip[0][1], rule = /storey-2 back row/.test(why0) ? 'storey-2 back row' : why0.split(':')[0].split(' needs')[0];
      L.sizeStop = { rule, at: L.MW, why: `floor cap, then ${rule}: the building narrows to keep the data centre at or under ${RULES.cap.m2} m²; from ${skip[0][0]} to ${skip[skip.length - 1][0]} m wide it doesn't lay out (${why0}); kept at ${L.W} m, the widest that does` };
      (C.flags || []).push(`${capTxt()}: ${L.sizeStop.why}`); }
    else L.sizeStop = { rule: 'floor cap', at: L.MW, why: `held at the ${RULES.cap.m2} m² floor cap (the building narrowed to ${L.W} m)` }; }
  L.plant = plantLayout(C, L.W, L.Da, L.MW, L.rooms);
  return L;
}
 
 
const STEPD = new WeakMap();
function stepDef(C) { const d0 = C.S.typDef, F = d0.family, city = C.van ? 'van' : 'edm', drop = C.st.drop || [], lite = !!F.second && drop.includes(F.big), key = city + (lite ? '|lite' : '');
  let m = STEPD.get(d0); if (!m) { m = {}; STEPD.set(d0, m); } if (m[key]) return m[key];
  const cv = v => v && typeof v === 'object' && !Array.isArray(v) ? v[city] : v, E = (d0.establishments || []).filter(e => !e.whenStepAtLeast);
  const F2 = Object.assign({}, F, { behindWet: F.behindWet || { rooms: [] }, upper: F.upper && F.upper.rooms ? F.upper : { rooms: [], over: null }, behindBig: Object.assign({ chem: [], chemDepth: 3.0 }, F.behindBig || {}) });    
  const d = Object.assign({}, d0, { family: F2, rooms: (d0.rooms || []).map(r => { const o = Object.assign({}, r), mn = cv(r.minM2), lm = cv(r.liteMinArea);
    o.m2 = cv(r.m2); if (mn != null && (o.m2 == null || o.m2 < mn)) o.m2 = mn; if (mn != null) o.minM2 = mn;    
    if (Array.isArray(r.drawn) && o.drawnW == null) { o.drawnW = r.drawn[0]; o.drawnL = r.drawn[1]; }    
    if (lite && lm != null) { o.m2 = lm; o.minM2 = lm; }    
    if (!o.block) { const e = E.find(e => (e.rooms || []).includes(r.id)); o.block = e ? e.id : 'pool'; }
    return o; }) });
  return (m[key] = d); }
function secondOf(F) { const x = F.second;     return x ? (typeof x === 'string' ? { id: x } : x) : null; }
 
function rowOf(def, hallId, has, extra, alt) { let via = (def.constraints || []).filter(c => c.type === 'accessOnlyVia' && Array.isArray(c.via) && c.via.length && c.via.every(v => v === hallId)).map(c => c.room);
   
  if (alt) via = via.filter(id => !((def.family.wetBand || {}).rooms || []).includes(id));
  return [...new Set((extra || []).concat(via))].filter(has); }
function hasRowAlt(def) { const F = def.family || {}, halls = [F.big].concat(F.second ? [F.second.id || F.second] : []), wb = (F.wetBand || {}).rooms || [];
  return (def.constraints || []).some(c => c.type === 'accessOnlyVia' && Array.isArray(c.via) && c.via.length === 1 && halls.includes(c.via[0]) && wb.includes(c.room)); }
 
function hallSeg(x, row, hW, len0, m2Of) { const A = m2Of(x) || 0, mw = x.minW || 0;
  if (!row.length) { if (x.minW && x.minW > hW + 1e-6) return null; return { len: r2(Math.max(len0 || Math.max(x.minW || 0, up1(A / hW)), x.minL || 0)), dS: 0, ls: [] }; }        
  const dS0 = Math.max(1.5, ...row.map(y => y.minW || 0));
  let best = null; for (let dS = dS0; hW - dS >= mw - 1e-6; dS = r2(dS + 0.1)) { const ls = row.map(y => Math.max(y.minW || 0, up1((m2Of(y) || 0) / dS))), L = sum(ls);
    const len = r2(Math.max(len0 || 0, x.minL || 0, L, up1(((RULES.belowMinFails ? 1 : 0.95) * A + dS * L) / hW)));         if (!best || len < best.len - 1e-6) best = { len, dS, ls }; }
  return best; }
const rowIds0Of = (secRow, bigRow) => secRow.concat(bigRow).map(y => y.id);
function bandOf(def, has, RD, m2Of, lead, alt) { const F = def.family, big = RD(F.big), sec = secondOf(F), secX = sec && has(sec.id) ? RD(sec.id) : null, bigOn = has(F.big) || !secX;
  const L0 = bigOn ? big : secX;    
  const w0 = L0.drawnW || L0.minW, bigL0 = big.drawnL || big.minL || null, bigRow = bigOn ? rowOf(def, big.id, has, null, alt).filter(id => id !== (secX && secX.id)).map(RD) : [];
  const secRow = secX ? rowOf(def, secX.id, has, sec.with || [], alt).map(RD) : [], secL0 = secX ? (sec.len || (F.drawingChoices || {}).spaBandWidth || secX.drawnL || null) : 0;
  if (!secX && !bigRow.length) return { big, ph: big, hW: w0, hL: bigL0 || up1((m2Of(big) || 0) / w0), hLb: bigL0 || up1((m2Of(big) || 0) / w0), sec: null, segs: [] };
  let pick = null;
  for (let hW = w0; hW <= w0 + 8 + 1e-9; hW = r2(hW + 0.1)) { if (L0.drawnW && hW > w0 + 1e-6 && pick) break;
    const sB = bigOn ? hallSeg(big, bigRow, hW, bigL0, m2Of) : { len: 0, dS: 0, ls: [] }, sS = secX ? hallSeg(secX, secRow, hW, secL0, m2Of) : null;
    if (!sB || (secX && !sS)) continue; const area = hW * (sB.len + (sS ? sS.len : 0));
    if (!pick || area < pick.area - 1e-6) pick = { hW, sB, sS, area }; if (L0.drawnW && hW === w0) break; }
  if (!pick) return { fail: `the ${secX ? 'two halls' : big.name.toLowerCase()} and the rooms beside ${secX ? 'them' : 'it'} (${secRow.concat(bigRow).map(y => y.id).join(', ')}) do not fit across any band up to ${r2(w0 + 8)} m wide` };
   
  let secExt = null; if (secX && lead != null) { const viaS = new Set((def.constraints || []).filter(c => c.type === 'accessOnlyVia' && c.room === secX.id).flatMap(c => c.via || [])), wB = def.family.wetBand.depth;
    let p = lead, need = null; for (const id of def.family.wetBand.rooms.filter(id => has(id) && !rowIds0Of(secRow, bigRow).includes(id))) { if (viaS.has(id)) { need = r2(p + 1.2); break; } const x = RD(id); p = r2(p + Math.max(x.minW || 0, up1((m2Of(x) || 0) / wB))); }
    if (need != null && need > pick.sS.len + 1e-6) { secExt = { from: pick.sS.len, to: need }; pick.sS = Object.assign({}, pick.sS, { len: need }); } }
  const segs = []; if (secX) segs.push({ x: secX, len: pick.sS.len, dS: pick.sS.dS, row: secRow.map((y, i) => ({ id: y.id, x: y, l: pick.sS.ls[i] })), second: true, ext: secExt });
  if (bigOn) segs.push({ x: big, len: pick.sB.len, dS: pick.sB.dS, row: bigRow.map((y, i) => ({ id: y.id, x: y, l: pick.sB.ls[i] })) });
  const ph = bigOn ? big : secX, rowIds0 = segs.flatMap(g => g.row.map(o => o.id));
   
  if (sec && lead != null) { const wB = def.family.wetBand.depth, need = r2(lead + sum(def.family.wetBand.rooms.filter(id => has(id) && !rowIds0.includes(id)).map(id => { const x = RD(id); return Math.max(x.minW || 0, up1((m2Of(x) || 0) / wB)); }))), have = r2(sum(segs.map(g => g.len)));
    if (need > have + 1e-6) segs.push({ spare: true, len: r2(need - have), row: [], x: { id: 'fspb', name: 'Unassigned program floor (no use yet; the band\u2019s length the wet band needs at this step)' } }); }
  return { big, ph, hW: pick.hW, hL: bigOn ? pick.sB.len : 0, hLb: r2(sum(segs.map(g => g.len))), sec: secX, segs, rowIds: segs.flatMap(g => g.row.map(o => o.id)) }; }
 
 
 
 
function hallStair3(L, S) { const fz = (L.apart || []).filter(a => a.status === 'fail' && /hall|data centre/.test(a.zone)); if (!fz.length || !L.toUV || !S || !S.ring) return;
  const sts = Object.keys(L.rooms).map(Number).sort((a, b) => a - b), top = Math.max(...fz.map(a => a.st)), s1r = ((L.rooms[1] || []).find(x => x.id === 's1') || {}).r;
  const dims = s1r && s1r[0] ? [r2(s1r[0][1] - s1r[0][0]), r2(s1r[0][3] - s1r[0][2])] : [6.9, 2.6], dW = RULES.door.w;
  const prot = x => x.core || x.stair || x.lift || x.kind === 'shaft' || x.kind === 'bay' || x.kind === 'dock' || x.kind === 'exitpas' || x.kind === 'score' || x.kind === 'pcore' || x.g === 'plant' || x.kind === 'entry';
  const used = sts.filter(st => st <= top), bb = st => { const rs = L.rooms[st].flatMap(x => x.r); return [Math.min(...rs.map(r => r[0])), Math.max(...rs.map(r => r[1])), Math.min(...rs.map(r => r[2])), Math.max(...rs.map(r => r[3]))]; };
  const B = used.map(bb).reduce((a, b) => [Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.min(a[3], b[3])]); if (B[1] - B[0] < 3 || B[3] - B[2] < 3) return;
  const ov = (r, q) => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.01 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.01;
  const cands = []; for (const [w, l] of [dims, [dims[1], dims[0]]]) for (const cu of [0, 1]) for (const cv of [0, 1]) cands.push([cu ? r2(B[1] - w) : B[0], cu ? B[1] : r2(B[0] + w), cv ? r2(B[3] - l) : B[2], cv ? B[3] : r2(B[2] + l)]);
  const inAny = (R, a, b) => R.some(x => x.r.some(r => a > r[0] && a < r[1] && b > r[2] && b < r[3]));
  const base = hardFails(L).length; let best = null;
  for (const q of cands) {
    if (used.some(st => subAll([q], L.rooms[st].flatMap(x => x.r)).some(r => ra(r) > 0.05))) continue;    
    if (used.some(st => L.rooms[st].some(x => prot(x) && x.r.some(r => ov(r, q))))) continue;
     
    const R1 = L.rooms[1], sides = [{ o: 'v', at: q[0], f: q[2], t: q[3], d: -1 }, { o: 'v', at: q[1], f: q[2], t: q[3], d: 1 }, { o: 'h', at: q[2], f: q[0], t: q[1], d: -1 }, { o: 'h', at: q[3], f: q[0], t: q[1], d: 1 }];
    let out = null; for (const sd of sides) { const c = r2((sd.f + sd.t) / 2), p = sd.o === 'v' ? [sd.at + sd.d * 0.9, c] : [c, sd.at + sd.d * 0.9], p0 = sd.o === 'v' ? [sd.at + sd.d * 0.1, c] : [c, sd.at + sd.d * 0.1];
      if (inAny(R1, p0[0], p0[1]) || inAny(R1, p[0], p[1]) || !inPoly(L.toUV(p[0], p[1]), S.ring)) continue; out = sd.o === 'v' ? [1, 's3h', 'OUT', r2(sd.at), c, 'v', dW] : [1, 's3h', 'OUT', c, r2(sd.at), 'h', dW]; break; }
    if (!out) continue;
    const C = Object.assign({}, L, { rooms: {}, D: L.D.filter(d => !(d[3] > q[0] - 0.01 && d[3] < q[1] + 0.01 && d[4] > q[2] - 0.01 && d[4] < q[3] + 0.01)), flags: (L.flags || []).slice() });
    Object.keys(L.rooms).forEach(st => { C.rooms[st] = L.rooms[st].map(x => Object.assign({}, x, { r: +st <= top ? subAll(x.r.map(r => r.slice()), [q]).filter(r => ra(r) > 0.01) : x.r })).filter(x => x.r.length); });
    const gone = new Set(); Object.keys(L.rooms).forEach(st => L.rooms[st].forEach(x => { if (!C.rooms[st].some(y => y.id === x.id)) gone.add(st + ':' + x.id); }));
    C.D = C.D.filter(d => !gone.has(d[0] + ':' + d[1]) && !gone.has(d[0] + ':' + d[2])); C.D.push(out); let ok = true;
    for (const st of used) { C.rooms[st].push(room(st, 's3h', 'Stair S3 (data centre, third exit: 3.4.2.3 spacing)', 'sup', 'score', [q], { block: 'data centre', core: true, stair: true }));
      if (st === 1) continue; let bw = null, by = null; for (const y of C.rooms[st]) { if (y.id === 's3h' || prot(y)) continue; for (const r of y.r) for (const w of wallSeg(q, r)) if (w.len >= dW + 0.2 && (!bw || w.len > bw.len)) { bw = w; by = y; } }
      if (!bw) { ok = false; break; } const c = r2((bw.f + bw.t) / 2); C.D.push(bw.o === 'v' ? [st, 's3h', by.id, r2(bw.at), c, 'v', dW] : [st, 's3h', by.id, c, r2(bw.at), 'h', dW]); }
    if (!ok) continue;
    try { analyse(C, S); } catch (e) { continue; }
    const n = hardFails(C).length; if (n < base && (!best || n < best.n)) best = { n, C, q }; }
  if (best) { const C = best.C; ['rooms', 'D', 'G', 'treach', 'stairs', 'zones', 'travel', 'apart', 'discharge', 'grades', 'loading', 'patchRows'].forEach(k => { if (k in C) L[k] = C[k]; });
    (L.flags || (L.flags = [])).push(`Third data-centre stair S3 ( item 1, option A): ${fz.map(a => `${a.zone} exits ${a.apart_m} m apart, ${a.need_m} m needed`).join('; ')}; a full-height stair at the stack's corner (${best.q.map(v => r2(v)).join(', ')}), discharging straight outside at grade; hard fails ${base} → ${best.n}`); }
  else (L.flags || (L.flags = [])).push(`exit-spacing:no-position: ${fz.map(a => `${a.zone} exits ${a.apart_m} m apart, ${a.need_m} m needed (3.4.2.3)`).join('; ')}: no stair position at a corner of the stack clears it`); }
 
 
 
function skyCut(out, def) { if (!out || !out.rooms || !def) return; const ids = new Set((def.constraints || []).filter(c => c.type === 'nothingAbove').flatMap(c => [].concat(c.rooms || c.room || c.args || [])));
  const sky = ((out.rooms[1]) || []).filter(x => ids.has(x.prog || x.id) || ids.has(x.id)).flatMap(x => x.r); if (!sky.length) return; let lost = 0, hallLost = 0;
  const ov = (r, q) => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.01 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.01;
  for (const st of Object.keys(out.rooms).filter(k => +k > 1)) { const R = out.rooms[st];
    for (const x of R) { if (!x.r.some(r => sky.some(q => ov(r, q)))) continue; const a0 = sum(x.r.map(ra)); x.r = subAll(x.r, sky).filter(r => ra(r) > 0.01); const d = a0 - sum(x.r.map(ra)); lost += d; if (x.kind === 'hall') hallLost += d; }
    for (let i = R.length - 1; i >= 0; i--) if (!R[i].r.length) R.splice(i, 1); }
  if (hallLost > 0 && out.hall) { out.hall = r2(out.hall - hallLost); out.MW = out.hall / HPM(); if (out.dcArea) out.dcArea = r2(out.dcArea - hallLost); }
  if (lost > 0) (out.flags || (out.flags = [])).push(`Nothing above ( item 2): ${r2(lost)} m² of upper-storey floor cut from over the definition's nothingAbove rooms${hallLost > 0 ? ` (${r2(hallLost)} m² of data hall; MW recomputed)` : ''}`); }
function coresWin(L) { if (!L.rooms) return; const ov = (r, q) => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.01 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.01, cut = [];
  for (const st of Object.keys(L.rooms)) { const R = L.rooms[st], cores = R.filter(x => x.core || x.stair || x.lift || x.kind === 'shaft');
    for (const x of R) { if (x.core || x.stair || x.lift || x.kind === 'shaft') continue; const hit = cores.filter(c => c.r.some(q => x.r.some(r => ov(r, q)))); if (!hit.length) continue;
      const before = sum(x.r.map(ra)); x.r = subAll(x.r, hit.flatMap(c => c.r)).filter(r => ra(r) > 0.01); cut.push(`storey ${st} ${x.id} −${r2(before - sum(x.r.map(ra)))} m² (${hit.map(c => c.id).join(', ')})`); }
    for (let i = R.length - 1; i >= 0; i--) if (!R[i].r.length) R.splice(i, 1); }
  if (cut.length) (L.flags || (L.flags = [])).push(`Rooms cut around cores ( item 2): ${cut.join('; ')}`); }
function doorlessFix(L, S) { if (!L.rooms || !L.D) return; const D = L.D, dW = RULES.door.w, done = [];
   
  if (S && S.ring && L.toUV) for (const st of Object.keys(L.rooms)) { if (+st !== 1) continue; const R = L.rooms[st], inAny = (a, b) => R.some(y => y.r.some(q => a > q[0] && a < q[1] && b > q[2] && b < q[3]));
    for (const x of R.filter(y => /^acc1_/.test(y.id || ''))) { if (x.exitDone) continue; x.exitDone = true; const q = x.r[0], vert = q[3] - q[2] > q[1] - q[0];
      const ends = vert ? [[(q[0] + q[1]) / 2, q[2], -1], [(q[0] + q[1]) / 2, q[3], 1]] : [[q[0], (q[2] + q[3]) / 2, -1], [q[1], (q[2] + q[3]) / 2, 1]];
      for (const [a, b, sg] of ends) { const p0 = vert ? [a, b + sg * 0.1] : [a + sg * 0.1, b], p1 = vert ? [a, b + sg * 0.9] : [a + sg * 0.9, b];
        if (inAny(p0[0], p0[1]) || inAny(p1[0], p1[1]) || !inPoly(L.toUV(p1[0], p1[1]), S.ring)) continue;
        D.push(vert ? [1, x.id, 'OUT', r2(a), r2(b), 'h', dW] : [1, x.id, 'OUT', r2(a), r2(b), 'v', dW]); done.push(`storey 1 ${x.id}: exit door at its end, straight outside`); } } }    
  const skip = x => x.shell || x.core || x.stair || x.lift || x.kind === 'shaft' || x.kind === 'bay' || x.kind === 'dock' || x.kind === 'hall' || x.kind === 'exitpas' || x.kind === 'score' || x.kind === 'pcore' || x.vest || ((x.corridor || ['pcor', 'scor', 'ccor', 'lobby'].includes(x.kind)) && !/^acc/.test(x.id || ''));    
  const isCor = y => y.corridor || ['pcor', 'scor', 'ccor', 'lobby'].includes(y.kind);
  const bad = y => y.core || y.stair || y.lift || y.kind === 'shaft' || y.kind === 'bay' || y.kind === 'hall' || y.big || y.big2 || /hypochlorite|chlorine|acid|chemical store/i.test((y.id || '') + ' ' + (y.n || '')) || /(^|_)wc|washroom|universal_wc|^uwc/i.test(y.id || '');
  for (const st of Object.keys(L.rooms)) { const R = L.rooms[st];
    const hasDoor = id => D.some(d => String(d[0]) === String(st) && (d[1] === id || d[2] === id));
    const wall = (x, y, min) => { let best = null; for (const r of x.r) for (const q of y.r) for (const w of wallSeg(r, q)) if (w.len >= min && (!best || w.len > best.len)) best = w; return best; };
    const dr = (a, b, w) => { const c = r2((w.f + w.t) / 2); return w.o === 'v' ? [+st, a, b, r2(w.at), c, 'v', dW] : [+st, a, b, c, r2(w.at), 'h', dW]; };
    const corDoor = id => D.some(d => String(d[0]) === String(st) && (d[1] === id || d[2] === id) && (() => { const o = d[1] === id ? d[2] : d[1], y = R.find(z => z.id === o); return !!y && isCor(y); })());
    for (const x of R.slice()) { if (skip(x) || (/^acc/.test(x.id || '') ? corDoor(x.id) : hasDoor(x.id))) continue;    
      let w = null, y = null; for (const z of R) { if (z === x || !isCor(z)) continue; const w2 = wall(x, z, dW + 0.2); if (w2 && (!w || w2.len > w.len)) { w = w2; y = z; } }
      if (y) { D.push(dr(x.id, y.id, w)); done.push(`storey ${st} ${x.id}: door to ${y.id}`); continue; }
      if (/^acc/.test(x.id || '')) { done.push(`storey ${st} ${x.id}: access corridor with no corridor beside it`); continue; }    
       
      const wasProg = !(x.kind === 'spare' || /^unassigned/i.test(x.n || '')); Object.assign(x, { kind: 'shell', g: 'spare', block: x.block === 'data centre' ? 'data centre' : 'spare', n: `Shell space, no access drawn (was: ${(x.n || x.id).split(' (')[0]}; no corridor or lobby wall)`, shell: true, prog: undefined, shellProg: wasProg ? r2(sum(x.r.map(ra))) : 0 });
      done.push(`storey ${st} ${x.id}: shell space (no corridor or lobby wall)`); continue;
      done.push(`storey ${st} ${x.id}: NO DOOR (no corridor, lobby or room beside it to open onto)`); } }
  if (done.length) (L.flags || (L.flags = [])).push(`Rooms with no door ( item 2; plan invariants): ${done.join('; ')}`);
   
  const short = Math.round(sum(Object.values(L.rooms).flat().map(x => x.shellProg || 0))); if (L.flags) for (let i = L.flags.length - 1; i >= 0; i--) if (/^Program short by /.test(L.flags[i])) L.flags.splice(i, 1);
  if (short > 0) (L.flags || (L.flags = [])).push(`Program short by ${short} m² (rooms with no access drawn, shell space)`); }
 
 
function fillPiecesReach(R, x, r, alongA, mx, minW) { const cors = R.filter(y => y !== x && (y.corridor || ['pcor', 'ccor', 'lobby'].includes(y.kind)) && y.kind !== 'scor');
  const len = alongA ? r[1] - r[0] : r[3] - r[2], dep = alongA ? r[3] - r[2] : r[1] - r[0], lc = Math.max(minW, mx / Math.max(0.5, dep)), n = Math.max(1, Math.floor(len / lc + 1e-9)), w = len / n;
  for (let i = 0; i < n; i++) { const p = alongA ? [r[0] + i * w, r[0] + (i + 1) * w, r[2], r[3]] : [r[0], r[1], r[2] + i * w, r[2] + (i + 1) * w];
    if (!cors.some(y => y.r.some(q => wallLen(p, q) >= 1.0))) return false; }
  return true; }
function fillAccess(R, st, r, x) { const SWA = 1.5, cors = R.filter(y => y !== x && (y.corridor || ['pcor', 'ccor', 'lobby'].includes(y.kind)) && y.kind !== 'scor');
  const sides = [{ o: 'v', at: r[0], f: r[2], t: r[3] }, { o: 'v', at: r[1], f: r[2], t: r[3] }, { o: 'h', at: r[2], f: r[0], t: r[1] }, { o: 'h', at: r[3], f: r[0], t: r[1] }];
  let best = null; sides.forEach((sd, i) => { let c = 0, c0 = 1e9, c1 = -1e9; for (const y of cors) for (const q of y.r) { const touch = sd.o === 'v' ? (Math.abs(q[1] - sd.at) < 0.05 || Math.abs(q[0] - sd.at) < 0.05) : (Math.abs(q[3] - sd.at) < 0.05 || Math.abs(q[2] - sd.at) < 0.05); if (!touch) continue;
      const a = Math.max(sd.f, sd.o === 'v' ? q[2] : q[0]), b = Math.min(sd.t, sd.o === 'v' ? q[3] : q[1]); if (b - a > 0.05) { c += b - a; c0 = Math.min(c0, a); c1 = Math.max(c1, b); } }
    if (c > 1.0 && (!best || c > best.c)) best = { i, sd, c, c0, c1 }; });
  if (!best) {  
    const bad = y => y.core || y.stair || y.lift || ['shaft', 'bay', 'dock', 'hall', 'exitpas', 'score', 'pcore'].includes(y.kind) || y.big || y.big2 || y.wet || /(^|_)(pool_plant|bath_plant|plant|mech|pmec|mv)(_|$)/i.test(y.id || '') || /plant room|mechanical|switchgear/i.test(y.n || '') || /(^|_)(wc|uwc|wcw|wcm|change|steam|sauna|plunge|laundry|first_aid|shower)/i.test(y.id || '') || /washroom|\bWC\b|change room|first aid|shower/i.test(y.n || '');    
    let pick = null;
    for (const y of cors) for (const q of y.r) for (const ax of [0, 1]) {    
      const lo = ax ? 0 : 2, hi = ax ? 1 : 3, a0 = ax ? 2 : 0, a1 = ax ? 3 : 1, ol0 = Math.max(q[lo], r[lo]), ol1 = Math.min(q[hi], r[hi]); if (ol1 - ol0 < SWA + 0.2) continue;
      const gap = q[a1] <= r[a0] + 0.05 ? r[a0] - q[a1] : q[a0] >= r[a1] - 0.05 ? q[a0] - r[a1] : -1; if (gap <= 0.05 || gap > 10) continue;
      const m = r2((ol0 + ol1) / 2 - SWA / 2), from = q[a1] <= r[a0] + 0.05 ? q[a1] : r[a1], to = q[a1] <= r[a0] + 0.05 ? r[a0] : q[a0];
      const pas = ax ? [m, r2(m + SWA), from, to] : [from, to, m, r2(m + SWA)];
      if (R.some(z => z !== x && bad(z) && z.r.some(w => Math.min(w[1], pas[1]) - Math.max(w[0], pas[0]) > 0.01 && Math.min(w[3], pas[3]) - Math.max(w[2], pas[2]) > 0.01))) continue;
      if (!pick || gap < pick.gap) pick = { gap, pas, side: ax ? (q[a1] <= r[a0] + 0.05 ? 2 : 3) : (q[a1] <= r[a0] + 0.05 ? 0 : 1) }; }
    if (!pick) return null;
    R.forEach(z => { if (z === x || cors.includes(z)) return; const ov = z.r.some(w => Math.min(w[1], pick.pas[1]) - Math.max(w[0], pick.pas[0]) > 0.01 && Math.min(w[3], pick.pas[3]) - Math.max(w[2], pick.pas[2]) > 0.01); if (ov) z.r = subAll(z.r, [pick.pas]).filter(w => ra(w) > 0.01); });
    for (let i = R.length - 1; i >= 0; i--) if (!R[i].r.length) R.splice(i, 1);
    R.push(room(st, `accp${st}_${Math.round(pick.pas[0] * 10)}_${Math.round(pick.pas[2] * 10)}`, 'Access passage to the fill row (1.5 m)', 'circ', 'pcor', [pick.pas], { block: x.block === 'spare' ? 'hub' : x.block, corridor: true }));
    best = { i: pick.side, sd: sides[pick.side], c: SWA, c0: 0, c1: 0 }; }
  const sd = best.sd, alongA = sd.o === 'h', full = best.c >= (sd.t - sd.f) - 0.1;
  if (full) return { alongA };
  const depth = sd.o === 'v' ? r[1] - r[0] : r[3] - r[2]; if (depth < SWA + 3.0) return { alongA };    
  const strip = best.i === 0 ? [r[0], r2(r[0] + SWA), r[2], r[3]] : best.i === 1 ? [r2(r[1] - SWA), r[1], r[2], r[3]] : best.i === 2 ? [r[0], r[1], r[2], r2(r[2] + SWA)] : [r[0], r[1], r2(r[3] - SWA), r[3]];
  const rest = best.i === 0 ? [r2(r[0] + SWA), r[1], r[2], r[3]] : best.i === 1 ? [r[0], r2(r[1] - SWA), r[2], r[3]] : best.i === 2 ? [r[0], r[1], r2(r[2] + SWA), r[3]] : [r[0], r[1], r[2], r2(r[3] - SWA)];
  return { alongA, strip, rest }; }
 
 
const PT_INTERNAL = [/\b(?:TO|NOTE_TO)_(?:all|code|codeui|main|hub|pool|cascade|interface)[\w-]*(?:\s+items?\s+[\w.,\s-]*?\d+[a-z]?)?/, /\b(?:MASTER_PLAN|CODE_JOB\w*|DECISIONS|FINDINGS|BOARD_PENDING|WORKLIST|START_HERE)\b/,
  /\bJ\.\s?B\.(?=[\s,;:)]|$)/, /\b(?:pool|hub|cascade|main|interface|code|shelter|grow|research) chat\b/i, /\bhub engine\b|\bhub test\b|\brule sheet v1\b|\bhub's (?:rule|reading|fix|patch)\b|\bpool's (?:rule|reading|patch)\b/i,
  /\bchecks\/|\bproject files\b|\bpatches\/|\btool\/[\w./-]+|\b[\w.-]*_[\w.-]*\/[\w./-]*|\b[\w.-]+\/[\w.-]+\/[\w./-]*/, /\b[\w-]+\.(?:js|py|json|md|xlsx|html)\b/, /\boverlay\s+(?:item|patch)\b/i];
const ptBad = t => PT_INTERNAL.some(re => re.test(t));
function publicText(s0) { if (s0 == null) return s0; let s = String(s0);
  s = s.replace(/\s*\[(?:script|engine[^\]]*|by hand|card|draft:[^\]]*|Certain|Likely|Guessing)\]/g, '');
  for (let k = 0; k < 4; k++) s = s.replace(/\(([^()]*)\)/g, (m, inner) => { if (!ptBad(inner)) return m;    
    const parts = inner.split(/;\s*/).map(pt => pt.split(/,\s*/).filter(q => !ptBad(q)).join(', ')).filter(q => q.trim() && !/^(?:item|items)\s/.test(q.trim()));
    return parts.length ? `(${parts.join('; ')})` : '\u0000'; });
  s = s.replace(/\s*\u0000/g, '');
  s = s.replace(/\bthe hub test fits\b/gi, 'checked in a test fit').replace(/\bhub test\b/gi, 'test fit').replace(/\bhub engine\b/gi, "tool's layout").replace(/\s*[·(,;]?\s*rule sheet v1\)?/gi, '');    
  s = s.replace(/\s*\(?\b[12]\d[a-z]{1,2}\s+(?:sort|item\s+\d+)\)?/g, '');    
  for (const re of PT_INTERNAL) s = s.replace(new RegExp(re.source + String.raw`(?:\s+\d{1,2}\s+[A-Z][a-z]{2}(?:\s+\d{4})?(?:\s+\d{1,2}:\d{2})?)?`, re.flags.replace('g', '') + 'g'), '');
  for (let k = 0; k < 2; k++) s = s.replace(/\s*\(\s*\d{1,2}\s+[A-Z][a-z]{2}(?:\s+\d{4})?(?:\s+\d{1,2}:\d{2})?\s*\)/g, '').replace(/\(\s*[;,]?\s*\)/g, '').replace(/\(\s*[;,]\s*/g, '(').replace(/\s*[;,]\s*\)/g, ')').replace(/\s+([;,.:])/g, '$1').replace(/([;,])\s*([;,])/g, '$1').replace(/:\s*$/, '').replace(/\s{2,}/g, ' ').replace(/^[\s;,·:]+|[\s;,·]+$/g, '').trim();
  return s; }
function publicRows(rows) { return (rows || []).map(r => Array.isArray(r) ? r.map((c, i) => i === 0 ? c : publicText(c)) : r && typeof r === 'object' ? Object.assign({}, r, { title: publicText(r.title), src: publicText(r.src), text: publicText(r.text) }) : r); }
function frozenRowStatus(r) { if (!r || r[0] !== 'tight' || /chiller/i.test(r[1] || '')) return r && r[0];    
  const t = String(r[3] || '');
  const lm = /least margin\s*[−-]\s?(\d+(?:\.\d+)?)\s?m/.exec(t); if (lm && +lm[1] > 0) return 'fail';
  const re = /\(≥\s?([\d.]+)/g; let m;
  while ((m = re.exec(t))) { const lim = +m[1], before = t.slice(0, m.index), cut = Math.max(...[';', '·', '[', '(', ')', '—', ':'].map(c => before.lastIndexOf(c))), seg = before.slice(cut + 1);
    const vals = [...seg.matchAll(/(?:^|[\s,])(-?\d+(?:\.\d+)?)\s?m\b/g)].map(x => +x[1]).filter(Number.isFinite); if (vals.length && Math.min(...vals) < lim - 1e-6) return 'fail'; }
  return 'tight'; }
function bathersFlip(def) { if (RULES.bathersFlip === false) return false; const F = def && def.family, wb = new Set(((F && F.wetBand) || {}).rooms || []), halls = F ? [F.big].concat(F.second ? [F.second.id || F.second] : []) : [];
  return (def && def.constraints || []).some(c => c.type === 'accessOnlyVia' && halls.includes(c.room) && (c.via || []).some(v => wb.has(v))); }
function plantReach(out, def) { const F = def && def.family, R = out && out.rooms && out.rooms[1]; if (!F || !R || !F.behindBig || !F.behindBig.plant) return;
  const pl = R.find(x => x.id === F.behindBig.plant), halls = R.filter(x => x.big || x.big2); if (!pl || !halls.length) return;
  const share = (x, y) => x.r.some(r => y.r.some(q => wallSeg(r, q).some(w => w.len >= RULES.door.w + 0.2 - 1e-9)));
  if (halls.some(h => share(pl, h))) return; const SW_ = 1.5;
  for (const sp of R.filter(x => x.kind === 'spare')) for (const q of sp.r) for (const p of pl.r) for (const h of halls) for (const hr of h.r) {
    let strip = null;
    for (const ax of [0, 1]) { const lo = ax ? 0 : 2, hi = ax ? 1 : 3, a0 = ax ? 2 : 0, a1 = ax ? 3 : 1;    
      const pq = Math.abs(p[a0] - q[a1]) < 0.05 ? 1 : Math.abs(p[a1] - q[a0]) < 0.05 ? -1 : 0, hq = Math.abs(hr[a1] - q[a0]) < 0.05 ? 1 : Math.abs(hr[a0] - q[a1]) < 0.05 ? -1 : 0;
      if (!pq || !hq || pq !== hq) continue;    
      const l = Math.max(p[lo], hr[lo], q[lo]), u = Math.min(p[hi], hr[hi], q[hi]); if (u - l < SW_ - 1e-9) continue;
      const s0 = Math.abs(u - q[hi]) < 0.05 || Math.abs(l - q[lo]) > 0.05 ? r2(u - SW_) : l;    
      strip = ax ? [s0, r2(s0 + SW_), q[2], q[3]] : [q[0], q[1], s0, r2(s0 + SW_)]; break; }
    if (!strip) continue;
    pl.r.push(strip); pl.reach = strip; sp.r = subAll(sp.r, [strip]).filter(r => ra(r) > 0.01); if (!sp.r.length) R.splice(R.indexOf(sp), 1);
    (out.flags || (out.flags = [])).push(`Plant reach ( item 1): the ${(pl.n || pl.id).split(' (')[0].toLowerCase()} shared no wall with the ${(h.n || h.id).split(' (')[0].toLowerCase()}; it takes a ${SW_} m strip (${Math.round(ra(strip))} m²) through the unassigned floor between them, so the locked door from the enclosure is drawn (P1)`);
    return; }
  (out.flags || (out.flags = [])).push(`Plant reach: the ${(pl.n || pl.id).split(' (')[0].toLowerCase()} shares no wall with a hall and no unassigned floor joins them: no locked door from the enclosure (P1)`); }
function splitBand(R, B, along, flip) {     if (!B || !B.segs || !B.segs.length) return; const i = R.findIndex(x => x.id === B.ph.id && x.big); if (i < 0) return;
  const P = R[i], r = P.r[0], out = []; let at = along === 'a' ? r[0] : r[2];
  for (const g of B.segs) { const e = r2(at + g.len), hr = [], o = { block: g.x.block, prog: g.x.id, wet: true };
    let c = at; g.row.forEach(w => { const rr = along === 'a' ? (flip ? [c, r2(c + w.l), r2(r[3] - g.dS), r[3]] : [c, r2(c + w.l), r[2], r2(r[2] + g.dS)]) : (flip ? [r[0], r2(r[0] + g.dS), c, r2(c + w.l)] : [r2(r[1] - g.dS), r[1], c, r2(c + w.l)]); out.push(room(1, w.id, w.x.name, 'pub', 'proom', [rr], { block: w.x.block, prog: w.id, wet: !!w.x.wet, withOf: g.x.id })); c = r2(c + w.l); });
    if (!g.dS) hr.push(along === 'a' ? [at, e, r[2], r[3]] : [r[0], r[1], at, e]);
    else if (!flip) { hr.push(along === 'a' ? [at, e, r2(r[2] + g.dS), r[3]] : [r[0], r2(r[1] - g.dS), at, e]); if (e - c > 0.01) hr.push(along === 'a' ? [c, e, r[2], r2(r[2] + g.dS)] : [r2(r[1] - g.dS), r[1], c, e]); }
    else { hr.push(along === 'a' ? [at, e, r[2], r2(r[3] - g.dS)] : [r2(r[0] + g.dS), r[1], at, e]); if (e - c > 0.01) hr.push(along === 'a' ? [c, e, r2(r[3] - g.dS), r[3]] : [r[0], r2(r[0] + g.dS), c, e]); }
    out.push(g.spare ? room(1, 'fspb', g.x.name, 'spare', 'spare', hr, { block: 'pool' }) : g.second ? room(1, g.x.id, g.x.name, 'pub', 'proom', hr, Object.assign(o, { big2: true })) : Object.assign(P, { r: hr.map(q => q.map(r2)) })); at = e; }
  R.splice(i, 1, ...out); }
 
function frameDirs(C) { const F = C.S && C.S.F; if (!F || !F.toW || !C.uOf) return null; const u0 = C.uOf(C.a0), u1 = C.uOf(C.a0 + 1), w0 = F.toW(u0, 0), wa = F.toW(u1, 0), wb = F.toW(u0, 1);
  const n = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }; return { a: n([wa[0] - w0[0], wa[1] - w0[1]]), b: n([C.sv * (wb[0] - w0[0]), C.sv * (wb[1] - w0[1])]) }; }
const compass = v => ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(((Math.atan2(v[0], v[1]) * 180 / Math.PI + 360) % 360) / 45) % 8];
 
 
const SUNY = -0.38;
function greenSide(C, def, has, RD) { const ids = (def.family.greenhouseBlock || []).filter(has); if (!ids.length) return null;
  const gh = ids.map(RD).find(x => x.face || x.roofAlt) || RD(ids[0]), ord = [gh.id].concat(ids.filter(i => i !== gh.id)), D = frameDirs(C);
  let end = 0, face = null; if (D) { const n0 = [-D.b[0], -D.b[1]], n1 = D.b, s0 = -n0[1], s1 = -n1[1]; end = Math.abs(s0 - s1) > 0.35 ? (s1 > s0 ? 1 : 0) : (-n1[0] > -n0[0] ? 1 : 0); face = compass(end ? n1 : n0); }
  return { ids: ord, gh, end, face, minW: gh.minW || 0, hallSouth: D ? D.a[1] < SUNY : null, known: !!D }; }
 
function chemApart(def) { return new Set((def.constraints || []).filter(c => c.type === 'notAboveOrBelow' && c.with === 'dataCentre').flatMap(c => [].concat(c.rooms || [])).filter(Boolean)); }    
function noHall(def, R1, R2) { const ho = (def.constraints || []).find(c => c.type === 'hallOnlyOver'), na = new Set((def.constraints || []).filter(c => c.type === 'nothingAbove').map(c => c.room).filter(Boolean)), out = [];
  const ca = chemApart(def); R1.filter(x => ca.has(x.prog || x.id)).forEach(x => out.push(...x.r));
  if (ho) { const dry = new Set(ho.rooms || ho.dryRooms || []); R1.filter(x => x.kind === 'proom' && x.block !== 'data centre' && !dry.has(x.prog || x.id)).forEach(x => out.push(...x.r)); }
  (R2 || []).filter(x => na.has(x.prog || x.id)).forEach(x => out.push(...x.r)); return out; }
function bandNotes(C, B, out, GS, up) { const n = [];
  if (B && B.segs && B.segs.length) { const s = B.segs.find(g => g.second), b = B.segs.find(g => !g.second && !g.spare);
    if (s && s.ext) n.push(`The ${s.x.name.split(':')[0].split(' (')[0].toLowerCase()} lengthened from ${s.ext.from} to ${s.ext.to} m along the band, so it meets the first room it is entered through by 1.2 m, room for a door ( item 2)`);
    if (s) n.push(`Two big rooms ( item 6): the ${s.x.name.split(':')[0].split(' (')[0].toLowerCase()} (${s.len} m along the band) at the ${out.kind === 'bigroom' && !out.grade || out.deep ? 'street' : 'lobby'} end, in line with the ${b && !b.spare ? b.x.name.split(',')[0].split(' (')[0].toLowerCase() : 'big room (dropped at this step)'}; band ${B.hW} m wide; a 1.8 m door between the halls (as the HC-13b and WB boards draw it)`);
    B.segs.filter(g => g.row.length).forEach(g => n.push(`Beside the ${g.x.name.split(':')[0].split(' (')[0].toLowerCase()} (15c item 3: rooms entered from it): ${g.row.map(o => o.x.name.split(' (')[0].toLowerCase()).join(', ')}, in a ${g.dS} m row along its ${out.grade && !out.deep ? 'rear' : 'side wall'}`)); }
  if (GS) n.push(GS.known ? `Greenhouse at grade at the program band's ${GS.face}-facing end (its face 'sunny': nearest south, else west; north read from the lot frame)${GS.hallSouth ? '; the hall storey stands south of it (its rule: never north of a hall storey) (?)' : ''}` : 'Greenhouse at grade at the program band\'s side-wall end; north not read here, so its sunny face is not checked (?)');
  if (up) n.push(`Greenhouse up on the wet-block roof (ladder step 2; at grade it has no place with open sky in the stacked layout): over the wet band, open on the halls' side${up.face ? ` (faces ${up.face})` : ''}${up.hallSouth ? '; the hall storey stands south of it (its rule: never north of a hall storey) (?)' : ''}; public stairs P1, P2 and lift E1 added to the strip`);
  if (C.rowAlt) n.push('Rooms entered only from a hall are in the band beside it, their only door into the hall (15f item 4, project decision, 15 Nov 15:00; the larger of this and the hall-row placement is kept)');
  if (out.s2moved) n.push(`Storey-2 data-centre rooms over the strip, off the far-side secure corridor (${out.s2moved.join(', ')}): behind the halls the lot is too short for them (as the HC-13b V339 board's electrical row over its north band)`);
  return n; }
function bigRoomStacked(C) {
  const def = stepDef(C), F = def.family, van = C.van, city = van ? 'van' : 'edm', cw = RULES.cor.w, SW = RULES.stair.w, SL = RULES.stair.l;
  const RD = id => def.rooms.find(x => x.id === id) || null, m2Of = x => (x && x.m2 && typeof x.m2 === 'object') ? x.m2[city] : (x ? x.m2 : null);
  const dropped = new Set(C.st.drop || []), has = id => !dropped.has(id) && !!RD(id);
  const BND = bandOf(def, has, RD, m2Of, F.lobby.depth, C.rowAlt); if (BND.fail) return BND; const inRow = new Set(BND.rowIds || []), hasP = id => has(id) && !inRow.has(id);
  const big = BND.ph, hW = BND.hW, hL = BND.hLb, wB = F.wetBand.depth, lobD = F.lobby.depth, chemD = F.behindBig.chemDepth;
   
  const green = (F.greenhouseBlock || []).filter(has), gUp = !!(C.st.greenUp && green.length);
  const opt1Rooms = RULES.stackOption1 && !gUp && !F.upper.rooms.filter(has).length ? def.rooms.filter(x => x.upperOk && dropped.has(x.id) && !(F.greenhouseBlock || []).includes(x.id) && !/greenhouse|headhouse/i.test(x.id)).slice(0, 2) : [];        
  if (green.length && !gUp) return { fail: `the greenhouse at grade: in the stacked layout every ground-floor place outside the two halls and the wet band has the storey-2 rooms or the hall over it, and the greenhouse needs open sky (nothing above it)` };
  const bayL = van ? 10.2 : 9.0, bayW = van ? 3.4 : 3.3, dE = RULES.e2.w;
  let sp = C.spanOver(0, Math.min(C.aMax, hL + 25)); if (!sp) return { fail: 'no buildable width' };
  const W = C.Wset ? Math.min(C.Wset, r2(sp[1] - sp[0])) : r2(sp[1] - sp[0]), bW0 = hW, bW1 = r2(hW + wB), bC1 = r2(bW1 + cw), sB = r2(W - bC1);
  const sMin = stripMin(def, F); if (sB < sMin - 1e-6) return { fail: `buildable width ${W} m: the ${big.name.toLowerCase()} (${hW} m), the ${wB} m wet band, the ${cw} m corridor and a ${sMin} m front strip need ${r2(bC1 + sMin)} m` };
  const aP = hL, wOfA = (x, d) => Math.max(x.minW || 0, m2Of(x) ? up1(m2Of(x) / d) : 0);
  const rid = (st, id, x, kind, g, rects, o) => room(st, id, x ? x.name : id, g, kind, rects, Object.assign({ block: x ? x.block : 'pool', prog: id }, o || {}));
   
  const wet = F.wetBand.rooms.filter(hasP).map(id => ({ id, x: RD(id) })), wetW = wet.map(o => wOfA(o.x, wB)), wetNeed = r2(sum(wetW));
  if (wetNeed > aP - lobD + 1e-6) return { fail: `the wet band beside the ${big.name.toLowerCase()} needs ${wetNeed} m along it; ${r2(aP - lobD)} m from the lobby to the big room's rear` };
   
  const stripIt = ((gUp || opt1Rooms.length) && !F.strip.rooms.some(t => /^P\d$/.test(t)) ? (r => [r[0], 'P1', r[1], 'E1'].concat(r.slice(2), ['P2']))(F.strip.rooms.filter(hasP)) : F.strip.rooms).filter(t => /^(P\d|E1)$/.test(t) || hasP(t)).map(t => t === 'P1' || t === 'P2' ? { id: t.toLowerCase(), core: 'stair', w: SW } : t === 'E1' ? { id: 'e1', core: 'lift', w: RULES.e1.w } : { id: t, x: RD(t), w: wOfA(RD(t), sB) });
   
  C.p1Moved = null; { const iP = stripIt.findIndex(o => o.id === 'p1'), dW2 = RULES.door.w / 2, dy = SL / 2 - dW2;
    if (iP >= 0 && dy < 6) { const need = r2(dW2 + Math.sqrt(36 - dy * dy) - SW / 2 + 0.05); let a = SW; for (let i = 0; i < iP; i++) a = r2(a + stripIt[i].w);
      if (a < need) { const P = stripIt.splice(iP, 1)[0]; let j = iP; a = SW; for (let i = 0; i < iP; i++) a = r2(a + stripIt[i].w);
        while (j < stripIt.length && a < need) { a = r2(a + stripIt[j].w); j++; }
        stripIt.splice(j, 0, P); C.p1Moved = { from: iP, to: j, at: a, need }; } } }
  const stripNeed = r2(SW + sum(stripIt.map(o => o.w)));
   
  const plantX = RD(F.behindBig.plant), chem = F.behindBig.chem.filter(has).map(id => ({ id, x: RD(id) })), chemLen = r2(sum(chem.map(o => Math.max(o.x.minW || 0, up1(m2Of(o.x) / chemD)))));
  const plantMin = plantX.minM2 || m2Of(plantX), mechX = F.behindWet.rooms.filter(has).map(id => RD(id)), mechNeed = sum(mechX.map(x => x.minM2 || m2Of(x)));
  const plantDepth = up1((plantMin + chemD * chemLen) / hW), mechDepth = up1(mechNeed / wB);
  const aEmin = r2(Math.max(aP + Math.max(plantDepth - dE, mechDepth, 3.0), stripNeed + 2.6));    
  const S1r = [0, SW, r2(W - SL), W], cores = SW * SL * 2 + RULES.e2.w * RULES.e2.l, bigA = hW * hL;
   
  const s3 = !!(C.S && C.S.s3 && RULES.thirdStair), S3r = [aP, r2(aP + SL), 0, chemD];
  const lay = aE => {
    const R1 = [], R2 = [], R3 = [], Da = r2(aE + dE + bayL);
     
    R1.push(rid(1, big.id, big, 'proom', 'pub', [[0, aP, 0, hW]], { big: true, wet: true }));
    R1.push(rid(1, 'lob', RD(F.lobby.id), 'lobby', 'circ', [[0, lobD, bW0, bC1], [0, SW, bC1, r2(W - SL)]]));
    let a = lobD; wet.forEach((o, i) => { const w = i === wet.length - 1 && r2(aP - a - wetW[i]) < LEFTOVER ? r2(aP - a) : wetW[i]; R1.push(rid(1, o.id, o.x, 'proom', 'pub', [[r2(a), r2(a + w), bW0, bW1]], { wet: !!o.x.wet })); a = r2(a + w); });
    if (aP - a > 0.01) R1.push(room(1, 'fspw', 'Unassigned program floor (no use yet; the band’s remaining length)', 'spare', 'spare', [[a, aP, bW0, bW1]], { block: 'pool' }));
    R1.push(room(1, 'cor', 'Public corridor', 'circ', 'pcor', [[lobD, r2(aE - 2.6), bW1, bC1]], { block: 'pool', corridor: true }));
    R1.push(room(1, 's1', 'Stair S1 (data centre)', 'sup', 'score', [S1r], { block: 'data centre', core: true, stair: true }));
    a = SW; const stripEnd = r2(aE - 2.6);
    const sIt = stripIt.slice(), sw = sIt.map(o => o.w), spareL = r2(stripEnd - SW - sum(sw)), lastRoom = sIt.map(o => !!(o.x && !o.core) || (gUp && o.core === 'stair')).lastIndexOf(true);    
    if (lastRoom >= 0 && spareL > 0 && spareL < LEFTOVER && !sIt[lastRoom].core) sw[lastRoom] = r2(sw[lastRoom] + spareL);
    else if (lastRoom >= 0 && spareL > 0) { sIt.splice(lastRoom + 1, 0, { id: 'fsps', spare: true }); sw.splice(lastRoom + 1, 0, spareL); }
    sIt.forEach((o, i) => { const r = [r2(a), r2(a + sw[i]), bC1, W];
      if (o.core === 'stair') {    
        R1.push(room(1, o.id, `Stair ${o.id.toUpperCase()} (program)`, 'circ', 'pcore', [[r[0], r[1], r[2], r2(W - cw)]], { block: 'pool', core: true, stair: true }));
        R1.push(room(1, o.id + 'v', `Stair ${o.id.toUpperCase()}'s exit vestibule to the side (2 h)`, 'circ', 'exitpas', [[r[0], r[1], r2(W - cw), r[3]]], { block: 'pool', vest: o.id })); }
      else if (o.core === 'lift') R1.push(room(1, 'e1', 'Lift E1 (public)', 'circ', 'pcore', [r], { block: 'pool', core: true, lift: true }));
      else if (o.spare) R1.push(room(1, 'fsps', 'Unassigned program floor (no use yet; the band’s remaining length)', 'spare', 'spare', [r], { block: 'pool' }));
      else R1.push(rid(1, o.id, o.x, 'proom', 'pub', [r])); a = r2(a + sw[i]); });
    R1.push(room(1, 'pasf', 'Exit passage from the public corridor to the side', 'circ', 'exitpas', [[stripEnd, aE, bW1, W]], { block: 'pool' }));
     
    if (s3) { if (aP + SL + chemLen > aE + dE + 1e-6) return { fail: 'S3: the chemical rooms and a third stair do not fit behind the big room' }; R1.push(room(1, 's3', 'Stair S3 (data centre)', 'sup', 'score', [S3r], { block: 'data centre', core: true, stair: true })); }
    a = s3 ? r2(aP + SL) : aP; chem.forEach(o => { const l = Math.max(o.x.minW || 0, up1(m2Of(o.x) / chemD)); R1.push(rid(1, o.id, o.x, 'proom', 'plant', [[r2(a), r2(a + l), 0, chemD]], { wet: true })); a = r2(a + l); });
     
    const pEnd = r2(aE + dE), lPl = Math.min(r2(pEnd - aP), Math.max(plantX.minW || 0, up1(m2Of(plantX) / r2(hW - chemD)))), aPl = r2(aP + lPl);
    R1.push(rid(1, plantX.id, plantX, 'proom', 'plant', [[aP, aPl, chemD, hW]], { wet: true }));
    const plSpare = [[aPl, pEnd, chemD, hW], [r2(Math.max(a, aPl)), pEnd, 0, chemD], [r2(a), r2(Math.max(a, aPl)), 0, chemD]].filter(r => r[1] - r[0] > LEFTOVER - 1e-9);
    if (plSpare.length) R1.push(room(1, 'fspp', 'Unassigned program floor (no use yet; left after the room took its reference size)', 'spare', 'spare', plSpare, { block: 'pool' }));
    if (mechX.length) { const lMe = Math.min(r2(aE - aP), Math.max(mechX[0].minW || 0, up1(m2Of(mechX[0]) / r2(bW1 - bW0)))), aMe = r2(aE - aP - lMe) < LEFTOVER ? aE : r2(aP + lMe);
      R1.push(rid(1, mechX[0].id, mechX[0], 'proom', 'plant', [[aP, aMe, bW0, bW1]], { wet: true })); if (aMe < aE - 1e-9) R1.push(room(1, 'fspm', 'Unassigned program floor (no use yet; left after the room took its reference size)', 'spare', 'spare', [[aMe, aE, bW0, bW1]], { block: 'pool' })); }
     
    const nb = van ? 3 : 1;
    R1.push(room(1, 'dock', 'Dock and lift lobby (entrance)', 'sup', 'dock', [[aE, pEnd, hW, r2(hW + cw)], [aE, pEnd, r2(hW + cw + RULES.e2.l), r2(W - RULES.ves.l)]].filter(r => r[3] - r[2] > 0.01), { block: 'data centre' }));
    const E2r = [aE, pEnd, r2(hW + cw), r2(hW + cw + RULES.e2.l)], VESr = [aE, pEnd, r2(W - RULES.ves.l), W];
    R1.push(room(1, 'e2', 'Freight lift E2 (passenger-rated)', 'sup', 'score', [E2r], { block: 'data centre', core: true, lift: true }));
    R1.push(room(1, 'ves', 'DC staff entrance: vestibule, guard point, portal', 'sup', 'entry', [VESr], { block: 'data centre' }));
    const bays = []; for (let i = 0; i < nb; i++) { const b0 = r2(hW + bayOff(i, nb, bayW)), b1 = r2(hW + bayOff(i + 1, nb, bayW)); if (b1 > W - SL + 1e-6) break; bays.push([pEnd, Da, b0, b1]); R1.push(room(1, 'b' + (i + 1), `Loading space ${i + 1}, ${van ? 'Class B 10.2 × 3.4 m with 1.3 m side clearance (a pair shares one)' : '9.0 × 3.3 m with 1.3 m side clearance (a pair shares one; Vancouver Design Supplement figure used as a stand-in, Edmonton not sourced)'}`, 'load', 'bay', [bays[i]], { block: 'data centre' })); }
    const S2r = [r2(Da - SW), Da, r2(W - SL), W]; R1.push(room(1, 's2', 'Stair S2 (data centre)', 'sup', 'score', [S2r], { block: 'data centre', core: true, stair: true }));
    const covered = subAll([[pEnd, Da, hW, W]], bays.concat([S2r])).filter(r => ra(r) >= 0.5).concat([[pEnd, Da, 0, hW]]);    
     
    if (gUp) { const Ds = frameDirs(C); if (Ds && (Ds.b[1] < SUNY || Ds.a[1] < SUNY)) return { fail: `the greenhouse up on the wet-block roof: the ${Ds.b[1] < SUNY ? 'hall storey stands' : 'data-centre storeys stand'} to its ${compass(Ds.b[1] < SUNY ? Ds.b : Ds.a)} (E13: never north of a hall storey, no taller storey to its south;  item 4)`, sun: true };
      const gl = green.map(RD).sort((p, q) => (p.face || p.roofAlt ? 1 : 0) - (q.face || q.roofAlt ? 1 : 0)), gw = gl.map(x => wOfA(x, wB));
      if (gl.some(x => (x.minW || 0) > wB + 1e-6)) return { fail: `the greenhouse up on the wet-block roof: the wet band is ${wB} m deep, the greenhouse needs ${Math.max(...gl.map(x => x.minW || 0))} m` };
      if (sum(gw) > aP + 1e-6) return { fail: `the greenhouse block up on the wet-block roof needs ${r2(sum(gw))} m along it; ${aP} m` };
      let ag = 0; gl.forEach((x, i) => { R2.push(rid(2, x.id, x, 'proom', 'gym', [[r2(ag), r2(ag + gw[i]), bW0, bW1]], { block: 'gym', wet: !!x.wet || undefined })); ag = r2(ag + gw[i]); }); }
     
    const opt1 = opt1Rooms.filter(x => !R1.some(y => y.id === x.id));
    if (opt1.length) (C.opt1Flags = []).push(`Stacking option 1 (pilot): ${opt1.map(x => x.id.replace(/_/g, ' ')).join(' and ')} on storey 2 over the wet band, reached by the public stairs and lift`);
    const up = gUp ? [] : (opt1.length ? opt1 : F.upper.rooms.filter(has).map(id => RD(id))), gst = up.length > 1 ? up[1] : null, gW = gst ? Math.max(gst.minW || 0, up1(m2Of(gst) / wB)) : 0;
    if (up.length) { R2.push(rid(2, up[0].id, up[0], 'proom', 'gym', [[0, r2(aP - gW), bW0, bW1]])); if (gst) R2.push(rid(2, gst.id, gst, 'proom', 'gym', [[r2(aP - gW), aP, bW0, bW1]])); }
     
    const upAny = up.length > 0 || gUp;    
    if (upAny) R2.push(room(2, 'gcor', 'Program corridor (public)', 'circ', 'pcor', [[0, aP, bW1, bC1]], { block: 'gym', corridor: true }));
     
    const pc = R1.filter(x => upAny && x.kind === 'pcore' && x.r[0][0] < aP).map(x => Object.assign({}, x, { st: 2, r: (x.lift || x.stair) && RULES.stackOption1 ? x.r.map(r => r.slice()) : x.r.map(r => [r[0], Math.min(r[1], aP), r[2], r2(W - cw)]) }));    
    pc.forEach(x => R2.push(x));
     
    const pcCut = upAny ? [] : R1.filter(x => x.kind === 'pcore' && x.r[0][0] < aP).flatMap(x => x.r.map(r => [r[0], Math.min(r[1], aP), r[2], r2(W - cw)]));
    const stripUp = subAll([[0, aP, upAny ? bC1 : bW1, r2(W - cw)]], pc.flatMap(x => x.r).concat(pcCut, [S1r])).filter(r => ra(r) >= 1).concat(pcCut.filter(r => ra(r) >= 1));
     
    stripUp.forEach((r, i) => R2.push(upAny ? room(2, 'usp' + (i + 1), 'Unassigned program floor (no use yet)', 'spare', 'spare', [r], { block: 'gym' }) : room(2, 'usp' + (i + 1), 'Unassigned (no use yet; data-centre floor over the strip)', 'spare', 'spare', [r], { block: 'spare', dcSide: true })));
    R2.push(room(2, 's1', 'Stair S1 (data centre)', 'sup', 'score', [S1r], { block: 'data centre', core: true, stair: true }));
    R2.push(room(2, 'dcor', 'Secure corridor (along the far side, S1 to S2)', 'sup', 'scor', [[SW, r2(Da - SW), r2(W - cw), W]], { block: 'data centre', corridor: true }));
    R2.push(room(2, 'ccor2', 'Secure corridor (data-centre rooms)', 'sup', 'scor', [[aP, Da, hW, r2(hW + cw)], [aP, r2(aP + cw), r2(hW + cw), r2(W - cw)]], { block: 'data centre', corridor: true }));
    R2.push(room(2, 'e2', 'Freight lift E2', 'sup', 'score', [E2r], { block: 'data centre', core: true, lift: true }), room(2, 's2', 'Stair S2 (data centre)', 'sup', 'score', [S2r], { block: 'data centre', core: true, stair: true }));
    const MWest = (W * Da - bigA - cores) / HPM(), dcSide = [{ id: 'ups', n: `UPS room (${Math.ceil(MWest) + 1} modules, N+1)`, w: PRG.ups.w, m2: r2(MWest * 3.3 + 1.0 * PRG.ups.w) }, { id: 'bat', n: 'Battery room, Li-ion', w: PRG.bat.w, m2: batRoomM2(MWest, hW) },
      { id: 'bhv', n: 'Battery room HVAC (separate)', w: PRG.bhv.w }, { id: 'mv', n: 'MV switchgear, main electrical', w: PRG.mv.w }, { id: 'valv', n: 'Sprinkler valve room, cylinders', w: PRG.valv.w },
      { id: 'mmr1', n: 'Meet-me room 1', w: PRG.mmr.w }, { id: 'mmr2', n: 'Meet-me room 2', w: PRG.mmr.w }, { id: 'garb', n: 'Garbage and recycling', w: PRG.garb.w }, { id: 'aspare', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }];
    const aP2 = s3 ? r2(aP + SL) : aP;
    if (s3) R2.push(room(2, 's3', 'Stair S3 (data centre)', 'sup', 'score', [S3r], { block: 'data centre', core: true, stair: true }), room(2, 'ccor4', 'Secure corridor (to S3)', 'sup', 'scor', [[aP, r2(aP + cw), chemD, hW]], { block: 'data centre', corridor: true }),
      room(2, 'esp3', 'Unassigned (no use yet)', 'spare', 'spare', [[r2(aP + cw), aP2, chemD, hW]], { block: 'spare', dcSide: true }));
    let pA = pack(dcSide, r2(Da - aP2), hW);
     
    if (pA.fail && C.s2over) { const over = []; while (pA.fail && dcSide.length > 2) { const i = dcSide.length - 2; over.unshift(dcSide.splice(i, 1)[0]); pA = pack(dcSide, r2(Da - aP2), hW); }
      if (!pA.fail) { const us = R2.filter(x => x.kind === 'spare' && /^usp/.test(x.id)).sort((p, q) => ra(q.r[0]) - ra(p.r[0])); let left = over.slice();
        for (const u of us) { if (!left.length) break; const r = u.r[0], len = r2(r[1] - r[0]), dep = r2(r[3] - r[2]); let take = left.slice(), pk = null;
          while (take.length) { pk = pack(take.concat([{ id: u.id, n: u.n, w: 0, grow: true, spare: true }]), len, dep); if (!pk.fail) break; take.pop(); }
          if (!take.length || pk.fail) continue; let a = r[0]; R2.splice(R2.indexOf(u), 1);
          take.concat([{ id: u.id, spare: true }]).forEach((o, i) => { if (pk.ws[i] < 0.01) return; const rr = [r2(a), r2(a + pk.ws[i]), r[2], r[3]]; R2.push(o.spare ? room(2, u.id, u.n, 'spare', 'spare', [rr], u.dcSide ? { block: 'spare', dcSide: true } : { block: 'gym' }) : room(2, o.id, o.n, 'sup', 'sroom', [rr], { block: 'data centre', prog: o.id, overStrip: true })); a = r2(a + pk.ws[i]); });
          left = left.slice(take.length); }
        if (left.length) pA = { fail: `the rooms ${left.map(o => o.id).join(', ')} fit neither behind the halls nor over the strip` }; else C.s2moved = over.map(o => o.n.split(' (')[0]); } }
    if (pA.fail) return { fail: `storey-2 data-centre rooms along the big room's rear need ${pA.fail} m; ${r2(Da - aP2)} m` };
    a = aP2; dcSide.forEach((o, i) => { if (pA.ws[i] < 0.01) { a = r2(a + pA.ws[i]); return; } const r = [r2(a), r2(a + pA.ws[i]), 0, hW]; R2.push(o.spare ? room(2, o.id, o.n, 'spare', 'spare', [r], { block: 'spare', dcSide: true }) : room(2, o.id, o.n, 'sup', 'sroom', [r], { block: 'data centre', prog: o.id })); a = r2(a + pA.ws[i]); });
     
    const bE0 = r2(hW + cw), bE1 = r2(bE0 + RULES.e2.l), bB1 = r2(W - cw), dB = r2(bB1 - bE1);
     
    const narrowI = [{ id: 'noc', n: 'Security control room / NOC', w: PRG.noc.w }, { id: 'jan', n: 'Janitor (DC)', w: PRG.jan.w }, { id: 'dwc', n: 'DC staff WC, shower', w: PRG.dwc.w }];
    const eS = [[r2(aP + cw), aE], [pEnd, Da]], pN = pack(narrowI.concat([{ id: 'esp1', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]), r2(eS[0][1] - eS[0][0]), RULES.e2.l), inBand = !pN.fail;
    if (inBand) { a = eS[0][0]; narrowI.concat([{ id: 'esp1', n: 'Unassigned (no use yet)', spare: true }]).forEach((o, i) => { if (pN.ws[i] < 0.01) return; const r = [r2(a), r2(a + pN.ws[i]), bE0, bE1]; R2.push(o.spare ? room(2, o.id, o.n, 'spare', 'spare', [r], { block: 'spare', dcSide: true }) : room(2, o.id, o.n, 'sup', 'sroom', [r], { block: 'data centre', prog: o.id })); a = r2(a + pN.ws[i]); }); }
    else if (eS[0][1] - eS[0][0] > 0.3) R2.push(room(2, 'esp1', 'Unassigned (no use yet)', 'spare', 'spare', [[eS[0][0], eS[0][1], bE0, bE1]], { block: 'spare', dcSide: true }));
    eS[1][1] = r2(Da - SW - (RULES.bigRearLink ? cw : 0)); if (eS[1][1] - eS[1][0] > 0.3) R2.push(room(2, 'esp2', 'Unassigned (no use yet)', 'spare', 'spare', [[eS[1][0], eS[1][1], bE0, bE1]], { block: 'spare', dcSide: true }));
    const backI = (inBand ? [] : narrowI).concat([{ id: 'doff', n: 'DC offices', w: PRG.doff.w, m2: PRG.doff.m2 }, { id: 'brk', n: 'DC break room', w: PRG.brk.w, m2: PRG.brk.m2 },
      { id: 'ship', n: 'Shipping, receiving, storage and staging (one room)', w: PRG.ship.w, m2: PRG.ship.m2 }].concat(def.takesHeat ? [{ id: 'hrr', n: PRG.hrr.n, w: PRG.hrr.w, m2: PRG.hrr.m2 }] : []).concat([{ id: 'bspare', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]));
    if (RULES.bigRearLink) R2.push(room(2, 'ccor3', 'Secure corridor (rear link to S2)', 'sup', 'scor', [[r2(Da - SW - cw), r2(Da - SW), bE0, bB1]], { block: 'data centre', corridor: true }));    
    const bA0 = r2(aP + cw), bA1 = r2(Da - SW - (RULES.bigRearLink ? cw : 0)), pB = pack(backI, r2(bA1 - bA0), dB);
    if (pB.fail) return { fail: `storey-2 data-centre rooms beside the secure corridor need ${pB.fail} m at ${dB} m deep; ${r2(bA1 - bA0)} m` };
    a = bA0; backI.forEach((o, i) => { if (pB.ws[i] < 0.01) { return; } const r = [r2(a), r2(a + pB.ws[i]), bE1, bB1]; R2.push(o.spare ? room(2, o.id, o.n, 'spare', 'spare', [r], { block: 'spare', dcSide: true }) : room(2, o.id, o.n, 'sup', 'sroom', [r], { block: 'data centre', prog: o.id })); a = r2(a + pB.ws[i]); });
     
    { const caR = R1.filter(x => chemApart(def).has(x.prog || x.id)).flatMap(x => x.r);
      if (caR.length) { let cut = false; R2.forEach(x => { if (!(x.block === 'data centre' || x.dcSide) || x.core) return; if (!x.r.some(q => caR.some(c => Math.min(q[1], c[1]) - Math.max(q[0], c[0]) > 0.01 && Math.min(q[3], c[3]) - Math.max(q[2], c[2]) > 0.01))) return; x.r = subAll(x.r, caR).filter(r => ra(r) > 0.01); cut = true; });
        for (let i = R2.length - 1; i >= 0; i--) if (!R2[i].r.length) R2.splice(i, 1);
        if (cut) R2.push(room(2, 'chemover', 'Unassigned (no use yet; over the chemical stores, not data-centre floor)', 'spare', 'spare', caR.map(r => r.slice()), { block: 'spare' })); } }
     
    const nh = noHall(def, R1, R2), hallR = subAll([[0, Da, 0, W]], [[0, aP, 0, hW], S1r, S2r, E2r].concat(s3 ? [S3r] : [], nh));    
    R3.push(room(3, 'hall', 'Data hall (one storey)', 'hall', 'hall', hallR, { block: 'data centre' }), room(3, 's1', 'Stair S1 (data centre)', 'sup', 'score', [S1r], { block: 'data centre', core: true, stair: true }), room(3, 's2', 'Stair S2 (data centre)', 'sup', 'score', [S2r], { block: 'data centre', core: true, stair: true }), ...(s3 ? [room(3, 's3', 'Stair S3 (data centre)', 'sup', 'score', [S3r], { block: 'data centre', core: true, stair: true })] : []), room(3, 'e2', 'Freight lift E2', 'sup', 'score', [E2r], { block: 'data centre', core: true, lift: true }));
    const hall = sum(hallR.map(ra)), MW = hall / HPM();
    const dcArea = sum(R1.filter(x => x.block === 'data centre' && x.kind !== 'bay').map(x => sum(x.r.map(ra)))) + sum(R2.filter(x => x.block === 'data centre' || x.dcSide).map(x => sum(x.r.map(ra)))) + sum(R3.map(x => sum(x.r.map(ra))));
    const progArea = sum(R1.filter(x => x.block !== 'data centre').map(x => sum(x.r.map(ra)))) + sum(R2.filter(x => x.block === 'gym').map(x => sum(x.r.map(ra))));
    return { rooms: { 1: R1, 2: R2, 3: R3 }, Da, aE, pEnd, hall, MW, dcArea, hubArea: progArea, covered, nb: bays.length };
  };
   
  const hallNeed = HPM() * C.mw; let aE = r2(Math.max(aEmin, up1((hallNeed + bigA + cores) / W) - dE - bayL));
  if (aE + dE + bayL > C.aMax + 1e-6) { aE = r2(Math.floor((C.aMax - dE - bayL) * 10) / 10); if (aE < aEmin - 1e-6) return { fail: `the lot is ${C.aMax} m deep inside the yards; the ${def.name.toLowerCase()} and the data centre's entrance and bays need ${r2(aEmin + dE + bayL)} m (the halls ${aP} m, behind them ${r2(Math.max(plantDepth - dE, mechDepth, 3.0))} m; the strip and its exit passage ${r2(stripNeed + 2.6)} m; the entrance row and bays ${r2(dE + bayL)} m)` }; }
  let L = lay(aE), fail0 = L.fail ? L : null;    
  while (L.fail && aE + 0.5 + dE + bayL <= C.aMax + 1e-6) { aE = r2(aE + 0.5); L = lay(aE); }
  if (L.fail && /storey-2 data-centre rooms along/.test(L.fail) && secondOf(def.family)) { const aE0 = aE; aE = r2(Math.max(aEmin, up1((hallNeed + bigA + cores) / W) - dE - bayL)); if (aE + dE + bayL > C.aMax + 1e-6) aE = r2(Math.floor((C.aMax - dE - bayL) * 10) / 10);
    C.s2over = true; L = lay(aE); while (L.fail && aE + 0.5 + dE + bayL <= C.aMax + 1e-6) { aE = r2(aE + 0.5); L = lay(aE); } if (L.fail) { C.s2over = false; aE = aE0; } }    
  if (L.fail) return fail0 || L;
  const aEfit = aE;
  let capped = false; while (L.dcArea > CAPM2() + 0.5 && aE - 0.5 >= aEmin - 1e-6) { aE = r2(aE - 0.5); const L2 = lay(aE); if (L2.fail) continue; L = L2; capped = true; }
   
  if (L.dcArea > CAPM2() + 0.5 && !C.Wset) {     for (let W2 = r2(W - 1); W2 >= bC1 + stripMin(def, F) - 1e-6; W2 = r2(W2 - 1)) { const C2 = Object.assign({}, C, { Wset: W2 }), X = bigRoomStacked(C2);
      if (!X.fail) { C.mapUV = C2.mapUV; X.capped = true; X.capW = { from: W, to: X.W }; X.sizeStop = { rule: 'floor cap', at: X.MW, why: `held at the ${RULES.cap.m2} m² floor cap (the building narrowed from ${W} to ${X.W} m; the rest of the land stays open)` }; return X; }
      if (!/floor cap/.test(X.fail)) return { fail: `the data centre is over the ${RULES.cap.m2} m² floor cap at ${W} m wide, and narrowed to ${W2} m: ${X.fail}` }; } }
  if (L.dcArea > CAPM2() + 0.5) return { fail: `the data centre stays ${Math.round(L.dcArea)} m² at the shallowest depth that lays out, over the ${RULES.cap.m2} m² floor cap` };
  sp = C.spanOver(0, L.Da);
   
  if (sp && r2(sp[1] - sp[0]) < W - 1e-6 && !C.narrowTry && r2(sp[1] - sp[0]) >= bC1 + stripMin(def, F) - 1e-6) { const C2 = Object.assign({}, C, { Wset: r2(Math.floor((sp[1] - sp[0]) * 100) / 100), narrowTry: true }), X = bigRoomStacked(C2);
    if (!X.fail) { C.mapUV = C2.mapUV; X.narrowed = { from: W, to: X.W }; (X.flags || (X.flags = [])).push(`The lot narrows to ${r2(sp[1] - sp[0])} m over the building's depth: drawn ${X.W} m wide, not ${W} m ( item 8)`); return X; } }
  if (!sp || r2(sp[1] - sp[0]) < W - 1e-6) return { fail: `the lot narrows to ${sp ? r2(sp[1] - sp[0]) : 0} m over the building's ${L.Da} m depth; the ${def.name.toLowerCase()} layout needs ${W} m` };
  const bOrigin = C.sv < 0 ? sp[1] : sp[0]; C.mapUV = (aa, b) => [C.uOf(C.a0 + aa), bOrigin + C.sv * b];
  const H = [C.ground, RULES.storeyH.up, RULES.storeyH.hall];
  const truck = { court: [L.Da, r2(L.Da + RULES.aisle.w), 0, W], covered: null, why: 'bays open to a truck court behind the building, open to the sky (EH-FREEZE-2026-11-11e building line); 6.1 m aisle (Parking By-law 5.4.1; drawing choice); route and turning not checked (?)' };
  const out = Object.assign(L, { H, truck, W, bOrigin, kind: 'bigroom', typology: def.id, aB: L.aE, aC: lobD, aR: lobD, dF: lobD, clin: 0, shared: C.st.shared, capped,
    storeyNames: [`${def.name} at grade; data-centre entrance rooms only`, `${def.name}: upper program; data-centre support`, 'One data-hall storey'] });
  splitBand(out.rooms[1], BND, 'a'); plantReach(out, def); skyCut(out, def);     const Dd = frameDirs(C);
  if (C.s2over && C.s2moved) out.s2moved = C.s2moved;
  out.bandNotes = bandNotes(C, BND, out, null, gUp ? { face: Dd ? compass([-Dd.b[0], -Dd.b[1]]) : null, hallSouth: Dd ? Dd.b[1] < -0.5 : null } : null);
  out.spareFilled = spareFill(out, def.id, capOkFor(def, C, out));
  out.Dbig = bigRoomDoors(out, (def.constraints || [])); spareDoorCheck(out);
  if (C.opt1Flags) (out.flags || (out.flags = [])).push(...C.opt1Flags);
  if (C.p1Moved) (out.flags || (out.flags = [])).push(`Stair P1 moved along the front strip, past ${C.p1Moved.to - C.p1Moved.from} room(s), so its side-wall discharge is 6 m from S1's at the front (VBBL 3.4.2.3.(4);  item 1)`);
  { const vm = viaMissing(out, def.constraints); if (vm.length) return { fail: `${vm.map(id => (RD(id) || { name: id }).name.split(' (')[0].toLowerCase()).join(', ')} shares no wall with the room it is entered through ( item 4)` }; }
  out.plant = plantLayout(C, W, L.Da, L.MW, L.rooms);
  if (capped) out.sizeStop = { rule: 'floor cap', at: out.MW, why: `held at the ${RULES.cap.m2} m² floor cap (the entrance row moved forward to ${L.aE} m)` };
   
  else if (L.dcArea < CAPM2() - 0.5 && L.Da >= C.aMax - 0.05) { const zoneLim = C.S.maxDepth && C.aMax >= C.S.maxDepth - 0.05;
    out.sizeStop = { rule: 'building depth', at: out.MW, why: zoneLim ? `the building is ${L.Da} m deep, the zone's maximum building depth (${C.S.maxDepth} m from the front yard line, the tool's zone rules${/^I-3/.test(C.S.zone || '') ? ': I-3 3.1.2.7' : ''}); the data centre is ${Math.round(L.dcArea)} m², under the ${RULES.cap.m2} m² cap` : `the building is ${L.Da} m deep, all the lot allows inside its yards; the data centre is ${Math.round(L.dcArea)} m², under the ${RULES.cap.m2} m² cap` }; }
  return out;
}
 
 
function viaMissing(L, constraints) { const D = L.Dbig || [], R1 = (L.rooms || {})[1] || []; return (constraints || []).filter(c => c.type === 'accessOnlyVia' && (c.via || []).length).filter(c => R1.some(x => x.id === c.room)).filter(c => {
  const via0 = c.via.map(v => v === 'public_corridor' ? 'cor' : v).filter(v => v !== 'exterior'), pl = /plant/i, via = RULES.viaBathers !== false && via0.some(v => !pl.test(v)) ? via0.filter(v => !pl.test(v)) : via0;     return via.length && !D.some(d => (d[1] === c.room && via.includes(d[2])) || (d[2] === c.room && via.includes(d[1]))); }).map(c => c.room); }
function bigRoomDoors(L, constraints) {
  const R = L.rooms, D = [], dW = RULES.door.w, sW = RULES.street.w;
  const by = (st, id) => (R[st] || []).find(x => x.id === id);
  const shared = (A, B) => { let best = null;
    for (const r of A.r) for (const q of B.r) {
      if (Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(r[0] - q[1]) < 1e-6) { const at = Math.abs(r[1] - q[0]) < 1e-6 ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'v', at, f, t, len: t - f }; }
      if (Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(r[2] - q[3]) < 1e-6) { const at = Math.abs(r[3] - q[2]) < 1e-6 ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'h', at, f, t, len: t - f }; } }
    return best; };
  const door = (st, a, b, t, w) => { const A = by(st, a), B = by(st, b); if (!A || !B) return false; const s = shared(A, B); if (!s || s.len < (w || dW) + 0.1) return false;
    const half = (w || dW) / 2, c = r2(Math.min(s.t - half - 0.05, Math.max(s.f + half + 0.05, s.f + (s.t - s.f) * (t == null ? 0.5 : t))));
    D.push(s.o === 'v' ? [st, a, b, r2(s.at), c, 'v', w || dW] : [st, a, b, c, r2(s.at), 'h', w || dW]); return true; };
  const ext = (st, a, side, t, w, k) => { const A = by(st, a); if (!A) return; { const o = A.extOverride && A.extOverride[side + '/' + (k || 0)]; if (o) { if (o.flag) ((L.flags) || (L.flags = [])).push(o.flag); if (o.none) return; if (o.via) return door(st, a, o.via, 0.5, w); side = o.side || side; t = o.t != null ? o.t : t; k = o.k != null ? o.k : k; } }     const r = A.r[k || 0], half = (w || dW) / 2;
    if (side === 'a0' || side === 'a1') { const at = side === 'a0' ? r[0] : r[1], c = r2(Math.min(r[3] - half - 0.05, Math.max(r[2] + half + 0.05, r[2] + (r[3] - r[2]) * t))); D.push([st, a, 'OUT', at, c, 'v', w || dW]); }
    else { const at = side === 'b0' ? r[2] : r[3], c = r2(Math.min(r[1] - half - 0.05, Math.max(r[0] + half + 0.05, r[0] + (r[1] - r[0]) * t))); D.push([st, a, 'OUT', c, at, 'h', w || dW]); } };
  const S1 = R[1], viaOf = {}; constraints.filter(c => c.type === 'accessOnlyVia').forEach(c => { viaOf[c.room] = (c.via || []).map(v => v === 'public_corridor' ? 'cor' : v); });    
   
  ext(1, 'lob', 'a0', 0.5, sW); door(1, 'lob', 'cor', 0.5, sW);
   
  const big = S1.find(x => x.big), big2 = S1.find(x => x.big2);
  if (big) { const kb = big.r.findIndex(r => r[2] < 1e-6); if (big.r.some(r => r[0] < 1e-6)) ext(1, big.id, 'a0', 0.5, sW); else if (kb >= 0) ext(1, big.id, 'b0', 0.15, null, kb); if (kb >= 0) ext(1, big.id, 'b0', 0.9, null, kb);     (viaOf[big.id] || []).forEach(v => { if (v !== 'exterior') door(1, big.id, v, 0.5); }); }
   
  if (big2) { const k = big2.r.findIndex(r => r[0] < 1e-6); if (k >= 0) ext(1, big2.id, 'a0', 0.5, null, k); if (big) door(1, big2.id, big.id, 0.5, 1.8); (viaOf[big2.id] || []).forEach(v => { if (v !== 'exterior') door(1, big2.id, v, 0.5); }); }
  S1.filter(x => x.withOf).forEach(x => door(1, x.id, x.withOf, 0.5));
  S1.filter(x => x.block !== 'data centre' && !x.big && !x.big2 && !x.withOf && x.kind === 'proom').forEach(x => { const via = viaOf[x.id];
    if (via) { via.forEach(v => { if (v === 'exterior') { const k = x.r.findIndex(r => r[2] < 1e-6); if (k >= 0) ext(1, x.id, 'b0', 0.5, null, k); } else door(1, x.id, v, 0.5); }); return; }
    if (x.closed && Math.max(...x.r.map(r => Math.max(r[1] - r[0], r[3] - r[2]))) >= 12 && door(1, x.id, 'cor', 0.15)) { door(1, x.id, 'cor', 0.85); return; }    
    if (x.wet) { if (!door(1, x.id, 'cor', 0.5)) door(1, x.id, 'lob', 0.5); } else if (!door(1, x.id, 'lob', 0.5)) door(1, x.id, 'cor', 0.5);    
    if (x.g === 'plant') { const k = x.r.findIndex(r => r[2] < 1e-6); if (k >= 0) ext(1, x.id, 'b0', 0.5, null, k); } });
   
  S1.filter(x => x.kind === 'pcore').forEach(x => { if (x.stair && S1.some(y => y.vest === x.id)) { door(1, x.id, x.id + 'v', 0.5); ext(1, x.id + 'v', 'b1', 0.5); } else if (x.stair) ext(1, x.id, 'b1', 0.5); else door(1, x.id, 'cor', 0.5); });
  door(1, 'pasf', 'cor', 0.5); ext(1, 'pasf', 'b1', 0.5);
  ext(1, 's1', 'a0', 0.5); ext(1, 'ves', 'b1', 0.5); door(1, 'ves', 'dock', 0.5); door(1, 'e2', 'dock', 0.5); S1.filter(x => x.kind === 'bay').forEach(x => { door(1, 'dock', x.id, 0.5); ext(1, x.id, 'a1', 0.5, 2.8); }); ext(1, 's2', 'a1', 0.5);    
   
  const S2 = R[2] || [];
   
  S2.filter(x => x.block === 'gym' && x.kind !== 'pcor' && x.kind !== 'pcore').forEach(x => { const via = viaOf[x.id]; if (via) { via.forEach(v => door(2, x.id, v, 0.5)); return; }
    if (sum(x.r.map(ra)) >= 150) { door(2, x.id, 'gcor', 0.1); door(2, x.id, 'gcor', 0.9); } else door(2, x.id, 'gcor', 0.5); });
  S2.filter(x => x.kind === 'pcore').forEach(x => door(2, x.id, 'gcor', 0.5));
  door(2, 's1', 'dcor', 0.5); door(2, 's2', 'dcor', 0.5); door(2, 's2', 'ccor3', 0.1); door(2, 'dcor', 'ccor2', 0.5);     door(2, 'e2', 'ccor2', 0.5); door(2, 'ccor3', 'dcor', 0.5); door(2, 'ccor3', 'ccor2', 0.5);
  S2.filter(x => (x.block === 'data centre' && x.kind === 'sroom') || (x.kind === 'spare' && x.dcSide)).forEach(x => { if (!door(2, x.id, 'ccor2', 0.85)) door(2, x.id, 'dcor', 0.85); });    
   
  if (by(1, 's3')) { ext(1, 's3', 'b0', 0.5); door(2, 's3', 'ccor4', 0.5); door(2, 'ccor4', 'ccor2', 0.5); door(3, 'hall', 's3', 0.5); }    
  door(3, 'hall', 's1', 0.5); door(3, 'hall', 's2', 0.5); (by(3, 'e2l') ? (door(3, 'hall', 'e2l', 0.5), door(3, 'e2l', 'e2', 0.5)) : door(3, 'hall', 'e2', 0.5));
  return D;
}
 
function bigRoomBeside(C, Wset, tries) {
  const def = stepDef(C), F = def.family, van = C.van, city = van ? 'van' : 'edm', cw = RULES.cor.w, pw = RULES.pexit.w;
  const RD = id => def.rooms.find(x => x.id === id) || null, m2Of = x => (x && x.m2 && typeof x.m2 === 'object') ? x.m2[city] : (x ? x.m2 : null);
  const dropped = new Set(C.st.drop || []), has = id => !dropped.has(id) && !!RD(id);
  const BND = bandOf(def, has, RD, m2Of, 0, C.rowAlt); if (BND.fail) return BND; const inRow = new Set(BND.rowIds || []), hasP = id => has(id) && !inRow.has(id);
  const big = BND.ph, hW = BND.hW, hL = BND.hLb, wB = F.wetBand.depth;
  let sp = C.spanOver(0, Math.min(C.aMax, 40)); if (!sp) return { fail: 'no buildable width' };
  const W = Wset || r2(sp[1] - sp[0]);
  const plantX = RD(F.behindBig.plant), wPl = Math.max(plantX.minW || 0, up1((plantX.minM2 || m2Of(plantX)) / hW)), lobX = RD(F.lobby.id), wLob = Math.max(RULES.lobby.w, up1(m2Of(lobX) / hW));
  const need = r2(wPl + wLob + hL + pw); if (need > W + 1e-6) return { fail: `buildable width ${W} m: the plant (${wPl} m), the lobby (${wLob} m), the ${big.name.toLowerCase()} turned along the street (${hL} m) and an exit passage need ${need} m` };
  const rid = (id, x, kind, g, rects, o) => room(1, id, x ? x.name : id, g, kind, rects, Object.assign({ block: x ? x.block : 'pool', prog: id }, o || {}));
  const R = [], bH0 = r2(wPl + wLob), bH1 = r2(bH0 + hL), aW1 = r2(hW + wB), aC1 = r2(aW1 + cw);
   
  R.push(rid('lob', lobX, 'lobby', 'circ', [[0, hW, 0, wLob]]));
  R.push(rid(plantX.id, plantX, 'proom', 'plant', [[0, hW, wLob, bH0]], { wet: true }));
  R.push(rid(big.id, big, 'proom', 'pub', [[0, hW, bH0, bH1]], { big: true, wet: true }));
  R.push(room(1, 'pasf', 'Exit passage from the public corridor to the street', 'circ', 'exitpas', [[0, aC1, bH1, r2(bH1 + pw)]], { block: 'pool' }));
   
  const chem = F.behindBig.chem.filter(has).map(id => ({ id, x: RD(id) })), chemW = chem.map(o => Math.max(o.x.minW || 0, up1(m2Of(o.x) / wB))), chemL = r2(sum(chemW));
  if (chemL > r2(bH0 - cw) + 1e-6) return { fail: `the chemical rooms need ${chemL} m behind the plant and the lobby; ${r2(bH0 - cw)} m beside the lobby's passage` };
  R.find(x => x.id === 'lob').r.push([hW, aW1, 0, cw]);
  const cS = chemL <= wPl + 1e-6 ? wLob : r2(bH0 - chemL); let b = cS; chem.forEach((o, i) => { R.push(rid(o.id, o.x, 'proom', 'plant', [[hW, aW1, r2(b), r2(b + chemW[i])]], { wet: true })); b = r2(b + chemW[i]); });
  const desk = has('desk') ? RD('desk') : null; let dE = cw;
  if (desk && cS - cw >= 1 - 1e-9) { const wD = Math.min(r2(cS - cw), Math.max(desk.minW || 0, up1(m2Of(desk) / wB))), bD = r2(cS - cw - wD) < LEFTOVER ? cS : r2(cw + wD); R.push(rid('desk', desk, 'proom', 'pub', [[hW, aW1, cw, bD]])); dE = bD; }
  if (cS - dE > 0.01) R.push(room(1, 'fsp1', desk ? 'Unassigned program floor (no use yet; left after the room took its reference size)' : 'Unassigned program floor', 'spare', 'spare', [[hW, aW1, dE, cS]], { block: 'pool' }));
  if (bH0 - b > 0.01) R.push(room(1, 'fsp3', 'Unassigned program floor (no use yet; behind the plant)', 'spare', 'spare', [[hW, aW1, b, bH0]], { block: 'pool' }));
   
  const wet = F.wetBand.rooms.filter(hasP).map(id => ({ id, x: RD(id) })), wetW = wet.map(o => Math.max(o.x.minW || 0, up1(m2Of(o.x) / wB)));
  if (sum(wetW) > hL + 1e-6) return { fail: `the wet band behind the ${big.name.toLowerCase()} needs ${r2(sum(wetW))} m along it; ${hL} m` };
  b = bH0; wet.forEach((o, i) => { const w = i === wet.length - 1 && r2(bH1 - b - wetW[i]) < LEFTOVER ? r2(bH1 - b) : wetW[i]; R.push(rid(o.id, o.x, 'proom', 'pub', [[hW, aW1, r2(b), r2(b + w)]], { wet: true })); b = r2(b + w); });
  if (bH1 - b > 0.01) R.push(room(1, 'fspw', 'Unassigned program floor (no use yet; the band’s remaining length)', 'spare', 'spare', [[hW, aW1, b, bH1]], { block: 'pool' }));
   
  R.push(room(1, 'cor', 'Public corridor', 'circ', 'pcor', [[aW1, aC1, 0, bH1]], { block: 'pool', corridor: true }));
   
  const GS = greenSide(C, def, hasP, RD), gIds = GS ? GS.ids : [];
  if (GS && GS.hallSouth) return { fail: `the greenhouse at grade: its band end faces ${GS.face}, with the hall storey to its south (E13: never north of a hall storey;  item 4)`, sun: true };
  const stripIds0 = F.strip.rooms.filter(t => !/^(P\d|E1)$/.test(t) && t !== 'desk' && hasP(t) && !gIds.includes(t)).concat(F.behindWet.rooms.filter(hasP)).concat(F.upper.rooms.filter(hasP)).filter(t => !gIds.includes(t));
  const stripIds = GS ? (GS.end === 0 ? gIds.concat(stripIds0) : stripIds0.concat(gIds.slice().reverse())) : stripIds0;    
  const stripX = stripIds.map(id => RD(id)), Wst0 = r2(bH1 + pw), Wst = GS && GS.end === 1 && W - Wst0 > 0.5 ? W : Wst0;
  let dSt = GS ? Math.max(6.0, GS.minW) : 6.0, ws = null; for (; dSt <= 25 + 1e-9; dSt = r2(dSt + 0.5)) { ws = stripX.map(x => Math.max(x.minW || 0, up1((m2Of(x) || 0) / dSt))); if (sum(ws) <= Wst + 1e-6) break; }
  if (sum(ws) > Wst + 1e-6) return { fail: `the program's strip needs ${r2(sum(ws))} m across at ${dSt} m deep; ${Wst} m` };
  const aB = r2(aC1 + dSt), left = r2(Wst - sum(ws)); b = 0;
  stripX.forEach((x, i) => { const w = i === stripX.length - 1 && left < LEFTOVER ? r2(ws[i] + left) : ws[i]; R.push(rid(x.id, x, 'proom', x.block === 'gym' ? 'gym' : (x.wet ? 'plant' : 'pub'), [[aC1, aB, r2(b), r2(b + w)]], { wet: !!x.wet })); b = r2(b + w); });
  if (left >= LEFTOVER) R.push(room(1, 'fsps', 'Unassigned program floor (no use yet; the band’s remaining length)', 'spare', 'spare', [[aC1, aB, b, Wst]], { block: 'pool' }));
  if (W - Wst > 0.5) R.push(room(1, 'fsp2', 'Unassigned program floor (no use yet)', 'spare', 'spare', [[0, aB, Wst, W]], { block: 'pool' }));
  else if (Wst > Wst0 + 0.5) R.push(room(1, 'fsp2', 'Unassigned program floor (no use yet)', 'spare', 'spare', [[0, aC1, Wst0, W]], { block: 'pool' }));
  if (GS) C.noRoof = R.filter(x => x.id === GS.gh.id).flatMap(x => x.r);    
  const progArea = sum(R.map(x => sum(x.r.map(ra))));
   
  const D = besideDC(C, W, R, aB, progArea);
  if (D.narrowTo && (tries || 0) < 4) return bigRoomBeside(C, D.narrowTo, (tries || 0) + 1);    
  if (D.fail) return D;
  const out = Object.assign(D, { kind: 'bigroom', grade: true, typology: def.id, aC: aW1, aR: aC1, dF: hW, clin: 0, hubArea: progArea,
    storeyNames: [`${def.name} and the data centre at grade (one storey)`] });
  splitBand(out.rooms[1], BND, 'b', !!C.rowAlt || bathersFlip(def)); plantReach(out, def); out.bandNotes = bandNotes(C, BND, out, GS, null);
  out.spareFilled = spareFill(out, def.id, capOkFor(def, C, out));
  out.Dbig = bigRoomDoorsC(out, def.constraints || []); spareDoorCheck(out);
  { const vm = viaMissing(out, def.constraints); if (vm.length) return { fail: `${vm.join(', ').replace(/_/g, ' ')} shares no wall with the room it is entered through ( item 4)` }; }
  return out;
}
 
function besideDC(C, W, R, aB, progArea) {
  const { st, van } = C, cw = RULES.cor.w, pw = RULES.pexit.w, def = C.S.typDef;
  const bayL = van ? 10.2 : 9.0, bayW = van ? 3.4 : 3.3, dS = C.dS || Math.max(bayL, 9.0);
  let dH = up1(HPM() * C.mw / W); const cap = CAPM2(); if (dH * W + W * (cw + dS) > cap) dH = Math.floor((cap - W * (cw + dS)) / W * 10) / 10;
  let Da = r2(aB + dH + cw + dS);
  if (Da > C.aMax) { Da = Math.floor(C.aMax * 10) / 10; dH = r2(Da - aB - cw - dS); if (dH < 6) return { fail: `the lot is ${C.aMax} m deep; the program and the data centre need ${r2(aB + 6 + cw + dS)} m` }; }
  const sp = C.spanOver(0, Da); if (!sp) return { fail: 'no width over the building depth' };
  if (r2(sp[1] - sp[0]) < W - 1e-6) return { fail: `the lot narrows to ${r2(sp[1] - sp[0])} m over the building's ${Da} m depth; the layout needs ${W} m`, narrowTo: r2(Math.floor((sp[1] - sp[0]) * 100) / 100) };
  const bOrigin = C.sv < 0 ? sp[1] : sp[0]; C.mapUV = (a, b) => [C.uOf(C.a0 + a), bOrigin + C.sv * b];
  const aH = r2(aB + dH), aS = r2(aH + cw);
  const sec = (id, n, kind, rects, o) => room(1, id, n, kind === 'hall' ? 'hall' : kind === 'bay' ? 'load' : 'sup', kind, rects, Object.assign({ block: 'data centre' }, o || {}));
  R.push(sec('hall', 'Data hall (one storey)', 'hall', [[aB, aH, 0, W]]), sec('scor', 'Secure corridor', 'scor', [[aH, aS, 0, W]], { corridor: true }));
  const MWest = (dH * W) / HPM(), tot = progArea + dH * W + W * (cw + dS), nb = st.shared ? 1 : (van ? (tot < 2500 ? 0 : tot <= 7500 ? 1 : 2) : edmBays(tot, W, Da));
  const sI = [{ id: 'pas3', n: 'Exit passage (2 h) from the secure corridor to the rear', fix: pw }, { id: 'ups', n: `UPS room (${Math.ceil(MWest) + 1} modules, N+1)`, w: PRG.ups.w, m2: r2(MWest * 3.3 + 3.0) }, { id: 'bat', n: 'Battery room, Li-ion', w: PRG.bat.w, m2: batRoomM2(MWest, dS) },
    { id: 'bhv', n: 'Battery room HVAC (separate)', w: PRG.bhv.w }, { id: 'mv', n: 'MV switchgear, main electrical', w: PRG.mv.w }, { id: 'mmr1', n: 'Meet-me room 1', w: PRG.mmr.w }, { id: 'mmr2', n: 'Meet-me room 2', w: PRG.mmr.w },
    { id: 'valv', n: 'Sprinkler valve room, cylinders', w: PRG.valv.w }, { id: 'pas4', n: 'Exit passage (2 h) from the middle of the secure corridor to the rear', fix: pw }, { id: 'noc', n: 'Security control room / NOC', w: PRG.noc.w }, { id: 'doff', n: 'DC offices', w: PRG.doff.w, m2: PRG.doff.m2 },
    { id: 'brk', n: 'DC break room', w: PRG.brk.w, m2: PRG.brk.m2 }, { id: 'dwc', n: 'DC staff WC, shower', w: PRG.dwc.w }, { id: 'jan', n: 'Janitor (DC)', w: PRG.jan.w }, { id: 'garb', n: 'Garbage and recycling', w: PRG.garb.w }, { id: 'ship', n: 'Shipping, receiving, storage and staging (one room)', w: PRG.ship.w, m2: PRG.ship.m2 }]
    .concat(def && def.takesHeat ? [{ id: 'hrr', n: PRG.hrr.n, w: PRG.hrr.w, m2: PRG.hrr.m2 }] : [])
    .concat(Array.from({ length: nb }, (_, i) => ({ id: 'b' + (i + 1), fix: bayFix(i, nb, bayW), bay: true }))).concat([{ id: 'dock', n: 'Dock lobby (entrance)', w: 2.4 }, { id: 'ves', n: 'DC staff entrance: vestibule, guard point, portal', fix: RULES.ves.w }]);
  let ps = pack(sI, W, dS), dS2 = dS; while (ps.fail && dS2 < 20) { dS2 = r2(dS2 + 0.5); ps = pack(sI, W, dS2); }
  if (ps.fail && C.acrossOnly) return { fail: `data-centre support row needs ${ps.fail} m; ${W} m` };    
  if (ps.fail) { for (let i = R.length - 1; i >= 0; i--) if (R[i].block === 'data centre') R.splice(i, 1); return besideDCside(C, W, R, aB, progArea, sI, ps.fail); }
  if (dS2 > dS) { for (let i = R.length - 1; i >= 0; i--) if (R[i].block === 'data centre') R.splice(i, 1); return besideDC(Object.assign({}, C, { dS: dS2 }), W, R, aB, progArea); }
  place(sI, ps.ws, 0, aS, Da).forEach(x => { if (x.bay) R.push(sec(x.id, `Loading space ${x.id.slice(1)}, ${van ? 'Class B 10.2 × 3.4 m with 1.3 m side clearance (a pair shares one)' : '9.0 × 3.3 m with 1.3 m side clearance (a pair shares one; Vancouver Design Supplement figure used as a stand-in, Edmonton not sourced)'}`, 'bay', [[r2(Da - bayL), Da, x.rr[2], x.rr[3]]]));
    else if (x.id === 'pas3' || x.id === 'pas4') R.push(sec(x.id, x.n, 'exitpas', [x.rr]));
    else if (x.id === 'dock') R.push(sec('dock', x.n, 'dock', [x.rr])); else if (x.id === 'ves') R.push(sec('ves', x.n, 'entry', [x.rr])); else R.push(sec(x.id, x.n, 'sroom', [x.rr], { prog: x.id, wet: x.id === 'hrr' || undefined })); });
  R.filter(x => x.kind === 'bay').forEach(x => { const r = x.r[0]; if (r[0] > aS + 0.01) R.find(y => y.id === 'dock').r.push([aS, r[0], r[2], r[3]]); });
  const hall = dH * W, MW = hall / HPM(), dcArea = sum(R.filter(x => x.block === 'data centre' && x.kind !== 'bay').map(x => sum(x.r.map(ra))));
  if (dcArea > cap + 0.5) { const C2 = Object.assign({}, C, { mw: Math.max(0.1, (MW - 0.05)) }); for (let i = R.length - 1; i >= 0; i--) if (R[i].block === 'data centre') R.splice(i, 1); return besideDC(C2, W, R, aB, progArea); }
  const rooms = { 1: R }, truck = { court: [Da, r2(Da + RULES.aisle.w), 0, W], covered: null, why: 'bays open to a 6.1 m truck aisle behind the building (Parking By-law 5.4.1 aisle, Vancouver’s figure used in Edmonton ?)' };
  const plant = plantLayout(Object.assign({}, C, { lowRoof: C.noRoof && C.noRoof.length ? { rs: subAll([[0, aB, 0, W]], C.noRoof).filter(r => ra(r) >= 20), z: RULES.storeyH.hall } : { r: [0, aB, 0, W], z: RULES.storeyH.hall } }), W, Da, MW, rooms);
  return { rooms, H: [RULES.storeyH.hall], hall, MW, dcArea, nb, shared: st.shared, truck, plant, aB, W, Da, bOrigin, covered: [] };
}
 
 
const LEARNER = { community_pool: { name: 'learner pool hall, 13 × 7 m of water', w: 10.6, l: 16.6, src: 'POOL_VARIANTS 1a; Sport England DGN pp. 44–45 (benchmark); V1050 board' } };
function learnerOf(def) { return def ? (def.learner || LEARNER[def.id] || null) : null; }
 
function edmGross(net, W, Da) { const e = GROSS.ext; return net + 2 * e * (W + Da) + 4 * e * e; }
function edmBays(net, W, Da) { const g = edmGross(net, W, Da); return g < 2500 ? 0 : g <= 7500 ? 1 : 2; }
const GROSS = { ext: 0.20, src: 'Bylaw 20001 s. 8.20 (gross floor area, to the outside face of exterior walls); 0.40 m Edmonton exterior wall, rooms drawn to centrelines ( item 3, project decision, 14 Nov 2026)' };
function unionArea(rs) { rs = rs.filter(r => r[1] - r[0] > 1e-9 && r[3] - r[2] > 1e-9); if (!rs.length) return 0;
  const xs = [...new Set(rs.flatMap(r => [r[0], r[1]]))].sort((a, b) => a - b); let A = 0;
  for (let i = 0; i < xs.length - 1; i++) { const x0 = xs[i], x1 = xs[i + 1], iv = rs.filter(r => r[0] <= x0 + 1e-9 && r[1] >= x1 - 1e-9).map(r => [r[2], r[3]]).sort((a, b) => a[0] - b[0]);
    let len = 0, c0 = null, c1 = null; for (const [a, b] of iv) { if (c1 == null || a > c1) { if (c1 != null) len += c1 - c0; c0 = a; c1 = b; } else c1 = Math.max(c1, b); } if (c1 != null) len += c1 - c0; A += len * (x1 - x0); }
  return A; }
function grossOf(rooms, pick) { let tot = 0;
  for (const st of Object.keys(rooms)) { const all = rooms[st].flatMap(x => x.r), P = rooms[st].filter(pick).flatMap(x => x.r); if (!P.length) continue;
    const e = GROSS.ext, Bv = unionArea(all), grown = P.map(r => [r[0] - e, r[1] + e, r[2] - e, r[3] + e]); tot += unionArea(P) + unionArea(grown.concat(all)) - Bv; }
  return tot; }
 
function capCount(L, def) { const E = (def.establishments || []).filter(x => x.id); if (!E.length || !L.rooms) return null;
  const lobId = def.family && def.family.lobby ? def.family.lobby.id : 'lobby', keyOf = x => x.id === 'lob' ? lobId : (x.prog || x.id);
  const dc = x => x.block === 'data centre' || x.dcSide || x.kind === 'bay', rest = E.find(x => x.rest) || E[0], share = def.lobbyShared || null;
  const owner = x => { const k = keyOf(x); if (share && k === lobId) return 'LOBBY'; const e = E.find(y => (y.rooms || []).includes(k)); return e ? e.id : rest.id; };
  const capOf = e => e.cap && e.cap.edm != null ? e.cap.edm : null, rows = E.map(e => ({ id: e.id, name: e.name || e.id, use: (e.use || {}).edm || '?', cap: capOf(e), capSrc: e.capSrc || '',
    gross: grossOf(L.rooms, x => !dc(x) && !x.noCap && owner(x) === e.id), net: sum(Object.values(L.rooms).flat().filter(x => !dc(x) && !x.noCap && owner(x) === e.id).map(x => sum(x.r.map(ra)))) }));
  let lobbyTo = null; if (share) { const lob = x => !dc(x) && owner(x) === 'LOBBY', order = share.map(id => rows.find(r => r.id === id)).filter(Boolean);
    const withL = r => grossOf(L.rooms, x => !dc(x) && (owner(x) === r.id || owner(x) === 'LOBBY')), pickR = order.find(r => r.cap == null || withL(r) <= r.cap + 1e-6) || order[0];
    if (pickR && Object.values(L.rooms).flat().some(lob)) { pickR.gross = withL(pickR); lobbyTo = pickR.id; } }
  rows.forEach(r => { r.gross = Math.round(r.gross * 10) / 10; r.over = r.cap != null && r.gross > r.cap + 1e-6; });
  return { rows, lobbyTo, src: GROSS.src }; }
function estOfId(def, id) { const E = (def.establishments || []).filter(x => x.id); const e = E.find(y => (y.rooms || []).includes(id)) || E.find(x => x.rest) || E[0]; return e ? e.id : null; }
 
 
function dcSideDoors(door, ext, S1, D) { door(1, 'hall', 'scor2', 0.3); door(1, 'hall', 'scor2', 0.7); door(1, 'scor2', 'pas3', 0.5); door(1, 'scor2', 'pas4', 0.5);
  door(1, 'hall', 'pas3', 0.5); door(1, 'hall', 'pas4', 0.5); door(1, 'scor', 'pas3', 0.5); door(1, 'scor', 'pas4', 0.5); ext(1, 'pas3', 'b1', 0.5); ext(1, 'pas4', 'b1', 0.5);
  S1.filter(x => x.kind === 'sroom' || (x.kind === 'spare' && x.dcSide)).forEach(x => door(1, x.id, 'scor', 0.5) || door(1, x.id, 'scor2', 0.5)); door(1, 'ves', 'scor', 0.5); door(1, 'dock', 'scor', 0.5);
  S1.filter(x => x.kind === 'bay').forEach(x => { ext(1, x.id, 'b0', 0.5, 2.8); door(1, 'dock', x.id, 0.5); });
   
  const n0 = D.length; ext(1, 'ves', 'b0', 0.5); if (D.length > n0) D[D.length - 1][2] = 'IN'; }
function besideDCside(C, W, R, aB, progArea, sI, needRow) {
   
  const { st, van } = C, cw = RULES.cor.w, pw = RULES.pexit.w, bayL = van ? 10.2 : 9.0, dA = Math.max(7.0, bayL), dB = 5.3, bS = r2(dA + cw + dB + cw), hW = r2(W - bS);
  if (hW < 12 - 1e-6) return { fail: `data-centre support row needs ${needRow} m; ${W} m (beside the hall: the support band ${bS} m leaves ${hW} m of hall, under 12 m)` };
  const bayW = van ? 3.4 : 3.3, cap = CAPM2();
  const outer = ['ves', 'dock', 'ship', 'garb', 'dwc', 'brk'], items = sI.filter(x => !/^pas/.test(x.id) && !x.bay), A = items.filter(x => outer.includes(x.id)), B = items.filter(x => !outer.includes(x.id));
  const mOf = x => (PRG[x.id] && PRG[x.id].min) || x.m2, nb = sI.filter(x => x.bay).length, wA = r2(sum(A.map(x => x.fix != null ? x.fix : Math.max((x.w || 0) + wallOf(x), x.m2 ? up1(mOf(x) / (dA - wallOf(x)) + wallOf(x)) : 0))) + bayRun(nb, bayW)), wB2 = r2(sum(B.map(x => Math.max((x.w || 0) + wallOf(x), x.m2 ? up1(mOf(x) / (dB - wallOf(x)) + wallOf(x)) : 0))));    
  const runMin = Math.max(wA, wB2); let dH = Math.max(runMin, up1(HPM() * C.mw / hW));
  const dcOf = d => d * hW + d * bS + 2 * pw * W; while (dcOf(dH) > cap + 0.5 && dH - 0.5 >= runMin) dH = r2(dH - 0.5);
  let Da = r2(aB + pw + dH + pw); if (Da > C.aMax) { Da = Math.floor(C.aMax * 10) / 10; dH = r2(Da - aB - 2 * pw); if (dH < runMin - 1e-6) return { fail: `the lot is ${C.aMax} m deep; the data centre beside its hall needs ${r2(aB + 2 * pw + runMin)} m` }; }
   
  const AW = RULES.aisle.w, sp = C.spanOver(0, Da); if (!sp) return { fail: 'no width over the building depth' };
  if (r2(sp[1] - sp[0]) < r2(W + AW) - 0.01) return { fail: `the lot narrows to ${r2(sp[1] - sp[0])} m over the building's ${Da} m depth; the layout and its side truck aisle need ${r2(W + AW)} m`, narrowTo: r2(sp[1] - sp[0] - AW) };
  let bOrigin = (C.sv < 0 ? sp[1] : sp[0]) + C.sv * AW; C.mapUV = (a, b) => [C.uOf(C.a0 + a), bOrigin + C.sv * b];
  const a1 = r2(aB + pw), a2 = r2(a1 + dH), sec = (id, n, kind, rects, o) => room(1, id, n, kind === 'hall' ? 'hall' : kind === 'bay' ? 'load' : 'sup', kind, rects, Object.assign({ block: 'data centre' }, o || {}));
  R.push(sec('pas3', 'Exit passage (2 h) across the front of the data centre', 'exitpas', [[aB, a1, 0, W]]), sec('pas4', 'Exit passage (2 h) across the rear of the data centre', 'exitpas', [[a2, Da, 0, W]]));
  R.push(sec('hall', 'Data hall (one storey)', 'hall', [[a1, a2, bS, W]]), sec('scor', 'Secure corridor', 'scor', [[a1, a2, dA, r2(dA + cw)]], { corridor: true }), sec('scor2', 'Secure corridor (along the hall)', 'scor', [[a1, a2, r2(bS - cw), bS]], { corridor: true }));
  const putRow = (its, b0, b1, d, withBays) => { const bays = withBays ? Array.from({ length: nb }, (_, i) => ({ id: 'b' + (i + 1), fix: bayFix(i, nb, bayW), bay: true })) : [], its2 = its.map(x => Object.assign({}, x)), iD = its2.findIndex(x => x.id === 'dock');
    if (iD >= 0) its2.splice(iD + 1, 0, ...bays); else its2.push(...bays);    
    const list = its2.concat([{ id: 'dsp' + Math.round(b0), n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]);
    const pk = pack(list, r2(a2 - a1), d); if (pk.fail) return pk.fail; let a = a1;
    list.forEach((x, i) => { const w = pk.ws[i]; if (w < 0.01) return; const r = [r2(a), r2(a + w), b0, b1];
      if (x.bay) R.push(sec(x.id, `Loading space ${x.id.slice(1)}, ${van ? 'Class B 10.2 × 3.4 m with 1.3 m side clearance (a pair shares one)' : '9.0 × 3.3 m with 1.3 m side clearance (a pair shares one; Vancouver Design Supplement figure used as a stand-in, Edmonton not sourced)'} (open to the side truck aisle)`, 'bay', [r], { bayL }));
      else if (x.spare) R.push(room(1, x.id, x.n, 'spare', 'spare', [r], { block: 'spare', dcSide: true }));
      else if (x.id === 'dock') R.push(sec('dock', x.n, 'dock', [r])); else if (x.id === 'ves') R.push(sec('ves', x.n, 'entry', [r])); else R.push(sec(x.id, x.n, 'sroom', [r], { prog: x.id, wet: x.id === 'hrr' || undefined }));
      a = r2(a + w); }); return null; };
  const fA = putRow(A, 0, dA, dA, true); if (fA) return { fail: `data-centre outer row beside the hall needs ${fA} m; ${dH} m` };
  const fB = putRow(B, r2(dA + cw), r2(bS - cw), dB, false); if (fB) return { fail: `data-centre inner row beside the hall needs ${fB} m; ${dH} m` };
  const dk = R.find(x => x.id === 'dock'), b1r = R.find(x => x.id === 'b1'), dockBay = !nb || (dk && b1r && Math.abs(dk.r[0][1] - b1r.r[0][0]) < 0.01);
   
  const vr = R.find(x => x.id === 'ves'), WALK = 1.2; let walk = null;
  if (vr) { const aV = r2(vr.r[0][1]), sw = C.spanOver(0, aV) || sp, room0 = C.sv < 0 ? r2(sw[1] - sp[1]) : r2(sp[0] - sw[0]), shift = Math.max(0, r2(WALK - room0));
     
    if (shift > 0) { if (r2(sp[1] - sp[0]) < r2(W + AW + shift) - 0.01) return { fail: `the lot narrows to ${r2(sp[1] - sp[0])} m over the building's ${Da} m depth; the layout, its side truck aisle and the 1.2 m walk to the street need ${r2(W + AW + shift)} m`, narrowTo: r2(sp[1] - sp[0] - AW - shift) };
      bOrigin = bOrigin + C.sv * shift; }
    walk = [r2(-C.a0), aV, r2(-AW - WALK), r2(-AW)]; }
  const puFlags = ['DC staff entrance (narrow data-centre form): the vestibule keeps its portal and guard point; its door on the truck-aisle side is an entrance only, not counted as an exit; staff cross the ' + AW + ' m aisle to a 1.2 m keep-clear walk along its outer edge to the street (14r item 2, the project pick; no fence or gate drawn, a later design move)'];    
  if (!dockBay) puFlags.push('Loading (narrow data-centre form): the first bay does not share a wall with the dock lobby (check in design ?)');
  const hall = dH * hW, MW = hall / HPM(), dcArea = sum(R.filter(x => x.block === 'data centre' && x.kind !== 'bay').map(x => sum(x.r.map(ra))));
  const rooms = { 1: R }, truck = { court: [0, Da, -AW, 0], walk, covered: null, side: true, why: `bays in the outer row beside the hall, next to the dock, open to a ${AW} m truck aisle in the side yard (Parking By-law 5.4.1 aisle, Vancouver's figure used in Edmonton ?; the aisle's way to the street not checked ?)` };
  const plant = plantLayout(Object.assign({}, C, { lowRoof: { r: [0, aB, 0, W], z: RULES.storeyH.hall } }), W, Da, MW, rooms);
  return { rooms, H: [RULES.storeyH.hall], hall, MW, dcArea, nb, shared: st.shared, truck, plant, aB, W, Da, bOrigin, covered: [], dcSide: true, puFlags };
}
 
 
let SPAREF = null;
function spareList(id) { if (SPAREF === null) { SPAREF = {}; try { if (root && typeof XMLHttpRequest !== 'undefined') { const x = new XMLHttpRequest(); x.open('GET', 'data/sparefill.json', false); x.send(null); if (x.status === 200) SPAREF = JSON.parse(x.responseText); }
    else if (typeof require !== 'undefined') { const fs = require('fs'), path = require('path'), f = path.join(__dirname, 'data', 'sparefill.json'); if (fs.existsSync(f)) SPAREF = JSON.parse(fs.readFileSync(f, 'utf8')); } } catch (e) { SPAREF = {}; } }
  return (SPAREF[id] || []).filter(x => !x.skip && !x.fillRest); }
function fillRestOf(id) { spareList(id); const x = (SPAREF[id] || []).find(y => y.fillRest); return x || null; }
function wallLen(r, q) { let L = 0;
  if (Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(r[0] - q[1]) < 1e-6) L = Math.max(L, Math.min(r[3], q[3]) - Math.max(r[2], q[2]));
  if (Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(r[2] - q[3]) < 1e-6) L = Math.max(L, Math.min(r[1], q[1]) - Math.max(r[0], q[0]));
  return L; }
 
function capped(def) { return !!(def && (def.establishments || []).some(e => e.cap && e.cap.edm != null)); }
function capOkFor(def, C, L) { if (C.van || !capped(def)) return null;
  return (it, m2, tgt) => { const cc = capCount(L, def); if (!cc) return true; const est = estOfId(def, tgt ? (tgt.prog || tgt.id) : it.id), row = cc.rows.find(r => r.id === est);
    return !row || row.cap == null || row.gross + m2 <= row.cap + 1e-6; }; }
 
 
function trimRooms(L, def) { const RD = id => ((def && def.rooms) || []).find(r => r.id === id), CORR = new Set(['cor', 'xcor', 'gcor', 'ccor', 'lob', 'pcor']), cut = [];
  const over = (st, r) => Object.keys(L.rooms).some(k => +k > st && L.rooms[k].some(y => y.r.some(q => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.05 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.05)));
  const shortOf = r => Math.min(r[1] - r[0], r[3] - r[2]);
  for (const st of Object.keys(L.rooms).map(Number)) { const R = L.rooms[st];
    R.forEach(x => { if (x.r.length > 1) x.r = x.r.filter(r => shortOf(r) >= 0.3 || x.r.every(q => shortOf(q) < 0.3)); });
    for (const x of R.filter(y => y.kind === 'proom' && !y.core && !y.corridor)) { const d = RD(x.prog || x.id); if (!d) continue;
      const mw = d.minWClear != null ? d.minWClear : d.minW; if (mw && x.r.length > 1 && !x.reach) {     const keep = x.r.filter(r => shortOf(r) >= mw - 1e-6); if (keep.length && keep.length < x.r.length) { x.r.filter(r => shortOf(r) < mw - 1e-6).forEach(r => cut.push([st, r, x])); x.r = keep; } }
      if (/(^|_)(wc|washrooms?)(_|$)|washroom/i.test(x.id + ' ' + (d.name || '')) && !/change/i.test(x.id) && d.m2 && x.r.length === 1) { const r = x.r[0], need = d.m2;
        if (ra(r) > 1.5 * need) { const side = (() => { for (const y of R) { if (!CORR.has(y.id)) continue; for (const q of y.r) { if (wallLen(r, q) < 0.9) continue; if (Math.abs(q[1] - r[0]) < 0.05) return 'a0'; if (Math.abs(q[0] - r[1]) < 0.05) return 'a1'; if (Math.abs(q[3] - r[2]) < 0.05) return 'b0'; if (Math.abs(q[2] - r[3]) < 0.05) return 'b1'; } } return null; })();
          const sd = side ? [side] : null;  if (sd) { const alongA = sd[0][0] === 'a', w = alongA ? r[3] - r[2] : r[1] - r[0], dN = Math.max(up1(need / Math.max(0.5, w - 0.1) + WALLD), 1.5), dep = alongA ? r[1] - r[0] : r[3] - r[2];
            if (dep - dN >= 1.0) { let mine, rest; if (sd[0] === 'a0') { mine = [r[0], r2(r[0] + dN), r[2], r[3]]; rest = [r2(r[0] + dN), r[1], r[2], r[3]]; } else if (sd[0] === 'a1') { mine = [r2(r[1] - dN), r[1], r[2], r[3]]; rest = [r[0], r2(r[1] - dN), r[2], r[3]]; }
              else if (sd[0] === 'b0') { mine = [r[0], r[1], r[2], r2(r[2] + dN)]; rest = [r[0], r[1], r2(r[2] + dN), r[3]]; } else { mine = [r[0], r[1], r2(r[3] - dN), r[3]]; rest = [r[0], r[1], r[2], r2(r[3] - dN)]; }
              x.r = [mine]; cut.push([st, rest, x, true]); } } } } } }
  let nb = 0, jn = 0, sp = 0; cut.forEach(([st, r, x, wc]) => { const R = L.rooms[st]; if (over(st, r) === false && st === 1) { (L.unbuilt || (L.unbuilt = [])).push({ st, m2: r2(ra(r)), r: r.map(r2), open: true }); nb += ra(r); return; }
    const y = R.find(y => y !== x && y.kind === 'proom' && !y.core && !y.big && !y.big2 && !/wc|washroom/i.test(y.id) && y.block === x.block && y.r.some(q => wallLen(r, q) >= 1.0));    
    if (y) { y.r.push(r.map(r2)); jn += ra(r); } else { R.push(room(st, `trim_${x.id}_${Math.round(r[0] * 10)}`, 'Unassigned program floor (cut off a room)', 'spare', 'spare', [r.map(r2)], { block: x.block })); sp += ra(r); } });
  if (cut.length) (L.flags || (L.flags = [])).push(`Rooms trimmed to their minimum width and washrooms to their need ( items 1, 3): ${cut.length} piece(s); ${Math.round(nb)} m² not built (at grade, nothing above), ${Math.round(jn)} m² joined a room beside, ${Math.round(sp)} m² to the fill`); }
function closeSpare(L, def, van, fillId) { if (!L.rooms || L._closeSpare) return; const FR = fillId ? fillRestOf(fillId) : null; if (!FR) return def ? capSpare(L, def, van, fillId) : undefined; L._closeSpare = true;
  if (!L.spareFilled) L.spareFilled = spareFill(L, fillId, def ? capOkFor(def, { van }, L) : null);
  L.spareFilled = (L.spareFilled || []).concat(spareFill(L, fillId, def ? capOkFor(def, { van }, L) : null));        
   
  const est = id => def && def.establishments ? estOfId(def, id) : null, frKey = FR.estOf || FR.id, frEst = est(frKey), RDf = id => ((def && def.rooms) || []).find(r => r.id === id);
  const hallOver = (st, r) => st > 1 || (L.rooms[st + 1] || []).concat(L.rooms[st + 2] || []).some(y => y.kind === 'hall' && y.r.some(q => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.05 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.05));
   
  const progSide = y => L.kind === 'stacked' && L.aB != null && y.id !== 'sparehub' && y.r.every(r => r[1] <= L.aB + 0.01);
  const nothingOver = (st, r) => st === 1 && !Object.keys(L.rooms).some(k => +k > st && L.rooms[k].some(y => y.r.some(q => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.05 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.05)));
  if (RULES.fillOff) { const nb = []; for (const st of Object.keys(L.rooms).map(Number)) { const R = L.rooms[st];
      for (const x of R.filter(y => y.kind === 'spare' && !y.dcSide && y.block !== 'data centre' && (y.block !== 'spare' || (L.kind === 'stacked' && L.aB != null && y.id !== 'sparehub' && y.r.every(r => r[1] <= L.aB + 0.01))))) {
        R.splice(R.indexOf(x), 1); x.r.forEach(r => { if (ra(r) >= 0.5) nb.push({ st, m2: r2(ra(r)), r: r.map(r2), open: st === 1 && !Object.keys(L.rooms).some(k => +k > st && L.rooms[k].some(y => y.r.some(q => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.05 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.05))) }); }); } }
    L.unbuilt = nb; (L.flags || (L.flags = [])).push(`TEST ( item 1(a)): the remaining program floor is not built: ${Math.round(sum(nb.map(o => o.m2)))} m² (${Math.round(sum(nb.filter(o => o.open).map(o => o.m2)))} m² at grade with nothing above becomes open court)`); return; }
  const mn = FR.minArea || 0, mx = FR.maxM2 || 1e9; let k = 0, made = 0, a = 0, joined = 0, dry = 0, wetUnder = 0;
   
  const all = () => Object.values(L.rooms).flat(), areaOf_ = id => sum(all().filter(y => (y.prog || y.id) === id || y.id === id).map(y => sum(y.r.map(ra))));
  let budget = FR.maxRatio && FR.estOf ? r2(FR.maxRatio.v * areaOf_(FR.maxRatio.of) - areaOf_(FR.estOf)) : null; const over = [];
  let capStop = null; if (def && !van && capped(def) && def.establishments) { const cc = capCount(L, def), row = cc && cc.rows.find(r => r.id === (frEst || estOfId(def, frKey)));    
    if (row && row.cap != null) { const cb = r2(row.cap - row.gross); budget = budget == null ? Math.max(0, cb) : Math.min(budget, Math.max(0, cb)); capStop = row; } }
  for (const st of Object.keys(L.rooms).map(Number)) { const R = L.rooms[st];
    for (const x of R.filter(y => y.kind === 'spare' && !y.dcSide && y.block !== 'data centre' && (y.block !== 'spare' || progSide(y)))) {
      R.splice(R.indexOf(x), 1);
      for (let r of x.r) { if (ra(r) < 0.5) continue;
        if (nothingOver(st, r)) { (L.unbuilt || (L.unbuilt = [])).push({ st, m2: r2(ra(r)), r: r.map(r2), open: true }); continue; }     const under = hallOver(st, r), useDry = FR.wet && under && FR.dryAlt; if (FR.wet && under && !FR.dryAlt) wetUnder++;
        if (ra(r) < mn - 1e-6) { const noJoin = y => y.big || y.big2 || ((def && def.constraints) || []).some(c => (c.type === 'nothingAbove' || c.type === 'notAboveOrBelow') && [].concat(c.rooms || c.room || c.args || []).includes(y.prog || y.id));    
          const y = R.find(y => !y.core && !noJoin(y) && y.kind === 'proom' && (frEst ? est(y.prog || y.id) === frEst : true) && y.r.some(q => wallLen(r, q) >= 1.0));
          const y2 = y || R.find(y => !y.core && !noJoin(y) && !y.corridor && (y.kind === 'proom' || y.kind === 'croom') && y.r.some(q => wallLen(r, q) >= 1.0));    
          if (y2) { y2.r.push(r.map(r2)); joined += ra(r); continue; } }
        let alongA = r[1] - r[0] >= r[3] - r[2];
        if (RULES.fillAccess !== false && !/unassigned/i.test(FR.name || FR.id || '') && !fillPiecesReach(R, x, r, alongA, mx, FR.minWidth || 0)) {     const acc = fillAccess(R, st, r, x); if (acc) { if (acc.strip) { R.push(room(st, `acc${st}_${k}`, 'Access corridor through the fill row (1.5 m)', 'circ', 'pcor', [acc.strip], { block: x.block === 'spare' ? 'hub' : x.block, corridor: true })); r = acc.rest; } alongA = acc.alongA; } }    
        const len = alongA ? r[1] - r[0] : r[3] - r[2], dep = alongA ? r[3] - r[2] : r[1] - r[0], lc = Math.max(FR.minWidth || 0, mx / dep);
        let n = Math.max(1, Math.floor(len / lc + 1e-9)); const ls = Array(n).fill(lc); let rem = r2(len - n * lc);
        if (rem > 0.01) { if (rem * dep >= mn - 1e-6 && rem >= (FR.minWidth || 0) - 1e-6) ls.push(rem); else ls[ls.length - 1] = ls[ls.length - 1] + rem; }
        let c = alongA ? r[0] : r[2];
        ls.forEach((l, i) => { const e = i === ls.length - 1 ? (alongA ? r[1] : r[3]) : r2(c + l), rr = alongA ? [c, e, r[2], r[3]] : [r[0], r[1], c, e]; k++;
          const nm = useDry ? ((RDf(FR.dryAlt) || {}).name || String(FR.dryAlt).replace(/_/g, ' ')) : FR.name.split(' (')[0];
          if (budget != null && !useDry && ra(rr) > budget + 0.5) {    
            const l1 = budget >= mn - 1e-6 && budget > 0.5 ? r2(budget / dep) : 0, cut = alongA ? r2(rr[0] + l1) : r2(rr[2] + l1);
            if (l1 > 0.05) { const keepR = alongA ? [rr[0], cut, rr[2], rr[3]] : [rr[0], rr[1], rr[2], cut], restR = alongA ? [cut, rr[1], rr[2], rr[3]] : [rr[0], rr[1], cut, rr[3]];
              R.push(room(st, `${FR.id}_c${k}`, `${FR.name.split(' (')[0]} ${k}`, 'pub', 'proom', [keepR], { block: x.block === 'spare' ? 'hub' : x.block, prog: frKey, closed: true, filled: true, wingRoom: x.block === 'hub' ? true : undefined })); made++; a += ra(keepR); budget = 0; over.push([st, restR]); }
            else { over.push([st, rr]); k--; } c = e; return; }
          if (budget != null && !useDry) budget = r2(budget - ra(rr));
          R.push(room(st, `${useDry ? FR.dryAlt : FR.id}_c${k}`, `${nm} ${k}`, 'pub', 'proom', [rr], { block: x.block === 'spare' ? 'hub' : x.block, prog: useDry ? FR.dryAlt : frKey, wet: useDry ? undefined : (FR.wet || undefined), closed: true, filled: true, wingRoom: x.block === 'hub' ? true : undefined }));
          made++; a += ra(rr); if (useDry) dry++; c = e; }); } } }
  if (over.length) { over.forEach(([st, rr]) => L.rooms[st].push(room(st, `fspr_r${st}_${Math.round(rr[0] * 10)}_${Math.round(rr[2] * 10)}`, FR.maxRatio ? `Unassigned program floor (the ${String(FR.estOf).replace(/_/g, ' ')} is at its ratio)` : 'Unassigned program floor (the establishment is at its cap)', 'spare', 'spare', [rr], { block: 'spare', ratioStop: true })));
    (L.flags || (L.flags = [])).push(FR.maxRatio ? `Fill stopped at the ratio ( item 1(b)): the ${String(FR.estOf).replace(/_/g, ' ')} at most ${Math.round(FR.maxRatio.v * 100)} % of the ${String(FR.maxRatio.of).replace(/_/g, ' ')} (${FR.maxRatio.src || 'the definition'}); no next item or general room in the list, so ${Math.round(sum(over.map(o => ra(o[1]))))} m² is left unassigned (?)`
      : `Fill stopped at the cap ( item 2): ${capStop ? capStop.name : 'the establishment'} gets fill only up to its ${capStop ? capStop.cap : 500} m² Edmonton cap; no uncapped item takes the rest, so ${Math.round(sum(over.map(o => ra(o[1]))))} m² under storeys is left unassigned (?)`); }
  if (L.unbuilt && L.unbuilt.length) (L.flags || (L.flags = [])).push(`Footprint to the program ( item 2, project decision, 15 Nov 21:54): ${Math.round(sum(L.unbuilt.map(o => o.m2)))} m² of remaining floor at grade with nothing above is not built; it stays open ground`);
  if (made || joined) (L.flags || (L.flags = [])).push(`Spare floor closed (project decision, 15 Nov 14:59; repeat rule 15f items 5-6): ${made} ${FR.name.split(' (')[0].toLowerCase()} room(s), ${Math.round(a)} m² (at up to ${FR.maxM2 || '?'} m² each, the last taking the remainder)${joined ? `; ${Math.round(joined)} m² under ${mn} m² joined the room beside it` : ''}${dry ? `; ${dry} under the hall as ${String(FR.dryAlt).replace(/_/g, ' ')} (rule 8)` : ''}${wetUnder ? `; ${wetUnder} wet piece(s) under the hall with no dry alternative in the list (?)` : ''}; nothing left unassigned`);
   
  if (L.kind === 'bigroom' && def && def.family) { L.Dbig = (L.grade ? bigRoomDoorsC : bigRoomDoors)(L, def.constraints || []);
     
    const skyIds = new Set((def.constraints || []).filter(c => c.type === 'nothingAbove' || c.type === 'notAboveOrBelow').flatMap(c => [].concat(c.rooms || c.room || c.args || [])));
    let moved = 0; for (const st of Object.keys(L.rooms)) { const R = L.rooms[st];
      for (const x of R.filter(y => y.closed && !L.Dbig.some(d => d[0] === +st && (d[1] === y.id || d[2] === y.id)))) {
        const nb = R.filter(y => y !== x && !y.core && !y.corridor && y.kind === 'proom' && !/hypochlorite|chlorine|acid|chemical store/i.test((y.id || '') + ' ' + (y.n || '')) && !y.big && !y.big2 && !skyIds.has(y.prog || y.id) && y.r.some(q => x.r.some(r => wallLen(r, q) >= 1.0)));    
        const to = nb.find(y => frEst && est(y.prog || y.id) === frEst && L.Dbig.some(d => d[1] === y.id || d[2] === y.id)) || nb.find(y => L.Dbig.some(d => d[1] === y.id || d[2] === y.id));
        if (to) { to.r.push(...x.r); R.splice(R.indexOf(x), 1); moved++; } else { Object.assign(x, { kind: 'spare', g: 'spare', block: 'spare', closed: false, n: 'Unassigned program floor (no corridor wall, no room beside it to join; never a chemical store)' }); (L.flags || (L.flags = [])).push(`${x.id}: no corridor wall and no room beside it to join (never a chemical store): left as unassigned floor (cascade 17ah)`); } } }
    if (moved) { L.Dbig = (L.grade ? bigRoomDoorsC : bigRoomDoors)(L, def.constraints || []); L.flags.push(`${moved} closed room(s) with no corridor wall joined the room beside them ( item 5)`); }
    spareDoorCheck(L); } }
function capSpare(L, def, van, fillId) { if (van || !capped(def) || !L.rooms || L._capSpare) return; L._capSpare = true;
  if (fillId && !L.spareFilled) L.spareFilled = spareFill(L, fillId, capOkFor(def, { van }, L));
  const over = (st, r) => (L.rooms[st + 1] || []).some(y => y.r.some(q => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.05 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.05));
  let gone = 0, kept = 0; const goneIds = new Set();
  for (const st of Object.keys(L.rooms).map(Number)) { const R = L.rooms[st];
    for (let i = R.length - 1; i >= 0; i--) { const x = R[i]; if (x.kind !== 'spare' || x.dcSide || x.block === 'spare' || x.block === 'data centre') continue;
      const keep = x.r.filter(r => over(st, r)), drop = x.r.filter(r => !over(st, r)); gone += sum(drop.map(ra)); kept += sum(keep.map(ra));
      if (keep.length) { x.r = keep; x.noCap = true; x.n = 'Unassigned (no use yet; counted toward no cap)'; } else { R.splice(i, 1); goneIds.add(st + '|' + x.id); } } }
  const keepD = d => !goneIds.has(d[0] + '|' + d[1]) && !goneIds.has(d[0] + '|' + d[2]);
  if (L.Dbig) L.Dbig = L.Dbig.filter(keepD); if (L.D) L.D = L.D.filter(keepD);
  if (gone > 0.5 || kept > 0.5) (L.flags || (L.flags = [])).push(`Unassigned program floor in a capped typology (project decision, 15 Nov 13:16): ${gone > 0.5 ? Math.round(gone) + ' m² not built' : ''}${gone > 0.5 && kept > 0.5 ? '; ' : ''}${kept > 0.5 ? Math.round(kept) + ' m² under upper floors kept, counted toward no cap' : ''} (no spareFill item fits an establishment with room under its cap)`); }
function spareFill(L, typId, okItem) {
  const items = spareList(typId); if (!items.length || !L.rooms) return []; const done = [], used = new Set(), CORR = { 1: ['cor', 'xcor', 'lob'], 2: ['gcor'] };
   
  for (const st of Object.keys(L.rooms)) { const R = L.rooms[st];
    for (const sp of R.filter(x => x.kind === 'spare' && !x.dcSide && x.block !== 'data centre')) {
      const isCorr = x => (CORR[st] || []).includes(x.id);
      for (const it of items) { if (!sp.r.length) break; if (it.ground && +st !== 1) continue; if (!it.grow && Object.values(L.rooms).flat().some(y => y !== sp && (y.id === it.id || y.prog === it.id))) continue;     if (!it.grow && used.has(it.id)) continue;    
        const rect = sp.r.slice().sort((p, q) => ra(q) - ra(p))[0], alongA = rect[1] - rect[0] >= rect[3] - rect[2], len = alongA ? rect[1] - rect[0] : rect[3] - rect[2], wid = alongA ? rect[3] - rect[2] : rect[1] - rect[0];
        if (it.minWidth && wid < it.minWidth - 1e-6) continue;
        const tgt = it.grow ? R.find(x => it.grow.includes(x.id) || it.grow.includes(x.prog)) : null; if (it.grow && !tgt) continue;
        let want = it.area; if (tgt) { const cur = sum(tgt.r.map(ra)); want = it.total != null ? it.total - cur : it.inc ? it.area : (it.area != null && it.area >= cur ? it.area - cur : it.area);     if (want != null && want <= 0.5) continue; }
        const minA = it.minArea != null ? it.minArea : (tgt ? 0 : it.area); if (minA && ra(rect) < (RULES.belowMinFails ? 1 : 0.95) * minA - 1e-6) continue;    
        let l = want == null ? len : Math.min(len, want / wid); if (len - l < 0.5) l = len; l = r2(l);
        const cands = [0, 1].map(end => alongA ? (end ? [r2(rect[1] - l), rect[1], rect[2], rect[3]] : [rect[0], r2(rect[0] + l), rect[2], rect[3]]) : (end ? [rect[0], rect[1], r2(rect[3] - l), rect[3]] : [rect[0], rect[1], rect[2], r2(rect[2] + l)]));
        const ok = c => { const touch = ids => R.some(y => y !== sp && ids(y) && y.r.some(q => wallLen(c, q) >= RULES.door.w + 0.2));
          if (tgt) return tgt.r.some(q => wallLen(c, q) >= 1.0);
          if (!touch(isCorr)) return false;
          if (it.nothingAbove && Object.keys(L.rooms).some(k => +k > +st && L.rooms[k].some(y => y.r.some(q => Math.min(c[1], q[1]) - Math.max(c[0], q[0]) > 0.05 && Math.min(c[3], q[3]) - Math.max(c[2], q[2]) > 0.05)))) return false;    
          if (it.notNear && Object.values(L.rooms).flat().some(y => y !== sp && (y.block === 'data centre' || y.dcSide || it.notNear.includes(y.id) || it.notNear.includes(y.prog)) && y.r.some(q => wallLen(c, q) >= 0.3))) return false;    
          if (it.adjacent && !touch(y => it.adjacent.includes(y.id) || it.adjacent.includes(y.prog))) return false; return true; };
        const c = cands.find(ok); if (!c) continue;
        if (okItem && !okItem(it, ra(c), tgt)) continue;    
        const rest = alongA ? (c[0] > rect[0] + 1e-6 ? [rect[0], c[0], rect[2], rect[3]] : [c[1], rect[1], rect[2], rect[3]]) : (c[2] > rect[2] + 1e-6 ? [rect[0], rect[1], rect[2], c[2]] : [rect[0], rect[1], c[3], rect[3]]);
        sp.r = sp.r.filter(q => q !== rect); if (l < len - 1e-6) sp.r.push(rest.map(r2));
        if (tgt) { tgt.r.push(c.map(r2)); done.push({ st: +st, id: it.id, grow: tgt.id, m2: r2(ra(c)), src: it.src }); }
        else { const nb = R.find(y => y !== sp && y.kind === 'proom' && y.r.some(q => wallLen(c, q) >= 1.0)), nid = it.id + (R.some(y => y.id === it.id) ? '_' + st : '');
          R.push(room(+st, nid, it.name + ' (spare floor)', it.wet ? 'pub' : (nb ? nb.g : 'pub'), 'proom', [c], { block: nb ? nb.block : (+st === 1 ? 'pool' : 'gym'), prog: it.id, wet: it.wet || undefined, filled: true }));
          used.add(it.id); done.push({ st: +st, id: nid, m2: r2(ra(c)), src: it.src }); } }
    }
    L.rooms[st] = R.filter(x => !(x.kind === 'spare' && !x.r.length)); }
  return done; }
 
function spareDoorCheck(L) { if (!L.spareFilled || !L.spareFilled.length) return; const D = L.Dbig || [];
  for (const st of Object.keys(L.rooms)) L.rooms[st].forEach(x => { if (!x.filled || D.some(d => d[0] === +st && (d[1] === x.id || d[2] === x.id))) return;
    Object.assign(x, { kind: 'spare', g: 'spare', block: 'spare', n: 'Unassigned program floor (no use yet; ' + x.n.replace(' (spare floor)', '') + ' had no corridor door)', filled: false });
    L.spareFilled = L.spareFilled.filter(f => !(f.id === x.id && f.st === +st)); }); }
function bigRoomDoorsC(L, constraints) {
  const R = L.rooms, D = [], dW = RULES.door.w, sW = RULES.street.w, by = (st, id) => (R[st] || []).find(x => x.id === id);
  const shared = (A, B) => { let best = null;
    for (const r of A.r) for (const q of B.r) {
      if (Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(r[0] - q[1]) < 1e-6) { const at = Math.abs(r[1] - q[0]) < 1e-6 ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'v', at, f, t, len: t - f }; }
      if (Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(r[2] - q[3]) < 1e-6) { const at = Math.abs(r[3] - q[2]) < 1e-6 ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'h', at, f, t, len: t - f }; } }
    return best; };
  const door = (st, a, b, t, w) => { const A = by(st, a), B = by(st, b); if (!A || !B) return false; const s = shared(A, B); if (!s || s.len < (w || dW) + 0.1) return false;
    const half = (w || dW) / 2, c = r2(Math.min(s.t - half - 0.05, Math.max(s.f + half + 0.05, s.f + (s.t - s.f) * (t == null ? 0.5 : t))));
    D.push(s.o === 'v' ? [st, a, b, r2(s.at), c, 'v', w || dW] : [st, a, b, c, r2(s.at), 'h', w || dW]); return true; };
  const ext = (st, a, side, t, w, k) => { const A = by(st, a); if (!A) return; { const o = A.extOverride && A.extOverride[side + '/' + (k || 0)]; if (o) { if (o.flag) ((L.flags) || (L.flags = [])).push(o.flag); if (o.none) return; if (o.via) return door(st, a, o.via, 0.5, w); side = o.side || side; t = o.t != null ? o.t : t; k = o.k != null ? o.k : k; } }     const r = A.r[k || 0], half = (w || dW) / 2;
    if (side === 'a0' || side === 'a1') { const at = side === 'a0' ? r[0] : r[1], c = r2(Math.min(r[3] - half - 0.05, Math.max(r[2] + half + 0.05, r[2] + (r[3] - r[2]) * t))); D.push([st, a, 'OUT', at, c, 'v', w || dW]); }
    else { const at = side === 'b0' ? r[2] : r[3], c = r2(Math.min(r[1] - half - 0.05, Math.max(r[0] + half + 0.05, r[0] + (r[1] - r[0]) * t))); D.push([st, a, 'OUT', c, at, 'h', w || dW]); } };
  const S1 = R[1], viaOf = {}; constraints.filter(c => c.type === 'accessOnlyVia').forEach(c => { viaOf[c.room] = (c.via || []).map(v => v === 'public_corridor' ? 'cor' : v); });    
   
  ext(1, 'lob', 'a0', 0.5, sW); door(1, 'lob', 'cor', 0.5, sW) || door(1, 'lob', 'desk', 0.5);
  const big = S1.find(x => x.big), big2 = S1.find(x => x.big2);
  if (big) { const k0 = big.r.findIndex(r => r[0] < 1e-6); if (k0 >= 0) { ext(1, big.id, 'a0', 0.25, sW, k0); ext(1, big.id, 'a0', 0.85, null, k0); } else { const kb = big.r.findIndex(r => r[2] < 1e-6); if (kb >= 0) ext(1, big.id, 'b0', 0.15, null, kb); } (viaOf[big.id] || []).forEach(v => { if (v !== 'exterior') door(1, big.id, v, 0.5); }); }
   
  if (big2) { const k = big2.r.findIndex(r => r[0] < 1e-6); if (k >= 0) ext(1, big2.id, 'a0', 0.5, null, k); if (big) door(1, big2.id, big.id, 0.5, 1.8); (viaOf[big2.id] || []).forEach(v => { if (v !== 'exterior') door(1, big2.id, v, 0.5); }); }
  S1.filter(x => x.withOf).forEach(x => door(1, x.id, x.withOf, 0.5));
  S1.filter(x => x.block !== 'data centre' && !x.big && !x.big2 && !x.withOf && (x.kind === 'proom' || x.kind === 'spare')).forEach(x => { const via = viaOf[x.id];
    if (via) { via.forEach(v => { if (v === 'exterior') { if (x.r[0][2] < 1e-6) ext(1, x.id, 'b0', 0.5); } else door(1, x.id, v, 0.5); }); return; }
    if (x.closed && Math.max(...x.r.map(r => Math.max(r[1] - r[0], r[3] - r[2]))) >= 12 && (door(1, x.id, 'cor', 0.15) || door(1, x.id, 'xcor', 0.15))) { door(1, x.id, 'cor', 0.85) || door(1, x.id, 'xcor', 0.85); return; }    
    if (!door(1, x.id, 'cor', 0.5) && !door(1, x.id, 'xcor', 0.5) && x.g !== 'plant') door(1, x.id, 'lob', 0.5);    
    if (x.g === 'plant' && x.r.some(r => r[2] < 1e-6)) ext(1, x.id, 'b0', 0.5, null, x.r.findIndex(r => r[2] < 1e-6));
    if (x.g === 'plant' && x.r.some(r => r[0] < 1e-6) && !x.r.some(r => r[2] < 1e-6)) ext(1, x.id, 'a0', 0.5); });
  door(1, 'pasf', 'cor', 0.5); ext(1, 'pasf', 'a0', 0.5); if (!by(1, 'xcor')) ext(1, 'cor', 'b0', 0.5);
  if (by(1, 'xcor')) { door(1, 'cor', 'xcor', 0.5, RULES.cor.w - 0.2); ext(1, 'xcor', 'b0', 0.5); ext(1, 'xcor', 'b1', 0.5); if (big && big.r.some(r => r[2] < 1e-6)) ext(1, big.id, 'b0', 0.9, null, big.r.findIndex(r => r[2] < 1e-6)); }    
   
  if (L.dcSide) { dcSideDoors(door, ext, S1, D); return D; }
  door(1, 'hall', 'scor', 0.15); door(1, 'hall', 'scor', 0.5); door(1, 'hall', 'scor', 0.85);
  ext(1, 'scor', 'b1', 0.5); door(1, 'pas3', 'scor', 0.5); ext(1, 'pas3', 'a1', 0.5); if (by(1, 'pas4')) { door(1, 'pas4', 'scor', 0.5); ext(1, 'pas4', 'a1', 0.5); }
  S1.filter(x => x.kind === 'sroom').forEach(x => door(1, x.id, 'scor', 0.5));
  door(1, 'ves', 'scor', 0.5); ext(1, 'ves', 'a1', 0.5); door(1, 'dock', 'scor', 0.5);
  const bays = S1.filter(x => x.kind === 'bay'); if (bays.length) door(1, 'dock', bays[bays.length - 1].id, 0.5); bays.forEach(x => ext(1, x.id, 'a1', 0.5, 2.8));    
  return D;
}
 
 
function stripMin(def, F) { if (!RULES.stripDerived) return F.strip.minDepth; const moved = new Set(F.moved || []), ws = (F.strip.rooms || []).filter(id => !moved.has(id) && !/^(P\d|E1)$/.test(id)).map(id => ((def.rooms || []).find(r => r.id === id) || {}).minW || 0);
  return Math.min(F.strip.minDepth, Math.max(3.0, ...ws)); }
function bigRoomBesideDeep(C, Wset, tries) {
  const def = stepDef(C), F = def.family, van = C.van, city = van ? 'van' : 'edm', cw = RULES.cor.w;
  const RD = id => def.rooms.find(x => x.id === id) || null, m2Of = x => (x && x.m2 && typeof x.m2 === 'object') ? x.m2[city] : (x ? x.m2 : null);
  const dropped = new Set(C.st.drop || []), has = id => !dropped.has(id) && !!RD(id);
  const BND = bandOf(def, has, RD, m2Of, F.lobby.depth, C.rowAlt); if (BND.fail) return BND; const inRow = new Set(BND.rowIds || []), hasP = id => has(id) && !inRow.has(id);
  const big = BND.ph, hW = BND.hW, hL = BND.hLb, lobD = F.lobby.depth;
  let sp = C.spanOver(0, Math.min(C.aMax, hL + 20)); if (!sp) return { fail: 'no buildable width' };
  const W = Wset || r2(sp[1] - sp[0]), sB0 = r2(W - hW - F.wetBand.depth - cw), strip = sB0 >= stripMin(def, F) - 1e-6;
  const wB = strip ? F.wetBand.depth : r2(W - hW - cw); if (wB < F.wetBand.depth - 1e-6) return { fail: `buildable width ${W} m: the ${big.name.toLowerCase()} (${hW} m), the ${F.wetBand.depth} m wet band and the ${cw} m corridor need ${r2(hW + F.wetBand.depth + cw)} m` };
  const bW0 = hW, bW1 = r2(hW + wB), bC1 = r2(bW1 + cw), aP = hL;
  const rid = (id, x, kind, g, rects, o) => room(1, id, x ? x.name : id, g, kind, rects, Object.assign({ block: x ? x.block : 'pool', prog: id }, o || {}));
  const R = [], wOf = (x, d) => Math.max(x.minW || 0, m2Of(x) ? up1(m2Of(x) / d) : 0);
  R.push(rid(big.id, big, 'proom', 'pub', [[0, aP, 0, hW]], { big: true, wet: true }));
  R.push(rid('lob', RD(F.lobby.id), 'lobby', 'circ', [[0, lobD, bW0, bC1]]));
  const wet = F.wetBand.rooms.filter(hasP).map(id => ({ id, x: RD(id) })), wetW = wet.map(o => wOf(o.x, wB));
  if (sum(wetW) > aP - lobD + 1e-6) return { fail: `the wet band beside the ${big.name.toLowerCase()} needs ${r2(sum(wetW))} m along it; ${r2(aP - lobD)} m` };
  let a = lobD; wet.forEach((o, i) => { const w = i === wet.length - 1 && r2(aP - a - wetW[i]) < LEFTOVER ? r2(aP - a) : wetW[i]; R.push(rid(o.id, o.x, 'proom', 'pub', [[r2(a), r2(a + w), bW0, bW1]], { wet: !!o.x.wet })); a = r2(a + w); });
  if (aP - a > 0.01) R.push(room(1, 'fspw', 'Unassigned program floor (no use yet; the band’s remaining length)', 'spare', 'spare', [[a, aP, bW0, bW1]], { block: 'pool' }));
  R.push(room(1, 'cor', 'Public corridor', 'circ', 'pcor', [[lobD, aP, bW1, bC1]], { block: 'pool', corridor: true }));
   
  const GS = greenSide(C, def, hasP, RD), gIds = GS ? GS.ids : [];
  if (GS && GS.hallSouth) return { fail: `the greenhouse at grade: its band end faces ${GS.face}, with the hall storey to its south (E13: never north of a hall storey;  item 4)`, sun: true };
  let rear = F.strip.rooms.filter(t => !/^(P\d|E1)$/.test(t) && hasP(t) && !gIds.includes(t)).map(id => RD(id));
  if (strip) { const sB = r2(W - bC1), it = [], ws = []; let used = 0;
    for (const x of rear.slice()) { const w = wOf(x, sB); if (used + w > aP + 1e-6) break; it.push(x); ws.push(w); used = r2(used + w); rear.shift(); }
    a = 0; it.forEach((x, i) => { const w = i === it.length - 1 && r2(aP - a - ws[i]) < LEFTOVER ? r2(aP - a) : ws[i]; R.push(rid(x.id, x, 'proom', 'pub', [[r2(a), r2(a + w), bC1, W]])); a = r2(a + w); });
    if (it.length && aP - a > 0.01) R.push(room(1, 'fsps', 'Unassigned program floor (no use yet; the band’s remaining length)', 'spare', 'spare', [[a, aP, bC1, W]], { block: 'pool' }));
    if (!it.length) R.push(room(1, 'fsp1', 'Unassigned program floor (no use yet)', 'spare', 'spare', [[0, aP, bC1, W]], { block: 'pool' })); }
   
   
  const plantD = RD(F.behindBig.plant), items0 = (plantD ? [plantD] : []).concat(F.behindBig.chem.filter(hasP).map(id => RD(id))).concat(rear).concat(F.behindWet.rooms.filter(hasP).map(id => RD(id))).concat(F.upper.rooms.filter(hasP).filter(t => !gIds.includes(t)).map(id => RD(id)));
  const items = GS ? (GS.end === 0 ? gIds.map(RD).concat(items0) : items0.concat(gIds.slice().reverse().map(RD))) : items0;    
  let dR = GS ? Math.max(6.0, GS.minW) : 6.0, ws = null; for (; dR <= 25 + 1e-9; dR = r2(dR + 0.5)) { ws = items.map(x => wOf(x, dR)); if (sum(ws) <= W + 1e-6) break; }
  if (sum(ws) > W + 1e-6) return { fail: `the program's rear band needs ${r2(sum(ws))} m across at ${dR} m deep; ${W} m` };
  const a0 = r2(aP + cw), aB = r2(a0 + dR), left = r2(W - sum(ws)); let b = 0;
  const pFirst = !!plantD && items[0] === plantD && ws[0] <= hW + 1e-6;
  items.forEach((x, i) => { const w = i === items.length - 1 && left < LEFTOVER ? r2(ws[i] + left) : ws[i]; R.push(rid(x.id, x, 'proom', x.block === 'gym' ? 'gym' : (x.wet ? 'plant' : 'pub'), [[i === 0 && pFirst ? aP : a0, aB, r2(b), r2(b + w)]], { wet: !!x.wet })); b = r2(b + w); });
  R.push(room(1, 'xcor', 'Public corridor (across, behind the big room)', 'circ', 'pcor', [[aP, r2(aP + cw), pFirst ? r2(ws[0]) : 0, W]], { block: 'pool', corridor: true }));
  if (GS) C.noRoof = [];    
  if (left >= LEFTOVER) R.push(room(1, 'fspr', 'Unassigned program floor (no use yet; the band’s remaining length)', 'spare', 'spare', [[a0, aB, b, W]], { block: 'pool' }));
  const progArea = sum(R.map(x => sum(x.r.map(ra))));
  if (GS) C.noRoof = R.filter(x => x.id === GS.gh.id).flatMap(x => x.r);
  const D = besideDC(C, W, R, aB, progArea);
  if (D.narrowTo && (tries || 0) < 4) return bigRoomBesideDeep(C, D.narrowTo, (tries || 0) + 1);
  if (D.fail) return D;
  const out = Object.assign(D, { kind: 'bigroom', grade: true, deep: true, typology: def.id, aC: lobD, aR: lobD, dF: lobD, clin: 0, hubArea: progArea,
    storeyNames: [`${def.name} (big room along the depth) and the data centre at grade (one storey)`] });
  splitBand(out.rooms[1], BND, 'a', !!C.rowAlt); plantReach(out, def);     out.bandNotes = bandNotes(C, BND, out, GS, null);
  out.spareFilled = spareFill(out, def.id, capOkFor(def, C, out));
  out.Dbig = bigRoomDoorsC(out, def.constraints || []); spareDoorCheck(out);
  { const vm = viaMissing(out, def.constraints); if (vm.length) return { fail: `${vm.join(', ').replace(/_/g, ' ')} shares no wall with the room it is entered through ( item 4)` }; }
  return out;
}
function stackedRest(C, B, W, Da, noPlant) {
  const { st, van } = C, cw = RULES.cor.w, SW = RULES.stair.w, SL = RULES.stair.l, sm = RULES.smallRoom.w;
  const R = B.R.slice(), aB = B.aB, aC = B.aC, aR = B.aR, dF = B.dF;
   
  const hubArea = sum(R.filter(x => x.block === 'hub' && !x.core).map(x => sum(x.r.map(ra))));
   
  const R2 = []; let clin = 0, clinWhy = null, hubSpareDC = false;
  const dcFrontD = RULES.dcFront.d;
  if (st.exams > 0) {
    const fI = [];
    for (let i = 1; i <= st.exams; i++) fI.push({ id: 'ex' + i, n: 'Exam room ' + i, w: PRG.exam.w, m2: PRG.exam.m2, p: 'exam' });
    fI.push({ id: 'proc', n: 'Procedure room', w: PRG.proc.w, m2: PRG.proc.m2, p: 'proc' }, { id: 'wait', n: 'Clinic waiting, reception', w: PRG.wait.w, grow: true, p: 'wait' },
      { id: 'coff', n: 'Clinic office', w: PRG.coff.w, p: 'coff' }, { id: 'cstf', n: 'Clinic staff lounge, lockers', w: PRG.cstf.w, p: 'cstf' }, { id: 'cst', n: 'Clinic storage', w: PRG.cst.w, p: 'cst' });
     
    const dNeed = Math.max(3.0, ...fI.filter(x => x.m2 && x.w).map(x => up1(x.m2 / Math.max(0.5, x.w) + WALLD))), dFc = !C.S.hubTyp && dNeed < dF - 0.5 ? r2(dNeed) : dF;
    const pf = pack(fI, W, dFc);
    if (pf.fail) return { fail: `clinic front row needs ${pf.fail} m for ${st.exams} exam rooms ${PRG.exam.w} m wide (spec width); ${W} m available` };
     
    let nwc = 1, bI, pb;
    for (let it = 0; it < 3; it++) {
      bI = [{ id: 'p2', fix: SW }, { id: 'e1', fix: RULES.e1.w }, { id: 'cons', n: 'Consult room', w: PRG.cons.w, m2: PRG.cons.m2, p: 'cons' }, { id: 'med', n: 'Medication room', w: PRG.med.w, m2: PRG.med.m2, p: 'med' },
        { id: 'cln', n: 'Clean supply', w: PRG.cln.w, m2: PRG.cln.m2, p: 'cln' }, { id: 'soil', n: 'Soiled holding', w: PRG.soil.w, m2: PRG.soil.m2, p: 'soil' }, { id: 'hk', n: 'Housekeeping', w: PRG.hk.w, m2: PRG.hk.m2, p: 'hk' }]
        .concat(Array.from({ length: Math.max(0, 2 * nwc - 1) }, (_, i) => ({ id: 'cwc' + (i + 1), n: 'Clinic WC ' + (i + 1), w: RULES.clinicWC.w, p: 'cwc' })))
        .concat([{ id: 'cuw', n: 'Clinic universal WC', w: PRG.uwc.w, p: 'uwc' }, { id: 'cspare', n: 'Unassigned (no use yet), off the clinic corridor', w: 0, grow: true, spare: true }, { id: 'p1', fix: SW }]);
      pb = pack(bI, W, RULES.rowR.d); if (pb.fail) return { fail: `clinic back row needs ${pb.fail} m; ${W} m available` };
      const est = W * dF + W * cw + sum(bI.map((x, i) => (x.p ? pb.ws[i] : 0))) * RULES.rowR.d;
      const n2 = wcBload(Math.ceil(est / 9.3)); if (n2 === nwc) break; nwc = n2;
    }
    const aBc = B.aB0 != null ? B.aB0 : aB, Fc = place(fI, pf.ws, 0, r2(dF - dFc), dF), Bc = place(bI, pb.ws, 0, aR, aBc);    
    Fc.forEach(x => R2.push(room(2, x.id, x.n, 'clin', 'croom', [x.rr], { block: 'clinic', prog: x.p })));
    R2.push(room(2, 'ccor', 'Clinic corridor', 'clin', 'ccor', [[aC, aR, 0, W]], { block: 'clinic', corridor: true }));
    Bc.forEach(x => { if (x.id === 'p2' || x.id === 'p1') R2.push(room(2, x.id, `Stair ${x.id.toUpperCase()} (clinic)`, 'circ', 'pcore', [x.rr], { block: 'clinic', core: true, stair: true }));
      else if (x.id === 'e1') { R2.push(room(2, 'e1', 'Lift E1 (public)', 'circ', 'pcore', [[aR, r2(aR + RULES.e1.l), x.rr[2], x.rr[3]]], { block: 'clinic', core: true, lift: true })); R2.push(room(2, 'psh', 'Programs shaft', 'circ', 'shaft', [[r2(aR + RULES.e1.l), B.aB0 != null ? B.aB0 : aB, x.rr[2], x.rr[3]]], { block: 'clinic', core: true })); }
      else if (x.rr[3] - x.rr[2] > 0.01) R2.push(room(2, x.id, x.n, x.spare ? 'spare' : 'clin', x.spare ? 'spare' : 'croom', [x.rr], { block: x.spare ? 'spare' : 'clinic', prog: x.p })); });
    clin = sum(R2.filter(x => x.block === 'clinic' && !x.core).map(x => sum(x.r.map(ra))));
    if (clin > 500 && van) clinWhy = 'clinic over 500 m²: one loading space (Parking By-law 5.2.9)';
  } else if (!B.Rr.some(x => x.id === 'e1')) {
     
    hubSpareDC = true;
  } else {
     
    R2.push(room(2, 'ccor', 'Corridor to unassigned floor', 'circ', 'ccor', [[aC, aR, 0, W]], { block: 'spare', corridor: true }));
    R2.push(room(2, 'sparef', 'Unassigned (no use yet)', 'spare', 'spare', [[0, dF, 0, W]], { block: 'spare' }));
    const Rr = B.Rr; Rr.forEach(x => { if (x.id === 'p2' || x.id === 'p1') R2.push(room(2, x.id, `Stair ${x.id.toUpperCase()}`, 'circ', 'pcore', [x.rr], { block: 'spare', core: true, stair: true }));
      else if (x.id === 'e1') { R2.push(room(2, 'e1', 'Lift E1 (public)', 'circ', 'pcore', [[aR, r2(aR + RULES.e1.l), x.rr[2], x.rr[3]]], { block: 'spare', core: true, lift: true })); R2.push(room(2, 'psh', 'Programs shaft', 'circ', 'shaft', [[r2(aR + RULES.e1.l), B.aB0 != null ? B.aB0 : aB, x.rr[2], x.rr[3]]], { block: 'spare', core: true })); } });
    const b0 = r2(B.Rr.find(x => x.id === 'e1').rr[3]), b1 = r2(B.Rr.find(x => x.id === 'p1').rr[2]);
    R2.push(room(2, 'sparer', 'Unassigned (no use yet)', 'spare', 'spare', [[aR, B.aB0 != null ? B.aB0 : aB, b0, b1]], { block: 'spare' }));
  }
   
  const dcGuess = W * (Da - aB) + (W * Da - 2 * SW * SL - RULES.e2.w * RULES.e2.l) + 3 * 20;
  const nDC = van ? bays5_2_5(dcGuess) : 0, nRef = van ? (hubArea < 100 ? 0 : rh517(hubArea / 2800)) : 0, nCl = van ? (clin < 500 ? 0 : clin <= 5000 ? 1 : clin <= 10000 ? 2 : 3) : 0;
  let nb = van ? (st.shared ? Math.max(nDC, nRef) + nCl : nDC + nRef + nCl) : null;
  if (!van) { const tot = hubArea + clin + dcGuess; nb = tot < 2500 ? 0 : tot <= 7500 ? 1 : 2; }
  const bayL = B.bayL, bayW = B.bayW;
  const dItems = [{ id: 's1', fix: SW }].concat(Array.from({ length: nb }, (_, i) => ({ id: 'b' + (i + 1), fix: bayFix(i, nb, bayW) })))
    .concat([{ id: 'dock', w: 2.4, grow: true }, { id: 'e2', fix: RULES.e2.w }, { id: 'ves', fix: RULES.ves.w }, { id: 's2', fix: SW }]);
  const pd = pack(dItems, W, bayL); if (pd.fail) return { fail: `the data-centre entrance row needs ${pd.fail} m (${nb} loading spaces ${bayW} m wide, rule 10); ${W} m available`, nb };
  const Dd = place(dItems, pd.ws, 0, aB, aB);
  const at = id => Dd.find(x => x.id === id).rr;
  const sec = (st_, id, n, kind, rects, o) => room(st_, id, n, kind === 'hall' ? 'hall' : kind === 'bay' ? 'load' : 'sup', kind, rects, Object.assign({ block: 'data centre' }, o || {}));
  const s1 = at('s1'), s2 = at('s2'), e2 = at('e2'), ves = at('ves'), dock = at('dock');
  const S1r = [aB, r2(aB + SL), s1[2], s1[3]], S2r = [aB, r2(aB + SL), s2[2], s2[3]], E2r = [aB, r2(aB + RULES.e2.l), e2[2], e2[3]];
  const VESr = [aB, r2(aB + RULES.ves.l), ves[2], ves[3]], DOCKr = [aB, r2(aB + RULES.dock.l), dock[2], dock[3]];
  R.push(sec(1, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }));
  Dd.filter(x => /^b\d/.test(x.id)).forEach((x, i) => R.push(sec(1, x.id, `Loading space ${i + 1}, ${van ? 'Class B 10.2 × 3.4 m with 1.3 m side clearance (a pair shares one)' : '9.0 × 3.3 m with 1.3 m side clearance (a pair shares one; Vancouver Design Supplement figure used as a stand-in, Edmonton not sourced)'}`, 'bay', [[aB, r2(aB + bayL), x.rr[2], x.rr[3]]])));
  R.push(sec(1, 'dock', 'Dock and lift lobby (entrance)', 'dock', [DOCKr, [r2(aB + RULES.e2.l), r2(aB + RULES.dock.l), e2[2], e2[3]]].filter(r => r[1] - r[0] > 0.01)));
  R.push(sec(1, 'e2', 'Freight lift E2 (passenger-rated)', 'score', [E2r], { core: true, lift: true }));
  R.push(sec(1, 'ves', 'DC staff entrance: vestibule, guard point, portal', 'entry', [VESr]));
  R.push(sec(1, 's2', 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }));
   
  const aS = r2(aB + RULES.e2.l), aS2 = r2(aS + RULES.cor.w), SC = [aS, aS2, s1[3], s2[2]];
  R2.push(sec(2, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }), sec(2, 's2', 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }),
    sec(2, 'e2', 'Freight lift E2', 'score', [E2r], { core: true, lift: true }), sec(2, 'dcor', 'Secure corridor', 'scor', [SC], { corridor: true }));
  const mw = C.mw, q = (W * Da - 2 * SW * SL - RULES.e2.w * RULES.e2.l);
  const MWest = q / HPM();
  const upsM2 = r2(MWest * 3.3 + 1.0 * PRG.ups.w), batM2 = batRoomM2(MWest, dcFrontD)    ;
  const frontL = [{ id: 'ups', n: `UPS room (${Math.ceil(MWest) + 1} modules, N+1)`, w: PRG.ups.w, m2: upsM2 }, { id: 'bat', n: 'Battery room, Li-ion', w: PRG.bat.w, m2: batM2 },
    { id: 'bhv', n: 'Battery room HVAC (separate)', w: PRG.bhv.w }, { id: 'mv', n: 'MV switchgear, main electrical', w: PRG.mv.w }];
  const frontR = [{ id: 'mmr1', n: 'Meet-me room 1', w: PRG.mmr.w }, { id: 'mmr2', n: 'Meet-me room 2', w: PRG.mmr.w }, { id: 'valv', n: 'Sprinkler valve room, cylinders', w: PRG.valv.w },
    { id: 'jan', n: 'Janitor (DC)', w: PRG.jan.w }, { id: 'dwc', n: 'DC staff WC, shower', w: PRG.dwc.w }, { id: 'garb', n: 'Garbage and recycling', w: PRG.garb.w, grow: true }];
   
  const band = B.aB0 != null && B.aB0 < aB - 0.01;    
  const lW = r2(e2[2] - s1[3] - (band ? cw : 0)), rW = r2(s2[2] - e2[3] - (band ? cw : 0)), wOf = x => Math.max(x.w || 0, x.m2 ? up1(x.m2 / dcFrontD) : 0);
  const sides = [{ b0: r2(s1[3] + (band ? cw : 0)), W: lW, it: [] }, { b0: e2[3], W: rW, it: [] }], moved = [];
  frontL.concat(frontR.map(x => Object.assign({}, x, { grow: false }))).forEach(x => { const sd = (!hubSpareDC || band) && sides.find(z => r2(sum(z.it.map(wOf)) + wOf(x)) <= z.W + 1e-6); if (sd) sd.it.push(x); else moved.push(x); });
  if (hubSpareDC) R2.push(room(2, 'sparehub', 'Unassigned (no use yet; clinic dropped), off the secure corridor', 'spare', 'spare', (band ? [[0, r2(B.aB0), 0, W]] : subAll([[0, aS, 0, W]], [S1r, S2r, E2r])), { block: 'spare', dcSide: true }));
  if (!hubSpareDC || band) sides.forEach((sd, k) => { const it = sd.it.concat([{ id: k ? 'fsp2' : 'fspare', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]); const pk = pack(it, sd.W, dcFrontD); if (pk.fail) return; const li = it.length - 1; if (pk.ws[li] < 1.5 && li > 0) { pk.ws[li - 1] = r2(pk.ws[li - 1] + pk.ws[li]); pk.ws[li] = 0; }
    place(it, pk.ws, sd.b0, aB, aS).forEach(x => { if (x.rr[3] - x.rr[2] < 0.01) return; R2.push(x.spare ? room(2, x.id, x.n, 'spare', 'spare', [x.rr], { block: 'spare' }) : sec(2, x.id, x.n, 'sroom', [x.rr], { prog: x.id })); }); });
   
  const dBk = r2(Da - aS2);
  const back = moved.map(x => Object.assign({}, x, { grow: false })).concat([{ id: 'noc', n: 'Security control room / NOC', w: PRG.noc.w }, { id: 'doff', n: 'DC offices', w: PRG.doff.w, m2: PRG.doff.m2 },
    { id: 'brk', n: 'DC break room', w: PRG.brk.w, m2: PRG.brk.m2 }, { id: 'ship', n: 'Shipping, receiving, storage and staging (one room)', w: PRG.ship.w, m2: PRG.ship.m2 },
    { id: 'spare2', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]);
  const bW = r2(s2[2] - s1[3]); let pbk = pack(back, bW, dBk), backUse = back, fold = null;
  if (band) {    
    const aX = r2(aB - cw), dBand = r2(aX - B.aB0), items = back.filter(x => !x.spare).concat([{ id: 'spareb', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]);
    const pB = pack(items, W, dBand); if (pB.fail) return { fail: `storey-2 side band needs ${pB.fail} m at ${dBand} m deep; ${W} m available` };
    place(items, pB.ws, 0, B.aB0, aX).forEach(x => { if (x.rr[3] - x.rr[2] < 0.01) return; R2.push(x.spare ? room(2, x.id, x.n, 'spare', 'spare', [x.rr], { block: 'spare', dcSide: true }) : sec(2, x.id, x.n, 'sroom', [x.rr], { prog: x.id })); });
    const dc = R2.find(x => x.id === 'dcor'); dc.r.push([aX, aB, 0, W], [aB, aS, s1[3], r2(s1[3] + cw)], [aB, aS, r2(s2[2] - cw), s2[2]]);
    backUse = [{ id: 'spare2', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]; pbk = pack(backUse, bW, dBk); moved.length = 0; }
   
  if (pbk.fail) {
     
    const block = R2.filter(x => x.block !== 'data centre' && x.kind !== 'spare').flatMap(x => x.r);
    const dMaxOf = sd => { let lim = 0; for (const r of block) if (r[1] <= aS + 1e-6 && Math.min(r[3], sd.b0 + sd.W) - Math.max(r[2], sd.b0) > 0.01) lim = Math.max(lim, r[1]); return r2(aS - lim); };
     
    const segs = []; sides.forEach(sd => { const cuts = [sd.b0, r2(sd.b0 + sd.W)]; block.forEach(r => { if (r[1] <= aS + 1e-6) [r[2], r[3]].forEach(v => { if (v > sd.b0 + 0.01 && v < sd.b0 + sd.W - 0.01) cuts.push(r2(v)); }); });
      const cs = [...new Set(cuts)].sort((x, y) => x - y); for (let i = 0; i + 1 < cs.length; i++) if (cs[i + 1] - cs[i] > 0.5) segs.push({ b0: cs[i], W: r2(cs[i + 1] - cs[i]) }); });
    const dMx = segs.map(dMaxOf), fr = frontL.concat(frontR.map(x => Object.assign({}, x, { grow: false }))), base = back.slice(moved.length);
    for (let d = r2(dcFrontD + 0.5); d <= Math.max(dcFrontD, ...dMx) + 1e-6 && !fold; d = r2(d + 0.5)) {
      const dk = dMx.map(m => Math.min(d, m)), sd2 = segs.map((z, k) => Object.assign({}, z, { it: [], d: dk[k] })).sort((x, y) => y.d - x.d), mv = [];
      const wd = (x, dd) => Math.max(x.w || 0, x.m2 ? up1(x.m2 / dd) : 0);
      fr.forEach(x => { const sd = sd2.find(z => z.d >= dcFrontD - 1e-6 && r2(sum(z.it.map(y => wd(y, z.d))) + wd(x, z.d)) <= z.W + 1e-6); if (sd) sd.it.push(x); else mv.push(x); });
      const b2 = mv.map(x => Object.assign({}, x, { grow: false })).concat(base), p2 = pack(b2, bW, dBk);
      if (!p2.fail) fold = { d, sides: sd2, back: b2, pbk: p2 }; }
    if (fold) { pbk = fold.pbk; backUse = fold.back; const put = [];
      for (let i = R2.length - 1; i >= 0; i--) if (/^(fspare|fsp\d+)$/.test(R2[i].id) || (R2[i].kind === 'sroom' && fr.some(x => x.id === R2[i].id))) R2.splice(i, 1);    
      fold.sides.forEach((sd, k) => { const it = sd.it.concat([{ id: k ? 'fsp' + (k + 1) : 'fspare', n: 'Unassigned (no use yet)', w: 0, grow: true, spare: true }]); const pk = pack(it, sd.W, sd.d); if (pk.fail) return;
        const li = it.length - 1; if (pk.ws[li] < 1.5 && li > 0) { pk.ws[li - 1] = r2(pk.ws[li - 1] + pk.ws[li]); pk.ws[li] = 0; }
        place(it, pk.ws, sd.b0, r2(aS - sd.d), aS).forEach(x => { if (x.rr[3] - x.rr[2] < 0.01) return; put.push(x.rr); R2.push(x.spare ? room(2, x.id, x.n, 'spare', 'spare', [x.rr], { block: 'spare' }) : sec(2, x.id, x.n, 'sroom', [x.rr], { prog: x.id })); }); });
      for (let i = R2.length - 1; i >= 0; i--) { const x = R2[i]; if (x.kind !== 'spare' || /^(fspare|fsp\d+)$/.test(x.id)) continue; const rest = subAll(x.r, put).filter(r => (r[1] - r[0]) * (r[3] - r[2]) > 0.5); if (rest.length) x.r = rest; else R2.splice(i, 1); }
      (C.flags || []).push(`Storey 2 re-planned: the back row (${dBk} m deep) could not hold the data-centre rooms, so the rooms either side of the freight lift are up to ${Math.max(...fold.sides.map(z => z.d))} m deep, toward the street over the hub, off the secure corridor (same rooms and minimums; project decision, 13 Nov 2026)`); } }
   
  if (pbk.fail && !RULES.belowMinFails && pbk.fail <= bW + 0.5 + 1e-9) {     const pT = pack(backUse, r2(bW + 0.5), dBk); if (!pT.fail) { const tot = sum(pT.ws), k = bW / tot; pT.ws = pT.ws.map(w => Math.round(w * k * 100) / 100); pbk = pT;
      (C.flags || []).push(`Storey-2 back row tight: its rooms need ${r2(tot)} m and the row is ${bW} m (within 0.5 m, D1: check in design)`); } }
  if (pbk.fail) return { fail: `storey-2 back row needs ${pbk.fail} m at ${dBk} m deep; ${bW} m available` };
  const Bk = place(backUse, pbk.ws, s1[3], aS2, Da);
  const lastK = Bk.map(x => x.rr[3] - x.rr[2] > 0.01).lastIndexOf(true);    
  Bk.forEach((x, i) => { const rects = [x.rr]; if (i === 0) rects.push([r2(aB + SL), Da, 0, s1[3]]); if (i === lastK) rects.push([r2(aB + SL), Da, s2[2], W]);
    const rr = rects.filter(r => r[1] - r[0] > 0.01 && r[3] - r[2] > 0.01); if (x.rr[3] - x.rr[2] < 0.01) return;
    R2.push(x.spare ? room(2, x.id, x.n, 'spare', 'spare', rr, { block: 'spare' }) : sec(2, x.id, x.n, 'sroom', rr, { prog: x.id })); });
  if (!band && !Bk.some(x => !x.spare && x.rr[3] - x.rr[2] > 0.01)) return { fail: 'storey-2 back row empty' };
   
  if (C.wing) { const wc = [[0, dF, 0, W]]; for (let i = R2.length - 1; i >= 0; i--) { R2[i].r = subAll(R2[i].r, wc).filter(r => ra(r) > 0.01); if (!R2[i].r.length) R2.splice(i, 1); } }    
  if (C.wing && B.Up) { B.Up.filter(x => x.rr[3] - x.rr[2] > 0.01).forEach(x => R2.push(x.k === 'pcore' ? room(2, x.id, x.n, 'circ', 'pcore', [x.rr], { block: 'hub', core: true, stair: !!x.stair, lift: !!x.lift })
      : room(2, x.id, x.n, 'pub', 'proom', [x.rr], { block: 'hub', prog: x.id, sky: true, wingRoom: true, wingUp: true })));
    { const fD = `Stacked variant D (pilot, RULES.stackD): ${B.Up.filter(x => x.k !== 'pcore').map(x => x.id.replace(/_/g, ' ')).join(' and ')} on storey 2 of the program side (its roof, nothing above; never over the data hall), reached by public stairs P1, P2 and lift E1; at grade the band holds ${B.F.filter(x => x.k !== 'pcore').map(x => x.id === 'lob' ? 'the lobby' : x.id === 'wfsp' ? 'spare floor' : x.id.replace(/_/g, ' ')).join(', ')}`; if (C.flags && !C.flags.some(f => /^Stacked variant D/.test(f))) C.flags.push(fD); } }
  const cut = [S1r, S2r, E2r].concat(C.wing ? [[0, dF, 0, W]] : []), hallR = subAll([[0, Da, 0, W]], cut);
  const R3 = [sec(3, 'hall', 'Data hall (one storey)', 'hall', hallR), sec(3, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }), sec(3, 's2', 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }), sec(3, 'e2', 'Freight lift E2', 'score', [E2r], { core: true, lift: true })];
  const hall = sum(hallR.map(ra)), MW = hall / HPM();
   
  const dcArea = sum(R.filter(x => x.block === 'data centre' && x.kind !== 'bay').map(x => sum(x.r.map(ra)))) + sum(R2.filter(x => x.block === 'data centre' || (x.block === 'spare' && x.r.length && x.r[0][0] >= aB - 0.01)).map(x => sum(x.r.map(ra)))) + sum(R3.map(x => sum(x.r.map(ra))));
  const rooms = { 1: R, 2: R2, 3: R3 };
  const H = [C.ground, RULES.storeyH.up, RULES.storeyH.hall];
  const truck = { court: [r2(aB + bayL), r2(Math.max(Da, aB + bayL) + RULES.aisle.w), 0, W], covered: Da > aB + bayL + 0.01 ? [r2(aB + bayL), Da, 0, W] : null, why: Da > aB + bayL + 0.01 ? 'bays open to a covered truck court under storeys 2–3 (?: over truck ground, against the 11e building line)' : 'bays under the building, open to a truck court behind it, open to the sky (EH-FREEZE-2026-11-11e building line); 6.1 m aisle (Parking By-law 5.4.1; drawing choice)' };
   
  const covered = subAll([[aB, Math.min(Da, r2(aB + bayL)), 0, W]], R.flatMap(x => x.r)).filter(r => ra(r) >= 0.5).map(r => r.map(r2));
  const plant = noPlant ? null : plantLayout(C, W, Da, MW, rooms);    
  return { rooms, H, hall, MW, dcArea, hubArea, clin, nb, nDC, nRef, nCl, clinWhy, shared: st.shared, truck, covered, plant, aB, aC, aR, dF, kind: 'stacked', storeyNames: ['Hub at grade; data-centre entrance rooms only', 'Clinic over the hub; data-centre support', 'One data-hall storey'] };
}
 
function narrowLot(C) {
  const { st, van } = C, N = RULES.narrow, cw = RULES.cor.w, SW = RULES.stair.w, SL = RULES.stair.l, dS = N.dS, dO = N.dO, dA = N.dA, wcm = RULES.wcMod.w, sm = RULES.smallRoom.w;
  if (st.exams > 0) return { fail: 'narrow lot: the clinic cannot have two separate exits (spec Part 6, as 1330 Glen Dr and 8238 Fraser St)' };
  const drive = !!(C.S.sideDrive), pw = drive ? 0 : RULES.pexit.w, bayL = van ? 10.2 : 9.0, bayW = van ? 3.4 : 3.3;
  const dAx = drive ? dA : SL;    
   
  const svcEdge = drive ? null : C.S.edges.find(e => (e.abuts === 'street' || e.abuts === 'alley') && e.kind !== 'front');
  if (!drive && !svcEdge) return { fail: 'narrow lot with no side drive and no street or lane at the rear or side: the bays cannot be reached' };
  const svcWhy = svcEdge ? `the ${svcEdge.abuts === 'alley' ? 'lane' : 'street'} on the ${svcEdge.kind === 'flank' ? 'side (corner lot)' : svcEdge.kind === 'rear' ? 'rear (through lot)' : 'second street line (front and rear unclear, through lot read)'}` : null;
  const L0 = c => { const sp = C.spanOver(0, c); return sp ? r2(sp[1] - sp[0]) : 0; };
  const len = it => it.fix != null ? it.fix : Math.max(it.w || 0, it.m2 ? up1(it.m2 / (it.d || dS)) : 0);
  const SV = nW => [{ id: 'wcw', n: `WC women (${nW[1]})`, k: 'proom', w: Math.max(sm, r2(nW[1] * wcm)) }, { id: 'wcm', n: `WC men (${nW[0]})`, k: 'proom', w: Math.max(sm, r2(nW[0] * wcm)) },
    { id: 'uwc', n: 'Universal WC', k: 'proom', w: PRG.uwc.w }, { id: 'sho', n: 'Universal shower', k: 'proom', w: PRG.sho.w },
    { id: 'fa', n: 'First aid', k: 'proom', w: PRG.fa.w, m2: PRG.fa.m2 }, { id: 'off', n: 'Staff office (shared)', k: 'proom', w: PRG.off.w, m2: PRG.off.m2 },
    { id: 'cot', n: 'Cot and supply storage', k: 'proom', w: sm }, { id: 'pmec', n: 'Programs mechanical, emergency panel', k: 'plant', w: PRG.pmec.w }];
  const OVF = ['pmec', 'cot', 'off', 'fa'];
  const plan = (W, moveN) => {
    const Wr = r2(W - cw - dS), Wd = r2(W - pw);
    if (Wr < SW + PRG.refuge.w) return { fail: `refuge strip ${Wr} m wide beside stair S1 needs ${r2(SW + PRG.refuge.w)} m (lot ${W} m wide)` };
    const rowW = drive ? SL + RULES.e2.l : SW + RULES.e2.w + 2.4; if (Wd < rowW) return { fail: `data-centre entrance row needs ${r2(rowW + pw)} m across; ${W} m available` };
    const lobD = Math.max(4.0, up1(RULES.lobby.m2 / (cw + dS))), shL = st.shelter ? Math.max(PRG.shelter.w, up1(PRG.shelter.m2 / Wr)) : 0;
    const ovf = OVF.slice(0, moveN);
    const areaRS = PRG.refuge.m2 + (st.shelter ? PRG.shelter.m2 : 0), pA0 = pk => r2(sum(pk.map(len)) * dO); let aE = 0, svc, pocket, load;
    for (let it = 0; it < 8; it++) {
      load = Math.ceil(areaRS / 0.75); const nW = wcA(Math.ceil(load / 2));
      svc = SV(nW).filter(x => !ovf.includes(x.id)); pocket = SV(nW).filter(x => ovf.includes(x.id)).map(x => Object.assign({}, x, { d: dO }));
      const svcLen = r2(sum(svc.map(len)) + N.pl), pL = r2(sum(pocket.map(len))), pA = pL * dO;
      const aE2 = up1(Math.max(lobD + svcLen, (PRG.refuge.m2 + SW * SL + pA) / Wr + shL, lobD + pL + 1.0 + shL, SL + 1.0 + shL));
      if (Math.abs(aE2 - aE) < 0.05) { aE = aE2; break; } aE = aE2; }
     
    let aRef = up1(Math.max((PRG.refuge.m2 + SW * SL + pA0(pocket)) / Wr, lobD + sum(pocket.map(len)) + 1.0, SL + 1.0));
    if (aE - shL - aRef < 1.5) aRef = r2(aE - shL);
    const refA = r2(Wr * aRef - SW * SL - pA0(pocket));
    return { W, Wr, Wd, lobD, shL, ovf, svc, pocket, aE, aRef, refA, load, areaRS: r2(refA + (st.shelter ? shL * Wr : 0)) };
  };
   
  const nbOf = (P, Dend) => { const hub = P.areaRS + (P.W - P.Wr) * P.aE; const dc = 2 * P.W * P.aE + 2 * P.W * (Dend - P.aE);
    const nDC = van ? bays5_2_5(dc) : 0, nRef = van ? (hub < 100 ? 0 : rh517(hub / 2800)) : 0; if (!van) return { nb: hub + dc < 2500 ? 0 : hub + dc <= 7500 ? 1 : 2, nDC, nRef };
    return { nb: st.shared ? Math.max(nDC, nRef) : nDC + nRef, nDC, nRef }; };
  const depthOf = (P, nb) => r2(P.aE + dAx + (drive ? bayRun(nb, bayW) : bayL));
  let W = L0(Math.min(40, C.aMax)), P = null, nbr = null, Dend = null, why = null;
  for (let pass = 0; pass < 2; pass++) {
    P = null;
    for (let m = 0; m <= OVF.length; m++) { const Q = plan(W, m); if (Q.fail) { why = Q.fail; break; }
      let nb0 = nbOf(Q, Q.aE + dAx + bayL), D = depthOf(Q, nb0.nb); nb0 = nbOf(Q, D); D = depthOf(Q, nb0.nb);
      if (!drive && bayRun(nb0.nb, bayW) > Q.Wd - SW - 1.1) { why = `${nb0.nb} loading spaces ${bayW} m wide need ${bayRun(nb0.nb, bayW)} m across (with their end walls); ${r2(Q.Wd - SW - 1.1)} m left beside stair S2 and a vestibule door`; continue; }
      if (D <= C.aMax + 1e-6) { P = Q; nbr = nb0; Dend = D; break; }
      why = `the narrow hub needs ${D} m of depth (hub ${Q.aE} m, entrance row ${dAx} m, ${nb0.nb} bays); ${C.aMax} m inside the yards`; }
    if (!P) return { fail: why || 'narrow layout does not fit' };
    const W2 = L0(Dend); if (W2 >= W - 0.01) break; W = W2;
  }
  const { Wr, Wd, lobD, shL, aE, svc, pocket } = P, nb = nbr.nb, aR0 = r2(aE + dAx);
  const R = [], R2 = [];
  const hubRoom = (id, n, g, kind, rects, o) => R.push(room(1, id, n, g, kind, rects, Object.assign({ block: 'hub' }, o || {})));
  const sec = (s, id, n, kind, rects, o) => room(s, id, n, kind === 'hall' ? 'hall' : kind === 'bay' ? 'load' : 'sup', kind, rects, Object.assign({ block: 'data centre' }, o || {}));
   
  const S1r = [0, SL, 0, SW];
  let a = lobD; const pocketR = [lobD, r2(lobD + sum(pocket.map(len))), r2(Wr - dO), Wr];
  pocket.forEach(x => { const l = len(x); hubRoom(x.id, x.n, x.k === 'plant' ? 'plant' : 'pub', x.k, [[a, r2(a + l), r2(Wr - dO), Wr]], { prog: x.id, ovf: true }); a = r2(a + l); });
  const aEr = P.aRef, aOpen = r2(aEr + shL);
  hubRoom('ref', st.shelter ? 'Refuge main room' : 'Refuge main room, day shelter merged (ladder step 3)', 'pub', 'proom', subAll([[0, aEr, 0, Wr]], [S1r].concat(pocket.length ? [pocketR] : [])).sort((x, y) => x[0] - y[0] || x[2] - y[2]), { prog: 'refuge' });    
  if (st.shelter) hubRoom('shel', 'Warming shelter rest area (day)', 'pub', 'proom', [[aEr, aOpen, 0, Wr]], { prog: 'shelter' });
  const openR = aE - aOpen > 0.01 ? [aOpen, aE, 0, Wr] : null;    
  hubRoom('lob', 'Shared lobby', 'circ', 'lobby', [[0, lobD, Wr, P.W]], { prog: 'lobby' });
  const passR = drive ? [[r2(aE - N.pl), aE, r2(Wr + cw), P.W]] : [[r2(aE - N.pl), aE, r2(Wr + cw), P.W], [aE, r2(Dend), Wd, P.W]];
   
  a = lobD; const sEnd = r2(aE - N.pl);
  svc.forEach((x, i) => { let l = len(x); if (i === svc.length - 1) { const left = r2(sEnd - a - l); if (left > 0 && left < 1.5) l = r2(l + left); } hubRoom(x.id, x.n, x.k === 'plant' ? 'plant' : 'pub', x.k, [[a, r2(a + l), r2(Wr + cw), P.W]], { prog: x.id }); a = r2(a + l); });
  if (sEnd - a >= 1.5 - 1e-6) hubRoom('sspare', 'Unassigned (no use yet), off the public corridor', 'spare', 'spare', [[a, sEnd, r2(Wr + cw), P.W]]);
  R.push(room(1, 'cor', 'Public corridor', 'circ', 'pcor', [[lobD, aE, Wr, r2(Wr + cw)]], { block: 'hub', corridor: true }));
  R.push(room(1, 'pas', drive ? 'Exit passage to the side drive (corridor far end)' : 'Exit passage (2 h) along the lot line to the truck court', 'circ', 'exitpas', passR, { block: 'hub' }));
  R.push(sec(1, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }));
   
   
   
  const Wb0 = drive ? r2(P.W - SL - RULES.e2.l) : 0;
  const vB = drive ? [r2(Wb0 + RULES.e2.l), P.W] : [r2(Wd - SW - RULES.e2.w), r2(Wd - SW)], eB1 = vB[0];
  const S2r = drive ? [aE, r2(aE + SW), vB[0], P.W] : [aE, r2(aE + SL), r2(Wd - SW), Wd];
  const E2r = drive ? [aE, r2(aE + SW), Wb0, vB[0]] : [aE, r2(aE + RULES.e2.l), vB[0], vB[1]];
  const stub = null;
  const VESr = drive ? [r2(aE + SW), aR0, vB[0], vB[1]] : [r2(aE + RULES.e2.l), aR0, vB[0], vB[1]];
  R.push(sec(1, 'dock', 'Dock and lift lobby (entrance)', 'dock', drive ? [[r2(aE + SW), aR0, Wb0, vB[0]]] : subAll([[aE, aR0, 0, eB1]], [E2r])));
  R.push(sec(1, 'e2', 'Freight lift E2 (passenger-rated)', 'score', [E2r], { core: true, lift: true }));
  R.push(sec(1, 'ves', 'DC staff entrance: vestibule, guard point, portal', 'entry', [VESr]));
  R.push(sec(1, 's2', drive ? 'Stair S2 (data centre), turned across' : 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }));
  const BB = drive ? [aR0, r2(aR0 + bayRun(nb, bayW)), r2(P.W - bayL), P.W] : [aR0, r2(aR0 + bayL), 0, bayRun(nb, bayW)];
  for (let i = 0; i < nb; i++) R.push(sec(1, 'b' + (i + 1), `Loading space ${i + 1}, ${van ? 'Class B 10.2 × 3.4 m with 1.3 m side clearance (a pair shares one)' : '9.0 × 3.3 m with 1.3 m side clearance (a pair shares one; Vancouver Design Supplement figure used as a stand-in, Edmonton not sourced)'}`, 'bay',
    [drive ? [r2(aR0 + bayOff(i, nb, bayW)), r2(aR0 + bayOff(i + 1, nb, bayW)), BB[2], BB[3]] : [aR0, BB[1], bayOff(i, nb, bayW), bayOff(i + 1, nb, bayW)]]));
   
  const xL = Math.min(Wr, r2(E2r[3] - 1.2));
  R2.push(sec(2, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }), sec(2, 's2', 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }),
    sec(2, 'e2', 'Freight lift E2', 'score', [E2r], { core: true, lift: true }),
    sec(2, 'dcor', 'Secure corridor', 'scor', [[0, aE, Wr, r2(Wr + cw)], [0, cw, SW, Wr], [r2(aE - cw), aE, xL, Wr], [r2(aE - cw), aE, r2(Wr + cw), P.W]].concat(stub ? [stub] : []).filter(r => r[1] - r[0] > 0.01 && r[3] - r[2] > 0.01), { corridor: true }));
  const hallR0 = subAll([[0, aE, 0, P.W]], [S1r]).concat(stub ? [stub] : []), MWest = sum(hallR0.map(ra)) / HPM();
  const upsM2 = r2(MWest * 3.3 + 1.0 * PRG.ups.w), batM2 = batRoomM2(MWest)    ;
  const sideL = [{ id: 'ups', n: `UPS room (${Math.ceil(MWest) + 1} modules, N+1)`, w: PRG.ups.w, m2: upsM2 }, { id: 'bat', n: 'Battery room, Li-ion', w: PRG.bat.w, m2: batM2 },
    { id: 'bhv', n: 'Battery room HVAC (separate)', w: PRG.bhv.w }, { id: 'mv', n: 'MV switchgear, main electrical', w: PRG.mv.w }, { id: 'mmr1', n: 'Meet-me room 1', w: PRG.mmr.w }, { id: 'mmr2', n: 'Meet-me room 2', w: PRG.mmr.w },
    { id: 'valv', n: 'Sprinkler valve room, cylinders', w: PRG.valv.w }, { id: 'jan', n: 'Janitor (DC)', w: PRG.jan.w }, { id: 'dwc', n: 'DC staff WC, shower', w: PRG.dwc.w }, { id: 'garb', n: 'Garbage and recycling', w: PRG.garb.w }];
  const bandL = r2(aE - cw), sD = r2(P.W - Wr - cw), inBand = [], toSide = [];
  sideL.forEach(x => { const l = Math.max(x.w, x.m2 ? up1(x.m2 / sD) : 0); if (r2(sum(inBand.map(y => y.l)) + l) <= bandL + 1e-6) inBand.push(Object.assign({}, x, { l })); else toSide.push(x); });
  a = 0; inBand.forEach(x => { R2.push(sec(2, x.id, x.n, 'sroom', [[a, r2(a + x.l), r2(Wr + cw), P.W]], { prog: x.id })); a = r2(a + x.l); });
  if (bandL - a > 0.01) { if (bandL - a < 1.5 && inBand.length) { const lr = R2[R2.length - 1]; lr.r[0][1] = bandL; } else R2.push(room(2, 'fsp2', 'Unassigned (no use yet)', 'spare', 'spare', [[a, bandL, r2(Wr + cw), P.W]], { block: 'spare', dcSide: true })); }
   
  const sideI = toSide.concat([{ id: 'noc', n: 'Security control room / NOC', w: PRG.noc.w }, { id: 'doff', n: 'DC offices (reference size)', w: PRG.doff.w, m2: PRG.doff.m2 },
    { id: 'brk', n: 'DC break room', w: PRG.brk.w, m2: PRG.brk.m2 }]);
  const dR2 = 3.0, rowL = r2(aE - 2 * cw);    
  let ps = pack(sideI.concat([{ id: 'sp', w: 0, grow: true, spare: true }]), rowL, dR2), sideIt = sideI;
  if (ps.fail) { sideIt = sideI.map(x => Object.assign({}, x, { m2: null })); ps = pack(sideIt.concat([{ id: 'sp', w: 0, grow: true, spare: true }]), rowL, dR2); }
  if (ps.fail) return { fail: `storey-2 support rooms need ${ps.fail} m along the secure corridor; ${rowL} m available` };
  const Sd = place(sideIt.concat([{ id: 'srow', n: 'Unassigned (no use yet), off the secure corridor', w: 0, grow: true, spare: true }]), ps.ws, cw, r2(Wr - dR2), Wr)
    .map(x => Object.assign(x, { rr: [x.rr[2], x.rr[3], x.rr[0], x.rr[1]] }));    
  Sd.filter(x => x.rr[1] - x.rr[0] > 0.01).forEach(x => R2.push(x.spare ? room(2, x.id, x.n, 'spare', 'spare', [x.rr], { block: 'spare', dcSide: true }) : sec(2, x.id, x.n, 'sroom', [x.rr], { prog: x.id })));
  R2.push(room(2, 'sparehub', 'Unassigned (no use yet; no clinic), off the secure corridor', 'spare', 'spare',
    subAll([[cw, aE, 0, Wr]], [S1r, [cw, r2(aE - cw), r2(Wr - dR2), Wr], [r2(aE - cw), aE, xL, Wr]]).sort((x, y) => x[0] - y[0] || x[2] - y[2]), { block: 'spare', dcSide: true }));
   
  if (drive) R2.push(sec(2, 'ship', 'Shipping, receiving, storage and staging (over the entrance row and bays)', 'sroom', [[r2(aE + SW), aR0, Wb0, P.W], BB], { prog: 'ship' }));
  else { R2.push(sec(2, 'ship', 'Shipping and receiving', 'sroom', [[aE, aR0, 0, E2r[2]], BB], { prog: 'ship' }),
    sec(2, 'stag', 'Storage and staging', 'sroom', [VESr], { prog: 'ship' })); }
   
  const R3 = [sec(3, 'hall', 'Data hall (one storey, over the hub)', 'hall', hallR0), sec(3, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }),
    sec(3, 's2', 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }), sec(3, 'e2', 'Freight lift E2', 'score', [E2r], { core: true, lift: true })];
  const hall = sum(hallR0.map(ra)), MW = hall / HPM();
  const rooms = { 1: R, 2: R2, 3: R3 };
  const hubArea = sum(R.filter(x => x.block === 'hub' && !x.core && x.kind !== 'exitpas').map(x => sum(x.r.map(ra))));
  const dcArea = sum(R.filter(x => x.block === 'data centre' && x.kind !== 'bay').map(x => sum(x.r.map(ra)))) + sum(R2.filter(x => x.block === 'data centre' || x.dcSide).map(x => sum(x.r.map(ra)))) + sum(R3.map(x => sum(x.r.map(ra))));
  const H = [C.ground, RULES.storeyH.up, RULES.storeyH.hall];
  const spD = C.spanOver(0, Dend); if (!spD) return { fail: 'no width over the building depth' }; const bOrigin = C.sv < 0 ? spD[1] : spD[0];
  C.mapUV = (aa, b) => [C.uOf(C.a0 + aa), bOrigin + C.sv * b];
  const court = drive ? null : [BB[1], r2(BB[1] + RULES.aisle.w), 0, P.W];
  const truck = drive ? { court: BB, why: 'bays across the lot, open to the 6.1 m side drive (Parking By-law 5.4.1 aisle; drawing choice)' }
    : { court, why: `bays open to a 6.1 m truck court behind the building, reached from ${svcWhy} (drawing choice); route and turning not checked (?)` };
  const keeps = (drive ? [[0, aE, 0, P.W], [aE, aR0, Wb0, P.W]] : [[0, aR0, 0, P.W]]).concat([BB]).concat(court ? [court] : []).concat(drive ? [] : [[aR0, BB[1], Wd, P.W]]);
  const roofs = drive ? [[aE, BB[1], r2(P.W - bayL), P.W]] : [BB, [aE, aR0, 0, E2r[2]]];
  const plant = plantLayout(Object.assign({}, C, { keeps, lowRoof: { rs: roofs, z: r2(C.ground + RULES.storeyH.up), what: 'on the storey-2 roof at the rear' } }), P.W, Dend, MW, rooms);
  const L = { rooms, H, hall, MW, dcArea, hubArea, clin: 0, nb, nDC: nbr.nDC, nRef: nbr.nRef, nCl: 0, clinWhy: null, shared: st.shared, truck, plant, aB: aE, aC: lobD, aR: aE, dF: aE,
    kind: 'stacked', narrow: { drive, svcWhy, Wr, aE, aR0, vesT: drive ? 0.5 : r2(((Math.max(vB[0], BB[3]) + vB[1]) / 2 - vB[0]) / (vB[1] - vB[0])), overflow: P.ovf, load: P.load, refuge: P.refA, open: openR, openM2: openR ? r2(ra(openR)) : 0 }, covered: openR ? [openR.map(r2)] : []    , W: P.W, Da: Dend, bOrigin,
    storeyNames: ['Hub at grade, bands back from the street; data-centre entrance rooms at the rear', 'Data-centre support over the hub; unassigned floor', 'One data-hall storey over the hub'] };
  return L;
}
 
 
function plantUp(C) {
  const first = plantUp1(C); if (!first.fail) return first;
  const D0 = Math.floor(C.aMax * 10) / 10, sp0 = C.spanOver(0, D0); if (!sp0) return first; let wPrev = sp0[1] - sp0[0];
  for (let d = r2(D0 - 0.5); d >= D0 - 8 + 1e-6; d = r2(d - 0.5)) { const sp = C.spanOver(0, d); if (!sp || sp[1] - sp[0] < wPrev + 0.05) continue; wPrev = sp[1] - sp[0];
    const L = plantUp1(Object.assign({}, C, { puD: d })); if (!L.fail) { (C.flags || []).push(`Layout (b): the building stops ${r2(D0 - d)} m short of the deepest it could go, where the lot is wide enough for the lane and street rows (${r2(sp[1] - sp[0])} m)`); return L; } }
  return first; }
function plantUp1(C) {
  const { st, van } = C, cw = RULES.cor.w, SW = RULES.stair.w, SL = RULES.stair.l, sm = RULES.smallRoom.w, wcm = RULES.wcMod.w, PU = RULES.pu, pw = PU.pw, HX = HC();
  if (!HX) return { fail: 'the sizing rule (hubchecks) is not loaded' };
  if (st.exams > 0) return { fail: 'no clinic on a small lot (no second separate exit fits, spec Part 6)' };
  const lane = C.S.edges.find(e => (e.abuts === 'alley' || e.abuts === 'street') && e.kind === 'rear');
  if (!lane) return { fail: 'no lane or street at the rear for the bays, stair S2 and the staff entrance' };
   
  let D = C.puD != null ? C.puD : Math.floor(C.aMax * 10) / 10, sp = C.spanOver(0, D); if (!sp) return { fail: 'no width over the lot depth' };
  if (C.puD == null && (!C.S.maxDepth || C.aMax < C.S.maxDepth - 0.05)) for (let d = r2(C.aMax + 0.45); d > C.aMax + 0.01; d = r2(d - 0.05)) { const s2 = C.spanOver(0, d); if (s2 && s2[1] - s2[0] >= sp[1] - sp[0] - 0.02) { D = Math.floor(d * 10) / 10; sp = s2; break; } }
  const W = r2(sp[1] - sp[0]), city = C.S.city === 'edm' ? 'e' : 'v', bayL = van ? 10.2 : 9.0, bayW = van ? 3.4 : 3.3;
  const CH = PU.ch, E2w = RULES.e2.w, E2l = RULES.e2.l, vW = PU.vesW, VESl = RULES.ves.l, pS = PU.pS, coreW = r2(SW + E2w), dSv = PU.dSv;
  const lenOf = (x, d) => x.fix != null ? x.fix : sizedW(x, d);
  const sec = (s_, id, n, kind, rects, o) => room(s_, id, n, kind === 'hall' ? 'hall' : kind === 'bay' ? 'load' : kind === 'spare' ? 'spare' : 'sup', kind, rects.filter(r => r[1] - r[0] > 0.01 && r[3] - r[2] > 0.01), Object.assign({ block: kind === 'spare' ? 'spare' : 'data centre' }, kind === 'spare' ? { dcSide: true } : {}, o || {}));
  const hubRoom = (R, id, n, g, kind, rects, o) => R.push(room(1, id, n, g, kind, rects.filter(r => r[1] - r[0] > 0.01 && r[3] - r[2] > 0.01), Object.assign({ block: 'hub' }, o || {})));
  const areaOf = rs => sum(rs.map(ra));
   
  const packLine = (items, len, d) => { const out = []; let at = 0; for (const x of items) { const l = lenOf(x, d); if (at + l > len + 1e-6) return null; out.push({ x, at: r2(at), l: r2(l) }); at = r2(at + l); } return { out, left: r2(len - at) }; };

  const attempt = (mw, nb, hubKw0) => {
    const Q = mw * 1.55, flags = [];
     
    const tz0 = HX.transformers(Q, hubKw0, city), T = { l: tz0.pad[0], w: tz0.pad[1] }, alcW = r2(T.w + 2.0), alcD = r2(T.l + 1.0), nT = tz0.n;
     
    const dLR = r2(Math.max(nb ? bayL : 0, VESl + PU.dockMin)), aLR = r2(D - dLR);
    const laneNeed = r2(pS + vW + bayRun(nb, bayW));
    if (laneNeed > W + 1e-6) return { fail: `the lane frontage holds stair S2's exit passage (${pS} m), the staff vestibule and dock (${vW} m) and ${nb} loading space${nb === 1 ? '' : 's'} (${bayW} m each) only with ${laneNeed} m; ${W} m available` };
    let kLane = 0; while (kLane < nT && laneNeed + (kLane + 1) * alcW <= W + 1e-6) kLane++;
    const kSt = nT - kLane, alcFst = r2(kSt * alcW);
     
    const dSt = kSt ? alcD : r2(SL - cw);
    const offW = sizedW({ id: 'off', w: PRG.off.w, m2: PRG.off.m2 }, dSt), faW = sizedW({ id: 'fa', w: PRG.fa.w, m2: PRG.fa.m2 }, dSt);
    const room0 = r2(W - 2 * pw - alcFst);    
    if (room0 < PU.lobbyMin - 1e-6) return { fail: `the street front holds the lobby (at least ${PU.lobbyMin} m), ${kSt} transformer alcove${kSt === 1 ? '' : 's'} (${alcW} m each) and two ${pw} m exit passages only with ${r2(PU.lobbyMin + alcFst + 2 * pw)} m; ${W} m available (${kLane} alcove${kLane === 1 ? '' : 's'} fit on the lane)` };
    const ofFront = room0 - offW - faW >= RULES.lobby.ws[RULES.lobby.ws.length - 1] - 1e-6;    
    const wL = r2(room0 - (ofFront ? offW + faW : 0)); let dLob = r2(Math.max(dSt, up1(RULES.lobby.m2 / wL)));
    const bS1 = r2(W - pw - SW), aF = r2(dSt + SL);
    if (aLR - SL < aF + cw + 0.5) return { fail: `the lot is ${D} m deep: the street band and stair S1 (${aF} m), the lane row (${dLR} m) and stair S2 behind it (${SL} m) leave no room for the refuge` };
    const R = [];
    const S1r = [dSt, aF, bS1, r2(bS1 + SW)], S2r = [r2(aLR - SL), aLR, 0, SW];
     
    const nC = Math.ceil(Q / 1.489 - 1e-9) + 1, across = r2(2 * CH.side + nC * CH.w + (nC - 1) * CH.gap) <= W + 1e-6;
    const Lb = r2(CH.end + CH.l), aB = r2(D - Lb), bC = r2(CH.w + CH.side), Lc = r2(2 * CH.end + nC * CH.l + (nC - 1) * CH.endGap);
    if (!across && Lc > D + 1e-6) return { fail: `${nC} chillers fit neither side by side across the roof (${r2(2 * CH.side + nC * CH.w + (nC - 1) * CH.gap)} m; ${W} m) nor end to end along it (${Lc} m; ${D} m)` };
    if (!across && W - bC < coreW - 1e-6) return { fail: `the side chiller band (${bC} m) leaves ${r2(W - bC)} m beside it for stair S2 and lift E2 (${coreW} m)` };
    const aE2 = across && aB < aLR - E2l ? Math.max(aB, r2(aLR - SL)) : r2(aLR - E2l), E2r = [r2(aLR - E2l), aLR, SW, coreW], E2r3 = [aE2, aLR, SW, coreW];    
     
    const bBay0 = r2(pS + vW), spare0 = r2(W - laneNeed - kLane * alcW), stretch = nb ? r2(spare0 / nb) : 0;
    const dockW = nb ? vW : r2(vW + spare0), bW = r2(bayW + stretch);
    R.push(sec(1, 'pas2', `Stair S2's exit passage to the ${lane.abuts === 'alley' ? 'lane' : 'street at the rear'} (2 h)`, 'exitpas', [[aLR, D, 0, pS]], { g: 'sup' }));
    R.push(sec(1, 'ves', 'DC staff entrance: vestibule, guard point, portal (on the lane)', 'entry', [[r2(D - VESl), D, pS, r2(pS + dockW)]]));
    R.push(sec(1, 'dock', 'Loading dock and lift lobby (staging on storey 2)', 'dock', [[aLR, r2(D - VESl), pS, r2(pS + dockW)]]));
    for (let i = 0; i < nb; i++) R.push(sec(1, 'b' + (i + 1), `Loading space ${i + 1}, ${van ? 'Class B 10.2 × 3.4 m with 1.3 m side clearance (a pair shares one)' : '9.0 × 3.3 m with 1.3 m side clearance (a pair shares one; Vancouver Design Supplement figure used as a stand-in, Edmonton not sourced)'}, open to the lane${stretch > 0.01 ? ` (drawn ${bW} m wide to fill the lane frontage)` : ''}`, 'bay', [[aLR, D, r2(bBay0 + bayOff(i, nb, bayW) + i * stretch), r2(bBay0 + bayOff(i + 1, nb, bayW) + (i + 1) * stretch)]]));
    const alcs = [];
    const bA0 = r2(bBay0 + bayRun(nb, bayW) + nb * stretch + (nb ? 0 : spare0));
    for (let i = 0; i < kLane; i++) alcs.push({ lane: true, r: [aLR, D, r2(bA0 + i * alcW), r2(bA0 + (i + 1) * alcW)] });
    for (let i = 0; i < kSt; i++) alcs.push({ lane: false, r: [0, dSt, r2(wL + (ofFront ? offW + faW : 0) + i * alcW), r2(wL + (ofFront ? offW + faW : 0) + (i + 1) * alcW)] });
    alcs.forEach((x, i) => R.push(room(1, 'alc' + (i + 1), `Transformer alcove ${i + 1}, open to the ${x.lane ? (lane.abuts === 'alley' ? 'lane' : 'rear street') : 'street'} (${van ? 'BC Hydro ES54 F3-06' : 'EPCOR rules not read ?'})`, 'plant', 'plant', [x.r], { block: 'plant', alcove: true, face: x.lane ? 'a1' : 'a0' })));
    R.push(sec(1, 's2', 'Stair S2 (data centre), to its exit passage', 'score', [S2r], { core: true, stair: true }));
    R.push(sec(1, 'e2', 'Freight lift E2 (passenger-rated)', 'score', [E2r], { core: true, lift: true }));
     
    hubRoom(R, 'lob', 'Shared lobby', 'circ', 'lobby', [[0, dLob, 0, wL]], { prog: 'lobby' });
    if (ofFront) { hubRoom(R, 'off', 'Staff office (shared)', 'pub', 'proom', [[0, dSt, wL, r2(wL + offW)]], { prog: 'off' }); hubRoom(R, 'fa', 'First aid', 'pub', 'proom', [[0, dSt, r2(wL + offW), r2(wL + offW + faW)]], { prog: 'fa' }); }
    R.push(sec(1, 'pas1', 'Stair S1’s exit passage to the street (2 h)', 'exitpas', [[0, dSt, r2(W - 2 * pw), r2(W - pw)]]));
    R.push(sec(1, 's1', 'Stair S1 (data centre), to its exit passage', 'score', [S1r], { core: true, stair: true }));
    R.push(room(1, 'pas', 'Refuge exit passage to the street (2 h)', 'circ', 'exitpas', [[0, aF, r2(W - pw), W]], { block: 'hub' }));
     
    const pmW = Math.min(PRG.pmec.w, wL), pmL = r2(Math.max(2.0, up1(4.0 / pmW))), offB = ofFront ? 0 : r2(Math.max(PRG.off.w, up1(PRG.off.m2 / PU.dOff)));
     
    let offSide = !ofFront && dLob - dSt >= PU.dOff - 1e-6;
    if (!ofFront && !offSide && Math.max(wL, pmW + offB) > r2(W - pw - SW - 2.0)) { dLob = r2(dSt + PU.dOff); offSide = true; }    
    const aC = r2(dLob + cw), wC = r2(offSide || ofFront ? wL : Math.max(wL, pmW + offB));
    if (wC > r2(W - pw - SW - 2.0)) return { fail: `the public corridor behind the lobby (${wC} m) runs into stair S1` };
    R.push(room(1, 'cor', 'Public corridor (lobby to the refuge, office and programs mechanical)', 'circ', 'pcor', [[dLob, aC, 0, wC]], { block: 'hub', corridor: true }));
    const pmR = [aC, r2(aC + pmL), 0, pmW];
    hubRoom(R, 'pmec', 'Programs mechanical, emergency panel', 'plant', 'plant', [pmR], { prog: 'pmec' });
    const offR = ofFront ? null : offSide ? [dSt, r2(dSt + PU.dOff), wL, r2(wL + offB)] : [aC, r2(aC + PU.dOff), pmW, r2(pmW + offB)];
    if (offR) hubRoom(R, 'off', 'Staff office (shared)', 'pub', 'proom', [offR], { prog: 'off' });
     
    const areaRS = PRG.refuge.m2 + (st.shelter ? PRG.shelter.m2 : 0), load = Math.ceil(areaRS / 0.75), nW = wcA(Math.ceil(load / 2));
    const strip = [{ id: 'wcw', n: `WC women (${nW[1]})`, fix: Math.max(sm, r2(nW[1] * wcm)) }, { id: 'wcm', n: `WC men (${nW[0]})`, fix: Math.max(sm, r2(nW[0] * wcm)) },
      { id: 'uwc', n: 'Universal WC', fix: r2(3.2 + WALLX) }, { id: 'sho', n: 'Universal shower', w: PRG.sho.w, m2: PRG.sho.m2 }, { id: 'cot', n: 'Cot and supply storage', fix: sm }]
      .concat(ofFront ? [] : [{ id: 'fa', n: 'First aid', w: PRG.fa.w, m2: PRG.fa.m2 }]);    
     
    const rearLen = r2(W - coreW), nearA0 = r2(Math.max(pmR[1], offR && !offSide ? offR[1] : 0)), nearLen = r2(aLR - SL - nearA0), rects = [];
    let i0 = 0; { let at = 0; for (; i0 < strip.length; i0++) { const l = lenOf(strip[i0], dSv); if (at + l > rearLen + 1e-6) break; rects.push({ x: strip[i0], r: [r2(aLR - dSv), aLR, r2(coreW + at), r2(coreW + at + l)] }); at = r2(at + l); }
      if (rects.length && rearLen - at > 0.01 && rearLen - at < 2.4) rects[rects.length - 1].r[3] = W; }    
     
    const farA1 = r2(aLR - dSv), farLen = r2(farA1 - (aF + PU.gapF)); let i1 = i0;
    { let at = 0; for (; i1 < strip.length; i1++) { const l = lenOf(strip[i1], dSv); if (at + l > farLen + 1e-6) break; rects.push({ x: strip[i1], r: [r2(farA1 - at - l), r2(farA1 - at), r2(W - dSv), W] }); at = r2(at + l); } }
    { let at = 0; for (let i = i1; i < strip.length; i++) { const l = lenOf(strip[i], dSv); if (at + l > nearLen + 1e-6) return { fail: `the hub's washrooms and service rooms (${r2(sum(strip.map(x => lenOf(x, dSv))))} m of wall, ${dSv} m deep) do not fit in the runs along the rear (${rearLen} m), the far side (${r2(Math.max(0, farLen))} m) and the near side (${r2(Math.max(0, nearLen))} m)` }; rects.push({ x: strip[i], r: [r2(aLR - SL - at - l), r2(aLR - SL - at), 0, dSv] }); at = r2(at + l); } }
    rects.forEach(q => hubRoom(R, q.x.id, q.x.n, 'pub', 'proom', [q.r], { prog: q.x.id }));
     
    let refR = subAll([[dSt, aLR, 0, W]], [[0, dLob, 0, wL], [dLob, aC, 0, wC], pmR].concat(offR ? [offR] : []).concat([S1r, [0, aF, r2(W - pw), W], S2r, E2r]).concat(rects.map(q => q.r))).sort((x, y) => x[0] - y[0] || x[2] - y[2]);
    const refAll = areaOf(refR), needRef = PRG.refuge.m2 + (st.shelter ? PRG.shelter.m2 : 0);
    if (refAll < needRef - 1e-6) return { fail: `the refuge${st.shelter ? ' and day shelter' : ''} need${st.shelter ? '' : 's'} ${needRef} m²; ${r2(refAll)} m² is left at grade` };
    let shelR = [];
    if (st.shelter) { let cut = aLR; for (let a = aLR; a > dSt; a = r2(a - 0.1)) { const back = areaOf(subAll(refR, [[0, a, 0, W]])); if (back >= PRG.shelter.m2) { cut = a; break; } }
      shelR = subAll(refR, [[0, cut, 0, W]]); refR = subAll(refR, [[cut, D, 0, W]]);
      if (areaOf(refR) < PRG.refuge.m2 - 1e-6) return { fail: `with the day shelter at the rear (${r2(areaOf(shelR))} m²) the refuge has ${r2(areaOf(refR))} m²; ${PRG.refuge.m2} m² needed` }; }
    hubRoom(R, 'ref', st.shelter ? 'Refuge main room' : 'Refuge with the day warming shelter (one room, ladder step 3)', 'pub', 'proom', refR, { prog: 'refuge' });
    if (shelR.length) hubRoom(R, 'shel', 'Warming shelter rest area (day)', 'pub', 'proom', shelR, { prog: 'shelter' });
     
    const people = Math.floor(sum(R.filter(x => x.g === 'pub' && /^(ref|shel)/.test(x.id)).map(x => areaOf(x.r))) / 3.5);
    const hubKw = HX.hubLoad ? HX.hubLoad({ S: { 1: R } }, people).kw : 60, tz = HX.transformers(Q, hubKw, city), hs = C.wing || (C.S && (C.S.typDef || C.S.wingTyp || C.S.hubTyp)) ? null : HX.hubSet(hubKw);    
     
    const R2 = [], legB = r2(bS1 - cw);
    if (aLR + cw > D + 1e-6 || aLR - SL < aF + cw - 1e-6) return { fail: `storey 2: no room for the secure corridor between stairs S1 and S2 (${r2(aLR - SL - aF)} m)` };
    const dcorR = [[dSt, aF, legB, bS1], [aF, r2(aF + cw), 0, W], [r2(aF + cw), aLR, r2(W - cw), W], [aLR, r2(aLR + cw), 0, W]].concat(aLR - SL > aF + cw + 0.3 ? [[r2(aF + cw), r2(aLR - SL), 0, cw]] : []);
     
    const inD = r2(aLR - SL - aF - cw), mid = inD >= 2 * PRG.mmr.w + cw - 1e-6 ? r2(aF + cw + (inD - cw) / 2) : null;
    if (mid != null) dcorR.push([mid, r2(mid + cw), cw, r2(W - cw)]);
    R2.push(sec(2, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }), sec(2, 's2', 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }), sec(2, 'e2', 'Freight lift E2', 'score', [E2r], { core: true, lift: true }));
    R2.push(sec(2, 'dcor', 'Secure corridor (S1, S2 and E2 on it; no dead end over 6 m)', 'scor', dcorR, { corridor: true }));
     
    const regs = { rear: aLR + cw < D - 0.3 ? [r2(aLR + cw), D, 0, W] : null, side: [r2(aLR - SL), aLR, coreW, r2(W - cw)], inner: aLR - SL > aF + cw + 0.3 && mid == null ? [r2(aF + cw), r2(aLR - SL), cw, r2(W - cw)] : null,
      inner1: mid != null ? [r2(aF + cw), mid, cw, r2(W - cw)] : null, inner2: mid != null ? [r2(mid + cw), r2(aLR - SL), cw, r2(W - cw)] : null, front: [dSt, aF, 0, legB] };
    const REG = ['rear', 'side', 'inner', 'inner1', 'inner2', 'front'];
    const gz0 = HX.gens(Q, 0); let gz = null, gRoom = null, gLay = null;
    const gridFits = (g, reg) => { if (!reg) return null; const [gl, gw] = g.footprint, L0 = reg[1] - reg[0], W0 = reg[3] - reg[2]; let best = null;
      for (const rot of [false, true]) for (let c = 1; c <= g.n; c++) { const r_ = Math.ceil(g.n / c), la = rot ? gw : gl, lb = rot ? gl : gw, Wg = r2(c * lb + (c - 1) * 2.0 + 2.0), Lg = r2(r_ * la + (r_ - 1) * 2.0 + 2.0);
        if (Wg <= W0 + 1e-6 && Lg <= L0 + 1e-6 && (!best || Wg * Lg < best.Wg * best.Lg)) best = { c, r: r_, la, lb, Wg, Lg, rot }; } return best; };
    for (const size of [gz0.kw, 1000, 2000].filter((k, i, A) => k >= gz0.kw && A.indexOf(k) === i)) {
      const g = size === gz0.kw ? gz0 : HX.gens(Q, 0, size); if (!g.footprint) continue;
      for (const k of REG) { const f = gridFits(g, regs[k]); if (f) { gz = g; gLay = Object.assign({ reg: k }, f); break; } } if (gz) break; }
    if (!gz) return { fail: `storey 2: the generator room (${gz0.n} × ${gz0.kw.toLocaleString('en-CA')} kW sets, 2.0 m apart, 1.0 m to the walls) fits none of the floor off the secure corridor (${REG.filter(k => regs[k]).map(k => `${r2(regs[k][1] - regs[k][0])} × ${r2(regs[k][3] - regs[k][2])} m`).join(', ')})` };
    if (gz.kw !== gz0.kw) flags.push(`Generator sets: the rule's ${gz0.n} × ${gz0.kw.toLocaleString('en-CA')} kW sets don't fit the storey-2 generator room; ${gz.n} × ${gz.kw.toLocaleString('en-CA')} kW drawn (the next size up, flagged: spec Part 1c, project decision, 11 Nov)`);
     
    { const g = regs[gLay.reg]; gRoom = [g[0], g[1], g[2], r2(g[2] + gLay.Wg)]; if (g[3] - gRoom[3] < PRG.mv.w + WALLX - 1e-6) gRoom[3] = g[3]; }
    R2.push(sec(2, 'gen', `Generator room, 2 h (VBBL 3.6.2.8): ${gz.n} sets, ${gz.kw.toLocaleString('en-CA')} kW ${gz.model}, sub-base tanks`, 'sroom', [gRoom], { prog: 'gen' }));
    const free = []; REG.forEach(k => { if (regs[k]) subAll([regs[k]], gLay.reg === k ? [gRoom] : []).forEach(r => free.push(r)); });
    const hubRm = hs && hs.kw ? { id: 'hgen', n: `Hub generator room, 2 h: ${hs.model}, own sub-base tank (72 h)`, fix: r2((hs.footprint ? hs.footprint[0] : 2.27) + 2.0), dMin: r2((hs.footprint ? hs.footprint[1] : 1.149) + 2.0) } : null;
    const sideI = (hubRm ? [hubRm] : []).concat([{ id: 'mv', n: 'MV switchgear, main electrical', w: PRG.mv.w }, { id: 'mmr1', n: 'Meet-me room 1', w: PRG.mmr.w }, { id: 'mmr2', n: 'Meet-me room 2', w: PRG.mmr.w },
      { id: 'valv', n: 'Sprinkler valve room, cylinders', w: PRG.valv.w }, { id: 'jan', n: 'Janitor (DC)', w: PRG.jan.w }, { id: 'dwc', n: 'DC staff WC, shower', w: PRG.dwc.w }, { id: 'garb', n: 'Garbage and recycling', w: PRG.garb.w },
      { id: 'noc', n: 'Security control room / NOC', w: PRG.noc.w }, { id: 'doff', n: 'DC offices (reference size)', w: PRG.doff.w, m2: PRG.doff.m2 }, { id: 'brk', n: 'DC break room', w: PRG.brk.w, m2: PRG.brk.m2 }, { id: 'ship', n: 'Shipping, receiving, storage and staging', w: PRG.ship.w, m2: PRG.ship.m2 }]);
    const dMinOf = x => x.dMin || ((x.w || 0) + (progOf(x) && progOf(x).step != null && progOf(x).step <= 4 ? WALLX : 0));
     
    const face = r => dcorR.some(c => (Math.abs(c[1] - r[0]) < 1e-6 || Math.abs(c[0] - r[1]) < 1e-6) && Math.min(c[3], r[3]) - Math.max(c[2], r[2]) >= r[3] - r[2] - 1e-6) ? 'b' : dcorR.some(c => (Math.abs(c[3] - r[2]) < 1e-6 || Math.abs(c[2] - r[3]) < 1e-6) && Math.min(c[1], r[1]) - Math.max(c[0], r[0]) >= r[1] - r[0] - 1e-6) ? 'a' : null;
    const placeAll = items => { const out = [], left = items.slice(), rest = [];
      for (const r of free.filter(r => ra(r) > 1.0)) { const ax = face(r); if (!ax) { rest.push(r); continue; } const len = ax === 'b' ? r[3] - r[2] : r[1] - r[0], d = ax === 'b' ? r[1] - r[0] : r[3] - r[2]; let at = 0, last = null;
        for (let i = 0; i < left.length;) { const x = left[i], l = lenOf(x, d); if (d < dMinOf(x) - 1e-6 || at + l > len + 1e-6) { i++; continue; } last = { x, r: ax === 'b' ? [r[0], r[1], r2(r[2] + at), r2(r[2] + at + l)] : [r2(r[0] + at), r2(r[0] + at + l), r[2], r[3]] }; out.push(last); at = r2(at + l); left.splice(i, 1); }
        const lft = r2(len - at); if (lft > 0.01) { if (lft < 1.4 && last) { if (ax === 'b') last.r[3] = r[3]; else last.r[1] = r[1]; } else rest.push(ax === 'b' ? [r[0], r[1], r2(r[2] + at), r[3]] : [r2(r[0] + at), r[1], r[2], r[3]]); } }
      return { out, left, rest }; };
    let P2 = placeAll(sideI); if (P2.left.length) { const P2b = placeAll(sideI.map(x => Object.assign({}, x, { m2: null }))); if (P2b.left.length < P2.left.length || !P2b.left.length) { P2 = P2b; flags.push('Storey 2 (small lot): the data-centre support rooms are drawn at their minimum widths, not the reference areas (DC offices, break room, shipping) (?)'); } }
    const over3 = P2.left.map(x => Object.assign({}, x, { m2: null }));    
    P2.out.forEach(q => R2.push(sec(2, q.x.id, q.x.n, 'sroom', [q.r], { prog: q.x.id === 'hgen' ? 'hgen' : q.x.id })));
    P2.rest.forEach((r, i) => R2.push(sec(2, 'sp2' + (i + 1), 'Unassigned (no use yet), off the secure corridor', 'spare', [r])));
    R2.push(sec(2, 'sp2f', 'Unassigned (no use yet), over the street band', 'spare', [[0, dSt, 0, r2(bS1 + SW)]]));
     
    { const pc = [r2(aLR - SL), r2(aLR - E2l), SW, coreW];
      if (pc[1] - pc[0] > 0.05) { const host = R2.filter(x => x.id !== 's1' && x.id !== 's2' && x.id !== 'e2').map(x => ({ x, ov: Math.max(0, ...x.r.filter(r => Math.abs(r[1] - pc[0]) < 1e-6).map(r => Math.min(r[3], pc[3]) - Math.max(r[2], pc[2]))) })).sort((p, q) => q.ov - p.ov)[0];
        if (host && host.ov >= 1.0 - 1e-6) host.x.r.push(pc); else R2.push(sec(2, 'sp2e', 'Unassigned (no use yet), in front of lift E2', 'spare', [pc])); } }
    { const sl = [0, aF, r2(bS1 + SW), W]; if (sl[3] - sl[2] > 0.3) R2.push(sec(2, 'sp2s', 'Unassigned (no use yet), beside stair S1', 'spare', [sl])); }
     
    const R3 = [sec(3, 's1', 'Stair S1 (data centre)', 'score', [S1r], { core: true, stair: true }), sec(3, 's2', 'Stair S2 (data centre)', 'score', [S2r], { core: true, stair: true }), sec(3, 'e2', 'Freight lift E2', 'score', [E2r], { core: true, lift: true })];
    const upsM2 = r2(mw * 3.3 + 1.0 * PRG.ups.w);
    const sup3 = [{ id: 'ups', n: `UPS room (${Math.ceil(mw) + 1} modules, N+1)`, w: PRG.ups.w, m2: upsM2 }, { id: 'bat', n: 'Battery room, Li-ion', w: PRG.bat.w, m2: null, bat: true }, { id: 'bhv', n: 'Battery room HVAC (separate)', fix: r2(PRG.bhv.w + WALLX) }].concat(over3);
    let band, chillers = [], rowA = [], sc3 = null, rest3 = [];
    if (across) {
      band = [aB, D, 0, W];
       
      const sEnd = r2(Math.min(W, SW + PU.dead3));    
      if (aLR + cw <= D - 0.3) sc3 = [aLR, r2(aLR + cw), 0, sEnd];
      const slots = [];
      if (aLR - aB >= 2.4 - 1e-6) slots.push({ r: [aB, aLR, coreW, W], to: sc3 ? 'scor' : 'hall', tail: true, startMax: sc3 ? r2(sEnd - 1.0 - coreW) : 1e9 });
      if (sc3) slots.push({ r: [r2(aLR + cw), D, 0, sEnd], to: 'scor' });
      let left = sup3.slice();
      for (const sl of slots) { const r = sl.r, d = r2(r[1] - r[0]), len = r2(r[3] - r[2]); let at = 0;
        while (left.length) { const x = left[0].bat ? Object.assign({}, left[0], { m2: batRoomM2(mw, d) }) : left[0], l = lenOf(x, d); if (at + l > len + 1e-6 || (sl.startMax != null && at > sl.startMax + 1e-6)) break; rowA.push({ x, r: [r[0], r[1], r2(r[2] + at), r2(r[2] + at + l)], to: sl.to }); at = r2(at + l); left.shift(); }
         
        if (sl.tail) { const lastQ = rowA.filter(q => q.r[0] === r[0] && Math.abs(q.r[1] - r[1]) < 1e-6).slice(-1)[0]; if (lastQ) lastQ.r[3] = W; else rest3.push({ r: [r[0], r[1], r[2], W], to: 'hall' }); }
        else if (len - at > 0.3) { const lastQ = rowA.filter(q => q.r[0] === r[0] && Math.abs(q.r[1] - r[1]) < 1e-6).slice(-1)[0]; if (len - at < 1.4 && lastQ) lastQ.r[3] = r[3]; else rest3.push({ r: [r[0], r[1], r2(r[2] + at), r[3]], to: sl.to }); } }
      if (over3.length) flags.push(`Storey 3 (small lot): ${over3.map(x => x.n.replace(/ \(reference size\)/, '')).join(', ')} moved up to the chiller band (no room on storey 2), at minimum widths (?)`);
      if (left.length) return { fail: `the chiller band holds the storey-3 rooms only partly (${left.map(x => x.n).join(', ')} left; ${slots.map(sl => `${r2(sl.r[3] - sl.r[2])} m ${r2(sl.r[1] - sl.r[0])} m deep`).join(', ')})` };
      if (sc3 && W - sEnd > 0.3) rest3.push({ r: [aLR, D, sEnd, W], to: 'scor' });
      for (let i = 0; i < nC; i++) { const b0 = r2(CH.side + i * (CH.w + CH.gap)), r = [r2(D - CH.end - CH.l), r2(D - CH.end), b0, r2(b0 + CH.w)]; chillers.push({ r, z: [r2(r[0] - CH.end), D, r2(r[2] - CH.side), r2(r[3] + CH.side)] }); }
    } else {
       
      band = [r2(D - Lc), D, r2(W - bC), W];
      const cuts = [S1r].filter(c => c[2] < band[3] && c[3] > band[2]), spans = subAll([band], cuts).filter(r => r[3] - r[2] >= bC - 1e-6).sort((x, y) => y[0] - x[0]);
      let left = sup3.map(x => x.bat ? Object.assign({}, x, { m2: batRoomM2(mw, bC) }) : x);
      for (const sp_ of spans) { let at = sp_[1]; while (left.length) { const l = lenOf(left[0], bC); if (at - l < sp_[0] - 1e-6) break; rowA.push({ x: left[0], r: [r2(at - l), r2(at), band[2], W], to: 'hall' }); at = r2(at - l); left.shift(); } if (at - sp_[0] > 0.3) rest3.push({ r: [sp_[0], at, band[2], W], to: 'hall' }); }
      if (left.length) return { fail: `the side chiller band (${bC} m wide) holds the storey-3 rooms only partly (${left.map(x => x.n).join(', ')} left)` };
      for (let i = 0; i < nC; i++) { const a1 = r2(D - CH.end - i * (CH.l + CH.endGap)), r = [r2(a1 - CH.l), a1, r2(W - CH.side - CH.w), r2(W - CH.side)]; chillers.push({ r, z: [r2(r[0] - CH.end), r2(r[1] + CH.end), r2(r[2] - CH.side), W] }); }
    }
    rowA.forEach(q => R3.push(sec(3, q.x.id, q.x.n, 'sroom', [q.r], { prog: q.x.id === 'hgen' ? 'hgen' : q.x.id, opens: q.to, hallToo: q.r[0] === aB })));
    if (sc3) R3.push(sec(3, 'scor', 'Secure corridor (storey 3: S2 and E2 to the band’s rooms)', 'scor', [sc3], { corridor: true }));
    rest3.forEach((q, i) => R3.push(q.to === 'scor' ? sec(3, 'sp3' + (i ? i + 1 : ''), 'Unassigned data-centre floor (no use yet; chillers on its roof; off the storey-3 secure corridor)', 'spare', [q.r], { opens: 'scor' })
      : sec(3, 'ds3' + (i ? i + 1 : ''), 'Data-centre storage (under the chiller band, off the hall)', 'sroom', [q.r], { opens: 'hall' })));
     
    const overA = alcs.filter(x => !x.lane).map(x => [0, dSt, x.r[2], x.r[3]]);
    if (E2r3[0] < E2r[0] - 0.05) R3.push(sec(3, 'e2l', 'Freight lift E2 landing (to the hall)', 'scor', [[E2r3[0], E2r[0], E2r3[2], E2r3[3]]]));    
    const hallR = subAll([[0, D, 0, W]], [band, S1r, S2r, E2r3].concat(overA)).filter(r => ra(r) > 0.05).sort((x, y) => x[0] - y[0] || x[2] - y[2]);
    R3.push(sec(3, 'hall', 'Data hall (one storey)', 'hall', hallR));
    const hall = areaOf(hallR), MW = hall / HPM();
     
    const items = [];
    alcs.forEach((x, i) => { const r = x.r, b0 = r2(r[2] + 1.0), pr = x.lane ? [r2(D - T.l), D, b0, r2(b0 + T.w)] : [0, T.l, b0, r2(b0 + T.w)];
      items.push({ id: 't' + (i + 1), n: `Transformer pad ${i + 1}, ${tz.kva.toLocaleString('en-CA')} kVA (${tz.pad_src}), in alcove ${i + 1}`, kind: 'pad', r: pr, z: pr, keep: pr, front: `faces the ${x.lane ? 'lane' : 'street'}` }); });
    for (let i = 0; i < gz.n; i++) { const ci = i % gLay.c, ri = Math.floor(i / gLay.c), a0 = r2(gRoom[0] + 1.0 + ri * (gLay.la + 2.0)), b0 = r2(gRoom[2] + 1.0 + ci * (gLay.lb + 2.0)), r = [a0, r2(a0 + gLay.la), b0, r2(b0 + gLay.lb)];
      items.push({ id: 'g' + (i + 1), n: `Generator ${i + 1}, ${gz.kw.toLocaleString('en-CA')} kW ${gz.model}, sub-base tank (storey-2 generator room)`, kind: 'gen', roof: true, up: 2, r, z: r, keep: r }); }
    const hR = R2.find(x => x.id === 'hgen') || R3.find(x => x.id === 'hgen'); let hubSetOut = null;
    if (hR && hs) { const f = hs.footprint || [2.27, 1.149], q = hR.r[0], r = [r2(q[0] + 1), r2(q[0] + 1 + Math.min(f[0], f[1])), r2(q[2] + 1), r2(q[2] + 1 + Math.max(f[0], f[1]))]; items.push({ id: 'h1', n: `Hub generator, ${hs.model} (${hs.kw} kW standby), in its own 2 h room on storey ${hR.st}`, kind: 'gen', hub: true, roof: true, up: hR.st, r, z: r, keep: r }); }
    else if (hs && hs.kw) hubSetOut = 'the hub set’s own room is not drawn (?)';
    chillers.forEach((c, i) => items.push({ id: 'c' + (i + 1), n: `Chiller ${i + 1} (on the storey-3 roof over the chiller band, not over the hall)`, kind: 'chiller', roof: true, r: c.r, z: c.z, keep: c.r, panel: across ? 'end toward the lane' : 'ends along the band' }));
    const plant = { ok: true, why: null, whyAll: null, Q: r2(Q), nG: gz.n, nC, nT, setKW: gz.kw, gen: gz, tx: tz, hubSet: hs, hubKw: r2(hubKw), hubSetOut, tank: Math.round(gz.tank_l), tankLot: null, tankBld: null, items, aisle: null, up: true,
      rules: ['plant up on a small lot (spec Part 6 step 4a, project decision, 9–13 Nov): generators in a 2 h room on storey 2 (VBBL 3.6.2.8), meets code as read; not FM 5-32 (insurer)', 'sets 2.0 m apart, 1.0 m to the room walls (spec rule 9, our reading)',
        `transformer alcoves open to the ${kLane && kSt ? 'lane and the street' : kLane ? 'lane' : 'street'}: the exception to the 5 Nov rule, this variant only (BC Hydro ES54 F3-06)`, `chillers on the roof, never over the hall (FM 5-32 2.2.1.6); ${across ? 'side by side across the roof at the lane, 3.0 m apart' : 'end to end along the far side'}; clear zones 1.5 m long sides, 2.1 m ends, 4.2 m between ends (Vertiv SL-70790 s. 4.2.4, our reading), the zones on the building edge kept on the non-hall roof`,
        'generator exhaust and air, fuel delivery upstairs and the structure for the roof plant not drawn (?)'] };
    const rooms = { 1: R, 2: R2, 3: R3 };
    const hubArea = sum(R.filter(x => x.block === 'hub' && !x.core && x.kind !== 'exitpas').map(x => areaOf(x.r)));
    const dcArea = sum(R.filter(x => x.block === 'data centre' && x.kind !== 'bay').map(x => areaOf(x.r))) + sum(R2.filter(x => x.block === 'data centre' || x.dcSide).map(x => areaOf(x.r))) + sum(R3.map(x => areaOf(x.r)));
    return { rooms, hall, MW, dcArea, hubArea, plant, flags, kLane, kSt, nT, gz, gLay, across, Lb: across ? Lb : Lc, bC: across ? W : bC, aLR, dLR, hubKw, refA: r2(sum(R.filter(x => /^ref/.test(x.id)).map(x => areaOf(x.r)))), shelA: r2(areaOf(shelR)) };
  };
   
  const nbOf = A => { if (!van) { const tot = (A ? A.hubArea + A.dcArea : W * D * 3); return tot < 2500 ? 0 : tot <= 7500 ? 1 : 2; }
    const dc = A ? A.dcArea : 2 * W * D, nDC = bays5_2_5(dc), nRef = rh517(((A ? A.refA + A.shelA : W * D * 0.6)) / 2800); return { nDC, nRef, nb: st.shared ? Math.max(nDC, nRef) : nDC + nRef }; };
  let mw = Math.max(0.1, (W * D * 0.55) / HPM()), A = null, hubKw = 60, NB = nbOf(null), nb = van ? NB.nb : NB;
  let tries = 0;    
  for (let k = 0; k < 12; k++) { A = attempt(mw, nb, hubKw); if (A.fail && /generator room/.test(A.fail) && tries < 6 && mw * 0.85 >= RULES.mwFloor.mw * 0.5) { tries++; mw = r2(mw * 0.85); k--; continue; } if (A.fail) return A;
    const N2 = nbOf(A), nb2 = van ? N2.nb : N2; if (van) NB = N2;
    if (Math.abs(A.MW - mw) < 0.002 && nb2 === nb && Math.abs(A.hubKw - hubKw) < 0.5) break; mw = A.MW; nb = nb2; hubKw = A.hubKw; }
  const bOrigin = C.sv < 0 ? sp[1] : sp[0]; C.mapUV = (aa, b) => [C.uOf(C.a0 + aa), bOrigin + C.sv * b];
  const H = [C.ground, RULES.storeyH.up, RULES.storeyH.hall];
  A.flags.forEach(f => C.flags && C.flags.push(f));
  return { rooms: A.rooms, H, hall: A.hall, MW: A.MW, dcArea: A.dcArea, hubArea: A.hubArea, clin: 0, nb, nDC: van ? NB.nDC : null, nRef: van ? NB.nRef : null, nCl: 0, clinWhy: null, shared: st.shared,
    truck: { court: null, why: 'bays open to the lane (drawing choice, as the 1360 Frances St test fit); truck turning at the lane not checked (?)' }, plant: A.plant, aB: RULES.stair.l, aC: r2(RULES.stair.l - RULES.cor.w), aR: RULES.stair.l, dF: RULES.stair.l,
    kind: 'stacked', plantUp: { kLane: A.kLane, kSt: A.kSt, nT: A.nT, gens: A.gLay, across: A.across, band: [A.Lb, A.bC], aLR: A.aLR, dLR: A.dLR, refuge: A.refA, shelter: A.shelA }, W, Da: D, bOrigin,
    sizeStop: { rule: 'building line', at: A.MW, why: 'layout (b): storey 3 is full: the hall is storey 3 less the chiller band (its rooms under it), the floor over the street alcoves and the stairs and lift' },
    storeyNames: ['Hub at grade; data-centre entrance, loading and transformer alcoves', 'Data-centre support and the generator room', 'One data-hall storey; chillers on the roof over the band at the lane'] };
}
 
const rh517 = x => Math.max(1, Math.floor(x + 0.5));
function bays5_2_5(m2) { return m2 <= 0 ? 0 : m2 <= 465 ? 1 : m2 <= 2325 ? 2 : 2 + Math.floor((m2 - 2325) / 2325 + 0.5); }
function subR(a, b) { if (!(b[0] < a[1] - 1e-6 && b[1] > a[0] + 1e-6 && b[2] < a[3] - 1e-6 && b[3] > a[2] + 1e-6)) return [a]; const o = [];
  if (b[0] > a[0]) o.push([a[0], b[0], a[2], a[3]]); if (b[1] < a[1]) o.push([b[1], a[1], a[2], a[3]]); const m0 = Math.max(a[0], b[0]), m1 = Math.min(a[1], b[1]);
  if (b[2] > a[2]) o.push([m0, m1, a[2], b[2]]); if (b[3] < a[3]) o.push([m0, m1, b[3], a[3]]); return o.filter(r => ra(r) > 0.05).map(r => r.map(r2)); }
const LASTPU = [];    
const subAll = (rs, cut) => cut.reduce((acc, c) => acc.flatMap(r => subR(r, c)), rs);

 
function beside(C) {
  const { st, van } = C, cw = RULES.cor.w, sm = RULES.smallRoom.w, wcm = RULES.wcMod.w, pw = RULES.pexit.w;
  let sp = C.spanOver(0, Math.min(40, C.aMax)); if (!sp) return { fail: 'no buildable width' };
  let W = Math.min(r2(sp[1] - sp[0]), RULES.largeW.w), L = null;
  for (let it = 0; it < 4; it++) { L = besideW(C, W); if (!L.narrow) return L; W = L.narrow; }
  return { fail: 'width narrows over the depth' };
}
function besideW(C, W) {
  const { st, van } = C, cw = RULES.cor.w, sm = RULES.smallRoom.w, wcm = RULES.wcMod.w, pw = RULES.pexit.w; let sp;
  const R = [];
   
  let hubI = [{ id: 'pas', n: 'Exit passage from the public corridor to the street', k: 'exitpas', fix: pw }, { id: 'ref', n: st.shelter ? 'Refuge main room' : 'Refuge main room, day shelter merged (ladder step 3)', k: 'refuge', w: 4.0, m2: PRG.refuge.m2 }]
    .concat(st.shelter ? [{ id: 'shel', n: 'Warming shelter rest area (day)', k: 'shelter', w: 4.0, m2: PRG.shelter.m2 }] : []).concat([{ id: 'lob', n: 'Shared lobby', k: 'lobby', w: RULES.lobby.w }]);
  const clI = st.exams > 0 ? [{ id: 'wait', n: 'Clinic waiting, reception', k: 'croom', w: PRG.wait.w, p: 'wait' }, { id: 'pas2', n: 'Clinic exit passage to the street', k: 'exitpas', fix: pw }]
    .concat(Array.from({ length: st.exams }, (_, i) => ({ id: 'ex' + (i + 1), n: 'Exam room ' + (i + 1), k: 'croom', w: PRG.exam.w, m2: PRG.exam.m2, p: 'exam' })))
    .concat([{ id: 'proc', n: 'Procedure room', k: 'croom', w: PRG.proc.w, m2: PRG.proc.m2, p: 'proc' }, { id: 'coff', n: 'Clinic office', k: 'croom', w: PRG.coff.w, p: 'coff' }, { id: 'cstf', n: 'Clinic staff lounge, lockers', k: 'croom', w: PRG.cstf.w, p: 'cstf' }]) : [];
   
  if (C.wing) hubI = [hubI[0]].concat(C.wing.front.map(x => Object.assign({}, x)), [{ id: 'lob', n: 'Shared lobby', k: 'lobby', w: RULES.lobby.w }]);    
  let dF = C.wing ? C.wing.minD : 6.0, pf, fI;
  for (; dF <= (C.wing ? 40 : 14); dF = r2(dF + 0.1)) { fI = hubI.map((x, i) => Object.assign({}, x, { grow: C.wing ? !!x.grow : x.id === 'ref' })).concat(clI); pf = pack(fI, W, dF); if (!pf.fail && wingFits(C, pf.ws, fI, dF)) break; if (!pf.fail) pf = { fail: r2(W + 0.1) }; }
  if (pf.fail) return { fail: `front row needs ${pf.fail} m across at ${dF} m deep; ${W} m available` };
  const F = place(fI, pf.ws, 0, 0, dF);
  const bLob = F.find(x => x.id === 'lob').rr[3];
  const aC = dF, aR = r2(dF + cw);
   
  const areaRS = sum(F.filter(x => x.k === 'refuge' || x.k === 'shelter').map(x => ra(x.rr))), load = Math.ceil(areaRS / 0.75), [nM, nF] = wcA(Math.ceil(load / 2));
  const dR = RULES.rowB.d;
  let hubR = [{ id: 'pmec', n: 'Programs mechanical, emergency panel', k: 'plant', w: PRG.pmec.w }, { id: 'wcw', n: `WC women (${nF})`, k: 'proom', w: Math.max(sm, r2(nF * wcm)) }, { id: 'wcm', n: `WC men (${nM})`, k: 'proom', w: Math.max(sm, r2(nM * wcm)) },
    { id: 'uwc', n: 'Universal WC', k: 'proom', w: PRG.uwc.w }, { id: 'sho', n: 'Universal shower', k: 'proom', w: PRG.sho.w }, { id: 'fa', n: 'First aid', k: 'proom', w: PRG.fa.w, m2: PRG.fa.m2 },
    { id: 'off', n: 'Staff office (shared)', k: 'proom', w: PRG.off.w, m2: PRG.off.m2 }, { id: 'cot', n: 'Cot and supply storage', k: 'proom', w: sm, grow: true }];
  if (C.wing) hubR = wingWCs(C, F, C.wing.behind.map(x => Object.assign({}, x)));    
  const ph = pack(hubR, bLob, dR); if (ph.fail) return { fail: C.wing ? `the rooms behind the wing need ${ph.fail} m; ${bLob} m behind the public corridor` : `hub service row needs ${ph.fail} m; ${bLob} m behind the public corridor` };
  let clin = 0, Rc = [];
  if (st.exams > 0) {
    let nwc = 1, cR, pc;
    for (let it = 0; it < 3; it++) {
      cR = [{ id: 'cons', n: 'Consult room', w: PRG.cons.w, m2: PRG.cons.m2, p: 'cons' }, { id: 'med', n: 'Medication room', w: PRG.med.w, m2: PRG.med.m2, p: 'med' }, { id: 'cln', n: 'Clean supply', w: PRG.cln.w, m2: PRG.cln.m2, p: 'cln' },
        { id: 'soil', n: 'Soiled holding', w: PRG.soil.w, m2: PRG.soil.m2, p: 'soil' }, { id: 'hk', n: 'Housekeeping', w: PRG.hk.w, m2: PRG.hk.m2, p: 'hk' }]
        .concat(Array.from({ length: Math.max(0, 2 * nwc - 1) }, (_, i) => ({ id: 'cwc' + (i + 1), n: 'Clinic WC ' + (i + 1), w: RULES.clinicWC.w, p: 'cwc' })))
        .concat([{ id: 'cuw', n: 'Clinic universal WC', w: PRG.uwc.w, p: 'uwc' }, { id: 'cst', n: 'Clinic storage', w: PRG.cst.w, p: 'cst' }, { id: 'cspare', n: 'Unassigned (no use yet), off the clinic corridor', w: 0, grow: true, spare: true }]);
      pc = pack(cR, r2(W - bLob), dR); if (pc.fail) return { fail: `clinic back row needs ${pc.fail} m; ${r2(W - bLob)} m` };
      const est = (W - bLob) * (dF + cw + dR); const n2 = wcBload(Math.ceil(est / 9.3)); if (n2 === nwc) break; nwc = n2;
    }
    Rc = place(cR, pc.ws, bLob, aR, r2(aR + dR)).filter(x => x.rr[3] - x.rr[2] > 0.01);
    clin = r2((W - bLob) * (dF + cw) - pw * dF + sum(Rc.filter(x => !x.spare).map(x => ra(x.rr))));
    if (clin > 500) return { fail: `clinic ${Math.round(clin)} m² over 500 m² (${van ? 'Parking By-law 5.2.9: a loading space' : 'BE 3.3.1: Health Service 500 m² per establishment'}; clinic ≤ 500 variant)` };
  }
  const aB = r2(aR + dR);
  F.forEach(x => R.push(room(1, x.id, x.n, x.k === 'croom' ? 'clin' : x.k === 'lobby' || x.k === 'exitpas' ? 'circ' : 'pub', x.k === 'refuge' || x.k === 'shelter' ? 'proom' : x.k, [x.rr], { block: x.k === 'croom' || x.id === 'pas2' ? 'clinic' : 'hub', prog: x.p || x.k, sky: x.sky || undefined, wingRoom: x.wingRoom || undefined })));
  R.push(room(1, 'cor', 'Public corridor', 'circ', 'pcor', [[aC, aR, 0, bLob]], { block: 'hub', corridor: true }));
  if (st.exams > 0) R.push(room(1, 'ccor', 'Clinic corridor', 'clin', 'ccor', [[aC, aR, bLob, W]], { block: 'clinic', corridor: true }));
  place(hubR, ph.ws, 0, aR, aB).forEach(x => R.push(room(1, x.id, x.n, x.k === 'plant' ? 'plant' : 'pub', x.k, [x.rr], { block: 'hub', prog: x.id, wingRoom: x.wingRoom || undefined })));
  Rc.forEach(x => R.push(x.spare ? room(1, x.id, x.n, 'spare', 'spare', [x.rr], { block: 'spare' }) : room(1, x.id, x.n, 'clin', 'croom', [x.rr], { block: 'clinic', prog: x.p })));
  if (!(st.exams > 0)) { R.push(room(1, 'sparef', 'Unassigned (no use yet)', 'spare', 'spare', [[0, aB, bLob, W]], { block: 'spare' })); }
  const hubArea = sum(R.filter(x => x.block === 'hub').map(x => sum(x.r.map(ra))));
   
  const bayL = van ? 10.2 : 9.0, bayW = van ? 3.4 : 3.3, dS = C.dS || Math.max(bayL, 9.0);
  const supportGuess = 520;
  const hallNeed = HPM() * C.mw;
  let dH = up1(hallNeed / W);
  const cap = CAPM2(); let capTrim = false; if (dH * W + W * (cw + dS) > cap) { dH = Math.floor((cap - W * (cw + dS)) / W * 10) / 10; capTrim = true; }    
  let Da = r2(aB + dH + cw + dS);
  if (Da > C.aMax) { Da = Math.floor(C.aMax * 10) / 10; dH = r2(Da - aB - cw - dS); if (dH < 6) return { fail: `the lot is ${C.aMax} m deep; the hub and the data centre need ${r2(aB + 6 + cw + dS)} m` }; }
  sp = C.spanOver(0, Da); if (!sp) return { fail: 'no width over the building depth' };
  if (r2(sp[1] - sp[0]) < W - 1e-6) return { narrow: r2(Math.floor((sp[1] - sp[0]) * 100) / 100) };
  const bOrigin = C.sv < 0 ? sp[1] : sp[0];
  C.mapUV = (a, b) => [C.uOf(C.a0 + a), bOrigin + C.sv * b];
  const aH = r2(aB + dH), aS = r2(aH + cw);
  const sec = (id, n, kind, rects, o) => room(1, id, n, kind === 'hall' ? 'hall' : kind === 'bay' ? 'load' : 'sup', kind, rects, Object.assign({ block: 'data centre' }, o || {}));
  R.push(sec('hall', 'Data hall (one storey)', 'hall', [[aB, aH, 0, W]]), sec('scor', 'Secure corridor', 'scor', [[aH, aS, 0, W]], { corridor: true }));
  const MWest = (dH * W) / HPM();
  const tot = hubArea + clin + dH * W + W * (cw + dS), nb = st.shared ? 1 : (van ? (tot < 2500 ? 0 : tot <= 7500 ? 1 : 2) : edmBays(tot, W, Da));
  const sI = [{ id: 'pas3', n: 'Exit passage (2 h) from the secure corridor to the rear', fix: pw }, { id: 'ups', n: `UPS room (${Math.ceil(MWest) + 1} modules, N+1)`, w: PRG.ups.w, m2: r2(MWest * 3.3 + 3.0) }, { id: 'bat', n: 'Battery room, Li-ion', w: PRG.bat.w, m2: batRoomM2(MWest) },
    { id: 'bhv', n: 'Battery room HVAC (separate)', w: PRG.bhv.w }, { id: 'mv', n: 'MV switchgear, main electrical', w: PRG.mv.w }, { id: 'mmr1', n: 'Meet-me room 1', w: PRG.mmr.w }, { id: 'mmr2', n: 'Meet-me room 2', w: PRG.mmr.w },
    { id: 'valv', n: 'Sprinkler valve room, cylinders', w: PRG.valv.w }, { id: 'pas4', n: 'Exit passage (2 h) from the middle of the secure corridor to the rear', fix: pw }, { id: 'noc', n: 'Security control room / NOC', w: PRG.noc.w }, { id: 'doff', n: 'DC offices', w: PRG.doff.w, m2: PRG.doff.m2 }, { id: 'brk', n: 'DC break room', w: PRG.brk.w, m2: PRG.brk.m2 },
    { id: 'dwc', n: 'DC staff WC, shower', w: PRG.dwc.w }, { id: 'jan', n: 'Janitor (DC)', w: PRG.jan.w }, { id: 'garb', n: 'Garbage and recycling', w: PRG.garb.w }, { id: 'ship', n: 'Shipping, receiving, storage and staging (one room)', w: PRG.ship.w, m2: PRG.ship.m2, grow: true }]
    .concat(Array.from({ length: nb }, (_, i) => ({ id: 'b' + (i + 1), fix: bayFix(i, nb, bayW), bay: true }))).concat([{ id: 'dock', n: 'Dock lobby (entrance)', w: 2.4 }, { id: 'ves', n: 'DC staff entrance: vestibule, guard point, portal', fix: RULES.ves.w }]);
  let ps = pack(sI, W, dS), dS2 = dS; while (ps.fail && dS2 < 20) { dS2 = r2(dS2 + 0.5); ps = pack(sI, W, dS2); }
  if (ps.fail && RULES.dcSideHub && !C.acrossOnly) {    
    for (let i = R.length - 1; i >= 0; i--) if (R[i].block === 'data centre') R.splice(i, 1);
    const Dn = besideDCside(C, W, R, aB, hubArea + clin, sI, ps.fail); if (Dn.narrowTo) return { narrow: Dn.narrowTo }; if (Dn.fail) return Dn;
    return Object.assign(Dn, { hubArea, clin, aC, aR, dF, kind: 'beside', storeyNames: ['Hub, clinic and the data centre at grade (one storey; support rooms beside the hall)'] }); }
  if (ps.fail) return { fail: `data-centre support row needs ${ps.fail} m; ${W} m` };
  if (dS2 > dS) { return besideW(Object.assign({}, C, { dS: dS2 }), W); }
  place(sI, ps.ws, 0, aS, Da).forEach((x, i) => { if (x.bay) R.push(sec(x.id, `Loading space ${x.id.slice(1)}, ${van ? 'Class B 10.2 × 3.4 m with 1.3 m side clearance (a pair shares one)' : '9.0 × 3.3 m with 1.3 m side clearance (a pair shares one; Vancouver Design Supplement figure used as a stand-in, Edmonton not sourced)'}`, 'bay', [[r2(Da - bayL), Da, x.rr[2], x.rr[3]]]));
    else if (x.id === 'pas3' || x.id === 'pas4') R.push(sec(x.id, x.n, 'exitpas', [x.rr]));
    else if (x.id === 'dock') R.push(sec('dock', x.n, 'dock', [x.rr])); else if (x.id === 'ves') R.push(sec('ves', x.n, 'entry', [x.rr])); else R.push(sec(x.id, x.n, 'sroom', [x.rr], { prog: x.id })); });
   
  R.filter(x => x.kind === 'bay').forEach(x => { const r = x.r[0]; if (r[0] > aS + 0.01) R.find(y => y.id === 'dock').r.push([aS, r[0], r[2], r[3]]); });
  const hall = dH * W, MW = hall / HPM();
  const dcArea = sum(R.filter(x => x.block === 'data centre' && x.kind !== 'bay').map(x => sum(x.r.map(ra))));
  const rooms = { 1: R };
  const truck = { court: [Da, r2(Da + RULES.aisle.w), 0, W], covered: null, why: 'bays open to a 6.1 m truck aisle behind the building (Parking By-law 5.4.1 aisle, Vancouver’s figure used in Edmonton ?)' };
  const plant = plantLayout(Object.assign({}, C, { lowRoof: { r: [0, aB, 0, W], z: RULES.storeyH.hall } }), W, Da, MW, rooms);
  return { rooms, H: [RULES.storeyH.hall], hall, MW, dcArea, hubArea, clin, nb, shared: st.shared, truck, plant, aB, aC, aR, dF, W, Da, bOrigin, kind: 'beside', storeyNames: ['Hub, clinic and the data centre at grade (one storey)'],
    ...(capTrim && plant && plant.ok ? { capped: true, sizeStop: { rule: 'floor cap', at: MW, why: `held at the ${cap} m² floor cap (the hall ${dH} m deep across ${W} m; ${Math.round(dcArea)} m² of data-centre floor)` } } : {}) };
}

 
 
const PFm = (typeof module !== 'undefined' && module.exports) ? (() => { try { return require('./plantfit.js'); } catch (e) { return null; } })() : null;
const PF = () => (root && root.BD && root.BD.plantfit) || PFm;
function plantLayout(C, W, Da, MW, rooms, landings) {
  const old = plantLayoutOld(C, W, Da, MW, rooms), P = PF();
  if (!P || !C.mapUV || !C.S || !C.S.ring || !RULES.sharedPacker) return old;
   
  const roofCh = old.items.filter(i => i.roof && i.kind === 'chiller');
   
  const o = C.mapUV(0, 0), pa = C.mapUV(1, 0), pb = C.mapUV(0, 1), A = [pa[0] - o[0], pa[1] - o[1]], B = [pb[0] - o[0], pb[1] - o[1]], det = A[0] * B[1] - A[1] * B[0];
  if (Math.abs(det) < 1e-9) return old;
  const toAB = q => { const x = q[0] - o[0], y = q[1] - o[1]; return [r2((x * B[1] - y * B[0]) / det), r2((A[0] * y - A[1] * x) / det)]; };
  const lot = C.S.ring.map(toAB), aP = r2(Da + RULES.aisle.w);
  const yard = clipRect(lot, [aP, 1e5, C.S.sideDrive ? 0 : -1e5, C.S.sideDrive ? W : 1e5]); if (yard.length < 3) return Object.assign(old, { ok: false, why: 'no plant yard behind the truck aisle', packer: 'shared' });
  const building = Object.values(rooms || {}).flat().flatMap(x => x.r).map(r => [r2(r[0] - RULES.extFace), r2(r[1] + RULES.extFace), r2(r[2] - RULES.extFace), r2(r[3] + RULES.extFace)]);    
  const HX = HC(), gz = old.gen, tz = old.tx, hs = old.hubSet, enc = hs && hs.kw ? (hs.enclosure ? hs.enclosure[0] : hs.footprint) : null;
  if (!gz || !gz.footprint || !tz || !tz.pad) return old;
  const need = { gen: [old.nG, gz.footprint], pad: [old.nT, tz.pad], hub: enc ? enc.slice() : null, chill: Math.max(0, old.nC - roofCh.length) };
  const city = C.S.city === 'edm' ? 'e' : 'v';
   
  const okBox = r => { hardCheck(); for (let a = r[0]; a <= r[1] + 1e-9; a += Math.max(0.5, (r[1] - r[0]) / 6)) for (let b = r[2]; b <= r[3] + 1e-9; b += Math.max(0.5, (r[3] - r[2]) / 6)) { const [u, v] = C.mapUV(Math.min(a, r[1]), Math.min(b, r[3])); if (!C.inYard(u, v)) return false; } return true; };
  const wayOk = RULES.plantWay ? plantWayTest(C, lot, building, toAB, Da, aP, W) : null;
  let best = null; for (const order of [['gen', 'pad', 'hub', 'chill'], ['pad', 'gen', 'hub', 'chill'], ['chill', 'gen', 'pad', 'hub'], ['gen', 'chill', 'pad', 'hub']]) {
    const r = P.place([yard], lot, building, need, { order, city, keep: landings || [], okBox, wayOk }); if (!r.why) { best = r; break; } if (!best) best = r; }
   
  let hubSetOut = null; if (best.why && /^hub set/.test(best.why) && need.hub) { const n2 = Object.assign({}, need, { hub: null }); let b2 = null;
    for (const order of [['gen', 'pad', 'hub', 'chill'], ['pad', 'gen', 'hub', 'chill'], ['chill', 'gen', 'pad', 'hub'], ['gen', 'chill', 'pad', 'hub']]) { const r = P.place([yard], lot, building, n2, { order, city, keep: landings || [], okBox, wayOk }); if (!r.why) { b2 = r; break; } }
    if (b2) { best = b2; hubSetOut = `the hub's own set (${hs.model}) does not fit in the yard at grade: its own 2 h room is not drawn yet (?)`; } }
  const nm = { gen: k => `Generator ${k}, ${old.setKW.toLocaleString('en-CA')} kW${gz.model ? ' ' + gz.model : ''}, sub-base tank`, pad: k => `Transformer pad ${k}${tz.kva ? `, ${tz.kva.toLocaleString('en-CA')} kVA` : ''}`, hub: () => `Hub generator${hs && hs.model ? ', ' + hs.model : ''} (${hs ? hs.kw : '?'} kW standby), in its enclosure`, chill: k => `Chiller ${k} (at grade)` };
  const cnt = {}, pre = { gen: 'g', pad: 't', hub: 'h', chill: 'c' };
  const items = best.items.map(it => { cnt[it.kind] = (cnt[it.kind] || 0) + 1; const k = cnt[it.kind];
    return { id: pre[it.kind] + k, n: nm[it.kind](k), kind: it.kind === 'chill' ? 'chiller' : it.kind === 'hub' ? 'gen' : it.kind, hub: it.kind === 'hub' || undefined, r: it.r.map(r2), z: (it.zone || it.r).map(r2), keep: (it.zone || it.r).map(r2) }; });
  roofCh.forEach(i => { cnt.chill = (cnt.chill || 0) + 1; items.push(Object.assign({}, i, { id: 'c' + cnt.chill })); });
  const why = best.why ? `${best.why} does not fit in the yard` : null;
  return Object.assign({}, old, { ok: !best.why, why, whyAll: why, items, hubSetOut, packer: roofCh.length ? 'shared (tool/plantfit.js) in the yard; chillers on the lower roof by the older packer (spec rule 1)' : 'shared (tool/plantfit.js,  11k + addition 1)',
    rules: old.rules.concat(['placed by the hub’s shared packer ( at 11k + addition 1): every clearance packed to D1 (0.5 m), tank and pad distances to the building only, Edmonton set test noise 3.13 m (data centre) and 1.25 m (hub set) from lot lines']) });
}
 
function plantWayTest(C, lot, building, toAB, Da, aP, W) { const S = C.S, g = 0.5, H = 6;
  const as = lot.map(p => p[0]), bs = lot.map(p => p[1]), a0 = Math.min(...as), b0 = Math.min(...bs), na = Math.ceil((Math.max(...as) - a0) / g), nb = Math.ceil((Math.max(...bs) - b0) / g);
  if (na * nb > 4e5 || na < 2 * H + 1 || nb < 2 * H + 1) return null;
  const base = new Uint8Array(na * nb), ca = i => a0 + (i + 0.5) * g, cb = j => b0 + (j + 0.5) * g;
  for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) { const a = ca(i), b = cb(j); base[i * nb + j] = inPoly([a, b], lot) && !building.some(r => a > r[0] && a < r[1] && b > r[2] && b < r[3]) ? 1 : 0; }
  const ways = (S.edges || []).filter(e => e.abuts === 'street' || e.abuts === 'alley').map(e => [toAB(e.a), toAB(e.b)]);
  const dv = S.sideDrive && S.sideDrive.r ? (() => { const q = [[S.sideDrive.r[0], S.sideDrive.r[2]], [S.sideDrive.r[1], S.sideDrive.r[2]], [S.sideDrive.r[0], S.sideDrive.r[3]], [S.sideDrive.r[1], S.sideDrive.r[3]]].map(toAB); return [Math.min(...q.map(x => x[0])), Math.max(...q.map(x => x[0])), Math.min(...q.map(x => x[1])), Math.max(...q.map(x => x[1]))]; })() : null;
  const court = [Da, aP, 0, W], nearWay = (a, b, d) => ways.some(([p, q]) => dSeg([a, b], p, q) <= d);
  const isSrc = new Uint8Array(na * nb); for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) { const a = ca(i), b = cb(j);
    isSrc[i * nb + j] = nearWay(a, b, RULES.waySrc) || (a >= court[0] - 3.5 && a <= court[1] + 3.5 && b >= court[2] - 3.5 && b <= court[3] + 3.5) || (dv && a >= dv[0] - 1 && a <= dv[1] + 1 && b >= dv[2] - 1 && b <= dv[3] + 1) ? 1 : 0; }
  const isSrc0 = new Uint8Array(na * nb); if (RULES.courtWay) for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) { const a = ca(i), b = cb(j); isSrc0[i * nb + j] = nearWay(a, b, RULES.waySrc) || (dv && a >= dv[0] - 1 && a <= dv[1] + 1 && b >= dv[2] - 1 && b <= dv[3] + 1) ? 1 : 0; }    
  const inCourt = seen => { const i0 = Math.max(0, Math.floor((court[0] - 1 - a0) / g)), i1 = Math.min(na - 1, Math.ceil((court[1] + 1 - a0) / g)), j0 = Math.max(0, Math.floor((court[2] - 1 - b0) / g)), j1 = Math.min(nb - 1, Math.ceil((court[3] + 1 - b0) / g)); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (seen[i * nb + j]) return true; return false; };
  const at = r => [[r[0], r[2]], [r[0], r[3]], [r[1], r[2]], [r[1], r[3]], [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]].some(p => nearWay(p[0], p[1], 4.5));
  const NEED = it => (it.kind === 'gen' || it.kind === 'hub' || it.kind === 'pad') && !at(it.r);
  const reach = (items, noCourt) => { const fr = base.slice(); for (const it of items) { const r = it.r, i0 = Math.max(0, Math.floor((r[0] - a0) / g)), i1 = Math.min(na - 1, Math.ceil((r[1] - a0) / g)), j0 = Math.max(0, Math.floor((r[2] - b0) / g)), j1 = Math.min(nb - 1, Math.ceil((r[3] - b0) / g));
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = ca(i), b = cb(j); if (a > r[0] && a < r[1] && b > r[2] && b < r[3]) fr[i * nb + j] = 0; } }
    const I = new Int32Array((na + 1) * (nb + 1)), N = nb + 1; for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) I[(i + 1) * N + j + 1] = (fr[i * nb + j] ? 0 : 1) + I[i * N + j + 1] + I[(i + 1) * N + j] - I[i * N + j];
    const veh = k => { const i = Math.floor(k / nb), j = k % nb; if (i < H || j < H || i >= na - H || j >= nb - H) return false; return I[(i + H + 1) * N + j + H + 1] - I[(i - H) * N + j + H + 1] - I[(i + H + 1) * N + j - H] + I[(i - H) * N + j - H] === 0; };
    const SRC = noCourt ? isSrc0 : isSrc, seen = new Uint8Array(na * nb), q = []; for (let k = 0; k < na * nb; k++) if (SRC[k] && veh(k)) { seen[k] = 1; q.push(k); }
    while (q.length) { const k = q.pop(), i = Math.floor(k / nb), j = k % nb; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i2 = i + da, j2 = j + db; if (i2 < 0 || j2 < 0 || i2 >= na || j2 >= nb) continue; const k2 = i2 * nb + j2; if (!seen[k2] && veh(k2)) { seen[k2] = 1; q.push(k2); } } }
    return seen; };
   
  const near = (seen, r) => { const i0 = Math.max(0, Math.floor((r[0] - 4.5 - a0) / g)), i1 = Math.min(na - 1, Math.ceil((r[1] + 4.5 - a0) / g)), j0 = Math.max(0, Math.floor((r[2] - 4.5 - b0) / g)), j1 = Math.min(nb - 1, Math.ceil((r[3] + 4.5 - b0) / g));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { if (!seen[i * nb + j]) continue; const a = ca(i), b = cb(j), dx = Math.max(r[0] - a, 0, a - r[1]), dy = Math.max(r[2] - b, 0, b - r[3]); if (Math.hypot(dx, dy) <= 4.5) return true; } return false; };
  const touches = (seen, r) => { const d = (H + 1) * g, i0 = Math.max(0, Math.floor((r[0] - d - a0) / g)), i1 = Math.min(na - 1, Math.ceil((r[1] + d - a0) / g)), j0 = Math.max(0, Math.floor((r[2] - d - b0) / g)), j1 = Math.min(nb - 1, Math.ceil((r[3] + d - b0) / g));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (seen[i * nb + j]) return true; return false; };
  let ck = null, cs = null; const key = items => items.map(it => it.r.join(',')).join(';');
  const courtBase = RULES.courtWay && aP > Da + 0.5 ? inCourt(reach([], true)) : false; let ck0 = null, cs0 = null;
  const courtKept = items => { if (!courtBase) return true; const c = items[items.length - 1], pre = items.slice(0, -1), k = key(pre); if (k !== ck0) { ck0 = k; cs0 = reach(pre, true); } if (!touches(cs0, c.r)) return true; return inCourt(reach(items, true)); };
   
  return items => { const c = items[items.length - 1], pre = items.slice(0, -1), k = key(pre); if (k !== ck) { ck = k; cs = reach(pre); }
    if (NEED(c) && !near(cs, c.r)) return false;
    if (!touches(cs, c.r)) return courtKept(items);
    const sn = reach(items); return items.filter(NEED).every(it => near(sn, it.r)) && courtKept(items); }; }
function plantLayoutOld(C, W, Da, MW, rooms) {
   
  const HX = HC(), Q = MW * 1.55, city = C.S && C.S.city === 'edm' ? 'e' : 'v';
  const hubKw = HX ? HX.hubLoad({ S: rooms }, Math.floor((rooms && rooms[1] ? rooms[1] : []).filter(x => x.g === 'pub' && /^ref/.test(x.id)).reduce((a, x) => a + x.r.reduce((b, r) => b + (r[1] - r[0]) * (r[3] - r[2]), 0), 0) / 3.5)).kw : 0;
  const noRole = !!(C.S && (C.S.typDef || C.S.wingTyp || C.S.hubTyp));    
  const gz = HX ? HX.gens(Q, 0) : null, tz = HX ? HX.transformers(Q, hubKw, city) : null, hs = HX && !noRole ? HX.hubSet(hubKw) : null;
  const big = gz ? gz.kw >= 2000 : Q > 3, setKW = gz ? gz.kw : big ? 2000 : 1000;
  const nG = gz ? gz.n : Math.ceil(Q / (big ? 2 : 1)) + 1, nC = Math.ceil(Q / 1.489) + 1, nT = tz ? tz.n : Math.ceil(Q / 2.5) + 1;
  const tank = gz ? gz.tank_l : MW * 1.55 * 1000 * 12 * ((typeof BD !== 'undefined' && BD.data && BD.data.equipment && BD.data.equipment.fuelLkWh) || 0.264) / Math.ceil(Q / (big ? 2 : 1));    
  const tankLot = tank >= 2500 && tank <= 50000 ? 3.0 : tank < 2500 ? null : null, tankBld = tank >= 2500 ? 1.5 : null;
  const G = gz && gz.footprint ? { l: gz.footprint[0], w: gz.footprint[1] } : { l: 8.43, w: 2.62 }, T = tz ? { l: tz.pad[0], w: tz.pad[1] } : { l: 2.49, w: 2.63 }, CH = { l: 12.14, w: 2.36, side: 1.5, end: 2.1 };
  const aP = r2(Da + RULES.aisle.w), items = [], why = [];
   
  const side = !!C.maxW || !!C.keeps, Wscan = C.maxW ? (C.Wfull || W) : W;
   
  (C.keeps || (C.maxW ? [[0, r2(Da + RULES.aisle.w), 0, W]] : [])).forEach((bR, k) => items.push({ id: 'bld' + k, pseudo: true, r: bR, z: bR, keep: [bR[0] - 1.5, bR[1] + 1.5, bR[2] - 1.5, bR[3] + 1.5] }));
   
  let roof = null;    
  const okRect = (r, keepLot) => { if (roof) return r[0] >= roof[0] - 1e-6 && r[1] <= roof[1] + 1e-6 && r[2] >= roof[2] - 1e-6 && r[3] <= roof[3] + 1e-6; for (let a = r[0]; a <= r[1] + 1e-9; a += Math.max(0.5, (r[1] - r[0]) / 6)) for (let b = r[2]; b <= r[3] + 1e-9; b += Math.max(0.5, (r[3] - r[2]) / 6)) { const [u, v] = C.mapUV(Math.min(a, r[1]), Math.min(b, r[3])); if (!C.inYard(u, v) || C.inDrive(u, v)) return false; } return true; };
  const ptD = (a, b) => { const p = C.mapUV(a, b); let m = 1e9; for (let i = 0; i < C.S.ring.length; i++) m = Math.min(m, dSeg(p, C.S.ring[i], C.S.ring[(i + 1) % C.S.ring.length])); return m; };
  const hit = (r, s) => r[0] < s[1] - 1e-6 && r[1] > s[0] + 1e-6 && r[2] < s[3] - 1e-6 && r[3] > s[2] + 1e-6;
  const grow = (r, d) => [r[0] - d, r[1] + d, r[2] - d, r[3] + d];
  const lotDist = r => { let m = 1e9; for (const [a, b] of [[r[0], r[2]], [r[0], r[3]], [r[1], r[2]], [r[1], r[3]], [(r[0] + r[1]) / 2, r[2]], [(r[0] + r[1]) / 2, r[3]], [r[0], (r[2] + r[3]) / 2], [r[1], (r[2] + r[3]) / 2]]) m = Math.min(m, ptD(a, b)); return m; };
  const span = r2(Math.max(40, C.aMax + 60));
  const tryPlace = (it0, aFix) => { for (const rot of (it0.rot ? [false, true] : [false])) { const it = rot ? Object.assign({}, it0, { L: it0.Wd, Wd: it0.L, zone: it0.zoneR }) : it0;
    const aS0 = roof ? roof[0] : aFix != null ? aFix : side ? 0 : aP, aS1 = roof ? roof[1] : aFix != null ? aFix : Da + span;
    for (let a = aS0; a <= aS1; a = r2(a + 0.5)) { hardCheck(); for (let b = roof ? roof[2] : -10; b <= (roof ? roof[3] : Wscan + 10); b = r2(b + 0.5)) {
      const r = [a, r2(a + it.L), b, r2(b + it.Wd)], z = it.zone ? it.zone(r) : r;
      if (items.some(o => !!o.roof === !!roof && (hit(z, o.keep) || hit(o.z, it.keepFor ? it.keepFor(r) : grow(r, 0)) || hit(grow(r, it.gap || 0), o.r)))) continue;    
      if (!okRect(r) || (it.zone && !okRect(z)) || (it.clear && !okRect(grow(r, it.clear)))) continue;    
      if (it.lot != null && lotDist(r) < it.lot - 1e-6) continue;
      return { r, z, rot };
    } } }
    return null; };
   
  for (let i = 0; i < nT; i++) { const p = tryPlace({ L: T.l, Wd: T.w, gap: 1.0 }, side ? null : aP); if (!p) { why.push(`transformer pad ${i + 1} of ${nT}`); break; }
    items.push({ id: 't' + (i + 1), n: `Transformer pad ${i + 1}${tz ? `, ${tz.kva.toLocaleString('en-CA')} kVA (${tz.pad_src})` : ''}`, kind: 'pad', r: p.r, z: p.r, keep: grow(p.r, 1.0), front: 'faces the yard aisle' }); }
   
  for (let i = 0; i < nG; i++) { const p = tryPlace({ L: G.l, Wd: G.w, gap: 2.0, lot: tankLot, rot: true, clear: SVC_CLEAR }); if (!p) { why.push(`generator ${i + 1} of ${nG}`); break; }
    items.push({ id: 'g' + (i + 1), n: `Generator ${i + 1}, ${setKW.toLocaleString('en-CA')} kW${gz ? ' ' + gz.model : ''}, sub-base tank`, kind: 'gen', r: p.r, z: p.r, keep: grow(p.r, 2.0) }); }
   
  let hubSetOut = null;
  if (hs && hs.kw) { const e = hs.enclosure ? hs.enclosure[0] : hs.footprint; const p = e ? tryPlace({ L: e[0], Wd: e[1], gap: 2.0, rot: true, clear: SVC_CLEAR }) : null;
    if (p) items.push({ id: 'h1', n: `Hub generator, ${hs.model} (${hs.kw} kW standby), in its enclosure`, kind: 'gen', hub: true, r: p.r, z: p.r, keep: grow(p.r, 2.0) });
    else hubSetOut = `the hub's own set (${hs.model}) does not fit in the yard at grade: its own 2 h room is not drawn yet (?)`; }
   
  const lowRoof = C.lowRoof || null; let onRoof = 0;
  for (let i = 0; i < nC; i++) { let p = roof ? null : tryPlace({ L: CH.l, Wd: CH.w, zone: r => [r2(r[0] - CH.end), r2(r[1] + CH.end), r2(r[2] - CH.side), r2(r[3] + CH.side)], zoneR: r => [r2(r[0] - CH.side), r2(r[1] + CH.side), r2(r[2] - CH.end), r2(r[3] + CH.end)], gap: 0, rot: true });
    if (!p && lowRoof) { for (const rr of (lowRoof.rs || [lowRoof.r])) { roof = rr; p = tryPlace({ L: CH.l, Wd: CH.w, zone: r => [r2(r[0] - CH.end), r2(r[1] + CH.end), r2(r[2] - CH.side), r2(r[3] + CH.side)], zoneR: r => [r2(r[0] - CH.side), r2(r[1] + CH.side), r2(r[2] - CH.end), r2(r[3] + CH.end)], gap: 0, rot: true }, null, true); if (p) break; } if (p) onRoof++; }
    if (!p) { why.push(`chiller ${i + 1} of ${nC}`); break; }
    items.push({ id: 'c' + (i + 1), n: `Chiller ${i + 1} (${roof ? (lowRoof.what || 'on the hub roof') + ', ' + lowRoof.z + ' m' : 'at grade'})`, kind: 'chiller', roof: !!roof, r: p.r, z: p.z, keep: p.z, panel: p.rot ? 'end toward the side (long axis across the lot: panel end to an access path ?)' : 'end toward the yard aisle' }); }
  const ok = !why.length, whyAll = why.length ? why.join(', ') + ' do not fit in the yard or on the lower roof' : null; if (onRoof) why.length = 0;
  for (let i = items.length - 1; i >= 0; i--) if (items[i].pseudo) items.splice(i, 1);
  return { ok, why: why.length ? why.join(', ') + ' do not fit in the yard' : null, whyAll, Q: r2(Q), nG, nC, nT, setKW, gen: gz, tx: tz, hubSet: hs, hubKw: r2(hubKw), hubSetOut, tank: Math.round(tank), tankLot, tankBld, items, aisle: [Da, aP],
    rules: ['generators and pads at grade (FM 5-32 2.6.4.3, insurer)', 'sets 2.0 m apart (CSA C282 6.5.1.1)', `tank ${Math.round(tank)} L a set: 1.5 m to the building, 3.0 m to lot lines (CSA B139 Table 2)`,
      'pads 1 m apart and from structures, 3 m clear in front, front to the aisle (BC Hydro ES54 F; drawing choice)', 'chiller clear zones 1.5 m long sides, 2.1 m ends, 2.5 m above (open sky); 3.0 / 4.2 m between units (Vertiv SL-70790 s. 4.2.4, our reading)',
      'chillers ≥ 5 m from drains: drains not drawn (?); A2L leak distance ? ; MV/HV distance ?', 'chillers at grade, never on the hall roof (FM 5-32 2.2.1.6)'] };
}

 
 
function markStaffOnly(L, S) { const T = S.typDef || S.wingTyp || S.hubTyp; if (!T || !L.rooms) return;
  const ids = new Set((T.rooms || []).filter(r => r.staffOnly === true).map(r => r.id).concat(spareList(T.id).filter(i => i.staffOnly === true).map(i => i.id)));
  if (!ids.size) return; Object.values(L.rooms).flat().forEach(x => { const b = String(x.prog || x.id).replace(/_c\d+$/, ''); if (ids.has(b) || ids.has(x.id)) x.staffOnly = true; }); }
 
let ENV = null;
function envOf(S) { if (ENV === null) { ENV = {}; try { if (typeof XMLHttpRequest !== 'undefined') { const x = new XMLHttpRequest(); x.open('GET', 'data/envelope.json', false); x.send(null); if (x.status === 200) ENV = JSON.parse(x.responseText); } } catch (e) { ENV = {}; } }
  const T = S.city === 'van' ? ENV.envVan : ENV.envEdm, z = String(S.zone || '').toUpperCase(); if (!T) return null; const key = Object.keys(T).find(k => z === k.toUpperCase()) || Object.keys(T).find(k => z.startsWith(k.toUpperCase())); return key ? Object.assign({ zone: key }, T[key]) : { zone: z, missing: true }; }
 
function envRows(L, S) { const E = envOf(S); if (!E || !L.rooms) return; const ring = S.ring || []; let A = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) A += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); A = Math.abs(A) / 2;
  if (E.missing) { L.flags.push(`FAR: zone ${E.zone} is not in tool/data/envelope.json; FAR not checked (?)`); return; }
  const all = Object.values(L.rooms).flat().filter(x => x.kind !== 'bay'), FG = RULES.extFace || 0, gross = sum(Object.keys(L.rooms).map(st => unionArea(L.rooms[st].filter(x => x.kind !== 'bay').flatMap(x => x.r).map(r => [r[0] - FG, r[1] + FG, r[2] - FG, r[3] + FG])))), prog = sum(all.filter(x => !(x.block === 'data centre' || x.dcSide)).map(x => sum(x.r.map(ra))));    
  const fsr = E.fsr || [], far = A > 0 ? gross / A : null, perm = fsr[0], cond = /^I-3/.test(E.zone) ? 5.0 : fsr[1];
  L.far = { gross: Math.round(gross), lot: Math.round(A), far: far != null ? r2(far * 100) / 100 : null, permitted: perm, conditional: cond, zone: E.zone };
  if (far != null && perm != null) { L.far.status = far <= perm + 1e-6 ? 'pass' : 'fail';
    L.flags.push(`FAR ${L.far.far.toFixed(2)} (${L.far.gross.toLocaleString('en-CA')} m² of floor on a ${L.far.lot.toLocaleString('en-CA')} m² lot) against ${perm} permitted in ${E.zone}${cond && cond !== perm ? ` (${cond} with a conditional approval${/^I-3/.test(E.zone) ? '; not for storage uses, so the data centre stays at 3.0' : ''})` : ''} (tool/data/envelope.json; checks/sources/FAR_per_zone_2026-11-15.md)${L.far.status === 'fail' ? ': over (hard)' : ''}`); }
  if (S.city === 'van' && A > 0) { const pf = prog / A; L.far.program = r2(pf * 100) / 100; L.flags.push(`Use allocation (I-2, I-3, project chat 15 Nov 20:45): public program floor ${Math.round(prog).toLocaleString('en-CA')} m² = ${L.far.program.toFixed(2)} × the site area, against 1.00 for all other uses combined${pf > 1 + 1e-6 ? ': over (?)' : ''}`); }
  if (/^I[MH]/.test(E.zone)) L.flags.push(`Height: ${E.zone} lowers the height near certain zones (IM 5.4.1, IH 6.1.1); neighbours not read, so not applied (?)`);
  const G = L.grades; if (G && G.height != null && G.hLimit != null && G.height > G.hLimit + 1e-6 && S.city === 'van') { const hx = parseFloat(String(E.hx || '').split(/[–-]/).pop());
    if (hx && G.height <= hx + 1e-6) { L.heightConditional = true; L.flags.push(`Conditional height: ${G.height} m over the ${G.hLimit} m permitted, within the ${hx} m conditional limit (${E.zone}; I-3 3.1.2.10); parts above 18.3 m step back 3.7 m at the front and 10.7 m at the sides (3.1.2.3, 3.1.2.5): not drawn yet (?)`); } } }
function gridRow(L, S) { const E = typeof BD !== 'undefined' ? BD.eng : null; if (!E || !E.R || !E.R.pue || !L.MW) return null; const pue = E.R.pue, T = S.typDef || S.wingTyp || S.hubTyp;
  const pl = T && T.power && typeof T.power === 'object' && T.power.programLoad && T.power.programLoad.kWhPerM2 ? T.power.programLoad : null;
  const progA = sum(Object.values(L.rooms || {}).flat().filter(x => !(x.block === 'data centre' || x.dcSide || x.kind === 'bay' || x.kind === 'spare')).map(x => sum(x.r.map(ra))));
  const progMW = pl ? r2(pl.kWhPerM2 * progA / 8760 / 1000 * (pl.peak || 1)) : 0, dem = [r2(L.MW * pue[0] + progMW), r2(L.MW * pue[1] + progMW)];
  let near = null; try { if (typeof window !== 'undefined' && !window.__SUBS && typeof XMLHttpRequest !== 'undefined') { const q = new XMLHttpRequest(); q.open('GET', 'substations.json', false); q.send(null); window.__SUBS = q.status === 200 ? JSON.parse(q.responseText) : {}; }
    const f = E.siteFacts ? E.siteFacts() : null, SB = typeof window !== 'undefined' ? window.__SUBS : null, city = S.city;
    if (f && f.c && SB) { const named = ((SB.named || {})[city] || []).map(p => ({ n: p.n, d: Math.hypot(p.x - f.c[0], p.y - f.c[1]), src: p.src, status: p.status })),
      mapped = ((SB.cities || {})[city] || []).map(p => ({ n: 'mapped station', d: Math.hypot(p[0] - f.c[0], p[1] - f.c[1]), src: `NRCan CanVec (map year ${p[3]})` }));
      near = named.concat(mapped).sort((a, b) => a.d - b.d)[0] || null; } } catch (e) { near = null; }
  const cap = null;    
  return { demand: dem, progMW, pue, cap, status: cap == null ? 'unknown' : dem[1] > cap ? 'over' : 'within',
    text: `Grid: demand ${dem[0].toFixed(2)}–${dem[1].toFixed(2)} MW at the meter (${L.MW.toFixed(2)} MW of IT × PUE ${pue[0]}–${pue[1]}${progMW ? ` + ${progMW} MW of program load` : ''}); grid capacity not known (no utility publishes feeder or substation capacity; the connection is the utility's answer)${near ? `; nearest ${near.n === 'mapped station' ? 'mapped substation' : near.n + ' substation'} ${(near.d / 1000).toFixed(1)} km (${near.src})` : ''}` }; }
 
 
function stepBack(res, S, k, hall2) { if (S.city !== 'van' || !/^I-3/.test(String(S.zone || '').toUpperCase()) || !Array.isArray(res.H) || !res.toUV || !S.ring || !S.edges) return null;
  const base = sum(res.H.slice(0, k)), top = base + RULES.storeyH.hall; if (top <= 18.3 + 1e-6) return null;
  const hi = top > 30.5 + 1e-6, dF = hi ? 6.1 : 3.7, dS = hi ? 12.2 : 10.7, ring = S.ring;
  const E = S.edges.filter(e => e.kind === 'front' || e.kind === 'side' || e.kind === 'flank').map(e => ({ a: e.a, b: e.b, d: e.kind === 'front' || e.kind === 'flank' ? dF : dS, isF: e.kind === 'front' }));    
  const ok = (u, v) => inPoly([u, v], ring) && E.every(e => dSeg([u, v], e.a, e.b) >= e.d - 1e-6);
  const o = res.toUV(0, 0), ua = res.toUV(1, 0)[0] - o[0], vb = res.toUV(0, 1)[1] - o[1];    
  if (!ua || !vb || Math.abs(res.toUV(1, 0)[1] - o[1]) > 1e-3) return { fail: 'second hall storey: the I-3 step-back needs an axis-aligned lot frame here (?)' };
  const out = [], before = sum(hall2.map(ra));
  const FF = RULES.extFace || 0, okF = (u, v) => E.filter(e => e.isF).every(e => dSeg([u, v], e.a, e.b) >= e.d + FF - 1e-6), okS = (u, v) => inPoly([u, v], ring) && E.filter(e => !e.isF).every(e => dSeg([u, v], e.a, e.b) >= e.d + FF - 1e-6);    
  for (const r of hall2) {  
    const smp = (lo, hi, st) => { const o = []; for (let x = lo; x < hi - 1e-9; x = r2(x + st)) o.push(x); o.push(hi); return o; };
    const as = smp(r[0], r[1], 0.1).filter(a => smp(r[2], r[3], 0.5).every(b => okF(...res.toUV(a, b))));
    if (!as.length) continue; let a0 = as[0], a1 = as[as.length - 1];
    const bs = smp(r[2], r[3], 0.1).filter(b => smp(a0, a1, 0.5).every(a => okS(...res.toUV(a, b))));
    if (!bs.length) continue; const q = [r2(a0), r2(a1), r2(bs[0]), r2(bs[bs.length - 1])]; if (ra(q) >= 0.5) out.push(q); }
  const after = sum(out.map(ra)), coreIn = (res.rooms[k] || []).filter(x => x.core && (x.stair || x.lift) && x.block === 'data centre' && x.r.some(r => !ok(...res.toUV((r[0] + r[1]) / 2, (r[2] + r[3]) / 2))));
  if (after < 50) return { fail: `second hall storey: the I-3 step-back above 18.3 m (front ${dF} m, sides ${dS} m) leaves no hall floor (${Math.round(after)} m²)` };
  return { r: out, m2Cut: r2(before - after), text: `I-3 step-back drawn on the second hall storey (top ${r2(top)} m, over 18.3 m; 3.1.2.3, 3.1.2.5): front ${dF} m and sides ${dS} m from the property line; the hall cut from ${Math.round(before)} to ${Math.round(after)} m²${coreIn.length ? `; ${coreIn.map(x => x.id.toUpperCase()).join(', ')} stand inside the step-back (a stair or lift over 18.3 m there: check with the City) (?)` : ''}` }; }
function addHall2(res, S) { if (!(RULES.hallStoreys > 1) || !res.rooms || res.fail || res.hall2) return; const R = res.rooms, sts = Object.keys(R).map(Number);
  const k = Math.max(...sts.filter(st => R[st].some(x => x.kind === 'hall'))); if (!isFinite(k)) return;
  const halls = R[k].filter(x => x.kind === 'hall'), hr = halls.flatMap(x => x.r), ov = (r, q) => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > 0.05 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > 0.05;
  if ((R[k + 1] || []).some(y => y.r.some(r => hr.some(q => ov(r, q))))) { res.fail = 'second hall storey: the floor over the hall is taken'; return; }
  const sec = (st, id, n, kind, rects, o) => room(st, id, n, kind === 'hall' ? 'hall' : 'sup', kind, rects, Object.assign({ block: 'data centre' }, o || {}));
  const D2 = [], shared = (A, B) => { let best = null; for (const r of A) for (const q of B) {
      if (Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(r[0] - q[1]) < 1e-6) { const at = Math.abs(r[1] - q[0]) < 1e-6 ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 1.2 && (!best || t - f > best.len)) best = { o: 'v', at, f, t, len: t - f }; }
      if (Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(r[2] - q[3]) < 1e-6) { const at = Math.abs(r[3] - q[2]) < 1e-6 ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 1.2 && (!best || t - f > best.len)) best = { o: 'h', at, f, t, len: t - f }; } } return best; };
  const dr = (st, a, ar, b, br, w) => { const sh = shared(ar, br); if (!sh) return false; const c = r2((sh.f + sh.t) / 2); D2.push(sh.o === 'v' ? [st, a, b, r2(sh.at), c, 'v', w || RULES.door.w] : [st, a, b, c, r2(sh.at), 'h', w || RULES.door.w]); return true; };
  const cores = R[k].filter(x => x.core && (x.stair || x.lift) && x.block !== 'hub' && x.block !== 'clinic' && x.block !== 'pool');
  const up = []; let hall2 = hr.map(r => r.slice());
  if (cores.filter(x => x.stair).length >= 2) {    
    cores.forEach(x => { const y = sec(k + 1, x.id, x.n, x.kind, x.r.map(r => r.slice()), { core: true, stair: x.stair || undefined, lift: x.lift || undefined }); up.push(y); });
  }
  else {    
    const big = hr.slice().sort((p, q) => ra(q) - ra(p))[0], SW = RULES.stair.w, SL = RULES.stair.l, E = RULES.e2, R1 = R[k];
    const touch = (side, f) => R1.filter(y => f(y) && y.r.some(q => side === 'a0' ? Math.abs(q[1] - big[0]) < 0.05 && Math.min(q[3], big[3]) - Math.max(q[2], big[2]) > SL : side === 'a1' ? Math.abs(q[0] - big[1]) < 0.05 && Math.min(q[3], big[3]) - Math.max(q[2], big[2]) > SL
      : side === 'b0' ? Math.abs(q[3] - big[2]) < 0.05 && Math.min(q[1], big[1]) - Math.max(q[0], big[0]) > SL : Math.abs(q[2] - big[3]) < 0.05 && Math.min(q[1], big[1]) - Math.max(q[0], big[0]) > SL))[0] || null;
    const outside = sd => !touch(sd, y => true) ? { id: 'OUT', r: null } : null;    
    const pas = {}; ['a0', 'a1', 'b0', 'b1'].forEach(sd => { pas[sd] = touch(sd, y => y.kind === 'exitpas') || outside(sd); });
    const pair = pas.a0 && pas.a1 ? ['a0', 'a1'] : pas.b0 && pas.b1 ? ['b0', 'b1'] : null; if (!pair) { res.fail = 'second hall storey: the hall at grade has no exit passage or outside wall on two opposite sides for its stairs'; return; }
    const cor = touch('b0', y => y.kind === 'scor') || touch('b1', y => y.kind === 'scor') || touch('a0', y => y.kind === 'scor') || touch('a1', y => y.kind === 'scor');
    const corSide = cor ? ['b0', 'b1', 'a0', 'a1'].find(sd => touch(sd, y => y === cor)) : null;
    const stairR = sd => sd === 'a0' ? [big[0], r2(big[0] + SW), r2(big[3] - SL), big[3]] : sd === 'a1' ? [r2(big[1] - SW), big[1], r2(big[3] - SL), big[3]] : sd === 'b0' ? [r2(big[1] - SL), big[1], big[2], r2(big[2] + SW)] : [r2(big[1] - SL), big[1], r2(big[3] - SW), big[3]];
    const sR = pair.map(stairR), eR = corSide === 'b0' ? [r2((big[0] + big[1] - E.l) / 2), r2((big[0] + big[1] + E.l) / 2), big[2], r2(big[2] + E.w)] : corSide === 'b1' ? [r2((big[0] + big[1] - E.l) / 2), r2((big[0] + big[1] + E.l) / 2), r2(big[3] - E.w), big[3]]
      : corSide === 'a0' ? [big[0], r2(big[0] + E.w), r2((big[2] + big[3] - E.l) / 2), r2((big[2] + big[3] + E.l) / 2)] : corSide === 'a1' ? [r2(big[1] - E.w), big[1], r2((big[2] + big[3] - E.l) / 2), r2((big[2] + big[3] + E.l) / 2)] : null;
    const cut = [sR[0], sR[1]].concat(eR ? [eR] : []);
    halls.forEach(h => { h.r = subAll(h.r, cut).filter(r => ra(r) >= 0.5); }); hall2 = subAll(hr, cut).filter(r => ra(r) >= 0.5);
    [[1, sR[0], pas[pair[0]]], [2, sR[1], pas[pair[1]]]].forEach(([i, r, P]) => { R1.push(sec(k, 'sh' + i, `Stair SH${i} (second hall storey), to its exit passage`, 'score', [r], { core: true, stair: true })); up.push(sec(k + 1, 'sh' + i, `Stair SH${i} (second hall storey)`, 'score', [r], { core: true, stair: true }));
      if (P.id === 'OUT') { const sd = pair[i - 1], half = RULES.door.w / 2; D2.push(sd === 'a0' || sd === 'a1' ? [k, 'sh' + i, 'OUT', sd === 'a0' ? r[0] : r[1], r2((r[2] + r[3]) / 2), 'v', RULES.door.w] : [k, 'sh' + i, 'OUT', r2((r[0] + r[1]) / 2), sd === 'b0' ? r[2] : r[3], 'h', RULES.door.w]); }
      else dr(k, 'sh' + i, [r], P.id, P.r); });
    if (eR) { R1.push(sec(k, 'eh2', 'Freight lift (second hall storey)', 'score', [eR], { core: true, lift: true })); up.push(sec(k + 1, 'eh2', 'Freight lift (second hall storey)', 'score', [eR], { core: true, lift: true })); dr(k, 'eh2', [eR], cor.id, cor.r, 1.5); } }
  const step = stepBack(res, S, k, hall2); if (step && step.fail) { res.fail = step.fail; return; } if (step) hall2 = step.r;
  const H2 = sec(k + 1, 'hall2', 'Data hall, second storey (6 m; a hall over a hall: floor load not in the tool, check in design)', 'hall', hall2);
   
  const low = [], base2 = Array.isArray(res.H) ? sum(res.H.slice(0, k)) : null;
  if (step && base2 != null && base2 + RULES.lowLink.h <= 18.3 + 1e-6) for (const y of up.slice()) { if (shared(y.r, hall2)) continue;
    if (y.lift) { up.splice(up.indexOf(y), 1);    
      const El = RULES.e2.l, Ew = RULES.e2.w, yc = [(y.r[0][0] + y.r[0][1]) / 2, (y.r[0][2] + y.r[0][3]) / 2], hk = R[k].filter(x => x.kind === 'hall').flatMap(x => x.r);
      const inA = (r, A) => A.some(q => r[0] >= q[0] - 1e-6 && r[1] <= q[1] + 1e-6 && r[2] >= q[2] - 1e-6 && r[3] <= q[3] + 1e-6);
      let eR = null; for (const q of hall2) for (const [a, b] of [[El, Ew], [Ew, El]]) for (const r of [[q[0], q[0] + a, q[2], q[2] + b], [q[1] - a, q[1], q[2], q[2] + b], [q[0], q[0] + a, q[3] - b, q[3]], [q[1] - a, q[1], q[3] - b, q[3]]].map(r => r.map(r2))) {
        if (!inA(r, hall2) || !inA(r, hk)) continue; const d = Math.hypot((r[0] + r[1]) / 2 - yc[0], (r[2] + r[3]) / 2 - yc[1]); if (!eR || d < eR.d) eR = { r, d }; }
      if (eR) { const r = eR.r; R[k].filter(x => x.kind === 'hall').forEach(h => { h.r = subAll(h.r, [r]).filter(q => ra(q) >= 0.5); }); hall2 = subAll(hall2, [r]).filter(q => ra(q) >= 0.5); H2.r = hall2;
        R[k].push(sec(k, 'e3', 'Freight lift E3 (between the hall storeys, inside the step-back)', 'score', [r], { core: true, lift: true })); const E3 = sec(k + 1, 'e3', 'Freight lift E3 (between the hall storeys, inside the step-back)', 'score', [r], { core: true, lift: true, low: true }); up.push(E3);
        const hkId = (R[k].find(x => x.kind === 'hall' && x.r.length) || {}).id; if (hkId) dr(k, 'e3', [r], hkId, R[k].find(x => x.id === hkId).r, 1.5); dr(k + 1, 'e3', [r], 'hall2', hall2, 1.5);
        low.push(`${y.id.toUpperCase()} stops at storey ${k} (its overrun would stand over 18.3 m in the step-back); freight lift E3 links the two hall storeys inside the stepped-back hall, costing ${r2(2 * ra(r))} m² of hall (${r2(ra(r))} m² a storey)`); }
      else { res.heightConditional = true; low.push(`${y.id.toUpperCase()} stops at storey ${k}: conditional: lift overrun above 18.3 m, Z&D 10.1.1(b), Director of Planning discretion (no place for a freight lift inside the stepped-back hall)`); }
      continue; }
    const c = y.r[0]; let lk = null;
    for (const q of hall2) { const oa = Math.min(c[1], q[1]) - Math.max(c[0], q[0]), ob = Math.min(c[3], q[3]) - Math.max(c[2], q[2]);
      const cand = oa >= 1.2 ? (c[3] <= q[2] + 1e-6 ? [Math.max(c[0], q[0]), Math.min(c[1], q[1]), c[3], q[2]] : c[2] >= q[3] - 1e-6 ? [Math.max(c[0], q[0]), Math.min(c[1], q[1]), q[3], c[2]] : null)
        : ob >= 1.2 ? (c[1] <= q[0] + 1e-6 ? [c[1], q[0], Math.max(c[2], q[2]), Math.min(c[3], q[3])] : c[0] >= q[1] - 1e-6 ? [q[1], c[0], Math.max(c[2], q[2]), Math.min(c[3], q[3])] : null) : null;
      if (cand && (!lk || ra(cand) < ra(lk))) lk = cand.map(r2); }
    if (!lk) continue;
    let vest = false; if (RULES.vestibule && RULES.vestibule.on) { const need = r2((RULES.vestibule.clear || 1.35) + RULES.vestibule.hallDoor), E6 = 1e-6, hw = RULES.door.w / 2 + 0.05;
       
      const horiz = Math.abs(lk[2] - c[3]) < E6 || Math.abs(lk[3] - c[2]) < E6, dir = horiz ? (Math.abs(lk[2] - c[3]) < E6 ? 1 : -1) : (Math.abs(lk[0] - c[1]) < E6 ? 1 : -1);
      const wall = horiz ? (dir > 0 ? c[3] : c[2]) : (dir > 0 ? c[1] : c[0]), lo = horiz ? c[0] : c[2], hi = horiz ? c[1] : c[3], s0 = horiz ? lk[0] : lk[2], s1 = horiz ? lk[1] : lk[3], gap = horiz ? lk[3] - lk[2] : lk[1] - lk[0];
      const mk = (f, t, d0, d1) => { const u = [Math.min(f, t), Math.max(f, t)], w = [Math.min(wall + dir * d0, wall + dir * d1), Math.max(wall + dir * d0, wall + dir * d1)]; return (horiz ? [u[0], u[1], w[0], w[1]] : [w[0], w[1], u[0], u[1]]).map(r2); };
      const onLand = (f, t) => (f <= lo + 0.05 + E6 && t >= lo + 2 * hw - E6) || (t >= hi - 0.05 - E6 && f <= hi - 2 * hw + E6);    
      const tries = onLand(s0, s1) ? [[s0, s1]] : (hi - s1 <= s0 - lo ? [[s0, hi], [lo, s1]] : [[lo, s1], [s0, hi]]), others = up.filter(z => z !== y).flatMap(z => z.r || []);
      for (const [f, t] of tries) { if (gap >= need - E6 && f === s0 && t === s1) { vest = true; break; }
        const whole = mk(f, t, 0, Math.max(need, gap)), deep = gap < need - E6 ? mk(f, t, gap, need) : null, hit = others.some(q => Math.min(q[1], whole[1]) - Math.max(q[0], whole[0]) > 0.05 && Math.min(q[3], whole[3]) - Math.max(q[2], whole[2]) > 0.05);
        if (hit || (deep && subAll([deep], hall2).some(q => ra(q) >= 0.01))) continue;
        hall2 = subAll(hall2, [whole]).filter(q => ra(q) >= 0.5); H2.r = hall2; lk = whole; vest = true; break; }
      if (!vest) { low.push(`${y.id.toUpperCase()}: no room for a ${need} m vestibule between it and the upper hall: no link drawn, the stair does not serve the upper hall storey (a sliver fails, project decision, 20 Nov)`); continue; } }
    const id = 'lk' + y.id, L1 = sec(k + 1, id, `${vest ? 'Vestibule' : 'Link'} to stair ${y.id.toUpperCase()} (low: top at ${r2(base2 + RULES.lowLink.h)} m, under the 18.3 m step-back line)`, 'scor', [lk], { corridor: true, low: true });
    up.push(L1); y.low = true; y.n = y.n + ` (stops at this floor: top ${r2(base2 + RULES.lowLink.h)} m)`; dr(k + 1, y.id, y.r, id, [lk]); dr(k + 1, id, [lk], 'hall2', hall2, 1.5);
    low.push(`${y.id.toUpperCase()} stops at the upper hall's floor (top ${r2(base2 + RULES.lowLink.h)} m), joined to the stepped-back hall by a ${r2(Math.max(lk[1] - lk[0], lk[3] - lk[2]))} m link of the same height`); }
  if (low.length) (res.flags || (res.flags = [])).push(`I-3 step-back, low stairs ( item 7; 3.1.2.5 applies to portions over 18.3 m; headroom 2.05 m and a 0.25 m roof, our reading): ${low.join('; ')}`);
  R[k + 1] = (R[k + 1] || []).concat(up, [H2]); up.forEach(y => { if ((y.stair || y.lift) && !y.low) dr(k + 1, y.id, y.r, 'hall2', hall2, y.lift ? 1.5 : null); });
  if (res.D && res.kind !== 'bigroom') res.D = res.D.concat(D2); if (res.Dbig) res.Dbig = res.Dbig.concat(D2); res.hall2D = D2;
  const h1 = sum(R[k].filter(x => x.kind === 'hall').map(x => sum(x.r.map(ra)))), h2 = sum(hall2.map(ra));
  res.MW = r2((h1 + h2) / HPM1() * 1000) / 1000; res.dcArea = r2((res.dcArea || 0) + h2 + sum(up.filter(y => y.st === k + 1).map(y => sum(y.r.map(ra))))); res.hall2 = { storey: k + 1, m2: r2(h2) };
  if (Array.isArray(res.H)) res.H = res.H.slice(0, k).concat([RULES.storeyH.hall]).concat(res.H.slice(k));
  if (step) (res.flags || (res.flags = [])).push(step.text);
  (res.flags || (res.flags = [])).push(`Second hall storey ( item 2): storey ${k + 1}, ${Math.round(h2)} m² of hall over the first (${Math.round(h1)} m²), ${res.MW.toFixed(2)} MW at ${HPM1()} m² a MW; no 2,325 m² floor cap (the "one hall storey" variant keeps it); a hall over a hall: floor load and structure not in the tool (check in design)`); }
 
 
function fillVoids(res, S, frozen, topUp) { if (!RULES.fillVoids || !res || !res.rooms || !res.rooms[1] || !S) return;
  const R = res.rooms, sts = Object.keys(R).map(Number).filter(n => n > 1).sort((a, b) => b - a); if (!sts.length) return;
  const T = res.toUV, FG = RULES.extFace || 0, edges = (S.edges || []).filter(e => (e.d || 0) > 0);
  const lotR = q => { const a = T(q[0], q[2]), c = T(q[1], q[3]); return [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])]; };
  const ptR = (p, r) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3]));
  const inYards = q => { if (!T) return false; const r = lotR(q); return edges.every(e => { const inR = p => p[0] >= r[0] && p[0] <= r[1] && p[1] >= r[2] && p[1] <= r[3]; if (inR(e.a) || inR(e.b)) return false;
    const d = Math.min(...[[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]].map(c => dSeg(c, e.a, e.b)), ptR(e.a, r), ptR(e.b, r)); return d - FG >= e.d - 1e-6; }); };
   
  const def = S.typDef || S.wingTyp || S.hubTyp || null, naIds = new Set(((def && def.constraints) || []).filter(c => c.type === 'nothingAbove').flatMap(c => [].concat(c.rooms || c.room || c.args || [])));
  const isNA = x => naIds.has(x.id) || naIds.has(x.prog) || !!x.sky || /(^|_)(pool_hall|spa_hall|therapy|learner|greenhouse|biome)/i.test(x.id || '');
  const BIG = 1e4, crt = res.truck && res.truck.court, way = crt ? [[-BIG, BIG, crt[2], crt[3]], [crt[0], crt[1], -BIG, BIG]] : [], skip = { na: 0, truck: 0 };
  const open = [].concat(((res.plant && res.plant.items) || []).filter(i => !i.roof && !i.up && i.r).map(i => i.r), res.truck && res.truck.court ? [res.truck.court] : [], S.sideDrive && S.sideDrive.r && !frozen ? [S.sideDrive.r] : []);        
   
  const E = envOf(S), ring = S.ring || []; let A = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) A += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); A = Math.abs(A) / 2;
  const grossNow = () => sum(Object.keys(R).map(st => unionArea(R[st].filter(x => x.kind !== 'bay').flatMap(x => x.r).map(r => [r[0] - FG, r[1] + FG, r[2] - FG, r[3] + FG]))));
  const perm = E && !E.missing && (E.fsr || [])[0]; let budget = perm && A > 0 ? perm * A - grossNow() : Infinity;
  const added = [];
   
  const piecesFor = (st, wayR) => { const below = st - 1, up = R[st].flatMap(x => x.r || []), low = (R[below] || []).flatMap(x => x.r || []), v = up.flatMap(r => subAll([r], low)).filter(r => ra(r) > 0.05);
    const naBelow = Object.keys(R).map(Number).filter(k => k < below).flatMap(k => R[k].filter(isNA).flatMap(x => x.r || [])), pcs = []; let na = 0, tr = 0;
    for (const r of v) {    
      let q = subAll([r], pcs); if (below === 1) q = subAll(q, open);
      const a0 = sum(q.map(ra)); q = subAll(q, naBelow); na += a0 - sum(q.map(ra));
      if (below === 1 && wayR.length) { const a1 = sum(q.map(ra)); q = subAll(q, wayR); tr += a1 - sum(q.map(ra)); }
      pcs.push(...q.filter(z => ra(z) > 0.05)); }
    const ok = []; let left = budget; for (const q of pcs) { if (!inYards(q)) continue; const a = ra(q); if (a > left + 1e-6) continue; left -= a; ok.push(q); }
    return { ok, na, tr, left }; };
  const fillRoom = (below, ok) => room(below, 'ufl' + below, 'Unassigned floor (under the storey above; project decision, 19 Nov 17:28)', 'spare', 'spare', ok, { block: (R[below][0] || {}).block || null, voidFill: true });
   
  const truckScore = () => { try { return truckRows(res, S).concat([gateRow(res, S)].filter(Boolean)).map(x => (x.status === 'fail' ? 1000 : 0) + ((String(x.why || '').match(/\b[gtch]\d+\b/g) || []).length)); } catch (e) { return null; } };
  let judged = null;
  for (const st of sts) { const below = st - 1; if (!R[below]) R[below] = [];
    let P = piecesFor(st, way);
    if (below === 1 && crt && RULES.fillJudged && P.tr > 0.5) { const s0 = truckScore(), P2 = piecesFor(st, []);    
      if (s0 && P2.ok.length) { R[1].push(fillRoom(1, P2.ok)); const s1 = truckScore(); R[1].pop();
        if (s1 && s1.length === s0.length && s1.every((x, i) => x <= s0[i])) { P = P2; judged = 'kept'; } else judged = 'refused'; } }
    budget = P.left; skip.na += P.na; skip.truck += P.tr;
    if (P.ok.length) { const had = R[below].find(x => x.voidFill && x.id === 'ufl' + below); if (had) had.r.push(...P.ok.map(r => r.map(r2))); else R[below].push(fillRoom(below, P.ok)); added.push({ st: below, m2: r2(sum(P.ok.map(ra))) }); } }
  if (judged) (res.flags || (res.flags = [])).push(judged === 'kept' ? 'Void fill beside the truck court kept: the truck rows and the plant-yard gate row are no worse with it (fillJudged, 20 Nov)' : 'Void fill beside the truck court refused: a truck row or the plant-yard gate row is worse with it; the cautious fill stands (fillJudged, 20 Nov)');
  const sk = [skip.na > 0.5 ? `unassigned floor over a wet/sky hall: ${r2(skip.na)} m² not filled` : null, skip.truck > 0.5 ? `fill closes truck court exit: ${r2(skip.truck)} m² not filled` : null].filter(Boolean);
  if (sk.length) { res.voidSkip = sk; (res.flags || (res.flags = [])).push(`Voids left open (; the storey above is clipped back): ${sk.join('; ')}`); }
  if (!added.length) return; res.voidFill = (res.voidFill || []).concat(added);
  (res.flags || (res.flags = [])).push(`${topUp ? 'Unassigned floor added under the stair-door landing bays (after the doors were placed)' : 'Unassigned floor under the storey above'} (project decision, 19 Nov 17:28): ${added.map(a => `storey ${a.st} ${a.m2} m²`).join('; ')}; counts toward FAR, drawn solid, no use yet`); }
 
 
function wetSideSwap(res, S) { if (RULES.planMode !== 'zones' || !res || !res.rooms || !res.rooms[1]) return; const typ = String(S._typology || (S.typDef && S.typDef.id) || '');
  if (!/community_pool|warm_bath|heat_cascade/.test(typ)) return;
  const R1 = res.rooms[1], A = x => sum((x.r || []).map(ra)), head = x => String(x.n || '').split('(')[0];
  const txt = x => (x.id || '') + ' ' + head(x), isDCx = x => x.block === 'data centre' || !!x.dcSide || x.g === 'sup' || x.g === 'hall';
  const core = x => /pool|deck|steam|sauna|plunge|whirl|change|changing|spa_hall|therapy_hall|shower/i.test(txt(x)) && !/plant|mech|stor|chlor|acid|office|gallery|view|staff/i.test(txt(x));
  const cor = R1.filter(x => !isDCx(x) && !x.stair && !x.lift && (x.corridor || /cor$/.test(x.kind || '') || /corridor/i.test(head(x)))).sort((a, b) => A(b) - A(a))[0]; if (!cor) return;
  const big = cor.r.reduce((a, b) => ra(b) > ra(a) ? b : a, cor.r[0]), alongU = (big[1] - big[0]) >= (big[3] - big[2]), mid = alongU ? (big[2] + big[3]) / 2 : (big[0] + big[1]) / 2;
  const touchR = (r, q) => { const du = Math.min(r[1], q[1]) - Math.max(r[0], q[0]), dv = Math.min(r[3], q[3]) - Math.max(r[2], q[2]); return (du > -1e-6 && dv > 0.3) || (dv > -1e-6 && du > 0.3); };
  const side = x => { const r = x.r.reduce((a, b) => ra(b) > ra(a) ? b : a, x.r[0]), c = alongU ? (r[2] + r[3]) / 2 : (r[0] + r[1]) / 2; return c < mid ? 'a' : 'b'; };
  const next = R1.filter(x => x !== cor && !x.stair && !x.lift && !isDCx(x) && x.kind !== 'bay' && x.g !== 'load' && (x.r || []).some(r => cor.r.some(q => touchR(r, q))));
  const cs = next.filter(core); if (!cs.length) return; const cnt = { a: 0, b: 0 }; cs.forEach(x => cnt[side(x)] += A(x)); const wet = cnt.a >= cnt.b ? 'a' : 'b';
  const done = [], used = new Set();
  for (const x of cs.filter(y => side(y) !== wet)) { const ax = A(x), y = next.filter(z => side(z) === wet && !core(z) && !used.has(z) && A(z) >= 0.6 * ax && A(z) <= 2.5 * ax).sort((p, q) => Math.abs(A(p) - ax) - Math.abs(A(q) - ax))[0]; if (!y) { done.push(x.id + ': no similar room on the wet side to swap with'); continue; }
    used.add(y); const KEYS = ['id', 'n', 'g', 'kind', 'prog', 'block', 'perPersonM2', 'fx', 'wc', 'genderNeutral'], tx = {}, ty = {}; KEYS.forEach(k => { tx[k] = x[k]; ty[k] = y[k]; });
    const ix = x.id, iy = y.id, TMP = '__swap__'; ['D', 'Dbig'].forEach(k => { if (res[k]) res[k].forEach(d => { if (+d[0] !== 1) return; for (const j of [1, 2]) { if (d[j] === ix) d[j] = TMP; } for (const j of [1, 2]) { if (d[j] === iy) d[j] = ix; } for (const j of [1, 2]) { if (d[j] === TMP) d[j] = iy; } }); });
    KEYS.forEach(k => { if (ty[k] === undefined) delete x[k]; else x[k] = ty[k]; if (tx[k] === undefined) delete y[k]; else y[k] = tx[k]; });
    done.push(ix + ' swapped with ' + iy + ' (now on the wet side)'); }
  if (done.length) (res.flags || (res.flags = [])).push('Wet side (project decision, 20a): ' + done.join('; ')); }
function compactFill(res, S, frozen) { if (!RULES.compactFill || !res || !res.rooms || !res.rooms[1] || !S || !res.toUV) return;
  const R = res.rooms, sts = Object.keys(R).map(Number).sort((a, b) => a - b), T = res.toUV, FG = RULES.extFace || 0, edges = (S.edges || []).filter(e => (e.d || 0) > 0);
  const lotR = q => { const a = T(q[0], q[2]), c = T(q[1], q[3]); return [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])]; };
  const ptR = (p, r) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3]));
  const inYards = q => { const r = lotR(q); return edges.every(e => { const inR = p => p[0] >= r[0] && p[0] <= r[1] && p[1] >= r[2] && p[1] <= r[3]; if (inR(e.a) || inR(e.b)) return false;
    const d = Math.min(...[[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]].map(c => dSeg(c, e.a, e.b)), ptR(e.a, r), ptR(e.b, r)); return d - FG >= e.d - 1e-6; }); };
  const def = S.typDef || S.wingTyp || S.hubTyp || null, naIds = new Set(((def && def.constraints) || []).filter(c => c.type === 'nothingAbove').flatMap(c => [].concat(c.rooms || c.room || c.args || [])));
  const isNA = x => naIds.has(x.id) || naIds.has(x.prog) || !!x.sky || /(^|_)(pool_hall|spa_hall|therapy|learner|greenhouse|biome)/i.test(x.id || '');
  const isDC = x => x.block === 'data centre' || !!x.dcSide || x.g === 'sup' || x.g === 'hall' || x.kind === 'hall';
  const isPubCirc = x => !isDC(x) && !x.staffOnly && !x.stair && !x.lift && x.kind !== 'shaft' && (x.g === 'circ' || !!x.corridor || /cor$/.test(x.kind || '') || /corridor|lobby|passage/i.test(String(x.n || '').split('(')[0]));
  const isDCdoor = x => isDC(x) && !x.stair && !x.lift && x.kind !== 'shaft' && !/shaft|riser/i.test(String(x.n || '')) && (x.g === 'hall' || x.kind === 'hall' || !!x.corridor || /cor$/.test(x.kind || '') || /corridor|lobby|vestibule|dock/i.test(String(x.n || '').split('(')[0]));    
  const wall = (A, B) => { let best = null; for (const r of A) for (const q of B) {
      if (Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(r[0] - q[1]) < 1e-6) { const at = Math.abs(r[1] - q[0]) < 1e-6 ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 1.0 && (!best || t - f > best.len)) best = { o: 'v', at, f, t, len: t - f }; }
      if (Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(r[2] - q[3]) < 1e-6) { const at = Math.abs(r[3] - q[2]) < 1e-6 ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 1.0 && (!best || t - f > best.len)) best = { o: 'h', at, f, t, len: t - f }; } } return best; };
  const wallAny = (A, B) => { let L = 0; for (const r of A) for (const q of B) { if (Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(r[0] - q[1]) < 1e-6) L += Math.max(0, Math.min(r[3], q[3]) - Math.max(r[2], q[2])); if (Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(r[2] - q[3]) < 1e-6) L += Math.max(0, Math.min(r[1], q[1]) - Math.max(r[0], q[0])); } return L > 0.3 ? L : 0; };
  const touch = (r, q) => { const du = Math.min(r[1], q[1]) - Math.max(r[0], q[0]), dv = Math.min(r[3], q[3]) - Math.max(r[2], q[2]); return (du > -1e-6 && dv > 0.3) || (dv > -1e-6 && du > 0.3); };
  const crt = res.truck && res.truck.court, open = [].concat(((res.plant && res.plant.items) || []).filter(i => !i.roof && !i.up && i.r).map(i => i.r), crt ? [crt] : [], S.sideDrive && S.sideDrive.r && !frozen ? [S.sideDrive.r] : []);
  const bld1 = R[1].filter(x => x.g !== 'load' && x.kind !== 'bay').flatMap(x => x.r || []); if (!bld1.length) return;
  const bb = [Math.min(...bld1.map(r => r[0])), Math.max(...bld1.map(r => r[1])), Math.min(...bld1.map(r => r[2])), Math.max(...bld1.map(r => r[3]))];
  const E = envOf(S), ring = S.ring || []; let A = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) A += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); A = Math.abs(A) / 2;
  const grossNow = () => sum(Object.keys(R).map(st => unionArea(R[st].filter(x => x.kind !== 'bay').flatMap(x => x.r).map(r => [r[0] - FG, r[1] + FG, r[2] - FG, r[3] + FG]))));
  const perm = E && !E.missing && (E.fsr || [])[0]; let budget = perm && A > 0 ? perm * A - grossNow() : Infinity; const far0 = A > 0 ? r2(grossNow() / A) : null;
  const tot = { pub: 0, dc: 0, left: 0, overFAR: 0, merged: 0, passage: 0, notBuilt: 0 }, made = [], DD = [];
  for (const st of sts) {
     
    const spare = R[st].filter(x => x.g === 'spare'), spareR = spare.flatMap(x => x.r || []); if (spare.length) { const ids = new Set(spare.map(x => x.id)); R[st] = R[st].filter(x => !ids.has(x.id)); ['D', 'Dbig'].forEach(k => { if (res[k]) res[k] = res[k].filter(d => !(+d[0] === st && (ids.has(d[1]) || ids.has(d[2])))); }); }
    const base = st === sts[0] ? [bb] : subAll([bb], subAll([bb], (R[st - 1] || []).flatMap(x => x.r || [])));
    let holes = subAll(base, R[st].flatMap(x => x.r || []));
    if (st === sts[0]) holes = subAll(holes, open);
    if (st === sts[0] && crt) { const BIG = 1e4, strips = [[-BIG, BIG, crt[2], crt[3]], [crt[0], crt[1], -BIG, BIG]], inSp = subAll(holes, subAll(holes, spareR)), safe = subAll(subAll(holes, strips), spareR).concat(inSp), inWay = subAll(subAll(holes, safe), spareR).filter(q => ra(q) >= 0.5);    
       
      const score = () => { try { return truckRows(res, S).concat([gateRow(res, S)].filter(Boolean)).map(x => (x.status === 'fail' ? 1000 : 0) + ((String(x.why || '').match(/\b[gtch]\d+\b/g) || []).length)); } catch (e) { return null; } };
      let keepWay = false; if (inWay.length) { const s0 = score(); R[st].push(room(st, '_tmpway', '', 'spare', 'spare', inWay)); const s1 = score(); R[st].pop(); keepWay = !!(s0 && s1 && s1.length === s0.length && s1.every((x, i) => x <= s0[i])); }
      holes = keepWay ? holes : safe; if (inWay.length) tot.wayJudged = keepWay ? 'kept' : 'refused'; }    
    const naBelow = sts.filter(k => k < st).flatMap(k => R[k].filter(isNA).flatMap(x => x.r || [])); { const oldNA = subAll(holes, subAll(holes, spareR)); holes = subAll(subAll(holes, naBelow), spareR).concat(oldNA); }    
    holes = holes.filter(q => ra(q) >= 0.5 && Math.min(q[1] - q[0], q[3] - q[2]) >= 0.3);
    const ok = []; for (const q of holes) { const a = ra(q), had = a - subAll([q], spareR).reduce((t, z) => t + ra(z), 0);    
      if (had > 0.5 * a) { ok.push(q.map(r2)); continue; }    
      if (!inYards(q)) continue; if (a > budget + 1e-6) { tot.overFAR += a; continue; } budget -= a; ok.push(q.map(r2)); }
     
    if (st === sts[0] && ok.length) { const inAny = (p, rs) => rs.some(r => p[0] > r[0] - 1e-6 && p[0] < r[1] + 1e-6 && p[1] > r[2] - 1e-6 && p[1] < r[3] + 1e-6);
      for (const k of ['D', 'Dbig']) { if (!res[k]) continue; for (const d of res[k]) { if (+d[0] !== st || (d[1] !== 'OUT' && d[2] !== 'OUT')) continue; const own = R[st].find(x => x.id === (d[1] === 'OUT' ? d[2] : d[1])); if (!own) continue;
        const v = d[5] === 'v', x0 = +d[3], y0 = +d[4], w = +d[6] || RULES.door.w, W = Math.max(1.1, w + 0.2), inOwn = p => (own.r || []).some(r => p[0] > r[0] && p[0] < r[1] && p[1] > r[2] && p[1] < r[3]);
        const sgn = v ? (inOwn([x0 - 0.2, y0]) ? 1 : -1) : (inOwn([x0, y0 - 0.2]) ? 1 : -1), pt = t => v ? [x0 + sgn * t, y0] : [x0, y0 + sgn * t];
        if (!inAny(pt(0.2), ok)) continue;    
        let t = 0.2; while (t < 80 && inAny(pt(t), ok)) t += 0.1; const L = r2(t - 0.1 + 0.1);
        const rect = (v ? [Math.min(x0, x0 + sgn * L), Math.max(x0, x0 + sgn * L), y0 - W / 2, y0 + W / 2] : [x0 - W / 2, x0 + W / 2, Math.min(y0, y0 + sgn * L), Math.max(y0, y0 + sgn * L)]).map(r2);
        const cut = subAll([rect], ok).reduce((a, q) => a + ra(q), 0), above = (R[st + 1] || []).flatMap(x => x.r || []).reduce((a, q) => a + subAll([rect], subAll([rect], [q])).reduce((b, z) => b + ra(z), 0), 0);
        const inter = (A, B) => subAll(A, subAll(A, B)), oldHere = inter(inter(ok, [rect]), spareR).reduce((a, q) => a + ra(q), 0);
        if (above < 0.5 && oldHere < 0.5) { ok.splice(0, ok.length, ...subAll(ok, [rect]).filter(q => ra(q) >= 0.5)); continue; }        
        if (cut > 0.2) { const keepOld = inter(inter(ok, [rect]), spareR); ok.splice(0, ok.length, ...subAll(ok, [rect]).filter(q => ra(q) >= 0.5), ...keepOld); tot.left += 0; (res.flags || (res.flags = [])).push('Compact fill: the ground in front of ' + own.id + "'s exterior door left open (a passage to the outside would cross a room)"); continue; }
        ok.splice(0, ok.length, ...subAll(ok, [rect]).filter(q => ra(q) >= 0.05)); const id = 'xpas' + st + '_' + own.id;
        R[st].push(room(st, id, 'Exit passage to the outside (protected; from ' + String(own.n || own.id).split('(')[0].trim() + '; project decision, 20 Nov project decision)', 'circ', 'pcor', [rect], { corridor: true, block: own.block || null, compact: true }));
        if (d[1] === 'OUT') d[1] = id; else d[2] = id; const xe = v ? r2(x0 + sgn * L) : x0, ye = v ? y0 : r2(y0 + sgn * L);
        DD.push(v ? [st, id, 'OUT', xe, y0, 'v', w] : [st, id, 'OUT', x0, ye, 'h', w]); tot.passage += ra(rect); } } }
     
    const seen = new Array(ok.length).fill(false), groups = []; for (let i = 0; i < ok.length; i++) { if (seen[i]) continue; const g = [i]; seen[i] = true; for (let k = 0; k < g.length; k++) for (let j = 0; j < ok.length; j++) if (!seen[j] && touch(ok[g[k]], ok[j])) { seen[j] = true; g.push(j); } groups.push(g.map(i => ok[i])); }
    let n = 0; for (const g of groups) { const a = sum(g.map(ra)); if (a < 0.05) continue; const hadG = a - subAll(g, spareR).reduce((t, z) => t + ra(z), 0);
       
      if (Math.max(...g.map(q => Math.min(q[1] - q[0], q[3] - q[2]))) < 1.5 || a < 4) { const nb = R[st].filter(x => !x.stair && !x.lift && !x.core && x.kind !== 'shaft' && x.g !== 'hall' && x.kind !== 'hall' && x.g !== 'load' && x.kind !== 'bay' && x.g !== 'circ' && !x.corridor && !/cor$/.test(x.kind || '') && !/shaft|riser/i.test(String(x.n || ''))).map(x => ({ x, w: wallAny(g, x.r) })).filter(z => z.w).sort((p, q) => q.w - p.w)[0];
        if (nb) { nb.x.r = nb.x.r.concat(g); tot.merged += a; continue; } }
      if (a < 1.0) continue; n++;
      const pubs = R[st].filter(isPubCirc).map(x => ({ x, w: wall(g, x.r) })).filter(z => z.w).sort((p, q) => q.w.len - p.w.len);
      const dcs = R[st].filter(isDCdoor).map(x => ({ x, w: wall(g, x.r) })).filter(z => z.w).sort((p, q) => (/cor$/.test(q.x.kind || '') ? 1 : 0) - (/cor$/.test(p.x.kind || '') ? 1 : 0) || q.w.len - p.w.len);
      if (!pubs[0] && !dcs[0] && hadG < 0.5 * a) { tot.notBuilt += a; budget += a; continue; }    
       
      const zl = (RULES.planMode === 'zones' || RULES.compactAlways) && !pubs[0] && !dcs[0], pubTouch = zl && R[st].some(y => !isDC(y) && !y.stair && !y.lift && y.kind !== 'shaft' && (y.g === 'pub' || y.g === 'clin' || isPubCirc(y)) && wallAny(g, y.r));
      const pick = pubs[0] || dcs[0] || (zl ? { x: { id: null, block: null }, w: null } : null), pub = !!pubs[0] || pubTouch, id = (pub ? 'flex' : pick ? 'dcst' : 'ulf') + st + '_' + n;
      const x = room(st, id, pub ? 'Flexible community space (remaining floor; project decision, 20 Nov project decision)' : pick ? 'Data-centre storage (remaining floor on the data-centre side; project decision, 20 Nov project decision)' : 'Unassigned floor (no door to circulation possible)', pub ? 'pub' : pick ? 'sup' : 'spare', pub ? 'proom' : pick ? 'sroom' : 'spare', g, pub ? { block: pick.x.block || null, compact: true } : pick ? { block: 'data centre', compact: true } : { compact: true, voidFill: true });
      R[st].push(x); tot[pub ? 'pub' : pick ? 'dc' : 'left'] += a; made.push('storey ' + st + ' ' + (pub ? 'flex' : pick ? 'DC storage' : 'unassigned') + ' ' + r2(a) + ' m²');
      if (pick && pick.w) { const w = pick.w, c = r2((w.f + w.t) / 2), d = w.o === 'v' ? [st, id, pick.x.id, r2(w.at), c, 'v', RULES.door.w] : [st, id, pick.x.id, c, r2(w.at), 'h', RULES.door.w]; DD.push(d); } } }
  if (DD.length) { if (res.D) res.D = res.D.concat(DD); if (res.Dbig) res.Dbig = res.Dbig.concat(DD); }
  res.compact = { pub: r2(tot.pub), dc: r2(tot.dc), left: r2(tot.left), merged: r2(tot.merged), passage: r2(tot.passage), notBuilt: r2(tot.notBuilt), overFAR: r2(tot.overFAR), farBefore: far0, farAfter: A > 0 ? r2(grossNow() / A) : null };
  if (made.length || tot.overFAR > 0.5) (res.flags || (res.flags = [])).push(`Compact fill (project decision, 20 Nov 13:31, project decision): flexible community space ${r2(tot.pub)} m², data-centre storage ${r2(tot.dc)} m²${tot.left > 0.5 ? `, unassigned (no door possible) ${r2(tot.left)} m²` : ''}; FAR ${res.compact.farBefore} → ${res.compact.farAfter}${tot.overFAR > 0.5 ? `; compact fill exceeds FAR: ${r2(tot.overFAR)} m² left open` : ''}`); }
function clipUpper(res) { if (!RULES.clipUpper || !res || !res.rooms || !res.rooms[1]) return;
  const g = res.rooms[1].flatMap(x => x.r || []); if (!g.length) return;
  const all = Object.values(res.rooms).flat().flatMap(x => x.r || []), bb = [Math.min(...all.map(r => r[0])) - 1, Math.max(...all.map(r => r[1])) + 1, Math.min(...all.map(r => r[2])) - 1, Math.max(...all.map(r => r[3])) + 1];
  const cut = [];
  let hall0 = 0, hall1 = 0, dc0 = 0, dc1 = 0;
   
  for (const st of Object.keys(res.rooms).map(Number).filter(n => n > 1).sort((a, b) => a - b)) {
    const outside = subAll([bb], (res.rooms[st - 1] || []).flatMap(x => x.r || [])).filter(r => ra(r) > 1e-4);
    for (const x of res.rooms[st]) { const a0 = sum((x.r || []).map(ra)); if (x.g === 'hall') hall0 += a0; if (x.block === 'data centre' || x.dcSide) dc0 += a0;
      const r1 = subAll(x.r || [], outside).filter(r => ra(r) > 0.01), a1 = sum(r1.map(ra)); if (x.g === 'hall') hall1 += a1; if (x.block === 'data centre' || x.dcSide) dc1 += a1;
      if (a0 - a1 > 0.5) cut.push({ st, id: x.id, n: x.n, m2: r2(a0 - a1) }); x.r = r1; }
    res.rooms[st] = res.rooms[st].filter(x => x.r && x.r.length); }
  if (!cut.length) return;
  res.clipped = cut;
  if (hall0 > 0 && hall1 < hall0 - 0.5 && res.MW) { const f = hall1 / hall0; res.MW = r2(res.MW * f * 1000) / 1000; if (res.mwUsed) res.mwUsed = res.MW; }
  if (res.dcArea && dc0 > dc1) res.dcArea = r2(res.dcArea - (dc0 - dc1));
  const tot = r2(sum(cut.map(c => c.m2)));
  (res.flags || (res.flags = [])).push(`Upper storeys clipped to the storey below (project decision, 19 Nov 13:12, 17:28): ${tot} m² that stood over open ground, the truck court or a void left open is not built (${cut.slice(0, 6).map(c => `storey ${c.st} ${String(c.n || c.id).split(' (')[0].toLowerCase()} ${c.m2} m²`).join('; ')}${cut.length > 6 ? '; …' : ''})${hall1 < hall0 - 0.5 ? `; the data hall loses ${r2(hall0 - hall1)} m²` : ''}`); }
function finish(res, S) { markStaffOnly(res, S); addHall2(res, S);
  if (res.kind === 'bigroom') { if (res.rooms) for (const st of Object.keys(res.rooms)) res.rooms[st] = res.rooms[st].filter(x => x.r && x.r.length); res.D = res.Dbig || []; plantDoors(res, S); analyse(res, S); return; }        
  if (res.rooms) for (const st of Object.keys(res.rooms)) res.rooms[st] = res.rooms[st].filter(x => x.r && x.r.length);    
  const L = res, van = S.city === 'van', R = L.rooms, D = (res.hall2D || []).slice(), dW = RULES.door.w, sW = RULES.street.w;    
  const by = (st, id) => (R[st] || []).find(x => x.id === id);
   
  function shared(A, B) { let best = null;
    for (const r of A.r) for (const q of B.r) {
      if (Math.abs(r[1] - q[0]) < 1e-6 || Math.abs(r[0] - q[1]) < 1e-6) { const at = Math.abs(r[1] - q[0]) < 1e-6 ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'v', at, f, t, len: t - f }; }
      if (Math.abs(r[3] - q[2]) < 1e-6 || Math.abs(r[2] - q[3]) < 1e-6) { const at = Math.abs(r[3] - q[2]) < 1e-6 ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 0.5 && (!best || t - f > best.len)) best = { o: 'h', at, f, t, len: t - f }; } }
    return best; }
  const door = (st, a, b, t, w) => { const A = by(st, a), B = by(st, b); if (!A || !B) return; const s = shared(A, B); if (!s || s.len < (w || dW) + 0.1) { L.flags.push(`No shared wall for a door: ${A.n} – ${B.n} (storey ${st}) (?)`); return; }
    const half = (w || dW) / 2, c = r2(Math.min(s.t - half - 0.05, Math.max(s.f + half + 0.05, s.f + (s.t - s.f) * (t == null ? 0.5 : t))));
    D.push(s.o === 'v' ? [st, a, b, r2(s.at), c, 'v', w || dW] : [st, a, b, c, r2(s.at), 'h', w || dW]); };
   
  const ext = (st, a, side, t, w, k) => { const A = by(st, a); if (!A) return; { const o = A.extOverride && A.extOverride[side + '/' + (k || 0)]; if (o) { if (o.flag) ((L.flags) || (L.flags = [])).push(o.flag); if (o.none) return; if (o.via) return door(st, a, o.via, 0.5, w); side = o.side || side; t = o.t != null ? o.t : t; k = o.k != null ? o.k : k; } }     const r = A.r[k || 0], half = (w || dW) / 2;
    if (side === 'a0' || side === 'a1') { const at = side === 'a0' ? r[0] : r[1], c = r2(Math.min(r[3] - half - 0.05, Math.max(r[2] + half + 0.05, r[2] + (r[3] - r[2]) * t))); D.push([st, a, 'OUT', at, c, 'v', w || dW]); }
    else { const at = side === 'b0' ? r[2] : r[3], c = r2(Math.min(r[1] - half - 0.05, Math.max(r[0] + half + 0.05, r[0] + (r[1] - r[0]) * t))); D.push([st, a, 'OUT', c, at, 'h', w || dW]); } };
  const W = L.W;
  if (L.plantUp) {
     
    ext(1, 'lob', 'a0', 0.5, sW); door(1, 'lob', 'cor', 0.5, sW); door(1, 'lob', 'ref', 0.5); door(1, 'ref', 'cor', 0.9); door(1, 'pmec', 'cor', 0.5); door(1, 'ref', 'pas', 0.5); ext(1, 'pas', 'a0', 0.5);
    if (by(1, 'shel')) door(1, 'shel', 'ref', 0.5);
    if (by(1, 'off')) { if (by(1, 'off').r[0][0] < 1e-6) { door(1, 'off', 'lob', 0.5); door(1, 'fa', 'off', 0.5); } else { const f0 = L.flags.length, n0 = D.length; door(1, 'off', 'lob', 0.5); if (D.length === n0) { L.flags.length = f0; door(1, 'off', 'cor', 0.5); } } }
    ['wcw', 'wcm', 'uwc', 'sho', 'cot', 'fa'].forEach(id => { const X = by(1, id); if (!X || X.r[0][0] < 1e-6) return; const n0 = D.length, f0 = L.flags.length; door(1, id, 'ref', 0.5); if (D.length === n0 && by(1, 'shel')) { L.flags.length = f0; door(1, id, 'shel', 0.5); } });
    door(1, 's1', 'pas1', 0.5); ext(1, 'pas1', 'a0', 0.5); door(1, 's2', 'pas2', 0.5); ext(1, 'pas2', 'a1', 0.5);
    ext(1, 'ves', 'a1', 0.5); door(1, 'ves', 'dock', 0.5); door(1, 'dock', 'e2', 0.5);
    { const b1 = by(1, 'b1'); if (b1) door(1, 'dock', 'b1', 0.5, 1.8); }
    R[1].filter(x => x.alcove).forEach(x => ext(1, x.id, x.face, 0.5, Math.min(3.0, r2(x.r[0][3] - x.r[0][2] - 0.2))));
     
    door(2, 's1', 'dcor', 0.1); door(2, 's2', 'dcor', 0.5); door(2, 'e2', 'dcor', 0.5); door(2, 'gen', 'dcor', 0.5, 1.5);
    { const s2 = by(2, 's2'), dc = by(2, 'dcor'), q = s2 && s2.r[0];    
      if (q && dc) for (const c of dc.r) { const f = Math.max(c[2], q[2]), t = Math.min(c[3], q[3]); if (Math.abs(c[1] - q[0]) < 1e-6 && t - f >= 1.0) { D.push([2, 's2', 'dcor', r2(q[0]), r2((f + t) / 2), 'v', dW]); break; } } }
    R[2].filter(x => (x.kind === 'sroom' || x.kind === 'spare') && x.id !== 'gen').forEach(x => door(2, x.id, 'dcor', 0.5));
     
    door(3, 'hall', 's1', 0.5); door(3, 'hall', 's2', 0.5); (by(3, 'e2l') ? (door(3, 'hall', 'e2l', 0.5, 1.5), door(3, 'e2l', 'e2', 0.5, 1.5)) : door(3, 'hall', 'e2', 0.5, 1.5));
    if (by(3, 'scor')) { door(3, 'scor', 's2', 1.0); door(3, 'scor', 'e2', 0.5); }
    R[3].filter(x => x.opens).forEach(x => { door(3, x.id, x.opens, 0.5); if (x.hallToo && x.opens !== 'hall') door(3, x.id, 'hall', 0.5); });
    R[3].filter(x => x.kind === 'sroom' && !x.opens).forEach(x => door(3, x.id, 'hall', 0.5));
  } else if (L.narrow) {
     
    const dv = L.narrow.drive;
    ext(1, 'lob', 'a0', 0.5, sW); door(1, 'lob', 'cor', 0.5); ext(1, 'ref', 'a0', 0.6, sW); door(1, 'ref', 'lob', 0.5); door(1, 'ref', 'cor', 0.9); if (by(1, 'shel')) door(1, 'shel', 'cor', 0.5);
    ext(1, 's1', 'a0', 0.5);
    ['wcw', 'wcm', 'uwc', 'sho', 'fa', 'off', 'cot', 'pmec', 'sspare'].forEach(id => { if (by(1, id)) door(1, id, 'cor', 0.5); });
    door(1, 'pas', 'cor', 0.5); if (dv) ext(1, 'pas', 'b1', 0.5); else ext(1, 'pas', 'a1', 0.5, null, 1);
    door(1, 'dock', 'e2', 0.5); door(1, 'ves', 'dock', 0.5);        
    if (dv) { ext(1, 'ves', 'b1', 0.5); ext(1, 's2', 'b1', 0.5); } else { ext(1, 'ves', 'a1', L.narrow.vesT); ext(1, 's2', 'a1', 0.5); }
    const bays = R[1].filter(x => x.kind === 'bay'); if (bays.length) door(1, 'dock', bays[0].id, 0.5, 1.8);
    door(2, 's1', 'dcor', 0.5); door(2, 's2', 'dcor', 0.5); door(2, 'e2', 'dcor', 0.5);
    R[2].filter(x => x.kind === 'sroom' && x.id !== 'stag' && x.id !== 'ship' || (x.kind === 'spare' && x.dcSide)).forEach(x => door(2, x.id, 'dcor', 0.5));
    if (by(2, 'stag')) { door(2, 'stag', 'e2', 0.5); door(2, 'stag', 's2', 0.5); door(2, 'ship', 'e2', 0.5); door(2, 'ship', 'stag', 0.5); }     else { door(2, 'ship', 's2', 0.5); door(2, 'ship', 'e2', 0.5); }
    door(3, 'hall', 's1', 0.5); door(3, 'hall', 's2', 0.5); (by(3, 'e2l') ? (door(3, 'hall', 'e2l', 0.5), door(3, 'e2l', 'e2', 0.5)) : door(3, 'hall', 'e2', 0.5));
  } else if (L.kind === 'stacked') {
     
    ext(1, 'lob', 'a0', 0.5, sW); door(1, 'lob', 'cor', 0.5); ext(1, 'ref', 'a0', 0.5, sW); door(1, 'ref', 'cor', 0.5); if (by(1, 'shel')) { door(1, 'shel', 'cor', 0.5); ext(1, 'shel', 'a0', 0.5, sW); }
    ext(1, 'cor', 'b0', 0.5, sW);   
    ['wcw', 'wcm', 'uwc', 'sho', 'fa', 'off', 'cot', 'pmec', 'e1', 'p2', 'p1'].forEach(id => door(1, id, 'cor', 0.5));
    if (by(1, 'ref2')) { door(1, 'ref2', 'cor', 0.5); }
    ext(1, 'p2', 'b0', 0.12); ext(1, 'p1', 'b1', 0.12);
    ext(1, 's1', 'b0', 0.88); ext(1, 's2', 'b1', 0.88);
    door(1, 'ves', 'dock', 0.5); ext(1, 'ves', 'a1', 0.5); door(1, 'dock', 'e2', 0.5); ext(1, 'dock', 'a1', 0.5, 1.8, 0);    
    R[1].filter(x => x.kind === 'bay').slice(-1).forEach(x => door(1, 'dock', x.id, 0.5, 1.8));
     
    R[2].filter(x => x.st === 2 && (x.kind === 'croom' || (x.kind === 'spare' && !x.dcSide && x.r[0][0] < L.aB - 0.01) || x.id === 'e1' || x.id === 'p1' || x.id === 'p2')).forEach(x => x.via ? door(2, x.id, x.via, 0.5) : door(2, x.id, 'ccor', 0.5));    
    door(2, 's1', 'dcor', 0.5); door(2, 's2', 'dcor', 0.5); door(2, 'e2', 'dcor', 0.5);
    R[2].filter(x => (x.kind === 'sroom' || (x.kind === 'spare' && (x.dcSide || x.r[0][0] >= L.aB - 0.01)))).forEach(x => door(2, x.id, 'dcor', 0.5));
    door(3, 'hall', 's1', 0.5); door(3, 'hall', 's2', 0.5); (by(3, 'e2l') ? (door(3, 'hall', 'e2l', 0.5), door(3, 'e2l', 'e2', 0.5)) : door(3, 'hall', 'e2', 0.5));
  } else {
    ext(1, 'lob', 'a0', 0.5, sW); door(1, 'lob', 'cor', 0.5); ext(1, 'ref', 'a0', 0.5, sW); door(1, 'ref', 'cor', 0.5); if (by(1, 'shel')) door(1, 'shel', 'cor', 0.5);
    ext(1, 'pas', 'a0', 0.5); door(1, 'pas', 'cor', 0.5);
    ['pmec', 'wcw', 'wcm', 'uwc', 'sho', 'fa', 'off', 'cot'].forEach(id => door(1, id, 'cor', 0.5));
    if (by(1, 'ccor')) { ext(1, 'pas2', 'a0', 0.5); door(1, 'pas2', 'ccor', 0.5); ext(1, 'ccor', 'b1', 0.5, sW); door(1, 'wait', 'lob', 0.5, 1.8); door(1, 'wait', 'ccor', 0.5);
      R[1].filter(x => (x.kind === 'croom' || (x.kind === 'spare' && x.id === 'cspare')) && x.id !== 'wait').forEach(x => door(1, x.id, 'ccor', 0.5)); }
    if (by(1, 'sparef')) door(1, 'sparef', 'lob', 0.5);
    if (L.dcSide) dcSideDoors(door, ext, R[1], D);    
    else { door(1, 'hall', 'scor', 0.15); door(1, 'hall', 'scor', 0.5); door(1, 'hall', 'scor', 0.85);
    ext(1, 'scor', 'b1', 0.5); door(1, 'pas3', 'scor', 0.5); ext(1, 'pas3', 'a1', 0.5); if (by(1, 'pas4')) { door(1, 'pas4', 'scor', 0.5); ext(1, 'pas4', 'a1', 0.5); }
    R[1].filter(x => x.kind === 'sroom').forEach(x => door(1, x.id, 'scor', 0.5));
    door(1, 'ves', 'scor', 0.5); ext(1, 'ves', 'a1', 0.5); door(1, 'dock', 'scor', 0.5);
    const bays = R[1].filter(x => x.kind === 'bay'); if (bays.length) door(1, 'dock', bays[bays.length - 1].id, 0.5);
    bays.forEach(x => ext(1, x.id, 'a1', 0.5, 2.8)); }    
  }
   
  (R[1] || []).filter(x => x.wingRoom || x.id === 'wspare' || x.closed).forEach(x => { const k = x.r.findIndex(r => r[0] < 1e-6), long = Math.max(...x.r.map(r => r[3] - r[2])) >= 12, dd = (b, t) => { const n0 = D.length, fl = L.flags.length; door(1, x.id, b, t); if (D.length === n0) { L.flags.length = fl; return false; } return true; };
    if (long) { if (dd('cor', 0.15)) dd('cor', 0.85); else dd('lob', 0.5); } else if (!dd('cor', 0.5)) dd('lob', 0.5);    
    if (x.sky && k >= 0) { const L0 = x.r[k][3] - x.r[k][2]; if (L0 >= 6) { ext(1, x.id, 'a0', 0.12, null, k); ext(1, x.id, 'a0', 0.88, null, k); } else ext(1, x.id, 'a0', 0.5, null, k); } });    
   
  if (S.wingTyp) (S.wingTyp.rooms || []).filter(r => r.mergeInto && by(1, r.id) && by(1, r.mergeInto)).forEach(r => door(1, r.id, r.mergeInto, 0.5));
   
  (R[2] || []).filter(x => x.closed).forEach(x => { const long = Math.max(...x.r.map(r => Math.max(r[1] - r[0], r[3] - r[2]))) >= 12, dd = (b, t) => { const n0 = D.length, fl = L.flags.length; door(2, x.id, b, t); if (D.length === n0) { L.flags.length = fl; return false; } return true; };
    for (const b of ['ccor', 'gcor', 'xcor', 'dcor']) { if (long ? (dd(b, 0.15) && (dd(b, 0.85), true)) : dd(b, 0.5)) break; } });
   
  { const T0 = TR(); if (T0 && T0.egressDoors) {
      const G0 = { S: {}, D, city: S.city }; Object.keys(R).forEach(k => { G0.S[k] = R[k].map(x => ({ id: x.id, n: x.n, g: x.g, kind: x.kind, r: x.r, core: !!x.core, stair: !!x.stair })); });
      for (const e of T0.egressDoors(G0).filter(e => e.doors < 2 && e.group === 'A')) {
        const st = e.storey, X = by(st, e.room), d0 = D.find(d => d[0] === st && (d[1] === e.room || d[2] === e.room)); if (!X || !d0) continue;
        const have = new Set(D.filter(d => d[0] === st && (d[1] === e.room || d[2] === e.room)).map(d => d[1] === e.room ? d[2] : d[1]));
        let best = null;
        for (const Y of R[st].filter(y => y.id !== e.room && !have.has(y.id) && (y.kind === 'proom' || y.kind === 'lobby' || y.kind === 'pcor' || y.kind === 'refuge2' || (y.kind === 'pcore' && y.stair)))) {    
          for (const t of [0.1, 0.5, 0.9]) { const n0 = D.length; const fl = L.flags.length; door(st, e.room, Y.id, t); L.flags.length = fl; if (D.length === n0) break;
            const dn = D.pop(), dist = Math.hypot(dn[3] - d0[3], dn[4] - d0[4]); if (!best || dist > best.dist) best = { dist, d: dn }; } }
        if (best) D.push(best.d); else L.flags.push(`Egress doorways: ${X.n} needs a second door and shares no wall with a public room or corridor (?)`);
      }
       
       
      if ((L.kind === 'stacked' || L.kind === 'beside') && !L.plantUp && !L.dcSide) { const G1 = { S: {}, D, city: S.city }; Object.keys(R).forEach(k => { G1.S[k] = R[k].map(x => ({ id: x.id, n: x.n, g: x.g, kind: x.kind, r: x.r, core: !!x.core, stair: !!x.stair })); });
        for (const e of T0.egressDoors(G1).filter(e => e.doors >= 2 && !e.ok && e.storey === 1 && (e.room === 'ref' || (e.room === 'shel' && !L.narrow)))) {    
          const keep = D.slice();
          for (let i = D.length - 1; i >= 0; i--) { const d = D[i]; if (d[0] === 1 && (d[1] === e.room || d[2] === e.room) && (d[2] === 'cor' || d[1] === 'cor' || d[2] === 'OUT')) D.splice(i, 1); }
          door(1, e.room, 'cor', 0.06); ext(1, e.room, 'a0', 0.94, sW);
          if (L.kind === 'beside') { const e2 = T0.egressDoors(G1).find(x => x.storey === 1 && x.room === e.room); if (!e2 || !e2.ok) { D.length = 0; keep.forEach(d => D.push(d)); } } } }
    } }
   
  Object.keys(R).forEach(k => { const st = +k; (R[k] || []).forEach(x => { if (x.core || x.corridor || x.kind === 'bay' || x.kind === 'hall' || x.alcove || /cor$|^lob$/.test(x.id) || !x.r.some(r => (r[1] - r[0]) > 0.5 && (r[3] - r[2]) > 0.5)) return;
    if (D.some(d => d[0] === st && (d[1] === x.id || d[2] === x.id))) return;
    const sec = x.block === 'data centre' || x.dcSide, list = sec ? ['scor', 'scor2', 'dcor', 'xcor'] : ['cor', 'ccor', 'gcor', 'xcor', 'lob'];
    let ok = false; for (const b of list) { if (!by(st, b)) continue; const n0 = D.length, fl = L.flags.length; door(st, x.id, b, 0.5); if (D.length > n0) { ok = true; break; } L.flags.length = fl; }
    if (!ok) L.flags.push(`No door: ${x.n} (storey ${st}) shares no wall with a corridor on its own line (?)`); }); });
   
  if (D.some(d => d[2] === 'OUT' && /^(pas3|pas4|pas2|scor|b\d)$/.test(d[1]))) L.flags.push('Exits onto the truck court count as ways out: the court is open to the street (no fence drawn;  item 5). A fence added later needs a gate on the path to the street');
  L.D = D; plantDoors(L, S);
  analyse(L, S);
}
 
function analyse(L, S) { coresWin(L); bayDoors(L); stairDoors(L); if (RULES.doorless !== false) doorlessFix(L, S); const R = L.rooms, D = L.D;    
   
  const G = { S: {}, D, city: S.city };
  Object.keys(R).forEach(k => { G.S[k] = R[k].map(x => ({ id: x.id, n: x.n, g: x.g, kind: x.kind, r: x.r, core: !!x.core, stair: !!x.stair })); });
  L.G = G;
  const T = TR();
  if (T) { L.treach = { reach: T.tReach(G), dead: T.deadEnds(G), width: T.tWidth(G), egress: T.egressDoors ? T.egressDoors(G) : [] }; }
  L.stairs = stairRows(L);    
  { const y = yardRow(L, S); if (y) L.stairs.push(y); } { const g = gateRow(L, S); if (g) L.stairs.push(g); } truckRows(L, S).forEach(x => L.stairs.push(x));        
   
  L.zones = zonesOf(L);
  L.travel = L.zones.map(z => travel(L, z));
  L.travel.filter(t => t.perim && t.perim.ok).forEach(t => (L.flags || (L.flags = [])).push(`Travel, ${t.zone}: ${t.worst} m to an exit, over 45 m; passes by NBC(AE) 3.4.2.5.(2): ${t.perim.why} (our reading: perimeter of the zone's outline; each main aisle drawn straight to an exit is an assumption, resolved in design development)`));    
  L.apart = L.zones.map(z => apart(L, z)); singleExit(L, S); nbcRows(L, S); patchHardRows(L, S);    
  L.discharge = discharges(L);
  L.grades = grades(L, S);
  L.loading = loadingOf(L, S);
}
function zonesOf(L) { const R = L.rooms, Z = [];
  const ids = (st, f) => (R[st] || []).filter(x => x.kind !== 'exitpas' && f(x)).map(x => x.id);
  if (L.kind === 'bigroom' && L.grade) {
    Z.push({ name: 'program', st: 1, pubCor: true, ids: ids(1, x => x.block !== 'data centre' && !x.core && x.kind !== 'bay') });
    Z.push({ name: 'data centre', st: 1, ids: ids(1, x => x.block === 'data centre' && x.kind !== 'bay') });
    return Z; }
  if (L.kind === 'bigroom') {
    Z.push({ name: 'program', st: 1, pubCor: true, ids: ids(1, x => x.block !== 'data centre' && !x.core && x.kind !== 'bay') });
    if ((R[2] || []).some(x => x.block === 'gym' && !x.core)) Z.push({ name: 'storey 2 program', st: 2, ids: ids(2, x => x.block === 'gym' && !x.core) });
    Z.push({ name: 'storey 2 data centre', st: 2, ids: ids(2, x => (x.block === 'data centre' || x.dcSide) && !x.core) });
    Z.push({ name: 'hall', st: 3, ids: ['hall'] });
    return Z; }
  if (L.kind === 'stacked') {
    Z.push({ name: 'hub', st: 1, pubCor: true, ids: ids(1, x => x.block === 'hub' && !x.core) });
    if ((R[2] || []).some(x => x.block === 'clinic' && !x.core)) Z.push({ name: 'clinic', st: 2, ids: ids(2, x => (x.block === 'clinic' || (x.kind === 'spare' && !x.dcSide && x.r[0][0] < L.aB - 0.01)) && !x.core) });
    Z.push({ name: 'storey 2 data centre', st: 2, ids: ids(2, x => (x.block === 'data centre' || (x.kind === 'spare' && (x.dcSide || x.r[0][0] >= L.aB - 0.01))) && !x.core) });
    Z.push({ name: 'hall', st: 3, ids: ['hall'] });
  } else {
    Z.push({ name: 'hub', st: 1, pubCor: true, ids: ids(1, x => x.block === 'hub' && !x.core) });
    if (R[1].some(x => x.block === 'clinic')) Z.push({ name: 'clinic', st: 1, ids: ids(1, x => x.block === 'clinic') });
    Z.push({ name: 'data centre', st: 1, ids: ids(1, x => x.block === 'data centre' && x.kind !== 'bay') });
  }
  return Z; }
 
function singleExit(L, S) { if (!S || S.city !== 'edm' || !L.apart || !L.rooms) return; const nSt = Object.keys(L.rooms).length; if (nSt > 2) return;
  const TAB = { A: 200, B: 100, 'F-2': 200 }, PP = { A: 1.85, B: 10, 'F-2': 46 }, grp = n => /data centre|hall/.test(n) ? 'F-2' : /clinic/.test(n) ? 'B' : 'A';
  L.apart.forEach((a, i) => { if (a.exits !== 1 || a.status !== 'fail') return; const z = L.zones[i], g = grp(z.name), area = sum(L.rooms[z.st].filter(x => z.ids.includes(x.id)).flatMap(x => x.r.map(ra))), load = Math.ceil(area / PP[g]);
    const t = (L.travel || [])[i], tr = t && t.worst; const ok = area <= TAB[g] + 1e-6 && load <= 60 && tr != null && tr <= 25 + 1e-6;
    if (ok) Object.assign(a, { status: 'pass', ok: true, single: true, rule: `one exit (NBC(AE) 3.4.2.1, sprinklered): ${nSt} storeys, ${g} ${Math.round(area)} m² of ${TAB[g]}, load ${load} of 60 (our reading of the group and rate), travel ${tr} of 25 m` }); }); }
 
function nbcRows(L, S) { if (!L.rooms || !L.stairs) return; const nSt = Object.keys(L.rooms).length;
  L.stairs.push({ stair: '-', row: 'Construction (NBC 3.2.2.76 F-2, 3.2.2.29 A-3)', status: 'pass', why: `${nSt} storeys, sprinklered: noncombustible, floors 2 h; any height and area for F-2 (3.2.2.76); never rejected on storey count` });
  const R1 = L.rooms[1] || [], D = L.D || [], lobs = R1.filter(x => x.kind === 'lobby' || x.id === 'lob');
  for (const lb of lobs) { if (!D.some(d => d[0] === 1 && d[1] === lb.id && d[2] === 'OUT')) continue;    
    const onto = D.filter(d => d[0] === 1 && (d[1] === lb.id || d[2] === lb.id)).map(d => d[1] === lb.id ? d[2] : d[1]).filter(o => o !== 'OUT').map(o => R1.find(y => y.id === o)).filter(Boolean);
    const bad = onto.filter(y => !y.core && !y.corridor && !/cor$/.test(y.kind) && y.kind !== 'exitpas' && (y.block === 'data centre' || y.dcSide || /stor|janitor|custod|mech|electric|garb|recycl|laundry|plant|chem|sleep|dorm|bunk|bedroom|clinic|exam|\bcare\b/i.test((y.n || '') + ' ' + y.id)) && y.id !== 'ref');    
    L.stairs.push({ stair: '-', row: 'Exit through a lobby (NBC(AE) 3.4.4.2.(2)(c), (e)(i))', status: bad.length ? 'fail' : 'pass', why: bad.length ? `${lb.id} is a way out, and ${bad.map(y => y.id).join(', ')} open onto it (care, residential, F-2, service or storage)` : `nothing that (c) or (e)(i) bars opens onto ${lb.id}; (a), (b), (d), (f) not encoded (?)` }); } }
 
 
 
function wayGrid(L, S, court) { const P = L.plant, T = L.toUV; if (!T || !S || !S.ring) return null;
  const uvR = r => { const a = T(r[0], r[2]), c = T(r[1], r[3]); return [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])]; };
  const FC = RULES.extFace || 0, blk = ((L.rooms || {})[1] || []).flatMap(x => x.r.map(uvR)).map(r => [r[0] - FC, r[1] + FC, r[2] - FC, r[3] + FC]).concat(((P && P.items) || []).filter(i => !i.roof && !i.up).map(i => uvR(i.r))), ring = S.ring, g = 0.5, H = 6;
  const us = ring.map(p => p[0]), vs = ring.map(p => p[1]), u0 = Math.min(...us), v0 = Math.min(...vs), nu = Math.ceil((Math.max(...us) - u0) / g), nv = Math.ceil((Math.max(...vs) - v0) / g);
  if (nu * nv > 6e5) return null;
  const free = new Uint8Array(nu * nv); for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u = u0 + (i + 0.5) * g, v = v0 + (j + 0.5) * g; free[i * nv + j] = inPoly([u, v], ring) && !blk.some(r => u > r[0] && u < r[1] && v > r[2] && v < r[3]) ? 1 : 0; }
  const I = new Int32Array((nu + 1) * (nv + 1)), N = nv + 1; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) I[(i + 1) * N + j + 1] = (free[i * nv + j] ? 0 : 1) + I[i * N + j + 1] + I[(i + 1) * N + j] - I[i * N + j];
  const inC = (i, j) => { const u = u0 + (i + 0.5) * g, v = v0 + (j + 0.5) * g; return court && u > court[0] && u < court[1] && v > court[2] && v < court[3]; };
  const veh = (i, j) => i >= H && j >= H && i < nu - H && j < nv - H && !inC(i, j) && I[(i + H + 1) * N + j + H + 1] - I[(i - H) * N + j + H + 1] - I[(i + H + 1) * N + j - H] + I[(i - H) * N + j - H] === 0;
  const ways = (S.edges || []).filter(e => e.abuts === 'street' || e.abuts === 'alley'), drive = S.sideDrive && S.sideDrive.r;
  const src = (u, v) => ways.some(e => dSeg([u, v], e.a, e.b) <= RULES.waySrc) || (drive && u >= drive[0] - 1 && u <= drive[1] + 1 && v >= drive[2] - 1 && v <= drive[3] + 1);
  const seen = new Uint8Array(nu * nv), q = []; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) if (veh(i, j) && src(u0 + (i + 0.5) * g, v0 + (j + 0.5) * g)) { seen[i * nv + j] = 1; q.push(i * nv + j); }
  while (q.length) { const k = q.pop(), i = Math.floor(k / nv), j = k % nv; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i2 = i + a, j2 = j + b; if (i2 < 0 || j2 < 0 || i2 >= nu || j2 >= nv) continue; const k2 = i2 * nv + j2; if (!seen[k2] && veh(i2, j2)) { seen[k2] = 1; q.push(k2); } } }
  return { any: r => { const i0 = Math.max(0, Math.floor((r[0] - u0) / g)), i1 = Math.min(nu - 1, Math.ceil((r[1] - u0) / g)), j0 = Math.max(0, Math.floor((r[2] - v0) / g)), j1 = Math.min(nv - 1, Math.ceil((r[3] - v0) / g));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { if (!seen[i * nv + j]) continue; const u = u0 + (i + 0.5) * g, v = v0 + (j + 0.5) * g; if (u >= r[0] && u <= r[1] && v >= r[2] && v <= r[3]) return true; } return false; } }; }
function truckRows(L, S) { const T = L.toUV, R1 = (L.rooms || {})[1] || [], bays = R1.filter(x => x.kind === 'bay'); if (!T || !S || !bays.length) return [];
  const edm = S.city === 'edm', sv = edm ? ' (Edmonton: Vancouver aisle and SU-9 as a stand-in, labelled)' : '', out = [];
  const uvR = r => { const a = T(r[0], r[2]), c = T(r[1], r[3]); return [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])]; };
  const ways = (S.edges || []).filter(e => e.abuts === 'street' || e.abuts === 'alley'), drive = S.sideDrive && S.sideDrive.r;
  const court = L.truck && L.truck.court;
  if (!court) { out.push({ stair: '-', row: 'Truck reverse at most 10 m (SU-9)', status: 'pass', why: `bays open to the lane: the truck backs in from the lane (the bay length only); turning at the lane not checked (no City template)${sv}` }); }
  else { const c = uvR(court), du = c[1] - c[0], dv = c[3] - c[2], alongU = du >= dv;
    const sides = { u0: [[c[0], c[2]], [c[0], c[3]]], u1: [[c[1], c[2]], [c[1], c[3]]], v0: [[c[0], c[2]], [c[1], c[2]]], v1: [[c[0], c[3]], [c[1], c[3]]] };
     
    const G = wayGrid(L, S, c), openSide = k => { const [a, b] = sides[k], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (ways.some(e => dSeg(m, e.a, e.b) <= 3.5)) return true;
      if (drive) { const o = k === 'u0' ? [c[0] - 1, c[0], c[2], c[3]] : k === 'u1' ? [c[1], c[1] + 1, c[2], c[3]] : k === 'v0' ? [c[0], c[1], c[2] - 1, c[2]] : [c[0], c[1], c[3], c[3] + 1];
        if (o[0] < drive[1] && o[1] > drive[0] && o[2] < drive[3] && o[3] > drive[2]) return true; }
      if (!G) return false; const o = k === 'u0' ? [c[0] - 1.0, c[0], c[2], c[3]] : k === 'u1' ? [c[1], c[1] + 1.0, c[2], c[3]] : k === 'v0' ? [c[0], c[1], c[2] - 1.0, c[2]] : [c[0], c[1], c[3], c[3] + 1.0];
      return G.any(o); };
    const ends = alongU ? ['u0', 'u1'] : ['v0', 'v1'], longs = alongU ? ['v0', 'v1'] : ['u0', 'u1'], oe = ends.filter(openSide), ol = longs.filter(openSide);
    const bb = bays.map(x => uvR(x.r[0])), len = alongU ? du : dv;
    if (ol.length || oe.length === 2) out.push({ stair: '-', row: 'Truck reverse at most 10 m (SU-9)', status: 'pass', why: `the ${r2(len)} m court is open ${ol.length ? 'along a long side' : 'at both ends'}: the truck drives through and backs only into the bay; turning not checked (no City template)${sv}` });
    else if (!oe.length) out.push({ stair: '-', row: 'Truck reverse at most 10 m (SU-9)', status: 'fail', why: `the truck court meets no street, lane or side drive (no way in drawn)${sv}` });
    else { const e = oe[0], far = alongU ? (e === 'u0' ? Math.max(...bb.map(r => r[1])) - c[0] : c[1] - Math.min(...bb.map(r => r[0]))) : (e === 'v0' ? Math.max(...bb.map(r => r[3])) - c[2] : c[3] - Math.min(...bb.map(r => r[2]))), rev = r2(Math.max(0, far));
      out.push({ stair: '-', row: 'Truck reverse at most 10 m (SU-9)', status: rev <= 10 + 1e-6 ? 'pass' : 'fail', why: `the court is a dead end, open at one end only: a truck reverses ${rev} m from that end to the farthest bay (10 m at most); turning not checked (no City template)${sv}` }); } }
  const cov = L.truck && L.truck.covered;
  out.push({ stair: '-', row: 'Columns 3.3 m back from the truck aisle', status: 'pass', why: cov ? `no column drawn within 3.3 m of the aisle; the structure over the covered ground is not drawn: columns there to sit 3.3 m back (not checked ?)${sv}` : `the court is open to the sky: no column stands within 3.3 m of the aisle${sv}` });
  return out; }
 
const LAYOUT_HOOKS = {
  programRooms: (L, S, def, ctx) => L,    
  fill: (L, S, def, ctx) => L,            
  corridorEnd: (L, S, ctx) => L,          
  truckCourt: (L, S, ctx) => L,           
  washrooms: (L, S, load, ctx) => L       
};
const HOOK_CTX = { room, subAll, ra, r2, sum, pack, wallLen, inPoly, dSeg, spareList, spareFill, wcA, wcB, wcBload, PRG, RULES: null,
  roadwayOff: S => (S && S.roadwayOff != null ? S.roadwayOff : null),    
  replant: L => { const C_ = L && L._C; return C_ ? plantLayout(C_, L.W, L.Da, L.MW, L.rooms) : null; } };
function runHook(name, L, S, ...args) { HOOK_CTX.RULES = RULES; const ids = RULES.layoutDrafts || []; if (!ids.length) return LAYOUT_HOOKS[name](L, S, ...args, HOOK_CTX) || L;
  const H = HC(), PT = (H && H.patches) || {}; let cur = L;
  for (const id of ids) { const f = PT[id] && PT[id].hooks && PT[id].hooks[name]; if (typeof f !== 'function') continue;
    const had = Object.prototype.hasOwnProperty.call(cur, 'flags'); try { const r = f(cur, S, ...args, HOOK_CTX); if (r) cur = r; } catch (e) { (cur.flags || (cur.flags = [])).push(`Layout draft ${id} (${name}) did not run: ${String(e && e.message || e).slice(0, 160)}`); }
     
    if (!had && Array.isArray(cur.flags)) { cur.hookFlags = (cur.hookFlags || []).concat(cur.flags); delete cur.flags; } }
  return LAYOUT_HOOKS[name](cur, S, ...args, HOOK_CTX) || cur; }
function hookLoad(L, S) { const H = HC(), PT = H && H.patches; try { return PT && PT.C5 ? PT.C5.c5Loads(patchG(L, S), {}) : null; } catch (e) { return null; } }
 
let C4R = null;
function c4RoomList(code) { if (C4R === null) { C4R = {}; try { if (root && typeof XMLHttpRequest !== 'undefined') { const x = new XMLHttpRequest(); x.open('GET', 'data/c4_rooms.json', false); x.send(null); if (x.status === 200) C4R = JSON.parse(x.responseText); }
    else if (typeof require === 'function') C4R = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'data', 'c4_rooms.json'), 'utf8')); } catch (e) { C4R = {}; } }
  return (C4R && C4R[code]) || null; }
 
 
function suiteSpare(G) { Object.keys(G.S).forEach(st => { const by = {}; G.S[st].forEach(y => { by[y.id] = y; });
  G.S[st].forEach(x => { if (x.kind !== 'spare' || x.suite !== 'program') return; const su = new Set();
    (G.D || []).forEach(d => { if (String(d[0]) !== String(st)) return; const o = d[1] === x.id ? d[2] : d[2] === x.id ? d[1] : null; if (!o || o === 'OUT') return; const y = by[o]; if (y && y.kind !== 'spare' && y.suite && y.suite !== 'none') su.add(y.suite); });
    if (su.size === 1) x.suite = [...su][0]; }); }); }
function suiteOf(x) { if (x.suite) return x.suite; if (x.core || x.stair || x.lift || x.kind === 'exitpas' || x.kind === 'pcore' || x.kind === 'score' || x.kind === 'shaft') return 'none';
  if (x.block === 'data centre' || x.dcSide || x.g === 'hall' || x.g === 'sup' || x.g === 'load' || x.kind === 'bay' || x.kind === 'dock' || x.kind === 'scor') return 'dc'; return 'program'; }
 
function suiteEgressRow(L, S, G, loads) { const SRC = 'NBC 2020 / NBC(AE) 2023 / VBBL 2025 3.3.1.5 (suite), Div. A 1.4.1.2; checks/sources/SOURCES_suites_2026-11-17.md';
  const parts = [], fails = []; const by = {}; Object.keys(G.S).forEach(st => G.S[st].forEach(x => { by[st + ':' + x.id] = x; }));
  const pubCor = (st, x) => { if (!(x.kind === 'pcor' || x.kind === 'scor' || x.kind === 'ccor' || /cor/.test(x.kind || '') || x.kind === 'lobby')) return false; const su = new Set();
    (G.D || []).forEach(d => { if (String(d[0]) !== String(st)) return; const o = d[1] === x.id ? d[2] : d[2] === x.id ? d[1] : null; if (!o || o === 'OUT') return; const y = by[st + ':' + o]; if (y && y.suite !== 'none') su.add(y.suite); }); return su.size > 1; };
  const area = x => sum(x.r.map(ra)), progArea = sum(Object.values(G.S).flat().filter(x => x.suite === 'program').map(area));
  for (const st of Object.keys(G.S)) { const R = G.S[st];
    for (const su of ['program', 'dc', 'community']) { const rooms = R.filter(x => x.suite === su && !pubCor(st, x)); if (!rooms.length) continue;
      const A = sum(rooms.map(area)), load = su === 'dc' ? Math.ceil(A / 46) : su === 'program' && loads && loads.public != null && progArea > 0 ? Math.ceil(loads.public * A / progArea) : Math.ceil(A / 1.85);
      const lim = su === 'dc' ? 200 : 200, need = load > 60 || A > lim + 1e-6; if (!need) { parts.push(`storey ${st} ${su}: load ${load}, ${Math.round(A)} m² (one egress doorway enough)`); continue; }
      const ids = new Set(rooms.map(x => x.id)), doors = [];
      (G.D || []).forEach(d => { if (String(d[0]) !== String(st)) return; const a = ids.has(d[1]), b = ids.has(d[2]); if (a === b) return; const o = a ? d[2] : d[1];
        if (o === 'OUT') return doors.push([d[3], d[4]]); const y = by[st + ':' + o]; if (!y) return; if (y.suite === 'none' || pubCor(st, y)) doors.push([d[3], d[4]]); });
      const xs = rooms.flatMap(x => x.r.flatMap(r => [r[0], r[1]])), ys = rooms.flatMap(x => x.r.flatMap(r => [r[2], r[3]])), diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      let best = 0; for (let i = 0; i < doors.length; i++) for (let j = i + 1; j < doors.length; j++) best = Math.max(best, Math.hypot(doors[i][0] - doors[j][0], doors[i][1] - doors[j][1]));
      const ok = doors.length >= 2 && best >= diag / 3 - 1e-6;
      const t = `storey ${st} ${su}: load ${load}, ${Math.round(A)} m²: ${doors.length} egress doorway${doors.length === 1 ? '' : 's'}${doors.length >= 2 ? `, ${r2(best)} m apart (≥ ${r2(diag / 3)}, a third of the ${r2(diag)} m diagonal)` : ''}`;
      (ok ? parts : fails).push(t); } }
  return { id: 'SUITE-egress', title: 'Suite egress doorways (3.3.1.5)', status: fails.length ? 'fail' : 'pass', src: SRC,
    text: (fails.length ? 'FAILS: ' + fails.join('; ') + ' · ' : '') + parts.join('; ') + ' [engine; suites: one operator per program (Edmonton explicit, Vancouver our reading), the data centre at 46 m² a person, our reading]' }; }
 
function suiteServed(G, st, x) { const by = {}; (G.S[st] || []).forEach(y => { by[y.id] = y; }); const su = new Set();
  (G.D || []).forEach(d => { if (String(d[0]) !== String(st)) return; const o = d[1] === x.id ? d[2] : d[2] === x.id ? d[1] : null; if (!o || o === 'OUT') return; const y = by[o]; if (y && y.suite && y.suite !== 'none') su.add(y.suite); }); return su; }
function suiteCorG(G) { const S2 = {}; Object.keys(G.S).forEach(st => { S2[st] = G.S[st].map(x => { const cor = x.kind === 'pcor' || x.kind === 'scor' || x.kind === 'ccor' || /cor$/.test(x.kind || '');
    return cor && suiteServed(G, st, x).size <= 1 ? Object.assign({}, x, { kind: 'suiteroom', suiteCor: true }) : x; }); }); return Object.assign({}, G, { S: S2 }); }
 
function suiteRows(G) { const out = [], fails = [], parts = []; let pairs = 0;
  for (const st of Object.keys(G.S)) { const R = G.S[st], su = [...new Set(R.map(x => x.suite).filter(v => v && v !== 'none'))]; if (su.length < 2) continue;
    for (const s1 of su) { const ids = new Set(R.filter(x => x.suite === s1).map(x => x.id)); const ok = (G.D || []).some(d => { if (String(d[0]) !== String(st)) return false; const a = ids.has(d[1]), b = ids.has(d[2]); if (a === b) return false; const o = a ? d[2] : d[1];
        if (o === 'OUT') return true; const y = R.find(z => z.id === o); return !!y && (y.suite === 'none' || ((y.kind === 'pcor' || /cor$/.test(y.kind || '')) && suiteServed(G, st, y).size > 1)); });
      (ok ? parts : fails).push(`storey ${st} ${s1}`); }
    R.forEach(x => R.forEach(y => { if (x.suite === 'program' && y.suite === 'dc' && x.r.some(r => y.r.some(q => wallSeg(r, q).some(w => w.len > 0.5)))) pairs++; })); }
  out.push({ pid: 'SUITE-exits', sw: 'suiteExits', id: 'SUITE-exits', title: 'Suite exits (3.3.1.3.(8)-(9))', status: fails.length ? 'fail' : 'pass', src: 'NBC(AE) 2023 / VBBL 2025 3.3.1.3; checks/sources/SOURCES_suites_2026-11-17.md',
    text: (fails.length ? 'FAILS: no exit doorway or public-corridor doorway for ' + fails.join(', ') + ' · ' : '') + (parts.length ? 'reach an exit: ' + parts.join(', ') : 'one suite per storey') + ' [engine; card]' });
  out.push({ pid: 'SUITE-sep', sw: 'suiteSep', id: 'SUITE-sep', title: 'Suite separation (3.3.1.1)', status: 'pass', src: 'NBC(AE) 2023 3.3.1.1; VBBL 2025 3.3.1.1.(5) (2 h at grade); hub rule 8',
    text: `${pairs} program-data centre wall${pairs === 1 ? '' : 's'} drawn on the 2 h line (its position is drawn and checked; rating, closers and glazing: resolved in design development, project decision, 17 Nov) [engine; card]` });
  return out; }
 
function patchG(L, S) { const G = { S: {}, D: L.D || [], H: L.H, city: S.city, DOOR_W: RULES.door.w }, TD = S.typDef || S.wingTyp || S.hubTyp, defRooms = {}; ((TD && TD.rooms) || []).forEach(r => { if (r && r.id) defRooms[r.id] = r; });    
  Object.keys(L.rooms || {}).forEach(k => { G.S[k] = L.rooms[k].map(x => { const dr = defRooms[x.prog] || defRooms[x.id]; return Object.assign({ id: x.id, n: x.n, g: x.g, kind: x.kind, r: x.r, core: !!x.core, stair: !!x.stair, lift: !!x.lift, staffOnly: !!x.staffOnly, block: x.block, prog: x.prog, suite: suiteOf(x) }, x.perPersonM2 != null ? { perPersonM2: x.perPersonM2 } : dr && dr.perPersonM2 != null ? { perPersonM2: dr.perPersonM2 } : {}, dr && dr.bathers ? { bathers: true } : {}, x.fx ? { fx: x.fx, wc: x.fx.wc } : {}, x.genderNeutral ? { genderNeutral: true } : {}); });     });
  if (L.fromUV && S.ring) { G.LOTPOLY = S.ring.map(p => L.fromUV(p[0], p[1])); const E = S.edges || [];
    G.STREET_EDGES = E.filter(e => e.abuts === 'street' || e.abuts === 'alley').map(e => [L.fromUV(e.a[0], e.a[1]), L.fromUV(e.b[0], e.b[1])]);
    G.LANE_EDGES = E.filter(e => e.abuts === 'alley').map(e => [L.fromUV(e.a[0], e.a[1]), L.fromUV(e.b[0], e.b[1])]); }
  G.PLANT = ((L.plant && L.plant.items) || []).filter(it => !it.pseudo && !it.roof && !it.up).map(it => ({ id: it.id, n: it.n, r: it.r }));
  if (L.truck && L.truck.court) { G.COURT = L.truck.court; G.DCSPACE = [L.truck.court]; G.DRIVE = L.truck.court; }
  suiteSpare(G);
  return G; }
 
function faceG(G) { const F = RULES.extFace || 0; if (!F) return G; const S2 = {}; Object.keys(G.S).forEach(k => { S2[k] = G.S[k].map(x => Object.assign({}, x, { r: x.r.map(r => [r[0] - F, r[1] + F, r[2] - F, r[3] + F]) })); });
  const inR = (p, rs) => rs.some(r => p[0] > r[0] + 1e-9 && p[0] < r[1] - 1e-9 && p[1] > r[2] + 1e-9 && p[1] < r[3] - 1e-9);
  const D = (G.D || []).map(d => { if (!(d[1] === 'OUT' || d[2] === 'OUT')) return d; const id = d[1] === 'OUT' ? d[2] : d[1], x = (G.S[d[0]] || G.S[String(d[0])] || []).find(y => y.id === id); if (!x) return d;
    const n = d[5] === 'v' ? [[d[3] - 0.3, d[4]], [d[3] + 0.3, d[4]]] : [[d[3], d[4] - 0.3], [d[3], d[4] + 0.3]], o = n.find(p => !inR(p, x.r)) || n[0], k = F / 0.3;
    const e = d.slice(); e[3] = r2(d[3] + (o[0] - d[3]) * k); e[4] = r2(d[4] + (o[1] - d[4]) * k); return e; });
  return Object.assign({}, G, { S: S2, D, FACE: F }); }    
function patchRows(L, S, G0, mode) { const G = G0, GF = faceG(G0); const H = HC(), PT = H && H.patches; if (!PT || !RULES.patchesOn) return [];
  const van = S.city === 'van', cfg = { city: S.city, code: van ? 'VBBL' : 'NBC 2023 (AE)', zones: L.zones || [], typology: (S.typDef && S.typDef.id) || (S.wingTyp && S.wingTyp.id) || (S.hubTyp && S.hubTyp.id) || 'emergency_hub' };
  const LD0 = () => { try { return PT.C5 ? PT.C5.c5Loads(G, {}) : null; } catch (e) { return null; } };
  const out = [], T = (pid, sw, f) => { if ((sw && RULES[sw] === false) || !PT[pid]) return; if (mode === 'hard' && !(RULES.patchHard || []).includes(pid)) return;     try { [].concat(f(PT[pid]) || []).forEach(r => r && out.push(Object.assign({ pid, sw }, r))); } catch (e) { out.push({ pid, sw, id: pid, title: `Patch ${pid}`, status: '?', text: 'did not run: ' + String(e && e.message || e).slice(0, 160), src: '' }); } };
  if (RULES.suiteEgress !== false && (mode !== 'hard' || (RULES.patchHard || []).includes('SUITE-egress'))) { try { const se = suiteEgressRow(L, S, G, LD0()); out.push(Object.assign({ pid: 'SUITE-egress', sw: 'suiteEgress' }, se)); } catch (e) { out.push({ pid: 'SUITE-egress', sw: 'suiteEgress', id: 'SUITE-egress', title: 'Suite egress doorways (3.3.1.5)', status: '?', text: 'did not run: ' + String(e && e.message || e).slice(0, 160), src: '' }); } }
  if (mode !== 'hard') { try { out.push(...suiteRows(G)); } catch (e) { out.push({ pid: 'SUITE-exits', sw: 'suiteExits', id: 'SUITE-exits', title: 'Suite exits', status: '?', text: 'did not run: ' + String(e && e.message || e).slice(0, 160), src: '' }); } }
  T('A5', 'deadEndHard', p => p.a5DeadEndRow(suiteCorG(G), cfg, H));    
  T('A6', 'zoneExitsHard', p => p.a6ZoneExitsRow(G, cfg, H, L.zones || []));
  T('A11', 'lobbyExit', p => p.a11LobbyExitRow(G, cfg, H));
   
  let LD = null; try { if (PT.C5 && RULES.fieldLoads !== false) LD = PT.C5.c5Loads(G, {}); } catch (e) { LD = null; }
  T('C6', 'singleWc', p => p.c6Row(p.c6Establishments(G, cfg, LD && LD.clinic != null ? { clinicLoad: LD.clinic } : {}), S.city));
  T('VG', 'genderNeutral', p => van ? p.vgRow(G, cfg, LD && LD.public != null ? { load: LD.public } : {}) : null);
   
  T('E1', 'padsE1', p => p.e1PadsRow(GF, cfg, H, { belowMinFails: RULES.belowMinFails !== false }));
  T('E2', 'intakeTable2026', p => p.e2IntakeRow(GF, cfg, H));
  T('E3', 'genClearHard', p => { const G3 = Object.assign({}, GF, { S: {} }); Object.keys(GF.S).forEach(k => { G3.S[k] = GF.S[k].map(x => /greenhouse|glasshouse|propagation house/i.test(x.n || '') && !/headhouse|wc|desk|mech|lobby/i.test(x.n || '') ? Object.assign({}, x, { n: x.n + ' (growing house)' }) : x); }); return p.genClearRows(G3); });    
  T('B4', 'fireAccessRow', p => p.fireAccessRow(GF, { city: S.city, code: van ? 'VBBL' : 'AE' }));
  T('G1', 'capGross', p => !van && L.caps ? p.g1CapRow(G, cfg, H, {}) : null);
  T('C5', 'fieldLoads', p => p.c5LoadRow(G, cfg));
   
  const defRoom = id => ((S.typDef && S.typDef.rooms) || []).find(r => r.id === id) || null, tcode = { community_pool: 'CP', warm_bath: 'WB', heat_cascade: 'HC', food_hub: 'FH', shelter_laundry: 'SL', aquaponics: 'AQ', conservatory: 'CV' }[cfg.typology] || 'EH';
  const hasRoom = re => Object.values(G.S).some(rs => rs.some(x => re.test(x.n || '')));
  T('A10', 'exitLanding', p => p.a10RecessRow(GF, cfg, H, {}));
  T('C10', 'clinicAE385', p => !van && hasRoom(/exam|clinic/i) ? p.c10ClinicRow(G, cfg, H) : null);
  T('E6', 'chemStores', p => { if (!hasRoom(/hypochlorite|acid store/i)) return null; const hy = defRoom('hypochlorite') || defRoom('hypochlorite_store') || defRoom('chlorine'), ac = defRoom('acid') || defRoom('acid_store');
    const def = hy || ac ? { hypo: { minM2: (hy && hy.minM2) || 8.0, minM2SpaOnly: (hy && hy.minM2SpaOnly) || 6.0 }, acid: { minM2: (ac && ac.minM2) || 8.0, minM2SpaOnly: (ac && ac.minM2SpaOnly) || 6.0 } } : undefined;
    return p.chemStoreRow(G, { city: S.city, def }); });
  T('F6', 'poolDecksF6', p => (tcode === 'CP' || tcode === 'WB') ? p.rows(G, { city: S.city, typology: tcode, hubchecks: H, def: S.typDef || null }) : null);
  T('P1', 'poolPlantP1', p => (tcode === 'CP' || tcode === 'WB' || tcode === 'HC') ? p.rows(G, { city: S.city }) : null);    
  T('C3', 'clearSizesC3', p => p.c3ClearSizesRow(G, cfg, H, { belowMinFails: RULES.belowMinFails !== false }));
  T('A4', 'walkHard', p => p.a4WalkRow(G, cfg, H, { hard: RULES.walkHard === true }));
  T('D3', 'bayDoorWidth', p => p.d3BayDoorsRow(G, cfg));
  T('F2', 'greenhouseSun', p => { if (!hasRoom(/greenhouse|growing house|biome|glasshouse/i) || !S.F || !S.F.toW || !L.toUV) return null;
    const w = (a, b) => { const q = L.toUV(a, b); return S.F.toW(q[0], q[1]); }, o = w(0, 0), wa = w(1, 0), wb = w(0, 1), A = [wa[0] - o[0], wa[1] - o[1]], B = [wb[0] - o[0], wb[1] - o[1]], det = A[0] * B[1] - A[1] * B[0];
    if (Math.abs(det) < 1e-9) return null; const nu = (0 * B[1] - 1 * B[0]) / det, nv = (A[0] * 1 - A[1] * 0) / det;    
    const north = (Math.atan2(nu, nv) * 180 / Math.PI + 360) % 360, G2 = Object.assign({}, G, { S: {} });
    Object.keys(G.S).forEach(k => { G2.S[k] = G.S[k].map(x => /greenhouse|glasshouse/i.test(x.n || '') && !/headhouse|wc|desk|mech|lobby/i.test(x.n || '') ? Object.assign({}, x, { n: x.n + ' (growing house)' }) : x); });
    const r = p.greenhouseSunRow(G2, { north, city: S.city }); if (r && det < 0) r.text = (r.text || '') + ' (plan frame mirrored: the sun\'s path is read in the plan\'s turning sense, check ?)'; return r; });
  T('COV-edge', 'heatedEdge', p => tcode === 'HC' ? p.heatedEdgeRow(GF, { city: S.city }) : null);
  T('COV-cventry', 'cvEntry', p => tcode === 'CV' ? p.conservatoryEntryRows(G) : null);
  T('SPA-hottub', 'spaHotTub', p => van && (tcode === 'HC' || tcode === 'WB') ? p.spaHotTubRow(G, { city: S.city }) : null);
  T('C4', 'oversizeFields', p => p.c4Row(G, Object.assign({}, cfg, { typology: tcode }, c4RoomList(tcode) ? { roomList: c4RoomList(tcode) } : {})));
  T('C4C5', 'poolBathersC4C5', p => { if (tcode !== 'CP' && tcode !== 'WB') return null; const big = defRoom((S.typDef && S.typDef.family && S.typDef.family.big) || ''), water = big && (big.waterM2 || (big.water && big.water.m2) || (Array.isArray(big.tank) ? big.tank[0] * big.tank[1] : null));
    return water ? p.rows(G, { city: S.city, waterM2: water, deepM2: big.deepM2 || 0, fullLoad: LD && LD.public != null ? LD.public : undefined }) : null; });
   
  const LD5 = (() => { try { return PT.C5 ? PT.C5.c5Loads(G, {}) : null; } catch (e) { return null; } })();
  T('PG', 'poolGapsPG', p => (tcode === 'CP' || tcode === 'WB') ? p.rows(G, { city: S.city, load: LD5 && LD5.public != null ? LD5.public : undefined }) : null);
  T('F7', 'poolViewF7', p => tcode === 'CP' ? p.rows(G, { hubchecks: H, fullLoad: LD5 && LD5.public != null ? LD5.public : undefined }) : null);
  T('P4', 'edmCapsP4', p => !van && (tcode === 'CP' || tcode === 'WB') ? [p.capRow(G, { city: 'edm', cap: 500 }), p.bathSupport(G, {})] : null);
  T('CHEM-ACCESS', 'chemAccess', p => p.chemAccessRow(G, { city: S.city }));
  T('SVC-EXIT', 'svcExit', p => p.svcExitRow(G));
  T('WET-DC', 'wetDc', p => p.wetDcRow(G, { def: S.typDef || S.wingTyp || S.hubTyp || null }));
  T('FTF', 'ftfRow', p => p.ftfRow(G, { zone: S.zone }));
  T('CHEM-DC', 'chemDc', p => p.chemDcRow(G));
  T('USE-PATH', 'usePath', p => p.usePathRow(G, { city: S.city, zone: S.zone }));
  T('ZYARD-RES', 'resYard', p => p.resYardRow(G, { city: S.city, zone: S.zone }));
  T('EXTWALL', 'extWall', p => p.extWallRow(G, { def: S.typDef || S.wingTyp || S.hubTyp || null }));
  T('COV-hub', 'covHub', p => p.covHubRows(G, cfg, { truckCovered: !!(L.truck && L.truck.covered) }));
  T('PLANT-door', 'plantDoor', p => p.plantDoorRow(G));
  T('EXIT-yard', 'exitYard', p => p.exitYardRow(G));
   
  T('A12', 'passageA12', p => p.a12PassageRow(G, cfg, H, { fullLoad: LD5 && LD5.public != null ? LD5.public : undefined }));
  T('B2', 'hallB2', p => p.b2HallRow(G, cfg));
  T('C7', 'universalC7', p => p.c7UniversalRow(G, cfg, H));
  T('C8', 'twoDoorC8', p => p.c8TwoDoorRow(G, cfg, H));
  T('C9', 'leftoverC9', p => p.c9LeftoverRow(G, cfg, H));
  T('D1', 'baysD1', p => p.d1BaysRow(G, cfg, {}));
  T('D2', 'truckD2', p => p.d2TruckRow(G, cfg));
  T('D4', 'yardGateD4', p => (r => r && r.status === '?' ? Object.assign({}, r, { status: 'flag', text: 'resolved in design development ( item 1; 17aa sort): ' + (r.text || '') + '. The plan-shaping part is checked: the gate row proves a 6.1 m way to every generator and pad, the truck rows prove the court' }) : r)(p.d4YardGateRow(G, cfg, H)));
  T('D5', 'truckGroundD5', p => p.d5TruckGroundRow(G, cfg));
  T('D6', 'drivesD6', p => !van ? p.d6DriveRow(G, cfg, {}) : null);
  T('D7', 'fuelFillD7', p => (r => r && r.status === '?' ? Object.assign({}, r, { status: 'flag', text: 'resolved in design development ( item 1; 17aa sort): ' + (r.text || '') + '. The plan-shaping part is checked: the gate row proves a 6.1 m way to every generator and pad, the truck rows prove the court' }) : r)(p.d7FuelFillRow(G, cfg, H)));
  T('E4', 'hubSetE4', p => !S.typDef && !S.wingTyp ? p.e4HubSetRow(G, cfg, H, L.m || null) : null);
  T('E8', 'chillerNoiseE8', p => p.e8ChillerNoiseRow(G, cfg, {}));
  T('F4', 'liftF4', p => p.f4LiftRow(G, cfg));
  T('F5', 'stepBackF5', p => p.f5StepBackRow(GF, Object.assign({}, cfg, { zone: S.zone }), { zone: S.zone }));
  T('H2', 'shaftH2', p => p.h2ShaftRow(G, cfg));
  return out; }
function patchHardRows(L, S) { if (!RULES.patchesOn || !L.rooms || !L.stairs) return; const rows = patchRows(L, S, patchG(L, S), 'hard'); L.patchRows = rows;
  rows.filter(r => r.status === 'fail' && (RULES.patchHard || []).includes(r.pid)).forEach(r => L.stairs.push({ stair: '-', row: `${r.title} [check ${r.pid}]`, status: 'fail', why: String(r.text || '').slice(0, 300), patch: r.pid })); }
 
function yardRow(L, S) { const T = L.toUV; if (!T || !S || !S.edges) return null; const F = RULES.extFace || 0;
   
  const segHit = (r, a, b) => { const inR = p => p[0] >= r[0] && p[0] <= r[1] && p[1] >= r[2] && p[1] <= r[3]; if (inR(a) || inR(b)) return true; const C = [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]];
    const cr = (p, q, s1, s2) => { const d = (x, y, z) => (y[0] - x[0]) * (z[1] - x[1]) - (y[1] - x[1]) * (z[0] - x[0]); return d(p, q, s1) * d(p, q, s2) < 0 && d(s1, s2, p) * d(s1, s2, q) < 0; };
    for (let i = 0; i < 4; i++) if (cr(a, b, C[i], C[(i + 1) % 4])) return true; return false; };
  const ptR = (p, r) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[1]), Math.max(r[2] - p[1], 0, p[1] - r[3]));
  const dist = (r, e) => segHit(r, e.a, e.b) ? 0 : Math.min(...[[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]].map(c => dSeg(c, e.a, e.b)), ptR(e.a, r), ptR(e.b, r));
  let worst = null;
  for (const st of Object.keys(L.rooms || {})) for (const x of L.rooms[st]) for (const q of x.r) { const a = T(q[0], q[2]), c = T(q[1], q[3]), r = [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])];
    for (const e of S.edges) { const d = dist(r, e) - F, need = e.d || 0, m = d - need; if (!worst || m < worst.m) worst = { m, d, need, kind: e.kind, room: x.id, st }; } }
  if (!worst) return null; const fail = worst.m < -1e-6;
  return { stair: '-', row: 'Building inside the yards', status: fail ? 'fail' : worst.m < 0.5 ? 'tight' : 'pass',
    why: `${fail ? 'FAILS: ' : ''}nearest: ${worst.room} (storey ${worst.st}), exterior face ${r2(worst.d)} m from the ${worst.kind} lot line, yard ${worst.need} m${fail ? ` (${r2(-worst.m * 1000) / 1000} m inside it)` : ''}; every room on every storey, its exact outline, the face ${F} m outside the room outlines (no tolerance below the yard; project decision, 17 Nov)` }; }
 
function plantDoors(L, S) { if (!RULES.plantDoors || !L.rooms || !L.rooms[1] || !L.D || !L.toUV || !S || !S.ring) return; const R1 = L.rooms[1], D = L.D, dW = RULES.door.w;
  const isPlant = x => !x.core && !x.corridor && x.kind !== 'bay' && x.kind !== 'hall' && x.kind !== 'spare' && !x.shell && (/(^|_)(pool_plant|bath_plant|plant|mech|pmec|mv)(_|$)/i.test(x.id || '') || /plant room|mechanical|switchgear|\b(pool|bath|spa)\b[^,;()]* plant\b/i.test(x.n || '')) && !/stair|lift|shaft|alcove|transformer/i.test(x.n || '')     && !/chlor|acid|chem|hypo|store|storage/i.test((x.id || '') + ' ' + (x.n || ''));    
  const hasOut = x => D.some(d => d[0] === 1 && ((d[1] === x.id && d[2] === 'OUT') || (d[2] === x.id && d[1] === 'OUT')));
  const others = x => R1.filter(y => y !== x).flatMap(y => y.r);
  const units = ((L.plant && L.plant.items) || []).filter(i => !i.roof && !i.up).map(i => i.r);
  const ways = (S.edges || []).filter(e => e.abuts === 'street' || e.abuts === 'alley');
  const free = (pt, rs) => !rs.some(r => pt[0] > r[0] - 0.45 && pt[0] < r[1] + 0.45 && pt[1] > r[2] - 0.45 && pt[1] < r[3] + 0.45);
  const walkOut = (start, block) => { const g = 0.25, seen = new Set(), q = [start], key = p => Math.round(p[0] / g) + ',' + Math.round(p[1] / g); seen.add(key(start)); let n = 0;
    while (q.length && n++ < 40000) { const p = q.shift(), u = L.toUV(p[0], p[1]); if (ways.some(e => dSeg(u, e.a, e.b) <= 1.0)) return true;
      for (const [da, db] of [[g, 0], [-g, 0], [0, g], [0, -g]]) { const n2 = [p[0] + da, p[1] + db], k = key(n2); if (seen.has(k)) continue; seen.add(k); const u2 = L.toUV(n2[0], n2[1]); if (!inPoly(u2, S.ring) || !free(n2, block)) continue; q.push(n2); } }
    return false; };
  const added = [], flagged = [];
  for (const x of R1.filter(isPlant)) { if (hasOut(x)) continue; const block = others(x).concat(units); let done = false;
    for (const r of x.r) { if (done) break;
      const sides = [{ o: 'v', at: r[0], f: r[2], t: r[3], out: -1 }, { o: 'v', at: r[1], f: r[2], t: r[3], out: 1 }, { o: 'h', at: r[2], f: r[0], t: r[1], out: -1 }, { o: 'h', at: r[3], f: r[0], t: r[1], out: 1 }];
      for (const sd of sides) { if (done) break;
        for (let c = sd.f + 0.6; c <= sd.t - 0.6 + 1e-9; c += 0.5) { const pt = sd.o === 'v' ? [sd.at + sd.out * 0.05, c] : [c, sd.at + sd.out * 0.05], probe = sd.o === 'v' ? [sd.at + sd.out * 0.9, c] : [c, sd.at + sd.out * 0.9];
          if (others(x).some(q => pt[0] > q[0] - 1e-6 && pt[0] < q[1] + 1e-6 && pt[1] > q[2] - 1e-6 && pt[1] < q[3] + 1e-6)) continue;    
          if (!inPoly(L.toUV(probe[0], probe[1]), S.ring) || !free(probe, block)) continue;
          if (!walkOut(probe, block)) continue;
          D.push(sd.o === 'v' ? [1, x.id, 'OUT', r2(sd.at), r2(c), 'v', dW] : [1, x.id, 'OUT', r2(c), r2(sd.at), 'h', dW]); added.push(x.id); done = true; break; } } }
    if (!done) flagged.push(x.id); }
   
  const halls = R1.filter(x => x.big || x.big2), pp = R1.find(x => /pool plant|bath plant|spa plant|pool_plant|bath_plant/i.test((x.id || '') + ' ' + (x.n || '')));    
  if (halls.length && pp && !D.some(d => d[0] === 1 && halls.some(h => (d[1] === pp.id && d[2] === h.id) || (d[2] === pp.id && d[1] === h.id)))) {
    let best = null, big = null; for (const h of halls) for (const r of pp.r) for (const q of h.r) for (const w of wallSeg(r, q)) if (w.len >= dW + 0.2 && (!best || w.len > best.len)) { best = w; big = h; }
    if (best) { const c = r2((best.f + best.t) / 2); D.push(best.o === 'v' ? [1, pp.id, big.id, r2(best.at), c, 'v', dW] : [1, pp.id, big.id, c, r2(best.at), 'h', dW]); added.push(pp.id + ' (from the pool enclosure)'); }
    else flagged.push(pp.id + ' (no wall shared with the pool enclosure)'); }
  if (added.length) (L.flags || (L.flags = [])).push(`Plant-room doors added ( item 3; P1 NBC(AE) 7.2.3.38): ${added.join(', ')}; exterior doors on a wall with 0.9 m of yard and a walk to a street or lane, the pool / bath plant locked from the pool enclosure`);
  if (flagged.length) (L.flags || (L.flags = [])).push(`Plant room: no exterior wall with a walk out, or no wall to the pool enclosure: ${flagged.join(', ')}`); }
function wallSeg(r, q) { const o = [];
  if (Math.abs(r[1] - q[0]) < 0.05 || Math.abs(r[0] - q[1]) < 0.05) { const at = Math.abs(r[1] - q[0]) < 0.05 ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 0) o.push({ o: 'v', at, f, t, len: t - f }); }
  if (Math.abs(r[3] - q[2]) < 0.05 || Math.abs(r[2] - q[3]) < 0.05) { const at = Math.abs(r[3] - q[2]) < 0.05 ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 0) o.push({ o: 'h', at, f, t, len: t - f }); } return o; }
function gateRow(L, S) { const P = L.plant, T = L.toUV; if (!P || !P.items || !T || !S || !S.ring) return null;
  const need = P.items.filter(i => !i.roof && !i.up && (i.kind === 'gen' || i.kind === 'pad')); if (!need.length) return null;
  const uvR = r => { const a = T(r[0], r[2]), c = T(r[1], r[3]); return [Math.min(a[0], c[0]), Math.max(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[1], c[1])]; };
  const FC = RULES.extFace || 0, blk = ((L.rooms || {})[1] || []).flatMap(x => x.r.map(uvR)).map(r => [r[0] - FC, r[1] + FC, r[2] - FC, r[3] + FC]).concat(P.items.filter(i => !i.roof && !i.up).map(i => uvR(i.r))).map(r => [r[0] - 0.05, r[1] + 0.05, r[2] - 0.05, r[3] + 0.05]), ring = S.ring, g = 0.25, H = 12;    
  const us = ring.map(p => p[0]), vs = ring.map(p => p[1]), u0 = Math.min(...us), v0 = Math.min(...vs), nu = Math.ceil((Math.max(...us) - u0) / g), nv = Math.ceil((Math.max(...vs) - v0) / g);
  const free = new Uint8Array(nu * nv); for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const u = u0 + (i + 0.5) * g, v = v0 + (j + 0.5) * g; free[i * nv + j] = inPoly([u, v], ring) && !blk.some(r => u > r[0] && u < r[1] && v > r[2] && v < r[3]) ? 1 : 0; }
  const SA = new Int32Array((nu + 1) * (nv + 1)); for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) SA[(i + 1) * (nv + 1) + j + 1] = (free[i * nv + j] ? 0 : 1) + SA[i * (nv + 1) + j + 1] + SA[(i + 1) * (nv + 1) + j] - SA[i * (nv + 1) + j];    
  const veh = new Uint8Array(nu * nv); for (let i = H; i < nu - H; i++) for (let j = H; j < nv - H; j++) { const i0 = i - H, i1 = i + H + 1, j0 = j - H, j1 = j + H + 1; veh[i * nv + j] = SA[i1 * (nv + 1) + j1] - SA[i0 * (nv + 1) + j1] - SA[i1 * (nv + 1) + j0] + SA[i0 * (nv + 1) + j0] === 0 ? 1 : 0; }
  const ways = (S.edges || []).filter(e => e.abuts === 'street' || e.abuts === 'alley'), court = L.truck && L.truck.court ? uvR(L.truck.court) : null, drive = S.sideDrive && S.sideDrive.r;
  const src = (u, v) => ways.some(e => dSeg([u, v], e.a, e.b) <= RULES.waySrc) || (court && u >= court[0] - 3.5 && u <= court[1] + 3.5 && v >= court[2] - 3.5 && v <= court[3] + 3.5) || (drive && u >= drive[0] - 1 && u <= drive[1] + 1 && v >= drive[2] - 1 && v <= drive[3] + 1);
  const seen = new Uint8Array(nu * nv), q = []; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) if (veh[i * nv + j] && src(u0 + (i + 0.5) * g, v0 + (j + 0.5) * g)) { seen[i * nv + j] = 1; q.push(i * nv + j); }
  while (q.length) { const k = q.pop(), i = Math.floor(k / nv), j = k % nv; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i2 = i + a, j2 = j + b; if (i2 < 0 || j2 < 0 || i2 >= nu || j2 >= nv) continue; const k2 = i2 * nv + j2; if (veh[k2] && !seen[k2]) { seen[k2] = 1; q.push(k2); } } }
  const miss = need.filter(it => { const r = uvR(it.r); if (ways.some(e => [[r[0], r[2]], [r[0], r[3]], [r[1], r[2]], [r[1], r[3]], [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]].some(p => dSeg(p, e.a, e.b) <= 4.5))) return false;     for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { if (!seen[i * nv + j]) continue; const u = u0 + (i + 0.5) * g, v = v0 + (j + 0.5) * g, dx = Math.max(r[0] - u, 0, u - r[1]), dy = Math.max(r[2] - v, 0, v - r[3]); if (Math.hypot(dx, dy) <= 4.5) return false; } return true; });
  return { stair: '-', row: 'Plant-yard vehicle gate (6.1 m) from a drive', status: miss.length ? 'fail' : 'pass', why: miss.length ? `no 6.1 m way from a street, lane, side drive or the truck court reaches ${miss.map(i => i.id).join(', ')}` : `a 6.1 m way reaches every generator and transformer pad at grade; the vehicle gate goes on it, a personnel gate beside it opening from inside without a key (our reading, labelled)` }; }
 
function bayDoors(L) { const R1 = (L.rooms || {})[1] || [], D = L.D; if (!D) return; const add = [];
  const wall = (r, q) => { const o = [];
    if (Math.abs(r[1] - q[0]) < 0.05 || Math.abs(r[0] - q[1]) < 0.05) { const at = Math.abs(r[1] - q[0]) < 0.05 ? r[1] : r[0], f = Math.max(r[2], q[2]), t = Math.min(r[3], q[3]); if (t - f > 0) o.push({ o: 'v', at, f, t, len: t - f }); }
    if (Math.abs(r[3] - q[2]) < 0.05 || Math.abs(r[2] - q[3]) < 0.05) { const at = Math.abs(r[3] - q[2]) < 0.05 ? r[3] : r[2], f = Math.max(r[0], q[0]), t = Math.min(r[1], q[1]); if (t - f > 0) o.push({ o: 'h', at, f, t, len: t - f }); } return o; };
  for (const x of R1.filter(y => y.kind === 'bay')) { const r = x.r[0], mine = D.filter(d => d[0] === 1 && (d[1] === x.id || d[2] === x.id));
    if (!mine.some(d => d[1] === 'OUT' || d[2] === 'OUT')) { const short = (r[1] - r[0]) < (r[3] - r[2]) ? 'a' : 'b';    
      const ends = short === 'a' ? [{ o: 'h', at: r[2], f: r[0], t: r[1] }, { o: 'h', at: r[3], f: r[0], t: r[1] }] : [{ o: 'v', at: r[0], f: r[2], t: r[3] }, { o: 'v', at: r[1], f: r[2], t: r[3] }];
      const free = ends.find(e => !R1.some(y => y !== x && y.r.some(q => wall(r, q).some(w => w.o === e.o && Math.abs(w.at - e.at) < 0.05 && w.len > 0.5))));
      if (free) { const c = r2((free.f + free.t) / 2), w = Math.min(2.8, r2(free.t - free.f - 0.3)); add.push(free.o === 'v' ? [1, x.id, 'OUT', r2(free.at), c, 'v', w] : [1, x.id, 'OUT', c, r2(free.at), 'h', w]); } }
    if (!mine.some(d => { const o = d[1] === x.id ? d[2] : d[1]; return o !== 'OUT' && !/^b[0-9]/.test(o); })) {
      const rank = y => y.kind === 'dock' ? 0 : (y.corridor || /cor$/.test(y.kind)) ? 1 : 2;
      const svc = y => y.kind === 'dock' || y.block === 'data centre' || /stor|pantry|receiv|staging|loading|garb|recycl|kitchen|laundry|dock/i.test((y.n || '') + ' ' + y.id) && !/\bwc\b|washroom|shower|toilet/i.test(y.n || '');    
      const cand = R1.filter(y => y !== x && y.kind !== 'bay' && !y.core && !y.stair && !y.lift && y.kind !== 'hall' && y.kind !== 'shaft' && y.kind !== 'exitpas' && svc(y))
        .map(y => ({ y, w: y.r.flatMap(q => wall(r, q)).sort((p, q) => q.len - p.len)[0] })).filter(c => c.w && c.w.len >= 1.1).sort((p, q) => rank(p.y) - rank(q.y) || q.w.len - p.w.len)[0];
      if (cand) { const w = cand.w, c = r2((w.f + w.t) / 2); add.push(w.o === 'v' ? [1, x.id, cand.y.id, r2(w.at), c, 'v', RULES.door.w] : [1, x.id, cand.y.id, c, r2(w.at), 'h', RULES.door.w]); } } }
  add.forEach(d => D.push(d)); L.bayDoorsAdded = add.length; }
 
function landD(L, st, x) { const r = x.r[0], len = Math.max(r[1] - r[0], r[3] - r[2]), H = L.H || [], h = Math.max(H[st - 1] || 0, H[st - 2] || 0, 4.0);
  const n = Math.ceil(h / RULES.flight.riser - 1e-9), run = (Math.ceil(n / 2) - 1) * RULES.flight.tread; return r2((len - run) / 2); }
function stairDoors(L) { const D = L.D || [], out = []; if (!L.rooms) return;
  D.forEach(d => { const st = d[0], R = L.rooms[st] || [], ids = [d[1], d[2]], x = R.find(y => y.stair && ids.includes(y.id) && y.r.length === 1); if (!x) return;
    const r = x.r[0], o = d[5], w = d[6] || RULES.door.w, h = w / 2, alongB = o === 'v', lo = alongB ? r[2] : r[0], hi = alongB ? r[3] : r[1], c = alongB ? d[4] : d[3];
    const longSide = (hi - lo) >= Math.max(r[1] - r[0], r[3] - r[2]) - 1e-6; if (!longSide) return;    
     
    const others = R.filter(y => y.stair && y !== x).map(y => y.r[0]), far = q => { if (!others.length) return 0; const P = alongB ? [d[3], q] : [q, d[4]]; return r2(Math.min(...others.map(o => Math.hypot(Math.max(o[0] - P[0], 0, P[0] - o[1]), Math.max(o[2] - P[1], 0, P[1] - o[3]))))); };
    const LD = landD(L, st, x), inLand = q => (q - h >= lo - 1e-6 && q + h <= lo + LD + 1e-6) || (q - h >= hi - LD - 1e-6 && q + h <= hi + 1e-6);
    if (inLand(c)) return;
    const other = d[1] === x.id ? d[2] : d[1], wallAt = alongB ? d[3] : d[4], Y = other === 'OUT' ? null : R.find(y => y.id === other);
    const covered = q => { if (!Y) return true; return Y.r.some(qq => alongB ? (Math.abs(qq[0] - wallAt) < 0.05 || Math.abs(qq[1] - wallAt) < 0.05) && qq[2] <= q - h + 1e-6 && qq[3] >= q + h - 1e-6
      : (Math.abs(qq[2] - wallAt) < 0.05 || Math.abs(qq[3] - wallAt) < 0.05) && qq[0] <= q - h + 1e-6 && qq[1] >= q + h - 1e-6); };
    const cand = [r2(lo + Math.min(LD, w + 0.3) / 2 + 0.0), r2(lo + h + 0.05), r2(hi - h - 0.05), r2(hi - Math.min(LD, w + 0.3) / 2)].filter(q => inLand(q) && covered(q)).sort((p, q) => far(q) - far(p) || Math.abs(p - c) - Math.abs(q - c));
    if (cand.length) { if (alongB) d[4] = cand[0]; else d[3] = cand[0]; out.push({ st, stair: x.id, to: other, from: r2(c), at: cand[0] }); return; }
     
    if (!Y || !(Y.corridor || /cor$/.test(Y.kind) || Y.kind === 'circ' || Y.g === 'circ')) return;
    const yr = Y.r.find(qq => alongB ? (Math.abs(qq[0] - wallAt) < 0.05 || Math.abs(qq[1] - wallAt) < 0.05) : (Math.abs(qq[2] - wallAt) < 0.05 || Math.abs(qq[3] - wallAt) < 0.05)); if (!yr) return;
    const yLo = alongB ? yr[2] : yr[0], yHi = alongB ? yr[3] : yr[1], dep = Math.min(yr[1] - yr[0], yr[3] - yr[2]), fromLo = alongB ? Math.abs(yr[1] - wallAt) < 0.05 : Math.abs(yr[3] - wallAt) < 0.05;
    const ends = [r2(lo + h + 0.05), r2(hi - h - 0.05)].filter(inLand).sort((p, q) => far(q) - far(p) || Math.abs(p - (yLo + yHi) / 2) - Math.abs(q - (yLo + yHi) / 2));
    for (const q of ends) { const s0 = Math.min(yLo, r2(q - h - 0.05)), s1 = Math.max(yHi, r2(q + h + 0.05)), piece = alongB ? (fromLo ? [r2(wallAt - dep), wallAt, s0, s1] : [wallAt, r2(wallAt + dep), s0, s1]) : (fromLo ? [s0, s1, r2(wallAt - dep), wallAt] : [s0, s1, wallAt, r2(wallAt + dep)]);
      const hit = R.filter(y => y !== Y && y.r.some(rr => Math.min(rr[1], piece[1]) - Math.max(rr[0], piece[0]) > 0.05 && Math.min(rr[3], piece[3]) - Math.max(rr[2], piece[2]) > 0.05));
      if (hit.some(y => y.core || y.stair || y.lift || y.kind === 'hall' || y.kind === 'shaft')) continue;
      if (RULES.landSupport && +st > 1 && subAll([piece], (L.rooms[+st - 1] || []).flatMap(y => y.r || [])).some(rr => ra(rr) > 0.05)) continue;    
      hit.forEach(y => { y.r = subAll(y.r, [piece]).filter(rr => ra(rr) >= 0.5); }); for (let i = R.length - 1; i >= 0; i--) if (!R[i].r.length) R.splice(i, 1);
      Y.r = Y.r.concat(subAll([piece], Y.r).filter(rr => ra(rr) >= 0.05)); if (alongB) d[4] = q; else d[3] = q;
      out.push({ st, stair: x.id, to: other, from: r2(c), at: q, bay: piece.map(r2), from_rooms: hit.map(y => y.id) }); return; } });
  L.stairMoved = out; }
function stairRows(L) { const R = L.rooms || {}, D = L.D || [], sts = Object.keys(R).map(Number).sort((a, b) => a - b), rows = [], H = L.H || [];
  const ids = [...new Set(sts.flatMap(st => R[st].filter(x => x.stair).map(x => x.id)))];
  const near = (p, q) => p.length === q.length && p.every((r, i) => r.every((v, j) => Math.abs(v - q[i][j]) <= 0.1 + 1e-6));
  for (const id of ids) { const on = sts.filter(st => R[st].some(x => x.id === id && x.stair)), lo = on[0], hi = on[on.length - 1], X = st => R[st].find(x => x.id === id && x.stair);
    const block = X(lo).block, add = (row, ok, why) => rows.push({ stair: id, row, status: ok ? 'pass' : 'fail', why });
     
    const bad = []; on.forEach(st => { const x = X(st); if (x.r.length !== 1) return; const r = x.r[0], LD = landD(L, st, x);
      D.filter(d => d[0] === st && (d[1] === id || d[2] === id)).forEach(d => { const alongB = d[5] === 'v', a0 = alongB ? r[2] : r[0], a1 = alongB ? r[3] : r[1], c = alongB ? d[4] : d[3], h = (d[6] || RULES.door.w) / 2;
        if ((a1 - a0) < Math.max(r[1] - r[0], r[3] - r[2]) - 1e-6) return; if (!((c - h >= a0 - 1e-6 && c + h <= a0 + LD + 1e-6) || (c - h >= a1 - LD - 1e-6 && c + h <= a1 + 1e-6))) bad.push(`storey ${st} door to ${d[1] === id ? d[2] : d[1]}`); }); });
    add('Stair door onto a landing', !bad.length, bad.length ? `${bad.join('; ')}: on the flight (landing ${landD(L, lo, X(lo))} m deep at each end)` : 'every door on a landing');
     
    const gap = []; for (let st = lo; st <= hi; st++) { const x = X(st); if (!x) gap.push(`missing on storey ${st}`); else if (!near(x.r, X(lo).r)) gap.push(`moves on storey ${st}`); }
    add('Stair lines up storey to storey', !gap.length, gap.length ? gap.join('; ') : `same footprint on storeys ${lo}–${hi}`);
     
    const nod = on.filter(st => !D.some(d => d[0] === st && (d[1] === id || d[2] === id)));
    add('Stair has a door on every storey it serves', !nod.length, nod.length ? `no door on storey ${nod.join(', ')}` : 'a door on each storey');
     
    const R1 = R[1] || [], dis = lo === 1 ? D.filter(d => d[0] === 1 && (d[1] === id || d[2] === id)).map(d => d[1] === id ? d[2] : d[1]).filter(o => o === 'OUT' || (R1.find(y => y.id === o) || {}).kind === 'exitpas') : [];
    add('Stair discharges outside or into an exit passage at grade (NBC Div. A 1.4.1.2, Exit)', dis.length > 0, lo !== 1 ? `does not reach grade (lowest storey ${lo})` : dis.length ? `to ${dis.join(', ')}` : 'its doors at grade open into rooms or a lobby only');
     
    if (block === 'data centre' && lo === 1) { const pub = D.filter(d => d[0] === 1 && (d[1] === id || d[2] === id)).map(d => d[1] === id ? d[2] : d[1]).filter(o => o !== 'OUT').map(o => R1.find(y => y.id === o)).filter(y => y && y.kind !== 'exitpas' && y.block !== 'data centre' && !y.dcSide);
      add('Data-centre stair on the data-centre side', !pub.length, pub.length ? `opens at grade into ${pub.map(y => y.id).join(', ')} (public side)` : 'opens only to the data-centre side or outside'); } }
   
  const lifts = [...new Set(sts.flatMap(st => R[st].filter(x => x.lift).map(x => x.id)))];
  for (const id of lifts) { const on = sts.filter(st => R[st].some(x => x.id === id && x.lift)), X = st => R[st].find(x => x.id === id && x.lift), gap = [];
    for (let st = on[0]; st <= on[on.length - 1]; st++) { const x = X(st); if (!x) gap.push(`missing on storey ${st}`); else if (!near(x.r, X(on[0]).r)) gap.push(`shaft moves on storey ${st}`); }
    rows.push({ stair: id, row: 'Lift shaft stacks storey to storey', status: gap.length ? 'fail' : 'pass', why: gap.length ? gap.join('; ') : `same shaft on storeys ${on[0]}–${on[on.length - 1]}` }); }
   
  (R[1] || []).filter(x => x.kind === 'bay').forEach(x => { const ds = D.filter(d => d[0] === 1 && (d[1] === x.id || d[2] === x.id)).map(d => d[1] === x.id ? d[2] : d[1]);
    const ins = ds.filter(o => o !== 'OUT' && !(R[1].find(y => y.id === o) || {}).kind?.startsWith?.('bay')), out = ds.includes('OUT');
     
    const run = new Set([x.id]); let grow = true; while (grow) { grow = false; for (const y of R[1].filter(z => z.kind === 'bay' && !run.has(z.id))) if ([...run].some(id => { const z = R[1].find(w => w.id === id); return z.r.some(r => y.r.some(q => Math.min(r[1], q[1]) - Math.max(r[0], q[0]) > -0.01 && Math.min(r[3], q[3]) - Math.max(r[2], q[2]) > -0.01)); })) { run.add(y.id); grow = true; } }
    const viaRun = !ins.length && D.some(d => d[0] === 1 && [...run].some(id => (d[1] === id && d[2] !== 'OUT' && !run.has(d[2])) || (d[2] === id && d[1] !== 'OUT' && !run.has(d[1]))));
    rows.push({ stair: x.id, row: 'Loading space has an inside door and an overhead door', status: (ins.length || viaRun) && out ? 'pass' : 'fail', why: `${ins.length ? 'inside door to ' + ins.join(', ') : viaRun ? 'inside door of its run of loading spaces (one open space, our reading)' : 'no inside door'}; ${out ? 'overhead door' : 'no overhead door'}` }); });
   
  for (const st of sts) { const hs = R[st].filter(x => x.kind === 'hall'), cs = R[st].filter(x => x.core || x.stair || x.lift || x.kind === 'shaft'); if (!hs.length) continue;
    const ov = sum(hs.flatMap(h => h.r.flatMap(r => cs.flatMap(c => c.r.map(q => Math.max(0, Math.min(r[1], q[1]) - Math.max(r[0], q[0])) * Math.max(0, Math.min(r[3], q[3]) - Math.max(r[2], q[2]))))))) ;
    rows.push({ stair: '-', st, row: 'Data-hall area excludes stairs, lifts and shafts', status: ov > 0.5 ? 'fail' : 'pass', why: ov > 0.5 ? `storey ${st}: ${r2(ov)} m² of hall over a core` : `storey ${st}: no core inside the hall` }); }
   
  for (const st of sts) { const Rs = R[st], lift = new Set(Rs.filter(x => x.lift || x.kind === 'shaft').map(x => x.id)), K = new Set(Rs.map(x => x.id)), adj = new Map();
    const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); }; D.filter(d => d[0] === st).forEach(d => { link(d[1], d[2]); link(d[2], d[1]); });
    const exitN = id => id === 'OUT' || Rs.some(x => x.id === id && (x.stair || x.kind === 'exitpas'));
    const reach = noLift => { const seen = new Set(), q = []; Rs.filter(x => exitN(x.id)).forEach(x => { seen.add(x.id); q.push(x.id); }); if (st === 1) { seen.add('OUT'); q.push('OUT'); }
      while (q.length) { const a = q.shift(); for (const b of adj.get(a) || []) { if (seen.has(b) || (noLift && lift.has(b))) continue; seen.add(b); q.push(b); } } return seen; };
    const all = reach(false), nl = reach(true), via = Rs.filter(x => !lift.has(x.id) && all.has(x.id) && !nl.has(x.id)).map(x => x.id);
    if (lift.size) rows.push({ stair: '-', st, row: 'No route through a lift car or shaft', status: via.length ? 'fail' : 'pass', why: via.length ? `storey ${st}: ${via.join(', ')} reached only through ${[...lift].join(', ')}` : `storey ${st}: every room reaches an exit without a lift` }); }
  return rows; }
 
function exitsOf(L, z) { const R = L.rooms[z.st], inZ = new Set(z.ids), K = new Map(R.map(x => [x.id, x])), out = [];
  for (const d of L.D) { if (d[0] !== z.st) continue; const [st, a, b, u, v, o, w] = d;
    const one = inZ.has(a) ? b : inZ.has(b) ? a : null; if (one == null) continue; const own = inZ.has(a) ? a : b;
    if (one === 'OUT') { const x = K.get(own); if (x && x.kind === 'bay') continue; if (x && x.kind === 'dock') continue; out.push({ via: own, to: 'outside', u, v, o, w }); continue; }
    const y = K.get(one); if (!y) continue;
    if (y.stair) out.push({ via: own, to: y.id, u, v, o, w, stair: true });
    else if (y.kind === 'exitpas') out.push({ via: own, to: y.id, u, v, o, w, pas: true }); }
  return out; }
function travel(L, z) {
  const g = RULES.grid.g, R = L.rooms[z.st], inZ = new Set(z.ids), rs = R.filter(x => inZ.has(x.id) && x.kind !== 'shaft');
  const cell = new Map(), key = (i, j) => i + ',' + j;
  rs.forEach(x => x.r.forEach(r => { for (let i = Math.round(r[0] / g); i < Math.round(r[1] / g); i++) for (let j = Math.round(r[2] / g); j < Math.round(r[3] / g); j++) cell.set(key(i, j), x.id); }));
   
  const link = new Set(), tgt = [];
  for (const d of L.D) { if (d[0] !== z.st) continue; const [st, a, b, u, v, o, w] = d, h = w / 2;
    const ab = [a, b].filter(x => inZ.has(x)); if (!ab.length) continue;
    const ex = exitsOf(L, z).some(e => Math.abs(e.u - u) < 1e-6 && Math.abs(e.v - v) < 1e-6);
    if (o === 'v') { const i1 = Math.round(u / g), i0 = i1 - 1; for (let j = Math.floor((v - h) / g + 1e-6); j < Math.ceil((v + h) / g - 1e-6); j++) { link.add(key(i0, j) + '|' + key(i1, j)); link.add(key(i1, j) + '|' + key(i0, j)); if (ex) [key(i0, j), key(i1, j)].forEach(k => { if (cell.has(k) && inZ.has(cell.get(k))) tgt.push(k); }); } }
    else { const j1 = Math.round(v / g), j0 = j1 - 1; for (let i = Math.floor((u - h) / g + 1e-6); i < Math.ceil((u + h) / g - 1e-6); i++) { link.add(key(i, j0) + '|' + key(i, j1)); link.add(key(i, j1) + '|' + key(i, j0)); if (ex) [key(i, j0), key(i, j1)].forEach(k => { if (cell.has(k) && inZ.has(cell.get(k))) tgt.push(k); }); } } }
  if (!tgt.length) return { zone: z.name, worst: null, why: 'no exit door in the zone' };
   
  const dist = new Map(), prev = new Map(), H = [];
  const push = (k, d) => { H.push([d, k]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const t = H[0], l = H.pop(); if (H.length) { H[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return t; };
  tgt.forEach(k => { dist.set(k, g / 2); push(k, g / 2); });
  const N8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  while (H.length) { const [d, k] = pop(); if (d > dist.get(k) + 1e-9) continue; const [i, j] = k.split(',').map(Number), rid = cell.get(k);
    for (const [di, dj, c] of N8) { const n = key(i + di, j + dj); if (!cell.has(n)) continue; const nid = cell.get(n);
      if (nid !== rid) { if (di && dj) continue; if (!link.has(k + '|' + n)) continue; }
      else if (di && dj && (cell.get(key(i + di, j)) !== rid || cell.get(key(i, j + dj)) !== rid)) continue;
      const nd = d + c * g; if (nd < (dist.has(n) ? dist.get(n) : Infinity) - 1e-9) { dist.set(n, nd); prev.set(n, k); push(n, nd); } } }
  let worst = -1, wk = null, unreached = 0; for (const k of cell.keys()) { if (!dist.has(k)) { unreached++; continue; } if (dist.get(k) > worst) { worst = dist.get(k); wk = k; } }
  const path = []; for (let k = wk; k; k = prev.get(k)) { const [i, j] = k.split(',').map(Number); path.push([r2((i + 0.5) * g), r2((j + 0.5) * g)]); }
  const lim = travelLimit(z); let status = worst <= lim + 1e-9 ? 'pass' : 'fail';    
  let exc = null; if (status === 'fail' && RULES.dcPerimeter && /data centre|hall/.test(z.name)) { exc = perimeterExits(L, z); if (exc.ok) status = 'pass'; }
  return Object.assign({ zone: z.name, st: z.st, worst: r2(worst), status, ok: status !== 'fail', limit: lim, path, unreached, basis: RULES.grid.why }, exc ? { perim: exc } : {});
}
 
 
function travelLimit(z) { return /clinic/i.test(z.name || '') ? 40 : 45; }
function perimeterExits(L, z) { const R = L.rooms[z.st] || [], ex = exitsOf(L, z), inAny = (a, b) => R.some(x => x.r.some(r => a > r[0] && a < r[1] && b > r[2] && b < r[3]));
  const onWall = x => x.r.some(r => { for (let t = 0.25; t < 1; t += 0.25) { const a = r[0] + (r[1] - r[0]) * t, b = r[2] + (r[3] - r[2]) * t;
    if (!inAny(r[0] - 0.3, b) || !inAny(r[1] + 0.3, b) || !inAny(a, r[2] - 0.3) || !inAny(a, r[3] + 0.3)) return true; } return false; });
  const K = new Map(R.map(x => [x.id, x])), seen = new Set(), pts = []; let inner = 0;
  for (const e of ex) { const k = e.to === 'outside' ? 'o' + e.u + ',' + e.v : e.to; if (seen.has(k)) continue; seen.add(k);
    const ok = e.to === 'outside' || (K.get(e.to) && onWall(K.get(e.to))); if (!ok) { inner++; continue; } pts.push([e.u, e.v]); }
  const zr = R.filter(x => z.ids.includes(x.id)).flatMap(x => x.r); if (!zr.length || pts.length < 2 || inner) return { ok: false, n: pts.length, inner, why: inner ? `${inner} exit${inner === 1 ? '' : 's'} not on the perimeter` : 'fewer than two exits on the perimeter' };
  const a0 = Math.min(...zr.map(r => r[0])), a1 = Math.max(...zr.map(r => r[1])), b0 = Math.min(...zr.map(r => r[2])), b1 = Math.max(...zr.map(r => r[3])), A = a1 - a0, B = b1 - b0, P = 2 * (A + B);
  const par = ([a, b]) => { const c = [Math.abs(b - b0), Math.abs(a - a1), Math.abs(b - b1), Math.abs(a - a0)], m = c.indexOf(Math.min(...c));
    const ac = Math.max(a0, Math.min(a1, a)), bc = Math.max(b0, Math.min(b1, b)); return m === 0 ? ac - a0 : m === 1 ? A + bc - b0 : m === 2 ? A + B + a1 - ac : 2 * A + B + b1 - bc; };
  const t = pts.map(par).sort((x, y) => x - y), gaps = t.map((v, i) => i < t.length - 1 ? t[i + 1] - v : P - v + t[0]), gmax = r2(Math.max(...gaps));
  return { ok: gmax <= 60 + 1e-6, n: pts.length, gap: gmax, perimeter: r2(P), why: `${pts.length} exits on the perimeter, the largest gap along it ${gmax} m (60 m allowed)` }; }
 
function doorSeg(u, v, o, w) { const h = (w || 0.9) / 2; return o === 'v' ? [[u, v - h], [u, v + h]] : [[u - h, v], [u + h, v]]; }
function segDist(s1, s2) { const pd = (p, s) => { const [a, b] = s, dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; let t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), [p, q] = s1, [r, s] = s2;
  if (cr(p, q, r) * cr(p, q, s) < 0 && cr(r, s, p) * cr(r, s, q) < 0) return 0;
  return Math.min(pd(p, s2), pd(q, s2), pd(r, s1), pd(s, s1)); }
function apart(L, z) { const ex = exitsOf(L, z), R = L.rooms[z.st].filter(x => z.ids.includes(x.id));
  let a = [1e9, -1e9, 1e9, -1e9]; R.forEach(x => x.r.forEach(r => { a = [Math.min(a[0], r[0]), Math.max(a[1], r[1]), Math.min(a[2], r[2]), Math.max(a[3], r[3])]; }));
  const diag = Math.hypot(a[1] - a[0], a[3] - a[2]), need = z.pubCor ? Math.min(diag / 2, 9) : Math.max(diag / 2, 9);
  let best = null; for (let i = 0; i < ex.length; i++) for (let j = i + 1; j < ex.length; j++) { const d = segDist(doorSeg(ex[i].u, ex[i].v, ex[i].o, ex[i].w), doorSeg(ex[j].u, ex[j].v, ex[j].o, ex[j].w)); if (!best || d > best.d) best = { d, a: ex[i], b: ex[j] }; }    
  let path = null; if (best && best.d < need - 1e-6 && RULES.exitPath !== false) { for (let i = 0; i < ex.length; i++) for (let j = i + 1; j < ex.length; j++) { const d = exitPathDist(L, z, ex[i], ex[j]); if (d != null && (!path || d > path.d)) path = { d, a: ex[i], b: ex[j] }; }
    if (path && path.d > best.d) best = Object.assign({}, path, { path: true }); else path = null; }    
  return { zone: z.name, st: z.st, exits: ex.length, apart_m: best ? r2(best.d) : null, need_m: r2(need), status: best ? (TR() ? TR().judge(best.d, need, 'min', 'm') : (best.d >= need - 1e-6 ? 'pass' : 'fail')) : 'fail', ok: !!best && (TR() ? TR().judge(best.d, need, 'min', 'm') !== 'fail' : best.d >= need - 1e-6), rule: z.pubCor ? 'with a public corridor: ≥ min(½ diagonal, 9 m)' : '≥ max(½ diagonal, 9 m)', a: best && best.a, b: best && best.b, how: best && best.path ? `along the shortest path inside the floor area, door to door (NBC(AE) 3.4.2.3.(3); the straight line is shorter)` : 'door to door as a stand-in (VBBL 3.4.2.3.(1), (3))' }; }
 
 
function exitPathDist(L, z, eA, eB) { const g = RULES.grid.g, R = L.rooms[z.st], inZ = new Set(z.ids), rs = R.filter(x => inZ.has(x.id) && x.kind !== 'shaft');
  const cell = new Map(), key = (i, j) => i + ',' + j; rs.forEach(x => x.r.forEach(r => { for (let i = Math.round(r[0] / g); i < Math.round(r[1] / g); i++) for (let j = Math.round(r[2] / g); j < Math.round(r[3] / g); j++) cell.set(key(i, j), x.id); }));
  const link = new Set(), at = e => { const out = [], h = (e.w || 0.9) / 2; if (e.o === 'v') { const i1 = Math.round(e.u / g); for (let j = Math.floor((e.v - h) / g + 1e-6); j < Math.ceil((e.v + h) / g - 1e-6); j++) [key(i1 - 1, j), key(i1, j)].forEach(k => { if (cell.has(k)) out.push(k); }); }
    else { const j1 = Math.round(e.v / g); for (let i = Math.floor((e.u - h) / g + 1e-6); i < Math.ceil((e.u + h) / g - 1e-6); i++) [key(i, j1 - 1), key(i, j1)].forEach(k => { if (cell.has(k)) out.push(k); }); } return out; };
  for (const d of L.D) { if (d[0] !== z.st) continue; const [, a, b, u, v, o, w] = d; if (!inZ.has(a) || !inZ.has(b)) continue; const h = w / 2;
    if (o === 'v') { const i1 = Math.round(u / g), i0 = i1 - 1; for (let j = Math.floor((v - h) / g + 1e-6); j < Math.ceil((v + h) / g - 1e-6); j++) { link.add(key(i0, j) + '|' + key(i1, j)); link.add(key(i1, j) + '|' + key(i0, j)); } }
    else { const j1 = Math.round(v / g), j0 = j1 - 1; for (let i = Math.floor((u - h) / g + 1e-6); i < Math.ceil((u + h) / g - 1e-6); i++) { link.add(key(i, j0) + '|' + key(i, j1)); link.add(key(i, j1) + '|' + key(i, j0)); } } }
  const A = at(eA), B = new Set(at(eB)); if (!A.length || !B.size) return null;
  const dist = new Map(), H = []; const push = (k, d) => { H.push([d, k]); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const t = H[0], l = H.pop(); if (H.length) { H[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return t; };
  A.forEach(k => { dist.set(k, 0); push(k, 0); });
  const N8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  while (H.length) { const [d, k] = pop(); if (d > dist.get(k) + 1e-9) continue; if (B.has(k)) return r2(d); const [i, j] = k.split(',').map(Number), rid = cell.get(k);
    for (const [di, dj, c] of N8) { const n = key(i + di, j + dj); if (!cell.has(n)) continue; const nid = cell.get(n);
      if (nid !== rid) { if (di && dj) continue; if (!link.has(k + '|' + n)) continue; } else if (di && dj && (cell.get(key(i + di, j)) !== rid || cell.get(key(i, j + dj)) !== rid)) continue;
      const nd = d + c * g; if (nd < (dist.has(n) ? dist.get(n) : Infinity) - 1e-9) { dist.set(n, nd); push(n, nd); } } }
  return null; }
function discharges(L) { const out = [], st = L.rooms[1].filter(x => x.stair), vs = L.rooms[1].filter(x => x.vest), ex = L.D.filter(d => d[0] === 1 && d[2] === 'OUT' && (st.some(x => x.id === d[1]) || vs.some(x => x.id === d[1]))).map(d => { const v = vs.find(x => x.id === d[1]); return v ? [d[0], v.vest].concat(d.slice(2)) : d; });    
  for (let i = 0; i < ex.length; i++) for (let j = i + 1; j < ex.length; j++) { const p = ex[i], q = ex[j], d = segDist(doorSeg(p[3], p[4], p[5], p[6]), doorSeg(q[3], q[4], q[5], q[6])), near = p[3] <= 15 && q[3] <= 15, need = near ? 6 : 9;
    const status = TR() ? TR().judge(d, need, 'min', 'm') : (d >= need - 1e-6 ? 'pass' : 'fail');
    out.push({ a: p[1], b: q[1], d: r2(d), need, status, ok: status !== 'fail', why: near ? 'sprinklered, both within 15 m of the street: 6 m (VBBL 3.4.2.3.(4))' : '9 m (VBBL 3.4.2.3.(4))' }); }
  return out; }
function loadingOf(L, S) { const van = S.city === 'van';
  if (van) return { n: L.nb, why: L.shared ? 'shared by approval (5.1.5)' : `data centre ${Math.round(L.dcArea)} m² → ${L.kind === 'stacked' ? L.nDC : '?'} (5.2.5); refuge and shelter rooms ${Math.round(L.hubArea)} m² → ${L.nRef} (5.2.3, our reading of the use); clinic ${Math.round(L.clin)} m² → ${L.nCl} (5.2.9)`, size: 'Class B 10.2 × 3.4 × 3.8 m (5.5.1.2)', aisle: '6.1 m (5.4.1)' };
  const tot = L.grossFloor != null ? L.grossFloor : L.hubArea + L.clin + L.dcArea; return { n: L.nb, why: `${L.grossFloor != null ? 'gross floor area (s. 8.20)' : 'non-residential floor'} ${Math.round(tot)} m² → ${L.nb} (Zoning Bylaw 20001 s. 5.80 Table 7.2: under 2,500 none, to 7,500 one)`, size: '9.0 × 3.3 m, 4.0 m clear (Table 7.2)', aisle: '6.1 m (Vancouver’s, ?)' }; }
 
function grades(L, S) { const out = { datum: S.gradeDatum || '?' };
  const lob = (L.D || []).find(d => d[0] === 1 && d[1] === 'lob' && d[2] === 'OUT');
  const roofRel = sum(L.H); out.storeys = L.H; out.roofRel = r2(roofRel);
  if (!S.grade) { out.slab = null; out.street = null; out.stepFree = '?'; out.height = null; out.why = S.city === 'van' ? 'no corner and street grades on file for this lot (?)' : 'no corner and street grades on file for this lot (?)'; return out; }
  const doorUV = lob ? L.toUV(lob[3], lob[4]) : null; let street = null, sd = 1e9;
  if (doorUV) for (const e of S.grade.edges) { const [ax, ay] = e.a, [bx, by] = e.b, dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((doorUV[0] - ax) * dx + (doorUV[1] - ay) * dy) / l2));
    const d = Math.hypot(doorUV[0] - ax - t * dx, doorUV[1] - ay - t * dy); if (d < sd) { sd = d; const ts = [0.1, 0.3, 0.5, 0.7, 0.9]; let z = null, bd = 1e9; ts.forEach((tt, i) => { if (e.z[i] != null && Math.abs(tt - t) < bd) { bd = Math.abs(tt - t); z = e.z[i]; } }); street = z; } }
  out.street = street; out.streetWhy = 'sidewalk grade 1.5 m outside the street edge nearest the lobby door (LiDAR 2022, 0.1 m steps; make_grade_points.py)';
  const fcl = S.fcl ? S.fcl.v : null; out.fcl = fcl;
  out.slab = street != null ? r2(Math.max(street, fcl || -1e9)) : fcl; out.slabWhy = fcl != null ? `the higher of the street at the lobby door and the FCL ${fcl} m (VBBL Div. A; slab flush with the sidewalk where it is above the FCL, drawing choice)` : 'flush with the street at the lobby door (drawing choice)';
  if (street != null && out.slab != null) { const dz = r2(out.slab - street);
    out.rise = dz; out.stepFree = dz <= 0.013 ? (dz <= 0.0 ? 'level (LiDAR reads the street at the slab: 0.0–0.1 m, sloped floor ≤ 1:20 over 2.0 m drawn, survey before design)' : 'level') : dz <= 0.1 ? 'sloped floor ≤ 1:20 over the first 2.0 m inside the door (LiDAR 0.1 m steps: survey before design)' : `ramp ≤ 1:12 inside the lobby: ${r2(12 * dz)} m plus landings (VBBL 3.8.3.5) (?)`;
    if (dz <= 0.0) out.stepFree = 'sloped floor ≤ 1:20 over the first 2.0 m inside the door: LiDAR reads 0.0–0.1 m (0.1 m steps cannot show 13 mm), survey before design'; }
   
  const C = S.grade.corners.filter(c => c[2] != null); out.corners = C.length;
  if (C.length >= 3 && out.slab != null) {
    const zFan = (k, u, v) => { const n = C.length; for (let i = 1; i < n - 1; i++) { const A = C[k], B = C[(k + i) % n], Cc = C[(k + i + 1) % n], d = (B[1] - Cc[1]) * (A[0] - Cc[0]) + (Cc[0] - B[0]) * (A[1] - Cc[1]); if (Math.abs(d) < 1e-9) continue;
      const l1 = ((B[1] - Cc[1]) * (u - Cc[0]) + (Cc[0] - B[0]) * (v - Cc[1])) / d, l2 = ((Cc[1] - A[1]) * (u - Cc[0]) + (A[0] - Cc[0]) * (v - Cc[1])) / d, l3 = 1 - l1 - l2;
      if (l1 >= -1e-6 && l2 >= -1e-6 && l3 >= -1e-6) return l1 * A[2] + l2 * B[2] + l3 * Cc[2]; } return null; };
     
    const zAt = (u, v) => { const a = zFan(0, u, v), b = zFan(1, u, v); return a == null ? b : b == null ? a : Math.min(a, b); };
    const zFan0 = (u, v) => zFan(0, u, v);
    let lo = 1e9, at = null; for (let a = 0; a <= L.Da + 1e-9; a += 1) for (let b = 0; b <= L.W + 1e-9; b += 1) { const [u, v] = L.toUV(Math.min(a, L.Da), Math.min(b, L.W)), z = zAt(u, v); if (z != null && z < lo) { lo = z; at = [a, b]; } }
    if (at) { out.base = r2(lo); out.baseAt = at; out.roof = r2(out.slab + roofRel); out.height = r2(out.roof - lo); out.hLimit = S.hLimit; out.heightStatus = S.hLimit ? (TR() ? TR().judge(out.height, S.hLimit, 'max', 'm') : (out.height <= S.hLimit + 1e-6 ? 'pass' : 'fail')) : null; out.heightOk = S.hLimit ? out.heightStatus !== 'fail' : null; out.baseWhy = RULES.base.why; let lo0 = 1e9; for (let a = 0; a <= L.Da + 1e-9; a += 1) for (let b = 0; b <= L.W + 1e-9; b += 1) { const [u, v] = L.toUV(Math.min(a, L.Da), Math.min(b, L.W)), z = zFan0(u, v); if (z != null && z < lo0) lo0 = z; } out.baseFan0 = lo0 < 1e9 ? r2(lo0) : null; }
  }
  return out; }

 
function v2Checks(L, S) {
  const H = HC(); if (!H || !L.G || !L.fromUV) return null;
  const G = { S: {}, D: L.D, H: L.H, SLAB: 0.0 };
  Object.keys(L.G.S).forEach(k => { G.S[k] = L.G.S[k].map(x => ({ id: x.id, n: x.n, g: x.g, r: x.r, core: !!x.core, stair: !!x.stair })); });
  G.LOTPOLY = S.ring.map(p => L.fromUV(p[0], p[1]));
  G.STREET_EDGES = S.edges.filter(e => e.abuts === 'street' || e.abuts === 'alley').map(e => [L.fromUV(e.a[0], e.a[1]), L.fromUV(e.b[0], e.b[1])]);
  G.PLANT = ((L.plant && L.plant.items) || []).filter(it => !it.pseudo && !it.roof).map(it => ({ id: it.id, n: it.n, r: it.r }));
  G.DCSPACE = L.truck && L.truck.court ? [L.truck.court] : [];
  if (L.plantUp) G.PLANT_YARDS = [];    
  const hsIt = ((L.plant && L.plant.items) || []).find(it => it.hub && it.roof); if (hsIt) G.HUBGEN = [hsIt.r, hsIt.n];    
  if (L.truck && L.truck.court) G.COURT = L.truck.court;
  const st1 = G.S['1'] || [], van = S.city === 'van';
  const cfg = { city: S.city, code: van ? 'VBBL' : 'NBC 2023 (AE)', refuge_ids: st1.filter(x => x.g === 'pub' && /^ref/.test(x.id)).map(x => x.id),
    shelter_ids: st1.filter(x => x.g === 'pub' && /^shel/.test(x.id)).map(x => x.id), small_lot: !!(S.lotType && S.lotType[0] === 'small'), zones: L.zones || [] };
  const m = H.measureSizing(G, cfg);
  m.exits = (L.apart || []).filter(a => a.apart_m != null).map(a => [a.zone, a.apart_m, a.need_m, a.need_m, !!((L.zones || []).find(z => z.name === a.zone) || {}).pubCor]);
  m.discharges = (L.discharge || []).map(d => [d.a, d.b, d.d, d.need]);
  m.travel = (L.travel || []).map(t => [t.zone, t.worst == null ? Infinity : t.worst, t.worst == null ? (t.why || 'no exit reached') : '-']);
  m.zone_exits = (L.zones || []).map(z => [z.name].concat(H.zoneExits(G, z.st, z.ids)));
  m.nb = L.nb; m.ref = m.ref_counted;
  const area = x => x.r.reduce((a, r) => a + (r[1] - r[0]) * (r[3] - r[2]), 0), sts = Object.keys(G.S).map(Number);
  m.dc = sts.reduce((a, st) => a + G.S[st].filter(x => ['hall', 'sup'].includes(x.g) || (st > 1 && x.g === 'spare')).reduce((b, x) => b + area(x), 0), 0);
  m.gen1 = 78 - 20 * Math.log10(6.1 / 7); m.genall = m.gen1 + 10 * Math.log10(m.ngen);
  const rows = H.commonChecks(G, cfg, m); if (RULES.patchesOn && L.rooms) { L.m = m; L.patchRows = patchRows(L, S, patchG(L, S), 'all'); }         (L.patchRows || []).forEach(r => rows.push([r.status, `${r.title} [check ${r.pid}]`, r.src || '', r.text || '']));    
   
  if (hsIt && hsIt.up && H.hubsetRow) { const i = rows.findIndex(r => r[1] === 'Hub generator (72 h)'); if (i >= 0) { const G1 = Object.assign({}, G, { S: { [hsIt.up]: G.S[hsIt.up] || G.S[String(hsIt.up)] } }); try { rows[i] = H.hubsetRow(G1, cfg, m); } catch (e) {   } } }
  rows.push(['tight', 'Service access around the sets', 'Kohler TP-5700 s. 3.2 (our reading for KD sets); the hub test fits, 12 Nov 2026', `each generator set placed with at least 457 mm clear round it inside the plant yard (${((L.plant && L.plant.items) || []).filter(it => it.kind === 'gen').length} sets): check in design`]);
  return { rows, cfg, notDrawn: ['plant yards and gates (step 4)', '2 h wall marks (steps 3–4)', 'fuel fill (step 5)'], version: H.version };
}

 
function build(P) { if (!P || !P.s || !P.s.M || !P.s.M.F) return null;
   
  if ((P.boxes || []).some(b => b.id === 'refuge' && b.asIfRezoned)) return { hub: { doesntFit: true, asIfRezoned: true, why: 'Edmonton: the refuge is shown as if rezoned; the hub layout comes from the library' } };
   
  if (typeof document !== 'undefined' && RULES.deadline == null) { RULES.deadline = Date.now() + 6000; RULES.hardDeadline = Date.now() + RULES.hardMs;
    try { return build0(P); } catch (e) { if (e !== HARD_STOP) throw e; const why = `the layout search passed its ${RULES.hardMs / 1000} s time limit in the browser before a plan was found; no plan here is not a finding that it does not fit (the library layouts for this lot are not affected)`;
      return { hub: { doesntFit: { limiting: [why], timeout: true }, flags: ['Timeout: ' + why], variant: { main: 'stacked', flags: [], notBuilt: [] }, site: {}, timedOut: true } }; }
    finally { RULES.deadline = null; RULES.hardDeadline = null; } }
  return build0(P); }
function build0(P) { const S = siteOf(P); const FB = root && root.BD && (root.BD.hubEngineOnly || S.typDef || S.wingTyp) ? null : frozenBoard(S); if (FB) return FB;
  const PL = fromSite(S), H = PL && PL.hub; if (RULES.transplant && H && !S.typDef && !S.wingTyp) { const sideBand = (H.flags || []).some(f => /^Storey 2 side band/.test(f)), need = H.estimate || variantNeed(S, H.rooms ? H : null) || (!H.rooms || sideBand ? { keys: [S.city === 'edm' ? 'growyard' : 'line'] } : null);     if (need) { const T = transplant(S, need.keys); if (T) return T; } } return PL; }    
 
const FROZ = {}, BOARDFILE = { frozen: 'hub_frozen', clipped: 'hub_clip', engine: 'hub_laid' }, BOARDHAS = { clipped: ['van'], engine: ['van'] };    
function frozenData(city) { const src = BOARDFILE[RULES.boardSource] ? RULES.boardSource : 'frozen'; if (src === 'frozen') return boardFile(city, 'frozen'); const A = boardFile(city, 'frozen') || {}, B = boardFile(city, src); return B ? Object.assign({}, A, B) : A; }
function boardFile(city, src) { const key = src + ':' + city, name = BOARDFILE[src]; if (FROZ[key] !== undefined) return FROZ[key]; FROZ[key] = null; if (BOARDHAS[src] && !BOARDHAS[src].includes(city)) return null; if (root && root.BD_PUBLIC && city === 'edm') return null;    
  try { if (root && typeof XMLHttpRequest !== 'undefined') { const x = new XMLHttpRequest(); x.open('GET', `data/${name}_${city}.json`, false); x.send(null); if (x.status === 200) FROZ[key] = JSON.parse(x.responseText).boards || null; }
    else if (typeof require !== 'undefined') { const fs = require('fs'), path = require('path'), f = path.join(__dirname, 'data', `${name}_${city}.json`); if (fs.existsSync(f)) FROZ[key] = JSON.parse(fs.readFileSync(f, 'utf8')).boards || null; } } catch (e) { FROZ[key] = null; }
  return FROZ[key]; }
function FKIND(x, st, nSt, D) { const id = x.id, b = id.replace(/\d+$/, ''), g = x.g, circBlock = st === 1 || nSt === 1 ? 'hub' : 'clinic';
  const other = d => d[1] === id ? d[2] : d[1];
  if (g === 'hall') return { kind: 'hall', block: 'data centre' };
  if (x.stair) return /^s\d/.test(id) || g === 'sup' ? { kind: 'score', block: 'data centre' } : { kind: 'pcore', block: circBlock };
  if (x.core && /^e\d/.test(id)) return g === 'sup' ? { kind: 'score', block: 'data centre', lift: true } : { kind: 'pcore', block: circBlock, lift: true };
  if (x.core) return { kind: 'shaft', block: g === 'sup' ? 'data centre' : circBlock };
  if (g === 'circ') return b === 'lob' ? { kind: 'lobby', block: 'hub' } : b === 'cor' ? { kind: 'pcor', block: 'hub', corridor: true } : /^pas/.test(b) ? { kind: 'exitpas', block: 'hub' } : { kind: 'proom', block: circBlock };
  if (g === 'clin') return b === 'ccor' ? { kind: 'ccor', block: 'clinic', corridor: true } : /^pas/.test(b) ? { kind: 'exitpas', block: 'clinic' } : { kind: 'croom', block: 'clinic' };
  if (g === 'pub' || g === 'grow') return { kind: 'proom', block: 'hub' };        
  if (g === 'load') return { kind: 'bay', block: 'data centre' };
  if (g === 'plant') return { kind: 'plant', block: b === 'pmec' ? 'hub' : 'data centre' };
  if (g === 'spare') return { kind: 'spare', block: 'spare', dcSide: D.some(d => d[0] === st && (d[1] === id || d[2] === id) && /cor$/.test(other(d)) && other(d) !== 'cor' && other(d) !== 'ccor') };
   
  return /cor$/.test(b) || b === 'link' ? { kind: 'scor', block: 'data centre', corridor: true } : b === 'dock' ? { kind: 'dock', block: 'data centre' } : b === 'ves' ? { kind: 'entry', block: 'data centre' } : /^pas/.test(b) ? { kind: 'exitpas', block: 'data centre' } : { kind: 'sroom', block: 'data centre' }; }
 
const TFAM = { van: { small: ['V1360', 'V1330'], rearplant: ['V1353', 'V1425'], wide: ['V8980'], twohall: ['V8238'], line: ['V339', 'V1425', 'V1353'] },
  edm: { small: ['E10004'], turned: ['E16075'], narrowdeep: ['E15231'], wide: ['E10003'], growyard: ['E4103', 'E06B', 'E14715'] } };
const polyArea = P => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
function lotFront(S) { const E = S.edges || []; const len = e => Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);
  return E.find(e => e.kind === 'front' && e.abuts === 'street') || E.filter(e => e.abuts === 'street').sort((x, y) => len(y) - len(x))[0] || null; }
function placePlan(S, B) {    
  const f0 = lotFront(S), len = e => Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);
  const LE = [f0].concat((S.edges || []).filter(e => e !== f0 && (e.abuts === 'street' || e.abuts === 'alley')).sort((x, y) => len(y) - len(x))).filter(Boolean);
  for (const fe of LE) for (const se of (B.STREET_EDGES || [])) { const r = placeOn(S, B, fe, se); if (r) return r; }
  return null; }
function placeOn(S, B, fe, se) {
  if (!fe || !se || !S.F) return null;
  const ring = S.ring, inside = q => inPoly(q, ring) || ring.some((p, i) => dSeg(q, p, ring[(i + 1) % ring.length]) <= 0.5);
  const rects = Object.values(B.S).flat().flatMap(x => x.r).concat((B.PLANT || []).map(p => p.r)).concat(B.COURT ? [B.COURT] : []);
  const pts = rects.flatMap(r => [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]]);
  const bc = [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts.reduce((t, p) => t + p[1], 0) / pts.length];
  const lc = [ring.reduce((t, p) => t + p[0], 0) / ring.length, ring.reduce((t, p) => t + p[1], 0) / ring.length];
  const fl = Math.hypot(fe.b[0] - fe.a[0], fe.b[1] - fe.a[1]); if (fl < 1) return null;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  for (const [A, Bv] of [[fe.a, fe.b], [fe.b, fe.a]]) for (const my of [1, -1]) {
    const dl = [(Bv[0] - A[0]) / fl, (Bv[1] - A[1]) / fl], db0 = [se[1][0] - se[0][0], (se[1][1] - se[0][1]) * my], dbl = Math.hypot(db0[0], db0[1]) || 1, db = [db0[0] / dbl, db0[1] / dbl];
    const th = Math.atan2(dl[1], dl[0]) - Math.atan2(db[1], db[0]), c = Math.cos(th), s = Math.sin(th);
    const map = (p, t) => { const x = p[0], y = p[1] * my; return [c * x - s * y + t[0], s * x + c * y + t[1]]; };
    const a0 = map(se[0], [0, 0]), nIn = cross(A, Bv, lc) > 0 ? [-dl[1], dl[0]] : [dl[1], -dl[0]];
     
    const bcm = map(bc, [A[0] - a0[0], A[1] - a0[1]]); if ((bcm[0] - A[0]) * nIn[0] + (bcm[1] - A[1]) * nIn[1] <= 0) continue;
    for (let k = 0; k <= 2 * Math.ceil(fl / 0.5); k++) { const sl = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.5; if (Math.abs(sl) > fl) continue;
      for (let d = 0; d <= 6 + 1e-9; d += 0.5) { const t = [A[0] - a0[0] + dl[0] * sl + nIn[0] * d, A[1] - a0[1] + dl[1] * sl + nIn[1] * d];
        if (pts.every(p => inside(map(p, t)))) {
           
          const phi = Math.atan2(S.F.uy, S.F.ux), tw = S.F.toW(t[0], t[1]);
          return { th: th + phi, mirror: my < 0, t: tw, rms: 0, slide: sl, setback: d }; } } } }
  return null; }
function transplant(S, keys) {
  const lib = frozenData(S.city) || {}, byKey = {}; Object.values(lib).forEach(b => { if (!byKey[b.key]) byKey[b.key] = b; });
  const fam = TFAM[S.city] || {}, key = keys.slice().reverse().find(k => fam[k]); if (!key) return null;
  const per = P => P.reduce((t, p, i) => t + Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]), 0);
  const area = polyArea(S.ring), pr = per(S.ring);    
  const sim = b => Math.abs(Math.log((area || 1) / (polyArea(b.LOTPOLY) || 1))) + Math.abs(Math.log((pr || 1) / (per(b.LOTPOLY) || 1)));
  const ownKey = (lib[String(S.id)] || {}).key, loo = root && root.BD && root.BD.hubLeaveOut;    
  const cands = fam[key].map(k => byKey[k]).filter(Boolean).filter(b => !(loo && b.key === ownKey)).sort((x, y) => sim(x) - sim(y));
  for (const B of cands) { const reg = placePlan(S, B) || (B.key === ownKey && B.reg ? B.reg : null); if (!reg) continue;    
    const P = frozenBoard(S, B, reg); if (!P) continue;
    const H = P.hub; H.transplant = { from: B.key, addr: B.addr, layout: key, slide: reg.slide, setback: reg.setback };
    if (H.doesntFit) return P;    
    const own = ((lib[String(S.id)] || {}).key === B.key);    
    if (!own && H.rooms) {    
      withV2(H, S); const fl = [];
      ((H.v2 && H.v2.rows) || []).filter(r => r[0] === 'fail' || r[0] === 'fix').forEach(r => fl.push(r[1]));
      (H.travel || []).filter(t => t.status === 'fail').forEach(t => fl.push(`travel to an exit (${t.zone}, ${t.worst} m of ${t.limit || 45} m)` + (t.perim ? `; dc-travel:no-stair-position: storey ${t.st} data-centre travel ${t.worst} m (45 m, sprinklered, 3.4.2.5.(1)(c)): no stair position brings it under; 3.4.2.5.(2) not met (${t.perim.why})` : '')));
      (H.apart || []).filter(t => t.status === 'fail').forEach(t => fl.push(`exits apart (${t.zone}, ${t.apart_m} m, ${t.need_m} m needed)`));
      if (H.grades && H.grades.heightStatus === 'fail') fl.push(`height (${H.grades.height} m of ${H.grades.hLimit} m)`);
      if (H.treach) { (H.treach.reach || []).forEach(r => fl.push(`T-reach (${r.room}: ${r.reason})`)); (H.treach.dead || []).filter(c => !c.ok && c.status === 'fail').forEach(c => fl.push(`dead end (storey ${c.storey}, ${c.deadEnd_m} m of 6 m)`)); ((H.treach.width || {}).rows || []).filter(r => r.sev === 'fail').forEach(r => fl.push(`room width (${r.name}, ${r.width_m} m of ${r.min_m} m)`)); }
      if (H.MW != null && H.MW < RULES.mwFloor.mw - 1e-9) fl.push(`${H.MW.toFixed(2)} MW, under the ${RULES.mwFloor.mw} MW floor (project decision, 13 Nov 2026)`);
      if (H.v2 && H.v2.error) fl.push('the checks could not run on the placed plan (?)');
      if (fl.length) { const lim = [`doesn’t fit as placed: ${fl.join('; ')} (the ${B.addr} test fit placed on this lot)`];
        const H0 = { doesntFit: { limiting: lim, placed: B.addr }, flags: ['Doesn’t fit here: ' + lim[0]], variant: H.variant, transplant: H.transplant, site: {} };
        return { version: RULES.version, rules: RULES, storeys: [], flags: H0.flags, exitSep: [], programs: [], entrances: [], hub: H0 }; } }
    const note = own ? null : `Borrowed from the ${B.addr} test fit, not checked here: its plan placed on this lot along the street, not re-planned`;    
    if (note) { if (H.flags) H.flags.unshift(note); if (P.flags && P.flags !== H.flags) P.flags.unshift(note); }
    H.estimate = own ? null : { keys, names: [`${(VNEED && VNEED.names && VNEED.names[key]) || VNAMES[key] || key}`], transplant: B.addr };
    return P; }
  return null; }
 
const GROWD = {};
function growData(city) { if (GROWD[city] !== undefined) return GROWD[city]; GROWD[city] = null; if (root && root.BD_PUBLIC && city === 'edm') return null;
  try { if (root && typeof XMLHttpRequest !== 'undefined') { const x = new XMLHttpRequest(); x.open('GET', `data/hub_grow_${city}.json`, false); x.send(null); if (x.status === 200) GROWD[city] = JSON.parse(x.responseText).fits || null; }
    else if (typeof require !== 'undefined') { const fs = require('fs'), path = require('path'), f = path.join(__dirname, 'data', `hub_grow_${city}.json`); if (fs.existsSync(f)) GROWD[city] = JSON.parse(fs.readFileSync(f, 'utf8')).fits || null; } } catch (e) { GROWD[city] = null; }
  return GROWD[city]; }
const GYm = (typeof module !== 'undefined' && module.exports) ? (() => { try { return require('./growyard.js'); } catch (e) { return null; } })() : null;
const GY = () => (root && root.BD && root.BD.growyard) || GYm;
 
function clipRect(P, r) { let out = P.slice();
  const edges = [[p => p[0] >= r[0], (a, b) => [r[0], a[1] + (b[1] - a[1]) * (r[0] - a[0]) / (b[0] - a[0])]], [p => p[0] <= r[1], (a, b) => [r[1], a[1] + (b[1] - a[1]) * (r[1] - a[0]) / (b[0] - a[0])]],
    [p => p[1] >= r[2], (a, b) => [a[0] + (b[0] - a[0]) * (r[2] - a[1]) / (b[1] - a[1]), r[2]]], [p => p[1] <= r[3], (a, b) => [a[0] + (b[0] - a[0]) * (r[3] - a[1]) / (b[1] - a[1]), r[3]]]];
  for (const [inn, cut] of edges) { const src = out; out = []; for (let i = 0; i < src.length; i++) { const a = src[i], b = src[(i + 1) % src.length];
    if (inn(b)) { if (!inn(a)) out.push(cut(a, b)); out.push(b); } else if (inn(a)) out.push(cut(a, b)); } if (!out.length) break; }
  return out.map(p => [r2(p[0]), r2(p[1])]); }
function regrow(S, B, REG, GF, own) {
  const Y = GY(); if (!Y) return { B, note: null };
  const c = Math.cos(REG.th), s = Math.sin(REG.th), my = REG.mirror ? -1 : 1, tx = REG.t[0], ty = REG.t[1];
  const wToB = (X, Yw) => { const dx = X - tx, dy = Yw - ty; return [r2(c * dx + s * dy), r2((-s * dx + c * dy) * my)]; };
  const F = JSON.parse(JSON.stringify(GF)); let opt = {};
  if (!own) {
    const ring = S.ring.map(p => { const w = S.F.toW(p[0], p[1]); return wToB(w[0], w[1]); });
    const inside = q => inPoly(q, ring) || ring.some((p, i) => dSeg(q, p, ring[(i + 1) % ring.length]) <= 0.5);
    const fits = d => { const G = Y.geomAt(F, d); return (G.S[1] || []).every(x => x.r.every(r => [[r[0], r[2]], [r[1], r[2]], [r[1], r[3]], [r[0], r[3]]].every(inside))); };
    if (!fits(0)) { LASTPU.push(`grow ${B.key} on ${S.id}: growth 0 not inside the lot`); return { B: null, note: 'the plan at growth 0 does not fit inside this lot' }; }
    let d = 0; while (d < 60 && fits(r2(d + 0.1))) d = r2(d + 0.1);
    F.DMAX = d; F.LIMIT = 'lot line (the placed plan)'; F.MW_FLOOR = null;
    opt.clip = ring;
  }
  const r = Y.run(F, opt); if (r.fail && r.steps && r.steps.length) r.fail = `no size from ${r.steps[0].MW.toFixed(2)} MW down to the plan as drawn fits (at ${r.steps[0].MW.toFixed(2)} MW: ${r.steps[0].plant})`; LASTPU.push(`grow ${B.key} on ${S.id}: ${r.fail || r.MW + ' ' + r.stop.rule} | ` + (r.steps || []).slice(0, 3).concat((r.steps || []).slice(-2)).map(x => `${x.MW} d ${x.d}: ${x.plant}`).join(' ; ')); if (r.fail) return { B: null, note: `grown on this lot: ${r.fail}` };
  const pl = r.plant, gz = pl && pl.gen, tz = pl && pl.tx, hs = pl && pl.hub, cnt = {};
  const PLANT = pl ? pl.items.slice().sort((a, b) => ['gen', 'pad', 'hub', 'chill'].indexOf(a.kind) - ['gen', 'pad', 'hub', 'chill'].indexOf(b.kind)).map(it => { cnt[it.kind] = (cnt[it.kind] || 0) + 1; const i = cnt[it.kind];
    const n = it.kind === 'gen' ? `Generator ${i}, ${gz.kw.toLocaleString('en-CA')} kW ${gz.model}, sub-base tank` : it.kind === 'pad' ? `Transformer pad ${i}, ${tz.kva.toLocaleString('en-CA')} kVA (${tz.pad_src})` : it.kind === 'hub' ? `Hub generator, ${hs.model} in its enclosure (72 h, own sub-base tank)` : `Chiller ${i} (at grade)`;
    return { id: ({ gen: 'g', pad: 't', hub: 'h', chill: 'c' })[it.kind] + i, n, r: it.r.slice() }; }) : r.G.PLANT;
  const B2 = Object.assign({}, B, { S: r.G.S, D: r.G.D, PLANT, PLANT_YARDS: r.G.PLANT_YARDS, MW: Math.round(r.MW * 100) / 100, dcArea: r.dc, hallDrawn: r.hall, stop: r.stop.rule, stopText: r.stop.text, grownHere: { d: r.d, steps: r.steps.length, own } });
  return { B: B2, note: own ? null : `Grown on this lot by the hub's step-back (layout (c)): hall wall moved ${r.d} m into the plant yard, ${B2.MW.toFixed(2)} MW, stopped by the ${r.stop.rule}` };
}
 
const freezeDate = f => /11i$/.test(f || '') ? '13 Nov 2026' : '12 Nov 2026';
function frozenBoard(S, B0, reg0) { applyPlanMode();    
  const B0_ = B0; let B = B0 || (S.city && S.id ? (frozenData(S.city) || {})[String(S.id)] : null), REG = reg0 || (B && B.reg); const LOT = !!(B && B.frame === 'lot');    
  if (LOT && !REG) REG = { th: 0, mirror: false, t: [0, 0], rms: 0 };
  if (!B || !REG || !S.F) return null;
  if (B.noPlan) { const lim = (B.limiting || []).slice(0, 6).map(publicText), H0 = { doesntFit: { limiting: lim, engine: true }, flags: ['Doesn’t fit here (the tool found no plan): ' + lim.join('; ')], variant: { main: 'stacked', flags: [], notBuilt: [] }, frozen: { key: B.key, addr: B.addr, freeze: B.freeze, laid: true }, site: {} };
    return { version: RULES.version, rules: RULES, storeys: [], flags: H0.flags, exitSep: [], programs: [], entrances: [], hub: H0 }; }
   
  const fails = LOT ? [] : (B.rows || []).filter(r => r[0] === 'fail' || r[0] === 'fix');    
  if (fails.length) { const lim = [`${B.stop} (the test fit for ${B.addr}, 12 Nov 2026)`].concat(fails.map(r => `${r[1]}: ${String(r[3] || '').replace(/^SCRIPT FAILS:\s*/, '').replace(/\s*\[script[^\]]*\]?.*$/, '')}`));
    const H0 = { doesntFit: { limiting: lim, frozen: true }, flags: ['Doesn’t fit here (the frozen board fails): ' + lim.join('; ')], variant: { main: Object.keys(B.S).length > 1 ? 'stacked' : 'beside', flags: [], notBuilt: [] }, frozen: { key: B.key, addr: B.addr, freeze: B.freeze, board: B.board, failing: true }, site: {} };
    return { version: RULES.version, rules: RULES, storeys: [], flags: H0.flags, exitSep: [], programs: [], entrances: [], hub: H0 }; }
  let growNote = null;
  if (B0_ && RULES.growYard) { const GF = (growData(S.city) || {})[B.key]; if (GF) { const own = ((frozenData(S.city) || {})[String(S.id)] || {}).key === B.key, g = regrow(S, B, REG, GF, own); if (!g.B) { if (own) return null; const lim = [`doesn’t fit as placed: ${g.note} (the ${B.addr} test fit placed on this lot)`];    
      const H0 = { doesntFit: { limiting: lim, placed: B.addr }, flags: ['Doesn’t fit here: ' + lim[0]], variant: { main: 'beside', flags: [], notBuilt: [] }, site: {} };
      return { version: RULES.version, rules: RULES, storeys: [], flags: H0.flags, exitSep: [], programs: [], entrances: [], hub: H0 }; }
    B = g.B; growNote = g.note; } }
  try {
    const F = S.F, c = Math.cos(REG.th), s = Math.sin(REG.th), my = REG.mirror ? -1 : 1, tx = REG.t[0], ty = REG.t[1];
    const all = Object.values(B.S).flat().flatMap(x => x.r), u0 = Math.min(...all.map(r => r[0])), v0 = Math.min(...all.map(r => r[2])), u1 = Math.max(...all.map(r => r[1])), v1 = Math.max(...all.map(r => r[3]));
     
    const toW = (a, b) => { const u = a + u0, v = (b + v0) * my; return [tx + c * u - s * v, ty + s * u + c * v]; };
    const fromW = (X, Y) => { const dx = X - tx, dy = Y - ty, u = c * dx + s * dy, v = (-s * dx + c * dy) * my; return [u - u0, v - v0]; };
    const mv = r => [r2(r[0] - u0), r2(r[1] - u0), r2(r[2] - v0), r2(r[3] - v0)];
    const nSt = Object.keys(B.S).length, D = (B.D || []).map(d => [Math.round(d[0]), d[1], d[2], r2(d[3] - u0), r2(d[4] - v0), d[5], d[6] || 0.9]);
    const rooms = {}; for (const k of Object.keys(B.S)) { const st = +k; rooms[st] = B.S[k].map(x => Object.assign({ st, id: x.id, n: publicText(x.n), g: x.g, r: x.r.map(mv), core: !!x.core, stair: !!x.stair }, x.kind ? { kind: x.kind, block: x.block || null, lift: x.lift || undefined, corridor: /cor$/.test(x.kind) || undefined } : FKIND(x, st, nSt, B.D || []))); }
    const ra = r => (r[1] - r[0]) * (r[3] - r[2]), sumG = f => r2(Object.values(rooms).flat().filter(f).reduce((t, x) => t + x.r.reduce((q, r) => q + ra(r), 0), 0));
    const kindOf = it => /^g/.test(it.id) ? 'gen' : /^t/.test(it.id) ? 'pad' : /^c/.test(it.id) ? 'chiller' : /^h/.test(it.id) ? 'hubset' : 'plant';
    const items = (B.PLANT || []).map(p => ({ id: p.id, n: p.n, kind: p.kind || kindOf(p), r: mv(p.r), z: mv(p.r), roof: p.roof != null ? !!p.roof : /roof/i.test(p.n), keep: true }));
    const g1 = items.find(it => it.kind === 'gen'), km = g1 && /([\d,]+)\s*kW/.exec(g1.n), setKW = km ? +km[1].replace(/,/g, '') : null;
    const clinic = Object.values(rooms).flat().some(x => x.kind === 'croom');
    const L = { site: { a0: 0, aMax: r2(u1 - u0), aFull: r2(u1 - u0), driveSide: '?', driveWhy: 'as the frozen board draws it' }, flags: [], notes: [],
      frozen: { key: B.key, addr: B.addr, freeze: B.freeze, board: B.board, sha16: B.boardSha16, rms: REG.rms },
      rooms, D, H: B.H.slice(), MW: B.MW, mwUsed: B.MW, dcArea: B.dcArea, hall: B.hallDrawn, hubArea: sumG(x => x.block === 'hub' && (x.g === 'pub' || x.g === 'grow')), clin: sumG(x => x.block === 'clinic' && x.g === 'clin'),
      nb: Object.values(rooms).flat().filter(x => x.kind === 'bay' && /^b\d/.test(x.id)).length, nDC: null, nRef: null, nCl: null,
      kind: nSt > 1 ? 'stacked' : 'beside', W: r2(v1 - v0), Da: r2(u1 - u0), aB: 1e9, bOrigin: 0, ground: B.H[0],
      storeyNames: nSt > 1 ? ['Storey 1: hub at grade, data-centre entrance', 'Storey 2: ' + ((rooms[2] || []).some(x => x.kind === 'croom') ? 'clinic and data-centre support' : 'data-centre support'), 'Storey 3: one data-hall storey'] : ['Storey 1: hub, ' + (clinic ? 'clinic ' : '') + 'and data centre at grade'],
      plant: { ok: true, items, nG: items.filter(it => it.kind === 'gen').length, nT: items.filter(it => it.kind === 'pad').length, nC: items.filter(it => it.kind === 'chiller').length, setKW, Q: r2(B.MW * 1.55), tank: null, hubSet: items.some(it => it.kind === 'hubset'), why: '', whyAll: '', rules: (B.rows || []).filter(r => /generator|chiller|transformer|plant|fuel|service access|sets/i.test(r[1])).map(r => `${r[1]} (${r[0]}): ${r[3] || ''}`) },
      truck: B.COURT ? { court: mv(B.COURT), why: 'truck court as the frozen board draws it' } : null,
      ladder: { step: '–', what: 'Checked test fit, ' + freezeDate(B.freeze) + ' (' + B.addr + ')', limiting: [] },
      variant: { main: nSt > 1 ? 'stacked' : 'beside', sideDrive: !!B.DRIVE, notBuilt: [], flags: [], lotType: '?' },
      sizeStop: { rule: B.stop, at: B.MW, why: B.stopText || B.stop } };
    L.toUV = (a, b) => { const w = toW(a, b); return F.toL(w[0], w[1]).map(r2); };
    L.fromUV = (u, v) => { const w = F.toW(u, v); return fromW(w[0], w[1]).map(r2); };
    L.frozenOff = [u0, v0];    
    if (LOT) { L.toUV = (a, b) => [r2(a + u0), r2(b + v0)]; L.fromUV = (u, v) => [r2(u - u0), r2(v - v0)]; }
     
    if (RULES.boardRedraw && !LOT) { const mw0 = L.MW; fillVoids(L, S, true); clipUpper(L); if (L.clipped) { L.hall = sumG(x => x.g === 'hall'); L.plant.Q = r2(L.MW * 1.55); L.sizeStop.at = L.MW; }     if (L.voidFill || L.clipped) L.flags.push(`Checked test fit redrawn under the 19 Nov rules (voids filled as unassigned floor, upper storeys clipped to the storey below): ${mw0.toFixed(2)} → ${(+L.MW).toFixed(2)} MW; the board's rows are the freeze's (?)`); }
    if (RULES.compactFill && RULES.boardRedraw && !LOT) compactFill(L, S, true);    
    analyse(L, S);
    if (RULES.fillTopUp && RULES.boardRedraw && !LOT) fillVoids(L, S, true, true);    
    L.loading = { n: L.nb, why: `${L.nb} loading spaces, as the frozen board draws them`, size: '', aisle: '' };
     
    { const hr = (B.rows || []).find(r => r[1] === 'Height'), t = hr ? hr[3] : '', m = /roof\s*([\d.]+)\s*−\s*base surface\s*([\d.]+)\s*=\s*([\d.]+)\s*m/.exec(t), m1 = !m && /([\d.]+)\s*m\s*≤/.exec(t), lim = /≤\s*([\d.]+)/.exec(t);
      if (L.grades) { if (B.SLAB != null) L.grades.slab = B.SLAB; if (m) Object.assign(L.grades, { roof: +m[1], base: +m[2], height: +m[3] }); else if (m1) Object.assign(L.grades, { height: +m1[1], roof: null, base: null });
        if (lim && L.grades.hLimit == null) L.grades.hLimit = +lim[1]; if (hr) L.grades.heightStatus = hr[0]; L.grades.boardHeight = t; } }
    if (LOT) { withV2(L, S); if (!L.v2 || !L.v2.rows) L.v2 = { rows: publicRows(B.rows || []), source: 'Tool layout (' + B.addr + ')' }; else L.v2.source = 'Tool layout, rows computed from this plan (' + B.addr + ')'; }    
    else L.v2 = { rows: publicRows((B.rows || []).map(r => [frozenRowStatus(r), r[1], r[2] || '', r[3] || ''])), source: 'Checked test fit, ' + freezeDate(B.freeze) + ' (' + B.addr + ')' };
    if (!B0_ && LOT) L.flags.push(`Laid out by the tool (${B.addr}): ${(+B.MW).toFixed(2)} MW, ${Math.round(B.dcArea).toLocaleString('en-CA')} m² of data centre, stopped by ${B.stop}; the tool's own run, not a hand-checked test fit`);
    else if (!B0_) L.flags.push(`Checked test fit, ${freezeDate(B.freeze)} (${B.addr}): ${B.MW.toFixed(2)} MW, ${Math.round(B.dcArea).toLocaleString('en-CA')} m² of data centre, stopped by ${B.stop}; drawn as fitted, not re-laid out by the tool`);
    if (growNote) L.flags.push(growNote);
    if (REG.rms > 1) L.flags.push(`The board draws this lot as a simplified outline (no exact lot outline on the board); placed on the tool’s lot by best fit, about ${Math.round(REG.rms)} m off on average (?)`);
    return toPlan(L, S);
  } catch (e) { if (typeof console !== 'undefined') console.warn('frozen board', e); return null; } }
function withV2(L, S) {  
  if (RULES.deadline && Date.now() > RULES.deadline) { L.v2 = { skipped: true, why: 'The detailed checks of this layout take too long to run in the browser; they are not shown here.' }; return L; }
  try { L.v2 = v2Checks(L, S); if (L.v2 && L.v2.rows) L.v2.rows = publicRows(L.v2.rows); } catch (e) { L.v2 = { error: String(e && e.message || e) }; } return L; }    
 
 
function hardFails(X) { return (X.apart || []).filter(a => a.status === 'fail').concat((X.travel || []).filter(t => t.status === 'fail').map(t => ({ zone: t.zone, apart_m: t.worst, need_m: t.limit || 45, travel: true })),
  ((X.treach || {}).egress || []).filter(e => e.status === 'fail').map(e => ({ zone: e.name || e.room, apart_m: e.apart_m, need_m: e.need_m, egress: true })),
  (X.far && X.far.status === 'fail' ? [{ zone: `FAR ${X.far.zone}`, apart_m: X.far.far, need_m: X.far.permitted, far: true }] : []),
  (RULES.stairsHard ? X.stairs || [] : []).filter(r => r.status === 'fail').map(r => ({ zone: `${r.stair === '-' ? '' : 'stair ' + String(r.stair).toUpperCase() + ': '}${r.row}`, apart_m: r.why, need_m: null, stairRow: true })),
  (RULES.dischargeHard ? X.discharge || [] : []).filter(d => d.status === 'fail').map(d => ({ zone: `stairs ${String(d.a).toUpperCase()} and ${String(d.b).toUpperCase()}`, apart_m: d.d, need_m: d.need, discharge: true }))); }    
 
const mOr = v => v == null || v === '' || !isFinite(+v) ? 'not measured' : `${v} m`;
const hardWhy = f => f.stairRow ? `${f.zone} (${f.apart_m}; ${/\[check /.test(f.zone) ? 'l item 3' : /inside the yards/.test(f.zone) ? 'j (yards)' : /gate|Loading|Truck/.test(f.zone) ? "e" : "d"})` : f.far ? `${f.zone} ${f.apart_m} over the ${f.need_m} permitted` : f.discharge ? `${f.zone} discharge ${mOr(f.apart_m)} apart, ${mOr(f.need_m)} needed (11k addition 6)` : f.travel ? `${f.zone} travel ${mOr(f.apart_m)} to an exit, ${f.need_m || 45} m allowed${f.need_m === 40 ? ' (business and personal services, NBC(AE) 3.4.2.5.(1)(b))' : ''}` : f.egress ? `${f.zone}: its two egress doors are ${mOr(f.apart_m)} apart, ${mOr(f.need_m)} needed (VBBL 3.3.1.5)` : `the ${f.zone} exits are ${mOr(f.apart_m)} apart, ${mOr(f.need_m)} needed`;
const hardRule = f => f.travel ? 'travel distance' : f.egress ? 'egress door spacing' : 'exit spacing';
function grown(S) {
  const lay = S1 => layout(Object.assign({}, S1, { noV2: true })), fails = hardFails;
  const L0 = lay(S); if (!L0.rooms || !fails(L0).length) return { L: L0, S };
  const late = () => RULES.deadline && Date.now() > RULES.deadline;
  if (late()) { L0.timedOut = true; return { L: L0, S }; }
  let L = L0, S1 = S;
   
  const feStuck = (L0.flags || []).some(x => /\[fire-entrance:(?:no-front-yard|blocked|not-enough)\]/.test(String(x)));    
  const sizeFree = f => { const z = String(f.zone || ''); return (RULES.sizeFree || []).some(id => z.includes('[check ' + id + ']')) || (RULES.sizeFreeRows || []).some(t => z.includes(t)) || (feStuck && z.includes('[check B4]')); };
  const skipShrink = RULES.sizeFree && fails(L0).every(sizeFree);
  if (skipShrink) (L0.flags || (L0.flags = [])).push(`Size loop skipped ( item 4): every hard fail at ${L0.MW.toFixed(2)} MW is on the size-free list (${fails(L0).map(hardWhy).join('; ').slice(0, 300)})`);
  for (let g = 0; g < 20 && !skipShrink; g++) { if (late()) { L0.timedOut = true; break; } const m = r2(L.MW - 0.05); if (m < 0.3) break; const S2 = Object.assign({}, S, { mwStart: m }), L2 = lay(S2);
    if (!L2.rooms || L2.MW >= L.MW - 1e-3) break; L = L2; S1 = S2;
    if (!fails(L).length) { const f = fails(L0)[0];
      const why_ = hardWhy(f);
      L.sizeStop = { rule: hardRule(f), at: L.MW, capMW: L0.MW, capM2: Math.round(L0.dcArea), why: why_ };
      L.flags.push(`${capTxt()}: ${hardRule(f)} stops it at ${L.MW.toFixed(2)} MW (at the cap, ${L0.MW.toFixed(2)} MW and ${Math.round(L0.dcArea)} m², ${why_}; project decision, 12 Nov 2026, grown in 0.05 MW steps)`);
      return { L, S: S1 }; } }
   
  if (L0.timedOut || late()) { L0.timedOut = true; return { L: L0, S }; }
  if (L0.hostUsed && S.typDef) { const S3 = Object.assign({}, S, { hostSkip: (S.hostSkip || []).concat([L0.hostUsed]) }), G2 = grown(S3);
    if (G2.L.rooms && !fails(G2.L).length) { G2.L.flags.push(`Host ${L0.hostUsed} gave ${L0.MW.toFixed(2)} MW but fails a hard rule at every size tried (${fails(L0).map(hardWhy).join('; ')}); the next host is kept`); return G2; } }
   
  const k0 = L0.ladder && L0.ladder.step; if (k0 && !late()) { const S4 = Object.assign({}, S, { minStep: k0 + 1, hostSkip: S.hostSkip }), G4 = grown(S4);
    if (G4.L.timedOut) L0.timedOut = true;
    if (G4.L.rooms && !fails(G4.L).length) { G4.L.flags.push(`Ladder step ${k0} fails a hard rule at every size tried (${fails(L0).map(hardWhy).join('; ')}); the next step that passes is kept (15g item 3)`); return G4; } }
  return { L: L0, S }; }    
 
let VNEED = null;
const VNAMES = { line: 'upper storeys within the building line (the engine’s storeys 2–3 still reach over the truck court)' };
function variantNeed(S, L) { if (VNEED === null) { VNEED = {}; try { if (root && typeof XMLHttpRequest !== 'undefined') { const x = new XMLHttpRequest(); x.open('GET', 'data/variant_need.json', false); x.send(null); if (x.status === 200) VNEED = JSON.parse(x.responseText); }
    else if (typeof require !== 'undefined') { const fs = require('fs'), path = require('path'), f = path.join(__dirname, 'data', 'variant_need.json'); if (fs.existsSync(f)) VNEED = JSON.parse(fs.readFileSync(f, 'utf8')); } } catch (e) { VNEED = {}; } }
  const N = Object.assign({}, VNEED.names || {}, VNAMES), city = S.city; let keys = ((VNEED[city] || {})[String(S.id)] || null);
  if (!keys) { const t = S.lotType && S.lotType.type; keys = city === 'edm' ? ['growyard'].concat(t === 'small' ? ['small'] : t === 'wide_shallow' ? ['turned'] : t === 'narrow_deep' ? ['narrowdeep'] : t === 'irregular' ? ['wide'] : [])
    : t === 'small' ? ['small'] : t === 'wide_shallow' ? ['rearplant'] : t === 'irregular' ? ['wide'] : []; }
  keys = keys.slice(); if (L && L.kind === 'stacked' && L.truck && L.truck.covered && !keys.length) keys.push('line');
  return keys.length ? { keys, names: keys.map(k => N[k] || k) } : null; }
 
const ROADN = t => { const W = String(t || '').toUpperCase().replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean).filter(w => !/^(EASTBOUND|WESTBOUND|NORTHBOUND|SOUTHBOUND|EB|WB|NB|SB)$/.test(w)).map(w => ({ DRIVE: 'DR', AVENUE: 'AV', AVE: 'AV', STREET: 'ST', ROAD: 'RD', PLACE: 'PL', CRESCENT: 'CR', CRES: 'CR', BOULEVARD: 'BLVD', HIGHWAY: 'HWY' })[w] || w), DIRW = /^(E|W|N|S|NE|NW|SE|SW|EAST|WEST|NORTH|SOUTH)$/, D1 = { EAST: 'E', WEST: 'W', NORTH: 'N', SOUTH: 'S' };
  const dirs = W.filter((w, k) => DIRW.test(w) && (k === 0 || k === W.length - 1)).map(w => D1[w] || w), rest = W.filter((w, k) => !(DIRW.test(w) && (k === 0 || k === W.length - 1)));
  return rest.concat(dirs.sort()).join(' '); };    
function turnToAddress(S) {
  if (!S.addr || !S.edges || !S.ring || !S.ring.length) return null;
  const addrSt = ROADN(String(S.addr).replace(/^\s*[\d\-A-Z]*\d[\dA-Z\-]*\s+/, '')), streets = S.edges.filter(e => e.abuts === 'street');
  let onAddr = streets.filter(e => e.road && ROADN(e.road) === addrSt), fromFit = null;
   
  if (!onAddr.length && S.city === 'edm' && S.typDef && S.F) { const B = (frozenData('edm') || {})[String(S.id)], REG = B && B.reg;
    if (B && REG && (B.STREET_EDGES || []).length) { const fe = B.STREET_EDGES.slice().sort((x, y) => (x[0][0] + x[1][0]) - (y[0][0] + y[1][0]))[0];
      const all = Object.values(B.S).flat().flatMap(x => x.r), c = Math.cos(REG.th), sn = Math.sin(REG.th), my = REG.mirror ? -1 : 1;
      const toL = (u, v) => { const v2 = v * my, w = [REG.t[0] + c * u - sn * v2, REG.t[1] + sn * u + c * v2]; return S.F.toL(w[0], w[1]); };
      const m = toL((fe[0][0] + fe[1][0]) / 2, (fe[0][1] + fe[1][1]) / 2), dd = e => dSeg(m, e.a, e.b);
      const best = streets.slice().sort((x, y) => dd(x) - dd(y))[0]; if (best) { onAddr = [best]; fromFit = B.key; } } }
  if (!onAddr.length) return null;
  const front = streets.filter(e => e.kind === 'front' || e.kind === 'unclear').sort((x, y) => Math.abs((x.a[0] + x.b[0]) / 2 - S.uf) - Math.abs((y.a[0] + y.b[0]) / 2 - S.uf))[0];
  if (!fromFit && front && front.road && ROADN(front.road) === addrSt) return null;    
  if (fromFit && front && onAddr[0] === front) return null;    
  const ad = onAddr.sort((x, y) => Math.hypot(y.b[0] - y.a[0], y.b[1] - y.a[1]) - Math.hypot(x.b[0] - x.a[0], x.b[1] - x.a[1]))[0];    
  const cu = S.ring.reduce((t, p) => t + p[0], 0) / S.ring.length, cv = S.ring.reduce((t, p) => t + p[1], 0) / S.ring.length;
  let nu = -(ad.b[1] - ad.a[1]), nv = ad.b[0] - ad.a[0]; const mu = (ad.a[0] + ad.b[0]) / 2 - cu, mv = (ad.a[1] + ad.b[1]) / 2 - cv; if (nu * mu + nv * mv < 0) { nu = -nu; nv = -nv; }    
  if (S.dir < 0) nu = -nu;    
   
  const T = Math.abs(nu) >= Math.abs(nv) ? (nu > 0 ? (p => [p[0], p[1]]) : (p => [-p[0], -p[1]])) : (nv > 0 ? (p => [p[1], -p[0]]) : (p => [-p[1], p[0]]));
  const Ti = Math.abs(nu) >= Math.abs(nv) ? (nu > 0 ? (q => [q[0], q[1]]) : (q => [-q[0], -q[1]])) : (nv > 0 ? (q => [-q[1], q[0]]) : (q => [q[1], -q[0]]));
  const turn = Math.abs(nu) >= Math.abs(nv) ? (nu > 0 ? 0 : 180) : 90;
  const S1 = S.dir < 0 ? (p => [-p[0], p[1]]) : (p => p);    
  const TT = p => T(S1(p)), TTi = q => S1(Ti(q));
  const rect = r => { const p = TT([r[0], r[2]]), q = TT([r[1], r[3]]); return [Math.min(p[0], q[0]), Math.max(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[1], q[1])].map(r2); };
  const ring = S.ring.map(p => TT(p).map(r2)), uf = r2(Math.max(TT(ad.a)[0], TT(ad.b)[0]));    
  const nOf = e => { const a = TT(e.a), b = TT(e.b); let x = -(b[1] - a[1]), y = b[0] - a[0]; const L = Math.hypot(x, y) || 1; x /= L; y /= L; const mu2 = (a[0] + b[0]) / 2, c2 = ring.reduce((t, p) => t + p[0], 0) / ring.length, mv2 = (a[1] + b[1]) / 2, d2 = ring.reduce((t, p) => t + p[1], 0) / ring.length; if (x * (mu2 - c2) + y * (mv2 - d2) < 0) { x = -x; y = -y; } return [x, y]; };
  const edges = S.edges.map(e => { const [x] = nOf(e), kind = e === ad || (e.abuts === 'street' && e.road && ROADN(e.road) === addrSt && x > 0.7) ? 'front' : x > 0.7 ? (e.abuts === 'street' ? 'unclear' : e.kind) : x < -0.7 ? 'rear' : (e.abuts === 'street' ? 'flank' : 'side');
    return Object.assign({}, e, { a: TT(e.a).map(r2), b: TT(e.b).map(r2), kind, kind0: e.kind }); });
  const S2 = Object.assign({}, S, { ring, edges, dir: 1, uf, turned: { from: front && front.road || '?', to: fromFit ? `${ad.road || 'the street'} (as the ${fromFit} test fit; no lot line faces ${addrSt})` : addrSt, deg: S.dir < 0 ? (turn + 180) % 360 : turn, T: TT, Ti: TTi } });
  if (S.sideDrive && S.sideDrive.r) S2.sideDrive = Object.assign({}, S.sideDrive, { r: rect(S.sideDrive.r) });
  if (S.grade) S2.grade = { corners: (S.grade.corners || []).map(c => TT(c).concat([c[2]])), edges: (S.grade.edges || []).map(g => ({ a: TT(g.a), b: TT(g.b), z: g.z })) };
  return S2; }
 
const ZONE_RULES = { stairsHard: false, compactFill: true, patchHard: ['A5', 'A6', 'A11', 'B4', 'E1', 'E2', 'E3', 'CHEM-DC'] }, ZONE_OFF = { vestibule: true };
let ROOM_RULES = null;
function applyPlanMode() { if (!ROOM_RULES) ROOM_RULES = { stairsHard: RULES.stairsHard, compactFill: RULES.compactFill, patchHard: (RULES.patchHard || []).slice(), vestibuleOn: !!(RULES.vestibule && RULES.vestibule.on) };
  if (RULES.planMode === 'zones') { Object.assign(RULES, { stairsHard: ZONE_RULES.stairsHard, compactFill: ZONE_RULES.compactFill, patchHard: ZONE_RULES.patchHard.slice() }); if (RULES.vestibule) RULES.vestibule.on = !ZONE_OFF.vestibule; }
  else { Object.assign(RULES, { stairsHard: ROOM_RULES.stairsHard, compactFill: RULES.compactAlways ? true : ROOM_RULES.compactFill, patchHard: ROOM_RULES.patchHard.slice() });     if (RULES.vestibule) RULES.vestibule.on = ROOM_RULES.vestibuleOn; } }
function fromSite(S00) { applyPlanMode(); const r = fromSite1(S00);
  if (RULES.deadline && Date.now() > RULES.deadline) {    
    if (RULES.hallStoreys > 1 && r && r.hub && !r.hub.rooms) { const fl = 'Timeout: the time limit passed before the one-hall-storey layout was tried; no plan is not a finding here ()'; r.hub.doesntFit = Object.assign({}, r.hub.doesntFit, { timeout: true }); (r.hub.flags || (r.hub.flags = [])).push(fl); if (r.flags && r.flags !== r.hub.flags) r.flags.push(fl); }
    return r; }
  if (RULES.hallStoreys > 1 && !(r && r.hub && r.hub.rooms)) { const n = RULES.hallStoreys, why = ((r && r.flags) || []).slice(-1)[0] || ''; RULES.hallStoreys = 1;
    try { const r1 = fromSite1(S00); const fl = `Second hall storey ( item 2): doesn't fit here at any size (${String(why).slice(0, 200)}); one hall storey kept`; if (r1.hub && r1.hub.flags) r1.hub.flags.push(fl); if (r1.flags) r1.flags.push(fl); if (r1.hub) r1.hub.twoStorey = { MW: null, kept: false, why: String(why).slice(0, 300) }; return r1; } finally { RULES.hallStoreys = n; } }
   
  if (RULES.hallStoreys > 1 && r && r.hub && r.hub.rooms) { const n = RULES.hallStoreys;     RULES.hallStoreys = 1;    
    try { const r1 = fromSite1(S00), m2 = r.hub.MW || 0, m1 = (r1 && r1.hub && r1.hub.rooms && r1.hub.MW) || 0;
      if (m1 > m2 + 1e-6) { const fl = `Second hall storey ( item 2): fits, but at ${m2.toFixed(2)} MW against ${m1.toFixed(2)} MW with one hall storey; one hall storey kept`; if (r1.hub.flags) r1.hub.flags.push(fl); if (r1.flags) r1.flags.push(fl); r1.hub.twoStorey = { MW: m2, kept: false }; return r1; }
      } finally { RULES.hallStoreys = n; } }
  return r; }
function fromSite1(S00) {
  const S0 = (RULES.turnFront ? turnToAddress(S00) : null) || S00;
  const G = grown(S0), S = G.S; let L = G.L;
  if (S.frontYard && L.rooms) { const L1 = L; L = pushBack(S, L); if (L !== L1 && L1.sizeStop && !L.sizeStop) { L.sizeStop = L1.sizeStop; const ff = L1.flags.find(f => /^Data centre (smaller than the 2,325 m² floor cap|size \((?:one|two) hall storey)/.test(f)); if (ff) L.flags.push(ff); }
    if (L !== L1 && hardFails(L).length && !hardFails(L1).length) L = L1; }    
  if (L.rooms && hardFails(L).length && !(root && root.BD && root.BD.keepHard)) { const hf = hardFails(L).map(hardWhy);        
    L = L.timedOut ? { flags: L.flags.concat([`Timeout: no passing plan within the time limit; failing at the sizes tried: ${hf.join('; ')} ()`]), doesntFit: { limiting: hf, timeout: true }, variant: L.variant, ladder: L.ladder }
      : { flags: L.flags.concat([`Doesn’t fit here: the plan fails a hard rule at every size tried (${hf.join('; ')}; project chat, 14 Nov 2026)`]), doesntFit: { limiting: hf }, variant: L.variant, ladder: L.ladder }; }
  if (L.rooms && !L.v2) withV2(L, S);
  if (L.rooms && !S.typDef) { L.estimate = variantNeed(S, L); if (L.estimate) L.flags.push('First pass, not checked: the engine doesn’t have this lot’s layout yet (' + L.estimate.names.join('; ') + ').'); }
  if (S0.turned && L.flags) L.flags.unshift(`Front: turned to ${S0.turned.to}, the street on the address (project decision, 10 Nov); the site model's front faced ${S0.turned.from}`);
  if (!L.rooms) return { version: RULES.version, rules: RULES, storeys: [], flags: L.flags, exitSep: [], programs: [], entrances: [], hub: L };
  if (S.hubTyp) hubFamily(L, S);    
  if (S0.turned) { const tu = L.toUV, fu = L.fromUV, Ti = S0.turned.Ti, T = S0.turned.T; L.toUV = (a, b) => Ti(tu(a, b)).map(r2); L.fromUV = (u, v) => { const q = T([u, v]); return fu(q[0], q[1]); }; L.turned = { from: S0.turned.from, to: S0.turned.to, deg: S0.turned.deg }; }
  return toPlan(L, S);
}
 
function pushBack(S, L) {
  const ends = [L.Da || 0];
  Object.values(L.rooms).forEach(rs => rs.forEach(x => x.r.forEach(r => ends.push(r[1]))));
  if (L.truck && L.truck.court) ends.push(L.truck.court[1]);
  if (L.plant) L.plant.items.filter(it => !it.pseudo).forEach(it => { ends.push(it.r[1]); if (it.z && !it.roof) ends.push(it.z[1]); });
  const used = Math.max(...ends), room = Math.floor((L.site.aFull - used) * 2) / 2;
  if (room < 0.5) { L.frontYard = { depth: 0, why: 'the hub already reaches the rear yard line' }; return L; }
   
  const nF = X => ((X.treach && X.treach.reach) || []).length + (X.travel || []).filter(t => t.status === 'fail').length + (X.apart || []).filter(a => a.status === 'fail').length;    
  const ok = X => X.rooms && X.kind === L.kind && !!X.narrow === !!L.narrow && (X.ladder && X.ladder.step) === (L.ladder && L.ladder.step) && JSON.stringify(X.variant && X.variant.flags) === JSON.stringify(L.variant && L.variant.flags) && nF(X) <= nF(L) && Math.abs(X.MW - L.MW) <= 0.01 && (!X.plant || X.plant.ok);    
  const tryS = sh => layout(Object.assign({}, S, { frontShift: sh, noV2: true, mwExact: L.mwUsed || undefined }));    
  let best = null; { const Lh = tryS(room); if (ok(Lh)) best = [room, Lh]; }
  if (!best) { let lo = 0, hi = room;    
    while (hi - lo > 0.5 + 1e-9) { let mid = Math.round(lo + hi) / 2; if (mid <= lo) mid = r2(lo + 0.5); if (mid >= hi) mid = r2(hi - 0.5); const Lm = tryS(mid); if (ok(Lm)) { lo = mid; best = [mid, Lm]; } else hi = mid; } }
  for (const [sh, L2] of best ? [best] : []) {
    {     const d = r2(sh), pub = d >= 6, worst = Math.max(0, ...(L2.travel || []).filter(t => /hub/.test(t.zone)).map(t => t.worst || 0));
      L2.frontYard = { depth: d, m2: Math.round(d * (L2.W || 0)), public: pub, hubToStreet: worst ? r2(worst + d) : null, used: r2(used), aFull: L.site.aFull };
      L2.flags.push(pub ? `Front public yard (F8, the project’s gate 10 Nov 2026): the hub moved ${d} m back against the plant yard; about ${L2.frontYard.m2} m² in front of the hub, ${d} m deep. The lobby, refuge and stair S1 street doors open onto the yard; from the hub’s exits to the street is ${d} m further across it` + (worst ? ` (worst hub travel ${worst} m to an exit, about ${r2(worst + d)} m to the street)` : '') + `; step-free across the yard and its grades not checked (?); maximum front setback not read (?); noise at the yard not checked (?); covered beds and heated paths fed by data-centre heat (project decision gate 10 Nov; figures ? until the heat cascade research)`
        : `Front yard ${d} m deep (under 6 m: a deeper front yard, not a public yard; F8)`);
      if (S.sideDrive) L2.flags.push('Front public yard: the side drive runs beside it: fence or kerb between them (spec note rule 4; not drawn ?)');
      return L2; } }
  L.frontYard = { depth: 0, why: `moving the hub back by even 0.5 m (of ${room} m) changes the hub (its fit, layout, MW or a check); left at the front` };
  L.flags.push(`F8 flag: the hub stays at the front: ${L.frontYard.why}`); return L; }
 
const HUBMAP = { shelter_laundry: {
  rename: { ref: 'Day shelter rest area (16 guests)', shel: 'Day shelter rest area, second room', ref2: 'Day shelter rest area, third room', fa: 'Laundry: 1 washer + 1 heat-pump dryer, folding counter',
    cot: 'Lockers, linen and detergent storage', cot2: 'Linen and detergent storage', off: 'Staff office',
    ex1: 'Counselling room 1', ex2: 'Counselling room 2', ex3: 'Case-worker office 1', ex4: 'Case-worker office 2', ex5: 'Case-worker office 3', cons: 'Interview / family room',
    wait: 'Services reception and waiting', coff: 'Staff office 2', cstf: 'Staff lounge', cst: 'Linen and storage', cwc: 'Services WCs', cwc1: 'Services WC 1', cwc2: 'Services WC 2', cwc3: 'Services WC 3', cuw: 'Universal WC (services)', ccor: 'Services corridor' },
  services: { ex1: 'counselling', ex2: 'counselling', ex3: 'case_worker_office', ex4: 'case_worker_office', ex5: 'case_worker_office', cons: 'interview_room', coff: 'staff_office_2', cstf: 'staff_office_2', cwc: 'services_wcs', cwc1: 'services_wcs', cwc2: 'services_wcs', cwc3: 'services_wcs', cuw: 'services_wcs', wait: 'services_reception', ccor: 'services_reception' },
  unbuilt: ['proc', 'med', 'cln', 'soil', 'hk'], dropPlant: ['h1'],
  src: 'shelter_laundry/fits d_v339/map.json, d_e4103/map.json, sl_v1360.json (the project, 14 Nov); typ_shelter_laundry.json servicesRooms, emptySlots, capDrop' } };
function hubFamily(L, S) { const def = S.hubTyp, M = def && HUBMAP[def.id]; if (!M || !L.rooms || L._hubFam) return; L._hubFam = true; const van = S.city === 'van', fl = L.flags || (L.flags = []);
  const gone = new Set(), slots = []; for (const st of Object.keys(L.rooms)) L.rooms[st] = L.rooms[st].filter(x => { if (M.unbuilt.includes(x.id)) { gone.add(st + '|' + x.id); slots.push({ st: +st, r: x.r || [], block: x.block === 'clinic' ? 'services' : x.block }); return false; } if (M.rename[x.id] && !x.keepName) { x.n = M.rename[x.id]; if (x.block === 'clinic') x.block = 'services'; } return true; });
  if (RULES.slotFloor) { const add = {};    
    for (const q of slots) { const up = (L.rooms[q.st + 1] || []).flatMap(x => x.r || []); if (!up.length) continue; const under = q.r.flatMap(r => { const rest = subAll([r], up); return subAll([r], rest); }).filter(r => ra(r) > 0.05); if (under.length) (add[q.st] || (add[q.st] = { r: [], block: q.block })).r.push(...under); }
    const done = []; for (const st of Object.keys(add)) { L.rooms[st].push(room(+st, 'usl' + st, 'Unassigned floor (a slot with no program, under the storey above; project decision, 19 Nov 17:28)', 'spare', 'spare', add[st].r, { block: add[st].block || null, voidFill: true })); done.push(`storey ${st} ${r2(sum(add[st].r.map(ra)))} m²`); }
    if (done.length) fl.push(`Empty slots under the storey above kept as unassigned floor (project decision, 19 Nov 17:28): ${done.join('; ')}; counts toward FAR, drawn solid, no use yet`); }
  let dropped = [];
  if (!van) { const cd = (def.constraints || []).find(c => c.type === 'capDrop'), order = cd ? cd.order || cd.dropOrder || [] : [], prog = x => !(x.block === 'data centre' || x.dcSide || x.kind === 'bay');
    let g = grossOf(L.rooms, prog);
    for (const sv of order) { if (g <= 500 + 1e-6) break; const ids = Object.keys(M.services).filter(k => M.services[k] === sv);
      for (const st of Object.keys(L.rooms)) L.rooms[st] = L.rooms[st].filter(x => { if (ids.includes(x.id)) { gone.add(st + '|' + x.id); dropped.push(x.n); return false; } return true; });
      g = grossOf(L.rooms, prog); }
    L.capShelter = Math.round(g);
    fl.push(g > 500 + 1e-6 ? `Over the BE cap (${Math.round(g)} / 500 m² gross): set in the rezoning (the day shelter as Community Service, Bylaw 20001 3.12.1; gross floor area, s. 8.20; ${dropped.length ? 'services rooms dropped in the project’s order: ' + dropped.join(', ') + '; ' : ''}the boards also cut the rest area to the cap, not done here (?); flag, not a fail: )`
      : `Day shelter as Community Service: ${Math.round(g)} m² gross ≤ 500 (Bylaw 20001 3.12.1, s. 8.20)${dropped.length ? '; services rooms dropped in the project’s order: ' + dropped.join(', ') : ''}`); }
  if (L.D) L.D = L.D.filter(d => !gone.has(d[0] + '|' + d[1]) && !gone.has(d[0] + '|' + d[2]));
  if (L.plant && L.plant.items) { L.plant.items = L.plant.items.filter(it => !M.dropPlant.includes(it.id)); L.plant.hubSet = false; }
  fl.push(`${def.name || def.id}: the hub’s ${L.frozen ? 'checked test fit' : 'layout'} relabelled room for room (${M.src}); the data centre and MW are the hub’s; slots with no program left unbuilt (${[...gone].filter(k => M.unbuilt.includes(k.split('|')[1])).length}); no hub generator set (life-safety power only). The board rows shown are re-run on the relabelled plan only where the engine has them (?)`);
  try { analyse(L, S); } catch (e) {} }
function toPlan(L, S) {
  if (S.hubTyp) hubFamily(L, S);
  const toUV = L.toUV;
  const R2uv = r => { const p = toUV(r[0], r[2]), q = toUV(r[1], r[3]); return [Math.min(p[0], q[0]), Math.max(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[1], q[1])]; };
  const z0 = [0]; L.H.forEach((h, i) => z0.push(z0[i] + h));
  const storeys = Object.keys(L.rooms).map(Number).sort((a, b) => a - b).map(st => {
    const S1 = { z: r2(z0[st - 1]), name: L.storeyNames[st - 1], rooms: [], corridors: [], stairs: [], lifts: [], doors: [], exits: [], walls: [] };
    const rs = L.rooms[st];
    rs.forEach(x => { const meta = { kind: x.kind, line: lineOf(x), block: x.block === 'spare' ? 'spare' : x.block, id: x.id, name: x.n };
      x.r.forEach((r, k) => { const R = R2uv(r), m2 = r2(ra(r));
        if (x.corridor) S1.corridors.push(Object.assign({ rect: R, w: RULES.cor.w }, meta));
        else if (x.stair) S1.stairs.push(Object.assign({ rect: R }, meta));
        else if (x.lift) S1.lifts.push(Object.assign({ rect: R }, meta));
        else S1.rooms.push(Object.assign({ rect: R, m2, part: k, min: minOf(x), room: x.id }, meta)); }); });
    (L.D || []).filter(d => d[0] === st).forEach(d => { const [_, a, b, u, v, o, w] = d, p = toUV(u, v), along = o === 'v' ? 'v' : 'u';
      const rec = { from: a, room: a, to: b, u: p[0], v: p[1], along, w };
      if (b === 'IN') { S1.doors.push(Object.assign({}, rec, { to: 'outside', entranceOnly: true })); return; }    
      if (b === 'OUT') { const x = rs.find(y => y.id === a); S1.exits.push(Object.assign({ id: a + '_out', block: x ? x.block : '', via: a, to: 'outside', entrance: a === 'lob', kind: x && (x.kind === 'dock') ? 'loading' : undefined }, rec)); }
      else { const xa = rs.find(y => y.id === a); S1.doors.push(Object.assign({}, rec, { from: xa && xa.stair ? stairName(xa) : a })); } });
    S1.walls = wallsOf(rs.flatMap(x => x.r), R2uv);
    return S1; });
  const exitSep = L.apart.map(z => ({ block: z.zone, stairs: `${z.exits} exits`, apart_m: z.apart_m, need_m: z.need_m, status: z.status, ok: z.ok, how: z.how + '; ' + z.rule, a: z.a ? Object.assign({}, z.a, { uv: toUV(z.a.u, z.a.v) }) : null, b: z.b ? Object.assign({}, z.b, { uv: toUV(z.b.u, z.b.v) }) : null, st: z.st }));
  L.travel.forEach(t => { if (t.path) t.pathUV = t.path.map(p => toUV(p[0], p[1])); });
  if (L.plant) L.plant.items.forEach(it => { it.rect = it.r ? R2uv(it.r) : null; it.zoneUV = it.z ? R2uv(it.z) : null; });
  if (L.truck) { L.truck.courtUV = L.truck.court ? R2uv(L.truck.court) : null; L.truck.walkUV = L.truck.walk ? R2uv(L.truck.walk) : null; }    
  const programs = [];
  const T = L.treach, flags = L.flags.slice();
  if (L.plant && !L.plant.ok) flags.push('Plant: ' + L.plant.why);
  if (T) (T.egress || []).filter(e => !e.ok).forEach(e => flags.push(`Egress doorways: ${e.name} (storey ${e.storey}) needs 2, ${e.doors < 2 ? 'has ' + e.doors : e.apart_m + ' m apart, needs ' + e.need_m + ' m'} (${e.why}; VBBL 3.3.1.5)`));
  {  
    const tg = [];
    (L.travel || []).filter(t => t.status === 'tight').forEach(t => tg.push(`travel, ${t.zone} ${t.worst} m of ${t.limit || 45} m`));
    (L.apart || []).filter(z => z.status === 'tight').forEach(z => tg.push(`exits apart, ${z.zone} ${z.apart_m} m, needs ${z.need_m} m`));
    (L.discharge || []).filter(d => d.status === 'tight').forEach(d => tg.push(`exterior discharges ${d.a}–${d.b} ${d.d} m, needs ${d.need} m`));
    if (T) (T.dead || []).filter(c => c.status === 'tight').forEach(c => tg.push(`dead end, storey ${c.storey} ${c.corridor} ${c.deadEnd_m} m of 6 m`));
    if (T) (T.width.rows || []).filter(r => r.sev === 'tight').forEach(r => tg.push(`width, ${r.name} ${r.width_m} m of ${r.min_m} m`));
    if (T) (T.egress || []).filter(e => e.status === 'tight').forEach(e => tg.push(`egress doorways, ${e.name} ${e.apart_m} m apart, needs ${e.need_m} m`));
    if (L.grades && L.grades.heightStatus === 'tight') tg.push(`height ${L.grades.height} m of ${L.grades.hLimit} m`);
    if (tg.length) flags.push('Tight, check in design (within 0.5 m or 5 % of the limit, project decision, 9 Nov): ' + tg.join('; '));
  }
  if (L.kind === 'stacked' && !L.frozen) flags.push('Section: ground storey, 4.0 m support storey, one hall storey: the spec’s height-capped section, drawn on every lot by the hub cap (project decision, 8 Nov)');    
  if (L.grades && L.grades.heightOk === false) flags.push(`Not built yet: ${L.grades.height} m is over the ${L.grades.hLimit} m limit even with the height-capped section; a lower section is not built (?)`);
  if (L.kind === 'stacked' && !L.narrow && !L.frozen) flags.push('Refuge at 50 people, the minimum; the ground floor behind the hub stays the data-centre entrance row and covered truck court (project decision, 8 Nov)');
  if (L.capW) flags.push(`Hub cap (2,325 m² of data centre, project decision, 8 Nov): at its smallest depth the building was still over the cap, so it narrows from ${L.capW.from} m to ${L.capW.to} m wide; the rest of the land stays open (drawing choice, 10 Nov 2026)`);
  if (L.narrow) { const n = L.narrow;
    flags.push(`Narrow lot (F2b, 10 Nov 2026): the hub bands run back from the street (refuge strip ${n.Wr} m | public corridor | service strip), the data-centre entrance and ${L.nb} bays at the rear; ${n.drive ? 'the corridor ends in an exit passage to the side drive' : 'an exit passage (2 h) runs from the corridor along the lot line to the truck court'} (drawing choices, as the 1330 Glen Dr and 8238 Fraser St hand fits)`);
    flags.push(`Refuge ${n.refuge} m² (${Math.floor(n.refuge / 3.5)} people at 3.5 m²), held at the spec size (project decision, 10 Nov); washrooms for a load of ${n.load} (refuge and shelter, Table 3.7.2.2.-A)` + (n.overflow.length ? `; ${n.overflow.join(', ')} moved into a pocket of the refuge strip on the corridor` : ''));
    if (n.open) flags.push(`Open ground at grade beside the corridor, ${n.openM2} m², not built (spare floor at grade, project decision, 10 Nov); storey 2 is drawn over it, so it is a covered open area: whether it stays covered is not decided (?)`);
    flags.push('No clinic on a narrow lot: no second separate exit fits (spec Part 6); the floor over the hub is data-centre support and unassigned floor');
    flags.push('Hall over the hub only; the rear (entrance row and bays) is two storeys, chillers on its roof (spec rule 1: a lower roof not over the hall)');
    if (!n.drive) flags.push(`Truck court behind the building, open to the sky, reached from ${n.svcWhy}; the route from that street to the court and truck turning are not checked (?)`); }
  if (L.kind === 'stacked' && L.clin > 0 && !L.frozen) flags.push('Clinic grows into the spare floor over the hub (spare-floor order: the refuge grows only at grade; clinic kept under 500 m², project decision, 8 Nov)');
  if (L.plant && L.plant.items.some(it => it.kind === 'chiller' && it.roof)) flags.push('Chillers on the hub roof, over the refuge: A2L refrigerant pools below a leak; no safe distance in the maker’s guide (?)');
  if (S.city !== 'van') flags.push('Edmonton cooling: the Liebert AFC is outside Vertiv’s stated range at −30 °C (SL-70790 pp. 9–10): chillers are a placeholder (?)');
  const entrances = [{ id: 'lob_out', block: 'hub', slab_m: L.grades.slab, street_m: L.grades.street, stepFree: L.grades.stepFree }];
  return { version: RULES.version, rules: RULES, storeys, exitSep, flags, programs, entrances, hub: L, typology: 'emergency_hub' };
}
const stairName = x => (/^s[12]$/.test(x.id) ? 'dc_stair_' + (x.id === 's1' ? 'A' : 'B') : /^p[12]$/.test(x.id) ? 'clinic_stair_' + (x.id === 'p2' ? 'A' : 'B') : x.id);
function lineOf(x) { const P = { lobby: 1, pcor: 1, ccor: 1, pcore: 1, proom: 1, croom: 1, exitpas: 1 }, Sx = { scor: 1, score: 1, sroom: 1, hall: 1, dock: 1, bay: 1, entry: 1 };
  return P[x.kind] ? 'public' : Sx[x.kind] ? 'secure' : x.kind === 'spare' ? 'of its corridor' : '—'; }
function minOf(x) { const p = PRG[x.prog] || PRG[x.id] || PRG[(x.id || '').replace(/\d+$/, '')] || null; if (!p) return { m2: null, w: null, step: 6, src: 'drawing choice' };
  return { m2: p.m2 != null ? p.m2 : null, w: p.w != null ? p.w : null, step: p.step, src: p.src, rank: p.rank || null }; }
function wallsOf(rects, R2uv) { const segs = [], key = s => [s.axis, s.at, s.from, s.to].join(',');
  const inAny = (a, b) => rects.some(r => a > r[0] + 1e-6 && a < r[1] - 1e-6 && b > r[2] + 1e-6 && b < r[3] - 1e-6);
  rects.forEach(r => { [[0, 'a'], [1, 'a'], [2, 'b'], [3, 'b']].forEach(([k, ax]) => { const at = r[k], lo = ax === 'a' ? r[2] : r[0], hi = ax === 'a' ? r[3] : r[1], out = (k === 0 || k === 2) ? -0.05 : 0.05;
    const cuts = new Set([lo, hi]); rects.forEach(q => { (ax === 'a' ? [q[2], q[3]] : [q[0], q[1]]).forEach(c => { if (c > lo && c < hi) cuts.add(c); }); });
    const cs = [...cuts].sort((x, y) => x - y); for (let i = 0; i < cs.length - 1; i++) { const m = (cs[i] + cs[i + 1]) / 2, ext = ax === 'a' ? !inAny(at + out, m) : !inAny(m, at + out);
      const p = ax === 'a' ? R2uv([at, at, cs[i], cs[i + 1]]) : R2uv([cs[i], cs[i + 1], at, at]); const s = p[0] === p[1] ? { axis: 'u', at: p[0], from: p[2], to: p[3], exterior: ext } : { axis: 'v', at: p[2], from: p[0], to: p[1], exterior: ext };
      if (!segs.some(t => key(t) === key(s))) segs.push(s); } }); });
  return segs; }

const api = { applyPlanMode, ZONE_RULES, build, fromSite, siteOf, layout, frozenBoard, boardsOf: frozenData, truckRows, gateRow, typDefOf, RULES, PRG, wcA, wcB, wcBload, LAYOUT_HOOKS, HOOK_CTX, plantUpWhy: () => LASTPU.slice(-4), publicText, publicRows };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (root) { root.BD = root.BD || {}; root.BD.hub = api; }
})(typeof window !== 'undefined' ? window : null);
