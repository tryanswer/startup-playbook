# GA4 Event Tracking Spec

Event tracking must be completed before product launch. A product without tracking is flying blind—you cannot determine whether users are receiving value, where they drop off, or why they don't pay.

## Setup Checklist

1. Register a Google Analytics 4 property.
2. Install `gtag.js` (Web) or Firebase SDK (App).
3. Enable Enhanced Measurement: page_view, scroll, outbound_click, file_download.
4. Configure the custom events below.
5. Mark key conversion events as Conversions in GA4 Admin.
6. Connect Google Search Console.
7. Connect Google Ads (if applicable).

## Required Events

Organized by AARRR framework. Each event uses snake_case naming with no more than 25 parameters.

### Acquisition

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `page_view` | Provided by Enhanced Measurement | page_location, page_referrer, source, medium, campaign | Traffic source attribution |
| `landing_page_view` | First load of landing page | page_variant, keyword, country, language | Landing page A/B testing |

### Activation

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `sign_up` | Registration completed | method (email/google/apple) | Registration conversion rate |
| `onboarding_complete` | Onboarding flow completed | steps_completed, time_seconds | Onboarding completion rate and time |
| `first_value_delivered` | User receives core value for the first time | feature_name, time_to_value_seconds | **Most important activation metric** |

### Engagement

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `feature_used` | Core feature used | feature_name, usage_count | Feature usage frequency |
| `content_generated` | User generates/receives output | content_type, quality_score | Core value delivery |
| `share` | User shares content | method, content_type | Organic spread |
| `feedback_submitted` | Feedback/rating submitted | rating, feedback_type | User satisfaction |

### Revenue

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `pricing_page_view` | Pricing page viewed | source_page | Payment interest |
| `checkout_start` | Payment flow started | plan_name, price, currency | Payment funnel entry |
| `purchase` | Payment successful | transaction_id, plan_name, value, currency | **Core revenue metric** |
| `subscription_renewed` | Renewal successful | plan_name, period, value | Renewal health |
| `refund` | Refund issued | transaction_id, reason | Refund reason analysis |

### Retention

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `session_start` | Provided by GA4 | engagement_time_msec | Return visit frequency |
| `return_visit` | Non-first visit and >24h since last | days_since_last_visit | Natural return signal |

## Must-Mark Conversions

In GA4 Admin → Events → Mark as Conversion:

1. `sign_up`
2. `first_value_delivered`
3. `purchase`
4. `checkout_start`

## User Properties

| Property | Value | Purpose |
|---|---|---|
| `user_plan` | free / trial / paid / churned | Segment by payment status |
| `user_signup_date` | ISO date | Cohort analysis |
| `user_country` | ISO code | Geographic segmentation |
| `user_language` | en / zh / ja ... | Localization effectiveness |

## Implementation Example (gtag.js)

```javascript
// Registration completed
gtag('event', 'sign_up', { method: 'google' });

// First core value delivered
gtag('event', 'first_value_delivered', {
  feature_name: 'color_analysis',
  time_to_value_seconds: 45
});

// Payment successful
gtag('event', 'purchase', {
  transaction_id: 'T12345',
  plan_name: 'pro_monthly',
  value: 9.99,
  currency: 'USD'
});
```

## Debug

1. Use GA4 DebugView to verify events in real-time.
2. Install the Chrome extension Google Analytics Debugger.
3. Confirm data appears in Realtime reports within 24-48 hours after launch.

## Common Mistakes

- Using camelCase instead of snake_case for event names, causing GA4 to fail automatic categorization.
- Marking all events as Conversions, diluting true conversion signals.
- Missing `first_value_delivered` event, making it impossible to determine if users are truly activated.
- Discovering missing key events only after launch, losing initial data.
- Hardcoding parameter values instead of passing them dynamically, resulting in unanalyzable data.
