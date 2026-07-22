import {
  ONE_TIME_WHISPER_VERSION,
  sha256Base64Url,
  toKeyEnvelope,
} from '../../protocol/oneTimeWhisper.js';
import type {
  ApiErrorBody,
  ApiResult,
  SnowStore,
  StoredWhisper,
  WhisperStatus,
} from './contracts.js';
import {
  isRecord,
  optionalConsistencyToken,
  RequestValidationError,
  requireConsumeToken,
  requireConsumeTokenHash,
  requireDeleteToken,
  requireDeleteTokenHash,
  requireEnvelope,
  requireId,
  requireVersion,
} from './validation.js';

function error(status: number, code: string, message: string): ApiResult<ApiErrorBody> {
  return {
    status,
    body: { version: ONE_TIME_WHISPER_VERSION, error: { code, message } },
  };
}

export function validationErrorResult(reason: unknown): ApiResult<ApiErrorBody> {
  if (reason instanceof RequestValidationError) {
    return error(reason.httpStatus, reason.code, reason.message);
  }
  return error(500, 'INTERNAL_ERROR', 'The request could not be completed');
}

function requireBody(body: unknown): asserts body is Record<string, unknown> {
  if (!isRecord(body)) {
    throw new RequestValidationError('INVALID_BODY', 'Request body must be an object');
  }
}

export async function createWhisper(
  store: SnowStore,
  body: unknown,
  now = Date.now,
): Promise<ApiResult> {
  requireBody(body);
  requireVersion(body.version);
  requireEnvelope(body.envelope);
  requireConsumeTokenHash(body.consumeTokenHash);
  requireDeleteTokenHash(body.deleteTokenHash);

  const expiresAt = now() + body.envelope.ttlSeconds * 1_000;
  const record: StoredWhisper = {
    version: ONE_TIME_WHISPER_VERSION,
    envelope: body.envelope,
    consumeTokenHash: body.consumeTokenHash,
    deleteTokenHash: body.deleteTokenHash,
    expiresAt,
  };
  const created = await store.putIfAbsent(
    body.envelope.id,
    record,
    expiresAt,
  );
  if (!created) {
    return error(409, 'ID_CONFLICT', 'Whisper id already exists');
  }
  return {
    status: 201,
    body: {
      version: ONE_TIME_WHISPER_VERSION,
      id: body.envelope.id,
      expiresAt,
      consistencyToken: store.consistencyToken(),
    },
  };
}

export async function getWhisperStatus(
  store: SnowStore,
  body: unknown,
  now = Date.now,
): Promise<ApiResult<WhisperStatus>> {
  requireBody(body);
  requireVersion(body.version);
  requireId(body.id);
  optionalConsistencyToken(body.consistencyToken);
  store.setConsistencyToken(body.consistencyToken);
  const record = await store.get(body.id);
  if (!record || record.expiresAt <= now()) {
    return {
      status: 200,
      body: {
        version: ONE_TIME_WHISPER_VERSION,
        status: 'gone',
        reason: 'missing_or_expired',
        consistencyToken: store.consistencyToken(),
      },
    };
  }
  return {
    status: 200,
    body: {
      version: ONE_TIME_WHISPER_VERSION,
      status: 'sealed',
      expiresAt: record.expiresAt,
      keyEnvelope: toKeyEnvelope(record.envelope),
      consistencyToken: store.consistencyToken(),
    },
  };
}

export async function consumeWhisper(
  store: SnowStore,
  body: unknown,
  now = Date.now,
): Promise<ApiResult> {
  requireBody(body);
  requireVersion(body.version);
  requireId(body.id);
  requireConsumeToken(body.consumeToken);
  optionalConsistencyToken(body.consistencyToken);
  store.setConsistencyToken(body.consistencyToken);
  const consumeTokenHash = await sha256Base64Url(body.consumeToken);
  const record = await store.consumeIfTokenHash(body.id, consumeTokenHash, now());
  if (!record) {
    return error(410, 'WHISPER_GONE', 'Whisper is missing, expired, or already consumed');
  }
  return {
    status: 200,
    body: {
      version: ONE_TIME_WHISPER_VERSION,
      status: 'consumed',
      expiresAt: record.expiresAt,
      envelope: record.envelope,
    },
    headers: { 'Cache-Control': 'no-store' },
  };
}

export async function deleteWhisper(store: SnowStore, body: unknown): Promise<ApiResult> {
  requireBody(body);
  requireVersion(body.version);
  requireId(body.id);
  requireDeleteToken(body.deleteToken);
  const tokenHash = await sha256Base64Url(body.deleteToken);
  const outcome = await store.deleteIfTokenHash(body.id, tokenHash);
  if (outcome === 'forbidden') {
    return error(403, 'INVALID_DELETE_TOKEN', 'Delete token is invalid');
  }
  return {
    status: 200,
    body: {
      version: ONE_TIME_WHISPER_VERSION,
      status: outcome,
    },
  };
}

export function methodNotAllowed(allowed: string[]): ApiResult<ApiErrorBody> {
  return {
    ...error(405, 'METHOD_NOT_ALLOWED', 'HTTP method is not allowed'),
    headers: { Allow: allowed.join(', ') },
  };
}

export function rateLimited(retryAfterSeconds: number): ApiResult<ApiErrorBody> {
  return {
    ...error(429, 'RATE_LIMITED', 'Too many requests'),
    headers: { 'Retry-After': String(retryAfterSeconds) },
  };
}

export function serviceUnavailable(): ApiResult<ApiErrorBody> {
  return error(503, 'STORAGE_UNAVAILABLE', 'Whisper storage is temporarily unavailable');
}
