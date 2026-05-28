# Cross-Project Service Reuse

When you run multiple projects in parallel, common services (auth, payment, email, file storage, AI inference) get rebuilt from scratch every time because the agent has no memory of what already exists. This guide solves that with an **agent-readable service registry**.

## The Problem

```
Project A: builds auth service, deploys to api.projecta.com
Project B: builds auth service again from scratch
Project C: builds auth service again from scratch
Agent: has no idea Project A already solved this
```

Every new project reinvents the same infrastructure because:

1. The agent has no cross-project memory.
2. There is no standard way to describe "what does this project provide."
3. Even if the developer remembers, explaining it to the agent every time is tedious and error-prone.

## The Solution: SERVICE.md + Service Registry

### Step 1: Every Project Gets a SERVICE.md

When a project exposes reusable services, document them in a `SERVICE.md` at the project root. This file is the **contract** between the project and any consumer (human or agent).

```markdown
<!-- PROJECT_ROOT/SERVICE.md -->
---
project: beauty-log
status: production
base_url: https://api.beautylog.app
environments:
  production: https://api.beautylog.app
  staging: https://staging-api.beautylog.app
  local: http://localhost:3000
auth: Bearer token via /auth/token endpoint
---

# Beauty Log — Reusable Services

## Services Provided

### 1. Image Analysis API

- **Endpoint**: `POST /api/v1/analyze-image`
- **What it does**: Accepts a face photo, returns skin analysis (type, concerns, scores).
- **Auth**: Bearer token required.
- **Rate limit**: 100 req/min per token.
- **Cost**: ~$0.02 per call (OpenAI Vision API underneath).

Request:
​```json
{
  "image_url": "https://...",
  "analysis_type": "skin"  // "skin" | "color" | "full"
}
​```

Response:
​```json
{
  "skin_type": "combination",
  "concerns": ["dehydration", "uneven_tone"],
  "scores": { "hydration": 45, "evenness": 62, "clarity": 78 },
  "recommendations": ["...", "..."]
}
​```

### 2. User Auth Service

- **Endpoint**: `POST /auth/token`, `POST /auth/register`, `GET /auth/me`
- **What it does**: JWT-based auth with email/password and OAuth (Google, Apple).
- **Can be reused by**: Any project that needs user accounts. Create a separate tenant per project.
- **How to create a tenant**: `POST /auth/tenants` with admin token.

### 3. Stripe Payment Wrapper

- **Endpoint**: `POST /api/v1/checkout`, `POST /api/v1/webhooks/stripe`
- **What it does**: Wraps Stripe checkout, subscription management, and webhook processing.
- **Supports**: One-time, subscription, usage-based pricing.
- **How to reuse**: Configure via `STRIPE_KEY` and `WEBHOOK_SECRET` env vars per tenant.

## Not Reusable (Project-Specific)

- Product recommendation engine (Beauty Log specific training data)
- Content management (blog posts, skincare routines)
- Mobile push notifications (Beauty Log app only)

## How to Integrate

1. Request a tenant: contact the project owner or `POST /auth/tenants`.
2. Get your API key from the tenant dashboard.
3. Set `BEAUTYLOG_API_KEY` and `BEAUTYLOG_API_URL` in your project's env.
4. Use the SDK: `npm install @beautylog/sdk` (or call REST directly).

## Deployment

- **Hosting**: Vercel (API) + Supabase (DB) + Cloudflare R2 (images)
- **Region**: US-East (Vercel) / Singapore (Supabase)
- **Uptime**: 99.9% (Vercel SLA)
- **Repo**: github.com/yourname/beauty-log
```

### Step 2: Create a Cross-Project Service Registry

Maintain a central registry file that lists all your services across all projects. This file lives in a shared location that all agents can access.

**Option A: Shared directory (recommended for solo dev)**

```
~/.service-registry/
├── REGISTRY.md          ← index of all services
├── beauty-log.md        ← symlink or copy of SERVICE.md
├── shared-auth.md
├── payment-gateway.md
└── ai-inference.md
```

**Option B: Dedicated repo**

```
github.com/yourname/service-registry/
├── REGISTRY.md
├── services/
│   ├── beauty-log.md
│   ├── shared-auth.md
│   └── payment-gateway.md
```

### REGISTRY.md Format

```markdown
# Service Registry

Last updated: 2026-05-28

## Active Services

| Service | Project | Base URL | Status | Reusable By |
|---|---|---|---|---|
| Image Analysis API | beauty-log | api.beautylog.app | Production | Any project needing image analysis |
| User Auth (multi-tenant) | shared-auth | auth.yourdomain.com | Production | All projects |
| Stripe Payment Wrapper | shared-auth | auth.yourdomain.com/payments | Production | All projects |
| AI Inference Gateway | ai-gateway | ai.yourdomain.com | Production | All projects needing LLM calls |
| Email Service (Resend) | shared-infra | via SDK | Production | All projects |
| File Storage (R2) | shared-infra | via SDK | Production | All projects |

## Service Details

- [beauty-log.md](services/beauty-log.md) — Image analysis, skin scoring
- [shared-auth.md](services/shared-auth.md) — Auth, payments, tenancy
- [ai-gateway.md](services/ai-gateway.md) — LLM routing, caching, rate limiting
- [shared-infra.md](services/shared-infra.md) — Email, storage, CDN

## Retired Services

| Service | Retired Date | Reason | Replacement |
|---|---|---|---|
| Self-hosted Postgres | 2026-03 | Migrated to Supabase | Supabase managed DB |
```

### Step 3: Agent Instructions for Cross-Project Reuse

Add this to your global AGENTS.md or agent memory:

```markdown
## Cross-Project Service Registry

Before implementing any of the following capabilities, check the service registry
at ~/.service-registry/REGISTRY.md (or the service-registry repo) first:

- User authentication / authorization
- Payment processing (Stripe, LemonSqueezy)
- Email sending
- File storage / image upload
- AI/LLM inference
- Analytics event tracking
- Push notifications

If a service already exists:
1. Read its SERVICE.md for the API contract.
2. Use the existing service instead of building a new one.
3. Request a new tenant if multi-tenancy is supported.
4. Only build a new service if the existing one genuinely does not fit.

When building a new service that might be reusable:
1. Design the API as multi-tenant from day one.
2. Write a SERVICE.md documenting endpoints, auth, rate limits, and integration steps.
3. Register it in ~/.service-registry/REGISTRY.md.
```

## Common Reusable Service Patterns for Indie Hackers

### Tier 1: Build Once, Use Everywhere

These services are worth extracting on your **second** project (not the first — avoid premature abstraction).

| Service | What It Does | Multi-Tenant? | Typical Stack |
|---|---|---|---|
| **Auth Gateway** | Registration, login, JWT, OAuth, tenancy | Yes | Supabase Auth / better-auth + Postgres |
| **Payment Gateway** | Stripe/LemonSqueezy checkout, subscriptions, webhooks | Yes | Node.js wrapper around Stripe API |
| **Email Service** | Transactional + marketing emails via single API | Yes | Resend / Postmark SDK wrapper |
| **File Storage** | Upload, transform, serve images/files | Yes | Cloudflare R2 + Sharp for transforms |
| **AI Inference Gateway** | Route LLM calls, cache responses, track usage/cost | Yes | Node.js proxy to OpenAI/Anthropic/local |

### Tier 2: Extract When Pattern Repeats

These become worth extracting on the **third** or fourth project.

| Service | What It Does |
|---|---|
| **Analytics Collector** | Unified event collection → GA4 + Baidu + custom |
| **Feature Flag Service** | Toggle features per tenant/user without redeploy |
| **Notification Hub** | Push, email, in-app notifications via single API |
| **Admin Dashboard** | Shared admin UI for user management, metrics, config |
| **Landing Page Builder** | Reusable landing page components with A/B testing |

### Tier 3: Keep Project-Specific

Do NOT extract these — they change too much between projects:

- Product-specific business logic
- Custom recommendation engines
- Project-specific onboarding flows
- Content/CMS schemas
- Project-specific analytics dashboards

## SERVICE.md Template

```markdown
---
project: {project-name}
status: production | staging | development | retired
base_url: https://api.example.com
environments:
  production: https://api.example.com
  staging: https://staging.api.example.com
  local: http://localhost:{port}
auth: {auth method description}
repo: github.com/yourname/{repo}
---

# {Project Name} — Reusable Services

## Services Provided

### 1. {Service Name}

- **Endpoint**: `{METHOD} {path}`
- **What it does**: {one sentence}
- **Auth**: {auth requirement}
- **Rate limit**: {limit}
- **Cost per call**: {cost if applicable}

Request:
​```json
{example request body}
​```

Response:
​```json
{example response body}
​```

### 2. {Next Service}
...

## Not Reusable (Project-Specific)

- {list of project-specific features that should NOT be reused}

## How to Integrate

1. {step-by-step integration guide}
2. {env vars to set}
3. {SDK install command if applicable}

## Deployment

- **Hosting**: {where}
- **Database**: {what}
- **Region**: {where}
- **Repo**: {link}
```

## Agent Memory Integration

For agents that support persistent memory (Claude Code with memory, Codex with context), store service knowledge in the agent's memory system:

```markdown
<!-- ~/.aone_copilot/memories/service-registry.md -->
---
name: cross-project-service-registry
description: Registry of reusable services across all my projects. Check before building auth, payments, email, storage, or AI inference.
type: reference
createdAt: 2026-05-28T17:45:00
---

Active reusable services:
- Auth Gateway: auth.yourdomain.com (multi-tenant, JWT + OAuth)
- Payment Gateway: auth.yourdomain.com/payments (Stripe wrapper, multi-tenant)
- AI Inference: ai.yourdomain.com (OpenAI/Anthropic routing + caching)
- Email: via @yourname/email-sdk (Resend wrapper)
- Storage: via @yourname/storage-sdk (Cloudflare R2)

Full details: ~/.service-registry/REGISTRY.md
Each service has a SERVICE.md with API contracts.
```

This way, when you start a new project and say *"build me a SaaS with user auth and Stripe payments"*, the agent will check its memory, find existing services, and integrate them instead of rebuilding from scratch.

## Workflow: Starting a New Project With Existing Services

```
1. /grill-with-docs → understand requirements
2. Agent checks ~/.service-registry/REGISTRY.md
3. Agent identifies which existing services fit
4. Agent proposes: "Auth and payments are already available at auth.yourdomain.com.
   I'll create a new tenant and integrate. Only the product-specific logic needs building."
5. You approve → agent integrates existing services + builds only the new parts
6. If new reusable services emerge, agent writes SERVICE.md and updates REGISTRY.md
```

**Time saved**: On a typical project, auth + payments + email + storage = 2-3 weeks of work. With registry: 2-3 hours of integration.
