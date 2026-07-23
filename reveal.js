// reveal.js — the "story wheel" scroll engine.
// Purpose-built for this page: NOT the pitch deck's maie-scene-engine.js
// (that one pages through chapters on click/keyboard, one full chapter
// at a time — a different UX entirely). This is IntersectionObserver-
// driven: sections fade/rise into place as they cross into view while
// scrolling normally, and a progress rail down the side fills in to
// give the "river with a destination" feeling without blocking native
// scroll or hijacking the wheel.

(function () {
  var ticking = false;
  // Rail fill now tracks true whole-page scroll progress (scrollY / max
  // scrollable distance), not reveal-section index — see the second IIFE
  // below for why. Computed in this same rAF-throttled handler rather than
  // adding a third scroll listener for it.
  var railFill = document.getElementById('story-rail-fill');
  function updateScrollVar() {
    document.documentElement.style.setProperty('--scroll-y', window.scrollY);
    if (railFill) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      railFill.style.height = pct + '%';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateScrollVar);
      ticking = true;
    }
  }, { passive: true });
})();

(function () {
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var rail = document.getElementById('story-rail');

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

  // Track which reveal section is "current" for the rail dots — dots stay
  // scoped to reveal sections only (a dot mid-cinematic-scene would still
  // undercut the immersion, per DESIGN-DEV-GUIDE.md §4/§6 item 3's original
  // reasoning for excluding story scenes from the rail). Fill height is no
  // longer computed here — see the scroll handler above: it now tracks true
  // whole-page progress, so it advances through story scenes too, resolving
  // the gap flagged in maie-narrative-audit.md §8 (the rail was blank for
  // most of the visitor's actual scroll distance, since 7 of 12 built
  // sections are story scenes and account for most of the page's height).
  var activeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var idx = sections.indexOf(entry.target);
        dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(function (sec) { activeObserver.observe(sec); });
})();
