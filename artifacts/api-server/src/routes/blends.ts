import { Router, type IRouter, type Response } from "express";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import {
  db,
  profilesTable,
  blendsTable,
  blendInvitesTable,
  styleNodesTable,
  type Profile,
} from "@workspace/db";
import {
  GetBlendByUsersParams,
  GetBlendByUsersResponse,
  CreateBlendInviteResponse,
  GetBlendInviteParams,
  GetBlendInviteResponse,
} from "@workspace/api-zod";
import { randomBytes } from "node:crypto";
import { makeId } from "../lib/ids";
import { AXIS_KEYS, cosineSimilarityVector } from "../lib/scoring";
import {
  requireAuth,
  getUserIdOrNull,
  type AuthedRequest,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

router.post(
  "/blends/invite",
  requireAuth,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId!))
      .limit(1);
    if (!profile) {
      res.status(404).json({ error: "No profile yet — save one first." });
      return;
    }
    const token = randomBytes(12).toString("base64url");
    const [row] = await db
      .insert(blendInvitesTable)
      .values({
        id: makeId("bi"),
        token,
        profileId: profile.id,
        username: profile.username,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      })
      .returning();
    res.json(CreateBlendInviteResponse.parse(row));
  },
);

router.get("/blends/invite/:token", async (req, res): Promise<void> => {
  const p = GetBlendInviteParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(blendInvitesTable)
    .where(
      and(
        eq(blendInvitesTable.token, p.data.token),
        gt(blendInvitesTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Invite not found or expired" });
    return;
  }
  res.json(GetBlendInviteResponse.parse(row));
});

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

  // Visibility: a private profile may only participate in a blend if the requester is its owner.
  const requesterId = getUserIdOrNull(req);
  for (const prof of [a, b]) {
    if (!prof.isPublic && (!requesterId || requesterId !== prof.userId)) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
  }

  const [existing] = await db
    .select()
    .from(blendsTable)
    .where(or(
      and(eq(blendsTable.profileAId, a.id), eq(blendsTable.profileBId, b.id)),
      and(eq(blendsTable.profileAId, b.id), eq(blendsTable.profileBId, a.id)),
    ));

  // Cache freshness: recompute when either profile has been updated since cache.
  const newest = Math.max(a.updatedAt.getTime(), b.updatedAt.getTime());
  if (existing && existing.createdAt.getTime() >= newest) {
    res.json(GetBlendByUsersResponse.parse(existing));
    return;
  }

  const blend = await computeBlend(a, b);
  if (existing) {
    const [row] = await db
      .update(blendsTable)
      .set({
        similarity: blend.similarity,
        axisDeltas: blend.axisDeltas,
        sharedStyles: blend.sharedStyles,
        divergentStyles: blend.divergentStyles,
        collaborationLine: blend.collaborationLine,
        usernameA: blend.usernameA,
        usernameB: blend.usernameB,
        createdAt: new Date(),
      })
      .where(eq(blendsTable.id, existing.id))
      .returning();
    res.json(GetBlendByUsersResponse.parse(row));
    return;
  }
  const [row] = await db.insert(blendsTable).values(blend).returning();
  res.json(GetBlendByUsersResponse.parse(row));
});

async function computeBlend(a: Profile, b: Profile) {
  // PRD: cosine similarity on the full style_vector (every node prediction),
  // not just the 8 axes. Axis deltas remain useful for align/diverge analysis.
  const similarity = cosineSimilarityVector(a.styleVector, b.styleVector);
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
