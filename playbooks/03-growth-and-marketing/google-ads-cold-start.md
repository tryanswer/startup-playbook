# Google Ads Cold Start Validation

Use a small budget of $50-100 on Google Ads to quickly validate willingness to pay. Get feedback 10x faster than pure SEO—SEO takes 3-6 months to show results, while Ads provides data within 24 hours.

## When To Use

- Idea validation stage: Landing page is ready, need to quickly import precise traffic.
- SEO hasn't gained traction yet: Organic search rankings take time, use paid traffic first to test conversion.
- Validate keyword value: Which search terms actually lead to paying users.
- Validate pricing: Whether users click to buy after seeing the price.

## Budget Rule

Initial test budget should not exceed $100. The goal is not profitability, but buying enough data to make decisions.

| Stage | Budget | Goal |
|---|---|---|
| Keyword validation | $30-50 | Confirm which keywords get clicks and which have no searches |
| Landing page conversion test | $50-100 | Test CTA click-through rate and registration/purchase conversion |
| Scaling validation | $100-300 | Confirm if CPA and ROAS are sustainable |

## Setup Steps

### 1. Campaign Structure

```
Account
└── Campaign: [Product] - Search - Validation
    └── Ad Group 1: Problem keywords (users search for pain points)
    └── Ad Group 2: Solution keywords (users search for solutions)
    └── Ad Group 3: Comparison keywords (users search for comparisons)
```

### 2. Keyword Selection

Select from existing SEO keyword research:

- **Problem keywords**: `how to [solve pain]`, `why [problem] happens`
- **Solution keywords**: `[solution] tool`, `best [solution] app`
- **Comparison keywords**: `[competitor] alternative`, `[tool A] vs [tool B]`
- **Purchase keywords**: `[solution] pricing`, `buy [solution]`

Tips:
- Use Phrase Match or Exact Match, not Broad Match (will burn budget on irrelevant terms).
- No more than 15 keywords per Ad Group.
- Add Negative Keywords to exclude irrelevant searches.

### 3. Ad Copy

Write ad copy using validated user quotes, not marketing jargon.

```
Headline 1: [Core pain point, using user's own words]
Headline 2: [Product promise, one sentence]
Headline 3: [CTA: Free trial / See pricing / Get started]
Description: [Scenario + Value + Action]
```

### 4. Landing Page

Point to a landing page with GA4 events installed. Ensure:

- Ad keywords match landing page titles (improves Quality Score).
- Page has clear conversion actions (register / purchase / book).
- GA4 tracks `landing_page_view` → `sign_up` / `checkout_start` → `purchase`.

### 5. Conversion Tracking

Import GA4 conversion events into Google Ads:

- Primary conversion: `purchase` or `sign_up`
- Secondary conversion: `checkout_start`, `pricing_page_view`

## Reading The Data

Check the first batch of data after 24-48 hours.

### Key Metrics

| Metric | Meaning | Healthy Range |
|---|---|---|
| Impressions | Ad display count | > 100/day indicates search volume |
| CTR | Ad click-through rate | > 3% is healthy |
| CPC | Cost per click | Depends on industry, $0.5-5 common |
| Conversion Rate | Click-to-conversion | > 2% for registration, > 1% for payment |
| CPA | Cost per acquisition | Must be < user LTV |
| Search Terms | Actual user search terms | Discover unexpected needs |

### Decision Framework

| Signal | Action |
|---|---|
| High impressions + high CTR + conversions | ✅ Demand validated, can scale or shift to SEO |
| High impressions + low CTR | Ad copy not attractive, rewrite headline |
| High CTR + zero conversions | Landing page issue, or product promise doesn't match search intent |
| Low impressions | Keyword search volume insufficient, change keywords or market |
| Unexpected high-converting terms in Search Terms | Discovered new user needs, add to SEO strategy |
| CPA > LTV | Paid acquisition unsustainable, must rely on SEO/content/referrals |

## Search Terms → SEO Feedback Loop

The biggest hidden value of Google Ads: **Search Terms Report**.

```
Ads Search Terms Report → Discover actual user search terms
        ↓
High-converting terms → Write SEO content to cover these terms
        ↓
Track organic rankings in Search Console
        ↓
When rankings improve → Pause corresponding Ads keywords
        ↓
Shift Ads budget to next batch of terms to validate
```

This way, Ads is not a continuous cost, but an accelerator for SEO.

## Common Mistakes

- Using Broad Match causes budget to be spent on irrelevant searches.
- Landing page inconsistent with ad copy, resulting in low Quality Score and high CPC.
- Not setting daily budget cap, spending it all overnight.
- Only looking at CTR without conversions, many clicks don't mean value.
- Drawing conclusions after 1 day—run for at least 3-5 days, accumulate 100+ clicks before deciding.
- Not checking Search Terms report, missing the most valuable user insights.
