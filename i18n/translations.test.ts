import { describe, expect, it } from 'vitest';
import { translations } from './translations';

describe('Chinese experience copy', () => {
  it('explains the reveal moment without exposing protocol jargon', () => {
    const receive = translations.zh.receive as {
      description: string;
      consumeDisclosure: string;
    };

    expect(receive.description).toBe('当你揭开它，这封雪信便从云端消散，只在此刻，落进你的眼前。');
    expect(receive.description).not.toMatch(/原子|服务端|密文|解密/u);
    expect(receive.consumeDisclosure).toContain('仍可能被截图留住');
  });

  it('keeps every visible line poetic and free from protocol jargon', () => {
    const flatten = (value: unknown): string[] => {
      if (typeof value === 'string') return [value];
      if (!value || typeof value !== 'object') return [];
      return Object.values(value).flatMap(flatten);
    };

    const chineseCopy = flatten(translations.zh).join('\n');
    const englishCopy = flatten(translations.en).join('\n');

    expect(chineseCopy).not.toMatch(/原子|密文|服务端|解密/u);
    expect(englishCopy).not.toMatch(/atomically|ciphertext|server record|fractal engine/iu);
    expect(`${chineseCopy}\n${englishCopy}`).not.toMatch(/[—–]/u);
    expect(`${chineseCopy}\n${englishCopy}`).not.toMatch(/·\s*0[12]/u);
  });
});
