import type { BeforeSend } from '@vercel/analytics/react';

const ALLOWED_CAMPAIGN_PARAMETERS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
]);

const WHISPER_PATH_PATTERN = /^\/(snowflake\/)?s\/[^/]+\/?$/u;

/**
 * Redacts one-time snowflake identifiers and browser-only secrets before a
 * page view is sent to Vercel Web Analytics.
 */
export function sanitizeAnalyticsUrl(value: string): string | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  url.username = '';
  url.password = '';
  url.hash = '';

  const whisperPath = url.pathname.match(WHISPER_PATH_PATTERN);
  if (whisperPath) {
    url.pathname = whisperPath[1]
      ? '/snowflake/s/[snowflake]'
      : '/s/[snowflake]';
    url.search = '';
    return url.toString();
  }

  const campaignParameters = new URLSearchParams();
  url.searchParams.forEach((parameterValue, parameterName) => {
    if (ALLOWED_CAMPAIGN_PARAMETERS.has(parameterName)) {
      campaignParameters.append(parameterName, parameterValue);
    }
  });
  url.search = campaignParameters.toString();

  return url.toString();
}

export const redactAnalyticsEvent: BeforeSend = (event) => {
  const url = sanitizeAnalyticsUrl(event.url);
  return url ? { ...event, url } : null;
};
