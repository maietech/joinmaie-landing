# MAIE Interactive Essay — Design & Dev Guide
`joinmaie.com` · living reference, last updated alongside Section 5

This is the handoff document for the team picking up the remaining
sections. It covers the creative system already established, the
technical patterns already in place (so new sections stay consistent
rather than reinventing scroll/reveal mechanics), current build status
per section, and open decisions that need a call before continuing.

---

## 1. Creative Vision (recap)

Not a product splash page — a scroll-driven visual essay on the
evolution of media intelligence. The visitor travels one continuum:

**Impulse → Frame → Story → Data → Intelligence → Ecosystem**

Three visual metaphors recur throughout and should inform any new
section's imagery rather than introducing a fourth:

| Metaphor | Represents | Visual form |
|---|---|---|
| **The Signal** | Human gesture | A continuous line, mutating from organic pulse to structured code |
| **The Frame** | Media boundary | A flexible viewport that expands/contracts/fractures to reveal data |
| **The Network** | Relationships | A relational graph — assets, creators, agents connecting organically |

### The four-phase rhythm
Every section is one of these. Alternating them prevents fatigue —
don't stack two Immersion sections back to back.

| Mode | Feel | Tempo |
|---|---|---|
| **Immersion** | Full-viewport, cinematic, atmospheric | Slow, deliberate scroll |
| **Exploration** | Interactive node trees, scrubbing, hover-driven metadata | Active, tactile |
| **Reflection** | Stark type, generous negative space, short statements | Quiet pause |
| **Revelation** | System UI unveils, chaos resolves into structure | High-energy crescendo |

---

## 2. Design Tokens

Already defined in `styles.css` `:root` / `html[data-theme="light"]` —
reference these, don't redeclare hex values in a new section's CSS.

| Token | Dark (default) | Light |
|---|---|---|
| `--bg` | `#09090B` | `#FAF8F6` |
| `--surface` | `#111318` | `#FFFFFF` |
| `--text-1` / `--text-2` | near-white / muted | near-black / muted |
| `--brand` / `--brand-light` | `#A52A2A` / `#C24E4E` | `#772E25` / `#A52A2A` |
| `--brand-glow` | `rgba(165,42,42,0.30)` | `rgba(119,46,37,0.16)` |
| `--accent` | `#FFD166` (warm gold) | `#B8860B` |

**Typography roles** — don't mix these up, each one signals something:
- **Display** (`Bebas Neue`) — cinematic titles, big structural shifts
- **Body** (`DM Sans`) — editorial prose
- **Data/mono** (`JetBrains Mono`) — timestamps, hashes, EXIF, metadata, system status

**Atmospheric layering:** grain overlay (`.bg-grain`) + scroll-parallax
orbs (`.bg-orb-*`, driven by `--scroll-y`) sit behind all *reveal*
sections (toolkit/trust/journey/paths). The three cinematic **story
scenes** (opening, chaos, MAIE-moment) intentionally override this with
their own forced-dark backdrop and don't use the orb field — see
§6 for why that's flagged as an open decision, not settled.

Scene mood-color cue from the brief, followed so far: cool blue-grey
for chaos (Section 5), brand crimson for connection (Sections 1, 6).
Keep this pairing consistent in future sections — a section about
confusion/fragmentation should not use warm brand tones.

---

## 3. Anti-Patterns — do not reintroduce these

Straight from the creative brief. These are why the pre-existing hero/
toolkit/trust/paths sections are flagged as an open conflict in §6,
not a model to copy for new sections:

- 🚫 Standard corporate SaaS hero (bold title over two buttons above a static screenshot)
- 🚫 Walls of rectangular feature cards
- 🚫 Generic stock photography of teams around laptops
- 🚫 "AI glow" neon gradients with no narrative purpose
- 🚫 Aggressive scroll-jacking that breaks native scroll/momentum

---

## 4. Technical Architecture

**Stack:** zero-build static site (HTML/CSS/vanilla JS only) — same
pattern as `portal.joinmaie.com` and `waitlist.joinmaie.com`, deployable
to Cloudflare Pages with no build command. Don't introduce a bundler,
React, or a CSS framework for a new section; if a section seems to
need one, that's a flag to bring back to the team, not a silent scope
change.

### File manifest
| File | Purpose |
|---|---|
| `index.html` | All sections, in narrative order |
| `styles.css` | All styles — tokens, reveal sections, story scenes |
| `theme.js` | Dark/light toggle (`data-theme` attr + `localStorage`) |
| `nav-theme.js` | Darkens the nav bar whenever it's pinned over a `.story-scene.force-dark` scene (only `#scene-chaos-signal` now — see §14), independent of the light/dark toggle |
| `nav-menu.js` | Mobile nav disclosure (open/close/click-away/Escape) for `#nav-secondary` behind `#nav-more-toggle` — see §16 |
| `reveal.js` | Fade-in-on-scroll for the simple `[data-reveal]` sections (companion-intro/trust/paths) + the side progress rail |
| `story-scroll.js` | Shared scroll-progress engine for **story scenes** — read this before building a new cinematic section |
| `scene-opening.js` | Section 1 |
| `scene-frame.js` | Section 2 |
| `scene-universe.js` | Section 3 |
| `scene-human-hand.js` | Section 4 — see §17. Built once real documentary photography was sourced |
| `scene-chaos-signal.js` | Sections 5+6, merged into one continuous scene — see §14. Supersedes the old `scene-chaos.js` + `scene-maie-moment.js` pair |
| `scene-lifecycle.js` | Section 7 |
| `scene-agent.js` | Section 8 |
| `pixie-companion.js` | Real ported companion engine (see §5). Now also exposes an `update(patch)` hook on the object `initPixieCompanion` returns — `{ destroy, update }` — so mode/phase/temperament can change live post-init. Existing static call sites (the hero) are unaffected; they just never call `update()`. |

### Two section types — don't confuse them
1. **Reveal sections** (`companion-intro`, `trust`, `paths`) — simple fade/rise into view via `reveal.js`'s `IntersectionObserver`. Add `data-reveal` + `data-rail-label` and it's automatically wired into the side progress rail. Use this for any non-cinematic content section. `companion-intro` replaced the old two-button `hero` — see §6 item 1 for why. `toolkit` and `journey` were retired in the §11 changelog round — see there for why.
2. **Story scenes** (Sections 1, 2, 3, 5+6 merged, 7, 8 — all built so far) — tall wrapper (`height: 250vh` convention, though individual scenes override this — `#scene-opening` is 380vh, `#scene-chaos-signal` is 500vh, `.lifecycle-scene` is 420vh) with a `position: sticky` inner panel (`.scene-sticky`, pinned to 100vh). `story-scroll.js`'s `initScrollScene(sectionEl, onProgress)` reads scroll position and reports `progress` 0→1 as the user scrolls through the wrapper's full height — **never sets scroll position**, so native scroll/momentum is untouched (no scroll-jacking, per the brief's own requirement). Story scenes are *not* wired into the side rail's dots (still true) — a rail dot mid-cinematic-scene would undercut the immersion — but the rail's *fill* now tracks true whole-page scroll progress regardless (§12 changelog, resolved the gap this note used to flag as open).

   **Only add `class="story-scene force-dark"` if the brief explicitly mandates a specific dark mood-color for that section** (as it does for the merged Sections 5+6 scene — see §14). Otherwise use `class="story-scene"` alone and build the scene's CSS with `var(--bg)`/`var(--surface)`/`var(--text-1)`/`var(--text-2)`/`var(--accent)` tokens, same as a reveal section, so it respects the light/dark toggle. Sections 1 (since §10), 2, 3, 7, 8 all do this now — `#scene-chaos-signal` is the *only* remaining forced-dark scene — check any of those CSS blocks as the reference before writing a new scene's styles, not `#scene-chaos-signal`'s.

### Building a new story scene — the recipe
1. Markup: `<section id="scene-X" class="story-scene"><div class="scene-sticky">...</div></section>`
2. New JS file: `window.initScrollScene(section, function(progress, isStatic) { ... })`. Use `progress` to drive opacity/position/whatever; use `isStatic` (true only under `prefers-reduced-motion`) to skip continuous animation and just render the final settled frame once.
3. For cross-fading between sub-stages within one scene (see `scene-opening.js`'s pulse→line→frames→waveform→timeline→data-fields), use `window.storyStageWeight(progress, start, end)` — returns 0→1→0 across a window, with soft edges.
4. If the scene needs continuous idle motion (particles drifting, a breathing glow) independent of scroll, gate that `requestAnimationFrame` loop behind the *same* `prefers-reduced-motion` check — `story-scroll.js` only handles the scroll-tied part.
5. Add the script tag to `index.html`, after `story-scroll.js` and in narrative order relative to other scene scripts.

### Pixie companion (`pixie-companion.js`)
This is the **actual** app engine, ported line-for-line from
`PixieCompanion.tsx` — not a lookalike. `window.initPixieCompanion(canvas, opts)`
where `opts` = `{ size, mode, phase, progress, archetype, temperament, theme, preferences }`.
Currently used once, in the hero, at defaults (`ambient`/`idle`/`archivist`).
**Section 8 (Agent Workflow) needs this reused with live-updating
`mode`/`phase`/`temperament` as the user scrolls through workflow
steps** — that's the natural next call site; don't build a second
companion visual from scratch.

Two things this engine will never render, correctly: reputation echoes
and a purchased skin. There's no account on this page, so there's no
data for either — that's accurate, not a missing feature.

---

## 5. Section-by-Section Status

| # | Section | Phase | Status | File | Notes |
|---|---|---|---|---|---|
| 1 | Before the Media | Immersion (hybrid — see §12) | ✅ Built | `scene-opening.js` | Nav auto-hides for first 50% of scroll depth per brief. Now a six-beat caption narrative, not a single line — see §12. Height bumped to 380vh (was the default 250vh) for pacing room across six beats |
| 2 | One Moment | Exploration | ✅ Built | `scene-frame.js` | Fracture-growth technique instead of literal slice-translation (steadier across aspect ratios). Photo is `media/staircase-by-robert-schwarz.jpg` (swapped from `makabera-pop-up-9977615_1920.jpg` — see §15); still an arbitrary-per-the-brief pick, swap freely. Reuses the Signal-line device from Sections 1/6 |
| 3 | Universe to You | Revelation | ✅ Built | `scene-universe.js` | DOM+CSS transforms, not canvas text — no raster blur at scale. Categories/atoms use a deterministic ring layout, not real data — swap in real domain/primitive taxonomy if it ever changes |
| 4 | The Human Hand | Reflection | ✅ Built | `scene-human-hand.js` | Real documentary photography sourced — see §17. Slowest scene on the page by design (480vh, no idle motion) |
| 5 | Chaos of Creation | Immersion | ✅ Built | `scene-chaos-signal.js` | Merged with Section 6 into one continuous scene (progress 0.0-0.45) — see §14. Message-chip mechanic added: a curated subset of chips carry their text through convergence instead of dissolving |
| 6 | Everything Connects | Revelation | ✅ Built | `scene-chaos-signal.js` | Merged with Section 5 into one continuous scene (progress 0.45-1.0) — see §14. Ignition-flash/accent-ring tuning from §13 unchanged, just rescoped to a sub-window of the shared progress value |
| 7 | Media Lifecycle (8 stages) | Exploration | ✅ Built | `scene-lifecycle.js` | Horizontal filmstrip driven by vertical scroll progress (translateX only) — no real horizontal scroll, no scroll-jacking |
| 8 | Agent Workflow | Revelation | ✅ Built | `scene-agent.js` | Reuses `pixie-companion.js` via its `update()` hook — same engine as the hero, not a lookalike, and now theme-aware too (see §11). Path now reuses the real signal/logo curve (was a placeholder wave — fixed in §11) |
| 9 | Marketplace | Exploration | ⛔ Not started | — | **Needs real package/LUT/workflow preview content** |
| 10 | Creator Passport | Reflection | ⛔ Not started | — | **Needs a real sample media + provenance hash example** |
| 11 | Story Becomes Data | Exploration | ⛔ Not started | — | **Needs real or plausible platform metrics** to animate honestly |
| 12 | World Opens / Closing Loop | Immersion | ⛔ Not started | — | Depends on Section 1 (done) and ideally Section 11's network visual existing first |

---

## 6. Open Decisions

**Resolved this round** — the three items previously open here were
all decided:

1. **The hybrid-page problem — resolved: replaced, not kept.** The old
   two-button `hero` is now `#companion-intro`: a Reflection-style
   statement + Pixie, no CTA buttons at all. **That's a real UX
   change worth knowing about, not just a restyle:** the waitlist/pitch
   links no longer appear above the fold — they live solely in the
   closing `#paths` section now. The reasoning was the brief's own:
   lead with impulse, not an early ask. `toolkit` and `trust` went from
   3-card grids to `.reflect-list`/`.reflect-item` — single column,
   generous vertical space, no card borders, matching the brief's
   Reflection language instead of a feature-card wall. `paths` went
   from two boxed `.path-card` panels to `.path-choice`/`.path-link` —
   text-style links instead of boxes, closer to the brief's own
   "a single elegant primary CTA" closing spirit (Section 12, once
   built, may absorb this entirely). `journey`'s numbered step list was
   reviewed and left alone — it's not actually a card-grid or a
   two-button hero, so it doesn't violate anything on §3's list.
2. **Section 5 → 6 handoff — resolved: wired (superseded in §14 —
   the snapshot handoff this described no longer exists).** Originally:
   `scene-chaos.js` exposed `window.getChaosChipPositions()`;
   `scene-maie-moment.js` called it once, the first time it scrolled
   into view, and converted Section 5's percent-based field coordinates
   into its own SVG viewBox units — a one-time bridge between two
   independent scenes, needed because they were two separate pinned
   panels. §14 merged Sections 5 and 6 into one continuous scene, which
   removed the need for a snapshot bridge at all — the same DOM chip
   elements now drift through chaos and morph in place into convergence,
   no recreation, no snapshot, correct under scrolling back and forth in
   a way the old snapshot-once approach couldn't have supported. Kept
   here for history; see §14 for the current mechanism.
3. **Forced-dark backdrop — resolved: split, not all-or-nothing (updated
   again this round — see §10; further consolidated in §14).** At the
   time this was written, Sections 5 and 6 (two separate scenes) both
   kept the forced-dark backdrop (`class="story-scene force-dark"`) —
   Section 1 dropped it too, after being reported dark/flat in light mode
   (see §10). Since §14 merged Sections 5 and 6 into one scene, there is
   now exactly **one** forced-dark scene on the page (`#scene-chaos-
   signal`), not two. Sections 2, 3, 7, 8 were converted to use `var(--bg)`/
   `var(--surface)`/`var(--text-1)`/`var(--text-2)`/`var(--accent)`
   throughout instead of hardcoded hex, so they now respect the site's
   light/dark toggle like the reveal sections do. `nav-theme.js` keys
   off `.force-dark` specifically, not every `.story-scene`. **Gap noted
   here previously, resolved in §11 — and turned out broader than
   scoped:** this originally flagged only Section 8's `pixie-companion.js`
   instance as not passing a `theme` option. `maie-narrative-audit.md`
   found the same gap at the `companion-intro` (hero) call site too —
   neither instance was theme-aware, not just Section 8's. Both are fixed
   now; see §11 for the mechanism (a `theme` option plus a live-update
   event, since nothing repaints a canvas on its own when a CSS custom
   property changes).

**Still open:**

4. **Three sections still need real content (Section 4 resolved — see
   §17).** 9, 10, and 11 need product content (marketplace previews, a
   real provenance/hash example, real or plausible platform metrics)
   that photography can't substitute for. Section 12 depends on 11.
   Section 4 was checked against the first 10 stock photos added and
   stayed blocked at that point — portraits/nature/product shots, none
   of it "creator at work" — but a second batch of real documentary/
   editorial photography (colorist grading suites, a story-structure
   card wall, a music session) unblocked it; see §17 for the build.

---

## 7. Suggested Build Order (unblocked work first)

**Stale as a status snapshot — kept for history, see §5 for current
status.** At the time this was written, only 2/3/7/8 were built.
Sections 1, 4, 5, and 6 have since been built/reworked (§§10, 12, 14, 17).
Only 9, 10, and 11 remain content-blocked today; 12 depends on 11.

Sections 2, 3, 7, and 8 are now built (see §5). Everything remaining
(4, 9, 10, 11, 12) is blocked on real content that doesn't exist yet —
documentary photography, marketplace previews, a provenance example,
platform metrics — or, for Section 12, on Section 11 existing first.
There is currently **no unblocked section-building work left** — the
next move is either sourcing that content, or picking up one of §6's
open architectural decisions instead of scaffolding further.

One thing worth a second look now that 3/7/8 exist, not urgent:
- Section 3's category/atom lists are hardcoded in `scene-universe.js`,
  not pulled from anywhere — fine for now, but worth flagging if the
  product's actual domain taxonomy or primitive list is expected to
  change independently of this page.

(Section 8's path shape was an arbitrary wave, not the real signal
curve — swapped for the real one in §11.)

---

## 8. Changelog — visual QA pass after Sections 3/7/8

Three issues reported after the first look at 3/7/8 in the browser, all fixed:

1. **Story scenes were boxed, not full-bleed.** The generic `section {
   padding: 120px; max-width: 1080px; margin: 0 auto; }` rule (written
   for the reveal sections) was also applying to every `.story-scene` —
   so each cinematic scene rendered as a padded, ~1080px-wide panel with
   the page background visible around it, instead of true edge-to-edge.
   This was the source of both the abrupt light/dark seam and the bare
   gap at the very top of the page. Fixed with an override:
   `.story-scene { padding: 0; max-width: none; margin: 0; }`.
2. **Nav kept its themed background over forced-dark scenes.** In light
   mode especially, the nav's light translucent background sat directly
   on top of a pure-black cinematic backdrop while pinned — a visible
   seam under the nav. `nav-theme.js` now toggles a `nav--on-dark` class
   whenever the nav overlaps a `.story-scene`, independent of the
   light/dark toggle.
3. **Hero Pixie companion could overflow its own box.** `initPixieCompanion`
   was called with a hardcoded `size: 220` (→ a fixed 550px canvas), but
   `.hero-companion` is capped at `max-width: 44vw` — under ~1250px
   viewport width the canvas was wider than its container and spilled
   out of alignment with the hero text. The hero's init script now sizes
   from the container's actual measured width (capped at 220) and
   re-inits on resize.

---

## 9. Changelog — hybrid-page replacement + handoff wiring + dark-mode split

All three §6 open decisions from the previous round were resolved this
round (see §6 for the reasoning behind each):

- `hero` → `#companion-intro`: Reflection-style statement, Pixie intact
  and right-aligned, **no CTA buttons** — the ask moved entirely to the
  closing `#paths` section. `toolkit`/`trust` card-grids → `.reflect-list`
  single-column treatment. `paths` two-card grid → `.path-choice` text
  links. `.hero-companion`/`.hero-inner`/`.hero-text` renamed to
  `.intro-companion`/`.intro-inner`/`.intro-text` throughout — including
  in the pixie-sizing script in `index.html`, which references the
  container by class name.
- Section 5 → 6 handoff wired via `window.getChaosChipPositions()`.
- Dark-mode split: `.force-dark` added to Sections 1/5/6 only;
  Sections 2/3/7/8's CSS converted from hardcoded hex to design tokens;
  `nav-theme.js` updated to key off `.force-dark` instead of every
  `.story-scene`.
- Section 2 (One Moment) built — see §5's status table.

---

## 10. Changelog — nav gap fix, dead CTA hover fix, Section 1 light-mode

Three issues reported from the live `.pages.dev` preview:

1. **Nav gap when scrolling back to the top — root cause found and
   fixed.** `.nav` was `position: sticky`. Since nav is the very first
   element on the page, its natural flow position is already y=0 — so
   as `sticky` it behaved identically to `fixed` *while visible*, which
   is why this wasn't caught earlier. The bug: `.nav-hidden`'s
   `transform: translateY(-100%)` only moves a sticky element visually
   — it does **not** remove its reserved 64px from the document flow.
   That left a permanent 64px gap at the very top of the page any time
   nav was hidden (on initial load, and every time scrolling back up
   re-entered Section 1's first-50%-hides-nav window), through which
   the fixed-position `.bg-orb-1` background glow bled — the reddish
   band that was "very apparent." Changed `.nav` to `position: fixed`.
   Since nav's effective pinned position doesn't change, this is
   visually identical whenever nav is shown, but properly removes it
   from flow — nothing is left to leave a gap when it's hidden. No
   compensating padding was needed elsewhere: nav's translucent/blurred
   styling was already designed to overlay content, not push it down.

2. **Dead hover state on the primary CTA — confirmed and fixed.** The
   external diagnosis was correct: `.path-link:hover .path-link-title`
   and `.path-link--primary .path-link-title` both resolved to
   `var(--brand-light)`, so the primary link's hover transitioned that
   color to itself — firing, but invisible. Fixed by giving
   `.path-link--primary:hover .path-link-title` its own rule
   (`var(--text-1)`, inverting the secondary link's direction). Also
   added the arrow-slide interaction suggested alongside it: the `→`
   moved out of the HTML strings and into `.path-link-title::after`,
   so it can `translateX` on hover independently of the text's color
   transition. The "Kicker Fade" and "Signal Glow" alternatives from
   the same note were not built — reasonable to add later, just not
   necessary on top of the color fix + arrow slide.

3. **Section 1 dark-in-light-mode — resolved: Digital Ignition Spark
   built, dropped force-dark.** Of the three proposed concepts
   (Photographic Bloom, Particle Implosion, Digital Ignition Spark),
   Ignition Spark was the strategic pick: it reuses the Signal-line
   device already established in `scene-frame.js`/`scene-maie-moment.js`
   rather than introducing a fourth visual language, and — unlike
   Bloom or Implosion — doesn't require Section 1 to still start dark
   regardless of theme before transitioning; a spark-flash-and-settle
   reads correctly against either theme's background from frame one.
   Implementation: a one-shot intro (plays once per page load, gated
   behind the same `prefers-reduced-motion` check as everything else —
   skipped entirely under reduced motion, resolving straight to the
   settled glow) — a full-width line flash and dissipate, then a
   radiating six-shard spark burst at center, crossfading into the
   scene's existing steady breathing-pulse look, so the handoff back to
   the normal scroll-driven `draw()` is seamless. Section 1's background
   and the pulse/spark colors were changed from hardcoded `#000`/
   `rgba(255,255,255,...)` to `var(--bg)`/`var(--accent)`/
   `var(--brand-light)`, read via `getComputedStyle` (canvas fill colors
   can't reference CSS custom properties directly). `force-dark` removed
   from Section 1's section element; `#scene-opening .scene-caption` got
   a scoped `color: var(--text-1)` override, since the shared
   `.scene-caption` class still needs to stay hardcoded white for
   Section 6, which is still force-dark.
   **Bloom and Implosion remain unbuilt, on the table if the team wants
   to swap the intro treatment later** — nothing about the theme-aware
   groundwork here (background/pulse colors, the drop of force-dark)
   is specific to Ignition Spark; a different intro animation could be
   swapped in against the same setup.

---

## 11. Changelog — audit implementation: unified backgrounds + personalized content

Implements the two objectives from `maie-narrative-audit.md`'s recommendations
(§11 A/B/C/D). Two items required an explicit decision rather than a
straightforward fix; both were confirmed with the team before any related
code changed, not inferred from the diff.

### Decision 1 — Section 1's light-mode identity: kept theme-consistent

The audit (§6) surfaced this as a real trade-off, not a bug: the brief calls
for "a dark, cinematic field" as Section 1's specific opening mood, but the
Ignition Spark treatment (§10 above) intentionally dropped force-dark for
full theme consistency — so light-mode visitors get a warm paper background
+ spark-flash instead of a black field.

**Decision: keep the current theme-consistent approach.** No code change to
Section 1 itself. Reasoning: consistency with Sections 2/3/7/8 (all
theme-aware) was already the deliberate call made in §10, arrived at after
comparing three concepts specifically because it worked in both themes from
frame one without a "still starts dark regardless of toggle" carve-out. Re-
opening that to chase the brief's literal instruction for one beat would
undo a considered decision to relitigate a trade-off the team already weighed
correctly the first time — the brief's *intent* (existential, restrained
opening) is preserved by Ignition Spark in both themes even though the
specific "dark field" imagery isn't literal in light mode.

### Decision 2 — Legacy sections: toolkit/journey retired, companion-intro trimmed-in-place, trust reordered

The audit's headline finding (§1, §2, §11 D1): `companion-intro`/`toolkit`/
`trust`/`journey` sit directly after Section 6's crescendo, restate it in
flatter generic-SaaS prose, and duplicate Section 7's territory. Audit's own
options (§11 C1) were (a) retire toolkit/journey now that Section 7 covers
that ground as a built cinematic scene, or (b) rewrite all four in place as
an intentional Reflection beat — which the audit itself was skeptical of,
since their content currently reads as a sales insert, not calm reflection.

**Decision: option (a).**

- **`toolkit` and `journey` removed from the DOM entirely.** `toolkit`'s
  three benefit headlines ("Never Lose a Moment," "Total Project Clarity,"
  "Outsource the Chaos" — audit's explicit pick for weakest copy on the
  page) restated what Section 6 had just shown visually and better.
  `journey`'s 3-step onboarding (upload/explore/refine) covered the same
  territory as `scene-lifecycle`'s 8-stage cinematic version, arriving
  right before it in flatter form. Neither added information Section 7
  doesn't already deliver more effectively.
- **`companion-intro` kept as-is.** Its copy ("The burden of the infinite
  project, lifted...") was already the pain-first, non-feature-list content
  the audit praised (§5) — the problem was never this section's own copy,
  it was the three sections after it. Pixie's introduction still earns its
  place here per §6 item 1's original reasoning.
- **`trust` kept, reordered benefit-first.** Was: jargon kicker
  (`SHA-256`/`Per-Project Storage`/`Migration-Safe`) → benefit title → body.
  Now: benefit title → body → jargon spec as a small supporting line
  underneath, not a leading claim. `trust` is the page's only real
  security/trust content, so it wasn't a duplication candidate the way
  toolkit/journey were.
- **Nav updated to match:** "Toolkit" and "Journey" links removed from
  `.nav-links`; "Trust" kept, since the section it points to still exists.
  No JS change needed for the progress rail — `reveal.js` queries
  `[data-reveal]` at runtime, so it automatically stops generating rail
  dots for sections that no longer exist.
- **Dead CSS removed, not deprecated in place:** `.step`/`.step-num`/
  `.step-name`/`.step-desc` (only ever used by `journey`) and
  `.section-desc` (only ever used by `toolkit`) deleted outright, per this
  project's own convention of not leaving unused rules around "just in
  case." `.reflect-code`'s margin was changed from `margin-bottom` (when it
  led each item) to `margin-top` (now that it trails `reflect-desc`).

### Pixie companion theme-awareness (both call sites, not just Section 8)

Per audit §6/§11 D2: neither Pixie instance — not `companion-intro`'s, not
Section 8's — was passing a `theme` option to `pixie-companion.js`, despite
the engine already supporting one. Both rendered the engine's hardcoded
default core color (`rgb(167,65,51)`) regardless of the toggle. This guide
previously scoped the gap to Section 8 only (§6 item 3); the audit found it
was page-wide.

Fixed:
- `pixie-companion.js` gained `window.getPixieThemeColors()`, a shared
  reader that pulls `--brand-light`/`--accent` via `getComputedStyle`,
  matching the technique `scene-opening.js` already uses for its own canvas
  colors, with the same fallback values for consistency (not new hardcoded
  colors — reusing what `scene-opening.js` already had).
- `update()` now accepts a `theme` patch, reassigning the same closure
  variable `animate()` already reads every frame — no restart needed, same
  pattern as the existing `mode`/`phase`/`temperament` patches.
- Both call sites (`companion-intro`'s init script in `index.html`,
  `scene-agent.js`) now pass `theme: window.getPixieThemeColors()` at init.
- `theme.js` now dispatches a `maie:themechange` `CustomEvent` on toggle —
  nothing repaints a canvas automatically when a CSS custom property
  changes, so both call sites listen for this event and call
  `handle.update({ theme: window.getPixieThemeColors() })` to update live,
  not just at next init.
- **Script-order fix found along the way:** `companion-intro`'s inline init
  script previously ran *before* `theme.js` in `index.html`'s script list.
  Since `theme.js` sets the correct `data-theme` synchronously from
  `localStorage`, and the init script reads theme colors via
  `getComputedStyle` the moment it runs, a saved light-mode preference was
  being silently ignored on first paint — the canvas would read the
  `<html>` tag's default `data-theme="dark"` values instead, until
  something else happened to repaint it. Moved `theme.js` earlier in the
  script order, immediately after `pixie-companion.js` and before the
  inline init script, to fix this. `scene-agent.js` didn't have this bug —
  it already loaded after `theme.js`.

### Section 8's signal path — real curve, not a placeholder wave

Per audit §7/§11 D: `#agent-path-svg`'s path was an arbitrary wave shape,
unrelated to the Signal metaphor reused everywhere else (nav logo, Section
6). Swapped to the literal same path `d` string as the nav logo and
`#scene-maie-moment` (viewBox changed from `0 0 100 60` to `0 0 92 56` to
match). `scene-agent.js`'s node/canvas positioning previously worked by
coincidence — it treated the path's raw coordinate values as percentages
directly, which only produced correct results because the old viewBox's
width was numerically `100`. Introduced explicit `VB_W`/`VB_H` (92/56)
scaling so positioning is correct against the new viewBox rather than
relying on that coincidence. `.agent-stage`'s `aspect-ratio` updated to
match (`92 / 56`, was `100 / 60`).

### Nav CTA de-escalated

Per audit §9/§11 D3: "Join the Exchange" was a filled button, visible from
the first pixel on every scroll position (`.nav` is `position: fixed`) —
recreating the exact "early ask" pattern the hero deliberately dropped
(§6 item 1), just relocated to a part of the page that reasoning was never
extended to. Changed `.nav-cta` from a filled button to a plain
brand-colored text link (same weight class as the other nav links,
distinguished by color + underline-on-hover instead of a button shape).
Href unchanged.

### Section 5's chaos field — AI-tool clutter added

Per audit §4/§11 D4: the brief explicitly lists "AI tools. Agents.
Models... Approvals" among the fragmenting forces; the implemented chip set
was all generic files/cloud/chat, missing that category entirely — a missed
chance for the more self-aware, contemporary admission that AI tooling
itself currently adds to the mess, for a product that is itself an AI agent
platform. Added three chips to `scene-chaos.js`'s `CHIPS` array in the same
format as the existing entries: `Agent Tab — 6 unsaved runs` (window),
`model_checkpoint_v3.safetensors` (file), `⚠ 3 agent approvals pending`
(alert).

### `paths` copy fixes

Per audit §11 A:
- Secondary link relabeled from "Explore the Full Pitch" (investor
  register, audience mismatch against the creator this page addresses
  throughout) to "See MAIE in Motion." Href unchanged (`portal.joinmaie.com`).
- Headline restored to the brief's full three-line closing triad — "Media,
  connected. Intelligence, shared. Creation, amplified." (was missing the
  third line).
- "MAIE is in active development" moved out of the closing paragraph (which
  now just reads "Choose where your story goes next") into a small, quiet
  `.path-note` beneath the path choice — honest disclosure kept, but no
  longer sitting inside the page's most crystallized line.

### Explicitly out of scope for this pass

The story-progress rail covering only reveal sections (now `companion-intro`/
`trust`/`paths` — 3 of the page's built sections, down from 5) while all 7
story scenes go unmarked is flagged in the audit (§8) as a pacing/navigation
question whose own documented trigger condition (§4 above: "worth a second
look if the whole page ends up mostly story scenes") has now been met. Not
addressed here — it's a rail/wayfinding redesign, not a background or
content fix, and deserves its own pass.

**Resolved in §12 below** — this ended up not staying deferred; see the
rail item there.

---

## 12. Changelog — Section 1 narrative rework + story-rail fix

### Section 1's new role: hybrid immersion, not pure mystery

**The question:** whether Section 1 should be mystery-first (visual and
copy both stay abstract), recognition-first (copy names the feeling early),
or a hybrid. Resolved as **hybrid: the visual stays fully abstract and
mysterious throughout — it never becomes literal "office chaos" imagery,
that's still Section 5's job — while the copy progressively concretizes
across six beats, landing on a plainly-stated personal recognition by the
time the visitor reaches the end of the scene.**

**Why this and not pure mystery-first:** the single line "Everything begins
with something" (the old implementation) was, per `maie-narrative-audit.md`,
"deliberately vague — the ambiguity is by design... but its payoff depends
on the visitor reaching Section 6 with the throughline intact," and that
throughline was getting diluted by the toolkit/trust detour between Sections
6 and 7 (since resolved, see §11). A pure-mystery opening puts *all* the
weight of connecting "abstract light" to "my actual problem" on sections
5–6, three scenes later. The hybrid lets Section 1 do real narrative work —
establish the emotional shape of the problem — without stating it as a
SaaS pain-point or naming MAIE.

**Why this and not full recognition-first:** naming the problem literally
in Section 1 (file chaos, tool sprawl, the specifics Section 5 dramatizes)
would front-run Section 5's crescendo and violate the brief's own explicit
principle: "Do not tell visitors what MAIE does before showing them why it
matters" / "Explaining the architecture before establishing the problem" is
on the brief's anti-pattern list. Section 1 ends on an *emotional* beat
("You just wanted to make something"), not a *diagnostic* one — no files,
no tools, no drives named. That specificity is still earned later.

**How this reads against the full arc:** Section 1 states the theme
obliquely as a feeling. Sections 2–3 (Exploration/Revelation, still about
media and craft itself, not about pain) build the visitor's investment in
the thing worth protecting. Section 5 proves the Section 1 feeling at full
volume, concretely (file chaos, tool sprawl). Section 6 resolves it. This
is a deliberate "cold open states the theme, the story earns it" structure
— Section 1 creates *emotional conditions*, it doesn't resolve the story by
itself.

### The six-beat caption

Implemented in `scene-opening.js`. The caption is no longer a single
static line — it's driven by a `STAGES` array, one beat per existing visual
morph-stage (pulse → line → frame-matrix → waveform → timeline → data
fields), using the *exact same* progress windows the canvas rendering
already used (`computeWeights()` is now the single source of truth for
both `draw()` and the new `updateCaption()` — refactored from six
independent inline `storyStageWeight()` calls inside `draw()` alone, so
text and visual can never drift out of sync).

| Beat | Visual stage | Copy | Note |
|---|---|---|---|
| 1 | Pulse | "Everything begins with something." | Preserved verbatim — the audit's own pick for the page's strongest deliberately-vague line |
| 2 | Line | "It becomes something real." | Point extending into a line = an idea taking shape |
| 3 | Frame matrix | "Then it becomes another." | Line fractures into a grid of frames — literal visual multiplication |
| 4 | Waveform | "And another." | Repetition as the literary device, audio bars as continued multiplication |
| 5 | Timeline | "Until the work is surrounded by everything that isn't the work." | The turn/reversal — tick marks and structure appearing visually as the copy names the burden |
| 6 | Data fields | "You just wanted to make something." | The recognition payoff, paired with literal metadata rows (id/ts/conf/src) — the visual *is* the administrative residue the line names |

Verified end-to-end with a headless-browser pass (Playwright driving the
page at `localhost`, scrolling to each stage's progress and reading the
live caption text) — all six beats land correctly and in order, in both
themes. Also fixed one accessibility-adjacent gap found along the way: the
old single-caption version only ever faded in during the *first* stage's
window ([0.0, 0.10]); under `prefers-reduced-motion`, `story-scroll.js`
resolves straight to `progress=1` (the *last* stage), which fell outside
that window — meaning reduced-motion visitors previously saw no caption
at all in Section 1. The new stage-aware `updateCaption()` correctly shows
the final beat ("You just wanted to make something.") for reduced-motion
visitors instead, consistent with how every other scene shows its settled
end-state under reduced motion.

### CSS changes supporting the above

- `.scene-caption` (`styles.css`): was `white-space: nowrap`, fine for the
  original single five-word line, but beat 5 ("Until the work is
  surrounded by everything that isn't the work.") is eleven words and
  would overflow a narrow viewport at this font size. Changed to
  `white-space: normal` + `max-width: min(88vw, 640px)` +
  `line-height: 1.18`. This is a shared class (also used by
  `#frame-caption`, `#universe-caption`), so it incidentally makes those
  more robust on narrow viewports too — harmless for their existing short
  captions, verified via the same headless-browser pass at a 390px mobile
  viewport (the longest beat wraps to three lines, no overflow).
- `#scene-opening` height bumped from the default `.story-scene`'s 250vh to
  380vh. Six narrative beats need more pacing room than the section's
  original single caption did — 250vh/6 ≈ 42vh per beat (as tight as
  `scene-agent`'s already-flagged-as-tight 6-step pacing); 380vh/6 ≈ 63vh
  per beat, more generous than `scene-lifecycle`'s 8-stage pacing
  (420vh/8 ≈ 52.5vh), which felt appropriate given this is now the page's
  highest-stakes emotional beat, not a lower-stakes one.

### Story-rail fix (previously flagged "explicitly out of scope," resolved this round)

§11's changelog explicitly deferred this — the audit's finding (§8) that
the rail's fill bar only ever tracked `[data-reveal]` section index, going
blank for most of the page's actual scroll distance since 7 of 12 built
sections are story scenes. That deferral was scoped-out for the *previous*
task (background/content fixes only), not blocked by missing content — so
per this round's instruction to resolve what's actually ready rather than
re-document it, it's fixed now.

`reveal.js`: the rail *fill* now tracks true whole-page scroll progress
(`scrollY / (scrollHeight - innerHeight)`), computed in the same
rAF-throttled scroll handler already updating `--scroll-y` for the
background parallax orbs — no new listener added. The rail *dots* are
unchanged — still scoped to reveal sections only, since a dot appearing
mid-cinematic-scene would still undercut the immersion (the guide's
original reasoning for excluding story scenes from the rail, §4, still
holds for dots specifically — it was only the fill-height calculation that
had the gap). Verified via headless browser: fill height now advances
linearly with real scroll position across the whole page, not just within
reveal sections.

### Deferred items — unchanged, still content-blocked

Sections 4, 9, 10, 11, and 12 remain **not started**, for the same reasons
recorded in §5/§6 item 4 — real documentary photography, marketplace
preview content, a provenance/hash example, and platform metrics,
respectively, none of which can be fabricated. Nothing in this round
touched them or their dependencies. No new deferred items were introduced.

### Validation performed

- `node --check` on every changed `.js` file; HTML tag-balance and CSS
  brace-balance checks — all clean.
- Headless-browser pass (Playwright + system Chrome via a local static
  server) driving the actual page: scrolled to each of the six caption
  beats' progress values and read the live DOM text — confirmed correct
  order and content in both dark and light theme. Checked console for
  errors (none beyond the browser's automatic `favicon.ico` 404, unrelated
  to the page). Checked a 390px mobile viewport at the longest caption beat
  — wraps to three lines, no horizontal overflow. Confirmed the nav's
  de-escalated CTA (§11) and the theme toggle both work mid-flow. Confirmed
  the story-rail fill advances correctly across full-page scroll fractions.
- Not independently re-verified in this pass: real mobile Safari/iOS
  Chrome (checked via a desktop headless browser at mobile viewport width
  only, not a real device), and Section 1's ignition-spark one-shot timing
  under actual human scroll speed (verified programmatically, not by a
  human scrolling it).

---

## 13. Changelog — Section 6 node/accent-mark refactor

**Problem reported:** the converging chaos-nodes in `scene-maie-moment.js`
settled at full opacity and stayed parked on the path indefinitely — a
cluster of dots permanently sitting on the mark that the real MAIE logo
doesn't have. Separately, the accent marker's radius scaled up to a large
solid filled disc (r up to 6.5, rendered ~100px diameter on screen), which
doesn't match the nav logo's actual construction (small solid core at
r="3" + a separate thin outline ring at r="6.5", `stroke-width:1`,
`opacity:0.4` — see the nav `<svg>` in `index.html`'s `<nav>`). Both
reported as reading as "disingenuous" to the real mark.

**Fixed, `scene-maie-moment.js` + `index.html` + `styles.css`:**

- Nodes now fade out as they *arrive*, not before — full opacity through
  progress 0.70 (so the "aligning" motion stays clearly visible), fading to
  0 opacity by 0.90 (well before the scene ends), computed via the same
  `storyStageWeight()` idiom used everywhere else on the page. Position
  interpolation (`settle`) is unchanged — only opacity was decoupled from
  it.
- Added a genuine ignition flash — a brief `drop-shadow` glow + modest
  `stroke-width` increase on the path itself, peaking right as the last
  nodes finish dissolving (progress 0.82–0.86) — reusing the same
  flash/glow visual language `scene-opening.js`'s one-shot intro already
  established, rather than inventing a new effect.
- Added a second SVG element, `#signal-accent-ring`
  (`.signal-accent-ring` — `fill:none; stroke:var(--accent); stroke-width:1`),
  matching the nav logo's actual outline ring. The original single
  `#signal-accent-dot` circle no longer scales its radius (fixed at the
  logo's real `r="3"` throughout) — the ring now carries the arrival pulse
  (briefly expanding/brightening during the flash, then settling to the
  same static `r=6.5`/`opacity:0.4` ring the nav mark has at rest), so the
  scene's resolved state is now the *same construction* as the real logo,
  not a lookalike built from a single inflated circle.
- First implementation of the flash overshot badly (drop-shadow blur to
  9px, ring/dot radius to 8.5, full-opacity color) and rendered as a solid
  glowing orb that dwarfed the mark — caught via a headless-browser
  screenshot pass before shipping, not from code review alone. Retuned to
  a much smaller blur (max ~4px) and alpha-faded `rgba()` glow (max ~0.65)
  instead of a flat full-opacity color, verified visually again after the
  fix.

Verified via the same headless-Chrome + local-server approach used for §12:
scrolled through Section 6's progress range, read live SVG attribute values
(node opacity, path filter/stroke-width, ring/dot opacity+radius) at each
step, and screenshotted the flash moment and the final resting state to
confirm the resting mark now visually matches the nav logo's proportions.

---

## 14. Changelog — Sections 5+6 merged into one continuous scene

Implements `chaos-to-signal-merge-direction.md` in full. `scene-chaos.js`
and `scene-maie-moment.js` are **removed**, replaced by
`scene-chaos-signal.js`. `index.html`'s two `<section>` blocks (`#scene-
chaos`, `#scene-maie-moment`) are now one (`#scene-chaos-signal`).

### 1. One scene, not two

Per the direction doc §2: collapsed both `.story-scene` wrappers into one
(`#scene-chaos-signal`, `height: 500vh` — same combined scroll distance as
the old two 250vh scenes, so overall pacing feels the same), one `.scene-
sticky` panel, one `initScrollScene` call. Internally split via two local-
progress values derived from the single shared `progress`:

- `chaosLocal = min(1, progress / 0.45)` — drives the chaos-phase caption
  and chip density, 0 at the very top through 1 at progress 0.45.
- `convLocal` (clamped 0-1) / `convLocalRaw` (unclamped) — drives
  convergence position (`eased = ease(convLocal)`) and the ignition
  sequence. **Two variants deliberately:** `storyStageWeight()` already
  handles out-of-range input correctly on its own (returns 0 well outside
  a fade window) — but clamping to exactly 0 for the whole chaos phase
  broke that for the one fade window that starts exactly at 0
  (`capBefore`, "Fragmented. Scattered. Disconnected."):
  `storyStageWeight(0, 0.0, 0.28, 0.02, 0.10)` falls through to the
  "inside the plateau" branch and returns **1**, not 0, because clamped-0
  equals that window's own start — caught via a screenshot showing the
  caption bleeding through during the chaos phase, not from code review.
  Fixed by feeding `storyStageWeight` the *unclamped* `convLocalRaw`
  (genuinely negative through the whole chaos phase, which
  `storyStageWeight` already resolves to 0 correctly) for every fade-timed
  value (`capBefore`, `capAfter`, `flashW`, accent dot/ring opacity,
  noise-chip opacity) — `eased`/position math still uses the clamped
  `convLocal`, since `ease()` isn't meant for out-of-[0,1] input.

The ignition-flash/accent-ring sequence's own internal tuning (§13) is
**unchanged** — it just reads `convLocalRaw`/`eased` (a sub-window of the
shared progress) instead of an independent 0-1, per the direction doc's
explicit instruction not to re-litigate that moment.

### 2. No more snapshot handoff — same DOM elements throughout

The old two-scene architecture needed `window.getChaosChipPositions()`: a
one-time snapshot of Section 5's chip positions, taken the moment Section
6 first scrolled into view, used to seed freshly-created anonymous SVG
`<circle>` nodes. That was a workaround for the hard pin/unpin cut between
two separate panels — see §6 item 2 for the historical record.

Now that it's one continuous scene, that bridge is gone entirely. The
same DOM chip elements created at page load drift through the chaos phase
and then **morph in place** into the convergence state — no recreation, no
snapshot. This is also more correct under scrolling back and forth: the
old snapshot-once approach would have had nothing sensible to do if a
visitor scrolled back into "chaos" after the snapshot fired, since Section
6's nodes were disconnected replicas by that point. The merged version has
no such discontinuity — position is a continuous function of `progress` in
both directions.

Mechanically: each chip's on-screen position blends between its live drift
accumulator (`chip.x`/`chip.y`, still updated by `step()` every frame
regardless of scroll position) and a target point on the signal path,
weighted by `eased`. The target point is computed by converting an SVG
path point to a percentage position relative to `#chaos-field` via
`path.getPointAtLength(t * len).matrixTransform(path.getScreenCTM())`,
then normalizing against `#chaos-field`'s own `getBoundingClientRect()` —
correct regardless of how `#signal-svg` is sized/centered within the
panel, and recomputed every render call so it stays correct across
resize. Computed once per frame (not once per chip) since every chip in a
given frame wants the same field rect and path transform.

### 3. Message chips (direction doc §3)

Three chips (of the CHIPS array's 20 total — the original 17 unchanged,
plus these 3 new ones) carry an `isMessage: true` flag, a `messageOrder`
(0-2), and a `messageText`. During the chaos phase they're indistinguishable
from the 17 "noise" chips — same drift, same hover/warning behavior — so
there's nothing to visually spot ahead of time:

| Order | Raw label (chaos phase) | Resolved text (post-convergence) |
|---|---|---|
| 0 | `St0r4ge_4ND.tmp` | "Storage." |
| 1 | `1nf1n1te_d4ta_p00ls` | "Infinite data pools." |
| 2 | `M4N4G3D_w1th_3ase.md` | "Managed with ease." |

Read left to right along the resolved path, they concatenate into "Storage.
Infinite data pools. Managed with ease." Unlike noise chips (which shrink
into a plain dot and dissolve, see §4 below), message chips **stay
visible** at full convergence — they're the resolved signal, not noise to
be cleared away.

Each converges onto a specific, curated point along the path
(`MESSAGE_T = [0.08, 0.46, 0.85]`, tuned by eye against screenshots, not
evenly divided — arc-length parametrization means equal `t`-spacing isn't
equal on-screen spacing given how much the path zigzags) instead of the
noise chips' evenly-auto-distributed points. Vertical offset alternates per
chip (`MESSAGE_Y_OFFSET = [-7, 9, -7]`, percent of panel height) — first
tuned with a uniform offset, which put "Storage." and "Infinite data
pools." close enough in on-screen space to visually overlap (the longer
label collided with its neighbor); alternating sides above/below the
stroke, caught and fixed via screenshot, resolved it cleanly.

Label text crossfades from the raw glitchy filename to the clean phrase
partway through arrival (`eased > 0.55`) — a hard `textContent` swap (same
idiom Section 1's caption beats already use) combined with a brief opacity
dip right at the swap (`1 - dip*0.55`, dip peaking at the threshold and
tapering either side), so the change reads as a dissolve rather than an
abrupt pop. Style also shifts on resolve (`.is-resolved` class): raw label
stays in the chip's normal JetBrains Mono (matches DESIGN-DEV-GUIDE.md
§2's typography role — mono signals raw metadata); resolved text switches
to DM Sans (signals human-readable prose) with an accent-tinted background/
border instead of the neutral chip look.

### 4. Noise chips: shrink and dissolve in place

The remaining 17 chips morph directly (no separate SVG-circle system, see
§2 above) from a bordered pill into a plain circular dot as they converge,
then fade out — same fade timing the pre-merge SVG nodes used (full
opacity through `convLocalRaw` 0.70, fading to 0 by 0.90). Padding,
font-size, and border-radius are interpolated every frame during
convergence (`shrink = eased`); border-radius grows well past the box's
own shrinking size at high `shrink`, which CSS clamps to a perfect circle
automatically, so no unit-mixing tricks were needed. When scrolling back
into the pure-chaos range (`eased ≈ 0`), all convergence-phase inline
style overrides are explicitly cleared (`style.padding = ''`, etc.) so the
chaos-phase CSS defaults (opacity via `--chaos-density`) take back over —
needed for correctness under scrolling back up, not just scrolling forward.

### 5. Velocity cap (direction doc §4 — the "warp speed" bug)

Root cause confirmed exactly as the direction doc described: `chip.vx *=
-1.8` on every `mouseenter`, uncapped, compounding multiplicatively across
repeated hovers, until a fast-enough chip crossed the 8%-margin wraparound
boundary in a single frame or two — reading as glitching through the
canvas.

Fixed with the direction doc's own preferred option — a bounded, decaying
perturbation, not just a smaller multiplier:

- `MAX_SPEED = 0.14` — a hard ceiling via `clampSpeed()`, applied to every
  hover kick regardless of the chip's current speed or how many times it's
  already been hovered. Verified with a script simulating 30 rapid
  re-hovers on the same chip: max per-frame displacement stayed at 0.135%
  of field width, right at the clamp ceiling, never growing across
  repeated hovers (the old formula would have produced exponential growth
  — base speed × 1.8³⁰ — well past a single-frame teleport by that point).
- Every chip also has a fixed `baseVx`/`baseVy` (its original random
  drift) that its live `vx`/`vy` eases back toward every frame
  (`c.vx += (c.baseVx - c.vx) * 0.02`), so a hover still perturbs a chip
  (kept deliberately — "things scatter when you touch them" is good and
  worth keeping, per the direction doc) but the field's total energy
  settles back down instead of ratcheting upward forever.
- Hover is also now gated to the chaos phase only (`if (lastProgress >=
  CONV_START) return;` inside the `mouseenter` handler) — a chip mid-
  convergence shouldn't be kickable, or the "magnetic anchor" read
  (chips resolving into a structured timeline) would break.

### 6. `prefers-reduced-motion`

Verified via a headless-browser pass with `reducedMotion: 'reduce'` set:
single static final frame renders correctly — all 3 message chips resolved
(clean text, `is-resolved` class present), all 17 noise chips at opacity 0,
path fully drawn (`strokeDashoffset: "0"`). Same guarantee the pre-merge
scenes had, preserved through the merge.

### 7. Found and fixed along the way (not in the direction doc's scope, but directly affecting this scene)

`.scene-maie-caption` (used by both "Fragmented. Scattered. Disconnected."
and "The noise fades..." — now inside the merged scene) still had
`white-space: nowrap`, overflowing badly on narrow viewports (clipped on
both sides under ~450px) — the same class of bug `.scene-caption` was
fixed for in §12, just never applied here since this class wasn't touched
in that round. Fixed the same way: `white-space: normal` +
`max-width: min(90vw, 560px)`. Found via the mobile-viewport screenshot
pass while verifying this merge, not part of the original ask.

### Validation performed

`node --check` on all JS; HTML tag-balance and CSS brace-balance checks —
clean. Headless-Chrome + local-server pass covering: structural check (old
section IDs gone, merged ID present, chip/message counts correct);
progress sweep from 0 to 1 reading live DOM state (message text content,
`is-resolved` state, positions, noise-chip opacity/font-size, path filter)
at 10 points, confirming correct ordering and timing; a dedicated velocity-
cap script simulating 30 rapid re-hovers; a dedicated reduced-motion pass;
a 390px mobile-viewport pass at multiple progress points plus a theme-
toggle spot check. Screenshotted throughout — two real issues (the
`capBefore` bleed-through bug in §1, the message-bubble overlap in §3) were
caught this way, not from code review, and fixed before calling this done.

---

## 15. Changelog — Section 2 photo swap

Photo swapped from `makabera-pop-up-9977615_1920.jpg` to
`media/staircase-by-robert-schwarz.jpg` (the Escadaria Selarón mosaic
staircase in Rio, tilt-shift). Two things needed fixing beyond the `src`
swap, caught before shipping rather than after:

- **File weight.** Source was 6.3MB at 4672×7008 — the image only ever
  displays at `width: min(64vw, 620px)` (`.frame-stage`), so a
  multi-megapixel portrait original was pure waste on a landing page's
  second scroll section. Resized to 1000×1500 (`convert -resize 1000x
  -quality 82 -strip`), bringing it down to 274KB — comparable to the
  photo it replaced (435KB), generously above what's needed even at 2x
  for retina given the display cap.
- **Crop.** The photo is a tall portrait; `.frame-photo-wrap` is a 3:2
  landscape box with `object-fit: cover`. A plain center crop
  (`object-position`'s default 50% 50%) would only show the vertical
  middle ~44% of the source — mostly the buildings above the staircase,
  cropping out most of the steps themselves, the actual subject. Added
  `object-position: 50% 68%` to `.frame-photo` to bias the crop down
  toward the staircase and mural. Verified via a headless-browser
  screenshot, not just by inspecting the crop math — the mosaic steps,
  the mural face, and the colorful buildings on both sides all land in
  frame together.

---

## 16. Changelog — nav mobile wrap fix

There was **no responsive handling for `.nav` at all** before this —
`.nav-links`' four items (Trust, Pitch Deck, theme toggle, primary CTA)
just overflowed the fixed 64px bar at phone widths, wrapping text inside
flex items and overlapping page content underneath. First noticed during
the Sections 5+6 merge's mobile testing (§14), fixed as its own pass.

**Approach:** collapse the two secondary links into a disclosure panel
rather than reaching for a full hamburger menu — the theme toggle and
primary CTA are important enough to stay always visible, and Trust/Pitch
Deck are secondary enough (Trust is just an in-page anchor a mobile
visitor would reach by scrolling anyway) to tuck behind a toggle instead.

- **New markup:** `#nav-secondary` wraps the Trust/Pitch Deck links;
  `#nav-more-toggle` ("⋯") is the disclosure button, `aria-expanded` +
  `aria-controls`-wired to it.
- **New file `nav-menu.js`:** open/close on click, closes on click-away,
  Escape, or clicking a link inside (Trust is an in-page anchor — without
  this the panel would stay open floating over whatever section the
  visitor just jumped to). No-ops entirely above the breakpoint since the
  toggle button is `display:none` there.
- **CSS, two breakpoints, both measured against the actual page, not
  guessed:**
  - `@media (max-width: 640px)`: `.nav-secondary` becomes the disclosure
    panel (`position:absolute`, hidden until `.is-open`); `#nav-more-
    toggle` becomes visible; theme toggle drops its text label (icon
    only, `.nav-theme-label`).
  - `@media (max-width: 359px)`: even with the above, "Join the Exchange"
    still wrapped onto two lines, clipped against the nav's fixed 64px
    height. Measured the actual failure range with a script rather than
    guessing a breakpoint: wraps through 350px, clean at 360px. Fixed by
    dropping the "MAIE" wordmark (icon stays) at ≤359px — cheaper than
    shortening the CTA's actual copy, and doesn't touch marketing
    language to solve a layout problem.
  - `.nav.nav--on-dark .nav-secondary` also themed to match — the panel
    otherwise uses `var(--surface)` (follows the light/dark toggle, not
    force-dark), which would have looked wrong opened while pinned over
    `#scene-chaos-signal` in light mode.

**Validation:** measured (not eyeballed) across 320/360/390/430/640/700/
860/1024/1440px — confirmed no horizontal overflow and correct
toggle-visibility switch at every width via a script reading actual
`getBoundingClientRect()`/`getComputedStyle()` values, not just
screenshots. Interactive test at 320/360/390px: panel opens, closes on
clicking the Trust link inside, closes on click-away. Desktop (1440px)
screenshotted in both themes to confirm zero visual regression — nav is
pixel-identical to before at desktop widths. One test-methodology note
worth keeping: an initial pass wrongly flagged 390px as "wrapped" too,
using a height-based heuristic (`> 20px`) that didn't account for
`.nav-cta`'s own single-line height already being ~27px given its
padding — caught by looking at the actual screenshot instead of trusting
the heuristic, not by re-deriving the CSS math.

---

## 17. Changelog — Section 4 built (The Human Hand)

Real documentary/editorial photography was sourced (30 `made-by-*.jpg`
files added to `media/`), unblocking the last remaining "needs real
content" item that wasn't gated on internal product data. Built as
`scene-human-hand.js` + new CSS block + a new `<section id="scene-human-
hand">` inserted between Sections 3 and 5 in `index.html`, restoring the
brief's original 12-section order (it had been sitting adjacent in DOM
order since Sections 5/6 don't need Section 4 for anything technical —
this was purely a content gap, not a structural one).

### Curation — 30 photos down to 7

Cataloged all 30 sourced photos before selecting. Three excluded as
off-brand, flagged explicitly rather than silently dropped:
- A wealth/lifestyle mood board (PayPal balances, cash, a passport) —
  reads as influencer content, contradicts the section's documentary,
  humble-craft ethos entirely.
- A crochet/craft desk with a dog — real, but fiber craft, not media
  production; off-topic for this page.
- A real but empty office with no human presence — the section is
  specifically "The Human Hand"; a person-less workspace doesn't serve it.

Final 7, sequenced to loosely follow the brief's own list order, sourced
mostly from two cohesive editorial series (a colorist grading suite shoot
and a vintage indie-film-production shoot) plus standalone shots for
variety of setting/media type:

| # | File | Brief beat | Caption |
|---|---|---|---|
| 1 | `made-by-fari-14122231.jpg` | "A hand holding a camera" | "A hand, holding the shot before it's taken." |
| 2 | `made-by-nicolas-rueda-175965148-15713296.jpg` | "Someone editing at 2 AM" | "Still awake. Still cutting." |
| 3 | `made-by-ron-lach-8089248.jpg` | "A filmmaker reviewing a frame" | "One frame, checked, and checked again." |
| 4 | `made-by-john-taran-166597215-11044765.jpg` | (audio craft, not in brief's list — added for media-type variety) | "A sound, built by hand." |
| 5 | `made-by-ron-lach-8100065.jpg` | "A designer adjusting a curve by one pixel" (literal DaVinci curves panel visible) | "A curve, adjusted by one degree." |
| 6 | `made-by-ron-lach-8035286.jpg` | "A producer organizing thousands of files" (story-structure index cards) | "A story, still finding its order." |
| 7 | `made-by-ron-lach-8102680.jpg` | "A creative team debating one shot" (two colorists, one pointing) | "Two people. One shot. A hundred small decisions." |

All 7 resized from their original 4000-6720px/1.2-4.7MB sourced
dimensions down to a 2000px long edge at quality 80 (`convert -resize
2000x2000 -quality 80 -strip`) — full-bleed images need more resolution
than Section 2's capped-width photo, but the originals were still far
larger than any display needs. Final sizes: 141-414KB each, ~1.8MB total
for the section. The other 23 sourced photos were left in `media/`
unused, not deleted, in case a future section wants them.

### Structure

One `.story-scene` (`height: 480vh` — deliberately the most generous
per-beat pacing on the page: ~480vh/7 photo-beats ≈ 68vh/beat, more than
`scene-opening`'s 380vh/6-beat ≈ 63vh or `scene-lifecycle`'s 420vh/8-stage
≈ 52.5vh, since the brief explicitly calls this section out as where "the
experience should deliberately slow down"). No idle `requestAnimationFrame`
loop — pure scroll-driven crossfade only, matching Reflection mode's
"silence" rather than continuous ambient motion.

The brief's own thesis line — "Technology does not create meaning. People
do." — is split across the scene: "Technology does not create meaning."
alone on black at the very start (progress 0.0-0.06), then the 7 photos
crossfade through evenly (progress 0.08-0.92), then "People do." resolves
over the final photo (0.96-1.0). The **last photo's fade window extends to
progress 1.0 with no fade-out** (same "final beat holds" convention as
`scene-opening.js`'s data-fields stage and `scene-chaos-signal.js`'s
resolved message chips) — without this, a visitor under `prefers-reduced-
motion`, who only ever sees the single settled frame at progress=1, would
see a blank frame with "People do." floating over nothing. Caught and
fixed before shipping, not after.

Each photo also gets a very subtle zoom (`scale(1 + weight*0.035)`) tied
directly to its own crossfade weight — no separate animation system, just
reusing the opacity value already being computed every frame.

### Not force-dark, but hardcoded white text

Unlike Sections 5+6, this section is **not** `force-dark` — it's not
mandated a specific dark mood-color by the brief, so per this project's
own convention it should respect the light/dark toggle. But the caption
and thesis text are hardcoded white with a scrim gradient + text-shadow,
not theme tokens — the one case on this page where text sits over a real
photograph (variable brightness/color) rather than the page's own
background, so `var(--text-1)` couldn't reliably stay legible against
every photo regardless of toggle state the way it does everywhere else.
Verified in both themes: the nav and rest of the page respond to the
toggle normally; the photography itself (correctly) doesn't change.

### Validation

`node --check`, HTML tag-balance, CSS brace-balance — clean. Headless-
browser pass: read live DOM opacity/caption state at 7 progress points
end-to-end (confirmed correct photo-to-caption mapping and the thesis
bookend timing, including the reduced-motion-relevant progress=1 state);
screenshotted the opening thesis, a mid-sequence photo, and the closing
thesis-over-final-photo composite; confirmed light-mode (nav toggles,
photo/caption intentionally doesn't) and a 390px mobile viewport (caption
wraps correctly, `object-fit: cover` crops sensibly, works cleanly
alongside the §16 nav collapse).

---

## 18. Changelog — verified security record added to Trust (not Section 11)

A 4th `.reflect-item` was added to the existing `#trust` section
("Built to Be Trusted"), not to the brief's Section 11 ("Story Becomes
Data" — still `⛔ Not started`, see §5). Worth recording the reasoning,
since the two were briefly conflated mid-discussion:

**Why not Section 11.** The brief's Section 11 is specifically a *scale*
visualization — "one creator becomes 12 projects becomes 4,200 assets...
an entire creative history" — real usage numbers growing organically.
That data doesn't exist yet (the actual reason it's blocked — see §5/§6
item 4). A verified pre-launch security record is a different kind of
claim (rigor, not creative-activity scale) and forcing it into a scene
built for the brief's specific relationship-visualization concept would
have stretched that concept to fit data it wasn't designed for.

**Why Trust.** The three existing Trust items (SHA-256 verification,
per-project storage, migration-safety) are already exactly this register
— technical trust signals in plain language. A verified security record
is the same *kind* of claim through a different mechanism, so it extends
already-shipped content instead of introducing new scene architecture.

**Sourcing and verification, for the record:** the codebase at
`/home/xzavier/Desktop/MAIE_Framework_2.0` has a dated (2026-07-19 through
2026-07-23) sequence of 18 `*_FIX_*.md` documents. A dedicated pass
verified each one individually (not just the filenames): 14 are confirmed
security/data-isolation fixes with real before/after evidence (a blocked
unauthorized attempt, then a working legitimate one) — not bare
assertions. 3 more are real, verified fixes but not security-relevant
(billing/reliability correctness) — excluded from this count. 1 document
was raw command output, not a real fix record — excluded entirely. The
team separately confirmed these were reported to an auditor and, in some
cases, live-verified directly — the independent-re-verification caveat
this pass originally flagged as a blocker before shipping any public
number was resolved on that basis, not silently dropped.

**Copy added** (`index.html`, matching the existing three items' voice —
benefit-first headline, plain-language body, technical detail as a
supporting kicker rather than leading with jargon, per the audit fix this
section already went through — see §11):

> **Held to Its Own Standard**
> Before anything shipped, the system was put through its own audit —
> real attempts to access what shouldn't be reachable, tracked down and
> closed one by one.
> *14 security & data-isolation issues, found and resolved pre-launch*

Verified via headless-browser screenshot at desktop and 390px mobile —
the longer kicker string (a full sentence, versus the other three items'
short phrases) wraps cleanly at both widths without breaking the
established pattern. `node --check` N/A (no JS changed); HTML tag-balance
clean.

---

## 19. Changelog — pre-production audit fixes (Blockers, Majors, and low-risk Minors/Nits)

Implements every Blocker and Major finding from the pre-production audit
(`joinmaie-landing-preproduction-audit-report.md`), plus the two Minor
findings that didn't need live-browser confirmation and the one stale-
comment Nit. The three findings requiring live-browser confirmation
(Section 4's transitional thesis/photo contrast, and the general "verify
in a real browser" caveat on everything else) are intentionally **not**
claimed as fixed here — see that report's updated sign-off table below.

### Doc-exposure Blocker — gitignored, not relocated

`DESIGN-DEV-GUIDE.md`, `maie-narrative-audit.md`, and
`chaos-to-signal-merge-direction.md` were not gitignored, meaning they'd
be committed and served as public static files on Cloudflare Pages (this
is a zero-build site — everything in the repo root ships as-is). Added
all three to `.gitignore`, alongside the pre-existing `maie-git-workflow.md`
entry.

**Gitignored rather than relocated**, for two reasons: (1) these docs
cross-reference each other by bare filename in prose ("see
chaos-to-signal-merge-direction.md") — moving them into a subdirectory
wouldn't break those references (they're plain text, not links), but
keeping them at the repo root preserves the layout the team already
navigates by, with zero risk of typo'd new paths; (2) `.gitignore` is the
smaller, more obviously-reversible change — if the team later decides
these should ship (e.g. behind an internal-only route), un-ignoring is a
one-line revert, whereas undoing a file move means re-threading every
cross-reference. `git check-ignore` wasn't run to confirm (git commands
are off-limits per this session's constraints); verified instead by
inspecting `.gitignore` directly — all three are exact, unambiguous
filename patterns at the repo root, so there's no glob-matching ambiguity
to double-check.

### Pixie companion — `update()` now repaints under reduced motion

`initPixieCompanion` (`pixie-companion.js`) drew exactly one frame under
`prefers-reduced-motion` and canceled its own next `requestAnimationFrame`
— correct in isolation, but `update()` (the hook both `companion-intro`'s
theme-toggle listener and `scene-agent`'s per-step scroll updates rely on)
only ever reassigned closure variables that the now-dead animation loop
would have read. Every `update()` call after the first paint was a silent
no-op under reduced motion — the canvas stayed frozen on its init-time
state regardless of later theme toggles or scroll progress, contradicting
§11's claim that both call sites are theme-aware.

Fixed by extracting `animate()`'s draw body into `renderFrame()`;
`animate()` now just calls `renderFrame()` and reschedules itself.
`update()` calls `renderFrame()` directly whenever `reducedMotion` is
true, so a theme-toggle or scroll-driven patch repaints immediately
instead of waiting for a RAF loop that no longer exists.

**Verified by executing the real file**, not just re-reading it: a Node
harness (`pixie_reduced_motion_test.js`) loads the actual
`pixie-companion.js` source against minimal `canvas`/`window` shims with
`matchMedia` forced to reduced-motion and `requestAnimationFrame` stubbed
to never auto-fire, then counts `ctx.clearRect` calls (one per real
repaint) across init + two `update()` calls. Before this fix the count
would plateau at 1; after the fix it advances 1 → 2 → 3, proving each
`update()` triggers a genuine repaint.

### Theme toggle — aria-label synced on load, localStorage guarded

Two related fixes in `theme.js`:

- **aria-label sync on load.** `applyTheme(saved)` ran on load but nothing
  updated `#theme-toggle`'s `aria-label` to match — only the click handler
  did. A returning visitor with a saved `light` preference got a control
  whose accessible name still said "Switch to light mode" while the page
  had already loaded light. Extracted the label logic into
  `setToggleLabel()`, now called once on `DOMContentLoaded` (using the
  same `saved` value `applyTheme` used) in addition to on every click.
- **Guarded `localStorage`.** Neither `getItem` nor `setItem` had any
  error handling; in a storage-blocked context (Safari "Block All
  Cookies," some private-browsing/enterprise configs) a thrown
  `SecurityError` on the load-time `getItem` call would abort the whole
  IIFE before the click listener was ever registered — breaking the
  toggle entirely instead of degrading to the default theme as intended.
  Wrapped both calls (`readSavedTheme()`/`writeSavedTheme()`) in
  `try/catch`, falling back to `'dark'` and no-op-ing persistence on
  failure.

**Verified by executing the real file** against DOM/`localStorage` shims
(`theme_test.js`) across three scenarios: default load, a returning
visitor with a saved `light` preference, and a storage-blocked context
(`getItem`/`setItem` both throw). All three now load without error, apply
the correct theme, show the correct aria-label immediately on
`DOMContentLoaded` (not just after a click), and the toggle still works
via click in every case, including the storage-blocked one.

### Accessibility — unlabeled canvases

`#scene-opening-canvas` and `#agent-pixie-canvas` had neither
`aria-hidden="true"` nor an accessible name, unlike `#pixie-canvas`
(`aria-label="Pixie companion" role="img"`) — both are purely
decorative/generative, with their content already carried by adjacent
caption/detail text. Added `aria-hidden="true"` to both, matching the
existing pattern used everywhere else on the page for decorative
canvas/SVG.

### Production readiness — OG/Twitter/canonical/robots/404/sitemap

Favicon was already fixed in an earlier session pass; this closes the
rest of §E's "missing entirely" list:

- Open Graph + Twitter Card tags (`og:title`/`og:description`/`og:image`
  at 1200×630 + width/height hints, `twitter:card=summary_large_image`
  + matching title/description/image) — `index.html` `<head>`.
- `<link rel="canonical" href="https://joinmaie.com/">` and
  `<meta name="robots" content="index, follow">` — this is the live
  marketing page, not a staging build, so an allow-all/index directive is
  the launch-appropriate one.
- New `og-image.png` (1200×630, the real nav mark on the dark-theme `--bg`
  background, recolored to the actual `--brand-light`/`--accent` hex
  values since a rasterized share image can't reference CSS custom
  properties) — same technique `scene-opening.js` already uses for its
  canvas colors, just done once at build time via ImageMagick instead of
  per-frame via `getComputedStyle`.
- New `robots.txt` (allow-all, points at the sitemap) and `sitemap.xml`
  (single entry — this is a one-page site).
- New `404.html` — reuses `styles.css`'s tokens/fonts and the real nav
  brand mark/theme toggle (via `theme.js`) for visual consistency, but
  intentionally does **not** load `nav-menu.js`/`nav-theme.js`/any scene
  script, since there's nothing on this page for them to attach to.
  `<meta name="robots" content="noindex, follow">` — a 404 page shouldn't
  itself be indexed.

**Verified** via the same local-static-server method the audit used:
`GET /robots.txt`, `/sitemap.xml`, `/404.html`, `/og-image.png` all now
return `200` (previously `404`/absent); grepped `index.html` for
`og:`/`twitter:`/`canonical`/`name="robots"` and confirmed all now present
(previously zero matches).

### Minor fixes

- **`.bg-orb-2`'s hardcoded hex** (`styles.css`) — left as a hardcoded
  value rather than tokenized (inventing a new design token for one
  background element felt like a design decision beyond this fix's
  scope), but documented with a comment explaining it's deliberately
  theme-invariant, unlike `.bg-orb-1`/`.bg-orb-3`.
- **Duplicate photo deleted.** `media/made-by-ron-lach-8100063 (1).jpg`
  was a confirmed byte-identical duplicate (`md5sum` match) of
  `media/made-by-ron-lach-8100063.jpg`, unreferenced by either name
  anywhere in the DOM/JS. Deleted the parenthesized copy.
- **`nav-theme.js`'s header comment** updated — it described "Sections 1,
  5, and 6" as force-dark, stale since §10 (Section 1 dropped force-dark)
  and §14 (5+6 merged into one scene). Now describes the current
  single-force-dark-scene state; the code itself was already correct
  (dynamically queries `.story-scene.force-dark`), so this was
  comment-only.

### Not fixed in this pass (needs live-browser confirmation first)

Section 4's transitional-frame legibility risk (thesis text briefly
overlapping a low-contrast photo during the fade-out/fade-in handoff) was
left as-is — the audit report itself recommended live-render confirmation
before changing the timing, since the fix (shortening a fade window or
shifting `PHOTO_START`) risks its own new timing bugs without being able
to see the actual result. Everything in the audit's "Blocked" sign-off
rows (screenshot-based visual QA, live screen-reader pass, live
OS-level reduced-motion toggle test, real scroll-jank profiling) remains
unverified for the same reason it was unverified originally: no
browser-automation tooling is available in this environment.

### Validation performed

`node --check` on all changed `.js` files (`pixie-companion.js`,
`theme.js`, `nav-theme.js`) — clean. HTML tag-balance (`index.html`,
`404.html`) and CSS brace-balance (`styles.css`) — clean, unchanged from
before this pass. Every finding above was re-verified using the same
method the audit report used to find it (re-running that finding's own
"How to reproduce" steps), not just re-read from the diff — see each
subsection above for the specific method (local static server, direct
`.gitignore` inspection, or executing the real source against minimal
DOM/canvas shims in Node). Full local asset-resolution sweep re-run
afterward across every real asset reference in the repo (favicons,
media, all `.js`/`.css`, plus the new `404.html`/`robots.txt`/
`sitemap.xml`/`og-image.png`) — 100% `200`, zero regressions introduced.
