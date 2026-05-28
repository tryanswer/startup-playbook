# AI-Native Product Stability

AI agents ship code fast, but speed without stability is just faster failure. This guide addresses the core pain point of AI-native development: **how to build reliable products when most code is written by agents**.

The principles here are informed by Anthropic's harness engineering methodology, OpenAI's Codex factory patterns, and practical indie hacker experience.

## Why AI-Generated Code Breaks Differently

Traditional bugs come from human misunderstanding. AI-generated bugs come from **confident hallucination** — the code looks correct, passes a superficial review, but fails in edge cases the agent never considered.

| Traditional Bug | AI-Generated Bug |
|---|---|
| Typo, off-by-one, null check | Structurally correct but semantically wrong |
| Developer knows the code is tricky | Agent presents it as trivially correct |
| Caught by code review | Passes review because it "looks right" |
| Localized to one file | Can silently propagate across modules |
| Developer can explain the intent | Agent cannot recall why it made a choice |

**The harness engineering insight**: The model is not the reliability bottleneck — the system around the model is. Same model + better harness = dramatically better results. LangChain improved from 52.8% to 66.5% on Terminal Bench 2.0 by changing only the harness, not the model.

## The Six Pillars of AI-Native Stability

### Pillar 1: Full-Stack Observability

> Every behavior must be traceable from the UI click to the database query and back.

#### Frontend: Test IDs on Every Interactive Element

Every interactive UI element must have a `data-testid` attribute. This serves three purposes: automated testing, error tracing, and analytics event mapping.

```tsx
// ❌ No observability
<button onClick={handleSubmit}>Submit</button>

// ✅ Full observability
<button
  data-testid="checkout-submit-button"
  onClick={handleSubmit}
>
  Submit
</button>
```

**Naming convention**: `{page}-{component}-{action}`

```
checkout-submit-button
settings-profile-save
onboarding-step2-next
dashboard-filter-apply
pricing-plan-select
```

**Agent instruction**: Add this to your AGENTS.md or project rules:

```markdown
## Test ID Rule
Every interactive element (button, input, link, form, toggle, dropdown)
MUST have a data-testid attribute following the pattern: {page}-{component}-{action}.
No PR is mergeable without test IDs on all new interactive elements.
```

#### Request Chain: TraceID End-to-End

Every request must carry a `traceId` from the frontend through every backend service to the database and back. When something fails, the LLM can grep the trace log and locate the exact failure point.

```
Browser → API Gateway → Service A → Service B → Database
   │          │            │            │           │
   └──────────┴────────────┴────────────┴───────────┘
                     traceId: "abc-123-def"
```

**Implementation (minimal)**:

```typescript
// Middleware: generate or propagate traceId
function traceMiddleware(req, res, next) {
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  req.traceId = traceId;
  res.setHeader('x-trace-id', traceId);

  // Attach to all downstream calls
  req.fetchWithTrace = (url, options = {}) => {
    options.headers = {
      ...options.headers,
      'x-trace-id': traceId,
    };
    return fetch(url, options);
  };

  next();
}
```

```typescript
// Structured log with traceId
function log(level, message, context) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    traceId: context.traceId,
    service: process.env.SERVICE_NAME,
    message,
    ...context,
  }));
}
```

**AI debugging workflow**: When an error occurs, feed the traceId to your coding agent:

```
Debug this error. TraceId: abc-123-def
Here are all logs with this traceId: [paste logs]
Find the root cause and propose a fix.
```

#### Structured Error Context

Errors must carry enough context for an agent to diagnose without human explanation:

```typescript
class AppError extends Error {
  constructor(message, {
    code,          // Machine-readable error code: "PAYMENT_DECLINED"
    traceId,       // Request trace ID
    userId,        // Who was affected
    input,         // What they were trying to do
    upstream,      // Which dependency failed
    severity,      // "critical" | "warning" | "info"
  }) {
    super(message);
    this.code = code;
    this.traceId = traceId;
    this.context = { userId, input, upstream, severity };
  }
}
```

### Pillar 2: Critical Log Collection

> Log what matters for diagnosis. Do not log everything — log the right things.

#### What to Log (The Minimum Set)

| Category | What to Log | Why |
|---|---|---|
| **User actions** | `{traceId, userId, action, target, timestamp}` | Reproduce user's path to the error |
| **State transitions** | `{traceId, entity, from, to, trigger}` | Understand what changed and why |
| **External calls** | `{traceId, service, method, status, latencyMs}` | Identify slow or failing dependencies |
| **Errors** | `{traceId, error, stack, input, userId}` | Diagnose the root cause |
| **Business events** | `{traceId, event, amount, plan, userId}` | Track revenue-critical flows |

#### What NOT to Log

- Raw request/response bodies (PII risk, storage cost).
- Successful health checks (noise).
- Every database query (use slow query log instead).
- Debug-level logs in production (toggle with env var).

#### Log Levels for AI-Native Projects

```
CRITICAL → Sentry alert + page founder         (payment failed, data loss)
ERROR    → Sentry alert + investigate today     (API error, auth failure)
WARN     → Review in weekly dashboard           (rate limit approached, slow query)
INFO     → Business events only                 (signup, purchase, upgrade)
DEBUG    → Off in production, on in staging     (request details, state dumps)
```

#### Agent-Friendly Log Format

Logs should be machine-parseable so agents can diagnose issues:

```json
{
  "timestamp": "2026-05-28T10:15:30.123Z",
  "level": "ERROR",
  "traceId": "abc-123-def",
  "service": "payment-service",
  "message": "Stripe charge failed",
  "error": {
    "code": "card_declined",
    "type": "StripeCardError",
    "decline_code": "insufficient_funds"
  },
  "context": {
    "userId": "user_456",
    "amount": 2900,
    "currency": "usd",
    "planId": "pro_monthly"
  }
}
```

### Pillar 3: Architecture Boundaries & Contracts

> Constrain the solution space. More constraints = fewer hallucinated implementations.

This is the most critical harness engineering pillar. Instead of telling the agent "write good code," you **mechanically enforce what good code looks like**.

#### Dependency Layering

Define which modules can import from which. This is not a suggestion — it is enforced by CI.

```
Types → Config → Repository → Service → Runtime → UI

Each layer can only import from layers to its left.
```

**Example enforcement** (structural test):

```typescript
// architecture.test.ts
import { glob } from 'glob';
import { readFileSync } from 'fs';

const LAYER_ORDER = ['types', 'config', 'repo', 'service', 'runtime', 'ui'];

function getLayer(filePath) {
  for (const layer of LAYER_ORDER) {
    if (filePath.includes(`/src/${layer}/`)) return layer;
  }
  return null;
}

test('no upward dependency violations', () => {
  const files = glob.sync('src/**/*.ts');
  const violations = [];

  for (const file of files) {
    const fileLayer = getLayer(file);
    if (!fileLayer) continue;

    const content = readFileSync(file, 'utf-8');
    const imports = content.match(/from ['"]\.\.?\/.+['"]/g) || [];

    for (const imp of imports) {
      const importLayer = getLayer(imp);
      if (!importLayer) continue;

      if (LAYER_ORDER.indexOf(importLayer) > LAYER_ORDER.indexOf(fileLayer)) {
        violations.push(`${file}: imports ${imp} (${fileLayer} → ${importLayer})`);
      }
    }
  }

  expect(violations).toEqual([]);
});
```

#### API Contracts

Every API endpoint must have a typed contract before implementation. The agent implements against the contract, not a vague description.

```typescript
// contracts/payment.ts — this is the spec
interface CreateChargeRequest {
  userId: string;
  planId: 'starter' | 'pro' | 'enterprise';
  paymentMethodId: string;
}

interface CreateChargeResponse {
  chargeId: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  currency: string;
}

// The agent must implement a function matching this signature:
type CreateCharge = (req: CreateChargeRequest) => Promise<CreateChargeResponse>;
```

**Agent instruction**:

```markdown
## Contract Rule
Before implementing any API endpoint, a typed contract must exist in contracts/.
The implementation must match the contract exactly.
If the contract needs changing, update the contract first, get approval, then implement.
```

#### Module Boundary Documentation

Each module gets a one-file boundary spec:

```markdown
<!-- src/payment/BOUNDARY.md -->
## Payment Module

### Owns
- Stripe integration
- Subscription lifecycle (create, upgrade, cancel, pause)
- Invoice generation
- Webhook processing

### Does NOT Own
- User authentication (→ auth module)
- Email sending (→ notification module)
- Usage metering (→ analytics module)

### Exposes
- createSubscription(userId, planId)
- cancelSubscription(subscriptionId)
- getInvoices(userId)

### Depends On
- auth: getCurrentUser()
- config: getStripeKey()

### Does NOT Import
- ui/*
- runtime/*
```

### Pillar 4: Feature Completeness Checklist

> AI agents declare "done" when the happy path works. Real completeness requires a checklist.

Every feature, before it can be merged, must pass this checklist:

#### The Definition of Done

```markdown
## Feature Completeness Checklist

### Functional
- [ ] Happy path works end-to-end
- [ ] Error states are handled and shown to the user
- [ ] Loading states exist for async operations
- [ ] Empty states exist (no data, first-time user)
- [ ] Edge cases: empty input, max length, special characters, concurrent access

### Observability
- [ ] All interactive elements have data-testid attributes
- [ ] TraceId is propagated through the full request chain
- [ ] Critical business events are logged (INFO level)
- [ ] Errors include structured context (code, traceId, input)
- [ ] Sentry captures unhandled exceptions

### Testing
- [ ] Unit tests for business logic (>80% coverage on new code)
- [ ] Integration tests for API endpoints
- [ ] E2E test for the critical user path
- [ ] Tests run in CI and block merge on failure

### Security
- [ ] Input validation on both client and server
- [ ] Authentication checked on all protected routes
- [ ] Authorization checked (user can only access own data)
- [ ] No secrets in client-side code
- [ ] CSRF protection on state-changing endpoints

### Performance
- [ ] No N+1 queries
- [ ] Images are optimized and lazy-loaded
- [ ] API response time < 500ms for p95
- [ ] Bundle size impact checked

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader labels on interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Focus management on route changes
```

**Agent instruction**: Add to AGENTS.md:

```markdown
## Definition of Done
Before declaring any feature complete, verify every item in the
Feature Completeness Checklist (see ai-native-stability.md Pillar 4).
Do not mark a task as done if any checklist item is unchecked.
```

### Pillar 5: Mutual Audit Until Consensus

> One agent writes. Another agent reviews. They iterate until both agree the code is correct.

This is the most powerful pattern from Anthropic's harness engineering: **use agents to verify agents**.

#### The Audit Loop

```
┌────────────┐     code      ┌────────────┐
│ Implement  │ ────────────→ │   Review    │
│   Agent    │               │   Agent     │
│            │ ←──────────── │             │
└────────────┘   feedback    └────────────┘
       │                           │
       └─── iterate until ─────────┘
              both approve
                   │
            ┌──────┴──────┐
            │ Human Final │
            │   Review    │
            └─────────────┘
```

#### Implementation with Claude Code / Codex

**Step 1: Implement agent writes code**

```
Implement the payment webhook handler according to contracts/payment.ts.
Follow the Feature Completeness Checklist.
```

**Step 2: Review agent audits the implementation**

```
Review the payment webhook handler implementation.
Check against:
1. Does it match the contract in contracts/payment.ts exactly?
2. Does it handle all error cases (invalid signature, duplicate event, missing fields)?
3. Are all interactive elements tagged with data-testid?
4. Is traceId propagated through the full chain?
5. Are there unit and integration tests?
6. Does it pass the Feature Completeness Checklist?
List every issue found. Do not approve until all issues are resolved.
```

**Step 3: Iterate until consensus**

The implement agent fixes issues. The review agent re-checks. This loop continues until the review agent finds zero issues.

**Step 4: Human final review**

The founder reviews the final diff. At this point, the code has been through at least 2 rounds of agent review, so the human review focuses on:

- Does this match the product intent?
- Is the UX correct?
- Are there business logic errors an agent would not catch?

#### Three Types of Agent Auditors

| Auditor | What It Checks | When It Runs |
|---|---|---|
| **Correctness auditor** | Logic, edge cases, error handling | Every PR |
| **Architecture auditor** | Dependency violations, contract compliance, boundary checks | Every PR |
| **Entropy auditor** | Dead code, naming drift, doc-code mismatch, pattern deviation | Weekly scheduled |

The entropy auditor is the most underappreciated. Over time, AI-generated codebases accumulate drift — documentation diverges from code, naming conventions diverge, dead code accumulates. A weekly cleanup agent catches this before it compounds.

### Pillar 6: Evaluation Harness (Evals)

> What you cannot measure, you cannot improve. Build evals before you need them.

From Anthropic's eval framework, adapted for indie hackers:

#### Eval Types for Solo Developers

| Eval Type | What It Tests | Example |
|---|---|---|
| **Regression eval** | Did a change break existing behavior? | "User can still complete checkout after payment refactor" |
| **Capability eval** | Can the product do what it claims? | "AI summarization produces accurate 3-sentence summaries" |
| **Correctness eval** | Is the output factually/logically correct? | "Price calculation matches expected amount for all plan types" |
| **Safety eval** | Does the product avoid harmful behavior? | "User input is sanitized before database queries" |

#### Eval Structure

```typescript
// evals/checkout-flow.eval.ts
const checkoutEval = {
  name: 'checkout-happy-path',
  description: 'User can complete a purchase end-to-end',

  setup: async () => {
    // Create test user, seed products
  },

  steps: [
    { action: 'navigate', target: '/pricing' },
    { action: 'click', target: '[data-testid="pricing-pro-select"]' },
    { action: 'fill', target: '[data-testid="checkout-email"]', value: 'test@test.com' },
    { action: 'fill', target: '[data-testid="checkout-card"]', value: '4242424242424242' },
    { action: 'click', target: '[data-testid="checkout-submit-button"]' },
  ],

  graders: [
    {
      type: 'code',
      check: async (result) => {
        // Verify subscription created in database
        const sub = await db.subscriptions.findByEmail('test@test.com');
        return sub !== null && sub.plan === 'pro';
      },
    },
    {
      type: 'code',
      check: async (result) => {
        // Verify confirmation page shown
        return result.currentUrl.includes('/checkout/success');
      },
    },
  ],

  teardown: async () => {
    // Clean up test data
  },
};
```

#### Grader Types (From Anthropic)

| Grader | Speed | Cost | Best For |
|---|---|---|---|
| **Code-based** | Fast | Free | Binary checks: does X exist, is status 200, is amount correct |
| **Model-based** | Medium | $0.01-0.10/eval | Subjective quality: is the summary good, is the UI reasonable |
| **Human** | Slow | Expensive | Gold standard: calibrate model graders, spot-check weekly |

**Indie hacker priority**: Start with code-based graders for all critical paths. Add model-based graders only for AI-powered features (summarization, generation, etc.).

## Putting It All Together: The Stability Stack

```
┌─────────────────────────────────────────────┐
│ 6. Eval Harness                             │ ← Does the product work?
│    Regression + capability + correctness     │
├─────────────────────────────────────────────┤
│ 5. Mutual Audit                             │ ← Is the code correct?
│    Implement agent ↔ Review agent → Human   │
├─────────────────────────────────────────────┤
│ 4. Completeness Checklist                   │ ← Is the feature done?
│    Functional + observability + tests + a11y │
├─────────────────────────────────────────────┤
│ 3. Architecture Boundaries                  │ ← Is the code in the right place?
│    Dependency layers + contracts + BOUNDARY  │
├─────────────────────────────────────────────┤
│ 2. Critical Logs                            │ ← Can we diagnose issues?
│    Structured JSON + log levels + rotation   │
├─────────────────────────────────────────────┤
│ 1. Full-Stack Observability                 │ ← Can we see what happened?
│    test-id + traceId + structured errors     │
└─────────────────────────────────────────────┘
```

## AGENTS.md Stability Rules Template

Add these rules to your project's AGENTS.md to make agents follow this stability framework automatically:

```markdown
## Stability Rules

### Observability
- Every interactive UI element MUST have a data-testid following {page}-{component}-{action}.
- Every HTTP request MUST propagate x-trace-id header. Generate one if not present.
- Every error MUST include: error code, traceId, user context, and input that caused it.
- Business events (signup, purchase, upgrade, cancel) MUST be logged at INFO level.

### Architecture
- Dependency direction: types → config → repo → service → runtime → ui. No reverse imports.
- Every API endpoint MUST have a typed contract in contracts/ before implementation.
- Every module MUST have a BOUNDARY.md listing what it owns, exposes, and depends on.
- Do not import across module boundaries except through the exposed interface.

### Completeness
- Before marking any task done, verify the Feature Completeness Checklist.
- Every feature must handle: happy path, error state, loading state, empty state, edge cases.
- Every feature must have: unit tests, integration test for API, data-testid on all elements.

### Review
- After implementing, request a review from a separate agent instance.
- The review agent checks: contract compliance, error handling, test coverage, testid presence.
- Iterate until the review agent reports zero issues.
- Human reviews the final diff for product intent and business logic.

### Entropy
- Weekly: run architecture violation scan, dead code detection, doc-code sync check.
- Fix all violations before starting new features.
```

## Minimum Viable Stability (Day 1)

If you can only do three things, do these:

1. **data-testid on everything** + **traceId on every request** — 2 hours to set up, saves days of debugging.
2. **Sentry** — free tier, 10 minutes to install, catches every unhandled error.
3. **CI that runs tests and blocks merge** — 5 minutes with GitHub Actions, prevents every broken deploy.

Everything else in this guide is important, but these three give you 80% of the stability value with 20% of the effort.
