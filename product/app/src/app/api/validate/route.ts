import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { generateTraceId, createErrorResponse, createSuccessResponse, validateRequestBody } from '@/lib/api-utils';
import { captureError } from '@/lib/error-tracking';
import { validateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';

const execFileAsync = promisify(execFile);

// Path to idea-validator scripts (relative to project root)
const VALIDATOR_DIR = join(process.cwd(), '..', '..', 'tools', 'idea-validator');

// Input validation limits
const MAX_IDEA_LENGTH = 2000;
const MAX_KEYWORDS_LENGTH = 500;
const MAX_SUBREDDITS_LENGTH = 500;

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  
  // 速率限制检查
  const clientIp = getClientIp(request);
  const rateCheck = validateLimiter(clientIp);
  if (!rateCheck.allowed) {
    return createErrorResponse('Rate limit exceeded', 'RATE_LIMITED', 429, traceId);
  }
  
  try {
    const body = await request.json();
    
    // Validate request body size (max 1MB)
    validateRequestBody(body, 1024 * 1024);
    
    const { idea, keywords, subreddits, geo } = body;

    if (!idea) {
      return createErrorResponse('idea is required', 'MISSING_IDEA', 400, traceId);
    }

    // Validate input lengths
    if (typeof idea === 'string' && idea.length > MAX_IDEA_LENGTH) {
      return createErrorResponse(`idea too long (max ${MAX_IDEA_LENGTH} chars)`, 'IDEA_TOO_LONG', 400, traceId);
    }

    if (keywords && typeof keywords === 'string' && keywords.length > MAX_KEYWORDS_LENGTH) {
      return createErrorResponse(`keywords too long (max ${MAX_KEYWORDS_LENGTH} chars)`, 'KEYWORDS_TOO_LONG', 400, traceId);
    }

    if (subreddits && typeof subreddits === 'string' && subreddits.length > MAX_SUBREDDITS_LENGTH) {
      return createErrorResponse(`subreddits too long (max ${MAX_SUBREDDITS_LENGTH} chars)`, 'SUBREDDITS_TOO_LONG', 400, traceId);
    }

    // Create a temp output directory for this run
    const outputDir = await mkdtemp(join(tmpdir(), 'sp-validate-'));

    // Build args for validate.mjs
    const args = [
      join(VALIDATOR_DIR, 'scripts', 'validate.mjs'),
      '--idea', idea,
    ];

    if (keywords) args.push('--keywords', keywords);
    if (subreddits) args.push('--subreddits', subreddits);
    if (geo) args.push('--geo', geo);

    // Override output directory via env or we'll read from the default
    // For now, run the validator and read output from its default location
    try {
      await execFileAsync('node', args, {
        cwd: VALIDATOR_DIR,
        timeout: 120_000,
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
      });
    } catch (execError: unknown) {
      // Validator may partially succeed — continue to check for output
      const errorMessage = execError instanceof Error ? execError.message : 'Unknown error';
      console.warn('Validator exec warning:', errorMessage);
    }

    // Read output files
    const validatorOutputDir = join(VALIDATOR_DIR, 'output');
    let htmlContent = '';
    let summaryData = null;

    try {
      const files = await readdir(validatorOutputDir);

      // Find the most recent report HTML
      const reportFile = files.filter(f => f.startsWith('report-')).sort().pop();
      if (reportFile) {
        htmlContent = await readFile(join(validatorOutputDir, reportFile), 'utf-8');
      }

      // Read all JSON files to build summary
      const redditFile = files.find(f => f.startsWith('reddit-'));
      const trendsFile = files.find(f => f.startsWith('trends-'));
      const competitorsFile = files.find(f => f.startsWith('competitors-'));

      const redditData = redditFile
        ? JSON.parse(await readFile(join(validatorOutputDir, redditFile), 'utf-8'))
        : null;
      const trendsData = trendsFile
        ? JSON.parse(await readFile(join(validatorOutputDir, trendsFile), 'utf-8'))
        : null;
      const competitorsData = competitorsFile
        ? JSON.parse(await readFile(join(validatorOutputDir, competitorsFile), 'utf-8'))
        : null;

      // Calculate decision summary (same logic as generate-report.mjs)
      summaryData = calculateDecision(redditData, trendsData, competitorsData);

      // Clean up output files for next run
      for (const file of files) {
        await rm(join(validatorOutputDir, file), { force: true });
      }
    } catch {
      // No output files found
    }

    // Clean up temp dir
    await rm(outputDir, { recursive: true, force: true });

    if (!htmlContent && !summaryData) {
      return createErrorResponse(
        'Validation produced no output. Check network connectivity (Reddit/Google may be blocked).',
        'NO_OUTPUT',
        500,
        traceId
      );
    }

    return createSuccessResponse({
      html: htmlContent,
      summary: summaryData,
    }, traceId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    captureError(error, { traceId, route: '/api/validate' });
    return createErrorResponse(errorMessage, 'INTERNAL_ERROR', 500, traceId);
  }
}

function calculateDecision(
  redditData: Record<string, unknown> | null,
  trendsData: Record<string, unknown> | null,
  competitorsData: Record<string, unknown> | null,
) {
  let score = 0;
  const evidence: string[] = [];
  const concerns: string[] = [];

  if (redditData) {
    const summary = redditData.summary as { painRate: number; paymentSignalRate: number; totalPosts: number };
    if (summary.totalPosts >= 10) {
      score += Math.min(25, Math.round(summary.painRate * 0.5));
      if (summary.painRate >= 40) evidence.push(`Strong pain signal: ${summary.painRate}% of posts contain frustration`);
      else if (summary.painRate >= 20) evidence.push(`Moderate pain signal: ${summary.painRate}%`);
      else concerns.push(`Low pain signal: ${summary.painRate}%`);
    } else {
      concerns.push(`Only ${summary.totalPosts} Reddit posts found`);
    }
    if (summary.paymentSignalRate >= 10) {
      score += 15;
      evidence.push(`Payment signals: ${summary.paymentSignalRate}%`);
    } else {
      concerns.push(`Low payment signals: ${summary.paymentSignalRate}%`);
    }
  } else {
    concerns.push('No Reddit data collected');
  }

  if (trendsData) {
    const summary = trendsData.summary as { averageDemandScore: number; totalBuyerIntentQueries: number };
    score += Math.min(25, Math.round(summary.averageDemandScore * 0.4));
    if (summary.averageDemandScore >= 60) evidence.push(`Strong search demand (score: ${summary.averageDemandScore})`);
    else if (summary.averageDemandScore >= 35) evidence.push(`Moderate search demand (score: ${summary.averageDemandScore})`);
    else concerns.push(`Weak search demand (score: ${summary.averageDemandScore})`);
  } else {
    concerns.push('No trends data collected');
  }

  if (competitorsData) {
    const summary = competitorsData.summary as { marketMaturity: string; competitorCount: number };
    if (summary.marketMaturity === 'growing') { score += 20; evidence.push(`Growing market with ${summary.competitorCount} competitors`); }
    else if (summary.marketMaturity === 'mature') { score += 10; evidence.push(`Mature market`); concerns.push('Crowded — need differentiation'); }
    else if (summary.marketMaturity === 'early') { score += 15; evidence.push(`Early market`); }
    else concerns.push('No competitors found — market may not exist');
  } else {
    concerns.push('No competitor data collected');
  }

  const decision = score >= 60 ? 'continue' as const : score >= 35 ? 'pivot' as const : 'kill' as const;
  const reasoning = score >= 60
    ? 'Strong evidence across multiple signals. Proceed to MVP scoping.'
    : score >= 35
      ? 'Mixed signals. Consider narrowing the niche or gathering more evidence.'
      : 'Insufficient evidence of real demand. Revisit the problem definition.';

  return { score, decision, reasoning, evidence, concerns };
}

function generateFallbackHtml(idea: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Validation Failed</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:2rem;text-align:center;}
h1{color:#ef4444;}p{color:#94a3b8;}</style></head>
<body><h1>Validation Failed</h1>
<p>Could not collect data for: "${idea}"</p>
<p>This usually means Reddit or Google are not accessible from your network. Try setting HTTP_PROXY or use --skip-reddit / --skip-trends flags.</p>
</body></html>`;
}
