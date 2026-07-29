// story-scroll.js — shared scroll-progress driver for "story scene" sections.
// A story scene is a tall wrapper (e.g. 250vh) with a `position: sticky`
// inner panel — this computes 0..1 progress as the user scrolls through
// that tall wrapper, WITHOUT hijacking scroll (native scrolling the whole
// time; we're just reading position, not setting it). Per the accessibility
// requirement in the brief: under prefers-reduced-motion, progress is
// reported once as 1 (final/settled state) and never updates again —
// no continuous animation loop runs at all.

window.initScrollScene = function (sectionEl, onProgress) {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { onProgress(1, true); return function () {}; }

  function read() {
    return sectionEl.getBoundingClientRect();
  }

  // Every registered scene's write() used to run unconditionally on every
  // single scroll tick, regardless of whether the section was anywhere near
  // the viewport — found via a live rAF-tagged trace (see the 2026-07-28
  // Verification & Decision Record): scrolling only through scene-opening
  // (top of page) still fired scene-agent's (bottom of page) full progress
  // callback on every tick, at real, non-trivial cost. Fixed with a
  // visibility early-out, using the exact same rect the read phase already
  // computes (no new DOM read added): once a section is more than one full
  // viewport-height outside the visible area in either direction, `progress`
  // is provably pinned at exactly 0 (below) or 1 (above) for the entire
  // margin — Math.max(0,...)/Math.min(1,...) below already clamp it there —
  // so recomputing and re-calling onProgress every tick while deep in that
  // margin can only ever reproduce the value already reported. `lastReported`
  // starts null so the very first call, and the one call that settles the
  // scene to 0/1 the moment it first crosses into the margin, always goes
  // through — only genuinely redundant repeats of an already-settled value
  // are skipped. Scenes stay correct scrolling back and forth: re-entering
  // the margin band always falls through and reports the freshly computed
  // progress again.
  var lastReported = null;
  function write(rect) {
    var vh = window.innerHeight;
    var margin = vh;
    var farBelow = rect.top > vh + margin;
    var farAbove = rect.bottom < -margin;
    if ((farBelow && lastReported === 0) || (farAbove && lastReported === 1)) return;

    var total = rect.height - vh;
    var scrolled = -rect.top;
    var progress = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : (rect.top < vh ? 1 : 0);
    lastReported = progress;
    onProgress(progress, false);
  }

  // Routed through reveal.js's shared scroll-batch registry (all
  // registered reads run before any writes, across every module using it)
  // instead of each of up to 7 story-scenes running its own independent
  // scroll listener with its own interleaved read-then-write — found in
  // the pre-production audit's scroll-jank profile as one of the top
  // contributors. reveal.js loads before this file, so
  // registerScrollBatch is always available in practice; the fallback
  // below preserves the original per-instance-listener behavior if that
  // ever changes, so this function stays correct standalone too.
  if (window.registerScrollBatch) {
    return window.registerScrollBatch(read, write);
  }

  var ticking = false;
  function compute() { write(read()); ticking = false; }
  function onScroll() { if (!ticking) { requestAnimationFrame(compute); ticking = true; } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  compute();

  return function destroy() {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
};

// Smoothstep-style window: 1 inside [start,end], eased 0 outside, for
// crossfading between morph stages.
window.storyStageWeight = function (progress, start, end, fadeIn, fadeOut) {
  fadeIn = fadeIn != null ? fadeIn : 0.04;
  fadeOut = fadeOut != null ? fadeOut : 0.04;
  if (progress < start - fadeIn || progress > end + fadeOut) return 0;
  if (progress < start) return (progress - (start - fadeIn)) / fadeIn;
  if (progress > end) return 1 - (progress - end) / fadeOut;
  return 1;
};
