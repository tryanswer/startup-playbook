# Startup Playbook Artifact Protocol

The artifact protocol is file-based so it works in any product repo without a server or database.

## Directory

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
    validate/input.json
    validate/report.json
    validate/report.md
    validate/handoff.json
    business-model/input.json
    business-model/report.json
    business-model/report.md
    business-model/handoff.json
    build/input.json
    build/report.json
    build/report.md
    build/handoff.json
    grow/input.json
    grow/report.json
    grow/report.md
    grow/handoff.json
    operate/input.json
    operate/report.json
    operate/report.md
    operate/handoff.json
```

## Required JSON Fields

Every JSON artifact must include:

- `protocolVersion`: currently `"1.0"`.
- `artifactType`: `playbook-manifest`, `evidence-ledger`, `stage-input`, `stage-report`, or `stage-handoff`.
- `projectId`: stable project slug.
- `generatedAt`: ISO timestamp.

Stage artifacts also include `stage`, `generatedBy`, and `sourceInputs`.

## Common Stage Report Fields

Every `report.json` includes:

- `status`: `draft`, `running`, `waiting_decision`, `completed`, `killed`, or `paused`.
- `decision`: `continue`, `pivot`, `kill`, `pause`, `adjust`, `stop`, `back`, or JSON `null`.
- `nextStageAction`: `advance`, `stay`, `archive`, `back-to-validate`, `back-to-business-model`, `back-to-build`, `back-to-grow`, or `back-to-operate`.
- `score`: `0-100`, or `null` when scoring is not meaningful.
- `reasoning`: concise rationale.
- `known`: evidenced facts.
- `assumed`: plausible but unverified beliefs.
- `toValidate`: questions blocking confidence.
- `evidenceRefs`: IDs from `playbook/evidence.json`.
- `concerns`: risks, caveats, weak assumptions.
- `nextSteps`: concrete actions.
- `analysis`: stage-specific structured payload.
- `handoffSummary`: compact next-stage payload.

Score defaults:

- `60-100`: continue, advance, or keep running the operating loop.
- `35-59`: mixed evidence; narrow, pivot, adjust, or stay.
- `0-34`: weak or negative evidence; kill, stop, or archive unless overridden.
- `null`: insufficient data to score.

## Shared Values

- `gate.status`: `supported`, `partially_supported`, `unknown`, `unsupported`, or `not_applicable`.
- `confidence`: `high`, `medium`, `low`, `limited`, `unknown`, or `not-run`.
- `evidence.strength`: `strongest`, `strong`, `medium`, or `weak`.
- `evidence.sourceType`: `community-comment`, `interview`, `support-ticket`, `search-data`, `trend-data`, `competitor-review`, `pricing-page`, `payment`, `analytics`, `metric-export`, `manual-audit`, `founder-note`, `case-pattern`, or `other`.
- `targetMarkets` item values: `international` or `china-mainland`.
- `marketRouting.stack`: `google`, `china`, `both`, `manual`, or `none`.
- `sourceInputs.type`: `file`, `url`, `tool-output`, `conversation`, `manual-note`, or `metric-export`.

## Validate Evidence Standard

The `validate` stage must separate founder belief from sourced evidence. A completed validation report must include `analysis.validationEvidence` and `analysis.minimumEvidenceSet`.

`analysis.validationEvidence` is an array of data-bearing rows. Each row must include:

- `id`: stable row ID.
- `category`: `trend`, `search`, `community`, `interview`, `paid-alternative`, `payment`, `platform-rule`, `competitor`, `analytics`, or `manual-audit`.
- `sourceType`: one of the shared `evidence.sourceType` values.
- `sourceName`: human-readable source, for example `Google Trends` or `Amazon Seller Central`.
- `url`: source URL when available, otherwise `null`.
- `capturedAt`: ISO timestamp.
- `timeframe`: date window or sampling window, for example `today 12-m`.
- `region`: geography or audience segment, for example `US` or `cross-border Amazon sellers`.
- `query`: search query, interview question, cohort, or inspected object.
- `metric`: metric name, for example `relative interest`, `monthly search volume`, `paid price`, `quote count`, or `conversion`.
- `observedValue`: observed value with units. Do not write generic claims such as "high demand".
- `sampleSize`: count when known, otherwise `null`.
- `comparison`: baseline, competitor, or prior period when available.
- `interpretation`: what the value supports or weakens.
- `supports`: assumptions supported by the row.
- `contradicts`: assumptions weakened by the row.
- `evidenceRef`: ID from `playbook/evidence.json`.
- `confidence`: `high`, `medium`, `low`, `limited`, `unknown`, or `not-run`.
- `freshness`: `fresh`, `recent`, `stale`, or `unknown`.
- `mock`: `true` only for synthetic data used to exercise the pipeline.

`analysis.minimumEvidenceSet` summarizes whether the validation decision has enough data:

```json
{
  "status": "partial",
  "requiredCategories": ["trend", "search", "user-pain", "willingness-to-pay", "reachability"],
  "metCategories": ["trend", "search", "paid-alternative", "platform-rule"],
  "missingCategories": ["real-user-pain", "payment"],
  "decisionRule": "Continue only when at least one direct buyer-pain row and one paid-intent or payment row are present.",
  "notes": "Trend data supports demand direction but does not prove urgent paid demand."
}
```

For Google Trends rows, record the exact query, region, timeframe, average/latest values, and momentum. Google Trends is normalized relative interest from 0 to 100; it is not absolute search volume and cannot prove willingness to pay.

Validation strength guidelines:

- `strongest`: real payment, preorder, paid pilot, or repeated buyer-owned workflow data.
- `strong`: direct buyer interviews, support tickets, analytics, or search data with clear commercial intent.
- `medium`: trend data, competitor pricing, platform rules, or community comments.
- `weak`: founder notes, single anecdotes, mock data, broad head terms, or unsourced claims.

If `validate.status` is `completed`, do not leave `analysis.validationEvidence` empty. If the minimum evidence set is incomplete, the decision should normally be `pivot`, `pause`, `kill`, or `stay`, not an unqualified `continue`.

## Stage Lifecycle

1. Update `playbook/evidence.json` when new evidence is captured.
2. Write or refresh `playbook/stages/{stage}/input.json`.
3. Write `playbook/stages/{stage}/report.json`.
4. Write `playbook/stages/{stage}/handoff.json`.
5. Update `playbook/playbook.json`.
6. Append `playbook/decision-log.md` when a decision changes.
7. Regenerate `playbook/index.html`.

The latest canonical stage run lives in `input.json`, `report.json`, and `handoff.json`. Historical reasoning belongs in `decision-log.md`; full snapshots can be added later under `playbook/snapshots/`.

## Stage Input Requirements

| Stage | Required `inputs` keys |
| --- | --- |
| `validate` | `idea`, `targetUserCandidate`, `painfulSituation`, `currentWorkaround`, `desiredOutcome`, `reachableSurfaces`, `currentEvidenceRefs`, `constraints` |
| `business-model` | `targetUser`, `pain`, `currentAlternatives`, `willingnessToPaySignals`, `paidIntentGaps`, `firstReachableChannel`, `evidenceRefs` |
| `build` | `targetUser`, `buyer`, `pain`, `promiseCandidate`, `modelType`, `pricingHypothesis`, `firstPaidTest`, `mustNotBuild`, `evidenceRefs` |
| `grow` | `targetMarkets`, `productSurface`, `landingPages`, `deployedUrl`, `analyticsEvents`, `utmConvention`, `pricingOrConversionAction`, `channelHypotheses`, `evidenceRefs` |
| `operate` | `periodStart`, `periodEnd`, `targetMarkets`, `metricSources`, `revenueSources`, `feedbackSources`, `activeChannels`, `currentGoals`, `evidenceRefs` |

If a required value is unknown, keep the key and set it to `null`, `[]`, or `"unknown"`. Add the gap to `toValidate`.

## Stage Interface Matrix

| Stage | Produces in `report.analysis` | Produces in `handoff.summary` |
| --- | --- | --- |
| `validate` | `snapshot`, `gates`, `validationEvidence`, `minimumEvidenceSet`, `painMining`, `searchAndMarket`, `willingnessToPay`, `landingPageTest` | `narrowedSegment`, `painfulSituation`, `strongestRawLanguage`, `evidenceRefs`, `firstReachableChannel`, `paidIntentGaps`, `recommendedNextExperiment` |
| `business-model` | `positioning`, `recommendedModel`, `pricing`, `revenueProgression`, `unitEconomics` | `buyer`, `user`, `modelType`, `pricingHypothesis`, `firstPaidTest`, `revenueMilestones`, `monetizationRisks` |
| `build` | `mvpScope`, `prd`, `techStack`, `aiNativeCheck`, `instrumentation`, `launchChecklist` | `smallestPromise`, `excludedScope`, `userFlow`, `acceptanceCriteria`, `analyticsEvents`, `launchChannel`, `deployedUrl`, `securityPrivacyReviewStatus` |
| `grow` | `marketRouting`, `keywordClusters`, `seoAso`, `channels`, `paidValidation`, `utmPlan`, `aiDistribution`, `measurementPlan` | `activeChannels`, `utmConvention`, `seoAsoTargets`, `paidTestSetup`, `contentBacklog`, `measurementThresholds` |
| `operate` | `weeklySnapshot`, `aarrr`, `retention`, `revenueHealth`, `channelQuality`, `feedbackThemes`, `biggestBlocker`, `nextExperiment`, `decisionTreeResult` | `decision`, `primaryMetric`, `biggestBlocker`, `nextExperiment`, `stageToRevisit`, `evidenceRefs` |

Backtracking is allowed only when `report.nextStageAction` points to a concrete `back-to-*` target and the report explains which assumption was invalidated.

## Cross-Cutting Objects

Use `analysis.aiNativeCheck` when AI is central:

```json
{
  "applies": true,
  "stage": "MVP",
  "aiRole": "Translate approved plain-English invariants into executable checks.",
  "aiNecessity": "unknown",
  "humanOwnedDecisions": ["rule approval", "customer communication"],
  "evaluationPlan": {
    "goldenExamples": [],
    "edgeCases": [],
    "humanReviewThresholds": [],
    "regressionChecks": []
  },
  "contextRequirements": ["CONTEXT.md", "AGENTS.md", "contracts/"],
  "moatHypothesis": "unknown",
  "securityPrivacyRisks": []
}
```

Use `marketRouting` in build, grow, and operate when analytics or acquisition stack matters:

```json
{
  "marketRouting": {
    "targetMarkets": ["international", "china-mainland"],
    "stack": "both",
    "analytics": ["GA4", "Baidu Analytics", "Umeng+"],
    "search": ["Google Search Console", "Baidu Search Resource Platform"],
    "ads": ["Google Ads", "Baidu Promotion", "Ocean Engine"],
    "tools": ["tools/google-growth-stack", "tools/china-growth-stack"],
    "privacyCompliance": ["PIPL consent before SDK initialization"]
  }
}
```

## Static HTML

`playbook/index.html` must be self-contained and open directly from disk. Render data into the HTML; do not rely on `fetch()` against local JSON files.

Show sections only when data exists:

- project summary
- stage pipeline
- current decision
- validation evidence data
- evidence strength
- known / assumed / to validate
- risks and stop conditions
- next actions
- AI-native gates
- growth stack routing
- operate weekly metrics
- links to Markdown and JSON files
