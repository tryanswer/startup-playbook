/**
 * Stage Router
 *
 * Core orchestration logic that determines what to do next based on
 * the current playbook state, stage decisions, and handoff data.
 *
 * The router implements a state machine:
 *   1. Read playbook.json → determine current stage
 *   2. Read current stage's report.json → get decision
 *   3. Resolve next stage via decision + nextStageAction
 *   4. If advancing: run bridge, write input.json, update manifest
 *   5. If human decision needed: pause and wait
 */

import {
  readManifest,
  readReport,
  readHandoff,
  writeInput,
  advanceStage,
  validateStageArtifacts,
  getStageStatuses,
  resolveNextStage,
  STAGE_ORDER,
} from "../_shared/playbook-io.mjs";

import { executeBridge, getBridge } from "./stage-bridges.mjs";

/**
 * Human decision points — stages where the pipeline must pause
 * and wait for founder confirmation before proceeding.
 */
const HUMAN_DECISION_POINTS = new Set([
  "discover",       // Founder picks which candidate to validate
  "validate",       // kill / pivot / continue decision
  "business-model", // Pricing confirmation
]);

/**
 * Inspect the current pipeline state and determine the next action.
 *
 * @returns {PipelineState}
 * @typedef {Object} PipelineState
 * @property {string} currentStage
 * @property {string} currentStatus - not-started | running | completed | paused
 * @property {string|null} decision - last decision from current stage
 * @property {string|null} nextStage - resolved next stage (null if kill/end)
 * @property {string} action - advance | stay | back | kill | pause | needs-run | needs-decision
 * @property {boolean} needsHumanDecision
 * @property {string} message - human-readable explanation
 * @property {Object|null} bridgePreview - what data would be passed to next stage
 */
export async function inspectPipeline() {
  const manifest = await readManifest();
  const currentStage = manifest.currentStage ?? STAGE_ORDER[0];

  // Check if current stage has a report
  const report = await readReport(currentStage);

  if (!report) {
    return {
      currentStage,
      currentStatus: "not-started",
      decision: null,
      nextStage: null,
      action: "needs-run",
      needsHumanDecision: false,
      message: `Stage "${currentStage}" has no report yet. Run the stage skill/tool first.`,
      bridgePreview: null,
    };
  }

  const stageStatus = report.status ?? "draft";
  const decision = report.decision ?? null;

  // Stage is still running or in draft
  if (stageStatus === "running" || stageStatus === "draft") {
    return {
      currentStage,
      currentStatus: stageStatus,
      decision: null,
      nextStage: null,
      action: "needs-run",
      needsHumanDecision: false,
      message: `Stage "${currentStage}" is ${stageStatus}. Complete the stage first.`,
      bridgePreview: null,
    };
  }

  // Stage completed but no decision yet
  if (!decision) {
    return {
      currentStage,
      currentStatus: "completed",
      decision: null,
      nextStage: null,
      action: "needs-decision",
      needsHumanDecision: true,
      message: `Stage "${currentStage}" completed but no decision recorded. ` +
               `Set decision in report.json (continue/pivot/kill).`,
      bridgePreview: null,
    };
  }

  // Resolve next stage
  const nextStageAction = report.nextStageAction ?? null;
  const resolved = resolveNextStage(currentStage, decision, nextStageAction);

  // Kill decision — pipeline ends
  if (resolved.action === "kill") {
    return {
      currentStage,
      currentStatus: "completed",
      decision,
      nextStage: null,
      action: "kill",
      needsHumanDecision: false,
      message: `Stage "${currentStage}" decision is "kill". Pipeline terminated. ` +
               `Review the evidence and consider a new opportunity.`,
      bridgePreview: null,
    };
  }

  // Pause decision
  if (resolved.action === "pause") {
    return {
      currentStage,
      currentStatus: "paused",
      decision,
      nextStage: currentStage,
      action: "pause",
      needsHumanDecision: true,
      message: `Stage "${currentStage}" is paused. Update the report when ready to proceed.`,
      bridgePreview: null,
    };
  }

  // Human decision point check
  const needsHuman = HUMAN_DECISION_POINTS.has(currentStage) && resolved.action === "advance";

  // Build bridge preview
  let bridgePreview = null;
  if (resolved.nextStage && resolved.nextStage !== currentStage) {
    const handoff = await readHandoff(currentStage);
    if (handoff) {
      const bridge = getBridge(currentStage, resolved.nextStage);
      if (bridge) {
        try {
          bridgePreview = bridge(handoff);
        } catch {
          bridgePreview = { error: "Bridge transform failed" };
        }
      }
    }
  }

  return {
    currentStage,
    currentStatus: "completed",
    decision,
    nextStage: resolved.nextStage,
    action: needsHuman ? "awaiting-confirmation" : resolved.action,
    needsHumanDecision: needsHuman,
    message: needsHuman
      ? `Stage "${currentStage}" → "${resolved.nextStage}": ` +
        `Awaiting founder confirmation. Run with --confirm to proceed.`
      : `Stage "${currentStage}" → "${resolved.nextStage}": Ready to advance.`,
    bridgePreview,
  };
}

/**
 * Execute a single stage transition:
 *   1. Validate current stage artifacts
 *   2. Read handoff data
 *   3. Run bridge to generate next stage input
 *   4. Write input.json to next stage
 *   5. Update playbook.json manifest
 *
 * @param {Object} options
 * @param {boolean} [options.dryRun=false] - Preview without writing
 * @param {boolean} [options.confirm=false] - Bypass human decision pause
 * @returns {TransitionResult}
 */
export async function executeTransition({ dryRun = false, confirm = false } = {}) {
  const state = await inspectPipeline();

  // Can't advance if stage needs to be run first
  if (state.action === "needs-run") {
    return {
      success: false,
      action: "needs-run",
      message: state.message,
      fromStage: state.currentStage,
      toStage: null,
    };
  }

  // Can't advance without a decision
  if (state.action === "needs-decision") {
    return {
      success: false,
      action: "needs-decision",
      message: state.message,
      fromStage: state.currentStage,
      toStage: null,
    };
  }

  // Kill — nothing to do
  if (state.action === "kill") {
    return {
      success: true,
      action: "kill",
      message: state.message,
      fromStage: state.currentStage,
      toStage: null,
    };
  }

  // Human decision point — require --confirm
  if (state.needsHumanDecision && !confirm) {
    return {
      success: false,
      action: "awaiting-confirmation",
      message: state.message,
      fromStage: state.currentStage,
      toStage: state.nextStage,
      bridgePreview: state.bridgePreview,
    };
  }

  // Validate current stage artifacts before advancing
  const validation = await validateStageArtifacts(state.currentStage);
  if (!validation.valid) {
    return {
      success: false,
      action: "validation-failed",
      message: `Stage "${state.currentStage}" has artifact issues:\n` +
               validation.issues.map(issue => `  - ${issue}`).join("\n"),
      fromStage: state.currentStage,
      toStage: state.nextStage,
    };
  }

  // Read handoff and run bridge
  const handoff = await readHandoff(state.currentStage);
  if (!handoff) {
    return {
      success: false,
      action: "missing-handoff",
      message: `Stage "${state.currentStage}" has no handoff.json. ` +
               `Cannot generate input for "${state.nextStage}".`,
      fromStage: state.currentStage,
      toStage: state.nextStage,
    };
  }

  let inputData = null;
  const bridge = getBridge(state.currentStage, state.nextStage);
  if (bridge) {
    inputData = await executeBridge(state.currentStage, state.nextStage, handoff);
  }

  // Dry run — return preview without writing
  if (dryRun) {
    return {
      success: true,
      action: "dry-run",
      message: `[DRY RUN] Would advance: "${state.currentStage}" → "${state.nextStage}"`,
      fromStage: state.currentStage,
      toStage: state.nextStage,
      inputData,
    };
  }

  // Write input.json to next stage
  if (inputData && state.nextStage) {
    await writeInput(state.nextStage, inputData);
  }

  // Update manifest
  await advanceStage(state.currentStage, state.nextStage, state.decision);

  return {
    success: true,
    action: "advanced",
    message: `Advanced: "${state.currentStage}" → "${state.nextStage}"`,
    fromStage: state.currentStage,
    toStage: state.nextStage,
    inputData,
  };
}

/**
 * Run the pipeline from current stage through to a target stage (or end).
 * Stops at human decision points unless --confirm is set.
 *
 * @param {Object} options
 * @param {string} [options.targetStage] - Stop after reaching this stage
 * @param {boolean} [options.confirm=false] - Auto-confirm human decisions
 * @param {boolean} [options.dryRun=false] - Preview mode
 * @returns {PipelineRunResult}
 */
export async function runPipeline({ targetStage, confirm = false, dryRun = false } = {}) {
  const transitions = [];
  let maxIterations = STAGE_ORDER.length + 1; // Safety limit

  while (maxIterations-- > 0) {
    const result = await executeTransition({ dryRun, confirm });
    transitions.push(result);

    // Stop conditions
    if (!result.success) break;
    if (result.action === "kill") break;
    if (result.action === "dry-run") break;

    // Reached target stage
    if (targetStage && result.toStage === targetStage) break;

    // Reached end of pipeline
    if (!result.toStage) break;

    // Don't loop forever on "stay" actions
    if (result.fromStage === result.toStage) break;
  }

  const lastTransition = transitions[transitions.length - 1];
  return {
    totalTransitions: transitions.length,
    finalStage: lastTransition?.toStage ?? lastTransition?.fromStage,
    stoppedBecause: lastTransition?.action,
    transitions,
  };
}

/**
 * Print a formatted status summary to stdout.
 */
export async function printStatus() {
  const statuses = await getStageStatuses();
  const lines = [
    "",
    "┌─────────────────────────────────────────────────┐",
    "│         Startup Playbook Pipeline Status         │",
    "├─────────────────────────────────────────────────┤",
  ];

  for (const stage of statuses.stages) {
    const icon = stage.isCurrent ? "▶" :
                 stage.status === "completed" ? "✓" :
                 stage.status === "running" ? "◉" :
                 stage.status === "not-started" ? "○" : "⏸";
    const decision = stage.decision ? ` [${stage.decision}]` : "";
    const marker = stage.isCurrent ? " ← current" : "";
    const paddedName = stage.stage.padEnd(16);
    const paddedStatus = stage.status.padEnd(12);
    lines.push(`│  ${icon} ${paddedName} ${paddedStatus}${decision}${marker}`);
  }

  lines.push("├─────────────────────────────────────────────────┤");

  // Inspect next action
  try {
    const state = await inspectPipeline();
    lines.push(`│  Next: ${state.message.slice(0, 42)}`);
    if (state.message.length > 42) {
      lines.push(`│        ${state.message.slice(42, 84)}`);
    }
  } catch {
    lines.push("│  Next: Unable to determine (missing manifest?)");
  }

  lines.push("└─────────────────────────────────────────────────┘");
  lines.push("");

  return lines.join("\n");
}
