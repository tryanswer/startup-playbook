#!/usr/bin/env node

/**
 * CLI entry point for the Startup Playbook Pipeline Orchestrator.
 *
 * Commands:
 *   status      — Show pipeline stage statuses
 *   inspect     — Inspect current stage and determine next action
 *   advance     — Execute one stage transition
 *   run         — Run pipeline from current stage to target (or end)
 *   credentials — Audit available API credentials
 *
 * Examples:
 *   node scripts/run-pipeline.mjs status
 *   node scripts/run-pipeline.mjs inspect
 *   node scripts/run-pipeline.mjs advance --confirm
 *   node scripts/run-pipeline.mjs advance --dry-run
 *   node scripts/run-pipeline.mjs run --to grow
 *   node scripts/run-pipeline.mjs run --to build --confirm
 *   node scripts/run-pipeline.mjs credentials
 */

import { parseArgs } from "node:util";

import {
  inspectPipeline,
  executeTransition,
  runPipeline,
  printStatus,
} from "../tools/pipeline-orchestrator/stage-router.mjs";

import {
  loadCredentials,
  auditCredentials,
} from "../tools/_shared/credentials.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    confirm: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    to: { type: "string", default: "" },
    help: { type: "boolean", short: "h", default: false },
    json: { type: "boolean", default: false },
  },
});

const command = positionals[0] ?? "help";

async function main() {
  if (values.help || command === "help") {
    printHelp();
    return;
  }

  switch (command) {
    case "status":
      await commandStatus();
      break;
    case "inspect":
      await commandInspect();
      break;
    case "advance":
      await commandAdvance();
      break;
    case "run":
      await commandRun();
      break;
    case "credentials":
      await commandCredentials();
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

async function commandStatus() {
  const output = await printStatus();
  console.log(output);
}

async function commandInspect() {
  const state = await inspectPipeline();

  if (values.json) {
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  console.log("");
  console.log(`  📍 Current stage:  ${state.currentStage}`);
  console.log(`  📊 Status:         ${state.currentStatus}`);
  console.log(`  🎯 Decision:       ${state.decision ?? "(none)"}`);
  console.log(`  ➡️  Next stage:     ${state.nextStage ?? "(none)"}`);
  console.log(`  🔧 Action:         ${state.action}`);
  console.log(`  👤 Needs human:    ${state.needsHumanDecision ? "YES" : "no"}`);
  console.log(`  💬 ${state.message}`);

  if (state.bridgePreview) {
    console.log("");
    console.log("  📦 Bridge preview (data to pass to next stage):");
    const previewStr = JSON.stringify(state.bridgePreview, null, 2);
    for (const line of previewStr.split("\n").slice(0, 20)) {
      console.log(`     ${line}`);
    }
    if (previewStr.split("\n").length > 20) {
      console.log("     ... (truncated, use --json for full output)");
    }
  }
  console.log("");
}

async function commandAdvance() {
  const result = await executeTransition({
    dryRun: values["dry-run"],
    confirm: values.confirm,
  });

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const icon = result.success ? "✅" : "⚠️";
  console.log("");
  console.log(`  ${icon} ${result.message}`);

  if (result.action === "awaiting-confirmation") {
    console.log("");
    console.log("  This is a human decision point.");
    console.log("  Review the bridge preview above, then run:");
    console.log("    node scripts/run-pipeline.mjs advance --confirm");

    if (result.bridgePreview) {
      console.log("");
      console.log("  📦 Data to be passed:");
      const previewStr = JSON.stringify(result.bridgePreview, null, 2);
      for (const line of previewStr.split("\n").slice(0, 15)) {
        console.log(`     ${line}`);
      }
    }
  }

  if (result.action === "advanced") {
    console.log(`  📁 Input written to: playbook/stages/${result.toStage}/input.json`);
    console.log(`  📋 Manifest updated: playbook/playbook.json`);
  }

  console.log("");
  process.exit(result.success ? 0 : 1);
}

async function commandRun() {
  const targetStage = values.to || undefined;

  if (targetStage) {
    const validStages = ["discover", "validate", "business-model", "build", "grow", "operate"];
    if (!validStages.includes(targetStage)) {
      console.error(`Invalid target stage: ${targetStage}`);
      console.error(`Valid stages: ${validStages.join(", ")}`);
      process.exit(1);
    }
  }

  const result = await runPipeline({
    targetStage,
    confirm: values.confirm,
    dryRun: values["dry-run"],
  });

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("");
  console.log(`  🏁 Pipeline run complete`);
  console.log(`  📊 Transitions: ${result.totalTransitions}`);
  console.log(`  📍 Final stage: ${result.finalStage ?? "(none)"}`);
  console.log(`  🔧 Stopped because: ${result.stoppedBecause}`);

  if (result.transitions.length > 0) {
    console.log("");
    console.log("  Transition log:");
    for (const transition of result.transitions) {
      const icon = transition.success ? "✓" : "✗";
      const arrow = transition.toStage ? ` → ${transition.toStage}` : "";
      console.log(`    ${icon} ${transition.fromStage}${arrow} [${transition.action}]`);
    }
  }

  console.log("");
}

async function commandCredentials() {
  await loadCredentials();
  const audit = auditCredentials();

  console.log("");
  console.log("  🔑 Credential Audit");
  console.log("  ─────────────────────────────────────────");

  if (audit.available.length > 0) {
    console.log("");
    console.log("  ✅ Available:");
    for (const credential of audit.available) {
      console.log(`     ${credential.key.padEnd(35)} ${credential.masked}`);
    }
  }

  if (audit.missing.length > 0) {
    console.log("");
    console.log("  ❌ Missing:");
    for (const credential of audit.missing) {
      console.log(`     ${credential.key.padEnd(35)} ${credential.description}`);
    }
  }

  console.log("");
  console.log("  Set credentials in ~/.startup-playbook/.env or .env");
  console.log("");
}

/* ------------------------------------------------------------------ */
/*  Help                                                               */
/* ------------------------------------------------------------------ */

function printHelp() {
  console.log(`
  Startup Playbook Pipeline Orchestrator

  Usage: node scripts/run-pipeline.mjs <command> [options]

  Commands:
    status          Show pipeline stage statuses
    inspect         Inspect current stage and determine next action
    advance         Execute one stage transition
    run             Run pipeline from current to target stage
    credentials     Audit available API credentials

  Options:
    --confirm       Bypass human decision point pauses
    --dry-run       Preview transitions without writing files
    --to <stage>    Target stage for 'run' command
    --json          Output in JSON format
    -h, --help      Show this help

  Examples:
    node scripts/run-pipeline.mjs status
    node scripts/run-pipeline.mjs inspect --json
    node scripts/run-pipeline.mjs advance --dry-run
    node scripts/run-pipeline.mjs advance --confirm
    node scripts/run-pipeline.mjs run --to build
    node scripts/run-pipeline.mjs run --to operate --confirm
    node scripts/run-pipeline.mjs credentials
  `);
}

/* ------------------------------------------------------------------ */
/*  Entry                                                              */
/* ------------------------------------------------------------------ */

main().catch((error) => {
  console.error(`\n  ❌ Pipeline error: ${error.message}\n`);
  if (process.env.DEBUG) console.error(error.stack);
  process.exit(1);
});
