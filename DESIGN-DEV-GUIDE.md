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
| `reveal.js` | Fade-in-on-scroll for the simple `[data-reveal]` sections (hero/toolkit/trust/journey/paths) + the side progress rail |
| `story-scroll.js` | Shared scroll-progress engine for **story scenes** — read this before building a new cinematic section |
| `scene-opening.js` | Section 1 |
| `scene-universe.js` | Section 3 |
| `scene-chaos.js` | Section 5 |
| `scene-maie-moment.js` | Section 6 |
| `scene-lifecycle.js` | Section 7 |
| `scene-agent.js` | Section 8 |
| `pixie-companion.js` | Real ported companion engine (see §5). Now also exposes an `update(patch)` hook on the object `initPixieCompanion` returns — `{ destroy, update }` — so mode/phase/temperament can change live post-init. Existing static call sites (the hero) are unaffected; they just never call `update()`. |

### Two section types — don't confuse them
1. **Reveal sections** (`hero`, `toolkit`, `trust`, `journey`, `paths`) — simple fade/rise into view via `reveal.js`'s `IntersectionObserver`. Add `data-reveal` + `data-rail-label` and it's automatically wired into the side progress rail. Use this for any non-cinematic content section.
2. **Story scenes** (Sections 1, 5, 6 so far) — tall wrapper (`height: 250vh` convention) with a `position: sticky` inner panel (`.scene-sticky`, pinned to 100vh). `story-scroll.js`'s `initScrollScene(sectionEl, onProgress)` reads scroll position and reports `progress` 0→1 as the user scrolls through the wrapper's full height — **never sets scroll position**, so native scroll/momentum is untouched (no scroll-jacking, per the brief's own requirement). Story scenes are *not* wired into the side rail currently — that's a deliberate gap, not an oversight (a rail dot mid-cinematic-scene would undercut the immersion), but worth a second look if the whole page ends up mostly story scenes.

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
| 1 | Before the Media | Immersion | ✅ Built | `scene-opening.js` | Nav auto-hides for first 50% of scroll depth per brief |
| 2 | One Moment | Exploration | ⛔ Not started | — | **Needs a real photo/frame asset** to fracture — can't fabricate |
| 3 | Universe to You | Revelation | ✅ Built | `scene-universe.js` | DOM+CSS transforms, not canvas text — no raster blur at scale. Categories/atoms use a deterministic ring layout, not real data — swap in real domain/primitive taxonomy if it ever changes |
| 4 | The Human Hand | Reflection | ⛔ Not started | — | **Needs real documentary photography** — can't fabricate |
| 5 | Chaos of Creation | Immersion | ✅ Built | `scene-chaos.js` | See open item below re: feeding Section 6 |
| 6 | Everything Connects | Revelation | ✅ Built (placeholder input) | `scene-maie-moment.js` | Chaos nodes currently spawn at arbitrary scatter positions, **not** Section 5's actual chip positions — open item, see §6 |
| 7 | Media Lifecycle (8 stages) | Exploration | ✅ Built | `scene-lifecycle.js` | Horizontal filmstrip driven by vertical scroll progress (translateX only) — no real horizontal scroll, no scroll-jacking |
| 8 | Agent Workflow | Revelation | ✅ Built | `scene-agent.js` | Reuses `pixie-companion.js` via its new `update()` hook — same engine as the hero, not a lookalike. Path is a placeholder wave shape, not a designed signal path — worth a second pass if the exact curve matters |
| 9 | Marketplace | Exploration | ⛔ Not started | — | **Needs real package/LUT/workflow preview content** |
| 10 | Creator Passport | Reflection | ⛔ Not started | — | **Needs a real sample media + provenance hash example** |
| 11 | Story Becomes Data | Exploration | ⛔ Not started | — | **Needs real or plausible platform metrics** to animate honestly |
| 12 | World Opens / Closing Loop | Immersion | ⛔ Not started | — | Depends on Section 1 (done) and ideally Section 11's network visual existing first |

---

## 6. Open Decisions — need a call before continuing

1. **The hybrid-page problem.** Pre-brief sections (`hero`, `toolkit`,
   `trust`, `paths`) are still in the page, and they're exactly what
   §3's anti-pattern list rules out. Continuing to add brief-sections
   around them means redoing the surrounding page twice. Not resolved.
2. **Section 5 → 6 handoff.** Section 6's chaos nodes should probably
   inherit Section 5's actual chip positions at the scroll boundary
   between them, instead of generating their own arbitrary scatter.
   Real coupling between two files — worth doing deliberately.
3. **Forced-dark backdrop in story scenes.** Sections 1/5/6 ignore the
   site's light/dark toggle by design (cinematic beats). Confirmed
   intentional in review, but flagging again here since it's a real
   inconsistency a new team member would otherwise "fix" by accident.
4. **Six sections need real assets** (2, 4, 9, 10, 11 need photography/
   media/metrics; 3 does not but is asset-adjacent). These can't be
   scaffolded further without that material — worth sourcing in
   parallel with the sections that don't need it (3, 7, 8).

---

## 7. Suggested Build Order (unblocked work first)

Sections 3, 7, and 8 are now built (see §5). Everything remaining
(2, 4, 9, 10, 11, 12) is blocked on real content — photography, sample
media, marketplace previews, or platform metrics — arriving first.
Section 12 additionally wants Section 11's network visual to exist
before it's worth building.

Two things worth a second look now that 3/7/8 exist, not urgent:
- Section 3's category/atom lists are hardcoded in `scene-universe.js`,
  not pulled from anywhere — fine for now, but worth flagging if the
  product's actual domain taxonomy or primitive list is expected to
  change independently of this page.
- Section 8's path shape in `index.html` is an arbitrary wave, not a
  designed curve — cheap to swap once there's a specific line to match.
