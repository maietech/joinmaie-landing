# CLAUDE.md — joinmaie-landing

This is not a build-tooling reference. It's how engineering decisions get
made on this project — the repository's engineering constitution. Every
rule below is either a stated project principle or something this project
has already proven true about itself, once, for real (cited where that's
the case). Read it before doing anything nontrivial here.

---

## 1. Philosophy

joinmaie-landing is not a marketing website. It is a cinematic product
experience.

Engineering decisions should optimize for storytelling, clarity, and
perceived quality — not synthetic benchmark scores. When a tradeoff
exists, preserve narrative quality whenever performance remains within
acceptable limits.

Technology should disappear behind the experience. If a change makes the
page measurably faster but a visitor would now describe the story
differently — less alive, less coherent, more like "a site" than "a
moment" — that change has failed, whatever the benchmark says.

## 2. Non-Negotiables

**Never:**
- Don't remove scenes to improve performance.
- Don't reduce animation quality unless measurements justify it.
- Don't introduce scroll hijacking. Native scrolling only — `story-scroll.js`'s
  `initScrollScene` *reads* scroll position to compute `progress`, it never
  *sets* it. This is a hard architectural line, not a style preference —
  it's called out by name in `DESIGN-DEV-GUIDE.md` §3's own list of
  rejected anti-patterns ("Aggressive scroll-jacking that breaks native
  scroll/momentum").
- Don't redesign architecture without evidence. "This feels like it needs
  a bigger system" is not evidence. A live measurement, or a direct source
  read confirming a structural gap, is.
- Don't expand implementation scope because "you're already there." Fix
  what was scoped; log adjacent findings as a follow-up ticket instead of
  folding them in (see §12 for the real example of this happening — the
  `maie:themechange` listener bug found mid-implementation and correctly
  *not* fixed in the same pass).
- Don't build a new scheduling/orchestration layer without first showing
  the existing one (`registerScrollBatch`/`tick()`, see §4) can't be
  extended. This has already been asked and answered once for real — see
  §3 — don't re-litigate it from scratch next time without new evidence.

## 3. Engineering Workflow

Discovery → Verification → Decision → Implementation → Retrospective.

This project runs on Engineering Decision Records (EDR) — the same
convention `MAIE_Framework_2.0/standards/ENGINEERING_DECISION_RECORD_EDR_GUIDE.md`
defines (a sibling repo on disk; joinmaie-landing has no local copy of this
guide, but the convention applies here anyway — see §12 for where these
records actually live). Findings get tagged **STRONG** (read directly from
source, or a live command/script this pass), **MODERATE** (inference from
STRONG facts), or **OPEN QUESTION** (unresolved) — never stated as fact
without one of these.

**No architectural change should skip Discovery and Verification unless
the change is clearly localized.** A Discovery Record states what's true,
observed directly — it does not recommend a fix; that's a later stage's
job. A Decision Record names the options actually considered (including
the rejected ones — they're often the most instructive part) and who
signed off. Stages can be merged (a "lightweight EDR") but never silently
skipped.

This isn't theoretical. It's the exact shape of the 2026-07-28 scroll-
performance work: a Discovery Record, then a Verification + Decision
Record (explicitly labeled as merged stages), four independently
implemented and independently verified steps, and a closing Retrospective
comparing what was estimated against what was actually measured. Use that
document as the reference example for how this is supposed to look — see
§12 for the real path.

## 4. Architecture Principles

**Rendering:** prefer extending existing scheduling. Avoid introducing new
orchestration layers unless measurements show the current architecture
cannot evolve further. Optimize shared infrastructure before individual
scenes.

The current shared infrastructure is `reveal.js`'s `registerScrollBatch`/
`tick()` — a read-phase-then-write-phase batching registry every
scroll-driven module (7 story scenes via `story-scroll.js`'s
`initScrollScene`, `nav-theme.js`, `nav-float.js`) already registers
through, instead of each running its own scroll listener. It exists
*because* several independent listeners interleaving reads and writes was
previously measured as a real cost (the original 2026-07-23 scroll-jank
audit). Extend this before adding a second scheduling concept.

This has already been tested against the alternative, once, for real: when
asked to evaluate whether a full Animation Director / Render Orchestrator
was warranted, the answer — reached only after real-browser measurement,
not by default — was no. Every fix that pass made (a visibility early-out
inside `story-scroll.js`'s existing `write()`, a cache in `atmosphere.js`,
an explicit `pause()`/`resume()` added to `pixie-companion.js`'s existing
handle, a shared frame-timestamp dedup between two scenes' own idle loops)
was a small, local addition to the file already responsible for that
concern. None of it required a new abstraction. Don't assume next time
needs one either — check first.

**A recurring bug shape to watch for, confirmed twice now in this exact
codebase:** a guard or gate correctly applied at one call site, with a
structurally identical sibling call site left unguarded. First instance:
two of the seven story scenes (`scene-opening.js`, `scene-chaos-signal.js`)
had their own idle-animation loop correctly gated behind
`IntersectionObserver`, but their *scroll-tick* write path — and all five
other scenes' scroll-tick paths — had no equivalent visibility gate at
all, so every scene rendered on every scroll tick regardless of whether it
was anywhere near the viewport. When you add a guard, gate, or lifecycle
check anywhere in this codebase, grep for the structurally similar sibling
and check whether it needs the same protection — don't wait to rediscover
this a third time.

## 5. Story Principles

Scenes are chapters. The World Layer is persistent.

Scenes reveal the world; they do not replace it. `atmosphere.js`'s canvas
(the "World Layer" — drifting waveform fragments, destination beacons,
narrative echoes) renders continuously behind every scene, at every scroll
position. What each scene controls is how much of it is *revealed*
(`--atmo-veil`, driven by `data-atmo-density`), never whether it exists.
Don't design a new scene that hides the World Layer outright — dim it, at
most.

Atmospheric systems should always yield to cinematic content. If a choice
has to be made between "the World Layer's particle budget" and "a scene's
own moment," the scene wins — this is already encoded in
`atmosphere.js`'s `LEVEL_BUDGET` table (Cinematic sections get the World
Layer's lowest opacity/particle share, not its highest).

## 6. Performance Philosophy

Performance work follows this order:

1. Remove unnecessary work.
2. Reduce repeated work.
3. Improve scheduling.
4. Improve rendering.
5. Reduce fidelity — only as a last resort.

This ordering isn't aspirational — it's what the 2026-07-28 roadmap
actually did, in this priority, and the results validated the order: step
1 (removing the unconditional per-scene render work for off-screen
sections) was the largest measured win by a wide margin; steps 2-4
(caching a repeated `getComputedStyle` call, an explicit pause/resume
lifecycle, deduping a same-frame double-render) were real but smaller,
in that order. Nobody reached for step 5 — visual fidelity was never on
the table, and it didn't need to be. If a future optimization pass starts
by proposing to simplify an animation or cut a scene, that's a sign steps
1-4 weren't exhausted first, not that step 5 was actually necessary.

## 7. Animation Rules

Animations should feel physical. Avoid synchronized movement. Prefer
inertia. Avoid obvious looping. No animation should exist simply because
empty space exists. Movement should reinforce narrative.

This is already how the engine underneath Pixie works, not just a design
aspiration: `pixie-companion.js`'s nucleus position is driven by real
spring physics (`springStep`, per-archetype stiffness/damping), not a
keyframed loop, and `scene-chaos-signal.js`'s chip drift explicitly caps
and decays velocity rather than letting a hover kick compound forever
(`MAX_SPEED`, per-frame decay toward `baseVx`/`baseVy`) — the fix for
exactly the "this reads as glitching at warp speed" failure mode these
rules are meant to prevent. Build new motion the same way: a physical
model with bounds, not a triggered animation with no ceiling.

## 8. Pixie Rules

Pixie is not a chatbot. Pixie is not customer support. Pixie is a
narrative companion.

Pixie should explain. Encourage. Observe. Never dominate.

Three real instances exist today (`companion-intro`, `scene-agent`, the
Narrative Guide's corner badge), all sharing one engine
(`pixie-companion.js`, `window.initPixieCompanion`) — never build a second
companion visual from scratch; reuse the engine and give it whatever
lifecycle lever it's missing (see the `pause()`/`resume()` methods added
for the Guide's instance, whose `position: fixed` container made its
existing `IntersectionObserver` gating structurally unable to help it).
The engine's public contract: `pause()`/`resume()` control scheduling
only, never simulation state — a resumed Pixie continues exactly where it
left off, never re-seeds or resets. Preserve that contract; it's what
makes Pixie feel present rather than rebooted.

## 9. Narrative Guide Rules

The Guide exists to provide orientation. The story moves. The Guide
remains.

Do not allow the Guide to become a secondary navigation system or a
dumping ground for documentation. `guide.js`'s panel updates its content
by listening to `atmosphere.js`'s existing `maie:scenechange` event — it
does not register its own second `IntersectionObserver` over the same
sections, and it never covers the story itself (a persistent, low-profile
bar, expandable, never modal). Any future addition to the Guide should
answer "where am I in the story" and "why does this matter" — not become
a place to explain how the site works.

## 10. UI Hierarchy

Story → Guide → Navigation → Chrome.

That ordering should influence every design decision, including
performance ones: if a budget has to be spent, spend it on Story first.
This is also why the Guide's own corner-badge Pixie was made pausable
rather than removed when it turned out to be the one Pixie instance
running unconditionally for an entire visit (§4/§12) — Chrome-level
elements get trimmed to fit their actual attention share; Story-level
elements don't.

## 11. Coding Standards

Small changes. Shared utilities. Local fixes. Measured improvements.

Avoid: large rewrites, premature abstractions, duplicate systems.

**Zero-build, vanilla JS/HTML/CSS — no bundler, no framework, no
minification, without an explicit decision to change that.**
`DESIGN-DEV-GUIDE.md` §4 already states the "no bundler/React/CSS
framework" half of this. The unminified half matters for a second,
more specific reason this project has already relied on in practice: this
site's performance work is verified with a live CDP JS-sampling profiler
that attributes cost by real function name (`render`, `colorTokens`,
`getPointAtLength`, etc.) — that only works because the shipped source has
real, unminified identifiers. A build step that minifies or bundles this
code wouldn't just add complexity against §4's own stated architecture —
it would break the exact verification method every performance record in
this project's history has used. Don't introduce one without solving that
first.

## 12. EDR References

Before major work, read:

- **Discovery Record:** `MAIE_Framework_2.0/findings-and-fixes/JOINMAIE_LANDING_SCENE_TRANSITION_AND_SCROLL_PERFORMANCE_DISCOVERY_7-28.md`
- **Verification & Decision Record (includes all four Implementation steps and a Retrospective):** `MAIE_Framework_2.0/findings-and-fixes/JOINMAIE_LANDING_SCENE_TRANSITION_AND_SCROLL_PERFORMANCE_VERIFICATION_AND_DECISION_7-28.md`
- **Open follow-up ticket:** `MAIE_Framework_2.0/findings-and-fixes/JOINMAIE_LANDING_THEMECHANGE_LISTENER_MISMATCH_FOLLOWUP_7-28.md`
- **The implementation prompt these records were built against:** `MAIE_Framework_2.0/prompts/JOINMAIE_LANDING_SCROLL_PERFORMANCE_IMPLEMENTATION_PROMPT_7-28.md`
- **The EDR process guide itself:** `MAIE_Framework_2.0/standards/ENGINEERING_DECISION_RECORD_EDR_GUIDE.md`

All five live in **`MAIE_Framework_2.0`, a sibling repo on disk** (typically
`../MAIE_Framework_2.0/` relative to this repo's root) — **not** inside
joinmaie-landing itself. This repo has no local `findings-and-fixes/` or
`prompts/` directory of its own; don't create one that duplicates the
convention in a second place. If that ever changes, update this section,
don't leave it stale.

Read the Verification & Decision Record in full before touching any
scroll/render/scheduling code specifically — it's the current source of
truth for what was tried, what was rejected and why (a full orchestrator),
and what's still open (§13).

## 13. Current Known Technical Debt

- ~~`scene-chaos-signal.js:220`'s `maie:themechange` listener never
  fires...~~ **Resolved — stale as of 2026-08-12.** Direct inspection of
  current source (a codebase-intelligence-briefing pass, not this specific
  ticket being revisited) shows the listener now reads
  `document.addEventListener('maie:themechange', ...)`, matching every
  other listener for this event in the codebase (`guide.js`,
  `scene-agent.js`, the `companion-intro` inline script in `index.html`,
  and `atmosphere.js`'s own `cachedColors` refresh listener) — the file's
  own header comment documents the fix, citing this same follow-up ticket
  by name. `textRgb` now genuinely refreshes on a real theme toggle. The
  follow-up ticket referenced below (§12,
  `JOINMAIE_LANDING_THEMECHANGE_LISTENER_MISMATCH_FOLLOWUP_7-28.md`, in the
  sibling `MAIE_Framework_2.0` repo) still says "Status: Open" as of this
  writing — that file was not updated in this pass since it lives outside
  this repo; treat its "Open" status as stale too, not as contradicting
  this entry. See `WEBSITE_CODEBASE_INTELLIGENCE_BRIEF.md` §11 for the
  fuller writeup of this specific stale-doc finding.
- **Guide-panel Pixie's ~2.9x over-resolution while docked.** Its canvas
  renders at a fixed 80px-native backing store but displays at 28px when
  docked beside the "Pixie" label — a deliberate simplification (avoids a
  reinit), explicitly logged as a non-decision, not a performance problem
  on current evidence. Cosmetic/efficiency question only.
- **No true 1x (non-throttled) baseline, and no real mobile/touch device
  verification, has been done for any performance work in this project's
  history to date.** Every measurement so far — the original 2026-07-23
  audit and the 2026-07-28 pass — used a throttled or sandboxed
  environment with relative before/after comparisons. Treat absolute
  millisecond figures in any existing record as directional, not as a
  literal prediction of real end-user hardware.
- **`scene-lifecycle.js` registers through the shared batch two different
  ways** (directly via `registerScrollBatch` for its own field-rect cache,
  and via `initScrollScene` for scroll progress). Not confirmed broken,
  but flagged in the 2026-07-28 roadmap as needing extra care — check both
  paths, not just one, before assuming a scroll-batch change covers this
  file.

## 14. Pull Request Expectations

Every implementation should explain:

- why
- what changed
- how verified
- regressions checked
- expected impact

This is not a new bar — every "Implementation — Step N" section in the
Verification & Decision Record already does exactly this (file(s)
changed, an Architectural Note, live verification results in a table, a
"regressions observed" line, status). Match that shape.

## 15. Future Vision

Every future system should make the landing page feel more alive, more
coherent, and easier to understand — not busier.

---

## Before Writing Code

Ask yourself:

- Is this measured?
- Can I prove it?
- Can I solve it by removing work instead?
- Can I extend the current architecture?
- Will this make the next engineer's job easier?
- Would I make the same recommendation if I had to maintain it for three
  years?

---

## The MAIE Principle

Technology should disappear behind the experience.

Visitors should remember the story, the clarity, and the feeling of
momentum — not the animations, shaders, or engineering. Every technical
decision should support the narrative without drawing attention to
itself.
