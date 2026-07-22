/**
 * Browser/Node compatible cryptographic primitives for one-time whispers.
 *
 * The URL fragment secret never belongs in an API request. It derives a KEK
 * which wraps a random content-encryption key (CEK); only the ciphertext and
 * wrapped CEK are persisted by the server.
 */

export const ONE_TIME_WHISPER_VERSION = 1 as const;
export const ONE_TIME_WHISPER_ALGORITHM = 'A256GCM-HKDF-SHA256' as const;
export const ALLOWED_TTL_SECONDS = [60 * 60, 24 * 60 * 60, 7 * 24 * 60 * 60] as const;

export type AllowedTtlSeconds = (typeof ALLOWED_TTL_SECONDS)[number];

export interface OneTimeWhisperEnvelope {
  version: typeof ONE_TIME_WHISPER_VERSION;
  algorithm: typeof ONE_TIME_WHISPER_ALGORITHM;
  id: string;
  ttlSeconds: AllowedTtlSeconds;
  signature: string;
  hkdfSalt: string;
  wrapIv: string;
  wrappedKey: string;
  contentIv: string;
  ciphertext: string;
}

export type OneTimeWhisperKeyEnvelope = Omit<
  OneTimeWhisperEnvelope,
  'contentIv' | 'ciphertext'
>;

export interface SealedWhisper {
  envelope: OneTimeWhisperEnvelope;
  fragmentSecret: string;
  consumeToken: string;
  consumeTokenHash: string;
  deleteToken: string;
  deleteTokenHash: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function webCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is unavailable in this environment');
  }
  return globalThis.crypto;
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  if (!value || !BASE64URL_RE.test(value)) {
    throw new Error('Invalid base64url value');
  }
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function randomBase64Url(byteLength = 32): string {
  if (!Number.isSafeInteger(byteLength) || byteLength < 16 || byteLength > 64) {
    throw new Error('Random identifiers must contain between 16 and 64 bytes');
  }
  return bytesToBase64Url(webCrypto().getRandomValues(new Uint8Array(byteLength)));
}

export function createWhisperId(): string {
  return randomBase64Url(16);
}

export function createFragmentSecret(): string {
  return randomBase64Url(32);
}

export function createDeleteToken(): string {
  return randomBase64Url(32);
}

export function createConsumeToken(): string {
  return randomBase64Url(32);
}

export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await webCrypto().subtle.digest('SHA-256', asBufferSource(encoder.encode(value)));
  return bytesToBase64Url(new Uint8Array(digest));
}

/** Stable, versioned AAD. Key insertion order is intentionally fixed. */
export function createEnvelopeAad(input: Pick<
  OneTimeWhisperEnvelope,
  'version' | 'algorithm' | 'id' | 'ttlSeconds' | 'signature'
>): Uint8Array {
  return encoder.encode(JSON.stringify({
    version: input.version,
    algorithm: input.algorithm,
    id: input.id,
    ttlSeconds: input.ttlSeconds,
    signature: input.signature,
  }));
}

function keyEnvelopeFrom(envelope: OneTimeWhisperEnvelope): OneTimeWhisperKeyEnvelope {
  const { contentIv: _contentIv, ciphertext: _ciphertext, ...keyEnvelope } = envelope;
  return keyEnvelope;
}

export function toKeyEnvelope(envelope: OneTimeWhisperEnvelope): OneTimeWhisperKeyEnvelope {
  return keyEnvelopeFrom(envelope);
}

async function deriveKek(
  fragmentSecret: string,
  salt: Uint8Array,
  id: string,
): Promise<CryptoKey> {
  const secretBytes = base64UrlToBytes(fragmentSecret);
  if (secretBytes.byteLength !== 32) {
    throw new Error('Invalid fragment secret length');
  }
  const keyMaterial = await webCrypto().subtle.importKey(
    'raw',
    asBufferSource(secretBytes),
    'HKDF',
    false,
    ['deriveKey'],
  );
  return webCrypto().subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: asBufferSource(salt),
      info: asBufferSource(encoder.encode(`snow-whisper:v1:kek:${id}`)),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function unwrapCek(
  envelope: OneTimeWhisperKeyEnvelope,
  fragmentSecret: string,
): Promise<Uint8Array> {
  const salt = base64UrlToBytes(envelope.hkdfSalt);
  const wrapIv = base64UrlToBytes(envelope.wrapIv);
  const wrappedKey = base64UrlToBytes(envelope.wrappedKey);
  if (salt.byteLength !== 16 || wrapIv.byteLength !== 12 || wrappedKey.byteLength !== 48) {
    throw new Error('Invalid key envelope');
  }
  const kek = await deriveKek(fragmentSecret, salt, envelope.id);
  const cek = await webCrypto().subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: asBufferSource(wrapIv),
      additionalData: asBufferSource(createEnvelopeAad(envelope)),
      tagLength: 128,
    },
    kek,
    asBufferSource(wrappedKey),
  );
  const cekBytes = new Uint8Array(cek);
  if (cekBytes.byteLength !== 32) {
    throw new Error('Invalid content key');
  }
  return cekBytes;
}

export async function sealOneTimeWhisper(input: {
  message: string;
  ttlSeconds: AllowedTtlSeconds;
  signature?: string;
  id?: string;
  fragmentSecret?: string;
  consumeToken?: string;
  deleteToken?: string;
}): Promise<SealedWhisper> {
  const { message, ttlSeconds } = input;
  const signature = input.signature ?? '';
  if (!ALLOWED_TTL_SECONDS.includes(ttlSeconds)) {
    throw new Error('TTL must be 1 hour, 24 hours, or 7 days');
  }
  if (!message || encoder.encode(message).byteLength > 4_096) {
    throw new Error('Message must contain between 1 and 4096 UTF-8 bytes');
  }
  if (encoder.encode(signature).byteLength > 256) {
    throw new Error('Signature must not exceed 256 UTF-8 bytes');
  }

  const id = input.id ?? createWhisperId();
  const fragmentSecret = input.fragmentSecret ?? createFragmentSecret();
  const consumeToken = input.consumeToken ?? createConsumeToken();
  const deleteToken = input.deleteToken ?? createDeleteToken();
  const cekBytes = webCrypto().getRandomValues(new Uint8Array(32));
  const hkdfSalt = webCrypto().getRandomValues(new Uint8Array(16));
  const wrapIv = webCrypto().getRandomValues(new Uint8Array(12));
  const contentIv = webCrypto().getRandomValues(new Uint8Array(12));
  const header = {
    version: ONE_TIME_WHISPER_VERSION,
    algorithm: ONE_TIME_WHISPER_ALGORITHM,
    id,
    ttlSeconds,
    signature,
  };
  const aad = createEnvelopeAad(header);

  const cek = await webCrypto().subtle.importKey(
    'raw',
    asBufferSource(cekBytes),
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const ciphertext = await webCrypto().subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: asBufferSource(contentIv),
      additionalData: asBufferSource(aad),
      tagLength: 128,
    },
    cek,
    asBufferSource(encoder.encode(message)),
  );

  const kek = await deriveKek(fragmentSecret, hkdfSalt, id);
  const wrappedKey = await webCrypto().subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: asBufferSource(wrapIv),
      additionalData: asBufferSource(aad),
      tagLength: 128,
    },
    kek,
    asBufferSource(cekBytes),
  );

  return {
    fragmentSecret,
    consumeToken,
    consumeTokenHash: await sha256Base64Url(consumeToken),
    deleteToken,
    deleteTokenHash: await sha256Base64Url(deleteToken),
    envelope: {
      ...header,
      hkdfSalt: bytesToBase64Url(hkdfSalt),
      wrapIv: bytesToBase64Url(wrapIv),
      wrappedKey: bytesToBase64Url(new Uint8Array(wrappedKey)),
      contentIv: bytesToBase64Url(contentIv),
      ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
    },
  };
}

/**
 * Non-consuming fragment check using only status metadata. No plaintext or
 * ciphertext is required, so a mistyped/tampered fragment does not burn mail.
 */
export async function verifyFragmentSecret(
  keyEnvelope: OneTimeWhisperKeyEnvelope,
  fragmentSecret: string,
): Promise<boolean> {
  try {
    await unwrapCek(keyEnvelope, fragmentSecret);
    return true;
  } catch {
    return false;
  }
}

export async function openOneTimeWhisper(
  envelope: OneTimeWhisperEnvelope,
  fragmentSecret: string,
): Promise<string> {
  if (
    envelope.version !== ONE_TIME_WHISPER_VERSION
    || envelope.algorithm !== ONE_TIME_WHISPER_ALGORITHM
  ) {
    throw new Error('Unsupported whisper envelope');
  }
  const cekBytes = await unwrapCek(keyEnvelopeFrom(envelope), fragmentSecret);
  const cek = await webCrypto().subtle.importKey(
    'raw',
    asBufferSource(cekBytes),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
  const contentIv = base64UrlToBytes(envelope.contentIv);
  if (contentIv.byteLength !== 12) {
    throw new Error('Invalid content IV');
  }
  const plaintext = await webCrypto().subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: asBufferSource(contentIv),
      additionalData: asBufferSource(createEnvelopeAad(envelope)),
      tagLength: 128,
    },
    cek,
    asBufferSource(base64UrlToBytes(envelope.ciphertext)),
  );
  return decoder.decode(plaintext);
}
