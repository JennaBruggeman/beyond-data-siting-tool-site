 
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




function walk(ts, pts) {
  if (ts <= pts[0][0]) return pts[0][1];
  for (var k = 1; k < pts.length; k++) if (ts <= pts[k][0]) return lerp(pts[k - 1][1], pts[k][1], (ts - pts[k - 1][0]) / (pts[k][0] - pts[k - 1][0]));
  return pts[pts.length - 1][1];
}
function personAt(i, ts) {          
  if (i <= 1) return 38;
  if (i === 2) return walk(ts, [[0, 38], [2.0, 33.8], [2.8, 33.8], [5.0, 29.6]]);
  if (i === 3) return walk(ts, [[0, 29.6], [1.0, 29.6], [1.6, 27.6], [3.0, 27.6], [3.6, 25.8], [4.0, 25.8], [5.4, 23.3]]);
  if (i === 4) return walk(ts, [[0, 23.3], [1.6, 20.92], [3.4, 20.92], [4.6, 19.3]]);
  if (i === 5) return walk(ts, [[0, 19.3], [5.4, 13.0]]);
  return 13.0;
}
function door(W, K, u, open) { return open ? W.B(u - 0.05, 0, 0.1, 2.1, '#FFFFFF', ' fill-opacity="0.5"') + W.B(u - 0.75, 0, 0.7, 0.06, K.GREY2) : W.B(u - 0.06, 0, 0.12, 2.1, '#6B5E4E'); }
return {
  numbered: true, toprows: 3, dur: 36, hmin: -0.9, hmax: 4.4,
  aria: 'One building cut through from one street to the other. On the left, a person walks from the public street through the public door straight into the public program; a red fire and security wall with no door separates it from the data centre. On the right, a person walks in from the other street, past bollards, through a sliding gate that opens for them, to a guard window where they show a badge, through a door into the lobby, into a glass tube that lets one person through at a time, and into the data hall, past shared cabinets, locked cabinets, a mesh cage and a high-security suite with solid walls and its own door.',
  key: ['fire'],
  base: function (W, EQ, K) {
    var s = W.B(-12, -0.9, 60, 0.9, K.EARTH);
    s += W.B(-12, -0.4, 11.7, 0.25, K.ROAD) + W.B(-0.3, -0.4, 0.3, 0.4, K.GREY2) + W.B(-0.3, -0.2, 0.3, 0.2, K.WALK);
    s += W.B(36.8, -0.4, 11.2, 0.25, K.ROAD) + W.B(36.5, -0.4, 0.3, 0.4, K.GREY2) + W.B(29.2, -0.2, 7.3, 0.2, '#D8D2C2');
    
    s += W.B(0, 0, 7, 3.6, '#FDE5D0') + W.B(7.3, 0, 21.7, 3.6, '#F4F6FA');
    s += W.B(-0.3, 3.6, 29.6, 0.3, K.CUT) + W.B(-0.3, -0.3, 29.6, 0.3, K.CUT) + W.B(-0.3, 2.1, 0.3, 1.5, K.CUT) + W.B(29.0, 2.1, 0.3, 1.5, K.CUT);
    s += W.B(7.0, 0, 0.3, 3.6, K.FIRE);
    s += W.B(1.2, 0, 1.8, 0.75, K.WOOD) + W.B(4.2, 0, 1.8, 0.75, K.WOOD) + W.fig(2.1, 0, 0) + W.fig(5.6, 0, 0);
    
    s += W.B(7.3, 0, 4.0, 3.6, '#E9ECF2') + W.B(11.3, 0, 0.25, 3.6, K.WALL); for (var q = 7.7; q < 10.9; q += 0.62) s += EQ.rack(q, 0);
    for (var r = 12.0; r < 14.4; r += 0.62) s += EQ.rack(r, 0);
    for (var c = 11.8; c <= 14.55; c += 0.3) s += W.B(c, 0, 0.03, 2.6, K.GREY2); s += W.B(11.8, 2.57, 2.78, 0.03, K.GREY2);
    for (var v = 14.9; v < 17.2; v += 0.62) s += W.B(v, 0, 0.6, 2.2, '#3E4656') + W.B(v + 0.45, 1.0, 0.06, 0.2, '#F5E7A0');
    for (var u = 17.5; u < 19.8; u += 0.62) s += EQ.rack(u, 0);
    
    s += W.B(20.05, 0, 0.15, 3.6, K.CUT) + W.B(21.65, 0, 0.15, 3.6, K.CUT) + W.B(20.2, 0, 1.45, 2.6, '#DCEBF5', ' rx="0.5" fill-opacity="0.9"') + W.B(20.2, 2.6, 1.45, 0.1, K.GREY2);
    s += W.B(25.5, 2.1, 0.2, 1.5, K.CUT) + W.B(26.4, 0.9, 1.4, 1.1, '#CFE8F7') + W.B(26.4, 0, 1.4, 0.9, '#8D94A3') + W.fig(27.1, 0, 0) + W.B(29.05, 1.0, 0.1, 0.2, K.GREY);
    
    s += W.B(30.0, 0, 0.08, 2.0, K.GREY2) + W.B(30.0, 1.95, 3.3, 0.05, K.GREY2);
    [34.3, 35.1].forEach(function (b) { s += W.B(b, 0, 0.2, 0.9, K.GREY) + W.B(b, 0.6, 0.2, 0.08, '#F5E7A0'); });
    return s;
  },
  dyn: function (W, EQ, K, t, i, ts) {
    var s = '', u = personAt(i, ts);
    var gateOpen = (i === 2 && u < 34.0 && u > 29.9), outer = (i === 2 && u < 30.5) || (i === 3 && ts < 1.0), d1 = (i === 3 && u < 26.2 && u > 25.0);
    s += W.B(30.2 - (gateOpen ? 2.8 : 0), 0, 2.9, 1.9, K.GREY2, ' fill-opacity="0.85"');
    for (var k = 0; k < 6; k++) s += W.B(30.4 - (gateOpen ? 2.8 : 0) + k * 0.45, 0.1, 0.04, 1.7, K.GREY);
    s += door(W, K, 29.15, outer) + door(W, K, 25.6, d1) + door(W, K, 11.4, false);
    var ang = i === 4 ? Math.min(1, Math.max(0, (ts - 3.0) / 1.6)) * Math.PI : 0;
    s += W.line([[20.92 - 0.6 * Math.cos(ang), 0.05], [20.92 + 0.6 * Math.cos(ang), 0.05]], K.GREY, 0.06) + W.B(20.87, 0, 0.1, 2.5, K.GREY2, ' fill-opacity="0.6"');
    if (i === 3) s += W.B(29.03, 1.0, 0.06, 0.2, ts > 0.5 ? '#9BE0A0' : K.GREY);
    if (i === 4) s += W.B(21.3, 1.3, 0.12, 0.2, ts > 2.0 ? '#9BE0A0' : K.GREY);
    s += W.fig(u, 0, i >= 2 && i <= 5 ? t * 7 : 0);
    var pu = i === 1 ? walk(ts, [[0, -5], [2.4, -0.8], [3.0, -0.8], [4.8, 3.2]]) : -5;
    s += W.B(-0.15, 0, 0.12, 2.1, '#6B5E4E', (i === 1 && pu > -1.4 && pu < 0.8) ? ' fill-opacity="0.2"' : '') + W.fig(pu, 0, i === 1 ? t * 7 : 0);
    return s;
  },
  steps: [
    { key: ['fire'], t: 0, cam: [-3, 39], caption: 'One building with two ways in. On the left, the public door. On the right, from the other street, the data centre’s way in, one barrier after another.' },
    { key: ['fire'], t: 6, cam: [-4, 13], caption: 'The public door leads straight into the public program. A fire and security wall with no door separates it from the data centre.' },
    { key: [], t: 12, cam: [24, 39], caption: 'From the street, bollards stop vehicles. The sliding gate opens only for someone expected, then closes behind them.' },
    { key: [], t: 18, cam: [19, 33], caption: 'At security check-in a guard checks the visitor’s ID through the window, and their badge opens the door to the lobby.' },
    { key: [], t: 24, cam: [15, 28], caption: 'The glass tube lets one person through at a time, after a badge and a biometric check.' },
    { key: ['fire'], t: 30, cam: [5, 23], caption: 'In the data hall, clients’ equipment sits in shared cabinets, locked cabinets, mesh cages, or a high-security suite with solid walls and its own door.' }
  ],
  labels: [
    { name: 'Public street', at: [-3, -0.15], side: 'b', steps: [0, 1] },
    { name: 'Public door', at: [-0.1, 2.1], side: 't', steps: [0, 1] },
    { name: 'Public program', at: [3.5, 3.9], side: 't', steps: [0, 1] },
    { name: 'Fire and security wall, no door', at: [7.15, 3.9], side: 't', steps: [0, 1, 5], col: '#C0262D', tcol: '#C0262D' },
    { name: 'High-security suite: solid walls, own door', at: [9.3, 3.9], side: 't', steps: [0, 5] },
    { name: 'Cage (mesh)', at: [13.2, 2.6], side: 't', steps: [5] },
    { name: 'Locked cabinets', at: [16.0, 2.2], side: 't', steps: [5] },
    { name: 'Shared cabinets', at: [18.6, 2.2], side: 't', steps: [5] },
    { name: 'Data hall', at: [15.5, 3.9], side: 't', steps: [0, 4] },
    { name: 'Glass tube: one person at a time, badge and biometric', at: [20.92, 2.7], side: 't', steps: [0, 4] },
    { name: 'Lobby', at: [23.6, 3.9], side: 't', steps: [0, 3, 4] },
    { name: 'Security check-in: guard window, checks ID', at: [27.1, 2.0], side: 't', steps: [0, 3] },
    { name: 'Badge reader: opens the door', at: [29.1, 1.2], side: 'b', steps: [3] },
    { name: 'Fence and sliding gate: opens for expected visitors', at: [31.6, 2.0], side: 't', steps: [0, 2] },
    { name: 'Bollards stop vehicles', at: [34.7, 0.9], side: 't', steps: [0, 2] },
    { name: 'Street (data-centre entrance)', at: [37.5, -0.15], side: 'b', steps: [0, 2] }
  ]
};

  })();
  BD.anim.register('security', make(SCENE));
})();
