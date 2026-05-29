#!/usr/bin/env node
import { access, readdir, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const artifactSkillName = "startup-playbook-artifacts";
const advisorSkillName = "startup-playbook-advisor";

const requiredArtifactFiles = [
  "SKILL.md",
  "references/artifact-protocol.md",
  "templates/playbook.json",
  "templates/evidence.json",
  "templates/stage-input.json",
  "templates/stage-report.json",
  "templates/stage-handoff.json",
  "templates/decision-log-entry.md",
  "templates/evidence.md",
  "templates/stage-report.md",
  "templates/index.html",
];

const stageSkills = [
  ["skills/idea-validation/SKILL.md", "validate"],
  ["skills/business-model-design/SKILL.md", "business-model"],
  ["skills/product-development-loop/SKILL.md", "build"],
  ["skills/seo-aso-growth-research/SKILL.md", "grow"],
];

const jsonTemplates = [
  "templates/playbook.json",
  "templates/evidence.json",
  "templates/stage-input.json",
  "templates/stage-report.json",
  "templates/stage-handoff.json",
];

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath) {
  return readFile(filePath, "utf8");
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

function validateIndexTemplate(html, label, errors) {
  const requiredTokens = [
    "class=\"stage-rail\"",
    "class=\"seg-btn\"",
    "class=\"decision-panel\"",
    "class=\"evidence-board\"",
    "align-items: stretch",
    ".decision-panel .metrics",
    "--font-display",
    "--font-text",
    "--font-mono",
    "--text-body: 17px",
    "--text-large-title: 34px",
    "--text-title-1: 28px",
    "--text-footnote: 13px",
    "--radius-card: 18px",
    "--shadow-control",
    "function gateStatusClass",
    "gate-icon-supported",
    "class=\"risk-next-grid\"",
    "class=\"artifact-nav\"",
    "class=\"status-pill",
    "evidence-data",
    "evidence-card",
    "evidence-metric-stack",
    "pricing-tier-card",
    "keyword-cluster-card",
    "channel-row",
    "function pricingTierCards",
    "function keywordClusterCards",
    "function channelRows",
    "data-stage-tab",
    "id=\"stage-panel\"",
    "role=\"tabpanel\"",
    "aria-selected=\"true\"",
    "function switchStage",
    "function evidenceCards",
    "const stageChartInstances",
    "let overviewChart",
    "function destroyOverviewChart",
    "overviewChart = makeChart",
    "addEventListener('click'",
    "@media (max-width: 760px)",
    "width: min(1180px",
    "-apple-system",
    "#f5f5f7",
    "#0071e3",
    "backdrop-filter",
    "type=\"application/json\" id=\"playbook-data\"",
  ];

  for (const token of requiredTokens) {
    assert(html.includes(token), `${label} missing frontend template token: ${token}`, errors);
  }

  assert(!html.includes("font-family: Inter"), `${label} should not use Inter as the primary font`, errors);
  assert(!/[✅🟡🔴]/u.test(html), `${label} should not use emoji status icons`, errors);
  assert(!html.includes("<table><thead>"), `${label} should not render validation evidence as a wide table`, errors);
  assert(!html.includes("grid-column:span 2"), `${label} should use reusable wide-card classes instead of inline grid spans`, errors);
  assert(!html.includes("body::before"), `${label} should not use the old grid overlay background`, errors);
  assert(!html.includes("radial-gradient"), `${label} should not use the old decorative gradient background`, errors);
  assert(!html.includes("h-screen"), `${label} should not use h-screen`, errors);
  assert(!html.includes("product/app/.playbook-output"), `${label} still references old product output path`, errors);
}

function validateStageReportTemplate(report, label, errors) {
  assert(report.analysis && typeof report.analysis === "object", `${label} missing analysis object`, errors);
  assert(Array.isArray(report.analysis.validationEvidence), `${label} missing analysis.validationEvidence array`, errors);
  assert(report.analysis.minimumEvidenceSet && typeof report.analysis.minimumEvidenceSet === "object", `${label} missing analysis.minimumEvidenceSet`, errors);
}

function validateCurrentValidateReport(report, evidenceLedger, errors) {
  const evidence = report.analysis?.validationEvidence;
  assert(Array.isArray(evidence), "current validate report missing analysis.validationEvidence", errors);
  assert(evidence?.length >= 3, "current validate report should include at least three validation evidence rows", errors);

  const categories = new Set((evidence ?? []).map((item) => item.category));
  for (const category of ["trend", "search", "paid-alternative"]) {
    assert(categories.has(category), `current validate report missing validation evidence category: ${category}`, errors);
  }

  for (const item of evidence ?? []) {
    for (const key of ["id", "category", "sourceName", "sourceType", "capturedAt", "metric", "observedValue", "timeframe", "interpretation", "evidenceRef", "confidence"]) {
      assert(item[key] !== undefined && item[key] !== null && item[key] !== "", `validation evidence ${item.id ?? "(unknown)"} missing ${key}`, errors);
    }
  }

  const ledgerIds = new Set((evidenceLedger?.items ?? []).map((item) => item.id));
  for (const evidenceRef of report.evidenceRefs ?? []) {
    assert(ledgerIds.has(evidenceRef), `validate report evidenceRef not found in ledger: ${evidenceRef}`, errors);
  }
  for (const item of evidence ?? []) {
    assert(ledgerIds.has(item.evidenceRef), `validation evidence row references missing ledger item: ${item.evidenceRef}`, errors);
  }
}

async function listFiles(root, prefix = "") {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, rel));
    } else {
      files.push(rel.replaceAll(path.sep, "/"));
    }
  }
  return files.sort();
}

async function compareDirs(left, right, errors) {
  const leftFiles = await listFiles(left);
  const rightFiles = await listFiles(right);
  assert(JSON.stringify(leftFiles) === JSON.stringify(rightFiles), "plugin artifact skill files differ from canonical skill files", errors);
  for (const rel of leftFiles) {
    const leftText = await readText(path.join(left, rel));
    const rightText = await readText(path.join(right, rel));
    assert(leftText === rightText, `plugin artifact skill copy differs: ${rel}`, errors);
  }
}

async function main() {
  const errors = [];
  const artifactSkillDir = path.join(repoRoot, "skills", artifactSkillName);
  const pluginArtifactSkillDir = path.join(repoRoot, "plugins", advisorSkillName, "skills", artifactSkillName);
  const advisorSkillPath = path.join(repoRoot, "skills", advisorSkillName, "SKILL.md");
  const installScriptPath = path.join(repoRoot, "scripts", "install-startup-advisor.mjs");
  const productDir = path.join(repoRoot, "product");

  assert(!(await exists(productDir)), "product directory should not exist in the artifact-first 1.0 workflow", errors);

  for (const rel of requiredArtifactFiles) {
    assert(await exists(path.join(artifactSkillDir, rel)), `missing artifact skill file: ${rel}`, errors);
  }

  if (await exists(path.join(artifactSkillDir, "SKILL.md"))) {
    const skillMd = await readText(path.join(artifactSkillDir, "SKILL.md"));
    assert(skillMd.startsWith("---\n"), "artifact SKILL.md must start with YAML frontmatter", errors);
    assert(skillMd.includes("name: startup-playbook-artifacts"), "artifact SKILL.md must declare the skill name", errors);
    assert(skillMd.includes("description: Use when"), "artifact SKILL.md description must be invocation-focused", errors);
    for (const token of ["playbook/", "artifact-protocol.md", "evidence.json", "handoff.json", "index.html"]) {
      assert(skillMd.includes(token), `artifact SKILL.md missing ${token}`, errors);
    }
  }

  if (await exists(path.join(artifactSkillDir, "references", "artifact-protocol.md"))) {
    const protocol = await readText(path.join(artifactSkillDir, "references", "artifact-protocol.md"));
    for (const token of [
      "Stage Interface Matrix",
      "Validate Evidence Standard",
      "minimumEvidenceSet",
      "validationEvidence",
      "`validate`",
      "`business-model`",
      "`build`",
      "`grow`",
      "`operate`",
      "analysis.aiNativeCheck",
      "marketRouting",
      "evidence.sourceType",
    ]) {
      assert(protocol.includes(token), `artifact protocol missing ${token}`, errors);
    }
  }

  for (const rel of jsonTemplates) {
    const templatePath = path.join(artifactSkillDir, rel);
    if (await exists(templatePath)) {
      try {
        const parsed = JSON.parse(await readText(templatePath));
        if (rel === "templates/stage-report.json") {
          validateStageReportTemplate(parsed, "stage-report template", errors);
        }
      } catch (error) {
        errors.push(`invalid JSON template ${rel}: ${error.message}`);
      }
    }
  }

  const indexTemplatePath = path.join(artifactSkillDir, "templates", "index.html");
  if (await exists(indexTemplatePath)) {
    validateIndexTemplate(await readText(indexTemplatePath), "artifact index template", errors);
  }

  if (await exists(advisorSkillPath)) {
    const advisor = await readText(advisorSkillPath);
    for (const token of [artifactSkillName, "playbook/stages/{stage}", "input.json", "report.json", "handoff.json"]) {
      assert(advisor.includes(token), `advisor skill missing ${token}`, errors);
    }
    assert(!advisor.includes("product/app/.playbook-output"), "advisor still references old product artifact path", errors);
    assert(!advisor.includes("StageArtifactOutput"), "advisor still references old StageArtifactOutput schema", errors);
  }

  for (const [relPath, stage] of stageSkills) {
    const filePath = path.join(repoRoot, relPath);
    if (await exists(filePath)) {
      const text = await readText(filePath);
      assert(text.includes(artifactSkillName), `${relPath} does not mention ${artifactSkillName}`, errors);
      assert(text.includes(`playbook/stages/${stage}`), `${relPath} does not mention playbook/stages/${stage}`, errors);
      assert(!text.includes("product/app/.playbook-output"), `${relPath} still references old product artifact path`, errors);
    } else {
      errors.push(`missing stage skill: ${relPath}`);
    }
  }

  if (await exists(pluginArtifactSkillDir)) {
    await compareDirs(artifactSkillDir, pluginArtifactSkillDir, errors);
  } else {
    errors.push("plugin is missing startup-playbook-artifacts skill");
  }

  if (await exists(installScriptPath)) {
    const installScript = await readText(installScriptPath);
    assert(installScript.includes(artifactSkillName), "install script does not bundle startup-playbook-artifacts", errors);
  } else {
    errors.push("missing startup advisor install script");
  }

  const currentValidateReportPath = path.join(repoRoot, "playbook", "stages", "validate", "report.json");
  const currentEvidencePath = path.join(repoRoot, "playbook", "evidence.json");
  if (await exists(currentValidateReportPath) && await exists(currentEvidencePath)) {
    try {
      validateCurrentValidateReport(
        JSON.parse(await readText(currentValidateReportPath)),
        JSON.parse(await readText(currentEvidencePath)),
        errors,
      );
    } catch (error) {
      errors.push(`invalid current validate artifacts: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    console.error("Startup artifact validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Startup artifact validation passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
