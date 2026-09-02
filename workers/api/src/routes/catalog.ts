import { Hono } from "hono";
import { platesTable } from "@workspace/db/schema";
import { MODEL_VERSION } from "@workspace/taste-engine";
import { getDb, type Env } from "../db";
import { loadCatalog } from "../catalog-data";

export const catalogRoutes = new Hono<{ Bindings: Env }>();

/** GET /catalog — the image-led plate catalog for capture flows. */
catalogRoutes.get("/catalog", async (c) => {
  const catalog = loadCatalog();
  const plates = await getDb(c.env).select().from(platesTable);
  return c.json({
    modelVersion: MODEL_VERSION,
    catalogVersion: catalog.version,
    fields: catalog.fields,
    plates,
  });
});