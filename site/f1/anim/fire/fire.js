 
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
    var Z0 = 0.5;
    function build0() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 300);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.65));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.8); sun.position.set(-6, 18, 14); sun.castShadow = true;
      sun.shadow.mapSize.set(4096, 2048); var sc = sun.shadow.camera; sc.left = -14; sc.right = 34; sc.top = 12; sc.bottom = -6; sc.near = 1; sc.far = 60; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      scene.add(sun); scene.add(sun.target); sun.target.position.set(9, 0, 0);
      function flat(c, o) { var m = new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(c).convertSRGBToLinear() }, o || {})); mats.push(m); return m; }
      var cut = flat(0x3A3F47), earth = flat(0xB4BAC4), floorM = M({ color: 0xEEF1F7 }), backM = M({ color: 0xE3E8F0 });
      var D = 5, HH = 4.4, WC = 0x3F5F7A;
      B(60, 3.0, 0.3, 9, -3.0, Z0 - 0.06, earth).castShadow = false;
      function plate(x0, x1, y0, y1) { var me = B(x1 - x0, y1 - y0, 0.3, (x0 + x1) / 2, y0, Z0, cut); me.castShadow = false; return me; }
      function room(x0, x1) {
        B(x1 - x0, 0.02, D, (x0 + x1) / 2, 0, Z0 - D / 2, floorM).castShadow = false;
        B(x1 - x0, HH, 0.12, (x0 + x1) / 2, 0, Z0 - D, backM).castShadow = false;
        plate(x0 - 0.3, x1 + 0.3, HH, HH + 0.4); plate(x0 - 0.3, x0, 0, HH); plate(x1, x1 + 0.3, 0, HH); plate(x0 - 0.3, x1 + 0.3, -0.5, 0);
      }
      room(-5.2, -0.3); room(0, 22);
      
      for (var i = 0; i < 30; i++) { var r = kit.make('rack'); r.position.set(2.3 + i * 0.6, 0, Z0 - 2.2); scene.add(r); tag(r, 'racks'); }
      
      var wM = flat(WC), airM = flat(0xC3C9D3), zp = Z0 - 0.6;
      tag(tube([[-3.2, -2.4, zp], [-3.2, 0.9, zp]], 0.1, wM), 'valve');
      var valve = B(0.7, 0.9, 0.5, -3.2, 0.9, zp, M({ color: 0x5E6782 })); valve.userData.equip = true; tag(valve, 'valve');
      var mainPts = [[-3.2, 1.8, zp], [-3.2, 3.7, zp], [21.4, 3.7, zp]];
      parts.air = tube(mainPts, 0.08, airM); tag(parts.air, 'pipes');
      parts.wet = tube(mainPts, 0.1, wM); tag(parts.wet, 'pipes', 'valve');
      parts.wetN = parts.wet.mesh.geometry.index.count; parts.wet.mesh.geometry.setDrawRange(0, 0);
      
      parts.heads = []; var hg = new THREE.CylinderGeometry(0.09, 0.05, 0.12, 10); geos.push(hg);
      for (var x = 1.5; x <= 21; x += 3) {
        var a = B(0.05, 0.4, 0.05, x, 3.3, zp, airM); tag(a, 'pipes');
        var w = B(0.07, 0.4, 0.07, x, 3.3, zp, wM); w.visible = false; tag(w, 'pipes');
        var h = new THREE.Mesh(hg, M({ color: 0x8D8C87 })); h.position.set(x, 3.24, zp); h.userData.equip = true; scene.add(h); tag(h, 'heads');
        parts.heads.push({ x: x, w: w });
      }
      
      
      
      var spM = M({ color: 0x9AA2AF }); tag(B(21.2, 0.05, 0.05, 11.0, HH - 0.18, Z0 - 2.2, spM), 'det');
      for (var hx = 1.5; hx < 21.5; hx += 1.5) { var hp = B(0.03, 0.12, 0.03, hx, HH - 0.3, Z0 - 2.2, spM); tag(hp, 'det'); }
      tag(B(0.05, HH - 1.9, 0.05, 0.45, 1.7, Z0 - 2.2, spM), 'det');
      var unit = B(0.5, 0.6, 0.25, 0.45, 1.2, Z0 - 2.2, M({ color: 0x8D8C87 })); unit.userData.equip = true; tag(unit, 'det');
      parts.detOn = flat(DCB); var ring = B(0.14, 0.14, 0.05, 0.45, 1.6, Z0 - 2.05, parts.detOn); ring.visible = false; tag(ring, 'det'); parts.ring = ring;
      
      var sg2 = new THREE.SphereGeometry(0.05, 8, 6); geos.push(sg2); parts.sample = [];
      for (var si = 0; si < 10; si++) { var sm2 = new THREE.Mesh(sg2, flat(0x6E6E6B)); sm2.visible = false; scene.add(sm2); tag(sm2, 'det'); parts.sample.push({ m: sm2, u: si / 10 }); }
      
      var FX = 14.9; parts.FX = FX;
      var pg = new THREE.SphereGeometry(0.35, 12, 8); geos.push(pg);
      parts.smoke = []; for (i = 0; i < 8; i++) { var sm = new THREE.MeshBasicMaterial({ color: 0x6E6E6B, transparent: true, opacity: 0 }); mats.push(sm); var s = new THREE.Mesh(pg, sm); scene.add(s); tag(s, 'fire'); parts.smoke.push(s); }
      var ag = new THREE.ConeGeometry(0.08, 0.26, 10); geos.push(ag); var aM = flat(HEAT);
      parts.heat = []; for (i = 0; i < 5; i++) { var hh = new THREE.Mesh(ag, aM); hh.visible = false; scene.add(hh); tag(hh, 'fire'); parts.heat.push({ m: hh, x: FX - 0.4 + i * 0.2, u: (i * 0.31) % 1 }); }
      
      var sg = new THREE.SphereGeometry(0.045, 6, 5); geos.push(sg);
      parts.spray = []; for (i = 0; i < 40; i++) { var sp = new THREE.Mesh(sg, wM); sp.visible = false; scene.add(sp); tag(sp, 'fire'); parts.spray.push({ m: sp, a: (i * 2.399) % (Math.PI * 2), r: 0.2 + (i % 7) * 0.12, u: (i * 0.137) % 1 }); }
      
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

      parts.tech = person(-1.8, Z0 - 0.4, 'stand', Math.PI / 2);
      person(5.0, Z0 - 0.6, 'walk', Math.PI / 2);
    }

    function pchip(K, t, c) {
      var n = K.length, i, d = [], m = [];
      if (t <= K[0][0]) return K[0][c]; if (t >= K[n - 1][0]) return K[n - 1][c];
      for (i = 0; i < n - 1; i++) d.push((K[i + 1][c] - K[i][c]) / (K[i + 1][0] - K[i][0]));
      m[0] = 0; m[n - 1] = 0; for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
      for (i = 0; i < n - 2; i++) if (t <= K[i + 1][0]) break;
      var h = K[i + 1][0] - K[i][0], s = (t - K[i][0]) / h, s2 = s * s, s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * K[i][c] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * K[i + 1][c] + (s3 - s2) * h * m[i + 1];
    }
    var CK = [[0, 8.5, 2.3, 26], [2.2, 8.5, 2.3, 24], [3.8, 8.0, 2.4, 21], [5.6, 8.0, 2.4, 21], [6.6, 4.0, 2.3, 19], [7.8, 4.0, 2.3, 19], [8.8, 13.8, 2.5, 13], [10.6, 13.8, 2.5, 13], [11.6, 8.5, 2.3, 27], [12, 8.5, 2.3, 27]];

    function at0(t) {
      tNow = t;
      var end = reduced || t >= D0 - 0.05; if (end) t = D0;
      var x = pchip(CK, t, 1), y = pchip(CK, t, 2), z = pchip(CK, t, 3);
      camera.position.set(x, y + 0.4, z); camera.lookAt(x, y - 0.2, 0);
      var FX = parts.FX, fire = end ? 1 : clamp((t - 3.8) / 0.6);
      parts.smoke.forEach(function (s, i) { if (fire <= 0) { s.material.opacity = 0; return; } var c = end ? i / 8 : ((t * 0.35 + i / 8) % 1); s.position.set(FX + Math.sin(i * 1.7) * 0.3 + c * 0.8, 2.1 + c * 2.0, Z0 - 2.0); s.scale.setScalar(0.6 + c * 1.6); s.material.opacity = 0.5 * fire * (1 - c * 0.7); });
      parts.heat.forEach(function (a) { a.m.visible = fire > 0; var c = end ? a.u : (a.u + t * 0.5) % 1; a.m.position.set(a.x, 2.15 + c * 1.0, Z0 - 1.4); });
      var det = end || t >= 4.5; parts.ring.visible = det && (end || Math.floor(t * 4) % 2 === 0);
      parts.sample.forEach(function (s) { var on = !end && t >= 4.0 && t < 6.6; s.m.visible = on; if (!on) return; var c = (s.u + t * 0.5) % 1;
        var px = lerp(FX, 0.45, Math.min(1, c * 1.25)); s.m.position.set(px, c > 0.8 ? lerp(4.22, 1.7, (c - 0.8) / 0.2) : 4.22, Z0 - 2.2); });
      
      var fill = end ? 1 : clamp((t - 6.9) / 2.0), n = parts.wetN;
      parts.wet.mesh.geometry.setDrawRange(0, Math.floor(fill * n / 6) * 6);
      parts.heads.forEach(function (h) { h.w.visible = fill > 0 && (h.x + 3.2) / 24.6 <= fill * 1.02; });
      
      var open = end || t >= 8.5;
      parts.spray.forEach(function (s) { s.m.visible = open; if (!open) return; var c = end ? s.u : (s.u + t * 0.9) % 1; s.m.position.set(FX + 0.1 + Math.cos(s.a) * s.r * (0.3 + c), 3.18 - c * 1.05, Z0 - 1.4 + Math.sin(s.a) * s.r * 0.4); });
      parts.tech.position.x = -1.8;
      
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
      STEPS = [{"t": 0, "caption": "The data hall has sprinklers, but the pipes hold air, not water."}, {"t": 4.6, "caption": "So a broken pipe or a knocked head can't spray the servers."}, {"t": 9, "caption": "If a rack catches fire, air-sampling detectors sense the smoke early."}, {"t": 13.4, "caption": "Water is let into the pipes only when a detector and a sprinkler head have both gone off."}, {"t": 17.6, "caption": "Only the head heated by the fire sprays; the others stay shut."}]; FOCUS = [["pipes", "heads"], ["pipes", "heads", "racks"], ["det", "fire"], ["valve", "pipes", "heads", "det"], "*"];
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
  BD.anim.register('fire', make());
})();
