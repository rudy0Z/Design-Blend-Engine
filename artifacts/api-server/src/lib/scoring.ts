import type { StyleNode, AxisScores, Rating } from "@workspace/db";
import { ARCHETYPES, matchArchetype, type Archetype } from "./archetypes";

export const AXIS_KEYS = [
  "order_chaos",
  "minimal_maximal",
  "classic_contemporary",
  "functional_expressive",
  "warm_cold",
  "flat_dimensional",
  "literal_abstract",
  "system_intuition",
] as const;
export type AxisKey = (typeof AXIS_KEYS)[number];

const NEUTRAL_AXES: AxisScores = Object.fromEntries(AXIS_KEYS.map((k) => [k, 50])) as AxisScores;
const clamp01_100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Normalize a raw rating into 0..100 slider space.
 * Accepts either a star value (0..5, mapped to 0/20/40/60/80/100) OR a slider value (0..100).
 * Used by quiz-ingestion code paths that accept star input; the API contract today
 * accepts slider directly so this is a helper for forthcoming UI flows.
 */
export function normalizeRating(stars: number | null | undefined, slider: number | null | undefined): number {
  if (typeof slider === "number") return Math.max(0, Math.min(100, slider));
  const map: Record<number, number> = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
  return map[stars ?? 0] ?? 50;
}

/** Gut-reaction (<1s) gets boosted weight; over-thought gets reduced. */
export function responseTimeWeight(responseTimeMs?: number): number {
  if (responseTimeMs === undefined || responseTimeMs === null) return 1.0;
  if (responseTimeMs < 1000) return 1.3;
  if (responseTimeMs < 3000) return 1.0;
  return 0.85;
}

/**
 * Compute the 8 axis scores (0..100) from ratings + node loadings.
 * Each rating contributes (rating-50) * loading on each axis, weighted by abs(loading)
 * and by response-time weight.
 */
export function scoreAxes(
  ratings: Rating[],
  nodesById: Map<string, StyleNode>,
): AxisScores {
  if (ratings.length === 0) return { ...NEUTRAL_AXES };
  const sums: Record<string, number> = {};
  const weightSums: Record<string, number> = {};
  for (const k of AXIS_KEYS) {
    sums[k] = 0;
    weightSums[k] = 0;
  }
  for (const r of ratings) {
    const node = nodesById.get(r.nodeId);
    if (!node) continue;
    const agreement = (r.rating - 50) / 50; // [-1, 1]
    const rtWeight = responseTimeWeight(r.responseTimeMs);
    for (const k of AXIS_KEYS) {
      const loading = node.axisLoadings[k] ?? 0;
      sums[k] += agreement * loading * rtWeight;
      weightSums[k] += Math.abs(loading) * rtWeight;
    }
  }
  const out: Record<string, number> = {};
  for (const k of AXIS_KEYS) {
    const norm = weightSums[k] > 0 ? sums[k] / weightSums[k] : 0;
    out[k] = clamp01_100((norm + 1) * 50);
  }
  return out as AxisScores;
}

/** Aggregate ratings into per-domain (category) scores (0..100, average of ratings in that domain). */
export function getCategoryScores(
  ratings: Rating[],
  nodesById: Map<string, StyleNode>,
): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const r of ratings) {
    const n = nodesById.get(r.nodeId);
    if (!n) continue;
    sums[n.domain] = (sums[n.domain] ?? 0) + r.rating;
    counts[n.domain] = (counts[n.domain] ?? 0) + 1;
  }
  const out: Record<string, number> = {};
  for (const d of Object.keys(sums)) out[d] = Math.round(sums[d] / counts[d]);
  return out;
}

/** Aggregate per-field scores (0..100) — average of ratings in that field. */
export function getFieldScores(
  ratings: Rating[],
  nodesById: Map<string, StyleNode>,
): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const r of ratings) {
    const n = nodesById.get(r.nodeId);
    if (!n) continue;
    sums[n.field] = (sums[n.field] ?? 0) + r.rating;
    counts[n.field] = (counts[n.field] ?? 0) + 1;
  }
  const out: Record<string, number> = {};
  for (const f of Object.keys(sums)) out[f] = Math.round(sums[f] / counts[f]);
  return out;
}

/**
 * Field distribution — how the user's *positive* engagement is split across fields.
 * Returns shares 0..1 summing to ~1.
 */
export function getFieldDistribution(
  ratings: Rating[],
  nodesById: Map<string, StyleNode>,
): Record<string, number> {
  const sums: Record<string, number> = {};
  let total = 0;
  for (const r of ratings) {
    const n = nodesById.get(r.nodeId);
    if (!n) continue;
    const positive = Math.max(0, r.rating - 30);
    sums[n.field] = (sums[n.field] ?? 0) + positive;
    total += positive;
  }
  if (total === 0) return {};
  const out: Record<string, number> = {};
  for (const f of Object.keys(sums)) out[f] = +(sums[f] / total).toFixed(3);
  return out;
}

/** Predict a 0..100 score for every node, given the user's axes. */
export function styleVectorFromAxes(axes: AxisScores, nodes: StyleNode[]): Record<string, number> {
  const signed: Record<string, number> = {};
  for (const k of AXIS_KEYS) signed[k] = (axes[k] - 50) / 50;
  const out: Record<string, number> = {};
  for (const n of nodes) {
    let s = 0;
    let w = 0;
    for (const k of AXIS_KEYS) {
      const l = n.axisLoadings[k] ?? 0;
      s += signed[k] * l;
      w += Math.abs(l);
    }
    const norm = w > 0 ? s / w : 0;
    out[n.id] = clamp01_100((norm + 1) * 50);
  }
  return out;
}

export function pickArchetype(axes: AxisScores): Archetype & { confidence: number } {
  const { archetype, confidence } = matchArchetype(axes);
  return { ...archetype, confidence };
}

export function cosineSimilarityVector(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0,
    na = 0,
    nb = 0;
  for (const k of keys) {
    // styleVector values are 0..100 — center around 50 to give cosine signed direction.
    const av = ((a[k] ?? 50) - 50) / 50;
    const bv = ((b[k] ?? 50) - 50) / 50;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function cosineSimilarityAxes(a: AxisScores, b: AxisScores): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (const k of AXIS_KEYS) {
    const av = (a[k] - 50) / 50;
    const bv = (b[k] - 50) / 50;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export { ARCHETYPES };
