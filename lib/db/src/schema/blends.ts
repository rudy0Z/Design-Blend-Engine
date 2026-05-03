import { pgTable, text, jsonb, timestamp, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type SharedStyle = { nodeId: string; label: string; scoreA: number; scoreB: number };

export const blendsTable = pgTable(
  "blends",
  {
    id: text("id").primaryKey(),
    profileAId: text("profile_a_id").notNull(),
    profileBId: text("profile_b_id").notNull(),
    usernameA: text("username_a").notNull(),
    usernameB: text("username_b").notNull(),
    similarity: real("similarity").notNull(),
    axisDeltas: jsonb("axis_deltas").$type<Record<string, number>>().notNull(),
    sharedStyles: jsonb("shared_styles").$type<SharedStyle[]>().notNull().default([]),
    divergentStyles: jsonb("divergent_styles").$type<SharedStyle[]>().notNull().default([]),
    collaborationLine: text("collaboration_line").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("blends_pair_idx").on(t.profileAId, t.profileBId)],
);

export const insertBlendSchema = createInsertSchema(blendsTable).omit({ createdAt: true });
export type InsertBlend = z.infer<typeof insertBlendSchema>;
export type Blend = typeof blendsTable.$inferSelect;
