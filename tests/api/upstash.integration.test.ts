import { describe, expect, it } from 'vitest';
import { sealOneTimeWhisper } from '../../protocol/oneTimeWhisper';
import { createWhisper, consumeWhisper, getWhisperStatus } from '../../api/_lib/service';
import { UpstashSnowStore } from '../../api/_lib/upstashStore';

const enabled = process.env.RUN_UPSTASH_INTEGRATION === '1';
const integration = enabled ? describe : describe.skip;

integration('Upstash storage contract', () => {
  it('propagates a create checkpoint across clients and consumes once under concurrency', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'real redis integration',
      ttlSeconds: 60 * 60,
      signature: 'upstash-contract',
    });
    const createStore = UpstashSnowStore.fromEnvironment();
    const created = await createWhisper(createStore, {
      version: 1,
      envelope: sealed.envelope,
      consumeTokenHash: sealed.consumeTokenHash,
      deleteTokenHash: sealed.deleteTokenHash,
    });
    expect(created.status).toBe(201);
    const consistencyToken = (created.body as { consistencyToken?: string }).consistencyToken;
    expect(consistencyToken).toBeTruthy();

    const status = await getWhisperStatus(UpstashSnowStore.fromEnvironment(), {
      version: 1,
      id: sealed.envelope.id,
      consistencyToken,
    });
    expect(status.body).toMatchObject({ status: 'sealed' });
    const refreshedToken = status.body.consistencyToken ?? consistencyToken;

    const wrong = await consumeWhisper(UpstashSnowStore.fromEnvironment(), {
      version: 1,
      id: sealed.envelope.id,
      consumeToken: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      consistencyToken: refreshedToken,
    });
    expect(wrong.status).toBe(410);

    const attempts = await Promise.all(Array.from({ length: 25 }, () => (
      consumeWhisper(UpstashSnowStore.fromEnvironment(), {
        version: 1,
        id: sealed.envelope.id,
        consumeToken: sealed.consumeToken,
        consistencyToken: refreshedToken,
      })
    )));
    expect(attempts.filter((result) => result.status === 200)).toHaveLength(1);
    expect(attempts.filter((result) => result.status === 410)).toHaveLength(24);
  }, 30_000);

  it('uses an absolute Redis expiry', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'short integration fixture',
      ttlSeconds: 60 * 60,
    });
    const store = UpstashSnowStore.fromEnvironment();
    const expiresAt = Date.now() + 1_500;
    await expect(store.putIfAbsent(sealed.envelope.id, {
      version: 1,
      envelope: sealed.envelope,
      consumeTokenHash: sealed.consumeTokenHash,
      deleteTokenHash: sealed.deleteTokenHash,
      expiresAt,
    }, expiresAt)).resolves.toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 2_100));
    await expect(store.get(sealed.envelope.id)).resolves.toBeNull();
  }, 10_000);
});
