// === 新竹政策島 engine：場景、地形、海、天空、鏡頭、標籤 ===
(function () {
  'use strict';
  var G = window.HSINCHU_GEO;
  var ISL = window.ISL = {
    S: 1.6,            // 世界單位 / 公里
    VS: 0.0064,        // 世界單位 / 公尺高程（約 4 倍誇張）
    tick: [], labels: [], pickables: [], nightMats: [], phaseObjs: [], ready: [],
    env: { night: 0, goalNight: 0, future: 0, goalFuture: 0 },
    ok: false
  };
  var S = ISL.S;
  var isMobile = ISL.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 760;

  // ---------- 地理工具 ----------
  var hbin = atob(G.height), HG = new Uint8Array(hbin.length);
  for (var i = 0; i < hbin.length; i++) HG[i] = hbin.charCodeAt(i);
  ISL.elev = function (x, y) { // km -> 公尺
    var n = G.hn, u = (x + G.H) / (2 * G.H) * n - 0.5, v = (G.H - y) / (2 * G.H) * n - 0.5;
    u = Math.max(0, Math.min(n - 1.001, u)); v = Math.max(0, Math.min(n - 1.001, v));
    var iu = u | 0, iv = v | 0, fu = u - iu, fv = v - iv, o = iv * n + iu;
    return (HG[o] * (1 - fu) * (1 - fv) + HG[o + 1] * fu * (1 - fv) + HG[o + n] * (1 - fu) * fv + HG[o + n + 1] * fu * fv) / G.hscale;
  };
  ISL.gy = function (x, y) { var m = ISL.elev(x, y); return m < 0.6 ? 0.03 + m * 0.05 : 0.06 + (m - 0.6) * ISL.VS; };
  ISL.ll = function (lon, lat) { return [(lon - G.lon0) * G.kx, (lat - G.lat0) * G.ky]; };
  ISL.W = function (x, y, lift) { return new THREE.Vector3(x * S, ISL.gy(x, y) + (lift || 0), -y * S); };
  var OUT = G.outline;
  ISL.inside = function (x, y) {
    var c = false;
    for (var i = 0, j = OUT.length - 1; i < OUT.length; j = i++) {
      var xi = OUT[i][0], yi = OUT[i][1], xj = OUT[j][0], yj = OUT[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  };
  ISL.col = function (hex) { return new THREE.Color(hex).convertSRGBToLinear(); };
  ISL.lerp = function (a, b, t) { return a + (b - a) * t; };
  ISL.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  ISL.smooth = function (t) { t = ISL.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  ISL.backOut = function (t) { t = ISL.clamp(t, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  // 路徑（弧長參數化）
  function Path(pts) {
    this.p = pts; this.len = [0];
    for (var i = 1; i < pts.length; i++) this.len.push(this.len[i - 1] + pts[i].distanceTo(pts[i - 1]));
    this.total = this.len[this.len.length - 1];
  }
  Path.prototype.idx = function (s) {
    var a = 0, b = this.len.length - 1;
    while (b - a > 1) { var m = (a + b) >> 1; if (this.len[m] <= s) a = m; else b = m; }
    return a;
  };
  Path.prototype.at = function (s, out) {
    s = ISL.clamp(s, 0, this.total); var i = this.idx(s), l0 = this.len[i], l1 = this.len[i + 1] || l0 + 1e-6;
    return (out || new THREE.Vector3()).lerpVectors(this.p[i], this.p[Math.min(i + 1, this.p.length - 1)], (s - l0) / (l1 - l0 || 1));
  };
  Path.prototype.dir = function (s, out) {
    var i = Math.min(this.idx(ISL.clamp(s, 0, this.total)), this.p.length - 2);
    return (out || new THREE.Vector3()).subVectors(this.p[i + 1], this.p[i]).normalize();
  };
  Path.prototype.nearest = function (v) { // 回傳最接近 v 的弧長
    var best = 1e9, bs = 0;
    for (var i = 0; i < this.p.length; i++) { var d = (this.p[i].x - v.x) * (this.p[i].x - v.x) + (this.p[i].z - v.z) * (this.p[i].z - v.z); if (d < best) { best = d; bs = this.len[i]; } }
    return bs;
  };
  ISL.Path = Path;
  ISL.pathFromKm = function (arr, lift, step) { // 依地形重新取樣
    var pts = [], st = step || 0.07;
    for (var i = 0; i < arr.length - 1; i++) {
      var a = arr[i], b = arr[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / st));
      for (var k = 0; k < n; k++) { var t = k / n; pts.push(ISL.W(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, lift)); }
    }
    if (arr.length) { var e = arr[arr.length - 1]; pts.push(ISL.W(e[0], e[1], lift)); }
    return new Path(pts);
  };

  // ---------- Renderer ----------
  var canvas = document.getElementById('scene');
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isMobile || window.devicePixelRatio < 2.5, powerPreference: 'high-performance' });
  } catch (e) { document.documentElement.classList.add('no-webgl'); return; }
  if (!renderer || !renderer.getContext()) { document.documentElement.classList.add('no-webgl'); return; }
  ISL.ok = true;
  ISL.renderer = renderer;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = ISL.scene = new THREE.Scene();
  var camera = ISL.camera = new THREE.PerspectiveCamera(34, 1, 0.3, 900);
  var C = ISL.col;
  var DAY = { top: C('#3d94e6'), hor: C('#d6ecff'), fog: C('#cfe6fb'), sun: C('#fff1d6'), hemS: C('#dff0ff'), hemG: C('#b9c9a8'), wS: C('#7fd6e8'), wD: C('#2f7fc4') };
  var NGT = { top: C('#040a1c'), hor: C('#1a2a55'), fog: C('#101c3d'), sun: C('#8fb2ff'), hemS: C('#7f9fe6'), hemG: C('#2b3c6b'), wS: C('#1d4f7a'), wD: C('#07162e') };
  scene.fog = new THREE.Fog(DAY.fog.clone(), 70, 210);

  var hemi = new THREE.HemisphereLight(DAY.hemS.clone(), DAY.hemG.clone(), 0.58);
  scene.add(hemi);
  var sun = ISL.sun = new THREE.DirectionalLight(DAY.sun.clone(), 1.08);
  sun.position.set(-30, 46, 24); sun.castShadow = true;
  var sm = isMobile ? 2048 : 4096;
  sun.shadow.mapSize.set(sm, sm);
  var sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 5; sc.far = 130;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);

  // 天空
  var skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: DAY.top.clone() }, hor: { value: DAY.hor.clone() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, 0.55)); gl_FragColor = vec4(c, 1.0);\n#include <encodings_fragment>\n}'
  });
  var sky = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 14), skyMat); scene.add(sky);
  // 星星
  var sp = [];
  for (i = 0; i < 700; i++) { var th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.9 + 0.08); sp.push(400 * Math.sin(ph) * Math.cos(th), 400 * Math.cos(ph), 400 * Math.sin(ph) * Math.sin(th)); }
  var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  var stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(stars);

  // ---------- 載入貼圖 ----------
  var mgr = new THREE.LoadingManager();
  var tl = new THREE.TextureLoader(mgr);
  function tex(u, srgb) { var t = tl.load('assets/' + u); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }
  var tGround = tex('ground.jpg?v=3', true), tGlow = tex('glow.jpg?v=3', true), tMask = tex('mask.png?v=3'), tShore = tex('shore.png?v=3');
  mgr.onLoad = function () { ISL.loaded = true; ISL.ready.forEach(function (f) { f(); }); };
  mgr.onError = function (u) { console.warn('asset failed', u); };

  // ---------- 地形 ----------
  var terrainMat;
  (function () {
    var n = G.hn, H = G.H, vs = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2), ins = new Uint8Array(n * n);
    for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) {
      var x = -H + (i + 0.5) * 2 * H / n, y = H - (j + 0.5) * 2 * H / n, o = j * n + i;
      vs[o * 3] = x * S; vs[o * 3 + 1] = ISL.gy(x, y); vs[o * 3 + 2] = -y * S;
      uv[o * 2] = (x + H) / (2 * H); uv[o * 2 + 1] = (y + H) / (2 * H);
      ins[o] = ISL.inside(x, y) ? 1 : 0;
    }
    var near = new Uint8Array(n * n);
    for (j = 1; j < n - 1; j++) for (i = 1; i < n - 1; i++) {
      o = j * n + i;
      if (ins[o] || ins[o - 1] || ins[o + 1] || ins[o - n] || ins[o + n] || ins[o - n - 1] || ins[o - n + 1] || ins[o + n - 1] || ins[o + n + 1]) near[o] = 1;
    }
    var idx = [];
    for (j = 0; j < n - 1; j++) for (i = 0; i < n - 1; i++) {
      o = j * n + i;
      if (near[o] || near[o + 1] || near[o + n] || near[o + n + 1]) idx.push(o, o + n, o + 1, o + 1, o + n, o + n + 1);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(vs, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    terrainMat = new THREE.MeshStandardMaterial({ map: tGround, alphaMap: tMask, alphaTest: 0.5, roughness: 0.96, metalness: 0, emissive: 0xffffff, emissiveMap: tGlow, emissiveIntensity: 0 });
    var m = ISL.terrain = new THREE.Mesh(g, terrainMat); m.receiveShadow = true; scene.add(m);

    // 崖壁
    var wp = [], wc = [], wi = [], top = C('#c9ad7c'), mid = C('#8d7557'), bot = C('#1d3554'), k = 0;
    for (var a = 0; a < OUT.length; a++) {
      var p = OUT[a], q = OUT[(a + 1) % OUT.length], d = Math.hypot(q[0] - p[0], q[1] - p[1]), st = Math.max(1, Math.ceil(d / 0.09));
      for (var s = 0; s < st; s++) {
        var t0 = s / st, t1 = (s + 1) / st, ax = p[0] + (q[0] - p[0]) * t0, ay = p[1] + (q[1] - p[1]) * t0, bx = p[0] + (q[0] - p[0]) * t1, by = p[1] + (q[1] - p[1]) * t1;
        var ha = ISL.gy(ax, ay) + 0.004, hb = ISL.gy(bx, by) + 0.004;
        wp.push(ax * S, ha, -ay * S, bx * S, hb, -by * S, ax * S, ha * 0.45 - 0.05, -ay * S, bx * S, hb * 0.45 - 0.05, -by * S, ax * S, -1.4, -ay * S, bx * S, -1.4, -by * S);
        wc.push(top.r, top.g, top.b, top.r, top.g, top.b, mid.r, mid.g, mid.b, mid.r, mid.g, mid.b, bot.r, bot.g, bot.b, bot.r, bot.g, bot.b);
        wi.push(k, k + 2, k + 1, k + 1, k + 2, k + 3, k + 2, k + 4, k + 3, k + 3, k + 4, k + 5); k += 6;
      }
    }
    var wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3));
    wg.setIndex(wi); wg.computeVertexNormals();
    scene.add(new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  })();

  // ---------- 海 ----------
  var waterMat = new THREE.ShaderMaterial({
    transparent: true, fog: false,
    uniforms: { t: { value: 0 }, cS: { value: DAY.wS.clone() }, cD: { value: DAY.wD.clone() }, cF: { value: DAY.fog.clone() }, shore: { value: tShore }, hsz: { value: G.H * S }, night: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float t; uniform float hsz; uniform float night; uniform vec3 cS; uniform vec3 cD; uniform vec3 cF; uniform sampler2D shore; varying vec3 vW;',
      'void main(){',
      '  vec2 uv = vec2(vW.x/(2.0*hsz)+0.5, 0.5 - vW.z/(2.0*hsz));',
      '  float inb = step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);',
      '  float sd = mix(1.0, texture2D(shore, uv).r, inb);',
      '  vec3 col = mix(cS, cD, smoothstep(0.0, 0.85, sd));',
      '  float w1 = sin(vW.x*1.3 + vW.z*0.8 + t*1.2)*0.5+0.5;',
      '  float w2 = sin(vW.x*-0.7 + vW.z*1.9 + t*0.9 + 1.7)*0.5+0.5;',
      '  float w3 = sin(vW.x*3.1 - vW.z*2.3 + t*1.7)*0.5+0.5;',
      '  col += pow(w1*w2, 5.0)*0.07 + pow(w2*w3, 7.0)*0.045;',
      '  float band = sin(sd*46.0 - t*1.5 + sin(vW.x*0.9+vW.z*1.1)*1.3);',
      '  float foam = smoothstep(0.72,1.0,band) * (1.0 - smoothstep(0.02,0.42,sd));',
      '  foam += (1.0 - smoothstep(0.0, 0.03, sd))*0.9;',
      '  col = mix(col, vec3(1.0), clamp(foam,0.0,1.0)*0.5*(1.0-night*0.65));',
      '  col = mix(col, cF, smoothstep(45.0, 190.0, length(vW.xz)));',
      '  gl_FragColor = vec4(col, 0.93);',
      '  #include <encodings_fragment>',
      '}'].join('\n')
  });
  var water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), waterMat); water.renderOrder = 1; scene.add(water);

  // ---------- 鏡頭 ----------
  var cam = ISL.cam = { t: new THREE.Vector3(0.4, 0.3, 0.2), dist: 38, az: 0.32, pol: 0.98, g: { t: new THREE.Vector3(0.4, 0.3, 0.2), dist: 38, az: 0.32, pol: 0.98 }, auto: true, speed: 4.2, minD: 3.2, maxD: 78 };
  ISL.home = function () { ISL.flyTo({ x: 0.4, z: 0.2, dist: ISL.homeDist(), az: 0.32, pol: 0.98 }); };
  ISL.flyTo = function (o) {
    if (o.x !== undefined) cam.g.t.set(o.x, o.y !== undefined ? o.y : 0.3, o.z);
    if (o.dist !== undefined) cam.g.dist = ISL.clamp(o.dist, cam.minD, cam.maxD);
    if (o.pol !== undefined) cam.g.pol = o.pol;
    if (o.az !== undefined) { var d = o.az - cam.g.az; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.g.az += d; }
    cam.speed = o.speed || 2.6;
  };
  var rideOn = false, rideLook = new THREE.Vector3();
  function camApply(dt) {
    var k = 1 - Math.exp(-dt * cam.speed);
    cam.t.lerp(cam.g.t, k); cam.dist += (cam.g.dist - cam.dist) * k; cam.az += (cam.g.az - cam.az) * k; cam.pol += (cam.g.pol - cam.pol) * k;
    if (ISL.rideCam) { // 搭乘視角：鏡頭跟著車輛
      var first = !rideOn, rk = first || camera.position.distanceTo(ISL.rideCam.pos) > 3 ? 1 : 1 - Math.exp(-dt * 5);
      camera.position.lerp(ISL.rideCam.pos, rk); rideLook.lerp(ISL.rideCam.look, rk); camera.lookAt(rideLook); if (ISL.rideCam.roll) camera.rotateZ(ISL.rideCam.roll);
      if (camera.view) camera.clearViewOffset();
      if (first) { rideOn = true; camera.fov = 68; camera.near = .012; camera.updateProjectionMatrix(); }
      return;
    }
    if (rideOn) { rideOn = false; camera.near = .3; resize(); }
    var sp_ = Math.sin(cam.pol), off = ISL.offsetX || 0;
    camera.position.set(cam.t.x + cam.dist * sp_ * Math.sin(cam.az), cam.t.y + cam.dist * Math.cos(cam.pol), cam.t.z + cam.dist * sp_ * Math.cos(cam.az));
    camera.lookAt(cam.t);
    if (off) camera.setViewOffset(vw, vh, off, ISL.offsetY || 0, vw, vh); else if (camera.view) camera.clearViewOffset();
  }
  var vw = 1, vh = 1;
  function resize() {
    vw = window.innerWidth; vh = window.innerHeight;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.fov = rideOn ? 68 : vw < vh ? 46 : 34; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();
  ISL.homeDist = function () { return vw < vh ? 60 : vw < 900 ? 46 : 38; };
  cam.dist = cam.g.dist = ISL.homeDist();

  // 輸入
  var ptrs = {}, nP = 0, moved = 0, downAt = 0, lastPinch = 0, lastAng = 0, rotating = false;
  function userTouch() { cam.auto = false; cam.speed = 9; if (ISL.onUserMove) ISL.onUserMove(); }
  function pan(dx, dy) {
    var k = cam.dist * Math.tan(camera.fov * Math.PI / 360) * 2 / vh, ca = Math.cos(cam.az), sa = Math.sin(cam.az);
    var fy = dy / Math.max(0.35, Math.cos(cam.pol));
    cam.g.t.x += (-ca * dx - sa * fy) * k; cam.g.t.z += (sa * dx - ca * fy) * k;
    var r = Math.hypot(cam.g.t.x, cam.g.t.z), mx = 15; if (r > mx) { cam.g.t.x *= mx / r; cam.g.t.z *= mx / r; }
    cam.g.t.y = 0.3;
  }
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; nP = Object.keys(ptrs).length;
    moved = 0; downAt = performance.now(); rotating = e.button === 2 || e.shiftKey || e.ctrlKey;
    if (nP === 2) { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); lastAng = Math.atan2(b.y - a.y, b.x - a.x); }
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = ptrs[e.pointerId];
    if (!p) { if (!isMobile && ISL.onHover) ISL.onHover(e.clientX, e.clientY); return; }
    var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (moved < 4) return;
    userTouch();
    if (nP === 1) {
      if (rotating) { cam.g.az -= dx * 0.006; cam.g.pol = ISL.clamp(cam.g.pol - dy * 0.005, 0.12, 1.36); }
      else pan(dx, dy);
    } else if (nP === 2) {
      var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (lastPinch) cam.g.dist = ISL.clamp(cam.g.dist * lastPinch / d, cam.minD, cam.maxD);
      var da = ang - lastAng; da = Math.atan2(Math.sin(da), Math.cos(da)); cam.g.az -= da;
      lastPinch = d; lastAng = ang;
    }
  });
  function up(e) {
    var had = ptrs[e.pointerId]; delete ptrs[e.pointerId]; nP = Object.keys(ptrs).length; lastPinch = 0;
    if (had && nP === 0 && moved < 7 && performance.now() - downAt < 600 && ISL.onClick) ISL.onClick(e.clientX, e.clientY);
  }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault(); userTouch();
    if (e.ctrlKey || e.shiftKey) { cam.g.az += e.deltaY * 0.002; return; }
    cam.g.dist = ISL.clamp(cam.g.dist * Math.exp(e.deltaY * 0.0011), cam.minD, cam.maxD);
  }, { passive: false });
  ISL.zoom = function (f) { userTouch(); cam.g.dist = ISL.clamp(cam.g.dist * f, cam.minD, cam.maxD); cam.speed = 5; };
  ISL.rotate = function (d) { userTouch(); cam.g.az += d; cam.speed = 5; };
  ISL.tilt = function (d) { userTouch(); cam.g.pol = ISL.clamp(cam.g.pol + d, 0.12, 1.36); cam.speed = 5; };
  window.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    var k = e.key;
    if (k === 'ArrowLeft') { userTouch(); pan(60, 0); } else if (k === 'ArrowRight') { userTouch(); pan(-60, 0); }
    else if (k === 'ArrowUp') { userTouch(); pan(0, 60); } else if (k === 'ArrowDown') { userTouch(); pan(0, -60); }
    else if (k === '+' || k === '=') ISL.zoom(0.8); else if (k === '-' || k === '_') ISL.zoom(1.25);
    else if (k === 'q' || k === 'Q') ISL.rotate(0.25); else if (k === 'e' || k === 'E') ISL.rotate(-0.25);
    else if (k === 'Home') ISL.home(); else return;
    e.preventDefault();
  });

  // 點選
  var ray = new THREE.Raycaster(), nd = new THREE.Vector2();
  ISL.pick = function (cx, cy) {
    nd.set(cx / vw * 2 - 1, -(cy / vh) * 2 + 1); ray.setFromCamera(nd, camera);
    var hit = ray.intersectObjects(ISL.pickables, true);
    for (var i = 0; i < hit.length; i++) { var o = hit[i].object; while (o) { if (o.userData && o.userData.site && o.visible) return o.userData.site; o = o.parent; } }
    return null;
  };

  // ---------- HTML 標籤 ----------
  var layer = document.getElementById('labels'), pv = new THREE.Vector3();
  ISL.addLabel = function (o) {
    var el = document.createElement(o.onClick ? 'button' : 'div');
    el.className = 'lb lb-' + o.kind; if (o.onClick) { el.type = 'button'; el.addEventListener('click', o.onClick); }
    el.innerHTML = o.html; layer.appendChild(el);
    var L = { el: el, pos: o.pos, kind: o.kind, pr: o.pr || 0, on: false, force: false, hide: false, w: 0, h: 0, site: o.site || null };
    ISL.labels.push(L); return L;
  };
  var lbFrame = 0, rects = [];
  function labelsUpdate() {
    lbFrame++; var doLayout = lbFrame % 6 === 0, d = ISL.rideCam ? 13 : cam.dist, i, L;
    if (doLayout) { rects.length = 0; ISL.labels.sort(function (a, b) { return (b.force ? 100 : 0) + b.pr - (a.force ? 100 : 0) - a.pr; }); }
    for (i = 0; i < ISL.labels.length; i++) {
      L = ISL.labels[i]; pv.copy(L.pos).project(camera);
      var ok = pv.z < 1 && pv.z > -1 && Math.abs(pv.x) < 1.08 && Math.abs(pv.y) < 1.1 && !L.hide;
      var sx = (pv.x * 0.5 + 0.5) * vw, sy = (-pv.y * 0.5 + 0.5) * vh;
      if (ok && !L.force) {
        if (L.kind === 'site') ok = L.pr >= (d > 50 ? 8 : d > 36 ? 6 : d > 24 ? 4 : 0);
        else if (L.kind === 'district') ok = d > 20;
        else if (L.kind === 'place' || L.kind === 'station') ok = d < 30;
        else if (L.kind === 'road' || L.kind === 'water') ok = d < 40;
      }
      if (doLayout) {
        if (ok) {
          if (!L.w) { L.w = L.el.offsetWidth || 80; L.h = L.el.offsetHeight || 22; }
          var x0 = sx - L.w / 2 - 3, x1 = sx + L.w / 2 + 3, y0 = sy - L.h - 8, y1 = sy + 2, clash = false;
          if (L.kind !== 'district' && L.kind !== 'sea') {
            for (var r = 0; r < rects.length; r++) { var R = rects[r]; if (x0 < R[2] && x1 > R[0] && y0 < R[3] && y1 > R[1]) { clash = true; break; } }
            if (!clash || L.force) rects.push([x0, y0, x1, y1]); if (clash && !L.force) ok = false;
          }
        }
        if (ok !== L.on) { L.on = ok; L.el.classList.toggle('on', ok); }
      }
      if (L.on) L.el.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0)';
    }
  }

  // ---------- 材質 ----------
  var mcache = {};
  ISL.mat = function (hex, o) {
    o = o || {}; var key = hex + '|' + (o.em || '') + '|' + (o.ei || 0) + '|' + (o.op || 1) + '|' + (o.always ? 1 : 0) + '|' + (o.rough || '') + '|' + (o.smooth ? 1 : 0) + '|' + (o.metal || '');
    if (mcache[key] && !o.unique) return mcache[key];
    var m = new THREE.MeshStandardMaterial({ color: C(hex), roughness: o.rough !== undefined ? o.rough : 0.82, metalness: o.metal || 0.02, flatShading: !o.smooth });
    if (o.op !== undefined && o.op < 1) { m.transparent = true; m.opacity = o.op; m.depthWrite = o.op > 0.6; }
    if (o.em) { m.emissive = C(o.em); m.userData.em = o.ei || 1; m.userData.always = !!o.always; m.emissiveIntensity = o.always ? m.userData.em : 0; ISL.nightMats.push(m); }
    if (!o.unique) mcache[key] = m; return m;
  };
  ISL.glowMat = function (hex, op) { return new THREE.MeshBasicMaterial({ color: C(hex), transparent: true, opacity: op === undefined ? 0.6 : op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }); };

  // ---------- 環境（日夜） ----------
  var lastN = -1;
  function envApply() {
    var n = ISL.env.night; if (Math.abs(n - lastN) < 0.0005) return; lastN = n;
    function L(a, b, out) { return out.copy(a).lerp(b, n); }
    L(DAY.top, NGT.top, skyMat.uniforms.top.value); L(DAY.hor, NGT.hor, skyMat.uniforms.hor.value);
    L(DAY.fog, NGT.fog, scene.fog.color); L(DAY.fog, NGT.fog, waterMat.uniforms.cF.value);
    L(DAY.wS, NGT.wS, waterMat.uniforms.cS.value); L(DAY.wD, NGT.wD, waterMat.uniforms.cD.value); waterMat.uniforms.night.value = n;
    L(DAY.sun, NGT.sun, sun.color); sun.intensity = ISL.lerp(1.08, 0.34, n);
    L(DAY.hemS, NGT.hemS, hemi.color); L(DAY.hemG, NGT.hemG, hemi.groundColor); hemi.intensity = ISL.lerp(0.58, 0.66, n);
    terrainMat.emissiveIntensity = n * 2.6; stars.material.opacity = n * 0.9;
    for (var i = 0; i < ISL.nightMats.length; i++) { var m = ISL.nightMats[i]; if (!m.userData.always) m.emissiveIntensity = m.userData.em * n; }
    document.documentElement.classList.toggle('night', n > 0.5);
    if (ISL.onEnv) ISL.onEnv(n);
  }
  // 現在／未來：userData.fut=1 只在未來出現；userData.pre=1 只在現在出現
  var lastF = -1;
  ISL.regPhase = function (obj) { obj.userData.bs = obj.scale.clone(); ISL.phaseObjs.push(obj); };
  function phaseApply() {
    var f = ISL.env.future; if (Math.abs(f - lastF) < 0.0005) return; lastF = f;
    for (var i = 0; i < ISL.phaseObjs.length; i++) {
      var o = ISL.phaseObjs[i], dl = o.userData.delay || 0, loc = ISL.clamp(f * 1.6 - dl * 0.6, 0, 1), k;
      if (o.userData.fut) k = ISL.backOut(loc); else k = 1 - ISL.smooth(ISL.clamp(f * 1.8, 0, 1));
      o.visible = k > 0.002; if (o.visible) o.scale.copy(o.userData.bs).multiplyScalar(Math.max(k, 0.001));
    }
    if (ISL.onPhase) ISL.onPhase(f);
  }

  // ---------- 主迴圈 ----------
  var clock = new THREE.Clock(), T = 0, fN = 0, qAcc = 0, qN = 0, qual = 2, shadowEvery = isMobile ? 3 : 2;
  renderer.shadowMap.autoUpdate = false;
  function degrade() { // 畫面太慢時自動降低畫質
    qual--;
    if (qual === 1) { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25)); shadowEvery = 5; }
    else { renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; sun.castShadow = false; scene.traverse(function (o) { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; }); }
    resize();
  }
  function frame() {
    requestAnimationFrame(frame);
    var raw = clock.getDelta(), dt = Math.min(raw, 0.05); T += dt; ISL.time = T; fN++;
    if (raw < 0.25 && T > 2.5 && qual > 0) { qAcc += raw; qN++; if (qN >= 80) { if (qAcc / qN > 1 / 23) degrade(); qAcc = 0; qN = 0; } }
    var e = ISL.env;
    e.night += (e.goalNight - e.night) * (1 - Math.exp(-dt * 2.6));
    var df = e.goalFuture - e.future; e.future += Math.sign(df) * Math.min(Math.abs(df), dt / 2.6);
    if (cam.auto) cam.g.az += dt * 0.035;
    camApply(dt); envApply(); phaseApply();
    waterMat.uniforms.t.value = T;
    for (var i = 0; i < ISL.tick.length; i++) ISL.tick[i](dt, T);
    if (renderer.shadowMap.enabled && fN % shadowEvery === 0) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    labelsUpdate();
  }
  ISL.start = function () { clock.start(); frame(); };
})();
