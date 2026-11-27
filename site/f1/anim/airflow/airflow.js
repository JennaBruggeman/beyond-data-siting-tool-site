 
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
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.65));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.8); sun.position.set(-5, 12, 9); sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 50; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      scene.add(sun); scene.add(sun.target); sun.target.position.set(7, 0, -3);
      function flat(c, o) { var m = new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(c).convertSRGBToLinear() }, o || {})); mats.push(m); return m; }
      var cut = flat(0x3A3F47), earth = flat(0xB4BAC4);
      var floorM = M({ color: 0xEEF1F7 }), backM = M({ color: 0xE3E8F0 });
      var Z0 = 0.35, HH = 4.2, ZB = -8.2;
      B(12.4, 0.02, 8.6, 5.55, 0, (Z0 + ZB) / 2, floorM).castShadow = false;
      B(12.4, HH, 0.12, 5.55, 0, ZB, backM).castShadow = false;
      B(40, 2.6, 0.3, 10, -2.6, Z0 - 0.06, earth).castShadow = false;
      function plate(x0, x1, y0, y1) { var me = B(x1 - x0, y1 - y0, 0.3, (x0 + x1) / 2, y0, Z0, cut); me.castShadow = false; }
      plate(-0.6, 11.6, -0.4, 0); plate(-0.6, 11.6, HH, HH + 0.4); plate(-0.6, -0.3, 0, HH); plate(11.3, 11.6, 0, HH);
      
      var rows = [[1.8, -1, 'rack'], [4.2, 1, 'crv'], [6.6, -1, 'rack'], [9.0, 1, 'crv']];
      rows.forEach(function (r) {
        for (var k = 0; k < 13; k++) {
          var z = -0.3 - k * 0.6, isC = (r[2] === 'crv') ? (k % 4 === 0) : (k % 4 === 2);
          var u = kit.make(isC ? 'crv' : 'rack'); u.position.set(r[0], 0, z); u.rotation.y = r[1] * Math.PI / 2; scene.add(u);
          tag(u, isC ? 'crv' : 'rack');
        }
      });
      
      var glass = flat(HEAT, { transparent: true, opacity: 0.14 }); glass.depthWrite = false;
      [3.0, 7.8].forEach(function (x) {
        tag(B(1.2, 0.05, 7.8, x, 2.0, -0.3 - 3.6, glass), 'cont'); tag(B(1.2, 2.0, 0.04, x, 0, 0.02, glass), 'cont');
        var fr = M({ color: 0x9AA2AF }); tag(B(1.24, 0.06, 0.06, x, 1.98, 0.04, fr), 'cont'); tag(B(0.06, 2.0, 0.06, x - 0.6, 0, 0.04, fr), 'cont'); tag(B(0.06, 2.0, 0.06, x + 0.6, 0, 0.04, fr), 'cont');
      });
      
      var sup = flat(DCB), ret = flat(HEAT), zp = -0.3;
      function run(a, b, r, m) { return tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], b], r, m); }
      tag(B(0.3, 3.0, 2.4, 17.3, 1.6, zp, backM), 'water');
      tag(run([3.9, 3.2, zp], [17.15, 3.2, zp], 0.09, sup), 'water'); tag(run([4.5, 3.6, zp], [17.15, 3.6, zp], 0.09, ret), 'water');
      [4.2, 9.0].forEach(function (x) { tag(run([x - 0.3, 2.0, zp], [x - 0.3, 3.2, zp], 0.06, sup), 'water'); tag(run([x + 0.3, 2.0, zp], [x + 0.3, 3.6, zp], 0.06, ret), 'water'); });
      
      var dg = new THREE.SphereGeometry(0.075, 10, 8); geos.push(dg); var dM = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); mats.push(dM);
      parts.wdots = []; for (var k = 0; k < 14; k++) { var dm = new THREE.Mesh(dg, dM); scene.add(dm); parts.wdots.push({ m: dm, u: k / 14 }); }
      
      var cg = new THREE.ConeGeometry(0.085, 0.26, 10); geos.push(cg); var cgH = new THREE.ConeGeometry(0.13, 0.38, 10); geos.push(cgH);   
      var aN = flat(DCB), aH = flat(HEAT), za = 0.12;
      var X = [0.25, 1.2, 2.4, 3.0, 3.6, 4.8, 5.4, 6.0, 7.2, 7.8, 8.4, 9.6, 10.6];
      parts.lanes = []; parts.arrows = [];
      [0.55, 0.95, 1.35, 1.75].forEach(function (y, li) {
        var P = [[X[0], y], [X[1], y], [X[2], y], [X[3], y + 0.12], [X[4], y], [X[5], y], [X[6], y - 0.08], [X[7], y], [X[8], y], [X[9], y + 0.12], [X[10], y], [X[11], y], [X[12], y]];
        var len = [], tot = 0; for (var i = 0; i < P.length - 1; i++) { var d = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); len.push(d); tot += d; }
        var lane = { P: P, len: len, tot: tot };
        for (var j = 0; j < 7; j++) {
          var mn = new THREE.Mesh(cg, aN), mh = new THREE.Mesh(cgH, aH); scene.add(mn); scene.add(mh); tag(mn, 'air'); tag(mh, 'air');
          parts.arrows.push({ n: mn, h: mh, L: lane, u: j / 7 + li * 0.05 });
        }
      });
      parts.za = za;
      
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

      parts.w1 = person(5.4, -5.6, 'walk', 0);
    }

    var _up = null;
    function lanePt(L, u) {
      var d = (((u % 1) + 1) % 1) * L.tot, i = 0;
      while (i < L.len.length - 1 && d > L.len[i]) { d -= L.len[i]; i++; }
      var a = L.P[i], b = L.P[i + 1], f = Math.min(1, d / L.len[i]);
      return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, dx: (b[0] - a[0]) / L.len[i], dy: (b[1] - a[1]) / L.len[i] };
    }
    var CK = [[0, 5.4, 2.6, 13.6], [7.4, 5.4, 2.5, 12.8], [9.75, 5.4, 2.5, 12.8], [11.4, 8.4, 2.9, 19.5], [12, 8.4, 2.9, 19.5]];
    function camAt(t) {
      for (var i = 0; i < CK.length - 2; i++) if (t <= CK[i + 1][0]) break;
      var a = CK[i], b = CK[i + 1], u = ease((t - a[0]) / (b[0] - a[0]));
      var x = lerp(a[1], b[1], u), y = lerp(a[2], b[2], u), z = lerp(a[3], b[3], u);
      camera.position.set(x, y, z); camera.lookAt(x, y - 0.75, 0);         
    }

    function at0(t) {
      tNow = t;
      var end = reduced || t >= D0 - 0.05; if (end) t = D0;
      camAt(t);
      if (!_up) _up = new THREE.Vector3(0, 1, 0);
      var flow = end ? 1 : clamp((t - 0.3) / 0.5), v = new THREE.Vector3();
      parts.arrows.forEach(function (a) {
        var q = lanePt(a.L, a.u + (end ? 0 : t * 0.07)), hot = q.x > 2.4 && q.x < 4.8 || q.x > 7.2 && q.x < 9.6;
        a.n.visible = flow > 0 && !hot; a.h.visible = flow > 0 && hot;
        var m = hot ? a.h : a.n; m.position.set(q.x, q.y, parts.za); v.set(q.dx, q.dy, 0).normalize(); m.quaternion.setFromUnitVectors(_up, v);
      });
      parts.wdots.forEach(function (d) { var u = end ? d.u : (d.u + t * 0.05) % 1; d.m.position.set(lerp(4.5, 17.1, u), 3.6, -0.3 + 0.13); d.m.visible = t >= 7.5; });
      parts.w1.position.z = lerp(-5.6, -1.6, end ? 1 : clamp(t / 10));
      
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
      STEPS = [{"t": 0, "caption": "A data hall in section: cold aisles and enclosed hot aisles take turns."}, {"t": 5, "caption": "Cool air goes in the front of each rack and comes out the back hot."}, {"t": 10, "caption": "The hot aisle is closed in, so hot air can only leave through the cooler."}, {"t": 15, "caption": "The in-row cooler puts the heat into water and sends cool air back out."}, {"t": 19.5, "caption": "The warm water leaves the hall for the heat-recovery room."}]; FOCUS = ["*", ["rack", "air"], ["cont", "air"], ["crv", "water", "air"], "*"];
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
  BD.anim.register('airflow', make());
})();
