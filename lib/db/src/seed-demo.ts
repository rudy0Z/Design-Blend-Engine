/**
 * Demo seeder (Phase 3 — "demo mode, no account").
 * Creates @alba and @marlow — two public sample profiles with curated,
 * contrasting tastes — so a visitor can open a blend with zero signup.
 * Run: pnpm --filter @workspace/db demo
 * Idempotent: re-running replaces the demo signals, versions and profile rows.
 */
import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import { platesTable } from "./schema/plates";
import { plateResponsesTable } from "./schema/plate-responses";
import { profileVersionsTable } from "./schema/profile-versions";
import { profilesTable } from "./schema/profiles";
import type { StoredTopPlate } from "./schema/profile-versions";
import { computeProfileVersion } from "@workspace/taste-engine";
import type { PlateRef, Signal } from "@workspace/taste-engine";

const DEMO: Array<{ username: string; ownerId: string; ratings: Record<string, number> }> = [
  {
    username: "alba",
    ownerId: "demo-alba",
    // Systematic, minimal, cold: Swiss grids, spacious dark UI.
    ratings: {
      plate_gd_swiss_beethoven: 95,
      plate_ui_dark_editorial_linear: 90,
      plate_ui_spacious_minimal_superhuman: 88,
      plate_gd_constructivist_books: 20,
      plate_ui_brutalist_bloomberg: 30,
      plate_ui_aurora_gradient_stripe: 45,
    },
  },
  {
    username: "marlow",
    ownerId: "demo-marlow",
    // Expressive, dense, warm: constructivist, maximalist, dense dashboards.
    ratings: {
      plate_gd_swiss_beethoven: 12,
      plate_ui_dark_editorial_linear: 60,
      plate_ui_spacious_minimal_superhuman: 20,
      plate_gd_constructivist_books: 94,
      plate_ui_brutalist_bloomberg: 90,
      plate_ui_aurora_gradient_stripe: 70,
    },
  },
];

async function main() {
  const plateRows = await db.select().from(platesTable).where(sql`${platesTable.status} <> 'retired'`);
  const plateRefs: PlateRef[] = plateRows.map((p) => ({
    id: p.id,
    styleId: p.styleId,
    categoryId: p.categoryId,
    fieldId: p.fieldId,
    label: p.label,
    imageUrl: p.imageUrl,
    axisLoadings: p.axisLoadings,
  }));

  for (const demo of DEMO) {
    // Clean previous demo data for a clean reseed.
    const [existing] = await db
      .select({ id: profilesTable.id })
      .from(profilesTable)
      .where(sql`${profilesTable.username} = ${demo.username}`)
      .limit(1);
    const profileId = existing?.id ?? `demo-${demo.username}`;
    await db.delete(profileVersionsTable).where(sql`${profileVersionsTable.profileId} = ${profileId}`);
    await db.delete(plateResponsesTable).where(sql`${plateResponsesTable.userId} = ${demo.ownerId}`);

    const signals: Signal[] = plateRefs.map((p, i) => ({
      plateId: p.id,
      mode: "rate",
      value: demo.ratings[p.id] ?? 50,
      sequence: i,
    }));
    const versionData = computeProfileVersion(signals, plateRefs);

    const versionId = `demo-${demo.username}-v1`;
    await db
      .insert(profileVersionsTable)
      .values({
        id: versionId,
        profileId,
        userId: demo.ownerId,
        version: 1,
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
      })
      .onConflictDoNothing();

    await db
      .insert(plateResponsesTable)
      .values(
        signals.map((s) => ({
          id: `demo-${demo.username}-${s.plateId}`,
          userId: demo.ownerId,
          sessionId: `demo-${demo.username}`,
          plateId: s.plateId,
          mode: s.mode,
          value: s.value,
          sequence: s.sequence,
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(profilesTable)
      .values({
        id: profileId,
        userId: demo.ownerId,
        username: demo.username,
        displayName: null,
        archetypeId: versionData.archetype.id,
        archetypeTitle: versionData.archetype.title,
        archetypeDescription: "",
        archetypeColor: "#1a1a2e",
        axes: versionData.axes,
        styleVector: versionData.styleVector,
        topStyles: [...new Set(versionData.topPlates.map((t) => t.styleId))].slice(0, 5),
        fieldScores: {},
        categoryScores: {},
        fieldDistribution: {},
        selectedFields: [...new Set(plateRefs.map((p) => p.fieldId))],
        confidence: versionData.archetype.confidence,
        isPublic: true,
        currentVersionId: versionId,
      })
      .onConflictDoUpdate({
        target: profilesTable.id,
        set: {
          userId: demo.ownerId,
          username: demo.username,
          archetypeId: versionData.archetype.id,
          archetypeTitle: versionData.archetype.title,
          axes: versionData.axes,
          styleVector: versionData.styleVector,
          currentVersionId: versionId,
        },
      });

    console.log(`Seeded @${demo.username} — ${versionData.archetype.title}.`);
  }
  console.log("Open /blend/alba/marlow to see the demo pair.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});