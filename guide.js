// guide.js — The Guide: a persistent floating panel anchored near the
// bottom of the viewport that translates each cinematic scene into plain
// understanding (per the Narrative Guide System brief) without ever
// covering the story itself. It never disappears; it updates.
//
// Content-change signal: reuses atmosphere.js's existing density
// IntersectionObserver (the one that already tracks "which section
// currently owns the most viewport space" to drive the World Layer's
// reveal) via the `maie:scenechange` event it dispatches, instead of
// registering a second observer over the same elements.
//
// Copy sources: every scene's headline/why-it-matters/Pixie line below is
// either the brief's own example copy (Chaos → scene-chaos-signal, Memory
// → scene-lifecycle, Agent → scene-agent) or freshly written to match the
// page's own existing captions/thesis lines (scene-opening, scene-frame,
// scene-universe, scene-human-hand, paths) — flagging that distinction
// here since the brief only gave three worked examples.

(function () {
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Story arc + per-scene copy ──
  var ARC = ['scene-opening', 'scene-frame', 'scene-universe', 'scene-human-hand',
    'scene-chaos-signal', 'scene-lifecycle', 'scene-agent', 'paths'];

  var CONTENT = {
    'scene-opening': {
      arc: 'Impulse',
      headline: 'Every story starts with a spark.',
      blurb: 'One creative impulse, waiting to become something more.',
      why: 'Every project MAIE will ever touch starts exactly here — with a person and an idea.',
      pixie: 'This next part is one of my favorites.',
    },
    'scene-frame': {
      arc: 'Frame',
      headline: 'One frame holds more than you\u2019d think.',
      blurb: 'Behind every clip sits a frame \u2014 and behind every frame, a quiet stack of metadata nobody has time to read.',
      why: 'Metadata is the difference between a clip you can search for and a clip you\u2019ll never find again.',
      pixie: 'Watch what happens when scattered footage begins organizing itself.',
    },
    'scene-universe': {
      arc: 'Universe',
      headline: 'Every project is built from the same primitives.',
      blurb: 'Frames, waveforms, faces, locations \u2014 the raw materials repeat, project after project.',
      why: 'Recognizing the same primitives across projects is what makes reuse possible.',
      pixie: 'Same building blocks, over and over. MAIE never forgets that.',
    },
    'scene-human-hand': {
      arc: 'Reflection',
      headline: 'Technology does not create meaning. People do.',
      blurb: 'The tools change. The judgment behind a good edit never does.',
      why: 'MAIE is built to support the eye and instinct only a person brings \u2014 not replace it.',
      pixie: 'This is the part where the story gets human again.',
    },
    'scene-chaos-signal': {
      arc: 'Chaos \u2192 Signal',
      headline: 'Creative work shouldn\u2019t begin with searching.',
      blurb: 'Today\u2019s production teams spend countless hours looking for footage, rebuilding workflows, and repeating work that was already solved.',
      why: 'Every hour spent searching is an hour not spent creating.',
      pixie: 'This is the part where most teams think the chaos is just... normal.',
    },
    'scene-lifecycle': {
      arc: 'Memory',
      headline: 'Imagine if every production remembered everything.',
      blurb: 'Instead of folders and filenames, every project becomes searchable by meaning, context, and intent.',
      why: 'Knowledge compounds instead of disappearing.',
      pixie: 'Nothing magical happened here. We just stopped asking people to remember what software could remember instead.',
    },
    'scene-agent': {
      arc: 'Agent',
      headline: 'Goals become executable plans.',
      blurb: 'Instead of switching between disconnected tools, MAIE builds a transparent workflow before any action begins.',
      why: 'The goal becomes the interface. Not the software.',
      pixie: 'Watch closely. Every step is visible before anything executes.',
    },
    'paths': {
      arc: 'Path',
      headline: 'Your work doesn\u2019t have to disappear again.',
      blurb: 'Every solved problem becomes reusable \u2014 for you, and for the exchange around you.',
      why: 'Creative work becomes dramatically more valuable when it\u2019s remembered.',
      pixie: 'Ready? This is where everything starts connecting.',
    },
  };

  // ── Build the panel DOM once ──
  var panel = document.createElement('aside');
  panel.className = 'guide-panel';
  panel.setAttribute('aria-label', 'Narrative guide');

  var toggle = document.createElement('button');
  toggle.className = 'guide-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'guide-body');
  toggle.innerHTML =
    '<span class="guide-toggle-arc" id="guide-arc-label"></span>' +
    '<span class="guide-toggle-headline" id="guide-headline-compact"></span>' +
    '<span class="guide-chevron" aria-hidden="true"></span>';
  panel.appendChild(toggle);

  // Mini Pixie — the real theme-responsive Pixie Companion engine
  // (pixie-companion.js, the same one driving the hero companion and
  // scene-agent), scaled down to badge size. It rests in the panel's
  // top-right corner, above the toggle, at all times; when the Guide
  // expands it relocates down into the pixie-row, docking to the left
  // of the "Pixie" label. reposition() below drives both the corner
  // rest position and the docked one purely from live DOM rects — the
  // docked target can't be a fixed offset, since guide-pixie-row's
  // position shifts with each scene's headline/blurb length. Parented
  // directly to the panel (not into .guide-body) so it's never clipped
  // by that element's overflow:hidden while relocating.
  var pixieAvatar = document.createElement('canvas');
  pixieAvatar.className = 'guide-pixie-avatar';
  pixieAvatar.setAttribute('aria-hidden', 'true');
  panel.appendChild(pixieAvatar);

  var body = document.createElement('div');
  body.className = 'guide-body';
  body.id = 'guide-body';
  body.setAttribute('aria-live', 'polite');
  body.innerHTML =
    '<div class="guide-region guide-scene">' +
      '<div class="guide-kicker">Scene</div>' +
      '<div class="guide-scene-headline" id="guide-headline"></div>' +
      '<div class="guide-scene-blurb" id="guide-blurb"></div>' +
    '</div>' +
    '<div class="guide-region guide-arc-row" id="guide-arc-row"></div>' +
    '<div class="guide-region guide-why">' +
      '<div class="guide-kicker">Why it matters</div>' +
      '<div class="guide-why-text" id="guide-why"></div>' +
    '</div>' +
    '<div class="guide-region guide-pixie-row">' +
      // Invisible spacer with the same footprint as the docked avatar —
      // reserves its place in the flex row so "Pixie" shifts right to
      // make room, without the real (absolutely-positioned) canvas ever
      // actually living in the flow here.
      '<span class="guide-pixie-avatar-slot" id="guide-pixie-slot" aria-hidden="true"></span>' +
      '<div class="guide-pixie-text"><span class="guide-pixie-name">Pixie</span> <span id="guide-pixie"></span></div>' +
    '</div>';
  panel.appendChild(body);

  var arcRow = body.querySelector('#guide-arc-row');
  ARC.forEach(function (id) {
    var stage = document.createElement('span');
    stage.className = 'guide-arc-stage';
    stage.dataset.section = id;
    stage.textContent = CONTENT[id].arc;
    arcRow.appendChild(stage);
  });

  document.body.appendChild(panel);

  // ── Mini Pixie: engine init + live-measured docking ──
  // CORNER_SIZE is the on-screen diameter at rest (80px, within the 75-
  // 100px range the corner badge is meant to stay inside). initPixieCompanion
  // renders at cssW/H = size * 2.5, so size is derived from that, not passed
  // as a raw pixel value.
  var CORNER_TOP = -30, CORNER_RIGHT = 10, CORNER_SIZE = 80;
  // Docked (expanded-panel) Pixie is rendered 80% larger than its
  // guide-pixie-slot footprint. The slot itself keeps reserving the
  // original (unscaled) space in the flex row — see reposition() below,
  // which grows the canvas symmetrically around the slot's own center
  // rather than resizing the slot, so guide-pixie-text never shifts.
  // Capped at 2x: the canvas's native raster is rendered once at init
  // from CORNER_SIZE (80px), so any docked size above that upscales the
  // existing bitmap and goes soft/blurry. 1.8x of the ~40px slot lands
  // at ~72px — comfortably under that ceiling, so it stays crisp.
  var DOCKED_SCALE = 1.8;
  var pixieSlot = body.querySelector('#guide-pixie-slot');
  var pixieHandle = window.initPixieCompanion(pixieAvatar, {
    size: CORNER_SIZE / 2.5, mode: 'ambient', phase: 'idle',
    archetype: 'archivist', temperament: 'idle',
    theme: window.getPixieThemeColors(),
  });
  // Canvas-rendered Pixie can't react to a CSS custom property change on its
  // own — same live-update wiring the other two Pixie instances on this page
  // already use for theme.js's toggle.
  document.addEventListener('maie:themechange', function () {
    if (pixieHandle && pixieHandle.update) pixieHandle.update({ theme: window.getPixieThemeColors() });
  });

  // This canvas is the one Pixie instance on the page that `pixie-companion.
  // js`'s own IntersectionObserver-based pause can never help: `.guide-panel`
  // is `position: fixed`, so it's always "intersecting" the viewport by
  // construction, at any scroll position, for the entire visit (see the
  // Verification & Decision Record, Q4). Tied instead to the Guide's own
  // expanded/collapsed lifecycle via the explicit pause()/resume() lifecycle
  // added to pixie-companion.js for exactly this case: full animation only
  // while the panel is actually expanded (the one state where a visitor is
  // looking at it), a held static frame the rest of the time. Starts paused
  // — the panel's default state is collapsed.
  if (pixieHandle && pixieHandle.pause) pixieHandle.pause();

  // Only ever sets left/top/width/height (never `right`) so the CSS
  // transition between the corner rest position and the docked one can
  // interpolate both endpoints as plain numbers — animating to/from `right:
  // auto` doesn't tween. The docked target is read from guide-pixie-slot's
  // live rect rather than hardcoded, since guide-pixie-row's position varies
  // with each scene's headline/blurb length.
  function reposition(animate) {
    var panelRect = panel.getBoundingClientRect();
    var target;
    if (panel.classList.contains('is-expanded')) {
      var slotRect = pixieSlot.getBoundingClientRect();
      var dockedW = slotRect.width * DOCKED_SCALE, dockedH = slotRect.height * DOCKED_SCALE;
      target = {
        // Centered over the slot's own center so the extra size grows
        // outward evenly, instead of pushing into guide-pixie-text — the
        // slot's reserved footprint (and the text's position) stays
        // exactly as if the avatar were still slot-sized.
        left: slotRect.left - panelRect.left - (dockedW - slotRect.width) / 2,
        top: slotRect.top - panelRect.top - (dockedH - slotRect.height) / 2,
        width: dockedW, height: dockedH,
      };
    } else {
      target = {
        left: panelRect.width - CORNER_RIGHT - CORNER_SIZE, top: CORNER_TOP,
        width: CORNER_SIZE, height: CORNER_SIZE,
      };
    }
    if (!animate) pixieAvatar.style.transition = 'none';
    pixieAvatar.style.left = target.left + 'px';
    pixieAvatar.style.top = target.top + 'px';
    pixieAvatar.style.width = target.width + 'px';
    pixieAvatar.style.height = target.height + 'px';
    if (!animate) {
      void pixieAvatar.offsetWidth; // force layout so the jump above lands before transitions come back on
      pixieAvatar.style.transition = '';
    }
  }
  reposition(false); // land at the resting corner spot with no animation on load

  var repositionResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(repositionResizeTimer);
    repositionResizeTimer = setTimeout(function () { reposition(true); }, 200);
  });

  // ── Expand/collapse ──
  function setExpanded(expanded) {
    panel.classList.toggle('is-expanded', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    reposition(true);
    if (pixieHandle) {
      if (expanded) { if (pixieHandle.resume) pixieHandle.resume(); }
      else if (pixieHandle.pause) { pixieHandle.pause(); }
    }
  }
  toggle.addEventListener('click', function () { setExpanded(!panel.classList.contains('is-expanded')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('is-expanded')) setExpanded(false);
  });

  // ── Content updates, driven by atmosphere.js's scenechange event ──
  var headlineCompact = document.getElementById('guide-headline-compact');
  var arcLabel = document.getElementById('guide-arc-label');
  var headline = document.getElementById('guide-headline');
  var blurb = document.getElementById('guide-blurb');
  var why = document.getElementById('guide-why');
  var pixieText = document.getElementById('guide-pixie');

  function applyContent(id) {
    var c = CONTENT[id];
    if (!c) return; // sections not part of the story arc (trust, companion-intro) leave the Guide showing whatever it last had
    arcLabel.textContent = c.arc;
    headlineCompact.textContent = c.headline;
    headline.textContent = c.headline;
    blurb.textContent = c.blurb;
    why.textContent = c.why;
    pixieText.textContent = '\u201C' + c.pixie + '\u201D';
    Array.prototype.forEach.call(arcRow.children, function (stage) {
      stage.classList.toggle('is-current', stage.dataset.section === id);
    });
    // Headline/blurb length varies per scene, which can shift guide-pixie-row's
    // vertical position while expanded — re-dock to match.
    if (panel.classList.contains('is-expanded')) reposition(true);
  }

  document.addEventListener('maie:scenechange', function (e) {
    applyContent(e.detail.section.id);
  });
  // Prime initial content immediately (scroll position at load, usually
  // scene-opening) rather than waiting for the first observer callback.
  if (window.MaieAtmosphere && window.MaieAtmosphere.currentSection) {
    applyContent(window.MaieAtmosphere.currentSection.id);
  } else {
    applyContent('scene-opening');
  }

  if (reducedMotion) panel.classList.add('guide-reduced-motion');
})();