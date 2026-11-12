import { AXIS_KEYS, CRAFT_KEYS, type CraftKey } from "./axes";
import { computeProfileVersion, resolveCraftLoadings } from "./profile";
import type { PlateRef, Signal } from "./types";

export type CapturePrompt =
  | {
      kind: "craft_strip";
      id: string;
      dimension: CraftKey;
      plates: PlateRef[];
      rationale: string;
    }
  | {
      kind: "foil_pair";
      id: string;
      pairGroupId: string;
      plateA: PlateRef;
      plateB: PlateRef;
      rationale: string;
    }
  | {
      kind: "critique_plate";
      id: string;
      plate: PlateRef;
      rationale: string;
    };

/**
 * Information-gain-guided prompt sequencer (PROFILE-BUILDING-INTERACTION.md §6).
 * Alternates Controlled Craft Strips, Foil Pairs, and Single-Plate Studio Critiques
 * so a 3-minute session covers maximum epistemic territory without repetition.
 */
export function buildAdaptiveQueue(
  plates: PlateRef[],
  options: {
    fieldIds?: string[];
    categoryIds?: string[];
    existingSignals?: Signal[];
    maxPrompts?: number;
  } = {},
): CapturePrompt[] {
  const { fieldIds, categoryIds, existingSignals = [], maxPrompts = 14 } = options;
  const seenPlateIds = new Set(existingSignals.map((s) => s.plateId));
  const currentProfile = computeProfileVersion(existingSignals, plates);

  // Filter eligible pool while keeping universal craft strips accessible
  const eligible = plates.filter((p) => {
    if (seenPlateIds.has(p.id)) return false;
    if (p.diagnosticKind === "craft_variant") return true;
    if (categoryIds && categoryIds.length > 0) {
      return categoryIds.includes(p.categoryId);
    }
    if (fieldIds && fieldIds.length > 0) {
      return fieldIds.includes(p.fieldId);
    }
    return true;
  });

  // 1. Assemble unseen Controlled Craft Strips (up to 3)
  const craftGroups = new Map<CraftKey, PlateRef[]>();
  for (const p of eligible) {
    if (p.craftDimension && p.diagnosticKind === "craft_variant") {
      const list = craftGroups.get(p.craftDimension) ?? [];
      list.push(p);
      craftGroups.set(p.craftDimension, list);
    }
  }
  const craftPrompts: CapturePrompt[] = [];
  for (const dim of CRAFT_KEYS) {
    const group = craftGroups.get(dim);
    if (group && group.length >= 3) {
      craftPrompts.push({
        kind: "craft_strip",
        id: `strip_${dim}`,
        dimension: dim,
        plates: group,
        rationale: `Isolates ${dim} preference while holding content structure constant.`,
      });
    }
  }

  // 2. Assemble unseen Foil Pairs
  const byPair = new Map<string, PlateRef[]>();
  const usedInPairs = new Set<string>();
  for (const p of eligible) {
    if (p.diagnosticKind === "craft_variant") continue;
    if (p.pairGroupId) {
      const list = byPair.get(p.pairGroupId) ?? [];
      list.push(p);
      byPair.set(p.pairGroupId, list);
    }
  }

  const pairPrompts: Array<{ prompt: CapturePrompt; infoGain: number }> = [];
  for (const [pairId, list] of byPair) {
    if (list.length >= 2) {
      const [plateA, plateB] = list;
      usedInPairs.add(plateA.id);
      usedInPairs.add(plateB.id);
      let gain = 0;
      for (const k of AXIS_KEYS) {
        const contrast = Math.abs((plateA.axisLoadings[k] ?? 0) - (plateB.axisLoadings[k] ?? 0));
        gain += (1 - currentProfile.axisCoverage[k]) * contrast;
      }
      pairPrompts.push({
        infoGain: gain,
        prompt: {
          kind: "foil_pair",
          id: `pair_${pairId}`,
          pairGroupId: pairId,
          plateA,
          plateB,
          rationale: "Contrasts two opposing philosophies solving the same design problem.",
        },
      });
    }
  }
  pairPrompts.sort((a, b) => b.infoGain - a.infoGain);

  // 3. Remaining high-information single critique plates (including anti-slop diagnostic foils)
  const singleCandidates: Array<{ prompt: CapturePrompt; infoGain: number }> = [];
  for (const p of eligible) {
    if (p.diagnosticKind === "craft_variant" || usedInPairs.has(p.id)) continue;
    let gain = p.diagnosticKind === "anti_slop" ? 0.85 : 0.2;
    const cl = resolveCraftLoadings(p);
    for (const k of AXIS_KEYS) {
      gain += (1 - currentProfile.axisCoverage[k]) * Math.abs(p.axisLoadings[k] ?? 0) * 0.55;
    }
    for (const c of CRAFT_KEYS) {
      gain += Math.abs(cl[c] ?? 0) * 0.15;
    }
    singleCandidates.push({
      infoGain: gain,
      prompt: {
        kind: "critique_plate",
        id: `single_${p.id}`,
        plate: p,
        rationale:
          p.diagnosticKind === "anti_slop"
            ? "Tests aversive threshold against polarizing contemporary tropes."
            : "Measures visceral response and studio critique vocabulary.",
      },
    });
  }
  singleCandidates.sort((a, b) => b.infoGain - a.infoGain);

  // 4. Interleave formats rhythmically so capture feels like a studio salon, never a monotonous form:
  // Pattern: Pair -> Craft Strip -> Critique -> Pair -> Critique -> Craft Strip ...
  const rhythmQueue: CapturePrompt[] = [];
  let cIdx = 0;
  let pIdx = 0;
  let sIdx = 0;

  while (
    rhythmQueue.length < maxPrompts &&
    (cIdx < craftPrompts.length || pIdx < pairPrompts.length || sIdx < singleCandidates.length)
  ) {
    if (pIdx < pairPrompts.length && rhythmQueue.length < maxPrompts) {
      rhythmQueue.push(pairPrompts[pIdx++].prompt);
    }
    if (cIdx < craftPrompts.length && rhythmQueue.length < maxPrompts) {
      rhythmQueue.push(craftPrompts[cIdx++]);
    }
    if (sIdx < singleCandidates.length && rhythmQueue.length < maxPrompts) {
      rhythmQueue.push(singleCandidates[sIdx++].prompt);
    }
    if (sIdx < singleCandidates.length && rhythmQueue.length < maxPrompts) {
      rhythmQueue.push(singleCandidates[sIdx++].prompt);
    }
  }

  return rhythmQueue;
}
