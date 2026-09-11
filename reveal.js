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
  // Mobile's own minimal progress bar (styles.css's .story-progress-bar) —
  // same pct this tick already computes for railFill, just also written
  // to a second element's width instead of height. No separate listener.
  var progressBarFill = document.getElementById('story-progress-bar-fill');

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

  // Exposes the native rAF timestamp this tick is running under. The
  // browser hands the identical timestamp to every rAF callback invoked
  // within the same native animation frame — scene-opening.js and
  // scene-chaos-signal.js (the two scenes with their own idle-loop rAF
  // chain alongside this scroll-tick one) compare their own loop's
  // timestamp against this value to detect "did a scroll tick already
  // render this exact frame" and skip a redundant draw()/render() call,
  // without needing to know or care which of the two chains happened to
  // run first in that frame. See the Verification & Decision Record, Q2.
  window.__scrollTickFrameTime = null;
  function tick(t) {
    window.__scrollTickFrameTime = t;
    // READ PHASE — every registered read() runs first, before any writes.
    var reads = batchEntries.map(function (e) { return e.read(); });
    // WRITE PHASE — this module's own writes, then every registered write().
    document.documentElement.style.setProperty('--scroll-y', window.scrollY);
    if (railFill || progressBarFill) {
      var pct = cachedMax > 0 ? Math.min(100, Math.max(0, (window.scrollY / cachedMax) * 100)) : 0;
      if (railFill) railFill.style.height = pct + '%';
      if (progressBarFill) progressBarFill.style.width = pct + '%';
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
  var revealSections = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var rail = document.getElementById('story-rail');

  if (revealSections.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealSections.forEach(function (sec) { revealObserver.observe(sec); });
  }

  // Cinematic Content pass (2026-09-11): the rail used to represent only
  // the 3 [data-reveal] sections (primitives/trust/paths) — 8 of the
  // page's 11 real chapters (every story-scene) were simply absent from
  // it, even though the fill height already tracked true whole-page
  // progress. [data-atmo-density] is the exact set of 11 major chapters
  // atmosphere.js's own density observer already tracks (every story-
  // scene plus every [data-reveal] section) — reused here as the rail's
  // node list too, rather than inventing a second "what are the real
  // chapters" enumeration.
  var railSections = Array.prototype.slice.call(document.querySelectorAll('[data-atmo-density]'));
  if (rail && railSections.length) {
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sectionToDot = new Map();
    railSections.forEach(function (sec, i) {
      var label = sec.dataset.railLabel || 'section ' + (i + 1);
      var dot = document.createElement('button');
      dot.className = 'rail-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Jump to ' + label);
      var labelEl = document.createElement('span');
      labelEl.className = 'rail-dot-label';
      labelEl.textContent = label;
      labelEl.setAttribute('aria-hidden', 'true'); // decorative — the button's own aria-label already carries this for assistive tech
      dot.appendChild(labelEl);
      dot.addEventListener('click', function () {
        sec.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
      rail.appendChild(dot);
      sectionToDot.set(sec, dot);
    });
    var dots = Array.prototype.slice.call(rail.querySelectorAll('.rail-dot'));

    // Active-node tracking reuses atmosphere.js's existing maie:scenechange
    // event (the same "which [data-atmo-density] section currently owns
    // the most viewport space" signal the World Layer's own per-scene
    // budget already runs off — see atmosphere.js's density
    // IntersectionObserver) instead of a second IntersectionObserver over
    // the same 11 elements.
    // .passed/.upcoming (relative to the active node's index in document
    // order) is what lets the rail "communicate the journey ahead" (§11)
    // — completed chapters read as filled/settled, remaining ones stay
    // quieter, without needing separate per-node state beyond one index
    // comparison.
    function setActive(activeDot) {
      var activeIdx = dots.indexOf(activeDot);
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === activeIdx);
        d.classList.toggle('passed', activeIdx !== -1 && i < activeIdx);
        d.classList.toggle('upcoming', activeIdx !== -1 && i > activeIdx);
      });
    }
    document.addEventListener('maie:scenechange', function (e) {
      setActive(sectionToDot.get(e.detail.section));
    });
    // Prime initial state immediately (scroll position at load) rather
    // than waiting for atmosphere.js's first observer callback — mirrors
    // guide.js's own "prime initial content immediately" convention for
    // the same event.
    setActive(window.MaieAtmosphere && window.MaieAtmosphere.currentSection
      ? sectionToDot.get(window.MaieAtmosphere.currentSection) : dots[0]);
  }
})();
