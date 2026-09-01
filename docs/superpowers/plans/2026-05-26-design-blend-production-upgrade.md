# Design Blend Production Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Design Blend as a beautifully presented, defensible design-taste profile and pairing product where people create a durable profile, share it, and explore creative compatibility.

**Architecture:** Retain the existing React, Clerk, API, and database foundations. Establish a versioned taste methodology and pairing model before visual expansion; persist profiles and blends under explicit privacy controls; produce deterministic compatibility results before optional AI-written interpretation.

**Tech Stack:** React, TypeScript, Clerk authentication already present, Express API, Drizzle/Postgres schema already present, image/media delivery, Vitest/Testing Library, Playwright, Vercel with managed Postgres and asset storage where licensed media is used.

---

## Product Role

Design Blend demonstrates user research thinking, visual curation, identity/profile UX, and matching systems. Its promise must be narrower and more credible than "we know your taste": it reveals patterns in stated design preferences and helps two people discuss alignment and difference.

**Visual identity:** A multidisciplinary design salon: image-first choices, confident white space, richly varied media, crisp captions and metadata, warm gallery surfaces balanced with high-chroma category accents, and shareable profile compositions worthy of a creative community.

**Current baseline found in code:**

- Quiz, results, public profile, invite, blend, and auth routes already exist.
- Profile and blend persistence already exists in `lib/db/src/schema`, including public profile controls.
- `artifacts/api-server/src/lib/scoring.ts` weights response time and computes vectors/similarity; its assumptions need validation, explanation, and versioning.
- `artifacts/api-server/src/routes/blends.ts` returns empty shared/divergent lists before asynchronous enrichment, leaving the core match result incomplete or serverless-fragile.

## Release Boundaries

- Durable shareable profiles, privacy controls, profile refresh, and deterministic blend output are required for launch.
- Image selection methodology, licensing, attribution, accessibility, and discipline coverage are product requirements, not content polish.
- AI may write a short optional collaboration interpretation only after deterministic output exists; it cannot decide compatibility.
- Public social feeds, public ranking, messaging, or hiring uses are excluded from the first production release.

## File Ownership Map

| Area | Existing paths to inspect or change | New paths expected |
| --- | --- | --- |
| Product/method | Repository root, PRD/taxonomy docs | `PRODUCT.md`, `DESIGN.md`, methodology/version record |
| Quiz engine | `artifacts/design-blend/src/pages/quiz-*`, `artifacts/api-server/src/lib/scoring.ts`, adaptive engine files | fixtures and engine tests |
| Profiles/blends | `lib/db/src/schema/profiles.ts`, `blends.ts`, `quiz-sessions.ts`, API routes | migrations for model/content versions and consent |
| UI | home, quiz, results/profile/blend screens, shared components/CSS | gallery/media components and visual tests |
| Deployment | API/app configuration | CI, monitoring, env/privacy docs |

## Task 1: Define the Taste Product and Media Method

**Files:** Create `PRODUCT.md`, `DESIGN.md`, methodology document; reconcile existing PRD and taxonomy notes.

- [ ] Write the user contract: who creates a profile, what a profile means, what a blend claims, how results can be updated, shared, made private, exported, or deleted.
- [ ] Define an express path and a deeper calibration path, with completion time, confidence language, skip behavior, and rules for updating old results.
- [ ] Write a content methodology for the image corpus: disciplines represented, sampling balance, tagging review, rights/attribution, alt text, sensitive-content screening, and versioning.
- [ ] Establish a visual system for gallery browsing, comparison, profile display, blend view, loading/error states, and mobile interaction.
- [ ] Define research validation: designer review sessions and small pilot sessions to check whether prompts and results are intelligible and not stereotyped.

**Acceptance checks:**

- [ ] The documents explain that a profile is based on responses to a curated corpus, not a universal evaluation of design talent or identity.
- [ ] Every publicly used media item has permission/source handling and accessible text.

**Commit:** `docs: define design blend methodology and design contract`

## Task 2: Build a Test and Model Evaluation Harness

**Files:** Engine/scoring modules, API routes, UI flow components, test and CI configuration.

- [ ] Add unit tests for axis updates, style vector construction, similarity, quiz termination, version behavior, and low-information input.
- [ ] Add deterministic fixture sessions covering disciplines, skips, repeated signals, conflicting responses, and express/deep paths.
- [ ] Add integration tests for authentication, profile creation/update/privacy/deletion, invite expiration, blend creation, and public visibility.
- [ ] Add Playwright paths for first quiz, returning profile owner, shared profile visitor, invited blend participant, empty/error states, mobile operation, and keyboard accessibility.
- [ ] Add CI commands for lint, typecheck, unit/integration tests, build, and end-to-end smoke verification.

**Acceptance checks:**

- [ ] A content/model version change cannot silently reinterpret an existing public profile.
- [ ] A private profile and expired invite cannot be retrieved by an unauthorised visitor.

**Commit:** `test: establish design blend production harness`

## Task 3: Make the Taste Engine Defensible

**Files:** `artifacts/api-server/src/lib/scoring.ts`, adaptive engine module, schema/migrations, results UI.

- [ ] Catalogue every axis and the evidence used to map image responses into that axis; remove unreviewed mappings from launch content.
- [ ] Evaluate response-time weighting with testing evidence; remove it from scoring unless user research supports the effect and the UI discloses it fairly.
- [ ] Version the corpus, taxonomy, scoring model, and profile calculation in stored profile/session records.
- [ ] Return confidence/coverage explanations based on collected evidence and skips rather than displaying false precision.
- [ ] Add a re-profile flow so users can preserve an old shared result or intentionally publish a newer version.

**Acceptance checks:**

- [ ] Two identical completed sessions under the same model version yield identical profile vectors and explanations.
- [ ] Users can see the inputs and limitations behind their profile result in ordinary language.

**Commit:** `feat: version and validate design blend taste engine`

## Task 4: Correct Compatibility and Shareable Profile Logic

**Files:** `lib/db/src/schema/profiles.ts`, `blends.ts`, API profile/blend routes, result/profile/blend screens.

- [ ] Make deterministic shared tendencies, divergent tendencies, axis comparison, and similarity available in the response synchronously, without depending on background AI work after a request completes.
- [ ] Store pairing model/content versions alongside a blend, and support recalculation only by an explicit user action when profiles change.
- [ ] Treat AI collaboration language as cached optional copy with timeout/fallback, clear labelling, and no effect on compatibility.
- [ ] Complete account controls: public/private toggle, share URL, revoke access where appropriate, download profile data, delete account/profile/session/blends.
- [ ] Design invite acceptance, expired invite, profile-not-ready, blocked/private, and regenerated-profile states.

**Acceptance checks:**

- [ ] Every blend page shows meaningful core output when AI is disabled.
- [ ] Public URLs do not leak private quiz-session details or unconsented user data.

**Commit:** `feat: deliver durable profiles and reliable blends`

## Task 5: Redesign the End-to-End Experience

**Files:** React route pages, shared components, CSS/tokens, media pipeline.

- [ ] Replace the generic feature-card home with an immediate image-led entry into building or opening a profile, with a sample result view for visitors.
- [ ] Design quiz pacing: progress and confidence indicators, category changes, save/resume, skips, reaction controls, large image handling, keyboard input, and touch comfort.
- [ ] Make profiles compositionally expressive across disciplines without converting results into decorative personality labels unsupported by the model.
- [ ] Make the blend view an elegant comparison canvas: common ground, productive divergence, axis comparison, selected evidence, and a share/download artifact.
- [ ] Implement robust skeleton, offline/error/retry, account, empty media, mobile, contrast, zoom, screen-reader, and reduced-motion states.

**Verification:**

- [ ] Visual review demonstrates an image-rich identity clearly distinct from Pairwell and the other Tools Lab apps.
- [ ] Accessibility and performance tests include large media loading, keyboard-only quiz completion, and mobile blend sharing.

**Commit:** `feat: create design blend gallery and pairing experience`

## Task 6: Harden Data, Content, and Hosted Operations

**Files:** API middleware/routes, DB migrations, authentication settings, storage/media configuration, privacy and deployment docs.

- [ ] Use server-enforced ownership and visibility on every profile, session, blend, and invite operation.
- [ ] Establish image storage and delivery rules with legal source tracking, transforms, size budgets, cache behavior, and deletion/replacement process.
- [ ] Protect any AI and write endpoints with validation, rate limits suitable for distributed/serverless operation, abuse detection, cost caps, and safe logging.
- [ ] Document retention, export, deletion, database backup/migrations, secrets, incident response, analytics consent, and free-tier monitoring.
- [ ] Configure Vercel preview and production environments with managed database/auth/media integrations and automated migrations/smoke checks.

**Acceptance checks:**

- [ ] Production can operate with AI disabled and has a known monthly cost ceiling.
- [ ] A data-deletion test removes or irreversibly detaches public access and associated stored private records under the policy.

**Commit:** `feat: secure and deploy design blend data services`

## Task 7: Validate Taste and Prepare Portfolio Presentation

**Files:** Test results, README, product media/demo fixtures, operational documents.

- [ ] Run the product with a review group spanning at least typography, UI/product, branding/graphic, and motion/illustration interests; record methodology issues and revise content/model versions deliberately.
- [ ] Perform complete automated verification, manual accessibility review, responsive visual review, security/privacy review, performance budget checks, and hosted smoke test.
- [ ] Seed an instant non-personal demo profile and blend pair for recruiters who do not wish to create an account.
- [ ] Write README and portfolio copy describing methodology honestly, data choices, major interactions, stack, and public link.
- [ ] Capture polished walkthrough media for quiz selection, profile, and blend comparison.

**Exit criteria:**

- [ ] A user can create, keep, share, revise, export, or delete their profile without redoing unnecessary work.
- [ ] Compatibility output is complete, versioned, and defensible without AI.
- [ ] Hosted experience passes quality, privacy, rights, and cost reviews.

**Commit:** `release: prepare design blend for hosted launch`

