// showcase-slider.js — automated photo rotation for the #paths media
// showcase (index.html's .showcase-grid). Each .showcase-figure holds 5
// stacked <img data-frame> elements; this crossfades through them on a
// timer. No controls, no user input — purely atmospheric motion, same
// spirit as the World Layer canvas.
//
// Deliberately its own small module rather than a branch inside
// cinematic-slider.js: that engine's core job is reserving layout space
// for variable-height TEXT lines (measuring each line's offsetHeight
// before absolutely positioning them) — meaningless here, since every
// .showcase-figure already has a fixed aspect-ratio box (styles.css)
// that reserves its own space regardless of which photo is loaded.
// Branching that logic for a sizing model it wasn't built for would put
// the two existing, already-tested cinematic-slider.js instances at risk
// for a case that doesn't need it.
//
// What IS reused: the same shape — a timer gated by IntersectionObserver
// (CLAUDE.md §4's own visibility-gating convention), aria-hidden
// toggling with no aria-live (same reasoning cinematic-slider.js already
// documents: a region that force-announces a new photo every few
// seconds would be disruptive, not helpful), and an immediate
// no-rotation fallback under prefers-reduced-motion.

(function () {
  var DWELL_MS = 5000;
  var TRANSITION_MS = 1400;

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initFigureSlider(figure) {
    var frames = Array.prototype.slice.call(figure.querySelectorAll('img[data-frame]'));
    if (frames.length < 2) return;

    figure.style.setProperty('--showcase-transition', TRANSITION_MS + 'ms');

    frames.forEach(function (img) {
      img.classList.remove('is-active');
      img.setAttribute('aria-hidden', 'true');
    });

    // Reduced motion: settle on the first frame only, same "immediate
    // settled state, no auto-advancing content" convention cinematic-
    // slider.js's own reduced-motion path already uses.
    var index = reducedMotion ? 0 : Math.floor(Math.random() * frames.length);
    frames[index].classList.add('is-active');
    frames[index].setAttribute('aria-hidden', 'false');
    if (reducedMotion) return;

    var timer = null;
    function advance() {
      var next = (index + 1) % frames.length;
      frames[index].classList.remove('is-active');
      frames[index].setAttribute('aria-hidden', 'true');
      frames[next].classList.add('is-active');
      frames[next].setAttribute('aria-hidden', 'false');
      index = next;
    }
    function start() { if (!timer) timer = window.setInterval(advance, DWELL_MS); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.2 });
      io.observe(figure);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else {
        var r = figure.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) start();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('.showcase-figure'))
      .forEach(initFigureSlider);
  });
})();
