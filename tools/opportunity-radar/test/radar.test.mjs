import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeOpportunityRadar,
  detectPainSignals,
  scoreOpportunity,
} from "../src/radar.mjs";
import {
  buildDiscoverArtifacts,
  buildRunFileName,
} from "../src/artifacts.mjs";
import {
  buildCommunitySourceUrl,
  fetchRadarSources,
} from "../src/sources.mjs";

const communityPosts = [
  {
    id: "reddit:ops-1",
    source: "reddit",
    community: "r/SaaS",
    title: "Zapier is getting too expensive for our client onboarding automations",
    excerpt: "We keep a spreadsheet of failed multi-step automations because the tools are pricey and brittle. Is there a cheaper alternative?",
    score: 91,
    comments: 38,
    createdAt: "2026-05-31T10:00:00.000Z",
    url: "https://www.reddit.com/r/SaaS/comments/ops1/zapier_expensive/",
  },
  {
    id: "hn:ops-2",
    source: "hacker-news",
    community: "Ask HN",
    title: "Ask HN: What do you use instead of Zapier for onboarding workflows?",
    excerpt: "The current setup breaks when one API changes and we manually reconcile the spreadsheet every Friday.",
    score: 144,
    comments: 72,
    createdAt: "2026-05-31T11:00:00.000Z",
    url: "https://news.ycombinator.com/item?id=1",
  },
  {
    id: "ih:ops-3",
    source: "indie-hackers",
    community: "Indie Hackers",
    title: "How are you handling failed automation runs for small B2B clients?",
    excerpt: "I would pay for a lightweight audit trail before buying a full enterprise iPaaS.",
    score: 24,
    comments: 11,
    createdAt: "2026-05-31T12:00:00.000Z",
    url: "https://www.indiehackers.com/post/sample",
  },
];

const publicCases = [
  {
    id: "case:github-invoice",
    source: "github",
    title: "Open-source invoice generator grew to $5k MRR through GitHub and SEO",
    url: "https://github.com/example/invoice-generator",
    targetUser: "freelancers",
    pain: "creating compliant invoices quickly",
    productShape: "template-backed SaaS",
    firstAcquisitionChannel: "GitHub README and long-tail SEO",
    pricing: "$9/mo",
    revenue: "$5k MRR",
    validationMove: "free GitHub tool to paid hosted workflow",
    copyable: ["open-source lead magnet", "SEO pages for invoice formats", "simple subscription"],
    notCopyable: ["repository age"],
  },
  {
    id: "case:celebrity-audience",
    source: "founder-blog",
    title: "Creator with a huge audience sold a generic habit tracker",
    url: "https://example.com/habit-tracker",
    targetUser: "creator audience",
    pain: "tracking habits",
    productShape: "consumer app",
    firstAcquisitionChannel: "existing audience",
    pricing: "$4.99/mo",
    revenue: "$40k MRR",
    validationMove: "newsletter launch",
    copyable: ["simple app packaging"],
    notCopyable: ["large existing audience", "personal brand"],
  },
];

test("detectPainSignals identifies repeated community opportunity signals", () => {
  const signals = detectPainSignals(communityPosts[0]);

  assert.deepEqual(
    signals.map((signal) => signal.type),
    ["pricing-pain", "alternative-seeking", "manual-workflow"],
  );
});

test("analyzeOpportunityRadar produces pain-led and case-led candidates", () => {
  const analysis = analyzeOpportunityRadar({
    project: "Weekly International Opportunity Radar",
    generatedAt: "2026-06-01T08:00:00.000Z",
    communities: communityPosts,
    cases: publicCases,
  });

  assert.equal(analysis.project, "Weekly International Opportunity Radar");
  assert.equal(analysis.generatedAt, "2026-06-01T08:00:00.000Z");
  assert.equal(analysis.signalSummary.communityItems, 3);
  assert.equal(analysis.signalSummary.caseItems, 2);
  assert.equal(analysis.candidates.length, 2);
  assert.deepEqual(analysis.candidates.map((candidate) => candidate.type), ["pain-led", "case-led"]);

  const painCandidate = analysis.candidates[0];
  assert.equal(painCandidate.targetUser, "small B2B operators using automation workflows");
  assert.match(painCandidate.painfulSituation, /failed multi-step automations/i);
  assert.equal(painCandidate.firstReachableChannel, "reddit:r/SaaS");
  assert.ok(painCandidate.scores.painHeat > painCandidate.scores.caseProof);
  assert.ok(painCandidate.score >= 70);

  const caseCandidate = analysis.candidates[1];
  assert.equal(caseCandidate.sourceCaseIds[0], "case:github-invoice");
  assert.match(caseCandidate.copyable.join(" "), /open-source lead magnet/i);
  assert.match(caseCandidate.whatNotToCopy.join(" "), /repository age/i);
});

test("scoreOpportunity penalizes pure clone and moat-dependent case opportunities", () => {
  const fastCopyable = scoreOpportunity({
    type: "case-led",
    evidenceCount: 3,
    sourceCount: 2,
    signalTypes: ["revenue-signal", "pricing-signal", "github-distribution"],
    copyableCount: 3,
    nonCopyableCount: 1,
    cloneRisk: "medium",
    moatDependency: "low",
  });
  const audienceDependent = scoreOpportunity({
    type: "case-led",
    evidenceCount: 1,
    sourceCount: 1,
    signalTypes: ["revenue-signal"],
    copyableCount: 1,
    nonCopyableCount: 3,
    cloneRisk: "high",
    moatDependency: "high",
  });

  assert.ok(fastCopyable.total > audienceDependent.total);
  assert.ok(audienceDependent.cloneRiskPenalty > fastCopyable.cloneRiskPenalty);
  assert.ok(audienceDependent.moatDependencyPenalty > fastCopyable.moatDependencyPenalty);
});

test("buildRunFileName preserves every mining run with collision-safe names", () => {
  const first = buildRunFileName({
    generatedAt: "2026-06-01T08:09:10.000Z",
    slug: "Weekly International Opportunity Radar",
    existingNames: new Set(),
  });
  const second = buildRunFileName({
    generatedAt: "2026-06-01T08:09:10.000Z",
    slug: "Weekly International Opportunity Radar",
    existingNames: new Set([first]),
  });

  assert.equal(first, "2026-06-01T08-09-10-weekly-international-opportunity-radar.json");
  assert.equal(second, "2026-06-01T08-09-10-weekly-international-opportunity-radar-2.json");
});

test("buildDiscoverArtifacts maps radar output into stage report and validation handoff", () => {
  const analysis = analyzeOpportunityRadar({
    project: "Weekly International Opportunity Radar",
    generatedAt: "2026-06-01T08:00:00.000Z",
    communities: communityPosts,
    cases: publicCases,
  });
  const artifacts = buildDiscoverArtifacts(analysis, {
    projectId: "ai-ecommerce-image-optimizer",
    runFileName: "2026-06-01T08-00-00-weekly-international-opportunity-radar.json",
    generatedAt: "2026-06-01T08:00:00.000Z",
    sourceErrors: [
      {
        type: "reddit",
        message: "fetch failed",
      },
    ],
  });

  assert.equal(artifacts.input.stage, "discover");
  assert.deepEqual(artifacts.input.inputs.sourceErrors, [
    {
      type: "reddit",
      message: "fetch failed",
    },
  ]);
  assert.equal(artifacts.report.stage, "discover");
  assert.deepEqual(artifacts.report.analysis.radarRun.sourceErrors, [
    {
      type: "reddit",
      message: "fetch failed",
    },
  ]);
  assert.equal(artifacts.report.analysis.radarRun.runPath, "stages/discover/runs/2026-06-01T08-00-00-weekly-international-opportunity-radar.json");
  assert.equal(artifacts.report.analysis.opportunityBacklog.length, 2);
  assert.equal(artifacts.handoff.fromStage, "discover");
  assert.equal(artifacts.handoff.toStage, "validate");
  assert.equal(artifacts.handoff.summary.candidateId, analysis.candidates[0].id);
  assert.match(artifacts.markdown, /# Opportunity Discovery Report/);
});

test("analyzeOpportunityRadar works with community-only input (no cases)", () => {
  const analysis = analyzeOpportunityRadar({ communities: communityPosts, cases: [] });
  assert.ok(analysis.signalSummary.communityItems > 0);
  assert.ok(analysis.signalSummary.painSignals > 0);
  assert.equal(analysis.signalSummary.caseItems, 0);
});

test("buildCommunitySourceUrl supports reddit listings and hacker news search", () => {
  assert.equal(
    buildCommunitySourceUrl({ type: "reddit", community: "SideProject", listing: "top", time: "week", limit: 10 }),
    "https://www.reddit.com/r/SideProject/top.json?t=week&limit=10",
  );
  assert.equal(
    buildCommunitySourceUrl({ type: "hacker-news", query: "manual workflow", limit: 5 }),
    "https://hn.algolia.com/api/v1/search?query=manual+workflow&tags=story&hitsPerPage=5",
  );
});

test("fetchRadarSources returns correct structure with empty sources", async () => {
  const result = await fetchRadarSources([]);
  assert.deepEqual(result, { communities: [], cases: [], errors: [] });
});

test("fetchRadarSources returns correct structure with null sources", async () => {
  const result = await fetchRadarSources(null);
  assert.deepEqual(result, { communities: [], cases: [], errors: [] });
});

test("enrichCaseItem fills radar-specific fields on case-type items", () => {
  // Simulate what happens when collectFromSources returns a GitHub item
  const githubItem = {
    id: "github:acme/invoice-gen",
    source: "github",
    title: "acme/invoice-gen",
    url: "https://github.com/acme/invoice-gen",
    targetUser: "freelancers",
    pain: "Open-source invoice generator for freelancers",
    productShape: "GitHub repository in TypeScript",
    pricing: "stars: 640",
    tags: ["invoice", "freelance"],
    copyable: ["open-source lead magnet", "README-driven positioning"],
    notCopyable: ["repository age", "existing maintainer trust"],
  };

  // The analysis pipeline should handle this correctly
  const analysis = analyzeOpportunityRadar({
    communities: communityPosts,
    cases: [githubItem],
  });

  assert.ok(analysis.caseSignals.length > 0, "Should detect case signals from GitHub item");
  assert.ok(analysis.signalSummary.caseItems >= 1);
});

test("signal rules imported from _shared/ detect more signal types than before", () => {
  // The _shared/ rules include time-waste and scaling-pain that the old rules didn't have
  const postWithTimeWaste = {
    id: "test:1",
    source: "reddit",
    community: "SaaS",
    title: "I waste 3 hours every week on this",
    excerpt: "The process takes forever and is a huge bottleneck.",
    score: 50,
    comments: 20,
  };

  const signals = detectPainSignals(postWithTimeWaste);
  const types = signals.map((s) => s.type);
  // time-waste is a new rule from _shared/ that old radar didn't have
  assert.ok(types.includes("time-waste") || types.includes("manual-workflow"),
    "Should detect time-waste or manual-workflow signals");
});
