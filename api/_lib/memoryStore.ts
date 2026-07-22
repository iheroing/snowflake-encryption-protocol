import type { SnowStore, StoredWhisper } from './contracts.js';

interface MemoryEntry {
  value: StoredWhisper;
  expiresAt: number;
}

/** Deterministic in-memory adapter for unit tests and local service tests. */
export class InMemorySnowStore implements SnowStore {
  private readonly whispers = new Map<string, MemoryEntry>();
  private readonly rateLimits = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  setConsistencyToken(_token: string | undefined): void {}

  consistencyToken(): string | undefined {
    return undefined;
  }

  private liveEntry(id: string): MemoryEntry | null {
    const entry = this.whispers.get(id);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.whispers.delete(id);
      return null;
    }
    return entry;
  }

  async putIfAbsent(id: string, value: StoredWhisper, expiresAt: number): Promise<boolean> {
    if (this.liveEntry(id)) return false;
    this.whispers.set(id, {
      value: structuredClone(value),
      expiresAt,
    });
    return true;
  }

  async get(id: string): Promise<StoredWhisper | null> {
    const entry = this.liveEntry(id);
    return entry ? structuredClone(entry.value) : null;
  }

  async consumeIfTokenHash(
    id: string,
    expectedHash: string,
    nowMs: number,
  ): Promise<StoredWhisper | null> {
    const entry = this.liveEntry(id);
    if (!entry || entry.value.expiresAt <= nowMs || entry.value.consumeTokenHash !== expectedHash) {
      return null;
    }
    this.whispers.delete(id);
    return structuredClone(entry.value);
  }

  async deleteIfTokenHash(
    id: string,
    expectedHash: string,
  ): Promise<'deleted' | 'gone' | 'forbidden'> {
    const entry = this.liveEntry(id);
    if (!entry) return 'gone';
    if (entry.value.deleteTokenHash !== expectedHash) return 'forbidden';
    this.whispers.delete(id);
    return 'deleted';
  }

  async takeRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    retryAfterSeconds: number;
  }> {
    const now = this.now();
    let bucket = this.rateLimits.get(key);
    if (!bucket || bucket.expiresAt <= now) {
      bucket = { count: 0, expiresAt: now + windowSeconds * 1_000 };
      this.rateLimits.set(key, bucket);
    }
    bucket.count += 1;
    return {
      allowed: bucket.count <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt - now) / 1_000)),
    };
  }
}
