import { db, styleNodesTable, styleEdgesTable, pool } from "../src/index";
import { styleNodes, styleEdges } from "../src/seed-data";

async function main() {
  console.log(`Seeding ${styleNodes.length} style nodes and ${styleEdges.length} edges…`);
  await db.delete(styleEdgesTable);
  await db.delete(styleNodesTable);
  await db.insert(styleNodesTable).values(styleNodes);
  if (styleEdges.length > 0) {
    await db.insert(styleEdgesTable).values(styleEdges);
  }
  console.log("Seed complete.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
