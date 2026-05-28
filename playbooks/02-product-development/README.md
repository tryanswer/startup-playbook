# Product Development

Product development only serves validated problems. The goal of an MVP is not feature completeness — it is the shortest path to proving that users receive core value.

## Guides

- `ai-native-development.md`: **AI-native product development methodology** — brainstorming with Superpowers, UI design with DESIGN.md + taste-skill, infrastructure via CLI (Aliyun/Vercel/Supabase), and building stable products with TDD, TypeScript strict, CI/CD, and error monitoring.
- `ai-native-stability.md`: **Six pillars of AI-native stability** — full-stack observability (test-id + traceId), critical log collection, architecture boundaries & contracts, feature completeness checklist, mutual agent audit, and evaluation harness. Based on Anthropic's harness engineering methodology.
- `ai-native-security.md`: **Security for AI-generated code** — installable security skills (ByteHide, Trail of Bits, OWASP), AGENTS.md security rules, common AI-generated vulnerabilities with fixes, privacy compliance (GDPR/CCPA/个保法).
- `cross-project-reuse.md`: **Cross-project service reuse** — SERVICE.md standard for documenting reusable APIs, central service registry, agent memory integration, and workflow for starting new projects with existing services.
- `tech-stack-selection.md`: How to choose a tech stack as an indie hacker — recommended stacks by product type, infrastructure defaults ($0-50/mo), payment providers, and anti-patterns.
- `mvp-launch-checklist.md`: Three-phase launch process (pre-launch, launch day, post-launch first 7 days) with checklists for product readiness, analytics, payments, and distribution.
- `post-launch-iteration.md`: Data-driven decision trees for common post-launch scenarios (no signups, no activation, no payment, high churn, growth stalling). Includes weekly/monthly iteration cadence and pivot/kill criteria.

## Workflow

1. **Define user and scenario**
   Write down the target user, trigger scenario, current workaround, and why existing options fail.

2. **Narrow the core promise**
   One sentence: what action the user takes and what perceivable benefit they receive. Do not use technical capabilities as the value proposition.

3. **Choose business model and pricing**
   Use `skills/business-model-design` to match product positioning to the right model (SaaS/service/course/marketplace/devtool) and pricing structure.

4. **Set up AI development workflow**
   Install Superpowers in your coding agent, add DESIGN.md + taste-skill for design direction. See `ai-native-development.md`.

5. **Choose tech stack**
   Use `tech-stack-selection.md` to pick tools based on what you know, not what is trending. Ship in days, not weeks.

6. **Scope the MVP**
   Keep only the minimum path to deliver the core promise: input → process → output → payment or signup → feedback.

7. **Write a PRD**
   Use `templates/product-requirements.md`. Describe behavior with acceptance criteria and bound scope with a risk list. Every requirement must map to a validation goal or a retention/conversion metric.

8. **Add instrumentation**
   Implement analytics before launch (see `ga4-event-tracking.md` or `china-analytics-tracking.md`). Set up payment integration on day one.

9. **Launch**
   Follow `mvp-launch-checklist.md`. Launch to the smallest reachable audience first.

10. **Iterate with data**
    Use `post-launch-iteration.md` to diagnose and decide based on real metrics. Every iteration solves one main problem.

## Guardrails

- Do not substitute technical novelty for user value.
- Do not build complex settings for hypothetical users.
- Do not expand features before you have conversion data.
- Do not build a platform in version one — solve one sharp problem first.
- Do not ship without a way to measure the core behavior.
- Do not build more features as a response to $0 MRR — sell manually first.
