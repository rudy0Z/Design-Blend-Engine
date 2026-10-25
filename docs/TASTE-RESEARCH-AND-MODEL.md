# Design Blend — Taste Research & Product Model

**Status:** Research synthesis and product proposal; not a validated psychological instrument or final scoring specification.
**Purpose:** Define what Design Blend means by *personal design taste*, how it differs from industry/field taxonomy, and what evidence and safeguards are required before making claims about similarity.

---

## Executive position

**Design taste is not a field, an industry, a style label, or a quality score.** In this product, taste should mean a person's evolving, context-sensitive pattern of attraction, aversion, attention, and trade-offs when encountering specific designed work—and the evidence and explanations behind those reactions.

Fields and industries answer **where / for what context?** Taste answers **what qualities does this person respond to, in which contexts, and how reliably have we observed that?**

The product must not claim to measure universal or objectively “good” taste. It can make a narrower, defensible claim: **it summarizes and compares expressed preferences, with context, evidence, uncertainty, and user correction visible.**

This is a product model informed by research, not a settled scientific definition. Research on aesthetics uses varying constructs (liking, beauty, interest, judgment, expertise); they should not be silently treated as interchangeable.

## 1. Evidence synthesis

### 1.1 Individual taste is structured, not just noise

A 2025 study on individualized image ratings reports that cohorts of people with similar rating patterns predicted held-out ratings better than random cohorts and better than mean-image ratings. This supports exploring preference-pattern models rather than relying only on population averages. It does **not** establish a universal taste taxonomy, prove that similarity means compatibility, or validate any particular Design Blend score.[1]
### 1.2 Aesthetic experience is interactive, situated, and not reducible to a label

The theoretical framework should treat aesthetic response as an interaction among artifact, viewer, cognitive/emotional processing, and social context—not as a single property contained in an image. This is a useful conceptual basis, not a definition of one measurable “taste trait.”[12][13]

In industrial-design preference research, novelty and typicality jointly predicted appeal in the studied stimuli. This suggests testing contextual trade-offs rather than assuming that “more novel” or “more familiar” is always preferred.[14] Museum context has also been shown to affect valuation and memory in art-viewing research; this supports recording presentation context, while transfer to everyday product design remains untested.[16]

Cross-domain preference research reports associations with personality and experience, but only partial consistency across art, architecture, and music. Design Blend should test transfer between contexts instead of presuming that one global preference generalizes everywhere.[15]

### 1.3 Context, culture, and domain differences matter

Cross-cultural evidence shows a mixture of regularities and variation: a 2025 study collected 401,403 preference judgments from 4,835 participants across 10 countries and reported modality-specific cultural differences. Its stimuli were shapes, curvature, colors, and music—not a representative sample of professional design work—so transfer to every creative domain remains a hypothesis.[3] Research comparing natural and human-made visual domains similarly found stronger agreement for faces and landscapes than for architecture and artworks, where individual differences were stronger.[2]

Recent work on universality and aesthetic inference distinguishes immediate affective response from responses involving interest, interpretation, and cognitive processing, and discusses culture-dependent learning. This argues against assuming that a visual property has the same meaning or appeal in every culture or use context.[4]

### 1.4 “Taste” has multiple meanings in professional discourse

Practitioner discussions use “taste” to mean different things: noticing and judging details, having a point of view, curating references, recognizing quality, making trade-offs, or simply liking a particular style. A research paper on product-choice judgments also distinguishes professional expertise from consumption-derived aesthetic acumen; its construct is narrow and should not be adopted as a universal taste definition.[5]

Aesthetic judgment research also includes different judgment styles (e.g., concrete, analytical, symbolic, emotional), but such categories are research constructs—not safe personality labels for product profiles.[6]

### 1.5 Practitioner discourse: useful signals, not consensus

Public designer discussions treat “taste” variously as attention to details, a point of view, curation, judgment, experience, or personal liking. One X author describes studying and deconstructing interfaces as a way to develop judgment; another argues for developing a “palate” through curiosity and feedback; a third questions whether taste can be explained beyond intuition.[19][20][21]

Reddit discussions likewise ask whether taste is innate, learnable, or subjective. Search-result excerpts include advice to broaden exposure and learn from creative work, but full thread bodies were inaccessible during research. Treat these as leads and product-language material only.[8][9] A separate Reddit thread frames design judgment as more salient as AI makes execution easier.[17] Another asks how taste can be subjective when people still make comparative judgments.[18]

A separate X thread argues AI tools have raised the baseline polish of visual output and distinguishes execution quality from taste; replies disagree about whether this is taste improvement or better imitation. This is useful evidence of contested practitioner language, not evidence of industry consensus.[7]

These posts are useful vocabulary and product-risk evidence, not a representative survey. They should not be used to estimate prevalence or to assert a consensus among designers. Search snippets and partially accessible threads are weaker evidence than full, independently sampled discussions.[10][11]

## 2. Proposed operational definition

> **Design Blend taste profile:** a versioned, user-correctable summary of a person's expressed responses to specific designed artifacts, including what they prefer or reject, which qualities they cite, the contexts in which those responses hold, and the uncertainty and evidence behind every inferred pattern.

Represent taste as a **contextual evidence graph**, not one vector:

- **Person** — profile owner; no inferred ability, seniority, identity, or worth.
- **Context** — field, subfield, industry/use case, medium, audience, culture/region (optional and user-controlled), constraints, and purpose. Context is multi-axis and can be partially unknown.
- **Artifact** — a work or reference with provenance, rights status, creator credit, and observable annotations.
- **Attribute / relation** — evidence about the artifact (e.g., material, composition, typography, density, contrast, rhythm, symbolism, interaction, craft, constraint). Separate observable description from interpretation.
- **Preference event** — reaction to the artifact or a comparison: love / like / neutral / dislike / not for this context / unfamiliar / skip; optional intensity and confidence.
- **Reason / facet** — user-stated or user-confirmed reason: “type feels compressed,” “material feels honest,” “too polished,” “strong hierarchy,” etc. Preserve verbatim wording and allow “other / not sure.”
- **Scope** — where a preference is believed to apply (global tentative, domain, context, artifact-specific); scope must not be presumed from a single response.
- **Evidence / provenance** — which events support a pattern, how many, recency, diversity of examples, and whether evidence is direct or inferred.
- **Interpretation** — tentative patterns generated from evidence, with confidence, counterexamples, version, and the user’s accept/edit/reject feedback.

Industry and field remain essential **context dimensions**. They are not taste dimensions and should not be collapsed into taste labels.

## 3. Capture method: learn through grounded choices

### Stage A — Orient, don't profile

Ask which domains and contexts the person wants to explore, what work they encounter, and whether the goal is personal discovery, comparison, or both. Allow multiple selections and “show me something outside my field.” Do not infer taste from job title.

### Stage B — Elicit contrastive reactions

Show small, comparable sets of credited artifacts. Prefer controlled comparisons that vary one interpretable quality at a time when feasible; also include authentic work where qualities naturally co-occur. Ask “Which would you choose for this brief?” and permit:

- A over B / B over A / both / neither / depends on context / unfamiliar / skip
- Optional intensity: slight preference ↔ strong preference
- Optional reason chips plus free text
- Context selector (“for my own work,” “for this audience,” “as an object,” “as a reference,” etc.)

Choice questions reveal relative preference; absolute ratings can be retained but should not be assumed comparable across people. Avoid forcing a choice when the user sees no meaningful preference.

### Stage C — Ask targeted follow-ups

Select follow-up comparisons to separate plausible explanations. If someone repeatedly chooses dense editorial compositions, test whether the signal is density, typography, color, subject matter, or the publishing context. The system must present these as hypotheses and accept corrections.

### Stage D — Let the person bring their own references

Allow a private link/image/reference board with the user's relationship to each item: made by me, love, dislike, aspire to, useful in a context, or simply influential. Uploading a reference is not automatically a positive preference. Respect rights, privacy, and source attribution; do not scrape private boards or train on uploaded work without explicit consent.

### Stage E — Reflect and correct

Show concise candidate observations with examples and counterexamples: “You often prefer restrained layouts with expressive type in editorial contexts; this pattern is weaker in product interfaces.” Ask whether it fits, needs narrowing, or is wrong. Corrections become explicit events.

## 4. Scoring and inference principles

### 4.1 Keep observation separate from inference

Raw response events are immutable. Any derived profile is recomputable and versioned. Store explicit user statements separately from machine-generated image tags and inferred taste patterns. AI can propose descriptions, but uncertain annotations require review and never become user preference evidence by themselves.

### 4.2 No universal eight-axis reduction

The current eight axes may remain as optional, comprehensible summary lenses, but they are not a complete ontology. Do not infer a person's taste solely from hand-authored plate loadings, style labels, or a single global axis vector. Keep richer attributes, interactions, and user-authored nuances available. Retain the current engine as a baseline, not a psychologically validated measure.

### 4.3 Context-specific preference estimates

For a candidate artifact x and context c, estimate a preference distribution rather than a hard score:

`P(prefer x | person, context c, observed events)`

Instead, keep one simple score as a transparent baseline and separately report coverage, evidence volume, context, and conflicts. A new hierarchical model can be evaluated offline against the baseline using held-out choices before affecting user-facing results.

Store uncertainty (e.g., posterior interval or calibrated confidence), evidence count, source mix, and context coverage. A sparse profile returns “not enough evidence,” not an arbitrary neutral score.

### 4.4 Make comparison multidimensional and abstain when needed

For two people, compare only context-and-attribute regions where both have adequate, relevant evidence. Report:

- **Overlap** — supported similarities with cited artifact evidence.
- **Difference** — supported contrasts, with examples.
- **Unexplored** — insufficient shared evidence.
- **Context shift** — similarities or differences that change across use cases.

If a single number is retained, define it narrowly as similarity over the selected, overlapping evidence—not global compatibility, design ability, collaboration potential, or “taste quality.” Show overlap/coverage and allow the system to abstain. Calibrate numeric scores against human pair judgments before making them prominent.

### 4.5 Diversity and exposure

A person’s observed profile reflects what they have encountered. Track familiarity and exposure separately from preference; “never seen” is not “dislike.” Include contemporary and historical, local and global, mainstream and less represented work, but do not use tokenistic cultural tagging. Let people opt out of domains, eras, or content.

## 5. Product safeguards against unfair or indefensible claims

1. Never call a person’s taste good, bad, advanced, primitive, objectively high-quality, or suitable for hiring.
2. Never use taste similarity as a proxy for personality, competence, seniority, cultural identity, or likely working relationship.
3. Make results evidence-linked and correctable; display counterexamples and uncertainty.
4. Separate “I like this” from “this is effective for this brief,” “this is well-crafted,” and “this is culturally familiar.” These are different judgments.
5. Do not infer stable global preferences from sparse or context-free ratings.
6. Do not silently treat skips, unfamiliarity, missing responses, or ambiguity as dislike.
7. Document dataset coverage, rights, source/credit, cultural/temporal sampling, and known omissions.
8. Version annotation and scoring semantics. Preserve historical snapshots; do not silently reinterpret old signals after model changes.
9. Provide export, deletion, privacy controls, and user control over reference visibility.
10. Make user-facing language descriptive: “you tend to choose,” “in the examples rated,” “we have limited evidence,” not “you are.”

## 6. Evaluation plan before public claims

### Discovery interviews

Interview a diverse set of designers across fields, seniority, geographies, cultural backgrounds, and disciplines. Ask them to sort artifacts, explain choices, identify context changes, and challenge proposed summaries. Recruit beyond the founder's own design network.

### Repeatability

Repeat selected comparisons later and in alternate formats. Measure whether preference patterns persist, shift with context, or change with exposure. Treat change as legitimate, not profile failure.

### Interpretability

Ask participants whether each generated observation is recognizable, specific, appropriately scoped, and supported by the shown evidence. Track false, overgeneralized, or culturally loaded interpretations.

### Predictive validation

Hold out artifacts and test whether context-specific preferences predict later choices better than simple baselines (global average, field-only average, and the existing eight-axis model). Evaluate calibration and abstention, not only accuracy. Report results by domain/context and relevant demographic coverage where ethical and consented.

### Blend validation

Have pairs independently predict their perceived overlap before seeing a Blend. Compare the product’s evidence-led explanation and score to their judgments and discussion. Do not optimize solely for agreement: disagreements may reveal context and interpretation gaps.

### Governance

Keep a public model card: intended use, non-use, data sources, coverage, scoring versions, known limitations, evaluation results, and change log. Have designers and researchers review language and sampling decisions.

## 7. Proposed conceptual architecture

```text
Context map (industry / field / subfield / use / medium / audience / constraints)
                         ↓ scopes
Artifacts + provenance + observable annotations
                         ↓ elicitation
Append-only preference events + explanations + familiarity + corrections
                         ↓ versioned inference
Contextual taste hypotheses + confidence + counterexamples + coverage
                         ↓ selected comparison query
Evidence-led overlap / difference / unknown (optional calibrated summary)
```

**Core invariant:** every profile statement and blend claim can be traced back to the person's responses and the artifacts that support it, with inferred links visibly distinguished from direct evidence.

## 8. Phased recommendation

**Phase 1 — Research prototype:** Do not expand to 12 fields/330 slots yet. Pick 2–3 contrasting contexts and build a small, credited, diverse stimulus set. Prototype the reaction → reflection → correction loop described in [`PROFILE-BUILDING-INTERACTION.md`](./PROFILE-BUILDING-INTERACTION.md), and evaluate whether designers recognize the resulting summaries.

**Phase 2 — Contextual data model:** Add context, artifact annotations, preference reason/familiarity, uncertainty, source provenance, and inference/evidence separation. Preserve existing append-only/versioned event architecture.

**Phase 3 — Offline modeling study:** Compare the current weighted-axis baseline with a small, interpretable hierarchical pairwise-preference model (e.g., Bradley–Terry style) on held-out choices. Evaluate prediction, calibration, context transfer, uncertainty, and query burden. Do not ship the more complex model unless it beats the baseline and can explain its evidence. Stanford’s Machine Learning from Human Preferences provides technical background for this proposed approach.[22]

**Phase 4 — Adaptive elicitation:** Use uncertainty and competing hypotheses to select the next comparison. Keep user-facing explanation inspectable.

**Phase 5 — Calibrated Blend:** Compare contextual profiles with overlap/unknown reporting; only then consider a percentage. Do not represent the present weighted cosine as validated taste science.

**Phase 6 — Expand the universe:** Add fields, industries, cultural material, and specialist niches as content capacity and evaluation allow. Taxonomy should be extensible and many-to-many; a work can belong to multiple contexts without forcing one canonical taste category.

## 9. What the current engine can and cannot claim

Current implementation: two fields (UI/Product and Graphic), 12 categories, 68 pending plate slots, eight manually assigned bipolar axes, pick/rank/rate signals, versioned profiles, coverage, and weighted-cosine blends. This is a deterministic prototype of explicit image-preference comparison.

It cannot currently claim to capture broad creative taste, distinguish context-specific taste, validate cross-domain transfer, or produce a psychometrically calibrated compatibility percentage. The original repository PRD's 12-field taxonomy is a taxonomy proposal, not evidence that 12 fields exhaust creative work.

---

## Sources

[1] Celikors et al. (2025), “Beauty is in the eye of your cohort: Structured individual differences allow predictions of individualized aesthetic ratings of images,” *Cognition*. https://pubmed.ncbi.nlm.nih.gov/39675185 (abstract/search result accessible; full PubMed page challenged during research).

[2] Vessel, Maurer, Denker & Starr (2018), “Stronger shared taste for natural aesthetic domains than for artifacts of human culture,” *Cognition*, 179, 121–131. https://maxplanckneuroscience.org/stronger-shared-taste-for-natural-aesthetic-domains-than-for-artifacts-of-human-culture

[3] Lee et al. (2025), “Visual and Auditory Aesthetic Preferences Across Cultures,” arXiv:2502.14439. https://arxiv.org/html/2502.14439v1 (preprint; not peer-reviewed at retrieval).

[4] “On the universality of aesthetic preference and inference,” *Humanities and Social Sciences Communications* (2025). https://www.nature.com/articles/s41599-025-04806-y

[5] “The influence of aesthetic taste on product choice: does mode of evaluation impact decision making?” ResearchGate-hosted manuscript/search result. https://www.researchgate.net/publication/395007173_The_influence_of_aesthetic_taste_on_product_choice_does_mode_of_evaluation_impact_decision_making (source quality/access limited; use cautiously).

[6] “The Big Five, Aesthetic Judgment Styles, and Art Interest.” https://pmc.ncbi.nlm.nih.gov/articles/PMC6266521/

[7] Public X thread by @dhvanil (2026) on AI tools, polish, and taste; includes disagreement in replies. https://x.com/dhvanil/status/2048510784511082754 (anecdotal discourse; not representative).

[8] Reddit r/Design, “How do you all develop ‘taste’ as designers?” https://www.reddit.com/r/Design/comments/1quf7dg/how_do_you_all_develop_taste_as_designers (thread discoverable in search; page extraction blocked; do not treat snippets as full-thread evidence).

[9] Reddit r/Design, “Do you think good design taste and skills are innate or by experience?” https://www.reddit.com/r/Design/comments/17r9e7l/do_you_think_good_design_taste_and_skills_are (thread discoverable in search; page extraction blocked; anecdotal).

[10] X article by Priyanka Vergadia, “WTH is Taste?” https://x.com/pvergadia/article/2069682527476859317 (search result only; full page extraction unavailable at research time).

[11] X article by Contra Labs on “Design Crit” preference data. https://x.com/contralabs_ai/article/2067642363909144932 (search result only; treat as a product example, not independent research).

[12] Leder et al. (2004), “A model of aesthetic appreciation and aesthetic judgments.” https://doi.org/10.1348/0007126042369811

[13] Leder & Nadal (2014), “Ten years of a model of aesthetic appreciation and aesthetic judgments.” https://doi.org/10.1111/bjop.12084

[14] Hekkert, Snelders & van Wieringen (2003), “‘Most advanced, yet acceptable’: Typicality and novelty as joint predictors of aesthetic preference in industrial design.” https://doi.org/10.1348/000712603762842147

[15] Cleridou & Furnham (2014), “Personality Correlates of Aesthetic Preferences for Art, Architecture, and Music.” https://journals.sagepub.com/doi/10.2190/EM.32.2.f

[16] Brieber et al. (2015), “In the white cube: Museum context enhances the valuation and memory of art.” https://doi.org/10.1016/j.actpsy.2014.11.004

[17] Reddit r/ProductManagement, discussion about taste/judgment and AI execution. https://www.reddit.com/r/ProductManagement/comments/1tf30wu/is_design_judgment_the_new_buzzword_or_does_it (search snippet only; not representative).

[18] Reddit r/Design, discussion asking what subjectivity means for taste. https://www.reddit.com/r/Design/comments/1vpwaq1/okay_guys_if_taste_is_subjective_what_you_say (search snippet only; not representative).

[19] X post by @Av1dlive on taste development and judgment versus execution. https://x.com/Av1dlive/status/2023086925817729306 (author's advice/anecdote, not empirical evidence).

[20] X post by Brianne Kimmel on developing a “palate.” https://x.com/briannekimmel/status/1927452039916732637 (opinion, not empirical evidence).

[21] X post by @BrettFromDJ on the subjectivity and explainability of design taste. https://x.com/BrettFromDJ/status/1998405212554375364 (opinion and disagreement in replies, not empirical evidence).

[22] Stanford Machine Learning from Human Preferences, chapter 1. https://mlhp.stanford.edu/src/chap1.html (technical background for pairwise probabilistic preference models; cited by the proposed modeling approach, not empirical design-taste evidence).

## Research limitations

Web access to Reddit was blocked by the extraction service; Reddit points above are thread discovery/search snippets, not full-post analysis. Several X articles were inaccessible beyond search snippets. Social discussion here is illustrative and nonrepresentative. Peer-reviewed research often studies artworks, shapes, landscapes, consumer products, or narrow datasets rather than practicing designers across all creative industries. The proposed product model is therefore a testable design direction, not a claim that research has already established a single correct computational theory of design taste.
