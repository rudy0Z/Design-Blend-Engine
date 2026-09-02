import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { profileVersionsTable, profilesTable } from "@workspace/db/schema";
import { getDb, type Env } from "../db";

export const profileRoutes = new Hono<{ Bindings: Env }>();

/** GET /profiles/:username — public profile for share links. */
profileRoutes.get("/profiles/:username", async (c) => {
  const username = c.req.param("username").toLowerCase();
  const [profile] = await getDb(c.env)
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, username))
    .limit(1);
  if (!profile || !profile.isPublic) {
    return c.json({ error: "Profile not found" }, 404);
  }
  return c.json(profile);
});

/** GET /profiles/:username/versions — version history (drift diff input). */
profileRoutes.get("/profiles/:username/versions", async (c) => {
  const username = c.req.param("username").toLowerCase();
  const db = getDb(c.env);
  const [profile] = await db
    .select({ id: profilesTable.id, isPublic: profilesTable.isPublic })
    .from(profilesTable)
    .where(eq(profilesTable.username, username))
    .limit(1);
  if (!profile || !profile.isPublic) {
    return c.json({ error: "Profile not found" }, 404);
  }
  const versions = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.profileId, profile.id))
    .orderBy(desc(profileVersionsTable.version));
  return c.json({ versions });
});