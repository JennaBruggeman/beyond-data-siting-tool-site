 
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
      camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
      camera.position.set(-6, 27, 33); camera.lookAt(1.0, 0, 1.2);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.6));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.8); sun.position.set(-10, 18, 12); sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 70; sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
      scene.add(sun);
      var floorM = M({ color: 0xEEF1F7 }), road = M({ color: 0xC9D2E0 }), pubM = M({ color: 0xF28C38 }), supM = M({ color: 0xB9C5DA }), hallM = M({ color: 0xD5DCEA }),
        wallM = M({ color: 0xE3E8F0 }), fireM = M({ color: 0xC0262D }), doorM = M({ color: INKC }), pM = M({ color: INKC }), fenceM = M({ color: 0x8A94AA });
      B(160, 0.02, 160, 0, -0.02, 0, floorM);
      B(60, 0.03, 7, 0, 0, 12.5, road);                                         
      
      tag(B(11, 0.06, 14, -6.5, 0, -1, pubM), 'pub'); B(15, 0.06, 14, 6.5, 0, -1, supM); tag(B(8.5, 0.07, 9, 9.2, 0, -3.3, hallM), 'hall');
      
      function wall(x0, z0, x1, z1, m, h) { var L = Math.hypot(x1 - x0, z1 - z0), me = B(Math.abs(x1 - x0) + 0.15, h || 1.0, Math.abs(z1 - z0) + 0.15, (x0 + x1) / 2, 0, (z0 + z1) / 2, m || wallM); me.castShadow = false; return me; }
      wall(-12, -8, 14, -8); wall(-12, -8, -12, 6); wall(14, -8, 14, 6);
      wall(-12, 6, -8.2, 6); wall(-5.8, 6, -1, 6); wall(-1, 6, 2.1, 6); wall(3.9, 6, 14, 6);
      tag(wall(-1, -8, -1, 6, fireM, 1.2), 'fire');                                          
      wall(4.9, 1.2, 13.5, 1.2); wall(4.9, -7.8, 4.9, -3.9); wall(4.9, -2.1, 4.9, 1.2);   
      wall(-0.9, 2.5, 2.1, 2.5); wall(3.9, 2.5, 4.9, 2.5);                       
      
      var gl = M({ color: 0xDCE4F0, transparent: true, opacity: 0.5 }); tag(B(1.8, 2.2, 1.6, 3.0, 0, 3.4, gl), 'man').castShadow = false;
      tag(B(1.8, 2.2, 0.08, -7.0, 0, 6.0, doorM), 'pub'); tag(B(1.8, 2.2, 0.08, 3.0, 0, 6.0, doorM), 'man'); tag(B(0.08, 2.2, 1.8, 4.9, 0, -3.0, doorM), 'hall');
      
      for (var r = 0; r < 2; r++) for (var i = 0; i < 9; i++) { var k = kit.make('rack'); k.rotation.y = r ? Math.PI : 0; k.position.set(6.6 + i * 0.6, 0, -5.6 + r * 2.4); scene.add(k); tag(k, 'hall'); }
      var cg = new THREE.EdgesGeometry(new THREE.BoxGeometry(6.6, 2.4, 5.4)); geos.push(cg);
      var cm = new THREE.LineDashedMaterial({ color: new THREE.Color(DCB).convertSRGBToLinear(), dashSize: 0.15, gapSize: 0.12 }); mats.push(cm);
      var cage = new THREE.LineSegments(cg, cm); cage.computeLineDistances(); cage.position.set(9.0, 1.2, -4.4); scene.add(cage); tag(cage, 'cage'); parts.cage = cage;
      
      for (var x = -0.6; x <= 14.6; x += 1.2) if (x < 2.0 || x > 4.0) tag(B(0.07, 2.0, 0.07, x, 0, 8.2, fenceM), 'fence');
      tag(B(15.2, 0.06, 0.04, 7.0, 1.95, 8.2, fenceM), 'fence');
      
      var sl = new THREE.BufferGeometry().setFromPoints([[-0.9, 8.4], [14.6, 8.4], [14.6, -8.4], [-0.9, -8.4], [-0.9, 8.4]].map(function (p) { return new THREE.Vector3(p[0], 0.08, p[1]); }));
      geos.push(sl); var slm = new THREE.LineDashedMaterial({ color: new THREE.Color(DCB).convertSRGBToLinear(), dashSize: 0.5, gapSize: 0.35 }); mats.push(slm);
      var sline = new THREE.Line(sl, slm); sline.computeLineDistances(); scene.add(sline); tag(sline, 'fence');
      
      
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
      person(-9.5, -2.0, 'stand', 0.8); person(-4.0, -5.0, 'point', 0.3); person(-3.2, -4.4, 'stand', -2.4);
      parts.vis = person(-7.0, 11.0, 'walk', Math.PI); parts.staff = person(3.0, 11.0, 'walk', Math.PI);
      parts.vPath = new THREE.CatmullRomCurve3([[-7.0, 11.0], [-7.0, 6.0], [-7.0, 2.0], [-6.0, -1.0]].map(function (p) { return new THREE.Vector3(p[0], 0, p[1]); }), false, 'catmullrom', 0.0);
      var sp = [[3.0, 11.0], [3.0, 8.2], [3.0, 6.0], [3.0, 3.4], [1.0, 2.0], [1.0, -3.0], [4.9, -3.0], [6.0, -3.0], [6.0, -4.4], [8.0, -4.4]];
      parts.sPath = new THREE.CurvePath(); for (i = 0; i < sp.length - 1; i++) parts.sPath.add(new THREE.LineCurve3(new THREE.Vector3(sp[i][0], 0, sp[i][1]), new THREE.Vector3(sp[i + 1][0], 0, sp[i + 1][1])));
      parts.L = {
        vis: label('Visitors: straight into the public rooms', [-7.0, 2.6, 2.0]),
        gate: label('Fence and gate', [3.0, 2.4, 8.2]),
        ent: label('Staff entrance and passage', [3.0, 2.5, 6.0]),
        man: label('Mantrap: one person at a time', [3.0, 2.6, 3.4]),
        cor: label('Secure corridor', [1.0, 1.6, -1.0]),
        hall: label('Data hall door', [4.9, 2.6, -3.0]),
        cage: label('Cage round the racks', [9.0, 2.9, -4.4]),
        fire: label('Fire separation', [-1.0, 1.7, -6.5])
      };
    }

    function at0(t) {
      tNow = t;
      var end = reduced || t >= D0 - 0.05;
      var vu = end ? 1 : ease((t - 0.5) / 3.5); parts.vis.position.copy(parts.vPath.getPointAt(vu));
      var su = end ? 1 : clamp((t - 1.0) / 9.5); parts.staff.position.copy(parts.sPath.getPointAt(su));
      
      var fa = parts.sPath.getPointAt(clamp(su - 0.04)).clone().add(parts.sPath.getPointAt(clamp(su + 0.04))).multiplyScalar(0.5);
      var cf = fa.clone().add(new THREE.Vector3(-3.2, 6.2, 8.5)), lf = fa.clone().add(new THREE.Vector3(0.6, 0.6, -2.2));
      var c0 = new THREE.Vector3(-2, 10, 24), l0 = new THREE.Vector3(-2, 0, 5), c2 = new THREE.Vector3(-6, 27, 33), l2 = new THREE.Vector3(1.0, 0, 1.2);
      var w1 = ease((t - 1.0) / 1.4), w2 = end ? 1 : ease((t - 10.6) / 1.2);
      var cp = c0.clone().lerp(cf, w1).lerp(c2, w2), lp = l0.clone().lerp(lf, w1).lerp(l2, w2); camera.position.copy(cp); camera.lookAt(lp);
      var L = parts.L;
      L.vis.show = vu > 0.55 || end ? 1 : 0;
      L.gate.show = su > 0.12 || end ? 1 : 0;
      L.ent.show = su > 0.2 || end ? 1 : 0;
      L.man.show = su > 0.3 || end ? 1 : 0;
      L.cor.show = su > 0.5 || end ? 1 : 0;
      L.hall.show = su > 0.75 || end ? 1 : 0;
      L.cage.show = su > 0.9 || end ? 1 : 0;
      L.fire.show = t > 0.3 || end ? 1 : 0;
      
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
      STEPS = [{"t": 0, "caption": "Visitors walk in the public door, straight into the public rooms."}, {"t": 4.2, "caption": "Staff go the other way, first through the fence and gate."}, {"t": 6.4, "caption": "Then the staff entrance and a mantrap that lets one person in at a time."}, {"t": 11.5, "caption": "A secure corridor leads to the data hall door."}, {"t": 17, "caption": "Inside the hall, a cage closes round the racks."}, {"t": 21, "caption": "A fire separation divides the public side from the data centre."}]; FOCUS = [["pub"], ["fence"], ["man", "fence"], ["man", "hall"], ["hall", "cage"], "*"];
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
  BD.anim.register('security', make());
})();
