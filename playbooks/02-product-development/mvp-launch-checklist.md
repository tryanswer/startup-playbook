# MVP Launch Checklist

A launch is not a single event — it is three phases. Missing any step means flying blind or leaving money on the table.

## Phase 1: Pre-Launch (3-7 days before)

### Product Readiness

- [ ] Core user flow works end-to-end: input → process → output → value delivered.
- [ ] Payment flow works: user can pay and receive access immediately.
- [ ] Error states are handled gracefully (no blank pages, no silent failures).
- [ ] Works on mobile (even if desktop-first — 50%+ traffic will be mobile).
- [ ] Loading time < 3 seconds (LCP). Test with Chrome Lighthouse.
- [ ] Has a favicon, proper `<title>`, and meta description for sharing.

### Analytics & Tracking

- [ ] GA4 implemented with all AARRR events (see `ga4-event-tracking.md`).
- [ ] For China market: Baidu Analytics (百度统计) implemented (see `china-analytics-tracking.md`).
- [ ] Conversion events marked in analytics: `sign_up`, `first_value_delivered`, `purchase`.
- [ ] GA4 DebugView verified — events fire correctly.
- [ ] UTM conventions documented (see `utm-attribution.md`).
- [ ] Error monitoring active (Sentry or equivalent).

### Payment & Legal

- [ ] Stripe / LemonSqueezy / Paddle connected and tested with a real transaction.
- [ ] Pricing page live with clear plans and pricing (see `business-model-design` skill).
- [ ] Refund policy written.
- [ ] Privacy policy and terms of service published.
- [ ] For China market: privacy consent popup implemented (see `china-analytics-tracking.md`).
- [ ] For apps: App Store / Google Play listing prepared.

### Distribution Prep

- [ ] Landing page ready with conversion CTA (see `landing-page-checklist.md`).
- [ ] Google Search Console connected and sitemap submitted (see `google-search-console.md`).
- [ ] Launch announcement drafted for 2-3 channels.
- [ ] UTM-tagged URLs prepared for each channel (use `tools/google-growth-stack build-utm`).
- [ ] First 10 users identified — people who expressed interest during validation.

### Content & SEO

- [ ] Landing page title and meta description include target keywords.
- [ ] OpenGraph tags set for social sharing (title, description, image).
- [ ] Robots.txt and sitemap.xml configured.

## Phase 2: Launch Day

### Go Live

- [ ] Deploy to production.
- [ ] Verify payment flow with a real $1 test transaction.
- [ ] Verify analytics events in GA4 Realtime (or Baidu Analytics).
- [ ] Verify Google Search Console can access the site.

### Announce

Launch to **one channel at a time**, not everywhere simultaneously. This lets you learn from each channel.

| Channel | Action | UTM example |
|---|---|---|
| **Warm list** | Email the 10-50 people from validation | `utm_source=email&utm_medium=direct&utm_campaign=launch` |
| **Community** | Post in the most relevant community (Reddit, HN, Discord) | `utm_source=reddit&utm_medium=community&utm_campaign=launch` |
| **Social** | Tweet / LinkedIn post from founder account | `utm_source=twitter&utm_medium=social&utm_campaign=launch` |
| **Product Hunt** | Optional — only if product is visually demonstrable | `utm_source=producthunt&utm_medium=referral&utm_campaign=launch` |

### Monitor

- [ ] Watch GA4 Realtime for the first hour.
- [ ] Check payment dashboard for the first transaction.
- [ ] Respond to every comment, reply, and question within 1 hour.
- [ ] Log every piece of user feedback verbatim.

## Phase 3: Post-Launch (First 7 Days)

### Day 1-2: Fix and Respond

- [ ] Fix any critical bugs discovered by real users.
- [ ] Reply to every user who signed up — ask what they expected vs. what they got.
- [ ] Check GA4 funnel: `page_view` → `sign_up` → `first_value_delivered` → `purchase`.

### Day 3-5: Measure

- [ ] Pull first data from analytics.
- [ ] Calculate activation rate: `first_value_delivered` / `sign_up`.
- [ ] Calculate conversion rate: `purchase` / `sign_up`.
- [ ] Identify the biggest drop-off point in the funnel.
- [ ] Collect 5+ user quotes (positive and negative).

### Day 6-7: Decide

Use the post-launch decision framework (see `post-launch-iteration.md`):

| Signal | Decision |
|---|---|
| Users activate AND pay | ✅ Continue — focus on growth |
| Users activate but do not pay | Pricing or positioning problem — test pricing |
| Users sign up but do not activate | Onboarding problem — simplify the first experience |
| No signups | Distribution problem — try different channels |
| Signups from wrong audience | Positioning problem — narrow the segment |

### Launch is Not a One-Time Event

The first launch is the smallest. Plan follow-up launches:

- Week 2: Launch on a second channel.
- Week 4: Share a case study or result from early users.
- Month 2: Product Hunt launch (if not done on Day 1).
- Ongoing: Content + SEO (see `seo-aso-growth-research` skill).

## Common Mistakes

- Waiting until the product is "perfect" to launch. Ship when the core flow works.
- Launching everywhere on the same day. You cannot learn from 5 channels at once.
- Not having payments ready on launch day. Free signups do not validate paid demand.
- Not watching analytics on launch day. The first 24 hours are your highest-signal data.
- Treating low launch numbers as product failure. It is usually a distribution problem.
- Not talking to the first 10 users personally. Their feedback is worth more than 1000 analytics events.
