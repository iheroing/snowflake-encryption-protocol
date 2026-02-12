import { decrypt, encrypt, generateRandomPassword } from './encryption';
import { hashString } from './snowflakeGenerator';

const SHARE_PARAM_KEY = 's';
const SHARE_KEY_HASH_PARAM = 'k';
const SHARE_VERSION = 2;

interface SharePayloadV1 {
  v: number;
  m: string;
  sig: string;
  ts: number;
  id: string;
  c: string;
}

interface SharePayloadV2 {
  v: number;
  ct: string;
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

function computeChecksumV1(payload: Omit<SharePayloadV1, 'c'>): string {
  const checksumSeed = `${payload.v}|${payload.m}|${payload.sig}|${payload.ts}|${payload.id}`;
  return hashString(checksumSeed).toString(36);
}

function computeChecksumV2(payload: Omit<SharePayloadV2, 'c'>): string {
  const checksumSeed = `${payload.v}|${payload.ct}|${payload.sig}|${payload.ts}|${payload.id}`;
  return hashString(checksumSeed).toString(36);
}

function buildShareKey(): string {
  return generateRandomPassword().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

function readShareKeyFromHash(url: URL): string | null {
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const key = params.get(SHARE_KEY_HASH_PARAM);
  if (!key || key.length < 10 || key.length > 128) {
    return null;
  }
  return key;
}

export function createSnowflakeSignature(): string {
  return `sg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getSnowflakeId(signature: string): string {
  const numeric = hashString(`snowflake::${signature}`);
  return `SN-${numeric.toString(36).toUpperCase().padStart(7, '0').slice(-7)}`;
}

export async function buildShareUrl(
  message: string,
  signature: string,
  timestamp: number = Date.now(),
  baseUrl: string = window.location.href
): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Empty message can not be shared');
  }
  if (trimmed.length > 500) {
    throw new Error('Message is too long to share');
  }

  const shareKey = buildShareKey();
  const ciphertext = await encrypt(trimmed, shareKey);

  const url = new URL(baseUrl);
  url.hash = '';
  url.search = '';

  const payloadBase: Omit<SharePayloadV2, 'c'> = {
    v: SHARE_VERSION,
    ct: ciphertext,
    sig: signature,
    ts: timestamp,
    id: getSnowflakeId(signature)
  };

  const payload: SharePayloadV2 = {
    ...payloadBase,
    c: computeChecksumV2(payloadBase)
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  url.searchParams.set(SHARE_PARAM_KEY, encodedPayload);

  const hashParams = new URLSearchParams();
  hashParams.set(SHARE_KEY_HASH_PARAM, shareKey);
  url.hash = hashParams.toString();

  return url.toString();
}

function parseLegacyPayload(parsed: SharePayloadV1): ParsedSharePayload | null {
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

  const expectedChecksum = computeChecksumV1({
    v: parsed.v,
    m: parsed.m,
    sig: parsed.sig,
    ts: parsed.ts,
    id: parsed.id
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
    snowflakeId: parsed.id
  };
}

export async function parseShareUrl(urlValue: string = window.location.href): Promise<ParsedSharePayload | null> {
  try {
    const url = new URL(urlValue);
    const token = url.searchParams.get(SHARE_PARAM_KEY);
    if (!token) {
      return null;
    }

    const parsed = JSON.parse(fromBase64Url(token)) as SharePayloadV1 | SharePayloadV2;
    if (!parsed || typeof parsed.v !== 'number') {
      return null;
    }

    // Backward compatibility with early plaintext links.
    if (parsed.v === 1) {
      return parseLegacyPayload(parsed as SharePayloadV1);
    }

    if (parsed.v !== SHARE_VERSION) {
      return null;
    }

    const payload = parsed as SharePayloadV2;

    if (
      typeof payload.ct !== 'string' ||
      typeof payload.sig !== 'string' ||
      typeof payload.ts !== 'number' ||
      typeof payload.id !== 'string' ||
      typeof payload.c !== 'string'
    ) {
      return null;
    }

    const expectedChecksum = computeChecksumV2({
      v: payload.v,
      ct: payload.ct,
      sig: payload.sig,
      ts: payload.ts,
      id: payload.id
    });

    if (expectedChecksum !== payload.c) {
      return null;
    }

    if (getSnowflakeId(payload.sig) !== payload.id) {
      return null;
    }

    const shareKey = readShareKeyFromHash(url);
    if (!shareKey) {
      return null;
    }

    const message = await decrypt(payload.ct, shareKey);
    if (!message.trim() || message.length > 500) {
      return null;
    }

    return {
      message,
      signature: payload.sig,
      timestamp: payload.ts,
      snowflakeId: payload.id
    };
  } catch {
    return null;
  }
}

export function removeShareParamFromUrl(urlValue: string = window.location.href): string {
  const url = new URL(urlValue);
  url.searchParams.delete(SHARE_PARAM_KEY);

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.delete(SHARE_KEY_HASH_PARAM);
    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : '';
  }

  return url.toString();
}
