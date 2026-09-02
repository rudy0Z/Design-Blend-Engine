/**
 * Clerk identity for the Worker (docs/FINAL-PLAN.md §5b): @clerk/express is not
 * Workers-compatible, so we verify the session JWT directly via @clerk/backend.
 * Without CLERK_SECRET_KEY the API runs anonymously (every request is
 * unauthenticated), mirroring the Express dev server.
 */
import { verifyToken } from "@clerk/backend";
import type { Context } from "hono";
import type { Env } from "./db";

const SESSION_COOKIE = "__session";

function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, ...rest] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  const token = rest.join(" ").trim();
  return token || null;
}

function cookieToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`).exec(header);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Resolve the Clerk user id for a request, or null when anonymous.
 * Accepts an `Authorization: Bearer <jwt>` header (what the SPA's generated
 * client sends via setAuthTokenGetter) or the Clerk `__session` cookie.
 */
export async function getRequestUserId(c: Context<{ Bindings: Env }>): Promise<string | null> {
  const secretKey = c.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;

  const token =
    bearerToken(c.req.header("authorization")) ?? cookieToken(c.req.header("cookie"));
  if (!token) return null;

  try {
    const claims = await verifyToken(token, { secretKey });
    return claims.sub ?? null;
  } catch {
    // Invalid/expired token behaves like anonymous — never 500s.
    return null;
  }
}