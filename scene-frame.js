// scene-frame.js — Section 2: "One Moment"
// A single photo, deconstructed. Rather than actually slicing and
// translating image fragments (expensive to get pixel-accurate and
// fragile across aspect ratios), four thin bars overlaid on the photo
// grow from a hairline into a metadata callout as scroll progresses —
// same "the frame cracks open to reveal what's underneath" read, far
// simpler to maintain. The vertical line + dots on the left is the
// same Signal-line device as scene-opening.js/scene-chaos-signal.js,
// reused deliberately (see DESIGN-DEV-GUIDE.md's visual metaphors).

(function () {
  var section = document.getElementById('scene-frame');
  if (!section) return;

  var fractures = [0, 1, 2, 3].map(function (i) { return document.getElementById('frame-fracture-' + i); });
  var caption = document.getElementById('frame-caption');
  var signalLine = document.getElementById('frame-signal-line');
  var dots = Array.prototype.slice.call(section.querySelectorAll('.frame-signal-dot'));
  var waveEl = fractures[2] ? fractures[2].querySelector('.frame-wave') : null;

  var MAX_HEIGHT = 46; // px, fully-open fracture bar

  // Deterministic bar heights for the "transcribed audio" fracture —
  // same reasoning as scene-opening.js's waveform: stable across
  // repaints, not re-randomized every frame. The 8 <span> placeholders
  // already exist in the HTML; just size them here.
  if (waveEl) {
    var spans = waveEl.querySelectorAll('span');
    spans.forEach(function (s, i) {
      s.style.height = (30 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 65) + '%';
    });
  }

  // Each fracture opens across its own window of the scroll range,
  // staggered so they reveal one at a time rather than all at once.
  var windows = [
    { start: 0.12, end: 0.32 },
    { start: 0.32, end: 0.52 },
    { start: 0.52, end: 0.72 },
    { start: 0.72, end: 0.94 },
  ];

  window.initScrollScene(section, function (progress) {
    var totalLineWeight = window.storyStageWeight(progress, 0.05, 1.0, 0.05, 0);
    if (signalLine) signalLine.setAttribute('stroke-dasharray', '100');
    if (signalLine) signalLine.setAttribute('stroke-dashoffset', 100 - totalLineWeight * 100);

    fractures.forEach(function (el, i) {
      if (!el) return;
      var win = windows[i];
      var w = window.storyStageWeight(progress, win.start, win.end, 0.04, 0);
      el.style.height = (2 + w * MAX_HEIGHT) + 'px';
      var tag = el.querySelector('.frame-tag');
      if (tag) tag.style.opacity = w;
      if (waveEl && el === fractures[2]) waveEl.style.opacity = w;
      if (dots[i]) dots[i].style.opacity = w;
    });

    if (caption) caption.style.opacity = window.storyStageWeight(progress, 0.0, 0.15, 0.03, 0.08);
  });
})();
