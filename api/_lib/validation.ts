import type { VercelRequest } from '@vercel/node';
import {
  ALLOWED_TTL_SECONDS,
  ONE_TIME_WHISPER_ALGORITHM,
  ONE_TIME_WHISPER_VERSION,
  base64UrlToBytes,
  type OneTimeWhisperEnvelope,
} from '../../protocol/oneTimeWhisper.js';

export const MAX_REQUEST_BYTES = 8 * 1_024;
const encoder = new TextEncoder();
const ID_RE = /^[A-Za-z0-9_-]{22}$/;
const HASH_RE = /^[A-Za-z0-9_-]{43}$/;
const CONSISTENCY_TOKEN_RE = /^[\x21-\x7e]{1,1024}$/;

export class RequestValidationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message);
  }
}

function byteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

export function parseJsonBody(req: VercelRequest): unknown {
  const declaredLength = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new RequestValidationError('BODY_TOO_LARGE', 'Request body exceeds 8 KiB', 413);
  }
  let body: unknown = req.body;
  if (typeof body === 'string') {
    if (byteLength(body) > MAX_REQUEST_BYTES) {
      throw new RequestValidationError('BODY_TOO_LARGE', 'Request body exceeds 8 KiB', 413);
    }
    try {
      body = JSON.parse(body);
    } catch {
      throw new RequestValidationError('INVALID_JSON', 'Request body must be valid JSON');
    }
  } else if (body instanceof Uint8Array) {
    if (body.byteLength > MAX_REQUEST_BYTES) {
      throw new RequestValidationError('BODY_TOO_LARGE', 'Request body exceeds 8 KiB', 413);
    }
    try {
      body = JSON.parse(new TextDecoder().decode(body));
    } catch {
      throw new RequestValidationError('INVALID_JSON', 'Request body must be valid JSON');
    }
  }
  if (!isRecord(body)) {
    throw new RequestValidationError('INVALID_BODY', 'Request body must be a JSON object');
  }
  if (byteLength(JSON.stringify(body)) > MAX_REQUEST_BYTES) {
    throw new RequestValidationError('BODY_TOO_LARGE', 'Request body exceeds 8 KiB', 413);
  }
  return body;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requireVersion(value: unknown): asserts value is 1 {
  if (value !== ONE_TIME_WHISPER_VERSION) {
    throw new RequestValidationError('UNSUPPORTED_VERSION', 'Only protocol version 1 is supported');
  }
}

export function requireId(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !ID_RE.test(value)) {
    throw new RequestValidationError('INVALID_ID', 'Invalid whisper id');
  }
}

export function requireDeleteToken(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !HASH_RE.test(value)) {
    throw new RequestValidationError('INVALID_DELETE_TOKEN', 'Invalid delete token');
  }
}

export function requireConsumeToken(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !HASH_RE.test(value)) {
    throw new RequestValidationError('INVALID_CONSUME_TOKEN', 'Invalid consume token');
  }
}

export function optionalConsistencyToken(value: unknown): asserts value is string | undefined {
  if (value !== undefined && (typeof value !== 'string' || !CONSISTENCY_TOKEN_RE.test(value))) {
    throw new RequestValidationError('INVALID_CONSISTENCY_TOKEN', 'Invalid consistency token');
  }
}

function hasEncodedBytes(value: unknown, expectedBytes: number): value is string {
  if (typeof value !== 'string') return false;
  try {
    return base64UrlToBytes(value).byteLength === expectedBytes;
  } catch {
    return false;
  }
}

export function requireEnvelope(value: unknown): asserts value is OneTimeWhisperEnvelope {
  if (!isRecord(value)) {
    throw new RequestValidationError('INVALID_ENVELOPE', 'Envelope must be an object');
  }
  requireVersion(value.version);
  requireId(value.id);
  if (value.algorithm !== ONE_TIME_WHISPER_ALGORITHM) {
    throw new RequestValidationError('INVALID_ENVELOPE', 'Unsupported encryption algorithm');
  }
  if (
    typeof value.ttlSeconds !== 'number'
    || !ALLOWED_TTL_SECONDS.includes(value.ttlSeconds as (typeof ALLOWED_TTL_SECONDS)[number])
  ) {
    throw new RequestValidationError('INVALID_TTL', 'TTL must be 1 hour, 24 hours, or 7 days');
  }
  if (typeof value.signature !== 'string' || byteLength(value.signature) > 256) {
    throw new RequestValidationError('INVALID_SIGNATURE', 'Signature exceeds 256 UTF-8 bytes');
  }
  if (
    !hasEncodedBytes(value.hkdfSalt, 16)
    || !hasEncodedBytes(value.wrapIv, 12)
    || !hasEncodedBytes(value.wrappedKey, 48)
    || !hasEncodedBytes(value.contentIv, 12)
    || typeof value.ciphertext !== 'string'
  ) {
    throw new RequestValidationError('INVALID_ENVELOPE', 'Envelope contains invalid fields');
  }
  try {
    const ciphertextLength = base64UrlToBytes(value.ciphertext).byteLength;
    if (ciphertextLength < 17 || ciphertextLength > 4_112) {
      throw new Error('invalid length');
    }
  } catch {
    throw new RequestValidationError('INVALID_ENVELOPE', 'Ciphertext has an invalid size');
  }
}

export function requireDeleteTokenHash(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !HASH_RE.test(value)) {
    throw new RequestValidationError('INVALID_DELETE_TOKEN_HASH', 'Invalid delete token hash');
  }
}

export function requireConsumeTokenHash(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !HASH_RE.test(value)) {
    throw new RequestValidationError('INVALID_CONSUME_TOKEN_HASH', 'Invalid consume token hash');
  }
}
