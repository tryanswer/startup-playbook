/**
 * Business Model Matcher — recommends business models based on opportunity analysis.
 *
 * Matches validated opportunities to one of 5 business model patterns
 * based on signal evidence, target user, pain type, and delivery method.
 *
 * Models (from 499 Indie Hackers case studies):
 *   1. SaaS Subscription  — daily/weekly usage, software deliverable
 *   2. Productized Service — hire-people alternative, done-for-you
 *   3. Content/Course      — one-time, knowledge deliverable
 *   4. Marketplace         — connects supply + demand
 *   5. Developer Tool/API  — target = developers, technical product
 *
 * Usage:
 *   import { matchBusinessModel, generatePricingChecklist } from './business-model-matcher.mjs';
 *   const match = matchBusinessModel(analysisReport);
 */

/* ------------------------------------------------------------------ */
/*  Model Definitions                                                  */
/* ------------------------------------------------------------------ */

const BUSINESS_MODELS = [
  {
    id: "saas-subscription",
    label: "SaaS Subscription",
    icon: "💻",
    description: "Recurring software product with monthly/annual billing",
    indicators: {
      painTypes: ["manual-workflow", "time-waste", "tool-complaint", "integration-friction"],
      demandTypes: ["frequency", "team-need", "purchase-intent"],
      supplyTypes: ["saas-exists", "pricing-model"],
      keywords: /\b(automate|dashboard|platform|app|software|tool|saas|workflow|recurring)\b/i,
    },
    pricingGuidance: {
      model: "Monthly/annual subscription",
      typical: "$10–$99/mo for SMB, $99–$499/mo for mid-market",
      tiers: ["Free trial (14 days)", "Starter ($19/mo)", "Pro ($49/mo)", "Team ($99/mo)"],
      advice: "Default to annual billing with 20% discount. Show pricing clearly. Start with 2-3 tiers max.",
    },
    antiPatterns: ["All-free with no upgrade path", "Only lifetime deals", "Too many tiers (>4)"],
    caseStudyRate: 0.96,
  },
  {
    id: "productized-service",
    label: "Productized Service",
    icon: "🛠️",
    description: "Standardized service with fixed scope and pricing",
    indicators: {
      painTypes: ["manual-workflow", "time-waste", "scaling-pain"],
      demandTypes: ["team-need", "urgency", "purchase-intent"],
      supplyTypes: ["manual-service", "revenue-signal"],
      keywords: /\b(done.?for.?you|agency|service|consulting|freelance|outsource|managed|concierge)\b/i,
    },
    pricingGuidance: {
      model: "Fixed-price packages or retainers",
      typical: "$500–$5,000/project or $1,000–$10,000/mo retainer",
      tiers: ["Starter package", "Growth package", "Enterprise/custom"],
      advice: "Start with concierge (manual) delivery, then automate. Price based on value delivered, not hours.",
    },
    antiPatterns: ["Hourly billing (kills scalability)", "Unlimited revisions", "No clear scope"],
    caseStudyRate: 0.30,
  },
  {
    id: "content-course",
    label: "Content / Course / Info Product",
    icon: "📚",
    description: "One-time or subscription knowledge product",
    indicators: {
      painTypes: ["repeated-question"],
      demandTypes: ["feature-request"],
      supplyTypes: ["revenue-signal"],
      keywords: /\b(course|tutorial|ebook|guide|template|playbook|newsletter|community|membership)\b/i,
    },
    pricingGuidance: {
      model: "One-time purchase or membership",
      typical: "$29–$499 one-time, or $9–$49/mo membership",
      tiers: ["Basic ($49)", "Premium ($149)", "Bundle ($299)"],
      advice: "Launch at low price, increase as content grows. Add community for recurring revenue.",
    },
    antiPatterns: ["Free forever with no monetization", "Overpriced without proof of results"],
    caseStudyRate: 0.49,
  },
  {
    id: "marketplace",
    label: "Marketplace / Platform",
    icon: "🏪",
    description: "Connects buyers and sellers, takes a commission",
    indicators: {
      painTypes: ["alternative-seeking", "pricing-pain"],
      demandTypes: ["purchase-intent", "team-need"],
      supplyTypes: ["market-growth"],
      keywords: /\b(marketplace|matching|connect|hire|find|directory|listing|platform|two.?sided)\b/i,
    },
    pricingGuidance: {
      model: "Transaction fee or listing fee",
      typical: "5–20% transaction fee, or $49–$299/mo listing fee",
      tiers: ["Free listing + commission", "Featured listing ($X/mo)", "Enterprise API"],
      advice: "Solve chicken-and-egg: start with supply side. Manual matching initially, then automate.",
    },
    antiPatterns: ["No transaction fee (no revenue model)", "Trying to scale both sides simultaneously"],
    caseStudyRate: 0.14,
    warnings: ["Cold-start problem: need supply before demand", "High operational overhead initially"],
  },
  {
    id: "developer-tool",
    label: "Developer Tool / API",
    icon: "⚙️",
    description: "Technical product for developers with usage-based or seat-based pricing",
    indicators: {
      painTypes: ["integration-friction", "manual-workflow", "migration-friction"],
      demandTypes: ["feature-request", "team-need"],
      supplyTypes: ["open-source", "saas-exists"],
      keywords: /\b(api|sdk|library|cli|developer|devtool|dev tool|open.?source|self.?host|integration)\b/i,
    },
    pricingGuidance: {
      model: "Freemium + usage-based or seat-based",
      typical: "Free tier → $29–$99/mo → usage-based at scale",
      tiers: ["Free (up to X requests)", "Pro ($49/mo)", "Enterprise (custom)"],
      advice: "Generous free tier for adoption. Monetize at scale or with team features. Good docs are critical.",
    },
    antiPatterns: ["No free tier (kills adoption)", "Only open-source with no paid plan"],
    caseStudyRate: 0.88,
  },
];

/* ------------------------------------------------------------------ */
/*  Core API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Match an analysis report to recommended business models.
 *
 * @param {Object} report — analysis report from report-generator
 * @returns {{ recommendations: ModelMatch[], primaryModel: ModelMatch, pricingChecklist: string[] }}
 */
export function matchBusinessModel(report) {
  const opportunities = report.opportunities ?? [];
  const allSignalTypes = new Set();
  const allText = [];

  for (const opp of opportunities) {
    for (const type of opp.signalTypes ?? []) allSignalTypes.add(type);
    allText.push(opp.theme ?? "", opp.description ?? "", opp.painfulSituation ?? "");
    for (const ev of opp.evidence ?? []) {
      allText.push(ev.title ?? "");
    }
  }

  const combinedText = allText.join(" ");

  const scored = BUSINESS_MODELS.map((model) => {
    const score = scoreModelFit(model, allSignalTypes, combinedText);
    return {
      id: model.id,
      label: model.label,
      icon: model.icon,
      description: model.description,
      fitScore: score,
      pricingGuidance: model.pricingGuidance,
      antiPatterns: model.antiPatterns,
      warnings: model.warnings ?? [],
      caseStudyRate: model.caseStudyRate,
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  const primaryModel = scored[0];
  const pricingChecklist = generatePricingChecklist(primaryModel);

  return {
    recommendations: scored.filter((m) => m.fitScore > 0),
    primaryModel,
    pricingChecklist,
    reasoning: buildMatchReasoning(primaryModel, scored),
  };
}

/**
 * Generate a pricing design checklist based on the recommended model.
 */
export function generatePricingChecklist(model) {
  const common = [
    "☐ Price is clearly visible on the landing page",
    "☐ Default payment is subscription (not one-time)",
    "☐ Annual billing option with ≥15% discount",
    "☐ At most 3-4 pricing tiers",
    "☐ Free trial or free tier available",
    "☐ Price increase plan documented for month 3 and month 6",
  ];

  const modelSpecific = {
    "saas-subscription": [
      "☐ Monthly and annual toggle on pricing page",
      "☐ Feature comparison table between tiers",
      "☐ Enterprise/custom tier with 'Contact us' CTA",
      "☐ Usage limits clearly stated per tier",
    ],
    "productized-service": [
      "☐ Fixed scope for each package (no hourly billing)",
      "☐ Turnaround time clearly stated",
      "☐ Portfolio/case studies visible",
      "☐ Money-back guarantee or revision policy",
    ],
    "content-course": [
      "☐ Preview/sample content available",
      "☐ Testimonials or results shown",
      "☐ Bundle pricing for multiple products",
      "☐ Community or support access included",
    ],
    marketplace: [
      "☐ Commission rate clearly stated",
      "☐ Seller onboarding is frictionless",
      "☐ Buyer trust signals (reviews, ratings)",
      "☐ Dispute resolution process defined",
    ],
    "developer-tool": [
      "☐ API documentation is public and complete",
      "☐ Free tier with generous limits",
      "☐ Usage dashboard for monitoring consumption",
      "☐ Self-serve signup (no sales call required)",
    ],
  };

  return [...common, ...(modelSpecific[model?.id] ?? [])];
}

/**
 * Generate a Markdown summary of the business model recommendation.
 */
export function generateModelMarkdown(matchResult) {
  const lines = [];
  const primary = matchResult.primaryModel;

  lines.push("## 💼 Business Model Recommendation");
  lines.push("");
  lines.push(`### ${primary.icon} ${primary.label} (Fit: ${primary.fitScore}/100)`);
  lines.push("");
  lines.push(`> ${primary.description}`);
  lines.push("");

  // Pricing guidance
  const pricing = primary.pricingGuidance;
  lines.push("**Pricing guidance**:");
  lines.push(`- **Model**: ${pricing.model}`);
  lines.push(`- **Typical range**: ${pricing.typical}`);
  lines.push(`- **Suggested tiers**: ${pricing.tiers.join(" → ")}`);
  lines.push(`- **Advice**: ${pricing.advice}`);
  lines.push("");

  // Anti-patterns
  if (primary.antiPatterns.length > 0) {
    lines.push("**⚠️ Anti-patterns to avoid**:");
    for (const pattern of primary.antiPatterns) {
      lines.push(`- ❌ ${pattern}`);
    }
    lines.push("");
  }

  // Warnings
  if (primary.warnings.length > 0) {
    lines.push("**🚨 Warnings**:");
    for (const warning of primary.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  // Alternative models
  const alternatives = matchResult.recommendations.slice(1, 3);
  if (alternatives.length > 0) {
    lines.push("### Alternative models");
    lines.push("");
    for (const alt of alternatives) {
      lines.push(`- ${alt.icon} **${alt.label}** (fit: ${alt.fitScore}/100) — ${alt.description}`);
    }
    lines.push("");
  }

  // Pricing checklist
  lines.push("### ☑️ Pricing Checklist");
  lines.push("");
  for (const item of matchResult.pricingChecklist) {
    lines.push(item);
  }
  lines.push("");

  lines.push(`*Based on ${(primary.caseStudyRate * 100).toFixed(0)}% success rate in Indie Hackers case studies*`);

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Scoring                                                            */
/* ------------------------------------------------------------------ */

function scoreModelFit(model, signalTypes, text) {
  let score = 0;
  const indicators = model.indicators;

  // Pain type match: 0-30 pts
  const painMatches = indicators.painTypes.filter((t) => signalTypes.has(t)).length;
  score += Math.min(painMatches * 10, 30);

  // Demand type match: 0-20 pts
  const demandMatches = indicators.demandTypes.filter((t) => signalTypes.has(t)).length;
  score += Math.min(demandMatches * 8, 20);

  // Supply type match: 0-15 pts
  const supplyMatches = indicators.supplyTypes.filter((t) => signalTypes.has(t)).length;
  score += Math.min(supplyMatches * 8, 15);

  // Keyword match in text: 0-20 pts
  if (indicators.keywords.test(text)) score += 20;

  // Case study rate bonus: 0-15 pts
  score += Math.round(model.caseStudyRate * 15);

  return Math.min(score, 100);
}

function buildMatchReasoning(primary, allScored) {
  const parts = [`Recommended "${primary.label}" (${primary.fitScore}/100 fit)`];

  if (primary.fitScore >= 60) {
    parts.push("Strong signal alignment with this model pattern.");
  } else if (primary.fitScore >= 30) {
    parts.push("Moderate fit — consider validating model assumptions before committing.");
  } else {
    parts.push("Weak fit — more evidence needed. Consider exploring multiple models in parallel.");
  }

  const runner = allScored[1];
  if (runner && runner.fitScore > 0 && primary.fitScore - runner.fitScore < 15) {
    parts.push(`Close alternative: "${runner.label}" (${runner.fitScore}/100). Consider A/B testing both.`);
  }

  return parts.join(" ");
}

export { BUSINESS_MODELS };
