# Design Blend

A **pairwise design-taste match** — like Spotify Blend, but for visual sensibility. Designers react to a curated, *credited* plate catalog; the app manufactures their "listening history," computes a taste fingerprint, and produces a shareable **blend** between two designers with proof plates both actually rated.

**Not** a moodboard. **Not** a personality test. A durable, versioned record of stated design preferences — and you can upgrade your taste after finishing your profile, like music taste changes.

- 📄 Product contract → [`PRODUCT.md`](./PRODUCT.md)
- 🎨 Visual identity → [`DESIGN.md`](./DESIGN.md)
- 🖼️ Image credits policy → [`CREDITS.md`](./CREDITS.md)
- 🗺️ Final build plan + phase status → [`docs/FINAL-PLAN.md`](./docs/FINAL-PLAN.md)

---

## Stack

| Layer | Local dev | Production (all free tiers) |
|---|---|---|
| Frontend | React 19 + Vite + wouter | **Cloudflare Pages** |
| API | Express 5 (Node) | **Cloudflare Workers** (Hono, `workers/api`) |
| Database | Embedded Postgres (`embedded-postgres`) | **Neon Postgres** (`drizzle` + `neon-http`) |
| Taste engine | `@workspace/taste-engine` (pure, tested) | same package, bundled into the Worker |
| Auth | optional Clerk | optional Clerk (v1 runs anonymous) |

Key architecture rules (see `docs/FINAL-PLAN.md`):

- **Signals are append-only.** A re-rate appends a new signal; profiles are immutable snapshots recomputed from signals (`plate_responses` → `profile_versions`).
- **Skips are unknown, never dislike.** Response-time weighting was removed.
- **Blends are synchronous.** One request: weighted cosine over overlapping high-confidence axes + **proof plates from images both people actually rated**. AI never scores anything.
- **Everything is versioned.** `MODEL_VERSION` + `CATALOG_VERSION` are stamped on every profile version and blend.

---

## Quick start (one repo, three terminals)

**Prereqs:** Node 20+ (24 recommended), pnpm 10 (`corepack enable pnpm` or use `npx pnpm`).

```bash
git clone <this repo>
cd Design-Blend-Engine
pnpm install
```

**Terminal 1 — database (embedded Postgres, port 54329):**

```bash
pnpm dev:db
# first run initialises .local/pg and creates the `designblend` DB
```

**From the repo root** (after PG is up), push schema + seed catalog + seed demo pair:

```bash
export DATABASE_URL=postgres://postgres:designblend@localhost:54329/designblend
pnpm db:push && pnpm db:seed && pnpm db:demo
```

**Terminal 2 — API server (port 8080):**

```bash
export DATABASE_URL=postgres://postgres:designblend@localhost:54329/designblend
pnpm api:dev
```

No Clerk keys = runs in **anonymous mode** (`/api/healthz` → `{"status":"ok"}`). Set the Clerk keys later if you want real authentication.

**Terminal 3 — frontend (port 5173):**

```bash
pnpm web:dev
```

Open **http://localhost:5173** → **See a sample blend** (`@alba × @marlow`) or build your own profile at `/capture`.

> **Windows PowerShell** — use `$env:DATABASE_URL="..."` instead of `export ...`.

---

## Environment variables

| Var | Where | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | API + db scripts + Worker secret | yes | Postgres/Neon connection string |
| `PORT` | API, web | no | defaults `8080` / `5173` |
| `BASE_PATH` | web build | no | defaults `/` |
| `CLERK_SECRET_KEY` | API (`CLERK_PUBLISHABLE_KEY`) | no | enables real auth; without it = anonymous mode |
| `VITE_CLERK_PUBLISHABLE_KEY` | web build | no | Clerk frontend key |
| `VITE_API_BASE_URL` | web build | no | API origin; empty = same-origin `/api` |
| `CLERK_PUBLISHABLE_KEY` | API | no | same-origin proxy setup |

---

## Scripts

| Command | Does |
|---|---|
| `pnpm dev:db` | Start embedded Postgres on `:54329` (Ctrl+C stops) |
| `pnpm db:push` / `pnpm db:seed` / `pnpm db:demo` | Push schema · seed 6→72 plates · seed `@alba`×`@marlow` demo |
| `pnpm api:dev` | Build + run the Express API on `:8080` |
| `pnpm web:dev` | Vite dev server on `:5173` |
| `pnpm --filter @workspace/taste-engine test` | 19 deterministic engine tests |
| `node .local/smoke-test.mjs` | Live API capture-flow smoke (vs `http://localhost:8080`) |
| `node .local/blend-smoke.mjs` | Live blend (opposite vs same-taste) smoke |
| `pnpm worker:dev` / `pnpm worker:deploy` | Cloudflare Worker (needs `DATABASE_URL` secret) |

---

## Deploying (Cloudflare + Neon — all free tiers)

1. **Neon** — create a project, copy the pooled `DATABASE_URL`. Run `pnpm db:push && pnpm db:seed && pnpm db:demo` against it locally (or use a Neon branch).
2. **Worker** — in `workers/api`:
   ```bash
   pnpm --filter @workspace/api-worker deploy
   # then set the secret once:
   pnpm --filter @workspace/api-worker exec wrangler secret put DATABASE_URL
   ```
3. **Pages** — connect the repo, build command `pnpm --filter @workspace/design-blend build`,
   output dir `artifacts/design-blend/dist/public`, env `VITE_API_BASE_URL=https://<worker>.workers.dev` (and `BASE_PATH=/`).
   The included `public/_redirects` maps all routes to the SPA for client-side routing.
4. Optional: tighten `CORS_ORIGIN` in `wrangler.toml` to your Pages domain.

> The Worker (`workers/api`) is the production API; the Express server exists for local dev and is not deployed.

---

## Repository layout

```
catalog/v1.json          # versioned taxonomy + plates (credits, axis loadings)
lib/taste-engine/        # pure engine: signals -> profile -> blend (+ vitest)
lib/db/                  # Drizzle schema, catalog + demo seeders
artifacts/api-server/    # Express API (local dev)
artifacts/design-blend/  # React SPA
workers/api/             # Cloudflare Worker (Hono) — production API
docs/FINAL-PLAN.md       # the plan this repo is built against
```

## Status

Phase 0–3 built & locally verified; Phase 4 (this README, Cloudflare Worker, Pages config) built and locally validated — the Worker typechecks and bundles (~183 KiB gzip), and the taste-engine suite is green (19/19). The remaining deploy step needs live credentials: a Neon `DATABASE_URL`, a deployed Worker with that secret, and Pages pointed at `VITE_API_BASE_URL`. The 72-plate catalog is stubbed with 6 working exemplars — real credited images are the remaining content work (see `CREDITS.md`). See `docs/FINAL-PLAN.md` for full status.