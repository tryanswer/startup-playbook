# Startup Playbook

用于沉淀从 idea 到产品、增长、运营的可复用创业工作流。核心原则是先验证真实需求，再开发产品，最后用可量化渠道增长，而不是让 AI 在没有证据的情况下编故事。

## Structure

- `playbooks/01-idea-validation`: 验证需求是否真实、目标用户在哪里、是否愿意付费。
- `playbooks/02-product-development`: 把已验证的问题转成 MVP、PRD、验收标准和发布闭环。
- `playbooks/03-growth-and-marketing`: SEO、ASO、内容、社区、落地页和付费意愿验证。
- `playbooks/04-operations-and-analytics`: 指标、实验复盘、用户反馈和运营节奏。
- `skills/`: 可复制到 Codex / agent 环境使用的技能。
- `tools/google-trends-seo`: Google Trends / Keywords Everywhere 关键词研究工具。
- `tools/case-study-skill-miner`: 把 founder case studies 提炼成创业经验 skill。
- `tools/topic-pain-miner`: 抓取 Reddit 公共话题，生成痛点热力图、HTML 页面和可选 LLM 需求总结。
- `tools/google-growth-stack`: GA4 埋点代码生成、UTM URL 构建、Search Console 数据导出和每周增长报告。支持依赖自动检测和安装。
- `tools/china-growth-stack`: 百度统计埋点代码生成、友盟+ App 追踪代码生成（Swift/Kotlin）、百度搜索数据导出和每周增长报告。面向中国大陆市场。
- `plugins/startup-playbook-advisor`: 可安装到 Codex 的创业顾问插件。
- `agents/startup-playbook-advisor.md`: 可复制到 Claude / Codex / OpenClaw 的创业顾问 agent 设定。
- `templates/`: 可直接复制使用的实验、PRD、SEO/ASO 和落地页模板。
- `playbooks/03-growth-and-marketing/ai-distribution.md`: AI 辅助内容分发、社区回复、外联和日报的 70/30 分工与人工审批规则。
- `playbooks/03-growth-and-marketing/google-search-console.md`: Google Search Console 接入、SEO 数据解读和内容策略闭环。
- `playbooks/03-growth-and-marketing/google-ads-cold-start.md`: 用 $50-100 小预算快速验证付费意愿，Search Terms → SEO 反馈循环。
- `playbooks/03-growth-and-marketing/utm-attribution.md`: UTM 参数命名规范、归因模型和渠道效果复盘。
- `playbooks/04-operations-and-analytics/ga4-event-tracking.md`: GA4 埋点规范，按 AARRR 分层的事件定义，上线前必须完成。
- `playbooks/04-operations-and-analytics/retention-decision-tree.md`: 留存分析决策树，D1/D7/D30 各阶段的阈值和诊断路径。
- `playbooks/04-operations-and-analytics/china-analytics-tracking.md`: 国内埋点规范（百度统计 + 友盟+），AARRR 事件定义和隐私合规。
- `playbooks/03-growth-and-marketing/china-growth-stack.md`: 国内增长运营 Playbook，覆盖百度/抖音/小红书/微信四大生态。
- `templates/ai-distribution-action-sort.md`: 将一周分发动作拆成 AI can / Human owns / Hybrid 的执行模板。
- `templates/weekly-review-dashboard.md`: Looker Studio 周复盘仪表盘搭建指南，连接 GA4 + Search Console + Ads。
- `case-studies/beauty-log`: Beauty Log 的实战记录。

## Operating Principles

1. 先回答三个问题：需求是否真实且频繁，目标用户在哪里，用户是否愿意付费。
2. 痛点来自真实用户原话，不来自 AI 猜测。
3. 市场要三级细分到一个核心痛点，让用户一秒看懂。
4. 搜索数据和社区证据都要看，单一趋势不能代表商业机会。
5. 验证页必须有转化动作：等待名单、预约、购买或付费预订。

## Suggested Flow

1. 用 `skills/idea-validation` 验证 idea，输出 kill / pivot / continue 结论。
2. 用 `skills/reddit-demand-validation` 和 `tools/topic-pain-miner` 从公开社区抓取用户原话，判断需求是否真实、频繁、可触达、有购买信号。
3. 通过 `tools/google-trends-seo` 检查关键词趋势和国家/语言机会。
4. 用 `templates/landing-page-checklist.md` 快速建页验证转化。
5. idea 通过后，用 `skills/product-development-loop` 收敛 MVP。
6. 上线前，按 `playbooks/04-operations-and-analytics/ga4-event-tracking.md` 完成 GA4 埋点，确保激活、转化、留存事件都能追踪。
7. 上线前，按 `playbooks/03-growth-and-marketing/utm-attribution.md` 统一 UTM 参数命名。
8. 上线后，接入 Google Search Console（见 `playbooks/03-growth-and-marketing/google-search-console.md`），追踪搜索排名和自然流量。
9. 用 `playbooks/03-growth-and-marketing/google-ads-cold-start.md` 小预算验证付费意愿，Search Terms 反馈到 SEO。
10. 用 `skills/seo-aso-growth-research` 做 SEO / ASO / 市场运营迭代。
11. 如果要用 AI 做内容分发、社区回复或外联，先用 `playbooks/03-growth-and-marketing/ai-distribution.md` 和 `templates/ai-distribution-action-sort.md` 做 40-action sort，保留创始人必须亲自处理的 30%。
12. 每周用 `templates/weekly-review-dashboard.md` 搭建的 Looker Studio 仪表盘做复盘，用 `playbooks/04-operations-and-analytics/retention-decision-tree.md` 诊断留存问题。
13. 需要参考创业案例时，用 `skills/case-study-skill-mining`、`skills/founder-case-patterns` 和 `skills/indie-hackers-starting-up` 把案例和 guide 转成可执行经验。

## Startup Advisor Plugin / Skill

`startup-playbook-advisor` 是面向项目启动前期的创业顾问 skill / agent。它会先围绕需求真实性、用户在哪里、付费意愿、验证实验、MVP 范围和增长路径进行对话，再输出 kill / pivot / continue 决策和下一步方案。

安装入口：

```bash
node scripts/install-startup-advisor.mjs --target claude
node scripts/install-startup-advisor.mjs --target codex-skill
node scripts/install-startup-advisor.mjs --target codex-plugin
node scripts/install-startup-advisor.mjs --target openclaw --openclaw-root /Users/neal/Documents/Projects/fatclaw/openclaw-monorepo --run-openclaw-sync
```

也可以预览全量安装动作：

```bash
node scripts/install-startup-advisor.mjs --target all --dry-run
```

常用启动提示：

- `Help me validate a startup idea.`
- `Ask me the key questions before I build.`
- `Turn this idea into a 7-day validation plan.`

## Current Research Corpus

- Indie Hackers stories: 499 public case URLs indexed, 498 readable pages learned into `skills/founder-case-patterns`.
- Indie Hackers Starting Up: 80 guide resources indexed, 78 readable pages learned into `skills/indie-hackers-starting-up`.
- Raw HTML/text is kept in ignored tool `output/` directories; committed files contain only source-linked summaries, counts, and reusable operating rules.
