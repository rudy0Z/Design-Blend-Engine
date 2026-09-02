import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { profileVersionsTable, profilesTable } from "@workspace/db/schema";
import {
  GetProfileByUsernameParams,
  GetProfileByUsernameResponse,
  UpdateProfilePrivacyBody,
  UpdateProfilePrivacyParams,
  UpdateProfilePrivacyResponse,
} from "@workspace/api-zod";
import { getDb, type Env } from "../db";
import { getRequestUserId } from "../auth";

export const profileRoutes = new Hono<{ Bindings: Env }>();

/** GET /profiles/me — the signed-in user's profile (null when none). */
profileRoutes.get("/profiles/me", async (c) => {
  const userId = await getRequestUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const [row] = await getDb(c.env)
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  if (!row) {
    return c.json(null);
  }
  return c.json(GetProfileByUsernameResponse.parse(row));
});

/** GET /profiles/:username — public profile, or the owner's own private one. */
profileRoutes.get("/profiles/:username", async (c) => {
  const parsed = GetProfileByUsernameParams.safeParse(c.req.param());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }
  const [profile] = await getDb(c.env)
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, parsed.data.username))
    .limit(1);
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  if (!profile.isPublic) {
    const requesterId = await getRequestUserId(c);
    if (!requesterId || requesterId !== profile.userId) {
      return c.json({ error: "Profile not found" }, 404);
    }
  }
  return c.json(profile);
});

/** PATCH /profiles/:username/privacy — owner-only visibility toggle. */
profileRoutes.patch("/profiles/:username/privacy", async (c) => {
  const userId = await getRequestUserId(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const parsed = UpdateProfilePrivacyParams.safeParse(c.req.param());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }
  const body = UpdateProfilePrivacyBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: body.error.message }, 400);
  }
  const [updated] = await getDb(c.env)
    .update(profilesTable)
    .set({ isPublic: body.data.isPublic })
    .where(
      and(
        eq(profilesTable.username, parsed.data.username),
        eq(profilesTable.userId, userId),
      ),
    )
    .returning();
  if (!updated) {
    return c.json({ error: "Forbidden" }, 403);
  }
  return c.json(UpdateProfilePrivacyResponse.parse(updated));
});

/** GET /profiles/:username/versions — version history (drift diff input, §6). */
profileRoutes.get("/profiles/:username/versions", async (c) => {
  const parsed = GetProfileByUsernameParams.safeParse(c.req.param());
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }
  const db = getDb(c.env);
  const [profile] = await db
    .select({
      id: profilesTable.id,
      isPublic: profilesTable.isPublic,
      userId: profilesTable.userId,
    })
    .from(profilesTable)
    .where(eq(profilesTable.username, parsed.data.username))
    .limit(1);
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  if (!profile.isPublic) {
    const requesterId = await getRequestUserId(c);
    if (!requesterId || requesterId !== profile.userId) {
      return c.json({ error: "Profile not found" }, 404);
    }
  }
  const versions = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.profileId, profile.id))
    .orderBy(desc(profileVersionsTable.version));
  return c.json({ versions });
});