#!/usr/bin/env node

/**
 * Generate Report — combine all validation data into an HTML decision report.
 *
 * Usage:
 *   node scripts/generate-report.mjs --idea "AI skin analysis app" --data-dir output/
 *
 * Reads JSON files from data-dir and produces an HTML report with kill/pivot/continue decision.
 */

import { parseArgs } from 'node:util';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'output');

const { values: args } = parseArgs({
  options: {
    idea: { type: 'string' },
    'data-dir': { type: 'string', default: OUTPUT_DIR },
    output: { type: 'string', default: '' },
  },
});

async function loadJsonFiles(dataDir) {
  const files = await readdir(dataDir);
  const data = {};
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = await readFile(join(dataDir, file), 'utf-8');
      const parsed = JSON.parse(content);
      if (file.startsWith('reddit-')) data.reddit = parsed;
      if (file.startsWith('trends-')) data.trends = parsed;
      if (file.startsWith('competitors-')) data.competitors = parsed;
    } catch { /* skip unparseable files */ }
  }
  return data;
}

function calculateDecision(data) {
  let score = 0;
  const evidence = [];
  const concerns = [];

  // Reddit pain signals
  if (data.reddit) {
    const painRate = data.reddit.summary.painRate;
    const paymentRate = data.reddit.summary.paymentSignalRate;
    const postCount = data.reddit.summary.totalPosts;

    if (postCount < 10) {
      concerns.push(`Only ${postCount} Reddit posts found — insufficient data for confidence`);
    } else {
      score += Math.min(25, Math.round(painRate * 0.5));
      if (painRate >= 40) evidence.push(`Strong pain signal: ${painRate}% of posts contain frustration/need language`);
      else if (painRate >= 20) evidence.push(`Moderate pain signal: ${painRate}% of posts show pain`);
      else concerns.push(`Low pain signal: only ${painRate}% of posts show pain`);
    }

    if (paymentRate >= 10) {
      score += 15;
      evidence.push(`Payment signals found in ${paymentRate}% of posts`);
    } else {
      concerns.push(`Low payment signals: ${paymentRate}% — willingness to pay unproven`);
    }
  } else {
    concerns.push('No Reddit data collected — community pain unvalidated');
  }

  // Trends / demand signals
  if (data.trends) {
    const demandScore = data.trends.summary.averageDemandScore;
    const buyerQueries = data.trends.summary.totalBuyerIntentQueries;

    score += Math.min(25, Math.round(demandScore * 0.4));

    if (demandScore >= 60) evidence.push(`Strong search demand (score: ${demandScore}) with ${buyerQueries} buyer-intent queries`);
    else if (demandScore >= 35) evidence.push(`Moderate search demand (score: ${demandScore})`);
    else concerns.push(`Weak search demand (score: ${demandScore}) — people may not be searching for this`);

    if (buyerQueries >= 5) evidence.push(`${buyerQueries} buyer-intent search queries found`);
  } else {
    concerns.push('No trends data collected — search demand unknown');
  }

  // Competitor signals
  if (data.competitors) {
    const maturity = data.competitors.summary.marketMaturity;
    const competitorCount = data.competitors.summary.competitorCount;

    if (maturity === 'growing') {
      score += 20;
      evidence.push(`Growing market with ${competitorCount} competitors — demand validated, not saturated`);
    } else if (maturity === 'mature') {
      score += 10;
      evidence.push(`Mature market with ${competitorCount} competitors — demand proven but need strong differentiation`);
      concerns.push('Crowded market — must find an underserved niche');
    } else if (maturity === 'early') {
      score += 15;
      evidence.push(`Early market with ${competitorCount} competitors — potential first-mover advantage`);
      concerns.push('Few competitors could mean low demand — validate carefully');
    } else {
      concerns.push('No competitors found — market may not exist yet');
    }
  } else {
    concerns.push('No competitor data collected');
  }

  // Decision
  let decision, reasoning;
  if (score >= 60) {
    decision = 'continue';
    reasoning = 'Strong evidence across multiple signals. Proceed to MVP scoping.';
  } else if (score >= 35) {
    decision = 'pivot';
    reasoning = 'Mixed signals. Consider narrowing the niche, changing the angle, or gathering more evidence before building.';
  } else {
    decision = 'kill';
    reasoning = 'Insufficient evidence of real demand. Revisit the problem definition or target a different audience.';
  }

  return { score, decision, reasoning, evidence, concerns };
}

function generateHtml(idea, data, decision) {
  const decisionColors = { continue: '#10b981', pivot: '#f59e0b', kill: '#ef4444' };
  const decisionColor = decisionColors[decision.decision] || '#6b7280';

  const redditSection = data.reddit ? `
    <div class="card">
      <h2>🗣️ Reddit Pain Analysis</h2>
      <div class="metrics">
        <div class="metric">
          <span class="metric-value">${data.reddit.summary.totalPosts}</span>
          <span class="metric-label">Posts Found</span>
        </div>
        <div class="metric">
          <span class="metric-value">${data.reddit.summary.painRate}%</span>
          <span class="metric-label">Pain Rate</span>
        </div>
        <div class="metric">
          <span class="metric-value">${data.reddit.summary.paymentSignalRate}%</span>
          <span class="metric-label">Payment Signals</span>
        </div>
      </div>
      ${data.reddit.painAnalysis.themes.length > 0 ? `
        <h3>Top Pain Themes</h3>
        <div class="themes">
          ${data.reddit.painAnalysis.themes.slice(0, 8).map(t =>
            `<span class="tag">${t.theme} (${t.count})</span>`
          ).join('')}
        </div>
      ` : ''}
      ${data.reddit.painAnalysis.topQuotes.length > 0 ? `
        <h3>Top User Quotes</h3>
        <div class="quotes">
          ${data.reddit.painAnalysis.topQuotes.slice(0, 5).map(q => `
            <blockquote>
              <p>"${q.quote}"</p>
              <cite>r/${q.subreddit} · ▲${q.score} · <a href="${q.link}" target="_blank">link</a></cite>
            </blockquote>
          `).join('')}
        </div>
      ` : ''}
    </div>
  ` : '<div class="card muted"><h2>🗣️ Reddit Pain Analysis</h2><p>No data collected. Run: <code>npm run reddit -- --keywords "..."</code></p></div>';

  const trendsSection = data.trends ? `
    <div class="card">
      <h2>📊 Search Demand</h2>
      <div class="metrics">
        <div class="metric">
          <span class="metric-value">${data.trends.summary.averageDemandScore}</span>
          <span class="metric-label">Demand Score</span>
        </div>
        <div class="metric">
          <span class="metric-value">${data.trends.summary.totalBuyerIntentQueries}</span>
          <span class="metric-label">Buyer Intent Queries</span>
        </div>
        <div class="metric">
          <span class="metric-value">${data.trends.summary.overallSignal}</span>
          <span class="metric-label">Signal Level</span>
        </div>
      </div>
      ${data.trends.allBuyerIntentQueries.length > 0 ? `
        <h3>Buyer Intent Queries</h3>
        <div class="themes">
          ${data.trends.allBuyerIntentQueries.slice(0, 12).map(q =>
            `<span class="tag buyer">${q}</span>`
          ).join('')}
        </div>
      ` : ''}
    </div>
  ` : '<div class="card muted"><h2>📊 Search Demand</h2><p>No data collected. Run: <code>npm run trends -- --keywords "..."</code></p></div>';

  const competitorSection = data.competitors ? `
    <div class="card">
      <h2>🏢 Competitor Landscape</h2>
      <div class="metrics">
        <div class="metric">
          <span class="metric-value">${data.competitors.summary.competitorCount}</span>
          <span class="metric-label">Competitors Found</span>
        </div>
        <div class="metric">
          <span class="metric-value">${data.competitors.summary.marketMaturity}</span>
          <span class="metric-label">Market Maturity</span>
        </div>
      </div>
      ${data.competitors.competitors.length > 0 ? `
        <h3>Identified Competitors</h3>
        <div class="themes">
          ${data.competitors.competitors.slice(0, 10).map(c =>
            `<span class="tag competitor">${c}</span>`
          ).join('')}
        </div>
      ` : ''}
      <p class="insight">${data.competitors.marketAssessment.implication}</p>
    </div>
  ` : '<div class="card muted"><h2>🏢 Competitor Landscape</h2><p>No data collected. Run: <code>npm run competitors -- --keywords "..."</code></p></div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Idea Validation Report: ${idea}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.3rem; margin-bottom: 1rem; color: #94a3b8; }
    h3 { font-size: 1rem; margin: 1rem 0 0.5rem; color: #cbd5e1; }
    .subtitle { color: #64748b; margin-bottom: 2rem; }
    .decision-banner { background: ${decisionColor}22; border: 2px solid ${decisionColor}; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: center; }
    .decision-label { font-size: 2.5rem; font-weight: 800; color: ${decisionColor}; text-transform: uppercase; }
    .decision-score { font-size: 1.2rem; color: #94a3b8; margin: 0.5rem 0; }
    .decision-reasoning { color: #cbd5e1; }
    .card { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card.muted { opacity: 0.5; }
    .metrics { display: flex; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .metric { text-align: center; flex: 1; min-width: 100px; }
    .metric-value { display: block; font-size: 2rem; font-weight: 700; color: #f8fafc; }
    .metric-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
    .themes { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .tag { background: #334155; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; }
    .tag.buyer { background: #164e63; color: #67e8f9; }
    .tag.competitor { background: #3b0764; color: #c084fc; }
    blockquote { background: #0f172a; border-left: 3px solid #3b82f6; padding: 0.8rem 1rem; margin-bottom: 0.8rem; border-radius: 0 8px 8px 0; }
    blockquote p { font-style: italic; color: #cbd5e1; }
    blockquote cite { font-size: 0.8rem; color: #64748b; }
    blockquote a { color: #60a5fa; }
    .evidence-list { list-style: none; padding: 0; }
    .evidence-list li { padding: 0.5rem 0; padding-left: 1.5rem; position: relative; }
    .evidence-list li::before { content: '✅'; position: absolute; left: 0; }
    .concerns-list li::before { content: '⚠️'; }
    .insight { color: #94a3b8; font-style: italic; margin-top: 0.5rem; }
    .footer { text-align: center; color: #475569; margin-top: 2rem; font-size: 0.8rem; }
    .next-steps { background: #1e293b; border-radius: 12px; padding: 1.5rem; }
    .next-steps ol { padding-left: 1.5rem; }
    .next-steps li { margin-bottom: 0.5rem; }
    code { background: #334155; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Idea Validation Report</h1>
    <p class="subtitle">${idea} · Generated ${new Date().toISOString().slice(0, 10)}</p>

    <div class="decision-banner">
      <div class="decision-label">${decision.decision}</div>
      <div class="decision-score">Validation Score: ${decision.score} / 100</div>
      <div class="decision-reasoning">${decision.reasoning}</div>
    </div>

    <div class="card">
      <h2>Evidence Summary</h2>
      ${decision.evidence.length > 0 ? `
        <h3>Supporting Evidence</h3>
        <ul class="evidence-list">
          ${decision.evidence.map(e => `<li>${e}</li>`).join('')}
        </ul>
      ` : ''}
      ${decision.concerns.length > 0 ? `
        <h3>Concerns</h3>
        <ul class="evidence-list concerns-list">
          ${decision.concerns.map(c => `<li>${c}</li>`).join('')}
        </ul>
      ` : ''}
    </div>

    ${redditSection}
    ${trendsSection}
    ${competitorSection}

    <div class="next-steps">
      <h2>Recommended Next Steps</h2>
      ${decision.decision === 'continue' ? `
        <ol>
          <li>Use the top user quotes above as landing page headline copy</li>
          <li>Build a landing page with <code>templates/landing-page-checklist.md</code></li>
          <li>Choose a business model with <code>skills/business-model-design</code></li>
          <li>Scope the MVP with <code>skills/product-development-loop</code></li>
          <li>Target the subreddits/communities where pain was found for initial distribution</li>
        </ol>
      ` : decision.decision === 'pivot' ? `
        <ol>
          <li>Review the pain themes — is there a narrower niche with stronger signal?</li>
          <li>Check the buyer-intent queries — do they suggest a different angle?</li>
          <li>Run this validation again with adjusted keywords for the narrower niche</li>
          <li>Consider manual validation: post in the communities and ask directly</li>
          <li>If pivoting, re-run: <code>npm run validate -- --idea "new angle"</code></li>
        </ol>
      ` : `
        <ol>
          <li>Do not build this product in its current form</li>
          <li>Revisit the problem: are you solving a real pain or an imagined one?</li>
          <li>Talk to 5 potential users directly before reconsidering</li>
          <li>Look at the competitor landscape — if no competitors exist, ask why</li>
          <li>Consider a different idea and re-run validation</li>
        </ol>
      `}
    </div>

    <p class="footer">
      Generated by startup-playbook/tools/idea-validator · Evidence-based validation, not vibes
    </p>
  </div>
</body>
</html>`;
}

async function main() {
  const idea = args.idea || 'Unnamed Idea';
  const dataDir = args['data-dir'];

  console.log(`\n📋 Generating validation report for: "${idea}"\n`);

  const data = await loadJsonFiles(dataDir);
  const decision = calculateDecision(data);

  const html = generateHtml(idea, data, decision);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const slug = idea.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const outputPath = args.output || join(OUTPUT_DIR, `report-${slug}.html`);
  await writeFile(outputPath, html);

  console.log(`  Decision: ${decision.decision.toUpperCase()} (score: ${decision.score}/100)`);
  console.log(`  Evidence: ${decision.evidence.length} supporting, ${decision.concerns.length} concerns`);
  console.log(`  Report: ${outputPath}\n`);

  return { decision, outputPath };
}

await main();
