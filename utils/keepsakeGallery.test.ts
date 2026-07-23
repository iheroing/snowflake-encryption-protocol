import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearKeepsakes,
  collectKeepsake,
  getKeepsakes,
  hasKeepsake,
  removeKeepsake,
} from './keepsakeGallery';

describe('keepsake gallery', () => {
  beforeEach(() => {
    clearKeepsakes();
    vi.restoreAllMocks();
  });

  it('stores only a visual signature and non-message metadata', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_721_600_000_000);
    const item = collectKeepsake('sg_abcdefghijklmnopqrstuvwxyz123456', 'received');

    expect(item).toMatchObject({
      version: 1,
      signature: 'sg_abcdefghijklmnopqrstuvwxyz123456',
      origin: 'received',
      collectedAt: 1_721_600_000_000,
    });
    expect(JSON.stringify(item)).not.toContain('message');
    expect(JSON.stringify(item)).not.toContain('key');
  });

  it('deduplicates the same visual fingerprint', () => {
    const signature = 'sg_abcdefghijklmnopqrstuvwxyz123456';
    collectKeepsake(signature, 'sent');
    collectKeepsake(signature, 'received');
    expect(getKeepsakes()).toHaveLength(1);
    expect(hasKeepsake(signature)).toBe(true);
  });

  it('removes an individual keepsake without touching others', () => {
    const first = 'sg_abcdefghijklmnopqrstuvwxyz123456';
    const second = 'sg_123456abcdefghijklmnopqrstuvwxyz';
    collectKeepsake(first, 'sent');
    collectKeepsake(second, 'received');
    removeKeepsake(first);
    expect(getKeepsakes().map((item) => item.signature)).toEqual([second]);
  });
});
