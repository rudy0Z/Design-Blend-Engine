import type {
  AxisCoverage,
  AxisKey,
  AxisLoadings,
  AxisScores,
  CaptureMode,
  CraftKey,
  CraftLoadings,
  CraftScores,
} from "./axes";

/** One append-only capture signal. Skips are never recorded (skip = unknown). */
export type Signal = {
  plateId: string;
  mode: CaptureMode;
  /** 0..100 for rate/rank/pair. For pick, value is 100 (chosen); contribution is fixed. */
  value: number;
  /** Monotonic per-user ordering. Higher sequence = newer evidence. */
  sequence: number;
  /** Optional 1-tap studio critique chips attached to the reaction. */
  critiqueTags?: string[];
  /** Optional short user note. */
  note?: string;
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
  craftLoadings?: CraftLoadings;
  pairGroupId?: string | null;
  craftDimension?: CraftKey | null;
  diagnosticKind?: "canonical" | "foil" | "craft_variant" | "anti_slop";
};

export type TopPlate = {
  plateId: string;
  styleId: string;
  label: string;
  imageUrl: string | null;
  value: number;
  mode: CaptureMode;
  critiqueTags?: string[];
};

export type NegativeAnchor = {
  plateId: string;
  styleId: string;
  label: string;
  imageUrl: string | null;
  value: number;
  critiqueTags: string[];
};

export type FieldSlice = {
  fieldId: string;
  axes: AxisScores;
  coverage: number;
  ratedCount: number;
  archetypeTitle: string;
};

export type CategoryAffinity = {
  categoryId: string;
  fieldId: string;
  score: number;
  count: number;
};

export type CreativeRange = {
  hasDuality: boolean;
  maxDelta: number;
  axisKey: AxisKey | null;
  fieldA: string | null;
  fieldB: string | null;
  summary: string;
};

/** A computed, immutable profile snapshot (v2 multi-layer branching spec). */
export type ProfileVersionData = {
  axes: AxisScores;
  axisCoverage: AxisCoverage;
  /** Mean coverage across the 8 axes, 0..1. */
  overallCoverage: number;
  /** Isolated 4-axis craft bedrock (density, typography, chromatic, surface). */
  craftProfile: CraftScores;
  /** Branch-specific taste vectors so cross-field contradictions are preserved, not flattened. */
  fieldSlices: Record<string, FieldSlice>;
  /** Subcategory-level affinity across all explored subcategories. */
  categoryAffinity: Record<string, CategoryAffinity>;
  /** Posterior preference per styleId, 0..100, correlated via structural lineage kernel. */
  styleVector: Record<string, number>;
  /** Top plates the user actually rated (never predicted), best first. */
  topPlates: TopPlate[];
  /** Hard rejections (value <= 20) — diagnostic aversive anchors. */
  negativeAnchors: NegativeAnchor[];
  /** Frequency of studio critique tags cited by the designer. */
  critiqueCounts: Record<string, number>;
  /** Detects creative tension when a designer behaves differently across fields. */
  creativeRange: CreativeRange;
  /** Deterministic generative palette [primaryHueHex, secondaryHueHex, glowHex] derived from taste axes. */
  auraColors?: [string, string, string];
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
  tagsA?: string[];
  tagsB?: string[];
};

export type DealbreakerClash = {
  plateId: string;
  styleId: string;
  label: string;
  imageUrl: string | null;
  lovedBy: "A" | "B";
  valueA: number;
  valueB: number;
  tagsA: string[];
  tagsB: string[];
};

export type CrossoverBridge = {
  plateId: string;
  styleId: string;
  label: string;
  imageUrl: string | null;
  fromUser: "A" | "B";
  sourceScore: number;
  predictedFitForOther: number;
  reason: string;
};

export type FieldBlendSlice = {
  fieldId: string;
  score: number;
  coverage: number;
};

export type DyadClassification = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
};

/** Synchronous pairwise blend (v2 calibrated multi-layer + dealbreaker caps). */
export type BlendData = {
  /** Headline Display Resonance %, 0..100 (after dealbreaker caps). */
  score: number;
  /** Raw weighted cosine on overlapping high-confidence axes, -1..1. */
  similarity: number;
  /** Shared Sensibility %, 0..100. */
  harmonyScore: number;
  /** Productive Creative Friction %, 0..100 (Kirton KAI complementarity). */
  frictionScore: number;
  /** Penalty points deducted due to hard dealbreaker clashes. */
  penaltyApplied: number;
  /** Explicit canon-vs-slop dealbreaker collisions. */
  dealbreakerClashes: DealbreakerClash[];
  /** Dyad partnership archetype based on Harmony x Friction x Craft floor. */
  dyad: DyadClassification;
  perAxis: BlendAxis[];
  perField: FieldBlendSlice[];
  craftDelta: Record<CraftKey, { a: number; b: number; delta: number }>;
  /** Plates BOTH people actually rated >= shared threshold, best overlap first. */
  sharedPlates: BlendPlate[];
  /** Plates both rated with strongly opposing values, biggest gap first. */
  divergentPlates: BlendPlate[];
  /** Unseen plates one designer loved that sit inside the other's latent neighborhood. */
  crossoverBridges: CrossoverBridge[];
  /** Number of axes that contributed to the cosine (both coverages > 0). */
  sharedDimensions: number;
  overallCoverage: number;
  modelVersion: string;
};
