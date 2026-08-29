// scene-companion-intro.js — #companion-intro, "The Burden of the Infinite
// Project, Lifted." Promoted from a plain [data-reveal] fade-in section to
// a story-scene: visitors were flying straight through it with nothing to
// slow them down, so the line never landed. A big, rounded-corner image
// slider (no visible controls, same 16px-radius language as
// .showcase-figure) now holds the eye while four short lines of supporting
// copy crossfade in sync with it — driven by real scroll progress via
// window.initScrollScene (story-scroll.js), which only ever READS scroll
// position, never sets it (no scroll-jacking, per CLAUDE.md §2). Pixie
// (pixie-companion.js) is untouched by this file.
//
// Four slides <-> four text lines, same index. Slide crossfade uses a
// continuous per-frame "iris" clip-path (a growing/shrinking circle mask —
// the "cinematic transitions and image masks taking form" the brief asked
// for) driven by the same smoothstepped distance-from-stage weight
// scene-lifecycle.js already uses for its own photo crossfade, reused
// rather than reinvented. Text crossfade instead uses a binary is-active
// swap + CSS transition, same idiom cinematic-slider.js uses — text reads
// better as a clean two-state fade than as a continuously-interpolated
// mask, and it keeps the CSS transition duration constant regardless of
// scroll speed.

(function () {
  var section = document.getElementById('companion-intro');
  if (!section) return;
  var slides = Array.prototype.slice.call(section.querySelectorAll('.companion-slide img'));
  var lines = Array.prototype.slice.call(section.querySelectorAll('.companion-sub-line'));
  var stack = section.querySelector('.companion-sub-stack');
  var n = Math.min(slides.length, lines.length);
  if (n < 2) return;

  // Reserve stable height for the tallest line up front, same technique
  // cinematic-slider.js uses — lines go position:absolute below, which
  // would otherwise collapse the stack to 0 height and reflow the
  // companion row every time the active line's length changes.
  if (stack) {
    var maxHeight = 0;
    lines.forEach(function (line) { maxHeight = Math.max(maxHeight, line.offsetHeight); });
    stack.style.minHeight = maxHeight + 'px';
  }

  function render(progress) {
    var idxFloat = progress * (n - 1);
    for (var i = 0; i < n; i++) {
      var w = Math.max(0, 1 - Math.abs(i - idxFloat));
      w = w * w * (3 - 2 * w); // smoothstep — same curve scene-lifecycle.js uses for its frame-bg crossfade
      // circle() percentages resolve against the box's diagonal (CSS Shapes
      // spec), so 120% clears every corner regardless of aspect ratio —
      // confirmed via the spec math, not eyeballed (corner coverage only
      // needs ~71%). w*120 at w=0 is a fully-collapsed, invisible circle.
      slides[i].style.clipPath = 'circle(' + (w * 120).toFixed(1) + '% at 50% 50%)';
      slides[i].style.opacity = w > 0 ? '1' : '0';
      lines[i].classList.toggle('is-active', Math.abs(i - idxFloat) < 0.5);
    }
  }

  window.initScrollScene(section, function (progress) { render(progress); });
})();
