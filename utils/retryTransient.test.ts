import { describe, expect, it, vi } from 'vitest';
import { retryTransient } from './retryTransient';

describe('retryTransient', () => {
  it('silently recovers from a brief request interruption', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new TypeError('network interrupted'))
      .mockResolvedValue({ status: 'sealed' });
    const pause = vi.fn().mockResolvedValue(undefined);

    await expect(retryTransient(operation, [0, 450, 1_200], pause)).resolves.toEqual({ status: 'sealed' });
    expect(operation).toHaveBeenCalledTimes(2);
    expect(pause).toHaveBeenCalledWith(450);
  });

  it('surfaces the final failure after all attempts', async () => {
    const failure = new TypeError('still offline');
    const operation = vi.fn().mockRejectedValue(failure);
    const pause = vi.fn().mockResolvedValue(undefined);

    await expect(retryTransient(operation, [0, 10, 20], pause)).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
