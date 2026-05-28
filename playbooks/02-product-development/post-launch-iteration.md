# Post-Launch Iteration

After launch, every decision should be driven by data, not anxiety. This guide provides decision trees based on real metrics from your analytics setup.

## The First 30 Days Framework

```
Week 1: Fix → Is the core flow working?
Week 2: Measure → Who activates, who pays, who leaves?
Week 3: Diagnose → What is the #1 blocker?
Week 4: Decide → Continue / Pivot / Kill
```

## Data Sources

All decisions reference data from these tools (set up during pre-launch):

| Data | Source | Guide |
|---|---|---|
| Funnel & events | GA4 or Baidu Analytics (百度统计) | `ga4-event-tracking.md` / `china-analytics-tracking.md` |
| Search traffic | Google Search Console or Baidu Search (百度搜索资源平台) | `google-search-console.md` |
| Revenue | Stripe / LemonSqueezy / Paddle dashboard | — |
| User feedback | Direct messages, support emails, in-app feedback | — |
| Weekly summary | Looker Studio or `tools/*/weekly-report` | `weekly-review-dashboard.md` |

## Decision Tree: What To Do Based on Data

### Scenario A: No Signups

```
No signups after 7 days
├── Is there traffic (page_views > 100)?
│   ├── Yes → Landing page problem
│   │   ├── Bounce rate > 70%? → Rewrite headline using user pain language
│   │   ├── CTA click rate < 2%? → Make CTA more visible or compelling
│   │   └── Wrong traffic source? → Check UTM data, switch channels
│   └── No → Distribution problem
│       ├── Did you announce anywhere? → Announce in 1-2 communities
│       ├── Wrong channel? → Go where validated users actually are
│       └── SEO not indexed? → Check Search Console for errors
```

### Scenario B: Signups But No Activation

Activation = user fires `first_value_delivered` event.

```
Signups > 10 but activation rate < 20%
├── Is onboarding too long?
│   ├── onboarding_complete rate < 50% → Shorten onboarding, remove steps
│   └── onboarding completes but no value → Core flow is confusing
├── Time to value > 2 minutes?
│   └── Reduce steps to first value. Can you deliver value in 30 seconds?
├── Users get stuck on a specific step?
│   └── Check GA4 funnel for the drop-off point. Fix that one step.
└── Users do not understand the value?
    └── Rewrite the first screen to show outcome, not features.
```

**Target**: Activation rate > 40% before focusing on growth.

### Scenario C: Activation But No Payment

```
Activation rate > 40% but purchase rate < 2%
├── Do users see the pricing page?
│   ├── pricing_page_view rate < 20% of activated → Pricing is hidden, add prompts
│   └── pricing_page_view rate > 20% → Users see price but do not convert
│       ├── checkout_start > 0 but purchase = 0 → Payment flow broken or friction
│       ├── checkout_start = 0 → Price too high or value not clear enough
│       │   ├── Try lower price point
│       │   ├── Add social proof (testimonials, case studies)
│       │   └── Offer limited free trial instead of freemium
│       └── Users ask for features before paying → They want more proof, not more features
│           └── Offer manual service or demo for 5 users before building more
```

**Key rule from case data**: 72% of successful indie hackers validated payment through manual service before building more product. If no one pays, sell the service manually to 5 people first.

### Scenario D: Users Pay But Churn Fast

```
Monthly churn > 15%
├── Is the problem one-time?
│   └── Yes → Switch to one-time pricing or usage-based (see business-model-design)
├── D7 retention < 15%?
│   └── Product delivers initial value but not ongoing value
│       ├── Add new use cases or recurring triggers
│       ├── Add email/notification to bring users back
│       └── Ask churned users: "What would make you come back?"
├── Users switch to a competitor?
│   └── Identify the competitor and what they offer differently
│       ├── Feature gap → Build the missing critical feature
│       └── Price gap → Adjust pricing or differentiate on value
└── Users just forget about the product?
    └── Build a re-engagement loop: weekly email, digest, or report
```

**Target**: Monthly churn < 5% for SaaS, < 10% for consumer products.

### Scenario E: Growth Stalls After Initial Success

```
MRR flat for 4+ weeks after reaching $1K+
├── Is acquisition slowing?
│   ├── Check Search Console: impressions declining? → SEO content needed
│   ├── Community channel exhausted? → Add a second channel
│   └── Paid ads CPA rising? → Creative fatigue, refresh ads
├── Is conversion rate dropping?
│   ├── New traffic from different audience? → Narrow targeting
│   └── Pricing page conversion down? → Test new pricing or plan structure
├── Is churn eating growth?
│   └── Net MRR growth = new MRR - churned MRR
│       ├── Churn > new → Fix retention before acquiring more
│       └── Roughly equal → Need to either reduce churn OR increase acquisition
└── Have you raised prices?
    └── Most indie hackers underprice. Try 50% price increase for new users.
```

## Iteration Cadence

### Weekly (Every Friday)

1. Open the weekly dashboard (Looker Studio / `tools/*/weekly-report`).
2. Check the 5 review questions from `weekly-review-dashboard.md`.
3. Identify the **one biggest blocker** this week.
4. Design **one experiment** to address it.
5. Ship the experiment by Wednesday next week.

### Monthly

1. Review cohort retention (D1/D7/D30) using `retention-decision-tree.md`.
2. Review revenue trend: MRR, churn, LTV.
3. Review acquisition channels: cost-per-outcome by channel.
4. Decide: continue current path / adjust positioning / pivot / stop.

### The "5 Paying Customers" Rule

Before building any new feature after a weak launch:

1. Name 5 specific people with a specific problem.
2. Ask each one sharp qualifying question.
3. If 3+ would pay or show strong intent → build the feature.
4. If < 3 → the feature is not the problem. Go back to positioning.

This rule comes from the strongest pattern in 499 indie hacker cases: **do not build more features as a response to low revenue. Find paying customers first.**

## When to Pivot vs. Kill

| Signal | Duration | Decision |
|---|---|---|
| No signups, no traffic | 4 weeks | Change distribution, not product |
| Traffic but zero signups | 4 weeks | Rewrite positioning and landing page |
| Signups but zero activation | 4 weeks | Simplify product radically or pivot |
| Activation but zero payment | 6 weeks | Try manual sales to 5 people. If no one buys, pivot |
| < $500 MRR after 3 months | 3 months | Serious pivot or kill unless clear growth trend |
| $1K+ MRR but stalling | 2 months | Adjust pricing/channels, do not kill yet |
| Paying users but you hate the work | Anytime | Consider selling or finding a co-founder |

## Integration With Other Skills

- Use `retention-decision-tree.md` for detailed D1/D7/D30 diagnosis.
- Use `business-model-design` to adjust pricing model based on data.
- Use `seo-aso-growth-research` when acquisition is the bottleneck.
- Use `google-ads-cold-start.md` for paid validation of new positioning.
- Use `founder-case-patterns` to find comparable pivots and outcomes.

## Common Mistakes

- Building features nobody asked for because "the product needs to be more complete."
- Treating a quiet launch as product failure when it is actually a distribution failure.
- Optimizing conversion rate when there is not enough traffic to measure.
- A/B testing with 50 users — you need 200+ per variant for significance.
- Ignoring user feedback in favor of analytics — talk to humans.
- Never raising prices because early users might complain — new users will pay more.
