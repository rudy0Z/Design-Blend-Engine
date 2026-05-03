import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, profilesTable, blendsTable, styleNodesTable } from "@workspace/db";
import {
  CreateBlendBody,
  GetBlendParams,
  GetBlendResponse,
} from "@workspace/api-zod";
import { makeId } from "../lib/ids";
import { AXIS_KEYS, cosineSimilarityAxes } from "../lib/scoring";

const router: IRouter = Router();

router.post("/blends", async (req, res): Promise<void> => {
  const body = CreateBlendBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const profiles = await db
    .select()
    .from(profilesTable)
    .where(inArray(profilesTable.id, [body.data.profileAId, body.data.profileBId]));
  const a = profiles.find((p) => p.id === body.data.profileAId);
  const b = profiles.find((p) => p.id === body.data.profileBId);
  if (!a || !b) { res.status(404).json({ error: "Profile not found" }); return; }

  const similarity = cosineSimilarityAxes(a.axes, b.axes);
  const axisDeltas: Record<string, number> = {};
  for (const k of AXIS_KEYS) axisDeltas[k] = a.axes[k] - b.axes[k];

  const sharedIds = a.topStyles.filter((id) => b.topStyles.includes(id));
  const sharedNodeRows = sharedIds.length > 0
    ? await db.select().from(styleNodesTable).where(inArray(styleNodesTable.id, sharedIds))
    : [];
  const sharedStyles = sharedNodeRows.map((n) => ({
    nodeId: n.id,
    name: n.name,
    scoreA: a.styleVector[n.id] ?? 0,
    scoreB: b.styleVector[n.id] ?? 0,
  }));

  // Divergent: top of A not in B and vice versa
  const divergentIds = [
    ...a.topStyles.filter((id) => !b.topStyles.includes(id)).slice(0, 2),
    ...b.topStyles.filter((id) => !a.topStyles.includes(id)).slice(0, 2),
  ];
  const divergentNodeRows = divergentIds.length > 0
    ? await db.select().from(styleNodesTable).where(inArray(styleNodesTable.id, divergentIds))
    : [];
  const divergentStyles = divergentNodeRows.map((n) => ({
    nodeId: n.id,
    name: n.name,
    scoreA: a.styleVector[n.id] ?? 0,
    scoreB: b.styleVector[n.id] ?? 0,
  }));

  // Placeholder collab line — Task #4 will replace with Gemini.
  const pct = Math.round(((similarity + 1) / 2) * 100);
  const collaborationLine = `${a.archetypeTitle} × ${b.archetypeTitle}: a ${pct}% blend that would ship together.`;

  const id = makeId("bl");
  const [row] = await db.insert(blendsTable).values({
    id,
    profileAId: a.id,
    profileBId: b.id,
    similarity,
    axisDeltas,
    sharedStyles,
    divergentStyles,
    collaborationLine,
  }).returning();

  res.status(201).json(GetBlendResponse.parse(row));
});

router.get("/blends/:id", async (req, res): Promise<void> => {
  const p = GetBlendParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(blendsTable).where(eq(blendsTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Blend not found" }); return; }
  res.json(GetBlendResponse.parse(row));
});

export default router;
