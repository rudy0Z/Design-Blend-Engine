# Design Blend — Adaptive Quiz Engine PRD
### Taste Traversal System: How the Quiz Actually Works

---

## The Core Concept Shift

**Old thinking:** Show all styles, collect ratings, compute score.

**New thinking:** The quiz is a guided descent through a taste graph.
Every response is a signal. Every signal reshapes the path forward.
The system is finding your taste fingerprint through elimination and confirmation,
like a binary search — but for aesthetic sensibility.

The quiz doesn't show you everything. It shows you the minimum number of
styles needed to confidently map your taste vector. Smart questions,
not exhaustive ones.

---

## Mental Model: The Taste Graph

The taxonomy is not a flat list or a tree. It's a **weighted directed graph**.

```
Nodes = individual styles
Edges = relationships between styles
Edge weight = probability of co-liking (if you like A, how likely do you like B?)
Edge direction = which way the transition flows
```

Each node has:
- A position in the overall taste space (8-dimensional axes)
- A set of neighbor nodes (similar styles)
- A set of contrast nodes (opposite styles)
- A field tag (UI, Graphic, Brand, etc.)
- A depth level (1 = broad, 5 = extremely niche)

---

## Taxonomy: Unified Graph Structure

All fields together. UI/UX and Graphic Design have more nodes (deeper).
Other fields have shallower depth in v1 — they expand later.

### Depth Levels Defined

```
Depth 1: Field        — "Graphic Design", "UI Design"
Depth 2: Domain       — "Poster Design", "Visual Design Language"
Depth 3: Category     — "Minimalist Poster", "Swiss International"
Depth 4: Style        — "Noma Bar negative space", "Müller-Brockmann grid"
Depth 5: Niche        — "Swiss grid applied to digital UI", "Brutalist poster with color"
```

User never sees these labels. They just see images and react.

---

## Full Unified Node Graph (v1)

### GRAPHIC DESIGN BRANCH

```
[Graphic Design]
│
├── [Poster Design] depth:2
│   ├── [Order-based Poster] depth:3
│   │   ├── Swiss International depth:4
│   │   │   ├── Pure Helvetica Grid depth:5
│   │   │   ├── Swiss + Photography depth:5
│   │   │   └── Swiss Digital Application depth:5
│   │   ├── Bauhaus depth:4
│   │   │   ├── Geometric Bauhaus depth:5
│   │   │   └── Bauhaus Photography depth:5
│   │   ├── Constructivist depth:4
│   │   │   ├── Red/Black Constructivist depth:5
│   │   │   └── Photomontage Constructivist depth:5
│   │   └── Japanese Grid Poster depth:4
│   │       ├── Ikko Tanaka style depth:5
│   │       └── Modern Japanese Minimal depth:5
│   │
│   ├── [Expressive Poster] depth:3
│   │   ├── Psychedelic depth:4
│   │   │   ├── Optical Illusion Psychedelic depth:5
│   │   │   └── Brush Psychedelic depth:5
│   │   ├── Punk / Zine depth:4
│   │   │   ├── Cut-and-paste Zine depth:5
│   │   │   └── Digital Punk depth:5
│   │   ├── Maximalist depth:4
│   │   │   ├── Layered Maximalist depth:5
│   │   │   └── Paula Scher Dense depth:5
│   │   └── Memphis / Pop depth:4
│   │       ├── Classic Memphis depth:5
│   │       └── Neo-Memphis depth:5
│   │
│   ├── [Historical Poster] depth:3
│   │   ├── Art Nouveau depth:4
│   │   ├── Art Deco depth:4
│   │   ├── Soviet Agitprop depth:4
│   │   └── Retrofuturism depth:4
│   │
│   └── [Conceptual Poster] depth:3
│       ├── Minimalist Conceptual depth:4
│       │   ├── Negative Space Single Object depth:5
│       │   └── Pure Type Poster depth:5
│       └── Brutalist Conceptual depth:4
│
├── [Editorial / Print Design] depth:2
│   ├── [Classic Editorial] depth:3
│   │   ├── Magazine Grid depth:4
│   │   ├── Book Typography depth:4
│   │   └── Newspaper Layout depth:4
│   ├── [Expressive Editorial] depth:3
│   │   ├── Ray Gun style depth:4
│   │   ├── Kinfolk Minimal depth:4
│   │   └── Data Editorial depth:4
│   └── [DIY / Zine Publishing] depth:3
│       ├── Photocopy Zine depth:4
│       └── Digital Zine depth:4
│
├── [Brand / Identity] depth:2
│   ├── [Wordmark] depth:3
│   │   ├── Geometric Wordmark depth:4
│   │   ├── Serif Wordmark depth:4
│   │   └── Hand-lettered Wordmark depth:4
│   ├── [Symbol / Mark] depth:3
│   │   ├── Geometric Abstract Mark depth:4
│   │   ├── Negative Space Mark depth:4
│   │   ├── Pictorial Literal depth:4
│   │   └── Dynamic Identity System depth:4
│   ├── [Brand Systems] depth:3
│   │   ├── Color-dominant System depth:4
│   │   ├── Pattern-dominant System depth:4
│   │   └── Type-dominant System depth:4
│   └── [Retro / Niche Brand] depth:3
│       ├── Vintage Revival depth:4
│       ├── Artisan / Craft depth:4
│       └── Brutalist Brand depth:4
│
├── [Illustration] depth:2
│   ├── [Flat / Vector] depth:3
│   │   ├── Flat Geometric depth:4
│   │   ├── Isometric depth:4
│   │   └── Character Flat depth:4
│   ├── [Expressive Illustration] depth:3
│   │   ├── Editorial Conceptual depth:4
│   │   ├── Painterly Digital depth:4
│   │   └── Collage / Mixed Media depth:4
│   ├── [Textured / Handmade] depth:3
│   │   ├── Ink Line Drawing depth:4
│   │   ├── Risograph depth:4
│   │   └── Naive / Folk depth:4
│   └── [Technical] depth:3
│       └── Technical Diagram depth:4
│
└── [Typography Design] depth:2
    ├── [Type as Image] depth:3
    │   ├── Kinetic / Exploded Type depth:4
    │   ├── Typographic Portrait depth:4
    │   └── Dimensional Type depth:4
    ├── [Expressive Lettering] depth:3
    │   ├── Custom Hand Lettering depth:4
    │   ├── Vernacular / Sign-painting depth:4
    │   └── Modern Calligraphy depth:4
    └── [Experimental Type] depth:3
        ├── Deconstructed Type depth:4
        ├── Concrete Poetry depth:4
        └── Variable Font Expression depth:4
```

---

### UI / UX DESIGN BRANCH

```
[UI / UX Design]
│
├── [Visual Design Language] depth:2
│   ├── [Minimal / Flat] depth:3
│   │   ├── Pure Flat Minimal depth:4
│   │   │   ├── Surgical Whitespace (Stripe-style) depth:5
│   │   │   └── Icon-dominant Flat depth:5
│   │   ├── Typographic-first UI depth:4
│   │   │   ├── iA Writer / Bear style depth:5
│   │   │   └── Editorial App depth:5
│   │   └── Monochromatic UI depth:4
│   │       ├── Pure Black/White depth:5
│   │       └── Single Hue System depth:5
│   │
│   ├── [Depth / Material] depth:3
│   │   ├── Glassmorphism depth:4
│   │   │   ├── iOS-style Frosted depth:5
│   │   │   └── Dark Glassmorphism depth:5
│   │   ├── Neumorphism depth:4
│   │   ├── Skeuomorphism depth:4
│   │   │   ├── Classic iOS 6 style depth:5
│   │   │   └── Modern Skeuomorphic depth:5
│   │   └── Claymorphism depth:4
│   │
│   ├── [Dark / Editorial] depth:3
│   │   ├── Dark Mode Editorial depth:4
│   │   │   ├── Linear / Vercel style depth:5
│   │   │   └── Developer Tool Dark depth:5
│   │   ├── Neon on Dark depth:4
│   │   └── Retro Computing / Terminal depth:4
│   │
│   ├── [Vibrant / Expressive] depth:3
│   │   ├── Vibrant Brand Color depth:4
│   │   │   ├── Duolingo playful depth:5
│   │   │   └── Spotify dark vibrant depth:5
│   │   ├── Aurora / Mesh Gradient depth:4
│   │   ├── Claymorphism + Color depth:4
│   │   └── Bento Grid Expressive depth:4
│   │
│   └── [System-based] depth:3
│       ├── Material Design depth:4
│       │   ├── Material You (tonal) depth:5
│       │   └── Material Design 2 depth:5
│       ├── Fluent Design depth:4
│       └── Spatial UI (AR/VR) depth:4
│
├── [Layout Philosophy] depth:2
│   ├── [Structured] depth:3
│   │   ├── Strict Column Grid depth:4
│   │   ├── Card-dominant depth:4
│   │   │   ├── Uniform Cards depth:5
│   │   │   └── Bento Variable Cards depth:5
│   │   └── Dashboard Dense depth:4
│   ├── [Spacious] depth:3
│   │   ├── Extreme Whitespace depth:4
│   │   ├── Single Column Reading depth:4
│   │   └── Full-bleed Immersive depth:4
│   └── [Editorial / Expressive] depth:3
│       ├── Asymmetric Layout depth:4
│       ├── Scroll Storytelling depth:4
│       └── Floating Panel System depth:4
│
├── [Interaction Philosophy] depth:2
│   ├── [Motion-rich] depth:3
│   │   ├── Physics-based Spring depth:4
│   │   ├── Cinematic Transitions depth:4
│   │   └── Hover-rich Desktop depth:4
│   ├── [Minimal Motion] depth:3
│   │   ├── Instant / Snappy depth:4
│   │   └── Intentionally Static depth:4
│   └── [Pattern-driven] depth:3
│       ├── Command Palette First depth:4
│       ├── Gesture Native depth:4
│       └── Conversational UI depth:4
│
├── [Product Type] depth:2
│   ├── B2B SaaS depth:3
│   ├── Consumer App depth:3
│   ├── Developer Tool depth:3
│   ├── Creative Tool depth:3
│   ├── AI-native Product depth:3
│   └── Productivity App depth:3
│
└── [Typography in UI] depth:2
    ├── Geometric Sans dominant depth:3
    ├── Humanist Sans depth:3
    ├── Serif in UI depth:3
    ├── Monospace UI depth:3
    └── Oversized Display depth:3
```

---

### OTHER FIELDS (Shallower in v1 — expand later)

```
[Motion / Animation]          depth max: 3
├── UI Animation / Micro      depth:3
├── Generative / Code Motion  depth:3
├── Title Sequence            depth:3
└── Brand Motion              depth:3

[Photography Direction]       depth max: 3
├── Product Photography       depth:3
├── Editorial / Portrait      depth:3
└── Abstract / Fine Art       depth:3

[Industrial / Product Design] depth max: 3
├── Consumer Electronics      depth:3
├── Furniture / Object        depth:3
└── Sustainable Design        depth:3

[Fashion / Textile]           depth max: 3
├── Pattern / Surface Design  depth:3
├── Garment Silhouette        depth:3
└── Material Exploration      depth:3

[Experimental / Conceptual]   depth max: 3
├── Generative / Code Art     depth:3
├── Speculative Design        depth:3
└── Interaction Art           depth:3
```

---

## The Adaptive Quiz Engine

### Core Algorithm: Bayesian Taste Traversal

The quiz engine maintains a **probability distribution** across all 8 taste axes.
Each answer updates that distribution. The next question is chosen to
maximize **information gain** — the question that will reduce uncertainty
about your taste vector the most.

This is fundamentally a search problem: find the taste vector in minimum questions.

```javascript
class QuizEngine {
  constructor(styleGraph) {
    this.graph = styleGraph;
    
    // Start with uniform distribution — we know nothing
    this.axisDistribution = {
      order_chaos: { mean: 50, confidence: 0 },
      minimal_maximal: { mean: 50, confidence: 0 },
      classic_contemporary: { mean: 50, confidence: 0 },
      functional_expressive: { mean: 50, confidence: 0 },
      warm_cold: { mean: 50, confidence: 0 },
      flat_dimensional: { mean: 50, confidence: 0 },
      literal_abstract: { mean: 50, confidence: 0 },
      system_intuition: { mean: 50, confidence: 0 },
    };
    
    this.history = [];           // All rated styles
    this.currentPath = [];       // Current traversal path
    this.switchCount = 0;        // How many times we've pivoted direction
    this.fieldsCovered = new Set(); // Which fields we've touched
  }
```

---

### Phase 1: Field Seeding (Questions 1–3)

Before adaptive traversal begins, show 3 broad "field probe" images —
one from Graphic Design, one from UI Design, one from a third random field.

These are depth:2 nodes — broad enough to be immediately understood.

```javascript
function getSeedQuestions() {
  return [
    graph.getNode('graphic_expressive_poster'),    // Bold graphic design
    graph.getNode('ui_dark_editorial'),             // Product/UI design
    graph.getNode('motion_generative'),             // Wild card field
  ];
}
```

The ratings on these 3 questions give the engine its starting position:
- Which fields the user responds to
- Initial axis readings (a Constructivist poster high-rater starts with high Order + Cold)
- Which branch to enter first

---

### Phase 2: Adaptive Traversal (Questions 4–N)

```javascript
function getNextQuestion(engine) {
  const lastRating = engine.history[engine.history.length - 1];
  
  // CASE 1: Strong positive (rating >= 75)
  // → Go deeper into this style's sub-nodes
  if (lastRating.score >= 75) {
    return goDeeper(lastRating.node, engine);
  }
  
  // CASE 2: Strong negative (rating <= 25)
  // → This direction is wrong. Pivot to contrast node.
  if (lastRating.score <= 25) {
    return pivotToContrast(lastRating.node, engine);
  }
  
  // CASE 3: Mild positive (50–74)
  // → Explore neighbor — similar but not identical
  if (lastRating.score >= 50 && lastRating.score < 75) {
    return exploreNeighbor(lastRating.node, engine);
  }
  
  // CASE 4: Neutral (26–49)
  // → This style isn't exciting them. Try a sideways move.
  // → Different category, same axis position
  return lateralMove(lastRating.node, engine);
}
```

---

### The Four Navigation Moves

```javascript
// MOVE 1: GO DEEPER
// Strong positive → show a more specific version of what they liked
function goDeeper(node, engine) {
  const children = engine.graph.getChildren(node.id);
  
  if (children.length === 0) {
    // Already at max depth — show sibling styles at same depth
    return exploreSiblings(node, engine);
  }
  
  // Pick child with highest information gain on least-confident axis
  return children
    .sort((a, b) => informationGain(b, engine) - informationGain(a, engine))
    [0];
}

// MOVE 2: PIVOT TO CONTRAST
// Strong negative → show something on the opposite end of the axis
function pivotToContrast(node, engine) {
  const contrastNodes = engine.graph.getContrastNodes(node.id);
  
  // Don't show something already rated
  const unrated = contrastNodes.filter(n => !engine.hasRated(n.id));
  
  if (unrated.length === 0) {
    // All contrast nodes already rated — switch to a different field
    return switchField(engine);
  }
  
  engine.switchCount++;
  return unrated[0];
}

// MOVE 3: EXPLORE NEIGHBOR
// Mild positive → test if they like a close variation
// Helps distinguish "I like this category generally" from "I like THIS specific style"
function exploreNeighbor(node, engine) {
  const neighbors = engine.graph.getNeighbors(node.id)
    .filter(n => !engine.hasRated(n.id))
    .filter(n => similarDepth(n, node));  // Stay at same depth level
    
  return neighbors[0] || goDeeper(node, engine);
}

// MOVE 4: LATERAL MOVE
// Neutral rating → this axis isn't defining. Move to a different axis.
// Show something from same depth but different category branch.
function lateralMove(node, engine) {
  // Find the axis we know least about
  const weakestAxis = getLeastConfidentAxis(engine.axisDistribution);
  
  // Find a node that would strongly inform that axis
  const candidates = engine.graph.getAllNodes()
    .filter(n => !engine.hasRated(n.id))
    .filter(n => n.depth <= node.depth + 1)
    .filter(n => n.axisLoadings[weakestAxis] > 0.7)  // Strong signal on that axis
    .sort((a, b) => informationGain(b, engine) - informationGain(a, engine));
    
  return candidates[0] || switchField(engine);
}
```

---

### Information Gain Calculation

The engine always picks the question that will reduce the most uncertainty.

```javascript
function informationGain(node, engine) {
  let gain = 0;
  
  for (const [axis, value] of Object.entries(node.axisLoadings)) {
    const currentConfidence = engine.axisDistribution[axis].confidence;
    
    // High gain if:
    // 1. Axis has low confidence (we don't know much yet)
    // 2. Node has strong loading on that axis (clear signal)
    // 3. We haven't explored this field much
    
    gain += (1 - currentConfidence) * Math.abs(value) * 0.5;
  }
  
  // Bonus if this is a new field — increases coverage
  if (!engine.fieldsCovered.has(node.field)) {
    gain *= 1.3;
  }
  
  return gain;
}
```

---

### Updating Axis Distribution After Each Rating

```javascript
function updateDistribution(engine, node, rating) {
  // Normalize rating to -1 to +1 (50 = neutral = 0)
  const signal = (rating - 50) / 50;
  
  for (const [axis, loading] of Object.entries(node.axisLoadings)) {
    const current = engine.axisDistribution[axis];
    
    // Bayesian update: new mean weighted by confidence
    const signalStrength = Math.abs(loading) * Math.abs(signal);
    const axisDirection = loading > 0 ? signal : -signal;
    
    // Update mean toward what this rating implies
    const learningRate = 0.3 * (1 - current.confidence);
    current.mean = current.mean + (axisDirection * 50 * learningRate);
    current.mean = Math.max(0, Math.min(100, current.mean));
    
    // Increase confidence
    current.confidence = Math.min(1, current.confidence + signalStrength * 0.15);
  }
  
  engine.fieldsCovered.add(node.field);
}
```

---

### Node Data Structure

Every node in the graph needs:

```javascript
{
  id: "swiss_international",
  label: "Swiss International",
  field: "graphic_design",
  domain: "poster_design",
  depth: 4,
  
  // Image shown to user
  imageUrl: "cloudinary_url_here",
  
  // Graph relationships
  parent: "order_based_poster",
  children: ["pure_helvetica_grid", "swiss_photography", "swiss_digital"],
  neighbors: ["bauhaus", "constructivist", "japanese_grid_poster"],
  contrasts: ["psychedelic_poster", "maximalist_poster", "punk_zine"],
  
  // Where this node sits on each axis (−1 to +1)
  // Positive = toward the right pole of each axis
  axisLoadings: {
    order_chaos: 0.9,        // Very high Order
    minimal_maximal: 0.6,    // Leans Minimal
    classic_contemporary: -0.3, // Slightly Classic
    functional_expressive: 0.4, // Leans Functional
    warm_cold: -0.7,         // Cold
    flat_dimensional: 0.5,   // Flat
    literal_abstract: -0.2,  // Slightly Abstract
    system_intuition: 0.9,   // Very high System
  }
}
```

---

### When Does The Quiz End?

```javascript
function shouldTerminate(engine) {
  // Termination conditions (ANY of these):
  
  // 1. All axes have high confidence
  const allConfident = Object.values(engine.axisDistribution)
    .every(axis => axis.confidence > 0.75);
  if (allConfident) return { reason: 'complete', questionsAsked: engine.history.length };
  
  // 2. Maximum questions reached
  if (engine.history.length >= 60) return { reason: 'max_reached' };
  
  // 3. Minimum viable profile (fast mode)
  const enoughData = engine.history.length >= 20 &&
    Object.values(engine.axisDistribution)
      .filter(a => a.confidence > 0.6).length >= 6;
  if (enoughData) return { reason: 'viable_profile' };
  
  return false;
}
```

**Typical quiz length:** 25–45 questions. 
At 6 seconds per question = 2.5–4.5 minutes.
Much better than 30 minutes.

---

### Cross-Field Connections (The Interesting Part)

The graph has edges that cross fields. This is what makes it a graph,
not a tree. A designer who loves Swiss Grid posters might also love
strict-grid UI. The engine can traverse that connection.

```javascript
const CROSS_FIELD_EDGES = [
  // Graphic → UI connections
  { from: 'swiss_international', to: 'ui_grid_strict', weight: 0.8 },
  { from: 'brutalist_poster', to: 'ui_brutalist_ui', weight: 0.85 },
  { from: 'editorial_expressive', to: 'ui_editorial_web', weight: 0.7 },
  { from: 'maximalist_poster', to: 'ui_dashboard_dense', weight: 0.5 },
  { from: 'minimal_conceptual', to: 'ui_spacious_minimal', weight: 0.75 },
  { from: 'retro_computing_poster', to: 'ui_retro_computing', weight: 0.9 },
  { from: 'kinetic_type', to: 'ui_micro_physics', weight: 0.6 },
  
  // UI → Graphic connections  
  { from: 'ui_bento_grid', to: 'gd_editorial_data', weight: 0.65 },
  { from: 'ui_dark_editorial', to: 'gd_magazine_classic', weight: 0.6 },
  
  // Graphic → Motion connections
  { from: 'gd_kinetic_type', to: 'motion_kinetic', weight: 0.9 },
  { from: 'gd_generative', to: 'motion_generative', weight: 0.85 },
  
  // UI → Motion connections
  { from: 'ui_micro_physics', to: 'motion_ui_animation', weight: 0.8 },
  { from: 'ui_cinematic_transition', to: 'motion_title_sequence', weight: 0.7 },
];
```

When the engine traverses a cross-field edge, it naturally expands the
user's profile beyond their starting field — revealing connections in their
taste they might not have consciously known existed.

---

## Rating UI — The Interaction Mechanic

This must feel effortless. Friction kills completion rates.

### Primary Interaction: Swipe / Tap

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│         [Full-bleed image]           │
│                                      │
│                                      │
│                                      │
│   ◀ Not for me     Love this ▶       │
│                                      │
│   ─────────────────────── (drag)     │
│              ●                       │
│   0    25   50   75   100            │
│                                      │
│   [Skip — unfamiliar]                │
└──────────────────────────────────────┘
```

- **Swipe left / tap left** → 0–25 (not for me)
- **Swipe right / tap right** → 75–100 (love it)
- **Drag slider** → precise 0–100 (for nuance)
- **Skip** → genuinely unfamiliar (not rated, treated separately)

**Skip vs Low Rating distinction:**
- Low rating (0–25) = "I've seen this, don't like it"
- Skip = "I don't know enough about this to rate it"
- Skips are not treated as negatives — they're excluded from that axis calculation

**Response time matters:**
```javascript
// Fast swipe (< 1 second) = instinctive gut reaction
// Weight it higher than a slow deliberate rating
// Gut reactions are more honest taste signals than considered ones

function applyResponseTimeWeight(rating, responseTimeMs) {
  if (responseTimeMs < 1000) return { ...rating, weight: 1.3 }; // Gut reaction
  if (responseTimeMs < 3000) return { ...rating, weight: 1.0 }; // Normal
  return { ...rating, weight: 0.85 }; // Overthought
}
```

---

## Profile Output

After quiz completion, three outputs generated:

### 1. Taste Fingerprint (Radar Chart)
8 axes rendered as a radar/spider chart. This is the visual signature.
No two designers will have identical shapes.

### 2. AI-Generated Personal Title (Groq call #1)
As discussed — specific to exact axis values, not generic archetype.

### 3. Top Style DNA
The 5–8 styles with highest confirmed scores from the traversal.
These are shown on the profile card as your "design DNA."

```
YOUR DESIGN DNA:
Swiss International · Dark Editorial UI
Kinetic Typography · Minimal Conceptual Poster
Command Palette UX
```

### 4. Archetype (Rule-based, no AI)
Computed from axis values. One of 32 archetypes. Always computed,
never generated — deterministic and fast.

### 5. Field Distribution
What % of your taste comes from which field:
```
Graphic Design:  48%
UI Design:       35%
Motion:          12%
Other:            5%
```

---

## Database: Storing the Graph

The style graph is stored as two tables:

```sql
-- Nodes
CREATE TABLE style_nodes (
  id TEXT PRIMARY KEY,           -- 'swiss_international'
  label TEXT,
  field TEXT,
  domain TEXT,
  depth INTEGER,
  image_url TEXT,
  parent_id TEXT,
  axis_loadings JSONB,           -- { order_chaos: 0.9, ... }
  metadata JSONB                 -- neighbors, contrasts, children arrays
);

-- Edges (explicit relationship table)
CREATE TABLE style_edges (
  from_node TEXT REFERENCES style_nodes(id),
  to_node TEXT REFERENCES style_nodes(id),
  edge_type TEXT,                -- 'parent_child' | 'neighbor' | 'contrast' | 'cross_field'
  weight FLOAT,                  -- 0 to 1, co-liking probability
  PRIMARY KEY (from_node, to_node, edge_type)
);

-- User quiz sessions
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  question_count INTEGER,
  ratings JSONB,                 -- Array of { node_id, score, response_time_ms }
  traversal_path JSONB,          -- Sequence of nodes shown
  axis_distribution JSONB,       -- Final axis values + confidence
  terminated_reason TEXT         -- 'complete' | 'max_reached' | 'viable_profile'
);
```

---

## Edge Case Handling

| Scenario | Engine Response |
|---|---|
| User skips 5+ in a row | Engine shows broader depth:2 nodes to reorient |
| User rates everything 50 (indifferent) | Show extreme contrast pair to force differentiation |
| User only likes one field | Fine — profile is deep in that field, shallow elsewhere |
| User changes mind (rates high then similar node low) | Both ratings kept, confidence weight reduced for that axis |
| User quits early (<15 questions) | Partial profile generated with low-confidence warning |
| All depth:5 nodes exhausted in a branch | Lateral move to new field |

---

## Build Sequence for This System

**Phase 1: Graph Data (Before Any Code)**
Build the node graph as a JSON file first.
Start with 80 nodes (40 UI, 40 Graphic) and all their relationships.
This is manual work — 1–2 days. Cannot be automated.
Every node needs: image_url, axis_loadings, neighbors, contrasts, children.

**Phase 2: Engine Core**
Implement the 4 navigation moves and axis update logic.
Test with hardcoded sequences before connecting to UI.
Unit testable — given this history of ratings, what question comes next?

**Phase 3: Quiz UI**
Swipe/tap interface, image display, progress indicator.
No backend needed yet — pure frontend with the engine running client-side.

**Phase 4: Profile Output**
Radar chart, archetype matching, title generation (Groq).
Profile card export.

**Phase 5: Backend + Sharing**
Supabase auth, profile storage, blend calculation.
