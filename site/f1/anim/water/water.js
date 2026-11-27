 
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
    var Z0 = 0.6;
    function build0() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 300);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.65));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.8); sun.position.set(-8, 20, 14); sun.castShadow = true;
      sun.shadow.mapSize.set(4096, 2048); var sc = sun.shadow.camera; sc.left = -22; sc.right = 50; sc.top = 14; sc.bottom = -8; sc.near = 1; sc.far = 70; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      scene.add(sun); scene.add(sun.target); sun.target.position.set(14, 0, 0);
      function flat(c, o) { var m = new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(c).convertSRGBToLinear() }, o || {})); mats.push(m); return m; }
      var cut = flat(0x3A3F47), earth = flat(0xB4BAC4), road = flat(0x5E6066), yardM = M({ color: 0xE6EBF3 });
      var WC = 0x3F5F7A, zp = Z0 + 0.2;
      B(90, 3.0, 0.3, 14, -3.0, Z0 - 0.06, earth).castShadow = false;
      B(16, 0.05, 0.3, -12, -0.05, Z0, road).castShadow = false;                                   
      B(56, 0.02, 9, 21, 0, Z0 - 4.5, yardM).castShadow = false;                                   
      
      var cg = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 24); geos.push(cg);
      var mainC = new THREE.Mesh(cg, flat(WC)); mainC.rotation.x = Math.PI / 2; mainC.position.set(-12, -1.8, Z0); scene.add(mainC); tag(mainC, 'main');
      var sewC = new THREE.Mesh(cg, flat(0x6E6E6B)); sewC.rotation.x = Math.PI / 2; sewC.position.set(-9.5, -2.3, Z0); scene.add(sewC); tag(sewC, 'sewer');
      
      tag(B(1.4, 1.2, 0.3, -6.5, -1.3, Z0 + 0.01, flat(0x4A4F57)), 'main');
      var meter = B(0.5, 0.45, 0.3, -6.5, -1.1, Z0 + 0.15, M({ color: 0x8D8C87 })); meter.userData.equip = true; tag(meter, 'main');
      
      var ch = kit.make('chill'); ch.position.set(6.6, 0, Z0 - 3.0); scene.add(ch); tag(ch, 'chill');
      var hy = kit.make('hybrid'); hy.position.set(21.4, 0, Z0 - 3.0); scene.add(hy); tag(hy, 'hybrid');
      var tw = kit.make('tower'); tw.position.set(34.6, 0, Z0 - 3.0); scene.add(tw); tag(tw, 'tower');
      
      parts.pad = new THREE.MeshBasicMaterial({ color: new THREE.Color(WC).convertSRGBToLinear(), transparent: true, opacity: 0 }); mats.push(parts.pad);
      tag(B(11.2, 1.6, 0.04, 21.4, 0.35, Z0 - 3.0 + kit.SPEC.hybrid.W / 2 + 0.05, parts.pad), 'hybrid', 'water');
      
      var wM = flat(WC), sM = flat(0x6E6E6B);
      parts.p1 = tube([[-12, -1.45, zp], [-12, -1.1, zp], [-6.8, -1.1, zp]], 0.09, wM); tag(parts.p1, 'main');
      parts.p2 = tube([[-6.2, -1.1, zp], [-6.2, -0.8, zp], [16.2, -0.8, zp], [16.2, 0.5, zp]], 0.09, wM); tag(parts.p2, 'water');
      parts.p3 = tube([[16.2, -0.8, zp], [31.8, -0.8, zp], [31.8, 0.6, zp]], 0.09, wM); tag(parts.p3, 'water', 'tower');
      parts.p4 = tube([[37.6, 0.3, zp], [38.4, 0.3, zp], [38.4, -1.6, zp], [-9.2, -1.6, zp], [-9.2, -2.0, zp]], 0.08, sM); tag(parts.p4, 'sewer');
      var dg = new THREE.SphereGeometry(0.11, 10, 8); geos.push(dg); var dM = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); mats.push(dM);
      parts.dots = [];
      [[parts.p1, 3, 0.4, 'main'], [parts.p2, 8, 5.0, 'water'], [parts.p3, 6, 7.5, 'water'], [parts.p4, 10, 10.0, 'sewer']].forEach(function (q) {
        for (var k = 0; k < q[1]; k++) { var m = new THREE.Mesh(dg, dM); m.visible = false; scene.add(m); tag(m, q[3]); parts.dots.push({ m: m, c: q[0].curve, u: k / q[1], on: q[2] }); }
      });
      
      var ag = new THREE.ConeGeometry(0.16, 0.5, 10); geos.push(ag); var aM = flat(HEAT);
      parts.air = [];
      [[6.6, 'chill', 2.5], [21.4, 'hybrid', 5.0]].forEach(function (q) { for (var i = 0; i < 8; i++) { var a = new THREE.Mesh(ag, aM); a.visible = false; scene.add(a); tag(a, q[1]); parts.air.push({ m: a, x: q[0] - 4.9 + i * 1.4, y0: 3.2, u: (i * 0.37) % 1, on: q[2] }); } });
      var pg = new THREE.SphereGeometry(0.7, 14, 10); geos.push(pg);
      parts.puffs = []; for (var i = 0; i < 7; i++) { var pm = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0 }); mats.push(pm); var pu = new THREE.Mesh(pg, pm); scene.add(pu); tag(pu, 'tower'); parts.puffs.push(pu); }
      
      parts.drips = []; for (i = 0; i < 10; i++) { var dr = new THREE.Mesh(dg, flat(WC)); dr.scale.setScalar(0.6); dr.visible = false; scene.add(dr); tag(dr, 'hybrid'); parts.drips.push({ m: dr, x: 16.2 + i * 1.15, u: (i * 0.29) % 1 }); }
      
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

      person(-8.0, Z0 + 0.4, 'walk', Math.PI / 2);
      person(28.0, Z0 - 0.2, 'stand', 0);
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
    
    var CK = [[0, -6.5, 1.4, 17], [1.8, -6.0, 1.4, 17], [3.4, 6.6, 2.4, 22], [5.0, 6.6, 2.4, 22], [6.4, 21.4, 2.4, 22], [7.6, 21.4, 2.4, 22], [9.0, 34.6, 2.6, 22], [10.0, 33.0, 2.4, 24], [11.4, 13.0, 3.0, 58], [12, 13.0, 3.0, 58]];

    function at0(t) {
      tNow = t;
      var end = reduced || t >= D0 - 0.05; if (end) t = D0;
      var x = pchip(CK, t, 1), y = pchip(CK, t, 2), z = pchip(CK, t, 3);
      camera.position.set(x, y + 0.5, z); camera.lookAt(x, y - 0.4, 0);
      parts.dots.forEach(function (d) { var on = end || t >= d.on; d.m.visible = on; if (on) d.m.position.copy(d.c.getPointAt(end ? d.u : (d.u + (t - d.on) * 0.22) % 1)); });
      parts.air.forEach(function (a) { var on = end || t >= a.on; a.m.visible = on; if (!on) return; var c = end ? a.u : (a.u + t * 0.35) % 1; a.m.position.set(a.x, kit.SPEC.chill.H + 0.4 + c * 1.8, -2.4); a.m.scale.setScalar(1 - 0.55 * c); });
      var wet = end ? 1 : clamp((t - 5.2) / 0.6);
      parts.pad.opacity = 0.55 * wet;
      parts.drips.forEach(function (d) { d.m.visible = wet > 0.5; var c = end ? d.u : (d.u + t * 0.8) % 1; d.m.position.set(d.x, 1.9 - c * 1.8, Z0 - 3.0 + kit.SPEC.hybrid.W / 2 + 0.12); });
      var on = t - 7.5;
      parts.puffs.forEach(function (p, i) {
        if (on < 0 && !end) { p.material.opacity = 0; return; }
        var c = end ? i / 7 : ((on * 0.3 + i / 7) % 1);
        p.position.set(34.6 - 1.2 + (i % 3) * 1.2 + c * 0.8, kit.SPEC.tower.H + 0.6 + c * 4.2, Z0 - 3.0); p.scale.setScalar(0.8 + c * 1.8); p.material.opacity = 0.75 * (1 - c);
      });
      
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
      STEPS = [{"t": 0, "caption": "City water comes in from the main under the street, through a meter."}, {"t": 5, "caption": "An air-cooled chiller uses no water: fans push the heat into the air."}, {"t": 10, "caption": "A hybrid cooler wets its pads only on hot days."}, {"t": 15, "caption": "A cooling tower evaporates water all year to carry the heat away."}, {"t": 20, "caption": "Some water is flushed to the sewer so minerals don't build up."}, {"t": 22.2, "caption": "No water, water on hot days, or water all year: it depends on the cooling."}]; FOCUS = [["main"], ["chill"], ["hybrid", "water", "main"], ["tower", "water", "main"], ["tower", "sewer"], "*"];
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
  BD.anim.register('water', make());
})();
