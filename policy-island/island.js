// === 新竹政策島 island：地標、動態、互動介面 ===
(function () {
  'use strict';
  var ISL = window.ISL, D = window.ISLAND_DATA, G = window.HSINCHU_GEO;
  var $ = function (s) { return document.querySelector(s); };
  var PM = {}, SM = {};
  D.policies.forEach(function (p) { PM[p.id] = p; });
  D.sites.forEach(function (s) { SM[s.id] = s; });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sitesOf(pid) { return D.sites.filter(function (s) { return s.p.indexOf(pid) >= 0; }).sort(function (a, b) { return b.pr - a.pr; }); }

  // ================= 文字版（無 WebGL 也能讀，並有助搜尋引擎） =================
  (function () {
    var h = '';
    D.policies.forEach(function (p) {
      h += '<article class="tl-item" style="--c:' + p.color + '"><h3><span>' + esc(p.no) + '</span>' + esc(p.title) + '</h3><p class="tl-hook">' + esc(p.hook) + '</p><p>' + esc(p.summary) + '</p>';
      p.items.forEach(function (it) { h += '<h4>' + esc(it.t) + '</h4><ul>' + it.d.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>'; });
      if (p.fb) h += '<p><a href="' + p.fb + '" target="_blank" rel="noreferrer">在 Facebook 看完整說明 →</a></p>';
      h += '</article>';
    });
    $('#textlistBody').innerHTML = h;
  })();
  function openText(on) { $('#textlist').classList.toggle('open', on); }
  $('#btnText').addEventListener('click', function () { openText(true); });
  $('#textClose').addEventListener('click', function () { openText(false); });

  if (!ISL || !ISL.ok) { document.documentElement.classList.add('no-webgl'); openText(true); $('#loader').classList.add('gone'); $('#intro').classList.add('gone'); return; }

  var B = ISL.models, HP = B.helpers, S = ISL.S, scene = ISL.scene, M = ISL.mat, env = ISL.env, cam = ISL.cam;
  var state = { policy: null, site: null, persona: null, tour: null, visited: {}, hl: {} };
  try { (JSON.parse(localStorage.getItem('cyh-island-visited') || '[]')).forEach(function (k) { if (PM[k]) state.visited[k] = 1; }); } catch (e) { }

  // ================= 散佈：房屋與樹 =================
  function stationKm(name) { for (var i = 0; i < G.stations.length; i++) if (G.stations[i].name === name) return G.stations[i].p; return null; }
  D.sites.forEach(function (s) { s.kmPos = s.km || (s.st && stationKm(s.st)) || ISL.ll(s.ll[0], s.ll[1]); });
  function nearSite(x, y) { for (var i = 0; i < D.sites.length; i++) { var s = D.sites[i], r = (s.type === 'wetland' ? .25 : .62) * s.s * 1.25 / S; if (Math.abs(x - s.kmPos[0]) < r && Math.abs(y - s.kmPos[1]) < r && Math.hypot(x - s.kmPos[0], y - s.kmPos[1]) < r) return true; } return false; }
  function nearBrt(x, y) {
    var ks = ['gongdao5', 'jingguo', 'zhonghua'];
    for (var a = 0; a < ks.length; a++) { var r = G.roads[ks[a]] || []; for (var i = 0; i < r.length - 1; i++) { var ax = r[i][0], ay = r[i][1], dx = r[i + 1][0] - ax, dy = r[i + 1][1] - ay, tt = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); if (Math.hypot(x - ax - tt * dx, y - ay - tt * dy) < .13) return true; } }
    return false;
  }
  (function () {
    var bl = G.bld, n = bl.length / 3, dm = new THREE.Object3D(), c = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    function winTex(lit) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 64; var c = cv.getContext('2d'); c.fillStyle = lit ? '#000' : '#fff'; c.fillRect(0, 0, 64, 64);
      for (var r = 0; r < 4; r++) for (var q = 0; q < 4; q++) { if (lit) { if (Math.random() < .45) continue; c.fillStyle = Math.random() < .7 ? '#ffd58a' : '#bfe3ff'; } else c.fillStyle = (r + q) % 3 ? '#8fa6bd' : '#a9bccd'; c.fillRect(5 + q * 15, 6 + r * 15, 9, 9); }
      var t = new THREE.CanvasTexture(cv); if (!lit) t.encoding = THREE.sRGBEncoding; else t.encoding = THREE.sRGBEncoding; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; return t;
    }
    var bGeo = new THREE.BoxGeometry(1, 1, 1), buv = bGeo.attributes.uv; for (var ui = 8; ui < 16; ui++) buv.setXY(ui, .01, .99); // 屋頂與底面不貼窗戶
    var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, flatShading: true, map: winTex(false), emissiveMap: winTex(true) });
    mat.emissive = new THREE.Color(0xffffff); mat.userData.em = 1.5; mat.emissiveIntensity = 0; ISL.nightMats.push(mat);
    var im = new THREE.InstancedMesh(bGeo, mat, n), st = ISL.ll(120.9716, 24.8016);
    var pal = ['#e8dcc8', '#d9cdb9', '#efe4d0', '#cfc5b4', '#e6d2bf', '#cdd6df', '#eadbc9', '#c98a6a', '#9fb0c2', '#d8b89a'], ind = ['#dfe6ee', '#d3deea', '#c9d9ec', '#e6ecf2'];
    for (var i = 0; i < n; i++) {
      var x = bl[i * 3] / 100, y = bl[i * 3 + 1] / 100, t = bl[i * 3 + 2], d = Math.hypot(x - st[0], y - st[1]);
      var core = Math.max(0, 1 - d / 3.2), h = t ? .05 + Math.random() * .06 : .045 + Math.random() * .07 + (Math.random() < .12 + core * .3 ? Math.random() * .22 * (.4 + core) : 0);
      var w = t ? .09 + Math.random() * .08 : .05 + Math.random() * .05, dp = t ? .08 + Math.random() * .07 : .05 + Math.random() * .05;
      dm.position.set(x * S, ISL.gy(x, y) + h / 2 - .005, -y * S); dm.scale.set(w, h, dp); dm.rotation.y = .62 + (Math.random() < .5 ? 0 : Math.PI / 2) + (Math.random() - .5) * .25; dm.updateMatrix();
      im.setMatrixAt(i, (nearSite(x, y) || nearBrt(x, y)) ? ZERO : dm.matrix); c.copy(ISL.col((t ? ind : pal)[(Math.random() * (t ? ind.length : pal.length)) | 0])); im.setColorAt(i, c);
    }
    im.castShadow = true; im.receiveShadow = true; scene.add(im); ISL.buildings = im;
    var tr = G.trees, tn = tr.length / 2, tm = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, flatShading: true }), tn);
    var gp = ['#3f8f4a', '#4fa35a', '#5fae5a', '#357f42', '#6ab562'];
    for (i = 0; i < tn; i++) {
      x = tr[i * 2] / 100; y = tr[i * 2 + 1] / 100; h = .13 + Math.random() * .13;
      dm.position.set(x * S, ISL.gy(x, y) + h / 2, -y * S); dm.scale.set(.045 + Math.random() * .035, h, .045 + Math.random() * .035); dm.rotation.y = Math.random() * 3; dm.updateMatrix();
      tm.setMatrixAt(i, nearSite(x, y) ? ZERO : dm.matrix); c.copy(ISL.col(gp[(Math.random() * gp.length) | 0])); tm.setColorAt(i, c);
    }
    tm.castShadow = true; scene.add(tm);
  })();

  // ================= 地標 =================
  var anims = [], glows = [], siteObjs = {};
  var NOPAD = { wetland: 1, harbor: 1, signal: 1, brtstop: 1, lake: 1 }, GREENPAD = { peak: 1, park: 1, campus: 1, village: 1, jhouse: 1, housing: 1 };
  D.sites.forEach(function (s) {
    var km = s.kmPos;
    var outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner);
    var y = ISL.gy(km[0], km[1]); if (s.type === 'lake') y = ISL.gy(km[0], km[1]) + .01;
    outer.position.set(km[0] * S, y, -km[1] * S); outer.scale.setScalar(s.s);
    if (!NOPAD[s.type]) HP.cyl(inner, M(GREENPAD[s.type] ? '#9fcf86' : '#dcd6c8'), s.type === 'dome' ? .82 : .66, .32, 0, -.32, 0, 26).userData.pad = 1;
    B[s.type](inner, s);
    if (s.future) { inner.userData.fut = 1; inner.userData.delay = 0; }
    inner.traverse(function (o) {
      if (o.isMesh) { if (o.material && !o.material.isMeshBasicMaterial && !o.userData.pad) o.castShadow = true; if (o.userData.pad) o.receiveShadow = true; }
      if (o.userData.fut || o.userData.pre) ISL.regPhase(o);
      if (o.userData.nightGlow) glows.push(o);
    });
    if (inner.userData.anim) anims.push(inner.userData.anim);
    outer.userData.site = s.id; scene.add(outer); ISL.pickables.push(outer);
    var bb = new THREE.Box3().setFromObject(inner), top = Math.min(1.3, Math.max(.45, bb.max.y - outer.position.y));
    // 光柱 + 地面光環（選取時亮起）
    var bc = new THREE.Group(); bc.position.set(km[0] * S, y + .04, -km[1] * S); bc.visible = false;
    var ring = new THREE.Mesh(new THREE.RingGeometry(.72, .82, 40).rotateX(-Math.PI / 2), ISL.glowMat('#ffffff', .8)); bc.add(ring);
    var ring2 = new THREE.Mesh(new THREE.RingGeometry(.72, .78, 40).rotateX(-Math.PI / 2), ISL.glowMat('#ffffff', .5)); bc.add(ring2);
    var pil = new THREE.Mesh(new THREE.CylinderGeometry(.5, .68, 3.4, 20, 1, true).translate(0, 1.7, 0), ISL.glowMat('#ffffff', .1)); bc.add(pil);
    bc.scale.setScalar(Math.max(.6, s.s)); scene.add(bc);
    var dots = s.p.map(function (pid) { return '<i style="background:' + PM[pid].color + '"></i>'; }).join('');
    var lb = ISL.addLabel({ kind: 'site', pr: s.pr, site: s.id, pos: new THREE.Vector3(km[0] * S, y + top * s.s + .12, -km[1] * S), html: '<span class="dots">' + dots + '</span><b>' + esc(s.name) + '</b>', onClick: function () { selectSite(s.id); } });
    var halo = new THREE.Mesh(new THREE.RingGeometry(.8, 1.0, 44).rotateX(-Math.PI / 2), ISL.glowMat(PM[s.p[0]].color, 0)); halo.position.set(km[0] * S, y + .05, -km[1] * S); halo.scale.setScalar(Math.max(.55, s.s)); halo.visible = false; scene.add(halo);
    siteObjs[s.id] = { halo: halo, outer: outer, inner: inner, beacon: bc, ring: ring, ring2: ring2, pil: pil, label: lb, top: top, y: y, pos: outer.position };
  });

  // 「現在」的問題標籤（文字取自政見說明），切到未來後消失
  var issueLabels = [];
  [['station', '🚧 平交道阻隔前後站'], ['aisignal', '🚗 光復路天天塞'], ['expo', '⛔ 展演中心遲未復工'], ['guanpu', '😣 熱門學區抽不到'], ['eastgate', '🌑 晚上 9 點舊城就暗了'], ['care', '⏰ 下午 4 點就要接小孩'], ['police', '📞 防不了的詐騙電話'], ['market', '💸 物價高漲，飯錢變貴'], ['nthu', '🎒 畢業就打包去台北'], ['bigcity', '🅿️ 找車位更塞']].forEach(function (it) {
    var so = siteObjs[it[0]]; issueLabels.push(ISL.addLabel({ kind: 'issue', pr: 12, pos: so.label.pos, html: esc(it[1]), onClick: function () { selectSite(it[0]); } }));
  });
  // 車站小模型（非主站）
  G.stations.forEach(function (st) {
    if (st.name === '新竹') return;
    var g = new THREE.Group(), p = ISL.W(st.p[0], st.p[1]); g.position.copy(p); g.scale.setScalar(.5);
    HP.box(g, M('#eadfc8'), .34, .1, .16, 0, 0, .14); HP.prism(g, M('#55645d'), .4, .07, .22, 0, .1, .14); HP.box(g, M('#9aa7b3'), .5, .02, .1, 0, .09, 0);
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); scene.add(g);
    ISL.addLabel({ kind: 'station', pr: 2, pos: p.clone().setY(p.y + .22), html: '🚉 ' + esc(st.name) + '站' });
  });
  D.geoLabels.forEach(function (l) { var k = ISL.ll(l.ll[0], l.ll[1]); ISL.addLabel({ kind: l.k, pr: l.k === 'district' ? 3 : l.k === 'nbr' || l.k === 'sea' ? 2 : 1, pos: new THREE.Vector3(k[0] * S, (l.k === 'sea' || l.k === 'nbr') ? .1 : ISL.gy(k[0], k[1]) + .12, -k[1] * S), html: esc(l.t) }); });

  // ================= 鐵路：火車 + 高架化 =================
  var rail = ISL.pathFromKm(G.railMain, .03, .06), branch = ISL.pathFromKm(G.railBranch, .03, .06);
  var VH = .24, stP = siteObjs.station.pos, nst = stationKm('北新竹'), sSt = rail.nearest(stP), sN = nst ? rail.nearest(ISL.W(nst[0], nst[1])) : sSt + 2;
  var vA = Math.min(sSt, sN) - 1.9 * S, vB = Math.max(sSt, sN) + .55 * S;
  function vProf(s) { return ISL.smooth((s - vA) / .7) * ISL.smooth((vB - s) / .7); }
  var viaduct = new THREE.Group(), vParts = [], tmpV = new THREE.Vector3(), tmpD = new THREE.Vector3();
  (function () {
    var deckM = M('#d9dee5'), edgeM = M('#4cb989', { em: '#4cb989', ei: 1.2 }), pierM = M('#bfc6cf');
    for (var s = vA; s < vB; s += .17) {
      var p = rail.at(s), d = rail.dir(s), ang = Math.atan2(-d.z, d.x);
      var dk = new THREE.Group(); dk.position.copy(p); dk.rotation.y = ang;
      HP.box(dk, deckM, .19, .028, .15, 0, -.045, 0); HP.box(dk, edgeM, .19, .012, .012, 0, -.02, .078); HP.box(dk, edgeM, .19, .012, .012, 0, -.02, -.078);
      var pier = null; if (Math.round((s - vA) / .17) % 3 === 0) { pier = HP.cyl(dk, pierM, .03, 1, 0, -1.045, 0, 6); }
      dk.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      viaduct.add(dk); vParts.push({ g: dk, base: p.y, k: vProf(s), pier: pier });
    }
    scene.add(viaduct);
  })();
  function viaductApply(f) {
    viaduct.visible = f > .01;
    for (var i = 0; i < vParts.length; i++) { var v = vParts[i], h = VH * v.k * f; v.g.position.y = v.base + h; v.g.scale.set(1, 1, Math.max(.001, ISL.smooth(f * 2 - i / vParts.length * .8))); if (v.pier) { v.pier.scale.y = Math.max(.001, h - .02); v.pier.position.y = -.045 - (h - .02) / 2; v.pier.visible = h > .03; } }
  }
  // 平交道（現在）
  (function () {
    var roads = [G.roads.dongda, G.roads.jingguo], pts = [];
    roads.forEach(function (r) {
      if (!r || !r.length) return; var best = 1e9, bp = null;
      for (var i = 0; i < r.length; i++) { var w = ISL.W(r[i][0], r[i][1]), s = rail.nearest(w), q = rail.at(s), d = q.distanceTo(w); if (d < best && s > vA && s < vB) { best = d; bp = s; } }
      if (bp !== null && best < 1.2) pts.push(bp);
    });
    pts.push(sSt + .6 * S * (sN > sSt ? 1 : -1) * .9);
    pts.forEach(function (s) { var c = B.crossing(), p = rail.at(s), d = rail.dir(s); c.position.copy(p); c.rotation.y = Math.atan2(-d.z, d.x) + Math.PI / 2; c.scale.setScalar(1.5); c.userData.pre = 1; scene.add(c); ISL.regPhase(c); });
  })();
  function makeTrain(path, n, speed, dirSign, phase) {
    var cars = []; for (var i = 0; i < n; i++) { var c = B.trainCar(i === 0); c.scale.setScalar(.82); c.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); scene.add(c); cars.push(c); }
    var gap = .265, L = path.total + n * gap + 1;
    return function (dt, t) {
      var head = ((t * speed + phase * L) % L);
      for (var i = 0; i < cars.length; i++) {
        var s = head - i * gap; if (dirSign < 0) s = path.total - s;
        var c = cars[i], inr = s > 0 && s < path.total; c.visible = inr; if (!inr) continue;
        path.at(s, tmpV); path.dir(s, tmpD); var lift = path === rail ? VH * vProf(s) * env.future : 0;
        c.position.set(tmpV.x, tmpV.y + lift, tmpV.z); c.rotation.y = Math.atan2(-tmpD.z, tmpD.x) + (dirSign < 0 ? Math.PI : 0);
        var e = Math.min(s, path.total - s); c.scale.setScalar(.82 * ISL.smooth(e / .5));
      }
    };
  }
  anims.push(makeTrain(rail, 5, 1.05, 1, 0), makeTrain(rail, 5, .95, -1, .5), makeTrain(branch, 2, .6, 1, .3));

  // ================= BRT、車流 =================
  var brtMats = [], buses = [], rides = { brt: [], sky: [] }, rideLabels = [], brtTrees = [];
  function stopsFor(p) { // 沿線的站名：取路線旁的地標
    var out = []; D.sites.forEach(function (st) { if (st.id === 'brt') return; var w = siteObjs[st.id].pos, sv = p.nearest(w), q = p.at(sv); if (Math.hypot(q.x - w.x, q.z - w.z) < 1.1) out.push({ s: sv, name: st.name }); });
    out.sort(function (a, b) { return a.s - b.s; }); return out.filter(function (o, i) { return i === 0 || o.s - out[i - 1].s > .5; });
  }
  function rideLabel(o, html, site) { var lp = new THREE.Vector3(); var L = ISL.addLabel({ kind: 'ride', pr: 11, pos: lp, html: html, onClick: function () { selectSite(site); } }); L.hide = true; if (site === 'peak') L.el.classList.add('sky'); rideLabels.push({ L: L, o: o, lp: lp }); }
  function ribbon(path, w, color, lift) {
    var pos = [], idx = [], n = path.p.length;
    for (var i = 0; i < n; i++) {
      var p = path.p[i], a = path.p[Math.max(0, i - 1)], b = path.p[Math.min(n - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2;
      pos.push(p.x + nx, p.y + lift, p.z + nz, p.x - nx, p.y + lift, p.z - nz);
      if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    var m = new THREE.MeshBasicMaterial({ color: ISL.col(color), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    var me = new THREE.Mesh(g, m); me.renderOrder = 2; scene.add(me); return m;
  }
  var roadPaths = {};
  ['gongdao5', 'jingguo', 'zhonghua', 'guangfu', 'ciyun', 'dongda'].forEach(function (k) { if (G.roads[k] && G.roads[k].length > 1) roadPaths[k] = ISL.pathFromKm(G.roads[k], .012, .06); });
  ['gongdao5', 'jingguo', 'zhonghua'].forEach(function (k, ri) {
    var p = roadPaths[k]; if (!p) return;
    brtMats.push(ribbon(p, .3, '#4b5361', .008)); brtMats.push(ribbon(p, .1, '#19e0a0', .016));
    (function () { // 行道樹
      var pts = [], q = new THREE.Vector3(), dv = new THREE.Vector3();
      for (var ts = .3; ts < p.total - .3; ts += .3) { p.at(ts, q); p.dir(ts, dv); for (var sd = -1; sd <= 1; sd += 2) pts.push([q.x - dv.z * .2 * sd, q.y, q.z + dv.x * .2 * sd]); }
      var tm = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), new THREE.MeshStandardMaterial({ color: ISL.col('#3fa35a'), roughness: .9, flatShading: true }), pts.length), o3 = new THREE.Object3D();
      pts.forEach(function (pt, ix) { var hh = .1 + Math.random() * .05; o3.position.set(pt[0], pt[1] + hh / 2, pt[2]); o3.scale.set(.034, hh, .034); o3.updateMatrix(); tm.setMatrixAt(ix, o3.matrix); });
      tm.castShadow = true; tm.visible = false; scene.add(tm); brtTrees.push(tm);
    })();
    var nb = Math.max(2, Math.round(p.total / 6));
    for (var i = 0; i < nb; i++) (function (i) {
      var b = B.bus(['#2fbf8f', '#27a8d8', '#34c36f'][ri]); b.scale.setScalar(.8); b.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); scene.add(b); buses.push(b); b.userData.site = 'brt'; ISL.pickables.push(b);
      var dir = i % 2 ? -1 : 1, ph = i / nb;
      if (i === 0) { var rn = { gongdao5: '公道五路', jingguo: '經國路', zhonghua: '中華路' }[k]; rides.brt.push({ o: b, p: p, name: 'BRT・' + rn, sub: '公車專用道，一路綠燈優先', stops: stopsFor(p) }); rideLabel(b, '🚌 BRT・' + rn, 'brt'); }
      anims.push(function (dt, t) {
        var f = env.future; b.visible = f > .04; if (!b.visible) return;
        var s = ((t * .5 + ph * p.total) % p.total); if (dir < 0) s = p.total - s; b.userData.rs = s; b.userData.rd = dir;
        p.at(s, tmpV); p.dir(s, tmpD); b.position.set(tmpV.x, tmpV.y + .012, tmpV.z); b.rotation.y = Math.atan2(-tmpD.z, tmpD.x) + (dir < 0 ? Math.PI : 0);
        b.scale.setScalar(.8 * f * ISL.smooth(Math.min(s, p.total - s) / .4));
      });
    })(i);
  });
  // 一般車流：現在慢（塞車）、未來順
  ['guangfu', 'ciyun', 'dongda', 'jingguo'].forEach(function (k, ri) {
    var p = roadPaths[k]; if (!p) return; var n = Math.round(p.total * 1.6), cs = ['#d8414e', '#f6f8fb', '#5b8fd6', '#f4c542', '#2a2f38', '#e9e2d6'];
    for (var i = 0; i < n; i++) (function (i) {
      var c = B.car(cs[(Math.random() * cs.length) | 0]); scene.add(c); var dir = i % 2 ? -1 : 1, off = Math.random() * p.total, sp = .5 + Math.random() * .3, acc = off, side = dir * .028;
      anims.push(function (dt) {
        acc += dt * sp * ISL.lerp(.13, 1, env.future); var s = acc % p.total; if (dir < 0) s = p.total - s;
        p.at(s, tmpV); p.dir(s, tmpD); c.position.set(tmpV.x - tmpD.z * side, tmpV.y + .004, tmpV.z + tmpD.x * side); c.rotation.y = Math.atan2(-tmpD.z, tmpD.x) + (dir < 0 ? Math.PI : 0);
        c.scale.setScalar(.75 * ISL.smooth(Math.min(s, p.total - s) / .3));
      });
    })(i);
  });

  // ================= 智慧空軌（纜車） =================
  var sky = new THREE.Group(), skyTowers = [], skyLines = [], gondolas = [];
  function skyPath(ids) { return ISL.pathFromKm(ids.map(function (id) { return SM[id].kmPos; }), .62, .12); }
  [skyPath(D.skyrail.main), skyPath(D.skyrail.branch)].forEach(function (p, pi) {
    var lg = new THREE.BufferGeometry().setFromPoints(p.p), lm = new THREE.LineBasicMaterial({ color: ISL.col('#3a4250'), transparent: true, opacity: 0 });
    sky.add(new THREE.Line(lg, lm)); skyLines.push(lm); var tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.p.filter(function (v, i) { return i % 3 === 0 || i === p.p.length - 1; })), 160, .016, 5), M('#f0902f', { em: '#ff9a3a', ei: 1.2 })); tb.castShadow = true; tb.userData.site = 'peak'; ISL.pickables.push(tb); sky.add(tb);
    for (var s = .4; s < p.total; s += 1.15) { var q = p.at(s), tw = new THREE.Group(); tw.position.set(q.x, q.y - .62, q.z); HP.cyl(tw, M("#8a95a3"), .022, .66, 0, 0, 0, 6, .5); HP.box(tw, M("#f0902f"), .13, .02, .035, 0, .64, 0); tw.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); sky.add(tw); skyTowers.push(tw); }
    var n = pi === 0 ? 7 : 3;
    for (var i = 0; i < n; i++) (function (i) {
      var gd = B.gondola(); gd.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); sky.add(gd); gondolas.push(gd); gd.userData.site = 'peak'; ISL.pickables.push(gd);
      if (i === 0) { rides.sky.push({ o: gd, p: p, name: pi === 0 ? '空軌纜車・舊城 ⇄ 十八尖山 ⇄ 清交 ⇄ 竹科' : '空軌纜車・十八尖山 ⇄ 青草湖', sub: '從空中看新竹，通勤也是觀光', stops: (pi === 0 ? D.skyrail.main : D.skyrail.branch).map(function (id) { return { s: p.nearest(siteObjs[id].pos), name: SM[id].name }; }) }); rideLabel(gd, pi === 0 ? '🚡 空軌纜車' : '🚡 纜車・往青草湖', 'peak'); }
      anims.push(function (dt, t) {
        if (env.future < .05) return; var u = ((t * .55 + i / n * 2 * p.total) % (2 * p.total)), s = u > p.total ? 2 * p.total - u : u; gd.userData.rs = s; gd.userData.rd = u > p.total ? -1 : 1;
        p.at(s, tmpV); p.dir(s, tmpD); gd.position.copy(tmpV); gd.rotation.y = Math.atan2(-tmpD.z, tmpD.x); gd.rotation.z = Math.sin(t * 2 + i) * .06; gd.scale.setScalar(.85 * env.future);
      });
    })(i);
  });
  scene.add(sky);

  // ================= 風城：風機、雲、風線、船、風箏 =================
  [[120.9102, 24.8262], [120.9084, 24.8175], [120.9078, 24.8085], [120.9098, 24.7995], [120.9120, 24.7915]].forEach(function (ll, i) {
    var k = ISL.ll(ll[0], ll[1]), t = B.turbine(), p = ISL.W(k[0], k[1]); t.position.copy(p); t.scale.setScalar(.62); t.rotation.y = .9; t.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); scene.add(t);
    anims.push(function (dt) { t.userData.rot.rotation.x += dt * (2.2 + i * .25); });
  });
  var WIND = new THREE.Vector3(-.75, 0, .66), clouds = [];
  for (var ci = 0; ci < (ISL.isMobile ? 5 : 8); ci++) { var cl = B.cloud(); cl.position.set((Math.random() - .5) * 60, 6.5 + Math.random() * 3, (Math.random() - .5) * 60); cl.scale.setScalar(.55 + Math.random() * .6); cl.userData.sp = .35 + Math.random() * .4; cl.children.forEach(function (o) { o.castShadow = true; }); scene.add(cl); clouds.push(cl); }
  var streaks = [], stM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (ci = 0; ci < 26; ci++) { var sm_ = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .014), stM.clone()); sm_.rotation.y = Math.atan2(-WIND.z, WIND.x); sm_.userData = { life: Math.random(), dur: 1.4 + Math.random() * 1.4 }; scene.add(sm_); streaks.push(sm_); }
  function streakReset(m) { m.position.set((Math.random() - .5) * 30 + 6, .7 + Math.random() * 2.6, (Math.random() - .5) * 30 - 6); m.userData.life = 0; }
  streaks.forEach(streakReset);
  var seaBoats = [];
  [[-9.6, 3.2], [-8.9, -1.5], [-10.4, -5.5], [-6.0, 8.6]].forEach(function (k, i) { var b = new THREE.Group(); HP.box(b, M(['#ffffff', '#d8414e', '#2b7fd4', '#f4c542'][i]), .26, .06, .1, 0, 0, 0); HP.box(b, M('#ffffff'), .1, .06, .07, -.03, .06, 0); HP.cyl(b, M('#8a6a4a'), .006, .2, .05, .06, 0, 4); var sl = HP.box(b, M('#ffffff'), .004, .16, .1, .05, .1, .04); b.position.set(k[0] * S, .02, -k[1] * S); b.userData.o = i; scene.add(b); seaBoats.push(b); });
  var kite = B.kite(); scene.add(kite); kite.visible = false;
  var mascot = document.createElement('div'); mascot.id = 'mascot'; mascot.setAttribute('aria-hidden', 'true');
  (function () { var c1 = kite.userData.chibi.material.map.image, c2 = kite.userData.body.material.map.image, pole = document.createElement('i'); c1.className = 'ms-body'; c2.className = 'ms-flag'; pole.className = 'ms-pole'; mascot.appendChild(pole); mascot.appendChild(c2); mascot.appendChild(c1); document.body.appendChild(mascot); })();
  var msV = new THREE.Vector3(), msX = -999, msY = -999;
  var kiteGoal = new THREE.Vector3(), kiteHome = siteObjs.nanliao.pos.clone().add(new THREE.Vector3(-2.2, 3.2, -2.6));
  kite.position.copy(kiteHome);
  anims.push(function (dt, t) {
    var i, n = env.night;
    for (i = 0; i < clouds.length; i++) { var c = clouds[i]; c.position.addScaledVector(WIND, dt * c.userData.sp); if (c.position.x < -36 || c.position.z > 36) { c.position.x = 30 + Math.random() * 6; c.position.z = -30 + (Math.random() - .5) * 50; if (Math.random() < .5) { c.position.x = (Math.random() - .5) * 50; c.position.z = -36; } } var co = ISL.lerp(.93, .28, n) * ISL.smooth((cam.dist - 13) / 15) * ISL.smooth((c.position.distanceTo(ISL.camera.position) - 7) / 9); c.userData.m.opacity = co; c.visible = co > .03; }
    for (i = 0; i < streaks.length; i++) { var m = streaks[i]; m.userData.life += dt / m.userData.dur; if (m.userData.life > 1) streakReset(m); m.position.addScaledVector(WIND, dt * 7); m.material.opacity = Math.sin(m.userData.life * Math.PI) * .5 * (1 - n * .85); }
    for (i = 0; i < seaBoats.length; i++) { var b = seaBoats[i]; b.position.y = .02 + Math.sin(t * 1.4 + i * 2) * .012; b.rotation.z = Math.sin(t * 1.1 + i) * .07; b.position.x += Math.sin(t * .1 + i * 1.7) * dt * .05; b.rotation.y = i * 1.3 + Math.sin(t * .2 + i) * .3; }
    // 勇敢風箏
    if (state.tour && state.tourPos) kiteGoal.copy(state.tourPos).add(tmpV.set(1.4, 2.5, -1.6)); else if (state.site && siteObjs[state.site]) kiteGoal.copy(siteObjs[state.site].pos).add(tmpV.set(1.6, 2.5, -1.8)); else kiteGoal.copy(kiteHome);
    kiteGoal.x += Math.sin(t * .9) * .5; kiteGoal.y += Math.sin(t * 1.3) * .22; kiteGoal.z += Math.cos(t * .7) * .4;
    kite.position.lerp(kiteGoal, 1 - Math.exp(-dt * 1.4));
    // 投影到畫面，並避開頂列、政見列、政見卡與畫面邊緣
    msV.copy(kite.position).project(ISL.camera);
    var W_ = window.innerWidth, H_ = window.innerHeight, mob = W_ <= 860, U = mob ? 78 : 112, open = document.body.classList.contains('panel-open');
    var show = msV.z < 1 && !state.ride, tx = (msV.x * .5 + .5) * W_, ty = (-msV.y * .5 + .5) * H_;
    tx = ISL.clamp(tx, (mob ? 8 : 268) + .5 * U, W_ - (open && !mob ? 430 : mob ? 52 : 76) - .6 * U);
    ty = ISL.clamp(ty, (mob ? 150 : 84) + .7 * U, H_ - (open && mob ? H_ * .56 : mob ? 96 : 60) - .85 * U);
    if (msX < -900) { msX = tx; msY = ty; } msX += (tx - msX) * Math.min(1, dt * 8); msY += (ty - msY) * Math.min(1, dt * 8);
    mascot.style.setProperty('--u', U + 'px'); mascot.style.opacity = show ? 1 : 0;
    mascot.style.transform = 'translate3d(' + msX.toFixed(1) + 'px,' + (msY + Math.sin(t * 1.8) * 4).toFixed(1) + 'px,0) rotate(' + (Math.sin(t * 1.3) * 3).toFixed(2) + 'deg)';
    kite.quaternion.copy(ISL.camera.quaternion); kite.rotateZ(Math.sin(t * 1.6) * .08);
    var tl = kite.userData.tail; for (i = 0; i < tl.length; i++) { tl[i].position.y = .52 - i * .07 + Math.sin(t * 5 - i * .9) * .03; } kite.userData.body.scale.x = 1 + Math.sin(t * 5) * .05; kite.userData.body.rotation.z = Math.sin(t * 3.1) * .04; kite.scale.setScalar(ISL.clamp(cam.dist / 16, .75, 2.1));
  });

  // ================= 16,800：每天 +70 元 =================
  var coins = [], coinTex = (function () { var cv = document.createElement('canvas'); cv.width = 320; cv.height = 112; var c = cv.getContext('2d'); c.fillStyle = '#ffd34d'; c.strokeStyle = '#b97a00'; c.lineWidth = 7; c.beginPath(); c.arc(56, 56, 46, 0, 6.3); c.fill(); c.stroke(); c.strokeStyle = '#ffe9a0'; c.lineWidth = 4; c.beginPath(); c.arc(56, 56, 34, 0, 6.3); c.stroke(); c.fillStyle = '#8a5a00'; c.font = '900 54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 56, 60); c.lineJoin = 'round'; c.fillStyle = '#fff'; c.strokeStyle = '#b3261e'; c.lineWidth = 12; c.font = '900 58px "Noto Sans TC", "Microsoft JhengHei", sans-serif'; c.textAlign = 'left'; c.strokeText('+70元', 112, 60); c.fillText('+70元', 112, 60); var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })();
  var coinSpots = sitesOf('p0').map(function (s) { return siteObjs[s.id].pos; }), coinHot = coinSpots.length;
  (function () { var bl = G.bld; for (var i = 0, k = 0; i < bl.length / 3 && k < 46; i += 23) { var x = bl[i * 3] / 100, y = bl[i * 3 + 1] / 100; if (!bl[i * 3 + 2] && !nearSite(x, y)) { coinSpots.push(ISL.W(x, y)); k++; } } })();
  for (ci = 0; ci < (ISL.isMobile ? 26 : 42); ci++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: coinTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false })); sp.renderOrder = 6; sp.userData = { life: Math.random() * 2, dur: 1.9 + Math.random() }; sp.visible = false; scene.add(sp); coins.push(sp); }
  anims.push(function (dt) {
    var p0 = state.policy === 'p0', on = env.future > .6 && (!state.policy || p0);
    for (var i = 0; i < coins.length; i++) {
      var c = coins[i], u = c.userData; u.life += dt / u.dur;
      if (u.life > 1) { u.life = -Math.random() * (p0 ? .4 : 1.1); if (on) { var p = coinSpots[(Math.random() < .3 ? Math.random() * coinHot : Math.random() * coinSpots.length) | 0]; c.position.set(p.x + (Math.random() - .5) * .3, p.y + .35, p.z + (Math.random() - .5) * .3); u.live = true; } else u.live = false; }
      if (u.live && u.life > 0) { c.visible = true; c.position.y += dt * .5; c.material.opacity = Math.min(1, Math.sin(u.life * Math.PI) * 1.6); var sc = (.5 + ISL.backOut(Math.min(1, u.life * 3)) * .5) * ISL.clamp(cam.dist / 26, .3, 1.5) * (p0 ? 1.25 : 1); c.scale.set(1.5 * sc, .525 * sc, 1); } else c.visible = false;
    }
  });

  // ================= 06：AI 雷達掃描 =================
  var radars = [];
  for (ci = 0; ci < 3; ci++) { var rg = new THREE.Mesh(new THREE.RingGeometry(.965, 1, 72).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: ISL.col('#3fe0f0'), transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })); rg.position.copy(siteObjs.police.pos).setY(.5); rg.renderOrder = 5; scene.add(rg); radars.push(rg); }
  anims.push(function (dt, t) { var k = state.policy === 'p6' ? 1 : (state.policy ? 0 : .3) * env.future; for (var i = 0; i < 3; i++) { var u = ((t * .18 + i / 3) % 1), r = .3 + u * 15; radars[i].scale.set(r, 1, r); radars[i].material.opacity = (1 - u) * .55 * k; radars[i].visible = k > .01; } });

  // ================= 07：飛向世界的航線 =================
  var world = new THREE.Group(), worldDots = [], worldLabels = []; scene.add(world);
  (function () {
    var o = siteObjs.scipark.pos, targets = [[-70, 26, -46, 'Boston'], [-88, 30, 6, ''], [40, 24, -66, ''], [74, 28, -10, ''], [10, 22, 80, '']];
    targets.forEach(function (tg, i) {
      var a = o.clone().setY(o.y + .8), b = new THREE.Vector3(tg[0], tg[1] * .2, tg[2]), mid = a.clone().lerp(b, .5); mid.y = tg[1];
      var cv = new THREE.QuadraticBezierCurve3(a, mid, b), me = new THREE.Mesh(new THREE.TubeGeometry(cv, 40, .035, 5), ISL.glowMat('#7fa8ff', .35)); world.add(me);
      var d = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), ISL.glowMat('#ffffff', .95)); world.add(d); worldDots.push({ m: d, cv: cv, o: i / targets.length });
      if (tg[3]) { var wl = ISL.addLabel({ kind: 'world', pr: 9, pos: cv.getPoint(.3), html: '✈ 亞洲波士頓 ⇄ ' + tg[3] }); wl.hide = true; worldLabels.push(wl); }
    });
    world.visible = false;
  })();
  anims.push(function (dt, t) { var on = state.policy === 'p7'; world.visible = on; for (var j = 0; j < worldLabels.length; j++) worldLabels[j].hide = !on; if (!on) return; for (var i = 0; i < worldDots.length; i++) { var w = worldDots[i]; w.cv.getPoint((t * .16 + w.o) % 1, w.m.position); } });

  // ================= 選取連線（政策連線） =================
  var arcs = new THREE.Group(), arcDots = []; scene.add(arcs);
  function clearArcs() { while (arcs.children.length) { var c = arcs.children.pop(); if (c.geometry) c.geometry.dispose(); } arcDots.length = 0; }
  function buildArcs(ids, color) {
    clearArcs(); if (ids.length < 2) return; var hub = siteObjs[ids[0]];
    for (var i = 1; i < ids.length; i++) {
      var so = siteObjs[ids[i]], a = hub.pos.clone().setY(hub.y + hub.top * SM[ids[0]].s * .6), b = so.pos.clone().setY(so.y + so.top * SM[ids[i]].s * .6), mid = a.clone().lerp(b, .5); mid.y += 1.2 + a.distanceTo(b) * .22;
      var cv = new THREE.QuadraticBezierCurve3(a, mid, b); arcs.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 28, .028, 5), ISL.glowMat(color, .5)));
      var d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), ISL.glowMat('#ffffff', .95)); arcs.add(d); arcDots.push({ m: d, cv: cv, o: Math.random() });
    }
  }
  anims.push(function (dt, t) { for (var i = 0; i < arcDots.length; i++) arcDots[i].cv.getPoint((t * .35 + arcDots[i].o) % 1, arcDots[i].m.position); });

  // ================= 環境回呼 =================
  ISL.onEnv = function (n) { for (var i = 0; i < glows.length; i++) { glows[i].material.opacity = glows[i].userData.nightGlow * n; glows[i].visible = n > .02; } $('#btnNight').classList.toggle('on', env.goalNight > .5); };
  ISL.onPhase = function (f) {
    viaductApply(f); for (var i = 0; i < brtMats.length; i++) brtMats[i].opacity = f * .95;
    for (var id in siteObjs) { var h = siteObjs[id].halo; h.visible = f > .02; h.material.opacity = f * .8; }
    for (i = 0; i < issueLabels.length; i++) issueLabels[i].hide = f > .35;
    for (i = 0; i < rideLabels.length; i++) rideLabels[i].L.hide = f < .6;
    for (i = 0; i < brtTrees.length; i++) brtTrees[i].visible = f > .55;
    for (id in siteObjs) siteObjs[id].label.hide = f < .5;
    document.getElementById('scene').style.filter = f > .995 ? '' : 'saturate(' + (.22 + .78 * f).toFixed(3) + ') brightness(' + (.86 + .14 * f).toFixed(3) + ') contrast(' + (.94 + .06 * f).toFixed(3) + ')';
    sky.visible = f > .02; for (i = 0; i < skyLines.length; i++) skyLines[i].opacity = f * .9; for (i = 0; i < skyTowers.length; i++) skyTowers[i].scale.set(1, Math.max(.001, ISL.backOut(ISL.clamp(f * 1.5 - i * .02, 0, 1))), 1);
  };
  ISL.onPhase(0);

  // 每幀：動畫、地標縮放、光柱
  ISL.tick.push(function (dt, t) {
    for (var i = 0; i < anims.length; i++) anims[i](dt, t);
    for (var ri = 0; ri < rideLabels.length; ri++) { var rl = rideLabels[ri]; rl.lp.copy(rl.o.position); rl.lp.y += .2; }
    if (state.ride) { // 第一人稱：坐在車裡往前看
      var R = state.ride, rr = rides[R.type][R.i], isB = R.type === 'brt', P = rr.p;
      R.s += R.dir * dt * (isB ? .2 : .15);
      if (R.s > P.total - .15) { R.s = P.total - .15; R.dir = -1; toast('終點站到了，折返', 1800); } else if (R.s < .15) { R.s = .15; R.dir = 1; toast('終點站到了，折返', 1800); }
      P.at(R.s, ridePos); P.at(ISL.clamp(R.s + R.dir * (isB ? 1.0 : 1.5), 0, P.total), rideLookAt);
      if (isB) { ridePos.y += .068 + Math.sin(t * 21) * .0012; rideLookAt.y += .05; rideCamObj.roll = Math.sin(t * 1.7) * .004; }
      else { P.dir(R.s, tmpD); ridePos.x -= tmpD.z * .085; ridePos.z += tmpD.x * .085; ridePos.y -= .1 + Math.sin(t * 1.1) * .012; rideLookAt.y -= .5; rideCamObj.roll = Math.sin(t * 1.1) * .035; }
      ISL.rideCam = rideCamObj; cam.g.t.set(ridePos.x, .3, ridePos.z); cam.t.copy(cam.g.t); cam.dist = cam.g.dist = 13;
      R.hud = (R.hud || 0) + dt;
      if (R.hud > .4) { R.hud = 0; var nx = null, bd = 1e9; for (var si = 0; si < rr.stops.length; si++) { var dd = (rr.stops[si].s - R.s) * R.dir; if (dd > .05 && dd < bd) { bd = dd; nx = rr.stops[si]; } } var txt = nx ? '下一站 ▶ ' + nx.name : '即將抵達終點站'; $('#rideSub').textContent = txt; $('#rvLed').textContent = rr.name.replace('・', ' ') + '｜' + txt; }
    }
    var k = ISL.clamp(cam.dist / 30, 1, 1.32), pulse = Math.sin(t * 3) * .5 + .5;
    for (var id in siteObjs) {
      var so = siteObjs[id], s = SM[id]; so.outer.scale.setScalar(s.s * k); so.label.pos.y = so.y + so.top * s.s * k + .14; if (so.halo.visible) so.halo.scale.setScalar(Math.max(.55, s.s) * k * (1 + pulse * .06));
      if (so.beacon.visible) { so.ring.scale.setScalar(1 + pulse * .12); var u = (t * .6) % 1; so.ring2.scale.setScalar(1 + u * 1.2); so.ring2.material.opacity = (1 - u) * .6; so.pil.material.opacity = .07 + pulse * .06; }
    }
    // 面板開啟時，把畫面中心讓出來
    var tx = 0, ty = 0; if (document.body.classList.contains('panel-open')) { if (window.innerWidth > 860) tx = 200; else ty = window.innerHeight * .2; }
    ISL.offsetX = (ISL.offsetX || 0) + (tx - (ISL.offsetX || 0)) * (1 - Math.exp(-dt * 5)); ISL.offsetY = (ISL.offsetY || 0) + (ty - (ISL.offsetY || 0)) * (1 - Math.exp(-dt * 5));
    if (Math.abs(ISL.offsetX) < .5 && Math.abs(ISL.offsetY) < .5 && !tx && !ty) { ISL.offsetX = 0; ISL.offsetY = 0; }
    if (state.tour) tourTick(dt);
  });

  // ================= 選取與面板 =================
  var panel = $('#panel'), panelBody = $('#panelBody');
  function setHighlight(map) { // map: siteId -> color
    state.hl = map || {}; var any = Object.keys(state.hl).length > 0;
    for (var id in siteObjs) {
      var so = siteObjs[id], c = state.hl[id];
      so.beacon.visible = !!c; so.label.force = !!c; so.label.el.classList.toggle('hl', !!c); so.label.el.classList.toggle('dim', any && !c);
      if (c) { var col = ISL.col(c); so.ring.material.color.copy(col); so.ring2.material.color.copy(col); so.pil.material.color.copy(col); so.label.el.style.setProperty('--c', c); }
    }
  }
  function openPanel(html) { panelBody.innerHTML = html; panelBody.scrollTop = 0; document.body.classList.add('panel-open'); panel.setAttribute('aria-hidden', 'false'); }
  function closePanel() { document.body.classList.remove('panel-open'); panel.setAttribute('aria-hidden', 'true'); }
  function fitSites(ids, extra) {
    var cx = 0, cz = 0, r = 0; ids.forEach(function (id) { cx += siteObjs[id].pos.x; cz += siteObjs[id].pos.z; }); cx /= ids.length; cz /= ids.length;
    ids.forEach(function (id) { r = Math.max(r, Math.hypot(siteObjs[id].pos.x - cx, siteObjs[id].pos.z - cz)); });
    ISL.flyTo(Object.assign({ x: cx, z: cz, dist: ISL.clamp(r * 2.7 + 9, 11, ISL.homeDist() + 6), pol: .95, speed: 2.2 }, extra || {}));
  }
  function ensureFuture() { if (env.goalFuture < .5) setFuture(true); }
  function markVisited(pid) {
    if (state.visited[pid]) return; state.visited[pid] = 1;
    try { localStorage.setItem('cyh-island-visited', JSON.stringify(Object.keys(state.visited))); } catch (e) { }
    renderRail(); var n = Object.keys(state.visited).length;
    if (n === D.policies.length && !state.finaleShown) { state.finaleShown = true; setTimeout(showFinale, 2600); }
  }
  function policyCard(p) {
    var ss = sitesOf(p.id), idx = D.policies.indexOf(p), nx = D.policies[(idx + 1) % D.policies.length];
    var h = '<header class="pc-head" style="--c:' + p.color + '"><span class="pc-no">' + esc(p.no) + '</span><div><h2>' + esc(p.title) + '</h2><p class="pc-hook">' + esc(p.hook) + '</p></div></header>';
    h += '<p class="pc-sum">' + esc(p.summary) + '</p>';
    if (ss.length) h += '<div class="pc-sites"><h3>📍 島上據點（點一下飛過去）</h3><div class="chips">' + ss.map(function (s) { return '<button type="button" class="chip" data-site="' + s.id + '" style="--c:' + p.color + '">' + esc(s.name) + '</button>'; }).join('') + '</div></div>';
    h += '<div class="pc-items">' + p.items.map(function (it, i) { return '<details' + (i === 0 ? ' open' : '') + ' style="--c:' + p.color + '"><summary>' + esc(it.t) + '</summary><ul>' + it.d.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></details>'; }).join('') + '</div>';
    h += '<div class="pc-links">' + (p.fb ? '<a class="btn-line" href="' + p.fb + '" target="_blank" rel="noreferrer">在 Facebook 看完整說明 →</a>' : '') + '<a class="btn-line" href="' + D.whitepaper + '" target="_blank" rel="noreferrer">📄 市政白皮書</a></div>';
    h += '<button type="button" class="btn-next" data-policy="' + nx.id + '" style="--c:' + nx.color + '">下一項：' + esc(nx.no) + ' ' + esc(nx.short) + ' →</button>';
    return h;
  }
  function siteCard(s) {
    var h = '<header class="sc-head"><div class="sc-tag">' + esc(s.tag || '') + (s.future ? ' · 未來願景' : '') + '</div><h2>' + esc(s.name) + '</h2></header>';
    h += '<p class="sc-blurb">' + esc(s.blurb) + '</p>';
    if (s.link) h += '<a class="btn-solid" href="' + s.link.u + '" target="_blank" rel="noreferrer">' + esc(s.link.t) + '</a>';
    if (s.id === 'brt') h += '<button type="button" class="btn-ride" data-ride="brt">🚌 BRT 視角看新竹</button>';
    if (s.id === 'peak' || s.id === 'qingcao') h += '<button type="button" class="btn-ride" data-ride="sky">🚡 纜車視角看新竹</button>';
    h += '<h3 class="sc-h3">這裡對應的政見</h3>';
    s.p.forEach(function (pid) { var p = PM[pid]; h += '<button type="button" class="pol-row" data-policy="' + pid + '" style="--c:' + p.color + '"><span class="pr-no">' + esc(p.no) + '</span><span class="pr-t"><b>' + esc(p.title) + '</b><em>' + esc(p.hook) + '</em></span><span class="pr-go">→</span></button>'; });
    h += '<p class="sc-note">模型為政策示意，非實際規劃。</p>';
    return h;
  }
  function selectPolicy(pid, o) {
    o = o || {}; var p = PM[pid]; if (!p) return; if (state.ride) stopRide(true);
    state.policy = pid; state.site = null; state.persona = null; ensureFuture();
    var ss = sitesOf(pid), map = {}; ss.forEach(function (s) { map[s.id] = p.color; }); setHighlight(map);
    buildArcs(ss.map(function (s) { return s.id; }), p.color);
    if (!o.noFly && ss.length) fitSites(ss.map(function (s) { return s.id; }), o.fly);
    if (!o.noPanel) openPanel(policyCard(p));
    markVisited(pid); renderRail(); if (!o.noHash) history.replaceState(null, '', '#' + pid);
  }
  function selectSite(id, o) {
    o = o || {}; var s = SM[id]; if (!s) return; var so = siteObjs[id]; if (state.ride) stopRide(true);
    if (state.tour) stopTour();
    state.site = id; ensureFuture();
    var map = {}; map[id] = PM[s.p[0]].color; if (state.policy && s.p.indexOf(state.policy) >= 0) { sitesOf(state.policy).forEach(function (x) { map[x.id] = PM[state.policy].color; }); } else { state.policy = null; clearArcs(); }
    state.persona = null; setHighlight(map);
    ISL.flyTo({ x: so.pos.x, z: so.pos.z, dist: ISL.clamp(5.5 + s.s * 4.5, 6.5, 13), pol: 1.08, az: cam.g.az + .35, speed: 2.4 });
    openPanel(siteCard(s)); renderRail(); history.replaceState(null, '', '#site-' + id);
  }
  function selectPersona(id) {
    var ps = D.personas.filter(function (x) { return x.id === id; })[0]; if (!ps) return;
    if (state.tour) stopTour();
    state.persona = id; state.policy = null; state.site = null; ensureFuture(); clearArcs();
    var map = {}, ids = []; ps.p.forEach(function (pid) { sitesOf(pid).forEach(function (s) { if (!map[s.id]) { map[s.id] = PM[pid].color; ids.push(s.id); } }); }); setHighlight(map); fitSites(ids);
    var h = '<header class="sc-head"><div class="sc-tag">跟我有關的政見</div><h2>' + ps.icon + ' 如果你是「' + esc(ps.name) + '」</h2></header><ul class="ps-lines">' + ps.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul><h3 class="sc-h3">點進去看完整內容</h3>';
    ps.p.forEach(function (pid) { var p = PM[pid]; h += '<button type="button" class="pol-row" data-policy="' + pid + '" style="--c:' + p.color + '"><span class="pr-no">' + esc(p.no) + '</span><span class="pr-t"><b>' + esc(p.title) + '</b><em>' + esc(p.hook) + '</em></span><span class="pr-go">→</span></button>'; });
    openPanel(h); renderRail(); $('#personaMenu').classList.remove('open');
  }
  function clearSel() { state.policy = null; state.site = null; state.persona = null; setHighlight({}); clearArcs(); closePanel(); renderRail(); history.replaceState(null, '', location.pathname + location.search); }
  panel.addEventListener('click', function (e) {
    var t = e.target.closest('[data-site],[data-policy],[data-ride]'); if (!t) return;
    if (t.dataset.ride) { startRide(t.dataset.ride, 0); return; }
    if (t.dataset.site) selectSite(t.dataset.site); else { if (state.tour) stopTour(); selectPolicy(t.dataset.policy); }
  });
  $('#panelClose').addEventListener('click', function () { if (state.tour) stopTour(); clearSel(); });
  ISL.onClick = function (x, y) { var id = ISL.pick(x, y); if (id) selectSite(id); };
  var hoverT = 0, hovered = null;
  ISL.onHover = function (x, y) { var now = performance.now(); if (now - hoverT < 70) return; hoverT = now; var id = ISL.pick(x, y); if (id !== hovered) { if (hovered && siteObjs[hovered]) siteObjs[hovered].label.el.classList.remove('hover'); hovered = id; if (id) { siteObjs[id].label.el.classList.add('hover'); } document.getElementById('scene').style.cursor = id ? 'pointer' : ''; } };
  ISL.onUserMove = function () { if (state.seq) { state.seq.forEach(clearTimeout); state.seq = null; toast(''); } };

  // 政見列
  var rail_ = $('#rail');
  function renderRail() {
    var n = Object.keys(state.visited).length;
    rail_.innerHTML = D.policies.map(function (p) { return '<button type="button" class="rail-item' + (state.policy === p.id ? ' active' : '') + (state.visited[p.id] ? ' seen' : '') + '" data-policy="' + p.id + '" style="--c:' + p.color + '" title="' + esc(p.title) + '"><span class="ri-no">' + esc(p.no) + '</span><span class="ri-t">' + esc(p.short) + '</span><span class="ri-ck" aria-hidden="true">✓</span></button>'; }).join('');
    $('#progNum').textContent = n; $('#progBar').style.width = (n / D.policies.length * 100) + '%';
  }
  rail_.addEventListener('click', function (e) { var b = e.target.closest('[data-policy]'); if (!b) return; if (state.tour) stopTour(); if (state.policy === b.dataset.policy && document.body.classList.contains('panel-open')) clearSel(); else selectPolicy(b.dataset.policy); });
  renderRail();

  // 現在／未來、日夜
  function setFuture(on) { env.goalFuture = on ? 1 : 0; $('#btnPhase').classList.toggle('on', on); $('#btnPhase').setAttribute('aria-pressed', on); $('#phaseLbl').textContent = on ? '何志勇的新竹' : '現在的新竹'; document.body.classList.toggle('is-future', on); if (on) coinCount(); }
  var coinRaf = 0; function coinCount() { var el = $('#coinNum'), t0 = performance.now(); cancelAnimationFrame(coinRaf); (function st() { var u = Math.min(1, (performance.now() - t0) / 2200), v = Math.round(16800 * (1 - Math.pow(1 - u, 3)) / 70) * 70; el.textContent = v.toLocaleString('en-US'); if (u < 1) coinRaf = requestAnimationFrame(st); })(); }
  $('#coinHud').addEventListener('click', function () { if (state.tour) stopTour(); selectPolicy('p0'); });
  $('#btnPhase').addEventListener('click', function () { var on = env.goalFuture < .5; if (!on) { if (state.tour) stopTour(); clearSel(); } setFuture(on); toast(on ? '切換到「何志勇的新竹」— 看建設長出來' : '這是現在的新竹：塞車、停工、抽不到學區…', 4200); });
  $('#toFuture').addEventListener('click', function () { setFuture(true); toast('何志勇的新竹 — 看建設長出來'); });
  $('#btnNight').addEventListener('click', function () { env.goalNight = env.goalNight > .5 ? 0 : 1; toast(env.goalNight ? '夜晚：路網像晶片電路一樣亮起，舊城點燈' : '白天'); });
  $('#btnHome').addEventListener('click', function () { ISL.home(); });
  $('#btnZin').addEventListener('click', function () { ISL.zoom(.72); }); $('#btnZout').addEventListener('click', function () { ISL.zoom(1.38); });
  $('#btnRl').addEventListener('click', function () { ISL.rotate(.4); }); $('#btnRr').addEventListener('click', function () { ISL.rotate(-.4); });
  $('#btnTilt').addEventListener('click', function () { ISL.tilt(cam.g.pol > .7 ? -.75 : .75); });

  // 提示
  var toastT = 0; function toast(msg, ms) { var el = $('#toast'); clearTimeout(toastT); if (!msg) { el.classList.remove('on'); return; } el.textContent = msg; el.classList.add('on'); toastT = setTimeout(function () { el.classList.remove('on'); }, ms || 3200); }

  // 我是…
  $('#personaMenu').innerHTML = D.personas.map(function (p) { return '<button type="button" data-persona="' + p.id + '">' + p.icon + ' ' + esc(p.name) + '</button>'; }).join('');
  $('#btnPersona').addEventListener('click', function (e) { e.stopPropagation(); var m = $('#personaMenu'), opening = !m.classList.contains('open'); if (opening && document.body.classList.contains('panel-open')) { if (state.tour) stopTour(); clearSel(); } m.classList.toggle('open', opening); });
  $('#personaMenu').addEventListener('click', function (e) { var b = e.target.closest('[data-persona]'); if (b) selectPersona(b.dataset.persona); });
  document.addEventListener('click', function (e) { if (!e.target.closest('#personaWrap')) $('#personaMenu').classList.remove('open'); if (!e.target.closest('#searchWrap')) $('#searchRes').classList.remove('open'); });

  // 搜尋
  var sIn = $('#search'), sRes = $('#searchRes');
  function doSearch() {
    var q = sIn.value.trim().toLowerCase(); if (!q) { sRes.classList.remove('open'); return; }
    var out = [];
    D.policies.forEach(function (p) {
      var hit = (p.title + p.short + p.keywords + p.summary).toLowerCase().indexOf(q) >= 0, sub = '';
      p.items.forEach(function (it) { if (!sub && (it.t + it.d.join('')).toLowerCase().indexOf(q) >= 0) sub = it.t; });
      if (hit || sub) out.push('<button type="button" data-policy="' + p.id + '" style="--c:' + p.color + '"><span class="sr-no">' + esc(p.no) + '</span><span><b>' + esc(p.title) + '</b>' + (sub ? '<em>' + esc(sub) + '</em>' : '') + '</span></button>');
    });
    D.sites.forEach(function (s) { if ((s.name + (s.tag || '') + s.blurb).toLowerCase().indexOf(q) >= 0) out.push('<button type="button" data-site="' + s.id + '" style="--c:' + PM[s.p[0]].color + '"><span class="sr-no">📍</span><span><b>' + esc(s.name) + '</b><em>' + esc(s.tag || '') + '</em></span></button>'); });
    sRes.innerHTML = out.length ? out.slice(0, 9).join('') : '<div class="sr-empty">找不到「' + esc(sIn.value) + '」，試試：巨蛋、公幼、租屋、塞車、詐騙</div>';
    sRes.classList.add('open');
  }
  sIn.addEventListener('input', doSearch); sIn.addEventListener('focus', doSearch);
  sIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var b = sRes.querySelector('button'); if (b) b.click(); } else if (e.key === 'Escape') { sRes.classList.remove('open'); sIn.blur(); } });
  sRes.addEventListener('click', function (e) { var b = e.target.closest('[data-site],[data-policy]'); if (!b) return; if (state.tour) stopTour(); if (b.dataset.site) selectSite(b.dataset.site); else selectPolicy(b.dataset.policy); sRes.classList.remove('open'); sIn.blur(); });

  // ================= 自動導覽 =================
  var tourBar = $('#tour');
  function startTour(i) { if (state.ride) stopRide(true); closeIntro(true); ensureFuture(); state.tour = { i: i || 0, t: 0, dur: 11, paused: false }; document.body.classList.add('touring'); tourStep(); }
  function stopTour() { state.tour = null; state.tourPos = null; document.body.classList.remove('touring'); }
  function tourStep() {
    var tr = state.tour, p = D.policies[tr.i], ss = sitesOf(p.id); tr.t = 0;
    selectPolicy(p.id, { noFly: true, noPanel: window.innerWidth <= 860 });
    var hub = siteObjs[ss[0].id]; state.tourPos = hub.pos; state.site = null;
    ISL.flyTo({ x: hub.pos.x, z: hub.pos.z, dist: ISL.clamp(8 + SM[ss[0].id].s * 5, 9, 16), pol: 1.05, az: cam.g.az + .9, speed: 1.5 });
    $('#tourNo').textContent = p.no; $('#tourNo').style.background = p.color; $('#tourTitle').textContent = p.title; $('#tourHook').textContent = p.hook; $('#tourIdx').textContent = (tr.i + 1) + ' / ' + D.policies.length;
    tr.wide = false;
  }
  function tourTick(dt) {
    var tr = state.tour; if (!tr || tr.paused) return; tr.t += dt; cam.g.az += dt * .05; cam.speed = 1.5;
    if (!tr.wide && tr.t > tr.dur * .55) { tr.wide = true; var ss = sitesOf(D.policies[tr.i].id); if (ss.length > 1) fitSites(ss.map(function (s) { return s.id; }), { speed: 1.2 }); }
    $('#tourProg').style.width = Math.min(100, tr.t / tr.dur * 100) + '%';
    if (tr.t >= tr.dur) { if (tr.i >= D.policies.length - 1) { stopTour(); clearSel(); ISL.home(); if (!state.finaleShown) { state.finaleShown = true; showFinale(); } } else { tr.i++; tourStep(); } }
  }
  $('#btnTour').addEventListener('click', function () { if (state.tour) { stopTour(); clearSel(); } else startTour(0); });
  $('#tourPrev').addEventListener('click', function () { if (state.tour) { state.tour.i = (state.tour.i + D.policies.length - 1) % D.policies.length; tourStep(); } });
  $('#tourNext').addEventListener('click', function () { if (state.tour) { if (state.tour.i >= D.policies.length - 1) { stopTour(); clearSel(); ISL.home(); showFinale(); } else { state.tour.i++; tourStep(); } } });
  $('#tourPause').addEventListener('click', function () { if (state.tour) { state.tour.paused = !state.tour.paused; this.textContent = state.tour.paused ? '▶' : '❚❚'; } });
  $('#tourExit').addEventListener('click', function () { stopTour(); clearSel(); });
  $('#tourOpen').addEventListener('click', function () { if (state.tour) { state.tour.paused = true; $('#tourPause').textContent = '▶'; openPanel(policyCard(D.policies[state.tour.i])); } });

  // ================= 搭乘視角（BRT／智慧空軌） =================
  var ridePos = new THREE.Vector3(), rideLookAt = new THREE.Vector3(), rideCamObj = { pos: ridePos, look: rideLookAt };
  function rideUI() { var r = rides[state.ride.type][state.ride.i], isB = state.ride.type === 'brt'; $('#rideIcon').textContent = isB ? '🚌' : '🚡'; $('#rideTitle').textContent = r.name; $('#rideSub').textContent = r.sub; $('#rideSwap').textContent = isB ? '🚡 改搭纜車' : '🚌 改搭 BRT'; }
  function startRide(type, i) {
    if (!rides[type].length) return; if (state.tour) stopTour(); closeIntro(); if (state.seq) { state.seq.forEach(clearTimeout); state.seq = null; }
    state.policy = null; state.site = null; state.persona = null; setHighlight({}); clearArcs(); closePanel(); renderRail(); ensureFuture();
    state.ride = { type: type, i: (i || 0) % rides[type].length, s: .2, dir: 1 }; document.body.classList.add('riding'); document.body.setAttribute('data-ride', type); scene.fog.near = 5; scene.fog.far = 75; rideUI();
    toast(type === 'brt' ? '你現在坐在 BRT 第一排，出發！' : '你現在坐在空軌纜車車廂裡，出發！', 3600);
  }
  function stopRide(quiet) { if (!state.ride) return; state.ride = null; ISL.rideCam = null; document.body.classList.remove('riding'); scene.fog.near = 70; scene.fog.far = 210; if (!quiet) ISL.flyTo({ dist: 14, pol: 1.0, speed: 2.4 }); }
  $('#btnRideBrt').addEventListener('click', function () { startRide('brt', 0); });
  $('#btnRideSky').addEventListener('click', function () { startRide('sky', 0); });
  $('#rideNext').addEventListener('click', function () { if (state.ride) { state.ride.i = (state.ride.i + 1) % rides[state.ride.type].length; state.ride.s = .2; state.ride.dir = 1; rideUI(); } });
  $('#rideSwap').addEventListener('click', function () { if (state.ride) startRide(state.ride.type === 'brt' ? 'sky' : 'brt', 0); });
  $('#rideExit').addEventListener('click', function () { stopRide(); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.ride) stopRide(); });

  // ================= 開場 =================
  function closeIntro(quiet) { $('#intro').classList.add('gone'); document.body.classList.add('started'); cam.auto = false; }
  $('#introGo').addEventListener('click', function () {
    closeIntro(); setFuture(true); env.future = 0;
    var st = siteObjs.station.pos, dm = siteObjs.dome.pos, pk = siteObjs.peak.pos;
    ISL.flyTo({ x: st.x, z: st.z, dist: 9, pol: 1.12, az: .5, speed: 1.6 }); toast('鐵路高架化：縫合前後站，平交道消失', 3600);
    state.seq = [
      setTimeout(function () { ISL.flyTo({ x: dm.x, z: dm.z, dist: 9.5, pol: 1.1, az: 1.3, speed: 1.4 }); toast('頭前溪南岸：15,000 人智慧巨蛋', 3600); }, 3800),
      setTimeout(function () { ISL.flyTo({ x: pk.x, z: pk.z, dist: 13, pol: 1.08, az: 2.2, speed: 1.3 }); toast('智慧空軌：舊城 → 十八尖山 → 清交 → 竹科', 3600); }, 7600),
      setTimeout(function () { ISL.home(); toast('點任何地標，或從左邊選一項政見開始探索', 5200); state.seq = null; }, 11400)
    ];
  });
  $('#introNow').addEventListener('click', function () { closeIntro(); setFuture(false); ISL.home(); toast('這是現在的新竹。按下方按鈕，看何志勇怎麼改變它', 5200); });
  $('#introTour').addEventListener('click', function () { startTour(0); });

  // ================= 完成 =================
  function showFinale() {
    var f = $('#finale'), ph = $('#finPhoto'); if (ph && !ph.getAttribute('src')) ph.src = ph.getAttribute('data-src'); f.classList.add('open'); var box = $('#confetti'), cs = ['#d8414e', '#2b7fd4', '#f4c542', '#4cb989', '#ffffff', '#f0902f'], h = '';
    for (var i = 0; i < 70; i++) h += '<i style="left:' + (Math.random() * 100) + '%;background:' + cs[i % cs.length] + ';animation-delay:' + (Math.random() * 1.8).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 2).toFixed(2) + 's;transform:rotate(' + (Math.random() * 360 | 0) + 'deg)"></i>';
    box.innerHTML = h;
  }
  $('#finaleClose').addEventListener('click', function () { $('#finale').classList.remove('open'); });
  $('#btnVote').addEventListener('click', showFinale);
  var SHARE = 'https://chihyungho.github.io/policy-island/';
  $('#shLine').href = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(SHARE);
  $('#shFb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(SHARE);
  $('#shCopy').addEventListener('click', function () { var b = this; function ok() { b.textContent = '✅ 已複製連結'; setTimeout(function () { b.textContent = '🔗 複製連結'; }, 1800); } if (navigator.clipboard) navigator.clipboard.writeText(SHARE).then(ok, function () { }); else { var ta = document.createElement('textarea'); ta.value = SHARE; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { } document.body.removeChild(ta); } });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if ($('#finale').classList.contains('open')) $('#finale').classList.remove('open'); else if ($('#textlist').classList.contains('open')) openText(false); else if (document.body.classList.contains('panel-open')) { if (state.tour) stopTour(); clearSel(); } } });

  // ================= 啟動 =================
  function boot() {
    setFuture(true); env.future = 1; $('#loader').classList.add('gone'); ISL.start();
    var hsh = location.hash.replace('#', '');
    if (PM[hsh]) { closeIntro(); setFuture(true); env.future = 1; selectPolicy(hsh); }
    else if (hsh.indexOf('site-') === 0 && SM[hsh.slice(5)]) { closeIntro(); setFuture(true); env.future = 1; selectSite(hsh.slice(5)); }
  }
  if (ISL.loaded) boot(); else ISL.ready.push(boot);
  ISL.api = { selectPolicy: selectPolicy, selectSite: selectSite, selectPersona: selectPersona, startTour: startTour, setFuture: setFuture, state: state, siteObjs: siteObjs };
})();
