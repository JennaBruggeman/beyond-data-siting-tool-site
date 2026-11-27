 
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
      camera = new THREE.PerspectiveCamera(26, W / H, 0.5, 400);
      camera.position.set(-38, 34, 54); camera.lookAt(9, 1, -1);
      scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9D2E2, 0.55));
      var sun = new THREE.DirectionalLight(0xFFFFFF, 0.95); sun.position.set(-30, 38, 18); sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 120; sun.shadow.radius = 4; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
      scene.add(sun);
      var ground = M({ color: 0xEEF1F7 }), yard = M({ color: 0xE6EBF3 }), road = M({ color: 0xD6DEEB }), wall = M({ color: 0x8C9DBD }),
        house = M({ color: 0xEEF1F7 }), roof = M({ color: 0xD6DEEB }), fence = M({ color: 0x8A94AA });
      B(90, 0.02, 70, 0, -0.02, 0, ground);
      B(30, 0.03, 22, 4, 0, 0, yard);                                                   
      B(90, 0.03, 8, 0, 0, 17, road);                                                     
      
      B(34, 14, 6, 4, 0, -14, wall);
      
      var gA = kit.make('genset'), gB = kit.make('genset');
      gA.position.set(4, 0, -4.2); gB.position.set(4, 0, 1.3); scene.add(gA); scene.add(gB); tag(gA, 'sets'); tag(gB, 'sets');
      parts.sets = [gA, gB];
      
      var stackM = M({ color: 0x8A94AA });
      parts.stacks = [[4 + 4.2, 4.777, -4.2], [4 + 4.2, 4.777, 1.3]].map(function (p) {
        var g = new THREE.CylinderGeometry(0.22, 0.22, 1.6, 16); geos.push(g); var m = new THREE.Mesh(g, stackM); m.position.set(p[0], p[1] + 0.8, p[2]); m.castShadow = true; scene.add(m); tag(m, 'sets');
        return [p[0], p[1] + 1.6, p[2]];
      });
      
      var tx = kit.make('transformer', { kva: 2500 }); tx.position.set(-8, 0, 6); scene.add(tx); tag(tx, 'feed');
      parts.feedOn = M({ color: 0x3D5185 }); parts.feedOff = M({ color: 0xB9C5DA });
      parts.feed = tube([[-8, 0.15, 17], [-8, 0.15, 7.4], [-8, 0.9, 6.0], [-8, 0.15, 4.6], [-8, 0.15, -10.8]], 0.12, parts.feedOn); tag(parts.feed, 'feed');
      
      var fill = tag(B(0.6, 1.1, 0.6, 18, 0, 8, M({ color: 0x8A94AA })), 'fuel');
      parts.pipeM = M({ color: 0x5E6782 });
      parts.pipe = tube([[18, 0.5, 8], [18, 0.12, 6.8], [11, 0.12, 6.8], [11, 0.12, -4.2], [10.8, 0.15, -4.2]], 0.07, parts.pipeM); tag(parts.pipe, 'fuel');
      parts.pipe2 = tube([[11, 0.12, 1.3], [10.8, 0.15, 1.3]], 0.07, parts.pipeM); tag(parts.pipe2, 'fuel');
      var pulseG = new THREE.SphereGeometry(0.22, 12, 8); geos.push(pulseG); parts.pulseM = new THREE.MeshBasicMaterial({ color: 0x1E2A47 }); mats.push(parts.pulseM);
      parts.fuelDots = []; for (var i = 0; i < 6; i++) { var d = new THREE.Mesh(pulseG, parts.pulseM); d.visible = false; scene.add(d); tag(d, 'fuel'); parts.fuelDots.push(d); }
      parts.feedDots = []; var fdM = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); mats.push(fdM);
      for (i = 0; i < 5; i++) { var fd = new THREE.Mesh(pulseG, fdM); fd.scale.setScalar(0.6); scene.add(fd); tag(fd, 'feed'); parts.feedDots.push(fd); }
      
      for (var z = -10; z <= 13; z += 1.2) tag(B(0.06, 1.8, 0.06, 26, 0, z, fence), 'lot');
      tag(B(0.04, 0.06, 24, 26, 1.75, 1.5, fence), 'lot');
      tag(B(10, 6.5, 9, 33, 0, -1, house), 'lot'); var rg = new THREE.ConeGeometry(7.4, 2.6, 4); geos.push(rg); var r = new THREE.Mesh(rg, roof); r.rotation.y = Math.PI / 4; r.position.set(33, 6.5 + 1.3, -1); r.scale.set(1, 1, 0.9); r.castShadow = true; scene.add(r); tag(r, 'lot');
      
      var pM = M({ color: 0x1E2A47 });
      
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
      parts.driver = person(18.9, 8.9, 'carry', -Math.PI / 2);
      parts.tech = person(15, 6.0, 'walk');
      parts.neighbour = person(29.5, 7.5, 'point', -Math.PI / 2);
      
      var puffG = new THREE.SphereGeometry(0.6, 16, 12); geos.push(puffG);
      parts.puffs = []; for (i = 0; i < 14; i++) { var pm = new THREE.MeshBasicMaterial({ color: 0x8A94AA, transparent: true, opacity: 0 }); mats.push(pm); var pu = new THREE.Mesh(puffG, pm); scene.add(pu); tag(pu, 'sets'); parts.puffs.push(pu); }
      parts.rings = []; for (i = 0; i < 4; i++) { var rgG = new THREE.RingGeometry(0.975, 1, 128); geos.push(rgG); var rm = new THREE.MeshBasicMaterial({ color: 0x2F3640, transparent: true, opacity: 0, side: THREE.DoubleSide }); mats.push(rm); var ri = new THREE.Mesh(rgG, rm); ri.rotation.x = -Math.PI / 2; ri.position.set(4, 0.06, -1.5); scene.add(ri); tag(ri, 'noise'); parts.rings.push(ri); }
      
      parts.L = {
        feed: label('Grid feed: live', [-8, 2.6, 11]),
        fail: label('The grid fails', [-8, 2.6, 11]),
        start: label('The sets start', [8.2, 8.4, -1.5]),
        noise: label('Noise reaches the next lot: [n] dBA at night, limit [n]', [26, 5.2, 6]),
        fuel: label('Fuel from the fill point: 12 h on site', [16, 1.6, 6.8])
      };
    }

    function at0(t) {
      tNow = t;
      var fail = 2.0;
      
      var live = t < fail;
      parts.feed.mesh.material = live ? parts.feedOn : parts.feedOff;
      parts.feedDots.forEach(function (d, i) { d.visible = live; if (live) d.position.copy(parts.feed.curve.getPointAt(((t * 0.35 + i / 5) % 1))); });
      
      var on = t - 2.6;
      parts.puffs.forEach(function (p, i) {
        var s = parts.stacks[i % 2], k = Math.floor(i / 2), ph = on - k * 0.5;
        var hold2 = reduced || t >= D0 - 0.05; if (ph < 0 || hold2) { p.material.opacity = hold2 && k < 3 ? 0.18 - k * 0.04 : 0; if (hold2) { p.position.set(s[0] + k * 0.4, s[1] + 0.6 + k * 1.1, s[2]); p.scale.setScalar(1 + k * 0.5); } return; }
        var c = (ph % 3.5) / 3.5;
        p.position.set(s[0] + c * 1.6, s[1] + 0.4 + c * 4.5, s[2] + c * 0.4); p.scale.setScalar(0.7 + c * 1.8); p.material.opacity = 0.28 * (1 - c);
      });
      
      var n0 = 3.4;
      parts.rings.forEach(function (r, i) {
        var hold = reduced || t >= D0 - 0.05; var ph = hold ? 0.55 + i * 0.13 : (t - n0 - i * 1.1) / 4.2;
        if (ph < 0 || ph > 1) { r.material.opacity = 0; return; }
        var rad = lerp(4, 30, ph); r.scale.set(rad, rad, 1); r.material.opacity = (hold ? 0.75 : 0.9) * (1 - ph * 0.55);
      });
      
      var f0 = 4.5;
      parts.fuelDots.forEach(function (d, i) { var ph = reduced ? i / 6 : (t - f0) * 0.18 - i / 6; d.visible = ph >= 0 || reduced; if (d.visible) d.position.copy(parts.pipe.curve.getPointAt((((ph % 1) + 1) % 1))); });
      
      var w = reduced || t >= D0 - 0.05 ? 1 : ease((t - 3.0) / 4.0);
      parts.tech.position.set(lerp(15, 10.2, w), 0, lerp(6.0, 3.4, w));
      
      var CK = [[0, -2, 3.0, 30, 2.0], [1.8, -1, 3.0, 30, 2.0], [2.8, 6, 3.4, 34, 2.4], [3.4, 6, 3.4, 34, 2.4], [5.0, 14, 16, 58, 0], [6.6, 14, 16, 58, 0], [8.2, 12, 6, 40, 1.6], [9.6, 12, 6, 40, 1.6], [11.2, 13, 12, 68, 1.5], [12, 13, 12, 68, 1.5]];
      var tc = (reduced || t >= D0 - 0.05) ? D0 : t, ki = 0; for (var q = 0; q < CK.length - 2; q++) if (tc > CK[q + 1][0]) ki = q + 1;
      var ka = CK[ki], kb = CK[Math.min(ki + 1, CK.length - 1)], ku = ease((tc - ka[0]) / Math.max(1e-6, kb[0] - ka[0]));
      var cx = lerp(ka[1], kb[1], ku), cy = lerp(ka[2], kb[2], ku), cz = lerp(ka[3], kb[3], ku), ly = lerp(ka[4], kb[4], ku);
      camera.position.set(cx, cy, cz); camera.lookAt(cx, ly, -1);
      
      var L = parts.L;
      L.feed.show = live ? 1 : 0;
      L.fail.show = !live && t < 4.4 ? 1 : 0;
      L.start.show = t >= 2.8 ? 1 : 0;
      L.noise.show = t >= 5.2 ? 1 : 0;
      L.fuel.show = t >= 6.0 ? 1 : 0;
      if (reduced || t >= D0 - 0.05) { L.feed.show = 0; L.fail.show = 1; L.start.show = L.noise.show = L.fuel.show = 1; }
      
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
      STEPS = [{"t": 0, "caption": "The grid feeds the site through the transformer by the street."}, {"t": 4, "caption": "When the grid fails, the standby generators start."}, {"t": 7, "caption": "Their noise spreads across the yard to the next lot."}, {"t": 10.5, "caption": "Fuel comes in at the fill point and runs to the tank under each set."}, {"t": 16, "caption": "The design keeps 12 hours of fuel on site."}]; FOCUS = [["feed"], ["sets", "feed"], ["noise", "sets", "lot"], ["fuel", "sets"], "*"];
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
  BD.anim.register('generator', make());
})();
