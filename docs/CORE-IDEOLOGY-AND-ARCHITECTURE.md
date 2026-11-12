# Design Blend — Core Ideology, Historical Evolution & Unified v2 Architecture

**Status:** Canonical Product & Engine Specification (`taste-engine-2.0.0`, `catalog-v2.0.0`)  
**Role of this document:** Chronicles the complete intellectual journey of Design Blend from Iteration 1 through Iteration 4 (v2 Shipping Architecture), formalizes the empirical aesthetics and dyadic psychology backing the system, and specifies the exact mathematical model correlating deep subcategories, craft parameters, and aversive boundaries into a living pairwise taste engine.

---

## 1. Why Designing for Designers Requires a Different Breed of Product

Developers often converge toward canonical engineering idioms—linters, standard algorithms, shared design patterns. **Designers do not.**

Designers are epistemic pluralists:
1. **Context-Sensitive Dualities:** The exact same person can practice ultra-disciplined, surgical Swiss structuralism when designing enterprise product tables by day while collecting chaotic, photocopied punk risograph zines and experimental variable-font posters by night. Averaging those two branches into `"50% Moderate"` destroys the truth of who they are.
2. **Cognitive Mastery Over Surface Valence:** As shown by **Leder et al. (2004, 2014)**, laypeople react to visual work via perceptual fluency and color mood; designers react via *cognitive mastery*—evaluating grid tension, typographic hierarchy, material honesty, constraint resolution, and historical lineage.
3. **Aversive Acuity (Distaste as Identity):** In creative practice (**Bourdieu, 1979; Wilk, 1997**), what a designer *refuses to ship* ("purple mesh AI SaaS slop," "gratuitous 400ms bounce animations," "dishonest skeuomorphic chrome") carries 2–3× more diagnostic signal than polite admiration of canonical classics.
4. **Intolerance for Generic Container UX:** A designer judges the *instrument* in the first 400 milliseconds. If a taste-profiling app looks like a templated SaaS dashboard or a gamified personality quiz, practitioners immediately reject its authority. The interface itself must act as a **quiet archival salon and tactile studio loupe**.

---

## 2. The Complete Evolution: Iterations 1 → 4

Understanding *why* earlier approaches failed or stalled prevents anyone on the team from re-introducing dead ends.

### Iteration 1 — The Exhaustive Global Taxonomy (`attached_assets/prd-design-blend` & `design-blend-taxonomy`)
- **What it proposed:** 12 creative fields → ~60 categories → **221 to 330 leaf styles**. Users pick fields/categories and rate dozens to hundreds of individual styles on 0–100 sliders, collapsing into 8 global bipolar axes and 32 named archetypes.
- **What it got right:** Recognized the sheer breadth of creative disciplines (UI/UX, Graphic/Print, Brand Identity, Typography, Motion, Illustration, 3D/Spatial, Industrial, Architecture, Photography) and insisted on **image-anchored** leaves rather than abstract style names.
- **Where it broke:**
  1. *Capture Fatigue:* 120–221 sequential ratings take 25–35 minutes; completion collapses before the social Blend loop ever starts.
  2. *Uncalibrated Likert Drift:* One designer's `70` is another's `92`. Raw 0–100 sliders without comparative anchors suffer severe cross-person scale bias.
  3. *Branch Collapsing:* One global 8-axis average erased crucial contradictions between how someone designs interfaces vs. print/brand artifacts.

### Iteration 2 — The Directed Graph & Bayesian Paint Spec (`docs/DESIGN-BLEND-SYSTEM.md` & `docs/PROGRAM.md`)
- **What it proposed:** Separated taste into four distinct layers (**Context**, **Craft** [40%], **Mental Model** [20%], **Style Graph** [40%]), introduced **Craft Variant Groups** (holding the same UI/editorial content constant while varying spacing, typography, or color), and proposed 2-hop Bayesian belief propagation across weighted `neighbor`, `contrast`, `cross_field`, and `cross_layer` edges.
- **What it got right:**
  - *Isolating Craft from Style:* "Swiss" is not spacing; holding content constant while varying a single craft token is the cleanest operationalization in preference research.
  - *Honest Epistemics:* `Skip = unknown` (never 50/neutral, never dislike). Missing dimensions are excluded rather than fabricated.
- **Where it stalled:** Demanded human-researched historical probability weights (`Report D: Interconnection Ledger`) across hundreds of style pairs before writing production code—turning a fast-moving product into a multi-year academic cataloging bottleneck.

### Iteration 3 — The Spotify "Manufactured Listening History" Baseline (`docs/FINAL-PLAN.md` & `lib/taste-engine v1`)
- **What it proposed:** Framed capture as manufacturing the event stream Spotify gets passively. Built an append-only `plate_responses` log, immutable `profile_versions` (supporting taste drift v1 → v2), and synchronous weighted-cosine `computeBlend` with co-rated **Proof Plates** (`sharedPlates` & `divergentPlates`), cutting scope to 2 fields, 12 categories, and 68 plate slots.
- **What it got right:** Clean, deterministic, audit-proof event-sourced architecture with zero AI hallucination in the math.
- **Where it fell short for shipping:**
  1. *Polite Clustering ("The 85% False-Positive Bug"):* Standard cosine similarity mapped into `[0, 100]` via `((cos + 1) / 2) * 100` clusters almost any two working designers with decent taste between `76%` and `89%`.
  2. *Zero Subcategory Correlation:* Treated the 8 global axes as flat; could not correlate subcategories across fields or represent branch-specific divergence.
  3. *Empty Visual Slots & Generic UI:* `catalog/v1.json` had `0 / 68` visual assets populated, and the React shell used generic developer-card chrome rather than designer-grade mobile-first interaction.

### Iteration 4 (Current Canonical Spec) — Empirical Dyadic Synthesis & Hierarchical Correlated Engine (`taste-engine v2.0.0`)
Synthesizes the breakthroughs from `@THEZEROQUOTIENT`'s dyadic experiment, Spotify Blend's multi-layer intersection/discovery split, empirical aesthetics papers, and the repo's deep subcategory taxonomy into a **fast-capturing, deeply correlated, anti-slop v1 MVP**.

---

## 3. Research Pillars & Empirical Mechanics Built Into v2

| Research Source | Core Finding | Exact Mechanism in Design Blend v2 |
|---|---|---|
| **Montoya, Horton, & Kirchner (2008)** & **`@THEZEROQUOTIENT` Experiment** | Polite trait surveys cause everyone to match at 85%+. Forced trade-offs + hard incompatibility caps expose real chemistry. | **Foil Pairwise Face-Offs** + **Dealbreaker Clash Penalty Caps** ($P_{\text{clash}}$): when Designer A's Canon (`≥80`) is Designer B's Hard Reject (`≤20`), explicit clash penalties and score caps trigger. |
| **Kirton KAI Theory (1976, 2003)** & **Amabile (1996)** | Creative dyads fail when craft floors clash, *and* stagnate when cognitive modes are identical clones. | **Dual Readout:** Blend separates **Shared Sensibility (Harmony %)** from **Productive Friction (%)**, classifying the dyad (*Mirror Sensibility*, *Studio Co-Conspirators*, *Counterweight Pair*, *Dialectical Clash*). |
| **Leder et al. (2004, 2014)** — *Cognitive Mastery* | Designers judge *why* an artifact works (grid, material honesty, restraint, tension), not merely "pretty vs. ugly." | **1-Tap Studio Critique Chips** attached optionally to strong reactions (`surgical-grid`, `honest-material`, `earned-tension`, `timeless-type`, `sterile`, `visual-pollution`, `derivative-slop`, `hostile-ux`). |
| **Hekkert et al. (2003)** — *MAYA Principle* | Aesthetic preference sits on an individual's frontier between *Typicality* (ergonomic convention) and *Novelty* (inventive surprise). | **Epistemic & Craft Bedrock** explicitly models Canonical ↔ Radical, Order ↔ Chaos, and System ↔ Intuition alongside tactile Craft tolerances. |
| **Bradley & Terry (1952)** / **Setwise Preference Elicitation** | Relative comparisons (`A vs. B` on the same brief) eliminate personal rating-scale bias in half the cognitive time. | Session mixes **Foil Pairs** (same problem, opposite philosophy), **Live 4-State Craft Scrubbers** (same component, 1 mutated CSS variable), and **Single-Plate Studio Critiques**. |
| **Spotify Blend Latent Neighborhoods** | Great blends balance ~50% shared canon with ~50% high-affinity crossover discovery. | Every Blend outputs: (1) **Shared Pantheon**, (2) **The Debate Plate** (widest rating clash + opposing critique notes), (3) **Subcategory Resonance Matrix**, and (4) **Crossover Discovery Bridges**. |

---

## 4. The Unified Hierarchical Correlation Mathematics (`taste-engine v2.0.0`)

How do we cover deep fields and subcategories (Visual Language, Layout Grid, Motion Physics, Typography in UI, Data Density, Poster Lineage, Brand Systems, Editorial Print, Expressive Type, Packaging/Material, Spatial/3D) and correlate them into **one coherent mathematical model** without hand-inventing 2,000 brittle graph edges?

### 4.1 Four-Tier Representation of Every Plate ($p \in \mathcal{P}$)
Each plate $p$ carries:
1. **Taxonomy Coordinates:** `fieldId` $\in \{\text{ui-ux}, \text{graphic-design}, \text{brand-type}, \text{motion-spatial}\}$, `categoryId` (16 deep subcategories), `styleId` (canonical style node from the deep taxonomy), and optional `pairGroupId` / `craftDimension`.
2. **8-Axis Epistemic Loadings** $\mathbf{L}_p \in [-1, +1]^8$:
   `order_chaos`, `minimal_maximal`, `classic_contemporary`, `functional_expressive`, `warm_cold`, `flat_dimensional`, `literal_abstract`, `system_intuition`.
3. **4 Craft Parameter Loadings** $\mathbf{C}_p \in [-1, +1]^4$:
   `density` (Spacious `-1` ↔ High-Throughput `+1`), `typography` (Geometric/System `-1` ↔ Expressive/Editorial `+1`), `chromatic` (Monochrome/Muted `-1` ↔ High-Chroma `+1`), `surface` (Flat/Hairline `-1` ↔ Tactile/Dimensional `+1`).
4. **Diagnostic Polarity Flag:** Includes curated *Aversive Foil / Anti-Slop* plates (e.g., over-glowing purple AI SaaS templates, low-contrast neumorphic widgets) that test aversive acuity alongside historical and contemporary masterworks.

### 4.2 Signal Normalization & Append-Only Semantics
Every user interaction appends an immutable `Signal`:
- `mode`: `"rate"` | `"pair"` | `"rank"` | `"pick"` | `"anchor"`
- `value`: $0 \dots 100$ (`92` = *Defend / Canon*, `74` = *Respect*, `40` = *Polite Pass*, `10` = *Hard Reject / Slop*; pairwise winner = `86`, runner-up = `28`, "Both Hold Up" = `76/76`, "Neither" = `18/18`; 4-way craft rank = `[95, 68, 38, 12]`).
- `critiqueTags`: optional array of structured studio reason slugs.
- `sequence`: monotonic integer; **latest signal per `plateId` wins** at profile recomputation, keeping full version history intact.
- `Skip` is never stored as a dislike—it remains unobserved.

### 4.3 Latent Graph Correlation Kernel (How All Styles & Subcategories Connect)
Instead of arbitrary guessed edges, any two style nodes $s_i, s_j$ across *any* subcategory or field share a deterministic **Structural Lineage Kernel** $K(s_i, s_j) \in [-1, +1]$ computed as the cosine similarity of their combined 12-dimensional `[AxisLoadings ⊕ CraftLoadings]` vectors:

$$K(s_i, s_j) = \frac{\langle \mathbf{z}_{s_i}, \mathbf{z}_{s_j} \rangle}{\|\mathbf{z}_{s_i}\|_2 \, \|\mathbf{z}_{s_j}\|_2}$$

- *Example of Emergent Cross-Branch Correlation:* Josef Müller-Brockmann's `gd_swiss_intl` poster (`order: -0.95, system: -0.90, density: +0.20, flat: -0.85`) naturally exhibits $K > +0.84$ with `ui_grid_strict` and Massimo Vignelli's `gd_wayfinding_system`, while exhibiting strong contrast ($K < -0.78$) with `gd_punk_zine` and `ui_aurora_slop`.
- **Posterior Style & Subcategory Propagation:**
  For every style $s$ in the taxonomy, the designer's posterior affinity $\hat{y}(s) \in [0, 100]$ blends **Direct Observation** (when the user explicitly reacted to a plate of style $s$) with **Kernel-Propagated Evidence** across correlated styles within and across fields:
  $$\hat{y}(s) = \alpha_s \cdot y_{\text{obs}}(s) + (1 - \alpha_s) \cdot y_{\text{kernel}}(s)$$
  where $\alpha_s = 0.78$ when directly observed and $0$ when inferred purely via structural correlation.

### 4.4 Branch-Specific Slices & Creative Contradiction Detection
Alongside the global bedrock, `computeProfileVersion` computes:
1. **`fieldSlices[fieldId]`**: Independent 8-axis vector + coverage per creative field (`UI / Product`, `Graphic & Editorial`, `Brand & Typography`, `Motion & Spatial`).
2. **`craftProfile`**: Explicit positions `[0..100]` on `density`, `typography`, `chromatic`, and `surface`.
3. **`categoryAffinity[categoryId]`**: Ranked affinity and evidence count across all 16 subcategories.
4. **`negativeAnchors`**: Plates/styles strongly rejected (`value ≤ 22`) plus dominant aversive critique tags.
5. **`creativeRange` (Branch Tension Detector):** Measures maximum inter-field divergence $\Delta_{\text{branch}} = \max_{f_1, f_2, k} |A_{f_1, k} - A_{f_2, k}|$ where both fields have coverage $\ge 0.35$. When $\Delta_{\text{branch}} \ge 28$, the profile explicitly highlights the designer's creative duality (e.g., *"Strict Structuralist in Interface Design, yet Expressive & Tactile in Print"*).

### 4.5 The v2 Dyadic Blend Score (Calibrated, Multi-Layer, Dealbreaker-Protected)
Given Designer $A$ and Designer $B$:

1. **Axis & Epistemic Cosine ($S_{\text{axes}} \in [-1, 1]$):** Coverage-weighted cosine across overlapping axes.
2. **Craft Bedrock Alignment ($S_{\text{craft}} \in [0, 1]$):** Mean proximity across the 4 craft dimensions ($1 - \frac{1}{4}\sum_c |C_{A,c} - C_{B,c}| / 100$).
3. **Correlated Subcategory & Style Graph Overlap ($S_{\text{graph}} \in [-1, 1]$):** Cosine similarity over centered posterior `styleVector` scores weighted by joint observation/kernel confidence, plus direct co-rated plate correlation.
4. **Non-Linear Sigmoid Calibration ($S_{\text{raw}}$):**
   Combines $0.35 \cdot S_{\text{axes}} + 0.30 \cdot (2 S_{\text{craft}} - 1) + 0.35 \cdot S_{\text{graph}}$ and passes through a steepened logistic curve centered so random unrelated pairs land around `48–56%` instead of `82%`.
5. **Dealbreaker Clash Penalty & Hard Cap ($P_{\text{clash}}$):**
   For every co-evaluated plate (or strongly observed style) where $\max(v_A, v_B) \ge 80$ (*Canon*) and $\min(v_A, v_B) \le 20$ (*Hard Reject / Slop*):
   - Deduct `7` points per severe dealbreaker clash (up to `24` points).
   - If $\ge 3$ severe dealbreaker clashes occur on high-weight plates, cap maximum Resonance at `58%` ("Aesthetic Stand-Off").
6. **Harmony vs. Productive Friction Split:**
   - **Shared Sensibility (`harmonyScore`, 0–100%):** Final calibrated, penalty-adjusted resonance.
   - **Creative Friction (`frictionScore`, 0–100%):** Measures energetic divergence across secondary stylistic axes when the craft floor is shared—identifying whether differences are *generative studio tension* or *fundamental craft incompatibility*.

---

## 5. The 48+ Plate v1 Seed Plan (Zero-Grind, High-Signal Architecture)

Rather than requiring 330 uncurated stock images, v1 ships with **52 precision-authored plates** spanning **4 Creative Branches** and **14 Deep Subcategories**, structured into three high-signal stimulus classes:

1. **12 Controlled Craft Variant Plates (3 Strips × 4 Live States):**
   - *Strip 1 — Information Density (`craft-density`):* Ultra-Dense Telemetry (4px) · Compact Operator (8px) · Balanced Product (16px) · Atmospheric Gallery (32px).
   - *Strip 2 — Typographic Voice (`craft-type`):* Neutral Neo-Grotesk · High-Contrast Editorial Serif · Technical Tabular Mono · Kinetic Variable Display.
   - *Strip 3 — Surface Materiality (`craft-surface`):* Surgical Hairline Wire · Warm Archival Vellum · Translucent Optical Glass · Tactile Hardware Detent.
2. **32 Iconic Contrast Foil Plates (16 Head-to-Head Pairs across Subcategories):**
   - *UI Visual Language:* Dark Command Precision (Linear/Raycast lineage) vs. Soft Tonal Consumer Pastel; Raw Structural Brutalist Web vs. Frosted Spatial Glass.
   - *UI Layout & Data:* High-Frequency Financial Terminal vs. Single-Column Calm Reader; Modular Bento Specimen vs. Full-Bleed Narrative Scroll.
   - *UI Motion & UX Philosophy:* Zero-Latency Keyboard Command vs. Spring-Physics Gesture Sheet; Opinionated Zero-Settings Tool vs. Exposed Node-Graph Workspace.
   - *Graphic Poster Lineage:* Swiss International Modular Grid (Müller-Brockmann lineage) vs. Xerox Cut-and-Paste Punk Zine; Japanese Geometric Ma (Ikko Tanaka lineage) vs. Layered Postmodern Maximalism.
   - *Brand & Typography:* Mathematical Monoline Symbol vs. Bespoke Hand-Cut Wordmark; Classical Book Proportion vs. Deconstructed Experimental Type.
   - *Packaging, Print & Spatial:* Apothecary Typographic Restraint (Aesop/Muji lineage) vs. Chromatic Shelf Pop; Civic Wayfinding Standard (Vignelli lineage) vs. Generative Algorithmic Identity.
3. **8 Polarizing Diagnostic / Anti-Slop Foil Plates:**
   - Specifically designed to trigger *Aversive Acuity*: Purple-Mesh "AI Supercharge ✨" SaaS Hero, Low-Contrast White-on-White Neumorphic Dial, Over-Decorated 3D Clay Mascot Dashboard, Hyper-Dense Brutalist Anti-UX Directory, etc.

**Session Pacing:**
- **Studio Quick Read (~3 minutes, 14 prompts):** 3 Live Craft Strips + 4 Foil Pairs + 6 Single-Plate Critiques + Optional North-Star Reference URL → Complete, versioned, shareable Taste Fingerprint.
- **Deep Dive Mode (+12 to +38 plates anytime):** Appends signals into `v2`, `v3`... and generates an instant **Taste Drift Diff**.

---

## 6. Design System & UX Principles ("Archival Vellum & Tactile Loupe")

1. **Silent Gallery Chrome:** Warm archival vellum (`#F5F3EE`) in light mode, carbon obsidian (`#0B0B0A`) in dark mode, `1px` crisp architectural grid hairlines, subtle inner outlines around every specimen (`inset 0 0 0 1px rgba(...)`), zero gradient washes, zero decorative AI sparkles.
2. **Mobile-First Critique Ergonomics:** Primary reaction controls (`Reject · Pass · Respect · Canon`) and 1-tap Critique Chips sit squarely in the bottom thumb arc (`44px+` targets), with spring-damped drag/flick physics on touch and instant zero-lag hotkeys (`1–4`, `←/→`, `S`) on desktop.
3. **Designer Identity & Archival Restraint:** Profiles read like a **Swiss Type Foundry Specimen Sheet + Read.cv Dossier**—tabular monospace indices, honest per-axis coverage bars, branch-duality callouts, user critique quotes, and version history.
4. **The Viral 9:16 Blend Receipt / Index Card:** Pairwise Blends render both a wide desktop comparison studio *and* a stark, high-contrast `9:16` **Archival Compatibility Specimen** featuring Harmony %, Friction %, Dyad Classification, Shared Pantheon thumbnails, and the #1 Debate Clash—ready for 1-tap PNG export to Instagram Stories, X, or Slack.
