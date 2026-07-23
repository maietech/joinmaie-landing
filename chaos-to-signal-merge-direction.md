# Merging Section 5 (Chaos) + Section 6 (Everything Connects) Into One Scene

This document refines the goal for merging `scene-chaos` and `scene-maie-moment`
into a single continuous scene, and points to a development direction. It does
not contain an implementation — that's intentionally left to the dev team —
but it's grounded in the actual current code (file and line references below)
so nothing here requires re-discovering how the existing scenes work.

## 1. What's already working in our favor

This merge is less of a rebuild than it looks like, because the two scenes
already share real infrastructure:

- **The handoff already exists.** `scene-chaos.js` exposes
  `window.getChaosChipPositions()` (scene-chaos.js:96-98), and
  `scene-maie-moment.js` already calls it to seed its convergence nodes
  (scene-maie-moment.js:44-56) instead of generating a fresh random scatter.
  The two scenes are already choreographed as one continuous idea — they're
  just not built as one continuous *scroll region*.
- **The signal path is the literal brand mark.** The path nodes converge onto
  (`scene-maie-moment.js:33`, `path.getTotalLength()`) is the same coordinate
  string as the nav logo (noted in the existing narrative audit, and visible
  by comparing `index.html:126-133` to the nav SVG). That's exactly the "the
  mark is discovered inside the system" idea from the concept brief — worth
  explicitly protecting through the merge, not just preserving by accident.
- **The internal staging tool already does what a merge needs.**
  `window.storyStageWeight(progress, start, end, fadeIn, fadeOut)`
  (story-scroll.js:42-49) is already how each scene manages its own internal
  sub-beats (caption fades, node opacity, the ignition flash). A merged scene
  is a natural extension of this same pattern — more stages inside one
  progress driver — not a new mechanism.

## 2. The actual structural problem

Each scene is its own `.story-scene` — a 250vh tall wrapper with its own
`position: sticky` inner panel (styles.css:268, :278) and its own independent
`window.initScrollScene` progress driver (scene-chaos.js:100, scene-maie-moment.js:148).
Visually the handoff reads as one idea; mechanically it's two pinned panels
stitched back to back, which means:

- The visitor scrolls through a hard **unpin → repin** boundary between them,
  even though nothing about the story calls for a cut at that point.
- Progress in one scene has no relationship to progress in the other — the
  "inherit chip positions" handoff only fires once, at first entry
  (scene-maie-moment.js:149, `if (!nodes) buildNodes()`), which works, but
  it's a one-time bridge between two otherwise-independent state machines,
  not one state machine.

**Direction:** collapse both into one `.story-scene` wrapper with one sticky
panel and one `initScrollScene` call. Internally, split the single 0–1
progress into stages with `storyStageWeight` — e.g. roughly 0–0.45 is the
chaos/escalation beat (today's Section 5), 0.45–1.0 is convergence and
ignition (today's Section 6) — rather than two scenes and a handoff function.
The exact split points are a judgment call for whoever builds this; the
point is that it should be **one progress value driving one continuous
choreography**, not two.

## 3. The new concept: chip labels become the message

Today, a chip's *label* only exists in Section 5. The moment a node crosses
into Section 6, it's re-created as an anonymous, unlabeled SVG circle
(scene-maie-moment.js:62-64, `document.createElementNS(NS, 'circle')`) —
the text is discarded, only the `x, y` position survives. That's the gap
between what we have and what we want:

**Goal:** a small, curated subset of the chaos chips are not just visual
noise that resolves into dots — their *labels* are the message. As they
migrate onto the signal path, they should land at *specific, ordered*
points along the path (not the current evenly-spaced `i / (count - 1)`
distribution at scene-maie-moment.js:60) so that reading the path
left-to-right concatenates into one brand-centric line — the
`Storage_4ND` / `infinite_data_pools` / `M4N4G3D_with_ease.md` idea, landing
as something like **"Storage. Infinite data pools. Managed with ease."**

Two implications worth flagging for whoever scopes this:

1. **Not every chip can carry the message.** The current chip set
   (scene-chaos.js:17-35) has 17 entries, deliberately overwhelming and
   *not* written to concatenate into anything coherent — that's correct for
   most of them. A small, specifically-authored subset (probably 3–5 chips)
   needs to be designated as "message chips" versus "noise chips." Noise
   chips can keep resolving into plain nodes, same as today. This likely
   means a new field on the chip definition (e.g. a message-order index),
   not a change to the whole set's copy.
2. **The label needs to survive the transition.** Since message chips need
   to keep their text through the convergence, they probably can't become
   anonymous SVG circles the way every node does today. They likely need to
   stay as (or morph into) a labeled element — a small caption or
   chat-bubble anchored to their point on the path — while the non-message
   chips continue to simplify into plain dots as they do now. Reconciling
   this with the fact that Section 5's chips are DOM elements
   (`chaos-field`, absolute-positioned) and Section 6's nodes are SVG
   circles in a `viewBox` coordinate space (scene-maie-moment.js:40) is a
   real technical question the dev team should own — not something to
   paper over with the position-percentage conversion that exists today
   (scene-maie-moment.js:46-49), since that conversion currently only
   carries a point, not a labeled element.

## 4. The speed/glitch bug — root cause, not a fix

The reported "gets faster the more it's nudged, until it glitches"
behavior has one precise cause: every `mouseenter` on a chip runs
`chip.vx *= -1.8; chip.vy *= -1.8` (scene-chaos.js:66-68) with **no ceiling**.
This is multiplicative and cumulative — each hover compounds on top of the
last, so a chip that gets nudged repeatedly grows its speed exponentially,
not linearly. Combined with the wraparound logic (scene-chaos.js:79-80,
an 8%-margin teleport from one edge to the other), a chip moving fast
enough crosses that wraparound boundary in a single frame or two, which is
exactly what reads as "glitching through the canvas at warp speed."

**Direction, not implementation:** the fix should cap the *magnitude* of a
chip's velocity at some fixed maximum, not just change how the multiplier
is applied — a clamp needs a ceiling that holds regardless of how many
times a chip is hovered, rather than a smaller multiplier that only delays
the same runaway growth. Whether that's a hard clamp after each update, a
diminishing-returns curve, or replacing the "flip and amplify" behavior
with a bounded, decaying perturbation that eases back to the chip's base
drift speed, is a call for whoever implements it — the last option is
probably worth strong consideration since it also fixes a second, subtler
issue: right now a hovered chip's new velocity is permanent (nothing ever
moves it back toward its original drift), so the field's overall energy
only ever ratchets up, never settles. A decaying nudge would keep the
"things scatter when you touch them" feeling — which is good, deliberate,
and worth keeping — without letting the field's total energy climb forever.

This should be fixed as part of the merge work regardless of the new
message concept, since both scenes will need well-behaved chip motion
feeding into a convergence sequence that's about to become more visually
important (the message needs to be legible while it's still moving), not
less.

## 5. What "done" looks like

For whoever picks this up, the merge can be considered complete when:

- There is one `.story-scene` wrapper and one sticky panel where two exist
  today — no visible unpin/repin cut between the chaos beat and the
  convergence beat.
- One scroll-progress value drives both the escalation and the convergence,
  with internal stage boundaries (via `storyStageWeight` or equivalent)
  replacing the current two-scene handoff.
- A designated subset of chips carry legible text through the entire
  transition, arriving at ordered points along the signal path so that,
  read in order, they concatenate into one short brand-centric line.
- All other chips continue to resolve into plain, anonymous points, exactly
  as they do today.
- No chip's drift speed can exceed a fixed maximum, regardless of how many
  times it's nudged — hovering should still perturb a chip, but the field's
  total energy should never ratchet upward indefinitely.
- `prefers-reduced-motion` behavior is preserved: today both scenes report a
  single static final frame and never animate (scene-chaos.js:38,
  scene-maie-moment.js:154-155); the merged scene needs the same guarantee.
- The signal path's identity as the literal nav-logo mark is untouched — the
  new message mechanic should feel like it's riding along the existing
  ignition/convergence moment, not competing with or replacing it.

## 6. Explicitly out of scope for this pass

- Rewriting the chaos chip set's existing 17 entries — only a small subset
  need new "message" metadata; the rest stay as-is.
- Any change to `scene-agent.js`, `pixie-companion.js`, or other scenes —
  this is scoped to Sections 5 and 6 only.
- The ignition-flash and accent-ring treatment at the end of
  `scene-maie-moment.js` (lines 113-141) — that moment is already
  well-tuned per the existing narrative audit and shouldn't be
  re-litigated as part of this merge.
