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
| `nav-theme.js` | Darkens the nav bar whenever it's pinned over a `.story-scene.force-dark` scene (Sections 1/5/6 only — see §6 item 3), independent of the light/dark toggle |
| `reveal.js` | Fade-in-on-scroll for the simple `[data-reveal]` sections (companion-intro/toolkit/trust/journey/paths) + the side progress rail |
| `story-scroll.js` | Shared scroll-progress engine for **story scenes** — read this before building a new cinematic section |
| `scene-opening.js` | Section 1 |
| `scene-frame.js` | Section 2 |
| `scene-universe.js` | Section 3 |
| `scene-chaos.js` | Section 5 |
| `scene-maie-moment.js` | Section 6 |
| `scene-lifecycle.js` | Section 7 |
| `scene-agent.js` | Section 8 |
| `pixie-companion.js` | Real ported companion engine (see §5). Now also exposes an `update(patch)` hook on the object `initPixieCompanion` returns — `{ destroy, update }` — so mode/phase/temperament can change live post-init. Existing static call sites (the hero) are unaffected; they just never call `update()`. |

### Two section types — don't confuse them
1. **Reveal sections** (`companion-intro`, `trust`, `paths`) — simple fade/rise into view via `reveal.js`'s `IntersectionObserver`. Add `data-reveal` + `data-rail-label` and it's automatically wired into the side progress rail. Use this for any non-cinematic content section. `companion-intro` replaced the old two-button `hero` — see §6 item 1 for why. `toolkit` and `journey` were retired in the §11 changelog round — see there for why.
2. **Story scenes** (Sections 1, 2, 3, 5, 6, 7, 8 — all built so far) — tall wrapper (`height: 250vh` convention) with a `position: sticky` inner panel (`.scene-sticky`, pinned to 100vh). `story-scroll.js`'s `initScrollScene(sectionEl, onProgress)` reads scroll position and reports `progress` 0→1 as the user scrolls through the wrapper's full height — **never sets scroll position**, so native scroll/momentum is untouched (no scroll-jacking, per the brief's own requirement). Story scenes are *not* wired into the side rail currently — that's a deliberate gap, not an oversight (a rail dot mid-cinematic-scene would undercut the immersion), but worth a second look if the whole page ends up mostly story scenes.

   **Only add `class="story-scene force-dark"` if the brief explicitly mandates a specific dark mood-color for that section** (as it does for Sections 1, 5, 6 — see §6 item 3). Otherwise use `class="story-scene"` alone and build the scene's CSS with `var(--bg)`/`var(--surface)`/`var(--text-1)`/`var(--text-2)`/`var(--accent)` tokens, same as a reveal section, so it respects the light/dark toggle. Sections 2, 3, 7, 8 all do this now — check their CSS blocks as the reference before writing a new scene's styles, not Section 1/5/6's.

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
| 2 | One Moment | Exploration | ✅ Built | `scene-frame.js` | Fracture-growth technique instead of literal slice-translation (steadier across aspect ratios). Photo is `media/makabera-pop-up-9977615_1920.jpg` — arbitrary pick, any photo works per the brief; swap freely. Reuses the Signal-line device from Sections 1/6 |
| 3 | Universe to You | Revelation | ✅ Built | `scene-universe.js` | DOM+CSS transforms, not canvas text — no raster blur at scale. Categories/atoms use a deterministic ring layout, not real data — swap in real domain/primitive taxonomy if it ever changes |
| 4 | The Human Hand | Reflection | ⛔ Not started | — | **Needs real documentary photography** — can't fabricate |
| 5 | Chaos of Creation | Immersion | ✅ Built | `scene-chaos.js` | See open item below re: feeding Section 6 |
| 6 | Everything Connects | Revelation | ✅ Built | `scene-maie-moment.js` | Nodes now inherit Section 5's real chip positions via `window.getChaosChipPositions()`, captured once at first scroll-into-view — falls back to random scatter if Section 5's script isn't present |
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
2. **Section 5 → 6 handoff — resolved: wired.** `scene-chaos.js` exposes
   `window.getChaosChipPositions()`; `scene-maie-moment.js` calls it
   once, the first time it scrolls into view, and converts Section 5's
   percent-based field coordinates into its own SVG viewBox units. If
   Section 5's script isn't loaded for some reason, it falls back to
   the old random scatter, so Section 6 still works standalone.
3. **Forced-dark backdrop — resolved: split, not all-or-nothing (updated
   again this round — see §10).** Only Sections 5 and 6 keep the
   forced-dark backdrop (`class="story-scene force-dark"`) now — Section
   1 dropped it too, after being reported dark/flat in light mode (see
   §10). Sections 2, 3, 7, 8 were converted to use `var(--bg)`/
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

4. **Four sections still need real content.** 9, 10, and 11 need
   product content (marketplace previews, a real provenance/hash
   example, real or plausible platform metrics) that photography can't
   substitute for. Section 4 was checked against the 10 photos added
   and remains blocked too: the brief calls for documentary shots of
   people mid-craft — an editor at night, a colorist adjusting a grade
   — and what's on hand is portraits/nature/product shots, none of it
   "creator at work." Worth sourcing all four in parallel with 12,
   which depends on 11.

---

## 7. Suggested Build Order (unblocked work first)

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
