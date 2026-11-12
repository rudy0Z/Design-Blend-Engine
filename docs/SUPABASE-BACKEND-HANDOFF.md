# Design Blend — Supabase Backend Handoff & Integration Specification

**Status:** Ready for Provider Provisioning (`taste-engine-2.0.0`)  
**Migration File:** [`supabase/migrations/20261112000000_design_blend_v2.sql`](../supabase/migrations/20261112000000_design_blend_v2.sql)  
**Frontend Adapter Slot:** [`artifacts/design-blend/src/lib/backend-provider.ts`](../artifacts/design-blend/src/lib/backend-provider.ts)

---

## 1. Architecture Overview & Zero-Blocker Adapter Design

The frontend (`artifacts/design-blend`) and pure scoring package (`@workspace/taste-engine`) are decoupled from network transport via a clean **Backend Provider Adapter** (`src/lib/backend-provider.ts`).

Currently, three runtime modes exist out of the box:
1. **`supabase` mode (Target Production):** Activates automatically as soon as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are supplied in `.env`. Uses Supabase Auth (Magic Link / GitHub / Google / Anonymous Guest upgrade), PostgREST + Row-Level Security (RLS), and Supabase Storage (`plates` + `user-references` buckets).
2. **`worker-api` mode:** Connects to the Hono Cloudflare Worker (`workers/api`) or Express server (`artifacts/api-server`) when `VITE_API_BASE_URL` is configured.
3. **`studio-local` mode (Active Default Fallback when env vars are unset):** Runs the exact same `@workspace/taste-engine` v2 deterministic math inside the browser backed by persistent `localStorage` state and 4 pre-seeded designer personas (`@alba`, `@marlow`, `@kenji`, `@sora`), ensuring **100% of the product works locally with zero external keys**.

---

## 2. Environment Variables Required From Backend Owner

When you create the Supabase project, add these variables:

### Frontend (`artifacts/design-blend/.env.local`)
```env
# Set mode to "supabase" once provisioned (defaults to "auto")
VITE_BACKEND_PROVIDER=supabase

# From Supabase Dashboard -> Project Settings -> API
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>

# Public base URL of your Supabase Storage bucket for plate assets (optional override)
VITE_PLATE_CDN_URL=https://<your-project-ref>.supabase.co/storage/v1/object/public/plates
```

### Edge Functions / Seed Scripts (`.env` at repo root — NEVER expose to browser)
```env
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
```

---

## 3. Step-by-Step Provisioning Checklist for You (Backend Handoff)

### Step 1 — Run the SQL Migration
Open the Supabase SQL Editor (or run `supabase db push`) and execute:
- `supabase/migrations/20261112000000_design_blend_v2.sql`

This single idempotent migration creates:
- `public.plates` — Versioned stimulus catalog including `craft_loadings`, `pair_group_id`, `craft_dimension`, `diagnostic_kind`, and mandatory `credit_line`.
- `public.capture_sessions` — Supports both authenticated (`auth.uid()`) and anonymous guest capture sessions (via `anon_token`) that seamlessly claim/merge upon sign-up!
- `public.plate_responses` — **Append-only** signal log (`mode`, `value`, `critique_tags[]`, `context_field`, `sequence`). Updates and deletes are blocked at the trigger/RLS level to preserve event-sourcing invariants.
- `public.user_reference_anchors` — User-submitted "North Star" URLs/uploads ("Work I wish I made") for Crossover Discovery Bridges.
- `public.profiles` & `public.profile_versions` — Stores global `axes`, `field_slices`, `craft_profile`, `category_affinity`, `negative_anchors`, `creative_range`, `style_vector`, `top_plates`, and `model_version`.
- `public.blends` & `public.blend_invites` — Stores computed Harmony %, Friction %, Dealbreaker clashes, Shared Pantheon IDs, Debate Plate IDs, Crossover Bridges, and invite tokens.
- Full **Row-Level Security (RLS)** policies ensuring private profiles never leak while public handles (`is_public = true`) can participate in synchronous Blends.

### Step 2 — Configure Supabase Auth
In **Supabase Dashboard → Authentication → Providers**:
1. Enable **Anonymous Sign-Ins** (critical so a designer clicking a friend's Blend link can take the 3-minute capture *immediately* before creating an account, then link their email/GitHub/Google at the reveal screen via `supabase.auth.updateUser()` without losing a single signal!).
2. Enable **Email (OTP / Magic Link)**, **Google**, and **GitHub** (optional).

### Step 3 — Create Storage Buckets
In **Supabase Dashboard → Storage**, create two buckets:
1. `plates` (**Public** read, admin/service-role write):
   - Upload high-DPI WebP/AVIF plate images (`1200×900` or `1080×1350`, `< 180 KB` each) matching `plate.id` (e.g., `plates/v2/pl_ui_dark_editorial.webp`).
   - Until custom screenshots are uploaded for a slot, the frontend automatically renders its bespoke vector `PlateSpecimen` composition so zero broken images ever appear.
2. `user-references` (**Authenticated** upload, max `2 MB`, MIME `image/webp, image/png, image/jpeg`, scoped to folder `{auth.uid()}/*`):
   - Powers user-uploaded "3 North Star References."

### Step 4 — Install `@supabase/supabase-js` & Flip the Adapter
Once network/project credentials are ready:
```bash
pnpm --filter @workspace/design-blend add @supabase/supabase-js
```
Then wire the concrete Supabase client inside `artifacts/design-blend/src/lib/supabase-slot.ts` (all exact method signatures, table mappings, and RLS-compatible queries are pre-scaffolded and documented right in that file).

---

## 4. Data Integrity Invariants Backend Must Enforce

1. **Append-Only Signals:** `plate_responses` must never `UPDATE` in place. Re-rating a plate inserts a new row with `sequence = max(sequence) + 1`.
2. **Deterministic Server Verification (Optional Edge Function):** While `@workspace/taste-engine` is pure TypeScript and runs identically in browser and Deno/Edge Workers, you can deploy a thin Supabase Edge Function (`supabase/functions/complete-session/index.ts`) importing `@workspace/taste-engine` to compute `profile_versions` server-side if tamper-proof leaderboards/badges are ever introduced.
3. **Version Freezing:** Never overwrite `model_version` or `catalog_version` on existing `profile_versions` or `blends` rows. Recomputing a Blend creates a new snapshot only on explicit user action.
4. **Takedown & Attribution Compliance (`CREDITS.md`):** Retiring a plate sets `status = 'retired'` on `public.plates`; never `DELETE` a plate row referenced by historical `plate_responses`.
