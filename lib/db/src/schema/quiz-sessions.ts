import { pgTable, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type Rating = { nodeId: string; rating: number; ratedAt: string };
export type BeliefState = {
  axisMeans: Record<string, number>;
  axisVariances: Record<string, number>;
  archetypePosteriors: Record<string, number>;
};

export const quizSessionsTable = pgTable("quiz_sessions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id"),
  userId: text("user_id"),
  selectedFields: text("selected_fields").array().notNull().default([]),
  selectedCategories: text("selected_categories").array().notNull().default([]),
  ratings: jsonb("ratings").$type<Rating[]>().notNull().default([]),
  visitedNodes: text("visited_nodes").array().notNull().default([]),
  beliefState: jsonb("belief_state").$type<BeliefState | null>(),
  status: text("status").notNull().default("active"),
  totalTarget: integer("total_target").notNull().default(60),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertQuizSessionSchema = createInsertSchema(quizSessionsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessionsTable.$inferSelect;
