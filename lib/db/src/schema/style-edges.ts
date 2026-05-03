import { pgTable, serial, text, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const styleEdgesTable = pgTable(
  "style_edges",
  {
    id: serial("id").primaryKey(),
    fromNode: text("from_node").notNull(),
    toNode: text("to_node").notNull(),
    edgeType: text("edge_type").notNull(),
    weight: real("weight").notNull().default(1),
  },
  (t) => [
    index("style_edges_from_idx").on(t.fromNode),
    index("style_edges_type_idx").on(t.edgeType),
  ],
);

export const insertStyleEdgeSchema = createInsertSchema(styleEdgesTable).omit({ id: true });
export type InsertStyleEdge = z.infer<typeof insertStyleEdgeSchema>;
export type StyleEdge = typeof styleEdgesTable.$inferSelect;
