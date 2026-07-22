// scene-agent.js — Section 8: "Agent Workflow"
// The real Pixie Companion engine (pixie-companion.js) travels along a
// signal-line path — same technique as scene-maie-moment.js's path
// reveal — with mode/phase/temperament changing live as scroll progress
// crosses each of six workflow steps. Uses pixie-companion.js's update()
// hook rather than a second, bespoke companion visual, per the dev
// guide's explicit direction for this section.

(function () {
  var section = document.getElementById('scene-agent');
  if (!section) return;
  var path = document.getElementById('agent-path');
  var nodesEl = document.getElementById('agent-nodes');
  var canvas = document.getElementById('agent-pixie-canvas');
  var detail = document.getElementById('agent-detail');
  var caption = document.getElementById('agent-caption');
  if (!path || !nodesEl || !canvas) return;

  var STEPS = [
    { label: 'Intent', detail: 'You describe the outcome. The system carries the weight — no menu of settings to wade through.',
      pixie: { mode: 'ambient', phase: 'idle', temperament: 'curious' } },
    { label: 'Planning', detail: 'The request becomes a concrete, inspectable plan — quietly, without you having to manage it.',
      pixie: { mode: 'active', phase: 'planning', temperament: 'focused' } },
    { label: 'Risk Analysis', detail: 'Before anything is touched, the plan is checked against what could go wrong — so you don\u2019t have to.',
      pixie: { mode: 'active', phase: 'review', temperament: 'focused' } },
    { label: 'Tool Activation', detail: 'The heavy lifting happens quietly in the background — real tools, real changes, tracked as they go.',
      pixie: { mode: 'tools', phase: 'executing', temperament: 'focused' } },
    { label: 'Human Verification', detail: 'The result comes back to you before anything is finalized. You stay the decision-maker.',
      pixie: { mode: 'active', phase: 'review', temperament: 'curious' } },
    { label: 'Outcome', detail: 'The work lands in your project, versioned and tied back to what you asked for. One less thing to carry.',
      pixie: { mode: 'ambient', phase: 'completed', temperament: 'celebrating' } },
  ];

  var len = path.getTotalLength();
  var n = STEPS.length;

  var nodePts = STEPS.map(function (s, i) {
    var t = i / (n - 1);
    return path.getPointAtLength(t * len);
  });

  var nodeEls = STEPS.map(function (s, i) {
    var el = document.createElement('div');
    el.className = 'agent-node';
    el.style.left = nodePts[i].x + '%';
    el.style.top = (nodePts[i].y / 60 * 100) + '%';
    el.innerHTML = '<div class="agent-node-dot"></div><div class="agent-node-label">' + s.label + '</div>';
    el.addEventListener('click', function () { showStep(i); });
    nodesEl.appendChild(el);
    return el;
  });

  var pixieHandle = window.initPixieCompanion(canvas, {
    size: 60,
    mode: STEPS[0].pixie.mode, phase: STEPS[0].pixie.phase,
    archetype: 'archivist', temperament: STEPS[0].pixie.temperament,
  });

  var lastIdx = -1;
  function showStep(i) {
    if (detail) detail.textContent = STEPS[i].detail;
    nodeEls.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
  }

  function render(progress) {
    var idxFloat = progress * (n - 1);
    var pt = path.getPointAtLength(progress * len);
    canvas.style.left = pt.x + '%';
    canvas.style.top = (pt.y / 60 * 100) + '%';

    var activeIdx = Math.max(0, Math.min(n - 1, Math.round(idxFloat)));
    if (activeIdx !== lastIdx) {
      lastIdx = activeIdx;
      showStep(activeIdx);
      if (pixieHandle && pixieHandle.update) {
        var p = STEPS[activeIdx].pixie;
        pixieHandle.update({ mode: p.mode, phase: p.phase, temperament: p.temperament, progress: 0 });
      }
    }

    // Within the "Tool Activation" step, feed the companion's own
    // executing-arc progress so it visibly ticks forward, not just holds.
    if (pixieHandle && pixieHandle.update && STEPS[activeIdx].pixie.phase === 'executing') {
      var within = clamp01(idxFloat - activeIdx + 0.5) * 100;
      pixieHandle.update({ progress: within });
    }

    if (caption) caption.style.opacity = window.storyStageWeight(progress, 0.00, 1.00, 0.05, 0.05);
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  showStep(0);
  window.initScrollScene(section, function (progress) { render(progress); });
})();
