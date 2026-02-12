import { hashString } from './snowflakeGenerator';

const SHARE_PARAM_KEY = 's';
const SHARE_VERSION = 1;

interface SharePayloadV1 {
  v: number;
  m: string;
  sig: string;
  ts: number;
  id: string;
  c: string;
}

export interface ParsedSharePayload {
  message: string;
  signature: string;
  timestamp: number;
  snowflakeId: string;
}

function toBase64Url(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

function computeChecksum(payload: Omit<SharePayloadV1, 'c'>): string {
  const checksumSeed = `${payload.v}|${payload.m}|${payload.sig}|${payload.ts}|${payload.id}`;
  return hashString(checksumSeed).toString(36);
}

export function createSnowflakeSignature(): string {
  return `sg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getSnowflakeId(signature: string): string {
  const numeric = hashString(`snowflake::${signature}`);
  return `SN-${numeric.toString(36).toUpperCase().padStart(7, '0').slice(-7)}`;
}

export function buildShareUrl(
  message: string,
  signature: string,
  timestamp: number = Date.now(),
  baseUrl: string = window.location.href
): string {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Empty message can not be shared');
  }
  if (trimmed.length > 500) {
    throw new Error('Message is too long to share');
  }

  const url = new URL(baseUrl);
  url.hash = '';
  url.search = '';

  const payloadBase = {
    v: SHARE_VERSION,
    m: trimmed,
    sig: signature,
    ts: timestamp,
    id: getSnowflakeId(signature),
  };

  const payload: SharePayloadV1 = {
    ...payloadBase,
    c: computeChecksum(payloadBase),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  url.searchParams.set(SHARE_PARAM_KEY, encodedPayload);
  return url.toString();
}

export function parseShareUrl(urlValue: string = window.location.href): ParsedSharePayload | null {
  try {
    const url = new URL(urlValue);
    const token = url.searchParams.get(SHARE_PARAM_KEY);
    if (!token) {
      return null;
    }

    const parsed = JSON.parse(fromBase64Url(token)) as SharePayloadV1;
    if (!parsed || parsed.v !== SHARE_VERSION) {
      return null;
    }

    if (
      typeof parsed.m !== 'string' ||
      typeof parsed.sig !== 'string' ||
      typeof parsed.ts !== 'number' ||
      typeof parsed.id !== 'string' ||
      typeof parsed.c !== 'string'
    ) {
      return null;
    }
    if (!parsed.m.trim() || parsed.m.length > 500) {
      return null;
    }

    const expectedChecksum = computeChecksum({
      v: parsed.v,
      m: parsed.m,
      sig: parsed.sig,
      ts: parsed.ts,
      id: parsed.id,
    });

    if (expectedChecksum !== parsed.c) {
      return null;
    }

    if (getSnowflakeId(parsed.sig) !== parsed.id) {
      return null;
    }

    return {
      message: parsed.m,
      signature: parsed.sig,
      timestamp: parsed.ts,
      snowflakeId: parsed.id,
    };
  } catch {
    return null;
  }
}

export function removeShareParamFromUrl(urlValue: string = window.location.href): string {
  const url = new URL(urlValue);
  url.searchParams.delete(SHARE_PARAM_KEY);
  return url.toString();
}
