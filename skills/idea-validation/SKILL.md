---
name: idea-validation
description: Use when evaluating a startup or product idea before building, especially when the user needs evidence from communities, search demand, trend direction, willingness to pay, or a landing-page smoke test.
---

# Idea Validation

Use this skill before building a new product or feature idea, and before iterating after a weak launch. The goal is to decide whether to kill, pivot, or continue based on evidence.

## Required Gate

Before implementation, answer three questions:

1. Is the demand real and frequent?
2. Where are the target users?
3. Are they willing to pay or show strong purchase intent?

If any answer is missing, treat the idea as unvalidated.

## Workflow

1. **Narrow the niche**
   Define a three-level segment: user group, situation, and one core pain. The idea must be understandable in one second.

2. **Check founder patterns**
   If available, load `indie-hackers-starting-up` to identify the project stage, then load `founder-case-patterns` for similar user, pain, channel, pricing, or validation patterns. Use guides and cases as hypotheses to test, not proof.

3. **Mine pain ore**
   Collect raw complaints from Reddit, app reviews, Discord, forums, social comments, support tickets, or interviews. Store short excerpts, source, link, and pain theme. If this repository is available and Reddit/forum evidence is in scope, use `reddit-demand-validation` and `tools/topic-pain-miner`.

4. **Quantify pain**
   Cluster the quotes with AI and calculate theme frequency. Prioritize pains that appear in more than 40% of the corpus. Preserve vivid language from users instead of rewriting everything into neutral product wording.

5. **Validate demand**
   Use Keywords Everywhere for long-tail density, volume, CPC, and competition when available. Use Google Trends for trend direction, geography, related queries, and seasonality. Reject ideas with declining search interest, no concrete long-tail terms, or only broad head-term interest.

6. **Check willingness to pay**
   Look for buying behavior: paid alternatives, high CPC, marketplace demand, explicit user budget, service purchases, affiliate products, paid communities, preorder clicks, or payment-page clicks.

7. **Run the first-paying-customer check**
   A launch post, warm relationship, Product Hunt listing, upvote, like, or signup does not prove paid demand. Before adding features after a weak launch, identify a specific person with a specific problem and ask one sharp qualifying question. Continue product iteration only when there is payment, preorder, paid pilot, booked sales call with clear pain, or another strong purchase-intent signal. A useful default constraint is: find 5 paying or high-intent customers before building another feature.

8. **Build a fast landing page**
   Use raw user language for headline, pain points, FAQ, and CTA. Include a waitlist, preorder, buy-now, consultation booking, or payment-intent action.

9. **Decide**
   Output one of: kill, pivot, continue. Include the evidence threshold and next experiment.

## Required Output

- Idea validation brief.
- Raw quote table.
- Pain frequency summary.
- Keyword and trend evidence.
- Willingness-to-pay evidence.
- First-paying-customer plan or qualifying question.
- Landing-page message map.
- Decision: kill / pivot / continue.

## Standardized Artifact Output

After completing validation, write a structured JSON report to:

```
product/app/.playbook-output/{projectId}/validate/report.json
```

The JSON must conform to this schema:

```json
{
  "stage": "validate",
  "score": 65,
  "decision": "continue",
  "reasoning": "One sentence summarizing the decision rationale.",
  "evidence": ["Positive signal 1", "Positive signal 2"],
  "concerns": ["Risk factor 1", "Risk factor 2"],
  "analysis": {
    "pain": "2-3 sentences about pain signal strength, frustration rate, workaround quality.",
    "demand": "2-3 sentences about search demand, trend direction, long-tail density.",
    "market": "2-3 sentences about competitive landscape, gaps, market maturity."
  },
  "suggestedNextSteps": ["Action 1", "Action 2", "Action 3"],
  "generatedAt": "2026-05-28T20:50:00Z"
}
```

Scoring: 60-100 = continue, 35-59 = pivot, 0-34 = kill.

The `{projectId}` is provided by the caller. If not provided, use the idea name slugified as the project ID.

## Tool Notes

- Google Trends is normalized relative interest from 0 to 100, not search volume.
- Keywords Everywhere is paid; if unavailable, use Google Trends plus SERP autocomplete, community evidence, app-store reviews, and competitor pricing, then label confidence lower.
- If this repository is available, use `tools/google-trends-seo` for Trends and keyword reports.

## Common Mistakes

- Inventing pain with AI instead of collecting user language.
- Segmenting too broadly.
- Trusting one viral trend without long-tail demand.
- Treating free interest as paid demand.
- Treating a quiet launch as a product-feature problem before testing sales conversations.
- Building a landing page without a conversion action.
