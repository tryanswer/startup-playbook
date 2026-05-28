import { NextRequest } from 'next/server';
import { generateTraceId, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * @deprecated Phase 1: validation is driven by CLI (codex + startup-playbook).
 * This route is kept as a stub for future Phase 2 when UI-triggered validation returns.
 * Artifacts are read via /api/artifacts instead.
 */
export async function POST(request: NextRequest) {
  const traceId = generateTraceId();

  return createErrorResponse(
    'Validation is now driven by CLI. Use Codex with startup-playbook skills to run validation, then refresh the UI to load artifacts.',
    'CLI_DRIVEN',
    400,
    traceId,
  );
}
