# 国内埋点规范（百度统计 + 友盟+）

面向中国大陆市场的产品埋点方案。百度统计覆盖 Web，友盟+ 覆盖 App，两者均免费且无需翻墙。

## 工具选择

| 产品形态 | 推荐工具 | 备选 |
|---|---|---|
| Web / H5 | 百度统计 | 神策数据、GrowingIO |
| iOS / Android App | 友盟+（U-App） | 神策数据、火山引擎增长分析 |
| 微信小程序 | 微信小程序数据助手 + 自定义埋点 | 神策小程序 SDK |
| Web + App 同时有 | 百度统计 + 友盟+ 各管各 | 神策（全端统一） |

## 百度统计（Web）

### Setup

1. 注册 [百度统计](https://tongji.baidu.com)。
2. 创建站点，获取站点 ID 和跟踪代码。
3. 在页面 `<head>` 中插入跟踪代码。
4. 开启「事件分析」和「转化分析」模块。
5. 在百度搜索资源平台验证站点（SEO 数据来源）。

### 基础跟踪代码

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

### 自定义事件（按 AARRR 分层）

百度统计事件格式：`_hmt.push(['_trackEvent', category, action, label, value])`

#### Acquisition（获客）

| Event | Category | Action | Label | Purpose |
|---|---|---|---|---|
| 落地页浏览 | `landing` | `view` | page_variant | 落地页 A/B 测试 |
| 广告点击来源 | `acquisition` | `ad_click` | channel_name | 渠道效果追踪 |

#### Activation（激活）

| Event | Category | Action | Label | Purpose |
|---|---|---|---|---|
| 注册完成 | `user` | `sign_up` | method | 注册转化率 |
| 引导完成 | `user` | `onboarding_complete` | steps | 引导流程完成率 |
| 首次获得价值 | `product` | `first_value_delivered` | feature_name | **核心激活指标** |

#### Engagement（参与）

| Event | Category | Action | Label | Purpose |
|---|---|---|---|---|
| 功能使用 | `product` | `feature_used` | feature_name | 功能使用频率 |
| 内容生成 | `product` | `content_generated` | content_type | 核心价值交付 |
| 分享 | `social` | `share` | method | 自然传播 |
| 反馈提交 | `feedback` | `submitted` | rating | 满意度 |

#### Revenue（收入）

| Event | Category | Action | Label | Value |
|---|---|---|---|---|
| 查看定价 | `payment` | `pricing_view` | source_page | — |
| 开始支付 | `payment` | `checkout_start` | plan_name | price |
| 支付成功 | `payment` | `purchase` | plan_name | price |
| 续费 | `payment` | `renewal` | plan_name | price |

### 实现示例

```javascript
// 注册完成
_hmt.push(['_trackEvent', 'user', 'sign_up', 'wechat']);

// 首次获得核心价值
_hmt.push(['_trackEvent', 'product', 'first_value_delivered', 'color_analysis', 45]);

// 支付成功
_hmt.push(['_trackEvent', 'payment', 'purchase', 'pro_monthly', 29.9]);
```

### 转化目标设置

在百度统计后台 → 管理 → 目标设置中配置：

1. 注册转化：事件 category=user, action=sign_up
2. 激活转化：事件 category=product, action=first_value_delivered
3. 支付转化：事件 category=payment, action=purchase

## 友盟+（App）

### Setup

1. 注册 [友盟+](https://www.umeng.com)。
2. 创建应用，获取 AppKey。
3. 集成 SDK（iOS CocoaPods / Android Gradle）。
4. 初始化 SDK 并配置自定义事件。

### 自定义事件

友盟+ 事件格式：`MobclickAgent.onEvent(context, eventId, params)`

| Event ID | Params | Purpose |
|---|---|---|
| `sign_up` | `{method: "wechat"}` | 注册 |
| `first_value_delivered` | `{feature: "...", seconds: 45}` | 激活 |
| `feature_used` | `{name: "...", count: 1}` | 功能使用 |
| `checkout_start` | `{plan: "...", price: 29.9}` | 开始支付 |
| `purchase` | `{plan: "...", price: 29.9, currency: "CNY"}` | 支付成功 |

### iOS 示例 (Swift)

```swift
// 注册
MobClick.event("sign_up", attributes: ["method": "wechat"])

// 支付
MobClick.event("purchase", attributes: ["plan": "pro_monthly", "price": "29.9"])
```

### Android 示例 (Kotlin)

```kotlin
// 注册
MobclickAgent.onEvent(context, "sign_up", mapOf("method" to "wechat"))

// 支付
MobclickAgent.onEvent(context, "purchase", mapOf("plan" to "pro_monthly", "price" to "29.9"))
```

## 微信小程序

使用微信自带分析 + 自定义上报：

```javascript
// 自定义事件上报到微信
wx.reportEvent('sign_up', { method: 'wechat_miniprogram' });

// 如果同时接入了百度统计小程序 SDK
swan.reportAnalytics('purchase', { plan: 'pro_monthly', price: 29.9 });
```

## 隐私合规（《个人信息保护法》）

1. App 首次启动必须弹出隐私政策弹窗，用户同意后才初始化 SDK。
2. 不得在用户同意前采集设备 ID、位置等信息。
3. 隐私政策中必须列出使用的第三方 SDK（百度统计、友盟+）。
4. 提供关闭个性化追踪的选项。

```javascript
// 友盟+ 延迟初始化示例
if (userConsentGiven) {
  UMConfigure.init(context, appKey, channel, deviceType, pushSecret);
}
```

## 百度统计 vs GA4 事件映射

| GA4 Event | 百度统计 Event | 说明 |
|---|---|---|
| `gtag('event', 'sign_up')` | `_hmt.push(['_trackEvent', 'user', 'sign_up'])` | 格式不同，语义一致 |
| `gtag('event', 'purchase', {value})` | `_hmt.push(['_trackEvent', 'payment', 'purchase', plan, value])` | 百度用 label+value 传参 |
| `gtag('set', 'user_properties')` | 百度统计不支持原生 user properties | 需要用自定义维度或后端关联 |

## Debug

- **百度统计**：安装 Chrome 插件「百度统计流量检测工具」，或在后台 → 实时访客中验证。
- **友盟+**：使用友盟+「集成测试」模式，设备注册为测试设备后可实时查看事件。
- 上线后 2-4 小时内确认后台有数据（百度统计有数据延迟，不像 GA4 有 Realtime）。

## Common Mistakes

- 百度统计 category/action/label 不统一命名，导致事件分散无法汇总。
- 友盟+ 事件 ID 超过 500 个（免费版限制），需要合并低频事件。
- 小程序忘记在 `app.json` 中配置 `reportAnalytics`。
- 没有做隐私合规弹窗，上架应用市场被拒。
- 百度统计和友盟+ 各自为战，没有统一的用户 ID 关联，导致跨端数据断裂。
