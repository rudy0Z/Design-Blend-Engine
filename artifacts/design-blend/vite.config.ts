import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import type { Plugin } from "vite";

/**
 * Crawler-visible Open Graph tags for /profile/:username and /blend/:a/:b.
 * SPA meta-tag injection via React happens after JS executes, which most
 * social-media bots do not do. This plugin rewrites the served index.html
 * for those routes so the og: tags are present in the initial document.
 */
function ogMetaPlugin(base: string): Plugin {
  const trim = base.replace(/\/$/, "");
  const profileRe = new RegExp(`^${trim}/profile/([^/?#]+)`);
  const blendRe = new RegExp(`^${trim}/blend/([^/?#]+)/([^/?#]+)`);
  return {
    name: "design-blend-og-meta",
    transformIndexHtml(html, ctx) {
      const url = ctx.originalUrl ?? ctx.path ?? "";
      let title: string | null = null;
      let description: string | null = null;
      let image: string | null = null;

      const m1 = url.match(profileRe);
      const m2 = url.match(blendRe);
      if (m2) {
        const [, a, b] = m2;
        title = `@${a} × @${b} — Design Blend`;
        description = `See how @${a} and @${b}'s design tastes overlap and diverge.`;
        image = `/api/og/blend/${a}/${b}`;
      } else if (m1) {
        const [, u] = m1;
        title = `@${u} — Design Blend`;
        description = `@${u}'s design taste fingerprint on Design Blend.`;
        image = `/api/og/profile/${u}`;
      }

      if (!title) return html;
      const inject = [
        `<title>${title}</title>`,
        `<meta name="description" content="${description}" />`,
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${description}" />`,
        `<meta property="og:image" content="${image}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:image" content="${image}" />`,
      ].join("\n    ");
      return html
        .replace(/<title>[^<]*<\/title>/, "")
        .replace(
          /<meta property="og:title"[^/]*\/>|<meta name="description"[^/]*\/>|<meta property="og:description"[^/]*\/>/g,
          "",
        )
        .replace("</head>", `    ${inject}\n  </head>`);
    },
  };
}

const rawPort = process.env.PORT ?? "5173";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Defaults to root hosting (Cloudflare Pages); override for sub-path deploys.
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ogMetaPlugin(basePath),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      allow: [path.resolve(import.meta.dirname, "../..")],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
