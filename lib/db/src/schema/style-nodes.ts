import { pgTable, text, jsonb, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type AxisLoadings = {
  order_chaos: number;
  minimal_maximal: number;
  classic_contemporary: number;
  functional_expressive: number;
  warm_cold: number;
  flat_dimensional: number;
  literal_abstract: number;
  system_intuition: number;
};

export const styleNodesTable = pgTable(
  "style_nodes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    field: text("field").notNull(),
    category: text("category").notNull(),
    visualCharacter: text("visual_character").notNull(),
    referencePoint: text("reference_point").notNull().default(""),
    imageUrl: text("image_url").notNull(),
    axisLoadings: jsonb("axis_loadings").$type<AxisLoadings>().notNull(),
    parents: text("parents").array().notNull().default([]),
    children: text("children").array().notNull().default([]),
    neighbors: text("neighbors").array().notNull().default([]),
    contrasts: text("contrasts").array().notNull().default([]),
    popularity: real("popularity").notNull().default(0.5),
  },
  (t) => [index("style_nodes_field_idx").on(t.field), index("style_nodes_cat_idx").on(t.category)],
);

export const insertStyleNodeSchema = createInsertSchema(styleNodesTable);
export type InsertStyleNode = z.infer<typeof insertStyleNodeSchema>;
export type StyleNode = typeof styleNodesTable.$inferSelect;
