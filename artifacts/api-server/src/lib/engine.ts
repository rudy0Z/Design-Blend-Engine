import type { StyleNode } from "@workspace/db";
import type { AxisDistribution, TraversalEntry, Rating } from "@workspace/db";
import {
  type GraphSnapshot,
  getChildren,
  getNeighbors,
  getContrastNodes,
  getCrossFieldNeighbors,
  getAllNodes,
} from "./graph";
import { AXIS_KEYS, type AxisKey } from "./scoring";

export type EngineState = {
  axisDistribution: AxisDistribution;
  history: { nodeId: string; rating: number; responseTimeMs?: number }[];
  traversalPath: TraversalEntry[];
  fieldsCovered: string[];
  switchCount: number;
};

export function makeInitialDistribution(): AxisDistribution {
  const d: AxisDistribution = {};
  for (const k of AXIS_KEYS) d[k] = { mean: 50, confidence: 0 };
  return d;
}

export function makeInitialState(): EngineState {
  return {
    axisDistribution: makeInitialDistribution(),
    history: [],
    traversalPath: [],
    fieldsCovered: [],
    switchCount: 0,
  };
}

/** Rebuild the engine state from persisted session columns. */
export function deserializeEngine(opts: {
  axisDistribution: AxisDistribution | null;
  ratings: Rating[];
  traversalPath: TraversalEntry[];
  fieldsCovered: string[];
  switchCount: number;
}): EngineState {
  const dist = opts.axisDistribution
    ? ensureAllAxes(opts.axisDistribution)
    : makeInitialDistribution();
  return {
    axisDistribution: dist,
    history: opts.ratings.map((r) => ({ nodeId: r.nodeId, rating: r.rating, responseTimeMs: r.responseTimeMs })),
    traversalPath: opts.traversalPath ?? [],
    fieldsCovered: opts.fieldsCovered ?? [],
    switchCount: opts.switchCount ?? 0,
  };
}

function ensureAllAxes(d: AxisDistribution): AxisDistribution {
  const out: AxisDistribution = {};
  for (const k of AXIS_KEYS) {
    out[k] = d[k] ?? { mean: 50, confidence: 0 };
  }
  return out;
}

/** Bayesian update: nudge mean toward signal, accumulate confidence. */
export function updateDistribution(state: EngineState, node: StyleNode, rating: number): void {
  const signal = (rating - 50) / 50; // [-1, 1]
  for (const k of AXIS_KEYS) {
    const loading = node.axisLoadings[k] ?? 0;
    const current = state.axisDistribution[k];
    const signalStrength = Math.abs(loading) * Math.abs(signal);
    // axisDirection in our 0..100 axis space: positive loading + positive signal => toward 100.
    const axisDirection = loading * signal; // [-1, 1]
    const learningRate = 0.3 * (1 - current.confidence);
    let newMean = current.mean + axisDirection * 50 * learningRate;
    newMean = Math.max(0, Math.min(100, newMean));
    current.mean = newMean;
    current.confidence = Math.min(1, current.confidence + signalStrength * 0.15);
  }
  if (!state.fieldsCovered.includes(node.field)) state.fieldsCovered.push(node.field);
}

export function shouldTerminate(
  state: EngineState,
  totalTarget: number,
):
  | false
  | { reason: "complete" | "max_reached" | "viable_profile" | "target_reached"; questionsAsked: number } {
  const asked = state.history.length;
  const beliefs = Object.values(state.axisDistribution);
  const allConfident = beliefs.every((a) => a.confidence > 0.75);
  if (allConfident) return { reason: "complete", questionsAsked: asked };
  if (asked >= 60) return { reason: "max_reached", questionsAsked: asked };
  const enoughData = asked >= 20 && beliefs.filter((a) => a.confidence > 0.6).length >= 6;
  if (enoughData) return { reason: "viable_profile", questionsAsked: asked };
  // totalTarget is informational (drives /next progress %); spec doesn't mandate hard stop.
  void totalTarget;
  return false;
}

/** Information gain heuristic — high if axis is uncertain & node loads strongly on it. */
export function informationGain(node: StyleNode, state: EngineState): number {
  let gain = 0;
  for (const k of AXIS_KEYS) {
    const loading = node.axisLoadings[k] ?? 0;
    const conf = state.axisDistribution[k].confidence;
    gain += (1 - conf) * Math.abs(loading) * 0.5;
  }
  if (!state.fieldsCovered.includes(node.field)) gain *= 1.3;
  return gain;
}

function ratableOnly(nodes: StyleNode[], state: EngineState, allowedFields?: string[]): StyleNode[] {
  const rated = new Set(state.history.map((h) => h.nodeId));
  return nodes.filter(
    (n) => n.depth >= 3 && !rated.has(n.id) && (!allowedFields || allowedFields.length === 0 || allowedFields.includes(n.field)),
  );
}

function leastConfidentAxis(state: EngineState): AxisKey {
  let worst: AxisKey = AXIS_KEYS[0];
  let worstConf = Infinity;
  for (const k of AXIS_KEYS) {
    const c = state.axisDistribution[k].confidence;
    if (c < worstConf) {
      worstConf = c;
      worst = k;
    }
  }
  return worst;
}

/** Phase 1: 3 broad depth:2 seed probes from different fields the user selected. */
export function getSeedQuestions(graph: GraphSnapshot, selectedFields: string[]): StyleNode[] {
  const probes = getAllNodes(graph).filter((n) => n.depth === 2);
  const byField = new Map<string, StyleNode[]>();
  for (const n of probes) {
    const arr = byField.get(n.field) ?? [];
    arr.push(n);
    byField.set(n.field, arr);
  }
  const fields = selectedFields.length > 0 ? selectedFields.slice() : Array.from(byField.keys());
  const seeds: StyleNode[] = [];
  for (const f of fields) {
    const candidates = byField.get(f);
    if (!candidates || candidates.length === 0) continue;
    // Pick the most "expressive" probe — strongest absolute axis loading sum
    candidates.sort((a, b) => axisStrength(b) - axisStrength(a));
    seeds.push(candidates[0]);
    if (seeds.length >= 3) break;
  }
  // If we still need more seeds, fill with strongest unique-domain depth:2 nodes
  if (seeds.length < 3) {
    const used = new Set(seeds.map((s) => s.id));
    const extras = probes
      .filter((n) => !used.has(n.id))
      .sort((a, b) => axisStrength(b) - axisStrength(a));
    for (const n of extras) {
      if (seeds.length >= 3) break;
      seeds.push(n);
    }
  }
  return seeds;
}

function axisStrength(n: StyleNode): number {
  let s = 0;
  for (const k of AXIS_KEYS) s += Math.abs(n.axisLoadings[k] ?? 0);
  return s;
}

// ---- The four navigation moves ---------------------------------------------

function goDeeper(node: StyleNode, state: EngineState, graph: GraphSnapshot, allowed: string[]): { node: StyleNode; reason: TraversalEntry["reason"] } | null {
  const children = ratableOnly(getChildren(graph, node.id), state, allowed);
  if (children.length === 0) {
    const sibs = exploreSiblings(node, state, graph, allowed);
    if (sibs) return { node: sibs, reason: "siblings" };
    return null;
  }
  children.sort((a, b) => informationGain(b, state) - informationGain(a, state));
  return { node: children[0], reason: "deeper" };
}

function pivotToContrast(
  node: StyleNode,
  state: EngineState,
  graph: GraphSnapshot,
  allowed: string[],
): { node: StyleNode; reason: TraversalEntry["reason"] } | null {
  const contrast = ratableOnly(getContrastNodes(graph, node.id), state, allowed);
  if (contrast.length === 0) {
    const sw = switchField(state, graph, allowed, node.field);
    if (sw) {
      state.switchCount += 1;
      return { node: sw, reason: "switch_field" };
    }
    return null;
  }
  contrast.sort((a, b) => informationGain(b, state) - informationGain(a, state));
  state.switchCount += 1;
  return { node: contrast[0], reason: "contrast" };
}

function exploreNeighbor(
  node: StyleNode,
  state: EngineState,
  graph: GraphSnapshot,
  allowed: string[],
): { node: StyleNode; reason: TraversalEntry["reason"] } | null {
  const neighbors = ratableOnly(getNeighbors(graph, node.id), state, allowed).filter(
    (n) => Math.abs(n.depth - node.depth) <= 1,
  );
  if (neighbors.length === 0) return goDeeper(node, state, graph, allowed);
  neighbors.sort((a, b) => informationGain(b, state) - informationGain(a, state));
  return { node: neighbors[0], reason: "neighbor" };
}

function lateralMove(
  node: StyleNode,
  state: EngineState,
  graph: GraphSnapshot,
  allowed: string[],
): { node: StyleNode; reason: TraversalEntry["reason"] } | null {
  const weakest = leastConfidentAxis(state);
  // Try cross-field neighbors first (they're the "interesting" connections)
  const cross = ratableOnly(getCrossFieldNeighbors(graph, node.id), state, allowed);
  if (cross.length > 0) {
    cross.sort(
      (a, b) =>
        Math.abs(b.axisLoadings[weakest] ?? 0) - Math.abs(a.axisLoadings[weakest] ?? 0) ||
        informationGain(b, state) - informationGain(a, state),
    );
    return { node: cross[0], reason: "lateral" };
  }
  const candidates = ratableOnly(getAllNodes(graph), state, allowed)
    .filter((n) => n.depth <= node.depth + 1)
    .filter((n) => Math.abs(n.axisLoadings[weakest] ?? 0) > 0.5);
  if (candidates.length === 0) {
    const sw = switchField(state, graph, allowed, node.field);
    if (sw) return { node: sw, reason: "switch_field" };
    return null;
  }
  candidates.sort((a, b) => informationGain(b, state) - informationGain(a, state));
  return { node: candidates[0], reason: "lateral" };
}

function exploreSiblings(node: StyleNode, state: EngineState, graph: GraphSnapshot, allowed: string[]): StyleNode | null {
  const siblings = ratableOnly(
    getAllNodes(graph).filter((n) => n.parent === node.parent && n.id !== node.id),
    state,
    allowed,
  );
  if (siblings.length === 0) return null;
  siblings.sort((a, b) => informationGain(b, state) - informationGain(a, state));
  return siblings[0];
}

function switchField(state: EngineState, graph: GraphSnapshot, allowed: string[], avoidField?: string): StyleNode | null {
  // Prefer an unexplored allowed field
  const allFields = new Set(getAllNodes(graph).map((n) => n.field));
  const candidateFields = (allowed.length > 0 ? allowed : Array.from(allFields)).filter(
    (f) => f !== avoidField,
  );
  candidateFields.sort((a, b) => Number(state.fieldsCovered.includes(a)) - Number(state.fieldsCovered.includes(b)));
  for (const f of candidateFields) {
    const candidates = ratableOnly(
      getAllNodes(graph).filter((n) => n.field === f && n.depth === 2),
      state,
      allowed,
    );
    if (candidates.length > 0) {
      candidates.sort((a, b) => informationGain(b, state) - informationGain(a, state));
      return candidates[0];
    }
  }
  // Fallback: any unrated node anywhere
  const all = ratableOnly(getAllNodes(graph), state, allowed);
  if (all.length === 0) return null;
  all.sort((a, b) => informationGain(b, state) - informationGain(a, state));
  return all[0];
}

/** Entry point: pick the next style to show. */
export function pickNext(
  graph: GraphSnapshot,
  state: EngineState,
  selectedFields: string[],
): { node: StyleNode; reason: TraversalEntry["reason"] } | null {
  const allowed = selectedFields ?? [];

  // Phase 1: seed
  if (state.history.length < 3) {
    const seeds = getSeedQuestions(graph, allowed);
    const ratedIds = new Set(state.history.map((h) => h.nodeId));
    const next = seeds.find((s) => !ratedIds.has(s.id));
    if (next) return { node: next, reason: "seed" };
  }

  const last = state.history[state.history.length - 1];
  if (!last) {
    // Edge case: no history but seed already exhausted (e.g. user re-rated)
    const fallback = ratableOnly(getAllNodes(graph), state, allowed);
    if (fallback.length === 0) return null;
    fallback.sort((a, b) => informationGain(b, state) - informationGain(a, state));
    return { node: fallback[0], reason: "lateral" };
  }
  const lastNode = graph.nodesById.get(last.nodeId);
  if (!lastNode) {
    const fallback = ratableOnly(getAllNodes(graph), state, allowed);
    if (fallback.length === 0) return null;
    fallback.sort((a, b) => informationGain(b, state) - informationGain(a, state));
    return { node: fallback[0], reason: "lateral" };
  }

  // Adaptive moves based on the last rating
  const score = last.rating;
  let pick: { node: StyleNode; reason: TraversalEntry["reason"] } | null = null;
  if (score >= 75) {
    pick = goDeeper(lastNode, state, graph, allowed);
  } else if (score <= 25) {
    pick = pivotToContrast(lastNode, state, graph, allowed);
  } else if (score >= 50) {
    pick = exploreNeighbor(lastNode, state, graph, allowed);
  } else {
    pick = lateralMove(lastNode, state, graph, allowed);
  }
  if (pick) return pick;
  // Final fallback
  const sw = switchField(state, graph, allowed, lastNode.field);
  if (sw) return { node: sw, reason: "switch_field" };
  return null;
}
