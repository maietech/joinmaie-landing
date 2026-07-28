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
      '<div class="guide-pixie-avatar" aria-hidden="true">' +
        '<svg viewBox="0 0 40 40"><path d="M4 20 L9 12 L13 28 L18 8 L22 24 C25 14 28 14 28 20 C28 26 32 26 34 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</div>' +
      '<div class="guide-pixie-text" id="guide-pixie"></div>' +
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

  // ── Expand/collapse ──
  function setExpanded(expanded) {
    panel.classList.toggle('is-expanded', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    if (expanded) {
      // Pixie "pops up from below the deck" only when the visitor actually
      // opens the Guide — presence stays occasional/special, not persistent,
      // per the brief.
      requestAnimationFrame(function () { panel.classList.add('guide-pixie-visit'); });
    } else {
      panel.classList.remove('guide-pixie-visit');
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
