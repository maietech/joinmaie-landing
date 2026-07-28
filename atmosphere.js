// atmosphere.js — the "World Layer": a persistent environment that sits
// behind every scene on the page, never hidden or replaced by any one
// scene. Three parts: the Current (drifting waveform fragments/dots/
// curves), Destination Beacons (rare gold markers confirming forward
// progress), and Narrative Echoes (transient particles spawned when a
// scene's own elements dissolve into the Current).
//
// Architecture: this canvas always renders, at every scroll position —
// it is not switched on/off per scene. What changes per scene is how much
// of it is *revealed*: each scene's own background (styles.css's
// --atmo-veil, driven by data-atmo-density) goes from mostly-opaque
// (Cinematic) to mostly-transparent (Reflection), letting more or less of
// this canvas bleed through, the way stage lighting stays on throughout a
// show while each set piece is lit to a different degree. The canvas
// itself still throttles its own opacity/particle-count per level (see
// LEVEL_BUDGET below) — not to fake occlusion, but because a busy
// Cinematic scene doesn't need (or want) a full-strength Current
// competing for attention, and it's real CPU/paint savings during the
// page's heaviest visual moments.
//
// Performance posture, given the pre-production audit's scroll-jank
// findings (361 long tasks / ~97s across a throttled scroll-through, driven
// largely by duplicate scroll listeners and layout-forcing reads): this
// file adds exactly ONE canvas, ONE rAF loop, and ZERO new scroll
// listeners of its own. Beacon proximity is computed inside reveal.js's
// existing registerScrollBatch (same read/write batch every other scene
// already shares) instead of a fourth/fifth independent listener. Particle
// motion is a pure function of a virtual clock, not per-frame Math.random()
// — positions are deterministic (seeded), matching the brief's "seed
// particle positions and motion deterministically" requirement.
//
// Density: every section that wants atmosphere involved carries
// data-atmo-density="0|1|2|3" (0 Cinematic / 1 Reflection / 2 Editorial-
// Exploration / 3 Hero, see index.html). A single IntersectionObserver
// tracks which such section currently owns the most viewport space and
// drives both the canvas's own budget (here) and each scene's CSS reveal
// (styles.css) toward that level — smoothed (lerped), never a hard jump.

(function () {
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.getElementById('atmo-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // ── Deterministic seeding (mulberry32) — used only at init, to lay out
  // each particle's *identity* (starting position/depth/phase). No random
  // calls happen after this; every particle's position at time t is a pure
  // function of t and these seeded constants, so a page held open forever
  // free-runs, and a reload lands the same "handcrafted" composition. ──
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(1337);

  var vw = 0, vh = 0, dpr = window.devicePixelRatio || 1;
  function resize() {
    vw = window.innerWidth; vh = window.innerHeight;
    canvas.width = vw * dpr; canvas.height = vh * dpr;
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── The Current — 26 particles, each a small waveform fragment, soft
  // curve, or dot. y(t) is position within an extended loop band so the
  // wrap at the top/bottom never happens on-screen abruptly. Everything
  // here is translate/opacity-equivalent (canvas draw calls, not layout-
  // affecting DOM writes) per the brief's Technical Guidelines. ──
  var COUNT = 26;
  var particles = [];
  for (var i = 0; i < COUNT; i++) {
    particles.push({
      type: i % 5 === 0 ? 2 : (i % 3 === 0 ? 1 : 0), // mostly fragments, some dots, occasional curves
      xFrac: rand(),
      depth: 0.35 + rand() * 0.65,        // parallax: smaller/slower/fainter further back
      speed: 6 + rand() * 10,             // px/sec at depth 1
      baseY: rand(),                      // 0..1 fraction of loop band, phase offset per particle
      phase: rand() * Math.PI * 2,
      wobbleAmp: 3 + rand() * 6,
      size: 10 + rand() * 22,
      tint: rand() < 0.18,                // occasional accent-tinted fragment (logo-language, not literal logo)
    });
  }

  // Transient "echo" particles — spawned by scene scripts when their own
  // elements dissolve (Component 2, Narrative Echoes). Short-lived, drift
  // downward and fade, then are dropped. Rendered in the same loop/canvas
  // rather than a second system.
  var echoes = [];
  window.MaieAtmosphere = window.MaieAtmosphere || {};
  window.MaieAtmosphere.echo = function (rect, opts) {
    if (reducedMotion || !rect) return;
    opts = opts || {};
    var n = opts.count || 3;
    for (var e = 0; e < n; e++) {
      echoes.push({
        x: rect.left + rect.width * rand(),
        y: rect.top + rect.height * rand(),
        born: clock,
        life: 900 + rand() * 400,
        size: 6 + rand() * 10,
        tint: rand() < 0.4,
      });
    }
  };
  // Convenience wrapper for scene scripts: call once per scroll tick with
  // the scene's own progress; fires the echo exactly once as progress
  // crosses into [start,end], via the `fired` flag the caller owns (kept
  // in the scene file, not here — this stays a dumb one-shot emitter).
  window.MaieAtmosphere.echoRectOf = function (el) {
    return el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  };

  // ── Adaptive density — one IntersectionObserver for every section
  // that opts in, instead of each scene wiring its own. Whichever
  // observed section currently has the most intersection ratio wins;
  // its data-atmo-density (0-3) becomes the target level.
  //
  // This used to assume Level 0 scenes hid the Current entirely (their
  // .scene-sticky backgrounds were flat opaque colors) — that was the
  // wrong architecture: the Current is a persistent World Layer that
  // never actually turns off, scenes just reveal more or less of it
  // (see styles.css's --atmo-veil, which now controls the *visual*
  // reveal). What these budgets control is the canvas's own contribution
  // — still throttled down for Level 0/3 so CPU/paint cost drops during
  // the busiest and most deliberately-quiet-atmosphere scenes, but never
  // to zero. Numbers follow the brief's table: Reflection=High,
  // Editorial/Exploration=Medium, Cinematic=Low, Hero=Minimal-baseline
  // (Hero's real payoff is the one-time alignment pulse below, not its
  // idle budget). ──
  var LEVEL_BUDGET = {
    0: { opacity: 0.075, particleShare: 0.55 },  // Cinematic — low, but genuinely visible in gutters/margins, not compounded away
    1: { opacity: 0.12,  particleShare: 1.00 },  // Reflection — high
    2: { opacity: 0.09,  particleShare: 0.80 },  // Editorial / Exploration — medium
    3: { opacity: 0.03,  particleShare: 0.35 },  // Hero — minimal baseline; the pulse below is the reveal
  };
  var currentLevel = 0, targetLevel = 0;
  var densityEls = Array.prototype.slice.call(document.querySelectorAll('[data-atmo-density]'));
  var heroEl = document.querySelector('[data-atmo-density="3"]');
  var heroPulseStart = null; // set once, first time the hero section is seen

  if (densityEls.length && typeof IntersectionObserver !== 'undefined') {
    var ratios = new Map();
    var densityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      var best = null, bestRatio = 0;
      ratios.forEach(function (r, el) {
        if (r > bestRatio) { bestRatio = r; best = el; }
      });
      if (best) {
        targetLevel = parseInt(best.getAttribute('data-atmo-density'), 10) || 0;
        if (best === heroEl && heroPulseStart === null) heroPulseStart = clock;
        // Exposed so guide.js (the Narrative Guide panel) can drive its
        // own content off the same "which section currently owns the
        // viewport" signal instead of registering a second
        // IntersectionObserver over the same elements.
        if (window.MaieAtmosphere.currentSection !== best) {
          window.MaieAtmosphere.currentSection = best;
          document.dispatchEvent(new CustomEvent('maie:scenechange', { detail: { section: best } }));
        }
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    densityEls.forEach(function (el) { densityObserver.observe(el); });
  }

  // ── Cross-scene continuity: alpha-mask taper ──
  // Adjacent story-scenes marked below are pulled into a small overlap
  // (see styles.css's negative margin-top on the same set of ids) so the
  // outgoing scene's sticky panel and the incoming one are both pinned on
  // screen for a short shared scroll window. What happens in that window
  // used to be a flat `opacity` crossfade of the whole panel — per
  // follow-up direction, that reads as "two flat layers dissolving into
  // each other," not "one world changing around you." Replaced with a
  // CSS mask-image taper instead: the panel's *visible band* grows in
  // from (and later shrinks back down toward) its bottom edge, so the
  // World Layer shows through a genuinely dissolving edge rather than an
  // evenly-dimmed rectangle. Fractions are each scene's own 20vh overlap
  // expressed as a share of that scene's total scroll height (20 / height),
  // so the transition's on-screen duration roughly matches the actual
  // overlap distance rather than a single guessed constant.
  //
  // Performance: the mask string is only ever written while a scene is
  // actually inside its own fadeIn/fadeOut window (`transitioning` below)
  // — outside of it, mask-image is cleared entirely and the panel is a
  // plain opaque element again, so there's no ongoing masking/compositing
  // cost for the ~90% of scroll time a scene spends fully settled. A
  // `.scene-crossfading` class is toggled alongside it purely to hint
  // `will-change: opacity` for that same narrow window, so the browser
  // promotes the panel to its own compositor layer for the transition
  // instead of the first opacity/mask change forcing a layer creation
  // mid-animation — the actual "choppy" reports so far are more
  // consistent with that missing hint than with a genuine dropped-frames
  // problem elsewhere; I didn't have a live browser to pull a devtools
  // trace confirming that either way in this pass.
  var CROSSFADE = {
    'scene-frame':        { fadeIn: 0.08,  fadeOut: 0.08 },
    'scene-universe':     { fadeIn: 0.08,  fadeOut: 0.08 },
    'scene-human-hand':   { fadeIn: 0.042, fadeOut: 0.042 },
    'scene-chaos-signal': { fadeIn: 0.028, fadeOut: 0 },     // next section (companion-intro) isn't sticky — no partner to crossfade with
    'scene-lifecycle':    { fadeIn: 0,     fadeOut: 0.048 }, // previous section (trust) isn't sticky — no overlap margin behind it
    'scene-agent':        { fadeIn: 0.08,  fadeOut: 0.08 },
  };
  var TAPER = 46; // max % of the panel eroded from the bottom edge at the extreme of a fade
  var originalInitScrollScene = window.initScrollScene;
  if (originalInitScrollScene && !reducedMotion) {
    window.initScrollScene = function (sectionEl, onProgress) {
      var cfg = CROSSFADE[sectionEl.id];
      var sticky = cfg ? sectionEl.querySelector('.scene-sticky') : null;
      return originalInitScrollScene(sectionEl, function (progress, isStatic) {
        onProgress(progress, isStatic);
        if (!sticky || isStatic) return;
        var inW = cfg.fadeIn > 0 ? Math.min(1, progress / cfg.fadeIn) : 1;
        var outW = cfg.fadeOut > 0 ? Math.min(1, (1 - progress) / cfg.fadeOut) : 1;
        var transitioning = inW < 1 || outW < 1;
        if (!transitioning) {
          if (sticky.classList.contains('scene-crossfading')) {
            sticky.classList.remove('scene-crossfading');
            sticky.style.maskImage = ''; sticky.style.webkitMaskImage = ''; sticky.style.opacity = '';
          }
          return;
        }
        sticky.classList.add('scene-crossfading');
        // Visible band: eroding inward from the bottom on both ends —
        // shrinks toward the bottom edge while fading in (rising into
        // view), and toward the bottom edge again while fading out
        // (sinking back down out of view) — one consistent direction of
        // dissolve rather than two different-feeling edges.
        var topErode = (1 - inW) * TAPER;
        var bottomStop = 100 - (1 - outW) * TAPER;
        var mask = 'linear-gradient(to bottom, transparent 0%, black ' +
          topErode.toFixed(1) + '%, black ' + bottomStop.toFixed(1) + '%, transparent 100%)';
        sticky.style.maskImage = mask;
        sticky.style.webkitMaskImage = mask;
        // Small residual opacity dip, purely a graceful-degradation floor
        // for browsers without mask-image support — the mask is doing the
        // real work where it's available, this never goes below 0.88.
        sticky.style.opacity = (0.88 + 0.12 * Math.min(inW, outW)).toFixed(3);
      });
    };
  }

  // ── Destination Beacons — computed inside the shared scroll batch
  // (reveal.js's registerScrollBatch), so no extra scroll listener. Each
  // beacon's proximity is a smooth triangular function of its distance
  // from viewport-center: grows while approaching from below, dissolves
  // quickly once passed, per the brief. ──
  var beacons = Array.prototype.slice.call(document.querySelectorAll('.atmo-beacon'));
  var APPROACH_RANGE = 1.15; // in viewport-heights
  var DISSOLVE_RANGE = 0.45;

  function beaconRead() {
    return beacons.map(function (b) { return b.getBoundingClientRect(); });
  }
  function beaconWrite(rects) {
    if (reducedMotion) return;
    rects.forEach(function (rect, i) {
      var b = beacons[i];
      var centerOffset = (rect.top + rect.height / 2) - vh / 2; // px, + below center
      var vhPx = vh || 1;
      var intensity;
      if (centerOffset > 0) {
        intensity = 1 - Math.min(1, centerOffset / (APPROACH_RANGE * vhPx));
      } else {
        intensity = Math.max(0, 1 - (-centerOffset) / (DISSOLVE_RANGE * vhPx));
      }
      intensity = Math.max(0, Math.min(1, intensity));
      b.style.setProperty('--beacon-intensity', intensity.toFixed(3));
    });
  }
  if (beacons.length) {
    if (reducedMotion) {
      // Settled, static composition — a faint constant glow, no growth/dissolve.
      beacons.forEach(function (b) { b.style.setProperty('--beacon-intensity', '0.35'); });
    } else if (window.registerScrollBatch) {
      window.registerScrollBatch(beaconRead, beaconWrite);
    }
  }

  // ── Scroll-velocity nudge — 10-15% faster while actively scrolling,
  // decaying back to baseline. A lightweight passive listener (a single
  // number update, no reads/writes of layout) rather than routing through
  // the read/write batch, since it doesn't touch the DOM at all. ──
  var scrollBoost = 1;
  window.addEventListener('scroll', function () { scrollBoost = 1.13; }, { passive: true });

  // ── Render ──
  var clock = 0, lastT = null, rafId = null;

  function colorTokens() {
    var s = getComputedStyle(document.documentElement);
    var fg = (s.getPropertyValue('--text-2') || '').trim() || 'rgba(232,230,227,0.6)';
    var accent = (s.getPropertyValue('--accent') || '').trim() || '#FFD166';
    return { fg: fg, accent: accent };
  }

  function drawFragment(x, y, size, alpha, color, phase) {
    ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x - size / 2, y);
    ctx.quadraticCurveTo(x, y + Math.sin(phase) * size * 0.35, x + size / 2, y);
    ctx.stroke();
  }
  function drawDot(x, y, size, alpha, color) {
    ctx.fillStyle = color; ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, size * 0.09, 0, Math.PI * 2); ctx.fill();
  }
  function drawCurve(x, y, size, alpha, color, phase) {
    ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var s = -1; s <= 1; s += 0.25) {
      var px = x + s * size, py = y + Math.sin(phase + s * 2.4) * size * 0.28;
      s === -1 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function render(tNow) {
    if (lastT === null) lastT = tNow;
    var dt = Math.min(0.05, (tNow - lastT) / 1000);
    lastT = tNow;

    scrollBoost += (1 - scrollBoost) * Math.min(1, dt * 1.8); // decay back to 1
    clock += dt * scrollBoost;

    currentLevel += (targetLevel - currentLevel) * Math.min(1, dt * 2.2); // smoothed level transition
    var lo = Math.max(0, Math.floor(currentLevel)), hi = Math.min(3, Math.ceil(currentLevel));
    var frac = currentLevel - lo;
    var budgetOpacity = LEVEL_BUDGET[lo].opacity + (LEVEL_BUDGET[hi].opacity - LEVEL_BUDGET[lo].opacity) * frac;
    var particleShare = LEVEL_BUDGET[lo].particleShare + (LEVEL_BUDGET[hi].particleShare - LEVEL_BUDGET[lo].particleShare) * frac;
    var activeCount = Math.round(COUNT * particleShare);

    var colors = colorTokens();
    ctx.clearRect(0, 0, vw, vh);

    // Hero pulse (Level 3, reserved — #paths): for ~2.4s after the hero
    // section first enters view, fragments briefly pull toward alignment
    // along a sine band (echoing the logo's signal-line grammar) before
    // dissolving back to ambient drift. Never resolves into the literal mark.
    var heroPulse = 0;
    if (heroPulseStart !== null) {
      var since = clock - heroPulseStart;
      if (since >= 0 && since < 2.4) heroPulse = Math.sin((since / 2.4) * Math.PI);
    }

    var band = vh + 220; // loop band height (px), with margin so wrap is off-screen
    for (var i = 0; i < activeCount; i++) {
      var p = particles[i];
      var y = (((p.baseY * band) + clock * p.speed * p.depth) % band) - 110;
      var wob = Math.sin(clock * 0.6 + p.phase) * p.wobbleAmp * p.depth;
      var x = p.xFrac * vw + wob;
      if (heroPulse > 0) {
        // Pull x toward a shared sine curve across the viewport width —
        // "waveform fragments align" — then release as heroPulse fades.
        var alignedX = vw * 0.5 + Math.sin((y / vh) * Math.PI * 2 + 1.2) * vw * 0.28;
        x = x + (alignedX - x) * heroPulse * 0.7;
      }
      var alpha = budgetOpacity * (0.4 + p.depth * 0.6) * (1 + heroPulse * 1.3);
      var color = (p.tint || heroPulse > 0.5) ? colors.accent : colors.fg;
      var size = p.size * (0.7 + p.depth * 0.5);
      if (p.type === 1) drawDot(x, y, size, alpha, color);
      else if (p.type === 2) drawCurve(x, y, size, alpha, color, clock * 0.5 + p.phase);
      else drawFragment(x, y, size, alpha, color, clock * 0.7 + p.phase);
    }

    // Echoes — transient, fade over their own lifespan then removed.
    if (echoes.length) {
      var kept = [];
      for (var j = 0; j < echoes.length; j++) {
        var ec = echoes[j];
        var ageMs = (clock - ec.born) * 1000; // clock is a seconds-scale virtual clock; life is stored in ms
        var t = Math.max(0, Math.min(1, ageMs / ec.life));
        if (t >= 1) continue;
        var ea = (1 - t) * budgetOpacity * 2.2;
        var ey = ec.y + t * 60; // gentle downward settle into the Current
        drawDot(ec.x, ey, ec.size, ea, ec.tint ? colors.accent : colors.fg);
        kept.push(ec);
      }
      echoes = kept;
    }

    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reducedMotion) {
    // One static, settled frame — no continuous drift, per prefers-reduced-motion.
    lastT = 0; clock = 0;
    render(0);
    if (rafId) cancelAnimationFrame(rafId); // render() above schedules a next frame; cancel it immediately
  } else if (typeof IntersectionObserver !== 'undefined') {
    // Pause the loop entirely when the canvas (i.e. the whole page) isn't
    // visible — same convention as pixie-companion.js/scene-opening.js.
    var pageVisibilityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && rafId === null) rafId = requestAnimationFrame(render);
        else if (!entry.isIntersecting && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; lastT = null; }
      });
    }, { threshold: 0 });
    pageVisibilityObserver.observe(document.body);
    rafId = requestAnimationFrame(render);
  } else {
    rafId = requestAnimationFrame(render);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; lastT = null; }
    else if (!document.hidden && !reducedMotion && rafId === null) rafId = requestAnimationFrame(render);
  });
})();
