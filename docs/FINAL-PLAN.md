# Design Blend — Final Build Plan

**Status:** LOCKED — supersedes `docs/superpowers/plans/2026-05-26-design-blend-production-upgrade.md`, `docs/PROGRAM.md`, and `docs/DESIGN-BLEND-SYSTEM.md` where they conflict. Base repo stays at `596f030` as the starting point.

**Progress (see Phase table below):**
- **Phase 0 — Done.** `PRODUCT.md`, `DESIGN.md`, `CREDITS.md`, `catalog/v1.json` (2 fields, 12 categories).
- **Phase 1 — Done.** `lib/taste-engine` extracted (19/19 fixture tests green), Drizzle schema extended (`plates`, `plate_responses`, `profile_versions` + additive profile/blend columns), catalog seeder. Catalog expanded from 6 exemplars to the full taxonomy via `scripts/src/gen-catalog.ts`: **68 well-formed, credit-ready slots** (every style in the taxonomy, style-matched axes + alt text, status `pending`, `image_url`/credit left `null` for human curation per `CREDITS.md`). Seeded + served by the API (verified: `/api/catalog` returns 68 plates, v1.1.0).
- **Phase 2 — Done (local end-to-end verified).** `/api/catalog`, `/api/capture/*` (sessions, append responses, complete → versioned profile), image-led capture flow at `/capture`, taste-evolution re-rating (v2 appends). Smoke test: 9/9 checks pass against live API + Postgres.
- **Phase 3 — Done (local end-to-end verified).** `GET /api/blends/:a/:b/sync` returns weighted-cosine score + per-axis + **shared/divergent proof plates synchronously** (no AI, no polling). Blend page renders plates on first paint. Demo mode: `.local/seed-demo.mjs` creates `@alba × @marlow` (sample blend link on home). Blend smoke test passes (opposite pair 4%, same-taste 100%, divergent plates correct).
- **Phase 4 — In progress (built, locally validated; live deploy pending).** README clone-and-run; production API ported to a Cloudflare Worker (`workers/api`, Hono + `drizzle-orm/neon-http`, typechecks + `wrangler deploy --dry-run` at ~222 KiB gzip); SPA `_redirects`; root scripts (`dev:db`, `db:push/seed/demo`, `api:dev`, `web:dev`, `worker:dev/deploy`); Windows dev-script + pnpm build-approval fixed. **Post-audit migration (done):** the legacy dual engine was removed — Express no longer mounts `styles`/`quiz`/`blends`, the SPA no longer ships `/quiz*` pages, and legacy tables (`style_*`, `quiz_sessions`) are no longer written by app code. The Worker now has full endpoint parity with Express: `healthz`, `catalog`, `capture/*`, `profiles` (`/me`, `/:username`, `/privacy`, `/versions`), `blends/invite` + `/invite/:token`, `/og/*`, `blends/:a/:b/sync`. Worker identity resolves via `@clerk/backend verifyToken` (optional `CLERK_SECRET_KEY` → anonymous otherwise); the SPA bridges Clerk into the generated client (`setBaseUrl` + `setAuthTokenGetter`). Privacy now defaults to **private** (schema + capture), CORS is pinned to `CORS_ORIGIN`, and fixed-window rate limiting is in both servers. OG blend cards are scored with the same engine path as `/blends/:a/:b/sync`. UI: home copy is image-led (no "adaptive" claims), dark-mode toggle ships, and routes are code-split (landing ~132 KiB gzip). Tests: engine 19 + catalog integrity 8 + rate-limiter 5. Remaining: point `DATABASE_URL` at live Neon, deploy the Worker + set its secret, deploy Pages with `VITE_API_BASE_URL`, then run the smoke tests against the deployed URL.

**Local dev environment (what was verified against):** embedded Postgres via `.local/dev-db.mjs` (port 54329), API server on :8080 without Clerk keys (anonymous capture mode), frontend via Vite.

**Locked decisions (owner-approved):**
1. **Credited, not licensed.** No commissioned corpus, no licensing program. Plates are curated, publicly visible design work with a credit line, source link, and takedown policy.
2. **Bounded catalog.** The 12-field / 330-style taxonomy is deferred. v1 = 2 fields → ~12 categories → ~72 plates. Every option shown to a user is an **image, never text**.
3. **Spotify-architecture reframe.** Design Blend has no passive behavioral data, so the quiz *manufactures the listening history*. Signals are append-only; profiles and blends are **derived, versioned, recomputable** artifacts.
4. **Taste evolution is in scope.** Users extend/re-rate after finishing a profile. New signals → new profile version → drift diff → optional blend recompute. Taste is never a one-shot result.
5. **No invented graph edges in v1.** Graph traversal and co-liking edge weights (the Aug spec's research program) are deferred to v2. v1 scoring uses hand-authored, documented, versioned axis loadings — finite and auditable.

---

## 1. Product model (the three layers)

| Layer | What it is | Spotify analog | Rules |
|---|---|---|---|
| **Signals** | Append-only plate responses: `pick` / `rank` / `rate` (0–100) / `skip` | Scrobbles / listening events | Never mutated or deleted; skip = unknown, never dislike |
| **Profile version** | Computed snapshot: style vector, 8 axes + coverage, archetype | Taste profile / Wrapped | Immutable once written; recomputed only from signals; stamped `MODEL_VERSION` |
| **Blend** | Pairwise readout: %, per-axis breakdown, proof plates | Spotify Blend | Computed synchronously from two profile versions + **shared co-rated plates**; AI never participates in the score |

## 2. Corpus & visual showcase (the plate catalog)

**v1 scope:** Field 1 *UI/UX* + Field 2 *Graphic Design* → 12 categories → 6 plates per category = **72 plates**.

- **Catalog source of truth:** `catalog/v1.json` → seeded into DB; every change bumps `CATALOG_VERSION`.
- **Plate record:** `id, style_id, category_id, image_url, credit_line, source_url, alt_text, axis_loadings, tags`.
- **Sourcing (credited):** real product screenshots (credit the product), portfolio-platform work with designer credit, public-domain for historical movements. Logged in `CREDITS.md`. A takedown = swap the plate + version bump; old plate ids retire so past profiles are never silently reinterpreted.
- **Showcase UX (image-led, no text pickers):**
  - Field selection: two large image-led cards.
  - Category browse: gallery grid; each category has a cover plate.
  - Capture: three modes — **pick** (no intensity), **rank** (order a group of 4 variants of the same brief), **rate** (single plate, 0–100 slider or tap). Skips are fast and count as "unknown."

## 3. Categorization model

Three bounded layers — Context, Style, Axes:

- **Context (navigation only, not scored):** field → category. Exists so a designer can find plates that look like their world.
- **Style (leaf):** each plate carries hand-authored **axis loadings** (which of the 8 axes this style expresses, and how strongly). Loadings live in the catalog, are visible in docs, and are versioned — the honest, bounded substitute for the unresearchable edge graph.
- **Axes (8):** computed as weighted aggregates of responses × loadings, always emitted with **coverage %** per axis. Low coverage = low confidence, shown in ordinary language, never faked to 50.

## 4. Database (better schema)

```
users                        — account, handle, privacy defaults
categories / styles / plates — the catalog, versioned
plate_responses              — APPEND-ONLY signals (user, plate, mode, value, session, ts)
profile_versions             — immutable snapshots (axes, vector, archetype, coverage, MODEL_VERSION, CATALOG_VERSION)
blends                       — (a, b, score, per-axis breakdown, shared_plate_ids, divergent_plate_ids, MODEL_VERSION, computed_at)
blend_invites                — invite tokens, expiry, acceptance state
```

Invariants: responses never update in place (a re-rate appends a new signal); profile versions immutable; blends recompute only by explicit user action; no public URL leaks private session data.

## 5. Scoring (robust + versioned)

- **Removed from the base build:** response-time weighting and skip-as-40 (both flagged by the audit as silent, unfair rules).
- **Profile computation:** deterministic. Same signals + same `MODEL_VERSION` ⇒ identical profile. Unit-tested with fixture sessions (skips, conflicts, low-information, rank ties).
- **Blend computation:** exact cosine on overlapping high-confidence dimensions; display % with coverage; breakdown per axis; **proof plates = the actual images both people rated ≥ threshold (shared) and the highest-contrast plates (divergent)** — returned in the same request, rendered even when AI is off. AI caption = optional, cached, clearly labelled.
- **Versioning:** `MODEL_VERSION` + `CATALOG_VERSION` stamped on every profile version and blend. Bumping a version never silently reinterprets an existing shared profile.

## 6. Taste evolution (in scope, first-class)

- **"Update taste" flow** on the profile: rate new plates, re-rate ones that changed your mind; signals append; recompute → **new profile version**; previous version stays live and shareable until the user publishes the new one.
- **Drift diff:** a small card comparing versions — axes that moved, styles gained/lost, with the plates that caused it. This is the portfolio feature that proves the Spotify-style architecture.
- Blends offer explicit "recompute" when either profile version changes.

## 5b. Backend & hosting (LOCKED — free-only, no Replit, no Vercel)

**Stack decision: Cloudflare + Neon, entirely on free tiers.**

| Concern | Service | Free tier | Notes |
|---|---|---|---|
| Frontend SPA | **Cloudflare Pages** | unlimited bandwidth, 500 builds/mo | `artifacts/design-blend` build output |
| API | **Cloudflare Workers** | 100k req/day | Port Express 5 routes to **Hono** (Workers-native). Routes are thin controllers; port cost is small |
| Database | **Neon Postgres** | autoserverless, free storage | Drizzle via `neon-http` driver (stateless — no pooling issues, no connections to manage) |
| Plate images | **Cloudflare R2** | 10 GB | Self-hosted copies per `CREDITS.md`; no hotlinking |
| Auth | **Clerk** | 10k MAU | Replace `@clerk/express` middleware with `@clerk/backend` token verification (Workers-compatible) |
| AI caption | **Gemini API** | free tier | Behind flag, cached, timeout+fallback, never in score path |
| OG share cards | Workers + **satori** | — | `og.ts` port; satori is pure-JS, Workers-safe |

**Rules that make this stack safe:**
- Everything product-critical is **synchronous in-request** (DB reads + pure math). No queues, cron, background workers, websockets.
- No in-process state: any Worker instance can serve any request. Catalog is versioned data in Postgres, not memory.
- Cold starts: Workers are isolate-based — effectively none. Demo links always respond fast.

**Replit removal (done):** `.replit`, `.replitignore`, `replit.md`, `scripts/post-merge.sh` deleted. `postgresql-16` dev module replaced by local Neon branch or Docker Postgres for dev; `DATABASE_URL` remains the single contract.

**Engine extraction:** move `scoring.ts`/`engine.ts` out of `api-server` into new `lib/taste-engine` workspace package (`@workspace/taste-engine`) — pure functions, unit-testable with fixtures, reusable by Workers, scripts, and demo mode. API keeps I/O only.

## 7. Build phases

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **0 — Contracts** | `PRODUCT.md`, `DESIGN.md`, `CREDITS.md`, catalog method | Documents state the user contract, capture modes, credit policy |
| **1 — Catalog + DB + engine** | `catalog/v1.json` (72 plates, credited), migrations, scoring module + unit tests | Deterministic fixtures pass; engine testable without UI |
| **2 — Flows** | Image-led field/category/rate UI, profile page, update-taste flow | A designer completes a profile using **images only**; can extend it later |
| **3 — Blend** | Synchronous blend + proof plates + share/invite + **demo mode** (seeded sample pair, no account) | Blend page is meaningful with AI disabled; shared plates render on first paint |
| **4 — Ship** | README (clone-and-run), **Cloudflare Pages + Workers + Neon deploy**, smoke tests | A stranger runs it in one command; a recruiter tries a blend in <20 min without signing up |

**Success measures (kept from the Aug audit):** completion → invite → second profile → blend showing ≥3 shared plates both rated ≥80; designers recognise their own top plates mixed with corpus decoys; blends shared unaided; arguments happen about *specific images*, not archetype labels.

## 8. Out of scope for v1

Global twins / pgvector ANN · graph traversal & co-liking edge research · 12 fields / 330 styles · AI participation in scores · social feeds & public ranking · commissioned/licensed imagery · custom WebGL share cards · paid hosting of any kind (Replit, Vercel, Render, Railway — all excluded).

---

*Superseded docs are retained for history; when this plan and an older doc disagree, this plan wins.*
