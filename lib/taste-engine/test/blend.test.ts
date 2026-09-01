import { describe, expect, it } from "vitest";
import { computeBlend } from "../src/blend";
import { computeProfileVersion } from "../src/profile";
import type { PlateRef, Signal } from "../src/types";

const PLATES: PlateRef[] = [
  { id: "p_swiss", styleId: "gd_swiss_intl", categoryId: "c", fieldId: "f", label: "Swiss International", imageUrl: "img-swiss", axisLoadings: { order_chaos: -0.95, warm_cold: 0.7, system_intuition: -0.9 } },
  { id: "p_minimal", styleId: "ui_spacious_minimal", categoryId: "c", fieldId: "f", label: "Spacious Minimal", imageUrl: "img-min", axisLoadings: { minimal_maximal: -0.9, order_chaos: -0.5 } },
  { id: "p_punk", styleId: "gd_punk_zine", categoryId: "c", fieldId: "f", label: "Punk Zine", imageUrl: "img-punk", axisLoadings: { order_chaos: 0.9, functional_expressive: 0.85 } },
  { id: "p_maximal", styleId: "gd_maximalist_poster", categoryId: "c", fieldId: "f", label: "Maximalist", imageUrl: "img-max", axisLoadings: { minimal_maximal: 0.9, order_chaos: 0.4 } },
];

const rate = (plateId: string, value: number, sequence: number): Signal => ({
  plateId,
  mode: "rate",
  value,
  sequence,
});

const TASTE_A = [rate("p_swiss", 95, 1), rate("p_minimal", 90, 2), rate("p_punk", 10, 3)];
const TASTE_B_LIKE_A = [rate("p_swiss", 92, 1), rate("p_minimal", 85, 2), rate("p_punk", 15, 3)];
const TASTE_B_OPPOSITE = [rate("p_swiss", 8, 1), rate("p_minimal", 12, 2), rate("p_punk", 95, 3)];

describe("computeBlend", () => {
  it("two identical taste profiles score 100", () => {
    const a = computeProfileVersion(TASTE_A, PLATES);
    const b = computeProfileVersion([...TASTE_A], PLATES);
    const blend = computeBlend(a, b, TASTE_A, TASTE_B_LIKE_A, PLATES);
    expect(blend.score).toBe(100);
    expect(blend.similarity).toBeCloseTo(1, 5);
  });

  it("opposite profiles score low", () => {
    const a = computeProfileVersion(TASTE_A, PLATES);
    const b = computeProfileVersion(TASTE_B_OPPOSITE, PLATES);
    const blend = computeBlend(a, b, TASTE_A, TASTE_B_OPPOSITE, PLATES);
    expect(blend.score).toBeLessThan(30);
  });

  it("is deterministic", () => {
    const a = computeProfileVersion(TASTE_A, PLATES);
    const b = computeProfileVersion(TASTE_B_LIKE_A, PLATES);
    expect(computeBlend(a, b, TASTE_A, TASTE_B_LIKE_A, PLATES)).toEqual(
      computeBlend(a, b, [...TASTE_A], [...TASTE_B_LIKE_A], PLATES),
    );
  });

  it("shared proof plates: both rated ≥70 on the same plate", () => {
    const a = computeProfileVersion(TASTE_A, PLATES);
    const b = computeProfileVersion(TASTE_B_LIKE_A, PLATES);
    const blend = computeBlend(a, b, TASTE_A, TASTE_B_LIKE_A, PLATES);
    const sharedIds = blend.sharedPlates.map((p) => p.plateId);
    expect(sharedIds).toContain("p_swiss");
    expect(sharedIds).toContain("p_minimal");
    expect(blend.sharedPlates[0].imageUrl).toBe("img-swiss");
  });

  it("divergent proof plates: strong opposing ratings appear with the gap", () => {
    const a = computeProfileVersion(TASTE_A, PLATES);
    const b = computeProfileVersion(TASTE_B_OPPOSITE, PLATES);
    const blend = computeBlend(a, b, TASTE_A, TASTE_B_OPPOSITE, PLATES);
    const divergent = blend.divergentPlates.find((p) => p.plateId === "p_swiss");
    expect(divergent).toBeDefined();
    expect(Math.abs(divergent!.valueA - divergent!.valueB)).toBeGreaterThanOrEqual(40);
  });

  it("per-axis breakdown covers every dimension with evidence on both sides", () => {
    const a = computeProfileVersion(TASTE_A, PLATES);
    const b = computeProfileVersion(TASTE_B_LIKE_A, PLATES);
    const blend = computeBlend(a, b, TASTE_A, TASTE_B_LIKE_A, PLATES);
    expect(blend.perAxis.length).toBeGreaterThan(0);
    for (const axis of blend.perAxis) {
      expect(axis.coverage).toBeGreaterThan(0);
      expect(axis.delta).toBe(axis.b - axis.a);
    }
  });

  it("no overlapping evidence ⇒ neutral 50, zero shared dimensions", () => {
    const empty: Signal[] = [];
    const a = computeProfileVersion(empty, PLATES);
    const b = computeProfileVersion(empty, PLATES);
    const blend = computeBlend(a, b, empty, empty, PLATES);
    expect(blend.score).toBe(50);
    expect(blend.sharedDimensions).toBe(0);
    expect(blend.sharedPlates).toEqual([]);
  });
});
