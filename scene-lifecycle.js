// scene-lifecycle.js — Section 7: "The Media Lifecycle" (8 stages)
// A horizontal filmstrip whose position is a function of vertical scroll
// progress (translateX only) — the visitor never actually scrolls
// sideways, and native vertical scroll/momentum stays untouched. Text/UI
// only, no asset dependency, per the dev guide.

(function () {
  var section = document.getElementById('scene-lifecycle');
  if (!section) return;
  var track = document.getElementById('lifecycle-track');
  var rail = document.getElementById('lifecycle-rail');
  var caption = document.getElementById('lifecycle-caption');
  if (!track || !rail) return;

  var STAGES = [
    { title: 'Create', desc: 'Idea becomes capture — the first frame, take, or recording lands in the project.', metric: 'stage_status: captured' },
    { title: 'Organize', desc: 'Ingestion sorts and structures everything automatically, no manual folder work.', metric: 'stage_status: structured' },
    { title: 'Understand', desc: 'Scene, object, and visual analysis reads what is actually in the footage.', metric: 'stage_status: analyzed' },
    { title: 'Connect', desc: 'Related assets, people, and projects are mapped into a relational graph.', metric: 'stage_status: linked' },
    { title: 'Transform', desc: 'Processing and enhancement reshape the raw material into what it needs to be.', metric: 'stage_status: processed' },
    { title: 'Collaborate', desc: 'Human and agent work the same project together, side by side.', metric: 'stage_status: co-authored' },
    { title: 'Prove', desc: 'Authenticity and provenance are tracked from the very first frame onward.', metric: 'stage_status: verified' },
    { title: 'Share', desc: 'The finished work moves out into the wider creative ecosystem.', metric: 'stage_status: distributed' },
  ];

  STAGES.forEach(function (s, i) {
    var frame = document.createElement('div');
    frame.className = 'lifecycle-frame';
    frame.dataset.stage = i;
    var num = String(i + 1).length < 2 ? '0' + (i + 1) : String(i + 1);
    frame.innerHTML =
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
  var windowEl = track.parentElement;

  function render(progress) {
    var n = STAGES.length;
    var idxFloat = progress * (n - 1);
    var activeIdx = Math.round(idxFloat);

    var frameW = frames[0] ? frames[0].getBoundingClientRect().width : 320;
    var gap = 28;
    var centerOffset = ((windowEl.clientWidth || 0) - frameW) / 2;
    var trackX = centerOffset - idxFloat * (frameW + gap);
    track.style.transform = 'translateX(' + trackX.toFixed(1) + 'px)';

    frames.forEach(function (f, i) { f.classList.toggle('is-active', i === activeIdx); });
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === activeIdx); });

    if (caption) caption.style.opacity = window.storyStageWeight(progress, 0.00, 1.00, 0.05, 0.05);
  }

  window.initScrollScene(section, function (progress) { render(progress); });
})();
