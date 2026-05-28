---
name: business-model-design
description: Use when a founder needs to choose a business model, design pricing, plan revenue progression, or decide between subscription/one-time/service/freemium based on product type, user segment, and market evidence. Derived from 499 Indie Hackers case patterns.
---

# Business Model Design

Use this skill after idea validation passes. The goal is to match the product positioning to the right business model, pricing structure, and revenue progression path — not to guess, but to use evidence from 499 founder cases.

## Core Principle

> 商业模式不是拍脑袋选的，是由产品定位决定的。产品定位 = 谁的什么痛 + 多频繁 + 多愿意付费。

## Step 1: Classify Product Positioning

先回答四个问题，确定产品定位类型：

| Question | Options | Implications |
|---|---|---|
| **用户是谁？** | B2B / B2C / Prosumer / Developer | 决定客单价和获客方式 |
| **解决的是多频繁的问题？** | 每天 / 每周 / 每月 / 偶尔 | 决定订阅 vs 一次性 |
| **用户当前替代方案是什么？** | 手动做 / 用竞品 / 不做 / 找人做 | 决定定价锚点 |
| **交付物是什么？** | 工具 / 内容 / 服务 / 数据 / 模板 | 决定商业模式 |

## Step 2: Match Business Model

基于 499 个案例的统计分布，按产品定位推荐商业模式：

### Model A: SaaS 订阅（479/499 案例，96%）

**适合**：用户需要持续使用的工具型产品。

| Signal | Evidence |
|---|---|
| 使用频率 | 每天或每周 |
| 替代方案 | 用户现在手动做，或用功能不够的免费工具 |
| 交付物 | 持续运行的工具 / dashboard / 自动化 |
| 典型客单价 | $9-49/mo (B2C/Prosumer), $49-299/mo (B2B), $299+/mo (Enterprise) |

**定价阶梯**：

```
免费试用 (7-14 天，不是 freemium)
    ↓
Starter: $9-19/mo — 个人用户，核心功能
    ↓
Pro: $29-49/mo — 高级功能，更多用量
    ↓
Team/Business: $99-299/mo — 多人协作，优先支持
    ↓
Enterprise: 按需报价 — 定制、SLA、专属部署
```

**案例证据**：93% 的成功 indie hacker 使用订阅制。订阅的核心优势是 **MRR 可预测**，让创始人能规划而不是靠单次爆发。

**关键规则**：
- 不要从 freemium 开始，除非产品有明确的网络效应或病毒传播机制（只有 22% 的案例用 freemium）。
- 免费试用 > freemium。试用有时间压力促成转化，freemium 容易养出永远不付费的用户。
- 价格定在用户替代方案成本的 1/3 到 1/2。如果用户现在花 $100/月雇人做，定价 $29-49/月。

### Model B: Productized Service（151/499 案例，30%）

**适合**：从服务起步，逐步产品化的路径。这是 indie hacker 最安全的起步方式。

| Signal | Evidence |
|---|---|
| 使用频率 | 每周到每月 |
| 替代方案 | 用户现在雇人做或找 freelancer |
| 交付物 | 标准化的服务成果 |
| 典型客单价 | $200-2000/次 或 $500-5000/月 |

**进化路径**：

```
阶段 1: 纯手动服务
  ↓  收费验证需求，积累交付经验
  ↓  找到最可重复的部分
阶段 2: 半自动化
  ↓  用工具替代 50% 的手动工作
  ↓  服务价格不变，利润率提升
阶段 3: 全自动 SaaS
  ↓  客户自助使用，按月订阅
  ↓  保留高端服务作为 premium tier
```

**案例证据**：72% 的成功案例先做了 manual service。$1.7M/yr 的咨询公司就是把一个 2 周服务产品化。

**关键规则**：
- 先收服务费再写代码。如果没人愿意为手动服务付费，自动化版本也不会有人买。
- 服务定价比 SaaS 高是正常的——你在卖时间和专业性。
- 保留 "Done for you" 选项作为最高价 tier，即使产品已经自动化。

### Model C: 内容/课程/模板（242+85 案例，49%+17%）

**适合**：知识型产品，创始人有专业领域经验。

| Signal | Evidence |
|---|---|
| 使用频率 | 一次性学习 + 偶尔回顾 |
| 替代方案 | 免费博客/YouTube/文档 |
| 交付物 | 课程 / 电子书 / 模板 / 社区 |
| 典型客单价 | $29-199 一次性，或 $9-29/mo 社区订阅 |

**定价模型**：

```
Option A: 一次性付费课程
  $29-99 入门课 → $199-499 高级课 → $999+ 辅导包

Option B: 模板/资源包
  $19-49 单个模板 → $99-199 全套包 → 持续更新订阅

Option C: 付费社区
  $9-29/mo 社区会员 → 包含课程+模板+社区+直播
```

**关键规则**：
- 一次性付费产品需要持续获取新客，没有 MRR 的安全感。优先考虑 **课程 + 社区订阅** 的组合。
- 模板是最快盈利的产品形态——开发周期短、边际成本零。
- 不要和免费内容竞争功能，竞争 **结构化 + 省时间 + 社区归属感**。

### Model D: Marketplace / 平台（69 案例，14%）

**适合**：连接供需双方的产品。风险最高，回报最大。

| Signal | Evidence |
|---|---|
| 使用频率 | 取决于品类 |
| 替代方案 | 用户在其他平台或线下交易 |
| 交付物 | 交易撮合 + 信任保障 |
| 典型抽成 | 5-20% 交易佣金 |

**关键规则**：
- 只有 14% 的案例走 marketplace 路径，因为冷启动极难。
- 先做 **一端的工具**，再扩展成平台。例如先做「给卖家的管理工具」，积累卖家后再引入买家。
- 不要试图做通用平台，先做 **垂直品类** 的撮合。

### Model E: Developer Tool / API（438 案例，88%）

**适合**：面向开发者的工具、SDK、API 服务。

| Signal | Evidence |
|---|---|
| 使用频率 | 集成后持续使用 |
| 替代方案 | 自己写、用开源替代 |
| 交付物 | API / SDK / CLI / SaaS 工具 |
| 典型定价 | Free tier + Usage-based + Team plan |

**定价模型**：

```
Free: 有限额度（吸引开发者试用）
    ↓
Pro: $29-99/mo 或按用量 — 生产环境使用
    ↓
Team: $99-299/mo — 多人协作 + 更高额度
    ↓
Enterprise: 按需 — SLA + 私有部署 + 优先支持
```

**关键规则**：
- 开发者工具几乎必须有 free tier（但不是无限免费）。
- 按用量计费（usage-based）是开发者最能接受的模式——用多少付多少。
- 文档是产品的一部分。差文档 = 差产品。

## Step 3: Revenue Progression Path

不管选哪个模式，indie hacker 的收入增长路径通常遵循这个阶段：

```
$0 → $1 MRR        验证期（1-4 周）
  方法：手动服务 / 预售 / 咨询
  目标：找到 1 个付费用户
  
$1 → $1K MRR       种子期（1-3 个月）
  方法：产品上线 + 内容获客 + 社区参与
  目标：找到 10-30 个付费用户
  关键：确认用户在续费，不只是尝鲜
  
$1K → $10K MRR     增长期（3-12 个月）
  方法：SEO + 内容 + 口碑 + 一个主渠道
  目标：找到可重复的获客渠道
  关键：CAC < LTV/3，留存 > 85%/月
  
$10K → $50K MRR    规模期（6-24 个月）
  方法：扩渠道 + 加价 + 企业客户 + 合作伙伴
  目标：建立可预测的增长引擎
  关键：从创始人驱动转向系统驱动
```

### Revenue Milestones Decision

| MRR | Decision |
|---|---|
| $0 持续 4 周 | 回到验证阶段，检查需求是否真实 |
| < $500 持续 3 个月 | 审视定价——是太低还是产品价值不够 |
| $1K-3K 增长停滞 | 增长瓶颈通常在获客渠道，不在产品功能 |
| $5K+ 但留存 < 80% | 产品价值不够持续，修产品比扩渠道重要 |
| $10K+ 留存 > 90% | 可以考虑全职投入 |

## Step 4: Pricing Design Checklist

| Rule | Evidence |
|---|---|
| **价格要明确标出来** | 96% 的案例有清晰价格（478/499） |
| **默认用订阅制** | 93% 的案例用订阅（464/499） |
| **不要太便宜** | 太低的价格吸引低质量用户，且无法覆盖获客成本 |
| **年付打折** | 提供年付 = 月付 × 10（省 2 个月），改善现金流 |
| **价格随价值涨** | 第一年至少涨价一次，早期用户锁定老价格 |
| **企业客户另算** | Enterprise 不放在定价页，用"联系我们"收更高价 |
| **先贵后便宜** | 先从高价服务开始，验证后再降到 SaaS 价格 |

## Step 5: Anti-Patterns

从案例中总结的失败模式：

| Anti-Pattern | Why It Fails | Better Move |
|---|---|---|
| 全免费 + 未来再想怎么收费 | 免费用户不会自动变成付费用户 | 第一天就收费，哪怕很少 |
| Freemium 无上限 | 免费版太好，没人升级 | 免费版有明确限制 |
| 只做一次性付费 | 没有 MRR，需要持续找新客 | 加入订阅或持续服务 |
| 按成本定价 | 用户不关心你的成本 | 按用户获得的价值定价 |
| 模仿大公司定价 | 大公司有品牌、流量、销售团队 | 按 indie hacker 的获客能力定价 |
| 做平台从 Day 1 | 冷启动需要两端同时有人 | 先做一端的工具 |
| 不涨价 | 低价限制了增长天花板 | 定期涨价，老用户锁定 |

## Conditional Rules

- If **user pain is daily and tool-shaped** → SaaS subscription, start at $19-49/mo.
- If **founder has domain expertise but no product** → productized service first, automate later.
- If **product is knowledge/framework** → course + community subscription combo.
- If **users are developers** → free tier + usage-based pricing.
- If **market is B2B** → start pricing 3-5x higher than instinct suggests.
- If **market is B2C** → keep price low ($5-19/mo) but focus on volume and retention.
- If **no one pays in 4 weeks** → the problem is positioning or demand, not features.
- If **users pay but churn fast** → the product delivers initial value but not ongoing value; add retention hooks.
- If **users love the product but won't pay** → reposition from "nice to have" to "must have", or find a different buyer.

## Integration With Other Skills

1. Use `idea-validation` to confirm demand before choosing a model.
2. Use `founder-case-patterns` to find comparable cases and their pricing/channel/model.
3. Use `product-development-loop` to scope the MVP after model is chosen.
4. Use `seo-aso-growth-research` to validate the acquisition channel implied by the model.
5. Use this skill's revenue progression path during `weekly-review-dashboard` to set MRR targets.

## Evidence Base

- 499 Indie Hackers cases analyzed.
- 498 readable, 1 failed (historical 404).
- Top business model: SaaS (479).
- Top pricing: subscription (464).
- Top validation: community-pain (418) + manual-service (357).
- Top acquisition: content (394) + community (252) + SEO (235).
- Confidence: strong for SaaS/subscription/content patterns; moderate for marketplace/ecommerce (smaller sample).
