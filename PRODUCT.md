# Design Blend — PRODUCT

**Status:** Phase 0 contract (owner-approved). Aligned with [`docs/FINAL-PLAN.md`](docs/FINAL-PLAN.md).

## The user contract

**Who creates a profile:** a working designer or design student with existing opinions. No persona is invented; the product is built for someone who would actually send it to a collaborator.

**What a profile is:** a *durable, updatable record of stated design preferences*, computed from responses to a curated, credited image catalog. It is **not** an evaluation of talent, identity, or skill. Results are patterns in what you chose — nothing more is claimed.

**What a profile is not:** a universal measure of taste, a personality test, or a hiring signal. Public copy must never imply otherwise.

**What a Blend claims:** a *similarity readout between two stated-preference profiles* — a percentage with coverage, a per-axis breakdown, and **proof plates** (the actual images both people rated). It measures overlap of stated preferences at a point in time. It does not predict working relationships.

## Capture model

The quiz is not a test — it is how the app *manufactures the listening history* that Spotify Blend gets for free. Three modes, always image-led:

| Mode | Interaction | Meaning |
|---|---|---|
| **Pick** | Choose the plate you prefer from a small set | Binary signal, no intensity |
| **Rank** | Order 4 variants of the same brief | Relative preference within one axis/context |
| **Rate** | Slider or tap, 0–100 on a single plate | Absolute preference |

- **Skip** = *unknown*, never dislike. Skips reduce coverage, not scores.
- Re-rating never mutates history: every response is an **append-only signal**. The newest signal wins at recompute time.
- A first pass is completable in **under 15 minutes** (72-plate catalog, image-led).

## Profile lifecycle (taste evolution)

1. Complete a capture pass → **profile version** computed and written (immutable, version-stamped).
2. Revisit anytime → **"Update taste"**: rate new plates, re-rate changed ones → new version.
3. The previous version stays live and shareable until the user publishes the new one.
4. **Drift diff** shows what moved between versions and which plates caused it.
5. Blends are recomputed only by explicit user action when either profile changes.

## Privacy & data ownership

- Profiles default to **private**; sharing a profile URL or accepting a blend invite is an explicit act.
- Every profile version, blend, and invite can be **exported, revoked, or deleted** by the user.
- Public URLs never leak private session data.
- AI never scores anything. An optional AI-written caption appears only after a deterministic score exists, is cached, labelled, and skippable.

## Non-goals (v1)

Social feeds, public ranking, messaging, hiring/matching markets, global "design twins," AI-decided compatibility, commissioned/licensed imagery.

## Success measures

- Completion → invite → second profile → blend showing **≥3 shared plates both rated ≥80**.
- Designers recognise their own top plates when mixed with corpus decoys.
- Blends get shared **unaided**; arguments happen about *specific images*, not archetype labels.
- Time-to-first-blend for a pair who know each other: **under 20 minutes combined**.
