import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { GetProfileParams, GetProfileResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profiles/:id", async (req, res): Promise<void> => {
  const p = GetProfileParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(profilesTable).where(eq(profilesTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(GetProfileResponse.parse(row));
});

export default router;
