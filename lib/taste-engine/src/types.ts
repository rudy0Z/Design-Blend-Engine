import type { AxisCoverage, AxisKey, AxisLoadings, AxisScores, CaptureMode } from "./axes";

/** One append-only capture signal. Skips are never recorded (skip = unknown). */
export type Signal = {
  plateId: string;
  mode: CaptureMode;
  /** 0..100 for rate/rank. For pick, value is 100 (chosen); contribution is fixed. */
  value: number;
  /** Monotonic per-user ordering. Higher sequence = newer evidence. */
  sequence: number;
};

/** The engine's view of a catalog plate (no DB types — pure data). */
export type PlateRef = {
  id: string;
  styleId: string;
  categoryId: string;
  fieldId: string;
  label: string;
  imageUrl: string | null;
  axisLoadings: AxisLoadings;
};

export type TopPlate = {
  plateId: string;
  styleId: string;
  label: string;
  imageUrl: string | null;
  value: number;
  mode: CaptureMode;
};

/** A computed, immutable profile snapshot (see FINAL-PLAN.md §1). */
export type ProfileVersionData = {
  axes: AxisScores;
  axisCoverage: AxisCoverage;
  /** Mean coverage across the 8 axes, 0..1. */
  overallCoverage: number;
  /** Predicted preference per styleId, 0..100. */
  styleVector: Record<string, number>;
  /** Top plates the user actually rated (never predicted), best first. */
  topPlates: TopPlate[];
  archetype: { id: string; title: string; confidence: number };
  modelVersion: string;
  /** Distinct plates with at least one signal. */
  ratedCount: number;
};

export type BlendAxis = {
  key: AxisKey;
  a: number;
  b: number;
  delta: number;
  /** min(coverageA, coverageB) for this axis. */
  coverage: number;
};

export type BlendPlate = {
  plateId: string;
  styleId: string;
  label: string;
  imageUrl: string | null;
  valueA: number;
  valueB: number;
};

/** Synchronous pairwise blend (see FINAL-PLAN.md §5). */
export type BlendData = {
  /** Display %, 0..100. */
  score: number;
  /** Raw weighted cosine on overlapping high-confidence axes, -1..1. */
  similarity: number;
  perAxis: BlendAxis[];
  /** Plates BOTH people actually rated ≥ shared threshold, best overlap first. */
  sharedPlates: BlendPlate[];
  /** Plates both rated with strongly opposing values, biggest gap first. */
  divergentPlates: BlendPlate[];
  /** Number of axes that contributed to the cosine (both coverages > 0). */
  sharedDimensions: number;
  overallCoverage: number;
  modelVersion: string;
};
