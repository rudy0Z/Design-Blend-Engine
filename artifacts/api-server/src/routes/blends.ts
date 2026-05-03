import { Router, type IRouter } from "express";
import { and, eq, inArray, or } from "drizzle-orm";
import { db, profilesTable, blendsTable, styleNodesTable, type Profile } from "@workspace/db";
import {
  GetBlendByUsersParams,
  GetBlendByUsersResponse,
} from "@workspace/api-zod";
import { makeId } from "../lib/ids";
import { AXIS_KEYS, cosineSimilarityAxes } from "../lib/scoring";

const router: IRouter = Router();

router.get("/blends/:userA/:userB", async (req, res): Promise<void> => {
  const p = GetBlendByUsersParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const profiles = await db
    .select()
    .from(profilesTable)
    .where(inArray(profilesTable.username, [p.data.userA, p.data.userB]));
  const a = profiles.find((x) => x.username === p.data.userA);
  const b = profiles.find((x) => x.username === p.data.userB);
  if (!a || !b) { res.status(404).json({ error: "Profile not found" }); return; }

  // Look up an existing blend in either order
  const [existing] = await db
    .select()
    .from(blendsTable)
    .where(or(
      and(eq(blendsTable.profileAId, a.id), eq(blendsTable.profileBId, b.id)),
      and(eq(blendsTable.profileAId, b.id), eq(blendsTable.profileBId, a.id)),
    ));
  if (existing) {
    res.json(GetBlendByUsersResponse.parse(existing));
    return;
  }

  const blend = await computeBlend(a, b);
  const [row] = await db.insert(blendsTable).values(blend).returning();
  res.json(GetBlendByUsersResponse.parse(row));
});

async function computeBlend(a: Profile, b: Profile) {
  const similarity = cosineSimilarityAxes(a.axes, b.axes);
  const axisDeltas: Record<string, number> = {};
  for (const k of AXIS_KEYS) axisDeltas[k] = a.axes[k] - b.axes[k];

  const sharedIds = a.topStyles.filter((id) => b.topStyles.includes(id));
  const sharedNodeRows = sharedIds.length > 0
    ? await db.select().from(styleNodesTable).where(inArray(styleNodesTable.id, sharedIds))
    : [];
  const sharedStyles = sharedNodeRows.map((n) => ({
    nodeId: n.id,
    label: n.label,
    scoreA: a.styleVector[n.id] ?? 0,
    scoreB: b.styleVector[n.id] ?? 0,
  }));

  const divergentIds = [
    ...a.topStyles.filter((id) => !b.topStyles.includes(id)).slice(0, 2),
    ...b.topStyles.filter((id) => !a.topStyles.includes(id)).slice(0, 2),
  ];
  const divergentNodeRows = divergentIds.length > 0
    ? await db.select().from(styleNodesTable).where(inArray(styleNodesTable.id, divergentIds))
    : [];
  const divergentStyles = divergentNodeRows.map((n) => ({
    nodeId: n.id,
    label: n.label,
    scoreA: a.styleVector[n.id] ?? 0,
    scoreB: b.styleVector[n.id] ?? 0,
  }));

  const pct = Math.round(((similarity + 1) / 2) * 100);
  const collaborationLine = `${a.archetypeTitle} × ${b.archetypeTitle}: a ${pct}% blend that would ship together.`;

  return {
    id: makeId("bl"),
    profileAId: a.id,
    profileBId: b.id,
    usernameA: a.username,
    usernameB: b.username,
    similarity,
    axisDeltas,
    sharedStyles,
    divergentStyles,
    collaborationLine,
  };
}

export default router;
