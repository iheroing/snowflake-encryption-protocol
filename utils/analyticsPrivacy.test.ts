import { describe, expect, it } from 'vitest';
import {
  redactAnalyticsEvent,
  sanitizeAnalyticsUrl,
} from './analyticsPrivacy';

describe('Vercel Web Analytics privacy redaction', () => {
  it('keeps only the campaign fields needed to understand where visits came from', () => {
    expect(
      sanitizeAnalyticsUrl(
        'https://liyi.online/snowflake/?utm_source=xiaohongshu&utm_medium=card&utm_campaign=first-snow&token=private#draft',
      ),
    ).toBe(
      'https://liyi.online/snowflake/?utm_source=xiaohongshu&utm_medium=card&utm_campaign=first-snow',
    );
  });

  it('replaces a mounted snowflake URL with an anonymous route template', () => {
    const id = 'dE9ZJYwKLh4pV2cQ7nX1_A';
    const sanitized = sanitizeAnalyticsUrl(
      `https://liyi.online/snowflake/s/${id}?utm_source=wechat#k=local-secret&c=consume-secret`,
    );

    expect(sanitized).toBe(
      'https://liyi.online/snowflake/s/[snowflake]',
    );
    expect(sanitized).not.toContain(id);
    expect(sanitized).not.toContain('local-secret');
    expect(sanitized).not.toContain('consume-secret');
  });

  it('also anonymizes legacy snowflake links', () => {
    expect(
      sanitizeAnalyticsUrl(
        'https://snow.example/s/dE9ZJYwKLh4pV2cQ7nX1_A#k=secret',
      ),
    ).toBe('https://snow.example/s/[snowflake]');
  });

  it('drops an event entirely when its URL cannot be parsed safely', () => {
    expect(
      redactAnalyticsEvent({ type: 'pageview', url: 'not a valid URL' }),
    ).toBeNull();
  });
});
