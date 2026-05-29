---
name: product-development-loop
description: Use when turning a validated startup idea into an MVP, PRD, implementation scope, launch checklist, and learning loop without overbuilding.
---

# Product Development Loop

Use this skill after an idea has passed validation. The goal is to ship the smallest product that proves the core value, then keep every iteration tied to customer evidence instead of founder anxiety.

## Inputs

- Validated target user.
- Core pain and raw user language.
- Search/community evidence.
- Willingness-to-pay signal.
- Landing-page or waitlist result.
- For post-launch iteration: activation, conversion, retention, revenue, user quotes, and first-paying-customer evidence.

## Workflow

1. Convert the validated pain into one user-visible promise.
2. Check `indie-hackers-starting-up` for the current stage and `founder-case-patterns` for similar MVP, pricing, validation, or distribution moves.
3. Use `business-model-design` to choose the right model and pricing structure before writing code.
4. Choose tech stack using `playbooks/02-product-development/tech-stack-selection.md`. Use what you know, ship in days.
5. Set up AI-native development workflow using `ai-native-development` skill: Superpowers for spec, DESIGN.md + taste-skill for UI, stability pillars for reliability.
6. Define the first successful user journey from entry to value.
6. Split scope into `must have`, `later`, and `do not build`.
5. Write a PRD with acceptance criteria and measurable success.
6. Identify risk: technical, product, distribution, compliance, cost.
7. Add instrumentation before launch: implement GA4 events per `playbooks/04-operations-and-analytics/ga4-event-tracking.md`. At minimum: `sign_up`, `first_value_delivered`, `checkout_start`, `purchase`. Set UTM conventions per `playbooks/03-growth-and-marketing/utm-attribution.md`. Run `tools/google-growth-stack check-deps` and `tools/google-growth-stack generate-gtag` to scaffold tracking code.
8. Connect Google Search Console on launch day (see `playbooks/03-growth-and-marketing/google-search-console.md`).
9. Follow `playbooks/02-product-development/mvp-launch-checklist.md` for pre-launch, launch day, and post-launch phases.
10. Launch to the smallest reachable audience.
11. Review activation, conversion, retention, revenue, and user quotes.
12. Use `playbooks/02-product-development/post-launch-iteration.md` for data-driven decision trees when diagnosing post-launch problems.
13. Before building new features after a weak launch, run direct customer discovery: name the segment, ask one sharp qualifying question, and look for 5 paying or high-intent customers.
14. Decide whether to iterate, expand, reposition, or stop.

## Required Output

- MVP scope.
- PRD or implementation brief.
- Acceptance criteria.
- Launch checklist.
- Metrics plan.
- Post-launch decision.

## Standardized Artifact Output

After completing the build stage, use `startup-playbook-artifacts` when the user asks to save, export, render, document, persist, or resume the result.

Write or refresh:

```text
playbook/stages/build/input.json
playbook/stages/build/report.json
playbook/stages/build/handoff.json
playbook/stages/build/report.md
```

The `report.json` must follow the Startup Playbook artifact protocol and include `analysis.mvpScope`, `analysis.prd`, `analysis.techStack`, `analysis.aiNativeCheck` when relevant, `analysis.instrumentation`, and `analysis.launchChecklist`.

The `handoff.json` must include the MVP promise, excluded scope, user flow, acceptance criteria, analytics events, launch channel, deployed URL if available, and security/privacy review status.

## Guardrails

- Do not add platform features before the narrow workflow works.
- Do not build advanced settings for unproven users.
- Do not treat a beautiful demo as product-market proof.
- Do not treat upvotes, warm relationships, or signups as paying-customer proof.
- Do not add features after $0 MRR or a quiet launch until a specific customer problem and purchase-intent path are clear.
- Do not ship without a way to measure the core behavior.

## Sprint Planning & Capacity

- **Sprint rhythm**: 1-2 week sprints for solo founders; keep cadence predictable.
- **Capacity estimation**: Use story points or t-shirt sizing (S/M/L/XL) to estimate effort. Solo founder: max 8-10 story points per week.
- **Sprint goal**: One user-facing outcome per sprint (e.g., "Users can complete onboarding in under 3 minutes").
- **Solo founder constraint**: Each sprint = 1 core feature + 1 tech debt item. No more. Protect focus.
- **Backlog grooming**: Weekly 30-minute session to refine upcoming stories, remove stale items, and re-prioritize based on evidence.
- **Definition of Done**: Code reviewed (self-review checklist), tests passing, deployed to staging, metrics instrumented.

## CI/CD Pipeline

- **Minimum CI**: On every push, run lint + test + build. Fail fast, fail early.
- **CD strategy**: Auto-deploy to staging on merge to main; manual promote to production with rollback plan.
- **Security scanning**: Run dependency audit (`npm audit` / `pip check`) and secret scanning (git-secrets, trufflehog) in CI.
- **Solo founder recommendation**: Use Vercel, Railway, or Fly.io for one-click deploys. Zero DevOps overhead.
- **Environment parity**: Staging mirrors production config (env vars, database schema). Test migrations on staging first.
- **Rollback readiness**: Keep last 3 deployments accessible. Document rollback steps in README.

## Observability

Three pillars for understanding system health:

- **Metrics**: Track Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1), API latency (p50/p95/p99), error rate (< 1%).
- **Logs**: Structured JSON logs with consistent fields (timestamp, level, message, correlation_id). Use log levels (DEBUG/INFO/WARN/ERROR) appropriately.
- **Traces**: Distributed tracing for critical paths (signup flow, payment processing). Identify bottlenecks across services.
- **Minimum viable setup**: Error tracking (Sentry) + uptime monitoring (UptimeRobot/Pingdom). Start here, expand later.
- **Alerting rules**: Page on error rate > 5% for 5 min, downtime > 2 min, latency p95 > 2x baseline.
- **Dashboard**: One-page view showing key metrics. Review daily for first month post-launch.

## A/B Testing Infrastructure

- **When to A/B test**: Only when you have >1000 MAU or making high-stakes decisions (pricing, core UX change). Before that, qualitative feedback is faster.
- **Minimum solution**: Feature flags (LaunchDarkly free tier, PostHog feature flags) + event tracking (GA4 custom events).
- **Recommended tools**: PostHog (all-in-one: flags + analytics), GrowthBook (open-source), LaunchDarkly (enterprise-grade).
- **Integration with GA4**: Fire custom events for variant exposure (`ab_test_exposed`) and conversion (`ab_test_converted`). Segment by variant in GA4 explorations.
- **Statistical rigor**: Run tests for minimum 2 weeks or until significance (p < 0.05). Avoid peeking. Use Bayesian methods if sample size is small.
- **Solo founder tip**: Don't over-engineer. Manual cohort analysis in GA4 or spreadsheet works for <10k users.

## Prototype to Production Transition

AI-generated prototypes are starting points, not production code. Bridge the gap systematically:

- **Transition checklist**:
  - Error handling: All async operations wrapped in try/catch with user-friendly messages.
  - Input validation: Server-side validation for all user inputs (sanitize SQL, XSS prevention).
  - Authentication: Proper session management, password hashing (bcrypt), OAuth flows tested.
  - Rate limiting: API endpoints protected against abuse (express-rate-limit, Redis-based for distributed systems).
  - Data backup: Automated daily backups with point-in-time recovery. Test restore procedure.
  - Environment variables: No hardcoded secrets. Use `.env` files locally, secrets manager in production.
- **Technical debt budget**: Allocate 20% of each sprint to refactoring, testing, and documentation. Prevents compounding debt.
- **Architecture Decision Records (ADR)**: Document key technical choices (why this database, why this auth provider) in `/docs/adrs/`. Include context, decision, consequences.
- **Performance budget**: Set targets (page load < 3s, API response < 500ms). Monitor in CI with Lighthouse CI or k6.
- **Security review**: Before first paying customer, run OWASP Top 10 checklist. Use automated scanners (Snyk, Dependabot).

## Required Output

- MVP scope.
- PRD or implementation brief.
- Acceptance criteria.
- Launch checklist.
- Metrics plan.
- Post-launch decision.
- Sprint plan (if using iterative development).
- CI/CD setup checklist.
- Observability baseline (metrics, logs, alerts configured).
- A/B test plan (if applicable and MAU > 1000).
- Production readiness checklist (security, backup, rollback tested).
