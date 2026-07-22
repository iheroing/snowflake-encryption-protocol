import { describe, expect, it } from 'vitest';
import { ONE_TIME_WHISPER_VERSION, createDeleteToken, sealOneTimeWhisper } from '../../protocol/oneTimeWhisper';
import type { WhisperStatus } from '../../api/_lib/contracts';
import { InMemorySnowStore } from '../../api/_lib/memoryStore';
import {
  consumeWhisper,
  createWhisper,
  deleteWhisper,
  getWhisperStatus,
} from '../../api/_lib/service';

async function createStoredWhisper(input: {
  message?: string;
  now?: () => number;
} = {}) {
  const sealed = await sealOneTimeWhisper({
    message: input.message ?? 'A one-time message.',
    ttlSeconds: 60 * 60,
    signature: 'test',
  });
  const store = new InMemorySnowStore(input.now);
  const createResult = await createWhisper(store, {
    version: ONE_TIME_WHISPER_VERSION,
    envelope: sealed.envelope,
    consumeTokenHash: sealed.consumeTokenHash,
    deleteTokenHash: sealed.deleteTokenHash,
  }, input.now);

  expect(createResult.status).toBe(201);
  return { sealed, store };
}

describe('one-time whisper service', () => {
  it('returns key metadata without consuming the stored ciphertext', async () => {
    const { sealed, store } = await createStoredWhisper();

    const statusResult = await getWhisperStatus(store, {
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
    });
    const consumeResult = await consumeWhisper(store, {
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
      consumeToken: sealed.consumeToken,
    });

    expect(statusResult.status).toBe(200);
    expect((statusResult.body as WhisperStatus).status).toBe('sealed');
    expect(consumeResult.status).toBe(200);
  });

  it('consumes a whisper exactly once under concurrent reads', async () => {
    const { sealed, store } = await createStoredWhisper();

    const results = await Promise.all(
      Array.from({ length: 25 }, () => consumeWhisper(store, {
        version: ONE_TIME_WHISPER_VERSION,
        id: sealed.envelope.id,
        consumeToken: sealed.consumeToken,
      })),
    );

    expect(results.filter((result) => result.status === 200)).toHaveLength(1);
    expect(results.filter((result) => result.status === 410)).toHaveLength(24);
  });

  it('does not consume when only the public id or a wrong capability is known', async () => {
    const { sealed, store } = await createStoredWhisper();

    const unauthorized = await consumeWhisper(store, {
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
      consumeToken: createDeleteToken(),
    });
    const authorized = await consumeWhisper(store, {
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
      consumeToken: sealed.consumeToken,
    });

    expect(unauthorized.status).toBe(410);
    expect(authorized.status).toBe(200);
  });

  it('reports an expired whisper as gone', async () => {
    let currentTime = 1_000;
    const { sealed, store } = await createStoredWhisper({
      now: () => currentTime,
    });
    currentTime += (60 * 60 * 1_000) + 1;

    const statusResult = await getWhisperStatus(store, {
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
    });

    expect(statusResult.status).toBe(200);
    expect((statusResult.body as WhisperStatus).status).toBe('gone');
  });

  it('rejects deletion when the delete token is wrong', async () => {
    const { sealed, store } = await createStoredWhisper();

    const deleteResult = await deleteWhisper(store, {
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
      deleteToken: createDeleteToken(),
    });

    expect(deleteResult.status).toBe(403);
  });

  it('deletes a whisper when the delete token matches', async () => {
    const { sealed, store } = await createStoredWhisper();

    const deleteResult = await deleteWhisper(store, {
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
      deleteToken: sealed.deleteToken,
    });

    expect(deleteResult.status).toBe(200);
    expect((deleteResult.body as { status: string }).status).toBe('deleted');
  });
});
