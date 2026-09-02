/**
 * Plate catalog generator.
 *
 * Expands catalog/v1.json from 6 exemplars to the full taxonomy: one
 * well-formed plated entry per (category, style) slot in `fields[*].categories[*].styles`.
 * Keeps existing plates (including the 6 curated exemplars) untouched; new plates
 * get style-matched axes + alt text (from catalog-styles.ts), status "pending",
 * and null image/source until a human curates a real credited image (CREDITS.md).
 *
 * Run: pnpm --filter @workspace/scripts gen:catalog
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { STYLE_META } from "./catalog-styles";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const catalogPath = path.join(repoRoot, "catalog", "v1.json");

type Plate = {
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
};

type Catalog = {
  _meta: Record<string, unknown>;
  fields: Array<{ id: string; categories: Array<{ id: string; styles: string[] }> }>;
  plates: Plate[];
};

const PLATE_ID_RE = /^plate_/;
const slugify = (s: string) => s.replace(/^pla?te?_/, "").replace(/-/g, "_");

const CREDIT_PENDING = "Pending curation — see CREDITS.md";

function main() {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as Catalog;
  const existing = new Set<string>(
    catalog.plates.map((p) => `${p.category_id}::${p.style_id}`),
  );

  const added: Plate[] = [];
  for (const field of catalog.fields) {
    for (const category of field.categories) {
      for (const style of category.styles) {
        if (existing.has(`${category.id}::${style}`)) continue;
        const meta = STYLE_META[style];
        if (!meta) {
          console.warn(`[gen] no deep metadata for style "${style}" (${category.id}) — skipping`);
          continue;
        }
        const id = `plate_${slugify(category.id)}_${style}`.replace(PLATE_ID_RE, "plate_");
        added.push({
          id,
          style_id: style,
          category_id: category.id,
          image_url: null,
          credit_line: CREDIT_PENDING,
          source_url: null,
          license_note: "to-curate",
          alt_text: meta.alt,
          axis_loadings: meta.axes,
          tags: ["rank-eligible"],
          status: "pending",
        });
      }
    }
  }

  const plates = [...catalog.plates, ...added].sort((a, b) => a.id.localeCompare(b.id));

  // Keep existing meta, reflect real numbers; never downgrade plates_approved.
  const approved = plates.filter((p) => p.status === "approved").length;
  catalog._meta.plates_approved = approved;
  catalog._meta.plates_pending = plates.length - approved;
  catalog._meta.plates_count = plates.length;
  catalog._meta.version = "v1.1.0";
  catalog.plates = plates as never;

  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(
    `[gen] ${added.length} slots added for ${plates.length} total (${approved} approved, ${plates.length - approved} pending).`,
  );
  console.log(`[gen] wrote ${catalogPath}`);
}

main();