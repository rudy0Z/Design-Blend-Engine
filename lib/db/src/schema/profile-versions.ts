import {
  pgTable,
  text,
  jsonb,
  timestamp,
  real,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import type { AxisScores } from "./profiles";

export type StoredTopPlate = {
  plateId: string;
  styleId: string;
  label: string;
  imageUrl: string | null;
  value: number;
  mode: string;
};

/**
 * Immutable computed profile snapshots (docs/FINAL-PLAN.md §1, §5).
 * Never mutated: taste evolution appends a new row. Stamped with the engine
 * and catalog versions so old results are never silently reinterpreted.
 */
export const profileVersionsTable = pgTable(
  "profile_versions",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull(),
    userId: text("user_id"),
    version: integer("version").notNull(),
    axes: jsonb("axes").$type<AxisScores>().notNull(),
    axisCoverage: jsonb("axis_coverage").$type<Record<string, number>>().notNull(),
    styleVector: jsonb("style_vector").$type<Record<string, number>>().notNull(),
    topPlates: jsonb("top_plates").$type<StoredTopPlate[]>().notNull().default([]),
    archetypeId: text("archetype_id").notNull(),
    archetypeTitle: text("archetype_title").notNull(),
    archetypeConfidence: real("archetype_confidence").notNull().default(0),
    modelVersion: text("model_version").notNull(),
    catalogVersion: text("catalog_version").notNull(),
    /** A new version stays private until the user publishes it. */
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("profile_versions_profile_version_idx").on(t.profileId, t.version)],
);

export const insertProfileVersionSchema = createInsertSchema(profileVersionsTable).omit({
  createdAt: true,
});
export type InsertProfileVersion = z.infer<typeof insertProfileVersionSchema>;
export type ProfileVersion = typeof profileVersionsTable.$inferSelect;
