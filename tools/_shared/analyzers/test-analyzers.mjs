#!/usr/bin/env node

/**
 * Integration tests for the Data Analysis Module.
 */

import { strict as assert } from "node:assert";
import { extractSignals, extractItemSignals, computePainRate, computePaymentRate, groupSignalsByType, PAIN_RULES, DEMAND_RULES, SUPPLY_RULES } from "./signal-extractor.mjs";
import { scoreOpportunity, classifyDecision, rankOpportunities } from "./opportunity-scorer.mjs";
import { fuseSignals } from "./signal-fusion.mjs";
import { generateReport, generateMarkdown } from "./report-generator.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}\n     ${e.message}`); }
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_POSTS = [
  { id: "r1", source: "reddit", community: "SaaS", title: "Invoice tool is too expensive", excerpt: "We manually keep a spreadsheet and need a cheaper alternative. Would pay $20/mo for something better.", score: 45, comments: 12, url: "https://reddit.com/r/SaaS/1" },
  { id: "r2", source: "reddit", community: "SaaS", title: "Best way to automate invoicing?", excerpt: "I spend every Friday copy-pasting from Toggl into Excel. Tedious manual workflow.", score: 30, comments: 8, url: "https://reddit.com/r/SaaS/2" },
  { id: "r3", source: "reddit", community: "startups", title: "Looking for Freshbooks alternative", excerpt: "Freshbooks keeps breaking and the API integration is terrible. Switching from it.", score: 60, comments: 20, url: "https://reddit.com/r/startups/3" },
  { id: "r4", source: "reddit", community: "freelance", title: "How do you handle invoicing?", excerpt: "What do you use for invoicing clients? Need something simple.", score: 15, comments: 5 },
  { id: "r5", source: "reddit", community: "freelance", title: "Weekly freelance tips", excerpt: "Here are some tips for new freelancers.", score: 100, comments: 50 },
  { id: "hn1", source: "hacker-news", community: "Hacker News", title: "Show HN: Open source invoice generator", excerpt: "I built this tool because existing solutions are too expensive. Already at $5k MRR.", score: 200, comments: 80, url: "https://news.ycombinator.com/item?id=1" },
  { id: "hn2", source: "hacker-news", community: "Hacker News", title: "Ask HN: Best invoicing SaaS for freelancers?", excerpt: "Budget around $30/mo, need Stripe integration and recurring invoices.", score: 50, comments: 25 },
  { id: "gh1", source: "github", title: "invoice-ninja/invoiceninja", targetUser: "freelancers", pain: "Manual invoice creation workflow", productShape: "GitHub repo (PHP)", pricing: "stars: 8500, forks: 2400", tags: ["invoice", "freelance"] },
  { id: "gh2", source: "github", title: "crater-invoice/crater", targetUser: "small businesses", pain: "Expensive invoicing software", productShape: "GitHub repo (Vue)", pricing: "stars: 7800, forks: 1900", tags: ["invoice", "billing"] },
  { id: "ph1", source: "product-hunt", title: "InvoiceBot", targetUser: "Product Hunt early adopters", pain: "Auto-generate invoices from time tracking", productShape: "SaaS with Stripe integration, $15/mo subscription", comments: 12 },
  { id: "gac1", source: "google-autocomplete", type: "suggestion", query: "invoice tool for freelancers" },
  { id: "gac2", source: "google-autocomplete", type: "suggestion", query: "best invoicing software" },
  { id: "gac3", source: "google-autocomplete", type: "suggestion", query: "free invoice generator" },
];

/* ------------------------------------------------------------------ */
/*  Signal Extractor Tests                                             */
/* ------------------------------------------------------------------ */

console.log("\n🧪 Data Analysis Module — Integration Tests\n");
console.log("── Signal Extractor ──");

test("extractSignals returns signals and summary", () => {
  const result = extractSignals(MOCK_POSTS);
  assert.ok(result.signals.length > 0);
  assert.ok(result.summary);
  assert.ok(result.summary.totalItems > 0);
  assert.ok(result.summary.totalSignals > 0);
});

test("detects pain signals correctly", () => {
  const result = extractSignals(MOCK_POSTS);
  const painSignals = result.signals.filter((s) => s.category === "pain");
  assert.ok(painSignals.length >= 4, `Expected ≥4 pain signals, got ${painSignals.length}`);

  const types = new Set(painSignals.map((s) => s.type));
  assert.ok(types.has("pricing-pain"), "Should detect pricing pain");
  assert.ok(types.has("manual-workflow"), "Should detect manual workflow");
  assert.ok(types.has("alternative-seeking"), "Should detect alternative seeking");
});

test("detects demand signals correctly", () => {
  const result = extractSignals(MOCK_POSTS);
  const demandSignals = result.signals.filter((s) => s.category === "demand");
  assert.ok(demandSignals.length >= 2, `Expected ≥2 demand signals, got ${demandSignals.length}`);

  const types = new Set(demandSignals.map((s) => s.type));
  assert.ok(types.has("purchase-intent"), "Should detect purchase intent");
});

test("detects supply signals correctly", () => {
  const result = extractSignals(MOCK_POSTS);
  const supplySignals = result.signals.filter((s) => s.category === "supply");
  assert.ok(supplySignals.length >= 2, `Expected ≥2 supply signals, got ${supplySignals.length}`);
});

test("extractItemSignals works for single item", () => {
  const signals = extractItemSignals(MOCK_POSTS[0]);
  assert.ok(signals.length >= 2, "Should detect multiple signals in first post");
  assert.ok(signals.some((s) => s.type === "pricing-pain"));
  assert.ok(signals.some((s) => s.type === "purchase-intent"));
});

test("computePainRate is correct", () => {
  const rate = computePainRate(MOCK_POSTS);
  assert.ok(rate.painRate > 0, "Pain rate should be > 0");
  assert.ok(rate.painRate <= 1, "Pain rate should be ≤ 1");
  assert.ok(rate.painCount > 0);
  assert.equal(rate.total, MOCK_POSTS.length);
});

test("computePaymentRate is correct", () => {
  const rate = computePaymentRate(MOCK_POSTS);
  assert.ok(rate.paymentRate > 0, "Payment rate should be > 0");
  assert.ok(rate.paymentCount >= 2, "Should find ≥2 payment signals");
});

test("groupSignalsByType produces ranked groups", () => {
  const { signals } = extractSignals(MOCK_POSTS);
  const groups = groupSignalsByType(signals);
  assert.ok(groups.length > 0);
  assert.ok(groups[0].heat >= groups[groups.length - 1].heat, "Should be sorted by heat");
  assert.ok(groups[0].count > 0);
  assert.ok(groups[0].examples.length > 0);
});

test("summary includes source and community info", () => {
  const { summary } = extractSignals(MOCK_POSTS);
  assert.ok(summary.sources.length >= 2, "Should have ≥2 sources");
  assert.ok(summary.sources.includes("reddit"));
  assert.ok(summary.sources.includes("hacker-news"));
  assert.ok(summary.communities.length >= 2);
});

test("signal rules have correct structure", () => {
  for (const rule of [...PAIN_RULES, ...DEMAND_RULES, ...SUPPLY_RULES]) {
    assert.ok(rule.type, "Rule must have type");
    assert.ok(rule.pattern instanceof RegExp, "Rule must have pattern");
    assert.ok(typeof rule.weight === "number", "Rule must have weight");
  }
});

/* ------------------------------------------------------------------ */
/*  Opportunity Scorer Tests                                           */
/* ------------------------------------------------------------------ */

console.log("\n── Opportunity Scorer ──");

test("scoreOpportunity returns all dimensions", () => {
  const { summary } = extractSignals(MOCK_POSTS);
  const score = scoreOpportunity(summary);
  assert.ok(typeof score.painHeat === "number");
  assert.ok(typeof score.caseProof === "number");
  assert.ok(typeof score.demandTrend === "number");
  assert.ok(typeof score.channelReach === "number");
  assert.ok(typeof score.feasibility === "number");
  assert.ok(typeof score.total === "number");
  assert.ok(score.total >= 0 && score.total <= 100);
});

test("scoreOpportunity respects dimension caps", () => {
  const score = scoreOpportunity({
    pain: { painRate: 1.0, count: 100, uniqueTypes: 20, paymentRate: 1.0 },
    demand: { count: 100, uniqueTypes: 10, paymentRate: 1.0, topSignals: [] },
    supply: { count: 100, uniqueTypes: 10, topSignals: [] },
  });
  assert.ok(score.painHeat <= 40, `painHeat should be ≤40, got ${score.painHeat}`);
  assert.ok(score.caseProof <= 25);
  assert.ok(score.demandTrend <= 15);
  assert.ok(score.channelReach <= 10);
  assert.ok(score.feasibility <= 10);
  assert.ok(score.total <= 100);
});

test("scoreOpportunity handles empty input", () => {
  const score = scoreOpportunity({});
  assert.ok(score.total >= 0);
  assert.ok(score.painHeat === 0);
});

test("scoreOpportunity includes breakdown descriptions", () => {
  const { summary } = extractSignals(MOCK_POSTS);
  const score = scoreOpportunity(summary);
  assert.ok(score.breakdown);
  assert.ok(score.breakdown.painHeat.description);
  assert.ok(typeof score.breakdown.painHeat.max === "number");
});

test("classifyDecision returns continue for high scores", () => {
  assert.equal(classifyDecision(75).decision, "continue");
  assert.equal(classifyDecision(65).decision, "continue");
});

test("classifyDecision returns pivot for medium scores", () => {
  assert.equal(classifyDecision(55).decision, "pivot");
  assert.equal(classifyDecision(40).decision, "pivot");
});

test("classifyDecision returns kill for low scores", () => {
  assert.equal(classifyDecision(30).decision, "kill");
  assert.equal(classifyDecision(0).decision, "kill");
});

test("rankOpportunities sorts and adds rank + decision", () => {
  const opps = [
    { id: "a", score: { total: 30 } },
    { id: "b", score: { total: 70 } },
    { id: "c", score: { total: 50 } },
  ];
  const ranked = rankOpportunities(opps);
  assert.equal(ranked[0].id, "b");
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].decision.decision, "continue");
  assert.equal(ranked[2].id, "a");
  assert.equal(ranked[2].rank, 3);
  assert.equal(ranked[2].decision.decision, "kill");
});

/* ------------------------------------------------------------------ */
/*  Signal Fusion Tests                                                */
/* ------------------------------------------------------------------ */

console.log("\n── Signal Fusion ──");

test("fuseSignals produces opportunities and cross-validation", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);

  assert.ok(fusion.generatedAt);
  assert.ok(fusion.inputStats);
  assert.ok(Array.isArray(fusion.opportunities));
  assert.ok(fusion.crossValidation);
  assert.ok(fusion.overallConfidence);
  assert.ok(Array.isArray(fusion.gaps));
});

test("fuseSignals creates themed opportunity clusters", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);

  if (fusion.opportunities.length > 0) {
    const topOpp = fusion.opportunities[0];
    assert.ok(topOpp.theme);
    assert.ok(topOpp.score);
    assert.ok(topOpp.decision);
    assert.ok(topOpp.signalTypes.length > 0);
    assert.ok(topOpp.sources.length > 0);
  }
});

test("fuseSignals cross-validation detects pain", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);
  assert.ok(fusion.crossValidation.painConfirmed, "Pain should be confirmed");
});

test("fuseSignals identifies evidence gaps", () => {
  // With our mock data we have good coverage, so test with minimal data
  const minimalItems = [{ id: "x1", source: "reddit", title: "hello world", score: 1, comments: 0 }];
  const extracted = extractSignals(minimalItems);
  const fusion = fuseSignals(extracted, minimalItems);
  assert.ok(fusion.gaps.length > 0, "Should identify gaps with minimal data");
});

test("fuseSignals overall confidence reflects data quality", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);
  assert.ok(["high", "medium", "low"].includes(fusion.overallConfidence.level));
  assert.ok(typeof fusion.overallConfidence.score === "number");
});

/* ------------------------------------------------------------------ */
/*  Report Generator Tests                                             */
/* ------------------------------------------------------------------ */

console.log("\n── Report Generator ──");

test("generateReport produces valid structure", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);
  const report = generateReport(fusion, { projectId: "test-project", query: "invoice tool" });

  assert.equal(report.protocolVersion, "1.0");
  assert.equal(report.artifactType, "analysis-report");
  assert.equal(report.projectId, "test-project");
  assert.equal(report.query, "invoice tool");
  assert.ok(report.generatedAt);
  assert.ok(typeof report.score === "number");
  assert.ok(["continue", "pivot", "kill"].includes(report.decision));
  assert.ok(Array.isArray(report.opportunities));
  assert.ok(report.crossValidation);
  assert.ok(report.confidence);
  assert.ok(Array.isArray(report.nextSteps));
  assert.ok(report.nextSteps.length > 0);
});

test("generateMarkdown produces readable output", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);
  const report = generateReport(fusion);
  const markdown = generateMarkdown(report);

  assert.ok(markdown.includes("# 📊 Startup Opportunity Analysis Report"));
  assert.ok(markdown.includes("Score:"));
  assert.ok(markdown.includes("Data Coverage"));
  assert.ok(markdown.includes("Opportunities"));
  assert.ok(markdown.includes("Cross-Validation"));
  assert.ok(markdown.includes("Next Steps"));
  assert.ok(markdown.length > 500, "Report should be substantial");
});

test("generateMarkdown includes evidence gaps section when gaps exist", () => {
  const minimalItems = [{ id: "x1", source: "reddit", title: "test post", score: 1, comments: 0 }];
  const extracted = extractSignals(minimalItems);
  const fusion = fuseSignals(extracted, minimalItems);
  const report = generateReport(fusion);
  const markdown = generateMarkdown(report);
  assert.ok(markdown.includes("Evidence Gaps") || report.gaps.length === 0);
});

test("report opportunities are ranked by score", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);
  const report = generateReport(fusion);

  for (let i = 1; i < report.opportunities.length; i++) {
    assert.ok(
      report.opportunities[i - 1].score.total >= report.opportunities[i].score.total,
      "Opportunities should be sorted by score descending"
    );
  }
});

/* ------------------------------------------------------------------ */
/*  End-to-End Pipeline Test                                           */
/* ------------------------------------------------------------------ */

console.log("\n── End-to-End Pipeline ──");

test("full pipeline: extract → fuse → report → markdown", () => {
  const extracted = extractSignals(MOCK_POSTS);
  const fusion = fuseSignals(extracted, MOCK_POSTS);
  const report = generateReport(fusion, { projectId: "e2e-test", query: "invoice" });
  const markdown = generateMarkdown(report);

  // Verify complete pipeline
  assert.ok(extracted.signals.length > 0, "Should extract signals");
  assert.ok(fusion.opportunities.length > 0 || fusion.gaps.length > 0, "Should have opportunities or gaps");
  assert.ok(report.score >= 0, "Should have a score");
  assert.ok(markdown.length > 200, "Should generate markdown");
  assert.ok(report.nextSteps.length > 0, "Should recommend next steps");
});

/* ------------------------------------------------------------------ */
/*  Summary                                                            */
/* ------------------------------------------------------------------ */

console.log("\n" + "─".repeat(50));
console.log(`\n  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);

if (failed > 0) process.exit(1);
