// cursor.js — the theme-relevant custom pointer (§6, 2026-09-10 aurora
// refinement pass). An interaction instrument that belongs to the World
// Layer, not a decorative "custom cursor" gimmick: two layers (a small
// core that tracks the real pointer almost instantly, a larger ring that
// trails it on a slow ease — see styles.css's #maie-cursor comment for the
// full rationale), CSS-transition-driven only. This file's only job is to
// write one transform per actual pointer event and toggle one class on
// element-enter/leave — no rAF loop of its own beyond a single
// self-terminating coalescing callback (schedules at most one frame per
// batch of pointer events, then stops; not a second persistent scheduler).
//
// Activation is opt-in and reversible by construction: nothing here ever
// runs (and .maie-cursor-active is never added to <html>, so styles.css's
// `cursor: none` rule never applies) unless matchMedia confirms a real,
// fine, hover-capable pointer AND prefers-reduced-motion is off. Every
// other visitor — touch, keyboard-only, reduced-motion, or this script
// simply failing to load — keeps the native cursor with zero loss of
// affordance.

(function () {
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reducedMotion) return;

  var el = document.getElementById('maie-cursor');
  var core = el && el.querySelector('.maie-cursor-core');
  var ring = el && el.querySelector('.maie-cursor-ring');
  if (!el || !core || !ring) return;

  // .maie-cursor-active (which drives #maie-cursor's opacity, see
  // styles.css) is only added once a real pointer position is known — not
  // at script init — so there's never a frame where the cursor renders at
  // an assumed default (e.g. viewport center) before the actual pointer
  // has been located.
  // Rail/pointer interaction (§12, Cinematic Content pass) — one extra
  // distance check inside the SAME already-coalesced per-frame callback
  // below, not a new listener or RAF. #story-rail is display:none under
  // 860px (its own CSS), where getBoundingClientRect() reports a
  // zero-size rect — skipped in that case, not just visually inert.
  var rail = document.getElementById('story-rail');
  var RAIL_PROXIMITY_PX = 90;
  function updateRailProximity() {
    if (!rail) return;
    var r = rail.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    var dx = Math.max(r.left - tx, 0, tx - r.right);
    var dy = Math.max(r.top - ty, 0, ty - r.bottom);
    var dist = Math.sqrt(dx * dx + dy * dy);
    var proximity = Math.max(0, Math.min(1, 1 - dist / RAIL_PROXIMITY_PX));
    rail.classList.toggle('rail-near', proximity > 0);
    rail.style.setProperty('--rail-proximity', proximity.toFixed(2));
  }

  var tx = 0, ty = 0, pending = false, positioned = false;
  function apply() {
    pending = false;
    var t = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
    core.style.transform = t;
    ring.style.transform = t;
    updateRailProximity();
    if (!positioned) { positioned = true; document.documentElement.classList.add('maie-cursor-active'); }
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return; // touch/pen never drives this, same convention as atmosphere.js's own pointer disturbance
    tx = e.clientX; ty = e.clientY;
    if (!pending) { pending = true; requestAnimationFrame(apply); }
  }, { passive: true });

  // Hover-state — a single delegated, element-boundary-driven listener
  // (pointerover only fires on actual enter/leave, never per-pixel-of-
  // movement) rather than checking elementFromPoint every frame.
  var INTERACTIVE = 'a, button, input, select, textarea, [role="button"], .signal-link, .rail-dot, .nav-more-toggle, .path-link, [data-cinematic-slider]';
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var interactive = e.target.closest && e.target.closest(INTERACTIVE);
    el.classList.toggle('is-interactive', !!interactive);
  });

  // Fade out entirely when the pointer leaves the document (e.g. to the
  // browser chrome) so it never appears to "get stuck" at the last edge.
  document.addEventListener('mouseleave', function () { el.style.opacity = '0'; });
  document.addEventListener('mouseenter', function () { el.style.opacity = ''; });
})();
