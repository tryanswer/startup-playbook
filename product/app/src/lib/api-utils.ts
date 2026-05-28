import { NextResponse } from 'next/server';

/**
 * Generate a unique trace ID for request tracking
 * Format: sp-{timestamp}-{random}
 */
export function generateTraceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `sp-${timestamp}-${random}`;
}

/**
 * Create a structured error response with trace ID
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number,
  traceId: string
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code,
      traceId,
    },
    {
      status,
      headers: {
        'x-trace-id': traceId,
      },
    }
  );
}

/**
 * Create a structured success response with trace ID
 */
export function createSuccessResponse<T>(data: T, traceId: string): NextResponse {
  return NextResponse.json(
    {
      ...data,
      traceId,
    },
    {
      headers: {
        'x-trace-id': traceId,
      },
    }
  );
}

/**
 * Validate request body size
 * @param body - The request body to validate
 * @param maxSize - Maximum allowed size in bytes (default: 1MB)
 * @returns true if valid, throws error if invalid
 */
export function validateRequestBody(body: unknown, maxSize: number = 1024 * 1024): boolean {
  const bodyString = JSON.stringify(body);
  const bodySize = Buffer.byteLength(bodyString, 'utf-8');
  
  if (bodySize > maxSize) {
    throw new Error(`Request body too large: ${bodySize} bytes (max: ${maxSize} bytes)`);
  }
  
  return true;
}
