const PAIN_SIGNAL_RULES = [
  {
    type: "pricing-pain",
    label: "Pricing pain",
    pattern: /\b(too expensive|pricey|pricing|costs? too much|can't afford|cannot afford|overpriced)\b/i,
  },
  {
    type: "alternative-seeking",
    label: "Alternative seeking",
    pattern: /\b(alternative|instead of|replace|replacement|switch from|switching from|dupe|similar tool)\b/i,
  },
  {
    type: "manual-workflow",
    label: "Manual workflow",
    pattern: /\b(manual|manually|spreadsheet|copy.?paste|reconcile|csv|every friday|by hand)\b/i,
  },
  {
    type: "repeated-question",
    label: "Repeated question",
    pattern: /\b(what do you use|how are you|ask hn|anyone else|recommend|which tool|should i)\b/i,
  },
  {
    type: "integration-friction",
    label: "Integration friction",
    pattern: /\b(api|integration|webhook|sync|stripe|breaks when|one api changes)\b/i,
  },
  {
    type: "migration-friction",
    label: "Migration friction",
    pattern: /\b(migrate|migration|moving from|switching to|import from|export from)\b/i,
  },
  {
    type: "purchase-intent",
    label: "Purchase intent",
    pattern: /\b(would pay|pay for|paid|budget|buy|subscription|procure|purchase)\b/i,
  },
  {
    type: "tool-complaint",
    label: "Tool complaint",
    pattern: /\b(keeps failing|keeps breaking|doesn't work|does not work|broken|buggy|unreliable|fails\b)\b/i,
  },
];

const CASE_SIGNAL_RULES = [
  {
    type: "revenue-signal",
    pattern: /\$\s?\d|mrr|arr|revenue|profit/i,
  },
  {
    type: "pricing-signal",
    pattern: /\$\s?\d|pricing|price|\/mo|per month|subscription/i,
  },
  {
    type: "github-distribution",
    pattern: /\bgithub|open.?source|readme|repository\b/i,
  },
  {
    type: "seo-channel",
    pattern: /\bseo|search|google|long-tail|long tail\b/i,
  },
  {
    type: "community-channel",
    pattern: /\breddit|hacker news|indie hackers|community|forum|discord\b/i,
  },
  {
    type: "manual-service",
    pattern: /\bmanual|concierge|service|consulting|done-for-you|productized\b/i,
  },
];

const RISK_WEIGHT = {
  low: 2,
  medium: 8,
  high: 16,
};

const MOAT_WEIGHT = {
  low: 0,
  medium: 6,
  high: 14,
};

export function detectPainSignals(post) {
  const text = searchableText([post.title, post.excerpt, post.text, post.body]);
  return PAIN_SIGNAL_RULES
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => ({
      type: rule.type,
      label: rule.label,
      sourceId: post.id ?? null,
      sourceName: sourceLabel(post),
      url: post.url ?? null,
      excerpt: cleanText(post.excerpt || post.text || post.title || "", 220),
    }));
}

export function analyzeOpportunityRadar(input, options = {}) {
  const generatedAt = options.generatedAt ?? input.generatedAt ?? new Date().toISOString();
  const project = input.project ?? options.project ?? "International Opportunity Radar";
  const communityItems = (input.communities ?? input.posts ?? []).map(normalizeCommunityItem).filter(Boolean);
  const caseItems = (input.cases ?? []).map(normalizeCaseItem).filter(Boolean);
  const communitySignals = communityItems.flatMap((post) => detectPainSignals(post));
  const caseSignals = caseItems.map(extractCaseSignals);
  const candidates = [];

  const painCandidate = buildPainLedCandidate(communityItems, communitySignals);
  if (painCandidate) candidates.push(painCandidate);

  const caseCandidate = buildCaseLedCandidate(caseSignals);
  if (caseCandidate) candidates.push(caseCandidate);

  candidates.sort((left, right) => right.score - left.score || typeRank(left.type) - typeRank(right.type));

  return {
    project,
    generatedAt,
    sourceCoverage: {
      communities: summarizeSources(communityItems, (item) => sourceLabel(item)),
      cases: summarizeSources(caseItems, (item) => item.source),
    },
    signalSummary: {
      communityItems: communityItems.length,
      caseItems: caseItems.length,
      painSignals: communitySignals.length,
      caseSignals: caseSignals.reduce((count, item) => count + item.signalTypes.length, 0),
      candidateCount: candidates.length,
      painLedCandidates: candidates.filter((candidate) => candidate.type === "pain-led").length,
      caseLedCandidates: candidates.filter((candidate) => candidate.type === "case-led").length,
    },
    communitySignals,
    caseSignals,
    candidates,
    topCandidates: candidates.slice(0, Number(options.topCandidates ?? 5)),
  };
}

export function scoreOpportunity(input) {
  const evidenceCount = Number(input.evidenceCount ?? 0);
  const sourceCount = Number(input.sourceCount ?? 0);
  const signalCount = new Set(input.signalTypes ?? []).size;
  const copyableCount = Number(input.copyableCount ?? 0);
  const nonCopyableCount = Number(input.nonCopyableCount ?? 0);

  const painHeat = input.type === "pain-led"
    ? clamp(evidenceCount * 9 + sourceCount * 6 + signalCount * 4, 0, 40)
    : clamp(signalCount * 2, 0, 12);
  const caseProof = input.type === "case-led"
    ? clamp(copyableCount * 7 + signalCount * 4 + evidenceCount * 3, 0, 34)
    : clamp(signalCount + evidenceCount, 0, 12);
  const reachableChannel = sourceCount > 0 ? clamp(8 + sourceCount * 3, 8, 16) : 0;
  const soloFounderFeasibility = clamp(12 + copyableCount * 2 - nonCopyableCount * 2, 4, 18);
  const speedToValidation = signalCount > 0 ? 14 : 6;
  const cloneRiskPenalty = RISK_WEIGHT[input.cloneRisk] ?? RISK_WEIGHT.medium;
  const moatDependencyPenalty = MOAT_WEIGHT[input.moatDependency] ?? MOAT_WEIGHT.medium;
  const total = clamp(
    painHeat + caseProof + reachableChannel + soloFounderFeasibility + speedToValidation - cloneRiskPenalty - moatDependencyPenalty,
    0,
    100,
  );

  return {
    painHeat,
    caseProof,
    reachableChannel,
    soloFounderFeasibility,
    speedToValidation,
    cloneRiskPenalty,
    moatDependencyPenalty,
    total,
  };
}

function buildPainLedCandidate(posts, signals) {
  if (signals.length === 0) return null;

  const signalTypes = unique(signals.map((signal) => signal.type));
  const sourcePosts = posts.filter((post) => signals.some((signal) => signal.sourceId === post.id));
  const evidencePosts = [...sourcePosts]
    .sort((left, right) => (right.comments + right.score) - (left.comments + left.score));
  const sourceCount = new Set(evidencePosts.map((post) => sourceLabel(post))).size;
  const identity = inferPainIdentity(evidencePosts);
  const scores = scoreOpportunity({
    type: "pain-led",
    evidenceCount: evidencePosts.length,
    sourceCount,
    signalTypes,
    copyableCount: 1,
    nonCopyableCount: 0,
    cloneRisk: "low",
    moatDependency: "low",
  });

  return {
    id: `opp-${slugify(identity.slug)}`,
    type: "pain-led",
    title: identity.title,
    targetUser: identity.targetUser,
    painfulSituation: identity.painfulSituation,
    promiseCandidate: identity.promiseCandidate,
    firstReachableChannel: sourceLabel(sourcePosts[0]),
    recommendedNextExperiment: identity.recommendedNextExperiment,
    signalTypes,
    evidence: evidencePosts.slice(0, 5).map((post) => evidenceFromPost(post)),
    sourcePostIds: evidencePosts.map((post) => post.id),
    sourceCaseIds: [],
    copyable: ["Use raw community language and offer a manual diagnostic before building software."],
    whatNotToCopy: ["Do not treat community discussion volume as paid demand."],
    scores,
    score: scores.total,
    cloneRisk: "low",
    moatDependency: "low",
  };
}

function buildCaseLedCandidate(caseSignals) {
  if (caseSignals.length === 0) return null;

  const ranked = [...caseSignals].sort((left, right) => right.score.total - left.score.total);
  const selected = ranked[0];
  const caseItem = selected.case;

  return {
    id: `opp-case-${slugify(caseItem.title || caseItem.id || "public-case")}`,
    type: "case-led",
    title: `Copyable wedge from ${caseItem.title}`,
    targetUser: caseItem.targetUser,
    painfulSituation: caseItem.pain || "A public case exposes a repeatable startup wedge.",
    promiseCandidate: caseItem.productShape || "Adapt the proven workflow to a narrower segment.",
    firstReachableChannel: caseItem.firstAcquisitionChannel || selected.firstReachableChannel,
    recommendedNextExperiment: selected.validationShortcut,
    signalTypes: selected.signalTypes,
    evidence: [evidenceFromCase(caseItem)],
    sourcePostIds: [],
    sourceCaseIds: [caseItem.id],
    copyable: selected.copyable,
    whatNotToCopy: selected.whatNotToCopy,
    validationShortcut: selected.validationShortcut,
    scores: selected.score,
    score: selected.score.total,
    cloneRisk: selected.cloneRisk,
    moatDependency: selected.moatDependency,
  };
}

function extractCaseSignals(caseItem) {
  const corpus = searchableText([
    caseItem.title,
    caseItem.targetUser,
    caseItem.pain,
    caseItem.productShape,
    caseItem.firstAcquisitionChannel,
    caseItem.pricing,
    caseItem.revenue,
    caseItem.validationMove,
    ...(caseItem.copyable ?? []),
    ...(caseItem.notCopyable ?? []),
  ]);
  const signalTypes = CASE_SIGNAL_RULES
    .filter((rule) => rule.pattern.test(corpus))
    .map((rule) => rule.type);
  const cloneRisk = inferCloneRisk(caseItem);
  const moatDependency = inferMoatDependency(caseItem);
  const copyable = normalizeStringList(caseItem.copyable);
  const whatNotToCopy = normalizeStringList(caseItem.notCopyable);
  const score = scoreOpportunity({
    type: "case-led",
    evidenceCount: 1,
    sourceCount: 1,
    signalTypes,
    copyableCount: copyable.length,
    nonCopyableCount: whatNotToCopy.length,
    cloneRisk,
    moatDependency,
  });

  return {
    case: caseItem,
    signalTypes,
    copyable,
    whatNotToCopy,
    cloneRisk,
    moatDependency,
    firstReachableChannel: caseItem.firstAcquisitionChannel || caseItem.source || "public case source",
    validationShortcut: caseItem.validationMove || "Recreate the first validation move in a narrower segment within one week.",
    score,
  };
}

function inferPainIdentity(posts) {
  const text = searchableText(posts.flatMap((post) => [post.title, post.excerpt]));
  if (/\b(zapier|automation|workflow|onboarding|api|webhook|sync)\b/i.test(text)) {
    return {
      slug: "automation-failure-audit-trail",
      title: "Automation failure audit trail for small B2B onboarding workflows",
      targetUser: "small B2B operators using automation workflows",
      painfulSituation: "failed multi-step automations create brittle onboarding workflows and manual spreadsheet reconciliation",
      promiseCandidate: "A lightweight audit trail that flags failed automation runs and turns them into a manual recovery queue.",
      recommendedNextExperiment: "Reply to 10 operators in the source communities and offer a paid manual audit of one broken onboarding workflow.",
    };
  }

  const community = posts[0]?.community || "public community";
  const phrase = cleanText(posts[0]?.title || "Repeated community pain", 96);
  return {
    slug: phrase,
    title: `Pain cluster from ${community}: ${phrase}`,
    targetUser: `${community} participants with repeated workflow pain`,
    painfulSituation: phrase,
    promiseCandidate: "Manual diagnostic first, product automation only after paid validation.",
    recommendedNextExperiment: "Contact commenters from the source thread and ask for one recent example, current workaround, and budget.",
  };
}

function inferCloneRisk(caseItem) {
  const text = searchableText([caseItem.title, ...(caseItem.copyable ?? []), ...(caseItem.notCopyable ?? [])]);
  if (/generic|clone|another/i.test(text)) return "high";
  if ((caseItem.copyable ?? []).length >= 3) return "medium";
  return "high";
}

function inferMoatDependency(caseItem) {
  const text = searchableText([caseItem.firstAcquisitionChannel, ...(caseItem.notCopyable ?? [])]);
  if (/large existing audience|personal brand|network effect|regulated|proprietary data/i.test(text)) return "high";
  if (/repository age|brand|audience/i.test(text)) return "medium";
  return "low";
}

function normalizeCommunityItem(raw) {
  if (!raw) return null;
  const title = cleanText(raw.title ?? raw.name ?? "", 180);
  const excerpt = cleanText(raw.excerpt ?? raw.text ?? raw.body ?? raw.description ?? "", 360);
  if (!title && !excerpt) return null;
  return {
    id: raw.id ?? `${raw.source ?? "community"}:${slugify(title || excerpt).slice(0, 48)}`,
    source: raw.source ?? "community",
    community: raw.community ?? raw.subreddit ?? raw.forum ?? raw.sourceName ?? "public community",
    title,
    excerpt,
    score: toNumber(raw.score),
    comments: toNumber(raw.comments ?? raw.num_comments),
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    url: raw.url ?? null,
  };
}

function normalizeCaseItem(raw) {
  if (!raw) return null;
  const title = cleanText(raw.title ?? raw.name ?? "", 180);
  if (!title) return null;
  return {
    id: raw.id ?? `case:${slugify(title).slice(0, 48)}`,
    source: raw.source ?? raw.sourceName ?? "public-case",
    title,
    url: raw.url ?? null,
    targetUser: cleanText(raw.targetUser ?? raw.user ?? raw.segment ?? "unknown", 140),
    pain: cleanText(raw.pain ?? raw.jobToBeDone ?? raw.problem ?? "", 220),
    productShape: cleanText(raw.productShape ?? raw.product ?? raw.productType ?? "", 160),
    firstAcquisitionChannel: cleanText(raw.firstAcquisitionChannel ?? raw.channel ?? "", 160),
    pricing: cleanText(raw.pricing ?? raw.price ?? "", 100),
    revenue: cleanText(raw.revenue ?? raw.revenueSignal ?? "", 100),
    validationMove: cleanText(raw.validationMove ?? raw.validation ?? "", 180),
    copyable: normalizeStringList(raw.copyable ?? raw.copyablePatterns),
    notCopyable: normalizeStringList(raw.notCopyable ?? raw.nonCopyable ?? raw.moatDependencies),
  };
}

function evidenceFromPost(post) {
  return {
    id: post.id,
    sourceType: "community-comment",
    sourceName: sourceLabel(post),
    url: post.url,
    title: post.title,
    excerpt: post.excerpt,
    metric: `${post.comments} comments / ${post.score} score`,
  };
}

function evidenceFromCase(caseItem) {
  return {
    id: caseItem.id,
    sourceType: "case-pattern",
    sourceName: caseItem.source,
    url: caseItem.url,
    title: caseItem.title,
    revenue: caseItem.revenue || null,
    pricing: caseItem.pricing || null,
  };
}

function summarizeSources(items, getKey) {
  const counts = new Map();
  for (const item of items) {
    const key = getKey(item) || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((left, right) => right.count - left.count || left.source.localeCompare(right.source));
}

function sourceLabel(item) {
  return `${item.source}:${item.community}`.replace(/:+$/g, "");
}

function searchableText(values) {
  return values.flat().filter(Boolean).join("\n");
}

function cleanText(value, maxLength = 240) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeStringList(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .map((item) => cleanText(item, 180))
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items)];
}

function slugify(value) {
  return String(value ?? "opportunity")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "opportunity";
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function typeRank(type) {
  return type === "pain-led" ? 0 : 1;
}
