import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Append-only capture signals — the "listening history" (docs/FINAL-PLAN.md §1).
 * Skips are never recorded (skip = unknown). Re-rates append; never update.
 */
export const plateResponsesTable = pgTable(
  "plate_responses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    sessionId: text("session_id").notNull(),
    plateId: text("plate_id").notNull(),
    /** pick | rank | rate */
    mode: text("mode").notNull(),
    /** 0..100. pick stores 100; contribution weighting lives in the engine. */
    value: integer("value").notNull(),
    /** Monotonic per-user ordering; latest wins at recompute time. */
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("plate_responses_user_idx").on(t.userId),
    index("plate_responses_session_idx").on(t.sessionId),
    index("plate_responses_plate_idx").on(t.plateId),
  ],
);

export const insertPlateResponseSchema = createInsertSchema(plateResponsesTable).omit({
  createdAt: true,
});
export type InsertPlateResponse = z.infer<typeof insertPlateResponseSchema>;
export type PlateResponse = typeof plateResponsesTable.$inferSelect;
