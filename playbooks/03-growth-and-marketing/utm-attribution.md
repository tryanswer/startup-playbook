# UTM Attribution Spec

Standardize UTM parameter naming. If each channel uses different UTM naming rules, GA4 channel data will be chaotic and attribution analysis impossible.

## UTM Parameters

| Parameter | Required | Purpose | Example |
|---|---|---|---|
| `utm_source` | Yes | Traffic source platform | google, reddit, twitter, youtube, newsletter |
| `utm_medium` | Yes | Traffic type | cpc, organic, social, email, referral |
| `utm_campaign` | Yes | Campaign name | launch_week, seo_test_may, ph_launch |
| `utm_content` | Optional | Distinguish different materials within the same campaign | hero_cta, sidebar_link, reply_v2 |
| `utm_term` | Optional | Paid keyword | best_color_analysis_app |

## Naming Rules

1. **All lowercase**, separated by underscores: `product_hunt` not `ProductHunt`.
2. **Source uses platform name**, not campaign name: `reddit` not `reddit_skincare_post`.
3. **Medium uses standard categories**, do not create your own:

| Medium | When |
|---|---|
| `cpc` | Paid clicks (Google Ads, Facebook Ads) |
| `organic` | Organic search |
| `social` | Social media organic posts |
| `email` | Email |
| `referral` | Links from other websites |
| `community` | Community replies (Reddit, HN, Discord) |
| `affiliate` | Affiliate referrals |
| `direct` | No UTM added, GA4 automatically attributes as direct |

4. **Campaign uses specific activities**, including time or purpose: `validation_may26` not `test`.

## URL Examples

```
# Reddit community reply
https://yourapp.com?utm_source=reddit&utm_medium=community&utm_campaign=skincare_validation&utm_content=reply_acne_thread

# Google Ads
https://yourapp.com?utm_source=google&utm_medium=cpc&utm_campaign=launch_week&utm_term=skin_analysis_app

# Product Hunt
https://yourapp.com?utm_source=producthunt&utm_medium=referral&utm_campaign=ph_launch_may

# Newsletter
https://yourapp.com?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_digest_w22

# YouTube video description
https://yourapp.com?utm_source=youtube&utm_medium=social&utm_campaign=demo_video_v1
```

## GA4 Attribution View

UTM parameters automatically populate the following dimensions in GA4:

| GA4 Dimension | Filled By |
|---|---|
| Session source | utm_source |
| Session medium | utm_medium |
| Session campaign | utm_campaign |
| Session manual ad content | utm_content |
| Session manual term | utm_term |

View conversions by these dimensions in GA4 → Reports → Acquisition → Traffic acquisition.

## Attribution Models

GA4 defaults to Data-driven attribution. For early-stage low data volume, Last click is recommended:

- **Last click**: The last click gets full credit. Simple and clear.
- **Data-driven**: GA4 uses machine learning to distribute credit. Requires sufficient conversion data (300+ conversions per month).

Last click is recommended for early-stage products, switch to Data-driven when data volume increases.

## Weekly Attribution Review

Answer these questions during weekly review:

1. Which source/medium brings the most `sign_up`?
2. Which source/medium brings the most `purchase`?
3. Is the channel with the most registrations the same as the one with the most payments? (Usually not)
4. Which campaign has the lowest CPA?
5. Are there channels that only bring registrations but never payments? → Consider stopping investment.

## Common Mistakes

- Inconsistent UTM capitalization: `Reddit` and `reddit` are two different sources in GA4.
- Adding UTM to internal links on your own website: This overwrites the original source, causing attribution errors. Do not add UTM to internal links.
- Not adding campaign parameter: All traffic mixes together, unable to distinguish which campaigns are effective.
- Losing UTM after using URL shortening services: Ensure shortening tools preserve parameters.
- Not documenting UTM rules: Team members use different naming conventions, making data unaggregatable.
