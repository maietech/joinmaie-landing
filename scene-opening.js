// scene-opening.js — Section 1: "Before the Media"
// A single point of light morphs, across real scroll distance, through:
// pulse -> pixel line -> frame matrix -> waveform -> timeline -> data
// fields. Driven by story-scroll.js's progress (0..1); no scroll-jacking,
// no WebGL — plain canvas 2D, consistent with the rest of the site.

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

  var t = 0; // idle animation clock (pulse breathing, data-field blink), independent of scroll

  function draw(progress, isStatic) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var cx = W / 2, cy = H / 2;
    var brand = getComputedStyle(document.documentElement).getPropertyValue('--brand-light').trim() || '#C24E4E';
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFD166';

    // Stage weights — six overlapping windows across the scroll range.
    var wPulse   = window.storyStageWeight(progress, 0.00, 0.14);
    var wLine    = window.storyStageWeight(progress, 0.14, 0.30);
    var wFrames  = window.storyStageWeight(progress, 0.30, 0.48);
    var wWave    = window.storyStageWeight(progress, 0.48, 0.66);
    var wTime    = window.storyStageWeight(progress, 0.66, 0.82);
    var wData    = window.storyStageWeight(progress, 0.82, 1.00, 0.04, 0);

    ctx.save();

    // 1. Pulse — a breathing point of light.
    if (wPulse > 0.002) {
      var breathe = isStatic ? 1 : 1 + Math.sin(t * 1.6) * 0.25;
      var r = 3.5 * breathe;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * breathe);
      g.addColorStop(0, 'rgba(255,255,255,' + wPulse + ')');
      g.addColorStop(0.3, 'rgba(' + hexRgb(brand) + ',' + (wPulse * 0.6) + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 40 * breathe, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + wPulse + ')';
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

  function hexRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  var lastProgress = 0, isReduced = false;
  window.initScrollScene(section, function (progress, staticFrame) {
    lastProgress = progress; isReduced = staticFrame;
    draw(progress, staticFrame);
    if (caption) {
      var capOpacity = window.storyStageWeight(progress, 0.0, 0.10, 0.02, 0.06);
      caption.style.opacity = capOpacity;
    }
    if (nav) nav.classList.toggle('nav-hidden', progress < 0.5 && !staticFrame);
  });

  // Idle animation loop (pulse breathing, data blink) — only while this
  // scene is roughly in view, and never under reduced motion.
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    (function loop() {
      t += 0.02;
      draw(lastProgress, false);
      requestAnimationFrame(loop);
    })();
  }
})();
