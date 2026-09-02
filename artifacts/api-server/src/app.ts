import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// CORS: pinned to CORS_ORIGIN when configured (comma-separated list allowed);
// reflected origin only as a local-dev fallback.
const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    credentials: true,
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Best-effort fixed-window rate limiter (per process).
 * Protects the anonymous capture/blend endpoints from trivial abuse. For a
 * multi-instance deployment, front this with an edge limiter.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 240;
const hits = new Map<string, { count: number; resetAt: number }>();

app.use("/api", (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many requests. Try again shortly." });
    return;
  }
  next();
});

// Periodically drop expired buckets so the map cannot grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY);

if (hasClerk) {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
} else {
  // Local dev / demo mode: no Clerk keys — capture flows run anonymously.
  logger.warn("CLERK_SECRET_KEY not set — running without auth (anonymous capture).");
}

app.use("/api", router);

export default app;
