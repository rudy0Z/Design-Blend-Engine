/**
 * OG share-card images (Workers port) — pure SVG, no satori dependency.
 * The blend card is scored through the SAME engine path as
 * /api/blends/:a/:b/sync so a shared image never disagrees with the page.
 */
import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import {
  plateResponsesTable,
  platesTable,
  profileVersionsTable,
  profilesTable,
} from "@workspace/db/schema";
import {
  computeBlend,
  type PlateRef,
  type ProfileVersionData,
  type Signal,
} from "@workspace/taste-engine";
import { getDb, type Env } from "../db";

export const ogRoutes = new Hono<{ Bindings: Env }>();

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=3600",
} as const;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function profileSvg(opts: {
  username: string;
  archetypeTitle: string;
  archetypeDescription: string;
  color: string;
}): string {
  const { username, archetypeTitle, archetypeDescription, color } = opts;
  const desc =
    archetypeDescription.length > 140
      ? `${archetypeDescription.slice(0, 137)}…`
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

function blendSvg(opts: {
  a: string;
  b: string;
  aTitle: string;
  bTitle: string;
  pct: number;
}): string {
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

ogRoutes.get("/og/profile/:username", async (c) => {
  const [profile] = await getDb(c.env)
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.username, c.req.param("username").toLowerCase()))
    .limit(1);
  if (!profile || !profile.isPublic) {
    return c.body("", 404);
  }
  return c.body(
    profileSvg({
      username: profile.username,
      archetypeTitle: profile.archetypeTitle,
      archetypeDescription: profile.archetypeDescription,
      color: profile.archetypeColor,
    }),
    200,
    SVG_HEADERS,
  );
});

ogRoutes.get("/og/blend/:userA/:userB", async (c) => {
  const userA = c.req.param("userA").toLowerCase();
  const userB = c.req.param("userB").toLowerCase();
  const db = getDb(c.env);
  const profiles = await db
    .select()
    .from(profilesTable)
    .where(sql`${profilesTable.username} in (${userA}, ${userB})`);
  const profA = profiles.find((p) => p.username === userA);
  const profB = profiles.find((p) => p.username === userB);
  if (!profA || !profB || !profA.isPublic || !profB.isPublic) {
    return c.body("", 404);
  }
  if (!profA.currentVersionId || !profB.currentVersionId) {
    return c.body("", 404);
  }

  const [versionA] = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.id, profA.currentVersionId))
    .limit(1);
  const [versionB] = await db
    .select()
    .from(profileVersionsTable)
    .where(eq(profileVersionsTable.id, profB.currentVersionId))
    .limit(1);
  if (!versionA || !versionB) {
    return c.body("", 404);
  }

  const plateRows = await db
    .select()
    .from(platesTable)
    .where(sql`${platesTable.status} <> 'retired'`);
  const plateRefs: PlateRef[] = plateRows.map((p) => ({
    id: p.id,
    styleId: p.styleId,
    categoryId: p.categoryId,
    fieldId: p.fieldId,
    label: p.label,
    imageUrl: p.imageUrl,
    axisLoadings: p.axisLoadings,
  }));
  const loadSignals = async (ownerId: string | null): Promise<Signal[]> => {
    if (!ownerId) return [];
    const rows = await db
      .select()
      .from(plateResponsesTable)
      .where(eq(plateResponsesTable.userId, ownerId));
    return rows.map((s) => ({
      plateId: s.plateId,
      mode: s.mode as Signal["mode"],
      value: s.value,
      sequence: s.sequence,
    }));
  };
  const toProfileData = (v: typeof versionA): ProfileVersionData =>
    ({ axes: v.axes, axisCoverage: v.axisCoverage, modelVersion: v.modelVersion }) as ProfileVersionData;

  const blend = computeBlend(
    toProfileData(versionA),
    toProfileData(versionB),
    await loadSignals(profA.userId),
    await loadSignals(profB.userId),
    plateRefs,
  );

  return c.body(
    blendSvg({
      a: profA.username,
      b: profB.username,
      aTitle: profA.archetypeTitle,
      bTitle: profB.archetypeTitle,
      pct: blend.score,
    }),
    200,
    SVG_HEADERS,
  );
});