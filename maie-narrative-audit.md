# MAIE Landing Page — Narrative, Emotional, Visual & Theme-System Audit

Audited: `joinmaie-landing`, against `MAIE Landing Page Concept.pdf` (the founding creative brief) and `DESIGN-DEV-GUIDE.md` (the project's decision log). All findings below are checked against the guide first — anything already resolved or explained there is cited, not re-litigated.

---

## 0. Known Incomplete Sections (context, not a finding)

Per `DESIGN-DEV-GUIDE.md` §5/§7, **7 of the brief's 12 sections are built**; 5 are deferred, all content-blocked (not storytelling-blocked):

| # | Brief section | Status | Blocked on |
|---|---|---|---|
| 4 | The Human Hand | ⛔ Not started | Real documentary photography of creators mid-craft (what's on hand — portraits/nature/product shots — was explicitly checked and rejected) |
| 9 | The Marketplace | ⛔ Not started | Real package/LUT/workflow preview content |
| 10 | Creator Passport | ⛔ Not started | A real sample media + provenance/hash example |
| 11 | The Story Becomes Data | ⛔ Not started | Real or plausible platform metrics, to animate honestly |
| 12 | The World Opens | ⛔ Not started | Section 11's network visual existing first |

Any gap traceable to one of these five is referenced back to this table rather than re-argued as a craft failure elsewhere in this document. Two additional pieces of context from the guide, so they aren't mistaken for bugs during this audit:

- **Section 1's opening animation is a one-shot intro gated to play once per page load**, not once per scroll-visit (`scene-opening.js`, `ignitionDone`). Scrolling away and back does not replay it. Evaluated below as a design choice, not flagged as broken.
- **Sections 5 and 6 keep a forced-dark backdrop regardless of the theme toggle, by deliberate decision** (guide §6 item 3, §2 mood-color table). This is evaluated for whether the decision still holds up, not reported as an oversight.

---

## 1. Executive Summary

The page tells the brief's story faithfully for its first five built beats (Sections 1, 2, 3, 5, 6) — this is a real, well-executed *Impulse → Frame → Universe → Chaos → Resolution* arc, anchored by one genuinely excellent piece of craft: Section 6's converging nodes trace the *exact same SVG path string* as the nav logo, so the MAIE mark visibly assembles itself out of Section 5's actual chaos, exactly as the brief specifies ("discovered inside the system, rather than simply placed on top of it"). The **biggest narrative gap** is structural, not missing content: immediately after that crescendo, the DOM drops into four consecutive legacy sections (`companion-intro`, `toolkit`, `trust`, `journey`) that restate the just-shown resolution in generic SaaS-benefit language, duplicate ground Section 7 covers better, and reintroduce the "early ask" register the team deliberately removed from the hero. The **biggest visual/theme gap** is that neither Pixie-companion instance on the page (hero or Section 8) is theme-aware, despite the engine already supporting a `theme` option — a page-wide gap the guide only scoped to Section 8. The **biggest copy/voice gap** is `toolkit`'s benefit-headline copy ("Never Lose a Moment," "Outsource the Chaos") — it restates, in flatter language, what Section 6 just made the visitor *feel*, which is the one clear instance of "explaining after showing" undercutting itself. The single change most likely to improve the experience: **rework the DOM position and tone of the four legacy reveal sections relative to Section 6→7**, since that seam is where the page's momentum currently breaks hardest.

---

## 2. Narrative Storyboard

DOM order, as implemented today.

| Order | Section ID | What the visitor experiences | Emotional beat | Pain established? | Solution introduced? | Brief principle | Pain-first / Feature-first / Neutral | Key finding |
|---|---|---|---|---|---|---|---|---|
| 1 | `scene-opening` | A single point of light ignites, then morphs through pulse → line → frame-grid → waveform → timeline → data fields | Existential curiosity, mystery | No (deliberately) | No | Brief §1, Immersion | Neutral | Faithful to brief; see §6 for the light-mode trade-off |
| 2 | `scene-frame` | A photo's metadata fractures open as the visitor scrolls; a signal-line ticks alongside | Discovery, "there's more here than I thought" | No | No (sets up "the unit of media") | Brief §2, Exploration | Neutral | Strong, restrained execution |
| 3 | `scene-universe` | "MEDIA" fractures into domains, then primitives, then re-clusters into "Your Project" | Scale, orientation | No | Implied only | Brief §3, Revelation | Neutral | Good macro→micro payoff |
| — | *(Brief §4, The Human Hand, not built)* | — | — | — | — | — | — | See §0 |
| 4 | `scene-chaos` | Fragmented files, sync conflicts, storage alerts drift and multiply; hovering makes them scatter further | Overwhelm, recognition | **Yes — strongly** | No | Brief §5, Immersion | Pain-first | One of the page's best sections; see gap re: AI-tool clutter, §4 |
| 5 | `scene-maie-moment` | The same chaotic elements converge onto the MAIE signal-path; "The noise fades... you return to the edit" | Relief, resolution | (carried over) | **Yes — visually** | Brief §6, Revelation | Pain-first | Standout execution — see §7 |
| 6 | `companion-intro` | "The burden of the infinite project, lifted" + Pixie | Reassurance | Restated, not re-felt | Yes, in prose | *(not in brief's 12)* | Feature-first (restates §5/6) | Redundant with the beat just delivered visually |
| 7 | `toolkit` | Three benefit headlines: Never Lose a Moment / Total Project Clarity / Outsource the Chaos | Reassurance | No | Yes | *(not in brief's 12)* | **Feature-first** | Weakest copy block on the page — see §5 |
| 8 | `trust` | SHA-256, per-project storage, migration-safety | Reassurance | No | Yes | *(not in brief's 12)* | Feature-first | Leads with jargon, not benefit |
| 9 | `journey` | 3-step onboarding: upload / explore / refine | Orientation | No | Yes | *(not in brief's 12)* | Feature-first | Duplicates Section 7, arriving right before it |
| 10 | `scene-lifecycle` | 8-stage horizontal filmstrip: Create → Organize → ... → Share | Competence, momentum | Implied per-stage | Yes, cinematically | Brief §7, Exploration | Pain-aware ("no manual folder work") | Strong; slightly undercut by `journey` preceding it |
| 11 | `scene-agent` | Pixie travels a signal path through Intent → Planning → Risk Analysis → Tool Activation → Human Verification → Outcome | Trust, control | Implicit (fear of losing control to AI) | Yes | Brief §8, Revelation | Pain-aware | Excellent — consistently centers "you decide" |
| — | *(Brief §9–12, not built)* | — | — | — | — | — | — | See §0 |
| 12 | `paths` | "Media, connected. Intelligence, shared." + two closing links | Conclusion (attempted) | (assumed) | Recap | Brief §12 language, borrowed early | Neutral | Reasonable CTA, diluted by "in active development" and a "Pitch Deck" secondary link |

---

## 3. Section-by-Section Audit

| Section ID | Current purpose | Brief principle | Narrative role | Pain/Feature/Neutral | Copy assessment | Visual assessment | Theme assessment | Recommendation |
|---|---|---|---|---|---|---|---|---|
| `scene-opening` | Existential open | §1 Before the Media | Hook | Neutral | "Everything begins with something" — intentionally vague per brief; pays off only if visitor completes the arc | Strong multi-stage canvas morph, deterministic pseudo-random for stability | Theme-aware (dropped force-dark); light mode loses the brief's specific "dark, cinematic field" instruction — see §6 | Keep; flag the light-mode trade-off as a conscious call, not a bug |
| `scene-frame` | Introduce "the moment" as media's unit | §2 One Moment | Exploration | Neutral | "One frame. Layers of meaning." — concrete, earns its abstraction | Fracture-growth technique, reused Signal-line | Fully tokenized, consistent both themes | Fine as-is |
| `scene-universe` | Macro→micro scale shift | §3 Universe to You | Revelation | Neutral | "Every project is built from the same primitives" — slightly jargon-y ("primitives") but visually earned | DOM/CSS transforms avoid raster blur, per brief's own requirement | Fully tokenized | Fine as-is |
| `scene-chaos` | Dramatize fragmentation | §5 Chaos of Creation | Pain crescendo | **Pain-first** | "So much. Everywhere. Nowhere." — one of the strongest lines on the page | Drifting chips, hover-triggered warnings; strong "let the visitor experience it" execution | Force-dark, deliberate, holds up (see §6) | Add AI-tool/agent/model clutter to the chip set — see §4 |
| `scene-maie-moment` | Resolve the chaos | §6 Everything Connects | Crescendo/relief | Solution (visual) | "The noise fades. The scattered files align. You return to the edit." — excellent, concrete relief image | Nodes inherit Section 5's real positions; signal path = literal nav-logo path | Force-dark, deliberate, holds up — see §6 | None; this is the page's high-water mark |
| `companion-intro` | Ex-hero; reassurance statement | *(not in 12)* | Restates 5→6 | Feature-first | "The burden of the infinite project, lifted" — good, concrete pain nouns (folders/takes/metadata) | Pixie present, no CTA buttons (deliberate, guide §6 item 1) | Tokenized shell; Pixie canvas itself not theme-aware (see §6) | Consider moving earlier or trimming — see §11C |
| `toolkit` | List core benefits | *(not in 12)* | Feature explanation | **Feature-first** | "Never Lose a Moment" / "Outsource the Chaos" — generic SaaS benefit-headline pattern, restates what Section 6 just showed | Reflect-list (no card walls) — good structural choice | Tokenized, consistent | Rewrite copy to add new information rather than restate; see §5, §11A |
| `trust` | Technical trust signals | *(not in 12)* | Feature explanation | Feature-first | Leads with jargon ("SHA-256," "Migration-Safe") before the human benefit | Reflect-list, consistent with toolkit | Tokenized, consistent | Reorder: benefit headline first, spec as supporting detail |
| `journey` | 3-step onboarding | *(not in 12)* | Orientation | Feature-first | Functional, plain; "Drop in video, audio, or image files" — fine alone, redundant here | Numbered step list — not a card grid, doesn't violate anti-pattern list | Tokenized, consistent | Merge into or move after Section 7 — see §11C |
| `scene-lifecycle` | 8-stage lifecycle chapters | §7 Media Lifecycle | Exploration | Pain-aware | "no manual folder work," "side by side" (human+agent) — well-written, avoids AI-as-protagonist | Filmstrip w/ sprocket-hole framing, ties back to Frame metaphor | Fully tokenized; one of the best-executed theme-adaptive sections | None |
| `scene-agent` | Show the agent as participant | §8 Agent Workflow | Revelation | Pain-aware (trust/control) | "You stay the decision-maker" — consistently centers the human; best copy block on the page | Pixie travels a signal-line path, live mode/phase updates | Scene shell tokenized; **Pixie itself not theme-aware** (guide-documented gap) | Pass `theme` into this Pixie instance — cheap fix |
| `paths` | Closing CTA | Brief §12 language, borrowed early | Conclusion | Neutral | Primary link matches brief almost verbatim ("Begin Your Story" / "Enter MAIE"); "in active development" punctures the register; secondary "Pitch Deck" link is investor-register, audience mismatch | Text-style links, not boxes — matches brief's "single elegant primary CTA" spirit | Fully tokenized | See §9, §11A |

---

## 4. Pain-Point Coverage Map

| Pain point | Felt (visual) | Stated (copy) | Resolved | Strength | Gap notes |
|---|---|---|---|---|---|
| Lost files | `scene-chaos` chips (`v1_final_FINAL.mov`, `old_cut_DONT_DELETE.mov`) | `companion-intro` ("the lost takes") | `scene-maie-moment` / `toolkit` | Strong | — |
| Duplicate versions | `scene-chaos` (`export_v9(2)(1).mp4`, hover warning "Duplicate Asset Found") | Implicit | `trust` ("never lets a duplicate slip through") | Strong | — |
| Scattered storage | `scene-chaos` (Drive/iCloud/Dropbox/Local Bin chips) | `scene-maie-moment` caption | `toolkit`, `scene-maie-moment` | Strong | — |
| Multiple disconnected tools / **AI tools specifically** | Only generic file/cloud/chat clutter shown | Not named | `scene-lifecycle` implies consolidation | **Moderate — real gap** | Brief §5 explicitly lists "AI tools. Agents. Models... Approvals" among the chaos; the implemented chip set omits this category entirely, softening the harder, more contemporary point that AI tooling itself currently adds to the mess |
| Info living in too many places | `scene-chaos` window chips | — | `scene-maie-moment` | Strong | — |
| Remembering where everything is | Implied via chaos | `companion-intro` ("you don't have to remember where you put it") | `toolkit` | Good | — |
| Repeatedly searching for assets | Not dramatized | Implied only | `toolkit` ("the system finds it for you") | Moderate | No visual beat shows the *act* of searching/scrolling for something lost |
| Admin work consuming creative energy | — | `companion-intro`, `scene-agent` step details | `scene-agent` | Good | — |
| Constant context switching | Implied (multiple app-window chips) | Not named directly | — | Moderate | Never named explicitly in copy |
| Mental overhead | — | `toolkit` ("the mental load... gone") | `toolkit` | Good | Stated more than felt |
| Managing infrastructure instead of creating | — | — | — | **Missing** | This is Section 4's exact thesis — see §0 |
| Time organizing vs. meaningful work | `scene-chaos` implies this | `toolkit`, `trust` | `scene-lifecycle` | Good | — |
| Creator as own sysadmin | — | — | — | **Missing** | Section 4 — see §0 |
| Loss of focus from complexity | Implied (overwhelm, not focus-loss specifically) | — | "You return to the edit" | Good but narrow | The chaos scene evokes clutter more than *inability to focus*; a related but distinct feeling |

---

## 5. Voice & Copy Audit

| File / Location | Current copy | Assessment | Why | Recommended direction |
|---|---|---|---|---|
| `index.html:51`, `scene-opening-caption` | "Everything begins with something." | Poetic, deliberately vague | Brief wants the visitor to "wonder what they are looking at" at this exact point — the ambiguity is by design, not a flaw, but its payoff depends on the visitor reaching Section 6 with the throughline intact | Keep; but see §11C — its payoff is currently diluted by the toolkit/trust detour before the arc resolves emotionally |
| `index.html:83`, `frame-caption` | "One frame. Layers of meaning." | Strong — concrete, tied directly to the on-screen metadata reveal | Anchors an abstract idea to what's literally on screen | Keep |
| `index.html:120`, `chaos-caption` | "So much. Everywhere. Nowhere." | Excellent — visceral, minimal, exactly the brief's "let the visitor experience it, don't explain it in a paragraph" | Three words carry the entire section's argument | Keep |
| `index.html:136`, `scene-maie-caption-after` | "The noise fades. The scattered files align. You return to the edit." | Excellent — the strongest line on the page | Concrete relief image ("you return to the edit") beats generic "peace of mind" language | Keep |
| `index.html:143-148`, `companion-intro` | "The burden of the infinite project, lifted." + "The endless folders, the lost takes, the missing metadata..." | Strong — concrete nouns, pain-first, ties back to craft/love | Good bridge copy | Keep, but reconsider its position (§11C) |
| `index.html:165-174`, `toolkit` | "Never Lose a Moment" / "Total Project Clarity" / "Outsource the Chaos" | **Weakest copy on the page** | Generic SaaS benefit-headline pattern; "Outsource the Chaos" restates, in flatter prose, what Section 6 just showed *visually and better* — a textbook case of "explaining after showing" | Replace with copy that adds new information (specific mechanisms, not restated benefits) or cut this section's redundant items |
| `index.html:184-196`, `trust` | "SHA-256" / "Per-Project Storage" / "Migration-Safe" as leading kickers, human benefit as secondary | Leads with jargon before benefit | Inverts the brief's "start human" principle at the micro-copy level | Swap order: benefit headline first, technical spec as supporting detail |
| `index.html:207-226`, `journey` | "Upload your media" / "Choose how you'd like to explore" / "Refine, organize, and continue" | Plain, functional, fine alone | Duplicates `scene-lifecycle`'s 8-stage version of the same territory, arriving right before it in flatter form | Merge into Section 7 or reposition post-lifecycle as a literal "how to start" recap |
| `scene-lifecycle.js:16-23`, stage descriptions | "Ingestion sorts and structures everything automatically, no manual folder work." / "Human and agent work the same project together, side by side." | Strong — pain-aware, avoids AI-as-protagonist | Names the pain implicitly ("no manual folder work" implies the pain of manual folder work) while staying forward-looking | Keep |
| `scene-agent.js:20-31`, step details | "You describe the outcome. The system carries the weight." / "The result comes back to you before anything is finalized. You stay the decision-maker." | Excellent — best copy block on the page | Directly answers the real anxiety creative professionals have about ceding control to automation | Keep |
| `index.html:256-257`, `paths` h2/p | "Media, connected. Intelligence, shared." / "MAIE is in active development. Choose where your story goes next." | Mixed | First line is 2 of the brief's suggested 3-line closing triad (drops "Creation, amplified."); "in active development" is honest but punctures the story-conclusion register at the exact moment it should crystallize | Consider the full triad; move the development-status caveat to a smaller/secondary position so it doesn't sit inside the emotional climax line |
| `index.html:264-266`, secondary path link | "See It in Depth" / "Explore the Full Pitch" → links to a pitch deck | Audience mismatch | "Pitch deck" is investor register; the visitor being addressed throughout the page is a creator, not an investor | Either retarget this link to a creator-facing depth page, or relabel around what a creator actually wants to see next |
| `index.html:35-40`, nav links/CTA | "Toolkit" "Trust" "Journey" "Pitch Deck" + "Join the Exchange" button, all visible pre-scroll | Pre-commits to feature vocabulary and an ask before any pain is established | Undercuts the guide's own resolved decision to remove the early ask from the hero (§6 item 1) — the nav never got the same treatment and is visible on every scroll position | See §9, §11B |
| `index.html:6`, `<title>` | "MAIE — The Creative Companion for Modern Media" | Serviceable but generic | Undersells the brief's specific positioning ("an environment for understanding, connecting, transforming, and carrying media through its entire lifecycle") | Minor; consider tightening toward the brief's own §16 language |

---

## 6. Theme & Visual Consistency Audit

**Sections 5 and 6 (force-dark, documented, guide §6 item 3):** holds up well on inspection, not just on paper. Chaos reads more convincingly as claustrophobic overwhelm against a near-black radial gradient than it would in light mode, where clutter risks reading as merely "busy" rather than oppressive. More importantly, because both scenes share the same forced-dark family, they form one uninterrupted cinematic passage — the one place on the page where two similarly-toned sections sitting back to back is *correct*, since it's a single emotional movement (chaos → resolution), not a rhythm violation (Chaos is Immersion, MAIE-moment is Revelation — different modes per the brief's own rhythm system).

**Section 1's light-mode trade-off (worth surfacing even though "resolved" in the guide):** dropping force-dark in favor of the Digital Ignition Spark treatment (guide §10) was the right technical/consistency call, but it's also a real strategic trade-off, not just an implementation detail. The brief's opening explicitly calls for "a dark, cinematic field" as the specific mood of the first thing a visitor sees. Light-mode visitors now get a warm paper background with a small spark-flash instead — theme-consistent, but not the brief's literal instruction for this one beat. This is a legitimate open design question, not a bug.

**Pixie companion theme gap — broader than documented:** the guide (§6 item 3) flags Section 8's Pixie instance as not passing a `theme` option to `pixie-companion.js`. Checking both call sites confirms this is page-wide: `companion-intro`'s init script (`index.html:296`) also omits `theme`, so **neither Pixie instance on the page adapts to the toggle** — both render the engine's hardcoded default core color (a fixed muted crimson, `rgb(167,65,51)`) regardless of light/dark state. In dark mode this blends naturally with the brand palette; in light mode, it's the one foreground element on the page that visibly doesn't move when everything around it does. Not jarring (mid-tone, not pure black/white, matching the guide's own assessment for Section 8), but the fix scope is larger than currently recorded.

**Everything else (Sections 2, 3, 7, `companion-intro`, `toolkit`, `trust`, `journey`, `paths`, background orbs, nav):** fully tokenized via `var(--bg)/--surface/--text-1/--text-2/--brand-light/--accent`, confirmed section-by-section in §3. No undocumented dark islands found. One small, well-executed detail worth citing as a strength rather than a gap: `.bg-orb` doesn't just fade in light mode, it switches `mix-blend-mode` from `screen` to `multiply` and drops opacity (0.22 → 0.14) — a deliberate blend-mode adaptation, not a lazy opacity tweak, and it's the kind of per-theme art direction the rest of the anti-pattern list is checking for.

**Conclusion:** no genuine "dark island in light mode" exists outside the two documented, reasoned exceptions. The real theme-system gap is the Pixie companion's fixed palette — small in visual impact, but real and slightly wider in scope than recorded.

---

## 7. Visual Storytelling Audit

| Metaphor | Intended meaning | Current implementation | Emotional effect | Copy pairing | Theme behavior | Recommendation |
|---|---|---|---|---|---|---|
| **Signal** | Continuous line: human intention, process, data flow, provenance, continuity | Most thoroughly executed of the three. Reused across `scene-opening` (pulse→line→...), `scene-frame` (vertical signal-line + dots), `scene-maie-moment`, `scene-agent`. **Notably: the nav logo's SVG path (`index.html:25-29`) and `scene-maie-moment`'s signal path (`index.html:129-133`) are the literal same coordinate string** — the brand mark isn't placed on top of the story, it's drawn from it | Strong — Section 6's convergence is genuinely moving once you notice the logo is assembling itself | Reinforced by "The noise fades... you return to the edit" | Fully theme-aware in every scene except the Pixie-on-path treatment in `scene-agent` | None needed; this is the page's strongest through-line. `scene-agent`'s path is a placeholder wave shape, not the signal/logo curve — cheap swap later, already flagged in guide |
| **Frame** | Media boundary — expands/contracts/fractures | Present in `scene-frame` (fracture bars) and echoed in `scene-lifecycle`'s sprocket-hole card borders | Good, unobtrusive reinforcement | Matches "one frame, layers of meaning" | Theme-aware | None needed |
| **Network** | Relational graph — every connection meaningful, never decorative | `scene-maie-moment`'s nodes are literally Section 5's real chip positions, not decorative scatter — meets the brief's explicit "never generic AI neural-network decoration" requirement | Strong, but narrow — this is a proof-of-concept of the metaphor, not its full expression | Reinforced by caption | Force-dark, deliberate | The metaphor's fuller expression (people/assets/projects/agents/orgs at scale) is Section 11's job — see §0. Nothing to fix in what's built; flagging so the audit doesn't undercount the metaphor as "thin" when it's actually "not yet complete" |

**If the copy were removed:** the visual sequence through Section 6 would still land the intended emotional progression — chaos, then convergence, then a mark resolving out of it — largely on its own. That's a genuine strength. The four legacy sections that follow (companion-intro/toolkit/trust/journey) would communicate almost nothing without their copy, since they carry no distinct visual metaphor of their own (plain reflect-lists) — a secondary way of naming the same structural gap flagged in §2/§11.

---

## 8. Pacing & Scroll Audit

- **Escalation:** `scene-chaos` → `scene-maie-moment` is well-paced — density increases through Section 5 (`--chaos-density` scales with progress) before the release in Section 6.
- **Rest point that isn't quite a rest:** the four legacy sections after Section 6 function structurally as a pacing rest (normal scroll, no cinematic scroll-jacking to sustain attention through), but their *content* doesn't read as calm reflection — it reads as a sales insert, undercutting the rest beat's intended effect.
- **Repetition flagged as a pacing issue, not just a content issue:** `companion-intro`, `toolkit`, `trust`, and `journey` all use the *identical* fade/rise-up transition (`opacity 0.7s ease`, `translateY(28px)`, via the same `IntersectionObserver` in `reveal.js`). Four consecutive sections with the same visual treatment, after five sections that each had a distinct cinematic technique, is a real monotony dip — distinct from, and additional to, the content-redundancy problem already noted.
- **Story rail's blind spot — the guide's own stated condition has now been met.** `reveal.js` builds progress-rail dots only for `[data-reveal]` sections (5 total: `companion-intro`, `toolkit`, `trust`, `journey`, `paths`); the 7 story-scene sections are deliberately excluded (guide §4, "a rail dot mid-cinematic-scene would undercut the immersion... worth a second look if the whole page ends up mostly story scenes"). Given that story scenes now account for 7 of 12 built sections and represent most of the page's actual scroll height (`250vh`–`420vh` each, vs. normal-height reveal sections), the rail is now blank or inert for the majority of the visitor's scroll distance — the "river with a destination" feedback the rail exists to provide (per `reveal.js`'s own comment) is largely absent exactly where the journey is longest. This isn't a new architectural problem; it's the guide's own documented open question, now past the threshold it named.
- **`scene-agent` step spacing:** 250vh across 6 steps (~42vh/step) vs. `scene-lifecycle`'s 420vh across 8 stages (~52vh/step) — a modest difference, not urgent, but `scene-agent` is proportionally the tighter of the two.
- **Animation that earns its place:** `scene-opening`'s ignition-to-pulse handoff, `scene-maie-moment`'s node convergence, `scene-chaos`'s hover-triggered scatter (ties interaction directly to the section's theme of things falling apart when touched).
- **Animation closer to ambient spectacle than narrative beat:** the Pixie companion's continuous particle/orbit-ring animation in `companion-intro` runs independent of any scroll-tied narrative moment — appropriate for "ambient/idle" as a character trait, but worth noting as the one place motion isn't earning a specific story beat, just presence.

---

## 9. CTA & Conversion Audit

- **Nav CTA ("Join the Exchange," `index.html:40`):** present and visually prominent (filled button) from the very first pixel, on every scroll position, since `.nav` is `position: fixed`. This directly recreates the "early ask" the team explicitly removed from the hero (guide §6 item 1: "the reasoning was the brief's own: lead with impulse, not an early ask"). That reasoning was never extended to the nav, which carries the same ask permanently. Reads as an interruption relative to the rest of the page's discipline.
- **No hero/primary CTA in `companion-intro`:** correct, matches the resolved decision.
- **No in-page CTA between Sections 1–8:** correct — nothing interrupts the story until the end.
- **Final CTA (`paths`):** the primary link ("Begin Your Story" / "Enter MAIE") matches the brief's own suggested phrasing almost exactly and reads as a natural next step, not a sales pitch. The secondary link ("See It in Depth" / "Explore the Full Pitch") breaks the register by pointing to a pitch deck — content built for investors, not the creator the entire page has been addressing. The "MAIE is in active development" line is honest and probably necessary (pre-launch product) but sits inside what should be the most crystallized sentence on the page.

**Net assessment:** the closing CTA is close to earning its "conclusion of the story" framing; the nav CTA undermines that framing throughout the rest of the page by never letting the ask disappear in the first place.

---

## 10. Anti-Pattern Checklist

| Anti-pattern (brief §15) | Status | Evidence |
|---|---|---|
| Generic SaaS hero | **Avoided** | Hero replaced by `companion-intro`: statement + Pixie, no buttons (guide §6 item 1) |
| Wall of feature cards | **Avoided** | `toolkit`/`trust` use single-column `.reflect-list`, not card grids (guide §6 item 1, `styles.css:152-161`) |
| Dashboard screenshot above fold | **Avoided** | No dashboard screenshot anywhere in the DOM |
| Excessive glowing AI gradients | **Avoided** | `bg-orb`/`brand-glow` used restrained and theme-adapted (see §6); no neon chrome |
| Generic "AI-powered" language | **Avoided** | No such phrase found; copy is consistently pain-first ("the burden... lifted," "SHA-256," "per-project storage") |
| Fake 3D network of glowing nodes | **Avoided** | Section 6's network is real 2D SVG tied to Section 5's actual chip positions, not decorative |
| Stock photos of smiling teams | **Avoided** | No such photography exists in `media/`; Section 4 is left unbuilt rather than filled with a wrong-fit stock photo (guide §6 item 4) |
| Excessive animation without narrative purpose | **Mostly avoided** | Nearly all motion is scroll-tied and purposeful; Pixie's continuous idle animation in `companion-intro` is the one ambient exception (see §8) |
| Explaining architecture before establishing the problem | **Ambiguous** | Not violated in DOM order (Chaos/Section 5 precedes capability explanation) — but the nav's "Toolkit/Trust/Journey" links and "Join the Exchange" CTA are visible from the very first frame, before Section 1 has even played, pre-committing to feature vocabulary and an ask ahead of any established problem |
| Treating AI as the protagonist | **Avoided** | Copy consistently returns agency to "you" ("You stay the decision-maker"); Pixie is a companion, not a hero |
| **New: Theme inconsistency** | **Avoided** (documented exceptions only) | See §6 — no undocumented islands found |
| **New: Feature-first storytelling (legacy sections)** | **Present** | `toolkit`/`trust` — see §2, §5 |
| **New: Poetic copy lacking concrete relevance** | **Avoided, with one caveat** | "Everything begins with something" is deliberately abstract per brief intent, but its payoff is diluted by the tonal detour through `toolkit`/`trust` before the arc resolves — see §5 |

---

## 11. Recommendations

### A. Quick Copy Fixes
1. Rewrite `toolkit`'s three headlines so they add information rather than restate what Section 6 already showed visually (`index.html:165-174`).
2. Reorder `trust`'s items so the human benefit leads and the technical spec (SHA-256, Migration-Safe) supports it, not the reverse (`index.html:184-196`).
3. Retarget or relabel the `paths` secondary link away from "Pitch Deck" toward something a creator (not an investor) would want next (`index.html:264-266`).
4. Move or shrink "MAIE is in active development" so it doesn't sit inside the closing headline's emotional beat (`index.html:257`).

### B. Visual & Theme Refinements
1. Pass a `theme` option (read via `getComputedStyle`, same technique already used in `scene-opening.js`) into **both** Pixie companion call sites — `companion-intro` and `scene-agent` — not just Section 8 as currently scoped in the guide.
2. Give the nav CTA a lower-key treatment (text link, or a button that only gains visual weight once the visitor nears `paths`) so it stops recreating the early-ask pattern the hero deliberately dropped.
3. Wire the story-scene sections into the side progress rail, or provide an alternate progress cue — the guide's own stated condition for revisiting this ("if the whole page ends up mostly story scenes") has been met.

### C. Structural Changes
1. Reposition or substantially rewrite `companion-intro`/`toolkit`/`trust`/`journey` — currently sandwiched between Section 6's crescendo and Section 7's lifecycle, they break momentum, repeat content, and dilute Section 1's payoff. Options: fold `companion-intro`'s statement earlier as part of the Section 5→6 handoff; merge `journey`'s onboarding steps into or after Section 7 instead of duplicating it beforehand.
2. Prioritize sourcing Section 4's photography above the other three deferred sections — it's the brief's dedicated "creator becomes their own system administrator" beat, and no other section on the page currently embodies that specific pain in human terms.

### D. High-Leverage Revisions

1. **Reposition the four legacy reveal sections relative to Section 6.**
   *Wrong now:* They sit directly after the page's emotional high point and restate it in flatter, generic-SaaS language while also duplicating Section 7.
   *Change:* Fold `companion-intro` earlier or trim it; cut or rewrite `toolkit`; move `journey` to after (or merge into) Section 7.
   *Why it matters:* This is the single sharpest momentum break on the page — the story earns a strong "show," then immediately "tells" the same thing worse.
   *Supports:* §2, §3, §5, §8.

2. **Extend theme-awareness to both Pixie companion instances.**
   *Wrong now:* Neither the hero nor Section 8's Pixie passes `theme`; both render fixed colors regardless of the toggle.
   *Change:* Pass `theme` at both call sites using the existing engine support.
   *Why it matters:* It's the only remaining place on the page where a foreground element visibly doesn't respond to the toggle everything around it does.
   *Supports:* §6, §3.

3. **De-escalate the nav CTA.**
   *Wrong now:* "Join the Exchange" is a persistent, prominent ask visible before the visitor has scrolled at all, undermining the resolved decision to remove the early ask from the hero.
   *Change:* Lower its visual weight, or make it earn prominence only once the visitor approaches the close.
   *Why it matters:* The rest of the page is unusually disciplined about not asking too early; the nav is the one place that discipline doesn't apply, and it's visible 100% of the time.
   *Supports:* §5, §9, §10.

4. **Add AI-tool/agent/model clutter to Section 5's chaos field.**
   *Wrong now:* The chaos chip set is all generic files/cloud/chat — the brief explicitly lists "AI tools. Agents. Models... Approvals" among the fragmenting forces, and none of that appears.
   *Change:* Add a few chips representing today's proliferating AI tools/agents/models as part of the mess.
   *Why it matters:* It's a more contemporary, harder-hitting, and more credible admission for a product that is itself an AI agent platform — currently the page dodges the one pain point its own target user would find most self-aware.
   *Supports:* §4.

5. **Prioritize Section 4 (The Human Hand) content-sourcing.**
   *Wrong now:* Nothing on the page currently dramatizes "the creator has become the system administrator of their own creativity" in human, documentary terms — it's stated in `toolkit`/`companion-intro` copy but never *felt*.
   *Change:* Source the documentary photography this section needs, ahead of Sections 9–11.
   *Why it matters:* It's the brief's dedicated beat for the single most specific pain point in the whole exercise, and it's currently the biggest missing emotional beat, not just a missing section.
   *Supports:* §0, §4.
