const DEFAULT_THEMES = [
  {
    id: "decision-uncertainty",
    label: "Decision uncertainty",
    patterns: ["which", "should i", "best", "better", "suits me", "look good on me"],
    productMoves: ["Turn repeated comparison questions into guided decision flows."],
  },
  {
    id: "personal-fit",
    label: "Personal fit and matching",
    patterns: ["for me", "match", "shade", "tone", "undertone", "season", "type me"],
    productMoves: ["Explain why an answer fits the user's specific attributes."],
  },
  {
    id: "workflow-guidance",
    label: "Workflow guidance",
    patterns: ["how to", "tutorial", "photo", "lighting", "process", "guide"],
    productMoves: ["Add step-by-step onboarding and capture guidance."],
  },
  {
    id: "failed-outcome-regret",
    label: "Failed outcome or regret",
    patterns: ["regret", "worst", "help", "fix", "ruined", "correction"],
    productMoves: ["Prioritize pre-change previews and recovery advice."],
  },
  {
    id: "purchase-and-alternative-seeking",
    label: "Purchase and alternative seeking",
    patterns: ["buy", "drugstore", "dupe", "similar", "afford", "recommendation", "product help"],
    productMoves: ["Map recommendations to budget and purchase-intent segments."],
  },
];

const PURCHASE_PATTERN = /\b(buy|paid|price|cost|afford|drugstore|dupe|similar|recommendation|product help|brand|shade match|where can i get)\b/i;

export function normalizeRedditPost(raw) {
  if (!raw?.id || !raw?.title) {
    return null;
  }

  return {
    id: `reddit:${raw.id}`,
    source: "reddit",
    community: String(raw.subreddit ?? ""),
    flair: String(raw.link_flair_text ?? ""),
    title: cleanText(raw.title, 240),
    excerpt: cleanText(raw.selftext ?? "", 360),
    score: toInteger(raw.score),
    comments: toInteger(raw.num_comments),
    createdAt: raw.created_utc ? new Date(raw.created_utc * 1000).toISOString() : "",
    url: normalizeRedditUrl(raw.permalink),
  };
}

export function analyzePain(posts, options = {}) {
  const themes = normalizeThemes(options.themes ?? DEFAULT_THEMES);
  const thresholds = {
    minThemeCount: Number(options.thresholds?.minThemeCount ?? 3),
    minPurchaseSignals: Number(options.thresholds?.minPurchaseSignals ?? 2),
    minContinueSample: Number(options.thresholds?.minContinueSample ?? 20),
  };
  const normalizedPosts = posts.filter(Boolean);

  const scoredThemes = themes
    .map((theme) => scoreTheme(theme, normalizedPosts))
    .filter((theme) => theme.count > 0)
    .sort((left, right) => right.heat - left.heat || right.count - left.count || left.label.localeCompare(right.label));

  const purchaseSignals = countPurchaseSignals(normalizedPosts);
  const recurringPain = scoredThemes.some((theme) => theme.count >= thresholds.minThemeCount);
  const targetUsersFound = new Set(normalizedPosts.map((post) => post.community).filter(Boolean)).size > 0;
  const purchaseIntentFound = purchaseSignals >= thresholds.minPurchaseSignals;
  const enoughSample = normalizedPosts.length >= thresholds.minContinueSample;

  return {
    project: options.project ?? "Topic",
    generatedAt: new Date().toISOString(),
    totalPosts: normalizedPosts.length,
    communities: summarizeCommunities(normalizedPosts),
    heatmap: scoredThemes,
    demand: {
      gate: recurringPain && targetUsersFound && purchaseIntentFound && enoughSample ? "continue" : "validation-needed",
      recurringPain,
      targetUsersFound,
      purchaseIntentFound,
      purchaseSignals,
      sampleSize: normalizedPosts.length,
      notes: buildDemandNotes({ recurringPain, targetUsersFound, purchaseIntentFound, enoughSample }),
    },
  };
}

export function renderPainReport(analysis) {
  const lines = [
    `# Topic Pain Mining Report: ${analysis.project}`,
    "",
    `Generated: ${analysis.generatedAt}`,
    `Sample size: ${analysis.totalPosts} public posts`,
    "",
    "## Demand Reality Gate",
    "",
    `- Decision: ${analysis.demand.gate}`,
    `- Recurring pain: ${formatBoolean(analysis.demand.recurringPain)}`,
    `- Target users found: ${formatBoolean(analysis.demand.targetUsersFound)}`,
    `- Purchase intent found: ${formatBoolean(analysis.demand.purchaseIntentFound)} (${analysis.demand.purchaseSignals} signals)`,
    `- Notes: ${analysis.demand.notes}`,
    "",
    "## Community Coverage",
    "",
    "| Community | Posts | Avg comments | Avg score |",
    "| --- | ---: | ---: | ---: |",
    ...analysis.communities.map((row) => `| ${escapeMarkdown(row.community)} | ${row.posts} | ${row.avgComments} | ${row.avgScore} |`),
    "",
    "## Pain Heatmap",
    "",
    "| Theme | Heat | Posts | Avg comments | Evidence |",
    "| --- | ---: | ---: | ---: | --- |",
    ...analysis.heatmap.map((theme) => `| ${escapeMarkdown(theme.label)} | ${theme.heat} | ${theme.count} | ${theme.avgComments} | ${escapeMarkdown(theme.evidence.map((item) => item.title).join("; "))} |`),
    "",
    "## Product iteration moves",
    "",
    ...analysis.heatmap.flatMap((theme) => [
      `### ${theme.label}`,
      ...theme.productMoves.map((move) => `- ${move}`),
      "",
    ]),
    "## AI Deep Analysis Prompt",
    "",
    "```text",
    buildAiAnalysisPrompt(analysis),
    "```",
    "",
  ];

  return `${lines.join("\n")}`;
}

export function buildAiAnalysisPrompt(analysis) {
  const heatmap = analysis.heatmap
    .map((theme) => {
      const evidence = theme.evidence.map((item) => `- ${item.title} (${item.community}, comments ${item.comments})`).join("\n");
      return `${theme.label}: heat ${theme.heat}, posts ${theme.count}\n${evidence}`;
    })
    .join("\n\n");

  return [
    "You are analyzing demand truth for an early startup idea.",
    "Do not invent evidence, market size, willingness to pay, or user intent beyond the supplied data.",
    "Judge whether the demand is real and frequent, where the target users are, and whether purchase intent is present.",
    "Return: demand verdict, strongest pain clusters, weak evidence, product iteration moves, landing-page angles, and next validation experiment.",
    "",
    `Project: ${analysis.project}`,
    `Sample size: ${analysis.totalPosts}`,
    `Gate: ${analysis.demand.gate}`,
    "",
    "Heatmap evidence:",
    heatmap || "No matched themes.",
  ].join("\n");
}

function normalizeThemes(themes) {
  return themes.map((theme) => ({
    id: theme.id,
    label: theme.label ?? theme.id,
    patterns: (theme.patterns ?? []).map((pattern) => String(pattern).toLowerCase()),
    productMoves: theme.productMoves?.length ? theme.productMoves : ["Use this theme to define the next validation experiment."],
  }));
}

function scoreTheme(theme, posts) {
  const matches = [];
  for (const post of posts) {
    const corpus = `${post.flair}\n${post.title}\n${post.excerpt}`.toLowerCase();
    if (!theme.patterns.some((pattern) => corpus.includes(pattern))) {
      continue;
    }
    matches.push(post);
  }

  const engagement = matches.reduce((sum, post) => sum + post.comments + Math.round(post.score / 10), 0);
  const heat = matches.length * 100 + Math.round(Math.log10(engagement + 1) * 25);

  return {
    id: theme.id,
    label: theme.label,
    count: matches.length,
    heat,
    avgComments: average(matches.map((post) => post.comments)),
    avgScore: average(matches.map((post) => post.score)),
    evidence: matches
      .sort((left, right) => right.comments - left.comments || right.score - left.score)
      .slice(0, 4)
      .map((post) => ({
        title: post.title,
        community: post.community,
        comments: post.comments,
        score: post.score,
        url: post.url,
      })),
    productMoves: theme.productMoves,
  };
}

function summarizeCommunities(posts) {
  const grouped = new Map();
  for (const post of posts) {
    const key = post.community || "unknown";
    const items = grouped.get(key) ?? [];
    items.push(post);
    grouped.set(key, items);
  }

  return [...grouped.entries()]
    .map(([community, items]) => ({
      community,
      posts: items.length,
      avgComments: average(items.map((post) => post.comments)),
      avgScore: average(items.map((post) => post.score)),
    }))
    .sort((left, right) => right.posts - left.posts || left.community.localeCompare(right.community));
}

function countPurchaseSignals(posts) {
  return posts.filter((post) => PURCHASE_PATTERN.test(`${post.flair}\n${post.title}\n${post.excerpt}`)).length;
}

function buildDemandNotes({ recurringPain, targetUsersFound, purchaseIntentFound, enoughSample }) {
  const notes = [];
  if (recurringPain) notes.push("repeated pain appears in the corpus");
  if (!recurringPain) notes.push("pain repetition is still weak");
  if (targetUsersFound) notes.push("reachable public communities are present");
  if (!targetUsersFound) notes.push("target user surface is missing");
  if (purchaseIntentFound) notes.push("some purchase or alternative-seeking language appears");
  if (!purchaseIntentFound) notes.push("purchase intent evidence is limited");
  if (!enoughSample) notes.push("sample is too small for a continue decision");
  return notes.join("; ");
}

function normalizeRedditUrl(permalink) {
  const value = String(permalink ?? "");
  if (value.startsWith("https://www.reddit.com/")) return value;
  if (value.startsWith("/")) return `https://www.reddit.com${value}`;
  return value;
}

function cleanText(value, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

function toInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function average(values) {
  const numbers = values.filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

function formatBoolean(value) {
  return value ? "yes" : "no";
}

function escapeMarkdown(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}
