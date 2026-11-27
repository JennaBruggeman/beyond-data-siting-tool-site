 
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
      camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 300);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.65));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.7); sun.position.set(-8, 22, 14); sun.castShadow = true;
      sun.shadow.mapSize.set(4096, 2048); var sc = sun.shadow.camera; sc.left = -20; sc.right = 30; sc.top = 16; sc.bottom = -10; sc.near = 1; sc.far = 70; sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      scene.add(sun); scene.add(sun.target); sun.target.position.set(15, 0, 0);
      function flat(c, o) { var m = new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(c).convertSRGBToLinear() }, o || {})); mats.push(m); return m; }
      var cut = flat(0x3A3F47), earth = flat(0xB4BAC4);
      var floorM = M({ color: 0xEEF1F7 }), backM = M({ color: 0xE3E8F0 }), roofM = M({ color: 0xE6EBF3 });
      var Z0 = 0.6, HH = 4.6, RT = 5.0, ZB = -3.4;
      function plate(x0, x1, y0, y1) { var me = B(x1 - x0, y1 - y0, 0.3, (x0 + x1) / 2, y0, Z0, cut); me.castShadow = false; }
      B(90, 3.0, 0.3, 15, -3.0, Z0 - 0.06, earth).castShadow = false;
      B(30, 0.02, Z0 - ZB, 15, 0, (Z0 + ZB) / 2, floorM).castShadow = false;
      B(30, HH, 0.12, 15, 0, ZB, backM).castShadow = false;
      B(30.6, 0.02, 5.4, 15, RT, Z0 - 2.7, roofM).castShadow = false;
      plate(-0.3, 30.3, -0.4, 0); plate(-0.3, 30.3, HH, RT); plate(-0.3, 0, 0, HH); plate(30, 30.3, 0, HH);
      plate(-0.3, -0.1, RT, RT + 1.1); plate(30.1, 30.3, RT, RT + 1.1);                              
      
      parts.crvX = [];
      for (var k = 0; k < 36; k++) {
        var x = 3.3 + k * 0.6, isC = k % 6 === 5; var u = kit.make(isC ? 'crv' : 'rack'); u.position.set(x, 0, -1.6); scene.add(u); tag(u, 'crv');
        if (isC) parts.crvX.push(x);
      }
      
      [8.0, 22.0].forEach(function (x) { var c = kit.make('chill'); c.position.set(x, RT, -2.2); scene.add(c); tag(c, 'chill'); });
      
      var ret = flat(HEAT), sup = flat(DCB), zf = -0.6;
      function poly(P, r, m) { var segs = []; for (var i = 0; i < P.length - 1; i++) { var a = P[i], b = P[i + 1]; segs.push(tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], b], r, m)); } return segs; }
      var CH = RT + kit.SPEC.chill.H;
      parts.retP = [[3.0, 2.95, zf], [28.6, 2.95, zf], [28.6, RT + 0.7, zf], [1.3, RT + 0.7, zf]];
      parts.supP = [[1.9, RT + 0.35, zf], [29.3, RT + 0.35, zf], [29.3, 2.6, zf], [3.0, 2.6, zf]];
      poly(parts.retP, 0.1, ret).forEach(function (q) { tag(q, 'ret'); }); poly(parts.supP, 0.1, sup).forEach(function (q) { tag(q, 'sup'); });
      parts.crvX.forEach(function (x) { poly([[x - 0.12, 2.15, -1.3], [x - 0.12, 2.15, zf], [x - 0.12, 2.6, zf]], 0.05, sup).forEach(function (q) { tag(q, 'sup'); }); poly([[x + 0.12, 2.15, -1.3], [x + 0.12, 2.15, zf], [x + 0.12, 2.95, zf]], 0.05, ret).forEach(function (q) { tag(q, 'ret'); }); });
      [8.0, 22.0].forEach(function (x) { [-4.5, 4.5].forEach(function (o) { poly([[x + o, RT + 0.7, zf], [x + o, RT + 0.7, -1.0]], 0.07, ret).forEach(function (q) { tag(q, 'ret'); }); poly([[x + o + 0.4, RT + 0.35, zf], [x + o + 0.4, RT + 0.35, -1.0]], 0.07, sup).forEach(function (q) { tag(q, 'sup'); }); }); });
      
      function mkLoop(P) { var V = P.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }), len = [], tot = 0; for (var i = 0; i < V.length - 1; i++) { var d = V[i].distanceTo(V[i + 1]); len.push(d); tot += d; } return { V: V, len: len, tot: tot }; }
      parts.lr = mkLoop(parts.retP); parts.ls = mkLoop(parts.supP);
      var dg = new THREE.SphereGeometry(0.11, 10, 8); geos.push(dg); var dM = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); mats.push(dM);
      parts.dots = [];
      for (k = 0; k < 26; k++) { var m = new THREE.Mesh(dg, dM); scene.add(m); tag(m, 'ret'); parts.dots.push({ m: m, L: parts.lr, u: k / 26, on: 1.0 }); }
      for (k = 0; k < 26; k++) { m = new THREE.Mesh(dg, dM); scene.add(m); tag(m, 'sup'); parts.dots.push({ m: m, L: parts.ls, u: k / 26, on: 7.4 }); }
      
      var cg = new THREE.ConeGeometry(0.16, 0.5, 10); geos.push(cg); var aM = flat(HEAT, { transparent: true, opacity: 0.8 });
      parts.air = [];
      [8.0, 22.0].forEach(function (x0) { for (var i = 0; i < 10; i++) { var a = new THREE.Mesh(cg, aM); a.visible = false; scene.add(a); tag(a, 'air'); parts.air.push({ m: a, x: x0 - 5.2 + (i % 5) * 2.6 + (i < 5 ? 0 : 1.3), z: -2.2 + (i < 5 ? -0.5 : 0.5), u: (i * 0.37) % 1 }); } });
      
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

      parts.tech = person(6.0, -0.2, 'walk', Math.PI / 2);
      person(15.0, -3.4, 'stand', 0).position.y = RT;
      parts.L = {
        crv: label('In-row coolers put the heat into water', [12.0, 3.25, zf]),
        up: label('Warm water up to the roof: [n] °C', [25.0, 3.25, zf]),
        chill: label('Air-cooled chiller, 12.1 m long: 1,489 kW (maker’s figure)', [15.0, CH + 4.3, -2.2]),
        mode: label('Below [n] °C outside: coils only. Above: compressors too', [15.0, CH + 3.2, -2.2]),
        air: label('Without heat recovery, the heat goes into the air', [15.0, CH + 2.1, -2.2]),
        back: label('Cooled water back to the hall: [n] °C', [25.0, 1.6, zf])
      };
    }

    function along(L, u) {
      var d = clamp(u) * L.tot, i = 0;
      while (i < L.len.length - 1 && d > L.len[i]) { d -= L.len[i]; i++; }
      return L.V[i].clone().lerp(L.V[i + 1], clamp(d / L.len[i]));
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
    
    var CK = [[0, 11, 1.8, 15, 1.4], [2.2, 13, 1.8, 15, 1.4], [4.0, 24, 4.6, 17, 4.4], [5.6, 15, 8.4, 30, 7.6], [7.4, 15, 8.4, 30, 7.6], [9.0, 25, 3.6, 18, 3.2], [11.2, 15, 6.0, 46, 5.0], [12, 15, 6.0, 46, 5.0]];

    function at0(t) {
      tNow = t;
      var end = reduced || t >= D0 - 0.05; if (end) t = D0;
      camera.position.set(pchip(CK, t, 1), pchip(CK, t, 2), pchip(CK, t, 3)); camera.lookAt(pchip(CK, t, 1), pchip(CK, t, 4), 0);
      parts.dots.forEach(function (d) {
        var on = end || t >= d.on; d.m.visible = on;
        if (on) d.m.position.copy(along(d.L, end ? d.u : (d.u + (t - d.on) * 0.09) % 1));
      });
      var ao = end ? 1 : clamp((t - 5.0) / 0.6);
      parts.air.forEach(function (a) {
        a.m.visible = ao > 0; var c = end ? a.u : (a.u + t * 0.35) % 1;
        a.m.position.set(a.x, 5.0 + kit.SPEC.chill.H + 0.3 + c * 1.6, a.z); a.m.scale.setScalar(1 - 0.6 * c);
      });
      parts.tech.position.x = lerp(6.0, 9.5, end ? 1 : clamp(t / 6));
      var L = parts.L;
      L.crv.show = t >= 0.5 ? 1 : 0; L.up.show = t >= 2.6 ? 1 : 0;
      L.chill.show = t >= 5.0 ? 1 : 0; L.mode.show = t >= 5.8 ? 1 : 0; L.air.show = t >= 6.6 ? 1 : 0;
      L.back.show = t >= 8.2 ? 1 : 0;
      
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
      STEPS = [{"t": 0, "caption": "In-row coolers in the hall put the servers' heat into water."}, {"t": 5, "caption": "The warm water rises to chillers on the roof."}, {"t": 10, "caption": "Most of the year outside air alone cools it; on warm days compressors help."}, {"t": 13.2, "caption": "Without heat recovery, all of that heat goes into the air."}, {"t": 16.4, "caption": "The cooled water goes back down to the hall, and the loop starts again."}]; FOCUS = [["crv", "ret"], ["ret", "chill"], ["chill"], ["chill", "air"], "*"];
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
  BD.anim.register('cooling', make());
})();
