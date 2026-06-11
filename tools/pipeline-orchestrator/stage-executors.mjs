/**
 * Stage Executors — maps each pipeline stage to an automated analysis function.
 *
 * Each executor reads the stage's input.json, runs the corresponding analysis,
 * and writes report.json + handoff.json + report.md to the stage directory.
 *
 * Executors are optional — stages can still be completed manually.
 * The orchestrator calls executors when --auto-run is set and the stage
 * has no report yet.
 */

import { readInput, readHandoff, writeReport, writeHandoff, STAGES_DIR } from "../_shared/playbook-io.mjs";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { extractSignals } from "../_shared/analyzers/signal-extractor.mjs";
import { fuseSignals } from "../_shared/analyzers/signal-fusion.mjs";
import { generateReport, generateMarkdown } from "../_shared/analyzers/report-generator.mjs";
import { matchBusinessModel, generateModelMarkdown } from "../_shared/analyzers/business-model-matcher.mjs";
import { collectFromSources } from "../_shared/data-sources/index.mjs";
import { loadCredentials, getCredential } from "../_shared/credentials.mjs";
import { EvidenceTracker } from "../_shared/evidence-tracker.mjs";

/* ------------------------------------------------------------------ */
/*  Executor Registry                                                  */
/* ------------------------------------------------------------------ */

const STAGE_EXECUTORS = {
  discover: executeDiscover,
  validate: executeValidate,
  "business-model": executeBusinessModel,
  // build, grow, operate — human-driven, no auto-executor yet
};

/**
 * Check if a stage has an auto-executor.
 */
export function hasExecutor(stageName) {
  return stageName in STAGE_EXECUTORS;
}

/**
 * Run the executor for a stage. Returns the report data on success.
 *
 * @param {string} stageName
 * @param {Object} [options]
 * @param {Function} [options.onProgress] — progress callback(stage, status, detail)
 * @returns {Promise<{ success: boolean, report: Object|null, message: string }>}
 */
export async function executeStage(stageName, options = {}) {
  const executor = STAGE_EXECUTORS[stageName];
  if (!executor) {
    return {
      success: false,
      report: null,
      message: `No auto-executor for stage "${stageName}". Run manually.`,
    };
  }

  const onProgress = options.onProgress ?? (() => {});

  try {
    onProgress(stageName, "starting", `Executing ${stageName} stage...`);
    const result = await executor(options);
    onProgress(stageName, "completed", `${stageName} stage completed.`);
    return result;
  } catch (error) {
    onProgress(stageName, "error", error.message);
    return {
      success: false,
      report: null,
      message: `Executor failed for "${stageName}": ${error.message}`,
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Discover Executor                                                  */
/* ------------------------------------------------------------------ */

/**
 * Discover stage: collect data from multiple sources and analyze for opportunities.
 *
 * Reads discover/input.json for configuration, or uses defaults.
 * Writes discover/{report.json, handoff.json, report.md}.
 */
async function executeDiscover(options = {}) {
  const input = await readInput("discover");
  const query = input?.query ?? "startup saas tool";
  const sourceNames = input?.sources ?? ["hacker-news", "github", "google-autocomplete"];
  const projectId = input?.projectId ?? "auto-discover";

  await loadCredentials();
  const credentials = buildCredentialsMap();

  // Step 1: Collect data
  options.onProgress?.("discover", "collecting", `Collecting from ${sourceNames.length} sources...`);

  const sourceConfigs = sourceNames.map((name) => ({
    type: name,
    query,
    limit: 25,
    communities: name === "reddit" ? ["SaaS", "startups"] : undefined,
    queries: name === "google-autocomplete" ? [query] : undefined,
    keywords: name === "google-trends" ? [query] : undefined,
  }));

  const collectResult = await collectFromSources(sourceConfigs, { credentials });

  if (collectResult.items.length === 0) {
    return { success: false, report: null, message: "No data collected. Check sources and credentials." };
  }

  // Step 2: Analyze
  options.onProgress?.("discover", "analyzing", `Analyzing ${collectResult.items.length} items...`);

  const extracted = extractSignals(collectResult.items);
  const fusion = fuseSignals(extracted, collectResult.items);
  const report = generateReport(fusion, { projectId, query });
  const modelMatch = matchBusinessModel(report);
  const markdown = generateMarkdown(report) + "\n\n" + generateModelMarkdown(modelMatch);

  // Step 3: Record evidence
  const tracker = await EvidenceTracker.load();
  const evidenceIds = tracker.addFromAnalysis("discover", collectResult.items, extracted);
  await tracker.save();
  options.onProgress?.("discover", "analyzing", `Recorded ${evidenceIds.length} evidence entries.`);

  // Step 4: Write stage artifacts
  const topOpp = fusion.topOpportunity;

  await writeReport("discover", {
    protocolVersion: "1.0",
    artifactType: "stage-report",
    projectId,
    stage: "discover",
    generatedAt: report.generatedAt,
    status: "completed",
    score: report.score,
    decision: report.decision,
    nextStageAction: report.decision === "continue" ? "advance" : "stay",
    reasoning: report.reasoning,
    known: topOpp?.evidence?.map((e) => `${e.signalType} from ${e.source}: "${e.title}"`) ?? [],
    assumed: ["Community signals are discovery evidence, not validation proof."],
    toValidate: report.nextSteps,
    concerns: report.gaps.map((g) => g.message),
    nextSteps: report.nextSteps,
    analysis: {
      opportunities: report.opportunities,
      crossValidation: report.crossValidation,
      confidence: report.confidence,
      gaps: report.gaps,
      businessModel: {
        primary: modelMatch.primaryModel.label,
        fitScore: modelMatch.primaryModel.fitScore,
        reasoning: modelMatch.reasoning,
      },
    },
    evidenceCount: evidenceIds.length,
  });

  await writeHandoff("discover", {
    protocolVersion: "1.0",
    artifactType: "stage-handoff",
    projectId,
    fromStage: "discover",
    toStage: "validate",
    generatedAt: report.generatedAt,
    summary: {
      candidateId: topOpp?.id ?? null,
      targetUserCandidate: topOpp?.targetUser ?? null,
      painfulSituation: topOpp?.painfulSituation ?? null,
      promiseCandidate: topOpp?.description ?? null,
      topSignals: topOpp?.signalTypes ?? [],
      suggestedKeywords: query ? [query] : [],
      suggestedSubreddits: topOpp?.communities?.filter((c) => c !== "Hacker News") ?? [],
      score: report.score,
      decision: report.decision,
      evidenceRefs: evidenceIds.slice(0, 20),
    },
  });

  await writeMarkdownReport("discover", markdown);

  return {
    success: true,
    report,
    message: `Discover complete: score=${report.score}/100, decision=${report.decision}, ${report.opportunities.length} opportunities, ${evidenceIds.length} evidence recorded`,
  };
}

/* ------------------------------------------------------------------ */
/*  Validate Executor                                                  */
/* ------------------------------------------------------------------ */

/**
 * Validate stage: deeper analysis using more sources, focused on the
 * top candidate from discover's handoff.
 *
 * Reads validate/input.json (produced by bridge_discover_validate).
 */
async function executeValidate(options = {}) {
  const input = await readInput("validate");
  if (!input) {
    return { success: false, report: null, message: "No input.json for validate stage. Run discover first and advance." };
  }

  const projectId = input.projectId ?? "auto-validate";
  const targetUser = input.targetUser ?? null;
  const painfulSituation = input.painfulSituation ?? null;
  const keywords = input.suggestedKeywords ?? [];
  const subreddits = input.suggestedSubreddits ?? [];

  // Build a more focused query from discover handoff
  const query = keywords[0] ?? "startup tool";

  await loadCredentials();
  const credentials = buildCredentialsMap();

  // Step 1: Collect from more diverse sources for cross-validation
  options.onProgress?.("validate", "collecting", "Collecting from diverse sources for validation...");

  const sourceConfigs = [
    { type: "hacker-news", query, limit: 30 },
    { type: "github", query, limit: 30 },
    { type: "google-autocomplete", queries: [query, ...(keywords.slice(1, 3))], limit: 10 },
  ];

  // Add Reddit with suggested subreddits
  if (subreddits.length > 0) {
    sourceConfigs.push({
      type: "reddit",
      query,
      limit: 20,
      communities: subreddits.slice(0, 3),
    });
  } else {
    sourceConfigs.push({ type: "reddit", query, limit: 20, communities: ["SaaS", "startups", "Entrepreneur"] });
  }

  // Add Product Hunt if token available
  if (credentials.PRODUCT_HUNT_TOKEN) {
    sourceConfigs.push({ type: "product-hunt", query, limit: 10 });
  }

  const collectResult = await collectFromSources(sourceConfigs, { credentials });

  if (collectResult.items.length === 0) {
    return { success: false, report: null, message: "No data collected for validation." };
  }

  // Step 2: Analyze with validation focus
  options.onProgress?.("validate", "analyzing", `Validating with ${collectResult.items.length} items from ${Object.keys(collectResult.coverage).length} sources...`);

  const extracted = extractSignals(collectResult.items);
  const fusion = fuseSignals(extracted, collectResult.items);
  const report = generateReport(fusion, { projectId, query });

  // Validation-specific decision: stricter thresholds
  const validationScore = report.score;
  const validationDecision = validationScore >= 60 ? "continue" : validationScore >= 35 ? "pivot" : "kill";

  // Step 3: Record evidence + reference discover evidence
  const tracker = await EvidenceTracker.load();
  const evidenceIds = tracker.addFromAnalysis("validate", collectResult.items, extracted);

  // Mark discover evidence as referenced by validate (cross-stage linkage)
  const discoverRefs = tracker.getEvidenceRefs("discover");
  tracker.markReferencedBy(discoverRefs, "validate");
  await tracker.save();
  options.onProgress?.("validate", "analyzing", `Recorded ${evidenceIds.length} evidence entries.`);

  // Step 4: Write stage artifacts
  await writeReport("validate", {
    protocolVersion: "1.0",
    artifactType: "stage-report",
    projectId,
    stage: "validate",
    generatedAt: report.generatedAt,
    status: "completed",
    score: validationScore,
    decision: validationDecision,
    nextStageAction: validationDecision === "continue" ? "advance" : "stay",
    reasoning: report.reasoning,
    context: {
      fromDiscover: { targetUser, painfulSituation, keywords, subreddits },
      validationSources: Object.keys(collectResult.coverage),
      itemsAnalyzed: collectResult.items.length,
    },
    known: report.opportunities.slice(0, 3).map((o) => `${o.theme}: ${o.signalTypes.join(", ")}`),
    assumed: ["Validation uses broader sources but still relies on public signals, not user interviews."],
    toValidate: [
      "Conduct 3-5 user interviews to confirm pain points",
      "Test willingness to pay with a landing page",
      ...report.nextSteps.slice(0, 3),
    ],
    concerns: report.gaps.map((g) => g.message),
    nextSteps: report.nextSteps,
    analysis: {
      opportunities: report.opportunities,
      crossValidation: report.crossValidation,
      confidence: report.confidence,
      gaps: report.gaps,
    },
  });

  const topOpp = fusion.topOpportunity;
  await writeHandoff("validate", {
    protocolVersion: "1.0",
    artifactType: "stage-handoff",
    projectId,
    fromStage: "validate",
    toStage: "business-model",
    generatedAt: report.generatedAt,
    summary: {
      narrowedSegment: topOpp?.targetUser ?? targetUser,
      strongestRawLanguage: topOpp?.evidence?.slice(0, 5).map((e) => e.title) ?? [],
      paidIntentGaps: report.gaps.filter((g) => g.type === "weak-payment-intent").map((g) => g.message),
      validationScore,
      competitorSnapshot: report.opportunities
        .filter((o) => o.signalTypes.includes("saas-exists"))
        .slice(0, 5)
        .map((o) => ({ theme: o.theme, score: o.score.total, sources: o.sources })),
      willToPayEvidence: extracted.signals
        .filter((s) => s.type === "purchase-intent")
        .slice(0, 5)
        .map((s) => ({ title: s.title, source: s.source, url: s.url })),
      recommendedNextExperiment: "Create a landing page with pricing to test purchase intent",
      evidenceRefs: evidenceIds.slice(0, 20),
    },
  });

  const markdown = generateMarkdown(report);
  await writeMarkdownReport("validate", markdown);

  return {
    success: true,
    report,
    message: `Validate complete: score=${validationScore}/100, decision=${validationDecision}, ${evidenceIds.length} evidence recorded`,
  };
}

/* ------------------------------------------------------------------ */
/*  Business Model Executor                                            */
/* ------------------------------------------------------------------ */

/**
 * Business-model stage: match opportunity to business model patterns
 * and generate pricing guidance.
 *
 * Reads business-model/input.json (produced by bridge_validate_businessModel).
 */
async function executeBusinessModel(options = {}) {
  const input = await readInput("business-model");
  if (!input) {
    return { success: false, report: null, message: "No input.json for business-model stage. Run validate first and advance." };
  }

  const projectId = input.projectId ?? "auto-business-model";
  const narrowedSegment = input.narrowedSegment ?? null;
  const validationScore = input.validationScore ?? 0;
  const competitorSnapshot = input.competitorLandscape ?? [];

  options.onProgress?.("business-model", "matching", "Matching business model patterns...");

  // Build a synthetic report from validate handoff data for the matcher
  const syntheticReport = {
    opportunities: [
      {
        theme: narrowedSegment ?? "validated opportunity",
        description: input.strongestPainLanguage?.join("; ") ?? "",
        painfulSituation: input.strongestPainLanguage?.[0] ?? "",
        signalTypes: inferSignalTypes(input),
        evidence: (input.willToPayEvidence ?? []).map((e) => ({
          title: e.title ?? "",
          source: e.source ?? "",
          url: e.url ?? null,
        })),
        sources: competitorSnapshot.map((c) => c.sources?.[0]).filter(Boolean),
      },
    ],
  };

  const modelMatch = matchBusinessModel(syntheticReport);
  const primaryModel = modelMatch.primaryModel;

  // Record evidence: reference prior stage evidence for cross-stage linkage
  const tracker = await EvidenceTracker.load();
  const priorRefs = [
    ...tracker.getEvidenceRefs("discover"),
    ...tracker.getEvidenceRefs("validate"),
  ];
  tracker.markReferencedBy(priorRefs, "business-model");

  // Add business-model-specific evidence from the matcher results
  const bmEvidenceIds = [];
  for (const recommendation of modelMatch.recommendations.slice(0, 3)) {
    const evidenceId = tracker.addEvidence({
      stage: "business-model",
      source: "business-model-matcher",
      signalType: "model-fit",
      title: `${recommendation.label} (fit: ${recommendation.fitScore}/100)`,
      excerpt: `Pricing: ${recommendation.pricingGuidance?.model ?? "unknown"}. ${recommendation.antiPatterns?.[0] ?? ""}`,
      weight: Math.round(recommendation.fitScore / 20),
    });
    bmEvidenceIds.push(evidenceId);
  }
  await tracker.save();

  // Write stage artifacts
  const generatedAt = new Date().toISOString();

  await writeReport("business-model", {
    protocolVersion: "1.0",
    artifactType: "stage-report",
    projectId,
    stage: "business-model",
    generatedAt,
    status: "completed",
    score: primaryModel.fitScore,
    decision: primaryModel.fitScore >= 50 ? "continue" : "adjust",
    nextStageAction: primaryModel.fitScore >= 50 ? "advance" : "stay",
    reasoning: modelMatch.reasoning,
    known: [
      `Primary model: ${primaryModel.label} (fit: ${primaryModel.fitScore}/100)`,
      `Pricing: ${primaryModel.pricingGuidance.model}`,
      `Typical: ${primaryModel.pricingGuidance.typical}`,
    ],
    assumed: [
      "Model fit is inferred from signal patterns, not from actual revenue data.",
      "Pricing guidance is based on 499 Indie Hackers case studies.",
    ],
    toValidate: [
      "Test pricing with a landing page signup experiment",
      "Interview 3-5 target users about willingness to pay",
      "Validate model assumptions with a concierge MVP",
    ],
    concerns: primaryModel.antiPatterns,
    nextSteps: [
      `Design ${primaryModel.pricingGuidance.tiers.length} pricing tiers`,
      "Create a landing page with clear pricing",
      "Set up payment processing (Stripe recommended)",
      ...modelMatch.pricingChecklist.slice(0, 3),
    ],
    analysis: {
      recommendations: modelMatch.recommendations.map((m) => ({
        id: m.id,
        label: m.label,
        fitScore: m.fitScore,
        pricingModel: m.pricingGuidance.model,
      })),
      primaryModel: {
        id: primaryModel.id,
        label: primaryModel.label,
        fitScore: primaryModel.fitScore,
        pricingGuidance: primaryModel.pricingGuidance,
        antiPatterns: primaryModel.antiPatterns,
        warnings: primaryModel.warnings,
      },
      pricingChecklist: modelMatch.pricingChecklist,
    },
  });

  await writeHandoff("business-model", {
    protocolVersion: "1.0",
    artifactType: "stage-handoff",
    projectId,
    fromStage: "business-model",
    toStage: "build",
    generatedAt,
    summary: {
      modelType: primaryModel.id,
      pricingHypothesis: primaryModel.pricingGuidance.model,
      pricingTiers: primaryModel.pricingGuidance.tiers,
      firstPaidTest: "Landing page with pricing → measure signup conversion",
      mustNotBuild: primaryModel.antiPatterns,
      revenueMilestones: ["$100 first sale", "$1k MRR", "$5k MRR"],
      targetBuyerProfile: narrowedSegment,
      evidenceRefs: bmEvidenceIds,
    },
  });

  const modelMd = generateModelMarkdown(modelMatch);
  await writeMarkdownReport("business-model", modelMd);

  return {
    success: true,
    report: { score: primaryModel.fitScore, decision: primaryModel.fitScore >= 50 ? "continue" : "adjust" },
    message: `Business model: ${primaryModel.icon} ${primaryModel.label} (fit: ${primaryModel.fitScore}/100), ${bmEvidenceIds.length} evidence recorded`,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildCredentialsMap() {
  const keys = [
    "GITHUB_TOKEN", "PRODUCT_HUNT_TOKEN", "TWITTER_BEARER_TOKEN",
    "V2EX_TOKEN", "REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME",
  ];
  const map = {};
  for (const key of keys) {
    const value = getCredential(key);
    if (value) map[key] = value;
  }
  return map;
}

async function writeMarkdownReport(stageName, markdown) {
  const stageDir = join(STAGES_DIR, stageName);
  await mkdir(stageDir, { recursive: true });
  await writeFile(join(stageDir, "report.md"), markdown, "utf-8");
}

function inferSignalTypes(input) {
  const types = [];
  if (input.strongestPainLanguage?.length > 0) types.push("manual-workflow", "tool-complaint");
  if (input.paidIntentGaps?.length > 0) types.push("purchase-intent");
  if (input.competitorLandscape?.length > 0) types.push("saas-exists", "pricing-model");
  if (input.willToPayEvidence?.length > 0) types.push("purchase-intent", "revenue-signal");
  return [...new Set(types)];
}

export { STAGE_EXECUTORS };
