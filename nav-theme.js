// nav-theme.js — Sections 1, 5, and 6 force their own dark cinematic
// backdrop regardless of the site's light/dark toggle (the brief's own
// language mandates it for these three: "deep black pitch field",
// chaos/connection mood-colors — see DESIGN-DEV-GUIDE.md §6 item 3).
// Sections 2, 3, 7, and 8 do NOT force dark anymore — they respect the
// toggle like the rest of the page, since the brief has no explicit
// color mandate for them. Only `.story-scene.force-dark` elements are
// treated as "on dark" here, not every story scene.
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
  var ticking = false;

  function update() {
    var onDark = scenes.some(function (s) {
      var r = s.getBoundingClientRect();
      return r.top <= navH && r.bottom >= 0;
    });
    nav.classList.toggle('nav--on-dark', onDark);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
