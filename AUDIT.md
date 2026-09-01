# Design Blend — Critical Audit

**Date:** 2026-08-14  
**Corpus:** repo as of `main` @ `596f030` (2026-05-03), plus untracked plans in `docs/superpowers/plans/`. No `README.md` exists. Every claim below is tied to a file, commit, or a named web source. Inferences are marked.

---

## Executive Summary

This is not portfolio-ready, and it is not ready to market to real users. The idea is not thin — “make tacit design taste visible and comparable, the way Spotify Blend makes two listening histories into something you can actually use together” is a specific, defensible bet, and you should keep it. What you built is the *score sticker* of Blend (a percentage, an archetype title, a Gemini one-liner) without the *shared artifact* (the images both people actually reacted to). The engine in `artifacts/api-server/src/lib/engine.ts` is real product logic, not a wrapper around one API call. The experience around it is a Replit/shadcn shell rating Unsplash stock photos that are reused per category (`lib/db/src/seed-data.ts` lines 19–43), then labeling the result as a “taste fingerprint.” A hiring manager who opens this will not ding you for borrowing Spotify. They will ding you because the blend cannot show its work, the quiz is rating the wrong pictures, and a stranger cannot clone and run it. The gap is not visual polish. The gap is that the product currently claims to measure visual taste using images that are not the styles, then reports overlap using styles the user never saw.

---

## Idea Reconstruction

### Core problem (one sentence)

Designers can recognize what they like and cannot articulate it; they have no durable, shareable, *comparable* record of that taste, so collaboration, hiring, and even self-understanding collapse into vibes and Dribbble moodboards.

That sentence is reconstructable from the PRD’s opening (`attached_assets/prd-design-blend_1777791284024.md` lines 11–17) and from the later production plan’s narrower contract (`docs/superpowers/plans/2026-05-26-design-blend-production-upgrade.md` lines 13–15: “reveals patterns in stated design preferences and helps two people discuss alignment and difference”). If you cannot keep that sentence stable, the 32 archetypes will eat the product.

### Who is the imagined user?

You. Not a fictional persona.

Evidence: the PRD is written in the second person of a working designer (“Every designer has a taste fingerprint”), the viral mechanic is a card for LinkedIn/Twitter (`prd` lines 513–541), Blend is “send that link to another designer” (`prd` line 17), and the Tools Lab plan positions this as *your* portfolio signal for “taste research, matching logic, profiles” (`docs/superpowers/plans/TOOLS-LAB-PRODUCTION-PLAN.md` lines 13–14). There is no user interview, no named studio, no “we talked to 8 PMs.” Inference: this is a tool you would actually send to a collaborator or a crush in the industry. That is a strength. Do not invent a “busy hiring manager at a Series B” to make it sound product-y. The honest user is a designer who already has opinions and wants a receipt.

### Original scope vs. what got built

The repo contains two overlapping specs, then a third plan that never executed.

| Source | Date in repo | What it asked for |
|---|---|---|
| `attached_assets/prd-design-blend_1777791284024.md` | committed `8efd626` 2026-05-03 | 12 fields, ~330 image-anchored styles, hot-or-not + slider, 8 axes, 32 archetypes, PNG card, cosine Blend, Gemini collab line, Cloudinary, “Find Your Design Twins” deferred |
| `attached_assets/design-blend-adaptive-engine_1777791284024.md` | same commit | Quiz is a graph traversal / information-gain descent, not an exhaustive list |
| `docs/superpowers/plans/2026-05-26-design-blend-production-upgrade.md` | **untracked**, ~3 weeks later | Version the model, deterministic blend *before* AI, curated licensed images, tests, privacy/deletion, recruiter demo. Every checkbox is still `[ ]`. |

Git history is a single-day build burst, then silence:

- `5b0eedb` 2026-04-27 — Replit workspace scaffold (Express healthcheck, shadcn dump, no product).
- `8efd626` 2026-05-03 — PRD + taxonomy + adaptive-engine docs dropped in.
- `7c9dcfc` → `596f030` 2026-05-03 — Tasks 1–5 in one day: data layer, adaptive engine, quiz UI, Clerk/profiles/blends, Gemini “final polish.”
- 16 commits total on `main`. Branch `replit-agent` exists. No work after May 3 except the untracked May 26 plan.

Where it stalled is visible in the code, not mysterious:

1. **Content never started.** Seed file still says the Unsplash reuse is temporary: “The follow-up task swaps these for per-style hero imagery” (`lib/db/src/seed-data.ts` 19–22). That follow-up does not exist. The PRD budgeted 20–40 hours for 330 images (`prd` 754–755). The build stopped at plumbing.
2. **Category selection is a dead control.** UI writes `selectedCategories` (`quiz-categories.tsx` 65–71). API stores it (`quiz.ts` 62). `pickNext()` in `engine.ts` never reads it — only `selectedFields`. Step 2 of the quiz does not change the quiz.
3. **Blend’s actual overlap is computed after the response, and the sync path returns empty arrays.** `computeBlendCore()` sets `sharedStyles: []` and `divergentStyles: []` (`blends.ts` 177–189), then `void sharedIds; void divergentIds;` (177–178) — the IDs are thrown away. Hydration happens in `scheduleCollaborationLine`, which is `void`ed. The May 26 plan already named this: “returns empty shared/divergent lists before asynchronous enrichment, leaving the core match result incomplete or serverless-fragile” (`2026-05-26-design-blend-production-upgrade.md` line 24).
4. **12 fields collapsed to 2.** `FIELDS` in `artifacts/design-blend/src/lib/fields.ts` is Graphic + UI/UX. The taxonomy doc and PRD’s internationalization section (Japanese / African / Indian / Latin American traditions, `prd` 709–721) are not in the seed. One node, `gd_japanese_poster`, is the entire non-Western gesture.
5. **No tests.** Glob for `*.test.ts` / `*.spec.ts` returns nothing. Adaptive engine, cosine, archetype matching, skip semantics — all untested. The adaptive-engine PRD even asked to “Test with hardcoded sequences before connecting to UI” (line 779). That did not happen.

The original idea did not stall because you “over-scoped AI.” It stalled because the hard thing (a corpus of images a designer would believe) was deferred, and the easy thing (Clerk + shadcn + a Gemini sentence) was called Task #5: “AI integration & final polish.”

---

## Current State Audit

### What a stranger actually gets if they clone this

There is no README. Root `package.json` exposes `typecheck` and `build`. Running the product requires, from code:

- `DATABASE_URL` or the db client throws (`lib/db/src/index.ts` 7–10)
- `PORT` or the API will not listen (`artifacts/api-server/src/index.ts` 6–9)
- `VITE_CLERK_PUBLISHABLE_KEY` or the entire app is a red error screen (`App.tsx` 115–120)
- Clerk proxy wiring (`clerkProxyMiddleware`, `VITE_CLERK_PROXY_URL`)
- A Postgres push (`pnpm --filter @workspace/db run push`) and a seed script that is **not** in `package.json` (`lib/db/scripts/seed.ts`)
- Optional Gemini via `AI_INTEGRATIONS_GEMINI_*` (`gemini.ts` 7–9) — Replit-shaped env names

Inference: this was built to run on Replit, not to be cloned. `replit.md` is the closest setup doc and it never mentions Design Blend, Clerk, or seeding. A recruiter clicking a GitHub URL gets a monorepo and a 404 personality.

### What works end-to-end (assuming env + seed)

Wired and apparently functional on the happy path:

1. Pick fields (`quiz-fields.tsx`) → pick categories (UI only) → create session (`POST /quiz/sessions`) → adaptive `GET .../next` + `POST .../ratings` → `POST .../complete` → results card.
2. Sign in with Clerk, claim a username (`POST /profiles`), public profile URL, privacy toggle (`PATCH .../privacy`).
3. Create a 7-day invite token (`POST /blends/invite`), invite landing (`blend-invite.tsx`), blend page with cosine % and axis deltas.
4. html2canvas PNG download of the card; OG SVG endpoints for profile and blend (`routes/og.ts`).
5. Gemini collaboration line with 8s timeout and a hardcoded fallback (`gemini.ts` 22–23, 60–64, 76–78).

This is more than a single API-call demo. The adaptive picker (`pickNext`, information gain, seed / deeper / contrast / neighbor / lateral / switch_field) is actual product logic.

### What’s stubbed, hardcoded, faked, or lying

**The images are not the styles.** One Unsplash photo ID is reused for every node in a domain (`CATEGORY_IMAGE` + `img()` in `seed-data.ts` 23–43). “Swiss International” and “Psychedelic” in Poster can show the same photograph. The PRD’s whole taxonomy philosophy was “image-anchored — every style node needs a representative image” (`prd` 26). The current corpus falsifies the product.

**The first three questions are not styles.** `getSeedQuestions()` picks `depth === 2` domain probes (`engine.ts` 138–168). Domain nodes are labels like “Poster” and “Visual Language” (`seed-data.ts` 433–498). The rating UI then prints `node.label` on a full-bleed card (`quiz-rate.tsx` 378–380). Users begin by rating a category grouping, not a style.

**“Design DNA” / `topStyles` are predictions, not ratings.** `complete` builds `styleVectorFromAxes(axes, allNodes)` then takes the top 5 IDs (`quiz.ts` 286–290). Those can be styles the user never saw. Blend “shared DNA” is the intersection of two predicted lists (`blends.ts` 171–175), not co-liked images. Spotify Blend is co-listened tracks. This is co-predicted labels.

**Field affinity bars are numerically wrong.** `getFieldDistribution` returns shares `0..1` (`scoring.ts` 114–130). `ProfileCard` does `Math.round(value)` and `width: ${value}%` (`ProfileCard.tsx` 102–110). A 0.62 share renders as “1” with a 0.62%-wide bar.

**Progress is divided twice.** API `progress` is already `ratedCount / target` (`quiz.ts` 161). UI does `(progress / target) * 100` (`quiz-rate.tsx` 179, 182). At 3/30 the bar reads ~0.3%, not 10%.

**Skip is implemented; the rest of the rating PRD is not.** Skip submits `40` and the button says “counts as 2★” (`quiz-rate.tsx` 277–283) — matches `prd` 294. There are no 5 visible stars; there are 1★–4★ plus X/Heart. Hold-to-open-slider is a separate “Use slider” text button. Swipe exists (`RatingCard` drag). `Math.random()` is computed as `dragHint` and then `void`ed (`quiz-rate.tsx` 343–344) — leftover.

**Response time silently changes your score.** `responseTimeWeight` boosts <1s to 1.3× and penalizes >3s to 0.85× (`scoring.ts` 31–37, used in `scoreAxes` 59). The UI never discloses this. The May 26 plan already flagged it (task 3).

**Confidence is not confidence.** `matchArchetype` returns how well axis numbers fit hardcoded ranges (`archetypes.ts` 305–344). Profile UI treats `< 0.6` as “take a few more questions” (`profile.tsx` 150–157). That number is not sample size, not axis-belief confidence from `engine.ts`, and not coverage of the graph. It is “how neatly you fit a fanfic title.”

**Axis radar encodes one pole as “having a personality.”** `AxisRadar` plots `a.right` (Chaos, Maximal, Contemporary…) on a 0–100 radar (`AxisRadar.tsx` 13–17). A Systemist sitting at 20 on `order_chaos` looks empty. A Rebel looks full. Bipolar axes do not belong on a radar with origin at 0.

**Archetype polarity vs. the PRD is inverted.** PRD Systemist wants `order_chaos: [70, 100]` (`prd` 403–406). Code Systemist wants `[0, 30]` (`archetypes.ts` 22). Internally consistent with negative Swiss loadings (`ui_flat_minimal` ax `[-0.9, …]`), but the written spec and the running model disagree about which end is Order. 32 overlapping condition boxes plus a Polymath dump (`conditions: {}`, `archetypes.ts` 294–301) means many users will land on a title that feels specific and is not.

**OG blend score ≠ on-page blend score.** Page uses centered cosine `(v-50)/50` (`scoring.ts` 157–174) then maps `0.6 → 0%`, `1.0 → 100%` (`blend.tsx` 129–132). OG endpoint dots the raw 0–100 vectors (`og.ts` 102–110). Same pair, two percentages.

**`famousExamples` never appear in the UI.** Written in `archetypes.ts`, unused in pages.

**404 is still Replit boilerplate.** `not-found.tsx`: “Did you forget to add the page to the router?” on `bg-gray-50`.

**No account deletion, data export, or rate limits** exist in routes. The May 26 plan lists them; grep only finds the unchecked bullets.

**html2canvas + hotlinked Unsplash** is a CORS/export landmine. `useCORS: true` (`quiz-results.tsx` 94–96). Inference: many downloads will be blank or tainted. The OG SVG path already exists and does not need the DOM.

**Broken images still start the reaction timer.** `onError={onImageLoad}` (`quiz-rate.tsx` 370). You can rate a missing image, and if it “failed fast,” the engine may up-weight that rating.

### UI states that exist vs. missing

| Interaction | Empty | Loading | Error | Success / edge |
|---|---|---|---|---|
| Home | n/a (static marketing) | none | none | No sample profile, no demo blend. Recruiter must take the quiz. |
| Field pick | Cannot deselect last field (min 1) | n/a | n/a | Only 2 fields. Default both on. |
| Categories | Can start with 0 disabled | Spinner | Retry (`quiz-categories.tsx` 89–107) | Empty map if `?fields=` missing — no redirect. Selection ignored by engine. |
| Rating | “No quiz session found” + restart | Spinner | Next-style retry; submit error banner | Completing spinner; `complete` error only unsets `completing` — `done` retriggers. No image-fail UI. No save/resume copy. No keyboard map documented. |
| Results | n/a | “Computing your taste fingerprint…” | Restart quiz | Signed-out can download but cannot Blend. Username validation client-copy only. |
| Profile | “Profile not found” (also used for private-to-stranger at API 404) | Spinner | Take quiz | Private state for owner vs stranger. Low-confidence chip (mislabelled). |
| Invite | Expired/not found | Spinner | Home | Self-invite redirects. Pending invite in `localStorage`. Signed-in-without-profile → quiz. |
| Blend | Self-blend blocked | Spinner; collab line pulse-skeleton | “Both designers need a saved profile” (also covers private 404) | Shared-styles section **omitted** when array empty — which is the first paint, always. Polls every 1.5s until Gemini returns (`blend.tsx` 38–40). If Gemini fallback is the generic sentence, polling stops on that string — user never learns it was a fallback. |
| Auth missing | Full-page Clerk key error | n/a | n/a | App unusable. |
| 404 | Boilerplate | n/a | n/a | Not on-brand. |

A tool with only the happy path plus a handful of spinners is unfinished. This is that.

### AI / LLM specifically

Gemini is used for **one sentence** on the blend card (`generateCollaborationLine`). That is the entire AI surface. Good: timeout, catch, fallback, does not decide the similarity number. Bad:

- Fallback is still poetic (`"The Systemist meets The Brutalist — a collaboration of friction and finish."`) so the UI cannot tell generated from canned.
- No “this was written by a model” label.
- No regenerate, no edit, no reject.
- Temperature 0.9 (`gemini.ts` 58) on an 8-word line is how you get purple.
- First response returns `collaborationLine: ""` and the client polls. On a serverless host the background `void scheduleCollaborationLine` can die with the request — exactly what the May 26 plan warned. Then the skeleton pulses forever, because `refetchInterval` only stops when the string is truthy (`blend.tsx` 39).
- Rate limits: none in code.
- The sentence is generated from **archetype titles**, not from the images or ratings. Two people with the same titles get the same flavor of line regardless of what they actually liked.

This is not an “AI product.” It is a cosine product wearing an AI corsage. Treat it that way in the marketing or you will be asked to demo the model and have nothing to show.

### Completion vs. original scope (not vs. a shrunk MVP)

Against the v1 PRD (12 fields, ~330 curated images, 32 archetypes, quiz, profile card, pairwise Blend, Gemini line; twins/feed/embed out of v1):

| Slice | Rough % | Why |
|---|---|---|
| Auth / profile / invite plumbing | 70% | Clerk, privacy toggle, invite TTL exist. No delete/export. |
| Adaptive engine | 60% | Traversal is implemented; category filter unused; seeds are domains; untested. |
| Archetype copy | 90% of *text* | 32 descriptions exist. Matching is overlapping and inverted vs PRD. |
| Image corpus | ~10% | 80 leaves, 15 domains, 2 fields (~97 nodes), Unsplash reused. PRD asked 330 unique licensed images. |
| Blend as a *product* | 40% of plumbing, **15% of the idea** | Cosine runs. Shared artifact does not. |
| Share / OG / PNG | 50% | Endpoints exist; two score formulas; html2canvas fragile. |
| Production (tests, README, deploy, rights, a11y) | ~5% | May 26 plan is a ghost. |

**Honest overall: ~35% of the original product, ~20% of the content that would make the product true.** Calling this an MVP is rewriting the spec after the fact. Phase 1 of the PRD itself asked for 75 styles with real images and a PNG card (`prd` 747–751). You have the card chrome and ~80 styles with fake images.

---

## Competitive Landscape

You are not competing with Figma. You are competing for a designer’s Friday night and a hiring manager’s 90 seconds. Adjacent space: viral creative quizzes, visual taste tools, and indie “show your taste” objects.

### 1. Spotify Blend (the analog you named)

- **Core bet:** Compatibility is a *shared playlist you can play*, updated from real listening. The taste-match % and the story card are marketing around a usable object. Spotify’s own newsroom copy (2022-03-30) is explicit: once friends join, they get a playlist “and you’ll even be able to see which songs were added for which friend,” plus a share card. Support docs still describe Blend as a shared playlist, not a score.
- **What they understood that you don’t yet:** The number is garnish. The artifact is the product. Your blend page leads with `{displayPct}%` (`blend.tsx` 167–171) and can ship with zero shared images. You built Wrapped’s sticker without Wrapped’s listening history.

### 2. Adobe Creative Types (`mycreativetype.com`, Anyways Creative, 2019)

- **Core bet:** A 15-question binary personality test plus a 3D mascot will go viral and teach Adobe Create’s audience about themselves. It did: One Club / Webby reporting cites 6.3M visits; Creative Review cites 3.1M completions. Still live in 2026.
- **What they understood:** The *reward* has to be more visually specific than a serif headline on a gradient. They built physical sets, motion between questions, and a character you wanted to post. They also understood they were doing Myers-Briggs with better art direction — and they had Adobe’s distribution.
- **Difference:** They never claimed to measure *visual taste from images*. You do, then show stock photos. If you lean into 32 archetypes as the product, you are a worse-funded Creative Types with more titles and less craft.

### 3. Are.na

- **Core bet:** Taste is demonstrated by what you save and connect, not by what a quiz tells you. No algorithmic feed. Channels are the unit.
- **What they understood:** Designers already have a taste graph. They just won’t fill out 30 ratings for a startup unless the output is as culturally serious as a channel. A percentage next to “The Quiet Radical” will feel like LinkedIn-core to this audience.

### 4. Cosmos.so

- **Core bet:** Visual bookmarking with attribution, similarity search, and shared collections — taste as a *library you keep using*. WWD (2026) quotes the founder on scattered screenshots and images circulating without credit.
- **What they understood:** The image *is* the object, and provenance is part of taste. Your seed hotlinks Unsplash without per-style attribution in the rating UI (the card shows field · domain · label, not source). Cosmos is what happens if “taste fingerprint” becomes a product people live in. You cannot out-Cosmos Cosmos. You can do the thing they don’t: a *pairwise, time-boxed, comparable* snapshot.

### 5. VisualDNA “Who Am I?” / same.energy (two different lessons)

- **VisualDNA:** Image-choice personality tests mapped onto Big Five. Proved that people will rate pictures. Also proved the market will accept a psychology story on top of image picks whether or not the mapping is honest.
- **same.energy:** Visual similarity search (“more like this energy”), not a quiz. Designers already have a tool for “images that feel like this.” Your graph’s neighbor/contrast edges are a hand-authored, tiny version of that idea.

Also in the water, not worth a full slot: FormTs “Creative Type Quiz,” IdeaPlan product-design StrengthsFinder, `thedesignerarchetype.vercel.app` (Vercel quiz, empty scoreboard). These are the gravity well. If your share card is a title + radar, you fall in.

### Is there an unclaimed angle, or a slightly-worse version of something that exists?

There is an unclaimed angle. It is not “Spotify Blend for designers” as a slogan. It is:

**A pairwise, inspectable overlap of actual visual reactions — a shared stack of images two designers both marked up, with the % as a caption — that you can send in a Slack DM before a collab.**

Nobody serious is doing that. Adobe did solo identity. Are.na/Cosmos do ongoing collecting. Interior-design quizzes (Superdwell, Aesthetics of Joy) match homeowners to styles. VisualDNA maps pictures to psychology. Spotify has the mechanic but not this domain.

If you ship 32 archetypes and a cosine % on Unsplash, you are a slightly-worse Creative Types. If you ship the shared image stack, you are doing the Blend analogy for real.

**Keep the concept.** Do not “differentiate” by abandoning Blend. Differentiate by making Blend mean what it means in music: a thing two people can look at together, not a compatibility horoscope.

---

## Three Reframed Directions + Recommendation

### Direction A — Blend as a shared visual playlist (keep the concept, finish it)

**Bet:** The current version believes the archetype and the percentage *are* the product. This direction believes the product is the set of images two people both reacted to, and that the title/% are the caption on that set.

**What changes:**

- Corpus: 80 *distinct*, attributable reference images for the existing leaf nodes. Kill Unsplash-per-category. One image = one style, or don’t show the style.
- Quiz: only rate leaf nodes (`depth >= 3`). Seeds should be high-information *styles*, not domain folders.
- Profile: “Design DNA” is your actual high ratings (with images), not `styleVectorFromAxes` predictions.
- Blend: first paint includes shared images, divergent images, and axis deltas. Gemini line is optional, labelled, never blocks the page. `computeBlendCore` must return the overlap synchronously (`blends.ts` 164–191).
- Share card: two names, a few images, then the %. Spotify order, not the reverse.
- Wire `selectedCategories` or delete the screen.
- Disclose or remove response-time weighting.
- Confidence = coverage of axes/fields from ratings, not archetype fit.

**Effort (AI-assisted):** 1.5–2.5 weeks if you personally curate ~80 images (rights + alt text are the bottleneck, not code). The engine mostly stays. Do not expand to 330 until 80 are believed.

**What it proves:** You can take a borrowed mechanic, understand the actual product (shared artifact), and ship a defensible version in a specialist domain. That’s ownership-level.

**Risk / who bears it:** If the 80 images are still generic, designers laugh and the piece reads as “he didn’t look.” You bear a wasted fortnight and a public URL that undercuts the portfolio. Mitigation: 20-image closed alpha with designers you respect before marketing.

### Direction B — Taste as a channel, not a quiz (Are.na-faithful)

**Bet:** Declared ratings on a fixed taxonomy are a worse way to capture taste than demonstrated saving. The quiz is the wrong instrument.

**What changes:** Users import or save 12–40 references (upload / URL). You embed or tag them, then Blend is intersection / contrast of two collections. Taxonomy becomes a lens, not the stimulus. Adaptive engine is mostly discarded.

**Effort:** 3–5 weeks, and you are now in Cosmos’s house. Upload, spam, rights, NSFW, storage, embeddings — real infra.

**What it proves:** Taste as systems + collection UX. Strong if the interaction is novel (e.g. live co-browsing a blend channel). Weak if it looks like a Pinterest clone with a % on top.

**Risk / who bears it:** Scope explosion and “why isn’t this Cosmos?” You bear an unfinished portfolio piece *again*. Users bear nothing because you won’t finish.

### Direction C — Viral archetype mill (Creative Types 2026)

**Bet:** Designers will share a title. Optimize for completion time, mascot, and OG. Engine and corpus are overhead.

**What changes:** 12 questions, 8 types not 32, a character or a violently specific card, no Blend required. Kill adaptive graph. Marketing is the product.

**Effort:** 4–7 days to a pretty quiz. Distribution is the real work.

**What it proves:** Growth craft, art direction, shipping speed. A hiring manager who has seen `mycreativetype.com` will not see product thinking. They will see a genre exercise.

**Risk / who bears it:** It might *get users* and still fail as a portfolio piece. You bear looking like FormTs. The concept you care about (Blend) dies.

### Recommendation

**Do A. Do not do B or C right now.**

You said you want to keep Spotify Blend and you want users. A is the only direction that honors both. B is a different company. C is how this idea goes to die as a personality quiz. The May 26 production plan is already pointing at A (deterministic blend before AI, image methodology as a requirement, not polish). Execute that, smaller: 80 honest images and a blend that shows them.

---

## UI Direction

This is the Tools Lab piece that is allowed to be loud (`TOOLS-LAB-PRODUCTION-PLAN.md` line 14: “Image-led creative salon, social and expressive”). The current UI is not that. It is Inter + Georgia + coral-on-cream shadcn (`index.css` 76–131), a 3-up feature grid on the home page (`home.tsx` 34–50), and a 540px-wide gradient card. Dark tokens exist; `next-themes` is imported only by `sonner.tsx`; there is no theme switch. Fifty-plus `components/ui/*` files are the stock kit. Product-specific components are three: `Header`, `ProfileCard`, `AxisRadar`.

### What this category looks like *right now* (cited, not “2026 trends”)

- **Spotify Blend stories:** two identities, a fat number, and *tracks*. The number is not the first thing you can use; the list is.
- **Midjourney web (Create feed, Personalization, Moodboards; V8.2 default as of 2026-07-24 per Midjourney docs):** image-first chrome, ranking images to teach a model your taste. The closest mainstream “taste calibration” UI is Midjourney’s personalization ranking, not a SaaS dashboard.
- **Cosmos.so:** masonry, attribution on the image, search by color/similarity. Images are full-citizen objects.
- **Are.na:** almost no decoration; the block *is* the UI.
- **Adobe Creative Types (still up):** motion as reward between questions, a character as the share object.
- **Flora (node canvas) / same.energy (similarity grid):** graph and “more like this” as *visible* structure, not a hidden server heuristic.

None of these look like a marketing landing with Sparkles/Zap/Share2 lucide icons (`home.tsx` 35–48). That home page is the tell that this was generated in a Replit pass.

### Component system this needs (not screens)

The code does not have a system. It has a kit. Build a small one:

1. **`StylePlate`** — the image is the component. Variants: `quiz` (full-bleed, label after reaction or after a beat), `evidence` (with rating chip), `failed` (explicit broken-image, not silent `onError` success), `skeleton`.
2. **`ReactionBar`** — nope / skip / stars / love / precision slider. States: idle, submitting, submit-failed, disabled-while-in-flight. Keyboard: ← → space. Reduced-motion: no drag.
3. **`ProgressTruth`** — questions asked, estimated remaining, *axis coverage*, not a twice-divided bar.
4. **`Fingerprint`** — replace the radar. 8 bipolar sliders with both pole labels and a tick at 50. Variants: `self`, `compare` (two ticks), `low-n` (ghosted poles with “not enough signal”).
5. **`ArchetypeLockup`** — title + one-sentence + confidence-as-coverage. Variant `preview` vs `claimed`.
6. **`BlendStack`** — the actual product. Shared plates, then divergent plates (yours / theirs), then the %. States: `computing` (deterministic, <300ms), `partial` (overlap ready, line pending), `ai-failed` (show fallback and a “regenerate” that is honest), `empty-overlap` (valid outcome: “you don’t share leaves — here is why”).
7. **`ShareCard`** — generated as SVG (you already do this in `og.ts`). Stop using html2canvas as the primary path. Variants: `profile`, `blend`.
8. **`InviteTicket`** — pending, expired, self, needs-quiz, ready.

### States to actually design (the demo tell)

For **every** core interaction, these four are required or it is a demo:

- **Quiz plate:** empty session, image loading, image failed, slow next-question, submit 409/500, skip, last-question, terminated `viable_profile` vs `max_reached` (server already returns reasons in `shouldTerminate`; UI ignores them).
- **Results:** anonymous preview vs claimed; username taken (`profiles.ts` 409); low coverage; retake-overwrites-in-place (already the API behavior).
- **Blend:** waiting for the other person; they have no profile; private; expired invite; self; overlap empty; AI timeout; score-formula footnote for the curious (you already print raw cosine in tiny type — good; make the *display* % honest).
- **Home:** logged-out, logged-in-with-profile, logged-in-without-profile. Right now home is the same poster for everyone.

### Where motion / generative / unconventional interaction *earns it*

- **Earns it:** the swipe/react on a real style plate (already sketched). A visible traversal — a thin graph or breadcrumb of *why this next image* (`traversalPath` is already stored, never shown). Blend stack assembling image-by-image, like dealing a shared hand. That makes the engine inspectable.
- **Decoration:** gradient hero on the card, radar fill, lucide feature icons, pulsing skeleton on a sentence nobody needed. The `AnimatePresence` card in `quiz-rate.tsx` is fine; it is not the idea.

### Stretch vs. fallback in an AI-assisted build

| Stretch | Fallback if time dies |
|---|---|
| 330 licensed images | 80 good ones. Do not fake 330. |
| Live graph viz of the quiz path | A text line: “Going deeper in Swiss because you loved it.” `reason` is already on the traversal entry. |
| Perfect PNG via html2canvas | Ship OG SVG as the share image. You already generate 1200×630. |
| Gemini collab line | Deterministic template from shared plate labels. Keep Gemini off the critical path (already the intent; make the code match). |
| Multiplayer live blend | Async invite as now. |

Do not spend the week on a custom typeface and a WebGL card. Spend it on plates that a designer would argue about.

---

## Critical Risks

### What breaks first if someone actually depends on this

1. **They don’t believe the pictures.** Two “styles,” one Unsplash. The product’s claim dies in question 4.
2. **Blend is empty or stuck.** Shared lists start empty; serverless kills the enricher; the collab skeleton polls forever.
3. **They cannot run it.** No README, Replit env, Clerk required to do the one viral thing.
4. **Rights.** Hotlinked Unsplash as canonical style examples, no attribution in-product, PRD promised CC/museum/commissioned. A public launch with this corpus is a rights and credibility problem at once.
5. **Silent scoring rules.** Response-time weights and skip-as-40 will make two retakes diverge for reasons the user cannot see.
6. **Username / profile overwrite.** One profile per Clerk user; retake `onConflictDoUpdate`s axes (`quiz.ts` 353–369). Fine if disclosed; currently it just happens.

### Weakest part you will get defensive about

The images, and the fact that `topStyles` are not things the user rated.

You will want to talk about the adaptive graph, the 8 axes, the 32 archetypes, cosine vs. Euclidean. A reviewer will point at the card and say “this is a laptop stock photo labelled Bauhaus.” There is no good answer. Do not defend the engine until the stimulus is real. The May 26 plan already said this in grown-up language: “Image selection methodology, licensing, attribution… are product requirements, not content polish.”

### How you would measure whether the improved version is better

Not “feels more premium.” Signals:

1. **Completion → invite → second profile → blend with ≥3 *shared plates that both people actually rated ≥ 80*.** If you cannot count that, Blend is still a sticker.
2. **Recognition test (n=8 designers you respect):** after the quiz, show them their top 6 plates mixed with 6 random corpus plates; they should recover theirs at well above chance. If they can’t, the corpus or the model is theater.
3. **Unaided share:** they post the card without you asking. Track that, not signups.
4. **Argument quality:** in a 15-min debrief, do they argue about a *specific image* (“I do not love that Swiss grid”) or about the title (“I’m not a Brutalist”)? Image arguments mean the product is working. Title arguments mean you shipped Myers-Briggs.
5. **Time-to-first-blend** for a pair who already know each other. Target: under 20 minutes combined, including the second person’s quiz.

### If you only fix one thing before a hiring manager sees it

**Make the blend a stack of images both people reacted to, computed synchronously, on the first paint.**

Not the home page. Not dark mode. Not 32 better archetype blurbs. Not Gemini. Not 12 fields.

Why that over everything else in this document: it is the concept. Spotify Blend without the playlist is a number. Design Blend without co-rated images is Creative Types with extra cosine. A hiring manager can smell that in one screenshot. Everything else you listed is downstream of whether the overlap is real.

---

## Next Action

**Today, before any restyle:** replace `computeBlendCore` so `sharedStyles` / `divergentStyles` are filled from *ratings* (intersection of high scores, set-difference of high scores), return them in the same request, and render those as images on `/blend/:a/:b` even when Gemini is off. Then stop calling Unsplash a style system — start a 80-image corpus sheet (source, license, alt, which leaf it represents) and do not market a single user until the first 20 plates would survive a designer friend saying “that is not that.”
)
