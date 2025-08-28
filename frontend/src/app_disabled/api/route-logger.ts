import type { NextRequest } from 'next/server';
import { logger } from '../../utils/pino-logger';

// Helper: attempt to extract userUuid from cookies or from an authToken JWT payload
function extractUserUuid(req?: NextRequest): string | undefined {
  try {
    const cookieUser = req?.cookies?.get?.('userUuid')?.value;
    if (cookieUser) return cookieUser;

    const authToken = req?.cookies?.get?.('authToken')?.value || req?.headers?.get('authorization')?.split?.(' ')[1];
    if (!authToken) return undefined;

    // If token looks like JWT, decode payload (no verification) and read common fields
    if (authToken.split && authToken.split('.').length === 3) {
      const payloadB64 = authToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      // Buffer is available in Node (Next.js server runtime)
      const json = Buffer.from(payloadB64, 'base64').toString('utf8');
      const payload = JSON.parse(json || '{}');
      return payload.userUuid || payload.user_uuid || payload.sub || payload.uid;
    }

    return undefined;
  } catch (e) {
    // Do not fail request logging for any decode issue
    return undefined;
  }
}

// Variadic wrapper for Next.js Route handlers to attach request-scoped logs
// Accepts handlers with any signature (e.g., (req), (req, ctx)) and forwards args.
export function withRouteLogging(handler: (...args: any[]) => Promise<Response | any>) {
  return async function (...args: any[]) {
    try {
      const req = args[0] as NextRequest | undefined;
      const requestId = req?.headers?.get?.('x-request-id') || `req-${Date.now()}`;
      const path = req?.url || req?.nextUrl?.pathname || 'unknown';
      const user_uuid = extractUserUuid(req);
      logger.info({ request_id: requestId, path, user_uuid }, 'incoming request');
      const res = await handler(...args);
      logger.info({ request_id: requestId, path, user_uuid, status: (res as any)?.status || 200 }, 'request handled');
      return res;
    } catch (err) {
      const req = args[0] as NextRequest | undefined;
      const requestId = req?.headers?.get?.('x-request-id') || `req-${Date.now()}`;
      const path = req?.url || req?.nextUrl?.pathname || 'unknown';
      const user_uuid = extractUserUuid(req);
      logger.error({ err, request_id: requestId, path, user_uuid }, 'request handler error');
      throw err;
    }
  };
}
