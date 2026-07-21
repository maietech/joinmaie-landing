// scene-chaos.js — Section 5: "The Chaos of Creation"
// DOM chips (not canvas — hover hit-testing is trivial with real
// elements) representing fragmented files, disconnected cloud folders,
// and chat alerts, drifting in opposing directions to create deliberate
// visual overwhelm. Hover perturbs a chip's drift and surfaces a red
// warning label. Feeds directly into scene-maie-moment.js next, which
// currently uses arbitrary scatter positions — this is the real chaos
// that section should eventually inherit its starting state from.

(function () {
  var section = document.getElementById('scene-chaos');
  if (!section) return;
  var field = document.getElementById('chaos-field');
  var caption = document.getElementById('chaos-caption');
  if (!field) return;

  var CHIPS = [
    { type: 'file', label: 'v1_final_FINAL.mov' },
    { type: 'file', label: 'footage_USE_THIS.mp4' },
    { type: 'file', label: 'old_cut_DONT_DELETE.mov' },
    { type: 'file', label: 'IMG_0442.CR2' },
    { type: 'file', label: 'Untitled_23.wav' },
    { type: 'file', label: 'sync_conflict.docx' },
    { type: 'window', label: 'Drive · Shared with 4' },
    { type: 'window', label: 'iCloud — sync error' },
    { type: 'window', label: 'Dropbox — 2 conflicts' },
    { type: 'alert', label: '💬 3 unread mentions' },
    { type: 'alert', label: '⚠ Storage almost full' },
    { type: 'file', label: 'export_v9(2)(1).mp4' },
    { type: 'window', label: 'Local Bin — untitled' },
    { type: 'file', label: 'audio_MIX_v4.wav' },
  ];
  var WARNINGS = ['Duplicate Asset Found', 'Missing Reference'];

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chips = [];

  CHIPS.forEach(function (def, i) {
    var el = document.createElement('div');
    el.className = 'chaos-chip chaos-chip--' + def.type;
    el.textContent = def.label;

    var warn = document.createElement('div');
    warn.className = 'chaos-warn';
    warn.textContent = WARNINGS[i % WARNINGS.length];
    el.appendChild(warn);

    field.appendChild(el);

    var chip = {
      el: el,
      x: Math.random() * 100, y: Math.random() * 100,      // % of field
      vx: (Math.random() - 0.5) * (reducedMotion ? 0 : 0.045),
      vy: (Math.random() - 0.5) * (reducedMotion ? 0 : 0.045),
      rot: (Math.random() - 0.5) * 14,
      hovered: false,
    };
    el.style.left = chip.x + '%';
    el.style.top = chip.y + '%';
    el.style.transform = 'translate(-50%, -50%) rotate(' + chip.rot + 'deg)';

    el.addEventListener('mouseenter', function () {
      chip.hovered = true;
      chip.vx *= -1.8; chip.vy *= -1.8; // "drift apart" on hover
    });
    el.addEventListener('mouseleave', function () { chip.hovered = false; });

    chips.push(chip);
  });

  function step() {
    chips.forEach(function (c) {
      c.x += c.vx; c.y += c.vy;
      // Wrap around so density stays constant regardless of how long
      // the section stays in view.
      if (c.x < -8) c.x = 108; if (c.x > 108) c.x = -8;
      if (c.y < -8) c.y = 108; if (c.y > 108) c.y = -8;
      c.el.style.left = c.x + '%';
      c.el.style.top = c.y + '%';
      c.el.classList.toggle('is-warning', c.hovered);
    });
  }

  if (!reducedMotion) {
    (function loop() { step(); requestAnimationFrame(loop); })();
  }

  window.initScrollScene(section, function (progress, isStatic) {
    if (caption) caption.style.opacity = window.storyStageWeight(progress, 0.10, 0.55, 0.08, 0.15);
    // Density/overwhelm increases slightly deeper into the section —
    // more chips become visible rather than the field slowing down,
    // since Section 5's role is escalating chaos; Section 6 owns the calm.
    field.style.setProperty('--chaos-density', 0.5 + progress * 0.5);
  });
})();
