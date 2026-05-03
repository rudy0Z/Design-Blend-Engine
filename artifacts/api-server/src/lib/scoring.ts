import type { StyleNode, AxisScores, Rating } from "@workspace/db";

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

const ARCHETYPE_THEMES = [
  { id: "swiss_classicist", title: "The Swiss Classicist", description: "Order, system, restraint — the grid as moral compass.", color: "#1a1a2e",
    weights: { order_chaos: -1, minimal_maximal: -1, system_intuition: -1, functional_expressive: -1 } },
  { id: "expressive_maximalist", title: "The Expressive Maximalist", description: "More is more, instinct over rules, sensation as content.", color: "#ff5d2e",
    weights: { minimal_maximal: 1, functional_expressive: 1, system_intuition: 1, order_chaos: 1 } },
  { id: "futurist_pragmatist", title: "The Futurist Pragmatist", description: "Calm, contemporary, machine-tuned, AI-native craft.", color: "#3b82f6",
    weights: { classic_contemporary: 1, functional_expressive: -1, minimal_maximal: -1 } },
  { id: "warm_humanist", title: "The Warm Humanist", description: "Hand, warmth, story — design that holds you.", color: "#d97706",
    weights: { warm_cold: -1, system_intuition: 1, literal_abstract: -1, functional_expressive: 1 } },
  { id: "brutalist_rebel", title: "The Brutalist Rebel", description: "Raw, loud, anti-polish — meaning over manners.", color: "#0f0f0f",
    weights: { order_chaos: 1, functional_expressive: 1, classic_contemporary: 0.5, minimal_maximal: 0.5 } },
  { id: "editorial_aesthete", title: "The Editorial Aesthete", description: "Magazine pacing, type-led, photographic taste.", color: "#3a2e1f",
    weights: { functional_expressive: 0.5, classic_contemporary: -0.5, system_intuition: 0.5 } },
  { id: "playful_optimist", title: "The Playful Optimist", description: "Color, motion, soft shapes — design that smiles.", color: "#f472b6",
    weights: { warm_cold: -1, flat_dimensional: 1, minimal_maximal: 0.5, functional_expressive: 1 } },
  { id: "system_thinker", title: "The System Thinker", description: "Tokens, primitives, scalable identity — process is the product.",
    color: "#0d9488",
    weights: { system_intuition: -1, order_chaos: -1, classic_contemporary: 0.5, literal_abstract: 0.5 } },
];

const NEUTRAL_AXES: AxisScores = Object.fromEntries(AXIS_KEYS.map((k) => [k, 50])) as AxisScores;
const clamp01_100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Convert ratings (0-100) and the rated style nodes into 0-100 per-axis scores. */
export function scoreAxes(ratings: Rating[], nodesById: Map<string, StyleNode>): AxisScores {
  if (ratings.length === 0) return { ...NEUTRAL_AXES };
  const sums: Record<string, number> = {};
  const weightSums: Record<string, number> = {};
  for (const k of AXIS_KEYS) { sums[k] = 0; weightSums[k] = 0; }

  for (const r of ratings) {
    const node = nodesById.get(r.nodeId);
    if (!node) continue;
    // weight = how strongly the user agreed (rating - 50) in [-50, 50] scaled to [-1, 1]
    const agreement = (r.rating - 50) / 50;
    for (const k of AXIS_KEYS) {
      const loading = node.axisLoadings[k] ?? 0;
      sums[k] += agreement * loading;
      weightSums[k] += Math.abs(loading);
    }
  }

  const out: Record<string, number> = {};
  for (const k of AXIS_KEYS) {
    const norm = weightSums[k] > 0 ? sums[k] / weightSums[k] : 0;
    // Map [-1, 1] → [0, 100], clamp for robustness
    out[k] = clamp01_100((norm + 1) * 50);
  }
  return out as AxisScores;
}

export function pickArchetype(axes: AxisScores) {
  // Map 0-100 axes to signed [-1,1] for matching with weights
  const signed: Record<string, number> = {};
  for (const k of AXIS_KEYS) signed[k] = (axes[k] - 50) / 50;
  let best = ARCHETYPE_THEMES[0];
  let bestScore = -Infinity;
  for (const t of ARCHETYPE_THEMES) {
    let s = 0;
    let w = 0;
    for (const [axis, weight] of Object.entries(t.weights)) {
      s += signed[axis] * weight;
      w += Math.abs(weight);
    }
    const norm = w > 0 ? s / w : 0;
    if (norm > bestScore) { bestScore = norm; best = t; }
  }
  return { ...best, confidence: Math.max(0, Math.min(1, (bestScore + 1) / 2)) };
}

export function styleVectorFromAxes(axes: AxisScores, nodes: StyleNode[]): Record<string, number> {
  // For every node, compute alignment with the user's signed axes, return 0-100 score.
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

export function cosineSimilarityAxes(a: AxisScores, b: AxisScores): number {
  let dot = 0, na = 0, nb = 0;
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
