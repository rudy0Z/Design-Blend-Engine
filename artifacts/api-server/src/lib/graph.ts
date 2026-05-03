import { eq, inArray } from "drizzle-orm";
import {
  db,
  styleNodesTable,
  styleEdgesTable,
  type StyleNode,
  type StyleEdge,
} from "@workspace/db";

export type GraphSnapshot = {
  nodesById: Map<string, StyleNode>;
  childrenOf: Map<string, string[]>;
  neighborsOf: Map<string, string[]>;
  contrastsOf: Map<string, string[]>;
  crossFieldOf: Map<string, string[]>;
};

let cached: { snapshot: GraphSnapshot; loadedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

function pushEdge(map: Map<string, string[]>, from: string, to: string) {
  const arr = map.get(from);
  if (arr) {
    if (!arr.includes(to)) arr.push(to);
  } else {
    map.set(from, [to]);
  }
}

export async function loadGraph(force = false): Promise<GraphSnapshot> {
  const now = Date.now();
  if (!force && cached && now - cached.loadedAt < CACHE_TTL_MS) {
    return cached.snapshot;
  }
  const [nodes, edges] = await Promise.all([
    db.select().from(styleNodesTable),
    db.select().from(styleEdgesTable),
  ]);
  const nodesById = new Map<string, StyleNode>();
  for (const n of nodes as StyleNode[]) nodesById.set(n.id, n);

  const childrenOf = new Map<string, string[]>();
  const neighborsOf = new Map<string, string[]>();
  const contrastsOf = new Map<string, string[]>();
  const crossFieldOf = new Map<string, string[]>();

  for (const e of edges as StyleEdge[]) {
    if (e.edgeType === "parent_child") {
      pushEdge(childrenOf, e.fromNode, e.toNode);
    } else if (e.edgeType === "neighbor") {
      pushEdge(neighborsOf, e.fromNode, e.toNode);
      pushEdge(neighborsOf, e.toNode, e.fromNode);
    } else if (e.edgeType === "contrast") {
      pushEdge(contrastsOf, e.fromNode, e.toNode);
      pushEdge(contrastsOf, e.toNode, e.fromNode);
    } else if (e.edgeType === "cross_field") {
      pushEdge(crossFieldOf, e.fromNode, e.toNode);
      pushEdge(crossFieldOf, e.toNode, e.fromNode);
    }
  }

  // Fallback to node-embedded arrays for nodes not present in edge table
  for (const n of nodes as StyleNode[]) {
    for (const c of n.children ?? []) pushEdge(childrenOf, n.id, c);
    for (const c of n.neighbors ?? []) pushEdge(neighborsOf, n.id, c);
    for (const c of n.contrasts ?? []) pushEdge(contrastsOf, n.id, c);
  }

  const snapshot: GraphSnapshot = { nodesById, childrenOf, neighborsOf, contrastsOf, crossFieldOf };
  cached = { snapshot, loadedAt: now };
  return snapshot;
}

export function getNode(g: GraphSnapshot, id: string): StyleNode | undefined {
  return g.nodesById.get(id);
}
export function getChildren(g: GraphSnapshot, id: string): StyleNode[] {
  return (g.childrenOf.get(id) ?? []).map((nid) => g.nodesById.get(nid)).filter((n): n is StyleNode => !!n);
}
export function getNeighbors(g: GraphSnapshot, id: string): StyleNode[] {
  return (g.neighborsOf.get(id) ?? []).map((nid) => g.nodesById.get(nid)).filter((n): n is StyleNode => !!n);
}
export function getContrastNodes(g: GraphSnapshot, id: string): StyleNode[] {
  return (g.contrastsOf.get(id) ?? []).map((nid) => g.nodesById.get(nid)).filter((n): n is StyleNode => !!n);
}
export function getCrossFieldNeighbors(g: GraphSnapshot, id: string): StyleNode[] {
  return (g.crossFieldOf.get(id) ?? []).map((nid) => g.nodesById.get(nid)).filter((n): n is StyleNode => !!n);
}
export function getAllNodes(g: GraphSnapshot): StyleNode[] {
  return Array.from(g.nodesById.values());
}
export function getRatableNodes(g: GraphSnapshot, fields?: string[]): StyleNode[] {
  // Quiz only asks about leaf-ish style nodes (depth >= 3). Domain/field roots are graph-only.
  const all = getAllNodes(g).filter((n) => n.depth >= 3);
  if (!fields || fields.length === 0) return all;
  return all.filter((n) => fields.includes(n.field));
}

// Used for fetching nodes by id list
export async function fetchNodesByIds(ids: string[]): Promise<StyleNode[]> {
  if (ids.length === 0) return [];
  const rows = await db.select().from(styleNodesTable).where(inArray(styleNodesTable.id, ids));
  return rows as StyleNode[];
}

export async function fetchNode(id: string): Promise<StyleNode | undefined> {
  const [row] = await db.select().from(styleNodesTable).where(eq(styleNodesTable.id, id));
  return row as StyleNode | undefined;
}
