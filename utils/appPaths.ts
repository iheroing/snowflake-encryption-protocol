export const APP_BASE_PATH = '/snowflake';

export function withAppBase(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized === '/' ? `${APP_BASE_PATH}/` : `${APP_BASE_PATH}${normalized}`;
}

export function isWhisperPath(pathname: string): RegExpMatchArray | null {
  return pathname.match(/^\/(?:snowflake\/)?s\/([A-Za-z0-9_-]{22})\/?$/u);
}
