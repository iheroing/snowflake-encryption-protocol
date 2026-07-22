import { Redis } from '@upstash/redis';
import type { SnowStore, StoredWhisper } from './contracts.js';

const DELETE_IF_TOKEN_MATCHES = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local ok, value = pcall(cjson.decode, raw)
if not ok or value.deleteTokenHash ~= ARGV[1] then return -1 end
redis.call('DEL', KEYS[1])
return 1
`;

const CONSUME_IF_TOKEN_MATCHES = `
local raw = redis.call('GET', KEYS[1])
if not raw then return nil end
local ok, value = pcall(cjson.decode, raw)
if not ok then return nil end
if tonumber(value.expiresAt) <= tonumber(ARGV[2]) then
  redis.call('DEL', KEYS[1])
  return nil
end
if value.consumeTokenHash ~= ARGV[1] then return nil end
redis.call('DEL', KEYS[1])
return raw
`;

const RATE_LIMIT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
return {count, ttl}
`;

export class UpstashSnowStore implements SnowStore {
  constructor(private readonly redis: Redis) {}

  static fromEnvironment(): UpstashSnowStore {
    const { url, token } = storageCredentialsFromEnvironment();
    return new UpstashSnowStore(new Redis({
      url,
      token,
      readYourWrites: true,
      // A destructive EVAL must never be transparently retried after an
      // ambiguous network failure. `retries: 0` means one HTTP attempt.
      retry: { retries: 0 },
    }));
  }

  private whisperKey(id: string): string {
    return `snow:v1:${id}`;
  }

  setConsistencyToken(token: string | undefined): void {
    this.redis.readYourWritesSyncToken = token;
  }

  consistencyToken(): string | undefined {
    return this.redis.readYourWritesSyncToken || undefined;
  }

  async putIfAbsent(id: string, value: StoredWhisper, expiresAt: number): Promise<boolean> {
    // Absolute expiry avoids extending retention when a write is delayed.
    const result = await this.redis.set(this.whisperKey(id), value, {
      pxat: expiresAt,
      nx: true,
    });
    return result === 'OK';
  }

  async get(id: string): Promise<StoredWhisper | null> {
    return this.redis.get<StoredWhisper>(this.whisperKey(id));
  }

  async consumeIfTokenHash(
    id: string,
    expectedHash: string,
    nowMs: number,
  ): Promise<StoredWhisper | null> {
    // The verifier comparison and deletion share one Lua execution, preserving
    // exactly-one-consumer semantics without revealing the decryption key.
    const raw = await this.redis.eval<[string, number], StoredWhisper | string | null>(
      CONSUME_IF_TOKEN_MATCHES,
      [this.whisperKey(id)],
      [expectedHash, nowMs],
    );
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) as StoredWhisper : raw;
  }

  async deleteIfTokenHash(
    id: string,
    expectedHash: string,
  ): Promise<'deleted' | 'gone' | 'forbidden'> {
    const result = await this.redis.eval<[string], number>(
      DELETE_IF_TOKEN_MATCHES,
      [this.whisperKey(id)],
      [expectedHash],
    );
    if (result === 1) return 'deleted';
    if (result === 0) return 'gone';
    return 'forbidden';
  }

  async takeRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    retryAfterSeconds: number;
  }> {
    const [count, ttl] = await this.redis.eval<[number], [number, number]>(
      RATE_LIMIT,
      [`snow:rate:${key}`],
      [windowSeconds],
    );
    return {
      allowed: count <= limit,
      retryAfterSeconds: Math.max(1, ttl),
    };
  }
}

export function storageCredentialsFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): { url: string; token: string } {
  const url = environment.UPSTASH_REDIS_REST_URL || environment.KV_REST_API_URL;
  const token = environment.UPSTASH_REDIS_REST_TOKEN || environment.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('Snow storage is not configured');
  }
  return { url, token };
}
