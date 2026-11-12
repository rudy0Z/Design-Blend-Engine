import { Hono } from "hono";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  plateResponsesTable,
  platesTable,
  profileVersionsTable,
  profilesTable,
  type Plate,
  type StoredTopPlate,
} from "@workspace/db/schema";
import { computeProfileVersion, ARCHETYPES } from "@workspace/taste-engine";
import type { PlateRef, Signal } from "@workspace/taste-engine";
import { getDb, type Env } from "../db";
import { makeId } from "../ids";

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

type ResponseIn = { plateId: string; mode: string; value: number; sequence: number };

function parseResponses(body: unknown): ResponseIn[] | null {
  if (!body || typeof body !== "object") return null;
  const responses = (body as { responses?: unknown }).responses;
  if (!Array.isArray(responses) || responses.length < 1 || responses.length > 200) return null;
  for (const r of responses) {
    if (!r || typeof r !== "object") return null;
    const o = r as ResponseIn;
    if (typeof o.plateId !== "string" || !o.plateId) return null;
    if (!["pick", "rank", "rate", "pair"].includes(o.mode)) return null;
    if (!Number.isInteger(o.value) || o.value < 0 || o.value > 100) return null;
    if (!Number.isInteger(o.sequence) || o.sequence < 0) return null;
  }
  return responses as ResponseIn[];
}

function parseCompleteBody(body: unknown): { username?: string; displayName?: string } {
  const clean: { username?: string; displayName?: string } = {};
  if (body && typeof body === "object") {
    const raw = body as { username?: unknown; displayName?: unknown };
    if (typeof raw.username === "string") {
      const u = raw.username.trim().toLowerCase();
      if (USERNAME_RE.test(u)) clean.username = u;
    }
    if (typeof raw.displayName === "string") {
      clean.displayName = raw.displayName.trim().slice(0, 80);
    }
  }
  return clean;
}

export const captureRoutes = new Hono<{ Bindings: Env }>();

/** POST /capture/sessions — stateless grouping key. */
captureRoutes.post("/capture/sessions", (c) => c.json({ sessionId: makeId("cap") }));

/** POST /capture/sessions/:sessionId/responses — append signals (append-only). */
captureRoutes.post("/capture/sessions/:sessionId/responses", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!sessionId) return c.json({ error: "sessionId required" }, 400);

  const body = await c.req.json().catch(() => null);
  const responses = parseResponses(body);
  if (!responses) {
    return c.json({ error: "responses must be an array of {plateId, mode, value, sequence}" }, 400);
  }

  const db = getDb(c.env);
  const plateIds = [...new Set(responses.map((r) => r.plateId))];
  const known = await db
    .select({ id: platesTable.id })
    .from(platesTable)
    .where(inArray(platesTable.id, plateIds));
  const knownIds = new Set(known.map((k) => k.id));
  const unknown = plateIds.filter((id) => !knownIds.has(id));
  if (unknown.length > 0) {
    return c.json({ error: `Unknown plate ids: ${unknown.join(", ")}` }, 400);
  }

  await db.insert(plateResponsesTable).values(
    responses.map((r) => ({
      id: makeId("resp"),
      sessionId: sessionId,
      plateId: r.plateId,
      mode: r.mode,
      value: r.value,
      sequence: r.sequence,
    })),
  );
  return c.json({ inserted: responses.length });
});

/** Average rate value per field/category — mirrors legacy profile columns. */
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
 * POST /capture/sessions/:sessionId/complete — compute + persist a new immutable
 * profile version (docs/FINAL-PLAN.md §6). Anonymous: session-bound synthetic owner.
 */
captureRoutes.post("/capture/sessions/:sessionId/complete", async (c) => {
  const sessionId = c.req.param("sessionId");
  const body = await c.req.json().catch(() => null);
  const { username: maybeUsername, displayName } = parseCompleteBody(body);

  const db = getDb(c.env);

  // Recover a previously-stamped anonymous owner so a re-complete from the same
  // session owns the profile instead of 409'ing (matches Express behavior).
  const [sessionOwnerRow] = await db
    .select({ userId: plateResponsesTable.userId })
    .from(plateResponsesTable)
    .where(eq(plateResponsesTable.sessionId, sessionId))
    .limit(1);
  const sessionOwnerId = sessionOwnerRow?.userId ?? null;

  const signals = await db
    .select()
    .from(plateResponsesTable)
    .where(
      sessionOwnerId
        ? eq(plateResponsesTable.userId, sessionOwnerId)
        : eq(plateResponsesTable.sessionId, sessionId),
    );
  if (signals.length < 6) {
    return c.json({ error: "Rate at least 6 plates before completing." }, 400);
  }

  const plateRows = await db
    .select()
    .from(platesTable)
    .where(sql`${platesTable.status} <> 'retired'`);
  if (plateRows.length === 0) {
    return c.json({ error: "Catalog is empty. Run: pnpm --filter @workspace/db seed" }, 500);
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

  const username = maybeUsername;
  if (!username) {
    return c.json({ error: "username required for anonymous capture" }, 400);
  }

  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, username))
    .limit(1);
  if (existing && existing.userId && existing.userId !== sessionOwnerId) {
    return c.json({ error: "Username already taken" }, 409);
  }
  const profileId = existing?.id ?? makeId("p");
  const finalOwnerId = sessionOwnerId ?? `anon-${profileId}`;
  if (!sessionOwnerId) {
    await db
      .update(plateResponsesTable)
      .set({ userId: finalOwnerId })
      .where(and(eq(plateResponsesTable.sessionId, sessionId), isNull(plateResponsesTable.userId)));
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
    displayName: displayName ?? existing?.displayName ?? null,
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
    isPublic: existing?.isPublic ?? false,
    currentVersionId: versionId,
  };

  const [saved] = await db
    .insert(profilesTable)
    .values(profileValues)
    .onConflictDoUpdate({ target: profilesTable.id, set: profileValues })
    .returning();

  return c.json({
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
});