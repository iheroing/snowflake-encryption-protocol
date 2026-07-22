import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ONE_TIME_WHISPER_VERSION, sealOneTimeWhisper } from '../../protocol/oneTimeWhisper';
import { InMemorySnowStore } from '../../api/_lib/memoryStore';
import createHandler from '../../api/snow/create';
import statusHandler from '../../api/snow/status';
import consumeHandler from '../../api/snow/consume';

const mocked = vi.hoisted(() => ({
  store: null as InMemorySnowStore | null,
  throwStorageUnavailable: false,
}));

vi.mock('../../api/_lib/upstashStore', () => ({
  UpstashSnowStore: {
    fromEnvironment: () => {
      if (mocked.throwStorageUnavailable) {
        throw new Error('missing redis credentials');
      }
      if (!mocked.store) {
        mocked.store = new InMemorySnowStore();
      }
      return mocked.store;
    },
  },
}));

interface FakeResponse extends Partial<VercelResponse> {
  headers: Record<string, string | number | readonly string[]>;
  statusCodeValue?: number;
  jsonBody?: unknown;
}

function createResponse(): FakeResponse {
  const response: FakeResponse = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      return this as VercelResponse;
    },
    status(statusCode) {
      this.statusCodeValue = statusCode;
      return this as VercelResponse;
    },
    json(body) {
      this.jsonBody = body;
      return this as VercelResponse;
    },
  };
  return response;
}

function createRequest(input: {
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
}): VercelRequest {
  return {
    method: input.method,
    body: input.body,
    headers: {
      'x-forwarded-for': '203.0.113.10',
      'content-type': 'application/json',
      ...input.headers,
    },
    socket: { remoteAddress: '203.0.113.11' },
  } as unknown as VercelRequest;
}

async function makeCreateBody() {
  const sealed = await sealOneTimeWhisper({
    message: 'endpoint shape check',
    ttlSeconds: 60 * 60,
    signature: 'endpoint',
  });
  return {
    sealed,
    body: {
      version: ONE_TIME_WHISPER_VERSION,
      envelope: sealed.envelope,
      consumeTokenHash: sealed.consumeTokenHash,
      deleteTokenHash: sealed.deleteTokenHash,
    },
  };
}

describe('snow endpoint wrappers', () => {
  beforeEach(() => {
    vi.stubEnv('RATE_LIMIT_SALT', 'test-rate-limit-salt-that-is-long-enough');
    mocked.store = new InMemorySnowStore();
    mocked.throwStorageUnavailable = false;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects unsupported methods with an Allow header', async () => {
    const response = createResponse();

    await createHandler(createRequest({ method: 'GET' }), response as VercelResponse);

    expect(response.statusCodeValue).toBe(405);
    expect(response.headers.Allow).toBe('POST');
  });

  it('creates a whisper and sends no-store JSON headers', async () => {
    const { sealed, body } = await makeCreateBody();
    const response = createResponse();

    await createHandler(createRequest({ method: 'POST', body }), response as VercelResponse);

    expect(response.statusCodeValue).toBe(201);
    expect(response.headers['Cache-Control']).toBe('no-store');
    expect(response.headers['Content-Type']).toBe('application/json; charset=utf-8');
    expect(response.jsonBody).toMatchObject({
      version: ONE_TIME_WHISPER_VERSION,
      id: sealed.envelope.id,
    });
  });

  it('returns status metadata without content ciphertext', async () => {
    const { sealed, body } = await makeCreateBody();
    await createHandler(
      createRequest({ method: 'POST', body }),
      createResponse() as VercelResponse,
    );
    const response = createResponse();

    await statusHandler(
      createRequest({
        method: 'POST',
        body: {
          version: ONE_TIME_WHISPER_VERSION,
          id: sealed.envelope.id,
        },
      }),
      response as VercelResponse,
    );

    expect(response.statusCodeValue).toBe(200);
    expect(response.jsonBody).toMatchObject({
      version: ONE_TIME_WHISPER_VERSION,
      status: 'sealed',
      keyEnvelope: { id: sealed.envelope.id },
    });
    expect(JSON.stringify(response.jsonBody)).not.toContain('ciphertext');
    expect(JSON.stringify(response.jsonBody)).not.toContain('contentIv');
  });

  it('returns a consumed envelope with no-store headers', async () => {
    const { sealed, body } = await makeCreateBody();
    await createHandler(
      createRequest({ method: 'POST', body }),
      createResponse() as VercelResponse,
    );
    const response = createResponse();

    await consumeHandler(
      createRequest({
        method: 'POST',
        body: {
          version: ONE_TIME_WHISPER_VERSION,
          id: sealed.envelope.id,
          consumeToken: sealed.consumeToken,
        },
        headers: { 'x-snow-intent': 'reveal' },
      }),
      response as VercelResponse,
    );

    expect(response.statusCodeValue).toBe(200);
    expect(response.headers['Cache-Control']).toBe('no-store');
    expect(response.jsonBody).toMatchObject({
      version: ONE_TIME_WHISPER_VERSION,
      status: 'consumed',
      envelope: { id: sealed.envelope.id },
    });
  });

  it('rejects an id-only consume without burning the stored whisper', async () => {
    const { sealed, body } = await makeCreateBody();
    await createHandler(
      createRequest({ method: 'POST', body }),
      createResponse() as VercelResponse,
    );
    const unauthorizedResponse = createResponse();

    await consumeHandler(
      createRequest({
        method: 'POST',
        body: { version: ONE_TIME_WHISPER_VERSION, id: sealed.envelope.id },
        headers: { 'x-snow-intent': 'reveal' },
      }),
      unauthorizedResponse as VercelResponse,
    );
    const statusResponse = createResponse();
    await statusHandler(
      createRequest({
        method: 'POST',
        body: { version: ONE_TIME_WHISPER_VERSION, id: sealed.envelope.id },
      }),
      statusResponse as VercelResponse,
    );

    expect(unauthorizedResponse.statusCodeValue).toBe(400);
    expect(unauthorizedResponse.jsonBody).toMatchObject({
      error: { code: 'INVALID_CONSUME_TOKEN' },
    });
    expect(statusResponse.jsonBody).toMatchObject({ status: 'sealed' });
  });

  it('requires explicit reveal intent before touching a sealed whisper', async () => {
    const { sealed, body } = await makeCreateBody();
    await createHandler(
      createRequest({ method: 'POST', body }),
      createResponse() as VercelResponse,
    );
    const response = createResponse();

    await consumeHandler(
      createRequest({
        method: 'POST',
        body: {
          version: ONE_TIME_WHISPER_VERSION,
          id: sealed.envelope.id,
          consumeToken: sealed.consumeToken,
        },
      }),
      response as VercelResponse,
    );

    expect(response.statusCodeValue).toBe(400);
    expect(response.jsonBody).toMatchObject({ error: { code: 'MISSING_INTENT' } });
    await expect(mocked.store?.get(sealed.envelope.id)).resolves.not.toBeNull();
  });

  it('rejects cross-site API requests before storage work', async () => {
    const { body } = await makeCreateBody();
    const response = createResponse();

    await createHandler(
      createRequest({
        method: 'POST',
        body,
        headers: { 'sec-fetch-site': 'cross-site' },
      }),
      response as VercelResponse,
    );

    expect(response.statusCodeValue).toBe(403);
    expect(response.jsonBody).toMatchObject({ error: { code: 'CROSS_SITE_REQUEST' } });
  });

  it('rejects invalid JSON request bodies', async () => {
    const response = createResponse();

    await createHandler(
      createRequest({ method: 'POST', body: '{', headers: { 'content-length': '1' } }),
      response as VercelResponse,
    );

    expect(response.statusCodeValue).toBe(400);
    expect(response.jsonBody).toMatchObject({
      error: { code: 'INVALID_JSON' },
    });
  });

  it('rejects request bodies over eight KiB', async () => {
    const response = createResponse();

    await createHandler(
      createRequest({ method: 'POST', body: {}, headers: { 'content-length': '8193' } }),
      response as VercelResponse,
    );

    expect(response.statusCodeValue).toBe(413);
    expect(response.jsonBody).toMatchObject({
      error: { code: 'BODY_TOO_LARGE' },
    });
  });

  it('returns storage unavailable when the backing store cannot initialize', async () => {
    mocked.throwStorageUnavailable = true;
    const response = createResponse();

    await createHandler(
      createRequest({ method: 'POST', body: {} }),
      response as VercelResponse,
    );

    expect(response.statusCodeValue).toBe(503);
    expect(response.jsonBody).toMatchObject({
      error: { code: 'STORAGE_UNAVAILABLE' },
    });
  });
});
