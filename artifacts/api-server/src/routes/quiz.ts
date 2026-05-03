import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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
  SubmitRatingParams,
  SubmitRatingBody,
  SubmitRatingResponse,
  CompleteQuizSessionParams,
  CompleteQuizSessionResponse,
} from "@workspace/api-zod";
import { makeId } from "../lib/ids";
import {
  scoreAxes,
  pickArchetype,
  styleVectorFromAxes,
  getFieldDistribution,
  getFieldScores,
  getCategoryScores,
} from "../lib/scoring";
import { loadGraph } from "../lib/graph";
import {
  deserializeEngine,
  makeInitialDistribution,
  pickNext,
  shouldTerminate,
  updateDistribution,
} from "../lib/engine";

const router: IRouter = Router();

function makeUsername(archetypeId: string): string {
  const slug = archetypeId.replace(/_/g, "-");
  const tail = Math.random().toString(36).slice(2, 6);
  return `${slug}-${tail}`;
}

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
      axisDistribution: makeInitialDistribution(),
      traversalPath: [],
      fieldsCovered: [],
      switchCount: 0,
      status: "active",
      totalTarget: parsed.data.targetCount ?? 30,
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
  if (!row) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(GetQuizSessionResponse.parse(row));
});

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
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const ratedCount = session.ratings.length;
  const target = session.totalTarget;

  const graph = await loadGraph();
  const state = deserializeEngine({
    axisDistribution: session.axisDistribution,
    ratings: session.ratings,
    traversalPath: session.traversalPath,
    fieldsCovered: session.fieldsCovered,
    switchCount: session.switchCount,
  });

  const term = shouldTerminate(state, target);
  if (term || session.status === "completed") {
    res.json(
      GetNextStyleResponse.parse({
        done: true,
        progress: 1,
        target,
        ratedCount,
        node: null,
      }),
    );
    return;
  }

  const next = pickNext(graph, state, session.selectedFields);
  if (!next) {
    res.json(
      GetNextStyleResponse.parse({
        done: true,
        progress: 1,
        target,
        ratedCount,
        node: null,
      }),
    );
    return;
  }

  // Persist the traversal entry + any switchCount/fieldsCovered changes the engine made
  // while selecting this node, so /ratings doesn't lose them when it rebuilds state.
  if (!session.traversalPath.find((t) => t.nodeId === next.node.id)) {
    await db
      .update(quizSessionsTable)
      .set({
        traversalPath: [...session.traversalPath, { nodeId: next.node.id, reason: next.reason }],
        switchCount: state.switchCount,
        fieldsCovered: state.fieldsCovered,
      })
      .where(eq(quizSessionsTable.id, p.data.id));
  }

  res.json(
    GetNextStyleResponse.parse({
      done: false,
      progress: Math.min(0.99, ratedCount / target),
      target,
      ratedCount,
      node: next.node,
    }),
  );
});

router.post("/quiz/sessions/:id/ratings", async (req, res): Promise<void> => {
  const p = SubmitRatingParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }
  const body = SubmitRatingBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  if (!Number.isFinite(body.data.rating) || body.data.rating < 0 || body.data.rating > 100) {
    res.status(400).json({ error: "rating must be a number between 0 and 100" });
    return;
  }

  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.id, p.data.id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const graph = await loadGraph();
  const node = graph.nodesById.get(body.data.nodeId);
  if (!node) {
    res.status(400).json({ error: "Unknown style node" });
    return;
  }

  const responseTimeMs =
    typeof body.data.responseTimeMs === "number" && Number.isFinite(body.data.responseTimeMs) && body.data.responseTimeMs >= 0
      ? body.data.responseTimeMs
      : undefined;

  // Build the new ratings list (replacing any prior rating for this node).
  const filteredRatings = session.ratings.filter((r) => r.nodeId !== body.data.nodeId);
  const newRating = {
    nodeId: body.data.nodeId,
    rating: body.data.rating,
    ratedAt: new Date().toISOString(),
    ...(responseTimeMs !== undefined ? { responseTimeMs } : {}),
  };
  const ratings = [...filteredRatings, newRating];

  // Rebuild the axis distribution from scratch over the full updated ratings list to
  // avoid double-counting when a rating is replaced. switchCount is preserved from the
  // session because it accumulates from /next traversal decisions, not from ratings.
  const rebuiltState = deserializeEngine({
    axisDistribution: null,
    ratings: [],
    traversalPath: session.traversalPath,
    fieldsCovered: [],
    switchCount: session.switchCount,
  });
  for (const r of ratings) {
    const ratedNode = graph.nodesById.get(r.nodeId);
    if (!ratedNode) continue;
    updateDistribution(rebuiltState, ratedNode, r.rating);
  }
  rebuiltState.history = ratings.map((r) => ({
    nodeId: r.nodeId,
    rating: r.rating,
    responseTimeMs: r.responseTimeMs,
  }));
  // Preserve switchCount accumulated by /next moves.
  rebuiltState.switchCount = session.switchCount;

  const visited = session.visitedNodes.includes(body.data.nodeId)
    ? session.visitedNodes
    : [...session.visitedNodes, body.data.nodeId];

  // If /next persisted a traversal entry for this node, keep it. Otherwise stamp it now.
  const traversalPath = session.traversalPath.find((t) => t.nodeId === body.data.nodeId)
    ? session.traversalPath
    : [...session.traversalPath, { nodeId: body.data.nodeId, reason: "seed" as const }];

  const term = shouldTerminate(rebuiltState, session.totalTarget);

  const [updated] = await db
    .update(quizSessionsTable)
    .set({
      ratings,
      visitedNodes: visited,
      axisDistribution: rebuiltState.axisDistribution,
      traversalPath,
      fieldsCovered: rebuiltState.fieldsCovered,
      switchCount: rebuiltState.switchCount,
      ...(term ? { terminatedReason: term.reason } : {}),
    })
    .where(eq(quizSessionsTable.id, p.data.id))
    .returning();
  res.json(SubmitRatingResponse.parse(updated));
});

router.post("/quiz/sessions/:id/complete", async (req, res): Promise<void> => {
  const p = CompleteQuizSessionParams.safeParse(req.params);
  if (!p.success) {
    res.status(400).json({ error: p.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.id, p.data.id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const allNodes = (await db.select().from(styleNodesTable)) as StyleNode[];
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const axes = scoreAxes(session.ratings, byId);
  const arch = pickArchetype(axes);
  const styleVector = styleVectorFromAxes(axes, allNodes);
  const topStyles = Object.entries(styleVector)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);
  const fieldDistribution = getFieldDistribution(session.ratings, byId);
  const fieldScores = getFieldScores(session.ratings, byId);
  const categoryScores = getCategoryScores(session.ratings, byId);
  const selectedFields = session.selectedFields ?? [];

  // Anonymous (logged-out) sessions: don't persist a public profile yet —
  // return a preview-shaped profile object derived from the session ratings.
  // The user must sign in and POST /profiles to actually claim a username.
  if (!session.userId) {
    await db
      .update(quizSessionsTable)
      .set({ status: "completed", terminatedReason: session.terminatedReason ?? "complete" })
      .where(eq(quizSessionsTable.id, session.id));
    const now = new Date();
    const previewUsername = `preview-${session.id.slice(-6)}`;
    res.json(
      CompleteQuizSessionResponse.parse({
        id: `preview_${session.id}`,
        userId: null,
        username: previewUsername,
        displayName: null,
        archetypeId: arch.id,
        archetypeTitle: arch.title,
        archetypeDescription: arch.description,
        archetypeColor: arch.color,
        axes,
        styleVector,
        topStyles,
        fieldDistribution,
        fieldScores,
        categoryScores,
        selectedFields,
        confidence: arch.confidence,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      }),
    );
    return;
  }

  const profileId = session.profileId ?? makeId("p");
  const username = makeUsername(arch.id);
  const [profile] = await db
    .insert(profilesTable)
    .values({
      id: profileId,
      userId: session.userId,
      username,
      archetypeId: arch.id,
      archetypeTitle: arch.title,
      archetypeDescription: arch.description,
      archetypeColor: arch.color,
      axes,
      styleVector,
      topStyles,
      fieldDistribution,
      fieldScores,
      categoryScores,
      selectedFields,
      confidence: arch.confidence,
    })
    .onConflictDoUpdate({
      target: profilesTable.id,
      set: {
        archetypeId: arch.id,
        archetypeTitle: arch.title,
        archetypeDescription: arch.description,
        archetypeColor: arch.color,
        axes,
        styleVector,
        topStyles,
        fieldDistribution,
        fieldScores,
        categoryScores,
        selectedFields,
        confidence: arch.confidence,
      },
    })
    .returning();

  await db
    .update(quizSessionsTable)
    .set({ status: "completed", profileId, terminatedReason: session.terminatedReason ?? "complete" })
    .where(eq(quizSessionsTable.id, session.id));

  res.json(CompleteQuizSessionResponse.parse(profile));
});

export default router;
