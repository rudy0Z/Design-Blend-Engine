import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import {
  plateResponsesTable,
  platesTable,
  profileVersionsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  computeBlend,
  type PlateRef,
  type ProfileVersionData,
  type Signal,
} from "@workspace/taste-engine";
import { getDb, type Env } from "../db";
import { getRequestUserId } from "../auth";

export const blendRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /blends/:userA/:userB/sync — synchronous blend (docs/FINAL-PLAN.md §5).
 * Weighted cosine on overlapping high-confidence axes + proof plates from what
 * both people actually rated. One request, no AI, no background work.
 */
blendRoutes.get("/blends/:userA/:userB/sync", async (c) => {
  const userA = c.req.param("userA").toLowerCase();
  const userB = c.req.param("userB").toLowerCase();
  const db = getDb(c.env);

  const profiles = await db
    .select()
    .from(profilesTable)
    .where(sql`${profilesTable.username} in (${userA}, ${userB})`);
  const profA = profiles.find((x) => x.username === userA);
  const profB = profiles.find((x) => x.username === userB);
  if (!profA || !profB) {
    return c.json({ error: "Profile not found" }, 404);
  }
  // Visibility: private profiles participate only for their owner (parity with
  // the Express server — a private profile is never 404'd for its own owner).
  const requesterId = await getRequestUserId(c);
  for (const prof of [profA, profB]) {
    if (!prof.isPublic && requesterId !== prof.userId) {
      return c.json({ error: "Profile not found" }, 404);
    }
  }
  if (!profA.currentVersionId || !profB.currentVersionId) {
    return c.json(
      { error: "One of these profiles predates the current engine. Update taste to blend." },
      409,
    );
  }

  const [versionA] = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.id, profA.currentVersionId))
    .limit(1);
  const [versionB] = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.id, profB.currentVersionId))
    .limit(1);
  if (!versionA || !versionB) {
    return c.json({ error: "Profile version missing." }, 409);
  }

  const plateRows = await db
    .select()
    .from(platesTable)
    .where(sql`${platesTable.status} <> 'retired'`);
  const plateRefs: PlateRef[] = plateRows.map((p) => ({
    id: p.id,
    styleId: p.styleId,
    categoryId: p.categoryId,
    fieldId: p.fieldId,
    label: p.label,
    imageUrl: p.imageUrl,
    axisLoadings: p.axisLoadings,
  }));

  async function loadSignals(userId: string | null): Promise<Signal[]> {
    if (!userId) return [];
    const rows = await db
      .select()
      .from(plateResponsesTable)
      .where(eq(plateResponsesTable.userId, userId));
    return rows.map((s) => ({
      plateId: s.plateId,
      mode: s.mode as Signal["mode"],
      value: s.value,
      sequence: s.sequence,
    }));
  }

  const toProfileData = (v: typeof versionA): ProfileVersionData =>
    ({ axes: v.axes, axisCoverage: v.axisCoverage, modelVersion: v.modelVersion }) as ProfileVersionData;

  const blend = computeBlend(
    toProfileData(versionA),
    toProfileData(versionB),
    await loadSignals(profA.userId),
    await loadSignals(profB.userId),
    plateRefs,
  );

  return c.json({ userA, userB, versionA: versionA.version, versionB: versionB.version, blend });
});