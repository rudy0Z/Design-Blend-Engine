import { pgTable, text, jsonb, timestamp, real, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import type { AxisLoadings } from "./style-nodes";

export type AxisScores = AxisLoadings;
export type StyleVector = Record<string, number>;

export const profilesTable = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    username: text("username").notNull(),
    displayName: text("display_name"),
    archetypeId: text("archetype_id").notNull(),
    archetypeTitle: text("archetype_title").notNull(),
    archetypeDescription: text("archetype_description").notNull().default(""),
    archetypeColor: text("archetype_color").notNull().default("#1a1a2e"),
    axes: jsonb("axes").$type<AxisScores>().notNull(),
    styleVector: jsonb("style_vector").$type<StyleVector>().notNull(),
    topStyles: text("top_styles").array().notNull().default([]),
    fieldDistribution: jsonb("field_distribution").$type<Record<string, number>>().notNull().default({}),
    confidence: real("confidence").notNull().default(0),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("profiles_username_idx").on(t.username)],
);

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
