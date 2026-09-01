# Design Blend — Research & Build Program

**Date locked:** 2026-08-15 (late night discussion)  
**Status:** discussion complete. Research and production **not started**.  
**Audience:** you + extra hands who will gather, process, and write reports.

This file is the wake-up brief. The engine contract is [`DESIGN-BLEND-SYSTEM.md`](./DESIGN-BLEND-SYSTEM.md). The visual system report is the canvas `design-blend-system.canvas.tsx`. If someone wants to relitigate “should this be Cosmos” or “is the playlist the product,” send them here: **the product is a pairwise design-taste match score**, with a story (breakdown + proof plates), from one durable profile.

Do **not** invent edge weights at a desk tomorrow. That is the research program.

---

## 0. What we actually decided tonight

Read this once so the team does not reopen closed doors.

| Decision | Locked as |
|---|---|
| Product | Spotify-Blend-style **taste match %** between two designers, plus a story. Not a moodboard app. Not a playlist product. |
| Solo artifact | You still get a fingerprint card if nobody ever Blends with you. |
| Entry | Profile once, from homepage **or** someone’s Blend link. Invite does not show the % until the visitor has a profile. |
| Capture | Idea A seed grid, then deeper stages. Three elicitation modes: **pick** (no intensity), **rank** (group, ordered), **rate** (individual 0–100). Skip = unknown, not dislike. |
| Layers | **Context** (industry + field) · **Craft** (spacing, type, color) · **Mental model** (how they decide) · **Style graph** (named languages). Decoration-only styles are the failure mode. |
| Craft method | Hold the *same* piece of work still. Change one axis. Rank four variants. |
| Mental model | Never “are you a design thinker?” Show process/system artifacts and rank. |
| Graph | Weighted edges. Later evidence overwrites earlier priors. Paint at most **2 hops**. Parent→child only in the edge table (not bidirectional). |
| Match | Exact cosine on **overlapping high-confidence** dimensions. Missing ≠ 50. Display % = 0.40 craft + 0.20 mental + 0.40 style (calibrate later). Proof plates from **observed** ratings. |
| Vectors | JSONB posteriors in Postgres. pgvector / ANN is **v2 twins only**, never the invite Blend. |
| AI | Optional caption after the score exists. Never scores the Blend. |
| v1 engineering | Wait on a **bounded catalog + interconnection ledger**. Do not code the full graph empty. |

Tonight’s remaining insight (this file’s reason to exist):

**The engine is not the bottleneck. Content, gating, and researched interconnections are.** This is an information-design project as much as a product-engineering one. Extra hands are for reports, not for guessing Swiss→grid = 0.8 because it sounds right.

---

## 1. How branching actually works (so we don’t explode)

It feels like “every industry × every mental model × every style is a unique quiz.” If we build it that way, we never ship.

**There is one catalog.** Industry and field are **gates**, not separate products.

```
Stage 0 pick
    → allowedFields, allowedIndustries
Stage 1 seed grid
    → only leaves whose field ∈ allowed AND (industries empty OR overlap)
Stage 2 craft ranks
    → load the craft *variant set* for the dominant field
      (UI spacing uses a dashboard; graphic spacing uses an editorial spread)
Stage 3 mental
    → mostly shared artifacts; one industry-flavored pair allowed if we have it
Stage 4 adaptive
    → walk the subgraph of allowed leaves; cross-field edges only fire
      if the destination field is also allowed
```

So: **interconnected where the ledger says so**, invisible otherwise. A fashion-only profile never sees a Bloomberg dashboard. A UI+graphic profile *can* walk Swiss poster → strict-grid UI if that edge is approved.

What we must **not** do: generate a new graph per industry. What we **must** do: tag every plate with field + industries, and maintain an interconnection ledger (connect / do not connect / uncertain).

---

## 2. Why this is an information-design project

Three jobs that are not “write the engine”:

1. **What exists** — which styles, craft variants, mental artifacts, industries are in v1. Each needs a real plate, license, alt, and a reason it is visually distinct.
2. **What is gated** — which plates a healthcare UI designer should never be asked; which craft variants are meaningless outside print; which mental artifacts are universal.
3. **What is linked** — which co-liking relationships are historically/practically real (Swiss grid ↔ systematic UI), which are lazy (brutalist poster ↔ neon SaaS), which we refuse to connect until evidence exists.

Weights are a **downstream** of (3). If the ledger says “uncertain,” the engine gets **no edge**, not a 0.5.

We cannot decide (3) from taste alone. We set it from:

- design history (movements that actually shared methods, not just a vibe)
- contemporary practice (what studios, product orgs, and education actually pair)
- existing preference research (layout vs type vs color as separate judgments)
- explicit **non-links** (equally important)

---

## 3. v1 freeze (decide this tomorrow morning, before any report)

If v1 is unbounded, extra hands will research the universe. Freeze a box.

**Recommended freeze (amend in the morning if you must, then stop amending):**

| Axis | v1 in | v1 out |
|---|---|---|
| Fields | UI / product, Graphic / visual | Fashion, interior, industrial, photo, motion-as-field (motion as a *craft* optional later) |
| Industries | 3: **SaaS / product**, **editorial / publishing**, **brand / identity** | Healthcare, fintech-as-separate, civic, gaming, fashion house, architecture… |
| Craft groups | 3: spacing, typography, color — **two variant sets** (UI surface vs print/editorial surface) | Hierarchy, motion as mandatory ranks |
| Mental groups | 2 shared: systems↔expression, constraint↔gesture | “Design thinking” process maps, Myers-Briggs |
| Style leaves | ~80, already sketched in seed-data as a *candidate list*, then **cut and license** | 330-node PRD, depth-5 niches |
| Edges | Only among v1 leaves + the 3 craft poles + 2 mental poles | Cross-links into fields we didn’t freeze |

Industries in v1 are **tags on plates**, not 3 separate quizzes. Someone who picks SaaS+editorial sees the union, with seed diversity across both.

---

## 4. Research reports extra hands will produce

Each report is a **deliverable with a template**, not a vibe essay. One owner per report. Cite sources. Mark confidence: `established` / `practice-consensus` / `hypothesis` / `do-not-link`.

### Report A — Industry × field matrix

**Question:** For each v1 industry × field cell: is this a real working context? What work looks like? What must never appear in that cell’s seed?

**Output:** table `industry × field → in / out / rare`, plus 5 example artifacts per in-cell (names only; licensing is Report C).

**Done when:** every v1 plate can be tagged without an argument in Slack.

### Report B — Craft operationalization

**Question:** How do we isolate spacing vs type vs color *without* changing content? What does “the same dashboard” mean for UI vs “the same spread” for editorial?

**Output:** for each craft axis, a brief: pole definitions, how variants differ, failure modes (accidentally changing type while testing spacing), recommended 4-variant recipe.

**Done when:** a designer who isn’t you could produce the 4 images from the recipe.

### Report C — Plate catalog (content + rights)

**Question:** What is the actual v1 list of style leaves and craft/mental plates? Source, license, alt, distinctiveness test (“would a layperson confuse these two?”).

**Output:** spreadsheet: `id, label, field, domain, industries[], kind, source URL, license, distinct-from, status (candidate/approved/killed)`.

**Done when:** 80 style leaves + 3×2 craft groups (24 variants) + ~8 mental artifacts have a legal path, or a “commission / shoot” flag.

### Report D — Interconnection ledger (the important one)

**Question:** Which nodes should have neighbor / contrast / cross-field / cross-layer edges — and which must **not**?

**Output:** rows:

```
from_id | to_id | proposed_type | proposed_weight | evidence_grade | sources | decision
```

`decision`: `connect` | `do-not-connect` | `hold`.

**Rules for authors:**

- A historical movement sharing a method (Swiss + Müller-Brockmann grid → systematic UI) can be `established`.
- “Both feel modern” is not evidence. That is `do-not-connect` or `hold`.
- Cross-field needs a *mechanism* (same compositional rule, same production constraint), not a mood.
- Explicit non-links are a feature. They stop the graph from becoming complete and meaningless.

**Done when:** every v1 leaf has ≥1 neighbor, ≥1 contrast, **or** a written reason it is a singleton; every proposed cross-field edge has a source or is killed.

### Report E — Mental-model artifacts

**Question:** Which pairs of images capture systems vs expression and constraint vs gesture *without* becoming a personality quiz or a seniority test?

**Output:** 4–6 candidate pairs, what each pole means, who it would unfairly punish (e.g. students who have never written a spec).

**Done when:** you can run the pairs on 3 designers and they argue about the *work*, not the label.

### Report F — Weighting protocol (not the weights themselves)

**Question:** How do extra hands *assign* 0–1 weights once the ledger says `connect`?

**Output:** a rubric, e.g.:

| Weight band | Meaning | Example bar |
|---|---|---|
| 0.8–1.0 | Same method, routinely co-practiced | Swiss poster grid ↔ UI strict grid |
| 0.5–0.7 | Often travel together, not entailed | Dark editorial ↔ serif-in-UI |
| 0.3–0.4 | Weak / occasional | Bento ↔ isometric illustration |
| no edge | Mood-only or contradictory | Punk zine ↔ enterprise dense as *neighbors* (contrast instead) |

**Done when:** two researchers independently banding the same 20 edges agree within 0.2 on ≥15 of them. If not, the rubric is wrong — do not average in silence.

### Report G — Match calibration plan (later this week, not tomorrow AM)

**Question:** How will we sit with real pairs so 50% and 85% mean something?

**Output:** 8–12 designer pairs, protocol (they take capture, then independently guess overlap, then see proof plates, then we compare). No numbers until the catalog exists.

---

## 5. What extra hands do vs what only you do

| Extra hands | You (owner) |
|---|---|
| Source plates, licenses, alt drafts | Freeze v1 box (table in §3) |
| Fill Reports A–E rows with citations | Kill / keep controversial edges (`punk ↔ brutalist UI`) |
| First-pass weight *bands* using Report F | Final weight numbers on `connect` rows |
| Distinctiveness pass (“these two images are the same”) | Craft variant art direction (same content, one axis) |
| Note industry trends with sources | Product copy, Blend story language |
| Flag `hold` items | Decide when `hold` becomes `do-not-connect` |

Engineering (when research has a minimum catalog): implement SYSTEM.md against **approved** rows only. No coding hypothesized edges.

---

## 6. Tomorrow when you wake up (ordered)

Do this in order. Do not skip to Figma or to engine code.

**Hour 1 — Re-read, don’t redesign (you)**

1. This file.  
2. [`DESIGN-BLEND-SYSTEM.md`](./DESIGN-BLEND-SYSTEM.md) §§1–2, 6–7.  
3. System canvas if you need the picture.  
4. Write any freeze amendments in §3 of *this* file. Then stop changing the box.

**Hour 2 — Brief extra hands (you + them)**

1. Product in one sentence: pairwise design-taste **score**, not a decoration quiz, not Cosmos.  
2. Show the four layers and the three modes (pick / rank / rate).  
3. Assign **Report A, B, C, D** as the only workstreams this week. E can start if someone is free. F is a short rubric, not a week. G is not tomorrow.  
4. Give each owner the template in §4 and the freeze in §3.  
5. Rule: no edge without a `decision`. No plate without a license path.

**Hour 3 — Shared working surface**

Open one spreadsheet (or Notion DB) with tabs: `plates`, `ledger`, `matrix`. Extra hands do not fork private docs. The ledger tab columns are exactly Report D.

**Not tomorrow**

- Implementing `engine.ts` against empty Unsplash.
- Expanding to 12 fields.
- Writing Gemini prompts.
- Visual identity / Dribbble home.
- Inventing 200 weights in a call.

**End of day 1 success:** freeze written, owners named, empty templates filled with *at least* 10 example rows each so the format is real.

---

## 7. This week (after tomorrow)

| Day | Outcome |
|---|---|
| 1 | Freeze + templates + 10 example rows / report |
| 2–3 | Report A matrix draft; Report B craft recipes; Report C candidate list (ids, not final images) |
| 4–5 | Report D ledger: aim 80 leaves × (1 neighbor + 1 contrast) as *proposals*, half may be `hold` |
| 6 | You adjudicate `hold` / contradictions. Extra hands do not outvote a `do-not-connect` |
| 7 | Minimum catalog: enough approved plates to *prototype* Stage 0–2 only (not full adaptive) |

Production engineering of Stage 4 + match starts when Report D has a `connect` set you would defend to a designer you respect.

---

## 8. Document map (what to open)

| File | Role |
|---|---|
| `docs/PROGRAM.md` (this) | Tonight’s decisions, research program, tomorrow plan, extra-hands briefs |
| `docs/DESIGN-BLEND-SYSTEM.md` | Engine, data structures, algorithms, match math |
| `AUDIT.md` | Earlier critique of the *current* repo; do not treat as the product spec |
| `attached_assets/prd-*.md` | Historical intent; taxonomy is a **candidate mine** for Report C, not law |
| System canvas | Visual walkthrough of the proposed engine |

---

## 9. One sentence for extra hands

We are not collecting “cool design styles.” We are building a **gated, cited map** of design contexts, craft dimensions, decision postures, and visual languages — including what we refuse to connect — so a match percentage means something besides decoration.
