import type {
  OneTimeWhisperEnvelope,
  OneTimeWhisperKeyEnvelope,
} from '../../protocol/oneTimeWhisper.js';

export interface StoredWhisper {
  version: 1;
  envelope: OneTimeWhisperEnvelope;
  consumeTokenHash: string;
  deleteTokenHash: string;
  expiresAt: number;
}

export interface SnowStore {
  setConsistencyToken(token: string | undefined): void;
  consistencyToken(): string | undefined;
  putIfAbsent(id: string, value: StoredWhisper, expiresAt: number): Promise<boolean>;
  get(id: string): Promise<StoredWhisper | null>;
  consumeIfTokenHash(id: string, expectedHash: string, nowMs: number): Promise<StoredWhisper | null>;
  deleteIfTokenHash(id: string, expectedHash: string): Promise<'deleted' | 'gone' | 'forbidden'>;
  takeRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    retryAfterSeconds: number;
  }>;
}

export interface SealedStatus {
  version: 1;
  status: 'sealed';
  expiresAt: number;
  keyEnvelope: OneTimeWhisperKeyEnvelope;
  consistencyToken?: string;
}

export interface GoneStatus {
  version: 1;
  status: 'gone';
  reason: 'missing_or_expired';
  consistencyToken?: string;
}

export type WhisperStatus = SealedStatus | GoneStatus;

export interface ApiResult<T = unknown> {
  status: number;
  body: T;
  headers?: Record<string, string>;
}

export interface ApiErrorBody {
  version: 1;
  error: {
    code: string;
    message: string;
  };
}
