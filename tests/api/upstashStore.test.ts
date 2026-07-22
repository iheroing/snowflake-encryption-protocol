import { describe, expect, it } from 'vitest';
import { storageCredentialsFromEnvironment } from '../../api/_lib/upstashStore';

describe('Upstash storage environment', () => {
  it('uses the Vercel Marketplace variable names', () => {
    expect(storageCredentialsFromEnvironment({
      KV_REST_API_URL: 'https://marketplace.example',
      KV_REST_API_TOKEN: 'marketplace-token',
    })).toEqual({
      url: 'https://marketplace.example',
      token: 'marketplace-token',
    });
  });

  it('keeps direct Upstash variables as an explicit override', () => {
    expect(storageCredentialsFromEnvironment({
      KV_REST_API_URL: 'https://marketplace.example',
      KV_REST_API_TOKEN: 'marketplace-token',
      UPSTASH_REDIS_REST_URL: 'https://direct.example',
      UPSTASH_REDIS_REST_TOKEN: 'direct-token',
    })).toEqual({
      url: 'https://direct.example',
      token: 'direct-token',
    });
  });

  it('fails closed when either credential is missing', () => {
    expect(() => storageCredentialsFromEnvironment({
      KV_REST_API_URL: 'https://marketplace.example',
    })).toThrow('Snow storage is not configured');
  });
});
