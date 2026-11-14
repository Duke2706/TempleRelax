(function () {
  var cv = document.getElementById('scene');
  var c = cv.getContext('2d');
  var panel = document.getElementById('panel');
  var input = document.getElementById('thought');
  var burnBtn = document.getElementById('burn');
  var noteEl = document.getElementById('note');
  var countEl = document.getElementById('count');
  var soundBtn = document.getElementById('sound');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W, H, dpr, gy, fx, S, bg, hy, moonX;
  var parts = [], embers = [], thoughts = [];
  var boost = 0, burned = 0;
  var wr = 0, ws = 0, tgtR = 0, tgtS = 0;
  var place = 'forest', bottles = [], floated = 0;
  var rain = [], snow = [], splashes = [], peerStars = [];

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function pine(g, x, base, h, w, color) {
    g.fillStyle = color;
    var tiers = 5;
    for (var i = 0; i < tiers; i++) {
      var t0 = i / tiers, t1 = (i + 1.6) / tiers;
      var yTop = base - h * (1 - t0);
      var yBot = base - h * (1 - Math.min(1, t1)) * 0.98 + h * 0.0;
      var half = w * (0.35 + 0.65 * (i + 1) / tiers) / 2;
      g.beginPath();
      g.moveTo(x, yTop);
      g.lineTo(x + half, base - h * (1 - (i + 1.5) / tiers));
      g.lineTo(x - half, base - h * (1 - (i + 1.5) / tiers));
      g.closePath();
      g.fill();
    }
    g.fillRect(x - w * 0.03, base - h * 0.05, w * 0.06, h * 0.08);
  }

  function buildBeachBg(g) {
    var sky = g.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#04060b'); sky.addColorStop(0.75, '#0e1624'); sky.addColorStop(1, '#1b2433');
    g.fillStyle = sky; g.fillRect(0, 0, W, hy);
    var my = hy * 0.6, mr = Math.max(14, Math.min(W, H) * 0.03);
    var halo = g.createRadialGradient(moonX, my, 0, moonX, my, mr * 6);
    halo.addColorStop(0, 'rgba(210,220,240,0.24)'); halo.addColorStop(1, 'rgba(210,220,240,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(moonX, my, mr * 6, 0, 6.283); g.fill();
    g.fillStyle = '#dfe6f2'; g.beginPath(); g.arc(moonX, my, mr, 0, 6.283); g.fill();
    var sea = g.createLinearGradient(0, hy, 0, gy);
    sea.addColorStop(0, '#101b2a'); sea.addColorStop(1, '#0b1822');
    g.fillStyle = sea; g.fillRect(0, hy, W, gy - hy);
    var hz = g.createLinearGradient(0, hy - 14, 0, hy + 6);
    hz.addColorStop(0, 'rgba(130,160,200,0)'); hz.addColorStop(0.7, 'rgba(130,160,200,0.22)'); hz.addColorStop(1, 'rgba(130,160,200,0)');
    g.fillStyle = hz; g.fillRect(0, hy - 14, W, 20);
    var sand = g.createLinearGradient(0, gy, 0, H);
    sand.addColorStop(0, '#26241f'); sand.addColorStop(1, '#0b0a08');
    g.fillStyle = sand; g.fillRect(0, gy, W, H - gy);
  }
  function buildBackground() {
    bg = document.createElement('canvas');
    bg.width = Math.floor(W * dpr); bg.height = Math.floor(H * dpr);
    var g = bg.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (place === 'beach') { buildBeachBg(g); return; }
    var sky = g.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#04060b');
    sky.addColorStop(0.7, '#0d1420');
    sky.addColorStop(1, '#1a1c24');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);

    // moon
    var mx = W * 0.82, my = Math.min(H * 0.2, 150) + 40, mr = Math.max(14, Math.min(W, H) * 0.03);
    var halo = g.createRadialGradient(mx, my, 0, mx, my, mr * 6);
    halo.addColorStop(0, 'rgba(210,220,240,0.22)'); halo.addColorStop(1, 'rgba(210,220,240,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(mx, my, mr * 6, 0, 6.283); g.fill();
    g.fillStyle = '#dfe6f2'; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill();

    var r = rng(7);
    // far trees
    var x;
    for (x = -20; x < W + 40; x += 26 + r() * 22) pine(g, x, gy * 0.99, H * (0.2 + r() * 0.16), 60 + r() * 30, '#0b111a');
    // mid trees
    for (x = -30; x < W + 40; x += 44 + r() * 40) pine(g, x, gy * 1.0, H * (0.3 + r() * 0.2), 90 + r() * 40, '#070b12');
    // near trees at the edges
    var edge = Math.max(70, W * 0.16);
    for (x = -10; x < edge; x += 60 + r() * 40) pine(g, x, gy + 10, H * (0.55 + r() * 0.25), 150 + r() * 60, '#030508');
    for (x = W + 10; x > W - edge; x -= 60 + r() * 40) pine(g, x, gy + 10, H * (0.55 + r() * 0.25), 150 + r() * 60, '#030508');

    // ground
    var gr = g.createLinearGradient(0, gy, 0, H);
    gr.addColorStop(0, '#0b0d10'); gr.addColorStop(1, '#030405');
    g.fillStyle = gr; g.fillRect(0, gy, W, H - gy);
  }

  var stars = [];
  function buildStars() {
    var r = rng(21); stars = [];
    for (var i = 0; i < 90; i++) stars.push({ x: r() * W, y: r() * gy * 0.62, s: 0.5 + r() * 1.1, p: r() * 6.283, f: 0.6 + r() * 1.6 });
  }

  function initWeather() {
    var nr = Math.max(120, Math.min(280, Math.floor(W / 6))), ns = Math.max(90, Math.min(200, Math.floor(W / 8)));
    rain = []; snow = [];
    for (var i = 0; i < nr; i++) rain.push({ x: Math.random() * (W + 100), y: Math.random() * H, v: 14 + Math.random() * 8, vx: -2.5, land: gy + Math.random() * (H - gy) });
    for (var j = 0; j < ns; j++) snow.push({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 1.1, s: 0.6 + Math.random() * 1.4, p: Math.random() * 6.283, r: 0.9 + Math.random() * 1.7 });
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    gy = H * (W < 600 ? 0.66 : 0.72);
    fx = W / 2;
    S = Math.max(38, Math.min(86, Math.min(W, H) * 0.085));
    hy = H * 0.48; moonX = W * 0.7;
    buildBackground(); buildStars(); initWeather();
  }
  window.addEventListener('resize', resize);
  resize();

  function fireColor(l) {
    var g = Math.round(60 + 175 * Math.pow(l, 1.5));
    var b = l > 0.78 ? Math.round((l - 0.78) * 4.5 * 110) : 8;
    return '255,' + g + ',' + b;
  }

  function spawn(k) {
    var n = (reduce ? 2 : 4) * (1 + boost) * k * (1 - 0.2 * wr);
    for (var i = 0; i < n; i++) {
      if (parts.length > 700) break;
      parts.push({
        x: fx + (Math.random() - 0.5) * S * 0.9, y: gy - S * 0.08,
        vx: (Math.random() - 0.5) * 0.35, vy: -(S * 0.03 + Math.random() * S * 0.03) * (1 + boost * 0.3),
        l: 1, d: 0.012 + Math.random() * 0.014, s: S * (0.26 + Math.random() * 0.28), ph: Math.random() * 6.283
      });
    }
    if (Math.random() < (0.22 + boost * 0.5) * k && embers.length < 120) addEmber(fx + (Math.random() - 0.5) * S * 0.6, gy - S * 0.6);
  }
  function addEmber(x, y) {
    embers.push({ x: x, y: y, vx: (Math.random() - 0.5) * 0.6, vy: -(0.5 + Math.random() * 1.3), l: 1, d: 0.003 + Math.random() * 0.005, s: 0.8 + Math.random() * 1.6, ph: Math.random() * 6.283 });
  }

  // Thoughts: text flies to the fire, then each character burns away.
  function addThought(txt) {
    var chars = Array.from(txt);
    var fs = 24;
    c.font = fs + "px 'Gowun Batang', serif";
    var widths = chars.map(function (ch) { return c.measureText(ch).width; });
    var total = widths.reduce(function (a, b) { return a + b; }, 0);
    var maxW = W * 0.84;
    if (total > maxW) { var k = maxW / total; fs = fs * k; widths = widths.map(function (w) { return w * k; }); total = maxW; }
    var rect = panel.getBoundingClientRect();
    var xs = [], acc = 0;
    widths.forEach(function (w) { xs.push(acc); acc += w; });
    thoughts.push({ chars: chars, xs: xs, widths: widths, total: total, fs: fs, born: performance.now(), sx: W / 2 - total / 2, sy: rect.top - 26, tx: fx - total / 2, ty: gy - S * 1.9, fly: reduce ? 600 : 2200, state: chars.map(function () { return { lit: false, done: false }; }), told: false });
  }

  var notes = ['다 타서 가벼워졌어요.', '재가 되어 밤하늘로 올라가요.', '이제 불만 바라봐요.', '한결 조용해졌어요.', '잘 태웠어요. 천천히 숨 쉬어요.'];
  var noteTimer;
  function say(msg) {
    noteEl.textContent = msg; noteEl.classList.add('show');
    clearTimeout(noteTimer); noteTimer = setTimeout(function () { noteEl.classList.remove('show'); }, 6500);
  }

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function drawThoughts(now) {
    for (var ti = thoughts.length - 1; ti >= 0; ti--) {
      var th = thoughts[ti];
      var age = now - th.born;
      var flying = age < th.fly;
      var p = flying ? ease(age / th.fly) : 1;
      var bx = lerp(th.sx, th.tx, p), by = lerp(th.sy, th.ty, p) + (flying ? Math.sin(age * 0.004) * 6 : 0);
      var burnT = age - th.fly;
      var allDone = true;
      c.font = th.fs + "px 'Gowun Batang', serif";
      c.textBaseline = 'middle';
      for (var i = 0; i < th.chars.length; i++) {
        var st = th.state[i];
        if (st.done) continue;
        allDone = false;
        var x = bx + th.xs[i], y = by;
        var alpha = 1, scale = 1, col;
        if (flying) {
          var warm = Math.max(0, (p - 0.55) / 0.45);
          col = 'rgba(255,' + Math.round(235 - 90 * warm) + ',' + Math.round(210 - 150 * warm) + ',';
        } else {
          var q = (burnT - i * 70) / 1500;
          if (q < 0) {
            col = 'rgba(255,170,90,';
            y += Math.sin(now * 0.02 + i) * 0.8;
          } else {
            if (!st.lit) { st.lit = true; boost = Math.min(1.5, boost + 0.12); }
            if (q >= 1) { st.done = true; continue; }
            y -= q * S * 2.4; x += Math.sin(q * 6 + i) * S * 0.25 * q;
            alpha = 1 - q; scale = 1 - q * 0.45;
            var g = Math.round(150 - 90 * q), b = Math.round(70 - 60 * q);
            col = 'rgba(255,' + g + ',' + b + ',';
            if (Math.random() < 0.15) addEmber(x + th.widths[i] / 2, y);
          }
        }
        c.save();
        c.translate(x + th.widths[i] / 2, y);
        c.scale(scale, scale);
        c.shadowColor = 'rgba(255,140,60,0.8)';
        c.shadowBlur = flying ? 4 : 12;
        c.fillStyle = col + alpha.toFixed(3) + ')';
        c.textAlign = 'center';
        c.fillText(th.chars[i], 0, 0);
        c.restore();
      }
      if (allDone) {
        thoughts.splice(ti, 1);
        burned++;
        countEl.textContent = '태운 생각 ' + burned + '개';
        say(notes[Math.floor(Math.random() * notes.length)]);
      }
    }
  }

  function drawLogs(flick) {
    var glow = 0.35 + 0.35 * flick + boost * 0.2;
    function log(rot, dx) {
      c.save();
      c.translate(fx + dx, gy + S * 0.05);
      c.rotate(rot);
      var w = S * 2.3, h = S * 0.34;
      c.fillStyle = '#25160d';
      c.beginPath();
      if (c.roundRect) c.roundRect(-w / 2, -h / 2, w, h, h / 2); else c.rect(-w / 2, -h / 2, w, h);
      c.fill();
      c.strokeStyle = 'rgba(255,120,40,' + glow.toFixed(2) + ')';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(-w * 0.4, -h * 0.35); c.lineTo(w * 0.4, -h * 0.35); c.stroke();
      c.restore();
    }
    log(0.22, -S * 0.1);
    log(-0.22, S * 0.1);
  }

  function drawWeather(now, k) {
    wr += (tgtR - wr) * 0.03 * k; ws += (tgtS - ws) * 0.03 * k;
    c.globalCompositeOperation = 'source-over';
    var i, d;
    if (wr > 0.01) {
      c.fillStyle = 'rgba(5,8,14,' + (0.5 * wr).toFixed(3) + ')'; c.fillRect(0, 0, W, gy);
      var nR = Math.floor(rain.length * wr);
      c.strokeStyle = 'rgba(170,190,225,' + (0.4 * wr).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath();
      for (i = 0; i < nR; i++) {
        d = rain[i]; d.y += d.v * k; d.x += d.vx * k;
        if (d.y > d.land) {
          if (splashes.length < 40 && Math.random() < 0.5) splashes.push({ x: d.x, y: d.land, l: 1 });
          d.y = -20; d.x = Math.random() * (W + 100); d.land = gy + Math.random() * (H - gy);
        }
        c.moveTo(d.x, d.y); c.lineTo(d.x - d.vx * 1.6, d.y - d.v * 1.6);
      }
      c.stroke();
    }
    for (i = splashes.length - 1; i >= 0; i--) {
      var sp = splashes[i]; sp.l -= 0.06 * k;
      if (sp.l <= 0) { splashes.splice(i, 1); continue; }
      c.strokeStyle = 'rgba(170,190,225,' + (sp.l * 0.35 * Math.max(wr, 0.2)).toFixed(3) + ')'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(sp.x, sp.y, 2 + (1 - sp.l) * 8, 1 + (1 - sp.l) * 3, 0, 0, 6.283); c.stroke();
    }
    if (ws > 0.01) {
      c.fillStyle = 'rgba(120,140,170,' + (0.07 * ws).toFixed(3) + ')'; c.fillRect(0, 0, W, gy);
      c.fillStyle = 'rgba(205,220,240,' + (0.1 * ws).toFixed(3) + ')'; c.fillRect(0, gy, W, H - gy);
      var nS = Math.floor(snow.length * ws);
      for (i = 0; i < nS; i++) {
        d = snow[i];
        d.y += d.v * k; d.x += Math.sin(now * 0.001 * d.s + d.p) * 0.35 * k;
        if (d.y > H + 4) { d.y = -4; d.x = Math.random() * W; }
        var dist = Math.hypot(d.x - fx, d.y - (gy - S)), warm = place === 'forest' ? Math.max(0, 1 - dist / (S * 7)) : 0;
        c.fillStyle = 'rgba(255,' + Math.round(242 - 80 * warm) + ',' + Math.round(255 - 150 * warm) + ',' + (0.85 * ws).toFixed(3) + ')';
        c.beginPath(); c.arc(d.x, d.y, d.r, 0, 6.283); c.fill();
      }
    }
  }

  function addPeerStar(t) {
    var txt = typeof t === 'string' ? t.replace(/\s+/g, ' ').trim().slice(0, 40) : '';
    var top = Math.max(150, H * 0.2), bot = Math.max(top + 40, gy * 0.58);
    var tw = 0;
    if (txt) { c.font = "14px 'Gowun Batang', serif"; tw = c.measureText(txt).width; }
    var x = W * (0.1 + Math.random() * 0.8);
    if (tw) x = Math.max(tw / 2 + 12, Math.min(W - tw / 2 - 12, x));
    peerStars.push({ x: x, y: top + Math.random() * (bot - top), born: performance.now(), life: 10000, txt: txt, ph: Math.random() * 6.283 });
    if (peerStars.length > 30) peerStars.shift();
  }
  function drawPeerStars(now) {
    for (var i = peerStars.length - 1; i >= 0; i--) {
      var st = peerStars[i], age = now - st.born;
      if (age > st.life) { peerStars.splice(i, 1); continue; }
      var a = Math.min(1, age / 1500) * Math.min(1, (st.life - age) / 3000) * (0.75 + 0.25 * Math.sin(now * 0.004 + st.ph));
      c.globalCompositeOperation = 'lighter';
      var g = c.createRadialGradient(st.x, st.y, 0, st.x, st.y, 16);
      g.addColorStop(0, 'rgba(255,240,205,' + (0.9 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = g; c.beginPath(); c.arc(st.x, st.y, 16, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(255,245,225,' + (0.7 * a).toFixed(3) + ')'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(st.x - 7, st.y); c.lineTo(st.x + 7, st.y); c.moveTo(st.x, st.y - 7); c.lineTo(st.x, st.y + 7); c.stroke();
      c.globalCompositeOperation = 'source-over';
      if (st.txt) {
        c.font = "14px 'Gowun Batang', serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(241,230,211,' + (0.8 * a).toFixed(3) + ')';
        c.fillText(st.txt, st.x, st.y + 24);
      }
    }
  }

  function drawSea(now) {
    var i, y, t, x;
    c.globalCompositeOperation = 'lighter';
    for (y = hy + 3; y < gy - 4; y += 4) {
      t = (y - hy) / (gy - hy);
      var wd = 6 + t * 80, jit = Math.sin(now * 0.0018 + y * 0.35) * wd * 0.4;
      var a = 0.28 * (1 - t * 0.35) * (0.55 + 0.45 * Math.sin(now * 0.003 + y * 0.9));
      c.fillStyle = 'rgba(215,225,245,' + Math.max(0, a).toFixed(3) + ')';
      c.fillRect(moonX + jit - wd * 0.5, y, wd, 1.6);
    }
    c.globalCompositeOperation = 'source-over';
    c.lineWidth = 1;
    for (i = 1; i <= 9; i++) {
      t = i / 9; y = hy + (gy - hy) * Math.pow(t, 1.7);
      c.strokeStyle = 'rgba(150,185,215,' + (0.05 + 0.07 * t).toFixed(3) + ')';
      c.beginPath();
      var amp = 0.6 + 2.4 * t, ph = now * 0.0006 * (0.6 + t) + i * 1.7;
      for (x = 0; x <= W; x += 16) {
        var yy = y + Math.sin(x * 0.012 * (1.3 - t * 0.4) + ph) * amp;
        if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }
    var cyc = now * 0.00055, edge = gy + 8 + 14 * Math.sin(cyc);
    function ey(px) { return edge + Math.sin(px * 0.014 + now * 0.0011) * 3 + Math.sin(px * 0.037 - now * 0.0017) * 1.5; }
    c.fillStyle = '#0b1822';
    c.beginPath(); c.moveTo(0, gy - 30);
    for (x = 0; x <= W; x += 12) c.lineTo(x, ey(x));
    c.lineTo(W, gy - 30); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(230,240,250,' + (0.2 + 0.16 * Math.max(0, Math.cos(cyc))).toFixed(3) + ')'; c.lineWidth = 2;
    c.beginPath();
    for (x = 0; x <= W; x += 12) { if (x === 0) c.moveTo(x, ey(x)); else c.lineTo(x, ey(x)); }
    c.stroke();
  }

  function drawBottle(x, y, sc, rot, a) {
    c.save();
    c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.globalAlpha = Math.max(0, Math.min(1, a));
    c.fillStyle = 'rgba(170,215,230,0.32)'; c.strokeStyle = 'rgba(215,240,250,0.85)'; c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-4, -26); c.lineTo(4, -26); c.lineTo(4, -12);
    c.quadraticCurveTo(12, -10, 12, 0); c.lineTo(12, 18);
    c.quadraticCurveTo(12, 25, 5, 25); c.lineTo(-5, 25);
    c.quadraticCurveTo(-12, 25, -12, 18); c.lineTo(-12, 0);
    c.quadraticCurveTo(-12, -10, -4, -12); c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#a67c52'; c.fillRect(-4.5, -31, 9, 6);
    c.fillStyle = 'rgba(245,232,205,0.95)'; c.fillRect(-3.5, -7, 7, 24);
    c.strokeStyle = 'rgba(120,95,60,0.5)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(-2, -2); c.lineTo(2, -2); c.moveTo(-2, 3); c.lineTo(2, 3); c.moveTo(-2, 8); c.lineTo(2, 8); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-8.5, 2); c.lineTo(-8.5, 16); c.stroke();
    c.restore();
  }

  function addBottle(txt) {
    var fs = 22;
    c.font = fs + "px 'Gowun Batang', serif";
    var total = c.measureText(txt).width, maxW = W * 0.84;
    if (total > maxW) { fs = fs * maxW / total; total = maxW; }
    var rect = panel.getBoundingClientRect();
    bottles.push({ txt: txt, fs: fs, total: total, born: performance.now(), sx: W / 2, sy: rect.top - 26, tx: W / 2 + (Math.random() - 0.5) * W * 0.16, ty: gy + 2, fly: reduce ? 700 : 2000, dur: reduce ? 6000 : 18000, dir: Math.random() < 0.5 ? -1 : 1 });
  }
  var beachNotes = ['병이 파도를 타고 멀어져요.', '수평선 너머로 흘러갔어요.', '바다가 가져갔어요.', '한결 조용해졌어요.', '잘 보냈어요. 천천히 숨 쉬어요.'];
  function drawBottles(now) {
    for (var i = bottles.length - 1; i >= 0; i--) {
      var b = bottles[i], age = now - b.born;
      if (age < b.fly) {
        var p = ease(age / b.fly);
        var x = lerp(b.sx, b.tx, p), y = lerp(b.sy, b.ty - 34, p);
        var ta = p < 0.65 ? 1 : Math.max(0, 1 - (p - 0.65) / 0.3);
        if (ta > 0) {
          c.save(); c.translate(x, y); c.scale(lerp(1, 0.55, p), lerp(1, 0.55, p));
          c.font = b.fs + "px 'Gowun Batang', serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.shadowColor = 'rgba(200,225,245,0.6)'; c.shadowBlur = 6;
          c.fillStyle = 'rgba(241,230,211,' + ta.toFixed(3) + ')';
          c.fillText(b.txt, 0, 0); c.restore();
        }
        if (p > 0.6) drawBottle(b.tx, b.ty + Math.sin(age * 0.003) * 2, 1.5, Math.sin(age * 0.002) * 0.1, (p - 0.6) / 0.4);
      } else {
        var tf = (age - b.fly) / b.dur;
        if (tf >= 1) {
          bottles.splice(i, 1); floated++;
          if (place === 'beach') countEl.textContent = '띄운 생각 ' + floated + '개';
          say(beachNotes[Math.floor(Math.random() * beachNotes.length)]);
          continue;
        }
        var e = Math.pow(tf, 0.85);
        var bx = b.tx + b.dir * e * W * 0.08 + Math.sin(tf * 10) * W * 0.012;
        var by = lerp(b.ty, hy + 8, e), sc = lerp(1.5, 0.16, e);
        drawBottle(bx, by + Math.sin(age * 0.003) * 3 * sc, sc, Math.sin(age * 0.0022 + 1) * 0.28, tf < 0.8 ? 1 : (1 - tf) / 0.2);
      }
    }
  }

  function setPlace(pl) {
    place = pl;
    thoughts = []; bottles = []; parts = []; embers = [];
    Array.prototype.forEach.call(document.querySelectorAll('.pl button'), function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-place') === pl ? 'true' : 'false'); });
    buildBackground(); initWeather();
    var beach = pl === 'beach';
    document.querySelector('.hint').innerHTML = beach
      ? '마음에 걸린 생각을 한 줄 적어 유리병에 담아 보내세요.<br>파도 소리를 들으며 멀어지는 병을 바라봐요.'
      : '마음에 걸린 생각을 한 줄 적어 불에 던져 보세요.<br>타닥타닥 타는 동안 잠깐 멍하니 있어도 좋아요.';
    burnBtn.textContent = beach ? '띄우기' : '태우기';
    document.getElementById('keep').textContent = beach ? '쓴 글은 어디에도 저장되지 않고, 병이 멀리 떠나면 사라져요.' : '쓴 글은 어디에도 저장되지 않고, 다 타면 사라져요.';
    countEl.textContent = beach ? '띄운 생각 ' + floated + '개' : '태운 생각 ' + burned + '개';
    noteEl.classList.remove('show');
    applySound();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.pl button'), function (b) {
    b.addEventListener('click', function () { var pl = b.getAttribute('data-place'); if (pl !== place) setPlace(pl); });
  });

  // Weather buttons
  var wxNotes = { rain: '비가 와도 불은 꺼지지 않아요.', snow: '눈 내리는 밤이에요. 불빛이 더 따뜻해 보여요.' };
  Array.prototype.forEach.call(document.querySelectorAll('.wx button'), function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-mode');
      tgtR = m === 'rain' ? 1 : 0; tgtS = m === 'snow' ? 1 : 0;
      Array.prototype.forEach.call(document.querySelectorAll('.wx button'), function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      if (wxNotes[m]) say(wxNotes[m]);
      applySound();
    });
  });

  // Shared stars: only people who have the page open right now, nothing is stored.
  var myId = Math.random().toString(36).slice(2), room = null, shareEl = document.getElementById('share');
  try {
    if (window.claude && window.claude.use) {
      window.claude.use('room').then(function (r) {
        if (!r) return;
        room = r;
        try {
          room.on('burn', function (m) {
            var d = m && typeof m === 'object' && m.data && typeof m.data === 'object' ? m.data : m;
            if (!d || d.id === myId) return;
            addPeerStar(d.t);
          });
        } catch (e) {}
      }).catch(function () {});
    }
  } catch (e) {}

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(48, now - last); last = now;
    var k = dt / 16.67;
    var flick = 0.85 + 0.12 * Math.sin(now * 0.013) + 0.06 * Math.sin(now * 0.031 + 1.3);
    boost *= Math.pow(0.992, k);

    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(bg, 0, 0, W, H);

    // stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      c.fillStyle = 'rgba(235,240,255,' + ((0.25 + 0.45 * (0.5 + 0.5 * Math.sin(now * 0.001 * s.f + s.p))) * (1 - 0.9 * wr)).toFixed(3) + ')';
      c.fillRect(s.x, s.y, s.s, s.s);
    }

    if (place === 'beach') drawSea(now);
    drawWeather(now, k);

    if (place === 'forest') {
    // light cast by the fire
    c.globalCompositeOperation = 'lighter';
    var la = (0.16 + boost * 0.08) * flick;
    var amb = c.createRadialGradient(fx, gy - S, 0, fx, gy - S, S * 10);
    amb.addColorStop(0, 'rgba(255,130,50,' + la.toFixed(3) + ')');
    amb.addColorStop(1, 'rgba(255,130,50,0)');
    c.fillStyle = amb; c.fillRect(0, 0, W, H);
    c.save();
    c.translate(fx, gy + S * 0.3); c.scale(1, 0.3);
    var gg = c.createRadialGradient(0, 0, 0, 0, 0, S * 7);
    gg.addColorStop(0, 'rgba(255,140,60,' + (0.4 * flick).toFixed(3) + ')');
    gg.addColorStop(1, 'rgba(255,140,60,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(0, 0, S * 7, 0, 6.283); c.fill();
    c.restore();

    c.globalCompositeOperation = 'source-over';
    drawLogs(flick);

    // flame
    spawn(k);
    c.globalCompositeOperation = 'lighter';
    for (var j = parts.length - 1; j >= 0; j--) {
      var p = parts[j];
      p.l -= p.d * k;
      if (p.l <= 0) { parts.splice(j, 1); continue; }
      p.x += (p.vx + Math.sin(now * 0.004 + p.ph) * 0.25) * k + (fx - p.x) * 0.018 * k;
      p.y += p.vy * k;
      p.s *= Math.pow(0.976, k);
      var col = fireColor(p.l);
      var a = Math.min(1, p.l * 1.3) * 0.5;
      var gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s);
      gr.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + col + ',0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 6.283); c.fill();
    }

    // embers
    for (var e = embers.length - 1; e >= 0; e--) {
      var m = embers[e];
      m.l -= m.d * k;
      if (m.l <= 0 || m.y < -10) { embers.splice(e, 1); continue; }
      m.x += (m.vx + Math.sin(now * 0.003 + m.ph) * 0.5) * k;
      m.y += m.vy * k;
      var ea = m.l * (0.6 + 0.4 * Math.sin(now * 0.02 + m.ph));
      c.fillStyle = 'rgba(255,' + Math.round(110 + 90 * m.l) + ',50,' + Math.max(0, ea).toFixed(3) + ')';
      c.beginPath(); c.arc(m.x, m.y, m.s, 0, 6.283); c.fill();
    }

    }
    c.globalCompositeOperation = 'source-over';
    drawPeerStars(now);
    drawThoughts(now);
    drawBottles(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Input
  function submit() {
    var v = input.value.replace(/\s+/g, ' ').trim();
    if (!v) { input.focus(); return; }
    if (place === 'beach') addBottle(v); else addThought(v);
    try {
      if (room) { var pr = room.emit('burn', { id: myId, t: shareEl && shareEl.checked ? v : '' }); if (pr && pr.catch) pr.catch(function () {}); }
    } catch (e) {}
    input.value = '';
    input.focus();
  }
  burnBtn.addEventListener('click', submit);
  input.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !ev.isComposing && ev.keyCode !== 229) { ev.preventDefault(); submit(); }
  });

  // Sound (Web Audio): looping recordings mixed per place and weather, faded smoothly. Layers decode only when needed.
  var soundOn = false, actx = null, layers = {};
  var AUDIO_DIR = 'assets/audio/';
  var SRC = { fire: AUDIO_DIR + 'fire.mp3', crack: AUDIO_DIR + 'crack.mp3', rain: AUDIO_DIR + 'rain.mp3', wave: AUDIO_DIR + 'wave.mp3' };
  function loadBuf(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Audio ' + url + ' failed: ' + r.status);
      return r.arrayBuffer();
    });
  }
  function makeLayer(name) {
    var L = { gain: null, ready: false };
    layers[name] = L;
    loadBuf(SRC[name]).then(function (data) {
      return new Promise(function (res, rej) { actx.decodeAudioData(data, res, rej); });
    }).then(function (buf) {
      L.gain = actx.createGain(); L.gain.gain.value = 0; L.gain.connect(actx.destination);
      var src = actx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(L.gain);
      src.start(0, Math.random() * buf.duration * 0.5);
      L.ready = true; applySound();
    }).catch(function (err) {
      // Forget the failed layer so the next applySound() can retry it.
      delete layers[name];
      if (window.console) console.warn(err);
    });
  }
  function want(name) {
    if (!soundOn) return 0;
    if (name === 'fire') return place === 'forest' ? 0.75 : 0;
    if (name === 'crack') return place === 'forest' ? 0.5 : 0;
    if (name === 'wave') return place === 'beach' ? (tgtR > 0.5 ? 0.4 : 0.5) : 0;
    if (name === 'rain') return tgtR > 0.5 ? 0.6 : 0;
    return 0;
  }
  function applySound() {
    if (!actx) return;
    ['fire', 'crack', 'rain', 'wave'].forEach(function (n) {
      var w = want(n);
      if (w > 0 && !layers[n]) makeLayer(n);
      var L = layers[n];
      if (L && L.ready) L.gain.gain.setTargetAtTime(w, actx.currentTime, 0.7);
    });
  }
  soundBtn.addEventListener('click', function () {
    try {
      if (!soundOn) {
        soundOn = true;
        if (!actx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          try { actx = new AC({ sampleRate: 32000 }); } catch (e1) { actx = new AC(); }
        } else actx.resume();
        applySound();
      } else {
        soundOn = false; applySound();
        setTimeout(function () { if (!soundOn && actx) actx.suspend(); }, 1800);
      }
    } catch (err) { soundOn = false; }
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundBtn.textContent = soundOn ? '소리 끄기' : '소리 켜기';
  });
})();
