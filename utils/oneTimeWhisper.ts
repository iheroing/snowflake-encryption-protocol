import {
  ONE_TIME_WHISPER_VERSION,
  openOneTimeWhisper,
  sealOneTimeWhisper,
  verifyFragmentSecret,
  type AllowedTtlSeconds,
  type OneTimeWhisperEnvelope,
} from '../protocol/oneTimeWhisper';
import type { WhisperStatus } from '../api/_lib/contracts';
import { APP_BASE_PATH, withAppBase } from './appPaths';

interface ApiErrorResponse {
  error?: { code?: string; message?: string };
}

export class OneTimeWhisperApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** The destructive request may have reached storage, so retry safety is unknown. */
export class OneTimeWhisperConsumeUncertainError extends Error {
  constructor() {
    super('The consume outcome could not be confirmed');
  }
}

async function postJson<T>(path: string, body: unknown, intent?: 'reveal' | 'revoke'): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (intent) headers['X-Snow-Intent'] = intent;
  const response = await fetch(withAppBase(path), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  let payload: T & ApiErrorResponse;
  try {
    payload = await response.json() as T & ApiErrorResponse;
  } catch {
    throw new OneTimeWhisperApiError(
      response.ok ? 'INVALID_RESPONSE' : 'REQUEST_FAILED',
      'Whisper service returned an unreadable response',
      response.status,
    );
  }
  if (!response.ok) {
    throw new OneTimeWhisperApiError(
      payload.error?.code ?? 'REQUEST_FAILED',
      payload.error?.message ?? 'Whisper request failed',
      response.status,
    );
  }
  return payload;
}

function appBaseUrl(explicit?: string): string {
  const value = explicit ?? (typeof window !== 'undefined' ? window.location.origin : '');
  if (!value) throw new Error('baseUrl is required outside a browser');
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  url.pathname = APP_BASE_PATH;
  return url.toString().replace(/\/$/u, '');
}

export async function createOneTimeWhisper(input: {
  message: string;
  ttlSeconds: AllowedTtlSeconds;
  signature?: string;
  baseUrl?: string;
}): Promise<{
  shareUrl: string;
  id: string;
  deleteToken: string;
  expiresAt: number;
  envelope: OneTimeWhisperEnvelope;
}> {
  const sealed = await sealOneTimeWhisper(input);
  const response = await postJson<{
    id: string;
    expiresAt: number;
    consistencyToken?: string;
  }>('/api/snow/create', {
    version: ONE_TIME_WHISPER_VERSION,
    envelope: sealed.envelope,
    consumeTokenHash: sealed.consumeTokenHash,
    deleteTokenHash: sealed.deleteTokenHash,
  });
  const baseUrl = appBaseUrl(input.baseUrl);
  return {
    id: response.id,
    expiresAt: response.expiresAt,
    deleteToken: sealed.deleteToken,
    envelope: sealed.envelope,
    shareUrl: `${baseUrl}/s/${encodeURIComponent(response.id)}#${new URLSearchParams({
      k: sealed.fragmentSecret,
      c: sealed.consumeToken,
      ...(response.consistencyToken ? { r: response.consistencyToken } : {}),
    }).toString()}`,
  };
}

export async function getWhisperStatus(
  id: string,
  consistencyToken?: string,
): Promise<WhisperStatus> {
  return postJson<WhisperStatus>('/api/snow/status', {
    version: ONE_TIME_WHISPER_VERSION,
    id,
    ...(consistencyToken ? { consistencyToken } : {}),
  });
}

export async function consumeOneTimeWhisper(
  id: string,
  fragmentSecret: string,
  consumeToken: string,
  consistencyToken?: string,
): Promise<{ message: string; signature: string; expiresAt: number }> {
  // Preflight unwraps the CEK before the destructive API request. A bad URL
  // fragment therefore fails locally and leaves the server record untouched.
  const status = await getWhisperStatus(id, consistencyToken);
  if (status.status === 'gone') {
    throw new OneTimeWhisperApiError('WHISPER_GONE', 'Whisper is no longer available', 410);
  }
  if (!await verifyFragmentSecret(status.keyEnvelope, fragmentSecret)) {
    throw new OneTimeWhisperApiError('INVALID_FRAGMENT_SECRET', 'Whisper link is invalid', 400);
  }

  let consumed: { expiresAt: number; envelope: OneTimeWhisperEnvelope };
  try {
    consumed = await postJson<{
      expiresAt: number;
      envelope: OneTimeWhisperEnvelope;
    }>('/api/snow/consume', {
      version: ONE_TIME_WHISPER_VERSION,
      id,
      consumeToken,
      ...(status.consistencyToken ? { consistencyToken: status.consistencyToken } : {}),
    }, 'reveal');
  } catch (caught) {
    if (
      caught instanceof OneTimeWhisperApiError
      && ['WHISPER_GONE', 'INVALID_CONSUME_TOKEN', 'RATE_LIMITED'].includes(caught.code)
    ) {
      throw caught;
    }
    throw new OneTimeWhisperConsumeUncertainError();
  }

  let message: string;
  try {
    message = await openOneTimeWhisper(consumed.envelope, fragmentSecret);
  } catch {
    throw new OneTimeWhisperConsumeUncertainError();
  }
  return {
    message,
    signature: consumed.envelope.signature,
    expiresAt: consumed.expiresAt,
  };
}

export async function deleteOneTimeWhisper(id: string, deleteToken: string): Promise<'deleted' | 'gone'> {
  const response = await postJson<{ status: 'deleted' | 'gone' }>('/api/snow/delete', {
    version: ONE_TIME_WHISPER_VERSION,
    id,
    deleteToken,
  }, 'revoke');
  return response.status;
}

export function fragmentSecretFromLocation(locationValue = window.location.href): string | null {
  const url = new URL(locationValue);
  return new URLSearchParams(url.hash.slice(1)).get('k');
}

export function consumeTokenFromLocation(locationValue = window.location.href): string | null {
  const url = new URL(locationValue);
  return new URLSearchParams(url.hash.slice(1)).get('c');
}

export function consistencyTokenFromLocation(locationValue = window.location.href): string | null {
  const url = new URL(locationValue);
  return new URLSearchParams(url.hash.slice(1)).get('r');
}

export type { AllowedTtlSeconds, OneTimeWhisperEnvelope, WhisperStatus };
