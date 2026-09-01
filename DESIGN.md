# Design Blend — DESIGN

**Status:** Phase 0 contract. Visual identity for the Tools Lab lane B product ("image-led creative salon"). Must read as a distinct product from Pairwell and the other Tools Lab apps.

## Product identity

An **image-first design salon**: the plates *are* the interface. The chrome stays quiet so the curated work can be argued about. Confident white space, warm gallery surfaces, crisp captions and metadata — like walking a well-lit gallery, not filling a form.

## Visual system

- **Surfaces:** warm off-white gallery canvas in light mode; deep warm charcoal in dark mode. Large plate areas always get maximum contrast against the chrome.
- **Category accents:** each of the 12 categories owns one **high-chroma accent** used only for category identity (cover-plate frames, progress, active states) — never for body text.
- **Type:** one expressive display face for product voice; one neutral workhorse for UI/metadata. Captions carry *credit line + source* beneath every plate, set small but never below AA contrast.
- **Layout:** plate-first grids; generous padding; metadata always subordinate to image. Profile and blend views are **comparison canvases**, not card stacks.
- **Motion:** calm and purposeful (150–250 ms eases). Quiz transitions never animate the plate being rated. `prefers-reduced-motion` fully honored.

## Key surfaces

| Surface | Composition rule |
|---|---|
| **Home** | Immediate entry into building or opening a profile; one sample blend visible to visitors |
| **Capture** | One plate dominates; progress + coverage indicator; category transitions announced; large-image loading states |
| **Profile** | Fingerprint composition (axes + top plates the user actually rated); version selector; drift diff; export/share/delete controls |
| **Blend** | Elegant comparison canvas: % with coverage → per-axis breakdown → **shared proof plates** → **divergent plates** → share/download artifact |

## States that must ship (non-negotiable)

Skeletons for image loads · offline/error/retry · empty catalog or category · private/blocked/expired-invite profiles · profile-not-ready · mobile (thumb-reachable rating controls) · keyboard-only capture · zoom/contrast (WCAG-minded) · reduced motion.

## Anti-goals

No decoration-only style labels unsupported by the model · no gradient-on-gradient "AI aesthetic" · no carousel where a grid answers faster · no archetype confetti — the score and the plates are the heroes.
