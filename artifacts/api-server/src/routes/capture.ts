import { Router, type IRouter, type Response } from "express";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  plateResponsesTable,
  platesTable,
  profileVersionsTable,
  profilesTable,
  type Plate,
  type StoredTopPlate,
} from "@workspace/db";
import { computeProfileVersion, ARCHETYPES } from "@workspace/taste-engine";
import type { PlateRef, Signal } from "@workspace/taste-engine";
import { makeId } from "../lib/ids";
import { getUserIdOrNull } from "../middlewares/requireAuth";

const router: IRouter = Router();

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

const responseSchema = z.object({
  plateId: z.string().min(1),
  mode: z.enum(["pick", "rank", "rate"]),
  value: z.number().int().min(0).max(100),
  sequence: z.number().int().min(0),
});

const appendBodySchema = z.object({
  responses: z.array(responseSchema).min(1).max(200),
});

const completeBodySchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_RE, "Username must be 2-31 chars: lowercase letters, digits, dashes.")
    .optional(),
  displayName: z.string().trim().max(80).optional(),
});

/** POST /api/capture/sessions — sessions are stateless grouping keys. */
router.post("/capture/sessions", (_req, res: Response): void => {
  res.json({ sessionId: makeId("cap") });
});

/**
 * POST /api/capture/sessions/:sessionId/responses — append signals (batch).
 * Append-only: re-rates are new rows with a higher sequence. Skips are never sent.
 */
router.post(
  "/capture/sessions/:sessionId/responses",
  async (req, res: Response): Promise<void> => {
    const sessionId = String(req.params.sessionId ?? "");
    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }
    const body = appendBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const userId = getUserIdOrNull(req) ?? null;

    const plateIds = [...new Set(body.data.responses.map((r) => r.plateId))];
    const known = await db
      .select({ id: platesTable.id })
      .from(platesTable)
      .where(inArray(platesTable.id, plateIds));
    const knownIds = new Set(known.map((k) => k.id));
    const unknown = plateIds.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) {
      res.status(400).json({ error: `Unknown plate ids: ${unknown.join(", ")}` });
      return;
    }

    await db.insert(plateResponsesTable).values(
      body.data.responses.map((r) => ({
        id: makeId("resp"),
        userId,
        sessionId,
        plateId: r.plateId,
        mode: r.mode,
        value: r.value,
        sequence: r.sequence,
      })),
    );
    res.json({ inserted: body.data.responses.length });
  },
);

/** Average rate value per field/category — used for legacy profile columns. */
function aggregateScores(
  signals: Signal[],
  platesById: Map<string, Plate>,
): { fieldScores: Record<string, number>; categoryScores: Record<string, number> } {
  const fSum: Record<string, number> = {};
  const fCount: Record<string, number> = {};
  const cSum: Record<string, number> = {};
  const cCount: Record<string, number> = {};
  for (const s of signals) {
    const plate = platesById.get(s.plateId);
    if (!plate) continue;
    fSum[plate.fieldId] = (fSum[plate.fieldId] ?? 0) + s.value;
    fCount[plate.fieldId] = (fCount[plate.fieldId] ?? 0) + 1;
    cSum[plate.categoryId] = (cSum[plate.categoryId] ?? 0) + s.value;
    cCount[plate.categoryId] = (cCount[plate.categoryId] ?? 0) + 1;
  }
  const avg = (sums: Record<string, number>, counts: Record<string, number>) =>
    Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, Math.round(v / counts[k])]));
  return { fieldScores: avg(fSum, fCount), categoryScores: avg(cSum, cCount) };
}

/**
 * POST /api/capture/sessions/:sessionId/complete — compute + persist a new
 * immutable profile version from the user's signals (docs/FINAL-PLAN.md §6).
 * Authed users: all their signals. Anonymous demo: signals from this session.
 */
router.post(
  "/capture/sessions/:sessionId/complete",
  async (req, res: Response): Promise<void> => {
    const sessionId = String(req.params.sessionId ?? "");
    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }
    const body = completeBodySchema.safeParse(req.body ?? {});
    if (!body.success) {
      res.status(400).json({ error: body.error.issues[0]?.message ?? "Invalid body" });
      return;
    }
    const userId = getUserIdOrNull(req) ?? null;

    // Anonymous capture: a completed session carries a stable synthetic owner
    // (anon-<profileId>) so blends find signals by profile.userId. Recover it so
    // a re-complete from the same session owns the profile instead of 409'ing.
    const [sessionOwnerRow] = await db
      .select({ userId: plateResponsesTable.userId })
      .from(plateResponsesTable)
      .where(eq(plateResponsesTable.sessionId, sessionId))
      .limit(1);
    const sessionOwnerId = sessionOwnerRow?.userId ?? null;
    const ownerId = userId ?? sessionOwnerId ?? null;

    const signals = await db
      .select()
      .from(plateResponsesTable)
      .where(
        ownerId
          ? eq(plateResponsesTable.userId, ownerId)
          : eq(plateResponsesTable.sessionId, sessionId),
      );
    if (signals.length < 6) {
      res.status(400).json({ error: "Rate at least 6 plates before completing." });
      return;
    }

    const plateRows = await db
      .select()
      .from(platesTable)
      .where(sql`${platesTable.status} <> 'retired'`);
    if (plateRows.length === 0) {
      res.status(500).json({ error: "Catalog is empty. Run: pnpm --filter @workspace/db seed" });
      return;
    }

    const engineSignals: Signal[] = signals.map((s) => ({
      plateId: s.plateId,
      mode: s.mode as Signal["mode"],
      value: s.value,
      sequence: s.sequence,
    }));
    const plateRefs: PlateRef[] = plateRows.map((p) => ({
      id: p.id,
      styleId: p.styleId,
      categoryId: p.categoryId,
      fieldId: p.fieldId,
      label: p.label,
      imageUrl: p.imageUrl,
      axisLoadings: p.axisLoadings,
    }));

    const versionData = computeProfileVersion(engineSignals, plateRefs);

    // Resolve username: body > derived from Clerk user > reject.
    let username = body.data.username;
    if (!username && userId) {
      username = `user-${userId.slice(-8).toLowerCase().replace(/[^a-z0-9-]/g, "")}`;
    }
    if (!username) {
      res.status(400).json({ error: "username required for anonymous capture" });
      return;
    }

    // Find or create the durable profile row.
    const [existing] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.username, username))
      .limit(1);
    if (existing && existing.userId && existing.userId !== ownerId) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
    const profileId = existing?.id ?? makeId("p");

    // Fresh anonymous session: assign this profile's stable synthetic owner and
    // stamp the unowned session signals so blends can find them by userId.
    const finalOwnerId = ownerId ?? `anon-${profileId}`;
    if (!ownerId) {
      await db
        .update(plateResponsesTable)
        .set({ userId: finalOwnerId })
        .where(
          and(
            eq(plateResponsesTable.sessionId, sessionId),
            isNull(plateResponsesTable.userId),
          ),
        );
    }

    const versionRows = await db
      .select({ max: sql<number>`coalesce(max(${profileVersionsTable.version}), 0)` })
      .from(profileVersionsTable)
      .where(eq(profileVersionsTable.profileId, profileId));
    const nextVersion = Number(versionRows[0]?.max ?? 0) + 1;
    const versionId = makeId("pv");

    await db.insert(profileVersionsTable).values({
      id: versionId,
      profileId,
      userId: finalOwnerId,
      version: nextVersion,
      axes: versionData.axes,
      axisCoverage: versionData.axisCoverage,
      styleVector: versionData.styleVector,
      topPlates: versionData.topPlates.map(
        (t): StoredTopPlate => ({
          plateId: t.plateId,
          styleId: t.styleId,
          label: t.label,
          imageUrl: t.imageUrl,
          value: t.value,
          mode: t.mode,
        }),
      ),
      archetypeId: versionData.archetype.id,
      archetypeTitle: versionData.archetype.title,
      archetypeConfidence: versionData.archetype.confidence,
      modelVersion: versionData.modelVersion,
      catalogVersion: plateRows[0]?.catalogVersion ?? "unknown",
      // Completing a capture pass is an explicit act — publish immediately.
      isPublished: true,
    });

    const archetype = ARCHETYPES.find((a) => a.id === versionData.archetype.id);
    const topStyles = [...new Set(versionData.topPlates.map((t) => t.styleId))].slice(0, 5);
    const platesById = new Map(plateRows.map((p) => [p.id, p]));
    const { fieldScores, categoryScores } = aggregateScores(engineSignals, platesById);
    const selectedFields = [...new Set(plateRefs.map((p) => p.fieldId))];

    const profileValues = {
      id: profileId,
      userId: finalOwnerId,
      username,
      displayName: body.data.displayName ?? existing?.displayName ?? null,
      archetypeId: versionData.archetype.id,
      archetypeTitle: versionData.archetype.title,
      archetypeDescription: archetype?.description ?? "",
      archetypeColor: archetype?.color ?? "#1a1a2e",
      axes: versionData.axes,
      styleVector: versionData.styleVector,
      topStyles,
      fieldScores,
      categoryScores,
      fieldDistribution: {},
      selectedFields,
      confidence: versionData.archetype.confidence,
      isPublic: existing?.isPublic ?? true,
      currentVersionId: versionId,
    };

    const [saved] = await db
      .insert(profilesTable)
      .values(profileValues)
      .onConflictDoUpdate({ target: profilesTable.id, set: profileValues })
      .returning();

    res.json({
      profileId: saved.id,
      username: saved.username,
      version: nextVersion,
      versionId,
      topPlates: versionData.topPlates,
      archetype: versionData.archetype,
      axes: versionData.axes,
      axisCoverage: versionData.axisCoverage,
      overallCoverage: versionData.overallCoverage,
    });
  },
);

/** GET /api/profiles/:username/versions — version history (drift diff input, §6). */
router.get("/profiles/:username/versions", async (req, res: Response): Promise<void> => {
  const username = String(req.params.username ?? "");
  const [profile] = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(eq(profilesTable.username, username))
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  const versions = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.profileId, profile.id))
    .orderBy(desc(profileVersionsTable.version));
  res.json({ versions });
});

export default router;
