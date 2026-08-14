// events-showcase.js — cinematic rotation for the #paths Events Showcase
// (index.html's .events-gallery, CSS in styles.css's "Events Showcase"
// block). Same shape as showcase-slider.js (IntersectionObserver-gated
// timer, aria-hidden toggling, no aria-live, immediate settled state
// under prefers-reduced-motion), extended with the one thing that engine
// doesn't need: pausing on hover/focus. showcase-slider.js's photos are
// pure atmosphere with nothing to interact with; an event's CTA needs the
// visible frame to hold still while a visitor is reading/reaching for it.
// Kept as its own small module rather than a branch inside
// showcase-slider.js for the same reason cinematic-slider.js and
// showcase-slider.js are already two separate files sharing one shape —
// see showcase-slider.js's own header comment.
//
// Architecture note: event data lives entirely in index.html markup (one
// .event-frame per event, one [data-event-frame] photo per event image) —
// no JS config array — mirroring how .showcase-grid's photos are already
// hardcoded markup, not JS-generated. This file only ever reads that
// markup; adding a future event's photos needs no change here.
//
// Today's single event has a single photo, so the rotation branch below
// bails out immediately (frames.length < 2) — same "don't simulate
// meaningless auto-rotation" convention showcase-slider.js already
// follows for a single-photo figure. The hover/focus pause listeners
// still attach regardless of frame count, since the CTA reveal (pure
// CSS, :hover/:focus-within) needs the frame to hold still on
// interaction even when there's nothing to rotate yet.
//
// A second .event-frame sibling (a future event) is supported by this
// same per-event photo rotation as-is — it would just render as a second
// frame in normal document flow below the first. Crossfading *between*
// events the way photos crossfade within one is a natural next step once
// there's a real second event to build and verify it against, not before
// — shipping that rotation now, with nothing to exercise it, would be an
// untested code path standing in for a real one.

(function () {
  var DWELL_MS = 6000;
  var TRANSITION_MS = 1400;

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initEvent(event) {
    var frames = Array.prototype.slice.call(event.querySelectorAll('[data-event-frame]'));
    if (!frames.length) return;

    event.style.setProperty('--events-transition', TRANSITION_MS + 'ms');

    frames.forEach(function (img) {
      img.classList.remove('is-active');
      img.setAttribute('aria-hidden', 'true');
    });

    var index = 0;
    frames[index].classList.add('is-active');
    frames[index].setAttribute('aria-hidden', 'false');

    if (frames.length < 2 || reducedMotion) return;

    var timer = null;
    var paused = false;
    var visible = false;

    function advance() {
      var next = (index + 1) % frames.length;
      frames[index].classList.remove('is-active');
      frames[index].setAttribute('aria-hidden', 'true');
      frames[next].classList.add('is-active');
      frames[next].setAttribute('aria-hidden', 'false');
      index = next;
    }
    function start() { if (!timer && !paused && visible) timer = window.setInterval(advance, DWELL_MS); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible) start(); else stop();
        });
      }, { threshold: 0.2 });
      io.observe(event);
    } else {
      visible = true;
      start();
    }

    // Pause while hovered or while focus is anywhere inside the frame
    // (e.g. on the Attend link) — the visible photo must hold still for
    // as long as a visitor is reading the revealed CTA, whether they got
    // there with a pointer or a keyboard.
    event.addEventListener('pointerenter', function () { paused = true; stop(); });
    event.addEventListener('pointerleave', function () { paused = false; start(); });
    event.addEventListener('focusin', function () { paused = true; stop(); });
    event.addEventListener('focusout', function () {
      if (event.contains(document.activeElement)) return;
      paused = false;
      start();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); return; }
      var r = event.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) start();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-events-gallery] .event-frame'))
      .forEach(initEvent);
  });
})();
