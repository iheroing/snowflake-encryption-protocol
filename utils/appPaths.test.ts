import { describe, expect, it } from 'vitest';
import { APP_BASE_PATH, isWhisperPath, withAppBase } from './appPaths';

describe('mounted application paths', () => {
  it('keeps all new routes under the snowflake mount', () => {
    expect(APP_BASE_PATH).toBe('/snowflake');
    expect(withAppBase()).toBe('/snowflake/');
    expect(withAppBase('/api/snow/create')).toBe('/snowflake/api/snow/create');
    expect(withAppBase('/ambience.mp3')).toBe('/snowflake/ambience.mp3');
    expect(withAppBase('s/example')).toBe('/snowflake/s/example');
  });

  it('accepts mounted recipient links and legacy standalone links', () => {
    const id = 'abcdefghijklmnopQRSTUV';
    expect(isWhisperPath(`/snowflake/s/${id}`)?.[1]).toBe(id);
    expect(isWhisperPath(`/s/${id}`)?.[1]).toBe(id);
    expect(isWhisperPath(`/snowflake/s/${id}/`)?.[1]).toBe(id);
    expect(isWhisperPath(`/other/s/${id}`)).toBeNull();
  });
});
