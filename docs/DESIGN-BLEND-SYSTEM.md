# Design Blend — Capture & Match System

**Status:** proposed v1 spec (2026-08-15). Not yet implemented. Supersedes the decoration-only reading of the original PRD while keeping the Blend *score* as the social product.

**Companion visual report:** open the canvas `design-blend-system.canvas.tsx` beside chat.

**Research / extra-hands program (do this before production code):** [`PROGRAM.md`](./PROGRAM.md). Catalog plates, industry gates, and interconnection weights are an information-design project. Do not invent edges in this file.

This document is the implementation contract: data structures, algorithms, storage, and the pairwise match. If code and this file disagree, this file wins until a version bump. Catalog *contents* and edge *decisions* live in the research ledger described in PROGRAM.md.

---

## 1. Product object

A designer builds **one taste profile** (homepage or incoming Blend link). Two profiles produce:

1. A **display match %** (the thing people send).
2. A **story**: craft / mental / style breakdown + proof plates.
3. Coverage / confidence of that number.

Not in v1: a shared playlist-like feed, global twins, famous-designer Blend.

Spotify analog: taste profile is the durable object; Blend is a pairwise readout. The quiz exists because we have no listening history.

---

## 2. Four layers

| Layer | Captures | Elicitation | Blend role |
|---|---|---|---|
| Context | Industry + field membership | Pick, no intensity | Filter + coverage label. **Not** the % |
| Craft | Spacing, typography, color (, hierarchy) | Rank 4 variants of the *same* work | 40% of display % |
| Mental model | Systems↔expression, constraint↔gesture | Rank process artifacts | 20% of display % |
| Style graph | Named visual languages | Seed pick, then adaptive rate/rank | 40% of display % |

**Invariant:** a style name is not craft. “Swiss” can sit on tight *or* airy spacing. Craft is isolated by holding content constant.

**Invariant:** mental model is never a questionnaire (“are you a design thinker?”). It is a reaction to process/system artifacts.

---

## 3. Versions

```
modelVersion: "taste.v1"
corpusVersion: "catalog.v1.0"
```

Stored on every profile and every blend. Changing loadings, edge weights, or the match mix requires a new `modelVersion`. Old public Blends stay frozen unless the owner explicitly recalculates.

---

## 4. Catalog data structures

### 4.1 Axis keys (bipolar, 0–100, 50 = center)

```
order_chaos
minimal_maximal
classic_contemporary
functional_expressive
warm_cold
flat_dimensional
literal_abstract
system_intuition
```

Sign convention in loadings: **negative loading + positive rating → toward 0 (left pole).** Example: Swiss `order_chaos: -0.9`; loving Swiss pulls Order.

### 4.2 Craft keys (bipolar, 0–100)

v1 required:

```
spacing        // tight/dense ← 50 → airy
typography     // system scale / geometric ← 50 → expressive / one-off
color          // restrained / low chroma ← 50 → chromatic
```

v1 optional (only if field needs them, usually Stage 4):

```
hierarchy      // strict ← 50 → dramatic
motion         // still/snappy ← 50 → cinematic
```

### 4.3 Mental keys

```
systems_expression     // spec/tokens ← 50 → gesture/scene
constraint_gesture     // a11y/constraint-first ← 50 → expression-first
```

### 4.4 StyleNode

```ts
type NodeKind =
  | "field"
  | "domain"
  | "style"          // ratable leaf, depth >= 3
  | "craft_variant"  // one of four plates in a craft group (not in the style graph)
  | "mental_artifact";

type AxisKey = /* see 4.1 */;
type CraftKey = /* see 4.2 */;

interface StyleNode {
  id: string;
  kind: NodeKind;
  label: string;
  field: "ui" | "gd" | "motion" | /* later */;
  domain: string;
  depth: number;              // 1 field, 2 domain, 3–5 style
  visualCharacter: string;
  referencePoint: string;
  imageUrl: string;
  license: string;            // required on public plates
  source: string;
  alt: string;
  industries: string[];       // empty = all
  axisLoadings: Record<AxisKey, number>;   // -1..1
  craftLoadings: Partial<Record<CraftKey, number>>;
  parent: string | null;
  children: string[];
  popularity: number;         // 0..1, seed diversity only
}
```

Leaves (`kind: "style"`, `depth >= 3`) are the only nodes that appear as Stage 1 / Stage 4 plates. Domain nodes are graph structure, not cards.

### 4.5 StyleEdge

```ts
type EdgeType =
  | "parent_child"
  | "neighbor"
  | "contrast"
  | "cross_field"
  | "cross_layer";  // craft/mental pole → style leaf

interface StyleEdge {
  from: string;
  to: string;
  edgeType: EdgeType;
  weight: number;   // 0..1  P(like to | like from) for neighbor/cross_*
}
```

**Rules**

- `parent_child` is stored **parent → child only** in the edge table. Children lists on the node are the inverse. Do not write bidirectional parent_child rows (that made `getChildren(leaf)` return the parent in the current codebase).
- `neighbor` and `contrast` may be mirrored for undirected traversal; keep a single canonical row (`from < to`) plus a query that reads both directions.
- Unweighted edges are forbidden in v1. If you do not know a weight, do not draw the edge.

### 4.6 Craft groups (not graph nodes)

A craft group is a small bundle used only in Stage 2:

```ts
interface CraftGroup {
  id: "craft_spacing" | "craft_typography" | "craft_color";
  axis: CraftKey;
  prompt: string;           // "Same dashboard. Which density feels like you?"
  variantIds: [string, string, string, string]; // four plates, same content
  poleOf: [number, number, number, number];     // where each variant sits on 0–100
}
```

Ranking those four writes `craft[axis]`, not four style posteriors (though cross-layer priors may fire — §6.3).

---

## 5. Session & profile structures

### 5.1 Evidence (append-only in a session)

```ts
type ElicitationMode = "pick" | "rank" | "rate" | "skip";

interface Evidence {
  id: string;
  sessionId: string;
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  mode: ElicitationMode;
  targetId: string;          // node, craft group, or mental group
  value:
    | { type: "ids"; ids: string[] }             // pick
    | { type: "rank"; orderedIds: string[] }     // first = most like me
    | { type: "rate"; nodeId: string; score: number } // 0–100
    | { type: "skip"; nodeId: string };
  weight: number;            // see §6.1
  responseTimeMs?: number;
  at: string;                // ISO
}
```

Skip writes evidence with `mode: "skip"` and **does not** update means. It only marks the node as seen so it is not asked again.

### 5.2 Engine state (ephemeral, also checkpointed on the session row)

```ts
interface AxisBelief {
  mean: number;        // 0–100
  confidence: number;  // 0–1
}

interface NodePosterior {
  score: number;       // 0–100
  confidence: number;  // 0–1
  observed: boolean;   // true iff a Stage 4 rate (or rank that included this leaf as an item)
  source: "observed" | "prior" | "reconstructed";
}

interface EngineState {
  axes: Record<AxisKey, AxisBelief>;
  craft: Record<CraftKey, AxisBelief>;
  mental: Record<string, AxisBelief>;
  posterior: Record<string, NodePosterior>; // sparse, grows during session
  observedIds: string[];
  traversal: { nodeId: string; reason: string }[];
  fieldsCovered: string[];
  switchCount: number;
}
```

Initial beliefs: mean 50, confidence 0.

### 5.3 Durable TasteProfile

```ts
interface TasteProfile {
  id: string;
  userId: string;
  username: string;
  modelVersion: string;
  corpusVersion: string;
  selectedIndustries: string[];
  selectedFields: string[];
  axes: Record<AxisKey, AxisBelief>;
  craft: Record<CraftKey, AxisBelief>;
  mental: Record<string, AxisBelief>;
  stylePosterior: Record<string, NodePosterior>;
  fusedEmbedding: number[];      // length 64, L2-normalized
  coverage: {
    nObserved: number;
    nPredicted: number;
    fieldsCovered: string[];
    axesConfident: number;       // count conf > 0.6
    lighterRead: boolean;        // true if stopped before Stage 4 coverage
  };
  archetypeId: string;           // caption only — NEVER an input to match
  isPublic: boolean;
}
```

---

## 6. Algorithms

### 6.1 Evidence weights

```
w_stage = { 0: 0.00, 1: 0.35, 2: 0.80, 3: 0.70, 4: 1.00, 5: 1.00 }
w_mode  = { pick: 1.0, rank: 1.0, rate: 1.0, skip: 0.0 }
weight  = w_stage[stage] * w_mode[mode]
```

Stage 0 weight is 0 because context is a **filter**, not a magnitude.

**Overwrite rule:** if a later evidence targets the same node as an earlier prior, the observed posterior replaces the prior. Neighbors get a *nudge*, not a full rewrite.

Optional: if `responseTimeMs < 1000` on a **rate**, multiply weight by 1.15; if `> 4000`, by 0.9. **Disclose in the UI** if enabled. Default v1: off.

### 6.2 Rank → score

Four ordered ids `[a,b,c,d]` (most → least like me):

```
score = { a: 100, b: 70, c: 40, d: 10 }
```

Three items: `{ 100, 55, 15 }`. Two items: `{ 85, 20 }`.

For a craft group, the winner’s `poleOf[i]` becomes `craft[axis].mean`. Confidence = `0.55 * (1 - (rank_gap_entropy))` — if they barely distinguish (all “meh”), keep confidence low. Practical v1: confidence = 0.65 for a completed four-rank, 0.45 if they only picked two then ranked.

### 6.3 Axis / craft Bayesian update (rate)

```
signal = (score - 50) / 50          # [-1, 1]
for each key in axisLoadings ∪ craftLoadings:
  loading = loadings[key]
  lr = 0.30 * (1 - belief.confidence)
  belief.mean = clamp(belief.mean + loading * signal * 50 * lr * evidence.weight, 0, 100)
  belief.confidence = min(1, belief.confidence + abs(loading) * abs(signal) * 0.15 * evidence.weight)
```

### 6.4 Graph prior paint (2 hops)

After an **observed** score `s` on node `u` with evidence weight `w`:

```
paint(u, s, energy = w, hop = 0):
  if hop > 2: return
  posterior[u] = blend(posterior[u], s, energy)   # hop 0 also marked observed
  if hop == 0: posterior[u].observed = true; posterior[u].source = "observed"
  else if not posterior[u].observed: posterior[u].source = "prior"

  for edge in outgoing ∪ incoming of types neighbor, cross_field, cross_layer:
    s2 = s
    if edge.edgeType == contrast: s2 = 100 - s
    energy2 = energy * edge.weight * hopDecay[hop]   # hopDecay = [1.0, 0.45, 0.28]
    if energy2 < 0.05: continue
    paint(edge.other, s2, energy2, hop + 1)

blend(old, incoming, energy):
  if old is missing: return { score: incoming, confidence: energy * 0.5, observed: false }
  c = old.confidence + energy * 0.35
  score = (old.score * old.confidence + incoming * energy) / (old.confidence + energy)
  return { score, confidence: min(1, c), observed: old.observed }
```

Do not paint through `parent_child` except when `goDeeper` *selects* a child as the next question. Painting the whole subtree turns one tap into “I like all of graphic design.”

### 6.5 Reconstruct unscored leaves

If a leaf has no posterior:

```
signed = { k: (axes[k].mean - 50) / 50 }
s = sum_k signed[k] * loading[k]
w = sum_k abs(loading[k])
score = 50 + 50 * (s / max(w, ε))
confidence = 0.20 * mean(axes.confidence for k with abs(loading) > 0.3)
source = "reconstructed"
```

Reconstructed leaves may enter the match **only if** confidence ≥ 0.35 after this (usually they will not). They exist so the fused embedding is dense.

### 6.6 Information gain & next plate

```
IG(node) =
  sum_k (1 - axes[k].confidence) * abs(axisLoadings[k]) * 0.5
+ sum_c (1 - craft[c].confidence) * abs(craftLoadings[c]) * 0.6
+ (0.3 if node.field not in fieldsCovered)
- (0.4 if node.id in observedIds)
```

**Stage 1 seed (Idea A):** pick 6–8 leaves maximizing diversity:

- Different domains first.
- High `sum abs(loadings)` (expressive probes).
- Allowed by `selectedFields` × `industries`.
- User **picks any subset**. Each pick is Stage 1 evidence + prior paint. Zero picks is invalid; require ≥ 2.

**Stage 4 policy** (last observed rating `r` on node `u`):

| r | Move |
|---|---|
| ≥ 75 | unused child with max IG; else unused sibling |
| ≤ 25 | unused contrast with max IG; else switch field |
| 50–74 | unused neighbor, `|Δdepth| ≤ 1` |
| 26–49 | unused node with max IG on weakest axis (conf min) |

If the top two candidates’ IG differ by < 10%, **present both (or three siblings) as a rank set** instead of a single rate. That is “multiples” after the seed.

**Terminate Stage 4 when any:**

- all 8 axes conf > 0.75, or
- `observed >= 20` and ≥ 6 axes conf > 0.6 and every selected field touched and ≥ 1 contrast used, or
- `observed >= 40`, or
- no unused allowed leaves remain.

If they stop after Stage 2: `lighterRead = true`, still allow Blend.

### 6.7 Fused embedding (64-d)

Item vector `e_i`:

```
e_i = L2_normalize( concat(axisLoadings_i as 8, craftLoadings_i as 3, zeros to 16) )
```

User vector:

```
u_raw = sum_i  ((score_i - 50)/50) * confidence_i * e_i
u     = L2_normalize(u_raw)
fused = pad_or_pca(u, 64)   # v1: pad 16-d with zeros to 64
```

Stored on `profiles.embedding`. Used **only** for v2 ANN twins.

---

## 7. Pairwise match (the product)

Given profiles A, B. **Exact arithmetic. No ANN. Synchronous.**

### 7.1 Support

A dimension (axis, craft key, or style id) is comparable iff

```
min(conf_A, conf_B) >= 0.35
```

If comparable style ids < 8 **and** comparable dense keys (axes+craft+mental) < 6:

- Do not emit a single precise %. Emit `range: [lo, hi]` or `status: "thin_overlap"` plus the proof you *can* show.

### 7.2 Centered cosine

For a dict of values on the same keys:

```
x' = (x - 50) / 50
cos = dot(x', y') / (|x'| |y'|)
# if |x'| or |y'| == 0: undefined → skip that component
mapped = 50 + 50 * cos     # -1 → 0, +1 → 100
```

Do **not** fill missing keys with 50.

### 7.3 Components

```
craftScore  = cosine(A.craft.means, B.craft.means) on comparable craft keys
mentalScore = cosine(A.mental.means, B.mental.means) on comparable mental keys
styleScore  = cosine(A.stylePosterior.score, B.stylePosterior.score) on comparable style ids

display = round(0.40 * craftScore + 0.20 * mentalScore + 0.40 * styleScore)
```

Weights are v1 defaults. Recalibrate on 20–30 real designer pairs until ~50% feels like “some overlap” and ~85% feels like “same library.” Store the mix on `modelVersion`.

**Context:** intersect `selectedFields` / industries. Put the intersection in the story (“compared on UI + graphic; fashion not in common”). Do not multiply the % by Jaccard of industries — that punishes cross-disciplinary pairs who still share craft.

### 7.4 Proof stack (required)

From **observed** ratings (prefer ids both observed):

- Shared: both scores ≥ 70, sort by min(scoreA, scoreB) desc, take 3.
- Split: |scoreA − scoreB| ≥ 35, take 3.

If not enough dual-observed, fill shared from one-observed + one-predicted **only in the math footnote**, not as the hero images.

### 7.5 Persistence

```
blends (
  profile_a, profile_b,
  model_version, corpus_version,
  craft_score, mental_score, style_score, display_score,
  coverage,
  axis_deltas,
  shared_style_ids[], split_style_ids[],
  collaboration_line  -- optional, after display exists, labelled AI
)
```

All of the above except `collaboration_line` is computed **in the request**. AI never blocks first paint. AI never changes `display_score`.

### 7.6 What Blend is not

- Not cosine on a 200-d vector padded with 50s.
- Not archetype-id equality.
- Not “shared predicted DNA” of styles nobody saw.

---

## 8. Invite / profile flows

| Door | No profile | Has profile |
|---|---|---|
| Home | Stages 0–4 (or stop at viable) → solo card → “copy Blend link” | Solo card, create invite |
| Blend invite | Show *their* public card, not the %. Then capture. Then compute | Compute immediately |
| Self-invite | Block | Block |
| Expired / private | Named state | Named state |

One profile, many blends. Retake overwrites the owner’s profile (same `userId`) and marks existing blends stale until recalculated on next view (recompute if `profile.updatedAt > blend.createdAt`).

---

## 9. Storage

**v1 store: Postgres.** JSONB for posteriors. Optional `vector(64)` column + HNSW cosine index for v2 twins only.

Do not introduce Pinecone/Qdrant in v1. The catalog is hundreds of nodes, not millions of items. Pairwise Blend is two primary-key lookups.

Approximate scale:

- Catalog: 80–120 style leaves + craft variants + mental artifacts.
- Session evidence: 20–40 rows.
- Match: O(comparable dims) ≲ 200.

---

## 10. Stage UX contract (implementation checklist)

0. Multi-select industries + fields. Continue disabled until ≥ 1 field.
1. Grid of 6–8 plates. Tap many. Continue disabled until ≥ 2.
2. Three rank groups (spacing, type, color). Drag or tap-to-order. Skip group allowed → that craft key stays conf 0.
3. Two mental groups. Same.
4. Adaptive: one plate **or** 2–3 sibling rank. Skip = unknown. Coverage meter, not fake `12/30`.
5. Optional “3 more to lock type.”

Solo reward after save: fingerprint (bipolar ticks, not a radar with origin 0), craft poles, 5 observed DNA plates, archetype caption.

---

## 11. Out of scope until the % is believed

- 12 fields / 330 styles
- pgvector twins
- Famous-designer Blend
- Gemini as a scoring input
- Response-time weighting without disclosure
- html2canvas as the only share path (prefer server SVG OG)

---

## 12. Acceptance tests for the engine (must exist before UI polish)

1. Identical evidence lists ⇒ identical profiles (deterministic).
2. Stage 1 tap on Swiss ⇒ Bauhaus prior > 50 and punk not raised.
3. Stage 4 rate Swiss 20 after Stage 1 tap ⇒ Swiss observed 20, Bauhaus prior pulled down, `craft.spacing` unchanged if set in Stage 2.
4. Skip 5 in a row ⇒ no mean movement, nodes not re-asked.
5. Two profiles with no overlapping comparable dims ⇒ `thin_overlap`, no fake 73.
6. Two profiles with identical observed high ratings on 10 leaves ⇒ styleScore ≥ 90.
7. Display score does not change when AI line is missing or times out.
