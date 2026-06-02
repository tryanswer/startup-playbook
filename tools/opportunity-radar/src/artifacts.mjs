import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function buildRunFileName({ generatedAt, slug, existingNames = new Set() }) {
  const stamp = new Date(generatedAt).toISOString().replace(/\.\d{3}Z$/, "").replace(/:/g, "-");
  const baseSlug = slugify(slug || "opportunity-radar");
  let fileName = `${stamp}-${baseSlug}.json`;
  let index = 2;
  while (existingNames.has(fileName)) {
    fileName = `${stamp}-${baseSlug}-${index}.json`;
    index += 1;
  }
  return fileName;
}

export function buildDiscoverArtifacts(analysis, options = {}) {
  const generatedAt = options.generatedAt ?? analysis.generatedAt ?? new Date().toISOString();
  const projectId = options.projectId ?? "project-id";
  const runFileName = options.runFileName ?? buildRunFileName({ generatedAt, slug: analysis.project });
  const runPath = `stages/discover/runs/${runFileName}`;
  const sourceErrors = options.sourceErrors ?? analysis.sourceErrors ?? [];
  const topCandidate = analysis.topCandidates?.[0] ?? analysis.candidates?.[0] ?? null;
  const score = topCandidate?.score ?? null;
  const decision = score == null ? "pause" : score >= 60 ? "continue" : "pivot";
  const nextStageAction = decision === "continue" ? "advance" : "stay";
  const evidenceRefs = buildEvidenceRefs(analysis);
  const reasoning = topCandidate
    ? `Top ${topCandidate.type} candidate scored ${topCandidate.score}: ${topCandidate.title}.`
    : "No opportunity candidate passed the discovery filters.";

  const input = {
    protocolVersion: "1.0",
    artifactType: "stage-input",
    projectId,
    stage: "discover",
    generatedAt,
    generatedBy: {
      agent: "codex",
      skill: "opportunity-discovery",
      model: options.model ?? "unknown",
    },
    sourceInputs: options.sourceInputs ?? [],
    inputs: {
      project: analysis.project,
      targetMarkets: ["international"],
      sources: {
        communities: analysis.sourceCoverage?.communities ?? [],
        cases: analysis.sourceCoverage?.cases ?? [],
      },
      thresholds: options.thresholds ?? {
        minScoreForValidation: 60,
        maxTopCandidates: 5,
      },
      sourceErrors,
    },
  };

  const report = {
    protocolVersion: "1.0",
    artifactType: "stage-report",
    projectId,
    stage: "discover",
    generatedAt,
    generatedBy: {
      agent: "codex",
      skill: "opportunity-discovery",
      model: options.model ?? "unknown",
    },
    sourceInputs: [
      {
        type: "file",
        path: "playbook/stages/discover/input.json",
      },
      ...input.sourceInputs,
    ],
    status: "completed",
    score,
    decision,
    nextStageAction,
    reasoning,
    known: buildKnownFacts(analysis),
    assumed: [
      "Community and case signals are discovery evidence, not validation proof.",
      "Case-led patterns require a narrower wedge before product work.",
    ],
    toValidate: topCandidate
      ? [
          `Whether ${topCandidate.targetUser} has urgent enough pain to book a call or pay for a manual test.`,
          "Whether the first reachable channel produces replies from real buyers.",
        ]
      : ["Find at least one repeated pain cluster or copyable public case pattern."],
    evidenceRefs,
    concerns: [
      "Public community posts can overrepresent vocal users.",
      "Successful public cases may depend on founder audience, timing, or existing distribution.",
      "Discovery candidates must still pass validation before build work.",
    ],
    nextSteps: topCandidate ? [
      topCandidate.recommendedNextExperiment,
      "Create a validation brief from the selected candidate.",
      "Collect direct buyer pain and paid-intent evidence before building.",
    ] : [
      "Broaden community and case sources, then rerun the radar.",
    ],
    analysis: {
      radarRun: {
        runId: runFileName.replace(/\.json$/i, ""),
        runPath,
        generatedAt: analysis.generatedAt,
        candidateCount: analysis.candidates?.length ?? 0,
        sourceCoverage: analysis.sourceCoverage,
        sourceErrors,
      },
      signalSummary: analysis.signalSummary,
      opportunityBacklog: analysis.candidates ?? [],
      topCandidates: analysis.topCandidates ?? [],
      communitySignals: analysis.communitySignals ?? [],
      caseSignals: analysis.caseSignals ?? [],
      preservation: {
        latestFilesMayRefresh: [
          "playbook/stages/discover/input.json",
          "playbook/stages/discover/report.json",
          "playbook/stages/discover/handoff.json",
          "playbook/stages/discover/report.md",
        ],
        appendOnlyRunsDir: "playbook/stages/discover/runs",
        currentRunPath: runPath,
        overwritePolicy: "Never overwrite run snapshots; use timestamped names and numeric suffixes on collision.",
      },
    },
    handoffSummary: topCandidate ? {
      nextStage: "validate",
      candidateId: topCandidate.id,
      candidateType: topCandidate.type,
      targetUserCandidate: topCandidate.targetUser,
      painfulSituation: topCandidate.painfulSituation,
      promiseCandidate: topCandidate.promiseCandidate,
      firstReachableChannel: topCandidate.firstReachableChannel,
      evidenceRefs,
      recommendedNextExperiment: topCandidate.recommendedNextExperiment,
    } : {
      nextStage: null,
      summary: "No validation handoff until a candidate passes discovery scoring.",
    },
  };

  const handoff = {
    protocolVersion: "1.0",
    artifactType: "stage-handoff",
    projectId,
    fromStage: "discover",
    toStage: "validate",
    generatedAt,
    generatedBy: {
      agent: "codex",
      skill: "startup-playbook-artifacts",
      model: options.model ?? "unknown",
    },
    sourceInputs: [
      {
        type: "file",
        path: "playbook/stages/discover/report.json",
      },
    ],
    summary: report.handoffSummary,
  };

  const run = {
    protocolVersion: "1.0",
    artifactType: "discovery-run",
    projectId,
    generatedAt,
    stage: "discover",
    runPath,
    analysis,
    reportSummary: {
      decision,
      score,
      topCandidateId: topCandidate?.id ?? null,
      candidateCount: analysis.candidates?.length ?? 0,
    },
  };

  return {
    input,
    report,
    handoff,
    run,
    markdown: renderDiscoverMarkdown(report),
  };
}

export async function writeDiscoverArtifacts(analysis, options = {}) {
  const playbookDir = options.playbookDir ?? "playbook";
  const generatedAt = options.generatedAt ?? analysis.generatedAt ?? new Date().toISOString();
  const runsDir = path.join(playbookDir, "stages", "discover", "runs");
  await mkdir(runsDir, { recursive: true });
  const existingNames = new Set(await safeReaddir(runsDir));
  const runFileName = buildRunFileName({ generatedAt, slug: analysis.project, existingNames });
  const artifacts = buildDiscoverArtifacts(analysis, { ...options, generatedAt, runFileName });

  await updateEvidenceLedger(playbookDir, artifacts.report, analysis);
  await writeJson(path.join(playbookDir, "stages", "discover", "input.json"), artifacts.input);
  await writeJson(path.join(playbookDir, "stages", "discover", "report.json"), artifacts.report);
  await writeJson(path.join(playbookDir, "stages", "discover", "handoff.json"), artifacts.handoff);
  await writeText(path.join(playbookDir, "stages", "discover", "report.md"), artifacts.markdown);
  await writeJson(path.join(runsDir, runFileName), artifacts.run);

  return {
    ...artifacts,
    runFileName,
    runPath: path.join(runsDir, runFileName),
  };
}

export async function updatePlaybookManifest(playbookDir, report) {
  const manifestPath = path.join(playbookDir, "playbook.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const generatedAt = report.generatedAt;
  const stageOrder = manifest.stageOrder?.includes("discover")
    ? manifest.stageOrder
    : ["discover", ...(manifest.stageOrder ?? ["validate", "business-model", "build", "grow", "operate"])];

  manifest.updatedAt = generatedAt;
  manifest.currentStage = "discover";
  manifest.stageOrder = stageOrder;
  manifest.stages = {
    ...(manifest.stages ?? {}),
    discover: {
      status: report.status,
      decision: report.decision,
      score: report.score,
      updatedAt: generatedAt,
      inputPath: "stages/discover/input.json",
      reportPath: "stages/discover/report.json",
      handoffPath: "stages/discover/handoff.json",
    },
  };
  manifest.latestDecision = {
    stage: "discover",
    decision: report.decision,
    reasoning: report.reasoning,
  };

  await writeJson(manifestPath, manifest);
  return manifest;
}

async function updateEvidenceLedger(playbookDir, report, analysis) {
  const evidencePath = path.join(playbookDir, "evidence.json");
  let ledger;
  try {
    ledger = JSON.parse(await readFile(evidencePath, "utf8"));
  } catch {
    ledger = {
      protocolVersion: "1.0",
      artifactType: "evidence-ledger",
      projectId: report.projectId,
      generatedAt: report.generatedAt,
      updatedAt: report.generatedAt,
      generatedBy: {
        agent: "codex",
        skill: "startup-playbook-artifacts",
        model: report.generatedBy?.model ?? "unknown",
      },
      items: [],
    };
  }

  const existing = new Set((ledger.items ?? []).map((item) => item.id));
  const newItems = [];
  for (const candidate of analysis.topCandidates ?? []) {
    for (const evidence of candidate.evidence ?? []) {
      const id = `ev-discover-${slugify(evidence.id).slice(0, 48)}`;
      if (existing.has(id)) continue;
      existing.add(id);
      newItems.push({
        id,
        sourceType: evidence.sourceType ?? (candidate.type === "case-led" ? "case-pattern" : "community-comment"),
        sourceName: evidence.sourceName ?? "Opportunity radar",
        url: evidence.url ?? null,
        capturedAt: report.generatedAt,
        quote: evidence.excerpt ?? null,
        summary: evidence.title
          ? `${candidate.title}: ${evidence.title}`
          : `${candidate.title}: discovery evidence`,
        actorRole: candidate.targetUser,
        segment: candidate.targetUser,
        stage: "discover",
        supports: ["opportunity-discovery", candidate.type, ...candidate.signalTypes],
        strength: candidate.type === "case-led" ? "medium" : "weak",
        caveats: ["Discovery evidence only; validate direct buyer pain and paid intent before building."],
        privacy: "public-summary-only",
      });
    }
  }

  ledger.projectId = ledger.projectId ?? report.projectId;
  ledger.updatedAt = report.generatedAt;
  ledger.items = [...(ledger.items ?? []), ...newItems];
  await writeJson(evidencePath, ledger);
  return newItems;
}

function renderDiscoverMarkdown(report) {
  const candidates = report.analysis.opportunityBacklog ?? [];
  const lines = [
    "# Opportunity Discovery Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Decision: ${report.decision}`,
    `Score: ${report.score ?? "N/A"}`,
    "",
    "## Reasoning",
    "",
    report.reasoning,
    "",
    "## Top Candidates",
    "",
  ];

  if (!candidates.length) {
    lines.push("- No candidates found.");
  } else {
    for (const candidate of candidates) {
      lines.push(
        `### ${candidate.title}`,
        "",
        `- Type: ${candidate.type}`,
        `- Score: ${candidate.score}`,
        `- Target user: ${candidate.targetUser}`,
        `- Painful situation: ${candidate.painfulSituation}`,
        `- First reachable channel: ${candidate.firstReachableChannel}`,
        `- Recommended next experiment: ${candidate.recommendedNextExperiment}`,
        "",
      );
    }
  }

  lines.push(
    "## Preservation",
    "",
    `- Current run: ${report.analysis.preservation.currentRunPath}`,
    `- Historical runs directory: ${report.analysis.preservation.appendOnlyRunsDir}`,
    `- Policy: ${report.analysis.preservation.overwritePolicy}`,
    "",
  );

  return `${lines.join("\n")}`;
}

function buildKnownFacts(analysis) {
  const facts = [];
  const summary = analysis.signalSummary ?? {};
  facts.push(`${summary.communityItems ?? 0} community items and ${summary.caseItems ?? 0} public cases analyzed.`);
  facts.push(`${summary.painSignals ?? 0} pain signals and ${summary.caseSignals ?? 0} case signals detected.`);
  if (analysis.topCandidates?.[0]) {
    facts.push(`Top candidate: ${analysis.topCandidates[0].title}.`);
  }
  return facts;
}

function buildEvidenceRefs(analysis) {
  const refs = [];
  for (const candidate of analysis.topCandidates ?? []) {
    for (const item of candidate.evidence ?? []) {
      refs.push(`ev-discover-${slugify(item.id).slice(0, 48)}`);
    }
  }
  return [...new Set(refs)];
}

async function safeReaddir(dir) {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function writeText(filePath, text) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}

function slugify(value) {
  return String(value ?? "opportunity-radar")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "opportunity-radar";
}
