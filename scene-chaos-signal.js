// scene-chaos-signal.js — Sections 5+6 merged: "Chaos of Creation" flows
// directly into "Everything Connects" as one continuous scroll region,
// per chaos-to-signal-merge-direction.md. One .story-scene wrapper, one
// sticky panel, one initScrollScene progress driver — internally split
// into a chaos/escalation stage (progress 0.0-0.45) and a convergence/
// ignition stage (0.45-1.0) via storyStageWeight, same idiom every other
// scene on this page already uses for its own sub-beats.
//
// Three things changed from the pre-merge scene-chaos.js + scene-maie-
// moment.js pair, per the direction doc:
//
// 1. VELOCITY CAP (doc §4). The old `chip.vx *= -1.8` hover kick had no
//    ceiling — repeated hovers compounded multiplicatively, and a chip
//    fast enough crossed the wraparound boundary in a single frame,
//    which read as "glitching at warp speed." Every chip now has a fixed
//    MAX_SPEED clamp, and its velocity decays back toward its own base
//    drift every frame instead of staying permanently amplified — a
//    hover still perturbs it, but the field's total energy settles
//    instead of ratcheting upward forever.
//
// 2. NO SEPARATE SVG-CIRCLE HANDOFF. The old scene-maie-moment.js
//    snapshotted chip positions once (window.getChaosChipPositions())
//    and recreated anonymous <circle> nodes from that snapshot — a
//    workaround for the two-scene architecture's hard pin/unpin cut.
//    Now that it's one continuous scene, the SAME DOM chip elements
//    drift through chaos and then morph in place into the convergence
//    state — no snapshot, no recreation, no scene-boundary bridge
//    needed, and it stays correct under scrolling back and forth (the
//    old snapshot-once approach couldn't have supported that).
//
// 3. MESSAGE CHIPS (doc §3). A small curated subset of chips (see
//    CHIPS below, `isMessage: true`) keep their DOM element and its
//    text through the entire transition instead of dissolving into a
//    plain dot like the rest. Their glitchy label crossfades into a
//    clean phrase as they arrive at specific, ordered points along the
//    signal path, so reading the path left-to-right concatenates into
//    one line. Everything else still resolves into an anonymous,
//    shrinking, fading dot, exactly as before.
//
// The signal path itself (the literal nav-logo mark) and the ignition-
// flash/accent-ring sequence are UNCHANGED in their internal tuning —
// per the direction doc, that moment is already well-tuned and isn't
// being re-litigated here. It just now reads off `convLocal` (progress
// rescaled to the 0.45-1.0 window) instead of its own independent 0-1.

(function () {
  var section = document.getElementById('scene-chaos-signal');
  if (!section) return;
  var field = document.getElementById('chaos-field');
  var chaosCaption = document.getElementById('chaos-caption');
  var svg = document.getElementById('signal-svg');
  var path = document.getElementById('signal-path');
  var accentDot = document.getElementById('signal-accent-dot');
  var accentRing = document.getElementById('signal-accent-ring');
  var capBefore = document.getElementById('scene-maie-caption-before');
  var capAfter = document.getElementById('scene-maie-caption-after');
  if (!field || !svg || !path) return;

  var len = path.getTotalLength();
  path.style.strokeDasharray = len;

  // 0.0-0.45 chaos/escalation, 0.45-1.0 convergence/ignition — the exact
  // split is a judgment call per the direction doc; this mirrors its own
  // suggested rough numbers.
  var CONV_START = 0.45;

  var CHIPS = [
    { type: 'file', label: 'v1_final_FINAL.mov' },
    { type: 'file', label: 'footage_USE_THIS.mp4' },
    { type: 'file', label: 'old_cut_DONT_DELETE.mov' },
    { type: 'file', label: 'IMG_0442.CR2' },
    { type: 'file', label: 'Untitled_23.wav' },
    { type: 'file', label: 'sync_conflict.docx' },
    { type: 'window', label: 'Drive · Shared with 4' },
    { type: 'window', label: 'iCloud — sync error' },
    { type: 'window', label: 'Dropbox — 2 conflicts' },
    { type: 'alert', label: '💬 3 unread mentions' },
    { type: 'alert', label: '⚠ Storage almost full' },
    { type: 'file', label: 'export_v9(2)(1).mp4' },
    { type: 'window', label: 'Local Bin — untitled' },
    { type: 'file', label: 'audio_MIX_v4.wav' },
    { type: 'window', label: 'Agent Tab — 6 unsaved runs' },
    { type: 'file', label: 'model_checkpoint_v3.safetensors' },
    { type: 'alert', label: '⚠ 3 agent approvals pending' },
    // Message chips — indistinguishable from the noise above during the
    // chaos phase (same drift, same hover behavior), but carry their
    // text through convergence instead of dissolving. Read in
    // messageOrder, they concatenate into one brand-centric line.
    { type: 'file', label: 'St0r4ge_4ND.tmp', isMessage: true, messageOrder: 0, messageText: 'Storage.' },
    { type: 'file', label: '1nf1n1te_d4ta_p00ls', isMessage: true, messageOrder: 1, messageText: 'Infinite data pools.' },
    { type: 'file', label: 'M4N4G3D_w1th_3ase.md', isMessage: true, messageOrder: 2, messageText: 'Managed with ease.' },
  ];
  var WARNINGS = ['Duplicate Asset Found', 'Missing Reference', 'Untracked Change'];
  // Ordered target points along the path (0=start, 1=end, matching
  // path.getPointAtLength(t*len)) — spread across the path, clear of the
  // accent dot/ring at the very end. Arc-length parametrization means
  // equal t-spacing isn't equal on-screen spacing (the path zigzags), so
  // these were tuned by eye against a screenshot, not evenly divided.
  var MESSAGE_T = [0.08, 0.46, 0.85];
  // Vertical offset (% of panel height) per ordered point, alternating
  // above/below the stroke — with the tuned t-values still not
  // guaranteeing horizontal clearance between neighboring bubbles
  // (especially "Infinite data pools.", the longest label), alternating
  // sides is what actually prevents overlap, verified via screenshot.
  var MESSAGE_Y_OFFSET = [-7, 9, -7];

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hard ceiling on chip speed, regardless of hover count — see header
  // note §1. Tuned well above the ambient drift's own natural max
  // (~0.032) so a hover still reads as a real kick, but nothing can
  // compound past this.
  var MAX_SPEED = 0.14;
  function clampSpeed(vx, vy, max) {
    var s = Math.sqrt(vx * vx + vy * vy);
    if (s > max) { var k = max / s; return { vx: vx * k, vy: vy * k }; }
    return { vx: vx, vy: vy };
  }

  var lastProgress = 0;
  var chips = [];
  var noiseChips = [];
  var messageChips = [];

  CHIPS.forEach(function (def, i) {
    var el = document.createElement('div');
    el.className = 'chaos-chip chaos-chip--' + def.type + (def.isMessage ? ' chaos-chip--message' : '');
    el.textContent = def.label;

    var warn = document.createElement('div');
    warn.className = 'chaos-warn';
    warn.textContent = WARNINGS[i % WARNINGS.length];
    el.appendChild(warn);

    field.appendChild(el);

    var baseVx = (Math.random() - 0.5) * (reducedMotion ? 0 : 0.045);
    var baseVy = (Math.random() - 0.5) * (reducedMotion ? 0 : 0.045);

    var chip = {
      el: el, def: def, warnEl: warn,
      x: Math.random() * 100, y: Math.random() * 100,      // % of field
      vx: baseVx, vy: baseVy,
      baseVx: baseVx, baseVy: baseVy,                        // decay target — see step()
      rot: (Math.random() - 0.5) * 14,
      hovered: false, wasClean: false,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
    };
    el.style.left = chip.x + '%';
    el.style.top = chip.y + '%';
    el.style.transform = 'translate(-50%, -50%) rotate(' + chip.rot + 'deg)';

    el.addEventListener('mouseenter', function () {
      // Only perturbable during pure chaos — once convergence begins,
      // chips are resolving into position/message and shouldn't be
      // freely kickable, or the "magnetic anchor" read breaks.
      if (lastProgress >= CONV_START) return;
      chip.hovered = true;
      var kicked = clampSpeed(chip.vx * -1.8, chip.vy * -1.8, MAX_SPEED);
      chip.vx = kicked.vx; chip.vy = kicked.vy;
    });
    el.addEventListener('mouseleave', function () { chip.hovered = false; });

    chips.push(chip);
    (def.isMessage ? messageChips : noiseChips).push(chip);
  });

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function pathThemeColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  function step() {
    chips.forEach(function (c) {
      c.x += c.vx; c.y += c.vy;
      // Ease current velocity back toward the chip's own base drift —
      // a hover perturbs it, but nothing keeps compounding on top of
      // the last nudge; the field's total energy settles instead of
      // ratcheting up forever (see header note §1).
      c.vx += (c.baseVx - c.vx) * 0.02;
      c.vy += (c.baseVy - c.vy) * 0.02;
      if (c.x < -8) c.x = 108; if (c.x > 108) c.x = -8;
      if (c.y < -8) c.y = 108; if (c.y > 108) c.y = -8;
      c.el.classList.toggle('is-warning', c.hovered);
    });
  }

  var clock = 0;

  function render(progress, isStatic) {
    var chaosLocal = Math.min(1, progress / CONV_START);
    // Two variants of the same local progress, deliberately: storyStageWeight
    // already handles out-of-range input correctly on its own (returns 0
    // well outside a fade window) — but clamping to exactly 0 for the whole
    // chaos phase broke that for any fade window starting AT 0 (capBefore):
    // storyStageWeight(0, 0.0, ...) falls through to its "inside the
    // plateau" branch and returns 1, not 0, because 0 == that window's own
    // start. Un-clamped (genuinely negative through the whole chaos phase)
    // fixes it correctly. `eased`/position math still needs the clamped,
    // bounded version — ease() isn't meant for out-of-[0,1] input.
    var convLocalRaw = (progress - CONV_START) / (1 - CONV_START);
    var convLocal = Math.max(0, Math.min(1, convLocalRaw));
    var eased = ease(convLocal);

    // ── Chaos-phase caption + density (0.0-0.45 window) ───────────────
    if (chaosCaption) chaosCaption.style.opacity = window.storyStageWeight(chaosLocal, 0.10, 0.55, 0.08, 0.15);
    field.style.setProperty('--chaos-density', 0.5 + chaosLocal * 0.5);

    // ── Path stroke-in + ignition (0.45-1.0 window) — tuning unchanged
    // from the pre-merge scene-maie-moment.js, just reading convLocal
    // instead of its own independent progress. Not re-litigated per the
    // direction doc — this moment is already right. ───────────────────
    path.style.strokeDashoffset = len * (1 - eased);

    var flashW = window.storyStageWeight(convLocalRaw, 0.82, 0.86, 0.06, 0.10);
    if (flashW > 0.002) {
      var accentRgb = hexToRgb(pathThemeColor('--accent', '#FFD166'));
      path.style.filter = 'drop-shadow(0 0 ' + (1.5 + flashW * 2.5).toFixed(1) + 'px rgba(' + accentRgb + ',' + (flashW * 0.65).toFixed(2) + '))';
      path.style.strokeWidth = (1.6 + flashW * 0.7).toFixed(2);
    } else {
      path.style.filter = '';
      path.style.strokeWidth = '';
    }
    if (accentDot) {
      var dotW = window.storyStageWeight(convLocalRaw, 0.90, 1.0, 0.04, 0);
      accentDot.setAttribute('opacity', Math.max(dotW, flashW));
    }
    if (accentRing) {
      var ringSteady = window.storyStageWeight(convLocalRaw, 0.90, 1.0, 0.04, 0);
      accentRing.setAttribute('opacity', Math.max(ringSteady * 0.4, flashW * 0.85).toFixed(2));
      accentRing.setAttribute('r', (6.5 + flashW * 2.2).toFixed(2));
    }
    if (capBefore) capBefore.style.opacity = window.storyStageWeight(convLocalRaw, 0.0, 0.28, 0.02, 0.10);
    if (capAfter) capAfter.style.opacity = window.storyStageWeight(convLocalRaw, 0.78, 1.0, 0.10, 0);

    // ── Convergence targets — computed once per frame (not per chip):
    // getScreenCTM()/getBoundingClientRect() are relatively expensive DOM
    // reads, and every chip in a given frame wants the same field rect
    // and the same path transform. ─────────────────────────────────────
    var fieldRect = null, screenCTM = null;
    if (eased > 0.001) {
      fieldRect = field.getBoundingClientRect();
      screenCTM = path.getScreenCTM();
    }
    function targetPercent(t) {
      var p = path.getPointAtLength(t * len).matrixTransform(screenCTM);
      return {
        xPct: ((p.x - fieldRect.left) / fieldRect.width) * 100,
        yPct: ((p.y - fieldRect.top) / fieldRect.height) * 100,
      };
    }

    // ── Noise chips: drift, then shrink into a plain dot and dissolve —
    // same fade timing (full through 0.70, gone by 0.90) the pre-merge
    // SVG nodes used, now happening in place on the same DOM element. ──
    var noiseOpacity = window.storyStageWeight(convLocalRaw, 0.0, 0.70, 0.0, 0.20);
    noiseChips.forEach(function (c, i) {
      var wob = isStatic ? 0 : Math.sin(clock * c.speed + c.phase) * (1 - eased) * 4;
      if (eased > 0.001) {
        var t = noiseChips.length > 1 ? i / (noiseChips.length - 1) : 0;
        var target = targetPercent(t);
        var x = c.x * (1 - eased) + target.xPct * eased + wob;
        var y = c.y * (1 - eased) + target.yPct * eased + wob * 0.6;
        c.el.style.left = x + '%';
        c.el.style.top = y + '%';
        var shrink = eased;
        c.el.style.padding = (8 - shrink * 5).toFixed(1) + 'px';
        c.el.style.fontSize = (12 - shrink * 12).toFixed(1) + 'px';
        c.el.style.borderRadius = (8 + shrink * 50).toFixed(0) + 'px';
        c.el.style.background = 'rgba(232,230,227,' + (0.05 + shrink * 0.5).toFixed(2) + ')';
        c.el.style.borderColor = 'rgba(255,255,255,' + (0.12 * (1 - shrink)).toFixed(2) + ')';
        c.el.style.opacity = noiseOpacity.toFixed(2);
      } else {
        // Back in pure-chaos range (including scrolling back up out of
        // convergence) — clear inline overrides so the chaos-phase CSS
        // defaults (padding/border-radius/opacity via --chaos-density)
        // take back over.
        c.el.style.left = c.x + '%';
        c.el.style.top = c.y + '%';
        c.el.style.padding = '';
        c.el.style.fontSize = '';
        c.el.style.borderRadius = '';
        c.el.style.background = '';
        c.el.style.borderColor = '';
        c.el.style.opacity = '';
      }
    });

    // ── Message chips: converge onto ordered points and stay — they're
    // the resolved signal, not noise, so unlike the rest they don't
    // dissolve. Label crossfades (via a brief opacity dip + a hard
    // content swap, same idiom Section 1's caption beats use) from the
    // glitchy filename to the clean phrase partway through arrival. ────
    messageChips.forEach(function (c) {
      var wob = isStatic ? 0 : Math.sin(clock * c.speed + c.phase) * (1 - eased) * 3;
      if (eased > 0.001) {
        var t = MESSAGE_T[c.def.messageOrder];
        var target = targetPercent(t);
        var x = c.x * (1 - eased) + target.xPct * eased + wob;
        var y = c.y * (1 - eased) + (target.yPct + MESSAGE_Y_OFFSET[c.def.messageOrder]) * eased + wob * 0.5;
        c.el.style.left = x + '%';
        c.el.style.top = y + '%';

        var showClean = eased > 0.55;
        if (showClean !== c.wasClean) {
          c.el.textContent = showClean ? c.def.messageText : c.def.label;
          c.el.appendChild(c.warnEl);
          c.wasClean = showClean;
        }
        c.el.classList.toggle('is-resolved', showClean);

        var dip = Math.max(0, 1 - Math.abs(eased - 0.55) * 6);
        c.el.style.opacity = (1 - dip * 0.55).toFixed(2);
      } else {
        c.el.style.left = c.x + '%';
        c.el.style.top = c.y + '%';
        c.el.style.opacity = '';
        if (c.wasClean) {
          c.el.textContent = c.def.label;
          c.el.appendChild(c.warnEl);
          c.wasClean = false;
          c.el.classList.remove('is-resolved');
        }
      }
    });
  }

  window.initScrollScene(section, function (progress, staticFrame) {
    lastProgress = progress;
    render(progress, staticFrame);
  });

  if (!reducedMotion) {
    (function loop() {
      clock += 0.02;
      step();
      render(lastProgress, false);
      requestAnimationFrame(loop);
    })();
  }
})();
