---
name: ai-native-development
description: Use when building a product with AI coding agents. Covers the full workflow from brainstorming to stable production, including agent-driven spec, design direction, CLI-first infrastructure, six stability pillars, and mutual agent audit.
---

# AI-Native Development

## Inputs

- A validated idea that passed `idea-validation` gates.
- A business model chosen via `business-model-design`.
- A tech stack selected via `playbooks/02-product-development/tech-stack-selection.md`.

## Workflow

### Setup

1. Install Superpowers in your coding agent (Claude Code, Codex, Cursor) for spec-first development. See `playbooks/02-product-development/ai-native-development.md`.
2. Add a DESIGN.md to the project root from [awesome-design-md](https://github.com/voltagent/awesome-design-md) matching the product's visual positioning.
3. Install taste-skill (`npx skills add https://github.com/Leonxlnx/taste-skill`) for anti-slop UI generation.
4. Create the project's AGENTS.md with stability rules from `playbooks/02-product-development/ai-native-stability.md`.
5. Install security skills: `npx @bytehide/ai-security-toolkit` for OWASP Top 10 scanning. For payment/auth products, also add Trail of Bits skills. See `playbooks/02-product-development/ai-native-security.md`.
6. Set up CLI tools for infrastructure: `aliyun configure` for China, `vercel && supabase && stripe` for international.

### Build

6. Describe the product idea in 2-3 sentences to the coding agent. Let Superpowers drive the brainstorming — do not skip to code.
7. Review the agent's spec in sections. Verify: core user flow exists, scope is limited, data model is simple, edge cases acknowledged.
8. Agent creates an implementation plan with bite-sized tasks (2-5 min each). Review the plan before saying "go."
9. Agent implements via subagent-driven development with TDD enforced: write failing test → watch it fail → write minimal code → watch it pass → commit.
10. For every UI component: agent must add `data-testid` attributes on all interactive elements following `{page}-{component}-{action}` naming.
11. For every API endpoint: a typed contract must exist in `contracts/` before implementation. Agent implements against the contract.
12. For every HTTP request: `x-trace-id` header must be propagated end-to-end.

### Verify

13. After implementation, launch a separate review agent to audit the code. The review agent checks: contract compliance, error handling, test coverage, testid presence, architecture boundary violations.
14. Implement agent and review agent iterate until the review agent reports zero issues.
15. Run the Feature Completeness Checklist (see `playbooks/02-product-development/ai-native-stability.md` Pillar 4): functional, observability, testing, security, performance, accessibility.
16. Human founder reviews the final diff for product intent and business logic only — correctness has been verified by agent audit.

### Ship

17. Set up CI pipeline: tests + lint + type check + build must pass before merge.
18. Set up Sentry for error monitoring before the first production deploy.
19. Set up preview deploys (Vercel/Netlify) so every branch gets a testable URL.
20. Follow `playbooks/02-product-development/mvp-launch-checklist.md` for the full launch process.

### Maintain

21. Run weekly entropy auditor: dead code scan, doc-code sync check, architecture violation scan, naming convention drift.
22. Use `playbooks/02-product-development/post-launch-iteration.md` for data-driven decisions on what to build next.
23. Never build more features as a response to $0 MRR. Sell manually to 5 people first.

## Required Output

- Working product with all interactive elements tagged with `data-testid`.
- TraceId propagated through every request chain.
- Typed API contracts in `contracts/` directory.
- Module boundary documentation in `BOUNDARY.md` per module.
- AGENTS.md with stability rules committed to the repo.
- CI pipeline running tests on every push.
- Sentry configured and capturing unhandled exceptions.
- At least one E2E test covering the critical user path.

## Guardrails

- Do not let the agent start coding before a spec is approved. Use Superpowers brainstorming phase.
- Do not ship UI without DESIGN.md or taste-skill — default AI-generated UI is slop.
- Do not trust a single agent's implementation. Always run a separate review agent.
- Do not deploy without CI. A broken main branch costs more time than the 5 minutes to set up GitHub Actions.
- Do not skip test IDs. Without them, you cannot write automated tests or trace user behavior.
- Do not let the agent decide architecture. Founder decides boundaries, agent implements within them.
- Do not ignore TypeScript errors. AI writes better TypeScript than JavaScript — types constrain hallucination.
- Do not treat "agent says done" as done. Verify against the Feature Completeness Checklist.

## Common Mistakes

- Skipping the brainstorming phase because "I already know what to build" — the spec catches 80% of rework.
- Using one agent for both implementation and review — the reviewer must be a fresh context to catch blind spots.
- Deploying to production from local machine — always through CI, even for "quick fixes."
- Over-engineering the harness before building the product — start with the Minimum Viable Stability (testid + traceId + Sentry + CI).
- Building features instead of talking to users when revenue is zero.
