/**
 * The 8 taste axes. Sign convention for loadings and contributions:
 * POSITIVE = the second pole of the axis name (chaos, maximal, contemporary,
 * expressive, cold, dimensional, abstract, intuition); NEGATIVE = the first
 * pole (order, minimal, classic, functional, warm, flat, literal, system).
 */
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

/** Per-plate loadings. Range -1..1 per axis; absent/0 = axis not expressed. */
export type AxisLoadings = Partial<Record<AxisKey, number>>;

/** Computed axis position, 0..100 (50 = neutral / no evidence). */
export type AxisScores = Record<AxisKey, number>;

/** Per-axis evidence coverage, 0..1. Low coverage = low confidence, never faked. */
export type AxisCoverage = Record<AxisKey, number>;

export const NEUTRAL_AXES: AxisScores = Object.fromEntries(
  AXIS_KEYS.map((k) => [k, 50]),
) as AxisScores;

export const ZERO_COVERAGE: AxisCoverage = Object.fromEntries(
  AXIS_KEYS.map((k) => [k, 0]),
) as AxisCoverage;

/**
 * Bump this whenever scoring semantics change. Stored profile versions and
 * blends are stamped with it; a bump never silently reinterprets an existing
 * published profile (see docs/FINAL-PLAN.md §5).
 */
export const MODEL_VERSION = "taste-engine-1.0.0";

/**
 * Coverage: sum of |loading| * mode-weight evidence on an axis, capped at 1.
 * Monotonic — more plates expressing an axis never lowers its coverage.
 * Rule of thumb: ~1 strong plate (|loading| 0.9+) or 2-3 moderate plates
 * saturate an axis; below that, confidence is honestly low.
 */
export const COVERAGE_SATURATION = 1;

/** Per-capture-mode evidence weight. Pick is binary (no intensity), rank is relative. */
export const MODE_WEIGHTS = {
  pick: 0.7,
  rank: 0.8,
  rate: 1.0,
} as const;

export type CaptureMode = keyof typeof MODE_WEIGHTS;

/** Shared/d divergent proof-plate thresholds (0..100 effective value). */
export const SHARED_PLATE_THRESHOLD = 70;
export const DIVERGENT_PLATE_THRESHOLD = 40;
