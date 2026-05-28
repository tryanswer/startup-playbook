# Google Search Console Guide

Search Console 是 SEO 增长的核心数据源。它告诉你用户在 Google 搜索什么词时看到了你、点没点、排第几。这些数据直接决定内容策略和页面优化方向。

## Setup

1. 在 [Google Search Console](https://search.google.com/search-console) 添加网站。
2. 推荐使用 Domain property（覆盖所有子域）。
3. 通过 DNS TXT 记录验证所有权。
4. 提交 sitemap.xml。
5. 连接 GA4：GA4 Admin → Product links → Search Console。
6. 连接 Looker Studio 用于周复盘。

## Key Reports

### Performance Report

核心报告，每周必看。

| Metric | Meaning | Action |
|---|---|---|
| Impressions | 搜索结果里出现了多少次 | 曝光多但点击少 = 标题/描述需优化 |
| Clicks | 用户点击进入了多少次 | 核心流量指标 |
| CTR | 点击率 = clicks / impressions | < 1% 需要优化 snippet |
| Position | 平均排名 | 排名 5-15 的词 = 最大优化机会 |

**按维度拆分：**

- **Queries**：用户搜的具体词 → 发现新的内容机会和用户语言
- **Pages**：哪些页面获得流量 → 集中优化高潜力页
- **Countries**：哪个国家搜索多 → 指导本地化优先级
- **Devices**：移动 vs 桌面 → 指导响应式优先级

### Index Coverage

| Status | Meaning | Action |
|---|---|---|
| Valid | 已被索引 | 正常 |
| Excluded | 被排除 | 检查是否有重要页面被误排 |
| Error | 索引失败 | 立即修复（404、500、redirect loop） |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

性能差直接影响排名。Poor 状态必须修复。

## Weekly SEO Actions

1. 打开 Performance → 选过去 7 天 vs 前 7 天对比。
2. 找 **impressions 高但 CTR 低** 的词 → 优化标题和 meta description。
3. 找 **position 5-15** 的词 → 这些最容易通过内容优化进前 5。
4. 找 **新出现的 queries** → 发现用户新需求。
5. 找 **impressions 下降的词** → 检查排名是否被竞品超过。
6. 检查 Index Coverage 错误 → 确保新页面被收录。

## Content Strategy From Search Data

```
Search Console 数据 → 找到用户在搜什么
        ↓
把 queries 按意图分类：问题/方案/对比/购买
        ↓
用高 impression 低 CTR 的词优化现有页面
        ↓
用 position 5-15 的词创建或扩充内容
        ↓
用新出现的 queries 做新内容实验
        ↓
下周复盘：排名是否上升、CTR 是否提高
```

## Integration With GA4

连接后可以在 GA4 中看到：

- 哪些搜索词带来了 `sign_up` 和 `purchase` 转化。
- 自然搜索流量的激活率 vs 其他渠道对比。
- 特定落地页的从搜索到转化的完整漏斗。

这比单看 Search Console 更有价值——不只看"来了多少人"，而是看"来的人有没有付费"。

## Common Mistakes

- 只看 impressions 不看 CTR，以为曝光多就是好事。
- 忽略 position 5-15 的机会词，只关注已经排名第一的词。
- 不看 countries 维度，错过非英语市场机会。
- 不把 Search Console 连 GA4，无法判断搜索流量的质量。
- 页面改了标题但不追踪 CTR 变化，无法验证优化效果。
