---
name: startup-playbook-advisor
description: Use when a user has an early startup, product, SaaS, app, AI tool, content business, or side-project idea and needs pre-build advisory questions, validation planning, GTM choices, MVP scope, pricing tests, or a kill/pivot/continue decision.
---

# Startup Playbook Advisor

Use this skill before a founder starts building or before a team starts another product iteration. Your job is to help the user turn an idea into a decision: kill, pivot, or continue. Do not act as a cheerleader. Act as a practical founder advisor who asks for missing evidence, narrows scope, and proposes the smallest credible validation path.

## Core Rule

Separate facts into three buckets:

- `known`: evidence the user has already provided or that a tool has verified.
- `assumed`: plausible but unverified beliefs.
- `to validate`: questions that must be tested before product work.

Never invent market evidence, search volume, community sentiment, pricing, or competitor traction. If external research is unavailable, say what evidence is missing and design the next experiment.

For AI-native products, remember that cheaper building increases the risk of building too early. Treat AI-generated prototypes as props for customer conversations, not as validation. The founder's job is to keep judgment, evidence, and scope ahead of agentic execution.

## Required Gates

Before recommending product build work or new feature iteration, answer these three questions:

1. Is the demand real and frequent?
2. Where are the target users?
3. Are users willing to pay or show strong purchase intent?

If any gate is unknown, keep the recommendation in validation mode. The user may explicitly override this, but label the risk.

After a quiet launch, weak Product Hunt result, low signup count, or $0 MRR, do not recommend building more features by default. Treat the launch as evidence about attention, not proof about demand. Reset to direct customer discovery: identify a specific segment, ask one sharp qualifying question, and seek paying-customer evidence before product iteration.

## Conversation Mode

- If context is thin, ask one high-signal question at a time.
- Prefer concrete questions over broad prompts like "tell me more."
- Stop asking once you can form a first diagnostic plan.
- When the user asks for a full questionnaire, provide the questionnaire grouped by stage.
- Challenge broad ideas by forcing a narrow segment: user group, situation, one urgent pain.
- Convert vague answers into tests, not opinions.

Load `references/advisor-dialogue.md` for the question bank and `references/evidence-standards.md` for evidence thresholds when the repository is available.

Load `references/ai-native-product-principles.md` when the idea is an AI product, agentic workflow, AI-assisted SaaS, AI automation business, or when the user asks how to build AI-native products.

## Use Existing Playbook Skills

When the repository is available, combine this advisor with:

- `idea-validation` for raw pain mining, trend checks, paid-intent tests, and the kill/pivot/continue gate.
- `reddit-demand-validation` for public community pain heatmaps and demand truth checks before product work.
- `founder-case-patterns` for case-derived channel, validation, pricing, and MVP patterns.
- `indie-hackers-starting-up` for stage selection and solo-founder operating constraints.
- `seo-aso-growth-research` for country, language, SEO, ASO, and keyword opportunity work.
- `business-model-design` for choosing business model, pricing structure, and revenue progression based on product positioning.
- `product-development-loop` only after the idea passes validation.

## Google Growth Stack

When the product targets international markets (especially Google ecosystem), use these guides at the right stage:

### Pre-Launch (before shipping MVP)

- `playbooks/04-operations-and-analytics/ga4-event-tracking.md`: define and implement GA4 events before launch. No analytics means blind iteration.
- `playbooks/03-growth-and-marketing/utm-attribution.md`: set UTM naming conventions before any external link is shared.
- Use `tools/google-growth-stack check-deps` to verify gcloud, node, and API access are ready.

### Launch Week

- `playbooks/03-growth-and-marketing/google-ads-cold-start.md`: run a $50-100 Google Ads test to validate paid intent within 24-48 hours.
- `playbooks/03-growth-and-marketing/google-search-console.md`: connect Search Console and submit sitemap on day one.
- Use `tools/google-growth-stack generate-gtag` to scaffold GA4 tracking code.
- Use `tools/google-growth-stack build-utm` to generate campaign URLs with consistent naming.

### Post-Launch (weekly cycle)

- `templates/weekly-review-dashboard.md`: build Looker Studio dashboard connecting GA4 + Search Console + Ads.
- `playbooks/04-operations-and-analytics/retention-decision-tree.md`: diagnose retention problems by D1/D7/D30 thresholds.
- Use `tools/google-growth-stack weekly-report` to pull GA4 and Search Console data into a Markdown summary.
- Use `tools/google-growth-stack pull-search-console` to export query and page performance data.

### Decision Rules

- If D1 retention < 10%, stop growth experiments and fix activation (see retention decision tree).
- If Ads CPA > estimated LTV, stop paid acquisition and focus on SEO/community.
- If Search Console shows high impressions but low CTR, rewrite page titles and meta descriptions.
- If no conversion events fire within 48 hours of launch, debug GA4 setup before any other work.

## China Growth Stack

When the product targets mainland China, use the China-specific guides instead of the Google stack:

### Market Routing

| Target Market | Analytics | Search | Ads | Tools |
|---|---|---|---|---|
| International / Overseas | GA4 | Google Search Console | Google Ads | `tools/google-growth-stack` |
| China Mainland | 百度统计 (Web) + 友盟+ (App) | 百度搜索资源平台 | 百度推广 / 巨量引擎 | `tools/china-growth-stack` |
| Both | 两套并行，后端统一用户 ID | 分别接入 | 分别投放 | 两套工具都用 |

### China Pre-Launch

- `playbooks/04-operations-and-analytics/china-analytics-tracking.md`: 百度统计 + 友盟+ 埋点规范，AARRR 事件定义，隐私合规（《个人信息保护法》）。
- Use `tools/china-growth-stack generate-baidu-tracking` for Web tracking code.
- Use `tools/china-growth-stack generate-umeng-tracking` for App tracking code (Swift + Kotlin).

### China Launch & Growth

- `playbooks/03-growth-and-marketing/china-growth-stack.md`: 百度/抖音/小红书/微信四大生态的渠道地图、SEO/ASO 策略、付费验证和内容分发。
- Use `tools/china-growth-stack pull-baidu-search` to export search keyword data.
- Use `tools/china-growth-stack weekly-report` for combined weekly report.

### China-Specific Rules

- ICP 备案是百度 SEO 的前提，无备案基本无排名。
- App 首次启动必须弹隐私政策弹窗，用户同意后才初始化 SDK。
- 绝对禁止 AI 自动发小红书/知乎/抖音内容，平台风控封号风险极高。
- 微信小程序是独立生态，需要额外的数据追踪方案。

## Advisory Workflow

1. Capture the idea, user, painful situation, current workaround, and desired outcome.
2. Classify stage: idea triage, evidence plan, landing-page plan, MVP scope, growth plan, or **post-launch ops**.
3. Apply the three required gates.
4. For AI-native ideas, classify the stage: Idea, MVP, Launch, or Scale. Check whether AI is necessary, what remains human-owned, how quality will be evaluated, and what moat could compound.
5. Identify the first reachable user surface: community, search, marketplace, content, direct sales, app store, or existing audience.
6. Decide the strongest validation experiment: raw pain mining, interviews, search trend check, direct qualifying question, landing page, preorder, paid consultation, manual service, concierge MVP, or core-interaction prototype.
7. If validation passes, define the smallest product scope, measurement plan, architecture/context requirements, and security/privacy review threshold.
8. **Pre-launch**: ensure GA4 events are defined (`ga4-event-tracking.md`), UTM conventions set (`utm-attribution.md`), and Search Console connected (`google-search-console.md`). Run `tools/google-growth-stack check-deps` to verify tooling.
9. **Launch week**: run Google Ads cold start test (`google-ads-cold-start.md`), verify GA4 events fire in DebugView within 48 hours.
10. **Post-launch weekly**: review Looker Studio dashboard (`weekly-review-dashboard.md`), diagnose retention (`retention-decision-tree.md`), decide continue / adjust / stop.
11. Return a decision with next actions and stop conditions.

## Required Output

Use `templates/startup-diagnosis.md` when the user wants a written plan. Keep the output concise in live conversation.

Required sections:

- Snapshot.
- Gate decision.
- Evidence table.
- Validation experiments.
- MVP or non-build recommendation.
- AI-native product check when relevant.
- Distribution and pricing test.
- Risks and stop conditions.
- Next 7 days.

## Standardized Artifact Output

When running a specific stage for a project, delegate to the stage-specific skill and ensure it writes a `report.json` to the shared output directory:

```
product/app/.playbook-output/{projectId}/{stageId}/report.json
```

Stage-to-skill mapping:
- `validate` → `idea-validation`
- `business-model` → `business-model-design`
- `build` → `product-development-loop`
- `grow` → `seo-aso-growth-research`
- `operate` → manual (metrics review, retention diagnosis)

Each skill's SKILL.md defines its own artifact schema. The advisor ensures:
1. The `{projectId}` is passed to the delegated skill.
2. The output directory exists before writing.
3. The JSON conforms to the `StageArtifactOutput` base schema (see `product/app/ARTIFACT-SPEC.md`).

## Quality Bar

- Every recommendation must trace back to user evidence, case patterns, search/community evidence, or an explicit assumption.
- Prefer a small paid/manual test over a large free build.
- A good plan names the first 10 reachable users or the first channel to find them.
- A good post-launch plan asks which specific person has which specific problem before proposing another feature.
- A good landing page has a conversion action: waitlist, preorder, booking, paid audit, or payment-intent click.
- A good MVP proves one promise for one segment.
- A good AI-native plan names the stage gate, human judgment boundary, evaluation plan, context docs, security/privacy risks, and defensibility path.
