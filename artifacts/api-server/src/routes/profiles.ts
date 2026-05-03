import { Router, type IRouter, type Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  profilesTable,
  quizSessionsTable,
  styleNodesTable,
  type StyleNode,
} from "@workspace/db";
import {
  GetProfileByUsernameParams,
  GetProfileByUsernameResponse,
  SaveProfileBody,
  SaveProfileResponse,
  UpdateProfilePrivacyParams,
  UpdateProfilePrivacyBody,
  UpdateProfilePrivacyResponse,
} from "@workspace/api-zod";
import { makeId } from "../lib/ids";
import {
  scoreAxes,
  pickArchetype,
  styleVectorFromAxes,
  getFieldDistribution,
} from "../lib/scoring";
import {
  requireAuth,
  getUserIdOrNull,
  type AuthedRequest,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

router.get("/profiles/me", requireAuth, async (req: AuthedRequest, res: Response): Promise<void> => {
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, req.userId!))
    .limit(1);
  if (!row) {
    res.json(null);
    return;
  }
  res.json(GetProfileByUsernameResponse.parse(row));
});

router.get("/profiles/:username", async (req, res): Promise<void> => {
  const p = GetProfileByUsernameParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, p.data.username));
  if (!row) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  if (!row.isPublic) {
    const requesterId = getUserIdOrNull(req);
    if (!requesterId || requesterId !== row.userId) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
  }
  res.json(GetProfileByUsernameResponse.parse(row));
});

router.post("/profiles", requireAuth, async (req: AuthedRequest, res: Response): Promise<void> => {
  const body = SaveProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const username = body.data.username.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    res.status(400).json({
      error:
        "Username must be 2-31 chars, lowercase letters/digits/dashes, and start with a letter or digit.",
    });
    return;
  }

  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.id, body.data.sessionId));
  if (!session) {
    res.status(404).json({ error: "Quiz session not found" });
    return;
  }
  // The session must either belong to this user, or be unclaimed (no userId yet).
  if (session.userId && session.userId !== req.userId) {
    res.status(403).json({ error: "Session belongs to another user" });
    return;
  }

  // If username is taken by another userId, reject.
  const [existingByName] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, username));
  if (existingByName && existingByName.userId && existingByName.userId !== req.userId) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const allNodes = (await db.select().from(styleNodesTable)) as StyleNode[];
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const axes = scoreAxes(session.ratings, byId);
  const arch = pickArchetype(axes);
  const styleVector = styleVectorFromAxes(axes, allNodes);
  const topStyles = Object.entries(styleVector)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);
  const fieldDistribution = getFieldDistribution(session.ratings, byId);

  // If the user already has a profile, update in place (and rename if desired).
  const [mine] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, req.userId!))
    .limit(1);

  let saved;
  if (mine) {
    [saved] = await db
      .update(profilesTable)
      .set({
        username,
        displayName: body.data.displayName ?? mine.displayName ?? null,
        archetypeId: arch.id,
        archetypeTitle: arch.title,
        archetypeDescription: arch.description,
        archetypeColor: arch.color,
        axes,
        styleVector,
        topStyles,
        fieldDistribution,
        confidence: arch.confidence,
      })
      .where(eq(profilesTable.id, mine.id))
      .returning();
  } else {
    // If existingByName exists with no userId (anonymous), claim it by attaching userId.
    const profileId = existingByName ? existingByName.id : makeId("p");
    [saved] = await db
      .insert(profilesTable)
      .values({
        id: profileId,
        userId: req.userId,
        username,
        displayName: body.data.displayName ?? null,
        archetypeId: arch.id,
        archetypeTitle: arch.title,
        archetypeDescription: arch.description,
        archetypeColor: arch.color,
        axes,
        styleVector,
        topStyles,
        fieldDistribution,
        confidence: arch.confidence,
        isPublic: true,
      })
      .onConflictDoUpdate({
        target: profilesTable.id,
        set: {
          userId: req.userId,
          username,
          displayName: body.data.displayName ?? null,
          archetypeId: arch.id,
          archetypeTitle: arch.title,
          archetypeDescription: arch.description,
          archetypeColor: arch.color,
          axes,
          styleVector,
          topStyles,
          fieldDistribution,
          confidence: arch.confidence,
        },
      })
      .returning();
  }

  await db
    .update(quizSessionsTable)
    .set({ status: "completed", profileId: saved.id, userId: req.userId })
    .where(eq(quizSessionsTable.id, session.id));

  res.json(SaveProfileResponse.parse(saved));
});

router.patch(
  "/profiles/:username/privacy",
  requireAuth,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const p = UpdateProfilePrivacyParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json({ error: p.error.message });
      return;
    }
    const body = UpdateProfilePrivacyBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [updated] = await db
      .update(profilesTable)
      .set({ isPublic: body.data.isPublic })
      .where(
        and(
          eq(profilesTable.username, p.data.username),
          eq(profilesTable.userId, req.userId!),
        ),
      )
      .returning();
    if (!updated) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(UpdateProfilePrivacyResponse.parse(updated));
  },
);

export default router;
