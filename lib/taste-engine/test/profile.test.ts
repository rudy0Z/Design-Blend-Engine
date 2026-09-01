import { describe, expect, it } from "vitest";
import { AXIS_KEYS, MODEL_VERSION, NEUTRAL_AXES } from "../src/axes";
import { computeProfileVersion, latestSignals, type Signal } from "../src/profile";
import type { PlateRef } from "../src/types";

const P = (id: string, styleId: string, loadings: PlateRef["axisLoadings"]): PlateRef => ({
  id,
  styleId,
  categoryId: "cat",
  fieldId: "field",
  label: id,
  imageUrl: null,
  axisLoadings: loadings,
});

// Deterministic fixture catalog: strong, opposite loadings.
const PLATES: PlateRef[] = [
  P("p_swiss", "gd_swiss_intl", { order_chaos: -0.95, warm_cold: 0.7, system_intuition: -0.9 }),
  P("p_punk", "gd_punk_zine", { order_chaos: 0.9, functional_expressive: 0.85, warm_cold: 0.4 }),
  P("p_minimal", "ui_spacious_minimal", { minimal_maximal: -0.9, order_chaos: -0.5 }),
  P("p_maximal", "gd_maximalist_poster", { minimal_maximal: 0.9, order_chaos: 0.4 }),
  P("p_classic", "gd_bauhaus", { classic_contemporary: -0.85, functional_expressive: -0.3 }),
  P("p_aurora", "ui_aurora_gradient", { classic_contemporary: 0.9, flat_dimensional: 0.8 }),
  P("p_brutal", "ui_brutalist_ui", { warm_cold: -0.5, minimal_maximal: 0.5, flat_dimensional: -0.8 }),
  P("p_editorial", "ui_dark_editorial", { warm_cold: 0.8, classic_contemporary: 0.9, minimal_maximal: -0.7 }),
];

const rate = (plateId: string, value: number, sequence: number): Signal => ({
  plateId,
  mode: "rate",
  value,
  sequence,
});

describe("latestSignals", () => {
  it("keeps only the highest-sequence signal per plate", () => {
    const out = latestSignals([
      rate("a", 90, 1),
      rate("a", 10, 2),
      rate("b", 50, 3),
    ]);
    expect(out).toHaveLength(2);
    expect(out.find((s) => s.plateId === "a")?.value).toBe(10);
  });
});

describe("computeProfileVersion — determinism", () => {
  it("same signals + plates + model version ⇒ identical output", () => {
    const signals = [rate("p_swiss", 90, 1), rate("p_minimal", 80, 2), rate("p_punk", 15, 3)];
    const a = computeProfileVersion(signals, PLATES);
    const b = computeProfileVersion([...signals].reverse(), PLATES);
    expect(a).toEqual(b);
    expect(a.modelVersion).toBe(MODEL_VERSION);
  });
});

describe("computeProfileVersion — axes", () => {
  it("returns neutral axes with zero coverage for no signals", () => {
    const p = computeProfileVersion([], PLATES);
    expect(p.axes).toEqual(NEUTRAL_AXES);
    expect(p.overallCoverage).toBe(0);
    expect(p.ratedCount).toBe(0);
    expect(p.topPlates).toEqual([]);
  });

  it("rating a strongly ordered plate moves order_chaos toward Order (low value)", () => {
    const p = computeProfileVersion([rate("p_swiss", 95, 1)], PLATES);
    expect(p.axes.order_chaos).toBeLessThan(20);
    expect(p.axes.system_intuition).toBeLessThan(30);
    expect(p.axisCoverage.order_chaos).toBeGreaterThan(0);
  });

  it("rates opposite plates high ⇒ axes cancel toward neutral", () => {
    const p = computeProfileVersion(
      [rate("p_swiss", 95, 1), rate("p_punk", 95, 2)],
      PLATES,
    );
    expect(Math.abs(p.axes.order_chaos - 50)).toBeLessThan(
      Math.abs(p.axes.warm_cold - 50),
    );
  });

  it("latest evidence wins: re-rating down overwrites an earlier high rating", () => {
    const p = computeProfileVersion(
      [rate("p_aurora", 95, 1), rate("p_aurora", 5, 2)],
      PLATES,
    );
    // Latest value 5 (dislike) × +0.9 contemporary loading ⇒ axis pushed toward CLASSIC (<50).
    expect(p.axes.classic_contemporary).toBeLessThan(50);
  });

  it("coverage grows with more plates rated and is capped at 1", () => {
    const one = computeProfileVersion([rate("p_swiss", 90, 1)], PLATES);
    const all = computeProfileVersion(
      PLATES.map((p, i) => rate(p.id, 90, i)),
      PLATES,
    );
    expect(all.axisCoverage.order_chaos).toBeGreaterThan(one.axisCoverage.order_chaos);
    expect(all.axisCoverage.order_chaos).toBeLessThanOrEqual(1);
  });

  it("skips never appear: unrecorded plates do not affect axes or coverage", () => {
    const p = computeProfileVersion([], PLATES);
    for (const k of AXIS_KEYS) expect(p.axisCoverage[k]).toBe(0);
  });
});

describe("computeProfileVersion — top plates", () => {
  it("ranks actual ratings best-first and caps at 6", () => {
    const signals = PLATES.map((p, i) => rate(p.id, 100 - i * 5, i));
    const p = computeProfileVersion(signals, PLATES);
    expect(p.topPlates).toHaveLength(6);
    expect(p.topPlates[0].plateId).toBe("p_swiss");
    expect(p.topPlates[0].value).toBeGreaterThanOrEqual(p.topPlates[5].value);
  });

  it("re-rate is reflected in top plates via latest signal", () => {
    const p = computeProfileVersion(
      [rate("p_swiss", 20, 1), rate("p_swiss", 95, 2), rate("p_punk", 30, 3)],
      PLATES,
    );
    expect(p.topPlates[0].plateId).toBe("p_swiss");
  });
});

describe("computeProfileVersion — style vector & archetype", () => {
  it("predicts higher preference for styles aligned with rated taste", () => {
    const p = computeProfileVersion(
      [rate("p_swiss", 95, 1), rate("p_minimal", 90, 2)],
      PLATES,
    );
    expect(p.styleVector["gd_swiss_intl"]).toBeGreaterThan(p.styleVector["gd_punk_zine"]);
  });

  it("always returns an archetype", () => {
    const p = computeProfileVersion([rate("p_swiss", 90, 1)], PLATES);
    expect(p.archetype.id).toBeTruthy();
    expect(p.archetype.title).toBeTruthy();
  });
});
