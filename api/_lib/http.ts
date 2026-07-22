import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { sha256Base64Url } from '../../protocol/oneTimeWhisper.js';
import type { ApiResult, SnowStore } from './contracts.js';
import { rateLimited, serviceUnavailable, validationErrorResult } from './service.js';
import { UpstashSnowStore } from './upstashStore.js';
import { parseJsonBody, RequestValidationError } from './validation.js';

interface EndpointOptions {
  route: 'create' | 'status' | 'consume' | 'delete';
  limit: number;
  windowSeconds: number;
  requiredIntent?: 'reveal' | 'revoke';
  handler: (store: SnowStore, body: unknown) => Promise<ApiResult>;
}

function requestIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  const realIp = req.headers['x-real-ip'];
  return first || (Array.isArray(realIp) ? realIp[0] : realIp) || req.socket.remoteAddress || 'unknown';
}

async function anonymousRateKey(req: VercelRequest, route: string): Promise<string> {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt || salt.length < 32) {
    throw new Error('RATE_LIMIT_SALT is not configured');
  }
  return `${route}:${await sha256Base64Url(`${salt}:${requestIp(req)}`)}`;
}

function validateRequestMetadata(req: VercelRequest, requiredIntent?: 'reveal' | 'revoke'): void {
  const contentType = req.headers['content-type'];
  const normalizedContentType = (Array.isArray(contentType) ? contentType[0] : contentType) ?? '';
  if (!normalizedContentType.toLowerCase().startsWith('application/json')) {
    throw new RequestValidationError('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json', 415);
  }

  const fetchSite = req.headers['sec-fetch-site'];
  const normalizedFetchSite = Array.isArray(fetchSite) ? fetchSite[0] : fetchSite;
  if (normalizedFetchSite === 'cross-site') {
    throw new RequestValidationError('CROSS_SITE_REQUEST', 'Cross-site requests are not allowed', 403);
  }

  if (requiredIntent) {
    const intent = req.headers['x-snow-intent'];
    const normalizedIntent = Array.isArray(intent) ? intent[0] : intent;
    if (normalizedIntent !== requiredIntent) {
      throw new RequestValidationError('MISSING_INTENT', 'Explicit destructive intent is required');
    }
  }
}

function send(res: VercelResponse, result: ApiResult, requestId: string): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Request-Id', requestId);
  for (const [name, value] of Object.entries(result.headers ?? {})) {
    res.setHeader(name, value);
  }
  res.status(result.status).json(result.body);
}

/** Vercel adapter; deliberately does not log request bodies, tokens, or fragments. */
export async function runJsonEndpoint(
  req: VercelRequest,
  res: VercelResponse,
  options: EndpointOptions,
): Promise<void> {
  const requestId = randomUUID();
  const startedAt = Date.now();
  try {
    validateRequestMetadata(req, options.requiredIntent);
    const body = parseJsonBody(req);
    const store = UpstashSnowStore.fromEnvironment();
    const rate = await store.takeRateLimit(
      await anonymousRateKey(req, options.route),
      options.limit,
      options.windowSeconds,
    );
    if (!rate.allowed) {
      send(res, rateLimited(rate.retryAfterSeconds), requestId);
      return;
    }
    send(res, await options.handler(store, body), requestId);
  } catch (reason) {
    const validation = validationErrorResult(reason);
    const result = validation.status === 500 ? serviceUnavailable() : validation;
    if (result.status >= 500) {
      // Do not log bodies, IDs, URLs, tokens, IPs, or error messages.
      console.error(JSON.stringify({
        event: 'snow_api_failure',
        requestId,
        route: options.route,
        durationMs: Date.now() - startedAt,
        errorType: reason instanceof Error ? reason.constructor.name : typeof reason,
      }));
    }
    send(res, result, requestId);
  }
}
