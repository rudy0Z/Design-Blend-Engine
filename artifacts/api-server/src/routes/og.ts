import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";

const router: IRouter = Router();

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgResponse(svg: string, res: import("express").Response) {
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.send(svg);
}

function profileSvg(opts: {
  username: string;
  archetypeTitle: string;
  archetypeDescription: string;
  color: string;
}): string {
  const { username, archetypeTitle, archetypeDescription, color } = opts;
  const desc = archetypeDescription.length > 140
    ? archetypeDescription.slice(0, 137) + "…"
    : archetypeDescription;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${escape(color)}"/>
        <stop offset="100%" stop-color="#1a1a2e"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="80" y="120" font-family="Georgia, serif" font-size="28" fill="#ffffff" opacity="0.7" letter-spacing="6">DESIGN BLEND</text>
    <text x="80" y="260" font-family="Georgia, serif" font-size="84" font-weight="700" fill="#ffffff">@${escape(username)}</text>
    <text x="80" y="350" font-family="Georgia, serif" font-size="56" font-weight="600" fill="#ffffff" opacity="0.95">${escape(archetypeTitle)}</text>
    <foreignObject x="80" y="400" width="1040" height="180">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, system-ui, sans-serif; font-size:24px; line-height:1.4; color:#ffffff; opacity:0.85;">${escape(desc)}</div>
    </foreignObject>
    <text x="80" y="600" font-family="Inter, system-ui, sans-serif" font-size="20" fill="#ffffff" opacity="0.7">designblend.app</text>
  </svg>`;
}

function blendSvg(opts: { a: string; b: string; aTitle: string; bTitle: string; pct: number }): string {
  const { a, b, aTitle, bTitle, pct } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff5a36"/>
        <stop offset="100%" stop-color="#a04dff"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="80" y="120" font-family="Georgia, serif" font-size="28" fill="#ffffff" opacity="0.7" letter-spacing="6">DESIGN BLEND</text>
    <text x="80" y="240" font-family="Georgia, serif" font-size="72" font-weight="700" fill="#ffffff">@${escape(a)} × @${escape(b)}</text>
    <text x="80" y="320" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#ffffff" opacity="0.9">${escape(aTitle)} × ${escape(bTitle)}</text>
    <text x="80" y="500" font-family="Georgia, serif" font-size="160" font-weight="700" fill="#ffffff">${pct}%</text>
    <text x="80" y="540" font-family="Inter, system-ui, sans-serif" font-size="24" fill="#ffffff" opacity="0.9">blend score</text>
    <text x="80" y="600" font-family="Inter, system-ui, sans-serif" font-size="20" fill="#ffffff" opacity="0.7">designblend.app</text>
  </svg>`;
}

router.get("/og/profile/:username", async (req, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, req.params.username))
    .limit(1);
  if (!profile || !profile.isPublic) {
    res.status(404).send("");
    return;
  }
  svgResponse(
    profileSvg({
      username: profile.username,
      archetypeTitle: profile.archetypeTitle,
      archetypeDescription: profile.archetypeDescription,
      color: profile.archetypeColor,
    }),
    res,
  );
});

router.get("/og/blend/:userA/:userB", async (req, res): Promise<void> => {
  const { userA, userB } = req.params;
  const profiles = await db
    .select()
    .from(profilesTable)
    .where(inArray(profilesTable.username, [userA, userB]));
  const a = profiles.find((p) => p.username === userA);
  const b = profiles.find((p) => p.username === userB);
  if (!a || !b || !a.isPublic || !b.isPublic) {
    res.status(404).send("");
    return;
  }
  // Quick cosine for the score, no DB hit beyond what we have.
  let dot = 0, na = 0, nb = 0;
  const keys = new Set([...Object.keys(a.styleVector), ...Object.keys(b.styleVector)]);
  for (const k of keys) {
    const x = a.styleVector[k] ?? 0;
    const y = b.styleVector[k] ?? 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  const sim = na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  const pct = Math.round(Math.max(0, Math.min(1, (sim - 0.6) / 0.4)) * 100);
  svgResponse(
    blendSvg({ a: a.username, b: b.username, aTitle: a.archetypeTitle, bTitle: b.archetypeTitle, pct }),
    res,
  );
});

export default router;
