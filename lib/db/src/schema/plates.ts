import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import type { AxisLoadings } from "./style-nodes";

/**
 * The plate catalog (docs/FINAL-PLAN.md §2). Seeded from catalog/v1.json;
 * every change bumps `catalogVersion`. Plates are credited reference work —
 * creditLine is mandatory (CREDITS.md).
 */
export const platesTable = pgTable(
  "plates",
  {
    id: text("id").primaryKey(),
    styleId: text("style_id").notNull(),
    categoryId: text("category_id").notNull(),
    fieldId: text("field_id").notNull(),
    label: text("label").notNull(),
    imageUrl: text("image_url"),
    creditLine: text("credit_line").notNull(),
    sourceUrl: text("source_url"),
    licenseNote: text("license_note").notNull(),
    altText: text("alt_text").notNull(),
    axisLoadings: jsonb("axis_loadings").$type<Partial<AxisLoadings>>().notNull(),
    tags: text("tags").array().notNull().default([]),
    /** pending | approved | retired (CREDITS.md lifecycle) */
    status: text("status").notNull().default("pending"),
    catalogVersion: text("catalog_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("plates_category_idx").on(t.categoryId),
    index("plates_status_idx").on(t.status),
    index("plates_field_idx").on(t.fieldId),
  ],
);

export const insertPlateSchema = createInsertSchema(platesTable).omit({ createdAt: true });
export type InsertPlate = z.infer<typeof insertPlateSchema>;
export type Plate = typeof platesTable.$inferSelect;
