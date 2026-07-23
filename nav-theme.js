// nav-theme.js — the merged Sections 5+6 scene (#scene-chaos-signal) forces
// its own dark cinematic backdrop regardless of the site's light/dark
// toggle (the brief's own language mandates it: chaos/connection
// mood-colors — see DESIGN-DEV-GUIDE.md §6 item 3, §14). It's currently the
// only forced-dark scene on the page — Section 1 dropped force-dark in
// favor of the theme-aware Ignition Spark treatment (§10), and Sections 2,
// 3, 7, and 8 never forced it. Only `.story-scene.force-dark` elements are
// treated as "on dark" here, not every story scene, so this stays correct
// automatically if that set ever changes again.
// Left alone, forcing dark on 1/5/6 would mean in light mode the nav
// keeps its light translucent background while pinned directly on top
// of a pure-black scene — a visible seam right under the nav. This just
// toggles a `nav--on-dark` class on the nav whenever it overlaps one of
// those three, so the nav blends with whichever backdrop is actually
// behind it.

(function () {
  var nav = document.querySelector('.nav');
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.story-scene.force-dark'));
  if (!nav || !scenes.length) return;

  var navH = nav.offsetHeight || 64;

  function read() {
    return scenes.map(function (s) { return s.getBoundingClientRect(); });
  }
  function write(rects) {
    var onDark = rects.some(function (r) {
      return r.top <= navH && r.bottom >= 0;
    });
    nav.classList.toggle('nav--on-dark', onDark);
  }

  // Routed through reveal.js's shared scroll-batch registry (read phase
  // for every registered module runs before any writes) instead of this
  // module's own independent scroll listener — found in the
  // pre-production audit: this getBoundingClientRect() read, interleaved
  // with other scroll listeners' style writes across
  // story-scroll.js/scene-chaos-signal.js/scene-lifecycle.js, was one of
  // several forcing their own separate synchronous layout recalcs per
  // scroll event instead of sharing one. reveal.js loads before this file,
  // so registerScrollBatch is always available here in practice; the
  // fallback below just keeps this module self-sufficient if that ever
  // changes.
  if (window.registerScrollBatch) {
    window.registerScrollBatch(read, write);
  } else {
    var ticking = false;
    function update() { write(read()); ticking = false; }
    function onScroll() { if (!ticking) { requestAnimationFrame(update); ticking = true; } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
})();
