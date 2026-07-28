// nav-float.js — evolves the existing nav bar toward the brief's "floating
// glass panel, subtly compresses and softens as users scroll" language,
// without replacing nav-theme.js's on-dark handling or nav-menu.js's
// mobile disclosure. Toggles one class, .nav--compact, past a small
// scroll threshold; all the actual visual change (height, radius, inset,
// blur) lives in styles.css so this stays a one-line-per-frame decision.
// Routed through reveal.js's shared scroll-batch (same convention as
// nav-theme.js) rather than its own listener.

(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var THRESHOLD = 48; // px scrolled before the nav compresses
  function read() { return window.scrollY || document.documentElement.scrollTop || 0; }
  function write(y) { nav.classList.toggle('nav--compact', y > THRESHOLD); }

  if (window.registerScrollBatch) {
    window.registerScrollBatch(read, write);
  } else {
    window.addEventListener('scroll', function () { write(read()); }, { passive: true });
    write(read());
  }
  if (reducedMotion) nav.classList.add('nav--no-motion');
})();
