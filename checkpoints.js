// checkpoints.js — the three chapter-boundary checkpoints (index.html's
// [data-reveal].checkpoint instances) are plain `<a href="#section-id">`
// links deliberately: native anchor navigation, fully keyboard-accessible
// and functional with zero JS, smoothed by the site's own existing
// `html { scroll-behavior: smooth }` (styles.css) — no scrollIntoView
// call needed for the common case, matching reveal.js's rail dots in
// destination but not in mechanism (they're real links, not buttons,
// since this is navigation, not a UI control).
//
// The one real gap that global scroll-behavior:smooth leaves: it has no
// prefers-reduced-motion override anywhere in this codebase, so a plain
// anchor click always smooth-scrolls regardless of that preference —
// unlike every other scroll-triggered motion on this page, which already
// checks it explicitly (story-scroll.js, reveal.js's own rail dots,
// atmosphere.js, etc.). This file exists only to close that one gap for
// checkpoint links specifically; it does nothing at all — no listeners,
// no cost — for the common (non-reduced-motion) case, where the native
// behavior is already correct.
(function () {
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) return;

  var links = document.querySelectorAll('[data-checkpoint-target]');
  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.getElementById(link.dataset.checkpointTarget);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      history.pushState(null, '', '#' + link.dataset.checkpointTarget);
    });
  });
})();
