# AI-Native Product Development

How to build products as a solo developer using AI agents as your team. This is not about "using Copilot for autocomplete" — it is about an end-to-end methodology where AI handles implementation while the founder focuses on product decisions.

## The Shift: From Writing Code to Directing Agents

Traditional solo dev: founder writes every line of code.
AI-native solo dev: founder makes product decisions, AI agents execute.

```
Founder's job:
  - What to build (product sense)
  - Why to build it (evidence from validation)
  - How it should feel (design taste)
  - Whether to ship it (quality bar)

AI agent's job:
  - Write the code
  - Write the tests
  - Follow the design system
  - Handle infrastructure
```

The founder becomes a **product director**, not a code writer. This changes which skills matter most.

## Phase 1: Brainstorming & Specification

### Tool: [Superpowers](https://github.com/obra/superpowers)

An agentic skills framework that enforces a disciplined development workflow. Install it in your coding agent (Claude Code, Codex, Cursor, etc.) and it automatically:

1. **Stops the agent from jumping into code** — forces it to ask what you are really trying to build.
2. **Produces a spec in digestible chunks** — so you actually read and validate the design.
3. **Creates an implementation plan** — detailed enough for a junior engineer to follow.
4. **Uses subagent-driven development** — dispatches fresh agents per task with two-stage review.
5. **Enforces TDD** — RED-GREEN-REFACTOR, no code before tests.

```bash
# Install in Claude Code
/plugin install superpowers@claude-plugins-official

# Install in Codex CLI
/plugins → search "superpowers" → Install

# Install in Cursor
/add-plugin superpowers
```

### Brainstorming Workflow

```
1. Open your coding agent with Superpowers installed
2. Describe the product idea in 2-3 sentences
3. Agent asks clarifying questions (does NOT start coding)
4. Agent produces a design document in sections
5. You review each section, approve or redirect
6. Agent creates an implementation plan with bite-sized tasks
7. You say "go" → agent dispatches subagents per task
```

**Key discipline**: Do not skip the brainstorming phase. The 30 minutes spent on spec saves 3 days of rework.

### Spec Quality Checklist

Before approving the agent's spec, verify:

- [ ] Core user flow is described (input → value → output).
- [ ] Scope is explicitly limited — "Not Now" list exists.
- [ ] Data model is simple enough for MVP.
- [ ] Edge cases are acknowledged, not over-engineered.
- [ ] The spec references validated user pain (from `idea-validation`).

## Phase 2: Design & UI

### Problem: AI generates functional but ugly interfaces

Default AI-generated UI is "slop" — generic, bland, interchangeable. Users judge product quality by visual design within 3 seconds. A tool that works but looks cheap will not convert at premium pricing.

### Solution: DESIGN.md + Taste Skills

Two complementary approaches:

#### Approach A: DESIGN.md (Design System Reference)

[awesome-design-md](https://github.com/voltagent/awesome-design-md) provides 73+ ready-to-use DESIGN.md files extracted from real products (Linear, Vercel, Supabase, Notion, etc.).

```
1. Choose a design reference that matches your product's positioning
2. Copy the DESIGN.md into your project root
3. AI agents read it and generate UI matching that design language
```

**How to choose a DESIGN.md**:

| Product Type | Recommended Reference | Why |
|---|---|---|
| Developer tool | Vercel, Linear, Supabase | Clean, dark, code-first |
| SaaS dashboard | PostHog, Notion, Airtable | Data-dense, functional |
| Consumer product | Framer, Webflow, Cal.com | Friendly, conversion-focused |
| AI tool | Claude, Cursor, VoltAgent | Modern, dark, agent-native |
| Documentation | Mintlify, Resend | Reading-optimized, clean |

#### Approach B: Taste Skill (Anti-Slop Agent Skills)

[taste-skill](https://github.com/Leonxlnx/taste-skill) gives your AI agent design taste — stronger layout, typography, motion, and spacing.

```bash
# Install the default skill
npx skills add https://github.com/Leonxlnx/taste-skill

# Or install a specific variant
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

**Skill variants by product style**:

| Skill | Install Name | Best For |
|---|---|---|
| **taste-skill v2** | `design-taste-frontend` | General default — safest choice |
| **soft-skill** | `high-end-visual-design` | Premium SaaS, calm and expensive feel |
| **minimalist-skill** | `minimalist-ui` | Notion/Linear vibes, editorial UI |
| **brutalist-skill** | `industrial-brutalist-ui` | Bold, experimental, developer-facing |
| **gpt-taste** | `gpt-taste` | Stricter for GPT/Codex agents |
| **redesign-skill** | `redesign-existing-projects` | Improving existing UI |

**Three tuning dials** (taste-skill):
- **DESIGN_VARIANCE** (1-10): Layout experimentation. Low = centered/clean. High = asymmetric/modern.
- **MOTION_INTENSITY** (1-10): Animation depth. Low = hover only. High = scroll/magnetic effects.
- **VISUAL_DENSITY** (1-10): Info per viewport. Low = spacious. High = dense dashboards.

#### Image-First Workflow

For complex designs, generate reference images first, then implement:

```
1. Install imagegen-frontend-web skill
2. Ask ChatGPT Images to generate site reference frames
3. Feed the renders to Codex / Cursor / Claude Code
4. Agent implements the frontend matching the reference
```

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "imagegen-frontend-web"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "image-to-code"
```

### Recommended Design Stack

| Need | Tool | Cost |
|---|---|---|
| Design system reference | DESIGN.md from awesome-design-md | Free |
| Agent design taste | taste-skill | Free |
| Quick mockups | ChatGPT Images / Midjourney | $20/mo |
| UI components | shadcn/ui / Radix / Headless UI | Free |
| Icons | Lucide / Heroicons / Phosphor | Free |
| Fonts | Google Fonts / Inter / Geist | Free |

## Phase 3: Infrastructure & DevOps via CLI

### Principle: Everything Through CLI

For a solo developer, the most efficient ops workflow is **everything through CLI** — no clicking through web consoles, no manual configurations.

### Aliyun CLI (China / Hybrid Infrastructure)

```bash
# Install
brew install aliyun-cli
# or
curl -fsSL https://aliyuncli.alibabacloud.com/aliyun-cli-install.sh | bash

# Configure
aliyun configure

# Common operations
aliyun ecs DescribeInstances                              # List servers
aliyun dns AddDomainRecord --DomainName x.com --RR www    # DNS records
aliyun oss cp local-file oss://bucket/path                # Upload to OSS
aliyun acm CreateCertificate                              # SSL certificates
aliyun cdn AddCdnDomain                                   # CDN setup
```

### Infrastructure-as-CLI Checklist

| Operation | CLI Tool | When |
|---|---|---|
| **Domain registration** | `aliyun domain` / Cloudflare API | Day 1 |
| **DNS configuration** | `aliyun dns` / `cloudflare dns` | Day 1 |
| **SSL certificate** | `aliyun acm` / Let's Encrypt certbot | Day 1 |
| **Object storage** | `aliyun oss` / `aws s3` / `wrangler r2` | When needed |
| **CDN** | `aliyun cdn` / Cloudflare (auto) | After launch |
| **Server provisioning** | `aliyun ecs` / Vercel CLI / Railway CLI | Deployment |
| **Database** | Supabase CLI / PlanetScale CLI | Setup |
| **Monitoring** | Sentry CLI | Pre-launch |
| **Deployment** | `vercel` / `railway` / `fly` | Every deploy |

### Recommended CLI-First Stacks

**For international products**:

```bash
# Vercel (hosting) + Supabase (DB+auth) + Stripe CLI (payments)
npm i -g vercel supabase stripe
vercel login && supabase login && stripe login
```

**For China market products**:

```bash
# Aliyun all-in-one
aliyun configure
aliyun ecs CreateInstance ...    # Server
aliyun oss mb oss://my-bucket   # Storage
aliyun dns AddDomainRecord ...  # DNS
aliyun cdn AddCdnDomain ...     # CDN
```

**For hybrid (global + China)**:

```
International traffic → Vercel / Cloudflare
China traffic → Aliyun ECS + CDN + OSS
DNS split → Cloudflare (international) + Aliyun DNS (China)
```

## Phase 4: Building Stable Products

AI-generated code ships fast but breaks fast. Stability requires deliberate practices.

### The Stability Stack

```
                    ┌─────────────────────┐
                    │   Error Monitoring   │  ← Sentry: know when things break
                    └─────────┬───────────┘
                    ┌─────────┴───────────┐
                    │   Automated Tests    │  ← TDD via Superpowers: catch bugs before deploy
                    └─────────┬───────────┘
                    ┌─────────┴───────────┐
                    │   Type Safety        │  ← TypeScript strict: catch bugs at compile time
                    └─────────┬───────────┘
                    ┌─────────┴───────────┐
                    │   CI/CD Pipeline     │  ← Auto-test on every push
                    └─────────┬───────────┘
                    ┌─────────┴───────────┐
                    │   Preview Deploys    │  ← Test before production
                    └─────────────────────┘
```

### Rule 1: Enforce TDD with Superpowers

Superpowers enforces RED-GREEN-REFACTOR by default. Do not disable it.

```
Write failing test → Watch it fail → Write minimal code → Watch it pass → Commit
```

Why this matters with AI: AI agents write code that looks correct but has subtle bugs. Tests catch them before users do.

### Rule 2: Type Safety is Non-Negotiable

```
MVP prototype → JavaScript is fine
Product that takes payments → TypeScript strict mode
```

AI agents write better TypeScript than JavaScript because types constrain the solution space. More constraints = fewer hallucinated implementations.

### Rule 3: CI/CD From Day One

Minimal pipeline (GitHub Actions):

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

This takes 5 minutes to set up and catches every broken push.

### Rule 4: Error Monitoring Before Launch

```bash
# Install Sentry
npx @sentry/wizard@latest -i nextjs  # or your framework

# Verify in production
sentry-cli send-event -m "test event"
```

You cannot fix what you cannot see. Sentry free tier is enough for MVP.

### Rule 5: Database Migrations, Not Manual Changes

```bash
# Supabase example
supabase migration new add_users_table
# Edit the migration SQL
supabase db push
```

Never modify production database schema by hand. Migrations are reversible; manual changes are not.

### Rule 6: Preview Deploys for Every Change

Vercel and similar platforms create a unique URL for every git push:

```
main branch → production (yourapp.com)
feature branch → preview (feature-xyz.yourapp.vercel.app)
```

Test every change in a real environment before merging to production.

## AI-Native Development Anti-Patterns

| Anti-Pattern | Why It Fails | Better Move |
|---|---|---|
| Let the agent code without a spec | Builds the wrong thing confidently | Use Superpowers brainstorming phase |
| Skip design direction | Generic slop UI | Add DESIGN.md + taste-skill |
| No tests because "AI writes correct code" | AI hallucinates edge cases | Enforce TDD with Superpowers |
| Deploy manually via web console | Slow, error-prone, not repeatable | CLI-first for everything |
| Trust AI's first implementation | AI optimizes for looking done, not being correct | Review every PR, run every test |
| Let AI decide architecture | AI has no product context | Founder decides architecture, AI implements |
| Ignore type errors "because it works" | Works today, breaks tomorrow | TypeScript strict from the start |
| No error monitoring | Silent failures in production | Sentry before launch |

## The AI-Native Solo Dev Workflow (Summary)

```
Monday: Product decisions
├── Review last week's data (weekly-report)
├── Decide what to build this week (one thing)
└── Write a 3-sentence brief

Tuesday-Wednesday: Build with agents
├── Open coding agent with Superpowers
├── Agent brainstorms → spec → plan
├── DESIGN.md + taste-skill for UI direction
├── Agent implements via subagent-driven development
├── TDD enforced automatically
└── Preview deploy for each feature

Thursday: Polish and test
├── Review agent's output manually
├── Fix edge cases agent missed
├── Verify analytics events fire
└── Run full test suite

Friday: Ship and measure
├── Merge to production
├── Announce to one channel (with UTM)
├── Watch analytics for 2 hours
└── Log user feedback verbatim
```

**The key insight**: AI lets you ship in 1 week what used to take 4 weeks. But the time saved should go into **talking to users and validating**, not building more features.
