// nav-menu.js — mobile nav disclosure for the secondary links (Trust,
// Pitch Deck) that don't fit in the bar at narrow viewports alongside
// the theme toggle and primary CTA. Below 640px (see styles.css),
// #nav-more-toggle becomes visible and #nav-secondary hides behind it
// instead of wrapping. No-ops entirely above that breakpoint since the
// toggle button is display:none there and never gets clicked.

(function () {
  var toggle = document.getElementById('nav-more-toggle');
  var panel = document.getElementById('nav-secondary');
  if (!toggle || !panel) return;

  function isOpen() { return panel.classList.contains('is-open'); }
  function close() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function open() {
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (isOpen()) close(); else open();
  });

  // Click-away and Escape both close it — otherwise it stays open,
  // floating over whatever the visitor scrolls to next, until they
  // happen to tap the toggle again.
  document.addEventListener('click', function (e) {
    if (isOpen() && !panel.contains(e.target) && e.target !== toggle) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });
  // Trust is an in-page anchor — without this, following it would leave
  // the panel open and floating over the section the visitor just
  // jumped to.
  panel.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') close();
  });
})();
