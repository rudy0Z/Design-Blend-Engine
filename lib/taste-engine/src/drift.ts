import { AXIS_KEYS, AXIS_META, type AxisKey } from "./axes";
import type { ProfileVersionData, TopPlate } from "./types";

export type AxisDrift = {
  key: AxisKey;
  label: string;
  before: number;
  after: number;
  delta: number;
  directionPole: string;
};

export type DriftDiff = {
  movedAxes: AxisDrift[];
  newTopPlates: TopPlate[];
  archetypeChanged: boolean;
  previousArchetype: string;
  currentArchetype: string;
  coverageDelta: number;
  summary: string;
};

/**
 * Compute an inspectable Taste Evolution Drift Diff between two immutable versions
 * (docs/FINAL-PLAN.md §6 & CORE-IDEOLOGY-AND-ARCHITECTURE.md §4).
 */
export function computeDriftDiff(
  older: ProfileVersionData,
  newer: ProfileVersionData,
): DriftDiff {
  const movedAxes: AxisDrift[] = [];
  for (const k of AXIS_KEYS) {
    const before = older.axes[k] ?? 50;
    const after = newer.axes[k] ?? 50;
    const delta = after - before;
    if (Math.abs(delta) >= 4) {
      const meta = AXIS_META[k];
      movedAxes.push({
        key: k,
        label: meta.shortLabel,
        before,
        after,
        delta,
        directionPole: delta > 0 ? meta.right : meta.left,
      });
    }
  }
  movedAxes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const oldIds = new Set(older.topPlates.map((p) => p.plateId));
  const newTopPlates = newer.topPlates.filter((p) => !oldIds.has(p.plateId));
  const archetypeChanged = older.archetype.id !== newer.archetype.id;
  const coverageDelta = Math.round((newer.overallCoverage - older.overallCoverage) * 100);

  let summary = "Sensibility remained steady across additional plates.";
  if (movedAxes.length > 0) {
    const lead = movedAxes[0];
    summary = `Shifted ${Math.abs(lead.delta)} pts toward ${lead.directionPole} on ${lead.label}${
      archetypeChanged ? `, evolving from ${older.archetype.title} to ${newer.archetype.title}` : ""
    }.`;
  }

  return {
    movedAxes,
    newTopPlates,
    archetypeChanged,
    previousArchetype: older.archetype.title,
    currentArchetype: newer.archetype.title,
    coverageDelta,
    summary,
  };
}
