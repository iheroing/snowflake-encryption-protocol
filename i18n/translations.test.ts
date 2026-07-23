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
});
