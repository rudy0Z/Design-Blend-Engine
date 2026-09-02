/**
 * Profile read/privacy routes backed by the versioned engine
 * (docs/FINAL-PLAN.md §1, §6). The legacy quiz-session save path is gone:
 * profiles are created by POST /api/capture/sessions/:id/complete.
 */
import { Router, type IRouter, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, profileVersionsTable, profilesTable } from "@workspace/db";
import {
  GetProfileByUsernameParams,
  GetProfileByUsernameResponse,
  UpdateProfilePrivacyBody,
  UpdateProfilePrivacyParams,
  UpdateProfilePrivacyResponse,
} from "@workspace/api-zod";
import { requireAuth, getUserIdOrNull, type AuthedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

/** GET /api/profiles/me — the signed-in user's profile (null when none). */
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

/** GET /api/profiles/:username — public profile, or the owner's own private one. */
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

/** PATCH /api/profiles/:username/privacy — owner-only visibility toggle. */
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

/** GET /api/profiles/:username/versions — version history (drift diff input, §6). */
router.get("/profiles/:username/versions", async (req, res): Promise<void> => {
  const p = GetProfileByUsernameParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }
  const [profile] = await db
    .select({
      id: profilesTable.id,
      isPublic: profilesTable.isPublic,
      userId: profilesTable.userId,
    })
    .from(profilesTable)
    .where(eq(profilesTable.username, p.data.username))
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  if (!profile.isPublic) {
    const requesterId = getUserIdOrNull(req);
    if (!requesterId || requesterId !== profile.userId) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
  }
  const versions = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.profileId, profile.id))
    .orderBy(desc(profileVersionsTable.version));
  res.json({ versions });
});

export default router;