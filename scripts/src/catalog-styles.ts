/**
 * Style metadata for the plate catalog generator.
 *
 * Hand-authored, documented axis loadings + alt-text guidance for every style
 * in catalog/v1.json's taxonomy. These are EDITORIAL decisions (per the plan:
 * "hand-authored, documented, versioned axis loadings — finite and auditable"),
 * not claims about a specific image — the curated image and real credit are
 * dropped in later (see CREDITS.md), at which point loadings may be re-tuned
 * and the catalog version bumped.
 *
 * Axis sign convention (from scoring.ts): + = second pole (chaos, maximal,
 * contemporary, expressive, cold, dimensional, abstract, intuition); - = first
 * pole (order, minimal, classic, functional, warm, flat, literal, system).
 * Omitted = 0 (axis not expressed).
 */

export type StyleMeta = {
  axes: Record<string, number>;
  alt: string;
};

export const STYLE_META: Record<string, StyleMeta> = {
  // ---- UI / Product Design ----
  ui_flat_minimal: {
    axes: { minimal_maximal: -0.9, order_chaos: -0.8, flat_dimensional: -0.7, functional_expressive: -0.5, system_intuition: -0.4 },
    alt: "A flat, cropped-simple interface with straight edges, restrained palette and generous whitespace; nothing decorative",
  },
  ui_glassmorphism: {
    axes: { flat_dimensional: 0.6, warm_cold: 0.5, classic_contemporary: 0.7, minimal_maximal: -0.3, system_intuition: 0.4 },
    alt: "Frosted translucent panels layered over a soft colorful glow, with blurred backdrops and floating cards",
  },
  ui_neumorphism: {
    axes: { flat_dimensional: 0.7, warm_cold: 0.3, minimal_maximal: -0.4, classic_contemporary: 0.5 },
    alt: "Soft extruded UI where cards appear pressed into a single-tone background, using gentle shadows and highlights",
  },
  ui_brutalist_ui: {
    axes: { order_chaos: 0.5, minimal_maximal: 0.5, flat_dimensional: -0.7, functional_expressive: 0.4, literal_abstract: -0.6 },
    alt: "Raw, unpolished web UI - thick borders, default system type, harsh color blocks and a deliberately unfinished look",
  },
  ui_dark_editorial: {
    axes: { minimal_maximal: -0.7, warm_cold: 0.8, classic_contemporary: 0.9, functional_expressive: -0.5, system_intuition: 0.6 },
    alt: "Dark product interface with restrained type, muted surfaces and a single accent color",
  },
  ui_bento_grid: {
    axes: { order_chaos: -0.6, minimal_maximal: -0.3, flat_dimensional: 0.4, classic_contemporary: 0.6, system_intuition: -0.5 },
    alt: "A tidy grid of rounded cards of varied sizes, like a bento box, each holding one focused module",
  },
  ui_claymorphism: {
    axes: { warm_cold: 0.6, flat_dimensional: 0.7, functional_expressive: 0.3, minimal_maximal: -0.2 },
    alt: "Playful chunky 3D clay-like UI elements with soft blob shadows and pastel fills",
  },
  ui_skeuomorphic: {
    axes: { classic_contemporary: -0.6, flat_dimensional: 0.8, functional_expressive: -0.4, warm_cold: 0.5 },
    alt: "Interfaces textured to imitate physical objects - leather, metal, stitching, glossy buttons and real-world affordances",
  },
  ui_aurora_gradient: {
    axes: { classic_contemporary: 0.9, flat_dimensional: 0.8, minimal_maximal: 0.4, warm_cold: -0.3, functional_expressive: 0.4 },
    alt: "Flowing multicolor gradient mesh across a clean white page",
  },
  ui_grid_strict: {
    axes: { order_chaos: -0.9, system_intuition: -0.9, minimal_maximal: -0.5, flat_dimensional: -0.4 },
    alt: "A rigid, mathematically aligned grid of columns and rows; alignment and rhythm are the entire design",
  },
  ui_asymmetric: {
    axes: { order_chaos: 0.4, functional_expressive: 0.5, minimal_maximal: -0.3, classic_contemporary: 0.6 },
    alt: "Deliberately off-balance layout using asymmetric columns and tensioned whitespace for a dynamic read",
  },
  ui_fullbleed: {
    axes: { minimal_maximal: 0.4, flat_dimensional: 0.6, functional_expressive: 0.4, order_chaos: 0.3 },
    alt: "Edge-to-edge imagery and type filling the entire viewport, no frame or margin containing the content",
  },
  ui_card_heavy: {
    axes: { flat_dimensional: 0.6, minimal_maximal: 0.5, order_chaos: -0.3, system_intuition: -0.3 },
    alt: "A surface built almost entirely from stacked rectangular cards with independent shadows and rounded corners",
  },
  ui_dashboard_dense: {
    axes: { order_chaos: -0.4, minimal_maximal: 0.8, system_intuition: -0.6, flat_dimensional: -0.5, functional_expressive: -0.6 },
    alt: "A high-density operational screen packing many panels, tables and small charts into a tight information grid",
  },
  ui_spacious_minimal: {
    axes: { minimal_maximal: -0.9, order_chaos: -0.5, warm_cold: -0.6, functional_expressive: -0.6 },
    alt: "Extremely sparse interface, few elements per screen, wide whitespace",
  },
  ui_editorial_web: {
    axes: { classic_contemporary: 0.6, order_chaos: -0.4, functional_expressive: 0.5, flat_dimensional: 0.3 },
    alt: "A magazine-like web layout with a masthead, crisp headlines, overset columns and refined typography",
  },
  ui_split_screen: {
    axes: { order_chaos: -0.2, system_intuition: -0.4, minimal_maximal: -0.3, flat_dimensional: 0.4 },
    alt: "Viewport divided into two or more flanking panes that scroll or change together",
  },
  ui_micro_interactions: {
    axes: { system_intuition: 0.6, functional_expressive: 0.5, warm_cold: 0.4, minimal_maximal: -0.2 },
    alt: "A lively interface where buttons, toggles and fields respond with small physical, animated feedback",
  },
  ui_scroll_storytelling: {
    axes: { classic_contemporary: 0.9, functional_expressive: 0.7, flat_dimensional: 0.6, order_chaos: 0.3 },
    alt: "A long page that unfolds a narrative as you scroll, with sections morphing, pinning and revealing",
  },
  ui_kinetic_feedback: {
    axes: { functional_expressive: 0.7, warm_cold: 0.3, minimal_maximal: 0.2, system_intuition: 0.5 },
    alt: "An interface built around physical motion - inertia, springs, drag and momentum - where every gesture reacts",
  },
  ui_no_animation: {
    axes: { order_chaos: -0.7, system_intuition: -0.8, minimal_maximal: -0.5, functional_expressive: -0.6 },
    alt: "A still, static interface where nothing animates; state changes are instant and unadorned",
  },
  ui_playful_physics: {
    axes: { functional_expressive: 0.8, warm_cold: 0.6, order_chaos: 0.5, minimal_maximal: 0.3 },
    alt: "A whimsical UI with physics-driven elements that bounce, wobble and collide in a playful sandbox",
  },
  ui_b2b_saas: {
    axes: { order_chaos: -0.6, system_intuition: -0.7, minimal_maximal: 0.6, functional_expressive: -0.5, flat_dimensional: -0.4 },
    alt: "A composed enterprise application with a top nav, left sidebar, dense tables and colored status chips",
  },
  ui_command_palette: {
    axes: { system_intuition: -0.6, minimal_maximal: -0.5, order_chaos: -0.5, functional_expressive: -0.3 },
    alt: "A keyboard-driven interface centered on a searchable command bar with a short flat list of fuzzy-matched actions",
  },
  ui_data_viz_rich: {
    axes: { functional_expressive: 0.5, flat_dimensional: 0.6, warm_cold: 0.4, minimal_maximal: 0.3 },
    alt: "A visualization-heavy screen packed with charts, gradients and dense but readable encoded data",
  },
  ui_terminal: {
    axes: { flat_dimensional: -0.6, minimal_maximal: 0.5, warm_cold: -0.4, functional_expressive: -0.3, system_intuition: -0.5 },
    alt: "A monospaced terminal-style interface on a dark background, raw text output, no icons or chrome",
  },
  ui_system_identity: {
    axes: { order_chaos: -0.8, system_intuition: -0.9, minimal_maximal: -0.5, functional_expressive: -0.6 },
    alt: "A disciplined, token-driven interface where spacing, type and color follow strict documented rules",
  },
  ui_type_scale_strict: {
    axes: { order_chaos: -0.7, system_intuition: -0.7, minimal_maximal: -0.4, functional_expressive: -0.5 },
    alt: "A layout where a rigorous typographic scale and baseline grid determine everything; type is the interface",
  },
  ui_accessibility_first: {
    axes: { functional_expressive: -0.7, order_chaos: -0.6, system_intuition: -0.6, minimal_maximal: -0.4, warm_cold: -0.5 },
    alt: "A high-contrast, screen-reader-friendly interface prioritizing legibility, labels, focus states and clarity",
  },
  ui_token_driven: {
    axes: { order_chaos: -0.8, system_intuition: -0.8, minimal_maximal: -0.4, functional_expressive: -0.5 },
    alt: "A design-system component panel showing interfaces assembled entirely from named design tokens",
  },
  ui_spatial_ui: {
    axes: { classic_contemporary: 0.9, flat_dimensional: 0.9, functional_expressive: 0.6, minimal_maximal: 0.3 },
    alt: "A spatial interface with depth, layers and perspective, panels floating at different z-heights in 3D space",
  },
  ui_ai_native: {
    axes: { classic_contemporary: 0.9, system_intuition: 0.6, functional_expressive: 0.5, order_chaos: 0.3 },
    alt: "A generative, adaptive interface with chat-like prompts, streaming responses and suggested actions",
  },
  ui_retro_computing: {
    axes: { classic_contemporary: -0.5, order_chaos: -0.3, minimal_maximal: 0.5, warm_cold: -0.4, flat_dimensional: -0.5 },
    alt: "A nostalgic interface recalling early computers - scanlines, blocky pixels, beige or phosphor-green palettes",
  },
  ui_typographic_ui: {
    axes: { functional_expressive: 0.6, minimal_maximal: -0.4, order_chaos: -0.3, literal_abstract: 0.4 },
    alt: "An interface led primarily by typography, where oversized type sets the hierarchy over imagery and icons",
  },
  ui_material_you: {
    axes: { warm_cold: 0.5, flat_dimensional: 0.6, minimal_maximal: 0.2, classic_contemporary: 0.7 },
    alt: "A color-extracted, tactile Android-style interface with dynamic tonal palettes and soft ambient shapes",
  },

  // ---- Graphic Design ----
  gd_swiss_intl: {
    axes: { order_chaos: -0.95, minimal_maximal: -0.6, warm_cold: 0.7, functional_expressive: -0.8, classic_contemporary: -0.4, system_intuition: -0.9 },
    alt: "Swiss poster of nested concentric arcs on white, mathematical rhythm",
  },
  gd_bauhaus: {
    axes: { order_chaos: -0.5, minimal_maximal: -0.4, classic_contemporary: 0.7, functional_expressive: 0.6, warm_cold: 0.4, literal_abstract: 0.5 },
    alt: "Bauhaus composition with primary-color geometric shapes, diagonal energy and industrial-modernist type",
  },
  gd_constructivist: {
    axes: { order_chaos: 0.5, classic_contemporary: -0.8, functional_expressive: 0.9, literal_abstract: 0.5, warm_cold: -0.2 },
    alt: "Constructivist poster, hard diagonals, red and black type calling for books",
  },
  gd_psychedelic: {
    axes: { order_chaos: 0.9, warm_cold: 0.8, functional_expressive: 0.8, minimal_maximal: 0.7, literal_abstract: 0.6, classic_contemporary: -0.6 },
    alt: "A flowing, liquid psychedelic poster with swirling warped type, vibrating high-chroma color and dense ornament",
  },
  gd_punk_zine: {
    axes: { order_chaos: 0.9, minimal_maximal: 0.7, functional_expressive: 0.9, warm_cold: 0.3, literal_abstract: 0.4, classic_contemporary: -0.7 },
    alt: "A cut-and-paste punk zine spread with torn collaged type, photocopy texture, staples and raw black ink",
  },
  gd_maximalist_poster: {
    axes: { minimal_maximal: 0.95, order_chaos: 0.6, functional_expressive: 0.8, warm_cold: 0.5, flat_dimensional: 0.4 },
    alt: "A maximalist poster crammed edge-to-edge with many layers, colors and overlapping elements and no breathing room",
  },
  gd_minimalist_conceptual: {
    axes: { minimal_maximal: -0.9, order_chaos: -0.5, functional_expressive: 0.3, literal_abstract: 0.7, system_intuition: -0.3 },
    alt: "A conceptual poster reduced to a single powerful idea and tiny formal gesture on a near-empty background",
  },
  gd_experimental_type: {
    axes: { functional_expressive: 0.9, order_chaos: 0.5, literal_abstract: 0.7, minimal_maximal: 0.3, classic_contemporary: 0.6 },
    alt: "An experimental type treatment where the letterforms themselves are distorted, broken, layered or drawn",
  },
  gd_editorial_typography: {
    axes: { order_chaos: -0.3, minimal_maximal: -0.5, functional_expressive: 0.5, classic_contemporary: 0.6, literal_abstract: 0.3 },
    alt: "An editorial spread driven by expressive yet disciplined typography in a clear structure",
  },
  gd_hand_lettered: {
    axes: { warm_cold: 0.7, functional_expressive: 0.6, order_chaos: 0.4, classic_contemporary: -0.4, system_intuition: 0.5 },
    alt: "Hand-lettered signage or packaging where warm, human-drawn letterforms are the hero",
  },
  gd_kinetic_type: {
    axes: { functional_expressive: 0.9, classic_contemporary: 0.8, order_chaos: 0.5, warm_cold: 0.4 },
    alt: "Kinetic or motion-based type where letters dance, skew and overlap with apparent speed",
  },
  gd_concrete_poetry: {
    axes: { literal_abstract: 0.9, functional_expressive: 0.7, order_chaos: 0.4, minimal_maximal: -0.3, system_intuition: 0.4 },
    alt: "A concrete-poetry page where the arrangement of words on the page is itself the meaning",
  },
  gd_wordmark_classic: {
    axes: { order_chaos: -0.9, minimal_maximal: -0.5, classic_contemporary: -0.6, functional_expressive: -0.7, system_intuition: -0.7 },
    alt: "A classic serif wordmark or monogram with refined detailing, even weight and timeless proportions",
  },
  gd_geometric_mark: {
    axes: { minimal_maximal: -0.5, order_chaos: -0.8, warm_cold: 0.3, system_intuition: -0.7, functional_expressive: -0.4 },
    alt: "A pure geometric logomark built from circles, arcs and strict angles with mathematical precision",
  },
  gd_gradient_brand: {
    axes: { flat_dimensional: 0.7, classic_contemporary: 0.8, warm_cold: 0.4, minimal_maximal: 0.3 },
    alt: "A modern brand identity animated by vivid layered gradients across letterforms and shapes",
  },
  gd_system_identity: {
    axes: { order_chaos: -0.8, system_intuition: -0.8, minimal_maximal: -0.4, functional_expressive: -0.6 },
    alt: "A systematic identity built from a modular grid, constrained palette and repeatable components",
  },
  gd_artisan_packaging: {
    axes: { warm_cold: 0.8, functional_expressive: 0.4, minimal_maximal: -0.2, classic_contemporary: -0.3 },
    alt: "Crafted packaging with natural papers, soft tactile surfaces and small human details",
  },
  gd_magazine_layout: {
    axes: { order_chaos: -0.4, functional_expressive: 0.5, minimal_maximal: -0.3, classic_contemporary: 0.5, flat_dimensional: 0.3 },
    alt: "A magazine spread with a confident grid, pull quotes, layered imagery and editorial flair",
  },
  gd_book_typography: {
    axes: { order_chaos: -0.6, minimal_maximal: -0.5, warm_cold: 0.3, functional_expressive: -0.4, system_intuition: -0.5 },
    alt: "A book interior with quiet, impeccably set type, humble margins and nothing competing with the text",
  },
  gd_catalog_design: {
    axes: { order_chaos: -0.5, minimal_maximal: -0.3, warm_cold: 0.3, functional_expressive: -0.3, system_intuition: -0.4 },
    alt: "A clean catalog layout that lets dense product information breathe through consistent templates",
  },
  gd_wayfinding_system: {
    axes: { order_chaos: -0.9, minimal_maximal: -0.4, warm_cold: 0.2, functional_expressive: -0.5, system_intuition: -0.8 },
    alt: "A wayfinding system of directional signage using strong pictograms, arrows and high legibility at a distance",
  },
  gd_technical_diagram: {
    axes: { order_chaos: -0.7, minimal_maximal: -0.3, warm_cold: -0.3, functional_expressive: -0.6, system_intuition: -0.6 },
    alt: "A technical diagram with fine precise lines, annotations and exploded detail explaining how something works",
  },
  gd_packaging_minimal: {
    axes: { minimal_maximal: -0.9, order_chaos: -0.6, functional_expressive: -0.5, warm_cold: 0.3, flat_dimensional: -0.3 },
    alt: "Minimal packaging with a single color block, one line of type and vast blank surface",
  },
  gd_label_systems: {
    axes: { order_chaos: -0.6, minimal_maximal: -0.4, warm_cold: 0.4, functional_expressive: -0.4, system_intuition: -0.6 },
    alt: "A systematic label design applying a strict template of type and color across a family of products",
  },
  gd_naive_folk: {
    axes: { warm_cold: 0.9, functional_expressive: 0.7, order_chaos: 0.5, minimal_maximal: 0.4, classic_contemporary: -0.5 },
    alt: "A naive folk-art illustration with flat folk motifs, hand-painted texture and vivid folk color",
  },
  gd_flat_vector: {
    axes: { flat_dimensional: -0.8, minimal_maximal: -0.4, warm_cold: 0.5, functional_expressive: 0.3, order_chaos: -0.3 },
    alt: "A flat vector illustration with crisp solid shapes, no gradients and bold unmodulated color",
  },
  gd_3d_illustration: {
    axes: { flat_dimensional: 0.9, minimal_maximal: 0.4, classic_contemporary: 0.7, functional_expressive: 0.5 },
    alt: "A dimensional 3D illustration with rendered lighting, smooth materials and playful perspective",
  },
  gd_collage_poster: {
    axes: { order_chaos: 0.6, minimal_maximal: 0.5, functional_expressive: 0.8, warm_cold: 0.5, literal_abstract: 0.6 },
    alt: "A collage poster layering cut-out photographs, textures and type into a rhythmic assembled whole",
  },
  gd_character_cartoon: {
    axes: { functional_expressive: 0.8, warm_cold: 0.7, order_chaos: 0.4, minimal_maximal: 0.4, literal_abstract: 0.5 },
    alt: "A cartoon character illustration with exaggerated features, lively poses and expressive linework",
  },
  gd_geometric_abstract: {
    axes: { literal_abstract: 0.8, order_chaos: -0.4, minimal_maximal: -0.3, flat_dimensional: -0.2, system_intuition: -0.5 },
    alt: "A geometric abstract composition of reduced shapes and fields, more about form than subject",
  },
};