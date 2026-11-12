/**
 * The 8 epistemic taste axes. Sign convention for loadings and contributions:
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

export const AXIS_META: Record<
  AxisKey,
  { left: string; right: string; shortLabel: string; description: string }
> = {
  order_chaos: {
    left: "Order",
    right: "Chaos",
    shortLabel: "Structural Order",
    description: "Mathematical grid discipline vs. rule-breaking compositional tension",
  },
  minimal_maximal: {
    left: "Minimal",
    right: "Maximal",
    shortLabel: "Visual Density",
    description: "Subtractive silence vs. layered, high-density richness",
  },
  classic_contemporary: {
    left: "Classic",
    right: "Contemporary",
    shortLabel: "Temporal Lineage",
    description: "Enduring historical canon vs. emergent contemporary vernacular",
  },
  functional_expressive: {
    left: "Functional",
    right: "Expressive",
    shortLabel: "Intent & Voice",
    description: "Utilitarian clarity vs. authored emotional provocation",
  },
  warm_cold: {
    left: "Warm",
    right: "Cold",
    shortLabel: "Thermal Tone",
    description: "Tactile, human warmth vs. clinical, surgical precision",
  },
  flat_dimensional: {
    left: "Flat",
    right: "Dimensional",
    shortLabel: "Spatial Depth",
    description: "Graphic 2D ink/vector honesty vs. optical depth, blur, and lighting",
  },
  literal_abstract: {
    left: "Literal",
    right: "Abstract",
    shortLabel: "Semiotics",
    description: "Direct concrete representation vs. symbolic geometric reduction",
  },
  system_intuition: {
    left: "System",
    right: "Intuition",
    shortLabel: "Epistemology",
    description: "Repeatable token architecture vs. bespoke gestural instinct",
  },
};

/**
 * The 4 isolated Craft Bedrock dimensions (DESIGN-BLEND-SYSTEM.md §2 & v2 spec).
 * Range 0..100 (50 = neutral).
 * - density: Spacious / Atmospheric (0) <-> Dense / High-Throughput (100)
 * - typography: Neutral Geometric System (0) <-> Expressive / Editorial Voice (100)
 * - chromatic: Monochrome / Muted Restraint (0) <-> High-Chroma Saturation (100)
 * - surface: Crisp Flat Hairline (0) <-> Tactile / Material Depth (100)
 */
export const CRAFT_KEYS = ["density", "typography", "chromatic", "surface"] as const;
export type CraftKey = (typeof CRAFT_KEYS)[number];

export const CRAFT_META: Record<CraftKey, { left: string; right: string; label: string }> = {
  density: { left: "Atmospheric", right: "High-Density", label: "Spacing & Throughput" },
  typography: { left: "System Sans", right: "Editorial / Bespoke", label: "Typographic Voice" },
  chromatic: { left: "Restrained", right: "Chromatic", label: "Color Appetite" },
  surface: { left: "Flat Hairline", right: "Tactile Material", label: "Surface Materiality" },
};

export type CraftLoadings = Partial<Record<CraftKey, number>>;
export type CraftScores = Record<CraftKey, number>;

export const NEUTRAL_CRAFT: CraftScores = {
  density: 50,
  typography: 50,
  chromatic: 50,
  surface: 50,
};

/**
 * Structured 1-tap studio critique chips grounded in Leder et al. (2004)
 * cognitive mastery vs. aversive acuity (Bourdieu/Wilk).
 */
export const CRITIQUE_TAGS = [
  { id: "surgical_grid", label: "Unreal proportions", polarity: "positive" },
  { id: "honest_material", label: "Honest material", polarity: "positive" },
  { id: "earned_tension", label: "Feels alive", polarity: "positive" },
  { id: "timeless_type", label: "Timeless craft", polarity: "positive" },
  { id: "sterile_cold", label: "Cold & soulless", polarity: "negative" },
  { id: "visual_noise", label: "Tries too hard", polarity: "negative" },
  { id: "ai_slop", label: "Feels like AI slop", polarity: "negative" },
  { id: "hostile_ux", label: "Style over function", polarity: "negative" },
] as const;

export type CritiqueTagId = (typeof CRITIQUE_TAGS)[number]["id"];

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
 * published profile (see docs/CORE-IDEOLOGY-AND-ARCHITECTURE.md §4).
 */
export const MODEL_VERSION = "taste-engine-2.0.0";

export const COVERAGE_SATURATION = 1.2;

/** Per-capture-mode evidence weight. */
export const MODE_WEIGHTS = {
  pick: 0.7,
  rank: 0.85,
  pair: 0.9,
  rate: 1.0,
} as const;

export type CaptureMode = keyof typeof MODE_WEIGHTS;

/** Proof-plate & dealbreaker thresholds (0..100 effective value). */
export const SHARED_PLATE_THRESHOLD = 70;
export const DIVERGENT_PLATE_THRESHOLD = 40;
export const DEALBREAKER_HIGH_THRESHOLD = 80;
export const DEALBREAKER_LOW_THRESHOLD = 20;
