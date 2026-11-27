 
(function () {
  'use strict';
  var BD = window.BD = window.BD || {};
  var DUR = 28, HEAT = 0x7A4FE0, DCB = 0x3D5185, INKC = 0x1E2A47;
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
      sun.shadow.mapSize.set(4096, 2048); var sc = sun.shadow.camera; sc.left = -12; sc.right = 60; sc.top = 14; sc.bottom = -8; sc.near = 1; sc.far = 60; sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      scene.add(sun); scene.add(sun.target); sun.target.position.set(24, 0, 0);
      var cut = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3A3F47).convertSRGBToLinear() }); mats.push(cut);
      var floorM = M({ color: 0xEEF1F7 }), backM = M({ color: 0xE3E8F0 }), earth = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xB4BAC4).convertSRGBToLinear() }), water = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4F86BE).convertSRGBToLinear() }), deck = M({ color: 0xEFE7DC });
      mats.push(earth, water);
      var Z0 = 0.5, D = 5;                                                        
      function plate(x0, x1, y0, y1, m) { var me = B(x1 - x0, y1 - y0, 0.3, (x0 + x1) / 2, y0, Z0, m); me.castShadow = false; return me; }
      
      B(76, 3.2, 0.3, 24, -3.2, Z0 - 0.06, earth).castShadow = false;
      function room(x0, x1, h) {
        B(x1 - x0, 0.02, D, (x0 + x1) / 2, 0, Z0 - D / 2, floorM).castShadow = false;
        B(x1 - x0, h, 0.12, (x0 + x1) / 2, 0, Z0 - D, backM).castShadow = false;
        plate(x0 - 0.3, x1 + 0.3, h, h + 0.4, cut); plate(x0 - 0.3, x0, 0, h, cut); plate(x1, x1 + 0.3, 0, h, cut); plate(x0 - 0.3, x1 + 0.3, -0.5, 0, cut);
      }
      room(-9, 0, 4.4); room(4, 27, 4.4); room(34, 54, 6);
      
      for (var i = 0; i < 8; i++) { var r = kit.make('rack'); r.position.set(-8.4 + i * 0.6, 0, Z0 - 2.0); scene.add(r); tag(r, 'hall'); }
      var cdu = kit.make('cdu'); cdu.position.set(-1.4, 0, Z0 - 1.6); scene.add(cdu); tag(cdu, 'hall');
      
      var phe = kit.make('phe'); phe.position.set(8, 0, Z0 - 1.6); scene.add(phe); tag(phe, 'phe');
      var hp = kit.make('heatpump'); hp.position.set(16, 0, Z0 - 2.2); scene.add(hp); tag(hp, 'hp');
      var tk = kit.make('tank'); tk.position.set(23.5, 0, Z0 - 1.6); scene.add(tk); tag(tk, 'tank');
      
      tag(plate(36, 52, -1.6, 0, water), 'pool'); B(2, 0.06, D, 35, 0, Z0 - D / 2, deck); B(2, 0.06, D, 53, 0, Z0 - D / 2, deck);
      
      
      function flat(c) { var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(c).convertSRGBToLinear() }); mats.push(m); return m; }
      var zp = Z0 + 0.2, y = 3.0;
      parts.p1 = tube([[-1.4, 2.1, zp], [-1.4, y, zp], [6.0, y, zp], [6.0, 1.9, zp]], 0.09, flat(HEAT));                 
      parts.p2 = tube([[10.0, 1.9, zp], [10.0, y, zp], [13.0, y, zp], [13.0, 1.9, zp]], 0.09, flat(HEAT));               
      parts.p3 = tube([[19.0, 1.9, zp], [19.0, y, zp], [23.5, y, zp], [23.5, 3.2, zp]], 0.11, flat(0x5B32C4));          
      parts.p4 = tube([[24.3, 1.0, zp], [26.0, 1.0, zp], [26.0, -1.0, zp], [35.0, -1.0, zp], [35.0, -0.6, zp], [37.5, -0.6, zp]], 0.11, flat(0x5B32C4));   
      parts.p5 = tube([[37.5, -1.2, zp + 0.3], [33.0, -1.2, zp + 0.3], [33.0, -1.6, zp + 0.3], [3.0, -1.6, zp + 0.3], [3.0, 0.4, zp + 0.3], [-1.0, 0.4, zp + 0.3]], 0.08, flat(DCB)); 
      var dg = new THREE.SphereGeometry(0.13, 10, 8); geos.push(dg); var dM = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); mats.push(dM);
      parts.dots = [];
      tag(parts.p1, 'p1'); tag(parts.p2, 'p2'); tag(parts.p3, 'p3'); tag(parts.p4, 'p4'); tag(parts.p5, 'p5');
      [[parts.p1, 3, 0.0, 'p1'], [parts.p2, 2, 2.6, 'p2'], [parts.p3, 3, 4.8, 'p3'], [parts.p4, 5, 7.0, 'p4'], [parts.p5, 8, 8.5, 'p5']].forEach(function (q) {
        for (var k = 0; k < q[1]; k++) { var m = new THREE.Mesh(dg, dM); m.visible = false; scene.add(m); tag(m, q[3]); parts.dots.push({ m: m, c: q[0].curve, u: k / q[1], on: q[2] }); }
      });
      
      parts.waves = [];
      for (i = 0; i < 6; i++) {
        var pts = []; for (var j = 0; j <= 12; j++) pts.push(new THREE.Vector3(38 + i * 2.4 + 0.18 * Math.sin(j * 1.4), 0.15 + j * 0.13, Z0 - 0.4));
        var wg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.04, 6, false); geos.push(wg);
        var wm = new THREE.MeshBasicMaterial({ color: new THREE.Color(HEAT).convertSRGBToLinear(), transparent: true, opacity: 0 }); mats.push(wm);
        var w = new THREE.Mesh(wg, wm); scene.add(w); tag(w, 'pool'); parts.waves.push(w);
      }
      
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

      person(-3.6, Z0 - 0.6, 'walk', Math.PI / 2);
      parts.op = person(14.0, Z0 - 0.4, 'point', Math.PI / 2);
      person(37.2, Z0 - 0.3, 'stand', Math.PI / 2); person(50.8, Z0 - 0.4, 'point', -Math.PI / 2); person(51.8, Z0 - 1.4, 'walk', -Math.PI / 2);
      var hg = new THREE.SphereGeometry(0.16, 12, 8); geos.push(hg);
      [39, 42.5, 46, 49.5].forEach(function (x, i) { var h = new THREE.Mesh(hg, figMat); h.position.set(x, 0.1, Z0 - 0.3 - (i % 2) * 1.2); scene.add(h); var sh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.24), figMat); sh.position.set(x, -0.02, h.position.z); scene.add(sh); });
      parts.L = {
        hall: label('Warm water leaves the data hall: [n] °C', [-2.8, 3.75, zp]),
        phe: label('Plate heat exchanger: the heat moves to a second loop', [8.0, 3.75, zp]),
        hp: label('Heat pump lifts it to [n] °C', [16.0, 3.75, zp]),
        tank: label('Buffer tank, 5,000 L', [23.5, 3.95, zp]),
        pool: label('Into the pool next door: [n] MWh a year', [44.0, 2.6, zp]),
        back: label('Cooled water goes back', [43.0, -2.3, zp + 0.3])
      };
      
      parts.track = [[0, -3.0], [2.2, -3.0], [4.0, 8.0], [6.0, 16.0], [7.8, 23.0], [10.2, 44.0], [12, 44.0]];
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
      var x = camX(t), pb = ease((t - 10.9) / 0.9); camera.position.set(lerp(x, 22.5, pb), lerp(2.0, 5.0, pb), lerp(15.5, 70, pb)); camera.lookAt(lerp(x, 22.5, pb), lerp(1.4, 1.2, pb), 0);
      parts.dots.forEach(function (d) { var on = t >= d.on; d.m.visible = on; if (on) d.m.position.copy(d.c.getPointAt(end ? d.u : (d.u + (t - d.on) * 0.25) % 1)); });
      var wv = clamp((t - 9.6) / 0.8); parts.waves.forEach(function (w, i) { w.material.opacity = wv * (0.85 - 0.08 * (i % 3)); });
      var L = parts.L;
      L.hall.show = t < 3.6 ? 1 : 0;
      L.phe.show = t >= 3.4 && t < 5.6 ? 1 : 0;
      L.hp.show = t >= 5.4 && t < 7.4 ? 1 : 0;
      L.tank.show = t >= 7.2 && t < 9.4 ? 1 : 0;
      L.pool.show = t >= 9.8 ? 1 : 0;
      L.back.show = t >= 9.8 ? 1 : 0;
      
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
      STEPS = [{"t": 0, "caption": "Warm water leaves the data hall carrying the servers' heat."}, {"t": 8.2, "caption": "A plate heat exchanger passes the heat to a second, clean loop."}, {"t": 12.8, "caption": "A heat pump lifts the water to a useful temperature."}, {"t": 17, "caption": "A buffer tank holds the warm water until it is needed."}, {"t": 22.6, "caption": "The warm water heats the pool next door."}, {"t": 25.4, "caption": "Then it comes back cooled, and the loop starts again."}]; FOCUS = [["hall", "p1"], ["p1", "phe", "p2"], ["p2", "hp", "p3"], ["p3", "tank", "p4"], ["p4", "pool"], "*"];
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
  BD.anim.register('heatcap', make());
})();
