import { Router, type IRouter } from "express";
import { eq, and, inArray, notInArray } from "drizzle-orm";
import {
  db,
  styleNodesTable,
  quizSessionsTable,
  profilesTable,
  type StyleNode,
} from "@workspace/db";
import {
  CreateQuizSessionBody,
  GetQuizSessionParams,
  GetQuizSessionResponse,
  GetNextStyleParams,
  GetNextStyleResponse,
  RateStyleParams,
  RateStyleBody,
  RateStyleResponse,
  CompleteQuizSessionParams,
  CompleteQuizSessionResponse,
} from "@workspace/api-zod";
import { makeId } from "../lib/ids";
import {
  scoreAxes,
  pickArchetype,
  styleVectorFromAxes,
} from "../lib/scoring";

const router: IRouter = Router();

router.post("/quiz/sessions", async (req, res): Promise<void> => {
  const parsed = CreateQuizSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = makeId("qs");
  const [row] = await db
    .insert(quizSessionsTable)
    .values({
      id,
      userId: parsed.data.userId ?? null,
      selectedFields: parsed.data.selectedFields,
      selectedCategories: parsed.data.selectedCategories ?? [],
      ratings: [],
      visitedNodes: [],
      status: "active",
      totalTarget: parsed.data.targetCount ?? 24,
    })
    .returning();
  res.status(201).json(GetQuizSessionResponse.parse(row));
});

router.get("/quiz/sessions/:id", async (req, res): Promise<void> => {
  const p = GetQuizSessionParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }
  const [row] = await db.select().from(quizSessionsTable).where(eq(quizSessionsTable.id, p.data.id));
  if (!row) { res.status(404).json({ error: "Session not found" }); return; }
  res.json(GetQuizSessionResponse.parse(row));
});

// Placeholder adaptive engine: pick a random unrated node from the selected fields,
// preferring high-popularity nodes. Task #2 will replace with Bayesian sampling.
router.get("/quiz/sessions/:id/next", async (req, res): Promise<void> => {
  const p = GetNextStyleParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }
  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.id, p.data.id));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const ratedCount = session.ratings.length;
  const target = session.totalTarget;
  const done = session.status === "completed" || ratedCount >= target;
  if (done) {
    res.json(GetNextStyleResponse.parse({
      done: true, progress: 1, target, ratedCount, node: null,
    }));
    return;
  }

  const fieldFilter = session.selectedFields.length > 0
    ? inArray(styleNodesTable.field, session.selectedFields)
    : undefined;
  const visitedFilter = session.visitedNodes.length > 0
    ? notInArray(styleNodesTable.id, session.visitedNodes)
    : undefined;

  const where = fieldFilter && visitedFilter
    ? and(fieldFilter, visitedFilter)
    : (fieldFilter ?? visitedFilter);

  const candidates = where
    ? await db.select().from(styleNodesTable).where(where)
    : await db.select().from(styleNodesTable);

  if (candidates.length === 0) {
    res.json(GetNextStyleResponse.parse({
      done: true, progress: 1, target, ratedCount, node: null,
    }));
    return;
  }

  // Weight by popularity for the placeholder selector
  const totalW = candidates.reduce((s, c) => s + Math.max(0.1, c.popularity), 0);
  let r = Math.random() * totalW;
  let pick = candidates[0];
  for (const c of candidates) {
    r -= Math.max(0.1, c.popularity);
    if (r <= 0) { pick = c; break; }
  }

  res.json(GetNextStyleResponse.parse({
    done: false,
    progress: ratedCount / target,
    target,
    ratedCount,
    node: pick,
  }));
});

router.post("/quiz/sessions/:id/rate", async (req, res): Promise<void> => {
  const p = RateStyleParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const body = RateStyleBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (body.data.rating < 0 || body.data.rating > 100 || !Number.isFinite(body.data.rating)) {
    res.status(400).json({ error: "rating must be a number between 0 and 100" });
    return;
  }

  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.id, p.data.id));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const ratings = [
    ...session.ratings.filter((r) => r.nodeId !== body.data.nodeId),
    { nodeId: body.data.nodeId, rating: body.data.rating, ratedAt: new Date().toISOString() },
  ];
  const visited = session.visitedNodes.includes(body.data.nodeId)
    ? session.visitedNodes
    : [...session.visitedNodes, body.data.nodeId];

  const [updated] = await db
    .update(quizSessionsTable)
    .set({ ratings, visitedNodes: visited })
    .where(eq(quizSessionsTable.id, p.data.id))
    .returning();
  res.json(RateStyleResponse.parse(updated));
});

router.post("/quiz/sessions/:id/complete", async (req, res): Promise<void> => {
  const p = CompleteQuizSessionParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.id, p.data.id));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const allNodes = (await db.select().from(styleNodesTable)) as StyleNode[];
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const axes = scoreAxes(session.ratings, byId);
  const archetype = pickArchetype(axes);
  const styleVector = styleVectorFromAxes(axes, allNodes);
  const topStyles = Object.entries(styleVector)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  const profileId = session.profileId ?? makeId("p");
  const [profile] = await db
    .insert(profilesTable)
    .values({
      id: profileId,
      userId: session.userId,
      archetypeId: archetype.id,
      archetypeTitle: archetype.title,
      archetypeDescription: archetype.description,
      archetypeColor: archetype.color,
      axes,
      styleVector,
      topStyles,
      confidence: archetype.confidence,
    })
    .onConflictDoUpdate({
      target: profilesTable.id,
      set: {
        archetypeId: archetype.id,
        archetypeTitle: archetype.title,
        archetypeDescription: archetype.description,
        archetypeColor: archetype.color,
        axes,
        styleVector,
        topStyles,
        confidence: archetype.confidence,
      },
    })
    .returning();

  await db
    .update(quizSessionsTable)
    .set({ status: "completed", profileId })
    .where(eq(quizSessionsTable.id, session.id));

  res.json(CompleteQuizSessionResponse.parse(profile));
});

export default router;
