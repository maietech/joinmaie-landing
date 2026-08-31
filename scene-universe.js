// scene-universe.js — Section 3: "Universe to You" (Scale Shift)
// Giant "MEDIA" typography zooms through (unchanged from the original
// build — pure DOM + CSS transforms, stays crisp at any scale), then hands
// off into a cinematic video box: 5 short clips crossfade in as the
// visitor scrolls, each with its own tagline, replacing the old category/
// atom chip rings and "Your Project" recluster. Universe's protected role
// (NARRATIVE_LOCK.md §5 — "Universe earns credibility") is unchanged; only
// the mechanism is (Category B per §8).
//
// Footage: Midwest Media Alliance's own branded hero reel (the "Darkened"
// grade — already color-graded for text-overlay legibility), 5 chapters
// extracted and re-encoded (see media/universe-0N.mp4/.jpg). Picked by
// direct frame-by-frame inspection (1s-interval contact sheets via ffmpeg)
// after an initial pass on coarser timestamps landed on a cross-dissolve
// blend frame and, separately, on a recurring nude body-paint-portrait
// motif elsewhere in the reel — both excluded; the 5 used here (foundry
// workers, a spark/ember burst, a flower field + farmhouse, hot-air
// balloons over grazing wildlife, a beach dancer + a rural gate) are clean,
// on-brand, and free of that content. Muted, no audio track, ~2-3MB apiece.
//
// Crossfade uses the same storyStageWeight-per-stage idiom scene-human-
// hand.js already uses for its own photo sequence — no new animation
// primitive. Video is lazy-loaded (`data-src`, swapped to `src` only once
// this section nears the viewport) and play/pause-gated to whichever
// clip(s) currently have nonzero weight, same "only animate what's
// visible" posture as every other scene's visibility-gated work.

(function () {
  var section = document.getElementById('scene-universe');
  if (!section) return;
  var word = document.getElementById('universe-word');
  var videoBox = document.getElementById('universe-video-box');
  var caption = document.getElementById('universe-caption');
  var scrollCue = document.getElementById('universe-scroll-cue');
  if (!word || !videoBox) return;

  var videos = Array.prototype.slice.call(videoBox.querySelectorAll('.universe-video'));
  var taglines = Array.prototype.slice.call(videoBox.querySelectorAll('.universe-tagline'));
  if (!videos.length) return;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function localP(progress, start, end) { return clamp01((progress - start) / (end - start)); }

  // Lazy load — a visitor who never scrolls this far never downloads any
  // of the 5 clips, same "pay only for what's seen" posture as this page's
  // `loading="lazy"` images. Under reduced motion, `src` is never set at
  // all: each <video> just keeps showing its own `poster` frame forever,
  // which is exactly the static, non-animated fallback reduced motion
  // needs — no separate fallback mechanism required.
  //
  // Two triggers, not one: an IntersectionObserver (rootMargin 200% of
  // viewport height) fires early, while the visitor is still well above
  // this scene, so the ~2.5MB/5-clip total has as much lead time as
  // possible to fetch+decode before it's actually needed. But a site audit
  // found IntersectionObserver delivery can be delayed or, under some
  // scripted-scroll conditions, not fire again at all before the visitor
  // reaches the section — so `render()` below (driven by reveal.js's
  // native-scroll scroll-batch, proven reliable everywhere else on this
  // page) ALSO calls ensureLoaded() the moment this scene's own progress
  // first becomes nonzero, as a guaranteed fallback. Both paths call the
  // same idempotent function; whichever fires first wins.
  var loaded = false;
  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    videos.forEach(function (v) {
      if (v.dataset.src) { v.src = v.dataset.src; v.load(); }
    });
  }
  if (!reducedMotion && typeof IntersectionObserver !== 'undefined') {
    var loadObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          ensureLoaded();
          loadObserver.disconnect();
        }
      });
    }, { rootMargin: '200% 0px' });
    loadObserver.observe(section);
  }

  // Word stage — unchanged mechanics, shortened window (was 0-0.22) so the
  // video box gets the bulk of this scene's now-larger scroll range
  // (styles.css bumped #scene-universe from the default 250vh to 340vh
  // specifically to give 5 real video chapters room to read).
  var WORD_END = 0.12, WORD_FADE = 0.04;
  var lastMacroLocal = -1;

  // Video stages — same STAGES-array / write-skip pattern scene-human-
  // hand.js uses for its 7 photos: even spans across the range, shared
  // FADE window, last stage's fadeOut is 0 so a reduced-motion visitor
  // (who only ever gets progress=1 once, see story-scroll.js) still sees
  // the final clip's poster instead of a blank box.
  var VIDEO_START = 0.13, VIDEO_END = 1.0;
  var n = videos.length;
  var span = (VIDEO_END - VIDEO_START) / n;
  var FADE = Math.min(0.05, span * 0.4);
  var STAGES = videos.map(function (el, i) {
    var isLast = i === n - 1;
    return {
      start: VIDEO_START + i * span,
      end: isLast ? 1.0 : VIDEO_START + (i + 1) * span,
      fadeOut: isLast ? 0 : FADE,
    };
  });
  var lastW = videos.map(function () { return -1; });

  function render(progress) {
    // Guaranteed fallback trigger — see ensureLoaded() above. Fires once,
    // the moment this scene's own progress first becomes nonzero (well
    // before any video chapter actually needs to be visible at 0.13+).
    if (progress > 0) ensureLoaded();

    var wMacro = window.storyStageWeight(progress, 0.00, WORD_END, 0.00, WORD_FADE);
    var macroLocal = localP(progress, 0.00, WORD_END);
    word.style.opacity = wMacro;
    if (Math.abs(macroLocal - lastMacroLocal) > 0.001) {
      lastMacroLocal = macroLocal;
      word.style.transform = 'translate(-50%,-50%) scale(' + (1 + macroLocal * 9).toFixed(2) + ')';
      word.style.filter = 'blur(' + (macroLocal * 3).toFixed(1) + 'px)';
    }

    videos.forEach(function (el, i) {
      var s = STAGES[i];
      var w = window.storyStageWeight(progress, s.start, s.end, FADE, s.fadeOut);
      if (Math.abs(w - lastW[i]) > 0.001) {
        var wasLive = lastW[i] > 0;
        lastW[i] = w;
        el.style.opacity = w.toFixed(3);
        if (taglines[i]) taglines[i].style.opacity = w.toFixed(3);
        var isLive = w > 0;
        if (isLive !== wasLive) {
          el.classList.toggle('is-live', isLive);
          // Play/pause only on the transition edge, never every tick —
          // same write-skip convention as the style writes above. Never
          // attempted under reduced motion (no `src` was ever set, so
          // there'd be nothing to play anyway) or before this clip's
          // lazy-loaded `src` has actually landed.
          if (!reducedMotion) {
            if (isLive && el.getAttribute('src')) {
              var p = el.play();
              if (p && p.catch) p.catch(function () {});
            } else if (!isLive) {
              el.pause();
            }
          }
        }
      }
    });

    if (caption) caption.style.opacity = window.storyStageWeight(progress, 0.90, 1.00, 0.06, 0.00);

    // Same persistent "keep going" cue as the original build — present
    // through nearly the whole scene, independent of which chapter is
    // active.
    if (scrollCue) scrollCue.style.setProperty('--cue-opacity', window.storyStageWeight(progress, 0.06, 0.86, 0.12, 0.10).toFixed(2));
  }

  // Narrative Echo (Component 2) — fired once as the final video chapter
  // settles, same one-shot-per-pass convention the old atom-recluster
  // echo used, just anchored to the video box instead of the (now
  // removed) atom chips.
  var echoFired = false;
  window.initScrollScene(section, function (progress) {
    render(progress);
    if (!echoFired && progress > 0.95 && window.MaieAtmosphere) {
      echoFired = true;
      window.MaieAtmosphere.echo(videoBox.getBoundingClientRect(), { count: 2 });
    } else if (echoFired && progress < 0.9) {
      echoFired = false;
    }
  });

  // Idle nudge — unchanged from the original build, unrelated to the
  // word/chip -> video swap (operates on the scroll-cue only).
  if (!reducedMotion && scrollCue) {
    var IDLE_MS = 5000;
    var lastActivity = Date.now();
    function markActivity() { lastActivity = Date.now(); }
    window.addEventListener('scroll', markActivity, { passive: true });
    window.addEventListener('wheel', markActivity, { passive: true });
    window.addEventListener('touchmove', markActivity, { passive: true });
    window.addEventListener('keydown', markActivity);
    setInterval(function () {
      var cueOpacity = parseFloat(scrollCue.style.getPropertyValue('--cue-opacity')) || 0;
      var idle = Date.now() - lastActivity > IDLE_MS;
      scrollCue.classList.toggle('is-nudging', idle && cueOpacity > 0.1);
    }, 500);
  }
})();
