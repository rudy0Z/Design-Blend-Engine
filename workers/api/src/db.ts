/**
 * Drizzle connection for Cloudflare Workers via the stateless Neon HTTP driver.
 * One client per isolate, created lazily on first request.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@workspace/db/schema";

export type Env = {
  DATABASE_URL: string;
  CORS_ORIGIN?: string;
  /** Enables Clerk identity resolution; absent = anonymous mode. */
  CLERK_SECRET_KEY?: string;
};

let cached: ReturnType<typeof createDb> | null = null;

function createDb(url: string) {
  const client = neon(url);
  return drizzle(client, { schema });
}

export function getDb(env: Env) {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL binding is required. Add it via: wrangler secret put DATABASE_URL");
  }
  cached ??= createDb(url);
  return cached;
}