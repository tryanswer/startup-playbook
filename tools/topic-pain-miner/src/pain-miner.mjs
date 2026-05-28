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

export function renderHeatmapHtml(analysis, options = {}) {
  const maxHeat = Math.max(...analysis.heatmap.map((theme) => theme.heat), 1);
  const title = options.title ?? `${analysis.project} Demand Heatmap`;
  const llmSummary = options.llmSummary ? renderMarkdownishHtml(options.llmSummary) : "";
  const heatmapCards = analysis.heatmap.map((theme, index) => {
    const width = Math.max(8, Math.round((theme.heat / maxHeat) * 100));
    const evidence = theme.evidence.map((item) => `
              <li>
                <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
                <span>${escapeHtml(item.community)} · ${item.comments} comments</span>
              </li>`).join("");
    const moves = theme.productMoves.map((move) => `<li>${escapeHtml(move)}</li>`).join("");

    return `
        <article class="theme-card" data-theme-id="${escapeHtml(theme.id)}">
          <div class="theme-rank">${index + 1}</div>
          <div class="theme-main">
            <div class="theme-heading">
              <h3>${escapeHtml(theme.label)}</h3>
              <strong>${theme.heat}</strong>
            </div>
            <div class="heat-track" aria-label="${escapeHtml(theme.label)} heat ${theme.heat}">
              <div class="heat-fill" style="width: ${width}%"></div>
            </div>
            <dl class="theme-stats">
              <div><dt>Posts</dt><dd>${theme.count}</dd></div>
              <div><dt>Avg comments</dt><dd>${theme.avgComments}</dd></div>
              <div><dt>Avg score</dt><dd>${theme.avgScore}</dd></div>
            </dl>
            <div class="theme-grid">
              <section>
                <h4>Evidence</h4>
                <ul>${evidence}</ul>
              </section>
              <section>
                <h4>Product moves</h4>
                <ul>${moves}</ul>
              </section>
            </div>
          </div>
        </article>`;
  }).join("\n");
  const communityRows = analysis.communities.map((row) => `
            <tr>
              <td>${escapeHtml(row.community)}</td>
              <td>${row.posts}</td>
              <td>${row.avgComments}</td>
              <td>${row.avgScore}</td>
            </tr>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #141414;
        --muted: #64625f;
        --line: #e7e1db;
        --paper: #fbfaf8;
        --panel: #ffffff;
        --accent: #9f3b35;
        --accent-2: #28453f;
        --soft: #f2eee9;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }
      main {
        max-width: 1180px;
        margin: 0 auto;
        padding: 56px 24px 72px;
      }
      header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 32px;
        align-items: end;
        border-bottom: 1px solid var(--line);
        padding-bottom: 28px;
        margin-bottom: 28px;
      }
      .eyebrow {
        margin: 0 0 10px;
        color: var(--accent);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        max-width: 820px;
        font-size: clamp(40px, 7vw, 92px);
        line-height: .94;
        letter-spacing: 0;
      }
      .meta {
        min-width: 220px;
        border: 1px solid var(--line);
        background: var(--panel);
        padding: 18px;
      }
      .meta p, .summary p { margin: 0; color: var(--muted); }
      .gate {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0 12px;
        margin-bottom: 12px;
        border-radius: 999px;
        background: var(--ink);
        color: white;
        font-size: 13px;
        font-weight: 800;
      }
      .summary {
        margin: 28px 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .summary-card, .llm-summary, .community-table {
        border: 1px solid var(--line);
        background: var(--panel);
      }
      .summary-card { padding: 18px; min-height: 120px; }
      .summary-card span {
        display: block;
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
      }
      .summary-card strong {
        display: block;
        margin-top: 12px;
        font-size: 30px;
        line-height: 1;
      }
      .llm-summary {
        margin: 28px 0;
        padding: 24px;
      }
      .llm-summary h2, .community-table h2, .heatmap h2 {
        margin: 0 0 16px;
        font-size: 24px;
      }
      .llm-summary .summary-content {
        color: var(--ink);
        white-space: pre-wrap;
      }
      .heatmap {
        display: grid;
        gap: 14px;
        margin-top: 28px;
      }
      .theme-card {
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr);
        gap: 18px;
        padding: 20px;
        border: 1px solid var(--line);
        background: var(--panel);
      }
      .theme-rank {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--soft);
        color: var(--accent);
        font-weight: 900;
      }
      .theme-heading {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
      }
      .theme-heading h3 {
        margin: 0;
        font-size: 22px;
      }
      .theme-heading strong {
        color: var(--accent);
        font-size: 28px;
      }
      .heat-track {
        height: 12px;
        margin: 12px 0 14px;
        background: var(--soft);
        overflow: hidden;
      }
      .heat-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent), var(--accent-2));
      }
      .theme-stats {
        display: flex;
        gap: 10px;
        margin: 0 0 18px;
      }
      .theme-stats div {
        min-width: 120px;
        padding: 10px 12px;
        background: var(--paper);
      }
      dt {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
      }
      dd {
        margin: 3px 0 0;
        font-weight: 900;
      }
      .theme-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 20px;
      }
      h4 {
        margin: 0 0 8px;
        font-size: 14px;
        color: var(--accent-2);
      }
      ul {
        margin: 0;
        padding-left: 18px;
      }
      li + li { margin-top: 8px; }
      a { color: var(--ink); text-decoration-thickness: 1px; text-underline-offset: 3px; }
      li span {
        display: block;
        color: var(--muted);
        font-size: 12px;
      }
      .community-table {
        margin-top: 28px;
        padding: 22px;
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 12px 10px;
        border-top: 1px solid var(--line);
        text-align: left;
      }
      th {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
      }
      @media (max-width: 820px) {
        main { padding: 34px 16px 48px; }
        header, .summary, .theme-grid { grid-template-columns: 1fr; }
        h1 { font-size: 46px; }
        .theme-card { grid-template-columns: 1fr; }
        .theme-stats { flex-wrap: wrap; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <p class="eyebrow">Reddit Demand Heatmap</p>
          <h1>${escapeHtml(title)}</h1>
        </div>
        <aside class="meta">
          <span class="gate">${escapeHtml(analysis.demand.gate)}</span>
          <p>${escapeHtml(analysis.demand.notes)}</p>
        </aside>
      </header>

      <section class="summary" aria-label="Demand summary">
        <div class="summary-card"><span>Sample size</span><strong>${analysis.totalPosts}</strong></div>
        <div class="summary-card"><span>Communities</span><strong>${analysis.communities.length}</strong></div>
        <div class="summary-card"><span>Heat clusters</span><strong>${analysis.heatmap.length}</strong></div>
        <div class="summary-card"><span>Purchase signals</span><strong>${analysis.demand.purchaseSignals}</strong></div>
      </section>

      ${llmSummary ? `<section class="llm-summary"><h2>LLM Demand Summary</h2><div class="summary-content">${llmSummary}</div></section>` : ""}

      <section class="heatmap">
        <h2>Pain Heatmap</h2>
${heatmapCards}
      </section>

      <section class="community-table">
        <h2>Community Coverage</h2>
        <table>
          <thead><tr><th>Community</th><th>Posts</th><th>Avg comments</th><th>Avg score</th></tr></thead>
          <tbody>${communityRows}</tbody>
        </table>
      </section>
    </main>
  </body>
</html>
`;
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

export function buildDemandHeatmapSummaryPrompt(analysis) {
  const payload = {
    project: analysis.project,
    generatedAt: analysis.generatedAt,
    sampleSize: analysis.totalPosts,
    demandGate: analysis.demand,
    communities: analysis.communities,
    heatmap: analysis.heatmap.map((theme) => ({
      id: theme.id,
      label: theme.label,
      heat: theme.heat,
      posts: theme.count,
      avgComments: theme.avgComments,
      avgScore: theme.avgScore,
      evidence: theme.evidence,
      productMoves: theme.productMoves,
    })),
  };

  return [
    "You are a demand research analyst focused on early-stage startup validation.",
    "Write an English report on demand heat distribution.",
    "Use only the aggregated Reddit data provided. Do not invent search volume, market size, user identities, revenue, willingness to pay, or community feedback that does not appear in the data.",
    "Clearly separate known facts, reasonable inferences, and items that still need validation.",
    "",
    "Output structure:",
    "1. Demand heat ranking: explain why each pain cluster is hot, ordered by heat.",
    "2. Where target users are: identify the subreddits or communities most worth monitoring next.",
    "3. Purchase / alternative signals: summarize only signals that appear in the data.",
    "4. Product opportunities: suggest next feature or landing-page angles for Beauty Log or a similar color-diagnosis product.",
    "5. Risks and gaps: explain which evidence is insufficient and what to fetch or interview next.",
    "6. Next experiments: propose 3 validation actions that can be completed within one week.",
    "",
    `Project: ${analysis.project}`,
    "Aggregated Reddit data:",
    JSON.stringify(payload, null, 2),
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderMarkdownishHtml(markdown) {
  return escapeHtml(markdown)
    .replace(/^### (.*)$/gm, "<strong>$1</strong>")
    .replace(/^## (.*)$/gm, "<strong>$1</strong>")
    .replace(/^# (.*)$/gm, "<strong>$1</strong>");
}
