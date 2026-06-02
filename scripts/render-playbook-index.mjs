#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const defaultStageOrder = ["discover", "validate", "business-model", "build", "grow", "operate"];
const stageLabels = {
  discover: "Discover",
  validate: "Validate",
  "business-model": "Business Model",
  build: "Build",
  grow: "Grow",
  operate: "Operate",
};
const stageLabelsZh = {
  discover: "发现",
  validate: "验证",
  "business-model": "商业模式",
  build: "构建",
  grow: "增长",
  operate: "运营",
};
const stageTitles = {
  discover: "Opportunity radar",
  validate: "Narrow before building",
  "business-model": "Business model",
  build: "Build scope",
  grow: "Growth path",
  operate: "Operating loop",
};
const stageTitlesZh = {
  discover: "机会雷达",
  validate: "先验证再构建",
  "business-model": "商业模式",
  build: "构建范围",
  grow: "增长路径",
  operate: "运营循环",
};
const decisionLabelsZh = {
  continue: "继续",
  pivot: "转向",
  pause: "暂停",
  adjust: "调整",
  none: "无",
};
const nextActionLabelsZh = {
  advance: "推进",
  stay: "停留",
  "back-to-validate": "回到验证",
  none: "无",
};
const candidateTypeLabelsZh = {
  "pain-led": "痛点驱动",
  "case-led": "案例驱动",
  candidate: "候选机会",
};
const signalTypeLabelsZh = {
  "pricing-pain": "定价痛点",
  "alternative-seeking": "寻找替代方案",
  "manual-workflow": "手动流程",
  "repeated-question": "重复问题",
  "integration-friction": "集成摩擦",
  "migration-friction": "迁移摩擦",
  "purchase-intent": "付费意向",
  "tool-complaint": "工具抱怨",
  "revenue-signal": "收入信号",
  "pricing-signal": "定价信号",
  "github-distribution": "GitHub 分发",
  "seo-channel": "SEO 渠道",
  "community-channel": "社区渠道",
  "manual-service": "人工服务",
};

export async function buildPlaybookDashboardData(playbookDir) {
  const manifest = await readJson(path.join(playbookDir, "playbook.json"));
  const evidenceLedger = await readJsonIfExists(path.join(playbookDir, "evidence.json"), { items: [] });
  const evidenceById = new Map((evidenceLedger.items ?? []).map((item) => [item.id, item]));
  const stageOrder = normalizeStageOrder(manifest.stageOrder);
  const stages = {};

  for (const stageKey of stageOrder) {
    const report = await readJsonIfExists(path.join(playbookDir, "stages", stageKey, "report.json"), null);
    const manifestStage = manifest.stages?.[stageKey] ?? {};
    stages[stageKey] = normalizeStage(stageKey, report, manifestStage, evidenceById);
  }

  return {
    projectId: manifest.projectId,
    currentStage: manifest.currentStage ?? stageOrder[0],
    stageOrder,
    project: localizeProject(manifest.project ?? {}),
    stages,
  };
}

export async function renderPlaybookIndex({
  playbookDir = path.join(repoRoot, "playbook"),
  templatePath = path.join(repoRoot, "skills", "startup-playbook-artifacts", "templates", "index.html"),
  outputPath = path.join(playbookDir, "index.html"),
} = {}) {
  const [template, data] = await Promise.all([
    readFile(templatePath, "utf8"),
    buildPlaybookDashboardData(playbookDir),
  ]);
  const html = replaceEmbeddedData(template, data);
  validateTemplateMarkers(html);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
  return { outputPath, data };
}

export function replaceEmbeddedData(template, data) {
  const serialized = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  const pattern = /(<script type="application\/json" id="playbook-data">\s*)[\s\S]*?(\s*<\/script>)/;
  if (!pattern.test(template)) {
    throw new Error("Template missing playbook-data script block.");
  }
  return template.replace(pattern, (_match, openTag) => `${openTag}\n${serialized}\n  </script>`);
}

function normalizeStage(stageKey, report, manifestStage, evidenceById) {
  const analysis = report?.analysis ?? {};
  const evidence = evidenceSummaries(report?.evidenceRefs ?? [], evidenceById);
  const decision = report?.decision ?? manifestStage.decision ?? null;
  const nextAction = report?.nextStageAction ?? "stay";
  const stage = {
    label: stageLabels[stageKey] ?? titleize(stageKey),
    labelZh: stageLabelsZh[stageKey] ?? titleize(stageKey),
    title: stageTitles[stageKey] ?? titleize(stageKey),
    titleZh: stageTitlesZh[stageKey] ?? titleize(stageKey),
    score: report?.score ?? manifestStage.score ?? null,
    decision,
    decisionZh: decisionLabelsZh[decision] ?? decision ?? "无",
    nextAction,
    nextActionZh: nextActionLabelsZh[nextAction] ?? nextAction ?? "无",
    summary: report?.reasoning ?? "No report has been written for this stage yet.",
    summaryZh: localizedStageSummary(stageKey, report, analysis),
    evidence: evidence.length ? evidence : report?.known ?? [],
    evidenceZh: (evidence.length ? evidence : report?.known ?? []).map((item) => translateKnownText(item)),
    risks: report?.concerns ?? [],
    risksZh: (report?.concerns ?? []).map((item) => translateKnownText(item)),
    nextSteps: report?.nextSteps ?? [],
    nextStepsZh: (report?.nextSteps ?? []).map((item) => translateKnownText(item)),
    links: [
      ["report.md", `stages/${stageKey}/report.md`],
      ["report.json", `stages/${stageKey}/report.json`],
      ["handoff.json", `stages/${stageKey}/handoff.json`],
      ["input.json", `stages/${stageKey}/input.json`],
    ],
  };

  if (stageKey === "discover") {
    const radarRun = analysis.radarRun ?? {};
    stage.title = "Opportunity radar";
    stage.titleZh = "机会雷达";
    stage.candidates = localizeCandidates(analysis.opportunityBacklog ?? []);
    stage.topCandidates = localizeCandidates(analysis.topCandidates ?? []);
    stage.signalSummary = analysis.signalSummary ?? {};
    stage.sourceCoverage = radarRun.sourceCoverage ?? {};
    stage.sourceErrors = radarRun.sourceErrors ?? [];
    stage.radarRun = radarRun;
    stage.runSummary = buildDiscoverRunSummary(analysis, report, stage);
    stage.communitySignals = localizeSignals(analysis.communitySignals ?? []);
    stage.caseSignals = localizeCaseSignals(analysis.caseSignals ?? []);
    stage.evidenceMatrix = buildDiscoverEvidenceMatrix(stage.candidates, stage.communitySignals);
    stage.caseLibrary = buildDiscoverCaseLibrary(stage.caseSignals);
    stage.validationPlan = buildDiscoverValidationPlan(stage);
    stage.candidateBrief = buildDiscoverCandidateBrief(stage);
    stage.replicationBrief = buildDiscoverReplicationBrief(stage.caseLibrary);
    stage.outreachScripts = buildDiscoverOutreachScripts(stage);
    stage.decisionGate = buildDiscoverDecisionGate(stage);
    stage.validationTracker = buildDiscoverValidationTracker(stage);
    stage.summaryZh = localizedStageSummary(stageKey, report, {
      ...analysis,
      topCandidates: stage.topCandidates,
      opportunityBacklog: stage.candidates,
    });
  }
  if (stageKey === "validate") {
    stage.validationEvidence = analysis.validationEvidence ?? [];
    stage.minimumEvidenceSet = analysis.minimumEvidenceSet ?? null;
    stage.gates = analysis.gates ?? null;
  }
  if (stageKey === "business-model") {
    stage.pricing = analysis.pricing ?? analysis.recommendedModel?.pricing ?? {};
  }
  if (stageKey === "grow") {
    stage.keywordClusters = analysis.keywordClusters ?? analysis.seoAso?.keywordClusters ?? [];
    stage.channels = analysis.channels ?? [];
  }
  if (stageKey === "operate") {
    stage.aarrr = localizeAarrr(analysis.aarrr ?? analysis.weeklySnapshot?.aarrr ?? {});
    stage.retention = analysis.retention ?? {};
  }
  if (stageKey !== "discover") {
    stage.workflowWorkbench = buildStageWorkflowWorkbench(stageKey, analysis, stage);
  }

  return stage;
}

function localizeProject(project) {
  return {
    ...project,
    nameZh: project.nameZh ?? translateKnownText(project.name),
    oneLineZh: project.oneLineZh ?? translateKnownText(project.oneLine),
  };
}

function localizeCandidates(candidates) {
  return candidates.map((candidate) => ({
    ...candidate,
    titleZh: translateKnownText(candidate.title),
    targetUserZh: translateKnownText(candidate.targetUser),
    firstReachableChannelZh: translateKnownText(candidate.firstReachableChannel),
    recommendedNextExperimentZh: translateKnownText(candidate.recommendedNextExperiment),
    painfulSituationZh: translateKnownText(candidate.painfulSituation),
    promiseCandidateZh: translateKnownText(candidate.promiseCandidate),
    typeZh: candidateTypeLabelsZh[candidate.type] ?? candidate.type ?? "候选机会",
    signalTypesZh: (candidate.signalTypes ?? []).map((signal) => signalTypeLabelsZh[signal] ?? translateKnownText(signal)),
  }));
}

function localizeSignals(signals) {
  return signals.map((signal) => ({
    ...signal,
    typeZh: signalTypeLabelsZh[signal.type] ?? translateKnownText(signal.type),
    labelZh: signalTypeLabelsZh[signal.type] ?? translateKnownText(signal.label),
    sourceNameZh: translateKnownText(signal.sourceName),
    excerpt: cleanTextSnippet(signal.excerpt),
    excerptZh: translateKnownText(cleanTextSnippet(signal.excerpt)),
  }));
}

function localizeCaseSignals(signals) {
  return signals.map((signal) => {
    const caseItem = signal.case ?? {};
    return {
      ...signal,
      case: {
        ...caseItem,
        sourceZh: translateKnownText(caseItem.source),
        targetUserZh: translateKnownText(caseItem.targetUser),
        painZh: translateKnownText(caseItem.pain),
        productShapeZh: translateKnownText(caseItem.productShape),
        firstAcquisitionChannelZh: translateKnownText(caseItem.firstAcquisitionChannel),
        validationMoveZh: translateKnownText(caseItem.validationMove),
        copyableZh: (caseItem.copyable ?? []).map((item) => translateKnownText(item)),
        notCopyableZh: (caseItem.notCopyable ?? []).map((item) => translateKnownText(item)),
      },
      signalTypesZh: (signal.signalTypes ?? []).map((type) => signalTypeLabelsZh[type] ?? translateKnownText(type)),
      copyableZh: (signal.copyable ?? []).map((item) => translateKnownText(item)),
      whatNotToCopyZh: (signal.whatNotToCopy ?? []).map((item) => translateKnownText(item)),
    };
  });
}

function localizeAarrr(aarrr) {
  return Object.fromEntries(Object.entries(aarrr ?? {}).map(([key, item]) => [
    key,
    {
      ...item,
      targetZh: translateKnownText(item?.target),
    },
  ]));
}

function buildDiscoverRunSummary(analysis, report, stage) {
  const radarRun = analysis?.radarRun ?? {};
  const signalSummary = analysis?.signalSummary ?? {};
  const topCandidate = stage.topCandidates?.[0] ?? stage.candidates?.[0] ?? null;
  return {
    runId: radarRun.runId ?? null,
    runPath: radarRun.runPath ?? null,
    generatedAt: radarRun.generatedAt ?? report?.generatedAt ?? null,
    candidateCount: signalSummary.candidateCount ?? radarRun.candidateCount ?? stage.candidates?.length ?? 0,
    communityItems: signalSummary.communityItems ?? 0,
    caseItems: signalSummary.caseItems ?? 0,
    painSignals: signalSummary.painSignals ?? 0,
    caseSignals: signalSummary.caseSignals ?? 0,
    sourceErrorCount: (radarRun.sourceErrors ?? []).length,
    topScore: topCandidate?.score ?? null,
    topTitle: topCandidate?.title ?? null,
    topTitleZh: topCandidate?.titleZh ?? translateKnownText(topCandidate?.title),
  };
}

function buildDiscoverEvidenceMatrix(candidates, communitySignals) {
  const rows = [];
  const seen = new Set();
  for (const candidate of candidates ?? []) {
    for (const evidence of candidate.evidence ?? []) {
      const id = evidence.id ?? `${evidence.sourceName}:${evidence.url}:${evidence.title}`;
      if (seen.has(id)) continue;
      seen.add(id);
      rows.push({
        id,
        candidateId: candidate.id,
        candidateTitle: candidate.title,
        candidateTitleZh: candidate.titleZh,
        candidateScore: candidate.score ?? null,
        sourceType: evidence.sourceType ?? "evidence",
        sourceName: evidence.sourceName ?? evidence.source ?? "source",
        sourceNameZh: translateKnownText(evidence.sourceName ?? evidence.source ?? "source"),
        title: evidence.title ?? evidence.id ?? "Evidence",
        titleZh: translateKnownText(evidence.title ?? evidence.id ?? "Evidence"),
        url: evidence.url ?? "",
        metric: evidence.metric ?? evidence.pricing ?? evidence.revenue ?? "",
        excerpt: cleanTextSnippet(evidence.excerpt ?? evidence.pain ?? evidence.summary ?? ""),
        excerptZh: translateKnownText(cleanTextSnippet(evidence.excerpt ?? evidence.pain ?? evidence.summary ?? "")),
        signalTypes: candidate.signalTypes ?? [],
        signalTypesZh: candidate.signalTypesZh ?? [],
      });
    }
  }

  for (const signal of communitySignals ?? []) {
    const id = signal.sourceId ?? `${signal.sourceName}:${signal.url}:${signal.type}`;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      candidateId: "",
      candidateTitle: "",
      candidateTitleZh: "",
      candidateScore: null,
      sourceType: "community-signal",
      sourceName: signal.sourceName ?? "community",
      sourceNameZh: signal.sourceNameZh ?? translateKnownText(signal.sourceName),
      title: signal.label ?? signal.type ?? "Signal",
      titleZh: signal.labelZh ?? translateKnownText(signal.label ?? signal.type),
      url: signal.url ?? "",
      metric: signal.type ?? "",
      excerpt: signal.excerpt ?? "",
      excerptZh: signal.excerptZh ?? signal.excerpt ?? "",
      signalTypes: signal.type ? [signal.type] : [],
      signalTypesZh: signal.typeZh ? [signal.typeZh] : [],
    });
  }

  return rows.slice(0, 12);
}

function buildDiscoverCaseLibrary(caseSignals) {
  const library = { github: [], productHunt: [], other: [] };
  const seen = new Set();
  for (const signal of caseSignals ?? []) {
    const caseItem = signal.case ?? {};
    const id = caseItem.id ?? `${caseItem.source}:${caseItem.url}:${caseItem.title}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const score = typeof signal.score === "number" ? signal.score : signal.score?.total ?? null;
    const entry = {
      id,
      source: caseItem.source ?? "case",
      sourceZh: caseItem.sourceZh ?? translateKnownText(caseItem.source),
      title: caseItem.title ?? "Case",
      url: caseItem.url ?? "",
      targetUser: caseItem.targetUser ?? "",
      targetUserZh: caseItem.targetUserZh ?? translateKnownText(caseItem.targetUser),
      pain: caseItem.pain ?? "",
      painZh: caseItem.painZh ?? translateKnownText(caseItem.pain),
      productShape: caseItem.productShape ?? "",
      productShapeZh: caseItem.productShapeZh ?? translateKnownText(caseItem.productShape),
      firstAcquisitionChannel: caseItem.firstAcquisitionChannel ?? signal.firstReachableChannel ?? "",
      firstAcquisitionChannelZh: caseItem.firstAcquisitionChannelZh ?? translateKnownText(caseItem.firstAcquisitionChannel ?? signal.firstReachableChannel),
      pricing: caseItem.pricing ?? "",
      revenue: caseItem.revenue ?? "",
      validationMove: caseItem.validationMove ?? signal.validationShortcut ?? "",
      validationMoveZh: caseItem.validationMoveZh ?? translateKnownText(caseItem.validationMove ?? signal.validationShortcut),
      copyable: caseItem.copyable ?? signal.copyable ?? [],
      copyableZh: caseItem.copyableZh ?? signal.copyableZh ?? [],
      notCopyable: caseItem.notCopyable ?? signal.whatNotToCopy ?? [],
      notCopyableZh: caseItem.notCopyableZh ?? signal.whatNotToCopyZh ?? [],
      signalTypes: signal.signalTypes ?? [],
      signalTypesZh: signal.signalTypesZh ?? [],
      cloneRisk: signal.cloneRisk ?? "",
      moatDependency: signal.moatDependency ?? "",
      score,
    };
    if (entry.source === "github") library.github.push(entry);
    else if (entry.source === "product-hunt") library.productHunt.push(entry);
    else library.other.push(entry);
  }

  library.github = library.github.slice(0, 8);
  library.productHunt = library.productHunt.slice(0, 8);
  library.other = library.other.slice(0, 8);
  return library;
}

function buildDiscoverCandidateBrief(stage) {
  const candidate = stage.topCandidates?.[0] ?? stage.candidates?.[0] ?? {};
  const evidenceCount = candidate.evidence?.length ?? stage.evidenceMatrix?.length ?? 0;
  const painfulSituation = candidate.painfulSituation ?? "Pain is visible in public discussion, but needs buyer validation.";
  const promise = candidate.promiseCandidate ?? "Run a manual diagnostic before building product automation.";
  const experiment = candidate.recommendedNextExperiment ?? stage.nextSteps?.[0] ?? "Reply to 10 reachable users and test willingness to pay.";
  return {
    id: candidate.id ?? "",
    type: candidate.type ?? "candidate",
    typeZh: candidate.typeZh ?? "候选机会",
    title: candidate.title ?? "Selected opportunity",
    titleZh: candidate.titleZh ?? translateKnownText(candidate.title ?? "Selected opportunity"),
    score: candidate.score ?? stage.score ?? null,
    targetUser: candidate.targetUser ?? "",
    targetUserZh: candidate.targetUserZh ?? translateKnownText(candidate.targetUser),
    painfulSituation,
    painfulSituationZh: candidate.painfulSituationZh ?? translateKnownText(painfulSituation),
    promise,
    promiseZh: candidate.promiseCandidateZh ?? translateKnownText(promise),
    firstReachableChannel: candidate.firstReachableChannel ?? "",
    firstReachableChannelZh: candidate.firstReachableChannelZh ?? translateKnownText(candidate.firstReachableChannel),
    recommendedNextExperiment: experiment,
    recommendedNextExperimentZh: candidate.recommendedNextExperimentZh ?? translateKnownText(experiment),
    signalTypes: candidate.signalTypes ?? [],
    signalTypesZh: candidate.signalTypesZh ?? [],
    copyable: candidate.copyable ?? [],
    copyableZh: (candidate.copyable ?? []).map((item) => translateKnownText(item)),
    whatNotToCopy: candidate.whatNotToCopy ?? [],
    whatNotToCopyZh: (candidate.whatNotToCopy ?? []).map((item) => translateKnownText(item)),
    cloneRisk: candidate.cloneRisk ?? "",
    moatDependency: candidate.moatDependency ?? "",
    evidenceCount,
  };
}

function buildDiscoverReplicationBrief(caseLibrary) {
  return {
    github: summarizeReplicationGroup(caseLibrary?.github ?? [], "GitHub"),
    productHunt: summarizeReplicationGroup(caseLibrary?.productHunt ?? [], "Product Hunt"),
    other: summarizeReplicationGroup(caseLibrary?.other ?? [], "Other public cases"),
  };
}

function summarizeReplicationGroup(cases, sourceName) {
  const copyable = uniqueFlat(cases.map((item) => item.copyable)).slice(0, 8);
  const notCopyable = uniqueFlat(cases.map((item) => item.notCopyable)).slice(0, 8);
  const validationMoves = cases
    .map((item) => item.validationMove)
    .filter(Boolean)
    .slice(0, 5);
  const topCases = [...cases]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((item) => ({
      title: item.title,
      url: item.url,
      score: item.score,
      pricing: item.pricing,
    }));
  return {
    sourceName,
    sourceNameZh: translateKnownText(sourceName),
    caseCount: cases.length,
    topCases,
    copyable,
    copyableZh: copyable.map((item) => translateKnownText(item)),
    notCopyable,
    notCopyableZh: notCopyable.map((item) => translateKnownText(item)),
    validationMoves,
    validationMovesZh: validationMoves.map((item) => translateKnownText(item)),
  };
}

function buildDiscoverOutreachScripts(stage) {
  const brief = stage.candidateBrief ?? buildDiscoverCandidateBrief(stage);
  const title = brief.title;
  const titleZh = brief.titleZh;
  const user = brief.targetUser || "operators";
  const userZh = brief.targetUserZh || "运营者";
  const pain = brief.painfulSituation;
  const painZh = brief.painfulSituationZh;
  const promise = brief.promise;
  const promiseZh = brief.promiseZh;
  const channel = brief.firstReachableChannel || "the source community";
  const channelZh = brief.firstReachableChannelZh || "来源社区";
  return {
    publicReply: `I noticed this workflow pain around ${pain}. I am validating ${title}, not pitching a product yet. Would you share one recent failed run or manual recovery step so I can compare patterns?`,
    publicReplyZh: `我看到你们在${channelZh}反复提到“${painZh}”。我现在验证的是“${titleZh}”，还不是推产品。可以分享一次最近失败的流程或人工补救步骤吗？我可以先做一次小型人工审计。`,
    privateFollowUp: `Thanks for the context. If this is still painful, I can review one broken workflow and return a short audit: failure points, recovery checklist, and whether ${promise} would save time. Fixed scope, no subscription.`,
    privateFollowUpZh: `谢谢补充。如果这个问题还在发生，我可以看一个坏掉的工作流，给你一份简短人工审计：失败点、补救清单，以及“${promiseZh}”是否真的能省时间。固定范围，不推订阅。`,
    paidAuditOffer: `Paid manual audit for ${user}: review one broken workflow, map failure points, and deliver a recovery queue outline within 48 hours.`,
    paidAuditOfferZh: `给${userZh}的一次付费人工审计：看 1 个坏掉的工作流，标出失败点，并在 48 小时内交付一版恢复队列大纲。`,
    interviewQuestions: [
      "When did this workflow last fail, and who noticed first?",
      "What manual steps did your team take to recover?",
      "What does one failure cost in time, money, customer trust, or missed revenue?",
      "What tool or process have you already tried?",
      "Would you pay for a manual audit before a software product exists?",
    ],
    interviewQuestionsZh: [
      "这个工作流最近一次什么时候失败？最先是谁发现的？",
      "团队为了补救做了哪些人工步骤？",
      "一次失败会带来多少时间、金钱、客户信任或收入损失？",
      "你们已经试过哪些工具或流程？",
      "在软件产品还不存在前，你愿意先为一次人工审计付费吗？",
    ],
    sourceChannel: channel,
    sourceChannelZh: channelZh,
  };
}

function buildDiscoverDecisionGate(stage) {
  const score = stage.score ?? 0;
  return {
    continue: {
      minQualifiedReplies: 3,
      minBookedCalls: 2,
      minPaidOrNearPaidSignals: 1,
      minEvidenceLinks: 5,
      currentScore: score,
    },
    continueZh: [
      "继续：至少 3 个有效回复，或 2 次买家通话。",
      "继续：至少 1 个付费或接近付费信号，例如愿意接受固定价格人工审计。",
      "继续：证据能指向真实买家损失，而不只是公开讨论热度。",
    ],
    pivot: {
      condition: "Replies confirm pain but reject the selected wedge, buyer segment, or first channel.",
      nextMove: "Keep the strongest pain signal, change ICP or first paid offer.",
    },
    pivotZh: [
      "转向：回复承认痛点，但否定当前切入点、用户细分或首个渠道。",
      "转向：保留最强痛点信号，换 ICP 或换第一版付费服务。",
    ],
    pause: {
      condition: "No qualified replies, no artifact shared, and no willingness-to-pay signal after the 7-day sprint.",
      nextMove: "Pause build work and collect a fresher source set.",
    },
    pauseZh: [
      "暂停：7 天后没有有效回复、没有真实工件、没有付费意向。",
      "暂停：停止构建投入，重新挖掘更新的社区和公开案例来源。",
    ],
  };
}

function buildDiscoverValidationTracker(stage) {
  const evidenceRows = stage.evidenceMatrix ?? [];
  const sourceRows = evidenceRows.slice(0, 10);
  const outreachRows = Array.from({ length: 10 }, (_unused, index) => {
    const source = sourceRows[index] ?? {};
    return {
      slot: index + 1,
      sourceName: source.sourceName ?? "",
      sourceNameZh: source.sourceNameZh ?? translateKnownText(source.sourceName),
      sourceTitle: source.title ?? "",
      sourceTitleZh: source.titleZh ?? translateKnownText(source.title),
      sourceUrl: source.url ?? "",
      targetRole: stage.candidateBrief?.targetUser ?? "target buyer",
      targetRoleZh: stage.candidateBrief?.targetUserZh ?? "目标买家",
      status: "not-started",
      statusZh: "未开始",
      evidenceNeeded: index < sourceRows.length ? "reply, artifact, pain cost, paid-intent signal" : "new sourced buyer record",
      evidenceNeededZh: index < sourceRows.length ? "回复、真实工件、痛点成本、付费意向信号" : "新增一个来源买家记录",
      nextAction: index < sourceRows.length ? "Send public reply or private follow-up." : "Fill this slot from the next qualified source.",
      nextActionZh: index < sourceRows.length ? "发送公开回复或私信跟进。" : "用下一个有效来源补齐这个空位。",
    };
  });

  return {
    buyerEvidenceChecklist: [
      {
        key: "buyer-pain",
        label: "Named buyer pain",
        labelZh: "买家明确痛点",
        required: true,
        why: "A real buyer can describe the broken workflow in their own words.",
        whyZh: "真实买家能用自己的话描述坏掉的工作流。",
      },
      {
        key: "artifact",
        label: "Workflow artifact",
        labelZh: "真实流程工件",
        required: true,
        why: "Screenshots, logs, spreadsheet exports, or process notes prove this is operational.",
        whyZh: "截图、日志、表格导出或流程记录能证明这是实际运营问题。",
      },
      {
        key: "cost",
        label: "Cost of pain",
        labelZh: "痛点成本",
        required: true,
        why: "Time, money, customer loss, compliance risk, or missed revenue gives urgency.",
        whyZh: "时间、金钱、客户流失、合规风险或收入损失决定紧急度。",
      },
      {
        key: "paid-intent",
        label: "Paid intent",
        labelZh: "付费意向",
        required: true,
        why: "Acceptance of a paid manual audit is stronger than interest in a future SaaS tool.",
        whyZh: "愿意接受付费人工审计，比对未来 SaaS 感兴趣更强。",
      },
      {
        key: "repeatability",
        label: "Repeatability",
        labelZh: "重复发生",
        required: false,
        why: "The same failure should appear across more than one buyer or workflow.",
        whyZh: "同类失败需要出现在不止一个买家或工作流里。",
      },
      {
        key: "reachable-channel",
        label: "Reachable channel",
        labelZh: "可触达渠道",
        required: false,
        why: "A repeatable source community or public case channel keeps validation cheap.",
        whyZh: "可重复触达的社区或公开案例渠道能降低验证成本。",
      },
    ],
    outreachRows,
    interviewScorecard: {
      scoringGuide: "Score each criterion from 0 to 3 after the interview.",
      scoringGuideZh: "访谈后每项按 0 到 3 分打分。",
      criteria: [
        { key: "frequency", label: "Failure frequency", labelZh: "失败频率", target: "weekly or more often", targetZh: "每周或更频繁" },
        { key: "cost", label: "Visible cost", labelZh: "可见成本", target: "time, money, customers, compliance, or revenue", targetZh: "时间、金钱、客户、合规或收入" },
        { key: "manual-work", label: "Manual recovery work", labelZh: "人工补救工作", target: "clear owner and repeated manual steps", targetZh: "有明确负责人和重复人工步骤" },
        { key: "current-alternative", label: "Current alternative", labelZh: "当前替代方案", target: "spreadsheet, scripts, consultant, or paid tool", targetZh: "表格、脚本、顾问或付费工具" },
        { key: "artifact-quality", label: "Artifact quality", labelZh: "工件质量", target: "buyer can share enough detail to audit", targetZh: "买家能提供足够细节供审计" },
        { key: "payment", label: "Payment seriousness", labelZh: "付费认真度", target: "accepts price or asks purchase questions", targetZh: "接受价格或提出购买问题" },
      ],
    },
    decisionMemo: {
      title: "Discovery validation decision memo",
      titleZh: "发现阶段验证决策备忘录",
      sections: [
        { key: "hypothesis", label: "Opportunity hypothesis", labelZh: "机会假设", prompt: "What pain, buyer, and promise were tested?", promptZh: "本轮验证测试了哪个痛点、买家和承诺？" },
        { key: "strongest-evidence", label: "Strongest buyer evidence", labelZh: "最强买家证据", prompt: "Which replies, artifacts, or calls changed confidence?", promptZh: "哪些回复、工件或通话改变了信心？" },
        { key: "paid-intent", label: "Paid-intent evidence", labelZh: "付费意向证据", prompt: "Who accepted, negotiated, or rejected the paid manual audit?", promptZh: "谁接受、议价或拒绝了付费人工审计？" },
        { key: "objections", label: "Objections", labelZh: "主要异议", prompt: "What objections repeated across buyers?", promptZh: "哪些异议在多个买家中重复出现？" },
        { key: "decision", label: "Decision", labelZh: "最终决策", prompt: "Continue, pivot, or pause, with direct evidence links.", promptZh: "继续、转向或暂停，并附直接证据链接。" },
      ],
    },
  };
}

function buildStageWorkflowWorkbench(stageKey, analysis, stage) {
  switch (stageKey) {
    case "validate":
      return buildValidateWorkbench(analysis, stage);
    case "business-model":
      return buildBusinessModelWorkbench(analysis, stage);
    case "build":
      return buildBuildWorkbench(analysis, stage);
    case "grow":
      return buildGrowWorkbench(analysis, stage);
    case "operate":
      return buildOperateWorkbench(analysis, stage);
    default:
      return buildGenericStageWorkbench(stage);
  }
}

function buildValidateWorkbench(analysis, stage) {
  const snapshot = analysis.snapshot ?? {};
  const minimumEvidenceSet = analysis.minimumEvidenceSet ?? {};
  const gates = analysis.gates ?? {};
  const paid = analysis.willingnessToPay ?? {};
  return {
    title: "Validation experiment workbench",
    titleZh: "验证实验工作台",
    note: "Use this stage to replace plausible evidence with buyer behavior.",
    noteZh: "这个阶段要把“看起来合理”替换成真实买家行为。",
    sections: [
      {
        key: "focus",
        title: "Validation focus",
        titleZh: "验证焦点",
        cards: [
          workbenchCard("Target user", "目标用户", snapshot.targetUser ?? "Narrow ICP not set", translateKnownText(snapshot.targetUser ?? "尚未锁定 ICP")),
          workbenchCard("Painful situation", "痛点场景", snapshot.painfulSituation ?? stage.summary, translateKnownText(snapshot.painfulSituation ?? stage.summary)),
          workbenchCard("Current workaround", "当前替代方案", snapshot.currentWorkaround ?? "Interview buyers for current workaround.", translateKnownText(snapshot.currentWorkaround ?? "访谈买家，记录当前替代方案。")),
          workbenchCard("Desired outcome", "期望结果", snapshot.desiredOutcome ?? "A measurable buyer outcome.", translateKnownText(snapshot.desiredOutcome ?? "一个可衡量的买家结果。")),
        ],
      },
      {
        key: "experiment",
        title: "Interview and paid experiment",
        titleZh: "访谈与付费实验",
        rows: [
          workbenchRow(1, "Narrow buyer segment", "收窄买家细分", snapshot.targetUser ?? "Target buyer", translateKnownText(snapshot.targetUser ?? "目标买家"), "not-started", "未开始", "Write the exclusion list before outreach.", "先写清楚排除名单。", "one clear ICP", "1 个清晰 ICP"),
          workbenchRow(2, "Book seller interviews", "预约卖家访谈", "10 qualified sellers", "10 位有效卖家", "not-started", "未开始", "Ask for the last rejected or underperforming product image.", "索要最近一次被拒或表现不佳的商品图。", "5 calls or audits", "5 次通话或审计"),
          workbenchRow(3, "Collect workflow artifact", "收集真实流程工件", "before/after image, rule issue, or rejection reason", "前后对照图、规则问题或驳回原因", "not-started", "未开始", "Capture source, role, artifact, and pain cost.", "记录来源、角色、工件和痛点成本。", "3 artifact-backed pains", "3 条带工件的痛点"),
          workbenchRow(4, "Offer paid SKU pack", "提出付费 SKU 图片包", paid.firstPaidTest ?? "paid manual test", translateKnownText(paid.firstPaidTest ?? "付费人工测试"), "not-started", "未开始", "Quote a fixed scope instead of asking if they are interested.", "给固定范围报价，而不是只问是否感兴趣。", "1 paid or near-paid signal", "1 个付费或接近付费信号"),
          workbenchRow(5, "Decision review", "验证决策复盘", minimumEvidenceSet.decisionRule ?? "Continue only with direct buyer pain and paid intent.", translateKnownText(minimumEvidenceSet.decisionRule ?? "只有直接买家痛点和付费意向都成立才继续。"), "not-started", "未开始", "Summarize continue, pivot, or pause with evidence links.", "用证据链接总结继续、转向或暂停。", "decision with links", "带链接的决策"),
        ],
      },
      {
        key: "evidence-gaps",
        title: "Evidence gaps",
        titleZh: "证据缺口",
        cards: [
          workbenchCard("Current status", "当前状态", minimumEvidenceSet.status ?? "unknown", translateKnownText(minimumEvidenceSet.status ?? "未知")),
          workbenchCard("Met categories", "已满足证据", joinList(minimumEvidenceSet.metCategories), translateKnownText(joinList(minimumEvidenceSet.metCategories))),
          workbenchCard("Missing categories", "缺失证据", joinList(minimumEvidenceSet.missingCategories), translateKnownText(joinList(minimumEvidenceSet.missingCategories))),
          workbenchCard("Decision rule", "决策规则", minimumEvidenceSet.decisionRule ?? "Define a continue rule before build.", translateKnownText(minimumEvidenceSet.decisionRule ?? "进入构建前定义继续规则。")),
        ],
      },
      {
        key: "gates",
        title: "Advance gate",
        titleZh: "推进门槛",
        cards: [
          gateCard("Demand real and frequent", "需求真实且高频", gates.demandRealAndFrequent),
          gateCard("Users reachable", "用户可触达", gates.usersReachable),
          gateCard("Willingness to pay", "愿意付费", gates.willingnessToPay),
        ],
      },
    ],
  };
}

function buildBusinessModelWorkbench(analysis, stage) {
  const positioning = analysis.positioning ?? {};
  const model = analysis.recommendedModel ?? {};
  const pricing = analysis.pricing ?? {};
  const unitEconomics = analysis.unitEconomics ?? {};
  const revenueProgression = analysis.revenueProgression ?? {};
  return {
    title: "Business model workbench",
    titleZh: "商业模式工作台",
    note: "Turn the first paid test into pricing, margin, and repeatability evidence.",
    noteZh: "把第一笔付费测试拆成定价、毛利和复购证据。",
    sections: [
      {
        key: "focus",
        title: "Commercial focus",
        titleZh: "商业焦点",
        cards: [
          workbenchCard("Buyer", "买家", positioning.buyerType ?? "buyer not set", translateKnownText(positioning.buyerType ?? "尚未定义买家")),
          workbenchCard("User", "使用者", positioning.userType ?? "user not set", translateKnownText(positioning.userType ?? "尚未定义使用者")),
          workbenchCard("Frequency", "使用频率", positioning.frequency ?? "usage cadence unknown", translateKnownText(positioning.frequency ?? "使用频率未知")),
          workbenchCard("Deliverable", "交付物", positioning.deliverable ?? stage.nextSteps?.[0], translateKnownText(positioning.deliverable ?? stage.nextSteps?.[0])),
        ],
      },
      {
        key: "pricing-margin",
        title: "Pricing and margin hypothesis",
        titleZh: "定价与毛利假设",
        rows: pricingRows(pricing),
        cards: [
          workbenchCard("First paid test", "第一笔付费测试", pricing.firstPaidTest ?? "manual paid test", translateKnownText(pricing.firstPaidTest ?? "人工付费测试")),
          workbenchCard("Price range", "价格区间", pricing.servicePriceRange ?? "TBD", translateKnownText(pricing.servicePriceRange ?? "待定")),
          workbenchCard("Pricing anchor", "定价锚点", pricing.anchor ?? "buyer cost and delivery risk", translateKnownText(pricing.anchor ?? "买家成本和交付风险")),
          workbenchCard("Payback rule", "回本规则", unitEconomics.paybackAssumption ?? "first order must pay back", translateKnownText(unitEconomics.paybackAssumption ?? "第一单必须回本")),
        ],
      },
      {
        key: "revenue-progression",
        title: "Revenue progression",
        titleZh: "收入阶段",
        cards: objectCards(revenueProgression, {
          zeroToOne: "0 到 1",
          oneToOneK: "1 到 1K",
          oneKToTenK: "1K 到 10K",
          killOrPivotThreshold: "暂停或转向阈值",
        }),
      },
      {
        key: "gate",
        title: "Advance gate",
        titleZh: "推进门槛",
        cards: [
          workbenchCard("Model", "模式", model.type ?? "productized service first", translateKnownText(model.type ?? "先产品化服务")),
          workbenchCard("Rationale", "理由", model.rationale ?? stage.summary, translateKnownText(model.rationale ?? stage.summary)),
          workbenchCard("Continue", "继续", "2 paid SKU packs or 5 concrete purchase conversations.", "2 个付费 SKU 图片包，或 5 次具体购买对话。"),
          workbenchCard("Pause", "暂停", revenueProgression.killOrPivotThreshold ?? "No paid demand after qualified conversations.", translateKnownText(revenueProgression.killOrPivotThreshold ?? "有效对话后仍没有付费需求。")),
        ],
      },
    ],
  };
}

function buildBuildWorkbench(analysis, stage) {
  const mvp = analysis.mvpScope ?? {};
  const prd = analysis.prd ?? {};
  const ai = analysis.aiNativeCheck ?? {};
  const instrumentation = analysis.instrumentation ?? {};
  const checklist = analysis.launchChecklist ?? {};
  return {
    title: "Build workbench",
    titleZh: "构建工作台",
    note: "Build only what the paid manual workflow proves is repeated.",
    noteZh: "只构建付费人工流程里被证明重复发生的部分。",
    sections: [
      {
        key: "scope",
        title: "MVP scope",
        titleZh: "MVP 范围",
        cards: [
          workbenchCard("Smallest promise", "最小承诺", mvp.smallestPromise ?? stage.summary, translateKnownText(mvp.smallestPromise ?? stage.summary)),
          workbenchCard("Must have", "必须做", joinList(mvp.mustHave), translateKnownText(joinList(mvp.mustHave))),
          workbenchCard("Not now", "暂不做", joinList(mvp.notNow), translateKnownText(joinList(mvp.notNow))),
          workbenchCard("Manual fallback", "人工兜底", mvp.manualFallback ?? "human review", translateKnownText(mvp.manualFallback ?? "人工审核")),
        ],
      },
      {
        key: "flow",
        title: "Concierge delivery flow",
        titleZh: "人工交付流程",
        rows: (prd.userFlow ?? []).map((step, index) => workbenchRow(index + 1, `Step ${index + 1}`, `步骤 ${index + 1}`, step, translateKnownText(step), "not-started", "未开始", "Keep it manual until repeated.", "先保持人工，确认重复后再自动化。", "owner and output logged", "记录负责人和产出")),
      },
      {
        key: "quality",
        title: "Quality and acceptance risk",
        titleZh: "质量与验收风险",
        cards: [
          workbenchCard("Acceptance criteria", "验收标准", joinList(prd.acceptanceCriteria), translateKnownText(joinList(prd.acceptanceCriteria))),
          workbenchCard("Human-owned decisions", "人工负责决策", joinList(ai.humanOwnedDecisions), translateKnownText(joinList(ai.humanOwnedDecisions))),
          workbenchCard("Edge cases", "边界样例", joinList(ai.evaluationPlan?.edgeCases), translateKnownText(joinList(ai.evaluationPlan?.edgeCases))),
          workbenchCard("Security and privacy", "安全与隐私", joinList(ai.securityPrivacyRisks), translateKnownText(joinList(ai.securityPrivacyRisks))),
        ],
      },
      {
        key: "launch",
        title: "Launch checklist",
        titleZh: "上线清单",
        cards: [
          workbenchCard("Pre-launch", "上线前", joinList(checklist.preLaunch), translateKnownText(joinList(checklist.preLaunch))),
          workbenchCard("Launch day", "上线当天", joinList(checklist.launchDay), translateKnownText(joinList(checklist.launchDay))),
          workbenchCard("First seven days", "前 7 天", joinList(checklist.firstSevenDays), translateKnownText(joinList(checklist.firstSevenDays))),
          workbenchCard("Instrumentation", "埋点", joinList(instrumentation.events), translateKnownText(joinList(instrumentation.events))),
        ],
      },
    ],
  };
}

function buildGrowWorkbench(analysis, stage) {
  const routing = analysis.marketRouting ?? {};
  const seo = analysis.seoAso ?? {};
  const paid = analysis.paidValidation ?? {};
  const utm = analysis.utmPlan ?? {};
  const measurement = analysis.measurementPlan ?? {};
  return {
    title: "Growth workbench",
    titleZh: "增长工作台",
    note: "Run proof-led outreach before optimizing traffic.",
    noteZh: "先跑证明资产和直接触达，再谈流量优化。",
    sections: [
      {
        key: "focus",
        title: "Growth focus",
        titleZh: "增长焦点",
        cards: [
          workbenchCard("Target markets", "目标市场", joinList(routing.targetMarkets), translateKnownText(joinList(routing.targetMarkets))),
          workbenchCard("Routing reason", "市场路径理由", routing.reason ?? stage.summary, translateKnownText(routing.reason ?? stage.summary)),
          workbenchCard("Landing pages", "落地页", joinList(seo.landingPages), translateKnownText(joinList(seo.landingPages))),
          workbenchCard("Paid channel stance", "付费渠道策略", paid.googleAds?.use ? "test paid ads" : "do not use paid ads yet", paid.googleAds?.use ? "测试付费广告" : "暂不使用付费广告"),
        ],
      },
      {
        key: "channels",
        title: "Channel outreach experiments",
        titleZh: "渠道触达实验",
        rows: (analysis.channels ?? []).map((channel, index) => workbenchRow(index + 1, channel.name ?? channel.channel ?? "Channel", translateKnownText(channel.name ?? channel.channel ?? "渠道"), channel.hypothesis ?? channel.type ?? "hypothesis", translateKnownText(channel.hypothesis ?? channel.type ?? "假设"), "not-started", "未开始", "Run one small outreach batch and tag every lead.", "跑一小批触达，并给每条线索打来源标签。", channel.measurement ?? "qualified replies", translateKnownText(channel.measurement ?? "有效回复"))),
      },
      {
        key: "assets",
        title: "Proof assets",
        titleZh: "证明资产",
        cards: [
          workbenchCard("Page titles", "页面标题", joinList(seo.titles), translateKnownText(joinList(seo.titles))),
          workbenchCard("Meta description", "Meta 描述", joinList(seo.metaDescriptions), translateKnownText(joinList(seo.metaDescriptions))),
          workbenchCard("AI can help", "AI 可辅助", joinList(analysis.aiDistribution?.aiCan), translateKnownText(joinList(analysis.aiDistribution?.aiCan))),
          workbenchCard("Human owns", "人工负责", joinList(analysis.aiDistribution?.humanOwns), translateKnownText(joinList(analysis.aiDistribution?.humanOwns))),
        ],
      },
      {
        key: "gate",
        title: "Advance gate",
        titleZh: "推进门槛",
        cards: [
          workbenchCard("Campaigns", "活动标签", joinList(utm.campaigns), translateKnownText(joinList(utm.campaigns))),
          workbenchCard("Metrics", "衡量指标", joinList(measurement.metrics), translateKnownText(joinList(measurement.metrics))),
          workbenchCard("Review cadence", "复盘节奏", measurement.reviewCadence ?? "weekly", translateKnownText(measurement.reviewCadence ?? "每周")),
          workbenchCard("Continue", "继续", "Only scale channels that produce qualified replies or paid packs.", "只放大能带来有效回复或付费图片包的渠道。"),
        ],
      },
    ],
  };
}

function buildOperateWorkbench(analysis, stage) {
  const snapshot = analysis.weeklySnapshot ?? {};
  const aarrr = analysis.aarrr ?? {};
  const nextExperiment = analysis.nextExperiment ?? {};
  const decision = analysis.decisionTreeResult ?? {};
  return {
    title: "Operate workbench",
    titleZh: "运营工作台",
    note: "Replace mock metrics with weekly operating evidence.",
    noteZh: "用每周真实运营证据替换模拟指标。",
    sections: [
      {
        key: "snapshot",
        title: "Weekly snapshot",
        titleZh: "本周运营快照",
        cards: [
          workbenchCard("Period", "周期", [snapshot.periodStart, snapshot.periodEnd].filter(Boolean).join(" - ") || "not set", [snapshot.periodStart, snapshot.periodEnd].filter(Boolean).join(" - ") || "未设置"),
          workbenchCard("Visitors", "访问量", valueOrDash(snapshot.visitors), valueOrDash(snapshot.visitors)),
          workbenchCard("Paying", "付费客户", valueOrDash(snapshot.paying), valueOrDash(snapshot.paying)),
          workbenchCard("Revenue", "收入", valueOrDash(snapshot.revenue), valueOrDash(snapshot.revenue)),
        ],
      },
      {
        key: "metrics",
        title: "Metric recording table",
        titleZh: "指标记录表",
        rows: aarrrRows(aarrr),
      },
      {
        key: "feedback",
        title: "Feedback and blockers",
        titleZh: "反馈与阻塞",
        cards: [
          workbenchCard("Feedback themes", "反馈主题", joinList(analysis.feedbackThemes), translateKnownText(joinList(analysis.feedbackThemes))),
          workbenchCard("Biggest blocker", "最大阻塞", analysis.biggestBlocker ?? "No blocker recorded", translateKnownText(analysis.biggestBlocker ?? "暂无阻塞记录")),
          workbenchCard("Channel quality", "渠道质量", summarizeObject(analysis.channelQuality), translateKnownText(summarizeObject(analysis.channelQuality))),
          workbenchCard("Revenue health", "收入健康", summarizeObject(analysis.revenueHealth), translateKnownText(summarizeObject(analysis.revenueHealth))),
        ],
      },
      {
        key: "decision",
        title: "Decision review gate",
        titleZh: "决策复盘门槛",
        cards: [
          workbenchCard("Next experiment", "下一个实验", nextExperiment.name ?? stage.nextSteps?.[0], translateKnownText(nextExperiment.name ?? stage.nextSteps?.[0])),
          workbenchCard("Goal", "目标", nextExperiment.goal ?? "Define weekly goal", translateKnownText(nextExperiment.goal ?? "定义每周目标")),
          workbenchCard("Success metric", "成功指标", nextExperiment.successMetric ?? "success metric missing", translateKnownText(nextExperiment.successMetric ?? "缺少成功指标")),
          workbenchCard("Recommendation", "建议", decision.recommendation ?? "review after data is collected", translateKnownText(decision.recommendation ?? "收集数据后复盘")),
        ],
      },
    ],
  };
}

function buildGenericStageWorkbench(stage) {
  return {
    title: "Stage workbench",
    titleZh: "阶段工作台",
    note: "Use the report to run the next experiment.",
    noteZh: "把报告转成下一轮实验执行记录。",
    sections: [
      {
        key: "next",
        title: "Next actions",
        titleZh: "下一步行动",
        cards: (stage.nextSteps ?? []).map((step, index) => workbenchCard(`Action ${index + 1}`, `行动 ${index + 1}`, step, translateKnownText(step))),
      },
      {
        key: "gate",
        title: "Advance gate",
        titleZh: "推进门槛",
        cards: [workbenchCard("Decision", "决策", stage.decision ?? "none", stage.decisionZh ?? "无")],
      },
    ],
  };
}

function workbenchCard(label, labelZh, value, valueZh, detail = "", detailZh = "") {
  return {
    label,
    labelZh,
    value: valueOrDash(value),
    valueZh: valueOrDash(valueZh ?? translateKnownText(value)),
    detail,
    detailZh: detailZh || translateKnownText(detail),
  };
}

function gateCard(label, labelZh, gate = {}) {
  return workbenchCard(
    label,
    labelZh,
    gate?.status ?? "unknown",
    translateGateStatus(gate?.status),
    gate?.notes ?? joinList(gate?.signals ?? gate?.surfaces ?? gate?.missing ?? []),
    translateKnownText(gate?.notes ?? joinList(gate?.signals ?? gate?.surfaces ?? gate?.missing ?? [])),
  );
}

function workbenchRow(slot, label, labelZh, target, targetZh, status, statusZh, nextAction, nextActionZh, metric, metricZh) {
  return {
    slot,
    label,
    labelZh,
    target: valueOrDash(target),
    targetZh: valueOrDash(targetZh ?? translateKnownText(target)),
    status,
    statusZh,
    nextAction,
    nextActionZh,
    metric,
    metricZh,
  };
}

function pricingRows(pricing = {}) {
  const tiers = pricing.tiers ?? [];
  if (!tiers.length) {
    return [
      workbenchRow(1, "First paid offer", "第一版付费报价", pricing.servicePriceRange ?? "TBD", translateKnownText(pricing.servicePriceRange ?? "待定"), "not-started", "未开始", "Quote a fixed SKU pack.", "给固定 SKU 图片包报价。", "buyer accepts or negotiates", "买家接受或议价"),
    ];
  }
  return tiers.map((tier, index) => workbenchRow(
    index + 1,
    tier.name ?? `Tier ${index + 1}`,
    translateKnownText(tier.name ?? `套餐 ${index + 1}`),
    tier.price ?? "TBD",
    translateKnownText(tier.price ?? "待定"),
    "not-started",
    "未开始",
    joinList(tier.includes),
    translateKnownText(joinList(tier.includes)),
    "paid conversion and revision count",
    "付费转化和修改次数",
  ));
}

function aarrrRows(aarrr = {}) {
  const labels = {
    acquisition: ["Acquisition", "获客"],
    activation: ["Activation", "激活"],
    revenue: ["Revenue", "收入"],
    retention: ["Retention", "留存"],
    referral: ["Referral", "推荐"],
    feedback: ["Feedback", "反馈"],
  };
  return Object.entries(labels).map(([key, [label, labelZh]], index) => workbenchRow(
    index + 1,
    label,
    labelZh,
    aarrr[key]?.target ?? "target not set",
    translateKnownText(aarrr[key]?.target ?? "目标未设置"),
    "not-started",
    "未开始",
    "Record actual value and evidence source this week.",
    "记录本周真实数值和证据来源。",
    "actual vs target",
    "实际值对比目标",
  ));
}

function objectCards(object = {}, zhLabels = {}) {
  const entries = Object.entries(object ?? {}).filter(([, value]) => value != null && value !== "");
  if (!entries.length) return [workbenchCard("Record needed", "需要记录", "No structured data captured.", "暂无结构化数据。")];
  return entries.map(([key, value]) => workbenchCard(titleize(key), zhLabels[key] ?? translateKnownText(titleize(key)), value, translateKnownText(value)));
}

function summarizeObject(object = {}) {
  const entries = Object.entries(object ?? {}).filter(([, value]) => value != null && value !== "" && (!Array.isArray(value) || value.length));
  return entries.length ? entries.map(([key, value]) => `${titleize(key)}: ${Array.isArray(value) ? value.join(", ") : value}`).join("; ") : "No data captured";
}

function joinList(items, fallback = "No data captured") {
  const values = (items ?? []).filter((item) => item != null && item !== "");
  return values.length ? values.join("; ") : fallback;
}

function valueOrDash(value) {
  if (Array.isArray(value)) return value.length ? value.join("; ") : "—";
  if (value == null || value === "") return "—";
  return String(value);
}

function translateGateStatus(status) {
  const labels = {
    supported: "已支持",
    partially_supported: "部分支持",
    unsupported: "不支持",
    unknown: "未知",
  };
  return labels[status] ?? translateKnownText(status ?? "unknown");
}

function buildDiscoverValidationPlan(stage) {
  const candidate = stage.topCandidates?.[0] ?? stage.candidates?.[0] ?? {};
  const title = candidate.title ?? "selected opportunity";
  const titleZh = candidate.titleZh ?? translateKnownText(title);
  const targetUser = candidate.targetUser ?? "reachable users";
  const targetUserZh = candidate.targetUserZh ?? translateKnownText(targetUser);
  const channel = candidate.firstReachableChannel ?? "source communities";
  const channelZh = candidate.firstReachableChannelZh ?? translateKnownText(channel);
  const experiment = candidate.recommendedNextExperiment ?? "Run direct outreach before building.";
  const experimentZh = translateKnownText(experiment);

  return [
    {
      day: 1,
      label: "Narrow ICP",
      labelZh: "锁定 ICP",
      action: `Select "${title}" as the only validation target and write one painful-situation script for ${targetUser}.`,
      actionZh: `只选择“${titleZh}”作为本轮验证对象，为${targetUserZh}写一版痛点脚本。`,
      output: "One ICP note, one problem statement, and one disqualification list.",
      outputZh: "1 份 ICP 说明、1 句问题陈述、1 份排除名单。",
      successMetric: "Problem sentence can be understood without product explanation.",
      successMetricZh: "不解释产品，对方也能理解问题句。",
    },
    {
      day: 2,
      label: "Draft outreach",
      labelZh: "撰写触达话术",
      action: `Turn the evidence into two short replies for ${channel}.`,
      actionZh: `把证据改写成 2 条适合${channelZh}的短回复。`,
      output: "Two public replies and one private follow-up note.",
      outputZh: "2 条公开回复，1 条私信跟进话术。",
      successMetric: "Each reply names the exact broken workflow and asks for one artifact.",
      successMetricZh: "每条回复都点名具体坏掉的流程，并索要一个真实工件。",
    },
    {
      day: 3,
      label: "Contact 10 users",
      labelZh: "触达 10 位用户",
      action: experiment,
      actionZh: experimentZh,
      output: "10 logged replies with source URL, user role, pain, and response status.",
      outputZh: "记录 10 条触达：来源 URL、用户角色、痛点、回复状态。",
      successMetric: "At least 3 qualified replies or 2 calls booked.",
      successMetricZh: "至少 3 个有效回复，或预约 2 次通话。",
    },
    {
      day: 4,
      label: "Offer paid audit",
      labelZh: "提出付费人工审计",
      action: "Offer a small paid manual diagnostic instead of a product demo.",
      actionZh: "不要演示产品，直接提出一次小额付费人工诊断。",
      output: "One fixed-price audit offer with scope, turnaround time, and refund boundary.",
      outputZh: "1 个固定价格审计报价，包含范围、交付时限和退款边界。",
      successMetric: "One buyer accepts payment or asks concrete purchase questions.",
      successMetricZh: "有 1 位买家接受付款，或提出具体购买问题。",
    },
    {
      day: 5,
      label: "Run interviews",
      labelZh: "访谈与异议记录",
      action: "Interview qualified responders and collect the last broken workflow artifact.",
      actionZh: "访谈有效回复者，收集最近一次坏掉的工作流工件。",
      output: "Interview notes, objection log, and before/after manual audit outline.",
      outputZh: "访谈记录、异议清单、人工审计前后对照大纲。",
      successMetric: "Pain is tied to time, money, customer loss, compliance, or missed revenue.",
      successMetricZh: "痛点能对应时间、金钱、客户流失、合规或收入损失。",
    },
    {
      day: 6,
      label: "Compare cases",
      labelZh: "对照成功案例",
      action: "Compare GitHub and Product Hunt public cases against the buyer pain found in outreach.",
      actionZh: "把 GitHub 和 Product Hunt 公开案例与触达中发现的买家痛点做对照。",
      output: "Copyable patterns, non-copyable advantages, and a sharper wedge statement.",
      outputZh: "可复制模式、不可复制优势、以及更尖锐的切入点表述。",
      successMetric: "A copyable wedge survives after removing audience, timing, and ranking effects.",
      successMetricZh: "去掉受众、时机和排名加成后，仍然存在可复制切入点。",
    },
    {
      day: 7,
      label: "Decision gate",
      labelZh: "决策关口",
      action: "Score replies, willingness to pay, artifact quality, and delivery feasibility before entering Build.",
      actionZh: "进入构建前，评分回复质量、付费意向、工件质量和交付可行性。",
      output: "Continue, pivot, or pause decision with direct evidence links.",
      outputZh: "带直接证据链接的继续、转向或暂停决策。",
      successMetric: "Continue only with buyer evidence and a paid or near-paid manual test.",
      successMetricZh: "只有拿到买家证据，以及付费或接近付费的人工测试，才继续。",
    },
  ];
}

function uniqueFlat(groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

function localizedStageSummary(stageKey, report, analysis) {
  if (stageKey === "discover") {
    const candidate = analysis?.topCandidates?.[0] ?? analysis?.opportunityBacklog?.[0];
    if (candidate) {
      const type = candidate.typeZh ?? candidateTypeLabelsZh[candidate.type] ?? "候选机会";
      return `排名第一的${type}候选机会得分 ${candidate.score}：${candidate.titleZh ?? translateKnownText(candidate.title)}。`;
    }
  }
  if (report?.reasoning) return translateKnownText(report.reasoning);
  return "这个阶段还没有生成报告。";
}

function translateKnownText(value) {
  if (value == null) return value;
  const text = String(value);
  const exact = {
    "AI Ecommerce Image Optimizer": "AI 电商图片优化器",
    "Turn one raw product photo into platform-specific product image sets for marketplace sellers.": "将一张原始商品图转换成适配各平台的电商图片套件。",
    "Opportunity radar": "机会雷达",
    "Two candidate opportunities are ready for validation.": "两个候选机会已准备进入验证。",
    "A top candidate is ready for validation.": "一个优先候选机会已准备进入验证。",
    "Automation failure audit trail for small B2B onboarding workflows": "小型 B2B 客户导入工作流的自动化失败审计记录",
    "Workflow failure audit trail": "工作流失败审计记录",
    "small B2B operators using automation workflows": "使用自动化工作流的小型 B2B 运营者",
    "GitHub users searching for this workflow": "在 GitHub 搜索该工作流的用户",
    "reddit:r/SaaS": "Reddit r/SaaS",
    "hacker-news:Hacker News": "Hacker News",
    "GitHub search / open-source distribution": "GitHub 搜索 / 开源分发",
    "Community pain evidence": "社区痛点证据",
    "Repeated automation workflow complaints found.": "发现了重复出现的自动化工作流抱怨。",
    "Public posts do not prove paid demand.": "公开帖子不能证明付费需求。",
    "Public community posts can overrepresent vocal users.": "公共社区帖子可能放大少数高声量用户的问题。",
    "Successful public cases may depend on founder audience, timing, or existing distribution.": "公开成功案例可能依赖创始人受众、时机或既有分发。",
    "Discovery candidates must still pass validation before build work.": "发现阶段候选仍需通过验证后才能进入构建。",
    "Validate the top candidate.": "验证优先候选机会。",
    "Validate the top pain-led candidate with direct replies.": "通过直接回复验证优先痛点驱动候选机会。",
    "Reply to 10 operators and offer a paid manual audit.": "回复 10 位运营者，并提供一次付费的人工审计。",
    "Reply to 10 operators in the source communities and offer a paid manual audit of one broken onboarding workflow.": "在来源社区回复 10 位运营者，提供一次付费的故障客户导入工作流人工审计。",
    "Create a validation brief from the selected candidate.": "基于选中的候选机会创建验证简报。",
    "Collect direct buyer pain and paid-intent evidence before building.": "在构建前收集直接买家痛点和付费意向证据。",
    "No data captured": "暂无数据",
    "No data captured.": "暂无数据。",
    "target not set": "目标未设置",
    "not set": "未设置",
    "not-enough-data": "数据不足",
    "unknown": "未知",
    "partial": "部分完成",
    "trend": "趋势",
    "search": "搜索",
    "platform-rule": "平台规则",
    "paid-alternative": "付费替代方案",
    "real-user-pain": "真实用户痛点",
    "willingness-to-pay": "付费意愿",
    "reachability": "可触达性",
    "payment": "付款",
    "Cross-border Amazon sellers first; Taobao/JD later.": "先聚焦跨境 Amazon 卖家，淘宝 / 京东后置。",
    "Product image sets must be attractive, compliant, and platform-specific.": "商品图片套件必须好看、合规，并适配具体平台。",
    "Manual editing, outsourced image services, and generic AI tools.": "人工修图、外包图片服务和通用 AI 工具。",
    "Marketplace-ready image pack from one raw product photo.": "用一张原始商品图产出平台可用的图片包。",
    "Amazon seller communities and cross-border ecommerce operator groups.": "Amazon 卖家社区和跨境电商运营群。",
    "Continue only when at least one direct buyer-pain row and one paid-intent or payment row are present.": "至少拿到 1 条直接买家痛点证据，以及 1 条付费意向或付款证据后才继续。",
    "paid manual test": "付费人工测试",
    "paid SKU image pack": "付费 SKU 图片包",
    "buyer accepts or negotiates": "买家接受或议价",
    "paid conversion and revision count": "付费转化和修改次数",
    "B2B small merchant": "B2B 小商户",
    "seller/operator or ecommerce VA": "卖家 / 运营者 / 电商助理",
    "per new SKU, seasonal refresh, or marketplace rejection event": "每个新 SKU、季节性更新或平台驳回事件",
    "freelancer, agency, ecommerce image editor, or generic AI image tool": "自由职业者、代理机构、电商修图服务或通用 AI 图片工具",
    "platform-ready SKU image pack plus compliance notes": "平台可用的 SKU 图片包和合规说明",
    "productized-service-to-saas": "产品化服务到 SaaS",
    "Manual service validates paid demand and creates before/after datasets before investing in full workflow automation.": "先用人工服务验证付费需求，并沉淀前后对照数据，再投入完整流程自动化。",
    "manual outreach and community replies first": "先做人工触达和社区回复",
    "paid ads only after conversion is proven": "付费广告等转化被证明后再做",
    "repeat sellers refresh images monthly or per launch": "复购卖家按月或按上新周期更新图片",
    "payback must happen on first SKU pack in service phase": "服务阶段必须在第一单 SKU 图片包中回本",
    "2 paid SKU packs from real sellers": "来自真实卖家的 2 个付费 SKU 图片包",
    "20 paid SKU packs or 5 repeat sellers": "20 个付费 SKU 图片包，或 5 个复购卖家",
    "repeatable seller acquisition channel plus batch workflow": "可重复的卖家获客渠道和批量工作流",
    "0 paid SKU packs after 15 qualified seller conversations": "15 次有效卖家对话后仍没有 0 个付费 SKU 图片包",
    "Deliver one Amazon-ready SKU image pack from one raw product photo.": "用一张原始商品图交付一套 Amazon 可用的 SKU 图片包。",
    "intake form": "收集表单",
    "prompt templates": "提示词模板",
    "GPT Image 2 generation/editing": "GPT Image 2 生成 / 编辑",
    "human review checklist": "人工审核清单",
    "delivery folder": "交付文件夹",
    "multi-platform self-serve editor": "多平台自助编辑器",
    "automatic listing upload": "自动上传 listing",
    "team workspace": "团队工作区",
    "full brand kit system": "完整品牌套件系统",
    "Human designer/operator edits outputs before delivery.": "交付前由人工设计师或运营者编辑输出。",
    "submit product photo and listing context": "提交商品图和 listing 上下文",
    "choose platform and pack type": "选择平台和图片包类型",
    "operator generates variants": "运营者生成变体",
    "human reviews compliance and fidelity": "人工审核合规性和产品保真度",
    "seller receives image pack": "卖家收到图片包",
    "main image follows Amazon white-background rule checklist": "主图符合 Amazon 白底规则清单",
    "secondary images do not misrepresent product quantity, size, or features": "辅图不得误导商品数量、尺寸或功能",
    "seller can request one revision": "卖家可申请 1 次修改",
    "delivery includes source prompts and compliance notes": "交付包含源提示词和合规说明",
    "rule approval": "规则审核",
    "misrepresentation review": "误导性审核",
    "customer delivery": "客户交付",
    "refund/revision decision": "退款 / 修改决策",
    "transparent products": "透明商品",
    "reflective products": "反光商品",
    "text-heavy packaging": "文字密集包装",
    "multi-pack quantities": "多件装数量",
    "licensed characters": "授权角色",
    "customer product IP": "客户商品知识产权",
    "unreleased SKU photos": "未发布 SKU 图片",
    "brand assets": "品牌资产",
    "misleading generated claims": "误导性生成声明",
    "write landing page": "撰写落地页",
    "create intake form": "创建收集表单",
    "prepare 3 demo before/after packs": "准备 3 套前后对照演示图片包",
    "draft refund/revision policy": "起草退款 / 修改政策",
    "post to seller groups": "发布到卖家群",
    "DM 10 qualified sellers": "私信 10 位有效卖家",
    "offer 5 discounted paid packs": "提供 5 个折扣付费图片包",
    "deliver packs": "交付图片包",
    "measure revisions": "衡量修改次数",
    "ask for repeat-intent": "询问复购意向",
    "collect rule edge cases": "收集规则边界案例",
    "international": "国际市场",
    "china-mainland": "中国大陆",
    "First wedge is cross-border Amazon; China seller channels remain a secondary validation track.": "第一切入点是跨境 Amazon；中国卖家渠道作为第二验证线。",
    "amazon-product-image-pack": "Amazon 商品图片包",
    "marketplace-image-compliance-checklist": "平台图片合规清单",
    "Amazon Product Image Pack From One Raw Photo": "用一张原图生成 Amazon 商品图片包",
    "Marketplace Image Compliance Checklist": "平台图片合规清单",
    "Generate and review Amazon-ready product image sets from one raw product photo.": "从一张原始商品图生成并审核 Amazon 可用图片套件。",
    "direct seller outreach": "直接卖家触达",
    "seller communities": "卖家社区",
    "SEO": "SEO",
    "Specific SKU image audit offers will outperform generic AI-image pitches.": "具体的 SKU 图片审计报价会优于泛泛的 AI 图片推销。",
    "A useful image compliance checklist can start conversations without looking like spam.": "实用的图片合规清单能开启对话，同时减少广告感。",
    "Long-tail compliance queries can generate later inbound demand.": "长尾合规搜索词可以带来后续自然需求。",
    "qualified calls and paid SKU packs": "有效通话和付费 SKU 图片包",
    "replies, audits requested, paid packs": "回复、审计请求和付费图片包",
    "Search Console impressions and booked calls": "Search Console 展现和预约通话",
    "draft seller-specific audits": "起草卖家定制审计",
    "summarize platform image rules": "总结平台图片规则",
    "generate demo variants": "生成演示变体",
    "final outreach": "最终触达",
    "seller asset review": "卖家素材审核",
    "claims about compliance": "合规相关声明",
    "refund/revision decision": "退款 / 修改决策",
    "qualified_seller_reply": "有效卖家回复",
    "book_call": "预约通话",
    "paid_sku_pack": "付费 SKU 图片包",
    "first_delivery_accepted": "首次交付被接受",
    "repeat_order_intent": "复购意向",
    "weekly": "每周",
    "10 qualified seller replies": "10 个有效卖家回复",
    "5 calls or image audits": "5 次通话或图片审计",
    "2 paid SKU packs": "2 个付费 SKU 图片包",
    "1 repeat-intent signal": "1 个复购意向信号",
    "5 rule or workflow objections": "5 条规则或流程异议",
    "price sensitivity": "价格敏感",
    "compliance trust": "合规信任",
    "product fidelity": "产品保真度",
    "revision speed": "修改速度",
    "No real seller payment or delivery data yet.": "还没有真实卖家付款或交付数据。",
    "5 seller paid SKU pack sprint": "5 位卖家的付费 SKU 图片包冲刺",
    "Prove sellers will pay for a reviewed Amazon-ready image pack.": "证明卖家愿意为人工审核过的 Amazon 可用图片包付费。",
    "2 paid packs and average revision count under 2": "2 个付费图片包，且平均修改次数低于 2",
    "0 payments after 15 qualified seller conversations": "15 次有效卖家对话后仍然 0 付款",
    "no-data": "无数据",
    "go back to validation with paid manual service": "回到验证阶段，用付费人工服务补真实证据",
    "actual vs target": "实际值对比目标",
    "Operate metrics are mocked; the real next move is a one-week validation sprint with paid SKU packs and revision economics.": "运营指标仍是模拟数据；真正的下一步是跑一周验证冲刺，拿到付费 SKU 图片包和修改成本数据。",
    "Mocked paid-intent result for pipeline exercise: 3 of 10 qualified sellers would try a paid SKU image pack at a low entry price.": "用于流程练习的模拟付费意向：10 位有效卖家中有 3 位愿意以低门槛价格尝试付费 SKU 图片包。",
    "Mocked seller pain for pipeline exercise: image production is repetitive, platform-specific, and compliance-sensitive.": "用于流程练习的模拟卖家痛点：图片生产重复、平台差异明显，并且对合规敏感。",
    "Mocked metrics cannot justify build investment.": "模拟指标不能支撑构建投入。",
    "If revision count is high, the service may become a low-margin agency.": "如果修改次数过高，服务可能变成低毛利代理业务。",
    "If product fidelity fails, the whole wedge weakens.": "如果产品保真度不稳定，整个切入点会变弱。",
    "Run the one-week validation sprint.": "运行一周验证冲刺。",
    "Record every seller reply, call, payment, delivery, and revision.": "记录每一次卖家回复、通话、付款、交付和修改。",
    "Re-run validate and business-model stages with real evidence.": "用真实证据重新跑验证和商业模式阶段。",
    "Only build automation for repeated manual steps.": "只为重复出现的人工步骤构建自动化。",
    "Acquisition": "获客",
    "Activation": "激活",
    "Revenue": "收入",
    "Retention": "留存",
    "Referral": "推荐",
    "Feedback": "反馈",
  };
  if (exact[text]) return exact[text];
  if (text.includes(";")) {
    return text
      .split(";")
      .map((part) => translateKnownText(part.trim()))
      .join("；");
  }
  if (text.includes(", ")) {
    return text
      .split(", ")
      .map((part) => translateKnownText(part.trim()))
      .join("，");
  }
  if (text.startsWith("Top pain-led candidate scored ")) {
    return text
      .replace(/^Top pain-led candidate scored (\d+): /, "排名第一的痛点驱动候选机会得分 $1：")
      .replace("Automation failure audit trail for small B2B onboarding workflows", "小型 B2B 客户导入工作流的自动化失败审计记录");
  }
  if (text.startsWith("Copyable wedge from ")) {
    return text.replace(/^Copyable wedge from /, "可复制切入点：");
  }
  if (text.includes(": ")) {
    const [prefix, ...rest] = text.split(": ");
    const translatedPrefix = translateKnownText(prefix);
    return `${translatedPrefix}: ${rest.join(": ")}`;
  }
  return text;
}

function cleanTextSnippet(value, maxLength = 260) {
  if (value == null) return "";
  const decoded = decodeHtmlEntities(String(value));
  const text = decoded
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function evidenceSummaries(evidenceRefs, evidenceById) {
  return evidenceRefs
    .map((id) => evidenceById.get(id))
    .filter(Boolean)
    .map((item) => item.summary || item.quote || `${item.sourceName ?? "Evidence"}: ${item.id}`);
}

function normalizeStageOrder(stageOrder) {
  const order = stageOrder?.length ? stageOrder : defaultStageOrder;
  const withDiscover = order.includes("discover") ? order : ["discover", ...order];
  return [...new Set(withDiscover)];
}

function validateTemplateMarkers(html) {
  const required = [
    "class=\"stage-rail\"",
    "data-stage-tab",
    "id=\"stage-panel\"",
    "function switchStage",
    "const stageChartInstances",
    "id=\"playbook-data\"",
  ];
  for (const token of required) {
    if (!html.includes(token)) {
      throw new Error(`Rendered HTML missing required template marker: ${token}`);
    }
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath, fallback) {
  try {
    await access(filePath, fsConstants.F_OK);
    return await readJson(filePath);
  } catch {
    return fallback;
  }
}

function titleize(value) {
  return String(value)
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const name = token.slice(2);
    const value = argv[index + 1]?.startsWith("--") ? true : argv[index + 1] ?? true;
    if (value !== true) index += 1;
    args[name] = value;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const playbookDir = path.resolve(args["playbook-dir"] ?? path.join(repoRoot, "playbook"));
  const templatePath = path.resolve(args.template ?? path.join(repoRoot, "skills", "startup-playbook-artifacts", "templates", "index.html"));
  const outputPath = path.resolve(args.output ?? path.join(playbookDir, "index.html"));
  const result = await renderPlaybookIndex({ playbookDir, templatePath, outputPath });
  console.log(`wrote ${result.outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
