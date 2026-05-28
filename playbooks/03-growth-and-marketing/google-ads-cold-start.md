# Google Ads Cold Start Validation

用 $50-100 的小预算在 Google Ads 上快速验证付费意愿。比纯 SEO 快 10 倍得到反馈——SEO 要 3-6 个月见效，Ads 24 小时就有数据。

## When To Use

- idea 验证阶段：落地页做好了，需要快速导入精准流量。
- SEO 还没起量：自然搜索排名需要时间，先用付费流量测试转化。
- 验证关键词价值：哪些词搜索的用户真的会付费。
- 验证定价：用户看到价格后是否点击购买。

## Budget Rule

首次测试不超过 $100。目标不是盈利，是买到足够的数据做决策。

| 阶段 | 预算 | 目标 |
|---|---|---|
| 关键词验证 | $30-50 | 确认哪些词有点击、哪些没人搜 |
| 落地页转化测试 | $50-100 | 测试 CTA 点击率和注册/购买转化 |
| 扩量验证 | $100-300 | 确认 CPA 和 ROAS 是否可持续 |

## Setup Steps

### 1. Campaign Structure

```
Account
└── Campaign: [Product] - Search - Validation
    └── Ad Group 1: Problem keywords (用户搜痛点)
    └── Ad Group 2: Solution keywords (用户搜方案)
    └── Ad Group 3: Comparison keywords (用户搜对比)
```

### 2. Keyword Selection

从已有的 SEO 关键词研究中选取：

- **问题词**：`how to [solve pain]`、`why [problem] happens`
- **方案词**：`[solution] tool`、`best [solution] app`
- **对比词**：`[competitor] alternative`、`[tool A] vs [tool B]`
- **购买词**：`[solution] pricing`、`buy [solution]`

Tips：
- 用 Phrase Match 或 Exact Match，不要用 Broad Match（会烧预算在无关词上）。
- 每个 Ad Group 不超过 15 个关键词。
- 加 Negative Keywords 排除不相关搜索。

### 3. Ad Copy

用验证过的用户原话写广告文案，不要用营销套话。

```
Headline 1: [核心痛点，用用户原话]
Headline 2: [产品承诺，一句话]
Headline 3: [CTA: Free trial / See pricing / Get started]
Description: [场景 + 价值 + 行动]
```

### 4. Landing Page

指向已埋 GA4 事件的落地页。确保：

- 广告关键词和落地页标题一致（提高 Quality Score）。
- 页面有明确的转化动作（注册 / 购买 / 预约）。
- GA4 追踪 `landing_page_view` → `sign_up` / `checkout_start` → `purchase`。

### 5. Conversion Tracking

在 Google Ads 中导入 GA4 的转化事件：

- Primary conversion: `purchase` 或 `sign_up`
- Secondary conversion: `checkout_start`、`pricing_page_view`

## Reading The Data

24-48 小时后看第一批数据。

### Key Metrics

| Metric | Meaning | Healthy Range |
|---|---|---|
| Impressions | 广告展示次数 | > 100/day 说明有搜索量 |
| CTR | 广告点击率 | > 3% 算健康 |
| CPC | 单次点击成本 | 取决于行业，$0.5-5 常见 |
| Conversion Rate | 点击→转化 | > 2% 注册，> 1% 付费 |
| CPA | 单次转化成本 | 必须 < 用户 LTV |
| Search Terms | 用户实际搜索词 | 发现意料之外的需求 |

### Decision Framework

| Signal | Action |
|---|---|
| 高 impressions + 高 CTR + 有转化 | ✅ 需求验证通过，可以扩量或转 SEO |
| 高 impressions + 低 CTR | 广告文案不吸引人，重写 headline |
| 高 CTR + 零转化 | 落地页有问题，或产品承诺和搜索意图不匹配 |
| 低 impressions | 关键词搜索量不够，换词或换市场 |
| Search Terms 里出现意外高转化词 | 发现新的用户需求，加入 SEO 策略 |
| CPA > LTV | 付费获客不可持续，必须靠 SEO/内容/口碑 |

## Search Terms → SEO Feedback Loop

Google Ads 最大的隐藏价值：**Search Terms 报告**。

```
Ads Search Terms 报告 → 发现用户真实搜索词
        ↓
高转化词 → 写 SEO 内容覆盖这些词
        ↓
Search Console 追踪自然排名
        ↓
排名上来后 → 暂停对应 Ads 关键词
        ↓
Ads 预算转移到下一批待验证的词
```

这样 Ads 不是持续的成本，而是 SEO 的加速器。

## Common Mistakes

- 用 Broad Match 导致预算花在无关搜索上。
- 落地页和广告文案不一致，Quality Score 低、CPC 高。
- 没设每日预算上限，一夜花光。
- 只看 CTR 不看转化，点击多不代表有价值。
- 跑了 1 天就下结论——至少跑 3-5 天、积累 100+ 点击再决策。
- 不看 Search Terms 报告，错过最有价值的用户洞察。
