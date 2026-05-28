---
name: business-model-design
description: Use when a founder needs to choose a business model, design pricing, plan revenue progression, or decide between subscription/one-time/service/freemium based on product type, user segment, and market evidence. Derived from 499 Indie Hackers case patterns.
---

# Business Model Design

Use this skill after idea validation passes. The goal is to match the product positioning to the right business model, pricing structure, and revenue progression path — not to guess, but to use evidence from 499 founder cases.

## Core Principle

> Business models are not chosen arbitrarily; they are determined by product positioning. Product positioning = whose pain + how frequent + how willing to pay.

## Step 1: Classify Product Positioning

Answer these four questions to determine product positioning type:

| Question | Options | Implications |
|---|---|---|
| **用户是谁？** | B2B / B2C / Prosumer / Developer | 决定客单价和获客方式 |
| **解决的是多频繁的问题？** | 每天 / 每周 / 每月 / 偶尔 | 决定订阅 vs 一次性 |
| **用户当前替代方案是什么？** | 手动做 / 用竞品 / 不做 / 找人做 | 决定定价锚点 |
| **交付物是什么？** | 工具 / 内容 / 服务 / 数据 / 模板 | 决定商业模式 |

## Step 2: Match Business Model

基于 499 个案例的统计分布，按产品定位推荐商业模式：

### Model A: SaaS Subscription (479/499 cases, 96%)

**Suitable for**: Tool-based products that users need to use continuously.

| Signal | Evidence |
|---|---|
| Usage frequency | Daily or weekly |
| Alternative solution | Users currently do it manually, or use free tools with insufficient features |
| Deliverable | Continuously running tool / dashboard / automation |
| Typical price point | $9-49/mo (B2C/Prosumer), $49-299/mo (B2B), $299+/mo (Enterprise) |

**Pricing tiers**:

```
Free trial (7-14 days, not freemium)
    ↓
Starter: $9-19/mo — Individual users, core features
    ↓
Pro: $29-49/mo — Advanced features, more usage
    ↓
Team/Business: $99-299/mo — Multi-user collaboration, priority support
    ↓
Enterprise: Custom quote — Customization, SLA, dedicated deployment
```

**Case evidence**: 93% of successful indie hackers use subscription model. The core advantage of subscription is **predictable MRR**, allowing founders to plan rather than rely on one-time spikes.

**Key rules**:
- Don't start with freemium unless the product has clear network effects or viral propagation mechanisms (only 22% of cases use freemium).
- Free trial > freemium. Trials create time pressure that drives conversion; freemium easily breeds users who never pay.
- Price at 1/3 to 1/2 of the user's alternative solution cost. If users currently spend $100/month hiring someone, price at $29-49/month.

### Model B: Productized Service (151/499 cases, 30%)

**Suitable for**: Starting with a service and gradually productizing it. This is the safest way for indie hackers to start.

| Signal | Evidence |
|---|---|
| Usage frequency | Weekly to monthly |
| Alternative solution | Users currently hire people or find freelancers |
| Deliverable | Standardized service outcomes |
| Typical price point | $200-2000/time or $500-5000/month |

**Evolution path**:

```
Phase 1: Pure manual service
  ↓  Charge to validate demand, accumulate delivery experience
  ↓  Find the most repeatable parts
Phase 2: Semi-automated
  ↓  Use tools to replace 50% of manual work
  ↓  Service price stays the same, profit margin improves
Phase 3: Fully automated SaaS
  ↓  Customers self-serve, monthly subscription
  ↓  Keep high-end services as premium tier
```

**Case evidence**: 72% of successful cases started with manual service. The $1.7M/yr consulting company productized a 2-week service.

**Key rules**:
- Collect service fees before writing code. If no one is willing to pay for manual service, the automated version won't sell either.
- It's normal for service pricing to be higher than SaaS—you're selling time and expertise.
- Keep the "Done for you" option as the highest-priced tier, even after the product is automated.

### Model C: Content/Course/Templates (242+85 cases, 49%+17%)

**Suitable for**: Knowledge-based products where the founder has domain expertise.

| Signal | Evidence |
|---|---|
| Usage frequency | One-time learning + occasional review |
| Alternative solution | Free blogs/YouTube/documentation |
| Deliverable | Course / eBook / templates / community |
| Typical price point | $29-199 one-time, or $9-29/mo community subscription |

**Pricing models**:

```
Option A: One-time paid course
  $29-99 introductory course → $199-499 advanced course → $999+ coaching package

Option B: Template/resource pack
  $19-49 single template → $99-199 full bundle → ongoing update subscription

Option C: Paid community
  $9-29/mo community membership → includes courses + templates + community + live sessions
```

**Key rules**:
- One-time payment products require continuous customer acquisition without the security of MRR. Prioritize the **course + community subscription** combination.
- Templates are the fastest product to monetize—short development cycle, zero marginal cost.
- Don't compete with free content on features; compete on **structure + time-saving + community belonging**.

### Model D: Marketplace / Platform (69 cases, 14%)

**Suitable for**: Products that connect supply and demand. Highest risk, highest reward.

| Signal | Evidence |
|---|---|
| Usage frequency | Depends on category |
| Alternative solution | Users transact on other platforms or offline |
| Deliverable | Transaction matching + trust assurance |
| Typical commission | 5-20% transaction fee |

**Key rules**:
- Only 14% of cases follow the marketplace path because cold starts are extremely difficult.
- First build a **tool for one side**, then expand into a platform. For example, start with "management tools for sellers," accumulate sellers before introducing buyers.
- Don't try to build a general-purpose platform; start with **vertical category** matching.

### Model E: Developer Tool / API (438 cases, 88%)

**Suitable for**: Tools, SDKs, and API services for developers.

| Signal | Evidence |
|---|---|
| Usage frequency | Continuous use after integration |
| Alternative solution | Write it yourself, use open-source alternatives |
| Deliverable | API / SDK / CLI / SaaS tool |
| Typical pricing | Free tier + Usage-based + Team plan |

**Pricing model**:

```
Free: Limited quota (attracts developers to try)
    ↓
Pro: $29-99/mo or usage-based — Production environment use
    ↓
Team: $99-299/mo — Multi-user collaboration + higher quotas
    ↓
Enterprise: Custom — SLA + private deployment + priority support
```

**Key rules**:
- Developer tools almost always require a free tier (but not unlimited free).
- Usage-based pricing is the most acceptable model for developers—pay for what you use.
- Documentation is part of the product. Poor documentation = poor product.

## Step 3: Revenue Progression Path

Regardless of the model chosen, indie hacker revenue growth typically follows this progression:

```
$0 → $1 MRR        Validation phase (1-4 weeks)
  Method: Manual service / pre-sale / consulting
  Goal: Find 1 paying user
  
$1 → $1K MRR       Seed phase (1-3 months)
  Method: Product launch + content acquisition + community engagement
  Goal: Find 10-30 paying users
  Key: Confirm users are renewing, not just trying out
  
$1K → $10K MRR     Growth phase (3-12 months)
  Method: SEO + content + word-of-mouth + one main channel
  Goal: Find repeatable acquisition channels
  Key: CAC < LTV/3, retention > 85%/month
  
$10K → $50K MRR    Scale phase (6-24 months)
  Method: Expand channels + raise prices + enterprise customers + partnerships
  Goal: Build a predictable growth engine
  Key: Shift from founder-driven to system-driven
```

### Revenue Milestones Decision

| MRR | Decision |
|---|---|
| $0 for 4 consecutive weeks | Return to validation phase, check if demand is real |
| < $500 for 3 consecutive months | Review pricing—is it too low or is product value insufficient |
| $1K-3K growth stagnation | Growth bottleneck is usually in acquisition channels, not product features |
| $5K+ but retention < 80% | Product value isn't sustained; fixing product is more important than expanding channels |
| $10K+ retention > 90% | Consider going full-time |

## Step 4: Pricing Design Checklist

| Rule | Evidence |
|---|---|
| **Prices must be clearly displayed** | 96% of cases have clear pricing (478/499) |
| **Default to subscription** | 93% of cases use subscription (464/499) |
| **Don't price too low** | Too-low prices attract low-quality users and can't cover acquisition costs |
| **Annual discount** | Offer annual = monthly × 10 (save 2 months), improves cash flow |
| **Price increases with value** | Raise prices at least once in the first year; lock early users into old prices |
| **Enterprise is separate** | Don't put Enterprise on the pricing page; use "Contact us" to charge higher prices |
| **Start high, then go low** | Start with high-priced services, validate, then drop to SaaS pricing |

## Step 5: Anti-Patterns

Failure patterns summarized from cases:

| Anti-Pattern | Why It Fails | Better Move |
|---|---|---|
| All free + figure out pricing later | Free users don't automatically become paying users | Charge from day one, even if it's little |
| Freemium with no limits | Free version is too good, no one upgrades | Free version has clear limitations |
| Only one-time payments | No MRR, need to continuously find new customers | Add subscription or ongoing service |
| Price based on cost | Users don't care about your costs | Price based on the value users receive |
| Imitate big company pricing | Big companies have brand, traffic, sales teams | Price according to indie hacker acquisition capabilities |
| Build platform from Day 1 | Cold start requires both sides to have people | First build a tool for one side |
| Never raise prices | Low prices limit growth ceiling | Regularly raise prices, lock in old users |

## Conditional Rules

- If **user pain is daily and tool-shaped** → SaaS subscription, start at $19-49/mo.
- If **founder has domain expertise but no product** → productized service first, automate later.
- If **product is knowledge/framework** → course + community subscription combo.
- If **users are developers** → free tier + usage-based pricing.
- If **market is B2B** → start pricing 3-5x higher than instinct suggests.
- If **market is B2C** → keep price low ($5-19/mo) but focus on volume and retention.
- If **no one pays in 4 weeks** → the problem is positioning or demand, not features.
- If **users pay but churn fast** → the product delivers initial value but not ongoing value; add retention hooks.
- If **users love the product but won't pay** → reposition from "nice to have" to "must have", or find a different buyer.

## Integration With Other Skills

1. Use `idea-validation` to confirm demand before choosing a model.
2. Use `founder-case-patterns` to find comparable cases and their pricing/channel/model.
3. Use `product-development-loop` to scope the MVP after model is chosen.
4. Use `seo-aso-growth-research` to validate the acquisition channel implied by the model.
5. Use this skill's revenue progression path during `weekly-review-dashboard` to set MRR targets.

## Standardized Artifact Output

After completing business model design, write a structured JSON report to:

```
product/app/.playbook-output/{projectId}/business-model/report.json
```

The JSON must conform to this schema:

```json
{
  "stage": "business-model",
  "score": 55,
  "decision": "pivot",
  "reasoning": "One sentence summarizing model viability.",
  "evidence": ["Positive signal 1", "Positive signal 2"],
  "concerns": ["Risk factor 1", "Risk factor 2"],
  "analysis": {
    "model": "Chosen model type and rationale (SaaS/service/course/marketplace/devtool).",
    "pricing": "Pricing tiers, anchor point, and competitive positioning.",
    "revenue": "MRR projection at 1K/5K/20K user milestones.",
    "cac": "Estimated CAC by channel, LTV calculation, LTV/CAC ratio."
  },
  "suggestedNextSteps": ["Action 1", "Action 2", "Action 3"],
  "generatedAt": "2026-05-28T21:00:00Z"
}
```

Scoring: 60-100 = continue, 35-59 = pivot, 0-34 = kill.

The `{projectId}` is provided by the caller.

## Evidence Base

- 499 Indie Hackers cases analyzed.
- 498 readable, 1 failed (historical 404).
- Top business model: SaaS (479).
- Top pricing: subscription (464).
- Top validation: community-pain (418) + manual-service (357).
- Top acquisition: content (394) + community (252) + SEO (235).
- Confidence: strong for SaaS/subscription/content patterns; moderate for marketplace/ecommerce (smaller sample).
