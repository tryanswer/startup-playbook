import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateTraceId, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * Read stage artifacts from the shared output directory.
 * CLI writes to: .playbook-output/<projectId>/<stageId>/report.json
 * 
 * GET /api/artifacts?projectId=xxx&stageId=validate
 */

const OUTPUT_DIR = join(process.cwd(), '.playbook-output');

export async function GET(request: NextRequest) {
  const traceId = generateTraceId();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const stageId = searchParams.get('stageId');

  if (!projectId || !stageId) {
    return createErrorResponse('projectId and stageId are required', 'MISSING_PARAMS', 400, traceId);
  }

  // Sanitize path components to prevent directory traversal
  const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeStageId = stageId.replace(/[^a-zA-Z0-9_-]/g, '');

  const reportPath = join(OUTPUT_DIR, safeProjectId, safeStageId, 'report.json');

  try {
    const content = await readFile(reportPath, 'utf-8');
    const artifact = JSON.parse(content);
    return createSuccessResponse({ artifact }, traceId);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createSuccessResponse({ artifact: null }, traceId);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 'READ_ERROR', 500, traceId);
  }
}
