# Retention Analysis Decision Tree

Retention is the ultimate indicator of whether a product has core value. Growth can rely on channels, but retention depends solely on the product.

## Core Metrics

| Metric | Definition | Source | Healthy Benchmark |
|---|---|---|---|
| D1 Retention | Next-day return rate | GA4 Cohort | > 20% |
| D7 Retention | 7-day return rate | GA4 Cohort | > 15% |
| D30 Retention | 30-day return rate | GA4 Cohort | > 10% |
| Weekly Active Rate | WAU / Total registered | GA4 Active users | > 25% |
| Feature Return Rate | Repeat usage rate of the same feature | GA4 feature_used event | > 30% |
| Activation → Retention | D7 retention after first_value_delivered | GA4 Segment | > 30% |

Note: benchmarks vary by product type. SaaS tools tend higher, consumer apps tend lower.

## GA4 Setup For Retention

1. **Cohort Exploration**: GA4 → Explore → Cohort exploration
   - Cohort inclusion: `first_visit` or `sign_up`
   - Return criteria: `session_start` or `feature_used`
   - Granularity: Daily or Weekly
2. **Segment comparison**: Compare retention curves of activated (fired `first_value_delivered`) vs non-activated users
3. **User lifetime**: GA4 → Reports → Retention → User retention to view overall trends

## Decision Tree

### D1 Retention

```
D1 < 10%
├── Did users complete onboarding?
│   ├── No → Fix the onboarding flow, reduce barriers to first use
│   └── Yes → Core value delivery is too slow or weak
│       ├── time_to_value > 2 min → Shorten the path to first value
│       └── time_to_value < 2 min → Product value proposition may not hold
│           → Return to idea validation, conduct user interviews

D1 10-20%
├── Normal range, focus on activation rate
│   ├── Activation rate < 40% → Optimize onboarding
│   └── Activation rate > 40% → Focus on D7

D1 > 20%
└── Healthy. Continue monitoring D7 and paid conversion.
```

### D7 Retention

```
D7 < 5%
├── Is the product for one-time use or should it be used repeatedly?
│   ├── One-time → Consider pivoting to a paid tool (one-time payment) instead of subscription
│   └── Should be repeated → Users have no reason to return
│       ├── Are there push/email reminders? → Add lightweight outreach
│       ├── Is there new content/data? → Need return visit value
│       └── What do users need after completing tasks? → Conduct user interviews

D7 5-15%
├── Has potential but needs optimization
│   ├── Compare D7 difference between activated vs non-activated
│   │   ├── Difference > 2x → Activation is key, optimize first_value_delivered path
│   │   └── Difference < 2x → Value after activation is also insufficient, needs deeper product improvements
│   └── Compare D7 differences across acquisition channels
│       ├── One channel significantly higher → Users from this channel are more precise, invest more
│       └── All similarly low → Product issue, not channel issue

D7 15-30%
├── Healthy range. Focus on paid conversion and D30.

D7 > 30%
└── Excellent. Product has core value, focus on growth and monetization.
```

### D30 Retention

```
D30 < 5%
├── Lack of long-term value
│   ├── Is the user's pain point one-time? → Adjust business model
│   └── Are competitors taking users? → Competitor analysis + differentiation
│   └── Do users forget the product exists? → Establish outreach mechanisms

D30 5-10%
├── Acceptable but needs improvement
│   ├── Add lifecycle email / push notifications
│   ├── Increase usage scenarios (new features or use cases)
│   └── Build user community

D30 > 10%
└── Healthy. Has payment foundation. Focus on LTV and NRR.
```

## Retention By Segment

Don't just look at overall retention. Break down by the following dimensions:

| Segment | How | Purpose |
|---|---|---|
| Activated vs Not | GA4 segment: fired first_value_delivered | Verify if activation is the key lever for retention |
| Paid vs Free | GA4 user property: user_plan | Is paid user retention significantly higher? |
| By Source | GA4 first user source | Which channel has the highest quality users? |
| By Country | GA4 user property: user_country | Product fit across different markets |
| By Feature | GA4 feature_used event | Which feature users have better retention? |

## Actionable Patterns

| Pattern | Meaning | Action |
|---|---|---|
| Activated retention >> Non-activated | Activation is the lever | All-in on optimizing onboarding and first_value |
| One channel retention >> Others | Users from this channel are a better fit | Invest more in this channel, study user persona differences |
| High retention for users of a feature | This feature is core value | Drive more users to use this feature |
| Paid user retention >> Free | Payment filters for high-intent users | Raising payment barriers isn't necessarily bad |
| All segments have low retention | Insufficient product value | Return to idea validation |

## Weekly Retention Check

Answer these questions in your weekly review dashboard:

1. Is this week's cohort D1 higher than last week's?
2. Is the percentage of activated users growing?
3. Which segment has the highest retention? Why?
4. Are there users who were previously active but are now churning? → Investigate reasons
5. What experiments need to be done to improve retention? → Write into next week's plan
