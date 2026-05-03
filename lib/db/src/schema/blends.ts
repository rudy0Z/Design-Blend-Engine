import { pgTable, text, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type SharedStyle = { nodeId: string; name: string; scoreA: number; scoreB: number };

export const blendsTable = pgTable("blends", {
  id: text("id").primaryKey(),
  profileAId: text("profile_a_id").notNull(),
  profileBId: text("profile_b_id").notNull(),
  similarity: real("similarity").notNull(),
  axisDeltas: jsonb("axis_deltas").$type<Record<string, number>>().notNull(),
  sharedStyles: jsonb("shared_styles").$type<SharedStyle[]>().notNull().default([]),
  divergentStyles: jsonb("divergent_styles").$type<SharedStyle[]>().notNull().default([]),
  collaborationLine: text("collaboration_line").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBlendSchema = createInsertSchema(blendsTable).omit({ createdAt: true });
export type InsertBlend = z.infer<typeof insertBlendSchema>;
export type Blend = typeof blendsTable.$inferSelect;
