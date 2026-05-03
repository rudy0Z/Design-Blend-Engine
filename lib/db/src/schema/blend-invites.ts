import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blendInvitesTable = pgTable(
  "blend_invites",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    profileId: text("profile_id").notNull(),
    username: text("username").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("blend_invites_token_idx").on(t.token)],
);

export const insertBlendInviteSchema = createInsertSchema(blendInvitesTable).omit({
  createdAt: true,
});
export type InsertBlendInvite = z.infer<typeof insertBlendInviteSchema>;
export type BlendInvite = typeof blendInvitesTable.$inferSelect;
