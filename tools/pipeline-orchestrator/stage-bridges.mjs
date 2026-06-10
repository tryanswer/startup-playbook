/**
 * Stage Bridge Functions
 *
 * Each bridge transforms the handoff.json from stage A into the input.json
 * expected by stage B, enabling automatic data flow between stages.
 *
 * Naming: bridge_{fromStage}_{toStage}
 */

/**
 * discover → validate
 * Picks the top candidate from opportunity radar and formats it
 * for idea-validator input.
 */
export function bridge_discover_validate(handoff) {
  const summary = handoff?.summary ?? {};
  return {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId: handoff?.projectId ?? "unknown",
    fromStage: "discover",
    toStage: "validate",
    generatedAt: new Date().toISOString(),
    targetUser: summary.targetUserCandidate ?? null,
    painfulSituation: summary.painfulSituation ?? null,
    promiseCandidate: summary.promiseCandidate ?? null,
    candidateId: summary.candidateId ?? null,
    ideaSummary: buildIdeaSummary(summary),
    suggestedKeywords: summary.suggestedKeywords ?? [],
    suggestedSubreddits: summary.suggestedSubreddits ?? [],
    discoveryEvidence: summary.topSignals ?? [],
  };
}

/**
 * validate → business-model
 * Passes narrowed segment, pain language, and paid-intent signals.
 */
export function bridge_validate_businessModel(handoff) {
  const summary = handoff?.summary ?? {};
  return {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId: handoff?.projectId ?? "unknown",
    fromStage: "validate",
    toStage: "business-model",
    generatedAt: new Date().toISOString(),
    narrowedSegment: summary.narrowedSegment ?? null,
    strongestPainLanguage: summary.strongestRawLanguage ?? [],
    paidIntentGaps: summary.paidIntentGaps ?? [],
    validationScore: summary.validationScore ?? null,
    competitorLandscape: summary.competitorSnapshot ?? [],
    willToPayEvidence: summary.willToPayEvidence ?? [],
    recommendedNextExperiment: summary.recommendedNextExperiment ?? null,
  };
}

/**
 * business-model → build
 * Passes pricing hypothesis, model type, and must-not-build list.
 */
export function bridge_businessModel_build(handoff) {
  const summary = handoff?.summary ?? {};
  return {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId: handoff?.projectId ?? "unknown",
    fromStage: "business-model",
    toStage: "build",
    generatedAt: new Date().toISOString(),
    modelType: summary.modelType ?? null,
    pricingHypothesis: summary.pricingHypothesis ?? null,
    pricingTiers: summary.pricingTiers ?? [],
    firstPaidTest: summary.firstPaidTest ?? null,
    mustNotBuild: summary.mustNotBuild ?? [],
    revenueMilestones: summary.revenueMilestones ?? [],
    targetBuyerProfile: summary.targetBuyerProfile ?? null,
  };
}

/**
 * build → grow
 * Passes deployed URL, analytics events, and launch channel.
 */
export function bridge_build_grow(handoff) {
  const summary = handoff?.summary ?? {};
  return {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId: handoff?.projectId ?? "unknown",
    fromStage: "build",
    toStage: "grow",
    generatedAt: new Date().toISOString(),
    deployedUrl: summary.deployedUrl ?? null,
    analyticsEvents: summary.analyticsEvents ?? [],
    launchChannel: summary.launchChannel ?? null,
    mvpFeatures: summary.mvpFeatures ?? [],
    coreWebVitals: summary.coreWebVitals ?? null,
    minimumPromise: summary.minimumPromise ?? null,
  };
}

/**
 * grow → operate
 * Passes active channels, UTM conventions, and measurement thresholds.
 */
export function bridge_grow_operate(handoff) {
  const summary = handoff?.summary ?? {};
  return {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId: handoff?.projectId ?? "unknown",
    fromStage: "grow",
    toStage: "operate",
    generatedAt: new Date().toISOString(),
    activeChannels: summary.activeChannels ?? [],
    utmConvention: summary.utmConvention ?? null,
    seoAsoTargets: summary.seoAsoTargets ?? [],
    measurementThresholds: summary.measurementThresholds ?? null,
    contentBacklog: summary.contentBacklog ?? [],
    topKeywordClusters: summary.topKeywordClusters ?? [],
  };
}

/**
 * operate → validate (loop-back for pivot/re-validation)
 * Passes key metrics, biggest blocker, and next experiment.
 */
export function bridge_operate_validate(handoff) {
  const summary = handoff?.summary ?? {};
  return {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId: handoff?.projectId ?? "unknown",
    fromStage: "operate",
    toStage: "validate",
    generatedAt: new Date().toISOString(),
    keyMetrics: summary.keyMetrics ?? null,
    biggestBlocker: summary.biggestBlocker ?? null,
    nextExperiment: summary.nextExperiment ?? null,
    retentionData: summary.retentionData ?? null,
    pivotReason: summary.pivotReason ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Bridge Registry                                                    */
/* ------------------------------------------------------------------ */

const BRIDGE_MAP = {
  "discover→validate": bridge_discover_validate,
  "validate→business-model": bridge_validate_businessModel,
  "business-model→build": bridge_businessModel_build,
  "build→grow": bridge_build_grow,
  "grow→operate": bridge_grow_operate,
  "operate→validate": bridge_operate_validate,
};

/**
 * Get the bridge function for a given stage transition.
 * @param {string} fromStage
 * @param {string} toStage
 * @returns {Function|null}
 */
export function getBridge(fromStage, toStage) {
  const key = `${fromStage}→${toStage}`;
  return BRIDGE_MAP[key] ?? null;
}

/**
 * Execute a bridge: read handoff from source stage, transform, write input to target stage.
 */
export async function executeBridge(fromStage, toStage, handoffData) {
  const bridge = getBridge(fromStage, toStage);
  if (!bridge) {
    throw new Error(
      `No bridge defined for ${fromStage} → ${toStage}. ` +
      `Available: ${Object.keys(BRIDGE_MAP).join(", ")}`
    );
  }
  return bridge(handoffData);
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function buildIdeaSummary(summary) {
  const parts = [];
  if (summary.targetUserCandidate) parts.push(`For: ${summary.targetUserCandidate}`);
  if (summary.painfulSituation) parts.push(`Pain: ${summary.painfulSituation}`);
  if (summary.promiseCandidate) parts.push(`Promise: ${summary.promiseCandidate}`);
  return parts.join(" | ") || null;
}

export { BRIDGE_MAP };
