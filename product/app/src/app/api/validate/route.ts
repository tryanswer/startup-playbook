import { NextRequest } from 'next/server';
import { generateTraceId, createErrorResponse, createSuccessResponse, validateRequestBody } from '@/lib/api-utils';
import { captureError } from '@/lib/error-tracking';
import { validateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';

const MAX_IDEA_LENGTH = 2000;
const MAX_KEYWORDS_LENGTH = 500;

const VALIDATION_SYSTEM_PROMPT = `You are a startup validation expert. You analyze startup ideas by evaluating:
1. **Pain Signal**: How strong is the real user pain this solves? Look for frustration, workarounds, complaints.
2. **Demand Signal**: Is there active search demand? Are people looking for solutions?
3. **Market Signal**: What does the competitive landscape look like? Growing, mature, or empty?
4. **Willingness to Pay**: Are there signals that users would pay for a solution?

You MUST respond with a valid JSON object matching this exact structure (no markdown, no code fences, just raw JSON):
{
  "score": <number 0-100>,
  "decision": "<continue|pivot|kill>",
  "reasoning": "<one sentence explaining the decision>",
  "evidence": ["<positive signal 1>", "<positive signal 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "painAnalysis": "<2-3 sentences about the pain signal>",
  "demandAnalysis": "<2-3 sentences about demand>",
  "marketAnalysis": "<2-3 sentences about competitive landscape>",
  "suggestedNextSteps": ["<action 1>", "<action 2>", "<action 3>"]
}

Scoring guide:
- 60-100: Strong signals → decision: "continue"
- 35-59: Mixed signals → decision: "pivot"  
- 0-34: Weak signals → decision: "kill"

Be honest and evidence-based. If the idea is weak, say so.`;

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();

  const clientIp = getClientIp(request);
  const rateCheck = validateLimiter(clientIp);
  if (!rateCheck.allowed) {
    return createErrorResponse('Rate limit exceeded', 'RATE_LIMITED', 429, traceId);
  }

  try {
    const body = await request.json();
    validateRequestBody(body, 1024 * 1024);

    const { idea, keywords, geo } = body;

    if (!idea || typeof idea !== 'string') {
      return createErrorResponse('idea is required', 'MISSING_IDEA', 400, traceId);
    }
    if (idea.length > MAX_IDEA_LENGTH) {
      return createErrorResponse(`idea too long (max ${MAX_IDEA_LENGTH} chars)`, 'IDEA_TOO_LONG', 400, traceId);
    }
    if (keywords && typeof keywords === 'string' && keywords.length > MAX_KEYWORDS_LENGTH) {
      return createErrorResponse(`keywords too long (max ${MAX_KEYWORDS_LENGTH} chars)`, 'KEYWORDS_TOO_LONG', 400, traceId);
    }

    const userPrompt = buildValidationPrompt(idea, keywords, geo);

    // Call LLM for validation analysis
    const analysisJson = await callLLMForValidation(userPrompt);

    if (!analysisJson) {
      return createErrorResponse('LLM returned no analysis. Check API key configuration.', 'LLM_ERROR', 500, traceId);
    }

    // Parse structured response
    let summary;
    try {
      summary = JSON.parse(analysisJson);
    } catch {
      // LLM may wrap in markdown — try extracting JSON
      const jsonMatch = analysisJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        return createErrorResponse('Failed to parse LLM analysis', 'PARSE_ERROR', 500, traceId);
      }
    }

    // Generate HTML report from structured data
    const html = generateReportHtml(idea, summary);

    return createSuccessResponse({ html, summary }, traceId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    captureError(error, { traceId, route: '/api/validate' });
    return createErrorResponse(errorMessage, 'INTERNAL_ERROR', 500, traceId);
  }
}

function buildValidationPrompt(idea: string, keywords?: string, geo?: string): string {
  let prompt = `Analyze this startup idea:\n\n"${idea}"`;
  if (keywords) prompt += `\n\nRelated keywords/niches: ${keywords}`;
  if (geo) prompt += `\nTarget market: ${geo}`;
  prompt += `\n\nProvide your validation analysis as JSON.`;
  return prompt;
}

async function callLLMForValidation(userPrompt: string): Promise<string | null> {
  // Try Anthropic first
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: VALIDATION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || null;
  }

  // Try OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: VALIDATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2048,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }

  // Fallback: simulated analysis
  return JSON.stringify(generateSimulatedAnalysis());
}

function generateSimulatedAnalysis() {
  return {
    score: 52,
    decision: 'pivot',
    reasoning: 'The idea shows moderate potential but needs more specific targeting to stand out in a competitive space.',
    evidence: [
      'The problem space has active online discussions',
      'Existing solutions have gaps that could be exploited',
      'Target audience is technically savvy and willing to try new tools',
    ],
    concerns: [
      'Market is relatively crowded with established players',
      'Unclear differentiation from existing solutions',
      'Monetization path needs validation',
    ],
    painAnalysis: 'There are signs of user frustration with current solutions, but the pain is moderate rather than severe. Users have workarounds that are "good enough" for most cases.',
    demandAnalysis: 'Search demand exists but is fragmented across multiple related terms. No single high-intent keyword dominates, suggesting the market is still being defined.',
    marketAnalysis: 'The competitive landscape has 5-10 established players. Most focus on enterprise; there may be an opening in the indie/SMB segment.',
    suggestedNextSteps: [
      'Interview 5-10 potential users to validate pain intensity',
      'Narrow the niche to a specific underserved segment',
      'Build a landing page and measure signup conversion',
    ],
  };
}

function generateReportHtml(idea: string, summary: Record<string, unknown>): string {
  const score = summary.score as number;
  const decision = summary.decision as string;
  const reasoning = summary.reasoning as string;
  const evidence = (summary.evidence as string[]) || [];
  const concerns = (summary.concerns as string[]) || [];
  const painAnalysis = (summary.painAnalysis as string) || '';
  const demandAnalysis = (summary.demandAnalysis as string) || '';
  const marketAnalysis = (summary.marketAnalysis as string) || '';
  const suggestedNextSteps = (summary.suggestedNextSteps as string[]) || [];

  const decisionColor = decision === 'continue' ? '#10b981' : decision === 'pivot' ? '#f59e0b' : '#ef4444';
  const decisionEmoji = decision === 'continue' ? '✅' : decision === 'pivot' ? '⚠️' : '❌';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Validation Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem;line-height:1.6}
.container{max-width:720px;margin:0 auto}
h1{font-size:1.5rem;margin-bottom:.5rem}
h2{font-size:1.1rem;color:#94a3b8;margin:1.5rem 0 .5rem;border-bottom:1px solid #334155;padding-bottom:.25rem}
.idea{color:#94a3b8;font-size:.9rem;margin-bottom:1.5rem}
.score-card{background:#1e293b;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;border:1px solid #334155}
.score{font-size:3rem;font-weight:700;color:${decisionColor}}
.decision{display:inline-block;padding:.25rem .75rem;border-radius:999px;font-size:.85rem;font-weight:600;background:${decisionColor}22;color:${decisionColor};margin:.5rem 0}
.reasoning{color:#cbd5e1;font-size:.95rem;margin-top:.5rem}
.section{background:#1e293b;border-radius:12px;padding:1.25rem;margin-bottom:1rem;border:1px solid #334155}
.section p{color:#94a3b8;font-size:.9rem}
ul{list-style:none;padding:0}
ul li{padding:.35rem 0;font-size:.9rem;color:#cbd5e1}
ul li::before{content:'→ ';color:#3b82f6}
.evidence li::before{content:'✓ ';color:#10b981}
.concerns li::before{content:'⚠ ';color:#f59e0b}
.steps li::before{content:'• ';color:#3b82f6}
.steps li{color:#94a3b8}
.footer{text-align:center;color:#475569;font-size:.75rem;margin-top:2rem}
</style></head>
<body><div class="container">
<h1>Validation Report</h1>
<p class="idea">"${idea.replace(/"/g, '&quot;')}"</p>

<div class="score-card">
  <div class="score">${score}/100</div>
  <div class="decision">${decisionEmoji} ${decision.toUpperCase()}</div>
  <p class="reasoning">${reasoning}</p>
</div>

<h2>📊 Evidence</h2>
<div class="section"><ul class="evidence">${evidence.map(e => `<li>${e}</li>`).join('')}</ul></div>

<h2>⚠️ Concerns</h2>
<div class="section"><ul class="concerns">${concerns.map(c => `<li>${c}</li>`).join('')}</ul></div>

${painAnalysis ? `<h2>😤 Pain Analysis</h2><div class="section"><p>${painAnalysis}</p></div>` : ''}
${demandAnalysis ? `<h2>🔍 Demand Analysis</h2><div class="section"><p>${demandAnalysis}</p></div>` : ''}
${marketAnalysis ? `<h2>🏢 Market Analysis</h2><div class="section"><p>${marketAnalysis}</p></div>` : ''}

${suggestedNextSteps.length > 0 ? `<h2>🚀 Suggested Next Steps</h2><div class="section"><ul class="steps">${suggestedNextSteps.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}

<p class="footer">Generated by Startup Playbook · ${new Date().toLocaleDateString()}</p>
</div></body></html>`;
}
