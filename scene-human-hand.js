// scene-human-hand.js — Section 4: "The Human Hand"
// A slow-scrolling sequence of documentary photographs — the brief's own
// explicit list (a hand holding a camera, someone editing at 2am, a
// filmmaker reviewing a frame, a designer adjusting a curve, a producer
// organizing files, a creative team debating a shot) made literal, one
// photo per scroll beat, crossfading into the next. Bookended by the
// brief's own thesis line, split across the opening and closing beats:
// "Technology does not create meaning." / "People do."
//
// Deliberately the slowest, quietest scene on the page (Reflection mode
// per the brief) — no idle rAF loop, no wobble/particle motion. Pure
// scroll-driven crossfade, same storyStageWeight idiom every other scene
// uses, just with photographs instead of graphics.
//
// Real documentary/editorial photography (colorist grading suites, a
// story-structure card wall, a music production session) — this section
// was blocked until this photography was sourced; the previous 10 stock
// photos on hand were portraits/nature/product shots, not "creator at
// work" (see DESIGN-DEV-GUIDE.md).

(function () {
  var section = document.getElementById('scene-human-hand');
  if (!section) return;
  var photos = Array.prototype.slice.call(section.querySelectorAll('.hand-photo'));
  var caption = document.getElementById('hand-caption');
  var thesisBefore = document.getElementById('hand-thesis-before');
  var thesisAfter = document.getElementById('hand-thesis-after');
  if (!photos.length) return;

  var CAPTIONS = [
    'A hand, holding the shot before it’s taken.',
    'Still awake. Still cutting.',
    'One frame, checked, and checked again.',
    'A sound, built by hand.',
    'A curve, adjusted by one degree.',
    'A story, still finding its order.',
    'Two people. One shot. A hundred small decisions.',
  ];

  // Photo stages spread evenly across the middle of the scroll range; the
  // thesis bookends take the first/last slivers. The last photo's window
  // extends to progress 1.0 with no fade-out (same "final beat holds"
  // convention scene-opening.js's data-fields stage and scene-chaos-
  // signal.js's resolved message chips use) — otherwise a visitor under
  // prefers-reduced-motion, who only ever sees the single settled frame
  // at progress=1, would see a blank frame with no photo at all.
  var PHOTO_START = 0.08, PHOTO_END = 0.92;
  var n = photos.length;
  var span = (PHOTO_END - PHOTO_START) / n;
  var FADE = Math.min(0.03, span * 0.35);
  var STAGES = photos.map(function (el, i) {
    var isLast = i === n - 1;
    return {
      start: PHOTO_START + i * span,
      end: isLast ? 1.0 : PHOTO_START + (i + 1) * span,
      fadeOut: isLast ? 0 : FADE,
    };
  });

  function render(progress) {
    // Fully faded out (weight 0) by progress 0.045 — before photo[0]'s own
    // fade-in ramp begins at PHOTO_START - FADE = 0.05 (see STAGES above).
    // Previously ended its fade-out at 0.10, well past photo[0] reaching
    // full opacity at 0.08 — the two windows overlapped for ~0.03 of
    // scroll distance, during which the thesis text sat directly on top
    // of the photo with no scrim (only a text-shadow), measured at 3.64:1
    // contrast against photo[0] specifically (found in the pre-production
    // audit; confirmed live via screenshot at progress 0.08). This clean
    // handoff (thesis out by 0.045, photo starting to appear at 0.05)
    // removes the overlap entirely instead of just shortening it.
    var thesisBeforeW = window.storyStageWeight(progress, 0.0, 0.025, 0.0, 0.02);
    var thesisAfterW = window.storyStageWeight(progress, 0.96, 1.0, 0.04, 0.0);
    if (thesisBefore) thesisBefore.style.opacity = thesisBeforeW;
    if (thesisAfter) thesisAfter.style.opacity = thesisAfterW;

    var topWeight = 0, topIndex = -1;
    photos.forEach(function (el, i) {
      var s = STAGES[i];
      var w = window.storyStageWeight(progress, s.start, s.end, FADE, s.fadeOut);
      el.style.opacity = w.toFixed(3);
      // A very subtle, slow zoom tied directly to the same crossfade
      // weight already being computed — no separate animation/class
      // system, consistent with how every other scroll-driven visual on
      // this page is a pure function of progress.
      el.style.transform = 'scale(' + (1 + w * 0.035).toFixed(3) + ')';
      if (w > topWeight) { topWeight = w; topIndex = i; }
    });

    if (caption) {
      caption.textContent = topIndex >= 0 ? CAPTIONS[topIndex] : '';
      // Stays out of the way during the thesis bookends so it doesn't
      // visually collide with the large centered statement.
      caption.style.opacity = (topWeight * (1 - Math.max(thesisBeforeW, thesisAfterW))).toFixed(3);
    }
  }

  var lastProgress = 0;
  window.initScrollScene(section, function (progress) {
    lastProgress = progress;
    render(progress);
  });
})();
