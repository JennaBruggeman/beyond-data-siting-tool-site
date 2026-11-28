 
(function () {
  'use strict';
  var BD = window.BD = window.BD || {};
  var NS = 'http://www.w3.org/2000/svg', FONT = 'IBM Plex Sans, sans-serif';
  var K = {
    INK: '#1E2A47', NAVY: '#1E2A47', SKY: '#EEF0F4', GROUND: '#E9E5DA', EARTH: '#DAD3C3', CUT: '#2F3640', WALL: '#4A4F57',
    GREY: '#6B7180', GREY2: '#9AA0A8', GREY3: '#C3C7CD', LIGHT: '#E3E5E8', WHITE: '#FFFFFF', ROAD: '#5E6066', WALK: '#C9CCD1',
    SHELL: '#B9C5DA', HALL: '#8C9DBD', DCB: '#3D5185', ORANGE: '#F28C38', PMID: '#F5A462', SUP: '#FDE5D0', POOL: '#69A7DC',
    LEAF: '#B7C79A', WOOD: '#C9A27E', CREAM: '#F4F1E8', ROOM: '#F7F8FA',
    POWER: '#1E2A47', PULSE: '#F5A462', FIBRE: '#E2B93B', CHILLED: '#2F7FD1', WARM: '#D64534', REUSE: '#7A4FE0', COLD: '#2F7FD1', HOT: '#D64534',
    FUEL: '#8C5A2B', SPRINK: '#8CC8F0', FIRE: '#C0262D', SMOKE: '#8A8F99'
  };
  var MEDIA = {
    power: ['Power: cable or busway', 'band'], fibre: ['Fibre (data as light)', 'fibre'], chilled: ['Chilled water', 'pipeC'], warm: ['Warm water to be cooled', 'pipeW'],
    reuse: ['Heat sent on for reuse', 'pipeR'], cold: ['Cold air', 'airC'], hot: ['Hot air', 'airH'], fuel: ['Fuel', 'fuel'], sprink: ['Sprinkler water', 'sprink'],
    fire: ['Red wall: fire separation', 'firewall'], cooled: ['Cooled water back to the hall', 'pipeC'], mains: ['Mains water in', 'mains'], fibreA: ['Network A (fibre)', 'fibreA'], fibreB: ['Network B (fibre)', 'fibreB'], drain: ['Water to the drain', 'drain'], smoke: ['Smoke', 'smoke']
  };
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function f2(v) { return (+v).toFixed(3); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  
  var W = {
    R: function (x, y, w, h, f, ex) { return '<rect x="' + f2(x) + '" y="' + f2(y) + '" width="' + f2(Math.max(0, w)) + '" height="' + f2(Math.max(0, h)) + '" fill="' + f + '"' + (ex || '') + '/>'; },
    B: function (u, h, w, hh, f, ex) { return W.R(u, -(h + hh), w, hh, f, ex); },
    C: function (u, h, r, f, ex) { return '<circle cx="' + f2(u) + '" cy="' + f2(-h) + '" r="' + f2(r) + '" fill="' + f + '"' + (ex || '') + '/>'; },
    P: function (pts, f, ex) { return '<polygon points="' + pts.map(function (p) { return f2(p[0]) + ',' + f2(-p[1]); }).join(' ') + '" fill="' + f + '"' + (ex || '') + '/>'; },
    d: function (pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f2(p[0]) + ' ' + f2(-p[1]); }).join(' '); },
    line: function (pts, col, w, ex) { return '<path d="' + W.d(pts) + '" stroke="' + col + '" stroke-width="' + f2(w) + '" fill="none" stroke-linejoin="round"' + (ex || '') + '/>'; },
    
    power: function (pts, t, on) {   
      var s = W.line(pts, on === false ? K.GREY3 : K.POWER, 0.16, ' stroke-linecap="butt"');
      if (on !== false) s += W.line(pts, K.PULSE, 0.07, ' stroke-linecap="butt" stroke-dasharray="0.35 1.6" stroke-dashoffset="' + f2(-(t || 0) * 2.4) + '"');
      return s;
    },
    pipe: function (pts, col, t, flow) {   
      var s = W.line(pts, col, 0.2, ' stroke-linecap="round"') + W.line(pts, '#FFFFFF', 0.05, ' stroke-linecap="round" stroke-opacity="0.45" transform="translate(0 -0.04)"');
      if (flow !== false) s += W.line(pts, '#FFFFFF', 0.06, ' stroke-linecap="round" stroke-opacity="0.8" stroke-dasharray="0.12 1.1" stroke-dashoffset="' + f2(-(t || 0) * 1.2) + '"');
      return s;
    },
    fibre: function (pts, t, col) { return W.line(pts, col || K.FIBRE, 0.06, ' stroke-linecap="round"') + W.line(pts, '#FFFFFF', 0.035, ' stroke-linecap="round" stroke-opacity="0.9" stroke-dasharray="0.08 2.4" stroke-dashoffset="' + f2(-(t || 0) * 6) + '"'); },
    air: function (pts, col, t, op) { return W.line(pts, col, 0.045, ' stroke-linecap="round" stroke-dasharray="0.3 0.22" stroke-dashoffset="' + f2(-(t || 0) * 1.1) + '"' + (op != null ? ' opacity="' + f2(op) + '"' : '')); },
    fuel: function (pts, t) { return W.line(pts, K.FUEL, 0.08, ' stroke-linecap="round"'); },
    sprink: function (pts, t, full) { return W.line(pts, full ? K.SPRINK : K.GREY3, 0.08, ' stroke-linecap="round"'); },
    arrow: function (u, h, dir, col, sz) {   
      sz = sz || 0.3; var a = dir * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      return W.P([[u + c * sz, h + s * sz], [u - c * sz * 0.6 - s * sz * 0.55, h - s * sz * 0.6 + c * sz * 0.55], [u - c * sz * 0.6 + s * sz * 0.55, h - s * sz * 0.6 - c * sz * 0.55]], col);
    },
    
    fig: function (u, h, w, pose) {
      var y = -h, x = u, R = W.R, s = '', lg = 0.12 * Math.sin(w || 0);
      if (pose === 'reach') {
        s += R(x - 0.2, y - 0.86, 0.14, 0.86, '#FFFFFF') + R(x + 0.06, y - 0.86, 0.14, 0.86, '#E3E7EC') + R(x - 0.22, y - 1.46, 0.44, 0.62, '#FFFFFF');
        s += R(x + 0.15, y - 1.36, 0.55, 0.11, '#F2F4F7') + R(x + 0.15, y - 1.18, 0.55, 0.11, '#DDE2E8') + '<circle cx="' + f2(x) + '" cy="' + f2(y - 1.62) + '" r="0.13" fill="#FFFFFF"/>';
        return '<g stroke="#8A94AA" stroke-width="0.03">' + s + '</g>';
      }
      s += R(x - 0.2 + lg, y - 0.86, 0.14, 0.86, '#FFFFFF') + R(x + 0.06 - lg, y - 0.86, 0.14, 0.86, '#E3E7EC');
      s += R(x - 0.22, y - 1.46, 0.44, 0.62, '#FFFFFF') + R(x + 0.1, y - 1.46, 0.12, 0.62, '#E3E7EC');
      s += R(x - 0.34 - lg * 0.6, y - 1.44, 0.11, 0.6, '#F2F4F7') + R(x + 0.23 + lg * 0.6, y - 1.44, 0.11, 0.6, '#DDE2E8');
      s += '<circle cx="' + f2(x) + '" cy="' + f2(y - 1.62) + '" r="0.13" fill="#FFFFFF"/>';
      return '<g stroke="#8A94AA" stroke-width="0.03">' + s + '</g>';
    }
  };
  
  var EQ = {
    rack: function (u, h, lit) {        
      var s = W.B(u, h, 0.6, 2.2, K.DCB) + W.B(u + 0.05, h + 0.08, 0.5, 2.04, '#2C3A63');
      for (var y = 0.15; y < 2.15; y += 0.12) s += W.B(u + 0.07, h + y, 0.46, 0.035, '#8C9DBD', ' fill-opacity="0.7"');
      if (lit !== false) for (var k = 0; k < 6; k++) s += W.B(u + 0.44, h + 0.3 + k * 0.3, 0.05, 0.04, '#9BE0A0');
      return s;
    },
    battery: function (u, h) {          
      return W.B(u, h, 0.6, 2.0, '#5C6478') + W.B(u + 0.08, h + 1.55, 0.44, 0.12, '#9BE0A0') + W.B(u + 0.08, h + 0.2, 0.44, 1.2, '#6B7389') + W.B(u + 0.08, h + 1.75, 0.15, 0.08, K.GREY3);
    },
    ups: function (u, h, w) {           
      w = w || 2.4; return W.B(u, h, w, 2.0, '#7A8294') + W.B(u + 0.2, h + 1.4, 0.5, 0.3, '#CFE8F7') + W.B(u + 0.85, h + 1.45, 0.25, 0.08, '#9BE0A0') + W.B(u, h + 1.95, w, 0.05, K.GREY3);
    },
    switchgear: function (u, h, n) {    
      var s = ''; n = n || 3; for (var i = 0; i < n; i++) { var x = u + i * 0.8; s += W.B(x, h, 0.76, 2.3, '#8D94A3') + W.B(x + 0.6, h + 1.0, 0.06, 0.35, K.INK) + W.B(x + 0.12, h + 1.8, 0.3, 0.2, K.GREY3); }
      return s;
    },
    transformer: function (u, h) {      
      var s = W.B(u - 0.2, h, 2.6, 0.2, K.GREY3) + W.B(u, h + 0.2, 2.2, 1.9, '#5E8C6A');
      for (var i = 0; i < 5; i++) s += W.B(u + 2.2 + 0.02, h + 0.4 + i * 0.3, 0.16, 0.1, '#4E7A5B');
      return s + W.B(u + 0.2, h + 1.6, 0.4, 0.25, '#F5E7A0');
    },
    vault: function (u, h, w, d) {      
      return W.B(u - 0.15, h - d - 0.15, w + 0.3, d + 0.15, K.CUT) + W.B(u, h - d, w, d, '#B8BEC8') + W.B(u + 0.3, h - 0.08, w - 0.6, 0.08, K.GREY);
    },
    pole: function (u, h) {             
      return W.B(u - 0.08, h, 0.16, 6.0, K.GREY) + W.B(u - 0.08, h + 5.9, 1.4, 0.12, K.GREY) + W.B(u + 1.0, h + 5.75, 0.5, 0.18, '#F5E7A0');
    },
    tray: function (u0, u1, h) {        
      return W.B(u0, h, u1 - u0, 0.04, K.GREY2) + W.B(u0, h, 0.04, 0.12, K.GREY2) + W.B(u1 - 0.04, h, 0.04, 0.12, K.GREY2);
    },
    light: function (u, h) { return W.B(u - 0.4, h, 0.8, 0.08, '#F5E7A0') + W.B(u - 0.02, h + 0.08, 0.04, 0.4, K.GREY2); },
    genset: function (u, h, run) {      
      var s = W.B(u - 0.1, h - 0.9, 3.8, 0.9, '#7A6A55') + W.B(u, h, 3.6, 2.4, '#C9CED6') + W.B(u, h + 2.35, 3.6, 0.1, K.GREY2);
      for (var y = 0.4; y < 2.1; y += 0.22) s += W.B(u + 0.15, h + y, 0.7, 0.06, K.GREY2) + W.B(u + 2.75, h + y, 0.7, 0.06, K.GREY2);
      s += W.B(u + 1.2, h + 0.8, 1.2, 0.9, '#B3B9C3') + W.B(u + 2.9, h + 2.45, 0.22, 1.4, K.GREY) + W.B(u + 2.85, h + 3.8, 0.32, 0.12, K.GREY);
      return s;
    },
    cooler: function (u, h) {           
      var s = W.B(u, h, 0.3, 2.2, '#3E4656') + W.B(u + 0.03, h + 0.2, 0.24, 1.8, '#4A5366');
      for (var y = 0.3; y < 1.9; y += 0.25) s += W.C(u + 0.15, h + y, 0.08, '#6B7389');
      return s;
    }
  };

  function make(SC) {
    var STEPS = SC.steps, DUR = SC.dur || STEPS.length * 6;
    var el, svg, worldG, dynG, labG, keyG, raf = 0, t0 = 0, playing = false, tNow = 0, reduced = false, stepNow = -1, onStepCb = null,
        narrow = false, VW = 1200, VH = 675, fs = 15, CAMS = [], LAB = [], HMIN = SC.hmin, HMAX = SC.hmax;
    function camFor(i) {               
      
      
      var kw = Infinity; for (var jj = 0; jj < STEPS.length; jj++) { var cc = STEPS[jj].cam; kw = Math.min(kw, VW * 0.9 / (cc[1] - cc[0])); }
      function kOf(j) { var c = STEPS[j].cam; return Math.min(VW * 0.9 / (c[1] - c[0]), (narrow ? 700 : 470) / (HMAX - HMIN), kw * 1.8); }
      var c = STEPS[i].cam, top = (SC.toprows || 2) * fs * (narrow ? 1.7 : 1.6) + fs * 1.2, kmax = 0;
      for (var j = 0; j < STEPS.length; j++) kmax = Math.max(kmax, kOf(j));
      var k = kOf(i), bottom = top + (HMAX - HMIN) * kmax;
      return { k: k, tx: VW / 2 - k * (c[0] + c[1]) / 2, y0: bottom + HMIN * k, bottom: bottom };
    }
    function tw(s) { return String(s).length * fs * 0.56; }
    function txt(x, y, s, anchor, w, col) {
      return '<text x="' + f2(x) + '" y="' + f2(y) + '" font-size="' + f2(fs) + '" font-weight="' + (w || 500) + '" font-family="' + FONT + '" fill="' + (col || K.INK) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>';
    }
    function ln(x1, y1, x2, y2, col) { return '<line x1="' + f2(x1) + '" y1="' + f2(y1) + '" x2="' + f2(x2) + '" y2="' + f2(y2) + '" stroke="' + (col || K.INK) + '" stroke-width="' + f2(Math.max(1.2, fs / 12)) + '"/>'; }
    function swatch(x, y, m) {        
      var t = MEDIA[m][1], w = fs * 1.6, y0 = y - fs * 0.38;
      if (t === 'band') return '<rect x="' + f2(x) + '" y="' + f2(y0 - 3) + '" width="' + f2(w) + '" height="6" fill="' + K.POWER + '"/><rect x="' + f2(x + w * 0.4) + '" y="' + f2(y0 - 1.5) + '" width="' + f2(w * 0.2) + '" height="3" fill="' + K.PULSE + '"/>';
      var col = { fibre: K.FIBRE, pipeC: K.CHILLED, pipeW: K.WARM, pipeR: K.REUSE, airC: K.COLD, airH: K.HOT, fuel: K.FUEL, sprink: K.SPRINK, firewall: K.FIRE, fibreA: '#E2B93B', fibreB: '#2BA39B', mains: '#5FB3E8', drain: K.GREY, smoke: K.SMOKE }[t];
      if (t === 'smoke') return '<circle cx="' + f2(x + w / 2) + '" cy="' + f2(y0) + '" r="6" fill="' + col + '" fill-opacity="0.6"/>';
      if (t.indexOf('pipe') === 0) return '<line x1="' + f2(x + 4) + '" y1="' + f2(y0) + '" x2="' + f2(x + w - 4) + '" y2="' + f2(y0) + '" stroke="' + col + '" stroke-width="8" stroke-linecap="round"/><line x1="' + f2(x + 4) + '" y1="' + f2(y0 - 1.5) + '" x2="' + f2(x + w - 4) + '" y2="' + f2(y0 - 1.5) + '" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round"/>';
      if (t.indexOf('air') === 0) return '<line x1="' + f2(x) + '" y1="' + f2(y0) + '" x2="' + f2(x + w) + '" y2="' + f2(y0) + '" stroke="' + col + '" stroke-width="2" stroke-dasharray="5 3"/>';
      if (t === 'firewall') return '<rect x="' + f2(x) + '" y="' + f2(y0 - 2.5) + '" width="' + f2(w) + '" height="5" fill="' + col + '"/>';
      return '<line x1="' + f2(x) + '" y1="' + f2(y0) + '" x2="' + f2(x + w) + '" y2="' + f2(y0) + '" stroke="' + col + '" stroke-width="' + (t.indexOf('fibre') === 0 ? 2.5 : 3) + '"/>';
    }
    
    
    function layoutStep(i) {
      var NUM = narrow || !!SC.numbered;
      var c = camFor(i), items = SC.labels.filter(function (L) { return L.steps.indexOf(i) >= 0; });
      function X(u) { return c.tx + c.k * u; } function Y(h) { return c.y0 - c.k * h; }
      var s = '', keyItems = [], bottom = Y(HMIN), top = Y(HMAX);
      var rows = { b: [], t: [] }, used = { b: 0, t: 0 };
      items.forEach(function (L, j) { L._n = j + 1; });
      ['b', 't'].forEach(function (side) {
        var list = items.filter(function (L) { return L.side === side; }).sort(function (a, b) { return X(b.at[0]) - X(a.at[0]); });
        list.forEach(function (L) {
          var x = X(L.at[0]), lab = NUM ? String(L._n) : L.name, w = tw(lab), x0 = NUM ? x - w / 2 : Math.min(Math.max(x, 8), VW - 10 - w), r = 0;
          rows[side].forEach(function (p) { if (p.x > x0 - fs * 0.4 && p.x < x0 + w + fs * 0.4) r = Math.max(r, p.r + 1); });
          while (rows[side].some(function (p) { return p.r === r && x0 < p.x1 + fs * 0.8 && x0 + w > p.x0 - fs * 0.8; })) r++;
          rows[side].push({ r: r, x0: x0, x1: x0 + w, x: x, L: L, lab: lab }); used[side] = Math.max(used[side], r + 1);
        });
      });
      rows.b.forEach(function (p) {
        var y = bottom + fs * 1.9 + p.r * fs * (narrow ? 1.6 : 1.75);
        s += ln(p.x, Y(p.L.at[1]) + 2, p.x, y - fs * 0.95, p.L.col) + txt(NUM ? p.x : p.x0, y, p.lab, NUM ? 'middle' : 'start', 500, p.L.tcol);
      });
      rows.t.forEach(function (p) {
        var y = top - fs * 0.9 - p.r * fs * 1.6;
        s += ln(p.x, Y(p.L.at[1]) - 2, p.x, y + fs * 0.35, p.L.col) + txt(NUM ? p.x : p.x0, y, p.lab, NUM ? 'middle' : 'start', 500, p.L.tcol);
      });
      items.filter(function (L) { return L.side === 'l' || L.side === 'r'; }).forEach(function (L) {
        var y = Y(L.at[1]), lab = NUM ? String(L._n) : L.name, x = X(L.at[0]);
        if (L.side === 'r') { var xr = X(L.to != null ? L.to : SC.cams_r || STEPS[i].cam[1]) + fs * 0.6; xr = Math.min(xr, VW - 10 - tw(lab)); s += ln(x + 2, y, xr - fs * 0.35, y, L.col) + txt(xr, y + fs * 0.35, lab, 'start', 500, L.tcol); }
        else { var xl = X(L.to != null ? L.to : STEPS[i].cam[0]) - fs * 0.6; xl = Math.max(xl, 10 + tw(lab)); s += ln(xl + fs * 0.35, y, x - 2, y, L.col) + txt(xl, y + fs * 0.35, lab, 'end', 500, L.tcol); }
      });
      var yb = bottom + fs * 1.9 + Math.max(0, used.b - 1) * fs * (narrow ? 1.6 : 1.75) + fs * 1.2;
      
      var ks = '', y = yb + fs * 1.4;
      if (NUM) {
        var cols = narrow ? 2 : 3, cw = (VW - 60) / cols, per = Math.ceil(items.length / cols), maxc = Math.floor((cw - fs * 1.8) / (fs * 0.56)), yk = []; for (var cc = 0; cc < cols; cc++) yk.push(y);
        items.forEach(function (L, j) {
          var col = Math.floor(j / per), x = 30 + col * cw + fs * 1.4, words = L.name.split(' '), lines = [''], li = 0;
          words.forEach(function (w) { if ((lines[li] + ' ' + w).trim().length > maxc) { li++; lines[li] = ''; } lines[li] = (lines[li] + ' ' + w).trim(); });
          ks += txt(x, yk[col], String(L._n), 'end', 600);
          lines.forEach(function (l2, q) { ks += txt(x + fs * 0.5, yk[col] + q * fs * 1.25, l2, 'start', 500, L.tcol); });
          yk[col] += lines.length * fs * 1.25 + fs * 0.3;
        });
        y = Math.max.apply(null, yk) + fs * 0.6;
      }
      var media = (STEPS[i].key || SC.key || []), kx = 30, ky = y;
      media.forEach(function (m) {
        var w = fs * 2.2 + tw(MEDIA[m][0]);
        if (kx + w > VW - 20) { kx = 30; ky += fs * 1.6; }
        ks += swatch(kx, ky, m) + txt(kx + fs * 2.0, ky, MEDIA[m][0], 'start', 500); kx += w + fs * 1.4;
      });
      return { svg: s, key: ks, bottom: ky + fs * 1.2 };
    }
    function build() {
      var cw = Math.max(1, el.clientWidth || 1200);
      narrow = cw < 960; VW = 1200; fs = narrow ? Math.max(26, 12 * VW / cw) : Math.max(15, 12 * VW / cw);
      CAMS = STEPS.map(function (s, i) { return camFor(i); });
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', '100%'); svg.style.display = 'block'; svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', SC.aria);
      var uid = 'hk' + Math.floor(Math.random() * 1e6);
      svg.innerHTML = '<defs><clipPath id="' + uid + '"><rect width="' + VW + '" height="4000"/></clipPath></defs><rect width="' + VW + '" height="4000" fill="#FFFFFF"/>' +
        '<g clip-path="url(#' + uid + ')"><rect x="0" y="0" width="' + VW + '" height="4000" fill="' + K.SKY + '"/><g class="world">' + SC.base(W, EQ, K) + '<g class="dyn"></g></g><rect class="under" x="0" width="' + VW + '" height="4000" fill="#FFFFFF"/><g class="lab"></g><g class="key"></g></g>';
      el.appendChild(svg);
      worldG = svg.querySelector('.world'); dynG = svg.querySelector('.dyn'); labG = svg.querySelector('.lab'); keyG = svg.querySelector('.key');
      LAB = STEPS.map(function (s, i) { return layoutStep(i); });
      VH = Math.max(0, Math.ceil(Math.max.apply(null, LAB.map(function (l) { return l.bottom; })) + fs * 0.6));
      svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
      labG.innerHTML = LAB.map(function (l, i) { return '<g data-i="' + i + '" opacity="0">' + l.svg + '</g>'; }).join('');
      keyG.innerHTML = LAB.map(function (l, i) { return '<g data-i="' + i + '" opacity="0">' + l.key + '</g>'; }).join('');
    }
    function at(T) {
      T = +T || 0; if (!(T > 0)) T = 0;
      var end = reduced || T >= DUR - 0.05; if (end) T = DUR;
      var i = 0; for (var k = 0; k < STEPS.length; k++) if (T >= STEPS[k].t) i = k;
      if (i !== stepNow) { stepNow = i; if (onStepCb) try { onStepCb(i, STEPS[i]); } catch (x) {} }
      draw(T, i); tNow = T;
    }
    function draw(t, i) {
      var a = CAMS[Math.max(0, i - 1)], b = CAMS[i], u = i === 0 ? 1 : ease((t - STEPS[i].t) / 1.6);
      var k = lerp(a.k, b.k, u), tx = lerp(a.tx, b.tx, u), y0 = lerp(a.y0, b.y0, u);
      worldG.setAttribute('transform', 'translate(' + f2(tx) + ' ' + f2(y0) + ') scale(' + f2(k) + ')');
      svg.querySelector('.under').setAttribute('y', f2(b.bottom));
      dynG.innerHTML = SC.dyn(W, EQ, K, t, i, t - STEPS[i].t);
      var la = clamp((t - STEPS[i].t - (i === 0 ? 0.3 : 1.5)) / 0.5);
      Array.prototype.forEach.call(labG.children, function (g, j) { g.setAttribute('opacity', j === i ? f2(la) : '0'); });
      Array.prototype.forEach.call(keyG.children, function (g, j) { g.setAttribute('opacity', j === i ? f2(Math.max(la, i === 0 ? 1 : 0)) : '0'); });
    }
    function loop(ts) { if (!playing) return; var t = (ts - t0) / 1000; if (t >= DUR) { at(DUR); playing = false; return; } at(t); raf = requestAnimationFrame(loop); }
    return {
      mount: function (host, ctx) { el = host; reduced = !!(ctx && ctx.reduced); onStepCb = (ctx && ctx.onStep) || null; stepNow = -1; build(); at(reduced ? DUR : 0); },
      steps: function () { return STEPS.map(function (s) { return { t: s.t, caption: s.caption }; }); },
      play: function () { if (reduced) { at(DUR); return; } if (playing) return; playing = true; t0 = performance.now() - (tNow >= DUR ? 0 : tNow) * 1000; raf = requestAnimationFrame(loop); },
      replay: function () { this.stop(); tNow = 0; at(0); this.play(); },
      stop: function () { playing = false; cancelAnimationFrame(raf); },
      seek: function (t) { at(t); },
      destroy: function () { this.stop(); if (svg) svg.remove(); svg = null; }
    };
  }
  BD.anim = BD.anim || { _reg: {}, register: function (n, f) { this._reg[n] = f; } };
  var SCENE = (function () {



var A = '#E2B93B', B = '#2BA39B', RACKS = []; for (var x = 18.6; x + 0.6 <= 29.4; x += 0.62) RACKS.push(x);
return {
  toprows: 3, dur: 36, hmin: -2.6, hmax: 5.4,
  aria: 'A section from the street to the data hall. Two networks run in separate underground ducts, one from the street and one from the rear lane, and enter at two separate entrance rooms. In the meet-me room each ends on its own patch panel, and a short cross-connect links it to the data centre’s panel. From there an overhead yellow tray carries the fibre to each rack’s top-of-rack switch, with pulses of light travelling along it.',
  key: ['fibreA', 'fibreB'],
  base: function (W, EQ, K) {
    var s = W.B(-12, -6, 56, 6, K.EARTH) + W.B(-12, -0.4, 11.7, 0.25, K.ROAD) + W.B(-0.3, -0.4, 0.3, 0.4, K.GREY2) + W.B(0, -0.2, 2, 0.2, K.WALK);
    s += W.B(34.3, -0.4, 9, 0.25, K.ROAD);                                                       
    s += W.B(2, 0, 32, 4.8, '#F4F6FA') + W.B(1.7, -0.35, 32.6, 0.35, K.CUT) + W.B(1.7, 4.8, 32.6, 0.35, K.CUT) + W.B(1.7, 0, 0.3, 4.8, K.CUT) + W.B(34, 0, 0.3, 4.8, K.CUT);
    [6, 11.5, 17.5, 30].forEach(function (u) { s += W.B(u, 0, 0.18, 4.8, K.WALL); });
    
    s += W.B(3.0, 1.0, 0.6, 0.8, '#B3B9C3') + W.B(31.4, 1.0, 0.6, 0.8, '#B3B9C3');
    [12.4, 13.8, 15.4].forEach(function (u, k) { s += W.B(u, 0, 0.7, 2.2, k === 2 ? K.DCB : '#5C6478'); for (var r = 0; r < 6; r++) s += W.B(u + 0.08, 0.6 + r * 0.22, 0.54, 0.1, '#C3C7CD'); });
    RACKS.forEach(function (u) { s += EQ.rack(u, 0) + W.B(u + 0.05, 2.05, 0.5, 0.1, '#9BE0A0'); });
    s += EQ.tray(12.0, 29.4, 3.4);
    s += W.fig(1.0, 0, 0) + W.fig(16.6, 0, 0);
    return s;
  },
  dyn: function (W, EQ, K, t, i, ts) {
    var s = '';
    
    s += W.B(-12, -1.3, 15.6, 0.35, '#C9C2B0') + W.B(30.9, -1.9, 12.4, 0.35, '#C9C2B0');
    s += W.fibre([[-12, -1.12], [3.3, -1.12], [3.3, 1.0]], t, A) + W.fibre([[43, -1.72], [31.7, -1.72], [31.7, 1.0]], t, B);
    if (i >= 1) {
      s += W.fibre([[3.3, 1.8], [3.3, 3.9], [12.75, 3.9], [12.75, 2.2]], t, A);
      s += W.fibre([[31.7, 1.8], [31.7, 4.2], [14.15, 4.2], [14.15, 2.2]], t, B);
    }
    if (i >= 2) {
      var plug = i === 2 ? Math.min(1, ts / 3) : 1;
      s += W.fibre([[12.95, 1.2], [12.95, 0.4], [lerp(12.95, 15.6, plug), 0.4]].concat(plug >= 1 ? [[15.6, 1.2]] : []), t, A);
      s += W.fibre([[14.35, 1.42], [14.35, 0.6], [15.8, 0.6], [15.8, 1.42]], t, B);
    }
    if (i >= 3) { s += W.fibre([[15.65, 2.2], [15.65, 3.45], [29.2, 3.45]], t, A) + W.fibre([[15.85, 2.2], [15.85, 3.56], [29.2, 3.56]], t, B);
      RACKS.forEach(function (u, k) { var c = k % 3 === 2 ? B : A; s += W.line([[u + 0.3, c === B ? 3.56 : 3.45], [u + 0.3, 2.15]], c, 0.04); }); }
    if (i >= 4) for (var q = 0; q < 4; q++) { var a = ((t * 0.25 + q / 4) % 1), u = lerp(-12, 29, a); s += W.C(u, u < 3.3 ? -1.12 : (u < 12.75 ? 3.9 : 3.45), 0.14, '#FFFFFF', ' stroke="' + A + '" stroke-width="0.05"'); }
    return s;
  },
  steps: [
    { t: 0, cam: [-10, 44], caption: 'Two networks reach the building by separate routes, one from the street and one from the rear lane, so one dig can’t cut the building off.' },
    { t: 6, cam: [0, 35], caption: 'Each cable comes in at its own entrance room and runs on to the meet-me room.' },
    { t: 12, cam: [10, 18], caption: 'In the meet-me room each network ends on its own patch panel. A short cross-connect cable links it to the data centre’s own panel.' },
    { t: 18, cam: [10, 31], caption: 'From the data centre’s panel, fibre runs in a yellow tray along the ceiling and drops into each rack’s top-of-rack switch.' },
    { t: 24, cam: [-10, 35], caption: 'Data travels along the fibre as pulses of light, from the street to the rack.' },
    { t: 30, cam: [-10, 44], caption: 'Each network keeps its own colour, so you can follow one network all the way to a client’s rack.' }
  ],
  labels: [
    { name: 'Network A in its duct (street)', at: [-6, -1.3], side: 'b', steps: [0] },
    { name: 'Network B in its duct (rear lane)', at: [38, -1.9], side: 'b', steps: [0] },
    { name: 'Entry point A', at: [3.3, 0], side: 't', steps: [0, 1] },
    { name: 'Entry point B', at: [31.7, 0], side: 't', steps: [0, 1] },
    { name: 'Entrance room A', at: [4, 4.8], side: 't', steps: [1] },
    { name: 'Entrance room B', at: [32, 4.8], side: 't', steps: [1] },
    { name: 'Meet-me room', at: [14.5, 4.8], side: 't', steps: [1, 5] },
    { name: 'Network A’s panel', at: [12.75, 0], side: 'b', steps: [2] },
    { name: 'Network B’s panel', at: [14.15, 0], side: 'b', steps: [2] },
    { name: 'Data centre’s panel', at: [15.75, 0], side: 'b', steps: [2, 3] },
    { name: 'Cross-connect', at: [14.2, 0.4], side: 't', steps: [2] },
    { name: 'Fibre tray (overhead)', at: [24, 3.52], side: 't', steps: [3, 5] },
    { name: 'Top-of-rack switch', at: [27.4, 2.1], side: 'b', steps: [3] },
    { name: 'Data as light', at: [8, 3.9], side: 't', steps: [4] }
  ]
};

  })();
  BD.anim.register('fibre', make(SCENE));
})();
