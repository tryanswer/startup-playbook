import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildPlaybookDashboardData,
  renderPlaybookIndex,
} from "../render-playbook-index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

test("buildPlaybookDashboardData includes discover stage from artifacts", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "playbook-render-"));
  try {
    await writeJson(path.join(tmp, "playbook.json"), {
      projectId: "radar-test",
      currentStage: "discover",
      stageOrder: ["discover", "validate", "business-model", "build", "grow", "operate"],
      project: {
        name: "Radar Test",
        oneLine: "Mine public signals into startup opportunities.",
      },
      stages: {
        discover: {
          status: "completed",
          decision: "continue",
          score: 76,
        },
      },
    });
    await writeJson(path.join(tmp, "evidence.json"), {
      items: [
        { id: "ev-community-001", summary: "Community pain evidence", sourceName: "Reddit" },
      ],
    });
    await writeJson(path.join(tmp, "stages/discover/report.json"), {
      stage: "discover",
      status: "completed",
      decision: "continue",
      nextStageAction: "advance",
      score: 76,
      reasoning: "Two candidate opportunities are ready for validation.",
      known: ["Repeated automation workflow complaints found."],
      assumed: ["Small B2B operators can be reached in communities."],
      toValidate: ["Will users pay for a lightweight audit trail?"],
      evidenceRefs: ["ev-community-001"],
      concerns: ["Public posts do not prove paid demand."],
      nextSteps: ["Validate the top pain-led candidate with direct replies."],
      analysis: {
        radarRun: {
          runPath: "stages/discover/runs/2026-06-01T08-00-00-weekly-radar.json",
          generatedAt: "2026-06-01T08:00:00.000Z",
          candidateCount: 2,
          sourceCoverage: {
            communities: [
              { source: "hacker-news:Hacker News", count: 3 },
            ],
            cases: [
              { source: "github", count: 1 },
              { source: "product-hunt", count: 1 },
            ],
          },
          sourceErrors: [
            { type: "reddit", message: "fetch failed" },
          ],
        },
        signalSummary: {
          communityItems: 3,
          caseItems: 2,
          painSignals: 8,
          caseSignals: 5,
        },
        opportunityBacklog: [
          {
            id: "opp-automation-audit",
            type: "pain-led",
            title: "Automation failure audit trail for small B2B onboarding workflows",
            score: 76,
            targetUser: "small B2B operators using automation workflows",
            painfulSituation: "failed multi-step automations create brittle onboarding workflows and manual spreadsheet reconciliation",
            promiseCandidate: "A lightweight audit trail that flags failed automation runs and turns them into a manual recovery queue.",
            firstReachableChannel: "reddit:r/SaaS",
            signalTypes: ["pricing-pain", "manual-workflow"],
            recommendedNextExperiment: "Reply to 10 operators and offer a paid manual audit.",
            evidence: [
              {
                id: "hn-1",
                sourceType: "community-comment",
                sourceName: "hacker-news:Hacker News",
                title: "Show HN: Workflow failure logs",
                url: "https://news.ycombinator.com/item?id=1",
                excerpt: "Operators describe failed automations and spreadsheet cleanup.",
                metric: "42 comments / 120 score",
              },
            ],
          },
        ],
        topCandidates: [
          {
            id: "opp-automation-audit",
            type: "pain-led",
            title: "Automation failure audit trail for small B2B onboarding workflows",
            score: 76,
            targetUser: "small B2B operators using automation workflows",
            painfulSituation: "failed multi-step automations create brittle onboarding workflows and manual spreadsheet reconciliation",
            promiseCandidate: "A lightweight audit trail that flags failed automation runs and turns them into a manual recovery queue.",
            firstReachableChannel: "reddit:r/SaaS",
            signalTypes: ["pricing-pain", "manual-workflow"],
            recommendedNextExperiment: "Reply to 10 operators and offer a paid manual audit.",
            evidence: [
              {
                id: "hn-1",
                sourceType: "community-comment",
                sourceName: "hacker-news:Hacker News",
                title: "Show HN: Workflow failure logs",
                url: "https://news.ycombinator.com/item?id=1",
                excerpt: "Operators describe failed automations and spreadsheet cleanup.",
                metric: "42 comments / 120 score",
              },
            ],
          },
        ],
        communitySignals: [
          {
            type: "manual-workflow",
            label: "Manual workflow",
            sourceId: "hacker-news:1",
            sourceName: "hacker-news:Hacker News",
            url: "https://news.ycombinator.com/item?id=1",
            excerpt: "Operators describe failed automations and spreadsheet cleanup.",
          },
        ],
        caseSignals: [
          {
            case: {
              id: "github:al1abb/invoify",
              source: "github",
              title: "al1abb/invoify",
              url: "https://github.com/al1abb/invoify",
              targetUser: "GitHub users searching for this workflow",
              pain: "An invoice generator app built using Next.js.",
              productShape: "GitHub repository in TypeScript",
              firstAcquisitionChannel: "GitHub search / open-source distribution",
              pricing: "stars: 6300",
              validationMove: "Audit issues, README positioning, stars, forks, and adjacent search demand before copying the wedge.",
              copyable: ["open-source lead magnet", "README-driven positioning"],
              notCopyable: ["repository age", "existing maintainer trust"],
            },
            signalTypes: ["github-distribution", "seo-channel"],
            score: { total: 67 },
            cloneRisk: "medium",
            moatDependency: "medium",
          },
          {
            case: {
              id: "product-hunt:1156590",
              source: "product-hunt",
              title: "Mina Meeting Assistant",
              url: "https://www.producthunt.com/products/mina-meeting-assistant",
              targetUser: "Product Hunt launch audience",
              pain: "Your AI teammate responds and executes during your calls.",
              productShape: "Product Hunt launch",
              firstAcquisitionChannel: "Product Hunt",
              pricing: "upvotes: 387",
              validationMove: "Inspect comments, makers, website CTA, and launch positioning before adapting the wedge.",
              copyable: ["launch positioning", "tagline framing"],
              notCopyable: ["launch timing", "maker audience"],
            },
            signalTypes: [],
            score: { total: 39 },
            cloneRisk: "medium",
            moatDependency: "medium",
          },
        ],
      },
    });

    const data = await buildPlaybookDashboardData(tmp);

    assert.equal(data.projectId, "radar-test");
    assert.deepEqual(data.stageOrder, ["discover", "validate", "business-model", "build", "grow", "operate"]);
    assert.equal(data.currentStage, "discover");
    assert.equal(data.stages.discover.label, "Discover");
    assert.equal(data.stages.discover.labelZh, "发现");
    assert.equal(data.stages.discover.titleZh, "机会雷达");
    assert.match(data.stages.discover.summaryZh, /排名第一/);
    assert.equal(data.stages.discover.candidates.length, 1);
    assert.equal(data.stages.discover.candidates[0].titleZh, "小型 B2B 客户导入工作流的自动化失败审计记录");
    assert.deepEqual(data.stages.discover.candidates[0].signalTypesZh, ["定价痛点", "手动流程"]);
    assert.equal(data.stages.discover.signalSummary.communityItems, 3);
    assert.equal(data.stages.discover.runSummary.communityItems, 3);
    assert.equal(data.stages.discover.runSummary.sourceErrorCount, 1);
    assert.equal(data.stages.discover.sourceErrors[0].type, "reddit");
    assert.equal(data.stages.discover.evidenceMatrix[0].sourceName, "hacker-news:Hacker News");
    assert.equal(data.stages.discover.caseLibrary.github[0].title, "al1abb/invoify");
    assert.equal(data.stages.discover.caseLibrary.productHunt[0].title, "Mina Meeting Assistant");
    assert.equal(data.stages.discover.validationPlan.length, 7);
    assert.equal(data.stages.discover.validationPlan[0].day, 1);
    assert.equal(data.stages.discover.candidateBrief.title, "Automation failure audit trail for small B2B onboarding workflows");
    assert.match(data.stages.discover.candidateBrief.promiseZh, /审计记录|audit trail/);
    assert.equal(data.stages.discover.replicationBrief.github.copyable[0], "open-source lead magnet");
    assert.match(data.stages.discover.outreachScripts.publicReplyZh, /人工审计|manual audit/);
    assert.equal(data.stages.discover.decisionGate.continue.minQualifiedReplies, 3);
    assert.match(data.stages.discover.decisionGate.pauseZh[0], /暂停|Pause/);
    assert.equal(data.stages.discover.validationTracker.outreachRows.length, 10);
    assert.equal(data.stages.discover.validationTracker.outreachRows[0].status, "not-started");
    assert.match(data.stages.discover.validationTracker.buyerEvidenceChecklist[0].labelZh, /买家|证据|痛点/);
    assert.equal(data.stages.discover.validationTracker.interviewScorecard.criteria.length, 6);
    assert.match(data.stages.discover.validationTracker.decisionMemo.sections[0].labelZh, /假设|机会/);
    assert.match(data.stages.validate.workflowWorkbench.titleZh, /验证实验工作台/);
    assert.equal(data.stages.validate.workflowWorkbench.sections.length, 4);
    assert.match(data.stages.validate.workflowWorkbench.sections[1].titleZh, /付费|访谈|实验/);
    assert.match(data.stages["business-model"].workflowWorkbench.titleZh, /商业模式工作台/);
    assert.match(data.stages["business-model"].workflowWorkbench.sections[1].titleZh, /定价|毛利/);
    assert.match(data.stages.build.workflowWorkbench.titleZh, /构建工作台/);
    assert.match(data.stages.build.workflowWorkbench.sections[2].titleZh, /质量|验收|风险/);
    assert.match(data.stages.grow.workflowWorkbench.titleZh, /增长工作台/);
    assert.match(data.stages.grow.workflowWorkbench.sections[1].titleZh, /渠道|触达/);
    assert.equal(data.stages.grow.seoCompetitiveAnalysis.competitors.length, 4);
    assert.match(data.stages.grow.seoCompetitiveAnalysis.competitors[0].name, /Pixc|Cheeppy|ProductMagic|Prodshot/);
    assert.match(data.stages.grow.seoCompetitiveAnalysis.differentiationMatrix[0].dimensionZh, /切入|差异|定位/);
    assert.ok(data.stages.grow.seoCompetitiveAnalysis.longTailKeywords.length >= 12);
    assert.match(data.stages.grow.seoCompetitiveAnalysis.longTailKeywords[0].queryZh, /Amazon|商品图|图片|合规/);
    assert.ok(data.stages.grow.workflowWorkbench.sections.some((section) => /竞品|长尾/.test(section.titleZh)));
    assert.match(data.stages.operate.workflowWorkbench.titleZh, /运营工作台/);
    assert.match(data.stages.operate.workflowWorkbench.sections[3].titleZh, /决策|复盘|门槛/);
    assert.match(data.stages.discover.links[0][1], /stages\/discover\/report\.md/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("renderPlaybookIndex embeds discover data without replacing the template shell", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "playbook-render-"));
  try {
    await writeJson(path.join(tmp, "playbook.json"), {
      projectId: "radar-test",
      currentStage: "discover",
      stageOrder: ["discover", "validate", "business-model", "build", "grow", "operate"],
      project: {
        name: "Radar Test",
        oneLine: "Mine public signals into startup opportunities.",
      },
      stages: {
        discover: { status: "completed", decision: "continue", score: 76 },
      },
    });
    await writeJson(path.join(tmp, "evidence.json"), {
      items: [
        {
          id: "ev-price",
          sourceName: "Pricing Page",
          summary: "Published price is $20 for 10 units and $100 for 50 units.",
        },
      ],
    });
    await writeJson(path.join(tmp, "stages/discover/report.json"), {
      stage: "discover",
      status: "completed",
      decision: "continue",
      nextStageAction: "advance",
      score: 76,
      reasoning: "A top candidate is ready for validation.",
      known: [],
      assumed: [],
      toValidate: [],
      evidenceRefs: ["ev-price"],
      concerns: [],
      nextSteps: ["Validate the top candidate."],
      analysis: {
        signalSummary: { communityItems: 3, caseItems: 1, painSignals: 6, caseSignals: 3 },
        opportunityBacklog: [
          {
            id: "opp-1",
            type: "pain-led",
            title: "Workflow failure audit trail",
            score: 76,
            targetUser: "small B2B operators",
            painfulSituation: "failed automations create manual reconciliation work",
            promiseCandidate: "A lightweight audit trail for broken workflow runs.",
            firstReachableChannel: "reddit:r/SaaS",
            signalTypes: ["manual-workflow"],
            recommendedNextExperiment: "Reply to 10 operators and offer a paid manual audit.",
            evidence: [
              {
                id: "hn-1",
                sourceType: "community-comment",
                sourceName: "hacker-news:Hacker News",
                title: "Show HN: Workflow failure logs",
                url: "https://news.ycombinator.com/item?id=1",
                excerpt: "Operators describe failed automations and spreadsheet cleanup.",
                metric: "42 comments / 120 score",
              },
            ],
          },
        ],
        topCandidates: [
          {
            id: "opp-1",
            type: "pain-led",
            title: "Workflow failure audit trail",
            score: 76,
            targetUser: "small B2B operators",
            painfulSituation: "failed automations create manual reconciliation work",
            promiseCandidate: "A lightweight audit trail for broken workflow runs.",
            firstReachableChannel: "reddit:r/SaaS",
            signalTypes: ["manual-workflow"],
            recommendedNextExperiment: "Reply to 10 operators and offer a paid manual audit.",
            evidence: [
              {
                id: "hn-1",
                sourceType: "community-comment",
                sourceName: "hacker-news:Hacker News",
                title: "Show HN: Workflow failure logs",
                url: "https://news.ycombinator.com/item?id=1",
                excerpt: "Operators describe failed automations and spreadsheet cleanup.",
                metric: "42 comments / 120 score",
              },
            ],
          },
        ],
        radarRun: {
          generatedAt: "2026-06-01T08:00:00.000Z",
          sourceCoverage: {
            communities: [{ source: "hacker-news:Hacker News", count: 3 }],
            cases: [{ source: "product-hunt", count: 1 }],
          },
          sourceErrors: [{ type: "reddit", message: "fetch failed" }],
        },
        caseSignals: [
          {
            case: {
              id: "product-hunt:1156590",
              source: "product-hunt",
              title: "Mina Meeting Assistant",
              url: "https://www.producthunt.com/products/mina-meeting-assistant",
              targetUser: "Product Hunt launch audience",
              pain: "Your AI teammate responds and executes during your calls.",
              productShape: "Product Hunt launch",
              firstAcquisitionChannel: "Product Hunt",
              pricing: "upvotes: 387",
              validationMove: "Inspect comments, makers, website CTA, and launch positioning before adapting the wedge.",
              copyable: ["launch positioning", "tagline framing"],
              notCopyable: ["launch timing", "maker audience"],
            },
            signalTypes: [],
            score: { total: 39 },
            cloneRisk: "medium",
            moatDependency: "medium",
          },
        ],
      },
    });

    const outputPath = path.join(tmp, "index.html");
    await renderPlaybookIndex({
      playbookDir: tmp,
      templatePath: path.join(repoRoot, "skills/startup-playbook-artifacts/templates/index.html"),
      outputPath,
    });

    const html = await readFile(outputPath, "utf8");
    assert.match(html, /class="stage-rail"/);
    assert.doesNotMatch(html, /data-stage-tab="discover"/);
    assert.match(html, /class="discovery-idea-list"/);
    assert.match(html, /data-opportunity-option/);
    assert.match(html, /selected-opportunity-detail/);
    assert.match(html, /id="selected-opportunity-title"/);
    assert.match(html, /id="selected-idea-pipeline"/);
    assert.match(html, /function selectOpportunity/);
    assert.match(html, /实时机会挖掘/);
    assert.match(html, /潜在用户痛点/);
    assert.match(html, /后续 Pipeline/);
    assert.match(html, /id="stage-panel"/);
    assert.match(html, /function switchStage/);
    assert.match(html, /const stageChartInstances/);
    assert.match(html, /"currentStage": "discover"/);
    assert.match(html, /let LANG = 'zh'/);
    assert.match(html, /data-lang="zh">中<\/button><button class="lang-btn" data-lang="en">EN<\/button>/);
    assert.match(html, /Workflow failure audit trail/);
    assert.match(html, /工作流失败审计记录/);
    assert.match(html, /discover-workbench/);
    assert.match(html, /public-case-library/);
    assert.match(html, /Mina Meeting Assistant/);
    assert.match(html, /candidate-brief/);
    assert.match(html, /outreach-script-pack/);
    assert.match(html, /候选机会详情/);
    assert.match(html, /seo-competitive-analysis/);
    assert.match(html, /竞品差异/);
    assert.match(html, /长尾词机会/);
    assert.match(html, /Pixc/);
    assert.match(html, /Amazon 商品图合规/);
    assert.match(html, /社区回复话术/);
    assert.match(html, /继续 \/ 转向 \/ 暂停门槛/);
    assert.match(html, /validation-tracker/);
    assert.match(html, /买家证据清单/);
    assert.match(html, /验证追踪表/);
    assert.match(html, /访谈评分卡/);
    assert.match(html, /决策备忘录/);
    assert.match(html, /stage-workbench/);
    assert.match(html, /验证实验工作台/);
    assert.match(html, /商业模式工作台/);
    assert.match(html, /构建工作台/);
    assert.match(html, /增长工作台/);
    assert.match(html, /运营工作台/);
    assert.match(html, /推进门槛/);
    assert.equal((html.match(/id="playbook-data"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /<\/script>0/);
    assert.match(html, /\$20 for 10 units/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
