# Design Blend — CREDITS

**Status:** Phase 0 contract. Governs every image in the plate catalog. Aligned with the locked decision: **credited reference work, not licensed stock.**

## Policy

Every plate is a **reference citation** — we show publicly visible design work to identify a style, and we credit it. We do not claim, imply, or require any license beyond what referencing for identification already carries.

## Requirements per plate (enforced by catalog schema)

| Field | Rule |
|---|---|
| `credit_line` | Mandatory. Names the creator/owner, e.g. `"Linear (linear.app)"`, `"Poster: Josef Müller-Brockmann, 1955"`. |
| `source_url` | Mandatory. Where the work lives publicly (product site, portfolio page, museum record). |
| `license_note` | Mandatory enum: `product-screenshot` · `portfolio-credit` · `public-domain` · `press-kit`. |
| `alt_text` | Mandatory, describes the *visual style*, not the subject. |
| Hotlinking | Avoid. Prefer self-hosted copies recorded with source + credit + retrieval date in `catalog/`. |

## Sourcing priorities (in order)

1. **Product screenshots** for UI styles — credit the product (Linear, Stripe, Vercel…).
2. **Portfolio-platform work** — credit the named designer with a link to their page.
3. **Public-domain / museum records** for historical movements (Bauhaus, Constructivism, Art Nouveau).
4. **Press-kit imagery** where products publish usable references.

Exclusions: no private/unpublished work, no images behind login, no watermarked previews, nothing the owner has asked not to be referenced.

## Takedown process

1. Email/file an issue naming the `plate_id`.
2. Plate is swapped or removed **within 7 days**; `CATALOG_VERSION` bumps.
3. Retired plate ids are never reused — existing profile versions that reference them keep their stored image metadata and are never silently reinterpreted.
4. The registry of retirements lives in `catalog/retired.json`.

## The one rule that matters

A designer must look at a plate and say *"oh yes, I know exactly what that is"* within two seconds. If the credit is wrong or the image is generic stock, the plate is wrong — swap it before launch. **No plate ships without its credit line.**
