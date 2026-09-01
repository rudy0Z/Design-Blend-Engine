/**
 * Seed the plate catalog from catalog/v1.json (repo root) into the plates table.
 * Run: pnpm --filter @workspace/db seed
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db, pool } from "./index";
import { platesTable } from "./schema/plates";

type CatalogJson = {
  _meta: { version: string };
  fields: Array<{
    id: string;
    categories: Array<{ id: string; styles: string[] }>;
  }>;
  plates: Array<{
    id: string;
    style_id: string;
    category_id: string;
    image_url: string | null;
    credit_line: string;
    source_url: string | null;
    license_note: string;
    alt_text: string;
    axis_loadings: Record<string, number>;
    tags: string[];
    status: string;
  }>;
};

async function main() {
  const catalogPath = path.resolve(import.meta.dirname, "../../../catalog/v1.json");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogJson;
  const catalogVersion = catalog._meta.version;

  // Resolve category -> field from the taxonomy so plates carry both ids.
  const fieldByCategory = new Map<string, string>();
  for (const f of catalog.fields) {
    for (const c of f.categories) fieldByCategory.set(c.id, f.id);
  }

  let upserted = 0;
  for (const p of catalog.plates) {
    const fieldId = fieldByCategory.get(p.category_id);
    if (!fieldId) {
      console.warn(`Skipping plate ${p.id}: unknown category ${p.category_id}`);
      continue;
    }
    await db
      .insert(platesTable)
      .values({
        id: p.id,
        styleId: p.style_id,
        categoryId: p.category_id,
        fieldId,
        label: p.alt_text.slice(0, 80),
        imageUrl: p.image_url,
        creditLine: p.credit_line,
        sourceUrl: p.source_url,
        licenseNote: p.license_note,
        altText: p.alt_text,
        axisLoadings: p.axis_loadings,
        tags: p.tags,
        status: p.status,
        catalogVersion,
      })
      .onConflictDoUpdate({
        target: platesTable.id,
        set: {
          styleId: p.style_id,
          categoryId: p.category_id,
          fieldId,
          imageUrl: p.image_url,
          creditLine: p.credit_line,
          sourceUrl: p.source_url,
          licenseNote: p.license_note,
          altText: p.alt_text,
          axisLoadings: p.axis_loadings,
          tags: p.tags,
          status: p.status,
          catalogVersion,
        },
      });
    upserted += 1;
  }
  console.log(`Seeded ${upserted} plates (catalog ${catalogVersion}).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
