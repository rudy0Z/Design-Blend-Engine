/**
 * Blend invites (docs/FINAL-PLAN.md §7 Phase 3) — Workers port.
 * POST /api/blends/invite      — 7-day token for the caller's profile (auth)
 * GET  /api/blends/invite/:token — resolve an invite (public, expiry enforced)
 */
import { Hono } from "hono";
import { and, eq, gt } from "drizzle-orm";
import { blendInvitesTable, profilesTable } from "@workspace/db/schema";
import {
  CreateBlendInviteResponse,
  GetBlendInviteParams,
  GetBlendInviteResponse,
} from "@workspace/api-zod";
import { getDb, type Env } from "../db";
import { makeId } from "../ids";
import { getRequestUserId } from "../auth";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** Web-Crypto-safe invite token (Workers has no node:crypto). */
function makeInviteToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const inviteRoutes = new Hono<{ Bindings: Env }>();

inviteRoutes.post("/blends/invite", async (c) => {
  const userId = await getRequestUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = getDb(c.env);
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  if (!profile) {
    return c.json({ error: "No profile yet — build one first." }, 404);
  }
  const [row] = await db
    .insert(blendInvitesTable)
    .values({
      id: makeId("bi"),
      token: makeInviteToken(),
      profileId: profile.id,
      username: profile.username,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning();
  return c.json(CreateBlendInviteResponse.parse(row));
});

inviteRoutes.get("/blends/invite/:token", async (c) => {
  const parsed = GetBlendInviteParams.safeParse(c.req.param());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }
  const [row] = await getDb(c.env)
    .select()
    .from(blendInvitesTable)
    .where(
      and(
        eq(blendInvitesTable.token, parsed.data.token),
        gt(blendInvitesTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) {
    return c.json({ error: "Invite not found or expired" }, 404);
  }
  return c.json(GetBlendInviteResponse.parse(row));
});