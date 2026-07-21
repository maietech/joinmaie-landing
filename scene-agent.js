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
    { label: 'Intent', detail: 'The creator states what they need — in plain language, not a menu of settings.',
      pixie: { mode: 'ambient', phase: 'idle', temperament: 'curious' } },
    { label: 'Planning', detail: 'The agent breaks the request into a concrete, inspectable plan of steps.',
      pixie: { mode: 'active', phase: 'planning', temperament: 'focused' } },
    { label: 'Risk Analysis', detail: 'Before touching anything, the plan is checked against what could go wrong.',
      pixie: { mode: 'active', phase: 'review', temperament: 'focused' } },
    { label: 'Tool Activation', detail: 'Approved steps run — real tools, real changes, tracked as they happen.',
      pixie: { mode: 'tools', phase: 'executing', temperament: 'focused' } },
    { label: 'Human Verification', detail: 'The result comes back to the creator before anything is finalized.',
      pixie: { mode: 'active', phase: 'review', temperament: 'curious' } },
    { label: 'Outcome', detail: 'The work lands in the project, versioned and tied back to the original ask.',
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
