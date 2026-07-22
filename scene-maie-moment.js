// scene-maie-moment.js — Section 6: "Everything Connects"
// Nodes drift into alignment along the actual MAIE signal-line path as
// it strokes in with scroll progress — the same path used in the nav
// logo, not a lookalike. Node start positions are captured from
// window.getChaosChipPositions() (exposed by scene-chaos.js / Section
// 5) the moment this scene first scrolls into view — so the nodes here
// are the same chaotic elements from Section 5, not a fresh random
// scatter. Falls back to a random scatter if Section 5's engine isn't
// present for some reason, so this scene still works standalone.

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

  // Section 5's chip field is 0-100% in both axes; this scene's viewBox
  // is 0-92 x 0-56. Direct percent-to-unit mapping preserves relative
  // position without needing the two fields to share physical pixel
  // dimensions.
  var VB_W = 92, VB_H = 56;

  var nodes = null; // built lazily, on first scroll-into-view -- see buildNodes()

  function buildNodes() {
    var positions;
    if (typeof window.getChaosChipPositions === 'function') {
      positions = window.getChaosChipPositions().map(function (p) {
        return { x: (p.x / 100) * VB_W, y: (p.y / 100) * VB_H };
      });
    } else {
      // Fallback: same arbitrary-scatter behavior as before Section 5 existed.
      positions = [];
      for (var j = 0; j < 22; j++) {
        positions.push({ x: -10 + Math.random() * (VB_W + 20), y: -8 + Math.random() * (VB_H + 16) });
      }
    }

    var count = positions.length;
    nodes = positions.map(function (start, i) {
      var t = count > 1 ? i / (count - 1) : 0;
      var target = path.getPointAtLength(t * len);
      var el = document.createElementNS(NS, 'circle');
      el.setAttribute('r', 1.3);
      el.setAttribute('class', 'chaos-node');
      svg.insertBefore(el, path); // behind the path/dot, ahead of background
      return {
        el: el,
        targetX: target.x, targetY: target.y,
        startX: start.x, startY: start.y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
      };
    });
  }

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  var clock = 0;

  function render(progress, isStatic) {
    if (!nodes) return;
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
    if (!nodes) buildNodes(); // capture the handoff exactly once, at first entry
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
