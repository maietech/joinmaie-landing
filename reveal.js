// reveal.js — the "story wheel" scroll engine.
// Purpose-built for this page: NOT the pitch deck's maie-scene-engine.js
// (that one pages through chapters on click/keyboard, one full chapter
// at a time — a different UX entirely). This is IntersectionObserver-
// driven: sections fade/rise into place as they cross into view while
// scrolling normally, and a progress rail down the side fills in to
// give the "river with a destination" feeling without blocking native
// scroll or hijacking the wheel.

(function () {
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var rail = document.getElementById('story-rail');
  var railFill = document.getElementById('story-rail-fill');

  if (!sections.length) return;

  // Build rail dots, one per section.
  if (rail) {
    sections.forEach(function (sec, i) {
      var dot = document.createElement('button');
      dot.className = 'rail-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Jump to ' + (sec.dataset.railLabel || 'section ' + (i + 1)));
      dot.addEventListener('click', function () {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      rail.appendChild(dot);
    });
  }
  var dots = rail ? Array.prototype.slice.call(rail.querySelectorAll('.rail-dot')) : [];

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  sections.forEach(function (sec) { revealObserver.observe(sec); });

  // Track which section is "current" for the rail dots + fill height,
  // separate observer with a stricter threshold so only one section
  // is ever "active" at a time.
  var activeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var idx = sections.indexOf(entry.target);
        dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
        if (railFill) {
          var pct = sections.length > 1 ? (idx / (sections.length - 1)) * 100 : 0;
          railFill.style.height = pct + '%';
        }
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(function (sec) { activeObserver.observe(sec); });
})();
