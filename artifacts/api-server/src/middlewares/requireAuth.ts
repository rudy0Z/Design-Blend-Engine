import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export interface AuthedRequest extends Request {
  userId?: string;
}

/**
 * Reads the Clerk auth payload defensively. When the API runs without
 * CLERK_SECRET_KEY (local dev / demo mode), clerkMiddleware is not mounted
 * and these resolve to null — capture flows work anonymously.
 */
function authOrNull(req: Request): { userId?: string | null } | null {
  try {
    const auth = getAuth(req);
    return auth ? { userId: auth.userId } : null;
  } catch {
    return null;
  }
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const userId = authOrNull(req)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

export function getUserIdOrNull(req: Request): string | null {
  return authOrNull(req)?.userId ?? null;
}

