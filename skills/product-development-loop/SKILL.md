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
3. Define the first successful user journey from entry to value.
4. Split scope into `must have`, `later`, and `do not build`.
5. Write a PRD with acceptance criteria and measurable success.
6. Identify risk: technical, product, distribution, compliance, cost.
7. Add instrumentation before launch: implement GA4 events per `playbooks/04-operations-and-analytics/ga4-event-tracking.md`. At minimum: `sign_up`, `first_value_delivered`, `checkout_start`, `purchase`. Set UTM conventions per `playbooks/03-growth-and-marketing/utm-attribution.md`. Run `tools/google-growth-stack check-deps` and `tools/google-growth-stack generate-gtag` to scaffold tracking code.
8. Connect Google Search Console on launch day (see `playbooks/03-growth-and-marketing/google-search-console.md`).
9. Launch to the smallest reachable audience.
9. Review activation, conversion, retention, revenue, and user quotes.
10. Before building new features after a weak launch, run direct customer discovery: name the segment, ask one sharp qualifying question, and look for 5 paying or high-intent customers.
11. Decide whether to iterate, expand, reposition, or stop.

## Required Output

- MVP scope.
- PRD or implementation brief.
- Acceptance criteria.
- Launch checklist.
- Metrics plan.
- Post-launch decision.

## Guardrails

- Do not add platform features before the narrow workflow works.
- Do not build advanced settings for unproven users.
- Do not treat a beautiful demo as product-market proof.
- Do not treat upvotes, warm relationships, or signups as paying-customer proof.
- Do not add features after $0 MRR or a quiet launch until a specific customer problem and purchase-intent path are clear.
- Do not ship without a way to measure the core behavior.
