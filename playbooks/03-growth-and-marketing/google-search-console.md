# Google Search Console Guide

Search Console is the core data source for SEO growth. It tells you what terms users searched on Google when they saw your site, whether they clicked, and what position you ranked. This data directly determines content strategy and page optimization direction.

## Setup

1. Add your site to [Google Search Console](https://search.google.com/search-console).
2. Domain property is recommended (covers all subdomains).
3. Verify ownership via DNS TXT record.
4. Submit sitemap.xml.
5. Connect GA4: GA4 Admin → Product links → Search Console.
6. Connect Looker Studio for weekly reviews.

## Key Reports

### Performance Report

Core report, must-check weekly.

| Metric | Meaning | Action |
|---|---|---|
| Impressions | How many times appeared in search results | High impressions but low clicks = title/description needs optimization |
| Clicks | How many times users clicked through | Core traffic metric |
| CTR | Click-through rate = clicks / impressions | < 1% needs snippet optimization |
| Position | Average ranking | Terms ranked 5-15 = biggest optimization opportunity |

**Break down by dimension:**

- **Queries**: Specific terms users searched → Discover new content opportunities and user language
- **Pages**: Which pages receive traffic → Focus optimization on high-potential pages
- **Countries**: Which countries have more searches → Guide localization priorities
- **Devices**: Mobile vs desktop → Guide responsive design priorities

### Index Coverage

| Status | Meaning | Action |
|---|---|---|
| Valid | Indexed | Normal |
| Excluded | Excluded | Check if important pages are mistakenly excluded |
| Error | Indexing failed | Fix immediately (404, 500, redirect loop) |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

Poor performance directly affects rankings. Poor status must be fixed.

## Weekly SEO Actions

1. Open Performance → Select past 7 days vs previous 7 days for comparison.
2. Find terms with **high impressions but low CTR** → Optimize titles and meta descriptions.
3. Find terms with **position 5-15** → These are easiest to optimize into top 5 through content improvements.
4. Find **newly appearing queries** → Discover new user needs.
5. Find **terms with declining impressions** → Check if rankings were surpassed by competitors.
6. Check Index Coverage errors → Ensure new pages are indexed.

## Content Strategy From Search Data

```
Search Console data → Find what users are searching for
        ↓
Categorize queries by intent: question/solution/comparison/purchase
        ↓
Optimize existing pages with high impression, low CTR terms
        ↓
Create or expand content for position 5-15 terms
        ↓
Experiment with new content using newly appearing queries
        ↓
Weekly review: Did rankings improve, did CTR increase
```

## Integration With GA4

After connection, you can see in GA4:

- Which search terms brought `sign_up` and `purchase` conversions.
- Activation rate of organic search traffic compared to other channels.
- Complete funnel from search to conversion for specific landing pages.

This is more valuable than looking at Search Console alone—not just "how many people came," but "did the people who came pay."

## Common Mistakes

- Only looking at impressions without CTR, assuming high impressions are good.
- Ignoring opportunity terms at position 5-15, only focusing on already #1 ranked terms.
- Not checking the countries dimension, missing non-English market opportunities.
- Not connecting Search Console to GA4, unable to judge search traffic quality.
- Changing page titles without tracking CTR changes, unable to verify optimization effects.
