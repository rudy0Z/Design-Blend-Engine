import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { platesTable } from "@workspace/db/schema";
import { MODEL_VERSION } from "@workspace/taste-engine";

const router: IRouter = Router();

/**
 * Locate catalog/v1.json by walking up from cwd (robust for dev and bundled runs).
 * The taxonomy (fields/categories/styles) is versioned source data; plates with
 * credit/status live in Postgres (seeded via `pnpm --filter @workspace/db seed`).
 */
function findCatalogFile(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, "catalog", "v1.json");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("catalog/v1.json not found relative to process.cwd()");
}

type CatalogField = {
  id: string;
  label: string;
  categories: Array<{ id: string; label: string; description: string; styles: string[] }>;
};

let cachedCatalog: { version: string; fields: CatalogField[] } | null = null;

function loadCatalog(): { version: string; fields: CatalogField[] } {
  if (cachedCatalog) return cachedCatalog;
  const raw = JSON.parse(readFileSync(findCatalogFile(), "utf8")) as {
    _meta: { version: string };
    fields: Array<{ id: string; label: string; categories: CatalogField["categories"] }>;
  };
  cachedCatalog = { version: raw._meta.version, fields: raw.fields };
  return cachedCatalog;
}

/** GET /api/catalog — the image-led plate catalog for capture flows. */
router.get("/catalog", async (_req, res: Response): Promise<void> => {
  const catalog = loadCatalog();
  const rows = await db.select().from(platesTable);
  res.json({
    modelVersion: MODEL_VERSION,
    catalogVersion: catalog.version,
    fields: catalog.fields,
    plates: rows,
  });
});

export default router;
