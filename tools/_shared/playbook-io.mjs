#!/usr/bin/env node

/**
 * Shared I/O utilities for reading/writing playbook artifacts.
 *
 * Centralises all file-system access to playbook/ so that tools
 * and the orchestrator use a single, consistent interface.
 *
 * Usage:
 *   import { readManifest, readHandoff, advanceStage } from '../_shared/playbook-io.mjs';
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const PLAYBOOK_DIR = join(REPO_ROOT, "playbook");
const STAGES_DIR = join(PLAYBOOK_DIR, "stages");

const STAGE_ORDER = [
  "discover",
  "validate",
  "business-model",
  "build",
  "grow",
  "operate",
];

/* ------------------------------------------------------------------ */
/*  Read helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Read and parse a JSON file. Returns null if file does not exist.
 */
async function readJsonSafe(filePath) {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(`Failed to parse ${filePath}: ${error.message}`);
  }
}

/** Read playbook/playbook.json */
export async function readManifest() {
  const manifest = await readJsonSafe(join(PLAYBOOK_DIR, "playbook.json"));
  if (!manifest) {
    throw new Error("playbook/playbook.json not found. Run a stage first.");
  }
  return manifest;
}

/** Read a stage's report.json */
export async function readReport(stageName) {
  return readJsonSafe(join(STAGES_DIR, stageName, "report.json"));
}

/** Read a stage's handoff.json */
export async function readHandoff(stageName) {
  return readJsonSafe(join(STAGES_DIR, stageName, "handoff.json"));
}

/** Read a stage's input.json */
export async function readInput(stageName) {
  return readJsonSafe(join(STAGES_DIR, stageName, "input.json"));
}

/** Read the global evidence ledger */
export async function readEvidence() {
  return readJsonSafe(join(PLAYBOOK_DIR, "evidence.json"));
}

/* ------------------------------------------------------------------ */
/*  Write helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Write a JSON artifact to a stage directory.
 * Automatically creates directories and pretty-prints.
 */
async function writeStageArtifact(stageName, fileName, data) {
  const stageDir = join(STAGES_DIR, stageName);
  await mkdir(stageDir, { recursive: true });
  const filePath = join(stageDir, fileName);
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  return filePath;
}

export async function writeReport(stageName, data) {
  return writeStageArtifact(stageName, "report.json", data);
}

export async function writeHandoff(stageName, data) {
  return writeStageArtifact(stageName, "handoff.json", data);
}

export async function writeInput(stageName, data) {
  return writeStageArtifact(stageName, "input.json", data);
}

/**
 * Update playbook.json manifest (merge fields into existing).
 */
export async function updateManifest(patch) {
  const manifest = await readManifest();
  const updated = deepMerge(manifest, patch);
  updated.updatedAt = new Date().toISOString();
  const filePath = join(PLAYBOOK_DIR, "playbook.json");
  await writeFile(filePath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Stage navigation                                                   */
/* ------------------------------------------------------------------ */

/**
 * Get the next stage name given the current stage and a decision.
 *
 * @param {string} currentStage
 * @param {string} decision - continue | pivot | kill | pause | adjust
 * @param {string} [nextStageAction] - advance | stay | back-to-{stage}
 * @returns {{ nextStage: string|null, action: string }}
 */
export function resolveNextStage(currentStage, decision, nextStageAction) {
  // Explicit action overrides
  if (nextStageAction) {
    if (nextStageAction === "advance") {
      return { nextStage: getNextInOrder(currentStage), action: "advance" };
    }
    if (nextStageAction === "stay") {
      return { nextStage: currentStage, action: "stay" };
    }
    if (nextStageAction.startsWith("back-to-")) {
      const target = nextStageAction.replace("back-to-", "");
      if (STAGE_ORDER.includes(target)) {
        return { nextStage: target, action: "back" };
      }
    }
  }

  // Decision-based defaults
  switch (decision) {
    case "continue":
      return { nextStage: getNextInOrder(currentStage), action: "advance" };
    case "pivot":
      return { nextStage: "validate", action: "back" };
    case "kill":
      return { nextStage: null, action: "kill" };
    case "pause":
      return { nextStage: currentStage, action: "pause" };
    case "adjust":
      return { nextStage: currentStage, action: "stay" };
    default:
      return { nextStage: currentStage, action: "stay" };
  }
}

/**
 * Advance the manifest to the next stage.
 * Updates currentStage, stage statuses, and latestDecision.
 */
export async function advanceStage(fromStage, toStage, decision) {
  const manifest = await readManifest();

  // Update the source stage status
  if (manifest.stages?.[fromStage]) {
    manifest.stages[fromStage].status = "completed";
    manifest.stages[fromStage].completedAt = new Date().toISOString();
    manifest.stages[fromStage].decision = decision;
  }

  // Set new current stage
  manifest.currentStage = toStage;

  // Update target stage status
  if (toStage && manifest.stages?.[toStage]) {
    manifest.stages[toStage].status = "running";
    manifest.stages[toStage].startedAt = new Date().toISOString();
  }

  // Update latest decision
  manifest.latestDecision = {
    stage: fromStage,
    decision,
    advancedTo: toStage,
    at: new Date().toISOString(),
  };

  manifest.updatedAt = new Date().toISOString();

  const filePath = join(PLAYBOOK_DIR, "playbook.json");
  await writeFile(filePath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  return manifest;
}

/* ------------------------------------------------------------------ */
/*  Stage status helpers                                               */
/* ------------------------------------------------------------------ */

/**
 * Get summary of all stage statuses from the manifest.
 */
export async function getStageStatuses() {
  const manifest = await readManifest();
  const statuses = [];

  for (const stage of STAGE_ORDER) {
    const stageData = manifest.stages?.[stage] ?? {};
    statuses.push({
      stage,
      status: stageData.status ?? "not-started",
      decision: stageData.decision ?? null,
      isCurrent: manifest.currentStage === stage,
    });
  }

  return { currentStage: manifest.currentStage, stages: statuses };
}

/**
 * Check whether a stage has all required artifacts.
 */
export async function validateStageArtifacts(stageName) {
  const issues = [];

  const report = await readReport(stageName);
  if (!report) {
    issues.push(`${stageName}/report.json is missing`);
  } else {
    for (const field of ["protocolVersion", "artifactType", "projectId", "status", "decision"]) {
      if (!report[field]) issues.push(`${stageName}/report.json missing field: ${field}`);
    }
  }

  const handoff = await readHandoff(stageName);
  if (!handoff) {
    issues.push(`${stageName}/handoff.json is missing`);
  }

  return { valid: issues.length === 0, issues };
}

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function getNextInOrder(currentStage) {
  const index = STAGE_ORDER.indexOf(currentStage);
  if (index < 0 || index >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[index + 1];
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value) &&
        result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export { STAGE_ORDER, PLAYBOOK_DIR, STAGES_DIR, REPO_ROOT };
