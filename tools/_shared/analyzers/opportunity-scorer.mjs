/**
 * Opportunity Scorer — multi-dimensional scoring for startup opportunities.
 *
 * Scoring dimensions (total 100):
 *   - painHeat:     40 pts — pain frequency × intensity × payment signals
 *   - caseProof:    25 pts — validated cases, revenue signals, product shape
 *   - demandTrend:  15 pts — search volume growth, community discussion growth
 *   - channelReach: 10 pts — number of reachable channels with real users
 *   - feasibility:  10 pts — solo-founder feasibility, MVP timeline
 *
 * Usage:
 *   import { scoreOpportunity, classifyDecision } from './opportunity-scorer.mjs';
 *   const scored = scoreOpportunity(signalSummary);
 *   const decision = classifyDecision(scored.total);
 */

/* ------------------------------------------------------------------ */
/*  Scoring Engine                                                     */
/* ------------------------------------------------------------------ */

/**
 * Score an opportunity from extracted signal summary.
 *
 * @param {Object} input
 * @param {Object} input.pain — pain signal summary from signal-extractor
 * @param {Object} input.demand — demand signal summary
 * @param {Object} input.supply — supply signal summary
 * @param {Object} [input.trends] — trend data (from Google Trends)
 * @param {Object} [input.meta] — additional metadata
 * @returns {OpportunityScore}
 */
export function scoreOpportunity(input) {
  const pain = input.pain ?? {};
  const demand = input.demand ?? {};
  const supply = input.supply ?? {};
  const trends = input.trends ?? {};
  const meta = input.meta ?? {};

  const painHeat = computePainHeat(pain);
  const caseProof = computeCaseProof(supply, meta);
  const demandTrend = computeDemandTrend(demand, trends);
  const channelReach = computeChannelReach(input);
  const feasibility = computeFeasibility(supply, meta);

  const total = clamp(
    painHeat + caseProof + demandTrend + channelReach + feasibility,
    0,
    100
  );

  return {
    painHeat,
    caseProof,
    demandTrend,
    channelReach,
    feasibility,
    total,
    breakdown: {
      painHeat: { score: painHeat, max: 40, description: descPainHeat(pain) },
      caseProof: { score: caseProof, max: 25, description: descCaseProof(supply) },
      demandTrend: { score: demandTrend, max: 15, description: descDemandTrend(demand, trends) },
      channelReach: { score: channelReach, max: 10, description: descChannelReach(input) },
      feasibility: { score: feasibility, max: 10, description: descFeasibility(supply) },
    },
  };
}

/**
 * Classify a score into a decision: continue / pivot / kill.
 *
 * @param {number} score — total score (0–100)
 * @returns {{ decision: string, label: string, reasoning: string }}
 */
export function classifyDecision(score) {
  if (score >= 65) {
    return {
      decision: "continue",
      label: "✅ Continue",
      color: "green",
      reasoning: `Score ${score}/100 — strong evidence of real pain, demand, and viable path. Proceed to validation.`,
    };
  }
  if (score >= 40) {
    return {
      decision: "pivot",
      label: "🔄 Pivot",
      color: "orange",
      reasoning: `Score ${score}/100 — some signals but gaps remain. Consider narrowing the segment, changing the angle, or collecting more evidence.`,
    };
  }
  return {
    decision: "kill",
    label: "❌ Kill",
    color: "red",
    reasoning: `Score ${score}/100 — insufficient evidence of pain or demand. Move on to next opportunity.`,
  };
}

/**
 * Rank multiple opportunities by score.
 */
export function rankOpportunities(opportunities) {
  return [...opportunities]
    .sort((a, b) => b.score.total - a.score.total)
    .map((opportunity, index) => ({
      ...opportunity,
      rank: index + 1,
      decision: classifyDecision(opportunity.score.total),
    }));
}

/* ------------------------------------------------------------------ */
/*  Dimension Scorers                                                  */
/* ------------------------------------------------------------------ */

function computePainHeat(pain) {
  let score = 0;

  // Pain rate: 0-15 pts
  const painRate = pain.painRate ?? 0;
  if (painRate >= 0.4) score += 15;
  else if (painRate >= 0.25) score += 12;
  else if (painRate >= 0.15) score += 8;
  else if (painRate >= 0.05) score += 4;

  // Unique pain types: 0-10 pts (diversity of pain signals)
  const uniqueTypes = pain.uniqueTypes ?? 0;
  score += clamp(uniqueTypes * 2.5, 0, 10);

  // Pain signal count (volume): 0-8 pts
  const painCount = pain.count ?? 0;
  if (painCount >= 20) score += 8;
  else if (painCount >= 10) score += 6;
  else if (painCount >= 5) score += 4;
  else if (painCount >= 2) score += 2;

  // Payment signal boost: 0-7 pts
  const paymentRate = pain.paymentRate ?? 0;
  if (paymentRate >= 0.15) score += 7;
  else if (paymentRate >= 0.08) score += 5;
  else if (paymentRate >= 0.03) score += 3;

  return clamp(Math.round(score), 0, 40);
}

function computeCaseProof(supply, meta) {
  let score = 0;

  // Revenue signals: 0-10 pts
  const revenueSignals = countSignalType(supply, "revenue-signal");
  if (revenueSignals >= 3) score += 10;
  else if (revenueSignals >= 1) score += 7;

  // Existing product shape: 0-8 pts
  const productSignals = countSignalType(supply, "pricing-model") + countSignalType(supply, "saas-exists");
  if (productSignals >= 3) score += 8;
  else if (productSignals >= 1) score += 5;

  // Case count from meta: 0-7 pts
  const caseCount = meta.caseCount ?? 0;
  if (caseCount >= 5) score += 7;
  else if (caseCount >= 2) score += 5;
  else if (caseCount >= 1) score += 3;

  return clamp(Math.round(score), 0, 25);
}

function computeDemandTrend(demand, trends) {
  let score = 0;

  // Demand signal count: 0-6 pts
  const demandCount = demand.count ?? 0;
  if (demandCount >= 10) score += 6;
  else if (demandCount >= 5) score += 4;
  else if (demandCount >= 2) score += 2;

  // Purchase intent signals: 0-5 pts
  const purchaseIntent = countSignalType(demand, "purchase-intent");
  if (purchaseIntent >= 5) score += 5;
  else if (purchaseIntent >= 2) score += 3;
  else if (purchaseIntent >= 1) score += 1;

  // Trend data (if available from Google Trends): 0-4 pts
  if (trends.averages?.length > 0) {
    const avgInterest = trends.averages.reduce((sum, a) => sum + (a.average ?? 0), 0) / trends.averages.length;
    if (avgInterest >= 60) score += 4;
    else if (avgInterest >= 30) score += 2;
    else if (avgInterest >= 10) score += 1;
  }

  return clamp(Math.round(score), 0, 15);
}

function computeChannelReach(input) {
  let score = 0;

  // Number of data sources where signals were found
  const sources = new Set();
  for (const category of ["pain", "demand", "supply"]) {
    const topSignals = input[category]?.topSignals ?? [];
    for (const signal of topSignals) {
      for (const source of signal.sources ?? []) {
        sources.add(source);
      }
    }
  }

  const sourceCount = sources.size;
  if (sourceCount >= 4) score += 8;
  else if (sourceCount >= 3) score += 6;
  else if (sourceCount >= 2) score += 4;
  else if (sourceCount >= 1) score += 2;

  // Community count bonus
  const communities = new Set();
  for (const category of ["pain", "demand"]) {
    const topSignals = input[category]?.topSignals ?? [];
    for (const signal of topSignals) {
      for (const example of signal.examples ?? []) {
        if (example.source) communities.add(example.source);
      }
    }
  }
  if (communities.size >= 3) score += 2;

  return clamp(Math.round(score), 0, 10);
}

function computeFeasibility(supply, meta) {
  let score = 6; // Base score: assume feasible until proven otherwise

  // Open source exists → easier to build on: +2
  const openSourceSignals = countSignalType(supply, "open-source");
  if (openSourceSignals >= 1) score += 2;

  // Too many SaaS competitors → harder to differentiate: -2
  const saasCount = countSignalType(supply, "saas-exists");
  if (saasCount >= 5) score -= 2;

  // Market growth signal → good timing: +2
  const growthSignals = countSignalType(supply, "market-growth");
  if (growthSignals >= 1) score += 2;

  return clamp(Math.round(score), 0, 10);
}

/* ------------------------------------------------------------------ */
/*  Description Generators                                             */
/* ------------------------------------------------------------------ */

function descPainHeat(pain) {
  const rate = pain.painRate ?? 0;
  const count = pain.count ?? 0;
  if (count === 0) return "No pain signals detected";
  return `${count} pain signals detected (rate: ${(rate * 100).toFixed(0)}%), ${pain.uniqueTypes ?? 0} distinct types`;
}

function descCaseProof(supply) {
  const count = supply.count ?? 0;
  if (count === 0) return "No case/supply signals found";
  return `${count} supply signals: ${supply.uniqueTypes ?? 0} types detected`;
}

function descDemandTrend(demand, trends) {
  const parts = [];
  if (demand.count > 0) parts.push(`${demand.count} demand signals`);
  if (demand.paymentRate > 0) parts.push(`payment rate: ${(demand.paymentRate * 100).toFixed(0)}%`);
  if (trends.averages?.length > 0) {
    const avgInterest = Math.round(trends.averages.reduce((s, a) => s + (a.average ?? 0), 0) / trends.averages.length);
    parts.push(`trend interest: ${avgInterest}/100`);
  }
  return parts.length > 0 ? parts.join(", ") : "No demand trend data";
}

function descChannelReach(input) {
  const sources = new Set();
  for (const cat of ["pain", "demand", "supply"]) {
    for (const s of input[cat]?.topSignals ?? []) {
      for (const src of s.sources ?? []) sources.add(src);
    }
  }
  return sources.size > 0
    ? `Signals found across ${sources.size} source(s): ${[...sources].join(", ")}`
    : "No channel reach data";
}

function descFeasibility(supply) {
  const oss = countSignalType(supply, "open-source");
  const saas = countSignalType(supply, "saas-exists");
  const parts = [];
  if (oss > 0) parts.push("open-source foundations available");
  if (saas >= 5) parts.push("crowded SaaS market");
  else if (saas >= 1) parts.push("some SaaS competition");
  return parts.length > 0 ? parts.join(", ") : "Default feasibility assumed";
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function countSignalType(categoryData, signalType) {
  const topSignals = categoryData?.topSignals ?? [];
  const found = topSignals.find((s) => s.type === signalType);
  return found?.count ?? 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
