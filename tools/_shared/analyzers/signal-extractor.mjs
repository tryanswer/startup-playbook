/**
 * Signal Extractor — extracts actionable signals from raw collected data.
 *
 * Detects 3 categories of signals from Post/Case/Trend items:
 *   1. Pain signals  — user frustrations, complaints, unmet needs
 *   2. Demand signals — purchase intent, search trends, growing interest
 *   3. Supply signals — existing solutions, competitors, market maturity
 *
 * Usage:
 *   import { extractSignals } from './signal-extractor.mjs';
 *   const signals = extractSignals(collectedItems);
 */

import { cleanText, toNumber } from "../http-client.mjs";

/* ------------------------------------------------------------------ */
/*  Signal Rules                                                       */
/* ------------------------------------------------------------------ */

/** Pain signal detection rules — what users are struggling with */
const PAIN_RULES = [
  {
    type: "pricing-pain",
    label: "Pricing complaint",
    weight: 3,
    pattern: /\b(too expensive|pricey|pricing|costs? too much|can'?t afford|overpriced|ripoff|rip-off)\b/i,
  },
  {
    type: "alternative-seeking",
    label: "Alternative seeking",
    weight: 4,
    pattern: /\b(alternative|instead of|replace|replacement|switch from|switching from|similar tool|dupe|competitor)\b/i,
  },
  {
    type: "manual-workflow",
    label: "Manual workflow",
    weight: 5,
    pattern: /\b(manual|manually|spreadsheet|copy.?paste|reconcile|csv|every friday|by hand|tedious|repetitive)\b/i,
  },
  {
    type: "repeated-question",
    label: "Repeated question",
    weight: 2,
    pattern: /\b(what do you use|how are you|ask hn|anyone else|recommend|which tool|should i|best way to)\b/i,
  },
  {
    type: "integration-friction",
    label: "Integration friction",
    weight: 3,
    pattern: /\b(api|integration|webhook|sync|stripe|breaks when|one api changes|doesn'?t integrate)\b/i,
  },
  {
    type: "migration-friction",
    label: "Migration friction",
    weight: 3,
    pattern: /\b(migrate|migration|moving from|switching to|import from|export from|locked in|vendor lock)\b/i,
  },
  {
    type: "tool-complaint",
    label: "Tool complaint",
    weight: 4,
    pattern: /\b(keeps failing|keeps breaking|doesn'?t work|does not work|broken|buggy|unreliable|crashes|laggy)\b/i,
  },
  {
    type: "time-waste",
    label: "Time waste",
    weight: 4,
    pattern: /\b(waste.{0,10}time|hours? (on|doing|spent)|takes forever|too long|slow process|bottleneck)\b/i,
  },
  {
    type: "scaling-pain",
    label: "Scaling pain",
    weight: 3,
    pattern: /\b(doesn'?t scale|can'?t handle|outgr[oe]w|too small|limited|hit.{0,6}limit|throttl)\b/i,
  },
];

/** Demand signal detection rules — willingness to pay or strong interest */
const DEMAND_RULES = [
  {
    type: "purchase-intent",
    label: "Purchase intent",
    weight: 6,
    pattern: /\b(would pay|pay for|paid|budget|buy|subscription|procure|purchase|shut up and take my money)\b/i,
  },
  {
    type: "urgency",
    label: "Urgency",
    weight: 5,
    pattern: /\b(urgent|asap|deadline|need.{0,6}now|immediately|critical|blocking|can'?t wait)\b/i,
  },
  {
    type: "frequency",
    label: "Frequent need",
    weight: 4,
    pattern: /\b(every (day|week|month|time)|daily|weekly|constantly|always have to|recurring|routine)\b/i,
  },
  {
    type: "team-need",
    label: "Team/org need",
    weight: 4,
    pattern: /\b(our team|my company|our org|enterprise|organization|department|we need|colleagues)\b/i,
  },
  {
    type: "feature-request",
    label: "Feature request",
    weight: 3,
    pattern: /\b(feature request|wish.{0,8}(had|could)|missing feature|if only|would be great if|please add)\b/i,
  },
];

/** Supply signal detection rules — existing solutions and competitors */
const SUPPLY_RULES = [
  {
    type: "revenue-signal",
    label: "Revenue mentioned",
    weight: 5,
    pattern: /\$\s?\d|mrr|arr|revenue|profit|\dk\/mo|\d+k? monthly/i,
  },
  {
    type: "pricing-model",
    label: "Pricing model",
    weight: 3,
    pattern: /\$\s?\d|pricing|price|\/mo|per month|subscription|freemium|free tier/i,
  },
  {
    type: "open-source",
    label: "Open source solution",
    weight: 2,
    pattern: /\bgithub|open.?source|self.?hosted?|mit license|apache license\b/i,
  },
  {
    type: "saas-exists",
    label: "SaaS exists",
    weight: 3,
    pattern: /\bsaas|cloud.?based|hosted|platform|\.io\b|\.app\b|\.com\b/i,
  },
  {
    type: "market-growth",
    label: "Market growth signal",
    weight: 4,
    pattern: /\b(growing|trending|new market|emerging|hot space|exploding|taking off)\b/i,
  },
];

const ALL_RULES = [
  ...PAIN_RULES.map((rule) => ({ ...rule, category: "pain" })),
  ...DEMAND_RULES.map((rule) => ({ ...rule, category: "demand" })),
  ...SUPPLY_RULES.map((rule) => ({ ...rule, category: "supply" })),
];

/* ------------------------------------------------------------------ */
/*  Core API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Extract signals from a list of collected items.
 *
 * @param {Array} items — collected items (Post, Case, or Trend format)
 * @returns {{ signals: Signal[], summary: SignalSummary }}
 */
export function extractSignals(items) {
  const signals = [];

  for (const item of items) {
    const itemSignals = extractItemSignals(item);
    signals.push(...itemSignals);
  }

  const summary = buildSignalSummary(signals, items);
  return { signals, summary };
}

/**
 * Extract signals from a single item.
 */
export function extractItemSignals(item) {
  const searchText = buildSearchText(item);
  if (!searchText) return [];

  const signals = [];

  for (const rule of ALL_RULES) {
    if (rule.pattern.test(searchText)) {
      signals.push({
        type: rule.type,
        category: rule.category,
        label: rule.label,
        weight: rule.weight,
        sourceId: item.id ?? null,
        source: item.source ?? null,
        community: item.community ?? null,
        title: cleanText(item.title ?? "", 180),
        excerpt: extractRelevantExcerpt(searchText, rule.pattern, 200),
        score: toNumber(item.score),
        comments: toNumber(item.comments),
        url: item.url ?? null,
        createdAt: item.createdAt ?? null,
      });
    }
  }

  return signals;
}

/**
 * Compute pain rate for a collection of items.
 * painRate = items with ≥1 pain signal / total items
 */
export function computePainRate(items) {
  if (items.length === 0) return { painRate: 0, painCount: 0, total: 0 };

  let painCount = 0;
  for (const item of items) {
    const searchText = buildSearchText(item);
    if (PAIN_RULES.some((rule) => rule.pattern.test(searchText))) {
      painCount++;
    }
  }

  return {
    painRate: Math.round((painCount / items.length) * 100) / 100,
    painCount,
    total: items.length,
  };
}

/**
 * Compute payment signal rate for a collection of items.
 */
export function computePaymentRate(items) {
  if (items.length === 0) return { paymentRate: 0, paymentCount: 0, total: 0 };

  const paymentPattern = /\b(would pay|pay for|paid|budget|buy|subscription|purchase|pricing|price|\$\d)/i;
  let paymentCount = 0;
  for (const item of items) {
    if (paymentPattern.test(buildSearchText(item))) paymentCount++;
  }

  return {
    paymentRate: Math.round((paymentCount / items.length) * 100) / 100,
    paymentCount,
    total: items.length,
  };
}

/**
 * Group signals by type and compute frequency + heat score.
 */
export function groupSignalsByType(signals) {
  const groups = new Map();

  for (const signal of signals) {
    const key = signal.type;
    if (!groups.has(key)) {
      groups.set(key, {
        type: signal.type,
        category: signal.category,
        label: signal.label,
        count: 0,
        totalWeight: 0,
        totalScore: 0,
        totalComments: 0,
        sources: new Set(),
        examples: [],
      });
    }

    const group = groups.get(key);
    group.count++;
    group.totalWeight += signal.weight;
    group.totalScore += signal.score;
    group.totalComments += signal.comments;
    group.sources.add(signal.source);

    if (group.examples.length < 3) {
      group.examples.push({
        title: signal.title,
        excerpt: signal.excerpt,
        url: signal.url,
        source: signal.source,
        score: signal.score,
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      sources: [...group.sources],
      heat: computeHeat(group),
    }))
    .sort((a, b) => b.heat - a.heat);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildSearchText(item) {
  return [item.title, item.excerpt, item.text, item.body, item.pain, item.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function extractRelevantExcerpt(text, pattern, maxLength) {
  const match = pattern.exec(text);
  if (!match) return cleanText(text, maxLength);

  const matchIndex = match.index;
  const contextStart = Math.max(0, matchIndex - 60);
  const contextEnd = Math.min(text.length, matchIndex + match[0].length + 100);
  const excerpt = text.slice(contextStart, contextEnd);

  return cleanText(
    (contextStart > 0 ? "…" : "") + excerpt + (contextEnd < text.length ? "…" : ""),
    maxLength
  );
}

function computeHeat(group) {
  // Heat = weighted frequency × source diversity × engagement
  const frequencyScore = Math.min(group.count * group.totalWeight, 100);
  const sourceCount = group.sources instanceof Set ? group.sources.size : (group.sources?.length ?? 0);
  const diversityMultiplier = 1 + Math.max(0, sourceCount - 1) * 0.3;
  const engagementBonus = Math.log2(1 + (group.totalScore ?? 0) + (group.totalComments ?? 0) * 2);

  return Math.round(frequencyScore * diversityMultiplier + engagementBonus);
}

function buildSignalSummary(signals, items) {
  const painSignals = signals.filter((s) => s.category === "pain");
  const demandSignals = signals.filter((s) => s.category === "demand");
  const supplySignals = signals.filter((s) => s.category === "supply");

  const sources = new Set(items.map((item) => item.source).filter(Boolean));
  const communities = new Set(items.map((item) => item.community).filter(Boolean));

  const painGroups = groupSignalsByType(painSignals);
  const demandGroups = groupSignalsByType(demandSignals);
  const supplyGroups = groupSignalsByType(supplySignals);

  return {
    totalItems: items.length,
    totalSignals: signals.length,
    sources: [...sources],
    communities: [...communities],
    pain: {
      count: painSignals.length,
      uniqueTypes: new Set(painSignals.map((s) => s.type)).size,
      topSignals: painGroups.slice(0, 5),
      ...computePainRate(items),
    },
    demand: {
      count: demandSignals.length,
      uniqueTypes: new Set(demandSignals.map((s) => s.type)).size,
      topSignals: demandGroups.slice(0, 5),
      ...computePaymentRate(items),
    },
    supply: {
      count: supplySignals.length,
      uniqueTypes: new Set(supplySignals.map((s) => s.type)).size,
      topSignals: supplyGroups.slice(0, 5),
    },
  };
}

export { PAIN_RULES, DEMAND_RULES, SUPPLY_RULES, ALL_RULES };
