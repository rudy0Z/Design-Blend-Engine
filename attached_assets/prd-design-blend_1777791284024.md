# Design Blend — PRD
### A Design Taste Profiling and Matching System

**Version:** 1.0  
**Concept:** Spotify Wrapped × Spotify Blend, but for design taste  
**Stack:** React, Supabase, Gemini API, Cloudinary (images), Vercel  
**Monetization:** Free with viral sharing mechanic built-in

---

## The Concept

Every designer has a taste fingerprint — a unique constellation of design styles they're drawn to. Most designers can't articulate it precisely. They just know what they like when they see it.

Design Blend makes that fingerprint visible and comparable.

You go through a structured taste quiz across design fields. The system builds your taste vector — a multi-dimensional score across hundreds of design styles. It gives you a title, a visual profile card, and a shareable link. Send that link to another designer and see how your taste overlaps — like Spotify Blend but for visual sensibility.

---

## The Taxonomy Problem (Most Important Section)

This is the hardest design decision in the product. The taxonomy must be:
- **Comprehensive enough** to meaningfully differentiate designers
- **Shallow enough** to complete in one session (30–45 min max)
- **Image-anchored** — every style node needs a representative image
- **Globally understood** — styles must have clear visual representatives across cultures

### Taxonomy Architecture

Three levels deep. Field → Category → Style. Each Style is a leaf node with a rating.

---

## Level 1: Fields (12 Fields)

```
1.  Visual / Graphic Design
2.  UI / Product Design
3.  Brand / Identity Design
4.  Typography Design
5.  Motion / Animation Design
6.  Illustration / Art Direction
7.  3D / Spatial Design
8.  Photography Direction
9.  Fashion / Textile Design
10. Interior / Environmental Design
11. Industrial / Product Design
12. Experimental / Conceptual Design
```

User doesn't rate all 12. On first open, they select which fields they work in or care about (minimum 2, maximum all). This personalizes the quiz — a product designer won't be quizzed on textile patterns.

---

## Level 2: Categories Per Field

### Field 1: Visual / Graphic Design

| Category | Description |
|---|---|
| Print & Editorial | Magazine, book, newspaper design |
| Poster Design | Commercial, cultural, political posters |
| Packaging | Consumer product packaging |
| Infographics | Data visualization in graphic form |
| Signage / Wayfinding | Environmental graphic systems |

### Field 2: UI / Product Design

| Category | Description |
|---|---|
| Consumer Apps | B2C mobile/web products |
| Enterprise/B2B | Dashboard, SaaS, data products |
| Design Systems | Component libraries, tokens |
| Micro-interactions | Animation, transitions, feedback |
| Accessibility-first | Inclusive design patterns |

### Field 3: Brand / Identity Design

| Category | Description |
|---|---|
| Wordmarks | Typography-based logos |
| Pictorial Marks | Icon/symbol-based logos |
| Abstract Marks | Geometric/non-representational logos |
| Brand Systems | Color, type, pattern systems |
| Rebrands | Transformation of existing brands |

### Field 4: Typography Design

| Category | Description |
|---|---|
| Type as Image | Typography used expressively |
| Editorial Typography | Long-form layout and type setting |
| Logotype / Lettering | Custom letterforms |
| Type Systems | Hierarchical type scale design |
| Kinetic Typography | Moving type and text animation |

### Field 5: Motion / Animation Design

| Category | Description |
|---|---|
| UI Animation | Interface micro-interactions |
| Title Sequences | Film/TV opening sequences |
| Motion Branding | Logo animation, brand motion |
| Explainer Animation | 2D instructional animation |
| 3D Motion | Cinema 4D, Blender-style |
| Generative Animation | Code-driven visual systems |

### Field 6: Illustration / Art Direction

| Category | Description |
|---|---|
| Editorial Illustration | Magazine, article illustration |
| Character Design | Character-based illustration |
| Technical Illustration | Diagrams, cutaways |
| Conceptual Illustration | Abstract concept visualization |
| Digital Painting | Painterly digital artwork |
| Vector Illustration | Clean geometric illustration |

### Field 7: 3D / Spatial Design

| Category | Description |
|---|---|
| Product Visualization | 3D renders of physical products |
| Architectural Visualization | Space and building renders |
| Abstract 3D | Non-representational 3D art |
| Character 3D | 3D figures and characters |
| UI 3D | 3D used in interface design |

### Field 8: Photography Direction

| Category | Description |
|---|---|
| Product Photography | Object-focused commercial |
| Portrait / People | Human-centered photography |
| Documentary | Journalistic, reportage |
| Abstract / Fine Art | Non-representational photography |
| Fashion Photography | Clothing, editorial fashion |

### Field 9: Fashion / Textile Design

| Category | Description |
|---|---|
| Pattern Design | Repeating surface patterns |
| Garment Silhouettes | Form and shape in fashion |
| Material Exploration | Textile, fabric, surface |
| Fashion Systems | Collection-level design thinking |

### Field 10: Interior / Environmental Design

| Category | Description |
|---|---|
| Residential | Home, living spaces |
| Commercial | Retail, hospitality, office |
| Exhibition Design | Museum, gallery installations |
| Urban / Public Space | Plazas, parks, civic design |

### Field 11: Industrial / Product Design

| Category | Description |
|---|---|
| Consumer Electronics | Devices, gadgets |
| Furniture | Chair, table, object design |
| Automotive | Vehicle design |
| Sustainable Design | Materials and systems thinking |

### Field 12: Experimental / Conceptual

| Category | Description |
|---|---|
| Speculative Design | Futures, provocations |
| Critical Design | Design as commentary |
| Generative / Code Art | Algorithmic visual systems |
| Bio Design | Organic materials, living systems |
| Interaction Art | Physical computing, installations |

---

## Level 3: Styles (Leaf Nodes — What Gets Rated)

This is where the taxonomy gets specific. Each style is a named visual approach within a category, paired with a representative image.

### Examples (partial — full taxonomy has 200+ styles)

**Visual / Graphic Design → Poster Design:**

| Style | Visual Character | Representative Reference |
|---|---|---|
| Swiss International | Grid, Helvetica, asymmetric layout, primary colors | Müller-Brockmann |
| Bauhaus | Geometric, primary colors, industrial aesthetic | Herbert Bayer |
| Art Nouveau | Organic curves, botanical motifs, ornate borders | Mucha |
| Psychedelic | Distorted type, vibrant color, optical illusions | Wes Wilson |
| Brutalist Poster | Raw, uncomfortable, heavy type, anti-aesthetic | Experimental Jetset |
| Maximalist | Layered, dense, everything visible, no hierarchy | Rick Poynor |
| Minimalist Poster | Single element, massive negative space, restrained | Noma Bar |
| Constructivist | Red/black, diagonal composition, propaganda energy | El Lissitzky |
| Memphis / Pop | Pattern, color blocks, geometric playfulness | 1980s Memphis |
| Retrograde / Vintage | Halftone, worn texture, historical pastiche | Various |
| Punk/Zine | Cut-and-paste, xerox aesthetic, anti-design | Jamie Reid |
| Japanese Poster | Layered meaning, calligraphy, precision | Ikko Tanaka |

**UI / Product Design → Consumer Apps:**

| Style | Visual Character |
|---|---|
| Flat Minimal | No shadows, limited palette, icon-forward |
| Glassmorphism | Frosted glass, blur, depth illusion |
| Neumorphism | Soft shadow, embossed, monochrome |
| Dark Mode First | High contrast, dark surfaces, vibrant accents |
| Playful / Consumer | Rounded, colorful, friendly, illustrated elements |
| Enterprise Dense | Information-dense, neutral, systematic |
| Editorial App | Magazine-influenced, type-forward, editorial grid |
| Brutalist UI | Raw HTML aesthetic, visible structure, anti-polish |
| Skeuomorphic | Material metaphors, real-world references |
| Bento Grid | Modular card system, variable grid |
| Monochromatic | Single color + neutrals only |

**Brand / Identity → Abstract Marks:**

| Style | Visual Character |
|---|---|
| Geometric Precision | Perfect circles, golden ratio, mathematical |
| Optical Illusion | Op-art influenced, figure-ground tension |
| Negative Space | Shape hidden within shape |
| Gradient Mark | Color transition as brand element |
| Wordmark-as-Shape | Letter becomes icon |
| Dynamic Identity | System that changes across applications |
| Typographic Lockup | Pure type, no icon |

**Typography → Type as Image:**

| Style | Visual Character |
|---|---|
| Typographic Portrait | Face formed from text |
| Type Explosion | Kinetic, scattered letterforms |
| Dimensional Type | 3D letterforms, perspective |
| Deconstructed Type | Letters broken apart, reassembled |
| Concrete Poetry | Text as visual object |
| Variable Font Exploration | Axis-based typographic expression |

---

## Full Taxonomy Size

| Field | Categories | Styles (approx) |
|---|---|---|
| Visual / Graphic | 5 | 45 |
| UI / Product | 5 | 35 |
| Brand / Identity | 5 | 30 |
| Typography | 5 | 25 |
| Motion / Animation | 6 | 30 |
| Illustration | 6 | 35 |
| 3D / Spatial | 5 | 25 |
| Photography | 5 | 25 |
| Fashion / Textile | 4 | 20 |
| Interior / Environmental | 4 | 20 |
| Industrial / Product | 4 | 20 |
| Experimental | 5 | 20 |
| **TOTAL** | **59** | **~330 styles** |

330 styles is the full dataset. User rates only styles within their selected fields. If they pick 3 fields averaging 30 styles each, they rate ~90 styles. At 8 seconds per rating = 12 minutes. Acceptable.

---

## Rating System

### Format: Hot-or-Not + Slider hybrid

For each style, user sees:
- Full-bleed reference image (high quality, carefully curated)
- Style name (small, below — don't prime with words before they react visually)
- Rating: **5-star tap** for quick flow, expandable to **0–100 slider** for nuance

```
┌─────────────────────────────────┐
│                                 │
│   [Full-bleed image]            │
│                                 │
│                                 │
│   Swiss International           │
│   Graphic Design · Poster       │
│                                 │
│   ★ ★ ★ ☆ ☆                    │
│                                 │
│   [Not for me] [← ] [→ Sold]   │
└─────────────────────────────────┘
```

- **Swipe left** = 0 (not for me)
- **Swipe right** = love it (auto 5 stars)
- **Tap stars** = 1–5
- **Hold** = opens 0–100 slider for precision

**Skip is not neutral.** Skipped styles are treated as 2/5 (mild disinterest) not 0. This prevents users from gaming by skipping everything they dislike.

---

## Score Calculation

### Step 1: Raw Style Vector

Each style gets a score 0–100:

```javascript
function normalizeRating(stars, slider = null) {
  if (slider !== null) return slider;
  const map = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
  return map[stars];
}
```

User's raw vector:
```javascript
{
  "swiss_international_poster": 85,
  "bauhaus_poster": 70,
  "brutalist_poster": 90,
  "minimalist_poster": 45,
  "glassmorphism_ui": 20,
  "flat_minimal_ui": 75,
  "dark_mode_first": 95,
  // ... all rated styles
}
```

### Step 2: Category Scores

Aggregate style scores within each category:

```javascript
function getCategoryScore(styles, categoryStyles) {
  const rated = categoryStyles.filter(s => styles[s] !== undefined);
  if (rated.length === 0) return null;
  
  const sum = rated.reduce((acc, s) => acc + styles[s], 0);
  return Math.round(sum / rated.length);
}

// Result:
{
  "poster_design": 72,
  "ui_consumer": 63,
  "brand_abstract": 55,
  // ...
}
```

### Step 3: Field Scores

Aggregate category scores per field:

```javascript
{
  "visual_graphic": 74,
  "ui_product": 63,
  "brand_identity": 58,
  // ...
}
```

### Step 4: Dimension Axes (The Taste Fingerprint)

Beyond raw scores, calculate where on each axis the designer falls. These axes are computed cross-category:

| Axis | Poles | Computed From |
|---|---|---|
| Order ↔ Chaos | Swiss/Grid vs Brutalist/Psychedelic | Poster, layout styles |
| Minimal ↔ Maximal | Minimal poster vs Memphis/Maximalist | Across all fields |
| Classic ↔ Contemporary | Art Nouveau, Bauhaus vs Glassmorphism, Bento | Era-tagged styles |
| Functional ↔ Expressive | Enterprise UI vs Conceptual/Art | UI + Experimental |
| Warm ↔ Cold | Rounded, playful vs Sharp, geometric | Color + form styles |
| Flat ↔ Dimensional | 2D flat vs 3D, shadows, depth | Across fields |
| Literal ↔ Abstract | Representational vs non-representational | Illustration, 3D |
| System ↔ Intuition | Design systems vs expressive typography | Category weighting |

Each axis is a 0–100 value. Together they form the taste fingerprint.

```javascript
function computeAxes(styleVector) {
  return {
    order_chaos: weightedAverage(styleVector, ORDER_STYLES, CHAOS_STYLES),
    minimal_maximal: weightedAverage(styleVector, MINIMAL_STYLES, MAXIMAL_STYLES),
    classic_contemporary: weightedAverage(styleVector, CLASSIC_STYLES, CONTEMPORARY_STYLES),
    functional_expressive: weightedAverage(styleVector, FUNCTIONAL_STYLES, EXPRESSIVE_STYLES),
    warm_cold: weightedAverage(styleVector, WARM_STYLES, COLD_STYLES),
    flat_dimensional: weightedAverage(styleVector, FLAT_STYLES, DIMENSIONAL_STYLES),
    literal_abstract: weightedAverage(styleVector, LITERAL_STYLES, ABSTRACT_STYLES),
    system_intuition: weightedAverage(styleVector, SYSTEM_STYLES, INTUITION_STYLES),
  };
}
```

### Step 5: Designer Archetype Title

Map the 8-axis fingerprint to a designer archetype. There are 32 archetypes — enough to feel specific, few enough to be memorable.

```javascript
const ARCHETYPES = [
  {
    id: "the_systemist",
    title: "The Systemist",
    description: "You think in grids, tokens, and rules. You build the infrastructure other designers work within. Helvetica was a system. So was the iPhone.",
    conditions: {
      order_chaos: [70, 100],
      system_intuition: [70, 100],
      functional_expressive: [0, 40]
    },
    famous_examples: ["Massimo Vignelli", "Josef Müller-Brockmann", "Paul Rand"],
    color: "#1a1a2e"
  },
  {
    id: "the_maximalist",
    title: "The Maximalist",
    description: "You believe empty space is wasted opportunity. Your work is layered, dense, and deliberately overwhelming. Every pixel is a decision.",
    conditions: {
      minimal_maximal: [70, 100],
      order_chaos: [0, 50]
    },
    color: "#ff3366"
  },
  {
    id: "the_brutalist",
    title: "The Brutalist",
    description: "You find beauty in rawness. Your designs expose their own structure. Anti-aesthetic is still an aesthetic — and yours is more considered than it looks.",
    conditions: {
      order_chaos: [60, 100],
      warm_cold: [0, 40],
      functional_expressive: [60, 100]
    },
    color: "#111111"
  },
  {
    id: "the_expressionist",
    title: "The Expressionist",
    description: "Feeling first, system second. Your work is emotionally direct. The best design, to you, makes someone feel something before they understand it.",
    conditions: {
      functional_expressive: [70, 100],
      system_intuition: [0, 40]
    },
    color: "#6a0dad"
  },
  {
    id: "the_classicist",
    title: "The Classicist",
    description: "You draw from history with intention, not nostalgia. Proportion, craft, and time-tested principles guide your hand. You know what endures.",
    conditions: {
      classic_contemporary: [0, 35],
      order_chaos: [60, 100]
    },
    color: "#8b6914"
  },
  {
    id: "the_minimalist",
    title: "The Minimalist",
    description: "You subtract until something essential remains. Your restraint is active, not passive. Every element that stays does so because removing it would be a loss.",
    conditions: {
      minimal_maximal: [0, 30],
      order_chaos: [70, 100]
    },
    color: "#f5f5f0"
  },
  {
    id: "the_experimenter",
    title: "The Experimenter",
    description: "Existing categories bore you. Your strongest work happens when you don't know what you're making yet. You treat every project as a research question.",
    conditions: {
      system_intuition: [0, 35],
      literal_abstract: [60, 100]
    },
    color: "#00ff88"
  },
  {
    id: "the_conceptualist",
    title: "The Conceptualist",
    description: "The idea is the design. Execution is secondary to the strength of the concept. You'd rather have a weak execution of a strong idea than the reverse.",
    conditions: {
      literal_abstract: [70, 100],
      functional_expressive: [60, 100]
    },
    color: "#4040ff"
  },
  // ... 24 more archetypes
];

function matchArchetype(axes) {
  let bestMatch = null;
  let bestScore = -1;
  
  for (const archetype of ARCHETYPES) {
    let score = 0;
    let conditions = 0;
    
    for (const [axis, [min, max]] of Object.entries(archetype.conditions)) {
      conditions++;
      if (axes[axis] >= min && axes[axis] <= max) {
        score++;
      }
    }
    
    const matchRatio = score / conditions;
    if (matchRatio > bestScore) {
      bestScore = matchRatio;
      bestMatch = archetype;
    }
  }
  
  return { archetype: bestMatch, confidence: bestScore };
}
```

---

## Profile Card (Shareable)

This is the viral mechanic. The card must be beautiful, specific, and exportable as an image.

```
┌──────────────────────────────────────┐
│                                      │
│  RUDY                                │
│  ─────────────────                   │
│  THE SYSTEMIST                       │
│                                      │
│  ████░░░░ Order     ████████ System  │
│  ███░░░░░ Minimal   ███░░░░░ Classic │
│  ██░░░░░░ Warm      ████░░░░ Flat    │
│                                      │
│  Top styles:                         │
│  Dark Mode First · Swiss Grid        │
│  Brutalist UI · Kinetic Type        │
│                                      │
│  Fields: UI Design · Typography      │
│          Brand Identity              │
│                                      │
│  designblend.co/@rudy                │
│                                      │
└──────────────────────────────────────┘
```

Generated as a canvas → downloaded as PNG. Shareable on LinkedIn, Twitter, stories.

---

## The Blend Mechanic

User A shares their profile link with User B. User B (who has also completed their profile) opens the link and sees a Blend result.

### Similarity Calculation: Cosine Similarity

The taste vectors are high-dimensional. The right similarity metric is **cosine similarity** — it measures the angle between two vectors, which captures taste alignment regardless of how "intensely" each person rates things.

```javascript
function cosineSimilarity(vectorA, vectorB) {
  // Get all style keys present in either vector
  const allStyles = [...new Set([
    ...Object.keys(vectorA),
    ...Object.keys(vectorB)
  ])];
  
  // Build arrays (missing values = 50, neutral)
  const a = allStyles.map(s => vectorA[s] ?? 50);
  const b = allStyles.map(s => vectorB[s] ?? 50);
  
  // Cosine similarity
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (magnitudeA * magnitudeB);
}

function getBlendScore(userA, userB) {
  const similarity = cosineSimilarity(userA.styleVector, userB.styleVector);
  // Convert from 0-1 cosine range to percentage (typical range is 0.6-1.0 for humans)
  // Normalize: 0.6 = 0%, 1.0 = 100%
  const normalized = Math.max(0, (similarity - 0.6) / 0.4);
  return Math.round(normalized * 100);
}
```

### Blend Card

```
┌──────────────────────────────────────────┐
│                                          │
│  RUDY × ANANYA                           │
│  ─────────────────────                   │
│                                          │
│         73% DESIGN BLEND                 │
│                                          │
│  ████████████████████░░░░░░░             │
│                                          │
│  WHERE YOU ALIGN:                        │
│  ✦ Dark, editorial aesthetics            │
│  ✦ Type-forward design                   │
│  ✦ Geometric abstraction                 │
│                                          │
│  WHERE YOU DIVERGE:                      │
│  Rudy →   Systemic, cold                │
│  Ananya → Expressive, warm              │
│                                          │
│  IF YOU COLLABORATED:                    │
│  "A rigorous system with a human pulse"  │
│                                          │
│  designblend.co/blend/rudy×ananya        │
│                                          │
└──────────────────────────────────────────┘
```

The "If You Collaborated" line is generated by Gemini — it synthesizes both archetypes into a creative partnership description. This is the most shareable line on the card.

```javascript
async function generateCollaborationLine(archetypeA, archetypeB) {
  const prompt = `
Two designers are blending their taste profiles.
Designer 1: ${archetypeA.title} — ${archetypeA.description}
Designer 2: ${archetypeB.title} — ${archetypeB.description}

Write ONE sentence (max 8 words, poetic, specific) describing 
what their collaboration would produce. Not generic. 
Examples of good outputs:
- "A rigorous system with a human pulse"
- "Structure that forgets it was ever planned"
- "Brutality made warm enough to live inside"
Return ONLY the sentence, no quotes.
  `;
  
  const result = await gemini.generateContent(prompt);
  return result.response.text().trim();
}
```

---

## Image Curation Strategy

Every style node needs one canonical reference image. This is significant content work — 330 images, carefully chosen.

**Requirements per image:**
- Immediately recognizable as representative of that style
- High resolution (minimum 1200×1600)
- Legally usable (public domain, Creative Commons, original, or licensed)
- No text overlays that explain the style (let the image speak)
- Consistent aspect ratio per session (portrait 3:4)

**Sources:**
- Wikimedia Commons (historical design)
- Behance (contemporary, with permission)
- Dribbble (with permission)
- Original commissioned shots for ambiguous styles
- Museum digital archives (MoMA, V&A, Cooper Hewitt)

**Hosting:** Cloudinary with automatic optimization. One master image per style, Cloudinary serves appropriate size per device.

This curation is the longest production task in the project. Budget 20–40 hours for 330 carefully chosen images.

---

## Technical Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | React + Vite | Component architecture |
| Styling | Tailwind CSS | Speed |
| Database | Supabase | Auth + PostgreSQL + real-time |
| Image hosting | Cloudinary | Automatic optimization, CDN |
| AI (archetype + blend line) | Gemini 1.5 Flash | Fast, cheap, creative text |
| Profile card export | html2canvas | Client-side image generation |
| Hosting | Vercel | Easy deploys |

### Database Schema

```sql
-- Users
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  archetype_id TEXT,
  axes JSONB,          -- 8 axis values
  style_vector JSONB,  -- Full style scores
  field_scores JSONB,  -- Per-field aggregates
  category_scores JSONB,
  selected_fields TEXT[],
  is_public BOOLEAN DEFAULT TRUE
);

-- For blend lookups
CREATE INDEX ON profiles USING gin (style_vector);
CREATE INDEX ON profiles (archetype_id);

-- Blend cache (avoid recalculating)
CREATE TABLE blends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES profiles(id),
  user_b UUID REFERENCES profiles(id),
  blend_score INTEGER,
  collaboration_line TEXT,
  shared_strengths TEXT[],
  divergences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_a, user_b)
);
```

---

## Internationalization Consideration

Design style names and archetypes must translate globally. Japanese design history, African pattern design, Latin American graphic traditions are underrepresented in Western-centric design taxonomies.

Styles to explicitly include:
- Japanese Graphic Design (Tadanori Yokoo, Ikko Tanaka tradition)
- African Pattern / Kente, Ankara textile traditions
- Indian Warli, Madhubani folk illustration traditions
- Latin American Muralism influence
- Soviet Constructivism
- Chinese Ink tradition meeting contemporary

This isn't tokenism — these traditions produce distinct taste vectors that would otherwise collapse into generic "non-Western" categories.

---

## Content Moderation

Style vectors are not editable after submission — they're computed from ratings. No user-generated text content in the core flow. The only moderation surface is usernames and display names — standard profanity filter + manual review.

---

## Scale Concern (Your Original Point)

Your original idea included: "automatic scoring across everyone on the web once a new profile registers."

This means every new profile triggers a similarity calculation against all existing profiles. At 100 users this is trivial. At 100,000 users this requires:

- **Approximate nearest neighbor search** (not exact cosine) — libraries like `pgvector` in Postgres can do this
- **Pre-computed clusters** — group profiles by archetype first, search within clusters
- **Async processing** — don't block the UI on similarity calculation, run it in a background job

For v1: don't build global matching. Build the direct Blend (share a link with one person). Add "Find Your Design Twins" (automatic global matching) as a paid/premium feature in v2 when you have the infrastructure to support it.

---

## Build Sequence

**Phase 1 — Core Quiz (Today: 4–5 hours)**
- [ ] Hardcode 3 fields, 5 categories each, 5 styles each = 75 styles to start
- [ ] Quiz flow with image + star rating
- [ ] Score calculation → archetype match
- [ ] Profile card generated as PNG

**Phase 2 — Sharing (Next session)**
- [ ] Supabase auth + profile storage
- [ ] Public profile URL
- [ ] Blend calculation between two profiles
- [ ] Blend card export

**Phase 3 — Content (Ongoing)**
- [ ] Expand to full 330 styles
- [ ] Curate 330 reference images
- [ ] Write all 32 archetype descriptions
- [ ] Gemini collaboration line generation

**Phase 4 — Growth**
- [ ] Global "Find Your Design Twins" matching
- [ ] Community feed of public profiles
- [ ] Embed card for portfolios and LinkedIn
