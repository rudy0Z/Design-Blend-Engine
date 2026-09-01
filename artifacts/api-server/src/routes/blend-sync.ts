import { Router, type IRouter, type Response } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db,
  plateResponsesTable,
  platesTable,
  profileVersionsTable,
  profilesTable,
} from "@workspace/db";
import {
  computeBlend,
  type PlateRef,
  type ProfileVersionData,
  type Signal,
} from "@workspace/taste-engine";
import { getUserIdOrNull } from "../middlewares/requireAuth";

const router: IRouter = Router();

/**
 * GET /api/blends/:userA/:userB/sync — the synchronous blend (docs/FINAL-PLAN.md §5).
 * Exact weighted cosine on overlapping high-confidence axes + proof plates from
 * what both people ACTUALLY rated. Computed and returned in one request; no
 * background enrichment, no AI in the score path.
 */
router.get("/blends/:userA/:userB/sync", async (req, res: Response): Promise<void> => {
  const userA = String(req.params.userA ?? "").toLowerCase();
  const userB = String(req.params.userB ?? "").toLowerCase();
  if (!userA || !userB) {
    res.status(400).json({ error: "Two usernames are required." });
    return;
  }

  const profiles = await db
    .select()
    .from(profilesTable)
    .where(sql`${profilesTable.username} in (${userA}, ${userB})`);
  const profA = profiles.find((x) => x.username === userA);
  const profB = profiles.find((x) => x.username === userB);
  if (!profA || !profB) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  // Visibility: private profiles participate only for their owner.
  const requesterId = getUserIdOrNull(req);
  for (const prof of [profA, profB]) {
    if (!prof.isPublic && requesterId !== prof.userId) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
  }

  // Both sides need a current engine-built profile version.
  if (!profA.currentVersionId || !profB.currentVersionId) {
    res.status(409).json({
      error:
        "One of these profiles predates the current engine. Update taste to blend.",
    });
    return;
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
    res.status(409).json({ error: "Profile version missing." });
    return;
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

  const toSignals = (rows: Awaited<ReturnType<typeof loadSignals>>): Signal[] =>
    rows.map((s) => ({
      plateId: s.plateId,
      mode: s.mode as Signal["mode"],
      value: s.value,
      sequence: s.sequence,
    }));

  async function loadSignals(ownerId: string | null) {
    if (!ownerId) return [];
    return db
      .select()
      .from(plateResponsesTable)
      .where(eq(plateResponsesTable.userId, ownerId));
  }

  const signalsA = toSignals(await loadSignals(profA.userId));
  const signalsB = toSignals(await loadSignals(profB.userId));

  const toProfileData = (v: typeof versionA): ProfileVersionData =>
    ({
      axes: v.axes,
      axisCoverage: v.axisCoverage,
      modelVersion: v.modelVersion,
    }) as ProfileVersionData;

  const blend = computeBlend(
    toProfileData(versionA),
    toProfileData(versionB),
    signalsA,
    signalsB,
    plateRefs,
  );

  res.json({
    userA,
    userB,
    versionA: versionA.version,
    versionB: versionB.version,
    blend,
  });
});

export default router;
