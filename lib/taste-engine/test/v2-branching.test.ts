import { describe, expect, it } from "vitest";
import {
  buildAdaptiveQueue,
  computeBlend,
  computeDriftDiff,
  computeProfileVersion,
  type PlateRef,
  type Signal,
} from "../src";

const BRANCH_PLATES: PlateRef[] = [
  // UI Field
  {
    id: "ui_strict",
    styleId: "ui_grid_strict",
    categoryId: "ui-layout",
    fieldId: "ui-ux",
    label: "Strict Grid UI",
    imageUrl: null,
    pairGroupId: "pair_ui_1",
    axisLoadings: { order_chaos: -0.95, system_intuition: -0.9, functional_expressive: -0.8 },
  },
  {
    id: "ui_slop",
    styleId: "ui_aurora_slop",
    categoryId: "ui-visual",
    fieldId: "ui-ux",
    label: "Glowing Mesh SaaS",
    imageUrl: null,
    pairGroupId: "pair_ui_1",
    diagnosticKind: "anti_slop",
    axisLoadings: { order_chaos: 0.5, classic_contemporary: 0.9, flat_dimensional: 0.85 },
  },
  {
    id: "ui_dense",
    styleId: "ui_dashboard_dense",
    categoryId: "ui-data",
    fieldId: "ui-ux",
    label: "Operator Terminal",
    imageUrl: null,
    axisLoadings: { order_chaos: -0.85, minimal_maximal: 0.8, system_intuition: -0.85 },
  },
  // Graphic Design Field
  {
    id: "gd_punk",
    styleId: "gd_punk_zine",
    categoryId: "gd-poster",
    fieldId: "graphic-design",
    label: "Xerox Punk Zine",
    imageUrl: null,
    pairGroupId: "pair_gd_1",
    axisLoadings: { order_chaos: 0.95, system_intuition: 0.9, functional_expressive: 0.9 },
  },
  {
    id: "gd_collage",
    styleId: "gd_collage_poster",
    categoryId: "gd-poster",
    fieldId: "graphic-design",
    label: "Layered Collage",
    imageUrl: null,
    pairGroupId: "pair_gd_1",
    axisLoadings: { order_chaos: 0.85, system_intuition: 0.8, minimal_maximal: 0.85 },
  },
  {
    id: "gd_swiss",
    styleId: "gd_swiss_intl",
    categoryId: "gd-poster",
    fieldId: "graphic-design",
    label: "Swiss Modular Grid",
    imageUrl: null,
    axisLoadings: { order_chaos: -0.95, system_intuition: -0.9, functional_expressive: -0.75 },
  },
  // Craft Strip Variants
  {
    id: "craft_d1",
    styleId: "craft_density_airy",
    categoryId: "craft",
    fieldId: "ui-ux",
    label: "32px Atmospheric",
    imageUrl: null,
    craftDimension: "density",
    diagnosticKind: "craft_variant",
    axisLoadings: { minimal_maximal: -0.9 },
    craftLoadings: { density: -0.95 },
  },
  {
    id: "craft_d2",
    styleId: "craft_density_balanced",
    categoryId: "craft",
    fieldId: "ui-ux",
    label: "16px Balanced",
    imageUrl: null,
    craftDimension: "density",
    diagnosticKind: "craft_variant",
    axisLoadings: { minimal_maximal: -0.2 },
    craftLoadings: { density: -0.25 },
  },
  {
    id: "craft_d3",
    styleId: "craft_density_dense",
    categoryId: "craft",
    fieldId: "ui-ux",
    label: "4px Telemetry",
    imageUrl: null,
    craftDimension: "density",
    diagnosticKind: "craft_variant",
    axisLoadings: { minimal_maximal: 0.9 },
    craftLoadings: { density: 0.95 },
  },
];

describe("v2 Branching & Duality Engine", () => {
  it("preserves cross-field creative contradictions instead of erasing them", () => {
    const signals: Signal[] = [
      { plateId: "ui_strict", mode: "rate", value: 96, sequence: 1, critiqueTags: ["surgical_grid"] },
      { plateId: "ui_dense", mode: "rate", value: 90, sequence: 2 },
      { plateId: "gd_punk", mode: "rate", value: 95, sequence: 3, critiqueTags: ["earned_tension"] },
      { plateId: "gd_collage", mode: "rate", value: 92, sequence: 4 },
      { plateId: "ui_slop", mode: "rate", value: 8, sequence: 5, critiqueTags: ["ai_slop"] },
    ];

    const profile = computeProfileVersion(signals, BRANCH_PLATES);

    // UI slice is strongly Ordered (<20), while Graphic slice is strongly Chaotic (>80)
    expect(profile.fieldSlices["ui-ux"].axes.order_chaos).toBeLessThan(20);
    expect(profile.fieldSlices["graphic-design"].axes.order_chaos).toBeGreaterThan(80);

    // Creative duality is explicitly surfaced
    expect(profile.creativeRange.hasDuality).toBe(true);
    expect(profile.creativeRange.maxDelta).toBeGreaterThan(60);

    // Negative anchor & critique tags recorded
    expect(profile.negativeAnchors.map((n) => n.plateId)).toContain("ui_slop");
    expect(profile.critiqueCounts["surgical_grid"]).toBe(1);
    expect(profile.critiqueCounts["ai_slop"]).toBe(1);
  });

  it("correlates cross-branch styles via structural lineage kernel", () => {
    // Designer only rates UI Strict Grid — never sees gd_swiss_intl directly
    const signals: Signal[] = [
      { plateId: "ui_strict", mode: "rate", value: 96, sequence: 1 },
      { plateId: "ui_dense", mode: "rate", value: 90, sequence: 2 },
    ];
    const profile = computeProfileVersion(signals, BRANCH_PLATES);
    // Unobserved gd_swiss_intl correlates strongly above unobserved gd_punk_zine
    expect(profile.styleVector["gd_swiss_intl"]).toBeGreaterThan(75);
    expect(profile.styleVector["gd_swiss_intl"]).toBeGreaterThan(profile.styleVector["gd_punk_zine"]);
  });

  it("applies dealbreaker clash penalties and surfaces Crossover Bridges", () => {
    const sigA: Signal[] = [
      { plateId: "ui_strict", mode: "rate", value: 95, sequence: 1, critiqueTags: ["surgical_grid"] },
      { plateId: "ui_slop", mode: "rate", value: 8, sequence: 2, critiqueTags: ["ai_slop"] },
      { plateId: "gd_swiss", mode: "rate", value: 92, sequence: 3 },
    ];
    // B loves ui_strict too, BUT canonizes ui_slop at 92 (hard clash with A's 8!) and hasn't seen gd_swiss
    const sigB: Signal[] = [
      { plateId: "ui_strict", mode: "rate", value: 90, sequence: 1 },
      { plateId: "ui_slop", mode: "rate", value: 92, sequence: 2 },
    ];

    const profA = computeProfileVersion(sigA, BRANCH_PLATES);
    const profB = computeProfileVersion(sigB, BRANCH_PLATES);
    const blend = computeBlend(profA, profB, sigA, sigB, BRANCH_PLATES);

    expect(blend.dealbreakerClashes).toHaveLength(1);
    expect(blend.dealbreakerClashes[0].plateId).toBe("ui_slop");
    expect(blend.penaltyApplied).toBeGreaterThan(0);
    // gd_swiss was loved by A, unseen by B, and fits B's ordered vector -> Crossover Bridge!
    expect(blend.crossoverBridges.some((b) => b.plateId === "gd_swiss")).toBe(true);
  });

  it("computes Drift Diff across taste evolution versions and builds interleaved adaptive queues", () => {
    const v1 = computeProfileVersion(
      [{ plateId: "ui_strict", mode: "rate", value: 92, sequence: 1 }],
      BRANCH_PLATES,
    );
    const v2 = computeProfileVersion(
      [
        { plateId: "ui_strict", mode: "rate", value: 92, sequence: 1 },
        { plateId: "gd_punk", mode: "rate", value: 96, sequence: 2 },
        { plateId: "gd_collage", mode: "rate", value: 94, sequence: 3 },
      ],
      BRANCH_PLATES,
    );
    const diff = computeDriftDiff(v1, v2);
    expect(diff.movedAxes.length).toBeGreaterThan(0);
    expect(diff.newTopPlates.length).toBeGreaterThan(0);

    const queue = buildAdaptiveQueue(BRANCH_PLATES, { maxPrompts: 6 });
    const kinds = new Set(queue.map((q) => q.kind));
    expect(kinds.has("craft_strip")).toBe(true);
    expect(kinds.has("foil_pair")).toBe(true);
  });
});
