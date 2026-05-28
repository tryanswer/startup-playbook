# GA4 Event Tracking Spec

产品上线前必须完成埋点。没有埋点的产品等于盲飞——无法判断用户是否获得价值、在哪流失、为什么不付费。

## Setup Checklist

1. 注册 Google Analytics 4 property。
2. 安装 `gtag.js`（Web）或 Firebase SDK（App）。
3. 启用 Enhanced Measurement：page_view、scroll、outbound_click、file_download。
4. 配置下方的自定义事件。
5. 在 GA4 后台将关键转化事件标记为 Conversion。
6. 连接 Google Search Console。
7. 连接 Google Ads（如有）。

## Required Events

按 AARRR 分层。每个事件保持 snake_case 命名，参数不超过 25 个。

### Acquisition（获客）

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `page_view` | Enhanced Measurement 自带 | page_location, page_referrer, source, medium, campaign | 流量来源归因 |
| `landing_page_view` | 落地页首次加载 | page_variant, keyword, country, language | 落地页 A/B 测试 |

### Activation（激活）

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `sign_up` | 注册完成 | method (email/google/apple) | 注册转化率 |
| `onboarding_complete` | 引导流程完成 | steps_completed, time_seconds | 引导完成率和耗时 |
| `first_value_delivered` | 用户首次获得核心价值 | feature_name, time_to_value_seconds | **最重要的激活指标** |

### Engagement（参与）

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `feature_used` | 使用核心功能 | feature_name, usage_count | 功能使用频率 |
| `content_generated` | 用户生成/获得产出物 | content_type, quality_score | 核心价值交付 |
| `share` | 用户分享内容 | method, content_type | 自然传播 |
| `feedback_submitted` | 提交反馈/评分 | rating, feedback_type | 用户满意度 |

### Revenue（收入）

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `pricing_page_view` | 查看定价页 | source_page | 付费兴趣 |
| `checkout_start` | 开始支付流程 | plan_name, price, currency | 支付漏斗入口 |
| `purchase` | 支付成功 | transaction_id, plan_name, value, currency | **核心收入指标** |
| `subscription_renewed` | 续费成功 | plan_name, period, value | 续费健康度 |
| `refund` | 退款 | transaction_id, reason | 退款原因分析 |

### Retention（留存）

| Event | Trigger | Key Parameters | Purpose |
|---|---|---|---|
| `session_start` | GA4 自带 | engagement_time_msec | 回访频率 |
| `return_visit` | 非首次访问且距上次 >24h | days_since_last_visit | 自然回访信号 |

## Must-Mark Conversions

在 GA4 Admin → Events → Mark as Conversion：

1. `sign_up`
2. `first_value_delivered`
3. `purchase`
4. `checkout_start`

## User Properties

| Property | Value | Purpose |
|---|---|---|
| `user_plan` | free / trial / paid / churned | 按付费状态分群 |
| `user_signup_date` | ISO date | Cohort 分析 |
| `user_country` | ISO code | 地域分群 |
| `user_language` | en / zh / ja ... | 本地化效果 |

## Implementation Example (gtag.js)

```javascript
// 注册完成
gtag('event', 'sign_up', { method: 'google' });

// 首次获得核心价值
gtag('event', 'first_value_delivered', {
  feature_name: 'color_analysis',
  time_to_value_seconds: 45
});

// 支付成功
gtag('event', 'purchase', {
  transaction_id: 'T12345',
  plan_name: 'pro_monthly',
  value: 9.99,
  currency: 'USD'
});
```

## Debug

1. 用 GA4 DebugView 实时验证事件。
2. 安装 Chrome 插件 Google Analytics Debugger。
3. 上线后 24-48 小时内确认 Realtime 报告有数据。

## Common Mistakes

- 事件名用 camelCase 而非 snake_case，导致 GA4 无法自动归类。
- 把所有事件都标为 Conversion，稀释了真正的转化信号。
- 没有 `first_value_delivered` 事件，无法判断用户是否真正激活。
- 上线后才发现漏埋关键事件，丢失初始数据。
- 参数值硬编码而非动态传入，导致数据不可分析。
