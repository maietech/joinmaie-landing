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

  // ── The Flow Field — the one shared current every moving system in this
  // file (and, via window.MaieAtmosphere.flow, pixie-companion.js and
  // maie-logo-motion.js) samples for its own ambient drift, instead of each
  // rolling an independent sine/random term. Two domain-warped octaves —
  // cheap (a handful of sin/cos per sample, no per-frame allocation), fully
  // deterministic (phase seeds drawn from the same mulberry32 stream as
  // every particle above), and spatially coherent (nearby points return
  // similar vectors, which is what makes it read as "current" rather than
  // "wobble"). Each consumer passes its own seed offset into the (x, y, t)
  // triple so results stay decorrelated across systems without ever
  // touching a shared clock phase directly — same field, unsynced look, per
  // the brief's "influenced by the same physics without becoming
  // synchronized in an obvious way."
  var FLOW_SEED_A = rand() * 1000, FLOW_SEED_B = rand() * 1000;
  function flow(x, y, t) {
    var nx = x * 0.0018, ny = y * 0.0022;
    var warpX = Math.sin(ny * 1.7 + t * 0.06 + FLOW_SEED_A) * 1.3;
    var warpY = Math.cos(nx * 1.5 + t * 0.05 + FLOW_SEED_B) * 1.3;
    // Slowly-rotating bias: the field's overall "prevailing wind" direction
    // itself drifts (a near-static vector that takes many minutes to
    // complete one rotation) — deliberately not periodic at any timescale
    // a visitor would sit through, so the exact same configuration never
    // visibly recurs, per "remove loops / avoid obvious repetition."
    var driftBias = t * 0.0004;
    return {
      vx: Math.sin(nx + warpX + t * 0.08) + Math.sin(ny * 0.6 - t * 0.05 + FLOW_SEED_B) * 0.6 + Math.cos(driftBias) * 0.15,
      vy: Math.cos(ny + warpY - t * 0.07) + Math.cos(nx * 0.5 + t * 0.04 + FLOW_SEED_A) * 0.6 + Math.sin(driftBias) * 0.15,
    };
  }
  window.MaieAtmosphere = window.MaieAtmosphere || {};
  window.MaieAtmosphere.flow = flow;

  // ── Coherence — a second, independently-seeded, higher-frequency field
  // (flowChaos) that currentFlow() blends in when coherence is low. This
  // is what lets the atmosphere react to NARRATIVE rather than only
  // scroll: low coherence reads as competing/fragmented sub-currents (a
  // "Chaos" beat), high coherence suppresses it back to flow()'s single
  // clean direction (a "Signal"/resolution beat) — "the visitor
  // experiences the story in the physics," without the visitor ever being
  // told that's what's happening.
  //
  // Deliberately scoped to THIS file's own layers only (field cells,
  // ribbons, foam — see currentFlow() call sites below). pixie-companion.js
  // and maie-logo-motion.js intentionally keep sampling flow() directly,
  // unblended — coherence is the atmosphere's own narrative instrument,
  // not something that should make the pixie's personality flicker with it.
  //
  // Defaults are keyed off the existing data-atmo-density levels (reused
  // rather than adding a second parallel section-tagging system, since
  // those levels already roughly track narrative beats) and exposed
  // publicly via setCoherence() so a scene script COULD drive it directly
  // from its own progress later — not wired to any scene in this pass.
  var CHAOS_SEED_A = rand() * 1000, CHAOS_SEED_B = rand() * 1000;
  function flowChaos(x, y, t) {
    var nx = x * 0.005, ny = y * 0.006;
    return {
      vx: Math.sin(nx * 2.3 + t * 0.22 + CHAOS_SEED_A) + Math.cos(ny * 1.8 - t * 0.17 + CHAOS_SEED_B) * 0.8,
      vy: Math.cos(ny * 2.1 - t * 0.19 + CHAOS_SEED_B) + Math.sin(nx * 1.6 + t * 0.15 + CHAOS_SEED_A) * 0.8,
    };
  }
  var COHERENCE_BY_LEVEL = { 0: 0.45, 1: 0.85, 2: 0.65, 3: 0.55 }; // Cinematic, Reflection, Editorial, Hero
  var coherence = 0.7, coherenceOverride = null, coherenceOverrideUntil = 0;
  window.MaieAtmosphere.setCoherence = function (value, holdMs) {
    coherenceOverride = Math.max(0, Math.min(1, value));
    coherenceOverrideUntil = Date.now() + (holdMs || 4000);
  };
  function currentFlow(x, y, t) {
    var base = flow(x, y, t);
    if (coherence >= 0.999) return base;
    var chaos = flowChaos(x, y, t);
    var mix = 1 - coherence;
    return { vx: base.vx + chaos.vx * mix * 0.7, vy: base.vy + chaos.vy * mix * 0.7 };
  }

  // ── Breathing — an almost-imperceptible ~70s-period pulse applied as one
  // shared multiplier across every layer's opacity together below (not each
  // layer independently, which would read as separate flicker rather than
  // one slow "compression / expansion / relaxation"). BREATHE_SEED gives it
  // a page-load-independent phase without being non-deterministic.
  var BREATHE_SEED = rand() * Math.PI * 2;

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
  // affecting DOM writes) per the brief's Technical Guidelines.
  //
  // type 0 (the majority) doubles as the "evolving signal fragments" layer
  // from the Atmospheric Evolution brief — it gets its own budget (signal,
  // see LEVEL_BUDGET below) distinct from the dot/curve types' particulate
  // budget, without needing a second particle array. ──
  // ── Foam — what were "the Current"'s primary particles are now
  // secondary: fewer (18, was 26) and their visibility (see render(), the
  // speedMag term) now ties to the LOCAL SPEED of the density field
  // beneath them, not just their own depth/pulse state — "particles merely
  // reveal the invisible motion" rather than being the star themselves.
  // type 0 still doubles as the "evolving signal fragments" layer. ──
  var COUNT = 18;
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

  // ── Ribbons — translucent flowing strokes, each traced backward
  // from a moving head through several samples of the SAME flow field
  // driving the particles above, so what reads as "isolated dots drifting"
  // gains a "continuous current carrying them downstream" companion layer.
  // Deliberately few (5) and faint — a background medium, not a second
  // particle system competing for attention. ──
  var RIBBON_COUNT = 5;
  var ribbons = [];
  for (var ri = 0; ri < RIBBON_COUNT; ri++) {
    ribbons.push({
      xFrac: rand(),
      depth: 0.4 + rand() * 0.5,
      speed: 4 + rand() * 6,
      baseY: rand(),
      length: 140 + rand() * 90,
      phase: rand() * Math.PI * 2,
      tint: rand() < 0.3,
    });
  }

  // ── The density field — the atmosphere's primary visible layer, per the
  // "Living Morphological Ocean" revision: previously the star was the
  // particle field (haze sat behind it as backdrop). Now a small number of
  // large, soft cells are true FLUID PARTICLES — advected through
  // currentFlow() (position integrated by velocity over time, not
  // resampled fresh each frame) and drawn additively ('lighter' composite,
  // see drawFieldCell) so overlapping cells visually brighten and merge
  // where they cross — the classic cheap Canvas-2D approximation of
  // metaball blending. This is what actually produces "structures stretch,
  // merge, dissolve, reform" — genuine SDF/isocontour blending would need
  // a shader; this gets emotionally close without one. Deliberately few
  // (6) and large: a slow-moving medium, not a second particle system.
  var FIELD_COUNT = 6;
  var fieldCells = [];
  for (var fc = 0; fc < FIELD_COUNT; fc++) {
    fieldCells.push({
      x: rand(), y: rand(),               // fraction-space position, advected in stepField()
      r: 0.30 + rand() * 0.28,             // radius as a fraction of min(vw, vh)
      speed: 0.4 + rand() * 0.5,
      tint: rand() < 0.35,
      seed: rand() * 1000,
      pulse: 0,                            // brief radius boost on echo absorption — see the echoes loop below
    });
  }
  // Advances fieldCells through the field by true integration, called once
  // per render() frame before drawing. Position is never reset — this is
  // the file's one piece of genuine "memory": nothing about a cell's
  // location is recomputed from scratch each frame, it accumulates, so a
  // structure that formed a minute ago is still the same structure now,
  // just carried further along.
  //
  // Two samples are blended: currentFlow() at the cell's own position/rate
  // (the fast, local signal — same one ribbons/foam read) PLUS a much
  // slower, much larger-scale sample of the base field (slowF — sampled at
  // 0.3x spatial scale and 0.05x clock rate) layered underneath at low
  // weight. That second term is what gives "pressure zones drifting over
  // minutes" — a bias so slow it's not perceptible as motion on its own,
  // only as the field's structures very gradually migrating over a long
  // visit, distinct from the faster motion carrying them moment-to-moment.
  function stepField(dt) {
    for (var i = 0; i < fieldCells.length; i++) {
      var c = fieldCells[i];
      var f = currentFlow(c.x * vw, c.y * vh, clock + c.seed);
      var slowF = flow(c.x * vw * 0.3, c.y * vh * 0.3, clock * 0.05 + c.seed * 3);
      c.x += ((f.vx + slowF.vx * 0.5) * c.speed * dt * 40) / vw;
      c.y += ((f.vy + slowF.vy * 0.5) * c.speed * dt * 40) / vh;
      c.pulse = Math.max(0, c.pulse - dt * 0.4);
      // Wrap only once the cell is FULLY off-screen — padding is now
      // per-cell and radius-aware (was a flat 0.15, while c.r ranges
      // 0.30-0.58 of min(vw,vh)), which was the actual bug: cells were
      // teleporting to the opposite edge while still clearly on-screen —
      // "halfway outside the viewport." Worse, flow()/currentFlow() aren't
      // spatially periodic, so the velocity sample on the far side of a
      // wrap is essentially unrelated to what the cell was just
      // experiencing — a sudden, uncorrelated direction change right as
      // it reappeared, which is what read as rapid shift/oscillation.
      // Worst in corners because that's where the x-wrap and y-wrap
      // conditions were both triggering close together. Padding by the
      // cell's own on-screen radius (x1.3 for a safety margin covering
      // drawFieldCell's anisotropic scroll-stretch) guarantees the wrap —
      // and the velocity discontinuity that comes with it — only ever
      // happens while the shape has zero visible alpha.
      var padX = (c.r * Math.min(vw, vh) * 1.3) / vw + 0.05;
      var padY = (c.r * Math.min(vw, vh) * 1.3) / vh + 0.05;
      if (c.x < -padX) c.x += 1 + padX * 2;
      if (c.x > 1 + padX) c.x -= 1 + padX * 2;
      if (c.y < -padY) c.y += 1 + padY * 2;
      if (c.y > 1 + padY) c.y -= 1 + padY * 2;
    }
  }

  // Background orbs (styles.css's .bg-orb-1/2/3) breathe off this same
  // field — see render()'s orb-breathe block below — so the large anchored
  // background shapes feel like part of the same current without moving in
  // lockstep with the canvas particles (their existing scroll-linked
  // parallax is untouched; this only modulates opacity/scale slightly).
  var orbEls = Array.prototype.slice.call(document.querySelectorAll('.bg-orb'));
  var orbSeeds = orbEls.map(function () { return rand() * 100; });
  var orbLastWrite = -1; // seconds, see throttle note at the write site below

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
  // Level budgets, per data-atmo-density (0-3), one fraction per depth
  // layer instead of one shared {opacity, particleShare} pair — lets a
  // dense-narrative (Cinematic) scene mute ribbons/signal hard while
  // keeping haze almost untouched ("depth without competing for
  // attention"), rather than one dial that shows or hides everything
  // together. Fractions are relative to each layer's own Reflection-level
  // (1.0) reference; absolute opacities are derived from these in render()
  // below. Numbers are a starting point per the Atmospheric Evolution
  // strategy doc, §6 — expect a visual tuning pass once this is live.
  var LEVEL_BUDGET = {
    0: { field: 0.6, ribbon: 0.25, particulate: 0.55, signal: 0.4 },  // Cinematic
    1: { field: 1.0, ribbon: 1.0,  particulate: 1.0,  signal: 1.0 },  // Reflection — full atmosphere
    2: { field: 0.8, ribbon: 0.6,  particulate: 0.8,  signal: 0.6 },  // Editorial / Exploration
    3: { field: 0.3, ribbon: 0.15, particulate: 0.35, signal: 0.2 },  // Hero — minimal baseline; the pulse below is the reveal
  };
  var currentLevel = 0, targetLevel = 0;
  var densityEls = Array.prototype.slice.call(document.querySelectorAll('[data-atmo-density]'));
  var heroEl = document.querySelector('[data-atmo-density="3"]');
  var heroPulseStart = null; // set once, first time the hero section is seen

  // Phase II, Area 5, Direction A: a second, independent pulse — the World
  // Layer acknowledging Section 1's one-shot ignition, the same way it
  // already acknowledges the #paths arrival via heroPulse below. Kept as
  // its own start-time/trigger rather than reusing heroPulseStart's
  // scroll-position-driven trigger, since ignition is a TIME event on
  // load, not a scroll event — scene-opening.js dispatches this once, right
  // as its spark begins. openingPulse (computed in render()) intentionally
  // does NOT shift particle color toward --accent the way heroPulse does —
  // that color shift is reserved as the unique visual signature of the
  // #paths arrival, the story's actual resolution; reusing it here too
  // would blunt what makes that later moment read as distinct.
  var openingPulseStart = null;
  document.addEventListener('maie:ignition', function () {
    if (openingPulseStart === null) openingPulseStart = clock;
  });

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

  // Mirrors styles.css's [data-atmo-density] → --atmo-veil rules (:632-635).
  // Needed as a JS-side table (not read via getComputedStyle) because the
  // crossfade below needs to *blend* two scenes' veil amounts across the
  // transition window, not just read one settled value. Keep in sync with
  // styles.css if those numbers change. This is deliberately a narrower,
  // local mechanism than the canvas's own currentLevel/LEVEL_BUDGET lerp
  // above — that drives the World Layer canvas's particle budget from
  // whichever section is nearest per the IntersectionObserver; this drives
  // a completely different, CSS-only property (a .scene-sticky panel's own
  // background opacity) and only during the narrow window a panel is
  // already known to be transitioning, so folding the two together would
  // add coupling between unrelated systems for no measured benefit.
  var VEIL_BY_DENSITY = { 0: 55, 1: 40, 2: 60, 3: 88 };
  function veilOf(el) {
    var d = el && el.getAttribute && el.getAttribute('data-atmo-density');
    return d != null && VEIL_BY_DENSITY[d] != null ? VEIL_BY_DENSITY[d] : null;
  }
  // Walks past non-scene siblings (e.g. the zero-height .atmo-beacon marker
  // divs index.html drops between sections) to find the nearest actual
  // [data-atmo-density] section in the given direction — a direct
  // previousElementSibling/nextElementSibling read would land on the
  // beacon instead, which has no density and would silently disable the
  // blend (confirmed live before shipping this: scene-chaos-signal's
  // previousElementSibling is the beacon before it, not scene-human-hand).
  function neighborVeil(el, dir) {
    var cur = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    while (cur) {
      if (cur.hasAttribute && cur.hasAttribute('data-atmo-density')) return veilOf(cur);
      cur = dir < 0 ? cur.previousElementSibling : cur.nextElementSibling;
    }
    return null;
  }

  var originalInitScrollScene = window.initScrollScene;
  if (originalInitScrollScene && !reducedMotion) {
    window.initScrollScene = function (sectionEl, onProgress) {
      var cfg = CROSSFADE[sectionEl.id];
      var sticky = cfg ? sectionEl.querySelector('.scene-sticky') : null;
      // Resolved once at registration, not per tick: the neighbor a scene
      // crossfades with never changes while the page is open.
      var ownVeil = sticky ? veilOf(sectionEl) : null;
      var prevVeil = (sticky && cfg.fadeIn > 0) ? neighborVeil(sectionEl, -1) : null;
      var nextVeil = (sticky && cfg.fadeOut > 0) ? neighborVeil(sectionEl, 1) : null;
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
            sticky.style.removeProperty('--atmo-veil');
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
        // Blend --atmo-veil toward the neighbor scene's own veil across the
        // same window the mask erodes across, so the panel's *reveal
        // amount* glides between the two scenes instead of snapping the
        // instant the mask finishes uncovering it. Most adjacent pairs
        // differ by only 0-5 percentage points (imperceptible either way);
        // scene-human-hand (40%) → scene-chaos-signal (55%) is the one
        // real outlier (15pp) this fixes.
        if (ownVeil != null) {
          var veil = ownVeil;
          if (inW < 1 && prevVeil != null) veil = prevVeil + (ownVeil - prevVeil) * inW;
          else if (outW < 1 && nextVeil != null) veil = ownVeil + (nextVeil - ownVeil) * (1 - outW);
          sticky.style.setProperty('--atmo-veil', veil.toFixed(1) + '%');
        }
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

  // Narrative Polish Phase 2 item 5: #paths' .paths-signal graphic used to
  // be pure CSS @keyframes with zero scroll connection. Rather than a
  // second scroll listener, the specific beacon placed right before #paths
  // (index.html's #paths-arrival-beacon) already has exactly the proximity
  // signal this needs computed every tick — mirrored onto #paths itself
  // (not just the beacon element) as --paths-signal-progress, since
  // .paths-signal is a sibling of the beacon, not a descendant, so it
  // wouldn't inherit the beacon's own custom property otherwise.
  var pathsArrivalBeacon = document.getElementById('paths-arrival-beacon');
  var pathsSection = document.getElementById('paths');

  function beaconRead() {
    return beacons.map(function (b) { return b.getBoundingClientRect(); });
  }
  // Last-written intensity per beacon — see the write-skip below. Unlike
  // the scene-sticky crossfades, this runs through registerScrollBatch, so
  // it fires on every scroll tick anywhere on the whole ~25000px page, not
  // just within one scene's own range — each beacon's intensity is clamped
  // to exactly 0 outside a roughly 1.6-viewport-height band around its own
  // fixed document position (APPROACH_RANGE + DISSOLVE_RANGE), so for the
  // large majority of total scroll distance every beacon was rewriting the
  // same "0.000" every tick regardless of where the visitor actually is.
  var lastIntensity = beacons.map(function () { return -1; });
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
      if (Math.abs(intensity - lastIntensity[i]) <= 0.001) return;
      lastIntensity[i] = intensity;
      b.style.setProperty('--beacon-intensity', intensity.toFixed(3));
      if (b === pathsArrivalBeacon && pathsSection) {
        pathsSection.style.setProperty('--paths-signal-progress', intensity.toFixed(3));
      }
    });
  }
  if (beacons.length) {
    if (reducedMotion) {
      // Settled, static composition — a faint constant glow, no growth/dissolve.
      beacons.forEach(function (b) { b.style.setProperty('--beacon-intensity', '0.35'); });
      if (pathsSection) pathsSection.style.setProperty('--paths-signal-progress', '0.35');
    } else if (window.registerScrollBatch) {
      window.registerScrollBatch(beaconRead, beaconWrite);
    }
  }

  // ── Scroll-velocity nudge — 10-15% faster while actively scrolling,
  // decaying back to baseline. A lightweight passive listener (a single
  // number update, no reads/writes of layout) rather than routing through
  // the read/write batch, since it doesn't touch the DOM at all.
  //
  // Ribbons reuse this exact same signal for their own elongation (see
  // ribbonStretch in render()) rather than tracking scroll velocity a
  // second way — same reasoning as pixie-companion.js's wakeStretch:
  // reuse one already-tuned decay curve instead of inventing a second
  // one, per the brief's "unify existing motion systems." ──
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
  // Previously called unconditionally inside render() every single frame —
  // a real, always-on getComputedStyle cost for the entire time the tab is
  // open, since this canvas (unlike every scene-scoped one) is never paused
  // per-section. Cached once here, refreshed only on the theme toggle's own
  // maie:themechange event — same idea scene-chaos-signal.js's textRgb
  // cache already uses elsewhere in this codebase, via document.addEventListener,
  // matching guide.js/scene-agent.js/index.html's inline script — the
  // convention that actually receives theme.js's document.dispatchEvent(...)
  // (no bubbles:true, so a window-level listener would miss it; every
  // listener in the codebase, including scene-chaos-signal.js's own, now
  // correctly uses document.addEventListener).
  var cachedColors = colorTokens();
  document.addEventListener('maie:themechange', function () {
    cachedColors = colorTokens();
  });

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

  // Ribbon: traced backward from a moving head through several samples of
  // currentFlow() — the coherence-blended field, so ribbons visibly
  // fragment/compete during low-coherence (Chaos-beat) sections and
  // straighten into clean laminar traces as coherence rises, not an
  // independent per-ribbon formula. `stretch` is ribbonStretch from
  // render() (the scroll-velocity nudge), applied to the ribbon's own
  // length so faster scrolling visibly elongates it before it settles
  // back to baseline.
  //
  // Drawn as a 2-pass "streakline bundle" (a slightly offset, thinner,
  // fainter second trace) rather than a single line — a cheap way to read
  // as a flow-visualization streakline rather than a drawn stroke, without
  // doubling the ribbon count (and its seeded state) in the array above.
  var RIBBON_SEGS = 8;
  function drawRibbon(r, alpha, color, stretch) {
    var band = vh + 300;
    var headY = (((r.baseY * band) + clock * r.speed * r.depth) % band) - 150;
    var headX = r.xFrac * vw;
    var length = r.length * stretch;
    for (var pass = 0; pass < 2; pass++) {
      var passOffset = pass === 0 ? 0 : 5;
      ctx.beginPath();
      for (var s = 0; s <= RIBBON_SEGS; s++) {
        var ty = headY - (s / RIBBON_SEGS) * length;
        var f = currentFlow(headX + passOffset, ty, clock + r.phase * 3);
        var tx = headX + passOffset + f.vx * 40 * r.depth;
        if (s === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = pass === 0 ? alpha : alpha * 0.35;
      ctx.lineWidth = (pass === 0 ? 2.2 : 1.2) * r.depth;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  // Field cell: drawn with an additive composite operation by the caller
  // (see render()) so overlapping cells brighten/merge rather than simply
  // layering — the actual "merge, split, recombine" behavior the fluid
  // model asks for comes from this blend mode plus stepField()'s
  // advection, not from any explicit merge logic. stretchY anisotropically
  // elongates the cell along the vertical (scroll) axis — reuses the same
  // scroll signal as ribbonStretch, so field structures visibly elongate
  // downstream under fast scrolling too, same as ribbons.
  //
  // shimmer is a small, fast (distinct-frequency-from-everything-else)
  // alpha wobble — a cheap, honest approximation of "soft illumination
  // slowly migrating," not literal caustics (that's raymarched-shader
  // territory, out of scope here — see the chat response for why).
  // c.pulse (0 normally) briefly bumps radius+alpha when an echo is
  // absorbed into this cell — see the echoes loop in render() below; the
  // "energy transforms rather than disappearing" gesture.
  function drawFieldCell(c, budget, color, stretchY) {
    var x = c.x * vw, y = c.y * vh;
    var shimmer = 0.85 + 0.15 * Math.sin(clock * 1.7 + c.seed * 2);
    var r = Math.min(vw, vh) * c.r * (1 + c.pulse * 0.15);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, stretchY);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, color); g.addColorStop(0.55, color); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.globalAlpha = budget * 0.09 * shimmer * (1 + c.pulse * 0.4);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function lerpBudget(lo, hi, frac, key) {
    return LEVEL_BUDGET[lo][key] + (LEVEL_BUDGET[hi][key] - LEVEL_BUDGET[lo][key]) * frac;
  }

  function render(tNow) {
    if (lastT === null) lastT = tNow;
    var dt = Math.min(0.05, (tNow - lastT) / 1000);
    lastT = tNow;

    scrollBoost += (1 - scrollBoost) * Math.min(1, dt * 1.8); // decay back to 1
    clock += dt * scrollBoost;
    // Ribbon elongation reuses scrollBoost's own decay curve rather than a
    // second velocity tracker — amplified (x4) so its max ~13% scroll
    // nudge becomes a much more visible ~50% ribbon stretch, matching
    // pixie-companion.js's wakeStretch in spirit (reuse a tuned decay,
    // scale it for a different visual purpose) without a second formula.
    var ribbonStretch = 1 + (scrollBoost - 1) * 4;

    // stretchY: same scroll signal as ribbonStretch, scaled down (field
    // cells are large — a 4x anisotropic stretch like ribbons get would
    // look distorted, not "elongated downstream") — capped modestly.
    var stretchY = 1 + (scrollBoost - 1) * 1.2;

    currentLevel += (targetLevel - currentLevel) * Math.min(1, dt * 2.2); // smoothed level transition
    var lo = Math.max(0, Math.floor(currentLevel)), hi = Math.min(3, Math.ceil(currentLevel));
    var frac = currentLevel - lo;
    var fieldBudget = lerpBudget(lo, hi, frac, 'field');
    var ribbonBudget = lerpBudget(lo, hi, frac, 'ribbon');
    var particulateBudget = lerpBudget(lo, hi, frac, 'particulate');
    var signalBudget = lerpBudget(lo, hi, frac, 'signal');

    // Coherence settles toward its target more slowly than the level lerp
    // above (dt*0.6 vs dt*2.2) — deliberately: the density budget should
    // respond promptly to a scene change, but the field's own "agreement
    // with itself" should feel like it's catching up a beat later, the way
    // weather reorganizes rather than switches. An active setCoherence()
    // override (see above) takes priority until it expires.
    if (coherenceOverride !== null && Date.now() >= coherenceOverrideUntil) coherenceOverride = null;
    var coherenceTarget = coherenceOverride !== null ? coherenceOverride
      : (COHERENCE_BY_LEVEL[lo] + (COHERENCE_BY_LEVEL[hi] - COHERENCE_BY_LEVEL[lo]) * frac);
    coherence += (coherenceTarget - coherence) * Math.min(1, dt * 0.6);

    // Breathing — one shared multiplier, applied to every layer's opacity
    // together below.
    var breathe = 1 + 0.07 * Math.sin(clock * 0.0898 + BREATHE_SEED);

    // 0.12 is the old Reflection-level absolute opacity — kept as the
    // reference point the new fractional budgets scale against, so this
    // reads about as bright as the previous single-budget system did.
    var budgetOpacity = 0.12 * particulateBudget * breathe;
    var activeCount = Math.round(COUNT * particulateBudget);

    var colors = cachedColors;
    ctx.clearRect(0, 0, vw, vh);

    stepField(dt);

    // Density field — drawn first, furthest back, with an ADDITIVE blend
    // ('lighter') so overlapping cells brighten and visually merge rather
    // than simply stacking — this is the layer the "Living Morphological
    // Ocean" revision makes primary; everything below (ribbons, foam) now
    // reads as riding on top of it rather than being the atmosphere itself.
    if (fieldBudget > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      for (var fcI = 0; fcI < fieldCells.length; fcI++) {
        var cell = fieldCells[fcI];
        drawFieldCell(cell, fieldBudget * breathe, cell.tint ? colors.accent : colors.fg, stretchY);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // Ribbons — current-lines riding through the field, beneath the foam
    // layer so individual foam motes still read as distinct foreground.
    if (ribbonBudget > 0.01) {
      for (var rb = 0; rb < ribbons.length; rb++) {
        var r = ribbons[rb];
        var rAlpha = ribbonBudget * (0.05 + r.depth * 0.05);
        drawRibbon(r, rAlpha, r.tint ? colors.accent : colors.fg, ribbonStretch);
      }
    }

    // Hero pulse (Level 3, reserved — #paths): for ~2.4s after the hero
    // section first enters view, fragments briefly pull toward alignment
    // along a sine band (echoing the logo's signal-line grammar) before
    // dissolving back to ambient drift. Never resolves into the literal mark.
    var heroPulse = 0;
    if (heroPulseStart !== null) {
      var since = clock - heroPulseStart;
      if (since >= 0 && since < 2.4) heroPulse = Math.sin((since / 2.4) * Math.PI);
    }

    // Opening pulse (Section 1's ignition, see the listener above): a much
    // quieter, shorter echo of the same rise-and-fall shape — a "first
    // contact" hint, not a second climax. Pulls particles toward the
    // viewport's literal center (where the ignition spark itself sits),
    // not the hero's off-center sine band — a different point of light,
    // a different gesture, so it shouldn't look identical to the arrival.
    var openingPulse = 0;
    if (openingPulseStart !== null) {
      var sinceOpening = clock - openingPulseStart;
      if (sinceOpening >= 0 && sinceOpening < 1.6) openingPulse = Math.sin((sinceOpening / 1.6) * Math.PI);
    }

    var band = vh + 220; // loop band height (px), with margin so wrap is off-screen
    for (var i = 0; i < activeCount; i++) {
      var p = particles[i];
      var y = (((p.baseY * band) + clock * p.speed * p.depth) % band) - 110;
      var baseX = p.xFrac * vw;
      // Wobble samples currentFlow() (the coherence-blended field) at the
      // particle's own position (with a per-particle time offset via
      // p.phase so particles sharing the same field don't move in
      // lockstep) instead of an independent per-particle sine term — this
      // alone is what turns "isolated objects drifting" into "carried by
      // one current," and it's why foam visibly gets more scattered/
      // competing during low-coherence beats along with the ribbons above.
      // A small vertical nudge from the same sample (f.vy) adds gentle
      // eddying on top of the primary downstream drift, which stays the
      // loop-band mechanism above (unchanged, since that's what already
      // guarantees no visible wrap/repeat).
      var f = currentFlow(baseX, y, clock + p.phase * 3);
      // micro: a small, fast, distinct-frequency wobble layered on top —
      // the "microscopic shimmering diffusion" scale, a third tier below
      // the field cells' (very slow/huge) and the primary wobble's
      // (moderate) scales. Foam-only; ribbons/field cells stay at their
      // own two scales so the hierarchy reads as three distinct sizes of
      // motion, not one noisier one.
      var micro = Math.sin(clock * 3.1 + p.phase * 5 + baseX * 0.05) * 0.6 * p.depth;
      var wob = f.vx * p.wobbleAmp * p.depth + micro;
      var x = baseX + wob;
      y += f.vy * p.depth * 6;
      if (heroPulse > 0) {
        // Pull x toward a shared sine curve across the viewport width —
        // "waveform fragments align" — then release as heroPulse fades.
        // Release now lands back on the flow-driven x above (not an
        // independent sine), so the moment reads as "the current
        // reabsorbing the alignment" rather than a mode-switch.
        var alignedX = vw * 0.5 + Math.sin((y / vh) * Math.PI * 2 + 1.2) * vw * 0.28;
        x = x + (alignedX - x) * heroPulse * 0.7;
      }
      if (openingPulse > 0) {
        x = x + (vw * 0.5 - x) * openingPulse * 0.4;
      }
      // type 0 (fragments, the majority) is the "signal" layer — gets its
      // own budget on top of the shared particulate one; dots/curves stay
      // on particulate alone.
      var layerBudget = p.type === 0 ? signalBudget : 1;
      // Foam: local speed of the SAME field sample (|vx| + |vy|) modulates
      // visibility — foam brightens where the invisible current is moving
      // faster beneath it, dims where it's calm, per "particles merely
      // reveal the invisible motion" rather than existing independently of
      // it. Clamped so it nudges rather than fully hides/exposes.
      var speedMag = Math.min(1.4, Math.abs(f.vx) + Math.abs(f.vy));
      var alpha = budgetOpacity * layerBudget * (0.25 + speedMag * 0.4) * (0.4 + p.depth * 0.6) * (1 + heroPulse * 1.3) * (1 + openingPulse * 0.6);
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
        if (t >= 1) {
          // Conservation gesture: rather than simply vanishing, the echo's
          // "energy" gives the nearest density-field cell a brief radius/
          // alpha pulse (see c.pulse in drawFieldCell/stepField) — so the
          // moment reads as transforming into the ambient field rather
          // than disappearing. This is a gesture, not literal mass
          // conservation (a full accounting system is a bigger undertaking
          // than this pass takes on) — but it's an honest one: something
          // observable actually happens at the handoff.
          var nearest = null, nearestD = Infinity;
          for (var nf = 0; nf < fieldCells.length; nf++) {
            var dxN = fieldCells[nf].x * vw - ec.x, dyN = fieldCells[nf].y * vh - ec.y;
            var dd = dxN * dxN + dyN * dyN;
            if (dd < nearestD) { nearestD = dd; nearest = fieldCells[nf]; }
          }
          if (nearest) nearest.pulse = 1;
          continue;
        }
        var ea = (1 - t) * budgetOpacity * 2.2;
        var ey = ec.y + t * 60; // gentle downward settle into the Current
        drawDot(ec.x, ey, ec.size, ea, ec.tint ? colors.accent : colors.fg);
        kept.push(ec);
      }
      echoes = kept;
    }

    // Orb breathing — background .bg-orb-1/2/3 (styles.css) pick up a
    // --orb-breathe custom property here, sourced from the same flow
    // field at a slow global rate with a per-orb spatial phase offset, so
    // they visibly pulse in sync with the same current without moving in
    // lockstep with the canvas particles. Skipped entirely under
    // reduced-motion (CSS's own var(--orb-breathe, 1) fallback holds).
    // Throttled to ~10Hz rather than every native frame: the breathing
    // sine here has a ~52s period (2*PI / 0.12), so consecutive 60fps
    // frames differ by a fraction of a degree of phase — imperceptible.
    // This canvas's render() loop runs continuously for the entire time
    // the tab is visible (gated only by page visibility, not scroll
    // position or scene — see pageVisibilityObserver below), so writing
    // this style 60x/sec was a real always-on cost across 3 elements that
    // each already carry filter: blur(120px) + mix-blend-mode compositing.
    // Sampling at ~10Hz instead cuts that write/recalc cost by ~83% with
    // the same visible result.
    if (!reducedMotion && orbEls.length && clock - orbLastWrite >= 0.1) {
      orbLastWrite = clock;
      for (var oi = 0; oi < orbEls.length; oi++) {
        var of = flow(orbSeeds[oi] * 10, orbSeeds[oi] * 7, clock * 0.12);
        var breathe = 1 + 0.14 * Math.sin(clock * 0.12 + of.vx + orbSeeds[oi]);
        orbEls[oi].style.setProperty('--orb-breathe', breathe.toFixed(3));
      }
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
