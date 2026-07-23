// scene-lifecycle.js — Section 7: "The Media Lifecycle" (8 stages)
// A horizontal filmstrip whose position is a function of vertical scroll
// progress (translateX only) — the visitor never actually scrolls
// sideways, and native vertical scroll/momentum stays untouched.
//
// Each frame also carries a reference photo as a decorative backdrop
// (.lifecycle-frame-bg) that crossfades in as the frame nears center screen
// and back out as it scrolls away — see the per-frame weight in render()
// below and the matching CSS in styles.css. Originally text/UI only, no
// asset dependency (per the dev guide); photos added after, curated against
// the same on-brand bar as Section 4's documentary photography (see
// DESIGN-DEV-GUIDE.md §17 — no wealth/lifestyle mood boards, no off-topic
// crafts, no human-less workspaces).

(function () {
  var section = document.getElementById('scene-lifecycle');
  if (!section) return;
  var track = document.getElementById('lifecycle-track');
  var rail = document.getElementById('lifecycle-rail');
  var caption = document.getElementById('lifecycle-caption');
  if (!track || !rail) return;

  var STAGES = [
    { title: 'Create', desc: 'Idea becomes capture — the first frame, take, or recording lands in the project.', metric: 'stage_status: captured', img: 'media/made-by-mostafa_meraji-photographer-4882729_1920.jpg' },
    { title: 'Organize', desc: 'Ingestion sorts and structures everything automatically, no manual folder work.', metric: 'stage_status: structured', img: 'media/made-by-fukajaz-31718971.jpg' },
    { title: 'Understand', desc: 'Scene, object, and visual analysis reads what is actually in the footage.', metric: 'stage_status: analyzed', img: 'media/made-by-director-chenchi-2159627038-36181988.jpg' },
    { title: 'Connect', desc: 'Related assets, people, and projects are mapped into a relational graph.', metric: 'stage_status: linked', img: 'media/made-by-ron-lach-8102691.jpg' },
    { title: 'Transform', desc: 'Processing and enhancement reshape the raw material into what it needs to be.', metric: 'stage_status: processed', img: 'media/made-by-ottawagraphics-artist-4622221_1920.jpg' },
    { title: 'Collaborate', desc: 'Human and agent work the same project together, side by side.', metric: 'stage_status: co-authored', img: 'media/made-by-micahways-10499056.jpg' },
    { title: 'Prove', desc: 'Authenticity and provenance are tracked from the very first frame onward.', metric: 'stage_status: verified', img: 'media/latif_photo88-hand-10123021_1920.jpg' },
    { title: 'Share', desc: 'The finished work moves out into the wider creative ecosystem.', metric: 'stage_status: distributed', img: 'media/made-by-cord-allman-852631891-29216191.jpg' },
  ];

  STAGES.forEach(function (s, i) {
    var frame = document.createElement('div');
    frame.className = 'lifecycle-frame';
    frame.dataset.stage = i;
    var num = String(i + 1).length < 2 ? '0' + (i + 1) : String(i + 1);
    frame.innerHTML =
      '<img class="lifecycle-frame-bg" src="' + s.img + '" alt="" aria-hidden="true" loading="lazy">' +
      '<div class="lifecycle-frame-scrim"></div>' +
      '<div class="lifecycle-frame-num">' + num + '</div>' +
      '<div class="lifecycle-frame-title">' + s.title + '</div>' +
      '<p class="lifecycle-frame-desc">' + s.desc + '</p>' +
      '<div class="lifecycle-frame-metric">' + s.metric + '</div>';
    track.appendChild(frame);

    var dot = document.createElement('span');
    dot.className = 'lifecycle-rail-dot';
    rail.appendChild(dot);
  });

  var frames = Array.prototype.slice.call(track.querySelectorAll('.lifecycle-frame'));
  var dots = Array.prototype.slice.call(rail.querySelectorAll('.lifecycle-rail-dot'));
  var bgs = frames.map(function (f) { return f.querySelector('.lifecycle-frame-bg'); });
  var scrims = frames.map(function (f) { return f.querySelector('.lifecycle-frame-scrim'); });
  var windowEl = track.parentElement;

  // frames[0].getBoundingClientRect() and windowEl.clientWidth are both
  // layout-forcing reads that were happening on every single frame here —
  // found as a top-5 contributor in the pre-production audit's scroll-jank
  // profile. Neither actually changes except on resize (frame width is
  // fixed by CSS, not by scroll position), so both are cached via
  // reveal.js's shared scroll-batch registry (updated once per scroll/
  // resize tick, read phase before any writes) instead of read fresh by
  // render() every frame.
  var cachedFrameW = 320, cachedWindowW = 0;
  if (window.registerScrollBatch) {
    window.registerScrollBatch(
      function () {
        return {
          frameW: frames[0] ? frames[0].getBoundingClientRect().width : 320,
          windowW: windowEl.clientWidth || 0,
        };
      },
      function (r) { cachedFrameW = r.frameW; cachedWindowW = r.windowW; }
    );
  }

  function render(progress) {
    var n = STAGES.length;
    var idxFloat = progress * (n - 1);
    var activeIdx = Math.round(idxFloat);

    var frameW = cachedFrameW;
    var gap = 28;
    var centerOffset = (cachedWindowW - frameW) / 2;
    var trackX = centerOffset - idxFloat * (frameW + gap);
    track.style.transform = 'translateX(' + trackX.toFixed(1) + 'px)';

    frames.forEach(function (f, i) {
      f.classList.toggle('is-active', i === activeIdx);
      // Continuous crossfade tied directly to each frame's own distance from
      // center (idxFloat), independent of the coarser is-active snap above —
      // the photo fades in as a frame nears center screen and fades back out
      // as it scrolls away, rather than popping in/out with the card itself.
      // Smoothstep-eased so the fade settles in/out rather than moving
      // linearly with scroll.
      var w = Math.max(0, 1 - Math.abs(i - idxFloat));
      w = w * w * (3 - 2 * w);
      bgs[i].style.opacity = (w * 0.6).toFixed(3);
      scrims[i].style.opacity = w.toFixed(3);
    });
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === activeIdx); });

    if (caption) caption.style.opacity = window.storyStageWeight(progress, 0.00, 1.00, 0.05, 0.05);
  }

  window.initScrollScene(section, function (progress) { render(progress); });
})();
