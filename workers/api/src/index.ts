import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./db";
import { healthRoutes } from "./routes/health";
import { catalogRoutes } from "./routes/catalog";
import { captureRoutes } from "./routes/capture";
import { profileRoutes } from "./routes/profiles";
import { blendRoutes } from "./routes/blend-sync";

const app = new Hono<{ Bindings: Env }>();

// The SPA is served from a different origin (Cloudflare Pages), so allow it.
const allowedOrigin = (origin: string) => origin || "*";
app.use("*", cors({ origin: allowedOrigin }));
app.use("*", async (c, next) => {
  await next();
  // Ensure CORS headers are present even on errors.
  c.header("Access-Control-Allow-Origin", allowedOrigin(c.req.header("Origin") ?? ""));
});

app.route("/api", healthRoutes);
app.route("/api", catalogRoutes);
app.route("/api", captureRoutes);
app.route("/api", profileRoutes);
app.route("/api", blendRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;