# Design Blend — Profile-Building Interaction

**Status:** Research-informed interaction proposal for user testing. It is not a validated instrument, production spec, or claim that the proposed flow will infer someone's complete taste.
**Companion:** [`TASTE-RESEARCH-AND-MODEL.md`](./TASTE-RESEARCH-AND-MODEL.md) defines taste, its context model, safeguards, and evaluation principles. This document answers the narrower question: **what does a person actually do while building a profile?**

---

## 1. Recommendation in one sentence

Make profile creation feel like **curating and annotating a personal reference collection**, not taking a quiz: the person reacts to concrete work in context, can say why (or not), sees what the system tentatively understood, corrects it, and can leave with an incomplete but useful profile that keeps learning over time.

The interaction should alternate between three modes:

1. **React** to designed work.
2. **Reflect** on a possible pattern.
3. **Shape** the profile by confirming, narrowing, correcting, or rejecting that pattern.

Do not make the user fill out every field, rate a giant image inventory, or write an essay before seeing value.

## 2. What research says about the interaction—not the taste algorithm

### Preferences are often constructed during interaction

A three-study investigation of preference-elicitation interfaces found that people may not have a stable, fully articulated preference ready in advance; the task, framing, context, and interface can shape the expressed preference. Exact numeric trade-offs can be hard to state. People valued being able to explore interests, preferences, and outcomes together, and did not want extra effort where it felt unnecessary.[1]

**Design implication:** Present actual work and a meaningful context; let preference become clearer through comparison. Treat each response as an observation from this task, not a permanent trait declaration.

### Effort and expressiveness need a deliberate balance

In that study, lower-effort methods were generally liked, while users were also willing to provide richer feedback when they had a strong opinion and the interface let them express it. Familiarity and whether a person had an opinion affected how much detail they were willing to give; affective feedback could be preferred to a more elaborate one-dimensional scale.[1]

**Design implication:** Give a one-tap response first; offer optional depth immediately afterward. Do not require reasons on every card. Invite explanation when the person signals a strong opinion, familiarity, or “this matters.”

### Interactions should be mixed-initiative, not an interrogation

Conversational-recommender research describes interaction as more than one-shot ratings: people can express current preferences, revise them, critique examples, ask for explanations, and reject or refine recommendations. The review also notes that users may not know their preferences at the outset and can construct or learn preferences while exploring options.[4]

The study reports that several examples can help users critique options, and that the system can adapt suggestions based on behavior.[5]

The system should occasionally offer a useful next comparison or a tentative read, but the user remains in control and can say “not that,” “show me another kind,” “I need a different context,” or “I don't know.” Example-critiquing systems also use suggested candidates to stimulate preference expression, so the next prompt can be framed as an invitation rather than a test.[4][5]

### Adaptive questions can be more informative, but only after calibration

Theoretical preference-elicitation work emphasizes low cognitive load, handling noisy responses, and scalable multi-attribute querying.[2] Stanford's teaching material explains why comparisons near a person's current indifference point can be informative under a specified model, while noting item calibration/cold-start assumptions.[3]

**Design implication:** Adaptive choice is a future capability, not a reason to pretend the system already knows what each image means. First curate and annotate a trustworthy stimulus set; test question quality and user interpretation. Do not optimize a user's self-discovery session solely for a model's mathematical information gain.

### More options are not always better

Setwise visual-ranking research finds that comparisons can be ambiguous when examples are too similar; it selects informative comparisons while preserving visual diversity.[7]

**Design implication:** Use a small number of clearly distinguishable works. A varied set is easier to react to than a grid of near-duplicates. When the distinction is subtle, let the user say “can't tell / both / neither.”[7]

### Natural-language freedom needs structure and should not be forced

A 2025 conversational-recommender experiment compared different levels of system guidance and response restriction with 66 participants in agriculture/forestry. It found no significant questionnaire UX difference across its three conditions, but did find differences in chat duration, response time, recommendation performance, and certainty; high guidance improved recommendation match in that study.[8]

The 2025 conversational study was small and domain-specific, so its finding is not a settled best design for Design Blend.

### Visual liking is not equivalent to stable, reasoned taste

An interface-layout study found rapid aesthetic preferences for layouts under its mobile-marketing experiment, and used identical content across layout conditions.[9] This is a useful warning and possible research technique, but its stimulus/task context is narrow.

**Design implication:** Capture what is liked separately from what is effective for a brief, familiar, culturally legible, or merely eye-catching. Use paired variants with controlled content when diagnosing one visual feature, but also include real, holistic work so the experience does not become a sterile style test.[9]

## 3. Profile-building mental model

Participants in user-centered elicitation studies valued exploring how their interests and preferences related to outcomes, having control over their own profile, and seeing immediate feedback while adjusting it.[1]

- **This is about your preferences, not a test of design skill.**
- **There is no right answer.** “Neither,” “both,” “depends,” “unfamiliar,” and “skip” are legitimate.
- **Context changes the answer.** “I like this” and “I would choose this for this brief” are different reactions.
- **The system is making guesses from examples.** It will show its evidence and confidence, and the user can correct it.
- **The profile is editable and unfinished by design.** It improves as the person explores; there is no final score they must earn.

Suggested welcome copy:

> **Build a reference profile that sounds like you.** Choose, reject, save, or explain examples. We’ll look for patterns, show the work behind them, and let you correct anything that feels off. This is about what you respond to—not whether your taste is good or bad.

## 4. Proposed end-to-end flow

### Step 0 — Consent, agency, and purpose

Before capture, explain in plain language:

- what will be stored (responses, optional notes, optional references);
- whether the profile is private by default;
- what is used for comparison or sharing;
- how to pause, edit, export, or delete;
- that an incomplete profile is acceptable.

Ask what the person wants from the profile, with multiple selections:

- understand my own preferences;
- collect references / influences;
- compare taste with another person;
- explore outside my usual field;
- other / not sure.

This is an interaction goal, not a taste inference.

### Step 1 — Choose a starting neighborhood, not a permanent identity

**Proposal:** Offer a browsable map: **what work do you want to explore today?** Users can pick multiple domains, search, choose “surprise me,” or start with references they already have. Do not force profession/job-title selection or treat it as a profile fact.

Use context chips only when relevant:

- field / subfield;
- artifact type or medium;
- use or brief (personal reference, client brief, public wayfinding, etc.);
- audience / constraints, if the user knows them.

Allow “no specific brief—just my response to the work.” Keep context visible and editable during capture.

### Step 2 — A short orientation sampler

Show about **6–8 visually distinct, credited examples**, not a taxonomy list. Each should offer an immediate, low-effort action:

- **Drawn to it**
- **Not for me**
- **Depends / both / neither**
- **Not familiar**
- **Skip**

A save/collect action is useful for references but must be separate from liking. Do not put “good/bad design” labels on the choices.

The set should deliberately vary medium, culture/region, era, visual language, subject, and density without implying those are taste categories. Log exposure and position so later analysis can detect presentation bias. Keep image credit and a concise artifact description reachable without dominating the reaction surface.

### Step 3 — Offer optional depth when a response invites it

- “What caught you?” (choose any: composition, type, color, material/texture, form, rhythm/motion, symbolism, detail/craft, interaction, mood, other, not sure)
- “Is it the whole thing, or one part?” (whole / mostly one part / unsure)
- “Where does this work for you?” (this context / other context / personal reference only / unsure)

Chips are prompts, not forced feature labels. Allow one short free-text note such as “the lettering feels hand-cut” and leave it optional. Keep user wording verbatim, with explicit consent for any later interpretation.

### Step 4 — Switch among interaction formats

Avoid one monotonous task. The session can alternate among:

**A. Single-item reaction** — useful for strong attraction/rejection, references, or unfamiliarity.

**B. Pairwise choice** — “Which would you choose for this context?” Include “both,” “neither,” “depends,” and “can't tell.” Use only when images make a fair and understandable comparison.

**C. Small set sorting** — “Save a few that pull you in” or arrange 3–4 items into “more me / less me / depends.” Let users leave ties; do not demand a complete strict ranking.

**D. Attribute-isolation comparison** — show variants with the same content and context while changing one clear attribute (e.g., type treatment). Explain the comparison’s scope: “This round changes typography; other details are held similar.” Use sparingly, because real design qualities interact.

**E. Reference import / link** — user voluntarily adds an example and labels relationship: made by me, love, dislike, aspire to, useful for a project, influential, or simply curious. Import does not imply preference; never silently scrape or reuse private material.

Offer format changes as controls, not as an opaque algorithm: “Show me comparisons,” “Let me browse,” “I want to add my own references,” “I’m done for now.”

Automatically optimizing an interface from an elicited preference model is an established research idea, and its accuracy depends entirely on how well the underlying utility model was learned.[6] That is the argument for hand-reviewing every comparison before a user sees it.

### Step 5 — Reflect with provisional pattern cards

**Proposal:** After enough varied evidence exists—not after a hard-coded number of taps—show **one to three** editable observations. Each card should include:

- a descriptive sentence with explicit scope;
- 2–4 supporting examples the person actually reacted to;
- a counterexample or “not consistent yet” marker where appropriate;
- confidence/coverage in plain language (“early signal,” “repeated in these examples,” “not enough examples”);
- actions: **Fits**, **Partly—narrow it**, **Not me**, **This is context-specific**, **Hide this**;
- “How did you get this?” linking to the evidence.

Example:

> **Early signal · editorial layouts**  
> You repeatedly saved spacious compositions with expressive lettering. That pattern is not yet clear in product interfaces.  
> **Fits · Narrow it · Not me · Add context**

Do not show a psychometric radar chart or an archetype as the first interpretation. Keep observed actions and inferred patterns visually distinct.

### Step 6 — Make correction part of the profile, not an error report

**Proposal:** If the person rejects an interpretation, offer lightweight alternatives:

- “The examples were wrong for me.”
- “I liked the subject, not the visual treatment.”
- “I like this only in this context.”
- “I’m familiar with this, but don’t prefer it.”
- “I’m still figuring it out.”
- “Something else” (optional note).

Record the correction as a new event. Do not rewrite earlier choices or force the model to infer a replacement automatically.

### Step 7 — Profile reveal is a working canvas

The profile should not be a single score page. Provide a personal workspace with these sections:

1. **Saved references** — items the person deliberately collected, with their own relationship tags.
2. **What seems to recur** — tentative patterns, scope, supporting examples, and confidence.
3. **Where it changes** — context-specific differences and exceptions.
4. **What we don’t know yet** — unexplored fields, uncertain facets, unfamiliar work.
5. **Your words** — user notes and accepted interpretations.
6. **Continue exploring** — suggestions framed as curiosity, not remediation.

Let the user reorder, rename, merge, split, hide, or delete inferred pattern cards. Do not let the model rename a user-authored collection without permission.

### Step 8 — Finish this session, not the taste journey

At a natural pause, offer clear choices:

- **Save this as my current profile** (may be incomplete);
- **Keep exploring**;
- **Pause and come back later**.

Give a session summary: “You reacted to N examples, saved X, and confirmed Y early patterns. We have little evidence in Z.” Avoid a completion percentage that implies the user is a partially finished person. A progress indicator may show remaining time or session steps, but must not communicate how close they are to a “complete taste.”

Profile visibility stays private unless explicitly shared. Pairwise Blend is a separate action with a preview of what will be shared and which contexts will be compared.

## 5. The recommended session rhythm

A 10–15 minute first session should feel like a small studio exercise, not a questionnaire:

1. **1–2 minutes — choose what to explore** (or import a reference).
2. **3–4 minutes — react to a diverse sampler** with one-tap actions.
3. **3–5 minutes — compare a few meaningful pairs / sort a tiny set** based on user interest and current uncertainty.
4. **1–2 minutes — inspect and edit early pattern cards.**
5. **Finish whenever they want.** The profile is saved in an explicitly incomplete state if evidence is sparse.

This is a prototype target, not a research-derived universal time threshold. Test it with real participants; if designers want to spend longer when expressing a strong opinion, do not over-optimize for speed.

## 6. Interaction rules for adaptive selection

An adaptive system may choose the next example or comparison, but only within user-set boundaries. Proposed policy:

1. Respect selected context, content exclusions, accessibility settings, and session budget.
2. Prefer comparisons likely to distinguish currently plausible interpretations, while avoiding near-duplicate or confounded examples.
3. Keep a small, explicit exploration path for unfamiliar domains if the user opted in.
4. If the user shows low familiarity or “not sure,” do not treat it as weak preference. Offer a short description, another example, or skip.
5. If answers conflict, ask whether context changed before averaging them.
6. After several similar questions, switch format or offer a break.
7. Stop adapting when the user pauses, opts out, or marginal value is low.
8. Explain the next prompt simply: “We’re checking whether it’s the typography or the overall composition that you’re responding to.”

Start with hand-authored, human-reviewed comparisons. Use active-learning selection only after the images and comparison meaning have been piloted; a mathematically informative but visually confusing pair is a bad question.

## 7. Key artifact-level interaction and data requirements

Every capture event should retain enough context to reconstruct the interaction:

- artifact IDs shown and their order/position;
- artifact credits, source, and content/annotation schema versions;
- view context (field, medium, brief, audience/constraints if provided);
- interaction mode (single, pair, set, isolated attribute, user-added reference);
- response, ties/ambiguity/skip/unfamiliarity state;
- optional strength, reason chips, verbatim note, and consent state;
- whether the item was already familiar and the user's relationship to it;
- which system hypothesis, if any, the query was intended to distinguish;
- model interpretation shown and user's correction;
- time only as operational context—not as preference intensity.

Never infer “dislike” from no click, fast click, skip, scroll-past, or abandonment. Exposure must be known before interpreting any interaction behavior. Do not treat imported references, likes, or saved items as interchangeable evidence.

## 8. What not to build

- A 68/330-image compulsory rating marathon.
- “Pick your style” personality quiz with named archetypes as truth.
- Eight sliders as the entire taste capture mechanism.
- A 0–100 numerical rating on every artifact.
- Required text explanations after every choice.
- A chat-only onboarding that makes users invent vocabulary.
- An opaque image-AI labeling pipeline whose errors become profile facts.
- A visible accuracy or completeness meter implying the system has finished understanding someone.
- An overall “taste score,” “taste rank,” or good/bad judgment.
- Comparisons with another designer before explicit consent and context selection.

## 9. Prototype and validation plan

### Test the interaction before the model

Build a clickable, instrumented prototype with a small curated sample across three varied contexts. Test the same flow with designers who differ in field, experience, location/cultural background, and comfort articulating preferences. The goal is not to prove a universal taxonomy; it is to discover whether the interaction feels respectful, specific, and worth continuing.

### Compare three capture conditions

Test at least:

1. **Single-item reaction + optional reason**
2. **Pairwise comparison + “both/neither/depends”**
3. **Mixed flow with an editable pattern recap**

Measure completion and return intent, cognitive effort, perceived agency, whether users understand what is stored, quality of explanation, correction rate, preference recognition, and whether context was understood. Observe think-aloud behavior; do not use self-reported satisfaction alone.

### Acceptance criteria for the first interaction prototype

- A participant can build a useful starter profile without selecting a named style label or assigning numeric weights.
- They can express context shifts, uncertainty, unfamiliarity, ties, and mixed reactions.
- They understand that response ≠ quality verdict and profile ≠ ability assessment.
- Every pattern statement links to evidence and can be corrected or hidden.
- At least one participant can accurately explain what data the system captured and why.
- Sparse evidence produces an explicit “early / not enough evidence” state.
- No user is forced to supply a text reason or finish the whole catalog.
- Findings include negative cases and participant quotes with consent; do not turn a small usability study into population claims.

### Follow-up evaluation

After this interaction has been iterated, test whether the resulting profile predicts held-out choices in the same context and whether it transfers to a different context. Compare against the present axis engine and a simple baseline. Keep the pairwise blend hidden or clearly labeled experimental until score calibration, uncertainty, and user interpretation are tested.

## 10. Product decision summary

**Build a studio-like elicitation loop, not a quiz.** Let users react first, explain selectively, and edit the system's emerging understanding. Use multiple interaction modes—single reactions, fair comparisons, small-set curation, controlled variants, and user-provided references—but make each optional and contextual. Show the evolving profile early enough to invite correction. Make “not sure,” “depends,” and “not for this context” first-class states.

The promise is not “we will find your true taste in 10 minutes.” It is: **“Together, we’ll build a useful, revisable record of what you respond to—and show what evidence supports it.”**

## Sources

[1] Alina Pommeranz et al. (2012), “Designing interfaces for explicit preference elicitation: a user-centered investigation of preference representation and elicitation process,” *User Modeling and User-Adapted Interaction*, 22, 357–397. https://link.springer.com/article/10.1007/s11257-011-9116-6

[2] Shengbo Guo & Scott Sanner (2010), “Real-time Multiattribute Bayesian Preference Elicitation with Pairwise Comparison Queries,” *Proceedings of AISTATS*, PMLR 9. https://proceedings.mlr.press/v9/guo10b.html

[3] Stanford, *Machine Learning from Human Preferences*, Chapter 3: Elicitation. https://mlhp.stanford.edu/src/chap3.html (technical teaching resource; model assumptions and calibration requirements apply).

[4] Dietmar Jannach et al. (2021), “A Survey on Conversational Recommender Systems,” *ACM Computing Surveys*, 54(5), Article 105. https://dl.acm.org/doi/10.1145/3453154

[5] Paolo Viappiani, Boi Faltings & Pearl Pu (2008), “Preference-based search with adaptive recommendations,” *AI Communications*, 21(2–3). https://dl.acm.org/doi/10.5555/1460172.1460180

[6] Krzysztof Gajos & Daniel S. Weld (2005), “Preference Elicitation for Interface Optimization,” UIST. https://www.eecs.harvard.edu/~kgajos/papers/2005/kgajos-uist05.pdf

[7] Lucy Liang & Kristen Grauman (2014), “Beyond Comparing Image Pairs: Setwise Active Learning for Relative Attributes,” CVPR. https://vision.cs.utexas.edu/projects/beyondpairs/

[8] Liv Ziegfeld, Daan DiScala & Anita H. M. Cremers (2025), “The effect of preference elicitation methods on the user experience in conversational recommender systems,” *Computer Speech & Language*, 89, Article 101696. https://doi.org/10.1016/j.csl.2024.101696 (study used 66 participants in agriculture/forestry; do not generalize directly to designers).

[9] Shu Wang et al. (2021), “The Implicit Aesthetic Preference for Mobile Marketing Interface Layout—An ERP Study,” *Frontiers in Human Neuroscience*, 15. https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2021.728895/full (narrow stimulus and task context; use as a caution about separating fast attraction from broader preference).

## Research limits

Preference-elicitation literature mostly concerns recommenders, decision support, product choice, or interface adaptation—not a profile whose purpose is creative self-understanding. Some studies are old, domain-specific, or small. Pairwise and active-learning results depend on assumptions about item attributes, noise, and calibrated stimuli. The flow above is therefore a concrete hypothesis to prototype with designers, not a settled best practice or proven optimal sequence.
