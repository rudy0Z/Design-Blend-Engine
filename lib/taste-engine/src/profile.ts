import {
  AXIS_KEYS,
  COVERAGE_SATURATION,
  MODE_WEIGHTS,
  MODEL_VERSION,
  NEUTRAL_AXES,
  ZERO_COVERAGE,
  type AxisCoverage,
  type AxisKey,
  type AxisLoadings,
  type AxisScores,
} from "./axes";
import { matchArchetype } from "./archetypes";
import type { PlateRef, ProfileVersionData, Signal, TopPlate } from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * Latest evidence wins: for each plate only the highest-sequence signal
 * contributes (a re-rate appends a new signal; it never mutates history).
 */
export function latestSignals(signals: Signal[]): Signal[] {
  const byPlate = new Map<string, Signal>();
  for (const s of signals) {
    const prev = byPlate.get(s.plateId);
    if (!prev || s.sequence > prev.sequence) byPlate.set(s.plateId, s);
  }
  return [...byPlate.values()];
}

/** Evidence contribution of a signal: agreement in -1..1 and its mode weight. */
export function signalContribution(s: Signal): { agreement: number; weight: number } {
  const weight = MODE_WEIGHTS[s.mode];
  if (s.mode === "pick") {
    // Binary, no intensity: a mild positive toward the chosen plate.
    return { agreement: 0.5, weight };
  }
  return { agreement: clamp((s.value - 50) / 50, -1, 1), weight };
}

/**
 * Compute an immutable profile version from append-only signals + the catalog.
 * Deterministic: same signals + same plates + same MODEL_VERSION ⇒ identical output.
 */
export function computeProfileVersion(
  rawSignals: Signal[],
  plates: PlateRef[],
): ProfileVersionData {
  const signals = latestSignals(rawSignals);
  const platesById = new Map(plates.map((p) => [p.id, p]));

  const sums: Record<string, number> = {};
  const weightSums: Record<string, number> = {};
  for (const k of AXIS_KEYS) {
    sums[k] = 0;
    weightSums[k] = 0;
  }

  for (const s of signals) {
    const plate = platesById.get(s.plateId);
    if (!plate) continue;
    const { agreement, weight } = signalContribution(s);
    for (const k of AXIS_KEYS) {
      const loading = plate.axisLoadings[k] ?? 0;
      if (loading === 0) continue;
      sums[k] += agreement * loading * weight;
      weightSums[k] += Math.abs(loading) * weight;
    }
  }

  const axes: AxisScores = { ...NEUTRAL_AXES };
  const axisCoverage: AxisCoverage = { ...ZERO_COVERAGE };
  for (const k of AXIS_KEYS) {
    if (weightSums[k] > 0) {
      const norm = sums[k] / weightSums[k];
      axes[k] = clamp(Math.round((norm + 1) * 50), 0, 100);
      axisCoverage[k] = clamp(weightSums[k] / COVERAGE_SATURATION, 0, 1);
    }
  }

  // Style-level loadings: average across the plates representing each style.
  const styleSums: Record<string, Partial<Record<AxisKey, number>>> = {};
  const styleCounts: Record<string, number> = {};
  for (const p of plates) {
    styleCounts[p.styleId] = (styleCounts[p.styleId] ?? 0) + 1;
    for (const k of AXIS_KEYS) {
      const l = p.axisLoadings[k];
      if (l === undefined) continue;
      const acc = (styleSums[p.styleId] ??= {});
      acc[k] = (acc[k] ?? 0) + l;
    }
  }
  const styleLoadings = new Map<string, AxisLoadings>();
  for (const [styleId, acc] of Object.entries(styleSums)) {
    const n = styleCounts[styleId];
    styleLoadings.set(
      styleId,
      Object.fromEntries(
        Object.entries(acc).map(([k, v]) => [k, (v as number) / n]),
      ) as AxisLoadings,
    );
  }

  // Predicted preference per style from the user's axes (0..100).
  const signed: Record<string, number> = {};
  for (const k of AXIS_KEYS) signed[k] = (axes[k] - 50) / 50;
  const styleVector: Record<string, number> = {};
  for (const [styleId, loadings] of styleLoadings) {
    let s = 0;
    let w = 0;
    for (const k of AXIS_KEYS) {
      const l = loadings[k] ?? 0;
      s += signed[k] * l;
      w += Math.abs(l);
    }
    const norm = w > 0 ? s / w : 0;
    styleVector[styleId] = clamp(Math.round((norm + 1) * 50), 0, 100);
  }

  // Top plates = plates the user ACTUALLY rated, best first (never predicted).
  const topPlates: TopPlate[] = signals
    .map((s) => {
      const plate = platesById.get(s.plateId);
      if (!plate) return null;
      const value = s.mode === "pick" ? 100 : clamp(Math.round(s.value), 0, 100);
      return {
        plateId: plate.id,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        value,
        mode: s.mode,
      } satisfies TopPlate;
    })
    .filter((t): t is TopPlate => t !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const { archetype, confidence } = matchArchetype(axes);
  const coverages = AXIS_KEYS.map((k) => axisCoverage[k]);
  const overallCoverage = coverages.reduce((a, b) => a + b, 0) / AXIS_KEYS.length;

  return {
    axes,
    axisCoverage,
    overallCoverage,
    styleVector,
    topPlates,
    archetype: { id: archetype.id, title: archetype.title, confidence },
    modelVersion: MODEL_VERSION,
    ratedCount: signals.length,
  };
}
