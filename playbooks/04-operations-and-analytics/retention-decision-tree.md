# Retention Analysis Decision Tree

留存是产品是否有核心价值的终极指标。增长可以靠渠道，留存只能靠产品。

## Core Metrics

| Metric | Definition | Source | Healthy Benchmark |
|---|---|---|---|
| D1 Retention | 次日回访率 | GA4 Cohort | > 20% |
| D7 Retention | 7 日回访率 | GA4 Cohort | > 15% |
| D30 Retention | 30 日回访率 | GA4 Cohort | > 10% |
| Weekly Active Rate | WAU / Total registered | GA4 Active users | > 25% |
| Feature Return Rate | 同一功能的重复使用率 | GA4 feature_used event | > 30% |
| Activation → Retention | first_value_delivered 后的 D7 留存 | GA4 Segment | > 30% |

Note: benchmarks vary by product type. SaaS tools tend higher, consumer apps tend lower.

## GA4 Setup For Retention

1. **Cohort Exploration**: GA4 → Explore → Cohort exploration
   - Cohort inclusion: `first_visit` or `sign_up`
   - Return criteria: `session_start` or `feature_used`
   - Granularity: Daily or Weekly
2. **Segment comparison**: 比较 activated (fired `first_value_delivered`) vs non-activated 用户的留存曲线
3. **User lifetime**: GA4 → Reports → Retention → User retention 看整体趋势

## Decision Tree

### D1 Retention

```
D1 < 10%
├── 用户是否完成了 onboarding？
│   ├── No → 修复引导流程，降低首次使用门槛
│   └── Yes → 核心价值交付太慢或太弱
│       ├── time_to_value > 2 min → 缩短首次价值路径
│       └── time_to_value < 2 min → 产品价值主张可能不成立
│           → 回到 idea validation，做用户访谈

D1 10-20%
├── 正常范围，关注激活率
│   ├── 激活率 < 40% → 优化 onboarding
│   └── 激活率 > 40% → 关注 D7

D1 > 20%
└── 健康。继续关注 D7 和付费转化。
```

### D7 Retention

```
D7 < 5%
├── 产品是一次性使用还是应该重复使用？
│   ├── 一次性 → 考虑转型为付费工具（一次付费）而非订阅
│   └── 应重复使用 → 用户没有回来的理由
│       ├── 有没有推送/邮件提醒？ → 加入轻量触达
│       ├── 有没有新内容/新数据？ → 需要回访价值
│       └── 用户完成任务后还需要什么？ → 做用户访谈

D7 5-15%
├── 有潜力但需优化
│   ├── 看 activated vs non-activated 的 D7 差异
│   │   ├── 差异 > 2x → 激活是关键，优化 first_value_delivered 路径
│   │   └── 差异 < 2x → 激活后的价值也不够，需要深层产品改进
│   └── 看不同获客渠道的 D7 差异
│       ├── 某渠道特别高 → 该渠道用户更精准，加码
│       └── 全部差不多低 → 产品问题而非渠道问题

D7 15-30%
├── 健康范围。关注付费转化和 D30。

D7 > 30%
└── 优秀。产品有核心价值，关注增长和变现。
```

### D30 Retention

```
D30 < 5%
├── 长期价值缺失
│   ├── 用户的痛点是一次性的吗？ → 调整商业模式
│   └── 有竞品在抢用户吗？ → 竞品分析 + 差异化
│   └── 用户忘了产品存在？ → 建立触达机制

D30 5-10%
├── 可接受但需要提升
│   ├── 加入 lifecycle email / push
│   ├── 增加使用场景（新功能或新用例）
│   └── 建立用户社区

D30 > 10%
└── 健康。有付费基础。关注 LTV 和 NRR。
```

## Retention By Segment

不要只看整体留存。按以下维度拆分：

| Segment | How | Purpose |
|---|---|---|
| Activated vs Not | GA4 segment: fired first_value_delivered | 验证激活是否是留存的关键杠杆 |
| Paid vs Free | GA4 user property: user_plan | 付费用户留存是否显著更高 |
| By Source | GA4 first user source | 哪个渠道的用户质量最高 |
| By Country | GA4 user property: user_country | 不同市场的产品适配度 |
| By Feature | GA4 feature_used event | 用了哪个功能的用户留存更好 |

## Actionable Patterns

| Pattern | Meaning | Action |
|---|---|---|
| Activated 留存 >> Non-activated | 激活是杠杆 | All-in 优化 onboarding 和 first_value |
| 某渠道留存 >> 其他 | 该渠道用户更匹配 | 加码该渠道，研究用户画像差异 |
| 某功能用户留存高 | 该功能是核心价值 | 推动更多用户使用该功能 |
| 付费用户留存 >> 免费 | 付费筛选了高意向用户 | 提高付费门槛不一定是坏事 |
| 所有 segment 留存都低 | 产品价值不足 | 回到 idea validation |

## Weekly Retention Check

在周复盘 dashboard 中回答：

1. 本周 cohort 的 D1 是否高于上周？
2. Activated 用户占比是否在增长？
3. 留存最高的 segment 是哪个？为什么？
4. 有没有用户开始流失但之前一直活跃？→ 调查原因
5. 需要做什么实验来提升留存？→ 写入下周计划
