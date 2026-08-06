// maie-logo-motion.js — MAIE Logo Motion Component (per the "MAIE Logo
// Animation System" brief: Signal -> Formation -> Intelligence, built
// from a small set of reusable primitives rather than a one-off effect).
//
// Not a new glyph and not a new animation mechanism per instance — this
// targets the ACTUAL recurring signal-curve mark already in the page
// (viewBox 0 0 92 56, the same path used for .nav-brand and
// .brand-divider-mark), animated in place via the Web Animations API
// only. No rAF loop, no getPointAtLength: the pre-production audit
// already flagged scene-chaos-signal.js's getPointAtLength() chip
// convergence as the top scroll-jank contributor (5.6s self-time), so
// this stays off that budget entirely — every primitive here is a
// dasharray/dashoffset or transform animation the compositor can run
// on its own thread.
//
// Wired to ONE live placement this pass: .nav-brand — "awaken" once on
// load, then a quiet recurring "idle" pulse for as long as the tab is
// visible (the "Always On" feeling from the brief, applied to the mark
// that's actually persistent on every scroll position).
//
// .brand-divider-mark is deliberately NOT wired up. index.html/
// styles.css both say so explicitly: the divider is normal document
// flow on purpose, "a brand beat the visitor scrolls past, not a
// fourth choreographed moment." Giving it its own Awakening on scroll-
// into-view would undo that call, so this file leaves it alone.
//
// Primitives are exposed on window.MaieLogoMotion so a future node-
// based mark (e.g. a marketplace/ecosystem moment) can compose Scatter/
// Converge against real coordinates without touching this file — the
// current "many components, one system" moment on this page is already
// bespoke-built in scene-chaos-signal.js (chips converging onto this
// same nav mark), so this file doesn't duplicate that with a second,
// generic version.

(function () {
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Primitives ------------------------------------------------------

  // Trace: progressive stroke draw-on. Element needs pathLength="1" (same
  // convention as .paths-signal-wave elsewhere) so the dash math is
  // resolution-independent.
  function trace(pathEl, opts) {
    opts = opts || {};
    if (!pathEl) return null;
    if (reducedMotion) return null;
    return pathEl.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: opts.duration || 900, delay: opts.delay || 0, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
    );
  }

  // Beacon: the endpoint dot + ring "activating" — a scale/opacity pulse
  // rather than a hard cut to visible.
  function beacon(dotEl, ringEl, opts) {
    opts = opts || {};
    if (reducedMotion) return null;
    var delay = opts.delay || 0;
    var anims = [];
    if (dotEl) {
      anims.push(dotEl.animate(
        [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.4)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 500, delay: delay, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' }
      ));
    }
    if (ringEl) {
      anims.push(ringEl.animate(
        [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.4 }],
        { duration: 650, delay: delay + 80, easing: 'ease-out', fill: 'forwards' }
      ));
    }
    return anims;
  }

  // Pulse: a short bright dash traveling the already-drawn path — a
  // temporary clone with a tiny dasharray sweeping dashoffset 1 -> 0, so
  // no per-frame geometry reads are needed. Cleans itself up on finish.
  function pulse(pathEl, opts) {
    opts = opts || {};
    if (!pathEl || reducedMotion) return null;
    var glow = pathEl.cloneNode(false);
    glow.classList.add('brand-signal-pulse-trace');
    glow.style.strokeDasharray = '0.06 1';
    glow.style.strokeDashoffset = '1';
    pathEl.parentNode.appendChild(glow);
    var anim = glow.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: opts.duration || 1100, delay: opts.delay || 0, easing: 'linear' }
    );
    anim.onfinish = function () { glow.remove(); };
    return anim;
  }

  // Idle: a quiet, recurring pulse — gated on tab visibility so it never
  // does work in a background tab (same concern atmosphere.js's own
  // visibility gating addresses for its render loop).
  function idle(pathEl, dotEl, opts) {
    opts = opts || {};
    if (reducedMotion) return function stop() {};
    var interval = opts.interval || 4200;
    var timer = null;
    function fire() {
      pulse(pathEl, { duration: 1300 });
      if (dotEl) {
        dotEl.animate([{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }], { duration: 900, easing: 'ease-in-out' });
      }
    }
    function schedule() {
      // Jitter source: a coarse, slow time-sample of the World Layer's
      // shared flow field (atmosphere.js) when available, instead of
      // Math.random() — lowest-priority item in the Atmospheric Evolution
      // plan (§7): purely a timing coincidence, no visual coupling, so the
      // logo's irregular pulse timing still feels causally connected to
      // the same current everything else samples. Falls back to the
      // original RNG if atmosphere.js hasn't run (e.g. its canvas is
      // missing) — this must never block the idle pulse from scheduling.
      var jitter;
      if (window.MaieAtmosphere && window.MaieAtmosphere.flow) {
        jitter = Math.abs(window.MaieAtmosphere.flow(37, 71, Date.now() / 1000).vx) * 450;
      } else {
        jitter = Math.random() * 900;
      }
      timer = window.setTimeout(function () {
        if (!document.hidden) fire();
        schedule();
      }, interval + jitter);
    }
    schedule();
    return function stop() { window.clearTimeout(timer); };
  }

  // Scatter / Converge: provided for a future node-based mark (a set of
  // discrete elements, not one path). Not wired to anything on this page
  // yet — see header note.
  function scatter(nodeEls, targets, opts) {
    opts = opts || {};
    if (reducedMotion) return null;
    return Array.prototype.map.call(nodeEls, function (el, i) {
      var t = targets[i] || { x: 0, y: 0 };
      return el.animate(
        [{ transform: 'translate(0,0)' }, { transform: 'translate(' + t.x + 'px,' + t.y + 'px)' }],
        { duration: opts.duration || 700, delay: (opts.stagger || 0) * i, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
      );
    });
  }
  function converge(nodeEls, opts) {
    opts = opts || {};
    if (reducedMotion) return null;
    return Array.prototype.map.call(nodeEls, function (el, i) {
      return el.animate(
        [{ transform: getComputedStyle(el).transform }, { transform: 'translate(0,0)' }],
        { duration: opts.duration || 700, delay: (opts.stagger || 0) * i, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
      );
    });
  }

  // ---- Awakening (composed mode): Signal -> Formation -> Intelligence --
  function awaken(svgEl, opts) {
    opts = opts || {};
    if (!svgEl) return;
    var pathEl = svgEl.querySelector('.brand-signal-path');
    var dotEl = svgEl.querySelector('.brand-signal-dot');
    var ringEl = svgEl.querySelector('.brand-signal-ring');
    if (reducedMotion || !pathEl) {
      svgEl.classList.add('brand-signal-settled');
      return;
    }
    var traceDuration = opts.traceDuration || 820;
    svgEl.classList.add('brand-signal-awakening');
    trace(pathEl, { duration: traceDuration });
    beacon(dotEl, ringEl, { delay: traceDuration - 120 });
    window.setTimeout(function () {
      svgEl.classList.remove('brand-signal-awakening');
      svgEl.classList.add('brand-signal-settled');
      if (opts.thenIdle) idle(pathEl, dotEl, opts.idleOpts);
    }, traceDuration + 700);
  }

  window.MaieLogoMotion = { trace: trace, beacon: beacon, pulse: pulse, idle: idle, scatter: scatter, converge: converge, awaken: awaken };

  // ---- Wiring: .nav-brand — awaken on load, then Always-On idle --------
  var navMark = document.querySelector('.nav-brand-mark');
  if (navMark) {
    if (document.readyState === 'complete') {
      awaken(navMark, { thenIdle: true });
    } else {
      window.addEventListener('load', function () { awaken(navMark, { thenIdle: true }); }, { once: true });
    }
  }
})();
