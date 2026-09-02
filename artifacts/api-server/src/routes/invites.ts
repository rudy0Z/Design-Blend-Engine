/**
 * Blend invites (docs/FINAL-PLAN.md §7 Phase 3).
 * POST /api/blends/invite      — create a 7-day token for the caller's profile (auth required)
 * GET  /api/blends/invite/:token — resolve an invite (public; expiry enforced)
 */
import { Router, type IRouter, type Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, blendInvitesTable, profilesTable } from "@workspace/db";
import {
  CreateBlendInviteResponse,
  GetBlendInviteParams,
  GetBlendInviteResponse,
} from "@workspace/api-zod";
import { makeId } from "../lib/ids";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

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
      res.status(404).json({ error: "No profile yet — build one first." });
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

export default router;