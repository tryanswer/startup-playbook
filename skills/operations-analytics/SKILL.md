---
name: operations-analytics
description: Use when a launched product needs ongoing operations, metrics review, retention diagnosis, churn prediction, competitive intelligence, feedback synthesis, and growth experiment management.
---

# Operations & Analytics

Use this skill after a product has launched and needs ongoing operations. Your job is to help the founder make data-driven decisions about user retention, revenue health, and sustainable growth. Focus on actionable insights over vanity metrics.

## Inputs

- Handoff from grow stage (active channels, UTM conventions, baseline metrics)
- GA4 / Baidu Analytics data
- User feedback (support tickets, app reviews, NPS surveys, interviews)
- Revenue data (MRR, churn rate, expansion revenue)

## Workflow

### Weekly Metrics Review

Track AARRR funnel weekly:

- **Acquisition**: New users by channel, CAC trends
- **Activation**: D1 activation rate, time-to-value
- **Retention**: D1/D7/D30 retention curves
- **Revenue**: MRR, ARPU, conversion rates
- **Referral**: Viral coefficient, referral sources

Flag anomalies: sudden drops >20%, unusual spikes, or metric divergence across segments.

### Retention Diagnosis

Apply decision tree based on retention thresholds:

- **D1 < 10%**: Activation problem. Users don't understand value or can't complete onboarding. Stop growth spend, fix first-run experience.
- **D7 < 25%**: Engagement problem. Product lacks habit-forming loops or core value delivery is inconsistent. Improve feature discovery and usage frequency.
- **D30 < 40%**: Long-term value problem. Product doesn't solve recurring pain or lacks stickiness. Deepen integration into user workflow or expand use cases.

Segment retention by cohort (signup date), channel (acquisition source), and user type (plan, role, industry).

### Revenue Health Check

Monitor these metrics monthly:

- **MRR Growth Rate**: Target 10-20% MoM for early-stage SaaS
- **Churn Rate**: <5% monthly for B2C, <3% for B2B SaaS
- **Net Revenue Retention (NRR)**: >100% indicates healthy expansion
- **LTV:CAC Ratio**: >3:1 is sustainable, <2:1 requires pricing or efficiency improvements
- **Payback Period**: <12 months for bootstrapped, <18 months for funded

If NRR < 100% for 2 consecutive months, investigate expansion/upsell opportunities before acquiring new customers.

### User Feedback Triage

Categorize incoming feedback weekly:

- **Bug**: Fix immediately if blocking core flow
- **Feature Request**: Log in backlog, validate demand before building
- **Praise**: Identify what's working, amplify in marketing
- **Churn Reason**: High priority, diagnose root cause
- **Confusion**: UX/documentation gap, improve onboarding or help content

Prioritize by: frequency × severity × revenue impact.

### Growth Experiment Review

Review last week's experiments:

- Which hypotheses were tested?
- What were the results (win/loss/draw)?
- What did we learn?
- What's next in the backlog?

Document wins and losses to compound learning over time.

### Competitive Intelligence Update

Monthly scan of competitor landscape:

- New features or product updates
- Pricing changes
- Positioning shifts
- Funding announcements
- Market share movements

Update competitive matrix quarterly with deeper analysis.

## Advanced Statistical Modeling

### Cohort Analysis with Statistical Significance

Compare retention cohorts using chi-square tests or confidence intervals. Don't react to noise—ensure differences are statistically significant (p < 0.05) before making decisions.

### Churn Prediction

Build simple logistic regression model on usage patterns:

- Features: login frequency, feature adoption depth, support ticket count, days since last activity
- Target: churned (1) vs retained (0) in next 30 days
- Output: churn probability score per user
- Action: trigger retention campaign for high-risk users (score > 0.7)

**Solo founder minimum**: Track 3 leading indicators manually—login frequency drop, feature usage decline, support silence after previous complaints.

### Revenue Forecasting

Use time series methods for MRR projection:

- **Moving Average**: 3-month rolling average for stable businesses
- **Exponential Smoothing**: Weight recent months heavier for growing businesses
- **Seasonal Adjustment**: Account for predictable seasonal patterns (e.g., Q4 B2B slowdown)

Forecast 3-6 months ahead to plan hiring, infrastructure, and cash flow.

### Funnel Conversion Analysis

Calculate confidence intervals for each funnel step:

- If conversion rate CI overlaps between variants, difference is not statistically significant
- Require minimum sample size (n > 100 conversions) before declaring winner
- Use Bayesian methods for faster iteration with smaller samples

**Solo founder minimum**: Spreadsheet cohort tracking + simple trend lines. Focus on direction over precision.

## Multi-Channel Feedback Synthesis

### Data Sources

Aggregate feedback from:

- Support tickets (Intercom, Zendesk, email)
- App store reviews (iOS, Android)
- NPS survey responses
- Social media mentions (Twitter, Reddit, LinkedIn)
- User interview transcripts

### Classification Framework

Tag each feedback item:

- **Bug**: Something broken or not working as expected
- **Feature Request**: New capability desired
- **Praise**: Positive sentiment, what users love
- **Churn Reason**: Why users left or downgraded
- **Confusion**: Unclear UX, missing documentation

### AI-Assisted Clustering

Use LLMs to cluster similar feedback and extract themes:

1. Collect all feedback from past month
2. Prompt LLM to group by theme and count frequency
3. Identify top 5 recurring themes
4. Convert themes into hypotheses for experiments

Example prompt: "Group these 200 feedback items into themes. For each theme, list the frequency and representative quotes."

### Feedback → Insight → Hypothesis → Experiment Pipeline

Transform raw feedback into action:

1. **Feedback**: "I can't find how to export my data"
2. **Insight**: Export functionality has poor discoverability
3. **Hypothesis**: Adding export button to main navigation will increase export usage by 50%
4. **Experiment**: A/B test navigation placement vs current location
5. **Result**: Measure export clicks, validate or reject hypothesis

### Prioritization Formula

Score each insight:

```
Priority Score = Frequency (1-5) × Severity (1-5) × Revenue Impact (1-5)
```

- **Frequency**: How many users mentioned this?
- **Severity**: How much does this block user success?
- **Revenue Impact**: Does this affect paying users or upgrade potential?

Focus on scores > 50 first.

### Monthly Voice of Customer (VoC) Report

Synthesize monthly:

- Top 5 feedback themes with frequency
- Sentiment trend (positive/negative ratio)
- Emerging issues (new themes appearing)
- Resolved issues (themes declining)
- Action items for product team

## Competitive Intelligence

### Competitor Tracking

Monitor competitors monthly:

- **Features**: New releases, deprecated features
- **Pricing**: Plan changes, discount campaigns, free tier adjustments
- **Positioning**: Messaging shifts, target segment changes
- **Funding**: Investment rounds, investor announcements
- **Hiring**: Key hires indicate strategic direction

### Win/Loss Analysis

From sales calls or churn interviews:

- Why did they choose us over competitor X?
- Why did they choose competitor Y over us?
- What nearly made them walk away?
- What would make them switch now?

Track win/loss reasons quarterly to identify positioning gaps.

### Market Trend Monitoring

Watch for macro shifts:

- **Google Trends**: Search volume for category keywords
- **Social Listening**: Sentiment shifts on Twitter, Reddit, LinkedIn
- **Analyst Reports**: Gartner, Forrester, niche industry reports
- **Regulatory Changes**: Compliance requirements affecting market

### Quarterly Competitive Landscape Update

Every quarter, produce:

- Competitor feature comparison matrix
- Pricing comparison table
- Market share estimates
- Strategic moves analysis
- Opportunities and threats assessment

**Recommended Tools**: Competitors.app, SimilarWeb, BuiltWith, Crunchbase, Google Alerts.

## Sales Pipeline Health (B2B Only)

Applicable when ACV > $500 and sales process involves multiple touches.

### Pipeline Metrics

Track weekly:

- **Pipeline Stages**: Lead → Qualified → Demo → Proposal → Negotiation → Closed
- **Conversion Rates**: Stage-to-stage conversion percentages
- **Deal Velocity**: Average days in each stage
- **Average Deal Size**: By segment, by channel
- **Forecast Accuracy**: Predicted vs actual close rate

### Lead Scoring Refinement

Monthly review of lead scoring model:

- Which attributes correlate with closed deals?
- Which signals predict fast vs slow deals?
- Adjust scoring weights based on actual outcomes
- Eliminate low-signal attributes

### Forecast Accuracy

Compare predicted pipeline value to actual revenue:

- If forecast consistently overestimates: tighten qualification criteria
- If forecast consistently underestimates: expand top-of-funnel targets
- Target ±15% accuracy for quarterly forecasts

## Growth Experiment System

### Experiment Backlog Management

Maintain prioritized backlog of growth experiments:

- Hypothesis statement
- Expected impact (users affected, metric moved)
- Effort estimate (engineering hours)
- ICE score (see below)
- Status (planned, running, completed)

### ICE Scoring

Prioritize experiments using ICE framework:

```
ICE Score = Impact (1-10) × Confidence (1-10) × Ease (1-10)
```

- **Impact**: How much will this move the needle if it works?
- **Confidence**: How sure are we this will work (based on data, research, intuition)?
- **Ease**: How easy is this to implement (10 = trivial, 1 = very hard)?

Run highest ICE score experiments first.

### Weekly Experiment Cadence

Ideal rhythm for solo founder or small team:

- **Monday**: Review last week's results, document learnings
- **Tuesday**: Launch 1-2 new experiments
- **Wednesday-Friday**: Monitor ongoing experiments, collect data
- **Friday**: Update backlog, reprioritize based on new information

Target 2-4 experiments running concurrently.

### Win/Loss Documentation

For each completed experiment:

- **Hypothesis**: What we thought would happen
- **Result**: What actually happened (with data)
- **Learning**: Why it worked or didn't
- **Next Step**: Iterate, abandon, or scale

Build institutional knowledge over time.

### Compounding Growth

Aim for 1% improvement per week:

- 1% weekly = 67% annual growth (compounded)
- Small wins compound: better onboarding + better retention + better referrals
- Document every win, no matter how small

### Channel Portfolio Rebalancing

Monthly review of acquisition channels:

- CAC trends by channel
- LTV by channel
- Scale potential (is channel saturated?)
- Reallocate budget from high-CAC to low-CAC channels
- Kill channels with CAC > LTV/3

## Customer Support Metrics

### Core Support Metrics

Track weekly:

- **CSAT (Customer Satisfaction)**: Post-interaction survey, target > 80%
- **First Response Time**: Target < 2 hours for paid users, < 24 hours for free
- **Resolution Time**: Target < 48 hours for standard issues
- **Support Volume**: Tickets per week, trend over time
- **Escalation Rate**: % of tickets requiring senior staff or engineering

### Self-Service Ratio

Measure deflection from support tickets:

```
Self-Service Ratio = (Docs views + FAQ views) / (Docs views + FAQ views + Tickets)
```

Target > 60% self-service. If ratio declining, improve documentation or fix confusing UX.

### Support Volume Trends

Compare support volume growth to user base growth:

- If support volume growing faster than users: systemic UX problem
- If support volume flat while users growing: improving product quality
- If support volume declining while users growing: excellent self-service and UX

Investigate spikes in specific ticket categories.

### Escalation Patterns

Analyze escalated tickets monthly:

- Common themes requiring escalation
- Which features generate most escalations?
- Are escalations due to complexity, bugs, or missing docs?
- Reduce escalation rate through proactive improvements

### Support-Driven Product Insights

Support team is early warning system:

- Recurring questions indicate UX confusion
- Feature requests reveal unmet needs
- Bug reports highlight reliability issues
- Churn reasons expose value gaps

Weekly sync between support and product teams.

## Required Output

When conducting operations analytics review, produce:

- **Weekly Metrics Dashboard**: AARRR funnel with week-over-week changes
- **Monthly Retention Report**: Cohort analysis, D1/D7/D30 trends, segmentation
- **Monthly Revenue Report**: MRR, churn, NRR, LTV:CAC, payback period
- **Monthly VoC Synthesis**: Top feedback themes, sentiment trends, action items
- **Quarterly Competitive Update**: Landscape analysis, positioning shifts, opportunities
- **Experiment Log**: All experiments with hypotheses, results, learnings
- **Churn Analysis**: Root cause diagnosis, prediction model output, retention campaigns
- **Growth Experiment Backlog**: ICE-scored priorities for next month

## Standardized Artifact Output

Write artifacts to:

```
playbook/stages/operate/input.json
playbook/stages/operate/report.json
playbook/stages/operate/handoff.json
playbook/stages/operate/report.md
```

`report.json` must include:

```json
{
  "analysis": {
    "weeklyMetrics": {},
    "retention": {},
    "revenueHealth": {},
    "feedbackSynthesis": {},
    "competitiveIntel": {},
    "experiments": {},
    "supportMetrics": {}
  }
}
```

## Decision Rules

Apply these rules rigorously:

- **If D1 retention < 10%**: Stop all growth experiments. Fix activation and onboarding before acquiring more users.
- **If monthly churn > 8% (B2C) or > 3% (B2B SaaS)**: Diagnose churn root cause before building any new features. Churn is a leaky bucket—fix it first.
- **If NRR < 100% for 2 consecutive months**: Investigate expansion and upsell opportunities. Existing customers should drive revenue growth.
- **If support volume growing faster than user base**: Systemic UX problem. Audit onboarding, documentation, and core flows for confusion points.
- **If experiment win rate < 20% for 4 weeks**: Review hypothesis quality. Either hypotheses are too vague, or you're not learning from customers before testing.

## Common Mistakes

Avoid these traps:

- **Vanity metrics over actionable metrics**: Total signups mean nothing without activation and retention. Focus on metrics that drive decisions.
- **Building features without churn diagnosis**: Adding features to a leaking bucket wastes resources. Fix retention first.
- **Ignoring qualitative feedback for quantitative data**: Numbers tell you what, feedback tells you why. Use both.
- **Not segmenting metrics by cohort or channel**: Averages hide problems. Segment to find where things break.
- **Reacting to noise instead of trends**: One bad week isn't a crisis. Look at 4-week moving averages before making big changes.
