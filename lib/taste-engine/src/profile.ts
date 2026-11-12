import {
  AXIS_KEYS,
  AXIS_META,
  COVERAGE_SATURATION,
  CRAFT_KEYS,
  DEALBREAKER_LOW_THRESHOLD,
  MODE_WEIGHTS,
  MODEL_VERSION,
  NEUTRAL_AXES,
  NEUTRAL_CRAFT,
  ZERO_COVERAGE,
  type AxisCoverage,
  type AxisKey,
  type AxisLoadings,
  type AxisScores,
  type CraftKey,
  type CraftLoadings,
  type CraftScores,
} from "./axes";
import { matchArchetype } from "./archetypes";
import type {
  CategoryAffinity,
  CreativeRange,
  FieldSlice,
  NegativeAnchor,
  PlateRef,
  ProfileVersionData,
  Signal,
  TopPlate,
} from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * Latest evidence wins: for each plate only the highest-sequence signal
 * contributes (a re-rate appends a new signal; it never mutates history).
 */
export function latestSignals(signals: Signal[]): Signal[] {
  const byPlate = new Map<string, Signal>();
  for (const s of signals) {
    const prev = byPlate.get(s.plateId);
    if (!prev || s.sequence > prev.sequence) byPlate.set(s.plateId, s);
  }
  return [...byPlate.values()].sort((a, b) => a.sequence - b.sequence);
}

/** Evidence contribution of a signal: agreement in -1..1 and its mode weight. */
export function signalContribution(s: Signal): { agreement: number; weight: number } {
  const weight = MODE_WEIGHTS[s.mode] ?? 1.0;
  if (s.mode === "pick") {
    return { agreement: 0.5, weight };
  }
  // Strong aversive acuity boost: visceral rejections (<=20) carry slightly
  // sharper diagnostic weight (Bourdieu/Wilk distaste asymmetry).
  const agreement = clamp((s.value - 50) / 50, -1, 1);
  const acuityMultiplier = s.value <= DEALBREAKER_LOW_THRESHOLD ? 1.15 : 1.0;
  return { agreement, weight: weight * acuityMultiplier };
}

/** Derive implicit craft loadings from axis loadings when explicit craftLoadings are absent. */
export function resolveCraftLoadings(plate: PlateRef): CraftLoadings {
  if (plate.craftLoadings && Object.keys(plate.craftLoadings).length > 0) {
    return plate.craftLoadings;
  }
  const a = plate.axisLoadings;
  return {
    density: clamp((a.minimal_maximal ?? 0) * 0.85 + (a.order_chaos ?? 0) * 0.15, -1, 1),
    typography: clamp((a.functional_expressive ?? 0) * 0.65 + (a.system_intuition ?? 0) * 0.35, -1, 1),
    chromatic: clamp(-(a.warm_cold ?? 0) * 0.35 + (a.minimal_maximal ?? 0) * 0.55, -1, 1),
    surface: clamp((a.flat_dimensional ?? 0) * 0.9, -1, 1),
  };
}

function computeAxisSet(
  signals: Signal[],
  platesById: Map<string, PlateRef>,
): { axes: AxisScores; axisCoverage: AxisCoverage; overallCoverage: number } {
  const sums: Record<string, number> = {};
  const weightSums: Record<string, number> = {};
  for (const k of AXIS_KEYS) {
    sums[k] = 0;
    weightSums[k] = 0;
  }

  for (const s of signals) {
    const plate = platesById.get(s.plateId);
    if (!plate) continue;
    const { agreement, weight } = signalContribution(s);
    for (const k of AXIS_KEYS) {
      const loading = plate.axisLoadings[k] ?? 0;
      if (loading === 0) continue;
      sums[k] += agreement * loading * weight;
      weightSums[k] += Math.abs(loading) * weight;
    }
  }

  const axes: AxisScores = { ...NEUTRAL_AXES };
  const axisCoverage: AxisCoverage = { ...ZERO_COVERAGE };
  for (const k of AXIS_KEYS) {
    if (weightSums[k] > 0) {
      const norm = sums[k] / weightSums[k];
      axes[k] = clamp(Math.round((norm + 1) * 50), 0, 100);
      axisCoverage[k] = clamp(weightSums[k] / COVERAGE_SATURATION, 0, 1);
    }
  }
  const overallCoverage =
    AXIS_KEYS.reduce((acc, k) => acc + axisCoverage[k], 0) / AXIS_KEYS.length;

  return { axes, axisCoverage, overallCoverage };
}

/**
 * Compute 12-dimensional structural lineage cosine kernel between two style descriptors.
 * Connects related styles across subcategories and creative fields without brittle manual edges.
 */
export function styleLineageSimilarity(
  aAxis: AxisLoadings,
  aCraft: CraftLoadings,
  bAxis: AxisLoadings,
  bCraft: CraftLoadings,
): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of AXIS_KEYS) {
    const va = aAxis[k] ?? 0;
    const vb = bAxis[k] ?? 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  for (const c of CRAFT_KEYS) {
    const va = (aCraft[c] ?? 0) * 0.7;
    const vb = (bCraft[c] ?? 0) * 0.7;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function detectCreativeRange(fieldSlices: Record<string, FieldSlice>): CreativeRange {
  const active = Object.values(fieldSlices).filter((f) => f.coverage >= 0.25 && f.ratedCount >= 2);
  if (active.length < 2) {
    return {
      hasDuality: false,
      maxDelta: 0,
      axisKey: null,
      fieldA: null,
      fieldB: null,
      summary: "Consistent sensibility within explored work.",
    };
  }

  let bestDelta = 0;
  let bestAxis: AxisKey | null = null;
  let bestPair: [FieldSlice, FieldSlice] | null = null;

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const fa = active[i];
      const fb = active[j];
      for (const k of AXIS_KEYS) {
        const d = Math.abs(fa.axes[k] - fb.axes[k]);
        if (d > bestDelta) {
          bestDelta = d;
          bestAxis = k;
          bestPair = [fa, fb];
        }
      }
    }
  }

  if (!bestAxis || !bestPair || bestDelta < 26) {
    return {
      hasDuality: false,
      maxDelta: bestDelta,
      axisKey: bestAxis,
      fieldA: bestPair?.[0].fieldId ?? null,
      fieldB: bestPair?.[1].fieldId ?? null,
      summary: "Unified cross-disciplinary grammar across branches.",
    };
  }

  const [fa, fb] = bestPair;
  const meta = AXIS_META[bestAxis];
  const lowField = fa.axes[bestAxis] <= fb.axes[bestAxis] ? fa : fb;
  const highField = lowField === fa ? fb : fa;
  const KNOWN_FIELD_LABELS: Record<string, string> = {
    "ui-ux": "Interface & Apps",
    graphic: "Graphic & Print",
    "graphic-design": "Graphic & Print",
    architecture: "Architecture & Spaces",
    industrial: "Industrial Objects",
    photography: "Photography & Film",
    fashion: "Fashion & Silhouette",
    "brand-type": "Brand & Lettering",
    motion: "Motion & Cinema",
    "motion-spatial": "Motion & Spatial",
    "spatial-3d": "3D & Experimental",
  };
  const formatField = (id: string) =>
    KNOWN_FIELD_LABELS[id] ??
    id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    hasDuality: true,
    maxDelta: bestDelta,
    axisKey: bestAxis,
    fieldA: lowField.fieldId,
    fieldB: highField.fieldId,
    summary: `Leans ${meta.left} in ${formatField(lowField.fieldId)}, yet shifts toward ${meta.right} in ${formatField(highField.fieldId)}.`,
  };
}

function deriveAuraColors(axes: AxisScores): [string, string, string] {
  // Deterministic HSL -> Hex mapping from thermal, expression, and order coordinates
  const hslToHex = (h: number, s: number, l: number): string => {
    const hue = ((h % 360) + 360) % 360;
    const sat = clamp(s, 0, 100) / 100;
    const lig = clamp(l, 0, 100) / 100;
    const k = (n: number) => (n + hue / 30) % 12;
    const a = sat * Math.min(lig, 1 - lig);
    const f = (n: number) =>
      Math.round(255 * (lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  };

  // Warm (0) -> Amber/Terracotta (18-38deg); Cold (100) -> Cobalt/Cyan (195-225deg)
  // Expressive shifts toward Coral/Lime/Magenta; Minimal keeps richer tonal restraint
  const baseHue =
    18 +
    (axes.warm_cold / 100) * 190 +
    ((axes.functional_expressive - 50) / 50) * 42 +
    ((axes.order_chaos - 50) / 50) * 24;
  const sat = 68 + (axes.minimal_maximal / 100) * 22;
  const primary = hslToHex(baseHue, sat, 56);
  const secondary = hslToHex(baseHue + 46 + (axes.system_intuition / 100) * 38, sat - 6, 48);
  const glow = hslToHex(baseHue - 28, sat + 8, 64);
  return [primary, secondary, glow];
}

/**
 * Compute an immutable profile version from append-only signals + the catalog.
 * Deterministic: same signals + same plates + same MODEL_VERSION => identical output.
 */
export function computeProfileVersion(
  rawSignals: Signal[],
  plates: PlateRef[],
): ProfileVersionData {
  const signals = latestSignals(rawSignals);
  const platesById = new Map(plates.map((p) => [p.id, p]));

  // 1. Global epistemic bedrock
  const { axes, axisCoverage, overallCoverage } = computeAxisSet(signals, platesById);

  // 2. 4-Axis Craft Bedrock
  const craftSums: Record<CraftKey, number> = { density: 0, typography: 0, chromatic: 0, surface: 0 };
  const craftWeights: Record<CraftKey, number> = { density: 0, typography: 0, chromatic: 0, surface: 0 };
  for (const s of signals) {
    const plate = platesById.get(s.plateId);
    if (!plate) continue;
    const { agreement, weight } = signalContribution(s);
    const cl = resolveCraftLoadings(plate);
    for (const c of CRAFT_KEYS) {
      const l = cl[c] ?? 0;
      if (l === 0) continue;
      // Direct controlled craft-strip variants get 1.35x precision weight
      const boost = plate.craftDimension === c ? 1.35 : 1.0;
      craftSums[c] += agreement * l * weight * boost;
      craftWeights[c] += Math.abs(l) * weight * boost;
    }
  }
  const craftProfile: CraftScores = { ...NEUTRAL_CRAFT };
  for (const c of CRAFT_KEYS) {
    if (craftWeights[c] > 0) {
      craftProfile[c] = clamp(Math.round((craftSums[c] / craftWeights[c] + 1) * 50), 0, 100);
    }
  }

  // 3. Field-scoped taste slices (preserving branch differences)
  const signalsByField = new Map<string, Signal[]>();
  for (const s of signals) {
    const plate = platesById.get(s.plateId);
    if (!plate) continue;
    const list = signalsByField.get(plate.fieldId) ?? [];
    list.push(s);
    signalsByField.set(plate.fieldId, list);
  }

  const fieldSlices: Record<string, FieldSlice> = {};
  for (const [fieldId, fSignals] of signalsByField) {
    const fSet = computeAxisSet(fSignals, platesById);
    const fArch = matchArchetype(fSet.axes);
    fieldSlices[fieldId] = {
      fieldId,
      axes: fSet.axes,
      coverage: fSet.overallCoverage,
      ratedCount: fSignals.length,
      archetypeTitle: fArch.archetype.title,
    };
  }

  // 4. Subcategory affinity map
  const catAcc = new Map<string, { fieldId: string; sum: number; weight: number; count: number }>();
  for (const s of signals) {
    const plate = platesById.get(s.plateId);
    if (!plate) continue;
    const effective = s.mode === "pick" ? 78 : clamp(Math.round(s.value), 0, 100);
    const w = MODE_WEIGHTS[s.mode] ?? 1;
    const cur = catAcc.get(plate.categoryId) ?? { fieldId: plate.fieldId, sum: 0, weight: 0, count: 0 };
    cur.sum += effective * w;
    cur.weight += w;
    cur.count += 1;
    catAcc.set(plate.categoryId, cur);
  }
  const categoryAffinity: Record<string, CategoryAffinity> = {};
  for (const [categoryId, cur] of catAcc) {
    categoryAffinity[categoryId] = {
      categoryId,
      fieldId: cur.fieldId,
      score: Math.round(cur.sum / Math.max(cur.weight, 1e-6)),
      count: cur.count,
    };
  }

  // 5. Correlated Style Graph Posterior (Direct Evidence + Structural Lineage Kernel)
  const styleAxisSums: Record<string, Partial<Record<AxisKey, number>>> = {};
  const styleCraftSums: Record<string, Partial<Record<CraftKey, number>>> = {};
  const styleCounts: Record<string, number> = {};
  for (const p of plates) {
    styleCounts[p.styleId] = (styleCounts[p.styleId] ?? 0) + 1;
    for (const k of AXIS_KEYS) {
      const l = p.axisLoadings[k];
      if (l !== undefined) {
        const acc = (styleAxisSums[p.styleId] ??= {});
        acc[k] = (acc[k] ?? 0) + l;
      }
    }
    const cl = resolveCraftLoadings(p);
    for (const c of CRAFT_KEYS) {
      const l = cl[c];
      if (l !== undefined) {
        const acc = (styleCraftSums[p.styleId] ??= {});
        acc[c] = (acc[c] ?? 0) + l;
      }
    }
  }

  const styleDescriptors = new Map<string, { axis: AxisLoadings; craft: CraftLoadings }>();
  for (const styleId of Object.keys(styleCounts)) {
    const n = styleCounts[styleId];
    const axis = Object.fromEntries(
      Object.entries(styleAxisSums[styleId] ?? {}).map(([k, v]) => [k, (v as number) / n]),
    ) as AxisLoadings;
    const craft = Object.fromEntries(
      Object.entries(styleCraftSums[styleId] ?? {}).map(([k, v]) => [k, (v as number) / n]),
    ) as CraftLoadings;
    styleDescriptors.set(styleId, { axis, craft });
  }

  // Observed direct ratings per style
  const observedByStyle = new Map<string, { sum: number; count: number }>();
  for (const s of signals) {
    const plate = platesById.get(s.plateId);
    if (!plate) continue;
    const val = s.mode === "pick" ? 78 : clamp(Math.round(s.value), 0, 100);
    const cur = observedByStyle.get(plate.styleId) ?? { sum: 0, count: 0 };
    cur.sum += val;
    cur.count += 1;
    observedByStyle.set(plate.styleId, cur);
  }

  const signedAxes: Record<string, number> = {};
  for (const k of AXIS_KEYS) signedAxes[k] = (axes[k] - 50) / 50;

  const styleVector: Record<string, number> = {};
  for (const [styleId, desc] of styleDescriptors) {
    // Baseline axis projection
    let s = 0;
    let w = 0;
    for (const k of AXIS_KEYS) {
      const l = desc.axis[k] ?? 0;
      s += signedAxes[k] * l;
      w += Math.abs(l);
    }
    const axisProj = w > 0 ? clamp(((s / w + 1) * 50), 0, 100) : 50;

    // Lineage kernel propagation from observed styles
    let kernelNum = 0;
    let kernelDen = 0;
    for (const [obsStyleId, obs] of observedByStyle) {
      if (obsStyleId === styleId) continue;
      const obsDesc = styleDescriptors.get(obsStyleId);
      if (!obsDesc) continue;
      const sim = styleLineageSimilarity(desc.axis, desc.craft, obsDesc.axis, obsDesc.craft);
      if (Math.abs(sim) < 0.35) continue;
      const obsMean = obs.sum / obs.count;
      const propagated = sim >= 0 ? obsMean : 100 - obsMean;
      const edgeWeight = Math.abs(sim) * 0.45;
      kernelNum += propagated * edgeWeight;
      kernelDen += edgeWeight;
    }

    const priorScore =
      kernelDen > 0 ? 0.65 * axisProj + 0.35 * (kernelNum / kernelDen) : axisProj;

    const direct = observedByStyle.get(styleId);
    if (direct) {
      const directMean = direct.sum / direct.count;
      styleVector[styleId] = clamp(Math.round(0.75 * directMean + 0.25 * priorScore), 0, 100);
    } else {
      styleVector[styleId] = clamp(Math.round(priorScore), 0, 100);
    }
  }

  // 6. Top plates (actually rated, best first) & Negative Anchors (aversive dealbreakers)
  const evaluatedPlates = signals
    .map((s) => {
      const plate = platesById.get(s.plateId);
      if (!plate) return null;
      const value = s.mode === "pick" ? 100 : clamp(Math.round(s.value), 0, 100);
      return {
        plateId: plate.id,
        styleId: plate.styleId,
        label: plate.label,
        imageUrl: plate.imageUrl,
        value,
        mode: s.mode,
        ...(s.critiqueTags && s.critiqueTags.length > 0 ? { critiqueTags: s.critiqueTags } : {}),
      } satisfies TopPlate;
    })
    .filter((t): t is TopPlate => t !== null);

  const topPlates: TopPlate[] = [...evaluatedPlates]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const negativeAnchors: NegativeAnchor[] = evaluatedPlates
    .filter((t) => t.value <= DEALBREAKER_LOW_THRESHOLD)
    .sort((a, b) => a.value - b.value)
    .slice(0, 6)
    .map((t) => ({
      plateId: t.plateId,
      styleId: t.styleId,
      label: t.label,
      imageUrl: t.imageUrl,
      value: t.value,
      critiqueTags: t.critiqueTags ?? [],
    }));

  // 7. Critique Tag Signature
  const critiqueCounts: Record<string, number> = {};
  for (const s of signals) {
    for (const tag of s.critiqueTags ?? []) {
      critiqueCounts[tag] = (critiqueCounts[tag] ?? 0) + 1;
    }
  }

  // 8. Creative Range, Aura & Archetype
  const creativeRange = detectCreativeRange(fieldSlices);
  const auraColors = deriveAuraColors(axes);
  const { archetype, confidence } = matchArchetype(axes);

  return {
    axes,
    axisCoverage,
    overallCoverage,
    craftProfile,
    fieldSlices,
    categoryAffinity,
    styleVector,
    topPlates,
    negativeAnchors,
    critiqueCounts,
    creativeRange,
    auraColors,
    archetype: { id: archetype.id, title: archetype.title, confidence },
    modelVersion: MODEL_VERSION,
    ratedCount: evaluatedPlates.length,
  };
}
