// scene-maie-moment.js — Section 6: "Everything Connects"
// Nodes drift into alignment along the actual MAIE signal-line path as
// it strokes in with scroll progress — the same path used in the nav
// logo, not a lookalike. Node start positions are captured from
// window.getChaosChipPositions() (exposed by scene-chaos.js / Section
// 5) the moment this scene first scrolls into view — so the nodes here
// are the same chaotic elements from Section 5, not a fresh random
// scatter. Falls back to a random scatter if Section 5's engine isn't
// present for some reason, so this scene still works standalone.
//
// REFACTOR: nodes used to settle at full opacity and stay parked on the
// path indefinitely — a cluster of dots permanently sitting on the mark
// the real MAIE logo doesn't have. Now they fade out as they actually
// arrive (not before — they stay fully visible through most of the
// convergence, only dissolving in the final stretch), and the path +
// accent dot get a brief ignition flash right as the last of them lands,
// reusing the same flash/glow language scene-opening.js's one-shot intro
// already established, so "the mark ignites" reads as one consistent
// visual idea across the page rather than a new effect invented here.

(function () {
  var section = document.getElementById('scene-maie-moment');
  if (!section) return;
  var svg = document.getElementById('signal-svg');
  var path = document.getElementById('signal-path');
  var accentDot = document.getElementById('signal-accent-dot');
  var accentRing = document.getElementById('signal-accent-ring');
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

  function pathThemeColor(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  function render(progress, isStatic) {
    if (!nodes) return;
    var eased = ease(progress);
    path.style.strokeDashoffset = len * (1 - eased);

    var settle = eased; // 0 = fully chaotic, 1 = fully on-path — position only now

    // Nodes stay fully visible through most of the convergence (so the
    // "aligning" motion itself reads clearly), then dissolve in the final
    // stretch as they actually arrive — full opacity through progress
    // 0.70, fading to 0 by 0.90, well before this scene finishes.
    var nodeOpacity = window.storyStageWeight(progress, 0.0, 0.70, 0.0, 0.20);
    nodes.forEach(function (n) {
      var wob = isStatic ? 0 : Math.sin(clock * n.speed + n.phase) * (1 - settle) * 4;
      var x = n.startX + (n.targetX - n.startX) * settle + wob;
      var y = n.startY + (n.targetY - n.startY) * settle + wob * 0.6;
      n.el.setAttribute('cx', x);
      n.el.setAttribute('cy', y);
      n.el.setAttribute('opacity', nodeOpacity);
    });

    // Ignition flash — a brief brightness pulse on the mark itself, timed
    // to land just as the last nodes finish dissolving (peaks 0.82-0.86,
    // nodes are at 0 opacity by 0.90), so "arrival" reads as a distinct
    // moment rather than a passive settle. Kept deliberately subtle — an
    // earlier pass over-scaled this into a solid glowing orb that dwarfed
    // the mark; a flash should read as emphasis, not eclipse it.
    var flashW = window.storyStageWeight(progress, 0.82, 0.86, 0.06, 0.10);
    if (flashW > 0.002) {
      var accentRgb = hexToRgb(pathThemeColor('--accent', '#FFD166'));
      path.style.filter = 'drop-shadow(0 0 ' + (1.5 + flashW * 2.5).toFixed(1) + 'px rgba(' + accentRgb + ',' + (flashW * 0.65).toFixed(2) + '))';
      path.style.strokeWidth = (1.6 + flashW * 0.7).toFixed(2);
    } else {
      path.style.filter = '';
      path.style.strokeWidth = '';
    }

    // Dot stays fixed at the logo's actual r="3" — never inflates into a
    // disc. The ring (matching the nav logo's own outline ring exactly:
    // resting r=6.5, opacity 0.4) carries the pulse instead, expanding and
    // brightening briefly during the flash, then settling to the same
    // static ring the nav mark has.
    if (accentDot) {
      var dotW = window.storyStageWeight(progress, 0.90, 1.0, 0.04, 0);
      accentDot.setAttribute('opacity', Math.max(dotW, flashW));
    }
    if (accentRing) {
      var ringSteady = window.storyStageWeight(progress, 0.90, 1.0, 0.04, 0);
      accentRing.setAttribute('opacity', Math.max(ringSteady * 0.4, flashW * 0.85).toFixed(2));
      accentRing.setAttribute('r', (6.5 + flashW * 2.2).toFixed(2));
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
