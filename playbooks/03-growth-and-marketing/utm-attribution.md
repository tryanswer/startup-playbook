# UTM Attribution Spec

统一 UTM 参数命名。如果每个渠道用不同的 UTM 命名规则，GA4 里的渠道数据会一团乱，无法做归因分析。

## UTM Parameters

| Parameter | Required | Purpose | Example |
|---|---|---|---|
| `utm_source` | Yes | 流量来源平台 | google, reddit, twitter, youtube, newsletter |
| `utm_medium` | Yes | 流量类型 | cpc, organic, social, email, referral |
| `utm_campaign` | Yes | 活动名称 | launch_week, seo_test_may, ph_launch |
| `utm_content` | Optional | 区分同一活动的不同素材 | hero_cta, sidebar_link, reply_v2 |
| `utm_term` | Optional | 付费关键词 | best_color_analysis_app |

## Naming Rules

1. **全部小写**，用下划线分隔：`product_hunt` 不是 `ProductHunt`。
2. **source 用平台名**，不用活动名：`reddit` 不是 `reddit_skincare_post`。
3. **medium 用标准分类**，不要自创：

| Medium | When |
|---|---|
| `cpc` | 付费点击（Google Ads, Facebook Ads） |
| `organic` | 自然搜索 |
| `social` | 社交媒体自然发布 |
| `email` | 邮件 |
| `referral` | 他人网站链接 |
| `community` | 社区回复（Reddit, HN, Discord） |
| `affiliate` | 联盟推荐 |
| `direct` | 不加 UTM，GA4 自动归为 direct |

4. **campaign 用具体活动**，包含时间或目的：`validation_may26` 不是 `test`。

## URL Examples

```
# Reddit 社区回复
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

UTM 参数会自动填充 GA4 的以下维度：

| GA4 Dimension | Filled By |
|---|---|
| Session source | utm_source |
| Session medium | utm_medium |
| Session campaign | utm_campaign |
| Session manual ad content | utm_content |
| Session manual term | utm_term |

在 GA4 → Reports → Acquisition → Traffic acquisition 中可以按这些维度查看转化。

## Attribution Models

GA4 默认使用 Data-driven attribution。早期数据量少时建议用 Last click：

- **Last click**：最后一次点击获得全部功劳。简单明确。
- **Data-driven**：GA4 用机器学习分配功劳。需要足够转化数据（每月 300+ 转化）。

早期产品推荐 Last click，数据量上来后切 Data-driven。

## Weekly Attribution Review

每周复盘时回答：

1. 哪个 source/medium 带来最多 `sign_up`？
2. 哪个 source/medium 带来最多 `purchase`？
3. 注册最多的渠道和付费最多的渠道是同一个吗？（通常不是）
4. 哪个 campaign 的 CPA 最低？
5. 有没有渠道只带来注册但从不付费？→ 考虑停止投入。

## Common Mistakes

- UTM 大小写不一致：`Reddit` 和 `reddit` 在 GA4 里是两个来源。
- 自己网站内部链接加 UTM：会覆盖原始来源，导致归因错误。内部链接不要加 UTM。
- 不加 campaign 参数：所有流量混在一起，无法区分哪次活动有效。
- 用 URL 缩短服务后丢失 UTM：确保缩短工具保留参数。
- 不记录 UTM 规则：团队其他人用不同命名，数据不可汇总。
