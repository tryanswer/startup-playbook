---
name: seo-aso-growth-research
description: Use when researching SEO, ASO, localization, keyword opportunities, country trends, landing-page copy, or growth content for a startup product.
---

# SEO / ASO Growth Research

Use this skill to translate validated user pain into search, app-store, and content growth opportunities.

## Workflow

1. Define market, country, language, user segment, and buying intent.
2. Check `indie-hackers-starting-up` and `founder-case-patterns` for acquisition channels that worked in similar markets.
3. Build keyword clusters: problem, solution, comparison, purchase, brand, and adjacent use cases.
4. Check Google Trends for direction, geography, related queries, and seasonality.
5. Add Keywords Everywhere data when available: volume, CPC, competition, and 12-month trend.
6. Compare against competitor pages, app titles, subtitles, descriptions, reviews, and FAQ.
7. Rewrite copy for each language from user pain, not literal translation.
8. Produce actions for landing pages, App Store, Google Play, content, and experiments.
9. If AI is used for distribution, apply `playbooks/03-growth-and-marketing/ai-distribution.md`: AI may scan, summarize, score, draft, and report; humans must approve external replies, cold outreach, customer messages, competitor positioning, and final wording that affects trust.
10. Track impressions, clicks, rankings, conversion, payment intent, user objections, human minutes, AI cost, and cost-per-outcome.

## Keyword Cannibalization Audit

**MANDATORY for any site with >20 pages.**

- **Definition**: Multiple pages competing for the same keyword, causing mutual ranking suppression.
- **Detection Methods**:
  - Search Console query-page matrix: identify queries where multiple pages receive impressions/clicks.
  - `site:domain.com "keyword"` search to see which pages Google associates with a target term.
  - Tools: Ahrefs, SEMrush, or Screaming Frog to map keyword-to-page relationships.
- **Fix Strategies**:
  - **Merge**: Combine thin/duplicate content into one authoritative page.
  - **Canonical**: Add `<link rel="canonical">` to point to the preferred version.
  - **Noindex**: Apply `noindex` to lower-priority pages that should not rank.
  - **Internal Link Redirection**: Update internal links to point to the canonical page; use 301 redirects if retiring old URLs.
- **Frequency**: Audit monthly, especially after publishing new content.

## Technical SEO Audit

Ensure your site meets modern technical standards for crawlability, indexability, and performance.

- **Core Web Vitals** (Google ranking factor):
  - LCP (Largest Contentful Paint) < 2.5s
  - INP (Interaction to Next Paint) < 200ms
  - CLS (Cumulative Layout Shift) < 0.1
  - Tool: PageSpeed Insights, Lighthouse, or WebPageTest.
- **Crawlability**:
  - `robots.txt`: Ensure critical pages are not blocked; allow bots to access CSS/JS for rendering.
  - `sitemap.xml`: Submit to Google Search Console; keep it updated with new/removed URLs.
  - Crawl budget: For large sites (>10k pages), optimize internal linking and remove low-value pages to focus crawl resources.
- **Indexability**:
  - Noindex audit: Verify `noindex` tags are only on intended pages (e.g., thank-you pages, admin panels).
  - Canonical tags: Ensure each page has a self-referencing canonical or points to the correct master URL.
  - Hreflang: For i18n sites, implement `hreflang` tags to signal language/region targeting and avoid duplicate content issues.
- **Structured Data / Schema.org**:
  - Add relevant schema markup (Article, Product, FAQ, HowTo, Review, Organization) to enhance rich snippets.
  - Validate with Google's Rich Results Test.
- **Mobile-First Indexing**:
  - Confirm mobile version has equivalent content and metadata as desktop.
  - Test with Google's Mobile-Friendly Test.
- **Recommended Tools**: Screaming Frog SEO Spider, Ahrefs Site Audit, or Sitebulb for comprehensive technical scans.

## Link Authority Building

Build domain authority through strategic link acquisition and internal linking.

- **Link Acquisition Strategies**:
  - **Content Marketing**: Create linkable assets (original research, tools, templates, definitive guides).
  - **Guest Posting**: Write high-quality articles for relevant industry blogs with contextual backlinks.
  - **Resource Page Links**: Identify curated resource lists in your niche and request inclusion.
  - **Broken Link Building**: Find broken links on relevant sites, offer your content as a replacement.
  - **HARO / Connectively**: Respond to journalist queries to earn media mentions and links.
  - **Community Contribution**: Answer questions on Reddit, Indie Hackers, Hacker News, or niche forums with genuine value (not spam).
- **Domain Authority / Domain Rating Tracking**:
  - Monitor DA (Moz) or DR (Ahrefs) monthly; aim for steady growth through quality content and earned links.
- **Toxic Link Audit & Disavow**:
  - Use Ahrefs or SEMrush to identify spammy/low-quality backlinks.
  - Submit a disavow file to Google Search Console if toxic links are harming rankings.
- **Internal Link Strategy**:
  - **Hub-and-Spoke**: Create pillar pages (hubs) linked to cluster content (spokes) around core topics.
  - **Topical Clusters**: Group related content and interlink heavily to signal topical authority to search engines.
- **Solo Founder Feasible Strategy**: Focus on creating 1-2 exceptional pieces of content per month + HARO responses + authentic community participation. Quality over quantity.

## Growth Experiment Framework

Run systematic experiments to identify high-ROI growth channels.

- **ICE Scoring** (prioritize experiments):
  - **Impact** (1-10): Potential effect on key metric (traffic, signups, revenue).
  - **Confidence** (1-10): Certainty based on data, precedents, or expert opinion.
  - **Ease** (1-10): Effort required (time, cost, complexity).
  - **ICE Score** = Impact × Confidence × Ease. Start with highest scores.
- **Experiment Template**:
  - **Hypothesis**: "If we [action], then [metric] will increase by [X]% because [reasoning]."
  - **Metric**: Primary KPI to measure (e.g., organic traffic, CTR, conversion rate).
  - **Minimum Viable Experiment**: Smallest test to validate hypothesis (e.g., one landing page variant, one ad creative).
  - **Success Criteria**: Predefined threshold for success (e.g., +15% CTR, p < 0.05 statistical significance).
  - **Timeframe**: 1-2 weeks for most experiments; longer for SEO/content tests (4-8 weeks).
- **Cadence**: Run at least 1 growth experiment per week.
- **Experiment Log**: Maintain a spreadsheet or Notion database tracking hypothesis, results, learnings, and next steps.
- **Channel Efficiency Comparison**: Track CAC (Customer Acquisition Cost) by channel (SEO, paid ads, content, social, referrals) to allocate budget effectively.

## Content Strategy

Build a sustainable content engine that drives organic growth.

- **Content Pillars**: Define 3-5 core topics aligned with your product's value proposition and user pain points. Each pillar should have 5-10 supporting articles.
- **Content Types** (mix for variety and intent coverage):
  - **Comparison**: "[Product A] vs [Product B]" – captures high-intent buyers.
  - **Tutorial**: "How to [solve problem]" – builds trust and educates users.
  - **Case Study**: "How [Company] achieved [result]" – provides social proof.
  - **Tool/Template**: Free resources that attract links and shares.
  - **Thought Leadership**: Opinion pieces on industry trends.
- **Publishing Cadence**: Quality > quantity. Minimum 2 high-quality articles per month. Consistency matters more than volume.
- **Content Distribution**: One creation → multi-channel distribution. Repurpose articles into:
  - Twitter/X threads
  - LinkedIn posts
  - Newsletter editions
  - YouTube shorts or podcast episodes
  - Community posts (Indie Hackers, Reddit, Hacker News)
- **Content Refresh**: Quarterly audit of top 10 performing pages. Update statistics, add new sections, improve readability, and re-promote.
- **Programmatic SEO**: If your product has structured datasets (e.g., directory, marketplace, tool with templates), generate scalable landing pages programmatically (e.g., "Best [Tool] for [Use Case]" × 100 variations). Ensure each page has unique, valuable content.

## ASO Complete Framework

Optimize app store presence for both iOS and Android.

- **App Store vs Google Play Differences**:
  - **iOS**: Title (30 chars), Subtitle (30 chars), Keyword field (100 chars, comma-separated, no spaces), Description (4000 chars, not indexed for keywords).
  - **Android**: Title (30 chars), Short description (80 chars), Long description (4000 chars, fully indexed for keywords).
  - iOS relies heavily on title/subtitle/keyword field; Android relies on long description keyword density.
- **Keyword Field Optimization**:
  - Research competitor keywords using App Annie, Sensor Tower, or Mobile Action.
  - Use all 100 characters (iOS); prioritize high-volume, low-competition terms.
  - Avoid repeating words already in title/subtitle (wastes space).
  - Localize keywords for each target market.
- **Visual Assets**:
  - **Icon**: Simple, recognizable at small sizes, consistent with brand.
  - **Screenshots**: First 2-3 screenshots are critical. Show core features, benefits, and social proof. Use captions.
  - **Preview Video** (iOS): 15-30 seconds showcasing app functionality. Increases conversion by 20-30%.
- **Ratings & Reviews Management**:
  - Prompt satisfied users to rate after positive interactions (e.g., completing a task).
  - Respond to all reviews (especially negative ones) within 24-48 hours.
  - Aim for 4.5+ stars; below 4.0 significantly reduces installs.
- **A/B Testing**:
  - **Google Play Experiments**: Test icons, screenshots, short/long descriptions. Run for 7+ days with sufficient sample size.
  - **App Store Product Page Optimization**: Apple's native A/B testing for icons, screenshots, and preview videos. Test one variable at a time.
- **Localization Priority**: Launch in English first, then prioritize markets by size and relevance (e.g., Chinese, Japanese, German, Spanish). Localize title, keywords, screenshots, and description for each market.

## Multi-Channel Attribution

Understand which channels drive conversions to optimize spend.

- **Attribution Models**:
  - **First-Touch**: Credits the first interaction. Useful for understanding awareness channels.
  - **Last-Touch**: Credits the final interaction before conversion. Simple but ignores earlier touchpoints.
  - **Linear**: Distributes credit equally across all touchpoints.
  - **Time-Decay**: Gives more credit to recent interactions.
  - **Data-Driven** (GA4): Uses machine learning to assign credit based on historical patterns. Most accurate but requires sufficient data.
- **UTM Conventions & GA4**:
  - Use consistent UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) on all external links.
  - Map UTMs to GA4 events and conversions for unified tracking.
  - Follow `playbooks/03-growth-and-marketing/utm-attribution.md` for standardized naming.
- **Indie Hacker Recommended Approach**:
  - **Last-Touch + UTM + User Self-Report**: Combine GA4 last-touch attribution with a post-signup survey question: "How did you find us?" (multiple choice + open text). This captures offline/word-of-mouth referrals that digital tracking misses.
  - Cross-reference UTM data with self-reported sources to identify gaps.
- **LTV by Channel Tracking**:
  - Calculate Lifetime Value (LTV) segmented by acquisition channel.
  - Compare LTV:CAC ratio by channel; double down on channels with LTV:CAC > 3:1.
  - Use cohort analysis to track retention and revenue by channel over time.

## Required Output

- Keyword cluster report.
- Country and language opportunity ranking.
- SEO landing-page recommendations.
- ASO title/subtitle/description recommendations.
- Content experiment backlog.
- Measurement plan.
- AI distribution action split and never-write list when AI-assisted posting, replies, or outreach are in scope.
- **Keyword cannibalization audit report** (if site has >20 pages): identified conflicts, recommended fixes (merge/canonical/noindex), and priority order.
- **Technical SEO audit checklist**: Core Web Vitals scores, crawlability/indexability issues, schema markup gaps, and remediation priorities.
- **Link authority building plan**: Target domains for outreach, internal linking structure (hub-and-spoke map), and monthly DA/DR tracking baseline.
- **Growth experiment backlog**: ICE-scored experiments with hypothesis, metrics, success criteria, and 2-week execution timeline.
- **Content strategy document**: 3-5 content pillars, publishing calendar (min 2 articles/month), distribution channels, and quarterly refresh schedule for top 10 pages.
- **ASO optimization sheet**: Platform-specific keyword fields (iOS/Android), screenshot/video recommendations, A/B test plan, and localization priority by market.
- **Attribution framework**: UTM convention documentation, GA4 event mapping, self-report survey questions, and LTV:CAC targets by channel.

## Standardized Artifact Output

After completing growth research, use `startup-playbook-artifacts` when the user asks to save, export, render, document, persist, or resume the result.

Write or refresh:

```text
playbook/stages/grow/input.json
playbook/stages/grow/report.json
playbook/stages/grow/handoff.json
playbook/stages/grow/report.md
```

The `report.json` must follow the Startup Playbook artifact protocol and include `analysis.marketRouting`, `analysis.keywordClusters`, `analysis.seoAso`, `analysis.channels`, `analysis.paidValidation`, `analysis.utmPlan`, `analysis.aiDistribution`, and `analysis.measurementPlan`.

The `handoff.json` must include active channels, UTM conventions, SEO/ASO targets, paid test setup if any, content backlog, and measurement plan thresholds.

## Tool Notes

- Prefer `tools/google-trends-seo` when this repository is available.
- Use `tools/google-growth-stack pull-search-console` to export Search Console query and page data for analysis.
- Use `tools/google-growth-stack weekly-report` to generate a combined GA4 + Search Console Markdown summary.
- Connect Google Search Console per `playbooks/03-growth-and-marketing/google-search-console.md` to get real click, impression, CTR, and position data.
- Use `playbooks/03-growth-and-marketing/google-ads-cold-start.md` for paid keyword validation; feed Ads Search Terms back into SEO keyword clusters.
- Apply `playbooks/03-growth-and-marketing/utm-attribution.md` to all external links for consistent channel attribution.
- Google Trends is relative interest, not absolute search volume.
- If paid keyword data is unavailable, mark volume/CPC confidence as limited.
- SEO/ASO should inform landing page and product positioning, not only metadata.
