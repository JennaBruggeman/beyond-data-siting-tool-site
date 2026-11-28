 
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



var RACKS = []; for (var x = 1.0; x + 0.6 <= 9.6; x += 0.62) RACKS.push(x);
return {
  toprows: 3, dur: 36, hmin: -2.8, hmax: 6.6,
  aria: 'A section from the data hall through the heat-recovery room to the pool hall: warm water from the in-row coolers runs in a violet pipe to a plate heat exchanger and a heat pump, the pool heating loop carries the heat on to the pool inlet, cooled water returns to the hall in a blue pipe, and warmth rises off the pool water around the swimmers.',
  key: ['reuse', 'cooled', 'fire'],
  base: function (W, EQ, K) {
    var s = W.B(-4, -6, 50, 6, K.EARTH);
    s += W.B(0, 0, 40, 5.4, '#F4F6FA') + W.B(-0.3, -0.35, 40.6, 0.35, K.CUT) + W.B(-0.3, 5.4, 40.6, 0.35, K.CUT) + W.B(-0.3, 0, 0.3, 5.4, K.CUT) + W.B(40, 0, 0.3, 5.4, K.CUT);
    s += W.B(13.88, 0, 0.25, 5.4, K.FIRE) + W.B(20.0, 0, 0.2, 5.4, K.WALL);
    RACKS.forEach(function (u, k) { s += k % 4 === 3 ? EQ.cooler(u, 0) : EQ.rack(u, 0); });
    s += W.B(10.4, 0, 1.6, 2.0, '#4F5F7A') + W.B(10.6, 1.4, 0.5, 0.3, '#CFE8F7');                         
    
    s += W.B(14.8, 0, 1.3, 2.4, '#8C9DBD'); for (var k = 0; k < 8; k++) s += W.B(14.92 + k * 0.14, 0.15, 0.06, 2.1, '#FFFFFF', ' fill-opacity="0.7"');
    s += W.B(16.9, 0, 2.4, 1.9, '#7B6CC0') + W.B(17.1, 1.3, 0.6, 0.35, '#CFE8F7') + W.C(18.6, 0.9, 0.45, '#5E50A6');
    
    s += W.B(20.2, 0, 19.8, 5.4, '#EAF2F8');
    s += W.B(20.2, -0.35, 3.0, 0.35, K.CUT) + W.B(37.0, -0.35, 3.0, 0.35, K.CUT);
    s += W.B(22.9, -2.3, 0.3, 2.3, K.CUT) + W.B(37.0, -2.3, 0.3, 2.3, K.CUT) + W.B(22.9, -2.6, 14.4, 0.3, K.CUT);
    s += W.B(23.2, -2.3, 13.8, 2.15, K.POOL) + W.B(23.2, -0.25, 13.8, 0.1, '#FFFFFF', ' fill-opacity="0.5"');
    s += W.B(20.4, 0, 2.5, 0.05, '#D9D3C7') + W.B(37.3, 0, 2.5, 0.05, '#D9D3C7');
    s += W.fig(6.5, 0, 0) + W.fig(21.4, 0, 0) + W.fig(38.5, 0, 0);
    return s;
  },
  dyn: function (W, EQ, K, t, i) {
    var s = '';
    
    s += W.pipe([[2.9, 2.2], [2.9, 3.9], [11.2, 3.9], [11.2, 2.0]], K.REUSE, t, i >= 1);
    s += W.pipe([[11.6, 2.0], [11.6, 4.4], [15.2, 4.4], [15.2, 2.4]], K.REUSE, t, i >= 1);
    s += W.pipe([[15.7, 2.4], [15.7, 3.3], [13.0, 3.3], [13.0, 1.6], [12.0, 1.6]], K.CHILLED, t, i >= 2);
    
    s += W.pipe([[16.1, 1.6], [16.9, 1.6]], K.REUSE, t, i >= 2);
    s += W.pipe([[19.3, 1.4], [19.7, 1.4], [19.7, -1.2], [23.2, -1.2]], K.REUSE, t, i >= 3);
    s += W.pipe([[23.2, -1.9], [19.4, -1.9], [19.4, 0.4], [19.3, 0.4]], K.CHILLED, t, i >= 3);
    
    [25.5, 28.5, 31.5, 34.5].forEach(function (u, k) { var x = u + Math.sin(t * 0.6 + k) * 0.6; s += W.B(x - 0.25, -0.3, 0.5, 0.35, '#FFFFFF') + W.C(x, 0.2, 0.16, '#FFFFFF'); });
    s += W.line([[23.2, -0.15], [24.5, -0.1], [26, -0.17], [27.5, -0.1], [29, -0.17], [30.5, -0.1], [32, -0.17], [33.5, -0.1], [35, -0.17], [37, -0.12]], '#FFFFFF', 0.05, ' stroke-opacity="0.8"');
    if (i >= 4) for (var w = 0; w < 6; w++) { var x0 = 24.5 + w * 2.2, d = []; for (var k2 = 0; k2 <= 8; k2++) d.push([x0 + 0.2 * Math.sin(k2 * 1.3 + t * 2 + w), 0.05 + k2 * 0.3]); s += W.line(d, K.REUSE, 0.05, ' stroke-linecap="round" opacity="0.8"'); }
    return s;
  },
  steps: [
    { key: ["reuse", "cooled", "fire"], t: 0, cam: [-1, 41], caption: 'Three rooms in a row: the data hall, the heat-recovery room, and the pool hall next door.' },
    { key: ["reuse", "cooled", "fire"], t: 6, cam: [-1, 21], caption: 'In the hall, the in-row coolers pick up the servers’ heat in water. A coolant distribution unit sends that warm water out of the hall.' },
    { key: ["reuse", "cooled", "fire"], t: 12, cam: [9, 21], caption: 'In the heat-recovery room, a plate heat exchanger passes the heat to another loop of water without mixing the two. A heat pump raises its temperature. The cooled water goes back to the hall.' },
    { key: ["reuse", "cooled", "fire"], t: 18, cam: [12, 41], caption: 'The pool’s own heating loop carries the heat to the pool inlet.' },
    { key: ["reuse", "cooled"], t: 24, cam: [19, 41], caption: 'The pool water stays warm. This pool centre uses about 455 to 663 MWh of heat a year.' },
    { key: ["reuse", "cooled", "fire"], t: 30, cam: [-1, 41], caption: 'The whole path: heat from the servers, through the heat-recovery room, into the pool, and cooled water back to the hall.' }
  ],
  labels: [
    { name: 'Data hall', at: [5, 0], side: 'b', steps: [0] },
    { name: 'Heat-recovery room', at: [17, 0], side: 'b', steps: [0] },
    { name: 'Pool hall', at: [30, -2.6], side: 'b', steps: [0] },
    { name: '2 h fire separation', at: [14, 5.75], side: 't', steps: [0], col: '#C0262D', tcol: '#C0262D' },
    { name: 'In-row coolers pick up the heat', at: [2.9, 2.2], side: 'b', steps: [1] },
    { name: 'Coolant distribution unit', at: [11.2, 0], side: 'b', steps: [1] },
    { name: 'Warm water out of the data hall: about 18 °C', at: [8, 3.9], side: 't', steps: [1, 5] },
    { name: 'Plate heat exchanger: passes the heat on without mixing the two', at: [15.4, 0], side: 'b', steps: [2, 5] },
    { name: 'Heat-recovery room', at: [17, 5.75], side: 't', steps: [3, 5] },
    { name: 'Heat pump: raises it to about 70 °C (maker figure)', at: [18.1, 1.9], side: 't', steps: [2] },
    { name: 'Heat pump', at: [18.1, 1.9], side: 't', steps: [3, 4, 5] },
    { name: 'Cooled water back to the hall', at: [13.0, 2.4], side: 't', steps: [2, 5] },
    { name: 'The pool’s heating loop', at: [21.5, -1.2], side: 'b', steps: [3] },
    { name: 'Pool inlet', at: [23.2, -1.2], side: 't', steps: [3] },
    { name: 'Cooled pool loop back', at: [21.0, -1.9], side: 'b', steps: [3] },
    { name: 'Pool deck', at: [38.6, 0], side: 'b', steps: [4] },
    { name: 'Water surface', at: [33, -0.12], side: 'b', steps: [4] },
    { name: 'Warm pool water', at: [27, 2.3], side: 't', steps: [4, 5] }
  ]
};

  })();
  BD.anim.register('heatcap', make(SCENE));
})();
