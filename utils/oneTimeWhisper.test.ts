import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ONE_TIME_WHISPER_VERSION, sealOneTimeWhisper, toKeyEnvelope } from '../protocol/oneTimeWhisper';
import {
  OneTimeWhisperApiError,
  OneTimeWhisperConsumeUncertainError,
  consumeTokenFromLocation,
  consistencyTokenFromLocation,
  consumeOneTimeWhisper,
  createOneTimeWhisper,
  deleteOneTimeWhisper,
  fragmentSecretFromLocation,
  getWhisperStatus,
} from './oneTimeWhisper';

const WHISPER_ID = 'abcdefghijklmnopQRSTUV';

function okJson(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe('one-time whisper client utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts the fragment secret from a share URL hash', () => {
    expect(fragmentSecretFromLocation(
      `https://example.test/s/${WHISPER_ID}#k=fragment-secret`,
    )).toBe('fragment-secret');
  });

  it('returns null when a share URL has no fragment secret', () => {
    expect(fragmentSecretFromLocation(
      `https://example.test/s/${WHISPER_ID}`,
    )).toBeNull();
  });

  it('extracts the independent consume capability from the hash', () => {
    expect(consumeTokenFromLocation(
      `https://example.test/s/${WHISPER_ID}#k=fragment-secret&c=consume-capability`,
    )).toBe('consume-capability');
  });

  it('extracts the optional cross-request consistency token from the hash', () => {
    expect(consistencyTokenFromLocation(
      `https://example.test/s/${WHISPER_ID}#k=fragment-secret&c=consume-capability&r=sync-token-1`,
    )).toBe('sync-token-1');
  });

  it('creates a whisper through the create API and returns a fragment-only share URL', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(okJson({
      id: WHISPER_ID,
      expiresAt: 12_345,
    }));

    const result = await createOneTimeWhisper({
      message: 'client create',
      ttlSeconds: 60 * 60,
      signature: 'client',
      baseUrl: 'https://snow.example/',
    });

    expect(result.shareUrl).toMatch(new RegExp(
      `^https://snow\\.example/snowflake/s/${WHISPER_ID}#k=[A-Za-z0-9_-]+&c=[A-Za-z0-9_-]+$`,
    ));
    expect(fetchMock).toHaveBeenCalledWith('/snowflake/api/snow/create', expect.objectContaining({
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    }));
    const createBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(createBody.consumeTokenHash).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(createBody).not.toHaveProperty('consumeToken');
  });

  it('requests whisper status with a POST body', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(okJson({
      version: ONE_TIME_WHISPER_VERSION,
      status: 'gone',
      reason: 'missing_or_expired',
    }));

    await getWhisperStatus(WHISPER_ID);

    const [, options] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe('/snowflake/api/snow/status');
    expect(JSON.parse(String(options?.body))).toEqual({
      version: ONE_TIME_WHISPER_VERSION,
      id: WHISPER_ID,
    });
  });

  it('carries the create consistency checkpoint only in the share fragment', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(okJson({
      id: WHISPER_ID,
      expiresAt: 12_345,
      consistencyToken: 'sync-token-1',
    }));

    const result = await createOneTimeWhisper({
      message: 'consistent create',
      ttlSeconds: 60 * 60,
      baseUrl: 'https://snow.example',
    });

    expect(result.shareUrl).toMatch(/#k=[A-Za-z0-9_-]+&c=[A-Za-z0-9_-]+&r=sync-token-1$/u);
    expect(new URL(result.shareUrl).search).toBe('');
  });

  it('consumes and decrypts a whisper after status verifies the fragment', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'client consume',
      ttlSeconds: 60 * 60,
      signature: 'sender',
      id: WHISPER_ID,
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(okJson({
        version: ONE_TIME_WHISPER_VERSION,
        status: 'sealed',
        expiresAt: 55_000,
        keyEnvelope: toKeyEnvelope(sealed.envelope),
        consistencyToken: 'sync-after-status',
      }))
      .mockResolvedValueOnce(okJson({
        version: ONE_TIME_WHISPER_VERSION,
        status: 'consumed',
        expiresAt: 55_000,
        envelope: sealed.envelope,
      }));

    const result = await consumeOneTimeWhisper(
      WHISPER_ID,
      sealed.fragmentSecret,
      sealed.consumeToken,
    );

    expect(result).toEqual({
      message: 'client consume',
      signature: 'sender',
      expiresAt: 55_000,
    });
    const consumeBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(consumeBody).toMatchObject({
      id: WHISPER_ID,
      consumeToken: sealed.consumeToken,
      consistencyToken: 'sync-after-status',
    });
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      'X-Snow-Intent': 'reveal',
    });
  });

  it('does not call consume when the fragment secret is invalid', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'wrong fragment must not burn',
      ttlSeconds: 60 * 60,
      id: WHISPER_ID,
    });
    const other = await sealOneTimeWhisper({
      message: 'different secret',
      ttlSeconds: 60 * 60,
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(okJson({
      version: ONE_TIME_WHISPER_VERSION,
      status: 'sealed',
      expiresAt: 55_000,
      keyEnvelope: toKeyEnvelope(sealed.envelope),
    }));

    await expect(consumeOneTimeWhisper(
      WHISPER_ID,
      other.fragmentSecret,
      sealed.consumeToken,
    )).rejects.toBeInstanceOf(OneTimeWhisperApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports an unknown outcome when the destructive response is lost', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'response may be lost',
      ttlSeconds: 60 * 60,
      id: WHISPER_ID,
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(okJson({
        version: ONE_TIME_WHISPER_VERSION,
        status: 'sealed',
        expiresAt: 55_000,
        keyEnvelope: toKeyEnvelope(sealed.envelope),
      }))
      .mockRejectedValueOnce(new TypeError('connection reset'));

    await expect(consumeOneTimeWhisper(
      WHISPER_ID,
      sealed.fragmentSecret,
      sealed.consumeToken,
    )).rejects.toBeInstanceOf(OneTimeWhisperConsumeUncertainError);
  });

  it('preserves a gone revoke outcome and sends explicit intent', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(okJson({ version: 1, status: 'gone' }));

    await expect(deleteOneTimeWhisper(
      WHISPER_ID,
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    )).resolves.toBe('gone');
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      'X-Snow-Intent': 'revoke',
    });
  });
});
