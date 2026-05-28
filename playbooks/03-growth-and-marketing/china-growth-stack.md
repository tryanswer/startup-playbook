# China Growth Operations Playbook

A complete guide for growth acquisition, paid validation, SEO/ASO, and operational analysis in the mainland China market. Covers the four major ecosystems: Baidu, Douyin (TikTok), Xiaohongshu (Little Red Book), and WeChat.

## Channel Map

Chinese users are not on a single platform; planning must be done by ecosystem:

| Ecosystem | Coverage Scenarios | Core Tools | Data Sources |
|---|---|---|---|
| **Baidu** | Search Engine SEO + SEM | Baidu Search Resource Platform, Baidu Promotion | Baidu Analytics (百度统计), Baidu Index |
| **Douyin/ByteDance** | Short video traffic, feed ads | Ocean Engine (巨量引擎), Ocean Arithmetic (巨量算数) | Ocean Engine Dashboard |
| **Xiaohongshu** | Seeding, word-of-mouth, search | Xiaohongshu蒲公英 (Pugongying), Qiangua Data | Xiaohongshu Creator Dashboard |
| **WeChat** | Mini Programs, Official Accounts, Communities, Moments Ads | Tencent Ads, WeChat Official Account Platform | Mini Program Data Assistant |
| **App Stores** | App Distribution | Qimai Data, Chan Masters | Developer Dashboards of each store |

## Workflow

### 1. Demand Validation Stage

Benchmarking against overseas tools like Google Trends + Reddit, domestic alternatives include:

| Overseas Tool | Domestic Alternative | Purpose |
|---|---|---|
| Google Trends | **Baidu Index** + **WeChat Index** + **Ocean Arithmetic** | Search trends, user demographics |
| Reddit Pain Point Mining | **Xiaohongshu** + **Zhihu** + **Douyin Comments** | User quotes, real complaints |
| Keywords Everywhere | **5118** + **Chinaz Webmaster Tools** | Keyword search volume, long-tail keywords |

```
Baidu Index / WeChat Index → Validate search trends
        ↓
Xiaohongshu/Zhihu/Douyin Comments → Collect user quotes
        ↓
5118 / Chinaz → Keyword search volume and competition
        ↓
Conclusion: Is the demand real and frequent?
```

### 2. Landing Page Validation

- Web Landing Pages: Integrate Baidu Analytics to track sources + conversion events.
- WeChat Landing Pages: Official Account articles / Mini Program landing pages, track reads → follows → registrations.
- Douyin Landing Pages: Ocean Engine Orange Site Builder, track form submissions.

### 3. Paid Validation (Small Budget Test)

| Platform | Minimum Test Budget | Suitable Scenarios | Core Metrics |
|---|---|---|---|
| **Baidu Promotion** | ¥200-500 | Products with clear search intent | CPC, Conversion Rate, Keyword Report |
| **Ocean Engine** | ¥300-500 | Products demonstrable via short video | CPM, CTR, Form Conversions |
| **Tencent Ads** | ¥300-500 | WeChat ecosystem products | Follower acquisition cost, Mini Program open rate |
| **Xiaohongshu Spotlight** | ¥200-500 | Seeding-type products, female-dominant users | Note interactions, DM inquiries |

Decision rules are consistent with `google-ads-cold-start.md`:
- High impressions + high clicks + conversions → Demand validated
- High impressions + low clicks → Creative/copy issue
- High clicks + zero conversions → Landing page or product promise mismatch
- CPA > LTV → Paid acquisition unsustainable

### 4. SEO (Baidu)

#### Baidu Search Resource Platform

Benchmarking Google Search Console, Baidu Search Resource Platform provides:

| Feature | Purpose | Action |
|---|---|---|
| Search Impressions | Impressions, clicks, average ranking | Check trends weekly |
| Index Volume | Number of indexed pages | Ensure new pages are indexed |
| Traffic & Keywords | Terms users searched to enter | Discover content opportunities |
| Crawl Errors | Pages that failed to crawl | Fix 404/500 errors promptly |
| Mobile Adaptation | Mobile adaptation status | Baidu gives higher weight to mobile |

#### Special Rules for Baidu SEO

- **ICP Filing is Prerequisite**: Domains without ICP filing basically have no rankings on Baidu.
- **Baidu Mini Program Weighting**: Integrating Baidu Smart Mini Programs can gain search ranking boosts.
- **Original Content Protection**: Submit original content markers for ranking priority.
- **MIP / AMP**: Baidu has its own MIP accelerated page standard.
- **Backlink Weight Declining**: Baidu now values content quality and user behavior data more.

### 5. ASO (App Stores)

Domestic Android has no unified app store; main stores include:

| Store | Covered Users | ASO Focus |
|---|---|---|
| Huawei AppGallery | Huawei/Honor users | Title, description, app content rating |
| Xiaomi GetApps | Xiaomi/Redmi users | Title, screenshots, reviews |
| OPPO/vivo App Market | OPPO/vivo users | Title, category ranking |
| Tencent MyApp | Tencent ecosystem recommendations | Micro-download, social referrals |
| Apple App Store | iOS users | Title, subtitle, keywords, description |

Tools:
- **Qimai Data**: Keyword rankings, download estimates, competitor analysis.
- **Chan Masters**: ASO keyword optimization, review monitoring.

### 6. Content Distribution

| Platform | Content Format | Suitable Products | Key Metrics |
|---|---|---|---|
| Xiaohongshu | Image-text notes, short videos | Consumer goods, tools, lifestyle | Saves, interactions, search ranking |
| Douyin | Short videos, live streaming | Visually demonstrable products | Completion rate, conversion rate |
| Zhihu | Long-form answers | Professional tools, B2B, decision-making products | Upvotes, saves, traffic referral |
| Official Accounts | Long articles, tutorials | Products requiring deep understanding | Reads, shares, lead generation |
| Bilibili | Medium-long videos | Tech products, tutorial-based | Views, danmaku, triple-actions (like/coin/fav) |

AI distribution rules refer to `ai-distribution.md`, with additional domestic considerations:
- **Strictly Prohibited**: AI auto-posting Xiaohongshu notes, auto-replying Zhihu, auto-commenting Douyin (platform risk control is strict, high ban risk).
- AI Can Do: Summarize hot posts, draft titles, analyze comment sentiment, generate content outlines.
- Humans Must Do: Final publishing, reply interactions, DM communication.

## Data Dashboard

### Baidu Analytics Dashboard

Baidu Analytics backend provides basic dashboards covering:
- Traffic overview (PV, UV, sources)
- Conversion analysis (set conversion goals)
- Top visited pages
- Search term report (keywords entering via Baidu search)

### Advanced Dashboard Solutions

| Requirement | Solution | Cost |
|---|---|---|
| Simple & Sufficient | Baidu Analytics Backend | Free |
| Cross-platform Data | Umeng+ Backend | Free |
| Custom Analysis | Metabase + MySQL | Open source free, requires self-deployment |
| Professional Grade | Sensors Data | Paid by data volume |

## Weekly Review Protocol

Every Friday, answer 5 questions based on data (consistent with the overseas version):

1. **What was the biggest growth signal this week?** → Double down
2. **Where was the biggest churn point this week?** → Fix or cut
3. **Which channel had the lowest customer acquisition cost?** → Concentrate resources
4. **Did user activation rate change?** → Is the product deviating from value?
5. **If you could only do one thing next week, what would it be?** → Write into next week's experiments

## China vs Overseas Decision Routing

| Condition | Use Plan |
|---|---|
| Target users in mainland China | This document + `china-analytics-tracking.md` + `tools/china-growth-stack` |
| Target users overseas | `google-search-console.md` + `google-ads-cold-start.md` + `tools/google-growth-stack` |
| Both present | Integrate both sets separately, associate via unified backend user ID |
