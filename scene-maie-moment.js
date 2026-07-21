// scene-maie-moment.js — Section 6: "Everything Connects"
// A set of scattered nodes (standing in for the fragmented-files chaos
// that would live in Section 5, not built yet) drift into alignment
// along the actual MAIE signal-line path as it strokes in with scroll
// progress — the same path used in the nav logo, not a lookalike.

(function () {
  var section = document.getElementById('scene-maie-moment');
  if (!section) return;
  var svg = document.getElementById('signal-svg');
  var path = document.getElementById('signal-path');
  var accentDot = document.getElementById('signal-accent-dot');
  var capBefore = document.getElementById('scene-maie-caption-before');
  var capAfter = document.getElementById('scene-maie-caption-after');
  if (!svg || !path) return;

  var NS = 'http://www.w3.org/2000/svg';
  var len = path.getTotalLength();
  path.style.strokeDasharray = len;

  var NODE_COUNT = 22;
  var nodes = [];
  for (var i = 0; i < NODE_COUNT; i++) {
    var t = i / (NODE_COUNT - 1);
    var target = path.getPointAtLength(t * len);
    var el = document.createElementNS(NS, 'circle');
    el.setAttribute('r', 1.3);
    el.setAttribute('class', 'chaos-node');
    svg.insertBefore(el, path); // behind the path/dot, ahead of background
    nodes.push({
      el: el,
      targetX: target.x, targetY: target.y,
      startX: -10 + Math.random() * 112, // scattered beyond the viewBox (0..92), overflow:visible shows the spread
      startY: -8 + Math.random() * 72,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
    });
  }

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  var clock = 0;

  function render(progress, isStatic) {
    var eased = ease(progress);
    path.style.strokeDashoffset = len * (1 - eased);

    var settle = eased; // 0 = fully chaotic, 1 = fully on-path
    nodes.forEach(function (n) {
      var wob = isStatic ? 0 : Math.sin(clock * n.speed + n.phase) * (1 - settle) * 4;
      var x = n.startX + (n.targetX - n.startX) * settle + wob;
      var y = n.startY + (n.targetY - n.startY) * settle + wob * 0.6;
      n.el.setAttribute('cx', x);
      n.el.setAttribute('cy', y);
      n.el.setAttribute('opacity', 0.35 + settle * 0.65);
    });

    if (accentDot) {
      var dotW = window.storyStageWeight(progress, 0.90, 1.0, 0.04, 0);
      accentDot.setAttribute('opacity', dotW);
      accentDot.setAttribute('r', 3 + dotW * 3.5);
    }
    if (capBefore) capBefore.style.opacity = window.storyStageWeight(progress, 0.0, 0.28, 0.02, 0.10);
    if (capAfter) capAfter.style.opacity = window.storyStageWeight(progress, 0.78, 1.0, 0.10, 0);
  }

  var lastProgress = 0;
  window.initScrollScene(section, function (progress, staticFrame) {
    lastProgress = progress;
    render(progress, staticFrame);
  });

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    (function loop() {
      clock += 0.02;
      render(lastProgress, false);
      requestAnimationFrame(loop);
    })();
  }
})();
