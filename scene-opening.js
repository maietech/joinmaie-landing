// scene-opening.js — Section 1: "Before the Media"
// A single point of light morphs, across real scroll distance, through:
// ignition spark -> pulse -> pixel line -> frame matrix -> waveform ->
// timeline -> data fields. Driven by story-scroll.js's progress (0..1);
// no scroll-jacking, no WebGL — plain canvas 2D, consistent with the
// rest of the site.
//
// THEME-AWARE (dropped force-dark, see DESIGN-DEV-GUIDE.md §6/§9):
// background and the pulse/spark colors are all read from CSS custom
// properties, not hardcoded hex — a literal white point of light would
// be invisible against the light-mode paper background, which is why
// this needed more than swapping one fill color. The "ignition spark"
// intro (plays once, on first view) exists specifically so the opening
// beat still has a strong "pop" in light mode instead of a flat fade-in.
//
// NARRATIVE (see DESIGN-DEV-GUIDE.md §12 / maie-narrative-audit.md follow-up):
// the caption is no longer a single static line — it's a six-beat
// narration synced 1:1 to the six visual stages below (pulse/line/
// frames/wave/time/data), via the same STAGES windows both read from.
// The visual stays abstract throughout (never becomes literal "office
// chaos" imagery — that's Section 5's job); the copy is what carries the
// emotional arc from wonder to a plainly-stated, personal recognition by
// the time the visitor reaches the end of the scene.

(function () {
  var section = document.getElementById('scene-opening');
  if (!section) return;
  var canvas  = document.getElementById('scene-opening-canvas');
  var caption = document.getElementById('scene-opening-caption');
  var nav     = document.querySelector('.nav');
  var ctx = canvas.getContext('2d');

  var dpr = window.devicePixelRatio || 1;
  var W, H;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Deterministic pseudo-random (stable across frames/resizes) — a real
  // Math.random() per frame would make the waveform/data-fields jitter
  // every repaint instead of holding a shape.
  function prand(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

  function themeColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function hexRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  var t = 0; // idle animation clock (pulse breathing, data-field blink), independent of scroll

  // ── Ignition spark — one-shot intro, plays once on first view ──────
  // Skipped entirely under reduced motion (resolves straight to the
  // settled pulse, per the accessibility pattern used everywhere else
  // on this site).
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ignitionDone = reducedMotion;
  var ignitionStartTime = null;
  var IGNITION_MS = 950;

  function drawIgnition(p) {
    var cx = W / 2, cy = H / 2;
    var brand = themeColor('--brand-light', '#C24E4E');
    var accent = themeColor('--accent', '#FFD166');
    var bg = themeColor('--bg', '#09090B');

    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Stage A (0 -> 0.28): a full-width line flashes and dissipates.
    var flashW = window.storyStageWeight(p, 0.0, 0.06, 0.0, 0.22);
    if (flashW > 0.002) {
      ctx.strokeStyle = 'rgba(' + hexRgb(accent) + ',' + flashW + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    }

    // Stage B (0.15 -> 0.55): the spark itself — expanding ring + shards.
    var burstW = window.storyStageWeight(p, 0.18, 0.32, 0.10, 0.20);
    if (burstW > 0.002) {
      var ringR = 4 + p * 70;
      ctx.strokeStyle = 'rgba(' + hexRgb(brand) + ',' + (burstW * 0.8) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();

      var shardLen = (1 - p) * 26 + 6;
      ctx.strokeStyle = 'rgba(' + hexRgb(accent) + ',' + burstW + ')';
      ctx.lineWidth = 1.4;
      for (var s = 0; s < 6; s++) {
        var ang = (s / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 10, cy + Math.sin(ang) * 10);
        ctx.lineTo(cx + Math.cos(ang) * (10 + shardLen), cy + Math.sin(ang) * (10 + shardLen));
        ctx.stroke();
      }
    }

    // Stage C (0.45 -> 1.0): crossfades into the steady settled glow —
    // the same visual as the ongoing breathing pulse below, so the
    // handoff to draw() is seamless once ignitionDone flips.
    var settleW = window.storyStageWeight(p, 0.55, 1.0, 0.25, 0);
    if (settleW > 0.002) {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
      g.addColorStop(0, 'rgba(' + hexRgb(accent) + ',' + settleW + ')');
      g.addColorStop(0.3, 'rgba(' + hexRgb(brand) + ',' + (settleW * 0.6) + ')');
      g.addColorStop(1, 'rgba(' + hexRgb(brand) + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(' + hexRgb(accent) + ',' + settleW + ')';
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  function runIgnition(ts) {
    if (ignitionStartTime === null) ignitionStartTime = ts;
    var p = Math.min(1, (ts - ignitionStartTime) / IGNITION_MS);
    drawIgnition(p);
    if (p < 1) {
      requestAnimationFrame(runIgnition);
    } else {
      ignitionDone = true;
    }
  }

  // Six narrative beats, one per visual stage, sharing the exact same
  // progress windows the canvas rendering uses below — so the caption
  // crossfades in lockstep with whichever visual stage is dominant,
  // never out of sync with it. See maie-narrative-audit.md's opening
  // follow-up for the reasoning behind this specific line-by-line arc:
  // "Everything begins with something" is preserved verbatim (the
  // audit's own pick for the page's strongest deliberately-vague line);
  // beats 2-6 progressively concretize the feeling without ever naming
  // MAIE or the product — that's Section 5/6's job, not this scene's.
  var STAGES = [
    { key: 'pulse',  start: 0.00, end: 0.14, fadeIn: 0.04, fadeOut: 0.04, text: 'Everything begins with something.' },
    { key: 'line',   start: 0.14, end: 0.30, fadeIn: 0.04, fadeOut: 0.04, text: 'It becomes something real.' },
    { key: 'frames', start: 0.30, end: 0.48, fadeIn: 0.04, fadeOut: 0.04, text: 'Then it becomes another.' },
    { key: 'wave',   start: 0.48, end: 0.66, fadeIn: 0.04, fadeOut: 0.04, text: 'And another.' },
    { key: 'time',   start: 0.66, end: 0.82, fadeIn: 0.04, fadeOut: 0.04, text: 'Until the work is surrounded by everything that isn’t the work.' },
    { key: 'data',   start: 0.82, end: 1.00, fadeIn: 0.04, fadeOut: 0,    text: 'You just wanted to make something.' },
  ];

  function computeWeights(progress) {
    var w = {};
    STAGES.forEach(function (s) {
      w[s.key] = window.storyStageWeight(progress, s.start, s.end, s.fadeIn, s.fadeOut);
    });
    return w;
  }

  // Caption follows whichever stage currently has the highest weight —
  // textContent only changes when the dominant stage changes (not every
  // frame), opacity tracks that stage's own weight continuously, so the
  // fade timing matches the visual stage's fade exactly.
  var activeCaptionKey = null;
  function updateCaption(w) {
    if (!caption) return;
    var top = STAGES[0], topW = 0;
    STAGES.forEach(function (s) {
      if (w[s.key] > topW) { topW = w[s.key]; top = s; }
    });
    if (top.key !== activeCaptionKey) {
      activeCaptionKey = top.key;
      caption.textContent = top.text;
    }
    caption.style.opacity = topW;
  }

  function draw(progress, isStatic, w) {
    if (!ignitionDone) return; // the ignition loop owns rendering until it settles
    ctx.clearRect(0, 0, W, H);
    var bg = themeColor('--bg', '#09090B');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2;
    var brand = themeColor('--brand-light', '#C24E4E');
    var accent = themeColor('--accent', '#FFD166');

    // Stage weights — six overlapping windows across the scroll range,
    // shared with updateCaption() via the STAGES array above so the text
    // and the visual are always driven by the exact same timing.
    var wPulse   = w.pulse;
    var wLine    = w.line;
    var wFrames  = w.frames;
    var wWave    = w.wave;
    var wTime    = w.time;
    var wData    = w.data;

    ctx.save();

    // 1. Pulse — a breathing point of light. Accent-hot core / brand
    // glow, not literal white — stays visible against either theme's bg.
    if (wPulse > 0.002) {
      var breathe = isStatic ? 1 : 1 + Math.sin(t * 1.6) * 0.25;
      var r = 3.5 * breathe;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * breathe);
      g.addColorStop(0, 'rgba(' + hexRgb(accent) + ',' + wPulse + ')');
      g.addColorStop(0.3, 'rgba(' + hexRgb(brand) + ',' + (wPulse * 0.6) + ')');
      g.addColorStop(1, 'rgba(' + hexRgb(brand) + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 40 * breathe, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(' + hexRgb(accent) + ',' + wPulse + ')';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }

    // 2. Pixel line — point stretches horizontally.
    if (wLine > 0.002) {
      var lineW = Math.min(W * 0.6, 500);
      ctx.strokeStyle = 'rgba(' + hexRgb(brand) + ',' + wLine + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - lineW / 2, cy); ctx.lineTo(cx + lineW / 2, cy); ctx.stroke();
    }

    // 3. Frame matrix — the line divides into a grid of film-frame rects.
    if (wFrames > 0.002) {
      var cols = 6, rows = 3, gap = 10;
      var fw = Math.min(W * 0.5, 380), fh = fw * (rows / cols) * 0.55;
      var cw = (fw - gap * (cols - 1)) / cols, ch = (fh - gap * (rows - 1)) / rows;
      var ox = cx - fw / 2, oy = cy - fh / 2;
      ctx.strokeStyle = 'rgba(' + hexRgb(brand) + ',' + (wFrames * 0.8) + ')';
      ctx.lineWidth = 1.2;
      for (var ry = 0; ry < rows; ry++) {
        for (var rx = 0; rx < cols; rx++) {
          var x = ox + rx * (cw + gap), y = oy + ry * (ch + gap);
          ctx.strokeRect(x, y, cw, ch);
        }
      }
    }

    // 4. Waveform — audio bars, stable pseudo-random heights.
    if (wWave > 0.002) {
      var bars = 48, bw = Math.min(W * 0.55, 420), bx0 = cx - bw / 2, barW = bw / bars;
      ctx.fillStyle = 'rgba(' + hexRgb(brand) + ',' + wWave + ')';
      for (var i = 0; i < bars; i++) {
        var bh = (0.15 + prand(i) * 0.85) * 90;
        ctx.fillRect(bx0 + i * barW, cy - bh / 2, barW * 0.6, bh);
      }
    }

    // 5. Timeline — waveform flattens, tick marks appear.
    if (wTime > 0.002) {
      var tlW = Math.min(W * 0.55, 420);
      ctx.strokeStyle = 'rgba(' + hexRgb(brand) + ',' + wTime + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - tlW / 2, cy); ctx.lineTo(cx + tlW / 2, cy); ctx.stroke();
      for (var k = 0; k <= 10; k++) {
        var tx = cx - tlW / 2 + (tlW / 10) * k;
        ctx.beginPath(); ctx.moveTo(tx, cy - 6); ctx.lineTo(tx, cy + 6); ctx.stroke();
      }
    }

    // 6. Data fields — structured metadata rows.
    if (wData > 0.002) {
      var rowsData = ['id  0x' + 'A52A2A', 'ts  00:04:12.083', 'conf 0.94', 'src  frame_0182'];
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      var blink = isStatic ? 1 : (Math.sin(t * 3) * 0.15 + 0.85);
      for (var d = 0; d < rowsData.length; d++) {
        ctx.fillStyle = 'rgba(' + hexRgb(accent) + ',' + (wData * (d === 0 ? blink : 0.7)) + ')';
        ctx.fillText(rowsData[d], cx - 90, cy - 30 + d * 20);
      }
    }

    ctx.restore();
  }

  var lastProgress = 0, isReduced = false;
  window.initScrollScene(section, function (progress, staticFrame) {
    lastProgress = progress; isReduced = staticFrame;
    var w = computeWeights(progress);
    draw(progress, staticFrame, w);
    updateCaption(w);
    if (nav) nav.classList.toggle('nav-hidden', progress < 0.5 && !staticFrame);
  });

  if (reducedMotion) {
    // Straight to the settled state, no ignition, no idle loop — same
    // convention as every other scene under prefers-reduced-motion.
    // storyStageWeight resolves progress=1 to the final ('data') stage at
    // full weight, so the caption correctly shows the scene's last beat
    // rather than nothing (the single-caption version only ever faded in
    // during the very first stage window, which progress=1 falls outside
    // of — reduced-motion visitors previously saw no caption at all here).
    var settledW = computeWeights(lastProgress);
    draw(lastProgress, true, settledW);
    updateCaption(settledW);
  } else {
    requestAnimationFrame(runIgnition);
    (function loop() {
      t += 0.02;
      draw(lastProgress, false, computeWeights(lastProgress));
      requestAnimationFrame(loop);
    })();
  }
})();
