import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, styleNodesTable } from "@workspace/db";
import {
  ListStylesQueryParams,
  ListStylesResponse,
  GetStyleParams,
  GetStyleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/styles", async (req, res): Promise<void> => {
  const q = ListStylesQueryParams.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: q.error.message });
    return;
  }
  const rows = q.data.field
    ? await db.select().from(styleNodesTable).where(eq(styleNodesTable.field, q.data.field))
    : await db.select().from(styleNodesTable);
  res.json(ListStylesResponse.parse(rows));
});

router.get("/styles/:id", async (req, res): Promise<void> => {
  const p = GetStyleParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }
  const [row] = await db.select().from(styleNodesTable).where(eq(styleNodesTable.id, p.data.id));
  if (!row) {
    res.status(404).json({ error: "Style not found" });
    return;
  }
  res.json(GetStyleResponse.parse(row));
});

export default router;
