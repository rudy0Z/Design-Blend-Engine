/**
 * Catalog integrity tests (docs/FINAL-PLAN.md §2, CREDITS.md lifecycle).
 * These guard the source-of-truth catalog without needing a database: a bad
 * plate id, an axis loading outside the documented range, or a style the
 * generator has no metadata for should fail CI, not a user's capture flow.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

type AxisLoadings = Record<string, number>;

type CatalogPlate = {
  id: string;
  style_id: string;
  category_id: string;
  image_url: string | null;
  credit_line: string;
  source_url: string | null;
  license_note: string;
  alt_text: string;
  axis_loadings: AxisLoadings;
  tags: string[];
  status: string;
};

type Catalog = {
  _meta: {
    version: string;
    fields_count: number;
    categories_count: number;
    plates_target_per_category: number;
  };
  axes: Array<{ key: string; negative: string; positive: string }>;
  fields: Array<{
    id: string;
    categories: Array<{ id: string; styles: string[] }>;
  }>;
  plates: CatalogPlate[];
};

const catalogPath = path.resolve(import.meta.dirname, "../../../catalog/v1.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as Catalog;

const AXIS_KEYS = catalog.axes.map((a) => a.key);
const categoriesById = new Map(
  catalog.fields.flatMap((f) => f.categories.map((c) => [c.id, c] as const)),
);

describe("catalog/v1.json integrity", () => {
  it("is a versioned catalog with the documented taxonomy shape", () => {
    expect(catalog._meta.version).toMatch(/^v\d+\.\d+\.\d+/);
    expect(catalog.fields.length).toBe(catalog._meta.fields_count);
    expect(catalog.fields.flatMap((f) => f.categories).length).toBe(
      catalog._meta.categories_count,
    );
    expect(catalog.axes).toHaveLength(8);
  });

  it("has unique plate ids", () => {
    const ids = catalog.plates.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only known categories and styles", () => {
    for (const plate of catalog.plates) {
      const category = categoriesById.get(plate.category_id);
      expect(category, `unknown category ${plate.category_id}`).toBeDefined();
      expect(
        category?.styles.includes(plate.style_id),
        `plate ${plate.id} style ${plate.style_id} is not in its category style list`,
      ).toBe(true);
    }
  });

  it("keeps axis loadings inside the documented -1..1 range", () => {
    for (const plate of catalog.plates) {
      for (const [axis, loading] of Object.entries(plate.axis_loadings)) {
        expect(AXIS_KEYS, `${plate.id} uses unknown axis ${axis}`).toContain(axis);
        expect(
          loading,
          `${plate.id} axis ${axis} out of range`,
        ).toBeGreaterThanOrEqual(-1);
        expect(loading).toBeLessThanOrEqual(1);
      }
    }
  });

  it("gives every plate a credit line, alt text and a lifecycle status", () => {
    for (const plate of catalog.plates) {
      expect(plate.credit_line.trim().length).toBeGreaterThan(0);
      expect(plate.alt_text.trim().length).toBeGreaterThan(0);
      expect(["pending", "approved", "retired"]).toContain(plate.status);
      expect(["product-screenshot", "public-domain", "to-curate", "portfolio"]).toContain(
        plate.license_note,
      );
    }
  });

  it("only ships credited images, and every pending slot declares it is uncured", () => {
    for (const plate of catalog.plates) {
      if (plate.license_note === "to-curate") {
        // A slot awaiting a real credited image must not pretend otherwise.
        expect(
          plate.image_url,
          `${plate.id} has an image but is still marked to-curate`,
        ).toBeNull();
        expect(plate.credit_line).toMatch(/Pending curation/);
      } else {
        expect(plate.credit_line).not.toMatch(/Pending curation/);
      }
    }
  });

  it("keeps at least 3 rank-eligible siblings in every category", () => {
    // rank mode requires 3 siblings of the same category (catalog schema_notes).
    for (const field of catalog.fields) {
      for (const category of field.categories) {
        const rankEligible = catalog.plates.filter(
          (p) =>
            p.category_id === category.id &&
            p.status !== "retired" &&
            p.tags.includes("rank-eligible"),
        );
        expect(
          rankEligible.length,
          `category ${category.id} has ${rankEligible.length} rank-eligible plates`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("covers every style slot in the taxonomy with at least one plate", () => {
    const plated = new Set(catalog.plates.filter((p) => p.status !== "retired").map((p) => `${p.category_id}::${p.style_id}`));
    for (const field of catalog.fields) {
      for (const category of field.categories) {
        for (const style of category.styles) {
          expect(
            plated.has(`${category.id}::${style}`),
            `style ${style} in ${category.id} has no plate`,
          ).toBe(true);
        }
      }
    }
  });
});