# Startup Playbook Artifacts Skill Design

## Summary

Startup Playbook 1.0 should not depend on the current `product/app` web product. The primary workflow is:

1. The founder works in Codex CLI or Claude Code CLI inside a product repo.
2. Startup Playbook skills guide validation, business model, build, growth, and operations decisions.
3. A dedicated artifact skill writes those decisions into a local `playbook/` directory.
4. `playbook/index.html` gives the founder a static, readable project dashboard.

The previous product UI prototype is outside the 1.0 delivery surface and should not be kept in the main workflow.

## Problem

The existing product direction grew into a platform: Next.js app, local state, bridge server, web terminal, stage runner, artifact APIs, and future auth/database concerns. That is too much for the current validated workflow.

The actual user behavior is simpler:

- The founder already uses Codex or Claude Code as the working interface.
- The agent already has the right context through repository files and skills.
- The missing piece is a durable, structured output that can be resumed, reviewed, reused, and shown.

Without a standard artifact contract, each session produces useful prose but weak continuity. Decisions, evidence, assumptions, and next steps are easy to lose.

## Goals

- Create a new skill named `startup-playbook-artifacts`.
- Make Codex / Claude write consistent `playbook/` artifacts in any startup project.
- Make the artifacts useful without a server, database, login, build process, or web terminal.
- Preserve enough context for future agent sessions to resume work.
- Give founders a visual page for stage status, evidence, decisions, risks, and next actions.

## Non-Goals

- Do not build or maintain a SaaS dashboard for 1.0.
- Do not require Next.js, Supabase, Vercel, WebSocket bridge, or embedded terminal.
- Do not automate all startup stages from a UI.
- Do not make the artifact skill responsible for market research, validation judgment, or growth strategy. Existing stage skills do that.
- Do not keep the old product app as part of the 1.0 implementation.

## Proposed Skill

Path:

```text
skills/startup-playbook-artifacts/SKILL.md
```

Trigger:

Use when a founder wants Startup Playbook outputs saved as project-local artifacts, static HTML reports, stage summaries, decision logs, evidence records, or resumable context for Codex / Claude.

Responsibilities:

- Create or update a project-local `playbook/` directory.
- Write machine-readable JSON for project and stage state.
- Write human-readable Markdown for evidence and decisions.
- Generate or refresh a self-contained `index.html`.
- Keep every conclusion traceable to evidence or explicitly marked as an assumption.
- Keep the artifact shape stable so other skills can write into it.

The skill is an output and persistence layer. It should be used by `startup-playbook-advisor` and stage-specific skills after they finish analysis.

## Advisor Pipeline Review

The current advisor pipeline is broader than the first artifact sketch. The artifact protocol must cover these advisor responsibilities:

1. **Intake and diagnosis**: idea, exact user group, painful situation, workaround, desired outcome, reachable channel, current evidence.
2. **Validation gates**: demand frequency, reachable users, willingness to pay, plus evidence hierarchy and confidence.
3. **AI-native gates when relevant**: AI necessity, human judgment boundary, evaluation plan, persisted context, moat, security/privacy risk.
4. **Business model selection**: product positioning, model type, pricing tiers, first paid test, revenue progression, CAC/LTV assumptions.
5. **Build readiness**: MVP scope, PRD, tech stack, launch checklist, analytics, security, context docs, contracts, and no-build boundaries.
6. **Growth routing**: overseas Google stack, China stack, or both; SEO/ASO, UTM, paid validation, content distribution, AI distribution guardrails.
7. **Operate loop**: weekly metrics, retention decision tree, revenue/churn, channel quality, feedback, next experiment, and back-to-build/grow triggers.
8. **Stage-to-stage handoff**: every stage must produce a compact input package for the next stage, not only a human-readable report.

## Artifact Directory

Each startup project should get this directory:

```text
playbook/
  index.html
  playbook.json
  decision-log.md
  evidence.md
  evidence.json
  assumptions.md
  README.md
  stages/
    validate/
      input.json
      report.json
      report.md
      handoff.json
    business-model/
      input.json
      report.json
      report.md
      handoff.json
    build/
      input.json
      report.json
      report.md
      handoff.json
    grow/
      input.json
      report.json
      report.md
      handoff.json
    operate/
      input.json
      report.json
      report.md
      handoff.json
```

Optional later directories:

```text
playbook/
  assets/
  snapshots/
  interviews/
  adr/
```

## Protocol Rules

The artifact contract is intentionally file-based. Every JSON artifact must be valid standalone JSON, use ISO timestamps, and carry enough metadata for future agents to understand where the result came from.

Common required fields for every JSON artifact:

```json
{
  "protocolVersion": "1.0",
  "artifactType": "stage-report",
  "projectId": "silent-business-state-drift",
  "generatedAt": "2026-05-29T00:00:00.000Z"
}
```

Stage-generated artifacts should also include:

```json
{
  "stage": "validate",
  "generatedBy": {
    "agent": "codex",
    "skill": "idea-validation",
    "model": "unknown"
  },
  "sourceInputs": [
    {
      "type": "file",
      "path": "playbook/stages/validate/input.json"
    }
  ]
}
```

All stage reports must include:

- `status`: `draft` / `running` / `waiting_decision` / `completed` / `killed` / `paused`
- `decision`: `continue` / `pivot` / `kill` / `pause` / `back` / `adjust` / `stop` / JSON `null`
- `nextStageAction`: `advance` / `stay` / `back-to-validate` / `back-to-business-model` / `back-to-build` / `back-to-grow` / `back-to-operate` / `archive`
- `score`: 0-100 when scoring is meaningful, otherwise `null`
- `reasoning`: one concise decision rationale
- `known`: facts with evidence
- `assumed`: plausible but unverified beliefs
- `toValidate`: questions that block confidence
- `evidenceRefs`: IDs from `playbook/evidence.json`
- `concerns`: risks, caveats, and weak assumptions
- `nextSteps`: concrete actions
- `handoffSummary`: the compact output that the next stage should consume

No field should imply certainty without evidence. Missing evidence must live in `assumed` or `toValidate`.

## Protocol Vocabulary

Use these exact values so future skills, renderers, and product prototypes do not infer schema from prose examples.

### Artifact types

- `playbook-manifest`: `playbook/playbook.json`, the project-level manifest.
- `evidence-ledger`: `playbook/evidence.json`, the shared evidence source of truth.
- `stage-input`: `playbook/stages/{stage}/input.json`, the explicit stage input package.
- `stage-report`: `playbook/stages/{stage}/report.json`, the full stage analysis.
- `stage-handoff`: `playbook/stages/{stage}/handoff.json`, the compact next-stage package.

### Stages

- `validate`: idea validation and demand gates.
- `business-model`: model, pricing, paid test, and revenue progression.
- `build`: MVP scope, PRD, tech stack, instrumentation, and launch readiness.
- `grow`: acquisition research, channel experiments, SEO/ASO, paid validation, and measurement.
- `operate`: weekly product, revenue, retention, acquisition, feedback, and backtrack decisions.

### Decision and transition values

- `decision`: `continue`, `pivot`, `kill`, `pause`, `adjust`, `stop`, `back`, or JSON `null`.
- `nextStageAction`: `advance`, `stay`, `archive`, `back-to-validate`, `back-to-business-model`, `back-to-build`, `back-to-grow`, or `back-to-operate`.
- `status`: `draft`, `running`, `waiting_decision`, `completed`, `killed`, or `paused`.

Decision semantics:

- `continue`: enough evidence exists to keep the current direction.
- `pivot`: demand exists, but segment, promise, channel, or model must change before advancing.
- `kill`: current direction lacks enough evidence and should be archived.
- `pause`: wait for a blocker, external data, or founder decision.
- `adjust`: operate-stage change without a full pivot.
- `stop`: stop the current growth, build, or operations track.
- `back`: revisit an earlier stage because later evidence invalidated an earlier assumption.
- `null`: no decision has been made yet.

Score semantics:

- `60-100`: strong enough to continue, advance, or keep running the current operating loop.
- `35-59`: mixed evidence; narrow, pivot, adjust, or stay in the current stage.
- `0-34`: weak or negative evidence; kill, stop, or archive unless the founder explicitly overrides.
- `null`: scoring is not meaningful yet, usually because the stage lacks data.

### Shared classification values

- `gate.status`: `supported`, `partially_supported`, `unknown`, `unsupported`, or `not_applicable`.
- `confidence`: `high`, `medium`, `low`, `limited`, `unknown`, or `not-run`.
- `evidence.strength`: `strongest`, `strong`, `medium`, or `weak`.
- `evidence.sourceType`: `community-comment`, `interview`, `support-ticket`, `search-data`, `trend-data`, `competitor-review`, `pricing-page`, `payment`, `analytics`, `metric-export`, `manual-audit`, `founder-note`, `case-pattern`, or `other`.
- `targetMarkets` item values: `international` or `china-mainland`; include both values when both markets apply.
- `marketRouting.stack`: `google`, `china`, `both`, `manual`, or `none`.
- `sourceInputs.type`: `file`, `url`, `tool-output`, `conversation`, `manual-note`, or `metric-export`.

Local file paths should be relative to the project root. External URLs should be stored only when the source is safe to reference.

## Stage Lifecycle Contract

The advisor owns stage orchestration. The artifact skill owns persistence. Stage skills own analysis.

For every stage run:

1. Update `playbook/evidence.json` first when new evidence is captured.
2. Write or refresh `playbook/stages/{stage}/input.json` before analysis.
3. Write `playbook/stages/{stage}/report.json` after analysis.
4. Write `playbook/stages/{stage}/handoff.json` when the stage can inform a next step, backtrack, or archive decision.
5. Update `playbook/playbook.json` with the stage status, score, decision, artifact paths, and latest decision.
6. Append a new entry to `playbook/decision-log.md` when a decision changes.
7. Regenerate `playbook/index.html`.

In v1, the canonical `input.json`, `report.json`, and `handoff.json` files represent the latest stage run. Historical reasoning is preserved through `decision-log.md`; full historical snapshots can be added later under `playbook/snapshots/`.

## Core Data Model

### `playbook/playbook.json`

```json
{
  "protocolVersion": "1.0",
  "artifactType": "playbook-manifest",
  "projectId": "silent-business-state-drift",
  "generatedAt": "2026-05-29T00:00:00.000Z",
  "updatedAt": "2026-05-29T00:00:00.000Z",
  "generatedBy": {
    "agent": "codex",
    "skill": "startup-playbook-artifacts",
    "model": "unknown"
  },
  "project": {
    "id": "silent-business-state-drift",
    "name": "Silent Business State Drift Monitor",
    "oneLine": "Catch silent business-state drift before finance or ops finds it manually.",
    "targetUser": "Finance/payment ops and engineering teams in transaction-heavy systems",
    "targetMarkets": ["international"],
    "productSurface": "web-app",
    "lifecycle": "idea",
    "createdAt": "2026-05-29T00:00:00.000Z",
    "updatedAt": "2026-05-29T00:00:00.000Z"
  },
  "currentStage": "validate",
  "stageOrder": ["validate", "business-model", "build", "grow", "operate"],
  "stages": {
    "validate": {
      "status": "waiting_decision",
      "decision": "continue",
      "score": 72,
      "updatedAt": "2026-05-29T00:00:00.000Z",
      "inputPath": "stages/validate/input.json",
      "reportPath": "stages/validate/report.json",
      "handoffPath": "stages/validate/handoff.json"
    }
  },
  "latestDecision": {
    "stage": "validate",
    "decision": "continue",
    "reasoning": "Multiple commenters gave concrete recurring examples of silent drift and manual checks."
  }
}
```

### `playbook/evidence.json`

`evidence.json` is the source of truth for evidence used across stages. Markdown reports can summarize it, but stage reports should reference IDs from this ledger.

```json
{
  "protocolVersion": "1.0",
  "artifactType": "evidence-ledger",
  "projectId": "silent-business-state-drift",
  "generatedAt": "2026-05-29T00:00:00.000Z",
  "updatedAt": "2026-05-29T00:00:00.000Z",
  "generatedBy": {
    "agent": "codex",
    "skill": "startup-playbook-artifacts",
    "model": "unknown"
  },
  "items": [
    {
      "id": "ev-ih-eva-001",
      "sourceType": "community-comment",
      "sourceName": "Indie Hackers",
      "url": "https://www.indiehackers.com/post/...",
      "capturedAt": "2026-05-29T00:00:00.000Z",
      "quote": "Everything looks green until finance or support spots the mismatch.",
      "summary": "Commenter described silent business-state drift found during reconciliation.",
      "actorRole": "founder/operator",
      "segment": "transaction-heavy SaaS",
      "stage": "validate",
      "supports": ["demand-frequency", "manual-workaround", "business-impact"],
      "strength": "strong",
      "caveats": ["Public comment, not yet interviewed"],
      "privacy": "public-summary-only"
    }
  ]
}
```

Evidence strength values:

- `strongest`: payment, preorder, paid pilot, signed LOI, clear budget owner, repeated paid alternatives.
- `strong`: repeated raw complaints, interviews, high-intent search/CPC, competitor reviews, manual service demand.
- `medium`: trends, waitlist, demo clicks, case-study patterns, comments from likely buyers.
- `weak`: likes, upvotes, generic praise, broad trend interest, AI-generated claims.

### `decision-log.md` rendering

Append-only. Every decision entry must include:

- timestamp
- stage
- decision
- rationale
- evidence IDs
- assumptions
- what would change the decision
- next stage or backtrack target

### Stage `input.json`

Each stage input captures the explicit context passed into that stage. It prevents future agents from guessing why a stage was run.

```json
{
  "protocolVersion": "1.0",
  "artifactType": "stage-input",
  "projectId": "silent-business-state-drift",
  "stage": "business-model",
  "generatedAt": "2026-05-29T00:00:00.000Z",
  "generatedBy": {
    "agent": "codex",
    "skill": "startup-playbook-artifacts",
    "model": "unknown"
  },
  "sourceInputs": [
    {
      "type": "file",
      "path": "playbook/stages/validate/handoff.json"
    }
  ],
  "fromStage": "validate",
  "inputs": {
    "targetUser": "Finance/payment ops and engineering teams in transaction-heavy systems",
    "pain": "Silent business-state drift appears after product events while technical monitoring stays green.",
    "currentWorkarounds": ["manual reconciliation", "SQL checks", "spreadsheets"],
    "willingnessToPaySignals": ["manual checks are costly", "profit impact described in public comment"],
    "evidenceRefs": ["ev-ih-eva-001"]
  }
}
```

Required `inputs` payload by stage:

| Stage | Required input keys | Typical source |
| --- | --- | --- |
| `validate` | `idea`, `targetUserCandidate`, `painfulSituation`, `currentWorkaround`, `desiredOutcome`, `reachableSurfaces`, `currentEvidenceRefs`, `constraints` | founder conversation, repo notes, public research, previous evidence ledger |
| `business-model` | `targetUser`, `pain`, `currentAlternatives`, `willingnessToPaySignals`, `paidIntentGaps`, `firstReachableChannel`, `evidenceRefs` | `validate/handoff.json` |
| `build` | `targetUser`, `buyer`, `pain`, `promiseCandidate`, `modelType`, `pricingHypothesis`, `firstPaidTest`, `mustNotBuild`, `evidenceRefs` | `validate/handoff.json` and `business-model/handoff.json` |
| `grow` | `targetMarkets`, `productSurface`, `landingPages`, `deployedUrl`, `analyticsEvents`, `utmConvention`, `pricingOrConversionAction`, `channelHypotheses`, `evidenceRefs` | `build/handoff.json`, launch checklist, analytics setup |
| `operate` | `periodStart`, `periodEnd`, `targetMarkets`, `metricSources`, `revenueSources`, `feedbackSources`, `activeChannels`, `currentGoals`, `evidenceRefs` | growth handoff, GA4/Search Console/Ads exports, China analytics, revenue reports, customer feedback |

If a required input key is unknown, include it with `null`, `[]`, or `"unknown"` and add the gap to the stage report's `toValidate` field. Do not silently omit it.

### Stage `report.json`

```json
{
  "protocolVersion": "1.0",
  "artifactType": "stage-report",
  "projectId": "silent-business-state-drift",
  "stage": "validate",
  "generatedAt": "2026-05-29T00:00:00.000Z",
  "generatedBy": {
    "agent": "codex",
    "skill": "idea-validation",
    "model": "unknown"
  },
  "sourceInputs": [
    {
      "type": "file",
      "path": "playbook/stages/validate/input.json"
    }
  ],
  "status": "waiting_decision",
  "score": 72,
  "decision": "continue",
  "nextStageAction": "advance",
  "reasoning": "Multiple concrete cases show recurring operational pain and manual workaround cost.",
  "known": [
    "Indie Hackers post reached homepage visibility and received concrete comments from founders/operators.",
    "One commenter described refund_pending plus active_premium state drift discovered weeks later during Stripe payout reconciliation."
  ],
  "assumed": [
    "Finance/payment ops may feel the pain before engineering sees a clean ticket."
  ],
  "toValidate": [
    "Who owns budget for prevention: engineering, finance ops, or operations?"
  ],
  "evidenceRefs": ["ev-ih-eva-001"],
  "concerns": [
    "False positives may make operations teams ignore alerts.",
    "The first user and buyer may be different roles."
  ],
  "nextSteps": [
    "Collect five sanitized drift cases.",
    "Extract hand-written invariant candidates from past incidents.",
    "Test whether finance/payment ops or engineering gives sharper buying signals."
  ],
  "analysis": {},
  "handoffSummary": {
    "nextStage": "business-model",
    "summary": "Use manual audit/productized service as the first paid test before building SaaS automation."
  }
}
```

### Stage `handoff.json`

The handoff is the contract between stages. It must be short enough for the next agent session to load quickly.

```json
{
  "protocolVersion": "1.0",
  "artifactType": "stage-handoff",
  "projectId": "silent-business-state-drift",
  "fromStage": "validate",
  "toStage": "business-model",
  "generatedAt": "2026-05-29T00:00:00.000Z",
  "generatedBy": {
    "agent": "codex",
    "skill": "startup-playbook-artifacts",
    "model": "unknown"
  },
  "sourceInputs": [
    {
      "type": "file",
      "path": "playbook/stages/validate/report.json"
    }
  ],
  "summary": {
    "narrowedSegment": "Finance/payment ops and engineering teams in transaction-heavy systems",
    "painfulSituation": "Business state silently drifts while logs/tests stay green.",
    "strongestRawLanguage": "Everything looks green until finance or support spots the mismatch.",
    "promiseCandidate": "Catch silent business-state drift before finance or ops finds it manually.",
    "firstReachableChannel": "Indie Hackers and direct founder/operator interviews",
    "evidenceRefs": ["ev-ih-eva-001"],
    "paidIntentGaps": ["budget owner", "paid pilot interest", "procurement path"],
    "recommendedNextExperiment": "Ask five operators with recent drift incidents whether they would pay for a manual invariant audit."
  }
}
```

## Stage-Specific Report Contracts

### Validate

Purpose: decide whether the idea deserves more validation, a paid/manual test, or MVP work.

Required `analysis` fields:

```json
{
  "snapshot": {
    "idea": "Silent Business State Drift Monitor",
    "targetUser": "Finance/payment ops and engineering teams",
    "painfulSituation": "System appears healthy but business records no longer reconcile.",
    "currentWorkaround": "Manual checks, spreadsheets, SQL, dbt, dashboards",
    "desiredOutcome": "Catch drift before finance/support/customers find it",
    "firstReachableChannel": "Indie Hackers post comments"
  },
  "gates": {
    "demandRealAndFrequent": {
      "status": "supported",
      "evidenceRefs": ["ev-ih-eva-001"],
      "notes": "Multiple concrete recurring cases."
    },
    "usersReachable": {
      "status": "supported",
      "surfaces": ["Indie Hackers", "finance ops communities", "payment ops networks"]
    },
    "willingnessToPay": {
      "status": "unknown",
      "signals": ["profit impact", "manual work cost"],
      "missing": ["budget owner", "paid pilot interest"]
    }
  },
  "painMining": {
    "themes": [
      {
        "id": "silent-business-state-drift",
        "label": "Silent business-state drift",
        "count": 4,
        "frequency": null,
        "evidenceRefs": ["ev-ih-eva-001"]
      }
    ],
    "rawQuoteCount": 0,
    "sourceCoverage": ["community-comment"]
  },
  "searchAndMarket": {
    "keywords": [],
    "trendSignals": [],
    "competitors": [],
    "confidence": "not-run"
  },
  "willingnessToPay": {
    "paidAlternatives": [],
    "manualServiceCandidate": "paid operations/data consistency audit",
    "firstPayingCustomerPlan": "Find 5 teams with recent reconciliation drift incidents."
  },
  "landingPageTest": {
    "headline": "Catch silent business-state drift before finance or ops finds it manually.",
    "conversionAction": "book-call",
    "successThreshold": "5 high-intent conversations or 1 paid audit"
  }
}
```

Validate `handoff.json` must include:

- narrowed segment
- painful situation
- strongest raw language
- evidence IDs
- first reachable channel
- paid-intent gaps
- recommended next experiment

### Business Model

Purpose: choose model, pricing, and first revenue path after validation signals exist.

Required `analysis` fields:

```json
{
  "positioning": {
    "buyerType": "B2B",
    "userType": "finance/payment ops + engineering",
    "frequency": "weekly/monthly recurring",
    "currentAlternative": "manual reconciliation and custom SQL",
    "deliverable": "monitoring tool plus operations audit"
  },
  "recommendedModel": {
    "type": "productized-service-to-saas",
    "rationale": "Manual service can validate paid demand before SaaS automation.",
    "casePatternRefs": ["founder-case-patterns:manual-service", "business-model-design:saas"]
  },
  "pricing": {
    "firstPaidTest": "paid audit",
    "servicePriceRange": "$500-2000",
    "saasPriceHypothesis": "$99-299/mo",
    "anchor": "cost of reconciliation failures and manual ops time",
    "tiers": []
  },
  "revenueProgression": {
    "zeroToOne": "1 paid audit or pilot",
    "oneToOneK": "3-5 recurring teams",
    "oneKToTenK": "repeatable ops/finance channel",
    "killOrPivotThreshold": "0 paid intent after 5 qualified conversations"
  },
  "unitEconomics": {
    "cacAssumptions": [],
    "ltvAssumptions": [],
    "paybackAssumption": null
  }
}
```

Business model `handoff.json` must include:

- buyer/user distinction
- model type
- pricing hypothesis
- first paid test
- revenue milestones
- monetization risks

### Build

Purpose: define the smallest product or non-build path that proves one promise for one segment.

Required `analysis` fields:

```json
{
  "mvpScope": {
    "smallestPromise": "Monitor a small set of explicit business invariants for one workflow.",
    "mustHave": ["invariant definition", "data check execution", "exception report"],
    "notNow": ["automatic discovery of every rule", "multi-tenant enterprise platform"],
    "manualFallback": "concierge audit using customer exports"
  },
  "prd": {
    "targetUser": "payment/finance ops owner",
    "scenario": "after code/data/process changes or during reconciliation",
    "userFlow": ["define invariant", "connect/export data", "run check", "review exception"],
    "acceptanceCriteria": [],
    "successMetrics": ["first_value_delivered", "checkout_start", "purchase"]
  },
  "techStack": {
    "productSurface": "web-app or CLI-assisted report",
    "recommendedStack": "Next.js + managed DB, or spreadsheet/SQL concierge for manual test",
    "paymentProvider": "Stripe/Paddle/LemonSqueezy",
    "rationale": "Use familiar managed services; do not build platform features first."
  },
  "aiNativeCheck": {
    "applies": true,
    "stage": "MVP",
    "aiRole": "Translate approved plain-English invariants into executable checks.",
    "aiNecessity": "AI may help translate plain-English invariants into checks, but first version can be rule-based.",
    "humanOwnedDecisions": ["rule approval", "false-positive triage", "customer communication"],
    "evaluationPlan": {
      "goldenExamples": ["known drift incidents"],
      "edgeCases": ["normal dispute", "late settlement", "partial refund"],
      "humanReviewThresholds": ["all high-severity exceptions before customer-facing alerting"],
      "regressionChecks": ["known-good payment and refund flows"]
    },
    "contextRequirements": ["CONTEXT.md", "AGENTS.md", "contracts/", "docs/adr/"],
    "moatHypothesis": "Domain-specific invariant library and workflow integrations.",
    "securityPrivacyRisks": ["financial data exposure", "PII", "customer operational data"]
  },
  "instrumentation": {
    "events": ["sign_up", "first_value_delivered", "checkout_start", "purchase"],
    "utmRequired": true,
    "searchConsoleRequired": true,
    "chinaAnalyticsRequired": false
  },
  "launchChecklist": {
    "preLaunch": [],
    "launchDay": [],
    "firstSevenDays": []
  }
}
```

Build `handoff.json` must include:

- MVP promise and excluded scope
- user flow
- acceptance criteria
- analytics events
- launch channel
- deployed URL if available
- security/privacy review status

### Grow

Purpose: turn validated user pain and launched product into measurable acquisition experiments.

Required `analysis` fields:

```json
{
  "marketRouting": {
    "targetMarkets": ["international"],
    "stack": "google",
    "reason": "Overseas search/community target first."
  },
  "keywordClusters": [
    {
      "cluster": "problem",
      "keywords": ["business data inconsistency", "reconciliation mismatch"],
      "intent": "problem",
      "priority": 1,
      "confidence": "limited"
    }
  ],
  "seoAso": {
    "landingPages": [],
    "titles": [],
    "metaDescriptions": [],
    "appStore": null
  },
  "channels": [
    {
      "name": "founder communities",
      "type": "community",
      "hypothesis": "operators with recent incidents will share stories",
      "measurement": "qualified conversations"
    }
  ],
  "paidValidation": {
    "googleAds": {
      "use": false,
      "budget": null,
      "successMetric": null
    },
    "chinaPaidChannels": []
  },
  "utmPlan": {
    "required": true,
    "campaigns": []
  },
  "aiDistribution": {
    "aiCan": ["scan posts", "summarize themes", "draft replies"],
    "humanOwns": ["final replies", "cold outreach", "customer-sensitive wording"],
    "neverWrite": ["auto-post", "auto-comment", "auto-DM"]
  },
  "measurementPlan": {
    "metrics": ["impressions", "clicks", "sign_up", "first_value_delivered", "purchase"],
    "reviewCadence": "weekly"
  }
}
```

Grow `handoff.json` must include:

- active channels
- UTM conventions
- SEO/ASO targets
- paid test setup if any
- content backlog
- measurement plan and thresholds

### Operate

Purpose: make weekly decisions from product, acquisition, revenue, retention, and feedback data.

Required `analysis` fields:

```json
{
  "weeklySnapshot": {
    "periodStart": "2026-05-22",
    "periodEnd": "2026-05-29",
    "visitors": null,
    "signups": null,
    "activated": null,
    "paying": null,
    "revenue": null,
    "searchClicks": null
  },
  "aarrr": {
    "acquisition": {},
    "activation": {},
    "revenue": {},
    "retention": {},
    "referral": {},
    "feedback": {}
  },
  "retention": {
    "d1": null,
    "d7": null,
    "d30": null,
    "diagnosis": "not-enough-data",
    "segmentFindings": []
  },
  "revenueHealth": {
    "mrr": null,
    "churn": null,
    "ltv": null,
    "refunds": null
  },
  "channelQuality": {
    "bestSource": null,
    "lowestCostPerOutcome": null,
    "channelsToStop": []
  },
  "feedbackThemes": [],
  "biggestBlocker": null,
  "nextExperiment": {
    "name": null,
    "goal": null,
    "successMetric": null,
    "stopCondition": null
  },
  "decisionTreeResult": {
    "scenario": "no-data",
    "recommendation": "instrument before deciding"
  }
}
```

Operate `handoff.json` must include:

- decision: continue / adjust / stop / back-to-grow / back-to-build / back-to-validate
- primary metric
- biggest blocker
- next experiment
- stage to revisit if needed

## Stage Interface Matrix

This matrix is the handoff contract across the full advisor pipeline.

| Stage | Consumes | Produces in `report.analysis` | Produces in `handoff.summary` | Default next consumer |
| --- | --- | --- | --- | --- |
| `validate` | founder idea, raw evidence, research surfaces, constraints | `snapshot`, `gates`, `painMining`, `searchAndMarket`, `willingnessToPay`, `landingPageTest` | `narrowedSegment`, `painfulSituation`, `strongestRawLanguage`, `evidenceRefs`, `firstReachableChannel`, `paidIntentGaps`, `recommendedNextExperiment` | `business-model` |
| `business-model` | validation handoff, paid-intent signals, founder constraints | `positioning`, `recommendedModel`, `pricing`, `revenueProgression`, `unitEconomics` | `buyer`, `user`, `modelType`, `pricingHypothesis`, `firstPaidTest`, `revenueMilestones`, `monetizationRisks` | `build` |
| `build` | validation and business model handoffs, launch constraints | `mvpScope`, `prd`, `techStack`, `aiNativeCheck`, `instrumentation`, `launchChecklist` | `smallestPromise`, `excludedScope`, `userFlow`, `acceptanceCriteria`, `analyticsEvents`, `launchChannel`, `deployedUrl`, `securityPrivacyReviewStatus` | `grow` |
| `grow` | build handoff, target markets, landing/deployed surface, measurement setup | `marketRouting`, `keywordClusters`, `seoAso`, `channels`, `paidValidation`, `utmPlan`, `aiDistribution`, `measurementPlan` | `activeChannels`, `utmConvention`, `seoAsoTargets`, `paidTestSetup`, `contentBacklog`, `measurementThresholds` | `operate` |
| `operate` | metrics exports, revenue data, feedback, active channels, prior goals | `weeklySnapshot`, `aarrr`, `retention`, `revenueHealth`, `channelQuality`, `feedbackThemes`, `biggestBlocker`, `nextExperiment`, `decisionTreeResult` | `decision`, `primaryMetric`, `biggestBlocker`, `nextExperiment`, `stageToRevisit`, `evidenceRefs` | `validate`, `build`, `grow`, or `archive` |

Backtracking is allowed only when `report.nextStageAction` points to a concrete `back-to-*` target and the report explains which assumption was invalidated.

## Cross-Cutting Contracts

### AI-Native Check

Any stage may include an `analysis.aiNativeCheck` object when AI is central:

```json
{
  "applies": true,
  "stage": "Idea",
  "aiRole": "translation of plain-English invariants into checks",
  "aiNecessity": "unknown",
  "humanOwnedDecisions": ["rule approval", "customer communication"],
  "evaluationPlan": {
    "goldenExamples": [],
    "edgeCases": [],
    "humanReviewThresholds": [],
    "regressionChecks": []
  },
  "contextRequirements": ["CONTEXT.md", "architecture notes", "prompt examples"],
  "moatHypothesis": "domain-specific invariant library and workflow integrations",
  "securityPrivacyRisks": ["financial data", "operational data"]
}
```

### Growth Stack Routing

Every build/grow/operate stage should state which analytics/growth stack applies:

```json
{
  "marketRouting": {
    "targetMarkets": ["international", "china-mainland"],
    "analytics": ["GA4", "Baidu Analytics", "Umeng+"],
    "search": ["Google Search Console", "Baidu Search Resource Platform"],
    "ads": ["Google Ads", "Baidu Promotion", "Ocean Engine"],
    "tools": ["tools/google-growth-stack", "tools/china-growth-stack"],
    "privacyCompliance": ["PIPL consent before SDK initialization"]
  }
}
```

## Markdown Outputs

Markdown files are human-readable mirrors of the JSON protocol. They must not introduce new facts that are absent from JSON. When possible, include evidence IDs next to claims so later agents can trace prose back to `evidence.json`.

### `decision-log.md`

Append-only decision history. Each entry must include:

- timestamp
- stage
- decision: continue / pivot / kill / pause
- reasoning
- evidence IDs used
- assumptions
- what would change the decision
- next stage or backtrack target

### `evidence.md`

Evidence table grouped by source. Each evidence item must include:

- evidence ID
- source and link
- short quote or summary
- evidence strength: weak / medium / strong / strongest
- related stage
- interpretation
- limits or caveats

### Stage `report.md`

Founder-readable narrative for that stage:

- snapshot
- gate decision
- known / assumed / to validate
- evidence table
- risks and stop conditions
- next 7 days
- stage handoff summary

## Static HTML

`playbook/index.html` should be self-contained and open directly in a browser. It should not require a build step.

Content sections:

- project summary
- stage pipeline
- current decision
- evidence strength
- known / assumed / to validate
- latest risks and stop conditions
- next actions
- AI-native gates when relevant
- growth stack routing and analytics status when relevant
- operate weekly metrics when relevant
- links to Markdown and JSON files

The HTML must be regenerated every time a stage report changes. It should be fully rendered from the current JSON files and embed the data needed for display to avoid browser file-fetch restrictions when opened directly from disk.

## Integration With Existing Skills

`startup-playbook-advisor` should call this skill when the user asks to save, export, render, document, or persist a startup decision.

Stage skills should produce their normal analysis first, then use the artifact skill to persist it:

| Stage | Primary skill | Artifact path |
| --- | --- | --- |
| Validate | `idea-validation` / `reddit-demand-validation` | `input.json`, `report.json`, `handoff.json` |
| Business Model | `business-model-design` | `input.json`, `report.json`, `handoff.json` |
| Build | `product-development-loop` / `ai-native-development` | `input.json`, `report.json`, `handoff.json` |
| Grow | `seo-aso-growth-research` | `input.json`, `report.json`, `handoff.json` |
| Operate | operations review skills/manual analysis | `input.json`, `report.json`, `handoff.json` |

The artifact skill owns the file protocol. Stage skills own the stage analysis. The advisor owns orchestration and must ensure each stage receives the prior stage's `handoff.json`.

## Product Prototype Policy

For 1.0, `product/` is not required and has been removed from the main repo surface. The canonical user-facing output is the project-local `playbook/` directory.

The old app contract was migrated into `startup-playbook-artifacts`. Future product UI work should start from the new artifact protocol instead of restoring `product/app/.playbook-output`.

## Error Handling

The artifact skill should:

- create missing directories;
- update existing files without deleting unrelated founder notes;
- refuse to overwrite a non-playbook directory with conflicting files;
- keep `decision-log.md` append-only unless the user explicitly asks to edit history;
- mark missing evidence as `assumed` or `toValidate`, not as fact;
- use ISO timestamps for all generated records.

## Verification

Minimum implementation checks:

- A sample project can generate `playbook/index.html`.
- `playbook.json` is valid JSON.
- `evidence.json` is valid JSON and every `evidenceRefs` value resolves to an evidence item.
- Each generated stage `input.json`, `report.json`, and `handoff.json` is valid JSON and includes required fields.
- `decision-log.md` appends a new entry on stage decision.
- `index.html` opens directly from disk and shows the latest stage status.
- `index.html` shows AI-native, growth stack, and operate metrics sections only when the corresponding data exists.
- A later agent session can resume by reading only `playbook/playbook.json`, `playbook/evidence.json`, and the current stage `handoff.json`.
- Existing tool tests still pass where relevant.

## Protocol Decisions

1. The protocol lives in `startup-playbook-artifacts`; reusable JSON and Markdown templates should live under that skill's `templates/` directory.
2. The first implementation should generate fully rendered static HTML. A deterministic renderer script is allowed if direct agent-written HTML becomes inconsistent.
3. Generated `playbook/` directories should be committed in target product repos by default when they contain non-sensitive project decisions. Evidence with private customer details should be summarized or redacted before commit.
4. The old product app and `.playbook-output` contract are removed from 1.0. New work should write to project-local `playbook/`.

## Recommendation

Start with a new `startup-playbook-artifacts` skill plus protocol templates. Keep stage analysis in the existing stage skills, but make artifact persistence mandatory whenever the user asks to save, export, render, or resume a startup pipeline.
