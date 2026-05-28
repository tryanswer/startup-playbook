# Weekly Review Dashboard

基于 Looker Studio 连接 GA4 + Google Search Console + Google Ads 的统一复盘视图。每周五用 15 分钟看一遍，做出 continue / adjust / stop 决策。

## Data Sources

| Source | Connection | Free? | Data |
|---|---|---|---|
| GA4 | Looker Studio 内置连接器 | Yes | 流量、事件、转化、留存 |
| Google Search Console | Looker Studio 内置连接器 | Yes | 搜索展示、点击、CTR、排名 |
| Google Ads | Looker Studio 内置连接器 | Yes | 花费、CPC、转化、ROAS |
| Stripe / Paddle | 通过 Google Sheets 或 Supermetrics | Partial | MRR、Churn、LTV |

## Dashboard Layout

### Page 1: Weekly Snapshot

一页看全貌，不超过 6 个核心数字。

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
| Traffic by source/medium | GA4 session source | 哪个渠道在涨、哪个在跌 |
| Top landing pages | GA4 page_view + bounce rate | 哪些页面留人、哪些流失 |
| Top search queries | Search Console queries | 哪些词带来点击 |
| Search impressions vs clicks | Search Console | CTR 低的高展示词 = 优化机会 |
| Ads performance | Google Ads | CPC、转化、ROAS 是否合理 |

### Page 3: Activation & Engagement

| Chart | Data | Decision |
|---|---|---|
| Signup → first_value funnel | GA4 events | 激活率是否健康 |
| Time to value distribution | first_value_delivered.time_to_value_seconds | 用户多快获得价值 |
| Feature usage ranking | feature_used by feature_name | 哪些功能被用、哪些没人用 |
| Onboarding drop-off | onboarding_complete steps | 引导流程哪一步流失最多 |

### Page 4: Revenue & Retention

| Chart | Data | Decision |
|---|---|---|
| Revenue trend (weekly) | purchase value | 收入是否增长 |
| Conversion rate | checkout_start → purchase | 支付流程是否顺畅 |
| Cohort retention | GA4 cohort exploration | D1/D7/D30 留存趋势 |
| Pricing page → checkout | pricing_page_view → checkout_start | 定价页转化率 |

### Page 5: SEO Health

| Chart | Data | Decision |
|---|---|---|
| Total impressions trend | Search Console | 搜索可见度趋势 |
| Average position by page | Search Console | 排名变化 |
| New vs lost queries | Search Console week-over-week | 新增/流失关键词 |
| Country breakdown | Search Console by country | 哪个国家增长最快 |

## Setup Steps

1. Open [Looker Studio](https://lookerstudio.google.com).
2. Create → Report → Add data source → Google Analytics → select GA4 property.
3. Add data source → Search Console → select site → URL impression.
4. Add data source → Google Ads (if running).
5. Build pages following the layout above.
6. Set date range control: default to "Last 7 days" with compare "Previous period".
7. Schedule email delivery: every Friday.

## Weekly Review Protocol

每周五对照 dashboard 回答 5 个问题：

1. **本周最大的增长信号是什么？** → 加码
2. **本周最大的流失点在哪？** → 修复或砍掉
3. **哪个渠道的 cost-per-outcome 最低？** → 集中资源
4. **用户激活率有没有变化？** → 产品是否偏离价值
5. **下周只做一件事，做什么？** → 写入下周实验

## Decision Thresholds

| Metric | Green | Yellow | Red |
|---|---|---|---|
| Signup → Activated | > 40% | 20-40% | < 20% |
| Activated → Paid | > 5% | 2-5% | < 2% |
| Landing page bounce | < 50% | 50-70% | > 70% |
| Search CTR | > 3% | 1-3% | < 1% |
| D7 retention | > 30% | 15-30% | < 15% |
| Ads ROAS | > 3x | 1-3x | < 1x |

Red = 本周必须修复或砍掉。Yellow = 下周实验改善。Green = 继续当前策略。
