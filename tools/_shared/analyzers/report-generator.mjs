/**
 * Report Generator — produces structured JSON and human-readable Markdown reports
 * from fused signal analysis results.
 *
 * Output formats:
 *   1. JSON report  — machine-readable, stored as playbook artifact
 *   2. Markdown report — human-readable summary with evidence and recommendations
 *
 * Usage:
 *   import { generateReport, generateMarkdown } from './report-generator.mjs';
 *   const report = generateReport(fusionResult, { projectId: 'my-saas' });
 *   const markdown = generateMarkdown(report);
 */

import { cleanText } from "../http-client.mjs";

/* ------------------------------------------------------------------ */
/*  JSON Report                                                        */
/* ------------------------------------------------------------------ */

/**
 * Generate a structured analysis report from fusion results.
 *
 * @param {import('./signal-fusion.mjs').FusionResult} fusion
 * @param {Object} [options]
 * @param {string} [options.projectId]
 * @param {string} [options.query] — original search query
 * @param {string[]} [options.sources] — source names used
 * @returns {AnalysisReport}
 */
export function generateReport(fusion, options = {}) {
  const topOpportunity = fusion.topOpportunity;
  const decision = topOpportunity?.decision ?? { decision: "kill", label: "❌ Kill", reasoning: "No opportunities found" };

  return {
    protocolVersion: "1.0",
    artifactType: "analysis-report",
    projectId: options.projectId ?? "startup-analysis",
    generatedAt: fusion.generatedAt ?? new Date().toISOString(),
    query: options.query ?? null,

    // Summary
    status: "completed",
    score: topOpportunity?.score?.total ?? 0,
    decision: decision.decision,
    decisionLabel: decision.label,
    reasoning: decision.reasoning,

    // Input stats
    input: fusion.inputStats,

    // Top opportunities (ranked)
    opportunities: fusion.opportunities.map((opp, index) => ({
      rank: index + 1,
      id: opp.id,
      theme: opp.theme,
      description: opp.description,
      targetUser: opp.targetUser,
      painfulSituation: opp.painfulSituation,
      score: opp.score,
      decision: opp.decision,
      signalTypes: opp.signalTypes,
      sources: opp.sources,
      communities: opp.communities,
      evidenceCount: opp.evidence.length,
      evidence: opp.evidence.slice(0, 5),
    })),

    // Cross-validation
    crossValidation: fusion.crossValidation,

    // Evidence gaps
    gaps: fusion.gaps,

    // Confidence
    confidence: fusion.overallConfidence,

    // Recommendations
    nextSteps: generateNextSteps(fusion),
  };
}

/* ------------------------------------------------------------------ */
/*  Markdown Report                                                    */
/* ------------------------------------------------------------------ */

/**
 * Generate a human-readable Markdown report.
 *
 * @param {AnalysisReport} report
 * @returns {string}
 */
export function generateMarkdown(report) {
  const lines = [];

  // Header
  lines.push(`# 📊 Startup Opportunity Analysis Report`);
  lines.push("");
  lines.push(`> Generated: ${formatDate(report.generatedAt)} | Project: ${report.projectId}`);
  if (report.query) lines.push(`> Query: "${report.query}"`);
  lines.push("");

  // Decision Banner
  lines.push("---");
  lines.push("");
  lines.push(`## ${report.decisionLabel} — Score: ${report.score}/100`);
  lines.push("");
  lines.push(`> ${report.reasoning}`);
  lines.push("");

  // Confidence
  const conf = report.confidence;
  lines.push(`**Confidence**: ${conf.label} (${conf.score}/100)`);
  lines.push("");

  // Input Summary
  lines.push("---");
  lines.push("");
  lines.push("## 📥 Data Coverage");
  lines.push("");
  lines.push(`- **Items analyzed**: ${report.input.totalItems}`);
  lines.push(`- **Signals extracted**: ${report.input.totalSignals}`);
  lines.push(`- **Sources**: ${report.input.sourcesCovered.join(", ") || "none"}`);
  lines.push(`- **Communities**: ${report.input.communitiesCovered.join(", ") || "none"}`);
  lines.push("");

  // Opportunities
  lines.push("---");
  lines.push("");
  lines.push(`## 🎯 Opportunities (${report.opportunities.length} found)`);
  lines.push("");

  for (const opp of report.opportunities.slice(0, 5)) {
    lines.push(`### #${opp.rank}: ${opp.theme} ${opp.decision.label}`);
    lines.push("");
    lines.push(`- **Score**: ${opp.score.total}/100`);
    lines.push(`- **Target user**: ${opp.targetUser}`);
    lines.push(`- **Painful situation**: ${opp.painfulSituation}`);
    lines.push(`- **Signal types**: ${opp.signalTypes.join(", ")}`);
    lines.push(`- **Sources**: ${opp.sources.join(", ")} (${opp.communities.join(", ")})`);
    lines.push("");

    // Score breakdown
    const breakdown = opp.score.breakdown;
    if (breakdown) {
      lines.push("**Score breakdown**:");
      lines.push("");
      lines.push("| Dimension | Score | Max | Detail |");
      lines.push("|-----------|-------|-----|--------|");
      for (const [key, dim] of Object.entries(breakdown)) {
        const bar = progressBar(dim.score, dim.max, 10);
        lines.push(`| ${key} | ${dim.score} | ${dim.max} | ${bar} ${dim.description} |`);
      }
      lines.push("");
    }

    // Evidence
    if (opp.evidence.length > 0) {
      lines.push("**Key evidence**:");
      lines.push("");
      for (const ev of opp.evidence.slice(0, 3)) {
        const link = ev.url ? `[${cleanText(ev.title, 60)}](${ev.url})` : cleanText(ev.title, 60);
        lines.push(`- ${link} — *${ev.signalType}* (${ev.source}, score: ${ev.score})`);
      }
      lines.push("");
    }
  }

  // Cross-Validation
  lines.push("---");
  lines.push("");
  lines.push("## 🔬 Cross-Validation");
  lines.push("");
  const cv = report.crossValidation;
  lines.push(`- **Pain confirmed**: ${cv.painConfirmed ? "✅" : "❌"}`);
  lines.push(`- **Demand confirmed**: ${cv.demandConfirmed ? "✅" : "❌"}`);
  lines.push(`- **Supply mapped**: ${cv.supplyMapped ? "✅" : "❌"}`);
  lines.push(`- **Triangulated**: ${cv.triangulated ? "✅ Yes" : "⚠️ Not yet"}`);
  lines.push(`- **Convergence score**: ${cv.convergenceScore}/100`);
  lines.push("");
  lines.push(`> ${cv.assessment}`);
  lines.push("");

  // Gaps
  if (report.gaps.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## ⚠️ Evidence Gaps");
    lines.push("");
    for (const gap of report.gaps) {
      const icon = gap.severity === "critical" ? "🔴" : gap.severity === "high" ? "🟠" : "🟡";
      lines.push(`${icon} **${gap.type}** (${gap.severity})`);
      lines.push(`  ${gap.message}`);
      lines.push(`  → *Action*: ${gap.action}`);
      lines.push("");
    }
  }

  // Next Steps
  if (report.nextSteps.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 🚀 Recommended Next Steps");
    lines.push("");
    for (let i = 0; i < report.nextSteps.length; i++) {
      lines.push(`${i + 1}. ${report.nextSteps[i]}`);
    }
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push("");
  lines.push(`*Report generated by Startup Playbook Analyzer — ${formatDate(report.generatedAt)}*`);

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Next Steps Generator                                               */
/* ------------------------------------------------------------------ */

function generateNextSteps(fusion) {
  const steps = [];
  const gaps = fusion.gaps ?? [];
  const topOpp = fusion.topOpportunity;
  const cv = fusion.crossValidation;

  // Priority 1: Fix critical gaps
  const criticalGaps = gaps.filter((g) => g.severity === "critical");
  for (const gap of criticalGaps) {
    steps.push(gap.action);
  }

  // Priority 2: Based on cross-validation status
  if (!cv.painConfirmed) {
    steps.push("Collect more community data with targeted queries to identify user pain points.");
  }
  if (cv.painConfirmed && !cv.demandConfirmed) {
    steps.push("Validate demand: search for purchase intent, pricing discussions, and competitor pricing.");
  }
  if (cv.painConfirmed && cv.demandConfirmed && !cv.supplyMapped) {
    steps.push("Map the competitive landscape: search GitHub, Product Hunt, and App Store for existing solutions.");
  }

  // Priority 3: If we have a top opportunity
  if (topOpp) {
    const decision = topOpp.decision?.decision;
    if (decision === "continue") {
      steps.push(`Run the idea-validator tool on the "${topOpp.theme}" opportunity for deeper validation.`);
      steps.push("Create a validation brief and design a 7-day experiment to test willingness to pay.");
    } else if (decision === "pivot") {
      steps.push(`Narrow the "${topOpp.theme}" opportunity: focus on a more specific user segment.`);
      steps.push("Collect additional data from at least 2 more sources to cross-validate.");
    }
  }

  // Priority 4: Source diversity
  if (fusion.inputStats.sourcesCovered.length < 3) {
    steps.push("Add more data sources to reduce single-source bias (recommend: add HN + GitHub + App Store).");
  }

  // Always include
  if (steps.length === 0) {
    steps.push("Broaden search queries and collect data from more communities.");
    steps.push("Consider interviewing 3-5 potential users to validate pain points.");
  }

  return steps.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(isoString) {
  if (!isoString) return "unknown";
  try {
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function progressBar(value, max, width) {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
