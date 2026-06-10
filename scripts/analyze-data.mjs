#!/usr/bin/env node

/**
 * CLI entry point for the Data Analysis Module.
 *
 * Commands:
 *   analyze <file>       — Analyze collected data from JSON file
 *   collect-analyze      — Collect from sources AND analyze in one step
 *   report <file>        — Generate Markdown report from analysis JSON
 *
 * Examples:
 *   node scripts/analyze-data.mjs analyze data/collected.json
 *   node scripts/analyze-data.mjs analyze data/collected.json -o analysis/
 *   node scripts/analyze-data.mjs collect-analyze --sources reddit,hacker-news,github -q "ai invoice tool" -o analysis/
 *   node scripts/analyze-data.mjs report analysis/report.json
 */

import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

import { extractSignals } from "../tools/_shared/analyzers/signal-extractor.mjs";
import { fuseSignals } from "../tools/_shared/analyzers/signal-fusion.mjs";
import { generateReport, generateMarkdown } from "../tools/_shared/analyzers/report-generator.mjs";
import { collectFromSources } from "../tools/_shared/data-sources/index.mjs";
import { loadCredentials, getCredential } from "../tools/_shared/credentials.mjs";
import { writeReport as writeStageReport, writeHandoff, writeInput, STAGE_ORDER } from "../tools/_shared/playbook-io.mjs";
import { matchBusinessModel, generateModelMarkdown } from "../tools/_shared/analyzers/business-model-matcher.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    output: { type: "string", short: "o", default: "" },
    query: { type: "string", short: "q", default: "" },
    sources: { type: "string", default: "" },
    limit: { type: "string", short: "l", default: "25" },
    community: { type: "string", default: "" },
    project: { type: "string", short: "p", default: "startup-analysis" },
    stage: { type: "string", short: "s", default: "" },
    json: { type: "boolean", default: false },
    verbose: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

const command = positionals[0] ?? "help";

async function main() {
  if (values.help || command === "help") {
    printHelp();
    return;
  }

  switch (command) {
    case "analyze":
      await commandAnalyze();
      break;
    case "collect-analyze":
      await commandCollectAnalyze();
      break;
    case "report":
      await commandReport();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Commands                                                           */
/* ------------------------------------------------------------------ */

async function commandAnalyze() {
  const inputPath = positionals[1];
  if (!inputPath) {
    console.error("Error: input file required. Example: node scripts/analyze-data.mjs analyze data/collected.json");
    process.exit(1);
  }

  console.log(`\n📊 Analyzing data from: ${inputPath}\n`);

  const raw = await readFile(resolve(REPO_ROOT, inputPath), "utf-8");
  const data = JSON.parse(raw);
  const items = data.items ?? data;

  if (!Array.isArray(items) || items.length === 0) {
    console.error("Error: no items found in input file");
    process.exit(1);
  }

  const result = runAnalysis(items, {
    query: values.query || data.query,
    projectId: values.project,
  });

  await outputResults(result);
}

async function commandCollectAnalyze() {
  if (!values.sources && !values.query) {
    console.error("Error: --sources and/or --query required.");
    console.error("Example: node scripts/analyze-data.mjs collect-analyze --sources hacker-news,github -q 'ai tool'");
    process.exit(1);
  }

  await loadCredentials();

  const sourceNames = values.sources ? values.sources.split(",").map((s) => s.trim()) : ["hacker-news", "github", "google-autocomplete"];
  const query = values.query || "startup";
  const limit = parseInt(values.limit, 10) || 25;

  const sourceConfigs = sourceNames.map((name) => ({
    type: name,
    query,
    limit,
    communities: values.community ? [values.community] : name === "reddit" ? ["SaaS", "startups"] : undefined,
    queries: name === "google-autocomplete" ? [query] : undefined,
    keywords: name === "google-trends" ? [query] : undefined,
  }));

  console.log(`\n🚀 Step 1/2: Collecting data from ${sourceNames.length} source(s)...\n`);

  const credentials = buildCredentialsMap();
  const collectResult = await collectFromSources(sourceConfigs, {
    credentials,
    onProgress: (name, status, count) => {
      if (status === "collecting") process.stdout.write(`  ⏳ ${name}...`);
      else if (status === "done") console.log(` ✅ ${count} items`);
      else if (status === "error") console.log(` ❌ failed`);
    },
  });

  console.log(`\n  Collected: ${collectResult.items.length} items from ${Object.keys(collectResult.coverage).length} sources`);

  if (collectResult.items.length === 0) {
    console.error("\n❌ No data collected. Check source configuration and credentials.");
    process.exit(1);
  }

  // Extract trend data separately for scoring
  const trendItems = collectResult.items.filter((item) => item.source === "google-trends" && item.averages);
  const trendData = trendItems.length > 0 ? trendItems[0] : {};

  console.log(`\n📊 Step 2/2: Analyzing signals...\n`);

  const result = runAnalysis(collectResult.items, {
    query,
    projectId: values.project,
    trends: trendData,
  });

  await outputResults(result, collectResult);
}

async function commandReport() {
  const inputPath = positionals[1];
  if (!inputPath) {
    console.error("Error: analysis JSON file required.");
    process.exit(1);
  }

  const raw = await readFile(resolve(REPO_ROOT, inputPath), "utf-8");
  const report = JSON.parse(raw);

  const markdown = generateMarkdown(report);

  if (values.output) {
    const outputDir = resolve(REPO_ROOT, values.output);
    await mkdir(outputDir, { recursive: true });
    const mdPath = resolve(outputDir, "report.md");
    await writeFile(mdPath, markdown);
    console.log(`\n📝 Markdown report saved to: ${mdPath}\n`);
  } else {
    console.log(markdown);
  }
}

/* ------------------------------------------------------------------ */
/*  Analysis Pipeline                                                  */
/* ------------------------------------------------------------------ */

function runAnalysis(items, options = {}) {
  // Step 1: Extract signals
  const extracted = extractSignals(items);
  const { summary } = extracted;

  if (values.verbose) {
    console.log(`  Signals extracted: ${extracted.signals.length}`);
    console.log(`  Pain signals: ${summary.pain.count} (rate: ${(summary.pain.painRate * 100).toFixed(0)}%)`);
    console.log(`  Demand signals: ${summary.demand.count} (payment rate: ${(summary.demand.paymentRate * 100).toFixed(0)}%)`);
    console.log(`  Supply signals: ${summary.supply.count}`);
    console.log("");
  }

  // Step 2: Fuse signals
  const fusion = fuseSignals(extracted, items, {
    trends: options.trends,
  });

  if (values.verbose) {
    console.log(`  Opportunities found: ${fusion.opportunities.length}`);
    console.log(`  Cross-validation: ${fusion.crossValidation.assessment}`);
    console.log(`  Confidence: ${fusion.overallConfidence.label}`);
    console.log("");
  }

  // Step 3: Generate report
  const report = generateReport(fusion, {
    projectId: options.projectId,
    query: options.query,
    sources: summary.sources,
  });

  // Step 4: Match business model
  const modelMatch = matchBusinessModel(report);

  if (values.verbose) {
    console.log(`  Business model: ${modelMatch.primaryModel.icon} ${modelMatch.primaryModel.label} (fit: ${modelMatch.primaryModel.fitScore}/100)`);
    console.log("");
  }

  const modelMarkdown = generateModelMarkdown(modelMatch);
  const markdown = generateMarkdown(report) + "\n\n" + modelMarkdown;

  return { extracted, fusion, report, markdown, modelMatch };
}

/* ------------------------------------------------------------------ */
/*  Output                                                             */
/* ------------------------------------------------------------------ */

async function outputResults(result, collectResult = null) {
  const { report, markdown, fusion, modelMatch } = result;

  // Print summary to console
  console.log("─".repeat(60));
  console.log("");
  console.log(`  ${report.decisionLabel} — Score: ${report.score}/100`);
  console.log(`  ${report.reasoning}`);
  console.log("");
  console.log(`  Confidence: ${report.confidence.label}`);
  console.log(`  Opportunities: ${report.opportunities.length}`);

  if (report.opportunities.length > 0) {
    console.log("");
    console.log("  Top opportunities:");
    for (const opp of report.opportunities.slice(0, 3)) {
      const icon = opp.decision.decision === "continue" ? "✅" : opp.decision.decision === "pivot" ? "🔄" : "❌";
      console.log(`    ${icon} #${opp.rank} "${opp.theme}" — ${opp.score.total}/100 (${opp.sources.join(", ")})`);
    }
  }

  if (report.gaps.length > 0) {
    console.log("");
    console.log("  Evidence gaps:");
    for (const gap of report.gaps) {
      const icon = gap.severity === "critical" ? "🔴" : gap.severity === "high" ? "🟠" : "🟡";
      console.log(`    ${icon} ${gap.message}`);
    }
  }

  if (report.nextSteps.length > 0) {
    console.log("");
    console.log("  Next steps:");
    for (let i = 0; i < Math.min(report.nextSteps.length, 3); i++) {
      console.log(`    ${i + 1}. ${report.nextSteps[i]}`);
    }
  }

  // Business model recommendation
  if (modelMatch) {
    const pm = modelMatch.primaryModel;
    console.log("");
    console.log(`  💼 Business model: ${pm.icon} ${pm.label} (fit: ${pm.fitScore}/100)`);
    console.log(`     ${pm.pricingGuidance.model} — ${pm.pricingGuidance.typical}`);
    if (modelMatch.recommendations.length > 1) {
      const alt = modelMatch.recommendations[1];
      console.log(`     Alternative: ${alt.icon} ${alt.label} (fit: ${alt.fitScore}/100)`);
    }
  }

  console.log("");

  // Save to files
  if (values.output) {
    const outputDir = resolve(REPO_ROOT, values.output);
    await mkdir(outputDir, { recursive: true });

    // Save JSON report
    const reportPath = resolve(outputDir, "report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2));

    // Save Markdown report
    const mdPath = resolve(outputDir, "report.md");
    await writeFile(mdPath, markdown);

    // Save collected data if available
    if (collectResult) {
      const dataPath = resolve(outputDir, "collected-data.json");
      await writeFile(dataPath, JSON.stringify(collectResult, null, 2));
    }

    // Save raw signals
    const signalsPath = resolve(outputDir, "signals.json");
    await writeFile(signalsPath, JSON.stringify({
      signals: result.extracted.signals,
      summary: result.extracted.summary,
    }, null, 2));

    console.log(`💾 Results saved to: ${values.output}/`);
    console.log(`   report.json — structured analysis report`);
    console.log(`   report.md — human-readable Markdown report`);
    console.log(`   signals.json — extracted signal details`);
    if (collectResult) console.log(`   collected-data.json — raw collected data`);
    console.log("");
  } else if (values.json) {
    console.log(JSON.stringify(report, null, 2));
  }

  // Write to playbook stage artifacts if --stage is specified
  if (values.stage) {
    await writeToPlaybookStage(result, collectResult);
  }
}

/**
 * Write analysis results as playbook stage artifacts.
 * Supports: discover, validate (more stages can be added).
 */
async function writeToPlaybookStage(result, collectResult) {
  const stageName = values.stage;
  if (!STAGE_ORDER.includes(stageName)) {
    console.error(`⚠️  Unknown stage: "${stageName}". Valid: ${STAGE_ORDER.join(", ")}`);
    return;
  }

  const { report, markdown, fusion } = result;
  const topOpp = fusion.topOpportunity;

  // Write input.json — what went into this analysis
  await writeInput(stageName, {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId: report.projectId,
    stage: stageName,
    generatedAt: report.generatedAt,
    query: report.query,
    sources: report.input.sourcesCovered,
    itemCount: report.input.totalItems,
    collectedAt: collectResult?.collectedAt ?? report.generatedAt,
  });

  // Write report.json — analysis results in stage report format
  await writeStageReport(stageName, {
    protocolVersion: "1.0",
    artifactType: "stage-report",
    projectId: report.projectId,
    stage: stageName,
    generatedAt: report.generatedAt,
    status: "completed",
    score: report.score,
    decision: report.decision,
    nextStageAction: report.decision === "continue" ? "advance" : "stay",
    reasoning: report.reasoning,
    known: topOpp
      ? topOpp.evidence.map((e) => `${e.signalType} signal from ${e.source}: "${e.title}"`)
      : [],
    assumed: ["Community signals are discovery evidence, not validation proof."],
    toValidate: report.nextSteps,
    evidenceRefs: topOpp?.evidence?.map((e, i) => ({
      id: `ev-${String(i + 1).padStart(3, "0")}`,
      type: e.type,
      source: `${e.source}:${e.id ?? ""}`,
      url: e.url,
    })) ?? [],
    concerns: report.gaps.map((g) => g.message),
    nextSteps: report.nextSteps,
    analysis: {
      opportunities: report.opportunities,
      crossValidation: report.crossValidation,
      confidence: report.confidence,
      gaps: report.gaps,
    },
  });

  // Write handoff.json — key info for the next stage
  await writeHandoff(stageName, {
    protocolVersion: "1.0",
    artifactType: "stage-handoff",
    projectId: report.projectId,
    fromStage: stageName,
    toStage: stageName === "discover" ? "validate" : null,
    generatedAt: report.generatedAt,
    summary: {
      candidateId: topOpp?.id ?? null,
      targetUserCandidate: topOpp?.targetUser ?? null,
      painfulSituation: topOpp?.painfulSituation ?? null,
      promiseCandidate: topOpp?.description ?? null,
      topSignals: topOpp?.signalTypes ?? [],
      suggestedKeywords: report.query ? [report.query] : [],
      suggestedSubreddits: topOpp?.communities?.filter((c) => c !== "Hacker News") ?? [],
      score: report.score,
      decision: report.decision,
    },
  });

  // Write report.md
  const stageDir = resolve(REPO_ROOT, "playbook", "stages", stageName);
  await mkdir(stageDir, { recursive: true });
  await writeFile(resolve(stageDir, "report.md"), markdown);

  console.log(`📋 Playbook stage "${stageName}" artifacts written:`);
  console.log(`   playbook/stages/${stageName}/input.json`);
  console.log(`   playbook/stages/${stageName}/report.json`);
  console.log(`   playbook/stages/${stageName}/handoff.json`);
  console.log(`   playbook/stages/${stageName}/report.md`);
  console.log("");
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

function printHelp() {
  console.log(`
📊 Startup Playbook — Data Analysis CLI

Usage: node scripts/analyze-data.mjs <command> [options]

Commands:
  analyze <file>        Analyze a previously collected JSON data file
  collect-analyze       Collect AND analyze data in one step
  report <file>         Generate Markdown report from analysis JSON

Options:
  --sources <list>      Comma-separated source names (for collect-analyze)
  --query, -q <text>    Search query / topic to analyze
  --output, -o <dir>    Output directory for reports
  --limit, -l <number>  Max items per source (default: 25)
  --community <name>    Subreddit name (for reddit source)
  --project, -p <name>  Project name for the report
  --stage, -s <name>    Write results to playbook stage (discover, validate, etc.)
  --json                Output raw JSON to stdout
  --verbose, -v         Show detailed analysis progress
  --help, -h            Show this help message

Examples:
  # Analyze previously collected data
  node scripts/analyze-data.mjs analyze data/collected.json -o analysis/

  # Collect + analyze in one step
  node scripts/analyze-data.mjs collect-analyze \\
    --sources hacker-news,github,google-autocomplete \\
    -q "ai invoice tool" -o analysis/invoice-tool/

  # Collect + analyze + write to playbook discover stage
  node scripts/analyze-data.mjs collect-analyze \\
    --sources hacker-news,github -q "ai tool" --stage discover

  # Regenerate Markdown from existing analysis
  node scripts/analyze-data.mjs report analysis/report.json -o analysis/
  `);
}

main().catch((error) => {
  console.error(`\n💥 Fatal error: ${error.message}`);
  if (values.verbose) console.error(error.stack);
  process.exit(1);
});
