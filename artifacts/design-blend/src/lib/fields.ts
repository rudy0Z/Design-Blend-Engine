export type FieldDef = {
  id: string;
  label: string;
  blurb: string;
  emoji: string;
};

export const FIELDS: FieldDef[] = [
  {
    id: "gd",
    label: "Graphic Design",
    blurb: "Posters, brand systems, editorial, type design, illustration.",
    emoji: "✶",
  },
  {
    id: "ui",
    label: "UI / UX Design",
    blurb: "Product surfaces, layout, color, motion, design systems.",
    emoji: "◐",
  },
];

export const AXIS_DEFS: Array<{ key: string; left: string; right: string }> = [
  { key: "order_chaos", left: "Order", right: "Chaos" },
  { key: "minimal_maximal", left: "Minimal", right: "Maximal" },
  { key: "classic_contemporary", left: "Classic", right: "Contemporary" },
  { key: "functional_expressive", left: "Functional", right: "Expressive" },
  { key: "warm_cold", left: "Warm", right: "Cold" },
  { key: "flat_dimensional", left: "Flat", right: "Dimensional" },
  { key: "literal_abstract", left: "Literal", right: "Abstract" },
  { key: "system_intuition", left: "System", right: "Intuition" },
];

export const FIELD_LABEL: Record<string, string> = {
  gd: "Graphic",
  ui: "UI / UX",
};
