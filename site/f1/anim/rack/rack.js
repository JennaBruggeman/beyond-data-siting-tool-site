 
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
      camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
      camera.position.set(7.4, 4.4, 7.6); camera.lookAt(-0.6, 0.9, 0.0);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.6));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.85); sun.position.set(4, 9, 6); sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 30; sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
      scene.add(sun);
      var floorM = M({ color: 0xEEF1F7 }), wallM = M({ color: 0xE3E8F0 }), frameM = M({ color: 0x8D8C87 }), srvM = M({ color: 0x5E6782 }), srvF = M({ color: 0xB9C5DA }),
        busM = M({ color: 0xB9C5DA }), cartM = M({ color: 0xC9CFD8 }), pM = M({ color: INKC });
      B(40, 0.02, 40, 0, -0.02, 0, floorM);
      B(40, 3.4, 0.2, 0, 0, -2.6, wallM);                                                    
      
      var X0 = -3.3; parts.rackX = [];
      for (var i = 0; i < 6; i++) { var r = kit.make('rack'); r.position.set(X0 + i * 0.6, 0, 0); scene.add(r); tag(r, 'rack'); }
      
      var RX = X0 + 6 * 0.6, s = kit.SPEC.rack, Lr = s.L, Dr = s.W, Hr = s.H; parts.RX = RX;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { tag(B(0.04, Hr, 0.04, RX + q[0] * (Lr / 2 - 0.02), 0, q[1] * (Dr / 2 - 0.02), frameM), 'frame').userData.equip = true; });
      tag(B(Lr, 0.06, Dr, RX, Hr - 0.06, 0, frameM), 'frame').userData.equip = true; tag(B(Lr, 0.06, Dr, RX, 0, 0, frameM), 'frame').userData.equip = true;
      
      var U = 0.04445, n = 18; parts.srv = [];
      for (i = 0; i < n; i++) {
        var g = new THREE.Group(), y0 = 0.1 + i * 2 * U;
        var bg = new THREE.BoxGeometry(0.48, 2 * U - 0.006, 1.0); geos.push(bg); var b = new THREE.Mesh(bg, srvM); b.castShadow = b.receiveShadow = true; g.add(b);
        var fg = new THREE.BoxGeometry(0.46, 2 * U - 0.02, 0.01); geos.push(fg); var f = new THREE.Mesh(fg, srvF); f.position.z = 0.505; g.add(f);
        g.position.set(RX, y0 + U, 0.05); g.visible = false; scene.add(g); tag(g, 'srv'); g.userData.equip = true; parts.srv.push({ g: g, y: y0 + U });
      }
      
      tag(B(5.2, 0.14, 0.22, -0.6, 2.75, -0.2, busM), 'pwr');
      parts.dropOn = M({ color: DCB }); parts.dropOff = M({ color: 0xB9C5DA });
      parts.drop = tube([[RX - 0.1, 2.75, -0.2], [RX - 0.1, 2.3, -0.2], [RX - 0.1, Hr + 0.02, -0.2]], 0.025, parts.dropOff); tag(parts.drop, 'pwr');
      var dg = new THREE.SphereGeometry(0.035, 10, 8); geos.push(dg); var dM = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); mats.push(dM);
      parts.dots = []; for (i = 0; i < 4; i++) { var d = new THREE.Mesh(dg, dM); d.visible = false; scene.add(d); tag(d, 'pwr'); parts.dots.push(d); }
      
      parts.heat = []; var hM = new THREE.MeshBasicMaterial({ color: new THREE.Color(HEAT).convertSRGBToLinear(), transparent: true, opacity: 0 }); mats.push(hM);
      var ag = new THREE.ConeGeometry(0.07, 0.18, 12); geos.push(ag); var sg = new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8); geos.push(sg);
      for (i = 0; i < 4; i++) {
        var ar = new THREE.Group(), sh = new THREE.Mesh(sg, hM), hd = new THREE.Mesh(ag, hM); sh.position.y = 0.25; hd.position.y = 0.58; ar.add(sh); ar.add(hd);
        ar.rotation.x = -Math.PI / 2; ar.position.set(RX - 0.18 + (i % 2) * 0.36, 0.45 + Math.floor(i / 2) * 0.5, -Dr / 2 - 0.05); scene.add(ar); tag(ar, 'heat'); parts.heat.push(ar);
      }
      parts.hM = hM;
      
      
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
      B(0.9, 0.9, 0.6, RX - 1.5, 0, 1.9, cartM);
      for (i = 0; i < 3; i++) B(0.8, 0.08, 0.48, RX - 1.5, 0.9 + i * 0.09, 1.9, srvM);
      parts.tech = person(RX - 0.55, 1.25, 'carry', Math.PI);
      person(X0 + 0.6, 1.6, 'point', Math.PI);
      parts.L = {
        rack: label('A rack: 0.6 x 1.2 x 2.0 m, 42 slots', [X0 + 1.5, 2.45, 0.6]),
        srv: label('Servers slide in, slot by slot', [RX, 1.75, 1.1]),
        pwr: label('Power to the rack: [n] kW', [RX - 0.1, 3.05, -0.2]),
        heat: label('Heat leaves the back', [RX, 1.65, -1.2])
      };
    }

    function at0(t) {
      tNow = t;
      var end = reduced || t >= D0 - 0.05;
      
      parts.srv.forEach(function (s, i) {
        var t0_ = 1.5 + i * 0.33, ph = end ? 1 : ease((t - t0_) / 0.45);
        s.g.visible = end || t >= t0_; s.g.position.set(parts.RX, s.y, 0.05 + (1 - ph) * 1.1);
      });
      
      var live = end || t >= 6.5;
      parts.drop.mesh.material = live ? parts.dropOn : parts.dropOff;
      parts.dots.forEach(function (d, i) { d.visible = live; if (live) d.position.copy(parts.drop.curve.getPointAt(end ? i / 4 : ((t * 0.5 + i / 4) % 1))); });
      
      var hv = end ? 1 : clamp((t - 8) / 0.8);
      parts.hM.opacity = hv;
      parts.heat.forEach(function (a, i) { var w = end ? 0.2 : ((t * 0.6 + i * 0.25) % 1); a.position.z = -kit.SPEC.rack.W / 2 - 0.05 - w * 0.5; });
      
      var tw = end ? 0 : Math.sin(clamp((t - 1.2) / 6.6) * Math.PI);
      parts.tech.position.set(parts.RX - 0.55 - tw * 0.5, 0, 1.25 + tw * 0.35);
      var L = parts.L;
      L.rack.show = t >= 0.3 || end ? 1 : 0;
      L.srv.show = t >= 1.8 || end ? 1 : 0;
      L.pwr.show = t >= 6.8 || end ? 1 : 0;
      L.heat.show = t >= 8.4 || end ? 1 : 0;
      
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
      STEPS = [{"t": 0, "caption": "A rack is a steel frame 2 m tall with 42 slots for servers."}, {"t": 3, "caption": "A technician slides the servers in, one slot at a time."}, {"t": 13, "caption": "Power runs overhead to the rack."}, {"t": 16.4, "caption": "The servers turn that power into heat, which leaves out the back."}]; FOCUS = [["rack", "frame"], ["srv", "frame"], ["pwr", "srv", "frame"], ["heat", "srv", "frame", "rack"]];
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
  BD.anim.register('rack', make());
})();
