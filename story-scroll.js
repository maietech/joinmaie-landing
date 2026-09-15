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

// Guarded stage-weight — protects a narrow reveal window (e.g. a caption
// visible for only 15-20% of a scene's scroll range) from being skipped
// entirely by one large scroll delta (a fast trackpad fling, a held Page
// Down/spacebar, high OS-level scroll acceleration). This never touches
// scroll position — the hard rule this file is built on (see the header
// comment above) — it only changes what OPACITY a given tick reports, by
// noticing when that tick's raw scroll jump cleared a reveal window's
// entire span (fade margins included) without either the previous or the
// current progress ever landing inside it. In that case it reports a full
// reveal for this one tick instead of storyStageWeight's true (usually 0)
// value at the landing point — the moment genuinely was passed through,
// even though no sample point was inside it to say so. The next tick
// recomputes the real value normally, so this never gets stuck mid-window;
// pairing the caller's element with a CSS `transition: opacity` (see
// styles.css's .scene-caption/.lifecycle-caption/.agent-caption/.frame-tag)
// is what turns this one forced tick into an actual eased hold instead of
// a reveal-then-instant-vanish on the very next tick.
//
// `key` is a caller-chosen id (e.g. an element id) so this can track
// several independent call sites through one shared Map instead of each
// scene file rolling its own prevProgress variable — small, local, no new
// scheduler; reuses this file's existing per-tick call shape.
var guardState = new Map();
window.storyStageWeightGuarded = function (key, progress, start, end, fadeIn, fadeOut) {
  var raw = window.storyStageWeight(progress, start, end, fadeIn, fadeOut);
  var prev = guardState.get(key);
  guardState.set(key, progress);
  if (prev == null) return raw;
  var lo = Math.min(prev, progress), hi = Math.max(prev, progress);
  var winStart = start - (fadeIn != null ? fadeIn : 0.04);
  var winEnd = end + (fadeOut != null ? fadeOut : 0.04);
  if (lo <= winStart && hi >= winEnd) return 1;
  return raw;
};
