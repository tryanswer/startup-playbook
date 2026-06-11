/**
 * Evidence Tracker — cross-stage evidence accumulation.
 *
 * Maintains a global evidence ledger (playbook/evidence.json) that records
 * every significant data point collected across pipeline stages. Each evidence
 * entry has a unique ID, provenance (which stage, source, timestamp), and
 * the raw signal/data that supports a decision.
 *
 * Usage:
 *   import { EvidenceTracker } from '../_shared/evidence-tracker.mjs';
 *   const tracker = await EvidenceTracker.load();
 *   tracker.addEvidence({ stage, source, signalType, title, excerpt, score, url });
 *   await tracker.save();
 *   const refs = tracker.getEvidenceRefs('discover');
 */

import { readEvidence } from "./playbook-io.mjs";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const EVIDENCE_PATH = join(REPO_ROOT, "playbook", "evidence.json");

/* ------------------------------------------------------------------ */
/*  Evidence Entry Schema                                              */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} EvidenceEntry
 * @property {string} id              — Unique evidence ID (e.g. "ev-discover-reddit-001")
 * @property {string} stage           — Pipeline stage that collected this ("discover", "validate", etc.)
 * @property {string} source          — Data source ("reddit", "github", "hacker-news", etc.)
 * @property {string} signalType      — Signal type ("pricing-pain", "revenue-signal", etc.)
 * @property {string} title           — Short title/headline of the evidence
 * @property {string} [excerpt]       — Supporting text excerpt (max 300 chars)
 * @property {number} [score]         — Community score (upvotes, stars, etc.)
 * @property {number} [comments]      — Comment count
 * @property {string} [url]           — Link to original source
 * @property {number} [weight]        — Signal weight (from rule definition)
 * @property {string} collectedAt     — ISO timestamp when collected
 * @property {string[]} [referencedBy] — Stages that reference this evidence
 */

/* ------------------------------------------------------------------ */
/*  EvidenceTracker Class                                              */
/* ------------------------------------------------------------------ */

export class EvidenceTracker {
  /** @param {{ entries: EvidenceEntry[], metadata: Object }} ledger */
  constructor(ledger = null) {
    const data = ledger ?? { entries: [], metadata: {} };
    /** @type {EvidenceEntry[]} */
    this.entries = data.entries ?? [];
    /** @type {Object} */
    this.metadata = data.metadata ?? {};
    /** @type {Set<string>} */
    this._existingIds = new Set(this.entries.map((entry) => entry.id));
  }

  /**
   * Load the evidence ledger from disk. Returns empty tracker if no file exists.
   */
  static async load() {
    const data = await readEvidence();
    return new EvidenceTracker(data);
  }

  /**
   * Save the evidence ledger to disk.
   */
  async save() {
    this.metadata.updatedAt = new Date().toISOString();
    this.metadata.totalEntries = this.entries.length;
    this.metadata.stageBreakdown = this._computeStageBreakdown();

    const ledger = {
      protocolVersion: "1.0",
      artifactType: "evidence-ledger",
      ...this.metadata,
      entries: this.entries,
    };

    await mkdir(dirname(EVIDENCE_PATH), { recursive: true });
    await writeFile(EVIDENCE_PATH, JSON.stringify(ledger, null, 2) + "\n", "utf-8");
    return EVIDENCE_PATH;
  }

  /**
   * Add a single evidence entry. Deduplicates by ID.
   * @param {Partial<EvidenceEntry>} entry
   * @returns {string} The evidence ID
   */
  addEvidence(entry) {
    const evidenceId = entry.id ?? this._generateId(entry.stage, entry.source);
    if (this._existingIds.has(evidenceId)) return evidenceId;

    this.entries.push({
      id: evidenceId,
      stage: entry.stage ?? "unknown",
      source: entry.source ?? "unknown",
      signalType: entry.signalType ?? "general",
      title: truncate(entry.title ?? "", 180),
      excerpt: truncate(entry.excerpt ?? "", 300),
      score: entry.score ?? 0,
      comments: entry.comments ?? 0,
      url: entry.url ?? null,
      weight: entry.weight ?? 1,
      collectedAt: entry.collectedAt ?? new Date().toISOString(),
      referencedBy: entry.referencedBy ?? [entry.stage],
    });

    this._existingIds.add(evidenceId);
    return evidenceId;
  }

  /**
   * Bulk-add evidence from collected items + extracted signals.
   *
   * @param {string} stage — Pipeline stage name
   * @param {Array} items — Raw collected items from data sources
   * @param {Object} extracted — Result from extractSignals()
   * @returns {string[]} Array of evidence IDs added
   */
  addFromAnalysis(stage, items, extracted) {
    const evidenceIds = [];

    // Add evidence from extracted signals (these are the strongest evidence)
    for (const signal of extracted?.signals ?? []) {
      const evidenceId = this.addEvidence({
        stage,
        source: signal.source ?? "unknown",
        signalType: signal.type,
        title: signal.title ?? signal.excerpt ?? "",
        excerpt: signal.excerpt ?? "",
        score: signal.score ?? 0,
        comments: signal.comments ?? 0,
        url: signal.url ?? null,
        weight: signal.weight ?? 1,
        collectedAt: signal.createdAt ?? new Date().toISOString(),
      });
      evidenceIds.push(evidenceId);
    }

    // Add high-engagement items that weren't captured as signals
    const signalItemIds = new Set(
      (extracted?.signals ?? []).map((signal) => signal.itemId).filter(Boolean)
    );
    const highEngagementItems = items
      .filter((item) => !signalItemIds.has(item.id))
      .filter((item) => (item.score ?? 0) >= 50 || (item.comments ?? 0) >= 20)
      .slice(0, 10); // Cap at 10 extra items

    for (const item of highEngagementItems) {
      const evidenceId = this.addEvidence({
        stage,
        source: item.source ?? "unknown",
        signalType: "high-engagement",
        title: item.title ?? "",
        excerpt: item.excerpt ?? item.description ?? "",
        score: item.score ?? 0,
        comments: item.comments ?? 0,
        url: item.url ?? null,
        weight: 1,
      });
      evidenceIds.push(evidenceId);
    }

    return evidenceIds;
  }

  /**
   * Mark evidence as referenced by a new stage.
   * @param {string[]} evidenceIds
   * @param {string} stageName
   */
  markReferencedBy(evidenceIds, stageName) {
    for (const entry of this.entries) {
      if (evidenceIds.includes(entry.id)) {
        if (!entry.referencedBy) entry.referencedBy = [];
        if (!entry.referencedBy.includes(stageName)) {
          entry.referencedBy.push(stageName);
        }
      }
    }
  }

  /**
   * Get evidence IDs for a specific stage.
   * @param {string} stageName
   * @returns {string[]}
   */
  getEvidenceRefs(stageName) {
    return this.entries
      .filter((entry) => entry.stage === stageName)
      .map((entry) => entry.id);
  }

  /**
   * Get all evidence entries for a specific stage.
   * @param {string} stageName
   * @returns {EvidenceEntry[]}
   */
  getStageEvidence(stageName) {
    return this.entries.filter((entry) => entry.stage === stageName);
  }

  /**
   * Get evidence that has been referenced across multiple stages.
   * These are the strongest, most durable signals.
   * @returns {EvidenceEntry[]}
   */
  getCrossStageEvidence() {
    return this.entries.filter(
      (entry) => (entry.referencedBy?.length ?? 0) >= 2
    );
  }

  /**
   * Query evidence by signal type across all stages.
   * @param {string} signalType
   * @returns {EvidenceEntry[]}
   */
  queryBySignalType(signalType) {
    return this.entries.filter((entry) => entry.signalType === signalType);
  }

  /**
   * Get a summary of accumulated evidence for handoff enrichment.
   * @param {string} stageName — Current stage to summarize up to
   * @returns {Object}
   */
  getSummary(stageName) {
    const stageEntries = this.getStageEvidence(stageName);
    const allPriorEntries = this.entries.filter(
      (entry) => entry.stage !== stageName
    );

    const signalTypeCounts = {};
    for (const entry of stageEntries) {
      signalTypeCounts[entry.signalType] =
        (signalTypeCounts[entry.signalType] ?? 0) + 1;
    }

    return {
      currentStageCount: stageEntries.length,
      priorStageCount: allPriorEntries.length,
      totalCount: this.entries.length,
      signalTypes: signalTypeCounts,
      crossStageCount: this.getCrossStageEvidence().length,
      topEvidenceIds: stageEntries
        .sort((left, right) => (right.weight ?? 0) - (left.weight ?? 0))
        .slice(0, 5)
        .map((entry) => entry.id),
    };
  }

  /* ---------------------------------------------------------------- */
  /*  Private helpers                                                  */
  /* ---------------------------------------------------------------- */

  _generateId(stage, source) {
    const counter = this.entries.filter(
      (entry) => entry.stage === stage && entry.source === source
    ).length + 1;
    return `ev-${stage}-${source}-${String(counter).padStart(3, "0")}`;
  }

  _computeStageBreakdown() {
    const breakdown = {};
    for (const entry of this.entries) {
      if (!breakdown[entry.stage]) {
        breakdown[entry.stage] = { count: 0, sources: new Set() };
      }
      breakdown[entry.stage].count += 1;
      breakdown[entry.stage].sources.add(entry.source);
    }
    // Convert Sets to arrays for JSON serialization
    for (const stage of Object.keys(breakdown)) {
      breakdown[stage].sources = [...breakdown[stage].sources];
    }
    return breakdown;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text ?? "";
  return text.slice(0, maxLength - 3) + "...";
}
