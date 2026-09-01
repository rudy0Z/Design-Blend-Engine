# Tools Lab Production Program

**Purpose:** Turn the current utility concepts into a varied, production-grade collection of tools that can sit beside portfolio case studies and demonstrate product judgment, interaction design, visual range, and technical execution.

**Positioning:** These are not case studies. They are usable products in a `Tools Lab`: each should be understandable in seconds, enjoyable to try, and credible under inspection.

## Portfolio Principle

The collection must not look like seven themed copies of one UI kit. Each tool gets a distinct product identity because each demonstrates a different design competency:

| Product | Portfolio signal | Design territory | Shipping target |
| --- | --- | --- | --- |
| Pairwell | Typography systems and decision tooling | Editorial workbench, specimen-led, precise | Vercel web app with managed persistence |
| Design Blend | Taste research, matching logic, profiles | Image-led creative salon, social and expressive | Vercel web app with auth and managed database |
| DesignDojo | Design quality operations in Figma | Inspector/workflow console, rigorous and calm | Figma plugin plus companion reference site |
| WhisperKey | Personal productivity utility | Fast desktop instrument, quiet and dependable | Open-source Windows application and releases |
| Decay | Creative concept and spatial interaction | Immersive memory landscape, cinematic and temporal | Vercel-hosted experiential web app |
| Personal Visualizer | Personal media experimentation | Tactile audiovisual object, collectible imagery | Vercel static app with local-first media |
| PortfolioAI | Portfolio navigation and explanation | Restrained concierge, trustworthy and unobtrusive | Vercel standalone widget before integration |

## Non-Negotiable Production Bar

- No fabricated rankings, scores, AI capabilities, or data persistence claims.
- A clear first-run path, useful empty states, recoverable errors, keyboard support, responsive behavior, and WCAG-minded contrast and focus behavior.
- Explicit data ownership, deletion, privacy, abuse prevention, and cost controls for anything that stores user content or calls AI.
- Automated unit and integration coverage for product logic, Playwright coverage for primary user paths, visual checks for polished surfaces, and deployment smoke checks.
- Performance budgets appropriate to each product, with reduced motion and lower-power fallbacks for visually intensive experiences.
- A demo state that a recruiter can try immediately without setup or personal credentials.
- Product identity documents (`PRODUCT.md` and `DESIGN.md`) approved before large visual changes are implemented.

## Infrastructure Policy

`Zero infra` is treated as zero server management, not zero services. Static or local-first products can use Vercel alone. Products needing accounts, shareable profiles, AI calls, durable records, or distributed rate limiting use the smallest reliable managed services with documented free-tier limits, environment configuration, backups, deletion flows, and usage caps.

## Parallel Execution Rules

- Give each worker one repository and its local plan file only. Cross-product visual direction may be reviewed centrally, but source changes remain repo-owned.
- Preserve existing user changes: `D:\Projects\Pair-Well-1\.replit` is modified and `D:\Projects\Lyric-Visualizer\attached_assets\` is untracked at planning time.
- Start every lane with its product and design contract. Production builds cannot be judged coherently until each product states its promise, audience, privacy posture, and visual language.
- Require screenshots and verification evidence at each visual milestone, not only at final deployment.

## Suggested Build Lanes

| Lane | Product | Why it can begin now | Main risk to solve first |
| --- | --- | --- | --- |
| A | Pairwell | Strongest immediately legible design-tool signal | Replace non-credible scoring and simplify the studio |
| B | Design Blend | Already has auth/profile foundations | Validate taste and compatibility model before polishing |
| C | DesignDojo | Fits real design workflow value | Choose plugin-first operating model and auditable rules |
| D | WhisperKey | Small focused product with release structure | Privacy, secret storage, desktop reliability |
| E | Decay | Standalone creative experience | Make interaction discoverable without losing atmosphere |
| F | Personal Visualizer | Existing unique aesthetic and local gallery | Reframe away from fragile public Spotify dependency |
| G | PortfolioAI | Useful future portfolio layer | Privacy, AI cost, serverless abuse protection |

## Individual Plans

- [Pairwell production upgrade](D:\Projects\Pair-Well-1\docs\superpowers\plans\2026-05-26-pairwell-production-upgrade.md)
- [Design Blend production upgrade](D:\Projects\Design-Blend-Engine\docs\superpowers\plans\2026-05-26-design-blend-production-upgrade.md)
- [DesignDojo production upgrade](D:\Projects\Design-Dojo-Corrections\docs\superpowers\plans\2026-05-26-design-dojo-production-upgrade.md)
- [WhisperKey production upgrade](D:\Projects\Whisper-Key\docs\superpowers\plans\2026-05-26-whisperkey-production-upgrade.md)
- [Decay production upgrade](D:\Projects\Cool-Build\docs\superpowers\plans\2026-05-26-decay-production-upgrade.md)
- [Personal Visualizer production upgrade](D:\Projects\Lyric-Visualizer\docs\superpowers\plans\2026-05-26-visualizer-production-upgrade.md)
- [PortfolioAI production upgrade](D:\Projects\Chatbot-Helper\docs\superpowers\plans\2026-05-26-portfolio-ai-production-upgrade.md)

## Program Review Gates

1. Approve the seven `PRODUCT.md` and `DESIGN.md` documents together to confirm genuine visual and product range.
2. Review engine, privacy, and infrastructure decisions before public data or AI endpoints are enabled.
3. Review working primary flows on desktop and mobile, plus WhisperKey on Windows, before portfolio links are published.
4. Publish each tool only when its demo is instant, its limitations are honest, and the deployed build is monitored and cost-controlled.

