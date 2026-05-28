# China Analytics Tracking Spec (Baidu Analytics + Umeng+)

Event tracking specification for products targeting the mainland China market. Baidu Analytics covers Web, while Umeng+ covers Apps. Both are free and do not require VPN access.

## Tool Selection

| Product Type | Recommended Tool | Alternative |
|---|---|---|
| Web / H5 | Baidu Analytics (百度统计) | Sensors Data, GrowingIO |
| iOS / Android App | Umeng+ (U-App) | Sensors Data, Volcano Engine Growth Analysis |
| WeChat Mini Program | WeChat Mini Program Data Assistant + Custom Tracking | Sensors Data Mini Program SDK |
| Both Web + App | Baidu Analytics + Umeng+ separately | Sensors Data (unified cross-platform) |

## Baidu Analytics (Web)

### Setup

1. Register at [Baidu Analytics](https://tongji.baidu.com).
2. Create a site, obtain the Site ID and tracking code.
3. Insert the tracking code in the page `<head>`.
4. Enable "Event Analysis" and "Conversion Analysis" modules.
5. Verify the site on Baidu Search Resource Platform (for SEO data source).

### Basic Tracking Code

```html
<script>
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?YOUR_SITE_ID";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
</script>
```

### Custom Events (Organized by AARRR Framework)

Baidu Analytics event format: `_hmt.push(['_trackEvent', category, action, label, value])`

#### Acquisition

| Event | Category | Action | Label | Purpose |
|---|---|---|---|---|
| Landing page view | `landing` | `view` | page_variant | Landing page A/B testing |
| Ad click source | `acquisition` | `ad_click` | channel_name | Channel effectiveness tracking |

#### Activation

| Event | Category | Action | Label | Purpose |
|---|---|---|---|---|
| Registration completed | `user` | `sign_up` | method | Registration conversion rate |
| Onboarding completed | `user` | `onboarding_complete` | steps | Onboarding flow completion rate |
| First value delivered | `product` | `first_value_delivered` | feature_name | **Core activation metric** |

#### Engagement

| Event | Category | Action | Label | Purpose |
|---|---|---|---|---|
| Feature used | `product` | `feature_used` | feature_name | Feature usage frequency |
| Content generated | `product` | `content_generated` | content_type | Core value delivery |
| Share | `social` | `share` | method | Organic spread |
| Feedback submitted | `feedback` | `submitted` | rating | Satisfaction |

#### Revenue

| Event | Category | Action | Label | Value |
|---|---|---|---|---|
| View pricing | `payment` | `pricing_view` | source_page | — |
| Start checkout | `payment` | `checkout_start` | plan_name | price |
| Purchase successful | `payment` | `purchase` | plan_name | price |
| Renewal | `payment` | `renewal` | plan_name | price |

### Implementation Example

```javascript
// Registration completed
_hmt.push(['_trackEvent', 'user', 'sign_up', 'wechat']);

// First core value delivered
_hmt.push(['_trackEvent', 'product', 'first_value_delivered', 'color_analysis', 45]);

// Payment successful
_hmt.push(['_trackEvent', 'payment', 'purchase', 'pro_monthly', 29.9]);
```

### Conversion Goal Setup

In Baidu Analytics Admin → Management → Goal Settings:

1. Registration conversion: Event category=user, action=sign_up
2. Activation conversion: Event category=product, action=first_value_delivered
3. Payment conversion: Event category=payment, action=purchase

## Umeng+ (App)

### Setup

1. Register at [Umeng+](https://www.umeng.com).
2. Create an app, obtain the AppKey.
3. Integrate the SDK (iOS CocoaPods / Android Gradle).
4. Initialize the SDK and configure custom events.

### Custom Events

Umeng+ event format: `MobclickAgent.onEvent(context, eventId, params)`

| Event ID | Params | Purpose |
|---|---|---|
| `sign_up` | `{method: "wechat"}` | Registration |
| `first_value_delivered` | `{feature: "...", seconds: 45}` | Activation |
| `feature_used` | `{name: "...", count: 1}` | Feature usage |
| `checkout_start` | `{plan: "...", price: 29.9}` | Start checkout |
| `purchase` | `{plan: "...", price: 29.9, currency: "CNY"}` | Payment successful |

### iOS Example (Swift)

```swift
// Registration
MobClick.event("sign_up", attributes: ["method": "wechat"])

// Payment
MobClick.event("purchase", attributes: ["plan": "pro_monthly", "price": "29.9"])
```

### Android Example (Kotlin)

```kotlin
// Registration
MobclickAgent.onEvent(context, "sign_up", mapOf("method" to "wechat"))

// Payment
MobclickAgent.onEvent(context, "purchase", mapOf("plan" to "pro_monthly", "price" to "29.9"))
```

## WeChat Mini Program

Use WeChat's built-in analytics + custom reporting:

```javascript
// Custom event reporting to WeChat
wx.reportEvent('sign_up', { method: 'wechat_miniprogram' });

// If Baidu Analytics Mini Program SDK is also integrated
swan.reportAnalytics('purchase', { plan: 'pro_monthly', price: 29.9 });
```

## Privacy Compliance (Personal Information Protection Law)

1. Apps must display a privacy policy popup on first launch, and only initialize the SDK after user consent.
2. Do not collect device ID, location, or other information before user consent.
3. The privacy policy must list all third-party SDKs used (Baidu Analytics, Umeng+).
4. Provide an option to disable personalized tracking.

```javascript
// Umeng+ delayed initialization example
if (userConsentGiven) {
  UMConfigure.init(context, appKey, channel, deviceType, pushSecret);
}
```

## Baidu Analytics vs GA4 Event Mapping

| GA4 Event | Baidu Analytics Event | Notes |
|---|---|---|
| `gtag('event', 'sign_up')` | `_hmt.push(['_trackEvent', 'user', 'sign_up'])` | Different format, same semantics |
| `gtag('event', 'purchase', {value})` | `_hmt.push(['_trackEvent', 'payment', 'purchase', plan, value])` | Baidu uses label+value for parameters |
| `gtag('set', 'user_properties')` | Baidu Analytics does not support native user properties | Requires custom dimensions or backend association |

## Debug

- **Baidu Analytics**: Install the Chrome extension "Baidu Analytics Traffic Detection Tool", or verify in Admin → Real-time Visitors.
- **Umeng+**: Use Umeng+ "Integration Test" mode; after registering devices as test devices, events can be viewed in real-time.
- Confirm data appears in the admin panel within 2-4 hours after launch (Baidu Analytics has data delay, unlike GA4's Realtime).

## Common Mistakes

- Inconsistent naming of Baidu Analytics category/action/label, causing events to be scattered and unaggregatable.
- Umeng+ event IDs exceeding 500 (free version limit), requiring merging of low-frequency events.
- Forgetting to configure `reportAnalytics` in `app.json` for mini programs.
- Missing privacy compliance popups, leading to rejection from app stores.
- Baidu Analytics and Umeng+ operating separately without unified user ID association, resulting in fragmented cross-platform data.
