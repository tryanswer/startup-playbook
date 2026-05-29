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

## Step 6: Unit Economics Model

Unit economics determine whether your business model is sustainable. Calculate these metrics before scaling acquisition.

### CAC (Customer Acquisition Cost)

**Formula**: Total Acquisition Cost ÷ Number of New Customers

| Component | What to Include |
|---|---|
| Ad spend | All paid advertising costs |
| Content creation | Time cost for blog posts, videos, social media |
| Tools & software | CRM, email marketing, analytics tools |
| Salaries | Pro-rated sales/marketing team costs |
| Events & sponsorships | Conference fees, meetup sponsorships |

**Example**: If you spent $2,000 on ads + $500 on content tools + $1,000 pro-rated salary in a month and acquired 50 customers:
- CAC = ($2,000 + $500 + $1,000) ÷ 50 = **$70 per customer**

### LTV (Lifetime Value)

**Formula**: ARPU × Gross Margin × (1 / Churn Rate)

| Variable | Definition |
|---|---|
| ARPU | Average Revenue Per User per month |
| Gross Margin | Revenue minus direct costs (typically 80-95% for SaaS) |
| Churn Rate | Monthly customer churn rate (e.g., 5% = 0.05) |

**Example**: If ARPU = $50, Gross Margin = 90%, Churn Rate = 5%/month:
- LTV = $50 × 0.90 × (1 / 0.05) = $50 × 0.90 × 20 = **$900**

### Health Ratios

| Metric | Healthy Threshold | Warning Zone | Critical |
|---|---|---|---|
| **LTV:CAC Ratio** | > 3:1 | 2:1 - 3:1 | < 2:1 |
| **Payback Period** | < 12 months | 12-18 months | > 18 months |
| **Gross Margin** | > 80% (SaaS) | 60-80% | < 60% |
| **Monthly Churn** | < 5% (B2B), < 8% (B2C) | 5-10% | > 10% |

### Stage-Based Benchmarks

| Stage | Target CAC | Target LTV:CAC | Payback Period | Notes |
|---|---|---|---|---|
| **Validation ($0-$1K MRR)** | <$100 | > 2:1 | < 6 months | Focus on learning, not optimization |
| **Seed ($1K-$10K MRR)** | <$200 | > 3:1 | < 12 months | Start tracking by channel |
| **Growth ($10K-$50K MRR)** | Optimize per channel | > 3:1 | < 12 months | Segment by customer cohort |
| **Scale ($50K+ MRR)** | Channel-specific targets | > 4:1 | < 9 months | Full funnel attribution |

**Key rules**:
- Don't scale acquisition until LTV:CAC > 3:1 is proven with real data (not projections).
- Payback period matters more than LTV for cash flow—can you afford to wait 12 months to recoup CAC?
- Track CAC by channel; some channels may have high CAC but also high LTV (enterprise sales).
- Recalculate unit economics quarterly as pricing, churn, and acquisition costs change.

## Step 7: Retention & Cohort Analysis

Retention is the leading indicator of product-market fit. Track it before optimizing acquisition.

### Cohort Retention Definition

A cohort is a group of users who signed up in the same time period (usually monthly). Track what percentage remain active or paying over time.

| Metric | Definition | Calculation |
|---|---|---|
| **D1 Retention** | Day 1 retention | Users active on Day 1 ÷ Users who signed up |
| **D7 Retention** | Week 1 retention | Users active in Week 1 ÷ Users who signed up |
| **D30 Retention** | Month 1 retention | Users active in Month 1 ÷ Users who signed up |
| **D90 Retention** | Quarter 1 retention | Users active in Month 3 ÷ Users who signed up |

### Healthy Retention Benchmarks by Model

| Business Model | D7 | D30 | D90 | Annual Churn |
|---|---|---|---|---|
| **B2B SaaS** | 60-70% | 50-60% | 40-50% | < 20% |
| **B2C SaaS** | 40-50% | 30-40% | 20-30% | < 40% |
| **Developer Tool** | 50-60% | 40-50% | 30-40% | < 30% |
| **Content/Community** | 30-40% | 20-30% | 15-25% | < 50% |
| **Marketplace** | 50-60% | 40-50% | 35-45% | < 25% |

**Note**: For subscription businesses, focus on **monthly revenue retention** rather than user retention—one enterprise customer leaving hurts more than 10 free users churning.

### Revenue Retention vs User Retention

| Metric | Definition | Why It Matters |
|---|---|---|
| **User Retention** | % of users still active | Indicates product stickiness |
| **Revenue Retention** | % of revenue retained from existing customers | Indicates expansion potential |
| **Net Revenue Retention (NRR)** | (Starting MRR + Expansion - Contraction - Churn) ÷ Starting MRR | > 100% means existing customers are growing faster than churn |

### NRR (Net Revenue Retention)

**Formula**: (Starting MRR + Upgrades - Downgrades - Churn) ÷ Starting MRR × 100%

| NRR Range | Interpretation | Action |
|---|---|---|
| **> 120%** | Excellent—existing customers are expanding rapidly | Double down on upsell/cross-sell |
| **100-120%** | Healthy—expansion offsets churn | Continue current strategy |
| **90-100%** | Warning—churn nearly equals expansion | Investigate churn reasons |
| **< 90%** | Critical—losing revenue from existing base | Fix retention before acquiring new customers |

**B2B Benchmark**: NRR > 100% is the minimum for sustainable growth. Top SaaS companies achieve 110-130%.

**Key rules**:
- Track cohorts monthly; don't aggregate all users into one retention number.
- For B2B, prioritize **revenue retention** over user count—one $500/mo customer > ten $5/mo customers.
- If D30 retention < 30%, fix product value before spending on acquisition.
- NRR > 100% means you can grow even with zero new customers—this is the holy grail.

## Step 8: Competitive Positioning

Understanding your competitive landscape prevents you from building a "me-too" product that competes only on price.

### Competitor Classification

| Type | Definition | Example | Strategic Response |
|---|---|---|---|
| **Direct Competitors** | Same solution, same target user | Notion vs. Obsidian for note-taking | Differentiate on UX, niche features, or pricing |
| **Indirect Competitors** | Different solution, same problem | Calendly vs. manual email scheduling | Highlight convenience, automation, reliability |
| **Alternative Solutions** | Status quo or DIY approach | Excel spreadsheet vs. specialized tool | Emphasize time savings, error reduction, insights |
| **Potential Entrants** | Large companies that could build this | Google, Microsoft, OpenAI | Build moat quickly; focus on underserved niches |

### Moat Types (Defensibility)

| Moat Type | Description | Strength | Time to Build | Examples |
|---|---|---|---|---|
| **Network Effects** | Product becomes more valuable as more users join | Very Strong | 2-5 years | LinkedIn, Slack, marketplaces |
| **Data Moat** | Proprietary data improves product quality over time | Strong | 1-3 years | Grammarly, recommendation engines |
| **Brand** | Trust and recognition reduce acquisition costs | Moderate-Strong | 3-10 years | Apple, Basecamp |
| **Switching Costs** | High effort/cost to switch to competitor | Moderate | 6-18 months | Enterprise SaaS with deep integrations |
| **Technical Complexity** | Hard to replicate technology | Weak-Moderate | 6-24 months | Custom algorithms, infrastructure |
| **None (Commodity)** | Easy to copy, competes on price | None | N/A | Generic templates, basic tools |

**Indie Hacker Reality**: Most indie products start with **no moat**. Your goal is to build switching costs (integrations, data history, workflows) before competitors notice you.

### Differentiation Dimensions

Choose 1-2 dimensions to dominate; don't try to win on all:

| Dimension | How to Win | Trade-off |
|---|---|---|
| **Price** | Be 50%+ cheaper than incumbents | Lower margins, attracts price-sensitive users |
| **Simplicity** | Remove 80% of features, focus on core job | Loses power users |
| **Niche Focus** | Serve one industry/role extremely well | Smaller total addressable market |
| **UX/Design** | Best-in-class interface and onboarding | Higher development cost |
| **Speed** | Faster setup, faster results, faster support | May sacrifice depth |
| **Integration** | Works seamlessly with tools users already use | Complex engineering |
| **Community** | Active user community provides support and network effects | Requires ongoing moderation |

**Key rules**:
- Map your top 3 direct competitors on a 2x2 matrix (e.g., Price vs. Features, Simplicity vs. Power).
- Don't compete on the same dimension as well-funded incumbents—choose an axis they ignore.
- "Better UX" is not a moat unless it creates switching costs (data, workflows, habits).
- For B2B, switching costs (integrations, training, data migration) are your strongest early moat.

## Step 9: Sales Discovery (MEDDPICC)

For B2B products with ACV (Annual Contract Value) > $1K, use MEDDPICC to qualify deals and avoid wasting time on unlikely prospects.

### MEDDPICC Framework

| Component | Question to Answer | Red Flags |
|---|---|---|
| **Metrics** | What measurable outcome does the buyer expect? | Vague goals like "improve efficiency" |
| **Economic Buyer** | Who controls the budget? Can they sign without approval? | Champion loves it but can't approve spend |
| **Decision Criteria** | What factors will they use to choose? | Only mentions price; no technical evaluation |
| **Decision Process** | What steps lead to a signed contract? | Unclear timeline; "we'll get back to you" |
| **Identify Pain** | What specific problem are they solving? | No urgency; "nice to have" not "must have" |
| **Champion** | Who internally advocates for your solution? | No champion; you're selling to a committee |
| **Competition** | What alternatives are they considering? | Evaluating 5+ vendors; incumbent is "good enough" |

### When to Use MEDDPICC

| Condition | Action |
|---|---|
| **ACV < $1K** | Skip MEDDPICC; use self-serve signup + automated onboarding |
| **ACV $1K-$5K** | Light qualification: Metrics + Economic Buyer + Pain |
| **ACV $5K-$25K** | Full MEDDPICC; schedule discovery calls |
| **ACV > $25K** | MEDDPICC + executive alignment + proof-of-concept |

### Discovery Call Template

```
1. Opening (5 min): Confirm agenda, stakeholders present
2. Current State (10 min): How do they solve this today? What's broken?
3. Desired Outcome (10 min): What does success look like in 6 months?
4. Decision Process (5 min): Who else needs to approve? What's the timeline?
5. Next Steps (5 min): Schedule demo, trial, or follow-up
```

**Qualification Scorecard** (score each 1-5, total > 25 = qualified):

| Component | Score 1 (Weak) | Score 5 (Strong) |
|---|---|---|
| Metrics | No clear KPIs | Specific, measurable targets |
| Economic Buyer | Not present; multiple approvals needed | Present; can decide independently |
| Decision Criteria | Price-only comparison | Value-based; evaluating fit |
| Decision Process | Unclear; no timeline | Clear steps; decision in < 30 days |
| Identify Pain | Mild inconvenience | Critical business impact |
| Champion | No internal advocate | Executive sponsor pushing deal |
| Competition | 5+ vendors; status quo strong | You're the frontrunner |

**Key rules**:
- Don't start MEDDPICC until the prospect has expressed clear pain and budget awareness.
- If Economic Buyer isn't involved by the second call, the deal is likely dead—escalate or disqualify.
- Track MEDDPICC scores in your CRM; deals scoring < 20 rarely close.
- For ACV < $1K, invest in self-serve onboarding instead of sales calls—your time is better spent on larger deals or product improvements.

## Step 10: Growth Experiment Design

Systematic experimentation beats guessing. Use ICE scoring to prioritize experiments and run them in 1-2 week cycles.

### ICE Scoring Framework

**Formula**: ICE Score = Impact × Confidence × Ease (each scored 1-10)

| Dimension | Score 1 (Low) | Score 10 (High) |
|---|---|---|
| **Impact** | Minimal effect on key metric | Could 2x the key metric |
| **Confidence** | Guess based on intuition | Data-backed; similar experiments succeeded |
| **Ease** | Requires weeks of engineering | Can be done in < 2 days |

**Prioritization**: Run experiments in descending ICE score order. Re-score after each experiment based on learnings.

### Experiment Template

Every growth experiment should follow this structure:

```markdown
**Experiment Name**: [Brief descriptive name]

**Hypothesis**: If we [change/action], then [metric] will increase by [X%] because [reasoning].

**Primary Metric**: [Single North Star metric, e.g., signup conversion rate]

**Secondary Metrics**: [Guardrail metrics to monitor, e.g., churn, support tickets]

**Minimum Viable Experiment**:
- What: [Smallest possible change to test hypothesis]
- Audience: [Which user segment; e.g., new signups, trial users]
- Duration: [1-2 weeks maximum]
- Sample Size: [Minimum users needed for statistical significance]

**Success Criteria**:
- Win: [Metric] increases by ≥ [X%] with p-value < 0.05
- Inconclusive: Change is < [X%] or p-value > 0.05
- Loss: [Metric] decreases or negative side effects

**Timeline**:
- Day 1-2: Build experiment
- Day 3-14: Run experiment, monitor daily
- Day 15: Analyze results, decide: ship, iterate, or kill
```

### K-Factor (Viral Coefficient)

**Formula**: K = i × c

| Variable | Definition | Example |
|---|---|---|
| **i** | Number of invitations sent per user | Average 3 invites per user |
| **c** | Conversion rate of invitations | 20% of invitees sign up |
| **K** | Viral coefficient | K = 3 × 0.20 = 0.6 |

**Interpretation**:

| K-Factor | Meaning | Action |
|---|---|---|
| **K > 1.0** | Viral growth—each user brings > 1 new user | Scale aggressively; add frictionless sharing |
| **K = 0.5-1.0** | Strong viral loop—significant organic growth | Optimize invitation flow; add incentives |
| **K = 0.1-0.5** | Weak virality—some word-of-mouth | Add referral incentives; improve shareability |
| **K < 0.1** | No meaningful virality | Focus on paid/content acquisition instead |

**Ways to Increase K**:
- Increase **i**: Make sharing easier (one-click invites, pre-written messages)
- Increase **c**: Improve landing page for invitees; add social proof
- Add **incentives**: Referral bonuses for both referrer and referee

### Experiment Backlog Management

Maintain a running backlog of experiment ideas, scored by ICE:

| Experiment | Impact | Confidence | Ease | ICE Score | Status |
|---|---|---|---|---|---|
| Add social proof to pricing page | 7 | 8 | 9 | 504 | Completed ✅ |
| Referral program with $10 credit | 8 | 6 | 7 | 336 | Running 🔄 |
| Exit-intent popup with discount | 6 | 7 | 8 | 336 | Pending ⏳ |
| Onboarding video tutorial | 5 | 5 | 4 | 100 | Killed ❌ |

**Key rules**:
- Run only 1-2 experiments at a time to avoid confounding variables.
- Maximum experiment duration: 2 weeks. If inconclusive, extend by 1 week or kill.
- Document every experiment (win, loss, or inconclusive) in a shared log.
- Re-prioritize the backlog monthly based on new data and changing business goals.
- K > 1 is rare for B2B; focus on reducing friction in existing referral flows rather than expecting viral growth.

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

After completing business model design, use `startup-playbook-artifacts` when the user asks to save, export, render, document, persist, or resume the result.

Write or refresh:

```text
playbook/stages/business-model/input.json
playbook/stages/business-model/report.json
playbook/stages/business-model/handoff.json
playbook/stages/business-model/report.md
```

The `report.json` must follow the Startup Playbook artifact protocol and include `analysis.positioning`, `analysis.recommendedModel`, `analysis.pricing`, `analysis.revenueProgression`, and `analysis.unitEconomics`.

The `handoff.json` must include the buyer/user distinction, model type, pricing hypothesis, first paid test, revenue milestones, and monetization risks.

## Evidence Base

- 499 Indie Hackers cases analyzed.
- 498 readable, 1 failed (historical 404).
- Top business model: SaaS (479).
- Top pricing: subscription (464).
- Top validation: community-pain (418) + manual-service (357).
- Top acquisition: content (394) + community (252) + SEO (235).
- Confidence: strong for SaaS/subscription/content patterns; moderate for marketplace/ecommerce (smaller sample).
