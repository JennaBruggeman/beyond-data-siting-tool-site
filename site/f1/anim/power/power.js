 
(function () {
  'use strict';
  var BD = window.BD = window.BD || {};
  var DUR = 24, HEAT = 0x7A4FE0, DCB = 0x3D5185, INKC = 0x1E2A47;
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }

  function make() {
    var THREE, kit, tok, el, renderer, scene, camera, raf = 0, t0 = 0, playing = false, tNow = 0, reduced = false;
    var mats = [], geos = [], labels = [], parts = {}, figs = [], figMat = null;
    var W = 1200, H = 675;

    function M(o) { var m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.95, metalness: 0, flatShading: true }, o)); mats.push(m); return m; }
    function B(L, h, w, x, y, z, m) { var g = new THREE.BoxGeometry(L, h, w); geos.push(g); var me = new THREE.Mesh(g, m); me.position.set(x, y + h / 2, z); me.castShadow = me.receiveShadow = true; scene.add(me); return me; }
    function tube(pts, r, m) {
      var c = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }), false, 'catmullrom', 0.01);
      var g = new THREE.TubeGeometry(c, 64, r, 8, false); geos.push(g); var me = new THREE.Mesh(g, m); me.castShadow = true; scene.add(me); return { mesh: me, curve: c };
    }
    function label(text, at, cls) {
      var d = document.createElement('div'); d.textContent = text;
      d.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%);white-space:nowrap;pointer-events:none;' +
        'font:600 14px var(--bd-font, "IBM Plex Sans", sans-serif);color:' + (tok.ink || '#1E2A47') + ';opacity:0;transition:none;' +
        'background:rgba(255,255,255,.86);padding:2px 6px;border-radius:3px;' + (cls || '');
      el.appendChild(d); var L = { d: d, at: new THREE.Vector3(at[0], at[1], at[2]), show: 0 }; labels.push(L); return L;
    }

    
    
    var D0 = 12, STEPS = [], FOCUS = [], stepNow = -1, onStepCb = null, BG = 0xD9DEE6, skipDraw = false;
    label = function () { return { show: 0, d: { remove: function () {} } }; };      
    function tag(o) { var a = Array.prototype.slice.call(arguments, 1); o = o && o.mesh ? o.mesh : o; o.userData.tags = (o.userData.tags || []).concat(a); return o; }
    function toneInto(o, src) {
      var m = src.clone(); mats.push(m);
      var cc = m.color.clone().convertLinearToSRGB(), chroma = Math.max(cc.r, cc.g, cc.b) - Math.min(cc.r, cc.g, cc.b);
      if (m.isMeshStandardMaterial && chroma < 0.12) {
        var c = m.color.clone().convertLinearToSRGB(), L = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
        var gp = o.geometry && o.geometry.parameters, ground = gp && gp.height !== undefined && gp.height <= 0.05 && (gp.width > 6 || gp.depth > 6);
        var g = o.userData.isEquip ? 0.26 + 0.24 * L : ground ? 0.6 + 0.08 * L : 0.64 + 0.22 * L;          
        m.color.setRGB(g * 0.97, g * 0.985, g * 1.03).convertSRGBToLinear();
      } else if (m.isLineBasicMaterial && chroma < 0.12) { m.color.set(0x2F3640); m.opacity = 0.85; }
      return { m: m, base: m.color.clone() };
    }
    function adopt(o, src) {
      var cache = o.userData.cache || (o.userData.cache = {}), c = cache[src.uuid] || (cache[src.uuid] = toneInto(o, src));
      o.material = c.m; o.userData.mat = c.m; o.userData.src = src; o.userData.base = c.base; o.userData.srcOp = src.opacity;
    }
    function stageTone() {
      scene.background = new THREE.Color(BG);
      scene.traverse(function (o) {
        if (o.isHemisphereLight) o.intensity = 0.42;
        if (o.isDirectionalLight) { o.intensity = 0.95; if (o.shadow) o.shadow.radius = 2; }
      });
      var figKids = new Set(); figs.forEach(function (f) { f.traverse(function (k) { figKids.add(k); }); });
      scene.traverse(function (o) {
        if (!o.material || Array.isArray(o.material) || figKids.has(o) || o.material === figMat) return;
        var tags = [], equip = false, p = o;
        while (p) { if (p.userData) { if (p.userData.tags) tags = tags.concat(p.userData.tags); if (p.userData.equip) equip = true; } p = p.parent; }
        o.userData.dimTags = tags; o.userData.isEquip = equip;
        adopt(o, o.material);
      });
      scene.userData.bg = new THREE.Color(BG).convertSRGBToLinear();
    }
    function stepAt(T) { var i = 0; for (var k = 0; k < STEPS.length; k++) if (T >= STEPS[k].t) i = k; return i; }
    function dimFor(tags, f) { if (!tags.length || f === '*') return 0; for (var i = 0; i < tags.length; i++) if (f.indexOf(tags[i]) >= 0) return 0; return 1; }
    function stageDim(T) {
      var i = stepAt(T), f = FOCUS[i] || '*', fp = i > 0 ? (FOCUS[i - 1] || '*') : f, w = ease((T - STEPS[i].t) / 0.6), bg = scene.userData.bg;
      scene.traverse(function (o) {
        if (!o.userData.mat) return;
        if (o.material !== o.userData.mat) adopt(o, o.material);                   
        var src = o.userData.src; if (src.opacity !== o.userData.srcOp) { o.material.opacity = o.userData.srcOp = src.opacity; }
        var d = lerp(dimFor(o.userData.dimTags, fp), dimFor(o.userData.dimTags, f), w) * 0.72;
        o.material.color.copy(o.userData.base).lerp(bg, d);
      });
      if (i !== stepNow) { stepNow = i; if (onStepCb) try { onStepCb(i, STEPS[i]); } catch (e) {} }
    }
    function build0() {
      scene = new THREE.Scene(); scene.background = new THREE.Color(0xF4F6FA);
      camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 200);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.65));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.7); sun.position.set(-8, 16, 14); sun.castShadow = true;
      sun.shadow.mapSize.set(4096, 2048); var sc = sun.shadow.camera; sc.left = -20; sc.right = 50; sc.top = 14; sc.bottom = -8; sc.near = 1; sc.far = 60; sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      scene.add(sun); scene.add(sun.target); sun.target.position.set(14, 0, 0);
      function flat(c) { var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c).convertSRGBToLinear() }); mats.push(m); return m; }
      var cut = flat(0x3A3F47), earth = flat(0xB4BAC4), road = flat(0x5E6066), walk = flat(0xDADDE2);
      var floorM = M({ color: 0xEEF1F7 }), backM = M({ color: 0xE3E8F0 }), yardM = M({ color: 0xE6EBF3 });
      var Z0 = 0.5, D = 5;
      function plate(x0, x1, y0, y1, m, dz) { var me = B(x1 - x0, y1 - y0, 0.3, (x0 + x1) / 2, y0, Z0 + (dz || 0), m); me.castShadow = false; return me; }
      B(80, 3.2, 0.3, 14, -3.2, Z0 - 0.06, earth).castShadow = false;
      plate(-20, -9, -0.05, 0.0, road); plate(-9, -5, -0.04, 0.12, walk);
      for (var dsh = 0; dsh < 4; dsh++) plate(-19 + dsh * 2.6, -17.8 + dsh * 2.6, 0.0, 0.03, flat(0xFFFFFF), 0.02);
      B(10, 0.02, D, 0, 0, Z0 - D / 2, yardM).castShadow = false;                              
      function room(x0, x1, h) {
        B(x1 - x0, 0.02, D, (x0 + x1) / 2, 0, Z0 - D / 2, floorM).castShadow = false;
        B(x1 - x0, h, 0.12, (x0 + x1) / 2, 0, Z0 - D, backM).castShadow = false;
        plate(x0 - 0.3, x1 + 0.3, h, h + 0.4, cut, 0.01); plate(x0 - 0.3, x0, 0, h, cut, 0.01); plate(x1, x1 + 0.3, 0, h, cut, 0.01); plate(x0 - 0.3, x1 + 0.3, -0.5, 0, cut, 0.01);
      }
      room(5, 22, 4.4); room(22.3, 36, 4.6);
      
      tag(plate(-8.2, -5.8, -1.8, -0.6, flat(0x8C9DBD), 0.02), 'feed');
      var tx = kit.make('transformer', { kva: 2500 }); tx.position.set(1.0, 0, Z0 - 1.8); scene.add(tx); tag(tx, 'tx');
      var sw = kit.make('switchgear', { n: 6 }); sw.position.set(9.6, 0, Z0 - 1.6); scene.add(sw); tag(sw, 'sw');
      var ups = kit.make('ups'); ups.position.set(15.0, 0, Z0 - 1.4); scene.add(ups); tag(ups, 'ups');
      for (var i = 0; i < 4; i++) { var bt = kit.make('battery'); bt.position.set(18.2 + i * 0.62, 0, Z0 - 1.4); scene.add(bt); tag(bt, 'ups'); }
      for (i = 0; i < 12; i++) { var r = kit.make('rack'); r.position.set(25.0 + i * 0.6, 0, Z0 - 2.2); scene.add(r); tag(r, 'racks'); }
      tag(B(9.5, 0.14, 0.22, 28.3, 2.75, Z0 - 2.2, M({ color: 0xB9C5DA })), 'racks');                          
      
      var pw = flat(DCB), zp = Z0 + 0.2;
      parts.segs = [
        tube([[-7.0, -1.2, zp], [-7.0, -0.9, zp], [-1.0, -0.9, zp], [-0.2, -0.9, zp], [-0.2, 0.3, zp]], 0.08, pw),     
        tube([[2.2, 0.3, zp], [2.2, -0.8, zp], [7.4, -0.8, zp], [7.4, 0.2, zp]], 0.1, pw),                              
        tube([[11.8, 2.4, zp], [11.8, 3.2, zp], [14.0, 3.2, zp], [14.0, 2.0, zp]], 0.1, pw),                              
        tube([[16.8, 1.0, zp], [17.8, 1.0, zp]], 0.07, pw),                                                                
        tube([[16.2, 2.0, zp], [16.2, 3.5, zp], [23.5, 3.5, zp], [23.5, 2.9, Z0 - 2.2], [33.0, 2.9, Z0 - 2.2]], 0.1, pw)  
      ];
      parts.segOn = [0.6, 3.0, 5.4, 6.4, 7.6]; ['feed', 'tx', 'sw', 'ups', 'racks'].forEach(function (k, i) { tag(parts.segs[i], k); });
      parts.segs.forEach(function (s) { s.mesh.visible = false; });
      var dg = new THREE.SphereGeometry(0.12, 10, 8); geos.push(dg); var dM = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); mats.push(dM);
      parts.dots = [];
      parts.segs.forEach(function (s, si) { var n = si === 3 ? 1 : 4; for (var k = 0; k < n; k++) { var m = new THREE.Mesh(dg, dM); m.visible = false; scene.add(m); tag(m, ['feed', 'tx', 'sw', 'ups', 'racks'][si]); parts.dots.push({ m: m, s: si, u: k / n }); } });
      
      parts.drops = []; for (i = 0; i < 12; i += 2) { var dr = B(0.05, 0.75, 0.05, 25.0 + i * 0.6, 2.0, Z0 - 2.2, pw); dr.visible = false; tag(dr, 'racks'); parts.drops.push(dr); }
      
      function person(x, z, pose, ry) {
        pose = pose || 'stand';
        var wm = figMat || (figMat = M({ color: 0xF4F5F7 }));
        function bx(w, h, d, px, py, pz, parent) { var gg = new THREE.BoxGeometry(w, h, d); geos.push(gg); var m = new THREE.Mesh(gg, wm); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
        var g = new THREE.Group(), legs = [], arms = [];
        [-0.1, 0.1].forEach(function (sx) { var p = new THREE.Group(); p.position.set(sx, 0.86, 0); bx(0.15, 0.86, 0.17, 0, -0.43, 0, p); g.add(p); legs.push(p); });
        bx(0.44, 0.6, 0.24, 0, 1.16, 0, g);
        [-0.29, 0.29].forEach(function (sx) { var p = new THREE.Group(); p.position.set(sx, 1.43, 0); bx(0.11, 0.62, 0.13, 0, -0.31, 0, p); g.add(p); arms.push(p); });
        var hgeo = new THREE.SphereGeometry(0.13, 14, 10); geos.push(hgeo); var hd = new THREE.Mesh(hgeo, wm); hd.position.y = 1.62; hd.castShadow = true; g.add(hd);
        if (pose === 'carry') { arms.forEach(function (a) { a.rotation.x = -1.2; }); var bxg = new THREE.BoxGeometry(0.48, 0.09, 0.5); geos.push(bxg); var cm = new THREE.Mesh(bxg, M({ color: 0x5E6782 })); cm.position.set(0, 1.12, 0.5); cm.castShadow = true; g.add(cm); }
        if (pose === 'point') { arms[1].rotation.x = -1.45; }
        g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g);
        g.userData = { pose: pose, legs: legs, arms: arms, last: null };
        figs.push(g); return g;
      }

      person(-6.3, Z0 + 0.6, 'walk', Math.PI / 2);
      person(12.6, Z0 - 0.2, 'point', Math.PI);
      parts.tech = person(26.5, Z0 - 0.4, 'walk', Math.PI / 2);
      parts.L = {
        feed: label('Grid feed from the street: [n] kV', [-6.5, 1.6, zp]),
        tx: label('Transformer, 2,500 kVA: steps it down to [n] V', [1.0, 2.7, zp]),
        sw: label('Switchgear: splits the power and protects each circuit', [9.6, 3.9, zp]),
        ups: label('UPS and batteries: the racks stay on if the grid drops', [16.4, 4.25, zp]),
        bus: label('Busway to the racks: [n] kW per rack', [29.0, 3.85, zp])
      };
      parts.track = [[0, -4.0], [2.4, -2.0], [4.4, 5.0], [6.2, 12.5], [8.2, 18.0], [10.4, 27.0], [12, 27.0]];
    }

    function camX(t) {
      var K = parts.track;
      
      var n = K.length, i, d = [], m = [];
      if (t <= K[0][0]) return K[0][1]; if (t >= K[n - 1][0]) return K[n - 1][1];
      for (i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
      m[0] = 0; m[n - 1] = 0; for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
      for (i = 0; i < n - 2; i++) if (t <= K[i + 1][0]) break;
      var h = K[i + 1][0] - K[i][0], s = (t - K[i][0]) / h, s2 = s * s, s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * K[i][1] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * K[i + 1][1] + (s3 - s2) * h * m[i + 1];
    }
    function at0(t) {
      tNow = t;
      var end = reduced || t >= D0 - 0.05; if (end) t = D0;
      var x = camX(t); camera.position.set(x, 2.1, 16); camera.lookAt(x, 1.3, 0);
      parts.segs.forEach(function (s, i) { s.mesh.visible = t >= parts.segOn[i]; });
      parts.dots.forEach(function (d) { var on = t >= parts.segOn[d.s]; d.m.visible = on; if (on) d.m.position.copy(parts.segs[d.s].curve.getPointAt(end ? d.u : (d.u + (t - parts.segOn[d.s]) * 0.35) % 1)); });
      parts.drops.forEach(function (dr) { dr.visible = t >= 8.6; });
      parts.tech.position.x = lerp(26.5, 31.0, end ? 1 : clamp((t - 8.5) / 3.5));
      var L = parts.L;
      L.feed.show = t < 3.0 ? 1 : 0;
      L.tx.show = t >= 2.0 && t < 5.0 ? 1 : 0;
      L.sw.show = t >= 4.6 && t < 7.2 ? 1 : 0;
      L.ups.show = t >= 6.8 && t < 9.6 ? 1 : 0;
      L.bus.show = t >= 9.4 ? 1 : 0;
      
      figs.forEach(function (f) {
        var u = f.userData, p = f.position, moved = u.last && (Math.abs(p.x - u.last.x) + Math.abs(p.z - u.last.z)) > 1e-4;
        if (moved) f.rotation.y = Math.atan2(p.x - u.last.x, p.z - u.last.z);
        var sw = (u.pose === 'walk' && moved && !(reduced || t >= D0 - 0.05)) ? Math.sin(t * 7.5) * 0.45 : 0;
        u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw;
        if (u.pose === 'walk' || u.pose === 'stand') { u.arms[0].rotation.x = -sw * 0.8; u.arms[1].rotation.x = sw * 0.8; }
        u.last = p.clone();
      });
      draw();
    }


    function build() {
      var km = kit.make; kit.make = function (n, o) { var g = km.call(kit, n, o); g.userData.equip = true; return g; };
      try { build0(); } finally { kit.make = km; }
      STEPS = [{"t": 0, "caption": "Power comes in from the grid."}, {"t": 4.4, "caption": "The transformer steps the voltage down for the building."}, {"t": 9, "caption": "Switchgear splits the power and protects each circuit."}, {"t": 13, "caption": "The UPS and its batteries keep the racks on if the grid drops."}, {"t": 17, "caption": "Power runs overhead to each rack."}]; FOCUS = [["feed"], ["feed", "tx"], ["tx", "sw"], ["sw", "ups"], ["ups", "racks"]];
      stageTone();
    }
    function at(T) {
      T = +T || 0; if (T < 0) T = 0;                                                    
      var e = reduced || T >= DUR - 0.05; if (e) T = DUR;
      skipDraw = true; try { at0(e ? D0 : T * D0 / DUR); } finally { skipDraw = false; }
      stageDim(T); draw(); tNow = T;
    }
    function draw() {
      if (skipDraw) return;
      renderer.render(scene, camera);
      var r = el.getBoundingClientRect(), sx = r.width / W, v = new THREE.Vector3();
      labels.forEach(function (L) {
        v.copy(L.at).project(camera);
        L.d.style.left = ((v.x + 1) / 2 * r.width) + 'px'; L.d.style.top = ((1 - v.y) / 2 * r.height) + 'px';
        L.d.style.opacity = L.show; L.d.style.fontSize = Math.max(12, 14 * Math.min(1, sx * 1.15)) + 'px';
      });
    }
    function loop(ts) {
      if (!playing) return;
      var t = (ts - t0) / 1000;
      if (t >= DUR) { at(DUR); playing = false; return; }
      at(t); raf = requestAnimationFrame(loop);
    }
    return {
      mount: function (host, ctx) {
        THREE = ctx.THREE; kit = ctx.kit; tok = ctx.tokens || {}; reduced = !!ctx.reduced; el = host;
        el.style.position = 'relative'; el.style.overflow = 'hidden'; onStepCb = ctx.onStep || null; stepNow = -1;
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        var w = el.clientWidth || W; renderer.setSize(w, w * H / W);
        renderer.domElement.style.width = '100%'; renderer.domElement.style.height = 'auto'; renderer.domElement.style.display = 'block';
        el.appendChild(renderer.domElement);
        build(); at(reduced ? DUR : 0);
      },
      play: function () { if (reduced) { at(DUR); return; } if (playing) return; playing = true; t0 = performance.now() - tNow * 1000; if (tNow >= DUR) t0 = performance.now(); raf = requestAnimationFrame(loop); },
      replay: function () { this.stop(); tNow = 0; at(0); this.play(); },
      stop: function () { playing = false; cancelAnimationFrame(raf); },
      seek: function (t) { at(t); },
      steps: function () { return STEPS.map(function (s) { return { t: s.t, caption: s.caption }; }); },
      destroy: function () {
        this.stop(); labels.forEach(function (L) { L.d.remove(); });
        scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
        geos.forEach(function (g) { g.dispose(); }); mats.forEach(function (m) { m.dispose(); });
        renderer.dispose(); renderer.domElement.remove();
      }
    };
  }
  BD.anim = BD.anim || { _reg: {}, register: function (n, f) { this._reg[n] = f; } };
  BD.anim.register('power', make());
})();
