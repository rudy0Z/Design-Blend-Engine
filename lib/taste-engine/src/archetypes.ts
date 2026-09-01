import type { AxisKey, AxisScores } from "./axes";

export type Archetype = {
  id: string;
  title: string;
  description: string;
  color: string;
  famousExamples: string[];
  conditions: Partial<Record<AxisKey, [number, number]>>;
};

// 32 archetypes spanning the 8-axis taste space.
// Each condition is a [min, max] inclusive range in 0..100 axis space.
export const ARCHETYPES: Archetype[] = [
  {
    id: "the_systemist",
    title: "The Systemist",
    description:
      "You think in grids, tokens, and rules. You build the infrastructure other designers work within. Helvetica was a system. So was the iPhone.",
    color: "#1a1a2e",
    famousExamples: ["Massimo Vignelli", "Josef Müller-Brockmann", "Paul Rand"],
    conditions: { order_chaos: [0, 30], system_intuition: [0, 30], functional_expressive: [0, 40] },
  },
  {
    id: "the_maximalist",
    title: "The Maximalist",
    description:
      "You believe empty space is wasted opportunity. Your work is layered, dense, and deliberately overwhelming. Every pixel is a decision.",
    color: "#ff3366",
    famousExamples: ["Paula Scher", "Stefan Sagmeister"],
    conditions: { minimal_maximal: [70, 100], order_chaos: [50, 100] },
  },
  {
    id: "the_brutalist",
    title: "The Brutalist",
    description:
      "You find beauty in rawness. Your designs expose their own structure. Anti-aesthetic is still an aesthetic — and yours is more considered than it looks.",
    color: "#111111",
    famousExamples: ["Experimental Jetset", "Bloomberg Businessweek"],
    conditions: { order_chaos: [60, 100], warm_cold: [0, 40], functional_expressive: [60, 100] },
  },
  {
    id: "the_expressionist",
    title: "The Expressionist",
    description:
      "Feeling first, system second. Your work is emotionally direct. The best design, to you, makes someone feel something before they understand it.",
    color: "#6a0dad",
    famousExamples: ["David Carson", "Neville Brody"],
    conditions: { functional_expressive: [70, 100], system_intuition: [60, 100] },
  },
  {
    id: "the_classicist",
    title: "The Classicist",
    description:
      "You draw from history with intention, not nostalgia. Proportion, craft, and time-tested principles guide your hand. You know what endures.",
    color: "#8b6914",
    famousExamples: ["Massimo Vignelli", "Hermann Zapf"],
    conditions: { classic_contemporary: [0, 35], order_chaos: [0, 40] },
  },
  {
    id: "the_minimalist",
    title: "The Minimalist",
    description:
      "You subtract until something essential remains. Your restraint is active, not passive. Every element that stays does so because removing it would be a loss.",
    color: "#f5f5f0",
    famousExamples: ["Dieter Rams", "Kenya Hara"],
    conditions: { minimal_maximal: [0, 30], order_chaos: [0, 40] },
  },
  {
    id: "the_experimenter",
    title: "The Experimenter",
    description:
      "Existing categories bore you. Your strongest work happens when you don't know what you're making yet. You treat every project as a research question.",
    color: "#00ff88",
    famousExamples: ["Cranbrook Academy", "Emigre"],
    conditions: { system_intuition: [60, 100], literal_abstract: [60, 100] },
  },
  {
    id: "the_conceptualist",
    title: "The Conceptualist",
    description:
      "The idea is the design. Execution is secondary to the strength of the concept. You'd rather have a weak execution of a strong idea than the reverse.",
    color: "#4040ff",
    famousExamples: ["Stefan Sagmeister", "Sadek Bazaraa"],
    conditions: { literal_abstract: [70, 100], functional_expressive: [60, 100] },
  },
  {
    id: "the_humanist",
    title: "The Humanist",
    description:
      "Warmth is your discipline. Your design feels handmade even when it isn't. You believe friendliness is a craft, not a default.",
    color: "#e07b5a",
    famousExamples: ["Mailchimp", "Duolingo design"],
    conditions: { warm_cold: [0, 35], functional_expressive: [50, 100] },
  },
  {
    id: "the_technocrat",
    title: "The Technocrat",
    description:
      "Cold, precise, optimized. You design for systems and operators. Every pixel has a purpose, and decoration is suspect.",
    color: "#0f3057",
    famousExamples: ["Bloomberg Terminal", "Linear"],
    conditions: { warm_cold: [65, 100], functional_expressive: [0, 35], system_intuition: [0, 40] },
  },
  {
    id: "the_futurist",
    title: "The Futurist",
    description:
      "You design for the world that hasn't shipped yet. Gradients, depth, motion, AI — your vocabulary is tomorrow's defaults.",
    color: "#5c33ff",
    famousExamples: ["Vision Pro design", "Stripe"],
    conditions: { classic_contemporary: [70, 100], flat_dimensional: [55, 100] },
  },
  {
    id: "the_archivist",
    title: "The Archivist",
    description:
      "You collect references like a curator. Historical rigor beats novelty for you. Every project is a conversation with what came before.",
    color: "#3e2c1c",
    famousExamples: ["Stripe Press", "Standards Manual"],
    conditions: { classic_contemporary: [0, 30], system_intuition: [0, 45] },
  },
  {
    id: "the_typographer",
    title: "The Typographer",
    description:
      "Type isn't a layer. It's the design. You can spot a tracking error from across the room and you have opinions about every font on this page.",
    color: "#1f1f1f",
    famousExamples: ["Erik Spiekermann", "Jessica Hische"],
    conditions: { functional_expressive: [50, 100], order_chaos: [25, 70] },
  },
  {
    id: "the_storyteller",
    title: "The Storyteller",
    description:
      "Narrative leads. Your designs unfold — they have a beginning, middle, and reveal. You think in scenes more than screens.",
    color: "#a64d2d",
    famousExamples: ["Apple product pages", "NYT interactive"],
    conditions: { functional_expressive: [60, 100], flat_dimensional: [40, 100] },
  },
  {
    id: "the_rebel",
    title: "The Rebel",
    description:
      "You design against. Anti-corporate, anti-template, anti-safe. The discomfort is the message.",
    color: "#9b0000",
    famousExamples: ["Jamie Reid", "Punk poster tradition"],
    conditions: { order_chaos: [70, 100], minimal_maximal: [50, 100], system_intuition: [60, 100] },
  },
  {
    id: "the_craftsperson",
    title: "The Craftsperson",
    description:
      "Material thinking. Texture, print, ink, the weight of things. Even when you work digitally, your work has hands behind it.",
    color: "#704214",
    famousExamples: ["Risograph studios", "Letterpress revival"],
    conditions: { warm_cold: [0, 40], classic_contemporary: [0, 50] },
  },
  {
    id: "the_modernist",
    title: "The Modernist",
    description:
      "Form follows function, but form still matters. You inherit Bauhaus and Swiss principles and apply them to whatever century you're in.",
    color: "#202830",
    famousExamples: ["Dieter Rams", "Massimo Vignelli"],
    conditions: { order_chaos: [0, 35], minimal_maximal: [0, 45], classic_contemporary: [25, 65] },
  },
  {
    id: "the_postmodernist",
    title: "The Postmodernist",
    description:
      "Rules are quotation marks. You sample, distort, and recombine. Irony and sincerity coexist in your work.",
    color: "#d946ef",
    famousExamples: ["April Greiman", "Memphis Group"],
    conditions: { order_chaos: [55, 100], system_intuition: [55, 100], functional_expressive: [55, 100] },
  },
  {
    id: "the_curator",
    title: "The Curator",
    description:
      "You design less and select more. The hardest decisions are what to leave out. Your work feels effortless because everything in it has earned its spot.",
    color: "#6b7280",
    famousExamples: ["Aesop", "Kinfolk"],
    conditions: { minimal_maximal: [0, 35], system_intuition: [0, 50], warm_cold: [25, 70] },
  },
  {
    id: "the_dreamer",
    title: "The Dreamer",
    description:
      "Atmosphere over information. Color, light, mood. Your work doesn't always explain itself — it just makes people stay.",
    color: "#7c3aed",
    famousExamples: ["Aurora gradient era", "Mesh era apps"],
    conditions: { functional_expressive: [60, 100], flat_dimensional: [55, 100], warm_cold: [0, 50] },
  },
  {
    id: "the_engineer",
    title: "The Engineer",
    description:
      "You design like you ship code. Tokens, primitives, components, contracts. Other designers are users of your design system.",
    color: "#0d9488",
    famousExamples: ["Material Design team", "Polaris (Shopify)"],
    conditions: { system_intuition: [0, 30], order_chaos: [0, 35], functional_expressive: [0, 45] },
  },
  {
    id: "the_provocateur",
    title: "The Provocateur",
    description:
      "You design to make people argue. The reaction is the metric. Comfort is the failure state.",
    color: "#ff006e",
    famousExamples: ["Stefan Sagmeister", "Barbara Kruger"],
    conditions: { functional_expressive: [70, 100], minimal_maximal: [55, 100] },
  },
  {
    id: "the_naturalist",
    title: "The Naturalist",
    description:
      "Organic forms, earth palettes, hand-drawn marks. Your design is downstream of botany and geology, not screens.",
    color: "#2f6f4f",
    famousExamples: ["Aesop", "Pangaia"],
    conditions: { warm_cold: [0, 35], order_chaos: [40, 80], flat_dimensional: [30, 80] },
  },
  {
    id: "the_machinist",
    title: "The Machinist",
    description:
      "Repetition, modularity, industrial logic. You like systems that scale to a million units without losing their soul.",
    color: "#4a4a4a",
    famousExamples: ["Otl Aicher", "Wim Crouwel"],
    conditions: { order_chaos: [0, 30], warm_cold: [55, 100], system_intuition: [0, 35] },
  },
  {
    id: "the_visualizer",
    title: "The Visualizer",
    description:
      "You make data sing. Chart logic, infographic literacy, information density without confusion. Form serves comprehension.",
    color: "#1d4ed8",
    famousExamples: ["Edward Tufte", "Moritz Stefaner"],
    conditions: { literal_abstract: [0, 40], functional_expressive: [0, 40], order_chaos: [0, 40] },
  },
  {
    id: "the_mythmaker",
    title: "The Mythmaker",
    description:
      "Brand as cosmology. Your identities feel like they have lore. Designers describe them as 'a world,' which is exactly the point.",
    color: "#7e22ce",
    famousExamples: ["Pentagram identities", "MIT Media Lab"],
    conditions: { literal_abstract: [60, 100], system_intuition: [40, 90] },
  },
  {
    id: "the_cinematographer",
    title: "The Cinematographer",
    description:
      "You design in time. Easings, transitions, pacing. Your interfaces feel directed — there's a camera behind them.",
    color: "#1f2937",
    famousExamples: ["Apple product reveals", "Title sequence designers"],
    conditions: { flat_dimensional: [55, 100], functional_expressive: [50, 100] },
  },
  {
    id: "the_strategist",
    title: "The Strategist",
    description:
      "Design serves the brief, the brief serves the business. Beauty is welcome but performance is the receipt.",
    color: "#0f172a",
    famousExamples: ["Pentagram", "Most great agency leads"],
    conditions: { functional_expressive: [0, 40], system_intuition: [0, 45], classic_contemporary: [35, 75] },
  },
  {
    id: "the_optimist",
    title: "The Optimist",
    description:
      "Color, roundness, friendliness, joy. Your work makes people smile before it makes them think. That's a feature, not a flaw.",
    color: "#f472b6",
    famousExamples: ["Mailchimp", "Duolingo"],
    conditions: { warm_cold: [0, 30], flat_dimensional: [50, 100], minimal_maximal: [40, 90] },
  },
  {
    id: "the_iconoclast",
    title: "The Iconoclast",
    description:
      "You break the rules you mastered. Your work looks effortless because the discipline is invisible.",
    color: "#dc2626",
    famousExamples: ["Wolfgang Weingart", "April Greiman"],
    conditions: { system_intuition: [60, 100], order_chaos: [55, 100], functional_expressive: [50, 100] },
  },
  {
    id: "the_quiet_radical",
    title: "The Quiet Radical",
    description:
      "Subtle, restrained, but always pushing. Your most subversive moves look like the most obvious choice — until you copy them.",
    color: "#334155",
    famousExamples: ["Linear", "Stripe"],
    conditions: { minimal_maximal: [0, 35], classic_contemporary: [55, 100], functional_expressive: [25, 60] },
  },
  {
    id: "the_polymath",
    title: "The Polymath",
    description:
      "You refuse a single lane. Type, motion, brand, product — everything is one practice to you. Your portfolio reads like an anthology.",
    color: "#d97706",
    famousExamples: ["Bruno Munari", "Tibor Kalman"],
    conditions: {},
  },
];

export function matchArchetype(axes: AxisScores): { archetype: Archetype; confidence: number } {
  const polymath = ARCHETYPES.find((a) => Object.keys(a.conditions).length === 0)!;
  let best: Archetype | null = null;
  let bestRatio = -1;
  let bestFullMatch = false;
  let bestSpecificity = -1;
  for (const a of ARCHETYPES) {
    const conds = Object.entries(a.conditions) as [keyof AxisScores, [number, number]][];
    if (conds.length === 0) continue; // polymath handled as fallback below
    let hits = 0;
    let nearMissScore = 0;
    for (const [axis, [min, max]] of conds) {
      const v = axes[axis];
      if (v >= min && v <= max) {
        hits += 1;
      } else {
        const distance = v < min ? min - v : v - max;
        nearMissScore += Math.max(0, 1 - distance / 30);
      }
    }
    const ratio = (hits + nearMissScore * 0.3) / conds.length;
    const fullMatch = hits === conds.length;
    // Prefer (fullMatch) > (higher ratio) > (more specific archetype)
    const better =
      (fullMatch && !bestFullMatch) ||
      (fullMatch === bestFullMatch && ratio > bestRatio + 1e-6) ||
      (fullMatch === bestFullMatch && Math.abs(ratio - bestRatio) <= 1e-6 && conds.length > bestSpecificity);
    if (better) {
      best = a;
      bestRatio = ratio;
      bestFullMatch = fullMatch;
      bestSpecificity = conds.length;
    }
  }
  // No archetype is even a half-decent fit → Polymath
  if (!best || (!bestFullMatch && bestRatio < 0.5)) {
    return { archetype: polymath, confidence: Math.max(0, Math.min(1, bestRatio)) };
  }
  return { archetype: best, confidence: Math.max(0, Math.min(1, bestRatio)) };
}
