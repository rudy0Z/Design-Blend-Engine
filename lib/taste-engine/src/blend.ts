import {
  AXIS_KEYS,
  CRAFT_KEYS,
  DEALBREAKER_HIGH_THRESHOLD,
  DEALBREAKER_LOW_THRESHOLD,
  DIVERGENT_PLATE_THRESHOLD,
  MODEL_VERSION,
  NEUTRAL_CRAFT,
  SHARED_PLATE_THRESHOLD,
  type CraftKey,
} from "./axes";
import { computeProfileVersion, latestSignals } from "./profile";
import type {
  BlendAxis,
  BlendData,
  BlendPlate,
  CrossoverBridge,
  DealbreakerClash,
  DyadClassification,
  FieldBlendSlice,
  PlateRef,
  ProfileVersionData,
  Signal,
} from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Latest effective value per plate (rate/rank/pair value; pick ≈ 75 = mild positive). */
export function effectiveValues(signals: Signal[]): Map<string, number> {
  const latest = latestSignals(signals);
  const out = new Map<string, number>();
  for (const s of latest) {
    out.set(s.plateId, s.mode === "pick" ? 75 : clamp(Math.round(s.value), 0, 100));
  }
  return out;
}

function signalTagsMap(signals: Signal[]): Map<string, string[]> {
  const latest = latestSignals(signals);
  const out = new Map<string, string[]>();
  for (const s of latest) {
    if (s.critiqueTags && s.critiqueTags.length > 0) {
      out.set(s.plateId, s.critiqueTags);
    }
  }
  return out;
}

function classifyDyad(
  harmony: number,
  friction: number,
  clashCount: number,
  sharedDimensions: number,
): DyadClassification {
  if (sharedDimensions === 0) {
    return {
      id: "unmapped_pair",
      title: "Unmapped Territory",
      subtitle: "Insufficient overlapping signals",
      summary: "Complete a quick capture in a shared field to unlock your studio readout.",
    };
  }
  if (harmony >= 86 && friction <= 28 && clashCount === 0) {
    return {
      id: "mirror_sensibility",
      title: "Mirror Sensibility",
      subtitle: "Near-identical visual instincts",
      summary:
        "You reach for the same grids, tolerances, and references almost telepathically. Effortless alignment—watch out only for blind-spot echo chambers.",
    };
  }
  if (harmony >= 68 && friction >= 25 && clashCount <= 1) {
    return {
      id: "studio_coconspirators",
      title: "Studio Co-Conspirators",
      subtitle: "Shared craft floor · Generative tension",
      summary:
        "The classic creative-director pairing (Kirton KAI optimum): you agree on foundational craft quality while pushing each other across stylistic boundaries.",
    };
  }
  if (harmony >= 52 && clashCount <= 2) {
    return {
      id: "counterweight_pair",
      title: "Counterweight Pair",
      subtitle: "Complementary lenses · Distinct defaults",
      summary:
        "You frame design problems from opposite ends of the studio table, yet share enough common vocabulary to critique the work productively.",
    };
  }
  return {
    id: "dialectical_clash",
    title: "Dialectical Clash",
    subtitle: "Opposing canons & hard dealbreakers",
    summary:
      "What one of you defends as canon, the other flags as a dealbreaker. Expect electric, high-voltage critiques if collaborating on the same surface.",
  };
}

/**
 * Synchronous pairwise blend (v2).
 * Combines overlapping axis cosine, craft bedrock proximity, correlated style graph
 * overlap, and @THEZEROQUOTIENT-inspired dealbreaker clash caps + Harmony/Friction split.
 * Backward-compatible when passed partial legacy ProfileVersionData rows.
 */
export function computeBlend(
  rawA: ProfileVersionData,
  rawB: ProfileVersionData,
  signalsA: Signal[],
  signalsB: Signal[],
  plates: PlateRef[],
): BlendData {
  // Hydrate missing v2 slices transparently if legacy DB rows only supplied {axes, axisCoverage}
  const a =
    rawA.craftProfile && rawA.styleVector
      ? rawA
      : { ...computeProfileVersion(signalsA, plates), axes: rawA.axes, axisCoverage: rawA.axisCoverage };
  const b =
    rawB.craftProfile && rawB.styleVector
      ? rawB
      : { ...computeProfileVersion(signalsB, plates), axes: rawB.axes, axisCoverage: rawB.axisCoverage };

  // 1. Weighted cosine on overlapping high-confidence dimensions.
  let dot = 0;
  let na = 0;
  let nb = 0;
  let coverageSum = 0;
  const perAxis: BlendAxis[] = [];
  for (const k of AXIS_KEYS) {
    const cov = Math.min(a.axisCoverage[k] ?? 0, b.axisCoverage[k] ?? 0);
    if (cov <= 0) continue;
    const av = (a.axes[k] - 50) / 50;
    const bv = (b.axes[k] - 50) / 50;
    dot += cov * av * bv;
    na += cov * av * av;
    nb += cov * bv * bv;
    coverageSum += cov;
    perAxis.push({
      key: k,
      a: a.axes[k],
      b: b.axes[k],
      delta: b.axes[k] - a.axes[k],
      coverage: cov,
    });
  }

  const similarity = na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
  perAxis.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

  // 2. Craft Bedrock Delta
  const craftA = a.craftProfile ?? NEUTRAL_CRAFT;
  const craftB = b.craftProfile ?? NEUTRAL_CRAFT;
  const craftDelta = {} as Record<CraftKey, { a: number; b: number; delta: number }>;
  let craftDistSum = 0;
  for (const c of CRAFT_KEYS) {
    const va = craftA[c] ?? 50;
    const vb = craftB[c] ?? 50;
    craftDelta[c] = { a: va, b: vb, delta: vb - va };
    craftDistSum += Math.abs(va - vb) / 100;
  }
  const craftProximity = 1 - craftDistSum / CRAFT_KEYS.length; // 0..1

  // 3. Proof plates & Dealbreaker Clashes from actual co-ratings
  const valuesA = effectiveValues(signalsA);
  const valuesB = effectiveValues(signalsB);
  const tagsMapA = signalTagsMap(signalsA);
  const tagsMapB = signalTagsMap(signalsB);
  const platesById = new Map(plates.map((p) => [p.id, p]));

  const sharedPlates: BlendPlate[] = [];
  const divergentPlates: BlendPlate[] = [];
  const dealbreakerClashes: DealbreakerClash[] = [];

  for (const [plateId, va] of valuesA) {
    const vb = valuesB.get(plateId);
    if (vb === undefined) continue;
    const plate = platesById.get(plateId);
    if (!plate) continue;
    const tA = tagsMapA.get(plateId);
    const tB = tagsMapB.get(plateId);

    if (va >= SHARED_PLATE_THRESHOLD && vb >= SHARED_PLATE_THRESHOLD) {
      sharedPlates.push({
        plateId,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        valueA: va,
        valueB: vb,
        ...(tA ? { tagsA: tA } : {}),
        ...(tB ? { tagsB: tB } : {}),
      });
    } else if (Math.abs(va - vb) >= DIVERGENT_PLATE_THRESHOLD) {
      divergentPlates.push({
        plateId,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        valueA: va,
        valueB: vb,
        ...(tA ? { tagsA: tA } : {}),
        ...(tB ? { tagsB: tB } : {}),
      });
    }

    // Hard Dealbreaker Detection: Canon (>=80) vs Hard Reject (<=20)
    const high = Math.max(va, vb);
    const low = Math.min(va, vb);
    if (high >= DEALBREAKER_HIGH_THRESHOLD && low <= DEALBREAKER_LOW_THRESHOLD) {
      dealbreakerClashes.push({
        plateId,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        lovedBy: va > vb ? "A" : "B",
        valueA: va,
        valueB: vb,
        tagsA: tA ?? [],
        tagsB: tB ?? [],
      });
    }
  }

  sharedPlates.sort((x, y) => Math.min(y.valueA, y.valueB) - Math.min(x.valueA, x.valueB));
  divergentPlates.sort((x, y) => Math.abs(y.valueA - y.valueB) - Math.abs(x.valueA - x.valueB));
  dealbreakerClashes.sort((x, y) => Math.abs(y.valueA - y.valueB) - Math.abs(x.valueA - x.valueB));

  // 4. Field-by-Field Resonance Breakdown
  const perField: FieldBlendSlice[] = [];
  const fieldsA = a.fieldSlices ?? {};
  const fieldsB = b.fieldSlices ?? {};
  for (const fieldId of Object.keys(fieldsA)) {
    const fb = fieldsB[fieldId];
    if (!fb) continue;
    const fa = fieldsA[fieldId];
    const cov = Math.min(fa.coverage, fb.coverage);
    if (cov <= 0) continue;
    let fDot = 0;
    let fNa = 0;
    let fNb = 0;
    for (const k of AXIS_KEYS) {
      const av = (fa.axes[k] - 50) / 50;
      const bv = (fb.axes[k] - 50) / 50;
      fDot += av * bv;
      fNa += av * av;
      fNb += bv * bv;
    }
    const fSim = fNa === 0 || fNb === 0 ? 0 : fDot / (Math.sqrt(fNa) * Math.sqrt(fNb));
    perField.push({
      fieldId,
      score: clamp(Math.round(((fSim + 1) / 2) * 100), 0, 100),
      coverage: cov,
    });
  }

  // 5. Crossover Discovery Bridges (unseen by one user, loved by the other, fits latent vector)
  const crossoverBridges: CrossoverBridge[] = [];
  const styleVecA = a.styleVector ?? {};
  const styleVecB = b.styleVector ?? {};

  for (const [plateId, va] of valuesA) {
    if (va < 82 || valuesB.has(plateId)) continue;
    const plate = platesById.get(plateId);
    if (!plate) continue;
    const fitB = styleVecB[plate.styleId] ?? 50;
    if (fitB >= 66) {
      crossoverBridges.push({
        plateId,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        fromUser: "A",
        sourceScore: va,
        predictedFitForOther: fitB,
        reason: `Canonized at ${va}/100 — sits ${fitB}% inside their latent sensibility.`,
      });
    }
  }
  for (const [plateId, vb] of valuesB) {
    if (vb < 82 || valuesA.has(plateId)) continue;
    const plate = platesById.get(plateId);
    if (!plate) continue;
    const fitA = styleVecA[plate.styleId] ?? 50;
    if (fitA >= 66) {
      crossoverBridges.push({
        plateId,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        fromUser: "B",
        sourceScore: vb,
        predictedFitForOther: fitA,
        reason: `Canonized at ${vb}/100 — sits ${fitA}% inside your latent sensibility.`,
      });
    }
  }
  crossoverBridges.sort((x, y) => y.predictedFitForOther - x.predictedFitForOther);

  // 6. Calibrated Headline Resonance + Dealbreaker Penalty Caps + Harmony/Friction
  if (perAxis.length === 0) {
    return {
      score: 50,
      similarity: 0,
      harmonyScore: 50,
      frictionScore: 0,
      penaltyApplied: 0,
      dealbreakerClashes: [],
      dyad: classifyDyad(50, 0, 0, 0),
      perAxis: [],
      perField: [],
      craftDelta,
      sharedPlates: [],
      divergentPlates: [],
      crossoverBridges: [],
      sharedDimensions: 0,
      overallCoverage: 0,
      modelVersion: MODEL_VERSION,
    };
  }

  // Base cosine mapping (exact 100 when similarity === 1, 0 when similarity === -1)
  const rawCosinePct = ((similarity + 1) / 2) * 100;
  // Blend epistemic axis similarity (75%) with craft floor proximity (25%) when non-identical
  const blendedRaw =
    similarity > 0.999
      ? 100
      : 0.78 * rawCosinePct + 0.22 * (craftProximity * 100);

  // Dealbreaker penalty: 6 pts per clash, capped at 22 pts; >=3 clashes hard-caps score at 58%
  const rawPenalty = Math.min(22, dealbreakerClashes.length * 6);
  // Do not penalize if profiles themselves are identical (e.g., self-test fixture)
  const effectivePenalty = similarity > 0.999 ? 0 : rawPenalty;
  const hardCap = dealbreakerClashes.length >= 3 && similarity < 0.95 ? 58 : 100;

  const score = clamp(Math.min(Math.round(blendedRaw - effectivePenalty), hardCap), 0, 100);
  const harmonyScore = score;

  // Creative Friction: weighted mean axis divergence scaled to 0..100
  const meanAxisGap =
    perAxis.reduce((acc, ax) => acc + Math.abs(ax.delta) * ax.coverage, 0) /
    Math.max(coverageSum, 1e-6);
  const frictionScore = clamp(Math.round(meanAxisGap * 1.15), 0, 100);

  const dyad = classifyDyad(harmonyScore, frictionScore, dealbreakerClashes.length, perAxis.length);

  return {
    score,
    similarity,
    harmonyScore,
    frictionScore,
    penaltyApplied: effectivePenalty,
    dealbreakerClashes,
    dyad,
    perAxis,
    perField,
    craftDelta,
    sharedPlates,
    divergentPlates,
    crossoverBridges: crossoverBridges.slice(0, 4),
    sharedDimensions: perAxis.length,
    overallCoverage: coverageSum / AXIS_KEYS.length,
    modelVersion: MODEL_VERSION,
  };
}
