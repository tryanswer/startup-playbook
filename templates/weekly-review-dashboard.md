# Weekly Review Dashboard

A unified review dashboard based on Looker Studio connecting GA4 + Google Search Console + Google Ads. Spend 15 minutes every Friday to review and make continue / adjust / stop decisions.

## Data Sources

| Source | Connection | Free? | Data |
|---|---|---|---|
| GA4 | Looker Studio 内置连接器 | Yes | 流量、事件、转化、留存 |
| Google Search Console | Looker Studio 内置连接器 | Yes | 搜索展示、点击、CTR、排名 |
| Google Ads | Looker Studio 内置连接器 | Yes | 花费、CPC、转化、ROAS |
| Stripe / Paddle | 通过 Google Sheets 或 Supermetrics | Partial | MRR、Churn、LTV |

## Dashboard Layout

### Page 1: Weekly Snapshot

One page to see the full picture, no more than 6 core metrics.

| Card | Metric | Source | Compare |
|---|---|---|---|
| Visitors | Total users (7d) | GA4 | vs. last week |
| Signups | sign_up event count | GA4 | vs. last week |
| Activated | first_value_delivered count | GA4 | vs. last week |
| Paying | purchase event count | GA4 | vs. last week |
| Revenue | purchase event value sum | GA4 / Stripe | vs. last week |
| Search clicks | Total clicks (7d) | Search Console | vs. last week |

Below cards:

- Line chart: daily users + signups + purchases (14d)
- Funnel: page_view → sign_up → first_value_delivered → checkout_start → purchase

### Page 2: Acquisition

| Chart | Data | Decision |
|---|---|---|
| Traffic by source/medium | GA4 session source | Which channel is growing, which is declining |
| Top landing pages | GA4 page_view + bounce rate | Which pages retain users, which lose them |
| Top search queries | Search Console queries | Which keywords drive clicks |
| Search impressions vs clicks | Search Console | High-impression, low-CTR keywords = optimization opportunities |
| Ads performance | Google Ads | Are CPC, conversions, and ROAS reasonable |

### Page 3: Activation & Engagement

| Chart | Data | Decision |
|---|---|---|
| Signup → first_value funnel | GA4 events | Is activation rate healthy |
| Time to value distribution | first_value_delivered.time_to_value_seconds | How quickly do users get value |
| Feature usage ranking | feature_used by feature_name | Which features are used, which are ignored |
| Onboarding drop-off | onboarding_complete steps | Where does the onboarding flow lose most users |

### Page 4: Revenue & Retention

| Chart | Data | Decision |
|---|---|---|
| Revenue trend (weekly) | purchase value | Is revenue growing |
| Conversion rate | checkout_start → purchase | Is the payment flow smooth |
| Cohort retention | GA4 cohort exploration | D1/D7/D30 retention trends |
| Pricing page → checkout | pricing_page_view → checkout_start | Pricing page conversion rate |

### Page 5: SEO Health

| Chart | Data | Decision |
|---|---|---|
| Total impressions trend | Search Console | Search visibility trend |
| Average position by page | Search Console | Ranking changes |
| New vs lost queries | Search Console week-over-week | Gained/lost keywords |
| Country breakdown | Search Console by country | Which country is growing fastest |

## Setup Steps

1. Open [Looker Studio](https://lookerstudio.google.com).
2. Create → Report → Add data source → Google Analytics → select GA4 property.
3. Add data source → Search Console → select site → URL impression.
4. Add data source → Google Ads (if running).
5. Build pages following the layout above.
6. Set date range control: default to "Last 7 days" with compare "Previous period".
7. Schedule email delivery: every Friday.

## Weekly Review Protocol

Every Friday, answer these 5 questions against the dashboard:

1. **What is the biggest growth signal this week?** → Double down
2. **Where is the biggest drop-off point?** → Fix or cut
3. **Which channel has the lowest cost-per-outcome?** → Concentrate resources
4. **Has user activation rate changed?** → Is the product deviating from value
5. **If you can only do one thing next week, what is it?** → Write into next week's experiment

## Decision Thresholds

| Metric | Green | Yellow | Red |
|---|---|---|---|
| Signup → Activated | > 40% | 20-40% | < 20% |
| Activated → Paid | > 5% | 2-5% | < 2% |
| Landing page bounce | < 50% | 50-70% | > 70% |
| Search CTR | > 3% | 1-3% | < 1% |
| D7 retention | > 30% | 15-30% | < 15% |
| Ads ROAS | > 3x | 1-3x | < 1x |

Red = Must fix or cut this week. Yellow = Experiment improvements next week. Green = Continue current strategy.
