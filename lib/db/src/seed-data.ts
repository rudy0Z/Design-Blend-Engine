import type { InsertStyleNode } from "./schema";

type Axes = [number, number, number, number, number, number, number, number];
const AXIS_KEYS = [
  "order_chaos",
  "minimal_maximal",
  "classic_contemporary",
  "functional_expressive",
  "warm_cold",
  "flat_dimensional",
  "literal_abstract",
  "system_intuition",
] as const;

function axes(a: Axes) {
  return Object.fromEntries(AXIS_KEYS.map((k, i) => [k, a[i]])) as InsertStyleNode["axisLoadings"];
}

// Curated Unsplash photo IDs per category — a single representative image is
// reused for all nodes within a category so each card shows something visually
// on-theme rather than a totally random placeholder. The follow-up task swaps
// these for per-style hero imagery.
const CATEGORY_IMAGE: Record<string, string> = {
  "Visual Language": "1517694712202-14dd9538aa97",
  "Layout": "1499951360447-b19be8fe80f5",
  "Color": "1557672172-298e090bd0f1",
  "Typography": "1499914485622-a88fac536970",
  "Product Type": "1551434678-e076c223a692",
  "UX": "1551434678-e076c223a692",
  "Motion": "1518770660439-4636190af475",
  "Poster": "1542379813-c69a4f4c8f76",
  "Brand": "1611162617213-7d7a39e9b1d7",
  "Editorial": "1488972685288-c3fd157d7c7a",
  "Type Design": "1455390582262-044cdead277a",
  "Illustration": "1513364776144-60967b0f800f",
  "Packaging": "1583394838336-acd977736f90",
  "Environmental": "1497366216548-37526070297c",
};

function img(category: string, id: string) {
  const photo = CATEGORY_IMAGE[category] ?? "1517694712202-14dd9538aa97";
  return `https://images.unsplash.com/photo-${photo}?w=800&q=80&auto=format&fit=crop&sig=${id}`;
}

type SeedRow = {
  id: string;
  label: string;
  field: "ui" | "gd";
  domain: string;
  visualCharacter: string;
  referencePoint?: string;
  ax: Axes;
  parent?: string;
  children?: string[];
  neighbors?: string[];
  contrasts?: string[];
  popularity?: number;
};

const rows: SeedRow[] = [
  // ───── UI: Visual Design Language (10) ─────
  { id: "ui_flat_minimal", label: "Flat Minimal", field: "ui", domain: "Visual Language",
    visualCharacter: "Pure surfaces, no shadows, geometric primitives, generous whitespace",
    referencePoint: "Material 3, Stripe, Linear",
    ax: [-0.9, -0.9, 0.7, -0.8, 0.4, -0.9, -0.2, -0.9],
    neighbors: ["ui_dark_editorial", "ui_b2b_saas", "gd_swiss_intl"], contrasts: ["ui_brutalist", "ui_skeuomorphic", "ui_claymorphism"], popularity: 0.95 },
  { id: "ui_glassmorphism", label: "Glassmorphism", field: "ui", domain: "Visual Language",
    visualCharacter: "Frosted blur layers, translucent panels, vibrant backdrops",
    referencePoint: "macOS Big Sur, iOS Control Center",
    ax: [-0.4, 0.1, 0.6, 0.3, 0.2, 0.7, 0.1, -0.3],
    neighbors: ["ui_aurora_gradient", "ui_dark_editorial"], contrasts: ["ui_flat_minimal", "ui_brutalist"], popularity: 0.7 },
  { id: "ui_neumorphism", label: "Neumorphism", field: "ui", domain: "Visual Language",
    visualCharacter: "Soft extruded shapes, dual shadows, monochrome surfaces",
    ax: [-0.6, -0.4, 0.2, 0.0, -0.1, 0.8, -0.3, -0.4],
    neighbors: ["ui_claymorphism", "ui_skeuomorphic"], contrasts: ["ui_flat_minimal", "ui_brutalist"], popularity: 0.4 },
  { id: "ui_brutalist", label: "Brutalist UI", field: "ui", domain: "Visual Language",
    visualCharacter: "Raw HTML aesthetic, system fonts, harsh borders, intentional ugliness",
    referencePoint: "Yale School, Bloomberg, Are.na",
    ax: [0.8, 0.6, 0.9, 0.9, 0.3, -0.6, 0.4, 0.8],
    neighbors: ["gd_punk_zine", "ui_dark_editorial"], contrasts: ["ui_flat_minimal", "ui_neumorphism", "ui_aurora_gradient"], popularity: 0.55 },
  { id: "ui_dark_editorial", label: "Dark Editorial", field: "ui", domain: "Visual Language",
    visualCharacter: "Dark canvas, serif headlines, image-led, magazine pacing",
    referencePoint: "Vogue, NYT, Apple Music",
    ax: [-0.3, 0.0, 0.4, 0.5, 0.5, 0.1, 0.0, 0.3],
    neighbors: ["ui_dark_mode_first", "gd_magazine_classic", "ui_oversized_type"], contrasts: ["ui_light_mode_pure", "ui_flat_minimal"], popularity: 0.7 },
  { id: "ui_bento_grid", label: "Bento Grid", field: "ui", domain: "Visual Language",
    visualCharacter: "Modular tiles of varied sizes, colorful corners, summary blocks",
    referencePoint: "Apple keynotes, Linear marketing",
    ax: [-0.5, 0.3, 0.9, 0.2, 0.0, -0.1, -0.1, -0.4],
    neighbors: ["ui_flat_minimal", "ui_grid_strict"], contrasts: ["ui_brutalist", "ui_skeuomorphic"], popularity: 0.85 },
  { id: "ui_claymorphism", label: "Claymorphism", field: "ui", domain: "Visual Language",
    visualCharacter: "Puffy 3D shapes, candy palettes, rounded everything, playful",
    ax: [-0.3, 0.4, 0.6, 0.7, -0.7, 0.9, 0.2, 0.3],
    neighbors: ["gd_3d_illustration", "ui_consumer_app"], contrasts: ["ui_flat_minimal", "ui_brutalist", "ui_b2b_saas"], popularity: 0.6 },
  { id: "ui_skeuomorphic", label: "Skeuomorphic", field: "ui", domain: "Visual Language",
    visualCharacter: "Real-world textures, leather, paper, brushed metal",
    referencePoint: "iOS 6, classic Mac apps",
    ax: [-0.1, 0.5, -0.9, 0.4, -0.2, 0.9, -0.9, -0.2],
    neighbors: ["ui_neumorphism"], contrasts: ["ui_flat_minimal", "ui_brutalist"], popularity: 0.2 },
  { id: "ui_aurora_gradient", label: "Aurora Gradient", field: "ui", domain: "Visual Language",
    visualCharacter: "Vivid mesh gradients, glow halos, dark canvas pop",
    referencePoint: "Stripe, Vercel, Framer marketing",
    ax: [-0.2, 0.4, 0.9, 0.6, 0.1, 0.5, 0.3, 0.0],
    neighbors: ["ui_glassmorphism", "ui_dark_mode_first", "gd_gradient_brand"], contrasts: ["ui_brutalist", "gd_swiss_intl"], popularity: 0.8 },
  { id: "ui_retro_computing", label: "Retro Computing", field: "ui", domain: "Visual Language",
    visualCharacter: "Pixel fonts, CRT bevels, OS 7 chrome, command-line nostalgia",
    ax: [0.2, 0.3, -0.8, 0.5, -0.3, 0.4, -0.2, 0.4],
    neighbors: ["ui_brutalist", "gd_punk_zine"], contrasts: ["ui_flat_minimal", "ui_aurora_gradient"], popularity: 0.45 },

  // ───── UI: Layout (6) ─────
  { id: "ui_grid_strict", label: "Strict Grid", field: "ui", domain: "Layout",
    visualCharacter: "12-col baseline grid, perfect rhythm, modular rows",
    ax: [-0.95, -0.5, 0.2, -0.7, 0.3, -0.6, -0.4, -0.95],
    neighbors: ["gd_swiss_intl", "ui_b2b_saas", "ui_bento_grid"], contrasts: ["ui_asymmetric", "ui_brutalist"], popularity: 0.85 },
  { id: "ui_asymmetric", label: "Asymmetric Layout", field: "ui", domain: "Layout",
    visualCharacter: "Off-grid placement, dynamic whitespace, unexpected scale",
    ax: [0.5, 0.2, 0.7, 0.7, 0.0, 0.0, 0.3, 0.6],
    neighbors: ["gd_editorial_expressive", "ui_scroll_storytelling"], contrasts: ["ui_grid_strict", "gd_swiss_intl"], popularity: 0.5 },
  { id: "ui_fullbleed", label: "Full-Bleed Hero", field: "ui", domain: "Layout",
    visualCharacter: "Edge-to-edge imagery, oversized type, cinematic intros",
    ax: [-0.2, 0.6, 0.6, 0.6, 0.0, 0.4, 0.0, -0.1],
    neighbors: ["ui_oversized_type", "ui_dark_editorial"], contrasts: ["ui_dashboard_dense"], popularity: 0.7 },
  { id: "ui_dashboard_dense", label: "Dashboard Dense", field: "ui", domain: "Layout",
    visualCharacter: "Information-rich tables, sparklines, tight spacing",
    referencePoint: "Bloomberg Terminal, Datadog",
    ax: [-0.6, 0.4, 0.2, -0.95, 0.6, -0.5, -0.6, -0.9],
    neighbors: ["ui_b2b_saas", "ui_developer_tool", "gd_data_editorial"], contrasts: ["ui_spacious_minimal", "ui_consumer_app"], popularity: 0.55 },
  { id: "ui_spacious_minimal", label: "Spacious Minimal", field: "ui", domain: "Layout",
    visualCharacter: "Generous whitespace, single focus per screen, calm pacing",
    ax: [-0.95, -0.95, 0.3, -0.4, 0.3, -0.7, -0.1, -0.7],
    neighbors: ["ui_flat_minimal", "ui_type_minimal", "gd_editorial_minimal"], contrasts: ["ui_dashboard_dense", "ui_brutalist"], popularity: 0.8 },
  { id: "ui_scroll_storytelling", label: "Scroll Storytelling", field: "ui", domain: "Layout",
    visualCharacter: "Long scroll, reveal animations, narrative pacing",
    ax: [0.0, 0.3, 0.6, 0.8, 0.2, 0.3, 0.2, 0.5],
    neighbors: ["ui_cinematic_transition", "ui_fullbleed"], contrasts: ["ui_dashboard_dense"], popularity: 0.6 },

  // ───── UI: Color (6) ─────
  { id: "ui_neutral_dominant", label: "Neutral Dominant", field: "ui", domain: "Color",
    visualCharacter: "Greys and warm whites, single accent color",
    ax: [-0.8, -0.8, 0.4, -0.6, 0.0, -0.3, -0.2, -0.6],
    neighbors: ["ui_flat_minimal", "ui_b2b_saas", "ui_spacious_minimal"], contrasts: ["ui_vibrant_brand", "ui_neon_accent"], popularity: 0.85 },
  { id: "ui_vibrant_brand", label: "Vibrant Brand Color", field: "ui", domain: "Color",
    visualCharacter: "Saturated primary, color-as-identity, playful confidence",
    ax: [-0.2, 0.5, 0.5, 0.7, -0.3, 0.0, 0.0, 0.0],
    neighbors: ["ui_consumer_app", "gd_pictorial_abstract"], contrasts: ["ui_monochrome_pure", "ui_neutral_dominant"], popularity: 0.7 },
  { id: "ui_dark_mode_first", label: "Dark Mode First", field: "ui", domain: "Color",
    visualCharacter: "Designed for dark, neon accents, OLED true black",
    ax: [-0.3, 0.0, 0.6, 0.3, 0.6, 0.1, 0.0, 0.0],
    neighbors: ["ui_dark_editorial", "ui_aurora_gradient", "ui_developer_tool"], contrasts: ["ui_light_mode_pure"], popularity: 0.8 },
  { id: "ui_light_mode_pure", label: "Light Mode Pure", field: "ui", domain: "Color",
    visualCharacter: "Bright whites, soft shadows, daylight calm",
    ax: [-0.6, -0.6, 0.4, -0.4, -0.5, -0.4, -0.2, -0.6],
    neighbors: ["ui_flat_minimal", "ui_spacious_minimal"], contrasts: ["ui_dark_mode_first", "ui_dark_editorial"], popularity: 0.75 },
  { id: "ui_neon_accent", label: "Neon Accent", field: "ui", domain: "Color",
    visualCharacter: "Electric highlights against dark, retro-future glow",
    ax: [0.1, 0.4, 0.7, 0.6, 0.5, 0.3, 0.2, 0.2],
    neighbors: ["ui_dark_mode_first", "ui_aurora_gradient", "ui_retro_computing"], contrasts: ["ui_neutral_dominant", "gd_swiss_intl"], popularity: 0.55 },
  { id: "ui_monochrome_pure", label: "Monochrome", field: "ui", domain: "Color",
    visualCharacter: "Single hue or strict greyscale, type-led",
    ax: [-0.7, -0.7, 0.3, -0.3, 0.2, -0.5, -0.1, -0.5],
    neighbors: ["gd_swiss_intl", "ui_type_minimal", "ui_flat_minimal"], contrasts: ["ui_vibrant_brand", "ui_aurora_gradient"], popularity: 0.6 },

  // ───── UI: Typography (4) ─────
  { id: "ui_geometric_sans", label: "Geometric Sans", field: "ui", domain: "Typography",
    visualCharacter: "Inter, Söhne, Aktiv — neutral, modern, tech-default",
    ax: [-0.8, -0.6, 0.6, -0.6, 0.3, -0.7, -0.3, -0.8],
    neighbors: ["ui_flat_minimal", "ui_b2b_saas", "gd_wordmark_modern"], contrasts: ["gd_wordmark_classic"], popularity: 0.95 },
  { id: "ui_monospace_ui", label: "Monospace UI", field: "ui", domain: "Typography",
    visualCharacter: "Coded-feel, even rhythm, dev-tool credibility",
    ax: [-0.5, -0.3, 0.4, 0.0, 0.4, -0.4, -0.4, -0.5],
    neighbors: ["ui_developer_tool", "ui_brutalist"], contrasts: ["gd_hand_lettered"], popularity: 0.55 },
  { id: "ui_oversized_type", label: "Oversized Type", field: "ui", domain: "Typography",
    visualCharacter: "Headlines bigger than headers, type-as-image",
    ax: [-0.1, 0.7, 0.8, 0.7, 0.0, 0.1, 0.2, 0.3],
    neighbors: ["gd_experimental_type", "ui_fullbleed", "ui_dark_editorial"], contrasts: ["ui_type_minimal"], popularity: 0.65 },
  { id: "ui_type_minimal", label: "Type Minimal", field: "ui", domain: "Typography",
    visualCharacter: "One typeface, tight scale, ruthless restraint",
    ax: [-0.95, -0.95, 0.4, -0.6, 0.2, -0.7, -0.4, -0.9],
    neighbors: ["ui_flat_minimal", "ui_monochrome_pure", "gd_swiss_intl"], contrasts: ["ui_oversized_type", "gd_maximalist_poster"], popularity: 0.7 },

  // ───── UI: Product type (4) ─────
  { id: "ui_b2b_saas", label: "B2B SaaS", field: "ui", domain: "Product Type",
    visualCharacter: "Linear/Notion/Stripe — calm productivity surfaces",
    ax: [-0.85, -0.6, 0.6, -0.7, 0.3, -0.6, -0.3, -0.85],
    neighbors: ["ui_flat_minimal", "ui_geometric_sans", "ui_dashboard_dense"], contrasts: ["ui_consumer_app", "ui_claymorphism"], popularity: 0.9 },
  { id: "ui_consumer_app", label: "Consumer App", field: "ui", domain: "Product Type",
    visualCharacter: "Bright, friendly, gestural — TikTok / Spotify energy",
    ax: [0.2, 0.5, 0.7, 0.7, -0.5, 0.4, 0.2, 0.2],
    neighbors: ["ui_claymorphism", "ui_vibrant_brand", "ui_micro_physics"], contrasts: ["ui_b2b_saas", "ui_developer_tool"], popularity: 0.85 },
  { id: "ui_developer_tool", label: "Developer Tool", field: "ui", domain: "Product Type",
    visualCharacter: "Dark, monospace, keyboard-first, info-dense",
    ax: [-0.4, 0.2, 0.5, -0.3, 0.6, -0.3, -0.4, -0.4],
    neighbors: ["ui_dark_mode_first", "ui_monospace_ui", "ui_dashboard_dense", "ui_ux_command_palette"], contrasts: ["ui_consumer_app"], popularity: 0.7 },
  { id: "ui_ai_native", label: "AI-Native", field: "ui", domain: "Product Type",
    visualCharacter: "Conversation-led, generative panels, ambient suggestions",
    ax: [0.0, 0.3, 0.95, 0.4, 0.2, 0.2, 0.5, 0.5],
    neighbors: ["ui_aurora_gradient", "ui_ux_conversational"], contrasts: ["ui_skeuomorphic", "gd_wordmark_classic"], popularity: 0.85 },

  // ───── UI: UX (4) ─────
  { id: "ui_ux_command_palette", label: "Command Palette UX", field: "ui", domain: "UX",
    visualCharacter: "⌘K everywhere, keyboard-first, search-as-nav",
    ax: [-0.5, -0.4, 0.7, -0.5, 0.4, -0.6, -0.2, -0.7],
    neighbors: ["ui_developer_tool", "ui_b2b_saas"], contrasts: ["ui_consumer_app", "ui_skeuomorphic"], popularity: 0.7 },
  { id: "ui_ux_accessibility_first", label: "Accessibility First", field: "ui", domain: "UX",
    visualCharacter: "WCAG AAA contrast, large hit areas, semantic structure",
    ax: [-0.95, -0.5, 0.2, -0.6, 0.0, -0.7, -0.5, -0.95],
    neighbors: ["ui_b2b_saas", "ui_grid_strict"], contrasts: ["ui_brutalist"], popularity: 0.6 },
  { id: "ui_ux_conversational", label: "Conversational UX", field: "ui", domain: "UX",
    visualCharacter: "Chat-first, natural language inputs, streamed responses",
    ax: [0.1, 0.0, 0.95, 0.3, 0.0, 0.0, 0.4, 0.6],
    neighbors: ["ui_ai_native", "ui_consumer_app"], contrasts: ["ui_dashboard_dense", "ui_ux_command_palette"], popularity: 0.7 },
  { id: "ui_ux_settings_minimal", label: "Settings Minimal", field: "ui", domain: "UX",
    visualCharacter: "Almost no preferences, opinionated defaults",
    ax: [-0.9, -0.95, 0.4, -0.5, 0.2, -0.8, -0.3, -0.7],
    neighbors: ["ui_flat_minimal", "ui_consumer_app"], contrasts: ["ui_dashboard_dense", "ui_developer_tool"], popularity: 0.55 },

  // ───── UI: Motion (6) ─────
  { id: "ui_micro_physics", label: "Micro Physics", field: "ui", domain: "Motion",
    visualCharacter: "Spring curves, rubber-band, momentum scrolls",
    ax: [-0.2, 0.2, 0.7, 0.6, -0.3, 0.5, 0.1, 0.4],
    neighbors: ["ui_consumer_app", "ui_claymorphism"], contrasts: ["ui_no_animation"], popularity: 0.75 },
  { id: "ui_instant_snappy", label: "Instant & Snappy", field: "ui", domain: "Motion",
    visualCharacter: "120ms transitions, no bounce, productivity-grade",
    ax: [-0.7, -0.6, 0.6, -0.6, 0.3, -0.5, -0.3, -0.7],
    neighbors: ["ui_b2b_saas", "ui_flat_minimal"], contrasts: ["ui_cinematic_transition"], popularity: 0.85 },
  { id: "ui_cinematic_transition", label: "Cinematic Transitions", field: "ui", domain: "Motion",
    visualCharacter: "Long fades, parallax, hero-shot reveals",
    ax: [-0.1, 0.5, 0.7, 0.8, 0.2, 0.4, 0.2, 0.5],
    neighbors: ["ui_scroll_storytelling", "ui_fullbleed", "gd_motion_kinetic_type"], contrasts: ["ui_instant_snappy", "ui_no_animation"], popularity: 0.55 },
  { id: "ui_no_animation", label: "No Animation", field: "ui", domain: "Motion",
    visualCharacter: "Hard cuts, zero transitions, brutalist time",
    ax: [0.4, 0.0, 0.5, 0.5, 0.6, -0.6, 0.0, 0.6],
    neighbors: ["ui_brutalist", "ui_developer_tool"], contrasts: ["ui_cinematic_transition", "ui_micro_physics"], popularity: 0.3 },
  { id: "ui_gesture_native", label: "Gesture Native", field: "ui", domain: "Motion",
    visualCharacter: "Swipe-to-action, drag interactions, mobile-first",
    ax: [0.0, 0.2, 0.7, 0.6, -0.2, 0.3, 0.1, 0.5],
    neighbors: ["ui_consumer_app", "ui_micro_physics"], contrasts: ["ui_developer_tool"], popularity: 0.7 },
  { id: "ui_subtle_feedback", label: "Subtle Feedback", field: "ui", domain: "Motion",
    visualCharacter: "Tiny opacity hints, hover lifts, modest taste",
    ax: [-0.6, -0.5, 0.5, -0.3, 0.2, -0.3, -0.2, -0.5],
    neighbors: ["ui_flat_minimal", "ui_b2b_saas"], contrasts: ["ui_no_animation", "ui_cinematic_transition"], popularity: 0.7 },

  // ───── GD: Posters (12) ─────
  { id: "gd_swiss_intl", label: "Swiss / Intl Style", field: "gd", domain: "Poster",
    visualCharacter: "Helvetica, strict grid, asymmetric balance, two colors",
    referencePoint: "Müller-Brockmann, Hofmann",
    ax: [-0.95, -0.9, -0.4, -0.9, 0.3, -0.8, -0.5, -0.95],
    neighbors: ["ui_grid_strict", "ui_geometric_sans", "gd_minimalist_poster"], contrasts: ["gd_psychedelic", "gd_punk_zine", "gd_memphis"], popularity: 0.95 },
  { id: "gd_bauhaus", label: "Bauhaus", field: "gd", domain: "Poster",
    visualCharacter: "Primary colors, geometric primitives, sans serif",
    ax: [-0.7, -0.4, -0.5, -0.3, 0.0, -0.6, 0.1, -0.7],
    neighbors: ["gd_swiss_intl", "gd_constructivist", "gd_geometric_abstract"], contrasts: ["gd_art_nouveau", "gd_psychedelic"], popularity: 0.85 },
  { id: "gd_constructivist", label: "Constructivist", field: "gd", domain: "Poster",
    visualCharacter: "Diagonal type, red/black, photomontage, propaganda energy",
    ax: [0.4, 0.5, -0.7, 0.7, 0.4, -0.3, 0.0, -0.2],
    neighbors: ["gd_bauhaus", "gd_punk_zine"], contrasts: ["gd_swiss_intl", "gd_art_nouveau"], popularity: 0.55 },
  { id: "gd_art_nouveau", label: "Art Nouveau", field: "gd", domain: "Poster",
    visualCharacter: "Organic curves, ornate type, floral framing",
    referencePoint: "Mucha",
    ax: [0.2, 0.7, -0.95, 0.8, -0.5, 0.3, -0.4, 0.5],
    neighbors: ["gd_psychedelic", "gd_packaging_artisan"], contrasts: ["gd_swiss_intl", "ui_flat_minimal"], popularity: 0.45 },
  { id: "gd_art_deco", label: "Art Deco", field: "gd", domain: "Poster",
    visualCharacter: "Symmetrical sunbursts, gold accents, geometric luxury",
    ax: [-0.4, 0.4, -0.85, 0.5, 0.0, 0.2, -0.2, -0.2],
    neighbors: ["gd_packaging_luxury", "gd_wordmark_classic"], contrasts: ["gd_punk_zine", "ui_brutalist"], popularity: 0.5 },
  { id: "gd_psychedelic", label: "Psychedelic", field: "gd", domain: "Poster",
    visualCharacter: "Warped type, vibrating color, optical chaos",
    ax: [0.95, 0.95, -0.5, 0.95, -0.6, 0.3, 0.6, 0.95],
    neighbors: ["gd_memphis", "gd_punk_zine"], contrasts: ["gd_swiss_intl", "ui_flat_minimal"], popularity: 0.5 },
  { id: "gd_punk_zine", label: "Punk Zine", field: "gd", domain: "Poster",
    visualCharacter: "Cut-and-paste, photocopied, ransom-note type",
    ax: [0.95, 0.7, -0.2, 0.9, 0.2, -0.4, 0.2, 0.8],
    neighbors: ["ui_brutalist", "gd_constructivist"], contrasts: ["gd_swiss_intl", "ui_flat_minimal"], popularity: 0.55 },
  { id: "gd_brutalist_poster", label: "Brutalist Poster", field: "gd", domain: "Poster",
    visualCharacter: "Raw type, heavy slabs, intentional ugliness, system fonts",
    ax: [0.7, 0.5, 0.6, 0.7, 0.4, -0.5, 0.3, 0.7],
    neighbors: ["ui_brutalist", "gd_punk_zine"], contrasts: ["gd_swiss_intl", "gd_minimalist_poster"], popularity: 0.55 },
  { id: "gd_minimalist_poster", label: "Minimalist Poster", field: "gd", domain: "Poster",
    visualCharacter: "One image, one line of type, vast whitespace",
    ax: [-0.9, -0.95, 0.0, -0.5, 0.2, -0.6, 0.0, -0.8],
    neighbors: ["gd_swiss_intl", "ui_type_minimal", "gd_japanese_poster"], contrasts: ["gd_maximalist_poster", "gd_psychedelic"], popularity: 0.85 },
  { id: "gd_maximalist_poster", label: "Maximalist Poster", field: "gd", domain: "Poster",
    visualCharacter: "Layered chaos, every inch worked, ornament & color",
    ax: [0.85, 0.95, 0.3, 0.9, -0.2, 0.4, 0.4, 0.85],
    neighbors: ["gd_psychedelic", "gd_memphis", "gd_editorial_expressive"], contrasts: ["gd_minimalist_poster", "gd_swiss_intl"], popularity: 0.5 },
  { id: "gd_memphis", label: "Memphis", field: "gd", domain: "Poster",
    visualCharacter: "Squiggles, primary blocks, 80s playful chaos",
    ax: [0.7, 0.85, -0.1, 0.9, -0.3, 0.0, 0.3, 0.85],
    neighbors: ["gd_psychedelic", "gd_maximalist_poster"], contrasts: ["gd_swiss_intl", "ui_flat_minimal"], popularity: 0.45 },
  { id: "gd_japanese_poster", label: "Japanese Poster", field: "gd", domain: "Poster",
    visualCharacter: "Vertical type, ma (negative space), refined chaos",
    referencePoint: "Yokoo, Sato, Nagai",
    ax: [-0.2, 0.2, -0.4, 0.6, -0.1, 0.0, 0.4, 0.5],
    neighbors: ["gd_minimalist_poster", "gd_editorial_expressive"], contrasts: ["ui_dashboard_dense"], popularity: 0.7 },

  // ───── GD: Brand (8) ─────
  { id: "gd_wordmark_modern", label: "Modern Wordmark", field: "gd", domain: "Brand",
    visualCharacter: "Custom geometric sans, tight kerning, single weight",
    referencePoint: "Stripe, Vercel, Notion",
    ax: [-0.85, -0.7, 0.7, -0.5, 0.3, -0.7, -0.4, -0.8],
    neighbors: ["ui_geometric_sans", "ui_b2b_saas", "gd_swiss_intl"], contrasts: ["gd_hand_lettered", "gd_wordmark_classic"], popularity: 0.9 },
  { id: "gd_wordmark_classic", label: "Classic Wordmark", field: "gd", domain: "Brand",
    visualCharacter: "Serif heritage, established luxury, timeless",
    referencePoint: "NYT, Tiffany, Saks",
    ax: [-0.7, -0.4, -0.95, -0.3, 0.0, -0.4, -0.6, -0.4],
    neighbors: ["gd_packaging_luxury", "gd_magazine_classic"], contrasts: ["ui_ai_native", "gd_wordmark_modern"], popularity: 0.6 },
  { id: "gd_geometric_mark", label: "Geometric Mark", field: "gd", domain: "Brand",
    visualCharacter: "Pure shape logo, mathematical, scalable",
    ax: [-0.85, -0.7, 0.4, -0.6, 0.2, -0.6, 0.4, -0.7],
    neighbors: ["gd_bauhaus", "gd_wordmark_modern", "gd_geometric_abstract"], contrasts: ["gd_hand_lettered", "gd_pictorial_literal"], popularity: 0.8 },
  { id: "gd_pictorial_literal", label: "Pictorial Literal", field: "gd", domain: "Brand",
    visualCharacter: "Recognizable thing as logo (apple, bird, swoosh)",
    ax: [-0.5, 0.0, -0.1, 0.0, 0.0, -0.1, -0.95, 0.0],
    neighbors: ["gd_pictorial_abstract"], contrasts: ["gd_geometric_mark", "gd_wordmark_modern"], popularity: 0.7 },
  { id: "gd_pictorial_abstract", label: "Pictorial Abstract", field: "gd", domain: "Brand",
    visualCharacter: "Symbolic shape, evocative not literal",
    ax: [-0.4, 0.1, 0.4, 0.3, 0.2, 0.0, 0.85, 0.2],
    neighbors: ["gd_geometric_mark", "gd_geometric_abstract"], contrasts: ["gd_pictorial_literal"], popularity: 0.7 },
  { id: "gd_gradient_brand", label: "Gradient Brand", field: "gd", domain: "Brand",
    visualCharacter: "Multi-stop gradient identity, fluid color",
    referencePoint: "Instagram, Asana",
    ax: [-0.2, 0.4, 0.7, 0.6, -0.1, 0.4, 0.3, 0.0],
    neighbors: ["ui_aurora_gradient", "ui_consumer_app"], contrasts: ["gd_swiss_intl", "gd_wordmark_classic"], popularity: 0.7 },
  { id: "gd_hand_lettered", label: "Hand Lettered", field: "gd", domain: "Brand",
    visualCharacter: "Drawn marks, human imperfection, craft signal",
    ax: [0.6, 0.6, -0.4, 0.95, -0.6, 0.2, 0.3, 0.95],
    neighbors: ["gd_packaging_artisan", "gd_editorial_illustration"], contrasts: ["ui_geometric_sans", "gd_wordmark_modern"], popularity: 0.55 },
  { id: "gd_system_identity", label: "System Identity", field: "gd", domain: "Brand",
    visualCharacter: "Programmatic logo system, infinite variants",
    referencePoint: "MIT Media Lab, OCAD",
    ax: [-0.4, 0.4, 0.85, 0.4, 0.4, 0.0, 0.5, -0.3],
    neighbors: ["gd_generative_graphic", "gd_geometric_mark"], contrasts: ["gd_wordmark_classic"], popularity: 0.6 },

  // ───── GD: Editorial (4) ─────
  { id: "gd_magazine_classic", label: "Classic Magazine", field: "gd", domain: "Editorial",
    visualCharacter: "Serif body, considered hierarchy, printed warmth",
    referencePoint: "The New Yorker",
    ax: [-0.6, -0.2, -0.7, 0.0, -0.1, -0.2, -0.3, -0.3],
    neighbors: ["gd_wordmark_classic", "ui_dark_editorial"], contrasts: ["ui_brutalist", "gd_punk_zine"], popularity: 0.7 },
  { id: "gd_editorial_expressive", label: "Expressive Editorial", field: "gd", domain: "Editorial",
    visualCharacter: "Wild type sizes, image bleeds, art-direction first",
    referencePoint: "i-D, Wallpaper",
    ax: [0.5, 0.6, 0.5, 0.95, 0.0, 0.2, 0.4, 0.7],
    neighbors: ["ui_oversized_type", "gd_experimental_type", "ui_asymmetric"], contrasts: ["gd_swiss_intl", "ui_dashboard_dense"], popularity: 0.65 },
  { id: "gd_editorial_minimal", label: "Editorial Minimal", field: "gd", domain: "Editorial",
    visualCharacter: "Generous margins, single typeface, calm reading",
    ax: [-0.9, -0.9, 0.2, -0.4, 0.2, -0.6, -0.3, -0.85],
    neighbors: ["ui_spacious_minimal", "gd_minimalist_poster"], contrasts: ["gd_editorial_expressive"], popularity: 0.7 },
  { id: "gd_data_editorial", label: "Data Editorial", field: "gd", domain: "Editorial",
    visualCharacter: "Charts as headlines, info-graphic storytelling",
    referencePoint: "FT, Pudding",
    ax: [-0.7, 0.3, 0.4, -0.4, 0.4, -0.3, -0.4, -0.8],
    neighbors: ["ui_dashboard_dense", "ui_b2b_saas"], contrasts: ["gd_psychedelic", "gd_hand_lettered"], popularity: 0.65 },

  // ───── GD: Type (4) ─────
  { id: "gd_experimental_type", label: "Experimental Type", field: "gd", domain: "Type Design",
    visualCharacter: "Variable axes pushed, glitched glyphs, type as art",
    ax: [0.7, 0.7, 0.85, 0.95, 0.3, 0.2, 0.7, 0.85],
    neighbors: ["gd_editorial_expressive", "ui_oversized_type", "gd_deconstructed_type"], contrasts: ["ui_geometric_sans", "gd_swiss_intl"], popularity: 0.5 },
  { id: "gd_dimensional_type", label: "Dimensional Type", field: "gd", domain: "Type Design",
    visualCharacter: "3D extrusions, chrome, inflated letterforms",
    ax: [0.2, 0.6, 0.7, 0.7, 0.0, 0.95, 0.2, 0.4],
    neighbors: ["gd_3d_illustration", "ui_claymorphism"], contrasts: ["ui_flat_minimal"], popularity: 0.55 },
  { id: "gd_deconstructed_type", label: "Deconstructed Type", field: "gd", domain: "Type Design",
    visualCharacter: "Broken grid, shifted glyphs, post-grunge",
    referencePoint: "David Carson",
    ax: [0.95, 0.7, 0.2, 0.95, 0.3, -0.1, 0.6, 0.95],
    neighbors: ["gd_punk_zine", "gd_experimental_type"], contrasts: ["gd_swiss_intl"], popularity: 0.45 },
  { id: "gd_custom_lettering", label: "Custom Lettering", field: "gd", domain: "Type Design",
    visualCharacter: "Bespoke drawn glyphs, brand-specific marks",
    ax: [0.2, 0.4, -0.2, 0.7, -0.2, 0.2, 0.0, 0.7],
    neighbors: ["gd_hand_lettered", "gd_wordmark_modern"], contrasts: ["ui_monospace_ui"], popularity: 0.6 },

  // ───── GD: Illustration (6) ─────
  { id: "gd_flat_vector", label: "Flat Vector", field: "gd", domain: "Illustration",
    visualCharacter: "Flat shapes, friendly characters, marketing-grade",
    ax: [-0.5, 0.0, 0.7, 0.4, -0.2, -0.7, 0.2, 0.0],
    neighbors: ["ui_consumer_app", "gd_geometric_abstract"], contrasts: ["gd_3d_illustration", "gd_editorial_illustration"], popularity: 0.8 },
  { id: "gd_isometric", label: "Isometric", field: "gd", domain: "Illustration",
    visualCharacter: "30° projection, infographic worlds",
    ax: [-0.7, 0.3, 0.5, 0.0, 0.3, 0.5, -0.1, -0.5],
    neighbors: ["ui_b2b_saas", "gd_flat_vector"], contrasts: ["gd_editorial_illustration"], popularity: 0.55 },
  { id: "gd_editorial_illustration", label: "Editorial Illustration", field: "gd", domain: "Illustration",
    visualCharacter: "Conceptual, painterly, op-ed visual essay",
    ax: [0.2, 0.4, 0.0, 0.85, -0.2, 0.2, 0.7, 0.85],
    neighbors: ["gd_magazine_classic", "gd_hand_lettered"], contrasts: ["gd_isometric", "gd_flat_vector"], popularity: 0.6 },
  { id: "gd_geometric_abstract", label: "Geometric Abstract", field: "gd", domain: "Illustration",
    visualCharacter: "Composition of shapes, no figuration",
    ax: [-0.5, 0.2, 0.4, 0.3, 0.2, -0.3, 0.85, -0.2],
    neighbors: ["gd_bauhaus", "gd_geometric_mark"], contrasts: ["gd_editorial_illustration"], popularity: 0.65 },
  { id: "gd_3d_illustration", label: "3D Illustration", field: "gd", domain: "Illustration",
    visualCharacter: "Rendered scenes, soft shadows, candy materials",
    ax: [-0.2, 0.5, 0.85, 0.6, -0.3, 0.95, 0.0, 0.0],
    neighbors: ["ui_claymorphism", "gd_dimensional_type"], contrasts: ["gd_flat_vector", "ui_flat_minimal"], popularity: 0.7 },
  { id: "gd_risograph", label: "Risograph", field: "gd", domain: "Illustration",
    visualCharacter: "Limited inks, misregistration, grainy halftone",
    ax: [0.4, 0.4, 0.0, 0.7, -0.3, -0.1, 0.4, 0.85],
    neighbors: ["gd_punk_zine", "gd_packaging_artisan"], contrasts: ["ui_flat_minimal", "gd_3d_illustration"], popularity: 0.55 },

  // ───── GD: Packaging (3) ─────
  { id: "gd_packaging_minimal", label: "Minimal Packaging", field: "gd", domain: "Packaging",
    visualCharacter: "Tiny type, white labels, restrained palette",
    referencePoint: "Aesop, MUJI",
    ax: [-0.95, -0.95, 0.2, -0.6, 0.0, -0.6, -0.4, -0.7],
    neighbors: ["ui_flat_minimal", "gd_minimalist_poster"], contrasts: ["gd_packaging_artisan", "gd_maximalist_poster"], popularity: 0.85 },
  { id: "gd_packaging_artisan", label: "Artisan Packaging", field: "gd", domain: "Packaging",
    visualCharacter: "Hand drawn, tactile paper, craft seal",
    ax: [0.4, 0.5, -0.6, 0.85, -0.6, 0.2, -0.1, 0.85],
    neighbors: ["gd_hand_lettered", "gd_risograph"], contrasts: ["gd_packaging_minimal", "ui_flat_minimal"], popularity: 0.6 },
  { id: "gd_packaging_luxury", label: "Luxury Packaging", field: "gd", domain: "Packaging",
    visualCharacter: "Foil stamping, thick stock, restrained ornament",
    ax: [-0.6, -0.3, -0.8, 0.2, 0.0, 0.2, -0.4, -0.4],
    neighbors: ["gd_wordmark_classic", "gd_art_deco"], contrasts: ["gd_punk_zine"], popularity: 0.6 },

  // ───── GD: Motion / Digital (2) ─────
  { id: "gd_motion_kinetic_type", label: "Kinetic Typography", field: "gd", domain: "Motion",
    visualCharacter: "Type moves with rhythm, broadcast-grade animation",
    ax: [0.2, 0.5, 0.7, 0.85, 0.1, 0.3, 0.4, 0.6],
    neighbors: ["gd_experimental_type", "ui_cinematic_transition"], contrasts: ["ui_no_animation"], popularity: 0.65 },
  { id: "gd_generative_graphic", label: "Generative Graphic", field: "gd", domain: "Motion",
    visualCharacter: "Code-driven posters, parametric variants",
    ax: [0.0, 0.4, 0.95, 0.3, 0.4, 0.0, 0.7, -0.5],
    neighbors: ["gd_system_identity", "gd_geometric_abstract"], contrasts: ["gd_hand_lettered"], popularity: 0.55 },

  // ───── GD: Environmental (1) ─────
  { id: "gd_wayfinding_system", label: "Wayfinding System", field: "gd", domain: "Environmental",
    visualCharacter: "Pictograms, signage families, architectural calm",
    referencePoint: "Otl Aicher Munich '72",
    ax: [-0.95, -0.5, -0.2, -0.95, 0.2, -0.5, -0.5, -0.95],
    neighbors: ["gd_swiss_intl", "gd_geometric_mark", "ui_grid_strict"], contrasts: ["gd_punk_zine"], popularity: 0.55 },
];

// All seeded nodes are leaf "style" nodes (depth 3 in the field→domain→style hierarchy).
const NODE_DEPTH = 3;

const fieldOf = new Map(rows.map((r) => [r.id, r.field]));

export const styleNodes: InsertStyleNode[] = rows.map((r) => ({
  id: r.id,
  label: r.label,
  field: r.field,
  domain: r.domain,
  depth: NODE_DEPTH,
  visualCharacter: r.visualCharacter,
  referencePoint: r.referencePoint ?? "",
  imageUrl: img(r.domain, r.id),
  axisLoadings: axes(r.ax),
  parent: r.parent ?? null,
  children: r.children ?? [],
  neighbors: r.neighbors ?? [],
  contrasts: r.contrasts ?? [],
  popularity: r.popularity ?? 0.5,
}));

export type EdgeType = "neighbor" | "contrast" | "parent_child" | "cross_field";

export const styleEdges = rows.flatMap((r) => {
  const out: { fromNode: string; toNode: string; edgeType: EdgeType; weight: number }[] = [];
  for (const n of r.neighbors ?? []) {
    const otherField = fieldOf.get(n);
    const isCross = otherField && otherField !== r.field;
    out.push({ fromNode: r.id, toNode: n, edgeType: "neighbor", weight: 1 });
    if (isCross) {
      out.push({ fromNode: r.id, toNode: n, edgeType: "cross_field", weight: 1 });
    }
  }
  for (const n of r.contrasts ?? []) {
    out.push({ fromNode: r.id, toNode: n, edgeType: "contrast", weight: 1 });
  }
  if (r.parent) {
    out.push({ fromNode: r.id, toNode: r.parent, edgeType: "parent_child", weight: 1 });
  }
  for (const n of r.children ?? []) {
    out.push({ fromNode: r.id, toNode: n, edgeType: "parent_child", weight: 1 });
  }
  return out;
});
