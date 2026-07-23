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

  // `document.documentElement.scrollHeight` is a layout-forcing read.
  // Previously read on every scroll-driven tick, immediately after writing
  // the `--scroll-y` custom property (which feeds `.bg-orb`'s transform) —
  // that write-then-read pattern was forcing a synchronous style/layout
  // recalculation on every tick, one of the top contributors in the
  // pre-production audit's scroll-jank profile (~4.1s of a ~33s throttled
  // scroll-through). Cached instead, recomputed only when the document's
  // height could plausibly have changed: on resize, and once web fonts
  // finish loading (a layout-affecting event that isn't a "scroll" or
  // "resize"). Section heights on this page are all either fixed vh values
  // or driven by absolutely-positioned content that doesn't affect flow
  // height, so neither image loads nor scroll-driven style writes should
  // ever invalidate this cache between those two triggers.
  var cachedMax = 0;
  function recomputeMax() {
    cachedMax = document.documentElement.scrollHeight - window.innerHeight;
  }
  recomputeMax();
  window.addEventListener('resize', recomputeMax);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(recomputeMax);

  // Shared read/write batching for scroll-driven work across files —
  // registered read callbacks all run first (each feeding its own paired
  // write callback), then every write callback runs, so a
  // getBoundingClientRect() read from one module (story-scroll.js,
  // nav-theme.js, etc.) never forces a layout recalc against a style write
  // another module already made earlier in the same tick. Found in the
  // pre-production audit: story-scroll.js, nav-theme.js,
  // scene-chaos-signal.js, and scene-lifecycle.js each ran their own
  // independent scroll listener with its own interleaved read-then-write,
  // and multiple such listeners firing across the same scroll event could
  // each force their own synchronous layout instead of sharing one.
  var batchEntries = [];
  window.registerScrollBatch = function (read, write) {
    var entry = { read: read, write: write };
    batchEntries.push(entry);
    write(read()); // initial synchronous pass, matching the "compute once at registration" behavior every consumer previously relied on
    return function unregister() {
      var i = batchEntries.indexOf(entry);
      if (i !== -1) batchEntries.splice(i, 1);
    };
  };

  function tick() {
    // READ PHASE — every registered read() runs first, before any writes.
    var reads = batchEntries.map(function (e) { return e.read(); });
    // WRITE PHASE — this module's own writes, then every registered write().
    document.documentElement.style.setProperty('--scroll-y', window.scrollY);
    if (railFill) {
      var pct = cachedMax > 0 ? Math.min(100, Math.max(0, (window.scrollY / cachedMax) * 100)) : 0;
      railFill.style.height = pct + '%';
    }
    batchEntries.forEach(function (e, i) { e.write(reads[i]); });
    ticking = false;
  }
  // Resize also needs a tick — batched consumers' geometry (nav-theme.js's
  // force-dark check, story-scroll.js's section progress, etc.) can change
  // on resize without any scroll event firing, same as each of their
  // original independent listeners handled before this was centralized.
  function onScrollOrResize() {
    if (!ticking) {
      requestAnimationFrame(tick);
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
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
