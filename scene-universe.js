// scene-universe.js — Section 3: "Universe to You" (Scale Shift)
// Giant "MEDIA" typography zooms through into domain clusters, then media
// primitives, then re-clusters into a single project. Pure DOM + CSS
// transforms (not canvas text) so type stays crisp at any scale — the
// brief is explicit that this section shouldn't introduce raster blur.
// No asset dependency — text and layout only, per the dev guide.

(function () {
  var section = document.getElementById('scene-universe');
  if (!section) return;
  var word = document.getElementById('universe-word');
  var catCluster = document.getElementById('universe-categories');
  var atomCluster = document.getElementById('universe-atoms');
  var project = document.getElementById('universe-project');
  var caption = document.getElementById('universe-caption');
  if (!word || !catCluster || !atomCluster || !project) return;

  var catChips = Array.prototype.slice.call(catCluster.querySelectorAll('[data-cat]'));
  var atomChips = Array.prototype.slice.call(atomCluster.querySelectorAll('[data-atom]'));

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function localP(progress, start, end) { return clamp01((progress - start) / (end - start)); }

  // Arranges a set of chips in a ring whose radius grows with `spread`
  // (0..1), so the cluster reads as "forming outward" rather than
  // appearing fully assembled.
  function ring(chips, spread, maxRadius) {
    var n = chips.length;
    chips.forEach(function (chip, i) {
      var a = (i / n) * Math.PI * 2 - Math.PI / 2;
      var radius = maxRadius * Math.min(1, spread * 1.35);
      var x = Math.cos(a) * radius, y = Math.sin(a) * radius;
      var scale = 0.55 + spread * 0.55;
      chip.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + scale.toFixed(2) + ')';
    });
  }

  function render(progress) {
    var wMacro = window.storyStageWeight(progress, 0.00, 0.22, 0.00, 0.04);
    var wCats  = window.storyStageWeight(progress, 0.20, 0.46);
    var wAtoms = window.storyStageWeight(progress, 0.46, 0.74);
    var wProj  = window.storyStageWeight(progress, 0.74, 1.00, 0.04, 0.00);

    // 1. Macro — the word scales up as if the camera is pushing through
    // its counter-spaces, blurring slightly right before the cut to the
    // next stage rather than popping.
    var macroLocal = localP(progress, 0.00, 0.22);
    word.style.opacity = wMacro;
    word.style.transform = 'translate(-50%,-50%) scale(' + (1 + macroLocal * 9).toFixed(2) + ')';
    word.style.filter = 'blur(' + (macroLocal * 3).toFixed(1) + 'px)';

    // 2. Categories — domain clusters spread outward from center.
    var w = section.clientWidth || 900;
    var catLocal = localP(progress, 0.20, 0.46);
    catCluster.style.opacity = wCats;
    ring(catChips, catLocal, Math.min(w * 0.30, 280));

    // 3. Atoms — media primitives spread wider, further from center.
    var atomLocal = localP(progress, 0.46, 0.74);
    atomCluster.style.opacity = wAtoms;
    ring(atomChips, atomLocal, Math.min(w * 0.40, 380));

    // 4. Re-clustering — atoms pull back inward as the project container
    // takes over, so the ending reads as consolidation, not a plain cut.
    var projLocal = localP(progress, 0.74, 1.00);
    if (projLocal > 0) {
      ring(atomChips, Math.max(0, atomLocal - projLocal * 0.95), Math.min(w * 0.40, 380));
      atomCluster.style.opacity = Math.max(0, wAtoms - projLocal * 0.85);
    }
    project.style.opacity = wProj;
    project.style.transform = 'translate(-50%,-50%) scale(' + (0.4 + projLocal * 0.7).toFixed(2) + ')';

    if (caption) caption.style.opacity = window.storyStageWeight(progress, 0.80, 1.00, 0.06, 0.00);
  }

  window.initScrollScene(section, function (progress) { render(progress); });
})();
