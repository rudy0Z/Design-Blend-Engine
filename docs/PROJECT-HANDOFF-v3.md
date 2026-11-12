# Design Blend v3 — Master Project Handoff

**Repository:** `rudy0z/design-blend-engine`  
**Date:** November 12, 2026  
**Status:** Architecture locked, v3 engine + UI built and verified, ready for Supabase project credentials & live deployment.

---

## 1. Executive Summary & Core Ideology

Design Blend is a tactile, multi-disciplinary taste-profiling and creative dyad matching platform. It rejects the premise that aesthetic sensibility can be captured by a flat 5-axis questionnaire, job titles, or generic style labels ("clean", "minimal", "modern").

### Why Designing for Designers is Different
1. **Context-Sensitive Duality:** The same creative can be ultra-disciplined and surgical when designing interface systems, yet expressive, raw, and tactile in print, fashion, or photography. Design Blend preserves these creative contradictions rather than averaging them into a meaningless "50% neutral".
2. **Cognitive Mastery Over Surface Valence:** Laypeople react to surface mood and color; designers react to cognitive mastery (grid tension, typographic hierarchy, material honesty, physical detents, historical lineage).
3. **Aversive Acuity (Distaste as Identity):** In creative practice (Bourdieu, 1979), what a designer *refuses to ship* ("AI-slop purple mesh", "low-contrast extruded neumorphism", "wobbly 700ms bounce animations") carries 2-3x more diagnostic signal than polite consensus.
4. **Physical Object Craft Over Sassy/Boxy SaaS:** Banned the generic 2026 "Paper Edition" template (beige newsprint, Instrument Serif, uppercase mono labels `01 — STUDIO`, rigid `1px` boxes). The interface operates as a **Smoked Onyx Backlit Light-Table & Physical Slide Playground** with real spring physics, liquid glass docks, FM rotary tuners, 2x optical glass magnifier loupes, and perforated tear-off ticket stubs.

---

## 2. Iteration History & Evolution

| Iteration | Spec Docs | Architecture | What It Solved | Why It Was Replaced |
|---|---|---|---|---|
| **Iteration 1** | `attached_assets/prd-design-blend` & `design-blend-taxonomy` | 12 Fields, ~60 Categories, 221-330 Styles, 0-100 sliders. | Breadth of creative disciplines; image-anchored nodes. | Severe capture fatigue (35+ min); Likert scale drift; collapsed cross-field contradictions. |
| **Iteration 2** | `docs/DESIGN-BLEND-SYSTEM.md` & `docs/PROGRAM.md` | 4 layers (Context, Craft 40%, Mental 20%, Style 40%), Craft Variant Groups, 2-hop Bayesian graph. | Isolated craft from style (holding content constant while varying a CSS token); honest skips. | Demanded human-researched probability weights for thousands of style pairs before coding; content bottleneck. |
| **Iteration 3** | `docs/FINAL-PLAN.md` & `lib/taste-engine v1` | Append-only `plate_responses`, immutable `profile_versions`, synchronous cosine `computeBlend`. | Audit-proof event-sourcing; zero AI hallucination in scoring. | Suffered from the "@THEZEROQUOTIENT 85% false-positive bug"; flat global vector; 0/68 images populated; boxy developer template. |
| **Iteration 4 (v3 Current)** | `docs/CORE-IDEOLOGY-AND-ARCHITECTURE.md`, `DIRECTION.md`, `taste-engine-2.0.0`, `catalog-v3.0.0` | 8 Creative Worlds, 68 Curated Slides, 12D Structural Lineage Kernel, Dealbreaker Penalty Caps, Harmony vs. Friction, Spotify-Blend 5-Card Story Deck, Supabase Client Wiring. | **Complete production engine**: 2-min capture, zero mid-quiz spoilers, physical tear-off ceremony, multi-card Blend stories, cross-field duality preservation. | **Canonical shipping version.** |

---

## 3. Mathematical Engine Specification (`lib/taste-engine`)

- **8 Epistemic Axes:** `order_chaos`, `minimal_maximal`, `classic_contemporary`, `functional_expressive`, `warm_cold`, `flat_dimensional`, `literal_abstract`, `system_intuition`.
- **4 Isolated Craft Bedrock Dimensions:** `density` (Spacious ↔ Dense), `typography` (System ↔ Expressive), `chromatic` (Muted ↔ High-Chroma), `surface` (Flat ↔ Tactile).
- **12D Structural Lineage Kernel:** Connects styles across subcategories without manual edges:
  $$K(s_i, s_j) = \frac{\langle \mathbf{z}_{s_i}, \mathbf{z}_{s_j} \rangle}{\|\mathbf{z}_{s_i}\|_2 \|\mathbf{z}_{s_j}\|_2}$$
- **Branch-Specific Slices & Duality Detection:** Computes independent axis vectors per creative world (`fieldSlices`) and flags dualities when inter-field gap $\ge 26$ pts.
- **Dealbreaker Clash Penalty Caps ($P_{\text{clash}}$):**
  When Designer A's Canon ($\ge 80$) hits Designer B's Hard Reject ($\le 20$):
  - Deduct 6 pts per clash (up to 22 pts).
  - If $\ge 3$ severe clashes occur, cap maximum score at 58% ("Aesthetic Stand-Off").
- **Harmony vs. Friction Split:**
  - `harmonyScore`: Shared craft standards and canon.
  - `frictionScore`: Generative creative tension across secondary axes.
  - `dyad`: Classification (*Mirror Sensibility*, *Studio Co-Conspirators*, *Counterweight Pair*, *Dialectical Clash*).
- **Crossover Discovery Bridges:** Identifies plates loved by User A ($\ge 82$) that sit $\ge 66\%$ inside User B's latent preference vector to pass across the desk.
- **Generative Taste Auras:** Deterministic HSL-to-Hex algorithm deriving a 3-color harmonic aura `[primary, secondary, glow]` from each designer's axis coordinates.

---

## 4. The 8 Creative Worlds & 68 Curated Slides (`catalog/v1.json`)

1. **Architecture & Spaces:** Tadao Ando cast concrete light slits, Kengo Kuma interlocking cedar, Mies steel/glass pavilions, Zaha Hadid fluid parametric curves, Axel Vervoordt monastic limewash, Dimorestudio velvet/brass salons, Luis Barragán terracotta courtyards, plus RGB LED flip slop foils.
2. **Industrial & Objects:** Braun × teenage engineering rotary synths, transparent polycarbonate PCB tech, Naoto Fukasawa quiet monoliths, Eames bent walnut plywood, Breuer tubular steel, Enzo Mari raw pine, Sabine Marcelis cast amber resin, plus gamer gadget slop foils.
3. **Photography & Film:** Daido Moriyama pushed 35mm street grain, Hiroshi Sugimoto 50/50 seascapes, Juergen Teller direct-flash realism, Wong Kar-wai neon tungsten/emerald halation, Kubrick one-point symmetry, Eggleston Kodachrome, Irving Penn still life, plus over-processed HDR/plastic portrait slop.
4. **Fashion & Material:** Rei Kawakubo deconstructed boiled wool, Phoebe Philo quiet cashmere tailoring, Acronym 3L taped ballistic shells, Japanese indigo boro sashiko, Issey Miyake origami pleats, Iris van Herpen biomimetic couture, Margiela tack stitches, plus loud logo-mania slop foils.
5. **Interface & Apps:** Obsidian command workspaces (Linear/Raycast), daylight reading sanctuaries (iA Writer/Read.cv), refractive liquid-glass sheets (iOS 26/visionOS), high-speed live data telemetry, playful tactile consumer apps, plus purple AI SaaS template slop.
6. **Graphic & Print:** Swiss International concert grids (Müller-Brockmann), cut-and-paste xerox punk zines, Japanese planar Ma geometry, maximalist woodblock collisions (Paula Scher), classical hardcover book spreads (Tschichold), rule-breaking magazine spreads (Ray Gun), and two-color soy risographs.
7. **Brand & Lettering:** Reductive geometric symbols (Paul Rand), living dynamic algorithmic identities (MIT Media Lab), bespoke calligraphic ligatures, sculptural variable display type, plus live type personality tuners.
8. **Motion, 3D & Spatial:** Interruptible critically-damped spring sheets, zero-latency 0ms tool snaps, real-time vector flow field shaders, tactile keycap detents, plus wobbly 700ms overshoot bounce slop.

---

## 5. Frontend & Interaction Architecture (`artifacts/design-blend`)

- **Design System:** Smoked Onyx light-table theme (`#0B0D11`), Cool Studio Ceramic toggle, Bricolage Grotesque (display) + Schibsted Grotesk (interface) + Martian Mono (tabular numerals).
- **Living Motion Components:**
  - `Header.tsx`: Floating liquid-glass capsule nav with spring layout pill (`layoutId="glass-nav-pill"`), conic Taste Aura emblem, and theme toggle.
  - `home.tsx`: Splayed 7-world Fan Deck hero that lifts cards under pointer, Ambient light-table glow that shifts with active slide, live FM rotary tick-tape tuner, and 3-card flippable story demo.
  - `capture.tsx`: World cartridge tray selector, pairwise side-by-side trade-offs, live 4-channel FM craft tuner, physical drag/throw stack with 2.2x optical glass magnifier loupe, 1-tap gut critique chips, and the climactic **Perforated Tear-Off Pass Ceremony** (zero mid-session spoilers).
  - `profile.tsx`: Permanent taste dossier, generative aura backdrop, multi-world fader ruler (`AxisRuler`), what you notice first chips, pinned inspiration reference, and obsessed vs. hard pass gallery.
  - `blend.tsx`: **Spotify-Blend-Style 5-Card Interactive Story Deck**:
    1. *The Merge* (orbiting dual aura orbs, match %, duo title).
    2. *Same Eye* (shared obsessions).
    3. *The Friendly Fight* (widest clash with dealbreaker penalty callouts and verbatim critique chips).
    4. *Across Worlds* (animated chemistry bars across all 8 fields).
    5. *Steal This* (crossover discovery references with predicted fit).
    - Includes 1-tap 2x Retina PNG card export and a **Full Map** toggle.
  - `blend-invite.tsx`: Dedicated landing page for incoming invite tokens (`/blend/invite/:token`).

---

## 6. Supabase Backend Integration Guide

The frontend is already wired with `@supabase/supabase-js` via `src/lib/supabase-slot.ts` and `src/lib/backend-provider.ts`. Until you provide live keys, it runs seamlessly using an in-browser preview vault with 5 pre-seeded creatives (`@alba`, `@marlow`, `@kenji`, `@sora`, `@mateo`).

### When you create your Supabase project:
1. **Run Migration:** Execute `supabase/migrations/20261112000000_design_blend_v2.sql` in the Supabase SQL Editor. This sets up all tables (`plates`, `capture_sessions`, `plate_responses` with immutability triggers, `user_reference_anchors`, `profiles`, `profile_versions`, `blend_invites`, `blends`) and Row-Level Security (RLS) policies.
2. **Configure Auth:** In Supabase Dashboard → Authentication → Enable Email (Magic Link / Password), Anonymous Sign-Ins, Google, and GitHub.
3. **Configure Storage:** Create two buckets in Supabase Storage:
   - `plates` (Public read for hosted artwork).
   - `user-references` (Authenticated uploads for pinned user inspiration).
4. **Set Environment Variables:** In `artifacts/design-blend/.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_PLATE_CDN_URL=https://your-project-ref.supabase.co/storage/v1/object/public/plates
   ```

---

## 7. Verification & Test Suite Results

- `lib/taste-engine`: 23/23 unit tests green (profile determinism, axis updates, v2 branching & duality detection, kernel correlation, dealbreaker clash penalties, crossover bridges, drift diffs).
- `lib/db`: 8/8 catalog integrity tests green (unique plate IDs, known styles/categories, valid axis loadings $[-1, 1]$, credited licenses, rank-eligible counts).
- `workers/api`: 5/5 rate-limiter tests green.
- `artifacts/design-blend`: Clean TypeScript typecheck (`tsc -p tsconfig.json --noEmit`) and clean production build (`vite build`) producing minified production assets.
