# Validate Report

## Snapshot

- Project: AI Ecommerce Image Optimizer
- Stage: validate
- Decision: `pivot`
- Score: 54

## Diagnosis

The problem is plausible: marketplace sellers need product images that are both attractive and compliant. The first target is too broad, so the recommended wedge is cross-border Amazon sellers with 10-200 active SKUs.

## Known

- Google Trends US data shows visible search interest for product image terms, but recent momentum is weak for broad terms.
- OpenAI supports image generation and editing with GPT Image models.
- Amazon image rules create a concrete compliance checklist.
- Paid ecommerce photo editing alternatives exist.

## Assumed

- Sellers pay more for compliance-reviewed packs than generic AI image generation.
- Cross-border Amazon sellers are easier to reach first than Taobao/JD sellers.

## To Validate

- Clarify whether AWS means Amazon marketplace.
- Interview 10 sellers.
- Verify Taobao/JD official image rules.
- Sell 2 paid SKU image packs.

## Evidence

Minimum evidence set: `partial`.

| Category | Source | Metric / Value | Interpretation |
| --- | --- | --- | --- |
| trend | Google Trends, US, today 12-m | `product photography` avg 52.4/latest 25/momentum -16.2; `ai product photography` avg 44.1/latest 15/momentum -23.7; `product photo editing` avg 40.8/latest 9/momentum -11 | Category interest exists, but recent momentum is weak. |
| search | Google Trends keyword set, US, today 12-m | `amazon product images` avg 30.9/latest 11/momentum -10; `ecommerce photo editing` avg 5.9/latest 9/momentum +5.3 | Platform and service terms exist, but service-intent search is smaller than broad product-photography demand. |
| platform-rule | Amazon Seller Central | Main image white background, product-only, product fills at least 85%; six images recommended | Compliance can anchor a narrow first service promise. |
| paid-alternative | Pixc ecommerce photo editing | 10 basic images $20; 50 basic images $100 | Paid alternatives show image cleanup is a paid category, not that this product has paid demand. |

Missing evidence: real seller interviews and actual paid intent or payment.

## Next 7 Days

Run a paid manual-service sprint before building SaaS automation.

## Handoff

Narrow to cross-border Amazon sellers and test paid SKU image packs.
