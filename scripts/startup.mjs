#!/usr/bin/env node

/**
 * Unified CLI entry point for Startup Playbook.
 *
 * Routes to the appropriate tool based on the first argument (command).
 * Each command delegates to an existing script — this file is a thin router.
 *
 * Usage:
 *   node scripts/startup.mjs <command> [options]
 *
 * Commands:
 *   collect      — Data collection from 11 sources
 *   analyze      — Signal extraction, fusion, scoring
 *   validate     — End-to-end idea validation (Reddit + Trends + Competitors)
 *   radar        — Opportunity radar scan
 *   pipeline     — Pipeline orchestrator (status, inspect, advance, run)
 *   evidence     — Query the cross-stage evidence ledger
 *   credentials  — Audit API credentials
 *   help         — Show this help
 *
 * Examples:
 *   node scripts/startup.mjs collect list
 *   node scripts/startup.mjs collect --sources reddit,github --query "ai invoice"
 *   node scripts/startup.mjs analyze data/collected.json
 *   node scripts/startup.mjs validate --idea "invoice tool for freelancers"
 *   node scripts/startup.mjs radar --input data/radar-input.json
 *   node scripts/startup.mjs pipeline status
 *   node scripts/startup.mjs pipeline advance --auto-run --confirm
 *   node scripts/startup.mjs evidence summary
 *   node scripts/startup.mjs credentials
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const COMMANDS = {
  collect: {
    script: "scripts/collect-data.mjs",
    description: "Data collection from 11 sources (Reddit, HN, GitHub, PH, etc.)",
    examples: [
      "startup collect list",
      "startup collect list --region china",
      'startup collect --sources reddit,github --query "ai saas"',
      "startup collect test hacker-news --query invoice --limit 5",
      "startup collect credentials",
    ],
  },
  analyze: {
    script: "scripts/analyze-data.mjs",
    description: "Signal extraction, cross-source fusion, opportunity scoring",
    examples: [
      "startup analyze data/collected.json",
      'startup analyze collect-analyze --sources reddit,github -q "ai tool"',
      "startup analyze report analysis/report.json",
    ],
  },
  validate: {
    script: "tools/idea-validator/scripts/validate.mjs",
    description: "End-to-end idea validation (Reddit pain + Trends + Competitors)",
    examples: [
      'startup validate --idea "invoice tool for freelancers"',
      'startup validate --idea "AI writing assistant" --skip-reddit',
      'startup validate --idea "skin care app" --subreddits "SkincareAddiction"',
    ],
  },
  radar: {
    script: "tools/opportunity-radar/scripts/run-radar.mjs",
    description: "Opportunity radar — scan communities for pain signals & cases",
    examples: [
      "startup radar --input data/sample-live-sources.json",
      "startup radar --input data/radar-input.json --render-index",
    ],
  },
  pipeline: {
    script: "scripts/run-pipeline.mjs",
    description: "Pipeline orchestrator — manage stage transitions",
    examples: [
      "startup pipeline status",
      "startup pipeline inspect",
      "startup pipeline advance --auto-run --confirm",
      "startup pipeline run --to business-model --auto-run --confirm",
      "startup pipeline credentials",
    ],
  },
  evidence: {
    handler: commandEvidence,
    description: "Query the cross-stage evidence ledger",
    examples: [
      "startup evidence summary",
      "startup evidence list --stage discover",
      "startup evidence cross-stage",
      "startup evidence query --signal pricing-pain",
    ],
  },
  credentials: {
    script: "scripts/collect-data.mjs",
    forceArgs: ["credentials"],
    description: "Audit API credentials for all data sources",
    examples: ["startup credentials"],
  },
};

/* ------------------------------------------------------------------ */
/*  Main router                                                        */
/* ------------------------------------------------------------------ */

const [command, ...restArgs] = process.argv.slice(2);

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

const commandDef = COMMANDS[command];

if (!commandDef) {
  console.error(`❌ Unknown command: "${command}"\n`);
  printHelp();
  process.exit(1);
}

if (commandDef.handler) {
  // Built-in handler (e.g. evidence)
  await commandDef.handler(restArgs);
} else {
  // Delegate to external script
  const scriptPath = join(REPO_ROOT, commandDef.script);
  const scriptArgs = commandDef.forceArgs
    ? [...commandDef.forceArgs, ...restArgs]
    : restArgs;

  try {
    const { stdout, stderr } = await execFileAsync("node", [scriptPath, ...scriptArgs], {
      cwd: REPO_ROOT,
      timeout: 300_000,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
      maxBuffer: 10 * 1024 * 1024,
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (error) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    process.exit(error.status ?? 1);
  }
}

/* ------------------------------------------------------------------ */
/*  Evidence command (built-in)                                        */
/* ------------------------------------------------------------------ */

async function commandEvidence(args) {
  const { EvidenceTracker } = await import("../tools/_shared/evidence-tracker.mjs");
  const tracker = await EvidenceTracker.load();

  const subcommand = args[0] ?? "summary";

  if (subcommand === "summary") {
    const totalEntries = tracker.entries.length;
    if (totalEntries === 0) {
      console.log("📋 Evidence ledger is empty. Run a pipeline stage with --auto-run to start collecting evidence.\n");
      return;
    }

    const crossStage = tracker.getCrossStageEvidence();
    const breakdown = tracker._computeStageBreakdown();

    console.log(`\n📋 Evidence Ledger Summary`);
    console.log(`${"─".repeat(50)}`);
    console.log(`  Total entries:       ${totalEntries}`);
    console.log(`  Cross-stage refs:    ${crossStage.length}`);
    console.log();

    for (const [stage, info] of Object.entries(breakdown)) {
      console.log(`  📌 ${stage}: ${info.count} entries from [${info.sources.join(", ")}]`);
    }
    console.log();
    return;
  }

  if (subcommand === "list") {
    const stageFlag = args.indexOf("--stage");
    const stageName = stageFlag >= 0 ? args[stageFlag + 1] : null;

    const entries = stageName
      ? tracker.getStageEvidence(stageName)
      : tracker.entries;

    if (entries.length === 0) {
      console.log(`No evidence entries${stageName ? ` for stage "${stageName}"` : ""}.`);
      return;
    }

    console.log(`\n📋 Evidence Entries${stageName ? ` (${stageName})` : ""}: ${entries.length} total\n`);
    for (const entry of entries.slice(0, 30)) {
      const refs = (entry.referencedBy?.length ?? 0) > 1 ? ` 🔗×${entry.referencedBy.length}` : "";
      console.log(`  [${entry.id}] ${entry.signalType} — ${entry.title.slice(0, 80)}${refs}`);
    }
    if (entries.length > 30) console.log(`  ... and ${entries.length - 30} more`);
    console.log();
    return;
  }

  if (subcommand === "cross-stage") {
    const crossStage = tracker.getCrossStageEvidence();
    if (crossStage.length === 0) {
      console.log("No cross-stage evidence yet. Run multiple pipeline stages to build cross-references.\n");
      return;
    }

    console.log(`\n🔗 Cross-Stage Evidence: ${crossStage.length} entries\n`);
    for (const entry of crossStage) {
      console.log(`  [${entry.id}] ${entry.signalType} — ${entry.title.slice(0, 60)}`);
      console.log(`    Referenced by: ${entry.referencedBy.join(", ")}`);
    }
    console.log();
    return;
  }

  if (subcommand === "query") {
    const signalFlag = args.indexOf("--signal");
    const signalType = signalFlag >= 0 ? args[signalFlag + 1] : null;

    if (!signalType) {
      console.error('Usage: startup evidence query --signal <signal-type>\n');
      console.log("Available signal types:");
      const types = [...new Set(tracker.entries.map((e) => e.signalType))].sort();
      for (const type of types) {
        const count = tracker.queryBySignalType(type).length;
        console.log(`  - ${type} (${count})`);
      }
      return;
    }

    const matches = tracker.queryBySignalType(signalType);
    console.log(`\n🔍 Evidence for "${signalType}": ${matches.length} entries\n`);
    for (const entry of matches) {
      console.log(`  [${entry.id}] ${entry.source} — ${entry.title.slice(0, 80)}`);
      if (entry.url) console.log(`    ${entry.url}`);
    }
    console.log();
    return;
  }

  console.error(`Unknown evidence subcommand: "${subcommand}"`);
  console.log("Available: summary, list [--stage <name>], cross-stage, query --signal <type>\n");
}

/* ------------------------------------------------------------------ */
/*  Help                                                               */
/* ------------------------------------------------------------------ */

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   STARTUP PLAYBOOK CLI                      ║
╚══════════════════════════════════════════════════════════════╝

Usage: node scripts/startup.mjs <command> [options]

Commands:`);

  for (const [name, def] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(14)} ${def.description}`);
  }

  console.log(`\nExamples:`);
  for (const [name, def] of Object.entries(COMMANDS)) {
    if (def.examples?.length > 0) {
      console.log(`  # ${name}`);
      for (const example of def.examples.slice(0, 2)) {
        console.log(`  node scripts/${example}`);
      }
    }
  }

  console.log(`\nRun "node scripts/startup.mjs <command> --help" for command-specific help.\n`);
}
