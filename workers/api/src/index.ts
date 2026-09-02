import { Hono } from "hono";
import type { Env } from "./db";
import { healthRoutes } from "./routes/health";
import { catalogRoutes } from "./routes/catalog";
import { captureRoutes } from "./routes/capture";
import { profileRoutes } from "./routes/profiles";
import { inviteRoutes } from "./routes/invites";
import { ogRoutes } from "./routes/og";
import { blendRoutes } from "./routes/blend-sync";
import { RateLimiter } from "./rate-limit";

const app = new Hono<{ Bindings: Env }>();

// CORS: pinned to CORS_ORIGIN when configured (comma-separated list allowed).
// Falls back to reflecting the request origin for local/dev only — set the
// var in production (audit: reflected-origin + credentials is too permissive).
const allowedOrigins = (env: Env): string[] =>
  (env.CORS_ORIGIN ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use("*", async (c, next) => {
  const origins = allowedOrigins(c.env);
  const requestOrigin = c.req.header("Origin") ?? "";
  const allow =
    origins.length === 0 ? requestOrigin || "*" : origins.includes(requestOrigin) ? requestOrigin : null;
  if (allow) {
    c.header("Access-Control-Allow-Origin", allow);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Vary", "Origin");
  }
  if (c.req.method === "OPTIONS") {
    c.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return c.body(null, 204);
  }
  await next();
  // Ensure CORS headers are present even on error paths.
  if (allow) {
    c.header("Access-Control-Allow-Origin", allow);
    c.header("Access-Control-Allow-Credentials", "true");
  }
  return;
});

// Best-effort fixed-window limiter (per isolate; front with an edge limiter
// for real traffic). Protects the anonymous capture/blend endpoints.
const limiter = new RateLimiter({ windowMs: 60_000, max: 240 });
let lastSweep = Date.now();

app.use("/api/*", async (c, next) => {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    limiter.sweep(now);
    lastSweep = now;
  }
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const decision = limiter.check(ip, now);
  if (!decision.allowed) {
    c.header("Retry-After", String(decision.retryAfterSec));
    return c.json({ error: "Too many requests. Try again shortly." }, 429);
  }
  await next();
  return;
});

app.route("/api", healthRoutes);
app.route("/api", catalogRoutes);
app.route("/api", captureRoutes);
app.route("/api", profileRoutes);
app.route("/api", inviteRoutes);
app.route("/api", ogRoutes);
app.route("/api", blendRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;