// === 新竹政策島 models：以程式產生的低面數地標模型 ===
(function () {
  'use strict';
  var ISL = window.ISL; if (!ISL || !ISL.ok) return;
  var M = ISL.mat, B = ISL.models = {};
  var UB = new THREE.BoxGeometry(1, 1, 1), cylC = {}, coneC = {};
  var USPH = new THREE.IcosahedronGeometry(1, 1), UHEMI = new THREE.SphereGeometry(1, 22, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  var UPYR = new THREE.ConeGeometry(0.7071, 1, 4, 1).rotateY(Math.PI / 4);
  var UPRISM = (function () { // 山牆屋頂：屋脊沿 X
    var g = new THREE.BufferGeometry(), a = [-.5, 0, -.5], b = [.5, 0, -.5], c = [.5, 0, .5], d = [-.5, 0, .5], e = [-.5, 1, 0], f = [.5, 1, 0];
    var tri = [d, c, f, d, f, e, b, a, e, b, e, f, a, d, e, c, b, f, a, b, c, a, c, d], v = [];
    tri.forEach(function (p) { v.push(p[0], p[1], p[2]); });
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  })();
  function add(g, geo, m, sx, sy, sz, x, y, z, ry) { var me = new THREE.Mesh(geo, m); me.scale.set(sx, sy, sz); me.position.set(x, y, z); if (ry) me.rotation.y = ry; g.add(me); return me; }
  function box(g, m, w, h, d, x, y, z, ry) { return add(g, UB, m, w, h, d, x, y + h / 2, z, ry); }
  function cyl(g, m, r, h, x, y, z, seg, top) {
    var k = (seg || 12) + '_' + (top === undefined ? 1 : top);
    if (!cylC[k]) cylC[k] = new THREE.CylinderGeometry(top === undefined ? 1 : top, 1, 1, seg || 12);
    return add(g, cylC[k], m, r, h, r, x, y + h / 2, z);
  }
  function cone(g, m, r, h, x, y, z, seg) { var k = seg || 8; if (!coneC[k]) coneC[k] = new THREE.ConeGeometry(1, 1, k); return add(g, coneC[k], m, r, h, r, x, y + h / 2, z); }
  function sph(g, m, r, x, y, z, sy) { return add(g, USPH, m, r, r * (sy || 1), r, x, y, z); }
  function prism(g, m, w, h, d, x, y, z, ry) { return add(g, UPRISM, m, w, h, d, x, y, z, ry); }
  function pyr(g, m, w, h, d, x, y, z) { return add(g, UPYR, m, w, h, d, x, y + h / 2, z); }
  function grp(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
  function fut(o, delay) { o.userData.fut = 1; o.userData.delay = delay || 0; return o; }
  function pre(o) { o.userData.pre = 1; return o; }
  function tree(g, x, z, s, kind) {
    s = s || 1; cyl(g, M('#7a5a3c'), .018 * s, .07 * s, x, 0, z, 5);
    if (kind === 'round') sph(g, M(Math.random() < .5 ? '#5fae5a' : '#74c26a'), .075 * s, x, .12 * s, z, 0.9);
    else if (kind === 'palm') { cyl(g, M('#8a6a4a'), .014 * s, .2 * s, x, 0, z, 5); for (var i = 0; i < 5; i++) { var l = box(g, M('#4fa35a'), .13 * s, .012 * s, .035 * s, x + Math.cos(i * 1.257) * .055 * s, .2 * s, z + Math.sin(i * 1.257) * .055 * s, -i * 1.257); l.rotation.z = -.35; } }
    else cone(g, M(Math.random() < .5 ? '#3f8f4a' : '#4fa35a'), .065 * s, .2 * s, x, .05 * s, z, 6);
  }
  function windows(g, w, y, z, n, m, h) { for (var i = 0; i < n; i++) box(g, m, w / n * .55, h || .07, .012, -w / 2 + (i + .5) * w / n, y, z); }
  var WIN = function () { return M('#35506e', { em: '#ffd58a', ei: 1.5, rough: .4 }); };
  var GLASS = function () { return M('#8fc4ee', { em: '#9fe0ff', ei: 1.1, rough: .25, metal: .3 }); };
  B.helpers = { box: box, cyl: cyl, cone: cone, sph: sph, prism: prism, pyr: pyr, grp: grp, fut: fut, pre: pre, tree: tree };

  // ---- 新竹火車站 ----
  B.station = function (g) {
    var c = M('#eadfc8'), r = M('#55645d'), w = WIN();
    box(g, c, 1.5, .24, .4, 0, 0, 0); prism(g, r, 1.56, .13, .48, 0, .24, 0);
    box(g, c, .42, .4, .48, 0, 0, .03); prism(g, r, .5, .14, .46, 0, .4, .03, Math.PI / 2);
    box(g, c, .2, .3, .2, 0, .4, .06); pyr(g, r, .28, .24, .28, 0, .7, .06);
    var ck = cyl(g, M('#ffffff', { em: '#fff2c0', ei: 1.4 }), .065, .02, 0, .55, .17, 14); ck.rotation.x = Math.PI / 2;
    var wl = grp(g, -.5, 0, 0), wr = grp(g, .5, 0, 0); windows(wl, .44, .08, .206, 4, w); windows(wr, .44, .08, .206, 4, w);
    box(g, M('#2a2f38'), .12, .16, .02, 0, 0, .275);
    box(g, M('#9aa7b3'), 1.8, .025, .2, 0, .18, -.36); for (var i = -3; i <= 3; i++) cyl(g, M('#7d8894'), .012, .18, i * .27, 0, -.36, 5);
    box(g, M('#c9c2b4'), 1.7, .012, .5, 0, 0, .45);
  };
  // ---- 迎曦門 ----
  B.gate = function (g) {
    var st = M('#b7a48a'), red = M('#b5412f'), rf = M('#5b4a3c'), lan = M('#ff5a3c', { em: '#ff7a3c', ei: 2.2 });
    box(g, st, .9, .3, .56, 0, 0, 0); box(g, M('#231d1a'), .22, .2, .58, 0, 0, 0);
    box(g, M('#cdbfa8'), .96, .04, .62, 0, .3, 0);
    for (var i = -2; i <= 2; i++) for (var k = -1; k <= 1; k += 2) if (i !== 0 || true) cyl(g, red, .018, .16, i * .15, .34, k * .16, 6);
    box(g, red, .58, .12, .3, 0, .36, 0); pyr(g, rf, 1.02, .13, .7, 0, .5, 0);
    box(g, red, .36, .1, .2, 0, .6, 0); pyr(g, rf, .68, .17, .46, 0, .7, 0);
    sph(g, lan, .03, -.33, .33, .32); sph(g, lan, .03, .33, .33, .32); sph(g, lan, .03, -.33, .33, -.32); sph(g, lan, .03, .33, .33, -.32);
    // 光雕（夜間）
    var beam = cone(g, ISL.glowMat('#ffb057', 0), .5, 1.2, 0, .1, 0, 16); beam.rotation.x = Math.PI; beam.position.y = 1.3; beam.userData.nightGlow = .22;
    g.userData.glows = [beam];
    cyl(g, M('#cfc8b8'), .7, .012, 0, 0, 0, 20);
  };
  // ---- 城隍廟 ----
  B.temple = function (g) {
    var red = M('#b33a2b'), tile = M('#d9732e'), gold = M('#f2c14e', { em: '#ffb53a', ei: 1.2 }), lan = M('#ff4d2e', { em: '#ff6a2e', ei: 2.4 });
    box(g, M('#cfc8b8'), 1.1, .05, .9, 0, 0, 0);
    box(g, red, .8, .2, .46, 0, .05, -.08); prism(g, tile, 1.0, .2, .66, 0, .25, -.08);
    box(g, tile, .1, .05, .1, -.52, .26, -.08).rotation.z = .5; box(g, tile, .1, .05, .1, .52, .26, -.08).rotation.z = -.5;
    cone(g, gold, .03, .08, 0, .45, -.08, 5);
    box(g, red, .5, .14, .24, 0, .05, .3); prism(g, tile, .68, .14, .4, 0, .19, .3);
    for (var i = -1; i <= 1; i += 2) { cyl(g, red, .025, .16, i * .2, .05, .43, 6); }
    cyl(g, M('#6b5a3a'), .05, .07, 0, .05, .6, 8); cone(g, ISL.glowMat('#ffd9a0', .25), .03, .15, 0, .12, .6, 6);
    for (i = -3; i <= 3; i++) sph(g, lan, .022, i * .11, .26, .52);
    // 廟口小吃攤
    var cs = ['#f4c542', '#4cb989', '#5b8fd6'];
    for (i = 0; i < 3; i++) { box(g, M('#efe6d2'), .13, .07, .1, .62, .05, -.3 + i * .22); box(g, M(cs[i]), .16, .02, .14, .62, .13, -.3 + i * .22); }
  };
  // ---- 新竹州廳（市政府） ----
  B.cityhall = function (g) {
    var br = M('#b65a45'), wh = M('#efe9dc'), rf = M('#4c5560'), w = WIN();
    box(g, br, 1.2, .28, .36, 0, 0, 0); box(g, wh, 1.22, .03, .38, 0, .13, 0); prism(g, rf, 1.26, .14, .44, 0, .28, 0);
    box(g, br, .36, .36, .46, 0, 0, .04); prism(g, rf, .44, .16, .44, 0, .36, .04, Math.PI / 2);
    box(g, br, .3, .28, .5, -.52, 0, .08); box(g, br, .3, .28, .5, .52, 0, .08); prism(g, rf, .5, .12, .36, -.52, .28, .08, Math.PI / 2); prism(g, rf, .5, .12, .36, .52, .28, .08, Math.PI / 2);
    for (var i = -1; i <= 1; i += 2) cyl(g, wh, .022, .22, i * .09, 0, .28, 6);
    box(g, wh, .3, .03, .1, 0, .22, .28);
    windows(grp(g, -.26, 0, 0), .3, .18, .185, 3, w, .08); windows(grp(g, .26, 0, 0), .3, .18, .185, 3, w, .08);
    cyl(g, M('#d9d2c2'), .012, .34, 0, .5, .04, 5); box(g, M('#d8414e'), .12, .07, .008, .07, .76, .04);
    // 未來：陽光市政儀表板
    var d = fut(grp(g, 0, .95, .1), .1);
    var pnl = box(d, M('#0e2a55', { em: '#1e63c8', ei: 1.2, always: 1, op: .88 }), .9, .44, .02, 0, 0, 0);
    var cols = ['#4cb989', '#f4c542', '#5b8fd6', '#f0902f', '#4cb989'];
    var bars = []; for (i = 0; i < 5; i++) bars.push(box(d, M(cols[i], { em: cols[i], ei: 1.6, always: 1 }), .1, .1 + .05 * i, .02, -.3 + i * .15, .06, .02));
    sph(d, M('#ffd34d', { em: '#ffc21a', ei: 2, always: 1 }), .06, .36, .5, 0);
    cyl(d, M('#9aa7b3'), .01, .4, -.4, -.4, 0, 4); cyl(d, M('#9aa7b3'), .01, .4, .4, -.4, 0, 4);
    g.userData.anim = function (dt, t) { for (var i = 0; i < bars.length; i++) { var h = .14 + .1 * (Math.sin(t * 1.3 + i * 1.7) * .5 + .5) + i * .02; bars[i].scale.y = h; bars[i].position.y = .06 + h / 2; } d.rotation.y = Math.sin(t * .4) * .25; };
  };
  // ---- 智慧巨蛋（配色與造型參考 smart-dome 概念園區：象牙白外殼、深青綠玻璃帷幕、暖色大廳） ----
  B.dome = function (g) {
    var shell = M('#ece9e0', { rough: .55, smooth: 1 }), shade = M('#d9d6cc'), steel = M('#bfc4bf', { rough: .45, metal: .4 }), mull = M('#37403f');
    var glass = M('#3d6468', { em: '#ffd38a', ei: 1.5, rough: .2, metal: .35 }), lobby = M('#d7c7a4', { em: '#ffd79a', ei: 1.6 });
    var led = M('#163432', { em: '#5fd6c6', ei: 2.4, always: 1, unique: 1 }), conc = M('#d3d0c6'), i, a2;
    cyl(g, conc, .8, .02, 0, 0, 0, 40); cyl(g, M('#b9b6ab'), .6, .035, 0, .02, 0, 40); cyl(g, M('#dcd8cc'), .56, .03, 0, .055, 0, 40);
    // 玻璃帷幕 + 直櫺
    cyl(g, glass, .5, .15, 0, .085, 0, 40);
    for (i = 0; i < 32; i++) { a2 = i / 32 * 6.2832; box(g, mull, .012, .15, .012, Math.cos(a2) * .503, .085, Math.sin(a2) * .503, -a2); }
    // 屋簷與 LED 環
    cyl(g, shade, .54, .028, 0, .235, 0, 40); cyl(g, led, .545, .012, 0, .243, 0, 40);
    cyl(g, M('#f2ead6', { em: '#ffe0a8', ei: 1.4 }), .53, .008, 0, .228, 0, 40);
    // 象牙白屋頂 + 鋼肋
    add(g, UHEMI, shell, .52, .27, .52, 0, .262, 0);
    var ribG = new THREE.TorusGeometry(.524, .008, 4, 18, Math.PI);
    for (i = 0; i < 6; i++) { var rb = add(g, ribG, steel, 1, .525, 1, 0, .262, 0); rb.rotation.y = i * Math.PI / 6; }
    var ring = add(g, new THREE.TorusGeometry(.17, .016, 6, 28), steel, 1, 1, 1, 0, .522, 0); ring.rotation.x = Math.PI / 2;
    cyl(g, M('#2f4b4d', { em: '#7fd3c6', ei: 2.2, always: 1 }), .16, .012, 0, .52, 0, 24);
    // 入口大廳與雨庇
    box(g, lobby, .3, .12, .1, 0, .085, .52); box(g, glass, .24, .09, .104, 0, .09, .52); box(g, M('#f5ecd8'), .4, .014, .2, 0, .205, .56);
    for (i = -1; i <= 1; i += 2) cyl(g, steel, .008, .12, i * .18, .085, .64, 5);
    for (i = 0; i < 5; i++) box(g, M('#dcd8cc'), .34 + i * .03, .011, .03, 0, .074 - i * .011 - .011, .6 + i * .03);
    // 巨蛋經濟圈：旅宿、商圈、交通
    box(g, M('#ece9e0'), .15, .44, .15, .66, .02, .24); box(g, M('#4b7277', { em: '#ffd38a', ei: 1.3, rough: .2 }), .154, .38, .1, .66, .05, .24);
    box(g, M('#c9733f'), .28, .1, .15, .6, .02, -.34); box(g, M('#29484c', { em: '#ffbd6e', ei: 1.6 }), .24, .05, .154, .6, .03, -.34);
    box(g, M('#b38c63'), .2, .08, .14, -.64, .02, .3); box(g, M('#29484c', { em: '#ffbd6e', ei: 1.6 }), .16, .04, .144, -.64, .03, .3);
    box(g, M('#d7ccb5'), .22, .12, .14, -.66, .02, -.22); box(g, M('#2f6a64'), .23, .02, .15, -.66, .14, -.22);
    for (i = 0; i < 10; i++) { a2 = i / 10 * 6.2832 + .3; tree(g, Math.cos(a2) * .72, Math.sin(a2) * .72, .8, 'round'); }
    // 光束（夜間）
    var beams = [];
    for (i = 0; i < 4; i++) { var bm = cone(g, ISL.glowMat('#ffd79a', 0), .16, 2.2, 0, 0, 0, 10); bm.position.set(Math.cos(i * 1.57 + .78) * .45, 1.3, Math.sin(i * 1.57 + .78) * .45); bm.rotation.x = Math.PI; bm.userData.nightGlow = .2; beams.push(bm); }
    g.userData.glows = beams;
    var c1 = new THREE.Color();
    g.userData.anim = function (dt, t) {
      c1.setHSL(.47 + Math.sin(t * .5) * .05, .75, .52 + Math.sin(t * 2) * .06); led.emissive.copy(c1);
      for (var i = 0; i < beams.length; i++) { beams[i].rotation.z = Math.sin(t * .7 + i * 1.6) * .35; beams[i].rotation.x = Math.PI + Math.cos(t * .6 + i) * .3; }
    };
  };
  // ---- 棒球場 ----
  B.ballpark = function (g) {
    cyl(g, M('#6fbf6a'), .5, .02, 0, 0, 0, 28);
    var st = add(g, new THREE.CylinderGeometry(.56, .46, .16, 28, 1, true, Math.PI * .75, Math.PI * 1.5), M('#dfe5ec', { smooth: 1 }), 1, 1, 1, 0, .09, 0); st.material = st.material.clone(); st.material.side = THREE.DoubleSide;
    var st2 = add(g, new THREE.CylinderGeometry(.5, .46, .1, 28, 1, true, Math.PI * .75, Math.PI * 1.5), M('#2b7fd4'), 1, 1, 1, 0, .07, 0); st2.material = st2.material.clone(); st2.material.side = THREE.DoubleSide;
    var d = box(g, M('#c79a63'), .26, .012, .26, 0, .02, .16, Math.PI / 4);
    box(g, M('#6fbf6a'), .15, .014, .15, 0, .02, .16, Math.PI / 4);
    for (var i = 0; i < 4; i++) { var a = i * 1.57 + .78; cyl(g, M('#8a95a3'), .012, .4, Math.cos(a) * .56, 0, Math.sin(a) * .56, 5); box(g, M('#fdfdfd', { em: '#fff6d0', ei: 2.4 }), .09, .05, .02, Math.cos(a) * .56, .4, Math.sin(a) * .56, -a + 1.57); }
    // 棒球
    var ball = sph(g, M('#ffffff', { em: '#ffffff', ei: 1, always: 1 }), .018, 0, .1, .3);
    g.userData.anim = function (dt, t) { var u = (t * .45) % 1; ball.position.set(-.25 * u + .0, .04 + Math.sin(u * Math.PI) * .42, .3 - .7 * u); };
  };
  // ---- 大學校園 ----
  B.campus = function (g, site) {
    var tint = site.tint || '#7b4bb3', c = M('#efe7da'), r = M(tint), w = WIN();
    box(g, c, .5, .22, .22, -.1, 0, -.2); box(g, r, .52, .03, .24, -.1, .22, -.2); windows(grp(g, -.1, 0, 0), .46, .1, -.085, 5, w);
    box(g, c, .2, .42, .2, .32, 0, -.18); box(g, r, .22, .03, .22, .32, .42, -.18); windows(grp(g, .32, 0, 0), .18, .12, -.075, 2, w); windows(grp(g, .32, 0, 0), .18, .26, -.075, 2, w);
    box(g, c, .3, .16, .24, -.3, 0, .2); prism(g, r, .34, .09, .28, -.3, .16, .2);
    box(g, M('#dfe7ef'), .26, .12, .2, .22, 0, .22); box(g, GLASS(), .2, .08, .21, .22, .03, .22);
    // 校門
    box(g, r, .04, .16, .04, -.05, 0, .48); box(g, r, .04, .16, .04, .13, 0, .48); box(g, r, .26, .03, .05, .04, .16, .48);
    cyl(g, M('#a5d67f'), .16, .012, 0, 0, .02, 16);
    for (var i = 0; i < 7; i++) tree(g, -.5 + Math.random(), -.02 + (Math.random() - .5) * .9, .8, i % 2 ? 'round' : '');
    // 知識光點
    var orb = sph(g, M(tint, { em: tint, ei: 2.2, always: 1 }), .04, .32, .6, -.18);
    g.userData.anim = function (dt, t) { orb.position.y = .58 + Math.sin(t * 2 + g.position.x) * .04; };
  };
  // ---- 科學園區 ----
  B.fab = function (g) {
    var wh = M('#eef2f7'), bl = M('#2b7fd4'), gl = GLASS(), vent = M('#b8c2ce');
    function fab(x, z, w, d, h) { box(g, wh, w, h, d, x, 0, z); box(g, bl, w + .01, .03, d + .01, x, h * .62, z); for (var i = 0; i < 3; i++) box(g, vent, w * .16, .04, d * .5, x - w * .3 + i * w * .3, h, z); }
    fab(-.3, -.22, .46, .3, .16); fab(.26, -.28, .4, .26, .2); fab(-.28, .26, .42, .28, .14); fab(.3, .2, .34, .3, .16);
    box(g, M('#dfe7ef'), .16, .5, .16, 0, 0, 0); box(g, gl, .165, .44, .12, 0, .04, 0); box(g, gl, .12, .44, .165, 0, .04, 0);
    for (var i = 0; i < 6; i++) tree(g, (Math.random() - .5) * 1.1, (Math.random() - .5) * 1.1, .7, 'round');
    // 晶圓
    var wf = grp(g, 0, .72, 0);
    var disc = cyl(wf, M('#c9d6ff', { em: '#7fa8ff', ei: 1.6, always: 1, rough: .15, metal: .8 }), .13, .012, 0, 0, 0, 24);
    for (i = -2; i <= 2; i++) { box(wf, M('#35b4ff', { em: '#35b4ff', ei: 2, always: 1 }), .22, .004, .006, 0, .012, i * .045); box(wf, M('#35b4ff', { em: '#35b4ff', ei: 2, always: 1 }), .006, .004, .22, i * .045, .012, 0); }
    wf.rotation.x = .5;
    var beam = cyl(g, ISL.glowMat('#6fc3ff', 0), .03, 2.6, 0, .5, 0, 8); beam.userData.nightGlow = .35; g.userData.glows = [beam];
    g.userData.anim = function (dt, t) { wf.rotation.y = t * .8; wf.position.y = .72 + Math.sin(t * 1.4) * .03; };
  };
  // ---- 學校 ----
  B.school = function (g, site) {
    var c = M('#f2e8d5'), r = M('#c8553d'), w = WIN();
    box(g, c, .7, .2, .16, 0, 0, -.26); box(g, r, .72, .025, .18, 0, .2, -.26); windows(grp(g, 0, 0, 0), .66, .1, -.175, 7, w);
    box(g, c, .16, .2, .4, -.3, 0, .0); box(g, r, .18, .025, .42, -.3, .2, 0);
    cyl(g, M('#c96f4f'), .2, .008, .12, 0, .1, 20); cyl(g, M('#6fbf6a'), .14, .01, .12, 0, .1, 20);
    cyl(g, M('#d9d2c2'), .008, .32, -.05, 0, -.12, 4); box(g, M('#d8414e'), .09, .055, .006, 0, .27, -.12);
    tree(g, .4, .3, .9, 'round'); tree(g, -.42, .34, .8, 'round');
    // 未來：增班的新校舍
    var nw = fut(grp(g, .3, 0, 0), .2);
    box(nw, M('#e9e2ff'), .16, .26, .4, 0, 0, 0); box(nw, M(site.id === 'guanpu' ? '#9b8bc4' : '#3fb0c4'), .18, .025, .42, 0, .26, 0); windows(grp(nw, 0, 0, 0), .001, .1, 0, 1, w);
    for (var i = 0; i < 3; i++) box(nw, w, .012, .07, .07, .083, .1, -.13 + i * .13);
    var star = sph(nw, M('#ffd34d', { em: '#ffc21a', ei: 2.2, always: 1 }), .035, 0, .42, 0);
    g.userData.anim = function (dt, t) { star.position.y = .42 + Math.sin(t * 2.4) * .03; star.rotation.y = t * 2; };
  };
  // ---- 市場 ----
  B.market = function (g) {
    var c = M('#efe6d2');
    box(g, c, .8, .18, .5, 0, 0, 0); var rf = cyl(g, M('#c96f4f'), .26, .8, 0, 0, 0, 14); rf.rotation.z = Math.PI / 2; rf.scale.set(.26, .8, .26); rf.position.set(0, .18, 0); rf.scale.x = .12;
    for (var i = 0; i < 8; i++) box(g, M(i % 2 ? '#d8414e' : '#ffffff'), .1, .02, .12, -.35 + i * .1, .14, .3).rotation.x = .35;
    var cs = ['#f4c542', '#4cb989', '#f0902f', '#5b8fd6'];
    for (i = 0; i < 4; i++) { box(g, M('#e3d6bd'), .1, .05, .08, -.3 + i * .2, 0, .46); box(g, M(cs[i]), .13, .015, .11, -.3 + i * .2, .1, .46); cyl(g, M('#8a6a4a'), .006, .1, -.3 + i * .2, 0, .46, 4); }
    // 未來：樓上新創基地
    var up = fut(grp(g, 0, .3, 0), .25);
    box(up, M('#dff1ff', { op: .85, em: '#bfe6ff', ei: .8 }), .5, .14, .34, 0, 0, 0); box(up, M('#d9a92e'), .54, .02, .38, 0, .14, 0);
    var bulb = sph(up, M('#ffe27a', { em: '#ffd34d', ei: 2.6, always: 1 }), .05, 0, .3, 0); cyl(up, M('#8a95a3'), .018, .04, 0, .22, 0, 6);
    g.userData.anim = function (dt, t) { bulb.scale.setScalar(.05 * (1 + Math.sin(t * 3) * .12)); };
  };
  // ---- 南寮：加州海岸 ----
  B.harbor = function (g) {
    var wh = M('#f6f8fb'), red = M('#d8414e');
    box(g, M('#b9b3a6'), .7, .04, .1, .05, 0, -.42); box(g, M('#b9b3a6'), .1, .04, .5, -.3, 0, -.2);
    cyl(g, wh, .045, .34, -.3, .04, -.45, 10, .7); cyl(g, red, .042, .06, -.3, .14, -.45, 10); cyl(g, red, .036, .05, -.3, .28, -.45, 10);
    sph(g, M('#fff2a8', { em: '#ffe27a', ei: 3, always: 1 }), .035, -.3, .41, -.45); cone(g, red, .05, .05, -.3, .43, -.45, 8);
    // 魚鱗天梯
    for (var i = 0; i < 6; i++) box(g, M(i % 2 ? '#cfc8b8' : '#bdb5a4'), .5, .018, .05, .2, i * .018, -.2 + i * .05);
    // 漁船
    var boats = [];
    function boat(x, z, c) { var b = grp(g, x, .02, z); box(b, M(c), .16, .04, .06, 0, 0, 0); box(b, wh, .06, .04, .045, -.02, .04, 0); cyl(b, M('#8a6a4a'), .004, .12, .03, .04, 0, 4); boats.push(b); }
    boat(.0, -.56, '#2b7fd4'); boat(.24, -.6, '#d8414e'); boat(-.14, -.66, '#4cb989');
    // 現在：簡單的海堤
    // 未來：沙灘、舞台、棕櫚、陽傘
    var f = fut(grp(g, 0, 0, 0), .15);
    cyl(f, M('#f1e2b6'), .34, .012, .1, .0, .28, 20).scale.set(.5, .012, .26);
    var uc = ['#d8414e', '#f4c542', '#5b8fd6', '#4cb989', '#f0977f'];
    for (i = 0; i < 5; i++) { cyl(f, M('#ffffff'), .004, .07, -.25 + i * .16, .01, .3 + (i % 2) * .08, 4); cone(f, M(uc[i]), .05, .03, -.25 + i * .16, .075, .3 + (i % 2) * .08, 8); }
    for (i = 0; i < 6; i++) tree(f, -.42 + i * .19, .1, 1.05, 'palm');
    var stg = grp(f, .46, 0, .34); box(stg, M('#2a2f38'), .22, .03, .16, 0, 0, 0); box(stg, M('#8a95a3'), .012, .18, .012, -.1, 0, -.07); box(stg, M('#8a95a3'), .012, .18, .012, .1, 0, -.07); box(stg, M('#8a95a3'), .22, .012, .012, 0, .18, -.07);
    var lts = []; for (i = 0; i < 3; i++) lts.push(sph(stg, M(uc[i], { em: uc[i], ei: 3, always: 1, unique: 1 }), .016, -.07 + i * .07, .17, -.07));
    // 風箏
    var kites = [];
    for (i = 0; i < 3; i++) { var k = grp(f, -.1 + i * .25, .7, .2); var km = box(k, M(uc[i], { em: uc[i], ei: .5, always: 1 }), .09, .09, .006, 0, 0, 0); km.rotation.z = Math.PI / 4; box(k, M('#ffffff'), .004, .16, .004, 0, -.2, 0); kites.push(k); }
    g.userData.anim = function (dt, t) {
      for (var i = 0; i < boats.length; i++) { boats[i].position.y = .02 + Math.sin(t * 1.6 + i * 2) * .008; boats[i].rotation.z = Math.sin(t * 1.3 + i) * .08; }
      for (i = 0; i < kites.length; i++) { kites[i].position.y = .62 + i * .12 + Math.sin(t * 1.1 + i * 2.1) * .06; kites[i].position.x = -.1 + i * .25 + Math.sin(t * .8 + i) * .08; kites[i].rotation.z = Math.sin(t * 1.5 + i) * .25; }
      for (i = 0; i < lts.length; i++) lts[i].material.emissiveIntensity = 1.5 + Math.sin(t * 6 + i * 2) * 1.5;
    };
  };
  // ---- 香山濕地 ----
  B.wetland = function (g) {
    var wd = M('#b08a5c');
    for (var i = 0; i < 22; i++) { var a = i / 22 * 5.2 - .6, r = .34; box(g, wd, .09, .012, .05, Math.cos(a) * r, .035, Math.sin(a) * r, -a + 1.57); if (i % 3 === 0) cyl(g, M('#7a5a3c'), .006, .04, Math.cos(a) * r, 0, Math.sin(a) * r, 4); }
    box(g, wd, .3, .012, .05, .48, .035, .12, .3);
    var crabs = [];
    for (i = 0; i < 9; i++) { var c = grp(g, (Math.random() - .5) * .5, .006, (Math.random() - .5) * .5); sph(c, M('#e8502e'), .018, 0, .012, 0, .6); sph(c, M('#ff7a4d'), .012, .022, .03, 0); crabs.push(c); }
    for (i = 0; i < 3; i++) { var e = grp(g, -.5 + i * .12, 0, .46 - i * .06); cyl(e, M('#f4c542'), .003, .05, 0, 0, 0, 4); sph(e, M('#ffffff'), .022, 0, .065, 0, 1.3); sph(e, M('#ffffff'), .01, .014, .1, 0); }
    g.userData.anim = function (dt, t) { for (var i = 0; i < crabs.length; i++) { crabs[i].position.x += Math.sin(t * 2 + i * 3.3) * .0009; crabs[i].children[1].position.y = .03 + Math.abs(Math.sin(t * 5 + i)) * .014; } };
  };
  // ---- 青草湖 ----
  B.lake = function (g) {
    var br = add(g, new THREE.TorusGeometry(.2, .014, 5, 14, Math.PI), M('#d8414e'), 1, .5, 1, 0, .01, .1);
    box(g, M('#c9c2b4'), .42, .012, .05, 0, .09, .1);
    cyl(g, M('#cfc8b8'), .09, .03, -.34, 0, -.18, 6); for (var i = 0; i < 6; i++) cyl(g, M('#b5412f'), .008, .1, -.34 + Math.cos(i * 1.047) * .07, .03, -.18 + Math.sin(i * 1.047) * .07, 4);
    cone(g, M('#5b4a3c'), .13, .08, -.34, .13, -.18, 6);
    for (i = 0; i < 8; i++) tree(g, (Math.random() - .5) * 1.0, -.4 + Math.random() * .2, .9, i % 2 ? 'round' : '');
    var b = grp(g, .22, .01, -.12); box(b, M('#ffffff'), .07, .02, .035, 0, 0, 0); cone(b, M('#f4c542'), .02, .05, 0, .02, 0, 4);
    g.userData.anim = function (dt, t) { b.position.x = .22 + Math.sin(t * .4) * .12; b.position.z = -.12 + Math.cos(t * .4) * .06; };
  };
  // ---- 十八尖山 ----
  B.peak = function (g) {
    for (var i = 0; i < 16; i++) tree(g, (Math.random() - .5) * 1.1, (Math.random() - .5) * 1.0, .9 + Math.random() * .5, i % 3 ? '' : 'round');
    cyl(g, M('#cfc8b8'), .1, .03, 0, 0, .2, 8); for (i = 0; i < 4; i++) cyl(g, M('#b5412f'), .01, .12, Math.cos(i * 1.57 + .78) * .07, .03, .2 + Math.sin(i * 1.57 + .78) * .07, 4); pyr(g, M('#5b4a3c'), .24, .09, .24, 0, .15, .2);
    // 未來：空軌車站
    var s = fut(grp(g, 0, 0, -.1), .1);
    box(s, M('#eef2f7'), .34, .04, .22, 0, .3, 0); box(s, GLASS(), .3, .12, .18, 0, .34, 0); box(s, M('#f0902f'), .38, .025, .26, 0, .46, 0);
    for (i = -1; i <= 1; i += 2) for (var k = -1; k <= 1; k += 2) cyl(s, M('#8a95a3'), .014, .3, i * .14, 0, k * .08, 5);
  };
  // ---- 治安辦公室 ----
  B.police = function (g) {
    var c = M('#dfe6ee'), n = M('#1f3f73'), w = WIN();
    box(g, c, .6, .26, .34, 0, 0, 0); box(g, n, .62, .04, .36, 0, .26, 0); box(g, n, .62, .03, .36, 0, .1, 0);
    windows(grp(g, 0, 0, 0), .56, .17, .175, 5, w, .06); box(g, c, .16, .46, .16, -.2, 0, -.04); box(g, n, .18, .03, .18, -.2, .46, -.04);
    var badge = cyl(g, M('#f2c14e', { em: '#ffcf4a', ei: 1.5 }), .05, .012, .12, .2, .178, 6); badge.rotation.x = Math.PI / 2;
    sph(g, M('#2b7fd4', { em: '#35b4ff', ei: 3, always: 1 }), .02, -.2, .5, -.04);
    // 未來：AI 雷達
    var r = fut(grp(g, .14, .3, -.02), .1);
    cyl(r, M('#8a95a3'), .012, .14, 0, 0, 0, 5); var dish = grp(r, 0, .16, 0); var dm = cyl(dish, M('#e9f6ff', { em: '#3fb0c4', ei: 1.4, always: 1 }), .1, .02, 0, 0, 0, 14, .6); dish.rotation.x = .9; cone(dish, M('#3fb0c4', { em: '#3fb0c4', ei: 2.5, always: 1 }), .012, .08, 0, .02, 0, 5);
    g.userData.anim = function (dt, t) { r.rotation.y = t * 1.6; };
  };
  // ---- 醫院（敬老卡） ----
  B.hospital = function (g) {
    var wh = M('#f6f8fb'), w = WIN();
    box(g, wh, .56, .4, .22, 0, 0, -.1); box(g, wh, .2, .26, .34, -.18, 0, .12); box(g, M('#cfe0ee'), .58, .03, .24, 0, .4, -.1);
    for (var j = 0; j < 3; j++) windows(grp(g, 0, 0, 0), .5, .1 + j * .1, .012, 6, w, .05);
    box(g, M('#d8414e', { em: '#ff5a66', ei: 1.5 }), .1, .03, .012, .16, .32, .014); box(g, M('#d8414e', { em: '#ff5a66', ei: 1.5 }), .03, .1, .012, .16, .285, .014);
    tree(g, .3, .25, .9, 'round'); tree(g, .42, .1, .8, 'round');
    // 未來：敬老卡自由配
    var c = fut(grp(g, .1, .62, .1), .2);
    box(c, M('#ffffff', { em: '#ffffff', ei: .4, always: 1 }), .3, .19, .012, 0, 0, 0);
    var qs = ['#4cb989', '#f0977f', '#5b8fd6', '#f4c542'];
    for (var i = 0; i < 4; i++) box(c, M(qs[i], { em: qs[i], ei: 1.2, always: 1 }), .12, .07, .014, -.07 + (i % 2) * .14, .02 + (i > 1 ? .085 : 0), .002);
    g.userData.anim = function (dt, t) { c.rotation.y = t * .9; c.position.y = .62 + Math.sin(t * 1.5) * .03; };
  };
  // ---- 公幼 ----
  B.care = function (g) {
    box(g, M('#ffe08a'), .46, .18, .32, 0, 0, 0); prism(g, M('#e8684a'), .52, .13, .38, 0, .18, 0);
    box(g, M('#5b8fd6'), .08, .12, .012, -.1, 0, .162); box(g, WIN(), .1, .07, .012, .1, .07, .162);
    box(g, M('#4cb989'), .2, .012, .05, .38, .09, .12).rotation.z = -.5; box(g, M('#f0902f'), .03, .16, .05, .46, 0, .12);
    cyl(g, M('#f1e2b6'), .12, .008, .36, 0, -.14, 10);
    tree(g, -.36, .22, 1, 'round'); tree(g, -.4, -.12, .8, 'round');
    for (var i = 0; i < 3; i++) { var k = grp(g, -.05 + i * .11, 0, .3); cyl(k, M(['#d8414e', '#5b8fd6', '#4cb989'][i]), .016, .04, 0, 0, 0, 5); sph(k, M('#ffd9b0'), .016, 0, .058, 0); }
    // 未來：時鐘指向 19:00
    var c = fut(grp(g, 0, .5, .0), .2);
    var face = cyl(c, M('#ffffff', { em: '#fff6d0', ei: .8, always: 1 }), .12, .02, 0, 0, 0, 20); face.rotation.x = Math.PI / 2;
    var rim = add(c, new THREE.TorusGeometry(.12, .014, 5, 20), M('#f0977f'), 1, 1, 1, 0, .01, 0);
    var hp = grp(c, 0, .01, .016), hh = box(hp, M('#12386b'), .014, .06, .01, 0, 0, 0); hh.position.set(0, .03, 0); hp.rotation.z = -Math.PI * 7 / 6;
    var mp = grp(c, 0, .01, .02), mh = box(mp, M('#d8414e'), .009, .09, .008, 0, 0, 0); mh.position.set(0, .045, 0);
    g.userData.anim = function (dt, t) { c.rotation.y = Math.sin(t * .6) * .5; };
  };
  // ---- 青銀共居 ----
  B.cohouse = function (g) {
    box(g, M('#f6ead8'), .34, .2, .28, -.14, 0, 0); prism(g, M('#5b8fd6'), .4, .12, .34, -.14, .2, 0);
    box(g, M('#fde3d6'), .26, .15, .24, .2, 0, .02); prism(g, M('#f0977f'), .32, .1, .3, .2, .15, .02);
    box(g, M('#c9a77a'), .3, .012, .14, .03, 0, .22); box(g, WIN(), .08, .07, .012, -.14, .07, .142); box(g, WIN(), .07, .06, .012, .2, .06, .142);
    cyl(g, M('#a5d67f'), .2, .008, .06, 0, .36, 12); box(g, M('#b08a5c'), .12, .03, .06, .06, 0, .36);
    tree(g, -.38, .28, 1, 'round'); tree(g, .42, .3, .9, 'round');
    var h = grp(g, .03, .5, .05); sph(h, M('#ff5a7a', { em: '#ff5a7a', ei: 1.6, always: 1 }), .04, -.03, 0, 0); sph(h, M('#ff5a7a', { em: '#ff5a7a', ei: 1.6, always: 1 }), .04, .03, 0, 0); var p = cone(h, M('#ff5a7a', { em: '#ff5a7a', ei: 1.6, always: 1 }), .06, .08, 0, -.085, 0, 4); p.rotation.x = Math.PI;
    fut(h, .2);
    g.userData.anim = function (dt, t) { h.position.y = .5 + Math.sin(t * 2) * .03; h.rotation.y = t * .8; };
  };
  // ---- 香山副都心 ----
  B.housing = function (g) {
    var cs = ['#f6efe2', '#e9f1f7', '#fbe9dc', '#eef5e4'], ac = ['#f0902f', '#5b8fd6', '#f0977f', '#4cb989'], w = WIN();
    var ps = [[-.42, -.3, .5], [-.14, -.42, .7], [.2, -.4, .58], [.46, -.22, .44], [-.5, .1, .38], [.5, .16, .36]];
    ps.forEach(function (p, i) {
      var t = grp(g, p[0], 0, p[1]); box(t, M(cs[i % 4]), .18, p[2], .16, 0, 0, 0); box(t, M(ac[i % 4]), .19, .02, .17, 0, p[2], 0);
      for (var j = 0; j < Math.floor(p[2] / .09); j++) box(t, w, .14, .035, .012, 0, .06 + j * .09, .081);
      t.userData.delay = i * .12;
    });
    // 中央公園
    cyl(g, M('#8fd07a'), .3, .012, 0, 0, .12, 20); cyl(g, M('#7fd6e8', { rough: .2 }), .1, .014, .04, 0, .14, 14);
    for (var i = 0; i < 9; i++) { var a = i / 9 * 6.283; tree(g, Math.cos(a) * .24, .12 + Math.sin(a) * .22, .9, i % 2 ? 'round' : ''); }
    box(g, M('#8a95a3'), .12, .012, .04, .0, .06, .5); box(g, M('#4cb989'), .14, .04, .05, 0, 0, .5);
  };
  // ---- 香山工業區 ----
  B.factory = function (g) {
    var c = M('#dfe4ea'), r = M('#7d8894');
    function saw(x, z, n) { box(g, c, .14 * n, .14, .28, x, 0, z); for (var i = 0; i < n; i++) { var p = prism(g, r, .28, .07, .14, x - .07 * (n - 1) + i * .14, .14, z, Math.PI / 2); } }
    saw(-.26, -.2, 4); saw(.28, -.22, 3); saw(-.2, .24, 3);
    box(g, M('#eef2f7'), .26, .22, .2, .3, 0, .22); box(g, GLASS(), .22, .16, .205, .3, .03, .22);
    cyl(g, M('#b8c2ce'), .03, .34, .52, 0, -.04, 8);
    // 未來：綠色轉型（太陽能板、綠屋頂）
    var f = fut(grp(g, 0, 0, 0), .15), sol = M('#1d3f8f', { em: '#2b7fd4', ei: .6, rough: .2, metal: .5 });
    for (var i = 0; i < 4; i++) { var s = box(f, sol, .12, .008, .22, -.47 + i * .14, .225, -.2); s.rotation.z = .25; }
    for (i = 0; i < 3; i++) { s = box(f, sol, .12, .008, .22, -.34 + i * .14, .225, .24); s.rotation.z = .25; }
    box(f, M('#8fd07a'), .26, .015, .2, .3, .22, .22);
    var arr = grp(f, .0, .5, 0); cone(arr, M('#4f7df0', { em: '#4f7df0', ei: 2, always: 1 }), .06, .1, 0, .06, 0, 4); box(arr, M('#4f7df0', { em: '#4f7df0', ei: 2, always: 1 }), .04, .1, .04, 0, -.04, 0); arr.rotation.x = Math.PI;
    for (i = 0; i < 5; i++) tree(g, -.6 + i * .3, .5, .8, 'round');
    g.userData.anim = function (dt, t) { arr.position.y = .56 - ((t * .5) % 1) * .2; };
  };
  // ---- 國際展演中心 ----
  B.expo = function (g) {
    // 現在：鋼構 + 吊車
    var p = pre(grp(g, 0, 0, 0)), st = M('#8a95a3'), yl = M('#f4c542');
    for (var i = -2; i <= 2; i++) for (var k = -1; k <= 1; k++) cyl(p, st, .012, .3, i * .2, 0, k * .2, 4);
    for (k = -1; k <= 1; k++) { box(p, st, .82, .014, .014, 0, .3, k * .2); box(p, st, .82, .014, .014, 0, .16, k * .2); }
    for (i = -2; i <= 2; i++) box(p, st, .014, .014, .42, i * .2, .3, 0);
    var cr = grp(p, .52, 0, .3); cyl(cr, yl, .018, .62, 0, 0, 0, 4); var jib = grp(cr, 0, .62, 0); box(jib, yl, .6, .018, .018, .2, 0, 0); box(jib, M('#5a626e'), .08, .05, .04, -.1, -.03, 0); box(jib, st, .004, .2, .004, .42, -.2, 0);
    for (i = 0; i < 6; i++) box(p, M(i % 2 ? '#f0902f' : '#ffffff'), .16, .05, .012, -.4 + i * .16, 0, .44);
    // 未來：完工
    var f = fut(grp(g, 0, 0, 0), .1);
    box(f, M('#eef2f7'), .9, .2, .46, 0, 0, 0); box(f, GLASS(), .7, .14, .47, 0, .03, 0);
    var rf = cyl(f, M('#f3f6fa', { smooth: 1, rough: .4 }), .25, .92, 0, 0, 0, 16); rf.rotation.z = Math.PI / 2; rf.scale.set(.1, .92, .25); rf.position.set(0, .2, 0);
    box(f, M('#f0902f'), .2, .05, .02, 0, .24, .24);
    for (i = 0; i < 5; i++) tree(f, -.5 + i * .25, .4, .8, 'round');
    g.userData.anim = function (dt, t) { jib.rotation.y = Math.sin(t * .35) * 1.2; };
  };
  // ---- 演藝廳 ----
  B.theatre = function (g) {
    var c = M('#c98a6a');
    box(g, c, .5, .26, .36, 0, 0, -.1); var fr = cyl(g, c, .25, .2, 0, 0, .08, 16); box(g, M('#8a5a44'), .54, .03, .4, 0, .26, -.1);
    cyl(g, M('#8a5a44'), .26, .03, 0, .2, .08, 16); for (var i = 0; i < 5; i++) { var a = -1 + i * .5; cyl(g, M('#f2e8d5'), .014, .18, Math.sin(a) * .25, 0, .08 + Math.cos(a) * .25, 5); }
    box(g, M('#e9c04a', { em: '#ffcf4a', ei: 1.8 }), .2, .05, .012, 0, .12, .335);
    var bs = []; for (i = -1; i <= 1; i += 2) { var b = cone(g, ISL.glowMat('#ffd9a0', 0), .1, 1.3, i * .2, 0, .1, 8); b.position.y = .9; b.rotation.x = Math.PI; b.userData.nightGlow = .22; bs.push(b); }
    g.userData.glows = bs;
    g.userData.anim = function (dt, t) { bs[0].rotation.z = Math.sin(t * .8) * .35; bs[1].rotation.z = -Math.sin(t * .8 + 1) * .35; };
  };
  // ---- 將軍村 / 日式宿舍 ----
  function jhouse(g, x, z, s, ry) { var h = grp(g, x, 0, z); h.rotation.y = ry || 0; h.scale.setScalar(s || 1); box(h, M('#d9cdb8'), .3, .1, .2, 0, .02, 0); box(h, M('#6b5a48'), .32, .02, .22, 0, 0, 0); prism(h, M('#3e4650'), .38, .1, .3, 0, .12, 0); box(h, M('#8a6a4a'), .1, .08, .012, 0, .03, .102); box(h, WIN(), .06, .05, .012, -.1, .05, .102); return h; }
  B.village = function (g) { jhouse(g, -.26, -.2, 1, 0); jhouse(g, .2, -.24, .9, .2); jhouse(g, -.2, .22, .9, -.15); jhouse(g, .26, .2, 1, 0); for (var i = 0; i < 6; i++) tree(g, (Math.random() - .5) * 1.0, (Math.random() - .5) * .9, 1, i % 2 ? '' : 'round'); box(g, M('#cfc8b8'), 1.0, .04, .02, 0, 0, .46); };
  B.jhouse = function (g) { jhouse(g, 0, 0, 1.6, 0); tree(g, -.36, .2, 1.4, ''); tree(g, .36, -.16, 1.1, 'round'); box(g, M('#cfc8b8'), .9, .05, .02, 0, 0, .34); };
  // ---- 新竹公園 ----
  B.park = function (g) {
    cyl(g, M('#a5d67f'), .5, .01, 0, 0, 0, 20); cyl(g, M('#7fd6e8', { rough: .2 }), .16, .012, -.12, 0, .14, 14);
    box(g, M('#bfe6ff', { op: .7, em: '#bfe6ff', ei: 1, rough: .1 }), .26, .14, .18, .2, 0, -.2); pyr(g, M('#8fc4ee', { op: .8, rough: .1 }), .3, .1, .22, .2, .14, -.2);
    box(g, M('#e9dcc3'), .04, .14, .04, -.36, 0, -.24); box(g, M('#e9dcc3'), .04, .14, .04, -.2, 0, -.24); box(g, M('#f0902f'), .22, .035, .05, -.28, .14, -.24);
    // 長頸鹿
    var z = grp(g, -.3, 0, -.06); box(z, M('#f4c542'), .07, .04, .03, 0, .06, 0); box(z, M('#f4c542'), .016, .1, .016, .03, .08, 0); box(z, M('#f4c542'), .035, .02, .02, .04, .18, 0); for (var i = -1; i <= 1; i += 2) { box(z, M('#d9a92e'), .008, .06, .008, i * .025, 0, .008); }
    for (i = 0; i < 9; i++) { var a = i / 9 * 6.283; tree(g, Math.cos(a) * .42, Math.sin(a) * .42, 1, i % 2 ? 'round' : ''); }
    g.userData.anim = function (dt, t) { z.rotation.y = Math.sin(t * .5) * .6; };
  };
  // ---- 商圈 + 智慧停車 ----
  B.mall = function (g) {
    box(g, M('#f6f8fb'), .5, .3, .4, -.12, 0, 0); box(g, M('#e85d75'), .52, .06, .42, -.12, .2, 0); box(g, GLASS(), .3, .14, .41, -.12, .03, 0);
    var p = grp(g, .34, 0, 0); for (var i = 0; i < 4; i++) { box(p, M('#b8c2ce'), .28, .015, .36, 0, i * .07, 0); if (i < 3) for (var k = -1; k <= 1; k += 2) for (var j = -1; j <= 1; j += 2) cyl(p, M('#8a95a3'), .01, .07, k * .12, i * .07, j * .16, 4); }
    var s = fut(grp(g, .34, .3, .19), .2); box(s, M('#2b7fd4', { em: '#35b4ff', ei: 1.8, always: 1 }), .1, .1, .014, 0, 0, 0); box(s, M('#ffffff', { em: '#ffffff', ei: 1.5, always: 1 }), .012, .07, .016, -.02, .015, 0); box(s, M('#ffffff', { em: '#ffffff', ei: 1.5, always: 1 }), .04, .012, .016, 0, .075, 0); box(s, M('#ffffff', { em: '#ffffff', ei: 1.5, always: 1 }), .012, .035, .016, .02, .05, 0); box(s, M('#ffffff', { em: '#ffffff', ei: 1.5, always: 1 }), .04, .012, .016, 0, .04, 0);
    var cars = []; for (i = 0; i < 3; i++) cars.push(box(p, M(['#d8414e', '#f4c542', '#5b8fd6'][i]), .05, .025, .03, -.08 + i * .08, .225, .06));
  };
  // ---- BRT 站 ----
  B.brtstop = function (g) {
    box(g, M('#cfd6de'), .6, .03, .14, 0, 0, 0); for (var i = -1; i <= 1; i++) cyl(g, M('#8a95a3'), .01, .16, i * .24, .03, -.04, 4);
    box(g, M('#bfe6ff', { op: .7, em: '#bfe6ff', ei: .8 }), .62, .015, .18, 0, .19, 0); box(g, M('#4cb989', { em: '#4cb989', ei: 1.6, always: 1 }), .08, .08, .012, .34, .2, 0); cyl(g, M('#8a95a3'), .008, .2, .34, 0, 0, 4);
    for (i = 0; i < 3; i++) { var k = grp(g, -.16 + i * .14, .03, .02); cyl(k, M(['#f0977f', '#5b8fd6', '#f4c542'][i]), .014, .04, 0, 0, 0, 5); sph(k, M('#ffd9b0'), .014, 0, .055, 0); }
  };
  // ---- AI 號誌 ----
  B.signal = function (g) {
    cyl(g, M('#5a626e'), .016, .5, 0, 0, 0, 6); box(g, M('#5a626e'), .3, .016, .016, .14, .5, 0); box(g, M('#2a2f38'), .07, .2, .06, .28, .32, 0);
    var ls = [M('#ff4d3a', { em: '#ff4d3a', ei: 3, always: 1, unique: 1 }), M('#ffcf4a', { em: '#ffcf4a', ei: 3, always: 1, unique: 1 }), M('#3ddc84', { em: '#3ddc84', ei: 3, always: 1, unique: 1 })];
    for (var i = 0; i < 3; i++) sph(g, ls[i], .024, .28, .47 - i * .06, .035);
    var cam = box(g, M('#eef2f7'), .05, .03, .03, .08, .52, 0); var halo = add(g, new THREE.TorusGeometry(.12, .008, 5, 22), M('#35b4ff', { em: '#35b4ff', ei: 2.5, always: 1 }), 1, 1, 1, .08, .56, 0); halo.rotation.x = Math.PI / 2; fut(halo, .1);
    g.userData.anim = function (dt, t) { var ph = (t * .5) % 3 | 0; for (var i = 0; i < 3; i++) ls[i].emissiveIntensity = i === (ph === 0 ? 2 : ph === 1 ? 1 : 0) ? 3.2 : .15; halo.scale.setScalar(1 + ((t * .8) % 1) * .8); };
  };
  // ---- 社區防詐 ----
  B.guard = function (g) {
    box(g, M('#f6ead8'), .3, .16, .24, -.16, 0, 0); prism(g, M('#3fb0c4'), .36, .1, .3, -.16, .16, 0);
    box(g, M('#ffffff'), .28, .14, .22, .2, 0, .02); box(g, M('#4cb989'), .3, .03, .24, .2, .14, .02); box(g, M('#f0902f'), .3, .02, .24, .2, .11, .02); box(g, WIN(), .2, .08, .012, .2, .02, .132);
    tree(g, -.4, .24, 1, 'round'); tree(g, .44, -.2, .9, '');
    var sh = fut(grp(g, 0, 0, 0), .2); var dome = add(sh, UHEMI, new THREE.MeshBasicMaterial({ color: ISL.col('#3fb0c4'), transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide }), .56, .44, .56, 0, 0, 0);
    var ic = sph(sh, M('#3fb0c4', { em: '#3fe0f0', ei: 2.2, always: 1 }), .04, 0, .5, 0);
    g.userData.anim = function (dt, t) { dome.material.opacity = .1 + (Math.sin(t * 2) * .5 + .5) * .12; ic.position.y = .5 + Math.sin(t * 2) * .03; };
  };

  // ---- 交通工具與環境物件 ----
  B.trainCar = function (head) {
    var g = grp(); box(g, M('#f6f8fb'), .3, .075, .09, 0, .02, 0); box(g, M('#2b7fd4'), .302, .02, .092, 0, .035, 0); box(g, M('#12386b', { em: '#ffe9a8', ei: 1.6 }), .26, .025, .094, 0, .062, 0);
    if (head) box(g, M('#f4c542'), .02, .05, .08, .15, .025, 0); return g;
  };
  B.bus = function (c) { var g = grp(); box(g, M(c || '#4cb989'), .2, .075, .075, 0, .015, 0); box(g, M('#12386b', { em: '#ffe9a8', ei: 1.6 }), .17, .028, .078, 0, .055, 0); box(g, M('#ffffff'), .202, .012, .077, 0, .032, 0); return g; };
  B.car = function (c) { var g = grp(); box(g, M(c), .075, .04, .04, 0, .006, 0); return g; };
  B.gondola = function () { var g = grp(); box(g, M('#f0902f'), .1, .085, .075, 0, -.12, 0); box(g, M('#dff1ff', { em: '#fff2c0', ei: 1.6 }), .102, .035, .06, 0, -.085, 0); box(g, M('#5a626e'), .008, .08, .008, 0, -.04, 0); return g; };
  B.turbine = function () {
    var g = grp(); cyl(g, M('#f6f8fb'), .03, 1.1, 0, 0, 0, 8, .5); box(g, M('#f6f8fb'), .12, .06, .06, .02, 1.1, 0);
    var rot = grp(g, .09, 1.13, 0); sph(rot, M('#e9eef5'), .035, 0, 0, 0);
    for (var i = 0; i < 3; i++) { var b = grp(rot); b.rotation.x = i * 2.094; box(b, M('#ffffff'), .012, .5, .05, 0, .02, 0); }
    g.userData.rot = rot; return g;
  };
  B.cloud = function () {
    var g = grp(), m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, transparent: true, opacity: .93 });
    var n = 4 + (Math.random() * 3 | 0); for (var i = 0; i < n; i++) sph(g, m, .5 + Math.random() * .6, (i - n / 2) * .75 + Math.random() * .3, Math.random() * .25, (Math.random() - .5) * .7, .62);
    g.userData.m = m; return g;
  };
  B.crossing = function () { var g = grp(); for (var i = -1; i <= 1; i += 2) { cyl(g, M('#5a626e'), .008, .12, i * .09, 0, 0, 4); var b = box(g, M('#ffffff'), .16, .012, .012, i * .09 - i * .07, .09, 0); box(g, M('#d8414e', { em: '#ff3a2e', ei: 3, always: 1 }), .02, .02, .02, i * .09, .12, 0); } var x1 = box(g, M('#f4c542'), .12, .016, .008, 0, .16, 0), x2 = box(g, M('#f4c542'), .12, .016, .008, 0, .16, 0); x1.rotation.z = .7; x2.rotation.z = -.7; return g; };
  // Q 版何志勇：大頭取自競選照片（卡通化處理，assets/mascot-head.png），小身體以 canvas 繪製（白色 Polo 衫、舉手握旗）
  function chibiTexture() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 512; var c = cv.getContext('2d'), NV = '#1b2a5c', SK = '#f0b98f', SH = '#dda078';
    c.scale(2, 2); c.lineJoin = c.lineCap = 'round';
    function poly(pts, fill, lw) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = lw || 5; c.strokeStyle = NV; c.stroke(); }
    function fist() { c.fillStyle = SK; c.strokeStyle = NV; c.lineWidth = 5; c.beginPath(); c.arc(24, 150, 15, 0, 6.3); c.fill(); c.stroke(); c.lineWidth = 2.5; c.beginPath(); c.moveTo(15, 146); c.lineTo(33, 143); c.moveTo(16, 154); c.lineTo(34, 151); c.stroke(); }
    // 小身體（頭身比約 2 頭身）
    poly([164, 214, 190, 226, 184, 250, 168, 244], SK, 4); poly([158, 208, 186, 220, 178, 236, 160, 230], '#ffffff', 4);
    c.fillStyle = '#ffffff'; c.strokeStyle = NV; c.lineWidth = 5; c.beginPath(); c.moveTo(98, 208); c.quadraticCurveTo(130, 198, 162, 208); c.lineTo(170, 254); c.lineTo(90, 254); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#e6ecf5'; c.beginPath(); c.moveTo(148, 212); c.lineTo(167, 252); c.lineTo(148, 252); c.closePath(); c.fill();
    poly([70, 200, 22, 164, 36, 148, 88, 184], SK, 4); poly([104, 216, 72, 196, 88, 178, 120, 204], '#ffffff', 4);
    poly([114, 206, 130, 224, 106, 226], '#ffffff', 3.5); poly([146, 206, 130, 224, 154, 226], '#ffffff', 3.5);
    c.lineWidth = 2.5; c.strokeStyle = NV; c.beginPath(); c.moveTo(130, 224); c.lineTo(130, 242); c.stroke();
    c.fillStyle = '#fff'; c.strokeStyle = '#d8414e'; c.lineWidth = 3.5; c.beginPath(); c.arc(152, 238, 10, 0, 6.3); c.fill(); c.stroke(); c.fillStyle = '#d8414e'; c.font = '900 15px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('2', 152, 239);
    fist();
    var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
    // 大頭
    var img = new Image();
    img.onload = function () { var h = 214, w = h * img.width / img.height; c.drawImage(img, 134 - w / 2, 0, w, h); fist(); t.needsUpdate = true; };
    img.src = 'assets/mascot-head.png?v=5';
    return t;
  }
  // 吉祥物：Q 版何志勇舉著「② 勇」旗
  B.kite = function () {
    var g = grp(), cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; var c = cv.getContext('2d');
    c.fillStyle = '#d8414e'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#fff'; c.lineWidth = 8; c.strokeRect(6, 6, 244, 116);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(68, 64, 44, 0, 6.3); c.fill(); c.strokeStyle = '#d8414e'; c.lineWidth = 7; c.beginPath(); c.arc(68, 64, 34, 0, 6.3); c.stroke();
    c.fillStyle = '#d8414e'; c.font = '900 58px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('2', 68, 68);
    c.fillStyle = '#fff'; c.font = '900 92px "Noto Sans TC", "Microsoft JhengHei", sans-serif'; c.fillText('勇', 180, 70);
    var tx = new THREE.CanvasTexture(cv); tx.encoding = THREE.sRGBEncoding;
    var ch = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: chibiTexture(), transparent: true, alphaTest: .05, fog: false })); ch.position.set(0, -.3, 0); g.add(ch);
    var pole = new THREE.Mesh(new THREE.PlaneGeometry(.03, 1.06), new THREE.MeshBasicMaterial({ color: ISL.col('#6b4a2a'), fog: false })); pole.position.set(-.447, .13, -.001); g.add(pole);
    var body = new THREE.Mesh(new THREE.PlaneGeometry(.84, .42).translate(.42, 0, 0), new THREE.MeshBasicMaterial({ map: tx, fog: false })); body.position.set(-.433, .46, .001); g.add(body);
    g.userData.tail = []; g.userData.body = body; g.userData.chibi = ch; return g;
  };
})();
