import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { GetProfileByUsernameParams, GetProfileByUsernameResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/profiles/:username", async (req, res): Promise<void> => {
  const p = GetProfileByUsernameParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, p.data.username));
  if (!row) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(GetProfileByUsernameResponse.parse(row));
});

export default router;
