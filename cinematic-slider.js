// cinematic-slider.js — reusable "cinematic statement" engine.
//
// Powers two distinct instances on the page:
//   1. #paths-cinematic       — Outcomes  ("what changes for you")
//   2. #primitives-cinematic  — Commitments ("what we built so it could")
// One shared engine, one instance each — per CLAUDE.md §8's own reuse
// convention (share the engine, don't build a second one from scratch).
//
// Content lives entirely in index.html as [data-line] children — this
// file never touches statement text, so the MAIE team can edit, reorder,
// add, or remove statements without opening this file at all.
//
// Not a scroll-driven module, so it doesn't register through reveal.js's
// registerScrollBatch (that batch exists specifically for scroll-tick
// read/write coordination — see reveal.js — which doesn't apply here).
// It does follow the same IntersectionObserver-gating convention CLAUDE.md
// §4 calls out (scene-opening.js, scene-chaos-signal.js): the advance
// timer only runs while the slider is actually on screen.

(function () {
  var DWELL_MS = 4200;       // time each statement holds before advancing
  var TRANSITION_MS = 900;   // crossfade duration

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initSlider(root) {
    var lines = Array.prototype.slice.call(root.querySelectorAll('[data-line]'));
    if (lines.length < 2) return;

    root.style.setProperty('--cinematic-transition', TRANSITION_MS + 'ms');

    // Measure the tallest statement while lines are still in normal flow
    // (stacked absolutely, they'd collapse the container to 0 height) so
    // the component reserves a stable footprint up front — no layout
    // shift as statements of different lengths rotate through.
    var maxHeight = 0;
    lines.forEach(function (line) {
      maxHeight = Math.max(maxHeight, line.offsetHeight);
    });
    root.style.minHeight = maxHeight + 'px';

    lines.forEach(function (line, i) {
      line.classList.add('cinematic-slider-line');
      line.classList.toggle('is-active', i === 0);
      line.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    if (reducedMotion) {
      // Static, not motion-reduced: a single settled statement, no
      // auto-advancing content at all. Matches this codebase's existing
      // reduced-motion convention (.paths-proof-line et al.) of an
      // immediate, non-animated state rather than a slower version of
      // the same continuously-updating experience.
      root.classList.add('is-static');
      return;
    }

    var index = 0;
    var timer = null;

    function advance() {
      var next = (index + 1) % lines.length;
      lines[index].classList.remove('is-active');
      lines[index].setAttribute('aria-hidden', 'true');
      lines[next].classList.add('is-active');
      lines[next].setAttribute('aria-hidden', 'false');
      index = next;
    }

    function start() {
      if (timer) return;
      timer = window.setInterval(advance, DWELL_MS);
    }
    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    // Only run the timer while the slider is actually visible — same
    // gating idiom already established for idle-loop animation elsewhere
    // in this codebase (see CLAUDE.md §4).
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.4 });
      io.observe(root);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (root.getBoundingClientRect().top < window.innerHeight && root.getBoundingClientRect().bottom > 0) start();
    });

    // Recompute the reserved height on resize (line wrapping changes at
    // different widths) — kept local to this component, not funneled
    // through reveal.js's scroll batch, since it isn't scroll-driven.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var wasMinHeight = root.style.minHeight;
        root.style.minHeight = '';
        var h = 0;
        lines.forEach(function (line) {
          var prevPos = line.style.position;
          line.style.position = 'static';
          h = Math.max(h, line.offsetHeight);
          line.style.position = prevPos;
        });
        root.style.minHeight = (h || parseFloat(wasMinHeight) || 0) + 'px';
      }, 150);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sliders = Array.prototype.slice.call(document.querySelectorAll('[data-cinematic-slider]'));
    sliders.forEach(initSlider);
  });
})();
