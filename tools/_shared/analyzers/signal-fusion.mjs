/**
 * Signal Fusion — cross-source signal correlation and opportunity clustering.
 *
 * Takes signals from multiple sources and:
 *   1. Clusters related signals into opportunity themes
 *   2. Cross-validates pain signals with demand/supply evidence
 *   3. Computes confidence scores based on source diversity
 *   4. Identifies evidence gaps that need further validation
 *
 * Usage:
 *   import { fuseSignals } from './signal-fusion.mjs';
 *   const fused = fuseSignals(extractedSignals, collectedItems);
 */

import { cleanText } from "../http-client.mjs";
import { groupSignalsByType } from "./signal-extractor.mjs";
import { scoreOpportunity, classifyDecision } from "./opportunity-scorer.mjs";

/* ------------------------------------------------------------------ */
/*  Core API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Fuse signals from multiple sources into opportunity clusters.
 *
 * @param {{ signals: Signal[], summary: SignalSummary }} extracted
 * @param {Array} items — original collected items
 * @param {Object} [options]
 * @param {Object} [options.trends] — Google Trends data
 * @param {number} [options.minClusterSize=2] — minimum signals to form a cluster
 * @returns {FusionResult}
 */
export function fuseSignals(extracted, items, options = {}) {
  const { signals, summary } = extracted;
  const trends = options.trends ?? {};
  const minClusterSize = options.minClusterSize ?? 2;

  // Step 1: Cluster signals by keyword overlap into opportunity themes
  const clusters = clusterByTheme(signals, items, minClusterSize);

  // Step 2: Score each cluster as an opportunity
  const opportunities = clusters.map((cluster) => {
    const clusterSummary = buildClusterSummary(cluster, signals);
    const score = scoreOpportunity({
      ...clusterSummary,
      trends,
      meta: { caseCount: cluster.caseItems.length },
    });
    const decision = classifyDecision(score.total);

    return {
      id: cluster.id,
      theme: cluster.theme,
      description: cluster.description,
      targetUser: inferTargetUser(cluster),
      painfulSituation: inferPainSituation(cluster),
      evidence: buildEvidenceList(cluster),
      signalTypes: [...new Set(cluster.signals.map((s) => s.type))],
      sourceCount: cluster.sources.size,
      sources: [...cluster.sources],
      communityCount: cluster.communities.size,
      communities: [...cluster.communities],
      score,
      decision,
    };
  });

  // Step 3: Cross-validate and compute confidence
  const crossValidation = crossValidateSignals(summary);

  // Step 4: Identify gaps
  const gaps = identifyGaps(summary, opportunities);

  return {
    generatedAt: new Date().toISOString(),
    inputStats: {
      totalItems: items.length,
      totalSignals: signals.length,
      sourcesCovered: summary.sources,
      communitiesCovered: summary.communities,
    },
    opportunities: opportunities.sort((a, b) => b.score.total - a.score.total),
    topOpportunity: opportunities[0] ?? null,
    crossValidation,
    gaps,
    overallConfidence: computeOverallConfidence(summary, crossValidation),
  };
}

/* ------------------------------------------------------------------ */
/*  Clustering                                                         */
/* ------------------------------------------------------------------ */

/**
 * Cluster signals into opportunity themes based on keyword co-occurrence.
 */
function clusterByTheme(signals, items, minClusterSize) {
  // Extract keywords from signal titles and excerpts
  const signalKeywords = signals.map((signal) => ({
    signal,
    keywords: extractKeywords(signal.title + " " + (signal.excerpt ?? "")),
  }));

  // Build keyword → signal index
  const keywordIndex = new Map();
  for (const { signal, keywords } of signalKeywords) {
    for (const keyword of keywords) {
      if (!keywordIndex.has(keyword)) keywordIndex.set(keyword, []);
      keywordIndex.get(keyword).push(signal);
    }
  }

  // Find high-frequency keywords as cluster anchors
  const anchors = [...keywordIndex.entries()]
    .filter(([, signals]) => signals.length >= minClusterSize)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10); // Top 10 themes

  const assigned = new Set();
  const clusters = [];

  for (const [keyword, clusterSignals] of anchors) {
    const unassigned = clusterSignals.filter((s) => !assigned.has(s.sourceId));
    if (unassigned.length < minClusterSize) continue;

    for (const signal of unassigned) assigned.add(signal.sourceId);

    const sources = new Set(unassigned.map((s) => s.source).filter(Boolean));
    const communities = new Set(unassigned.map((s) => s.community).filter(Boolean));

    // Find related items (Case format)
    const caseItems = items.filter((item) =>
      item.targetUser && !item.community &&
      extractKeywords(item.title + " " + (item.pain ?? "")).includes(keyword)
    );

    clusters.push({
      id: `cluster-${slugify(keyword)}`,
      theme: keyword,
      description: buildClusterDescription(keyword, unassigned),
      signals: unassigned,
      caseItems,
      sources,
      communities,
    });
  }

  // Catch remaining unassigned signals in an "other" cluster
  const remainingSignals = signals.filter((s) => !assigned.has(s.sourceId));
  if (remainingSignals.length > 0) {
    clusters.push({
      id: "cluster-other",
      theme: "other",
      description: "Signals not matching a dominant theme",
      signals: remainingSignals,
      caseItems: [],
      sources: new Set(remainingSignals.map((s) => s.source).filter(Boolean)),
      communities: new Set(remainingSignals.map((s) => s.community).filter(Boolean)),
    });
  }

  return clusters;
}

/* ------------------------------------------------------------------ */
/*  Cross-Validation                                                   */
/* ------------------------------------------------------------------ */

/**
 * Cross-validate signals across categories.
 * Strong opportunities have pain + demand + supply signals from different sources.
 */
function crossValidateSignals(summary) {
  const hasPain = summary.pain.count > 0;
  const hasDemand = summary.demand.count > 0;
  const hasSupply = summary.supply.count > 0;

  const painSources = new Set(summary.pain.topSignals?.flatMap((s) => s.sources) ?? []);
  const demandSources = new Set(summary.demand.topSignals?.flatMap((s) => s.sources) ?? []);
  const supplySources = new Set(summary.supply.topSignals?.flatMap((s) => s.sources) ?? []);

  // Find sources that appear in multiple signal categories
  const allSources = new Set([...painSources, ...demandSources, ...supplySources]);
  const multiCategorySources = [...allSources].filter((source) => {
    let count = 0;
    if (painSources.has(source)) count++;
    if (demandSources.has(source)) count++;
    if (supplySources.has(source)) count++;
    return count >= 2;
  });

  return {
    painConfirmed: hasPain,
    demandConfirmed: hasDemand,
    supplyMapped: hasSupply,
    triangulated: hasPain && hasDemand && hasSupply,
    multiCategorySources,
    convergenceScore: computeConvergence(summary),
    assessment: buildAssessment(hasPain, hasDemand, hasSupply, summary),
  };
}

function computeConvergence(summary) {
  let score = 0;
  if (summary.pain.count > 0) score += 30;
  if (summary.demand.count > 0) score += 25;
  if (summary.supply.count > 0) score += 15;
  if (summary.pain.painRate >= 0.2) score += 10;
  if (summary.demand.paymentRate >= 0.05) score += 10;
  if (summary.sources.length >= 3) score += 10;
  return Math.min(score, 100);
}

function buildAssessment(hasPain, hasDemand, hasSupply, summary) {
  if (hasPain && hasDemand && hasSupply) {
    return "Strong triangulation: pain confirmed, demand validated, supply landscape mapped.";
  }
  if (hasPain && hasDemand) {
    return "Pain and demand confirmed but supply landscape not yet mapped. Research competitors next.";
  }
  if (hasPain && hasSupply) {
    return "Pain and supply mapped but purchase intent unconfirmed. Validate willingness to pay next.";
  }
  if (hasPain) {
    return "Pain signals found but demand and supply need investigation. Collect more evidence.";
  }
  if (hasDemand) {
    return "Demand signals found but underlying pain unclear. Investigate root causes.";
  }
  return "Insufficient signals. Broaden search queries or add more data sources.";
}

/* ------------------------------------------------------------------ */
/*  Gap Analysis                                                       */
/* ------------------------------------------------------------------ */

function identifyGaps(summary, opportunities) {
  const gaps = [];

  if (summary.pain.count === 0) {
    gaps.push({
      type: "missing-pain",
      severity: "critical",
      message: "No pain signals detected. Users may not have a real problem worth solving.",
      action: "Search with more specific queries in communities where target users congregate.",
    });
  }

  if (summary.demand.paymentRate < 0.03) {
    gaps.push({
      type: "weak-payment-intent",
      severity: "high",
      message: `Payment signal rate is ${(summary.demand.paymentRate * 100).toFixed(1)}% (below 3% threshold).`,
      action: "Look for pricing discussions, budget mentions, or competitor pricing complaints.",
    });
  }

  if (summary.sources.length < 2) {
    gaps.push({
      type: "single-source",
      severity: "medium",
      message: `Only ${summary.sources.length} data source(s) used. Single-source bias risk.`,
      action: "Add data from at least 2 additional sources to cross-validate findings.",
    });
  }

  if (summary.pain.count > 0 && summary.supply.count === 0) {
    gaps.push({
      type: "unmapped-competition",
      severity: "medium",
      message: "Pain detected but no competitor/supply signals found.",
      action: "Search GitHub, Product Hunt, and App Store for existing solutions.",
    });
  }

  if (summary.pain.painRate > 0 && summary.pain.painRate < 0.15) {
    gaps.push({
      type: "low-pain-rate",
      severity: "low",
      message: `Pain rate is ${(summary.pain.painRate * 100).toFixed(0)}% — below the 15% threshold for strong signal.`,
      action: "Narrow the search to more specific subreddits or communities.",
    });
  }

  if (opportunities.length > 0 && opportunities[0].sourceCount < 2) {
    gaps.push({
      type: "unvalidated-opportunity",
      severity: "medium",
      message: "Top opportunity only has evidence from a single source.",
      action: "Cross-validate the top theme across at least 2 different data sources.",
    });
  }

  return gaps;
}

/* ------------------------------------------------------------------ */
/*  Confidence                                                         */
/* ------------------------------------------------------------------ */

function computeOverallConfidence(summary, crossValidation) {
  const convergence = crossValidation.convergenceScore;

  if (convergence >= 80) {
    return { level: "high", score: convergence, label: "High confidence — multiple sources converge" };
  }
  if (convergence >= 50) {
    return { level: "medium", score: convergence, label: "Medium confidence — some gaps remain" };
  }
  return { level: "low", score: convergence, label: "Low confidence — insufficient evidence" };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract meaningful keywords from text (simple stopword-filtered tokenizer) */
function extractKeywords(text) {
  const STOPWORDS = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "out", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "because", "but", "and",
    "or", "if", "while", "about", "up", "it", "its", "this", "that",
    "what", "which", "who", "whom", "these", "those", "i", "me", "my",
    "we", "our", "you", "your", "he", "him", "his", "she", "her", "they",
    "them", "their", "am", "get", "got", "use", "used", "using", "like",
    "also", "still", "even", "much", "many", "well", "way", "make",
  ]);

  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .slice(0, 30);
}

function slugify(text) {
  return (text ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function buildClusterDescription(keyword, signals) {
  const categories = new Set(signals.map((s) => s.category));
  const parts = [];
  if (categories.has("pain")) parts.push("pain signals");
  if (categories.has("demand")) parts.push("demand indicators");
  if (categories.has("supply")) parts.push("supply evidence");
  return `"${keyword}" theme — ${signals.length} signals (${parts.join(" + ")})`;
}

function buildClusterSummary(cluster, allSignals) {
  const clusterSignals = cluster.signals;
  const painSignals = clusterSignals.filter((s) => s.category === "pain");
  const demandSignals = clusterSignals.filter((s) => s.category === "demand");
  const supplySignals = clusterSignals.filter((s) => s.category === "supply");

  return {
    pain: {
      count: painSignals.length,
      uniqueTypes: new Set(painSignals.map((s) => s.type)).size,
      painRate: clusterSignals.length > 0
        ? painSignals.length / clusterSignals.length
        : 0,
      paymentRate: 0,
      topSignals: groupSignalsByType(painSignals).slice(0, 3),
    },
    demand: {
      count: demandSignals.length,
      uniqueTypes: new Set(demandSignals.map((s) => s.type)).size,
      paymentRate: clusterSignals.length > 0
        ? demandSignals.filter((s) => s.type === "purchase-intent").length / clusterSignals.length
        : 0,
      topSignals: groupSignalsByType(demandSignals).slice(0, 3),
    },
    supply: {
      count: supplySignals.length,
      uniqueTypes: new Set(supplySignals.map((s) => s.type)).size,
      topSignals: groupSignalsByType(supplySignals).slice(0, 3),
    },
  };
}

function inferTargetUser(cluster) {
  // Look for team/org signals or community-specific users
  const teamSignals = cluster.signals.filter((s) => s.type === "team-need");
  if (teamSignals.length > 0) return "Teams/organizations";

  const communities = [...cluster.communities];
  if (communities.length > 0) return `Users in ${communities.slice(0, 3).join(", ")}`;

  return "General users";
}

function inferPainSituation(cluster) {
  const painSignals = cluster.signals.filter((s) => s.category === "pain");
  if (painSignals.length === 0) return "No specific pain identified yet";

  // Use the most engaged pain signal's excerpt
  const topPain = painSignals
    .sort((a, b) => (b.score + b.comments) - (a.score + a.comments))[0];

  return cleanText(topPain.excerpt ?? topPain.title, 200);
}

function buildEvidenceList(cluster) {
  return cluster.signals
    .sort((a, b) => (b.score + b.comments) - (a.score + a.comments))
    .slice(0, 8)
    .map((signal) => ({
      id: signal.sourceId,
      type: signal.category,
      signalType: signal.type,
      source: signal.source,
      title: signal.title,
      url: signal.url,
      score: signal.score,
      comments: signal.comments,
    }));
}
