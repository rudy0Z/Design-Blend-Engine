import {
  AXIS_KEYS,
  DIVERGENT_PLATE_THRESHOLD,
  MODEL_VERSION,
  SHARED_PLATE_THRESHOLD,
} from "./axes";
import { latestSignals } from "./profile";
import type {
  BlendAxis,
  BlendData,
  BlendPlate,
  PlateRef,
  ProfileVersionData,
  Signal,
} from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Latest effective value per plate (rate/rank value; pick ≈ 75 = mild positive). */
export function effectiveValues(signals: Signal[]): Map<string, number> {
  const latest = latestSignals(signals);
  const out = new Map<string, number>();
  for (const s of latest) {
    out.set(s.plateId, s.mode === "pick" ? 75 : clamp(Math.round(s.value), 0, 100));
  }
  return out;
}

/**
 * Synchronous pairwise blend. Exact weighted cosine on axes where BOTH
 * profiles have evidence (coverage > 0), weighted by min(coverageA, coverageB).
 * Missing dimensions are excluded — never treated as neutral/50.
 * Proof plates come from what both people ACTUALLY rated. AI never participates.
 */
export function computeBlend(
  a: ProfileVersionData,
  b: ProfileVersionData,
  signalsA: Signal[],
  signalsB: Signal[],
  plates: PlateRef[],
): BlendData {
  // Weighted cosine on overlapping high-confidence dimensions.
  let dot = 0;
  let na = 0;
  let nb = 0;
  let coverageSum = 0;
  const perAxis: BlendAxis[] = [];
  for (const k of AXIS_KEYS) {
    const cov = Math.min(a.axisCoverage[k], b.axisCoverage[k]);
    if (cov <= 0) continue;
    const av = (a.axes[k] - 50) / 50;
    const bv = (b.axes[k] - 50) / 50;
    dot += cov * av * bv;
    na += cov * av * av;
    nb += cov * bv * bv;
    coverageSum += cov;
    perAxis.push({ key: k, a: a.axes[k], b: b.axes[k], delta: b.axes[k] - a.axes[k], coverage: cov });
  }
  const similarity = na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
  const score = clamp(Math.round(((similarity + 1) / 2) * 100), 0, 100);
  perAxis.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

  // Proof plates from actual ratings.
  const valuesA = effectiveValues(signalsA);
  const valuesB = effectiveValues(signalsB);
  const platesById = new Map(plates.map((p) => [p.id, p]));

  const sharedPlates: BlendPlate[] = [];
  const divergentPlates: BlendPlate[] = [];
  for (const [plateId, va] of valuesA) {
    const vb = valuesB.get(plateId);
    if (vb === undefined) continue;
    const plate = platesById.get(plateId);
    if (!plate) continue;
    if (va >= SHARED_PLATE_THRESHOLD && vb >= SHARED_PLATE_THRESHOLD) {
      sharedPlates.push({
        plateId,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        valueA: va,
        valueB: vb,
      });
    } else if (Math.abs(va - vb) >= DIVERGENT_PLATE_THRESHOLD) {
      divergentPlates.push({
        plateId,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        valueA: va,
        valueB: vb,
      });
    }
  }
  sharedPlates.sort(
    (x, y) => Math.min(y.valueA, y.valueB) - Math.min(x.valueA, x.valueB),
  );
  divergentPlates.sort(
    (x, y) => Math.abs(y.valueA - y.valueB) - Math.abs(x.valueA - x.valueB),
  );

  return {
    score,
    similarity,
    perAxis,
    sharedPlates,
    divergentPlates,
    sharedDimensions: perAxis.length,
    overallCoverage: coverageSum / AXIS_KEYS.length,
    modelVersion: MODEL_VERSION,
  };
}
