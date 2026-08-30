// trust-companion.js — Pixie, relocated here from #companion-intro (see
// scene-companion-intro.js's own header note on why it left). #trust was
// already left-biased — .reflect-list caps at 640px inside a much wider
// section (styles.css), leaving real empty space on the right — so Pixie
// fills a gap that was actually there, instead of competing for space in
// a section that was already full.
//
// Same engine as every other instance on the page (pixie-companion.js's
// initPixieCompanion — see CLAUDE.md §8: reuse it, don't build a second
// companion visual), same size the upper section used ("nearly perfect"
// per the brief — the sizing/init pattern below is the same one that
// section's old inline init used, just retargeted).
//
// Positioning: .trust-companion is position:fixed (styles.css) — a
// two-column flex layout + position:sticky was tried first and rejected:
// sticky's native "stuck" range is capped at (containing-block height -
// element height), which for a .reflect-list-height container ran out
// well before the last item's lock position (confirmed live — Pixie
// visibly scrolled away above the viewport with two items still to go).
// Fixed positioning has no such limit; this file computes and writes its
// screen position directly instead.
//
// As the visitor scrolls normally, Pixie eases (CSS transition) to a new
// "lock" position each time a different .reflect-item becomes the
// current one — tracked via IntersectionObserver (same threshold-based
// active-tracking idiom reveal.js already uses for its own rail dots),
// never a scroll listener, so there's no scroll-jacking risk to even
// consider. The lock position is that item's REAL on-screen vertical
// center at the moment it becomes current (clamped to stay clear of the
// nav bar and the bottom of the viewport) — not a guessed constant — so
// it reads as "Pixie moved down next to this item," not an arbitrary
// slot number.

(function () {
  var section = document.getElementById('trust');
  if (!section) return;
  var list = section.querySelector('.reflect-list');
  var items = Array.prototype.slice.call(section.querySelectorAll('.reflect-item'));
  // Deliberately NOT inside #trust — see index.html's own comment on the
  // element: #trust is [data-reveal], and .is-revealed carries a
  // permanent (non-"none") transform, which makes it the containing
  // block for any position:fixed descendant instead of the viewport.
  var box = document.querySelector('.trust-companion');
  var canvas = document.getElementById('trust-pixie-canvas');
  if (!list || !items.length || !box || !canvas) return;

  var NAV_CLEARANCE = 100; // keeps Pixie's top edge clear of the fixed nav bar
  var BOTTOM_MARGIN = 24;  // breathing room kept clear at the bottom of the viewport
  var GAP = 40;            // matches the reflect-list/companion gap the old two-column layout used

  var currentIndex = 0;
  var left = 0;

  function measureLeft() {
    var listRect = list.getBoundingClientRect();
    var sectionRect = section.getBoundingClientRect();
    var boxW = box.getBoundingClientRect().width || 260;
    // Sits just right of .reflect-list, but never past the section's own
    // right edge — same "clean spacing, no spilling" requirement the
    // vertical clamp in apply() below enforces on the other axis.
    left = Math.min(listRect.right + GAP, sectionRect.right - boxW);
  }

  function apply() {
    var item = items[currentIndex];
    if (!item) return;
    var r = item.getBoundingClientRect();
    var half = (box.getBoundingClientRect().height || 260) / 2;
    var min = NAV_CLEARANCE + half;
    var max = window.innerHeight - BOTTOM_MARGIN - half;
    var centerY = Math.max(min, Math.min(max, r.top + r.height / 2));
    box.style.transform = 'translate(' + left.toFixed(1) + 'px, ' + (centerY - half).toFixed(1) + 'px)';
  }

  // Closest-to-center-wins, not "highest ratio" or "last isIntersecting
  // entry wins": on a tall viewport, several short .reflect-item elements
  // can be simultaneously 100% visible (confirmed live — two items tied
  // at ratio 1.0 on initial load), and a ratio-based tiebreak landed on
  // whichever one Object.keys happened to iterate to last, not the one a
  // visitor would actually read as "current." Picking whichever
  // intersecting item's own center is nearest the (nav-adjusted) middle
  // of the viewport is a more direct match for "which item is the
  // visitor's eye on right now."
  var intersecting = {};
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var idx = items.indexOf(entry.target);
        if (idx === -1) return;
        if (entry.isIntersecting) intersecting[idx] = true; else delete intersecting[idx];
      });
      var viewportCenter = (NAV_CLEARANCE + window.innerHeight) / 2;
      var bestIdx = null, bestDist = Infinity;
      Object.keys(intersecting).forEach(function (key) {
        var idx = +key;
        var r = items[idx].getBoundingClientRect();
        var dist = Math.abs((r.top + r.height / 2) - viewportCenter);
        if (dist < bestDist) { bestDist = dist; bestIdx = idx; }
      });
      if (bestIdx !== null && bestIdx !== currentIndex) {
        currentIndex = bestIdx;
        apply();
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    items.forEach(function (item) { io.observe(item); });
  }

  // Visible only while #trust itself is in view — otherwise a
  // position:fixed Pixie would keep floating over whatever section comes
  // after it once the visitor scrolls past.
  if ('IntersectionObserver' in window) {
    var sectionIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        box.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { threshold: 0 });
    sectionIo.observe(section);
  } else {
    box.classList.add('is-visible');
  }

  measureLeft();
  apply();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { measureLeft(); apply(); }, 200);
  });

  // Canvas is a fixed pixel size (size * 2.5) set once at init — same
  // technique the old companion-intro instance used, for the same reason:
  // sizing from the container's actual rendered width keeps the canvas
  // inside its box at every breakpoint rather than hardcoding one size.
  var handle = null;
  function currentSize() {
    var w = box.clientWidth || 260;
    return Math.max(56, Math.min(220, w / 2.5));
  }
  function initPixie() {
    if (handle && handle.destroy) handle.destroy();
    handle = window.initPixieCompanion(canvas, {
      size: currentSize(), mode: 'ambient', phase: 'idle', archetype: 'archivist', temperament: 'idle',
      theme: window.getPixieThemeColors(),
    });
  }
  initPixie();

  document.addEventListener('maie:themechange', function () {
    if (handle && handle.update) handle.update({ theme: window.getPixieThemeColors() });
  });
})();
